'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/lib/client/cart';
import { Minus, Plus, Trash2, ShoppingCart, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/utils';

type Status = 'idle' | 'creating' | 'processing' | 'success' | 'error';

function CartContent() {
  const { items, updateQty, removeItem, clearCart, total, count } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus]       = useState<Status>('idle');
  const [message, setMessage]     = useState('');
  const [resultKeys, setResultKeys] = useState<string[]>([]);
  const [txId, setTxId]           = useState('');

  // Capture PayPal return
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && status === 'idle') captureOrder(token);
    if (searchParams.get('canceled') === 'true') {
      setStatus('error');
      setMessage('Payment was cancelled.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const captureOrder = async (orderId: string) => {
    setStatus('processing');
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });
      const data = await res.json();

      if (data.success && data.keys?.length > 0) {
        setResultKeys(data.keys);
        setTxId(data.transactionId || '');
        clearCart();
        setStatus('success');

        // Store email for client area
        if (data.payerEmail) {
          try { localStorage.setItem('client_email', data.payerEmail); localStorage.setItem('client_auth', 'true'); } catch {}
        }
      } else {
        setStatus('error');
        setMessage(data.error || data.junkieError || 'Payment captured but keys were not generated. Contact support.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error.');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setStatus('creating');
    setMessage('');
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: { tier: string; quantity: number }) => ({ tier: i.tier, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Could not start checkout.');
        return;
      }
      const link = data.links?.find((l: any) => l.rel === 'approve');
      if (link) {
        window.location.href = link.href;
      } else {
        setStatus('error');
        setMessage('Could not get PayPal link. Try again.');
        setStatus('idle');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error.');
    }
  };

  const busy = status === 'creating' || status === 'processing';

  // ── Success screen ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-6">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-8 text-center space-y-4">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Order Complete!</h1>
          <p className="text-sm text-[#888]">Your keys have been generated. Save them now.</p>

          <div className="mt-4 space-y-2 text-left">
            {resultKeys.map((k, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-4 py-3">
                <code className="text-sm font-mono text-emerald-400 truncate">{k}</code>
                <button
                  onClick={() => navigator.clipboard?.writeText(k)}
                  className="text-xs text-[#555] hover:text-white transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          {txId && <p className="text-xs text-[#444] mt-2">Transaction: {txId}</p>}

          <div className="flex gap-3 mt-4">
            <Link href="/client/dashboard" className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors">
              My Account
            </Link>
            <Link href="/premium" className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center bg-[#1a1a1a] text-[#888] hover:text-white transition-colors">
              Buy More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0 && status !== 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
        <ShoppingCart className="w-10 h-10 text-[#333] mx-auto" />
        <h1 className="text-xl font-bold text-white">Your cart is empty</h1>
        <p className="text-sm text-[#555]">Add a plan from the premium page to get started.</p>
        <Link href="/premium" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: 'rgba(201,169,122,0.15)', color: '#c9a97a', border: '1px solid rgba(201,169,122,0.25)' }}>
          <ArrowLeft className="w-4 h-4" />
          View Plans
        </Link>
      </div>
    );
  }

  // ── Cart with items ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" style={{ color: '#c9a97a' }} />
            Cart
            <span className="text-base font-normal text-[#555]">({count} item{count !== 1 ? 's' : ''})</span>
          </h1>
        </div>
        <Link href="/premium" className="text-sm text-[#555] hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Add more
        </Link>
      </div>

      {/* Error */}
      {status === 'error' && message && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{message}</p>
        </div>
      )}

      {/* Processing */}
      {status === 'processing' && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: '#c9a97a' }} />
          <p className="text-sm text-[#888]">Processing your order…</p>
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] divide-y divide-[#131313] overflow-hidden">
        {items.map(item => (
          <div key={item.tier} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold capitalize">{item.label} Plan</p>
              <p className="text-xs text-[#555] mt-0.5">€{item.price.toFixed(2)} each</p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => updateQty(item.tier, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center text-[#888] hover:text-white transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-mono text-white">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.tier, item.quantity + 1)}
                disabled={item.quantity >= 5}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center text-[#888] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Line total */}
            <p className="w-16 text-right font-bold" style={{ color: '#c9a97a' }}>
              €{(item.price * item.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => removeItem(item.tier)}
              className="text-[#333] hover:text-red-400 transition-colors ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-5 space-y-3">
        <div className="flex justify-between text-sm text-[#666]">
          <span>Subtotal</span>
          <span className="text-white font-mono">€{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-[#444]">
          <span>Payment method</span>
          <span>PayPal</span>
        </div>
        <div className="pt-3 border-t border-[#1a1a1a] flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-2xl font-black" style={{ color: '#c9a97a' }}>€{total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={busy || items.length === 0}
          className="mt-2 w-full py-3.5 rounded-lg text-sm font-bold transition-[filter,opacity] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#c9a97a', color: '#000' }}
          onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLElement).style.filter = 'brightness(0.9)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{status === 'creating' ? 'Creating order…' : 'Processing…'}</>
          ) : (
            <>Pay with PayPal — €{total.toFixed(2)}</>
          )}
        </button>

        <p className="text-xs text-[#333] text-center">
          Keys are delivered instantly after payment. All sales are final.
        </p>
      </div>

    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-[#444]" />
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
