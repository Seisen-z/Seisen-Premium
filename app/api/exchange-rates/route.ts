import { NextResponse } from 'next/server';

// --- Fallback rates (Aug 2026) ------------------------------------------------
// Used if the free API is down. Base currency: EUR.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.156, GBP: 0.85,  AUD: 1.63,  CAD: 1.61,  SGD: 1.52,
  PHP: 70.66, IDR: 18350, VND: 29400, HKD: 9.01,  JPY: 158,
  CNY: 8.32,  CHF: 0.94,  CZK: 27.05, DKK: 7.46,  HUF: 421.5,
  ILS: 4.35,  NOK: 12.68, NZD: 1.78,  PLN: 4.62,  SEK: 12.15,
  UGX: 4350,  ZAR: 21.55, AED: 4.25,
};

// --- In-memory cache (server-side, resets on cold start) ---------------------
let cache: { rates: Record<string, number>; updatedAt: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        rates: cache.rates,
        updatedAt: cache.updatedAt,
        source: 'cache',
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      });
    }

    // Fetch from free, no-key-required API
    const res = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);

    const data = await res.json();
    if (data.result !== 'success') throw new Error('Exchange rate API returned error result');

    cache = {
      rates: data.rates,
      updatedAt: data.time_last_update_utc ?? new Date().toUTCString(),
      fetchedAt: Date.now(),
    };

    return NextResponse.json({
      rates: cache.rates,
      updatedAt: cache.updatedAt,
      source: 'live',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    console.error('[exchange-rates] Failed to fetch live rates, using fallback:', err);
    return NextResponse.json({
      rates: FALLBACK_RATES,
      updatedAt: 'Fallback rates (offline)',
      source: 'fallback',
    }, { status: 200 });
  }
}
