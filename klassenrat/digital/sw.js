// Hintergrunddienst für die installierte App: lädt immer die neueste Fassung aus dem Netz
// und nutzt die zwischengespeicherte nur, wenn keine Verbindung besteht (Start auch offline).
const CACHE = "klassenrat-v1";
const DATEIEN = ["./", "./index.html", "./manifest.webmanifest", "./app-icon-192.png", "./app-icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(DATEIEN.map((d) => c.add(d).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;  // PeerJS, QR-Baustein usw. nicht anfassen
  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        if (antwort.ok) { const kopie = antwort.clone(); caches.open(CACHE).then((c) => c.put(e.request, kopie)); }
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./")))
  );
});
