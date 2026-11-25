'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

interface Status { premium: boolean; state: string; expires_at?: string }

export default function ReiyaAccount() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus(null);
    setPending(true);
    try {
      const response = await fetch('/api/reiya/premium?action=key-status', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check your Premium key.');
      setStatus(data);
      setKey('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not check your Premium key.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link href="/reiya" className="text-sm text-white/70 underline underline-offset-4">Back to Reiya</Link>
      <h1 className="mt-4 text-4xl font-semibold text-white">My Reiya Premium</h1>
      <p className="mt-4 text-white/70">See purchases linked to your PayPal email in the <Link href="/client/dashboard" className="underline underline-offset-4">client dashboard</Link>, or check an activation key below.</p>
      <form onSubmit={check} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <label className="block text-sm text-white">
          <span>Activation key</span>
          <input type="password" required autoComplete="off" value={key} onChange={event => setKey(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            maxLength={80} />
        </label>
        <button disabled={pending || !key.trim()} className="rounded-full bg-white px-4 py-2 font-semibold text-black disabled:opacity-50">
          {pending ? 'Checking…' : 'Check Premium'}
        </button>
        {status && (
          <p role="status" className="text-sm text-white/80">
            {status.premium && status.expires_at
              ? 'Premium active through ' + new Date(status.expires_at).toLocaleDateString()
              : status.state === 'free' ? 'This key was not found in Seisen Premium.' : 'Premium status: ' + status.state}
          </p>
        )}
        {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      </form>
      <p className="mt-6 text-sm text-white/70">
        Manage recurring charges in PayPal. If you need help accessing your purchase, contact{' '}
        <a href="mailto:support@seisen.store" className="underline">Seisen support</a> with your PayPal purchase ID.
      </p>
    </div>
  );
}
