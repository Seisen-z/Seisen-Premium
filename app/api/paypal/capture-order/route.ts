import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { VatCalculator } from '@/lib/server/vat';
import { sendDiscordWebhook } from '@/lib/server/discord';

export async function POST(req: NextRequest) {
  try {
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
    const emailService = new EmailService();

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

    const baseAmountPerUnit = tierPricing[normalizedTier] !== undefined
        ? tierPricing[normalizedTier]
        : paymentInfo.amount;
    
    const baseAmount = baseAmountPerUnit * quantity;

    // Update paymentInfo to use normalized tier and computed base amount
    paymentInfo.amount = baseAmount;
    paymentInfo.tier = normalizedTier;

    // 2. Check if transaction already processed
    if (await db.transactionExists(paymentInfo.transactionId)) {
        console.log('Transaction already processed:', paymentInfo.transactionId);
        const existingPayment = await db.getPayment(paymentInfo.transactionId);
        
        // SELF-HEALING: If payment exists but keys are missing, allow fall-through
        if (existingPayment && existingPayment.generated_keys && existingPayment.generated_keys.length > 0) {
            console.log('Returning existing keys for transaction');
            const storedBaseAmount = (tierPricing[existingPayment.tier] || existingPayment.amount) * (existingPayment.generated_keys.length || 1);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Transaction already processed',
                details: paymentInfo,
                keys: existingPayment.generated_keys,
                tier: existingPayment.tier,
                amount: storedBaseAmount,
                currency: existingPayment.currency
            });
        }
        console.warn('⚠️ Transaction exists but has NO keys. Retrying generation...');
    }

    // Decrement stock by quantity
    for (let i = 0; i < quantity; i++) {
        const stockDecremented = await db.decrementPaymentMethodStock(paymentInfo.tier, 'paypal');
        if (!stockDecremented) {
            console.warn(`⚠️ Could not decrement PayPal stock for tier ${paymentInfo.tier} (unit ${i + 1} of ${quantity}).`);
        }
    }

    // Determine validity based on tier
    const validityMap: Record<string, number> = {
        weekly: 168,
        monthly: 720,
        lifetime: 0
    };
    const validity = (validityMap[paymentInfo.tier] !== undefined) ? validityMap[paymentInfo.tier] : 168;

    // 3. Generate Keys via Junkie — generate one per unit
    let allKeys: string[] = [];
    let lastKeyResult: any = null;

    for (let i = 0; i < quantity; i++) {
        const keyResult = await junkie.generateKey({
            tier: paymentInfo.tier,
            validity: validity,
            quantity: 1,
            userInfo: {
                email: paymentInfo.payerEmail,
                payerId: paymentInfo.payerId
            },
            paymentInfo: {
                amount: baseAmountPerUnit,
                currency: paymentInfo.currency,
                transactionId: `${paymentInfo.transactionId}-${i + 1}`
            }
        });

        lastKeyResult = keyResult;

        if (keyResult.success && keyResult.keys && keyResult.keys.length > 0) {
            allKeys = allKeys.concat(keyResult.keys);
        } else {
            console.error(`Key generation failed for unit ${i + 1} of ${quantity}:`, keyResult.error);
        }
    }

    // 4. Save to Database
    await db.savePayment({
        ...paymentInfo,
        keys: allKeys,
        discordId: discordUser?.id,
        discordTag: discordUser?.tag,
        discordAvatar: discordUser?.avatar
    });

    // 5. Send Email with all keys
    if (allKeys.length > 0) {
        await emailService.sendKeyEmail(
            paymentInfo.payerEmail,
            allKeys[0],   // Primary key for email
            paymentInfo.tier,
            paymentInfo.transactionId
        );
    }

    // 6. Send Discord webhook
    try {
        const tier = (paymentInfo.tier || 'N/A').toUpperCase();
        const keyDisplay = allKeys.length > 0
            ? allKeys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
            : '⚠️ Key generation failed — check Junkie webhook';
        const amountDisplay = `€${baseAmountPerUnit}${quantity > 1 ? ` × ${quantity} = €${baseAmount}` : ''}`;

        await sendDiscordWebhook(
            `<@442317061104861184> 💰 New Premium Purchase!`,
            [{
                title: `💎 New Premium Purchase (PayPal)${quantity > 1 ? ` x${quantity}` : ''}`,
                color: 0xfbbf24,
                fields: [
                    { name: 'Tier',           value: tier,                              inline: true },
                    { name: 'Amount',         value: amountDisplay,                     inline: true },
                    { name: 'Quantity',       value: String(quantity),                  inline: true },
                    { name: 'Transaction ID', value: paymentInfo.transactionId,         inline: false },
                    { name: 'Customer Email', value: paymentInfo.payerEmail || 'N/A',   inline: false },
                    { name: '🎮 Discord',    value: discordUser
                        ? `${discordUser.tag} (ID: \`${discordUser.id}\`)`
                        : '⚠️ Not linked',                                             inline: false },
                    { name: 'License Keys',   value: keyDisplay,                        inline: false },
                ],
                timestamp: new Date().toISOString(),
            }]
        );
    } catch (webhookErr: any) {
        console.error('Discord webhook error (non-fatal):', webhookErr.message);
    }

    return NextResponse.json({
        success: allKeys.length > 0,
        orderId: paymentInfo.orderId,
        transactionId: paymentInfo.transactionId,
        tier: paymentInfo.tier,
        amount: baseAmount,
        currency: paymentInfo.currency,
        keys: allKeys,
        quantity,
        emailSent: true,
        // Customer Details
        payerEmail: paymentInfo.payerEmail,
        payerName: paymentInfo.payerName,
        payerId: paymentInfo.payerId,
        createTime: paymentInfo.createTime,
        // Debugging info
        junkieError: allKeys.length > 0 ? null : (lastKeyResult?.error || 'No keys generated'),
        junkieDetails: allKeys.length > 0 ? null : lastKeyResult?.details
    });

  } catch (error: any) {
    console.error('Capture Order Error:', error);
    return NextResponse.json(
        { error: error.message || 'Failed to capture order' }, 
        { status: 500 }
    );
  }
}
