import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { sendDiscordWebhook } from '@/lib/server/discord';

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
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

        // Idempotency: return existing keys if already processed
        if (await db.transactionExists(transactionId)) {
            const existing = await db.getPayment(transactionId);
            if (existing?.generated_keys?.length > 0) {
                return NextResponse.json({
                    success: true,
                    transactionId,
                    tier: existing.tier,
                    amount: baseAmount,
                    currency: 'EUR',
                    keys: existing.generated_keys,
                    payerEmail: existing.payer_email,
                    quantity,
                });
            }
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

        // Decrement stock
        for (let i = 0; i < quantity; i++) {
            const decremented = await db.decrementPaymentMethodStock(tier, 'stripe');
            if (!decremented) {
                console.warn(`⚠️ Could not decrement Stripe stock for tier ${tier} (unit ${i + 1})`);
            }
        }

        const validityMap: Record<string, number> = { weekly: 168, monthly: 720, lifetime: 0 };
        const validity = validityMap[tier] !== undefined ? validityMap[tier] : 168;

        let allKeys: string[] = [];
        let lastKeyResult: any = null;

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

            lastKeyResult = keyResult;
            if (keyResult.success && Array.isArray(keyResult.keys) && keyResult.keys.length > 0) {
                allKeys = allKeys.concat(keyResult.keys);
            } else {
                console.error(`Stripe key gen failed for unit ${i + 1}:`, keyResult.error);
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
                `<@442317061104861184> 💰 New Stripe Purchase!`,
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
        } catch (webhookErr: any) {
            console.error('Discord webhook error (non-fatal):', webhookErr.message);
        }

        return NextResponse.json({
            success: allKeys.length > 0,
            transactionId,
            tier,
            amount: baseAmount,
            currency: 'EUR',
            keys: allKeys,
            quantity,
            payerEmail: customerEmail,
            junkieError: allKeys.length > 0 ? null : (lastKeyResult?.error || 'No keys generated'),
        });
    } catch (error: any) {
        console.error('Stripe confirm-session error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to confirm Stripe session' },
            { status: 500 }
        );
    }
}
