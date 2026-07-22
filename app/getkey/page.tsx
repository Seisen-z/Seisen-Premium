'use client';

import { useState } from 'react';
import { ExternalLink, Crown, Copy, Check, Terminal, ArrowRight } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

const LOADER = `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/8ac2e97282ac0718aeeb3bb3856a2821d71dc9e57553690ab508ebdb0d1569da/download"))()`;
// Direct LootLabs interstitial URL — bypasses the broken include-filter config
const LOOTLABS_URL = 'https://loot-reward.com/t?cc=eyJ0aXRsZSI6IkdldCBGcmVlIEtleSIsImRvbWFpbiI6Ii8vZGM5eHdwanByZ3V1cC5jbG91ZGZyb250Lm5ldCIsImNkIjoxMzcwNjk1LCJ0aWQiOjEzNzA2OTUsImxpbmsiOiJodHRwczovL2pua2llLmNvbS9nZXQta2V5L3NlaXNlbmh1YiJ9';

export default function GetKeyPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(LOADER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-6 md:px-14 pt-16 pb-28 max-w-6xl mx-auto">

      {/* ── Big header ── */}
      <div className="mb-16 animate-fade-in">
        <h1
          className="font-bold text-white leading-none mb-4"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.04em' }}
        >
          Get Key
        </h1>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
          Two access tiers. Free expires. Premium doesn't.
        </p>
      </div>

      {/* ── Split layout ── */}
      <div
        className="flex flex-col lg:flex-row gap-0 animate-fade-in"
        style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', animationDelay: '0.08s', animationFillMode: 'backwards' }}
      >

        {/* ── Left: Free Key ── */}
        <div className="flex-1 p-8 lg:p-10" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-2 mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>01</span>
            <span className="w-8 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Free</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Free Key</h2>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>Expires after 1h, 10h, 24h, or 48h. Renew anytime.</p>

          <ol className="space-y-6 mb-10">
            {[
              ['Get Key', 'Opens verification — takes under 60 seconds'],
              ['Complete it', 'Copy the key from the page'],
              ['Paste into executor', 'Then run the loader below'],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-5">
                <span
                  className="font-mono text-xs pt-0.5 w-5 shrink-0"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">{title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <a
            href={LOOTLABS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.13)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          >
            Get Free Key <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <p className="text-[11px] mt-2.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Opens in a new tab — come back here once you've got your key.
          </p>

          <div className="flex items-center gap-4 mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>Via</span>
            <a href="https://work.ink" target="_blank" rel="noopener noreferrer" className="opacity-40 hover:opacity-70 transition-opacity">
              <img src="/images/partners/workink.webp" alt="Work.ink" className="h-4 w-auto" />
            </a>
            <a href="https://lockr.so" target="_blank" rel="noopener noreferrer" className="opacity-40 hover:opacity-70 transition-opacity">
              <img src="/images/partners/lockr.webp" alt="Lockr.so" className="h-3.5 w-auto" />
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px hidden lg:block" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <div className="h-px lg:hidden" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />

        {/* ── Right: Premium ── */}
        <div className="lg:w-72 p-8 lg:p-10 flex flex-col" style={{ backgroundColor: 'rgba(var(--accent-rgb),0.03)' }}>
          <div className="flex items-center gap-2 mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>02</span>
            <span className="w-8 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Premium</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">No key. Ever.</h2>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>Instant access to every script. No waiting, no expiry.</p>

          <ul className="space-y-3 text-sm flex-1 mb-10">
            {[
              'All scripts unlocked',
              'No key system',
              'Weekly / Monthly / Lifetime',
              'Priority support',
              'Early access',
            ].map(f => (
              <li key={f} className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/premium"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'; }}
          >
            <Crown className="w-3.5 h-3.5" /> Upgrade <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </div>
      </div>

      {/* ── Script Loader ── */}
      <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="font-mono text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Script Loader</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>— paste into executor</span>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500/40" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(var(--accent-rgb),0.5)' }} />
            </div>
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>loader.lua</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: copied ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(255,255,255,0.04)',
                color: copied ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="px-5 py-4">
            <code className="text-xs font-mono break-all leading-relaxed" style={{ color: 'var(--accent)' }}>
              {LOADER}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
