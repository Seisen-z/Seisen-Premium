import { TRACKSTAT_URL as url } from '@/lib/trackstat-config';
import { verifyAdminSession } from '@/lib/server/adminSession';

// Same admin login as /admin: the token it hands out is sent as a Bearer header
export const isAdminRequest = (req: Request) => verifyAdminSession((req.headers.get('Authorization') ?? '').replace('Bearer ', ''));

// The admin functions only answer to the server-side service key, never to the public key
export async function adminRPC<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const key = process.env.TRACKSTAT_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error('TRACKSTAT_SUPABASE_SERVICE_ROLE_KEY is not configured');
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(20000), body: JSON.stringify(args),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`${name} failed (${response.status})`);
  return response.json() as Promise<T>;
}
