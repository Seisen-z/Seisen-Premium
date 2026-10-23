import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { createAdminSession } from '@/lib/server/adminSession';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
    // Guessing the password is slowed down to 8 tries per 15 minutes per visitor
    const limit = rateLimit(`admin:login:${getClientIp(req)}`, 8, 15 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit);
    try {
        const { password } = await req.json();
        if (!password) {
            return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
        }

        const db = new TicketDatabase();
        const isValid = await db.validateAdminPassword(password);

        if (isValid) {
            const token = createAdminSession();
            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
