import type { TrackstatDailyGains, TrackstatSession } from './trackstat';

// Owned items always come from the newest snapshot; gains belong to one UTC day.
export function dailySnapshot(sessions: TrackstatSession[], daily: TrackstatDailyGains[], day: string) {
  const latest = sessions[0]?.snapshot;
  if (!latest) return undefined;
  const rows = daily.filter(row => row.day === day);
  const gained = Object.fromEntries(Object.keys(latest.gained).map(key => [key, rows.reduce((n, row) => n + (row.gained[key] ?? 0), 0)]));
  return { ...latest, gained, details: rows.flatMap(row => row.details ?? []) };
}

export function dailyDuration(sessions: TrackstatSession[], day: string) {
  const start = Date.parse(`${day}T00:00:00Z`), end = start + 86400e3;
  const minutes = Math.round(sessions.reduce((n, s) => n + Math.max(0, Math.min(end, Date.parse(s.updated_at)) - Math.max(start, Date.parse(s.started_at))), 0) / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}
