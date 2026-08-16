'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const WorldExecutionMap = dynamic(() => import('@/components/WorldExecutionMap'), { ssr: false });

const ACCENT = '#c9a97a';

const card = cn(
  'group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 lg:p-7',
  'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0px_1px_2px_-1px_rgba(0,0,0,0.5),0px_2px_4px_0px_rgba(0,0,0,0.4)]',
);

const CARD_BG = 'rgba(255,255,255,0.025)';

/* ── Simplified dot world map ───────────────────────── */
function WorldMap() {
  // hand-placed dot clusters approximating continents in a 120×60 viewBox
  const dots: [number, number][] = [
    // N. America
    ...[...Array(8)].flatMap((_, r) =>
      [...Array(10)].map((_, c): [number, number] => [8 + c * 1.6, 10 + r * 1.8]),
    ),
    // S. America
    ...[...Array(7)].flatMap((_, r) =>
      [...Array(5)].map((_, c): [number, number] => [14 + c * 1.6, 32 + r * 1.8]),
    ),
    // Europe
    ...[...Array(5)].flatMap((_, r) =>
      [...Array(5)].map((_, c): [number, number] => [50 + c * 1.4, 10 + r * 1.6]),
    ),
    // Africa
    ...[...Array(9)].flatMap((_, r) =>
      [...Array(6)].map((_, c): [number, number] => [50 + c * 1.5, 22 + r * 1.8]),
    ),
    // Asia
    ...[...Array(8)].flatMap((_, r) =>
      [...Array(18)].map((_, c): [number, number] => [58 + c * 1.5, 8 + r * 1.8]),
    ),
    // Australia
    ...[...Array(4)].flatMap((_, r) =>
      [...Array(5)].map((_, c): [number, number] => [86 + c * 1.5, 38 + r * 1.8]),
    ),
  ];

  return (
    <svg
      viewBox="0 0 120 60"
      className="h-auto w-full"
      style={{ width: '140%', minWidth: '500px', marginTop: '40px', color: 'rgba(255,255,255,0.18)' }}
    >
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.5" fill="currentColor" />
      ))}
    </svg>
  );
}

/* ── Props ─────────────────────────────────────────── */
interface ScriptEntry { name: string; universeId?: string; type: string; }

interface Props {
  scriptCount: number;
  freeCount: number;
  premiumCount: number;
  workingCount: number;
  memberCount?: number;
  freeExecutions?: number;
  premiumExecutions?: number;
  totalExecutions?: number;
  scripts?: ScriptEntry[];
}

/* ── Component ─────────────────────────────────────── */
export default function HomeBento({
  scriptCount,
  freeCount,
  premiumCount,
  workingCount,
  memberCount = 2000,
  freeExecutions = 0,
  premiumExecutions = 0,
  totalExecutions = 0,
  scripts = [],
}: Props) {
  const [hov, setHov] = useState<number | null>(null);
  const [execStats, setExecStats] = useState<{
    free: number; premium: number; total: number; countryCount: number;
    topCountries: { code: string; count: number }[];
    topScripts: { universeId: string; name: string; count: number; type: string }[];
  }>({ free: freeExecutions, premium: premiumExecutions, total: totalExecutions, countryCount: 28, topCountries: [], topScripts: [] });

  useEffect(() => {
    const load = () => {
      fetch('/api/stats/executions')
        .then(r => r.json())
        .then(data => setExecStats({
          free: data.free ?? 0,
          premium: data.premium ?? 0,
          total: data.total ?? 0,
          countryCount: data.countryCount ?? (data.topCountries?.length || 28),
          topCountries: data.topCountries ?? [],
          topScripts: data.topScripts ?? [],
        }))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Filter state for Script Hub card
  const [hubFilter, setHubFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Build bar chart data from real execution counts
  const filteredTopScripts = execStats.topScripts.filter(s =>
    hubFilter === 'all' || s.type === hubFilter
  );

  const maxCount = filteredTopScripts.reduce((m, s) => Math.max(m, s.count), 1);

  const barData = filteredTopScripts.slice(0, 8).map(s => ({
    name: s.name,
    count: s.count,
    type: s.type,
    heightPct: Math.max(15, Math.round((s.count / maxCount) * 90)),
  }));

  // Fallback placeholder bars when no real data yet
  const fallbackBars = [
    { name: 'Blox Fruits', count: 0, type: 'free', heightPct: 85 },
    { name: 'Pet Sim 99', count: 0, type: 'free', heightPct: 65 },
    { name: 'MM2', count: 0, type: 'free', heightPct: 50 },
    { name: 'Anime Def.', count: 0, type: 'premium', heightPct: 70 },
    { name: 'Rivals', count: 0, type: 'free', heightPct: 45 },
    { name: 'Blade Ball', count: 0, type: 'free', heightPct: 55 },
    { name: 'AV', count: 0, type: 'premium', heightPct: 60 },
    { name: 'Other', count: 0, type: 'free', heightPct: 40 },
  ];

  const chartBars = barData.length > 0 ? barData : fallbackBars;
  const isLiveData = barData.length > 0;

  // Country code → [left%, top%] position on the 120×60 SVG viewBox world map
  // Converted to percentage of the card's overflow container
  const COUNTRY_POS: Record<string, [string, string]> = {
    US: ['23%', '28%'], CA: ['20%', '18%'], MX: ['21%', '38%'],
    BR: ['35%', '55%'], AR: ['32%', '67%'], CO: ['28%', '47%'],
    GB: ['49%', '19%'], FR: ['50%', '22%'], DE: ['52%', '19%'],
    ES: ['48%', '25%'], IT: ['53%', '24%'], NL: ['51%', '18%'],
    RU: ['65%', '14%'], TR: ['58%', '26%'], SA: ['62%', '35%'],
    NG: ['51%', '43%'], ZA: ['56%', '65%'], EG: ['57%', '33%'],
    IN: ['71%', '38%'], PK: ['68%', '33%'], BD: ['74%', '37%'],
    CN: ['78%', '28%'], JP: ['87%', '27%'], KR: ['84%', '28%'],
    TH: ['77%', '40%'], VN: ['79%', '41%'], MY: ['79%', '47%'],
    ID: ['80%', '50%'], PH: ['83%', '42%'], SG: ['79%', '48%'],
    AU: ['84%', '63%'], NZ: ['92%', '70%'],
  };

  return (
    <section className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-28">
      {/* Header */}
      <div className="mb-12 max-w-2xl">
        <p className="section-label mb-4" style={{ color: ACCENT, opacity: 1 }}>Why Seisen</p>
        <h2
          className="font-bold text-white mb-4"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', letterSpacing: '-0.04em', lineHeight: 1.02 }}
        >
          The script hub that<br />takes quality seriously.
        </h2>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: 1.75 }}>
          Most hubs ship and forget. We review, update, and verify everything before it reaches your executor.
        </p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* ── Card 1: Script Hub stats (2-col) ── */}
        <div
          className={cn(card, 'min-h-[320px] flex-col justify-between md:col-span-2 overflow-visible')}
          style={{ backgroundColor: CARD_BG }}
          onMouseEnter={() => setHov(1)}
          onMouseLeave={() => setHov(null)}
        >
          <div className="relative z-10 flex w-full flex-col">
            {/* Header with filter buttons */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Script Hub Activity
                </span>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {hubFilter === 'free' ? freeCount : hubFilter === 'premium' ? premiumCount : scriptCount}{' '}
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {hubFilter === 'free' ? 'free scripts' : hubFilter === 'premium' ? 'premium scripts' : 'scripts total'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter selector tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1 border border-white/10">
                  {(['all', 'free', 'premium'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setHubFilter(tab)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all duration-200',
                        hubFilter === tab
                          ? 'bg-[#c9a97a] text-black shadow-sm font-bold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Live Badge */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(201,169,122,0.1)', color: ACCENT, border: `1px solid rgba(201,169,122,0.2)` }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Live
                </div>
              </div>
            </div>

            {/* Per-script execution bar chart */}
            <div className="relative flex h-32 items-end gap-2 overflow-visible pt-6 pb-1">
              {!isLiveData && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    No executions logged yet
                  </span>
                </div>
              )}
              {chartBars.map((item, i) => {
                const isHovered = hoveredBar === i;

                return (
                  <div
                    key={`${item.name}-${i}`}
                    className="relative flex-1 h-full flex flex-col justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover Glassmorphic Tooltip */}
                    {isHovered && isLiveData && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: -8, scale: 1 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 z-30 pointer-events-none min-w-[140px] rounded-xl bg-[#121212]/95 border border-white/15 p-2.5 shadow-2xl backdrop-blur-md text-left"
                      >
                        <span className="text-xs font-bold text-white leading-tight block mb-1 truncate max-w-[130px]">
                          {item.name}
                        </span>
                        <div className="text-[11px] space-y-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          <p className="font-semibold text-[#c9a97a]">
                            {item.count.toLocaleString()} run{item.count !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[10px] capitalize" style={{ color: item.type === 'premium' ? '#a78bfa' : '#6ee7b7' }}>
                            {item.type}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Bar */}
                    <motion.div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{
                        backgroundColor: isHovered
                          ? '#e5ca9e'
                          : !isLiveData
                          ? 'rgba(201,169,122,0.12)'
                          : item.type === 'premium'
                          ? (i % 2 === 0 ? '#a78bfa' : 'rgba(167,139,250,0.4)')
                          : (i % 2 === 0 ? ACCENT : 'rgba(201,169,122,0.35)'),
                        boxShadow: isHovered && isLiveData ? '0 0 16px rgba(201,169,122,0.6)' : 'none',
                      }}
                      animate={{ height: `${isLiveData ? item.heightPct : item.heightPct * 0.3}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Live Status Badges */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/[0.06]">
            <div>
              <h3 className="text-white text-base font-semibold">Real-time Hub Stats</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {workingCount} Working
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {freeCount} Free
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {premiumCount} Premium
              </span>
            </div>
          </div>
        </div>

        {/* ── Card 2: Verified (1-col) ── */}
        <div
          className={cn(card, 'min-h-[300px] flex-col md:col-span-1')}
          style={{ backgroundColor: CARD_BG }}
          onMouseEnter={() => setHov(2)}
          onMouseLeave={() => setHov(null)}
        >
          <div className="relative z-10 flex flex-col gap-1.5 pb-5">
            <h3 className="text-white text-lg font-semibold">Script Executions</h3>
            <p className="text-sm max-w-[180px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Live count of scripts run through the hub.
            </p>
          </div>

          <div className="relative z-10 flex w-full flex-1 items-end pb-2">
            <div className="w-full flex flex-col gap-3">
              <div
                className="flex items-center justify-between pb-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Execution Tracking
                </span>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={hov === 2 ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400">Live</span>
                </div>
              </div>

              {([
                { name: 'Free Runs',     count: execStats.free,    delay: 0.2 },
                { name: 'Premium Runs',  count: execStats.premium, delay: 0.5 },
                { name: 'Total Runs',    count: execStats.total,   delay: 0.8 },
              ] as const).map((item) => {
                const base = execStats.total > 0 ? execStats.total : 1;
                const pct = Math.min(100, Math.round((item.count / base) * 100));
                return (
                  <div key={item.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-white">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <motion.span
                          className="font-mono text-[9px]"
                          style={{ color: ACCENT }}
                          initial={{ opacity: 0, x: -5 }}
                          animate={hov === 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -5 }}
                          transition={{ type: 'spring', delay: hov === 2 ? item.delay + 0.4 : 0 }}
                        >
                          {item.count.toLocaleString()}
                        </motion.span>
                        <div className="relative h-1 w-12 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ backgroundColor: ACCENT }}
                            initial={{ width: '0%' }}
                            animate={hov === 2 ? { width: `${pct}%` } : { width: '0%' }}
                            transition={{ duration: 0.6, delay: hov === 2 ? item.delay : 0, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(14)].map((_, j) => (
                        <motion.div
                          key={j}
                          className="h-2 flex-1 rounded-[1px]"
                          style={{ backgroundColor: ACCENT }}
                          initial={{ opacity: 0.12 }}
                          animate={hov === 2 ? { opacity: [0.12, 0.75, 0.12] } : { opacity: 0.12 }}
                          transition={{ duration: 0.4, delay: hov === 2 ? item.delay + j * 0.03 : 0, ease: 'easeOut' }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Card 3: Script Alerts (1-col) ── */}
        <div
          className={cn(card, 'min-h-[300px] flex-col justify-end md:col-span-1')}
          style={{ backgroundColor: CARD_BG }}
          onMouseEnter={() => setHov(3)}
          onMouseLeave={() => setHov(null)}
        >
          <div className="relative z-10 flex w-full flex-1 items-start justify-center overflow-visible pt-6">
            <div className="relative flex w-full flex-col items-center">
              {/* Bell icon */}
              <motion.div
                className="relative z-30 flex h-12 w-12 items-center justify-center rounded-2xl backdrop-blur-md"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                animate={hov === 3 ? { y: -10 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-white"
                  animate={hov === 3 ? { rotate: [0, -15, 15, -15, 15, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </motion.svg>
                <motion.div
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                  initial={{ scale: 0 }}
                  animate={hov === 3 ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                />
                <motion.div
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={hov === 3 ? { scale: 2.5, opacity: 0 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 1, delay: 0.3, repeat: hov === 3 ? Infinity : 0 }}
                />
              </motion.div>

              {/* Toast */}
              <div className="absolute top-6 flex w-full flex-col items-center pt-8">
                <motion.div
                  className="relative z-20 flex w-[210px] items-center gap-3 rounded-xl p-3"
                  style={{ backgroundColor: 'rgba(8,8,8,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={hov === 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(201,169,122,0.15)' }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white">Script Updated</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Anime Expedition patched</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-1.5 pt-5">
            <h3 className="text-white text-lg font-semibold">Instant Alerts</h3>
            <p className="text-sm max-w-[180px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Get notified the moment a script is patched or goes down.
            </p>
          </div>
        </div>

        {/* ── Card 4: Community (2-col) ── */}
        <div
          className={cn(card, 'relative min-h-[380px] flex-col justify-between md:col-span-2 overflow-hidden p-0')}
          style={{ backgroundColor: CARD_BG }}
          onMouseEnter={() => setHov(4)}
          onMouseLeave={() => setHov(null)}
        >
          {/* Full-card Map Canvas */}
          <div className="absolute inset-0 z-0 h-full w-full opacity-90">
            <WorldExecutionMap topCountries={execStats.topCountries} className="h-full w-full" />
          </div>

          {/* Vignette gradient overlay for crisp text readability over map */}
          <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/80" />

          {/* Header text above map */}
          <div className="relative z-10 flex flex-col items-end p-6 text-right pointer-events-none">
            <h3 className="text-white text-xl font-bold tracking-tight mb-1">Global Community</h3>
            <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join {memberCount > 0 ? `${memberCount.toLocaleString()}+` : '2,000+'} members on Discord. Active support, early drops, and community scripts.
            </p>
          </div>

          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 z-1 pointer-events-none"
            animate={hov === 4 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-24 rounded-[100%] blur-3xl" style={{ backgroundColor: 'rgba(201,169,122,0.15)' }} />
          </motion.div>

          {/* Stats bar above map */}
          <div className="relative z-10 flex items-end justify-between sm:justify-start gap-6 sm:gap-10 p-6 pt-0 pointer-events-auto">
            <div className="text-left">
              <p className="font-bold text-white leading-none mb-1" style={{ fontSize: '1.85rem', letterSpacing: '-0.04em' }}>
                {memberCount > 0 ? `${memberCount.toLocaleString()}+` : '2,000+'}
              </p>
              <p className="text-xs font-semibold text-white/70">Discord Members</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-white leading-none mb-1" style={{ fontSize: '1.85rem', letterSpacing: '-0.04em' }}>
                {execStats.countryCount > 0 ? `${execStats.countryCount}+` : '28+'}
              </p>
              <p className="text-xs font-semibold text-white/70">Countries</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-white leading-none mb-1" style={{ fontSize: '1.85rem', letterSpacing: '-0.04em' }}>
                {execStats.total > 0 ? `${execStats.total.toLocaleString()}+` : '—'}
              </p>
              <p className="text-xs font-semibold text-white/70">Executions</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
