import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/server/rate-limit';

const db = new TicketDatabase();

export async function POST(req: NextRequest) {
  // Per-visitor cap on guesses
  const ipLimit = rateLimit(`auth:verify:ip:${getClientIp(req)}`, 20, 15 * 60 * 1000);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'The code is 6 digits.' }, { status: 400 });
    }

    // Per-address cap: a 6-digit code has 1,000,000 possibilities, so only a handful
    // of guesses are allowed per window no matter how many IPs the attacker uses.
    const attempts = rateLimit(`auth:verify:email:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
    if (!attempts.allowed) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Request a new code in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((attempts.resetAt - Date.now()) / 1000))) } }
      );
    }

    // 1. Verify Code
    const verification = await db.verifyCode(email, code);

    if (!verification.success) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // 2. Return Success
    // In a real app we'd set a cookie here.
    // For this implementation, we'll return success and let the client handle state.
    return NextResponse.json({ success: true, message: 'Verified successfully' });

  } catch (error: any) {
    console.error('Verify Code Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
