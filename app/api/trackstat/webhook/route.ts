import { NextRequest, NextResponse } from 'next/server';
import { bearer, readKeys } from '@/lib/server/trackstat-accounts';
import { TRACKSTAT_URL, TRACKSTAT_PUBLIC_KEY } from '@/lib/trackstat-config';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const robloxId = /^[0-9]{1,20}$/;
// Messages the database sends on purpose; anything else is shown as a general failure
const known = ['That is not a Discord webhook address', 'No webhook is set', 'Wait a few seconds before testing again', 'Invalid connection key'];

async function call(name: string, args: Record<string, unknown>, token?: string) {
  const response = await fetch(`${TRACKSTAT_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000), body: JSON.stringify(args),
    headers: { apikey: TRACKSTAT_PUBLIC_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await response.json().catch(() => null);
  return { ok: response.ok, body };
}

// Whether a Discord webhook is set for a Roblox account (the address itself is never sent back)
export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:webhook:read:${getClientIp(req)}`, 60, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const roblox = req.nextUrl.searchParams.get('roblox') ?? '';
  if (!robloxId.test(roblox)) return NextResponse.json({ configured: false }, { headers });
  try {
    const { ok, body } = await call('trackstat_webhook_get', { p_keys: readKeys(req), p_roblox: roblox }, bearer(req));
    return NextResponse.json(ok ? body : { configured: false }, { headers });
  } catch { return NextResponse.json({ configured: false }, { headers }); }
}

// { roblox, action: 'save' | 'remove' | 'test', url? }
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:webhook:write:${getClientIp(req)}`, 20, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const text = await req.text();
    if (text.length > 1024) return NextResponse.json({ error: 'That is not a Discord webhook address' }, { status: 400, headers });
    const { roblox, action, url } = JSON.parse(text);
    if (typeof roblox !== 'string' || !robloxId.test(roblox) || !['save', 'remove', 'test'].includes(action)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
    const args = { p_keys: readKeys(req), p_roblox: roblox };
    const { ok, body } = action === 'test'
      ? await call('trackstat_webhook_test', args, bearer(req))
      : await call('trackstat_webhook_set', { ...args, p_url: action === 'save' && typeof url === 'string' ? url.trim() : '' }, bearer(req));
    if (!ok) return NextResponse.json({ error: known.includes(body?.message) ? body.message : 'Could not update the webhook. Try again.' }, { status: 400, headers });
    return NextResponse.json(body, { headers });
  } catch { return NextResponse.json({ error: 'Could not update the webhook. Try again.' }, { status: 503, headers }); }
}
