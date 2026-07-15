import { NextResponse } from 'next/server';

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic sweep so IPs that stop hitting the API don't sit in memory forever.
// This is process-local — fine for a single `next start` server, but won't
// share state across multiple instances/replicas.
const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}, 5 * 60 * 1000);
sweepInterval.unref?.();

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/** Fixed-window rate limit. `key` should already include the route + client identity. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + windowMs;
        buckets.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    bucket.count += 1;
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

export function rateLimitResponse(result: RateLimitResult) {
    return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
            status: 429,
            headers: { 'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))) },
        }
    );
}
