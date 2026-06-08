'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'Is Seisen free to use?',
    a: 'Yes — free scripts are accessible to everyone with no sign-up. Just complete the quick key system and you\'re in. Premium removes the key system entirely.',
  },
  {
    q: 'What does Premium include?',
    a: 'Full access to every script (free and premium), no key system ever, priority support, and early access to new releases. Available weekly, monthly, or lifetime.',
  },
  {
    q: 'How does the key system work?',
    a: 'Complete the checkpoint links on the Get Key page. Once done, you receive a key valid for 24 hours. Premium members skip this entirely.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept PayPal, Maya, GCash, and card payments. All methods process instantly and keys are delivered automatically.',
  },
  {
    q: 'Is it safe to use Seisen scripts?',
    a: 'Every script is tested and verified before release. We recommend using an alt account as with any third-party script.',
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-6 md:px-14 py-24 max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>FAQ</p>
        <h2 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}>
          Frequently Asked Questions
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Have more questions?{' '}
          <Link href="/faq" className="underline underline-offset-2 hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Visit the full FAQ
          </Link>{' '}
          or{' '}
          <Link href="/client/support" className="underline underline-offset-2 hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
            contact support
          </Link>.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-2">
        {FAQS.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
            >
              <span className="text-sm font-semibold text-white">{item.q}</span>
              <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {open === i
                  ? <Minus className="w-3.5 h-3.5 text-white" />
                  : <Plus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                }
              </span>
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
