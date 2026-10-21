import type { TrackstatHistory } from './trackstat';

// One entry per Roblox account: keys/ids cover every device connected to it
export type TrackstatEntry = { keys: string[]; ids: string[]; history: TrackstatHistory };

// Devices of the same Roblox account share one entry: sessions and daily gains are combined
export function mergeByRoblox(found: { key?: string; history: TrackstatHistory }[]): TrackstatEntry[] {
  const entries: TrackstatEntry[] = [];
  for (const { key, history } of found) {
    const entry = entries.find(e => e.history.account.roblox_id === history.account.roblox_id);
    if (!entry) { entries.push({ keys: key ? [key] : [], ids: history.account.id ? [history.account.id] : [], history: { ...history, sessions: [...history.sessions], daily: (history.daily ?? []).map(day => ({ ...day, gained: { ...day.gained }, details: day.details?.map(detail => ({ ...detail })) })), activeGames: history.activeGames ?? [] } }); continue; }
    if (key) entry.keys.push(key);
    if (history.account.id) entry.ids.push(history.account.id);
    const merged = entry.history;
    // A valid device connection takes precedence over an old reset marker.
    if (merged.connectionStatus === 'reset' && history.connectionStatus !== 'reset') { merged.account = history.account; merged.connectionStatus = undefined; }
    merged.sessions = [...merged.sessions, ...history.sessions].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    merged.activeGames = [...new Set([...merged.activeGames ?? [], ...history.activeGames ?? []])];
    for (const day of history.daily ?? []) {
      const same = merged.daily?.find(d => d.day === day.day && d.game_id === day.game_id);
      if (!same) merged.daily?.push({ ...day, gained: { ...day.gained }, details: day.details?.map(detail => ({ ...detail })) });
      else {
        same.gained = Object.fromEntries([...new Set([...Object.keys(same.gained), ...Object.keys(day.gained)])].map(k => [k, (same.gained[k] ?? 0) + (day.gained[k] ?? 0)]));
        same.details ??= [];
        for (const detail of day.details ?? []) {
          const prior = same.details.find(row => row.kind === detail.kind && row.name === detail.name);
          if (!prior) same.details.push({ ...detail });
          else { prior.gained += detail.gained; prior.owned = Math.max(prior.owned, detail.owned); prior.t = Math.max(prior.t ?? 0, detail.t ?? 0); }
        }
      }
    }
  }
  return entries;
}
