import type { NextRequest } from 'next/server';
import type { TrackstatHistory } from '@/lib/trackstat';
import { mergeByRoblox } from '@/lib/trackstat-merge';
import { trackstatRPC } from './trackstat';
export const maxKeys = 30;
export const keyPattern = /^sp_[a-f0-9]{64}$/;
export const cookieName = 'seisen_trackstat';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/trackstat', maxAge: 60 * 60 * 24 * 30 };
export const readKeys = (req: NextRequest) => [...new Set((req.cookies.get(cookieName)?.value ?? '').split(',').filter(key => keyPattern.test(key)))].slice(0, maxKeys);
export const bearer = (req: NextRequest) => req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{20,8192})$/)?.[1];
export type { TrackstatEntry } from '@/lib/trackstat-merge';
export async function trackstatEntries(req: NextRequest) {
  const keys = readKeys(req);
  const token = bearer(req);
  // Both lookups run together; the email-linked read leaves out accounts these keys already load, so nothing is fetched twice
  const [results, saved] = await Promise.all([
    Promise.allSettled(keys.map(key => trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key, p_slim: true }))),
    token ? trackstatRPC<TrackstatHistory[]>('trackstat_user_accounts_read', { p_skip_keys: keys, p_slim: true }, token).catch(error => { console.error('trackstat saved accounts failed:', error instanceof Error ? error.message : error); return null; }) : Promise.resolve<TrackstatHistory[]>([]),
  ]);
  const found: { key?: string; history: TrackstatHistory }[] = [];
  let dropped = false;
  // Keys that failed for a temporary reason stay in the cookie; only invalid keys are dropped
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') found.push({ key: keys[i], history: result.value });
    else if (result.reason instanceof Error && result.reason.message === 'Invalid connection key') dropped = true;
    else { failed.push(keys[i]); console.error('trackstat key lookup failed:', result.reason instanceof Error ? result.reason.message : result.reason); }
  });
  for (const history of saved ?? []) if (!found.some(e => e.history.account.id === history.account.id)) found.push({ history });
  const savedFailed = saved === null;
  const entries = mergeByRoblox(found);
  return { entries, dropped, token, failed, degraded: failed.length > 0 || savedFailed };
}
