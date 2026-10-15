'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Boxes, CalendarDays, ChevronRight, Clock, Gem, LayoutGrid, Link2, List, PawPrint, RefreshCw, Search, Star, TrendingUp, Users } from 'lucide-react';
import { compactCount, type CatalogEntry, type Counts, type InventoryStack, type TrackstatHistory, type TrackstatResponse } from '@/lib/trackstat';

type Session = TrackstatHistory['sessions'][number];
type Tab = 'overview' | 'inventory' | 'gains' | 'history' | 'community';

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Session Gains', icon: TrendingUp }, { id: 'history', label: 'History', icon: Clock }, { id: 'community', label: 'Community', icon: Users },
];
const card = 'rounded-xl border border-white/[0.07] bg-[#101010]';
const button = 'rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#c9a97a]/50 hover:text-[#c9a97a] focus-visible:outline-2 focus-visible:outline-[#c9a97a] disabled:opacity-40';
const total = (c: Counts) => c.items + c.huge + c.titanic + c.gargantuan;
const pets = (c: Counts) => c.huge + c.titanic + c.gargantuan;
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};
const span = (s: Session) => {
  const m = Math.max(0, Math.round((new Date(s.updated_at).getTime() - new Date(s.started_at).getTime()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className={`${card} flex items-center gap-4 p-4`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#c9a97a]/10 text-[#c9a97a]">{icon}</span>
      <div className="min-w-0"><p className="text-xs text-white/45">{label}</p><p className="mt-1 truncate font-mono text-xl text-white" title={hint}>{value}</p></div>
    </div>
  );
}

function Img({ src, className, fallback }: { src?: string | null; className: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return src && !failed ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className} object-cover`} /> : <span className={`${className} grid place-items-center`}>{fallback}</span>;
}

function Avatar({ src, name, small }: { src?: string | null; name: string; small?: boolean }) {
  return <Img src={src} className={`${small ? 'h-9 w-9 text-sm' : 'h-16 w-16 text-2xl'} shrink-0 rounded-full border border-[#c9a97a]/40 bg-[#c9a97a]/10 font-semibold text-[#c9a97a]`} fallback={name[0]?.toUpperCase()} />;
}

const ranges = { '1H': 3600e3, '6H': 21600e3, '24H': 86400e3, '7D': 604800e3 } as const;

function GainChart({ sessions }: { sessions: Session[] }) {
  const [range, setRange] = useState<keyof typeof ranges>('7D');
  const points = useMemo(() => {
    const from = new Date().getTime() - ranges[range];
    return [...sessions].reverse().filter(s => new Date(s.updated_at).getTime() >= from).reduce<{ t: number; v: number }[]>((acc, s) => [...acc, { t: new Date(s.updated_at).getTime(), v: (acc.at(-1)?.v ?? 0) + total(s.snapshot.gained) }], []);
  }, [sessions, range]);
  const W = 600, H = 180, max = Math.max(...points.map(p => p.v), 1), t0 = points[0]?.t ?? 0, dt = Math.max((points.at(-1)?.t ?? 0) - t0, 1);
  const xy = points.map(p => `${((p.t - t0) / dt) * W},${H - (p.v / max) * (H - 10) - 5}`);
  const hm = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div>
      <div className="mb-3 flex justify-end gap-1" role="group" aria-label="Chart range">{(Object.keys(ranges) as (keyof typeof ranges)[]).map(r => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1 text-xs transition-colors ${range === r ? 'bg-[#c9a97a] font-medium text-black' : 'bg-white/[0.04] text-white/55 hover:text-white'}`}>{r}</button>)}</div>
      {points.length < 2 ? <p className="grid h-44 place-items-center text-sm text-white/40">Not enough sessions in this range.</p> : (
        <div className="flex gap-3">
          <div className="flex h-44 flex-col justify-between py-1 text-right font-mono text-[11px] text-white/40"><span>{compactCount(max)}</span><span>{compactCount(max / 2)}</span><span>0</span></div>
          <div className="min-w-0 flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Cumulative gains across sessions">
              <defs><linearGradient id="ts-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c9a97a" stopOpacity=".3" /><stop offset="1" stopColor="#c9a97a" stopOpacity="0" /></linearGradient></defs>
              {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="white" strokeOpacity=".06" />)}
              <polygon points={`0,${H} ${xy.join(' ')} ${W},${H}`} fill="url(#ts-fill)" />
              <polyline points={xy.join(' ')} fill="none" stroke="#c9a97a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-white/40"><span>{hm(t0)}</span><span>{hm(points.at(-1)!.t)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTable({ rows, empty, gainedOnly, images }: { rows: Session['snapshot']['details']; empty: string; gainedOnly?: boolean; images: Record<string, string | null> }) {
  const [q, setQ] = useState('');
  const shown = rows.filter(r => (!gainedOnly || r.gained > 0) && r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (gainedOnly ? b.gained - a.gained : b.owned - a.owned));
  return (
    <div>
      <label className="relative mb-4 block max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Search items" value={q} onChange={e => setQ(e.target.value)} placeholder="Search item or pet…" className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#c9a97a]" /></label>
      <div className={`${card} max-h-[480px] overflow-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#181818] text-xs text-white/45"><tr><th className="px-4 py-3 font-normal">Item / pet</th><th className="px-4 py-3 text-right font-normal">Owned</th><th className="px-4 py-3 text-right font-normal">Gained</th></tr></thead>
          <tbody>{shown.map((r, i) => <tr key={`${r.kind}:${r.name}:${i}`} className="border-t border-white/[0.05]"><td className="max-w-[260px] px-4 py-3 text-white/80"><div className="flex items-center gap-3"><Img src={images[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 rounded-md bg-white/[0.04] object-contain" fallback={<Gem size={14} className="text-white/25" />} /><div className="min-w-0 break-words">{r.name}<span className="mt-0.5 block text-xs capitalize text-white/35">{r.kind}</span></div></div></td><td className="px-4 py-3 text-right font-mono text-white/60">{compactCount(r.owned)}</td><td className="px-4 py-3 text-right font-mono text-[#c9a97a]">+{compactCount(r.gained)}</td></tr>)}</tbody>
        </table>
        {!shown.length && <p className="p-5 text-sm text-white/40">{empty}</p>}
      </div>
    </div>
  );
}

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
        <Img src={info?.image} className="h-20 w-20 object-contain" fallback={<Gem size={28} className="text-white/25" />} />
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

function InventoryView({ stacks, catalog }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry> }) {
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
      {shown.length ? (
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
  const [game, setGame] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [sessionId, setSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [listView, setListView] = useState(false);
  const [catalog, setCatalog] = useState<Record<string, CatalogEntry>>({});
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
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function connect(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/trackstat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setKey(''); setSessionId(''); setPage('games');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true);
    try {
      const response = await fetch('/api/trackstat', { method: 'DELETE' });
      if (!response.ok) throw new Error('Disconnect failed. Try again.');
      setData(current => current ? { ...current, private: null } : null);
      setSessionId(''); setGame(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Disconnect failed.'); }
    finally { setBusy(false); }
  }

  const history = data?.private;
  const sessions = history?.sessions ?? [];
  const selected = sessions.find(s => s.id === sessionId) || sessions[0];
  const latest = sessions[0];
  const totalGains = sessions.reduce((n, s) => n + total(s.snapshot.gained), 0);
  const live = !!latest && Date.now() - new Date(latest.updated_at).getTime() < 120000;
  const inventoryKey = `${latest?.id}:${latest?.snapshot.inventory?.length ?? 0}`;
  useEffect(() => {
    if (!latest?.snapshot.inventory?.length) return;
    fetch('/api/trackstat/catalog', { cache: 'no-store' }).then(r => r.json()).then(b => setCatalog(b.catalog ?? {})).catch(() => {});
  }, [inventoryKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.image])), [catalog]);
  const recent = sessions.flatMap(s => s.snapshot.details.filter(d => d.gained > 0).map(d => ({ ...d, at: s.updated_at }))).slice(0, 8);

  const connection = (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-white">Library connection</h2>
      {history ? (
        <div className="mt-5">
          <p className="break-words text-xl font-semibold text-white">{history.account.username}</p>
          <p className="mt-2 text-xs text-white/40">Roblox ID {history.account.roblox_id}</p>
          <button className={`${button} mt-5`} onClick={() => void disconnect()} disabled={busy}>Disconnect this browser</button>
        </div>
      ) : (
        <form onSubmit={connect} className="mt-5 space-y-4">
          <label htmlFor="trackstat-key" className="block text-sm text-white/60">Connection key</label>
          <input id="trackstat-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e => setKey(e.target.value)} placeholder="sp_…" maxLength={67} required className="w-full min-w-0 rounded-lg border border-white/10 bg-[#111] px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#c9a97a]" />
          <button className={`${button} w-full border-[#c9a97a]/40 bg-[#c9a97a]/10 text-[#c9a97a]`} disabled={busy || !key.trim()}>{busy ? 'Connecting…' : 'Connect account'}</button>
        </form>
      )}
      <p className="mt-5 text-xs leading-6 text-white/45">Open <span className="text-white/70">Trackstat</span> in the library, copy your key, and paste it here. Turn on tracking to send stats. Resetting the key in the library disconnects old keys without deleting history.</p>
      <p className="mt-4 text-xs leading-6 text-white/35">Keep your connection key private. Anyone holding it can access your account&apos;s Trackstat history.</p>
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
  if (!data) main = <p className="py-12 text-sm text-white/40" role="status">{error ? 'Refresh to try again.' : 'Loading Trackstat…'}</p>;
  else if (page === 'connection') main = <div className={`${card} p-6`}>{connection}</div>;
  else if (!game) {
    main = (
      <>
        <div className={`${card} mb-6 flex flex-wrap items-center gap-5 p-5`}>
          {history ? <Avatar src={data?.media?.avatar} name={history.account.username} /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-white/[0.05] text-2xl text-white/40">?</span>}
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="break-words text-2xl font-semibold text-white">{history?.account.username ?? 'Not connected'}</h2>
            <p className={`mt-1 flex items-center gap-2 text-sm ${history ? 'text-emerald-400' : 'text-white/40'}`}><span className={`h-2 w-2 rounded-full ${history ? 'bg-emerald-400' : 'bg-white/30'}`} />{history ? 'Connected' : 'Not connected'}</p>
            <p className="mt-2 text-xs text-white/45">{history ? 'Your inventory, session gains, and history are being tracked.' : 'Open Connection and paste your library key to start.'}</p>
          </div>
          {history && (
            <div className="grid w-full grid-cols-2 gap-3 xl:w-auto xl:grid-cols-4">
              <Stat icon={<Gem size={20} />} label="Games tracked" value="1" />
              <Stat icon={<TrendingUp size={20} />} label="Total session gains" value={`+${compactCount(totalGains)}`} hint={String(totalGains)} />
              <Stat icon={<Clock size={20} />} label="Session time" value={latest ? span(latest) : '—'} />
              <Stat icon={<CalendarDays size={20} />} label="Last played" value={latest ? ago(latest.updated_at) : '—'} />
            </div>
          )}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Supported Games (1)</h3>
          <div className="flex items-center gap-2">
            <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Search game" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search game…" className="w-48 rounded-lg border border-white/10 bg-[#101010] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#c9a97a]" /></label>
            {([false, true] as const).map(l => <button key={String(l)} aria-label={l ? 'List view' : 'Grid view'} aria-pressed={listView === l} onClick={() => setListView(l)} className={`grid h-9 w-9 place-items-center rounded-lg border ${listView === l ? 'border-[#c9a97a]/50 bg-[#c9a97a]/10 text-[#c9a97a]' : 'border-white/10 text-white/50'}`}>{l ? <List size={16} /> : <LayoutGrid size={16} />}</button>)}
          </div>
        </div>
        {'pet simulator 99'.includes(search.trim().toLowerCase()) ? (
          <button onClick={() => setGame(true)} className={`${card} group w-full ${listView ? 'flex items-center' : 'max-w-xs'} overflow-hidden text-left transition-colors hover:border-[#c9a97a]/40 focus-visible:outline-2 focus-visible:outline-[#c9a97a]`}>
            <Img src={data?.media?.game} className={`bg-gradient-to-br from-[#c9a97a]/25 to-[#1a1a1a] ${listView ? 'h-20 w-32 shrink-0' : 'h-36 w-full'}`} fallback={<PawPrint size={36} className="text-[#c9a97a]" />} />
            <div className="flex min-w-0 flex-1 items-center justify-between p-4">
              <div><p className="text-sm font-medium text-white">Pet Simulator 99</p><p className={`mt-1 flex items-center gap-2 text-xs ${live ? 'text-emerald-400' : 'text-white/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-white/30'}`} />{live ? 'Tracking' : history && latest ? 'Idle' : 'Not played'}</p></div>
              <ChevronRight size={16} className="text-white/35 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ) : <p className="text-sm text-white/40">No games match.</p>}
      </>
    );
  } else {
    const counts = selected?.snapshot;
    main = (
      <>
        <div className={`${card} mb-4 p-5`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setGame(false)} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/60 hover:border-[#c9a97a]/50 hover:text-[#c9a97a]"><ArrowLeft size={16} /></button>
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
              <Stat icon={<Boxes size={20} />} label="Items" value={compactCount(counts.owned.items)} hint={String(counts.owned.items)} />
              <Stat icon={<PawPrint size={20} />} label="Large pets" value={compactCount(pets(counts.owned))} hint={String(pets(counts.owned))} />
              <Stat icon={<Gem size={20} />} label="Huge" value={compactCount(counts.owned.huge)} />
              <Stat icon={<Gem size={20} />} label="Titanic" value={compactCount(counts.owned.titanic)} />
              <Stat icon={<TrendingUp size={20} />} label="Session gains" value={`+${compactCount(total(counts.gained))}`} />
              <Stat icon={<Clock size={20} />} label="Session time" value={span(selected)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className={`${card} p-5`}>
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Recent Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-[#c9a97a] hover:underline">View All <ChevronRight size={12} /></button></div>
                {recent.length ? <ul className="space-y-3">{recent.map((r, i) => <li key={`${r.name}:${i}`} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-white/75"><span className="mr-3 text-xs text-white/35">{ago(r.at)}</span>{r.name}</span><span className="shrink-0 font-mono text-emerald-400">+{compactCount(r.gained)}</span></li>)}</ul> : <p className="text-sm text-white/40">No gains recorded yet.</p>}
              </div>
              <div className={`${card} p-5`}><h3 className="-mb-6 text-sm font-semibold text-white">Gains Chart</h3><GainChart sessions={sessions} /></div>
            </div>
          </>
        ) : tab === 'inventory' ? <InventoryView stacks={counts.inventory} catalog={catalog} />
        : tab === 'gains' ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{(['items', 'huge', 'titanic', 'gargantuan'] as const).map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-white/45">{k}</p><p className="mt-2 font-mono text-2xl text-white" title={String(counts.owned[k])}>{compactCount(counts.owned[k])}</p><p className="mt-2 text-xs text-[#c9a97a]">+{compactCount(counts.gained[k])} gained</p></div>)}</div>
            <DetailTable rows={counts.details} gainedOnly images={images} empty="Nothing gained in this session yet." />
            <p className="mt-5 text-xs leading-6 text-white/35">Gains count inventory increases while tracking, including trades and rewards—not only hatches. Currency and regular pets are excluded. Stats are client-reported.</p>
          </>
        ) : (
          <div className={`${card} divide-y divide-white/[0.05]`}>
            {sessions.map(s => <button key={s.id} onClick={() => { setSessionId(s.id); setTab('gains'); }} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-white/[0.03] ${s.id === selected?.id ? 'bg-[#c9a97a]/[0.06]' : ''}`}><span><span className="block text-white/80">{new Date(s.started_at).toLocaleString()}</span><span className="text-xs text-white/40">{span(s)} · {pets(s.snapshot.gained)} large pets</span></span><span className="font-mono text-emerald-400">+{compactCount(total(s.snapshot.gained))}</span></button>)}
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
          {history ? (
            <button onClick={() => { setPage('games'); setGame(false); }} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${page === 'games' ? 'border-[#c9a97a]/50 bg-[#c9a97a]/10' : 'border-white/10'}`}><Avatar src={data?.media?.avatar} name={history.account.username} small /><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white">{history.account.username}</span><span className="text-xs text-white/40">1 game</span></span><ChevronRight size={14} className="shrink-0 text-white/35" /></button>
          ) : <p className="text-xs text-white/40">No account connected</p>}
        </div>
        <div className="mt-auto space-y-3">
          <button onClick={() => void load()} className="flex items-center gap-2 text-xs text-white/50 hover:text-white"><RefreshCw size={13} />Refresh</button>
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-[#c9a97a]"><ArrowLeft size={15} />Back to Seisen</Link>
        </div>
      </aside>
      <section className="min-w-0 p-5 md:h-full md:overflow-auto md:p-6">
        {error && <p role="alert" className="mb-5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">{error}</p>}
        {main}
      </section>
    </div>
  );
}
