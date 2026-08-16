import Link from 'next/link';
import { Crown, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchScripts } from '@/lib/scripts';
import { fetchVideos } from '@/lib/videos';
import YoutubeCarousel from '@/components/YoutubeCarousel';
import Testimonials from '@/components/sections/Testimonials';
import PartnerLogos from '@/components/sections/PartnerLogos';
import ScriptShowcase from '@/components/ScriptShowcase';
import ScriptShowcaseCarousel from '@/components/ScriptShowcaseCarousel';
import HomeFAQ from '@/components/sections/HomeFAQ';
import HomeTourSection from '@/components/sections/HomeTourSection';
import HomeBento from '@/components/sections/HomeBento';
import Reveal from '@/components/ui/Reveal';

// ── Brand tokens (cream/warm — homepage only) ──────────────────
const C = {
  accent:     '#c9a97a',
  accentSoft: '#d4b896',
  accentDim:  '#9a7d58',
  accentBg:   'rgba(201,169,122,0.1)',
  accentBdr:  'rgba(201,169,122,0.22)',
  accentBdr2: 'rgba(201,169,122,0.35)',
  creamBg:    '#e8ddd0',
  creamBg2:   '#ddd0c4',
} as const;

interface DiscordMember { id: string; username: string; avatar_url: string; }
interface DiscordStats  { memberCount: number; members: DiscordMember[]; }

const DISCORD_GUILD_ID = '1333251917098520628';

async function fetchDiscordStats(): Promise<DiscordStats> {
  try {
    const [inviteRes, widgetRes] = await Promise.all([
      fetch('https://discord.com/api/v10/invites/F4sAf6z8Ph?with_counts=true', { next: { revalidate: 300 } }),
      fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`,   { next: { revalidate: 300 } }),
    ]);
    const memberCount = inviteRes.ok ? ((await inviteRes.json()).approximate_member_count ?? 0) : 0;
    const members: DiscordMember[] = widgetRes.ok
      ? ((await widgetRes.json()).members ?? []).slice(0, 5).map((m: any) => ({ id: m.id, username: m.username, avatar_url: m.avatar_url }))
      : [];
    return { memberCount, members };
  } catch { return { memberCount: 0, members: [] }; }
}

async function fetchExecutionStats() {
  try {
    const { supabase } = await import('@/lib/server/db');
    const [freeResult, premiumResult] = await Promise.all([
      supabase.from('script_execution_log').select('*', { count: 'exact', head: true }).eq('script_type', 'free'),
      supabase.from('script_execution_log').select('*', { count: 'exact', head: true }).eq('script_type', 'premium'),
    ]);
    const free = freeResult.count ?? 0;
    const premium = premiumResult.count ?? 0;
    return { free, premium, total: free + premium };
  } catch {
    return { free: 0, premium: 0, total: 0 };
  }
}

export default async function HomePage() {
  const scripts = await fetchScripts();
  const videos  = await fetchVideos();
  const discord = await fetchDiscordStats();
  const executions = await fetchExecutionStats();

  const freeCount    = scripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length;
  const premiumCount = scripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length;
  const workingCount = scripts.filter(s => s.status === 'Working').length;

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════════════
          HERO  —  dark left │ cream right split
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        {/* ── Split background ── */}
        <div className="absolute inset-0 pointer-events-none flex">
          {/* Dark left */}
          <div className="flex-1 h-full" style={{ backgroundColor: '#080808' }} />
          {/* Cream right (desktop only) */}
          <div
            className="hidden md:block h-full"
            style={{
              width: '44%',
              backgroundColor: C.creamBg,
              backgroundImage: [
                'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(201,169,122,0.18) 0%, transparent 65%)',
                `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 22px,
                  rgba(0,0,0,0.028) 22px,
                  rgba(0,0,0,0.028) 23px
                )`,
              ].join(','),
            }}
          />
        </div>

        {/* Dark-left accent glow */}
        <div
          className="absolute pointer-events-none hidden md:block"
          style={{
            top: '0', left: '0', width: '56%', height: '100%',
            background: 'radial-gradient(ellipse 70% 60% at 20% 40%, rgba(201,169,122,0.07) 0%, transparent 65%)',
          }}
        />

        {/* Vertical divider line (desktop) */}
        <div
          className="absolute hidden md:block pointer-events-none"
          style={{
            top: 0, bottom: 0,
            left: '56%',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.15) 80%, transparent)',
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex items-center min-h-[calc(100vh-56px)] px-6 md:pl-24 md:pr-0 lg:pl-28">
          <div className="w-full grid md:grid-cols-[56fr_44fr] items-center">

            {/* Left — copy (dark bg) */}
            <div className="py-20 pr-10 lg:pr-16">
              {/* Status pill */}
              <a
                href="https://discord.gg/F4sAf6z8Ph"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 mb-8 px-3.5 py-1.5 rounded-full transition-all hover:brightness-110 animate-fade-in"
                style={{ backgroundColor: C.accentBg, border: `1px solid ${C.accentBdr}` }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.accentSoft }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: C.accent }} />
                </span>
                <span className="text-xs font-medium" style={{ color: C.accent }}>All systems operational</span>
              </a>

              {/* Headline */}
              <h1
                className="font-bold text-white leading-[1.04] mb-6 animate-fade-in"
                style={{
                  fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                  letterSpacing: '-0.04em',
                  animationDelay: '0.05s',
                  animationFillMode: 'backwards',
                }}
              >
                The Script Hub<br />
                <span
                  style={{
                    background: `linear-gradient(120deg, ${C.accent} 0%, ${C.accentSoft} 60%, #e8d5b5 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Roblox Players
                </span><br />
                Actually Trust.
              </h1>

              <p
                className="text-lg max-w-[420px] mb-9 animate-fade-in"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.7,
                  animationDelay: '0.1s',
                  animationFillMode: 'backwards',
                }}
              >
                Premium-grade scripts, verified by the Seisen team.{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Free access included — no sign-up, no wait.</span>
              </p>

              {/* CTAs */}
              <div
                className="flex flex-wrap items-center gap-3 mb-10 animate-fade-in"
                style={{ animationDelay: '0.14s', animationFillMode: 'backwards' }}
              >
                <Link href="/scripts">
                  <button
                    className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] select-none text-sm px-6 py-2.5"
                    style={{ backgroundColor: C.accent, color: '#1a1008', border: `1px solid ${C.accent}` }}
                  >
                    Browse Scripts <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/premium">
                  <button
                    className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] select-none text-sm px-5 py-2.5"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'rgba(255,255,255,0.65)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <Crown className="w-4 h-4" /> Go Premium
                  </button>
                </Link>
              </div>

              {/* Social proof */}
              <div
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: '0.18s', animationFillMode: 'backwards' }}
              >
                <div className="flex -space-x-2.5">
                  {(discord.members.length > 0 ? discord.members : []).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar_url}
                      alt={m.username}
                      className="w-8 h-8 rounded-full border-2 object-cover"
                      style={{ borderColor: '#080808' }}
                    />
                  ))}
                  {discord.members.length === 0 && ['#9a7d58','#6b5a42','#b89a74','#7c6248','#a08060'].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ background: c, borderColor: '#080808', color: '#fff' }}
                    >
                      {['S','R','A','J','K'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {discord.memberCount > 0 ? `${discord.memberCount.toLocaleString()}+ members` : '2,000+ active users'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>active on Discord</p>
                </div>
              </div>
            </div>

            {/* Right — product card (cream bg) */}
            <div
              className="relative flex items-center justify-center py-16 px-8 md:px-10 lg:px-14"
              style={{ minHeight: 'calc(100vh - 56px)' }}
            >
              {/* Warm glow behind card */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: '10%',
                  background: `radial-gradient(ellipse, rgba(201,169,122,0.3) 0%, transparent 70%)`,
                  filter: 'blur(32px)',
                }}
              />

              {/* Floating badge — top */}
              <div
                className="absolute top-[18%] right-8 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md"
                style={{
                  backgroundColor: '#1c1c1c',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {workingCount} scripts working
              </div>

              {/* Code card */}
              <div
                className="relative w-full max-w-sm animate-fade-in"
                style={{
                  animationDelay: '0.12s',
                  animationFillMode: 'backwards',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {/* Chrome bar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-3.5"
                  style={{
                    backgroundColor: '#161616',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.55)' }} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(234,179,8,0.55)' }} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.55)' }} />
                  <span className="ml-auto font-mono text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>seisen_loader.lua</span>
                </div>

                {/* Code body */}
                <div
                  className="p-6 font-mono text-sm leading-7"
                  style={{ backgroundColor: '#0e0e0e' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.22)' }}>{`-- Seisen Script Hub v2`}</p>
                  <p style={{ color: 'rgba(255,255,255,0.22)' }}>{`-- Free & Premium access`}</p>
                  <p>&nbsp;</p>
                  <p>
                    <span style={{ color: '#c678dd' }}>loadstring</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>(</span>
                  </p>
                  <p className="pl-5">
                    <span style={{ color: '#56b6c2' }}>game</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>:</span>
                    <span style={{ color: '#61afef' }}>HttpGet</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>(</span>
                  </p>
                  <p className="pl-10">
                    <span style={{ color: '#e8d5b5' }}>&quot;https://seisen.vercel.app/api/load&quot;</span>
                  </p>
                  <p className="pl-5"><span style={{ color: 'rgba(255,255,255,0.4)' }}>)</span></p>
                  <p className="mb-4"><span style={{ color: 'rgba(255,255,255,0.4)' }}>)()</span></p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
                      Loaded — <span style={{ color: C.accentSoft }}>{premiumCount} premium scripts</span> unlocked
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{
                    backgroundColor: '#111111',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-white">{scripts.length} scripts</span>
                    <span className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{freeCount} free</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: C.accent }}>{premiumCount} premium</span>
                </div>
              </div>

              {/* Floating badge — bottom */}
              <div
                className="absolute bottom-[18%] left-8 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs shadow-md"
                style={{
                  backgroundColor: '#1c1c1c',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Users className="w-3.5 h-3.5" style={{ color: C.accent }} />
                <span className="font-bold text-white">500K+</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>executions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          METRICS BAND
      ══════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-14 max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { val: String(scripts.length), label: 'Total Scripts',   sub: 'in the hub' },
              { val: String(freeCount),      label: 'Free Scripts',    sub: 'zero sign-up' },
              { val: String(premiumCount),   label: 'Premium Scripts', sub: 'exclusive access', warm: true },
              { val: String(workingCount),   label: 'Working Now',     sub: 'verified today',   em: true },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="font-bold leading-none mb-2"
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                    letterSpacing: '-0.04em',
                    color: s.em ? '#6ee7b7' : s.warm ? C.accent : 'white',
                  }}
                >
                  {s.val}
                </p>
                <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SCRIPT SHOWCASE  —  left copy │ right featured
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <section id="scripts" className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-28 max-w-screen-xl mx-auto">
          <div className="grid md:grid-cols-[45fr_55fr] gap-12 xl:gap-20 items-start">

            {/* Left — copy + stats */}
            <div className="md:sticky md:top-24">
              <p className="section-label mb-3" style={{ color: C.accent, opacity: 1 }}>Script Hub</p>
              <h2
                className="font-bold text-white mb-5"
                style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
              >
                {scripts.length} scripts.<br />One hub.
              </h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Free and premium Roblox scripts, all verified and updated by the Seisen team. Copy the loader in one click — no installs, no sign-up.
              </p>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { val: freeCount,    label: 'Free Scripts',    sub: 'no key needed' },
                  { val: premiumCount, label: 'Premium',         sub: 'exclusive access', warm: true },
                  { val: workingCount, label: 'Working Now',     sub: 'verified today' },
                  { val: scripts.length, label: 'Total Scripts', sub: 'in the hub' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p
                      className="font-bold text-2xl leading-none mb-1"
                      style={{ letterSpacing: '-0.03em', color: s.warm ? C.accent : 'white' }}
                    >
                      {s.val}
                    </p>
                    <p className="text-xs font-semibold text-white mb-0.5">{s.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/scripts">
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] text-sm px-6 py-2.5"
                    style={{ backgroundColor: C.accent, color: '#1a1008' }}
                  >
                    Open Script Hub <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/getkey">
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] text-sm px-6 py-2.5"
                    style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Get Free Key
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — script showcase carousel */}
            <div className="flex flex-col gap-4">
              {(() => {
                const featured = scripts.find(s =>
                  s.name.toLowerCase().includes('anime expedition')
                ) ?? scripts[0];
                const rest = scripts
                  .filter(s => s.id !== featured?.id)
                  .slice(0, 8);
                const all = featured ? [featured, ...rest] : rest;
                return (
                  <ScriptShowcaseCarousel
                    scripts={all}
                    initialActiveId={featured?.id}
                  />
                );
              })()}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          WHY SEISEN — BENTO
      ══════════════════════════════════════════════════════════ */}
      <Reveal>

        <HomeBento
          scriptCount={scripts.length}
          freeCount={freeCount}
          premiumCount={premiumCount}
          workingCount={workingCount}
          memberCount={discord.memberCount}
          freeExecutions={executions.free}
          premiumExecutions={executions.premium}
          totalExecutions={executions.total}
          scripts={scripts.map(s => ({ name: s.name, universeId: s.universeId, type: s.type.toLowerCase() }))}
        />
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          PLATFORM TOUR
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <HomeTourSection />
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          VIDEOS
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="py-24">
          <div className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 max-w-screen-xl mx-auto mb-10 flex items-end justify-between">
            <div>
              <p className="section-label mb-2" style={{ color: C.accent, opacity: 1 }}>Media</p>
              <h2 className="font-bold text-white text-2xl" style={{ letterSpacing: '-0.02em' }}>Scripts in Action</h2>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Watch before you use — see exactly what each script does.</p>
            </div>
            <a
              href="https://www.youtube.com/@SeisenHub"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              YouTube <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <YoutubeCarousel videos={videos} />
        </section>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <div className="py-8">
          <PartnerLogos />
          <Testimonials />
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          PREMIUM CTA
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-24 max-w-screen-xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden px-10 md:px-20 py-20 text-center"
            style={{
              background: `linear-gradient(160deg, rgba(201,169,122,0.13) 0%, rgba(201,169,122,0.03) 50%, rgba(201,169,122,0.09) 100%)`,
              border: `1px solid rgba(201,169,122,0.2)`,
            }}
          >
            {/* Diagonal stripe texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 24px,
                  rgba(201,169,122,0.025) 24px,
                  rgba(201,169,122,0.025) 25px
                )`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,169,122,0.1) 0%, transparent 70%)`,
              }}
            />

            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(201,169,122,0.12)', color: C.accent, border: `1px solid rgba(201,169,122,0.28)` }}
              >
                <Crown className="w-3.5 h-3.5" /> Premium Access
              </div>

              <h2
                className="font-bold text-white mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: '-0.035em' }}
              >
                Ready to unlock everything?
              </h2>
              <p className="text-base mb-10 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Instant access to all {premiumCount} premium scripts, priority support, and exclusive features — with the Mega Key or a subscription.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                <Link href="/premium">
                  <button
                    className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] select-none text-sm px-7 py-2.5"
                    style={{ backgroundColor: C.accent, color: '#1a1008', border: `1px solid ${C.accent}` }}
                  >
                    <Crown className="w-4 h-4" /> Go Premium
                  </button>
                </Link>
                <Link href="/scripts">
                  <button
                    className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] select-none text-sm px-6 py-2.5"
                    style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    Browse Free Scripts
                  </button>
                </Link>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-6">
                {['Instant delivery', `${premiumCount} premium scripts`, 'Priority support', 'No lock-in'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.accent }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <Reveal>
        <HomeFAQ />
      </Reveal>

    </div>
  );
}
