"use client";
import { useMemo, useState } from 'react';
import { Gem, Globe, Search, Star, TrendingUp } from 'lucide-react';
import { compactCount, type CatalogEntry, type InventoryStack } from '@/lib/trackstat';
import InventoryControls from './InventoryControls';
import { CardSkeleton, Img, button, card, InventoryStat, inventoryStats, VariantTag } from './ui';

export const categories = [
  { id: 'all', label: 'All', classes: [] as string[] }, { id: 'pets', label: 'Pets', classes: ['Pet'] }, { id: 'gems', label: 'Gems', classes: ['Currency'] },
  { id: 'items', label: 'Items', classes: ['Misc', 'Lootbox', 'Box', 'Seed', 'Fruit', 'Tool', 'Hoverboard', 'Worker', 'Booth', 'Ultimate'] },
  { id: 'buffs', label: 'Buffs', classes: ['Potion', 'Consumable'] }, { id: 'enchants', label: 'Enchants', classes: ['Enchant'] }, { id: 'charms', label: 'Charms', classes: ['Charm'] },
];
const variants: Record<string, string> = { g: 'Golden', r: 'Rainbow', s: 'Shiny' };

function InventoryCard({ stack, info, catalog }: { stack: InventoryStack; info?: CatalogEntry; catalog: Record<string, CatalogEntry> }) {
  const [cls, id, , variant] = stack.k.split(':');
  const color = info?.rarity_color ?? '#7458f5';
  const exclusive = info?.rarity === 'Exclusive' || !!stack.e;
  return (
    <div className={`${card} relative flex flex-col`}>
      <span className="absolute -right-2 -top-3 z-10 font-mono text-lg font-extrabold leading-none text-ts-fg [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]" title={String(stack.a)}><span className="mr-px text-xs font-bold opacity-70">x</span>{compactCount(stack.a)}</span>
      <div className="relative grid h-28 place-items-center overflow-hidden rounded-t-xl" style={{ background: `radial-gradient(circle at 50% 60%, ${color}33, transparent 70%)` }}>
        <Img src={info?.stored} backup={info?.image} className="h-20 w-20 object-contain" fallback={<Gem size={28} className="text-ts-fg/25" />} />
        {stack.f && <Star size={16} className="absolute left-3 top-3 fill-ts-accent text-ts-accent" aria-label="Favorite" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="break-words text-sm font-semibold leading-tight text-ts-fg">{info?.name ?? id}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium"><span style={{ color }}>{info?.rarity ?? cls}{exclusive && ' ★'}</span>{variants[variant] && <VariantTag name={variants[variant]} />}</p>
        {cls === 'Pet' && !!stack.cs && (
          <div className="flex flex-wrap gap-1" aria-label="Charm slots">{Array.from({ length: stack.cs }, (_, i) => {
            const charm = stack.ch?.[i];
            const charmInfo = charm ? catalog[`Charm:${charm}:1:`] : undefined;
            const label = charmInfo?.name ?? charm ?? 'Empty charm slot';
            return <span key={i} title={label} aria-label={label} className={`grid h-8 w-8 place-items-center rounded ${charm ? 'bg-ts-accent/15 text-ts-accent' : 'border border-dashed border-ts-fg/15 text-ts-fg/25'}`}>{charm ? <Img src={charmInfo?.stored} backup={charmInfo?.image} className="h-7 w-7 object-contain" fallback={<Gem size={16} />} /> : <span className="text-[9px]">empty</span>}</span>;
          })}</div>
        )}
        {cls !== 'Pet' && info?.description && <p className="line-clamp-2 text-xs leading-5 text-ts-fg/45">{info.description}</p>}
        <div className={inventoryStats}>
          {stack.l ? <InventoryStat value={String(stack.l)} label="Level" icon={<TrendingUp />} tone="income" /> : null}
          {stack.x ? <InventoryStat value={compactCount(stack.x)} label="Exist" icon={<Globe />} /> : null}
          {stack.r ? <InventoryStat value={compactCount(stack.r * stack.a)} label="RAP" icon={<Gem />} tone="currency" detail={stack.a > 1 ? `${compactCount(stack.r)}/ea` : undefined} /> : null}
        </div>
      </div>
    </div>
  );
}

export default function InventoryView({ stacks, catalog, loading }: { stacks?: InventoryStack[]; catalog: Record<string, CatalogEntry>; loading: boolean }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(60);
  const [sort, setSort] = useState<'value' | 'amount' | 'rarity' | 'name'>('value');
  const [favOnly, setFavOnly] = useState(false);
  const shown = useMemo(() => {
    const classes = categories.find(c => c.id === cat)?.classes ?? [];
    const worth = (s: InventoryStack) => (s.r ?? 0) * s.a;
    const name = (s: InventoryStack) => catalog[s.k]?.name ?? s.k.split(':')[1];
    const order = {
      value: (a: InventoryStack, b: InventoryStack) => worth(b) - worth(a),
      amount: (a: InventoryStack, b: InventoryStack) => b.a - a.a,
      rarity: (a: InventoryStack, b: InventoryStack) => (catalog[b.k]?.rarity_num ?? 0) - (catalog[a.k]?.rarity_num ?? 0) || worth(b) - worth(a),
      name: (a: InventoryStack, b: InventoryStack) => name(a).localeCompare(name(b)),
    }[sort];
    return (stacks ?? [])
    .filter(s => (!classes.length || classes.includes(s.k.split(':')[0])) && (!favOnly || s.f) && name(s).toLowerCase().includes(q.toLowerCase()))
    .sort(order);
  }, [stacks, catalog, q, cat, sort, favOnly]);
  if (!stacks) return loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div> : <div className={`${card} p-10 text-sm text-ts-fg/45`}>Inventory details appear after the next sync from the updated library.</div>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-fg/35" /><input aria-label="Search inventory" value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Search item or pet…" className="w-full rounded-lg border border-ts-fg/10 bg-ts-surface py-2 pl-9 pr-3 text-sm text-ts-fg outline-none focus:border-ts-accent" /></label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Inventory category">{categories.map(c => <button key={c.id} aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setLimit(60); }} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${cat === c.id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.04] text-ts-fg/55 hover:text-ts-fg'}`}>{c.label}</button>)}</div>
      </div>
      <InventoryControls sort={sort} onSort={value => { setSort(value); setLimit(60); }} options={[['value', 'Value'], ['amount', 'Amount'], ['rarity', 'Rarity'], ['name', 'Name']]} favOnly={favOnly} onFav={value => { setFavOnly(value); setLimit(60); }} summary={`Total value ${compactCount(stacks.reduce((n, s) => n + (s.r ?? 0) * s.a, 0))} · ${shown.length} of ${stacks.length} stacks`} />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : shown.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{shown.slice(0, limit).map((s, i) => <InventoryCard key={`${s.k}:${i}`} stack={s} info={catalog[s.k]} catalog={catalog} />)}</div>
          {shown.length > limit && <button onClick={() => setLimit(l => l + 60)} className={`${button} mx-auto mt-6 block`}>Show more ({shown.length - limit})</button>}
        </>
      ) : <p className={`${card} p-8 text-sm text-ts-fg/40`}>Nothing matches.</p>}
    </div>
  );
}
