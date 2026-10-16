import { TRACKSTAT_URL as url, TRACKSTAT_PUBLIC_KEY as publishableKey } from '@/lib/trackstat-config';

async function thumbnail(path: string): Promise<string | null> {
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    const image = (await response.json()).data?.[0];
    return response.ok && image?.state === 'Completed' ? image.imageUrl : null;
  } catch { return null; }
}

export async function trackstatMedia(robloxIds: string[]) {
  const icon = (universe: string) => thumbnail(`games/icons?universeIds=${universe}&size=512x512&format=Png&returnPolicy=PlaceHolder`);
  const [avatarList, game, stealAnEgg] = await Promise.all([
    Promise.all(robloxIds.map(async id => [id, /^\d+$/.test(id) ? await thumbnail(`users/avatar-headshot?userIds=${id}&size=150x150&format=Png`) : null] as const)),
    icon('3317771874'),
    icon('10563114921'),
  ]);
  return { avatars: Object.fromEntries(avatarList), game, stealAnEgg };
}

export async function trackstatRPC<T>(name: string, args: Record<string, unknown> = {}, token?: string): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(response.status === 400 ? 'Invalid connection key' : 'Trackstat is temporarily unavailable');
  return response.json() as Promise<T>;
}

// Public Roblox images are copied once; private images are captured by the library.
export async function trackstatCacheImage(folder: 'stealanegg' | 'petsimulator99', icon: string, image: string): Promise<boolean> {
  if (!/^\d{1,20}$/.test(icon) || !/^https:\/\/[a-z0-9-]+\.rbxcdn\.com\//i.test(image)) return false;
  try {
    const response = await fetch(image, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/png')) return false;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 1024 * 1024 || bytes.byteLength < 8 || new Uint8Array(bytes).slice(0, 8).join(',') !== '137,80,78,71,13,10,26,10') return false;
    const stored = await fetch(`${url}/storage/v1/object/trackstats-images/${folder}/${icon}.png`, {
      method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'image/png' }, body: bytes, signal: AbortSignal.timeout(8000),
    });
    return stored.ok || stored.status === 409;
  } catch { return false; }
}
