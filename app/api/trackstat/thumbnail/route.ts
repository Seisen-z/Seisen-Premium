import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/server/rate-limit';

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get('game'), icon = req.nextUrl.searchParams.get('icon');
  if (!['petsimulator99', 'tapsimulator', 'animedice'].includes(game ?? '') || !/^[1-9][0-9]{0,19}$/.test(icon ?? '')) return new NextResponse(null, { status: 400 });
  const limit = rateLimit(`trackstat:thumbnail:${getClientIp(req)}`, 20, 3000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const url = process.env.TRACKSTAT_SERVER_URL, token = process.env.TRACKSTAT_SERVER_TOKEN;
  if (!url || !token) return new NextResponse(null, { status: 503 });
  try {
    const response = await fetch(`${url}/v1/thumbnail?game=${game}&icon=${icon}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (response.status === 202) return new NextResponse(null, { status: 202, headers: { 'Retry-After': '3', 'Cache-Control': 'no-store' } });
    if (!response.ok) return new NextResponse(null, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 1024 * 1024 || new Uint8Array(bytes).slice(0, 8).join(',') !== '137,80,78,71,13,10,26,10') return new NextResponse(null, { status: 502 });
    return new NextResponse(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch { return new NextResponse(null, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
