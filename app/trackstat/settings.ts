'use client';
import { useSyncExternalStore } from 'react';
import { setNumberFormat } from '@/lib/trackstat';

// Preferences kept in this browser only
export type Settings = {
  fullNumbers: boolean;
  collapsed: boolean;
  relaxedRefresh: boolean;
  names: Record<string, string>;
  order: string[];
};
const defaults: Settings = { fullNumbers: false, collapsed: false, relaxedRefresh: false, names: {}, order: [] };
const storageKey = 'trackstat-settings';
const listeners = new Set<() => void>();
let current: Settings | null = null;

function load(): Settings {
  if (current) return current;
  let saved: Partial<Settings> = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}'); } catch { /* defaults */ }
  current = { ...defaults, ...saved, names: { ...saved.names }, order: Array.isArray(saved.order) ? saved.order : [] };
  setNumberFormat(current.fullNumbers);
  return current;
}

export function useSettings() {
  const settings = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, load, () => defaults);
  const update = (change: Partial<Settings>) => {
    current = { ...load(), ...change };
    setNumberFormat(current.fullNumbers);
    try { localStorage.setItem(storageKey, JSON.stringify(current)); } catch { /* not remembered */ }
    listeners.forEach(listener => listener());
  };
  return { settings, update };
}

// Accounts in the order the user chose; anything new goes last
export function sortAccounts<T extends { account: { roblox_id: string } }>(accounts: T[], order: string[]) {
  const rank = (a: T) => { const i = order.indexOf(a.account.roblox_id); return i < 0 ? order.length : i; };
  return [...accounts].sort((x, y) => rank(x) - rank(y));
}
