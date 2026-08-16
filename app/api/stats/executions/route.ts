import { supabase } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [freeResult, premiumResult, countryResult] = await Promise.all([
      supabase
        .from('script_execution_log')
        .select('*', { count: 'exact', head: true })
        .eq('script_type', 'free'),
      supabase
        .from('script_execution_log')
        .select('*', { count: 'exact', head: true })
        .eq('script_type', 'premium'),
      supabase
        .from('script_execution_log')
        .select('country')
        .neq('country', 'unknown')
        .not('country', 'is', null),
    ]);

    const free    = freeResult.count ?? 0;
    const premium = premiumResult.count ?? 0;

    // Tally country counts in JS
    const countryCounts: Record<string, number> = {};
    for (const row of countryResult.data ?? []) {
      if (row.country) {
        countryCounts[row.country] = (countryCounts[row.country] ?? 0) + 1;
      }
    }

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code, count]) => ({ code, count }));

    return NextResponse.json({
      free,
      premium,
      total: free + premium,
      topCountries,
    });
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    return NextResponse.json({ free: 0, premium: 0, total: 0, topCountries: [] });
  }
}
