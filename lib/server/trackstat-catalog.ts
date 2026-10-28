import { trackstatRPC } from './trackstat';
import { queueThumbnails } from './trackstat-inventory';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';

// Leading zero reserves these storage names for rendered models, not Roblox asset IDs.
export function animeDiceModelIcon(key: string) {
  let a = 5381, b = 0;
  for (const byte of Buffer.from(key, 'utf8')) { a = (a * 33 + byte) % 4294967296; b = (b * 31 + byte) % 1000000000; }
  return `0${String(a).padStart(10, '0')}${String(b).padStart(9, '0')}`;
}

// Names, rarity and pictures for the items in an inventory; Tap Simulator also looks up gained items by name
export async function buildCatalog(inventory: InventoryStack[], game: boolean | 'ad', names: string[] = []): Promise<Record<string, CatalogEntry>> {
  const tapSimulator = game === true, animeDice = game === 'ad';
  const itemKeys = [...new Set(inventory.flatMap(entry => [entry.k, ...(!tapSimulator && !animeDice ? entry.ch ?? [] : []).map(charm => `Charm:${charm}:1:`)]))];
  const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(animeDice ? 'trackstats_animedice_catalog_read' : tapSimulator ? 'trackstats_tapsimulator_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, p_names: names }) : {};
  for (const [key, row] of Object.entries(rows)) if (!row.icon && ((animeDice && (row.kind === 'unit' || row.kind === 'gear')) || (tapSimulator && row.kind === 'pet'))) row.icon = animeDiceModelIcon(key);
  const folder = animeDice ? 'animedice' : tapSimulator ? 'tapsimulator' : 'petsimulator99';
  const ids = [...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon && /^\d{1,20}$/.test(icon)))];
  const manifest = ids.length ? await trackstatRPC<string[]>('trackstat_image_manifest', { p_game: folder, p_icons: ids }).catch(() => null) : [];
  const cached = new Set(manifest ?? []);
  const missing = new Set(manifest ? ids.filter(icon => !cached.has(icon) && !((animeDice || tapSimulator) && icon.startsWith('0'))) : []);
  await queueThumbnails(folder, [...missing]);
  // A failed manifest lookup must not hide existing stored PNGs or their browser-cached bytes.
  const stored = (icon: string | null) => icon && /^\d{1,20}$/.test(icon) ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${folder}/${icon}.png` : null;
  return Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon && missing.has(row.icon) ? `/api/trackstat/thumbnail?game=${folder}&icon=${row.icon}` : null, stored: manifest && row.icon && !cached.has(row.icon) ? null : stored(row.icon), pending: !!row.icon && !cached.has(row.icon) }]));
}
