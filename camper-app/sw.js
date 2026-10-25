// Offline-Speicher: App-Dateien, Schriften, angesehene Fotos und Kartenkacheln.
// Nach Änderungen an der App die Versionsnummer erhöhen, damit Handys die neuen Dateien laden.
const VERSION = 'lammping-15';
const SHELL = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/mehr.js', 'js/kartenedit.js', 'js/testdaten.js', 'js/extras.js', 'js/spiele.js', 'js/kfz.js', 'js/ideen.js', 'js/export.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];
const TILES = 'lammping-tiles';
const PHOTOS = 'lammping-photos';
const MAX_TILES = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== TILES && k !== PHOTOS).map(k => caches.delete(k))))
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
      // Das Reiseheft lädt Kacheln mit CORS, gespeicherte Kacheln der Karte sind dafür nicht lesbar
      if (hit && (req.mode !== 'cors' || hit.type !== 'opaque')) return hit;
      const res = await fetch(req);
      if (res.ok && req.mode !== 'cors') { c.put(req, res.clone()); trimTiles(); }
      return res;
    }));
    return;
  }

  const own = url.origin === location.origin;

  // Fotos ändern sich nie: einmal geladen, gibt es sie auch offline
  if (own && url.pathname.endsWith('/api/') && url.searchParams.get('a') === 'photo') {
    e.respondWith(caches.open(PHOTOS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (own && url.pathname.includes('/api/')) return; // Abgleich und Anmeldung: immer direkt zum Server

  const lib = url.hostname.endsWith('fonts.googleapis.com') || url.hostname === 'fonts.gstatic.com';
  if (!own && !lib) return; // Ortsnamen und Navigation: immer direkt ins Netz

  // App-Dateien: Netz zuerst, damit Updates sofort ankommen; offline aus dem Speicher
  e.respondWith(fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
