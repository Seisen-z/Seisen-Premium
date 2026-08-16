'use client';

import { Shield, Zap, RefreshCw, Crown, Users } from 'lucide-react';
import { FeatureTour, type TourStep } from '@/components/FeatureTour';

const STEPS: TourStep[] = [
  {
    id: 'verified',
    title: 'Verified & Safe',
    description:
      'Every script is reviewed by the Seisen team before release. No untested, broken, or dangerous code ever ships.',
    icon: <Shield size={36} />,
  },
  {
    id: 'instant',
    title: 'Instant Access',
    description:
      'Get a free key in seconds. One line of code to load — no installs, no sign-up, no waiting.',
    icon: <Zap size={36} />,
  },
  {
    id: 'updated',
    title: 'Always Updated',
    description:
      'Scripts are patched as Roblox games change. We track every update so your loader never breaks.',
    icon: <RefreshCw size={36} />,
  },
  {
    id: 'premium',
    title: 'Premium Scripts',
    description:
      'Unlock exclusive scripts with advanced features. One purchase, lifetime access — no subscriptions.',
    icon: <Crown size={36} />,
  },
  {
    id: 'community',
    title: 'Active Community',
    description:
      'Join 2,000+ members on Discord. Get support, share scripts, and stay updated on every new drop.',
    icon: <Users size={36} />,
  },
];

const C = {
  accent:    '#c9a97a',
  accentSoft:'#d4b896',
};

export default function HomeTourSection() {
  return (
    <section className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-24 max-w-screen-xl mx-auto">
      <div className="grid md:grid-cols-[1fr_1fr] gap-12 xl:gap-20 items-center">

        {/* Left — copy */}
        <div>
          <p className="section-label mb-3" style={{ color: C.accent, opacity: 1 }}>
            Platform Tour
          </p>
          <h2
            className="font-bold text-white mb-5"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Everything you need.<br />Nothing you don't.
          </h2>
          <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>
            Seisen is built around one idea: give players reliable, safe scripts without the friction. Here's what that looks like in practice.
          </p>

          {/* Step list (clickable via dots in tour) */}
          <div className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3">
                <span
                  className="font-mono text-xs font-bold mt-0.5 shrink-0 w-5"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white leading-none mb-0.5">{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — tour card */}
        <FeatureTour steps={STEPS} loop />
      </div>
    </section>
  );
}
