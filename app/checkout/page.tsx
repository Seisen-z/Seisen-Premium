'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowLeft, Loader2, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = 'paypal' | 'robux';

type PriceInfo = {
  amount: number;
  currency: string;
  label: string;
  originalLabel?: string;
  period: string;
  billingNote: string;
};

type PlanConfig = {
  title: string;
  description: string;
  badge?: string | null;
  cardColor: string;
  features: string[];
  methods: PaymentMethod[];
  prices: Partial<Record<PaymentMethod, PriceInfo>>;
};

type DiscordSession = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string | null;
  tag: string;
};

const ROBUX_ITEM_URLS: Record<string, string> = {
  monthly:  'https://www.roblox.com/catalog/16902308978/Seisen-Hub-Monthly',
  lifetime: 'https://www.roblox.com/catalog/16906166414/Seisen-Hub-Perm',
};

// ─── Plan Config ──────────────────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, PlanConfig> = {
  monthly: {
    title: 'Monthly',
    description: 'Best for regular script users.',
    badge: '30 Days',
    cardColor: '#a08060',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    methods: ['paypal', 'robux'],
    prices: {
      paypal: { amount: 6,    currency: '€',  label: '€6',       period: '/month', billingNote: 'Billed once per month' },
      robux:  { amount: 1900, currency: 'R$', label: '1,900 R$', period: '/month', billingNote: '30 days · buy the item on Roblox, then verify' },
    },
  },
  annual: {
    title: 'Annual',
    description: 'Twelve months of access for the price of ten.',
    badge: '2 Months Free',
    cardColor: '#c9a97a',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', '2 months free', '50 HWID'],
    methods: ['paypal'],
    prices: { paypal: { amount: 60, currency: '€', label: '€60', period: '/year', billingNote: 'One-time payment · 12 months access' } },
  },
  annual_weekly: {
    title: 'Weekly',
    description: 'Weekly access, paid once for a full year.',
    badge: '2 Months Free',
    cardColor: '#b89060',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', '2 months free', '20 HWID'],
    methods: ['paypal'],
    prices: { paypal: { amount: 30, currency: '€', label: '€30', period: '/year', billingNote: 'One-time payment · 12 months access' } },
  },
  lifetime: {
    title: 'Lifetime',
    description: 'Pay once. Access forever.',
    badge: '28% OFF',
    cardColor: '#c9a97a',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    methods: ['paypal', 'robux'],
    prices: {
      paypal: { amount: 12,   currency: '€',  label: '€12',      originalLabel: '€14', period: '', billingNote: 'One-time payment' },
      robux:  { amount: 2600, currency: 'R$', label: '2,600 R$',                       period: '', billingNote: 'One-time · buy the item on Roblox, then verify' },
    },
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
  </svg>
);

const RobuxIcon = ({ className }: { className?: string }) => (
  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Robux_2019_Logo_gold.svg" alt="Robux" className={className} style={{ objectFit: 'contain' }} />
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readDiscordSession(): DiscordSession | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)discord_session=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(atob(decodeURIComponent(match[1]))); } catch { return null; }
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  paypal: 'PayPal',
  robux:  'Robux',
};

// ─── Checkout Content ─────────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const planKey       = searchParams.get('plan') ?? '';
  const plan          = PLAN_CONFIG[planKey];
  const methodParam   = (searchParams.get('method') ?? 'paypal') as PaymentMethod;

  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>(
    plan?.methods.includes(methodParam) ? methodParam : 'paypal'
  );
  const [methodStocks, setMethodStocks]       = useState<Record<string, Record<string, number>>>({});
  const [discordSession, setDiscordSession]   = useState<DiscordSession | null>(null);
  const [tosAccepted, setTosAccepted]         = useState(false);
  const [noRefundAccepted, setNoRefundAccepted] = useState(false);
  const [tosTimer, setTosTimer]               = useState(5);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [showRobuxModal, setShowRobuxModal]   = useState(false);
  const [robloxName, setRobloxName]         = useState('');
  const [robuxStarted, setRobuxStarted]       = useState(false);
  const [robuxState, setRobuxState]           = useState<string | null>(null);
  const [robuxCheckMsg, setRobuxCheckMsg]     = useState('');
  const [robuxChecking, setRobuxChecking]     = useState(false);
  const [robuxEmail, setRobuxEmail]           = useState('');
  const [statusModal, setStatusModal]         = useState<{
    isOpen: boolean; type: 'success' | 'error'; title: string; message: string; details?: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  // Redirect invalid plan
  useEffect(() => { if (!plan) router.replace('/premium'); }, []);

  // Load discord session
  useEffect(() => {
    const session = readDiscordSession();
    setDiscordSession(session);
    if (session?.email) setRobuxEmail(session.email);
  }, []);

  const robloxNameValid = /^[A-Za-z0-9_]{3,20}$/.test(robloxName.trim());

  // The signed Discord cookie is gone/expired: send the buyer back through Discord login
  const handleNeedsDiscordLogin = (message?: string) => {
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setDiscordSession(null);
    setRobuxStarted(false);
    setRobuxState(null);
    setRobuxCheckMsg(message || 'Please log in with Discord again to continue.');
  };

  const callRobux = async (payload: Record<string, unknown>) => {
    const res  = await fetch(`${getApiUrl()}/api/roblox/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: planKey, ...payload }),
    });
    return { res, data: await res.json() };
  };

  // Step 1: choose the Roblox account. The server takes a snapshot of the copies it already owns.
  const startRobux = async () => {
    if (!robloxNameValid) return;
    setRobuxChecking(true);
    setRobuxCheckMsg('');
    try {
      const { res, data } = await callRobux({ action: 'start', username: robloxName.trim() });
      if (data.needsLogin) handleNeedsDiscordLogin(data.error);
      else if (res.ok && data.success) { setRobuxStarted(true); setRobuxState(data.state); setRobuxCheckMsg(data.message || ''); }
      else { setRobuxStarted(false); setRobuxState(null); setRobuxCheckMsg(data.error || 'Could not check your inventory.'); }
    } catch {
      setRobuxCheckMsg('Connection error. Please try again.');
    }
    setRobuxChecking(false);
  };

  // Re-check after buying the item
  const recheckRobux = async () => {
    setRobuxChecking(true);
    try {
      const { res, data } = await callRobux({ action: 'check' });
      if (data.needsLogin) handleNeedsDiscordLogin(data.error);
      else if (data.needsStart) { setRobuxStarted(false); setRobuxState(null); setRobuxCheckMsg(data.error || ''); }
      else if (res.ok && data.success) { setRobuxState(data.state); setRobuxCheckMsg(data.message || ''); }
      else setRobuxCheckMsg(data.error || 'Could not check your inventory.');
    } catch {
      setRobuxCheckMsg('Connection error. Please try again.');
    }
    setRobuxChecking(false);
  };

  // Load stock
  useEffect(() => {
    fetch('/api/premium-stock')
      .then(r => r.json())
      .then(d => { if (d.methodStocks) setMethodStocks(d.methodStocks); })
      .catch(() => {});
  }, []);

  // Handle discord_error return
  useEffect(() => {
    const discordError = searchParams.get('discord_error');
    if (discordError) {
      router.replace(`/checkout?plan=${planKey}`, { scroll: false });
      const messages: Record<string, string> = {
        cancelled:         'Discord login was cancelled.',
        token_failed:      'Discord login failed. Please try again.',
        user_fetch_failed: 'Could not fetch your Discord profile.',
        server_error:      'A server error occurred during Discord login.',
      };
      setStatusModal({ isOpen: true, type: 'error', title: 'Discord Login Failed', message: messages[discordError] || 'Discord login failed.' });
    }
  }, [searchParams]);

  // Handle return from PayPal
  useEffect(() => {
    const token      = searchParams.get('token');
    if (token && !isProcessing) {
      router.replace(`/checkout?plan=${planKey}`, { scroll: false });
      capturePayPalOrder(token);
    }
  }, [searchParams]);

  // TOS countdown timer
  useEffect(() => {
    if (!tosAccepted || !noRefundAccepted) { setTosTimer(5); return; }
    const interval = setInterval(() => setTosTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [tosAccepted, noRefundAccepted]);

  if (!plan) return null;

  const priceInfo = plan.prices[paymentMethod] ?? plan.prices.paypal!;
  const r            = parseInt(plan.cardColor.slice(1, 3), 16);
  const g            = parseInt(plan.cardColor.slice(3, 5), 16);
  const b            = parseInt(plan.cardColor.slice(5, 7), 16);
  const returnUrl    = `/checkout?plan=${planKey}`;

  // Stock for current plan + payment method
  const currentStock = methodStocks[planKey]?.[paymentMethod] ?? null;
  const isOutOfStock = currentStock === 0;
  const robuxReady    = paymentMethod !== 'robux' || robuxStarted;
  const canPay       = !!discordSession && robuxReady && tosAccepted && noRefundAccepted && tosTimer === 0 && !isProcessing && !isOutOfStock;
  const stockDisplay = currentStock === null ? null
    : currentStock === 0  ? { text: 'Out of stock',               color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)' }
    : currentStock <= 10  ? { text: 'Low stock',                  color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' }
    :                       { text: 'In stock',                   color: '#86efac', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)' };

  // ── Payment handlers ────────────────────────────────────────────────────────
  const capturePayPalOrder = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });
      const data = await res.json();
      if (data.success && data.keys?.length > 0) {
        localStorage.setItem('client_email', data.payerEmail || '');
        localStorage.setItem('client_auth', 'true');
        setStatusModal({ isOpen: true, type: 'success', title: 'Purchase Successful!', message: 'Your key has been generated. Redirecting to receipt...' });
        setTimeout(() => {
          router.push(`/success?${new URLSearchParams({
            orderId: data.transactionId || 'PAYPAL',
            tier: data.tier,
            amount: String(data.amount),
            currency: String(data.currency),
            key: JSON.stringify(data.keys),
            email: data.payerEmail || '',
            payerId: data.payerId || '',
            method: 'paypal',
            date: new Date().toISOString(),
          })}`);
        }, 1200);
      } else {
        let msg = data.junkieError || data.error || 'No key returned from server';
        if (typeof msg === 'string' && msg.trim().startsWith('<')) msg = 'The key service is unavailable. Contact support with your PayPal transaction ID.';
        setStatusModal({ isOpen: true, type: 'error', title: 'Activation Failed', message: msg, details: data.junkieDetails });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'System Error', message: 'An unexpected error occurred.', details: err.message });
      setIsProcessing(false);
    }
  };

  const handlePayPalPay = async () => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planKey, amount: priceInfo.amount, quantity: 1, currency: 'EUR', description: 'Seisen Hub Premium Access' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Purchase Blocked', message: data.error || 'Unable to start checkout.' });
        setIsProcessing(false);
        return;
      }
      const approvalLink = data.links?.find((l: any) => l.rel === 'approve');
      if (approvalLink) { window.location.href = approvalLink.href; }
      else {
        setStatusModal({ isOpen: true, type: 'error', title: 'PayPal Error', message: 'Failed to create PayPal order. Please try again.' });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Connection Error', message: err.message || 'Failed to initiate payment.' });
      setIsProcessing(false);
    }
  };

  const verifyRobuxPurchase = async () => {
    const email = robuxEmail.trim();
    if (!robuxStarted || !email.includes('@')) return;
    setShowRobuxModal(false);
    setIsProcessing(true);
    try {
      const { data } = await callRobux({ action: 'claim', email });
      if (data.success && data.keys?.length > 0) {
        localStorage.setItem('client_email', email);
        localStorage.setItem('client_auth', 'true');
        setStatusModal({ isOpen: true, type: 'success', title: 'Purchase Verified!', message: 'Your key has been generated. Redirecting to receipt...' });
        setTimeout(() => {
          router.push(`/success?${new URLSearchParams({
            orderId: data.transactionId || `ROBLOX-${data.userId}-${data.tier}`,
            tier: data.tier,
            amount: String(priceInfo.amount),
            currency: 'ROBUX',
            key: JSON.stringify(data.keys),
            email,
            payerId: `ROBLOX_${data.userId}`,
            method: 'robux',
            date: new Date().toISOString(),
          })}`);
        }, 1200);
      } else {
        if (data.needsLogin) handleNeedsDiscordLogin(data.error);
        if (data.needsStart) setRobuxStarted(false);
        if (data.state) setRobuxState(data.state);
        setStatusModal({ isOpen: true, type: 'error', title: 'Verification Failed', message: data.error || 'Could not verify your purchase.' });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Connection Error', message: err.message || 'Failed to verify purchase.' });
      setIsProcessing(false);
    }
  };

  const handlePay = () => {
    if (!canPay) return;
    if (paymentMethod === 'paypal') { handlePayPalPay();       return; }
    setShowRobuxModal(true);
  };

  const handleDiscordLogout = () => {
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    fetch('/api/auth/discord/logout', { method: 'POST' }).catch(() => {});
    setDiscordSession(null);
    setRobuxStarted(false);
    setRobuxState(null);
  };

  const payButtonLabel = () => {
    if (isProcessing) return 'Processing...';
    const method = METHOD_LABELS[paymentMethod];
    return `Pay ${priceInfo.label} with ${method}`;
  };

  return (
    <div className="min-h-screen pt-14 pb-24 px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20">

      {/* ── Back + header ── */}
      <div className="mb-8">
        <Link
          href="/premium"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Premium
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Complete your purchase
          </h1>
          {plan.badge && (
            <span
              className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `rgba(${r},${g},${b},0.15)`, color: plan.cardColor, border: `1px solid rgba(${r},${g},${b},0.3)` }}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {plan.title} — {plan.description}
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid md:grid-cols-5 gap-6 lg:gap-10">

        {/* ── Left: Order Summary ── */}
        <div className="md:col-span-2">
          <div
            className="rounded-2xl p-6 sticky top-24"
            style={{
              background: `linear-gradient(160deg, rgba(${r},${g},${b},0.07) 0%, #090909 60%)`,
              border: `1px solid rgba(${r},${g},${b},0.2)`,
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: `rgba(${r},${g},${b},0.6)` }}>
              Order Summary
            </p>

            {/* Price */}
            <div className="mb-5">
              {priceInfo.originalLabel && (
                <div className="relative inline-flex items-center text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {priceInfo.originalLabel}
                  <div className="absolute inset-y-[45%] left-0 w-full h-px bg-red-500/60 -rotate-6" />
                </div>
              )}
              <div className="flex items-end gap-1">
                <span className="font-black text-white" style={{ fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {priceInfo.label}
                </span>
                {priceInfo.period && (
                  <span className="text-sm mb-1 ml-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{priceInfo.period}</span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{priceInfo.billingNote}</p>
            </div>

            {/* Stock indicator */}
            {stockDisplay && (
              <div
                className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 mb-5"
                style={{ backgroundColor: stockDisplay.bg, color: stockDisplay.color, border: `1px solid ${stockDisplay.border}` }}
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: stockDisplay.color }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: stockDisplay.color }} />
                </span>
                {stockDisplay.text} via {METHOD_LABELS[paymentMethod]}
              </div>
            )}

            <div className="h-px mb-5" style={{ backgroundColor: `rgba(${r},${g},${b},0.12)` }} />

            {/* Features */}
            <ul className="space-y-2.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `rgba(${r},${g},${b},0.15)` }}
                  >
                    <Check className="w-3 h-3" style={{ color: plan.cardColor }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Price note when method changes */}
            {plan.methods.length > 1 && paymentMethod !== 'paypal' && (
              <p className="text-xs mt-5 pt-5 border-t" style={{ color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.06)' }}>
                Showing {METHOD_LABELS[paymentMethod]} price. Switch method to compare.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Payment Flow ── */}
        <div className="md:col-span-3 space-y-4">

          {/* Payment Method */}
          {plan.methods.length > 1 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold text-white mb-3">Payment Method</p>
              <div className="flex flex-wrap gap-2">
                {plan.methods.map(method => {
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                      style={{
                        backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1.5px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                        color: active ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {method === 'paypal' && <img src="/images/paypal.png" alt="PayPal" className="w-4 h-4 object-contain" />}
                      {method === 'robux'  && <RobuxIcon className="w-4 h-4" />}
                      {METHOD_LABELS[method]}
                    </button>
                  );
                })}
              </div>
              {paymentMethod === 'robux' && (
                <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Price: <strong className="text-white">{plan.prices.robux!.label}</strong> · Buy the item on Roblox, then verify your username here
                </p>
              )}
            </div>
          )}

          {/* Discord Gate */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white">Discord Account</p>
              <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                Required
              </span>
            </div>

            {discordSession ? (
              <div className="flex items-center gap-3">
                <img
                  src={discordSession.avatar}
                  alt={discordSession.tag}
                  className="w-9 h-9 rounded-full ring-2 ring-[#5865F2]/40 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
                    <p className="text-white text-sm font-semibold truncate">{discordSession.tag}</p>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: 'rgba(88,101,242,0.6)' }}>ID: {discordSession.id}</p>
                </div>
                <button
                  onClick={handleDiscordLogout}
                  className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Connect your Discord account to verify your identity and handle any support requests.
                </p>
                <a href={`/api/auth/discord?return=${encodeURIComponent(returnUrl)}`}>
                  <button className="flex items-center gap-2.5 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors shadow-lg shadow-[#5865F2]/20">
                    <DiscordIcon className="w-4 h-4" />
                    Login with Discord
                  </button>
                </a>
              </div>
            )}
          </div>

          {/* Roblox Gate */}
          {paymentMethod === 'robux' && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white">Roblox Username</p>
                <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Required
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                {discordSession
                  ? 'Enter the Roblox account you will buy the item with. It becomes linked to your account here, and each purchase can only be claimed once.'
                  : 'Log in with Discord above first. Your Roblox account is linked to your account here.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={robloxName}
                  onChange={e => { setRobloxName(e.target.value); setRobuxStarted(false); setRobuxState(null); setRobuxCheckMsg(''); }}
                  onKeyDown={e => { if (e.key === 'Enter' && discordSession) startRobux(); }}
                  placeholder="Roblox username"
                  maxLength={20}
                  autoComplete="off"
                  disabled={!discordSession}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-40"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  onClick={startRobux}
                  disabled={!discordSession || robuxChecking || !robloxNameValid}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#fbbf24' }}
                >
                  {robuxChecking ? '...' : robuxStarted ? 'Update' : 'Continue'}
                </button>
              </div>
              {(robuxChecking || robuxStarted || robuxCheckMsg) && (
                <div
                  className="mt-3 flex items-center justify-between gap-2 text-xs rounded-lg px-3 py-2"
                  style={robuxState === 'claimable' || robuxState === 'retry'
                    ? { backgroundColor: 'rgba(74,222,128,0.08)', color: '#86efac', border: '1px solid rgba(74,222,128,0.15)' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span>
                    {robuxChecking ? 'Checking your inventory...'
                      : robuxCheckMsg ? robuxCheckMsg
                      : robuxState === 'claimable' ? `You own a new ${plan.title} item. Press Pay to claim your key.`
                      : `You don't own the ${plan.title} item yet. Press Pay to buy it on Roblox, then verify.`}
                  </span>
                  {robuxStarted && !robuxChecking && (
                    <button onClick={recheckRobux} className="underline shrink-0">Recheck</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Terms of Service */}
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', opacity: isOutOfStock ? 0.4 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto' }}>
            <p className="text-xs font-semibold text-white">Terms & Conditions</p>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs font-bold flex items-center gap-2 mb-1" style={{ color: '#f87171' }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> No Refund Policy
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.75)' }}>
                All sales are <strong>final</strong>. Once a key is generated, no refund will be issued for any reason.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.04)'; }}
            >
              <input
                type="checkbox"
                checked={noRefundAccepted}
                onChange={e => setNoRefundAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>
                I understand all sales are <strong>final</strong> and no refunds will be issued.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
            >
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={e => setTosAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                I have read and agree to the{' '}
                <a href="/legal" className="underline" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>.
              </span>
            </label>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: plan.cardColor,
              color: '#000',
              boxShadow: canPay ? `0 0 32px rgba(${r},${g},${b},0.3)` : 'none',
            }}
            onMouseEnter={e => { if (canPay) (e.currentTarget as HTMLElement).style.filter = 'brightness(0.88)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : isOutOfStock ? (
              'Out of stock — switch payment method'
            ) : tosAccepted && noRefundAccepted && tosTimer > 0 ? (
              `Please wait ${tosTimer}s...`
            ) : !discordSession ? (
              'Connect Discord to continue'
            ) : paymentMethod === 'robux' && !robuxStarted ? (
              'Enter your Roblox username to continue'
            ) : !tosAccepted || !noRefundAccepted ? (
              'Accept terms to continue'
            ) : (
              <>
                {paymentMethod === 'paypal' && <img src="/images/paypal.png" alt="" className="w-4 h-4 object-contain" />}
                {paymentMethod === 'robux'  && <RobuxIcon className="w-4 h-4" />}
                {payButtonLabel()}
              </>
            )}
          </button>

          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Secured by PayPal & Roblox · Protected by Discord verification
          </p>
        </div>
      </div>

      {/* ── Processing Overlay ── */}
      {isProcessing && !statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: plan.cardColor }} />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment...</h2>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Do not close this window. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ backgroundColor: '#0e0e0e', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
              statusModal.type === 'success' ? '' : 'bg-red-500/20'
            }`} style={statusModal.type === 'success' ? { backgroundColor: `rgba(${r},${g},${b},0.15)` } : {}}>
              {statusModal.type === 'success'
                ? <CheckCircle className="w-7 h-7" style={{ color: plan.cardColor }} />
                : <AlertCircle className="w-7 h-7 text-red-500" />}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{statusModal.title}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{statusModal.message}</p>
            {statusModal.details && (
              <div className="rounded-lg p-3 text-left mb-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Error Details</p>
                <code className="text-xs text-red-400 block break-words">{statusModal.details}</code>
              </div>
            )}
            <button
              onClick={() => setStatusModal(s => ({ ...s, isOpen: false }))}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={statusModal.type === 'success'
                ? { backgroundColor: plan.cardColor, color: '#000' }
                : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {statusModal.type === 'success' ? 'Continue' : 'Close and try again'}
            </button>
          </div>
        </div>
      )}

      {/* ── Robux Verification Modal ── */}
      {showRobuxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--text-muted)' }}>Robux · {priceInfo.label}</p>
                <h2 className="font-bold text-white text-base">{plan.title}</h2>
              </div>
              <button onClick={() => setShowRobuxModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-2">
                {[
                  `Buy the item on Roblox with the account @${robloxName.trim()}`,
                  'Come back here and press Verify Purchase',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="font-mono text-[10px] pt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>0{i + 1}</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step}</p>
                  </div>
                ))}
              </div>
              <a
                href={ROBUX_ITEM_URLS[planKey]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-black"
                style={{ backgroundColor: '#fbbf24' }}
              >
                <RobuxIcon className="w-4 h-4" /> Buy on Roblox ({priceInfo.label})
              </a>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Your Roblox inventory must be public so we can see the item. To renew, delete the item from your inventory and buy it again. The item creator and staff accounts cannot claim keys.
              </p>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Email (for your receipt)</label>
                <input
                  type="email"
                  value={robuxEmail}
                  onChange={e => setRobuxEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setShowRobuxModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button
                onClick={verifyRobuxPurchase}
                disabled={!robuxStarted || !robuxEmail.includes('@')}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: plan.cardColor }}
              >
                Verify Purchase
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
