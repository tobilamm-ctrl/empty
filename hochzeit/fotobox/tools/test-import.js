/*
 * Test für server/import.js: Einlesen einer Sitzplan-Datei („…sitzplan.json“).
 * Start: node tools/test-import.js
 */
'use strict';
const assert = require('node:assert/strict');
const { sitzplanLesen, datumText } = require('../server/import');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// Minimales Sitzplan-Projekt: zwei Tische, drei Gäste mit Platz (einer ohne), ein leerer Gast, eine eigene Schrift
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

test('Sitzplan-Datei wird vollständig eingelesen', () => {
  const im = sitzplanLesen(JSON.stringify(projekt()));
  assert.equal(im.namen, 'Erna & Hans');
  assert.equal(im.datum, '14. Juni 2027');
  assert.equal(im.ort, 'Schloss');
  assert.equal(im.farbwelt, 'salbei');
  assert.equal(im.akzent, '#123456');
  assert.equal(im.schriftstil, 'romantisch');
});

test('Gäste: Anzahl, Tischnamen und leerer Gast übersprungen', () => {
  const im = sitzplanLesen(JSON.stringify(projekt()));
  assert.equal(im.gaeste.length, 3);
  assert.deepEqual(im.gaeste.map((g) => g.tisch), ['Tisch 1', 'Brautpaar', '']);
  assert.equal(im.gaeste[0].name, 'Anna Muster');
  assert.equal(im.gaeste[2].name, 'Carla Ohneplatz');
});

test('Tische in der Reihenfolge des ersten Auftretens', () => {
  const im = sitzplanLesen(JSON.stringify(projekt()));
  assert.deepEqual(im.tische, ['Tisch 1', 'Brautpaar']);
});

test('eigene Schrift wird als Datei-Inhalt (base64 → Buffer) gelesen', () => {
  const im = sitzplanLesen(JSON.stringify(projekt()));
  assert.equal(im.schriften.length, 1);
  assert.equal(im.schriften[0].name, 'Meine Schrift');
  assert.equal(im.schriften[0].endung, 'woff2');
  assert.ok(Buffer.isBuffer(im.schriften[0].daten));
  assert.deepEqual(im.schriften[0].daten, Buffer.from('xyz'));
});

test('ungültiges JSON wirft einen Fehler', () => {
  assert.throws(() => sitzplanLesen('das ist kein json {'), /kein gültiges JSON/);
});

test('JSON ohne settings oder guests wirft einen Fehler', () => {
  const ohneSettings = projekt();
  delete ohneSettings.settings;
  assert.throws(() => sitzplanLesen(JSON.stringify(ohneSettings)), /keine Sitzplan-Datei/);

  const ohneGaeste = projekt();
  delete ohneGaeste.guests;
  assert.throws(() => sitzplanLesen(JSON.stringify(ohneGaeste)), /keine Sitzplan-Datei/);
});

test('Datum wird ausgeschrieben', () => {
  assert.equal(datumText('2027-06-14'), '14. Juni 2027');
  assert.equal(datumText('2027-03-01'), '1. März 2027');
});

test('Adresse: Straße, PLZ und Ort kommen aus street/zip/city (Zahl-PLZ wird Text), fehlt die Adresse, bleibt es leer', () => {
  const p = projekt();
  Object.assign(p.guests[0], { street: 'Hauptstr. 1', zip: '10115', city: 'Berlin' });
  p.guests[1].zip = 80331; // Zahl statt Text
  const im = sitzplanLesen(JSON.stringify(p));
  assert.deepEqual([im.gaeste[0].strasse, im.gaeste[0].plz, im.gaeste[0].ort], ['Hauptstr. 1', '10115', 'Berlin']);
  assert.deepEqual([im.gaeste[1].strasse, im.gaeste[1].plz, im.gaeste[1].ort], ['', '80331', '']);
  assert.deepEqual([im.gaeste[2].strasse, im.gaeste[2].plz, im.gaeste[2].ort], ['', '', '']);
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
