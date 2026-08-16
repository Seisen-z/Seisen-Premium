import { NextRequest } from 'next/server';
import { supabase } from '@/lib/server/db';

async function getGamelistUrls(listUrl: string): Promise<Record<string, string>> {
  const res = await fetch(listUrl, { next: { revalidate: 300 } });
  const text = await res.text();
  const urls: Record<string, string> = {};
  const regex = /\["(\d+)"\]\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    urls[m[1]] = m[2];
  }
  return urls;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ universeId: string }> }
) {
  const { universeId } = await params;

  // Fetch gamelist config from Supabase (falls back to default)
  let premiumUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua';
  try {
    const { data: config } = await supabase.from('github_config').select('premium_url').single();
    if (config?.premium_url) premiumUrl = config.premium_url;
  } catch {}

  const urls = await getGamelistUrls(premiumUrl);
  const scriptUrl = urls[universeId];

  if (!scriptUrl) {
    return new Response('-- Script not found for this game.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Fetch script content + log execution in parallel
  const [scriptRes] = await Promise.all([
    fetch(scriptUrl, { cache: 'no-store' }),
    supabase.from('script_execution_log').insert({
      universe_id: universeId,
      script_type: 'premium',
    }).then(({ error }) => {
      if (error) console.warn('Execution log insert error:', error.message);
    }),
  ]);

  if (!scriptRes.ok) {
    return new Response('-- Failed to fetch script.', {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const content = await scriptRes.text();
  return new Response(content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
