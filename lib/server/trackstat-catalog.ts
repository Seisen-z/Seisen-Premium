import { trackstatRPC, trackstatCacheImage } from './trackstat';
import type { CatalogEntry, InventoryStack } from '@/lib/trackstat';

async function icons(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const chunks = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, i * 100 + 100));
  await Promise.all(chunks.map(async chunk => {
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${chunk.join(',')}&size=150x150&format=Png&returnPolicy=PlaceHolder`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      for (const image of (await response.json()).data ?? []) if (image.state === 'Completed' && image.imageUrl && !image.imageUrl.includes('/PrivateImage/')) out[String(image.targetId)] = image.imageUrl;
    } catch { /* icons are optional; cards fall back to a placeholder */ }
  }));
  return out;
}

// Names, rarity and pictures for the items in an inventory; Steal An Egg also looks up gained items by name
export async function buildCatalog(inventory: InventoryStack[], stealAnEgg: boolean, names: string[] = []): Promise<Record<string, CatalogEntry>> {
  const itemKeys = [...new Set(inventory.flatMap(entry => [entry.k, ...(!stealAnEgg ? entry.ch ?? [] : []).map(charm => `Charm:${charm}:1:`)]))];
  const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(stealAnEgg ? 'trackstats_stealanegg_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, ...(stealAnEgg ? { p_names: names } : {}) }) : {};
  const folder = stealAnEgg ? 'stealanegg' : 'petsimulator99';
  const ids = [...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon && /^\d{1,20}$/.test(icon)))];
  const cached = new Set(ids.length ? await trackstatRPC<string[]>('trackstat_image_manifest', { p_game: folder, p_icons: ids }) : []);
  const images = await icons(ids.filter(icon => !cached.has(icon)).slice(0, 12));
  await Promise.all(Object.entries(images).map(async ([icon, image]) => {
    if (await trackstatCacheImage(folder, icon, image)) cached.add(icon);
  }));
  const stored = (icon: string | null) => icon && cached.has(icon) ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${folder}/${icon}.png` : null;
  return Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon ? images[row.icon] ?? null : null, stored: stored(row.icon) }]));
}
