"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Pencil } from 'lucide-react';
import { trackstatAuth } from '@/lib/client/trackstat-auth';
import { TAP_SIMULATOR, PET_SIMULATOR_99, ANIME_DICE, type TrackstatAccount } from '@/lib/trackstat';
import { Avatar, button } from './ui';

const gameName: Record<string, string> = { [PET_SIMULATOR_99]: 'PS99', [TAP_SIMULATOR]: 'Tap Simulator', [ANIME_DICE]: 'Anime Dice' };

type Props = {
  accounts: TrackstatAccount[]; avatarOf: (id?: string) => string | null | undefined; nameOf: (a: TrackstatAccount) => string;
  rename: (robloxId: string, name: string) => void; move: (robloxId: string, direction: -1 | 1) => void;
  busy: boolean; onRemove: (index: number) => void; keyValue: string; setKey: (value: string) => void; onSubmit: (event: FormEvent) => void;
};

export default function ConnectionPage({ accounts, avatarOf, nameOf, rename, move, busy, onRemove, keyValue, setKey, onSubmit }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState('');
  useEffect(() => {
    let live = true;
    void trackstatAuth.auth.getSession().then(({ data }) => { if (live) setEmail(data.session?.user.email ?? null); });
    return () => { live = false; };
  }, []);
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-ts-fg">Library connection</h2>
      {accounts.length > 0 && (
        <ul className="mt-5 space-y-2">
          {accounts.map((a, position) => {
            const live = a.activeGames.some(g => g in gameName);
            const games = [...new Set(a.sessions.map(s => s.game_id).filter(g => g in gameName))];
            const robloxId = a.account.roblox_id;
            return (
              <li key={robloxId} className="rounded-xl bg-ts-fg/[0.04] p-3">
                <div className="flex items-center gap-3">
                  <Avatar src={avatarOf(robloxId)} name={a.account.username} small />
                  <span className="min-w-0 flex-1">
                    {editing === robloxId
                      ? <input autoFocus defaultValue={nameOf(a)} maxLength={30} aria-label="Account name" onBlur={e => { rename(robloxId, e.target.value); setEditing(''); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(''); }} className="w-full rounded-md bg-ts-inset px-2 py-1 text-sm text-ts-fg outline-none focus-visible:ring-2 focus-visible:ring-ts-accent/40" />
                      : <span className="flex items-center gap-1.5 text-sm text-ts-fg"><span className="truncate">{nameOf(a)}</span><button onClick={() => setEditing(robloxId)} aria-label={`Rename ${a.account.username}`} className="text-ts-fg/35 hover:text-ts-fg"><Pencil size={12} /></button></span>}
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ts-fg/40">
                      <span>ID {robloxId}</span>
                      <span className={`flex items-center gap-1.5 ${live ? 'text-ts-pos' : ''}`}><span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-ts-pos' : 'bg-ts-fg/30'}`} />{a.connectionStatus === 'reset' ? 'Key reset' : live ? 'Connected' : 'Offline'}</span>
                    </span>
                    {a.connectionStatus === 'reset' && <span className="mt-1 block text-xs text-ts-warn">Add the new key from the library to reconnect.</span>}
                    {games.length > 0 && <span className="mt-0.5 block text-xs text-ts-fg/35">{games.map(g => gameName[g] ?? g).join(' / ')}</span>}
                  </span>
                  <span className="flex shrink-0 flex-col">
                    <button onClick={() => move(robloxId, -1)} disabled={position === 0} aria-label={`Move ${a.account.username} up`} className="text-ts-fg/40 hover:text-ts-fg disabled:opacity-20"><ArrowUp size={14} /></button>
                    <button onClick={() => move(robloxId, 1)} disabled={position === accounts.length - 1} aria-label={`Move ${a.account.username} down`} className="text-ts-fg/40 hover:text-ts-fg disabled:opacity-20"><ArrowDown size={14} /></button>
                  </span>
                  <button className="rounded-md px-3 py-1.5 text-xs text-ts-fg/60 hover:bg-ts-neg/10 hover:text-ts-neg disabled:opacity-40" onClick={() => onRemove(a.index)} disabled={busy} aria-label={`Remove ${a.account.username}`}>Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label htmlFor="trackstat-key" className="block text-sm text-ts-fg/60">{accounts.length ? 'Add another account' : 'Connection key'}</label>
        <input id="trackstat-key" type="password" autoComplete="off" spellCheck={false} value={keyValue} onChange={e => setKey(e.target.value)} placeholder="sp_…" maxLength={67} required className="w-full min-w-0 rounded-lg border border-ts-fg/10 bg-ts-surface px-3 py-3 font-mono text-sm text-ts-fg outline-none focus:border-ts-accent" />
        <button className={`${button} w-full border-ts-accent/40 bg-ts-accent/10 text-ts-accent`} disabled={busy || !keyValue.trim()}>{busy ? 'Connecting…' : accounts.length ? 'Add account' : 'Connect account'}</button>
      </form>
      <p className="mt-4 text-xs leading-6 text-ts-fg/40">Run the library on each Roblox account, copy its key, and paste it here. You can connect up to 10 accounts. Names and order only change how they look in this browser.</p>
      <div className="mt-5 rounded-lg bg-ts-fg/[0.04] p-4 text-xs leading-6 text-ts-fg/50">
        {email
          ? <p><span className="text-ts-fg/75">Saved to {email}.</span> Sign in with this email in any other browser and these accounts open without pasting keys. A key that is saved to an email can only be added by that email.</p>
          : <p><span className="text-ts-fg/75">Only in this browser.</span> To open these accounts somewhere else, sign in with your email from the Account button. It is optional.</p>}
      </div>
    </div>
  );
}
