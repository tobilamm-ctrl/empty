// Reiseblog-Ansicht einer Reise: Kopf mit Zahlen, Karte, Zeitleiste nach Tagen mit Fotos, Sprachnotizen und Herzen.
// Gemeinsam für die öffentliche Blogseite (blog.js) und die Reisen anderer Crews im Tagebuch (mitreisen.js).
// Was je Ort anders ist (Adressen von Fotos und Ton, Herz geben, Foto groß zeigen), kommt über opts herein.

import { flagImg } from './flaggen.js';
import { isNight, splitLegs, legKm, drawSpecialLegs, LEG_STYLE, tripKind, kindInfo } from './reiseweg.js';

export const TYPE = {
  stellplatz: 'Stellplatz', sight: 'Sehenswert', museum: 'Museum', wanderung: 'Wanderung / Radtour', baden: 'Baden',
  restaurant: 'Café / Restaurant', kinder: 'Kinder-Highlight', tank: 'Tankstopp', service: 'Ver- & Entsorgung',
  einkauf: 'Einkauf', pause: 'Pause', faehre: 'Fähre & Maut', werkstatt: 'Werkstatt', waesche: 'Wäsche', notiz: 'Notiz',
  stadtbummel: 'Stadtbummel / Spaziergang', aussicht: 'Aussicht', natur: 'Natur & Tiere', markt: 'Markt',
  fest: 'Fest / Veranstaltung', begegnung: 'Begegnung', fahrt: 'Fahrt',
  unterkunft: 'Unterkunft', huette: 'Berghütte', flug: 'Flug', bahnfahrt: 'Bahnfahrt', hafen: 'Hafen / Landgang', mietwagen: 'Mietwagen', freizeitpark: 'Freizeitpark',
};
const SKIP = ['tank', 'service', 'einkauf', 'werkstatt', 'waesche', 'mietwagen'];   // Unterwegs-Kleinkram nur auf der Karte, nicht in der Zeitleiste

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const day = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
export const long = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const hasPos = e => typeof e.lat === 'number' && typeof e.lng === 'number';
const km = (a, b) => {
  const R = 6371, r = x => x * Math.PI / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const pts = s => (s ? s.split(';').map(p => p.split(',').map(Number)) : []);
const secs = n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const today = () => new Date().toISOString().slice(0, 10);

// root: Element, in das die Reise gezeichnet wird. data wie vom Server ('blog' bzw. 'follow-feed').
// opts: photoUrl(id), audioUrl(id), likesOn, likes {id: n}, liked Set, like(id, off) → Promise<n>, viewPhoto(src, thumb),
//       foot (Text unten), live { lat, lng, at } und liveLabel. Liefert eine Aufräum-Funktion (Karte entfernen, Ton aus).
export function renderBlog(root, data, opts = {}) {
  const { trip, entries, tracks = [], at, highlights = [], greeting = '', showMap = true, delayed = false } = data;
  const likes = opts.likes || {}, liked = opts.liked || new Set();
  root.style.setProperty('--trip', trip.color);
  const es = entries.filter(e => e.date).sort((a, b) => a.date.localeCompare(b.date));
  const stops = es.filter(hasPos);
  const drive = tracks.filter(t => t.kind !== 'hike' && t.kind !== 'plan');
  let dist = 0;
  const legs = splitLegs(stops.map(e => ({ lat: e.lat, lng: e.lng, e })), tripKind(trip));
  if (drive.length) drive.forEach(t => { const p = pts(t.pts); for (let i = 1; i < p.length; i++) dist += km({ lat: p[i - 1][0], lng: p[i - 1][1] }, { lat: p[i][0], lng: p[i][1] }); });
  else legs.filter(l => !['air', 'ship', 'rail'].includes(l.mode)).forEach(l => { dist += legKm(l); });
  const flown = legs.filter(l => l.mode === 'air').reduce((s, l) => s + legKm(l), 0);
  const nights = es.filter(e => isNight(e.type)).length;
  const first = trip.start || (es[0] || {}).date?.slice(0, 10);
  const countries = [...new Set(es.map(e => e.country).filter(Boolean))];
  const range = first ? `${long(first)}${trip.end ? ` bis ${long(trip.end)}` : trip.ended ? '' : ', wir sind noch unterwegs'}` : '';

  const days = {};
  es.filter(e => !SKIP.includes(e.type)).forEach(e => (days[e.date.slice(0, 10)] ||= []).push(e));
  const timeline = Object.entries(days).reverse().map(([d, list]) => {
    const n = first ? Math.round((new Date(d + 'T12:00') - new Date(first + 'T12:00')) / 864e5) + 1 : 0;
    const hl = highlights.filter(h => h.day === d);
    return `<li class="day"><h2><span>${n > 0 ? 'Tag ' + n : day(d)}</span>${n > 0 ? `<small>${day(d)}</small>` : ''}</h2>
      ${hl.length ? `<p class="blog-hl">Highlights des Tages: ${hl.map(h => `${esc(h.emoji)} ${esc(h.text)}`).join(' · ')}</p>` : ''}
      <ol>${list.reverse().map(e => `<li class="stop stop-${e.type}"><div class="blog-stop">
        <span class="node"></span>
        <span class="body">
          <span class="time">${e.date.slice(11, 16)} ${TYPE[e.type] || ''}</span>
          <strong>${esc(e.title || TYPE[e.type] || '')}</strong>
          ${e.place || e.rating ? `<span class="meta">${esc(e.place)}${e.rating ? ` ${'★'.repeat(e.rating)}` : ''}</span>` : ''}
          ${e.text ? `<span class="text">${esc(e.text)}</span>` : ''}
          ${(e.sounds || []).length ? `<span class="blog-sounds">${e.sounds.map(x => `<button type="button" class="blog-snd" data-snd="${esc(x.id)}" aria-label="Sprachnotiz anhören">🎙️ <span>Anhören</span>${x.sec ? ` <small>${secs(x.sec)}</small>` : ''}</button>`).join('')}</span>` : ''}
          ${(e.photos || []).length ? `<span class="blog-photos">${e.photos.map((p, i) => `<img class="${i === 0 ? 'hero-photo' : ''}" src="${p.thumb}" data-id="${esc(p.id)}" alt="">`).join('')}</span>` : ''}
          ${opts.likesOn ? `<button type="button" class="blog-like${liked.has(e.id) ? ' on' : ''}" data-like="${esc(e.id)}" aria-pressed="${liked.has(e.id)}" aria-label="Herz geben">${liked.has(e.id) ? '❤️' : '🤍'} <span>${likes[e.id] || ''}</span></button>` : ''}
        </span></div></li>`).join('')}</ol></li>`;
  }).join('');

  const until = trip.end && trip.end < today() ? new Date(trip.end + 'T12:00') : new Date();
  root.innerHTML = `<header class="trip-head blog-head">
      <h1>${tripKind(trip) !== 'camping' ? `${kindInfo(tripKind(trip))[2]} ` : ''}${esc(trip.name)}</h1><p class="sub">${esc(range)}</p>
      <div class="facts">
        ${first ? (n => `<div><b>${n}</b><span>${n === 1 ? 'Tag' : 'Tage'}</span></div>`)(Math.max(1, Math.round((until - new Date(first + 'T12:00')) / 864e5) + 1)) : ''}
        <div><b>${nights}</b><span>${nights === 1 ? 'Nacht' : 'Nächte'}</span></div>
        ${dist >= 1 ? `<div><b>${Math.round(dist).toLocaleString('de-DE')} km</b><span>${drive.length ? 'gefahren' : 'Luftlinie'}</span></div>` : ''}
        ${flown >= 1 ? `<div><b>${Math.round(flown).toLocaleString('de-DE')} km</b><span>geflogen</span></div>` : ''}
        ${countries.length ? `<div><b>${countries.map(flagImg).join(' ')}</b><span>${countries.length === 1 ? 'Land' : 'Länder'}</span></div>` : ''}
      </div></header>
    ${greeting ? `<p class="blog-greeting">${esc(greeting).replace(/\n/g, '<br>')}</p>` : ''}
    ${delayed && !trip.ended ? '<p class="sub">Neue Einträge erscheinen hier jeweils am nächsten Tag.</p>' : ''}
    ${showMap && (stops.length || opts.live) ? '<div class="blog-map"></div>' : ''}
    ${timeline ? `<ol class="timeline">${timeline}</ol>` : '<p class="hint">Noch keine Einträge. Schaut bald wieder vorbei!</p>'}
    <p class="sub blog-foot">${opts.foot || (at ? `Stand: ${new Date(at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · ` : '')}Karte © OpenStreetMap-Mitwirkende</p>`;

  let map = null;
  const box = root.querySelector('.blog-map');
  if (box && typeof L !== 'undefined') map = drawMap(box, trip, stops, tracks, opts.live, opts.liveLabel);
  const photo = id => (opts.photoUrl ? opts.photoUrl(id) : '');
  root.querySelectorAll('.blog-photos img').forEach(img => img.addEventListener('click', () => {
    // In der App: Vollbild mit Wischen durch alle Fotos der Reise
    if (opts.viewPhotos) {
      const all = [...root.querySelectorAll('.blog-photos img')];
      const list = all.map(i => ({ id: i.dataset.id, thumb: i.src, src: photo(i.dataset.id), cap: i.closest('.body')?.querySelector('strong')?.textContent || '' }));
      return opts.viewPhotos(list, all.indexOf(img));
    }
    if (opts.viewPhoto) opts.viewPhoto(photo(img.dataset.id), img.src);
    else { img.src = photo(img.dataset.id); img.classList.toggle('big'); }
  }));
  // Sprachnotizen: antippen spielt ab, nochmal antippen hält an
  let player = null, playBtn = null;
  const stopSnd = () => { if (player) player.pause(); player = null; if (playBtn) playBtn.classList.remove('on'); playBtn = null; };
  root.querySelectorAll('.blog-snd').forEach(b => b.addEventListener('click', () => {
    if (playBtn === b) return stopSnd();
    stopSnd();
    playBtn = b; b.classList.add('on');
    player = new Audio(opts.audioUrl ? opts.audioUrl(b.dataset.snd) : '');
    player.onended = stopSnd;
    player.onerror = () => { stopSnd(); (opts.notify || alert)('Die Sprachnotiz lässt sich gerade nicht abspielen.'); };
    player.play().catch(() => {});
  }));
  // Herzen
  root.querySelectorAll('.blog-like').forEach(b => b.addEventListener('click', async () => {
    if (!opts.like) return;
    const id = b.dataset.like, off = liked.has(id);
    b.disabled = true;
    try {
      const n = await opts.like(id, off);
      if (off) liked.delete(id); else liked.add(id);
      b.classList.toggle('on', !off); b.setAttribute('aria-pressed', String(!off));
      b.innerHTML = `${off ? '🤍' : '❤️'} <span>${n || ''}</span>`;
      if (!off && navigator.vibrate) navigator.vibrate(10);
    } catch (e) { (opts.notify || alert)(e.message || 'Hat gerade nicht geklappt. Bitte später noch einmal.'); }
    b.disabled = false;
  }));
  // Große Fotos in voller Auflösung nachladen
  root.querySelectorAll('.blog-photos img.hero-photo').forEach(img => {
    const src = photo(img.dataset.id);
    if (!src) return;
    const full = new Image();
    full.onload = () => { img.src = full.src; };
    full.src = src;
  });
  return () => { stopSnd(); if (map) { try { map.remove(); } catch { /* schon weg */ } } };
}

function drawMap(box, trip, stops, tracks, live, liveLabel) {
  const map = L.map(box, { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
  const drive = tracks.filter(t => t.kind !== 'hike' && t.kind !== 'plan');
  // Abschnitte: Flug als Bogen, Schiff und Bahn gestrichelt, dazwischen die Straße in Reisefarbe
  const legs = splitLegs(stops.map(e => ({ lat: e.lat, lng: e.lng, e })), tripKind(trip));
  const road = legs.filter(l => !['air', 'ship', 'rail'].includes(l.mode));
  const lines = drive.length ? drive.map(t => pts(t.pts)) : road.map(l => l.pts);
  if (drive.length) lines.forEach(l => L.polyline(l, { color: trip.color, weight: 4 }).addTo(map));
  else road.forEach(l => L.polyline(l.pts, LEG_STYLE[l.mode] || { color: trip.color, weight: 4 }).addTo(map));
  lines.push(drawSpecialLegs(L, map, legs));
  tracks.filter(t => t.kind === 'hike').forEach(t => L.polyline(pts(t.pts), { color: '#2F8F4E', weight: 3, dashArray: '6 6' }).addTo(map));
  stops.forEach(e => {
    const big = isNight(e.type);
    L.circleMarker([e.lat, e.lng], { radius: big ? 8 : 5, color: '#fff', weight: 2, fillColor: trip.color, fillOpacity: 1 })
      .bindPopup(`<b>${esc(e.title || TYPE[e.type])}</b><br>${esc(e.place)}<br><small>${day(e.date.slice(0, 10))}</small>`).addTo(map);
  });
  const last = live ? [live.lat, live.lng] : stops.length ? [stops[stops.length - 1].lat, stops[stops.length - 1].lng] : null;
  if (last) L.circleMarker(last, { radius: 12, color: trip.color, weight: 3, fillOpacity: 0 }).bindPopup(live ? (liveLabel || 'Standort') : 'Zuletzt hier').addTo(map);
  const all = [...lines.flat(), ...stops.map(e => [e.lat, e.lng]), ...(last ? [last] : [])];
  if (all.length > 1) map.fitBounds(all, { padding: [30, 30], maxZoom: 12 });
  else if (all.length) map.setView(all[0], 11);
  return map;
}
