// Strecken: (1) „Der Straße folgen“ – aus den Stopps einer Reise nachträglich die Strecke entlang der Straßen berechnen,
// (2) Wanderungen aus den Standorten der Fotos als Punkte und Weg zeigen, (3) Fahrt oder Wanderung live aufzeichnen,
// solange die App offen ist.

const OSRM = 'https://router.project-osrm.org/route/v1/driving/';

export default function installStrecken(app) {
  const { S, LS, ACTIONS, CHANGES, esc, icon, newId, save, remove, toast, render, openSheet, closeSheet, currentTrip, tripEntries, hasPos, byDate, km, fmtKm, fmtDay } = app;
  const sheetHead = app.sheetHead;
  const enc = pts => app.encodePts(pts), dec = s => app.decodePts(s);
  const dist = (a, b) => km({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });
  const tripById = id => S.trips.find(t => t.id === id);

  /* ====================================================================== */
  /* 1. Der Straße folgen                                                    */
  /* ====================================================================== */

  // Stopps in zeitlicher Reihenfolge, dicht beieinanderliegende (300 m) zusammengefasst
  function waypoints(t) {
    const out = [];
    tripEntries(t).filter(hasPos).sort(byDate).forEach(e => {
      const p = [e.lat, e.lng];
      if (!out.length || dist(out[out.length - 1], p) > 0.3) out.push(p);
    });
    return out;
  }
  async function routeThrough(wps, onStep) {
    let pts = [], total = 0, straight = 0;
    // Höchstens 25 Punkte je Anfrage, die Abschnitte überlappen um einen Punkt
    for (let i = 0; i < wps.length - 1; i += 24) {
      const part = wps.slice(i, i + 25);
      onStep(i, wps.length);
      let seg = null;
      try {
        const r = await fetch(`${OSRM}${part.map(p => `${p[1]},${p[0]}`).join(';')}?overview=full&geometries=geojson`);
        const j = await r.json();
        if (j.code === 'Ok') seg = { pts: j.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]), km: j.routes[0].distance / 1000 };
      } catch { /* dann gerade */ }
      if (!seg) {
        let d = 0;
        for (let k = 1; k < part.length; k++) d += dist(part[k - 1], part[k]);
        seg = { pts: part, km: d };
        straight++;
      }
      pts = pts.concat(pts.length ? seg.pts.slice(1) : seg.pts);
      total += seg.km;
    }
    return { pts, km: total, straight };
  }
  const driveTracks = t => S.tracks.filter(x => x.tripId === t.id && x.kind !== 'hike');

  app.tripTools.push((t, st) => (st.stops.length > 1 ? { order: 5, action: 'route-roads', icon: 'route', label: 'Straße folgen', title: 'Der Straße folgen', desc: 'Strecke zwischen den Stopps entlang der Straßen berechnen', later: !!t.ended || !!t.archived } : null));
  ACTIONS['route-roads'] = el => {
    const t = tripById(el.dataset.id) || currentTrip();
    if (!t) return;
    const wps = waypoints(t);
    if (wps.length < 2) return toast('Dafür braucht die Reise mindestens zwei Stopps mit Ort.');
    const own = driveTracks(t).filter(x => x.auto !== 'roads');
    openSheet(`<div>${sheetHead('Der Straße folgen')}
      <p>LAMMping berechnet die Strecke zwischen den ${wps.length} Stopps von „${esc(t.name)}“ entlang der Straßen (OpenStreetMap). Statt gerader Linien zeigt die Karte dann die wahrscheinlich gefahrene Strecke, und die Kilometer werden genauer.</p>
      ${own.length ? `<p class="hint">Es gibt schon ${own.length === 1 ? 'eine Strecke' : `${own.length} Strecken`} (GPX, gezeichnet oder aufgezeichnet). Sie ${own.length === 1 ? 'bleibt' : 'bleiben'} erhalten; die berechnete Strecke kommt dazu.</p>` : ''}
      <p class="sub">Umwege, Fähren oder Abstecher ohne Eintrag kennt LAMMping nicht. Korrigieren lässt sich die Strecke über den Stift auf der Karte („Strecke“). Kommen später Stopps dazu, einfach noch einmal berechnen.</p>
      <div class="sheet-foot"><button type="button" class="ghost" data-action="close">Abbrechen</button>
        <button type="button" class="primary" data-action="route-roads-go" data-id="${t.id}">${icon('route')}Strecke berechnen</button></div></div>`);
  };
  ACTIONS['route-roads-go'] = async el => {
    const t = tripById(el.dataset.id);
    if (!t) return;
    if (!navigator.onLine) return toast('Dafür braucht es eine Internetverbindung.');
    const wps = waypoints(t);
    el.disabled = true;
    const res = await routeThrough(wps, (i, n) => { el.textContent = `Wird berechnet … ${Math.round(i / n * 100)} %`; });
    const old = driveTracks(t).find(x => x.auto === 'roads');
    // Gespeichert wird eine vereinfachte Linie (höchstens 4000 Punkte), damit der Abgleich klein bleibt
    save('tracks', {
      ...(old || { id: newId(), tripId: t.id, createdAt: Date.now() }),
      kind: 'drive', auto: 'roads', name: 'Entlang der Straßen', routed: true,
      wps: enc(app.simplifyTo(wps, 150)), pts: enc(app.simplifyTo(res.pts, 4000)), km: Math.round(res.km * 10) / 10,
    });
    closeSheet();
    toast(res.straight ? `Strecke berechnet: ${fmtKm(res.km)}. Ein Teil war nicht erreichbar und bleibt gerade.` : `Strecke berechnet: ${fmtKm(res.km)}`);
    render();
  };

  /* ====================================================================== */
  /* 2. Wanderungen: Weg aus den Standorten der Fotos                        */
  /* ====================================================================== */

  // Punkte einer Wanderung: Standorte der Fotos plus nachgetragene Wegpunkte, nach Aufnahmezeit
  const hikePts = e => [...(e.photos || []).filter(p => typeof p.lat === 'number').map(p => ({ lat: p.lat, lng: p.lng, at: p.at || '', thumb: p.thumb })),
    ...(e.path || []).map(([lat, lng, at]) => ({ lat, lng, at: at || '' }))].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
  app.hikePts = hikePts;
  app.mapHooks.push((layer, scope, t) => {
    const L = window.L;
    const list = scope === 'all' ? S.entries : S.entries.filter(e => t && e.tripId === t.id);
    list.filter(e => e.type === 'wanderung').forEach(e => {
      if (S.tracks.some(x => x.kind === 'hike' && x.entryId === e.id)) return;   // eigene Strecke vorhanden
      const pts = hikePts(e);
      if (!pts.length) return;
      if (pts.length > 1) L.polyline(pts.map(p => [p.lat, p.lng]), { color: '#3E7B32', weight: 3, dashArray: '2 7', lineCap: 'round', opacity: 0.9 }).addTo(layer);
      pts.forEach(p => L.circleMarker([p.lat, p.lng], { radius: 5, color: '#fff', weight: 2, fillColor: '#3E7B32', fillOpacity: 1 })
        .bindPopup(`<div class="popup"><strong>${esc(e.title || 'Wanderung')}</strong>${p.thumb ? `<img src="${p.thumb}" alt="" class="popup-photo">` : ''}
          ${p.at ? `<span>${fmtDay(p.at.slice(0, 10))}, ${p.at.slice(11, 16)} Uhr</span>` : ''}
          <button class="link" data-action="open-entry" data-id="${e.id}">Eintrag öffnen</button></div>`).addTo(layer));
    });
    return [];
  });

  // Im Formular einer Wanderung: Wegpunkte aus Fotos nachtragen (die Fotos selbst werden nicht gespeichert)
  let formPath = [];
  const extra = app.entryFormExtra;
  app.entryFormExtra = e => {
    formPath = (e.path || []).slice();
    setTimeout(pathVisibility, 0);
    return `${extra ? extra(e) : ''}<label class="ghost file hike-path">${icon('wanderung')}<span>Weg aus Fotos${formPath.length ? ` (${formPath.length})` : ''}</span>
      <input type="file" accept="image/*" multiple data-action="hike-path"></label>`;
  };
  function pathVisibility() {
    const form = document.querySelector('#sheet form[data-form=entry]');
    const b = form && form.querySelector('.hike-path');
    if (b) b.hidden = (form.querySelector('[name=type]:checked') || {}).value !== 'wanderung';
  }
  document.addEventListener('change', ev => { if (ev.target.name === 'type' && ev.target.closest('form[data-form=entry]')) pathVisibility(); });
  CHANGES['hike-path'] = async el => {
    const files = [...el.files]; el.value = '';
    let n = 0;
    for (const f of files) {
      const ex = await app.readExif(f).catch(() => ({}));
      if (typeof ex.lat !== 'number') continue;
      formPath.push([+ex.lat.toFixed(6), +ex.lng.toFixed(6), ex.date || '']);
      n++;
    }
    const lbl = document.querySelector('#sheet .hike-path span');
    if (lbl) lbl.textContent = `Weg aus Fotos (${formPath.length})`;
    toast(n ? `${n} Wegpunkte übernommen${n < files.length ? `, ${files.length - n} Fotos ohne Ort` : ''}. Die Fotos selbst werden nicht gespeichert.` : 'In diesen Fotos steht kein Ort.');
  };
  const saveHook = app.entrySave;
  app.entrySave = (e, form) => {
    if (saveHook) saveHook(e, form);
    if (e.type === 'wanderung' && formPath.length) {
      const seen = new Set();
      e.path = formPath.filter(p => { const k = p.join(','); if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => (a[2] || '').localeCompare(b[2] || ''));
    }
  };

  /* ====================================================================== */
  /* 3. Aufzeichnen: Fahrt oder Wanderung, solange die App offen ist         */
  /* ====================================================================== */

  // Genauigkeit und Mindestabstand je Art: Wanderungen feiner
  const KIND = {
    drive: { label: 'Fahrt', acc: 60, step: 0.04, name: 'Aufgezeichnete Fahrt' },
    hike: { label: 'Wanderung oder Radtour', acc: 35, step: 0.008, name: 'Aufgezeichnete Tour' },
  };
  let rec = LS.get('rec', null);          // { id, tripId, kind, started, paused, pts: [[lat,lng,ms]] }
  let watch = null, wake = null, saveTimer = 0, barEl = null;
  const live = () => rec && !rec.paused;
  const recKm = () => { let d = 0; const p = rec.pts; for (let i = 1; i < p.length; i++) d += dist(p[i - 1], p[i]); return d; };
  const persist = () => LS.set('rec', rec);

  app.tripTools.push(t => (t.ended ? null : { order: 3.2, action: 'rec-open', icon: rec ? 'pause' : 'play', label: rec ? 'Aufnahme' : 'Aufzeichnen', title: 'Strecke aufzeichnen' }));
  ACTIONS['rec-open'] = () => {
    if (rec) return recSheet();
    const t = currentTrip();
    if (!t) return toast('Legt zuerst eine Reise an.');
    openSheet(`<div>${sheetHead('Strecke aufzeichnen')}
      <p>LAMMping zeichnet per GPS auf, wo ihr fahrt oder lauft, und speichert die Strecke bei „${esc(t.name)}“.</p>
      <div class="here-grid rec-kinds">
        <button data-action="rec-start" data-kind="drive">${icon('car')}<b>Fahrt</b><small>Punkt alle 40 m</small></button>
        <button data-action="rec-start" data-kind="hike">${icon('wanderung')}<b>Wanderung / Radtour</b><small>genauer, Punkt alle 8 m</small></button>
      </div>
      <p class="sub"><b>Wichtig:</b> Eine Web-App kann nur aufzeichnen, solange sie offen und der Bildschirm an ist. LAMMping hält den Bildschirm dafür wach. Wird das Handy gesperrt, entsteht eine Lücke, die als gerade Linie überbrückt wird. Für lange Touren mit gesperrtem Handy: mit einer Tracking-App (z. B. OsmAnd, Komoot) aufzeichnen und die GPX-Datei hier importieren.</p></div>`);
  };
  ACTIONS['rec-start'] = async el => {
    const t = currentTrip();
    const kind = el.dataset.kind;
    rec = { id: newId(), tripId: t.id, kind, started: Date.now(), paused: false, pts: [] };
    persist();
    closeSheet();
    begin();
    toast(`Aufzeichnung läuft (${KIND[kind].label})`);
    render();
  };
  function begin() {
    if (!rec || rec.paused || watch !== null || !navigator.geolocation) return;
    watch = navigator.geolocation.watchPosition(onPos, err => { if (err.code === 1) { toast('Der Standort ist nicht freigegeben.'); pause(true); } },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
    lockScreen();
    clearInterval(saveTimer);
    saveTimer = setInterval(store, 30000);
    drawBar();
  }
  function onPos(p) {
    if (!live()) return;
    const k = KIND[rec.kind];
    const pt = [+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6), Date.now()];
    if (p.coords.accuracy > k.acc) return drawBar(p.coords.accuracy);    // zu ungenau
    const last = rec.pts[rec.pts.length - 1];
    if (last && dist(last, pt) < k.step) return drawBar();
    rec.pts.push(pt);
    persist();
    drawBar();
  }
  async function lockScreen() {
    try { if ('wakeLock' in navigator && !wake && !document.hidden) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch { /* nicht unterstützt */ }
  }
  function halt() {
    if (watch !== null) navigator.geolocation.clearWatch(watch);
    watch = null;
    clearInterval(saveTimer);
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function pause(on) {
    rec.paused = on;
    persist();
    if (on) { halt(); store(); } else begin();
    drawBar();
    render();
  }
  // Zwischenstand als Strecke speichern (auch damit andere Geräte und Mitreisende sie sehen)
  function store(r = rec, running = true) {
    if (!r || r.pts.length < 2) return;
    const k = KIND[r.kind];
    let d = 0; for (let i = 1; i < r.pts.length; i++) d += dist(r.pts[i - 1], r.pts[i]);
    const old = S.tracks.find(x => x.id === r.id);
    save('tracks', {
      ...(old || { id: r.id, tripId: r.tripId, createdAt: r.started, name: `${k.name} ${fmtDay(new Date(r.started).toISOString().slice(0, 10))}` }),
      kind: r.kind === 'hike' ? 'hike' : 'drive', rec: true, recording: running,
      pts: enc(app.simplifyTo(r.pts.map(p => [p[0], p[1]]), 5000)), km: Math.round(d * 10) / 10,
    });
  }
  function stop() {
    halt();
    const done = rec;
    rec = null;
    store(done, false);
    const tr = S.tracks.find(x => x.id === done.id);
    LS.set('rec', null);
    drawBar();
    if (done.pts.length < 2) { if (tr) remove('tracks', tr.id); toast('Zu wenige Punkte, nichts gespeichert.'); render(); return; }
    let d = 0; for (let i = 1; i < done.pts.length; i++) d += dist(done.pts[i - 1], done.pts[i]);
    toast(`Strecke gespeichert: ${fmtKm(d)}`);
    render();
    // Wanderung gleich als Eintrag anlegen (mit Start, Länge und Dauer)
    if (done.kind === 'hike') {
      const p0 = done.pts[0], mins = Math.round((done.pts[done.pts.length - 1][2] - done.pts[0][2]) / 60000);
      const pad = n => String(n).padStart(2, '0'), s = new Date(done.started);
      setTimeout(() => {
        app.openEntryForm({ type: 'wanderung', date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`,
          lat: p0[0], lng: p0[1], text: '', extra: { km: Math.round(d * 10) / 10, hours: Math.round(mins / 6) / 10 } }, { at: { lat: p0[0], lng: p0[1] } });
        pendingLink = done.id;
      }, 400);
    }
  }
  // Nach dem Speichern des Wanderungs-Eintrags die Strecke mit ihm verbinden
  let pendingLink = null;
  const saveHook2 = app.entrySave;
  app.entrySave = (e, form) => {
    if (saveHook2) saveHook2(e, form);
    if (pendingLink && e.type === 'wanderung') { const tr = S.tracks.find(x => x.id === pendingLink); if (tr) save('tracks', { ...tr, recording: false, entryId: e.id, name: e.title || tr.name }); }
    pendingLink = null;
  };

  function recSheet() {
    const k = KIND[rec.kind], mins = Math.round((Date.now() - rec.started) / 60000);
    openSheet(`<div>${sheetHead(`Aufzeichnung: ${k.label}`)}
      <p class="rec-stats"><b>${fmtKm(recKm())}</b> · ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')} Std. · ${rec.pts.length} Punkte${rec.paused ? ' · <b>pausiert</b>' : ''}</p>
      <div class="sheet-foot"><button type="button" class="ghost danger" data-action="rec-discard">Verwerfen</button>
        <button type="button" class="ghost" data-action="rec-pause">${rec.paused ? 'Weiter' : 'Pause'}</button>
        <button type="button" class="primary" data-action="rec-stop">Beenden und speichern</button></div></div>`);
  }
  ACTIONS['rec-pause'] = () => { pause(!rec.paused); closeSheet(); };
  ACTIONS['rec-stop'] = () => { closeSheet(); stop(); };
  ACTIONS['rec-discard'] = () => {
    if (!confirm('Die Aufzeichnung verwerfen?')) return;
    halt();
    const tr = S.tracks.find(x => x.id === rec.id);
    if (tr) remove('tracks', tr.id);
    rec = null; LS.set('rec', null);
    closeSheet(); drawBar(); render();
  };

  // Kleine Leiste oben, solange aufgezeichnet wird
  function drawBar(acc) {
    if (!barEl) {
      barEl = document.createElement('button');
      barEl.type = 'button'; barEl.className = 'rec-bar'; barEl.dataset.action = 'rec-open';
      document.body.appendChild(barEl);
    }
    barEl.hidden = !rec;
    if (!rec) return;
    barEl.classList.toggle('paused', !!rec.paused);
    barEl.innerHTML = `<i></i>${rec.paused ? 'Pausiert' : 'Aufnahme'} · ${fmtKm(recKm())}${acc && !rec.paused ? ` · GPS ungenau (${Math.round(acc)} m)` : ''}`;
  }
  // Zurück in der App: Bildschirm wieder wachhalten, weiter aufzeichnen
  document.addEventListener('visibilitychange', () => { if (!document.hidden && live()) { lockScreen(); if (watch === null) begin(); } });
  if (rec) setTimeout(() => { begin(); drawBar(); }, 1500);
}
