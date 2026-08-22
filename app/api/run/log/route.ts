import { NextRequest } from 'next/server';
import { supabase } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  const universeId = req.nextUrl.searchParams.get('universeId');
  const type       = req.nextUrl.searchParams.get('type'); // 'free' or 'premium'
  const country    = req.headers.get('x-vercel-ip-country') ?? 'unknown';

  console.log('[run/log] params:', { universeId, type, country });

  if (universeId && (type === 'free' || type === 'premium')) {
    const { error } = await supabase.from('script_execution_log').insert({
      universe_id: universeId,
      script_type: type,
      country,
    });
    if (error) console.error('[run/log] insert error:', error.message);
    else console.log('[run/log] inserted ok');
  } else {
    console.warn('[run/log] skipped insert — missing or invalid params');
  }

  return new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
