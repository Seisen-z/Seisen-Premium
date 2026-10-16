'use client';
import { useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';
const storageKey = 'trackstat-theme';
const listeners = new Set<() => void>();
let chosen: Theme | null = null;
const read = (): Theme => {
  if (chosen) return chosen;
  try { return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
};
export function useTrackstatTheme() {
  const theme = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, read, () => 'dark' as Theme);
  const toggle = () => {
    chosen = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(storageKey, chosen); } catch { /* not remembered */ }
    listeners.forEach(listener => listener());
  };
  return { theme, toggle };
}
