'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/client/auth';
import { FileCode, Clock, ShieldCheck, AlertCircle, Copy, Check, Star, X } from 'lucide-react';

const LOADSTRING = `loadstring(game:HttpGet("https://api.jnkie.com/api/v1/luascripts/public/d78ef9f0c5183f52d0e84d7efed327aa9a7abfb995f4ce86c22c3a7bc4d06a6f/download"))()`;

function ReviewModal({ email, onDone }: { email: string | null; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedGame, setSelectedGame] = useState('');
  const [games, setGames] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(d => { if (d.games) setGames([...d.games, 'Other']); })
      .catch(() => setGames(['Blox Fruits', 'Pet Simulator 99', 'Anime Defenders', 'Fisch', 'Rivals', 'Da Hood', 'Other']));
  }, []);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || null,
          display_name: displayName.trim() || null,
          rating,
          game: selectedGame || null,
          content: content.trim() || null,
        }),
      });
    } catch { /* non-critical */ }
    setSubmitted(true);
    setTimeout(onDone, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0e0e0e] rounded-2xl border border-[#222] shadow-2xl overflow-hidden">
        <button onClick={onDone} className="absolute top-4 right-4 text-[#444] hover:text-white transition-colors rounded-lg p-1 hover:bg-[#1a1a1a]" aria-label="Skip">
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-2">
              <Check className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <p className="text-white font-bold text-lg">Thank you!</p>
            <p className="text-[#555] text-sm">Your review has been submitted.</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-[#1a1a1a]">
              <h2 className="text-white font-bold text-base">How's your experience?</h2>
              <p className="text-[#555] text-sm mt-1">Leave a quick review before copying.</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-[#888] mb-2">Rating <span className="text-red-400">*</span></p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`w-7 h-7 transition-colors ${
                        star <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#2a2a2a]'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[#888] mb-2">Which game? <span className="text-[#444] text-xs">(optional)</span></p>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {games.map((game) => (
                    <button
                      key={game}
                      onClick={() => setSelectedGame(selectedGame === game ? '' : game)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                        selectedGame === game
                          ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]'
                          : 'bg-[#111] border-[#1a1a1a] text-[#555] hover:border-[#222] hover:text-[#999]'
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[#888] mb-1.5">Display Name <span className="text-[#444] text-xs">(optional)</span></p>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 80))}
                  placeholder="e.g. bloxplayer123"
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#1a1a1a] rounded-xl focus:border-[#333] text-white text-sm outline-none transition-colors placeholder:text-[#333]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#888] mb-1.5">Review <span className="text-[#444] text-xs">(optional)</span></p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  placeholder="Share your experience with Seisen Hub..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#1a1a1a] rounded-xl focus:border-[#333] text-white text-sm outline-none transition-colors placeholder:text-[#333] resize-none"
                />
                <p className="text-xs text-[#333] text-right mt-1">{content.length}/500</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 border-t border-[#1a1a1a] pt-4">
              <button
                onClick={onDone}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] text-sm text-[#555] hover:text-white transition-colors font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  rating === 0
                    ? 'bg-[#1a1a1a] text-[#333] cursor-not-allowed'
                    : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black'
                }`}
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientScriptPage() {
  const { email, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyHistory, setCopyHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('seisen_copy_history') || '[]');
    setCopyHistory(history);

    if (isAuthenticated && email) {
      fetch(`/api/client/data?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.orders?.length > 0) {
            const hasPaid = data.data.orders.some((o: any) =>
              o.payment_status === 'COMPLETED' || o.payment_status === 'paid'
            );
            setHasAccess(hasPaid);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email, isAuthenticated]);

  const doCopy = () => {
    try {
      navigator.clipboard.writeText(LOADSTRING);
    } catch {
      const el = document.createElement('textarea');
      el.value = LOADSTRING;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const newEntry = { date: new Date().toISOString() };
    const updated = [newEntry, ...copyHistory];
    setCopyHistory(updated);
    localStorage.setItem('seisen_copy_history', JSON.stringify(updated));
  };

  const handleCopy = () => {
    const hasReviewed = localStorage.getItem('seisen_reviewed') === '1';
    const isSecondCopy = copyHistory.length === 1;
    if (isSecondCopy && !hasReviewed) setShowReview(true);
    else doCopy();
  };

  const handleReviewDone = () => {
    localStorage.setItem('seisen_reviewed', '1');
    setShowReview(false);
    doCopy();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {showReview && <ReviewModal email={email ?? null} onDone={handleReviewDone} />}

      <div>
        <h1 className="text-2xl font-bold text-white">Script</h1>
        <p className="text-sm text-[#555] mt-1">Your premium script access.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#444]">Loading…</div>
      ) : hasAccess ? (
        <div className="grid md:grid-cols-2 gap-4">

          {/* Script card */}
          <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a1a]">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <FileCode className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Seisen Hub Premium</h3>
                <p className="text-xs text-[#555]">Loadstring · Auto-Updates</p>
              </div>
              <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-[var(--accent)] border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-[#555]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                HWID Protection Enabled
              </div>

              <div>
                <p className="text-xs font-medium text-[#555] mb-2">Loadstring</p>
                <pre className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-xs text-[var(--accent)] font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">
                  {LOADSTRING}
                </pre>
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold text-sm rounded-xl transition-colors"
              >
                {copied
                  ? <><Check className="w-4 h-4" /> Copied!</>
                  : <><Copy className="w-4 h-4" /> Copy Loadstring</>
                }
              </button>

              <p className="text-xs text-[#444] text-center">
                Paste into your executor and execute.
              </p>
            </div>
          </div>

          {/* Copy history */}
          <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#444]" />
                <h3 className="text-sm font-bold text-white">Copy History</h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1a1a1a] text-[#666] border border-[#222]">
                {copyHistory.length} copies
              </span>
            </div>

            <div className="px-5 py-4">
              {copyHistory.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#444]">
                  No history yet. Copy the loadstring to get started.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {copyHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-[#111] border border-[#1a1a1a]">
                      <span className="text-sm text-[#666]">Loadstring copied</span>
                      <span className="text-xs text-[#444]">{new Date(entry.date).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-[#444]" />
          </div>
          <p className="text-base font-bold text-white mb-1">No Active License Found</p>
          <p className="text-sm text-[#555] mb-6">You need to purchase a subscription to access the script.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#222] text-sm text-[#666] hover:text-white transition-colors font-medium"
          >
            View Store
          </button>
        </div>
      )}

    </div>
  );
}
