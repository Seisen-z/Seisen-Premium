const url = 'https://xsygxfeutjcwmqejslbv.supabase.co';
const publishableKey = 'sb_publishable_565kome-b7OZJPc7-kWSPQ_n_nwH8q5';

async function thumbnail(path: string): Promise<string | null> {
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    const image = (await response.json()).data?.[0];
    return response.ok && image?.state === 'Completed' ? image.imageUrl : null;
  } catch { return null; }
}

export async function trackstatMedia(robloxId?: string) {
  const [avatar, game] = await Promise.all([
    robloxId && /^\d+$/.test(robloxId) ? thumbnail(`users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`) : null,
    thumbnail('games/icons?universeIds=3317771874&size=512x512&format=Png&returnPolicy=PlaceHolder'),
  ]);
  return { avatar, game };
}

export async function trackstatRPC<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(response.status === 400 ? 'Invalid connection key' : 'Trackstat is temporarily unavailable');
  return response.json() as Promise<T>;
}
