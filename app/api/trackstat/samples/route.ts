import { NextRequest, NextResponse } from 'next/server';
import { trackstatEntries } from '@/lib/server/trackstat-accounts';
import { trackstatRPC } from '@/lib/server/trackstat';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit';
import type { TrackstatSample } from '@/lib/trackstat';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
type Row = { account: string; rows: TrackstatSample[] };

// Trend samples per account, in the same order as /api/trackstat (devices of one Roblox account are combined)
export async function GET(req: NextRequest) {
  const limit = rateLimit(`trackstat:samples:${getClientIp(req)}`, 30, 60000);
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    const { entries, token } = await trackstatEntries(req);
    const byAccount = new Map<string, TrackstatSample[]>();
    await Promise.all(entries.flatMap(entry => entry.keys).map(async key => {
      const found = await trackstatRPC<Row>('trackstat_samples', { p_key: key }).catch(() => null);
      if (found) byAccount.set(found.account, found.rows);
    }));
    if (token) for (const found of await trackstatRPC<Row[]>('trackstat_user_samples', {}, token).catch(() => [])) if (!byAccount.has(found.account)) byAccount.set(found.account, found.rows);
    return NextResponse.json({ samples: entries.map(entry => entry.ids.flatMap(id => byAccount.get(id) ?? [])) }, { headers });
  } catch {
    return NextResponse.json({ error: 'Trackstat is temporarily unavailable.' }, { status: 503, headers });
  }
}
