"use client";

import { useEffect, useState } from "react";

export const WORLD_GEOJSON =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson";

export interface WorldFeatureProperties {
  NAME_LONG: string;
  ISO_A2?: string;
  ADM0_A3?: string;
}

export type WorldData = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  WorldFeatureProperties
>;

export function useWorldData(url: string = WORLD_GEOJSON): WorldData | null {
  const [data, setData] = useState<WorldData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json as WorldData);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url]);

  return data;
}
