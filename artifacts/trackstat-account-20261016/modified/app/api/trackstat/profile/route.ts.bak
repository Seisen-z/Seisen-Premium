import { NextRequest, NextResponse } from 'next/server';
import { bearer, cookieName, cookieOptions, readKeys } from '@/lib/server/trackstat-accounts';
import { trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:profile:${getClientIp(req)}`, 10, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: 'Sign in first.' }, { status: 401, headers });
  try {
    for (const key of readKeys(req)) await trackstatRPC('trackstat_user_account_save', { p_key: key }, token);
    return NextResponse.json({ saved: true }, { headers });
  } catch { return NextResponse.json({ error: 'Could not save these connections. Refresh and try again.' }, { status: 503, headers }); }
}
export async function DELETE(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const response = NextResponse.json({ signedOut: true }, { headers });
  response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
