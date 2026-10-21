'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Gem, Search } from 'lucide-react';
import inventoryStyles from './InventoryStats.module.css';
import { thumbnailBlob } from '@/lib/client/trackstat-images';
import { compactCount, type Counts, type TrackstatDailyGains, type TrackstatSession } from '@/lib/trackstat';

export const card = 'ts-clay-card rounded-xl border border-ts-fg/[0.07] bg-ts-surface';
export const inventoryStats = inventoryStyles.stats;
const variantColors: Record<string, string> = { Silver: '#cbd5e1', Gold: '#fbbf24', Golden: '#fbbf24', Emerald: '#34d399', Ruby: '#f43f5e', Diamond: '#67e8f9', Shiny: '#fde68a' };
export const variantStyle = (v: string): CSSProperties => v === 'Rainbow'
  ? { backgroundImage: 'linear-gradient(90deg,#f87171,#fbbf24,#34d399,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
  : { color: variantColors[v] ?? 'var(--ts-accent)' };
export const PlacedTag = () => <span className="flex shrink-0 items-center gap-1 rounded-full bg-ts-pos/10 px-2 py-0.5 text-[10px] font-medium text-ts-pos"><span className="h-1.5 w-1.5 rounded-full bg-ts-pos" />Placed</span>;
export const VariantTag = ({ name }: { name: string }) => <span className="flex items-center gap-1 text-xs font-medium" style={variantStyle(name)}><span className="text-ts-fg/25">·</span><span>✦</span>{name}</span>;
export function InventoryStat({ value, label, icon, tone, detail }: { value: string; label: string; icon: ReactNode; tone?: 'currency' | 'income'; detail?: string }) {
  return <div className={inventoryStyles.stat} data-tone={tone}>
    <span className={inventoryStyles.icon} aria-hidden="true">{icon}</span>
    <div className={inventoryStyles.copy}>
      <p className={inventoryStyles.value} title={detail ? `${value} (${detail})` : value}><span>{value}</span>{detail && <span className={inventoryStyles.detail}> ({detail})</span>}</p>
      <p className={inventoryStyles.label}>{label}</p>
    </div>
  </div>;
}
export const button = 'rounded-lg border border-ts-fg/10 px-4 py-2.5 text-sm text-ts-fg/70 transition-colors hover:border-ts-accent/50 hover:text-ts-accent focus-visible:outline-2 focus-visible:outline-ts-accent disabled:opacity-40';
export const total = (c: Counts) => Object.values(c).reduce((n, v) => n + v, 0);
// When an item last increased (unix seconds, from the library); older saves have none, so the session's last sync time stands in
export const gainAt = (d: { t?: number }, fallback: string) => (d.t ? new Date(d.t * 1000).toISOString() : fallback);
export const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};
export const span = (s: TrackstatSession) => {
  const m = Math.max(0, Math.round((new Date(s.updated_at).getTime() - new Date(s.started_at).getTime()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

export function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className={`${card} flex items-center gap-4 p-4`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ts-accent/10 text-ts-accent">{icon}</span>
      <div className="min-w-0"><p className="text-xs text-ts-fg/45">{label}</p><p className="mt-1 truncate font-mono text-xl text-ts-fg" title={hint}>{value}</p></div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-md bg-ts-fg/[0.07] ${className}`} />;
}

// backup is tried when src fails to load; the box pulses until the picture arrives
type ImageProps = { src?: string | null; backup?: string | null; className: string; fallback: ReactNode };
export function Img(props: ImageProps) {
  return <ImageWithFallback key={JSON.stringify([props.src, props.backup])} {...props} />;
}
function ImageWithFallback({ src, backup, className, fallback }: ImageProps) {
  const [failures, setFailures] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const shown = [...new Set([src, backup].filter((url): url is string => !!url))][failures];
  const [cached, setCached] = useState<{ src: string; url: string } | null>(null);
  useEffect(() => {
    if (!shown) return;
    let live = true;
    let objectUrl: string | undefined;
    void thumbnailBlob(shown).then(blob => {
      if (!live) return;
      if (blob) objectUrl = URL.createObjectURL(blob);
      setCached({ src: shown, url: objectUrl ?? shown });
    }).catch(() => { if (live) { setLoaded(false); setFailures(n => n + 1); } });
    return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [shown]);
  const source = cached && cached.src === shown ? cached.url : null;
  // eslint-disable-next-line @next/next/no-img-element
  return shown ? source ? <img src={source} alt="" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setFailures(n => n + 1); }} className={`${className} object-cover ${loaded ? '' : 'animate-pulse'}`} /> : <span aria-hidden className={`${className} animate-pulse`} /> : <span className={`${className} grid place-items-center`}>{fallback}</span>;
}

export function Avatar({ src, name, small, tiny }: { src?: string | null; name: string; small?: boolean; tiny?: boolean }) {
  return <Img src={src} className={`${tiny ? 'h-7 w-7 text-xs' : small ? 'h-9 w-9 text-sm' : 'h-16 w-16 text-2xl'} shrink-0 rounded-full bg-ts-accent/15 font-semibold text-ts-accent`} fallback={name[0]?.toUpperCase()} />;
}

export const ranges = { '1D': 1, '7D': 7 } as const;

// Placeholder shaped like an inventory card
export function CardSkeleton() {
  return (
    <div className={`${card} overflow-hidden`}>
      <Skeleton className="h-28 rounded-none" />
      <div className="space-y-3 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /><Skeleton className="mt-6 h-3 w-1/2" /></div>
    </div>
  );
}

// Whole-page placeholder shown until the first response arrives
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading Trackstat">
      <div className={`${card} mb-6 flex flex-wrap items-center gap-5 p-5`}>
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1 basis-56 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-64 max-w-full" /></div>
        <div className="grid w-full grid-cols-2 gap-3 xl:w-auto xl:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[74px] w-full xl:w-44" />)}</div>
      </div>
      <Skeleton className="mb-4 h-6 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{[0, 1].map(i => <div key={i} className={`${card} overflow-hidden`}><Skeleton className="h-36 rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></div>)}</div>
    </div>
  );
}

export function GainChart({ daily }: { daily: TrackstatDailyGains[] }) {
  const [range, setRange] = useState<keyof typeof ranges>('7D');
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const midnight = Date.parse(`${today}T00:00:00Z`);
    const totals = new Map(daily.map(day => [day.day, total(day.gained)]));
    return Array.from({ length: ranges[range] }, (_, i) => {
      const t = midnight - (ranges[range] - i - 1) * 86400e3;
      const gained = totals.get(new Date(t).toISOString().slice(0, 10)) ?? 0;
      return { t, v: gained };
    });
  }, [daily, range]);
  const W = 600, H = 180, max = Math.max(...points.map(p => p.v), 1), t0 = points[0].t, dt = points.length * 86400e3;
  const fx = (p: { t: number }) => (p.t - t0 + 43200e3) / dt;
  const fy = (p: { v: number }) => (H - (p.v / max) * (H - 10) - 5) / H;
  const dayLabel = (t: number) => new Date(t).toLocaleDateString([], { timeZone: 'UTC', month: 'short', day: 'numeric' });
  const active = hover !== null ? points[hover] : null;
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    setHover(points.reduce((best, p, i) => (Math.abs(fx(p) - x) < Math.abs(fx(points[best]) - x) ? i : best), 0));
  };
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-end gap-1" role="group" aria-label="Chart range">{(Object.keys(ranges) as (keyof typeof ranges)[]).map(r => <button key={r} aria-pressed={range === r} onClick={() => { setRange(r); setHover(null); }} className={`rounded-md px-3 py-1 text-xs transition-colors ${range === r ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{r}</button>)}</div>
      <div className="flex min-h-44 flex-1 gap-3">
          <div className="flex flex-col justify-between py-1 text-right font-mono text-[11px] text-ts-fg/40"><span>{compactCount(max)}</span><span>{compactCount(max / 2)}</span><span>0</span></div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative flex-1 cursor-crosshair touch-none" onPointerMove={move} onPointerLeave={() => setHover(null)}>
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" role="img" aria-label="Daily gains (UTC)">
                {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-ts-fg/[0.06]" vectorEffect="non-scaling-stroke" />)}
                {points.map(p => <rect key={p.t} x={fx(p) * W - W / points.length * 0.3} y={fy(p) * H} width={W / points.length * 0.6} height={Math.max(0, H - 5 - fy(p) * H)} className="fill-ts-accent" rx="3" />)}
              </svg>
              {active && (
                <>
                  <span className="pointer-events-none absolute bottom-0 top-0 w-px bg-ts-fg/20" style={{ left: `${fx(active) * 100}%` }} />
                  <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ts-accent bg-ts-surface" style={{ left: `${fx(active) * 100}%`, top: `${fy(active) * 100}%` }} />
                  <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-ts-fg/10 bg-ts-raised px-3 py-2 text-xs shadow-xl" style={{ left: `${fx(active) * 100}%`, top: `${fy(active) * 100}%`, transform: `translate(${fx(active) < 0.2 ? '8px' : fx(active) > 0.8 ? 'calc(-100% - 8px)' : '-50%'}, ${fx(active) < 0.2 || fx(active) > 0.8 ? '-50%' : 'calc(-100% - 14px)'})` }}>
                    <p className="text-ts-fg/45">{dayLabel(active.t)} · UTC</p>
                    <p className="mt-1 font-mono text-sm text-ts-fg">+{compactCount(active.v)} <span className="text-ts-fg/40">daily total</span></p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-ts-fg/40"><span>{dayLabel(t0)}</span><span>{dayLabel(points.at(-1)!.t)}</span></div>
          </div>
      </div>
    </div>
  );
}

export function DetailTable({ rows, empty, gainedOnly, images, backups = {} }: { rows: TrackstatSession['snapshot']['details']; empty: string; gainedOnly?: boolean; images: Record<string, string | null>; backups?: Record<string, string | null> }) {
  const [q, setQ] = useState('');
  const shown = rows.filter(r => (!gainedOnly || r.gained > 0) && r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (gainedOnly ? b.gained - a.gained : b.owned - a.owned));
  return (
    <div>
      <label className="relative mb-4 block max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search items" value={q} onChange={e => setQ(e.target.value)} placeholder="Search item or pet…" className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
      <div className={`${card} max-h-[480px] overflow-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-ts-raised text-xs text-ts-fg/45"><tr><th className="px-4 py-3 font-normal">Item / pet</th><th className="px-4 py-3 text-right font-normal">Owned</th><th className="px-4 py-3 text-right font-normal">Gained</th></tr></thead>
          <tbody>{shown.map((r, i) => <tr key={`${r.kind}:${r.name}:${i}`} className="border-t border-ts-fg/[0.05]"><td className="max-w-[260px] px-4 py-3 text-ts-fg/80"><div className="flex items-center gap-3"><Img src={images[r.name.toLowerCase()]} backup={backups[r.name.toLowerCase()]} className="h-9 w-9 shrink-0 object-contain" fallback={<Gem size={14} className="text-ts-fg/25" />} /><div className="min-w-0 break-words">{r.name}<span className="mt-0.5 block text-xs capitalize text-ts-fg/35">{r.kind}</span></div></div></td><td className="px-4 py-3 text-right font-mono text-ts-fg/60">{compactCount(r.owned)}</td><td className="px-4 py-3 text-right font-mono text-ts-accent">+{compactCount(r.gained)}</td></tr>)}</tbody>
        </table>
        {!shown.length && <p className="p-5 text-sm text-ts-fg/40">{empty}</p>}
      </div>
    </div>
  );
}

