import type { NextRequest } from 'next/server';
import { REIYA_PURCHASE_ID } from '@/lib/reiya-purchase';
import { VERIFIED_CLIENT_EMAIL_COOKIE, readVerifiedClientEmail } from '@/lib/server/clientSession';
import { loadReiyaPurchases, recoverReiyaKey } from '@/lib/server/reiya-client';
import { canEmailReiyaKey, reiyaStorageConfigured } from '@/lib/server/reiya-purchase';
import { purchaseBody, purchaseError, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const email = readVerifiedClientEmail(request.cookies.get(VERIFIED_CLIENT_EMAIL_COOKIE)?.value);
  if (!email) return purchaseResponse({ error: 'Sign in with a verified email to see your Reiya purchases.' }, 401);

  if (!reiyaStorageConfigured()) {
    return purchaseResponse({ error: 'Reiya Premium purchases are temporarily unavailable.' }, 503);
  }

  try {
    return purchaseResponse({ purchases: await loadReiyaPurchases(email), keyRecoveryAvailable: canEmailReiyaKey() });
  } catch (error) {
    return purchaseError(error);
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return purchaseResponse({ error: 'Open the Seisen client dashboard to recover your key.' }, 403);
  }
  const email = readVerifiedClientEmail(request.cookies.get(VERIFIED_CLIENT_EMAIL_COOKIE)?.value);
  if (!email) return purchaseResponse({ error: 'Sign in with your purchase email to recover your key.' }, 401);

  try {
    const body = await purchaseBody(request, 1024);
    const orderId = body && typeof body === 'object' && 'orderId' in body ? body.orderId : undefined;
    if (typeof orderId !== 'string' || !REIYA_PURCHASE_ID.test(orderId)) {
      return purchaseResponse({ error: 'Select a valid Reiya Premium purchase.' }, 400);
    }
    await recoverReiyaKey(email, orderId);
    return purchaseResponse({ emailed: true });
  } catch (error) {
    return purchaseError(error);
  }
}
