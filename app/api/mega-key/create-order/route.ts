import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';

const MEGA_PRICING: Record<string, { amount: number; label: string; validityHours: number }> = {
  mega_1month: { amount: 40, label: 'Mega Key — 1 Month (100 tabs)', validityHours: 720 },
  mega_2month: { amount: 70, label: 'Mega Key — 2 Months (100 tabs)', validityHours: 1440 },
};

export async function POST(req: NextRequest) {
  try {
    const limitResult = rateLimit(`mega-key:create:${getClientIp(req)}`, 5, 60_000);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const rawSession = req.cookies.get('discord_session')?.value;
    if (!rawSession) {
      return NextResponse.json(
        { error: 'Discord login is required before starting checkout.' },
        { status: 401 }
      );
    }

    try {
      JSON.parse(Buffer.from(decodeURIComponent(rawSession), 'base64').toString('utf-8'));
    } catch {
      return NextResponse.json(
        { error: 'Invalid Discord session. Please log in with Discord again.' },
        { status: 401 }
      );
    }

    const { plan } = await req.json();

    const planConfig = MEGA_PRICING[plan];
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid mega key plan' }, { status: 400 });
    }

    const paypal = new PayPalSDK({
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      sandboxMode: process.env.PAYPAL_SANDBOX === 'true',
    });

    const frontendUrl = req.nextUrl.origin;

    const order = await paypal.createOrder({
      amount: planConfig.amount,
      currency: 'USD',
      description: planConfig.label,
      tier: plan,
      returnUrl: `${frontendUrl}/premium?megaSource=1`,
      cancelUrl: `${frontendUrl}/premium?canceled=true`,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Mega Key create-order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
