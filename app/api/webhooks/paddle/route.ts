import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { sendDiscordWebhook } from '@/lib/server/discord';

const PADDLE_BASE = process.env.PADDLE_SANDBOX === 'true'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
    try {
        const ts = signatureHeader.match(/ts=(\d+)/)?.[1];
        const h1 = signatureHeader.match(/h1=([a-f0-9]+)/)?.[1];
        if (!ts || !h1) return false;
        const hmac = crypto
            .createHmac('sha256', secret)
            .update(`${ts}:${rawBody}`)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(h1));
    } catch {
        return false;
    }
}

async function getCustomerEmail(customerId: string): Promise<string> {
    try {
        const res = await fetch(`${PADDLE_BASE}/customers/${customerId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PADDLE_API_KEY}` },
        });
        const data = await res.json();
        return data.data?.email || '';
    } catch {
        return '';
    }
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('paddle-signature') || '';
    const secret = process.env.PADDLE_WEBHOOK_SECRET || '';

    if (secret && !verifySignature(rawBody, signatureHeader, secret)) {
        console.error('Paddle webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        const body = JSON.parse(rawBody);

        if (body.event_type !== 'transaction.completed') {
            return NextResponse.json({ success: true, message: 'Unhandled event type' });
        }

        const txn = body.data;
        if (txn?.status !== 'completed') {
            return NextResponse.json({ success: true, message: 'Transaction not completed' });
        }

        const transactionId: string = txn.id;
        const customData = txn.custom_data || {};
        const tier: string = customData.tier || 'weekly';
        const quantity = Math.max(1, parseInt(customData.quantity || '1', 10));
        const discordId: string = customData.discordId || '';
        const discordTag: string = customData.discordTag || '';
        const discordAvatar: string = customData.discordAvatar || '';

        const customerEmail = txn.customer_id
            ? await getCustomerEmail(txn.customer_id)
            : '';

        const pricing: Record<string, number> = { weekly: 3, monthly: 6, lifetime: 10 };
        const baseAmountPerUnit = pricing[tier] ?? 3;
        const baseAmount = baseAmountPerUnit * quantity;

        const db = new TicketDatabase();

        if (await db.transactionExists(transactionId)) {
            console.log('Paddle webhook: transaction already processed:', transactionId);
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
            const ok = await db.decrementPaymentMethodStock(tier, 'paddle');
            if (!ok) console.warn(`⚠️ Paddle webhook: could not decrement stock for tier ${tier} (unit ${i + 1})`);
        }

        const validityMap: Record<string, number> = { weekly: 168, monthly: 720, lifetime: 0 };
        const validity = validityMap[tier] !== undefined ? validityMap[tier] : 168;

        let allKeys: string[] = [];

        for (let i = 0; i < quantity; i++) {
            const keyResult = await junkie.generateKey({
                tier,
                validity,
                quantity: 1,
                userInfo: { email: customerEmail, payerId: 'Paddle User' },
                paymentInfo: {
                    amount: baseAmountPerUnit,
                    currency: 'EUR',
                    transactionId: `${transactionId}-${i + 1}`,
                },
            });
            if (keyResult.success && Array.isArray(keyResult.keys) && keyResult.keys.length > 0) {
                allKeys = allKeys.concat(keyResult.keys);
            } else {
                console.error(`Paddle webhook key gen failed for unit ${i + 1}:`, keyResult.error);
            }
        }

        await db.savePayment({
            transactionId,
            payerEmail: customerEmail,
            payerId: 'Paddle',
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
            const keyDisplay = allKeys.length > 0
                ? allKeys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
                : '⚠️ Key generation failed';
            const amountDisplay = `€${baseAmountPerUnit}${quantity > 1 ? ` × ${quantity} = €${baseAmount}` : ''}`;

            await sendDiscordWebhook(
                `<@442317061104861184> 💰 New Paddle Purchase (webhook)!`,
                [{
                    title: `💎 New Premium Purchase (Paddle)${quantity > 1 ? ` ×${quantity}` : ''}`,
                    color: 0x0032ff,
                    fields: [
                        { name: 'Tier',           value: tier.toUpperCase(),  inline: true },
                        { name: 'Amount',         value: amountDisplay,       inline: true },
                        { name: 'Quantity',       value: String(quantity),    inline: true },
                        { name: 'Transaction ID', value: transactionId,       inline: false },
                        { name: 'Customer Email', value: customerEmail || 'N/A', inline: false },
                        { name: '🎮 Discord',    value: discordTag
                            ? `${discordTag} (ID: \`${discordId}\`)`
                            : '⚠️ Not linked',                                inline: false },
                        { name: 'License Keys',   value: keyDisplay,          inline: false },
                    ],
                    timestamp: new Date().toISOString(),
                }]
            );
        } catch (err: any) {
            console.error('Discord webhook error (non-fatal):', err.message);
        }

        return NextResponse.json({ success: true, keys: allKeys });
    } catch (error: any) {
        console.error('Paddle webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
