import type { NextRequest } from 'next/server';
import { VERIFIED_CLIENT_EMAIL_COOKIE, readVerifiedClientEmail } from '@/lib/server/clientSession';
import { loadReiyaPurchases } from '@/lib/server/reiya-client';
import { reiyaStorageConfigured } from '@/lib/server/reiya-purchase';
import { purchaseError, purchaseResponse } from '@/lib/server/reiya-purchase-http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const email = readVerifiedClientEmail(request.cookies.get(VERIFIED_CLIENT_EMAIL_COOKIE)?.value);
  if (!email) return purchaseResponse({ error: 'Sign in with a verified email to see your Reiya purchases.' }, 401);

  if (!reiyaStorageConfigured()) {
    return purchaseResponse({ error: 'Reiya Premium purchases are temporarily unavailable.' }, 503);
  }

  try {
    return purchaseResponse({ purchases: await loadReiyaPurchases(email) });
  } catch (error) {
    return purchaseError(error);
  }
}
