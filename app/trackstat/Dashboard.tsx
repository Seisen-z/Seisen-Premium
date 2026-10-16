'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Gauge, Layers, Trophy, Users, Zap } from 'lucide-react';
import { PET_SIMULATOR_99, STEAL_AN_EGG, compactCount, type TrackstatAccount } from '@/lib/trackstat';
import { BarChart, ChartCard, Empty, HBars, Legend, Sparkline, palette, type Bar } from './charts';
import { Avatar, card, total } from './ui';

const DAY = 86400e3;
const games: Record<string, string> = { [PET_SIMULATOR_99]: 'Pet Simulator 99', [STEAL_AN_EGG]: 'Steal an Egg' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);
const shortDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', month: 'short', day: 'numeric' });
const hours = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m` : `${Math.round(minutes)}m`);
const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`;

function Kpi({ icon, label, value, hint, spark }: { icon: React.ReactNode; label: string; value: string; hint: string; spark?: number[] }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-2 text-xs text-ts-fg/45"><span className="text-ts-accent">{icon}</span>{label}</div>
      <p className="mt-2 truncate font-mono text-2xl text-ts-fg">{value}</p>
      <p className="mt-1 truncate text-xs text-ts-fg/40">{hint}</p>
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
    // Daily totals are UTC days; sessions use the same window and only count for the time inside it
    const keys = Array.from({ length: days }, (_, i) => utcDay(now - (days - 1 - i) * DAY));
    const cutoff = Date.parse(`${keys[0]}T00:00:00Z`);
    const picked = accounts.filter(a => acct === 'all' || a.index === acct);
    const okGame = (g: string) => game === 'all' || g === game;
    const daily = picked.flatMap(a => (a.daily ?? []).filter(r => okGame(r.game_id) && keys.includes(r.day)).map(r => ({ a, ...r })));
    const sessions = picked.flatMap(a => a.sessions.filter(s => !s.history_expired && okGame(s.game_id)).map(s => ({ a, s, start: Date.parse(s.started_at), end: Date.parse(s.updated_at) }))).filter(x => x.end >= cutoff);

    // Bars are stacked by game when every game is shown, otherwise by type of gain
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
    const best = Math.max(...perDay);

    const perAccount = picked.map(a => ({ a, gained: daily.filter(r => r.a === a).reduce((n, r) => n + total(r.gained), 0), live: (a.activeGames ?? []).some(g => okGame(g)) }));
    const inside = (x: { start: number; end: number }) => Math.max(0, x.end - Math.max(x.start, cutoff));
    const minutes = sessions.reduce((n, x) => n + inside(x) / 60000, 0);
    const sessionGains = sessions.reduce((n, x) => n + total(x.s.snapshot.gained) * (x.end > x.start ? inside(x) / (x.end - x.start) : 1), 0);

    // Item lists come from sessions that began inside the window, so older sessions are not counted twice
    const items = new Map<string, { name: string; kind: string; gained: number }>();
    for (const { s, start } of sessions) if (start >= cutoff) for (const it of s.snapshot.details) if (it.gained > 0) {
      const id = `${it.kind}:${it.name}`;
      items.set(id, { name: it.name, kind: it.kind, gained: (items.get(id)?.gained ?? 0) + it.gained });
    }
    return {
      bars, stackNames, gained: perDay.reduce((n, v) => n + v, 0), best: best > 0 ? { v: best, day: keys[perDay.indexOf(best)] } : null,
      perDay, perAccount, live: perAccount.filter(x => x.live).length, minutes, sessionCount: sessions.length,
      perHour: minutes > 0 ? sessionGains / (minutes / 60) : 0,
      sessionsPerDay: keys.map(day => sessions.filter(x => utcDay(x.end) === day).length),
      topItems: [...items.entries()].sort((x, y) => y[1].gained - x[1].gained).slice(0, 8),
    };
  }, [accounts, game, acct, days, now]);

  const range = days === 1 ? 'Today (UTC)' : 'Last 7 days (UTC)';
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-ts-fg">Dashboard</h2><p className="mt-0.5 text-xs text-ts-fg/40">What your accounts gained. Days are UTC.</p></div>
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
        <Kpi icon={<Zap size={14} />} label="Total gained" value={compactCount(d.gained)} hint={range} spark={days > 1 ? d.perDay : undefined} />
        <Kpi icon={<Users size={14} />} label="Active now" value={`${d.live} / ${d.perAccount.length}`} hint="Accounts with the library running" />
        <Kpi icon={<Layers size={14} />} label="Sessions" value={String(d.sessionCount)} hint={range} spark={days > 1 ? d.sessionsPerDay : undefined} />
        <Kpi icon={<Clock size={14} />} label="Play time" value={hours(d.minutes)} hint="Tracked while the library ran" />
        <Kpi icon={<Gauge size={14} />} label="Gains / hour" value={compactCount(Math.round(d.perHour))} hint="Across tracked sessions" />
        <Kpi icon={<Trophy size={14} />} label="Best day" value={d.best ? compactCount(d.best.v) : '—'} hint={d.best ? shortDay(d.best.day) : 'No gains yet'} />
      </div>

      <ChartCard title="Daily gains" hint={game === 'all' ? 'Stacked by game' : 'Stacked by type'}>
        {d.gained > 0 ? <><BarChart bars={d.bars} label="Daily gains" /><Legend items={d.stackNames.map((name, i) => ({ name, color: palette[i % palette.length] }))} /></> : <Empty>No gains recorded in this range.</Empty>}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Gains by account" hint={range}>
          <HBars rows={[...d.perAccount].sort((x, y) => y.gained - x.gained).map(x => ({
            id: String(x.a.index), value: x.gained,
            label: <><Avatar src={avatarOf(x.a.account.roblox_id)} name={x.a.account.username} small /><span className="truncate">{x.a.account.username}</span>{x.live && <span title="Library running" className="h-1.5 w-1.5 shrink-0 rounded-full bg-ts-pos" />}</>,
          }))} empty="No accounts connected." />
        </ChartCard>
        <ChartCard title="Top gained" hint="Most gained items and pets">
          <HBars rows={d.topItems.map(([id, it]) => ({ id, label: <span className="truncate">{it.name}<span className="ml-1.5 text-ts-fg/35">{it.kind}</span></span>, value: it.gained }))} empty="No item gains in this range." />
        </ChartCard>
      </div>
    </div>
  );
}
