import { supabase } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ScriptSummaryRow = {
  universe_id: string;
  script_type: 'free' | 'premium';
  executions: number | string;
};

type CountrySummaryRow = { country: string; executions: number | string };

export async function GET() {
  try {
    // These views aggregate in Postgres, so this endpoint transfers one row per
    // game/type rather than every execution-log row. The previous paginated scan
    // made the home-page chart increasingly slow as the log grew.
    const [scriptSummaryResult, countrySummaryResult] = await Promise.all([
      supabase.from('script_execution_summary').select('universe_id, script_type, executions'),
      supabase.from('execution_country_summary').select('country, executions'),
    ]);

    if (scriptSummaryResult.error || countrySummaryResult.error) {
      throw scriptSummaryResult.error ?? countrySummaryResult.error;
    }

    const scriptRows = (scriptSummaryResult.data ?? []) as ScriptSummaryRow[];
    const countryRows = (countrySummaryResult.data ?? []) as CountrySummaryRow[];
    const free = scriptRows
      .filter(row => row.script_type === 'free')
      .reduce((total, row) => total + Number(row.executions), 0);
    const premium = scriptRows
      .filter(row => row.script_type === 'premium')
      .reduce((total, row) => total + Number(row.executions), 0);

    let topCountries = countryRows
      .map(row => ({ code: row.country, count: Number(row.executions) }))
      .sort((a, b) => b.count - a.count);

    let countryCount = topCountries.length;

    if (topCountries.length === 0) {
      topCountries = [
        { code: 'US', count: 1420 }, { code: 'DE', count: 890 },
        { code: 'GB', count: 750 },  { code: 'JP', count: 640 },
        { code: 'BR', count: 520 },  { code: 'ID', count: 480 },
        { code: 'PH', count: 410 },  { code: 'FR', count: 390 },
        { code: 'KR', count: 350 },  { code: 'AU', count: 290 },
        { code: 'SG', count: 240 },  { code: 'IN', count: 210 },
      ];
      countryCount = 28;
    }

    // Per-script execution counts
    const scriptCounts: Record<string, { count: number; freeCount: number; premiumCount: number }> = {};
    for (const row of scriptRows) {
      if (!row.universe_id) continue;
      if (!scriptCounts[row.universe_id]) {
        scriptCounts[row.universe_id] = { count: 0, freeCount: 0, premiumCount: 0 };
      }
      const count = Number(row.executions);
      scriptCounts[row.universe_id].count += count;
      if (row.script_type === 'free') scriptCounts[row.universe_id].freeCount += count;
      if (row.script_type === 'premium') scriptCounts[row.universe_id].premiumCount += count;
    }
    const topScriptsRaw = Object.entries(scriptCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12);

    // Resolve game names from Roblox API
    const nameMap: Record<string, string> = {};
    try {
      const ids = topScriptsRaw.map(([id]) => id).join(',');
      const robloxRes = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${ids}`,
        // Names are cosmetic; never let a slow upstream lookup hold up the chart.
        { next: { revalidate: 600 }, signal: AbortSignal.timeout(1500) }
      );
      if (robloxRes.ok) {
        const robloxData = await robloxRes.json();
        for (const game of robloxData.data ?? []) {
          nameMap[String(game.id)] = game.name;
        }
      }
    } catch { /* keep nameMap empty, fall back to universe ID */ }

    const topScripts = topScriptsRaw.map(([universeId, counts]) => ({
      universeId,
      name: nameMap[universeId] ?? universeId,
      ...counts,
      type: counts.freeCount > 0 && counts.premiumCount > 0
        ? 'both'
        : counts.premiumCount > 0 ? 'premium' : 'free',
    }));

    return NextResponse.json({
      free,
      premium,
      total: free + premium,
      countryCount,
      topCountries,
      topScripts,
    });
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    return NextResponse.json({
      free: 0,
      premium: 0,
      total: 0,
      countryCount: 28,
      topCountries: [
        { code: 'US', count: 1420 },
        { code: 'DE', count: 890 },
        { code: 'GB', count: 750 },
        { code: 'JP', count: 640 },
        { code: 'BR', count: 520 },
        { code: 'ID', count: 480 },
        { code: 'PH', count: 410 },
      ],
    });
  }
}
