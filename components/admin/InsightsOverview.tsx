'use client';

import { useMemo, useRef, useState } from 'react';
import { DollarSign, TrendingUp, Package, Users } from 'lucide-react';

interface Payment {
  transaction_id: string;
  payer_email?: string;
  roblox_username?: string;
  tier: string;
  amount: number;
  currency: string;
  created_at: string;
}

const ROBUX_TO_USD = 0.0035;

const TIER_COLORS: Record<string, string> = {
  weekly: '#60a5fa',
  monthly: '#a78bfa',
  lifetime: '#34d399',
};

const METHOD_COLORS: Record<string, string> = {
  PayPal: '#60a5fa',
  Robux: '#fbbf24',
};

function usdValue(p: Payment) {
  return p.currency === 'ROBUX' ? Number(p.amount || 0) * ROBUX_TO_USD : Number(p.amount || 0);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtUSD(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
}

function niceCeil(n: number) {
  if (n <= 0) return 10;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const frac = n / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}

export default function InsightsOverview({ payments }: { payments: Payment[] }) {
  const daily = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({ key: dayKey(d), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 });
    }
    const map = new Map(buckets.map(b => [b.key, b]));
    payments.forEach(p => {
      const bucket = map.get(dayKey(new Date(p.created_at)));
      if (bucket) bucket.value += usdValue(p);
    });
    return buckets;
  }, [payments]);

  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + usdValue(p), 0), [payments]);
  const totalOrders = payments.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const last7 = daily.slice(-7).reduce((s, b) => s + b.value, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, b) => s + b.value, 0);
  const weekDelta = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : last7 > 0 ? 100 : 0;
  const showDelta = prev7 > 0 || last7 > 0;

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { weekly: 0, monthly: 0, lifetime: 0 };
    payments.forEach(p => { if (counts[p.tier] !== undefined) counts[p.tier]++; });
    return counts;
  }, [payments]);

  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = { PayPal: 0, Robux: 0 };
    payments.forEach(p => { counts[p.currency === 'ROBUX' ? 'Robux' : 'PayPal']++; });
    return counts;
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Total Revenue" value={fmtUSD(totalRevenue)} icon={DollarSign} color="text-[var(--accent)]" />
        <StatTile
          label="Last 7 Days"
          value={fmtUSD(last7)}
          delta={showDelta ? weekDelta : undefined}
          icon={TrendingUp}
          color="text-blue-400"
        />
        <StatTile label="Total Orders" value={totalOrders.toLocaleString()} icon={Package} color="text-white" />
        <StatTile label="Avg Order Value" value={fmtUSD(avgOrder)} icon={Users} color="text-violet-400" />
      </div>

      {/* Revenue trend */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white">Revenue — Last 30 Days</h3>
          <p className="text-xs text-[#555] mt-0.5">PayPal + Robux (converted at ${ROBUX_TO_USD}/R$), by day</p>
        </div>
        <RevenueLineChart data={daily} />
      </div>

      {/* Breakdowns */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Sales by Tier</h3>
          <BarBreakdown
            data={[
              { label: 'Weekly', value: tierCounts.weekly, color: TIER_COLORS.weekly },
              { label: 'Monthly', value: tierCounts.monthly, color: TIER_COLORS.monthly },
              { label: 'Lifetime', value: tierCounts.lifetime, color: TIER_COLORS.lifetime },
            ]}
          />
        </div>
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Orders by Method</h3>
          <BarBreakdown
            data={[
              { label: 'PayPal', value: methodCounts.PayPal, color: METHOD_COLORS.PayPal },
              { label: 'Robux', value: methodCounts.Robux, color: METHOD_COLORS.Robux },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label, value, delta, icon: Icon, color,
}: { label: string; value: string; delta?: number; icon: any; color: string }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-[#555] font-medium">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {delta !== undefined && (
        <p className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs prior week
        </p>
      )}
    </div>
  );
}

function BarBreakdown({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-4">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-white">{d.label}</span>
            <span className="text-xs font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueLineChart({ data }: { data: { key: string; label: string; value: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 800;
  const height = 220;
  const padL = 50, padR = 12, padT = 12, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(1, ...data.map(d => d.value));
  const niceMax = niceCeil(maxVal);

  const x = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (niceMax / gridSteps) * i);
  const labelEvery = Math.ceil(data.length / 6);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = (px - padL) / innerW;
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto touch-none"
        style={{ overflow: 'visible' }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + innerW} y1={y(v)} y2={y(v)} stroke="#2c2c2a" strokeWidth={1} />
            <text x={padL - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
              {v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          i % labelEvery === 0 && (
            <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="#898781">
              {d.label}
            </text>
          )
        ))}

        <path d={areaPath} fill="var(--accent)" opacity={0.1} />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered && hoverIdx !== null && (
          <g>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={padT} y2={padT + innerH} stroke="#3f3f3d" strokeWidth={1} />
            <circle cx={x(hoverIdx)} cy={y(hovered.value)} r={4} fill="var(--accent)" stroke="#1a1a19" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && hoverIdx !== null && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg bg-[#151515] border border-white/10 text-xs shadow-xl z-10"
          style={{
            left: `${(x(hoverIdx) / width) * 100}%`,
            top: 0,
            transform: `translate(${hoverIdx > data.length / 2 ? '-105%' : '5%'}, 0)`,
          }}
        >
          <p className="text-[#888] mb-0.5">{hovered.label}</p>
          <p className="text-white font-semibold">{fmtUSD(hovered.value)}</p>
        </div>
      )}
    </div>
  );
}
