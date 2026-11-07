/*
 * Test Druckbild: alle Layouts (Rahmen, Vollbild, Polaroid, Elegant) und Filter für Einzelfoto und Fotostreifen in 10 × 15 cm bei 300 dpi.
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
  const { createCanvas } = require('@napi-rs/canvas');
  const logo = createCanvas(300, 120).toBuffer('image/png');
  for (const layout of Object.keys(bild.LAYOUTS)) {
    for (const modus of ['einzel', 'streifen']) {
      for (const mitLogo of [false, true]) {
        const jpg = await bild.zusammensetzen({ modus, layout, fotos: modus === 'einzel' ? fotos.slice(0, 1) : fotos, g, namen: 'Anna & Max', datum: '14. Juni 2027', logo: mitLogo ? logo : null });
        const img = await loadImage(jpg);
        assert.deepEqual([img.width, img.height], erwartet[modus], `${layout}/${modus}: Größe`);
        if (ordner) fs.writeFileSync(path.join(ordner, `druck-${layout}-${modus}${mitLogo ? '-logo' : ''}.jpg`), jpg);
        console.log(`ok – ${layout}, ${modus}${mitLogo ? ' mit Logo' : ''}: ${img.width} × ${img.height}`);
      }
    }
  }
  // unbekanntes Layout → rahmen
  const unb = await bild.zusammensetzen({ modus: 'einzel', layout: 'gibtsnicht', fotos: fotos.slice(0, 1), g, namen: 'A', datum: 'B' });
  assert.deepEqual(unb, await bild.zusammensetzen({ modus: 'einzel', layout: 'rahmen', fotos: fotos.slice(0, 1), g, namen: 'A', datum: 'B' }), 'unbekanntes Layout = rahmen');
  console.log('ok – unbekanntes Layout fällt auf rahmen zurück');

  // Filter
  const mittel = async (jpg) => {
    const im = await loadImage(jpg), cv = createCanvas(im.width, im.height), cx = cv.getContext('2d');
    cx.drawImage(im, 0, 0);
    const p = cx.getImageData(0, 0, im.width, im.height).data;
    let r = 0, gg = 0, b = 0, n = p.length / 4, maxAbw = 0;
    for (let i = 0; i < p.length; i += 4) { r += p[i]; gg += p[i + 1]; b += p[i + 2]; maxAbw = Math.max(maxAbw, Math.abs(p[i] - p[i + 1]), Math.abs(p[i + 1] - p[i + 2])); }
    return { r: r / n, g: gg / n, b: b / n, hell: (r + gg + b) / 3 / n, maxAbw, w: im.width, h: im.height };
  };
  const orig = await mittel(fotos[0]);
  for (const f of Object.keys(bild.FILTER)) {
    const out = await bild.filtern(fotos[0], f);
    const m = await mittel(out);
    assert.deepEqual([m.w, m.h], [orig.w, orig.h], `${f}: Größe`);
    if (f === 'farbe') assert.ok(Buffer.compare(out, fotos[0]) === 0, 'farbe: unverändert');
    if (f === 'sw') assert.ok(m.maxAbw <= 3, 'sw: r=g=b (JPEG-Toleranz)');
    if (f === 'vintage') assert.ok(m.r > m.b, 'vintage: warm (Rot > Blau)');
    if (f === 'weich') assert.ok(m.hell > orig.hell, 'weich: heller als das Original');
    if (ordner) fs.writeFileSync(path.join(ordner, `filter-${f}.jpg`), out);
    console.log(`ok – Filter ${f}: ${m.w} × ${m.h}, Helligkeit ${m.hell.toFixed(0)} (Original ${orig.hell.toFixed(0)})`);
  }
  const alias = await mittel(await bild.schwarzweiss(fotos[0]));
  assert.ok(alias.maxAbw <= 3, 'schwarzweiss: Alias von sw');
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
