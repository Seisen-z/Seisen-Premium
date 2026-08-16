'use client';

import { useState, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const ACCENT = '#c9a97a';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-97, 38],   CA: [-106, 56],  MX: [-102, 24],
  BR: [-53, -10],  AR: [-64, -34],  CO: [-74, 4],   CL: [-71, -30],
  GB: [-3, 55],    FR: [2, 46],     DE: [10, 51],   ES: [-4, 40],
  IT: [12, 42],    NL: [5, 52],     PL: [20, 52],   SE: [18, 60],
  RU: [105, 62],   TR: [35, 39],    UA: [32, 49],
  SA: [45, 24],    AE: [54, 24],    EG: [30, 27],
  NG: [8, 9],      ZA: [25, -29],   KE: [38, 0],
  IN: [79, 21],    PK: [68, 30],    BD: [90, 24],
  CN: [105, 35],   JP: [138, 36],   KR: [128, 36],
  TH: [101, 16],   VN: [108, 14],   MY: [110, 4],
  ID: [118, -2],   PH: [122, 13],   SG: [104, 1],
  AU: [133, -25],  NZ: [172, -41],
};

const CONTINENT_LABELS = [
  { label: 'NORTH AMERICA', coords: [-100, 48] as [number, number] },
  { label: 'SOUTH AMERICA', coords: [-60, -20] as [number, number] },
  { label: 'EUROPE',        coords: [15, 54]   as [number, number] },
  { label: 'AFRICA',        coords: [20, 5]    as [number, number] },
  { label: 'ASIA',          coords: [90, 45]   as [number, number] },
  { label: 'AUSTRALIA',     coords: [134, -28] as [number, number] },
];

interface Props {
  topCountries: { code: string; count: number }[];
  className?: string;
  mini?: boolean;
  showStats?: boolean;
  totalExecutions?: number;
}

export default function WorldExecutionMap({
  topCountries,
  className = '',
  mini = false,
  showStats = false,
  totalExecutions = 0,
}: Props) {
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [10, 5],
    zoom: 1,
  });

  const maxCount = Math.max(1, topCountries[0]?.count ?? 1);

  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        minHeight: mini ? 180 : 420,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Stats overlay (full map only) */}
      {showStats && (
        <div
          className="absolute top-4 left-4 z-10 rounded-xl p-3"
          style={{
            backgroundColor: 'rgba(8,8,8,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Script Executions
          </p>
          <p className="text-2xl font-bold text-white leading-none mt-0.5" style={{ letterSpacing: '-0.04em' }}>
            {totalExecutions.toLocaleString()}
          </p>
          <p className="text-[10px] mt-1" style={{ color: ACCENT }}>
            {topCountries.length} countr{topCountries.length === 1 ? 'y' : 'ies'} tracked
          </p>
        </div>
      )}

      {/* Zoom controls (full map only) */}
      {!mini && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
          {['+', '−'].map((label, i) => (
            <button
              key={label}
              onClick={() =>
                setPosition(p => ({
                  ...p,
                  zoom: i === 0
                    ? Math.min(8, p.zoom * 1.5)
                    : Math.max(1, p.zoom / 1.5),
                }))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ComposableMap
        width={960}
        height={mini ? 420 : 560}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          maxZoom={8}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(255,255,255,0.07)"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: 'rgba(201,169,122,0.18)' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Continent labels (only when zoomed out) */}
          {!mini && position.zoom < 2 &&
            CONTINENT_LABELS.map(({ label, coords }) => (
              <Marker key={label} coordinates={coords}>
                <text
                  textAnchor="middle"
                  style={{
                    fontSize: 5.5,
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    fill: 'rgba(255,255,255,0.15)',
                    pointerEvents: 'none',
                  }}
                >
                  {label}
                </text>
              </Marker>
            ))
          }

          {/* Execution markers */}
          {topCountries.map((c) => {
            const coords = COUNTRY_COORDS[c.code];
            if (!coords) return null;

            const pct    = c.count / maxCount;
            const rInner = mini ? 3 + pct * 3 : 4 + pct * 5;
            const rPulse = rInner * 2.4;

            return (
              <Marker key={c.code} coordinates={coords}>
                <circle r={rPulse} fill={ACCENT} opacity={0.1} />
                <circle r={rInner} fill={ACCENT} opacity={0.88} />
                {!mini && (
                  <>
                    <text
                      textAnchor="middle"
                      y={-rInner - 4}
                      style={{
                        fontSize: 5,
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fill: 'rgba(255,255,255,0.9)',
                        pointerEvents: 'none',
                      }}
                    >
                      {c.code}
                    </text>
                    <text
                      textAnchor="middle"
                      y={-rInner - 10}
                      style={{
                        fontSize: 4.5,
                        fontFamily: 'inherit',
                        fill: ACCENT,
                        pointerEvents: 'none',
                      }}
                    >
                      {c.count}×
                    </text>
                  </>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
