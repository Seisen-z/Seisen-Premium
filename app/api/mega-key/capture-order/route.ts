import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { sendDiscordWebhook } from '@/lib/server/discord';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';

const MEGA_PLAN_CONFIG: Record<string, { amount: number; label: string; validityHours: number }> = {
  mega_1month: { amount: 40, label: '1 Month', validityHours: 720 },
  mega_2month: { amount: 70, label: '2 Months', validityHours: 1440 },
};

export async function POST(req: NextRequest) {
  try {
    const limitResult = rateLimit(`mega-key:capture:${getClientIp(req)}`, 10, 60_000);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    let discordUser: { id: string; tag: string; username: string; email: string | null; avatar?: string } | null = null;
    try {
      const rawSession = req.cookies.get('discord_session')?.value;
      if (rawSession) {
        const normalized = rawSession.includes('%') ? decodeURIComponent(rawSession) : rawSession;
        discordUser = JSON.parse(Buffer.from(normalized, 'base64').toString('utf-8'));
      }
    } catch { /* non-fatal */ }

    const paypal = new PayPalSDK({
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      sandboxMode: process.env.PAYPAL_SANDBOX === 'true',
    });

    const captureData = await paypal.captureOrder(orderID);
    const paymentInfo = paypal.extractPaymentInfo(captureData);

    if (paymentInfo.status !== 'COMPLETED') {
      throw new Error('Payment not completed');
    }

    await paypal.addTrackingToReleaseFunds(paymentInfo.transactionId);

    // Determine plan from the custom_id stored on the PayPal order
    const plan = (paymentInfo.tier || 'mega_1month').toLowerCase();
    const planConfig = MEGA_PLAN_CONFIG[plan] ?? MEGA_PLAN_CONFIG.mega_1month;

    const webhookUrl = plan === 'mega_2month'
      ? process.env.JUNKIE_WEBHOOK_URL_MEGA_2MONTH
      : process.env.JUNKIE_WEBHOOK_URL_MEGA_1MONTH;

    const junkie = new JunkieKeySystem({
      webhookUrl,
      hmacSecret: process.env.JUNKIE_HMAC_SECRET_MEGA || 'seisen',
      hmacHeader: process.env.JUNKIE_HMAC_HEADER_MEGA || 'seisen',
      provider: 'SeisenPremium',
      defaultService: 'Mega Key',
    });

    const db = new TicketDatabase();

    // Idempotency guard
    try {
      await db.savePayment({
        transactionId: paymentInfo.transactionId,
        payerEmail: paymentInfo.payerEmail,
        payerId: paymentInfo.payerId,
        tier: plan,
        amount: planConfig.amount,
        currency: 'USD',
        status: 'processing',
        keys: [],
        discordId: discordUser?.id,
        discordTag: discordUser?.tag,
        discordAvatar: discordUser?.avatar,
      });
    } catch (err: any) {
      if (err?.code === '23505') {
        const existing = await db.getPayment(paymentInfo.transactionId);
        if (existing?.generated_keys?.length > 0) {
          return NextResponse.json({
            success: true,
            transactionId: existing.transaction_id,
            tier: existing.tier,
            amount: planConfig.amount,
            currency: 'USD',
            keys: existing.generated_keys,
            payerEmail: existing.payer_email,
            payerId: existing.payer_id,
          });
        }
      } else {
        throw err;
      }
    }

    const keyResult = await junkie.generateKey({
      tier: 'mega',
      validity: planConfig.validityHours,
      quantity: 1,
      userInfo: {
        email: paymentInfo.payerEmail,
        payerId: paymentInfo.payerId,
      },
      paymentInfo: {
        amount: planConfig.amount,
        currency: 'USD',
        transactionId: paymentInfo.transactionId,
      },
    });

    const keys = keyResult.keys ?? [];
    await db.updatePaymentKeys(paymentInfo.transactionId, keys);

    // Discord notification
    const keyDisplay = keys.length > 0
      ? keys.map((k, i) => `**Key ${i + 1}:** ||${k}||`).join('\n')
      : '⚠️ Key generation failed — check Mega Key Junkie webhook';

    void sendDiscordWebhook(
      `<@442317061104861184> 💰 New Mega Key Purchase!`,
      [{
        title: `🔑 Mega Key Purchase — ${planConfig.label}`,
        color: 0x4ade80,
        fields: [
          { name: 'Plan',           value: planConfig.label,                         inline: true },
          { name: 'Amount',         value: `$${planConfig.amount} USD`,              inline: true },
          { name: 'Transaction ID', value: paymentInfo.transactionId,                inline: false },
          { name: 'Customer Email', value: paymentInfo.payerEmail || 'N/A',          inline: false },
          { name: '🎮 Discord',    value: discordUser?.tag
              ? `${discordUser.tag} (ID: \`${discordUser.id}\`)`
              : '⚠️ Not linked',                                                     inline: false },
          { name: 'License Key',    value: keyDisplay,                               inline: false },
        ],
        timestamp: new Date().toISOString(),
      }]
    );

    return NextResponse.json({
      success: keyResult.success,
      transactionId: paymentInfo.transactionId,
      tier: plan,
      amount: planConfig.amount,
      currency: 'USD',
      keys,
      payerEmail: paymentInfo.payerEmail,
      payerId: paymentInfo.payerId,
      junkieError: keyResult.success ? null : keyResult.error,
    });

  } catch (error: any) {
    console.error('Mega Key capture error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture order' }, { status: 500 });
  }
}
