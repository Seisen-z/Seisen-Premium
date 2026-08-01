'use client';

import { useState, Suspense } from 'react';
import { Clock, Zap, Infinity, Key, Shield, Unlock, Monitor, Globe, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSkeleton from '@/components/ui/PremiumSkeleton';
import PricingCard from '@/components/ui/PricingCard';
import CommunityVoices from '@/components/sections/CommunityVoices';
import PurchaseCounter from '@/components/ui/PurchaseCounter';

// ─── Plan data (display prices = PayPal/EUR) ──────────────────────────────────
// Order: weekly (left) | lifetime (center, featured) | monthly (right)
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
    cardColor: '#60a5fa',
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
    cardColor: '#4ade80',
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
    cardColor: '#a78bfa',
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
  {
    question: 'How do I get premium?',
    answer: "Choose your plan, complete the payment, and your key is delivered instantly.",
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

// ─── Mega Key Section ─────────────────────────────────────────────────────────
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
        background: 'linear-gradient(135deg, rgba(16,28,16,0.95) 0%, rgba(10,20,10,0.98) 100%)',
        border: '1px solid rgba(74,222,128,0.25)',
        boxShadow: '0 0 60px rgba(74,222,128,0.06)',
      }}
    >
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.6) 50%, transparent 100%)' }} />

      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
              >
                Big Account Farmer Offer
              </span>
            </div>
            <h2 className="text-white font-bold" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}>
              Mega Key — 100 Tabs. One Key.
            </h2>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Built for large-scale account farming. No restrictions, no limits.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Features */}
          <div className="space-y-2.5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.18)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{f.text}</span>
                </div>
              );
            })}

            <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(74,222,128,0.6)' }}>Why Mega Key?</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
                  backgroundColor: selected === opt.key ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.03)',
                  border: selected === opt.key ? '1.5px solid rgba(74,222,128,0.45)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: selected === opt.key ? '#4ade80' : 'rgba(255,255,255,0.2)',
                        backgroundColor: selected === opt.key ? '#4ade80' : 'transparent',
                      }}
                    >
                      {selected === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{opt.perMonth}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl">{opt.currency}{opt.price}</p>
                    {opt.badge && (
                      <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => router.push(`/checkout?plan=${selected}`)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-150"
              style={{ backgroundColor: '#4ade80', color: '#000', boxShadow: '0 0 24px rgba(74,222,128,0.25)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4ade80'; }}
            >
              <img src="/images/paypal.png" alt="PayPal" className="w-4 h-4 object-contain" />
              Get Mega Key — ${selectedOption.price}
            </button>

            <a
              href="https://discord.gg/F4sAf6z8Ph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(88,101,242,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
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

// ─── Main Content ─────────────────────────────────────────────────────────────
function PremiumContent() {
  const router = useRouter();

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
    <div className="min-h-screen px-6 md:px-14 pt-20 pb-20 max-w-6xl mx-auto">
      <div className="space-y-14">

        {/* ── Hero ── */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
            <h1
              className="font-black leading-none"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', letterSpacing: '-0.04em', color: '#fff' }}
            >
              Pick the plan{' '}
              <span style={{ color: 'var(--accent)' }}>that fits you.</span>
            </h1>
            <PurchaseCounter />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No key system. Every script. Instant delivery.
          </p>
        </section>

        {/* ── Pricing Cards ── */}
        {/* Layout: Weekly (left) | Lifetime (center/elevated) | Monthly (right) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan, i) => {
              const isCenter = i === 1; // lifetime

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
                    buttonText={buttonLabels[plan.plan]}
                    onButtonClick={() => router.push(`/checkout?plan=${plan.plan}`)}
                  />
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { label: 'Instant Delivery', icon: '⚡' },
              { label: 'No Key System',    icon: '🔓' },
              { label: 'All Scripts',      icon: '📜' },
              { label: 'Priority Support', icon: '🛡️' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mega Key ── */}
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-5" style={{ color: 'var(--text-muted)' }}>
            For large-scale farming
          </p>
          <MegaKeySection />
        </section>

        {/* ── FAQ ── */}
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--text-muted)' }}>FAQ</p>
          <div className="divide-y" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="flex gap-8 py-6">
                <span className="font-mono text-xs pt-0.5 w-6 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-12">
                  <h3 className="font-medium text-white text-sm sm:w-48 shrink-0">{faq.question}</h3>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>{faq.answer}</p>
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
