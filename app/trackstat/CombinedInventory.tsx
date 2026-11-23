'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, Copy, Download, Layers, PawPrint, Search, TrendingUp, Gem } from 'lucide-react';
import { loadInventory, type InventoryResult } from '@/lib/client/trackstat-inventory';
import { PET_SIMULATOR_99, BLOX_FRUITS, compactCount, type CatalogEntry, type InventoryStack, type TrackstatAccount, type TrackstatDailyGains, type TrackstatMedia } from '@/lib/trackstat';
import InventoryView from './InventoryView';
import { BloxFruitsInventory } from './BloxFruitsView';
import { Avatar, DetailTable, GainChart, Img, Stat, button, card, DailyPicker, total } from './ui';

type GameId = 'ps' | 'bf';
type Tab = 'inventory' | 'breakdown' | 'gains';
const games: { id: GameId; gameId: string; name: string; media: keyof TrackstatMedia; icon: typeof Boxes }[] = [
  { id: 'ps', gameId: PET_SIMULATOR_99, name: 'Pet Simulator 99', media: 'game', icon: PawPrint },
  { id: 'bf', gameId: BLOX_FRUITS, name: 'Blox Fruits', media: 'bloxFruits', icon: Boxes },
];
const tabs: { id: Tab; label: string }[] = [{ id: 'inventory', label: 'Inventory' }, { id: 'breakdown', label: 'Breakdown' }, { id: 'gains', label: 'Daily Gains' }];
const variants: Record<string, string> = { g: 'Golden', r: 'Rainbow', s: 'Shiny' };
const storageKey = 'trackstat-combined';

// Same item on several accounts becomes one stack with the amounts added up
function merge(lists: InventoryStack[][]): InventoryStack[] {
  const out = new Map<string, InventoryStack>();
  for (const stack of lists.flat()) {
    const have = out.get(stack.k);
    if (!have) { out.set(stack.k, { ...stack }); continue; }
    have.a += stack.a;
    have.f = have.f || stack.f;
    for (const field of ['r', 'x', 'l', 'p', 'c', 'lm'] as const) if (stack[field] != null) have[field] = Math.max(have[field] ?? 0, stack[field]!);
  }
  return [...out.values()];
}

// Remembered in this browser: last game, tab and the accounts left out
function saved(): { game: GameId; tab: Tab; off: string[] } {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    return { game: games.some(g => g.id === value.game) ? value.game : 'ps', tab: tabs.some(t => t.id === value.tab) ? value.tab : 'inventory', off: Array.isArray(value.off) ? value.off : [] };
  } catch { return { game: 'ps', tab: 'inventory', off: [] }; }
}

type Row = { k: string; label: string; total: number; value: number; by: { id: string; name: string; a: number }[] };

export default function CombinedInventory({ accounts, nameOf, avatarOf, media }: { accounts: TrackstatAccount[]; nameOf: (a: TrackstatAccount) => string; avatarOf: (id?: string) => string | null | undefined; media?: TrackstatMedia }) {
  const [initial] = useState(saved);
  const [gameId, setGameId] = useState<GameId>(initial.game);
  const [tab, setTab] = useState<Tab>(initial.tab);
  const [off, setOff] = useState<Set<string>>(new Set(initial.off));
  const [loaded, setLoaded] = useState<Record<string, InventoryResult>>({});
  const [q, setQ] = useState('');
  const [dupOnly, setDupOnly] = useState(false);
  const [limit, setLimit] = useState(60);
  const [day, setDay] = useState('');
  const [copied, setCopied] = useState(false);
  const shownDay = day || new Date().toISOString().slice(0, 10);
  const game = games.find(g => g.id === gameId)!;
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify({ game: gameId, tab, off: [...off] })); } catch { /* not remembered */ } }, [gameId, tab, off]);

  // Only accounts whose newest session of this game carries an inventory
  const owners = useMemo(() => accounts.map(a => ({ a, latest: a.sessions.find(s => s.game_id === game.gameId) })).filter(x => x.latest?.snapshot.has_inventory), [accounts, game.gameId]);
  const signature = owners.map(o => `${o.a.account.roblox_id}:${o.latest?.updated_at}`).join('|');

  useEffect(() => {
    let live = true;
    const run = () => owners.forEach(({ a, latest }) => {
      const id = a.account.roblox_id;
      void loadInventory(id, gameId, latest?.updated_at, result => { if (live) setLoaded(current => ({ ...current, [`${gameId}:${id}`]: result })); }).catch(() => {});
    });
    run();
    const timer = setInterval(() => { if (!document.hidden) run(); }, 60000);
    return () => { live = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, signature]);

  const included = owners.filter(o => !off.has(o.a.account.roblox_id));
  const ready = included.filter(o => loaded[`${gameId}:${o.a.account.roblox_id}`]?.inventory);
  const readyKey = ready.map(o => `${o.a.account.roblox_id}:${loaded[`${gameId}:${o.a.account.roblox_id}`]?.updatedAt}`).join('|');
  const stacks = useMemo(() => (ready.length ? merge(ready.map(o => loaded[`${gameId}:${o.a.account.roblox_id}`].inventory!)) : undefined), [readyKey, gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  const catalog = useMemo(() => Object.assign({}, ...ready.map(o => loaded[`${gameId}:${o.a.account.roblox_id}`].catalog)) as Record<string, CatalogEntry>, [readyKey, gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.stored ?? c.image])), [catalog]);
  const loading = included.length > ready.length;
  const toggle = (id: string) => setOff(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const totalValue = (stacks ?? []).reduce((n, s) => n + (s.r ?? 0) * s.a, 0);

  // One row per item with how many each account holds
  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const o of ready) {
      const id = o.a.account.roblox_id;
      for (const s of loaded[`${gameId}:${id}`].inventory!) {
        const info = catalog[s.k];
        const variant = variants[s.k.split(':')[3]];
        const row = map.get(s.k) ?? { k: s.k, label: `${info?.name ?? s.k.split(':').slice(1).join(':')}${variant ? ` (${variant})` : ''}`, total: 0, value: 0, by: [] };
        row.total += s.a; row.value += (s.r ?? 0) * s.a;
        const existing = row.by.find(x => x.id === id);
        if (existing) existing.a += s.a; else row.by.push({ id, name: nameOf(o.a), a: s.a });
        map.set(s.k, row);
      }
    }
    return [...map.values()];
  }, [readyKey, gameId, catalog]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredRows = useMemo(() => rows.filter(r => (!dupOnly || r.by.length > 1) && r.label.toLowerCase().includes(q.trim().toLowerCase())).sort((x, y) => y.value - x.value || y.total - x.total || x.label.localeCompare(y.label)), [rows, q, dupOnly]);
  const csv = () => {
    const names = ready.map(o => nameOf(o.a));
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [['Item', 'Total', ...names].map(cell).join(',')];
    for (const r of filteredRows) lines.push([r.label, r.total, ...ready.map(o => r.by.find(x => x.id === o.a.account.roblox_id)?.a ?? 0)].map(cell).join(','));
    return lines.join('\n');
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${game.name.replace(/\s+/g, '-').toLowerCase()}-combined-inventory.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async () => {
    const text = filteredRows.map(r => `${r.label} x${r.total}${r.by.length > 1 ? ` (${r.by.map(x => `${x.name} ${x.a}`).join(', ')})` : ''}`).join('\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  // Daily gains of the chosen accounts, added together per day
  const gameAccounts = accounts.filter(a => !off.has(a.account.roblox_id) && a.sessions.some(s => s.game_id === game.gameId));
  const combinedDaily = useMemo<TrackstatDailyGains[]>(() => {
    const byDay = new Map<string, TrackstatDailyGains>();
    for (const a of gameAccounts) for (const d of a.daily ?? []) {
      if (d.game_id !== game.gameId) continue;
      const cur = byDay.get(d.day) ?? { day: d.day, game_id: d.game_id, gained: {}, details: [] };
      for (const [key, value] of Object.entries(d.gained)) cur.gained[key] = (cur.gained[key] ?? 0) + value;
      cur.details = [...(cur.details ?? []), ...(d.details ?? [])];
      byDay.set(d.day, cur);
    }
    return [...byDay.values()];
  }, [accounts, off, game.gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  const dayRow = combinedDaily.find(d => d.day === shownDay);
  const dayDetails = useMemo(() => {
    const map = new Map<string, { name: string; kind: string; owned: number; gained: number; t?: number }>();
    for (const d of dayRow?.details ?? []) {
      const cur = map.get(`${d.kind}:${d.name}`);
      if (!cur) map.set(`${d.kind}:${d.name}`, { ...d });
      else { cur.owned += d.owned; cur.gained += d.gained; cur.t = Math.max(cur.t ?? 0, d.t ?? 0) || undefined; }
    }
    return [...map.values()];
  }, [dayRow]);

  return (
    <div>
      <div className={`${card} mb-4 p-5`}>
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ts-accent/10 text-ts-accent"><Layers size={20} /></span><div><h2 className="text-xl font-semibold text-ts-fg">All Accounts</h2><p className="text-xs text-ts-fg/45">Pick a game to see every connected account&apos;s inventory combined.</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Game">
          {games.map(g => {
            const count = accounts.filter(a => a.sessions.some(s => s.game_id === g.gameId && s.snapshot.has_inventory)).length;
            return (
              <button key={g.id} aria-pressed={gameId === g.id} onClick={() => { setGameId(g.id); setLimit(60); setQ(''); }} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${gameId === g.id ? 'border-ts-accent/50 bg-ts-accent/10 text-ts-accent' : 'border-ts-fg/10 text-ts-fg/60 hover:text-ts-fg'}`}>
                <Img src={media?.[g.media] as string | null | undefined} className="h-6 w-6 rounded" fallback={<g.icon size={16} />} />{g.name}<span className="rounded-full bg-ts-fg/[0.08] px-1.5 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>
        {!!owners.length && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ts-fg/[0.07] pt-4" role="group" aria-label="Included accounts">
            <span className="text-xs text-ts-fg/45">Accounts ({included.length}/{owners.length}):</span>
            {owners.map(({ a }) => { const id = a.account.roblox_id; const on = !off.has(id); return (
              <button key={id} aria-pressed={on} onClick={() => toggle(id)} className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs ${on ? 'bg-ts-accent/15 text-ts-fg' : 'bg-ts-fg/[0.05] text-ts-fg/40 line-through'}`}><Avatar src={avatarOf(id)} name={a.account.username} small />{nameOf(a)}</button>
            ); })}
          </div>
        )}
        <div className="mt-4 flex gap-1 overflow-x-auto border-t border-ts-fg/[0.07] pt-3" role="tablist" aria-label="Combined sections">
          {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setLimit(60); }} className={`shrink-0 border-b-2 px-4 pb-2 pt-1 text-sm transition-colors ${tab === t.id ? 'border-ts-accent text-ts-accent' : 'border-transparent text-ts-fg/45 hover:text-ts-fg'}`}>{t.label}</button>)}
        </div>
      </div>

      {tab === 'gains' ? (
        !gameAccounts.length ? <div className={`${card} p-10 text-sm text-ts-fg/45`}>No selected account has played {game.name} yet.</div> : <>
          <DailyPicker value={day} onChange={setDay} />
          <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
            <Stat icon={<Layers size={20} />} label="Accounts combined" value={String(gameAccounts.length)} />
            <Stat icon={<TrendingUp size={20} />} label="Combined gains" value={`+${compactCount(total(dayRow?.gained ?? {}))}`} hint={String(total(dayRow?.gained ?? {}))} />
          </div>
          <div className={`${card} mb-4 flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-ts-fg">Gains Chart</h3><GainChart daily={combinedDaily} /></div>
          <DetailTable rows={dayDetails} gainedOnly images={images} empty="Nothing gained on this day yet." />
        </>
      ) : !owners.length ? <div className={`${card} p-10 text-sm text-ts-fg/45`}>No connected account has a {game.name} inventory yet.</div>
        : !included.length ? <div className={`${card} p-10 text-sm text-ts-fg/45`}>Select at least one account.</div>
        : <>
          {stacks && (
            <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
              <Stat icon={<Layers size={20} />} label="Accounts combined" value={String(ready.length)} />
              <Stat icon={<Boxes size={20} />} label="Unique stacks" value={compactCount(stacks.length)} hint={String(stacks.length)} />
              {totalValue > 0 && <Stat icon={<Gem size={20} className="text-ts-cyan" />} label="Total value" value={compactCount(totalValue)} hint={String(totalValue)} />}
            </div>
          )}
          {tab === 'inventory' ? (
            gameId === 'ps' ? <InventoryView stacks={stacks} catalog={catalog} loading={loading} />
              : <BloxFruitsInventory stacks={stacks} catalog={catalog} loading={loading} />
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Find which accounts own an item" value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Who owns…" className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
                <button aria-pressed={dupOnly} onClick={() => { setDupOnly(v => !v); setLimit(60); }} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${dupOnly ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>On 2+ accounts</button>
                <span className="text-xs text-ts-fg/45">{filteredRows.length} items</span>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => void copy()} disabled={!filteredRows.length} className={`${button} flex items-center gap-2`}><Copy size={14} />{copied ? 'Copied' : 'Copy'}</button>
                  <button onClick={download} disabled={!filteredRows.length} className={`${button} flex items-center gap-2`}><Download size={14} />CSV</button>
                </div>
              </div>
              {loading && !rows.length ? <p className={`${card} p-8 text-sm text-ts-fg/45`}>Loading inventories…</p> : filteredRows.length ? (
                <div className={`${card} divide-y divide-ts-fg/[0.05]`}>
                  {filteredRows.slice(0, limit).map(r => (
                    <div key={r.k} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                      <Img src={catalog[r.k]?.stored} backup={catalog[r.k]?.image} className="h-10 w-10 shrink-0 object-contain" fallback={<Gem size={16} className="text-ts-fg/25" />} />
                      <div className="min-w-0 flex-1 basis-40"><p className="truncate font-medium text-ts-fg" title={r.label}>{r.label}</p>{r.value > 0 && <p className="text-xs text-ts-cyan">{compactCount(r.value)} value</p>}</div>
                      <span className="shrink-0 font-mono text-ts-fg" title={String(r.total)}>x{compactCount(r.total)}</span>
                      <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:max-w-[55%] sm:justify-end">{r.by.sort((x, y) => y.a - x.a).map(b => <span key={b.id} className="rounded-md bg-ts-fg/[0.05] px-2 py-0.5 text-xs text-ts-fg/70" title={String(b.a)}>{b.name} <span className="font-mono text-ts-accent">×{compactCount(b.a)}</span></span>)}</div>
                    </div>
                  ))}
                </div>
              ) : <p className={`${card} p-8 text-sm text-ts-fg/40`}>{dupOnly ? 'No item is held by more than one account.' : 'Nothing matches.'}</p>}
              {filteredRows.length > limit && <button onClick={() => setLimit(l => l + 60)} className={`${button} mx-auto mt-6 block`}>Show more ({filteredRows.length - limit})</button>}
            </div>
          )}
        </>}
    </div>
  );
}
