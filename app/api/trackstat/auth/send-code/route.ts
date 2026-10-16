import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/server/email';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { TRACKSTAT_URL } from '@/lib/trackstat-config';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
// Counted in the database so the limit holds across serverless instances; falls back to this instance if that call fails
async function limited(admin: SupabaseClient, bucket: string, max: number, seconds: number) {
  const { data, error } = await admin.rpc('trackstat_rate_limit', { p_bucket: bucket, p_limit: max, p_window_seconds: seconds });
  if (!error && data) return data.allowed ? null : rateLimitResponse({ allowed: false, remaining: 0, resetAt: Date.now() + Number(data.retryAfter) * 1000 });
  const local = rateLimit(bucket, max, seconds * 1000);
  return local.allowed ? null : rateLimitResponse(local);
}
// true = passed, false = rejected, null = Cloudflare could not be reached
async function turnstilePassed(secret: string, token: string, ip: string) {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(5000) });
    return (await response.json()).success === true;
  } catch { return null; }
}
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const limit = rateLimit(`trackstat:otp:ip:${getClientIp(req)}`, 5, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const text = await req.text();
    if (text.length > 4096) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers });
    const parsed = JSON.parse(text);
    const value = parsed.email;
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers });
    // Checked first so bots are turned away before they use any of the limits or send an email; skipped until a secret key is configured
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    if (secret) {
      const token = typeof parsed.token === 'string' ? parsed.token : '';
      const passed = token && token.length <= 2048 ? await turnstilePassed(secret, token, getClientIp(req)) : false;
      if (passed === null) return NextResponse.json({ error: 'Could not run the security check. Please try again shortly.' }, { status: 503, headers });
      if (!passed) return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400, headers });
    }
    const serviceKey = process.env.TRACKSTAT_SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceKey) return NextResponse.json({ error: 'Trackstat sign-in is not configured yet.' }, { status: 503, headers });
    const admin = createClient(TRACKSTAT_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const emailHash = createHash('sha256').update(email).digest('hex');
    const blocked = await limited(admin, `otp:email:${emailHash}`, 1, 60) ?? await limited(admin, `otp:email-hour:${emailHash}`, 5, 3600)
      ?? await limited(admin, `otp:ip-hour:${createHash('sha256').update(getClientIp(req)).digest('hex')}`, 15, 3600);
    if (blocked) return blocked;
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
