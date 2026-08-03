'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Crown, ArrowRight, Code } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

interface Script {
  id: string;
  name: string;
  scriptUrl: string;
  status: 'Working' | 'Discontinued';
  type: string;
  universeId?: string;
  displayType?: string;
  description?: string;
  features?: string[];
}

const ACCENT = '#c9a97a';

export default function FeaturedScriptCard({ script }: { script: Script }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (!script.universeId) return;
    fetch(`/api/proxy/thumbnails?universeIds=${script.universeId}`)
      .then(r => r.json())
      .then(d => {
        const url = d?.data?.[0]?.imageUrl;
        if (url) setThumbnail(url);
      })
      .catch(() => {});
  }, [script.universeId]);

  const handleCopy = async () => {
    if (await copyToClipboard(script.scriptUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPremium = script.type === 'Premium' && script.displayType !== 'Free & Premium';
  const isBoth    = script.displayType === 'Free & Premium';

  // Only show features if they come from the DB (not empty)
  const hasRealFeatures = script.features && script.features.length > 0;
  const features = hasRealFeatures ? script.features! : [];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        minHeight: '420px',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
      }}
    >
      {/* Background thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={script.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center top' }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0e0e0e' }}>
          <Code className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12" style={{ color: 'rgba(255,255,255,0.05)' }} />
        </div>
      )}

      {/* Gradient — heavy at bottom, light at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      {/* Left fade for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* ── Top row badges ── */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
        {/* Status */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Working</span>
        </div>

        {/* Type */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm"
          style={
            isPremium
              ? { backgroundColor: 'rgba(201,169,122,0.15)', color: ACCENT, border: `1px solid rgba(201,169,122,0.3)` }
              : isBoth
              ? { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.18)' }
              : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }
          }
        >
          {isPremium && <Crown className="w-3 h-3" />}
          {isBoth ? 'Free + Premium' : isPremium ? 'Premium' : 'Free'}
        </div>
      </div>

      {/* ── Bottom content — all left-aligned ── */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">

        {/* Script name */}
        <h3
          className="font-bold text-white leading-tight mb-3"
          style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
            letterSpacing: '-0.025em',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          {script.name}
        </h3>

        {/* Description — only if real */}
        {script.description && (
          <p
            className="text-sm mb-4 max-w-sm"
            style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
          >
            {script.description}
          </p>
        )}

        {/* Features — only from DB */}
        {hasRealFeatures && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {features.slice(0, 5).map((f) => (
              <span
                key={f}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* CTA row — left-aligned */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
            style={
              isPremium
                ? { backgroundColor: 'rgba(201,169,122,0.15)', color: ACCENT, border: `1px solid rgba(201,169,122,0.3)`, backdropFilter: 'blur(8px)' }
                : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }
            }
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Loader'}
          </button>

          <Link
            href="/scripts"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
