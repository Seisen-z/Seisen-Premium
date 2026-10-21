'use client';
import { imageGet, imageSet } from './trackstat-cache';

const pending = new Map<string, Promise<Blob | null>>();
const waiting: (() => void)[] = [];
let downloads = 0;
const started: number[] = [];
let wake: ReturnType<typeof setTimeout> | undefined;

function drain() {
  const now = Date.now();
  while (started.length && started[0] <= now - 3000) started.shift();
  while (waiting.length && downloads < 4 && started.length < 20) {
    downloads++;
    started.push(now);
    waiting.shift()?.();
  }
  if (waiting.length && started.length >= 20 && wake === undefined) {
    wake = setTimeout(() => { wake = undefined; drain(); }, Math.max(1, started[0] + 3000 - Date.now()));
  }
}

// PNG URLs are versioned by their asset/content identity; read bytes locally before any network request.
export function thumbnailBlob(url: string): Promise<Blob | null> {
  const existing = pending.get(url);
  if (existing) return existing;
  const load = async () => {
    const cached = await imageGet(url);
    if (cached instanceof Blob) return cached;
    await new Promise<void>(resolve => {
      waiting.push(resolve);
      drain();
    });
    try {
      const response = await fetch(url, { credentials: 'omit', cache: 'force-cache', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Thumbnail download failed.');
      const blob = await response.blob();
      if (!blob.size || blob.size > 1024 * 1024 || new Uint8Array(await blob.slice(0, 8).arrayBuffer()).join(',') !== '137,80,78,71,13,10,26,10') throw new Error('Invalid thumbnail PNG.');
      await imageSet(url, blob);
      return blob;
    } catch (error) {
      // A non-CORS image can still load through an ordinary img element.
      if (error instanceof TypeError) return null;
      throw error;
    } finally {
      downloads--;
      drain();
    }
  };
  const request = load().finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
}
