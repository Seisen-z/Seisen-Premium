import { bearer, trackstatEntries, cookieName, cookieOptions, readKeys, keyPattern } from '@/lib/server/trackstat-accounts';
import { NextRequest, NextResponse } from 'next/server';
import { trackstatMedia, trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import type { TrackstatAccount,TrackstatHistory, TrackstatPublic } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const maxAccounts = 10;
const headers = { 'Cache-Control': 'private, no-store' };
function writeKeys(response: NextResponse, keys: string[]) {
  if (keys.length) response.cookies.set(cookieName, keys.join(','), cookieOptions);
  else response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
}
const isInvalid = (error: unknown) => error instanceof Error && error.message === 'Invalid connection key';

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:read:${getClientIp(req)}`, 60, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const [totals, totalsStealAnEgg, { entries: valid, dropped }] = await Promise.all([
      trackstatRPC<TrackstatPublic>('trackstat_public').catch(() => null),
      trackstatRPC<TrackstatPublic>('trackstats_stealanegg_public').catch(() => null),
      trackstatEntries(req),
    ]);
    const accounts: TrackstatAccount[] = valid.map(({ history }, index) => ({
      ...history, index,
      activeGames: history.activeGames ?? [],
    }));
    const response = NextResponse.json({ public: totals, publicStealAnEgg: totalsStealAnEgg, accounts, media: await trackstatMedia(accounts.map(a => a.account.roblox_id)), reconnect: dropped }, { headers });
    if (dropped) writeKeys(response, valid.flatMap(v => v.keys));
    return response;
  } catch {
    return NextResponse.json({ error: 'Trackstat is temporarily unavailable. Try refreshing shortly.' }, { status: 503, headers });
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:connect:${getClientIp(req)}`, 10, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const body = await req.text();
    if (body.length > 256) return NextResponse.json({ error: 'Invalid connection key' }, { status: 400, headers });
    const key = JSON.parse(body).key;
    if (typeof key !== 'string' || !keyPattern.test(key)) return NextResponse.json({ error: 'Paste the connection key copied from the library.' }, { status: 400, headers });
    const connected = await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    const token = bearer(req);
    const current = await trackstatEntries(req);
    const same = current.entries.findIndex(e => e.history.account.roblox_id === connected.account.roblox_id);
    if (current.entries.length >= maxAccounts && same < 0) return NextResponse.json({ error: 'You can connect up to 10 accounts.' }, { status: 400, headers });
    if (token) await trackstatRPC('trackstat_user_account_save', { p_key: key }, token);
    // Keys that were reset are dropped; every other connected key stays, even for the same Roblox account on another device
    const others = current.entries.flatMap(entry => entry.keys).filter(other => other !== key);
    if (others.length >= maxAccounts) return NextResponse.json({ error: `You can connect up to ${maxAccounts} accounts. Remove one first.` }, { status: 400, headers });
    const response = NextResponse.json({ connected: true, index: same < 0 ? current.entries.filter(entry => entry.keys.length).length : same }, { headers });
    writeKeys(response, [...others, key]);
    return response;
  } catch (error) {
    const invalid = error instanceof SyntaxError || isInvalid(error);
    return NextResponse.json({ error: invalid ? 'This key is invalid or was reset. Copy the current key from the library.' : 'Trackstat is temporarily unavailable.' }, { status: invalid ? 400 : 503, headers });
  }
}

// Body { index } removes one account; no body removes them all
export async function DELETE(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const text = await req.text();
  const response = NextResponse.json({ connected: false }, { headers });
  let index: unknown;
  try { index = text ? JSON.parse(text).index : undefined; } catch { return new NextResponse(null, { status: 400 }); }
  try {
    const { entries, token } = await trackstatEntries(req);
    if (index !== undefined && (!Number.isInteger(index) || Number(index) < 0 || Number(index) >= entries.length)) return NextResponse.json({ error: 'Invalid account.' }, { status: 400, headers });
    const removed = index === undefined ? entries : [entries[Number(index)]];
    if (token) for (const id of removed.flatMap(entry => entry.ids)) await trackstatRPC('trackstat_user_account_remove', { p_account: id }, token);
    writeKeys(response, readKeys(req).filter(key => !removed.some(e => e.keys.includes(key))));
    return response;
  } catch { return NextResponse.json({ error: 'Account could not be removed.' }, { status: 503, headers }); }
}
