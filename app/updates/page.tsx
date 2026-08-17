import { supabase } from '@/lib/server/db';
import UpdatesGrid, { type Update } from './UpdatesGrid';

async function fetchUpdates(): Promise<Update[]> {
  try {
    const { data } = await supabase
      .from('site_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return (data as Update[]) ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function UpdatesPage() {
  const updates = await fetchUpdates();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808' }}>
      {/* Header */}
      <div
        className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 pt-24 pb-8"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="section-label mb-3" style={{ color: '#c9a97a', opacity: 1 }}>Changelog</p>
        <h1
          className="font-bold text-white mb-3"
          style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Updates & Announcements
        </h1>
        <p className="text-sm max-w-xl" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          Script patches, new additions, and hub announcements — all in one place.
        </p>
      </div>

      {/* Grid with filters */}
      <div className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-14">
        <UpdatesGrid updates={updates} />
      </div>
    </div>
  );
}
