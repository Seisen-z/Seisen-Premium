export type Counts = Record<string, number>;
export type TrackstatSnapshot = {
  owned: Counts;
  gained: Counts;
  details: { name: string; kind: string; owned: number; gained: number }[];
  inventory?: InventoryStack[];
  // Steal An Egg only
  money?: number;
  speed?: number;
  per_second?: number;
};
// One stack as sent by the library.
// Pet Simulator 99: k = catalog key, a = amount, r = gem value each, x = exist count, l = pet level, f = favorite, e = exclusive level, cs = charm slots, ch = charm names
// Steal An Egg: k = catalog key, a = amount, w = weight in kg, m = mutations, p = money per second, f = favorite, pl = egg is placed
export type InventoryStack = { k: string; a: number; r?: number; x?: number; l?: number; f?: boolean; e?: number; cs?: number; ch?: string[]; w?: number; m?: string[]; p?: number; pl?: number };
export type CatalogEntry = { class?: string; kind?: string; name: string; icon: string | null; image: string | null; rarity: string | null; rarity_num: number | null; rarity_color: string | null; description: string | null };
export type TrackstatSession = { id: string; game_id: string; started_at: string; updated_at: string; snapshot: TrackstatSnapshot };
export type TrackstatHistory = {
  account: { username: string; roblox_id: string };
  sessions: TrackstatSession[];
};
export type TrackstatPublic = { game: string; accounts: number; sessions: number; live: number; gained: Counts };
export type TrackstatMedia = { avatars: Record<string, string | null>; game: string | null; stealAnEgg: string | null };
export type TrackstatAccount = TrackstatHistory & { index: number };
export type TrackstatResponse = { public: TrackstatPublic; publicStealAnEgg: TrackstatPublic | null; accounts: TrackstatAccount[]; media: TrackstatMedia; reconnect?: boolean };

export const PET_SIMULATOR_99 = '3317771874';
export const STEAL_AN_EGG = '10563114921';

const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
// 1.5K, 2.4M ... up to quintillions (Steal An Egg money is in the quadrillions)
export function compactCount(value: number) {
  const sign = value < 0 ? '-' : '';
  let n = Math.abs(value);
  let i = 0;
  while (n >= 1000 && i < suffixes.length - 1) { n /= 1000; i++; }
  return `${sign}${Math.round(n * 10) / 10}${suffixes[i]}`;
}
