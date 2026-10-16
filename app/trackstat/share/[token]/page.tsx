import type { Metadata } from 'next';
import Link from 'next/link';
import SharedView from '../../SharedView';
import { savedTheme } from '../../themeServer';
import { trackstatMedia, trackstatRPC } from '@/lib/server/trackstat';
import type { TrackstatHistory } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
// A secret link: keep it out of search results and out of the Referer sent to other sites
export const metadata: Metadata = { title: 'Trackstat | Shared stats', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await trackstatRPC<TrackstatHistory>('trackstat_shared', { p_token: token }).catch(() => null);
  const theme = await savedTheme();
  if (!data) {
    return (
      <div data-ts-theme={theme} className="fixed inset-0 z-[200] grid place-items-center overflow-auto bg-ts-bg p-6 text-center">
        <div><h1 className="text-xl font-semibold text-ts-fg">This link is not active</h1><p className="mt-2 max-w-sm text-sm leading-6 text-ts-fg/50">It may have been turned off by its owner, or the address is wrong.</p><Link href="/trackstat" className="mt-5 inline-block text-sm text-ts-accent hover:underline">Open Trackstat</Link></div>
      </div>
    );
  }
  const media = await trackstatMedia([data.account.roblox_id]);
  return <SharedView data={data} avatar={media.avatars[data.account.roblox_id] ?? null} token={token} initialTheme={theme} />;
}
