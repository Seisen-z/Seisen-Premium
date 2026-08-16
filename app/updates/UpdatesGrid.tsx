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

// ── Discord content formatter ────────────────────────────────────────────────
function FormatContent({ text }: { text: string }) {
  // Split on Discord blockquote markers " > " used as line separators
  const lines = text.split(/ *\n| > /).map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        // Section headers
        if (/^\[?\+\]?\s*(Added|New)/i.test(line) || line.startsWith('[+]')) {
          const label = line.replace(/^\[?\+\]\s*/i, '').replace(/^Added:\s*/i, '');
          return (
            <p key={i} className="font-semibold text-xs uppercase tracking-wider mt-3 mb-0.5" style={{ color: '#6ee7b7' }}>
              ✦ {label || 'Added'}
            </p>
          );
        }
        if (/^\[?\*\]?\s*(Fixed)/i.test(line) || line.startsWith('[*]')) {
          const label = line.replace(/^\[?\*\]\s*/i, '').replace(/^Fixed:\s*/i, '');
          return (
            <p key={i} className="font-semibold text-xs uppercase tracking-wider mt-3 mb-0.5" style={{ color: '#fbbf24' }}>
              ✦ {label || 'Fixed'}
            </p>
          );
        }
        if (/^\[?~\]?\s*(Improved)/i.test(line) || line.startsWith('[~]')) {
          const label = line.replace(/^\[?~\]\s*/i, '').replace(/^Improved:\s*/i, '');
          return (
            <p key={i} className="font-semibold text-xs uppercase tracking-wider mt-3 mb-0.5" style={{ color: '#60a5fa' }}>
              ✦ {label || 'Improved'}
            </p>
          );
        }
        // Divider
        if (/^-{3,}/.test(line)) {
          return <hr key={i} style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />;
        }
        // Bullet
        if (line.startsWith('•') || line.startsWith('-')) {
          const content = line.replace(/^[•\-]\s*/, '');
          return (
            <p key={i} className="flex gap-2">
              <span className="shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
              <span>{renderInline(content)}</span>
            </p>
          );
        }
        // Normal line
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Replace URLs with links
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all" style={{ color: '#c9a97a' }} onClick={(e) => e.stopPropagation()}>
        {part.length > 40 ? part.slice(0, 40) + '…' : part}
      </a>
    ) : part
  );
}

// ── Spring configs ───────────────────────────────────────────────────────────
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

          {/* Collapsed: plain 3-line preview. Expanded: full formatted content */}
          {open ? (
            <AnimatePresence initial={false}>
              <motion.div
                initial={{ opacity: 0, filter: 'blur(6px)', y: 16 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, transition: { ...CARD_SPRING, delay: 0.15 } }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <FormatContent text={update.content} />
                {update.footer && (
                  <p className="mt-3 text-xs italic" style={{ color: 'rgba(255,255,255,0.3)' }}>{update.footer}</p>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {update.content.replace(/ > /g, ' ').replace(/\[[\+\*~]\]/g, '').replace(/^[•\-]\s*/gm, '')}
            </p>
          )}

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

// ── Filter disclosure — exact reference implementation ───────────────────────
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

  const handleSelect = (id: string) => {
    onChange(id);
    setTimeout(() => setOpen(false), 220);
  };

  const validItems = TAG_KEYS.filter((t) => t === 'All' || (counts[t] ?? 0) > 0);

  return (
    <div ref={wrapperRef} className="flex items-center justify-center" style={{ position: 'relative', height: 70, width: 120 }}>
      <MotionConfig transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="open"
              layoutId="tag-filter-disclosure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              style={{
                transformOrigin: '50% 100%',
                borderRadius: 24,
                position: 'absolute',
                right: 0,
                bottom: '100%',
                zIndex: 50,
                backgroundColor: '#111',
                border: '1.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                padding: 8,
                minWidth: 220,
              }}
              className="flex flex-col gap-1"
            >
              {validItems.map((tag, index) => {
                const Icon = TAG_ICONS[tag] ?? LayoutGrid;
                const selected = value === tag;
                const ts = tag !== 'All' ? tagStyle(tag) : null;

                return (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 1.1, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    onClick={() => handleSelect(tag)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ ...MENU_SPRING, delay: (3 + index) * 0.05 }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5"
                    style={{ backgroundColor: selected ? 'rgba(255,255,255,0.07)' : 'transparent' }}
                    onMouseEnter={(e) => !selected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => !selected && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="h-5 w-5" style={{ color: selected && ts ? ts.text : 'rgba(255,255,255,0.3)' }} />
                      <span className="text-base font-bold tracking-tight" style={{ color: selected && ts ? ts.text : selected ? '#c9a97a' : 'rgba(255,255,255,0.65)' }}>
                        {tag === 'All' ? 'All Types' : tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{counts[tag] ?? 0}</span>
                      <motion.div
                        animate={{ backgroundColor: selected ? (ts?.dot ?? '#c9a97a') : 'rgba(0,0,0,0)' }}
                        className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                        style={{ border: `3px solid ${selected ? (ts?.dot ?? '#c9a97a') : 'rgba(255,255,255,0.2)'}` }}
                      >
                        <motion.div
                          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                        >
                          <Check className="h-3 w-3 text-black" strokeWidth={3} />
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
                style={{ borderRadius: 9999, zIndex: 10 }}
                className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border will-change-transform"
                {...{ style: { borderRadius: 9999, zIndex: 10, height: 60, width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#111', border: '1.5px solid rgba(255,255,255,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' } }}
              >
                <SlidersHorizontal className="h-6 w-6" style={{ color: value !== 'All' ? '#c9a97a' : 'rgba(255,255,255,0.6)' }} />
              </motion.button>

              <motion.div
                initial={{ x: -30 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 1.2 }}
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full"
                style={{ marginLeft: -12, zIndex: 9, opacity: 0.8, backgroundColor: '#111', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    <ActiveIcon className="h-5 w-5" style={{ color: value !== 'All' ? (tagStyle(value)?.text ?? 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.3)' }} />
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
