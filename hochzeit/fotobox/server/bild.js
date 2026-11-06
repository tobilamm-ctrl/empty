/*
 * Bildbearbeitung: Schwarzweiß und das Druckbild 10 × 15 cm (300 dpi) mit Rahmen, Namen und Datum.
 *   Einzelfoto: 1800 × 1200 (quer). Fotostreifen: 1200 × 1800 (hoch) mit zwei gleichen Streifen zum Durchschneiden.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

const geladen = new Set();
// Alle Schriften (woff2/ttf/otf) eines Ordners anmelden. Familienname aus dem Dateinamen,
// z. B. „great-vibes-latin-400-normal.woff2“ → „Great Vibes“; eigene Schriften: <familie>.<endung>
function schriftenLaden(ordner) {
  if (!fs.existsSync(ordner)) return [];
  const namen = [];
  fs.readdirSync(ordner).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)).forEach((f) => {
    const datei = path.join(ordner, f);
    if (geladen.has(datei)) return;
    const basis = f.replace(/\.(woff2?|ttf|otf)$/i, '');
    const familie = /-latin-/.test(basis)
      ? basis.split('-latin-')[0].split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : basis;
    if (GlobalFonts.registerFromPath(datei, familie)) { geladen.add(datei); namen.push(familie); }
  });
  return [...new Set(namen)];
}

function cover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

async function schwarzweiss(jpeg) {
  const img = await loadImage(jpeg);
  const c = createCanvas(img.width, img.height), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const y = Math.min(255, (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) * 1.05);
    p[i] = p[i + 1] = p[i + 2] = y;
  }
  ctx.putImageData(d, 0, 0);
  return c.toBuffer('image/jpeg', 92);
}

// Text auf maxBreite verkleinern statt abschneiden
function passend(ctx, text, schrift, groesse, maxBreite) {
  let g = groesse;
  do { ctx.font = schrift.replace('{g}', g); g -= 2; } while (ctx.measureText(text).width > maxBreite && g > 12);
}

// { modus: 'einzel'|'streifen', fotos: [jpeg-Buffer], g: gestaltung(), namen, datum } → jpeg-Buffer
async function zusammensetzen({ modus, fotos, g, namen, datum }) {
  const bilder = await Promise.all(fotos.map((f) => loadImage(f)));
  const tinte = '#262521';
  const namenFont = `{g}px "${g.namenSchrift}", Georgia, serif`;
  const datumFont = `600 {g}px "${g.textSchrift}", sans-serif`;
  const schreibschrift = /vibes|script|parisienne/i.test(g.namenSchrift);
  let c, ctx;
  if (modus === 'streifen') {
    c = createCanvas(1200, 1800); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1200, 1800);
    for (let k = 0; k < 2; k++) {
      const ox = k * 600;
      bilder.slice(0, 4).forEach((b, j) => cover(ctx, b, ox + 40, 40 + j * 365, 520, 345));
      ctx.textAlign = 'center'; ctx.fillStyle = tinte;
      passend(ctx, namen, namenFont, schreibschrift ? 78 : 58, 520);
      ctx.fillText(namen, ox + 300, 1612);
      ctx.fillStyle = g.akzent; passend(ctx, datum.toUpperCase(), datumFont, 26, 520);
      ctx.fillText(datum.toUpperCase(), ox + 300, 1672);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.moveTo(600, 0); ctx.lineTo(600, 1800); ctx.stroke(); ctx.setLineDash([]);
  } else {
    c = createCanvas(1800, 1200); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1800, 1200);
    cover(ctx, bilder[0], 70, 70, 1660, 900);
    ctx.strokeStyle = g.akzent; ctx.lineWidth = 3; ctx.strokeRect(46, 46, 1708, 948);
    ctx.textAlign = 'center'; ctx.fillStyle = tinte;
    passend(ctx, namen, namenFont, schreibschrift ? 120 : 92, 1500);
    ctx.fillText(namen, 900, 1100);
    ctx.fillStyle = g.akzent; passend(ctx, datum.toUpperCase(), datumFont, 34, 1500);
    ctx.fillText(datum.toUpperCase(), 900, 1160);
  }
  return c.toBuffer('image/jpeg', 92);
}

module.exports = { schriftenLaden, schwarzweiss, zusammensetzen };
