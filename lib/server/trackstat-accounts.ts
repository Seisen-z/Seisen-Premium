import type { NextRequest } from 'next/server';
import type { TrackstatHistory } from '@/lib/trackstat';
import { trackstatRPC } from './trackstat';
export const keyPattern = /^sp_[a-f0-9]{64}$/;
export const cookieName = 'seisen_trackstat';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/trackstat', maxAge: 60 * 60 * 24 * 30 };
export const readKeys = (req: NextRequest) => [...new Set((req.cookies.get(cookieName)?.value ?? '').split(',').filter(key => keyPattern.test(key)))].slice(0, 10);
export const bearer = (req: NextRequest) => req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{20,8192})$/)?.[1];
// One entry per Roblox account: keys/ids cover every device connected to it
export type TrackstatEntry = { keys: string[]; ids: string[]; history: TrackstatHistory };
export async function trackstatEntries(req: NextRequest) {
  const keys = readKeys(req);
  const results = await Promise.allSettled(keys.map(key => trackstatRPC<TrackstatHistory>('trackstat_private', { p_key: key })));
  const found: { key?: string; history: TrackstatHistory }[] = [];
  let dropped = false;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') found.push({ key: keys[i], history: result.value });
    else if (result.reason instanceof Error && result.reason.message === 'Invalid connection key') dropped = true;
    else throw result.reason;
  });
  const token = bearer(req);
  if (token) {
    const saved = await trackstatRPC<TrackstatHistory[]>('trackstat_user_accounts_read', {}, token);
    for (const history of saved) if (!found.some(e => e.history.account.id === history.account.id)) found.push({ history });
  }
  // Devices of the same Roblox account share one entry: sessions and daily gains are combined
  const entries: TrackstatEntry[] = [];
  for (const { key, history } of found) {
    const entry = entries.find(e => e.history.account.roblox_id === history.account.roblox_id);
    if (!entry) { entries.push({ keys: key ? [key] : [], ids: history.account.id ? [history.account.id] : [], history: { ...history, daily: [...history.daily ?? []], activeGames: history.activeGames ?? [] } }); continue; }
    if (key) entry.keys.push(key);
    if (history.account.id) entry.ids.push(history.account.id);
    const merged = entry.history;
    merged.sessions = [...merged.sessions, ...history.sessions].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    merged.activeGames = [...new Set([...merged.activeGames ?? [], ...history.activeGames ?? []])];
    for (const day of history.daily ?? []) {
      const same = merged.daily?.find(d => d.day === day.day && d.game_id === day.game_id);
      if (!same) merged.daily?.push(day);
      else same.gained = Object.fromEntries([...new Set([...Object.keys(same.gained), ...Object.keys(day.gained)])].map(k => [k, (same.gained[k] ?? 0) + (day.gained[k] ?? 0)]));
    }
  }
  return { entries, dropped, token };
}
