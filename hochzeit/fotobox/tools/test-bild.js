/*
 * Test Druckbild: beide Layouts (Rahmen, Vollbild) für Einzelfoto und Fotostreifen in 10 × 15 cm bei 300 dpi.
 *   node tools/test-bild.js [ordner]  – mit Ordner werden die Bilder zum Ansehen dort gespeichert.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadImage } = require('@napi-rs/canvas');
const bild = require('../server/bild');
const { gestaltung } = require('../server/gestaltung');
const { kameraSimulator } = require('../server/kamera/simulator');

(async () => {
  bild.schriftenLaden(path.join(__dirname, '..', 'schriften'));
  const kamera = kameraSimulator();
  const fotos = [];
  for (let i = 0; i < 4; i++) fotos.push(await kamera.ausloesen());
  const g = gestaltung({ farbwelt: 'champagner', schriftstil: 'romantisch' });
  const ordner = process.argv[2];
  const erwartet = { einzel: [1800, 1200], streifen: [1200, 1800] };
  for (const layout of ['rahmen', 'vollbild']) {
    for (const modus of ['einzel', 'streifen']) {
      const jpg = await bild.zusammensetzen({ modus, layout, fotos: modus === 'einzel' ? fotos.slice(0, 1) : fotos, g, namen: 'Anna & Max', datum: '14. Juni 2027' });
      const img = await loadImage(jpg);
      assert.deepEqual([img.width, img.height], erwartet[modus], `${layout}/${modus}: Größe`);
      if (ordner) fs.writeFileSync(path.join(ordner, `druck-${layout}-${modus}.jpg`), jpg);
      console.log(`ok – ${layout}, ${modus}: ${img.width} × ${img.height}`);
    }
  }
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
