'use client';
import { trackstatAuth } from './trackstat-auth';

// What this browser already knows, so a revisit shows it at once and only asks the server whether anything is newer.
// Saved per signed-in user (or nobody) and emptied on sign out. If storage is blocked everything quietly falls back to asking the server.
let opened: Promise<IDBDatabase> | undefined;
const open = () => opened ??= new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('trackstat-cache', 1);
  request.onupgradeneeded = () => { request.result.createObjectStore('kv'); };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const request = work(db.transaction('kv', mode).objectStore('kv'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch { return undefined; }
}
export const cacheGet = <T>(key: string) => run<T>('readonly', store => store.get(key));
export const cacheSet = (key: string, value: unknown) => run('readwrite', store => store.put(value, key));
export const cacheClear = () => run('readwrite', store => store.clear());
// Saved data belongs to whoever is signed in
export async function cacheNamespace() {
  const { data } = await trackstatAuth.auth.getSession();
  return data.session?.user.id ?? 'anon';
}
