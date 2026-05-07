const CACHE_NAME = 'volumetric-time-camera-v1.92';
const JSQR_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icons/icon_32.png',
  './icons/icon_192.png',
  './icons/icon_512.png',
  './icons/settings.png',
  './icons/download.png',
  './icons/delete.png',
  './icons/gallery.png',
  './icons/maximize.png',
  './icons/minimize.png',
  './icons/aperture.png',
  JSQR_URL
];
const APP_SHELL_URLS = new Set(
  APP_SHELL.map((asset) => new URL(asset, self.location.href).href)
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(
      APP_SHELL.map((asset) => cache.add(asset).catch(() => null))
    ))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  const isAppShellRequest = APP_SHELL_URLS.has(requestUrl.href);

  if (requestUrl.origin !== self.location.origin && !isAppShellRequest) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./index.html', responseClone).catch(() => {});
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isAppShellRequest) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => (
      cachedResponse || fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }

        return networkResponse;
      })
    ))
  );
});
