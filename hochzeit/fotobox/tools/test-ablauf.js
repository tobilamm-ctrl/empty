/*
 * Integrationstest für server/ablauf.js: Ablauf mit echtem Speicher (Temp-Ordner), Kamera-Simulator,
 * zwei Drucker-Simulatoren, Bildbearbeitung und Gestaltung. Die Zeiten sind verkürzt, damit der Test schnell läuft.
 * Start: node tools/test-ablauf.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadImage } = require('@napi-rs/canvas');
const { Ablauf } = require('../server/ablauf');
const { Speicher } = require('../server/speicher');
const { DruckerVerwaltung } = require('../server/drucker/verwaltung');
const { druckerSimulator } = require('../server/drucker/treiber');
const { kameraSimulator } = require('../server/kamera/simulator');
const bild = require('../server/bild');
const { gestaltung } = require('../server/gestaltung');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const ZEITEN = { countdownSek: 2, countdownSchritt: 20, pause: 10, leerlaufWarnung: 300, leerlauf: 600, danke: 100, knopfSperre: 0, takt: 50 };

// Wartet, bis pred(zustand) wahr ist (bei jeder Änderung und zusätzlich alle 20 ms), sonst Fehler nach ms
function warteAuf(ablauf, pred, ms = 5000) {
  return new Promise((ok, nein) => {
    let timer, poll, letzt = null;
    const aufraeumen = () => { clearTimeout(timer); clearInterval(poll); ablauf.removeListener('aenderung', pruefe); };
    const pruefe = () => {
      try {
        letzt = ablauf.zustand();
        if (pred(letzt)) { aufraeumen(); ok(letzt); }
      } catch (e) { aufraeumen(); nein(e); }
    };
    timer = setTimeout(() => {
      aufraeumen();
      nein(new Error(`Zeitüberschreitung nach ${ms} ms (Ansicht zuletzt: ${letzt && letzt.ansicht})`));
    }, ms);
    poll = setInterval(pruefe, 20);
    ablauf.on('aenderung', pruefe);
    pruefe();
  });
}

// Ansicht abwarten
const warteAnsicht = (ablauf, ansicht, ms) => warteAuf(ablauf, (z) => z.ansicht === ansicht, ms);

// Liest die Abmessungen einer JPEG-Datei (prüft zuerst die JPEG-Kennung)
async function jpegMasse(datei) {
  const daten = fs.readFileSync(datei);
  assert.equal(daten[0], 0xff, `${datei} ist kein JPEG`);
  assert.equal(daten[1], 0xd8, `${datei} ist kein JPEG`);
  const img = await loadImage(daten);
  return { breite: img.width, hoehe: img.height };
}

// Kompletter Aufbau pro Testfall: eigener Temp-Ordner, echter Speicher, Simulatoren
function aufbauen() {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-ablauf-'));
  const speicher = new Speicher(ordner);
  const kamera = kameraSimulator();
  const drucker = new DruckerVerwaltung({
    treiber: [druckerSimulator('Drucker A', 30), druckerSimulator('Drucker B', 30)],
    dauerMs: 30,
  });
  const ablauf = new Ablauf({ kamera, drucker, speicher, bild, gestaltung, zeiten: ZEITEN });
  return {
    ordner, speicher, kamera, drucker, ablauf,
    aufraeumen() {
      ablauf.beenden();
      drucker.beenden();
      fs.rmSync(ordner, { recursive: true, force: true });
    },
  };
}

test('kompletter Ablauf: Streifen mit Schwarzweiß, nochmal, Diashow-Freigabe, drucken, danke', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;

    ablauf.aktion('start');
    assert.equal(ablauf.zustand().ansicht, 'modus');

    ablauf.aktion('modus', 'streifen');
    assert.equal(ablauf.zustand().ansicht, 'filter');

    ablauf.aktion('filter', 'sw');
    assert.equal(ablauf.zustand().ansicht, 'aufnahme');
    const vorschau = await warteAnsicht(ablauf, 'vorschau');
    const id = vorschau.foto.id;
    assert.match(vorschau.foto.url, /^\/fotos\/.+\/druck\.jpg$/);
    assert.equal(vorschau.foto.url, `/fotos/${id}/druck.jpg`);

    const druckDatei = speicher.druckDatei(id);
    assert.ok(fs.existsSync(druckDatei), 'druck.jpg fehlt');
    assert.deepEqual(await jpegMasse(druckDatei), { breite: 1200, hoehe: 1800 });
    assert.equal(speicher.foto(id).behalten, false, 'frisches Foto darf noch nicht behalten sein');

    // Nochmal: neues Foto, Zähler sinkt
    const nochmalVorher = ablauf.zustand().nochmal;
    ablauf.aktion('nochmal');
    assert.equal(ablauf.zustand().nochmal, nochmalVorher - 1);
    const zweites = await warteAuf(ablauf, (z) => z.ansicht === 'vorschau' && z.foto && z.foto.id !== id);
    assert.notEqual(zweites.foto.id, id);
    assert.equal(speicher.fotos().length, 2, 'beide Aufnahmen müssen gespeichert sein');

    // Zweites Foto aus der Diashow nehmen und weiter zum Druck
    ablauf.aktion('inDiashow', false);
    assert.equal(ablauf.zustand().inDiashow, false);
    ablauf.aktion('weiter');
    assert.equal(ablauf.zustand().ansicht, 'druck');
    const gewaehlt = speicher.foto(zweites.foto.id);
    assert.equal(gewaehlt.behalten, true);
    assert.equal(gewaehlt.inDiashow, false);

    // Anzahl wird auf maxAbzuege begrenzt
    ablauf.aktion('anzahl', 99);
    const z = ablauf.zustand();
    assert.equal(z.maxAbzuege, 4);
    assert.equal(z.anzahl, 4);

    ablauf.aktion('drucken');
    assert.equal(ablauf.zustand().ansicht, 'drucken');
    assert.equal(ablauf.zustand().auftraege.length, 4);

    await warteAuf(ablauf, (x) => x.auftraege.length === 4 && x.auftraege.every((a) => a.status === 'fertig'));
    assert.equal(speicher.foto(zweites.foto.id).abzuege, 4);

    ablauf.aktion('fertig');
    assert.equal(ablauf.zustand().ansicht, 'danke');
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

test('Bluetooth-Knopf: Einzelbild mit Einstellungen, danach Streifen aus dem Modus-Bildschirm', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;

    // Aus dem Start direkt in die Aufnahme, Modus und Filter aus den Einstellungen
    assert.equal(ablauf.zustand().ansicht, 'start');
    ablauf.aktion('knopf');
    assert.equal(ablauf.zustand().ansicht, 'aufnahme');
    const vorschau = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(ablauf.zustand().modus, 'einzel');
    assert.equal(ablauf.zustand().filter, 'farbe');
    assert.deepEqual(await jpegMasse(speicher.druckDatei(vorschau.foto.id)), { breite: 1800, hoehe: 1200 });

    ablauf.aktion('weiter');
    ablauf.aktion('ohneDruck');
    await warteAnsicht(ablauf, 'start');

    // Knopfmodus „streifen“: aus dem Modus-Bildschirm entstehen vier Aufnahmen
    speicher.einstellungenSetzen({ knopfModus: 'streifen' });
    ablauf.aktion('start');
    assert.equal(ablauf.zustand().ansicht, 'modus');
    ablauf.aktion('knopf');
    assert.equal(ablauf.zustand().ansicht, 'aufnahme');
    const streifen = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(ablauf.zustand().modus, 'streifen');
    assert.deepEqual(await jpegMasse(speicher.druckDatei(streifen.foto.id)), { breite: 1200, hoehe: 1800 });
  } finally {
    t.aufraeumen();
  }
});

test('Leerlauf: aus dem Modus-Bildschirm erst Warnung, dann Rückkehr zum Start', async () => {
  const t = aufbauen();
  try {
    const { ablauf } = t;
    ablauf.aktion('start');
    assert.equal(ablauf.zustand().ansicht, 'modus');

    await warteAuf(ablauf, (z) => typeof z.leerlaufWarnung === 'number');
    await warteAnsicht(ablauf, 'start');
    assert.equal(ablauf.zustand().leerlaufWarnung, null);
  } finally {
    t.aufraeumen();
  }
});

test('Kamera-Störung: Knopf meldet Störung, „stoerungOk“ führt zurück zum Start', async () => {
  const t = aufbauen();
  try {
    const { ablauf, kamera } = t;
    kamera.fehlerSetzen('kaputt');
    ablauf.aktion('knopf');

    const z = await warteAnsicht(ablauf, 'stoerung');
    assert.match(z.stoerung, /Die Kamera hat nicht ausgelöst/);
    assert.equal(z.countdown, null);
    assert.equal(z.kamera.ok, false);

    ablauf.aktion('stoerungOk');
    assert.equal(ablauf.zustand().ansicht, 'start');
  } finally {
    t.aufraeumen();
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
