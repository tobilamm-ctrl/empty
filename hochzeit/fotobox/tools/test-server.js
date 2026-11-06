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

(async () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-server-'));
  const konfig = Object.assign(konfigLaden(), { port: 0, datenOrdner: ordner });
  const server = await starten(konfig, { leise: true });
  const ctx = { base: `http://127.0.0.1:${server.port}`, pin: String(konfig.pin) };
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
