'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const faqItems = [
  {
    category: 'General',
    gradient: 'from-blue-500 to-cyan-500',
    questions: [
      {
        q: 'What is Seisen?',
        a: 'Seisen is a platform providing premium scripts and tools for enhanced gaming experiences. We offer both free and premium access to our script library.',
      },
      {
        q: 'How do I get started?',
        a: 'Simply browse our scripts page to see available scripts. For free access, complete the key system. For unlimited access, consider our premium plans.',
      },
      {
        q: 'Is it safe to use?',
        a: 'Our scripts are regularly updated and tested. However, use of third-party scripts is always at your own risk. We recommend using alt accounts.',
      },
    ],
  },
  {
    category: 'Key System',
    gradient: 'from-[var(--accent)] to-[var(--accent-hover)]',
    questions: [
      {
        q: 'How does the key system work?',
        a: 'Complete the checkpoint links on our Get Key page. Once all checkpoints are complete, you will receive a key valid for 24 hours.',
      },
      {
        q: 'How long is my key valid?',
        a: 'Free keys are valid for 24 hours. After expiration, you need to complete the checkpoints again for a new key.',
      },
      {
        q: 'Can I bypass the key system?',
        a: 'Yes! Premium members get instant access without any key system. Check our Premium page for plans.',
      },
    ],
  },
  {
    category: 'Premium',
    gradient: 'from-purple-500 to-pink-500',
    questions: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept PayPal and GCash. PayPal offers instant processing, while GCash requires ticket verification.',
      },
      {
        q: 'Can I get a refund?',
        a: 'All sales are final. We do not offer refunds under any circumstances. Please make sure you want to purchase before proceeding.',
      },
      {
        q: 'What do premium members get?',
        a: 'Premium members get access to all scripts, no key system, priority support, early access to new features, and exclusive updates.',
      },
    ],
  },
  {
    category: 'Support',
    gradient: 'from-orange-500 to-red-500',
    questions: [
      {
        q: 'How do I get support?',
        a: 'Join our Discord server for community support, or open a support ticket on our website for personalized assistance.',
      },
      {
        q: 'I found a bug, how do I report it?',
        a: 'Please report bugs through our Discord server in the #bug-reports channel, or open a support ticket with details.',
      },
      {
        q: 'Can I request a new script?',
        a: 'Yes! Script requests can be made in our Discord server. Popular requests may be added to our library.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newSet = new Set(openItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setOpenItems(newSet);
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <section className="text-center mb-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/40 transform hover:scale-105 transition-transform">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Find answers to common questions about Seisen and our services
          </p>
        </section>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {faqItems.map((category) => (
            <section key={category.category} className="space-y-4">
              {/* Category Header */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${category.gradient} p-[2px]`}>
                <div className="bg-[#0a0a0a] rounded-2xl px-6 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.gradient} animate-pulse`} />
                    {category.category}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {category.questions.length} questions
                    </span>
                  </h2>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {category.questions.map((item, idx) => {
                  const id = `${category.category}-${idx}`;
                  const isOpen = openItems.has(id);

                  return (
                    <Card
                      key={id}
                      variant="hover"
                      className="overflow-hidden transition-all duration-300 hover-accent-border"
                    >
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full p-5 flex items-start justify-between text-left group"
                      >
                        <div className="flex items-start gap-3 flex-1 pr-4">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.gradient} flex-shrink-0`} />
                          <span className="font-semibold text-white text-lg hover-accent-text transition-colors">
                            {item.q}
                          </span>
                        </div>
                        <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5 text-gray-400 hover-accent-text" />
                        </div>
                      </button>
                      
                      {/* Answer with smooth animation */}
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-5 pb-5 pl-11">
                          <div className={`border-l-2 border-gradient-to-b ${category.gradient} pl-4 py-2`}>
                            <p className="text-gray-300 text-base leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Still Need Help */}
        <Card className="mt-16 p-8 text-center bg-gradient-to-br from-[#141414] via-[#1a1a1a] to-[#141414] accent-border">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4" style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))', boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.3)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Still have questions?</h3>
          <p className="text-gray-400 text-base mb-6 max-w-md mx-auto">
            Join our Discord community for instant support and connect with other users
          </p>
          <a
            href="https://discord.gg/F4sAf6z8Ph"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 hover:scale-105"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
            </svg>
            Join Discord Server
          </a>
        </Card>
      </div>
    </div>
  );
}
