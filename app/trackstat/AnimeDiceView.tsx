'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, Boxes, Gauge, Heart, Shirt, Swords, Timer, ChevronRight, CircleDollarSign, Clock, Coins, Dices, Lock, RefreshCw, Search, TrendingUp, Users, Zap } from 'lucide-react';
import { compactCount, type CatalogEntry, type InventoryStack, type TrackstatDailyGains, type TrackstatMedia, type TrackstatPublic, type TrackstatSession } from '@/lib/trackstat';
import { loadInventory, type InventoryResult } from '@/lib/client/trackstat-inventory';
import InventoryControls from './InventoryControls';
import { CardSkeleton, DetailTable, GainChart, Img, Stat, ago, card, InventoryStat, inventoryStats, span, total, variantStyle, PlacedTag } from './ui';

const categories = [['all', 'All'], ['unit', 'Units'], ['boost', 'Boosts'], ['gear', 'Gear'], ['token', 'Tokens'], ['spin', 'Spins']] as const;
const metrics = ['units', 'boosts', 'gear', 'items'];
type Tab = 'overview' | 'inventory' | 'gains' | 'history' | 'community';
const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Session Gains', icon: TrendingUp }, { id: 'history', label: 'History', icon: Clock }, { id: 'community', label: 'Community', icon: Users },
];

const buffIcon = (n: string) => /luck/i.test(n) ? <Dices /> : /damage/i.test(n) ? <Swords /> : /health/i.test(n) ? <Heart /> : /speed/i.test(n) ? <Gauge /> : /money|income/i.test(n) ? <Coins /> : <Zap />;
const duration = (sec: number) => sec % 60 === 0 ? `${sec / 60}m` : `${Math.floor(sec / 60)}m ${sec % 60}s`;

export function AnimeDiceInventory({ stacks, catalog, loading }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry>; loading: boolean }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('income');
  const [lockedOnly, setLockedOnly] = useState(false);
  const [limit, setLimit] = useState(60);
  const name = (s: InventoryStack) => catalog[s.k]?.name ?? s.k.split(':').slice(1).join(':');
  const shown = (stacks ?? []).filter(s => (category === 'all' || catalog[s.k]?.kind === category) && (!lockedOnly || s.lk) && name(s).toLowerCase().includes(q.toLowerCase())).sort((a, b) => sort === 'name' ? name(a).localeCompare(name(b)) : sort === 'amount' ? b.a - a.a : sort === 'chance' ? (b.c ?? 0) - (a.c ?? 0) : (b.p ?? 0) - (a.p ?? 0));
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search Anime Dice inventory" value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Search unit or item…" className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Inventory category">{categories.map(([id, label]) => <button key={id} onClick={() => { setCategory(id); setLimit(60); }} aria-pressed={category === id} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${category === id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{label}</button>)}</div>
    </div>
    <InventoryControls sort={sort} onSort={value => { setSort(value); setLimit(60); }} options={[['income', 'Income'], ['chance', 'Roll rarity'], ['amount', 'Amount'], ['name', 'Name']]} filterLabel="Locked" favOnly={lockedOnly} onFav={value => { setLockedOnly(value); setLimit(60); }} summary={`${shown.length} of ${stacks?.length ?? 0} stacks`} />
    {loading && !stacks ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{[0, 1, 2, 3].map(i => <CardSkeleton key={i} />)}</div> : !stacks ? <p className={`${card} p-8 text-ts-fg/45`}>Inventory appears after the next sync.</p> : !shown.length ? <p className={`${card} p-8 text-ts-fg/45`}>Nothing matches.</p> : <>
      <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{shown.slice(0, limit).map((s, i) => {
        const info = catalog[s.k];
        return <div key={`${s.k}:${i}`} className={`${card} ts-hover relative flex flex-col`}>
          <span className="absolute -right-2 -top-3 z-10 font-mono text-lg font-extrabold leading-none text-ts-fg [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]"><span className="mr-px text-xs font-bold opacity-70">x</span>{compactCount(s.a)}</span>
          <div className="relative grid h-28 place-items-center overflow-hidden rounded-t-xl" style={{ background: `radial-gradient(circle at 50% 60%, ${info?.rarity_color ?? '#bca275'}33, transparent 70%)` }}>
            <Img src={info?.stored} backup={info?.image} className="h-20 w-20 object-contain" fallback={<Dices size={28} className="text-ts-accent/60" />} />
            {s.lk && <Lock size={14} className="absolute left-2 top-2 text-ts-accent" aria-label="Locked" />}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4"><div className="flex items-start justify-between gap-2"><p className="break-words text-sm font-semibold leading-tight text-ts-fg">{name(s)}</p>{s.pl ? <PlacedTag /> : null}</div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"><span style={{ color: info?.rarity_color ?? undefined }}>{info?.rarity ?? info?.kind}</span>{[...(s.m ?? []).map(m => ({ t: m, v: true })), ...(s.gr ? [{ t: `Grade ${s.gr}`, v: false }] : []), ...(s.tr ? [{ t: `Trait ${s.tr}`, v: false }] : [])].map((tag, n) => <span key={n} className={`flex items-center gap-1 font-medium ${tag.v ? '' : 'text-ts-fg/60'}`} style={tag.v ? variantStyle(tag.t) : undefined}><span className="text-ts-fg/25">·</span>{tag.v && <span>✦</span>}{tag.t}</span>)}</p>
            {info?.description && <p className="line-clamp-2 text-xs leading-5 text-ts-fg/45">{info.description}</p>}
            <div className={inventoryStats}>
              {s.bf?.map(([n, v]) => <InventoryStat key={n} value={v} label={n} icon={buffIcon(n)} tone="income" />)}
              {s.d ? <InventoryStat value={duration(s.d)} label="Duration" icon={<Timer />} /> : null}
              {s.sl ? <InventoryStat value={s.sl} label="Slot" icon={<Shirt />} /> : null}
              {s.lm ? <InventoryStat value={`x${compactCount(s.lm)}`} label="Luck" icon={<Dices />} tone="income" /> : null}
              {s.l ? <InventoryStat value={String(s.l)} label="Level" icon={<TrendingUp />} tone="income" /> : null}
              {s.c ? <InventoryStat value={`1 in ${compactCount(s.c)}`} label="Chance" icon={<Dices />} /> : null}
              {s.p ? <InventoryStat value={`$${compactCount(s.p)}/s`} label="Income" icon={<CircleDollarSign />} tone="income" /> : null}
            </div>
          </div>
        </div>;
      })}</div>{shown.length > limit && <button className="mx-auto mt-6 block rounded-lg border border-ts-fg/10 px-4 py-2.5 text-sm text-ts-fg/70 hover:border-ts-accent/50 hover:text-ts-accent" onClick={() => setLimit(n => n + 60)}>Show more</button>}
    </>}
  </div>;
}

export default function AnimeDiceView({ sessions, daily, media, community, live, roblox, onBack }: { sessions: TrackstatSession[]; daily: TrackstatDailyGains[]; media?: TrackstatMedia; community?: TrackstatPublic | null; live: boolean; roblox: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [sessionId, setSessionId] = useState('');
  const [recentCategory, setRecentCategory] = useState('all');
  const [loaded, setLoaded] = useState<{ key: string; data: InventoryResult }>();
  const latest = sessions[0];
  const selected = sessions.find(s => s.id === sessionId) ?? latest;
  const snapshot = selected?.snapshot;
  const updatedAt = latest?.updated_at;
  useEffect(() => {
    if (!roblox || !updatedAt) return;
    let active = true;
    const run = () => loadInventory(roblox, 'ad', updatedAt, data => { if (active) setLoaded({ key: roblox, data }); }).catch(() => {});
    void run();
    const timer = setInterval(() => { if (!document.hidden) void run(); }, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [roblox, updatedAt]);
  const inventory = loaded?.key === roblox ? loaded.data.inventory ?? undefined : undefined;
  const catalog = useMemo(() => loaded?.key === roblox ? loaded.data.catalog : {}, [loaded, roblox]);
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.stored ?? c.image])), [catalog]);
  const backups = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.image])), [catalog]);
  const top = [...(inventory ?? [])].filter(s => s.p).sort((x, y) => (y.p ?? 0) - (x.p ?? 0)).slice(0, 6);
  const recent = sessions.flatMap(s => s.snapshot.details.filter(d => d.gained > 0 && (recentCategory === 'all' || d.kind === recentCategory)).map(d => ({ ...d, at: s.updated_at }))).slice(0, 10);
  return <>
      <div className={`${card} mb-4 p-5`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ts-fg/10 text-ts-fg/60 hover:border-ts-accent/50 hover:text-ts-accent"><ArrowLeft size={16} /></button>
          <Img src={media?.animeDice} className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<Dices size={30} className="text-ts-accent" />} />
          <div className="min-w-0"><h2 className="text-xl font-semibold text-ts-fg">Anime Dice</h2><p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-2 w-2 rounded-full ${live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Tracking' : 'Not tracking'}</p><p className="mt-1 text-xs text-ts-fg/45">Tracking your units, boosts, gear, items and daily gains.</p></div>
        </div>
        <div className="mt-5 flex gap-1 overflow-x-auto border-t border-ts-fg/[0.07] pt-3" role="tablist" aria-label="Game sections">
          {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 pb-2 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ts-accent ${tab === t.id ? 'border-ts-accent text-ts-accent' : 'border-transparent text-ts-fg/45 hover:text-ts-fg'}`}><t.icon size={14} />{t.label}</button>)}
        </div>
      </div>
    {tab === 'community' ? (
        community ? (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat icon={<Users size={20} />} label="Accounts" value={compactCount(community.accounts)} />
            <Stat icon={<Activity size={20} />} label="Active now" value={compactCount(community.live)} />
            <Stat icon={<Clock size={20} />} label="Sessions" value={compactCount(community.sessions)} />
            <Stat icon={<TrendingUp size={20} />} label="Total gained" value={compactCount(total(community.gained))} />
            {metrics.map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{k} collected</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(community.gained[k])}>{compactCount(community.gained[k] ?? 0)}</p></div>)}
          </div>
        ) : <p className="text-sm text-ts-fg/40">Community totals are unavailable right now.</p> ) : !snapshot ? <p className={`${card} p-8 text-ts-fg/45`}>Run the updated library in Anime Dice to start automatic tracking.</p>
      : tab === 'inventory' ? <AnimeDiceInventory stacks={inventory} catalog={catalog} loading={!loaded || loaded.key !== roblox} />
      : tab === 'history' ? <div className={`${card} divide-y divide-ts-fg/[0.05]`}>
          {sessions.filter(s => !s.history_expired).map(s => <button key={s.id} onClick={() => { setSessionId(s.id); setTab('gains'); }} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-ts-fg/[0.03] ${s.id === selected?.id ? 'bg-ts-accent/[0.06]' : ''}`}><span><span className="block text-ts-fg/80">{new Date(s.started_at).toLocaleString()}</span><span className="text-xs text-ts-fg/40">{span(s)} · ${compactCount(s.snapshot.money ?? 0)}</span></span><span className="font-mono text-ts-pos">+{compactCount(total(s.snapshot.gained))}</span></button>)}
        </div>
      : tab === 'gains' ? <><div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(metric => <div key={metric} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{metric}</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(snapshot.owned[metric])}>{compactCount(snapshot.owned[metric] ?? 0)}</p><p className="mt-2 text-xs text-ts-accent">+{compactCount(snapshot.gained[metric] ?? 0)} gained</p></div>)}</div><DetailTable rows={snapshot.details} gainedOnly images={images} backups={backups} empty="No gains in this session yet." /><p className="mt-4 text-xs text-ts-fg/40">Positive inventory increases count, including trades and rewards. Existing inventory is the baseline, not a gain.</p></>
      : <><div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat icon={<Coins />} label="Money" value={`$${compactCount(snapshot.money ?? 0)}`} /><Stat icon={<Zap />} label="Placed unit income / second" value={`$${compactCount(snapshot.per_second ?? 0)}`} /><Stat icon={<Dices />} label="Rolls" value={compactCount(snapshot.rolls ?? 0)} /><Stat icon={<RefreshCw />} label="Rebirths" value={compactCount(snapshot.rebirths ?? 0)} />{metrics.map(metric => <Stat key={metric} icon={<Boxes />} label={metric} value={compactCount(snapshot.owned[metric] ?? 0)} />)}</div><div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><div className={`${card} p-5`}><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Recent Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">View All <ChevronRight size={12} /></button></div><div className="mb-3 flex flex-wrap gap-1">{categories.map(([id, label]) => <button key={id} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${recentCategory === id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`} aria-pressed={recentCategory === id} onClick={() => setRecentCategory(id)}>{label}</button>)}</div>{recent.length ? <ul className="divide-y divide-ts-fg/[0.05]">{recent.map((r, i) => <li key={`${r.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm"><Img src={images[r.name.toLowerCase()]} backup={backups[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 object-contain" fallback={<Dices size={14} className="text-ts-fg/25" />} /><span className="min-w-0 flex-1"><span className="block truncate text-ts-fg/85">{r.name}</span><span className="text-xs capitalize text-ts-fg/35">{r.kind} · {ago(r.at)}</span></span><span className="shrink-0 rounded-md bg-ts-pos/10 px-2 py-0.5 font-mono text-xs text-ts-pos">+{compactCount(r.gained)}</span></li>)}</ul> : <p className="text-sm text-ts-fg/40">{recentCategory === 'all' ? 'No gains recorded yet.' : 'No recent activity in this category.'}</p>}</div><div className={`${card} flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-ts-fg">Gains Chart</h3><GainChart daily={daily} /></div></div>{!!top.length && <div className={`${card} mt-4 p-5`}><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Most Valuable</h3><button onClick={() => setTab('inventory')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">Open inventory <ChevronRight size={12} /></button></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{top.map((u, i) => { const info = catalog[u.k]; return <div key={`${u.k}:${i}`} className="rounded-lg border border-ts-fg/[0.06] p-3 text-center" style={{ background: `radial-gradient(circle at 50% 30%, ${info?.rarity_color ?? '#7458f5'}22, transparent 70%)` }}><Img src={info?.stored} backup={info?.image} className="mx-auto h-14 w-14 object-contain" fallback={<Dices size={22} className="text-ts-fg/25" />} /><p className="mt-2 truncate text-xs font-medium text-ts-fg" title={info?.name}>{info?.name ?? u.k.split(':')[1]}</p><p className="mt-1 font-mono text-xs text-ts-pos">${compactCount(u.p ?? 0)}/s</p>{u.c ? <p className="text-[10px] text-ts-fg/35">1 in {compactCount(u.c)}</p> : null}</div>; })}</div></div>}
      <p className="mt-4 text-xs text-ts-fg/40"><Clock className="mr-1 inline" size={12} />Inventory refreshes every 15 seconds from the library. Activity is retained for 8 days; the latest inventory is kept.</p></>}
  </>;
}
