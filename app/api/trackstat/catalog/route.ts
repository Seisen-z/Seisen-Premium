import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import type { CatalogEntry, TrackstatHistory } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

async function icons(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const chunks = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, i * 100 + 100));
  await Promise.all(chunks.map(async chunk => {
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${chunk.join(',')}&size=150x150&format=Png&returnPolicy=PlaceHolder`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      for (const image of (await response.json()).data ?? []) if (image.state === 'Completed' && image.imageUrl) out[String(image.targetId)] = image.imageUrl;
    } catch { /* icons are optional; cards fall back to a placeholder */ }
  }));
  return out;
}

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:catalog:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const key = req.cookies.get('seisen_trackstat')?.value;
  if (!key) return NextResponse.json({ catalog: {} }, { headers });
  try {
    const history = await trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key });
    const keys = [...new Set(history.sessions[0]?.snapshot.inventory?.map(entry => entry.k) ?? [])];
    const rows = keys.length ? await trackstatRPC<Record<string, Omit<CatalogEntry, 'image'>>>('trackstat_catalog_read', { p_keys: keys }) : {};
    const images = await icons([...new Set(Object.values(rows).map(row => row.icon).filter((icon): icon is string => !!icon))]);
    const catalog = Object.fromEntries(Object.entries(rows).map(([k, row]) => [k, { ...row, image: row.icon ? images[row.icon] ?? null : null }]));
    return NextResponse.json({ catalog }, { headers });
  } catch {
    return NextResponse.json({ catalog: {} }, { headers });
  }
}
