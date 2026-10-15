import { NextRequest, NextResponse } from 'next/server';
import { trackstatMedia, trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import type { TrackstatHistory, TrackstatPublic } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const cookieName = 'seisen_trackstat';
const headers = { 'Cache-Control': 'private, no-store' };
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/trackstat', maxAge: 60 * 60 * 24 * 30 };

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:read:${getClientIp(req)}`, 60, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const totals = await trackstatRPC<TrackstatPublic>('trackstat_public');
    const key = req.cookies.get(cookieName)?.value;
    let history: TrackstatHistory | null = null;
    let reconnect = false;
    if (key) {
      try { history = await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key }); }
      catch (error) {
        if (error instanceof Error && error.message === 'Invalid connection key') reconnect = true;
        else throw error;
      }
    }
    const response = NextResponse.json({ public: totals, private: history, media: await trackstatMedia(history?.account.roblox_id), reconnect }, { headers });
    if (reconnect) response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
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
    if (typeof key !== 'string' || !/^sp_[a-f0-9]{64}$/.test(key)) return NextResponse.json({ error: 'Paste the connection key copied from the library.' }, { status: 400, headers });
    await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    const response = NextResponse.json({ connected: true }, { headers });
    response.cookies.set(cookieName, key, cookieOptions);
    return response;
  } catch (error) {
    const invalid = error instanceof SyntaxError || (error instanceof Error && error.message === 'Invalid connection key');
    return NextResponse.json({ error: invalid ? 'This key is invalid or was reset. Copy the current key from the library.' : 'Trackstat is temporarily unavailable.' }, { status: invalid ? 400 : 503, headers });
  }
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const response = NextResponse.json({ connected: false }, { headers });
  response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
