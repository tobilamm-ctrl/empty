/*
 * Test für den echten Server (server/index.js): Seiten, Dateien, Pfadprüfung, PIN-Schutz, Import, WebSocket.
 * Der Server läuft auf einem freien Port und schreibt in einen Temp-Ordner. Die Einstellungen kommen aus config.json.
 * Start: node tools/test-server.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { createCanvas } = require('@napi-rs/canvas');
const { starten, konfigLaden } = require('../server/index');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// Roher HTTP-Aufruf ohne Normalisierung des Pfads (fetch würde „../“ vorher auflösen)
function rohAnfrage(base, pfad) {
  const u = new URL(base);
  return new Promise((ok, nein) => {
    http.get({ host: u.hostname, port: u.port, path: pfad }, (res) => {
      const teile = [];
      res.on('data', (d) => teile.push(d));
      res.on('end', () => ok({ status: res.statusCode, typ: res.headers['content-type'] || '', text: Buffer.concat(teile).toString('utf8') }));
    }).on('error', nein);
  });
}

// Sitzplan-Projekt wie in tools/test-import.js: zwei Tische, drei Gäste (einer ohne Platz), ein leerer Gast
function projekt() {
  return {
    settings: {
      partner1: 'Erna', partner2: 'Hans', date: '2027-06-14', place: 'Schloss',
      theme: 'salbei', accent: '#123456', font: 'romantisch',
      customFonts: [{ key: 'cf-1', name: 'Meine Schrift', asset: 'a1' }],
    },
    items: [{ id: 't1', name: 'Tisch 1' }, { id: 't2', name: 'Brautpaar' }],
    guests: [
      { id: 'g1', first: 'Anna', last: 'Muster', seat: { item: 't1', idx: 0 } },
      { id: 'g2', first: 'Bert', last: 'Beispiel', seat: { item: 't2', idx: 1 } },
      { id: 'g3', first: 'Carla', last: 'Ohneplatz' },
      { id: 'g4', first: '', last: '' },
    ],
    assets: { a1: 'data:font/woff2;base64,' + Buffer.from('xyz').toString('base64') },
  };
}

// Nachrichten aus dem WebSocket sammeln; warte() liefert die erste passende (auch schon angekommene)
function warteNachricht(liste, pred, ms = 3000) {
  return new Promise((ok, nein) => {
    const ende = Date.now() + ms;
    const pruefe = () => {
      const treffer = liste.find(pred);
      if (treffer) return ok(treffer);
      if (Date.now() > ende) return nein(new Error('Keine passende WebSocket-Nachricht innerhalb ' + ms + ' ms'));
      setTimeout(pruefe, 20);
    };
    pruefe();
  });
}
function verbinden(url) {
  return new Promise((aufloesen, nein) => {
    const ws = new WebSocket(url);
    const nachrichten = [];
    ws.on('message', (d) => nachrichten.push(JSON.parse(d.toString('utf8'))));
    ws.on('open', () => aufloesen({ ws, nachrichten }));
    ws.on('error', nein);
  });
}

test('Seiten /ipad, /buehne, /service und /simulator liefern HTML', async (ctx) => {
  for (const pfad of ['/ipad', '/buehne', '/service', '/simulator']) {
    const res = await fetch(ctx.base + pfad);
    assert.equal(res.status, 200, `${pfad} liefert nicht 200`);
    assert.match(res.headers.get('content-type'), /^text\/html/, `${pfad} ist kein HTML`);
    assert.match(await res.text(), /<html/i, `${pfad} enthält kein <html>`);
  }
});

test('statische Dateien: /web/app.css und Schrift unter /schriften/', async (ctx) => {
  const css = await fetch(ctx.base + '/web/app.css');
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /^text\/css/);

  const schrift = await fetch(ctx.base + '/schriften/great-vibes-latin-400-normal.woff2');
  assert.equal(schrift.status, 200);
  assert.equal(schrift.headers.get('content-type'), 'font/woff2');
});

test('Pfadprüfung: „../“ führt nicht zur Konfigurationsdatei', async (ctx) => {
  const pfade = ['/web/../config.json', '/web/..%2Fconfig.json', '/web/..%2F..%2Fconfig.json', '/schriften/..%2Fconfig.json'];
  for (const pfad of pfade) {
    const res = await rohAnfrage(ctx.base, pfad);
    assert.equal(res.status, 404, `${pfad} liefert nicht 404`);
    assert.ok(!res.text.includes('"datenOrdner"'), `${pfad} liefert die Konfiguration`);
    assert.ok(!res.text.includes(ctx.pin), `${pfad} liefert die PIN`);
  }
});

test('GET /live.jpg liefert ein JPEG', async (ctx) => {
  const res = await fetch(ctx.base + '/live.jpg');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/jpeg');
  const daten = Buffer.from(await res.arrayBuffer());
  assert.equal(daten[0], 0xff);
  assert.equal(daten[1], 0xd8);
});

test('/api/service: ohne PIN 403, mit PIN die Einstellungen', async (ctx) => {
  const ohne = await fetch(ctx.base + '/api/service');
  assert.equal(ohne.status, 403);
  assert.equal((await ohne.json()).fehler, 'Falsche PIN');

  const falsch = await fetch(ctx.base + '/api/service?pin=0000');
  assert.equal(falsch.status, 403);

  const mit = await fetch(ctx.base + '/api/service?pin=' + ctx.pin);
  assert.equal(mit.status, 200);
  const daten = await mit.json();
  assert.ok(daten.einstellungen, 'keine Einstellungen in der Antwort');
  assert.equal(typeof daten.einstellungen.namen, 'string');
});

test('/api/import: Sitzplan mit PIN übernehmen, danach stehen die Namen im Service', async (ctx) => {
  const ohnePin = await fetch(ctx.base + '/api/import', { method: 'POST', body: JSON.stringify(projekt()) });
  assert.equal(ohnePin.status, 403);

  const res = await fetch(`${ctx.base}/api/import?pin=${ctx.pin}`, { method: 'POST', body: JSON.stringify(projekt()) });
  assert.equal(res.status, 200);
  const antwort = await res.json();
  assert.equal(antwort.gaeste, 3);

  const service = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  assert.equal(service.einstellungen.namen, 'Erna & Hans');
  assert.equal(service.einstellungen.datum, '14. Juni 2027');
  assert.equal(service.gaeste, 3);
});

test('/api/import: ungültige Datei wird mit 400 abgelehnt', async (ctx) => {
  const res = await fetch(`${ctx.base}/api/import?pin=${ctx.pin}`, { method: 'POST', body: 'kein json' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).fehler);
});

test('WebSocket /ws: Zustand, Aktion „start“ und falsche Admin-PIN', async (ctx) => {
  const { ws, nachrichten } = await verbinden(ctx.base.replace(/^http/, 'ws') + '/ws');
  try {
    const erster = await warteNachricht(nachrichten, (m) => m.typ === 'zustand');
    assert.equal(erster.zustand.ansicht, 'start');

    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'start' }));
    const modus = await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'modus');
    assert.equal(modus.zustand.ansicht, 'modus');

    ws.send(JSON.stringify({ typ: 'admin', pin: 'falsch', aktion: 'zumStart' }));
    const antwort = await warteNachricht(nachrichten, (m) => m.typ === 'antwort');
    assert.equal(antwort.ok, false);
  } finally {
    await new Promise((r) => { ws.once('close', r); ws.close(); });
  }
});

// ---------- Gäste, Foto, Gästebuch, QR, Eigene Fotos, Export ----------
// Die Tests bauen aufeinander auf (wie oben): Gästeliste → Foto (legt ctx.foto an) → Download, Export, Statistik

const wsUrl = (ctx) => ctx.base.replace(/^http/, 'ws') + '/ws';

test('GET /api/qr?t=hallo liefert einen QR-Code als SVG', async (ctx) => {
  const res = await fetch(`${ctx.base}/api/qr?t=hallo`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^image\/svg\+xml/);
  assert.ok((await res.text()).includes('<svg'));
});

test('Gästeliste: Import mit Adressen, GET /api/gaeste liefert nur id, name und tisch', async (ctx) => {
  const p = projekt();
  Object.assign(p.guests[0], { street: 'Hauptstr. 1', zip: '10115', city: 'Berlin' });
  const res = await fetch(`${ctx.base}/api/import?pin=${ctx.pin}`, { method: 'POST', body: JSON.stringify(p) });
  assert.equal(res.status, 200);

  const gaeste = await (await fetch(`${ctx.base}/api/gaeste`)).json();
  assert.equal(gaeste.length, 3);
  assert.deepEqual(gaeste[0], { id: 'g1', name: 'Anna Muster', tisch: 'Tisch 1' });
  gaeste.forEach((g) => assert.deepEqual(Object.keys(g).sort(), ['id', 'name', 'tisch']));
  assert.ok(!JSON.stringify(gaeste).includes('Hauptstr'), 'die Adresse darf hier nicht öffentlich sein');
});

test('Aufnahme über den Knopf (WebSocket): Vorschau, Gästebuch mit Anna, weiter zu „Druck“ mit QR-Code', async (ctx) => {
  const { ws, nachrichten } = await verbinden(wsUrl(ctx));
  try {
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand');
    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'knopf' }));
    // Countdown dauert im Server 3 s, danach Aufnahme und Speichern
    const vorschau = await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'vorschau', 10000);
    const foto = vorschau.zustand.foto;
    assert.equal(foto.url, `/fotos/${foto.id}/druck.jpg?k=${foto.schluessel}`);
    assert.ok(foto.schluessel, 'der Schlüssel für den QR-Link fehlt');

    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'gaestebuch' }));
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'gaestebuch');
    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'gaestebuchSpeichern', daten: { gaeste: ['g1'], namenFrei: '', gruss: 'Viel Glück!', unterschrift: null } }));
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.imGaestebuch === true);

    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'weiter' }));
    const druck = await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'druck');
    assert.ok(druck.zustand.qr.foto.endsWith(`/f/${foto.id}?k=${foto.schluessel}`), `QR-Link falsch: ${druck.zustand.qr.foto}`);

    // Zurück zum Start, damit die folgenden Tests frei sind
    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'ohneDruck' }));
    ws.send(JSON.stringify({ typ: 'aktion', aktion: 'fertig' }));
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'start');

    ctx.foto = { id: foto.id, schluessel: foto.schluessel };
  } finally {
    await new Promise((r) => { ws.once('close', r); ws.close(); });
  }
});

test('Download-Seite /f/<id>?k=…: mit richtigem Schlüssel „Foto speichern“, mit falschem 404', async (ctx) => {
  const richtig = await fetch(`${ctx.base}/f/${ctx.foto.id}?k=${ctx.foto.schluessel}`);
  assert.equal(richtig.status, 200);
  assert.ok((await richtig.text()).includes('Foto speichern'));

  const falsch = await fetch(`${ctx.base}/f/${ctx.foto.id}?k=000000000000`);
  assert.equal(falsch.status, 404);
  assert.ok((await falsch.text()).includes('gibt es nicht'));
});

test('Foto mit ?laden=1 kommt als Download (Content-Disposition: attachment), ohne ?laden=1 nicht', async (ctx) => {
  const laden = await fetch(`${ctx.base}/fotos/${ctx.foto.id}/druck.jpg?laden=1&k=${ctx.foto.schluessel}`);
  assert.equal(laden.status, 200);
  assert.match(laden.headers.get('content-disposition'), /^attachment/);

  const ansicht = await fetch(`${ctx.base}/fotos/${ctx.foto.id}/druck.jpg?k=${ctx.foto.schluessel}`);
  assert.equal(ansicht.headers.get('content-disposition'), null);
  // Ein Foto, das (noch) nicht in der Diashow läuft, gibt es nur mit dem richtigen Schlüssel
  const f = ctx.server.speicher.foto(ctx.foto.id);
  ctx.server.speicher.fotoAendern(f.id, { ausgeblendet: true });
  assert.equal((await fetch(`${ctx.base}/fotos/${f.id}/druck.jpg`)).status, 404);
  assert.equal((await fetch(`${ctx.base}/fotos/${f.id}/druck.jpg?k=${f.schluessel}`)).status, 200);
  ctx.server.speicher.fotoAendern(f.id, { ausgeblendet: false });
});

test('Eigene Fotos: PNG mit PIN hochladen (ohne PIN 403, Text 400), abrufbar unter /eigene/ und im Service gelistet', async (ctx) => {
  const bild = createCanvas(64, 48).toBuffer('image/png');
  const ohne = await fetch(`${ctx.base}/api/eigene`, { method: 'POST', body: bild });
  assert.equal(ohne.status, 403);

  const res = await fetch(`${ctx.base}/api/eigene?pin=${ctx.pin}`, { method: 'POST', body: bild });
  assert.equal(res.status, 200);
  const { datei } = await res.json();
  assert.match(datei, /\.png$/);
  ctx.eigene = datei;

  const get = await fetch(`${ctx.base}/eigene/${encodeURIComponent(datei)}`);
  assert.equal(get.status, 200);
  assert.deepEqual(Buffer.from(await get.arrayBuffer()), bild);

  const text = await fetch(`${ctx.base}/api/eigene?pin=${ctx.pin}`, { method: 'POST', body: 'das ist kein Bild' });
  assert.equal(text.status, 400);
  assert.ok((await text.json()).fehler);

  const service = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  assert.ok(service.eigene.includes(datei), 'das eigene Foto fehlt in der Service-Liste');
});

test('Admin: eigenes Foto per WebSocket löschen, danach 404 unter /eigene/', async (ctx) => {
  const { ws, nachrichten } = await verbinden(wsUrl(ctx));
  try {
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand');
    ws.send(JSON.stringify({ typ: 'admin', pin: ctx.pin, aktion: 'eigeneLoeschen', daten: { datei: ctx.eigene } }));
    const antwort = await warteNachricht(nachrichten, (m) => m.typ === 'antwort' && m.aktion === 'eigeneLoeschen');
    assert.equal(antwort.ok, true);
  } finally {
    await new Promise((r) => { ws.once('close', r); ws.close(); });
  }

  const weg = await fetch(`${ctx.base}/eigene/${encodeURIComponent(ctx.eigene)}`);
  assert.equal(weg.status, 404);
  const service = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  assert.ok(!service.eigene.includes(ctx.eigene));
});

test('/api/dankeskarten.csv: ohne PIN 403, mit PIN CSV mit BOM, Adresse und Foto von Anna', async (ctx) => {
  const ohne = await fetch(`${ctx.base}/api/dankeskarten.csv`);
  assert.equal(ohne.status, 403);

  const res = await fetch(`${ctx.base}/api/dankeskarten.csv?pin=${ctx.pin}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/csv/);
  // Rohbytes lesen: fetch().text() würde das BOM abschneiden
  const roh = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...roh.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'BOM fehlt');
  const csv = roh.toString('utf8');
  assert.ok(csv.includes('"Hauptstr. 1"'), 'Adresse aus dem Import fehlt');
  assert.ok(csv.includes(`"${ctx.foto.id}.jpg"`), 'das Foto von Anna fehlt');
});

test('/api/export.zip?sort=gast: ohne PIN 403, mit PIN ein ZIP mit Gast-Ordner und Gästebuch', async (ctx) => {
  const ohne = await fetch(`${ctx.base}/api/export.zip?sort=gast`);
  assert.equal(ohne.status, 403);

  const res = await fetch(`${ctx.base}/api/export.zip?sort=gast&pin=${ctx.pin}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/zip');
  assert.match(res.headers.get('content-disposition'), /fotobox-fotos-gast\.zip/);
  const zip = Buffer.from(await res.arrayBuffer());
  assert.equal(zip.subarray(0, 2).toString('latin1'), 'PK', 'kein ZIP-Kopf');
  // Dateinamen stehen unkomprimiert im ZIP
  assert.ok(zip.includes(`nach-gast/Anna Muster/${ctx.foto.id}.jpg`), 'Ordner für Anna fehlt');
  assert.ok(zip.includes('gaestebuch/gaestebuch.csv'));
});

test('/api/service: Layouts und Filter mit allen Schlüsseln, Statistik zählt das Foto', async (ctx) => {
  const daten = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  for (const k of ['rahmen', 'vollbild', 'polaroid', 'elegant']) assert.ok(k in daten.layouts, `Layout fehlt: ${k}`);
  for (const k of ['farbe', 'sw', 'vintage', 'weich']) assert.ok(k in daten.filter, `Filter fehlt: ${k}`);
  assert.ok(daten.statistik.fotos >= 1, 'die Statistik zählt kein behaltenes Foto');
  assert.equal(daten.statistik.gaestebuch, 1);
});

(async () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-server-'));
  const konfig = Object.assign(konfigLaden(), { port: 0, datenOrdner: ordner });
  const server = await starten(konfig, { leise: true });
  const ctx = { base: `http://127.0.0.1:${server.port}`, pin: String(konfig.pin), server };
  let fehler = null;
  try {
    for (const t of tests) {
      try {
        await t.fn(ctx);
        console.log(`ok – ${t.name}`);
      } catch (e) {
        console.error(`FEHLER – ${t.name}`);
        console.error(e);
        fehler = e;
        break;
      }
    }
  } finally {
    await server.beenden();
    fs.rmSync(ordner, { recursive: true, force: true });
  }
  if (fehler) process.exit(1);
})();
