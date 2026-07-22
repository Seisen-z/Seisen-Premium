import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { verifyAdminSession } from '@/lib/server/adminSession';

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
