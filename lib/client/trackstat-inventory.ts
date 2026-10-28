'use client';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';
import { trackstatFetch } from './trackstat-auth';
import { cacheGet, cacheNamespace, cacheSet, imageGet, imageSet } from './trackstat-cache';

export type InventoryResult = { catalog: Record<string, CatalogEntry>; inventory: InventoryStack[] | null; updatedAt: string | null; cachedAt?: number; etag?: string };

// Shows saved inventory at once and refreshes pictures that can arrive after the last sync.
export async function loadInventory(roblox: string, game: 'ps' | 'tap' | 'ad', latestUpdatedAt: string | undefined, show: (result: InventoryResult) => void) {
  const key = `${await cacheNamespace()}:inventory:v2:${game}:${roblox}`;
  const saved = await cacheGet<InventoryResult>(key);
  if (saved) show(saved);
  // Pictures can arrive after an unchanged inventory was cached.
  const picturesReady = saved?.inventory?.every(stack => {
    const info = saved.catalog[stack.k];
    return !info?.pending && !!(info?.stored || info?.image);
  });
  if (picturesReady && saved?.cachedAt && Date.now() - saved.cachedAt < 300000 && saved.updatedAt && latestUpdatedAt && Date.parse(saved.updatedAt) >= Date.parse(latestUpdatedAt)) return;
  const response = await trackstatFetch(`/api/trackstat/catalog?roblox=${roblox}&game=${game}`, { cache: 'no-store', headers: saved?.etag ? { 'If-None-Match': saved.etag } : {} });
  if (response.status === 304 && saved) { const result = { ...saved, cachedAt: Date.now() }; void cacheSet(key, result); show(result); return; }
  if (!response.ok) throw new Error('Inventory could not be refreshed.');
  const body = await response.json();
  const result: InventoryResult = { catalog: body.catalog ?? {}, inventory: body.inventory ?? null, updatedAt: body.updatedAt ?? null, cachedAt: Date.now(), etag: response.headers.get('ETag') ?? undefined };
  result.catalog = { ...saved?.catalog, ...result.catalog };
  for (const [key, info] of Object.entries(result.catalog)) {
    const previous = saved?.catalog[key];
    if (previous && previous.icon === info.icon) {
      if (info.pending && info.stored && previous.image && !previous.image.startsWith('/api/trackstat/thumbnail?')) {
        const blob = await imageGet(previous.image);
        if (blob) await imageSet(info.stored, blob);
      }
      result.catalog[key] = { ...info, stored: info.stored || previous.stored, image: info.image || (info.pending === false && previous.image?.startsWith('/api/trackstat/thumbnail?') ? null : previous.image) };
    }
  }
  if (result.inventory) void cacheSet(key, result);
  show(result);
}
