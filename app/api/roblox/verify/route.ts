import { NextResponse } from 'next/server';
import { RobloxIntegration, ROBUX_PRICES } from '@/lib/server/roblox';
import { JunkieKeySystem } from '@/lib/server/junkie';
import { TicketDatabase } from '@/lib/server/db';
import {
    DiscordAuth,
    ROBUX_ORDER_COOKIE,
    ROBUX_ORDER_TTL_SECONDS,
    readDiscordAuth,
    readRobuxOrder,
    signValue,
} from '@/lib/server/clientSession';

const robloxIntegration = new RobloxIntegration();
const db = new TicketDatabase();

const junkieSystem = new JunkieKeySystem({
    webhookUrl: process.env.JUNKIE_WEBHOOK_URL,
    webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
    webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
    webhookUrlAnnual: process.env.JUNKIE_WEBHOOK_URL_ANNUAL,
    webhookUrlAnnualWeekly: process.env.JUNKIE_WEBHOOK_URL_ANNUAL_WEEKLY,
    webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
    hmacSecret: process.env.JUNKIE_HMAC_SECRET,
    hmacSecretAnnual: process.env.JUNKIE_HMAC_SECRET_ANNUAL,
    hmacHeaderAnnual: process.env.JUNKIE_HMAC_HEADER_ANNUAL,
    provider: process.env.JUNKIE_PROVIDER,
    defaultService: process.env.JUNKIE_SERVICE
});

const VALIDITY_HOURS: Record<string, number> = { monthly: 720, lifetime: 0 };
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

// Best-effort per-IP throttle (per server instance) so the endpoint can't be used to hammer Roblox
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) {
        for (const [key, times] of hits) if (times.every(t => now - t >= WINDOW_MS)) hits.delete(key);
    }
    return recent.length > MAX_REQUESTS;
}

type OwnershipState =
    | { state: 'private' | 'not_owned' | 'owned_before' | 'used' | 'claimed_by_other'; message?: string }
    | { state: 'claimable'; uaid: number; transactionId: string }
    | { state: 'retry'; uaid: number; transactionId: string };

const USED_MESSAGE = 'This item already received a key. To get a new key, delete it from your Roblox inventory and buy it again.';

/**
 * Decide what this Roblox account can do with the item right now.
 *  - A copy that already received a key is used up: it is ignored. The buyer has to delete the item and
 *    buy it again, which creates a new copy with a new unique ID.
 *  - A copy that existed before checkout started (baseline) can't be claimed here, which stops anyone
 *    from claiming an old purchase of a stranger. Those go through a support ticket.
 *  - A copy bought after checkout started, and not yet claimed, is claimable.
 */
async function evaluateOwnership(userId: number, tier: string, discordId: string, baseline: number[]): Promise<OwnershipState> {
    const productId = robloxIntegration.getProductId(tier)!;
    const owned = await robloxIntegration.listOwnedUaids(userId, productId);
    if (owned.error) return { state: 'private', message: owned.error };
    if (owned.uaids.length === 0) return { state: 'not_owned' };

    let retry: OwnershipState | null = null;
    let sawUsed = false;
    let sawClaimedByOther = false;
    let sawPreExisting = false;

    for (const uaid of [...owned.uaids].sort((a, b) => b - a)) {
        const transactionId = robloxIntegration.generateTransactionId(userId, productId, uaid);
        const existing = await db.getPayment(transactionId);
        if (existing) {
            if (existing.generated_keys?.length > 0) { sawUsed = true; continue; }
            // Claimed earlier but key generation failed: only that Discord account may retry
            if (existing.discord_id && existing.discord_id !== discordId) { sawClaimedByOther = true; continue; }
            if (!retry) retry = { state: 'retry', uaid, transactionId };
            continue;
        }
        if (baseline.includes(uaid)) { sawPreExisting = true; continue; }
        return { state: 'claimable', uaid, transactionId };
    }

    if (retry) return retry;
    if (sawPreExisting) {
        return {
            state: 'owned_before',
            message: 'You already owned this item before starting checkout. To claim it, open a support ticket on our Discord.'
        };
    }
    if (sawUsed) return { state: 'used', message: USED_MESSAGE };
    if (sawClaimedByOther) {
        return { state: 'claimed_by_other', message: 'This purchase was already claimed by another account. If it is yours, open a support ticket.' };
    }
    return { state: 'not_owned' };
}

function describe(result: OwnershipState) {
    return { state: result.state, message: 'message' in result ? result.message : undefined };
}

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (rateLimited(ip)) {
            return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
        }

        const body = await req.json();
        const action = String(body.action || '');
        const tier = String(body.tier || '').toLowerCase();

        if (!['start', 'check', 'claim'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        if (!['monthly', 'lifetime'].includes(tier)) {
            return NextResponse.json({ error: 'A valid plan (monthly or lifetime) is required' }, { status: 400 });
        }

        // The client account is the signed Discord login. The browser-readable cookie is never trusted here.
        const discord: DiscordAuth | null = readDiscordAuth(req.headers.get('cookie'));
        if (!discord) {
            return NextResponse.json({ error: 'Please log in with Discord again to continue.', needsLogin: true }, { status: 401 });
        }

        // ── START: pick the Roblox account and take a snapshot of the copies it already owns ──
        if (action === 'start') {
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            if (!USERNAME_PATTERN.test(username)) {
                return NextResponse.json({ error: 'Enter a valid Roblox username (3-20 letters, numbers or underscores)' }, { status: 400 });
            }

            let userId: number;
            try {
                userId = await robloxIntegration.getUserIdFromUsername(username);
            } catch {
                return NextResponse.json({ error: 'Roblox user not found' }, { status: 404 });
            }

            const blocked = await robloxIntegration.getBlockedUserIds();
            if (blocked.has(userId)) {
                return NextResponse.json({ error: 'This Roblox account belongs to the item creator or staff and cannot be used to claim a key.' }, { status: 403 });
            }

            // A Roblox account is locked to the first client account that claimed with it
            const linkedDiscordId = await db.getRobloxLinkedDiscordId(userId);
            if (linkedDiscordId && linkedDiscordId !== discord.id) {
                return NextResponse.json({
                    error: 'This Roblox account is already linked to another client account. If it is yours, open a support ticket.'
                }, { status: 409 });
            }

            const productId = robloxIntegration.getProductId(tier)!;
            const owned = await robloxIntegration.listOwnedUaids(userId, productId);
            if (owned.error) return NextResponse.json({ success: true, state: 'private', message: owned.error });

            const res = NextResponse.json({ success: true, ...describe(await evaluateOwnership(userId, tier, discord.id, owned.uaids)) });
            res.cookies.set(
                ROBUX_ORDER_COOKIE,
                signValue({ discordId: discord.id, userId, username, tier, baseline: owned.uaids, exp: Math.floor(Date.now() / 1000) + ROBUX_ORDER_TTL_SECONDS }),
                { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: ROBUX_ORDER_TTL_SECONDS, path: '/' }
            );
            return res;
        }

        // ── CHECK / CLAIM need the order created by START, for this Discord account and plan ──
        const order = readRobuxOrder(req.headers.get('cookie'));
        if (!order || order.discordId !== discord.id || order.tier !== tier) {
            return NextResponse.json({ error: 'Please enter your Roblox username and press Continue first.', needsStart: true }, { status: 400 });
        }

        const blocked = await robloxIntegration.getBlockedUserIds();
        if (blocked.has(order.userId)) {
            return NextResponse.json({ error: 'This Roblox account belongs to the item creator or staff and cannot be used to claim a key.' }, { status: 403 });
        }
        const linkedDiscordId = await db.getRobloxLinkedDiscordId(order.userId);
        if (linkedDiscordId && linkedDiscordId !== discord.id) {
            return NextResponse.json({ error: 'This Roblox account is already linked to another client account. If it is yours, open a support ticket.' }, { status: 409 });
        }

        const ownership = await evaluateOwnership(order.userId, tier, discord.id, order.baseline);

        if (action === 'check') {
            return NextResponse.json({ success: true, ...describe(ownership) });
        }

        // ── CLAIM ──
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        if (!email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required for backup' }, { status: 400 });
        }

        const validityHours = VALIDITY_HOURS[tier] ?? 0;

        if (ownership.state !== 'claimable' && ownership.state !== 'retry') {
            const messages: Record<string, string> = {
                not_owned: `We can't see the item in your inventory yet. Buy it on Roblox first, then press Verify.`,
                private: ('message' in ownership && ownership.message) || 'Your Roblox inventory is private.',
                owned_before: ('message' in ownership && ownership.message) || 'Open a support ticket to claim this purchase.',
                used: USED_MESSAGE,
                claimed_by_other: ('message' in ownership && ownership.message) || 'This purchase was already claimed.',
            };
            return NextResponse.json({ success: false, error: messages[ownership.state], state: ownership.state }, { status: 400 });
        }

        const transactionId = ownership.transactionId;
        const uaid = ownership.uaid;
        let isNewClaim = false;

        if (ownership.state === 'claimable') {
            const methodStocks = await db.getPaymentMethodStocks();
            if ((methodStocks[tier]?.robux ?? 0) <= 0) {
                return NextResponse.json({ success: false, error: 'This premium plan is out of stock' }, { status: 409 });
            }

            // Claim the purchase. transaction_id is UNIQUE and contains the UAID, so only one request can win.
            try {
                await db.savePayment({
                    transactionId,
                    payerEmail: email,
                    payerId: `ROBLOX_${order.userId}`,
                    robloxUsername: order.username,
                    robloxUaid: uaid,
                    tier,
                    amount: ROBUX_PRICES[tier] ?? 0,
                    currency: 'ROBUX',
                    status: 'processing',
                    keys: null,
                    discordId: discord.id,
                    discordTag: discord.tag,
                    discordAvatar: discord.avatar
                });
                isNewClaim = true;
            } catch (err: any) {
                if (err?.code === '23505') {
                    return NextResponse.json({ success: false, error: 'This purchase is already being processed. Please try again in a few seconds.' }, { status: 409 });
                }
                throw err;
            }
        }
        // (retry: an earlier attempt claimed this copy but key generation failed, so try again without taking stock twice)

        const keyResult = await junkieSystem.generateKey({
            tier,
            validity: validityHours,
            quantity: 1,
            userInfo: { email, payerId: `ROBLOX_${order.userId}`, robloxUsername: order.username },
            paymentInfo: { amount: 0, currency: 'ROBUX', transactionId }
        });

        if (!keyResult.success || !keyResult.keys || keyResult.keys.length === 0) {
            console.error('❌ Key generation failed:', keyResult.error);
            return NextResponse.json({ success: false, error: 'Key generation failed. Please try again or contact support.' }, { status: 500 });
        }

        await db.updatePaymentKeys(transactionId, keyResult.keys);
        if (isNewClaim) await db.decrementPaymentMethodStock(tier, 'robux');

        // Discord webhook is sent after the user completes game selection (see /api/orders/[id]/game-selection)
        return NextResponse.json({
            success: true,
            keys: keyResult.keys,
            tier,
            transactionId,
            userId: order.userId,
            username: order.username,
            expiryDate: validityHours > 0 ? new Date(Date.now() + validityHours * 3600000).toISOString() : null,
            message: 'Purchase verified!'
        });

    } catch (error: any) {
        console.error('❌ Error verifying Roblox purchase:', error);
        return NextResponse.json({ error: 'Failed to verify purchase' }, { status: 500 });
    }
}
