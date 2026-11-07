/*
 * Tests für die Einstellungen der Fotobox: Bereinigung der Werte (server/speicher.js), Öffnungszeit und Pause
 * (server/ablauf.js), Ablauf mit Gesamtlimit, Feinkorrektur, Logo, Knopf-Anlernen und Diashow-Freigabe,
 * Abschalten eines Druckers, Verschieben des Druckbilds und der Server mit PIN-Änderung und Logo-Upload.
 * Start: node tools/test-einstellungen.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const WebSocket = require('ws');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { Ablauf, geschlossen } = require('../server/ablauf');
const { Speicher, STANDARD, bereinigen } = require('../server/speicher');
const { DruckerVerwaltung } = require('../server/drucker/verwaltung');
const { druckerSimulator } = require('../server/drucker/treiber');
const { kameraSimulator } = require('../server/kamera/simulator');
const bild = require('../server/bild');
const { gestaltung } = require('../server/gestaltung');
const { starten, konfigLaden } = require('../server/index');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const serverTests = [];
const serverTest = (name, fn) => serverTests.push({ name, fn });
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

// Verkürzte Zeiten wie in tools/test-ablauf.js
const ZEITEN = { countdownSek: 2, countdownSchritt: 20, pause: 10, leerlaufWarnung: 300, leerlauf: 600, danke: 100, knopfSperre: 0, takt: 50 };
const d = (h, m) => new Date(2027, 5, 14, h, m); // Hochzeitstag, lokale Zeit

// Wartet, bis pred(lesen()) wahr ist: bei jeder Änderung von quelle und zusätzlich alle 20 ms
function warteBis(quelle, lesen, pred, ms = 5000) {
  return new Promise((ok, nein) => {
    let timer, poll, letzt = null;
    const aufraeumen = () => { clearTimeout(timer); clearInterval(poll); quelle.removeListener('aenderung', pruefe); };
    const pruefe = () => {
      try {
        letzt = lesen();
        if (pred(letzt)) { aufraeumen(); ok(letzt); }
      } catch (e) { aufraeumen(); nein(e); }
    };
    timer = setTimeout(() => {
      aufraeumen();
      const ansicht = letzt && letzt.ansicht ? ` (Ansicht zuletzt: ${letzt.ansicht})` : '';
      nein(new Error(`Zeitüberschreitung nach ${ms} ms${ansicht}`));
    }, ms);
    poll = setInterval(pruefe, 20);
    quelle.on('aenderung', pruefe);
    pruefe();
  });
}
const warteAuf = (ablauf, pred, ms) => warteBis(ablauf, () => ablauf.zustand(), pred, ms);
const warteAnsicht = (ablauf, ansicht, ms) => warteAuf(ablauf, (z) => z.ansicht === ansicht, ms);

// Liest die Abmessungen einer JPEG-Datei (prüft zuerst die JPEG-Kennung)
async function jpegMasse(datei) {
  const daten = fs.readFileSync(datei);
  assert.equal(daten[0], 0xff, `${datei} ist kein JPEG`);
  assert.equal(daten[1], 0xd8, `${datei} ist kein JPEG`);
  const img = await loadImage(daten);
  return { breite: img.width, hoehe: img.height };
}

// Bildpunkte eines JPEG/PNG-Buffers: Abmessungen und Farbe (RGB) an einer Stelle
async function bildpunkte(daten) {
  const img = await loadImage(daten);
  const c = createCanvas(img.width, img.height), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { breite: img.width, hoehe: img.height, punkt: (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)) };
}
// Farbe ungefähr wie erwartet (JPEG verändert die Werte leicht)
const nahe = (farbe, soll, toleranz = 12) => farbe.every((v, i) => Math.abs(v - soll[i]) <= toleranz);
const ROT = [255, 0, 0], BLAU = [0, 0, 255];

// Kompletter Aufbau pro Testfall: eigener Temp-Ordner, echter Speicher, Simulatoren
function aufbauen({ knopfTasten = [] } = {}) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-einst-'));
  const speicher = new Speicher(ordner);
  const kamera = kameraSimulator();
  const drucker = new DruckerVerwaltung({
    treiber: [druckerSimulator('Drucker A', 30), druckerSimulator('Drucker B', 30)],
    dauerMs: 30,
  });
  const ablauf = new Ablauf({ kamera, drucker, speicher, bild, gestaltung, zeiten: ZEITEN, knopfTasten });
  return {
    ordner, speicher, kamera, drucker, ablauf,
    aufraeumen() {
      ablauf.beenden();
      drucker.beenden();
      fs.rmSync(ordner, { recursive: true, force: true });
    },
  };
}

// ---------- 1. Bereinigung der Einstellungen ----------

test('bereinigen: Zahlen werden auf die Grenzen gesetzt (99 → 10, „1.26“ → 1.3, −9 → −5)', () => {
  assert.equal(bereinigen('countdownSek', 99), 10);
  assert.equal(bereinigen('countdownSek', 0), 1);
  assert.equal(bereinigen('druckVersatzX', '1.26'), 1.3);
  assert.equal(bereinigen('druckVersatzY', -9), -5);
  assert.equal(bereinigen('maxAbzuegeGesamt', -3), 0);
  assert.equal(bereinigen('druckVersatzX', 0.04), 0);
});

test('bereinigen: ungültige Zahlen werden ignoriert (undefined)', () => {
  assert.equal(bereinigen('countdownSek', 'abc'), undefined);
  assert.equal(bereinigen('druckVersatzX', NaN), undefined);
  assert.equal(bereinigen('diashowSek', undefined), undefined);
});

test('bereinigen: Uhrzeiten „19:00“ gültig, „25:00“ ungültig, leer ist erlaubt (Öffnungszeit aus)', () => {
  assert.equal(bereinigen('oeffnungAb', '19:00'), '19:00');
  assert.equal(bereinigen('oeffnungAb', '25:00'), undefined);
  assert.equal(bereinigen('oeffnungBis', ''), '');
  assert.equal(bereinigen('oeffnungBis', '7:00'), undefined);
});

test('bereinigen: PIN nur mit 4 bis 8 Ziffern, leer setzt auf die config.json-PIN zurück', () => {
  assert.equal(bereinigen('pin', '12'), undefined);
  assert.equal(bereinigen('pin', '1234'), '1234');
  assert.equal(bereinigen('pin', 'abcd'), undefined);
  assert.equal(bereinigen('pin', ''), '');
});

test('bereinigen: Druckerliste nur mit ganzen Nummern ≥ 0, ohne Doppelte', () => {
  assert.deepEqual(bereinigen('druckerAus', ['1', 'x', 1]), [1]);
  assert.deepEqual(bereinigen('druckerAus', [2, 2, -1, 1.5, 0]), [2, 0]);
  assert.equal(bereinigen('druckerAus', 'eins'), undefined);
});

test('bereinigen: Schalter werden zu true/false', () => {
  assert.equal(bereinigen('pause', 1), true);
  assert.equal(bereinigen('spiegeln', 0), false);
  assert.equal(bereinigen('diashowFreigabe', ''), false);
});

test('bereinigen: Töne nur aus, buehne, ipad oder beide, alles andere wird ignoriert', () => {
  ['aus', 'buehne', 'ipad', 'beide'].forEach((t) => assert.equal(bereinigen('toene', t), t));
  assert.equal(bereinigen('toene', 'radio'), undefined);
  assert.equal(bereinigen('toene', ''), undefined);
});

test('bereinigen: Adresse leer oder http(s)://Host:Port, Schrägstrich am Ende fällt weg, „ftp“ und Text werden abgelehnt', () => {
  assert.equal(bereinigen('adresse', ''), '');
  assert.equal(bereinigen('adresse', 'http://192.168.8.10:8080'), 'http://192.168.8.10:8080');
  assert.equal(bereinigen('adresse', 'http://192.168.8.10:8080/'), 'http://192.168.8.10:8080');
  assert.equal(bereinigen('adresse', 'ftp://x'), undefined);
  assert.equal(bereinigen('adresse', 'foo'), undefined);
});

test('bereinigen: Lautstärke wird auf 0 bis 100 begrenzt (150 → 100, −5 → 0, 42,4 → 42)', () => {
  assert.equal(bereinigen('lautstaerke', 150), 100);
  assert.equal(bereinigen('lautstaerke', -5), 0);
  assert.equal(bereinigen('lautstaerke', 42.4), 42);
  assert.equal(bereinigen('lautstaerke', 'laut'), undefined);
});

test('bereinigen: Posenliste darf länger als 300 Zeichen sein (bis 3000), andere Texte bleiben bei 300', () => {
  assert.equal(bereinigen('posenListe', 'Pose\n'.repeat(400)).length, 2000);
  assert.equal(bereinigen('posenListe', 'x'.repeat(1000)).length, 1000);
  assert.equal(bereinigen('posenListe', 'x'.repeat(5000)).length, 3000);
  assert.equal(bereinigen('textStart', 'x'.repeat(5000)).length, 300);
});

test('einstellungenSetzen: ungültige Werte lassen den alten Wert stehen, unbekannte Schlüssel fallen weg', () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-einst-speicher-'));
  try {
    const speicher = new Speicher(ordner);
    speicher.einstellungenSetzen({ pin: '12', countdownSek: 'abc', unbekannt: 5, leerlaufSek: 20 });
    const e = speicher.einstellungen();
    assert.equal(e.pin, '');
    assert.equal(e.countdownSek, STANDARD.countdownSek);
    assert.equal(e.leerlaufSek, 20);
    assert.equal('unbekannt' in e, false);
  } finally {
    fs.rmSync(ordner, { recursive: true, force: true });
  }
});

// ---------- 2. Öffnungszeit und Pause ----------

test('geschlossen: Pause-Modus liefert den Pausentext, sonst Standardtext', () => {
  assert.equal(geschlossen(Object.assign({}, STANDARD, { pause: true, textPause: 'Gleich wieder da' }), d(12, 0)), 'Gleich wieder da');
  assert.equal(geschlossen(Object.assign({}, STANDARD, { pause: true, textPause: '' }), d(12, 0)), 'Kurze Pause');
  assert.equal(geschlossen(Object.assign({}, STANDARD), d(12, 0)), null, 'ohne Pause und Öffnungszeit ist immer offen');
});

test('geschlossen: nur „ab 19:00“ – 18:00 zu mit Hinweis, 23:00 und 02:00 offen, 06:00 zu', () => {
  const e = Object.assign({}, STANDARD, { oeffnungAb: '19:00' });
  assert.equal(geschlossen(e, d(18, 0)), 'Die Fotobox öffnet um 19:00 Uhr.');
  assert.equal(geschlossen(e, d(23, 0)), null);
  assert.equal(geschlossen(e, d(2, 0)), null);
  assert.match(geschlossen(e, d(6, 0)), /öffnet um 19:00/);
});

test('geschlossen: 19:00 bis 03:00 über Mitternacht – 01:00 offen, 04:00 zu, 18:00 „öffnet um“', () => {
  const e = Object.assign({}, STANDARD, { oeffnungAb: '19:00', oeffnungBis: '03:00' });
  assert.equal(geschlossen(e, d(1, 0)), null);
  assert.equal(geschlossen(e, d(4, 0)), 'Die Fotobox hat jetzt geschlossen. Danke fürs Mitmachen!');
  assert.equal(geschlossen(e, d(18, 0)), 'Die Fotobox öffnet um 19:00 Uhr.');
});

test('geschlossen: 14:00 bis 18:00 – 13:00 öffnet um 14:00, 15:00 offen, 19:00 zu', () => {
  const e = Object.assign({}, STANDARD, { oeffnungAb: '14:00', oeffnungBis: '18:00' });
  assert.match(geschlossen(e, d(13, 0)), /öffnet um 14:00/);
  assert.equal(geschlossen(e, d(15, 0)), null);
  assert.equal(geschlossen(e, d(19, 0)), 'Die Fotobox hat jetzt geschlossen. Danke fürs Mitmachen!');
});

// ---------- 3. Ablauf mit den neuen Einstellungen ----------

test('Pause-Modus: aus „start“ wird „pause“, Knopf und Start wirken nicht, Ende der Pause führt zurück zum Start', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    assert.equal(ablauf.zustand().ansicht, 'start');

    speicher.einstellungenSetzen({ pause: true });
    const z = await warteAnsicht(ablauf, 'pause');
    assert.equal(z.pauseText, STANDARD.textPause);

    ablauf.aktion('start');
    ablauf.aktion('knopf');
    await warte(150);
    assert.equal(ablauf.zustand().ansicht, 'pause');
    assert.equal(ablauf.zustand().countdown, null);
    assert.equal(speicher.fotos().length, 0, 'in der Pause darf kein Foto entstehen');

    speicher.einstellungenSetzen({ pause: false });
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

test('Drucken aus: „weiter“ führt direkt zum Danke-Bildschirm, es wird nichts gedruckt', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher, drucker } = t;
    speicher.einstellungenSetzen({ druckenAn: false });
    ablauf.aktion('knopf');
    const vorschau = await warteAnsicht(ablauf, 'vorschau');

    ablauf.aktion('weiter');
    const z = ablauf.zustand();
    assert.equal(z.ansicht, 'danke');
    assert.equal(z.ohneDruck, true);
    assert.equal(drucker.auftraegeZu(vorschau.foto.id).length, 0, 'es wurden Abzüge angelegt');
    assert.equal(speicher.foto(vorschau.foto.id).behalten, true, 'das Foto muss trotzdem behalten werden');
    assert.equal(speicher.foto(vorschau.foto.id).abzuege, 0);
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

test('Gesamtlimit: Abzüge über alle Fotos begrenzt, danach geht „weiter“ direkt zum Danke-Bildschirm', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ maxAbzuegeGesamt: 3 });

    // Erstes Foto: zwei Abzüge, danach bleiben 1 von 3
    ablauf.aktion('knopf');
    const v1 = await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    let z = ablauf.zustand();
    assert.equal(z.ansicht, 'druck');
    assert.equal(z.druckRest, 3);
    ablauf.aktion('anzahl', 2);
    ablauf.aktion('drucken');
    await warteAuf(ablauf, () => speicher.foto(v1.foto.id).abzuege === 2);
    ablauf.aktion('fertig');
    await warteAnsicht(ablauf, 'start');

    // Zweites Foto: nur noch ein Abzug möglich
    ablauf.aktion('knopf');
    const v2 = await warteAuf(ablauf, (x) => x.ansicht === 'vorschau' && x.foto && x.foto.id !== v1.foto.id);
    ablauf.aktion('weiter');
    z = ablauf.zustand();
    assert.equal(z.ansicht, 'druck');
    assert.equal(z.maxAbzuege, 1);
    assert.equal(z.druckRest, 1);
    ablauf.aktion('anzahl', 2);
    assert.equal(ablauf.zustand().anzahl, 1, 'Anzahl muss auf den Rest begrenzt sein');
    ablauf.aktion('drucken');
    await warteAuf(ablauf, () => speicher.foto(v2.foto.id).abzuege === 1);
    ablauf.aktion('fertig');
    await warteAnsicht(ablauf, 'start');

    // Drittes Foto: Limit erreicht, es wird nicht mehr gedruckt
    ablauf.aktion('knopf');
    const v3 = await warteAnsicht(ablauf, 'vorschau');
    assert.equal(ablauf.zustand().druckRest, 0);
    ablauf.aktion('weiter');
    z = ablauf.zustand();
    assert.equal(z.ansicht, 'danke');
    assert.equal(z.ohneDruck, true);
    assert.equal(speicher.foto(v3.foto.id).abzuege, 0);
    assert.equal(speicher.fotos().reduce((s, f) => s + (f.abzuege || 0), 0), 3);
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

test('Feinkorrektur: Druckdatei wird um 2 mm verschoben als druck-versetzt.jpg gespeichert', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ druckVersatzX: 2 });
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    ablauf.aktion('drucken');
    await warteAuf(ablauf, (x) => x.auftraege.length === 1);

    const versetzt = path.join(speicher.fotoOrdner(v.foto.id), 'druck-versetzt.jpg');
    assert.ok(fs.existsSync(versetzt), 'druck-versetzt.jpg fehlt');
    assert.deepEqual(await jpegMasse(versetzt), { breite: 1800, hoehe: 1200 });
    assert.ok(fs.existsSync(speicher.druckDatei(v.foto.id)), 'das Original druck.jpg muss bleiben');
    await warteAuf(ablauf, () => speicher.foto(v.foto.id).abzuege === 1);
    ablauf.aktion('fertig');
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

test('Logo statt Namen: das Druckbild zeigt das Logo an der Stelle der Namen', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    const lc = createCanvas(200, 100), lctx = lc.getContext('2d');
    lctx.fillStyle = '#ff0000'; lctx.fillRect(0, 0, 200, 100);
    speicher.logoSetzen(lc.toBuffer('image/png'));
    speicher.einstellungenSetzen({ logoStattNamen: true });

    ablauf.aktion('knopf');
    const z = await warteAuf(ablauf, (x) => x.ansicht === 'vorschau' || x.ansicht === 'stoerung');
    assert.equal(z.ansicht, 'vorschau', `Aufnahme mit Logo fehlgeschlagen: ${z.stoerung}`);

    const druck = await bildpunkte(fs.readFileSync(speicher.druckDatei(z.foto.id)));
    assert.deepEqual([druck.breite, druck.hoehe], [1800, 1200]);
    // Logo liegt bei y 1008 bis 1124, mittig bei x 900
    assert.ok(nahe(druck.punkt(900, 1066), ROT, 30), `an der Stelle des Logos ist keine Logofarbe: ${druck.punkt(900, 1066)}`);
  } finally {
    t.aufraeumen();
  }
});

test('Knopf anlernen: nur während des Anlernens wird eine Taste gespeichert, Standardtasten bleiben', () => {
  const t = aufbauen({ knopfTasten: ['Enter'] });
  try {
    const { ablauf, speicher } = t;
    assert.deepEqual(ablauf.knopfTastenAlle(), ['Enter']);
    assert.equal(ablauf.zustand().knopfLernen, false);

    ablauf.knopfLernen();
    assert.equal(ablauf.zustand().knopfLernen, true);
    assert.equal(ablauf.knopfGelernt('F9'), true);
    assert.equal(ablauf.zustand().knopfLernen, false, 'nach dem ersten Tastendruck ist das Anlernen beendet');

    assert.deepEqual(speicher.einstellungen().knopfGelernt, ['F9']);
    assert.deepEqual(ablauf.knopfTastenAlle(), ['Enter', 'F9']);
    assert.deepEqual(ablauf.zustand().einstellungen.knopfTasten, ['Enter', 'F9']);

    assert.equal(ablauf.knopfGelernt('F10'), false, 'ohne Anlernen darf keine Taste gespeichert werden');
    assert.equal(ablauf.knopfTastenAlle().includes('F10'), false);
  } finally {
    t.aufraeumen();
  }
});

test('Diashow-Freigabe: ein behaltenes Foto erscheint erst nach der Freigabe am Service', async () => {
  const t = aufbauen();
  try {
    const { ablauf, speicher } = t;
    speicher.einstellungenSetzen({ diashowFreigabe: true });
    ablauf.aktion('knopf');
    const v = await warteAnsicht(ablauf, 'vorschau');
    ablauf.aktion('weiter');
    ablauf.aktion('ohneDruck');
    await warteAnsicht(ablauf, 'danke');

    assert.equal(speicher.foto(v.foto.id).behalten, true);
    assert.equal(speicher.diashow().fotos.includes(v.foto.id), false, 'ohne Freigabe darf das Foto nicht in die Diashow');

    const version = ablauf.zustand().diashowVersion;
    ablauf.fotoFreigeben(v.foto.id, true);
    assert.deepEqual(speicher.diashow().fotos, [v.foto.id]);
    assert.ok(ablauf.zustand().diashowVersion > version, 'Diashow-Version muss steigen');

    ablauf.fotoFreigeben(v.foto.id, false);
    assert.equal(speicher.diashow().fotos.includes(v.foto.id), false);
    await warteAnsicht(ablauf, 'start');
  } finally {
    t.aufraeumen();
  }
});

// ---------- 4. Drucker abschalten ----------

test('Drucker abschalten: wartende Abzüge gehen an den anderen Drucker, der laufende wird fertig gedruckt', async () => {
  const treiber = [druckerSimulator('Drucker A', 200), druckerSimulator('Drucker B', 200)];
  const verwaltung = new DruckerVerwaltung({ treiber, dauerMs: 200 });
  try {
    // Verteilung bei 4 Abzügen: A bekommt a1 und a3, B bekommt a2 und a4. a1 läuft schon auf A.
    const neu = verwaltung.drucken('datei.jpg', 4, 'f1');
    assert.equal(neu.length, 4);
    assert.equal(verwaltung.papierGesamt(), 32);

    verwaltung.ausSetzen(0, true);
    const alle = verwaltung.auftraegeZu('f1');
    assert.equal(alle.filter((a) => a.drucker === 'Drucker A').length, 1, 'nur der laufende Abzug bleibt auf Drucker A');
    assert.equal(alle.filter((a) => a.drucker === 'Drucker B').length, 3, 'die wartenden Abzüge müssen auf B');
    assert.equal(verwaltung.papierGesamt(), 15, 'Papier von Drucker A zählt nach dem Abschalten nicht mehr');
    assert.equal(verwaltung.uebersicht()[0].status, 'aus');
    assert.equal(verwaltung.uebersicht()[0].aus, true);

    // Neuer Auftrag geht nur noch an B
    const weiter = verwaltung.drucken('datei.jpg', 1, 'f2');
    assert.equal(weiter.length, 1);
    assert.equal(weiter[0].drucker, 'Drucker B');

    await warteBis(verwaltung, () => [...verwaltung.auftraegeZu('f1'), ...verwaltung.auftraegeZu('f2')],
      (l) => l.length === 5 && l.every((a) => a.status === 'fertig'), 3000);
    assert.equal(verwaltung.uebersicht()[0].status, 'aus', 'Drucker A bleibt abgeschaltet');

    // Wieder einschalten: Drucker A ist bereit und zählt wieder mit (17 Blatt + 14 auf B)
    verwaltung.ausSetzen(0, false);
    assert.equal(verwaltung.uebersicht()[0].status, 'bereit');
    assert.equal(verwaltung.papierGesamt(), 31);
  } finally {
    verwaltung.beenden();
  }
});

// ---------- 5. Druckbild verschieben ----------

test('versetzen: 5 mm nach rechts, Größe bleibt, frei werdender Rand in Papierfarbe', async () => {
  const quelle = createCanvas(1800, 1200), qctx = quelle.getContext('2d');
  qctx.fillStyle = '#0000ff'; qctx.fillRect(0, 0, 1800, 1200);
  const jpeg = quelle.toBuffer('image/jpeg', 92);

  const versetzt = await bild.versetzen(jpeg, 5, 0, '#ff0000');
  const p = await bildpunkte(versetzt);
  assert.deepEqual([p.breite, p.hoehe], [1800, 1200]);
  // 5 mm × 300 dpi / 25,4 = 59 px: die linke Spalte bis dahin ist Papierfarbe, dahinter das Bild
  assert.ok(nahe(p.punkt(20, 600), ROT), `linker Rand nicht in Papierfarbe: ${p.punkt(20, 600)}`);
  assert.ok(nahe(p.punkt(40, 5), ROT), 'linker Rand oben nicht in Papierfarbe');
  assert.ok(nahe(p.punkt(40, 1190), ROT), 'linker Rand unten nicht in Papierfarbe');
  assert.ok(nahe(p.punkt(80, 600), BLAU), `Bild beginnt nicht bei 59 px: ${p.punkt(80, 600)}`);
  assert.ok(nahe(p.punkt(1000, 600), BLAU), 'Bildinhalt in der Mitte fehlt');
});

// ---------- 6. Server: PIN, Logo, Pause ----------

// Nachrichten aus dem WebSocket sammeln; warteNachricht() liefert die erste passende (auch schon angekommene)
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
    ws.on('message', (dat) => nachrichten.push(JSON.parse(dat.toString('utf8'))));
    ws.on('open', () => aufloesen({ ws, nachrichten }));
    ws.on('error', nein);
  });
}

// PNG-Logo (200 × 100) für Uploads
const PNG = createCanvas(200, 100).toBuffer('image/png');

serverTest('/api/service: Platz im Datenordner, Logo-Stand und Knopf-Standardtasten sind enthalten', async (ctx) => {
  const daten = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  assert.equal(daten.platz.daten.ok, true, 'freier Platz im Datenordner nicht ermittelt');
  assert.equal(typeof daten.platz.daten.freiGB, 'number');
  assert.equal(daten.logo, false, 'ohne Upload darf kein Logo gemeldet werden');
  assert.ok(Array.isArray(daten.knopfStandard), 'knopfStandard fehlt');
  assert.deepEqual(daten.knopfStandard, ctx.konfig.knopf.tasten);
  assert.equal(daten.abzuegeBisher, 0);
});

serverTest('POST /api/logo: PNG mit PIN hochladen, ohne PIN 403, danach liefert GET /api/logo das Bild', async (ctx) => {
  const ohne = await fetch(`${ctx.base}/api/logo`, { method: 'POST', body: PNG });
  assert.equal(ohne.status, 403);

  const res = await fetch(`${ctx.base}/api/logo?pin=${ctx.pin}`, { method: 'POST', body: PNG });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  const get = await fetch(`${ctx.base}/api/logo`);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await get.arrayBuffer()), PNG);

  const service = await (await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`)).json();
  assert.equal(service.logo, true);
});

serverTest('POST /api/logo: Text statt Bild wird mit 400 abgelehnt, das vorhandene Logo bleibt', async (ctx) => {
  await fetch(`${ctx.base}/api/logo?pin=${ctx.pin}`, { method: 'POST', body: PNG });

  const res = await fetch(`${ctx.base}/api/logo?pin=${ctx.pin}`, { method: 'POST', body: 'das ist kein Bild' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).fehler);

  const get = await fetch(`${ctx.base}/api/logo`);
  assert.equal(get.status, 200);
  assert.deepEqual(Buffer.from(await get.arrayBuffer()), PNG, 'das Logo wurde überschrieben');
});

serverTest('Admin: PIN im Service ändern, danach gilt nur die neue PIN – auch für Admin-Aktionen per WebSocket', async (ctx) => {
  const { ws, nachrichten } = await verbinden(ctx.wsUrl);
  try {
    await warteNachricht(nachrichten, (m) => m.typ === 'zustand');

    // Mit falscher PIN wird die Admin-Aktion abgelehnt
    ws.send(JSON.stringify({ typ: 'admin', pin: '0000', aktion: 'pause', daten: { an: true } }));
    const falsch = await warteNachricht(nachrichten, (m) => m.typ === 'antwort' && m.ok === false);
    assert.match(falsch.fehler, /Falsche PIN/);

    // PIN ändern (mit der alten PIN)
    ws.send(JSON.stringify({ typ: 'admin', pin: ctx.pin, aktion: 'einstellungen', daten: { pin: '4711' } }));
    const antwort = await warteNachricht(nachrichten, (m) => m.typ === 'antwort' && m.aktion === 'einstellungen');
    assert.equal(antwort.ok, true);

    const alt = await fetch(`${ctx.base}/api/service?pin=${ctx.pin}`);
    assert.equal(alt.status, 403, 'die alte PIN darf nicht mehr gelten');
    const neu = await fetch(`${ctx.base}/api/service?pin=4711`);
    assert.equal(neu.status, 200, 'die neue PIN muss gelten');

    // Pause per Admin mit der neuen PIN: der Zustand meldet die Pause
    ws.send(JSON.stringify({ typ: 'admin', pin: '4711', aktion: 'pause', daten: { an: true } }));
    const pause = await warteNachricht(nachrichten, (m) => m.typ === 'antwort' && m.aktion === 'pause');
    assert.equal(pause.ok, true);
    const zustand = await warteNachricht(nachrichten, (m) => m.typ === 'zustand' && m.zustand.ansicht === 'pause', 3000);
    assert.equal(zustand.zustand.pauseText, STANDARD.textPause);
  } finally {
    await new Promise((r) => { ws.once('close', r); ws.close(); });
  }
});

// ---------- 7. Speicher: Statistik, Dankeskarten, Diashow, Export ----------

// Frischer Speicher im Temp-Ordner; aufraeumen() löscht ihn wieder
function speicherTemp() {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-speicher-'));
  return { speicher: new Speicher(ordner), ordner, aufraeumen: () => fs.rmSync(ordner, { recursive: true, force: true }) };
}
// Foto wie im Ablauf angelegt; behalten und Gästebuch-Gäste werden danach gesetzt
async function fotoSpeichern(speicher, { modus = 'einzel', filter, behalten = true, gaeste = null, abzuege = 0 }) {
  const neu = await speicher.neuesFoto({ modus, filter, aufnahmen: [Buffer.from('aufnahme')], druck: Buffer.from('druckbild') });
  speicher.fotoAendern(neu.id, { behalten, abzuege });
  if (gaeste) speicher.gaestebuchSpeichern(neu.id, { gaeste, namenFrei: '', gruss: '', unterschrift: null });
  return speicher.foto(neu.id);
}
// ZIP prüfen (unzip -tq) und Verzeichnis (unzip -l) / Inhalt (unzip -p) lesen, wie tools/test-zip.js
function zipPruefen(daten, ordner) {
  const datei = path.join(ordner, 'export.zip');
  fs.writeFileSync(datei, daten);
  execFileSync('unzip', ['-tq', datei]);
  return {
    liste: execFileSync('unzip', ['-l', datei], { encoding: 'utf8' }),
    lese: (name) => execFileSync('unzip', ['-p', datei, name], { encoding: 'utf8' }),
  };
}

test('statistik: zählt nur behaltene Fotos, Einzel/Streifen, Filter, Gästebuch, Top-Liste und Gäste ohne Foto', async () => {
  const t = speicherTemp();
  try {
    const { speicher } = t;
    speicher.gaesteSetzen([
      { id: 'g1', name: 'Anna Berg', tisch: 'Tisch 1' },
      { id: 'g2', name: 'Ben Kurz', tisch: 'Tisch 2' },
      { id: 'g3', name: 'Cora Nie', tisch: 'Tisch 2' },
    ]);
    await fotoSpeichern(speicher, { modus: 'einzel', filter: 'sw', abzuege: 2, gaeste: ['g1', 'g2'] });
    await fotoSpeichern(speicher, { modus: 'streifen', filter: 'farbe', abzuege: 1, gaeste: ['g1'] });
    await fotoSpeichern(speicher, { modus: 'einzel', filter: 'vintage', behalten: false }); // verworfen
    await fotoSpeichern(speicher, { modus: 'einzel', filter: undefined }); // ohne Filterangabe zählt als Farbe

    const s = speicher.statistik();
    assert.equal(s.fotos, 3);
    assert.equal(s.verworfen, 1);
    assert.equal(s.einzel, 2);
    assert.equal(s.streifen, 1);
    assert.equal(s.abzuege, 3);
    assert.deepEqual(s.filter, { sw: 1, farbe: 2 });
    assert.equal(s.gaestebuch, 2);
    assert.deepEqual(s.top, [{ name: 'Anna Berg', anzahl: 2 }, { name: 'Ben Kurz', anzahl: 1 }]);
    assert.equal(s.gaesteGesamt, 3);
    assert.equal(s.gaesteOhneFoto, 1, 'nur Cora steht ohne Foto da');
    assert.equal(s.proStunde.reduce((a, x) => a + x.anzahl, 0), 3);
  } finally {
    t.aufraeumen();
  }
});

test('dankeskarten: je Gast das neueste Einzelfoto, sonst ein Streifen; Gast ohne Foto bleibt leer', async () => {
  const t = speicherTemp();
  try {
    const { speicher } = t;
    speicher.gaesteSetzen([
      { id: 'g1', name: 'Anna Berg', tisch: 'Tisch 1', strasse: 'Hauptstr. 1', plz: '10115', ort: 'Berlin' },
      { id: 'g2', name: 'Ben Kurz', tisch: 'Tisch 2' },
      { id: 'g3', name: 'Cora Nie' },
      { id: 'g4', name: 'Dora Fuchs' },
    ]);
    const a = await fotoSpeichern(speicher, { modus: 'einzel', gaeste: ['g1', 'g2'] });
    const b = await fotoSpeichern(speicher, { modus: 'einzel', gaeste: ['g1'] }); // neuestes Einzelfoto für Anna
    await fotoSpeichern(speicher, { modus: 'streifen', gaeste: ['g2'] }); // neuer, aber Streifen: Einzelfoto bevorzugt
    const e = await fotoSpeichern(speicher, { modus: 'streifen', gaeste: ['g4'] }); // Dora hat nur einen Streifen

    const karten = Object.fromEntries(speicher.dankeskarten().map((k) => [k.id, k]));
    assert.equal(karten.g1.foto, b.id);
    assert.equal(karten.g1.fotos, 2);
    assert.equal(karten.g1.strasse, 'Hauptstr. 1');
    assert.equal(karten.g2.foto, a.id, 'Ben bekommt das Einzelfoto, nicht den neueren Streifen');
    assert.equal(karten.g2.fotos, 2);
    assert.equal(karten.g3.foto, null);
    assert.equal(karten.g3.fotos, 0);
    assert.equal(karten.g4.foto, e.id, 'ohne Einzelfoto wird der Streifen genommen');
  } finally {
    t.aufraeumen();
  }
});

test('dankeskarten.csv: UTF-8 mit BOM, Kopfzeile, Semikolon, je Gast eine Zeile', async () => {
  const t = speicherTemp();
  try {
    const { speicher } = t;
    speicher.gaesteSetzen([
      { id: 'g1', name: 'Anna Berg', tisch: 'Tisch 1', strasse: 'Hauptstr. 1', plz: '10115', ort: 'Berlin' },
      { id: 'g2', name: 'Cora Nie' },
    ]);
    const a = await fotoSpeichern(speicher, { gaeste: ['g1'] });
    const csv = speicher.dankeskartenCsv();
    assert.ok(csv.startsWith('﻿'), 'BOM fehlt (Excel liest sonst Umlaute falsch)');
    const zeilen = csv.slice(1).split('\r\n');
    assert.equal(zeilen.length, 3, 'Kopfzeile plus zwei Gäste');
    assert.equal(zeilen[0], '"Name";"Tisch";"Straße";"PLZ";"Ort";"Foto";"Fotos mit diesem Gast"');
    assert.equal(zeilen[1], `"Anna Berg";"Tisch 1";"Hauptstr. 1";"10115";"Berlin";"${a.id}.jpg";"1"`, 'alle Felder stehen in Anführungszeichen');
    assert.equal(zeilen[2], '"Cora Nie";"";"";"";"";"";"0"');
  } finally {
    t.aufraeumen();
  }
});

test('diashow: nach jedem zweiten Foto der Box ein eigenes Foto, verworfene fehlen; ohne Fotos nur die eigenen', async () => {
  const t = speicherTemp();
  try {
    const { speicher } = t;
    speicher.einstellungenSetzen({ eigeneAlle: 2 });
    const eigen = speicher.eigenesSpeichern(Buffer.from('eigenes'), 'png');
    const f1 = await fotoSpeichern(speicher, {});
    const f2 = await fotoSpeichern(speicher, {});
    const f3 = await fotoSpeichern(speicher, {});
    await fotoSpeichern(speicher, { behalten: false });

    const d = speicher.diashow();
    assert.deepEqual(d.bilder.map((b) => (b.startsWith('/eigene/') ? 'eigen' : 'foto')), ['foto', 'foto', 'eigen', 'foto']);
    assert.deepEqual(d.bilder, [`/fotos/${f3.id}/druck.jpg`, `/fotos/${f2.id}/druck.jpg`, `/eigene/${encodeURIComponent(eigen)}`, `/fotos/${f1.id}/druck.jpg`]);
  } finally {
    t.aufraeumen();
  }

  const leer = speicherTemp();
  try {
    const { speicher } = leer;
    speicher.einstellungenSetzen({ eigeneAlle: 2 });
    const e1 = speicher.eigenesSpeichern(Buffer.from('a'), 'jpg');
    const e2 = speicher.eigenesSpeichern(Buffer.from('b'), 'png');
    await fotoSpeichern(speicher, { behalten: false });
    assert.deepEqual([...speicher.diashow().bilder].sort(), [`/eigene/${e1}`, `/eigene/${e2}`].sort(), 'ohne behaltene Fotos nur die eigenen');
    speicher.eigenesLoeschen(e1);
    assert.deepEqual(speicher.diashow().bilder, [`/eigene/${e2}`]);
  } finally {
    leer.aufraeumen();
  }
});

test('exportZip: Ordner nach Tisch und nach Gast, „ohne Zuordnung“, Gästebuch-CSV immer, Dankeskarten nur mit Gästen', async () => {
  const t = speicherTemp();
  try {
    const { speicher, ordner } = t;
    speicher.gaesteSetzen([{ id: 'g1', name: 'Anna Berg', tisch: 'Tisch 1' }, { id: 'g2', name: 'Ben Kurz', tisch: 'Tisch 2' }]);
    const mit = await fotoSpeichern(speicher, { gaeste: ['g1'] });
    const ohne = await fotoSpeichern(speicher, {});
    const verworfen = await fotoSpeichern(speicher, { behalten: false });

    const tisch = zipPruefen(await speicher.exportZip('tisch'), ordner);
    assert.ok(tisch.liste.includes(`nach-tisch/Tisch 1/${mit.id}.jpg`), 'Ordner „Tisch 1“ fehlt');
    assert.ok(tisch.liste.includes(`nach-tisch/ohne Zuordnung/${ohne.id}.jpg`), 'Foto ohne Gast muss in „ohne Zuordnung“');
    assert.ok(!tisch.liste.includes(verworfen.id), 'verworfenes Foto darf nicht exportiert werden');
    assert.ok(tisch.liste.includes('gaestebuch/gaestebuch.csv'));
    assert.ok(tisch.liste.includes('dankeskarten.csv'));
    assert.ok(tisch.lese('gaestebuch/gaestebuch.csv').includes('Anna Berg'));

    const gast = zipPruefen(await speicher.exportZip('gast'), ordner);
    assert.ok(gast.liste.includes(`nach-gast/Anna Berg/${mit.id}.jpg`), 'Ordner „Anna Berg“ fehlt');
    assert.ok(gast.liste.includes(`nach-gast/ohne Zuordnung/${ohne.id}.jpg`));
    assert.ok(!gast.liste.includes('nach-tisch/'));

    const zeit = zipPruefen(await speicher.exportZip('zeit'), ordner);
    assert.ok(zeit.liste.includes(`druckbilder/${mit.id}.jpg`));
    assert.ok(zeit.liste.includes(`aufnahmen/${mit.id}_aufnahme-1.jpg`));
  } finally {
    t.aufraeumen();
  }

  const ohneGaeste = speicherTemp();
  try {
    await fotoSpeichern(ohneGaeste.speicher, {});
    const z = zipPruefen(await ohneGaeste.speicher.exportZip('zeit'), ohneGaeste.ordner);
    assert.ok(z.liste.includes('gaestebuch/gaestebuch.csv'), 'die Gästebuch-CSV gehört immer dazu');
    assert.ok(!z.liste.includes('dankeskarten.csv'), 'ohne Gäste keine Dankeskarten-Liste');
  } finally {
    ohneGaeste.aufraeumen();
  }
});

// ---------- Lauf ----------

// Führt alle Tests einer Liste aus und zählt die Fehlschläge
async function laufe(liste, ctx) {
  let fehlschlaege = 0;
  for (const t of liste) {
    try {
      await t.fn(ctx);
      console.log(`ok – ${t.name}`);
    } catch (e) {
      console.error(`FEHLER – ${t.name}`);
      console.error(e);
      fehlschlaege++;
    }
  }
  return fehlschlaege;
}

(async () => {
  let fehler = await laufe(tests, null);

  // Server wie in tools/test-server.js: freier Port, Temp-Ordner, eigene PIN aus config.json
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-einst-server-'));
  const konfig = Object.assign(konfigLaden(), { port: 0, datenOrdner: ordner });
  const server = await starten(konfig, { leise: true });
  const base = `http://127.0.0.1:${server.port}`;
  const ctx = { base, wsUrl: base.replace(/^http/, 'ws') + '/ws', pin: String(konfig.pin), konfig };
  try {
    fehler += await laufe(serverTests, ctx);
  } finally {
    await server.beenden();
    fs.rmSync(ordner, { recursive: true, force: true });
  }
  if (fehler) process.exit(1);
})();
