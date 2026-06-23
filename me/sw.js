const CACHE_NAME = "roman-memo-v13";
const APP_SHELL = [
  "/me/styles.css?v=atlas-10",
  "/me/app.js?v=atlas-10",
  "/me/manifest.json",
  "/me/icon.svg",
  "/me/roman-hero.png",
  "/me/assets/art-morning.jpg",
  "/me/assets/art-memo.jpg",
  "/me/assets/art-power.jpg",
  "/me/assets/art-created.jpg",
  "/me/assets/art-habits.jpg",
  "/me/assets/art-focus.jpg",
  "/me/assets/art-goals.jpg",
  "/me/assets/art-finance.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/me/index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
      return cached || fetched;
    }),
  );
});
