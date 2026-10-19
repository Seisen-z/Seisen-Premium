'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Activity, Boxes, Clock, Database, Layers, Lock, Moon, RefreshCw, Search, Share2, Sun, UserCheck, Users, X, Zap } from 'lucide-react';
import { PET_SIMULATOR_99, STEAL_AN_EGG, ANIME_DICE, compactCount, type CatalogEntry, type InventoryStack } from '@/lib/trackstat';
import { AreaChart, ChartCard, Empty, HBars, type AreaPoint } from '../charts';
import InventoryView from '../InventoryView';
import { AnimeDiceInventory } from '../AnimeDiceView';
import { InventoryView as SaeInventoryView } from '../StealAnEggView';
import { useTrackstatTheme } from '../theme';
import type { Theme } from '../themeConfig';
import { Stat, ago, card } from '../ui';

type Totals = { libraries: number; libraries_live: number; libraries_24h: number; libraries_7d: number; accounts: number; sessions: number; website_users: number; shares: number; live_now: number; active_1h: number; active_24h: number; active_7d: number };
type GameRow = { game_id: string; libraries_live: number; libraries_24h: number; accounts: number; live: number; active_24h: number; sessions: number };
type Account = { id: string; username: string; roblox_id: string; created_at: string; last_sync: string | null; live: string[]; games: string[]; sessions: number; gained_today: number; website_users: number };
type Gain = { account: string; username: string; game_id: string; name: string; kind: string; gained: number; at: string };
type ServerStats = { accounts: number; games: Record<string, { accounts: number; stacks: number; last_update: number }>; changes: number; oldest_change: number | null; bytes: number };
type Data = {
  overview: { totals: Totals; new_accounts: { day: string; n: number }[]; daily_gains: { day: string; game_id: string; gained: number }[]; hourly_active: { hour: string; n: number }[] };
  games: GameRow[]; accounts: Account[]; activity: Gain[]; server: ServerStats | null;
};
type View = 'ps' | 'sae' | 'ad';
type Loaded = { catalog: Record<string, CatalogEntry>; inventory: InventoryStack[] | null };

const GAMES: { id: string; view: View; name: string }[] = [
  { id: PET_SIMULATOR_99, view: 'ps', name: 'Pet Simulator 99' },
  { id: STEAL_AN_EGG, view: 'sae', name: 'Steal an Egg' },
  { id: ANIME_DICE, view: 'ad', name: 'Anime Dice' },
];
const gameOf = (id: string) => GAMES.find(g => g.id === id);
const TOKEN = 'adminToken';
const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`;
const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 2 : 1)} MB`;
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', month: 'short', day: 'numeric' });

function days(count: number) {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(new Date(Date.now() - i * 86400e3).toISOString().slice(0, 10));
  return out;
}

export default function AdminPanel({ initialTheme }: { initialTheme: Theme }) {
  const { theme, toggle } = useTrackstatTheme(initialTheme);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState<Account | null>(null);

  useEffect(() => { try { setToken(localStorage.getItem(TOKEN)); } catch { setToken(null); } }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/trackstat/admin', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) { try { localStorage.removeItem(TOKEN); } catch { /* nothing saved */ } setToken(null); setData(null); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load');
      setData(body); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load'); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 60000);
    return () => clearInterval(timer);
  }, [load]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.token) { setError(body.error ?? 'Wrong password'); return; }
    try { localStorage.setItem(TOKEN, body.token); } catch { /* stays for this tab only */ }
    setPassword(''); setToken(body.token);
  }

  const frame = 'fixed inset-0 z-[200] overflow-auto bg-ts-bg text-ts-fg';
  if (token === undefined) return <div data-ts-theme={theme} className={frame} />;
  if (!token) return (
    <div data-ts-theme={theme} className={`${frame} grid place-items-center p-6`}>
      <form onSubmit={signIn} className={`${card} w-full max-w-sm space-y-4 p-6`}>
        <h1 className="flex items-center gap-2 text-lg font-semibold"><Lock size={18} className="text-ts-accent" />Trackstat admin</h1>
        <input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" aria-label="Admin password" className="w-full rounded-lg bg-ts-fg/[0.05] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ts-accent/40" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-ts-accent px-4 py-2.5 text-sm font-medium text-ts-accent-fg">Sign in</button>
      </form>
    </div>
  );

  return (
    <div data-ts-theme={theme} className={frame}>
      <div className="w-full p-5 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold"><Activity size={22} className="text-ts-accent" />Trackstat admin</h1>
            <p className="mt-1 text-xs text-ts-fg/40">Library usage counts every account running the library. Everything else is for accounts connected on the website, whose data is stored. Refreshes every minute.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} className={`${pill(false)} flex items-center gap-2`} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button>
            <button onClick={toggle} className={pill(false)} aria-label="Switch theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <Link href="/trackstat" className={pill(false)}>Trackstat</Link>
          </div>
        </header>
        {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
        {!data ? <p className="py-20 text-center text-sm text-ts-fg/40">Loading…</p> : <Body data={data} onOpen={setOpen} />}
      </div>
      {open && token && <Detail account={open} token={token} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Body({ data, onOpen }: { data: Data; onOpen: (a: Account) => void }) {
  const t = data.overview.totals;
  const [game, setGame] = useState('all');
  const [query, setQuery] = useState('');
  const [liveOnly, setLiveOnly] = useState(false);
  const [limit, setLimit] = useState(100);

  const hourly = useMemo<AreaPoint[]>(() => {
    const byHour = new Map(data.overview.hourly_active.map(r => [new Date(r.hour).toISOString().slice(0, 13), r.n]));
    return Array.from({ length: 72 }, (_, i) => {
      const at = new Date(Date.now() - (71 - i) * 3600e3), key = at.toISOString().slice(0, 13);
      return { id: key, label: at.toLocaleTimeString([], { hour: 'numeric' }), title: at.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric' }), value: byHour.get(key) ?? 0 };
    });
  }, [data]);
  const gains = useMemo<AreaPoint[]>(() => days(14).map(day => ({ id: day, label: dayLabel(day), title: `${dayLabel(day)} · UTC`, value: data.overview.daily_gains.filter(r => r.day === day && (game === 'all' || r.game_id === game)).reduce((n, r) => n + (Number(r.gained) || 0), 0) })), [data, game]);
  const joined = useMemo<AreaPoint[]>(() => days(14).map(day => ({ id: day, label: dayLabel(day), title: `${dayLabel(day)} · UTC`, value: data.overview.new_accounts.find(r => r.day === day)?.n ?? 0 })), [data]);
  const activity = data.activity.filter(a => game === 'all' || a.game_id === game);
  const topEarners = [...data.accounts].filter(a => a.gained_today > 0 && (game === 'all' || a.games.includes(game))).sort((x, y) => y.gained_today - x.gained_today).slice(0, 8);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.accounts.filter(a => (game === 'all' || a.games.includes(game)) && (!liveOnly || a.live.length > 0) && (!q || a.username.toLowerCase().includes(q) || a.roblox_id.includes(q) || a.id.startsWith(q)));
  }, [data, game, query, liveOnly]);

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-ts-fg/70">Library usage <span className="font-normal text-ts-fg/40">every account running the library</span></h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Zap size={20} />} label="Libraries live now" value={compactCount(t.libraries_live)} hint="Accounts running the library right now" />
        <Stat icon={<Clock size={20} />} label="Libraries seen 24h / 7d" value={`${t.libraries_24h} / ${t.libraries_7d}`} hint="Accounts that were live in that time" />
        <Stat icon={<Users size={20} />} label="Libraries ever connected" value={compactCount(t.libraries)} hint="Every Roblox account that has run the library" />
        <Stat icon={<UserCheck size={20} />} label="Website users" value={compactCount(t.website_users)} hint="People with a website login who linked an account" />
      </div>
      <h2 className="text-sm font-semibold text-ts-fg/70">Connected on the website <span className="font-normal text-ts-fg/40">key submitted, data stored</span></h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Database size={20} />} label="Accounts connected" value={compactCount(t.accounts)} hint="Key submitted on the website" />
        <Stat icon={<Zap size={20} />} label="Connected live now" value={compactCount(t.live_now)} hint="Connected accounts running the library" />
        <Stat icon={<Clock size={20} />} label="Active 1h / 24h / 7d" value={`${t.active_1h} / ${t.active_24h} / ${t.active_7d}`} hint="Connected accounts that synced in that time" />
        <Stat icon={<Layers size={20} />} label="Sessions saved" value={compactCount(t.sessions)} hint={`${t.shares} share links`} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {GAMES.map(g => {
          const row = data.games.find(r => r.game_id === g.id);
          return (
            <section key={g.id} className={`${card} p-5`}>
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{g.name}</h2><span className={`flex items-center gap-1.5 text-xs ${row?.libraries_live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${row?.libraries_live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{row?.libraries_live ?? 0} live</span></div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-ts-fg/45">
                <div><dt>Libraries live</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{compactCount(row?.libraries_live ?? 0)}</dd></div>
                <div><dt>Seen 24h</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{compactCount(row?.libraries_24h ?? 0)}</dd></div>
                <div><dt>Connected</dt><dd className="mt-1 font-mono text-lg text-ts-fg" title="Accounts with a key on the website">{compactCount(row?.accounts ?? 0)}</dd></div>
              </dl>
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Game filter">
        {[{ id: 'all', name: 'All games' }, ...GAMES].map(g => <button key={g.id} aria-pressed={game === g.id} onClick={() => setGame(g.id)} className={pill(game === g.id)}>{g.name}</button>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Active accounts" hint="Accounts that synced, per hour, last 72 hours"><AreaChart points={hourly} label="Active accounts per hour" /></ChartCard>
        <ChartCard title="Gains" hint="Everything gained per day across accounts, last 14 days (UTC)">{gains.some(p => p.value > 0) ? <AreaChart points={gains} label="Gains per day" /> : <Empty>No gains recorded.</Empty>}</ChartCard>
        <ChartCard title="New connected accounts" hint="First used on the website per day, last 14 days (UTC)"><AreaChart points={joined} label="New accounts per day" format={n => String(Math.round(n))} /></ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChartCard title="Recent activity" hint="Latest items gained by any account (libraries updated on Oct 20 or later)">
          {activity.length ? (
            <ul className="max-h-[28rem] divide-y divide-ts-fg/[0.05] overflow-auto">
              {activity.map((a, i) => (
                <li key={`${a.account}:${a.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ts-fg/85">{a.name}</span>
                    <span className="text-xs text-ts-fg/35"><button className="hover:text-ts-accent" onClick={() => { const found = data.accounts.find(x => x.id === a.account); if (found) onOpen(found); }}>{a.username}</button> · {gameOf(a.game_id)?.name ?? a.game_id} · <span className="capitalize">{a.kind}</span> · {ago(a.at)}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-ts-pos/10 px-2 py-0.5 font-mono text-xs text-ts-pos">+{compactCount(a.gained)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty>No recent activity yet.</Empty>}
        </ChartCard>
        <div className="space-y-4">
          <ChartCard title="Top today" hint="Most gained so far today (UTC)">
            <HBars rows={topEarners.map(a => ({ id: a.id, label: <button className="truncate hover:text-ts-accent" onClick={() => onOpen(a)}>{a.username}</button>, value: a.gained_today }))} empty="No gains today yet." />
          </ChartCard>
          <ChartCard title="Trackstat server" hint="Where inventories are stored">
            {data.server ? (
              <dl className="grid grid-cols-2 gap-3 text-xs text-ts-fg/45">
                <div><dt>Accounts stored</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{compactCount(data.server.accounts)}</dd></div>
                <div><dt>Database size</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{megabytes(data.server.bytes)}</dd></div>
                <div><dt>Stacks stored</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{compactCount(Object.values(data.server.games).reduce((n, g) => n + g.stacks, 0))}</dd></div>
                <div><dt>Changes logged</dt><dd className="mt-1 font-mono text-lg text-ts-fg">{compactCount(data.server.changes)}</dd></div>
              </dl>
            ) : <Empty>The Trackstat server did not answer.</Empty>}
          </ChartCard>
        </div>
      </div>

      <section className={`${card} p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Database size={15} className="text-ts-accent" />Connected accounts <span className="font-normal text-ts-fg/40">{rows.length} shown</span></h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg bg-ts-fg/[0.05] px-3 py-2 text-sm"><Search size={14} className="text-ts-fg/40" /><input value={query} onChange={e => { setQuery(e.target.value); setLimit(100); }} placeholder="Search username, Roblox ID" aria-label="Search accounts" className="w-52 bg-transparent outline-none" /></label>
            <button aria-pressed={liveOnly} onClick={() => setLiveOnly(v => !v)} className={pill(liveOnly)}>Live only</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-ts-fg/40"><tr><th className="py-2 pr-3 font-normal">Account</th><th className="pr-3 font-normal">Status</th><th className="pr-3 font-normal">Games</th><th className="pr-3 font-normal">Last sync</th><th className="pr-3 text-right font-normal">Gained today</th><th className="pr-3 text-right font-normal">Sessions</th><th className="text-right font-normal">Web users</th></tr></thead>
            <tbody>
              {rows.slice(0, limit).map(a => (
                <tr key={a.id} onClick={() => onOpen(a)} className="cursor-pointer border-t border-ts-fg/[0.05] hover:bg-ts-fg/[0.03]">
                  <td className="py-2.5 pr-3"><span className="block max-w-[14rem] truncate text-ts-fg/90">{a.username}</span><span className="text-xs text-ts-fg/35">{a.roblox_id}</span></td>
                  <td className="pr-3"><span className={`flex items-center gap-1.5 text-xs ${a.live.length ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${a.live.length ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{a.live.length ? 'Live' : 'Offline'}</span></td>
                  <td className="pr-3 text-xs text-ts-fg/55">{a.games.map(g => gameOf(g)?.name ?? g).join(', ') || '—'}</td>
                  <td className="pr-3 text-xs text-ts-fg/55">{a.last_sync ? ago(a.last_sync) : '—'}</td>
                  <td className="pr-3 text-right font-mono text-ts-fg/80">{a.gained_today ? compactCount(a.gained_today) : '—'}</td>
                  <td className="pr-3 text-right font-mono text-ts-fg/55">{a.sessions}</td>
                  <td className="text-right font-mono text-ts-fg/55">{a.website_users || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>No accounts match.</Empty>}
        </div>
        {rows.length > limit && <button onClick={() => setLimit(n => n + 200)} className={`${pill(false)} mt-4`}>Show more ({rows.length - limit} left)</button>}
      </section>
    </div>
  );
}

function Detail({ account, token, onClose }: { account: Account; token: string; onClose: () => void }) {
  const views = GAMES.filter(g => account.games.includes(g.id));
  const [view, setView] = useState<View | undefined>(views[0]?.view);
  const [loaded, setLoaded] = useState<Partial<Record<View, Loaded>>>({});
  useEffect(() => {
    if (!view) return;
    let live = true;
    void fetch(`/api/trackstat/admin/inventory?account=${account.id}&game=${view}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then((body: Loaded) => { if (live) setLoaded(current => ({ ...current, [view]: { catalog: body.catalog ?? {}, inventory: body.inventory ?? null } })); })
      .catch(() => { if (live) setLoaded(current => ({ ...current, [view]: { catalog: {}, inventory: null } })); });
    return () => { live = false; };
  }, [account.id, view, token]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const current = view ? loaded[view] : undefined;

  return (
    <div className="fixed inset-0 z-[210] flex justify-end bg-black/50" onClick={onClose}>
      <aside onClick={e => e.stopPropagation()} className="h-full w-full max-w-5xl overflow-auto bg-ts-bg p-5 shadow-2xl md:p-8" role="dialog" aria-label={`${account.username} details`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{account.username}</h2>
            <p className="mt-1 text-xs text-ts-fg/45">Roblox ID {account.roblox_id} · connected {ago(account.created_at)} · last sync {account.last_sync ? ago(account.last_sync) : 'never'} · {account.live.length ? 'live now' : 'offline'}</p>
            <a href={`https://www.roblox.com/users/${account.roblox_id}/profile`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-ts-accent hover:underline">Open Roblox profile</a>
          </div>
          <button onClick={onClose} aria-label="Close" className={pill(false)}><X size={16} /></button>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Layers size={18} />} label="Sessions" value={String(account.sessions)} />
          <Stat icon={<Zap size={18} />} label="Gained today" value={compactCount(account.gained_today)} />
          <Stat icon={<UserCheck size={18} />} label="Website users" value={String(account.website_users)} />
          <Stat icon={<Boxes size={18} />} label="Games" value={String(views.length)} />
        </div>
        {views.length === 0 ? <Empty>This account has no game data yet.</Empty> : (
          <section aria-label="Inventory">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Inventory</h3>
              <div className="flex gap-1" role="group" aria-label="Game">{views.map(g => <button key={g.id} aria-pressed={view === g.view} onClick={() => setView(g.view)} className={pill(view === g.view)}>{g.name}</button>)}</div>
            </div>
            {view === 'ps' ? <InventoryView stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />
              : view === 'ad' ? <AnimeDiceInventory stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />
              : <SaeInventoryView stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />}
          </section>
        )}
      </aside>
    </div>
  );
}
