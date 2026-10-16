'use client';

import { useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { compactCount } from '@/lib/trackstat';
import { niceMax, smooth } from '@/lib/trackstat-chart';
import { card } from './ui';

// Series colors come from the active Trackstat theme
export const palette = ['var(--ts-c1)', 'var(--ts-c2)', 'var(--ts-c3)', 'var(--ts-c4)', 'var(--ts-c5)', 'var(--ts-c6)'];

export function ChartCard({ title, hint, info, className = '', children }: { title: string; hint?: string; info?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`${card} p-5 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h3 className="inline-block border-b border-ts-fg/40 pb-1 text-sm font-medium text-ts-fg">{title}</h3>{hint && <p className="mt-2 text-xs text-ts-fg/40">{hint}</p>}</div>
        {info && <span title={info} aria-label={info} tabIndex={0} className="mt-0.5 text-ts-fg/35 hover:text-ts-fg"><Info size={15} /></span>}
      </div>
      {children}
    </section>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="grid min-h-32 place-items-center text-center text-xs text-ts-fg/40">{children}</p>;

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${values.length > 1 ? (i / (values.length - 1)) * 100 : 50},${26 - (v / max) * 24}`).join(' ');
  return <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden><polyline points={pts} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--ts-accent)' }} /></svg>;
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

export type AreaPoint = { id: string; label: string; title: string; value: number };

// Smooth filled area with a dotted grid; hovering a day shows its value
export function AreaChart({ points, label, format = compactCount }: { points: AreaPoint[]; label: string; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const gradient = useId();
  const W = 600, H = 220, pad = 10;
  const max = niceMax(Math.max(...points.map(p => p.value), 1));
  const xs = points.map((_, i) => (points.length > 1 ? (i / (points.length - 1)) * W : W / 2));
  const ys = points.map(p => H - pad - (p.value / max) * (H - pad * 2));
  const line = smooth(xs, ys);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    setHover(xs.reduce((best, px, i) => (Math.abs(px - x) < Math.abs(xs[best] - x) ? i : best), 0));
  };
  const active = hover !== null ? points[hover] : null;
  return (
    <figure aria-label={label} className="m-0">
      <ul className="sr-only">{points.map(p => <li key={p.id}>{p.title}: {format(p.value)}</li>)}</ul>
      <div aria-hidden="true" className="flex gap-3">
        <div className="flex h-56 flex-col justify-between pb-0.5 text-right font-mono text-[11px] text-ts-fg/45"><span>{format(max)}</span><span>{format(max / 2)}</span><span>0</span></div>
        <div className="min-w-0 flex-1">
          <div className="relative h-56 cursor-crosshair touch-none" onPointerMove={move} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--ts-accent)', stopOpacity: 0.55 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--ts-accent)', stopOpacity: 0.02 }} />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" className="stroke-ts-fg/[0.12]" />)}
              {xs.map((x, i) => <line key={points[i].id} x1={x} x2={x} y1="0" y2={H} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" className={i === hover ? 'stroke-ts-fg/45' : 'stroke-ts-fg/[0.18]'} />)}
              <line x1="0" x2={W} y1={H} y2={H} vectorEffect="non-scaling-stroke" className="stroke-ts-fg/30" />
              <path d={`${line} L${xs.at(-1)},${H} L${xs[0]},${H} Z`} fill={`url(#${gradient})`} />
              <path d={line} fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ stroke: 'var(--ts-accent)' }} />
            </svg>
            {active && hover !== null && (
              <>
                <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ts-accent bg-ts-surface" style={{ left: `${(xs[hover] / W) * 100}%`, top: `${(ys[hover] / H) * 100}%` }} />
                <div className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-ts-fg px-2 py-1 text-[11px] font-medium text-ts-bg shadow-lg ${hover === 0 ? '' : hover === points.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${(xs[hover] / W) * 100}%`, top: `calc(${(ys[hover] / H) * 100}% - 34px)` }}>
                  {format(active.value)} <span className="opacity-60">· {active.label}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-ts-fg/45">{points.map(p => <span key={p.id}>{p.label}</span>)}</div>
        </div>
      </div>
    </figure>
  );
}

// Concentric rings: the longest ring is the biggest share and the others are drawn relative to it; the legend gives the numbers
export function ArcsChart({ rows, label, format = compactCount }: { rows: { id: string; name: string; value: number }[]; label: string; format?: (n: number) => string }) {
  const list = [...rows].filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, 4);
  const sum = rows.reduce((n, r) => n + r.value, 0);
  const max = Math.max(...list.map(r => r.value), 1);
  const C = 110, first = 92, gap = 19, sweep = 0.75;
  const percent = (value: number) => (sum ? Math.round((value / sum) * 100) : 0);
  return (
    <figure aria-label={label} className="m-0">
      <ul className="sr-only">{list.map(r => <li key={r.id}>{r.name}: {format(r.value)}, {percent(r.value)} percent</li>)}</ul>
      <svg aria-hidden="true" viewBox="0 0 220 220" className="mx-auto block w-full max-w-[250px]">
        {list.map((r, i) => {
          const radius = first - i * gap, circumference = 2 * Math.PI * radius, share = (r.value / max) * sweep;
          // The percentage sits just past the end of the line, on the same ring, so it never covers the line itself
          const after = Math.PI + share * 2 * Math.PI + 18 / radius;
          const lx = C + radius * Math.cos(after), ly = C + radius * Math.sin(after);
          return (
            <g key={r.id}>
              <g transform={`rotate(180 ${C} ${C})`}>
                <circle cx={C} cy={C} r={radius} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circumference * sweep} ${circumference}`} className="stroke-ts-fg/[0.08]" />
                <circle cx={C} cy={C} r={radius} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.max(circumference * share, 1)} ${circumference}`} style={{ stroke: palette[i % palette.length] }} />
              </g>
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize="9" fontWeight="600" style={{ fill: palette[i % palette.length] }}>{percent(r.value)}%</text>
            </g>
          );
        })}
      </svg>
      <ul className="mt-4 space-y-2 text-xs">
        {list.map((r, i) => <li key={r.id} className="flex items-center gap-2 text-ts-fg/70"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} /><span className="min-w-0 flex-1 truncate">{r.name}</span><span className="font-mono text-ts-fg">{format(r.value)}</span><span className="w-9 text-right font-mono text-ts-fg/40">{percent(r.value)}%</span></li>)}
      </ul>
    </figure>
  );
}
