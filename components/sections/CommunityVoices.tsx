'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

export default function CommunityVoices() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => {
        if (d.testimonials?.length) setTestimonials(d.testimonials);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prev = () => setIndex(i => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex(i => (i + 1) % testimonials.length);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const id = setInterval(() => setIndex(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  if (loading || testimonials.length === 0) return null;

  const t = testimonials[index];

  return (
    <section className="pt-12 pb-4">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
          Community Voices
        </p>
        <h2 className="font-bold text-white text-2xl" style={{ letterSpacing: '-0.02em' }}>
          Trusted by creators &amp; scripters
        </h2>
      </div>

      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Quote className="absolute top-6 left-6 w-8 h-8 opacity-10 text-white" />

        <p className="text-base leading-relaxed text-white mb-8 pl-2">
          &ldquo;{t.content}&rdquo;
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={t.avatar}
              alt={t.author}
              className="w-10 h-10 rounded-full bg-[#1a1a1a]"
            />
            <div>
              <p className="text-sm font-semibold text-white">{t.author}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {index + 1}/{testimonials.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.06]"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.06]"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
