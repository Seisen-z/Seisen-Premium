'use client';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';
import { trackstatFetch } from './trackstat-auth';
import { cacheGet, cacheNamespace, cacheSet } from './trackstat-cache';

export type InventoryResult = { catalog: Record<string, CatalogEntry>; inventory: InventoryStack[] | null; updatedAt: string | null };

// Shows the saved inventory at once and only asks the server when the account has synced since it was saved
export async function loadInventory(roblox: string, game: 'ps' | 'sae', latestUpdatedAt: string | undefined, show: (result: InventoryResult) => void) {
  const key = `${await cacheNamespace()}:inventory:${game}:${roblox}`;
  const saved = await cacheGet<InventoryResult>(key);
  if (saved) show(saved);
  if (saved?.updatedAt && latestUpdatedAt && Date.parse(saved.updatedAt) >= Date.parse(latestUpdatedAt)) return;
  const response = await trackstatFetch(`/api/trackstat/catalog?roblox=${roblox}&game=${game}`, { cache: 'no-store' });
  const body = await response.json();
  const result: InventoryResult = { catalog: body.catalog ?? {}, inventory: body.inventory ?? null, updatedAt: body.updatedAt ?? null };
  if (response.ok && result.inventory) void cacheSet(key, result);
  show(result);
}
