const CACHE_NAME = "balanca-rural-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./public/icons/icon.svg",
  "./src/app/main.js?v=3",
  "./src/data/db/indexedDb.js",
  "./src/data/repositories/propertiesRepository.js",
  "./src/data/repositories/weightRecordsRepository.js",
  "./src/services/export/exporters.js",
  "./src/styles/global.css",
  "./src/utils/id.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
