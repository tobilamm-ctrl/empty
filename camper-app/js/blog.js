// Reiseblog: zeigt eine Reise zum Lesen an, ohne Anmeldung. Der Schlüssel steht hinter dem # in der Adresse,
// der Server liefert nur Strecke und Einträge dieser einen Reise (ohne Kosten und Namen).

const TYPE = {
  stellplatz: 'Stellplatz', sight: 'Sehenswert', museum: 'Museum', wanderung: 'Wanderung / Radtour', baden: 'Baden',
  restaurant: 'Café / Restaurant', kinder: 'Kinder-Highlight', tank: 'Tankstopp', service: 'Ver- & Entsorgung',
  einkauf: 'Einkauf', pause: 'Pause', faehre: 'Fähre & Maut', werkstatt: 'Werkstatt', waesche: 'Wäsche', notiz: 'Notiz',
};
const SKIP = ['tank', 'service', 'einkauf', 'werkstatt', 'waesche'];   // Unterwegs-Kleinkram nur auf der Karte, nicht in der Zeitleiste

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const day = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const long = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const flag = cc => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '';
const hasPos = e => typeof e.lat === 'number' && typeof e.lng === 'number';
const km = (a, b) => {
  const R = 6371, r = x => x * Math.PI / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const pts = s => (s ? s.split(';').map(p => p.split(',').map(Number)) : []);
const token = location.hash.slice(1);

async function load() {
  if (!/^[a-f0-9]{32}$/.test(token)) return fail('Dieser Link ist unvollständig. Bitte den ganzen Link öffnen.');
  let data;
  try {
    const r = await fetch(`api/?a=blog&t=${token}`, { credentials: 'omit', cache: 'no-store' });
    data = await r.json();
    if (!r.ok) return fail(data.error || 'Dieser Reiseblog ist nicht verfügbar.');
  } catch { return fail('Keine Verbindung. Bitte später noch einmal versuchen.'); }
  show(data);
}
function fail(msg) { $('#blog').innerHTML = `<section class="empty"><h1>Schade</h1><p>${esc(msg)}</p></section>`; }

function show({ trip, entries, tracks, at }) {
  document.title = `${trip.name} · Reiseblog`;
  document.documentElement.style.setProperty('--trip', trip.color);
  const es = entries.filter(e => e.date).sort((a, b) => a.date.localeCompare(b.date));
  const stops = es.filter(hasPos);
  const drive = tracks.filter(t => t.kind !== 'hike');
  let dist = 0;
  if (drive.length) drive.forEach(t => { const p = pts(t.pts); for (let i = 1; i < p.length; i++) dist += km({ lat: p[i - 1][0], lng: p[i - 1][1] }, { lat: p[i][0], lng: p[i][1] }); });
  else for (let i = 1; i < stops.length; i++) dist += km(stops[i - 1], stops[i]);
  const nights = es.filter(e => e.type === 'stellplatz').length;
  const first = trip.start || (es[0] || {}).date?.slice(0, 10);
  const countries = [...new Set(es.map(e => e.country).filter(Boolean))];
  const range = first ? `${long(first)}${trip.end ? ` bis ${long(trip.end)}` : trip.ended ? '' : ', wir sind noch unterwegs'}` : '';

  const days = {};
  es.filter(e => !SKIP.includes(e.type)).forEach(e => (days[e.date.slice(0, 10)] ||= []).push(e));
  const timeline = Object.entries(days).reverse().map(([d, list]) => {
    const n = first ? Math.round((new Date(d + 'T12:00') - new Date(first + 'T12:00')) / 864e5) + 1 : 0;
    return `<li class="day"><h2><span>${n > 0 ? 'Tag ' + n : day(d)}</span>${n > 0 ? `<small>${day(d)}</small>` : ''}</h2>
      <ol>${list.reverse().map(e => `<li class="stop stop-${e.type}"><div class="blog-stop">
        <span class="node"></span>
        <span class="body">
          <span class="time">${e.date.slice(11, 16)} ${TYPE[e.type] || ''}</span>
          <strong>${esc(e.title || TYPE[e.type] || '')}</strong>
          ${e.place || e.rating ? `<span class="meta">${esc(e.place)}${e.rating ? ` ${'★'.repeat(e.rating)}` : ''}</span>` : ''}
          ${e.text ? `<span class="text">${esc(e.text)}</span>` : ''}
          ${e.photos.length ? `<span class="blog-photos">${e.photos.map((p, i) => `<img class="${i === 0 ? 'hero-photo' : ''}" src="${p.thumb}" data-id="${esc(p.id)}" alt="">`).join('')}</span>` : ''}
        </span></div></li>`).join('')}</ol></li>`;
  }).join('');

  $('#blog').innerHTML = `<header class="trip-head blog-head">
      <h1>${esc(trip.name)}</h1><p class="sub">${esc(range)}</p>
      <div class="facts">
        ${first ? `<div><b>${Math.max(1, Math.round(((trip.end && trip.end < today() ? new Date(trip.end + 'T12:00') : new Date()) - new Date(first + 'T12:00')) / 864e5) + 1)}</b><span>Tage</span></div>` : ''}
        <div><b>${nights}</b><span>${nights === 1 ? 'Nacht' : 'Nächte'}</span></div>
        ${dist >= 1 ? `<div><b>${Math.round(dist).toLocaleString('de-DE')} km</b><span>${drive.length ? 'gefahren' : 'Luftlinie'}</span></div>` : ''}
        ${countries.length ? `<div><b>${countries.map(flag).join(' ')}</b><span>${countries.length === 1 ? 'Land' : 'Länder'}</span></div>` : ''}
      </div></header>
    ${stops.length ? '<div id="blogMap" class="blog-map"></div>' : ''}
    ${timeline ? `<ol class="timeline">${timeline}</ol>` : '<p class="hint">Noch keine Einträge. Schaut bald wieder vorbei!</p>'}
    <p class="sub blog-foot">Stand: ${new Date(at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · Karte © OpenStreetMap-Mitwirkende</p>`;

  if (stops.length) drawMap(trip, stops, tracks);
  document.querySelectorAll('.blog-photos img').forEach(img => img.addEventListener('click', () => {
    const v = $('#viewer');
    v.querySelector('img').src = img.src;
    v.querySelector('img').src = `api/?a=blogphoto&t=${token}&id=${encodeURIComponent(img.dataset.id)}`;
    v.showModal();
  }));
  // Große Fotos in voller Auflösung nachladen
  document.querySelectorAll('.blog-photos img.hero-photo').forEach(img => {
    const full = new Image();
    full.onload = () => { img.src = full.src; };
    full.src = `api/?a=blogphoto&t=${token}&id=${encodeURIComponent(img.dataset.id)}`;
  });
}
const today = () => new Date().toISOString().slice(0, 10);

function drawMap(trip, stops, tracks) {
  const map = L.map('blogMap', { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
  const drive = tracks.filter(t => t.kind !== 'hike');
  const lines = drive.length ? drive.map(t => pts(t.pts)) : [stops.map(e => [e.lat, e.lng])];
  lines.forEach(l => L.polyline(l, { color: trip.color, weight: 4 }).addTo(map));
  tracks.filter(t => t.kind === 'hike').forEach(t => L.polyline(pts(t.pts), { color: '#2F8F4E', weight: 3, dashArray: '6 6' }).addTo(map));
  stops.forEach(e => {
    const big = e.type === 'stellplatz';
    L.circleMarker([e.lat, e.lng], { radius: big ? 8 : 5, color: '#fff', weight: 2, fillColor: trip.color, fillOpacity: 1 })
      .bindPopup(`<b>${esc(e.title || TYPE[e.type])}</b><br>${esc(e.place)}<br><small>${day(e.date.slice(0, 10))}</small>`).addTo(map);
  });
  const last = stops[stops.length - 1];
  L.circleMarker([last.lat, last.lng], { radius: 12, color: trip.color, weight: 3, fillOpacity: 0 }).bindPopup('Zuletzt hier').addTo(map);
  map.fitBounds([...lines.flat(), ...stops.map(e => [e.lat, e.lng])], { padding: [30, 30], maxZoom: 12 });
}

$('#viewer').addEventListener('click', () => $('#viewer').close());
load();
