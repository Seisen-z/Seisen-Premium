"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { LogOut, MoreHorizontal, ShieldCheck, UserRound, Users, X } from 'lucide-react';
import { trackstatAuth } from '@/lib/client/trackstat-auth';
import { button } from './ui';

export default function AccountPopover({ count, onChange }: { count: number; onChange: (clear?: boolean) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const signingOut = useRef(false);
  useEffect(() => {
    let live = true;
    void trackstatAuth.auth.getSession().then(({ data }) => { if (live) setUser(data.session?.user ?? null); });
    const { data: { subscription } } = trackstatAuth.auth.onAuthStateChange((event, session) => {
      if (live) { setUser(session?.user ?? null); setTimeout(() => { if (live && !signingOut.current) onChange(event === 'SIGNED_OUT'); }, 0); }
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, [onChange]);
  async function signOut() {
    setBusy(true); setMessage('');
    signingOut.current = true;
    try {
      // Both run together and the page refreshes once afterwards instead of on every auth event
      const [response, { error }] = await Promise.all([fetch('/api/trackstat/profile', { method: 'DELETE' }), trackstatAuth.auth.signOut({ scope: 'local' })]);
      if (!response.ok) throw new Error('Could not clear this browser connection.');
      if (error) throw error;
      onChange(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign out failed.'); }
    finally { signingOut.current = false; setBusy(false); }
  }
  return <>
    <button popoverTarget="trackstat-account" className="flex w-full items-center gap-3 rounded-xl bg-ts-fg/[0.05] p-2.5 text-left hover:bg-ts-fg/[0.08]" aria-label="Open Account">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ts-accent/15 text-ts-accent"><UserRound size={17} /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium leading-tight text-ts-fg">Account</span><span className="block truncate text-xs text-ts-fg/45">{user?.email ?? 'Not signed in'}</span></span>
      <MoreHorizontal size={16} className="shrink-0 text-ts-fg/45" />
    </button>
    <div id="trackstat-account" popover="auto" role="dialog" aria-labelledby="trackstat-account-title" className="fixed inset-auto bottom-4 left-4 m-0 w-[min(340px,calc(100vw-32px))] rounded-2xl bg-ts-surface p-5 text-ts-fg shadow-[0_24px_90px_var(--ts-shadow)] md:left-[282px]">
      <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-ts-accent"><ShieldCheck size={17} /><h2 id="trackstat-account-title" className="text-sm font-semibold">Account</h2></div><button popoverTarget="trackstat-account" popoverTargetAction="hide" aria-label="Close account panel" className="p-1 text-ts-fg/40 hover:text-ts-fg"><X size={17} /></button></div>
      <div className="space-y-4">
        <div><p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ts-fg/35">{user ? 'Verified email' : 'Browser account'}</p><p className="break-all text-sm">{user?.email ?? 'Not signed in'}</p></div>
        <div className="flex items-center gap-3 rounded-lg border border-ts-fg/[0.07] bg-ts-fg/[0.025] p-3"><Users size={19} className="text-ts-accent" /><div className="flex-1 text-xs text-ts-fg/55">Connected Roblox accounts</div><span className="font-mono text-xl text-ts-fg">{count}</span></div>
        {user ? <button disabled={busy} onClick={() => void signOut()} className="flex items-center gap-2 text-xs text-ts-fg/50 hover:text-ts-fg"><LogOut size={14} />Sign out of this browser</button> : <Link href="/trackstat/login" className={`${button} block w-full text-center border-ts-accent/40 bg-ts-accent/10 text-ts-accent`}>Sign in</Link>}
      </div>
      {message && <p role="status" className="mt-4 text-xs leading-6 text-ts-accent-hover">{message}</p>}
    </div>
  </>;
}
