"use client";
import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { trackstatFetch } from '@/lib/client/trackstat-auth';
import type { TrackstatAccount } from '@/lib/trackstat';
import { button, card } from './ui';

type Status = { configured: boolean; hint?: string | null };

// A Discord message when a Huge, Titanic or Gargantuan pet drops, set per Roblox account
export default function DiscordAlerts({ accounts, nameOf }: { accounts: TrackstatAccount[]; nameOf: (a: TrackstatAccount) => string }) {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const ids = accounts.map(a => a.account.roblox_id).join(',');
  useEffect(() => {
    let live = true;
    for (const id of ids ? ids.split(',') : []) {
      void trackstatFetch(`/api/trackstat/webhook?roblox=${id}`, { cache: 'no-store' }).then(r => r.json()).then((s: Status) => { if (live) setStatus(current => ({ ...current, [id]: s })); }).catch(() => {});
    }
    return () => { live = false; };
  }, [ids]);

  async function send(id: string, action: 'save' | 'remove' | 'test') {
    setBusy(`${id}:${action}`); setNote(current => ({ ...current, [id]: '' }));
    try {
      const response = await trackstatFetch('/api/trackstat/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roblox: id, action, url: drafts[id] }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not update the webhook.');
      if (action === 'test') setNote(current => ({ ...current, [id]: 'Test message sent. Check your Discord channel.' }));
      else {
        setStatus(current => ({ ...current, [id]: { configured: !!body.configured, hint: action === 'save' ? `…${(drafts[id] ?? '').slice(-4)}` : null } }));
        setDrafts(current => ({ ...current, [id]: '' }));
        setNote(current => ({ ...current, [id]: action === 'save' ? 'Saved. Use Test to check it.' : 'Alerts turned off.' }));
      }
    } catch (error) { setNote(current => ({ ...current, [id]: error instanceof Error ? error.message : 'Could not update the webhook.' })); }
    finally { setBusy(''); }
  }

  return (
    <div className={`${card} p-5`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ts-fg"><Bell size={15} className="text-ts-accent" />Discord alerts</h3>
      <p className="mt-1 text-xs leading-5 text-ts-fg/45">Get a message in a Discord channel when an account gets a Huge, Titanic or Gargantuan pet in Pet Simulator 99. In Discord open the channel&apos;s Edit → Integrations → Webhooks, create one, and paste its address here. It is kept private and never shown again.</p>
      {accounts.length === 0 ? <p className="mt-4 text-xs text-ts-fg/40">Connect an account first.</p> : (
        <ul className="mt-4 space-y-3">
          {accounts.map(a => {
            const id = a.account.roblox_id, on = status[id]?.configured;
            return (
              <li key={id} className="rounded-xl bg-ts-fg/[0.04] p-3">
                <div className="flex items-center justify-between gap-3"><span className="truncate text-sm text-ts-fg">{nameOf(a)}</span><span className={`flex items-center gap-1.5 text-xs ${on ? 'text-ts-pos' : 'text-ts-fg/40'}`}>{on && <Check size={12} />}{on ? 'Alerts on' : 'Off'}</span></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input value={drafts[id] ?? ''} onChange={e => setDrafts(current => ({ ...current, [id]: e.target.value }))} placeholder={on ? `Replace the saved webhook (${status[id]?.hint ?? ''})` : 'https://discord.com/api/webhooks/…'} aria-label={`Discord webhook for ${nameOf(a)}`} autoComplete="off" spellCheck={false} className="min-w-0 flex-1 basis-64 rounded-lg bg-ts-inset px-3 py-2 text-sm text-ts-fg outline-none placeholder:text-ts-fg/30 focus-visible:ring-2 focus-visible:ring-ts-accent/40" />
                  <button onClick={() => void send(id, 'save')} disabled={!!busy || !(drafts[id] ?? '').trim()} className={`${button} border-ts-accent/40 bg-ts-accent/10 text-ts-accent`}>{busy === `${id}:save` ? 'Saving…' : 'Save'}</button>
                  {on && <button onClick={() => void send(id, 'test')} disabled={!!busy} className={button}>{busy === `${id}:test` ? 'Sending…' : 'Test'}</button>}
                  {on && <button onClick={() => void send(id, 'remove')} disabled={!!busy} className="rounded-lg px-3 py-2 text-sm text-ts-fg/55 hover:bg-ts-neg/10 hover:text-ts-neg disabled:opacity-40">Remove</button>}
                </div>
                {note[id] && <p role="status" className="mt-2 text-xs text-ts-fg/55">{note[id]}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
