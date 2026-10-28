import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { trackstatRPC } from '@/lib/server/trackstat';
import { serverInventory } from '@/lib/server/trackstat-inventory';
import { buildCatalog } from '@/lib/server/trackstat-catalog';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { PET_SIMULATOR_99, TAP_SIMULATOR, ANIME_DICE } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

// The inventory shown on a shared page: the newest one for a game, with names and pictures. The share token is the only thing needed.
export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:share:inventory:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const tapSimulator = req.nextUrl.searchParams.get('game') === 'tap';
  const animeDice = req.nextUrl.searchParams.get('game') === 'ad';
  const gameId = animeDice ? ANIME_DICE : tapSimulator ? TAP_SIMULATOR : PET_SIMULATOR_99;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return NextResponse.json({ catalog: {}, inventory: null }, { headers });
  try {
    const moved = await serverInventory(await trackstatRPC<string>('trackstat_shared_account', { p_token: token }), gameId);
    const found = moved ?? { inventory: null };
    const catalog = await buildCatalog(found.inventory ?? [], animeDice ? 'ad' : tapSimulator);
    const etag = `"${createHash('sha256').update(JSON.stringify([moved?.etag || found.inventory, catalog])).digest('hex')}"`;
    if (req.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers: { ...headers, ETag: etag } });
    return NextResponse.json({ catalog, inventory: found.inventory }, { headers: { ...headers, ETag: etag } });
  } catch { return NextResponse.json({ catalog: {}, inventory: null }, { headers }); }
}
