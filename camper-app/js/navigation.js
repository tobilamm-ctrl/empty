// Navigation: Zurück-Taste (Android) schließt erst Fenster und Spiele, Wischen zwischen den Reitern der unteren Leiste,
// untere Leiste je Person selbst zusammenstellen (Weggelassenes erscheint unter „Mehr“) und am großen Bildschirm
// die Karte links neben dem Tagebuch.

export default function installNavigation(app) {
  const { S, ui, LS, VIEWS, ACTIONS, esc, icon, save, render, go, me, chromeHooks, settingsPanels } = app;

  /* ====================================================================== */
  /* Zurück-Taste: eigene Einträge im Verlauf für Fenster, Spiele, Anordnen  */
  /* ====================================================================== */

  const marks = [];          // { hash, kind: 'sheet' | 'fn', fn }
  let ignorePop = false, closingByPop = false;
  const push = (kind, fn) => {
    history.pushState({ lp: marks.length + 1 }, '', location.href);
    marks.push({ hash: location.hash, kind, fn });
  };
  app.pushBack = fn => push('fn', fn);
  // Eigener Zurück-Eintrag per Knopf erledigt (z. B. „Fertig“): Verlaufseintrag wieder entfernen
  app.popBack = () => {
    const top = marks[marks.length - 1];
    if (top && top.kind === 'fn' && top.hash === location.hash) { marks.pop(); ignorePop = true; history.back(); }
  };
  app.onSheetOpen = () => push('sheet');
  const sheetClosed = app.onSheetClose;      // z. B. Entwürfe (eintragen.js)
  app.onSheetClose = () => {
    if (sheetClosed) sheetClosed();
    const top = marks[marks.length - 1];
    if (!top || top.kind !== 'sheet' || closingByPop) return;
    marks.pop();
    // Fenster per Knopf geschlossen: den eigenen Verlaufseintrag wieder entfernen (nur, wenn die Seite gleich geblieben ist)
    if (top.hash === location.hash) { ignorePop = true; history.back(); }
  };
  window.addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; return; }
    const top = marks[marks.length - 1];
    if (!top) return;
    if (top.hash !== location.hash) { marks.length = 0; return; }   // eine echte Seitennavigation
    marks.pop();
    if (top.kind === 'sheet') {
      const dlg = document.getElementById('sheet');
      if (dlg && dlg.open) { closingByPop = true; app.closeSheet(); closingByPop = false; }
    } else if (top.fn) top.fn();
  });
  // Spiel geöffnet oder Kacheln anordnen: Zurück führt zur Übersicht
  const wrapBack = (name, isOpen, undo) => {
    const fn = ACTIONS[name];
    ACTIONS[name] = (el, ev) => { const was = isOpen(); fn(el, ev); if (!was && isOpen()) app.pushBack(undo); };
  };
  wrapBack('game-open', () => !!ui.game, () => { ui.game = null; render(); });
  wrapBack('board-edit', () => !!ui.boardEdit, () => { ui.boardEdit = null; render(); });

  /* ====================================================================== */
  /* Untere Leiste selbst zusammenstellen                                    */
  /* ====================================================================== */

  // Symbole der festen Reiter aus index.html übernehmen
  const bar = document.querySelector('.tabbar');
  const svgOf = tab => { const a = bar.querySelector(`a[data-tab="${tab}"] svg`); return a ? a.outerHTML : ''; };
  const CORE = { karte: ['Karte', 'karte', 'Eure Route und Orte'], tagebuch: ['Tagebuch', 'tagebuch', 'Alle Tage der Reise'],
    listen: ['Listen', 'listen', 'Einkauf und Merklisten'], packen: ['Boxen & Fächer', 'boxen', 'Was liegt wo?'] };
  const CORE_SVG = Object.fromEntries(['kinder', 'mehr', ...Object.keys(CORE)].map(k => [k, svgOf(k)]));
  const DEFAULT = ['karte', 'tagebuch', 'listen', 'packen'];
  const MAX = 4;
  const barId = () => 'bar_' + me();
  const myBar = () => {
    const d = S.meta.find(m => m.id === barId());
    const list = d && Array.isArray(d.tabs) ? d.tabs : DEFAULT;
    return list.filter(k => (CORE[k] || (app.TILES || []).some(t => t.route === k)) && (!app.allowed || app.allowed(k))).slice(0, MAX);
  };
  app.myBar = myBar;
  const label = k => (CORE[k] ? CORE[k][0] : ((app.TILES || []).find(t => t.route === k) || {}).title || k);
  const tabIcon = k => CORE_SVG[k] || `<svg aria-hidden="true"><use href="#p-${((app.TILES || []).find(t => t.route === k) || {}).art || 'mehr'}"/></svg>`;
  // Feste Reiter, die nicht in der Leiste stehen, erscheinen als Kacheln unter „Mehr“
  app.barExtras = () => Object.entries(CORE).filter(([k]) => !myBar().includes(k) && (!app.allowed || app.allowed(k)))
    .map(([k, [title, art, text]]) => ({ route: k, art, title, text }));

  let built = '';
  chromeHooks.unshift(() => {
    if (!bar || !app.session || !app.session()) return;
    const tabs = myBar();
    const key = tabs.join(',');
    if (key !== built) {
      built = key;
      bar.innerHTML = `<a href="#/kinder" data-tab="kinder" hidden>${CORE_SVG.kinder}<span>Start</span></a>
        ${tabs.map(k => `<a href="#/${k}" data-tab="${k}">${tabIcon(k)}<span>${esc(label(k))}</span></a>`).join('')}
        <a href="#/mehr" data-tab="mehr">${CORE_SVG.mehr}<span>Mehr</span></a>`;
    }
    const cur = tabs.includes(ui.route) ? ui.route : ui.route === 'kinder' ? 'kinder' : 'mehr';
    bar.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.tab === cur));
  });

  function barEditor() {
    const tabs = myBar();
    const options = [...Object.keys(CORE), ...(app.TILES || []).map(t => t.route)]
      .filter(k => k !== 'mehr' && !tabs.includes(k) && (!app.allowed || app.allowed(k)))
      .filter(k => { const t = (app.TILES || []).find(x => x.route === k); return !t || ((!t.cash || app.canCash()) && (!t.admin || app.session().user.isAdmin)); });
    return `<section class="panel bar-edit"><h2>Untere Leiste</h2>
      <p class="sub">Bis zu ${MAX} Reiter, dazu immer „Mehr“. Was hier fehlt, findest du als Kachel unter „Mehr“.</p>
      <div class="chips wrap">${tabs.map((k, i) => `<span class="chip on bar-chip">${i + 1}. ${esc(label(k))}
        <button class="bar-x" data-action="bar-del" data-k="${k}" aria-label="${esc(label(k))} aus der Leiste nehmen">${icon('close')}</button></span>`).join('')}
        <span class="chip bar-fixed">Mehr</span></div>
      ${tabs.length < MAX ? `<p class="sub">Hinzufügen:</p><div class="chips wrap">${options.map(k =>
        `<button class="chip" data-action="bar-add" data-k="${k}">${icon('plus')}${esc(label(k))}</button>`).join('')}</div>`
        : '<p class="sub">Die Leiste ist voll. Nimm einen Reiter heraus, um einen anderen hineinzunehmen.</p>'}
      <button class="link" data-action="bar-reset">Wie am Anfang (Karte, Tagebuch, Listen, Boxen)</button></section>`;
  }
  const saveBar = tabs => save('meta', { id: barId(), tabs });
  ACTIONS['bar-del'] = el => saveBar(myBar().filter(k => k !== el.dataset.k));
  ACTIONS['bar-add'] = el => saveBar([...myBar(), el.dataset.k].slice(0, MAX));
  ACTIONS['bar-reset'] = () => saveBar(DEFAULT);
  const mehr = VIEWS.mehr;
  VIEWS.mehr = () => {
    const html = mehr();
    if (ui.boardEdit !== 'mehr') return html;
    const at = html.indexOf('<div class="field"><span>Größe der Kacheln');
    return at < 0 ? html + barEditor() : html.slice(0, at) + barEditor() + html.slice(at);
  };

  /* ====================================================================== */
  /* Wischen zwischen den Reitern                                            */
  /* ====================================================================== */

  const swipeOn = () => LS.get('swipeTabs', true) !== false;
  const order = () => [...bar.querySelectorAll('a:not([hidden])')].map(a => a.dataset.tab);
  // Nur auf den Hauptseiten der Leiste, nicht in Spielen, Unterseiten oder beim Anordnen
  const onMainPage = () => order().includes(ui.route) && !ui.game && !ui.boardEdit;
  function neighbour(dir) {
    const o = order(), cur = bar.querySelector('a.on');
    const i = o.indexOf(cur ? cur.dataset.tab : ui.route);
    return i < 0 ? null : o[i + dir] || null;
  }
  // Elemente, die selbst seitlich wischen oder malen
  const blocked = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.matches && n.matches('input, textarea, select, canvas, .leaflet-container, .tiles.editing, [data-noswipe], .sheet')) return true;
      if (n.scrollWidth > n.clientWidth + 2) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return true; }
    }
    return false;
  };
  let sw = null;
  const view = document.getElementById('view');
  const header = document.querySelector('.topbar');
  function start(ev, area) {
    if (!swipeOn() || ev.touches.length !== 1 || document.querySelector('dialog[open]')) return;
    const t = ev.touches[0];
    if (t.clientX < 24 || t.clientX > innerWidth - 24) return;           // Rand: Zurück-Geste des Systems
    if (area === 'view' && (!onMainPage() || blocked(ev.target))) return;
    if (area === 'head' && !order().includes(ui.route) && ui.route !== 'karte') return;
    sw = { x: t.clientX, y: t.clientY, t: Date.now(), dx: 0, lock: null, area };
  }
  function move(ev) {
    if (!sw) return;
    const t = ev.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.lock) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      sw.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
      if (sw.lock === 'y') { sw = null; return; }
    }
    ev.preventDefault();
    sw.dx = dx;
    if (sw.area === 'view') {
      const can = neighbour(dx < 0 ? 1 : -1);
      view.style.transition = 'none';
      view.style.transform = `translateX(${can ? dx * 0.9 : dx * 0.25}px)`;
      view.style.opacity = String(1 - Math.min(0.35, Math.abs(dx) / innerWidth));
    }
  }
  function end() {
    if (!sw) return;
    const s = sw; sw = null;
    if (s.lock !== 'x') return;
    const dir = s.dx < 0 ? 1 : -1, target = neighbour(dir);
    const fast = Math.abs(s.dx) > 50 && Math.abs(s.dx) / (Date.now() - s.t) > 0.45;
    const enough = Math.abs(s.dx) > innerWidth * 0.22 || fast;
    const reset = () => { view.style.transition = 'transform .18s ease-out, opacity .18s'; view.style.transform = ''; view.style.opacity = ''; };
    if (!target || !enough) { if (s.area === 'view') reset(); return; }
    if (s.area === 'view') {
      view.style.transition = 'transform .14s ease-in, opacity .14s';
      view.style.transform = `translateX(${-dir * innerWidth}px)`;
      view.style.opacity = '0';
      setTimeout(() => {
        go(target);
        view.style.transition = 'none';
        view.style.transform = `translateX(${dir * innerWidth * 0.35}px)`;
        requestAnimationFrame(() => requestAnimationFrame(reset));
      }, 140);
    } else go(target);
  }
  view.addEventListener('touchstart', ev => start(ev, 'view'), { passive: true });
  if (header) header.addEventListener('touchstart', ev => start(ev, 'head'), { passive: true });
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', () => { if (sw && sw.area === 'view') { view.style.transform = ''; view.style.opacity = ''; } sw = null; });

  /* ====================================================================== */
  /* Großer Bildschirm: Karte links neben dem Tagebuch                       */
  /* ====================================================================== */

  const splitPref = () => LS.get('splitView', true) !== false;
  app.splitOn = route => route === 'tagebuch' && splitPref() && innerWidth >= 1100 && (!app.allowed || app.allowed('karte'));
  let wasWide = innerWidth >= 1100;
  window.addEventListener('resize', () => { const w = innerWidth >= 1100; if (w !== wasWide) { wasWide = w; render(); } });
  // Eintrag antippen: auf der Karte daneben zeigen
  const openEntry = ACTIONS['open-entry'];
  ACTIONS['open-entry'] = el => {
    if (document.body.classList.contains('split')) {
      const e = S.entries.find(x => x.id === el.dataset.id);
      if (e && typeof e.lat === 'number') { app.setPendingFocus({ lat: e.lat, lng: e.lng, id: e.id }); render(); }
    }
    openEntry(el);
  };

  /* ---------- Karte folgt beim Scrollen dem Tagebuch ---------- */

  // Die Karte zeigt die Stopps, die rechts gerade zu sehen sind, und hebt deren Strecke hervor
  const followOn = () => LS.get('splitFollow', true) !== false;
  let follow = null, followKey = '', moved = false, ticking = false;
  const layer = () => { if (!follow && app.map && window.L) follow = L.layerGroup().addTo(app.map); return follow; };
  const clearFollow = () => { if (follow) follow.clearLayers(); followKey = ''; };
  const withPos = e => e && typeof e.lat === 'number' && typeof e.lng === 'number';
  function visibleStops() {
    const top = (document.querySelector('.topbar') || {}).offsetHeight || 0;
    const bottom = innerHeight - ((document.querySelector('.tabbar') || {}).offsetHeight || 0);
    return [...document.querySelectorAll('#view .stop [data-action=open-entry]')].filter(b => {
      const r = b.getBoundingClientRect();
      return r.bottom > top + 20 && r.top < bottom - 20;
    }).map(b => b.dataset.id);
  }
  function updateFollow(force) {
    ticking = false;
    if (!document.body.classList.contains('split') || ui.route !== 'tagebuch' || !followOn() || !app.map || !layer()) return;
    const t = app.currentTrip();
    if (!t) return;
    const all = app.tripEntries(t).filter(withPos).sort(app.byDate);
    const ids = new Set(visibleStops());
    const seen = all.filter(e => ids.has(e.id));
    // Ganz oben (Heute-Karte) oder nichts mit Position im Bild: ganze Reise
    const key = seen.length && scrollY > 80 ? seen.map(e => e.id).join() : 'ganz';
    if (key === followKey && !force) return;
    followKey = key;
    follow.clearLayers();
    if (key === 'ganz') {
      if (moved && all.length) { app.map.flyToBounds(all.map(e => [e.lat, e.lng]), { padding: [40, 40], maxZoom: 13, duration: 0.6 }); moved = false; }
      return;
    }
    // Den Weg vom Stopp davor mitzeigen, damit man sieht, woher die Fahrt kam
    const i0 = all.indexOf(seen[0]);
    const part = (i0 > 0 ? [all[i0 - 1]] : []).concat(all.slice(i0, all.indexOf(seen[seen.length - 1]) + 1));
    const ll = part.map(e => [e.lat, e.lng]);
    const color = '#E4572E';   // Korallrot hebt sich von der Reisefarbe ab
    // Strecke je Tag durchgezogen; der Wechsel über Nacht (vom Stellplatz zum nächsten Tag) gestrichelt
    const day = e => e.date.slice(0, 10);
    for (let i = 1; i < part.length; i++) {
      const seg = [[part[i - 1].lat, part[i - 1].lng], [part[i].lat, part[i].lng]];
      const night = day(part[i - 1]) !== day(part[i]);
      L.polyline(seg, { color: '#fff', weight: night ? 8 : 11, opacity: 0.85, interactive: false }).addTo(follow);
      L.polyline(seg, { color, weight: night ? 4 : 6, opacity: 0.95, dashArray: night ? '2 10' : null, interactive: false }).addTo(follow);
    }
    // Fahrtrichtung: kleine Pfeile auf längeren Abschnitten, erst wenn die Karte angekommen ist
    let drawn = false;
    const arrows = () => {
      if (drawn || followKey !== key || !follow) return;
      drawn = true;
      for (let i = 1; i < part.length; i++) {
        const a = app.map.latLngToLayerPoint([part[i - 1].lat, part[i - 1].lng]), b = app.map.latLngToLayerPoint([part[i].lat, part[i].lng]);
        const len = a.distanceTo(b);
        if (len < 70) continue;
        const deg = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        // Lange Abschnitte bekommen mehrere Pfeile, etwa alle 160 Pixel
        const k = Math.min(4, Math.max(1, Math.floor(len / 160)));
        for (let j = 1; j <= k; j++) {
          const f = j / (k + 1);
          const ll = app.map.layerPointToLatLng(L.point(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f));
          L.marker(ll, { interactive: false, keyboard: false, zIndexOffset: 600,
            icon: L.divIcon({ className: 'dir-arrow', html: `<svg viewBox="0 0 20 20" style="transform:rotate(${deg.toFixed(0)}deg)"><path d="M5 4l10 6-10 6 3-6z"/></svg>`, iconSize: [20, 20], iconAnchor: [10, 10] }) }).addTo(follow);
        }
      }
    };
    app.map.once('moveend', () => setTimeout(arrows, 30));
    setTimeout(arrows, 1200);   // falls die Karte schon an der richtigen Stelle war
    seen.forEach(e => L.circleMarker([e.lat, e.lng], { radius: 17, color, weight: 3, fill: false, interactive: false, className: 'follow-ring' }).addTo(follow));
    // Beginn eines Tages: ausgefüllter Kreis mit der Tagesnummer
    const first = app.tripStats(t).firstDay;
    part.forEach((e, i) => {
      const prev = i ? part[i - 1] : all[all.indexOf(e) - 1];
      if (prev && day(prev) === day(e)) return;
      const n = first ? Math.round((new Date(day(e) + 'T12:00') - new Date(first + 'T12:00')) / 864e5) + 1 : 0;
      L.marker([e.lat, e.lng], { interactive: false, zIndexOffset: 800, keyboard: false,
        icon: L.divIcon({ className: 'day-start', html: `<b>${n > 0 ? n : '•'}</b><span>${n > 0 ? `Tag ${n}` : app.fmtShort(day(e))}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(follow);
    });
    moved = true;
    const view = seen.map(e => [e.lat, e.lng]);
    if (view.length === 1) app.map.flyTo(view[0], Math.max(app.map.getZoom(), 12), { duration: 0.6 });
    else app.map.flyToBounds(view, { padding: [60, 60], maxZoom: 14, duration: 0.6 });
  }
  addEventListener('scroll', () => { if (!ticking && document.body.classList.contains('split')) { ticking = true; setTimeout(() => requestAnimationFrame(() => updateFollow()), 120); } }, { passive: true });
  app.afterDraw.push(() => setTimeout(() => updateFollow(true), 60));
  // Maus über einem Eintrag: auf der Karte kurz markieren
  let hoverMark = null;
  document.addEventListener('mouseover', ev => {
    if (!document.body.classList.contains('split') || !follow) return;
    const b = ev.target.closest && ev.target.closest('#view .stop [data-action=open-entry]');
    const e = b && S.entries.find(x => x.id === b.dataset.id);
    if (hoverMark) { follow.removeLayer(hoverMark); hoverMark = null; }
    if (withPos(e)) hoverMark = L.circleMarker([e.lat, e.lng], { radius: 24, color: '#E4572E', weight: 4, fill: false, interactive: false }).addTo(follow);
  });
  // Zurück auf die große Karte: wieder die ganze Reise zeigen
  app.chromeHooks.push(() => {
    if (ui.route !== 'tagebuch' && moved) { clearFollow(); moved = false; if (app.refit) app.refit(); }
  });

  /* ---------- Einstellungen ---------- */

  settingsPanels.push(() => `<section class="panel">
    <h2>Bedienung</h2>
    <label class="check"><input type="checkbox" data-action="nav-swipe"${swipeOn() ? ' checked' : ''}><span>Zwischen den Reitern der unteren Leiste wischen</span></label>
    <label class="check"><input type="checkbox" data-action="nav-split"${splitPref() ? ' checked' : ''}><span>Am großen Bildschirm Karte neben dem Tagebuch zeigen</span></label>
    <label class="check"><input type="checkbox" data-action="nav-follow"${followOn() ? ' checked' : ''}><span>Karte folgt beim Scrollen den Einträgen im Tagebuch</span></label>
    <p class="sub">Die untere Leiste stellst du unter „Mehr“ → „Kacheln anordnen“ zusammen.</p></section>`);
  app.CHANGES['nav-swipe'] = el => LS.set('swipeTabs', el.checked);
  app.CHANGES['nav-split'] = el => { LS.set('splitView', el.checked); render(); };
  app.CHANGES['nav-follow'] = el => { LS.set('splitFollow', el.checked); if (!el.checked) clearFollow(); };
}
