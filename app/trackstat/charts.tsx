'use client';

import type { ReactNode } from 'react';
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
