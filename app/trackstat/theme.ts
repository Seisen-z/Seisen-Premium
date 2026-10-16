'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { themeCookie, type Theme } from './themeConfig';

const listeners = new Set<() => void>();
let chosen: Theme | null = null;
const read = (): Theme => {
  if (chosen) return chosen;
  try { return localStorage.getItem(themeCookie) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
};
// `initial` is the theme the server read from the cookie, so the first paint already matches
export function useTrackstatTheme(initial: Theme = 'dark') {
  const theme = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, read, () => initial);
  // The cookie lets the server render the right theme next time (also covers a choice made before the cookie existed)
  useEffect(() => { document.cookie = `${themeCookie}=${theme}; path=/; max-age=31536000; samesite=lax`; }, [theme]);
  const toggle = () => {
    chosen = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(themeCookie, chosen); } catch { /* not remembered */ }
    listeners.forEach(listener => listener());
  };
  return { theme, toggle };
}
