import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();
        if (!password) {
            return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
        }

        const db = new TicketDatabase();
        const isValid = await db.validateAdminPassword(password);

        if (isValid) {
            const token = Buffer.from(password).toString('base64');
            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
