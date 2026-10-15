'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Boxes, CalendarDays, ChevronRight, Clock, Gem, LayoutGrid, Link2, List, PawPrint, RefreshCw, Search, Star, TrendingUp, Users, Egg, Plus } from 'lucide-react';
import { PET_SIMULATOR_99, STEAL_AN_EGG, compactCount, type CatalogEntry, type Counts, type InventoryStack, type TrackstatResponse } from '@/lib/trackstat';
import StealAnEggView from './StealAnEggView';
import { Avatar, CardSkeleton, DetailTable, GainChart, Img, PageSkeleton, Stat, ago, button, card, span, total } from './ui';

type Tab = 'overview' | 'inventory' | 'gains' | 'history' | 'community';

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Session Gains', icon: TrendingUp }, { id: 'history', label: 'History', icon: Clock }, { id: 'community', label: 'Community', icon: Users },
];
const pets = (c: Counts) => c.huge + c.titanic + c.gargantuan;

const categories = [
  { id: 'all', label: 'All', classes: [] as string[] }, { id: 'pets', label: 'Pets', classes: ['Pet'] }, { id: 'gems', label: 'Gems', classes: ['Currency'] },
  { id: 'items', label: 'Items', classes: ['Misc', 'Lootbox', 'Box', 'Seed', 'Fruit', 'Tool', 'Hoverboard', 'Worker', 'Booth', 'Ultimate'] },
  { id: 'buffs', label: 'Buffs', classes: ['Potion', 'Consumable'] }, { id: 'enchants', label: 'Enchants', classes: ['Enchant'] }, { id: 'charms', label: 'Charms', classes: ['Charm'] },
];
const variants: Record<string, string> = { g: 'Golden', r: 'Rainbow', s: 'Shiny' };

function InventoryCard({ stack, info }: { stack: InventoryStack; info?: CatalogEntry }) {
  const [cls, id, , variant] = stack.k.split(':');
  const color = info?.rarity_color ?? '#c9a97a';
  const exclusive = info?.rarity === 'Exclusive' || !!stack.e;
  return (
    <div className={`${card} flex flex-col overflow-hidden`}>
      <div className="relative grid h-28 place-items-center" style={{ background: `radial-gradient(circle at 50% 60%, ${color}33, transparent 70%)` }}>
        <Img src={info?.stored} backup={info?.image} className="h-20 w-20 object-contain" fallback={<Gem size={28} className="text-white/25" />} />
        {stack.f && <Star size={16} className="absolute left-3 top-3 fill-[#c9a97a] text-[#c9a97a]" aria-label="Favorite" />}
        <span className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-0.5 font-mono text-xs text-white" title={String(stack.a)}>x{compactCount(stack.a)}</span>
        {stack.l ? <span className="absolute bottom-2 left-3 rounded-md bg-black/50 px-2 py-0.5 text-xs text-emerald-300">Lv {stack.l}</span> : null}
        {variants[variant] && <span className="absolute bottom-2 right-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">{variants[variant]}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="break-words text-sm font-semibold leading-tight text-white">{info?.name ?? id}</p>
        <p className="text-xs font-medium" style={{ color }}>{info?.rarity ?? cls}{exclusive && ' ★'}</p>
        {cls === 'Pet' && !!stack.cs && (
          <div className="flex flex-wrap gap-1" aria-label="Charm slots">{Array.from({ length: stack.cs }, (_, i) => <span key={i} className={`rounded px-1.5 py-0.5 text-[10px] ${stack.ch?.[i] ? 'bg-[#c9a97a]/15 text-[#c9a97a]' : 'border border-dashed border-white/15 text-white/25'}`}>{stack.ch?.[i] ?? 'empty'}</span>)}</div>
        )}
        {cls !== 'Pet' && info?.description && <p className="line-clamp-2 text-xs leading-5 text-white/45">{info.description}</p>}
        <div className="mt-auto border-t border-white/[0.06] pt-3 text-xs">
          {stack.x ? <p className="text-white/45">{compactCount(stack.x)} Exist</p> : null}
          {stack.r ? <p className="mt-1 flex items-center gap-1 text-cyan-300"><Gem size={12} />{compactCount(stack.r * stack.a)}{stack.a > 1 && <span className="text-white/40">({compactCount(stack.r)}/ea)</span>}</p> : null}
        </div>
      </div>
    </div>
  );
}

function InventoryView({ stacks, catalog, loading }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry>; loading: boolean }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(60);
  const shown = useMemo(() => {
    const classes = categories.find(c => c.id === cat)?.classes ?? [];
    return (stacks ?? [])
    .filter(s => (!classes.length || classes.includes(s.k.split(':')[0])) && (catalog[s.k]?.name ?? s.k.split(':')[1]).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.r ?? 0) * b.a - (a.r ?? 0) * a.a);
  }, [stacks, catalog, q, cat]);
  if (!stacks) return <div className={`${card} p-10 text-sm text-white/45`}>Inventory details appear after the next sync from the updated library.</div>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Search inventory" value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Search item or pet…" className="w-full rounded-lg border border-white/10 bg-[#101010] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#c9a97a]" /></label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Inventory category">{categories.map(c => <button key={c.id} aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setLimit(60); }} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${cat === c.id ? 'bg-[#c9a97a] font-medium text-black' : 'bg-white/[0.04] text-white/55 hover:text-white'}`}>{c.label}</button>)}</div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : shown.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{shown.slice(0, limit).map((s, i) => <InventoryCard key={`${s.k}:${i}`} stack={s} info={catalog[s.k]} />)}</div>
          {shown.length > limit && <button onClick={() => setLimit(l => l + 60)} className={`${button} mx-auto mt-6 block`}>Show more ({shown.length - limit})</button>}
        </>
      ) : <p className={`${card} p-8 text-sm text-white/40`}>Nothing matches.</p>}
    </div>
  );
}

export default function TrackstatPanel() {
  const [data, setData] = useState<TrackstatResponse | null>(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<'games' | 'connection'>('games');
  const [game, setGame] = useState<'ps99' | 'sae' | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>('overview');
  const [sessionId, setSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [listView, setListView] = useState(false);
  const [catalog, setCatalog] = useState<Record<string, CatalogEntry>>({});
  const [loadedFor, setLoadedFor] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/trackstat', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
      setError(body.reconnect ? 'Your key was reset. Copy the new key from the library to reconnect.' : '');
    } catch (e) { setError(e instanceof Error ? e.message : 'Trackstat could not refresh.'); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function connect(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/trackstat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setKey(''); setSessionId(''); setGame(null); setPage('games'); setActiveIndex(body.index ?? 0);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setBusy(false); }
  }
  async function removeAccount(index: number) {
    setBusy(true);
    try {
      const response = await fetch('/api/trackstat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
      if (!response.ok) throw new Error('Could not remove the account. Try again.');
      setSessionId(''); setGame(null); setActiveIndex(0);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove the account.'); }
    finally { setBusy(false); }
  }
  async function decideLink(index: number, id: string, approve: boolean) {
    setBusy(true);
    try {
      const response = await fetch('/api/trackstat/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index, id, approve }) });
      if (!response.ok) throw new Error((await response.json()).error);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not answer the request.'); await load(); }
    finally { setBusy(false); }
  }
  function selectAccount(index: number) {
    setActiveIndex(index); setSessionId(''); setGame(null); setPage('games');
  }

  const accounts = data?.accounts ?? [];
  const history = accounts.find(a => a.index === activeIndex) ?? accounts[0];
  const avatarOf = (id?: string) => (id ? data?.media?.avatars?.[id] : null);
  const allSessions = history?.sessions ?? [];
  const sessions = allSessions.filter(s => s.game_id === PET_SIMULATOR_99);
  const saeSessions = allSessions.filter(s => s.game_id === STEAL_AN_EGG);
  const lastAny = allSessions[0];
  const gamesTracked = new Set(allSessions.map(s => s.game_id)).size;
  const selected = sessions.find(s => s.id === sessionId) || sessions[0];
  const latest = sessions[0];
  const totalGains = allSessions.reduce((n, s) => n + total(s.snapshot.gained), 0);
  const liveSae = !!saeSessions[0] && Date.now() - new Date(saeSessions[0].updated_at).getTime() < 120000;
  const live = !!latest && Date.now() - new Date(latest.updated_at).getTime() < 120000;
  const inventoryKey = `${history?.index}:${latest?.id}:${latest?.snapshot.inventory?.length ?? 0}`;
  useEffect(() => {
    if (!latest?.snapshot.inventory?.length) return;
    fetch(`/api/trackstat/catalog?account=${history?.index ?? 0}`, { cache: 'no-store' }).then(r => r.json()).then(b => setCatalog(b.catalog ?? {})).catch(() => {}).finally(() => setLoadedFor(inventoryKey));
  }, [inventoryKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.stored ?? c.image])), [catalog]);
  const recent = sessions.flatMap(s => s.snapshot.details.filter(d => d.gained > 0).map(d => ({ ...d, at: s.updated_at }))).slice(0, 10);
  const stacks = selected?.snapshot.inventory;
  const totalValue = (stacks ?? []).reduce((n, x) => n + (x.r ?? 0) * x.a, 0);
  const topStacks = [...(stacks ?? [])].sort((a, b) => (b.r ?? 0) * b.a - (a.r ?? 0) * a.a).slice(0, 6);

  const connection = (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-white">Library connection</h2>
      {accounts.length > 0 && (
        <ul className="mt-5 space-y-2">
          {accounts.map(a => (
            <li key={a.index} className="flex items-center gap-3 rounded-lg border border-white/[0.07] p-3">
              <Avatar src={avatarOf(a.account.roblox_id)} name={a.account.username} small />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm text-white">{a.account.username}</span><span className="text-xs text-white/40">Roblox ID {a.account.roblox_id}</span></span>
              <button className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-red-400/50 hover:text-red-300 disabled:opacity-40" onClick={() => void removeAccount(a.index)} disabled={busy} aria-label={`Remove ${a.account.username}`}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={connect} className="mt-6 space-y-4">
        <label htmlFor="trackstat-key" className="block text-sm text-white/60">{accounts.length ? 'Add another account' : 'Connection key'}</label>
        <input id="trackstat-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e => setKey(e.target.value)} placeholder="sp_…" maxLength={67} required className="w-full min-w-0 rounded-lg border border-white/10 bg-[#111] px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#c9a97a]" />
        <button className={`${button} w-full border-[#c9a97a]/40 bg-[#c9a97a]/10 text-[#c9a97a]`} disabled={busy || !key.trim()}>{busy ? 'Connecting…' : accounts.length ? 'Add account' : 'Connect account'}</button>
      </form>
      <p className="mt-4 text-xs leading-6 text-white/40">Run the library on each Roblox account, copy its key, and paste it here. You can connect up to 10 accounts and switch between them in the sidebar.</p>
    </div>
  );

  const community = data && (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat icon={<Users size={20} />} label="Accounts" value={compactCount(data.public.accounts)} />
      <Stat icon={<Activity size={20} />} label="Active now" value={compactCount(data.public.live)} />
      <Stat icon={<Clock size={20} />} label="Sessions" value={compactCount(data.public.sessions)} />
      <Stat icon={<TrendingUp size={20} />} label="Total gained" value={compactCount(total(data.public.gained))} />
      {(['items', 'huge', 'titanic', 'gargantuan'] as const).map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-white/45">{k} collected</p><p className="mt-2 font-mono text-2xl text-white" title={String(data.public.gained[k])}>{compactCount(data.public.gained[k])}</p></div>)}
    </div>
  );

  let main: ReactNode;
  if (!data) main = error ? <p className="py-12 text-sm text-white/40">Refresh to try again.</p> : <PageSkeleton />;
  else if (page === 'connection') main = (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className={`${card} p-6`}>{connection}</div>
      <div className="space-y-4">
        <div className={`${card} p-6`}>
          <h2 className="text-lg font-semibold text-white">How it works</h2>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-white/60">
            {[
              ['Open Trackstat in the library', 'Load the Seisen library in a supported game and open the Trackstat tab.'],
              ['Copy your connection key', 'Press Copy connection key. Each Roblox account gets its own private key, and no website account is needed.'],
              ['Paste it here', 'Paste the key into the box on this page. This browser stays connected for 30 days.'],
              ['Play a supported game', 'Tracking starts automatically when the library detects the game. Your inventory and session gains sync about every 15 seconds. Approve new devices here when prompted.'],
            ].map(([title, text], i) => <li key={title} className="flex gap-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c9a97a]/10 font-mono text-xs text-[#c9a97a]">{i + 1}</span><span><span className="block font-medium text-white">{title}</span>{text}</span></li>)}
          </ol>
          <div className="mt-6 space-y-2 border-t border-white/[0.07] pt-5 text-xs leading-6 text-white/45">
            <p><span className="text-white/70">Activity is kept for 8 days after the last session sync.</span> Older gains and history are automatically removed. Your latest inventory stays until the next game sync updates it.</p>
            <p><span className="text-white/70">Resetting the key</span> in the library stops the old key from working but keeps your inventory and retained history under the new one.</p>
            <p><span className="text-white/70">Keep your key private.</span> Anyone holding it can see your inventory and history. Stats are reported by the library, so they are not verified.</p>
          </div>
        </div>
        <div className={`${card} p-6`}>
          <h2 className="text-lg font-semibold text-white">Supported games</h2>
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Img src={data?.media?.game} className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-[#c9a97a]/25 to-[#1a1a1a]" fallback={<PawPrint size={24} className="text-[#c9a97a]" />} />
            <div className="min-w-0"><p className="text-sm font-medium text-white">Pet Simulator 99</p><p className="mt-1 text-xs text-white/45">Full inventory, Huge / Titanic / Gargantuan pets, items, enchants and session gains.</p></div>
          </div>
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Img src={data?.media?.stealAnEgg} className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-[#c9a97a]/25 to-[#1a1a1a]" fallback={<Egg size={24} className="text-[#c9a97a]" />} />
            <div className="min-w-0"><p className="text-sm font-medium text-white">Steal an Egg</p><p className="mt-1 text-xs text-white/45">Money, speed, pets with weight and mutations, eggs, gear and items.</p></div>
          </div>
          <p className="mt-3 text-xs text-white/35">More games will be added over time.</p>
        </div>
      </div>
    </div>
  );
  else if (!game) {
    main = (
      <>
        <div className={`${card} mb-6 flex flex-wrap items-center gap-5 p-5`}>
          {history ? <Avatar src={avatarOf(history.account.roblox_id)} name={history.account.username} /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-white/[0.05] text-2xl text-white/40">?</span>}
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="break-words text-2xl font-semibold text-white">{history?.account.username ?? 'Not connected'}</h2>
            <p className={`mt-1 flex items-center gap-2 text-sm ${history ? 'text-emerald-400' : 'text-white/40'}`}><span className={`h-2 w-2 rounded-full ${history ? 'bg-emerald-400' : 'bg-white/30'}`} />{history ? 'Connected' : 'Not connected'}</p>
            <p className="mt-2 text-xs text-white/45">{history ? 'Your inventory, session gains, and history are being tracked.' : 'Open Connection and paste your library key to start.'}</p>
          </div>
          {history && (
            <div className="grid w-full grid-cols-2 gap-3 xl:w-auto xl:grid-cols-4">
              <Stat icon={<Gem size={20} />} label="Games tracked" value={String(gamesTracked)} />
              <Stat icon={<TrendingUp size={20} />} label="Total session gains" value={`+${compactCount(totalGains)}`} hint={String(totalGains)} />
              <Stat icon={<Clock size={20} />} label="Session time" value={lastAny ? span(lastAny) : '—'} />
              <Stat icon={<CalendarDays size={20} />} label="Last played" value={lastAny ? ago(lastAny.updated_at) : '—'} />
            </div>
          )}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Supported Games (2)</h3>
          <div className="flex items-center gap-2">
            <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Search game" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search game…" className="w-48 rounded-lg border border-white/10 bg-[#101010] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#c9a97a]" /></label>
            {([false, true] as const).map(l => <button key={String(l)} aria-label={l ? 'List view' : 'Grid view'} aria-pressed={listView === l} onClick={() => setListView(l)} className={`grid h-9 w-9 place-items-center rounded-lg border ${listView === l ? 'border-[#c9a97a]/50 bg-[#c9a97a]/10 text-[#c9a97a]' : 'border-white/10 text-white/50'}`}>{l ? <List size={16} /> : <LayoutGrid size={16} />}</button>)}
          </div>
        </div>
        {(() => {
          const list = [
            { id: 'ps99' as const, name: 'Pet Simulator 99', image: data?.media?.game, icon: <PawPrint size={36} className="text-[#c9a97a]" />, live, played: !!latest },
            { id: 'sae' as const, name: 'Steal an Egg', image: data?.media?.stealAnEgg, icon: <Egg size={36} className="text-[#c9a97a]" />, live: liveSae, played: saeSessions.length > 0 },
          ].filter(g => g.name.toLowerCase().includes(search.trim().toLowerCase()));
          return list.length ? (
            <div className={listView ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}>
              {list.map(g => (
                <button key={g.id} onClick={() => setGame(g.id)} className={`${card} group w-full ${listView ? 'flex items-center' : ''} overflow-hidden text-left transition-colors hover:border-[#c9a97a]/40 focus-visible:outline-2 focus-visible:outline-[#c9a97a]`}>
                  <Img src={g.image} className={`bg-gradient-to-br from-[#c9a97a]/25 to-[#1a1a1a] ${listView ? 'h-20 w-32 shrink-0' : 'h-36 w-full'}`} fallback={g.icon} />
                  <div className="flex min-w-0 flex-1 items-center justify-between p-4">
                    <div><p className="text-sm font-medium text-white">{g.name}</p><p className={`mt-1 flex items-center gap-2 text-xs ${g.live ? 'text-emerald-400' : 'text-white/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${g.live ? 'bg-emerald-400' : 'bg-white/30'}`} />{g.live ? 'Tracking' : history && g.played ? 'Idle' : 'Not played'}</p></div>
                    <ChevronRight size={16} className="text-white/35 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-white/40">No games match.</p>;
        })()}
      </>
    );
  } else if (game === 'sae') {
    main = <StealAnEggView sessions={saeSessions} media={data.media} community={data.publicStealAnEgg} live={liveSae} account={history?.index ?? 0} onBack={() => setGame(null)} />;
  } else {
    const counts = selected?.snapshot;
    main = (
      <>
        <div className={`${card} mb-4 p-5`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setGame(null)} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/60 hover:border-[#c9a97a]/50 hover:text-[#c9a97a]"><ArrowLeft size={16} /></button>
            <Img src={data?.media?.game} className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-[#c9a97a]/25 to-[#1a1a1a]" fallback={<PawPrint size={30} className="text-[#c9a97a]" />} />
            <div className="min-w-0"><h2 className="text-xl font-semibold text-white">Pet Simulator 99</h2><p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-emerald-400' : 'text-white/40'}`}><span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400' : 'bg-white/30'}`} />{live ? 'Tracking' : 'Not tracking'}</p><p className="mt-1 text-xs text-white/45">Tracking your inventory, session gains, and history.</p></div>
          </div>
          <div className="mt-5 flex gap-1 overflow-x-auto border-t border-white/[0.07] pt-3" role="tablist" aria-label="Game sections">
            {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 pb-2 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#c9a97a] ${tab === t.id ? 'border-[#c9a97a] text-[#c9a97a]' : 'border-transparent text-white/45 hover:text-white'}`}><t.icon size={14} />{t.label}</button>)}
          </div>
        </div>
        {tab === 'community' ? community : !history || !counts ? (
          <div className={`${card} p-10`}><Activity className="mb-4 text-[#c9a97a]" size={28} /><h3 className="text-lg font-semibold text-white">{history ? 'No sessions yet' : 'Connect your library account'}</h3><p className="mt-3 max-w-md text-sm leading-7 text-white/45">{history ? 'Turn on tracking in the library to start your first session.' : 'Your inventory and session history stay private to your connection key.'}</p></div>
        ) : tab === 'overview' ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
              <Stat icon={<Gem size={20} className="text-cyan-300" />} label="Total value" value={stacks ? compactCount(totalValue) : '—'} hint={String(totalValue)} />
              <Stat icon={<Boxes size={20} />} label="Items" value={compactCount(counts.owned.items)} hint={String(counts.owned.items)} />
              <Stat icon={<PawPrint size={20} />} label="Large pets" value={compactCount(pets(counts.owned))} hint={String(pets(counts.owned))} />
              <Stat icon={<Gem size={20} />} label="Huge" value={compactCount(counts.owned.huge)} />
              <Stat icon={<TrendingUp size={20} />} label="Session gains" value={`+${compactCount(total(counts.gained))}`} />
              <Stat icon={<Clock size={20} />} label="Session time" value={span(selected)} />
            </div>
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className={`${card} p-5`}>
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Recent Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-[#c9a97a] hover:underline">View All <ChevronRight size={12} /></button></div>
                {recent.length ? <ul className="divide-y divide-white/[0.05]">{recent.map((r, i) => <li key={`${r.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm"><Img src={images[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 object-contain" fallback={<Gem size={14} className="text-white/25" />} /><span className="min-w-0 flex-1"><span className="block truncate text-white/85">{r.name}</span><span className="text-xs capitalize text-white/35">{r.kind} · {ago(r.at)}</span></span><span className="shrink-0 rounded-md bg-emerald-400/10 px-2 py-0.5 font-mono text-xs text-emerald-400">+{compactCount(r.gained)}</span></li>)}</ul> : <p className="text-sm text-white/40">No gains recorded yet.</p>}
              </div>
              <div className={`${card} flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-white">Gains Chart</h3><GainChart sessions={sessions} /></div>
            </div>
            {!!topStacks.length && (
              <div className={`${card} mt-4 p-5`}>
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Most Valuable</h3><button onClick={() => setTab('inventory')} className="flex items-center gap-1 text-xs text-[#c9a97a] hover:underline">Open inventory <ChevronRight size={12} /></button></div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {topStacks.map((t, i) => {
                    const info = catalog[t.k];
                    return (
                      <div key={`${t.k}:${i}`} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center" style={{ background: `radial-gradient(circle at 50% 30%, ${info?.rarity_color ?? '#c9a97a'}22, transparent 70%)` }}>
                        <Img src={info?.stored} backup={info?.image} className="mx-auto h-14 w-14 object-contain" fallback={<Gem size={22} className="text-white/25" />} />
                        <p className="mt-2 truncate text-xs font-medium text-white" title={info?.name}>{info?.name ?? t.k.split(':')[1]}</p>
                        <p className="mt-1 flex items-center justify-center gap-1 font-mono text-xs text-cyan-300"><Gem size={11} />{compactCount((t.r ?? 0) * t.a)}</p>
                        {t.a > 1 && <p className="text-[10px] text-white/35">x{compactCount(t.a)}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : tab === 'inventory' ? <InventoryView stacks={counts.inventory} catalog={catalog} loading={!!latest?.snapshot.inventory?.length && loadedFor !== inventoryKey && !Object.keys(catalog).length} />
        : tab === 'gains' ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{(['items', 'huge', 'titanic', 'gargantuan'] as const).map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-white/45">{k}</p><p className="mt-2 font-mono text-2xl text-white" title={String(counts.owned[k])}>{compactCount(counts.owned[k])}</p><p className="mt-2 text-xs text-[#c9a97a]">+{compactCount(counts.gained[k])} gained</p></div>)}</div>
            <DetailTable rows={counts.details} gainedOnly images={images} empty="Nothing gained in this session yet." />
            <p className="mt-5 text-xs leading-6 text-white/35">Gains count inventory increases while tracking, including trades and rewards—not only hatches. Currency and regular pets are excluded. Stats are client-reported.</p>
          </>
        ) : (
          <div className={`${card} divide-y divide-white/[0.05]`}>
            {sessions.filter(s => !s.history_expired).map(s => <button key={s.id} onClick={() => { setSessionId(s.id); setTab('gains'); }} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-white/[0.03] ${s.id === selected?.id ? 'bg-[#c9a97a]/[0.06]' : ''}`}><span><span className="block text-white/80">{new Date(s.started_at).toLocaleString()}</span><span className="text-xs text-white/40">{span(s)} · {pets(s.snapshot.gained)} large pets</span></span><span className="font-mono text-emerald-400">+{compactCount(total(s.snapshot.gained))}</span></button>)}
          </div>
        )}
      </>
    );
  }

  const nav = 'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors';
  return (
    <div className="fixed inset-0 z-[200] overflow-auto bg-[#060606] md:grid md:grid-cols-[250px_minmax(0,1fr)] md:overflow-hidden">
      <aside className="flex flex-col gap-6 border-b border-white/[0.07] bg-[#0b0b0b] p-5 md:h-full md:overflow-auto md:border-b-0 md:border-r">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a97a]">Pet Simulator 99</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Trackstat</h1></div>
        <button onClick={() => setPage('connection')} className={`${nav} ${page === 'connection' ? 'border-[#c9a97a]/50 bg-[#c9a97a]/10 text-[#c9a97a]' : 'border-white/10 text-white/70 hover:border-[#c9a97a]/40'}`}><Link2 size={16} />Connection</button>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Accounts</p>
          <div className="space-y-2">
            {accounts.map(a => (
              <button key={a.index} onClick={() => selectAccount(a.index)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${page === 'games' && history?.index === a.index ? 'border-[#c9a97a]/50 bg-[#c9a97a]/10' : 'border-white/10 hover:border-[#c9a97a]/30'}`}>
                <Avatar src={avatarOf(a.account.roblox_id)} name={a.account.username} small />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm text-white">{a.account.username}</span><span className="text-xs text-white/40">{new Set(a.sessions.map(x => x.game_id)).size} {new Set(a.sessions.map(x => x.game_id)).size === 1 ? 'game' : 'games'}</span></span>
                <ChevronRight size={14} className="shrink-0 text-white/35" />
              </button>
            ))}
            {!accounts.length && <p className="text-xs text-white/40">No account connected</p>}
            <button onClick={() => setPage('connection')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-sm text-white/55 hover:border-[#c9a97a]/50 hover:text-[#c9a97a]"><Plus size={14} />Add account</button>
          </div>
        </div>
        <div className="mt-auto space-y-3">
          <button onClick={() => void load()} className="flex items-center gap-2 text-xs text-white/50 hover:text-white"><RefreshCw size={13} />Refresh</button>
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-[#c9a97a]"><ArrowLeft size={15} />Back to Seisen</Link>
        </div>
      </aside>
      <section className="min-w-0 p-5 md:h-full md:overflow-auto md:p-6">
        {accounts.flatMap(a => a.pending.map(request => (
          <div key={request.id} role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#c9a97a]/30 bg-[#c9a97a]/[0.06] p-4 text-sm text-white/80">
            <p className="min-w-0 flex-1 basis-64"><span className="font-medium text-white">A new device is asking to join {a.account.username}&apos;s history.</span> Approve it only if it&apos;s you, and it will keep adding to the same history.</p>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => void decideLink(a.index, request.id, true)} className="rounded-lg border border-[#c9a97a]/40 bg-[#c9a97a]/15 px-4 py-2 text-[#c9a97a] hover:bg-[#c9a97a]/25 disabled:opacity-40">Approve</button>
              <button disabled={busy} onClick={() => void decideLink(a.index, request.id, false)} className="rounded-lg border border-white/10 px-4 py-2 text-white/60 hover:border-red-400/50 hover:text-red-300 disabled:opacity-40">Deny</button>
            </div>
          </div>
        )))}
        {error && <p role="alert" className="mb-5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">{error}</p>}
        {main}
      </section>
    </div>
  );
}
