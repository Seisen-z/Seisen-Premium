import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/server/trackstat-admin';
import { serverInventory } from '@/lib/server/trackstat-inventory';
import { buildCatalog } from '@/lib/server/trackstat-catalog';
import { PET_SIMULATOR_99, STEAL_AN_EGG, ANIME_DICE } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

// One account's inventory for one game, read from the Trackstat server
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const account = req.nextUrl.searchParams.get('account') ?? '';
  const game = req.nextUrl.searchParams.get('game');
  if (!/^[0-9a-f-]{36}$/.test(account) || (game !== 'ps' && game !== 'sae' && game !== 'ad')) return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers });
  const found = await serverInventory(account, game === 'ad' ? ANIME_DICE : game === 'sae' ? STEAL_AN_EGG : PET_SIMULATOR_99);
  if (!found) return NextResponse.json({ catalog: {}, inventory: null, updated: null }, { headers });
  return NextResponse.json({ catalog: await buildCatalog(found.inventory, game === 'ad' ? 'ad' : game === 'sae'), inventory: found.inventory, updated: found.updated }, { headers });
}
