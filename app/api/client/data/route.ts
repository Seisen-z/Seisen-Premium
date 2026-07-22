import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

const db = new TicketDatabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch Payments
    const payments = await db.getUserPayments(email);

    // Calculate Stats
    const totalOrders = payments.length;
    const totalSpent = payments.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0).toFixed(2);
    
    const latestPayment = payments[0];
    const activePlan = latestPayment ? latestPayment.tier : 'None';

    // Calculate subscription expiry from the most recent completed payment
    const TIER_DAYS: Record<string, number | null> = { weekly: 7, monthly: 30, lifetime: null };
    let subscription: { tier: string; expiresAt: string | null; daysRemaining: number | null } | null = null;

    const activePaid = payments.find((p: any) =>
      (p.payment_status === 'COMPLETED' || p.payment_status === 'paid') &&
      ['weekly', 'monthly', 'lifetime'].includes((p.tier || '').toLowerCase())
    );

    if (activePaid) {
      const tier = (activePaid.tier || '').toLowerCase();
      const days = TIER_DAYS[tier] ?? null;
      const createdAt = new Date(activePaid.created_at);
      const expiresAt = days !== null ? new Date(createdAt.getTime() + days * 86400000) : null;
      const daysRemaining = expiresAt !== null
        ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
        : null;

      subscription = {
        tier,
        expiresAt: expiresAt?.toISOString() ?? null,
        daysRemaining,
      };
    }

    const accountStatus = subscription
      ? (subscription.daysRemaining === null || subscription.daysRemaining > 0 ? 'Active' : 'Expired')
      : 'No active plan';

    return NextResponse.json({
        success: true,
        data: {
            orders: payments.slice(0, 5),
            stats: { totalOrders, totalSpent, activePlan, accountStatus },
            subscription,
        }
    });

  } catch (error: any) {
    console.error('Client Data API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
