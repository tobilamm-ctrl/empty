// Offline-Speicher: App-Dateien, Schriften, angesehene Fotos und Kartenkacheln.
// Nach Änderungen an der App die Versionsnummer erhöhen, damit Handys die neuen Dateien laden.
const VERSION = 'lammping-50';
const SHELL = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/kacheln.js', 'js/mehr.js', 'js/kartenedit.js', 'js/testdaten.js', 'js/extras.js', 'js/spiele.js', 'js/kfz.js', 'js/ideen.js', 'js/export.js', 'js/unterwegs.js', 'js/teilen.js', 'js/fotos.js', 'js/reisepass.js', 'js/packhilfe.js', 'js/familie.js', 'js/film.js', 'js/alltag.js', 'js/zeitachse.js', 'js/welt.js', 'js/flaggen.js', 'js/auswertung.js', 'js/abenteuer.js', 'js/weitergeben.js', 'js/draussen.js', 'js/zuladung.js', 'js/stellplatz.js', 'js/familienrat.js', 'js/fahrspiele.js', 'js/navigation.js', 'js/mitteilen.js', 'js/tickets.js', 'js/labyrinth.js', 'js/sprache.js', 'js/eintragen.js', 'js/fotoansicht.js', 'js/herzen.js', 'js/lesen.js', 'js/kartenebenen.js', 'js/bedienung.js', 'js/fahrzeuge.js', 'js/infos.js', 'js/familienleben.js', 'js/sichern.js', 'vendor/qrcode/qrcode.js', 'js/spielekiste.js', 'js/mitfahrer.js', 'js/mitfahrer-bilder.js', 'icons/mitfahrer/ballon.webp', 'icons/mitfahrer/bobbycar.webp', 'icons/mitfahrer/boot.webp', 'icons/mitfahrer/dampflok.webp', 'icons/mitfahrer/dino.webp', 'icons/mitfahrer/fahrrad.webp', 'icons/mitfahrer/falter.webp', 'icons/mitfahrer/feuerwehr.webp', 'icons/mitfahrer/flieger.webp', 'icons/mitfahrer/hase.webp', 'icons/mitfahrer/hund.webp', 'icons/mitfahrer/igel.webp', 'icons/mitfahrer/schaf.webp', 'icons/mitfahrer/schnecke.webp', 'icons/mitfahrer/traktor.webp', 'icons/mitfahrer/ufo.webp', 'icons/mitfahrer/vogel.webp', 'icons/mitfahrer/vogel2.webp',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];
const TILES = 'lammping-tiles';
const PHOTOS = 'lammping-photos';
const MAX_TILES = 6000;            // angesehene Kartenteile bleiben für unterwegs ohne Netz erhalten

self.addEventListener('install', e => {
  // cache: 'reload' umgeht den Browser-Zwischenspeicher, sonst landen beim Update alte Dateien im neuen Speicher
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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

// „Teilen mit LAMMping“ (manifest share_target): Geteiltes ablegen und die App auf der Seite „teilen“ öffnen
async function receiveShare(req) {
  try {
    const fd = await req.formData();
    const c = await caches.open('lammping-share');
    const files = fd.getAll('fotos').filter(f => f && f.size);
    for (let i = 0; i < files.length; i++) await c.put('f' + i, new Response(files[i], { headers: { 'Content-Type': files[i].type || 'application/octet-stream' } }));
    await c.put('meta', new Response(JSON.stringify({ title: fd.get('title') || '', text: fd.get('text') || '', url: fd.get('url') || '', count: files.length }),
      { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* dann eben leer */ }
  return Response.redirect('./#/teilen', 303);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method === 'POST' && /\/teilen-ziel\/?$/.test(new URL(req.url).pathname)) { e.respondWith(receiveShare(req)); return; }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Kartenkacheln: erst Speicher, sonst Netz (und merken)
  // auch Wanderkarte (OpenTopoMap) und Luftbild (Esri)
  if (url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('tile.opentopomap.org') || (url.hostname === 'server.arcgisonline.com' && url.pathname.includes('/tile/'))) {
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

  // App-Dateien: Netz zuerst (immer beim Server nachfragen), damit Updates sofort ankommen; offline aus dem Speicher
  e.respondWith(fetch(own ? new Request(req, { cache: 'no-cache' }) : req).then(res => {
    if (res.ok || res.type === 'opaque') {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
