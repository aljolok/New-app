const CACHE_NAME = 'expense-app-cache-v8.0'; // Final Professional Version
const urlsToCache = [
    './index.html',
    './app.js',
    './style.css',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error("SW Cache Install failed:", err))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cacheName => {
                if (!cacheWhitelist.includes(cacheName)) {
                    return caches.delete(cacheName);
                }
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Let Firebase handle its own network requests
    if (event.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    // "Network falling back to cache" strategy
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // If the fetch is successful, clone it and cache it.
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            })
            .catch(() => {
                // If the network fails, try to serve from the cache.
                return caches.match(event.request);
            })
    );
});
