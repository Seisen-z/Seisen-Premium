import { NextRequest, NextResponse } from 'next/server';
import { adminRPC, isAdminRequest } from '@/lib/server/trackstat-admin';
import { serverStats } from '@/lib/server/trackstat-inventory';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

type Row = { id: string; username: string; roblox_id: string; created_at: string; last_sync: string | null; live: string[]; games: string[]; sessions: number; gained_today: number; website_users: number };
type Gain = { account: string };
type Overview = { totals: Record<string, number> };
type GameRow = { game_id: string; accounts: number; live: number; active_24h: number };
const newestFirst = (x: Row, y: Row) => (y.last_sync ?? '').localeCompare(x.last_sync ?? '');

// One Roblox account can have several connection keys (a reset, another device); the page shows it once
function mergeByRoblox(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) groups.set(row.roblox_id, [...(groups.get(row.roblox_id) ?? []), row]);
  return [...groups.values()].map(group => {
    const [newest, ...older] = [...group].sort(newestFirst);
    return {
      ...newest,
      ids: [newest.id, ...older.map(row => row.id)],
      keys: group.length,
      created_at: group.map(row => row.created_at).sort()[0],
      last_sync: group.map(row => row.last_sync).filter((at): at is string => !!at).sort().pop() ?? null,
      live: [...new Set(group.flatMap(row => row.live))],
      games: [...new Set(group.flatMap(row => row.games))],
      sessions: group.reduce((n, row) => n + row.sessions, 0),
      gained_today: group.reduce((n, row) => n + Number(row.gained_today || 0), 0),
      website_users: Math.max(...group.map(row => row.website_users)),
    };
  });
}

// Everything the Trackstat admin page shows, in one answer
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    const [overview, games, rows, activity, server] = await Promise.all([
      adminRPC<Overview>('trackstat_admin_overview'),
      adminRPC<GameRow[]>('trackstat_admin_games'),
      adminRPC<Row[]>('trackstat_admin_accounts', { p_limit: 2000 }),
      adminRPC<Gain[]>('trackstat_admin_activity', { p_limit: 150 }),
      serverStats(),
    ]);
    const accounts = mergeByRoblox(rows);
    const within = (at: string | null, ms: number) => !!at && Date.now() - Date.parse(at) < ms;
    // The database counts connection keys; these totals count the Roblox accounts behind them
    overview.totals = {
      ...overview.totals,
      accounts: accounts.length,
      live_now: accounts.filter(a => a.live.length).length,
      active_1h: accounts.filter(a => within(a.last_sync, 3600e3)).length,
      active_24h: accounts.filter(a => within(a.last_sync, 86400e3)).length,
      active_7d: accounts.filter(a => within(a.last_sync, 7 * 86400e3)).length,
    };
    const merged = games.map(game => ({
      ...game,
      accounts: accounts.filter(a => a.games.includes(game.game_id)).length,
      live: accounts.filter(a => a.live.includes(game.game_id)).length,
      active_24h: accounts.filter(a => a.games.includes(game.game_id) && within(a.last_sync, 86400e3)).length,
    }));
    const primary = new Map(accounts.flatMap(a => a.ids.map(id => [id, a.id] as const)));
    return NextResponse.json({ overview, games: merged, accounts, activity: activity.map(a => ({ ...a, account: primary.get(a.account) ?? a.account })), server }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500, headers });
  }
}
