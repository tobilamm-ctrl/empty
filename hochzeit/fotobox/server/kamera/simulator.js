/*
 * Kamera-Simulator: liefert Livebild und Fotos aus gezeichneten Gästen. Gleiche Schnittstelle wie die echte Kamera:
 *   start(), livebild() → jpeg-Buffer, ausloesen() → jpeg-Buffer, neueSzene(), status(), fehlerSetzen(text|null)
 */
'use strict';
const { createCanvas } = require('@napi-rs/canvas');
const { zeichneSzene } = require('../szene');

function kameraSimulator() {
  let seed = 7, fehler = null, aufnahme = 0;
  const live = createCanvas(960, 640), lctx = live.getContext('2d');
  return {
    name: 'Simulator',
    async start() {},
    neueSzene() { seed = Math.floor(Math.random() * 1e6); aufnahme = 0; },
    async livebild() {
      if (fehler) throw new Error(fehler);
      zeichneSzene(lctx, 960, 640, Date.now() / 1000, seed + aufnahme * 13);
      return live.toBuffer('image/jpeg', 72);
    },
    async ausloesen() {
      if (fehler) throw new Error(fehler);
      const c = createCanvas(1500, 1000);
      zeichneSzene(c.getContext('2d'), 1500, 1000, Date.now() / 1000, seed + aufnahme * 13);
      aufnahme++;
      return c.toBuffer('image/jpeg', 92);
    },
    status() { return fehler ? { ok: false, text: fehler } : { ok: true, text: 'bereit (Simulator)' }; },
    fehlerSetzen(text) { fehler = text || null; },
  };
}

module.exports = { kameraSimulator };
