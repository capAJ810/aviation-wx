// ALTITUDE service worker — kept intentionally minimal.
// Weather/METAR/TAF data must always be live, so this only caches the static
// app shell (this HTML file + its fonts/library), never API responses.
const CACHE_NAME = 'altitude-shell-v1';
const SHELL_URL = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only ever serve the app shell itself from cache (with a network-first
  // refresh so you always get updates when online). Everything else — map
  // tiles, weather APIs, METAR/TAF — goes straight to the network untouched.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(SHELL_URL))
    );
  }
});
