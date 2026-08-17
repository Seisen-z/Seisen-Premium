'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Copy, Crown, Zap, LayoutGrid } from 'lucide-react';
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
const MENU_SPRING = { type: 'spring', stiffness: 240, damping: 20, mass: 1 } as const;

interface FilterItem { id: string; label: string; count: number; icon?: React.ElementType; color?: string }

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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer"
        style={{
          backgroundColor: value !== 'All' ? 'rgba(201,169,122,0.1)' : 'rgba(255,255,255,0.04)',
          color: value !== 'All' ? ACCENT : 'rgba(255,255,255,0.55)',
          borderColor: value !== 'All' ? 'rgba(201,169,122,0.3)' : 'rgba(255,255,255,0.1)',
        }}
      >
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
              padding: 6, minWidth: 160,
            }}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const selected = value === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MENU_SPRING, delay: index * 0.03 }}
                  onClick={() => { onChange(item.id); setTimeout(() => setOpen(false), 150); }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-colors"
                  style={{ backgroundColor: selected ? 'rgba(255,255,255,0.07)' : 'transparent' }}
                  onMouseEnter={e => !selected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => !selected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="flex items-center gap-2.5">
                    {Icon && <Icon className="h-3.5 w-3.5" style={{ color: selected && item.color ? item.color : 'rgba(255,255,255,0.3)' }} />}
                    <span className="text-sm font-semibold" style={{ color: selected && item.color ? item.color : selected ? ACCENT : 'rgba(255,255,255,0.65)' }}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.count}</span>
                    <motion.div
                      animate={{ backgroundColor: selected ? ACCENT : 'rgba(0,0,0,0)' }}
                      className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                      style={{ border: `2.5px solid ${selected ? ACCENT : 'rgba(255,255,255,0.2)'}` }}
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

function ScriptCard({ script, thumbnail }: { script: Script; thumbnail?: string }) {
  const [copied, setCopied] = useState(false);
  const isPremium = script.type === 'Premium' && script.displayType !== 'Free & Premium';
  const isBoth    = script.displayType === 'Free & Premium';
  const working   = script.status === 'Working';

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPremium) return;
    if (await copyToClipboard(script.scriptUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Link href={`/scripts#${script.id}`}>
      <div
        className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer"
        style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.045)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          {thumbnail
            ? <img src={thumbnail} alt={script.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{script.name[0]}</div>
          }
          {/* Status dot */}
          <span
            className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border"
            style={{ backgroundColor: working ? '#22c55e' : '#ef4444', borderColor: '#111' }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{script.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPremium && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: ACCENT }}>
                <Crown className="w-2.5 h-2.5" /> Premium
              </span>
            )}
            {isBoth && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#6ee7b7' }}>
                <Zap className="w-2.5 h-2.5" /> Free+
              </span>
            )}
            {!isPremium && !isBoth && (
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Free</span>
            )}
            {script.features?.[0] && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{script.features[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* Copy button */}
        {!isPremium ? (
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all opacity-0 group-hover:opacity-100"
            style={{ backgroundColor: copied ? 'rgba(110,231,183,0.12)' : 'rgba(201,169,122,0.1)', color: copied ? '#6ee7b7' : ACCENT, border: `1px solid ${copied ? 'rgba(110,231,183,0.25)' : 'rgba(201,169,122,0.2)'}` }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : (
          <span className="shrink-0 opacity-0 group-hover:opacity-100 text-[11px] font-semibold transition-opacity" style={{ color: 'rgba(255,255,255,0.2)' }}>
            View →
          </span>
        )}
      </div>
    </Link>
  );
}

export default function HomeScriptList({ scripts }: { scripts: Script[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
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
          d.data.forEach((item: { targetId: string; imageUrl: string }) => { map[item.targetId] = item.imageUrl; });
          setThumbnails(map);
        }
      })
      .catch(() => {});
  }, [scripts]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { All: scripts.length, Free: 0, Premium: 0 };
    for (const s of scripts) {
      if (s.type === 'Premium' && s.displayType !== 'Free & Premium') c['Premium']++;
      else c['Free']++;
    }
    return c;
  }, [scripts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scripts.filter(s => {
      if (typeFilter === 'Free' && s.type === 'Premium' && s.displayType !== 'Free & Premium') return false;
      if (typeFilter === 'Premium' && !(s.type === 'Premium')) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.features ?? []).some(f => f.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [scripts, typeFilter, search]);

  const typeItems: FilterItem[] = [
    { id: 'All',     label: 'All Scripts', count: typeCounts['All'],     icon: LayoutGrid },
    { id: 'Free',    label: 'Free',        count: typeCounts['Free'],    color: '#6ee7b7' },
    { id: 'Premium', label: 'Premium',     count: typeCounts['Premium'], icon: Crown, color: ACCENT },
  ];

  // Show max 8 in homepage preview
  const preview = filtered.slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filter row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text" placeholder="Search scripts..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs text-white outline-none transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: ACCENT }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,122,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer text-sm leading-none">×</button>}
        </div>
        <FilterDropdown label="All Scripts" value={typeFilter} items={typeItems} onChange={setTypeFilter} />
      </div>

      {/* Script list */}
      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {preview.map((script, i) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.02 }}
            >
              <ScriptCard
                script={script}
                thumbnail={script.universeId ? thumbnails[script.universeId] : undefined}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer: count + view all */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {filtered.length} script{filtered.length !== 1 ? 's' : ''}
          {typeFilter !== 'All' || search ? ' matching' : ' total'}
        </span>
        <Link href="/scripts" className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: ACCENT }}>
          View all →
        </Link>
      </div>
    </div>
  );
}
