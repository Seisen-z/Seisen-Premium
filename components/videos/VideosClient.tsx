'use client';

import { useState } from 'react';
import { Play, ExternalLink, X } from 'lucide-react';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface VideosClientProps {
  initialVideos: Video[];
}

function timeAgo(dateString: string) {
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s / 31536000 > 1) return Math.floor(s / 31536000) + 'y ago';
  if (s / 2592000  > 1) return Math.floor(s / 2592000)  + 'mo ago';
  if (s / 604800   > 1) return Math.floor(s / 604800)   + 'w ago';
  if (s / 86400    > 1) return Math.floor(s / 86400)    + 'd ago';
  if (s / 3600     > 1) return Math.floor(s / 3600)     + 'h ago';
  if (s / 60       > 1) return Math.floor(s / 60)       + 'm ago';
  return s + 's ago';
}

export default function VideosClient({ initialVideos }: VideosClientProps) {
  const [selected, setSelected] = useState<Video | null>(null);

  const featured = initialVideos[0] ?? null;
  const rest     = initialVideos.slice(1);

  return (
    <div className="min-h-screen px-6 md:px-14 pt-16 pb-28 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-16">
        <div>
          <h1
            className="font-bold text-white leading-none mb-4"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.04em' }}
          >
            Videos
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {initialVideos.length} tutorial{initialVideos.length !== 1 ? 's' : ''} — guides, showcases, updates
          </p>
        </div>
        <a
          href="https://www.youtube.com/@SeisenHub"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.09)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
        >
          @SeisenHub <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
      </div>

      {initialVideos.length === 0 ? (
        <div className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No videos loaded.</p>
          <a href="https://www.youtube.com/@SeisenHub" target="_blank" rel="noopener noreferrer"
            className="text-sm mt-2 inline-block" style={{ color: 'var(--accent)' }}>
            Visit channel →
          </a>
        </div>
      ) : (
        <>
          {/* ── Featured video ── */}
          {featured && (
            <div
              className="flex flex-col lg:flex-row gap-0 mb-16 rounded-xl overflow-hidden cursor-pointer group"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              onClick={() => setSelected(featured)}
            >
              {/* Thumbnail */}
              <div className="relative lg:w-[60%] aspect-video lg:aspect-auto bg-black shrink-0">
                <Image
                  src={featured.thumbnail}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
                {/* Latest badge */}
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>
                    Latest
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 p-7 lg:p-10 flex flex-col justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(featured.publishedAt)}
                  </p>
                  <h2 className="font-bold text-white text-xl leading-tight mb-4 line-clamp-3">
                    {featured.title}
                  </h2>
                </div>
                <div
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  <Play className="w-3.5 h-3.5" /> Watch now
                </div>
              </div>
            </div>
          )}

          {/* ── Rest grid ── */}
          {rest.length > 0 && (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-6" style={{ color: 'var(--text-muted)' }}>
                All videos
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialVideos.map((video, i) => (
                  <div
                    key={video.id}
                    className="group cursor-pointer rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    onClick={() => setSelected(video)}
                  >
                    <div className="relative aspect-video bg-black">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-[10px] pt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug mb-1.5">
                            {video.title}
                          </h3>
                          <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {timeAgo(video.publishedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Video modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-5xl rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative pt-[56.25%] bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selected.id}?autoplay=1`}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div
              className="flex items-center justify-between gap-4 px-5 py-3"
              style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{selected.title}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(selected.publishedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
