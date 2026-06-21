import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { sendDiscordWebhook } from '@/lib/server/discord';

// Stripe requires the raw body for signature verification — disable Next.js body parsing
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type !== 'checkout.session.completed') {
        return NextResponse.json({ success: true, message: 'Unhandled event type' });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
        return NextResponse.json({ success: true, message: 'Payment not yet paid' });
    }

    const transactionId = session.payment_intent as string;
    const tier = session.metadata?.tier || 'weekly';
    const quantity = Math.max(1, parseInt(session.metadata?.quantity || '1', 10));
    const customerEmail = session.customer_details?.email || '';
    const discordId = session.metadata?.discordId || '';
    const discordTag = session.metadata?.discordTag || '';
    const discordAvatar = session.metadata?.discordAvatar || '';

    const pricing: Record<string, number> = { weekly: 3, monthly: 6, lifetime: 10 };
    const baseAmountPerUnit = pricing[tier] ?? 3;
    const baseAmount = baseAmountPerUnit * quantity;

    const db = new TicketDatabase();

    // Idempotency check — skip if confirm-session already handled this
    if (await db.transactionExists(transactionId)) {
        console.log('Stripe webhook: transaction already processed:', transactionId);
        return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const junkie = new JunkieKeySystem({
        webhookUrl: process.env.JUNKIE_WEBHOOK_URL,
        webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
        webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
        webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
        hmacSecret: process.env.JUNKIE_HMAC_SECRET,
        provider: process.env.JUNKIE_PROVIDER,
        defaultService: process.env.JUNKIE_SERVICE,
    });

    const emailService = new EmailService();

    for (let i = 0; i < quantity; i++) {
        const decremented = await db.decrementPaymentMethodStock(tier, 'stripe');
        if (!decremented) {
            console.warn(`⚠️ Stripe webhook: could not decrement stock for tier ${tier} (unit ${i + 1})`);
        }
    }

    const validityMap: Record<string, number> = { weekly: 168, monthly: 720, lifetime: 0 };
    const validity = validityMap[tier] !== undefined ? validityMap[tier] : 168;

    let allKeys: string[] = [];

    for (let i = 0; i < quantity; i++) {
        const keyResult = await junkie.generateKey({
            tier,
            validity,
            quantity: 1,
            userInfo: { email: customerEmail, payerId: 'Stripe User' },
            paymentInfo: {
                amount: baseAmountPerUnit,
                currency: 'EUR',
                transactionId: `${transactionId}-${i + 1}`,
            },
        });

        if (keyResult.success && Array.isArray(keyResult.keys) && keyResult.keys.length > 0) {
            allKeys = allKeys.concat(keyResult.keys);
        } else {
            console.error(`Stripe webhook key gen failed for unit ${i + 1}:`, keyResult.error);
        }
    }

    await db.savePayment({
        transactionId,
        payerEmail: customerEmail,
        payerId: 'Stripe',
        tier,
        amount: baseAmount,
        currency: 'EUR',
        status: 'completed',
        keys: allKeys,
        discordId: discordId || undefined,
        discordTag: discordTag || undefined,
        discordAvatar: discordAvatar || undefined,
    });

    if (allKeys.length > 0) {
        await emailService.sendKeyEmail(customerEmail, allKeys[0], tier, transactionId);
    }

    try {
        const tierDisplay = tier.toUpperCase();
        const keyDisplay = allKeys.length > 0
            ? allKeys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
            : '⚠️ Key generation failed — check Junkie webhook';
        const amountDisplay = `€${baseAmountPerUnit}${quantity > 1 ? ` × ${quantity} = €${baseAmount}` : ''}`;

        await sendDiscordWebhook(
            `<@442317061104861184> 💰 New Stripe Purchase (webhook fallback)!`,
            [{
                title: `💎 New Premium Purchase (Stripe)${quantity > 1 ? ` ×${quantity}` : ''}`,
                color: 0x635bff,
                fields: [
                    { name: 'Tier',           value: tierDisplay,       inline: true },
                    { name: 'Amount',         value: amountDisplay,     inline: true },
                    { name: 'Quantity',       value: String(quantity),  inline: true },
                    { name: 'Transaction ID', value: transactionId,     inline: false },
                    { name: 'Customer Email', value: customerEmail || 'N/A', inline: false },
                    { name: '🎮 Discord',    value: discordTag
                        ? `${discordTag} (ID: \`${discordId}\`)`
                        : '⚠️ Not linked',                              inline: false },
                    { name: 'License Keys',   value: keyDisplay,        inline: false },
                ],
                timestamp: new Date().toISOString(),
            }]
        );
    } catch (discordErr: any) {
        console.error('Discord webhook error (non-fatal):', discordErr.message);
    }

    return NextResponse.json({ success: true, keys: allKeys });
}
