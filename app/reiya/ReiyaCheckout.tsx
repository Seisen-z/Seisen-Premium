'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { REIYA_PLANS, REIYA_TERMS_VERSION, type ReiyaPlan } from '@/lib/reiya-purchase';

const plans = ['monthly', 'yearly'] as const;
const primaryButton = 'inline-flex items-center justify-center rounded-full bg-white px-5 py-3 font-semibold text-black hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-45';

async function request<T>(path: string, body: object): Promise<T> {
  const response = await fetch('/api/reiya/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'The request could not be completed.');
  return data as T;
}

interface Props {
  checkoutEnabled: boolean;
  sandbox: boolean;
  purchaseId: string | undefined;
  cancelled: boolean;
}

export default function ReiyaCheckout({ checkoutEnabled, sandbox, purchaseId, cancelled }: Props) {
  const [plan, setPlan] = useState<ReiyaPlan>('yearly');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<'checkout' | 'receipt' | null>(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ key: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const selected = REIYA_PLANS[plan];

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkoutEnabled || !accepted || busy) return;
    setBusy('checkout');
    setError('');
    try {
      const result = await request<{ approvalUrl: string }>('checkout', { plan, accepted, termsVersion: REIYA_TERMS_VERSION });
      window.location.assign(result.approvalUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not start checkout.');
      setBusy(null);
    }
  }

  async function showReceipt() {
    if (!purchaseId || busy) return;
    setBusy('receipt');
    setError('');
    try {
      setReceipt(await request<{ key: string; emailed: boolean }>('receipt', { purchaseId }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not retrieve your key.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      {sandbox && <p role="status" className="text-sm font-semibold text-amber-200">PayPal Sandbox checkout</p>}

      {purchaseId ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-lg font-semibold text-white">Your Premium key</h3>
          {receipt ? (
            <>
              <p className="text-sm text-white/70">In Reiya, open Premium, paste your key, and select Activate. Keep your key private.</p>
              <input readOnly aria-label="Reiya Premium key" value={receipt.key} onFocus={event => event.target.select()}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white" />
              <button type="button" className={primaryButton} onClick={async () => {
                try { await navigator.clipboard.writeText(receipt.key); setCopied(true); }
                catch { setError('Select and copy the key manually.'); }
              }}>{copied ? 'Copied' : 'Copy key'}</button>
              {receipt.emailed && <p className="text-sm text-white/70">A copy was sent to your PayPal email.</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">Once PayPal confirms the first payment, you can retrieve your activation key here.</p>
              <button type="button" className={primaryButton} disabled={busy !== null} onClick={showReceipt}>
                {busy === 'receipt' ? 'Checking payment…' : 'Get my activation key'}
              </button>
            </>
          )}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={checkout}>
          {cancelled && <p role="status" className="text-sm text-white/75">You returned from PayPal checkout. Select a plan to start again.</p>}
          <fieldset className="grid gap-2 sm:grid-cols-2" disabled={busy !== null}>
            <legend className="mb-2 text-sm font-medium text-white">Billing plan</legend>
            {plans.map(value => (
              <label key={value} className={
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-white transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white/60 ' +
                (plan === value ? 'border-white/60 bg-white/10' : 'border-white/15 bg-white/[0.03] hover:border-white/40')
              }>
                <input type="radio" name="plan" value={value} checked={plan === value} className="size-4 shrink-0 accent-white"
                  onChange={() => { setPlan(value); setAccepted(false); }} />
                <span>
                  <strong className="block">{REIYA_PLANS[value].label}</strong>
                  <span className="text-sm text-white/75">€{REIYA_PLANS[value].amount} / {REIYA_PLANS[value].period}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm text-white/75" aria-live="polite">
              Recurring charge <strong className="text-base text-white">€{selected.amount} every {selected.period}</strong>
            </p>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
              <input type="checkbox" required className="mt-1 size-4 shrink-0 accent-white" checked={accepted}
                disabled={!checkoutEnabled || busy !== null} onChange={event => setAccepted(event.target.checked)} />
              <span>
                I agree to the <a href="/reiya/policies#terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and{' '}
                <a href="/reiya/policies#refunds" target="_blank" rel="noopener noreferrer" className="underline">Refund &amp; Cancellation Policy</a>.
                I authorize €{selected.amount} each {selected.period} until I cancel in PayPal.
              </span>
            </label>
            <button className={primaryButton + ' w-full'} disabled={!checkoutEnabled || !accepted || busy !== null}
              aria-describedby={!checkoutEnabled ? 'reiya-checkout-availability' : undefined}>
              {busy === 'checkout' ? 'Opening PayPal…' : 'Continue with PayPal'}
            </button>
            {!checkoutEnabled && (
              <p id="reiya-checkout-availability" role="status" className="text-sm text-white/75">
                PayPal checkout is currently unavailable on Seisen.
              </p>
            )}
            <a href="/reiya/policies#privacy" target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm text-white/75 underline underline-offset-4">Privacy Policy</a>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      <div className="border-t border-white/10 pt-4 text-sm">
        <Link href="/client/dashboard" className="font-semibold text-white underline underline-offset-4">Already have Reiya Premium?</Link>
        <p className="mt-1 text-white/70">Sign in to Seisen with the email from your PayPal receipt.</p>
      </div>
    </div>
  );
}
