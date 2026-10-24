import { createStore, newId } from './store.js';

/* ---------- Konstanten ---------- */

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
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

const TYPES = {
  stellplatz: { label: 'Stellplatz', many: 'Stellplätze' },
  sight: { label: 'Sehenswert', many: 'Sehenswertes' },
  notiz: { label: 'Notiz', many: 'Notizen' },
};
const FEATURES = ['Strom', 'Wasser', 'Entsorgung', 'WC', 'Dusche', 'Ruhig', 'Eben', 'Aussicht', 'Kostenlos'];
const CATS = ['Stellplatz', 'Sprit', 'Lebensmittel', 'Essen gehen', 'Eintritt', 'Maut & Vignette', 'Fähre', 'Ausrüstung', 'Sonstiges'];
const SETTLE = 'Ausgleich';

/* ---------- Zustand ---------- */

const S = { trips: [], entries: [], expenses: [], boxes: [], items: [], packstate: [], listItems: [], meta: [] };
const WATCHED = Object.keys(S);
let store;
let user = null;

const LS = {
  get(k, d) { try { const v = localStorage.getItem('bb.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bb.' + k, JSON.stringify(v)); } catch { /* privater Modus */ } },
};

const ui = {
  route: 'karte',
  mapScope: 'trip',
  diaryFilter: 'alle',
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
  store.put(coll, doc).catch(e => toast('Speichern hat nicht geklappt: ' + e.message));
  return doc;
}
function remove(coll, id) {
  store.del(coll, id).catch(e => toast('Löschen hat nicht geklappt: ' + e.message));
}

/* ---------- Personen & Reisen ---------- */

const settings = () => S.meta.find(m => m.id === 'settings') || { people: ['Person 1', 'Person 2'] };
const people = () => settings().people || ['Person 1', 'Person 2'];
const me = () => LS.get('me', 0);
const personName = i => people()[i] || `Person ${+i + 1}`;
const initial = i => (personName(i)[0] || '?').toUpperCase();

const sortTrips = list => list.slice().sort((a, b) => (b.start || '9').localeCompare(a.start || '9'));
const activeTrips = () => sortTrips(S.trips.filter(t => !t.archived));

function currentTrip() {
  const id = LS.get('trip', null);
  return S.trips.find(t => t.id === id) || activeTrips()[0] || null;
}
const tripColor = t => (t && t.color) || '#0F6670';
const tripEntries = t => S.entries.filter(e => t && e.tripId === t.id);

function tripStats(t) {
  const es = tripEntries(t);
  const stops = es.filter(hasPos).sort(byDate);
  let dist = 0;
  for (let i = 1; i < stops.length; i++) dist += km(stops[i - 1], stops[i]);
  const cost = S.expenses.filter(x => x.tripId === t.id && x.cat !== SETTLE).reduce((s, x) => s + (x.amount || 0), 0);
  const firstDay = t.start || (es.slice().sort(byDate)[0] || {}).date?.slice(0, 10);
  const lastDay = t.end && t.end < today() ? t.end : today();
  const days = firstDay && firstDay <= lastDay ? Math.round((dayDate(lastDay) - dayDate(firstDay)) / 864e5) + 1 : 0;
  return {
    es, stops, dist, cost, days, firstDay,
    nights: es.filter(e => e.type === 'stellplatz').length,
    sights: es.filter(e => e.type === 'sight').length,
  };
}

function nextColor() {
  const used = S.trips.map(t => t.color);
  return (TRIP_COLORS.find(([, c]) => !used.includes(c)) || TRIP_COLORS[S.trips.length % TRIP_COLORS.length])[1];
}

/* ---------- Ortung ---------- */

function getPos() {
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

async function placeName(p) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=de&lat=${p.lat}&lon=${p.lng}`);
    const a = (await r.json()).address || {};
    return a.village || a.town || a.city || a.municipality || a.hamlet || a.county || '';
  } catch { return ''; }
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

/* ---------- Rendern ---------- */

let frame;
function render() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
}

const VIEWS = {};

function draw() {
  const t = currentTrip();
  document.documentElement.style.setProperty('--trip', tripColor(t));
  const loggedOut = store.mode === 'firebase' && !user;
  document.body.classList.toggle('locked', loggedOut);

  $('#tripChip').innerHTML = t
    ? `<span class="dot"></span><span class="name">${esc(t.name)}</span>${t.archived ? '<span class="tag">Archiv</span>' : ''}`
    : `<span class="dot"></span><span class="name">Noch keine Reise</span>`;
  $('#routeBand').innerHTML = routeBand(t);
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === ui.route));

  const onMap = ui.route === 'karte' && !loggedOut;
  $('#mapview').hidden = !onMap;
  $('#view').hidden = onMap;
  if (onMap) return drawMap();

  const view = $('#view');
  // Eingaben retten, falls während des Tippens neue Daten eintreffen
  const kept = {};
  view.querySelectorAll('[data-keep]').forEach(i => { kept[i.dataset.keep] = i.value; });
  const act = document.activeElement;
  const focusKey = act && view.contains(act) && act.dataset.keep;
  const sel = focusKey ? [act.selectionStart, act.selectionEnd] : null;

  view.innerHTML = loggedOut ? VIEWS.login() : (VIEWS[ui.route] || VIEWS.tagebuch)();

  view.querySelectorAll('[data-keep]').forEach(i => {
    if (kept[i.dataset.keep] != null && i.dataset.keep !== 'packQuery') i.value = kept[i.dataset.keep];
  });
  if (focusKey) {
    const el = view.querySelector(`[data-keep="${focusKey}"]`);
    if (el) { el.focus(); try { el.setSelectionRange(...sel); } catch { /* kein Textfeld */ } }
  }
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
let pendingFocus = null;

function ensureMap() {
  if (map) return;
  map = L.map('map', { zoomControl: false }).setView([48.1, 11.6], 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  carLayer = L.layerGroup().addTo(map);
  meLayer = L.layerGroup().addTo(map);
}

const pinIcon = (type, color, small) => L.divIcon({
  className: '',
  html: `<div class="pin pin-${type}${small ? ' small' : ''}" style="--c:${color}">${small ? '' : icon(type)}</div>`,
  iconSize: small ? [14, 14] : [30, 30],
  iconAnchor: small ? [7, 7] : [15, 15],
  popupAnchor: [0, -14],
});

function entryPopup(e, t) {
  return `<div class="popup">
    <strong>${esc(e.title || TYPES[e.type].label)}</strong>
    <span>${t ? esc(t.name) + ', ' : ''}${fmtDay(e.date.slice(0, 10))}</span>
    <button class="link" data-action="open-entry" data-id="${e.id}">Eintrag öffnen</button>
  </div>`;
}

function drawRoute(t, emphasis) {
  const color = tripColor(t);
  const stops = tripEntries(t).filter(hasPos).sort(byDate);
  const pts = stops.map(e => [e.lat, e.lng]);
  if (pts.length > 1) {
    L.polyline(pts, { color: '#fff', weight: emphasis ? 8 : 6, opacity: 0.9 }).addTo(routeLayer);
    L.polyline(pts, { color, weight: emphasis ? 4 : 3, opacity: emphasis ? 1 : 0.85 }).addTo(routeLayer);
  }
  stops.forEach(e => {
    const small = !emphasis || e.type === 'notiz';
    const m = L.marker([e.lat, e.lng], { icon: pinIcon(e.type, color, small) })
      .bindPopup(entryPopup(e, emphasis ? null : t))
      .addTo(routeLayer);
    m.entryId = e.id;
  });
  return pts;
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
    <h1>Wohin geht's?</h1>
    <p>Legt eine Reise an. Danach landen Stellplätze, Sehenswertes, Notizen und Ausgaben automatisch bei dieser Reise.</p>
    <button class="primary" data-action="trip-form">Reise anlegen</button>
  </section>`;
}

function tripHead(t, st) {
  const facts = [
    st.days ? `<div><b>${st.days}</b><span>${st.days === 1 ? 'Tag' : 'Tage'}</span></div>` : '',
    `<div><b>${st.nights}</b><span>${st.nights === 1 ? 'Stellplatz' : 'Stellplätze'}</span></div>`,
    `<div><b>${st.sights}</b><span>Sehenswertes</span></div>`,
    st.dist ? `<div><b>${fmtKm(st.dist)}</b><span>Luftlinie</span></div>` : '',
  ].join('');
  return `<header class="trip-head">
    <h1>${esc(t.name)}</h1>
    <p class="sub">${fmtRange(t)}</p>
    <div class="facts">${facts}</div>
  </header>`;
}

VIEWS.tagebuch = () => {
  const t = currentTrip();
  if (!t) return emptyTrip();
  const st = tripStats(t);
  const filter = ui.diaryFilter;
  const list = st.es.filter(e => filter === 'alle' || e.type === filter).sort(byDate).reverse();

  const chips = ['alle', 'stellplatz', 'sight', 'notiz'].map(f =>
    `<button class="chip${filter === f ? ' on' : ''}" data-action="diary-filter" data-f="${f}">${f === 'alle' ? 'Alles' : TYPES[f].many}</button>`).join('');

  const days = {};
  list.forEach(e => (days[e.date.slice(0, 10)] ||= []).push(e));
  const timeline = Object.entries(days).map(([day, es]) => {
    const n = st.firstDay ? Math.round((dayDate(day) - dayDate(st.firstDay)) / 864e5) + 1 : null;
    return `<li class="day">
      <h2><span>${n && n > 0 ? 'Tag ' + n : fmtDay(day)}</span>${n && n > 0 ? `<small>${fmtDay(day)}</small>` : ''}</h2>
      <ol>${es.map(stopItem).join('')}</ol>
    </li>`;
  }).join('');

  return `${tripHead(t, st)}
    <div class="toolbar diary-bar">
      <div class="chips">${chips}</div>
      <button class="primary" data-action="entry-form">${icon('plus')}Eintrag</button>
    </div>
    ${list.length
      ? `<ol class="timeline">${timeline}</ol>`
      : `<p class="hint">Noch keine Einträge. Auf der Karte trägst du mit „Ich bin hier …“ den aktuellen Ort ein, hier kannst du auch nachträglich schreiben.</p>`}`;
};

function stopItem(e) {
  const thumbs = (e.photos || []).slice(0, 4).map(p => `<img src="${p.thumb}" alt="">`).join('');
  const bits = [
    e.place ? esc(e.place) : '',
    e.rating ? '★'.repeat(e.rating) : '',
    e.cost ? money(e.cost) : '',
  ].filter(Boolean);
  return `<li class="stop stop-${e.type}">
    <button data-action="open-entry" data-id="${e.id}">
      <span class="node">${icon(e.type)}</span>
      <span class="body">
        <span class="time">${fmtTime(e.date)} ${TYPES[e.type].label}</span>
        <strong>${esc(e.title || (e.type === 'notiz' ? 'Notiz' : 'Ohne Titel'))}</strong>
        ${bits.length ? `<span class="meta">${bits.join(', ')}</span>` : ''}
        ${e.text ? `<span class="text">${esc(e.text)}</span>` : ''}
        ${thumbs ? `<span class="thumbs">${thumbs}</span>` : ''}
      </span>
    </button>
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
  const feats = FEATURES.map(f =>
    `<label class="chip"><input type="checkbox" name="feat" value="${f}"${(e.features || []).includes(f) ? ' checked' : ''}><span>${f}</span></label>`).join('');
  const stars = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="star${(e.rating || 0) >= n ? ' on' : ''}" data-action="rate" data-v="${n}" aria-label="${n} von 5">★</button>`).join('');

  return `<form data-form="entry" data-type="${type}" data-id="${e.id || ''}">
    <div class="sheet-head">
      <h2>${isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</h2>
      <button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button>
    </div>
    <div class="seg types">${typeRadios}</div>
    <label class="field"><span>Titel</span><input name="title" value="${esc(e.title)}" placeholder="z. B. Wiese am Seeufer" autocomplete="off"></label>
    <div class="row2">
      <label class="field"><span>Wann</span><input type="datetime-local" name="date" value="${esc(e.date || nowLocal())}" required></label>
      <label class="field"><span>Ort</span><input name="place" value="${esc(e.place)}" placeholder="Ortsname"></label>
    </div>
    <div class="field">
      <span>Position</span>
      <input type="hidden" name="lat" value="${e.lat ?? ''}"><input type="hidden" name="lng" value="${e.lng ?? ''}"><input type="hidden" name="acc" value="${e.acc ?? ''}">
      <p class="pos" id="posText">${hasPos(e) ? posLabel(e) : 'Noch keine Position'}</p>
      <div class="btnrow">
        <button type="button" class="ghost" data-action="pos-here">${icon('pin')}Aktuelle Position</button>
        <button type="button" class="ghost" data-action="pos-pick">Auf Karte wählen</button>
      </div>
      <div id="pickMap" class="pick-map" hidden></div>
    </div>
    <label class="field"><span>Was war los?</span><textarea name="text" rows="4" placeholder="Eindrücke, Tipps, was ihr nächstes Mal anders macht …">${esc(e.text)}</textarea></label>
    <div class="field not-notiz"><span>Bewertung</span><input type="hidden" name="rating" value="${e.rating || 0}"><div class="stars">${stars}</div></div>
    <div class="field only-stellplatz"><span>Ausstattung</span><div class="chips wrap">${feats}</div></div>
    <div class="row2 not-notiz">
      <label class="field"><span>Kosten in €</span><input name="cost" inputmode="decimal" value="${e.cost ? String(e.cost).replace('.', ',') : ''}" placeholder="0"></label>
      <label class="check"><input type="checkbox" name="toKasse" ${isNew || linked ? 'checked' : ''}><span>${linked ? 'Im Kassenbuch' : 'Ins Kassenbuch'}</span></label>
    </div>
    <div class="field"><span>Fotos</span>
      <div class="photo-grid" id="photoGrid">${photoGrid()}</div>
      <label class="ghost file">${icon('plus')}Fotos hinzufügen<input type="file" accept="image/*" multiple data-action="add-photos"></label>
    </div>
    <div class="sheet-foot">
      ${isNew ? '' : `<button type="button" class="danger ghost" data-action="del-entry" data-id="${e.id}">Löschen</button>`}
      <button class="primary">Speichern</button>
    </div>
  </form>`;
}

const posLabel = p => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.acc ? ` (± ${p.acc} m)` : ''}`;

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
  if (fillPlace && !form.place.value) placeName(p).then(n => { if (n && !form.place.value) form.place.value = n; });
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

function openEntryForm(e, opts = {}) {
  if (!currentTrip()) { toast('Legt zuerst eine Reise an.'); return tripForm(); }
  openSheet(entryForm(e), form => {
    form.addEventListener('change', ev => {
      if (ev.target.name === 'type') form.dataset.type = ev.target.value;
    });
    if (opts.locate) locateInto(form);
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
    rating: type === 'notiz' ? 0 : +fd.get('rating') || 0,
    features: type === 'stellplatz' ? fd.getAll('feat') : [],
    cost: type === 'notiz' ? 0 : num(fd.get('cost')),
  };

  // Fotos: neue als eigene Dokumente speichern, im Eintrag nur Vorschaubilder
  formPhotos.drop.forEach(id => remove('photos', id));
  formPhotos.add.forEach(p => save('photos', { id: p.id, entryId: e.id, tripId: e.tripId, data: p.data }));
  e.photos = [...formPhotos.keep, ...formPhotos.add].map(({ id, thumb }) => ({ id, thumb }));
  save('entries', e);

  // Kosten ins Kassenbuch
  const linked = S.expenses.find(x => x.entryId === e.id);
  if (fd.get('toKasse') && e.cost > 0) {
    save('expenses', {
      ...(linked || { id: newId(), tripId: e.tripId, paidBy: me(), split: 'both', entryId: e.id }),
      amount: e.cost,
      date: e.date.slice(0, 10),
      cat: e.type === 'stellplatz' ? 'Stellplatz' : 'Eintritt',
      note: e.title || e.place,
    });
  } else if (linked && (!fd.get('toKasse') || !e.cost)) {
    remove('expenses', linked.id);
  }
  closeSheet();
  toast(old ? 'Eintrag gespeichert' : 'Eintrag angelegt');
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
    <dl class="facts-list">
      ${e.cost ? `<div><dt>Kosten</dt><dd>${money(e.cost)}</dd></div>` : ''}
      ${hasPos(e) ? `<div><dt>Position</dt><dd>${posLabel(e)}</dd></div>` : ''}
      <div><dt>Eingetragen von</dt><dd>${esc(personName(e.by))}</dd></div>
    </dl>
    <div class="sheet-foot">
      ${hasPos(e) ? `<button class="ghost" data-action="show-on-map" data-id="${e.id}">Auf der Karte</button><a class="ghost btn" href="${navUrl(e)}" target="_blank" rel="noopener">Hinfahren</a>` : ''}
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

VIEWS.listen = () => {
  const tab = ui.listTab;
  const items = S.listItems.filter(i => i.list === tab);
  const open = items.filter(i => !i.done).sort((a, b) => b.createdAt - a.createdAt);
  const done = items.filter(i => i.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const count = l => S.listItems.filter(i => i.list === l && !i.done).length;
  const row = i => `<li class="${i.done ? 'done' : ''}">
    <button class="tick" data-action="toggle-item" data-id="${i.id}" aria-pressed="${!!i.done}" aria-label="${i.done ? 'Wieder offen' : 'Erledigt'}"></button>
    <span class="txt">${esc(i.text)}</span>
    <span class="who" title="${esc(personName(i.by))}">${initial(i.by)}</span>
    <button class="icon-btn small" data-action="del-item" data-id="${i.id}" aria-label="Löschen">${icon('close')}</button>
  </li>`;
  return `<header class="page-head"><h1>Listen</h1></header>
    <div class="seg tabs">
      <button class="${tab === 'einkauf' ? 'on' : ''}" data-action="list-tab" data-tab="einkauf">Einkaufen <small>${count('einkauf')}</small></button>
      <button class="${tab === 'merken' ? 'on' : ''}" data-action="list-tab" data-tab="merken">Merkliste <small>${count('merken')}</small></button>
    </div>
    <form class="adder" data-form="list-add">
      <input name="text" data-keep="listAdd" placeholder="${tab === 'einkauf' ? 'Was fehlt? z. B. Gaskartusche' : 'Was wollt ihr nicht vergessen?'}" autocomplete="off" enterkeyhint="done">
      <button class="primary" aria-label="Hinzufügen">${icon('plus')}</button>
    </form>
    <ul class="checklist">${open.map(row).join('') || `<li class="none">${tab === 'einkauf' ? 'Alles da.' : 'Nichts vorgemerkt.'}</li>`}</ul>
    ${done.length ? `<div class="done-head"><h2>Erledigt</h2><button class="link" data-action="clear-done">Erledigte entfernen</button></div>
      <ul class="checklist">${done.map(row).join('')}</ul>` : ''}`;
};

/* ---------- Ansicht: Boxen & Packliste ---------- */

const LOOSE = { id: '', name: 'Ohne Box', where: 'lose im Auto' };

VIEWS.packen = () => {
  const t = currentTrip();
  const q = ui.packQuery.trim().toLowerCase();
  const boxes = [...S.boxes.slice().sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name))];
  if (S.items.some(i => !i.boxId || !S.boxes.find(b => b.id === i.boxId))) boxes.push(LOOSE);
  const inBox = b => S.items.filter(i => (b === LOOSE ? !S.boxes.find(x => x.id === i.boxId) : i.boxId === b.id))
    .filter(i => !q || i.name.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  const packed = i => t && S.packstate.some(p => p.id === `${t.id}_${i.id}` && p.packed);
  const setup = ui.packMode === 'einrichten' || !t;

  const total = S.items.length;
  const packedCount = t ? S.items.filter(packed).length : 0;

  const sections = boxes.map(b => {
    const items = inBox(b);
    if (q && !items.length) return '';
    const got = items.filter(packed).length;
    return `<section class="box">
      <header>
        <div><h2>${esc(b.name)}</h2>${b.where ? `<p class="sub">${esc(b.where)}</p>` : ''}</div>
        ${setup
          ? (b === LOOSE ? '' : `<button class="icon-btn small" data-action="box-form" data-id="${b.id}" aria-label="Box bearbeiten">${icon('edit')}</button>`)
          : `<span class="count">${got} / ${items.length}</span>`}
      </header>
      <ul class="${setup ? 'inventory' : 'checklist'}">
        ${items.map(i => setup
          ? `<li><span class="txt">${esc(i.name)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span>
              <button class="icon-btn small" data-action="item-form" data-id="${i.id}" aria-label="Bearbeiten">${icon('edit')}</button></li>`
          : `<li class="${packed(i) ? 'done' : ''}"><button class="tick" data-action="pack" data-id="${i.id}" aria-pressed="${packed(i)}" aria-label="Eingepackt"></button>
              <span class="txt">${esc(i.name)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span></li>`).join('')
          || '<li class="none">Leer</li>'}
      </ul>
      ${setup && b !== LOOSE ? `<button class="link add-in" data-action="item-form" data-box="${b.id}">${icon('plus')}Gegenstand in diese Box</button>` : ''}
    </section>`;
  }).join('');

  return `<header class="page-head"><h1>Boxen</h1>
      ${t && !setup ? `<p class="sub">${packedCount} von ${total} für „${esc(t.name)}“ eingepackt</p>` : '<p class="sub">Was liegt in welcher Box?</p>'}
    </header>
    ${t ? `<div class="seg tabs">
      <button class="${!setup ? 'on' : ''}" data-action="pack-mode" data-mode="packen">Packen</button>
      <button class="${setup ? 'on' : ''}" data-action="pack-mode" data-mode="einrichten">Boxen einrichten</button>
    </div>` : ''}
    ${t && !setup && total ? `<div class="progress" style="--p:${total ? packedCount / total : 0}"><span></span></div>` : ''}
    <label class="search">${icon('search')}<input type="search" data-keep="packQuery" data-action-input="pack-search" value="${esc(ui.packQuery)}" placeholder="Wo ist …?"></label>
    ${sections || (q ? `<p class="hint">„${esc(ui.packQuery)}“ steht in keiner Box.</p>` : `<p class="hint">Legt eure Campingboxen an und tragt ein, was drin ist. Dann findet ihr alles über die Suche und habt beim Packen eine Liste zum Abhaken.</p>`)}
    <div class="toolbar end">
      ${setup ? `<button class="ghost" data-action="item-form">${icon('plus')}Gegenstand</button><button class="primary" data-action="box-form">${icon('plus')}Neue Box</button>`
        : `<button class="ghost" data-action="pack-reset">Packliste zurücksetzen</button>`}
    </div>`;
};

function boxForm(id) {
  const b = S.boxes.find(x => x.id === id) || {};
  openSheet(`<form data-form="box" data-id="${b.id || ''}">
    <div class="sheet-head"><h2>${b.id ? 'Box bearbeiten' : 'Neue Box'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Name</span><input name="name" value="${esc(b.name)}" required placeholder="z. B. Küchenbox"></label>
    <label class="field"><span>Wo steht sie?</span><input name="where" value="${esc(b.where)}" placeholder="z. B. hinten links unter dem Bett"></label>
    <label class="field"><span>Reihenfolge</span><input name="order" type="number" inputmode="numeric" value="${b.order ?? S.boxes.length + 1}"></label>
    <div class="sheet-foot">
      ${b.id ? `<button type="button" class="ghost danger" data-action="del-box" data-id="${b.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

function itemForm(id, boxId) {
  const i = S.items.find(x => x.id === id) || { boxId: boxId || '' };
  const opts = S.boxes.map(b => `<option value="${b.id}"${b.id === i.boxId ? ' selected' : ''}>${esc(b.name)}</option>`).join('');
  openSheet(`<form data-form="item" data-id="${i.id || ''}">
    <div class="sheet-head"><h2>${i.id ? 'Gegenstand bearbeiten' : 'Neuer Gegenstand'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <label class="field"><span>Was?</span><input name="name" value="${esc(i.name)}" required placeholder="z. B. Stirnlampe"></label>
    <label class="field"><span>In welcher Box?</span><select name="boxId"><option value="">Ohne Box</option>${opts}</select></label>
    <label class="field"><span>Notiz</span><input name="note" value="${esc(i.note)}" placeholder="z. B. 2 Stück, im Seitenfach"></label>
    <div class="sheet-foot">
      ${i.id ? `<button type="button" class="ghost danger" data-action="del-pack-item" data-id="${i.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Kassenbuch ---------- */

function balance(list) {
  const net = [0, 0];
  list.forEach(x => {
    const a = x.amount || 0;
    net[x.paidBy] += a;
    if (x.split === 'both') { net[0] -= a / 2; net[1] -= a / 2; }
    else net[x.split === 'p1' ? 1 : 0] -= a;
  });
  return net;
}

VIEWS.kasse = () => {
  const t = currentTrip();
  if (!t) return emptyTrip();
  const list = S.expenses.filter(x => x.tripId === t.id).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
  const real = list.filter(x => x.cat !== SETTLE);
  const total = real.reduce((s, x) => s + (x.amount || 0), 0);
  const st = tripStats(t);
  const net = balance(list);
  const debtor = net[0] < -0.005 ? 0 : net[1] < -0.005 ? 1 : null;
  const owed = debtor == null ? 0 : -net[debtor];

  const byCat = {};
  real.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  const groups = {};
  list.forEach(x => (groups[x.date] ||= []).push(x));
  const splitLabel = x => x.split === 'both' ? 'geteilt' : `nur für ${esc(personName(x.split === 'p1' ? 1 : 0))}`;

  return `<header class="page-head"><h1>Kasse</h1><p class="sub">${esc(t.name)}</p></header>
    <section class="ledger-sum">
      <p class="total">${money(total)}</p>
      <p class="sub">${st.days ? `${money(total / st.days)} pro Tag, ` : ''}${st.nights ? `${money((byCat.Stellplatz || 0) / st.nights)} pro Nacht auf Stellplätzen` : 'ausgegeben'}</p>
      <div class="settle ${debtor == null ? 'even' : ''}">
        ${debtor == null
          ? '<p>Ihr seid quitt.</p>'
          : `<p><b>${esc(personName(debtor))}</b> schuldet <b>${esc(personName(1 - debtor))}</b> ${money(owed)}</p>
             <button class="ghost" data-action="settle" data-from="${debtor}" data-amount="${owed.toFixed(2)}">Ausgleich eintragen</button>`}
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
  const x = S.expenses.find(e => e.id === id) || { date: today(), paidBy: me(), split: 'both', cat: 'Lebensmittel' };
  const catOpts = [...CATS, SETTLE].map(c => `<option${c === x.cat ? ' selected' : ''}>${c}</option>`).join('');
  const who = [0, 1].map(i => `<label><input type="radio" name="paidBy" value="${i}"${+x.paidBy === i ? ' checked' : ''}><span>${esc(personName(i))}</span></label>`).join('');
  const split = [['both', 'Beide'], ['p0', 'Nur ' + personName(0)], ['p1', 'Nur ' + personName(1)]]
    .map(([v, l]) => `<label><input type="radio" name="split" value="${v}"${x.split === v ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('');
  openSheet(`<form data-form="expense" data-id="${x.id || ''}">
    <div class="sheet-head"><h2>${x.id ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <div class="row2">
      <label class="field"><span>Betrag in €</span><input name="amount" inputmode="decimal" required value="${x.amount ? String(x.amount).replace('.', ',') : ''}" placeholder="0,00" autofocus></label>
      <label class="field"><span>Datum</span><input type="date" name="date" value="${x.date}" required></label>
    </div>
    <label class="field"><span>Kategorie</span><select name="cat">${catOpts}</select></label>
    <label class="field"><span>Wofür?</span><input name="note" value="${esc(x.note)}" placeholder="z. B. Wochenmarkt Annecy"></label>
    <div class="field"><span>Bezahlt von</span><div class="seg">${who}</div></div>
    <div class="field"><span>Für wen?</span><div class="seg">${split}</div></div>
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
  return `<header class="page-head"><h1>Reisen</h1><p class="sub">Tippe eine Reise an, um sie zu öffnen.</p></header>
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
    ${t.id ? `<label class="check"><input type="checkbox" name="archived"${t.archived ? ' checked' : ''}><span>Reise ist abgeschlossen (ins Archiv)</span></label>` : ''}
    <div class="sheet-foot">
      ${t.id ? `<button type="button" class="ghost danger" data-action="del-trip" data-id="${t.id}">Löschen</button>` : ''}
      <button class="primary">Speichern</button>
    </div>
  </form>`);
}

/* ---------- Ansicht: Einstellungen & Anmeldung ---------- */

VIEWS.einstellungen = () => {
  const p = people();
  const who = [0, 1].map(i => `<label><input type="radio" name="me" value="${i}"${me() === i ? ' checked' : ''}><span>${esc(personName(i))}</span></label>`).join('');
  return `<header class="page-head"><h1>Einstellungen</h1></header>
    <form class="panel" data-form="settings">
      <h2>Wir zwei</h2>
      <div class="row2">
        <label class="field"><span>Name 1</span><input name="p0" value="${esc(p[0])}" required></label>
        <label class="field"><span>Name 2</span><input name="p1" value="${esc(p[1])}" required></label>
      </div>
      <div class="field"><span>Auf diesem Handy bin ich</span><div class="seg">${who}</div></div>
      <button class="primary">Speichern</button>
    </form>
    <section class="panel">
      <h2>Synchronisation</h2>
      ${store.mode === 'firebase'
        ? `<p>Verbunden mit Firebase, angemeldet als <b>${esc(user && user.email)}</b>. Änderungen erscheinen sofort auf beiden Handys, ohne Netz werden sie nachgeholt.</p>
           <button class="ghost" data-action="logout">Abmelden</button>`
        : `<p><b>Testmodus:</b> Alles bleibt auf diesem Gerät. Für den gemeinsamen Zugriff Firebase einrichten (siehe ANLEITUNG.md). Mit der Sicherung unten kannst du deine Testdaten danach übernehmen.</p>`}
    </section>
    <section class="panel">
      <h2>Sicherung</h2>
      <p>Speichert alle Reisen, Listen, Boxen und Fotos in einer Datei.</p>
      <div class="btnrow">
        <button class="ghost" data-action="export">Sicherung herunterladen</button>
        <label class="ghost file">Sicherung einspielen<input type="file" accept="application/json,.json" data-action="import"></label>
      </div>
    </section>`;
};

VIEWS.login = () => `<section class="login">
  <h1>Bordbuch</h1>
  <p>Meldet euch mit dem Konto an, das ihr in Firebase angelegt habt.</p>
  <form data-form="login" class="panel">
    <label class="field"><span>E-Mail</span><input type="email" name="email" autocomplete="username" required></label>
    <label class="field"><span>Passwort</span><input type="password" name="pw" autocomplete="current-password" required></label>
    <button class="primary">Anmelden</button>
  </form>
</section>`;

function welcome() {
  const p = people();
  openSheet(`<form data-form="welcome">
    <div class="sheet-head"><h2>Willkommen an Bord</h2></div>
    <p>Wie heißt ihr? Die Namen tauchen bei Einträgen und in der Kasse auf.</p>
    <div class="row2">
      <label class="field"><span>Name 1</span><input name="p0" value="${esc(p[0] === 'Person 1' ? '' : p[0])}" required></label>
      <label class="field"><span>Name 2</span><input name="p1" value="${esc(p[1] === 'Person 2' ? '' : p[1])}" required></label>
    </div>
    <div class="field"><span>Auf diesem Handy bin ich</span><div class="seg">
      <label><input type="radio" name="me" value="0" checked><span>Name 1</span></label>
      <label><input type="radio" name="me" value="1"><span>Name 2</span></label>
    </div></div>
    <div class="sheet-foot"><button class="primary">Los geht's</button></div>
  </form>`);
}

/* ---------- Sicherung ---------- */

function allPhotos() {
  return new Promise(resolve => {
    let off = null, done = false;
    off = store.watch('photos', list => {
      if (done) return;
      done = true;
      resolve(list);
      setTimeout(() => off && off(), 0);
    });
  });
}

async function exportAll() {
  toast('Sicherung wird erstellt …');
  const data = { app: 'bordbuch', version: 1, created: new Date().toISOString(), photos: await allPhotos() };
  WATCHED.forEach(c => { data[c] = S[c]; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = `bordbuch-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importAll(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast('Die Datei ist keine Bordbuch-Sicherung.'); }
  if (data.app !== 'bordbuch') return toast('Die Datei ist keine Bordbuch-Sicherung.');
  const n = [...WATCHED, 'photos'].reduce((s, c) => s + (data[c] || []).length, 0);
  if (!confirm(`${n} Einträge einspielen? Gleiche Einträge werden überschrieben, alles andere bleibt.`)) return;
  [...WATCHED, 'photos'].forEach(c => (data[c] || []).forEach(d => d && d.id && store.put(c, d).catch(() => {})));
  toast('Sicherung eingespielt');
}

/* ---------- Sheet (Dialog) ---------- */

function openSheet(html, onMount) {
  const dlg = $('#sheet');
  $('#sheetBody').innerHTML = html;
  if (!dlg.open) dlg.showModal();
  const root = $('#sheetBody').firstElementChild;
  if (onMount) onMount(root);
}
function closeSheet() {
  const dlg = $('#sheet');
  if (dlg.open) dlg.close();
}
$('#sheet').addEventListener('close', () => {
  if (pickMap) { pickMap.remove(); pickMap = null; pickMarker = null; }
  $('#sheetBody').innerHTML = '';
});
// Tipp auf den abgedunkelten Hintergrund schließt
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

/* ---------- Aktionen ---------- */

const ACTIONS = {
  close: closeSheet,
  'map-scope': el => { ui.mapScope = el.dataset.scope; render(); },
  'here-menu': () => openSheet(`<div>
    <div class="sheet-head"><h2>Ich bin hier …</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>
    <div class="here-grid">
      <button data-action="new-here" data-type="stellplatz">${icon('stellplatz')}<b>Stellplatz</b><small>Hier übernachten wir</small></button>
      <button data-action="new-here" data-type="sight">${icon('sight')}<b>Sehenswert</b><small>Ausflug, Aussicht, Lokal</small></button>
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
  'entry-form': () => openEntryForm({ type: 'notiz' }),
  'open-entry': el => openEntry(el.dataset.id),
  'edit-entry': el => openEntryForm(S.entries.find(e => e.id === el.dataset.id)),
  'del-entry': el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e || !confirm('Diesen Eintrag mit seinen Fotos löschen?')) return;
    (e.photos || []).forEach(p => remove('photos', p.id));
    S.expenses.filter(x => x.entryId === e.id).forEach(x => remove('expenses', x.id));
    remove('entries', e.id);
    closeSheet();
  },
  'show-on-map': el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    closeSheet();
    if (e.tripId !== (currentTrip() || {}).id) LS.set('trip', e.tripId);
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
  'del-item': el => remove('listItems', el.dataset.id),
  'clear-done': () => S.listItems.filter(i => i.list === ui.listTab && i.done).forEach(i => remove('listItems', i.id)),

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
  'item-form': el => itemForm(el.dataset.id, el.dataset.box),
  'del-box': el => {
    const n = S.items.filter(i => i.boxId === el.dataset.id).length;
    if (!confirm(n ? `Box löschen? Ihre ${n} Gegenstände bleiben als „Ohne Box“ erhalten.` : 'Box löschen?')) return;
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
    const from = +el.dataset.from, amount = +el.dataset.amount;
    if (!confirm(`${personName(from)} gibt ${personName(1 - from)} ${money(amount)}. Als Ausgleich eintragen?`)) return;
    save('expenses', {
      id: newId(), tripId: currentTrip().id, date: today(), cat: SETTLE,
      note: `${personName(from)} an ${personName(1 - from)}`, amount, paidBy: from, split: 'p' + (1 - from),
    });
  },

  'trip-form': el => tripForm(el.dataset.id),
  'pick-trip': el => { LS.set('trip', el.dataset.id); lastFit = ''; go('tagebuch'); },
  'all-on-map': () => { ui.mapScope = 'all'; lastFit = ''; go('karte'); },
  'del-trip': el => {
    const t = S.trips.find(x => x.id === el.dataset.id);
    const n = tripEntries(t).length;
    if (!confirm(`„${t.name}“ endgültig löschen?${n ? ` Auch die ${n} Einträge, Fotos und Ausgaben dieser Reise werden gelöscht.` : ''}`)) return;
    tripEntries(t).forEach(e => { (e.photos || []).forEach(p => remove('photos', p.id)); remove('entries', e.id); });
    S.expenses.filter(x => x.tripId === t.id).forEach(x => remove('expenses', x.id));
    S.packstate.filter(p => p.tripId === t.id).forEach(p => remove('packstate', p.id));
    remove('trips', t.id);
    closeSheet();
  },

  export: exportAll,
  logout: () => store.signOut(),
};

const FORMS = {
  entry: submitEntry,
  'list-add': form => {
    const text = form.text.value.trim();
    if (!text) return;
    save('listItems', { id: newId(), list: ui.listTab, text, done: false, by: me(), createdAt: Date.now() });
    form.text.value = '';
    form.text.focus();
  },
  box: form => {
    const old = S.boxes.find(b => b.id === form.dataset.id);
    save('boxes', { ...(old || { id: newId() }), name: form.name.value.trim(), where: form.where.value.trim(), order: +form.order.value || 0 });
    closeSheet();
  },
  item: form => {
    const old = S.items.find(i => i.id === form.dataset.id);
    save('items', { ...(old || { id: newId() }), name: form.name.value.trim(), boxId: form.boxId.value, note: form.note.value.trim() });
    closeSheet();
    toast(old ? 'Gespeichert' : 'Gegenstand angelegt');
  },
  expense: form => {
    const old = S.expenses.find(x => x.id === form.dataset.id);
    const amount = num(form.amount.value);
    if (amount <= 0) return toast('Bitte einen Betrag eintragen.');
    save('expenses', {
      ...(old || { id: newId(), tripId: currentTrip().id }),
      amount, date: form.date.value, cat: form.cat.value, note: form.note.value.trim(),
      paidBy: +form.paidBy.value, split: form.split.value,
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
    });
    if (!old) { LS.set('trip', t.id); lastFit = ''; }
    closeSheet();
    if (!old) go('tagebuch');
  },
  settings: form => {
    save('meta', { id: 'settings', people: [form.p0.value.trim(), form.p1.value.trim()] });
    LS.set('me', +form.me.value);
    toast('Gespeichert');
    render();
  },
  welcome: form => {
    save('meta', { id: 'settings', people: [form.p0.value.trim(), form.p1.value.trim()] });
    LS.set('me', +form.me.value);
    closeSheet();
  },
  login: async form => {
    const btn = form.querySelector('button');
    btn.disabled = true;
    try { await store.signIn(form.email.value.trim(), form.pw.value); }
    catch { toast('Anmeldung fehlgeschlagen. E-Mail und Passwort prüfen.'); }
    finally { btn.disabled = false; }
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

document.addEventListener('input', ev => {
  if (ev.target.dataset.actionInput === 'pack-search') { ui.packQuery = ev.target.value; render(); }
});

document.addEventListener('change', async ev => {
  const el = ev.target;
  if (el.dataset.action === 'add-photos') {
    const files = [...el.files];
    el.value = '';
    toast(files.length > 1 ? `${files.length} Fotos werden verkleinert …` : 'Foto wird verkleinert …');
    for (const f of files) {
      try {
        formPhotos.add.push({ id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1600, 0.78) });
        const grid = $('#photoGrid');
        if (grid) grid.innerHTML = photoGrid();
      } catch { toast('Ein Foto ließ sich nicht lesen.'); }
    }
  }
  if (el.dataset.action === 'import' && el.files[0]) { importAll(el.files[0]); el.value = ''; }
  if (el.name === 'me' && el.form && el.form.dataset.form === 'settings') { LS.set('me', +el.value); render(); }
});

/* ---------- Navigation ---------- */

function go(route) {
  if (location.hash !== '#/' + route) location.hash = '#/' + route;
  else { ui.route = route; render(); }
}

function onHash() {
  const r = location.hash.replace(/^#\/?/, '') || 'karte';
  ui.route = r;
  closeSheet();
  render();
  if (r !== 'karte') window.scrollTo(0, 0);
}
window.addEventListener('hashchange', onHash);

/* ---------- Start ---------- */

async function start() {
  try {
    store = await createStore();
  } catch (err) {
    $('#view').innerHTML = `<section class="empty"><h1>Keine Verbindung</h1><p>Die App konnte nicht starten: ${esc(err.message)}. Prüfe die Internetverbindung beim ersten Öffnen und die Angaben in config.js.</p></section>`;
    return;
  }
  let unsubs = [];
  store.onAuth(u => {
    user = u;
    unsubs.forEach(f => f());
    unsubs = [];
    if (u) {
      const firstLoad = new Set();
      let welcomed = false;
      unsubs = WATCHED.map(c => store.watch(c, list => {
        S[c] = list;
        // Beim ersten Start auf diesem Handy: Namen und „Wer bin ich?“ abfragen
        if (c === 'meta' && !welcomed && LS.get('me', null) == null) { welcomed = true; welcome(); }
        render();
      }));
    } else {
      WATCHED.forEach(c => { S[c] = []; });
    }
    onHash();
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
