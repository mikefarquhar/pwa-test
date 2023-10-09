const version = "TIME_CREDITS_V0.1";

const assets = [
  "/pwa-test",
  "/pwa-test/index.html",
  "/pwa-test/main.js",
  "/pwa-test/style.css",
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(version).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(res => {
      return res || fetch(evt.request);
    })
  );
});