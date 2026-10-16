'use client';

import { useState, type ReactNode } from 'react';
import { compactCount } from '@/lib/trackstat';
import { card } from './ui';

// Series colors come from the active Trackstat theme
export const palette = ['var(--ts-c1)', 'var(--ts-c2)', 'var(--ts-c3)', 'var(--ts-c4)', 'var(--ts-c5)', 'var(--ts-c6)'];

export function ChartCard({ title, hint, className = '', children }: { title: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`${card} p-5 ${className}`}>
      <div className="mb-4"><h3 className="text-sm font-semibold text-ts-fg">{title}</h3>{hint && <p className="mt-0.5 text-xs text-ts-fg/40">{hint}</p>}</div>
      {children}
    </section>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="grid min-h-32 place-items-center text-center text-xs text-ts-fg/40">{children}</p>;

export function Legend({ items }: { items: { name: string; color: string; value?: string }[] }) {
  return <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ts-fg/60">{items.map(i => <li key={i.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: i.color }} />{i.name}{i.value && <span className="font-mono text-ts-fg/40">{i.value}</span>}</li>)}</ul>;
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${values.length > 1 ? (i / (values.length - 1)) * 100 : 50},${26 - (v / max) * 24}`).join(' ');
  return <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden><polyline points={pts} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--ts-accent)' }} /></svg>;
}

export type Bar = { id: string; label: string; title: string; segments: { name: string; color: string; value: number }[] };

// Vertical (optionally stacked) bars; the tooltip is pure CSS so it costs no state
export function BarChart({ bars, label, format = compactCount, showEvery = 1 }: { bars: Bar[]; label: string; format?: (n: number) => string; showEvery?: number }) {
  const totals = bars.map(b => b.segments.reduce((n, s) => n + s.value, 0));
  const max = Math.max(...totals, 1);
  return (
    <figure aria-label={label} className="m-0">
    <ul className="sr-only">{bars.map((b, i) => <li key={b.id}>{b.title.replace(/\n/g, ', ')}: {totals[i] > 0 ? b.segments.filter(x => x.value > 0).map(x => `${x.name} ${format(x.value)}`).join(', ') : 'nothing'}</li>)}</ul>
    <div aria-hidden="true" className="flex gap-3">
      <div className="flex h-48 flex-col justify-between pb-6 text-right font-mono text-[11px] text-ts-fg/40"><span>{format(max)}</span><span>{format(max / 2)}</span><span>0</span></div>
      <div className="min-w-0 flex-1">
        <div className="relative flex h-48 items-end gap-1 border-b border-ts-fg/[0.07] pb-0">
          {[0.25, 0.5, 0.75].map(f => <span key={f} className="pointer-events-none absolute inset-x-0 h-px bg-ts-fg/[0.05]" style={{ bottom: `${f * 100}%` }} />)}
          {bars.map((b, i) => (
            <div key={b.id} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="flex flex-col-reverse overflow-hidden rounded-t transition-opacity group-hover:opacity-80" style={{ height: `${(totals[i] / max) * 100}%` }}>
                {b.segments.filter(s => s.value > 0).map(s => <span key={s.name} style={{ background: s.color, flexGrow: s.value }} className="min-h-px" />)}
              </div>
              <div className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden min-w-36 whitespace-nowrap rounded-lg bg-ts-raised px-3 py-2 text-xs shadow-xl group-hover:block ${i < bars.length / 3 ? 'left-0' : i > (bars.length * 2) / 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                <p className="whitespace-pre text-ts-fg/45">{b.title}</p>
                {b.segments.filter(s => s.value > 0).map(s => <p key={s.name} className="mt-1 flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-ts-fg/70"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span><span className="font-mono text-ts-fg">{format(s.value)}</span></p>)}
                {b.segments.length > 1 && <p className="mt-1.5 flex justify-between gap-4 border-t border-ts-fg/10 pt-1.5"><span className="text-ts-fg/45">Total</span><span className="font-mono text-ts-fg">{format(totals[i])}</span></p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1 font-mono text-[11px] text-ts-fg/40">{bars.map((b, i) => <span key={b.id} className="min-w-0 flex-1 truncate text-center">{i % showEvery === 0 ? b.label : ''}</span>)}</div>
      </div>
    </div>
    </figure>
  );
}

export type Line = { name: string; color: string; points: { t: number; v: number }[] };

// Time-based multi-line chart with a shared hover crosshair
export function LineChart({ lines, label, format = compactCount, fromZero = false, date }: { lines: Line[]; label: string; format?: (n: number) => string; fromZero?: boolean; date: (t: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const all = lines.flatMap(l => l.points);
  const times = [...new Set(all.map(p => p.t))].sort((a, b) => a - b);
  const t0 = times[0], span = (times.at(-1) ?? t0) - t0;
  let lo = fromZero ? 0 : Math.min(...all.map(p => p.v)), hi = Math.max(...all.map(p => p.v));
  if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
  const W = 600, H = 200;
  const fx = (t: number) => (span ? (t - t0) / span : 0.5);
  const fy = (v: number) => (H - 8 - ((v - lo) / (hi - lo)) * (H - 16)) / H;
  const shownT = hover !== null ? times[hover] : null;
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    setHover(times.reduce((best, t, i) => (Math.abs(fx(t) - x) < Math.abs(fx(times[best]) - x) ? i : best), 0));
  };
  const nearest = (l: Line, t: number) => l.points.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), l.points[0]);
  return (
    <figure aria-label={label} className="m-0">
    <ul className="sr-only">{lines.map(l => { const values = l.points.map(p => p.v); return <li key={l.name}>{l.name}: {date(l.points[0].t)} {format(values[0])}, {date(l.points.at(-1)!.t)} {format(values.at(-1)!)}, lowest {format(Math.min(...values))}, highest {format(Math.max(...values))}</li>; })}</ul>
    <div aria-hidden="true" className="flex gap-3">
      <div className="flex h-52 flex-col justify-between py-1 text-right font-mono text-[11px] text-ts-fg/40"><span>{format(hi)}</span><span>{format((hi + lo) / 2)}</span><span>{format(lo)}</span></div>
      <div className="min-w-0 flex-1">
        <div className="relative h-52 cursor-crosshair touch-none" onPointerMove={move} onPointerLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" role="img">
            {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-ts-fg/[0.06]" vectorEffect="non-scaling-stroke" />)}
            {lines.filter(l => l.points.length > 1).map(l => {
              const pts = l.points.map(p => `${fx(p.t) * W},${fy(p.v) * H}`);
              return <g key={l.name}>
                <polygon points={`${fx(l.points[0].t) * W},${H} ${pts.join(' ')} ${fx(l.points.at(-1)!.t) * W},${H}`} style={{ fill: l.color, opacity: 0.08 }} />
                <polyline points={pts.join(' ')} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: l.color }} />
              </g>;
            })}
          </svg>
          {lines.filter(l => l.points.length === 1).map(l => <span key={l.name} className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${fx(l.points[0].t) * 100}%`, top: `${fy(l.points[0].v) * 100}%`, background: l.color }} />)}
          {shownT !== null && (
            <>
              <span className="pointer-events-none absolute bottom-0 top-0 w-px bg-ts-fg/20" style={{ left: `${fx(shownT) * 100}%` }} />
              {lines.map(l => { const p = nearest(l, shownT); return <span key={l.name} className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ts-surface" style={{ left: `${fx(p.t) * 100}%`, top: `${fy(p.v) * 100}%`, background: l.color }} />; })}
              <div className={`pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-lg bg-ts-raised px-3 py-2 text-xs shadow-xl ${fx(shownT) > 0.6 ? '-translate-x-full' : ''}`} style={{ left: `${fx(shownT) * 100 + (fx(shownT) > 0.6 ? -1 : 1)}%` }}>
                <p className="text-ts-fg/45">{date(shownT)}</p>
                {lines.map(l => <p key={l.name} className="mt-1 flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-ts-fg/70"><span className="h-2 w-2 rounded-full" style={{ background: l.color }} />{l.name}</span><span className="font-mono text-ts-fg">{format(nearest(l, shownT).v)}</span></p>)}
              </div>
            </>
          )}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px] text-ts-fg/40"><span>{date(t0)}</span><span>{date(t0 + span)}</span></div>
      </div>
    </div>
    </figure>
  );
}

export function Donut({ slices, center, format = compactCount }: { slices: { name: string; value: number; color: string }[]; center: string; format?: (n: number) => string }) {
  const sum = slices.reduce((n, s) => n + s.value, 0);
  let offset = 0;
  return (
    <div>
      <div className="relative mx-auto aspect-square w-44">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img" aria-label="Gains by type">
          <circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" className="stroke-ts-fg/[0.06]" />
          {sum > 0 && slices.filter(s => s.value > 0).map(s => {
            const pct = (s.value / sum) * 100;
            const el = <circle key={s.name} cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" strokeDasharray={`${Math.max(pct - 0.6, 0.1)} ${100 - Math.max(pct - 0.6, 0.1)}`} strokeDashoffset={-offset} style={{ stroke: s.color }} />;
            offset += pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-mono text-xl text-ts-fg">{format(sum)}</p><p className="text-[11px] text-ts-fg/40">{center}</p></div></div>
      </div>
      <Legend items={slices.map(s => ({ name: s.name, color: s.color, value: sum ? `${Math.round((s.value / sum) * 100)}%` : '0%' }))} />
    </div>
  );
}

export function HBars({ rows, format = compactCount, empty = 'No data yet.' }: { rows: { id: string; label: ReactNode; value: number; sub?: string; color?: string }[]; format?: (n: number) => string; empty?: string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-ts-fg/80">{r.label}</span><span className="shrink-0 font-mono text-ts-fg">{format(r.value)}{r.sub && <span className="ml-2 text-ts-fg/40">{r.sub}</span>}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-ts-fg/[0.06]"><span className="block h-full rounded-full" style={{ width: `${Math.max((r.value / max) * 100, 1.5)}%`, background: r.color ?? palette[i % palette.length] }} /></div>
        </li>
      ))}
    </ul>
  );
}

// rows = days (oldest first), columns = hours 0-23, cell = active minutes
export function Heatmap({ grid, rowLabels }: { grid: number[][]; rowLabels: string[] }) {
  const max = Math.max(...grid.flat(), 1);
  const busiest = grid.flatMap((row, r) => row.map((m, h) => ({ m, r, h }))).reduce((best, cell) => (cell.m > best.m ? cell : best));
  const days = grid.map((row, r) => `${rowLabels[r]} ${Math.round(row.reduce((n, m) => n + m, 0))} min`).join(', ');
  return (
    <div role="img" aria-label={`Active minutes per hour over the last 7 days. Busiest: ${rowLabels[busiest.r]} at ${String(busiest.h).padStart(2, '0')}:00 with ${Math.round(busiest.m)} minutes. Totals per day: ${days}.`}>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(24, minmax(0, 1fr))' }}>
        {grid.map((row, r) => [
          <span key={`l${r}`} className="pr-2 text-right font-mono text-[11px] leading-5 text-ts-fg/40">{rowLabels[r]}</span>,
          ...row.map((m, h) => <span key={`${r}:${h}`} title={`${rowLabels[r]} ${String(h).padStart(2, '0')}:00 · ${Math.round(m)} min active`} className="aspect-square rounded-[3px]" style={{ background: m > 0 ? `color-mix(in oklab, var(--ts-accent) ${Math.max(14, (m / max) * 100)}%, transparent)` : 'color-mix(in oklab, var(--ts-fg) 5%, transparent)' }} />),
        ])}
        <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center font-mono text-[10px] text-ts-fg/35">{h % 6 === 0 ? h : ''}</span>)}
      </div>
    </div>
  );
}
