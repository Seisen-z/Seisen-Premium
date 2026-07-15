import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

async function isAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = Buffer.from(token, 'base64').toString('ascii');
        const db = new TicketDatabase();
        return await db.validateAdminPassword(decoded);
    } catch {
        return false;
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: ticketId } = await params;
        const body = await req.json();
        const { status } = body;

        const db = new TicketDatabase();
        await db.updateStatus(ticketId, status);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
