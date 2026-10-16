import { bearer, readKeys, trackstatEntries } from '@/lib/server/trackstat-accounts';
import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC, trackstatCacheImage } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { PET_SIMULATOR_99, STEAL_AN_EGG, type CatalogEntry, type InventoryStack } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

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

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:catalog:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const stealAnEgg = req.nextUrl.searchParams.get('game') === 'sae';
    const roblox = req.nextUrl.searchParams.get('roblox') ?? '';
    if (!/^[0-9]{1,20}$/.test(roblox)) return NextResponse.json({ catalog: {} }, { headers });
    // The newest inventory comes from the database for this one account and game, not from the full account read
    const found = await trackstatRPC<{ id?: string; updated_at?: string; inventory: InventoryStack[] | null }>('trackstat_inventory', { p_keys: readKeys(req), p_roblox: roblox, p_game: stealAnEgg ? STEAL_AN_EGG : PET_SIMULATOR_99 }, bearer(req));
    const itemKeys = [...new Set((found.inventory ?? []).flatMap(entry => [
      entry.k, ...(!stealAnEgg ? entry.ch ?? [] : []).map(charm => `Charm:${charm}:1:`),
    ]))];
    // Steal An Egg also shows pictures for gained items, matched by name
    let names: string[] = [];
    if (stealAnEgg) {
      const { entries } = await trackstatEntries(req);
      const sessions = entries.find(entry => entry.history.account.roblox_id === roblox)?.history.sessions.filter(session => session.game_id === STEAL_AN_EGG) ?? [];
      names = [...new Set(sessions.flatMap(session => session.snapshot.details.map(detail => detail.name.toLowerCase())))].slice(0, 2000);
    }
    const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(stealAnEgg ? 'trackstats_stealanegg_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, ...(stealAnEgg ? { p_names: names } : {}) }) : {};
    const folder = stealAnEgg ? 'stealanegg' : 'petsimulator99';
    const ids = [...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon && /^\d{1,20}$/.test(icon)))];
    const cached = new Set(ids.length ? await trackstatRPC<string[]>('trackstat_image_manifest', { p_game: folder, p_icons: ids }) : []);
    const images = await icons(ids.filter(icon => !cached.has(icon)).slice(0, 12));
    await Promise.all(Object.entries(images).map(async ([icon, image]) => {
      if (await trackstatCacheImage(folder, icon, image)) cached.add(icon);
    }));
    const stored = (icon: string | null) => icon && cached.has(icon) ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${folder}/${icon}.png` : null;
    const catalog = Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon ? images[row.icon] ?? null : null, stored: stored(row.icon) }]));
    return NextResponse.json({ catalog, inventory: found.inventory, updatedAt: found.updated_at ?? null }, { headers });
  } catch {
    return NextResponse.json({ catalog: {} }, { headers });
  }
}
