/*
 * Fotobox-Server: startet Kamera, Drucker, Speicher und Ablauf und liefert die Seiten aus.
 *   /ipad        Bedienung für die Gäste
 *   /buehne      großer Bildschirm (am Mini-PC im Vollbild)
 *   /service     Service und Admin (Handy), Aktionen mit PIN
 *   /simulator   iPad und großer Bildschirm nebeneinander, Knopf und Störungen zum Ausprobieren
 *   /f/<id>?k=…  Download-Seite für den QR-Code (Handy der Gäste im Fotobox-WLAN)
 * Start: npm start   (Einstellungen in config.json, optional config.local.json für den eigenen PC)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { WebSocketServer } = require('ws');

const { Speicher } = require('./speicher');
const { Ablauf } = require('./ablauf');
const { DruckerVerwaltung } = require('./drucker/verwaltung');
const { druckerSimulator, druckerWindows } = require('./drucker/treiber');
const { kameraSimulator } = require('./kamera/simulator');
const { kameraDigicamcontrol } = require('./kamera/digicamcontrol');
const bild = require('./bild');
const { gestaltung, FARBWELTEN, SCHRIFTSTILE } = require('./gestaltung');
const qrcode = require('qrcode-generator');
const { sitzplanLesen } = require('./import');

const WURZEL = path.join(__dirname, '..');

function konfigLaden() {
  const basis = JSON.parse(fs.readFileSync(path.join(WURZEL, 'config.json'), 'utf8'));
  const lokal = path.join(WURZEL, 'config.local.json');
  if (fs.existsSync(lokal)) {
    const l = JSON.parse(fs.readFileSync(lokal, 'utf8'));
    Object.keys(l).forEach((k) => { basis[k] = l[k] && typeof l[k] === 'object' && !Array.isArray(l[k]) ? Object.assign({}, basis[k], l[k]) : l[k]; });
  }
  return basis;
}

function starten(konfig = konfigLaden(), { leise = false } = {}) {
  const protokoll = [];
  const log = (stufe, text) => {
    const zeile = { zeit: new Date().toISOString(), stufe, text };
    protokoll.push(zeile); if (protokoll.length > 200) protokoll.shift();
    if (!leise) console.log(`[${zeile.zeit.slice(11, 19)}] ${stufe.padEnd(7)} ${text}`);
    try { fs.appendFileSync(path.join(datenOrdner, 'protokoll.txt'), `${zeile.zeit} ${stufe} ${text}\n`); } catch (e) { /* egal */ }
  };
  const datenOrdner = path.resolve(WURZEL, konfig.datenOrdner || 'daten');
  const speicher = new Speicher(datenOrdner, { sicherung: konfig.sicherungsOrdner, log });

  bild.schriftenLaden(path.join(WURZEL, 'schriften'));
  bild.schriftenLaden(speicher.schriftenOrdner());

  const kd = konfig.kamera || {};
  const kamera = kd.art === 'digicamcontrol' ? kameraDigicamcontrol(kd.digicamcontrol) : kameraSimulator();
  const dk = konfig.drucker || {};
  const simulation = dk.art !== 'windows';
  const treiber = (dk.namen || ['Drucker 1', 'Drucker 2']).map((n, i) => (simulation
    ? druckerSimulator(`Selphy ${i + 1}`, (dk.simulatorDauerSek || 8) * 1000) : druckerWindows(n, dk.sumatra)));
  const drucker = new DruckerVerwaltung({ treiber, kassette: dk.kassette || 18, dauerMs: (simulation ? dk.simulatorDauerSek || 8 : dk.druckDauerSek || 45) * 1000, papier: speicher.druckerStand() });
  drucker.on('aenderung', () => speicher.druckerStandSetzen(drucker.drucker.map((d) => d.papier)));

  const z = konfig.zeiten || {};
  const ablauf = new Ablauf({
    kamera, drucker, speicher, bild, gestaltung, log,
    knopfTasten: (konfig.knopf || {}).tasten || [],
    zeiten: { ausEinstellungen: true, countdownSek: z.countdownSek || 3, countdownSchritt: 1000, pause: 900, leerlaufWarnung: (z.leerlaufWarnungSek || 35) * 1000, leerlauf: (z.leerlaufSek || 45) * 1000, danke: (z.dankeSek || 4) * 1000, knopfSperre: (konfig.knopf || {}).sperreMs || 1500 },
  });
  kamera.start().then(() => log('info', `Kamera: ${kamera.status().text}`));
  (speicher.einstellungen().druckerAus || []).forEach((i) => drucker.ausSetzen(i, true));

  // ---------- Livebild als MJPEG-Strom; ein Bild pro Takt für alle Empfänger ----------
  const empfaenger = new Set();
  let letztesBild = null, liveLaeuft = false;
  async function liveSchleife() {
    if (liveLaeuft) return; liveLaeuft = true;
    while (empfaenger.size) {
      try {
        letztesBild = await kamera.livebild();
        empfaenger.forEach((res) => { res.write(`--bild\r\nContent-Type: image/jpeg\r\nContent-Length: ${letztesBild.length}\r\n\r\n`); res.write(letztesBild); res.write('\r\n'); });
      } catch (e) { /* Kamera gerade nicht bereit */ }
      await new Promise((r) => setTimeout(r, 80));
    }
    liveLaeuft = false;
  }

  // ---------- HTTP ----------
  const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const SEITEN = { '/ipad': 'ipad.html', '/buehne': 'buehne.html', '/service': 'service.html', '/simulator': 'simulator.html' };
  const datei = (res, pfad, extra) => fs.readFile(pfad, (err, d) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, Object.assign({ 'Content-Type': TYPEN[path.extname(pfad).toLowerCase()] || 'application/octet-stream' }, extra || {}));
    res.end(d);
  });
  const json = (res, code, wert) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(wert)); };
  const aktuellePin = () => speicher.einstellungen().pin || String(konfig.pin); // im Service änderbar, sonst aus config.json
  const pinOk = (url) => url.searchParams.get('pin') === aktuellePin();
  const sicher = (basis, teil) => { const p = path.resolve(basis, '.' + path.sep + teil); return p.startsWith(basis + path.sep) ? p : null; };

  // Download-Seite fürs Handy der Gäste (Link aus dem QR-Code). Nur mit dem richtigen Schlüssel.
  function downloadSeite(res, foto, k) {
    const e = speicher.einstellungen(), g = gestaltung(e).css;
    const ok = foto && foto.behalten !== undefined && (!foto.schluessel || foto.schluessel === k);
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    res.writeHead(ok ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Euer Foto – ${esc(e.namen)}</title><link rel="stylesheet" href="/web/app.css">
<style>:root{${Object.entries(g).map(([a, b]) => `${a}:${b}`).join(';')}} body{padding:24px 16px 40px;text-align:center;display:flex;flex-direction:column;gap:18px;align-items:center}
h1{font-family:var(--namen);font-weight:400;font-size:44px} img{max-width:100%;border-radius:4px;box-shadow:0 20px 40px -20px #000} p{color:var(--leise);line-height:1.5;max-width:34ch}</style></head>
<body><h1>${esc(e.namen)}</h1>${ok ? `<img src="/fotos/${foto.id}/druck.jpg" alt="Euer Foto aus der Fotobox">
<a class="btn btn-haupt" href="/fotos/${foto.id}/druck.jpg?laden=1">Foto speichern</a>
<p>Klappt der Knopf nicht: lange auf das Foto drücken und „In Fotos sichern“ wählen.</p>` : '<p>Dieses Foto gibt es nicht (mehr). Fragt bitte das Brautpaar.</p>'}
<p>${esc(e.datum)}</p></body></html>`);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fotobox');
    let p;
    try { p = decodeURIComponent(url.pathname); } catch (e) { return json(res, 400, { fehler: 'Ungültige Adresse' }); }
    if (p === '/') { res.writeHead(302, { Location: '/ipad' }); return res.end(); }
    if (SEITEN[p]) return datei(res, path.join(WURZEL, 'web', SEITEN[p]), { 'Cache-Control': 'no-store' });
    if (p.startsWith('/web/')) { const d = sicher(path.join(WURZEL, 'web'), p.slice(5)); return d ? datei(res, d) : json(res, 404, {}); }
    if (p.startsWith('/schriften/')) {
      const name = p.slice(11);
      const d = sicher(path.join(WURZEL, 'schriften'), name) || null;
      if (d && fs.existsSync(d)) return datei(res, d, { 'Cache-Control': 'max-age=86400' });
      const e = sicher(speicher.schriftenOrdner(), name);
      return e ? datei(res, e) : json(res, 404, {});
    }
    if (p === '/live.mjpg') {
      res.writeHead(200, { 'Content-Type': 'multipart/x-mixed-replace; boundary=bild', 'Cache-Control': 'no-store', Connection: 'close' });
      empfaenger.add(res); req.on('close', () => empfaenger.delete(res)); liveSchleife();
      return;
    }
    if (p === '/live.jpg') {
      return kamera.livebild().then((b) => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }); res.end(b); }, () => json(res, 503, { fehler: 'Kein Livebild' }));
    }
    let m = /^\/fotos\/([\w-]+)\/druck\.jpg$/.exec(p);
    if (m && speicher.foto(m[1])) {
      const laden = url.searchParams.get('laden') === '1';
      return datei(res, speicher.druckDatei(m[1]), laden ? { 'Content-Disposition': `attachment; filename="fotobox-${m[1]}.jpg"` } : { 'Cache-Control': 'max-age=3600' });
    }
    m = /^\/fotos\/([\w-]+)\/unterschrift\.png$/.exec(p);
    if (m && speicher.foto(m[1])) return datei(res, speicher.unterschriftDatei(m[1]));
    m = /^\/eigene\/([\w.-]+)$/.exec(p);
    if (m && speicher.eigene().includes(m[1])) return datei(res, path.join(speicher.eigeneOrdner(), m[1]), { 'Cache-Control': 'max-age=3600' });
    m = /^\/f\/([\w-]+)$/.exec(p);
    if (m) return downloadSeite(res, speicher.foto(m[1]), url.searchParams.get('k'));
    if (p === '/api/qr') { // QR-Code als SVG für einen Text (Foto-Link oder WLAN-Zugang)
      const t = (url.searchParams.get('t') || '').slice(0, 500);
      try { const q = qrcode(0, 'M'); q.addData(t); q.make(); res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=3600' }); return res.end(q.createSvgTag({ cellSize: 8, margin: 2, scalable: true })); } catch (e) { return json(res, 400, { fehler: 'Text zu lang für einen QR-Code' }); }
    }
    if (p === '/api/gaeste') return json(res, 200, speicher.gaeste().map((g) => ({ id: g.id, name: g.name, tisch: g.tisch }))); // fürs Gästebuch am iPad
    if (p === '/api/diashow') return json(res, 200, speicher.diashow());
    if (p === '/api/schriften') {
      const eigene = fs.readdirSync(speicher.schriftenOrdner()).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)).map((f) => ({ name: f.replace(/\.[^.]+$/, ''), datei: f }));
      return json(res, 200, { eigene });
    }
    if (p === '/api/service') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      return speicher.platz().then((platz) => json(res, 200, {
        einstellungen: speicher.einstellungen(), farbwelten: FARBWELTEN, schriftstile: SCHRIFTSTILE, platz,
        logo: !!speicher.logo(), knopfStandard: (konfig.knopf || {}).tasten || [], layouts: bild.LAYOUTS || {}, filter: bild.FILTER || {},
        eigene: speicher.eigene(), statistik: speicher.statistik(), dankeskarten: speicher.dankeskarten(),
        gaesteListe: speicher.gaeste().map((g) => ({ id: g.id, name: g.name, tisch: g.tisch })), basisUrl: ablauf.basisUrl,
        abzuegeBisher: speicher.fotos().reduce((a, f) => a + (f.abzuege || 0), 0),
        fotos: speicher.fotos().filter((f) => f.behalten).reverse(), gaeste: speicher.gaeste().length,
        protokoll: protokoll.slice(-30).reverse(), simulation: { kamera: kamera.name === 'Simulator', drucker: simulation },
      }));
    }
    if (p === '/api/logo' && req.method === 'GET') {
      const l = speicher.logo(); if (!l) return json(res, 404, {});
      res.writeHead(200, { 'Content-Type': l[0] === 0x89 ? 'image/png' : 'image/jpeg', 'Cache-Control': 'no-store' }); return res.end(l);
    }
    if (p === '/api/logo' && req.method === 'POST') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      const teile = []; let groesse = 0;
      req.on('data', (d) => { groesse += d.length; if (groesse <= 5e6) teile.push(d); });
      req.on('end', () => {
        const b = Buffer.concat(teile);
        const png = b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), jpg = b[0] === 0xff && b[1] === 0xd8;
        if (groesse > 5e6 || !(png || jpg)) return json(res, 400, { fehler: 'Bitte ein PNG- oder JPG-Bild bis 5 MB hochladen.' });
        speicher.logoSetzen(b); log('info', 'Logo hochgeladen'); broadcast(); json(res, 200, { ok: true });
      });
      return;
    }
    if (p === '/api/eigene' && req.method === 'POST') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      const teile = []; let groesse = 0;
      req.on('data', (d) => { groesse += d.length; if (groesse <= 15e6) teile.push(d); });
      req.on('end', () => {
        const b = Buffer.concat(teile);
        const png = b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), jpg = b[0] === 0xff && b[1] === 0xd8;
        if (groesse > 15e6 || !(png || jpg)) return json(res, 400, { fehler: 'Bitte JPG- oder PNG-Bilder bis 15 MB hochladen.' });
        const d = speicher.eigenesSpeichern(b, png ? 'png' : 'jpg'); log('info', `Eigenes Foto für die Diashow: ${d}`);
        ablauf.einstellungenGeaendert(); json(res, 200, { datei: d });
      });
      return;
    }
    if (p === '/api/dankeskarten.csv') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="dankeskarten.csv"' });
      return res.end(speicher.dankeskartenCsv());
    }
    if (p === '/api/export.zip') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      const sortierung = ['zeit', 'tisch', 'gast'].includes(url.searchParams.get('sort')) ? url.searchParams.get('sort') : 'zeit';
      return speicher.exportZip(sortierung).then((b) => {
        res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="fotobox-fotos-${sortierung}.zip"` }); res.end(b);
      }, (e) => json(res, 500, { fehler: e.message }));
    }
    if (p === '/api/import' && req.method === 'POST') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      const teile = [];
      req.on('data', (d) => teile.push(d));
      req.on('end', () => {
        try {
          const im = sitzplanLesen(Buffer.concat(teile).toString('utf8'));
          im.schriften.forEach((s) => speicher.schriftSpeichern(s.name, s.endung, s.daten));
          bild.schriftenLaden(speicher.schriftenOrdner());
          const neu = {};
          if (im.namen) neu.namen = im.namen;
          if (im.datum) neu.datum = im.datum;
          if (FARBWELTEN[im.farbwelt]) neu.farbwelt = im.farbwelt;
          neu.akzent = im.akzent || '';
          if (SCHRIFTSTILE[im.schriftstil]) neu.schriftstil = im.schriftstil;
          speicher.einstellungenSetzen(neu);
          speicher.gaesteSetzen(im.gaeste);
          log('info', `Import: ${im.gaeste.length} Gäste, ${im.tische.length} Tische, ${im.schriften.length} eigene Schriften`);
          broadcast();
          json(res, 200, { gaeste: im.gaeste.length, tische: im.tische.length, schriften: im.schriften.map((s) => s.name), namen: im.namen, datum: im.datum });
        } catch (e) { json(res, 400, { fehler: e.message }); }
      });
      return;
    }
    json(res, 404, { fehler: 'Nicht gefunden' });
  });

  // ---------- WebSocket: Zustand an alle, Aktionen vom iPad, Admin-Aktionen mit PIN ----------
  const wss = new WebSocketServer({ server, path: '/ws' });
  let geplant = null;
  function broadcast() {
    if (geplant) return;
    geplant = setTimeout(() => {
      geplant = null;
      const text = JSON.stringify({ typ: 'zustand', zustand: ablauf.zustand() });
      wss.clients.forEach((c) => { if (c.readyState === 1) c.send(text); });
    }, 30);
  }
  ablauf.on('aenderung', broadcast);

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ typ: 'zustand', zustand: ablauf.zustand() }));
    ws.on('message', (roh) => {
      let n; try { n = JSON.parse(roh); } catch (e) { return; }
      if (n.typ === 'aktion') return ablauf.aktion(n.aktion, n.daten);
      if (n.typ === 'knopfGelernt') return ablauf.knopfGelernt(n.taste);
      if (n.typ !== 'admin') return;
      if (String(n.pin) !== aktuellePin()) return ws.send(JSON.stringify({ typ: 'antwort', ok: false, fehler: 'Falsche PIN' }));
      const d = n.daten || {};
      switch (n.aktion) {
        case 'kassette': drucker.kassetteGetauscht(d.i); log('info', `Kassette getauscht: Drucker ${d.i + 1}`); break;
        case 'fehlerBehoben': drucker.fehlerBehoben(d.i); log('info', `Fehler behoben: Drucker ${d.i + 1}`); break;
        case 'einstellungen': speicher.einstellungenSetzen(d); ablauf.einstellungenGeaendert(); log('info', 'Einstellungen geändert'); break;
        case 'pause': speicher.einstellungenSetzen({ pause: !!d.an }); ablauf.einstellungenGeaendert(); log('info', `Pause ${d.an ? 'an' : 'aus'}`); break;
        case 'druckerAus': {
          const aus = new Set(speicher.einstellungen().druckerAus); if (d.aus) aus.add(d.i); else aus.delete(d.i);
          speicher.einstellungenSetzen({ druckerAus: [...aus] }); drucker.ausSetzen(d.i, d.aus); log('info', `Drucker ${d.i + 1} ${d.aus ? 'abgeschaltet' : 'eingeschaltet'}`); break;
        }
        case 'freigeben': ablauf.fotoFreigeben(d.id, d.frei); break;
        case 'knopfLernen': ablauf.knopfLernen(); log('info', 'Knopf anlernen: warte auf Tastendruck'); break;
        case 'knopfZuruecksetzen': speicher.einstellungenSetzen({ knopfGelernt: [] }); log('info', 'Angelernte Knopf-Tasten gelöscht'); break;
        case 'logoLoeschen': speicher.logoSetzen(null); log('info', 'Logo gelöscht'); break;
        case 'eigeneLoeschen': speicher.eigenesLoeschen(String(d.datei || '')); ablauf.einstellungenGeaendert(); log('info', 'Eigenes Foto gelöscht'); break;
        case 'ausblenden': ablauf.fotoAusblenden(d.id, d.aus); break;
        case 'nachdrucken': ablauf.nachdrucken(d.id); log('info', `Nachdruck ${d.id}`); break;
        case 'zumStart': ablauf.zumStart(); break;
        case 'simKamera': if (kamera.name === 'Simulator') { kamera.fehlerSetzen(d.fehler ? 'Kamera antwortet nicht (simuliert)' : null); log('info', `Simulator: Kamera ${d.fehler ? 'gestört' : 'wieder ok'}`); } break;
        case 'simDrucker': if (simulation && treiber[d.i]) { treiber[d.i].fehlerSetzen('Papierstau (simuliert)'); log('info', `Simulator: Drucker ${d.i + 1} hat beim nächsten Druck einen Papierstau`); } break;
        default: return;
      }
      ws.send(JSON.stringify({ typ: 'antwort', ok: true, aktion: n.aktion }));
      broadcast();
    });
  });

  return new Promise((ok) => server.listen(konfig.port, () => {
    const adressen = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
    const port = server.address().port;
    ablauf.basisUrl = `http://${adressen[0] || 'localhost'}:${port}`; // für den QR-Code; im Service überschreibbar
    log('info', `Fotobox läuft auf Port ${port} (Kamera: ${kamera.name}, Drucker: ${simulation ? 'Simulator' : 'Windows'})`);
    if (!leise) {
      console.log(`\n  Großer Bildschirm:  http://localhost:${port}/buehne`);
      adressen.forEach((a) => console.log(`  iPad:               http://${a}:${port}/ipad\n  Service (Handy):    http://${a}:${port}/service`));
      console.log(`  Simulator:          http://localhost:${port}/simulator\n`);
    }
    ok({ server, port, ablauf, drucker, kamera, speicher, beenden: () => new Promise((r) => { ablauf.beenden(); drucker.beenden(); wss.close(); empfaenger.forEach((x) => x.end()); server.close(r); }) });
  }));
}

if (require.main === module) {
  starten().catch((e) => { console.error(e); process.exit(1); });
  // Nie wegen eines einzelnen Fehlers abstürzen: protokollieren und weiterlaufen
  process.on('uncaughtException', (e) => console.error('Unerwarteter Fehler:', e));
  process.on('unhandledRejection', (e) => console.error('Unerwarteter Fehler:', e));
}

module.exports = { starten, konfigLaden };
