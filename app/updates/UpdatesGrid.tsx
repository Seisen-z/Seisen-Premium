'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import useMeasure from 'react-use-measure';
import { RefreshCw, Zap, Wrench, Settings, Megaphone, LayoutGrid, SlidersHorizontal, Check } from 'lucide-react';

// ── Tag config ───────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Update':       { bg: 'rgba(201,169,122,0.12)', text: '#c9a97a', border: 'rgba(201,169,122,0.25)', dot: '#c9a97a' },
  'New Script':   { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7', border: 'rgba(110,231,183,0.25)', dot: '#6ee7b7' },
  'Patch':        { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24' },
  'Maintenance':  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)', dot: '#a78bfa' },
  'Announcement': { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', border: 'rgba(96,165,250,0.25)',  dot: '#60a5fa' },
};
const TAG_ICONS: Record<string, React.ElementType> = {
  'All':          LayoutGrid,
  'Update':       RefreshCw,
  'New Script':   Zap,
  'Patch':        Wrench,
  'Maintenance':  Settings,
  'Announcement': Megaphone,
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

// ── Spring config ────────────────────────────────────────────────────────────
const CARD_SPRING = { type: 'spring', stiffness: 200, damping: 22, mass: 1.2 } as const;
const MENU_SPRING = { type: 'spring', stiffness: 240, damping: 20, mass: 1 } as const;

// ── Expandable card ──────────────────────────────────────────────────────────
function UpdateCard({ update }: { update: Update }) {
  const [open, setOpen] = useState(false);
  const [contentRef, bounds] = useMeasure({ offsetSize: true });
  const ts = tagStyle(update.tag);
  const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
  const dateStr = new Date(update.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <motion.div
      layout
      animate={{ height: bounds.height > 0 ? bounds.height : 'auto' }}
      transition={{ height: { ...CARD_SPRING, delay: open ? 0.1 : 0 } }}
      onClick={() => setOpen((p) => !p)}
      className="overflow-hidden cursor-pointer"
      style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}
    >
      <div ref={contentRef}>
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

        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ts.dot }} />
              {update.tag}
            </span>
            <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white leading-snug" style={{ letterSpacing: '-0.02em' }}>{update.title}</h2>
              {update.game_name && !update.image_url && (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{update.game_name}</p>
              )}
            </div>
            {update.thumbnail_url && (
              <img src={update.thumbnail_url} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
            )}
          </div>

          <p className={`text-sm leading-relaxed ${open ? '' : 'line-clamp-3'}`} style={{ color: 'rgba(255,255,255,0.45)' }}>
            {update.content}
          </p>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, filter: 'blur(6px)', y: 16 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, transition: { ...CARD_SPRING, delay: 0.15 } }}
                exit={{ opacity: 0, filter: 'blur(6px)', y: 8, transition: { duration: 0.2 } }}
                className="space-y-3 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                {update.footer && (
                  <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>{update.footer}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{dateStr}</p>
            <span className="text-[11px] select-none" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {open ? '↑ collapse' : '↓ expand'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Filter disclosure (pill → spring list) ───────────────────────────────────
function TagFilterDisclosure({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ActiveIcon = TAG_ICONS[value] ?? LayoutGrid;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (tag: string) => {
    onChange(tag);
    setTimeout(() => setOpen(false), 200);
  };

  const validTags = TAG_KEYS.filter((t) => t === 'All' || (counts[t] ?? 0) > 0);

  return (
    <div ref={wrapperRef} className="relative flex items-center justify-end">
      <MotionConfig transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="open"
              layoutId="tag-filter-disclosure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              style={{ transformOrigin: '100% 100%', borderRadius: 24, position: 'absolute', right: 0, bottom: '110%', zIndex: 50 }}
              className="flex flex-col gap-1 overflow-hidden p-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              {...{ style: { transformOrigin: '100% 100%', borderRadius: 24, position: 'absolute', right: 0, bottom: '110%', zIndex: 50, backgroundColor: '#111', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', padding: '8px', minWidth: '200px' } }}
            >
              {validTags.map((tag, index) => {
                const Icon = TAG_ICONS[tag] ?? LayoutGrid;
                const selected = value === tag;
                const ts = tag !== 'All' ? tagStyle(tag) : null;
                const count = counts[tag] ?? 0;
                return (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 1.05, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    onClick={() => handleSelect(tag)}
                    transition={{ ...MENU_SPRING, delay: (2 + index) * 0.04 }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 transition-colors"
                    style={{ backgroundColor: selected ? 'rgba(255,255,255,0.07)' : 'transparent' }}
                    onMouseEnter={(e) => !selected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => !selected && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" style={{ color: selected && ts ? ts.text : 'rgba(255,255,255,0.3)' }} />
                      <span className="text-sm font-semibold" style={{ color: selected && ts ? ts.text : selected ? '#c9a97a' : 'rgba(255,255,255,0.65)' }}>
                        {tag === 'All' ? 'All Types' : tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{count}</span>
                      <motion.div
                        animate={{ backgroundColor: selected ? (ts?.dot ?? '#c9a97a') : 'transparent' }}
                        transition={{ duration: 0.15 }}
                        className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ border: `2px solid ${selected ? (ts?.dot ?? '#c9a97a') : 'rgba(255,255,255,0.2)'}` }}
                      >
                        <motion.div animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }} transition={{ type: 'spring', stiffness: 520, damping: 30 }}>
                          <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <div key="closed" className="flex items-center">
              <motion.button
                layoutId="tag-filter-disclosure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, position: 'relative' }}
              >
                <SlidersHorizontal className="h-5 w-5" style={{ color: value !== 'All' ? '#c9a97a' : 'rgba(255,255,255,0.6)' }} />
              </motion.button>

              <motion.div
                initial={{ x: -24 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 1 }}
                style={{ borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -10, zIndex: 9, opacity: 0.8 }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <ActiveIcon className="h-4 w-4" style={{ color: value !== 'All' ? (tagStyle(value)?.text ?? 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.3)' }} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}

// ── Main grid ────────────────────────────────────────────────────────────────
export default function UpdatesGrid({ updates }: { updates: Update[] }) {
  const [activeGame, setActiveGame] = useState<string>('All');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [search, setSearch] = useState('');

  const games = useMemo(() => {
    const names = Array.from(new Set(updates.map((u) => u.game_name).filter(Boolean) as string[])).sort();
    return ['All', ...names];
  }, [updates]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return updates.filter((u) => {
      if (activeGame !== 'All' && u.game_name !== activeGame) return false;
      if (activeTag !== 'All' && u.tag !== activeTag) return false;
      if (q && !u.title.toLowerCase().includes(q) && !u.content.toLowerCase().includes(q) && !(u.game_name ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [updates, activeGame, activeTag, search]);

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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#c9a97a' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,122,0.4)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer text-lg leading-none">×</button>
        )}
      </div>

      {/* Game tabs + type filter disclosure */}
      <div className="flex items-center justify-between gap-4">
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
                {game === 'All' ? 'All Scripts' : game}
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', color: isActive ? 'inherit' : 'rgba(255,255,255,0.3)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <TagFilterDisclosure value={activeTag} onChange={setActiveTag} counts={tagCounts} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
          <p className="text-xl mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>No updates found</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}
