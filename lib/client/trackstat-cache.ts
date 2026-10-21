'use client';
import { trackstatAuth } from './trackstat-auth';

// Private views and public PNGs use separate databases so sign-out only clears private data.
const opened = new Map<string, Promise<IDBDatabase>>();
const IMAGE_BYTES = 64 * 1024 * 1024;
const IMAGE_ENTRIES = 2000;
const open = (name: string) => {
  const existing = opened.get(name);
  if (existing) return existing;
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, name === 'trackstat-pngs' ? 2 : 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (name !== 'trackstat-pngs') return;
      const lru = db.createObjectStore('lru');
      const entries: { url: string; size: number }[] = [];
      const cursor = request.transaction!.objectStore('kv').openCursor();
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (row) {
          if (typeof row.key === 'string' && row.value instanceof Blob) {
            entries.push({ url: row.key, size: row.value.size });
            lru.put({ url: row.key, size: row.value.size, touched: 0 }, row.key);
          }
          row.continue();
        } else {
          let bytes = entries.reduce((n, entry) => n + entry.size, 0), count = entries.length;
          for (const entry of entries) {
            if (bytes <= IMAGE_BYTES && count <= IMAGE_ENTRIES) break;
            request.transaction!.objectStore('kv').delete(entry.url); lru.delete(entry.url);
            bytes -= entry.size; count--;
          }
        }
      };
    };
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
async function imageEntry(url: string, blob?: Blob): Promise<Blob | undefined> {
  if (blob && blob.size > IMAGE_BYTES) return undefined;
  try {
    const db = await open('trackstat-pngs');
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(['kv', 'lru'], 'readwrite');
      const kv = tx.objectStore('kv'), lru = tx.objectStore('lru');
      let value = blob;
      if (blob) {
        kv.put(blob, url); lru.put({ url, size: blob.size, touched: Date.now() }, url);
        const all = lru.getAll();
        all.onsuccess = () => {
          const entries = all.result as { url: string; size: number; touched: number }[];
          let bytes = entries.reduce((n, entry) => n + entry.size, 0), count = entries.length;
          for (const entry of entries.sort((a, b) => a.touched - b.touched)) {
            if (bytes <= IMAGE_BYTES && count <= IMAGE_ENTRIES) break;
            if (entry.url === url) continue;
            kv.delete(entry.url); lru.delete(entry.url); bytes -= entry.size; count--;
          }
        };
      } else {
        const read = kv.get(url);
        read.onsuccess = () => {
          value = read.result instanceof Blob ? read.result : undefined;
          if (value) lru.put({ url, size: value.size, touched: Date.now() }, url);
        };
      }
      tx.oncomplete = () => resolve(value);
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } catch { return undefined; }
}
export const imageGet = (url: string) => imageEntry(url);
export const imageSet = (url: string, blob: Blob) => imageEntry(url, blob);
export const cacheClear = () => run('readwrite', store => store.clear());
// Saved data belongs to whoever is signed in
export async function cacheNamespace() {
  const { data } = await trackstatAuth.auth.getSession();
  return data.session?.user.id ?? 'anon';
}
