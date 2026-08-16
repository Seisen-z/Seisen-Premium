'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const TAGS = ['All', 'Update', 'New Script', 'Patch', 'Maintenance', 'Announcement'] as const;

const TAG_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Update':       { bg: 'rgba(201,169,122,0.12)', text: '#c9a97a', border: 'rgba(201,169,122,0.25)', dot: '#c9a97a' },
  'New Script':   { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7', border: 'rgba(110,231,183,0.25)', dot: '#6ee7b7' },
  'Patch':        { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24' },
  'Maintenance':  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)', dot: '#a78bfa' },
  'Announcement': { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', border: 'rgba(96,165,250,0.25)',  dot: '#60a5fa' },
};

function tagStyle(tag: string) {
  return TAG_STYLES[tag] ?? TAG_STYLES['Update'];
}

export interface Update {
  id: number;
  title: string;
  content: string;
  tag: string;
  image_url: string | null;
  thumbnail_url: string | null;
  footer: string | null;
  created_at: string;
}

export default function UpdatesGrid({ updates }: { updates: Update[] }) {
  const [active, setActive] = useState<string>('All');

  const counts: Record<string, number> = { All: updates.length };
  for (const u of updates) {
    counts[u.tag] = (counts[u.tag] || 0) + 1;
  }

  const filtered = active === 'All' ? updates : updates.filter((u) => u.tag === active);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {TAGS.map((tag) => {
          const count = counts[tag] ?? 0;
          if (tag !== 'All' && !count) return null;
          const isActive = active === tag;
          const ts = tag !== 'All' ? tagStyle(tag) : null;
          return (
            <button
              key={tag}
              onClick={() => setActive(tag)}
              style={isActive && ts ? {
                backgroundColor: ts.bg,
                color: ts.text,
                borderColor: ts.border,
              } : isActive ? {
                backgroundColor: 'rgba(201,169,122,0.15)',
                color: '#c9a97a',
                borderColor: 'rgba(201,169,122,0.35)',
              } : {}}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                isActive
                  ? ''
                  : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              {tag}
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'inherit' : 'rgba(255,255,255,0.3)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}
        >
          <p className="text-xl mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>No updates yet</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((update) => {
            const ts = tagStyle(update.tag);
            const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
            const dateStr = new Date(update.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            });

            return (
              <div
                key={update.id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Image */}
                {update.image_url && (
                  <div className="relative" style={{ height: '160px' }}>
                    <img
                      src={update.image_url}
                      alt={update.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,8,8,0.85) 100%)' }}
                    />
                  </div>
                )}

                {/* No image: colored top accent bar */}
                {!update.image_url && (
                  <div className="h-1 w-full" style={{ backgroundColor: ts.dot, opacity: 0.6 }} />
                )}

                <div className="flex flex-col flex-1 p-5 gap-3">
                  {/* Tag + date row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ts.dot }} />
                      {update.tag}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} title={dateStr}>
                      {timeAgo}
                    </span>
                  </div>

                  {/* Title + thumbnail */}
                  <div className="flex items-start gap-3">
                    <h2
                      className="text-base font-bold text-white leading-snug flex-1"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {update.title}
                    </h2>
                    {update.thumbnail_url && (
                      <img
                        src={update.thumbnail_url}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    )}
                  </div>

                  {/* Content preview */}
                  <p
                    className="text-sm leading-relaxed flex-1 line-clamp-3"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {update.content}
                  </p>

                  {/* Footer text + date */}
                  <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {update.footer && (
                      <p className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {update.footer}
                      </p>
                    )}
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                      {dateStr}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
