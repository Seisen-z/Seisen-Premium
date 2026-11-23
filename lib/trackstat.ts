export type Counts = Record<string, number>;
export type TrackstatSnapshot = {
  owned: Counts;
  gained: Counts;
  details: { name: string; kind: string; owned: number; gained: number; t?: number }[];
  inventory?: InventoryStack[];
  // Reads leave the inventory out; the newest session says whether it has one and what it is worth
  inventory_value?: number | null;
  has_inventory?: boolean;
  // Game-specific balance and progression stats
  money?: number;
  fragments?: number;
  level?: number;
  bounty?: number;
  coins?: number;
  gems?: number;
  candy_corn?: number;
  rolls?: number;
  rebirths?: number;
  per_second?: number;
};
// One stack as sent by the library.
// Pet Simulator 99: k = catalog key, a = amount, r = gem value each, x = exist count, l = pet level, f = favorite, e = exclusive level, cs = charm slots, ch = charm names
export type InventoryStack = { k: string; a: number; r?: number; x?: number; l?: number; f?: boolean; e?: number; cs?: number; ch?: string[]; w?: number; m?: string[]; p?: number; pl?: number; c?: number; gr?: string; tr?: string; lk?: boolean; bf?: [string, string][]; d?: number; sl?: string; lm?: number; bd?: Record<string, unknown> };
export type CatalogEntry = { class?: string; kind?: string; name: string; icon: string | null; image: string | null; stored?: string | null; pending?: boolean; rarity: string | null; rarity_num: number | null; rarity_color: string | null; description: string | null };
export type TrackstatSession = { history_expired?: boolean; id: string; game_id: string; started_at: string; updated_at: string; snapshot: TrackstatSnapshot };
export type TrackstatDailyGains = { day: string; game_id: string; gained: Counts; details?: TrackstatSnapshot['details'] };
export type TrackstatHistory = {
  connectionStatus?: 'reset';
  daily?: TrackstatDailyGains[];
  activeGames?: string[];
  account: { id?: string; username: string; roblox_id: string };
  sessions: TrackstatSession[];
};
export type TrackstatPublic = { game: string; accounts: number; sessions: number; live: number; gained: Counts };
export type TrackstatMedia = { avatars: Record<string, string | null>; game: string | null; bloxFruits?: string | null };
// A new device asking to join an account's history
export type TrackstatAccount = TrackstatHistory & { index: number; activeGames: string[] };
export type TrackstatResponse = { public: TrackstatPublic | null; publicBloxFruits?: TrackstatPublic | null; accounts: TrackstatAccount[]; media: TrackstatMedia; reconnect?: boolean; degraded?: boolean };

export const PET_SIMULATOR_99 = '3317771874';
export const BLOX_FRUITS = '994732206';

const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
// Compact large balances and counts.
let fullNumbers = false;
// Settings can show 1,500 instead of 1.5K
export const setNumberFormat = (full: boolean) => { fullNumbers = full; };
export function compactCount(value: number) {
  if (fullNumbers) return Math.round(value).toLocaleString('en-US');
  const sign = value < 0 ? '-' : '';
  let n = Math.abs(value);
  let i = 0;
  while (n >= 1000 && i < suffixes.length - 1) { n /= 1000; i++; }
  return `${sign}${Math.round(n * 10) / 10}${suffixes[i]}`;
}
