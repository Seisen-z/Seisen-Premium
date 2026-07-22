import crypto from 'crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return secret;
}

function sign(encodedPayload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

export function createAdminSession(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(token: string | null | undefined): boolean {
  if (!token) return false;

  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return false;

  let expectedSig: string;
  try {
    expectedSig = sign(encoded);
  } catch {
    return false;
  }

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    return typeof payload.exp === 'number' && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
