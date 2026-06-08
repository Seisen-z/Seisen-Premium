'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Crown, Code } from 'lucide-react';
import Image from 'next/image';
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
}

interface ScriptShowcaseProps {
  scripts: Script[];
}

export default function ScriptShowcase({ scripts }: ScriptShowcaseProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    const withIds = scripts.filter(s => s.universeId);
    if (!withIds.length) return;

    const chunks: string[][] = [];
    withIds.forEach(s => {
      if (!chunks.length || chunks[chunks.length - 1].length >= 50) chunks.push([]);
      chunks[chunks.length - 1].push(s.universeId!);
    });

    chunks.forEach(async chunk => {
      try {
        const res = await fetch(`/api/proxy/thumbnails?universeIds=${chunk.join(',')}`);
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
  }, [scripts]);

  const handleCopy = async (e: React.MouseEvent, script: Script) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/8ac2e97282ac0718aeeb3bb3856a2821d71dc9e57553690ab508ebdb0d1569da/download"))()`;
    if (await copyToClipboard(text)) {
      setCopiedId(script.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filtered = scripts.filter(s => {
    if (filter === 'free')    return s.type === 'Free'    || s.displayType === 'Free & Premium';
    if (filter === 'premium') return s.type === 'Premium' || s.displayType === 'Free & Premium';
    return true;
  });

  const isPremiumOnly = (s: Script) => s.type === 'Premium' && s.displayType !== 'Free & Premium';

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-8">
        {(['all', 'free', 'premium'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all duration-200"
            style={filter === f
              ? { backgroundColor: 'var(--accent)', color: '#000' }
              : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} scripts
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map(script => {
          const thumb = script.universeId ? thumbnails[script.universeId] : null;
          const discontinued = script.status === 'Discontinued';
          const premiumOnly = isPremiumOnly(script);

          return (
            <Link
              key={`${script.id}-${script.name}`}
              href="/scripts"
              className="group relative aspect-[3/4] rounded-xl overflow-hidden block"
              style={{
                border: discontinued
                  ? '1px solid rgba(239,68,68,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'var(--bg-secondary)',
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
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Code className="w-8 h-8 opacity-20" />
                </div>
              )}

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Status dot */}
              <div className="absolute top-2.5 left-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full block"
                  style={{ backgroundColor: discontinued ? '#ef4444' : '#22c55e' }}
                />
              </div>

              {/* Type badge */}
              <div className="absolute top-2.5 right-2.5">
                {discontinued ? (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Off
                  </span>
                ) : premiumOnly ? (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.3)' }}>
                    <Crown className="w-2 h-2" /> Pro
                  </span>
                ) : null}
              </div>

              {/* Name + action */}
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-white text-xs font-semibold leading-tight truncate mb-2">{script.name}</p>

                {!discontinued && (
                  <button
                    onClick={e => handleCopy(e, script)}
                    className="w-full py-1 rounded-md text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1"
                    style={premiumOnly
                      ? { backgroundColor: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.3)' }
                      : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }
                    }
                  >
                    {premiumOnly ? (
                      <><Crown className="w-3 h-3" /> Upgrade</>
                    ) : copiedId === script.id ? (
                      <><Check className="w-3 h-3" /> Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </button>
                )}
              </div>

              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.25)' }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
