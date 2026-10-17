"use client";
import { Star } from 'lucide-react';

// Sort order, a favorites filter, and a one-line summary above an inventory grid
export default function InventoryControls<T extends string>({ sort, onSort, options, favOnly, onFav, summary, filterLabel = 'Favorites' }: { sort: T; onSort: (value: T) => void; options: [T, string][]; favOnly: boolean; onFav: (value: boolean) => void; summary: string; filterLabel?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <select aria-label="Sort inventory" value={sort} onChange={e => onSort(e.target.value as T)} className="rounded-lg bg-ts-fg/[0.05] px-3 py-1.5 text-sm text-ts-fg outline-none focus-visible:ring-2 focus-visible:ring-ts-accent/40">
        {options.map(([id, label]) => <option key={id} value={id} className="bg-ts-surface">Sort: {label}</option>)}
      </select>
      <button aria-pressed={favOnly} onClick={() => onFav(!favOnly)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${favOnly ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`}><Star size={14} className={favOnly ? 'fill-current' : ''} />{filterLabel}</button>
      <span className="ml-auto text-xs text-ts-fg/45">{summary}</span>
    </div>
  );
}
