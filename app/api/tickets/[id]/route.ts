import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await params;
        const db = new TicketDatabase();
        
        const ticket = await db.getTicket(ticketId);
        
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const replies = await db.getReplies(ticketId);

        return NextResponse.json({ success: true, ticket, replies });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await params;
        const body = await req.json();
        const { message, authorName, authorType } = body;

        if (!message || !authorName) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = new TicketDatabase();
        
        // authorType defaults to 'user' for client API
        const replyId = await db.addReply(ticketId, {
            authorType: authorType || 'user',
            authorName,
            message
        });

        if (authorType !== 'admin' && authorType !== 'support') {
            await db.updateStatus(ticketId, 'open');
        }

        return NextResponse.json({ success: true, replyId });

    } catch (error: any) {
        console.error('Add Reply Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await params;
        const body = await req.json();
        
        if (body.action === 'mark_read') {
            const db = new TicketDatabase();
            const ticket = await db.getTicket(ticketId);
            if (ticket && ticket.status === 'replied') {
                await db.updateStatus(ticketId, 'open');
            }
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
