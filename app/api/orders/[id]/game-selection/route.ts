import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { games } = body as { games: string[] };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one game must be selected' }, { status: 400 });
    }

    const db = new TicketDatabase();

    // Verify the order exists first
    const payment = await db.getPayment(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const ok = await db.updateGameSelection(id, games);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to save game selection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving game selection:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
