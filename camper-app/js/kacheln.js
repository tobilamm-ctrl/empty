// Kachel-Tafeln (Mehr und Spiele): eigene Reihenfolge durch Ziehen, Trennlinien mit eigenem Namen,
// Kacheln ausblenden und Größe groß, mittel oder klein. Gilt je Person, auf allen ihren Geräten (meta-Dokument).

export default function installKacheln(app) {
  const { S, ui, ACTIONS, CHANGES, esc, icon, save, render, me, newId } = app;
  const SIZES = [['gross', 'Groß'], ['mittel', 'Mittel'], ['klein', 'Klein']];
  // Die Mehr-Kacheln behalten ihre bisherige Kennung, damit eigene Reihenfolgen erhalten bleiben
  const prefsId = key => (key === 'mehr' ? 'tiles_' : `${key}tiles_`) + me();
  const prefs = key => S.meta.find(m => m.id === prefsId(key)) || { id: prefsId(key), order: [], hidden: [], seps: {} };
  const boards = {};

  /* ---------- Reihenfolge mit Trennlinien ---------- */

  function entries(cfg) {
    const p = prefs(cfg.key);
    const own = (p.order || []).length > 0;
    const base = own ? p.order : cfg.defaultOrder || cfg.items.map(i => i.id);
    const seps = { ...(own ? {} : cfg.defaultSeps || {}), ...(p.seps || {}) };
    const byId = new Map(cfg.items.map(i => [i.id, i]));
    const list = [];
    for (const id of base) {
      if (id.startsWith('sep:')) { if (id.slice(4) in seps) list.push({ sep: true, id, name: seps[id.slice(4)] }); }
      else if (byId.has(id) && !list.some(x => x.id === id)) list.push(byId.get(id));
    }
    // Neue Kacheln (z. B. ein neues Spiel): hinter ihren Vorgänger aus der Grundordnung, sonst ans Ende
    const def = (cfg.defaultOrder || cfg.items.map(i => i.id)).filter(id => !id.startsWith('sep:'));
    for (const it of cfg.items) {
      if (list.some(x => x.id === it.id)) continue;
      const prev = def.slice(0, def.indexOf(it.id)).reverse().find(id => list.some(x => x.id === id));
      const at = prev ? list.findIndex(x => x.id === prev) + 1 : list.length;
      list.splice(at, 0, it);
    }
    return { list, seps, hidden: p.hidden || [], size: p.size || 'gross' };
  }
  // Speichern schreibt immer die vollständige Liste (auch die vorgegebenen Trennlinien)
  function savePrefs(key, patch = {}) {
    const e = entries(boards[key]);
    save('meta', { ...prefs(key), order: e.list.map(x => x.id), seps: e.seps, hidden: e.hidden, size: e.size, ...patch });
  }

  /* ---------- Darstellung ---------- */

  const ico = i => (i.art ? `<svg class="ico" aria-hidden="true"><use href="#p-${i.art}"/></svg>` : i.icon || '');
  function tileHtml(cfg, i, size) {
    if (size === 'gross' && cfg.large) return cfg.large(i);
    const tag = i.href ? 'a' : 'button';
    const attrs = i.href ? `href="${i.href}"${i.external ? ' target="_blank" rel="noopener"' : ''}` : `data-action="${i.action}" ${i.data || ''}`;
    if (size === 'gross') return `<${tag} class="tile" ${attrs}>${app.art(i.art)}<b>${esc(i.title)}</b><small>${esc(i.text)}</small>${i.badge || ''}</${tag}>`;
    return `<${tag} class="tile" ${attrs}>${ico(i)}<span class="tx"><b>${esc(i.title)}</b>${size === 'mittel' ? `<small>${esc(i.text)}</small>` : ''}</span>${i.badge || ''}</${tag}>`;
  }
  const gridClass = (cfg, size) => (cfg.gridClass ? cfg.gridClass(size) : `tiles size-${size}`);

  function view(cfg) {
    boards[cfg.key] = cfg;
    const e = entries(cfg);
    if (ui.boardEdit === cfg.key) return editView(cfg, e);
    const groups = [{ sep: null, items: [] }];
    for (const x of e.list) {
      if (x.sep) groups.push({ sep: x, items: [] });
      else if (!e.hidden.includes(x.id)) groups[groups.length - 1].items.push(x);
    }
    const nHidden = e.list.filter(x => !x.sep && e.hidden.includes(x.id)).length;
    // Trennlinien nur, wenn darunter auch etwas Sichtbares steht
    return `${groups.filter(g => g.items.length).map(g => `${g.sep ? (g.sep.name ? `<h2 class="tile-sep">${esc(g.sep.name)}</h2>` : '<hr class="tile-sep line">') : ''}
        <nav class="${gridClass(cfg, e.size)}">${g.items.map(i => tileHtml(cfg, i, e.size)).join('')}</nav>`).join('')}
      <p class="sub tile-edit-link"><button class="link" data-action="board-edit" data-k="${cfg.key}">${cfg.editLabel || 'Kacheln anordnen'}${nHidden ? ` (${nHidden} ausgeblendet)` : ''}</button></p>`;
  }

  function editView(cfg, e) {
    setTimeout(() => dragSort(document.getElementById('boardGrid')), 0);
    const tileEdit = i => `<div class="tile${e.hidden.includes(i.id) ? ' off' : ''}" data-r="${i.id}">
      <span class="grip" aria-hidden="true">⠿</span>${ico(i)}<span class="tx"><b>${esc(i.title)}</b></span>
      ${i.fixed ? '' : `<button class="icon-btn small eye" data-action="board-hide" data-k="${cfg.key}" data-id="${i.id}" aria-pressed="${!e.hidden.includes(i.id)}" aria-label="${e.hidden.includes(i.id) ? 'Einblenden' : 'Ausblenden'}">${icon(e.hidden.includes(i.id) ? 'eyeoff' : 'eye')}</button>`}</div>`;
    const sepEdit = s => `<div class="tile sep-edit" data-r="${s.id}"><span class="grip" aria-hidden="true">⠿</span>
      <input value="${esc(s.name)}" placeholder="Trennlinie ohne Namen" maxlength="40" data-action="board-sepname" data-k="${cfg.key}" data-id="${s.id}" aria-label="Name der Trennlinie">
      <button class="icon-btn small" data-action="board-sepdel" data-k="${cfg.key}" data-id="${s.id}" aria-label="Trennlinie entfernen">${icon('close')}</button></div>`;
    return `<p class="sub">Kachel kurz gedrückt halten und an die neue Stelle ziehen (mit der Maus einfach ziehen). Mit dem Auge aus- oder einblenden.
        Trennlinien teilen die Kacheln in eigene Gruppen; den Namen könnt ihr direkt hineinschreiben. Das gilt nur für dich, auf allen deinen Geräten.</p>
      <div class="field"><span>Größe der Kacheln</span><div class="seg board-size">${SIZES.map(([k, l]) =>
        `<button class="${e.size === k ? 'on' : ''}" data-action="board-size" data-k="${cfg.key}" data-s="${k}">${l}</button>`).join('')}</div></div>
      <div class="btnrow"><button class="primary" data-action="board-edit" data-k="">Fertig</button>
        <button class="ghost" data-action="board-sep" data-k="${cfg.key}">${icon('plus')}Trennlinie</button>
        <button class="ghost" data-action="board-reset" data-k="${cfg.key}">Zurücksetzen</button></div>
      <div class="tiles editing size-klein" id="boardGrid" data-k="${cfg.key}">${e.list.map(x => (x.sep ? sepEdit(x) : tileEdit(x))).join('')}</div>
      <div class="btnrow"><button class="primary" data-action="board-edit" data-k="">Fertig</button></div>`;
  }

  ACTIONS['board-edit'] = el => { ui.boardEdit = el.dataset.k || null; render(); window.scrollTo(0, 0); };
  ACTIONS['board-size'] = el => savePrefs(el.dataset.k, { size: el.dataset.s });
  ACTIONS['board-hide'] = el => {
    const e = entries(boards[el.dataset.k]), id = el.dataset.id;
    savePrefs(el.dataset.k, { hidden: e.hidden.includes(id) ? e.hidden.filter(x => x !== id) : [...e.hidden, id] });
  };
  ACTIONS['board-sep'] = el => {
    const key = el.dataset.k, e = entries(boards[key]);
    const sid = newId().slice(0, 8);
    save('meta', { ...prefs(key), order: [`sep:${sid}`, ...e.list.map(x => x.id)], seps: { ...e.seps, [sid]: '' }, hidden: e.hidden, size: e.size });
    setTimeout(() => { const inp = document.querySelector(`[data-action=board-sepname][data-id="sep:${sid}"]`); if (inp) inp.focus(); }, 120);
  };
  CHANGES['board-sepname'] = el => { const e = entries(boards[el.dataset.k]); savePrefs(el.dataset.k, { seps: { ...e.seps, [el.dataset.id.slice(4)]: el.value.trim() } }); };
  ACTIONS['board-sepdel'] = el => {
    const key = el.dataset.k, e = entries(boards[key]), id = el.dataset.id;
    const seps = { ...e.seps }; delete seps[id.slice(4)];
    save('meta', { ...prefs(key), order: e.list.map(x => x.id).filter(x => x !== id), seps, hidden: e.hidden, size: e.size });
  };
  ACTIONS['board-reset'] = el => {
    if (!confirm('Reihenfolge, Trennlinien und Auswahl auf den Anfang zurücksetzen?')) return;
    save('meta', { id: prefsId(el.dataset.k), order: [], hidden: [], seps: {}, size: entries(boards[el.dataset.k]).size });
  };

  /* ---------- Ziehen: am Handy nach kurzem Halten (sonst scrollt die Seite), mit der Maus sofort ---------- */

  let drag = null, wait = null, scroll = null;
  const stopWait = () => { if (wait) clearTimeout(wait.t); wait = null; };
  // Hat die App inzwischen neu gezeichnet, mit dem neuen Element weitermachen
  const relink = () => {
    if (drag.tile.isConnected) return true;
    const grid = document.getElementById('boardGrid');
    const tile = grid && grid.querySelector(`[data-r="${drag.tile.dataset.r}"]`);
    if (!tile) return false;
    tile.classList.add('dragging'); grid.classList.add('is-dragging');
    Object.assign(drag, { tile, grid });
    return true;
  };
  const place = (x, y) => {
    const t = drag.tile;
    t.style.transform = '';
    const r = t.getBoundingClientRect();
    t.style.transform = `translate(${x - drag.gx - r.left}px, ${y - drag.gy - r.top}px) scale(1.04)`;
  };
  const moveTo = (x, y) => {
    if (!relink()) return;
    drag.x = x; drag.y = y;
    const over = document.elementFromPoint(x, y);
    const target = over && over.closest('#boardGrid [data-r]');
    if (target && target !== drag.tile && target.parentElement === drag.grid) {
      const all = [...drag.grid.children];
      drag.grid.insertBefore(drag.tile, all.indexOf(target) < all.indexOf(drag.tile) ? target : target.nextSibling);
    }
    place(x, y);
  };
  const begin = (tile, x, y) => {
    const r = tile.getBoundingClientRect();
    drag = { tile, grid: tile.parentElement, gx: x - r.left, gy: y - r.top, x, y };
    tile.classList.add('dragging');
    drag.grid.classList.add('is-dragging');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (navigator.vibrate) navigator.vibrate(25);
    // Am Rand des Bildschirms mitscrollen
    scroll = setInterval(() => {
      const edge = drag.y < 90 ? -14 : drag.y > innerHeight - 110 ? 14 : 0;
      if (edge) { window.scrollBy(0, edge); moveTo(drag.x, drag.y); }
    }, 30);
  };
  const endDrag = () => {
    stopWait();
    if (!drag) return;
    clearInterval(scroll);
    relink();
    const { tile, grid } = drag;
    tile.classList.remove('dragging');
    tile.style.transform = '';
    grid.classList.remove('is-dragging');
    drag = null;
    const key = grid.dataset.k, e = entries(boards[key]);
    save('meta', { ...prefs(key), order: [...grid.children].map(t => t.dataset.r), seps: e.seps, hidden: e.hidden, size: e.size });
  };
  window.addEventListener('pointermove', ev => {
    if (wait && Math.hypot(ev.clientX - wait.x, ev.clientY - wait.y) > 8) stopWait();
    if (drag) { ev.preventDefault(); moveTo(ev.clientX, ev.clientY); }
  }, { passive: false });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // Während des Ziehens darf die Seite nicht scrollen
  window.addEventListener('touchmove', ev => { if (drag) ev.preventDefault(); }, { passive: false });
  app.holdDraw = () => !!drag;
  function dragSort(grid) {
    if (!grid || grid.dataset.drag) return;
    grid.dataset.drag = '1';
    grid.addEventListener('pointerdown', ev => {
      const tile = ev.target.closest('[data-r]');
      if (!tile || ev.target.closest('button, input') || ev.button > 0) return;
      const x = ev.clientX, y = ev.clientY;
      if (ev.pointerType === 'mouse') { ev.preventDefault(); begin(tile, x, y); return; }
      wait = { x, y, t: setTimeout(() => { wait = null; begin(tile, x, y); }, 280) };
    });
    grid.addEventListener('contextmenu', ev => ev.preventDefault());
  }

  app.board = { view, entries };
}
