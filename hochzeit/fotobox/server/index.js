/*
 * Fotobox-Server: startet Kamera, Drucker, Speicher und Ablauf und liefert die Seiten aus.
 *   /ipad        Bedienung für die Gäste
 *   /buehne      großer Bildschirm (am Mini-PC im Vollbild)
 *   /service     Service und Admin (Handy), Aktionen mit PIN
 *   /simulator   iPad und großer Bildschirm nebeneinander, Knopf und Störungen zum Ausprobieren
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
    zeiten: { countdownSek: z.countdownSek || 3, countdownSchritt: 1000, pause: 900, leerlaufWarnung: (z.leerlaufWarnungSek || 35) * 1000, leerlauf: (z.leerlaufSek || 45) * 1000, danke: (z.dankeSek || 4) * 1000, knopfSperre: (konfig.knopf || {}).sperreMs || 1500 },
  });
  kamera.start().then(() => log('info', `Kamera: ${kamera.status().text}`));

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
  const pinOk = (url) => url.searchParams.get('pin') === String(konfig.pin);
  const sicher = (basis, teil) => { const p = path.resolve(basis, '.' + path.sep + teil); return p.startsWith(basis + path.sep) ? p : null; };

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
    if (m && speicher.foto(m[1])) return datei(res, speicher.druckDatei(m[1]), { 'Cache-Control': 'max-age=3600' });
    if (p === '/api/diashow') return json(res, 200, speicher.diashow());
    if (p === '/api/schriften') {
      const eigene = fs.readdirSync(speicher.schriftenOrdner()).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)).map((f) => ({ name: f.replace(/\.[^.]+$/, ''), datei: f }));
      return json(res, 200, { eigene });
    }
    if (p === '/api/service') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      return json(res, 200, {
        einstellungen: speicher.einstellungen(), farbwelten: FARBWELTEN, schriftstile: SCHRIFTSTILE,
        fotos: speicher.fotos().filter((f) => f.behalten).reverse(), gaeste: speicher.gaeste().length,
        protokoll: protokoll.slice(-30).reverse(), simulation: { kamera: kamera.name === 'Simulator', drucker: simulation },
      });
    }
    if (p === '/api/export.zip') {
      if (!pinOk(url)) return json(res, 403, { fehler: 'Falsche PIN' });
      return speicher.exportZip().then((b) => {
        res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="fotobox-fotos.zip"' }); res.end(b);
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
    ws.send(JSON.stringify({ typ: 'zustand', zustand: ablauf.zustand(), knopfTasten: (konfig.knopf || {}).tasten || [] }));
    ws.on('message', (roh) => {
      let n; try { n = JSON.parse(roh); } catch (e) { return; }
      if (n.typ === 'aktion') return ablauf.aktion(n.aktion, n.daten);
      if (n.typ !== 'admin') return;
      if (String(n.pin) !== String(konfig.pin)) return ws.send(JSON.stringify({ typ: 'antwort', ok: false, fehler: 'Falsche PIN' }));
      const d = n.daten || {};
      switch (n.aktion) {
        case 'kassette': drucker.kassetteGetauscht(d.i); log('info', `Kassette getauscht: Drucker ${d.i + 1}`); break;
        case 'fehlerBehoben': drucker.fehlerBehoben(d.i); log('info', `Fehler behoben: Drucker ${d.i + 1}`); break;
        case 'einstellungen': speicher.einstellungenSetzen(d); log('info', 'Einstellungen geändert'); break;
        case 'ausblenden': ablauf.fotoAusblenden(d.id, d.aus); break;
        case 'nachdrucken': ablauf.nachdrucken(d.id); log('info', `Nachdruck ${d.id}`); break;
        case 'zumStart': ablauf._zeige('start', ablauf._grundzustand()); break;
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
