'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

interface Payment {
  transaction_id: string;
  payer_email?: string;
  payer_id?: string;
  roblox_username?: string;
  roblox_uaid?: string;
  tier: string;
  amount: number;
  currency: string;
  payment_status: string;
  generated_keys: string | string[];
  discord_id?: string;
  discord_tag?: string;
  created_at: string;
  updated_at: string;
}

const SITE_URL = 'https://seisen.vercel.app';

export default function EvidencePage() {
  const { transactionId } = useParams();
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchPayment(token);
  }, [transactionId]);

  const fetchPayment = async (token: string) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const match = data.payments.find((p: Payment) => p.transaction_id === transactionId);
        if (match) setPayment(match);
        else setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (notFound || !payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#0a0a0a' }}>
        <p className="text-white">Transaction not found.</p>
        <Link href="/admin" className="text-sm accent-text hover:underline">Back to admin</Link>
      </div>
    );
  }

  const keys = Array.isArray(payment.generated_keys)
    ? payment.generated_keys
    : payment.generated_keys
      ? [payment.generated_keys]
      : [];

  const purchaseDate = new Date(payment.created_at);
  const method = payment.currency === 'ROBUX' ? 'Robux (in-experience purchase)' : 'PayPal';
  const amountLabel = payment.currency === 'ROBUX' ? `${payment.amount} Robux` : `${payment.amount} ${payment.currency}`;
  const customerName = payment.payer_email || payment.discord_tag || payment.roblox_username || 'Unknown';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, .print-doc { background: white !important; color: black !important; }
          .print-doc * { color: black !important; border-color: #ccc !important; background: white !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10" style={{ backgroundColor: '#0a0a0a' }}>
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white accent-bg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div className="print-doc max-w-3xl mx-auto px-6 py-12 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 accent-text" />
          <h1 className="text-2xl font-bold">Chargeback / Dispute Evidence Summary</h1>
        </div>
        <p className="text-sm text-[#888] mb-10">
          Prepared by Seisen Premium for submission to PayPal Resolution Center. Generated on{' '}
          {new Date().toLocaleString()}.
        </p>

        <DocSection title="1. Transaction Details">
          <Row label="Transaction ID" value={payment.transaction_id} mono />
          <Row label="Purchase Date" value={purchaseDate.toLocaleString()} />
          <Row label="Amount Charged" value={amountLabel} />
          <Row label="Payment Method" value={method} />
          <Row label="Plan / Tier" value={payment.tier} />
          <Row label="Payment Status" value={payment.payment_status} />
        </DocSection>

        <DocSection title="2. Customer Identification">
          <Row label="Name / Buyer" value={customerName} />
          {payment.payer_email && <Row label="PayPal Email" value={payment.payer_email} />}
          {payment.payer_id && <Row label="PayPal Payer ID" value={payment.payer_id} mono />}
          {payment.discord_tag && <Row label="Discord Account" value={`${payment.discord_tag} (ID: ${payment.discord_id})`} />}
          {payment.roblox_username && <Row label="Roblox Username" value={payment.roblox_username} />}
        </DocSection>

        <DocSection title="3. Proof of Delivery">
          <p className="text-sm text-[#bbb] leading-relaxed mb-3">
            This is a digital product. Access was granted <strong className="text-white">instantly and automatically</strong> upon
            successful payment confirmation, via an auto-generated license key tied to this transaction ID.
          </p>
          {keys.length > 0 ? (
            <>
              <p className="text-sm text-[#888] mb-2">License key(s) issued to this transaction:</p>
              <ul className="space-y-1 mb-2">
                {keys.map((k, i) => (
                  <li key={i} className="text-sm font-mono bg-white/5 rounded px-3 py-1.5 inline-block mr-2">{k}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-[#888]">No license key is on record for this transaction.</p>
          )}
          <p className="text-xs text-[#666] mt-2">
            Delivery/record timestamp: {new Date(payment.updated_at).toLocaleString()}
          </p>
        </DocSection>

        <DocSection title="4. No-Refund Policy Acknowledgment">
          <p className="text-sm text-[#bbb] leading-relaxed mb-3">
            Before this purchase could be completed, the buyer was required to explicitly acknowledge, via
            two separate mandatory checkboxes (not a single blanket agreement), the following statement:
          </p>
          <blockquote className="border-l-2 pl-4 text-sm text-[#ddd] italic mb-3" style={{ borderColor: 'var(--accent)' }}>
            "I understand and accept that all sales are final and no refunds will be issued under any
            circumstance."
          </blockquote>
          <p className="text-sm text-[#bbb] leading-relaxed mb-3">
            The checkout button remained disabled for a minimum 5-second read period after both boxes were
            checked, and could not be bypassed. The full policy is published at{' '}
            <span className="font-mono">{SITE_URL}/legal#refund</span> and was linked directly in the
            checkout flow prior to payment.
          </p>
        </DocSection>

        <DocSection title="5. Merchant Statement">
          <p className="text-sm text-[#bbb] leading-relaxed">
            The buyer purchased digital access to Seisen Premium services, which was delivered instantly and
            in full at the time of payment, as evidenced by the license key(s) above. The buyer explicitly
            acknowledged and agreed to our no-refund policy before completing checkout. As the product was
            delivered as described and the buyer accepted the stated terms prior to purchase, we respectfully
            contest this dispute and request that it be resolved in the merchant's favor.
          </p>
        </DocSection>
      </div>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 pb-8 border-b border-white/10 last:border-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#888] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-[#888]">{label}</span>
      <span className={`text-white text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
