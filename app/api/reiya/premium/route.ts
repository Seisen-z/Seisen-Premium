import { allowedPremiumMethod, desktopPremium } from '@/lib/server/reiya-desktop';
import { purchaseBody, purchaseError, purchaseIp, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const runtime = 'nodejs';

async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return purchaseResponse({ error: 'Origin is not allowed.' }, 403);
    const action = url.searchParams.get('action') ?? '';
    if (!allowedPremiumMethod(action, request.method)) return purchaseResponse({ error: 'Method not allowed.' }, 405);
    const body = request.method === 'POST' ? await purchaseBody(request, 2850000) : undefined;
    return purchaseResponse(await desktopPremium(action, request, body, purchaseIp(request)));
  } catch (error) {
    return purchaseError(error);
  }
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
