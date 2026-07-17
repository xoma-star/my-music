// Minimal offline app-shell cache. Audio files are cached separately by the
// app itself (see lib/offline.ts, cache name 'offline-tracks-v1') — this SW
// must never touch that cache or intercept /api/stream requests, which are
// served straight from Cache Storage as blob URLs, bypassing the network
// entirely once downloaded.
const RUNTIME_CACHE = 'runtime-shell-v1';
const KEEP_CACHES = new Set([RUNTIME_CACHE, 'offline-tracks-v1']);

const BYPASS = [/^\/api\/stream\//];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP_CACHES.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((re) => re.test(url.pathname))) return;

  event.respondWith(networkFirst(req));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
