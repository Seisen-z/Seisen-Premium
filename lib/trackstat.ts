export type Counts = { items: number; huge: number; titanic: number; gargantuan: number };
export type TrackstatSnapshot = {
  owned: Counts;
  gained: Counts;
  details: { name: string; kind: string; owned: number; gained: number }[];
  inventory?: InventoryStack[];
};
// One stack as sent by the library: k = catalog key, a = amount, r = gem value each, x = exist count, l = pet level, f = favorite, e = exclusive level, cs = charm slots, ch = charm names
export type InventoryStack = { k: string; a: number; r?: number; x?: number; l?: number; f?: boolean; e?: number; cs?: number; ch?: string[] };
export type CatalogEntry = { class: string; name: string; icon: string | null; image: string | null; rarity: string | null; rarity_num: number | null; rarity_color: string | null; description: string | null };
export type TrackstatHistory = {
  account: { username: string; roblox_id: string };
  sessions: { id: string; started_at: string; updated_at: string; snapshot: TrackstatSnapshot }[];
};
export type TrackstatPublic = { game: string; accounts: number; sessions: number; live: number; gained: Counts };
export type TrackstatMedia = { avatar: string | null; game: string | null };
export type TrackstatResponse = { public: TrackstatPublic; private: TrackstatHistory | null; media: TrackstatMedia; reconnect?: boolean };

export function compactCount(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
