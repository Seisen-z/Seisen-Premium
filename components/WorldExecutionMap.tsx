'use client';

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const ACCENT = '#c9a97a';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-97, 38],   CA: [-106, 56],  MX: [-102, 24],
  BR: [-53, -10],  AR: [-64, -34],  CO: [-74, 4],
  GB: [-3, 55],    FR: [2, 46],     DE: [10, 51],
  ES: [-4, 40],    IT: [12, 42],    NL: [5, 52],
  RU: [105, 62],   TR: [35, 39],    SA: [45, 24],
  NG: [8, 9],      ZA: [25, -29],   EG: [30, 27],
  IN: [79, 21],    PK: [68, 30],    BD: [90, 24],
  CN: [105, 35],   JP: [138, 36],   KR: [128, 36],
  TH: [101, 16],   VN: [108, 14],   MY: [110, 4],
  ID: [118, -2],   PH: [122, 13],   SG: [104, 1],
  AU: [133, -25],  NZ: [172, -41],  UA: [32, 49],
  PL: [20, 52],    SE: [18, 60],    NO: [10, 62],
  CL: [-71, -30],  PE: [-76, -10],  VE: [-66, 8],
};

interface Props {
  topCountries: { code: string; count: number }[];
  className?: string;
  mini?: boolean;
}

export default function WorldExecutionMap({ topCountries, className = '', mini = false }: Props) {
  const maxCount = Math.max(1, topCountries[0]?.count ?? 1);

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: mini ? 160 : 340 }}>
      <ComposableMap
        width={960}
        height={mini ? 380 : 500}
        projectionConfig={{ scale: 153, center: [10, 0] }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(255,255,255,0.06)"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none', fill: 'rgba(201,169,122,0.14)' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {topCountries.map((c, i) => {
          const coords = COUNTRY_COORDS[c.code];
          if (!coords) return null;

          const pct   = c.count / maxCount;
          const rInner = mini ? 4 + pct * 3 : 5 + pct * 6;
          const rOuter = rInner * 2.2;

          return (
            <Marker key={c.code} coordinates={coords}>
              <circle r={rOuter} fill={ACCENT} opacity={0.1} />
              <circle r={rInner} fill={ACCENT} opacity={0.85} />
              {!mini && (
                <>
                  <text
                    textAnchor="middle"
                    y={-rInner - 5}
                    style={{ fontFamily: 'inherit', fontSize: 7, fill: 'rgba(255,255,255,0.9)', fontWeight: 700 }}
                  >
                    {c.code}
                  </text>
                  <text
                    textAnchor="middle"
                    y={-rInner - 14}
                    style={{ fontFamily: 'inherit', fontSize: 6, fill: ACCENT }}
                  >
                    {c.count}×
                  </text>
                </>
              )}
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
