const CACHE = "roman-me-v3.3";
const APP_SHELL = [
  "/me/",
  "/me/index.html",
  "/me/styles.css?v=3.3.0",
  "/me/app.js?v=3.3.0",
  "/me/manifest.json?v=3",
  "/me/icon.svg",
  "/me/roman-cutout-v3.png",
  "/me/roman-hero.png",
  "/me/assets/goals/urus.webp",
  "/me/assets/goals/income.webp",
  "/me/assets/goals/reserve.webp",
  "/me/assets/goals/debt.webp",
  "/me/assets/goals/lazar.webp",
  "/me/assets/goals/medical.webp",
  "/me/assets/goals/health.webp",
  "/me/assets/goals/mercedes-g450d.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/me/")))
  );
});
