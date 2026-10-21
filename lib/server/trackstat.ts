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
  const [avatarList, game, stealAnEgg, animeDice] = await Promise.all([
    Promise.all(robloxIds.map(async id => [id, /^\d+$/.test(id) ? await thumbnail(`users/avatar-headshot?userIds=${id}&size=150x150&format=Png`) : null] as const)),
    icon('3317771874'),
    icon('10563114921'),
    icon('10708913337'),
  ]);
  return { avatars: Object.fromEntries(avatarList), game, stealAnEgg, animeDice };
}

export async function trackstatRPC<T>(name: string, args: Record<string, unknown> = {}, token?: string): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(response.status === 400 ? 'Invalid connection key' : `Trackstat ${name} failed (${response.status})`);
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}

// Like trackstatRPC, but hands back the database's own answer (including its error message) instead of throwing
export async function trackstatCall(name: string, args: Record<string, unknown>, token?: string) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000), body: JSON.stringify(args),
    headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return { ok: response.ok, body: await response.json().catch(() => null) };
}
