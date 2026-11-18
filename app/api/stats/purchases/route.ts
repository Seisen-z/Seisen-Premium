import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const realCount = await db.getPurchaseCount();
    const totalCount = realCount + 1041; // legacy/offset
    
    return NextResponse.json({ 
      count: totalCount,
      real: realCount,
      formatted: totalCount.toLocaleString() + ' people' 
    });
  } catch (error) {
    console.error('Error getting purchase stats:', error);
    // Fallback to static if DB fails
    return NextResponse.json({ count: 15420, formatted: '15,420+' });
  }
}
