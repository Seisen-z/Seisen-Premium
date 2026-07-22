'use client';

import { useEffect, useState } from 'react';

type TabType = 'terms' | 'privacy' | 'refund';

const tabs: { id: TabType; label: string }[] = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'refund', label: 'Refund Policy' },
];

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'terms' || hash === 'privacy' || hash === 'refund') {
      setActiveTab(hash);
    }
  }, []);

  const selectTab = (id: TabType) => {
    setActiveTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="min-h-screen px-6 md:px-14 pt-16 pb-28 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-14">
        <h1
          className="font-bold text-white leading-none mb-5"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.04em' }}
        >
          Legal
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Terms of service, privacy policy, and refund policy — last updated January 18, 2026
        </p>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex items-center flex-wrap gap-x-8 gap-y-3 mb-14"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {tabs.map((tab, i) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className="relative pb-4 whitespace-nowrap text-sm font-medium transition-colors"
              style={{ color: active ? 'white' : 'var(--text-muted)' }}
            >
              <span className="font-mono text-[10px] mr-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {tab.label}
              {active && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-px"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="animate-fade-in">
        {activeTab === 'terms' && <TermsOfService />}
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'refund' && <RefundPolicy />}
      </div>

      {/* ── Footer line ── */}
      <div
        className="mt-20 pt-8 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Questions about these terms?
        </p>
        <a
          href="https://discord.gg/F4sAf6z8Ph"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#5865F2' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4752C4'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#5865F2'; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Join Discord
        </a>
      </div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-3">Terms of Service</h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
        By using Seisen services, you accept and agree to be bound by the following terms and conditions.
      </p>

      <div className="space-y-10">
        <Section n={1} title="Acceptance of Terms">
          <p>
            By accessing and using Seisen's scripts and services, you accept and agree to be bound by
            these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </Section>

        <Section n={2} title="Service Description">
          <p className="mb-3">Seisen provides two tiers of service:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-white">Free Tier:</strong> Access to basic scripts with a
              time-based key system that requires periodic renewal
            </li>
            <li>
              <strong className="text-white">Premium Tier:</strong> Full access to all premium
              scripts with no time limitations or renewal requirements
            </li>
          </ul>
        </Section>

        <Section n={3} title="User Responsibilities">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>You must be at least 13 years old to use our services</li>
            <li>You are responsible for maintaining the confidentiality of your access keys</li>
            <li>You agree not to share, sell, or distribute your premium access keys</li>
            <li>You agree to use our scripts in accordance with the terms of service of the platforms where they are executed</li>
            <li>You will not attempt to reverse engineer, decompile, or modify our scripts</li>
          </ul>
        </Section>

        <Section n={4} title="Prohibited Activities">
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use our services for any illegal or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to our systems or user accounts</li>
            <li>Distribute malware or engage in any activity that harms our services</li>
            <li>Resell or redistribute our scripts without explicit permission</li>
            <li>Use automated systems to abuse our key generation system</li>
          </ul>
        </Section>

        <Section n={5} title="Intellectual Property">
          <p>
            All scripts, code, designs, and content provided by Seisen are protected by intellectual
            property rights. You are granted a limited, non-exclusive, non-transferable license to
            use our scripts for personal use only.
          </p>
        </Section>

        <Section n={6} title="Service Modifications">
          <p>
            We reserve the right to modify, suspend, or discontinue any part of our services at any
            time without prior notice. We are not liable for any modifications or interruptions to
            our services.
          </p>
        </Section>

        <Section n={7} title="Disclaimer of Warranties">
          <p>
            Our services are provided "as is" without any warranties, express or implied. We do not
            guarantee that our services will be uninterrupted, secure, or error-free. Use of our
            scripts is at your own risk.
          </p>
        </Section>

        <Section n={8} title="Limitation of Liability">
          <Callout variant="accent">
            Seisen and its operators shall not be liable for any direct, indirect, incidental,
            special, or consequential damages resulting from the use or inability to use our
            services, including but not limited to <strong className="text-white">account bans, data loss,
            or any other damages</strong>.
          </Callout>
        </Section>

        <Section n={9} title="Termination">
          <p>
            We reserve the right to terminate or suspend your access to our services at any time,
            with or without cause, and without prior notice. Upon termination, your right to use our
            services will immediately cease.
          </p>
        </Section>

        <Section n={10} title="Changes to Terms">
          <p>
            We may update these Terms of Service from time to time. Continued use of our services
            after changes constitutes acceptance of the updated terms. We encourage you to review
            these terms periodically.
          </p>
        </Section>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-3">Privacy Policy</h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
        Your privacy is important to us. This policy explains how we collect, use, and protect your information.
      </p>

      <div className="space-y-10">
        <Section n={1} title="Information We Collect">
          <p className="mb-3">We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-white">Account Information:</strong> Email addresses and
              usernames for premium users
            </li>
            <li>
              <strong className="text-white">Payment Information:</strong> Processed securely through
              PayPal (we do not store credit card details)
            </li>
            <li>
              <strong className="text-white">Usage Data:</strong> Access keys, script usage
              statistics, and service interaction logs
            </li>
            <li>
              <strong className="text-white">Technical Data:</strong> IP addresses, browser type, and
              device information for security purposes
            </li>
          </ul>
        </Section>

        <Section n={2} title="How We Use Your Information">
          <p className="mb-3">We use collected information to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and maintain our services</li>
            <li>Process premium subscriptions and payments</li>
            <li>Generate and validate access keys</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Improve our services and user experience</li>
            <li>Send important service updates and notifications</li>
            <li>Respond to support requests and inquiries</li>
          </ul>
        </Section>

        <Section n={3} title="Data Sharing and Disclosure">
          <p className="mb-3">We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-white">Payment Processors:</strong> PayPal for processing
              premium subscriptions
            </li>
            <li>
              <strong className="text-white">Service Providers:</strong> Third-party services that
              help us operate our platform
            </li>
            <li>
              <strong className="text-white">Legal Requirements:</strong> When required by law or to
              protect our rights
            </li>
          </ul>
        </Section>

        <Section n={4} title="Data Security">
          <p>
            We implement industry-standard security measures to protect your information, including
            encryption, secure servers, and access controls. However, no method of transmission over
            the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section n={5} title="Data Retention">
          <p>
            We retain your information for as long as necessary to provide our services and comply
            with legal obligations. Premium user data is retained for the duration of the
            subscription and for a reasonable period thereafter for record-keeping purposes.
          </p>
        </Section>

        <Section n={6} title="Your Rights">
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data (subject to legal requirements)</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent for data processing where applicable</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us through our Discord server.
          </p>
        </Section>

        <Section n={7} title="Cookies and Tracking">
          <p>
            We use cookies and similar technologies to enhance user experience, analyze usage
            patterns, and maintain session information. You can control cookie settings through your
            browser preferences.
          </p>
        </Section>

        <Section n={8} title="Third-Party Links">
          <p>
            Our services may contain links to third-party websites. We are not responsible for the
            privacy practices of these external sites. We encourage you to review their privacy
            policies.
          </p>
        </Section>

        <Section n={9} title="Children's Privacy">
          <Callout variant="accent">
            Our services are <strong className="text-white">not intended for children under 13</strong>. We
            do not knowingly collect personal information from children. If you believe we have collected
            information from a child, please contact us immediately.
          </Callout>
        </Section>

        <Section n={10} title="Changes to Privacy Policy">
          <p>
            We may update this Privacy Policy periodically. We will notify users of significant
            changes through our website or Discord server. Continued use of our services after
            changes constitutes acceptance of the updated policy.
          </p>
        </Section>
      </div>
    </div>
  );
}

function RefundPolicy() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-3">Refund Policy</h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
        Please read our refund policy carefully before making a purchase.
      </p>

      <div className="space-y-10">
        <Section n={1} title="No Refund Policy">
          <Callout>
            <strong className="text-red-300">All sales are final.</strong> Due to the digital nature of
            our services and instant access to premium scripts, we do not offer refunds for any
            purchases.
          </Callout>
          <p className="mt-4 mb-3">This includes but is not limited to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Premium subscriptions (daily, weekly, monthly, or lifetime)</li>
            <li>Access keys or license purchases</li>
            <li>Any other digital products or services</li>
          </ul>
        </Section>

        <Section n={2} title="Reasons for No Refund Policy">
          <p className="mb-3">Our no-refund policy exists because:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-white">Instant Access:</strong> You receive immediate access to
              all premium scripts upon purchase
            </li>
            <li>
              <strong className="text-white">Digital Nature:</strong> Our products are digital and
              cannot be "returned" once accessed
            </li>
            <li>
              <strong className="text-white">Abuse Prevention:</strong> To prevent fraudulent
              purchases and chargebacks
            </li>
            <li>
              <strong className="text-white">Clear Information:</strong> All features and limitations
              are clearly stated before purchase
            </li>
          </ul>
        </Section>

        <Section n={3} title="Before You Purchase">
          <p className="mb-3">We strongly recommend that you:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Try our free tier first to evaluate our service quality</li>
            <li>Read all product descriptions and feature lists carefully</li>
            <li>Join our Discord server to ask questions and see user feedback</li>
            <li>Watch tutorial videos to understand how our scripts work</li>
            <li>Ensure you understand what you're purchasing</li>
          </ul>
        </Section>

        <Section n={4} title="Exceptions">
          <p className="mb-3">
            While we maintain a strict no-refund policy, we may consider exceptions in the following
            rare circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-white">Technical Issues:</strong> If our services are
              completely non-functional for an extended period and we cannot resolve the issue
            </li>
            <li>
              <strong className="text-white">Duplicate Charges:</strong> If you were accidentally
              charged multiple times for the same purchase
            </li>
            <li>
              <strong className="text-white">Unauthorized Transactions:</strong> If you can prove
              your account was compromised and purchases were made without your consent
            </li>
          </ul>
          <Callout variant="accent">
            Exception requests must be submitted within <strong className="text-white">48 hours</strong> of
            purchase through our Discord support system with appropriate evidence.
          </Callout>
        </Section>

        <Section n={5} title="Service Disruptions">
          <p>
            In the event of planned maintenance or temporary service disruptions, we will extend
            premium subscriptions accordingly. This does not constitute grounds for a refund.
          </p>
        </Section>

        <Section n={6} title="Account Termination">
          <p className="mb-3">
            If your account is terminated due to violation of our Terms of Service, you will not be
            eligible for any refund. This includes but is not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Sharing or selling access keys</li>
            <li>Attempting to reverse engineer our scripts</li>
            <li>Engaging in fraudulent activities</li>
            <li>Violating any other terms outlined in our Terms of Service</li>
          </ul>
        </Section>

        <Section n={7} title="Chargebacks">
          <Callout>
            <strong className="text-red-300">Filing a chargeback is considered fraud</strong> and will
            result in immediate termination of your account and permanent ban from our services. All
            chargeback disputes will be contested with full documentation of service delivery.
          </Callout>
        </Section>

        <Section n={8} title="Contact for Issues">
          <p>
            If you experience any issues with our services, please contact our support team through
            Discord before considering any payment disputes. We are committed to resolving legitimate
            technical issues promptly.
          </p>
        </Section>

        <Section n={9} title="Subscription Cancellation">
          <p>
            You may cancel recurring subscriptions at any time to prevent future charges. However,
            cancellation does not entitle you to a refund for the current billing period. You will
            retain access until the end of your paid period.
          </p>
        </Section>

        <Section n={10} title="Agreement">
          <Callout>
            By making a purchase, you acknowledge that you have read, understood, and agree to this
            refund policy. You confirm that you understand <strong className="text-red-300">all sales are
            final</strong> and that you will not be eligible for a refund except in the rare circumstances
            outlined above.
          </Callout>
        </Section>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          {String(n).padStart(2, '0')}
        </span>
        <span className="w-6 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="pl-10 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {children}
      </div>
    </div>
  );
}

function Callout({
  children,
  variant = 'danger',
}: {
  children: React.ReactNode;
  variant?: 'danger' | 'accent';
}) {
  const styles =
    variant === 'danger'
      ? { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }
      : { backgroundColor: 'rgba(var(--accent-rgb), 0.08)', borderColor: 'rgba(var(--accent-rgb), 0.3)' };

  return (
    <div className="rounded-lg border p-4" style={styles}>
      <p className="text-sm leading-relaxed" style={{ color: variant === 'danger' ? '#fca5a5' : 'var(--text-secondary)' }}>
        {children}
      </p>
    </div>
  );
}
