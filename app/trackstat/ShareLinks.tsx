"use client";
import { useEffect, useState } from 'react';
import { Copy, Link2 } from 'lucide-react';
import { trackstatFetch } from '@/lib/client/trackstat-auth';
import type { TrackstatAccount } from '@/lib/trackstat';
import { button, card } from './ui';

type Share = { active: boolean; token?: string | null };

// A read-only page for one account that can be sent to anyone and turned off at any time
export default function ShareLinks({ accounts, nameOf }: { accounts: TrackstatAccount[]; nameOf: (a: TrackstatAccount) => string }) {
  const [shares, setShares] = useState<Record<string, Share>>({});
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<Record<string, string>>({});
  const ids = accounts.map(a => a.account.roblox_id).join(',');
  useEffect(() => {
    let live = true;
    for (const id of ids ? ids.split(',') : []) {
      void trackstatFetch(`/api/trackstat/share?roblox=${id}`, { cache: 'no-store' }).then(r => r.json()).then((s: Share) => { if (live) setShares(current => ({ ...current, [id]: s })); }).catch(() => {});
    }
    return () => { live = false; };
  }, [ids]);

  async function send(id: string, action: 'create' | 'revoke') {
    setBusy(id); setNote(current => ({ ...current, [id]: '' }));
    try {
      const response = await trackstatFetch('/api/trackstat/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roblox: id, action }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not update the link.');
      setShares(current => ({ ...current, [id]: body }));
      if (action === 'revoke') setNote(current => ({ ...current, [id]: 'Link turned off. Anyone using it now sees that it is not active.' }));
    } catch (error) { setNote(current => ({ ...current, [id]: error instanceof Error ? error.message : 'Could not update the link.' })); }
    finally { setBusy(''); }
  }
  const link = (token: string) => `${window.location.origin}/trackstat/share/${token}`;
  async function copy(id: string, token: string) {
    try { await navigator.clipboard.writeText(link(token)); setNote(current => ({ ...current, [id]: 'Link copied.' })); }
    catch { setNote(current => ({ ...current, [id]: 'Could not copy. Select the link and copy it.' })); }
  }

  return (
    <div className={`${card} p-5`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ts-fg"><Link2 size={15} className="text-ts-accent" />Share links</h3>
      <p className="mt-1 text-xs leading-5 text-ts-fg/45">Make a read-only page of an account&apos;s gains and status to send to a friend. They see no inventory and no key, and you can turn the link off at any time.</p>
      {accounts.length === 0 ? <p className="mt-4 text-xs text-ts-fg/40">Connect an account first.</p> : (
        <ul className="mt-4 space-y-3">
          {accounts.map(a => {
            const id = a.account.roblox_id, share = shares[id];
            return (
              <li key={id} className="rounded-xl bg-ts-fg/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-ts-fg">{nameOf(a)}</span>
                  {share?.active ? <button onClick={() => void send(id, 'revoke')} disabled={!!busy} className="rounded-lg px-3 py-1.5 text-sm text-ts-fg/55 hover:bg-ts-neg/10 hover:text-ts-neg disabled:opacity-40">Turn off</button>
                    : <button onClick={() => void send(id, 'create')} disabled={!!busy || !share} className={button}>{busy === id ? 'Creating…' : 'Create link'}</button>}
                </div>
                {share?.active && share.token && (
                  <div className="mt-2 flex gap-2">
                    <input readOnly value={link(share.token)} aria-label={`Share link for ${nameOf(a)}`} onFocus={e => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg bg-ts-inset px-3 py-2 font-mono text-xs text-ts-fg/80 outline-none focus-visible:ring-2 focus-visible:ring-ts-accent/40" />
                    <button onClick={() => void copy(id, share.token as string)} className={`${button} inline-flex items-center gap-2`}><Copy size={14} />Copy</button>
                  </div>
                )}
                {note[id] && <p role="status" className="mt-2 text-xs text-ts-fg/55">{note[id]}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
