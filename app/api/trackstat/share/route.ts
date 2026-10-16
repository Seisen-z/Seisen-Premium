import { NextRequest, NextResponse } from 'next/server';
import { bearer, readKeys } from '@/lib/server/trackstat-accounts';
import { trackstatCall } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const robloxId = /^[0-9]{1,20}$/;

// The read-only link of a Roblox account, if it has one (only for someone who can use that account)
export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:share:read:${getClientIp(req)}`, 60, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const roblox = req.nextUrl.searchParams.get('roblox') ?? '';
  if (!robloxId.test(roblox)) return NextResponse.json({ active: false }, { headers });
  try {
    const { ok, body } = await trackstatCall('trackstat_share_get', { p_keys: readKeys(req), p_roblox: roblox }, bearer(req));
    return NextResponse.json(ok ? body : { active: false }, { headers });
  } catch { return NextResponse.json({ active: false }, { headers }); }
}

// { roblox, action: 'create' | 'revoke' }
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:share:write:${getClientIp(req)}`, 20, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const text = await req.text();
    if (text.length > 256) return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
    const { roblox, action } = JSON.parse(text);
    if (typeof roblox !== 'string' || !robloxId.test(roblox) || !['create', 'revoke'].includes(action)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
    const { ok, body } = await trackstatCall(action === 'create' ? 'trackstat_share_create' : 'trackstat_share_revoke', { p_keys: readKeys(req), p_roblox: roblox }, bearer(req));
    if (!ok) return NextResponse.json({ error: 'Could not update the link. Try again.' }, { status: 400, headers });
    return NextResponse.json(body, { headers });
  } catch { return NextResponse.json({ error: 'Could not update the link. Try again.' }, { status: 503, headers }); }
}
