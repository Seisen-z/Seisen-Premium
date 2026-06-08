import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Seisen Premium — No Key System, Full Access';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080808',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '700px',
            height: '550px',
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.18) 0%, transparent 65%)',
          }}
        />

        {/* Label */}
        <div style={{ display: 'flex', marginBottom: '32px' }}>
          <div
            style={{
              padding: '8px 20px',
              borderRadius: '100px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Premium
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: '80px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '24px' }}>
          No key system.{'\n'}Full access.
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '560px', marginBottom: 'auto' }}>
          Every script, zero checkpoints. Weekly, monthly, or lifetime — starting at ₱149.
        </div>

        {/* Bottom features */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
          {['All Scripts Unlocked', 'Instant Access', 'Priority Support'].map(tag => (
            <div
              key={tag}
              style={{
                padding: '10px 22px',
                borderRadius: '100px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#10b981',
                fontSize: '15px',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
