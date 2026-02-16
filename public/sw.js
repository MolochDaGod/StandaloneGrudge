const CACHE_NAME = 'grudge-warlords-v3';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/pwa/icon-192x192.png',
  '/pwa/icon-512x512.png',
];

const CACHEABLE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff2', '.woff'];

const SKIP_CACHE_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.mp4', '.webm'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const isSkipCache = SKIP_CACHE_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext));
  if (isSkipCache) return;

  const isCacheableAsset = CACHEABLE_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext));

  if (isCacheableAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone).catch(() => {});
            });
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
  }
});
