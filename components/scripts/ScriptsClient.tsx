'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Copy, Check, Crown, Code, X, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

interface Script {
  id: string;
  name: string;
  scriptUrl: string;
  status: 'Working' | 'Discontinued';
  type: string;
  universeId?: string;
  displayType?: string;
  additionalUrls?: { url: string; type: string }[];
  description?: string;
  features?: string[];
}

interface ScriptsClientProps {
  initialScripts: Script[];
}

const LOADER = `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/8ac2e97282ac0718aeeb3bb3856a2821d71dc9e57553690ab508ebdb0d1569da/download"))()`;

export default function ScriptsClient({ initialScripts }: ScriptsClientProps) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [filter, setFilter]             = useState<'all' | 'free' | 'premium'>('all');
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [thumbnails, setThumbnails]     = useState<Record<string, string>>({});
  const [selected, setSelected]         = useState<Script | null>(null);
  const panelRef                        = useRef<HTMLDivElement>(null);
  const [mounted, setMounted]           = useState(false);
  useEffect(() => setMounted(true), []);

  // Fetch thumbnails
  useEffect(() => {
    const ids = initialScripts.map(s => s.universeId).filter(Boolean) as string[];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
    chunks.forEach(async chunk => {
      try {
        const res  = await fetch(`/api/proxy/thumbnails?universeIds=${chunk.join(',')}`);
        const data = await res.json();
        if (data.data) {
          setThumbnails(prev => {
            const next = { ...prev };
            data.data.forEach((item: any) => { next[item.targetId] = item.imageUrl; });
            return next;
          });
        }
      } catch { /* silent */ }
    });
  }, [initialScripts]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const card = (e.target as Element).closest('[data-script-card]');
        if (!card) setSelected(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = async (e: React.MouseEvent, script: Script) => {
    e.stopPropagation();
    const ok = await copyToClipboard(LOADER);
    if (ok) {
      setCopiedId(script.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filtered = initialScripts.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'free'    && (s.type === 'Free'    || s.displayType === 'Free & Premium')) ||
      (filter === 'premium' && (s.type === 'Premium' || s.displayType === 'Free & Premium'));
    return matchSearch && matchFilter;
  });

  const counts = {
    all:     initialScripts.length,
    free:    initialScripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length,
    premium: initialScripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length,
  };

  const isPremiumOnly = (s: Script) => s.type === 'Premium' && s.displayType !== 'Free & Premium';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>

      {/* ── Top bar — never scrolls ── */}
      <div className="shrink-0 px-6 md:px-12 py-3 z-[500]" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search scripts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-transparent text-white placeholder:text-[var(--text-muted)] focus:outline-none transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {(['all', 'free', 'premium'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all duration-150"
                style={{
                  backgroundColor: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === f ? 'white' : 'var(--text-muted)',
                }}
              >
                {f} <span className="ml-1 opacity-50">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid — only this part scrolls ── */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map(script => {
                const thumb       = script.universeId ? thumbnails[script.universeId] : null;
                const isSelected  = selected?.id === script.id;
                const discontinued = script.status === 'Discontinued';
                const premium     = isPremiumOnly(script);

                return (
                  <div
                    key={script.id}
                    data-script-card
                    onClick={() => setSelected(isSelected ? null : script)}
                    className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{
                      aspectRatio: '3/4',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : discontinued
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid rgba(255,255,255,0.07)',
                      opacity: selected && !isSelected ? 0.45 : 1,
                      transform: isSelected ? 'scale(1.02)' : undefined,
                    }}
                  >
                    {/* Thumbnail */}
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={script.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <Code className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.1)' }} />
                      </div>
                    )}

                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                      {discontinued && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400">
                          Dead
                        </span>
                      )}
                      {premium && !discontinued && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(var(--accent-rgb),0.2)', color: 'var(--accent)' }}>
                          <Crown className="w-2.5 h-2.5" /> Pro
                        </span>
                      )}
                      {!discontinued && !premium && <span />}
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: discontinued ? '#ef4444' : '#22c55e' }}
                        />
                        <span className="text-xs font-semibold text-white leading-tight truncate">{script.name}</span>
                      </div>
                    </div>

                    {/* Hover quick-copy */}
                    {!discontinued && (
                      <button
                        onClick={e => handleCopy(e, script)}
                        className="absolute bottom-3 right-3 z-20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                        title="Copy script"
                      >
                        {copiedId === script.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Search className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No scripts found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel (right slide-in) — portalled to body to escape stacking context ── */}
      {mounted && createPortal(<AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[2900]"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setSelected(null)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen z-[3000] w-full max-w-sm flex flex-col overflow-hidden"
              style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video shrink-0">
                {selected.universeId && thumbnails[selected.universeId] ? (
                  <Image
                    src={thumbnails[selected.universeId]}
                    alt={selected.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Code className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />
                {/* Close button — top of panel, no nav conflict */}
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-bold text-white text-xl leading-tight">{selected.name}</h2>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={selected.status === 'Discontinued'
                        ? { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }
                        : { backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                      }
                    >
                      {selected.status}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}
                    >
                      {selected.displayType || selected.type}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                  {selected.description || 'Verified and tested by the Seisen team before release.'}
                </p>

                {/* Features */}
                {selected.features && selected.features.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Features</p>
                    <ul className="space-y-2">
                      {selected.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action */}
                {selected.status !== 'Discontinued' ? (
                  isPremiumOnly(selected) ? (
                    <Link href="/premium">
                      <Button className="w-full justify-center">
                        <Crown className="w-4 h-4" /> Get Premium Access
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full justify-center"
                      variant={copiedId === selected.id ? 'primary' : 'outline'}
                      onClick={e => handleCopy(e, selected)}
                    >
                      {copiedId === selected.id
                        ? <><Check className="w-4 h-4" /> Copied!</>
                        : <><Copy className="w-4 h-4" /> Copy Loader Script</>
                      }
                    </Button>
                  )
                ) : (
                  <div
                    className="w-full py-3 rounded-lg text-center text-sm"
                    style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    This script has been discontinued
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}
