'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, Boxes, ChevronRight, Clock, Coins, Gem, Search, Star, TrendingUp, Users } from 'lucide-react';
import { compactCount, type CatalogEntry, type InventoryStack, type TrackstatDailyGains, type TrackstatMedia, type TrackstatPublic, type TrackstatSession } from '@/lib/trackstat';
import { dailySnapshot } from '@/lib/trackstat-daily';
import { loadInventory, type InventoryResult } from '@/lib/client/trackstat-inventory';
import InventoryControls from './InventoryControls';
import { card, CardSkeleton, DailyPicker, DetailTable, GainChart, Img, Stat, InventoryStat, inventoryStats, ago, gainAt, total } from './ui';

const metrics = ['fruits', 'weapons', 'accessories', 'materials', 'items'];
const rarityColors: Record<string, string> = {"Common": "#b3b3b3", "Uncommon": "#5c8cd3", "Rare": "#8c52ff", "Legendary": "#d52be4", "Mythical": "#ee2f32", "Premium": "#ddbc00"};
const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Daily Gains', icon: TrendingUp }, { id: 'community', label: 'Community', icon: Users },
];
const label = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

export function BloxFruitsInventory({ stacks, catalog, loading }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry>; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [favorites, setFavorites] = useState(false);
  const [limit, setLimit] = useState(60);
  const kinds = [...new Set((stacks ?? []).map(s => catalog[s.k]?.kind ?? 'item'))].sort();
  const name = (s: InventoryStack) => catalog[s.k]?.name ?? s.k;
  const shown = (stacks ?? []).filter(s => (category === 'all' || catalog[s.k]?.kind === category) && (!favorites || s.f) && name(s).toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'amount' ? b.a - a.a : sort === 'mastery' ? (b.l ?? 0) - (a.l ?? 0) : sort === 'rarity' ? (catalog[b.k]?.rarity_num ?? 0) - (catalog[a.k]?.rarity_num ?? 0) : name(a).localeCompare(name(b)));
  return <>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search Blox Fruits inventory" placeholder="Search inventory..." value={query} onChange={e => { setQuery(e.target.value); setLimit(60); }} className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Inventory category">{[['all', 'All'], ...kinds.map(kind => [kind, label(kind)])].map(([id, name]) => <button key={id} onClick={() => { setCategory(id); setLimit(60); }} aria-pressed={category === id} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${category === id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{name}</button>)}</div>
    </div>
    <InventoryControls sort={sort} onSort={value => { setSort(value); setLimit(60); }} options={[["name", "Name"], ["amount", "Amount"], ["mastery", "Mastery"], ["rarity", "Rarity"]]} favOnly={favorites} onFav={value => { setFavorites(value); setLimit(60); }} summary={`${shown.length} of ${stacks?.length ?? 0} stacks · ${compactCount(shown.reduce((n, s) => n + s.a, 0))} owned`} />
    {loading && !stacks ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{[0, 1, 2, 3].map(i => <CardSkeleton key={i} />)}</div> : !shown.length ? <p className={`${card} p-8 text-sm text-ts-fg/45`}>{stacks ? 'No items match these filters.' : 'Inventory has not synced yet.'}</p> : <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {shown.slice(0, limit).map((stack, i) => {
        const info = catalog[stack.k];
        const color = info?.rarity_color ?? rarityColors[info?.rarity ?? ''] ?? '#bca275';
        return <details key={`${stack.k}:${i}`} className={`${card} ts-hover relative flex flex-col`}>
          <summary className="cursor-pointer list-none">
            <span className="absolute -right-2 -top-3 z-10 font-mono text-lg font-extrabold leading-none text-ts-fg [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]"><span className="mr-px text-xs font-bold opacity-70">x</span>{compactCount(stack.a)}</span>
            <div className="relative grid h-28 place-items-center overflow-hidden rounded-t-xl" style={{ background: `radial-gradient(circle at 50% 60%, ${color}33, transparent 70%)` }}>
              <Img src={info?.stored} backup={info?.image} className="h-20 w-20 object-contain" fallback={<Boxes size={28} className="text-ts-accent/60" />} />
              {stack.f && <Star size={14} className="absolute left-2 top-2 fill-current text-ts-accent" aria-label="Favorite" />}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="break-words text-sm font-semibold leading-tight text-ts-fg">{name(stack)}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"><span style={{ color }}>{info?.rarity ?? label(info?.kind ?? 'item')}</span>{info?.rarity && <span className="text-ts-fg/45">&middot; {label(info.kind ?? 'item')}</span>}</p>
              {info?.description && <p className="line-clamp-2 text-xs leading-5 text-ts-fg/45">{info.description}</p>}
              <div className={inventoryStats}>{stack.l !== undefined && <InventoryStat value={String(stack.l)} label="Mastery" icon={<TrendingUp />} tone="income" />}</div>
              <p className="text-[11px] text-ts-fg/35">Item details</p>
            </div>
          </summary>
          <div className="mx-4 mb-4 border-t border-ts-fg/10 pt-3 text-xs text-ts-fg/60">
            {info?.description && <p className="mb-3">{info.description}</p>}
            <dl className="space-y-2">{Object.entries(stack.bd ?? {}).map(([key, value]) => <div key={key}><dt className="font-medium text-ts-fg/80">{label(key)}</dt><dd className="mt-1 break-words font-mono">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
          </div>
        </details>;
      })}
    </div>}
    {shown.length > limit && <button className="mx-auto mt-6 block rounded-lg border border-ts-fg/10 px-4 py-2.5 text-sm text-ts-fg/70 hover:border-ts-accent/50 hover:text-ts-accent" onClick={() => setLimit(limit + 60)}>Show more</button>}
  </>;
}

export default function BloxFruitsView({ sessions, daily, media, community, live, roblox, onBack }: { sessions: TrackstatSession[]; daily: TrackstatDailyGains[]; media?: TrackstatMedia; community?: TrackstatPublic | null; live: boolean; roblox: string; onBack: () => void }) {
  const [tab, setTab] = useState('overview');
  const [day, setDay] = useState('');
  const [recentCategory, setRecentCategory] = useState('all');
  const shownDay = day || new Date().toISOString().slice(0, 10);
  const [loaded, setLoaded] = useState<{ key: string; data: InventoryResult }>();
  const [error, setError] = useState('');
  const latest = sessions[0];
  const snapshot = dailySnapshot(sessions, daily, shownDay);
  const updated = latest?.updated_at;
  useEffect(() => {
    if (!roblox || !updated) return;
    let active = true;
    const run = () => loadInventory(roblox, 'bf', updated, data => { if (active) { setLoaded({ key: roblox, data }); setError(''); } }).catch(() => { if (active) setError('Inventory could not be refreshed. Retrying shortly.'); });
    void run();
    const timer = setInterval(() => { if (!document.hidden) void run(); }, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [roblox, updated]);
  const inventory = loaded?.key === roblox ? loaded.data.inventory ?? undefined : undefined;
  const catalog = loaded?.key === roblox ? loaded.data.catalog : {};
  const kinds = [...new Set((snapshot?.details ?? []).map(detail => detail.kind))].sort();
  const recent = (snapshot?.details ?? []).filter(detail => detail.gained > 0 && (recentCategory === 'all' || detail.kind === recentCategory)).map(detail => ({ ...detail, at: gainAt(detail, `${shownDay}T00:00:00Z`) })).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 10);
  return <>
    <div className={`${card} mb-4 p-5`}>
      <div className="flex items-center gap-4">
        <button onClick={onBack} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ts-fg/10 text-ts-fg/60 hover:border-ts-accent/50 hover:text-ts-accent"><ArrowLeft size={16} /></button>
        <Img src={media?.bloxFruits} className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<Boxes size={30} className="text-ts-accent" />} />
        <div className="min-w-0 flex-1"><h2 className="text-xl font-semibold text-ts-fg">Blox Fruits</h2><p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-2 w-2 rounded-full ${live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Tracking' : 'Not tracking'}</p><p className="mt-1 text-xs text-ts-fg/45">Complete replicated inventory, item details and daily gains.</p></div>
      </div>
        <div className="mt-5 flex gap-1 overflow-x-auto border-t border-ts-fg/[0.07] pt-3" role="tablist" aria-label="Game sections">
          {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 pb-2 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ts-accent ${tab === t.id ? 'border-ts-accent text-ts-accent' : 'border-transparent text-ts-fg/45 hover:text-ts-fg'}`}><t.icon size={14} />{t.label}</button>)}
        </div>
    </div>
    {error && <p role="status" className="mb-4 text-sm text-ts-fg/50">{error}</p>}
    {tab === 'inventory' ? <BloxFruitsInventory stacks={inventory} catalog={catalog} loading={!loaded && !!updated && !error} /> : tab === 'community' ? community ? <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat icon={<Users size={20} />} label="Accounts" value={compactCount(community.accounts)} /><Stat icon={<Activity size={20} />} label="Active now" value={compactCount(community.live)} /><Stat icon={<Clock size={20} />} label="Daily records" value={compactCount(community.sessions)} /><Stat icon={<TrendingUp size={20} />} label="Total gained" value={compactCount(total(community.gained))} />{metrics.map(metric => <div key={metric} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{metric === 'items' ? 'Other items' : label(metric)} collected</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(community.gained[metric] ?? 0)}>{compactCount(community.gained[metric] ?? 0)}</p></div>)}</div> : <p className={`${card} p-8 text-ts-fg/45`}>Community totals have not synced yet.</p> : <>
      <DailyPicker value={day} onChange={setDay} />
      {!snapshot ? <p className={`${card} p-8 text-ts-fg/45`}>Run the updated library in Blox Fruits and connect its key to start tracking.</p> : tab === 'gains' ? <><div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(metric => <div key={metric} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{metric === 'items' ? 'Other items' : label(metric)}</p><p className="mt-2 font-mono text-2xl text-ts-fg">{compactCount(snapshot.owned[metric] ?? 0)}</p><p className="mt-2 text-xs text-ts-accent">+{compactCount(snapshot.gained[metric] ?? 0)} gained</p></div>)}</div><DetailTable rows={snapshot.details} empty="No gains recorded for this day." gainedOnly images={Object.fromEntries(Object.values(catalog).map(info => [info.name.toLowerCase(), info.stored ?? info.image]))} backups={Object.fromEntries(Object.values(catalog).map(info => [info.name.toLowerCase(), info.image]))} /><p className="mt-4 text-xs text-ts-fg/40">Positive inventory increases count, including trades and rewards. Existing inventory is the baseline, not a gain.</p></> : <>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Coins size={20} />} label="Money" value={compactCount(snapshot.money ?? 0)} /><Stat icon={<Gem size={20} />} label="Fragments" value={compactCount(snapshot.fragments ?? 0)} /><Stat icon={<TrendingUp size={20} />} label="Level" value={compactCount(snapshot.level ?? 0)} /><Stat icon={<Activity size={20} />} label="Bounty / Honor" value={compactCount(snapshot.bounty ?? 0)} />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">{metrics.map(metric => <Stat key={metric} icon={<Boxes size={18} />} label={metric === 'items' ? 'Other items' : label(metric)} value={compactCount(snapshot.owned[metric] ?? 0)} />)}</div>
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className={`${card} p-5`}><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Daily Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">View All <ChevronRight size={12} /></button></div><div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Activity category">{[['all', 'All'], ...kinds.map(kind => [kind, label(kind)])].map(([id, name]) => <button key={id} onClick={() => setRecentCategory(id)} aria-pressed={recentCategory === id} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${recentCategory === id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{name}</button>)}</div>{recent.length ? <ul className="divide-y divide-ts-fg/[0.05]">{recent.map((r, i) => { const info = Object.values(catalog).find(item => item.name.toLowerCase() === r.name.toLowerCase()); return <li key={`${r.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm"><Img src={info?.stored} backup={info?.image} className="h-9 w-9 shrink-0 object-contain" fallback={<Boxes size={14} className="text-ts-fg/25" />} /><span className="min-w-0 flex-1"><span className="block truncate text-ts-fg/85">{r.name}</span><span className="text-xs capitalize text-ts-fg/35">{r.kind} &middot; {ago(r.at)}</span></span><span className="shrink-0 rounded-md bg-ts-pos/10 px-2 py-0.5 font-mono text-xs text-ts-pos">+{compactCount(r.gained)}</span></li>; })}</ul> : <p className="text-sm text-ts-fg/40">{recentCategory === 'all' ? 'No gains recorded yet.' : 'No daily activity in this category.'}</p>}</div>
          <div className={`${card} flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-ts-fg">Gains Chart</h3><GainChart daily={daily} /></div>
        </div>
        <p className="mt-4 text-xs text-ts-fg/40">Existing inventory is a baseline, not a gain. Activity stays for seven days; current inventory is kept.</p>
      </>}
    </>}
  </>;
}
