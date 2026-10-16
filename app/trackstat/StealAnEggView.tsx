'use client';

import { loadInventory } from '@/lib/client/trackstat-inventory';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, Boxes, ChevronRight, Clock, Coins, Egg, Gauge, PawPrint, Search, Star, Swords, TrendingUp, Users, Weight, Zap } from 'lucide-react';
import { compactCount, type TrackstatDailyGains, type CatalogEntry, type InventoryStack, type TrackstatMedia, type TrackstatPublic, type TrackstatSession } from '@/lib/trackstat';
import { CardSkeleton, DetailTable, GainChart, Img, Stat, ago, card, span, total } from './ui';

type Tab = 'overview' | 'inventory' | 'gains' | 'history' | 'community';
const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Session Gains', icon: TrendingUp }, { id: 'history', label: 'History', icon: Clock }, { id: 'community', label: 'Community', icon: Users },
];
const categories = [{ id: 'all', label: 'All' }, { id: 'pet', label: 'Pets' }, { id: 'egg', label: 'Eggs' }, { id: 'gear', label: 'Gear' }, { id: 'item', label: 'Items' }];
const metrics = ['pets', 'eggs', 'gear', 'items'] as const;
const kg = (value: number) => `${compactCount(value)} kg`;

function MutationTags({ list }: { list?: string[] }) {
  return list?.length ? <div className="flex flex-wrap gap-1">{list.map(m => <span key={m} className="rounded bg-ts-accent/15 px-1.5 py-0.5 text-[10px] text-ts-accent">{m}</span>)}</div> : null;
}

function InventoryCard({ stack, info }: { stack: InventoryStack; info?: CatalogEntry }) {
  const [kind, id] = stack.k.split(':');
  const color = info?.rarity_color ?? '#7458f5';
  return (
    <div className={`${card} flex flex-col overflow-hidden`}>
      <div className="relative grid h-28 place-items-center" style={{ background: `radial-gradient(circle at 50% 60%, ${color}33, transparent 70%)` }}>
        <Img src={info?.stored} backup={info?.image} className="h-20 w-20 object-contain" fallback={<PawPrint size={28} className="text-ts-fg/25" />} />
        {stack.f && <Star size={16} className="absolute left-3 top-3 fill-ts-accent text-ts-accent" aria-label="Favorite" />}
        {stack.a > 1 && <span className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-0.5 font-mono text-xs text-ts-fg" title={String(stack.a)}>x{compactCount(stack.a)}</span>}
        {stack.pl ? <span className="absolute bottom-2 right-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ts-fg/70">Placed</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="break-words text-sm font-semibold leading-tight text-ts-fg">{info?.name ?? id}</p>
        <p className="text-xs font-medium" style={{ color }}>{info?.rarity ?? kind}</p>
        <MutationTags list={stack.m} />
        {kind !== 'pet' && kind !== 'egg' && info?.description && <p className="line-clamp-2 text-xs leading-5 text-ts-fg/45">{info.description}</p>}
        <div className="mt-auto space-y-1 border-t border-ts-fg/[0.06] pt-3 text-xs">
          {stack.w ? <p className="flex items-center gap-1 text-ts-fg/60"><Weight size={12} />{kg(stack.w)}</p> : null}
          {stack.p ? <p className="flex items-center gap-1 text-ts-pos"><Coins size={12} />${compactCount(stack.p)}/s</p> : null}
        </div>
      </div>
    </div>
  );
}

function InventoryView({ stacks, catalog, loading }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry>; loading: boolean }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(60);
  const shown = useMemo(() => (stacks ?? [])
    .filter(s => (cat === 'all' || s.k.startsWith(`${cat}:`)) && (catalog[s.k]?.name ?? s.k.split(':')[1]).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.p ?? 0) - (a.p ?? 0) || (b.w ?? 0) - (a.w ?? 0) || b.a - a.a), [stacks, catalog, q, cat]);
  if (!stacks) return loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div> : <div className={`${card} p-10 text-sm text-ts-fg/45`}>Inventory details appear after the next sync from the updated library.</div>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search inventory" value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Search pet, egg, gear or item…" className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Inventory category">{categories.map(c => <button key={c.id} aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setLimit(60); }} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${cat === c.id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{c.label}</button>)}</div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : shown.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{shown.slice(0, limit).map((s, i) => <InventoryCard key={`${s.k}:${i}`} stack={s} info={catalog[s.k]} />)}</div>
          {shown.length > limit && <button onClick={() => setLimit(l => l + 60)} className="mx-auto mt-6 block rounded-lg border border-ts-fg/10 px-4 py-2.5 text-sm text-ts-fg/70 hover:border-ts-accent/50 hover:text-ts-accent">Show more ({shown.length - limit})</button>}
        </>
      ) : <p className={`${card} p-8 text-sm text-ts-fg/40`}>Nothing matches.</p>}
    </div>
  );
}

export default function StealAnEggView({ sessions, daily = [], media, community, live, roblox, onBack }: { sessions: TrackstatSession[]; daily?: TrackstatDailyGains[]; roblox: string; media: TrackstatMedia | undefined; community: TrackstatPublic | null | undefined; live: boolean; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [sessionId, setSessionId] = useState('');
  const [recentCategory, setRecentCategory] = useState('all');
  const [catalog, setCatalog] = useState<Record<string, CatalogEntry>>({});
  const [loadedFor, setLoadedFor] = useState('');
  const [inventory, setInventory] = useState<InventoryStack[] | undefined>();
  const latest = sessions[0];
  const selected = sessions.find(s => s.id === sessionId) || latest;
  const snap = selected?.snapshot;
  const signature = `${roblox}:${latest?.id}`;
  const hasInventory = !!latest?.snapshot.has_inventory;
  const latestUpdated = useRef<string>(undefined);
  useEffect(() => { latestUpdated.current = latest?.updated_at; });
  useEffect(() => {
    if (!latest || !roblox) return;
    let live = true;
    const run = () => loadInventory(roblox, 'sae', latestUpdated.current, result => {
      if (!live) return;
      setCatalog(result.catalog);
      if (result.inventory) setInventory(result.inventory);
    }).catch(() => {}).finally(() => { if (live) setLoadedFor(signature); });
    void run();
    const timer = setInterval(() => { if (!document.hidden) void run(); }, 60000);
    return () => { live = false; clearInterval(timer); };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.stored ?? c.image])), [catalog]);
  const backups = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.image])), [catalog]);
  const recent = sessions.flatMap(s => s.snapshot.details.filter(d => d.gained > 0 && (recentCategory === 'all' || d.kind === recentCategory)).map(d => ({ ...d, at: s.updated_at }))).slice(0, 10);
  const top = [...(inventory ?? [])].filter(s => s.k.startsWith('pet:')).sort((a, b) => (b.p ?? 0) - (a.p ?? 0)).slice(0, 6);

  return (
    <>
      <div className={`${card} mb-4 p-5`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ts-fg/10 text-ts-fg/60 hover:border-ts-accent/50 hover:text-ts-accent"><ArrowLeft size={16} /></button>
          <Img src={media?.stealAnEgg} className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<Egg size={30} className="text-ts-accent" />} />
          <div className="min-w-0"><h2 className="text-xl font-semibold text-ts-fg">Steal an Egg</h2><p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-2 w-2 rounded-full ${live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Tracking' : 'Not tracking'}</p><p className="mt-1 text-xs text-ts-fg/45">Tracking your money, speed, pets, eggs, gear and items.</p></div>
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
        ) : <p className="text-sm text-ts-fg/40">Community totals are unavailable right now.</p>
      ) : !snap ? (
        <div className={`${card} p-10`}><Activity className="mb-4 text-ts-accent" size={28} /><h3 className="text-lg font-semibold text-ts-fg">No sessions yet</h3><p className="mt-3 max-w-md text-sm leading-7 text-ts-fg/45">Open the Trackstat tab in the library while playing Steal an Egg and turn on Track this account.</p></div>
      ) : tab === 'overview' ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
            <Stat icon={<Coins size={20} className="text-ts-pos" />} label="Money" value={`$${compactCount(snap.money ?? 0)}`} hint={String(snap.money ?? 0)} />
            <Stat icon={<Gauge size={20} />} label="Speed" value={compactCount(snap.speed ?? 0)} hint={String(snap.speed ?? 0)} />
            <Stat icon={<Zap size={20} />} label="Money / second" value={`$${compactCount(snap.per_second ?? 0)}/s`} hint={String(snap.per_second ?? 0)} />
            <Stat icon={<PawPrint size={20} />} label="Pets" value={compactCount(snap.owned.pets ?? 0)} />
            <Stat icon={<Egg size={20} />} label="Eggs" value={compactCount(snap.owned.eggs ?? 0)} />
            <Stat icon={<TrendingUp size={20} />} label="Session gains" value={`+${compactCount(total(snap.gained))}`} />
          </div>
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className={`${card} p-5`}>
              <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Recent Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">View All <ChevronRight size={12} /></button></div>
              <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Recent activity category">{categories.map(c => <button key={c.id} aria-pressed={recentCategory === c.id} onClick={() => setRecentCategory(c.id)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${recentCategory === c.id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{c.label}</button>)}</div>
              {recent.length ? <ul className="divide-y divide-ts-fg/[0.05]">{recent.map((r, i) => <li key={`${r.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm"><Img src={images[r.name.toLowerCase()]} backup={backups[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 object-contain" fallback={<PawPrint size={14} className="text-ts-fg/25" />} /><span className="min-w-0 flex-1"><span className="block truncate text-ts-fg/85">{r.name}</span><span className="text-xs capitalize text-ts-fg/35">{r.kind} · {ago(r.at)}</span></span><span className="shrink-0 rounded-md bg-ts-pos/10 px-2 py-0.5 font-mono text-xs text-ts-pos">+{compactCount(r.gained)}</span></li>)}</ul> : <p className="text-sm text-ts-fg/40">{recentCategory === 'all' ? 'No gains recorded yet.' : 'No recent activity in this category.'}</p>}
            </div>
            <div className={`${card} flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-ts-fg">Gains Chart</h3><GainChart daily={daily} /></div>
          </div>
          {!!top.length && (
            <div className={`${card} mt-4 p-5`}>
              <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Top Earners</h3><button onClick={() => setTab('inventory')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">Open inventory <ChevronRight size={12} /></button></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {top.map((t, i) => {
                  const info = catalog[t.k];
                  return (
                    <div key={`${t.k}:${i}`} className="rounded-lg border border-ts-fg/[0.06] p-3 text-center" style={{ background: `radial-gradient(circle at 50% 30%, ${info?.rarity_color ?? '#7458f5'}22, transparent 70%)` }}>
                      <Img src={info?.stored} backup={info?.image} className="mx-auto h-14 w-14 object-contain" fallback={<PawPrint size={22} className="text-ts-fg/25" />} />
                      <p className="mt-2 truncate text-xs font-medium text-ts-fg" title={info?.name}>{info?.name ?? t.k.split(':')[1]}</p>
                      <p className="mt-1 font-mono text-xs text-ts-pos">${compactCount(t.p ?? 0)}/s</p>
                      {t.w ? <p className="text-[10px] text-ts-fg/35">{kg(t.w)}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : tab === 'inventory' ? <InventoryView stacks={inventory} catalog={catalog} loading={hasInventory && loadedFor !== signature} />
      : tab === 'gains' ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(k => <div key={k} className={`${card} p-4`}><p className="flex items-center gap-1 text-xs capitalize text-ts-fg/45">{k === 'gear' && <Swords size={12} />}{k}</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(snap.owned[k])}>{compactCount(snap.owned[k] ?? 0)}</p><p className="mt-2 text-xs text-ts-accent">+{compactCount(snap.gained[k] ?? 0)} gained</p></div>)}</div>
          <DetailTable rows={snap.details} gainedOnly images={images} backups={backups} empty="Nothing gained in this session yet." />
          <p className="mt-5 text-xs leading-6 text-ts-fg/35">Gains count inventory increases while tracking, including trades and rewards. Stats are client-reported.</p>
        </>
      ) : (
        <div className={`${card} divide-y divide-ts-fg/[0.05]`}>
          {sessions.filter(s => !s.history_expired).map(s => <button key={s.id} onClick={() => { setSessionId(s.id); setTab('gains'); }} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-ts-fg/[0.03] ${s.id === selected?.id ? 'bg-ts-accent/[0.06]' : ''}`}><span><span className="block text-ts-fg/80">{new Date(s.started_at).toLocaleString()}</span><span className="text-xs text-ts-fg/40">{span(s)} · ${compactCount(s.snapshot.money ?? 0)}</span></span><span className="font-mono text-ts-pos">+{compactCount(total(s.snapshot.gained))}</span></button>)}
        </div>
      )}
    </>
  );
}
