'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, readDiscordSession } from '@/lib/client/auth';
import { Calendar, CheckCircle, Clock, Key, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

type Status = 'idle' | 'creating' | 'processing' | 'success' | 'error';

function RenewContent() {
  const { email, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData]           = useState<any>(null);
  const [fetching, setFetching]   = useState(true);
  const [status, setStatus]       = useState<Status>('idle');
  const [message, setMessage]     = useState('');
  const [newExpiry, setNewExpiry] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/client/login');
  }, [isLoading, isAuthenticated, router]);

  // Load subscription data
  useEffect(() => {
    if (isAuthenticated && email) {
      fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(json => { if (json.success) setData(json.data); })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated, email]);

  // Handle PayPal return redirect with token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && status === 'idle') {
      captureRenewal(token);
    }
    if (searchParams.get('canceled') === 'true') {
      setStatus('error');
      setMessage('Payment was cancelled.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const captureRenewal = async (orderId: string) => {
    setStatus('processing');
    setMessage('');
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/renew-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        setNewExpiry(json.newExpiresAt ?? null);
      } else {
        setStatus('error');
        setMessage(json.error || 'Renewal failed. Contact support.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error.');
    }
  };

  const handleRenew = async () => {
    setStatus('creating');
    setMessage('');
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/create-renew-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(json.error || 'Could not start checkout.');
        return;
      }
      const approvalLink = json.links?.find((l: any) => l.rel === 'approve');
      if (approvalLink) {
        window.location.href = approvalLink.href;
      } else {
        setStatus('error');
        setMessage('Could not get PayPal approval link. Try again.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error.');
    }
  };

  if (isLoading || !isAuthenticated) return null;

  const subscription = data?.subscription ?? null;
  const isMonthly    = subscription?.tier?.toLowerCase() === 'monthly';
  const daysLeft     = subscription?.daysRemaining ?? null;
  const isExpired    = daysLeft !== null && daysLeft <= 0;
  const expiresAt    = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;

  // Key from most recent monthly order
  const monthlyOrder = data?.orders?.find((o: any) =>
    (o.tier || '').toLowerCase() === 'monthly' &&
    (o.payment_status === 'COMPLETED' || o.payment_status === 'paid') &&
    Array.isArray(o.generated_keys) && o.generated_keys.length > 0
  );
  const keyValue: string | null = monthlyOrder?.generated_keys?.[0] ?? null;
  const maskedKey = keyValue
    ? keyValue.slice(0, 6) + '••••••••••••••••' + keyValue.slice(-6)
    : null;

  const busy = status === 'creating' || status === 'processing';

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-purple-400" />
          Renew Monthly Key
        </h1>
        <p className="text-sm text-[#555] mt-1">Extend your existing key by 30 days.</p>
      </div>

      {/* Success state */}
      {status === 'success' && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-white font-semibold">Key renewed successfully!</p>
              {newExpiry && (
                <p className="text-sm text-emerald-400 mt-0.5">
                  New expiry: {new Date(newExpiry).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/client/dashboard')}
            className="mt-2 w-full py-2.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && message && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{message}</p>
        </div>
      )}

      {/* Processing */}
      {status === 'processing' && (
        <div className="rounded-xl border border-purple-500/25 bg-purple-500/8 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
          <p className="text-sm text-purple-300">Processing your renewal…</p>
        </div>
      )}

      {/* Only show the renewal card when not yet succeeded */}
      {status !== 'success' && (
        <>
          {/* Current subscription card */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide">Current Subscription</h2>

            {fetching ? (
              <div className="flex items-center gap-2 text-[#555]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : !isMonthly ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">
                  You don't have an active monthly plan. Renewal is only available for monthly keys.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#888]">
                    <Clock className="w-4 h-4" />
                    Status
                  </div>
                  <span className={`text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                  </span>
                </div>

                {expiresAt && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#888]">
                      <Calendar className="w-4 h-4" />
                      Expires
                    </div>
                    <span className="text-sm text-white">
                      {expiresAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}

                {maskedKey && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#888]">
                      <Key className="w-4 h-4" />
                      Key
                    </div>
                    <code className="text-xs text-purple-400 font-mono">{maskedKey}</code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Renewal offer card */}
          {isMonthly && !fetching && (
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide">Renewal</h2>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">+30 Days Access</p>
                  <p className="text-sm text-[#666] mt-0.5">
                    Extends your existing key — no need to redeem anything new.
                  </p>
                  {expiresAt && (
                    <p className="text-xs text-purple-400 mt-2">
                      New expiry: {new Date(
                        Math.max(expiresAt.getTime(), Date.now()) + 30 * 86_400_000
                      ).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-white">€6</p>
                  <p className="text-xs text-[#555]">one-time</p>
                </div>
              </div>

              <button
                onClick={handleRenew}
                disabled={busy}
                className="w-full py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: '#c084fc', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === 'creating' ? 'Creating order…' : 'Processing…'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Renew with PayPal — €6
                  </>
                )}
              </button>

              <p className="text-xs text-[#444] text-center">
                Secure payment via PayPal. No subscription — single charge only.
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default function RenewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-[#444]" />
      </div>
    }>
      <RenewContent />
    </Suspense>
  );
}
