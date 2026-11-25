import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/server/rate-limit';
import { ReiyaPurchaseError } from '@/lib/server/reiya-purchase';

export function purchaseIp(request: Request): string {
  return (request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || getClientIp(request)).slice(0, 128);
}

export async function purchaseBody(request: Request, maximum = 4096): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new ReiyaPurchaseError(415, 'A JSON request is required.');
  }
  const size = Number(request.headers.get('content-length'));
  if (size > maximum) throw new ReiyaPurchaseError(413, 'Purchase request is too large.');
  const data = await request.text();
  if (data.length > maximum) throw new ReiyaPurchaseError(413, 'Purchase request is too large.');
  try {
    return JSON.parse(data);
  } catch {
    throw new ReiyaPurchaseError(400, 'Invalid purchase request.');
  }
}

export function purchaseResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function purchaseError(error: unknown) {
  return error instanceof ReiyaPurchaseError
    ? purchaseResponse({ error: error.message }, error.status)
    : purchaseResponse({ error: 'Reiya Premium is temporarily unavailable. Try again shortly.' }, 503);
}
