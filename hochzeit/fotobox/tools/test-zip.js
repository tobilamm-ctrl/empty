/*
 * Test für server/zip.js: ZIP-Erzeugung, CRC-32 und Prüfung mit dem Programm „unzip“.
 * Start: node tools/test-zip.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { zip, crc32 } = require('../server/zip');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('CRC-32 der Prüfsumme „123456789“ ist 0xCBF43926', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xCBF43926);
});

test('ZIP mit zwei Einträgen (Umlaut im Namen) lässt sich mit unzip entpacken', () => {
  const eintraege = [
    { name: 'druckbilder/Grüße-Brautpaar.txt', daten: Buffer.from('Herzlichen Glückwunsch!', 'utf8'), zeit: new Date(2027, 5, 14, 18, 30, 12) },
    { name: 'aufnahmen/zweites.jpg', daten: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]) },
  ];
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'fotobox-zip-'));
  try {
    const datei = path.join(ordner, 'test.zip');
    fs.writeFileSync(datei, zip(eintraege));

    // Verzeichnis: alle Namen müssen auftauchen
    const liste = execFileSync('unzip', ['-l', datei], { encoding: 'utf8' });
    eintraege.forEach((e) => assert.ok(liste.includes(e.name), `Name fehlt in unzip -l: ${e.name}`));
    assert.ok(liste.includes('2 files'), 'unzip -l meldet nicht genau 2 Dateien');

    // Inhalte: byte-genau gleich
    eintraege.forEach((e) => {
      const inhalt = execFileSync('unzip', ['-p', datei, e.name]);
      assert.deepEqual(inhalt, e.daten, `Inhalt stimmt nicht: ${e.name}`);
    });

    // Prüfsummen laut Archiv müssen stimmen
    execFileSync('unzip', ['-tq', datei]);
  } finally {
    fs.rmSync(ordner, { recursive: true, force: true });
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
