import { TicketDatabase } from './db';
import { JunkieKeySystem, JunkieResponse } from './junkie';
import { EmailService } from './email';
import { sendDiscordWebhook } from './discord';

const VALIDITY_MAP: Record<string, number> = { weekly: 168, monthly: 720, lifetime: 0 };

export interface FulfillOrderParams {
    transactionId: string;
    tier: string;
    quantity: number;
    /** Payment method key used for stock decrement (must match lib/server/db.ts's paymentMethods list). */
    paymentMethod: string;
    /** Whether this provider has a tracked stock pool to decrement. */
    decrementStock: boolean;
    amountPerUnit: number;
    currency: string;
    currencySymbol: string;
    payerId: string;
    customerEmail: string;
    discordId?: string;
    discordTag?: string;
    discordAvatar?: string;
    providerLabel: string;
    embedColor: number;
    junkie: JunkieKeySystem;
}

export interface FulfillOrderResult {
    success: boolean;
    transactionId: string;
    tier: string;
    amount: number;
    currency: string;
    keys: string[];
    quantity: number;
    payerEmail: string;
    payerId: string;
    junkieError: string | null;
    junkieDetails?: any;
}

async function issueKeys(
    junkie: JunkieKeySystem,
    tier: string,
    quantity: number,
    validity: number,
    customerEmail: string,
    amountPerUnit: number,
    currency: string,
    transactionId: string,
): Promise<{ allKeys: string[]; lastKeyResult: JunkieResponse | null }> {
    let allKeys: string[] = [];
    let lastKeyResult: JunkieResponse | null = null;

    for (let i = 0; i < quantity; i++) {
        const keyResult = await junkie.generateKey({
            tier,
            validity,
            quantity: 1,
            userInfo: { email: customerEmail, payerId: 'Premium Purchase' },
            paymentInfo: {
                amount: amountPerUnit,
                currency,
                transactionId: `${transactionId}-${i + 1}`,
            },
        });
        lastKeyResult = keyResult;
        if (keyResult.success && Array.isArray(keyResult.keys) && keyResult.keys.length > 0) {
            allKeys = allKeys.concat(keyResult.keys);
        } else {
            console.error(`Key gen failed for unit ${i + 1}/${quantity} (${transactionId}):`, keyResult.error);
        }
    }

    return { allKeys, lastKeyResult };
}

function notifyDiscord(params: FulfillOrderParams, amount: number, keys: string[]) {
    const { tier, quantity, transactionId, customerEmail, discordId, discordTag, providerLabel, embedColor, amountPerUnit, currencySymbol } = params;

    const keyDisplay = keys.length > 0
        ? keys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
        : '⚠️ Key generation failed — check Junkie webhook';
    const amountDisplay = `${currencySymbol}${amountPerUnit}${quantity > 1 ? ` × ${quantity} = ${currencySymbol}${amount}` : ''}`;

    // sendDiscordWebhook never throws (it catches internally) — safe to fire-and-forget.
    void sendDiscordWebhook(
        `<@442317061104861184> 💰 New ${providerLabel} Purchase!`,
        [{
            title: `💎 New Premium Purchase (${providerLabel})${quantity > 1 ? ` ×${quantity}` : ''}`,
            color: embedColor,
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
}

/**
 * Fulfills a paid order: atomically claims the transaction (relying on the
 * UNIQUE constraint on payments.transaction_id) so a confirm-endpoint call and
 * a provider webhook racing for the same transaction can't both decrement
 * stock and generate keys. Email/Discord notifications are fire-and-forget —
 * both already swallow their own errors, so there's nothing to await for.
 */
export async function fulfillOrder(db: TicketDatabase, params: FulfillOrderParams): Promise<FulfillOrderResult> {
    const { transactionId, tier, quantity, paymentMethod, decrementStock, amountPerUnit, currency, payerId, customerEmail, discordId, discordTag, discordAvatar, junkie } = params;
    const amount = amountPerUnit * quantity;
    const validity = VALIDITY_MAP[tier] ?? 168;
    const emailService = new EmailService();

    let claimed = true;
    try {
        await db.savePayment({
            transactionId,
            payerEmail: customerEmail,
            payerId,
            tier,
            amount,
            currency,
            status: 'processing',
            keys: [],
            discordId: discordId || undefined,
            discordTag: discordTag || undefined,
            discordAvatar: discordAvatar || undefined,
        });
    } catch (err: any) {
        if (err?.code === '23505') {
            claimed = false;
        } else {
            throw err;
        }
    }

    if (!claimed) {
        const existing = await db.getPayment(transactionId);
        if (existing?.generated_keys?.length > 0) {
            return {
                success: true, transactionId, tier: existing.tier, amount, currency,
                keys: existing.generated_keys, quantity, payerEmail: existing.payer_email, payerId,
                junkieError: null,
            };
        }

        // The claimant hasn't finished (or failed) — fill in keys without re-decrementing stock.
        const { allKeys, lastKeyResult } = await issueKeys(junkie, tier, quantity, validity, customerEmail, amountPerUnit, currency, transactionId);
        await db.updatePaymentKeys(transactionId, allKeys);
        if (allKeys.length > 0) {
            void emailService.sendKeyEmail(customerEmail, allKeys[0], tier, transactionId);
        }
        return {
            success: allKeys.length > 0, transactionId, tier, amount, currency, keys: allKeys, quantity, payerEmail: customerEmail, payerId,
            junkieError: allKeys.length > 0 ? null : (lastKeyResult?.error || 'No keys generated'),
            junkieDetails: allKeys.length > 0 ? undefined : lastKeyResult?.details,
        };
    }

    if (decrementStock) {
        for (let i = 0; i < quantity; i++) {
            const ok = await db.decrementPaymentMethodStock(tier, paymentMethod);
            if (!ok) console.warn(`⚠️ Could not decrement ${paymentMethod} stock for tier ${tier} (unit ${i + 1})`);
        }
    }

    const { allKeys, lastKeyResult } = await issueKeys(junkie, tier, quantity, validity, customerEmail, amountPerUnit, currency, transactionId);
    await db.updatePaymentKeys(transactionId, allKeys);

    if (allKeys.length > 0) {
        void emailService.sendKeyEmail(customerEmail, allKeys[0], tier, transactionId);
    }

    notifyDiscord(params, amount, allKeys);

    return {
        success: allKeys.length > 0, transactionId, tier, amount, currency, keys: allKeys, quantity, payerEmail: customerEmail, payerId,
        junkieError: allKeys.length > 0 ? null : (lastKeyResult?.error || 'No keys generated'),
        junkieDetails: allKeys.length > 0 ? undefined : lastKeyResult?.details,
    };
}
