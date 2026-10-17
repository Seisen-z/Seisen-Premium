'use client';

import { trackstatAuth, trackstatFetch } from '@/lib/client/trackstat-auth';
import { cacheClear, cacheGet, cacheNamespace, cacheSet } from '@/lib/client/trackstat-cache';
import { loadInventory } from '@/lib/client/trackstat-inventory';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Boxes, CalendarDays, ChevronRight, Clock, Gem, LayoutGrid, Link2, List, PawPrint, RefreshCw, Search, TrendingUp, Users, Egg, Plus, Sun, Moon, LayoutDashboard, Settings as SettingsIcon, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTrackstatTheme } from './theme';
import type { Theme } from './themeConfig';
import { PET_SIMULATOR_99, STEAL_AN_EGG, ANIME_DICE, compactCount, type CatalogEntry, type Counts, type InventoryStack, type TrackstatAccount, type TrackstatResponse } from '@/lib/trackstat';
import StealAnEggView from './StealAnEggView';
import AnimeDiceView from './AnimeDiceView';
import AccountPopover from './AccountPopover';
import Dashboard from './Dashboard';
import Welcome from './Welcome';
import InventoryView, { categories } from './InventoryView';
import Freshness from './Freshness';
import ConnectionPage from './ConnectionPage';
import SettingsPage from './SettingsPage';
import WhatsNew from './WhatsNew';
import ShareLinks from './ShareLinks';
import { sortAccounts, useSettings } from './settings';
import { Avatar, DetailTable, GainChart, Img, PageSkeleton, Stat, ago, card, span, total } from './ui';

type Tab = 'overview' | 'inventory' | 'gains' | 'history' | 'community';

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'gains', label: 'Session Gains', icon: TrendingUp }, { id: 'history', label: 'History', icon: Clock }, { id: 'community', label: 'Community', icon: Users },
];
const pets = (c: Counts) => c.huge + c.titanic + c.gargantuan;

export default function TrackstatPanel({ initialTheme }: { initialTheme: Theme }) {
  const [data, setData] = useState<TrackstatResponse | null>(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<'games' | 'connection' | 'dashboard' | 'settings' | 'whatsnew'>('games');
  const [game, setGame] = useState<'ps99' | 'sae' | 'ad' | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [accountQuery, setAccountQuery] = useState('');
  const { settings, update } = useSettings();
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const { theme, toggle: toggleTheme } = useTrackstatTheme(initialTheme);
  const [tab, setTab] = useState<Tab>('overview');
  const [sessionId, setSessionId] = useState('');
  const [recentCategory, setRecentCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [listView, setListView] = useState(false);
  const [catalog, setCatalog] = useState<Record<string, CatalogEntry>>({});
  const [inventoryData, setInventoryData] = useState<{ roblox: string; stacks: InventoryStack[] } | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const loadVersion = useRef(0);
  const accountSynced = useRef(false);
  const etag = useRef('');
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const response = await trackstatFetch('/api/trackstat', { cache: 'no-store', headers: etag.current ? { 'If-None-Match': etag.current } : {} });
      if (response.status === 304) { if (version === loadVersion.current) setLoadedAt(Date.now()); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (version !== loadVersion.current) return;
      etag.current = response.headers.get('ETag') ?? '';
      setLoadedAt(Date.now());
      setData(body);
      // Saved in this browser so the next visit shows it at once and only downloads if something changed
      if (etag.current) void cacheNamespace().then(namespace => cacheSet(`${namespace}:main`, { etag: etag.current, data: body }));
      // Signed in: keys held by this browser are saved to the email account in the background; signed out: browser storage only
      if (!accountSynced.current && body.accounts?.length) {
        accountSynced.current = true;
        void trackstatAuth.auth.getSession().then(({ data }) => { if (data.session) void trackstatFetch('/api/trackstat/profile', { method: 'POST' }).catch(() => {}); });
      }
      setError(body.reconnect ? 'Your key was reset. Copy the new key from the library to reconnect.' : body.degraded ? 'Some accounts could not be refreshed. Showing what loaded.' : '');
    } catch (e) { if (version === loadVersion.current) setError(e instanceof Error ? e.message : 'Trackstat could not refresh.'); }
  }, []);
  const accountChanged = useCallback((clear = false) => {
    // Signing out empties the account list right away instead of blanking the page while the refresh runs
    if (clear) { setData(current => (current ? { ...current, accounts: [], reconnect: false, degraded: false } : current)); setCatalog({}); setInventoryData(null); setGame(null); etag.current = ''; void cacheClear(); }
    void load();
  }, [load]);
  // The library syncs every 15 seconds while it runs; with nothing running there is nothing new to fetch that often
  const pollMs = (data?.accounts.some(a => a.activeGames.length > 0) ?? true) ? (settings.relaxedRefresh ? 30000 : 15000) : 60000;
  useEffect(() => {
    let live = true;
    void (async () => {
      // What this browser saved last time shows straight away; the request then only downloads if the server has something newer
      const saved = await cacheGet<{ etag: string; data: TrackstatResponse }>(`${await cacheNamespace()}:main`);
      if (saved && live) { setData(current => current ?? saved.data); if (!etag.current) etag.current = saved.etag; }
      if (live) void load();
    })();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = setInterval(refresh, pollMs);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [load, pollMs]);

  async function connect(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await trackstatFetch('/api/trackstat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key.trim() }) });
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
      const response = await trackstatFetch('/api/trackstat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
      if (!response.ok) throw new Error('Could not remove the account. Try again.');
      setSessionId(''); setGame(null); setActiveIndex(0);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove the account.'); }
    finally { setBusy(false); }
  }
  function selectAccount(index: number) {
    setActiveIndex(index); setSessionId(''); setGame(null); setPage('games');
  }

  const accounts = data?.accounts ?? [];
  const ordered = sortAccounts(accounts, settings.order);
  const nameOf = (a: TrackstatAccount) => settings.names[a.account.roblox_id] || a.account.username;
  const rename = (robloxId: string, name: string) => update({ names: { ...settings.names, [robloxId]: name.trim() } });
  const move = (robloxId: string, direction: -1 | 1) => {
    const ids = ordered.map(a => a.account.roblox_id);
    const i = ids.indexOf(robloxId), j = i + direction;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    update({ order: ids });
  };
  const history = accounts.find(a => a.index === activeIndex) ?? accounts[0];
  const avatarOf = (id?: string) => (id ? data?.media?.avatars?.[id] : null);
  const allSessions = history?.sessions ?? [];
  const sessions = allSessions.filter(s => s.game_id === PET_SIMULATOR_99);
  const saeSessions = allSessions.filter(s => s.game_id === STEAL_AN_EGG);
  const adSessions = allSessions.filter(s => s.game_id === ANIME_DICE);
  const liveAd = history?.activeGames?.includes(ANIME_DICE) ?? false;
  const lastAny = allSessions[0];
  const gamesTracked = new Set(allSessions.map(s => s.game_id)).size;
  const selected = sessions.find(s => s.id === sessionId) || sessions[0];
  const latest = sessions[0];
  const totalGains = allSessions.reduce((n, s) => n + total(s.snapshot.gained), 0);
  const liveSae = history?.activeGames?.includes(STEAL_AN_EGG) ?? false;
  const live = history?.activeGames?.includes(PET_SIMULATOR_99) ?? false;
  const libraryLive = (history?.activeGames?.length ?? 0) > 0;
  const robloxId = history?.account.roblox_id;
  const hasInventory = !!latest?.snapshot.has_inventory;
  const inventoryKey = `${robloxId}:${latest?.id}`;
  const latestUpdated = useRef<string>(undefined);
  useEffect(() => { latestUpdated.current = latest?.updated_at; });
  useEffect(() => {
    // The inventory is only fetched while a view that shows it is open, and refreshed once a minute
    if (game !== 'ps99' || !robloxId || !hasInventory || (tab !== 'overview' && tab !== 'inventory')) return;
    let live = true;
    const run = () => loadInventory(robloxId, 'ps', latestUpdated.current, result => {
      if (!live) return;
      setCatalog(result.catalog);
      if (result.inventory) setInventoryData({ roblox: robloxId, stacks: result.inventory });
    }).catch(() => {}).finally(() => { if (live) setLoadedFor(inventoryKey); });
    void run();
    const timer = setInterval(() => { if (!document.hidden) void run(); }, 60000);
    return () => { live = false; clearInterval(timer); };
  }, [game, robloxId, hasInventory, tab, inventoryKey]);
  const images = useMemo(() => Object.fromEntries(Object.values(catalog).map(c => [c.name.toLowerCase(), c.stored ?? c.image])), [catalog]);
  const recentClasses = categories.find(c => c.id === recentCategory)?.classes ?? [];
  const recent = sessions.flatMap(s => s.snapshot.details.filter(d => d.gained > 0 && (!recentClasses.length || recentClasses.includes(d.kind) || recentCategory === 'pets' && ['huge', 'titanic', 'gargantuan'].includes(d.kind))).map(d => ({ ...d, at: s.updated_at }))).slice(0, 10);
  const stacks = inventoryData?.roblox === robloxId ? inventoryData?.stacks : undefined;
  const totalValue = (stacks ?? []).reduce((n, x) => n + (x.r ?? 0) * x.a, 0);
  const topStacks = [...(stacks ?? [])].sort((a, b) => (b.r ?? 0) * b.a - (a.r ?? 0) * a.a).slice(0, 6);

  const publicStats = data?.public;
  const community = publicStats ? (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat icon={<Users size={20} />} label="Accounts" value={compactCount(publicStats.accounts)} />
      <Stat icon={<Activity size={20} />} label="Active now" value={compactCount(publicStats.live)} />
      <Stat icon={<Clock size={20} />} label="Sessions" value={compactCount(publicStats.sessions)} />
      <Stat icon={<TrendingUp size={20} />} label="Total gained" value={compactCount(total(publicStats.gained))} />
      {(['items', 'huge', 'titanic', 'gargantuan'] as const).map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{k} collected</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(publicStats.gained[k])}>{compactCount(publicStats.gained[k])}</p></div>)}
    </div>
  ) : <p className="py-6 text-sm text-ts-fg/40">Community totals are temporarily unavailable. Your account tracking is still available.</p>;

  let main: ReactNode;
  if (!data) main = error ? <p className="py-12 text-sm text-ts-fg/40">Refresh to try again.</p> : <PageSkeleton />;
  else if (page === 'dashboard') main = accounts.length ? <Dashboard accounts={ordered} avatarOf={avatarOf} nameOf={nameOf} /> : <Welcome onConnect={() => setPage('connection')} />;
  else if (page === 'settings') main = <SettingsPage settings={settings} update={update} onClearData={() => { etag.current = ''; void cacheClear(); }}><ShareLinks accounts={ordered} nameOf={nameOf} /></SettingsPage>;
  else if (page === 'whatsnew') main = <WhatsNew />;
  else if (page === 'connection') main = (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className={`${card} p-6`}><ConnectionPage accounts={ordered} avatarOf={avatarOf} nameOf={nameOf} rename={rename} move={move} busy={busy} onRemove={index => void removeAccount(index)} keyValue={key} setKey={setKey} onSubmit={connect} /></div>
      <div className="space-y-4">
        <div className={`${card} p-6`}>
          <h2 className="text-lg font-semibold text-ts-fg">How it works</h2>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-ts-fg/60">
            {[
              ['Open Trackstat in the library', 'Load the Seisen library in a supported game and open the Trackstat tab.'],
              ['Copy your connection key', 'Press Copy connection key. Each Roblox account gets its own private key, and no website account is needed.'],
              ['Paste it here', 'Paste the key into the box on this page. This browser stays connected for 30 days.'],
              ['Play a supported game', 'Tracking starts automatically when the library detects the game. Your inventory and session gains sync about every 15 seconds. Other devices on the same Roblox account show up here together.'],
            ].map(([title, text], i) => <li key={title} className="flex gap-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ts-accent/10 font-mono text-xs text-ts-accent">{i + 1}</span><span><span className="block font-medium text-ts-fg">{title}</span>{text}</span></li>)}
          </ol>
          <div className="mt-6 space-y-2 border-t border-ts-fg/[0.07] pt-5 text-xs leading-6 text-ts-fg/45">
            <p><span className="text-ts-fg/70">Activity is kept for 8 days after the last session sync.</span> Older gains and history are automatically removed. Your latest inventory stays until the next game sync updates it.</p>
            <p><span className="text-ts-fg/70">Resetting the key</span> in the library stops the old key from working but keeps your inventory and retained history under the new one.</p>
            <p><span className="text-ts-fg/70">Keep your key private.</span> Anyone holding it can see your inventory and history. Stats are reported by the library, so they are not verified.</p>
          </div>
        </div>
        <div className={`${card} p-6`}>
          <h2 className="text-lg font-semibold text-ts-fg">Supported games</h2>
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-ts-fg/[0.06] bg-ts-fg/[0.02] p-3">
            <Img src={data?.media?.game} className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<PawPrint size={24} className="text-ts-accent" />} />
            <div className="min-w-0"><p className="text-sm font-medium text-ts-fg">Pet Simulator 99</p><p className="mt-1 text-xs text-ts-fg/45">Full inventory, Huge / Titanic / Gargantuan pets, items, enchants and session gains.</p></div>
          </div>
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-ts-fg/[0.06] bg-ts-fg/[0.02] p-3">
            <Img src={data?.media?.stealAnEgg} className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<Egg size={24} className="text-ts-accent" />} />
            <div className="min-w-0"><p className="text-sm font-medium text-ts-fg">Steal an Egg</p><p className="mt-1 text-xs text-ts-fg/45">Money, speed, pets with weight and mutations, eggs, gear and items.</p></div>
          </div>
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-ts-fg/[0.06] p-3"><Img src={data?.media?.animeDice} className="h-14 w-14 shrink-0 rounded-lg" fallback={<Boxes size={24} />} /><div><p className="text-sm font-medium text-ts-fg">Anime Dice</p><p className="mt-1 text-xs text-ts-fg/45">Units, boosts, gear, tokens, money, rolls, rebirths and session gains.</p></div></div>
          <p className="mt-3 text-xs text-ts-fg/35">More games will be added over time.</p>
        </div>
      </div>
    </div>
  );
  else if (!game) {
    main = (
      <>
        {!history ? <div className="mb-6"><Welcome onConnect={() => setPage('connection')} /></div> : !allSessions.length ? <div className="mb-6"><Welcome waiting onConnect={() => setPage('connection')} /></div> : (
        <div className={`${card} mb-6 flex flex-wrap items-center gap-5 p-5`}>
          {history ? <Avatar src={avatarOf(history.account.roblox_id)} name={history.account.username} /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-ts-fg/[0.05] text-2xl text-ts-fg/40">?</span>}
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="break-words text-2xl font-semibold text-ts-fg">{history ? nameOf(history) : 'Not connected'}</h2>
            <p className={`mt-1 flex items-center gap-2 text-sm ${libraryLive ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-2 w-2 rounded-full ${libraryLive ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{history ? libraryLive ? 'Connected' : 'Offline' : 'Not connected'}</p>
            <p className="mt-2 text-xs text-ts-fg/45">{history ? libraryLive ? 'Your inventory, session gains, and history are being tracked.' : 'Library offline. Your saved inventory and history are still available.' : 'Open Connection and paste your library key to start.'}</p>
          </div>
          {history && (
            <div className="grid w-full grid-cols-2 gap-3 xl:w-auto xl:grid-cols-4">
              <Stat icon={<Gem size={20} />} label="Games tracked" value={String(gamesTracked)} />
              <Stat icon={<TrendingUp size={20} />} label="Total session gains" value={`+${compactCount(totalGains)}`} hint={String(totalGains)} />
              <Stat icon={<Clock size={20} />} label="Session time" value={lastAny ? span(lastAny) : '—'} />
              <Stat icon={<CalendarDays size={20} />} label="Last played" value={libraryLive ? 'Now' : lastAny ? ago(lastAny.updated_at) : '—'} />
            </div>
          )}
        </div>)}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ts-fg">Supported Games (3)</h3>
          <div className="flex items-center gap-2">
            <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search game" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search game…" className="w-48 rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
            {([false, true] as const).map(l => <button key={String(l)} aria-label={l ? 'List view' : 'Grid view'} aria-pressed={listView === l} onClick={() => setListView(l)} className={`grid h-9 w-9 place-items-center rounded-lg border ${listView === l ? 'border-ts-accent/50 bg-ts-accent/10 text-ts-accent' : 'border-ts-fg/10 text-ts-fg/50'}`}>{l ? <List size={16} /> : <LayoutGrid size={16} />}</button>)}
          </div>
        </div>
        {(() => {
          const list = [
            { id: 'ps99' as const, name: 'Pet Simulator 99', image: data?.media?.game, icon: <PawPrint size={36} className="text-ts-accent" />, live, played: !!latest },
            { id: 'sae' as const, name: 'Steal an Egg', image: data?.media?.stealAnEgg, icon: <Egg size={36} className="text-ts-accent" />, live: liveSae, played: saeSessions.length > 0 },
            { id: 'ad' as const, name: 'Anime Dice', image: data?.media?.animeDice, icon: <Boxes size={36} className="text-ts-accent" />, live: liveAd, played: adSessions.length > 0 },
          ].filter(g => g.name.toLowerCase().includes(search.trim().toLowerCase()));
          return list.length ? (
            <div className={listView ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}>
              {list.map(g => (
                <button key={g.id} onClick={() => setGame(g.id)} className={`${card} group w-full ${listView ? 'flex items-center' : ''} overflow-hidden text-left transition-colors hover:border-ts-accent/40 focus-visible:outline-2 focus-visible:outline-ts-accent`}>
                  <Img src={g.image} className={`bg-gradient-to-br from-ts-accent/25 to-ts-raised ${listView ? 'h-20 w-32 shrink-0' : 'h-36 w-full'}`} fallback={g.icon} />
                  <div className="flex min-w-0 flex-1 items-center justify-between p-4">
                    <div><p className="text-sm font-medium text-ts-fg">{g.name}</p><p className={`mt-1 flex items-center gap-2 text-xs ${g.live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${g.live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{g.live ? 'Tracking' : history && g.played ? 'Not tracking' : 'Not played'}</p></div>
                    <ChevronRight size={16} className="text-ts-fg/35 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-ts-fg/40">No games match.</p>;
        })()}
      </>
    );
  } else if (game === 'ad') {
    main = <AnimeDiceView sessions={adSessions} daily={(history?.daily ?? []).filter(day => day.game_id === ANIME_DICE)} media={data?.media} community={data?.publicAnimeDice} live={liveAd} roblox={history?.account.roblox_id ?? ''} onBack={() => setGame(null)} />;
  } else if (game === 'sae') {
    main = <StealAnEggView sessions={saeSessions} daily={(history?.daily ?? []).filter(day => day.game_id === STEAL_AN_EGG)} media={data.media} community={data.publicStealAnEgg} live={liveSae} roblox={history?.account.roblox_id ?? ''} onBack={() => setGame(null)} />;
  } else {
    const counts = selected?.snapshot;
    main = (
      <>
        <div className={`${card} mb-4 p-5`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setGame(null)} aria-label="Back to games" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ts-fg/10 text-ts-fg/60 hover:border-ts-accent/50 hover:text-ts-accent"><ArrowLeft size={16} /></button>
            <Img src={data?.media?.game} className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-ts-accent/25 to-ts-raised" fallback={<PawPrint size={30} className="text-ts-accent" />} />
            <div className="min-w-0"><h2 className="text-xl font-semibold text-ts-fg">Pet Simulator 99</h2><p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-2 w-2 rounded-full ${live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Tracking' : 'Not tracking'}</p><p className="mt-1 text-xs text-ts-fg/45">Tracking your inventory, session gains, and history.</p></div>
          </div>
          <div className="mt-5 flex gap-1 overflow-x-auto border-t border-ts-fg/[0.07] pt-3" role="tablist" aria-label="Game sections">
            {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 pb-2 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ts-accent ${tab === t.id ? 'border-ts-accent text-ts-accent' : 'border-transparent text-ts-fg/45 hover:text-ts-fg'}`}><t.icon size={14} />{t.label}</button>)}
          </div>
        </div>
        {tab === 'community' ? community : !history || !counts ? (
          <div className={`${card} p-10`}><Activity className="mb-4 text-ts-accent" size={28} /><h3 className="text-lg font-semibold text-ts-fg">{history ? 'No sessions yet' : 'Connect your library account'}</h3><p className="mt-3 max-w-md text-sm leading-7 text-ts-fg/45">{history ? 'Turn on tracking in the library to start your first session.' : 'Your inventory and session history stay private to your connection key.'}</p></div>
        ) : tab === 'overview' ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
              <Stat icon={<Gem size={20} className="text-ts-cyan" />} label="Total value" value={stacks ? compactCount(totalValue) : '—'} hint={String(totalValue)} />
              <Stat icon={<Boxes size={20} />} label="Items" value={compactCount(counts.owned.items)} hint={String(counts.owned.items)} />
              <Stat icon={<PawPrint size={20} />} label="Large pets" value={compactCount(pets(counts.owned))} hint={String(pets(counts.owned))} />
              <Stat icon={<Gem size={20} />} label="Huge" value={compactCount(counts.owned.huge)} />
              <Stat icon={<TrendingUp size={20} />} label="Session gains" value={`+${compactCount(total(counts.gained))}`} />
              <Stat icon={<Clock size={20} />} label="Session time" value={span(selected)} />
            </div>
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className={`${card} p-5`}>
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Recent Activity</h3><button onClick={() => setTab('gains')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">View All <ChevronRight size={12} /></button></div>
                <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Recent activity category">{categories.map(c => <button key={c.id} aria-pressed={recentCategory === c.id} onClick={() => setRecentCategory(c.id)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${recentCategory === c.id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{c.label}</button>)}</div>
                {recent.length ? <ul className="divide-y divide-ts-fg/[0.05]">{recent.map((r, i) => <li key={`${r.name}:${i}`} className="flex items-center gap-3 py-2.5 text-sm"><Img src={images[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 object-contain" fallback={<Gem size={14} className="text-ts-fg/25" />} /><span className="min-w-0 flex-1"><span className="block truncate text-ts-fg/85">{r.name}</span><span className="text-xs capitalize text-ts-fg/35">{r.kind} · {ago(r.at)}</span></span><span className="shrink-0 rounded-md bg-ts-pos/10 px-2 py-0.5 font-mono text-xs text-ts-pos">+{compactCount(r.gained)}</span></li>)}</ul> : <p className="text-sm text-ts-fg/40">{recentCategory === 'all' ? 'No gains recorded yet.' : 'No recent activity in this category.'}</p>}
              </div>
              <div className={`${card} flex flex-col p-5`}><h3 className="-mb-6 text-sm font-semibold text-ts-fg">Gains Chart</h3><GainChart daily={(history?.daily ?? []).filter(day => day.game_id === PET_SIMULATOR_99)} /></div>
            </div>
            {!!topStacks.length && (
              <div className={`${card} mt-4 p-5`}>
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-ts-fg">Most Valuable</h3><button onClick={() => setTab('inventory')} className="flex items-center gap-1 text-xs text-ts-accent hover:underline">Open inventory <ChevronRight size={12} /></button></div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {topStacks.map((t, i) => {
                    const info = catalog[t.k];
                    return (
                      <div key={`${t.k}:${i}`} className="rounded-lg border border-ts-fg/[0.06] bg-ts-fg/[0.02] p-3 text-center" style={{ background: `radial-gradient(circle at 50% 30%, ${info?.rarity_color ?? '#7458f5'}22, transparent 70%)` }}>
                        <Img src={info?.stored} backup={info?.image} className="mx-auto h-14 w-14 object-contain" fallback={<Gem size={22} className="text-ts-fg/25" />} />
                        <p className="mt-2 truncate text-xs font-medium text-ts-fg" title={info?.name}>{info?.name ?? t.k.split(':')[1]}</p>
                        <p className="mt-1 flex items-center justify-center gap-1 font-mono text-xs text-ts-cyan"><Gem size={11} />{compactCount((t.r ?? 0) * t.a)}</p>
                        {t.a > 1 && <p className="text-[10px] text-ts-fg/35">x{compactCount(t.a)}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="mt-4 text-xs text-ts-fg/40"><Clock className="mr-1 inline" size={12} />Inventory refreshes every 15 seconds from the library. Activity is retained for 8 days; the latest inventory is kept.</p>
          </>
        ) : tab === 'inventory' ? <InventoryView stacks={stacks} catalog={catalog} loading={hasInventory && loadedFor !== inventoryKey} />
        : tab === 'gains' ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{(['items', 'huge', 'titanic', 'gargantuan'] as const).map(k => <div key={k} className={`${card} p-4`}><p className="text-xs capitalize text-ts-fg/45">{k}</p><p className="mt-2 font-mono text-2xl text-ts-fg" title={String(counts.owned[k])}>{compactCount(counts.owned[k])}</p><p className="mt-2 text-xs text-ts-accent">+{compactCount(counts.gained[k])} gained</p></div>)}</div>
            <DetailTable rows={counts.details} gainedOnly images={images} empty="Nothing gained in this session yet." />
            <p className="mt-5 text-xs leading-6 text-ts-fg/35">Gains count inventory increases while tracking, including trades and rewards—not only hatches. Currency and regular pets are excluded. Stats are client-reported.</p>
          </>
        ) : (
          <div className={`${card} divide-y divide-ts-fg/[0.05]`}>
            {sessions.filter(s => !s.history_expired).map(s => <button key={s.id} onClick={() => { setSessionId(s.id); setTab('gains'); }} className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-ts-fg/[0.03] ${s.id === selected?.id ? 'bg-ts-accent/[0.06]' : ''}`}><span><span className="block text-ts-fg/80">{new Date(s.started_at).toLocaleString()}</span><span className="text-xs text-ts-fg/40">{span(s)} · {pets(s.snapshot.gained)} large pets</span></span><span className="font-mono text-ts-pos">+{compactCount(total(s.snapshot.gained))}</span></button>)}
          </div>
        )}
      </>
    );
  }

  const collapsed = settings.collapsed;
  const row = (active: boolean, compact = false) => `relative flex w-full items-center rounded-lg px-3 text-left transition-colors ${compact ? 'gap-2.5 py-1.5 text-[13px]' : 'gap-3 py-2.5 text-sm'} ${collapsed ? 'md:justify-center md:px-0' : ''} ${active ? 'ts-clay-active bg-ts-fg/[0.07] font-medium text-ts-fg' : 'text-ts-fg/70 hover:bg-ts-fg/[0.04] hover:text-ts-fg'}`;
  const bar = <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-ts-accent" />;
  const divider = <div className="my-3 h-px bg-ts-fg/[0.07]" />;
  const shown = ordered.filter(a => nameOf(a).toLowerCase().includes(accountQuery.trim().toLowerCase()));
  const anyLive = accounts.some(a => a.activeGames.length > 0);
  const text = (label: string) => (collapsed ? null : label);
  const phoneItem = (active: boolean, label: string, icon: ReactNode, onClick: () => void) => (
    <button key={label} onClick={onClick} aria-label={label} aria-current={active ? 'page' : undefined} className={`flex w-16 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] ${active ? 'text-ts-accent' : 'text-ts-fg/55'}`}>{icon}{label}</button>
  );
  return (
    <div data-ts-theme={theme} className={`fixed inset-0 z-[200] overflow-auto bg-ts-bg md:grid ${collapsed ? 'md:grid-cols-[72px_minmax(0,1fr)]' : 'md:grid-cols-[270px_minmax(0,1fr)]'} md:overflow-hidden`}>
      <aside className={`ts-clay-side hidden flex-col bg-ts-side py-5 md:flex md:h-full md:overflow-auto ${collapsed ? 'px-3' : 'px-4'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'gap-3 px-1'}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ts-accent text-ts-accent-fg"><Activity size={20} /></span>
          {!collapsed && <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold leading-tight text-ts-fg">Trackstat</h1><p className="truncate text-xs text-ts-fg/45">Pet Simulator 99</p></div>}
          <button onClick={() => update({ collapsed: !collapsed })} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="text-ts-fg/40 hover:text-ts-fg">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        </div>
        {!collapsed && <label className="relative mt-5 block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/40" /><input value={accountQuery} onChange={e => setAccountQuery(e.target.value)} placeholder="Search accounts..." aria-label="Search accounts" className="w-full rounded-lg bg-ts-inset py-2.5 pl-9 pr-3 text-sm text-ts-fg outline-none placeholder:text-ts-fg/35 focus-visible:ring-2 focus-visible:ring-ts-accent/40" /></label>}
        {divider}
        {!collapsed && <p className="mb-1 px-3 text-xs text-ts-fg/40">Menu</p>}
        <button onClick={() => setPage('dashboard')} title="Dashboard" aria-label="Dashboard" className={row(page === 'dashboard')}>{page === 'dashboard' && bar}<LayoutDashboard size={17} />{text('Dashboard')}</button>
        <button onClick={() => setPage('connection')} title="Connection" aria-label="Connection" className={row(page === 'connection')}>{page === 'connection' && bar}<Link2 size={17} />{text('Connection')}</button>
        {divider}
        {collapsed ? null : <div className="mb-1 flex items-center justify-between px-3"><p className="text-xs text-ts-fg/40">Accounts</p><button onClick={() => setPage('connection')} aria-label="Add account" className="text-ts-fg/45 hover:text-ts-fg"><Plus size={15} /></button></div>}
        {shown.map(a => {
          const active = page === 'games' && history?.index === a.index;
          const games = new Set(a.sessions.map(x => x.game_id)).size;
          return (
            <button key={a.account.roblox_id} onClick={() => selectAccount(a.index)} title={nameOf(a)} aria-label={nameOf(a)} className={row(active, true)}>
              {active && bar}
              <Avatar src={avatarOf(a.account.roblox_id)} name={a.account.username} tiny />
              {!collapsed && <><span className="min-w-0 flex-1 truncate">{nameOf(a)}</span><span title={`${games} ${games === 1 ? 'game' : 'games'}`} className="grid h-4 min-w-4 place-items-center rounded-full bg-ts-accent px-1 text-[10px] font-medium text-ts-accent-fg">{games}</span></>}
            </button>
          );
        })}
        {!shown.length && !collapsed && <p className="px-3 py-2 text-xs text-ts-fg/40">{accounts.length ? 'No match' : 'No account connected'}</p>}
        {divider}
        {!collapsed && <p className="mb-1 px-3 text-xs text-ts-fg/40">Help</p>}
        <button onClick={() => void load()} title="Refresh" aria-label="Refresh" className={row(false)}><RefreshCw size={17} />{text('Refresh')}</button>
        <button onClick={toggleTheme} title="Switch theme" aria-label="Switch theme" className={row(false)}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}{text(theme === 'dark' ? 'Light mode' : 'Dark mode')}</button>
        <button onClick={() => setPage('settings')} title="Settings" aria-label="Settings" className={row(page === 'settings')}>{page === 'settings' && bar}<SettingsIcon size={17} />{text('Settings')}</button>
        <button onClick={() => setPage('whatsnew')} title="What's new" aria-label="What's new" className={row(page === 'whatsnew')}>{page === 'whatsnew' && bar}<Sparkles size={17} />{text("What's new")}</button>
        <Link href="/" title="Back to Seisen" aria-label="Back to Seisen" className={row(false)}><ArrowLeft size={17} />{text('Back to Seisen')}</Link>
        <div className="mt-auto space-y-3 pt-3"><Freshness loadedAt={loadedAt} live={anyLive} compact={collapsed} /><AccountPopover compact={collapsed} count={accounts.length} onChange={accountChanged} /></div>
      </aside>
      <section className="min-w-0 p-5 pb-24 md:h-full md:overflow-auto md:p-6 md:pb-6">
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <span className="flex items-center gap-2 font-semibold text-ts-fg"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ts-accent text-ts-accent-fg"><Activity size={16} /></span>Trackstat</span>
          <Freshness loadedAt={loadedAt} live={anyLive} />
        </div>
        {ordered.length > 1 && <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 md:hidden" role="group" aria-label="Accounts">{ordered.map(a => <button key={a.account.roblox_id} onClick={() => selectAccount(a.index)} aria-pressed={page === 'games' && history?.index === a.index} className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm ${page === 'games' && history?.index === a.index ? 'bg-ts-accent/15 text-ts-fg' : 'bg-ts-fg/[0.05] text-ts-fg/65'}`}><Avatar src={avatarOf(a.account.roblox_id)} name={a.account.username} small />{nameOf(a)}</button>)}</div>}
        {error && <p role="alert" className="mb-5 rounded-lg border border-ts-warn/20 bg-ts-warn/5 p-4 text-sm text-ts-warn">{error}</p>}
        {main}
      </section>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around bg-ts-side/95 px-2 py-1.5 backdrop-blur md:hidden">
        {phoneItem(page === 'dashboard', 'Dashboard', <LayoutDashboard size={19} />, () => setPage('dashboard'))}
        {phoneItem(page === 'games', 'Accounts', <Users size={19} />, () => { setPage('games'); setGame(null); })}
        {phoneItem(page === 'connection', 'Connect', <Link2 size={19} />, () => setPage('connection'))}
        {phoneItem(page === 'settings', 'Settings', <SettingsIcon size={19} />, () => setPage('settings'))}
        <div className="w-16"><AccountPopover compact popoverId="trackstat-account-phone" watch={false} count={accounts.length} onChange={accountChanged} /></div>
      </nav>
    </div>
  );
}
