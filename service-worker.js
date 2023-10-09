const cacheName = "TIME_CREDITS_V0.1";

const assets = [
  "/pwa-test/",
  "/pwa-test/index.html",
  "/pwa-test/favicon-32x32.png",
  "/pwa-test/main.js",
  "/pwa-test/style.css",
  "/pwa-test/icon-72.png",
  "/pwa-test/icon-128.png",
  "/pwa-test/icon-144.png",
  "/pwa-test/icon-192.png",
  "/pwa-test/icon-512.png",
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(assets);
    })()
  );
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    (async () => {
      const cachedResponse = await caches.match(evt.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      const response = await fetch(evt.request);
      const cache = await caches.open(cacheName);
      cache.put(evt.request, response.clone());
      return response;
    })()
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(
          key => 
            key !== cacheName
              ? caches.delete(key)
              : Promise.resolve(undefined)
        )
      );
    })()
  );
});