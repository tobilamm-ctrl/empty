/*
 * Führt alle tools/test-*.js nacheinander aus. Ergebnis: Exit-Code 1, wenn eine Datei fehlschlägt.
 * Start: node tools/alle-tests.js   (oder npm test)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ordner = __dirname;
const dateien = fs.readdirSync(ordner).filter((f) => /^test-.*\.js$/.test(f)).sort();

const fehlgeschlagen = [];
for (const datei of dateien) {
  console.log(`\n=== ${datei} ===`);
  const ergebnis = spawnSync(process.execPath, [path.join(ordner, datei)], { stdio: 'inherit' });
  if (ergebnis.status !== 0) fehlgeschlagen.push(datei);
}

console.log('\n=== Zusammenfassung ===');
console.log(`${dateien.length - fehlgeschlagen.length} von ${dateien.length} Testdateien bestanden`);
if (fehlgeschlagen.length) {
  console.error('Fehlgeschlagen: ' + fehlgeschlagen.join(', '));
  process.exit(1);
}
