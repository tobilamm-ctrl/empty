// Reiseblog: zeigt eine Reise zum Lesen an, ohne Anmeldung. Der Schlüssel steht hinter dem # in der Adresse,
// der Server liefert nur Strecke und Einträge dieser einen Reise (ohne Kosten und Namen).

import { flagImg } from './flaggen.js';
import { renderBlog, esc, long } from './blogansicht.js';

const $ = s => document.querySelector(s);
const flag = cc => flagImg(cc);
const token = location.hash.slice(1);

async function load() {
  if (/^p[a-f0-9]{32}$/.test(token)) return loadPlaces(token.slice(1));
  if (!/^[a-f0-9]{32}$/.test(token)) return fail('Dieser Link ist unvollständig. Bitte den ganzen Link öffnen.');
  let data;
  try {
    const r = await fetch(`api/?a=blog&t=${token}&d=${device()}`, { credentials: 'omit', cache: 'no-store' });
    data = await r.json();
    if (!r.ok) return fail(data.error || 'Dieser Reiseblog ist nicht verfügbar.');
  } catch { return fail('Keine Verbindung. Bitte später noch einmal versuchen.'); }
  show(data);
}
function fail(msg) { $('#blog').innerHTML = `<section class="empty"><h1>Schade</h1><p>${esc(msg)}</p></section>`; }

// Herzen: eines je Gerät; das Gerät merkt sich, welche Einträge es schon mag, und den Namen (freiwillig)
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privat */ } },
};
const device = () => {
  let d = store.get('blogDevice', '');
  if (!/^[a-f0-9]{32}$/.test(d)) { d = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('blogDevice', d); }
  return d;
};
const likedKey = `blogLiked-${token}`;

// Kommentar schreiben oder löschen (eigenes Gerät)
async function post(body) {
  const r = await fetch('api/?a=blog-comment', { method: 'POST', credentials: 'omit', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ t: token, d: device(), ...body }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Hat gerade nicht geklappt.');
  return j.comments || [];
}
function show(data) {
  const liked = new Set(store.get(likedKey, []));
  document.title = `${data.trip.name} · Reiseblog`;
  document.documentElement.style.setProperty('--trip', data.trip.color);
  renderBlog($('#blog'), data, {
    likesOn: !!data.likesOn, likes: data.likes || {}, liked,
    // Kommentare: Name ist Pflicht und wird auf dem Gerät gemerkt
    commentsOn: !!data.commentsOn, comments: data.comments || {},
    askName: () => store.get('blogName', '') || '',
    comment: async (id, text, name) => {
      if (!name) throw new Error('Bitte deinen Namen angeben.');
      store.set('blogName', name);
      return post({ id, text, name });
    },
    uncomment: (id, del) => post({ id, del }),
    photoUrl: id => `api/?a=blogphoto&t=${token}&id=${encodeURIComponent(id)}`,
    audioUrl: id => `api/?a=blogaudio&t=${token}&id=${encodeURIComponent(id)}`,
    viewPhoto: (src, thumb) => { const v = $('#viewer'); v.querySelector('img').src = thumb; v.querySelector('img').src = src; v.showModal(); },
    // Herz: eines je Gerät; beim ersten Mal freiwillig den Namen dazu
    like: async (id, off) => {
      let name = store.get('blogName', null);
      if (!off && name === null) {
        name = (prompt('Schön, dass es dir gefällt! Magst du deinen Namen dazuschreiben? (freiwillig)', '') || '').trim().slice(0, 40);
        store.set('blogName', name);
      }
      const r = await fetch('api/?a=blog-like', { method: 'POST', credentials: 'omit', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, id, d: device(), name: name || '', off }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const now = new Set(store.get(likedKey, []));
      if (off) now.delete(id); else now.add(id);
      store.set(likedKey, [...now]);
      return j.n;
    },
  });
}

/* ---------- Lieblingsplätze einer Familie (blog.html#p<schlüssel>) ---------- */

async function loadPlaces(t) {
  let data;
  try {
    const r = await fetch(`api/?a=plaetze&t=${t}`, { credentials: 'omit', cache: 'no-store' });
    data = await r.json();
    if (!r.ok) return fail(data.error || 'Diese Liste ist nicht verfügbar.');
  } catch { return fail('Keine Verbindung. Bitte später noch einmal versuchen.'); }
  const ps = data.places || [];
  const title = data.title || 'Lieblingsplätze';
  document.title = `${title} · LAMMping`;
  const nav = p => (/iPhone|iPad|Mac/.test(navigator.userAgent) ? `https://maps.apple.com/?daddr=${p.lat},${p.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`);
  const byCountry = {};
  ps.forEach(p => (byCountry[p.country || ''] ||= []).push(p));
  $('#blog').innerHTML = `<header class="trip-head blog-head"><h1>${esc(title)}</h1>
      <p class="sub">${ps.length} ${ps.length === 1 ? 'Platz' : 'Plätze'}${data.at ? `, Stand ${long(new Date(data.at).toISOString().slice(0, 10))}` : ''}</p></header>
    ${data.note ? `<p class="blog-greeting">${esc(data.note).replace(/\n/g, '<br>')}</p>` : ''}
    ${ps.length ? '<div id="blogMap" class="blog-map"></div>' : ''}
    ${Object.entries(byCountry).map(([cc, list]) => `<h2 class="date-head">${flag(cc)} ${cc ? esc(new Intl.DisplayNames(['de'], { type: 'region' }).of(cc)) : 'Weitere'}</h2>
      <ul class="fav-list">${list.map((p, i) => `<li id="pl${ps.indexOf(p)}"><b>${esc(p.name)}</b>${p.rating ? ` <span class="stars-txt">${'★'.repeat(p.rating)}</span>` : ''}
        <small>${esc([p.kind, p.place].filter(Boolean).join(' · '))}</small>
        ${p.features && p.features.length ? `<small>${esc(p.features.join(', '))}</small>` : ''}
        ${p.note ? `<span class="text">${esc(p.note)}</span>` : ''}
        <a class="link" href="${nav(p)}" target="_blank" rel="noopener">Route dorthin</a></li>`).join('')}</ul>`).join('')}
    <p class="sub blog-foot">Geteilt mit LAMMping · Karte © OpenStreetMap-Mitwirkende</p>`;
  if (!ps.length) return;
  const map = L.map('blogMap', { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
  ps.forEach((p, i) => L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#2E7FB8', fillOpacity: 1 })
    .bindPopup(`<b>${esc(p.name)}</b><br>${p.rating ? '★'.repeat(p.rating) : ''} <a href="#pl${i}" onclick="document.getElementById('pl${i}').scrollIntoView({behavior:'smooth'});return false">Mehr</a>`).addTo(map));
  map.fitBounds(ps.map(p => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 11 });
}

$('#viewer').addEventListener('click', () => $('#viewer').close());
load();
