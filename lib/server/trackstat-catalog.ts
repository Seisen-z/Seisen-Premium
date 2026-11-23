import { trackstatRPC } from './trackstat';
import { queueThumbnails } from './trackstat-inventory';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';

// Names, rarity and pictures for the items in an inventory; gained items can also be looked up by name
export async function buildCatalog(inventory: InventoryStack[], game: 'ps' | 'bf', names: string[] = []): Promise<Record<string, CatalogEntry>> {
  const bloxFruits = game === 'bf';
  const itemKeys = [...new Set(inventory.flatMap(entry => [entry.k, ...(!bloxFruits ? entry.ch ?? [] : []).map(charm => `Charm:${charm}:1:`)]))];
  const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(bloxFruits ? 'trackstats_bloxfruits_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, p_names: names }) : {};
  const folder = bloxFruits ? 'bloxfruits' : 'petsimulator99';
  const ids = [...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon && /^\d{1,20}$/.test(icon)))];
  const manifest = ids.length ? await trackstatRPC<string[]>('trackstat_image_manifest', { p_game: folder, p_icons: ids }).catch(() => null) : [];
  const cached = new Set(manifest ?? []);
  const missing = new Set(manifest ? ids.filter(icon => !cached.has(icon) && !(bloxFruits && icon.startsWith('0'))) : []);
  await queueThumbnails(folder, [...missing]);
  // A failed manifest lookup must not hide existing stored PNGs or their browser-cached bytes.
  const stored = (icon: string | null) => icon && /^\d{1,20}$/.test(icon) ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${folder}/${icon}.png` : null;
  return Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon && missing.has(row.icon) ? `/api/trackstat/thumbnail?game=${folder}&icon=${row.icon}` : null, stored: manifest && row.icon && !cached.has(row.icon) ? null : stored(row.icon), pending: !!row.icon && !cached.has(row.icon) }]));
}
