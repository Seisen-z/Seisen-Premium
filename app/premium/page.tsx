'use client';

import { useState, Suspense } from 'react';
import { Clock, Zap, Infinity, Key, Shield, Unlock, Monitor, Globe, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSkeleton from '@/components/ui/PremiumSkeleton';
import PricingCard from '@/components/ui/PricingCard';
import CommunityVoices from '@/components/sections/CommunityVoices';
import Reveal from '@/components/ui/Reveal';

const plans = [
  {
    plan: 'weekly',
    title: 'Weekly',
    price: 3,
    currency: '€',
    period: '/week',
    billingNote: 'Billed once per week',
    featured: false,
    cardColor: '#60a5fa',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
  },
  {
    plan: 'lifetime',
    title: 'Lifetime',
    price: 10,
    originalPrice: 14,
    currency: '€',
    period: '',
    billingNote: 'One-time payment',
    featured: true,
    badge: '28% OFF',
    badgeVariant: 'best-value' as const,
    cardColor: '#4ade80',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
  },
  {
    plan: 'monthly',
    title: 'Monthly',
    price: 6,
    currency: '€',
    period: '/month',
    billingNote: 'Billed once per month',
    featured: false,
    cardColor: '#a78bfa',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
  },
];

const faqs = [
  {
    question: 'How do I get premium?',
    answer: 'Choose your plan, complete the payment, and your key is delivered instantly.',
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

// ─── Mega Key ────────────────────────────────────────────────────────────────
function MegaKeySection() {
  const router = useRouter();
  const [selected, setSelected] = useState<'mega_1month' | 'mega_2month'>('mega_2month');

  const options = [
    { key: 'mega_2month' as const, label: '2 Months', price: 70, perMonth: '$35/mo', badge: 'Best Value' },
    { key: 'mega_1month' as const, label: '1 Month',  price: 40, perMonth: '$40/mo', badge: null },
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
    <div className="grid md:grid-cols-5 gap-12 items-start">
      {/* Left: description + features */}
      <div className="md:col-span-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--accent)' }}>
          Mega Key
        </p>
        <h2 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', letterSpacing: '-0.02em' }}>
          100 Tabs. One Key.
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '32rem' }}>
          Built for large-scale account farming. One key covers up to 100 simultaneous tabs — no hardware binding, no device restrictions.
        </p>
        <ul className="space-y-2.5 mb-6">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <li key={f.text} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
                {f.text}
              </li>
            );
          })}
        </ul>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Instead of 10 keys at €10 each (€100 total), one Mega Key covers the same workload at a fraction of the cost.
        </p>
      </div>

      {/* Right: plan selector + CTA */}
      <div className="md:col-span-2">
        <div
          className="rounded-lg overflow-hidden mb-3"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
              style={{
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                borderLeft: selected === opt.key ? '2px solid var(--accent)' : '2px solid transparent',
                backgroundColor: selected === opt.key ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.01)',
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">{opt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{opt.perMonth}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">${opt.price}</p>
                {opt.badge && (
                  <p className="text-[10px] font-mono" style={{ color: 'var(--accent)' }}>{opt.badge}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push(`/checkout?plan=${selected}`)}
          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'; }}
        >
          Get Mega Key — ${selectedOption.price}
          <ArrowRight className="w-4 h-4" />
        </button>

        <a
          href="https://discord.gg/F4sAf6z8Ph"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs mt-3 transition-colors"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(88,101,242,0.6)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)'; }}
        >
          Or contact us on Discord
        </a>
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
    <div className="min-h-screen px-6 md:px-14 pt-20 pb-24 max-w-6xl mx-auto">
      <div className="space-y-16">

        {/* ── Mega Key ── */}
        <section className="pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Reveal><MegaKeySection /></Reveal>
        </section>

        {/* ── Pricing ── */}
        <section>
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-6" style={{ color: 'var(--text-muted)' }}>
              Subscriptions
            </p>
          </Reveal>

          {/* Weekly (left) | Lifetime (center, elevated) | Monthly (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan, i) => {
              const isCenter = i === 1; // lifetime
              return (
                <Reveal key={plan.plan} delay={i * 0.08} className={isCenter ? '' : 'md:mt-8'}>
                  <PricingCard
                    title={plan.title}
                    description={plan.billingNote}
                    badge={plan.badge}
                    badgeVariant={(plan as any).badgeVariant}
                    price={plan.price}
                    originalPrice={plan.originalPrice}
                    currency={plan.currency}
                    period={plan.period}
                    cardColor={(plan as any).cardColor}
                    cardIcon={cardIcons[plan.plan]}
                    features={plan.features}
                    featured={plan.featured}
                    buttonText={buttonLabels[plan.plan]}
                    onButtonClick={() => router.push(`/checkout?plan=${plan.plan}`)}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '3rem' }}>
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--text-muted)' }}>FAQ</p>
          </Reveal>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="flex gap-8 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-mono text-xs pt-0.5 w-6 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-12">
                    <h3 className="font-medium text-white text-sm sm:w-48 shrink-0">{faq.question}</h3>
                    <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>{faq.answer}</p>
                  </div>
                </div>
              </Reveal>
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
