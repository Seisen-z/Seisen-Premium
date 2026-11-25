import type { NextRequest } from 'next/server';
import { CLAIM_TTL_SECONDS, claimCookie, createReiyaPurchase, purchaseOrigin } from '@/lib/server/reiya-purchase';
import { purchaseBody, purchaseError, purchaseIp, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const origin = purchaseOrigin(request);
    const purchase = await createReiyaPurchase(await purchaseBody(request), purchaseIp(request), origin);
    const response = purchaseResponse({ approvalUrl: purchase.approvalUrl });
    response.cookies.set(claimCookie(purchase.purchaseId), purchase.claim, {
      httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax',
      path: '/api/reiya/receipt', maxAge: CLAIM_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    return purchaseError(error);
  }
}
