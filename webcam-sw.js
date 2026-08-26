
// Minimal service worker - just enough to make the page installable.
// It doesn't cache anything, so the page always loads fresh from the network.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
