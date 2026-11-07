import { SyncStore, api, newId } from './store.js';
import { TRIP_KINDS, tripKind, kindInfo, isNight, NIGHT_TYPES, splitLegs, legKm, legOf, drawSpecialLegs, LEG_STYLE } from './reiseweg.js';
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
import installFamilienleben from './familienleben.js';
import installSichern from './sichern.js';
import installSpielekiste from './spielekiste.js';
import installMitfahrer from './mitfahrer.js';
import installDateien from './dateien.js';
import installMitreisen from './mitreisen.js';
import installStrecken from './strecken.js';
import installZuschnitt from './zuschnitt.js';
import installHeute from './heute.js';
import installMitteilungen from './mitteilungen.js';
import installSpuren from './spuren.js';
import installReisearten from './reisearten.js';
import installStarthilfe from './starthilfe.js';

/* ---------- Konstanten ---------- */

// Versionsnummer: gleich wie VERSION in sw.js und wie die Nummer im Dateinamen der Lieferung (lammping-komplett-NN.zip)
const APP_VERSION = 83;

const TRIP_COLORS = [
  ['Petrol', '#0F6670'], ['Koralle', '#E4572E'], ['Senf', '#C9961A'], ['Moos', '#4F8A3C'],
  ['Pflaume', '#7B4B94'], ['Himmel', '#2E7FB8'], ['Rost', '#A4462B'], ['Schiefer', '#46596E'],
  // Weitere Farben (Version 61): kräftig genug für Linien auf der Karte, untereinander gut zu unterscheiden
  ['Himbeere', '#C2185B'], ['Lagune', '#00897B'], ['Mandarine', '#EF8A17'], ['Tanne', '#2E5E3A'],
  ['Lavendel', '#8E7CC3'], ['Nachtblau', '#1F3A93'], ['Kirsche', '#B71C1C'], ['Oliv', '#7C7A2A'],
  ['Türkis', '#1BA6B8'], ['Flieder', '#B05FA8'], ['Kakao', '#6D4C3D'], ['Anthrazit', '#2F2F2F'],
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
  // Version 72: weitere Eintragsarten
  stadtbummel: "<path d=\"M8 6.5a4 4 0 0 1 8 0V9H8zM12 9v13M8.5 22h7\"/>",
  aussicht: "<path d=\"M2 20l6-9 4 5 3-4 7 8z\"/><circle cx=\"17\" cy=\"6\" r=\"2.5\"/>",
  natur: "<path d=\"M5 19C5 10 10 5 20 4c0 9-5 15-15 15z\"/><path d=\"M5 19l8-8\"/>",
  markt: "<path d=\"M3 9l2-5h14l2 5\"/><path d=\"M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0\"/><path d=\"M5 12v9h14v-9\"/>",
  fest: "<path d=\"M2 5q10 6 20 0\"/><path d=\"M4 6.1 8 7.5 6 12.5ZM10 7.9h4l-2 5.1ZM16 7.5l4-1.4-2 6.4Z\"/>",
  begegnung: "<circle cx=\"6.5\" cy=\"7\" r=\"3\"/><path d=\"M2.5 21v-5a4 4 0 0 1 8 0v5\"/><circle cx=\"17.5\" cy=\"7\" r=\"3\"/><path d=\"M13.5 21v-5a4 4 0 0 1 8 0v5\"/>",
  // Version 75: Reisearten
  unterkunft: '<path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.8"/>',
  huette: '<path d="M2 20 8.5 9l3 5M10 20l6-10 6 10z"/><path d="M14.5 20v-3h3v3"/>',
  flug: '<path d="M21 15.5 13 11V5.5a1.5 1.5 0 0 0-3 0V11l-8 4.5V17l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.5l8 2.5z"/>',
  bahnfahrt: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
  hafen: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8M4 13a8 8 0 0 0 16 0"/>',
  mietwagen: '<path d="M3 16v-4l2-5h14l2 5v4H3zM3 12h18"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M14 4h6M18 4v2"/>',
  freizeitpark: '<circle cx="12" cy="10" r="7"/><path d="M12 3v14M5 10h14M7 5l10 10M17 5 7 15M8 21l4-4 4 4"/>',
  fahrt: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"2.5\"/><path d=\"M9.8 13.25 4.2 16.5M14.2 13.25l5.6 3.25M12 9.5V3\"/>",
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.notiz}</svg>`;

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
  // Version 72: Erlebnisse ohne festen Platz
  stadtbummel: { label: 'Stadtbummel / Spaziergang', many: 'Stadtbummel', hint: 'Gassen, Hafen, Altstadt', rating: true, group: 'erleben' },
  aussicht: { label: 'Aussicht', many: 'Aussichten', hint: 'Aussichtspunkt, Panorama, Sonnenuntergang', rating: true, group: 'erleben' },
  natur: { label: 'Natur & Tiere', many: 'Natur & Tiere', hint: 'Tiere beobachten, Wasserfall, Landschaft', rating: true, group: 'erleben' },
  markt: { label: 'Markt', many: 'Märkte', hint: 'Wochenmarkt, Flohmarkt, Hofladen', cost: 'Lebensmittel', rating: true, group: 'erleben' },
  fest: { label: 'Fest / Veranstaltung', many: 'Feste', hint: 'Dorffest, Konzert, Feuerwerk', cost: 'Eintritt', rating: true, group: 'erleben' },
  begegnung: { label: 'Begegnung', many: 'Begegnungen', hint: 'Nette Leute getroffen', group: 'erleben' },
  fahrt: { label: 'Fahrt', many: 'Fahrten', hint: 'Passstraße, schöne Strecke, Stau', rating: true, minor: true, group: 'unterwegs' },
  // Version 75: andere Reisearten (Flug, Bahn, Kreuzfahrt, Hotel …). Flug, Bahnfahrt und Fähre sind selbst ein Abschnitt:
  // der Ort ist das Ziel, „Von“ (optional) der Start; ohne „Von“ beginnt der Abschnitt beim Eintrag davor.
  unterkunft: { label: 'Unterkunft', many: 'Unterkünfte', hint: 'Hotel, Ferienwohnung, Pension', cost: 'Unterkunft', rating: true,
    extras: [{ key: 'stay', label: 'Art', options: ['Hotel', 'Ferienwohnung', 'Pension', 'Hütte', 'Bei Freunden'] },
      { key: 'checkout', label: 'Abreise bis', text: true, ph: 'z. B. 10 Uhr' }, { key: 'again', label: 'Wiederkommen?', options: ['Gern wieder', 'Vielleicht', 'Lieber nicht'] }] },
  huette: { label: 'Berghütte', many: 'Berghütten', hint: 'Übernachtung auf der Hütte', cost: 'Unterkunft', rating: true,
    extras: [{ key: 'height', label: 'Höhe in m', num: true }, { key: 'again', label: 'Wiederkommen?', options: ['Gern wieder', 'Vielleicht', 'Lieber nicht'] }] },
  flug: { label: 'Flug', many: 'Flüge', hint: 'Ort = Ziel, „Von“ = Start', cost: 'Flug', group: 'unterwegs',
    extras: [{ key: 'from', label: 'Von', text: true, ph: 'z. B. München Flughafen' }, { key: 'no', label: 'Flugnummer', text: true, ph: 'z. B. LH 1234' }] },
  bahnfahrt: { label: 'Bahnfahrt', many: 'Bahnfahrten', hint: 'Ort = Ziel, „Von“ = Start', cost: 'Bahn & Bus', group: 'unterwegs',
    extras: [{ key: 'from', label: 'Von', text: true, ph: 'z. B. München Hbf' }, { key: 'no', label: 'Zug', text: true, ph: 'z. B. ICE 597' }] },
  hafen: { label: 'Hafen / Landgang', many: 'Häfen', hint: 'Anlegen, Landgang, Ausflug vom Schiff', cost: 'Eintritt', rating: true, group: 'erleben' },
  mietwagen: { label: 'Mietwagen', many: 'Mietwagen', hint: 'Übernahme oder Rückgabe', cost: 'Mietwagen', minor: true, group: 'unterwegs',
    extras: [{ key: 'what', label: 'Was?', options: ['Übernahme', 'Rückgabe'] }, { key: 'firm', label: 'Firma', text: true, ph: 'z. B. Sixt' }] },
  freizeitpark: { label: 'Freizeitpark', many: 'Freizeitparks', hint: 'Achterbahn, Wasserpark, Zoo', cost: 'Eintritt', rating: true, group: 'erleben' },
  notiz: { label: 'Notiz', many: 'Notizen', hint: 'Gedanken zum Tag' },
};
// Welche Arten je Reiseart vorn stehen (danach die am häufigsten benutzten)
const KIND_TYPES = {
  camping: ['stellplatz', 'sight', 'wanderung', 'tank', 'pause'],
  zelten: ['stellplatz', 'sight', 'wanderung', 'baden', 'pause'],
  motorrad: ['stellplatz', 'fahrt', 'pause', 'tank', 'aussicht'],
  auto: ['unterkunft', 'sight', 'restaurant', 'stadtbummel', 'tank'],
  flug: ['unterkunft', 'flug', 'sight', 'restaurant', 'stadtbummel'],
  kreuzfahrt: ['hafen', 'sight', 'stadtbummel', 'restaurant', 'baden'],
  bahn: ['unterkunft', 'bahnfahrt', 'sight', 'stadtbummel', 'restaurant'],
  rad: ['unterkunft', 'stellplatz', 'pause', 'aussicht', 'natur'],
  wandern: ['huette', 'unterkunft', 'pause', 'aussicht', 'natur'],
  segeln: ['hafen', 'baden', 'natur', 'restaurant', 'einkauf'],
  gemischt: [],
};
// Häufigste Arten zuerst (für die Auswahl: 9 oben, der Rest hinter „Mehr Arten …“)
function typesByUse(t = null) {
  const n = {};
  S.entries.forEach(e => { n[e.type] = (n[e.type] || 0) + 1; });
  const base = Object.keys(TYPES);
  const used = base.slice().sort((a, b) => (n[b] || 0) - (n[a] || 0) || base.indexOf(a) - base.indexOf(b));
  // Passend zur Reiseart zuerst (bei Camping wie bisher nur nach Häufigkeit, wenn schon etwas eingetragen ist)
  let trip = t;
  try { trip = trip || currentTrip(); } catch { trip = null; }
  const kind = tripKind(trip);
  if (kind === 'camping' && S.entries.length) return used;
  const pref = (KIND_TYPES[kind] || []).filter(k => TYPES[k]);
  return [...pref, ...used.filter(k => !pref.includes(k))];
}
const TOP_TYPES = 9;
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
const CATS = ['Stellplatz', 'Unterkunft', 'Sprit', 'Lebensmittel', 'Essen gehen', 'Eintritt', 'Maut & Vignette', 'Fähre', 'Flug', 'Bahn & Bus', 'Mietwagen', 'Werkstatt', 'Wäsche', 'Ausrüstung', 'Sonstiges'];
const SETTLE = 'Ausgleich';

/* ---------- Zustand ---------- */

const S = {
  trips: [], entries: [], expenses: [], boxes: [], items: [], packstate: [], lists: [], listItems: [], meta: [],
  fuel: [], places: [], checklists: [], checkstate: [], deadlines: [], tracks: [],
  documents: [], recipes: [], plates: [], games: [], ideas: [], stamps: [], files: [],
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
// Rollen je geöffneter Crew: Crew-Leiter haben die früheren Verwalter-Rechte (Dokumente, Stempel, Reiseblog, Kasse)
function applyRole() {
  if (!session || !session.user || !crew) return;
  const c = session.crews.find(x => x.id === crew.id);
  if (!c || !('leader' in c)) return;   // ältere, zwischengespeicherte Anmeldung: Werte vom Server behalten
  session.user.isAdmin = !!c.leader;
  session.user.canCash = !!c.leader || !!session.user.canCashOwn;
}
const leadsAny = () => !!(session && session.user && (session.user.superAdmin || session.crews.some(c => c.leader)));
const personName = id => (members().find(m => m.id === id) || {}).name || 'Ehemaliges Mitglied';
const initial = id => (personName(id)[0] || '?').toUpperCase();
const setTrip = id => LS.set('trip.' + crew.id, id);

// Reise, zu der ein Tag gehört: Start bis Ende (ohne Ende: bis zum letzten Eintrag bzw. heute, solange sie läuft).
// Passen mehrere, gewinnt die kürzeste.
function tripForDate(day) {
  const d = String(day || '').slice(0, 10);
  if (!d) return null;
  const hits = S.trips.filter(t => t.start).map(t => {
    const last = S.entries.filter(e => e.tripId === t.id && e.date).map(e => e.date.slice(0, 10)).sort().pop() || t.start;
    const end = t.end || (!t.ended && !t.archived && t.start <= today() ? today() : last);
    return { t, a: t.start, b: end > last ? end : last };
  }).filter(x => x.a <= d && d <= x.b);
  hits.sort((x, y) => (dayDate(x.b) - dayDate(x.a)) - (dayDate(y.b) - dayDate(y.a)));
  return hits.length ? hits[0].t : null;
}
// Neue Reise anlegen (Formular mit Vorgaben) und danach etwas damit tun (z. B. Fotos oder Einträge zuordnen)
let afterNewTrip = null;
function newTripThen(pre, cb) {
  afterNewTrip = cb;
  tripForm();
  setTimeout(() => {
    const f = document.querySelector('#sheet form[data-form=trip]');
    if (!f) return;
    if (pre.start) f.start.value = pre.start;
    if (pre.end) f.end.value = pre.end;
    if (pre.name && !f.name.value) f.name.value = pre.name;
  }, 0);
}
// Name der Reise in ihrer Farbe (Kopf von Eintrag und Bearbeiten-Fenster)
const tripTag = t => (t ? `<span class="trip-tag" style="--c:${tripColor(t)}" title="Reise">${esc(t.name)}</span>` : '');

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
  // Berechnete Strecke „Entlang der Straßen“ deckt die ganze Reise ab; aufgezeichnete Teile nicht doppelt zählen.
  // Andere Strecken zählen nur, wenn sie zusammen den Großteil der Reise abdecken (sonst bleibt die Luftlinie).
  const roads = tracks.find(x => x.auto === 'roads');
  const roadsKm = tracks.filter(x => x.auto === 'roads').reduce((sum, x) => sum + (x.km || 0), 0);
  const trackKm = tracks.reduce((sum, x) => sum + (x.km || 0), 0);
  const driven = !!roads || (tracks.length > 0 && trackKm >= dist * 0.6);
  if (driven) dist = roads ? roadsKm : trackKm;
  // Eingetragener Tachostand geht vor
  if (t.odoKm > 0) dist = t.odoKm;
  const cost = S.expenses.filter(x => x.tripId === t.id && x.cat !== SETTLE).reduce((s, x) => s + (x.amount || 0), 0);
  const sorted = es.filter(e => e.date).sort(byDate);
  const firstEntry = (sorted[0] || {}).date?.slice(0, 10), lastEntry = (sorted[sorted.length - 1] || {}).date?.slice(0, 10);
  const firstDay = t.start && (!firstEntry || t.start <= firstEntry) ? t.start : (firstEntry || t.start);
  // Ende: festes Enddatum; sonst läuft die Reise bis heute, solange sie nicht beendet ist und zuletzt etwas eingetragen
  // wurde; eine alte Reise ohne Enddatum endet mit dem letzten Eintrag
  const weekAgo = dayDate(today()); weekAgo.setDate(weekAgo.getDate() - 7);
  const running = !t.ended && !t.archived && (!lastEntry || dayDate(lastEntry) >= weekAgo);
  let lastDay = t.end ? (t.end < today() ? t.end : today()) : running ? today() : (lastEntry || firstDay);
  if (lastEntry && lastEntry > lastDay && lastEntry <= today()) lastDay = lastEntry;
  const days = firstDay && firstDay <= lastDay ? Math.round((dayDate(lastDay) - dayDate(firstDay)) / 864e5) + 1 : 0;
  // Nächte: so viele, wie die Reise dauert (bis heute), mindestens so viele wie Stellplatz-Einträge
  const nights = Math.max(es.filter(e => isNight(e.type)).length, Math.max(0, days - 1));
  // Kilometer je Verkehrsmittel (Flug, Schiff, Bahn als Luftlinie bzw. Strecke des Abschnitts)
  const legs = splitLegs(routePts(t), tripKind(t));
  const byMode = {};
  legs.forEach(l => { byMode[l.mode] = (byMode[l.mode] || 0) + legKm(l); });
  const special = (byMode.air || 0) + (byMode.ship || 0) + (byMode.rail || 0);
  // Ohne Strecke und Tacho: Flüge, Schiff und Bahn zählen nicht als gefahren
  if (!driven && !(t.odoKm > 0)) dist = Math.max(0, legs.filter(l => !['air', 'ship', 'rail'].includes(l.mode)).reduce((s, l) => s + legKm(l), 0));
  return {
    es, stops, dist, driven: driven || t.odoKm > 0, odo: t.odoKm > 0, cost, days, firstDay, nights, byMode, special,
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

// Standort: bis zu `wait` ms weiter messen, bis die Genauigkeit unter `good` Metern liegt (der erste Wert kommt oft
// grob aus WLAN/Mobilfunk). onUpdate bekommt jeden besseren Zwischenwert. Alte, zwischengespeicherte Werte zählen nicht.
function getPos({ wait = 10000, good = 20, onUpdate = null } = {}) {
  const sim = simulatedPos();
  if (sim) return Promise.resolve(sim);
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Dieses Gerät liefert keinen Standort.'));
    let best = null, done = false, id = null, timer = null;
    const finish = err => {
      if (done) return;
      done = true;
      if (id !== null) navigator.geolocation.clearWatch(id);
      clearTimeout(timer);
      if (best) resolve(best); else reject(err || new Error('Der Standort ließ sich nicht bestimmen. Versuch es unter freiem Himmel noch einmal.'));
    };
    id = navigator.geolocation.watchPosition(p => {
      const cur = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
      if (best && cur.acc >= best.acc) return;
      best = cur;
      if (onUpdate) { try { onUpdate(cur); } catch { /* Anzeige egal */ } }
      if (cur.acc <= good) finish();
    }, e => finish(new Error(e.code === 1
      ? 'Der Standort ist nicht freigegeben. Erlaube ihn in den Browser-Einstellungen für diese Seite.'
      : 'Der Standort ließ sich nicht bestimmen. Versuch es unter freiem Himmel noch einmal.')),
    { enableHighAccuracy: true, timeout: wait + 10000, maximumAge: 0 });
    // Nach `wait` den besten Wert nehmen; ganz ohne Wert noch bis 20 s auf den ersten warten
    timer = setTimeout(() => { if (best) finish(); else timer = setTimeout(() => finish(), 10000); }, wait);
  });
}

// Ortsname und Ländercode (für die Statistik) über OpenStreetMap
// Ortsname zu einer Position (OpenStreetMap). Liefert außerdem den Platz selbst, wenn dort etwas mit Namen ist
// (Campingplatz, Strand, Burg, Restaurant …), und daraus Vorschläge für den Titel.
const PLACE_CACHE = new Map();
const POI_CATS = ['tourism', 'leisure', 'amenity', 'historic', 'natural', 'waterway', 'man_made', 'aeroway', 'building', 'shop', 'railway'];
const POI_SKIP = ['parking', 'parking_space', 'parking_entrance', 'bicycle_parking', 'bench', 'waste_basket', 'waste_disposal', 'recycling', 'toilets',
  'vending_machine', 'post_box', 'telephone', 'drinking_water', 'atm', 'charging_station', 'fuel', 'yes', 'house', 'residential', 'apartments', 'garage', 'rail', 'tree'];
// Benannte Orte rund um eine Position (OpenStreetMap/Overpass): das Gebäude oder Gelände, in dem der Punkt liegt,
// und was im Umkreis von 60 m einen Namen hat. Museen, Sehenswürdigkeiten, Campingplätze & Co. zählen am meisten.
const POI_RANK = { tourism: 10, historic: 9, leisure: 7, natural: 7, amenity: 6, man_made: 5, waterway: 5, aeroway: 5, railway: 4, building: 3, shop: 2 };
const POI_TOP = ['museum', 'attraction', 'camp_site', 'caravan_site', 'viewpoint', 'zoo', 'theme_park', 'gallery', 'castle', 'beach', 'waterfall', 'peak',
  'aquarium', 'monument', 'ruins', 'place_of_worship', 'theatre', 'arts_centre', 'restaurant', 'cafe', 'marina', 'park', 'nature_reserve', 'water_park'];
async function nearPois(p) {
  const ll = `${(+p.lat).toFixed(6)},${(+p.lng).toFixed(6)}`;
  const keys = Object.keys(POI_RANK).join('|');
  const q = `[out:json][timeout:8];is_in(${ll})->.a;(way(pivot.a)[name][~"^(${keys})$"~"."];relation(pivot.a)[name][~"^(${keys})$"~"."];)->.in;`
    + `nwr(around:60,${ll})[name][~"^(${keys})$"~"."]->.near;(.in;.near;);out tags center 40;`;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), { signal: ctl.signal });
    const els = (await r.json()).elements || [];
    const seen = new Set();
    return els.map(el => {
      const t = el.tags || {};
      const cat = Object.keys(POI_RANK).find(k => t[k] && !POI_SKIP.includes(t[k]));
      if (!cat || !t.name) return null;
      const c = el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null);
      const d = c ? km(p, { lat: c.lat, lng: c.lon }) : 0;
      // Gebäude oder Gelände, deren Mitte sehr nah liegt: der Punkt liegt (fast sicher) darin
      const isIn = el.type !== 'node' && (!c || d < 0.15);
      let score = POI_RANK[cat] + (POI_TOP.includes(t[cat]) ? 6 : 0) + (isIn ? 4 : 0) - d * 40;
      return { name: t['name:de'] || t.name, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).filter(x => !seen.has(x.name) && seen.add(x.name));
  } catch { return []; } finally { clearTimeout(timer); }
}

// Ortsname schnell (nur Adresssuche): als Ort zählt die Gemeinde bzw. Stadt, der Ortsteil (Dorf, Weiler, Stadtteil)
// ist ein zusätzlicher Vorschlag. Ergebnisse bleiben auf dem Gerät gemerkt (ca. 100 m Raster).
const QUICK_CACHE = new Map(Object.entries(LS.get('placeCache', {})));
const skipAdmin = n => (n && !/^(Verwaltungsgemeinschaft|VG |Amt |Samtgemeinde|Verbandsgemeinde)/.test(n) ? n : '');
async function placeQuick(p) {
  const key = `${(+p.lat).toFixed(3)},${(+p.lng).toFixed(3)}`;
  if (QUICK_CACHE.has(key)) return QUICK_CACHE.get(key);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=de&lat=${p.lat}&lon=${p.lng}`);
    const j = await r.json();
    const a = j.address || {};
    const name = a.city || a.town || skipAdmin(a.municipality) || a.village || a.hamlet || a.suburb || a.county || '';
    const sub = [a.village, a.hamlet, a.suburb, a.quarter, a.neighbourhood].find(x => x && x !== name) || '';
    const rev = j.name && POI_CATS.includes(j.category) && !POI_SKIP.includes(j.type) && j.name !== name && j.name !== sub ? j.name : '';
    const info = { name, sub, cc: (a.country_code || '').toUpperCase(), rev };
    if (j.address) {
      QUICK_CACHE.set(key, info);
      // Höchstens 300 Orte merken
      const keep = [...QUICK_CACHE.entries()].slice(-300);
      try { LS.set('placeCache', Object.fromEntries(keep)); } catch { /* Speicher voll: egal */ }
    }
    return info;
  } catch { return { name: '', sub: '', cc: '', rev: '' }; }
}
const quickHints = q => [...new Set([q.rev, q.name, q.sub].filter(Boolean))].slice(0, 5);
// Vollständig: dazu die Plätze in der Nähe (Overpass) als Titelvorschläge
async function placeInfo(p) {
  const key = `${(+p.lat).toFixed(4)},${(+p.lng).toFixed(4)}`;
  if (PLACE_CACHE.has(key)) return PLACE_CACHE.get(key);
  const around = navigator.onLine ? nearPois(p) : Promise.resolve([]);
  const q = await placeQuick(p);
  if (!q.name && !q.rev) return { name: '', cc: '', poi: '', hints: [] };
  const { name, sub, rev } = q;
  // Bester Kandidat aus der Umgebung; der Treffer der Adresssuche zählt als Gebäude dazu
  const near = (await around).filter(x => x.name !== name && x.name !== sub);
  const pois = [...new Set([...near.filter(x => !rev || x.score >= 8).map(x => x.name), rev, ...near.map(x => x.name)].filter(Boolean))];
  const poi = pois[0] || '';
  const hints = [...new Set([poi, pois[1] || '', poi && name ? `${poi}, ${name}` : '', name, sub].filter(Boolean))].slice(0, 5);
  const info = { name, sub, cc: q.cc, poi, hints };
  PLACE_CACHE.set(key, info);
  return info;
}

// Titelvorschläge unter dem Titelfeld; mit fill wird der beste gleich eingetragen (nur wenn der Titel noch leer ist)
function titleHints(form, info, fill) {
  const t = form && form.title;
  if (!t || !t.isConnected || !info.hints.length) return;
  let box = form.querySelector('.title-hints');
  if (!box) { box = document.createElement('div'); box.className = 'title-hints'; t.closest('.field').after(box); }
  box.innerHTML = `<span class="sub">Vorschlag:</span>${info.hints.map(h => `<button type="button" class="chip" data-action="title-hint">${esc(h)}</button>`).join('')}`;
  // Leer oder noch der automatische Vorschlag (vom Nutzer unverändert): durch den besten Vorschlag ersetzen
  if (fill && (!t.value.trim() || t.value === t.dataset.suggested)) { t.value = info.hints[0]; t.dataset.suggested = info.hints[0]; }
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
const ART_RATIO = {"karte": 1.517, "tagebuch": 1.517, "listen": 1.517, "boxen": 1.364, "kasse": 1.125, "reisen": 1.378, "tank": 1.311, "orte": 1.23, "check": 1.222, "fahrzeug": 1.264, "statistik": 1.361, "einstellungen": 1.309, "planung": 1.517, "wetter": 1.234, "laender": 1.278, "dokumente": 1.235, "album": 1.324, "kochen": 1.338, "autarkie": 1.247, "spiele": 1.247, "ideen": 1.371, "reiseblog": 1.196, "rubbelkarte": 1.238, "zuladung": 1.281, "wasserwaage": 1.239, "abstimmung": 1.215, "urlaubsgeld": 1.439, "dienste": 1.143, "pinnwand": 1.165, "tickets": 1.276, "reisefoto": 1.276, "kalender": 1.413, "heute": 1.208, "wunschzettel": 1.27, "freunde": 1.387, "mehr": 0.953};
const art = key => `<svg class="art" style="--r:${ART_RATIO[key] || 1.85}" aria-hidden="true"><use href="#b-${key}"/></svg>`;
const sheetHead = title => `<div class="sheet-head"><h2>${title}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>`;
const pageHead = (key, title, sub = '') => `<header class="page-head with-art">
  <div class="ph-text"><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${art(key)}
</header>`;

// Bereiche hinter „Mehr“: der Reiter bleibt dort markiert
const MORE_ROUTES = ['mehr', 'kasse', 'tank', 'orte', 'checklisten', 'fahrzeug', 'statistik', 'reisen', 'einstellungen', 'verwaltung',
  'wetter', 'laender', 'dokumente', 'album', 'kochen', 'autarkie', 'spiele', 'ideen', 'nochweit', 'reisepass', 'kinder', 'rueckblick', 'dienste', 'reiseblog', 'rubbelkarte', 'zuladung', 'wasserwaage', 'abstimmung', 'urlaubsgeld', 'pinnwand', 'reisefoto', 'tickets', 'teilen', 'kalender', 'heute', 'regentag', 'wunschzettel', 'freunde', 'mitreisen'];
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
    `<i class="${isNight(e.type) ? 'b-stop' : 'b-tick'}" style="left:${(step * (i + 1)).toFixed(2)}%"></i>`).join('');
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

// Punkte einer Reise nach Zeit: Einträge, Foto-Standorte und gemerkte Punkte (spuren.js)
function routePts(t) {
  if (APP.routePoints) return APP.routePoints(t);
  return tripEntries(t).filter(hasPos).sort(byDate).map(e => ({ lat: e.lat, lng: e.lng, date: e.date, e }));
}
function drawRoute(t, emphasis) {
  const color = tripColor(t);
  const stops = tripEntries(t).filter(hasPos).sort(byDate);
  // Abschnitte: Flug als Bogen, Schiff und Bahn gestrichelt; nur die Straßen-Abschnitte laufen als Linie in Reisefarbe
  const rp = routePts(t), legs = splitLegs(rp, tripKind(t));
  const road = legs.filter(l => !['air', 'ship', 'rail'].includes(l.mode));
  const pts = [...rp.map(e => [e.lat, e.lng]), ...legs.flatMap(l => l.pts)];
  // Mit GPX-Strecke zeigt die Linie zwischen den Stopps nur noch die Reihenfolge (gestrichelt)
  // Nur wenn eine Strecke die Reise wirklich abdeckt, zeigt die Linie zwischen den Stopps bloß die Reihenfolge.
  // Kurze Stücke (z. B. eine Aufzeichnung oder ein GPX von einem Tag) oder leere Strecken zählen nicht:
  // dann bleibt die Verbindung durchgezogen.
  const air = road.reduce((s, l) => s + legKm(l), 0);
  const drawable = S.tracks.filter(x => x.tripId === t.id && x.kind !== 'hike' && (x.pts || '').includes(';') && !(x.id === APP.editingTrackId && ui.mapEdit === 'strecke'));
  const tracked = drawable.some(x => x.auto === 'roads') || drawable.reduce((sum, x) => sum + (x.km || 0), 0) >= air * 0.6;
  road.forEach(l => {
    if (!tracked) {
      const st = LEG_STYLE[l.mode];
      L.polyline(l.pts, { color: '#fff', weight: emphasis ? 8 : 6, opacity: 0.9 }).addTo(routeLayer);
      L.polyline(l.pts, st ? { ...st, weight: emphasis ? st.weight + 1 : st.weight } : { color, weight: emphasis ? 4 : 3, opacity: emphasis ? 1 : 0.85 }).addTo(routeLayer);
    } else if (ui.mapPins !== 'keine') {
      L.polyline(l.pts, { color, weight: 2, opacity: 0.6, dashArray: '2 8' }).addTo(routeLayer);
    }
  });
  drawSpecialLegs(L, routeLayer, legs);
  const movable = emphasis && ui.mapEdit === 'orte';
  // Beim Bearbeiten immer alle Orte zeigen, sonst nach Wahl im Ebenen-Knopf
  const show = e => movable || ui.mapPins === 'alle' || (ui.mapPins === 'nacht' && isNight(e.type));
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
    `<div><b>${st.nights}</b><span>${st.nights === 1 ? 'Nacht' : 'Nächte'}</span></div>`,
    `<div><b>${st.sights}</b><span>Sehenswertes</span></div>`,
    st.dist ? `<div><b>${fmtKm(st.dist)}</b><span>${st.odo ? 'gefahren (Tacho)' : st.driven ? 'gefahren' : 'Luftlinie'}</span></div>` : '',
  ].join('');
  return `<header class="trip-head">
    <div class="page-head with-art"><div class="ph-text"><h1>${esc(t.name)}<button type="button" class="icon-btn trip-edit" data-action="trip-form" data-id="${t.id}" title="Reise bearbeiten" aria-label="Reise bearbeiten">${icon('edit')}</button></h1><p class="sub">${fmtRange(t)}</p></div>${art(artKey)}</div>
    <div class="facts">${facts}</div>
  </header>`;
}

VIEWS.tagebuch = () => {
  // Reiter oben: Reise einer anderen Crew gewählt (mitreisen.js)? Dann statt der eigenen Reise deren Reiseblog-Ansicht
  const other = APP.diaryOther ? APP.diaryOther() : '';
  if (other) return other;
  const t = currentTrip();
  if (!t) return `${APP.diaryTop ? APP.diaryTop() : ''}${emptyTrip()}`;
  const st = tripStats(t);
  // Kommende Reisen und Reisen ohne Einträge öffnen in der Planung
  // Kinderkonten ohne Freigabe „Reiseplanung“ sehen nur das Tagebuch
  const canPlan = !APP.allowed || APP.allowed('planung');
  const mode = !canPlan ? 'tagebuch' : ui.diaryMode[t.id] || (st.es.length && !(t.start > today()) ? 'tagebuch' : 'planung');
  const modeSeg = !canPlan ? '' : `<div class="seg tabs">
    <button class="${mode === 'planung' ? 'on' : ''}" data-action="diary-mode" data-mode="planung">Planung</button>
    <button class="${mode === 'tagebuch' ? 'on' : ''}" data-action="diary-mode" data-mode="tagebuch">Tagebuch</button>
  </div>`;
  if (mode === 'planung') return `${installHint()}${APP.diaryTop ? APP.diaryTop() : ''}${tripHead(t, st, 'planung')}${modeSeg}${VIEWS.planung(t)}`;
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

  return `${installHint()}${APP.diaryTop ? APP.diaryTop() : ''}${tripHead(t, st)}${APP.todayCard ? APP.todayCard(t, st) : ''}${modeSeg}${APP.tripBar ? APP.tripBar(t, st) : ''}
    ${APP.diaryTools ? (st.es.length ? APP.diaryTools(t, st, Object.keys(days), { chips, filter, label }) : '') : `<div class="chips diary-chips">${chips}</div>`}
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
  // Neue Einträge: bei Camping wie bisher Stellplatz, sonst die erste passende Art der Reise (z. B. Unterkunft)
  const type = e.type || (tripKind(currentTrip()) === 'camping' ? 'stellplatz' : typesByUse()[0]);
  formPhotos = { keep: (e.photos || []).slice(), add: [], drop: [] };
  const linked = !isNew && S.expenses.some(x => x.entryId === e.id);
  // Die 9 meistbenutzten Arten oben (die gewählte immer sichtbar), der Rest hinter „Mehr Arten …“
  const order = typesByUse(), top = order.slice(0, TOP_TYPES);
  if (!top.includes(type)) top[TOP_TYPES - 1] = type;
  const typeRadios = [...top, ...order.filter(k => !top.includes(k))].map(k =>
    `<label${top.includes(k) ? '' : ' class="more-type" hidden'}><input type="radio" name="type" value="${k}"${k === type ? ' checked' : ''}><span>${icon(k)}${TYPES[k].label}</span></label>`).join('')
    + `<button type="button" class="more-types" data-action="types-more">Mehr Arten …</button>`;
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
      ${tripTag(S.trips.find(x => x.id === e.tripId) || currentTrip())}<button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button>
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
      <div class="btnrow photo-btns"><label class="ghost file">${icon('camera')}Foto aufnehmen<input type="file" accept="image/*" capture="environment" data-action="add-photos" data-camera="1"></label>
      <label class="ghost file">${icon('plus')}Fotos hinzufügen<input type="file" accept="image/*" multiple data-action="add-photos"></label>
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
      <p class="pos"><span id="posText">${hasPos(e) ? posLabel(e) : 'Noch keine Position'}</span>
        <button type="button" class="icon-btn small pos-clear" data-action="pos-clear" aria-label="Ort entfernen" title="Ort entfernen"${hasPos(e) ? '' : ' hidden'}>${icon('close')}</button></p>
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
  // Neuer Eintrag: Ort (und Aufnahmezeit) des ersten Fotos mit GPS ersetzen immer den GPS-Ort.
  // Beim Bearbeiten eines vorhandenen Eintrags ändert sich der Ort nie von selbst.
  const form = $('#sheetBody form[data-form=entry]');
  if (form && !form.dataset.id && APP.readExif && !form.dataset.photoPos) {
    for (const f of files.slice(0, 5)) {
      const ex = await APP.readExif(f).catch(() => ({}));
      if (typeof ex.lat !== 'number') continue;
      const had = !!form.lat.value;
      form.dataset.posSrc = 'photo';
      form.dataset.photoPos = '1';
      if (ex.date && form.date) form.date.value = ex.date;
      setFormPos(form, ex, true, true);
      if (had) toast('Ort aus dem Foto übernommen');
      break;
    }
  }
  for (const f of files) {
    try {
      // Ort und Zeit aus dem Foto merken (beim Verkleinern gehen sie verloren), z. B. für den Weg einer Wanderung
      const ex = APP.readExif ? await APP.readExif(f).catch(() => ({})) : {};
      formPhotos.add.push({ id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1920, 0.78), ...photoGeo(ex) });
      const grid = $('#photoGrid');
      if (grid) grid.innerHTML = photoGrid();
    } catch { toast('Ein Foto ließ sich nicht lesen.'); }
  }
}
// Kamera-Foto zusätzlich in der Galerie: Web-Apps dürfen dort nicht selbst speichern.
// Android: als Download (erscheint in der Galerie im Album „Download“), abschaltbar in den Einstellungen.
// iPhone/iPad: über das Teilen-Menü („Bild sichern“) – dafür ein Knopf, weil das nur nach einem Tipp geht.
function saveToGallery(file) {
  if (LS.get('galleryCopy', true) === false) return;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const named = new File([file], `LAMMping_${stamp}.jpg`, { type: file.type || 'image/jpeg' });
  if (isIOS) {
    if (!(navigator.canShare && navigator.canShare({ files: [named] }))) return;
    const box = document.querySelector('#sheet[open] .photo-btns');
    if (!box) return;
    box.querySelector('.gallery-save')?.remove();
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ghost gallery-save'; b.textContent = '⬇ In Fotos sichern';
    b.addEventListener('click', async () => { try { await navigator.share({ files: [named] }); b.remove(); } catch { /* abgebrochen */ } });
    box.prepend(b);
    return;
  }
  const url = URL.createObjectURL(named);
  const a = document.createElement('a');
  a.href = url; a.download = named.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  // Nach einem möglichen „Ort aus dem Foto übernommen“ melden
  setTimeout(() => toast('Foto auch im Handy gesichert (Album „Download“)'), 2600);
}

// Ort und Aufnahmezeit eines Fotos (aus EXIF), nur was vorhanden ist
function photoGeo(ex) {
  const g = {};
  if (ex && typeof ex.lat === 'number') { g.lat = +ex.lat.toFixed(6); g.lng = +ex.lng.toFixed(6); }
  if (ex && ex.date) g.at = ex.date;
  return g;
}
// Fotos des offenen Eintrags in der gewählten Reihenfolge (das erste ist das Titelbild)
function formPhotoList() {
  const all = [...formPhotos.keep, ...formPhotos.add], order = formPhotos.order || [];
  const at = p => { const i = order.indexOf(p.id); return i < 0 ? order.length + all.indexOf(p) : i; };
  return all.slice().sort((a, b) => at(a) - at(b));
}
function photoGrid() {
  return formPhotoList().map(p =>
    `<figure data-pid="${p.id}" title="Tippen: zuschneiden · Ziehen: Reihenfolge ändern"><img src="${p.thumb}" alt="" draggable="false"><button type="button" data-action="drop-photo" data-id="${p.id}" aria-label="Foto entfernen">${icon('close')}</button></figure>`).join('');
}

// Foto im offenen Eintrag ersetzen (z. B. zugeschnitten): neue Kennung, gleiche Stelle in der Reihenfolge
function replaceFormPhoto(oldId, item) {
  const ids = formPhotoList().map(p => p.id);
  if (formPhotos.keep.some(p => p.id === oldId)) formPhotos.drop.push(oldId);
  formPhotos.keep = formPhotos.keep.filter(p => p.id !== oldId);
  formPhotos.add = formPhotos.add.filter(p => p.id !== oldId);
  formPhotos.add.push(item);
  formPhotos.order = ids.map(id => (id === oldId ? item.id : id));
  const grid = $('#photoGrid');
  if (grid) grid.innerHTML = photoGrid();
}

// Fotos umsortieren: mit der Maus ziehen, am Handy lange drücken und dann ziehen
const SORTABLE = { photoGrid: ids => { formPhotos.order = ids; } };
(function sortablePhotos() {
  let drag = null;
  const figs = grid => [...grid.querySelectorAll('figure[data-pid]')];
  function begin() {
    drag.on = true;
    drag.el.classList.add('sorting');
    drag.grid.classList.add('sorting');
    if (navigator.vibrate && drag.touch) navigator.vibrate(15);
  }
  function move(x, y) {
    const { el, grid } = drag;
    // Ziel: das Foto, über dem der Finger bzw. die Maus gerade ist
    const over = figs(grid).find(f => { if (f === el) return false; const r = f.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    if (over) {
      const list = figs(grid);
      grid.insertBefore(el, list.indexOf(over) > list.indexOf(el) ? over.nextSibling : over);
    }
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${x - drag.gx - r.left}px, ${y - drag.gy - r.top}px)`;
  }
  function end() {
    const d = drag; drag = null;
    clearTimeout(d.timer);
    if (!d.on) return;
    d.el.style.transform = '';
    d.el.classList.remove('sorting');
    d.grid.classList.remove('sorting');
    const ids = figs(d.grid).map(f => f.dataset.pid);
    if (SORTABLE[d.grid.id]) SORTABLE[d.grid.id](ids);
    // Ein Klick direkt nach dem Ziehen soll nichts auslösen (z. B. das Kreuz)
    d.grid.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
    setTimeout(() => d.grid.dispatchEvent(new Event('sorted')), 0);
  }
  document.addEventListener('pointerdown', ev => {
    const el = ev.target.closest && ev.target.closest('.photo-grid figure[data-pid]');
    if (!el || ev.button > 0 || ev.target.closest('button') || !SORTABLE[el.parentElement.id]) return;
    const r = el.getBoundingClientRect();
    drag = { el, grid: el.parentElement, x: ev.clientX, y: ev.clientY, gx: ev.clientX - r.left, gy: ev.clientY - r.top, on: false, touch: ev.pointerType === 'touch', id: ev.pointerId };
    if (drag.touch) drag.timer = setTimeout(() => { if (drag) { begin(); move(drag.x, drag.y); } }, 350);
  });
  document.addEventListener('pointermove', ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    if (!drag.on) {
      // Maus: ab ein paar Pixeln ziehen; Finger: Bewegung vor dem langen Drücken ist Scrollen
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      if (drag.touch) { clearTimeout(drag.timer); drag = null; return; }
      begin();
    }
    move(ev.clientX, ev.clientY);
  });
  // Am Handy während des Sortierens nicht scrollen
  document.addEventListener('touchmove', ev => { if (drag && drag.on) ev.preventDefault(); }, { passive: false });
  document.addEventListener('pointerup', ev => { if (drag && ev.pointerId === drag.id) end(); });
  document.addEventListener('pointercancel', ev => { if (drag && ev.pointerId === drag.id) { if (drag.on) end(); else { clearTimeout(drag.timer); drag = null; } } });
  // Bilder im Formular nie als Datei „herausziehen“ (sonst landen sie als Kopie wieder im Eintrag)
  document.addEventListener('dragstart', ev => { if (ev.target.closest && ev.target.closest('.photo-grid')) ev.preventDefault(); });
  document.addEventListener('contextmenu', ev => { if (ev.target.closest && ev.target.closest('.photo-grid figure[data-pid]') && ev.pointerType !== 'mouse') ev.preventDefault(); });
})();

function setFormPos(form, p, fillPlace, fillTitle = false) {
  form.lat.value = p.lat;
  form.lng.value = p.lng;
  form.acc.value = p.acc || '';
  $('#posText').textContent = posLabel(p);
  const clr = form.querySelector('[data-action=pos-clear]');
  if (clr) clr.hidden = false;
  if (pickMarker) pickMarker.setLatLng([p.lat, p.lng]);
  if (!fillPlace) return;
  // Späte Antworten zu einem älteren Punkt nicht mehr eintragen
  const seq = String(+(form.dataset.posSeq || 0) + 1);
  form.dataset.posSeq = seq;
  const fresh = () => form.isConnected && form.dataset.posSeq === seq;
  const putPlace = name => {
    if (!name || !form.place) return;
    // Leer oder automatisch gefüllt: ersetzen; selbst geschrieben: lassen
    if (!form.place.value || form.place.value === form.dataset.placeAuto) { form.place.value = name; form.dataset.placeAuto = name; }
  };
  // Erst der Ortsname (schnell), dann die Plätze in der Nähe als Vorschläge
  placeQuick(p).then(q => {
    if (!fresh()) return;
    putPlace(q.name);
    if (form.country && q.cc) form.country.value = q.cc;
    titleHints(form, { hints: quickHints(q) }, fillTitle);
  });
  placeInfo(p).then(info => {
    if (!fresh()) return;
    putPlace(info.name);
    if (form.country && info.cc) form.country.value = info.cc;
    titleHints(form, info, fillTitle);
  });
}

async function locateInto(form, { fillTitle = false, quiet = false } = {}) {
  const btn = form.querySelector('[data-action="pos-here"]');
  if (btn) btn.disabled = true;
  form.dataset.posSrc = 'gps';
  const txt = $('#posText');
  if (txt) txt.textContent = 'Position wird bestimmt …';
  // Ein Foto mit Ort hat Vorrang: dann die GPS-Messung nicht mehr eintragen
  const byPhoto = () => form.dataset.posSrc === 'photo';
  try {
    const p = await getPos({ onUpdate: cur => { if (!byPhoto() && form.isConnected && txt) txt.textContent = `Standort wird genauer … ± ${cur.acc} m`; } });
    if (!byPhoto() && form.isConnected) setFormPos(form, p, true, fillTitle);
  } catch (err) {
    if (txt && !byPhoto()) txt.textContent = form.lat.value ? posLabel({ lat: +form.lat.value, lng: +form.lng.value }) : 'Noch keine Position';
    if (!quiet || !/freigegeben/.test(err.message)) toast(err.message);
  } finally {
    if (btn) btn.disabled = false;
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

// Neuer Eintrag „jetzt“ (nicht nachgetragen): Standort gleich bestimmen, Ort und Titel vorschlagen
const recentDate = d => !d || Math.abs(new Date(d) - Date.now()) < 2 * 3600e3;
function openEntryForm(e, opts = {}) {
  if (!currentTrip()) { toast('Legt zuerst eine Reise an.'); return tripForm(); }
  const auto = !e.id && !hasPos(e) && !opts.at && opts.locate !== false && recentDate(e.date);
  openSheet(entryForm(e), form => {
    applyType(form);
    form.addEventListener('change', ev => { if (ev.target.name === 'type') applyType(form); });
    if (opts.locate || auto) locateInto(form, { fillTitle: true, quiet: auto && !opts.locate });
    if (opts.at) setFormPos(form, opts.at, true, !e.id);
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
  e.photos = formPhotoList().map(({ id, thumb, lat, lng, at }) => ({ id, thumb, ...(lat != null ? { lat, lng } : {}), ...(at ? { at } : {}) }));
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
  checkTripRange(e.tripId, [e.date], [e.id]);
  return e;
}

// Eintrag liegt außerhalb von Start und Ende der Reise (z. B. nachgetragene Reise, deren Start noch auf „heute“ steht):
// anbieten, den Reisezeitraum anzupassen. „So lassen“ gilt für diese Reise dauerhaft.
function checkTripRange(tripId, dates, ids = []) {
  const t = S.trips.find(x => x.id === tripId);
  const days = dates.filter(Boolean).map(d => d.slice(0, 10)).sort();
  if (!t || !days.length || t.rangeOk) return;
  const fd = d => new Date(`${d}T12:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const lo = days[0], hi = days[days.length - 1];
  const early = t.start && lo < t.start, late = t.end && hi > t.end;
  if (!early && !late) return;
  // Lag der bisherige Start nach allen Einträgen, war es eine nachgetragene Reise: dann auch das Ende setzen
  const start = early ? lo : t.start;
  const end = late ? hi : (t.end || (t.start > hi && hi < today() ? hi : ''));
  // Passt eine andere Reise zu diesen Tagen? Dann lieber dorthin verschieben
  const other = [lo, hi].map(tripForDate).find(x => x && x.id !== t.id) || null;
  // Mehr als 30 Tage daneben: wohl eine eigene Reise
  const far = Math.abs(dayDate(early ? lo : hi) - dayDate(early ? t.start : t.end)) > 30 * 864e5;
  const range = end && end !== start ? `${fd(start)} bis ${fd(end)}` : fd(start);
  setTimeout(() => openSheet(`<div>${sheetHead('Reisezeitraum anpassen?')}
    <p>${days.length > 1 ? 'Diese Einträge sind' : 'Dieser Eintrag ist'} vom <b>${fd(lo)}${hi !== lo ? ` bis ${fd(hi)}` : ''}</b>.
      Die Reise „${esc(t.name)}“ ${early ? `beginnt laut Angaben aber erst am ${fd(t.start)}` : `endet laut Angaben aber schon am ${fd(t.end)}`}.</p>
    ${other ? `<p>Das passt zur Reise <b>„${esc(other.name)}“</b>.</p>` : ''}
    <p class="sub">Kalender, Reisetage und Rückblick richten sich nach dem Reisezeitraum.</p>
    <div class="sheet-foot"><button type="button" class="ghost" data-action="trip-range-keep" data-id="${t.id}">So lassen</button>
      ${other && ids.length ? `<button type="button" class="primary" data-action="trip-range-move" data-to="${other.id}" data-ids="${ids.join(',')}">Zu „${esc(other.name)}“ verschieben</button>` : ''}
      ${!other && ids.length && far ? `<button type="button" class="ghost" data-action="trip-range-new" data-ids="${ids.join(',')}" data-a="${lo}" data-b="${hi}">Neue Reise</button>` : ''}
      <button type="button" class="${other && ids.length ? 'ghost' : 'primary'}" data-action="trip-range-set" data-id="${t.id}" data-start="${start}" data-end="${end}">Reise: ${range}</button></div></div>`), 450);
}

function entryView(e) {
  const t = S.trips.find(x => x.id === e.tripId);
  const feats = (e.features || []).map(f => `<span class="chip on static">${f}</span>`).join('');
  return `<article class="entry-view" style="--trip:${tripColor(t)}">
    <div class="sheet-head">
      <p class="kicker">${icon(e.type)}${TYPES[e.type].label}, ${fmtDay(e.date.slice(0, 10))}, ${fmtTime(e.date)}</p>
      ${tripTag(t)}<button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button>
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
      ${l.id && !l.fixed ? `<button type="button" class="ghost danger" data-action="del-list" data-id="${l.id}" data-n="${n}">Löschen</button>` : ''}
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
    <div class="field"><span>Art der Reise</span><div class="chips wrap trip-kinds">${TRIP_KINDS.map(([k, l, ic]) =>
      `<label class="chip"><input type="radio" name="kind" value="${k}"${tripKind(t) === k ? ' checked' : ''}><span>${ic} ${l}</span></label>`).join('')}</div></div>
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
    ${leadsAny() || u.canFound ? `<section class="panel">
      <h2>Verwaltung</h2>
      <p>${u.superAdmin ? 'Als Super-Admin verwaltest du alle Konten. ' : ''}${session.crews.some(c => c.leader) ? 'Für deine Crews: Personen anlegen, Passwörter zurücksetzen, Rechte vergeben und per Link oder QR-Code einladen.' : 'Eigene Crews gründen.'}</p>
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
      <h2>App installieren und weitergeben</h2>
      ${installText()}
      <h3 class="panel-sub">Auf ein anderes Handy</h3>
      <p class="sub">Dort diesen Code scannen, LAMMping öffnen, anmelden und „Zum Startbildschirm hinzufügen“.</p>
      <button class="ghost" data-action="qr-show" data-url="${esc(location.origin + location.pathname)}" data-title="LAMMping öffnen">▦ QR-Code für die App</button>
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
      applyRole();
    }
  } catch { /* offline: bleibt wie es ist */ }
  loadAdmin();
}

VIEWS.verwaltung = () => {
  if (!leadsAny() && !session.user.canFound) return '<p class="hint">Nur für Crew-Leiter.</p>';
  if (!admin) { loadAdmin(); return pageHead('einstellungen', 'Verwaltung') + '<p class="hint">Wird geladen …</p>'; }
  if (admin.error) return `${pageHead('einstellungen', 'Verwaltung')}<p class="hint">${esc(admin.error)} Die Verwaltung braucht eine Internetverbindung.</p>
    <button class="ghost" data-action="admin-reload">Noch einmal versuchen</button>`;
  const name = id => (admin.users.find(u => u.id === id) || {}).name || '?';
  const ledHere = (admin.crews.find(c => c.id === crew.id) || {}).leader;
  const role = u => [u.isAdmin && 'Super-Admin', u.canFound && !u.isAdmin && 'darf Crews gründen', u.canCash ? 'sieht die Kasse' : 'ohne Kasse'].filter(Boolean).join(', ');
  const own = admin.crews.filter(c => c.leader), foreign = admin.crews.filter(c => c.foreign);
  return `${pageHead('einstellungen', 'Verwaltung', admin.superAdmin ? 'Super-Admin: alle Konten, eigene Crews' : 'Crew-Leiter: deine Crews')}
    <div class="toolbar"><h2>Personen</h2>${ledHere || admin.superAdmin ? `<button class="primary" data-action="user-form">${icon('plus')}Person</button>` : ''}</div>
    <ul class="people">${admin.users.map(u => `<li><button data-action="user-form" data-id="${u.id}"${u.managed || u.id === session.user.id ? '' : ' disabled'}>
      <span class="avatar">${esc(u.name[0] || '?')}</span>
      <span class="txt"><b>${esc(u.name)}</b><small>Anmeldename: ${esc(u.login)}, ${role(u)}</small></span>
      ${u.managed || u.id === session.user.id ? icon('edit') : ''}</button></li>`).join('')}</ul>
    <div class="toolbar"><h2>${foreign.length ? 'Deine Crews' : 'Crews'}</h2>${session.user.canFound ? `<button class="primary" data-action="crew-form">${icon('plus')}Crew gründen</button>` : ''}</div>
    <ul class="people">${own.map(c => `<li class="crew-row"><button data-action="crew-form" data-id="${c.id}">
      <span class="txt"><b>${esc(c.name)}</b><small>${c.members.map(m => `${esc(name(m.id))}${m.leader ? ' 👑' : ''}`).join(', ') || 'Noch ohne Mitglieder'}${c.invites.length ? ` · ${c.invites.length} ${c.invites.length === 1 ? 'Einladung' : 'Einladungen'} offen` : ''}</small></span>
      ${icon('edit')}</button><button class="ghost small-btn" data-action="invite-new" data-crew="${c.id}">Einladen</button></li>`).join('') || '<li class="none">Du leitest noch keine Crew.</li>'}</ul>
    ${foreign.length ? `<h2 class="date-head">Andere Crews</h2><p class="sub">Von fremden Crews siehst du nur Name und Mitgliederzahl.</p>
      <ul class="people foreign">${foreign.map(c => `<li><span class="txt"><b>${esc(c.name)}</b><small>${c.count} ${c.count === 1 ? 'Mitglied' : 'Mitglieder'}</small></span></li>`).join('')}</ul>` : ''}
    <p class="sub">👑 = Crew-Leiter. Crew-Leiter legen Personen für ihre Crew an, vergeben Rechte und laden per Link oder QR-Code ein.</p>`;
};

// Eigenes Feld ohne Passwort-Namen: Passwortmanager sollen hier nichts eintragen oder speichern
const pwInput = required => `<label class="field"><span>${required ? 'Passwort (mindestens 6 Zeichen)' : 'Neues Passwort'}</span>
  <input name="newPw" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" data-lpignore="true" data-1p-ignore data-bwignore
    ${required ? 'required ' : ''}minlength="6"></label>`;

// Zugangskarte (sichern.js): Daten des gerade gespeicherten Kontos oder aus dem offenen Formular
let lastCard = null;

function userForm(id) {
  const u = (admin.users.find(x => x.id === id)) || {};
  const self = u.id === session.user.id;
  const ledHere = (admin.crews.find(c => c.id === crew.id) || {}).leader;
  openSheet(`<form data-form="user" data-id="${u.id || ''}">
    <div class="sheet-head"><h2>${u.id ? 'Person bearbeiten' : 'Neue Person'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(u.name)}" required placeholder="z. B. Lena"></label>
    <label class="field"><span>Anmeldename</span><input name="login" value="${esc(u.login)}" required autocapitalize="none" autocomplete="off" placeholder="z. B. lena"></label>
    ${u.id
      ? `<div class="field" id="pwField"><span>Passwort</span><button type="button" class="ghost" data-action="show-pw-field">Neues Passwort festlegen</button></div>`
      : pwInput(true)}
    ${admin.superAdmin ? `<label class="check"><input type="checkbox" name="isAdmin"${u.isAdmin ? ' checked' : ''}${self ? ' disabled' : ''}><span>Super-Admin (verwaltet alle Konten)</span></label>
      <label class="check"><input type="checkbox" name="canFound"${u.canFound || u.isAdmin ? ' checked' : ''}><span>Darf eigene Crews gründen</span></label>` : ''}
    <label class="check cash-check"><input type="checkbox" name="canCash"${u.canCash ? ' checked' : ''}><span>Darf die Kasse sehen</span></label>
    <p class="sub">Crew-Leiter sehen die Kasse ihrer Crew immer. Wer Crew-Leiter ist, legst du in der Crew fest.</p>
    ${APP.areaFields ? APP.areaFields(u) : ''}
    ${u.id ? '' : ledHere ? `<label class="check"><input type="checkbox" name="joinCrew" checked${admin.superAdmin ? '' : ' disabled'}><span>In die Crew „${esc(crew.name)}“ aufnehmen</span></label>`
      : '<p class="sub">Das Konto gehört danach noch zu keiner Crew. Hinzufügen kann es ein Crew-Leiter.</p>'}
    <div class="sheet-foot">
      ${u.id && !self ? `<button type="button" class="ghost danger" data-action="del-user" data-id="${u.id}">Löschen</button>` : ''}
      ${u.id ? '<button type="button" class="ghost" data-action="access-card">Zugangskarte</button>' : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

function crewForm(id) {
  const c = admin.crews.find(x => x.id === id) || { members: [{ id: session.user.id, shares: true, leader: true }], invites: [] };
  // Zur Auswahl: bisherige Mitglieder und Konten, die ich verwalte
  const pick = admin.users.filter(u => c.members.some(m => m.id === u.id) || u.managed || u.id === session.user.id);
  const rows = pick.map(u => {
    const m = c.members.find(x => x.id === u.id);
    return `<li>
      <label class="check"><input type="checkbox" name="member" value="${u.id}"${m ? ' checked' : ''}><span>${esc(u.name)}</span></label>
      <label class="check small"><input type="checkbox" name="shares" value="${u.id}"${!m || m.shares ? ' checked' : ''}><span>zahlt mit</span></label>
      <label class="check small"><input type="checkbox" name="leader" value="${u.id}"${m && m.leader ? ' checked' : ''}><span>👑 Leiter</span></label>
    </li>`;
  }).join('');
  openSheet(`<form data-form="crew" data-id="${c.id || ''}">
    <div class="sheet-head"><h2>${c.id ? 'Crew bearbeiten' : 'Neue Crew gründen'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(c.name)}" required placeholder="z. B. Familie Berger"></label>
    ${c.id ? `<div class="field"><span>Wer gehört dazu?</span>
      <p class="sub">„Zahlt mit“: zählt in der Kasse bei geteilten Ausgaben. „Leiter“: verwaltet die Crew, sieht Dokumente und Kasse, vergibt Stempel.</p>
      <ul class="member-list">${rows}</ul>
    </div>
    ${c.invites.length ? `<div class="field"><span>Offene Einladungen</span><ul class="invite-list">${c.invites.map(i => `<li>gültig bis ${new Date(i.expires).toLocaleDateString('de-DE')}${i.uses ? `, ${i.uses}× genutzt` : ''}
      <button type="button" class="link" data-action="invite-show" data-token="${i.token}" data-crew="${c.id}">Zeigen</button>
      <button type="button" class="link danger" data-action="invite-del" data-token="${i.token}">Zurückziehen</button></li>`).join('')}</ul></div>` : ''}`
      : '<p class="sub">Du wirst Crew-Leiter der neuen Crew. Danach kannst du Personen anlegen oder per Link einladen.</p>'}
    <div class="sheet-foot">
      ${c.id ? `<button type="button" class="ghost danger" data-action="del-crew" data-id="${c.id}">Löschen</button>
        <button type="button" class="ghost" data-action="invite-new" data-crew="${c.id}">Einladen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Anmeldung & Einrichtung ---------- */

const HERO = `<div class="brand-hero"><svg class="hero-sheep" aria-hidden="true"><use href="#schaf"/></svg><svg class="wordmark" role="img" aria-label="LAMMping"><use href="#wort"/></svg></div>`;

// Wer einen Einladungslink öffnet, landet hier: eigenes Konto anlegen oder mit bestehendem Konto beitreten
let invite = null;   // { token, loggedIn, crew, error, haveAccount }
async function loadInvite() {
  try { const r = await api('invite', undefined, `&t=${encodeURIComponent(invite.token)}`); invite.crew = r.crew; } catch (e) { invite.error = e.message; }
  render();
}
function inviteDone(res) {
  LS.set('crew', res.crewId);
  const { crewId, ...s } = res;
  LS.set('session', s);
  location.replace(location.pathname + '#/karte');
}
VIEWS.invite = () => `<section class="login">${HERO}
  ${invite.error ? `<p class="hint">${esc(invite.error)}</p><a class="ghost btn" href="${location.pathname}">Zur Anmeldung</a>`
    : !invite.crew ? '<p class="sub">Einladung wird geladen …</p>'
    : invite.loggedIn ? `<h2>Einladung in die Crew „${esc(invite.crew)}“</h2>
      <p>Du bist angemeldet. Mit einem Tipp bist du dabei; deine bisherigen Crews bleiben erhalten.</p>
      <form data-form="invite-join" class="panel"><button class="primary">Crew „${esc(invite.crew)}“ beitreten</button></form>`
    : invite.haveAccount ? `<h2>Einladung in die Crew „${esc(invite.crew)}“</h2><p>Melde dich mit deinem Konto an, danach bist du in der Crew.</p>
      <form data-form="invite-login" class="panel">
        <label class="field"><span>Anmeldename</span><input name="login" autocomplete="username" autocapitalize="none" required></label>
        <label class="field"><span>Passwort</span><input type="password" name="password" autocomplete="current-password" required></label>
        <button class="primary">Anmelden und beitreten</button></form>
      <button class="link" data-action="invite-mode" data-have="">Ich brauche ein neues Konto</button>`
    : `<h2>Einladung in die Crew „${esc(invite.crew)}“</h2><p>Lege dir ein eigenes Konto an. Danach bist du in der Crew und kannst LAMMping nutzen.</p>
      <form data-form="invite-join" class="panel">
        <label class="field"><span>Dein Name</span><input name="name" required autocomplete="name" placeholder="z. B. Lena"></label>
        <label class="field"><span>Anmeldename</span><input name="login" required autocapitalize="none" autocomplete="username" placeholder="z. B. lena"></label>
        <label class="field"><span>Passwort (mindestens 6 Zeichen)</span><input type="password" name="password" required minlength="6" autocomplete="new-password"></label>
        <button class="primary">Konto anlegen und beitreten</button></form>
      <button class="link" data-action="invite-mode" data-have="1">Ich habe schon ein Konto</button>`}
</section>`;
VIEWS.loading = () => `<section class="login">${HERO}<p class="sub">Wird geladen …</p></section>`;

VIEWS.login = () => `<section class="login">
  ${HERO}
  <p>Meldet euch mit eurem Anmeldenamen an. Neue Konten legen die Verwalter in den Einstellungen an.</p>
  <form data-form="login" class="panel">
    <label class="field"><span>Anmeldename</span><input name="login" autocomplete="username" autocapitalize="none" required value="${esc(new URLSearchParams(location.search).get('login') || '')}"></label>
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

// Noch in keiner Crew: wer Crews gründen darf, legt gleich eine an; sonst Einladung abwarten
VIEWS.nocrew = () => {
  const mayFound = !!(session.user.canFound || session.user.superAdmin);
  return `<section class="login">
  ${HERO}
  <h2>Hallo ${esc(session.user.name)}</h2>
  ${mayFound ? `<p>Du gehörst noch zu keiner Crew. Gründe deine eigene, zum Beispiel für deine Familie. Du bist dann ihr Crew-Leiter und kannst andere einladen.</p>
    <form data-form="nocrew-found" class="panel">
      <label class="field"><span>Name der Crew</span><input name="name" required maxlength="100" placeholder="z. B. Familie ${esc(session.user.name)}" value="Familie ${esc(session.user.name)}"></label>
      <button class="primary">Crew gründen</button></form>
    <p class="sub">Oder öffne einen Einladungslink, den dir jemand geschickt hat.</p>`
    : `<p>Du gehörst noch zu keiner Crew. Öffne den Einladungslink, den dir ein Crew-Leiter geschickt hat, oder bitte ihn, dich aufzunehmen. Danach die App neu öffnen.</p>`}
  <button class="ghost danger" data-action="logout">Abmelden</button>
</section>`;
};

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
  // Version 77: Start-Hilfe (starthilfe.js) ersetzt den alten Hinweis
  if (APP.startHelp) return APP.startHelp();
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
      ${(() => { const order = typesByUse().filter(k => k !== 'notiz'), top = order.slice(0, TOP_TYPES);
        return order.map(k => `<button data-action="new-here" data-type="${k}"${top.includes(k) ? '' : ' class="more-type" hidden'}>${icon(k)}<b>${TYPES[k].label}</b><small>${TYPES[k].hint}</small></button>`).join(''); })()}
      <button data-action="new-here" data-type="notiz">${icon('notiz')}<b>Notiz</b><small>Mit diesem Ort</small></button>
      ${APP.canRecord && APP.canRecord() ? `<button data-action="rec-start" data-kind="hike">${icon('wanderung')}<b>Tour aufzeichnen</b><small>Wanderung oder Radtour per GPS</small></button>` : ''}
      <button data-action="park-here">${icon('car')}<b>Auto geparkt</b><small>Standort merken</small></button>
      <button type="button" class="more-types" data-action="types-more">Mehr Arten …</button>
    </div></div>`),
  'new-here': el => openEntryForm({ type: el.dataset.type }, { locate: true }),
  // Weitere Eintragsarten aufklappen (Formular und „Ich bin hier …“)
  'types-more': el => {
    const box = el.parentElement;
    box.querySelectorAll('.more-type').forEach(x => { x.hidden = false; });
    el.remove();
  },
  'pos-clear': el => {
    const form = el.form;
    form.lat.value = ''; form.lng.value = ''; form.acc.value = '';
    form.dataset.posSeq = String(+(form.dataset.posSeq || 0) + 1);
    if (form.place && form.place.value === form.dataset.placeAuto) form.place.value = '';
    $('#posText').textContent = 'Noch keine Position';
    el.hidden = true;
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
  'pos-here': el => locateInto(el.form, { fillTitle: !el.form.dataset.id }),
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
    if ((S.lists.find(l => l.id === el.dataset.id) || {}).fixed) return;
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

  'trip-form': el => { afterNewTrip = null; tripForm(el.dataset.id); },
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

// Einladungen in eine Crew: Link bzw. QR-Code, 14 Tage gültig
const inviteUrl = token => `${location.origin}${location.pathname}?invite=${token}`;
function inviteSheet(token, crewId) {
  const c = (admin && admin.crews.find(x => x.id === crewId)) || session.crews.find(x => x.id === crewId) || {};
  const url = inviteUrl(token);
  openSheet(`<div class="qr-sheet">${sheetHead(`Einladung in „${esc(c.name || '')}“`)}
    <p>Wer diesen Code scannt oder den Link öffnet, kann sich ein eigenes Konto anlegen (oder mit einem bestehenden anmelden) und ist dann in der Crew. Gültig 14 Tage.</p>
    <div class="qr-box">${APP.qrSvg ? APP.qrSvg(url, 240) : ''}</div>
    <p class="sub qr-url">${esc(url)}</p>
    <div class="sheet-foot">
      <button type="button" class="ghost" data-action="invite-copy" data-url="${esc(url)}">Link kopieren</button>
      ${navigator.share ? `<button type="button" class="ghost" data-action="invite-share" data-url="${esc(url)}" data-name="${esc(c.name || '')}">Teilen</button>` : ''}
      <button type="button" class="primary" data-action="invite-print" data-url="${esc(url)}" data-name="${esc(c.name || '')}">Drucken / PDF</button>
    </div></div>`);
}
ACTIONS['invite-new'] = async el => {
  try {
    const r = await api('invite-create', { crew: el.dataset.crew });
    admin = null;
    inviteSheet(r.token, el.dataset.crew);
    loadAdmin();
  } catch (e) { toast(e.message); }
};
ACTIONS['invite-show'] = el => inviteSheet(el.dataset.token, el.dataset.crew);
ACTIONS['invite-del'] = async el => {
  if (!confirm('Diese Einladung zurückziehen? Der Link funktioniert dann nicht mehr.')) return;
  try { await api('invite-delete', { token: el.dataset.token }); closeSheet(); admin = null; loadAdmin(); toast('Einladung zurückgezogen'); } catch (e) { toast(e.message); }
};
ACTIONS['invite-copy'] = async el => { try { await navigator.clipboard.writeText(el.dataset.url); toast('Link kopiert'); } catch { toast('Kopieren ging nicht. Den Link bitte von Hand markieren.'); } };
ACTIONS['invite-share'] = el => navigator.share({ title: 'Einladung zu LAMMping', text: `Komm in unsere Crew „${el.dataset.name}“ bei LAMMping:`, url: el.dataset.url }).catch(() => {});
ACTIONS['invite-print'] = el => APP.inviteCard && APP.inviteCard({ url: el.dataset.url, crewName: el.dataset.name });

ACTIONS['trip-range-set'] = el => {
  const t = S.trips.find(x => x.id === el.dataset.id);
  if (t) save('trips', { ...t, start: el.dataset.start, end: el.dataset.end || t.end || '' });
  closeSheet();
  toast('Reisezeitraum angepasst');
};
ACTIONS['trip-range-move'] = el => {
  const to = S.trips.find(x => x.id === el.dataset.to);
  el.dataset.ids.split(',').forEach(id => { const e = S.entries.find(x => x.id === id); if (e && to) save('entries', { ...e, tripId: to.id }); });
  closeSheet();
  if (to) toast(`Zu „${to.name}“ verschoben`);
};
ACTIONS['trip-range-new'] = el => {
  const ids = el.dataset.ids.split(',');
  newTripThen({ start: el.dataset.a, end: el.dataset.b }, t => {
    ids.forEach(id => { const e = S.entries.find(x => x.id === id); if (e) save('entries', { ...e, tripId: t.id }); });
    toast(`Zu „${t.name}“ verschoben`);
  });
};
ACTIONS['trip-range-keep'] = el => {
  const t = S.trips.find(x => x.id === el.dataset.id);
  if (t) save('trips', { ...t, rangeOk: true });
  closeSheet();
};

// Titelvorschlag aus dem Ort übernehmen (siehe titleHints)
ACTIONS['title-hint'] = el => {
  const t = el.closest('form').title;
  t.value = el.textContent;
  t.dispatchEvent(new Event('input', { bubbles: true }));
};

// Zugangskarte für ein Konto drucken (siehe userForm)
ACTIONS['access-card'] = el => {
  const f = el.closest('form');
  const card = el.dataset.last ? lastCard : { name: f.name.value.trim(), login: f.login.value.trim(), password: f.newPw ? f.newPw.value : '' };
  if (card && APP.accessCard) APP.accessCard({ ...card, crewName: crew.name });
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
      kind: form.kind ? form.kind.value || 'camping' : tripKind(old),
      archived: old ? form.archived.checked : false,
      budget: form.budget ? num(form.budget.value) || 0 : (old && old.budget) || 0,
      noDuties: form.duties ? !form.duties.checked : !!(old && old.noDuties),
      // Mitreisende: leer = alle (auch Personen, die später dazukommen)
      members: form.who && [...form.querySelectorAll('[name=who]:not(:checked)')].length ? [...form.querySelectorAll('[name=who]:checked')].map(c => c.value) : null,
    });
    if (APP.tripSaved) APP.tripSaved(t, old, form);
    if (!old) { setTrip(t.id); lastFit = ''; }
    if (!old && afterNewTrip) { const cb = afterNewTrip; afterNewTrip = null; setTimeout(() => cb(t), 500); }
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
      await api('user-save', {
        id, name: form.name.value.trim(), login: form.login.value.trim(),
        password: form.newPw ? form.newPw.value : '', canCash: form.canCash.checked,
        ...(form.isAdmin ? { isAdmin: form.isAdmin.checked || (id === session.user.id), canFound: form.canFound.checked } : {}),
        // Neue Personen zahlen standardmäßig nicht mit (meist Kinder); änderbar in der Crew
        ...(!id && form.joinCrew && form.joinCrew.checked ? { joinCrew: crew.id, shares: false } : {}),
        ...(APP.readAreas ? APP.readAreas(form) : {}),
      });
      const pw = form.newPw ? form.newPw.value : '';
      refreshSession();
      if (pw && APP.accessCard) {
        lastCard = { name: form.name.value.trim(), login: form.login.value.trim(), password: pw };
        openSheet(`<div>${sheetHead(id ? 'Neues Passwort gespeichert' : 'Konto angelegt')}
          <p>Für <b>${esc(lastCard.name)}</b> gibt es jetzt eine Zugangskarte zum Ausdrucken oder als PDF: mit QR-Code zur App, Anmeldename und Passwort.</p>
          <p class="sub">Das Passwort kennt LAMMping nur jetzt. Später lässt sich die Karte nur noch ohne Passwort drucken.</p>
          <div class="sheet-foot"><button type="button" class="ghost" data-action="close">Fertig</button><button type="button" class="primary" data-action="access-card" data-last="1">Zugangskarte drucken / PDF</button></div></div>`);
      } else {
        closeSheet();
        toast(id ? 'Gespeichert' : 'Konto angelegt');
      }
    } catch (e) { toast(e.message); }
  },
  crew: async form => {
    const shares = new Set([...form.querySelectorAll('[name=shares]:checked')].map(i => i.value));
    const leaders = new Set([...form.querySelectorAll('[name=leader]:checked')].map(i => i.value));
    const chosen = [...form.querySelectorAll('[name=member]:checked')].map(i => ({ id: i.value, shares: shares.has(i.value), leader: leaders.has(i.value) }));
    if (form.dataset.id && form.dataset.id === crew.id && !chosen.some(m => m.id === session.user.id)) {
      return toast('Du kannst dich nicht aus der geöffneten Crew entfernen.');
    }
    if (form.dataset.id && !chosen.some(m => m.leader)) return toast('Eine Crew braucht mindestens einen Crew-Leiter (👑).');
    try {
      await api('crew-save', { id: form.dataset.id || null, name: form.name.value.trim(), ...(form.dataset.id ? { members: chosen } : {}) });
      closeSheet();
      toast(form.dataset.id ? 'Gespeichert' : 'Crew gegründet. Du findest sie unter Einstellungen → Crew.');
      refreshSession();
    } catch (e) { toast(e.message); }
  },
};

// Einladungsseite (siehe VIEWS.invite)
ACTIONS['invite-mode'] = el => { invite.haveAccount = !!el.dataset.have; render(); };
FORMS['nocrew-found'] = async form => {
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    const r = await api('crew-save', { name: form.name.value.trim() });
    if (r && r.id) LS.set('crew', r.id);
    location.reload();
  } catch (e) { toast(e.message); btn.disabled = false; }
};

FORMS['invite-join'] = async form => {
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    inviteDone(await api('invite', { token: invite.token, ...(form.name ? { name: form.name.value.trim(), login: form.login.value.trim(), password: form.password.value } : {}) }));
  } catch (e) { toast(e.message); btn.disabled = false; }
};
FORMS['invite-login'] = async form => {
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    await api('login', { login: form.login.value.trim(), password: form.password.value });
    inviteDone(await api('invite', { token: invite.token }));
  } catch (e) { toast(e.message); btn.disabled = false; }
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
    const camera = el.dataset.camera === '1';
    el.value = '';
    await addPhotoFiles(files);
    // Mit der Kamera aufgenommen: Original in voller Auflösung auch fürs Handy sichern
    if (camera && files[0]) saveToGallery(files[0]);
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
  // Genau passend (z. B. „karte/hier“) oder mit Platzhalter (z. B. „tagebuch/*“ für einen Eintrag einer anderen Crew)
  const fn = arg && (ROUTE_ARGS[`${r}/${arg}`] || (ROUTE_ARGS[`${r}/*`] && (() => ROUTE_ARGS[`${r}/*`](decodeURIComponent(arg)))));
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
      applyRole();
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
  // Einladungslink geöffnet: erst beitreten (mit neuem oder bestehendem Konto)
  const inviteToken = new URLSearchParams(location.search).get('invite');
  if (inviteToken && /^[a-f0-9]{32}$/.test(inviteToken)) {
    invite = { token: inviteToken, loggedIn: !!s.user };
    gate = 'invite'; loadInvite(); return render();
  }
  if (!s.user) { gate = 'login'; return render(); }
  session = s;
  crew = s.crews.find(c => c.id === LS.get('crew', null)) || s.crews[0];
  if (!crew) { gate = 'nocrew'; return render(); }
  LS.set('crew', crew.id);
  applyRole();

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
  getPos, placeInfo, placeQuick, locateInto, openPicker, setFormPos, posLabel, pinIcon, entryPopup,
  currentTrip, tripColor, tripStats, tripEntries, members, me, personName, canCash, defaultSplit,
  openEntryForm, itemListId, listsOf, listForm, extrasOf, isPacked, itemForm, FEATURES, TYPES, CATS, SETTLE,
  setPendingFocus: f => { pendingFocus = f; },
  refit: () => { lastFit = null; },
  mapClickHooks, MINOR, applyType, titleHints, checkTripRange, photoGeo, replaceFormPhoto, tripForDate, tripForm, newTripThen, saveToGallery, settingsPanels, showMe, payers, typesIn, costCat, extraText,
  crewId: () => crew.id, crewName: () => crew.name, chromeHooks, api, ROUTE_ARGS, sheetHead, nextColor, setTrip, tripHead, afterDraw, openEntry,
  session: () => session, store: () => store, shrink, installState: () => ({ standalone: isStandalone(), prompt: !!installPrompt, ios: isIOS, shareIcon: SHARE_ICON }), TRIP_KINDS, tripKind, kindInfo, isNight, NIGHT_TYPES, splitLegs, legOf, legKm, drawSpecialLegs, routePts, typesByUse,
  setSimulator: f => { simulatedPos = f; }, addFormPhoto, addPhotoFiles, formPhotos: () => formPhotos, submitEntry,
  get map() { return map; },
  get routeLayer() { return routeLayer; },
  ensureMap,
};
installDateien(APP);
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
installFamilienleben(APP);
installSichern(APP);
installSpielekiste(APP);
installMitfahrer(APP);
installMitreisen(APP);
installStrecken(APP);
installZuschnitt(APP);
installHeute(APP);
installMitteilungen(APP);
installSpuren(APP);
installReisearten(APP);
installStarthilfe(APP);
if (APP.sortGames) APP.sortGames();
installNavigation(APP);

start();
