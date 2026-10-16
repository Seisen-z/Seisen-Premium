import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC } from '@/lib/server/trackstat';
import { buildCatalog } from '@/lib/server/trackstat-catalog';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { PET_SIMULATOR_99, STEAL_AN_EGG, type InventoryStack } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

// The inventory shown on a shared page: the newest one for a game, with names and pictures. The share token is the only thing needed.
export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:share:inventory:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const stealAnEgg = req.nextUrl.searchParams.get('game') === 'sae';
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return NextResponse.json({ catalog: {}, inventory: null }, { headers });
  try {
    const found = await trackstatRPC<{ inventory: InventoryStack[] | null }>('trackstat_shared_inventory', { p_token: token, p_game: stealAnEgg ? STEAL_AN_EGG : PET_SIMULATOR_99 });
    return NextResponse.json({ catalog: await buildCatalog(found.inventory ?? [], stealAnEgg), inventory: found.inventory }, { headers });
  } catch { return NextResponse.json({ catalog: {}, inventory: null }, { headers }); }
}
