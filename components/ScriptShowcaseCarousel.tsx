'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/utils';

interface Script {
  id: string;
  name: string;
  scriptUrl: string;
  status: 'Working' | 'Discontinued';
  type: string;
  universeId?: string;
  displayType?: string;
  features?: string[];
}

const ACCENT = '#c9a97a';

export default function ScriptShowcaseCarousel({
  scripts,
  initialActiveId,
}: {
  scripts: Script[];
  initialActiveId?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(initialActiveId ?? scripts[0]?.id ?? null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const withIds = scripts.filter(s => s.universeId);
    if (!withIds.length) return;
    const ids = withIds.map(s => s.universeId!).join(',');
    fetch(`/api/proxy/thumbnails?universeIds=${ids}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          const map: Record<string, string> = {};
          d.data.forEach((item: { targetId: string; imageUrl: string }) => {
            map[item.targetId] = item.imageUrl;
          });
          setThumbnails(map);
        }
      })
      .catch(() => {});
  }, [scripts]);

  const activeScript = scripts.find(s => s.id === activeId);
  const gridScripts = scripts.filter(s => s.id !== activeId);

  const isPremiumOnly = (s: Script) => s.type === 'Premium' && s.displayType !== 'Free & Premium';
  const isBoth = (s: Script) => s.displayType === 'Free & Premium';

  const handleCopy = async () => {
    if (!activeScript) return;
    if (await copyToClipboard(activeScript.scriptUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div layout className="flex flex-col gap-4">

      {/* ── Expanded / featured card ── */}
      <AnimatePresence mode="popLayout">
        {activeScript && (
          <motion.div
            key={activeScript.id}
            layoutId={activeScript.id}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              minHeight: '420px',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            }}
          >
            {/* Background thumbnail */}
            {activeScript.universeId && thumbnails[activeScript.universeId] ? (
              <img
                src={thumbnails[activeScript.universeId]}
                alt={activeScript.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center top' }}
              />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#0e0e0e' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeScript.status === 'Working' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeScript.status === 'Working' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{activeScript.status}</span>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm"
                style={
                  isPremiumOnly(activeScript)
                    ? { backgroundColor: 'rgba(201,169,122,0.15)', color: ACCENT, border: `1px solid rgba(201,169,122,0.3)` }
                    : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }
                }
              >
                {isPremiumOnly(activeScript) && <Crown className="w-3 h-3" />}
                {isBoth(activeScript) ? 'Free + Premium' : activeScript.type}
              </div>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <h3
                className="font-bold text-white leading-tight mb-3"
                style={{
                  fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
                  letterSpacing: '-0.025em',
                  textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                }}
              >
                {activeScript.name}
              </h3>

              {activeScript.features && activeScript.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {activeScript.features.slice(0, 5).map(f => (
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

              <div className="flex items-center gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Loader'}
                </motion.button>

                <Link
                  href="/scripts"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini grid ── */}
      <motion.div
        layout
        className="grid grid-cols-3 sm:grid-cols-4 gap-3"
      >
        {gridScripts.map(script => {
          const thumb = script.universeId ? thumbnails[script.universeId] : null;
          const discontinued = script.status === 'Discontinued';

          return (
            <motion.div
              key={script.id}
              layoutId={script.id}
              onClick={() => {
                setCopied(false);
                setActiveId(script.id);
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
              style={{
                border: discontinued
                  ? '1px solid rgba(239,68,68,0.18)'
                  : '1px solid rgba(255,255,255,0.07)',
                backgroundColor: '#0e0e0e',
              }}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={script.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center px-2"
                  style={{ backgroundColor: '#111' }}
                >
                  <span
                    className="text-[10px] font-medium text-center leading-tight line-clamp-3"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {script.name}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

              {isPremiumOnly(script) && (
                <div className="absolute top-1.5 right-1.5 z-10">
                  <Crown className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
              )}

              <div className="absolute bottom-1.5 left-1.5 z-10">
                <span
                  className="w-1.5 h-1.5 rounded-full block"
                  style={{ backgroundColor: discontinued ? '#ef4444' : '#22c55e' }}
                />
              </div>

              <div className="absolute bottom-0 inset-x-0 px-2 pb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-[9px] font-semibold text-white leading-tight truncate">{script.name}</p>
              </div>

              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px rgba(201,169,122,0.3)` }}
              />
            </motion.div>
          );
        })}

        {/* View all tile */}
        <Link
          href="/scripts"
          className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center group"
          style={{ border: `1px solid rgba(201,169,122,0.2)`, backgroundColor: 'rgba(201,169,122,0.04)' }}
        >
          <div className="text-center">
            <ArrowRight
              className="w-5 h-5 mx-auto mb-1 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: ACCENT }}
            />
            <span className="text-xs font-semibold" style={{ color: ACCENT }}>View all</span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
