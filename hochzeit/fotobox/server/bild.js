/*
 * Bildbearbeitung: Schwarzweiß und das Druckbild 10 × 15 cm (300 dpi) mit Namen und Datum.
 *   Einzelfoto: 1800 × 1200 (quer). Fotostreifen: 1200 × 1800 (hoch) mit zwei gleichen Streifen zum Durchschneiden.
 *   layout 'rahmen': Foto kleiner mit hellem Rand, Text darunter. layout 'vollbild': Foto randlos, Text weiß
 *   auf einem dunklen Verlauf im Bild – mit mindestens 90 px (ca. 7,5 mm) Abstand zum Rand, weil der Selphy
 *   beim randlosen Druck an den Kanten etwas abschneidet.
 *   logo: Bild (PNG/JPEG) statt der Namen, z. B. das Monogramm der Einladung.
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

// Dunkler Verlauf von unten, damit weiße Schrift auf jedem Foto lesbar bleibt
function verlauf(ctx, x, y, w, h) {
  const v = ctx.createLinearGradient(0, y, 0, y + h);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.55, 'rgba(0,0,0,0.38)'); v.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = v; ctx.fillRect(x, y, w, h);
}
function schatten(ctx, an) {
  ctx.shadowColor = an ? 'rgba(0,0,0,0.45)' : 'transparent'; ctx.shadowBlur = an ? 12 : 0; ctx.shadowOffsetY = an ? 2 : 0;
}

// { modus: 'einzel'|'streifen', layout: 'rahmen'|'vollbild', fotos: [jpeg-Buffer], g: gestaltung(), namen, datum } → jpeg-Buffer
async function zusammensetzen({ modus, layout = 'rahmen', fotos, g, namen, datum, logo = null }) {
  const bilder = await Promise.all(fotos.map((f) => loadImage(f)));
  const logoBild = logo ? await loadImage(logo).catch(() => null) : null;
  if (layout === 'vollbild') return vollbild({ modus, bilder, g, namen, datum, logoBild });
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
      if (logoBild) einpassen(ctx, logoBild, ox + 300, 1496, 520, 128);
      else { passend(ctx, namen, namenFont, schreibschrift ? 78 : 58, 520); ctx.fillText(namen, ox + 300, 1612); }
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
    if (logoBild) einpassen(ctx, logoBild, 900, 1008, 1200, 116);
    else { passend(ctx, namen, namenFont, schreibschrift ? 120 : 92, 1500); ctx.fillText(namen, 900, 1100); }
    ctx.fillStyle = g.akzent; passend(ctx, datum.toUpperCase(), datumFont, 34, 1500);
    ctx.fillText(datum.toUpperCase(), 900, 1160);
  }
  return c.toBuffer('image/jpeg', 92);
}

function vollbild({ modus, bilder, g, namen, datum, logoBild }) {
  const namenFont = `{g}px "${g.namenSchrift}", Georgia, serif`;
  const datumFont = `600 {g}px "${g.textSchrift}", sans-serif`;
  const schreibschrift = /vibes|script|parisienne/i.test(g.namenSchrift);
  const datumText = datum.toUpperCase();
  let c, ctx;
  if (modus === 'streifen') {
    // zwei gleiche Streifen à 600 × 1800, je vier Bilder 600 × 450 ohne Abstand; Text auf dem letzten Bild
    c = createCanvas(1200, 1800); ctx = c.getContext('2d');
    for (let k = 0; k < 2; k++) {
      const ox = k * 600;
      bilder.slice(0, 4).forEach((b, j) => cover(ctx, b, ox, j * 450, 600, 450));
      verlauf(ctx, ox, 1530, 600, 270);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; schatten(ctx, true);
      if (logoBild) { schatten(ctx, false); einpassen(ctx, logoBild, ox + 300, 1566, 440, 112); schatten(ctx, true); }
      else { passend(ctx, namen, namenFont, schreibschrift ? 72 : 54, 440); ctx.fillText(namen, ox + 300, 1668); }
      passend(ctx, datumText, datumFont, 24, 440);
      ctx.fillText(datumText, ox + 300, 1712);
      schatten(ctx, false);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(600, 0); ctx.lineTo(600, 1800); ctx.stroke();
  } else {
    c = createCanvas(1800, 1200); ctx = c.getContext('2d');
    cover(ctx, bilder[0], 0, 0, 1800, 1200);
    verlauf(ctx, 0, 820, 1800, 380);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; schatten(ctx, true);
    if (logoBild) { schatten(ctx, false); einpassen(ctx, logoBild, 900, 906, 1200, 140); schatten(ctx, true); }
    else { passend(ctx, namen, namenFont, schreibschrift ? 120 : 92, 1500); ctx.fillText(namen, 900, 1040); }
    passend(ctx, datumText, datumFont, 34, 1500);
    ctx.fillText(datumText, 900, 1100);
    schatten(ctx, false);
  }
  return c.toBuffer('image/jpeg', 92);
}

// Logo/Monogramm statt der Namen: mittig bei cx, oben bei y, in maxB × maxH eingepasst (Seitenverhältnis bleibt)
function einpassen(ctx, img, cx, y, maxB, maxH) {
  const s = Math.min(maxB / img.width, maxH / img.height), w = img.width * s, h = img.height * s;
  ctx.drawImage(img, cx - w / 2, y + (maxH - h) / 2, w, h);
}

// Feinkorrektur für den Drucker: ganzes Bild um mm verschieben (300 dpi), frei werdender Rand in „farbe“
async function versetzen(jpeg, mmX, mmY, farbe) {
  const img = await loadImage(jpeg);
  const c = createCanvas(img.width, img.height), ctx = c.getContext('2d');
  ctx.fillStyle = farbe; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, Math.round(mmX * 300 / 25.4), Math.round(mmY * 300 / 25.4));
  return c.toBuffer('image/jpeg', 92);
}

module.exports = { schriftenLaden, schwarzweiss, zusammensetzen, versetzen };
