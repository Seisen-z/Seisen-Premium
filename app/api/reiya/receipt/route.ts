import type { NextRequest } from 'next/server';
import { REIYA_PURCHASE_ID } from '@/lib/reiya-purchase';
import { claimCookie, claimReiyaPurchase, purchaseOrigin, ReiyaPurchaseError } from '@/lib/server/reiya-purchase';
import { purchaseBody, purchaseError, purchaseIp, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    purchaseOrigin(request);
    const body = await purchaseBody(request);
    const id = body && typeof body === 'object' && 'purchaseId' in body ? body.purchaseId : null;
    if (typeof id !== 'string' || !REIYA_PURCHASE_ID.test(id)) throw new ReiyaPurchaseError(400, 'Invalid purchase ID.');
    const result = await claimReiyaPurchase(id, request.cookies.get(claimCookie(id))?.value, purchaseIp(request));
    return purchaseResponse(result);
  } catch (error) {
    return purchaseError(error);
  }
}
