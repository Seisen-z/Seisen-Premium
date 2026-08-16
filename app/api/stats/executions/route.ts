import { supabase } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [freeResult, premiumResult] = await Promise.all([
      supabase
        .from('script_execution_log')
        .select('*', { count: 'exact', head: true })
        .eq('script_type', 'free'),
      supabase
        .from('script_execution_log')
        .select('*', { count: 'exact', head: true })
        .eq('script_type', 'premium'),
    ]);

    const free = freeResult.count ?? 0;
    const premium = premiumResult.count ?? 0;

    return NextResponse.json({
      free,
      premium,
      total: free + premium,
    });
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    return NextResponse.json({ free: 0, premium: 0, total: 0 });
  }
}
