const CACHE_NAME = 'agenda-movil-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler required for PWA installation
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
