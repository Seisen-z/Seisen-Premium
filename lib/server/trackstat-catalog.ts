import { trackstatRPC, trackstatCacheImage } from './trackstat';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';

async function icons(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const chunks = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, i * 100 + 100));
  await Promise.all(chunks.map(async chunk => {
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${chunk.join(',')}&size=150x150&format=Png&returnPolicy=PlaceHolder`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      for (const image of (await response.json()).data ?? []) if (image.state === 'Completed' && image.imageUrl && !image.imageUrl.includes('/PrivateImage/')) out[String(image.targetId)] = image.imageUrl;
    } catch { /* icons are optional; cards fall back to a placeholder */ }
  }));
  return out;
}

// Leading zero reserves these storage names for rendered models, not Roblox asset IDs.
export function animeDiceModelIcon(key: string) {
  let a = 5381, b = 0;
  for (const byte of Buffer.from(key, 'utf8')) { a = (a * 33 + byte) % 4294967296; b = (b * 31 + byte) % 1000000000; }
  return `0${String(a).padStart(10, '0')}${String(b).padStart(9, '0')}`;
}

// Names, rarity and pictures for the items in an inventory; Steal An Egg also looks up gained items by name
export async function buildCatalog(inventory: InventoryStack[], game: boolean | 'ad', names: string[] = []): Promise<Record<string, CatalogEntry>> {
  const stealAnEgg = game === true, animeDice = game === 'ad';
  const itemKeys = [...new Set(inventory.flatMap(entry => [entry.k, ...(!stealAnEgg && !animeDice ? entry.ch ?? [] : []).map(charm => `Charm:${charm}:1:`)]))];
  const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(animeDice ? 'trackstats_animedice_catalog_read' : stealAnEgg ? 'trackstats_stealanegg_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, ...(stealAnEgg || animeDice ? { p_names: names } : {}) }) : {};
  if (animeDice) for (const [key, row] of Object.entries(rows)) if (!row.icon && (row.kind === 'unit' || row.kind === 'gear')) row.icon = animeDiceModelIcon(key);
  const folder = animeDice ? 'animedice' : stealAnEgg ? 'stealanegg' : 'petsimulator99';
  const ids = [...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon && /^\d{1,20}$/.test(icon)))];
  const manifest = ids.length ? await trackstatRPC<string[]>('trackstat_image_manifest', { p_game: folder, p_icons: ids }).catch(() => null) : [];
  const cached = new Set(manifest ?? []);
  const images = manifest ? await icons(ids.filter(icon => !cached.has(icon) && !(animeDice && icon.startsWith('0')))) : {};
  await Promise.all(Object.entries(images).filter(([icon]) => !cached.has(icon)).slice(0, 12).map(async ([icon, image]) => {
    if (await trackstatCacheImage(folder, icon, image)) cached.add(icon);
  }));
  // A failed manifest lookup must not hide existing stored PNGs or their browser-cached bytes.
  const stored = (icon: string | null) => icon && /^\d{1,20}$/.test(icon) ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${folder}/${icon}.png` : null;
  return Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon ? images[row.icon] ?? null : null, stored: stored(row.icon) }]));
}
