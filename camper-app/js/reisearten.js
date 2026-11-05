// Reisearten (Praxistest P11): Camping, Zelten, Motorrad, Auto + Unterkunft, Flug, Kreuzfahrt, Bahn, Rad, Wandern, Segeln.
// Die Art steht im Reise-Formular (app.js). Hier: Vorschlag, unpassende Bereiche für die Reise auszublenden; Startort
// („Von“) von Flug, Bahnfahrt und Fähre suchen; Statistik je Reiseart und Verkehrsmittel.

import { LEG_NAME, LEG_EMOJI } from './reiseweg.js';

export default function installReisearten(app) {
  const { S, ACTIONS, FORMS, VIEWS, esc, save, toast, openSheet, closeSheet, render, currentTrip, tripEntries, tripStats, fmtKm, TYPES } = app;
  const sheetHead = app.sheetHead;

  /* ---------- Bereiche je Reiseart (nur als Vorschlag) ---------- */

  // Wo der Bereich passt (Tabelle aus dem Praxistest): sonst wird Ausblenden vorgeschlagen
  const FIT = {
    tank: ['camping', 'zelten', 'motorrad', 'auto', 'segeln', 'gemischt'],
    zuladung: ['camping', 'motorrad', 'gemischt'],
    autarkie: ['camping', 'segeln', 'gemischt'],
    stellplatzsuche: ['camping', 'zelten', 'motorrad', 'rad', 'wandern', 'gemischt'],
    wasserwaage: ['camping', 'gemischt'],
    fahrzeug: ['camping', 'zelten', 'motorrad', 'auto', 'segeln', 'gemischt'],
  };
  const NAMES = { tank: 'Tankbuch', zuladung: 'Zuladung', autarkie: 'Autarkie (Wasser, Gas, Strom)', stellplatzsuche: 'Stellplatz- und Campingplatz-Suche', wasserwaage: 'Wasserwaage', fahrzeug: 'Fahrzeug und Checklisten' };
  // Schon benutzt? Dann bleibt der Bereich sichtbar
  const used = (t, k) => (k === 'tank' ? S.fuel.some(f => f.tripId === t.id) : false);
  // Ausgeblendet für die gewählte Reise (Mehr-Seite, Leiste, In der Nähe). Checklisten gehören zum Fahrzeug.
  app.tripHides = route => {
    let t = null;
    try { t = currentTrip(); } catch { return false; }
    const h = (t && t.hideAreas) || [];
    if (route === 'checklisten') route = 'fahrzeug';
    return h.includes(route) && !used(t, route);
  };
  function suggest(t) {
    const kind = app.tripKind(t);
    const cand = Object.keys(FIT).filter(k => !FIT[k].includes(kind) && !used(t, k));
    const now = t.hideAreas || [];
    // Nichts vorzuschlagen, oder schon genau so eingestellt
    if (!cand.length && !now.length) return;
    if (cand.length && cand.every(k => now.includes(k)) && now.every(k => cand.includes(k))) return;
    const [, label, ic] = app.kindInfo(kind);
    openSheet(`<form data-form="trip-hide" data-id="${t.id}">${sheetHead(`${ic} ${esc(label)}`)}
      ${cand.length ? `<p>Für ${esc(label === 'Gemischt' ? 'diese Reise' : label)} werden diese Bereiche meist nicht gebraucht. Für diese Reise ausblenden?</p>
        ${cand.map(k => `<label class="check"><input type="checkbox" name="h" value="${k}" checked><span>${NAMES[k]}</span></label>`).join('')}`
        : '<p>Für diese Reiseart passen alle Bereiche wieder. Ausgeblendete Bereiche wieder zeigen?</p>'}
      <p class="sub">Es wird nichts gelöscht. Ändern lässt sich das jederzeit über „Reise bearbeiten“ (Art der Reise).</p>
      <div class="sheet-foot"><button type="button" class="ghost" data-action="close">${cand.length ? 'Nein, alles zeigen' : 'So lassen'}</button>
        <button class="primary">${cand.length ? 'Ausblenden' : 'Alle zeigen'}</button></div></form>`);
  }
  FORMS['trip-hide'] = form => {
    const t = S.trips.find(x => x.id === form.dataset.id);
    if (!t) return closeSheet();
    const hide = [...form.querySelectorAll('[name=h]:checked')].map(c => c.value);
    save('trips', { ...t, hideAreas: hide });
    closeSheet();
    toast(hide.length ? `${hide.length} ${hide.length === 1 ? 'Bereich' : 'Bereiche'} für diese Reise ausgeblendet` : 'Alle Bereiche sichtbar');
    render();
  };
  const tripSaved = app.tripSaved;
  app.tripSaved = (t, old, form) => {
    if (tripSaved) tripSaved(t, old, form);
    if (app.tripKind(t) !== app.tripKind(old) || (!old && app.tripKind(t) !== 'camping')) setTimeout(() => suggest(S.trips.find(x => x.id === t.id) || t), old ? 300 : 900);
  };

  /* ---------- Startort von Flug, Bahnfahrt, Fähre ---------- */

  // „Von“ ist ein Text; den Ort dazu sucht LAMMping im Hintergrund (OpenStreetMap), damit die Karte den Abschnitt zeichnet
  const hasFrom = type => (TYPES[type].extras || []).some(f => f.key === 'from');
  const search = async q => {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=de&q=${encodeURIComponent(q)}`);
    const j = await r.json();
    return j[0] ? { lat: +(+j[0].lat).toFixed(5), lng: +(+j[0].lon).toFixed(5), cc: ((j[0].address || {}).country_code || '').toUpperCase() } : null;
  };
  async function findFrom(id, text, place) {
    try {
      const a = text ? await search(text) : null;
      // Ziel ohne Standort (z. B. aus einem Ticket): den Ort ebenfalls suchen
      const b = place ? await search(place) : null;
      const cur = S.entries.find(x => x.id === id);
      if (!cur) return;
      const patch = {};
      if (a && (cur.extra || {}).from === text) patch.extra = { ...cur.extra, fromLat: a.lat, fromLng: a.lng };
      if (b && !app.hasPos(cur) && cur.place === place) Object.assign(patch, { lat: b.lat, lng: b.lng });
      if (Object.keys(patch).length) save('entries', { ...cur, ...patch });
    } catch { /* offline: beim nächsten Speichern */ }
  }
  const entrySave = app.entrySave;
  app.entrySave = (e, form) => {
    if (entrySave) entrySave(e, form);
    if (!hasFrom(e.type)) return;
    const x = e.extra || {}, old = S.entries.find(y => y.id === e.id), ox = (old && old.extra) || {};
    let from = x.from || '';
    if (from && ox.from === from && typeof ox.fromLat === 'number') { x.fromLat = ox.fromLat; x.fromLng = ox.fromLng; from = ''; }
    const place = !app.hasPos(e) && e.place ? e.place : '';
    if ((from || place) && navigator.onLine) setTimeout(() => findFrom(e.id, from, place), 50);
  };
  // Fähre: von–nach wie beim Flug
  if (TYPES.faehre && !(TYPES.faehre.extras || []).some(f => f.key === 'from')) {
    TYPES.faehre.extras = [...(TYPES.faehre.extras || []), { key: 'from', label: 'Von (Hafen)', text: true, ph: 'z. B. Kiel' }];
  }

  /* ---------- Statistik: Reisearten, Übernachtungen, Verkehrsmittel ---------- */

  const statistik = VIEWS.statistik;
  VIEWS.statistik = () => {
    const base = statistik();
    const t = currentTrip();
    const kinds = {};
    S.trips.forEach(x => { const k = app.tripKind(x); kinds[k] = (kinds[k] || 0) + 1; });
    const kindRow = Object.keys(kinds).length > 1 || !kinds.camping
      ? `<p class="kind-stats">${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [, l, ic] = app.kindInfo(k); return `<span>${ic} ${n} × ${esc(l)}</span>`; }).join('')}</p>` : '';
    let tripRow = '';
    if (t) {
      const st = tripStats(t);
      const nights = {};
      tripEntries(t).filter(e => app.isNight(e.type)).forEach(e => { nights[e.type] = (nights[e.type] || 0) + 1; });
      const modes = Object.entries(st.byMode || {}).filter(([, d]) => d >= 1).sort((a, b) => b[1] - a[1]);
      const nightTxt = Object.entries(nights).map(([k, n]) => `${n} × ${esc(TYPES[k].label)}`).join(' · ');
      if (modes.length > 1 || Object.keys(nights).length > 1 || app.tripKind(t) !== 'camping') {
        tripRow = `<h3 class="date-head">${esc(t.name)}: unterwegs mit</h3>
          <dl class="facts-list">${modes.map(([m, d]) => `<div><dt>${LEG_EMOJI[m]} ${LEG_NAME[m]}</dt><dd>${fmtKm(d)}${m === 'air' ? ' (Luftlinie)' : ''}</dd></div>`).join('')}
          ${nightTxt ? `<div><dt>Übernachtungen</dt><dd>${nightTxt}</dd></div>` : ''}</dl>`;
      }
    }
    if (!kindRow && !tripRow) return base;
    return `${base}<section class="panel kind-panel"><h2>Reisearten</h2>${kindRow}${tripRow}</section>`;
  };

  // Für Reiseblog und Freunde: die Art der Reise am Namen
  app.kindBadge = t => { const k = app.tripKind(t); return k === 'camping' ? '' : `<span class="kind-badge" title="${esc(app.kindInfo(k)[1])}">${app.kindInfo(k)[2]}</span>`; };
}
