/*
 * Gestaltung: dieselben Farbwelten und Schriftstile wie im Sitzplantool (js/theme.js), damit Fotobox,
 * Einladungen und Tischkarten zusammenpassen. Die Fotobox-Oberfläche ist dunkel (abends im Saal),
 * Akzentfarbe und Schriften kommen aus der Farbwelt; der Druckrahmen nutzt die helle Hintergrundfarbe.
 */
'use strict';

const FARBWELTEN = {
  rose: { label: 'Rosé & Creme', akzent: '#a4506a', papier: '#f8f3ee' },
  salbei: { label: 'Salbei & Eukalyptus', akzent: '#5b7a64', papier: '#f2f4ef' },
  champagner: { label: 'Champagner & Gold', akzent: '#9a7433', papier: '#f8f4ec' },
  navy: { label: 'Nachtblau & Gold', akzent: '#2a426b', papier: '#f3f4f7' },
  terrakotta: { label: 'Terrakotta (Boho)', akzent: '#b0603d', papier: '#f8f1ea' },
  festlich: { label: 'Bordeaux & Gold (festlich)', akzent: '#8c2f45', papier: '#f8f2ee' },
  business: { label: 'Blaugrau (Business)', akzent: '#2f5d7c', papier: '#f2f4f6' },
  pastell: { label: 'Pastell (Hellblau & Mint)', akzent: '#5f8fb0', papier: '#f4f7f8' },
  bunt: { label: 'Bunt & fröhlich', akzent: '#d2563b', papier: '#fbf6ef' },
  flieder: { label: 'Flieder & Silber', akzent: '#7a5d9b', papier: '#f5f3f7' },
};

const SCHRIFTSTILE = {
  klassisch: { label: 'Klassisch (Serifen)', kopf: 'Cormorant Garamond', namen: 'Cormorant Garamond' },
  romantisch: { label: 'Romantisch (Schreibschrift für Namen)', kopf: 'Cormorant Garamond', namen: 'Great Vibes' },
  modern: { label: 'Modern (schlicht)', kopf: 'Josefin Sans', namen: 'Josefin Sans' },
};

const TEXT_SCHRIFT = 'Montserrat';

const hexRgb = (h) => { const n = parseInt(String(h).replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
// a mit Anteil t von b mischen
const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
const hell = (h) => { const [r, g, b] = hexRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const gueltigeFarbe = (h) => /^#[0-9a-f]{6}$/i.test(String(h || ''));

// Einstellungen → alles, was Oberfläche und Druckbild brauchen
function gestaltung(e) {
  const welt = FARBWELTEN[e.farbwelt] || FARBWELTEN.champagner;
  const stil = SCHRIFTSTILE[e.schriftstil] || SCHRIFTSTILE.klassisch;
  const akzent = gueltigeFarbe(e.akzent) ? e.akzent : welt.akzent;
  // Akzent auf dunklem Grund aufhellen, damit Knöpfe und Zahlen gut lesbar bleiben
  const leuchtend = hell(akzent) < 0.55 ? mix(akzent, '#ffffff', 0.38) : akzent;
  return {
    farbwelt: FARBWELTEN[e.farbwelt] ? e.farbwelt : 'champagner',
    akzent,
    papier: welt.papier,
    kopfSchrift: stil.kopf,
    namenSchrift: e.namenSchrift || stil.namen,
    textSchrift: TEXT_SCHRIFT,
    css: {
      '--grund': mix(akzent, '#0a0c0b', 0.88),
      '--flaeche': mix(akzent, '#0a0c0b', 0.80),
      '--flaeche-2': mix(akzent, '#0a0c0b', 0.72),
      '--linie': mix(akzent, '#0a0c0b', 0.60),
      '--tinte': '#f1ece3',
      '--leise': mix('#f1ece3', mix(akzent, '#0a0c0b', 0.88), 0.38),
      '--akzent': leuchtend,
      '--akzent-tinte': hell(leuchtend) > 0.6 ? '#1b1710' : '#ffffff',
      '--kopf': `"${stil.kopf}", Georgia, serif`,
      '--namen': `"${e.namenSchrift || stil.namen}", Georgia, serif`,
      '--text': `"${TEXT_SCHRIFT}", "Segoe UI", system-ui, sans-serif`,
    },
  };
}

module.exports = { FARBWELTEN, SCHRIFTSTILE, gestaltung, mix };
