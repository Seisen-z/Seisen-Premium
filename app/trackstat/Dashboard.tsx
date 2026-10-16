'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Coins, Gauge, Gem, Layers, Trophy, Users, Zap } from 'lucide-react';
import { PET_SIMULATOR_99, STEAL_AN_EGG, compactCount, type TrackstatAccount } from '@/lib/trackstat';
import { BarChart, ChartCard, Donut, Empty, HBars, Heatmap, Legend, LineChart, Sparkline, palette, type Bar, type Line } from './charts';
import { Avatar, ago, card, total } from './ui';

const DAY = 86400e3;
const games: Record<string, string> = { [PET_SIMULATOR_99]: 'Pet Simulator 99', [STEAL_AN_EGG]: 'Steal an Egg' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);
const shortDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', month: 'short', day: 'numeric' });
const when = (t: number) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const hours = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m` : `${Math.round(minutes)}m`);
const sessionValue = (inventory: { r?: number; a: number }[]) => inventory.reduce((n, x) => n + (x.r ?? 0) * x.a, 0);
const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`;

function Kpi({ icon, label, value, hint, spark }: { icon: React.ReactNode; label: string; value: string; hint?: string; spark?: number[] }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-2 text-xs text-ts-fg/45"><span className="text-ts-accent">{icon}</span>{label}</div>
      <p className="mt-2 truncate font-mono text-2xl text-ts-fg">{value}</p>
      <p className="mt-1 truncate text-xs text-ts-fg/40">{hint ?? ' '}</p>
      {spark && <div className="mt-2"><Sparkline values={spark} /></div>}
    </div>
  );
}

export default function Dashboard({ accounts, avatarOf }: { accounts: TrackstatAccount[]; avatarOf: (id?: string) => string | null | undefined }) {
  const [game, setGame] = useState('all');
  const [acct, setAcct] = useState<'all' | number>('all');
  const [days, setDays] = useState<1 | 7>(7);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);

  const d = useMemo(() => {
    const keys = Array.from({ length: days }, (_, i) => utcDay(now - (days - 1 - i) * DAY));
    const picked = accounts.filter(a => acct === 'all' || a.index === acct);
    const okGame = (g: string) => game === 'all' || g === game;
    const daily = picked.flatMap(a => (a.daily ?? []).filter(r => okGame(r.game_id) && keys.includes(r.day)).map(r => ({ a, ...r })));
    const allSessions = picked.flatMap(a => a.sessions.filter(s => !s.history_expired && okGame(s.game_id)).map(s => ({ a, s, start: Date.parse(s.started_at), end: Date.parse(s.updated_at) }))).sort((x, y) => x.end - y.end);
    const sessions = allSessions.filter(x => x.end >= now - days * DAY);

    // Daily bars: stacked by game when showing every game, otherwise by metric
    const metricTotals = new Map<string, number>();
    for (const r of daily) for (const [k, v] of Object.entries(r.gained)) metricTotals.set(k, (metricTotals.get(k) ?? 0) + v);
    const metrics = [...metricTotals.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k);
    const stackNames = game === 'all' ? Object.values(games) : metrics.map(cap);
    const bars: Bar[] = keys.map(day => {
      const rows = daily.filter(r => r.day === day);
      const segments = game === 'all'
        ? Object.entries(games).map(([id, name], i) => ({ name, color: palette[i], value: rows.filter(r => r.game_id === id).reduce((n, r) => n + total(r.gained), 0) }))
        : metrics.map((k, i) => ({ name: cap(k), color: palette[i % palette.length], value: rows.reduce((n, r) => n + (r.gained[k] ?? 0), 0) }));
      return { id: day, label: shortDay(day), title: `${shortDay(day)} · UTC`, segments };
    });
    const perDay = bars.map(b => b.segments.reduce((n, s) => n + s.value, 0));
    const gained = perDay.reduce((n, v) => n + v, 0);
    const bestIdx = perDay.indexOf(Math.max(...perDay));

    const perAccount = picked.map(a => {
      const mine = sessions.filter(x => x.a === a);
      return { a, gained: daily.filter(r => r.a === a).reduce((n, r) => n + total(r.gained), 0), minutes: mine.reduce((n, x) => n + (x.end - x.start) / 60000, 0), live: (a.activeGames ?? []).some(g => okGame(g)) };
    });
    const minutes = perAccount.reduce((n, x) => n + x.minutes, 0);
    const sessionGains = sessions.reduce((n, x) => n + total(x.s.snapshot.gained), 0);

    const cumulative: Line[] = days > 1 ? perAccount.filter(x => x.gained > 0).map((x, i) => {
      let run = 0;
      return { name: x.a.account.username, color: palette[i % palette.length], points: keys.map(day => ({ t: Date.parse(`${day}T12:00:00Z`), v: (run += daily.filter(r => r.a === x.a && r.day === day).reduce((n, r) => n + total(r.gained), 0)) })) };
    }) : [];

    const itemMap = new Map<string, { name: string; kind: string; gained: number }>();
    for (const { s } of sessions) for (const it of s.snapshot.details) if (it.gained > 0) {
      const id = `${it.kind}:${it.name}`;
      itemMap.set(id, { name: it.name, kind: it.kind, gained: (itemMap.get(id)?.gained ?? 0) + it.gained });
    }
    const topItems = [...itemMap.entries()].sort((x, y) => y[1].gained - x[1].gained).slice(0, 10);

    const sessionBars: Bar[] = sessions.slice(-40).map(({ a, s, start, end }) => ({
      id: s.id, label: '', title: `${a.account.username} · ${games[s.game_id] ?? s.game_id}\n${when(end)} · ${hours((end - start) / 60000)}`,
      segments: [{ name: 'Gained', color: s.game_id === STEAL_AN_EGG ? palette[1] : palette[0], value: total(s.snapshot.gained) }],
    }));

    // Active minutes per local day-hour, last 7 days
    const startOfDay = (t: number) => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };
    const today0 = startOfDay(now);
    const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const { start, end } of allSessions) {
      for (let t = start; t < end;) {
        const x = new Date(t), next = new Date(t);
        next.setHours(x.getHours() + 1, 0, 0, 0);
        const stop = Math.min(end, next.getTime()), row = 6 - Math.round((today0 - startOfDay(t)) / DAY);
        if (row >= 0 && row < 7) grid[row][x.getHours()] += (stop - t) / 60000;
        t = stop;
      }
    }
    const rowLabels = Array.from({ length: 7 }, (_, i) => new Date(today0 - (6 - i) * DAY).toLocaleDateString([], { weekday: 'short' }));

    const perAccountLines = (id: string, value: (s: (typeof allSessions)[number]['s']) => number | undefined): Line[] => picked.map((a, i) => ({
      name: a.account.username, color: palette[i % palette.length],
      points: allSessions.filter(x => x.a === a && x.s.game_id === id).flatMap(x => { const v = value(x.s); return v === undefined ? [] : [{ t: x.end, v }]; }),
    })).filter(l => l.points.length);
    const latestOf = <T,>(id: string, value: (s: (typeof allSessions)[number]['s']) => T | undefined) => picked.flatMap(a => {
      const last = [...allSessions].reverse().find(x => x.a === a && x.s.game_id === id && value(x.s) !== undefined);
      return last ? [{ a, v: value(last.s) as T }] : [];
    });
    const invValue = (s: (typeof allSessions)[number]['s']) => (s.snapshot.inventory?.length ? sessionValue(s.snapshot.inventory) : undefined);
    const rare = sessions.flatMap(({ a, s, end }) => s.game_id === PET_SIMULATOR_99 ? s.snapshot.details.filter(it => it.gained > 0 && ['huge', 'titanic', 'gargantuan'].includes(it.kind)).map(it => ({ ...it, a, end })) : []).sort((x, y) => y.end - x.end).slice(0, 8);

    return {
      keys, bars, stackNames, perDay, gained, best: perDay[bestIdx] > 0 ? { v: perDay[bestIdx], day: keys[bestIdx] } : null, metrics, metricTotals, perAccount, sessions, minutes, sessionGains, cumulative, topItems, sessionBars, grid, rowLabels, rare,
      sessionsPerDay: keys.map(day => sessions.filter(x => utcDay(x.end) === day).length),
      live: perAccount.filter(x => x.live).length,
      hasPs99: allSessions.some(x => x.s.game_id === PET_SIMULATOR_99), hasSae: allSessions.some(x => x.s.game_id === STEAL_AN_EGG),
      invLines: perAccountLines(PET_SIMULATOR_99, invValue),
      invLatest: latestOf(PET_SIMULATOR_99, invValue).sort((x, y) => y.v - x.v),
      moneyLines: perAccountLines(STEAL_AN_EGG, s => s.snapshot.money),
      speedLines: perAccountLines(STEAL_AN_EGG, s => s.snapshot.per_second),
      saeLatest: latestOf(STEAL_AN_EGG, s => (s.snapshot.money === undefined ? undefined : { money: s.snapshot.money, speed: s.snapshot.speed ?? 0, ps: s.snapshot.per_second ?? 0 })),
    };
  }, [accounts, game, acct, days, now]);

  const who = (a: TrackstatAccount) => <><Avatar src={avatarOf(a.account.roblox_id)} name={a.account.username} small /><span className="truncate">{a.account.username}</span></>;
  const perHour = d.minutes > 0 ? d.sessionGains / (d.minutes / 60) : 0;
  const donut = d.metrics.map((k, i) => ({ name: cap(k), value: d.metricTotals.get(k) ?? 0, color: palette[i % palette.length] }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-ts-fg">Dashboard</h2><p className="mt-0.5 text-xs text-ts-fg/40">Gains across your accounts and games. Daily totals use UTC days.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Game">{[['all', 'All games'], [PET_SIMULATOR_99, 'PS99'], [STEAL_AN_EGG, 'Steal an Egg']].map(([id, label]) => <button key={id} aria-pressed={game === id} onClick={() => setGame(id)} className={pill(game === id)}>{label}</button>)}</div>
          <select aria-label="Account" value={acct} onChange={e => setAcct(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-lg bg-ts-fg/[0.05] px-3 py-2 text-sm text-ts-fg outline-none focus-visible:ring-2 focus-visible:ring-ts-accent/40">
            <option value="all" className="bg-ts-surface">All accounts</option>
            {accounts.map(a => <option key={a.index} value={a.index} className="bg-ts-surface">{a.account.username}</option>)}
          </select>
          <div className="flex gap-1" role="group" aria-label="Range">{([1, 7] as const).map(n => <button key={n} aria-pressed={days === n} onClick={() => setDays(n)} className={pill(days === n)}>{n}D</button>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi icon={<Zap size={14} />} label="Total gained" value={compactCount(d.gained)} hint={days === 1 ? 'Today (UTC)' : 'Last 7 days'} spark={days > 1 ? d.perDay : undefined} />
        <Kpi icon={<Users size={14} />} label="Active now" value={`${d.live} / ${d.perAccount.length}`} hint="Accounts with the library running" />
        <Kpi icon={<Layers size={14} />} label="Sessions" value={String(d.sessions.length)} hint={days === 1 ? 'Last 24 hours' : 'Last 7 days'} spark={days > 1 ? d.sessionsPerDay : undefined} />
        <Kpi icon={<Clock size={14} />} label="Play time" value={hours(d.minutes)} hint="Tracked while the library ran" />
        <Kpi icon={<Gauge size={14} />} label="Gains / hour" value={compactCount(Math.round(perHour))} hint="Across tracked sessions" />
        <Kpi icon={<Trophy size={14} />} label="Best day" value={d.best ? compactCount(d.best.v) : '—'} hint={d.best ? shortDay(d.best.day) : 'No gains yet'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Daily gains" hint={game === 'all' ? 'Stacked by game' : 'Stacked by type'} className="xl:col-span-2">
          {d.gained > 0 ? <><BarChart bars={d.bars} /><Legend items={d.stackNames.map((name, i) => ({ name, color: palette[i % palette.length] }))} /></> : <Empty>No gains recorded in this range.</Empty>}
        </ChartCard>
        <ChartCard title="Gains by type" hint="Share of everything gained">
          {d.gained > 0 ? <Donut slices={donut} center="gained" /> : <Empty>Nothing gained yet.</Empty>}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Cumulative gains" hint="Running total per account" className="xl:col-span-2">
          {d.cumulative.length ? <><LineChart lines={d.cumulative} fromZero date={t => shortDay(utcDay(t))} /><Legend items={d.cumulative.map(l => ({ name: l.name, color: l.color }))} /></> : <Empty>{days === 1 ? 'Switch to 7D to see the trend.' : 'No gains recorded yet.'}</Empty>}
        </ChartCard>
        <ChartCard title="Gains by account" hint={days === 1 ? 'Today' : 'Last 7 days'}>
          <HBars rows={[...d.perAccount].sort((x, y) => y.gained - x.gained).map(x => ({ id: String(x.a.index), label: who(x.a), value: x.gained, sub: x.minutes ? `${compactCount(Math.round(x.gained / Math.max(x.minutes / 60, 0.01)))}/h` : undefined }))} empty="No accounts connected." />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Activity" hint="Active minutes per hour, last 7 days (your local time)" className="xl:col-span-2">
          {d.grid.flat().some(m => m > 0) ? <Heatmap grid={d.grid} rowLabels={d.rowLabels} /> : <Empty>No tracked sessions yet.</Empty>}
        </ChartCard>
        <ChartCard title="Accounts" hint="Live status">
          {d.perAccount.length ? (
            <ul className="space-y-3">{d.perAccount.map(x => {
              const last = x.a.sessions[0];
              return <li key={x.a.index} className="flex items-center gap-3 text-sm"><span className="flex min-w-0 flex-1 items-center gap-3 text-ts-fg">{who(x.a)}</span><span className="text-right text-xs"><span className={`flex items-center justify-end gap-1.5 ${x.live ? 'text-ts-pos' : 'text-ts-fg/40'}`}><span className={`h-1.5 w-1.5 rounded-full ${x.live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{x.live ? 'Live' : 'Offline'}</span><span className="text-ts-fg/35">{last ? ago(last.updated_at) : 'never synced'}</span></span></li>;
            })}</ul>
          ) : <Empty>No accounts connected.</Empty>}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Gains per session" hint="Most recent sessions, oldest to newest" className="xl:col-span-2">
          {d.sessionBars.length ? <BarChart bars={d.sessionBars} showEvery={Number.MAX_SAFE_INTEGER} /> : <Empty>No sessions in this range.</Empty>}
        </ChartCard>
        <ChartCard title="Top gained" hint="Most gained items and pets">
          <HBars rows={d.topItems.map(([id, it]) => ({ id, label: <span className="truncate">{it.name}<span className="ml-1.5 text-ts-fg/35">{it.kind}</span></span>, value: it.gained }))} empty="No item gains in this range." />
        </ChartCard>
      </div>

      {d.hasPs99 && (
        <>
          <h3 className="pt-2 text-sm font-semibold text-ts-fg/70">Pet Simulator 99</h3>
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard title="Inventory value" hint="Total gem value at each sync" className="xl:col-span-2">
              {d.invLines.some(l => l.points.length > 1) ? <><LineChart lines={d.invLines} date={when} /><Legend items={d.invLines.map(l => ({ name: l.name, color: l.color }))} /></> : <Empty>Value history appears after a few syncs with inventory details.</Empty>}
            </ChartCard>
            <ChartCard title="Value by account" hint="Latest synced inventory">
              <HBars rows={d.invLatest.map(x => ({ id: String(x.a.index), label: <><Gem size={12} className="shrink-0 text-ts-cyan" />{who(x.a)}</>, value: x.v }))} empty="No inventory synced yet." />
            </ChartCard>
          </div>
          <ChartCard title="Recent rare pets" hint="Huge, Titanic and Gargantuan gained in this range">
            {d.rare.length ? <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">{d.rare.map((r, i) => <li key={i} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-ts-fg">{r.name}<span className="ml-2 text-xs capitalize text-ts-fg/40">{r.kind} · {r.a.account.username}</span></span><span className="shrink-0 text-xs text-ts-fg/40">+{r.gained} · {ago(new Date(r.end).toISOString())}</span></li>)}</ul> : <Empty>No rare pets gained in this range.</Empty>}
          </ChartCard>
        </>
      )}

      {d.hasSae && (
        <>
          <h3 className="pt-2 text-sm font-semibold text-ts-fg/70">Steal an Egg</h3>
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard title="Money" hint="Balance at each sync" className="xl:col-span-2">
              {d.moneyLines.some(l => l.points.length > 1) ? <><LineChart lines={d.moneyLines} date={when} /><Legend items={d.moneyLines.map(l => ({ name: l.name, color: l.color }))} /></> : <Empty>Money history appears after a few syncs.</Empty>}
            </ChartCard>
            <ChartCard title="Money now" hint="Latest sync">
              <HBars rows={d.saeLatest.sort((x, y) => y.v.money - x.v.money).map(x => ({ id: String(x.a.index), label: <><Coins size={12} className="shrink-0 text-ts-pos" />{who(x.a)}</>, value: x.v.money, sub: x.v.ps ? `$${compactCount(x.v.ps)}/s` : undefined }))} empty="No money synced yet." />
            </ChartCard>
          </div>
          <ChartCard title="Money per second" hint="Income from placed pets at each sync">
            {d.speedLines.some(l => l.points.length > 1) ? <><LineChart lines={d.speedLines} date={when} /><Legend items={d.speedLines.map(l => ({ name: l.name, color: l.color }))} /></> : <Empty>Income history appears after a few syncs.</Empty>}
          </ChartCard>
        </>
      )}
    </div>
  );
}
