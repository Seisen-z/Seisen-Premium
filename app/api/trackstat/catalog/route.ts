import { bearer, readKeys, trackstatEntries } from '@/lib/server/trackstat-accounts';
import { NextRequest, NextResponse } from 'next/server';
import { trackstatRPC } from '@/lib/server/trackstat';
import { buildCatalog } from '@/lib/server/trackstat-catalog';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import { PET_SIMULATOR_99, STEAL_AN_EGG, type InventoryStack } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:catalog:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const stealAnEgg = req.nextUrl.searchParams.get('game') === 'sae';
    const roblox = req.nextUrl.searchParams.get('roblox') ?? '';
    if (!/^[0-9]{1,20}$/.test(roblox)) return NextResponse.json({ catalog: {} }, { headers });
    // The newest inventory comes from the database for this one account and game, not from the full account read
    const found = await trackstatRPC<{ id?: string; updated_at?: string; inventory: InventoryStack[] | null }>('trackstat_inventory', { p_keys: readKeys(req), p_roblox: roblox, p_game: stealAnEgg ? STEAL_AN_EGG : PET_SIMULATOR_99 }, bearer(req));
    // Steal An Egg also shows pictures for gained items, matched by name
    let names: string[] = [];
    if (stealAnEgg) {
      const { entries } = await trackstatEntries(req);
      const sessions = entries.find(entry => entry.history.account.roblox_id === roblox)?.history.sessions.filter(session => session.game_id === STEAL_AN_EGG) ?? [];
      names = [...new Set(sessions.flatMap(session => session.snapshot.details.map(detail => detail.name.toLowerCase())))].slice(0, 2000);
    }
    return NextResponse.json({ catalog: await buildCatalog(found.inventory ?? [], stealAnEgg, names), inventory: found.inventory, updatedAt: found.updated_at ?? null }, { headers });
  } catch {
    return NextResponse.json({ catalog: {} }, { headers });
  }
}
