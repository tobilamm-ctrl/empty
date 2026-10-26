import { SyncStore, api, newId } from './store.js';
import installKacheln from './kacheln.js';
import installNavigation from './navigation.js';
import installMore from './mehr.js';
import installMapEdit from './kartenedit.js';
import installTestdaten from './testdaten.js';
import installExtras from './extras.js';
import installSpiele from './spiele.js';
import installIdeen from './ideen.js';
import installExport from './export.js';
import installUnterwegs from './unterwegs.js';
import installTeilen from './teilen.js';
import installFotos from './fotos.js';
import installReisepass from './reisepass.js';
import installPackhilfe from './packhilfe.js';
import installFamilie from './familie.js';
import installFilm from './film.js';
import installAlltag from './alltag.js';
import installZeitachse from './zeitachse.js';
import installWelt from './welt.js';
import installAuswertung from './auswertung.js';
import installAbenteuer from './abenteuer.js';
import installWeitergeben from './weitergeben.js';
import installDraussen from './draussen.js';
import installZuladung from './zuladung.js';
import installStellplatz from './stellplatz.js';
import installFamilienrat from './familienrat.js';
import installFahrspiele from './fahrspiele.js';
import installMitteilen from './mitteilen.js';
import installTickets from './tickets.js';
import installLabyrinth from './labyrinth.js';
import installSprache from './sprache.js';
import installEintragen from './eintragen.js';
import installFotoansicht from './fotoansicht.js';
import installHerzen from './herzen.js';
import installLesen from './lesen.js';
import installKartenebenen from './kartenebenen.js';
import installBedienung from './bedienung.js';
import installFahrzeuge from './fahrzeuge.js';
import installInfos from './infos.js';

/* ---------- Konstanten ---------- */

// Versionsnummer: gleich wie VERSION in sw.js und wie die Nummer im Dateinamen der Lieferung (lammping-komplett-NN.zip)
const APP_VERSION = 40;

const TRIP_COLORS = [
  ['Petrol', '#0F6670'], ['Koralle', '#E4572E'], ['Senf', '#C9961A'], ['Moos', '#4F8A3C'],
  ['Pflaume', '#7B4B94'], ['Himmel', '#2E7FB8'], ['Rost', '#A4462B'], ['Schiefer', '#46596E'],
];

const ICONS = {
  stellplatz: '<path d="M3 19 12 5l9 14H3zM9.5 19l2.5-4 2.5 4"/>',
  sight: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  notiz: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
  car: '<path d="M3 16v-4l2-5h14l2 5v4H3zM3 12h18"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  print: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z"/>',
  near: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8v6M8 11h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunset: '<path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 4v4M4.6 9.6l1.8 1.4M19.4 9.6l-1.8 1.4M9 21h6"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M13 5v14M15.5 9h3M15.5 12h3M6 9h4M6 12h4"/><rect x="16" y="14" width="3" height="3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M15 9.5a3.5 3.5 0 1 0 0 5M8 11h5M8 13h5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  mountain: '<path d="M2 20 9 7l4 7 3-4 6 10z"/><path d="M7.5 10l1.5 1.5L10.5 10"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4M10.5 9.5v5l4-2.5z"/>',
  archive: '<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 21l5-2.5 5 2.5-1.5-7"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  tank: '<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M7 8h5v4H7zM14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-3"/>',
  service: '<path d="M12 3s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  einkauf: '<path d="M5 8h14l-1.5 12h-11zM9 8V6a3 3 0 0 1 6 0v2"/>',
  pause: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3M14 3v3"/>',
  route: '<path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  museum: '<path d="M3 9 12 4l9 5M4 9h16M5 19h14M3 21h18M6 9v10M10 9v10M14 9v10M18 9v10"/>',
  wanderung: '<circle cx="13" cy="4.5" r="1.8"/><path d="M11 21l2-6-2.5-2.5L12 8l3 3 3 1M10.5 12.5 8 21M12 8l-3.5 2L7 14M17 9v12"/>',
  baden: '<path d="M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><circle cx="16" cy="6" r="2"/><path d="m6 13 4-5 3 2 3-1"/>',
  restaurant: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 21V3c-2 1.5-3 4-3 7h3"/>',
  kinder: '<path d="M12 3a5 6 0 0 1 5 6c0 3-2.5 5.5-5 5.5S7 12 7 9a5 6 0 0 1 5-6zM12 14.5l-1 1.5h2zM12 16c0 2.5-2 3-2 5"/>',
  faehre: '<path d="M3 15h18l-2.5 4.5h-13zM6 15v-4h12v4M9 11V7h5v4M11 7V4"/><path d="M2 21.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>',
  werkstatt: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2zM4 20l3-3"/>',
  waesche: '<path d="M8 3 4 6l2 3 2-1v13h8V8l2 1 2-3-4-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// Eintragsarten: was das Formular zeigt (Kosten, Bewertung, Ausstattung, Tankdaten, Zusatzfelder),
// wohin Kosten gebucht werden (cost = Kategorie der Kasse) und in welcher Tagebuch-Gruppe sie stehen.
// Zusatzfelder (extras): options = Auswahl, num = Zahl, check = Häkchen; gespeichert in entry.extra
const TYPES = {
  stellplatz: { label: 'Stellplatz', many: 'Stellplätze', hint: 'Hier übernachten wir', cost: 'Stellplatz', rating: true, features: true,
    extras: [{ key: 'stay', label: 'Übernachtung', options: ['Campingplatz', 'Stellplatz', 'Frei stehen'] },
      { key: 'ground', label: 'Untergrund', options: ['Wiese', 'Schotter', 'Asphalt', 'Sand'] },
      { key: 'shade', label: 'Sonne', options: ['sonnig', 'halbschattig', 'schattig'] },
      { key: 'noise', label: 'Lärm', options: ['sehr ruhig', 'etwas Lärm', 'laut'] },
      { key: 'checkout', label: 'Abreise bis', text: true, ph: 'z. B. 11 Uhr' },
      { key: 'dogs', label: 'Hunde erlaubt', check: true },
      { key: 'again', label: 'Wiederkommen?', options: ['Gern wieder', 'Vielleicht', 'Lieber nicht'] }] },
  sight: { label: 'Sehenswert', many: 'Sehenswertes', hint: 'Ausflug, Aussicht, Altstadt', cost: 'Eintritt', rating: true, group: 'erleben' },
  museum: { label: 'Museum', many: 'Museen', hint: 'Ausstellung, Schloss, Kirche', cost: 'Eintritt', rating: true, group: 'erleben' },
  wanderung: { label: 'Wanderung / Radtour', many: 'Touren', hint: 'Länge, Höhenmeter, Strecke', rating: true, group: 'erleben', gpx: true,
    extras: [{ key: 'mode', label: 'Unterwegs', options: ['zu Fuß', 'mit dem Rad'] }, { key: 'km', label: 'Länge in km', num: true },
      { key: 'up', label: 'Höhenmeter', num: true }, { key: 'hours', label: 'Dauer in Stunden', num: true }] },
  baden: { label: 'Baden', many: 'Baden', hint: 'See, Meer, Freibad', cost: 'Eintritt', rating: true, group: 'erleben',
    extras: [{ key: 'where', label: 'Wo?', options: ['See', 'Meer', 'Fluss', 'Freibad'] }, { key: 'water', label: 'Wasser in °C', num: true }] },
  restaurant: { label: 'Café / Restaurant', many: 'Cafés & Restaurants', hint: 'Essen gehen, Kaffee, Eis', cost: 'Essen gehen', rating: true, group: 'erleben', minor: true },
  kinder: { label: 'Kinder-Highlight', many: 'Kinder-Highlights', hint: 'Spielplatz, Tierpark, Freizeitpark', cost: 'Eintritt', rating: true, group: 'erleben' },
  tank: { label: 'Tankstelle', many: 'Tankstopps', hint: 'Liter und Betrag ins Tankbuch', fuel: true, minor: true, group: 'unterwegs' },
  service: { label: 'Ver- & Entsorgung', many: 'Ver- & Entsorgung', hint: 'Wasser, Toilette, Grauwasser', cost: 'Stellplatz', rating: true, minor: true, group: 'unterwegs',
    extras: [{ key: 'water', label: 'Frischwasser aufgefüllt', check: true }] },
  einkauf: { label: 'Einkauf', many: 'Einkäufe', hint: 'Supermarkt, Markt, Bäcker', cost: 'Lebensmittel', minor: true, group: 'unterwegs' },
  pause: { label: 'Pause', many: 'Pausen', hint: 'Rast, Picknick, Aussicht', cost: 'Essen gehen', rating: true, minor: true, group: 'unterwegs' },
  faehre: { label: 'Fähre, Maut & Grenze', many: 'Fähre, Maut & Grenze', hint: 'Überfahrt, Mautstelle, Vignette', cost: 'Fähre', minor: true, group: 'unterwegs',
    extras: [{ key: 'kind', label: 'Was?', options: ['Fähre', 'Maut', 'Vignette', 'Grenze'] }],
    catOf: x => (x.kind === 'Fähre' || !x.kind ? 'Fähre' : 'Maut & Vignette') },
  werkstatt: { label: 'Werkstatt / Panne', many: 'Werkstatt', hint: 'Reparatur, Pannenhilfe', cost: 'Werkstatt', minor: true, group: 'unterwegs' },
  waesche: { label: 'Wäsche', many: 'Wäsche', hint: 'Waschsalon, Waschmaschine', cost: 'Wäsche', minor: true, group: 'unterwegs' },
  notiz: { label: 'Notiz', many: 'Notizen', hint: 'Gedanken zum Tag' },
};
const MINOR = Object.keys(TYPES).filter(k => TYPES[k].minor);
const typesIn = group => Object.keys(TYPES).filter(k => TYPES[k].group === group);
const costCat = (type, extra = {}) => (TYPES[type].catOf ? TYPES[type].catOf(extra) : TYPES[type].cost);
// Zusatzfelder eines Eintrags lesbar, z. B. „12 km, 650 Höhenmeter“
function extraText(e) {
  const x = e.extra || {};
  return (TYPES[e.type].extras || []).filter(f => x[f.key] !== undefined && x[f.key] !== '' && x[f.key] !== false && x[f.key] !== 0)
    .map(f => (f.check ? f.label : f.options ? x[f.key] : f.text ? `${f.label} ${x[f.key]}` : `${f.label.replace(/ in .*$/, '')}: ${String(x[f.key]).replace('.', ',')}${f.label.includes('°C') ? ' °C' : f.label.includes(' km') ? ' km' : ''}`))
    .join(', ');
}
const FEATURES = ['Strom', 'Wasser', 'Entsorgung', 'WC', 'Dusche', 'Ruhig', 'Eben', 'Aussicht', 'Kostenlos'];
const CATS = ['Stellplatz', 'Sprit', 'Lebensmittel', 'Essen gehen', 'Eintritt', 'Maut & Vignette', 'Fähre', 'Werkstatt', 'Wäsche', 'Ausrüstung', 'Sonstiges'];
const SETTLE = 'Ausgleich';

/* ---------- Zustand ---------- */

const S = {
  trips: [], entries: [], expenses: [], boxes: [], items: [], packstate: [], lists: [], listItems: [], meta: [],
  fuel: [], places: [], checklists: [], checkstate: [], deadlines: [], tracks: [],
  documents: [], recipes: [], plates: [], games: [], ideas: [], stamps: [],
};
const WATCHED = Object.keys(S);
let store = null;
let session = null;   // { user, crews } vom Server bzw. zuletzt bekannt
let crew = null;      // geöffnete Crew mit Mitgliedern
let gate = 'loading'; // setup | login | nocrew | offline | null (App läuft)
let syncState = { pending: 0, lastSync: 0, error: null, busy: false };

const LS = {
  get(k, d) { try { const v = localStorage.getItem('lp.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('lp.' + k, JSON.stringify(v)); } catch { /* privater Modus */ } },
};

const ui = {
  route: 'karte',
  mapScope: 'trip',
  diaryFilter: 'alle',
  diaryMode: {},        // je Reise: 'planung' oder 'tagebuch'
  showPlaces: LS.get('showPlaces', true),
  mapPins: LS.get('mapPins', 'alle'),    // Symbole auf der Karte: alle | nacht (nur Übernachtungen) | keine (nur Strecke)
  listTab: LS.get('listTab', 'einkauf'),
  packMode: 'packen',
  packQuery: '',
};

/* ---------- Hilfsfunktionen ---------- */

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
const pad = n => String(n).padStart(2, '0');

function nowLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const today = () => nowLocal().slice(0, 10);
const dayDate = key => new Date(key + 'T12:00');
const fmtDay = key => dayDate(key).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = key => dayDate(key).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = dt => (dt || '').slice(11, 16);

function fmtRange(t) {
  if (!t.start) return 'Noch ohne Datum';
  if (!t.end) return 'ab ' + fmtShort(t.start);
  const a = dayDate(t.start), b = dayDate(t.end);
  const left = a.getFullYear() === b.getFullYear()
    ? a.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
    : fmtShort(t.start);
  return `${left} bis ${fmtShort(t.end)}`;
}

function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? 'gestern' : `vor ${d} Tagen`;
}

function km(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtKm = d => d < 1 ? `${Math.round(d * 1000)} m` : `${d.toLocaleString('de-DE', { maximumFractionDigits: d < 10 ? 1 : 0 })} km`;
const hasPos = e => e && typeof e.lat === 'number' && typeof e.lng === 'number';

const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
function navUrl(p, walking) {
  return isApple
    ? `https://maps.apple.com/?daddr=${p.lat},${p.lng}&dirflg=${walking ? 'w' : 'd'}`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=${walking ? 'walking' : 'driving'}`;
}

function toast(msg) {
  const t = $('#toast');
  // Ein offenes Sheet liegt in der obersten Ebene, der Hinweis muss dort hinein
  const host = $('#sheet').open ? $('#sheet') : document.body;
  if (t.parentNode !== host) host.appendChild(t);
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// Schreiben ohne Warten: offline landet es in der Warteschlange von Firestore
function save(coll, doc) {
  doc.updatedAt = Date.now();
  statsMemo.clear();
  store.put(coll, doc).catch(e => toast('Speichern hat nicht geklappt: ' + e.message));
  return doc;
}
function remove(coll, id) {
  store.del(coll, id).catch(e => toast('Löschen hat nicht geklappt: ' + e.message));
}

/* ---------- Personen & Reisen ---------- */

const members = () => (crew && crew.members) || [];
const payers = () => members().filter(m => m.shares);
const me = () => session.user.id;
const canCash = () => !!session.user.canCash;
const personName = id => (members().find(m => m.id === id) || {}).name || 'Ehemaliges Mitglied';
const initial = id => (personName(id)[0] || '?').toUpperCase();
const setTrip = id => LS.set('trip.' + crew.id, id);

const sortTrips = list => list.slice().sort((a, b) => (b.start || '9').localeCompare(a.start || '9'));
const activeTrips = () => sortTrips(S.trips.filter(t => !t.archived));

function currentTrip() {
  const id = LS.get('trip.' + crew.id, null);
  // Ohne Auswahl: die gerade laufende Reise, sonst die neueste
  const running = activeTrips().find(t => !t.ended && t.start && t.start <= today() && (!t.end || t.end >= today()));
  return S.trips.find(t => t.id === id) || running || activeTrips()[0] || null;
}
const tripColor = t => (t && t.color) || '#0F6670';
const tripEntries = t => S.entries.filter(e => t && e.tripId === t.id);

// Kennzahlen einer Reise; je Zeichnen nur einmal berechnet (Tageskopf, Reisepass & Co. fragen oft)
const statsMemo = new Map();
function tripStats(t) {
  if (!statsMemo.has(t.id)) statsMemo.set(t.id, tripStatsNow(t));
  return statsMemo.get(t.id);
}
function tripStatsNow(t) {
  const es = tripEntries(t);
  const stops = es.filter(hasPos).sort(byDate);
  let dist = 0;
  for (let i = 1; i < stops.length; i++) dist += km(stops[i - 1], stops[i]);
  // Mit importierter GPX-Strecke zählt die tatsächlich gefahrene Strecke
  const tracks = S.tracks.filter(x => x.tripId === t.id && x.kind !== 'hike');
  const driven = tracks.length > 0;
  if (driven) dist = tracks.reduce((sum, x) => sum + (x.km || 0), 0);
  const cost = S.expenses.filter(x => x.tripId === t.id && x.cat !== SETTLE).reduce((s, x) => s + (x.amount || 0), 0);
  const firstDay = t.start || (es.slice().sort(byDate)[0] || {}).date?.slice(0, 10);
  const lastDay = t.end && t.end < today() ? t.end : today();
  const days = firstDay && firstDay <= lastDay ? Math.round((dayDate(lastDay) - dayDate(firstDay)) / 864e5) + 1 : 0;
  return {
    es, stops, dist, driven, cost, days, firstDay,
    nights: es.filter(e => e.type === 'stellplatz').length,
    sights: es.filter(e => e.type === 'sight' || e.type === 'museum').length,
  };
}

function nextColor() {
  const used = S.trips.map(t => t.color);
  return (TRIP_COLORS.find(([, c]) => !used.includes(c)) || TRIP_COLORS[S.trips.length % TRIP_COLORS.length])[1];
}

/* ---------- Ortung ---------- */

// Testmodus (testdaten.js) kann einen simulierten Standort liefern
let simulatedPos = () => null;

function getPos() {
  const sim = simulatedPos();
  if (sim) return Promise.resolve(sim);
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Dieses Gerät liefert keinen Standort.'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      e => reject(new Error(e.code === 1
        ? 'Der Standort ist nicht freigegeben. Erlaube ihn in den Browser-Einstellungen für diese Seite.'
        : 'Der Standort ließ sich nicht bestimmen. Versuch es unter freiem Himmel noch einmal.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
  });
}

// Ortsname und Ländercode (für die Statistik) über OpenStreetMap
async function placeInfo(p) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=de&lat=${p.lat}&lon=${p.lng}`);
    const a = (await r.json()).address || {};
    return { name: a.village || a.town || a.city || a.municipality || a.hamlet || a.county || '', cc: (a.country_code || '').toUpperCase() };
  } catch { return { name: '', cc: '' }; }
}

/* ---------- Fotos ---------- */

async function shrink(file, max, quality) {
  const bmp = await createImageBitmap(file);
  const f = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * f);
  c.height = Math.round(bmp.height * f);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

/* ---------- Seitenkopf mit Bereichsgrafik ---------- */

// Die Grafiken liegen als Symbole in index.html (#b-karte, #b-listen, …)
// Breite/Höhe je Grafik: alle gleich hoch, die Breite folgt dem Inhalt
const ART_RATIO = {"karte": 1.826, "tagebuch": 1.858, "listen": 1.84, "boxen": 1.883, "kasse": 1.826, "reisen": 1.869, "tank": 1.846, "orte": 1.855, "check": 1.798, "fahrzeug": 1.951, "statistik": 1.869, "einstellungen": 1.835, "planung": 1.84, "wetter": 1.903, "laender": 1.869, "dokumente": 1.869, "album": 1.885, "kochen": 1.86, "autarkie": 1.855, "spiele": 1.899, "ideen": 1.935, "reiseblog": 1.857, "rubbelkarte": 1.88, "zuladung": 1.812, "wasserwaage": 1.869, "abstimmung": 1.826, "urlaubsgeld": 1.846, "dienste": 1.866, "pinnwand": 1.855, "tickets": 1.839, "reisefoto": 1.846, "kalender": 1.84, "heute": 1.923, "mehr": 1.826};
const art = key => `<svg class="art" style="--r:${ART_RATIO[key] || 1.85}" aria-hidden="true"><use href="#b-${key}"/></svg>`;
const sheetHead = title => `<div class="sheet-head"><h2>${title}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>`;
const pageHead = (key, title, sub = '') => `<header class="page-head with-art">
  <div class="ph-text"><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${art(key)}
</header>`;

// Bereiche hinter „Mehr“: der Reiter bleibt dort markiert
const MORE_ROUTES = ['mehr', 'kasse', 'tank', 'orte', 'checklisten', 'fahrzeug', 'statistik', 'reisen', 'einstellungen', 'verwaltung',
  'wetter', 'laender', 'dokumente', 'album', 'kochen', 'autarkie', 'spiele', 'ideen', 'nochweit', 'reisepass', 'kinder', 'rueckblick', 'dienste', 'reiseblog', 'rubbelkarte', 'zuladung', 'wasserwaage', 'abstimmung', 'urlaubsgeld', 'pinnwand', 'reisefoto', 'tickets', 'teilen', 'kalender', 'heute', 'regentag'];
const CASH_ROUTES = ['kasse', 'tank'];

/* ---------- Rendern ---------- */

let frame;
function render() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
}

const VIEWS = {};

function draw() {
  // Während etwas gezogen wird (z. B. Mehr-Kacheln), erst danach neu zeichnen
  if (APP.holdDraw && APP.holdDraw()) { setTimeout(render, 250); return; }
  statsMemo.clear();
  const loggedOut = !!gate;
  document.body.classList.toggle('locked', loggedOut);
  if (loggedOut) {
    $('#mapview').hidden = true;
    $('#view').hidden = false;
    $('#view').innerHTML = VIEWS[gate]();
    return;
  }
  const t = currentTrip();
  document.documentElement.style.setProperty('--trip', tripColor(t));
  document.body.classList.toggle('no-cash', !canCash());
  if (CASH_ROUTES.includes(ui.route) && !canCash()) ui.route = 'mehr';
  $('#syncDot').className = 'sync-dot ' + syncClass();
  // Freigaben je Konto (familie.js): nicht erlaubte Bereiche führen zur Startseite
  if (APP.routeGuard) {
    const r = APP.routeGuard(ui.route);
    if (r !== ui.route) { ui.route = r; history.replaceState(null, '', '#/' + r); }
  }

  $('#tripChip').innerHTML = t
    ? `<span class="dot"></span><span class="name">${esc(t.name)}</span>${t.archived ? '<span class="tag">Archiv</span>' : ''}`
    : `<span class="dot"></span><span class="name">Noch keine Reise</span>`;
  $('#routeBand').innerHTML = routeBand(t);
  const tab = MORE_ROUTES.includes(ui.route) ? 'mehr' : ui.route;
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  chromeHooks.forEach(h => h(tab));

  const onMap = ui.route === 'karte';
  // Großer Bildschirm (navigation.js): Karte links neben dem Tagebuch
  const split = !onMap && APP.splitOn && APP.splitOn(ui.route);
  document.body.classList.toggle('split', !!split);
  $('#mapview').hidden = !onMap && !split;
  $('#view').hidden = onMap;
  if (onMap) return drawMap();
  if (split) drawMap();

  const view = $('#view');
  // Eingaben retten, falls während des Tippens neue Daten eintreffen
  const kept = {};
  view.querySelectorAll('[data-keep]').forEach(i => { kept[i.dataset.keep] = i.value; });
  const act = document.activeElement;
  const focusKey = act && view.contains(act) && act.dataset.keep;
  const sel = focusKey ? [act.selectionStart, act.selectionEnd] : null;

  view.innerHTML = (VIEWS[ui.route] || VIEWS.tagebuch)();
  upgradePhotos(view);
  afterDraw.forEach(h => h(view));

  view.querySelectorAll('[data-keep]').forEach(i => {
    if (kept[i.dataset.keep] != null && i.dataset.keep !== 'packQuery') i.value = kept[i.dataset.keep];
  });
  if (focusKey) {
    const el = view.querySelector(`[data-keep="${focusKey}"]`);
    if (el) { el.focus(); try { el.setSelectionRange(...sel); } catch { /* kein Textfeld */ } }
  }
}

const afterDraw = [];
const chromeHooks = [];   // nach Kopf- und Reiterleiste, vor dem Inhalt (z. B. Freigaben, Einführung)

// Große Fotos im Tagebuch: erst das Vorschaubild, sichtbar gewordene in voller Größe nachladen
const fullPhotos = new Map();
let photoObserver = null;
function upgradePhotos(root) {
  const imgs = root.querySelectorAll('img.hero-photo[data-photo]');
  if (!imgs.length) return;
  photoObserver ||= new IntersectionObserver(list => list.forEach(en => {
    if (!en.isIntersecting) return;
    const img = en.target, id = img.dataset.photo;
    photoObserver.unobserve(img);
    store.get('photos', id).then(p => {
      if (p && p.data) { fullPhotos.set(id, p.data); img.src = p.data; }
    }).catch(() => {});
  }), { rootMargin: '300px' });
  imgs.forEach(img => {
    const full = fullPhotos.get(img.dataset.photo);
    if (full) img.src = full; else photoObserver.observe(img);
  });
}

// Das Streckenband unter der Kopfzeile: jede Übernachtung ein Halt auf der Linie
function routeBand(t) {
  if (!t) return '';
  const es = tripEntries(t).filter(e => e.type !== 'notiz').sort(byDate).slice(-24);
  const step = 100 / (es.length + 1);
  return es.map((e, i) =>
    `<i class="${e.type === 'stellplatz' ? 'b-stop' : 'b-tick'}" style="left:${(step * (i + 1)).toFixed(2)}%"></i>`).join('');
}

/* ---------- Karte ---------- */

let map, routeLayer, carLayer, meLayer, lastFit = '';
const mapHooks = [];
let pendingFocus = null;

function ensureMap() {
  if (map) return;
  map = L.map('map', { zoomControl: false }).setView([48.1, 11.6], 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, lpBase: 'normal',     // Kartenart (kartenebenen.js tauscht sie aus)
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  carLayer = L.layerGroup().addTo(map);
  meLayer = L.layerGroup().addTo(map);
  // Tippen (oder lange drücken) auf die Karte: der Bearbeiten-Modus aus kartenedit.js entscheidet
  map.on('click contextmenu', ev => mapClickHooks.some(h => h(ev.latlng, ev.type)));
}
const mapClickHooks = [];

const pinIcon = (type, color, small) => {
  const minor = !small && TYPES[type] && TYPES[type].minor;
  const size = small ? 14 : minor ? 24 : 30;
  return L.divIcon({
    className: '',
    html: `<div class="pin pin-${type}${small ? ' small' : ''}${minor ? ' minor' : ''}" style="--c:${color}">${small ? '' : icon(type)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

function entryPopup(e, t) {
  const fuel = S.fuel.find(f => f.entryId === e.id);
  const facts = [
    e.place ? esc(e.place) : '',
    e.cost && canCash() ? money(e.cost) : '',
    fuel && canCash() ? `${fuel.liters.toLocaleString('de-DE')} l für ${money(fuel.amount)}` : '',
  ].filter(Boolean).join(', ');
  const photos = (e.photos || []).slice(0, 3);
  return `<div class="popup">
    <span class="popup-kind">${icon(e.type)}${TYPES[e.type].label}, ${t ? esc(t.name) + ', ' : ''}${fmtDay(e.date.slice(0, 10))} ${fmtTime(e.date)}</span>
    <strong>${esc(e.title || TYPES[e.type].label)}</strong>
    ${facts ? `<span>${facts}</span>` : ''}
    ${e.rating ? `<span class="popup-stars" aria-label="${e.rating} von 5">${'★'.repeat(e.rating)}</span>` : ''}
    ${photos.length ? `<span class="popup-photos">${photos.map(p => `<img src="${p.thumb}" alt="">`).join('')}${e.photos.length > 3 ? `<b>+${e.photos.length - 3}</b>` : ''}</span>` : ''}
    ${e.text ? `<span class="popup-text">${esc(e.text)}</span>` : ''}
    ${(e.features || []).length ? `<span class="popup-feats">${e.features.map(esc).join(', ')}</span>` : ''}
    ${extraText(e) ? `<span class="popup-feats">${esc(extraText(e))}</span>` : ''}
    <button class="link" data-action="open-entry" data-id="${e.id}">Eintrag öffnen</button>
  </div>`;
}

function drawRoute(t, emphasis) {
  const color = tripColor(t);
  const stops = tripEntries(t).filter(hasPos).sort(byDate);
  const pts = stops.map(e => [e.lat, e.lng]);
  // Mit GPX-Strecke zeigt die Linie zwischen den Stopps nur noch die Reihenfolge (gestrichelt)
  const tracked = S.tracks.some(x => x.tripId === t.id && x.kind !== 'hike');
  if (pts.length > 1 && !tracked) {
    L.polyline(pts, { color: '#fff', weight: emphasis ? 8 : 6, opacity: 0.9 }).addTo(routeLayer);
    L.polyline(pts, { color, weight: emphasis ? 4 : 3, opacity: emphasis ? 1 : 0.85 }).addTo(routeLayer);
  } else if (pts.length > 1 && ui.mapPins !== 'keine') {
    L.polyline(pts, { color, weight: 2, opacity: 0.6, dashArray: '2 8' }).addTo(routeLayer);
  }
  const movable = emphasis && ui.mapEdit === 'orte';
  // Beim Bearbeiten immer alle Orte zeigen, sonst nach Wahl im Ebenen-Knopf
  const show = e => movable || ui.mapPins === 'alle' || (ui.mapPins === 'nacht' && e.type === 'stellplatz');
  stops.filter(show).forEach(e => {
    const small = !emphasis || e.type === 'notiz';
    const m = L.marker([e.lat, e.lng], { icon: pinIcon(e.type, color, small && !movable), draggable: movable })
      .bindPopup(entryPopup(e, emphasis ? null : t))
      .addTo(routeLayer);
    m.entryId = e.id;
    if (movable) m.on('dragend', () => moveEntry(e, m.getLatLng()));
  });
  return pts;
}

// Stopp auf der Karte verschoben: Position übernehmen, Ortsname neu bestimmen
function moveEntry(e, ll) {
  const p = { lat: ll.lat, lng: ll.lng };
  save('entries', { ...e, ...p, acc: null });
  toast(`„${e.title || TYPES[e.type].label}“ verschoben`);
  placeInfo(p).then(({ name, cc }) => {
    const cur = S.entries.find(x => x.id === e.id);
    if (cur && name && name !== cur.place) save('entries', { ...cur, place: name, country: cc || cur.country });
  });
}

function drawMap() {
  ensureMap();
  map.invalidateSize();
  routeLayer.clearLayers();
  carLayer.clearLayers();
  document.querySelectorAll('.map-toggle button').forEach(b => b.classList.toggle('on', b.dataset.scope === ui.mapScope));

  const t = currentTrip();
  let pts = [];
  if (ui.mapScope === 'all') {
    S.trips.forEach(tr => { pts = pts.concat(drawRoute(tr, false)); });
  } else if (t) {
    pts = drawRoute(t, true);
  }

  // Erweiterungen aus mehr.js: Orte und GPX-Strecken
  mapHooks.forEach(h => { pts = pts.concat(h(routeLayer, ui.mapScope, t) || []); });
  $('#placesBtn').setAttribute('aria-pressed', ui.mapPins !== 'alle' || !ui.showPlaces);

  const car = S.meta.find(m => m.id === 'car');
  const chip = $('#carChip');
  if (hasPos(car)) {
    L.marker([car.lat, car.lng], { icon: pinIcon('car', '#0B3A40'), zIndexOffset: 500 })
      .on('click', () => carSheet()).addTo(carLayer);
    chip.hidden = false;
    chip.innerHTML = `${icon('car')}<span>Auto geparkt ${ago(car.time)}</span>`;
  } else {
    chip.hidden = true;
  }

  if (pendingFocus) {
    const { lat, lng, id } = pendingFocus;
    pendingFocus = null;
    map.setView([lat, lng], 15);
    routeLayer.eachLayer(l => { if (l.entryId === id) l.openPopup(); });
    lastFit = 'focus';
    return;
  }
  const fitKey = ui.mapScope + (t ? t.id : '') + pts.length;
  if (fitKey !== lastFit && pts.length) {
    lastFit = fitKey;
    if (pts.length === 1) map.setView(pts[0], 12);
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
  }
}

function showMe(p) {
  ensureMap();
  meLayer.clearLayers();
  L.circle([p.lat, p.lng], { radius: p.acc, color: '#2E7FB8', weight: 1, fillOpacity: 0.12 }).addTo(meLayer);
  L.circleMarker([p.lat, p.lng], { radius: 7, color: '#fff', weight: 3, fillColor: '#2E7FB8', fillOpacity: 1 }).addTo(meLayer);
}

/* ---------- Ansicht: Tagebuch ---------- */

function emptyTrip() {
  return `<section class="empty">
    <svg class="hero-sheep" aria-hidden="true"><use href="#schaf"/></svg>
    <h1>Wohin geht's?</h1>
    <p>Legt eine Reise an. Danach landen Stellplätze, Sehenswertes, Notizen und Ausgaben automatisch bei dieser Reise.</p>
    <button class="primary" data-action="trip-form">Reise anlegen</button>
  </section>`;
}

function tripHead(t, st, artKey = 'tagebuch') {
  const facts = [
    st.days ? `<div><b>${st.days}</b><span>${st.days === 1 ? 'Tag' : 'Tage'}</span></div>` : '',
    `<div><b>${st.nights}</b><span>${st.nights === 1 ? 'Stellplatz' : 'Stellplätze'}</span></div>`,
    `<div><b>${st.sights}</b><span>Sehenswertes</span></div>`,
    st.dist ? `<div><b>${fmtKm(st.dist)}</b><span>${st.driven ? 'gefahren' : 'Luftlinie'}</span></div>` : '',
  ].join('');
  return `<header class="trip-head">
    <div class="page-head with-art"><div class="ph-text"><h1>${esc(t.name)}</h1><p class="sub">${fmtRange(t)}</p></div>${art(artKey)}</div>
    <div class="facts">${facts}</div>
  </header>`;
}

VIEWS.tagebuch = () => {
  const t = currentTrip();
  if (!t) return emptyTrip();
  const st = tripStats(t);
  // Kommende Reisen und Reisen ohne Einträge öffnen in der Planung
  // Kinderkonten ohne Freigabe „Reiseplanung“ sehen nur das Tagebuch
  const canPlan = !APP.allowed || APP.allowed('planung');
  const mode = !canPlan ? 'tagebuch' : ui.diaryMode[t.id] || (st.es.length && !(t.start > today()) ? 'tagebuch' : 'planung');
  const modeSeg = !canPlan ? '' : `<div class="seg tabs">
    <button class="${mode === 'planung' ? 'on' : ''}" data-action="diary-mode" data-mode="planung">Planung</button>
    <button class="${mode === 'tagebuch' ? 'on' : ''}" data-action="diary-mode" data-mode="tagebuch">Tagebuch</button>
  </div>`;
  if (mode === 'planung') return `${installHint()}${tripHead(t, st, 'planung')}${modeSeg}${VIEWS.planung(t)}`;
  const filter = ui.diaryFilter;
  // Reihenfolge je Person: neueste oben oder ab Tag 1 (lesen.js schaltet um)
  const newest = LS.get('diaryOrder', 'neu') !== 'alt';
  const list = st.es.filter(e => filter === 'alle' || e.type === filter || TYPES[e.type].group === filter).sort(byDate);
  if (newest) list.reverse();

  const label = f => ({ alle: 'Alles', erleben: 'Erleben', unterwegs: 'Unterwegs' })[f] || TYPES[f].many;
  const chips = ['alle', 'stellplatz', 'erleben', 'unterwegs', 'notiz'].map(f =>
    `<button class="chip${filter === f ? ' on' : ''}" data-action="diary-filter" data-f="${f}">${label(f)}</button>`).join('');

  const days = {};
  list.forEach(e => (days[e.date.slice(0, 10)] ||= []).push(e));
  const timeline = Object.entries(days).map(([day, es]) => {
    const n = st.firstDay ? Math.round((dayDate(day) - dayDate(st.firstDay)) / 864e5) + 1 : null;
    return `<li class="day" id="day-${day}" data-day="${day}">
      <h2><span>${n && n > 0 ? 'Tag ' + n : fmtDay(day)}</span>${n && n > 0 ? `<small>${fmtDay(day)}</small>` : ''}${APP.dayExtras ? APP.dayExtras(day, t) : ''}</h2>
      ${APP.dayMap ? APP.dayMap(t, day) : ''}
      ${APP.dayHighlights ? APP.dayHighlights(t, day) : ''}
      <ol>${es.map(stopItem).join('')}</ol>
    </li>`;
  }).join('');

  return `${installHint()}${tripHead(t, st)}${APP.todayCard ? APP.todayCard(t, st) : ''}${modeSeg}${APP.tripBar ? APP.tripBar(t, st) : ''}
    <div class="chips diary-chips">${chips}</div>
    ${APP.diaryTools && list.length ? APP.diaryTools(t, st, Object.keys(days)) : ''}
    <button class="fab" data-action="entry-form" aria-label="Neuer Eintrag">${icon('plus')}<span>Eintrag</span></button>
    ${list.length
      ? `<ol class="timeline">${timeline}</ol>`
      : `<p class="hint">Noch keine Einträge. Auf der Karte trägst du mit „Ich bin hier …“ den aktuellen Ort ein, hier kannst du auch nachträglich schreiben.</p>`}`;
};

function stopItem(e) {
  // Erstes Foto groß wie im Fotobuch, weitere klein darunter
  const [first, ...rest] = e.photos || [];
  const thumbs = rest.slice(0, 4).map(p => `<img data-photo="${p.id}" src="${p.thumb}" alt="">`).join('');
  const bits = [
    e.place ? esc(e.place) : '',
    e.rating ? '★'.repeat(e.rating) : '',
    e.cost ? money(e.cost) : '',
    extraText(e) ? esc(extraText(e)) : '',
  ].filter(Boolean);
  return `<li class="stop stop-${e.type}${e.pinned ? ' pinned' : ''}">
    <button data-action="open-entry" data-id="${e.id}">
      <span class="node">${icon(e.type)}</span>
      <span class="body">
        <span class="time">${fmtTime(e.date)} ${TYPES[e.type].label}</span>
        <strong>${esc(e.title || (e.type === 'notiz' ? 'Notiz' : 'Ohne Titel'))}</strong>
        ${bits.length ? `<span class="meta">${bits.join(', ')}</span>` : ''}
        ${e.text ? `<span class="text">${esc(e.text)}</span>` : ''}
        ${first ? `<img class="hero-photo" data-photo="${first.id}" src="${first.thumb}" alt="">` : ''}
        ${thumbs ? `<span class="thumbs">${thumbs}${e.photos.length > 5 ? `<b>+${e.photos.length - 5}</b>` : ''}</span>` : ''}
      </span>
    </button>
    ${APP.stopExtra ? APP.stopExtra(e) : ''}
  </li>`;
}

/* ---------- Eintrag: Formular & Ansicht ---------- */

let formPhotos = { keep: [], add: [], drop: [] };

function entryForm(e = {}) {
  const isNew = !e.id;
  const type = e.type || 'stellplatz';
  formPhotos = { keep: (e.photos || []).slice(), add: [], drop: [] };
  const linked = !isNew && S.expenses.some(x => x.entryId === e.id);
  const typeRadios = Object.entries(TYPES).map(([k, v]) =>
    `<label><input type="radio" name="type" value="${k}"${k === type ? ' checked' : ''}><span>${icon(k)}${v.label}</span></label>`).join('');
  const fuel = !isNew && S.fuel.find(f => f.entryId === e.id) || {};
  const numVal = v => (v ? String(v).replace('.', ',') : '');
  const feats = FEATURES.map(f =>
    `<label class="chip"><input type="checkbox" name="feat" value="${f}"${(e.features || []).includes(f) ? ' checked' : ''}><span>${f}</span></label>`).join('');
  const stars = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="star${(e.rating || 0) >= n ? ' on' : ''}" data-action="rate" data-v="${n}" aria-label="${n} von 5">★</button>`).join('');
  // Selten Gebrauchtes steht unter „Weitere Angaben“; aufgeklappt, wenn dort schon etwas eingetragen ist
  const moreOpen = !!(e.cost || e.blogHide || (e.features || []).length || Object.values(e.extra || {}).some(v => v !== '' && v != null && v !== false) || Object.keys(e.ratings || {}).length);

  return `<form data-form="entry" data-type="${type}" data-id="${e.id || ''}">
    <div class="sheet-head">
      <h2>${isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</h2>
      <button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button>
    </div>
    <div class="type-grid">${typeRadios}</div>
    <label class="field"><span>Titel</span><input name="title" value="${esc(e.title)}" placeholder="z. B. Wiese am Seeufer" autocomplete="off"></label>
    <div class="row2">
      <label class="field"><span>Wann</span><input type="datetime-local" name="date" value="${esc(e.date || nowLocal())}" required></label>
      <label class="field"><span>Ort</span><input name="place" value="${esc(e.place)}" placeholder="Ortsname"></label>
    </div>
    <label class="field voice-field"><span>Was war los?</span>${APP.voiceBtn ? APP.voiceBtn('text') : ''}<textarea name="text" rows="4" placeholder="Eindrücke, Tipps, was ihr nächstes Mal anders macht …">${esc(e.text)}</textarea></label>
    <div class="field"><span>Fotos</span>
      <div class="photo-grid" id="photoGrid">${photoGrid()}</div>
      <div class="btnrow photo-btns"><label class="ghost file">${icon('plus')}Fotos hinzufügen<input type="file" accept="image/*" multiple data-action="add-photos"></label>
      ${APP.entryFormExtra ? APP.entryFormExtra(e) : ''}</div>
    </div>
    <div class="field" data-show="rating"><span>Bewertung</span><input type="hidden" name="rating" value="${e.rating || 0}"><div class="stars">${stars}</div></div>
    ${canCash() ? `<div data-show="fuel">
      <div class="row2">
        <label class="field"><span>Liter</span><input name="fuelLiters" inputmode="decimal" value="${numVal(fuel.liters)}" placeholder="0,00"></label>
        <label class="field"><span>Betrag in €</span><input name="fuelAmount" inputmode="decimal" value="${numVal(fuel.amount)}" placeholder="0,00"></label>
      </div>
      <div class="row2">
        <label class="field"><span>Kilometerstand</span><input name="fuelOdo" inputmode="numeric" value="${fuel.odo || ''}"></label>
        <label class="check"><input type="checkbox" name="fuelFull"${fuel.id ? (fuel.full ? ' checked' : '') : ' checked'}><span>Vollgetankt</span></label>
      </div>
      <p class="sub">Mit Liter und Betrag landet der Stopp auch im Tankbuch${currentTrip() ? ' und in der Kasse' : ''}.</p>
    </div>` : ''}
    <div class="field pos-field">
      <span>Position</span>
      <input type="hidden" name="lat" value="${e.lat ?? ''}"><input type="hidden" name="lng" value="${e.lng ?? ''}"><input type="hidden" name="acc" value="${e.acc ?? ''}"><input type="hidden" name="country" value="${esc(e.country)}">
      <p class="pos" id="posText">${hasPos(e) ? posLabel(e) : 'Noch keine Position'}</p>
      <div class="btnrow">
        <button type="button" class="ghost" data-action="pos-here">${icon('pin')}Aktuelle Position</button>
        <button type="button" class="ghost" data-action="pos-pick">Auf Karte wählen</button>
      </div>
      <div id="pickMap" class="pick-map" hidden></div>
    </div>
    <details class="more-fields"${moreOpen ? ' open' : ''}><summary>Weitere Angaben <small class="more-what"></small></summary>
    ${Object.entries(TYPES).filter(([, v]) => v.extras).map(([k, v]) => `<div class="extras" data-extras="${k}">
      ${v.extras.map(f => {
        const val = ((e.type === k && e.extra) || {})[f.key];
        const name = `x_${k}_${f.key}`;
        if (f.check) return `<label class="check"><input type="checkbox" name="${name}"${val ? ' checked' : ''}><span>${f.label}</span></label>`;
        if (f.options) return `<div class="field"><span>${f.label}</span><div class="chips wrap">${f.options.map(o =>
          `<label class="chip"><input type="radio" name="${name}" value="${o}"${val === o ? ' checked' : ''}><span>${o}</span></label>`).join('')}</div></div>`;
        if (f.text) return `<label class="field half"><span>${f.label}</span><input name="${name}" value="${esc(val || '')}" placeholder="${f.ph || ''}"></label>`;
        return `<label class="field half"><span>${f.label}</span><input name="${name}" inputmode="decimal" value="${val != null ? String(val).replace('.', ',') : ''}"></label>`;
      }).join('')}
      ${v.gpx ? `<label class="ghost file">GPX-Strecke der Tour${e.id && S.tracks.some(t => t.entryId === e.id) ? ' ersetzen' : ''}<input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" data-action="hike-gpx"></label><p class="sub" id="hikeInfo"></p>` : ''}
    </div>`).join('')}
    <div class="field" data-show="features"><span>Ausstattung</span><div class="chips wrap">${feats}</div></div>
    <div class="row2" data-show="cost">
      <label class="field"><span>Kosten in €</span><input name="cost" inputmode="decimal" value="${e.cost ? String(e.cost).replace('.', ',') : ''}" placeholder="0"></label>
      ${canCash() ? `<label class="check"><input type="checkbox" name="toKasse" ${isNew || linked ? 'checked' : ''}><span>${linked ? 'Im Kassenbuch' : 'Ins Kassenbuch'}</span></label>` : ''}
    </div>
    ${APP.entryMoreFields ? APP.entryMoreFields(e) : ''}
    <label class="check small"><input type="checkbox" name="blogHide"${e.blogHide ? ' checked' : ''}><span>Nicht im Reiseblog zeigen</span></label>
    </details>
    <div class="sheet-foot">
      ${isNew ? '' : `<button type="button" class="danger ghost" data-action="del-entry" data-id="${e.id}">Löschen</button>`}
      <button class="primary">Speichern</button>
    </div>
  </form>`;
}

const posLabel = p => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.acc ? ` (± ${p.acc} m)` : ''}`;

// Für Malen (abenteuer.js): fertiges Bild wie ein Foto in den Eintrag legen
function addFormPhoto(p) {
  formPhotos.add.push(p);
  const grid = $('#photoGrid');
  if (grid) grid.innerHTML = photoGrid();
}
async function addPhotoFiles(files) {
  files = files.filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|heic|webp)$/i.test(f.name));
  if (!files.length) return;
  toast(files.length > 1 ? `${files.length} Fotos werden verkleinert …` : 'Foto wird verkleinert …');
  for (const f of files) {
    try {
      formPhotos.add.push({ id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1920, 0.78) });
      const grid = $('#photoGrid');
      if (grid) grid.innerHTML = photoGrid();
    } catch { toast('Ein Foto ließ sich nicht lesen.'); }
  }
}
function photoGrid() {
  return [...formPhotos.keep, ...formPhotos.add].map(p =>
    `<figure><img src="${p.thumb}" alt=""><button type="button" data-action="drop-photo" data-id="${p.id}" aria-label="Foto entfernen">${icon('close')}</button></figure>`).join('');
}

function setFormPos(form, p, fillPlace) {
  form.lat.value = p.lat;
  form.lng.value = p.lng;
  form.acc.value = p.acc || '';
  $('#posText').textContent = posLabel(p);
  if (pickMarker) pickMarker.setLatLng([p.lat, p.lng]);
  if (fillPlace) placeInfo(p).then(({ name, cc }) => {
    if (name && form.place && !form.place.value) form.place.value = name;
    if (form.country) form.country.value = cc;
  });
}

async function locateInto(form) {
  const btn = form.querySelector('[data-action="pos-here"]');
  btn.disabled = true;
  $('#posText').textContent = 'Position wird bestimmt …';
  try {
    setFormPos(form, await getPos(), true);
  } catch (err) {
    $('#posText').textContent = form.lat.value ? posLabel({ lat: +form.lat.value, lng: +form.lng.value }) : 'Noch keine Position';
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
}

let pickMap, pickMarker;
function openPicker(form) {
  const box = $('#pickMap');
  box.hidden = false;
  const start = form.lat.value
    ? [+form.lat.value, +form.lng.value]
    : (map ? map.getCenter() : [48.1, 11.6]);
  pickMap = L.map(box, { zoomControl: false }).setView(start, form.lat.value ? 14 : 8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(pickMap);
  pickMarker = L.marker(start, { icon: pinIcon('pin', tripColor(currentTrip())) }).addTo(pickMap);
  pickMap.on('click', ev => setFormPos(form, { lat: ev.latlng.lat, lng: ev.latlng.lng }, true));
  setTimeout(() => pickMap.invalidateSize(), 50);
}

// Nur zeigen, was zur gewählten Art passt
function applyType(form) {
  const type = form.querySelector('[name=type]:checked').value;
  form.dataset.type = type;
  form.querySelectorAll('[data-show]').forEach(el => { el.hidden = !TYPES[type][el.dataset.show]; });
  form.querySelectorAll('[data-extras]').forEach(el => { el.hidden = el.dataset.extras !== type; });
  const what = form.querySelector('.more-what');
  if (what) {
    const T = TYPES[type];
    what.textContent = [T.extras ? 'Steckbrief' : '', T.features ? 'Ausstattung' : '', T.cost ? 'Kosten' : '', 'Reiseblog'].filter(Boolean).join(', ');
  }
}

function openEntryForm(e, opts = {}) {
  if (!currentTrip()) { toast('Legt zuerst eine Reise an.'); return tripForm(); }
  openSheet(entryForm(e), form => {
    applyType(form);
    form.addEventListener('change', ev => { if (ev.target.name === 'type') applyType(form); });
    if (opts.locate) locateInto(form);
    if (opts.at) setFormPos(form, opts.at, true);
  });
}

function submitEntry(form) {
  const fd = new FormData(form);
  const t = currentTrip();
  const old = S.entries.find(e => e.id === form.dataset.id);
  const type = fd.get('type');
  const lat = parseFloat(fd.get('lat')), lng = parseFloat(fd.get('lng'));
  const e = {
    ...(old || { id: newId(), tripId: t.id, by: me(), createdAt: Date.now() }),
    type,
    title: fd.get('title').trim(),
    date: fd.get('date'),
    place: fd.get('place').trim(),
    text: fd.get('text').trim(),
    lat: isFinite(lat) ? lat : null,
    lng: isFinite(lng) ? lng : null,
    acc: parseInt(fd.get('acc')) || null,
    country: fd.get('country') || '',
    rating: TYPES[type].rating ? +fd.get('rating') || 0 : 0,
    features: TYPES[type].features ? fd.getAll('feat') : [],
    blogHide: !!fd.get('blogHide'),
    cost: TYPES[type].cost ? num(fd.get('cost')) : 0,
    extra: Object.fromEntries((TYPES[type].extras || []).map(f => {
      const v = fd.get(`x_${type}_${f.key}`);
      return [f.key, f.check ? !!v : f.num ? (v ? num(v) : '') : String(v || '').trim()];
    })),
  };

  // Fotos: neue als eigene Dokumente speichern, im Eintrag nur Vorschaubilder
  formPhotos.drop.forEach(id => remove('photos', id));
  formPhotos.add.forEach(p => save('photos', { id: p.id, entryId: e.id, tripId: e.tripId, data: p.data }));
  e.photos = [...formPhotos.keep, ...formPhotos.add].map(({ id, thumb }) => ({ id, thumb }));
  if (APP.entrySave) APP.entrySave(e, form);
  save('entries', e);

  // Kosten ins Kassenbuch
  const linked = S.expenses.find(x => x.entryId === e.id);
  if (fd.get('toKasse') && e.cost > 0) {
    save('expenses', {
      ...(linked || { id: newId(), tripId: e.tripId, paidBy: me(), split: defaultSplit(), entryId: e.id }),
      amount: e.cost,
      date: e.date.slice(0, 10),
      cat: costCat(e.type, e.extra),
      note: e.title || e.place,
    });
  } else if (linked && (!fd.get('toKasse') || !e.cost)) {
    remove('expenses', linked.id);
  }
  closeSheet();
  toast(old ? 'Eintrag gespeichert' : 'Eintrag angelegt');
  return e;
}

function entryView(e) {
  const t = S.trips.find(x => x.id === e.tripId);
  const feats = (e.features || []).map(f => `<span class="chip on static">${f}</span>`).join('');
  return `<article class="entry-view" style="--trip:${tripColor(t)}">
    <div class="sheet-head">
      <p class="kicker">${icon(e.type)}${TYPES[e.type].label}, ${fmtDay(e.date.slice(0, 10))}, ${fmtTime(e.date)}</p>
      <button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button>
    </div>
    <h2>${esc(e.title || TYPES[e.type].label)}</h2>
    ${e.place ? `<p class="sub">${esc(e.place)}</p>` : ''}
    ${(e.photos || []).length ? `<div class="gallery">${e.photos.map(p => `<img data-photo="${p.id}" src="${p.thumb}" alt="">`).join('')}</div>` : ''}
    ${e.text ? `<p class="prose">${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}
    ${e.rating ? `<p class="rating" aria-label="${e.rating} von 5">${'★'.repeat(e.rating)}<span>${'★'.repeat(5 - e.rating)}</span></p>` : ''}
    ${feats ? `<div class="chips wrap">${feats}</div>` : ''}
    ${extraText(e) ? `<p class="extra-line">${esc(extraText(e))}</p>` : ''}
    ${APP.entryExtra ? APP.entryExtra(e) : ''}
    <dl class="facts-list">
      ${e.cost ? `<div><dt>Kosten</dt><dd>${money(e.cost)}</dd></div>` : ''}
      ${hasPos(e) ? `<div><dt>Position</dt><dd>${posLabel(e)}</dd></div>` : ''}
      <div><dt>Eingetragen von</dt><dd>${esc(personName(e.by))}</dd></div>
    </dl>
    <div class="sheet-foot">
      ${hasPos(e) ? `<button class="ghost" data-action="show-on-map" data-id="${e.id}">Auf der Karte</button><a class="ghost btn" href="${navUrl(e)}" target="_blank" rel="noopener">Hinfahren</a>` : ''}
      ${hasPos(e) && e.type !== 'notiz' ? `<button class="ghost" data-action="entry-to-place" data-id="${e.id}">Als Lieblingsplatz merken</button>` : ''}
      ${APP.entryButtons ? APP.entryButtons(e) : ''}
      <button class="primary" data-action="edit-entry" data-id="${e.id}">Bearbeiten</button>
    </div>
  </article>`;
}

function openEntry(id) {
  const e = S.entries.find(x => x.id === id);
  if (!e) return;
  openSheet(entryView(e), root => {
    // Fotos in voller Größe nachladen
    root.querySelectorAll('[data-photo]').forEach(img => {
      store.get('photos', img.dataset.photo).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {});
    });
  });
}

/* ---------- Auto-Standort ---------- */

function carSheet() {
  const car = S.meta.find(m => m.id === 'car');
  openSheet(`<div class="car-view">
    <div class="sheet-head"><h2>Unser Auto</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    ${hasPos(car) ? `
      <p class="big-line">Geparkt ${ago(car.time)}</p>
      <p class="sub">von ${esc(personName(car.by))}${car.note ? `, ${esc(car.note)}` : ''}</p>
      <p class="sub" id="carDist">Entfernung wird berechnet …</p>
      <div class="sheet-foot stack">
        <a class="primary btn" href="${navUrl(car, true)}" target="_blank" rel="noopener">Zu Fuß zum Auto</a>
        <button class="ghost" data-action="car-on-map">Auf der Karte zeigen</button>
        <button class="ghost" data-action="park-here">Neu parken: Standort jetzt</button>
        <button class="ghost danger" data-action="car-clear">Standort löschen</button>
      </div>`
    : `<p>Noch kein Parkplatz gespeichert.</p>
      <div class="sheet-foot"><button class="primary" data-action="park-here">Auto hier geparkt</button></div>`}
  </div>`, () => {
    if (!hasPos(car)) return;
    getPos().then(p => {
      const el = $('#carDist');
      if (el) el.textContent = `${fmtKm(km(p, car))} von dir entfernt (Luftlinie)`;
      showMe(p);
    }).catch(() => { const el = $('#carDist'); if (el) el.textContent = ''; });
  });
}

async function parkHere() {
  closeSheet();
  toast('Standort wird bestimmt …');
  try {
    const p = await getPos();
    save('meta', { id: 'car', ...p, time: Date.now(), by: me() });
    showMe(p);
    toast(`Parkplatz gespeichert (± ${p.acc} m)`);
  } catch (err) {
    toast(err.message);
  }
}

/* ---------- Ansicht: Listen ---------- */

const KINDS = {
  einkauf: { label: 'Einkaufen', one: 'Einkaufsliste', empty: 'Alles da.', ph: 'Was fehlt? z. B. Gaskartusche' },
  merken: { label: 'Merken', one: 'Merkliste', empty: 'Nichts vorgemerkt.', ph: 'Was wollt ihr nicht vergessen?' },
};
const listsOf = kind => S.lists.filter(l => l.kind === kind)
  .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0));
// Einträge ohne Listen-Zuordnung (frühere Version) gehören zur ersten Liste ihrer Art
const itemListId = i => i.listId || (listsOf(i.list)[0] || {}).id;
const itemsOf = l => S.listItems.filter(i => itemListId(i) === l.id);
const openCount = l => itemsOf(l).filter(i => !i.done).length;

function currentList(kind) {
  const ls = listsOf(kind);
  return ls.find(l => l.id === LS.get('list.' + kind, null)) || ls[0] || null;
}

function newList(kind, name, tripId) {
  return save('lists', { id: newId(), kind, name: name || KINDS[kind].one, tripId: tripId || null, createdAt: Date.now(), order: listsOf(kind).length });
}

function listRow(i) {
  return `<li class="${i.done ? 'done' : ''}${i.pinned && !i.done ? ' pinned' : ''}">
    <button class="tick" data-action="toggle-item" data-id="${i.id}" aria-pressed="${!!i.done}" aria-label="${i.done ? 'Wieder offen' : 'Erledigt'}"></button>
    <button class="txt as-text" data-action="item-sheet" data-id="${i.id}">${esc(i.text)}</button>
    <span class="who" title="${esc(personName(i.by))}">${initial(i.by)}</span>
  </li>`;
}

// Eine Liste mit Eingabezeile, offen und erledigt (auch in der Reiseplanung verwendet)
function listBlock(l, kind) {
  const items = l ? itemsOf(l) : [];
  const open = items.filter(i => !i.done).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
  const done = items.filter(i => i.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return `<form class="adder" data-form="list-add" data-list="${l ? l.id : ''}" data-kind="${kind}">
      <input name="text" data-keep="listAdd-${l ? l.id : kind}" placeholder="${KINDS[kind].ph}" autocomplete="off" enterkeyhint="done">
      <button class="primary" aria-label="Hinzufügen">${icon('plus')}</button>
    </form>
    <ul class="checklist">${open.map(listRow).join('') || `<li class="none">${KINDS[kind].empty}</li>`}</ul>
    ${done.length ? `<div class="done-head"><h3>Erledigt</h3><button class="link" data-action="clear-done" data-list="${l.id}">Erledigte entfernen</button></div>
      <ul class="checklist">${done.map(listRow).join('')}</ul>` : ''}`;
}

VIEWS.listen = () => {
  const kind = ui.listTab;
  const lists = listsOf(kind).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const cur = currentList(kind);
  const count = k => listsOf(k).reduce((n, l) => n + openCount(l), 0);
  const chips = lists.map(l => {
    const trip = l.tripId && S.trips.find(t => t.id === l.tripId);
    return `<button class="chip${cur && l.id === cur.id ? ' on' : ''}" data-action="list-pick" data-id="${l.id}">
      ${l.pinned ? '📌 ' : ''}${trip ? `<i class="trip-dot" style="--c:${tripColor(trip)}"></i>` : ''}${esc(l.name)} <small>${openCount(l) || ''}</small></button>`;
  }).join('');
  const trip = cur && cur.tripId && S.trips.find(t => t.id === cur.tripId);
  return `${pageHead('listen', 'Listen')}
    <div class="seg tabs">
      ${Object.entries(KINDS).map(([k, v]) => `<button class="${kind === k ? 'on' : ''}" data-action="list-tab" data-tab="${k}">${v.label} <small>${count(k)}</small></button>`).join('')}
    </div>
    <div class="chips list-chips">${chips}<button class="chip add" data-action="list-form" data-kind="${kind}">${icon('plus')}Neue ${KINDS[kind].one}</button></div>
    ${cur ? `<div class="list-head"><h2>${esc(cur.name)}</h2>
      ${trip ? `<span class="trip-tag" style="--c:${tripColor(trip)}">für ${esc(trip.name)}</span>` : ''}
      <button class="icon-btn small" data-action="list-form" data-id="${cur.id}" aria-label="Liste bearbeiten">${icon('edit')}</button></div>` : ''}
    ${listBlock(cur, kind)}`;
};

function listForm(id, kind, tripId) {
  const l = S.lists.find(x => x.id === id) || { kind, tripId: tripId || null };
  const n = l.id ? itemsOf(l).length : 0;
  const trips = sortTrips(S.trips.filter(t => !t.archived || t.id === l.tripId));
  openSheet(`<form data-form="list" data-id="${l.id || ''}" data-kind="${l.kind}">
    <div class="sheet-head"><h2>${l.id ? 'Liste bearbeiten' : 'Neue ' + KINDS[l.kind].one}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(l.name)}" required placeholder="${l.kind === 'einkauf' ? 'z. B. Wochenmarkt oder Baumarkt' : 'z. B. Vorbereitung oder Ideen'}"></label>
    <label class="field"><span>Gehört zur Reise</span><select name="tripId"><option value="">Keiner bestimmten Reise</option>
      ${trips.map(t => `<option value="${t.id}"${t.id === l.tripId ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="pinned"${l.pinned ? ' checked' : ''}><span>📌 Anheften (steht dann ganz vorne)</span></label>
    <div class="sheet-foot">
      ${l.id ? `<button type="button" class="ghost danger" data-action="del-list" data-id="${l.id}" data-n="${n}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

// Eintrag bearbeiten oder in eine andere Liste verschieben
function itemSheet(id) {
  const i = S.listItems.find(x => x.id === id);
  if (!i) return;
  const cur = itemListId(i);
  const group = k => `<optgroup label="${KINDS[k].label}">${listsOf(k).map(l =>
    `<option value="${l.id}"${l.id === cur ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</optgroup>`;
  openSheet(`<form data-form="list-item" data-id="${i.id}">
    <div class="sheet-head"><h2>Eintrag</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Text</span><input name="text" value="${esc(i.text)}" required></label>
    <label class="field"><span>Liste</span><select name="listId">${group('einkauf')}${group('merken')}</select></label>
    <label class="check"><input type="checkbox" name="pinned"${i.pinned ? ' checked' : ''}><span>📌 Anheften (steht oben in der Liste)</span></label>
    <p class="sub">Eingetragen von ${esc(personName(i.by))}${i.movedFrom ? `, verschoben aus „${esc(i.movedFrom)}“` : ''}</p>
    <div class="sheet-foot">
      <button type="button" class="ghost danger" data-action="del-item" data-id="${i.id}">Löschen</button>
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Boxen und Fächer & Packliste ---------- */

const LOOSE = { id: '', name: 'Lose im Auto', where: 'in keiner Box und keinem Fach' };
const boxLabel = b => (b.kind === 'fach' ? 'Fach' : 'Box');
// Gegenstände mit tripId sind Extras, die nur für diese eine Reise mitkommen
const extrasOf = t => (t ? S.items.filter(i => i.tripId === t.id) : []);
const isPacked = (t, i) => !!t && S.packstate.some(p => p.id === `${t.id}_${i.id}` && p.packed);

function packRow(t, i, setup) {
  const where = i.boxId && S.boxes.find(b => b.id === i.boxId);
  const note = [i.note, i.tripId && where ? `${boxLabel(where)}: ${where.name}` : ''].filter(Boolean).join(', ');
  return setup
    ? `<li><span class="txt">${esc(i.name)}${note ? `<small>${esc(note)}</small>` : ''}</span>
        <button class="icon-btn small" data-action="item-form" data-id="${i.id}" aria-label="Bearbeiten">${icon('edit')}</button></li>`
    : `<li class="${isPacked(t, i) ? 'done' : ''}"><button class="tick" data-action="pack" data-id="${i.id}" aria-pressed="${isPacked(t, i)}" aria-label="Eingepackt"></button>
        <span class="txt">${esc(i.name)}${note ? `<small>${esc(note)}</small>` : ''}</span></li>`;
}

VIEWS.packen = () => {
  const t = currentTrip();
  const q = ui.packQuery.trim().toLowerCase();
  const match = i => !q || i.name.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q);
  const stock = S.items.filter(i => !i.tripId);
  const boxes = sortedBoxes();
  const real = boxes.length;
  if (stock.some(i => !S.boxes.find(b => b.id === i.boxId))) boxes.push(LOOSE);
  const inBox = b => stock.filter(i => (b === LOOSE ? !S.boxes.find(x => x.id === i.boxId) : i.boxId === b.id))
    .filter(match).sort((a, b) => a.name.localeCompare(b.name));
  const setup = ui.packMode === 'einrichten' || !t;
  const extras = extrasOf(t).filter(match);

  const all = [...stock, ...extrasOf(t)];
  const packedCount = all.filter(i => isPacked(t, i)).length;

  const extraSection = t && (extras.length || !q) ? `<section class="box extra" style="--c:${tripColor(t)}">
      <header>
        <div><h2>Extra für „${esc(t.name)}“</h2><p class="sub">Kommt nur auf dieser Reise mit</p></div>
        ${setup ? '' : `<span class="count">${extras.filter(i => isPacked(t, i)).length} / ${extras.length}</span>`}
      </header>
      <ul class="${setup ? 'inventory' : 'checklist'}">${extras.map(i => packRow(t, i, setup)).join('') || '<li class="none">Noch nichts Besonderes.</li>'}</ul>
      <button class="link add-in" data-action="item-form" data-trip="${t.id}">${icon('plus')}Extra für diese Reise</button>
    </section>` : '';

  const sections = boxes.map((b, k) => {
    const items = inBox(b);
    if (q && !items.length) return '';
    return `<section class="box">
      <header>
        <div><h2>${esc(b.name)}${b === LOOSE ? '' : ` <span class="kind">${boxLabel(b)}</span>`}</h2>${b.where ? `<p class="sub">${esc(b.where)}</p>` : ''}</div>
        ${setup
          ? (b === LOOSE ? '' : `<div class="box-tools">
              <button class="icon-btn small" data-action="box-move" data-id="${b.id}" data-dir="-1" aria-label="Nach oben"${k === 0 ? ' disabled' : ''}>${icon('up')}</button>
              <button class="icon-btn small" data-action="box-move" data-id="${b.id}" data-dir="1" aria-label="Nach unten"${k === real - 1 ? ' disabled' : ''}>${icon('down')}</button>
              <button class="icon-btn small" data-action="box-form" data-id="${b.id}" aria-label="${boxLabel(b)} bearbeiten">${icon('edit')}</button></div>`)
          : `<span class="count">${items.filter(i => isPacked(t, i)).length} / ${items.length}</span>`}
      </header>
      <ul class="${setup ? 'inventory' : 'checklist'}">${items.map(i => packRow(t, i, setup)).join('') || '<li class="none">Leer</li>'}</ul>
      ${setup && b !== LOOSE ? `<button class="link add-in" data-action="item-form" data-box="${b.id}">${icon('plus')}Gegenstand hinzufügen</button>` : ''}
    </section>`;
  }).join('');

  return `${pageHead('boxen', 'Boxen und Fächer', t && !setup ? `${packedCount} von ${all.length} für „${esc(t.name)}“ eingepackt` : 'Was liegt in welcher Box, in welchem Fach?')}
    ${t ? `<div class="seg tabs">
      <button class="${!setup ? 'on' : ''}" data-action="pack-mode" data-mode="packen">Packen</button>
      <button class="${setup ? 'on' : ''}" data-action="pack-mode" data-mode="einrichten">Einrichten</button>
    </div>` : ''}
    ${t && !setup && all.length ? `<div class="progress" style="--p:${packedCount / all.length}"><span></span></div>` : ''}
    <label class="search">${icon('search')}<input type="search" data-keep="packQuery" data-action-input="pack-search" value="${esc(ui.packQuery)}" placeholder="Wo ist …?"></label>
    ${extraSection}
    ${sections || (q ? (extras.length ? '' : `<p class="hint">„${esc(ui.packQuery)}“ steht in keiner Box und keinem Fach.</p>`) : `<p class="hint">Legt eure Campingboxen und Fächer an und tragt ein, was drin ist. Dann findet ihr alles über die Suche und habt beim Packen eine Liste zum Abhaken.</p>`)}
    <div class="toolbar end">
      ${setup ? `<button class="ghost" data-action="item-form">${icon('plus')}Gegenstand</button><button class="primary" data-action="box-form">${icon('plus')}Box oder Fach</button>`
        : `<button class="ghost" data-action="pack-reset">Packliste zurücksetzen</button>`}
    </div>`;
};

function sortedBoxes() {
  return S.boxes.slice().sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
}

// Pfeile: mit dem Nachbarn tauschen und alle neu durchnummerieren
function moveBox(id, dir) {
  const list = sortedBoxes();
  const i = list.findIndex(b => b.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((b, n) => { if (b.order !== n + 1) save('boxes', { ...b, order: n + 1 }); });
}

function boxForm(id) {
  const b = S.boxes.find(x => x.id === id) || { kind: 'box' };
  const kinds = [['box', 'Box'], ['fach', 'Fach']].map(([v, l]) =>
    `<label><input type="radio" name="kind" value="${v}"${(b.kind || 'box') === v ? ' checked' : ''}><span>${l}</span></label>`).join('');
  openSheet(`<form data-form="box" data-id="${b.id || ''}">
    <div class="sheet-head"><h2>${b.id ? boxLabel(b) + ' bearbeiten' : 'Neue Box oder neues Fach'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <div class="field"><span>Art</span><div class="seg">${kinds}</div></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(b.name)}" required placeholder="z. B. Küchenbox oder Türfach links"></label>
    <label class="field"><span>Wo im Auto?</span><input name="where" value="${esc(b.where)}" placeholder="z. B. hinten links unter dem Bett"></label>
    <div class="sheet-foot">
      ${b.id ? `<button type="button" class="ghost danger" data-action="del-box" data-id="${b.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

function itemForm(id, boxId, tripId) {
  const i = S.items.find(x => x.id === id) || { boxId: boxId || '', tripId: tripId || null };
  const t = currentTrip();
  const opts = S.boxes.map(b => `<option value="${b.id}"${b.id === i.boxId ? ' selected' : ''}>${esc(b.name)} (${boxLabel(b)})</option>`).join('');
  openSheet(`<form data-form="item" data-id="${i.id || ''}">
    <div class="sheet-head"><h2>${i.id ? 'Gegenstand bearbeiten' : 'Neuer Gegenstand'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Was?</span><input name="name" value="${esc(i.name)}" required placeholder="z. B. Stirnlampe"></label>
    <label class="field"><span>Wo kommt es hin?</span><select name="boxId"><option value="">Lose im Auto</option>${opts}</select></label>
    <label class="field"><span>Notiz</span><input name="note" value="${esc(i.note)}" placeholder="z. B. 2 Stück"></label>
    ${t || i.tripId ? `<label class="check"><input type="checkbox" name="extra" value="${i.tripId || t.id}"${i.tripId ? ' checked' : ''}><span>Nur für die Reise „${esc((S.trips.find(x => x.id === (i.tripId || t.id)) || {}).name || '')}“</span></label>` : ''}
    <div class="sheet-foot">
      ${i.id ? `<button type="button" class="ghost danger" data-action="del-pack-item" data-id="${i.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Kassenbuch ---------- */

// Wer die Kosten mitträgt, legen die Eltern pro Crew fest (Kinder meist nicht)
const defaultSplit = () => (payers().length ? payers() : members()).map(m => m.id);
const forWhom = x => (Array.isArray(x.split) && x.split.length ? x.split : [x.paidBy]);

function balance(list) {
  const net = {};
  list.forEach(x => {
    const a = x.amount || 0, who = forWhom(x);
    net[x.paidBy] = (net[x.paidBy] || 0) + a;
    who.forEach(id => { net[id] = (net[id] || 0) - a / who.length; });
  });
  return net;
}

// Möglichst wenige Überweisungen: größte Schuld an größtes Guthaben
function transfers(net) {
  const plus = [], minus = [];
  Object.entries(net).forEach(([id, v]) => {
    if (v > 0.005) plus.push({ id, v });
    if (v < -0.005) minus.push({ id, v: -v });
  });
  const out = [];
  plus.sort((a, b) => b.v - a.v);
  minus.sort((a, b) => b.v - a.v);
  while (plus.length && minus.length) {
    const p = plus[0], m = minus[0], amount = Math.min(p.v, m.v);
    out.push({ from: m.id, to: p.id, amount: Math.round(amount * 100) / 100 });
    p.v -= amount; m.v -= amount;
    if (p.v < 0.005) plus.shift();
    if (m.v < 0.005) minus.shift();
  }
  return out;
}

VIEWS.kasse = () => {
  const t = currentTrip();
  if (!t) return emptyTrip();
  const list = S.expenses.filter(x => x.tripId === t.id).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
  const real = list.filter(x => x.cat !== SETTLE);
  const total = real.reduce((s, x) => s + (x.amount || 0), 0);
  const st = tripStats(t);
  const moves = transfers(balance(list));

  const byCat = {};
  real.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  const groups = {};
  list.forEach(x => (groups[x.date] ||= []).push(x));
  const splitLabel = x => {
    const who = forWhom(x);
    const all = defaultSplit();
    if (who.length === all.length && all.every(id => who.includes(id))) return who.length > 1 ? 'geteilt' : 'eigene Ausgabe';
    return 'für ' + who.map(id => esc(personName(id))).join(' und ');
  };

  return `${pageHead('kasse', 'Kasse', esc(t.name))}
    <section class="ledger-sum">
      <p class="total">${money(total)}</p>
      <p class="sub">${st.days ? `${money(total / st.days)} pro Tag, ` : ''}${st.nights ? `${money((byCat.Stellplatz || 0) / st.nights)} pro Nacht auf Stellplätzen` : 'ausgegeben'}</p>
      <div class="settle ${moves.length ? '' : 'even'}">
        ${moves.length
          ? moves.map(m => `<div class="move"><p><b>${esc(personName(m.from))}</b> gibt <b>${esc(personName(m.to))}</b> ${money(m.amount)}</p>
              <button class="ghost" data-action="settle" data-from="${m.from}" data-to="${m.to}" data-amount="${m.amount.toFixed(2)}">Ausgleich eintragen</button></div>`).join('')
          : '<p>Alle sind quitt.</p>'}
      </div>
    </section>
    ${cats.length ? `<section class="cats">${cats.map(([c, v]) =>
      `<div class="cat"><span>${esc(c)}</span><span class="bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></span><b>${money(v)}</b></div>`).join('')}</section>` : ''}
    <div class="toolbar"><h2>Buchungen</h2><button class="primary" data-action="expense-form">${icon('plus')}Ausgabe</button></div>
    ${list.length ? Object.entries(groups).map(([d, xs]) => `<h3 class="date-head">${fmtDay(d)}</h3>
      <ul class="ledger">${xs.map(x => `<li><button data-action="expense-form" data-id="${x.id}">
        <span class="txt"><b>${esc(x.note || x.cat)}</b><small>${esc(x.cat)}, bezahlt von ${esc(personName(x.paidBy))}, ${splitLabel(x)}</small></span>
        <span class="amt${x.cat === SETTLE ? ' settle-amt' : ''}">${money(x.amount)}</span>
      </button></li>`).join('')}</ul>`).join('')
      : '<p class="hint">Noch keine Ausgaben. Kosten aus Stellplatz-Einträgen landen automatisch hier.</p>'}`;
};

function expenseForm(id) {
  const x = S.expenses.find(e => e.id === id) || { date: today(), paidBy: me(), split: defaultSplit(), cat: 'Lebensmittel' };
  const catOpts = [...CATS, SETTLE].map(c => `<option${c === x.cat ? ' selected' : ''}>${c}</option>`).join('');
  const split = forWhom(x);
  const who = members().map(m => `<label class="chip"><input type="radio" name="paidBy" value="${m.id}"${x.paidBy === m.id ? ' checked' : ''}><span>${esc(m.name)}</span></label>`).join('');
  const forList = members().map(m => `<label class="chip"><input type="checkbox" name="split" value="${m.id}"${split.includes(m.id) ? ' checked' : ''}><span>${esc(m.name)}</span></label>`).join('');
  openSheet(`<form data-form="expense" data-id="${x.id || ''}">
    <div class="sheet-head"><h2>${x.id ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <div class="row2">
      <label class="field"><span>Betrag in €</span><input name="amount" inputmode="decimal" required value="${x.amount ? String(x.amount).replace('.', ',') : ''}" placeholder="0,00"></label>
      <label class="field"><span>Datum</span><input type="date" name="date" value="${x.date}" required></label>
    </div>
    <label class="field"><span>Kategorie</span><select name="cat">${catOpts}</select></label>
    <label class="field"><span>Wofür?</span><input name="note" value="${esc(x.note)}" placeholder="z. B. Wochenmarkt Annecy"></label>
    <div class="field"><span>Bezahlt von</span><div class="chips wrap">${who}</div></div>
    <div class="field"><span>Für wen? (wird gleichmäßig geteilt)</span><div class="chips wrap">${forList}</div></div>
    <div class="sheet-foot">
      ${x.id ? `<button type="button" class="ghost danger" data-action="del-expense" data-id="${x.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Reisen & Archiv ---------- */

function sketch(t) {
  const pts = tripEntries(t).filter(hasPos).sort(byDate);
  const W = 120, H = 56, P = 6;
  if (pts.length < 2) return `<svg viewBox="0 0 ${W} ${H}" class="sketch"><path d="M${P} ${H / 2} H${W - P}" stroke-dasharray="3 5"/></svg>`;
  const xy = pts.map(p => [p.lng * Math.cos(p.lat * Math.PI / 180), -p.lat]);
  const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((W - 2 * P) / (x1 - x0 || 1e-9), (H - 2 * P) / (y1 - y0 || 1e-9));
  const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const c = xy.map(([x, y]) => [(x - x0) * s + ox, (y - y0) * s + oy].map(v => v.toFixed(1)));
  const [a, b] = [c[0], c[c.length - 1]];
  return `<svg viewBox="0 0 ${W} ${H}" class="sketch"><polyline points="${c.map(p => p.join(',')).join(' ')}"/>
    <circle cx="${a[0]}" cy="${a[1]}" r="3" class="start"/><circle cx="${b[0]}" cy="${b[1]}" r="3.5"/></svg>`;
}

function tripRow(t, cur) {
  const st = tripStats(t);
  return `<li class="trip-row${cur ? ' current' : ''}" style="--trip:${tripColor(t)}">
    <button class="open" data-action="pick-trip" data-id="${t.id}">
      ${sketch(t)}
      <span class="txt">
        <strong>${esc(t.name)}</strong>
        <small>${fmtRange(t)}</small>
        <small>${st.nights} ${st.nights === 1 ? 'Nacht' : 'Nächte'}, ${st.sights} Sehenswertes${st.dist ? `, ${fmtKm(st.dist)}` : ''}${st.cost ? `, ${money(st.cost)}` : ''}</small>
      </span>
    </button>
    <button class="icon-btn small" data-action="trip-form" data-id="${t.id}" aria-label="Reise bearbeiten">${icon('edit')}</button>
  </li>`;
}

VIEWS.reisen = () => {
  const cur = currentTrip();
  const active = activeTrips();
  const archived = sortTrips(S.trips.filter(t => t.archived));
  return `${pageHead('reisen', 'Reisen', 'Tippe eine Reise an, um sie zu öffnen.')}
    <div class="toolbar"><h2>Unterwegs &amp; geplant</h2><button class="primary" data-action="trip-form">${icon('plus')}Neue Reise</button></div>
    <ul class="trips">${active.map(t => tripRow(t, cur && t.id === cur.id)).join('') || '<li class="none">Keine laufende Reise.</li>'}</ul>
    <div class="toolbar"><h2>Archiv</h2>${S.trips.length ? '<button class="link" data-action="all-on-map">Alle Reisen auf der Karte</button>' : ''}</div>
    <ul class="trips">${archived.map(t => tripRow(t, cur && t.id === cur.id)).join('') || '<li class="none">Abgeschlossene Reisen landen hier. Archivieren kannst du eine Reise über den Stift.</li>'}</ul>`;
};

function tripForm(id) {
  const t = S.trips.find(x => x.id === id) || { color: nextColor(), start: today() };
  const swatches = TRIP_COLORS.map(([n, c]) =>
    `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}"${c === t.color ? ' checked' : ''}><span title="${n}"></span></label>`).join('');
  openSheet(`<form data-form="trip" data-id="${t.id || ''}">
    <div class="sheet-head"><h2>${t.id ? 'Reise bearbeiten' : 'Neue Reise'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(t.name)}" required placeholder="z. B. Pfingsten am Gardasee"></label>
    <div class="row2">
      <label class="field"><span>Start</span><input type="date" name="start" value="${t.start || ''}"></label>
      <label class="field"><span>Ende</span><input type="date" name="end" value="${t.end || ''}"></label>
    </div>
    <div class="field"><span>Farbe der Reise</span><div class="swatches">${swatches}</div></div>
    ${canCash() ? `<label class="field"><span>Reisebudget in € (optional)</span><input name="budget" inputmode="decimal" value="${t.budget ? String(t.budget).replace('.', ',') : ''}" placeholder="z. B. 1500"></label>` : ''}
    ${members().length > 1 ? `<div class="field"><span>Wer ist dabei? (für den Reisepass)</span><div class="chips wrap">${members().map(m =>
      `<label class="chip"><input type="checkbox" name="who" value="${m.id}"${!t.members || t.members.includes(m.id) ? ' checked' : ''}><span>${esc(m.name)}</span></label>`).join('')}</div></div>` : ''}
    ${APP.tripFormExtra ? APP.tripFormExtra(t) : ''}
    ${t.id ? `<label class="check"><input type="checkbox" name="archived"${t.archived ? ' checked' : ''}><span>Reise ist abgeschlossen (ins Archiv)</span></label>
    <div class="field"><span>Gefahrene Strecke (GPX)</span>${VIEWS.trackList(t)}</div>` : ''}
    <div class="sheet-foot">
      ${t.id ? `<button type="button" class="ghost danger" data-action="del-trip" data-id="${t.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Einstellungen ---------- */

function syncClass() {
  if (syncState.error) return 'err';
  if (syncState.pending) return 'wait';
  return 'ok';
}

function syncText() {
  if (syncState.error === 'auth') return 'Die Anmeldung ist abgelaufen. Bitte neu anmelden, damit wieder abgeglichen wird.';
  if (syncState.busy) return 'Wird gerade abgeglichen …';
  if (syncState.error && !navigator.onLine) return 'Kein Netz. Änderungen werden gesammelt und später übertragen.';
  if (syncState.error) return `Der Abgleich hat nicht geklappt: ${esc(syncState.error)}`;
  const last = syncState.lastSync ? `zuletzt ${ago(syncState.lastSync)}` : 'noch nie';
  return syncState.pending
    ? `${syncState.pending} ${syncState.pending === 1 ? 'Änderung wartet' : 'Änderungen warten'} auf Netz (Abgleich ${last}).`
    : `Alles abgeglichen, ${last}.`;
}

VIEWS.einstellungen = () => {
  const u = session.user;
  const crews = session.crews;
  return `${pageHead('einstellungen', 'Einstellungen', 'Angemeldet als ' + esc(u.name))}
    <section class="panel">
      <h2>Crew</h2>
      ${crews.length > 1
        ? `<p>Jede Crew hat ihre eigenen Reisen, Listen und Boxen.</p><div class="chips wrap">${crews.map(c =>
            `<button class="chip${c.id === crew.id ? ' on' : ''}" data-action="switch-crew" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`
        : `<p>${esc(crew.name)}</p>`}
      <p class="sub">Mitglieder: ${members().map(m => esc(m.name) + (m.shares ? '' : ' (zahlt nicht mit)')).join(', ')}</p>
    </section>
    <section class="panel">
      <h2>Abgleich</h2>
      <p><span class="sync-dot ${syncClass()}"></span> ${syncText()}</p>
      <div class="btnrow">
        ${syncState.error === 'auth' ? '<button class="primary" data-action="relogin">Neu anmelden</button>' : '<button class="ghost" data-action="sync-now">Jetzt abgleichen</button>'}
      </div>
    </section>
    ${u.isAdmin ? `<section class="panel">
      <h2>Verwaltung</h2>
      <p>Konten für die Familie anlegen, Passwörter zurücksetzen und festlegen, wer zu welcher Crew gehört.</p>
      <a class="ghost btn" href="#/verwaltung">Personen und Crews verwalten</a>
    </section>` : ''}
    <form class="panel" data-form="password">
      <h2>Passwort ändern</h2>
      <div class="row2">
        <label class="field"><span>Bisheriges Passwort</span><input type="password" name="old" autocomplete="current-password" required></label>
        <label class="field"><span>Neues Passwort</span><input type="password" name="new" autocomplete="new-password" minlength="6" required></label>
      </div>
      <button class="ghost">Passwort ändern</button>
    </form>
    <section class="panel">
      <h2>Sicherung</h2>
      <p>Speichert alle Reisen, Listen, Boxen und Fotos dieser Crew in einer Datei.</p>
      <div class="btnrow">
        <button class="ghost" data-action="export">Sicherung herunterladen</button>
        <label class="ghost file">Sicherung einspielen<input type="file" accept="application/json,.json" data-action="import"></label>
      </div>
    </section>
    <section class="panel">
      <h2>Darstellung</h2>
      <div class="seg">${[['auto', 'Wie das Handy'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) =>
        `<button class="${LS.get('theme', 'auto') === v ? 'on' : ''}" data-action="set-theme" data-theme="${v}">${l}</button>`).join('')}</div>
    </section>
    ${settingsPanels.map(f => f()).join('')}
    <section class="panel">
      <h2>App installieren</h2>
      ${installText()}
    </section>
    <section class="panel">
      <button class="ghost danger" data-action="logout">Abmelden</button>
    </section>
    <footer class="colophon"><svg class="wordmark" role="img" aria-label="LAMMping"><use href="#wort"/></svg><span>Unser Reisetagebuch für den Minicamper</span><small>Version ${APP_VERSION}</small></footer>`;
};

/* ---------- Ansicht: Verwaltung (nur Eltern) ---------- */

let admin = null;

async function loadAdmin() {
  try {
    admin = await api('admin');
  } catch (e) {
    admin = { error: e.message };
  }
  render();
}

// Nach Änderungen an Konten oder Crews die eigene Sitzung (Mitgliederlisten) auffrischen
async function refreshSession() {
  try {
    const s = await api('me');
    if (s.user) {
      session = s;
      LS.set('session', s);
      crew = s.crews.find(c => c.id === crew.id) || crew;
    }
  } catch { /* offline: bleibt wie es ist */ }
  loadAdmin();
}

VIEWS.verwaltung = () => {
  if (!session.user.isAdmin) return '<p class="hint">Nur für Verwalter.</p>';
  if (!admin) { loadAdmin(); return pageHead('einstellungen', 'Verwaltung') + '<p class="hint">Wird geladen …</p>'; }
  if (admin.error) return `${pageHead('einstellungen', 'Verwaltung')}<p class="hint">${esc(admin.error)} Die Verwaltung braucht eine Internetverbindung.</p>
    <button class="ghost" data-action="admin-reload">Noch einmal versuchen</button>`;
  const name = id => (admin.users.find(u => u.id === id) || {}).name || '?';
  return `${pageHead('einstellungen', 'Verwaltung', 'Nur Verwalter sehen diese Seite.')}
    <div class="toolbar"><h2>Personen</h2><button class="primary" data-action="user-form">${icon('plus')}Person</button></div>
    <ul class="people">${admin.users.map(u => `<li><button data-action="user-form" data-id="${u.id}">
      <span class="avatar">${esc(u.name[0] || '?')}</span>
      <span class="txt"><b>${esc(u.name)}</b><small>Anmeldename: ${esc(u.login)}${u.isAdmin ? ', Verwalter' : u.canCash ? ', sieht die Kasse' : ', ohne Kasse'}</small></span>
      ${icon('edit')}</button></li>`).join('')}</ul>
    <div class="toolbar"><h2>Crews</h2><button class="primary" data-action="crew-form">${icon('plus')}Crew</button></div>
    <ul class="people">${admin.crews.map(c => `<li><button data-action="crew-form" data-id="${c.id}">
      <span class="txt"><b>${esc(c.name)}</b><small>${c.members.map(m => esc(name(m.id))).join(', ') || 'Noch ohne Mitglieder'}</small></span>
      ${icon('edit')}</button></li>`).join('')}</ul>`;
};

// Eigenes Feld ohne Passwort-Namen: Passwortmanager sollen hier nichts eintragen oder speichern
const pwInput = required => `<label class="field"><span>${required ? 'Passwort (mindestens 6 Zeichen)' : 'Neues Passwort'}</span>
  <input name="newPw" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" data-lpignore="true" data-1p-ignore data-bwignore
    ${required ? 'required ' : ''}minlength="6"></label>`;

function userForm(id) {
  const u = (admin.users.find(x => x.id === id)) || {};
  const self = u.id === session.user.id;
  openSheet(`<form data-form="user" data-id="${u.id || ''}">
    <div class="sheet-head"><h2>${u.id ? 'Person bearbeiten' : 'Neue Person'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(u.name)}" required placeholder="z. B. Lena"></label>
    <label class="field"><span>Anmeldename</span><input name="login" value="${esc(u.login)}" required autocapitalize="none" autocomplete="off" placeholder="z. B. lena"></label>
    ${u.id
      ? `<div class="field" id="pwField"><span>Passwort</span><button type="button" class="ghost" data-action="show-pw-field">Neues Passwort festlegen</button></div>`
      : pwInput(true)}
    <label class="check"><input type="checkbox" name="isAdmin"${u.isAdmin ? ' checked' : ''}${self ? ' disabled' : ''}><span>Verwalter (darf Konten und Crews verwalten)</span></label>
    <label class="check cash-check"><input type="checkbox" name="canCash"${u.isAdmin || u.canCash ? ' checked' : ''}><span>Darf die Kasse sehen</span></label>
    <p class="sub admin-note">Verwalter sehen die Kasse immer.</p>
    ${APP.areaFields ? APP.areaFields(u) : ''}
    ${u.id ? '' : `<label class="check"><input type="checkbox" name="joinCrew" checked><span>Gleich in die Crew „${esc(crew.name)}“ aufnehmen</span></label>`}
    <div class="sheet-foot">
      ${u.id && !self ? `<button type="button" class="ghost danger" data-action="del-user" data-id="${u.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

function crewForm(id) {
  const c = admin.crews.find(x => x.id === id) || { members: [{ id: session.user.id, shares: true }] };
  const rows = admin.users.map(u => {
    const m = c.members.find(x => x.id === u.id);
    return `<li>
      <label class="check"><input type="checkbox" name="member" value="${u.id}"${m ? ' checked' : ''}><span>${esc(u.name)}</span></label>
      <label class="check small"><input type="checkbox" name="shares" value="${u.id}"${!m || m.shares ? ' checked' : ''}><span>zahlt mit</span></label>
    </li>`;
  }).join('');
  openSheet(`<form data-form="crew" data-id="${c.id || ''}">
    <div class="sheet-head"><h2>${c.id ? 'Crew bearbeiten' : 'Neue Crew'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(c.name)}" required placeholder="z. B. Familie oder Lenas Touren"></label>
    <div class="field"><span>Wer gehört dazu?</span>
      <p class="sub">„Zahlt mit“ heißt: Die Person wird in der Kasse bei geteilten Ausgaben berücksichtigt.</p>
      <ul class="member-list">${rows}</ul>
    </div>
    <div class="sheet-foot">
      ${c.id ? `<button type="button" class="ghost danger" data-action="del-crew" data-id="${c.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Anmeldung & Einrichtung ---------- */

const HERO = `<div class="brand-hero"><svg class="hero-sheep" aria-hidden="true"><use href="#schaf"/></svg><svg class="wordmark" role="img" aria-label="LAMMping"><use href="#wort"/></svg></div>`;

VIEWS.loading = () => `<section class="login">${HERO}<p class="sub">Wird geladen …</p></section>`;

VIEWS.login = () => `<section class="login">
  ${HERO}
  <p>Meldet euch mit eurem Anmeldenamen an. Neue Konten legen die Verwalter in den Einstellungen an.</p>
  <form data-form="login" class="panel">
    <label class="field"><span>Anmeldename</span><input name="login" autocomplete="username" autocapitalize="none" required></label>
    <label class="field"><span>Passwort</span><input type="password" name="password" autocomplete="current-password" required></label>
    <button class="primary">Anmelden</button>
  </form>
  <button class="link" data-action="reset-form">Passwort vergessen?</button>
</section>`;

VIEWS.reset = () => `<section class="login">
  ${HERO}
  <h2>Neues Passwort festlegen</h2>
  <p>Wer ein Konto verwaltet, kann in den Einstellungen unter Verwaltung jedes Passwort neu setzen.
    Kommt niemand mehr hinein, hilft der Einrichtungscode: Er steht auf eurem Webspace in der Datei <b>api/config.php</b> bei <b>setup_code</b>.</p>
  <form data-form="reset" class="panel">
    <label class="field"><span>Einrichtungscode</span><input name="code" required autocapitalize="none" autocomplete="off" spellcheck="false"></label>
    <label class="field"><span>Anmeldename</span><input name="login" required autocapitalize="none" autocomplete="username"></label>
    <label class="field"><span>Neues Passwort (mindestens 6 Zeichen)</span><input type="password" name="password" minlength="6" required autocomplete="new-password"></label>
    <button class="primary">Passwort setzen und anmelden</button>
  </form>
  <button class="link" data-action="back-to-login">Zurück zur Anmeldung</button>
</section>`;

VIEWS.setup = () => `<section class="login">
  ${HERO}
  <h2>Willkommen bei LAMMping</h2>
  <p>Einmalige Einrichtung: Du legst dein Verwalter-Konto und eure erste Crew an. Konten für die anderen folgen danach in den Einstellungen.</p>
  <form data-form="setup" class="panel">
    <label class="field"><span>Einrichtungscode (steht in api/config.php)</span><input name="code" required autocapitalize="none" autocomplete="off"></label>
    <label class="field"><span>Name der Crew</span><input name="crew" required placeholder="z. B. Familie"></label>
    <label class="field"><span>Dein Name</span><input name="name" required></label>
    <div class="row2">
      <label class="field"><span>Anmeldename</span><input name="login" required autocapitalize="none" autocomplete="username"></label>
      <label class="field"><span>Passwort</span><input type="password" name="password" minlength="6" required autocomplete="new-password"></label>
    </div>
    <button class="primary">Einrichten</button>
  </form>
</section>`;

VIEWS.nocrew = () => `<section class="login">
  ${HERO}
  <h2>Hallo ${esc(session.user.name)}</h2>
  <p>Du gehörst noch zu keiner Crew. Bitte einen Verwalter, dich in eine Crew aufzunehmen, und öffne die App dann neu.</p>
  <button class="ghost danger" data-action="logout">Abmelden</button>
</section>`;

VIEWS.offline = () => `<section class="login">
  ${HERO}
  <h2>Keine Verbindung</h2>
  <p>Beim ersten Öffnen braucht LAMMping einmal Internet, damit ihr euch anmelden könnt. Danach geht es auch offline.</p>
  <button class="primary" data-action="reload">Noch einmal versuchen</button>
</section>`;

/* ---------- Kopfzeile: Fahrstrecke der V-Klasse ---------- */

// Die V-Klasse fährt genau einmal durch die Landschaft, egal wie breit sie gerade ist
const scenery = $('.scenery');
if (scenery && 'ResizeObserver' in window) {
  new ResizeObserver(([e]) => {
    const w = Math.round(e.contentRect.width);
    scenery.style.setProperty('--scene-w', w + 'px');
    // Gleichmäßiges Tempo von etwa 32 px pro Sekunde, egal wie breit der Bildschirm ist
    scenery.style.setProperty('--drive-s', ((w + 80) / 32 / 0.88).toFixed(1) + 's');
  }).observe(scenery);
  // Die Landschaft beginnt rechts neben dem Reisenamen, das Auto fährt die ganze Breite
  const chip = $('#tripChip');
  new ResizeObserver(() => scenery.style.setProperty('--land-left', Math.round(chip.offsetLeft + chip.offsetWidth) + 'px')).observe(chip);
}

/* ---------- Installieren ---------- */

let installPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const SHARE_ICON = '<svg class="ios-share" viewBox="0 0 24 24" aria-label="Teilen-Symbol"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>';

window.addEventListener('beforeinstallprompt', e => {
  // Chrome/Android: eigenen Knopf anbieten statt des Browser-Banners
  e.preventDefault();
  installPrompt = e;
  render();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  toast('LAMMping ist installiert');
  render();
});

function installText() {
  if (isStandalone()) return '<p>LAMMping läuft als installierte App.</p>';
  if (installPrompt) return `<p>Mit dem Schaf auf dem Startbildschirm, ohne Browserleiste und auch offline.</p>
    <button class="primary" data-action="install">LAMMping installieren</button>`;
  if (isIOS) return `<p>In Safari unten auf ${SHARE_ICON} <b>Teilen</b> tippen, dann <b>„Zum Home-Bildschirm“</b>.</p>`;
  return '<p>Im Browser-Menü <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b> wählen.</p>';
}

function installHint() {
  if (isStandalone() || LS.get('installHintDone', false) || !(installPrompt || isIOS)) return '';
  return `<aside class="install-hint">
    <svg class="hint-sheep" aria-hidden="true"><use href="#schaf"/></svg>
    <p>${installPrompt ? 'LAMMping als App auf den Startbildschirm legen?' : `Als App installieren: ${SHARE_ICON} Teilen, dann „Zum Home-Bildschirm“.`}</p>
    ${installPrompt ? '<button class="primary" data-action="install">Installieren</button>' : ''}
    <button class="icon-btn small" data-action="install-hint-off" aria-label="Hinweis ausblenden">${icon('close')}</button>
  </aside>`;
}

/* ---------- Sicherung ---------- */

async function exportAll() {
  toast('Sicherung wird erstellt …');
  const photos = [];
  for (const e of S.entries) {
    for (const p of e.photos || []) {
      try {
        const { data } = await store.get('photos', p.id);
        if (data.startsWith('data:')) { photos.push({ id: p.id, data }); continue; }
        const blob = await (await fetch(data, { credentials: 'same-origin' })).blob();
        photos.push({ id: p.id, data: await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); }) });
      } catch { /* Foto nicht erreichbar: nur Vorschaubild bleibt erhalten */ }
    }
  }
  const data = { app: 'lammping', version: 2, crew: crew.name, created: new Date().toISOString(), photos };
  WATCHED.forEach(c => { data[c] = S[c]; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = `lammping-${crew.name.replace(/[^\wäöüÄÖÜß-]+/g, '-')}-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importAll(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast('Die Datei ist keine LAMMping-Sicherung.'); }
  if (data.app !== 'lammping' && data.app !== 'bordbuch') return toast('Die Datei ist keine LAMMping-Sicherung.');
  const n = WATCHED.reduce((s, c) => s + (data[c] || []).length, 0);
  if (!confirm(`${n} Einträge und ${(data.photos || []).length} Fotos in die Crew „${crew.name}“ einspielen? Gleiche Einträge werden überschrieben, alles andere bleibt.`)) return;
  for (const p of data.photos || []) await store.put('photos', p);
  for (const c of WATCHED) for (const d of data[c] || []) if (d && d.id) await store.put(c, d);
  toast('Sicherung eingespielt');
}

/* ---------- Sheet (Dialog) ---------- */

function openSheet(html, onMount) {
  const dlg = $('#sheet');
  $('#sheetBody').innerHTML = html;
  if (!dlg.open) { dlg.showModal(); if (APP.onSheetOpen) APP.onSheetOpen(); }
  const root = $('#sheetBody').firstElementChild;
  if (onMount) onMount(root);
}
function closeSheet() {
  const dlg = $('#sheet');
  if (dlg.open) dlg.close();
}
$('#sheet').addEventListener('close', () => {
  if (APP.onSheetClose) APP.onSheetClose();
  if (pickMap) { pickMap.remove(); pickMap = null; pickMarker = null; }
  $('#sheetBody').innerHTML = '';
});
// Tipp auf den abgedunkelten Hintergrund schließt
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

/* ---------- Aktionen ---------- */

const CHANGES = {};   // Erweiterungen für Datei-Eingaben (z. B. GPX)
const settingsPanels = [];   // zusätzliche Abschnitte in den Einstellungen (z. B. Testmodus)

const ACTIONS = {
  close: closeSheet,
  'map-scope': el => { ui.mapScope = el.dataset.scope; render(); },
  'here-menu': () => openSheet(`<div>
    <div class="sheet-head"><h2>Ich bin hier …</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <div class="here-grid">
      ${Object.entries(TYPES).filter(([k]) => k !== 'notiz').map(([k, v]) =>
        `<button data-action="new-here" data-type="${k}">${icon(k)}<b>${v.label}</b><small>${v.hint}</small></button>`).join('')}
      <button data-action="park-here">${icon('car')}<b>Auto geparkt</b><small>Standort merken</small></button>
      <button data-action="new-here" data-type="notiz">${icon('notiz')}<b>Notiz</b><small>Ohne Position</small></button>
    </div></div>`),
  'new-here': el => {
    const type = el.dataset.type;
    openEntryForm({ type }, { locate: type !== 'notiz' });
  },
  locate: async el => {
    el.disabled = true;
    try {
      const p = await getPos();
      showMe(p);
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 14));
    } catch (err) { toast(err.message); } finally { el.disabled = false; }
  },
  'park-here': parkHere,
  'car-sheet': carSheet,
  'car-on-map': () => {
    const car = S.meta.find(m => m.id === 'car');
    closeSheet();
    pendingFocus = { lat: car.lat, lng: car.lng };
    go('karte');
  },
  'car-clear': () => { remove('meta', 'car'); closeSheet(); },

  'diary-filter': el => { ui.diaryFilter = el.dataset.f; render(); },
  'diary-mode': el => { ui.diaryMode[currentTrip().id] = el.dataset.mode; render(); },
  'toggle-places': () => { ui.showPlaces = !ui.showPlaces; LS.set('showPlaces', ui.showPlaces); render(); },
  'map-layers': () => openSheet(`<div class="map-layers">${sheetHead('Was zeigt die Karte?')}
      <div class="field"><span>Symbole der Reise</span><div class="seg">${[['alle', 'Alle'], ['nacht', 'Nur Übernachtungen'], ['keine', 'Nur Strecke']].map(([k, l]) =>
        `<label><input type="radio" name="pins" value="${k}" data-action-input="map-pins"${ui.mapPins === k ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
      <label class="check"><input type="checkbox" data-action-input="map-places"${ui.showPlaces ? ' checked' : ''}><span>Gemerkte und geplante Orte zeigen</span></label>
      <p class="sub">„Nur Strecke“ zeigt nur die Linie der Reise, ohne Symbole und ohne gemerkte Orte – z. B. für einen schönen Überblick oder ein Bildschirmfoto.</p></div>`),
  'set-theme': el => {
    const v = el.dataset.theme;
    LS.set('theme', v);
    if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    render();
  },
  'entry-form': () => openEntryForm({ type: 'notiz' }),
  'open-entry': el => openEntry(el.dataset.id),
  'edit-entry': el => openEntryForm(S.entries.find(e => e.id === el.dataset.id)),
  'del-entry': el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e || !confirm('Diesen Eintrag mit seinen Fotos löschen?')) return;
    [...(e.photos || []), ...(e.sounds || [])].forEach(p => remove('photos', p.id));
    S.expenses.filter(x => x.entryId === e.id).forEach(x => remove('expenses', x.id));
    S.fuel.filter(f => f.entryId === e.id).forEach(f => {
      S.expenses.filter(x => x.fuelId === f.id).forEach(x => remove('expenses', x.id));
      remove('fuel', f.id);
    });
    remove('entries', e.id);
    closeSheet();
  },
  'show-on-map': el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    closeSheet();
    if (e.tripId !== (currentTrip() || {}).id) setTrip(e.tripId);
    ui.mapScope = 'trip';
    pendingFocus = { lat: e.lat, lng: e.lng, id: e.id };
    go('karte');
  },
  'pos-here': el => locateInto(el.form),
  'pos-pick': el => { if (!pickMap) openPicker(el.form); },
  rate: el => {
    const form = el.form, v = +el.dataset.v;
    const nv = +form.rating.value === v ? 0 : v;
    form.rating.value = nv;
    form.querySelectorAll('.star').forEach(s => s.classList.toggle('on', +s.dataset.v <= nv));
  },
  'drop-photo': el => {
    const id = el.dataset.id;
    if (formPhotos.keep.some(p => p.id === id)) formPhotos.drop.push(id);
    formPhotos.keep = formPhotos.keep.filter(p => p.id !== id);
    formPhotos.add = formPhotos.add.filter(p => p.id !== id);
    $('#photoGrid').innerHTML = photoGrid();
  },

  'list-tab': el => { ui.listTab = el.dataset.tab; LS.set('listTab', ui.listTab); render(); },
  'toggle-item': el => {
    const i = S.listItems.find(x => x.id === el.dataset.id);
    save('listItems', { ...i, done: !i.done, doneAt: Date.now() });
  },
  'del-item': el => { remove('listItems', el.dataset.id); closeSheet(); },
  'clear-done': el => S.listItems.filter(i => itemListId(i) === el.dataset.list && i.done).forEach(i => remove('listItems', i.id)),
  'list-pick': el => { LS.set('list.' + ui.listTab, el.dataset.id); render(); },
  'list-form': el => listForm(el.dataset.id, el.dataset.kind, el.dataset.trip),
  'item-sheet': el => itemSheet(el.dataset.id),
  'del-list': el => {
    const n = +el.dataset.n;
    if (!confirm(n ? `Liste mit ${n} Einträgen löschen?` : 'Liste löschen?')) return;
    S.listItems.filter(i => itemListId(i) === el.dataset.id).forEach(i => remove('listItems', i.id));
    remove('lists', el.dataset.id);
    closeSheet();
  },

  'pack-mode': el => { ui.packMode = el.dataset.mode; render(); },
  pack: el => {
    const t = currentTrip();
    const id = `${t.id}_${el.dataset.id}`;
    const cur = S.packstate.find(p => p.id === id);
    if (cur && cur.packed) remove('packstate', id);
    else save('packstate', { id, tripId: t.id, itemId: el.dataset.id, packed: true });
  },
  'pack-reset': () => {
    const t = currentTrip();
    if (!confirm('Alle Haken für diese Reise entfernen?')) return;
    S.packstate.filter(p => p.tripId === t.id).forEach(p => remove('packstate', p.id));
  },
  'box-form': el => boxForm(el.dataset.id),
  'item-form': el => itemForm(el.dataset.id, el.dataset.box, el.dataset.trip),
  'box-move': el => moveBox(el.dataset.id, +el.dataset.dir),
  'del-box': el => {
    const n = S.items.filter(i => i.boxId === el.dataset.id).length;
    if (!confirm(n ? `Löschen? Die ${n} Gegenstände darin bleiben als „Lose im Auto“ erhalten.` : 'Wirklich löschen?')) return;
    remove('boxes', el.dataset.id);
    closeSheet();
  },
  'del-pack-item': el => {
    remove('items', el.dataset.id);
    S.packstate.filter(p => p.itemId === el.dataset.id).forEach(p => remove('packstate', p.id));
    closeSheet();
  },

  'expense-form': el => expenseForm(el.dataset.id),
  'del-expense': el => { if (confirm('Diese Buchung löschen?')) { remove('expenses', el.dataset.id); closeSheet(); } },
  settle: el => {
    const { from, to } = el.dataset, amount = +el.dataset.amount;
    if (!confirm(`${personName(from)} gibt ${personName(to)} ${money(amount)}. Als Ausgleich eintragen?`)) return;
    save('expenses', {
      id: newId(), tripId: currentTrip().id, date: today(), cat: SETTLE,
      note: `${personName(from)} an ${personName(to)}`, amount, paidBy: from, split: [to],
    });
  },

  'trip-form': el => tripForm(el.dataset.id),
  'pick-trip': el => { setTrip(el.dataset.id); lastFit = ''; go('tagebuch'); },
  'all-on-map': () => { ui.mapScope = 'all'; lastFit = ''; go('karte'); },
  'del-trip': el => {
    const t = S.trips.find(x => x.id === el.dataset.id);
    const n = tripEntries(t).length;
    if (!confirm(`„${t.name}“ endgültig löschen?${n ? ` Auch die ${n} Einträge, Fotos und Ausgaben dieser Reise werden gelöscht.` : ''}`)) return;
    tripEntries(t).forEach(e => { [...(e.photos || []), ...(e.sounds || [])].forEach(p => remove('photos', p.id)); remove('entries', e.id); });
    S.expenses.filter(x => x.tripId === t.id).forEach(x => remove('expenses', x.id));
    S.packstate.filter(p => p.tripId === t.id).forEach(p => remove('packstate', p.id));
    remove('trips', t.id);
    closeSheet();
  },

  export: exportAll,
  logout: async () => {
    if (syncState.pending && !confirm('Es sind noch Änderungen nicht übertragen. Trotzdem abmelden?')) return;
    try { await api('logout', {}); } catch { /* offline: Cookie läuft trotzdem ab */ }
    LS.set('session', null);
    location.hash = '';
    location.reload();
  },
  reload: () => location.reload(),
  install: async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    if (outcome === 'accepted') LS.set('installHintDone', true);
    render();
  },
  'install-hint-off': () => { LS.set('installHintDone', true); render(); },
  relogin: () => { gate = 'login'; render(); },
  'sync-now': () => store.sync(),
  'switch-crew': el => { LS.set('crew', el.dataset.id); location.hash = '#/karte'; location.reload(); },

  'admin-reload': () => { admin = null; render(); },
  'user-form': el => userForm(el.dataset.id),
  'show-pw-field': () => { $('#pwField').outerHTML = pwInput(false); $('[name=newPw]').focus(); },
  'reset-form': () => { gate = 'reset'; render(); },
  'back-to-login': () => { gate = 'login'; render(); },
  'crew-form': el => crewForm(el.dataset.id),
  'del-user': async el => {
    const u = admin.users.find(x => x.id === el.dataset.id);
    if (!confirm(`Das Konto von ${u.name} löschen? Einträge bleiben erhalten.`)) return;
    try { await api('user-delete', { id: u.id }); closeSheet(); refreshSession(); } catch (e) { toast(e.message); }
  },
  'del-crew': async el => {
    const c = admin.crews.find(x => x.id === el.dataset.id);
    if (!confirm(`Die Crew „${c.name}“ mit allen Reisen, Listen, Boxen und Fotos endgültig löschen?`)) return;
    if (c.id === crew.id) return toast('Die gerade geöffnete Crew kann nicht gelöscht werden. Wechsle vorher die Crew.');
    try { await api('crew-delete', { id: c.id }); closeSheet(); refreshSession(); } catch (e) { toast(e.message); }
  },
};

const FORMS = {
  entry: submitEntry,
  'list-add': form => {
    const text = form.text.value.trim();
    if (!text) return;
    const kind = form.dataset.kind;
    // Noch keine Liste dieser Art: die erste entsteht mit dem ersten Eintrag
    const l = S.lists.find(x => x.id === form.dataset.list) || newList(kind);
    save('listItems', { id: newId(), listId: l.id, list: l.kind, text, done: false, by: me(), createdAt: Date.now() });
    form.text.value = '';
    form.text.focus();
  },
  list: form => {
    const old = S.lists.find(l => l.id === form.dataset.id);
    const l = save('lists', {
      ...(old || { id: newId(), kind: form.dataset.kind, createdAt: Date.now(), order: listsOf(form.dataset.kind).length }),
      name: form.name.value.trim(), tripId: form.tripId.value || null, pinned: form.pinned.checked,
    });
    if (!old) LS.set('list.' + l.kind, l.id);
    closeSheet();
  },
  'list-item': form => {
    const i = S.listItems.find(x => x.id === form.dataset.id);
    const target = S.lists.find(l => l.id === form.listId.value);
    const from = S.lists.find(l => l.id === itemListId(i));
    const moved = target && from && target.id !== from.id;
    save('listItems', { ...i, text: form.text.value.trim(), listId: target.id, list: target.kind, movedFrom: moved ? from.name : i.movedFrom || '', pinned: form.pinned.checked });
    closeSheet();
    if (moved) toast(`Verschoben nach „${target.name}“`);
  },
  box: form => {
    const old = S.boxes.find(b => b.id === form.dataset.id);
    save('boxes', { ...(old || { id: newId() }), kind: form.kind.value, name: form.name.value.trim(), where: form.where.value.trim(),
      order: old ? old.order : Math.max(0, ...S.boxes.map(b => b.order || 0)) + 1 });
    closeSheet();
  },
  item: form => {
    const old = S.items.find(i => i.id === form.dataset.id);
    save('items', {
      ...(old || { id: newId() }), name: form.name.value.trim(), boxId: form.boxId.value, note: form.note.value.trim(),
      tripId: form.extra && form.extra.checked ? form.extra.value : null,
    });
    closeSheet();
    toast(old ? 'Gespeichert' : 'Gegenstand angelegt');
  },
  expense: form => {
    const old = S.expenses.find(x => x.id === form.dataset.id);
    const amount = num(form.amount.value);
    if (amount <= 0) return toast('Bitte einen Betrag eintragen.');
    if (!form.querySelector('[name=split]:checked')) return toast('Bitte auswählen, für wen die Ausgabe war.');
    save('expenses', {
      ...(old || { id: newId(), tripId: currentTrip().id }),
      amount, date: form.date.value, cat: form.cat.value, note: form.note.value.trim(),
      paidBy: form.paidBy.value, split: [...form.querySelectorAll('[name=split]:checked')].map(i => i.value),
    });
    closeSheet();
  },
  trip: form => {
    const old = S.trips.find(t => t.id === form.dataset.id);
    const t = save('trips', {
      ...(old || { id: newId(), createdAt: Date.now(), archived: false }),
      name: form.name.value.trim(), start: form.start.value, end: form.end.value,
      color: form.color.value || nextColor(),
      archived: old ? form.archived.checked : false,
      budget: form.budget ? num(form.budget.value) || 0 : (old && old.budget) || 0,
      // Mitreisende: leer = alle (auch Personen, die später dazukommen)
      members: form.who && [...form.querySelectorAll('[name=who]:not(:checked)')].length ? [...form.querySelectorAll('[name=who]:checked')].map(c => c.value) : null,
    });
    if (APP.tripSaved) APP.tripSaved(t, old, form);
    if (!old) { setTrip(t.id); lastFit = ''; }
    closeSheet();
    if (!old) go('tagebuch');
  },
  password: async form => {
    try {
      await api('password', { old: form.old.value, new: form.new.value });
      form.reset();
      toast('Passwort geändert');
    } catch (e) { toast(e.message); }
  },
  login: form => sendAuth(form, 'login', { login: form.login.value.trim(), password: form.password.value }),
  reset: form => sendAuth(form, 'reset', { code: form.code.value.trim(), login: form.login.value.trim(), password: form.password.value }),
  setup: form => sendAuth(form, 'setup', {
    code: form.code.value.trim(), crew: form.crew.value.trim(), name: form.name.value.trim(),
    login: form.login.value.trim(), password: form.password.value,
  }),
  user: async form => {
    const id = form.dataset.id || null;
    try {
      const res = await api('user-save', {
        id, name: form.name.value.trim(), login: form.login.value.trim(),
        password: form.newPw ? form.newPw.value : '', isAdmin: form.isAdmin.checked || (id === session.user.id), canCash: form.canCash.checked,
        ...(APP.readAreas ? APP.readAreas(form) : {}),
      });
      if (!id && form.joinCrew && form.joinCrew.checked) {
        const c = admin.crews.find(x => x.id === crew.id);
        // Neue Personen zahlen standardmäßig nicht mit (meist Kinder); änderbar in der Crew
        await api('crew-save', { id: c.id, name: c.name, members: [...c.members, { id: res.id, shares: form.isAdmin.checked }] });
      }
      closeSheet();
      toast(id ? 'Gespeichert' : 'Konto angelegt');
      refreshSession();
    } catch (e) { toast(e.message); }
  },
  crew: async form => {
    const shares = new Set([...form.querySelectorAll('[name=shares]:checked')].map(i => i.value));
    const chosen = [...form.querySelectorAll('[name=member]:checked')].map(i => ({ id: i.value, shares: shares.has(i.value) }));
    if (form.dataset.id === crew.id && !chosen.some(m => m.id === session.user.id)) {
      return toast('Du kannst dich nicht aus der geöffneten Crew entfernen.');
    }
    try {
      await api('crew-save', { id: form.dataset.id || null, name: form.name.value.trim(), members: chosen });
      closeSheet();
      toast('Gespeichert');
      refreshSession();
    } catch (e) { toast(e.message); }
  },
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT') return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  ev.preventDefault();
  fn(el, ev);
});

document.addEventListener('submit', ev => {
  const form = ev.target.closest('form[data-form]');
  if (!form) return;
  ev.preventDefault();
  FORMS[form.dataset.form](form);
});

document.addEventListener('change', ev => {
  const k = ev.target.dataset.actionInput;
  if (k === 'map-pins') { ui.mapPins = ev.target.value; LS.set('mapPins', ui.mapPins); render(); }
  if (k === 'map-places') { ui.showPlaces = ev.target.checked; LS.set('showPlaces', ui.showPlaces); render(); }
});

document.addEventListener('input', ev => {
  if (ev.target.dataset.actionInput === 'pack-search') { ui.packQuery = ev.target.value; render(); }
});

document.addEventListener('change', async ev => {
  const el = ev.target;
  if (el.dataset.action === 'add-photos') {
    const files = [...el.files];
    el.value = '';
    await addPhotoFiles(files);
  }
  if (el.dataset.action === 'import' && el.files[0]) { importAll(el.files[0]); el.value = ''; }
  if (CHANGES[el.dataset.action]) CHANGES[el.dataset.action](el);
});

/* ---------- Navigation ---------- */

function go(route) {
  if (location.hash !== '#/' + route) location.hash = '#/' + route;
  else { ui.route = route; render(); }
}

// Unteradressen für Schnellstart (App-Symbol lange drücken), z. B. #/karte/hier oder #/listen/einkauf
const ROUTE_ARGS = {
  'karte/hier': () => ACTIONS['here-menu'](),
  'karte/auto': () => carSheet(),
  'listen/einkauf': () => { ui.listTab = 'einkauf'; LS.set('listTab', 'einkauf'); render(); },
};
function onHash() {
  const [r, arg] = (location.hash.replace(/^#\/?/, '') || 'karte').split('/');
  ui.route = r;
  closeSheet();
  render();
  if (r !== 'karte') window.scrollTo(0, 0);
  const fn = arg && ROUTE_ARGS[`${r}/${arg}`];
  if (fn) {
    history.replaceState(null, '', '#/' + r);
    // warten, bis Anmeldung und Daten bereit sind
    const run = () => (gate ? setTimeout(run, 300) : setTimeout(fn, 150));
    run();
  }
}
window.addEventListener('hashchange', onHash);

/* ---------- Start ---------- */

async function sendAuth(form, action, body) {
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    const s = await api(action, body);
    LS.set('session', s);
    if (store && s.crews.some(c => c.id === crew.id)) {
      // Nur die Anmeldung war abgelaufen: weiterarbeiten, ausstehende Änderungen übertragen
      session = s;
      gate = null;
      store.sync();
      onHash();
    } else {
      location.reload();
    }
  } catch (e) {
    toast(e.message);
    btn.disabled = false;
  }
}

async function start() {
  render();
  if (LS.get('updated', null)) { LS.set('updated', null); setTimeout(() => toast(`LAMMping ist jetzt auf Version ${APP_VERSION}.`), 800); }
  let s;
  try {
    s = await api('me');
    if (s.user) LS.set('session', s);
  } catch {
    // Offline: mit der zuletzt bekannten Anmeldung weiterarbeiten
    s = LS.get('session', null);
    if (!s) { gate = 'offline'; return render(); }
  }
  if (s.setup) { gate = 'setup'; return render(); }
  if (!s.user) { gate = 'login'; return render(); }
  session = s;
  crew = s.crews.find(c => c.id === LS.get('crew', null)) || s.crews[0];
  if (!crew) { gate = 'nocrew'; return render(); }
  LS.set('crew', crew.id);

  // Kassen-Freigabe geändert? Neu freigegeben: alles neu holen. Entzogen: lokale Kasse löschen.
  const cashKey = 'cash.' + crew.id, hadCash = LS.get(cashKey, null);
  if (hadCash === false && canCash()) localStorage.setItem('lp.rev.' + crew.id, '0');
  LS.set(cashKey, canCash());

  store = new SyncStore(crew.id);
  store.onStatus(st => {
    syncState = { ...st };
    if (st.error === 'auth' && !gate) toast('Anmeldung abgelaufen. In den Einstellungen neu anmelden.');
    const dot = $('#syncDot');
    if (dot) dot.className = 'sync-dot ' + syncClass();
    if (ui.route === 'einstellungen' && !gate) render();
  });
  await store.init();
  if (hadCash && !canCash()) { await store.clearLocal('expenses'); await store.clearLocal('fuel'); }
  gate = null;
  WATCHED.forEach(c => store.watch(c, list => { S[c] = list; render(); }));
  onHash();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
      // Beim Öffnen und beim Zurückkehren in die App nach einer neuen Version fragen
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    // Neue Version übernommen: einmal neu laden, damit alle Dateien zusammenpassen
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded || document.querySelector('#sheet[open]')) return;
      reloaded = true;
      LS.set('updated', APP_VERSION);
      location.reload();
    });
  }
}

// Stufe 2 (mehr.js): Mehr-Menü, Planung, Orte, Tankbuch, Checklisten, Fahrzeug, Statistik, GPX
const APP = {
  S, ui, LS, VIEWS, ACTIONS, FORMS, CHANGES, mapHooks,
  $, esc, money, num, icon, art, pageHead, newId, save, remove, toast, render, go, openSheet, closeSheet,
  today, nowLocal, fmtDay, fmtShort, fmtTime, fmtRange, ago, km, fmtKm, hasPos, navUrl, byDate, sortTrips,
  getPos, placeInfo, locateInto, openPicker, setFormPos, posLabel, pinIcon, entryPopup,
  currentTrip, tripColor, tripStats, tripEntries, members, me, personName, canCash, defaultSplit,
  openEntryForm, itemListId, listsOf, listForm, extrasOf, isPacked, itemForm, FEATURES, TYPES, CATS, SETTLE,
  setPendingFocus: f => { pendingFocus = f; },
  refit: () => { lastFit = null; },
  mapClickHooks, MINOR, applyType, settingsPanels, showMe, payers, typesIn, costCat, extraText,
  crewId: () => crew.id, crewName: () => crew.name, chromeHooks, api, ROUTE_ARGS, sheetHead, nextColor, setTrip, tripHead, afterDraw, openEntry,
  session: () => session, store: () => store, shrink,
  setSimulator: f => { simulatedPos = f; }, addFormPhoto, addPhotoFiles, formPhotos: () => formPhotos, submitEntry,
  get map() { return map; },
  get routeLayer() { return routeLayer; },
  ensureMap,
};
installKacheln(APP);
installMore(APP);
installMapEdit(APP);
installTestdaten(APP);
installExtras(APP);
installSpiele(APP);
installIdeen(APP);
installExport(APP);
installUnterwegs(APP);
installTeilen(APP);
installFotos(APP);
installReisepass(APP);
installPackhilfe(APP);
installFilm(APP);
installFamilie(APP);
installAlltag(APP);
installZeitachse(APP);
installWelt(APP);
installAuswertung(APP);
installAbenteuer(APP);
installWeitergeben(APP);
installDraussen(APP);
installZuladung(APP);
installStellplatz(APP);
installFamilienrat(APP);
installFahrspiele(APP);
installMitteilen(APP);
installTickets(APP);
installLabyrinth(APP);
installSprache(APP);
installEintragen(APP);
installFotoansicht(APP);
installHerzen(APP);
installLesen(APP);
installKartenebenen(APP);
installBedienung(APP);
installFahrzeuge(APP);
installInfos(APP);
if (APP.sortGames) APP.sortGames();
installNavigation(APP);

start();
