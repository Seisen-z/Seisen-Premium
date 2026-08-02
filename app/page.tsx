import Link from 'next/link';
import { Crown, ArrowRight, Play } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchScripts } from '@/lib/scripts';
import { fetchVideos } from '@/lib/videos';
import YoutubeCarousel from '@/components/YoutubeCarousel';
import Testimonials from '@/components/sections/Testimonials';
import PartnerLogos from '@/components/sections/PartnerLogos';
import ScriptShowcase from '@/components/ScriptShowcase';
import HomeFAQ from '@/components/sections/HomeFAQ';
import Reveal from '@/components/ui/Reveal';

interface DiscordMember { id: string; username: string; avatar_url: string; }
interface DiscordStats { memberCount: number; members: DiscordMember[]; }

const DISCORD_GUILD_ID = '1333251917098520628';

async function fetchDiscordStats(): Promise<DiscordStats> {
  try {
    const [inviteRes, widgetRes] = await Promise.all([
      fetch('https://discord.com/api/v10/invites/F4sAf6z8Ph?with_counts=true', { next: { revalidate: 300 } }),
      fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`, { next: { revalidate: 300 } }),
    ]);
    const memberCount: number = inviteRes.ok ? ((await inviteRes.json()).approximate_member_count ?? 0) : 0;
    const members: DiscordMember[] = widgetRes.ok
      ? ((await widgetRes.json()).members ?? []).slice(0, 5).map((m: any) => ({ id: m.id, username: m.username, avatar_url: m.avatar_url }))
      : [];
    return { memberCount, members };
  } catch {
    return { memberCount: 0, members: [] };
  }
}

export default async function HomePage() {
  const scripts = await fetchScripts();
  const videos  = await fetchVideos();
  const discord = await fetchDiscordStats();

  const freeCount    = scripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length;
  const premiumCount = scripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length;
  const workingCount = scripts.filter(s => s.status === 'Working').length;
  const heroScripts  = scripts.filter(s => s.status === 'Working').slice(0, 4);

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-14 pt-20 pb-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[55fr_45fr] gap-12 lg:gap-20 items-start">

          {/* Left: headline + CTAs + stats */}
          <div>
            <a
              href="https://discord.gg/F4sAf6z8Ph"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mb-10 px-3 py-1.5 rounded-full transition-all hover:brightness-110 animate-fade-in"
              style={{ backgroundColor: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>All systems operational</span>
            </a>

            <h1
              className="font-bold text-white leading-none mb-6 animate-fade-in"
              style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', letterSpacing: '-0.04em', animationDelay: '0.05s', animationFillMode: 'backwards' }}
            >
              The Roblox<br />script hub.
            </h1>

            <p
              className="text-base md:text-lg max-w-md leading-relaxed animate-fade-in"
              style={{ color: 'var(--text-secondary)', animationDelay: '0.1s', animationFillMode: 'backwards' }}
            >
              Free access, no account needed. Premium skips the key system and unlocks everything.
            </p>

            <div
              className="flex flex-wrap items-center gap-3 mt-8 mb-12 animate-fade-in"
              style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
            >
              <Link href="/scripts"><Button size="lg"><Play className="w-4 h-4" /> Browse Scripts</Button></Link>
              <Link href="/premium"><Button variant="outline" size="lg"><Crown className="w-4 h-4" /> Go Premium</Button></Link>
            </div>

            {/* Stats — horizontal strip, no card backgrounds */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 animate-fade-in"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', animationDelay: '0.2s', animationFillMode: 'backwards' }}
            >
              {[
                { val: scripts.length, label: 'Total Scripts' },
                { val: freeCount,      label: 'Free' },
                { val: premiumCount,   label: 'Premium' },
                { val: workingCount,   label: 'Working' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="py-5"
                  style={{
                    paddingRight: '1rem',
                    paddingLeft: i > 0 ? '1rem' : '0',
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <p
                    className="font-bold text-white leading-none"
                    style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', letterSpacing: '-0.02em' }}
                  >
                    {stat.val}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: terminal + script preview cards */}
          <div
            className="hidden md:block animate-fade-in"
            style={{ animationDelay: '0.08s', animationFillMode: 'backwards' }}
          >
            {/* Terminal */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.015)' }}>
              {/* Title bar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.5)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(234,179,8,0.5)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(74,222,128,0.5)' }} />
                </div>
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>loader.lua</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: 'var(--accent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Live
                </span>
              </div>

              {/* Lua code */}
              <div className="px-5 py-4 font-mono text-xs leading-relaxed">
                <p style={{ color: 'rgba(255,255,255,0.2)' }}>-- Seisen Script Hub</p>
                <p className="mt-3">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>loadstring</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>(</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>game</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>:</span>
                  <span style={{ color: 'var(--accent)' }}>HttpGet</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>(</span>
                </p>
                <p className="pl-4" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  "https://api.seisen…"
                </p>
                <p>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>))()</span>
                </p>
              </div>

              {/* Output */}
              <div
                className="px-5 py-3 space-y-1.5 font-mono text-[11px]"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.25)' }}
              >
                <p style={{ color: 'rgba(255,255,255,0.25)' }}>Output</p>
                <p>
                  <span style={{ color: 'var(--accent)' }}>✓ </span>
                  <span className="text-white">Seisen loaded</span>
                </p>
                <p>
                  <span style={{ color: 'var(--accent)' }}>✓ </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{scripts.length} scripts available</span>
                </p>
                <p>
                  <span style={{ color: 'var(--accent)' }}>✓ </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>All systems operational</span>
                </p>
              </div>
            </div>

            {/* Script preview cards — 2×2 */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {heroScripts.map(script => (
                <div
                  key={script.id}
                  className="px-3.5 py-3 rounded-lg"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.01)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-white leading-tight truncate">{script.name}</p>
                    <span
                      className="font-mono text-[9px] shrink-0 mt-0.5"
                      style={{ color: script.type === 'Premium' ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}
                    >
                      {script.displayType ?? script.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Working</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-14">
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── SCRIPT SHOWCASE ───────────────────────────────────── */}
      <section id="scripts" className="px-6 md:px-14 py-24 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="section-label mb-3">Script Hub</p>
              <h2
                className="font-bold text-white leading-none"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em' }}
              >
                {scripts.length} scripts.
                <span
                  className="block"
                  style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.55em', letterSpacing: '-0.01em', marginTop: '0.3em' }}
                >
                  Free and premium, all in one place.
                </span>
              </h2>
            </div>
            <Link
              href="/scripts"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white shrink-0 mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <ScriptShowcase scripts={scripts} />
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-8 md:hidden">
            <Link href="/scripts">
              <Button variant="outline">View All in Script Hub</Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── BUILT DIFFERENT ───────────────────────────────────── */}
      <section
        className="px-6 md:px-14 py-20 max-w-6xl mx-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Reveal><p className="section-label mb-10">Built different</p></Reveal>
        <div
          className="grid md:grid-cols-3 gap-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', overflow: 'hidden' }}
        >
          {[
            { title: 'Verified & Tested', body: 'Every script is verified by the Seisen team before release. No untested, broken, or dangerous code.' },
            { title: 'Regular Updates', body: "Scripts get patched and updated as Roblox games change. We keep them working so you don't have to." },
            { title: 'Instant Access', body: 'Free key delivered in seconds. Premium removes the key system entirely — copy, paste, and play.' },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="p-8 h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="font-semibold text-white text-sm mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── VIDEOS ────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="px-6 md:px-14 max-w-6xl mx-auto mb-10 flex items-end justify-between">
          <Reveal>
            <div>
              <p className="section-label mb-2">Media</p>
              <h2 className="font-bold text-white text-2xl" style={{ letterSpacing: '-0.02em' }}>Scripts in Action</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Watch before you use — see exactly what each script does.</p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <a
              href="https://www.youtube.com/@SeisenHub"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              YouTube <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <YoutubeCarousel videos={videos} />
        </Reveal>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
      <div className="py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal><PartnerLogos /></Reveal>
        <Reveal delay={0.08}><Testimonials /></Reveal>
      </div>

      {/* ── PREMIUM CTA ───────────────────────────────────────── */}
      <section
        className="px-6 md:px-14 py-20 max-w-6xl mx-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Reveal>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
            <div>
              <p className="section-label mb-4">Premium</p>
              <h2
                className="font-bold text-white leading-none"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em' }}
              >
                Skip the key system.
                <br />
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Get everything.</span>
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <Link href="/premium">
                <Button size="lg">
                  <Crown className="w-4 h-4" /> View Plans
                </Button>
              </Link>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Starting at €3/week · Lifetime available
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── COMMUNITY STATS ───────────────────────────────────── */}
      <section
        className="px-6 md:px-14 py-16 max-w-6xl mx-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Reveal>
            <div className="p-8 rounded-2xl h-full" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Community</p>
              <h3 className="font-bold text-white text-2xl leading-tight mb-3">Join the fastest growing Roblox script hub.</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Thousands of players using Seisen every day across every major game.</p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {discord.members.length > 0
                    ? discord.members.map((m) => (
                        <img
                          key={m.id}
                          src={m.avatar_url}
                          alt={m.username}
                          title={m.username}
                          className="w-8 h-8 rounded-full border-2 border-[#080808] object-cover"
                        />
                      ))
                    : ['#10b981','#6366f1','#f59e0b','#ec4899','#3b82f6'].map((c, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080808] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                          {['S','R','A','J','K'][i]}
                        </div>
                      ))
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {discord.memberCount > 0 ? `${discord.memberCount.toLocaleString()}+ members` : '2,000+ active users'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Discord server</p>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="p-8 rounded-2xl h-full" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Reach</p>
              <p className="font-bold text-white leading-none mb-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-0.03em' }}>500K+</p>
              <p className="text-base font-semibold text-white mb-3">Scripts executed</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Trusted loadstrings running across Roblox every single day — free and premium.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <Reveal>
        <HomeFAQ />
      </Reveal>

    </div>
  );
}
