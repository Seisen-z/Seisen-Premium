import { NextRequest, NextResponse } from 'next/server';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { sendDiscordWebhook } from '@/lib/server/discord';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);

        console.log('PayMongo Webhook received:', body.data?.attributes?.type);

        // We only process checkout_session.payment.paid events
        if (body.data?.attributes?.type !== 'checkout_session.payment.paid') {
            return NextResponse.json({ success: true, message: 'Unhandled event type' });
        }

        const checkoutAttrs = body.data.attributes.data.attributes;
        const referenceNumber: string = checkoutAttrs.reference_number || '';
        
        // Reference number format: PLAN_QTY_emailprefix_timestamp
        const parts = referenceNumber.split('_');
        const tier = (parts[0] || 'monthly').toLowerCase();
        const quantity = Math.max(1, parseInt(parts[1] || '1', 10));
        const customerEmail = checkoutAttrs.billing?.email || 'Unknown';
        const transactionId = body.data.id;

        // Amount is in centavos (PHP), cents = amount / 100
        const totalAmountPhp = (checkoutAttrs.line_items?.[0]?.amount || 0) / 100;

        const db = new TicketDatabase();

        // Idempotency check — skip if already processed
        if (await db.transactionExists(transactionId)) {
            console.log('PayMongo: Transaction already processed:', transactionId);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        const junkie = new JunkieKeySystem({
            webhookUrl: process.env.JUNKIE_WEBHOOK_URL,
            webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
            webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
            webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
            hmacSecret: process.env.JUNKIE_HMAC_SECRET,
            provider: process.env.JUNKIE_PROVIDER,
            defaultService: process.env.JUNKIE_SERVICE
        });

        const emailService = new EmailService();

        // Decrement GCash stock
        for (let i = 0; i < quantity; i++) {
            const decremented = await db.decrementPaymentMethodStock(tier, 'gcash');
            if (!decremented) {
                console.warn(`⚠️ Could not decrement GCash stock for tier ${tier} (unit ${i + 1})`);
            }
        }

        const validityMap: Record<string, number> = {
            weekly: 168,
            monthly: 720,
            lifetime: 0
        };
        const validity = validityMap[tier] !== undefined ? validityMap[tier] : 168;
        const unitAmountPhp = totalAmountPhp / quantity;

        // Generate keys
        let allKeys: string[] = [];
        let lastKeyResult: any = null;

        for (let i = 0; i < quantity; i++) {
            const keyResult = await junkie.generateKey({
                tier,
                validity,
                quantity: 1,
                userInfo: {
                    email: customerEmail,
                    payerId: 'GCash User'
                },
                paymentInfo: {
                    amount: unitAmountPhp,
                    currency: 'PHP',
                    transactionId: `${transactionId}-${i + 1}`
                }
            });

            lastKeyResult = keyResult;

            if (keyResult.success && keyResult.keys && keyResult.keys.length > 0) {
                allKeys = allKeys.concat(keyResult.keys);
            } else {
                console.error(`GCash key gen failed for unit ${i + 1}:`, keyResult.error);
            }
        }

        // Save to DB
        await db.savePayment({
            transactionId,
            payerEmail: customerEmail,
            payerId: 'GCash',
            tier,
            amount: totalAmountPhp,
            currency: 'PHP',
            status: 'completed',
            keys: allKeys
        });

        // Send email
        if (allKeys.length > 0) {
            await emailService.sendKeyEmail(customerEmail, allKeys[0], tier, transactionId);
        }

        // Send Discord Notification
        try {
            const tierDisplay = tier.toUpperCase();
            const keyDisplay = allKeys.length > 0
                ? allKeys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
                : '⚠️ Key generation failed — check Junkie integration';
            const amountDisplay = `₱${unitAmountPhp.toFixed(2)}${quantity > 1 ? ` × ${quantity} = ₱${totalAmountPhp.toFixed(2)}` : ''}`;

            await sendDiscordWebhook(
                `<@442317061104861184> 💰 New GCash Purchase!`,
                [{
                    title: `💎 New Premium Purchase (GCash)${quantity > 1 ? ` x${quantity}` : ''}`,
                    color: 0x00b4d8,
                    fields: [
                        { name: 'Tier',           value: tierDisplay,         inline: true },
                        { name: 'Amount',         value: amountDisplay,       inline: true },
                        { name: 'Quantity',       value: String(quantity),    inline: true },
                        { name: 'Transaction ID', value: transactionId,       inline: false },
                        { name: 'Customer Email', value: customerEmail,       inline: false },
                        { name: 'License Keys',   value: keyDisplay,          inline: false },
                    ],
                    timestamp: new Date().toISOString(),
                }]
            );
        } catch (discordErr: any) {
            console.error('Discord webhook error (non-fatal):', discordErr.message);
        }

        return NextResponse.json({ success: true, keys: allKeys });

    } catch (error: any) {
        console.error('PayMongo Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
