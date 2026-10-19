import { NextRequest, NextResponse } from 'next/server';
import { adminRPC, isAdminRequest } from '@/lib/server/trackstat-admin';
import { serverStats } from '@/lib/server/trackstat-inventory';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

// Everything the Trackstat admin page shows, in one answer
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    const [overview, games, accounts, activity, server] = await Promise.all([
      adminRPC('trackstat_admin_overview'),
      adminRPC('trackstat_admin_games'),
      adminRPC('trackstat_admin_accounts', { p_limit: 2000 }),
      adminRPC('trackstat_admin_activity', { p_limit: 150 }),
      serverStats(),
    ]);
    return NextResponse.json({ overview, games, accounts, activity, server }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500, headers });
  }
}
