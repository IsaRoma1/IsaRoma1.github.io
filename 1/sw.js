const CACHE_NAME = "to-organizma-static-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("to-organizma")).map((key) => caches.delete(key))))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("to-organizma")).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
});

self.addEventListener("fetch", (event) => {
  return;
});
