"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Moon, Sun } from 'lucide-react';
import type { TrackstatAccount, TrackstatHistory } from '@/lib/trackstat';
import Dashboard from './Dashboard';
import { useTrackstatTheme } from './theme';
import type { Theme } from './themeConfig';
import { Avatar, ago } from './ui';

// The read-only page behind a share link: the dashboard for one account, refreshed every minute
export default function SharedView({ data, avatar, initialTheme }: { data: TrackstatHistory; avatar: string | null; initialTheme: Theme }) {
  const router = useRouter();
  const { theme, toggle } = useTrackstatTheme(initialTheme);
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) router.refresh(); }, 60000);
    return () => clearInterval(timer);
  }, [router]);
  const account: TrackstatAccount = { ...data, index: 0, activeGames: data.activeGames ?? [] };
  const live = account.activeGames.length > 0;
  const last = data.sessions[0];
  return (
    <div data-ts-theme={theme} className="fixed inset-0 z-[200] overflow-auto bg-ts-bg">
      <div className="mx-auto max-w-5xl p-5 md:p-8">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <Avatar src={avatar} name={data.account.username} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-semibold text-ts-fg">{data.account.username}</h1>
            <p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/45'}`}><span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Live now' : last ? `Last synced ${ago(last.updated_at)}` : 'Not synced yet'}</p>
            <p className="mt-1 text-xs text-ts-fg/40">Shared read-only stats. Inventory and keys are not shown.</p>
          </div>
          <button onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="grid h-10 w-10 place-items-center rounded-full bg-ts-fg/[0.06] text-ts-fg/70 hover:text-ts-fg">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        </header>
        <Dashboard accounts={[account]} avatarOf={() => avatar} nameOf={a => a.account.username} single />
        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-ts-fg/35"><Activity size={13} />Tracked with <Link href="/" className="text-ts-fg/55 hover:text-ts-accent">Trackstat by Seisen Hub</Link></footer>
      </div>
    </div>
  );
}
