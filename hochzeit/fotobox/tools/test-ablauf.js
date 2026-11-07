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
const { loadImage, createCanvas } = require('@napi-rs/canvas');
const { Ablauf, filterAngebot } = require('../server/ablauf');
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
    assert.match(vorschau.foto.url, /^\/fotos\/.+\/druck\.jpg\?k=[0-9a-f]{12}$/);
    assert.equal(vorschau.foto.url, `/fotos/${id}/druck.jpg?k=${vorschau.foto.schluessel}`);

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
    // Drucken läuft asynchron (Druckdatei wird ggf. erst vorbereitet)
    await warteAuf(ablauf, (x) => x.auftraege.length === 4);

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

test('Filterangebot: Farbe, Schwarzweiß und Vintage; „Hell & weich“ ist aus und wird nicht angeboten', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    // Standard: schwarzweiss an, filterVintage an, filterWeich aus
    const e = speicher.einstellungen();
    assert.deepEqual(filterAngebot(e), ['farbe', 'sw', 'vintage']);
    assert.deepEqual(ablauf.zustand().einstellungen.filter, ['farbe', 'sw', 'vintage']);

    ablauf.aktion('start');
    ablauf.aktion('modus', 'einzel');
    assert.equal(ablauf.zustand().ansicht, 'filter');
    ablauf.aktion('filter', 'weich'); // nicht im Angebot: bleibt im Filter-Bildschirm
    assert.equal(ablauf.zustand().ansicht, 'filter');

    ablauf.aktion('filter', 'vintage');
    const v = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(speicher.foto(v.foto.id).filter, 'vintage');
  } finally {
    t.aufraeumen();
  }
});

test('Filterangebot nur Farbe: der Filter-Bildschirm entfällt, „Einzel“ geht direkt zur Aufnahme', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ schwarzweiss: false, filterVintage: false, filterWeich: false });
    assert.deepEqual(ablauf.zustand().einstellungen.filter, ['farbe']);

    ablauf.aktion('start');
    assert.equal(ablauf.zustand().ansicht, 'modus');
    ablauf.aktion('modus', 'einzel');
    assert.equal(ablauf.zustand().ansicht, 'aufnahme');
    assert.equal(ablauf.zustand().filter, 'farbe');
    const v = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(speicher.foto(v.foto.id).filter, 'farbe');
  } finally {
    t.aufraeumen();
  }
});

test('Bluetooth-Knopf mit Filter „Hell & weich“ aus den Einstellungen: ohne Angebot wird Farbe genommen', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ knopfFilter: 'weich', filterWeich: false });
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(ablauf.zustand().filter, 'farbe');
    assert.equal(speicher.foto(v.foto.id).filter, 'farbe', 'ein nicht angebotener Filter darf nicht benutzt werden');
  } finally {
    t.aufraeumen();
  }
});

test('Bluetooth-Knopf mit Filter „Hell & weich“ wird benutzt, wenn er angeboten wird', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ knopfFilter: 'weich', filterWeich: true });
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(speicher.foto(v.foto.id).filter, 'weich');
  } finally {
    t.aufraeumen();
  }
});

test('Posen: Einzelbild zeigt „Pose: …“ aus der Liste, ohne Posen „Schaut in die Kamera!“', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ posenAn: true, posenListe: 'A\nB' });
    ablauf.aktion('knopf');
    const z = await warteAuf(ablauf, (x) => x.ansicht === 'aufnahme' && x.hinweis.startsWith('Pose: '));
    assert.ok(['Pose: A', 'Pose: B'].includes(z.hinweis), `unerwarteter Hinweis: ${z.hinweis}`);
    await warteAnsicht(ablauf, 'vorschau');
  } finally {
    t.aufraeumen();
  }

  const ohne = aufbauen();
  try {
    const { ablauf, speicher } = ohne;
    speicher.einstellungenSetzen({ posenAn: false, posenListe: 'A\nB' });
    ablauf.aktion('knopf');
    const z = await warteAuf(ablauf, (x) => x.ansicht === 'aufnahme' && x.hinweis !== '');
    assert.equal(z.hinweis, 'Schaut in die Kamera!');
    await warteAnsicht(ablauf, 'vorschau');
  } finally {
    ohne.aufraeumen();
  }
});

test('Posen im Fotostreifen: die ersten beiden Aufnahmen zeigen nicht dieselbe Pose', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ posenAn: true, posenListe: 'A\nB', knopfModus: 'streifen' });
    // Hinweis jeweils am Anfang einer Aufnahme festhalten (Nummer des Bilds ändert sich)
    const hinweise = [];
    let letzteNr = null;
    const merke = () => {
      const z = ablauf.zustand();
      if (z.bild && z.bild.nr !== letzteNr) { letzteNr = z.bild.nr; hinweise.push(z.hinweis); }
    };
    ablauf.on('aenderung', merke);
    try {
      ablauf.aktion('knopf');
      await warteAnsicht(ablauf, 'vorschau');
    } finally {
      ablauf.removeListener('aenderung', merke);
    }
    assert.equal(hinweise.length, 4, 'vier Aufnahmen erwartet');
    assert.ok(hinweise.every((h) => ['Pose: A', 'Pose: B'].includes(h)), `unerwartete Hinweise: ${hinweise}`);
    assert.notEqual(hinweise[0], hinweise[1], 'Aufnahme 1 und 2 zeigen dieselbe Pose');
  } finally {
    t.aufraeumen();
  }
});

test('Gästebuch: Gäste und Unterschrift speichern, unbekannte Gäste fallen weg; ausgeschaltet öffnet sich nichts', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.gaesteSetzen([{ id: 'g1', name: 'Anna Berg', tisch: 'Tisch 1' }, { id: 'g2', name: 'Ben Kurz', tisch: 'Tisch 2' }]);
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');

    ablauf.aktion('gaestebuch');
    assert.equal(ablauf.zustand().ansicht, 'gaestebuch');
    const unterschrift = createCanvas(50, 20).toDataURL('image/png');
    ablauf.aktion('gaestebuchSpeichern', { gaeste: ['g1', 'x'], namenFrei: 'Oma', gruss: 'Hallo', unterschrift });
    const z = ablauf.zustand();
    assert.equal(z.ansicht, 'vorschau');
    assert.equal(z.imGaestebuch, true);

    const f = speicher.foto(v.foto.id);
    assert.deepEqual(f.gaestebuch.gaeste, ['g1'], 'die unbekannte Gast-ID „x“ muss wegfallen');
    assert.equal(f.gaestebuch.namenFrei, 'Oma');
    assert.equal(f.gaestebuch.unterschrift, true);
    const png = fs.readFileSync(speicher.unterschriftDatei(v.foto.id));
    assert.equal(png[0], 0x89, 'unterschrift.png ist kein PNG');

    // Gästebuch ausgeschaltet: der Schritt öffnet sich nicht
    speicher.einstellungenSetzen({ gaestebuchAn: false });
    ablauf.aktion('gaestebuch');
    assert.equal(ablauf.zustand().ansicht, 'vorschau');
  } finally {
    t.aufraeumen();
  }
});

test('QR-Codes: Foto-Link und WLAN-Zugang in „Druck“ (Semikolon im WLAN-Passwort maskiert), in der Vorschau keiner', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ qrAn: true, wlanName: 'Fotobox', wlanPasswort: 'a;b' });
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(ablauf.zustand().qr, null, 'in der Vorschau kein QR-Code');

    ablauf.aktion('weiter');
    const z = ablauf.zustand();
    assert.equal(z.ansicht, 'druck');
    assert.match(z.qr.foto, /\/f\/.+\?k=[0-9a-f]{12}$/);
    assert.ok(z.qr.foto.endsWith(`?k=${speicher.foto(v.foto.id).schluessel}`), 'der Schlüssel im Link muss zum Foto gehören');
    assert.equal(z.qr.wlan, 'WIFI:T:WPA;S:Fotobox;P:a\\;b;;');
  } finally {
    t.aufraeumen();
  }
});

test('QR-Codes: ohne eingetragenes WLAN nur der Foto-Link, ausgeschaltet gar kein QR-Code', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ qrAn: true, wlanName: '' });
    ablauf.aktion('knopf');
    await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    const z = ablauf.zustand();
    assert.equal(z.ansicht, 'druck');
    assert.ok(z.qr && z.qr.foto, 'der Foto-Link muss trotzdem da sein');
    assert.equal(z.qr.wlan, null);
  } finally {
    t.aufraeumen();
  }

  const aus = aufbauen();
  try {
    const { ablauf, speicher } = aus;
    speicher.einstellungenSetzen({ qrAn: false, wlanName: 'Fotobox' });
    ablauf.aktion('knopf');
    await warteAnsicht(aus.ablauf, 'vorschau');
    ablauf.aktion('weiter');
    assert.equal(ablauf.zustand().ansicht, 'druck');
    assert.equal(ablauf.zustand().qr, null);
  } finally {
    aus.aufraeumen();
  }
});

test('Danke mit QR-Code bleibt stehen bis „Fertig“; ohne QR-Code endet es nach zeiten.danke', async () => {
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ druckenAn: false, qrAn: true });
    ablauf.aktion('knopf');
    await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    assert.equal(ablauf.zustand().ansicht, 'danke');
    assert.equal(ablauf.zustand().ohneDruck, true);

    await warte(300); // dreimal zeiten.danke (100 ms), aber noch unter dem Leerlauf (600 ms)
    assert.equal(ablauf.zustand().ansicht, 'danke', 'mit QR-Code darf „Danke“ nicht von selbst enden');
    ablauf.aktion('fertig');
    assert.equal(ablauf.zustand().ansicht, 'start');
  } finally {
    t.aufraeumen();
  }

  const ohne = aufbauen();
  try {
    const { ablauf, speicher } = ohne;
    speicher.einstellungenSetzen({ druckenAn: false, qrAn: false });
    ablauf.aktion('knopf');
    await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    assert.equal(ablauf.zustand().ansicht, 'danke');
    await warteAnsicht(ablauf, 'start', 1000);
  } finally {
    ohne.aufraeumen();
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
