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
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new TicketDatabase();
        const tickets = await db.getAllTickets();
        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!await isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ticketNumber } = await req.json();
        if (!ticketNumber) {
            return NextResponse.json({ error: 'ticketNumber required' }, { status: 400 });
        }

        const db = new TicketDatabase();
        await db.deleteTicket(ticketNumber);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
