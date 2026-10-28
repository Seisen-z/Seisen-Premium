'use client';

import { useEffect, useState } from 'react';
import { CircleDollarSign, Gem } from 'lucide-react';
import { ANIME_DICE, PET_SIMULATOR_99, TAP_SIMULATOR, compactCount, type InventoryStack, type TrackstatAccount } from '@/lib/trackstat';
import { loadInventory, type InventoryResult } from '@/lib/client/trackstat-inventory';
import { Avatar, CardSkeleton, Img, card } from './ui';

type Loaded = Record<string, { data?: InventoryResult; error?: boolean }>;

// Each game uses its available value: RAP, amount, or income.
const games = [
  { id: PET_SIMULATOR_99, key: 'ps', title: 'Pet Simulator 99', note: 'ranked by total stack RAP', value: (s: InventoryStack) => (s.r ?? 0) * s.a },
  { id: TAP_SIMULATOR, key: 'tap', title: 'Tap Simulator', note: 'ranked by owned amount', value: (s: InventoryStack) => s.a },
  { id: ANIME_DICE, key: 'ad', title: 'Anime Dice', note: 'ranked by money per second', value: (s: InventoryStack) => s.p ?? 0 },
] as const;

export function rankMostValuable(accounts: TrackstatAccount[], loaded: Loaded, value: (s: InventoryStack) => number, prefix: string, limit = 6) {
  const seen = new Set<string>();
  return accounts.flatMap(account => {
    const id = account.account.roblox_id;
    if (seen.has(id)) return [];
    seen.add(id);
    const data = loaded[`${prefix}:${id}`]?.data;
    return (data?.inventory ?? []).map((stack, index) => ({ account, stack, index, info: data?.catalog[stack.k], value: value(stack) }));
  }).filter(row => Number.isFinite(row.value) && row.value > 0).sort((a, b) => b.value - a.value).slice(0, limit);
}

export default function DashboardMostValuable({ accounts, game: filter, avatarOf, nameOf }: { accounts: TrackstatAccount[]; game: string; avatarOf: (id?: string) => string | null | undefined; nameOf: (a: TrackstatAccount) => string }) {
  const [loaded, setLoaded] = useState<Loaded>({});
  const shown = games.filter(g => filter === 'all' || g.id === filter);
  const sources = shown.flatMap(game => [...new Map(accounts.flatMap(a => {
    const latest = a.sessions.filter(s => s.game_id === game.id).sort((x, y) => Date.parse(y.updated_at) - Date.parse(x.updated_at))[0];
    return latest ? [[a.account.roblox_id, latest.updated_at] as const] : [];
  })).entries()].map(([id, updated]) => [game.key, id, updated] as const));
  const signature = JSON.stringify(sources);
  useEffect(() => {
    let active = true;
    const list = JSON.parse(signature) as [typeof games[number]['key'], string, string][];
    for (const [game, id, updated] of list) {
      const key = `${game}:${id}`;
      void loadInventory(id, game, updated, data => {
        if (active) setLoaded(current => ({ ...current, [key]: { data } }));
      }).catch(() => { if (active) setLoaded(current => ({ ...current, [key]: { ...current[key], error: true } })); });
    }
    return () => { active = false; };
  }, [signature]);
  const failed = sources.some(([game, id]) => loaded[`${game}:${id}`]?.error || loaded[`${game}:${id}`]?.data?.inventory === null);
  const pending = sources.some(([game, id]) => !loaded[`${game}:${id}`]);
  // One row: the top 6 of the chosen game, or the top 2 of each game when every game is shown
  const perGame = filter === 'all' ? 2 : 6;
  const rows = shown.flatMap(game => {
    const eligible = new Set(sources.filter(([key]) => key === game.key).map(([, id]) => id));
    return rankMostValuable(accounts.filter(a => eligible.has(a.account.roblox_id)), loaded, game.value, game.key, perGame).map(row => ({ ...row, game }));
  });
  return <section className={`${card} p-5`} aria-label="Most Valuable across all connected accounts">
    <h3 className="text-sm font-semibold text-ts-fg">Most Valuable</h3>
    <p className="mb-4 mt-1 text-xs text-ts-fg/40">{filter === 'all' ? 'The top 2 items of every game across all connected accounts.' : `${shown[0]?.title}, ${shown[0]?.note}, across all connected accounts.`}</p>
    {rows.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{rows.map(({ account, stack, index, info, value, game }) => <div key={`${game.key}:${account.account.roblox_id}:${stack.k}:${index}`} className="rounded-lg border border-ts-fg/[0.06] bg-ts-fg/[0.02] p-3 text-center" style={{ background: `radial-gradient(circle at 50% 30%, ${info?.rarity_color ?? '#7458f5'}22, transparent 70%)` }}>
      <Img src={info?.stored} backup={info?.image} className="mx-auto h-14 w-14 object-contain" fallback={<Gem size={22} className="text-ts-fg/25" />} />
      <p className="mt-2 truncate text-xs font-medium text-ts-fg" title={info?.name ?? stack.k}>{info?.name ?? stack.k.split(':')[1]}</p>
      {game.key === 'ps'
        ? <p className="mt-1 flex items-center justify-center gap-1 font-mono text-xs text-ts-cyan" title={String(value)}><Gem size={11} />{compactCount(value)}</p>
        : game.key === 'tap' ? <p className="mt-1 font-mono text-xs text-ts-pos">x{compactCount(value)} owned</p>
        : <p className="mt-1 flex items-center justify-center gap-1 font-mono text-xs text-ts-pos" title={String(value)}><CircleDollarSign size={11} />${compactCount(value)}/s</p>}
      {stack.a > 1 && <p className="text-[10px] text-ts-fg/35">x{compactCount(stack.a)}</p>}
      {filter === 'all' && <p className="text-[10px] text-ts-fg/35">{game.title}</p>}
      <div className="mt-2 flex min-w-0 items-center justify-center gap-2 text-xs text-ts-fg/45"><Avatar src={avatarOf(account.account.roblox_id)} name={account.account.username} small /><span className="truncate" title={nameOf(account)}>{nameOf(account)}</span></div>
    </div>)}</div> : pending ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{[0, 1, 2, 3, 4, 5].map(i => <CardSkeleton key={i} />)}</div> : <p className="text-sm text-ts-fg/40">No valued items yet. Sync your inventory to see your most valuable items.</p>}
    {pending && !!rows.length && <p className="mt-3 text-xs text-ts-fg/40">Loading remaining accounts…</p>}
    {failed && <p className="mt-3 text-xs text-ts-fg/40">Some inventories could not load. Available accounts are shown; refresh the page to retry.</p>}
  </section>;
}
