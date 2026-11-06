/*
 * Test: Während die eigenen Abzüge noch drucken, springt die Fotobox nicht wegen Leerlauf zum Start zurück.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Ablauf } = require('../server/ablauf');
const { Speicher } = require('../server/speicher');
const { DruckerVerwaltung } = require('../server/drucker/verwaltung');
const { druckerSimulator } = require('../server/drucker/treiber');
const { kameraSimulator } = require('../server/kamera/simulator');
const bild = require('../server/bild');
const { gestaltung } = require('../server/gestaltung');

const ZEITEN = { countdownSek: 1, countdownSchritt: 10, pause: 10, leerlaufWarnung: 200, leerlauf: 300, danke: 100, knopfSperre: 0, takt: 50 };

function warteAuf(ablauf, pred, ms = 8000) {
  return new Promise((ok, nein) => {
    const pruefen = () => { const z = ablauf.zustand(); if (pred(z)) { aufraeumen(); ok(z); } };
    const t = setInterval(pruefen, 20), ende = setTimeout(() => { aufraeumen(); nein(new Error('Zeit abgelaufen')); }, ms);
    const aufraeumen = () => { clearInterval(t); clearTimeout(ende); ablauf.off('aenderung', pruefen); };
    ablauf.on('aenderung', pruefen);
  });
}

(async () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-leerlauf-'));
  const speicher = new Speicher(ordner);
  const drucker = new DruckerVerwaltung({ treiber: [druckerSimulator('Selphy 1', 1200), druckerSimulator('Selphy 2', 1200)], kassette: 18, dauerMs: 1200 });
  const ablauf = new Ablauf({ kamera: kameraSimulator(), drucker, speicher, bild, gestaltung, zeiten: ZEITEN });
  try {
    ablauf.aktion('knopf');
    await warteAuf(ablauf, (z) => z.ansicht === 'vorschau');
    ablauf.aktion('weiter');
    ablauf.aktion('drucken');
    await warteAuf(ablauf, (z) => z.auftraege.length === 1);
    await new Promise((r) => setTimeout(r, 700)); // länger als der Leerlauf (300 ms), Druck dauert 1200 ms
    assert.equal(ablauf.zustand().ansicht, 'drucken', 'darf während des Drucks nicht zum Start springen');
    await warteAuf(ablauf, (z) => z.ansicht === 'start'); // nach dem Druck greift der Leerlauf wieder
    console.log('ok – Leerlauf wartet, bis die eigenen Abzüge gedruckt sind');
  } catch (e) {
    console.error('FEHLER –', e.message); process.exitCode = 1;
  } finally {
    ablauf.beenden(); drucker.beenden(); fs.rmSync(ordner, { recursive: true, force: true });
  }
})();
