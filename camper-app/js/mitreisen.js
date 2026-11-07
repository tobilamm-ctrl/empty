// Crews on the Road: Reisen anderer Crews mitverfolgen. Alle Crews sehen nur, wer gerade unterwegs ist.
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
  // Auch ohne Folgen: Crew ist neu losgefahren, oder (für Crew-Leiter) eine Anfrage wartet. Gesehen = Seite geöffnet.
  const noted = () => LS.get('followNoted', {});
  const recent = d => { const x = new Date(); x.setDate(x.getDate() - 3); return d >= x.toISOString().slice(0, 10); };
  const started = c => c.travelling && c.follow !== 'ok' && c.since && recent(c.since) && noted()['s:' + c.id] !== c.since;
  const asking = c => leader() && c.follower === 'requested' && !noted()['a:' + c.id];
  const markNoted = () => {
    const n = {};
    list().forEach(c => { if (c.travelling && c.since) n['s:' + c.id] = c.since; if (c.follower === 'requested') n['a:' + c.id] = 1; });
    LS.set('followNoted', n);
  };

  // Reise einer anderen Crew; ohne trip die laufende bzw. zuletzt begonnene. Liefert auch die Liste aller sichtbaren Reisen.
  async function feed(id, force, trip = '') {
    const key = `${id}|${trip}`, f = feeds[key];
    if (!force && f && Date.now() - f.at < 5 * 60000) return f.data;
    const data = await api('follow-feed', undefined, `&crew=${encodeURIComponent(crewId())}&of=${encodeURIComponent(id)}${trip ? `&trip=${encodeURIComponent(trip)}` : ''}`);
    data.of = id;
    feeds[key] = { at: Date.now(), data };
    if (!trip) feeds[`${id}|${data.trip ? data.trip.id : ''}`] = { at: Date.now(), data };
    return data;
  }
  const q = (of, trip) => `&crew=${encodeURIComponent(crewId())}&of=${encodeURIComponent(of)}&trip=${encodeURIComponent(trip)}`;
  const photoUrl = (of, trip, id) => `api/?a=follow-photo${q(of, trip)}&id=${encodeURIComponent(id)}`;
  const audioUrl = (of, trip, id) => `api/?a=follow-audio${q(of, trip)}&id=${encodeURIComponent(id)}`;

  /* ---------- Kachel unter „Mehr“ ---------- */

  if (app.TILES && !app.TILES.some(t => t.route === 'mitreisen')) {
    const at = app.TILES.findIndex(t => t.route === 'freunde');
    app.TILES.splice(at < 0 ? app.TILES.length : at + 1, 0, { route: 'mitreisen', art: 'freunde', title: 'Crews on the Road', text: 'Reisen anderer Crews mitverfolgen' });
  }

  /* ---------- Seite ---------- */

  let onPage = false;
  app.chromeHooks.push(() => { if (app.ui.route !== 'mitreisen') onPage = false; });
  const since = c => (c.since ? `seit ${fmtDay(c.since)} unterwegs` : 'unterwegs');
  VIEWS.mitreisen = () => {
    if (!travel || travel.crew !== crewId()) {
      if (!navigator.onLine) return `${pageHead('freunde', 'Crews on the Road')}<p class="hint">Dafür braucht es eine Internetverbindung.</p>`;
      load(true).then(() => { if (app.ui.route === 'mitreisen') render(); });
      return `${pageHead('freunde', 'Crews on the Road')}<p class="sub">Wird geladen …</p>`;
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
    return `${pageHead('freunde', 'Crews on the Road', 'Reisen anderer Crews mitverfolgen')}
      ${following.length ? `<h2 class="date-head">Ihr folgt</h2>${following.map(c => tripsOf(c)).join('')}` : ''}
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

  // Alle sichtbaren Reisen einer Crew, der ihr folgt (die Liste kommt mit der neuesten Reise vom Server)
  function tripsOf(c) {
    const f = feeds[`${c.id}|`];
    if (!f && navigator.onLine) feed(c.id).then(() => { if (app.ui.route === 'mitreisen') render(); }).catch(() => {});
    const trips = f ? f.data.trips || [] : [];
    const when = t => `${t.start ? fmtDay(t.start) : 'ohne Datum'}${t.end && t.end !== t.start ? ` bis ${fmtDay(t.end)}` : ''}`;
    return `<section class="mr-crew"><h3>${esc(c.name)}${isNew(c) ? ' <span class="new-dot">Neu</span>' : ''}<small>${c.travelling ? since(c) : 'gerade nicht unterwegs'}</small></h3>
      ${!f ? '<p class="sub">Reisen werden geladen …</p>' : trips.length ? tripList(c.id, trips, when)
        : '<p class="sub">Noch keine Reise, die sie für andere Crews sichtbar gemacht haben.</p>'}</section>`;
  }
  // Die laufende und die 3 neuesten Reisen sichtbar, der Rest aufklappbar
  function tripList(of, trips, when) {
    const li = t => `<li><button class="as-text mr-trip" data-action="mr-open" data-id="${of}" data-trip="${t.id}">
      <span class="mr-dot" style="--c:${esc(t.color)}"></span><span class="txt"><b>${t.kind && t.kind !== 'camping' ? `${app.kindInfo(t.kind)[2]} ` : ''}${esc(t.name || 'Reise')}</b>
      <small>${when(t)}${t.running ? ' · <b>läuft gerade</b>' : ''}</small></span><span aria-hidden="true">›</span></button></li>`;
    const top = trips.filter(t => t.running).concat(trips.filter(t => !t.running)).slice(0, 4), rest = trips.filter(t => !top.includes(t));
    return `<ul class="mr-list mr-trips">${top.map(li).join('')}</ul>${rest.length ? `<details class="mr-more"><summary>${rest.length} ältere ${rest.length === 1 ? 'Reise' : 'Reisen'} zeigen</summary>
      <ul class="mr-list mr-trips">${rest.map(li).join('')}</ul></details>` : ''}`;
  }
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
    const id = el.dataset.id, trip = el.dataset.trip || '';
    const c = list().find(x => x.id === id);
    openSheet(`<div class="mr-view">${sheetHead(esc(c ? c.name : 'Reise'))}<p class="sub">Wird geladen …</p></div>`);
    let d;
    try { d = await feed(id, true, trip); } catch (e) { openSheet(`<div>${sheetHead('Crews on the Road')}<p class="hint">${esc(e.message)}</p></div>`); return; }
    if (c && (!trip || (d.trip && d.running && d.trip.id === trip))) { markSeen(c); app.chromeHooks.forEach(h => h()); refreshRows(); }
    if (!d.trip) { openSheet(`<div>${sheetHead(esc(d.crew))}<p class="hint">Noch keine Reise.</p></div>`); return; }
    const es = d.entries.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const label = e => e.title || (TYPES[e.type] || TYPES.notiz).label;
    const secs = n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
    const hl = day => (d.highlights || []).filter(h => h.day === day);
    let lastDay = '';
    const others = (d.trips || []).filter(t => t.id !== d.trip.id);
    openSheet(`<div class="mr-view">${sheetHead(`${esc(d.crew)}: ${app.tripKind(d.trip) !== 'camping' ? `${app.kindInfo(app.tripKind(d.trip))[2]} ` : ''}${esc(d.trip.name)}`)}
      <p class="sub">${d.running ? `${since({ since: d.trip.start })}` : `${d.trip.start ? fmtDay(d.trip.start) : ''}${d.trip.end ? ` bis ${fmtDay(d.trip.end)}` : ''} (vorbei)`}
        ${d.live ? ` · 📍 Standort ${ago(d.live.at)}` : es.find(e => typeof e.lat === 'number') ? ` · zuletzt bei ${esc(es.find(e => typeof e.lat === 'number').place || label(es.find(e => typeof e.lat === 'number')))}` : ''}</p>
      <div class="mr-map" id="mrMap"></div>
      ${es.length ? `<ul class="mr-entries">${es.map(e => {
        const day = (e.date || '').slice(0, 10), head = day !== lastDay && hl(day).length;
        lastDay = day;
        return `${head ? `<li class="mr-hl">Highlights des Tages: ${hl(day).map(h => `${esc(h.emoji)} ${esc(h.text)}`).join(' · ')}</li>` : ''}<li><small>${e.date ? `${fmtDay(day)}${e.date.length > 10 ? `, ${e.date.slice(11, 16)}` : ''}` : ''}${e.place ? ` · ${esc(e.place)}` : ''}</small>
        <b>${esc(label(e))}</b>${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}
        ${e.photos.length ? `<div class="mr-photos">${e.photos.map(p => `<img src="${p.thumb}" data-full="${photoUrl(d.of, d.trip.id, p.id)}" alt="" loading="lazy">`).join('')}</div>` : ''}
        <div class="mr-react">${(e.sounds || []).map(x => `<button type="button" class="blog-snd" data-action="mr-snd" data-src="${audioUrl(d.of, d.trip.id, x.id)}">🎙️ <span>Anhören</span>${x.sec ? ` <small>${secs(x.sec)}</small>` : ''}</button>`).join('')}
          <button type="button" class="blog-like${e.liked ? ' on' : ''}" data-action="mr-like" data-of="${d.of}" data-trip="${d.trip.id}" data-id="${e.id}" aria-pressed="${!!e.liked}" aria-label="Herz geben">${e.liked ? '❤️' : '🤍'} <span>${e.likes || ''}</span></button></div></li>`;
      }).join('')}</ul>`
        : '<p class="hint">Noch keine Einträge.</p>'}
      ${others.length ? `<h3 class="date-head">Weitere Reisen von ${esc(d.crew)}</h3>${tripList(d.of, others, t => (t.start ? fmtDay(t.start) : 'ohne Datum'))}` : ''}</div>`, root => {
      root.querySelectorAll('[data-full]').forEach(img => img.addEventListener('click', () => { img.src = img.dataset.full; img.classList.toggle('big'); }));
      setTimeout(() => drawView(d), 50);
    });
  };
  // Herz für einen Eintrag einer anderen Crew (eines je Person)
  ACTIONS['mr-like'] = async el => {
    const off = el.classList.contains('on');
    el.disabled = true;
    try {
      const r = await api('follow-like', { crew: crewId(), of: el.dataset.of, trip: el.dataset.trip, id: el.dataset.id, off });
      el.classList.toggle('on', !off); el.setAttribute('aria-pressed', String(!off));
      el.innerHTML = `${off ? '🤍' : '❤️'} <span>${r.n || ''}</span>`;
      Object.keys(feeds).filter(k => k.startsWith(`${el.dataset.of}|`)).forEach(k => { feeds[k].at = 0; });
      if (!off && navigator.vibrate) navigator.vibrate(10);
    } catch (e) { toast(e.message); }
    el.disabled = false;
  };
  // Sprachnotiz abspielen; zweiter Tipp hält an
  let player = null, playBtn = null;
  const stopSnd = () => { if (player) player.pause(); player = null; if (playBtn) playBtn.classList.remove('on'); playBtn = null; };
  ACTIONS['mr-snd'] = el => {
    if (playBtn === el) return stopSnd();
    stopSnd();
    playBtn = el; el.classList.add('on');
    player = new Audio(el.dataset.src);
    player.onended = stopSnd;
    player.onerror = () => { stopSnd(); toast('Die Sprachnotiz lässt sich gerade nicht abspielen.'); };
    player.play().catch(() => {});
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
    // Abschnitte wie auf der eigenen Karte: Flug als Bogen, Schiff und Bahn gestrichelt
    const legs = app.splitLegs(stops.map(e => ({ lat: e.lat, lng: e.lng, e })), app.tripKind(d.trip));
    const lines = drive.length ? drive.map(t => app.decodePts(t.pts)) : legs.filter(l => !['air', 'ship', 'rail'].includes(l.mode)).map(l => l.pts);
    // Auf der eigenen Karte: Antippen der Linie oder des Standorts öffnet die Reise der Crew
    const open = () => ACTIONS['mr-open']({ dataset: { id: d.of, trip: d.trip.id } });
    lines.forEach(l => {
      if (l.length < 2) return;
      const pl = L.polyline(l, { color, weight: big ? 4 : 3, opacity: big ? 0.95 : 0.7, dashArray: big ? null : '6 6' }).addTo(layer);
      if (!big) {
        pl.on('click', open);
        // Breite, unsichtbare Linie darüber, damit man sie mit dem Finger trifft
        L.polyline(l, { color, weight: 18, opacity: 0, interactive: true }).on('click', open).addTo(layer);
      }
    });
    lines.push(app.drawSpecialLegs(L, layer, legs, { plane: big }));
    stops.forEach(e => L.circleMarker([e.lat, e.lng], { radius: big ? 6 : 4, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
      .bindPopup(`<b>${esc(e.title || (TYPES[e.type] || TYPES.notiz).label)}</b><br>${esc(e.place || '')}${e.date ? `<br><small>${fmtDay(e.date.slice(0, 10))}</small>` : ''}`).addTo(layer));
    const at = d.live ? [d.live.lat, d.live.lng] : pts[pts.length - 1];
    if (at && d.running) {
      const m = L.marker(at, { icon: L.divIcon({ className: 'mr-here', html: `<span style="--c:${color}"></span><b>${esc(d.crew)}</b>`, iconSize: [16, 16], iconAnchor: [8, 8] }) });
      if (big) m.bindPopup(`<b>${esc(d.crew)}</b><br>${d.live ? `Standort ${ago(d.live.at)}` : 'zuletzt hier'}`);
      else m.on('click', open);
      m.addTo(layer);
    }
    return [...lines.flat(), ...(at ? [at] : [])];
  }

  /* ---------- Auf der eigenen Karte (abschaltbar) ---------- */

  const mapOn = () => LS.get('followMap', true) !== false;
  let fetching = false;
  app.mapHooks.push(layer => {
    if (!mapOn()) return [];
    const ids = list().filter(c => c.follow === 'ok' && c.travelling).map(c => c.id);
    const missing = ids.filter(id => !feeds[`${id}|`] || Date.now() - feeds[`${id}|`].at > 10 * 60000);
    ids.filter(id => feeds[`${id}|`]).forEach(id => { try { const d = feeds[`${id}|`].data; if (d.trip && d.running) drawTrip(layer, d, false); } catch { /* egal */ } });
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

  /* ---------- Schmale Zeilen im Tagebuch: je Crew, die gerade unterwegs ist ---------- */

  // Statt des früheren 👋-Hinweises neben der Pinnwand (bis Version 78). Gefolgte Crews: Tipp öffnet ihre Reise.
  // Nicht gefolgte, frisch losgefahrene Crews: „folgen anfragen“ (mit ✕ wegzutippen). Crew-Leiter: wartende Anfragen.
  const dayOf = since => (since ? Math.max(1, Math.round((new Date(app.today() + 'T12:00') - new Date(since + 'T12:00')) / 864e5) + 1) : 0);
  app.diaryTop = () => {
    if (!ready()) return '';
    const rows = [];
    list().forEach(c => {
      if (c.follow === 'ok' && c.travelling) {
        const t = c.trip || {};
        rows.push(`<button type="button" class="crew-row" data-action="mr-open" data-id="${c.id}" style="--c:${esc(t.color || '#0F6670')}">
          <span aria-hidden="true">👋</span><b>${esc(c.name)}</b><span class="cr-sub">${t.name ? `· ${esc(t.name)}, ` : '· '}Tag ${dayOf(c.since)}</span>${isNew(c) ? '<i class="cr-new" aria-label="Neu"></i>' : ''}<span class="cr-go" aria-hidden="true">›</span></button>`);
      } else if (asking(c)) {
        rows.push(`<button type="button" class="crew-row" data-action="cr-goto"><span aria-hidden="true">👋</span><b>${esc(c.name)}</b><span class="cr-sub">möchte euch folgen</span><span class="cr-go" aria-hidden="true">›</span></button>`);
      } else if (started(c)) {
        rows.push(`<div class="crew-row"><span aria-hidden="true">👋</span><b>${esc(c.name)}</b><span class="cr-sub">${c.follow === 'requested' ? 'ist unterwegs · angefragt' : 'ist losgefahren'}</span>
          ${c.follow === 'requested' ? '' : `<button type="button" class="link cr-ask" data-action="mr-op" data-op="request" data-id="${c.id}">folgen anfragen ›</button>`}
          <button type="button" class="icon-btn small" data-action="cr-hide" data-id="${c.id}" aria-label="Ausblenden">${icon('close')}</button></div>`);
      }
    });
    return rows.length ? `<div class="crew-rows">${rows.join('')}</div>` : '';
  };
  ACTIONS['cr-goto'] = () => go('mitreisen');
  ACTIONS['cr-hide'] = el => {
    const c = list().find(x => x.id === el.dataset.id);
    if (c) { const n = noted(); n['s:' + c.id] = c.since; LS.set('followNoted', n); }
    render();
  };
  // Auf der Seite selbst gelten Anfragen als gesehen
  app.chromeHooks.push(() => { if (app.session && app.session() && app.ui.route === 'mitreisen' && list().some(asking)) markNoted(); });
  // Neue Daten: Tagebuch neu zeichnen, damit die Zeilen stimmen
  let lastRows = '';
  const refreshRows = () => { const r = app.diaryTop(); if (r !== lastRows) { lastRows = r; if (app.ui.route === 'tagebuch') render(); } };

  /* ---------- Reise für andere Crews sichtbar? (Reise-Formular) ---------- */

  const formExtra = app.tripFormExtra;
  app.tripFormExtra = t => `${formExtra ? formExtra(t) : ''}<label class="check"><input type="checkbox" name="friendsShow"${t.friendsHide ? '' : ' checked'}><span>Für andere Crews sichtbar
    <small class="sub"> (nur für Crews, denen ihr das Folgen erlaubt habt; unter „Crews on the Road“)</small></span></label>`;
  const tripSaved = app.tripSaved;
  app.tripSaved = (t, old, form) => {
    if (tripSaved) tripSaved(t, old, form);
    if (!form.friendsShow) return;
    const hide = !form.friendsShow.checked, cur = S.trips.find(x => x.id === t.id) || t;
    if (!!cur.friendsHide !== hide) save('trips', { ...cur, friendsHide: hide });
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
  const tick = () => { if (!ready() || document.hidden) return; load().then(() => { app.chromeHooks.forEach(h => h()); refreshRows(); }); report(); };
  setTimeout(tick, 4000);
  setInterval(tick, 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
