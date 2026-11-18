import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { createJunkieFromEnv } from '@/lib/server/junkie';
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

    const junkie = createJunkieFromEnv();

    const db = new TicketDatabase();

    // 1. Capture PayPal Order
    const captureData = await paypal.captureOrder(orderID);
    const paymentInfo = paypal.extractPaymentInfo(captureData);

    if (paymentInfo.status !== 'COMPLETED') {
        throw new Error('Payment not completed');
    }

    // Auto-mark as shipped to release funds
    await paypal.addTrackingToReleaseFunds(paymentInfo.transactionId);

    const rawTier = paymentInfo.tier || 'weekly';

    // ── Cart mode: custom_id = "cart|monthly:2|lifetime:1" ──────────────────
    if (rawTier.startsWith('cart|')) {
        const parts = rawTier.slice(5).split('|');
        const cartItems = parts.map((p: string) => {
            const [tier, qty] = p.split(':');
            return { tier: tier.toLowerCase(), quantity: Math.max(1, Math.min(10, parseInt(qty, 10) || 1)) };
        });

        const totalQty = cartItems.reduce((s: number, ci: { tier: string; quantity: number }) => s + ci.quantity, 0);
        const amountPerUnit = paymentInfo.amount / totalQty;
        const allKeys: string[] = [];
        let lastError: string | null = null;

        for (let i = 0; i < cartItems.length; i++) {
            const { tier, quantity } = cartItems[i];
            const result = await fulfillOrder(db, {
                transactionId: `${paymentInfo.transactionId}-cart-${i}`,
                tier,
                quantity,
                paymentMethod: 'paypal',
                decrementStock: true,
                amountPerUnit: amountPerUnit * quantity,
                currency: paymentInfo.currency,
                currencySymbol: '€',
                payerId: paymentInfo.payerId,
                customerEmail: paymentInfo.payerEmail,
                discordId: discordUser?.id,
                discordTag: discordUser?.tag,
                discordAvatar: discordUser?.avatar,
                providerLabel: 'PayPal (Cart)',
                embedColor: 0xfbbf24,
                junkie,
            });
            allKeys.push(...result.keys);
            if (result.junkieError) lastError = result.junkieError;
        }

        return NextResponse.json({
            success: allKeys.length > 0,
            orderId: paymentInfo.orderId,
            transactionId: paymentInfo.transactionId,
            keys: allKeys,
            quantity: totalQty,
            payerEmail: paymentInfo.payerEmail,
            payerName: paymentInfo.payerName,
            payerId: paymentInfo.payerId,
            createTime: paymentInfo.createTime,
            junkieError: lastError,
        });
    }

    // ── Single-tier mode (existing flow) ─────────────────────────────────────
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

    // Persist the amount actually captured by PayPal, including any tax.
    const amountPerUnit = paymentInfo.amount / quantity;

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
