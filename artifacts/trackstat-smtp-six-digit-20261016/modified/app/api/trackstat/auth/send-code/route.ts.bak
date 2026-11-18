import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/server/email';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { TRACKSTAT_URL } from '@/lib/trackstat-config';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:otp:ip:${getClientIp(req)}`, 5, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const text = await req.text();
    if (text.length > 512) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers });
    const value = JSON.parse(text).email;
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers });
    const serviceKey = process.env.TRACKSTAT_SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceKey) return NextResponse.json({ error: 'Trackstat sign-in is not configured yet.' }, { status: 503, headers });
    const cooldown = rateLimit(`trackstat:otp:email:${createHash('sha256').update(email).digest('hex')}`, 1, 60000);
    if (!cooldown.allowed) return rateLimitResponse(cooldown);
    const admin = createClient(TRACKSTAT_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (error || !data.properties) return NextResponse.json({ error: 'Could not create a sign-in code. Please try again shortly.' }, { status: 503, headers });
    const code = data.properties.email_otp;
    if (!/^[0-9]{6}$/.test(code)) return NextResponse.json({ error: 'Trackstat must be configured for six-digit verification codes.' }, { status: 503, headers });
    const result = await new EmailService().sendVerificationCode(email, code, 'trackstat');
    if (!result.success) return NextResponse.json({ error: 'Verification email could not be sent. Please try again shortly.' }, { status: 503, headers });
    return NextResponse.json({ sent: true }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Enter a valid email address.' : 'Verification email could not be sent. Please try again shortly.' }, { status: error instanceof SyntaxError ? 400 : 503, headers });
  }
}
