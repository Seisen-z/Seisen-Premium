import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const keyPattern = /^sp_[a-f0-9]{64}$/;
const idPattern = /^[0-9a-f-]{36}$/;

// Approve or deny a new device that asked to join one of the connected accounts' history
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:link:${getClientIp(req)}`, 20, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const body = JSON.parse(await req.text());
    const key = (req.cookies.get('seisen_trackstat')?.value ?? '').split(',')[Number(body.index)];
    if (!Number.isInteger(body.index) || !keyPattern.test(key ?? '') || typeof body.id !== 'string' || !idPattern.test(body.id) || typeof body.approve !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
    await trackstatRPC('trackstat_link_decide', { p_key: key, p_id: body.id, p_approve: body.approve });
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ error: 'This request is no longer available.' }, { status: 400, headers });
  }
}
