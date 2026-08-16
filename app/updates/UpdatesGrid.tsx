'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Zap,
  Wrench,
  Settings,
  Megaphone,
  LayoutGrid,
  Check,
  ChevronDown,
  Gamepad2,
  List,
  Grid,
} from 'lucide-react';

// ── Version calculator helper ────────────────────────────────────────────────
// 1.0.0 -> 1.0.1 ... -> 1.0.10 -> 1.1.0 -> 1.1.1 ... -> 1.1.10 -> 1.2.0
export function computeVersionNumber(indexFromOldest: number): string {
  const safeIndex = Math.max(0, indexFromOldest);
  const minor = Math.floor(safeIndex / 11);
  const patch = safeIndex % 11;
  return `v1.${minor}.${patch}`;
}

// ── Tag config ───────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Update':       { bg: 'rgba(201,169,122,0.12)', text: '#c9a97a', border: 'rgba(201,169,122,0.3)', dot: '#c9a97a' },
  'New Script':   { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7', border: 'rgba(110,231,183,0.3)', dot: '#6ee7b7' },
  'Patch':        { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)',  dot: '#fbbf24' },
  'Maintenance':  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.3)', dot: '#a78bfa' },
  'Announcement': { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', border: 'rgba(96,165,250,0.3)',  dot: '#60a5fa' },
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

function tagStyle(tag: string) { return TAG_STYLES[tag] ?? TAG_STYLES['Update']; }

export interface Update {
  id: number;
  title: string;
  content: string;
  tag: string;
  game_name: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  footer: string | null;
  version?: string | null;
  created_at: string;
}

// ── Discord / Markdown content formatter ─────────────────────────────────────
function FormatContent({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-2 text-sm pt-2" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        // Section headers (✦ ADDED, ✦ FIXED, ✦ IMPROVED, [+], [*], [~])
        if (/^✦?\s*ADDED/i.test(line) || /^\[\+\]/i.test(line)) {
          const label = line.replace(/^\[\+\]\s*/i, '').replace(/^✦?\s*/, '').trim() || 'ADDED';
          return (
            <div key={i} className="font-bold text-xs uppercase tracking-wider mt-4 mb-1.5 flex items-center gap-1.5" style={{ color: '#6ee7b7' }}>
              <span>✦</span> {label}
            </div>
          );
        }
        if (/^✦?\s*FIXED/i.test(line) || /^\[\*\]/i.test(line)) {
          const label = line.replace(/^\[\*\]\s*/i, '').replace(/^✦?\s*/, '').trim() || 'FIXED';
          return (
            <div key={i} className="font-bold text-xs uppercase tracking-wider mt-4 mb-1.5 flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
              <span>✦</span> {label}
            </div>
          );
        }
        if (/^✦?\s*IMPROVED/i.test(line) || /^\[~\]/i.test(line)) {
          const label = line.replace(/^\[~\]\s*/i, '').replace(/^✦?\s*/, '').trim() || 'IMPROVED';
          return (
            <div key={i} className="font-bold text-xs uppercase tracking-wider mt-4 mb-1.5 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
              <span>✦</span> {label}
            </div>
          );
        }
        if (/^-{3,}/.test(line)) {
          return <hr key={i} style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />;
        }

        // Bullet points starting with >, •, or -
        const isBullet = line.startsWith('>') || line.startsWith('•') || line.startsWith('-');
        if (isBullet) {
          const content = line.replace(/^[>•\-]+\s*/, '');
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="shrink-0 mt-0.5 text-xs font-semibold" style={{ color: '#c9a97a' }}>&gt; •</span>
              <span className="text-white/85 leading-relaxed">{renderInline(content)}</span>
            </div>
          );
        }

        return <p key={i} className="text-white/80">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all font-medium" style={{ color: '#c9a97a' }} onClick={e => e.stopPropagation()}>{part.length > 40 ? part.slice(0, 40) + '…' : part}</a>
      : part
  );
}

// ── Spring animation configs ─────────────────────────────────────────────────
const MENU_SPRING = { type: 'spring', stiffness: 240, damping: 20, mass: 1 } as const;

// ── Compact filter dropdown ───────────────────────────────────────────────────
interface FilterItem { id: string; label: string; count: number; icon?: React.ElementType; color?: string; dot?: string }

function FilterDropdown({ label, value, items, onChange }: {
  label: string; value: string;
  items: FilterItem[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = items.find(i => i.id === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (id: string) => { onChange(id); setTimeout(() => setOpen(false), 200); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-sm"
        style={{
          backgroundColor: value !== 'All' ? 'rgba(201,169,122,0.12)' : 'rgba(255,255,255,0.04)',
          color: value !== 'All' ? '#c9a97a' : 'rgba(255,255,255,0.7)',
          borderColor: value !== 'All' ? 'rgba(201,169,122,0.3)' : 'rgba(255,255,255,0.1)',
        }}
      >
        {active?.dot && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: active.dot }} />}
        <span>{value === 'All' ? label : active?.label ?? label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50,
              backgroundColor: '#111', border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.75)',
              padding: 6, minWidth: 190,
            }}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const selected = value === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MENU_SPRING, delay: index * 0.03 }}
                  onClick={() => handleSelect(item.id)}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-colors"
                  style={{ backgroundColor: selected ? 'rgba(255,255,255,0.07)' : 'transparent' }}
                  onMouseEnter={e => !selected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => !selected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-3.5 w-3.5" style={{ color: selected && item.color ? item.color : 'rgba(255,255,255,0.4)' }} />}
                    {!Icon && item.dot && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />}
                    <span className="text-sm font-semibold" style={{ color: selected && item.color ? item.color : selected ? '#c9a97a' : 'rgba(255,255,255,0.75)' }}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.count}</span>
                    <motion.div
                      animate={{ backgroundColor: selected ? (item.dot ?? '#c9a97a') : 'rgba(0,0,0,0)' }}
                      className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                      style={{ border: `2.5px solid ${selected ? (item.dot ?? '#c9a97a') : 'rgba(255,255,255,0.2)'}` }}
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
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Fixed / Expandable Update Card ───────────────────────────────────────────
function UpdateCard({ update, computedVersion }: { update: Update; computedVersion: string }) {
  const [open, setOpen] = useState(false);
  const ts = tagStyle(update.tag);
  const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
  const dateStr = new Date(update.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const displayVersion = update.version || computedVersion;

  return (
    <div
      className="relative overflow-hidden transition-all duration-200 rounded-2xl w-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid #c9a97a',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Optional Hero Image */}
      {update.image_url && (
        <div className="relative h-44 w-full overflow-hidden">
          <img src={update.image_url} alt={update.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/40 to-transparent" />
          {update.game_name && (
            <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/80 text-white/90 border border-white/10 backdrop-blur-sm">
              {update.game_name}
            </span>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col gap-3.5">
        {/* Top Header Row (Tag Pill, Version & Timestamp) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: ts.dot }} />
              {update.tag}
            </span>

            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight"
              style={{ backgroundColor: 'rgba(201,169,122,0.12)', color: '#c9a97a', border: '1px solid rgba(201,169,122,0.25)' }}
            >
              {displayVersion}
            </span>
          </div>

          <span className="text-[11px] font-medium shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {timeAgo}
          </span>
        </div>

        {/* Title, Subtitle & Thumbnail */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">
              {update.title}
            </h2>
            {update.game_name && !update.image_url && (
              <p className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: '#c9a97a' }}>
                {update.game_name}
              </p>
            )}
          </div>

          {update.thumbnail_url && (
            <img
              src={update.thumbnail_url}
              alt=""
              className="h-12 w-12 rounded-xl object-cover shrink-0 border border-white/10 shadow-md"
            />
          )}
        </div>

        {/* Content Body */}
        <div className="mt-1">
          {open ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <FormatContent text={update.content} />
              {update.footer && (
                <p className="mt-4 pt-2.5 border-t border-white/10 text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {update.footer}
                </p>
              )}
            </motion.div>
          ) : (
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {update.content.replace(/ > /g, ' ').replace(/\[[\+\*~]\]/g, '').replace(/^[•\->\s]+/gm, ' ')}
            </p>
          )}
        </div>

        {/* Footer Bar with Toggle Button */}
        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {dateStr}
          </span>
          <button
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-md transition-all cursor-pointer hover:bg-white/10"
            style={{
              backgroundColor: open ? 'rgba(201,169,122,0.15)' : 'rgba(255,255,255,0.04)',
              color: open ? '#c9a97a' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${open ? 'rgba(201,169,122,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <span>{open ? 'Collapse ↑' : 'Read Full Update ↓'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main updates feed / grid ──────────────────────────────────────────────────
export default function UpdatesGrid({ updates }: { updates: Update[] }) {
  const [activeGame, setActiveGame] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

  // Pre-calculate version numbers per game for updates ordered chronologically
  const updatesWithVersions = useMemo(() => {
    const gameCounts: Record<string, number> = {};
    const gameTotals: Record<string, number> = {};

    updates.forEach((u) => {
      const key = u.game_name || 'Global';
      gameTotals[key] = (gameTotals[key] || 0) + 1;
    });

    return updates.map((u) => {
      const key = u.game_name || 'Global';
      gameCounts[key] = (gameCounts[key] || 0) + 1;
      const chronologicalIndex = gameTotals[key] - gameCounts[key];
      const computed = computeVersionNumber(chronologicalIndex);
      return {
        update: u,
        computedVersion: u.version || computed,
      };
    });
  }, [updates]);

  const games = useMemo(
    () => Array.from(new Set(updates.map(u => u.game_name).filter(Boolean) as string[])).sort(),
    [updates]
  );

  const tagCounts = useMemo(() => {
    const pool = activeGame === 'All' ? updates : updates.filter(u => u.game_name === activeGame);
    const c: Record<string, number> = { All: pool.length };
    for (const u of pool) c[u.tag] = (c[u.tag] || 0) + 1;
    return c;
  }, [updates, activeGame]);

  const gameCounts = useMemo(() => {
    const pool = activeTag === 'All' ? updates : updates.filter(u => u.tag === activeTag);
    const c: Record<string, number> = { All: pool.length };
    for (const u of pool) if (u.game_name) c[u.game_name] = (c[u.game_name] || 0) + 1;
    return c;
  }, [updates, activeTag]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return updatesWithVersions.filter(({ update: u }) => {
      if (activeGame !== 'All' && u.game_name !== activeGame) return false;
      if (activeTag !== 'All' && u.tag !== activeTag) return false;
      if (
        q &&
        !u.title.toLowerCase().includes(q) &&
        !u.content.toLowerCase().includes(q) &&
        !(u.game_name ?? '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [updatesWithVersions, activeGame, activeTag, search]);

  const gameItems: FilterItem[] = [
    { id: 'All', label: 'All Scripts', count: gameCounts['All'] ?? updates.length, icon: Gamepad2 },
    ...games.map(g => ({ id: g, label: g, count: gameCounts[g] ?? 0 })),
  ];

  const tagItems: FilterItem[] = TAG_KEYS.filter(t => t === 'All' || (tagCounts[t] ?? 0) > 0).map(t => ({
    id: t,
    label: t === 'All' ? 'All Types' : t,
    count: tagCounts[t] ?? 0,
    icon: TAG_ICONS[t],
    color: t !== 'All' ? tagStyle(t).text : undefined,
    dot: t !== 'All' ? tagStyle(t).dot : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Search, Filters & View Switcher Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search updates & patches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-full text-xs text-white outline-none transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              caretColor: '#c9a97a',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,122,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer leading-none text-sm"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {games.length > 0 && (
            <FilterDropdown label="All Scripts" value={activeGame} items={gameItems} onChange={setActiveGame} />
          )}
          <FilterDropdown label="All Types" value={activeTag} items={tagItems} onChange={setActiveTag} />

          {/* View mode toggle (Feed vs Grid) */}
          <div className="flex items-center gap-1 rounded-full p-1 bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'feed' ? 'bg-[#c9a97a] text-black font-bold' : 'text-white/50 hover:text-white'
              }`}
              title="Feed View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'grid' ? 'bg-[#c9a97a] text-black font-bold' : 'text-white/50 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Result count badge */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        <p>
          {filtered.length} update{filtered.length !== 1 ? 's' : ''}
          {activeGame !== 'All' || activeTag !== 'All' || search ? ' matching filters' : ''}
        </p>
      </div>

      {/* Feed or Grid list */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}
        >
          <p className="text-xl mb-2 font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>
            No updates found
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Try a different filter or search term.
          </p>
        </div>
      ) : viewMode === 'feed' ? (
        <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
          {filtered.map(({ update, computedVersion }) => (
            <UpdateCard key={update.id} update={update} computedVersion={computedVersion} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {filtered.map(({ update, computedVersion }) => (
            <UpdateCard key={update.id} update={update} computedVersion={computedVersion} />
          ))}
        </div>
      )}
    </div>
  );
}
