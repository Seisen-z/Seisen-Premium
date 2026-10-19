"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Moon, Sun } from 'lucide-react';
import { PET_SIMULATOR_99, STEAL_AN_EGG, ANIME_DICE, type CatalogEntry, type InventoryStack, type TrackstatAccount, type TrackstatHistory } from '@/lib/trackstat';
import Dashboard from './Dashboard';
import InventoryView from './InventoryView';
import { AnimeDiceInventory } from './AnimeDiceView';
import { InventoryView as SaeInventoryView } from './StealAnEggView';
import { useTrackstatTheme } from './theme';
import type { Theme } from './themeConfig';
import { Avatar, ago } from './ui';

type Game = 'ps' | 'sae' | 'ad';
type Loaded = { catalog: Record<string, CatalogEntry>; inventory: InventoryStack[] | null };
const gameName: Record<Game, string> = { ps: 'Pet Simulator 99', sae: 'Steal an Egg', ad: 'Anime Dice' };

// The read-only page behind a share link: the dashboard and the inventory of one account, refreshed every minute
export default function SharedView({ data, avatar, token, initialTheme }: { data: TrackstatHistory; avatar: string | null; token: string; initialTheme: Theme }) {
  const router = useRouter();
  const { theme, toggle } = useTrackstatTheme(initialTheme);
  const [game, setGame] = useState<Game | null>(null);
  const [loaded, setLoaded] = useState<Partial<Record<Game, Loaded>>>({});
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) router.refresh(); }, 60000);
    return () => clearInterval(timer);
  }, [router]);

  const withInventory = (id: string) => data.sessions.some(s => s.game_id === id && s.snapshot.has_inventory);
  const games = ([withInventory(PET_SIMULATOR_99) && 'ps', withInventory(STEAL_AN_EGG) && 'sae', withInventory(ANIME_DICE) && 'ad'].filter(Boolean)) as Game[];
  const shown = game && games.includes(game) ? game : games[0];
  useEffect(() => {
    if (!shown) return;
    // The inventory is fetched for the game being shown and refreshed every 5 minutes
    let live = true;
    const run = () => fetch(`/api/trackstat/share/inventory?token=${encodeURIComponent(token)}&game=${shown}`, { cache: 'no-store' }).then(r => r.json()).then((body: Loaded) => { if (live) setLoaded(current => ({ ...current, [shown]: body })); }).catch(() => {});
    void run();
    const timer = setInterval(() => { if (!document.hidden) void run(); }, 300000);
    return () => { live = false; clearInterval(timer); };
  }, [shown, token]);

  const account: TrackstatAccount = { ...data, index: 0, activeGames: data.activeGames ?? [] };
  const live = account.activeGames.length > 0;
  const last = data.sessions[0];
  const current = shown ? loaded[shown] : undefined;
  return (
    <div data-ts-theme={theme} className="fixed inset-0 z-[200] overflow-auto bg-ts-bg">
      <div className="p-5 md:p-8">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <Avatar src={avatar} name={data.account.username} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-semibold text-ts-fg">{data.account.username}</h1>
            <p className={`mt-1 flex items-center gap-2 text-sm ${live ? 'text-ts-pos' : 'text-ts-fg/45'}`}><span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-ts-pos' : 'bg-ts-fg/30'}`} />{live ? 'Live now' : last ? `Last synced ${ago(last.updated_at)}` : 'Not synced yet'}</p>
            <p className="mt-1 text-xs text-ts-fg/40">Shared read-only stats. The connection key is never shown.</p>
          </div>
          <button onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="grid h-10 w-10 place-items-center rounded-full bg-ts-fg/[0.06] text-ts-fg/70 hover:text-ts-fg">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        </header>
        <Dashboard accounts={[account]} avatarOf={() => avatar} nameOf={a => a.account.username} single />
        {shown && (
          <section className="mt-8" aria-label="Inventory">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ts-fg">Inventory</h2>
              {games.length > 1 && <div className="flex gap-1" role="group" aria-label="Game">{games.map(id => <button key={id} aria-pressed={shown === id} onClick={() => setGame(id)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${shown === id ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`}>{gameName[id]}</button>)}</div>}
            </div>
            {shown === 'ps'
              ? <InventoryView stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />
              : shown === 'ad' ? <AnimeDiceInventory stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />
              : <SaeInventoryView stacks={current?.inventory ?? undefined} catalog={current?.catalog ?? {}} loading={!current} />}
          </section>
        )}
        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-ts-fg/35"><Activity size={13} />Tracked with <Link href="/" className="text-ts-fg/55 hover:text-ts-accent">Trackstat by Seisen Hub</Link></footer>
      </div>
    </div>
  );
}
