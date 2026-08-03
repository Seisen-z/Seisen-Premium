'use client';

import { useState, useEffect, Suspense } from 'react';
import { Clock, Zap, Infinity, Key, Shield, Unlock, Monitor, Globe, Ban, RefreshCw, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSkeleton from '@/components/ui/PremiumSkeleton';
import PricingCard from '@/components/ui/PricingCard';
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
const plans = [
  {
    plan: 'weekly',
    title: 'Weekly',
    badge: '7 Days',
    price: 3,
    currency: '€',
    period: '/week',
    billingNote: 'Billed once per week',
    description: 'Try it risk-free for a week.',
    cardColor: '#b89060',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
  },
  {
    plan: 'lifetime',
    title: 'Lifetime',
    badge: '28% OFF',
    badgeVariant: 'best-value' as const,
    price: 10,
    originalPrice: 14,
    currency: '€',
    period: '',
    billingNote: 'One-time payment',
    description: 'Pay once. Access forever.',
    cardColor: '#c9a97a',
    featured: true,
    features: [
      'All premium scripts',
      'No key system',
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

// ── Mega Key Section ──────────────────────────────────────────────────────────
function MegaKeySection() {
  const router = useRouter();
  const [selected, setSelected] = useState<'mega_1month' | 'mega_2month'>('mega_2month');

  const options = [
    { key: 'mega_2month' as const, label: '2 Months', price: 70, currency: '$', badge: 'Best Value', perMonth: '$35/mo' },
    { key: 'mega_1month' as const, label: '1 Month',  price: 40, currency: '$', badge: null,         perMonth: '$40/mo' },
  ];

  const selectedOption = options.find(o => o.key === selected)!;

  const features: { icon: React.ElementType; text: string }[] = [
    { icon: Zap,     text: '1 key — up to 100 simultaneous tabs' },
    { icon: Unlock,  text: 'No Hardware ID check, any device' },
    { icon: Monitor, text: 'Any executor, anywhere' },
    { icon: Key,     text: 'Equivalent to 10 normal keys combined' },
    { icon: Shield,  text: 'Hardware ID bypass built-in' },
    { icon: Globe,   text: 'Zero device binding restrictions' },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(20,16,10,0.98) 0%, rgba(12,10,6,0.99) 100%)',
        border: `1px solid ${C.accentBdr2}`,
        boxShadow: `0 0 60px rgba(201,169,122,0.07)`,
      }}
    >
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent 0%, ${C.accent} 50%, transparent 100%)` }} />

      <div className="px-8 py-10 md:px-12 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded"
              style={{ backgroundColor: C.accentBg, color: C.accent, border: `1px solid ${C.accentBdr}` }}
            >
              Big Account Farmer Offer
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
              Limited slots
            </span>
          </div>
          <h2 className="text-white font-bold mb-2" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', letterSpacing: '-0.03em' }}>
            Mega Key — 100 Tabs. One Key.
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Built for large-scale account farming. No restrictions, no limits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Features */}
          <div className="space-y-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.accentBg, border: `1px solid ${C.accentBdr}` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: C.accent }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
                </div>
              );
            })}

            <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: C.accentBg, border: `1px solid ${C.accentBdr}` }}>
              <p className="text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: C.accentDim }}>Why Mega Key?</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Instead of buying 10 individual keys at €10 each (€100), get one Mega Key that covers up to 100 tabs — with zero hardware binding.
              </p>
            </div>
          </div>

          {/* Plan selector + CTA */}
          <div className="space-y-3">
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className="w-full rounded-xl p-4 text-left transition-all duration-150"
                style={{
                  backgroundColor: selected === opt.key ? C.accentBg : 'rgba(255,255,255,0.03)',
                  border: selected === opt.key ? `1.5px solid ${C.accentBdr2}` : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: selected === opt.key ? C.accent : 'rgba(255,255,255,0.2)',
                        backgroundColor: selected === opt.key ? C.accent : 'transparent',
                      }}
                    >
                      {selected === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-[#1a1008]" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{opt.perMonth}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl">{opt.currency}{opt.price}</p>
                    {opt.badge && (
                      <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: C.accentBg, color: C.accent }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => router.push(`/checkout?plan=${selected}`)}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: C.accent, color: '#1a1008' }}
            >
              <img src="/images/paypal.png" alt="PayPal" className="w-4 h-4 object-contain" />
              Get Mega Key — ${selectedOption.price}
            </button>

            <a
              href="https://discord.gg/F4sAf6z8Ph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
              </svg>
              Or contact us on Discord instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

type StockMap = Record<string, Record<string, number>>;

function getStockDisplay(methodStocks: StockMap, tier: string): { text: string; variant: 'in-stock' | 'low-stock' | 'out-of-stock' } | null {
  const tierStock = methodStocks[tier];
  if (!tierStock) return null;
  const total = Object.values(tierStock).reduce((a, b) => a + b, 0);
  if (total === 0) return { text: 'Out of stock', variant: 'out-of-stock' };
  if (total <= 5)  return { text: `${total} slots left`, variant: 'low-stock' };
  if (total <= 20) return { text: `${total} slots available`, variant: 'low-stock' };
  return null; // plenty of stock — don't show badge
}

// ── Main Content ──────────────────────────────────────────────────────────────
function PremiumContent() {
  const router = useRouter();

  const [methodStocks, setMethodStocks] = useState<StockMap>({});
  useEffect(() => {
    fetch('/api/premium-stock')
      .then(r => r.json())
      .then(d => { if (d.methodStocks) setMethodStocks(d.methodStocks); })
      .catch(() => {});
  }, []);

  const cardIcons: Record<string, React.ReactNode> = {
    weekly:   <Clock className="w-4 h-4" />,
    lifetime: <Infinity className="w-4 h-4" />,
    monthly:  <Zap className="w-4 h-4" />,
  };

  const buttonLabels: Record<string, string> = {
    weekly:   'Start Weekly',
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
            One purchase. Every script. Instant access — PayPal, GCash, or Maya.
          </p>
        </section>

        {/* ── Mega Key ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Featured offer</p>
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>
          <MegaKeySection />
        </section>

        {/* ── Pricing Cards ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Or choose a subscription</p>
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Value props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { Icon: Ban,       title: 'No Key System',    desc: 'Scripts run instantly, no key needed' },
              { Icon: Zap,       title: 'Instant Delivery', desc: 'Your key is ready the moment you pay' },
              { Icon: RefreshCw, title: 'Always Updated',   desc: 'New scripts added regularly, free' },
              { Icon: Shield,    title: 'Priority Support', desc: 'Jump the queue in Discord tickets' },
            ].map(v => (
              <div key={v.title} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <v.Icon className="w-4 h-4 mb-3" style={{ color: C.accentDim }} />
                <p className="text-white text-xs font-semibold mb-1">{v.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan, i) => {
              const isCenter = i === 1;
              const stock    = getStockDisplay(methodStocks, plan.plan);

              return (
                <div key={plan.plan} className={isCenter ? 'relative' : 'md:mt-8'}>
                  <PricingCard
                    title={plan.title}
                    description={plan.description}
                    badge={plan.badge}
                    badgeVariant={(plan as any).badgeVariant}
                    price={plan.price}
                    originalPrice={(plan as any).originalPrice}
                    currency={plan.currency}
                    period={plan.period}
                    billingNote={plan.billingNote}
                    cardColor={plan.cardColor}
                    cardIcon={cardIcons[plan.plan]}
                    features={plan.features}
                    featured={(plan as any).featured}
                    stockStatusText={stock?.text}
                    stockStatusVariant={stock?.variant}
                    buttonText={buttonLabels[plan.plan]}
                    onButtonClick={() => router.push(`/checkout?plan=${plan.plan}`)}
                  />
                </div>
              );
            })}
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center gap-2 mt-8">
            {['Instant Delivery', 'No Key System', 'All Scripts Included', 'Priority Support'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>}
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: C.accentDim }} />
                  {label}
                </span>
              </div>
            ))}
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
              <div key={index} className="flex gap-8 py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-xs pt-0.5 w-6 shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
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
