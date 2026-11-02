// Unterwegs mit Freunden: Reisen anderer Crews mitverfolgen. Alle Crews sehen nur, wer gerade unterwegs ist.
// Mehr (Karte, Einträge mit Fotos, zuletzt gemeldeter Standort) gibt es erst, wenn ein Crew-Leiter der anderen Crew
// das freigibt: per Einladung oder indem er eine Anfrage annimmt. Ausgeblendete Einträge (Reiseblog) bleiben privat,
// Kosten, Listen und Dokumente sowieso.

export default function installMitreisen(app) {
  const { S, LS, VIEWS, ACTIONS, CHANGES, esc, icon, pageHead, save, toast, render, go, openSheet, closeSheet, api, fmtDay, ago, TYPES } = app;
  const sheetHead = app.sheetHead;
  const crewId = () => { try { return app.crewId(); } catch { return null; } };
  const ready = () => !!(app.session() && crewId());
  let travel = null, loading = null, loadedAt = 0;
  const feeds = {};                       // crewId → { at, data }

  async function load(force) {
    if (!ready() || !navigator.onLine) return travel;
    if (!force && travel && Date.now() - loadedAt < 5 * 60000) return travel;
    if (loading) return loading;
    loading = api('travel', undefined, `&crew=${encodeURIComponent(crewId())}`)
      .then(r => { travel = { ...r, crew: crewId() }; loadedAt = Date.now(); return travel; })
      .catch(() => travel).finally(() => { loading = null; });
    return loading;
  }
  const list = () => (travel && travel.crew === crewId() ? travel.crews : []);
  const seen = () => LS.get('followSeen', {});
  const isNew = c => c.follow === 'ok' && c.rev && (seen()[c.id] || 0) < c.rev;
  const markSeen = c => { const s = seen(); s[c.id] = c.rev || 0; LS.set('followSeen', s); };
  const leader = () => !!(travel && travel.leader);

  async function feed(id, force) {
    const f = feeds[id];
    if (!force && f && Date.now() - f.at < 5 * 60000) return f.data;
    const data = await api('follow-feed', undefined, `&crew=${encodeURIComponent(crewId())}&of=${encodeURIComponent(id)}`);
    feeds[id] = { at: Date.now(), data };
    return data;
  }
  const photoUrl = (of, id) => `api/?a=follow-photo&crew=${encodeURIComponent(crewId())}&of=${encodeURIComponent(of)}&id=${encodeURIComponent(id)}`;

  /* ---------- Kachel unter „Mehr“ ---------- */

  if (app.TILES && !app.TILES.some(t => t.route === 'mitreisen')) {
    const at = app.TILES.findIndex(t => t.route === 'freunde');
    app.TILES.splice(at < 0 ? app.TILES.length : at + 1, 0, { route: 'mitreisen', art: 'freunde', title: 'Unterwegs mit Freunden', text: 'Reisen anderer Crews mitverfolgen' });
  }

  /* ---------- Seite ---------- */

  let onPage = false;
  app.chromeHooks.push(() => { if (app.ui.route !== 'mitreisen') onPage = false; });
  const since = c => (c.since ? `seit ${fmtDay(c.since)} unterwegs` : 'unterwegs');
  VIEWS.mitreisen = () => {
    if (!travel || travel.crew !== crewId()) {
      if (!navigator.onLine) return `${pageHead('freunde', 'Unterwegs mit Freunden')}<p class="hint">Dafür braucht es eine Internetverbindung.</p>`;
      load(true).then(() => { if (app.ui.route === 'mitreisen') render(); });
      return `${pageHead('freunde', 'Unterwegs mit Freunden')}<p class="sub">Wird geladen …</p>`;
    }
    // Beim Öffnen der Seite frisch nachladen (der Stand vom Start kann einige Minuten alt sein)
    if (!onPage && navigator.onLine) { onPage = true; load(true).then(() => { if (app.ui.route === 'mitreisen') render(); }); }
    const all = list();
    const following = all.filter(c => c.follow === 'ok');
    const onTour = all.filter(c => c.travelling && c.follow !== 'ok');
    const asks = all.filter(c => c.follower === 'requested');
    const fans = all.filter(c => c.follower === 'ok');
    const row = (c, btns, sub) => `<li><span class="txt"><b>${esc(c.name)}${isNew(c) ? ' <span class="new-dot">Neu</span>' : ''}</b><small>${sub}</small></span><span class="mr-btns">${btns}</span></li>`;
    const live = (S.meta.find(m => m.id === 'follow') || {}).live;
    return `${pageHead('freunde', 'Unterwegs mit Freunden', 'Reisen anderer Crews mitverfolgen')}
      ${following.length ? `<h2 class="date-head">Ihr folgt</h2><ul class="mr-list">${following.map(c => row(c,
        `<button class="primary small-btn" data-action="mr-open" data-id="${c.id}">Ansehen</button>`,
        c.travelling ? since(c) : 'gerade nicht unterwegs, letzte Reise ansehen')).join('')}</ul>` : ''}
      <h2 class="date-head">Gerade unterwegs</h2>
      ${onTour.length ? `<ul class="mr-list">${onTour.map(c => row(c, c.follow === 'requested'
        ? `<span class="sub">Angefragt</span><button class="link" data-action="mr-op" data-op="unfollow" data-id="${c.id}">zurückziehen</button>`
        : `<button class="ghost small-btn" data-action="mr-op" data-op="request" data-id="${c.id}">Folgen anfragen</button>`, since(c))).join('')}</ul>`
        : `<p class="sub">${following.some(c => c.travelling) ? 'Sonst ist gerade niemand unterwegs.' : 'Gerade ist keine andere Crew unterwegs.'}</p>`}
      ${asks.length ? `<h2 class="date-head">Möchten euch folgen</h2><ul class="mr-list">${asks.map(c => row(c, leader()
        ? `<button class="ghost small-btn" data-action="mr-op" data-op="revoke" data-id="${c.id}">Ablehnen</button><button class="primary small-btn" data-action="mr-op" data-op="accept" data-id="${c.id}">Annehmen</button>`
        : '', leader() ? 'sehen dann Karte, Einträge und Standort' : 'Ein Crew-Leiter kann die Anfrage annehmen.')).join('')}</ul>` : ''}
      <h2 class="date-head">Wer eure Reisen sieht</h2>
      ${fans.length ? `<ul class="mr-list">${fans.map(c => row(c, leader() ? `<button class="link danger" data-action="mr-op" data-op="revoke" data-id="${c.id}">Freigabe beenden</button>` : '', 'sieht Karte, Einträge und Standort')).join('')}</ul>`
        : '<p class="sub">Noch niemand. Ohne Freigabe sehen andere Crews nur, dass ihr unterwegs seid.</p>'}
      ${leader() ? `<div class="btnrow"><button class="ghost" data-action="mr-invite">${icon('plus')}Crew einladen, euch zu folgen</button></div>
        <label class="check"><input type="checkbox" data-action="mr-live"${live ? ' checked' : ''}><span>Unseren Standort für Mitreisende melden (während einer Reise, wenn die App offen ist)</span></label>`
        : `<p class="sub">${live ? 'Euer Standort wird während der Reise für Mitreisende gemeldet.' : ''}</p>`}
      <p class="sub">Was ihr im Tagebuch für den Reiseblog ausblendet, sehen auch Mitreisende nicht. Kosten, Listen und Dokumente bleiben immer privat.</p>`;
  };

  ACTIONS['mr-op'] = async el => {
    const op = el.dataset.op, c = list().find(x => x.id === el.dataset.id);
    if (op === 'revoke' && c && c.follower === 'ok' && !confirm(`„${c.name}“ sieht eure Reisen dann nicht mehr. Freigabe beenden?`)) return;
    try {
      await api('follow', { crew: crewId(), target: el.dataset.id, op });
      toast({ request: 'Angefragt. Ein Crew-Leiter der anderen Crew entscheidet.', invite: 'Eingeladen. Die Crew kann euch jetzt folgen.', accept: 'Angenommen', revoke: 'Erledigt', unfollow: 'Ihr folgt nicht mehr' }[op] || 'Erledigt');
    } catch (e) { toast(e.message); }
    closeSheet();
    await load(true);
    render();
  };
  ACTIONS['mr-invite'] = () => {
    const cand = list().filter(c => c.follower !== 'ok');
    openSheet(`<div>${sheetHead('Crew einladen')}
      <p class="sub">Die Crew sieht dann eure Reisen: Karte, Einträge mit Fotos und, wenn eingeschaltet, euren Standort.</p>
      ${cand.length ? `<ul class="mr-list">${cand.map(c => `<li><span class="txt"><b>${esc(c.name)}</b></span>
        <button class="primary small-btn" data-action="mr-op" data-op="invite" data-id="${c.id}">Einladen</button></li>`).join('')}</ul>` : '<p class="hint">Alle anderen Crews sehen eure Reisen schon.</p>'}</div>`);
  };
  CHANGES['mr-live'] = el => {
    const m = S.meta.find(x => x.id === 'follow') || { id: 'follow' };
    save('meta', { ...m, live: el.checked });
    if (!el.checked) api('livepos', { crew: crewId(), off: true }).catch(() => {});
    else report(true, true);
    toast(el.checked ? 'Standort wird während der Reise gemeldet' : 'Standort wird nicht mehr gemeldet');
  };

  /* ---------- Reise einer anderen Crew ansehen ---------- */

  let viewMap = null;
  ACTIONS['mr-open'] = async el => {
    const c = list().find(x => x.id === el.dataset.id);
    openSheet(`<div class="mr-view">${sheetHead(esc(c ? c.name : 'Reise'))}<p class="sub">Wird geladen …</p></div>`);
    let d;
    try { d = await feed(el.dataset.id, true); } catch (e) { openSheet(`<div>${sheetHead('Unterwegs mit Freunden')}<p class="hint">${esc(e.message)}</p></div>`); return; }
    if (c) { markSeen(c); app.chromeHooks.forEach(h => h()); }
    if (!d.trip) { openSheet(`<div>${sheetHead(esc(d.crew))}<p class="hint">Noch keine Reise.</p></div>`); return; }
    const es = d.entries.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const label = e => e.title || (TYPES[e.type] || TYPES.notiz).label;
    openSheet(`<div class="mr-view">${sheetHead(`${esc(d.crew)}: ${esc(d.trip.name)}`)}
      <p class="sub">${d.running ? `${since({ since: d.trip.start })}` : `${d.trip.start ? fmtDay(d.trip.start) : ''}${d.trip.end ? ` bis ${fmtDay(d.trip.end)}` : ''} (vorbei)`}
        ${d.live ? ` · 📍 Standort ${ago(d.live.at)}` : es.find(e => typeof e.lat === 'number') ? ` · zuletzt bei ${esc(es.find(e => typeof e.lat === 'number').place || label(es.find(e => typeof e.lat === 'number')))}` : ''}</p>
      <div class="mr-map" id="mrMap"></div>
      ${es.length ? `<ul class="mr-entries">${es.map(e => `<li><small>${e.date ? `${fmtDay(e.date.slice(0, 10))}${e.date.length > 10 ? `, ${e.date.slice(11, 16)}` : ''}` : ''}${e.place ? ` · ${esc(e.place)}` : ''}</small>
        <b>${esc(label(e))}</b>${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}
        ${e.photos.length ? `<div class="mr-photos">${e.photos.map(p => `<img src="${p.thumb}" data-full="${photoUrl(c ? c.id : '', p.id)}" alt="" loading="lazy">`).join('')}</div>` : ''}</li>`).join('')}</ul>`
        : '<p class="hint">Noch keine Einträge.</p>'}</div>`, root => {
      root.querySelectorAll('[data-full]').forEach(img => img.addEventListener('click', () => { img.src = img.dataset.full; img.classList.toggle('big'); }));
      setTimeout(() => drawView(d), 50);
    });
  };
  function drawView(d) {
    const box = document.getElementById('mrMap');
    if (!box || typeof L === 'undefined') return;
    if (viewMap) { try { viewMap.remove(); } catch { /* schon weg */ } }
    viewMap = L.map(box, { zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(viewMap);
    const pts = drawTrip(viewMap, d, true);
    if (pts.length > 1) viewMap.fitBounds(pts, { padding: [24, 24], maxZoom: 13 });
    else if (pts.length) viewMap.setView(pts[0], 11);
    else viewMap.setView([50, 10], 4);
  }
  // Route, Stopps und Standort einer fremden Reise auf eine Karte zeichnen; liefert die Punkte
  function drawTrip(layer, d, big) {
    const color = d.trip.color || '#0F6670';
    const stops = d.entries.filter(e => typeof e.lat === 'number').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const pts = stops.map(e => [e.lat, e.lng]);
    const drive = d.tracks.filter(t => t.kind !== 'hike' && t.kind !== 'plan');
    const lines = drive.length ? drive.map(t => app.decodePts(t.pts)) : [pts];
    lines.forEach(l => { if (l.length > 1) L.polyline(l, { color, weight: big ? 4 : 3, opacity: big ? 0.95 : 0.7, dashArray: big ? null : '6 6' }).addTo(layer); });
    stops.forEach(e => L.circleMarker([e.lat, e.lng], { radius: big ? 6 : 4, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
      .bindPopup(`<b>${esc(e.title || (TYPES[e.type] || TYPES.notiz).label)}</b><br>${esc(e.place || '')}${e.date ? `<br><small>${fmtDay(e.date.slice(0, 10))}</small>` : ''}`).addTo(layer));
    const at = d.live ? [d.live.lat, d.live.lng] : pts[pts.length - 1];
    if (at && d.running) {
      L.marker(at, { icon: L.divIcon({ className: 'mr-here', html: `<span style="--c:${color}"></span><b>${esc(d.crew)}</b>`, iconSize: [16, 16], iconAnchor: [8, 8] }) })
        .bindPopup(`<b>${esc(d.crew)}</b><br>${d.live ? `Standort ${ago(d.live.at)}` : 'zuletzt hier'}`).addTo(layer);
    }
    return [...lines.flat(), ...(at ? [at] : [])];
  }

  /* ---------- Auf der eigenen Karte (abschaltbar) ---------- */

  const mapOn = () => LS.get('followMap', true) !== false;
  let fetching = false;
  app.mapHooks.push(layer => {
    if (!mapOn()) return [];
    const ids = list().filter(c => c.follow === 'ok' && c.travelling).map(c => c.id);
    const missing = ids.filter(id => !feeds[id] || Date.now() - feeds[id].at > 10 * 60000);
    ids.filter(id => feeds[id]).forEach(id => { try { if (feeds[id].data.trip) drawTrip(layer, feeds[id].data, false); } catch { /* egal */ } });
    if (missing.length && !fetching && navigator.onLine) {
      fetching = true;
      Promise.all(missing.map(id => feed(id).catch(() => null))).finally(() => { fetching = false; if (app.ui.route === 'karte') render(); });
    }
    return [];
  });
  const layers = ACTIONS['map-layers'];
  ACTIONS['map-layers'] = el => {
    layers(el);
    const root = document.querySelector('#sheetBody .map-layers');
    if (root && list().some(c => c.follow === 'ok')) root.insertAdjacentHTML('beforeend',
      `<label class="check"><input type="checkbox" data-action="mr-map"${mapOn() ? ' checked' : ''}><span>Reisen der Crews zeigen, denen ihr folgt</span></label>`);
  };
  CHANGES['mr-map'] = el => { LS.set('followMap', el.checked); render(); };

  /* ---------- Hinweis bei Neuem (neben dem Pinnwand-Zettel) ---------- */

  const brand = document.querySelector('.brandbar .brand');
  const note = document.createElement('button');
  note.type = 'button'; note.className = 'mr-note'; note.hidden = true; note.dataset.action = 'mr-goto';
  if (brand) (document.querySelector('.brandbar .pin-note') || brand).after(note);
  app.chromeHooks.push(() => {
    const fresh = app.session && app.session() ? list().filter(isNew) : [];
    note.hidden = !fresh.length;
    if (fresh.length) {
      note.innerHTML = `<span aria-hidden="true">👋</span><small>${fresh.length === 1 ? esc(fresh[0].name) : `${fresh.length} Crews`}</small><b>${fresh.length}</b>`;
      note.setAttribute('aria-label', `Neues von ${fresh.map(c => c.name).join(', ')}`);
    }
  });
  ACTIONS['mr-goto'] = () => {
    const fresh = list().filter(isNew);
    if (fresh.length === 1) { go('mitreisen'); setTimeout(() => ACTIONS['mr-open']({ dataset: { id: fresh[0].id } }), 300); }
    else go('mitreisen');
  };

  /* ---------- Eigenen Standort melden (wenn eingeschaltet und eine Reise läuft) ---------- */

  let lastReport = 0;
  async function report(force, liveNow) {
    if (!ready()) return;
    const m = S.meta.find(x => x.id === 'follow');
    const t = app.currentTrip && app.currentTrip();
    // Direkt nach dem Einschalten steht die Einstellung noch nicht in S.meta
    if (!(liveNow ?? (m && m.live)) || !t || t.ended || !t.start || t.start > app.today() || (t.end && t.end < app.today()) || !navigator.onLine) return;
    if (!force && Date.now() - lastReport < 15 * 60000) return;
    // Nie selbst nach der Standort-Erlaubnis fragen: nur melden, wenn sie schon erteilt ist
    try { const p = navigator.permissions && await navigator.permissions.query({ name: 'geolocation' }); if (!force && p && p.state !== 'granted') return; } catch { /* unbekannt */ }
    lastReport = Date.now();
    try { const pos = await app.getPos(); await api('livepos', { crew: crewId(), lat: pos.lat, lng: pos.lng }); } catch { /* ohne Standort weiter */ }
  }

  // Beim Start, alle 10 Minuten und beim Zurückkehren in die App nachsehen
  const tick = () => { if (!ready() || document.hidden) return; load().then(() => app.chromeHooks.forEach(h => h())); report(); };
  setTimeout(tick, 4000);
  setInterval(tick, 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
