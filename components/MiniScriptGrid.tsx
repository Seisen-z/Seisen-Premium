'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';

interface Script {
  id: string;
  name: string;
  status: 'Working' | 'Discontinued';
  type: string;
  universeId?: string;
  displayType?: string;
}

const ACCENT = '#c9a97a';

export default function MiniScriptGrid({ scripts }: { scripts: Script[] }) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const withIds = scripts.filter(s => s.universeId);
    if (!withIds.length) return;
    const ids = withIds.map(s => s.universeId!).join(',');
    fetch(`/api/proxy/thumbnails?universeIds=${ids}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          const map: Record<string, string> = {};
          d.data.forEach((item: any) => { map[item.targetId] = item.imageUrl; });
          setThumbnails(map);
        }
      })
      .catch(() => {});
  }, [scripts]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {scripts.map(script => {
        const thumb = script.universeId ? thumbnails[script.universeId] : null;
        const discontinued  = script.status === 'Discontinued';
        const isPremiumOnly = script.type === 'Premium' && script.displayType !== 'Free & Premium';

        return (
          <Link
            key={script.id}
            href="/scripts"
            className="relative aspect-square rounded-xl overflow-hidden block group"
            style={{
              border: discontinued ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#0e0e0e',
            }}
          >
            {/* Thumbnail */}
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

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

            {/* Badges */}
            {isPremiumOnly && (
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

            {/* Name on hover */}
            <div className="absolute bottom-0 inset-x-0 px-2 pb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-[9px] font-semibold text-white leading-tight truncate">{script.name}</p>
            </div>

            {/* Hover accent border */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ boxShadow: `inset 0 0 0 1px rgba(201,169,122,0.3)` }}
            />
          </Link>
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
    </div>
  );
}
