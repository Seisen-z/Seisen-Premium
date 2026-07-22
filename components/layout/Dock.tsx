'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User, Crown } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AnimatePresence, motion } from 'framer-motion';

const YoutubeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/>
  </svg>
);

const socialLinks = [
  { href: 'https://www.youtube.com/@SeisenHub',  label: 'YouTube',  type: 'svg'   as const },
  { href: 'https://discord.gg/F4sAf6z8Ph',       label: 'Discord',  type: 'svg'   as const },
  { href: 'https://www.tiktok.com/@seisen.hub',   label: 'TikTok',   type: 'svg'   as const },
  { href: 'https://rscripts.net/@SeisenHub',      label: 'RScripts', type: 'img'   as const, src: 'https://rscripts.net/logo.svg' },
  { href: 'https://haxhell.com/user/seisenhub',   label: 'HaxHell',  type: 'img'   as const, src: 'https://haxhell.com/_next/image?url=%2Fimages%2Flogo%2Flogo.ico&w=32&q=75', white: true },
];

function SocialLink({ href, label, type, src, white }: typeof socialLinks[number]) {
  const [hov, setHov] = useState(false);
  const dim = 'rgba(255,255,255,0.25)';
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer" title={label}
      className="transition-colors"
      style={{ color: hov ? 'white' : dim }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {type === 'img' ? (
        <img
          src={src} alt={label}
          className="w-3.5 h-3.5 object-contain rounded-sm transition-all duration-150"
          style={{ filter: white ? (hov ? 'brightness(0) invert(1)' : 'brightness(0) invert(1) opacity(0.25)') : (hov ? 'brightness(1)' : 'brightness(0.35)') }}
        />
      ) : (
        <>
          {label === 'YouTube' && <YoutubeIcon />}
          {label === 'Discord' && <DiscordIcon />}
          {label === 'TikTok'  && <TikTokIcon />}
        </>
      )}
    </a>
  );
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/scripts', label: 'Scripts' },
  { href: '/obfuscator', label: 'Obfuscate' },
  { href: '/getkey', label: 'Get Key' },
  { href: '/premium', label: 'Premium' },
  { href: '/faq', label: 'FAQ' },
  { href: '/videos', label: 'Videos' },
];

const DiscordIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
  </svg>
);

export default function Dock() {
  const pathname  = usePathname();
  const [isOpen, setIsOpen]     = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('client_email');
    if (email) {
      fetch(`/api/tickets?email=${email}`)
        .then(r => r.json())
        .then(d => { if (d.success && d.tickets) setHasUnread(d.tickets.some((t: any) => t.status === 'replied')); })
        .catch(() => {});
    }
  }, [pathname]);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isClient = pathname.startsWith('/client');

  return (
    <>
      {/* ── Top Nav Bar ─────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[2000] h-14 flex items-center px-5 md:px-8 transition-all duration-300"
        style={{
          backgroundColor: 'transparent',
        }}
      >
        {/* ── Left: Logo + Brand ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Logo className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-sm text-white tracking-tight">Seisen</span>
        </Link>

        {/* ── Centre: Nav pill (desktop) ── */}
        <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
          <div
            className="flex items-center gap-0.5 p-1 rounded-full"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative px-4 py-1.5 rounded-full text-sm transition-colors duration-150"
                  style={{
                    color: active ? '#000000' : 'rgba(255,255,255,0.45)',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Right: Social + Client (desktop) ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          {/* Discord */}
          <a
            href="https://discord.gg/F4sAf6z8Ph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
            title="Discord"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <DiscordIcon />
          </a>

          {/* Divider */}
          <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Client area */}
          <Link
            href="/client/dashboard"
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={isClient
              ? { backgroundColor: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.25)' }
              : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--accent)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--accent)' }} />
              </span>
            )}
            <User className="w-3.5 h-3.5" />
            Client
          </Link>
        </div>

        {/* ── Mobile Burger ── */}
        <button
          onClick={() => setIsOpen(p => !p)}
          className="ml-auto md:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Left Social Bar (desktop) ───────────────────────── */}
      <div className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-[1500] flex-col items-center gap-4">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.25em] select-none"
          style={{ color: 'rgba(255,255,255,0.2)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Community
        </span>
        <div className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        {socialLinks.map(link => <SocialLink key={link.label} {...link} />)}
      </div>

      {/* ── Mobile Menu ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[1800] md:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            />

            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-14 left-0 right-0 z-[1900] md:hidden py-2"
              style={{ backgroundColor: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-6 py-3 text-sm transition-colors"
                    style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}
                  >
                    {active && (
                      <span className="w-1 h-1 rounded-full mr-3 shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                    )}
                    {!active && <span className="w-1 h-1 mr-3 shrink-0" />}
                    {label}
                  </Link>
                );
              })}

              <div className="mx-6 my-2" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.04)' }} />

              <a
                href="https://discord.gg/F4sAf6z8Ph"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <DiscordIcon /> Discord
              </a>

              <Link
                href="/client/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-6 py-3 text-sm"
                style={{ color: isClient ? 'var(--accent)' : 'rgba(255,255,255,0.5)' }}
              >
                <User className="w-4 h-4" />
                Client Area
                {hasUnread && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </Link>

              <div className="px-4 pb-4 pt-1">
                <Link
                  href="/premium"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                >
                  <Crown className="w-4 h-4" /> Go Premium
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
