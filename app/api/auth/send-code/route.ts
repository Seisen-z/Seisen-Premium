import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/server/rate-limit';

const db = new TicketDatabase();
const emailService = new EmailService();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  // Per-visitor cap: stops one client from mass-mailing codes or probing which emails have accounts
  const ipLimit = rateLimit(`auth:send:ip:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    // Per-address cap: nobody can flood one inbox with codes, whatever IPs they use
    const emailKey = email.toLowerCase();
    const cooldown = rateLimit(`auth:send:cooldown:${emailKey}`, 1, 45 * 1000);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: 'A code was just sent. Please wait a moment before requesting another.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((cooldown.resetAt - Date.now()) / 1000))) } }
      );
    }
    const hourly = rateLimit(`auth:send:email:${emailKey}`, 5, 60 * 60 * 1000);
    if (!hourly.allowed) return rateLimitResponse(hourly);

    // 1. Check if user exists (has purchased before)
    const exists = await db.checkUserExists(email);

    if (!exists) {
        return NextResponse.json({
            error: 'No account found with this email. Please ensure you are using the email from your purchase.'
        }, { status: 404 });
    }

    // 2. Generate a code with a cryptographically secure RNG
    const code = randomInt(100000, 1000000).toString();

    // 3. Save Code to DB
    await db.createVerificationCode(email, code);

    // 4. Send Email
    const result = await emailService.sendVerificationCode(email, code);

    if (!result.success) {
        return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent.' });

  } catch (error: any) {
    console.error('Send Code Error:', error);
    // Don't leak internal error text to the client
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
