export class RobloxIntegration {
    private products: Record<string, number>;
    private robloxApiUrl: string;

    constructor(config?: { apiKey?: string }) {
        this.products = {
            lifetime: 1781366430, // Lifetime
            monthly: 1781384489,  // Monthly
            weekly: 1779578553    // Weekly
        };
        this.robloxApiUrl = 'https://inventory.roblox.com/v1/users';
        console.log('✅ Roblox Integration initialized with products:', this.products);
    }

    /**
     * Generate a unique transaction ID for Roblox purchases
     */
    generateTransactionId(userId: number, productId: number): string {
        return `ROBLOX-${userId}-${productId}`;
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
     * Verify purchase and get user info
     */
    async verifyPurchase(username: string, targetTier: string | null = null) {
        try {
            // Get user ID from username
            const userId = await this.getUserIdFromUsername(username);
            console.log(`👤 Verifying purchase for ${username} (${userId}). Target: ${targetTier || 'Any'}`);

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
            const tiers = ['lifetime', 'monthly', 'weekly'];
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
