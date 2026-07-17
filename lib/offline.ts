const CACHE_NAME = 'offline-tracks-v1';

export const streamUrl = (id: string) => `/api/stream/${id}`;

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

const lsKey = (key: string) => 'pv2_offline_' + key;

export function lsGetOffline<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def;
  try {
    const v = localStorage.getItem(lsKey(key));
    return v == null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
}

export function lsSaveOffline(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(lsKey(key), JSON.stringify(value)); } catch { /* ignore */ }
}

// Immutable helpers for the id => true presence maps we persist to localStorage.
export function withId(map: Record<string, true>, id: string): Record<string, true> {
  return { ...map, [id]: true };
}

export function withoutId(map: Record<string, true>, id: string): Record<string, true> {
  if (!(id in map)) return map;
  const next: Record<string, true> = {};
  for (const k in map) if (k !== id) next[k] = true;
  return next;
}

export async function cacheTrack(id: string): Promise<void> {
  const url = streamUrl(id);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download track ${id}`);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(url, res);
}

export async function uncacheTrack(id: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(streamUrl(id));
}

export async function clearTrackCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
}

// Resolves a downloaded track straight from Cache Storage as an object URL —
// works fully offline since it never touches the network.
export async function getCachedTrackBlobUrl(id: string): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const res = await cache.match(streamUrl(id));
  if (!res) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Finds the next/prev queue index that's safe to play. While offline, ids
// missing from `downloaded` are skipped over silently (never counted as a
// real playback, so no rating report is ever generated for them). Returns
// null if nothing in the whole queue is playable right now.
export function findPlayableIndex(
  queue: string[],
  fromPos: number,
  downloaded: Record<string, true>,
  direction: 1 | -1 = 1,
): number | null {
  if (!queue.length) return null;
  if (isOnline()) return mod(fromPos + direction, queue.length);
  for (let i = 1; i <= queue.length; i++) {
    const idx = mod(fromPos + direction * i, queue.length);
    if (downloaded[queue[idx]]) return idx;
  }
  return null;
}
