/*
 * Test für server/drucker/verwaltung.js mit zwei Drucker-Simulatoren (server/drucker/treiber.js).
 * Start: node tools/test-drucker.js
 */
'use strict';
const assert = require('node:assert/strict');
const { DruckerVerwaltung } = require('../server/drucker/verwaltung');
const { druckerSimulator } = require('../server/drucker/treiber');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

// Zwei Drucker mit gleicher Kassette, Druckdauer 50 ms
function aufbauen(kassette = 5, papier) {
  const treiber = [druckerSimulator('Drucker A', 50), druckerSimulator('Drucker B', 50)];
  const verwaltung = new DruckerVerwaltung({ treiber, kassette, dauerMs: 50, papier });
  return { treiber, verwaltung };
}

test('Drucken verteilt auf beide Drucker, Papier sinkt, alle Aufträge werden fertig', async () => {
  const { verwaltung } = aufbauen(5);
  try {
    const neu = verwaltung.drucken('datei.jpg', 3, 'f1');
    assert.equal(neu.length, 3);
    const alle = verwaltung.auftraegeZu('f1');
    assert.equal(alle.length, 3);
    const namen = new Set(alle.map((a) => a.drucker));
    assert.ok(namen.has('Drucker A'), 'Drucker A bekommt keinen Auftrag');
    assert.ok(namen.has('Drucker B'), 'Drucker B bekommt keinen Auftrag');
    assert.equal(verwaltung.papierGesamt(), 7);

    await warte(400);
    assert.ok(verwaltung.auftraegeZu('f1').every((a) => a.status === 'fertig'), 'nicht alle Aufträge fertig');
    assert.ok(verwaltung.auftraegeZu('f1').every((a) => a.fortschritt === 100));
  } finally {
    verwaltung.beenden();
  }
});

test('Probedruck gezielt auf einem Drucker; abgeschaltet, gestört oder leer → kein Auftrag', async () => {
  const { treiber, verwaltung } = aufbauen(2);
  try {
    const a = verwaltung.druckenAuf(1, 'probe.jpg', 'probedruck');
    assert.equal(a.length, 1); assert.equal(a[0].drucker, 'Drucker B');
    assert.equal(verwaltung.uebersicht()[1].papier, 1); assert.equal(verwaltung.uebersicht()[0].papier, 2);
    await warte(200);
    assert.equal(verwaltung.auftraegeZu('probedruck')[0].status, 'fertig');
    verwaltung.ausSetzen(0, true);
    assert.deepEqual(verwaltung.druckenAuf(0, 'probe.jpg', 'probedruck'), []);
    verwaltung.ausSetzen(0, false);
    verwaltung.druckenAuf(1, 'probe.jpg', 'probedruck'); await warte(200);
    assert.deepEqual(verwaltung.druckenAuf(1, 'probe.jpg', 'probedruck'), [], 'Drucker B hat kein Papier mehr');
    treiber[0].fehlerSetzen('Stau'); verwaltung.druckenAuf(0, 'probe.jpg', 'probedruck'); await warte(200);
    assert.deepEqual(verwaltung.druckenAuf(0, 'probe.jpg', 'probedruck'), [], 'Drucker A ist gestört');
    assert.deepEqual(verwaltung.druckenAuf(5, 'probe.jpg', 'probedruck'), [], 'unbekannter Drucker');
  } finally {
    verwaltung.beenden();
  }
});

test('Papier geht aus: nur so viele Abzüge wie Papier da ist, danach 0, Kassette wechseln stellt wieder her', async () => {
  const { verwaltung } = aufbauen(2);
  try {
    assert.equal(verwaltung.papierGesamt(), 4);
    const neu = verwaltung.drucken('datei.jpg', 6, 'f2');
    assert.equal(neu.length, 4, 'es wurden nicht genau 4 Abzüge angenommen');
    assert.equal(verwaltung.papierGesamt(), 0);
    assert.equal(verwaltung.drucken('datei.jpg', 1, 'f3').length, 0, 'ohne Papier darf nichts gedruckt werden');

    verwaltung.kassetteGetauscht(0);
    assert.equal(verwaltung.papierGesamt(), 2, 'nach Kassettenwechsel fehlt Papier');
    assert.equal(verwaltung.uebersicht()[0].papier, 2);
    await warte(300);
  } finally {
    verwaltung.beenden();
  }
});

test('Druckerfehler: Drucker fällt aus, Auftrag wird auf den anderen Drucker umgeleitet', async () => {
  const { treiber, verwaltung } = aufbauen(5);
  try {
    treiber[0].fehlerSetzen('Papierstau');
    const neu = verwaltung.drucken('datei.jpg', 1, 'f3');
    assert.equal(neu.length, 1);

    await warte(400);
    const uebersicht = verwaltung.uebersicht();
    assert.equal(uebersicht[0].status, 'fehler', 'Drucker A sollte im Fehlerzustand sein');
    assert.equal(uebersicht[0].fehler, 'Papierstau');

    const [auftrag] = verwaltung.auftraegeZu('f3');
    assert.equal(auftrag.status, 'fertig', 'Auftrag wurde nicht fertig');
    assert.equal(auftrag.drucker, 'Drucker B', 'Auftrag wurde nicht auf Drucker B umgeleitet');

    // Papier zählt nur Drucker ohne Fehler: Drucker B hat 5 − 1 = 4
    assert.equal(verwaltung.papierGesamt(), 4);

    verwaltung.fehlerBehoben(0);
    assert.notEqual(verwaltung.uebersicht()[0].status, 'fehler', 'Fehler nach „behoben“ noch aktiv');
    assert.equal(verwaltung.uebersicht()[0].fehler, null);
    assert.equal(verwaltung.papierGesamt(), 9, 'nach Fehler behoben zählt Drucker A wieder mit');
  } finally {
    verwaltung.beenden();
  }
});

(async () => {
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`ok – ${t.name}`);
    } catch (e) {
      console.error(`FEHLER – ${t.name}`);
      console.error(e);
      process.exit(1);
    }
  }
})();
