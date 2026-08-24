import { fetchScripts } from '@/lib/scripts';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scripts = await fetchScripts();

    const scriptCount  = scripts.length;
    const freeCount    = scripts.filter(s => s.type === 'Free'    || s.displayType === 'Free & Premium').length;
    const premiumCount = scripts.filter(s => s.type === 'Premium' || s.displayType === 'Free & Premium').length;
    const workingCount = scripts.filter(s => s.status === 'Working').length;

    return NextResponse.json({ scriptCount, freeCount, premiumCount, workingCount });
  } catch (error) {
    console.error('Error fetching script stats:', error);
    return NextResponse.json({ scriptCount: 0, freeCount: 0, premiumCount: 0, workingCount: 0 });
  }
}
