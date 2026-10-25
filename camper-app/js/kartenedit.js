// Karte bearbeiten: nachträglich Orte einfügen, Stopps verschieben, Strecke zeichnen oder korrigieren.
// Zwei Modi (ui.mapEdit): 'orte' und 'strecke'. Lange drücken auf die Karte fügt auch ohne Modus etwas ein.

const OSRM = 'https://router.project-osrm.org/route/v1/driving/';

export default function installMapEdit(app) {
  const {
    S, ui, ACTIONS, mapHooks, mapClickHooks, esc, icon, newId, save, remove, toast, render, openSheet,
    currentTrip, tripColor, tripEntries, byDate, hasPos, km, fmtKm, openEntryForm, setFormPos, TYPES, nowLocal,
  } = app;

  // Zustand der Strecken-Bearbeitung
  const ed = { trackId: null, name: '', wps: [], routed: true, history: [], dirty: false };
  const segs = new Map();           // berechnete Straßenabschnitte, Schlüssel "lat,lng|lat,lng"
  let routeWarned = false;

  const bar = document.getElementById('mapEditBar');
  const sheetHead = app.sheetHead;
  const pos = ll => `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
  const dist = (a, b) => km({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });

  /* ---------- Ein- und Ausschalten ---------- */

  function leaveTrack() {
    if (ed.dirty && !confirm('Die Änderungen an der Strecke verwerfen?')) return false;
    ed.trackId = null; ed.wps = []; ed.history = []; ed.dirty = false;
    app.editingTrackId = null;
    return true;
  }

  ACTIONS['map-edit'] = () => {
    if (!currentTrip()) return toast('Legt zuerst eine Reise an.');
    ui.mapScope = 'trip';
    ui.mapEdit = 'orte';
    render();
  };
  ACTIONS['map-edit-mode'] = el => {
    if (el.dataset.mode === ui.mapEdit) return;
    if (ui.mapEdit === 'strecke' && !leaveTrack()) return;
    ui.mapEdit = el.dataset.mode;
    if (ui.mapEdit === 'strecke') startTrack(trackOfTrip());
    render();
  };
  ACTIONS['map-edit-done'] = () => {
    if (ui.mapEdit === 'strecke' && !leaveTrack()) return;
    ui.mapEdit = null;
    render();
  };

  /* ---------- Orte einfügen ---------- */

  // Zeitpunkt so wählen, dass der neue Ort in der Route zwischen den nächstgelegenen Stopps landet
  const toMs = d => new Date(d).getTime();
  const pad = n => String(n).padStart(2, '0');
  const fromMs = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function guessDate(ll) {
    const t = currentTrip();
    const stops = tripEntries(t).filter(hasPos).sort(byDate);
    if (!stops.length) return t.start ? t.start + 'T12:00' : nowLocal();
    const p = [ll.lat, ll.lng];
    let i = 0;
    stops.forEach((s, k) => { if (dist(p, [s.lat, s.lng]) < dist(p, [stops[i].lat, stops[i].lng])) i = k; });
    const nb = [stops[i - 1], stops[i + 1]].filter(Boolean)
      .sort((a, b) => dist(p, [a.lat, a.lng]) - dist(p, [b.lat, b.lng]))[0];
    if (!nb) return stops[i].date;
    return fromMs((toMs(stops[i].date) + toMs(nb.date)) / 2);
  }

  function insertMenu(ll) {
    const t = currentTrip();
    const types = Object.entries(TYPES).filter(([k]) => k !== 'notiz');
    openSheet(`<div>${sheetHead('Hier einfügen')}
      <p class="sub">${pos(ll)}, wird zeitlich zwischen die nächsten Stopps von „${esc(t.name)}“ gelegt.</p>
      <div class="here-grid">
        ${types.map(([k, v]) => `<button data-action="insert-at" data-type="${k}" data-lat="${ll.lat}" data-lng="${ll.lng}">${icon(k)}<b>${v.label}</b><small>${v.hint}</small></button>`).join('')}
        <button data-action="insert-at" data-type="notiz" data-lat="${ll.lat}" data-lng="${ll.lng}">${icon('notiz')}<b>Notiz</b><small>Mit diesem Ort</small></button>
        <button data-action="insert-plan" data-lat="${ll.lat}" data-lng="${ll.lng}">${icon('pin')}<b>Vormerken</b><small>Für die Planung dieser Reise</small></button>
      </div></div>`);
  }

  ACTIONS['insert-at'] = el => {
    const at = { lat: +el.dataset.lat, lng: +el.dataset.lng };
    openEntryForm({ type: el.dataset.type, date: guessDate(at) }, { at });
  };
  ACTIONS['insert-plan'] = el => {
    const at = { lat: +el.dataset.lat, lng: +el.dataset.lng };
    ACTIONS['place-form']({ dataset: { trip: currentTrip().id, kind: 'stellplatz' } });
    const form = document.querySelector('form[data-form=place]');
    if (form) setFormPos(form, at, true);
  };

  /* ---------- Strecke zeichnen und korrigieren ---------- */

  const tripTracks = () => S.tracks.filter(x => x.tripId === currentTrip().id && x.kind !== 'hike').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const trackOfTrip = () => (tripTracks().find(x => x.id === ed.lastId) || tripTracks()[0] || null);

  function startTrack(tr) {
    ed.trackId = tr ? tr.id : null;
    ed.lastId = ed.trackId;
    ed.name = tr ? tr.name : 'Gezeichnete Strecke';
    if (tr && tr.wps) {
      ed.wps = app.decodePts(tr.wps);
      ed.routed = tr.routed !== false;
    } else if (tr) {
      // Importierte GPX-Strecke: zum Bearbeiten auf handliche Stützpunkte vereinfachen
      ed.wps = app.simplifyTo(app.decodePts(tr.pts), 150);
      ed.routed = false;
    } else {
      ed.wps = [];
      ed.routed = true;
    }
    ed.history = [];
    ed.dirty = false;
    app.editingTrackId = ed.trackId;
  }

  function change(fn) {
    ed.history.push(ed.wps.map(p => p.slice()));
    if (ed.history.length > 60) ed.history.shift();
    fn();
    ed.dirty = true;
    render();
  }

  const segKey = (a, b) => `${a[0].toFixed(5)},${a[1].toFixed(5)}|${b[0].toFixed(5)},${b[1].toFixed(5)}`;
  const pending = new Set();
  async function fetchSeg(a, b) {
    const key = segKey(a, b);
    if (segs.has(key) || pending.has(key)) return;
    pending.add(key);
    try {
      const r = await fetch(`${OSRM}${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`);
      const j = await r.json();
      if (j.code !== 'Ok') throw new Error(j.code);
      segs.set(key, { pts: j.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]), km: j.routes[0].distance / 1000 });
    } catch {
      segs.set(key, { pts: [a, b], km: dist(a, b), straight: true });
      if (!routeWarned) { routeWarned = true; toast('Die Straßenführung ist gerade nicht erreichbar, die Abschnitte bleiben gerade.'); }
    } finally {
      pending.delete(key);
      render();
    }
  }

  // Linie aus den Stützpunkten: entlang der Straßen oder gerade
  function geometry() {
    const w = ed.wps;
    if (w.length < 2) return { pts: w.slice(), km: 0, waiting: false };
    if (!ed.routed) {
      let d = 0;
      for (let i = 1; i < w.length; i++) d += dist(w[i - 1], w[i]);
      return { pts: w.slice(), km: d, waiting: false };
    }
    let pts = [], d = 0, waiting = false;
    for (let i = 1; i < w.length; i++) {
      const seg = segs.get(segKey(w[i - 1], w[i]));
      if (!seg) { waiting = true; fetchSeg(w[i - 1], w[i]); pts.push(w[i - 1], w[i]); d += dist(w[i - 1], w[i]); continue; }
      pts = pts.concat(i > 1 ? seg.pts.slice(1) : seg.pts);
      d += seg.km;
    }
    return { pts, km: d, waiting };
  }

  ACTIONS['track-undo'] = () => {
    if (!ed.history.length) return;
    ed.wps = ed.history.pop();
    ed.dirty = true;
    render();
  };
  ACTIONS['track-routed'] = () => { ed.routed = !ed.routed; ed.dirty = true; render(); };
  ACTIONS['track-pick'] = el => {
    if (!leaveTrack()) return;
    startTrack(S.tracks.find(x => x.id === el.dataset.id) || null);
    render();
  };
  ACTIONS['track-save'] = () => {
    if (ed.wps.length < 2) return toast('Setzt mindestens zwei Punkte.');
    const g = geometry();
    if (g.waiting) return toast('Die Straßenführung wird noch berechnet, gleich noch einmal.');
    const old = S.tracks.find(x => x.id === ed.trackId);
    const t = currentTrip();
    const doc = save('tracks', {
      ...(old || { id: newId(), tripId: t.id, createdAt: Date.now() }),
      name: ed.name || 'Gezeichnete Strecke', routed: ed.routed,
      wps: app.encodePts(ed.wps), pts: app.encodePts(g.pts), km: Math.round(g.km * 10) / 10,
    });
    ed.trackId = doc.id; ed.lastId = doc.id; ed.dirty = false; ed.history = [];
    app.editingTrackId = doc.id;
    toast(`Strecke gespeichert: ${fmtKm(g.km)}`);
    render();
  };
  ACTIONS['track-delete'] = () => {
    if (ed.trackId) {
      if (!confirm('Diese Strecke löschen?')) return;
      remove('tracks', ed.trackId);
    }
    ed.dirty = false;
    leaveTrack();
    startTrack(null);
    render();
  };

  /* ---------- Karte: Klicks ---------- */

  mapClickHooks.push((ll, type) => {
    if (ui.route !== 'karte') return false;
    if (ui.mapEdit === 'strecke') {
      change(() => ed.wps.push([ll.lat, ll.lng]));
      return true;
    }
    // Im Orte-Modus genügt ein Tippen, sonst lange drücken
    if (ui.mapEdit === 'orte' || type === 'contextmenu') {
      if (!currentTrip()) return false;
      insertMenu(ll);
      return true;
    }
    return false;
  });

  /* ---------- Zeichnen: Leiste und Strecken-Editor ---------- */

  const handle = (cls, size) => window.L.divIcon({ className: '', html: `<div class="${cls}"></div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

  mapHooks.push((layer, scope, t) => {
    const L = window.L;
    document.getElementById('mapview').classList.toggle('editing', !!ui.mapEdit);
    bar.hidden = !ui.mapEdit;
    if (!ui.mapEdit || !t) return [];

    if (ui.mapEdit === 'orte') {
      bar.innerHTML = `${barHead()}
        <p class="edit-hint">Auf die Karte tippen fügt einen Ort ein, Stopps lassen sich ziehen.</p>`;
      return [];
    }

    const g = geometry();
    const color = tripColor(t);
    if (g.pts.length > 1) {
      L.polyline(g.pts, { color: '#fff', weight: 9, opacity: 0.9 }).addTo(layer);
      L.polyline(g.pts, { color, weight: 5, dashArray: g.waiting ? '6 8' : null }).addTo(layer);
    }
    ed.wps.forEach((p, i) => {
      const m = L.marker(p, { icon: handle('vertex' + (i === 0 ? ' first' : i === ed.wps.length - 1 ? ' last' : ''), 18), draggable: true, zIndexOffset: 1000 }).addTo(layer);
      m.on('dragend', () => { const ll = m.getLatLng(); change(() => { ed.wps[i] = [ll.lat, ll.lng]; }); });
      m.on('click', () => change(() => ed.wps.splice(i, 1)));
      if (i > 0) {
        const a = ed.wps[i - 1];
        const mid = L.marker([(a[0] + p[0]) / 2, (a[1] + p[1]) / 2], { icon: handle('midpoint', 14), zIndexOffset: 900 }).addTo(layer);
        mid.on('click', () => change(() => ed.wps.splice(i, 0, [(a[0] + p[0]) / 2, (a[1] + p[1]) / 2])));
      }
    });
    const tracks = tripTracks();
    bar.innerHTML = `${barHead()}
      ${tracks.length ? `<div class="chips">${tracks.map((x, n) => `<button class="chip${x.id === ed.trackId ? ' on' : ''}" data-action="track-pick" data-id="${x.id}">${esc(x.name || 'Strecke ' + (n + 1))}</button>`).join('')}
        <button class="chip add${ed.trackId ? '' : ' on'}" data-action="track-pick" data-id="">${icon('plus')}Neue Strecke</button></div>` : ''}
      <p class="edit-hint">${ed.wps.length
        ? 'Tippen hängt an, ziehen verschiebt, Punkt antippen löscht, ○ fügt ein.'
        : 'Tippt nacheinander auf die Orte, durch die ihr gefahren seid.'}</p>
      <div class="edit-actions">
        <label class="check small"><input type="checkbox" data-action="track-routed"${ed.routed ? ' checked' : ''}><span>Straßen folgen</span></label>
        <span class="edit-km">${g.km ? fmtKm(g.km) : ''}${g.waiting ? ' …' : ''}</span>
        <button class="icon-btn small" data-action="track-undo" aria-label="Rückgängig"${ed.history.length ? '' : ' disabled'}>${icon('undo')}</button>
        ${ed.trackId || ed.wps.length ? `<button class="icon-btn small danger" data-action="track-delete" aria-label="${ed.trackId ? 'Strecke löschen' : 'Verwerfen'}">${icon('trash')}</button>` : ''}
        <button class="primary small-btn" data-action="track-save"${ed.dirty ? '' : ' disabled'}>Speichern</button>
      </div>`;
    return [];
  });

  function barHead() {
    return `<div class="edit-head">
      <div class="seg">${[['orte', 'Orte'], ['strecke', 'Strecke']].map(([k, l]) =>
        `<button class="${ui.mapEdit === k ? 'on' : ''}" data-action="map-edit-mode" data-mode="${k}">${l}</button>`).join('')}</div>
      <button class="primary small-btn" data-action="map-edit-done">Fertig</button>
    </div>`;
  }

  // „Straßen folgen“ ist eine Checkbox: Klick-Aktionen ignorieren Eingabefelder, daher über change
  document.addEventListener('change', ev => {
    if (ev.target.dataset && ev.target.dataset.action === 'track-routed') ACTIONS['track-routed']();
  });
}
