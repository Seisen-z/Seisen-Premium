import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Seisen — Premium Roblox Scripts';
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
            top: '-100px',
            left: '-100px',
            width: '700px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 65%)',
          }}
        />

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            All systems operational
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: '130px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '20px' }}>
          Seisen
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: '26px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, maxWidth: '520px', marginBottom: 'auto' }}>
          Premium Roblox scripts for enhanced gaming.
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
          {['Free Scripts', 'Premium Access', 'No Sign-up Required'].map(tag => (
            <div
              key={tag}
              style={{
                padding: '10px 22px',
                borderRadius: '100px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.55)',
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
