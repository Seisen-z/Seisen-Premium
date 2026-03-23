import { NextResponse } from 'next/server';
import { fetchScripts } from '@/lib/scripts';

export async function GET() {
  try {
    const scripts = await fetchScripts();
    return NextResponse.json(scripts);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}
