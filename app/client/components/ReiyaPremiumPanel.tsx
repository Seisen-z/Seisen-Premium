'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Purchase = {
  id: string;
  plan: string;
  purchasedAt: string;
  expiresAt: string;
  status: string;
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export default function ReiyaPremiumPanel({ email }: { email: string | null }) {
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [message, setMessage] = useState('');
  const [keyRecoveryAvailable, setKeyRecoveryAvailable] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<{ orderId: string; message: string; error: boolean } | null>(null);

  useEffect(() => {
    const request = new AbortController();

    async function load() {
      try {
        const response = await fetch('/api/client/reiya', { cache: 'no-store', signal: request.signal });
        if (response.status === 401) {
          setMessage('Sign out and sign in with the email from your PayPal receipt to see your Reiya purchases.');
          return;
        }
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!request.signal.aborted) {
          setPurchases(data.purchases);
          setKeyRecoveryAvailable(data.keyRecoveryAvailable === true);
        }
      } catch {
        if (!request.signal.aborted) setMessage('Reiya Premium purchases are temporarily unavailable.');
      }
    }

    if (email) void load();
    return () => request.abort();
  }, [email]);

  async function emailKey(orderId: string) {
    if (pendingOrder) return;
    setPendingOrder(orderId);
    setRecovery(null);
    try {
      const response = await fetch('/api/client/reiya', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }), cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || data.emailed !== true) {
        throw Error(typeof data.error === 'string' ? data.error : 'Could not email your key.');
      }
      setRecovery({ orderId, message: 'Key sent to your PayPal email.', error: false });
    } catch (error) {
      setRecovery({ orderId, message: error instanceof Error ? error.message : 'Could not email your key.', error: true });
    } finally {
      setPendingOrder(null);
    }
  }

  return (
    <section aria-labelledby="client-reiya" className="space-y-4 rounded-xl border border-[#252525] bg-[#101010] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="client-reiya" className="font-semibold text-white">Reiya Premium</h2>
        <Link href="/reiya" className="text-sm text-[var(--accent)] hover:underline">View Reiya Premium</Link>
      </div>
      {message ? <p role="status" className="text-sm text-white/70">{message}</p>
        : purchases === null ? <p role="status" className="text-sm text-white/70">Loading your Reiya purchases…</p>
        : purchases.length === 0 ? <p className="text-sm text-white/70">No Reiya Premium purchases match your verified email.</p>
        : (
          <ul className="divide-y divide-white/10">
            {purchases.map(purchase => (
              <li key={purchase.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_1fr_auto] sm:items-start sm:gap-4">
                <div>
                  <p className="font-semibold text-white">{purchase.plan === 'yearly' ? 'Yearly' : 'Monthly'}</p>
                  <p className="text-white/65">Purchased {dateFormat.format(new Date(purchase.purchasedAt))}</p>
                </div>
                {purchase.status === 'Active' || purchase.status === 'Expired' ? (
                  <p className="text-white/65">{purchase.status === 'Expired' ? 'Expired ' : 'Access through '}
                    {dateFormat.format(new Date(purchase.expiresAt))}
                  </p>
                ) : <span />}
                <div className="space-y-2">
                  <p className={purchase.status === 'Active' ? 'text-[var(--accent)]' : 'text-white/70'}>{purchase.status}</p>
                  {purchase.status === 'Active' && keyRecoveryAvailable && (
                    <button type="button" className="rounded-lg border border-white/20 px-3 py-2 font-medium text-white hover:bg-white/10 disabled:opacity-50"
                      disabled={pendingOrder !== null} onClick={() => void emailKey(purchase.id)}>
                      {pendingOrder === purchase.id ? 'Sending…' : 'Email me my key'}
                    </button>
                  )}
                  {recovery?.orderId === purchase.id && (
                    <p role={recovery.error ? 'alert' : 'status'} className={recovery.error ? 'text-red-200' : 'text-white/75'}>{recovery.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
