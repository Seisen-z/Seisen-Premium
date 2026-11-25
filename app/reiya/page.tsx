import type { Metadata } from 'next';
import Image from 'next/image';
import { Download, HardDrive, ShieldCheck } from 'lucide-react';
import { downloadPath, latestReiyaRelease } from '@/lib/server/reiya-release';
import { REIYA_PURCHASE_ID } from '@/lib/reiya-purchase';
import { reiyaBillingMode, reiyaCheckoutEnabled } from '@/lib/server/reiya-purchase';
import ReiyaCheckout from './ReiyaCheckout';

export const metadata: Metadata = {
  title: 'Reiya Account Manager',
  description: 'Download Reiya for Windows and get Reiya Premium for encrypted cloud backups.',
  alternates: { canonical: '/reiya' },
};

export const revalidate = 120;

export default async function ReiyaPage({ searchParams }: { searchParams: Promise<{ purchase?: string | string[]; cancelled?: string | string[] }> }) {
  const [release, query] = await Promise.all([latestReiyaRelease().catch(() => null), searchParams]);
  const purchaseId = typeof query.purchase === "string" && REIYA_PURCHASE_ID.test(query.purchase) ? query.purchase : undefined;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:px-12 md:py-24">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-10">
        <Image src="/reiya-logo.png" alt="" width={64} height={64} className="mb-6 rounded-2xl" />
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white md:text-6xl">Reiya Account Manager</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
          Organize your Roblox accounts, save games, and launch multiple instances from one Windows app.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {release ? (
            <>
              <a href={downloadPath(release)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-black hover:bg-white/85">
                <Download size={18} aria-hidden="true" /> Download for Windows
              </a>
              <span className="text-sm text-white/65">Version {release.version} ? Free</span>
              {release.checksums && (
                <a href={downloadPath(release, release.checksums)} className="text-sm text-white/65 underline underline-offset-4 hover:text-white">SHA-256 checksum</a>
              )}
            </>
          ) : (
            <p role="status" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70">
              The download will appear here after the first signed Seisen Premium build is published.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="reiya-premium" className="mt-6 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:grid-cols-2 md:items-start md:p-10">
        <div>
          <h2 id="reiya-premium" className="text-2xl font-semibold tracking-tight text-white">Reiya Premium</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-white/70">Back up your Roblox accounts, games, and app settings to encrypted cloud storage. Activate your Premium key in Reiya to restore them on another PC.</p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            <li className="inline-flex items-center gap-2"><ShieldCheck size={16} aria-hidden="true" /> Encrypted backups</li>
            <li className="inline-flex items-center gap-2"><HardDrive size={16} aria-hidden="true" /> Up to three computers</li>
          </ul>
        </div>
        <ReiyaCheckout
          checkoutEnabled={reiyaCheckoutEnabled()}
          sandbox={reiyaBillingMode() === "sandbox"}
          purchaseId={purchaseId}
          cancelled={query.cancelled === "1"}
        />
      </section>
    </div>
  );
}
