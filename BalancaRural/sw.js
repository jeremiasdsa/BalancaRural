const CACHE_NAME = "balanca-rural-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./public/icons/icon.svg",
  "./src/app/main.js?v=9",
  "./src/data/db/indexedDb.js",
  "./src/data/repositories/propertiesRepository.js",
  "./src/data/repositories/weightRecordsRepository.js",
  "./src/firebase/config.js",
  "./src/firebase/auth.js",
  "./src/firebase/firebaseClient.js",
  "./src/firebase/firestoreSync.js",
  "./src/services/export/exporters.js",
  "./src/styles/global.css?v=2",
  "./src/utils/id.js",
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js"
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
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
