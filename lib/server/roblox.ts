// Catalog items (clothing) that grant a key when owned.
export const ROBLOX_PRODUCTS: Record<string, number> = {
    lifetime: 16906166414, // Seisen Hub Perm    — 2600 Robux
    monthly: 16902308978   // Seisen Hub Monthly — 1900 Robux
};

export const ROBUX_PRICES: Record<string, number> = {
    lifetime: 2600,
    monthly: 1900
};

// The group that publishes the items. Its owner and staff always "own" the
// items for free, so they must never be accepted as a purchase.
const CREATOR_GROUP_ID = 34071607;
const CREATOR_OWNER_USER_ID = 457806057;
const STAFF_CACHE_TTL_MS = 10 * 60 * 1000;

let blockedCache: { ids: Set<number>; expires: number } | null = null;

export class RobloxIntegration {
    private products: Record<string, number>;
    private robloxApiUrl: string;

    constructor(config?: { apiKey?: string }) {
        this.products = { ...ROBLOX_PRODUCTS };
        this.robloxApiUrl = 'https://inventory.roblox.com/v1/users';
    }

    /**
     * User IDs that can never claim a key: the group owner, every group member
     * above the base member rank (staff/developers/testers), plus anything in
     * ROBLOX_BLOCKED_USER_IDS. Cached; falls back to the static list if Roblox is unreachable.
     */
    async getBlockedUserIds(): Promise<Set<number>> {
        if (blockedCache && blockedCache.expires > Date.now()) return blockedCache.ids;

        const ids = new Set<number>([CREATOR_OWNER_USER_ID]);
        for (const raw of (process.env.ROBLOX_BLOCKED_USER_IDS || '').split(',')) {
            const n = Number(raw.trim());
            if (Number.isInteger(n) && n > 0) ids.add(n);
        }

        try {
            const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${CREATOR_GROUP_ID}`);
            if (groupRes.ok) {
                const group = await groupRes.json();
                if (group?.owner?.userId) ids.add(Number(group.owner.userId));
            }

            const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${CREATOR_GROUP_ID}/roles`);
            if (rolesRes.ok) {
                const { roles } = await rolesRes.json();
                for (const role of (roles || []).filter((r: any) => r.rank > 1)) {
                    let cursor = '';
                    do {
                        const usersRes = await fetch(
                            `https://groups.roblox.com/v1/groups/${CREATOR_GROUP_ID}/roles/${role.id}/users?limit=100${cursor ? `&cursor=${cursor}` : ''}`
                        );
                        if (!usersRes.ok) break;
                        const page = await usersRes.json();
                        for (const u of page.data || []) ids.add(Number(u.userId));
                        cursor = page.nextPageCursor || '';
                    } while (cursor);
                }
            }
            blockedCache = { ids, expires: Date.now() + STAFF_CACHE_TTL_MS };
        } catch (error: any) {
            console.error('Failed to refresh blocked Roblox users:', error.message);
            // Keep the previous list if we have one, otherwise use the static one and retry soon
            if (blockedCache) {
                blockedCache.ids.forEach(id => ids.add(id));
            }
            blockedCache = { ids, expires: Date.now() + 60 * 1000 };
        }

        return ids;
    }

    /**
     * Unique transaction ID per purchased copy: user + product + the item's own unique ID (UAID).
     * Buying again (after deleting the item) creates a new UAID, so it is a separate transaction.
     */
    generateTransactionId(userId: number, productId: number, uaid: number): string {
        return `ROBLOX-${userId}-${productId}-${uaid}`;
    }

    /**
     * Get Roblox User ID from username
     */
    async getUserIdFromUsername(username: string): Promise<number> {
        try {
            const response = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: false
                })
            });

            if (!response.ok) {
                throw new Error(`Roblox API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.data && data.data.length > 0) {
                return data.data[0].id;
            }

            throw new Error('User not found');
        } catch (error: any) {
            console.error('Error getting user ID:', error.message);
            throw new Error('Failed to find Roblox user');
        }
    }

    /**
     * Check if user owns the product (checks Asset and GamePass)
     */
    async userOwnsProduct(userId: number, productId: number): Promise<{ owned: boolean; uaid: number | null; created?: string; error?: string }> {
        try {
            console.log(`🔍 Checking ownership for User: ${userId}, Product: ${productId}`);

            let isPrivate = false;

            // 1. Try checking as an ASSET (Catalog item)
            try {
                const assetResponse = await fetch(
                    `${this.robloxApiUrl}/${userId}/items/Asset/${productId}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                
                if (assetResponse.status === 403) {
                    isPrivate = true;
                }

                if (assetResponse.ok) {
                    const data = await assetResponse.json();
                    if (data && data.data && data.data.length > 0) {
                        const item = data.data[0];
                        console.log(`✅ Found ownership via Asset endpoint for product ${productId}. UAID: ${item.instanceId}`);
                        return { owned: true, uaid: item.instanceId, created: item.created };
                    }
                }
            } catch (err) {
                 // Ignore
            }

            // 2. Try checking as a GAMEPASS
            try {
                const gamePassResponse = await fetch(
                    `${this.robloxApiUrl}/${userId}/items/GamePass/${productId}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                
                if (gamePassResponse.status === 403) {
                    isPrivate = true;
                }

                if (gamePassResponse.ok) {
                    const data = await gamePassResponse.json();
                    if (data && data.data && data.data.length > 0) {
                         const item = data.data[0];
                        console.log(`✅ Found ownership via GamePass endpoint for product ${productId}. UAID: ${item.instanceId}`);
                        return { owned: true, uaid: item.instanceId, created: item.created };
                    }
                }
            } catch (err) {
                // Ignore
            }

            if (isPrivate) {
                return { 
                    owned: false, 
                    uaid: null, 
                    error: 'Your Roblox inventory is private. Please go to Roblox Settings > Privacy and set "Who can see my inventory?" to "Everyone", then try again.' 
                };
            }

            return { owned: false, uaid: null };

        } catch (error: any) {
             // 403 means private inventory
             // In a fetch environment, check response status in the try blocks above
            console.error('Error checking ownership:', error.message);
            return { owned: false, uaid: null, error: 'Failed to check ownership due to an API error.' };
        }
    }

    /**
     * Every copy of the item this user owns (each copy has its own unique UAID).
     */
    async listOwnedUaids(userId: number, productId: number): Promise<{ uaids: number[]; error?: string }> {
        try {
            const res = await fetch(`${this.robloxApiUrl}/${userId}/items/Asset/${productId}`, {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (res.status === 403) {
                return {
                    uaids: [],
                    error: 'Your Roblox inventory is private. Please go to Roblox Settings > Privacy and set "Who can see my inventory?" to "Everyone", then try again.'
                };
            }
            if (!res.ok) return { uaids: [], error: 'Failed to check ownership due to a Roblox API error. Please try again.' };
            const data = await res.json();
            const uaids = (data?.data || []).map((item: any) => Number(item.instanceId)).filter((n: number) => Number.isFinite(n) && n > 0);
            return { uaids };
        } catch {
            return { uaids: [], error: 'Failed to check ownership due to a Roblox API error. Please try again.' };
        }
    }

    getProductId(tier: string): number | null {
        return this.products[tier] ?? null;
    }

    /**
     * Verify purchase and get user info
     */
    async verifyPurchase(username: string, targetTier: string | null = null, knownUserId?: number) {
        try {
            // Prefer the ID proven by Roblox OAuth; only fall back to a username lookup without it
            const userId = knownUserId ?? await this.getUserIdFromUsername(username);
            console.log(`👤 Verifying purchase for ${username} (${userId}). Target: ${targetTier || 'Any'}`);

            // The creator/owner/staff of the item always own it for free — never treat that as a purchase
            const blocked = await this.getBlockedUserIds();
            if (blocked.has(userId)) {
                return {
                    success: false,
                    error: 'This Roblox account belongs to the item creator or staff and cannot be used to claim a key.',
                    userId,
                    username
                };
            }

            // If a specific tier is requested, check ONLY that one (Strict Mode)
            if (targetTier && this.products[targetTier]) {
                const productId = this.products[targetTier];
                console.log(`🔒 STRICT MODE: Checking only ${targetTier} tier (ID: ${productId})...`);
                
                const result = await this.userOwnsProduct(userId, productId);
                
                if (result.owned) {
                    console.log(`🎉 User owns ${targetTier} tier! UAID: ${result.uaid}`);
                    return {
                        success: true,
                        userId,
                        username,
                        productId: productId,
                        tier: targetTier,
                        uaid: result.uaid,
                        created: result.created
                    };
                } else {
                    console.log(`❌ User does not own ${targetTier} tier.`);
                    return {
                        success: false,
                        error: result.error || `User does not own the ${targetTier} product`,
                        userId,
                        username
                    };
                }
            }

            // Fallback: Check tiers in order of priority (Best Tier Mode)
            const tiers = ['lifetime', 'monthly'];
            let lastError: string | null = null;
            
            for (const tier of tiers) {
                const productId = this.products[tier];
                console.log(`Checking ${tier} tier (ID: ${productId})...`);
                
                const result = await this.userOwnsProduct(userId, productId);
                
                if (result.owned) {
                    console.log(`🎉 User owns ${tier} tier! UAID: ${result.uaid}`);
                    return {
                        success: true,
                        userId,
                        username,
                        productId: productId,
                        tier: tier,
                        uaid: result.uaid,
                        created: result.created
                    };
                }
                
                if (result.error) {
                    lastError = result.error;
                }
            }

            console.log('❌ User does not own any product');
            return {
                success: false,
                error: lastError || 'User does not own any product',
                userId,
                username
            };
        } catch (error: any) {
            console.error('❌ Detailed Verification Error:', error.message);
            
            return {
                success: false,
                error: `Verification failed: ${error.message}`
            };
        }
    }

    getTierForProduct(productId: number | string): string {
         for (const [key, value] of Object.entries(this.products)) {
            if (value === Number(productId)) {
                return key;
            }
        }
        return 'lifetime';
    }
}
