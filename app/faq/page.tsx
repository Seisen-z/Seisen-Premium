'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqItems = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Seisen?',
        a: 'Seisen is a platform providing premium scripts and tools for enhanced gaming experiences. We offer both free and premium access to our script library.',
      },
      {
        q: 'How do I get started?',
        a: 'Browse our scripts page to see available scripts. For free access, complete the key system. For unlimited access, consider our premium plans.',
      },
      {
        q: 'Is it safe to use?',
        a: 'Our scripts are regularly updated and tested. However, use of third-party scripts is always at your own risk. We recommend using alt accounts.',
      },
    ],
  },
  {
    category: 'Key System',
    questions: [
      {
        q: 'How does the key system work?',
        a: 'Complete the checkpoint links on our Get Key page. Once all checkpoints are complete, you will receive a key valid for 24 hours.',
      },
      {
        q: 'How long is my key valid?',
        a: 'Free keys are valid for 24 hours. After expiration, complete the checkpoints again for a new key.',
      },
      {
        q: 'Can I bypass the key system?',
        a: 'Yes — premium members get instant access without any key system. Check our Premium page for plans.',
      },
    ],
  },
  {
    category: 'Premium',
    questions: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept PayPal, Maya, and Paddle. All methods process instantly.',
      },
      {
        q: 'Can I get a refund?',
        a: 'All sales are final. We do not offer refunds. Please be certain before purchasing.',
      },
      {
        q: 'What do premium members get?',
        a: 'All scripts, no key system, priority support, early access to new features, and exclusive updates.',
      },
    ],
  },
  {
    category: 'Support',
    questions: [
      {
        q: 'How do I get support?',
        a: 'Join our Discord server for community support, or open a support ticket on our website for personalized assistance.',
      },
      {
        q: 'I found a bug, how do I report it?',
        a: 'Report bugs in the #bug-reports channel on Discord, or open a support ticket with reproduction details.',
      },
      {
        q: 'Can I request a new script?',
        a: 'Yes — script requests can be made in our Discord server. Popular requests may be added to the library.',
      },
    ],
  },
];

const totalQuestions = faqItems.reduce((n, c) => n + c.questions.length, 0);

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const s = new Set(openItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setOpenItems(s);
  };

  return (
    <div className="min-h-screen px-6 md:px-14 pt-16 pb-28 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-20">
        <h1
          className="font-bold text-white leading-none mb-5"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.04em' }}
        >
          FAQ
        </h1>
        <div className="flex items-center gap-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {totalQuestions} questions across {faqItems.length} topics
          </p>
          <a
            href="https://discord.gg/F4sAf6z8Ph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
          >
            Can't find your answer? Ask on Discord →
          </a>
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="space-y-16">
        {faqItems.map((cat, ci) => (
          <div key={cat.category}>

            {/* Category label row */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                {String(ci + 1).padStart(2, '0')}
              </span>
              <span className="w-6 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <h2 className="font-semibold text-white text-sm">{cat.category}</h2>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {cat.questions.length}
              </span>
            </div>

            {/* Questions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {cat.questions.map((item, qi) => {
                const id = `${ci}-${qi}`;
                const open = openItems.has(id);

                return (
                  <div
                    key={id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <button
                      onClick={() => toggle(id)}
                      className="w-full flex items-start justify-between gap-8 py-5 text-left"
                    >
                      <div className="flex items-start gap-5 flex-1">
                        <span
                          className="font-mono text-[10px] pt-0.5 shrink-0 w-5"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          {String(qi + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="text-sm font-medium transition-colors"
                          style={{ color: open ? 'white' : 'var(--text-secondary)' }}
                        >
                          {item.q}
                        </span>
                      </div>
                      <span className="shrink-0 mt-0.5" style={{ color: open ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {open ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </span>
                    </button>

                    {open && (
                      <div className="pl-10 pb-5">
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer line ── */}
      <div className="mt-20 pt-8 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Still stuck?</p>
        <a
          href="https://discord.gg/F4sAf6z8Ph"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#5865F2' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4752C4'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#5865F2'; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Join Discord
        </a>
      </div>
    </div>
  );
}
