import { handleReiyaWebhook } from '@/lib/server/reiya-purchase';
import { purchaseBody, purchaseError, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await handleReiyaWebhook(request, await purchaseBody(request, 65536));
    return purchaseResponse({ received: true });
  } catch (error) {
    // PayPal can send a sale notification before billing details are updated.
    const response = purchaseError(error);
    if (response.status === 409) return purchaseResponse({ error: 'Waiting for PayPal billing details.' }, 503);
    return response;
  }
}
