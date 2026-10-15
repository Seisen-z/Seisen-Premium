import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { STEAL_AN_EGG, type CatalogEntry, type TrackstatHistory } from '@/lib/trackstat';

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
  const key = (req.cookies.get('seisen_trackstat')?.value ?? '').split(',')[Number(req.nextUrl.searchParams.get('account')) || 0];
  if (!key) return NextResponse.json({ catalog: {} }, { headers });
  try {
    const stealAnEgg = req.nextUrl.searchParams.get('game') === 'sae';
    const history = await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    const sessions = history.sessions.filter(session => (session.game_id === STEAL_AN_EGG) === stealAnEgg);
    const latest = sessions[0];
    const itemKeys = [...new Set(latest?.snapshot.inventory?.map(entry => entry.k) ?? [])];
    const names = stealAnEgg ? [...new Set(sessions.flatMap(session => session.snapshot.details.map(detail => detail.name.toLowerCase())))].slice(0, 2000) : [];
    const rows = itemKeys.length || names.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>(stealAnEgg ? 'trackstats_stealanegg_catalog_read' : 'trackstat_catalog_read', { p_keys: itemKeys, ...(stealAnEgg ? { p_names: names } : {}) }) : {};
    const images = await icons([...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon))]);
    // Some icons are private on Roblox, so the library stores its own copy of each picture
    const stored = (icon: string | null) => (icon ? `https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/public/trackstats-images/${stealAnEgg ? 'stealanegg' : 'petsimulator99'}/${icon}.png` : null);
    const catalog = Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon ? images[row.icon] ?? null : null, stored: stored(row.icon) }]));
    return NextResponse.json({ catalog }, { headers });
  } catch {
    return NextResponse.json({ catalog: {} }, { headers });
  }
}
