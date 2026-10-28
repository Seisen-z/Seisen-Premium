import { bearer, trackstatEntries, cookieName, cookieOptions, readKeys, keyPattern, maxKeys, markSeen, forgetSeen } from '@/lib/server/trackstat-accounts';
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
    void markSeen(readKeys(req));
    // A short fingerprint of everything shown (plus a 30 minute step for the community totals); an unchanged page downloads nothing
    const fingerprint = trackstatRPC<string>('trackstat_version', { p_keys: readKeys(req) }, bearer(req)).then(version => `"v3-tap-${version}-${Math.floor(Date.now() / 1800000)}"`).catch(() => null);
    const known = req.headers.get('if-none-match');
    if (known && await fingerprint === known) return new NextResponse(null, { status: 304, headers: { ...headers, ETag: known } });
    const [totals, totalsTapSimulator, totalsAnimeDice, { entries: valid, dropped, failed, degraded }] = await Promise.all([
      trackstatRPC<TrackstatPublic>('trackstat_public').catch(() => null),
      trackstatRPC<TrackstatPublic>('trackstats_tapsimulator_public').catch(() => null),
      trackstatRPC<TrackstatPublic>('trackstats_animedice_public').catch(() => null),
      trackstatEntries(req),
    ]);
    // Nothing loaded at all is an outage, not an empty account list
    if (degraded && !valid.length) throw new Error('Trackstat unavailable');
    const accounts: TrackstatAccount[] = valid.map(({ history }, index) => ({
      ...history, index,
      activeGames: history.activeGames ?? [],
    }));
    const media = await trackstatMedia(accounts.map(a => a.account.roblox_id));
    const etag = degraded || dropped ? null : await fingerprint;
    const response = NextResponse.json({ public: totals, publicTapSimulator: totalsTapSimulator, publicAnimeDice: totalsAnimeDice, accounts, media, reconnect: dropped, degraded }, { headers: etag ? { ...headers, ETag: etag } : headers });
    if (dropped) writeKeys(response, [...valid.flatMap(v => v.keys), ...failed]);
    return response;
  } catch (error) {
    console.error('trackstat read failed:', error instanceof Error ? error.message : error);
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
    const token = bearer(req);
    const claim = await trackstatRPC<{ claimed: boolean; mine: boolean }>('trackstat_key_claim', { p_key: key }, token);
    if (claim.claimed && !claim.mine) return NextResponse.json({ error: 'This key is linked to an email account. Sign in with that email to use it.' }, { status: 403, headers });
    const connected = await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    await markSeen([key]);
    const current = await trackstatEntries(req);
    const same = current.entries.findIndex(e => e.history.account.roblox_id === connected.account.roblox_id);
    if (current.entries.length >= maxAccounts && same < 0) return NextResponse.json({ error: 'You can connect up to 10 accounts.' }, { status: 400, headers });
    if (token) await trackstatRPC('trackstat_user_account_save', { p_key: key }, token);
    // A new key replaces reset markers for this Roblox account; other device keys stay.
    const others = [...current.entries.flatMap(entry => entry.history.connectionStatus === 'reset' && entry.history.account.roblox_id === connected.account.roblox_id ? [] : entry.keys), ...current.failed].filter(other => other !== key);
    if (others.length >= maxKeys) return NextResponse.json({ error: `You can connect up to ${maxKeys} keys. Remove an account first.` }, { status: 400, headers });
    const response = NextResponse.json({ connected: true, index: same < 0 ? current.entries.filter(entry => entry.keys.length).length : same }, { headers });
    writeKeys(response, [...others, key]);
    return response;
  } catch (error) {
    const invalid = error instanceof SyntaxError || isInvalid(error);
    return NextResponse.json({ error: invalid ? 'This key is invalid or was reset. Copy the current key from the library.' : 'Trackstat is temporarily unavailable.' }, { status: invalid ? 400 : 503, headers });
  }
}

// Body { robloxId } removes one account by stable identity; legacy { index } is also accepted.
export async function DELETE(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const text = await req.text();
  const response = NextResponse.json({ connected: false }, { headers });
  let index: unknown, robloxId: unknown;
  try { ({ index, robloxId } = text ? JSON.parse(text) : {}); } catch { return new NextResponse(null, { status: 400 }); }
  try {
    const { entries, token, degraded } = await trackstatEntries(req);
    if (degraded) return NextResponse.json({ error: 'Accounts could not be refreshed. Try again.' }, { status: 503, headers });
    if (robloxId !== undefined) index = entries.findIndex(entry => entry.history.account.roblox_id === robloxId);
    if (index !== undefined && (!Number.isInteger(index) || Number(index) < 0 || Number(index) >= entries.length)) return NextResponse.json({ error: 'Invalid account.' }, { status: 400, headers });
    const removed = index === undefined ? entries : [entries[Number(index)]];
    if (token) for (const id of removed.flatMap(entry => entry.ids)) await trackstatRPC('trackstat_user_account_remove', { p_account: id }, token);
    await forgetSeen(removed.flatMap(entry => entry.keys));
    writeKeys(response, readKeys(req).filter(key => !removed.some(e => e.keys.includes(key))));
    return response;
  } catch { return NextResponse.json({ error: 'Account could not be removed.' }, { status: 503, headers }); }
}
