const CACHE_NAME = 'toumaar-pwa-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_ASSETS = [OFFLINE_URL, '/pwa-192.png', '/pwa-512.png', '/pwa-maskable-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key.startsWith('toumaar-pwa-') && key !== CACHE_NAME)
                .map((key) => caches.delete(key)),
        )).then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || request.mode !== 'navigate' ||
        url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    event.respondWith(
        fetch(request).catch(async () => {
            const cached = await caches.match(OFFLINE_URL);
            return cached ?? new Response('You are offline. Reconnect and try again.', {
                status: 503,
                headers: {'Content-Type': 'text/plain; charset=utf-8'},
            });
        }),
    );
});
