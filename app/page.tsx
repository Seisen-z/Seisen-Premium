import Link from 'next/link';
import Image from 'next/image';
import heroStyles from './home-hero.module.css';
import { Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
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
      ? ((await widgetRes.json()).members ?? []).slice(0, 5).map((m: DiscordMember) => ({ id: m.id, username: m.username, avatar_url: m.avatar_url }))
      : [];
    return { memberCount, members };
  } catch { return { memberCount: 0, members: [] }; }
}

async function fetchRecentlyUpdatedGameNames(): Promise<string[]> {
  try {
    const { supabase } = await import('@/lib/server/db');
    const { data } = await supabase
      .from('site_updates')
      .select('game_name')
      .not('game_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);
    // Deduplicate while preserving most-recent-first order
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const row of data ?? []) {
      if (row.game_name && !seen.has(row.game_name)) {
        seen.add(row.game_name);
        ordered.push(row.game_name);
      }
    }
    return ordered;
  } catch {
    return [];
  }
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
  const [scripts, videos, discord, executions, recentGameNames] = await Promise.all([
    fetchScripts(),
    fetchVideos(),
    fetchDiscordStats(),
    fetchExecutionStats(),
    fetchRecentlyUpdatedGameNames(),
  ]);

  const freeCount    = scripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length;
  const premiumCount = scripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length;
  const workingCount = scripts.filter(s => s.status === 'Working').length;

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════════════
          HERO  —  dark left │ cream right split
      ══════════════════════════════════════════════════════════ */}
      <section className={heroStyles.hero} aria-label="Seisen Script Hub" data-testid="homepage-hero">
        <div className={heroStyles.art}>
          <Image
            src="/script-hub-hero.png"
            alt="A panoramic Roblox-style adventure combining Seisen Hub game heroes, pets, gardens, mines and floating worlds"
            fill
            sizes="100vw"
            priority
            className={heroStyles.image}
          />
          <div className={heroStyles.badge}>
            <span aria-hidden="true" />{workingCount} scripts working
          </div>
        </div>
        <div className={heroStyles.shade} aria-hidden="true" />
        <div className={heroStyles.content}>
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

            {/* Right — script showcase carousel, prioritised by recent updates */}
            <div className="flex flex-col gap-4">
              {(() => {
                // Sort working scripts: recently-updated games first, rest after
                const working = scripts.filter(s => s.status === 'Working');
                const getRank = (scriptName: string) => {
                  const sn = scriptName.toLowerCase();
                  for (let i = 0; i < recentGameNames.length; i++) {
                    const gn = recentGameNames[i].toLowerCase();
                    if (sn === gn || sn.includes(gn) || gn.includes(sn)) return i;
                  }
                  return Infinity;
                };
                const sorted = [...working].sort((a, b) => getRank(a.name) - getRank(b.name));
                const featured = sorted[0];
                const rest = sorted.slice(1, 9);
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
                Instant access to all {premiumCount} premium scripts, priority support, and exclusive features — with a monthly or lifetime plan.
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
