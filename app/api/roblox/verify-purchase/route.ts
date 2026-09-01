import { NextRequest, NextResponse } from 'next/server';
import { RobloxIntegration } from '@/lib/server/roblox';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const roblox = new RobloxIntegration({
        apiKey: process.env.ROBLOX_API_KEY
    });

    const junkie = new JunkieKeySystem({
        webhookUrl: process.env.JUNKIE_WEBHOOK_URL,
        webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
        webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
        webhookUrlAnnual: process.env.JUNKIE_WEBHOOK_URL_ANNUAL,
        webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
        hmacSecret: process.env.JUNKIE_HMAC_SECRET,
        hmacSecretAnnual: process.env.JUNKIE_HMAC_SECRET_ANNUAL,
        hmacHeaderAnnual: process.env.JUNKIE_HMAC_HEADER_ANNUAL,
        provider: process.env.JUNKIE_PROVIDER,
        defaultService: process.env.JUNKIE_SERVICE
    });

    const db = new TicketDatabase();
    const emailService = new EmailService();

    // 1. Verify Purchase
    const verification = await roblox.verifyPurchase(username);

    if (!verification.success) {
        return NextResponse.json({ 
            success: false, 
            error: verification.error 
        }, { status: 403 });
    }

    const transactionId = roblox.generateTransactionId(verification.userId!, verification.productId!);

    // 2. Check if already processed (Renewal logic might be needed here, or check status)
    // Server.js logic was: if owned, generate keys. 
    // It didn't strictly prevent re-verification unless we want to avoid spamming keys.
    // However, Junkie keys have validity. Re-verifying usually means lost key or new period.
    // Let's check if we have a record first.
    
    // For simplicity following server.js strict logic:
    // If owned, giving a key.

    // 3. Generate Key
    const keyResult = await junkie.generateKey({
        tier: verification.tier,
        quantity: 1,
        userInfo: {
            custom: username,
            robloxUsername: username
        },
        paymentInfo: {
            amount: 0, // Already paid functionality
            currency: 'ROBUX',
            transactionId: transactionId
        }
    });

    const keys = (keyResult.success && keyResult.keys) ? keyResult.keys : [];

    // 4. Save/Update Payment Record
    const exists = await db.transactionExists(transactionId);
    
    if (exists) {
        // Update existing record with new keys (Renewal/Recovery)
        await db.updatePaymentKeys(transactionId, keys);
        await db.updateRobloxPurchase(transactionId, verification.uaid ?? 0);
    } else {
        // Create new record
        await db.savePayment({
            transactionId: transactionId,
            payerEmail: 'roblox_user@placeholder.com', // No email from Roblox
            robloxUsername: username,
            robloxUaid: verification.uaid ?? null,
            tier: verification.tier,
            amount: 0,
            currency: 'ROBUX',
            status: 'COMPLETED',
            keys: keys
        });
    }

    return NextResponse.json({
        success: true,
        keys: keys,
        tier: verification.tier
    });

  } catch (error: any) {
    console.error('Roblox Verification Error:', error);
    return NextResponse.json(
        { error: error.message || 'Verification failed' }, 
        { status: 500 }
    );
  }
}
