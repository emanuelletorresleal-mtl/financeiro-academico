const cacheName = "financeiro-academico-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) =>
      cache.addAll(["./index.html", "./styles.css", "./app.js", "./firebase-config.js", "./auth.js", "./cloud-sync.js", "./manifest.webmanifest", "./icon.svg"])
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.open(cacheName).then((cache) => cache.match(event.request)).then((cached) => cached || fetch(event.request)));
});
