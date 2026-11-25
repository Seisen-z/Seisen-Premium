import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Reiya Premium policies' };

export default function ReiyaPolicies() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-16 text-white/75 md:py-24">
      <Link href="/reiya" className="text-sm underline underline-offset-4">Back to Reiya</Link>
      <h1 className="text-4xl font-semibold text-white">Reiya Premium policies</h1>
      <section id="terms" className="scroll-mt-24 space-y-2">
        <h2 className="text-2xl font-semibold text-white">Subscription terms</h2>
        <p>Seisen Premium offers monthly and yearly Reiya Premium subscriptions. PayPal shows the amount and billing interval before approval and renews your subscription at that interval until you cancel. Premium provides encrypted cloud backup and restore on up to three activated computers while paid access is active.</p>
      </section>
      <section id="refunds" className="scroll-mt-24 space-y-2">
        <h2 className="text-2xl font-semibold text-white">Refunds and cancellation</h2>
        <p>Cancel future renewals through PayPal. For refund support, email <a href="mailto:support@seisen.store" className="underline">support@seisen.store</a> with your PayPal purchase ID. A completed full refund or reversed payment can revoke cloud access. Applicable consumer rights still apply.</p>
      </section>
      <section id="privacy" className="scroll-mt-24 space-y-2">
        <h2 className="text-2xl font-semibold text-white">Privacy</h2>
        <p>PayPal handles payment details. Seisen Premium keeps purchase identifiers, PayPal payer information for delivery and support, the billing terms accepted, activation information, and encrypted backups. The desktop app encrypts snapshots before uploading them. Keep your activation key and purchase receipt private.</p>
        <p>Backups are available for up to 15 days, with up to five snapshots per paid profile. Contact Seisen support for questions about purchase data or backups.</p>
      </section>
    </article>
  );
}
