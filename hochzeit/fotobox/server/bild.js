/*
 * Bildbearbeitung: Schwarzweiß und das Druckbild 10 × 15 cm (300 dpi) mit Namen und Datum.
 *   Einzelfoto: 1800 × 1200 (quer). Fotostreifen: 1200 × 1800 (hoch) mit zwei gleichen Streifen zum Durchschneiden.
 *   Filter (filtern): farbe, sw, vintage, weich. Layouts: rahmen, vollbild, polaroid, elegant (siehe LAYOUTS).
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

// Filter für das Foto (JPEG rein, JPEG raus, gleiche Größe): 'farbe' | 'sw' | 'vintage' | 'weich'
const FILTER = { farbe: 'Farbe', sw: 'Schwarzweiß', vintage: 'Vintage', weich: 'Hell & weich' };
const LAYOUTS = { rahmen: 'mit hellem Rand', vollbild: 'Vollbild', polaroid: 'Polaroid', elegant: 'Elegant (Doppellinie)' };

async function filtern(jpeg, filter) {
  if (!FILTER[filter] || filter === 'farbe') return jpeg;
  const img = await loadImage(jpeg);
  const B = img.width, H = img.height;
  const c = createCanvas(B, H), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  if (filter === 'weich') {
    // sanftes Leuchten: weichgezeichnete Kopie im Aufhellen-Modus darüberlegen, dann heller und flacher
    const k = createCanvas(B, H), kc = k.getContext('2d');
    kc.filter = `blur(${Math.max(6, Math.round(B / 140))}px)`;
    kc.drawImage(img, 0, 0);
    ctx.globalAlpha = 0.45; ctx.drawImage(k, 0, 0); ctx.globalAlpha = 1;
  }
  const d = ctx.getImageData(0, 0, B, H), p = d.data;
  const cx = B / 2, cy = H / 2, rmax2 = cx * cx + cy * cy;
  for (let i = 0, n = 0; i < p.length; i += 4, n++) {
    let r = p[i], g = p[i + 1], b = p[i + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    if (filter === 'sw') {
      r = g = b = Math.min(255, y * 1.05);
    } else if (filter === 'vintage') {
      // Sättigung senken, Sepia-Tönung, Schwarz anheben (verblasst), Vignette
      r = y + (r - y) * 0.7; g = y + (g - y) * 0.7; b = y + (b - y) * 0.7;
      const sr = Math.min(255, y * 1.07 + 18), sg = Math.min(255, y * 0.95 + 8), sb = Math.min(255, y * 0.76);
      r = r * 0.5 + sr * 0.5; g = g * 0.5 + sg * 0.5; b = b * 0.5 + sb * 0.5;
      r = 28 + r * 0.89; g = 24 + g * 0.89; b = 20 + b * 0.88;
      const x = n % B - cx, yy = ((n / B) | 0) - cy, t = (x * x + yy * yy) / rmax2;
      const v = 1 - 0.5 * t * t - 0.12 * t;
      r *= v; g *= v; b *= v;
    } else {
      // hell & weich: Kontrast senken, aufhellen, leicht warm
      r = 128 + (r - 128) * 0.85 + 22; g = 128 + (g - 128) * 0.85 + 20; b = 128 + (b - 128) * 0.85 + 12;
    }
    p[i] = r < 0 ? 0 : r > 255 ? 255 : r; p[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; p[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(d, 0, 0);
  return c.toBuffer('image/jpeg', 92);
}
const schwarzweiss = (jpeg) => filtern(jpeg, 'sw');

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
  if (layout === 'polaroid') return polaroid({ modus, bilder, g, namen, datum, logoBild });
  if (layout === 'elegant') return elegant({ modus, bilder, g, namen, datum, logoBild });
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

// Foto mit zartem Schatten (für Polaroid)
function mitSchatten(ctx, img, x, y, w, h) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h); ctx.restore();
  cover(ctx, img, x, y, w, h);
}
function schnittlinie(ctx) {
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([14, 12]);
  ctx.beginPath(); ctx.moveTo(600, 0); ctx.lineTo(600, 1800); ctx.stroke(); ctx.setLineDash([]);
}
function schriften(g) {
  return {
    namenFont: `{g}px "${g.namenSchrift}", Georgia, serif`,
    datumFont: `600 {g}px "${g.textSchrift}", sans-serif`,
    schreibschrift: /vibes|script|parisienne/i.test(g.namenSchrift),
    tinte: '#262521',
  };
}

// Polaroid: gleichmäßiger Rand links/oben/rechts, tiefer Rand unten mit Namen und Datum
function polaroid({ modus, bilder, g, namen, datum, logoBild }) {
  const { namenFont, datumFont, schreibschrift, tinte } = schriften(g);
  const datumText = datum.toUpperCase();
  let c, ctx;
  if (modus === 'streifen') {
    c = createCanvas(1200, 1800); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1200, 1800);
    for (let k = 0; k < 2; k++) {
      const ox = k * 600;
      bilder.slice(0, 4).forEach((b, j) => mitSchatten(ctx, b, ox + 40, 40 + j * 366, 520, 346));
      ctx.textAlign = 'center'; ctx.fillStyle = tinte;
      if (logoBild) einpassen(ctx, logoBild, ox + 300, 1500, 420, 130);
      else { passend(ctx, namen, namenFont, schreibschrift ? 78 : 56, 420); ctx.fillText(namen, ox + 300, 1610); }
      ctx.fillStyle = g.akzent; passend(ctx, datumText, datumFont, 26, 420);
      ctx.fillText(datumText, ox + 300, 1685);
    }
    schnittlinie(ctx);
  } else {
    c = createCanvas(1800, 1200); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1800, 1200);
    mitSchatten(ctx, bilder[0], 60, 60, 1680, 840);
    ctx.textAlign = 'center'; ctx.fillStyle = tinte;
    if (logoBild) einpassen(ctx, logoBild, 900, 925, 1200, 130);
    else { passend(ctx, namen, namenFont, schreibschrift ? 120 : 90, 1500); ctx.fillText(namen, 900, 1025); }
    ctx.fillStyle = g.akzent; passend(ctx, datumText, datumFont, 34, 1500);
    ctx.fillText(datumText, 900, 1095);
  }
  return c.toBuffer('image/jpeg', 92);
}

// kleine Raute (Zierde)
function raute(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill();
}
// Doppellinie (außen + innen, 12 px Abstand) mit Rauten an den äußeren Ecken
function doppellinie(ctx, g, x, y, w, h) {
  ctx.strokeStyle = g.akzent; ctx.fillStyle = g.akzent;
  ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2; ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
  // Ecken: Fläche hinter der Raute mit Papier abdecken, damit die Linien sauber enden
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([px, py]) => {
    ctx.fillStyle = g.papier; ctx.fillRect(px - 14, py - 14, 28, 28);
    ctx.fillStyle = g.akzent; raute(ctx, px, py, 13);
    ctx.fillStyle = g.papier; raute(ctx, px, py, 6); ctx.fillStyle = g.akzent; raute(ctx, px, py, 3);
  });
}
// Datum zwischen zwei kurzen Linien, mit kleiner Raute außen an jeder Linie
function datumMitLinien(ctx, g, text, font, groesse, cx, y, maxB) {
  passend(ctx, text, font, groesse, maxB);
  const b = ctx.measureText(text).width, gap = 22, len = Math.min(70, Math.max(30, (maxB - b) / 2 - gap));
  ctx.fillStyle = g.akzent; ctx.textAlign = 'center'; ctx.fillText(text, cx, y);
  const ly = y - groesse * 0.36;
  ctx.strokeStyle = g.akzent; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(cx - b / 2 - gap, ly); ctx.lineTo(cx - b / 2 - gap - len, ly);
  ctx.moveTo(cx + b / 2 + gap, ly); ctx.lineTo(cx + b / 2 + gap + len, ly); ctx.stroke();
  raute(ctx, cx - b / 2 - gap - len - 8, ly, 4); raute(ctx, cx + b / 2 + gap + len + 8, ly, 4);
}

// Elegant: Doppellinie in der Akzentfarbe um Foto und Text, Zierrauten in den Ecken
function elegant({ modus, bilder, g, namen, datum, logoBild }) {
  const { namenFont, datumFont, schreibschrift, tinte } = schriften(g);
  const datumText = datum.toUpperCase();
  let c, ctx;
  if (modus === 'streifen') {
    c = createCanvas(1200, 1800); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1200, 1800);
    for (let k = 0; k < 2; k++) {
      const ox = k * 600;
      doppellinie(ctx, g, ox + 28, 28, 544, 1744);
      bilder.slice(0, 4).forEach((b, j) => cover(ctx, b, ox + 60, 60 + j * 346, 480, 330));
      ctx.textAlign = 'center'; ctx.fillStyle = tinte;
      if (logoBild) einpassen(ctx, logoBild, ox + 300, 1450, 400, 120);
      else { passend(ctx, namen, namenFont, schreibschrift ? 76 : 54, 400); ctx.fillText(namen, ox + 300, 1550); }
      datumMitLinien(ctx, g, datumText, datumFont, 24, ox + 300, 1650, 420);
    }
    schnittlinie(ctx);
  } else {
    c = createCanvas(1800, 1200); ctx = c.getContext('2d');
    ctx.fillStyle = g.papier; ctx.fillRect(0, 0, 1800, 1200);
    doppellinie(ctx, g, 40, 40, 1720, 1120);
    cover(ctx, bilder[0], 80, 80, 1640, 780);
    ctx.textAlign = 'center'; ctx.fillStyle = tinte;
    if (logoBild) einpassen(ctx, logoBild, 900, 880, 1100, 120);
    else { passend(ctx, namen, namenFont, schreibschrift ? 108 : 82, 1400); ctx.fillText(namen, 900, 975); }
    datumMitLinien(ctx, g, datumText, datumFont, 32, 900, 1075, 1200);
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

module.exports = { schriftenLaden, FILTER, LAYOUTS, filtern, schwarzweiss, zusammensetzen, versetzen };
