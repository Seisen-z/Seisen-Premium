import { supabase } from '@/lib/server/db';
import { formatDistanceToNow } from 'date-fns';

const ACCENT = '#c9a97a';

const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Update':       { bg: 'rgba(201,169,122,0.1)', text: '#c9a97a',  border: 'rgba(201,169,122,0.25)' },
  'New Script':   { bg: 'rgba(110,231,183,0.1)', text: '#6ee7b7',  border: 'rgba(110,231,183,0.25)' },
  'Patch':        { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24',  border: 'rgba(251,191,36,0.25)'  },
  'Maintenance':  { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa',  border: 'rgba(167,139,250,0.25)' },
  'Announcement': { bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa',  border: 'rgba(96,165,250,0.25)'  },
};

function tagStyle(tag: string) {
  return TAG_STYLES[tag] ?? TAG_STYLES['Update'];
}

interface Update {
  id: number;
  title: string;
  content: string;
  tag: string;
  image_url: string | null;
  created_at: string;
}

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
        className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 pt-28 pb-16"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="section-label mb-4" style={{ color: ACCENT, opacity: 1 }}>Changelog</p>
        <h1
          className="font-bold text-white mb-4"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.05 }}
        >
          Updates & Announcements
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>
          Script patches, new additions, and hub announcements — all in one place.
        </p>
      </div>

      {/* Feed */}
      <div className="px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20 py-16 max-w-4xl">
        {updates.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            <p className="text-2xl mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>No updates yet</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Check back soon for script updates and announcements.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px hidden md:block"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: '11px' }}
            />

            <div className="space-y-0">
              {updates.map((update, i) => {
                const ts = tagStyle(update.tag);
                const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
                const dateStr = new Date(update.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                });

                return (
                  <div key={update.id} className="relative flex gap-6 md:gap-8 pb-10">
                    {/* Timeline dot */}
                    <div className="hidden md:flex flex-col items-center shrink-0 mt-1" style={{ width: '23px' }}>
                      <div
                        className="h-5 w-5 rounded-full border-2 z-10 shrink-0"
                        style={{
                          backgroundColor: i === 0 ? ACCENT : '#1a1a1a',
                          borderColor: i === 0 ? ACCENT : 'rgba(255,255,255,0.15)',
                        }}
                      />
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-2xl overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {update.image_url && (
                        <img
                          src={update.image_url}
                          alt={update.title}
                          className="w-full object-cover"
                          style={{ maxHeight: '240px' }}
                        />
                      )}

                      <div className="p-6">
                        {/* Tag + date */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
                          >
                            {update.tag}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }} title={dateStr}>
                            {timeAgo}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                            {dateStr}
                          </span>
                        </div>

                        <h2 className="text-lg font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
                          {update.title}
                        </h2>

                        <div
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}
                        >
                          {update.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
