'use client';
import { trackstatAuth } from './trackstat-auth';

// Private views and public PNGs use separate databases so sign-out only clears private data.
const opened = new Map<string, Promise<IDBDatabase>>();
const open = (name: string) => {
  const existing = opened.get(name);
  if (existing) return existing;
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('kv'); };
    request.onblocked = () => reject(new Error('Cache open blocked by another tab.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); opened.delete(name); };
      opened.set(name, Promise.resolve(db));
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
  opened.set(name, pending);
  return pending;
};
async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>, name = 'trackstat-cache'): Promise<T | undefined> {
  try {
    const db = await open(name);
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('kv', mode);
      const request = work(transaction.objectStore('kv'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error);
    });
  } catch { return undefined; }
}
export const cacheGet = <T>(key: string) => run<T>('readonly', store => store.get(key));
export const cacheSet = (key: string, value: unknown) => run('readwrite', store => store.put(value, key));
export const imageGet = (url: string) => run<Blob>('readonly', store => store.get(url), 'trackstat-pngs');
export const imageSet = (url: string, blob: Blob) => run('readwrite', store => store.put(blob, url), 'trackstat-pngs');
export const cacheClear = () => run('readwrite', store => store.clear());
// Saved data belongs to whoever is signed in
export async function cacheNamespace() {
  const { data } = await trackstatAuth.auth.getSession();
  return data.session?.user.id ?? 'anon';
}
