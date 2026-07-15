import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { fulfillOrder } from '@/lib/server/fulfillment';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limitResult = rateLimit(`paypal:capture-order:${getClientIp(req)}`, 15, 60_000);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const { orderID } = await req.json();

    // Read Discord session from cookie (sent automatically by browser)
    let discordUser: { id: string; tag: string; username: string; email: string | null; avatar?: string } | null = null;
    try {
      const rawSession = req.cookies.get('discord_session')?.value;
      if (rawSession) {
        // Cookies can be URL-encoded by clients/proxies. Decode safely before base64 parse.
        const normalizedSession = rawSession.includes('%') ? decodeURIComponent(rawSession) : rawSession;
        discordUser = JSON.parse(Buffer.from(normalizedSession, 'base64').toString('utf-8'));
      }
    } catch { /* non-fatal */ }

    if (!orderID) {
        return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Initialize Services
    const paypal = new PayPalSDK({
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        sandboxMode: process.env.PAYPAL_SANDBOX === 'true'
    });

    const junkie = new JunkieKeySystem({
        webhookUrl: process.env.JUNKIE_WEBHOOK_URL,
        webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
        webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
        webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
        hmacSecret: process.env.JUNKIE_HMAC_SECRET,
        provider: process.env.JUNKIE_PROVIDER,
        defaultService: process.env.JUNKIE_SERVICE
    });

    const db = new TicketDatabase();

    // 1. Capture PayPal Order
    const captureData = await paypal.captureOrder(orderID);
    const paymentInfo = paypal.extractPaymentInfo(captureData);

    if (paymentInfo.status !== 'COMPLETED') {
        throw new Error('Payment not completed');
    }

    // Auto-mark as shipped to release funds
    await paypal.addTrackingToReleaseFunds(paymentInfo.transactionId);

    // Updated Pricing — Monthly €6, Lifetime €12
    const tierPricing: Record<string, number> = {
        weekly: 3,
        monthly: 6,
        lifetime: 12
    };

    // Parse tier and quantity from custom_id — format: "tier:quantity" or just "tier" (legacy)
    const rawTier = paymentInfo.tier || 'weekly';
    let normalizedTier: string;
    let quantity = 1;

    if (rawTier.includes(':')) {
        const parts = rawTier.split(':');
        normalizedTier = parts[0].toLowerCase();
        quantity = Math.max(1, Math.min(10, parseInt(parts[1], 10) || 1));
    } else {
        normalizedTier = rawTier.toLowerCase();
        quantity = 1;
    }

    const amountPerUnit = tierPricing[normalizedTier] !== undefined
        ? tierPricing[normalizedTier]
        : paymentInfo.amount;

    // 2-7. Idempotent claim, stock decrement, key generation, save, email, Discord notify.
    const result = await fulfillOrder(db, {
        transactionId: paymentInfo.transactionId,
        tier: normalizedTier,
        quantity,
        paymentMethod: 'paypal',
        decrementStock: true,
        amountPerUnit,
        currency: paymentInfo.currency,
        currencySymbol: '€',
        payerId: paymentInfo.payerId,
        customerEmail: paymentInfo.payerEmail,
        discordId: discordUser?.id,
        discordTag: discordUser?.tag,
        discordAvatar: discordUser?.avatar,
        providerLabel: 'PayPal',
        embedColor: 0xfbbf24,
        junkie,
    });

    return NextResponse.json({
        success: result.success,
        orderId: paymentInfo.orderId,
        transactionId: result.transactionId,
        tier: result.tier,
        amount: result.amount,
        currency: result.currency,
        keys: result.keys,
        quantity: result.quantity,
        emailSent: result.keys.length > 0,
        // Customer Details
        payerEmail: result.payerEmail,
        payerName: paymentInfo.payerName,
        payerId: result.payerId,
        createTime: paymentInfo.createTime,
        // Debugging info
        junkieError: result.junkieError,
        junkieDetails: result.junkieDetails,
    });

  } catch (error: any) {
    console.error('Capture Order Error:', error);
    return NextResponse.json(
        { error: error.message || 'Failed to capture order' },
        { status: 500 }
    );
  }
}
