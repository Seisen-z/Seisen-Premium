import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TrackstatHistory } from './trackstat.ts';
import { mergeByRoblox } from './trackstat-merge.ts';

const snapshot = { owned: {}, gained: {}, details: [] };
const history = (id: string, roblox: string, extra: Partial<TrackstatHistory> = {}): TrackstatHistory => ({ account: { id, username: `user${roblox}`, roblox_id: roblox }, sessions: [], ...extra });

test('devices of one Roblox account become one entry with every key and id', () => {
  const entries = mergeByRoblox([{ key: 'sp_a', history: history('1', '100') }, { key: 'sp_b', history: history('2', '100') }, { history: history('3', '100') }]);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].keys, ['sp_a', 'sp_b']);
  assert.deepEqual(entries[0].ids, ['1', '2', '3']);
});

test('different Roblox accounts stay separate and keep their order', () => {
  const entries = mergeByRoblox([{ key: 'sp_a', history: history('1', '100') }, { key: 'sp_b', history: history('2', '200') }]);
  assert.deepEqual(entries.map(e => e.history.account.roblox_id), ['100', '200']);
});

test('sessions are combined newest first', () => {
  const session = (id: string, updated_at: string) => ({ id, game_id: '3317771874', started_at: updated_at, updated_at, snapshot });
  const [entry] = mergeByRoblox([
    { key: 'sp_a', history: history('1', '100', { sessions: [session('old', '2026-10-10T00:00:00Z')] }) },
    { key: 'sp_b', history: history('2', '100', { sessions: [session('new', '2026-10-15T00:00:00Z')] }) },
  ]);
  assert.deepEqual(entry.history.sessions.map(s => s.id), ['new', 'old']);
});

test('daily gains add up per day and game, and other days are kept', () => {
  const [entry] = mergeByRoblox([
    { key: 'sp_a', history: history('1', '100', { daily: [{ day: '2026-10-15', game_id: '1', gained: { items: 5, huge: 1 } }] }) },
    { key: 'sp_b', history: history('2', '100', { daily: [{ day: '2026-10-15', game_id: '1', gained: { items: 7, titanic: 2 } }, { day: '2026-10-14', game_id: '1', gained: { items: 3 } }] }) },
  ]);
  const byDay = Object.fromEntries((entry.history.daily ?? []).map(d => [d.day, d.gained]));
  assert.deepEqual(byDay['2026-10-15'], { items: 12, huge: 1, titanic: 2 });
  assert.deepEqual(byDay['2026-10-14'], { items: 3 });
});

test('an account is live when any device is, without duplicates', () => {
  const [entry] = mergeByRoblox([{ key: 'sp_a', history: history('1', '100', { activeGames: ['1'] }) }, { key: 'sp_b', history: history('2', '100', { activeGames: ['1', '2'] }) }]);
  assert.deepEqual(entry.history.activeGames?.sort(), ['1', '2']);
});

test('the loaded histories are not changed by merging', () => {
  const first = history('1', '100', { daily: [{ day: '2026-10-15', game_id: '1', gained: { items: 5 } }] });
  const second = history('2', '100', { daily: [{ day: '2026-10-15', game_id: '1', gained: { items: 7 } }] });
  mergeByRoblox([{ key: 'sp_a', history: first }, { key: 'sp_b', history: second }]);
  assert.deepEqual(first.daily, [{ day: '2026-10-15', game_id: '1', gained: { items: 5 } }]);
  assert.deepEqual(second.daily, [{ day: '2026-10-15', game_id: '1', gained: { items: 7 } }]);
});
