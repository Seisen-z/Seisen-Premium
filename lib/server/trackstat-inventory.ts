import type { InventoryStack } from '@/lib/trackstat';

const url = process.env.TRACKSTAT_SERVER_URL;
const token = process.env.TRACKSTAT_SERVER_TOKEN;

// The newest inventory the Trackstat server holds for one account and game, or null when it has none or cannot be reached
export async function serverInventory(account: string | null | undefined, game: string): Promise<{ inventory: InventoryStack[]; updated: number } | null> {
  if (!url || !token || !account) return null;
  try {
    const response = await fetch(`${url}/v1/inventory?account=${encodeURIComponent(account)}&game=${encodeURIComponent(game)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const found = await response.json() as { inventory: InventoryStack[] | null; updated: number | null };
    return found.inventory && found.updated ? { inventory: found.inventory, updated: found.updated } : null;
  } catch { return null; }
}

// Totals the Trackstat server keeps about its own storage, for the admin page
export async function serverStats(): Promise<unknown | null> {
  if (!url || !token) return null;
  try {
    const response = await fetch(`${url}/v1/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
