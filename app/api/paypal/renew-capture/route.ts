import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { createJunkieFromEnv } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';
import { sendDiscordWebhook } from '@/lib/server/discord';

export async function POST(req: NextRequest) {
  try {
    const limitResult = rateLimit(`paypal:renew-capture:${getClientIp(req)}`, 10, 60_000);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const { orderID } = await req.json();
    if (!orderID) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    // Read Discord session
    let discordUser: { id: string; tag: string; avatar?: string } | null = null;
    try {
      const rawSession = req.cookies.get('discord_session')?.value;
      if (rawSession) {
        const normalizedSession = rawSession.includes('%') ? decodeURIComponent(rawSession) : rawSession;
        discordUser = JSON.parse(Buffer.from(normalizedSession, 'base64').toString('utf-8'));
      }
    } catch { /* non-fatal */ }

    if (!discordUser?.id) {
      return NextResponse.json({ error: 'Discord login required to renew.' }, { status: 401 });
    }

    const paypal = new PayPalSDK({
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      sandboxMode: process.env.PAYPAL_SANDBOX === 'true',
    });

    // 1. Capture payment
    const captureData = await paypal.captureOrder(orderID);
    const paymentInfo = paypal.extractPaymentInfo(captureData);
    if (paymentInfo.status !== 'COMPLETED') {
      throw new Error('Payment not completed');
    }
    await paypal.addTrackingToReleaseFunds(paymentInfo.transactionId);

    // 2. Find the user's most recent monthly key from DB
    const db = new TicketDatabase();
    const payments = await db.getUserPaymentsByDiscordId(discordUser.id);
    const monthlyOrder = payments?.find((p: any) =>
      (p.tier || '').toLowerCase() === 'monthly' &&
      (p.payment_status === 'COMPLETED' || p.payment_status === 'paid') &&
      Array.isArray(p.generated_keys) && p.generated_keys.length > 0
    );

    if (!monthlyOrder) {
      return NextResponse.json({ error: 'No active monthly key found for your account.' }, { status: 404 });
    }

    const keyValue: string = monthlyOrder.generated_keys[0];

    // 3. Find that key in Junkie and extend it by 30 days
    const junkie = createJunkieFromEnv();
    const junkieKey = await junkie.findKeyByValue(keyValue);

    if (!junkieKey) {
      return NextResponse.json({ error: 'Could not find your key in the key system. Contact support.' }, { status: 502 });
    }

    const extended = await junkie.extendKey(junkieKey.id, 30, junkieKey.expires_at);
    if (!extended) {
      return NextResponse.json({ error: 'Failed to extend your key. Contact support with your transaction ID.' }, { status: 502 });
    }

    // 4. Save renewal record for billing history
    await db.savePayment({
      transactionId: paymentInfo.transactionId,
      payerEmail: paymentInfo.payerEmail,
      payerId: paymentInfo.payerId,
      tier: 'monthly',
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      status: 'completed',
      keys: [keyValue],
      discordId: discordUser.id,
      discordTag: discordUser.tag,
      discordAvatar: discordUser.avatar,
    });

    // 5. Fire-and-forget Discord notification
    void sendDiscordWebhook(
      `<@442317061104861184> 🔄 Key Renewed!`,
      [{
        title: '🔄 Monthly Key Renewal',
        color: 0x7c3aed,
        fields: [
          { name: 'Discord', value: discordUser.tag ? `${discordUser.tag} (ID: \`${discordUser.id}\`)` : `ID: \`${discordUser.id}\``, inline: false },
          { name: 'Amount', value: `€${paymentInfo.amount}`, inline: true },
          { name: 'Transaction ID', value: paymentInfo.transactionId, inline: false },
          { name: 'Key Extended', value: `||${keyValue}||`, inline: false },
          { name: 'New Expiry', value: junkieKey.expires_at
            ? new Date(new Date(junkieKey.expires_at).getTime() + 30 * 86_400_000).toUTCString()
            : '+30 days from now', inline: false },
        ],
        timestamp: new Date().toISOString(),
      }]
    );

    return NextResponse.json({
      success: true,
      transactionId: paymentInfo.transactionId,
      key: keyValue,
      newExpiresAt: junkieKey.expires_at
        ? new Date(new Date(junkieKey.expires_at).getTime() + 30 * 86_400_000).toISOString()
        : new Date(Date.now() + 30 * 86_400_000).toISOString(),
    });

  } catch (error: any) {
    console.error('Renew Capture Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process renewal' }, { status: 500 });
  }
}
