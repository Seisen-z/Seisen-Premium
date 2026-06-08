export default function PremiumSkeleton() {
  return (
    <div className="min-h-screen px-6 md:px-14 pt-16 pb-28 max-w-6xl mx-auto">
      <style>{`
        @keyframes sk-pulse { 0%,100% { opacity:.06 } 50% { opacity:.13 } }
        .sk { border-radius:8px; background:white; animation:sk-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div className="space-y-16">

        {/* Header */}
        <div>
          <div className="sk h-20 w-64 mb-5" style={{ borderRadius: '6px' }} />
          <div className="sk h-4 w-56" />
        </div>

        {/* Discord banner */}
        <div className="sk h-16 w-full rounded-2xl" />

        {/* Payment tabs */}
        <div>
          <div className="sk h-3 w-16 mb-5" />
          <div className="flex gap-2">
            {[72, 64, 64, 64].map((w, i) => (
              <div key={i} className="sk h-9" style={{ width: `${w}px`, borderRadius: '8px' }} />
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div>
          <div className="sk h-3 w-12 mb-5" />
          <div className="grid md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-2xl p-6 space-y-4"
                style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <div className="sk h-4 w-20" />
                <div className="sk h-10 w-28" />
                <div className="space-y-2">
                  {[80, 90, 72, 85].map((w, j) => (
                    <div key={j} className="sk h-3" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="sk h-11 w-full rounded-xl mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="sk h-3 w-10 mb-8" />
          <div className="space-y-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-8 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="sk h-3 w-6 mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="sk h-3 w-48" />
                  <div className="sk h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
