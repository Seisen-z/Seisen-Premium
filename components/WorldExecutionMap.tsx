'use client';

import { useEffect, useRef } from 'react';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
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

interface Props {
  topCountries: { code: string; count: number }[];
  className?: string;
  mini?: boolean;
  totalExecutions?: number;
}

export default function WorldExecutionMap({
  topCountries,
  className = '',
  mini = false,
  totalExecutions = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<any[]>([]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import('maplibre-gl').then((mlModule) => {
      if (cancelled || !containerRef.current) return;
      const ml = (mlModule as any).default ?? mlModule;

      // point worker at self-hosted file to avoid MIME type errors
      if (ml.setWorkerUrl) ml.setWorkerUrl('/maplibre-gl-worker.mjs');

      // inject maplibre CSS once
      if (!document.getElementById('maplibre-css')) {
        const link = document.createElement('link');
        link.id   = 'maplibre-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }

      const map = new ml.Map({
        container: containerRef.current!,
        style:     DARK_STYLE,
        center:    [10, 20],
        zoom:      mini ? 0.8 : 1.5,
        minZoom:   0.5,
        maxZoom:   8,
        attributionControl: false,
        logoPosition: 'bottom-right',
      });

      mapRef.current = map;

      map.on('load', () => {
        map.resize();
        addMarkers(ml, map);
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers whenever topCountries changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    import('maplibre-gl').then((mlModule) => {
      const ml = (mlModule as any).default ?? mlModule;
      addMarkers(ml, map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCountries]);

  function addMarkers(ml: any, map: any) {
    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const maxCount = Math.max(1, topCountries[0]?.count ?? 1);

    topCountries.forEach(c => {
      const coords = COUNTRY_COORDS[c.code];
      if (!coords) return;

      const pct  = c.count / maxCount;
      const size = mini ? 8 + pct * 6 : 12 + pct * 10;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${ACCENT};
        border-radius: 50%;
        border: 2px solid rgba(201,169,122,0.4);
        box-shadow: 0 0 ${size * 1.5}px rgba(201,169,122,0.35);
        cursor: pointer;
        transition: transform 0.15s ease;
      `;
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const popup = new ml.Popup({ offset: size / 2 + 4, closeButton: false, className: 'seisen-popup' }).setHTML(`
        <div style="font-family:inherit;padding:6px 10px;background:rgba(12,12,12,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white">
          <div style="font-size:11px;font-weight:700;">${c.code}</div>
          <div style="font-size:10px;color:${ACCENT};margin-top:2px">${c.count} execution${c.count !== 1 ? 's' : ''}</div>
        </div>
      `);

      const marker = new ml.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }

  const height = mini ? 220 : 420;

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }} />

      {/* Hide MapLibre logo/attribution to keep it clean */}
      <style>{`
        .maplibregl-ctrl-bottom-right { display: none !important; }
        .maplibregl-ctrl-bottom-left  { display: none !important; }
        .seisen-popup .maplibregl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
        .seisen-popup .maplibregl-popup-tip     { display: none !important; }
      `}</style>
    </div>
  );
}
