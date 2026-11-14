/*
 * Test Upload zur Online-Gästeseite (server/online.js) gegen einen nachgebauten Server mit der Schnittstelle
 * des Sitzplantools (fotobox_list, fotobox_upload, fotobox_delete).
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { Speicher } = require('../server/speicher');
const online = require('../server/online');

const SCHLUESSEL = 'a'.repeat(32);

function nachbau() {
  const fotos = new Map(), log = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x'), a = u.searchParams.get('a');
    const antwort = (code, d) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d)); };
    const teile = [];
    req.on('data', (d) => teile.push(d));
    req.on('end', () => {
      const body = teile.length ? JSON.parse(Buffer.concat(teile).toString()) : {};
      const f = req.method === 'GET' ? u.searchParams.get('f') : body.f;
      if (f !== SCHLUESSEL) return antwort(403, { ok: false, code: 'bad_token', error: 'Falscher Schlüssel.' });
      log.push(a);
      if (a === 'fotobox_list') return antwort(200, { ok: true, photos: [...fotos.entries()].map(([id, p]) => ({ id, codes: p.codes })), limit: 1000, used: fotos.size });
      if (a === 'fotobox_upload') {
        if (!fotos.has(body.id) && !body.bild) return antwort(400, { ok: false, code: 'bad_image', error: 'Bild fehlt.' });
        fotos.set(body.id, { codes: body.codes, bild: body.bild || (fotos.get(body.id) || {}).bild });
        return antwort(200, { ok: true, photo: { id: body.id, codes: body.codes } });
      }
      if (a === 'fotobox_delete') { fotos.delete(body.id); return antwort(200, { ok: true }); }
      antwort(404, { ok: false, code: 'unknown_action', error: 'Unbekannte Aktion.' });
    });
  });
  return new Promise((ok) => server.listen(0, () => ok({ server, fotos, log, adresse: `http://127.0.0.1:${server.address().port}/sitzplan/` })));
}

async function fotoAnlegen(speicher, personen, teil = {}) {
  const f = await speicher.neuesFoto({ modus: 'einzel', filter: 'farbe', aufnahmen: [Buffer.from('a')], druck: Buffer.from('JPEGDATEN') });
  speicher.fotoAendern(f.id, Object.assign({ behalten: true }, teil));
  speicher.personenSetzen(f.id, personen);
  await new Promise((r) => setTimeout(r, 5)); // eindeutige Zeitstempel nicht nötig, Reihenfolge reicht
  return speicher.foto(f.id);
}

(async () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-online-'));
  const s = await nachbau();
  try {
    const speicher = new Speicher(ordner);
    speicher.gaesteSetzen([
      { id: 'g1', name: 'Anna Berg', einladung: 'HAUS1111' }, { id: 'g2', name: 'Ben Berg', einladung: 'HAUS1111' },
      { id: 'g3', name: 'Clara Lang', einladung: 'HAUS2222' }, { id: 'g4', name: 'Dora ohne Einladung', einladung: '' },
    ]);
    const f1 = await fotoAnlegen(speicher, ['g1', 'g2', 'g3']);
    const f2 = await fotoAnlegen(speicher, ['g4']); // nur Gast ohne Einladung → bleibt lokal
    const f3 = await fotoAnlegen(speicher, ['g3'], { ausgeblendet: true }); // ausgeblendet → nicht hoch
    const zugang = { speicher, adresse: s.adresse, schluessel: SCHLUESSEL };

    assert.deepEqual(online.codesVon(speicher, f1), ['HAUS1111', 'HAUS2222']);
    const p = await online.pruefen(zugang);
    assert.equal(p.ok, true); assert.equal(p.fotos, 0);
    assert.equal((await online.pruefen(Object.assign({}, zugang, { schluessel: 'b'.repeat(32) }))).ok, false);
    console.log('ok – Verbindung prüfen (richtiger und falscher Schlüssel)');

    let e = await online.abgleichen(zugang);
    assert.deepEqual([e.hochgeladen, e.aktualisiert, e.geloescht, e.ohneZuordnung, e.fehler.length], [1, 0, 0, 1, 0]);
    assert.deepEqual(s.fotos.get(f1.id).codes, ['HAUS1111', 'HAUS2222']);
    assert.match(s.fotos.get(f1.id).bild, /^data:image\/jpeg;base64,/);
    assert.ok(!s.fotos.has(f2.id) && !s.fotos.has(f3.id));
    assert.ok(speicher.foto(f1.id).online, 'Upload wird am Foto vermerkt');
    console.log('ok – erster Abgleich: nur zugeordnete, sichtbare Fotos mit den Codes der Haushalte');

    e = await online.abgleichen(zugang);
    assert.deepEqual([e.hochgeladen, e.aktualisiert, e.geloescht], [0, 0, 0]);
    console.log('ok – zweiter Abgleich ohne Änderung lädt nichts erneut hoch');

    speicher.personenSetzen(f1.id, ['g1']);
    s.log.length = 0;
    e = await online.abgleichen(zugang);
    assert.equal(e.aktualisiert, 1);
    assert.deepEqual(s.fotos.get(f1.id).codes, ['HAUS1111']);
    console.log('ok – geänderte Zuordnung aktualisiert nur die Codes');

    speicher.fotoAendern(f1.id, { ausgeblendet: true });
    e = await online.abgleichen(zugang);
    assert.equal(e.geloescht, 1); assert.equal(s.fotos.size, 0);
    console.log('ok – ausgeblendetes Foto wird online gelöscht');

    e = await online.abgleichen(Object.assign({}, zugang, { adresse: '' }));
    assert.equal(e.fehler.length, 1);
    console.log('ok – ohne Adresse eine verständliche Fehlermeldung');
  } catch (err) {
    console.error('FEHLER –', err.message); process.exitCode = 1;
  } finally {
    s.server.close(); fs.rmSync(ordner, { recursive: true, force: true });
  }
})();
