// Offline-Speicher: App-Dateien, Schriften, Firebase-Bibliothek und angesehene Kartenkacheln.
// Nach Änderungen an der App die Versionsnummer erhöhen, damit Handys die neuen Dateien laden.
const VERSION = 'bordbuch-1';
const SHELL = [
  './', 'index.html', 'config.js', 'css/app.css', 'js/app.js', 'js/store.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
];
const TILES = 'bordbuch-tiles';
const MAX_TILES = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== TILES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Kartenkacheln: erst Speicher, sonst Netz (und merken)
  if (url.hostname === 'tile.openstreetmap.org') {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { c.put(req, res.clone()); trimTiles(); }
      return res;
    }));
    return;
  }

  const own = url.origin === location.origin;
  const lib = url.hostname === 'www.gstatic.com' || url.hostname.endsWith('fonts.googleapis.com') || url.hostname === 'fonts.gstatic.com';
  if (!own && !lib) return; // Firestore, Anmeldung, Ortsnamen: immer direkt ins Netz

  // App-Dateien: Netz zuerst, damit Updates sofort ankommen; offline aus dem Speicher
  e.respondWith(fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
