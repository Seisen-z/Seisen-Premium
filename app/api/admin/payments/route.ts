import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { verifyAdminSession } from '@/lib/server/adminSession';
import { createJunkieFromEnv } from '@/lib/server/junkie';
import { reissueKeys } from '@/lib/server/fulfillment';

async function isAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return verifyAdminSession(token);
}

export async function GET(req: NextRequest) {
    const authorized = await isAdmin(req);
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new TicketDatabase();
        const payments = await db.getAllPayments();
        const stats = await db.getVisitorStats(); 
        
        const paypalPayments = payments.filter((p: any) => p.currency !== 'ROBUX');
        const robloxPayments = payments.filter((p: any) => p.currency === 'ROBUX');
        const paypalRevenue = paypalPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const robloxRevenue = robloxPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        return NextResponse.json({ 
            success: true, 
            payments,
            stats: {
                totalPurchases: payments.length,
                paypalPurchases: paypalPayments.length,
                robloxPurchases: robloxPayments.length,
                paypalRevenue,
                robloxRevenue
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const authorized = await isAdmin(req);
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { transactionId } = await req.json();
        if (!transactionId) {
            return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
        }

        const db = new TicketDatabase();
        await db.deletePayment(transactionId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authorized = await isAdmin(req);
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { transactionId, quantity } = await req.json();
        if (!transactionId) {
            return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
        }

        const qty = Math.max(1, Math.min(10, parseInt(String(quantity || '1'), 10) || 1));
        const result = await reissueKeys(new TicketDatabase(), createJunkieFromEnv(), transactionId, qty);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ success: true, keys: result.keys });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
