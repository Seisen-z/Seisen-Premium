'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

const TAG_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Update':       { bg: 'rgba(201,169,122,0.12)', text: '#c9a97a', border: 'rgba(201,169,122,0.25)', dot: '#c9a97a' },
  'New Script':   { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7', border: 'rgba(110,231,183,0.25)', dot: '#6ee7b7' },
  'Patch':        { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24' },
  'Maintenance':  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)', dot: '#a78bfa' },
  'Announcement': { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', border: 'rgba(96,165,250,0.25)',  dot: '#60a5fa' },
};
const TAG_KEYS = ['All', 'Update', 'New Script', 'Patch', 'Maintenance', 'Announcement'];

function tagStyle(tag: string) {
  return TAG_STYLES[tag] ?? TAG_STYLES['Update'];
}

export interface Update {
  id: number;
  title: string;
  content: string;
  tag: string;
  game_name: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  footer: string | null;
  created_at: string;
}

export default function UpdatesGrid({ updates }: { updates: Update[] }) {
  const [activeGame, setActiveGame] = useState<string>('All');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [search, setSearch] = useState('');

  const games = useMemo(() => {
    const names = Array.from(new Set(updates.map((u) => u.game_name).filter(Boolean) as string[])).sort();
    return ['All', ...names];
  }, [updates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return updates.filter((u) => {
      if (activeGame !== 'All' && u.game_name !== activeGame) return false;
      if (activeTag !== 'All' && u.tag !== activeTag) return false;
      if (q && !u.title.toLowerCase().includes(q) && !u.content.toLowerCase().includes(q) && !(u.game_name ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [updates, activeGame, activeTag, search]);

  const tagCounts = useMemo(() => {
    const pool = activeGame === 'All' ? updates : updates.filter((u) => u.game_name === activeGame);
    const counts: Record<string, number> = { All: pool.length };
    for (const u of pool) counts[u.tag] = (counts[u.tag] || 0) + 1;
    return counts;
  }, [updates, activeGame]);

  const gameCounts = useMemo(() => {
    const pool = activeTag === 'All' ? updates : updates.filter((u) => u.tag === activeTag);
    const counts: Record<string, number> = { All: pool.length };
    for (const u of pool) if (u.game_name) counts[u.game_name] = (counts[u.game_name] || 0) + 1;
    return counts;
  }, [updates, activeTag]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search updates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#c9a97a' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,122,0.4)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer text-lg leading-none">×</button>
        )}
      </div>

      {/* Game tabs */}
      {games.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {games.map((game) => {
            const count = gameCounts[game] ?? 0;
            if (game !== 'All' && !count) return null;
            const isActive = activeGame === game;
            return (
              <button
                key={game}
                onClick={() => setActiveGame(game)}
                style={isActive ? { backgroundColor: 'rgba(201,169,122,0.15)', color: '#c9a97a', borderColor: 'rgba(201,169,122,0.4)' } : {}}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${isActive ? '' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'}`}
              >
                {game}
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', color: isActive ? 'inherit' : 'rgba(255,255,255,0.3)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tag type tabs */}
      <div className="flex flex-wrap gap-2">
        {TAG_KEYS.map((tag) => {
          const count = tagCounts[tag] ?? 0;
          if (tag !== 'All' && !count) return null;
          const isActive = activeTag === tag;
          const ts = tag !== 'All' ? tagStyle(tag) : null;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={isActive && ts
                ? { backgroundColor: ts.bg, color: ts.text, borderColor: ts.border }
                : isActive
                ? { backgroundColor: 'rgba(201,169,122,0.15)', color: '#c9a97a', borderColor: 'rgba(201,169,122,0.35)' }
                : {}}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${isActive ? '' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'}`}
            >
              {tag}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', color: isActive ? 'inherit' : 'rgba(255,255,255,0.3)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
          <p className="text-xl mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>No updates found</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((update) => {
            const ts = tagStyle(update.tag);
            const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
            const dateStr = new Date(update.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            return (
              <div
                key={update.id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {update.image_url ? (
                  <div className="relative" style={{ height: '160px' }}>
                    <img src={update.image_url} alt={update.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,8,8,0.85) 100%)' }} />
                    {update.game_name && (
                      <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}>
                        {update.game_name}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-1 w-full" style={{ backgroundColor: ts.dot, opacity: 0.6 }} />
                )}

                <div className="flex flex-col flex-1 p-5 gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ts.dot }} />
                      {update.tag}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} title={dateStr}>{timeAgo}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-white leading-snug" style={{ letterSpacing: '-0.02em' }}>
                        {update.title}
                      </h2>
                      {update.game_name && !update.image_url && (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {update.game_name}
                        </p>
                      )}
                    </div>
                    {update.thumbnail_url && (
                      <img src={update.thumbnail_url} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                    )}
                  </div>

                  <p className="text-sm leading-relaxed flex-1 line-clamp-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {update.content}
                  </p>

                  <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {update.footer && (
                      <p className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.3)' }}>{update.footer}</p>
                    )}
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{dateStr}</p>
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
