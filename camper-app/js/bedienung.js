// Bedienung: Bildschirm bleibt an, Einkaufsmodus, Seite „Heute“, dort weitermachen, wo man war, schmalere
// Kopfzeile beim Scrollen, Tastenkürzel am PC, einklappbare Einstellungen, ehrliche Offline-Anzeige und
// Speicherplatz-Übersicht.

export default function installBedienung(app) {
  const { S, LS, ui, VIEWS, ACTIONS, CHANGES, esc, pageHead, render, go, toast, openSheet,
    currentTrip, tripStats, tripEntries, today, fmtDay, fmtTime, settingsPanels, sortTrips } = app;
  const sheetHead = app.sheetHead;
  const opt = (k, d = true) => LS.get(k, d) !== false;

  /* ====================================================================== */
  /* Bildschirm bleibt an (Wake Lock)                                        */
  /* ====================================================================== */

  let lock = null;
  const wantAwake = () => opt('wakeLock') && (['nochweit', 'wasserwaage', 'kochen'].includes(ui.route) || (ui.route === 'spiele' && !!ui.game) || (ui.route === 'listen' && ui.shopMode));
  async function syncLock() {
    const want = wantAwake() && document.visibilityState === 'visible';
    if (want && !lock && navigator.wakeLock) {
      try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch { /* nicht erlaubt (z. B. Akku sparen) */ }
    } else if (!want && lock) { try { await lock.release(); } catch { /* schon frei */ } lock = null; }
    document.body.classList.toggle('awake', !!lock);
  }
  app.chromeHooks.push(() => setTimeout(syncLock, 0));
  document.addEventListener('visibilitychange', syncLock);
  app.keepAwake = syncLock;

  /* ====================================================================== */
  /* Einkaufsmodus                                                           */
  /* ====================================================================== */

  const lists = VIEWS.listen;
  VIEWS.listen = (...a) => {
    let html = lists(...a);
    if (ui.listTab !== 'einkauf') { ui.shopMode = false; return html; }
    if (ui.shopMode) {
      html = `<div class="shop-banner"><span>🛒 <b>Einkaufsmodus</b>${lock ? ' · Bildschirm bleibt an' : ''}</span><button class="primary" data-action="shop-mode">Fertig</button></div>${html}`;
    } else html = html.replace('<div class="list-head">', '<button class="chip shop-btn" data-action="shop-mode">🛒 Einkaufsmodus</button><div class="list-head">');
    return html;
  };
  ACTIONS['shop-mode'] = () => { ui.shopMode = !ui.shopMode; render(); window.scrollTo(0, 0); };
  app.chromeHooks.push(() => document.body.classList.toggle('shop-mode', ui.route === 'listen' && !!ui.shopMode));
  // Abhaken im Laden: kurz durchstreichen, dann rutscht der Punkt nach unten
  const tick = ACTIONS['toggle-item'];
  ACTIONS['toggle-item'] = el => {
    if (!document.body.classList.contains('shop-mode')) return tick(el);
    const li = el.closest('li');
    if (li) li.classList.add('ticking');
    if (navigator.vibrate) navigator.vibrate(12);
    setTimeout(() => tick(el), 320);
  };

  /* ====================================================================== */
  /* Seite „Heute“                                                           */
  /* ====================================================================== */

  const running = t => t && !t.ended && t.start && t.start <= today() && (!t.end || t.end >= today());
  VIEWS.heute = () => {
    const t = currentTrip();
    const card = t && app.todayCard ? app.todayCard(t, tripStats(t)) : '';
    const polls = S.games.filter(g => g.kind === 'poll' && !g.closed && Date.now() - (g.at || 0) < 7 * 864e5);
    const tickets = S.games.filter(g => g.kind === 'ticket' && g.date && g.date >= today() && g.date <= addDays(today(), 7))
      .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));
    const next = sortTrips(S.trips).filter(x => x.start && x.start > today() && !x.archived).sort((a, b) => a.start.localeCompare(b.start))[0];
    const daysTo = next ? Math.round((new Date(next.start + 'T12:00') - new Date(today() + 'T12:00')) / 864e5) : 0;
    const entriesToday = t ? tripEntries(t).filter(e => e.date.slice(0, 10) === today()).sort(app.byDate) : [];
    return `${pageHead('heute', 'Heute', fmtDay(today()))}
      ${card || (t && running(t) ? '' : `<section class="panel heute-ruhe"><p>${next ? `Noch <b>${daysTo} ${daysTo === 1 ? 'Tag' : 'Tage'}</b> bis „${esc(next.name)}“ 🚐` : 'Gerade läuft keine Reise.'}</p>
        <p class="sub">Während einer Reise steht hier alles für den Tag: Wetter, Sonne, nächstes Ziel, Dienste, Frage des Tages und Tickets.</p></section>`)}
      ${polls.length ? `<section class="panel"><h2>🗳️ Offene Abstimmungen</h2><ul class="ledger">${polls.map(p => `<li><a href="#/abstimmung"><span class="txt"><b>${esc(p.q)}</b>
        <small>${Object.keys(p.votes || {}).length} Stimmen</small></span></a></li>`).join('')}</ul></section>` : ''}
      ${tickets.length ? `<section class="panel"><h2>🎟️ Tickets der nächsten Tage</h2><ul class="ledger">${tickets.map(x => `<li><button data-action="ticket-view" data-id="${x.id}"><span class="txt"><b>${esc(x.title)}</b>
        <small>${fmtDay(x.date)}${x.time ? `, ${x.time} Uhr` : ''}</small></span></button></li>`).join('')}</ul></section>` : ''}
      ${entriesToday.length ? `<section class="panel"><h2>📔 Heute eingetragen</h2><ul class="ledger">${entriesToday.map(e => `<li><button data-action="open-entry" data-id="${e.id}"><span class="txt"><b>${esc(e.title || app.TYPES[e.type].label)}</b>
        <small>${fmtTime(e.date)}${e.place ? ` · ${esc(e.place)}` : ''}</small></span></button></li>`).join('')}</ul></section>` : ''}
      <div class="heute-links">
        <a class="chip" href="#/wetter">🌤️ Wetter</a><a class="chip" href="#/regentag">☔ Regentag-Plan</a><a class="chip" href="#/nochweit">⏱️ Wie lange noch?</a>
        ${t ? '<button class="chip" data-action="day-share">📤 Tag teilen</button>' : ''}<a class="chip" href="#/pinnwand">📌 Pinnwand</a>
        ${t ? '<button class="chip" data-action="entry-form">＋ Eintrag</button>' : ''}
      </div>`;
  };
  const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

  /* ====================================================================== */
  /* Dort weitermachen, wo man war                                           */
  /* ====================================================================== */

  const SKIP = ['login', 'setup', 'reset', 'nocrew', 'offline', 'loading', 'teilen'];
  const remember = () => { if (!SKIP.includes(ui.route) && app.session && app.session()) LS.set('lastPlace', { route: ui.route, game: ui.game || null, y: Math.round(scrollY), at: Date.now() }); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') remember(); });
  addEventListener('pagehide', remember);
  let scrollSave = 0;
  addEventListener('scroll', () => { clearTimeout(scrollSave); scrollSave = setTimeout(remember, 800); }, { passive: true });
  app.chromeHooks.push(() => setTimeout(remember, 0));
  let resumed = false, restoreY = null;
  const guard = app.routeGuard;
  app.routeGuard = r => {
    const out = guard ? guard(r) : r;
    if (resumed) return out;
    resumed = true;
    const last = LS.get('lastPlace', null);
    const fresh = last && Date.now() - last.at < 12 * 36e5;
    if (!opt('resume') || !fresh || !['', '#', '#/', '#/karte'].includes(location.hash) || last.route === out) return out;
    const ok = guard ? guard(last.route) === last.route : true;
    if (!ok) return out;
    if (last.game && last.route === 'spiele') ui.game = last.game;
    restoreY = last.y || 0;
    return last.route;
  };
  app.afterDraw.push(() => {
    if (restoreY == null) return;
    const y = restoreY;
    restoreY = null;
    setTimeout(() => window.scrollTo(0, y), 80);
  });

  /* ====================================================================== */
  /* Kopfzeile wird beim Scrollen schmaler                                   */
  /* ====================================================================== */

  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    lastY = y;
    if (!opt('headSmall') || ui.route === 'karte') { document.body.classList.remove('head-small'); return; }
    if (y < 60 || dy < -8) document.body.classList.remove('head-small');
    else if (y > 120 && dy > 8) document.body.classList.add('head-small');
  }, { passive: true });
  app.chromeHooks.push(() => { if (ui.route === 'karte') document.body.classList.remove('head-small'); });

  /* ====================================================================== */
  /* Tastenkürzel am PC                                                      */
  /* ====================================================================== */

  const KEYS = [['N', 'Neuer Eintrag'], ['/', 'Suchen bzw. Eingabefeld der Seite'], ['1 – 5', 'Reiter der unteren Leiste'], ['H', 'Heute'],
    ['K', 'Kalender'], ['B', 'Tagebuch als Buch'], ['Esc', 'Fenster schließen'], ['← →', 'Fotos, Buchseiten blättern'], ['?', 'Diese Übersicht']];
  ACTIONS['keys-help'] = () => openSheet(`<div>${sheetHead('Tastenkürzel')}<dl class="keys">${KEYS.map(([k, l]) => `<div><dt><kbd>${k}</kbd></dt><dd>${l}</dd></div>`).join('')}</dl></div>`);
  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.defaultPrevented) return;
    const tg = ev.target;
    if (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
    if (document.querySelector('dialog[open]') || !app.session || !app.session()) return;
    const k = ev.key;
    if (k === 'n' || k === 'N') { ev.preventDefault(); if (ui.route !== 'tagebuch') go('tagebuch'); setTimeout(() => ACTIONS['entry-form'](), ui.route === 'tagebuch' ? 0 : 250); }
    else if (k === '/') {
      ev.preventDefault();
      const f = [...document.querySelectorAll('#view input[type=search], #view input[name=q], #view [data-action-input=pack-search], #view form.adder input, #view .pin-form input, #view .comment-form input')]
        .find(x => x.offsetParent);
      if (f) { f.focus(); f.scrollIntoView({ block: 'center' }); } else toast('Auf dieser Seite gibt es kein Eingabefeld.');
    } else if (/^[1-9]$/.test(k)) {
      const a = [...document.querySelectorAll('.tabbar a')].filter(x => !x.hidden)[+k - 1];
      if (a) { ev.preventDefault(); a.click(); }
    } else if (k === 'h' || k === 'H') go('heute');
    else if (k === 'k' || k === 'K') go('kalender');
    else if (k === 'b' || k === 'B') go('buch');
    else if (k === '?') ACTIONS['keys-help']();
  });

  /* ====================================================================== */
  /* Einstellungen: Abschnitte einklappbar, Sprungleiste                     */
  /* ====================================================================== */

  const openSet = () => LS.get('setOpen', []);
  app.afterDraw.push(view => {
    if (ui.route !== 'einstellungen') return;
    const panels = [...view.querySelectorAll('section.panel, form.panel')].filter(s => s.firstElementChild && s.firstElementChild.tagName === 'H2');
    if (panels.length < 4) return;
    const open = openSet(), all = LS.get('setOpenAll', false) === true;
    panels.forEach((s, i) => {
      const name = s.firstElementChild.textContent.trim();
      s.classList.add('fold');
      s.id = s.id || `set-${i}`;
      s.dataset.name = name;
      s.classList.toggle('open', all || open.includes(name));
      const h = s.firstElementChild;
      h.setAttribute('role', 'button'); h.tabIndex = 0;
      h.setAttribute('aria-expanded', all || open.includes(name));
    });
    const nav = document.createElement('nav');
    nav.className = 'set-jump';
    nav.setAttribute('data-noswipe', '');
    nav.innerHTML = panels.map(s => `<button data-set="${s.id}">${esc(s.dataset.name)}</button>`).join('')
      + `<button data-set-all="1">${all ? 'Alle zuklappen' : 'Alle aufklappen'}</button>`;
    const head = view.querySelector('.page-head');
    if (head) head.after(nav); else view.prepend(nav);
  });
  const toggleSet = (s, force) => {
    const on = force ?? !s.classList.contains('open');
    s.classList.toggle('open', on);
    s.firstElementChild.setAttribute('aria-expanded', on);
    const list = openSet().filter(n => n !== s.dataset.name);
    if (on) list.push(s.dataset.name);
    LS.set('setOpen', list);
  };
  document.addEventListener('click', ev => {
    const h = ev.target.closest && ev.target.closest('.panel.fold > h2');
    if (h) { toggleSet(h.parentElement); return; }
    const b = ev.target.closest && ev.target.closest('.set-jump button');
    if (!b) return;
    if (b.dataset.setAll) {
      const all = LS.get('setOpenAll', false) !== true;
      LS.set('setOpenAll', all);
      if (!all) LS.set('setOpen', []);
      render();
      return;
    }
    const s = document.getElementById(b.dataset.set);
    if (!s) return;
    toggleSet(s, true);
    const top = ((document.querySelector('.topbar') || {}).getBoundingClientRect?.().bottom || 0) + 56;
    window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - top, behavior: 'smooth' });
  });
  document.addEventListener('keydown', ev => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('.panel.fold > h2')) { ev.preventDefault(); toggleSet(ev.target.parentElement); }
  });

  /* ====================================================================== */
  /* Offline ehrlich anzeigen                                                */
  /* ====================================================================== */

  const NET = ['near', 'near-go', 'place-search', 'wx-here', 'sos-refresh', 'track-routed', 'eta-refresh', 'eta-set', 'blog-toggle', 'blog-renew',
    'blog-opts', 'blog-reload', 'places-share', 'places-link-send', 'places-link-off', 'fx', 'voice', 'voice-entry', 'backup-now', 'backups']
    .map(a => `[data-action="${a}"]`).join(',');
  function markNet(root) { root.querySelectorAll(NET).forEach(el => el.classList.add('needs-net')); }
  function netState() {
    const off = !navigator.onLine;
    document.body.classList.toggle('offline', off);
    markNet(document);
  }
  addEventListener('online', () => { netState(); toast('Wieder online. Änderungen werden abgeglichen.'); });
  addEventListener('offline', () => { netState(); toast('Kein Netz. Alles Eingetragene wird gesammelt und später abgeglichen.'); });
  app.afterDraw.push(view => { markNet(view); markNet(document.getElementById('mapview')); });
  new MutationObserver(() => markNet(document.getElementById('sheetBody'))).observe(document.getElementById('sheetBody'), { childList: true });
  netState();
  // Falls doch jemand tippt (z. B. per Tastatur): freundlich erklären statt Fehlermeldung
  document.addEventListener('click', ev => {
    if (navigator.onLine) return;
    const b = ev.target.closest && ev.target.closest('.needs-net');
    if (!b) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    toast('Das braucht Internet. Bitte später noch einmal versuchen.');
  }, true);

  /* ====================================================================== */
  /* Speicherplatz                                                           */
  /* ====================================================================== */

  const mb = n => `${(n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: n < 10485760 ? 1 : 0 })} MB`;
  async function photoIndex() {
    // Foto → Reise (Einträge, Reisefotos, Tickets)
    const map = new Map();
    S.entries.forEach(e => (e.photos || []).forEach(p => map.set(p.id, e.tripId)));
    S.games.forEach(g => { if (g.photoId) map.set(g.photoId, g.tripId); (g.images || []).forEach(im => map.set(im.id, g.tripId)); });
    return map;
  }
  async function measure() {
    const out = { total: null, quota: null, photos: 0, photoBytes: 0, tiles: 0, byTrip: {} };
    try { const e = await navigator.storage.estimate(); out.total = e.usage; out.quota = e.quota; } catch { /* nicht verfügbar */ }
    const idx = await photoIndex();
    try {
      const c = await caches.open('lammping-photos');
      for (const req of await c.keys()) {
        const id = new URL(req.url).searchParams.get('id');
        const r = await c.match(req);
        const size = r ? (await r.clone().blob()).size : 0;
        out.photos++; out.photoBytes += size;
        const t = idx.get(id) || '';
        out.byTrip[t] = out.byTrip[t] || { n: 0, bytes: 0 };
        out.byTrip[t].n++; out.byTrip[t].bytes += size;
      }
    } catch { /* kein Speicher */ }
    try { out.tiles = (await (await caches.open('lammping-tiles')).keys()).length; } catch { /* kein Speicher */ }
    return out;
  }
  ACTIONS['storage-check'] = async () => {
    openSheet(`<div class="storage">${sheetHead('Speicherplatz auf diesem Gerät')}<p class="sub">Wird berechnet …</p></div>`);
    const m = await measure();
    const trips = Object.entries(m.byTrip).sort((a, b) => b[1].bytes - a[1].bytes).map(([id, x]) => {
      const t = S.trips.find(y => y.id === id);
      return `<li><span class="txt"><b>${t ? esc(t.name) : 'Ohne Reise'}</b><small>${x.n} Fotos · ${mb(x.bytes)}${t && t.archived ? ' · Archiv' : ''}</small></span>
        ${t ? `<button class="ghost small-btn" data-action="storage-free" data-id="${t.id}">Vom Handy entfernen</button>` : ''}</li>`;
    }).join('');
    const body = document.querySelector('#sheetBody .storage');
    if (!body) return;
    body.innerHTML = `${sheetHead('Speicherplatz auf diesem Gerät')}
      ${m.total != null ? `<div class="storage-bar"><i style="width:${Math.min(100, (m.total / m.quota) * 100).toFixed(1)}%"></i></div>
        <p>LAMMping belegt <b>${mb(m.total)}</b>${m.quota ? ` von ${mb(m.quota)} verfügbaren` : ''}.</p>` : ''}
      <dl class="facts-list"><div><dt>Gespeicherte Fotos</dt><dd>${m.photos} (${mb(m.photoBytes)})</dd></div>
        <div><dt>Kartenausschnitte</dt><dd>${m.tiles.toLocaleString('de-DE')}</dd></div></dl>
      ${trips ? `<h3 class="date-head">Fotos je Reise</h3><ul class="ledger storage-trips">${trips}</ul>` : ''}
      <p class="sub">„Vom Handy entfernen“ löscht nur die gespeicherten Bilder auf diesem Gerät. Auf dem Server bleibt alles; mit Netz werden die Fotos beim Ansehen wieder geladen.</p>
      <div class="sheet-foot"><button class="ghost" data-action="storage-tiles">Kartenausschnitte löschen</button></div>`;
  };
  ACTIONS['storage-free'] = async el => {
    const t = S.trips.find(x => x.id === el.dataset.id);
    if (!t || !confirm(`Die Fotos von „${t.name}“ von diesem Gerät entfernen? Auf dem Server bleiben sie erhalten.`)) return;
    const idx = await photoIndex();
    const c = await caches.open('lammping-photos');
    let n = 0;
    for (const req of await c.keys()) if (idx.get(new URL(req.url).searchParams.get('id')) === t.id) { await c.delete(req); n++; }
    toast(`${n} Fotos vom Gerät entfernt`);
    ACTIONS['storage-check']();
  };
  ACTIONS['storage-tiles'] = async () => {
    if (!confirm('Gespeicherte Kartenausschnitte löschen? Ohne Netz ist die Karte dann leer, bis sie wieder angesehen wurde.')) return;
    await caches.delete('lammping-tiles');
    toast('Kartenausschnitte gelöscht');
    ACTIONS['storage-check']();
  };

  /* ---------- Einstellungen: Komfort ---------- */

  settingsPanels.push(() => `<section class="panel">
    <h2>Komfort</h2>
    <label class="check"><input type="checkbox" data-action="opt-set" data-k="wakeLock"${opt('wakeLock') ? ' checked' : ''}><span>Bildschirm anlassen bei „Wie lange noch?“, Wasserwaage, Kochen, Spielen und im Einkaufsmodus</span></label>
    <label class="check"><input type="checkbox" data-action="opt-set" data-k="resume"${opt('resume') ? ' checked' : ''}><span>Beim Öffnen dort weitermachen, wo ich war (bis 12 Stunden später)</span></label>
    <label class="check"><input type="checkbox" data-action="opt-set" data-k="headSmall"${opt('headSmall') ? ' checked' : ''}><span>Kopfzeile beim Herunterscrollen verkleinern</span></label>
    <div class="btnrow"><button class="ghost" data-action="storage-check">Speicherplatz ansehen</button><button class="ghost" data-action="keys-help">Tastenkürzel am PC</button></div>
  </section>`);
  CHANGES['opt-set'] = el => { LS.set(el.dataset.k, el.checked); syncLock(); if (el.dataset.k === 'headSmall' && !el.checked) document.body.classList.remove('head-small'); };

}
