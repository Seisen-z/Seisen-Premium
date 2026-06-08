import Link from 'next/link';
import { Crown, Key, ArrowRight, Play, Zap, Shield, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchScripts } from '@/lib/scripts';
import { fetchVideos } from '@/lib/videos';
import YoutubeCarousel from '@/components/YoutubeCarousel';
import Testimonials from '@/components/sections/Testimonials';
import PartnerLogos from '@/components/sections/PartnerLogos';
import ScriptShowcase from '@/components/ScriptShowcase';
import HomeFAQ from '@/components/sections/HomeFAQ';

async function fetchDiscordMemberCount(): Promise<number> {
  try {
    const res = await fetch('https://discord.com/api/v10/invites/F4sAf6z8Ph?with_counts=true', {
      next: { revalidate: 300 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.approximate_member_count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const scripts = await fetchScripts();
  const videos  = await fetchVideos();
  const discordMembers = await fetchDiscordMemberCount();

  const freeCount    = scripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length;
  const premiumCount = scripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length;
  const workingCount = scripts.filter(s => s.status === 'Working').length;

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 md:px-14 pt-20 pb-28 max-w-6xl mx-auto">
        {/* Radial glow behind headline */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%', left: '-5%',
            width: '70%', height: '80%',
            background: 'radial-gradient(ellipse, rgba(var(--accent-rgb), 0.07) 0%, transparent 65%)',
          }}
        />

        {/* Status */}
        <a
          href="https://discord.gg/F4sAf6z8Ph"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 mb-10 px-3 py-1.5 rounded-full transition-all hover:brightness-110"
          style={{ backgroundColor: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>All systems operational</span>
        </a>

        {/* Headline */}
        <h1
          className="font-bold text-white leading-none mb-5"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)', letterSpacing: '-0.04em' }}
        >
          Seisen
        </h1>

        {/* Tagline */}
        <p className="text-base md:text-lg max-w-xl mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Premium Roblox scripts for enhanced gaming.
        </p>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          Free access available — no sign-up required.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3 mb-16">
          <Link href="/scripts"><Button size="lg"><Play className="w-4 h-4" /> Browse Scripts</Button></Link>
          <Link href="#scripts"><Button variant="outline" size="lg">All Scripts →</Button></Link>
          <Link href="/premium"><Button variant="ghost" size="lg"><Crown className="w-4 h-4" /> Premium</Button></Link>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3">
          {[
            { val: scripts.length, label: 'Total Scripts' },
            { val: freeCount,      label: 'Free Scripts',    accent: false },
            { val: premiumCount,   label: 'Premium',         accent: true },
            { val: workingCount,   label: 'Working Now',     green: true },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span
                className="font-bold text-lg leading-none"
                style={{ color: stat.green ? '#22c55e' : stat.accent ? 'var(--accent)' : 'white' }}
              >
                {stat.val}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────── */}
      <div
        className="py-4 overflow-hidden relative"
      >
        <div className="flex animate-marquee gap-0 whitespace-nowrap">
          {Array(4).fill(['Premium Scripts', 'Free Access', 'Roblox', 'Updated Daily', 'Verified', 'Trusted', 'Script Hub', 'No Sign-up']).flat().map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-6 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {item}
              <span style={{ color: 'var(--accent)', opacity: 0.5 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── SCRIPT SHOWCASE ───────────────────────────────────── */}
      <section id="scripts" className="px-6 md:px-14 py-24 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="section-label mb-2">Script Hub</p>
            <h2 className="font-bold text-white" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}>
              All Scripts
            </h2>
          </div>
          <Link
            href="/scripts"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
            style={{ color: 'var(--text-muted)' }}
          >
            Open Script Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          Click any script to copy the loader — or visit the full hub for details and features.
        </p>

        <ScriptShowcase scripts={scripts} />

        <div className="mt-8 text-center md:hidden">
          <Link href="/scripts">
            <Button variant="outline">View All in Script Hub</Button>
          </Link>
        </div>
      </section>

      {/* ── WHY SEISEN ────────────────────────────────────────── */}
      <section className="px-6 md:px-14 py-24 max-w-6xl mx-auto">
        <p className="section-label mb-12">Why Seisen</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Shield className="w-5 h-5" />,
              title: 'Verified & Tested',
              body: 'Every script is verified by the Seisen team before release. No untested, broken, or dangerous code.',
            },
            {
              icon: <RefreshCw className="w-5 h-5" />,
              title: 'Regular Updates',
              body: 'Scripts get patched and updated as Roblox games change. We keep them working so you don\'t have to.',
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: 'Instant Access',
              body: 'Free key delivered instantly. Premium unlocks everything with no waiting — just copy, paste, and play.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl group hover-lift"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)' }}
              >
                {item.icon}
              </div>
              <h3 className="font-semibold text-white text-base mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VIDEOS ────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="px-6 md:px-14 max-w-6xl mx-auto mb-10 flex items-end justify-between">
          <div>
            <p className="section-label mb-2">Media</p>
            <h2 className="font-bold text-white text-2xl" style={{ letterSpacing: '-0.02em' }}>Scripts in Action</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Watch before you use — see exactly what each script does.</p>
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

      {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
      <div className="py-8">
        <PartnerLogos />
        <Testimonials />
      </div>

      {/* ── COMMUNITY STATS ───────────────────────────────────── */}
      <section className="px-6 md:px-14 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-8 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Community</p>
            <h3 className="font-bold text-white text-2xl leading-tight mb-3">Join the fastest growing Roblox script hub.</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Thousands of players using Seisen every day across every major game.</p>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#10b981','#6366f1','#f59e0b','#ec4899','#3b82f6'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080808] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                    {['S','R','A','J','K'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {discordMembers > 0 ? `${discordMembers.toLocaleString()}+ members` : '2,000+ active users'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Discord server</p>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Reach</p>
            <p className="font-bold text-white leading-none mb-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-0.03em' }}>500K+</p>
            <p className="text-base font-semibold text-white mb-3">Scripts executed</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Trusted loadstrings running across Roblox every single day — free and premium.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <HomeFAQ />

      {/* ── PLANS ─────────────────────────────────────────────── */}
      <section id="access-options" className="px-6 md:px-14 py-24 max-w-6xl mx-auto">
        <p className="section-label mb-4">Access</p>
        <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}>
          Choose your plan
        </h2>
        <p className="text-sm mb-14" style={{ color: 'var(--text-muted)' }}>
          Start free, upgrade when you're ready.
        </p>

        <div className="space-y-3">
          {/* Free */}
          <div
            className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10 p-6 rounded-2xl group transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="md:w-28 shrink-0">
              <span className="section-label">Tier 01</span>
              <h3 className="font-bold text-white text-xl mt-1">Free</h3>
            </div>
            <p className="text-sm leading-relaxed flex-1 md:max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Access our free script library with a time-based key. Renewed in minutes.
            </p>
            <div className="md:ml-auto shrink-0">
              <Link href="/getkey">
                <Button variant="outline" size="lg">
                  <Key className="w-4 h-4" /> Get Free Key
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium */}
          <div
            className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10 p-6 rounded-2xl relative overflow-hidden group transition-all duration-200"
            style={{
              backgroundColor: 'rgba(var(--accent-rgb), 0.06)',
              border: '1px solid rgba(var(--accent-rgb), 0.25)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(var(--accent-rgb),0.08) 0%, transparent 70%)' }}
            />
            <div className="md:w-28 shrink-0 relative">
              <span className="section-label">Tier 02</span>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="font-bold text-white text-xl">Premium</h3>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                >
                  Best
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed flex-1 md:max-w-sm relative" style={{ color: 'var(--text-secondary)' }}>
              Full access to every script — free and premium — with no key system, no limits. Weekly, monthly, or lifetime.
            </p>
            <div className="md:ml-auto shrink-0 relative">
              <Link href="/premium">
                <Button size="lg">
                  <Crown className="w-4 h-4" /> Upgrade Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Community */}
          <div
            className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10 p-6 rounded-2xl group transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="md:w-28 shrink-0">
              <span className="section-label">Tier 03</span>
              <h3 className="font-bold text-white text-xl mt-1">Community</h3>
            </div>
            <p className="text-sm leading-relaxed flex-1 md:max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Join the Discord for script updates, help, and community support.
            </p>
            <div className="md:ml-auto shrink-0">
              <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg">Join Discord</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
