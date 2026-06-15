const CACHE_NAME = "to-organizma-static-v1";
const SHELL = ["/1/", "/1/manifest.json", "/1/icons/icon-192.png", "/1/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.includes("/api/") || url.pathname.includes("lab-documents")) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
