import { NextRequest } from 'next/server';
import { supabase } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  const universeId = req.nextUrl.searchParams.get('universeId');
  const type       = req.nextUrl.searchParams.get('type'); // 'free' or 'premium'

  if (universeId && (type === 'free' || type === 'premium')) {
    await supabase.from('script_execution_log').insert({
      universe_id: universeId,
      script_type: type,
    });
  }

  return new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
