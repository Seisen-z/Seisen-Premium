import { NextRequest, NextResponse } from 'next/server';
import { trackstatMedia, trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import type { LinkRequest, TrackstatAccount, TrackstatHistory, TrackstatPublic } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const cookieName = 'seisen_trackstat';
const maxAccounts = 10;
const keyPattern = /^sp_[a-f0-9]{64}$/;
const headers = { 'Cache-Control': 'private, no-store' };
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/trackstat', maxAge: 60 * 60 * 24 * 30 };

// The cookie holds every connected account's key, comma separated (a single plain key from before still works).
const readKeys = (req: NextRequest) => [...new Set((req.cookies.get(cookieName)?.value ?? '').split(',').filter(key => keyPattern.test(key)))].slice(0, maxAccounts);
function writeKeys(response: NextResponse, keys: string[]) {
  if (keys.length) response.cookies.set(cookieName, keys.join(','), cookieOptions);
  else response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
}
const isInvalid = (error: unknown) => error instanceof Error && error.message === 'Invalid connection key';

// Looks every key up; keys that were reset are reported as dropped, any other failure aborts.
async function lookup(keys: string[]) {
  const results = await Promise.allSettled(keys.map(key => trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key })));
  const valid: { key: string; history: TrackstatHistory }[] = [];
  let dropped = false;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') valid.push({ key: keys[i], history: result.value });
    else if (isInvalid(result.reason)) dropped = true;
    else throw result.reason;
  });
  return { valid, dropped };
}

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:read:${getClientIp(req)}`, 60, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const [totals, totalsStealAnEgg, { valid, dropped }] = await Promise.all([
      trackstatRPC<TrackstatPublic>('trackstat_public'),
      trackstatRPC<TrackstatPublic>('trackstats_stealanegg_public'),
      lookup(readKeys(req)),
    ]);
    const pending = await Promise.all(valid.map(({ key }) => trackstatRPC<LinkRequest[]>('trackstat_link_pending', { p_key: key }).catch(() => [] as LinkRequest[])));
    const now = Date.now();
    const accounts: TrackstatAccount[] = valid.map(({ history }, index) => ({
      ...history, index, pending: pending[index],
      activeGames: [...new Set(history.sessions.filter(s => now - new Date(s.updated_at).getTime() < 120000).map(s => s.game_id))],
    }));
    const response = NextResponse.json({ public: totals, publicStealAnEgg: totalsStealAnEgg, accounts, media: await trackstatMedia(accounts.map(a => a.account.roblox_id)), reconnect: dropped }, { headers });
    if (dropped) writeKeys(response, valid.map(v => v.key));
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
    await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    // Keys that were reset are dropped; every other connected key stays, even for the same Roblox account on another device
    const others = (await lookup(readKeys(req).filter(existing => existing !== key))).valid;
    if (others.length >= maxAccounts) return NextResponse.json({ error: `You can connect up to ${maxAccounts} accounts. Remove one first.` }, { status: 400, headers });
    const response = NextResponse.json({ connected: true, index: others.length }, { headers });
    writeKeys(response, [...others.map(v => v.key), key]);
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
  writeKeys(response, Number.isInteger(index) ? readKeys(req).filter((_, i) => i !== index) : []);
  return response;
}
