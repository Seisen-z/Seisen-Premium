'use client';

import { useState, useEffect, Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSkeleton from '@/components/ui/PremiumSkeleton';
import CommunityVoices from '@/components/sections/CommunityVoices';
import PurchaseCounter from '@/components/ui/PurchaseCounter';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  accent:    '#c9a97a',
  accentSoft:'#d4b896',
  accentDim: '#9a7d58',
  accentBg:  'rgba(201,169,122,0.1)',
  accentBdr: 'rgba(201,169,122,0.22)',
  accentBdr2:'rgba(201,169,122,0.35)',
} as const;

// ── Plan data ─────────────────────────────────────────────────────────────────
const freePlan = {
  plan: 'free',
  title: 'Free',
  badge: 'Ad-supported',
  price: 'Free',
  currency: '',
  period: '',
  billingNote: 'No payment needed',
  description: 'Get started at no cost.',
  cardColor: '#8a8a8a',
  features: ['Free scripts', 'Checkpoint key system', 'Ads supported', 'Discord community'],
};

const plans = [
  {
    plan: 'lifetime',
    title: 'Lifetime',
    badge: '14% OFF',
    badgeVariant: 'best-value' as const,
    price: 12,
    currency: '€',
    period: '',
    billingNote: 'One-time payment',
    description: 'Pay once. Access forever.',
    cardColor: '#c9a97a',
    featured: true,
    features: [
      'All premium scripts',
      'No key system',
      'Ad-free · ready to use',
      'Priority support',
      'Early access',
      'Exclusive updates',
      'Lifetime access',
    ],
  },
  {
    plan: 'monthly',
    title: 'Monthly',
    badge: '30 Days',
    price: 6,
    currency: '€',
    period: '/month',
    billingNote: 'Billed once per month',
    description: 'Best for regular script users.',
    cardColor: '#a08060',
    features: [
      'All premium scripts',
      'No key system',
      'Ad-free · ready to use',
      'Priority support',
      'Early access',
      'Exclusive updates',
    ],
  },
];

const faqs = [
  { question: 'How do I get premium?',  answer: 'Choose your plan, complete the payment, and your key is delivered instantly.' },
  { question: "What's included?",       answer: 'All premium scripts, no key system, priority support, early access to new features, and exclusive updates.' },
  { question: 'Refund Policy',          answer: 'All sales are final. We do not offer refunds, so please make sure you are certain before purchasing.' },
  { question: 'Need help?',             answer: 'Join our Discord server for support or open a ticket for payment assistance.' },
];

const annualPlan = {
  plan: 'annual', title: 'Annual', badge: '2 Months Free', price: 60, currency: '€', period: '/year',
  billingNote: 'One-time payment · 12 months access', description: 'Pay for 10 months. Get 12.', cardColor: '#a08060',
  features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', '2 months free', '50 HWID'],
};

type StockMap = Record<string, Record<string, number>>;

function getStockDisplay(methodStocks: StockMap, tier: string): { text: string; variant: 'in-stock' | 'low-stock' | 'out-of-stock' } | null {
  const tierStock = methodStocks[tier];
  if (!tierStock) return null;
  const total = Object.values(tierStock).reduce((a, b) => a + b, 0);
  if (total === 0) return { text: 'Out of stock', variant: 'out-of-stock' };
  return null;
}

// ── Plan tile ─────────────────────────────────────────────────────────────────
// The "path to a key" strip is the point of the row: Free costs time (ads + checkpoints),
// paid plans cost money and skip all of it.
const KEY_PATH: Record<string, string[]> = {
  free: ['Watch ads', 'Finish checkpoints', 'Get key'],
  paid: ['Pay', 'Key ready'],
};

type TilePlan = {
  plan: string; title: string; badge?: string; price: string | number; currency: string;
  period: string; billingNote: string; description: string; features: string[]; originalPrice?: string | number;
};

function PlanTile({ p, hero, stockText, outOfStock, cta, onClick }: {
  p: TilePlan; hero?: boolean; stockText?: string; outOfStock?: boolean; cta: string; onClick: () => void;
}) {
  const isFree = p.plan === 'free';
  const path = KEY_PATH[isFree ? 'free' : 'paid'];
  const ink = hero ? C.accent : isFree ? 'rgba(255,255,255,0.55)' : C.accentSoft;
  const border = hero ? `1.5px solid ${C.accentBdr2}` : '1px solid rgba(255,255,255,0.08)';

  return (
    <div className="flex flex-col h-full rounded-xl p-6 md:p-7" style={{ backgroundColor: '#0f0f0f', border }}>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-lg font-bold text-white">{p.title}</h3>
        {hero ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.accent }}>Most popular</span>
        ) : p.badge ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.badge}</span>
        ) : null}
      </div>
      <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.description}</p>

      <div className="mb-1 flex items-end gap-1.5">
        {p.originalPrice && (
          <span className="relative mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {p.currency}{p.originalPrice}
            <span className="absolute inset-y-[45%] left-0 w-full h-px bg-red-500/60 -rotate-6" />
          </span>
        )}
        <span className="font-black text-white" style={{ fontSize: hero ? '4rem' : '3rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {p.currency}{p.price}
        </span>
        {p.period && <span className="text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.period}</span>}
      </div>
      <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.28)' }}>{p.billingNote}</p>

      {/* Path to a key */}
      <div className="mb-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>How you get your key</p>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {path.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-xs" style={{ color: isFree ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)' }}>
              <span className="font-mono text-[10px]" style={{ color: ink }}>{i + 1}</span>
              {step}
              {i < path.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
            </li>
          ))}
        </ol>
      </div>

      <ul className={`mb-7 flex-1 grid gap-x-6 gap-y-2.5 ${hero ? 'sm:grid-cols-2' : ''}`}>
        {p.features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: ink }} />
            {f}
          </li>
        ))}
      </ul>

      {stockText && (
        <p className="mb-3 text-xs text-center" style={{ color: '#f87171' }}>{stockText}</p>
      )}
      <button
        onClick={onClick}
        disabled={outOfStock}
        className="w-full py-3.5 rounded-lg text-sm font-bold transition-[filter,background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2"
        style={hero
          ? { backgroundColor: C.accent, color: '#000', outlineColor: C.accent }
          : { backgroundColor: 'transparent', color: isFree ? 'rgba(255,255,255,0.75)' : C.accentSoft, border: `1px solid ${isFree ? 'rgba(255,255,255,0.15)' : C.accentBdr}`, outlineColor: C.accent }}
        onMouseEnter={e => { if (!outOfStock) (e.currentTarget as HTMLElement).style.filter = hero ? 'brightness(0.9)' : 'brightness(1.3)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
      >
        {cta}
      </button>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
function PremiumContent() {
  const router = useRouter();
  const [subscriptionCycle, setSubscriptionCycle] = useState<'monthly' | 'annual'>('monthly');

  const [methodStocks, setMethodStocks] = useState<StockMap>({});
  useEffect(() => {
    fetch('/api/premium-stock')
      .then(r => r.json())
      .then(d => { if (d.methodStocks) setMethodStocks(d.methodStocks); })
      .catch(() => {});
  }, []);

  const buttonLabels: Record<string, string> = {
    free:     'Get Free Key',
    annual:   'Get Annual Access',
    lifetime: 'Get Lifetime Access',
    monthly:  'Start Monthly',
  };

  return (
    <div className="min-h-screen px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 pt-14 pb-28">
      <div className="space-y-14">

        {/* ── Hero ── */}
        <section className="pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Seisen Premium</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <h1 className="font-bold text-white shrink-0" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', letterSpacing: '-0.03em' }}>
              Stop wasting time on{' '}
              <span style={{
                display: 'inline-block',
                background: `linear-gradient(120deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>key systems.</span>
            </h1>
            <div className="w-px h-5 hidden md:block" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3" viewBox="0 0 12 12" fill="#facc15">
                    <path d="M6 0l1.5 4.5H12L8.25 7.25 9.75 12 6 9.25 2.25 12l1.5-4.75L0 4.5h4.5z" />
                  </svg>
                ))}
              </div>
              4.9 / 5 · 300+ members
            </div>
            <div className="w-px h-4 hidden md:block" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <PurchaseCounter />
          </div>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            One purchase. Every script. Instant access — PayPal or Robux.
          </p>
        </section>

        {/* ── Pricing Cards ── */}
        <section>
          {/* Cards */}
          <div className="mb-5 flex">
            <div
              className="flex rounded-lg p-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {(['monthly', 'annual'] as const).map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setSubscriptionCycle(cycle)}
                  className="rounded-md px-4 py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: subscriptionCycle === cycle ? C.accent : 'transparent',
                    color: subscriptionCycle === cycle ? '#000' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly' }
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.5fr] gap-4 items-stretch">
            {(subscriptionCycle === 'annual'
              ? [freePlan, annualPlan, plans.find(item => item.plan === 'lifetime')!]
              : [freePlan, ...plans.filter(item => item.plan !== 'lifetime'), plans.find(item => item.plan === 'lifetime')!]
            ).map((displayPlan) => {
              const stock = getStockDisplay(methodStocks, displayPlan.plan);
              return (
                <PlanTile
                  key={displayPlan.plan}
                  p={displayPlan as TilePlan}
                  hero={displayPlan.plan === 'lifetime'}
                  stockText={stock?.text}
                  outOfStock={stock?.variant === 'out-of-stock'}
                  cta={buttonLabels[displayPlan.plan]}
                  onClick={() => router.push(displayPlan.plan === 'free' ? '/getkey' : `/checkout?plan=${displayPlan.plan}`)}
                />
              );
            })}
          </div>

        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>FAQ</p>
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="flex py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-16">
                  <h3 className="font-semibold text-white text-sm sm:w-44 shrink-0">{faq.question}</h3>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Community Voices ── */}
        <CommunityVoices />

      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumSkeleton />}>
      <PremiumContent />
    </Suspense>
  );
}
