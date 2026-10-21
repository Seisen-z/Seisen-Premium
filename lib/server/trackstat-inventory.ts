import type { InventoryStack } from '@/lib/trackstat';

const url = process.env.TRACKSTAT_SERVER_URL;
const token = process.env.TRACKSTAT_SERVER_TOKEN;
type SavedInventory = { inventory: InventoryStack[]; updated: number; etag?: string };
const inventories = new Map<string, { data: SavedInventory; size: number }>();
let inventoryBytes = 0;

// The newest inventory the Trackstat server holds for one account and game, or null when it has none or cannot be reached
export async function serverInventory(account: string | null | undefined, game: string): Promise<SavedInventory | null> {
  if (!url || !token || !account) return null;
  try {
    const key = `${account}:${game}`, cached = inventories.get(key);
    const response = await fetch(`${url}/v1/inventory?account=${encodeURIComponent(account)}&game=${encodeURIComponent(game)}`, { headers: { Authorization: `Bearer ${token}`, ...(cached?.data.etag ? { 'If-None-Match': cached.data.etag } : {}) }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (response.status === 304 && cached) { inventories.delete(key); inventories.set(key, cached); return cached.data; }
    if (!response.ok) return null;
    const text = await response.text();
    const found = JSON.parse(text) as { inventory: InventoryStack[] | null; updated: number | null };
    if (cached) { inventoryBytes -= cached.size; inventories.delete(key); }
    if (!found.inventory || !found.updated) return null;
    const data = { inventory: found.inventory, updated: found.updated, etag: response.headers.get('ETag') ?? undefined };
    const size = text.length * 4;
    if (size <= 16 * 1024 * 1024) {
      inventories.set(key, { data, size }); inventoryBytes += size;
      while (inventories.size > 100 || inventoryBytes > 16 * 1024 * 1024) {
        const oldest = inventories.keys().next().value!;
        inventoryBytes -= inventories.get(oldest)!.size; inventories.delete(oldest);
      }
    }
    return data;
  } catch { return null; }
}

export async function queueThumbnails(game: string, icons: string[]) {
  if (!url || !token || !icons.length) return;
  try {
    await fetch(`${url}/v1/thumbnails`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ game, icons }), cache: 'no-store', signal: AbortSignal.timeout(6000) });
  } catch { /* stored pictures remain usable during server maintenance */ }
}

// Totals the Trackstat server keeps about its own storage, for the admin page
export async function serverStats(): Promise<unknown | null> {
  if (!url || !token) return null;
  try {
    const response = await fetch(`${url}/v1/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
