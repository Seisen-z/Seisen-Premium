'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { useEffect, useState } from 'react';

const productLinks = [
  { href: '/obfuscator', label: 'Lua Obfuscator' },
  { href: '/scripts', label: 'Script Hub' },
  { href: '/videos', label: 'Tutorials' },
  { href: '/premium', label: 'Premium Access' },
  { href: '/getkey', label: 'Get Key' },
];

const communityLinks = [
  { href: 'https://discord.gg/F4sAf6z8Ph', label: 'Discord ↗', external: true },
  { href: 'https://www.youtube.com/@SeisenHub', label: 'YouTube ↗', external: true },
];

const legalLinks = [
  { href: '/legal#terms', label: 'Terms of Service' },
  { href: '/legal#privacy', label: 'Privacy Policy' },
  { href: '/legal#license', label: 'License (AGPL v3.0)' },
];

export default function Footer() {
  const [stats, setStats] = useState({ totalVisits: 0 });

  useEffect(() => {
    fetch('/api/visitor-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  return (
    <footer style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Logo className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="font-mono font-bold text-xs uppercase tracking-widest text-white">Seisen</span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Premium Roblox scripts and tools for enhanced gaming experiences.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Products
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors hover-accent"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Community
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs transition-colors hover-accent"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors hover-accent"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            © 2026 Seisen — All rights reserved
          </span>
          {stats.totalVisits > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {stats.totalVisits.toLocaleString()} total visits
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
