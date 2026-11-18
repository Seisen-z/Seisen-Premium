import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';

const RENEWAL_PRICE = 6;

export async function POST(req: NextRequest) {
  try {
    const limitResult = rateLimit(`paypal:create-renew-order:${getClientIp(req)}`, 5, 60_000);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const rawSession = req.cookies.get('discord_session')?.value;
    if (!rawSession) {
      return NextResponse.json({ error: 'Discord login is required.' }, { status: 401 });
    }
    try {
      JSON.parse(Buffer.from(decodeURIComponent(rawSession), 'base64').toString('utf-8'));
    } catch {
      return NextResponse.json({ error: 'Invalid Discord session. Please log in again.' }, { status: 401 });
    }

    const paypal = new PayPalSDK({
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      sandboxMode: process.env.PAYPAL_SANDBOX === 'true',
    });

    const frontendUrl = req.nextUrl.origin;

    const order = await paypal.createOrder({
      amount: RENEWAL_PRICE,
      currency: 'EUR',
      description: 'Seisen Hub Monthly Key Renewal (+30 days)',
      tier: 'monthly_renewal',
      returnUrl: `${frontendUrl}/client/renew`,
      cancelUrl: `${frontendUrl}/client/renew?canceled=true`,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Create Renew Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
