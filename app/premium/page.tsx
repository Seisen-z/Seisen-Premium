'use client';

import { useState, useEffect, Suspense } from 'react';
import { Crown, Check, HelpCircle, CreditCard, Copy, X, Loader2, AlertCircle, CheckCircle, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import PricingCard from '@/components/ui/PricingCard';
import PurchaseCounter from '@/components/ui/PurchaseCounter';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getApiUrl, copyToClipboard } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CartItem,
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  getCartTotal,
  getCartCount,
} from '@/lib/client/cart';

type PaymentMethod = 'paypal' | 'robux' | 'gcash' | 'card';
type PremiumTier = 'weekly' | 'monthly' | 'lifetime';
type MethodStockMap = Record<PaymentMethod, Record<PremiumTier, number>>;

type DiscordSession = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string | null;
  tag: string;
};

function readDiscordSession(): DiscordSession | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)discord_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(atob(decodeURIComponent(match[1])));
  } catch {
    return null;
  }
}

const defaultMethodStockMap = (): MethodStockMap => ({
  paypal: { weekly: 0, monthly: 0, lifetime: 0 },
  robux:  { weekly: 0, monthly: 0, lifetime: 0 },
  gcash:  { weekly: 0, monthly: 0, lifetime: 0 },
  card:   { weekly: 0, monthly: 0, lifetime: 0 },
});

// Updated PayPal prices: Monthly €6, Lifetime €12
const paypalPlans = [
  {
    title: 'Weekly',
    badge: '7 Days',
    price: 3,
    currency: '€',
    period: '/week',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
    plan: 'weekly',
  },
  {
    title: 'Monthly',
    badge: '30 Days',
    price: 6,
    currency: '€',
    period: '/month',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    plan: 'monthly',
  },
  {
    title: 'Lifetime',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    plan: 'lifetime',
    price: 12,
    originalPrice: 14,
    badge: '14% OFF',
    badgeVariant: 'best-value' as const,
    featured: true,
  },
];

const robuxPlans = [
  {
    title: 'Weekly',
    badge: '7 Days',
    price: 750,
    currency: '',
    period: '',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
    plan: 'weekly',
  },
  {
    title: 'Monthly',
    badge: '30 Days',
    price: 1400,
    currency: '',
    period: '',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    plan: 'monthly',
  },
  {
    title: 'Lifetime',
    badge: '16% OFF',
    badgeVariant: 'best-value' as const,
    price: 2600,
    originalPrice: 3100,
    currency: '',
    period: '',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    plan: 'lifetime',
    featured: true,
  },
];

const gcashPlans = [
  {
    title: 'Weekly',
    badge: '7 Days',
    price: 250,
    currency: '₱',
    period: '/week',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
    plan: 'weekly',
  },
  {
    title: 'Monthly',
    badge: '30 Days',
    price: 430,
    currency: '₱',
    period: '/month',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    plan: 'monthly',
  },
  {
    title: 'Lifetime',
    badge: '18% OFF',
    badgeVariant: 'best-value' as const,
    price: 850,
    originalPrice: 1000,
    currency: '₱',
    period: 'one-time',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    plan: 'lifetime',
    featured: true,
  },
];

const cardPlans = [
  {
    title: 'Weekly',
    badge: '7 Days',
    price: 3,
    currency: '€',
    period: '/week',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
    plan: 'weekly',
  },
  {
    title: 'Monthly',
    badge: '30 Days',
    price: 6,
    currency: '€',
    period: '/month',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    plan: 'monthly',
  },
  {
    title: 'Lifetime',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    plan: 'lifetime',
    price: 12,
    originalPrice: 14,
    badge: '14% OFF',
    badgeVariant: 'best-value' as const,
    featured: true,
  },
];

const faqs = [
  {
    question: 'How do I get premium?',
    answer: "Choose your preferred payment method and plan, then complete the payment. You'll receive instant access!",
  },
  {
    question: "What's included?",
    answer: 'All premium scripts, no key system, priority support, early access to new features, and exclusive updates.',
  },
  {
    question: 'Refund Policy',
    answer: 'All sales are final. We do not offer refunds, so please make sure you are certain before purchasing.',
  },
  {
    question: 'Need help?',
    answer: 'Join our Discord server for support or open a ticket for payment assistance.',
  },
];

// ─── Quantity Stepper ─────────────────────────────────────────────────────────
function QuantityStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const maxVal = max ?? 10;
  return (
    <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-1">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
        disabled={value <= 1}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-6 text-center text-white text-sm font-mono font-medium select-none">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(maxVal, value + 1))}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
        disabled={value >= maxVal}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({
  isOpen,
  cart,
  onClose,
  onRemove,
  onUpdateQty,
  onCheckout,
  onClear,
  isProcessing,
}: {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onRemove: (plan: string) => void;
  onUpdateQty: (plan: string, qty: number) => void;
  onCheckout: () => void;
  onClear: () => void;
  isProcessing: boolean;
}) {
  const total = getCartTotal(cart);
  const count = getCartCount(cart);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-[#111] border-l border-[#2a2a2a] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 accent-text" />
            Cart
            {count > 0 && (
              <span className="accent-bg text-white text-xs px-2 py-0.5 rounded-full font-medium ml-1">
                {count}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs mt-1 opacity-60">Add PayPal plans to checkout</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.plan}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold capitalize">{item.title} Plan</p>
                    <p className="text-gray-500 text-xs">€{item.pricePerUnit} / key</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.plan)}
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={qty => onUpdateQty(item.plan, qty)}
                    max={10}
                  />
                  <span className="text-white font-mono font-semibold">
                    €{(item.pricePerUnit * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-[#2a2a2a] p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Subtotal ({count} {count === 1 ? 'key' : 'keys'})</span>
              <span className="text-white font-bold text-lg">€{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 text-center">+ VAT if applicable</p>

            <Button
              className="w-full"
              onClick={onCheckout}
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Checkout with PayPal</>
              )}
            </Button>

            <button
              onClick={onClear}
              className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Discord SVG Icon ─────────────────────────────────────────────────────────
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
);

// ─── Discord Account Badge ────────────────────────────────────────────────────
function DiscordAccountBadge({
  session,
  onLogout,
  onChangeAccount,
}: {
  session: DiscordSession;
  onLogout: () => void;
  onChangeAccount: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#5865F2]/10 border border-[#5865F2]/25 rounded-2xl px-4 py-3 w-full max-w-md mx-auto">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={session.avatar}
          alt={session.tag}
          className="w-10 h-10 rounded-full ring-2 ring-[#5865F2]/50"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111]" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
          <p className="text-white text-sm font-semibold truncate">{session.tag}</p>
        </div>
        <p className="text-[#5865F2]/70 text-xs truncate">ID: {session.id}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onChangeAccount}
          title="Switch Discord Account"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5865F2] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 hover:border-[#5865F2]/40 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Switch
        </button>
        <button
          onClick={onLogout}
          title="Logout"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── Discord Login Banner (not logged in) ─────────────────────────────────────
function DiscordLoginBanner({ returnTo = '/premium' }: { returnTo?: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-3 w-full max-w-md mx-auto">
      <div className="w-9 h-9 rounded-xl bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
        <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-semibold">Discord not connected</p>
        <p className="text-gray-500 text-xs">Required to purchase</p>
      </div>
      <a href={`/api/auth/discord?return=${encodeURIComponent(returnTo)}`} className="flex-shrink-0">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors shadow shadow-[#5865F2]/30">
          <DiscordIcon className="w-3.5 h-3.5" />
          Login
        </button>
      </a>
    </div>
  );
}

// ─── Discord Login Modal ─────────────────────────────────────────────────────
function DiscordLoginModal({
  onClose,
  returnTo = '/premium',
  isSwitching = false,
  currentSession = null,
}: {
  onClose: () => void;
  returnTo?: string;
  isSwitching?: boolean;
  currentSession?: { tag: string; avatar: string; id: string } | null;
}) {
  const handleSwitchConfirm = () => {
    // Only now clear the cookie and navigate to Discord OAuth
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = `/api/auth/discord?return=${encodeURIComponent(returnTo)}`;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 relative overflow-hidden">
        {/* Purple glow accent */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#5865F2]/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {/* Discord logo */}
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/40">
            <DiscordIcon className="w-9 h-9 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isSwitching ? 'Switch Discord Account' : 'Login Required'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isSwitching
                ? 'You will be redirected to Discord to log in with a different account.'
                : 'Connect your Discord account before purchasing. This lets us verify your identity and handle any support or refund requests.'}
            </p>
          </div>

          {/* Show current account when switching */}
          {isSwitching && currentSession && (
            <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
              <img src={currentSession.avatar} alt={currentSession.tag} className="w-9 h-9 rounded-full ring-2 ring-[#5865F2]/30 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Currently signed in as</p>
                <p className="text-white text-sm font-semibold truncate">{currentSession.tag}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="#5865F2" className="w-4 h-4 flex-shrink-0 opacity-60"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" /></svg>
            </div>
          )}

          {!isSwitching && (
            <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-left space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Why Discord?</p>
              <ul className="space-y-1.5">
                {[
                  '✅ Verify your identity for purchases',
                  '🔍 Track your order for support',
                  '💸 Required for any refund requests',
                ].map((item) => (
                  <li key={item} className="text-sm text-gray-300">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {isSwitching ? (
            // Confirm switch — two explicit buttons
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleSwitchConfirm}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all duration-200 shadow-lg shadow-[#5865F2]/30"
              >
                <DiscordIcon className="w-5 h-5" />
                Yes, Switch Account
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-6 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-300 font-medium text-sm transition-colors"
              >
                Cancel — Keep Current Account
              </button>
            </div>
          ) : (
            <a
              href={`/api/auth/discord?return=${encodeURIComponent(returnTo)}`}
              className="w-full"
            >
              <button className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all duration-200 shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50">
                <DiscordIcon className="w-5 h-5" />
                Login with Discord
              </button>
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
function PremiumContent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [showTosModal, setShowTosModal] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ plan: string; amount: number; price: number; quantity: number } | null>(null);

  const [showRobuxModal, setShowRobuxModal] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [email, setEmail] = useState('');
  const [robuxDetails, setRobuxDetails] = useState<{ plan: string; price: number; productId: number } | null>(null);

  const [showGcashModal, setShowGcashModal] = useState(false);
  const [gcashDetails, setGcashDetails] = useState<{ plan: string; price: number } | null>(null);
  const [isGcashQrExpanded, setIsGcashQrExpanded] = useState(false);

  const [showCardModal, setShowCardModal] = useState(false);
  const [cardDetails, setCardDetails] = useState<{ plan: string; price: number } | null>(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<{ plan: string; amount: number; currency: string } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusModal, setStatusModal] = useState<{
      isOpen: boolean;
      type: 'success' | 'error';
      title: string;
      message: string;
      details?: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [stockMap, setStockMap] = useState<MethodStockMap>(defaultMethodStockMap());
  const [stockLoading, setStockLoading] = useState(true);

  // Per-card quantity state (PayPal only) — keyed by plan
  const [quantities, setQuantities] = useState<Record<string, number>>({ weekly: 1, monthly: 1, lifetime: 1 });

  // Discord session
  const [discordSession, setDiscordSession] = useState<DiscordSession | null>(null);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load cart + Discord session on mount; auto-resume pending payment intent
  useEffect(() => {
    setCart(getCart());
    const session = readDiscordSession();
    setDiscordSession(session);

    if (session) {
      const raw = localStorage.getItem('discord_payment_intent');
      if (raw) {
        localStorage.removeItem('discord_payment_intent');
        try {
          const intent = JSON.parse(raw);
          // Small delay so state settles first
          setTimeout(() => {
            if (intent.method === 'paypal') {
              setQuantities(q => ({ ...q, [intent.plan]: intent.qty || 1 }));
              setPendingPlan({ plan: intent.plan, amount: intent.price, price: intent.price, quantity: intent.qty || 1 });
              setShowTosModal(true);
            } else if (intent.method === 'robux') {
              let productId = 1781366430;
              if (intent.plan === 'weekly')  productId = 1779578553;
              if (intent.plan === 'monthly') productId = 1781384489;
              setRobuxDetails({ plan: intent.plan, price: intent.price, productId });
              setRobloxUsername('');
              setEmail('');
              setShowRobuxModal(true);
            } else if (intent.method === 'gcash') {
              setGcashDetails({ plan: intent.plan, price: intent.price });
              setShowGcashModal(true);
            } else if (intent.method === 'card') {
              setCardDetails({ plan: intent.plan, price: intent.price });
              setShowCardModal(true);
            }
          }, 400);
        } catch { /* ignore bad intent */ }
      }
    }
  }, []);

  // Handle discord_error query param from OAuth callback
  useEffect(() => {
    const discordError = searchParams.get('discord_error');
    if (discordError) {
      router.replace('/premium', { scroll: false });
      const messages: Record<string, string> = {
        cancelled:         'Discord login was cancelled.',
        token_failed:      'Discord login failed. Please try again.',
        user_fetch_failed: 'Could not fetch your Discord profile. Please try again.',
        server_error:      'A server error occurred during Discord login.',
      };
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Discord Login Required',
        message: messages[discordError] || 'Discord login failed. Please try again.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !isProcessing) {
      router.replace('/premium', { scroll: false });
      capturePayPalOrder(token);
    }
  }, [searchParams]);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const method = searchParams.get('method');
    if (paymentSuccess === 'true' && method === 'gcash') {
      router.replace('/premium', { scroll: false });
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Payment Successful! 🎉',
        message: 'Your GCash payment was received! Your premium key will be sent to your email shortly. Check your inbox (and spam folder).'
      });
      loadPremiumStocks();
    }
  }, [searchParams]);

  const loadPremiumStocks = async () => {
    try {
      const response = await fetch('/api/premium-stock', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load stock');
      const data = await response.json();
      if (data?.methodStocks) {
        const ms = data.methodStocks;
        const map = defaultMethodStockMap();
        for (const method of ['paypal', 'robux', 'gcash', 'card'] as PaymentMethod[]) {
          for (const tier of ['weekly', 'monthly', 'lifetime'] as PremiumTier[]) {
            map[method][tier] = Number(ms[tier]?.[method] || 0);
          }
        }
        setStockMap(map);
      }
    } catch (error) {
      console.error('Failed to load premium stocks:', error);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    loadPremiumStocks();
  }, []);

  const getTierStock = (tier: string) => {
    if (tier === 'weekly' || tier === 'monthly' || tier === 'lifetime') {
      return stockMap[paymentMethod][tier];
    }
    return 0;
  };

  // ─── Cart helpers ────────────────────────────────────────────────────────────
  const handleAddToCart = (plan: string, pricePerUnit: number, title: string) => {
    const qty = quantities[plan] || 1;
    const updated = addToCart({ plan, title, quantity: qty, pricePerUnit, currency: 'EUR' });
    setCart(updated);
    setAddedFeedback(plan);
    setTimeout(() => setAddedFeedback(null), 1500);
  };

  const handleCartRemove = (plan: string) => {
    setCart(removeFromCart(plan));
  };

  const handleCartUpdateQty = (plan: string, qty: number) => {
    setCart(updateCartItemQuantity(plan, qty));
  };

  const handleCartClear = () => {
    clearCart();
    setCart([]);
  };

  // Checkout all cart items as ONE PayPal order per item (sequential) or as a single order
  // We do one PayPal order per cart item for simplicity and stock correctness
  const handleCartCheckout = () => {
    if (cart.length === 0) return;
    // Use TOS modal with the first item — we'll iterate after TOS acceptance
    const firstItem = cart[0];
    setPendingPlan({
      plan: firstItem.plan,
      amount: firstItem.pricePerUnit,
      price: firstItem.pricePerUnit,
      quantity: firstItem.quantity,
    });
    setShowTosModal(true);
  };

  // ─── PayPal capture ──────────────────────────────────────────────────────────
  const capturePayPalOrder = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });

      const data = await response.json();

      if (data.success && data.keys && data.keys.length > 0) {
        // Clear cart on success
        clearCart();
        setCart([]);

        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Purchase Successful!',
          message: `${data.keys.length > 1 ? `${data.keys.length} keys have` : 'Your key has'} been generated. Redirecting you to the receipt...`
        });

        // Auto-Login
        localStorage.setItem('client_email', data.payerEmail || '');
        localStorage.setItem('client_auth', 'true');

        setTimeout(() => {
          const params = new URLSearchParams({
            orderId: data.transactionId || 'PAYPAL',
            tier: data.tier,
            amount: String(data.amount),
            currency: String(data.currency),
            key: JSON.stringify(data.keys),   // Pass all keys as JSON
            email: data.payerEmail || '',
            payerId: data.payerId || '',
            method: 'paypal',
            date: new Date().toISOString()
          });
          router.push(`/success?${params.toString()}`);
        }, 1000);

      } else {
        let rawError: string = data.junkieError || data.error || 'No key returned from server';
        if (typeof rawError === 'string' && rawError.trim().startsWith('<')) {
          rawError = 'The key service is currently unavailable. Please contact support with your PayPal transaction ID.';
        }
        const errorDetails = data.junkieDetails != null ? `${data.junkieDetails}` : undefined;

        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'Activation Failed',
          message: rawError,
          details: errorDetails
        });
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Capture error:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'System Error',
        message: 'An unexpected error occurred while processing your payment.',
        details: error.message
      });
      setIsProcessing(false);
    }
  };

  // ─── Discord logout / switch ──────────────────────────────────────────────────
  const handleDiscordLogout = () => {
    // Expire the cookie
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setDiscordSession(null);
  };

  const handleDiscordSwitchAccount = () => {
    // Just open the confirm modal — do NOT clear session yet
    setIsSwitchingAccount(true);
    setShowDiscordModal(true);
  };

  // ─── Discord gate helper ─────────────────────────────────────────────────────
  const requireDiscord = (
    method: string,
    plan: string,
    price: number,
    qty: number,
    onAuthenticated: () => void,
  ) => {
    const session = readDiscordSession();
    if (session) {
      setDiscordSession(session);
      onAuthenticated();
      return;
    }
    // Save intent so we can auto-resume after OAuth redirect
    localStorage.setItem('discord_payment_intent', JSON.stringify({ method, plan, price, qty }));
    setIsSwitchingAccount(false);
    setShowDiscordModal(true);
  };

  const handleRobuxPayment = (plan: string, price: number) => {
    if (getTierStock(plan) <= 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Out of Stock', message: 'This premium plan is currently out of stock.' });
      return;
    }
    requireDiscord('robux', plan, price, 1, () => {
      let productId = 1781366430;
      if (plan === 'weekly')  productId = 1779578553;
      if (plan === 'monthly') productId = 1781384489;
      setRobuxDetails({ plan, price, productId });
      setRobloxUsername('');
      setEmail('');
      setShowRobuxModal(true);
    });
  };

  const verifyRobuxPurchase = async () => {
    if (!robuxDetails || !robloxUsername.trim() || !email.trim()) return;
    setIsProcessing(true);
    setShowRobuxModal(false);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/roblox/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: robloxUsername,
          email,
          tier: robuxDetails.plan,
          discordId:       discordSession?.id,
          discordUsername: discordSession?.tag,
        }),
      });
      const data = await response.json();
      if (data.success && data.keys && data.keys.length > 0) {
        const generatedKey = String(data.keys[0]);
        setStatusModal({ isOpen: true, type: 'success', title: data.isRenewal ? 'Renewal Successful!' : 'Verification Successful!', message: data.message || 'Key generated successfully. Redirecting you to the receipt...' });
        localStorage.setItem('client_email', email);
        localStorage.setItem('client_auth', 'true');
        setTimeout(() => {
          const params = new URLSearchParams({
            orderId: data.transactionId || `ROBLOX-${data.userId}-${data.tier}`,
            tier: data.tier,
            amount: String(robuxDetails.price),
            currency: 'ROBUX',
            key: generatedKey,
            email,
            payerId: `ROBLOX_${data.userId}`,
            method: 'robux',
            date: new Date().toISOString()
          });
          router.push(`/success?${params.toString()}`);
        }, 1000);
        loadPremiumStocks();
      } else {
        setStatusModal({ isOpen: true, type: 'error', title: 'Verification Failed', message: data.error || 'Could not verify ownership.', details: data.details });
      }
    } catch (error: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'System Error', message: 'An unexpected error occurred.', details: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = (plan: string, amount: number) => {
    const qty = quantities[plan] || 1;
    if (getTierStock(plan) < qty) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Not Enough Stock', message: `Only ${getTierStock(plan)} left for this plan.` });
      return;
    }
    requireDiscord('paypal', plan, amount, qty, () => {
      setPendingPlan({ plan, amount, price: amount, quantity: qty });
      setShowTosModal(true);
    });
  };

  const handleGCashPayment = (plan: string, amount: number) => {
    if (getTierStock(plan) <= 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Out of Stock', message: 'This premium plan is currently out of stock.' });
      return;
    }
    requireDiscord('gcash', plan, amount, 1, () => {
      setGcashDetails({ plan, price: amount });
      setShowGcashModal(true);
    });
  };

  const handleCardPayment = (plan: string, amount: number) => {
    if (getTierStock(plan) <= 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Out of Stock', message: 'This premium plan is currently out of stock.' });
      return;
    }
    requireDiscord('card', plan, amount, 1, () => {
      setCardDetails({ plan, price: amount });
      setShowCardModal(true);
    });
  };

  const handleTicketPayment = (plan: string, amount: number, currency: string) => {
    if (getTierStock(plan) <= 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Out of Stock', message: 'This premium plan is currently out of stock.' });
      return;
    }
    setTicketDetails({ plan, amount, currency });
    setPendingPlan({ plan, amount, price: amount, quantity: 1 });
    setShowTosModal(true);
  };

  const proceedWithPayment = async () => {
    if (!pendingPlan) return;
    setShowTosModal(false);

    if (paymentMethod === 'paypal') {
      try {
        setIsProcessing(true);
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: pendingPlan.plan,
            amount: pendingPlan.amount,
            quantity: pendingPlan.quantity,
            currency: 'EUR',
            description: 'Seisen Hub Premium Access',
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setIsProcessing(false);
          setStatusModal({ isOpen: true, type: 'error', title: 'Purchase Blocked', message: data.error || 'Unable to continue checkout.' });
          loadPremiumStocks();
          return;
        }

        const approvalLink = data.links?.find((link: any) => link.rel === 'approve');
        if (approvalLink) {
          window.location.href = approvalLink.href;
        } else {
          setIsProcessing(false);
          setStatusModal({ isOpen: true, type: 'error', title: 'PayPal Error', message: 'Failed to create PayPal order. Please try again.', details: 'No approval link returned' });
        }
      } catch (error: any) {
        setIsProcessing(false);
        setStatusModal({ isOpen: true, type: 'error', title: 'Connection Error', message: 'Failed to initiate payment.', details: error.message });
      }
    } else {
      if (ticketDetails) setShowTicketModal(true);
    }
  };

  const getCurrentPlans = () => {
    switch (paymentMethod) {
      case 'robux': return robuxPlans;
      case 'gcash': return gcashPlans;
      case 'card': return cardPlans;
      default: return paypalPlans;
    }
  };

  const copyTicketDetails = async () => {
    if (!ticketDetails) return;
    const text = `Premium Purchase Request\n\nPlan: ${ticketDetails.plan}\nAmount: ${ticketDetails.amount} ${ticketDetails.currency}\nMethod: ${ticketDetails.currency}`;
    await copyToClipboard(text);
    alert('Details copied to clipboard!');
  };

  const cartCount = getCartCount(cart);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <section className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Premium Access</h1>
          <p className="text-gray-500">
            Unlock all features with instant access, no key system required
          </p>
        </section>

        <section className="flex justify-center -mt-8 mb-8">
          <PurchaseCounter />
        </section>

        {/* Discord Account Status */}
        <section className="flex justify-center -mt-4">
          {discordSession ? (
            <DiscordAccountBadge
              session={discordSession}
              onLogout={handleDiscordLogout}
              onChangeAccount={handleDiscordSwitchAccount}
            />
          ) : (
            <DiscordLoginBanner returnTo="/premium" />
          )}
        </section>

        {/* Payment Method + Cart Button */}
        <section>
          <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
            <h3 className="text-sm font-medium text-gray-400">Payment Method:</h3>

            {/* Cart button — PayPal only */}
            {paymentMethod === 'paypal' && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-all text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 accent-bg text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                paymentMethod === 'paypal'
                  ? 'accent-bg accent-border accent-text'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
              }`}
              title="PayPal"
            >
              <img src="/images/paypal.png" alt="PayPal" className="w-5 h-5 object-contain" />
            </button>
            <button
              onClick={() => setPaymentMethod('robux')}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                paymentMethod === 'robux'
                  ? 'accent-bg accent-border accent-text'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
              }`}
              title="Robux"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Robux_2019_Logo_gold.svg" alt="Robux" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPaymentMethod('gcash')}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                paymentMethod === 'gcash'
                  ? 'accent-bg accent-border accent-text'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
              }`}
              title="GCash"
            >
              <img src="/images/gcash.png" alt="GCash" className="w-6 h-6 object-contain" />
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                paymentMethod === 'card'
                  ? 'accent-bg accent-border accent-text'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
              }`}
              title="Card"
            >
              <CreditCard className="w-5 h-5 text-purple-500" />
            </button>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="grid md:grid-cols-3 gap-6">
          {getCurrentPlans().map((plan) => (
            (() => {
              const tierStock = getTierStock(plan.plan);
              const isOutOfStock = !stockLoading && tierStock <= 0;
              const stockStatusText = stockLoading
                ? 'Checking stock...'
                : tierStock <= 5
                    ? `${tierStock} left (low stock)`
                    : `${tierStock} in stock`;

              const qty = quantities[plan.plan] || 1;
              const isPayPal = paymentMethod === 'paypal';
              const cartIncludes = cart.some(c => c.plan === plan.plan);
              const justAdded = addedFeedback === plan.plan;

              return (
                <div key={plan.plan} className="flex flex-col gap-2 h-full">
                  <PricingCard
                    className="flex-1"
                    title={plan.title}
                    badge={plan.badge}
                    badgeVariant={plan.badgeVariant}
                    price={plan.price}
                    // @ts-ignore
                    originalPrice={plan.originalPrice}
                    currency={plan.currency}
                    period={plan.period}
                    features={plan.features}
                    featured={plan.featured}
                    stockStatusText={isOutOfStock ? 'Currently out of stock' : stockStatusText}
                    stockStatusVariant={isOutOfStock ? 'out-of-stock' : tierStock <= 5 ? 'low-stock' : 'in-stock'}
                    isOutOfStock={isOutOfStock}
                    buttonText={isOutOfStock ? 'Out of Stock' : isPayPal ? `Pay with PayPal${qty > 1 ? ` (×${qty})` : ''}` : paymentMethod === 'gcash' ? 'Pay with GCash' : paymentMethod === 'card' ? 'Pay with Card' : 'Verify & Get Key'}
                    buttonIcon={!isOutOfStock && (isPayPal || paymentMethod === 'gcash' || paymentMethod === 'card') ? <CreditCard className="w-4 h-4" /> : null}
                    onButtonClick={() => {
                      if (paymentMethod === 'paypal') {
                        handlePayPalPayment(plan.plan, plan.price);
                      } else if (paymentMethod === 'robux') {
                        handleRobuxPayment(plan.plan, plan.price);
                      } else if (paymentMethod === 'gcash') {
                        handleGCashPayment(plan.plan, plan.price);
                      } else {
                        handleCardPayment(plan.plan, plan.price);
                      }
                    }}
                    priceIcon={
                      paymentMethod === 'robux' ? (
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Robux_2019_Logo_gold.svg"
                          alt="R$"
                          className="w-6 h-6 mr-1 object-contain"
                        />
                      ) : undefined
                    }
                  />

                  {/* PayPal-only: Quantity stepper + Add to Cart */}
                  {isPayPal && (
                    <div className={`flex items-center gap-2 px-1 ${isOutOfStock ? 'invisible select-none pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-gray-500">Qty:</span>
                        <QuantityStepper
                          value={qty}
                          onChange={v => setQuantities(q => ({ ...q, [plan.plan]: v }))}
                          max={Math.min(10, tierStock)}
                        />
                        {qty > 1 && (
                          <span className="text-xs text-gray-400 font-mono">
                            = €{(plan.price * qty).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(plan.plan, plan.price, plan.title)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          justAdded
                            ? 'accent-bg accent-text border-transparent'
                            : cartIncludes
                            ? 'bg-[#1a1a1a] border-[var(--accent)] accent-text'
                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
                        }`}
                      >
                        {justAdded ? (
                          <><CheckCircle className="w-3 h-3" /> Added!</>
                        ) : (
                          <><ShoppingCart className="w-3 h-3" /> Add to Cart</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ))}
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <Card key={index} variant="hover" className="p-5">
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 accent-text" />
                  {faq.question}
                </h3>
                <p className="text-gray-500 text-sm">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onRemove={handleCartRemove}
        onUpdateQty={handleCartUpdateQty}
        onCheckout={() => { setCartOpen(false); handleCartCheckout(); }}
        onClear={handleCartClear}
        isProcessing={isProcessing}
      />

      {/* Processing Modal */}
      {isProcessing && !statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 accent-text animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Processing Payment...</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Please do not close this window or refresh the page. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-md p-6 text-center border shadow-2xl relative">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              statusModal.type === 'success' ? 'accent-bg accent-text' : 'bg-red-500/20 text-red-500'
            }`}>
              {statusModal.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{statusModal.title}</h2>
            <p className="text-gray-400 mb-6">{statusModal.message}</p>

            {statusModal.details && (
              <div className="bg-[#0a0a0a] p-3 rounded text-left mb-6 overflow-hidden">
                <p className="text-xs text-gray-500 mb-1 font-mono uppercase">Error Details:</p>
                <code className="text-xs text-red-400 block break-words">{statusModal.details}</code>
              </div>
            )}

            <Button
              onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
              className="w-full"
              variant={statusModal.type === 'success' ? 'primary' : 'secondary'}
            >
              {statusModal.type === 'success' ? 'Continue' : 'Close and Try Again'}
            </Button>
          </Card>
        </div>
      )}

      {/* TOS Modal */}
      {showTosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 accent-text" />
              Terms of Service
            </h2>

            {/* Discord user badge */}
            {discordSession && (
              <div className="flex items-center gap-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl px-4 py-3 mb-4">
                <img
                  src={discordSession.avatar}
                  alt={discordSession.tag}
                  className="w-9 h-9 rounded-full ring-2 ring-[#5865F2]/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{discordSession.tag}</p>
                  <p className="text-[#5865F2] text-xs">Discord ID: {discordSession.id}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="#5865F2" className="w-5 h-5 flex-shrink-0 opacity-70">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
                </svg>
              </div>
            )}

            <p className="text-gray-400 text-sm mb-4">
              Before purchasing premium access, you must read and agree to our Terms of Service.
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">
                <strong>⚠️ Important:</strong> All sales are final. No refunds will be issued.
              </p>
            </div>

            {pendingPlan && pendingPlan.quantity > 1 && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 mb-4 text-sm text-gray-300">
                <p><strong>Plan:</strong> <span className="text-white capitalize">{pendingPlan.plan}</span></p>
                <p><strong>Quantity:</strong> <span className="text-white">{pendingPlan.quantity} keys</span></p>
                <p><strong>Total:</strong> <span className="accent-text font-semibold">€{(pendingPlan.price * pendingPlan.quantity).toFixed(2)}</span></p>
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--accent)]"
              />
              <span className="text-gray-400 text-sm">
                I have read and agree to the{' '}
                <a href="/legal" className="accent-text hover:underline" target="_blank">
                  Terms of Service
                </a>.
              </span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setShowTosModal(false); setTosAccepted(false); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!tosAccepted}
                onClick={proceedWithPayment}
              >
                <Check className="w-4 h-4" />
                Accept & Continue
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Robux Verification Modal */}
      {showRobuxModal && robuxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              Verify Ownership
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-2 text-sm text-gray-300">
                <p><strong>Plan:</strong> <span className="text-white capitalize">{robuxDetails.plan}</span></p>
                <p>
                  <strong>Product:</strong>{' '}
                  <a
                    href={`https://www.roblox.com/game-pass/${robuxDetails.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="accent-text font-mono hover:underline"
                  >
                    Click here to Buy Game Pass ({robuxDetails.productId})
                  </a>
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded mt-3">
                <p className="text-xs text-orange-200 font-medium mb-1">⚠️ Renewal / Additional Purchase:</p>
                <p className="text-xs text-orange-200/80">
                  To <strong>Renew</strong> (Weekly/Monthly) or buy an <strong>Additional Key</strong> (Lifetime), you <strong>MUST DELETE</strong> the item from your Roblox inventory and <strong>BUY IT AGAIN</strong>.
                  <br /><br />
                  <strong>Existing Lifetime users:</strong> To just get your <em>current</em> key, simply click Verify without rebuying.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Roblox Username</label>
                  <input
                    type="text"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    placeholder="Enter your Roblox username..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus-visible:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for backup..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus-visible:border-[var(--accent)] transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll save your key to this email as a backup.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowRobuxModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={verifyRobuxPurchase} disabled={!robloxUsername.trim() || !email.trim()}>
                <Check className="w-4 h-4" />
                Verify
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && ticketDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 accent-text" />
              Complete Purchase
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-2 text-sm text-gray-300">
                <p><strong>Plan:</strong> <span className="text-white capitalize">{ticketDetails.plan}</span></p>
                <p><strong>Amount:</strong> <span className="text-white">{ticketDetails.amount} {ticketDetails.currency}</span></p>
                <p><strong>Method:</strong> <span className="text-white capitalize">{ticketDetails.currency === 'Robux' ? 'Robux' : 'GCash'}</span></p>
              </div>

              <p className="text-sm text-gray-400">
                To complete your purchase, please open a ticket in our Discord server and provide proof of payment.
              </p>

              <Button variant="secondary" className="w-full" onClick={copyTicketDetails}>
                <Copy className="w-4 h-4" />
                Copy Ticket Details
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowTicketModal(false)}>
                Close
              </Button>
              <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" className="flex-1">
                <Button className="w-full">Open Discord</Button>
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* Card Manual Payment Modal */}
      {showCardModal && cardDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-purple-500" />
              Card Transfer
            </h2>

            <div className="space-y-4 mb-6 text-sm text-gray-300">
              <p className="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] text-center">
                <strong>Plan:</strong> <span className="text-white capitalize">{cardDetails.plan}</span>
                <span className="mx-3 opacity-50">|</span>
                <strong>Price:</strong> <span className="accent-text font-bold text-base">€{cardDetails.price}</span>
              </p>

              <div className="flex flex-col items-center gap-2 my-6">
                <p className="text-gray-400 font-medium">Send Funds To:</p>
                <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4 w-full text-center space-y-2 shadow-inner">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Card Number</p>
                  <p className="text-white text-2xl font-mono tracking-widest font-bold">3080 1010 2933</p>
                  <div className="flex justify-between items-center px-2 mt-4 pt-4 border-t border-[#222]">
                    <div className="text-left">
                      <p className="text-gray-500 text-xs">Account Name</p>
                      <p className="text-white font-medium">Zandrix O Pongos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Bank</p>
                      <p className="text-white font-medium">PNB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Manual Verification Steps
                </h3>
                <ol className="text-purple-200/80 space-y-2.5 list-decimal list-outside ml-4">
                  <li>Send exactly <strong className="text-purple-200 font-bold">€{cardDetails.price}</strong> to the PNB card above.</li>
                  <li><strong>Download or screenshot</strong> the payment receipt.</li>
                  <li>Click "Open Support Ticket" below.</li>
                  <li>Send your receipt and your Seisen account details in the ticket.</li>
                  <li>Wait for validation. Once confirmed valid, you will receive your keys.</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCardModal(false)}>
                Cancel
              </Button>
              <a href="https://discord.gg/F4sAf6z8Ph" target="_blank" className="flex-1" rel="noopener noreferrer">
                <Button className="w-full">
                  Open Support Ticket
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* GCash Manual Payment Modal */}
      {showGcashModal && gcashDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <img src="/images/gcash.png" alt="GCash" className="w-6 h-6 object-contain" />
              GCash Payment
            </h2>

            <div className="space-y-4 mb-6 text-sm text-gray-300">
              <p className="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] text-center">
                <strong>Plan:</strong> <span className="text-white capitalize">{gcashDetails.plan}</span>
                <span className="mx-3 opacity-50">|</span>
                <strong>Price:</strong> <span className="accent-text font-bold text-base">₱{gcashDetails.price}</span>
              </p>

              <div className="flex flex-col items-center gap-2 my-6">
                <p className="text-gray-400 font-medium">Scan to Pay</p>
                <button 
                  onClick={() => setIsGcashQrExpanded(true)}
                  className="bg-white p-3 rounded-2xl shadow-xl cursor-zoom-in hover:scale-105 transition-transform appearance-none border-none"
                  title="Click to expand QR Code"
                >
                  <img src="/images/gcash-qr.jpg" alt="GCash QR Code" className="w-48 h-48 object-contain" />
                </button>
                <p className="text-xs text-gray-500 mb-2">Click image to expand</p>
                <p className="text-gray-400 font-medium">If QR fails, send to: <strong className="text-white text-lg tracking-wider">09304300733</strong></p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                <h3 className="text-orange-300 font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Manual Verification Steps
                </h3>
                <ol className="text-orange-200/80 space-y-2.5 list-decimal list-outside ml-4">
                  <li>Scan the QR code (or send to <strong>09304300733</strong>) with exactly <strong className="text-orange-200 font-bold">₱{gcashDetails.price}</strong>.</li>
                  <li><strong>Download or screenshot</strong> the payment receipt.</li>
                  <li>Click "Open Support Ticket" below.</li>
                  <li>Send your receipt and your Seisen account details in the ticket.</li>
                  <li>Wait for validation. Once confirmed valid, you will receive your keys.</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowGcashModal(false)}>
                Cancel
              </Button>
              <a href="https://discord.com/channels/1333251917098520628/1333435322603933706" target="_blank" className="flex-1" rel="noopener noreferrer">
                <Button className="w-full">
                  Open Support Ticket
                </Button>
              </a>
            </div>
          </Card>
          
          {/* Expanded QR Code Overlay */}
          {isGcashQrExpanded && (
            <div 
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200 cursor-zoom-out"
              onClick={() => setIsGcashQrExpanded(false)}
              title="Click anywhere to close"
            >
              <div className="bg-white p-4 rounded-3xl shadow-2xl max-w-full max-h-full overflow-hidden flex items-center justify-center">
                <img 
                  src="/images/gcash-qr.jpg" 
                  alt="Expanded GCash QR Code" 
                  className="max-h-[85vh] max-w-[85vw] object-contain" 
                />
              </div>
            </div>
          )}
        </div>
      )}
      {/* Discord Login / Switch Modal */}
      {showDiscordModal && (
        <DiscordLoginModal
          onClose={() => {
            setShowDiscordModal(false);
            setIsSwitchingAccount(false);
            if (!isSwitchingAccount) localStorage.removeItem('discord_payment_intent');
          }}
          returnTo="/premium"
          isSwitching={isSwitchingAccount}
          currentSession={discordSession}
        />
      )}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin accent-text" /></div>}>
      <PremiumContent />
    </Suspense>
  );
}
