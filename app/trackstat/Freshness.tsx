"use client";
import { useEffect, useState } from 'react';

// How current the page is, so it is clear when the library has stopped
export default function Freshness({ loadedAt, live, compact = false }: { loadedAt: number | null; live: boolean; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!loadedAt) return null;
  const seconds = Math.max(0, Math.round((now - loadedAt) / 1000));
  const age = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`;
  return (
    <p className="flex items-center gap-2 px-1 text-xs text-ts-fg/45" title={`Checked ${age} ago`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'animate-pulse bg-ts-pos' : 'bg-ts-fg/30'}`} />
      {!compact && <span className="truncate">{live ? 'Live' : 'Offline'} · updated {age} ago</span>}
    </p>
  );
}
