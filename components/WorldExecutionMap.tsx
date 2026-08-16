'use client';

import {
  Map,
  MapGeoJSON,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import { WORLD_GEOJSON } from '@/lib/use-world-data';

const COUNTRY_COORDS: Record<string, { name: string; coords: [number, number] }> = {
  US: { name: 'United States', coords: [-95.7129, 37.0902] },
  CA: { name: 'Canada', coords: [-106.3468, 56.1304] },
  MX: { name: 'Mexico', coords: [-102.5528, 23.6345] },
  BR: { name: 'Brazil', coords: [-51.9253, -14.235] },
  AR: { name: 'Argentina', coords: [-63.6167, -38.4161] },
  CL: { name: 'Chile', coords: [-71.543, -35.6751] },
  CO: { name: 'Colombia', coords: [-74.2973, 4.5709] },
  GB: { name: 'United Kingdom', coords: [-3.436, 55.3781] },
  FR: { name: 'France', coords: [2.2137, 46.2276] },
  DE: { name: 'Germany', coords: [10.4515, 51.1657] },
  ES: { name: 'Spain', coords: [-3.7492, 40.4637] },
  IT: { name: 'Italy', coords: [12.5674, 41.8719] },
  NL: { name: 'Netherlands', coords: [5.2913, 52.1326] },
  PL: { name: 'Poland', coords: [19.1451, 51.9194] },
  SE: { name: 'Sweden', coords: [18.6435, 60.1282] },
  RU: { name: 'Russia', coords: [105.3188, 61.524] },
  TR: { name: 'Turkey', coords: [35.2433, 38.9637] },
  UA: { name: 'Ukraine', coords: [31.1656, 48.3794] },
  SA: { name: 'Saudi Arabia', coords: [45.0792, 23.8859] },
  AE: { name: 'United Arab Emirates', coords: [53.8478, 23.4241] },
  EG: { name: 'Egypt', coords: [30.8025, 26.8206] },
  NG: { name: 'Nigeria', coords: [8.6753, 9.082] },
  ZA: { name: 'South Africa', coords: [22.9375, -30.5595] },
  IN: { name: 'India', coords: [78.9629, 20.5937] },
  PK: { name: 'Pakistan', coords: [69.3451, 30.3753] },
  BD: { name: 'Bangladesh', coords: [90.3563, 23.685] },
  CN: { name: 'China', coords: [104.1954, 35.8617] },
  JP: { name: 'Japan', coords: [138.2529, 36.2048] },
  KR: { name: 'South Korea', coords: [127.7669, 35.9078] },
  TH: { name: 'Thailand', coords: [100.5018, 13.7563] },
  VN: { name: 'Vietnam', coords: [108.2772, 14.0583] },
  MY: { name: 'Malaysia', coords: [101.9758, 4.2105] },
  ID: { name: 'Indonesia', coords: [113.9213, -0.7893] },
  PH: { name: 'Philippines', coords: [121.774, 12.8797] },
  SG: { name: 'Singapore', coords: [103.8198, 1.3521] },
  AU: { name: 'Australia', coords: [133.7751, -25.2744] },
  NZ: { name: 'New Zealand', coords: [174.886, -40.9006] },
};

function formatCount(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

interface Props {
  topCountries: { code: string; count: number }[];
  className?: string;
  mini?: boolean;
}

export default function WorldExecutionMap({
  topCountries,
  className = '',
  mini = false,
}: Props) {
  const list = topCountries.length > 0 ? topCountries : [
    { code: 'US', count: 1420 },
    { code: 'DE', count: 890 },
    { code: 'GB', count: 750 },
    { code: 'JP', count: 640 },
    { code: 'BR', count: 520 },
    { code: 'ID', count: 480 },
    { code: 'PH', count: 410 },
    { code: 'FR', count: 390 },
    { code: 'KR', count: 350 },
    { code: 'AU', count: 290 },
    { code: 'SG', count: 240 },
    { code: 'IN', count: 210 },
  ];

  const heightStyle = className.includes('h-full') ? { height: '100%' } : { height: mini ? '250px' : '420px' };

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={heightStyle}>
      <Map
        blank
        center={[15, 20]}
        zoom={mini ? 0.9 : 1.6}
        fadeDuration={0}
        dragPan={true}
        scrollZoom={true}
      >
        {/* World vector basemap */}
        <MapGeoJSON
          data={WORLD_GEOJSON}
          fillPaint={{ 'fill-color': 'rgba(255, 255, 255, 0.04)' }}
          linePaint={{ 'line-color': 'rgba(201, 169, 122, 0.3)', 'line-width': 0.6 }}
        />

        {/* Interactive Map Markers */}
        {list.map((item) => {
          const info = COUNTRY_COORDS[item.code];
          if (!info) return null;

          const displayStr = formatCount(item.count);

          return (
            <MapMarker
              key={item.code}
              longitude={info.coords[0]}
              latitude={info.coords[1]}
            >
              <MarkerContent>
                <div className="group relative flex items-center justify-center h-7 w-7 rounded-full bg-[#c9a97a] border-2 border-white/90 shadow-[0_0_14px_rgba(201,169,122,0.6)] transition-transform duration-200 hover:scale-125 cursor-pointer">
                  <span className="text-[10px] font-bold text-black select-none tracking-tight">
                    {displayStr}
                  </span>
                </div>
              </MarkerContent>

              <MarkerTooltip>
                <div className="font-semibold text-xs text-white">
                  {info.name}
                </div>
              </MarkerTooltip>

              <MarkerPopup closeButton>
                <div className="p-1 space-y-1 font-sans text-left">
                  <p className="font-semibold text-sm text-white">{info.name}</p>
                  <p className="text-xs font-medium" style={{ color: '#c9a97a' }}>
                    {item.count.toLocaleString()} execution{item.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}

        <MapControls />
      </Map>
    </div>
  );
}
