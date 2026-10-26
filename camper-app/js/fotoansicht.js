// Foto-Vollbild: Tipp auf ein Foto öffnet es bildschirmfüllend. Wischen zum nächsten (im Tagebuch auch über
// Einträge hinweg), mit zwei Fingern oder Doppeltipp zoomen, Pfeiltasten und Esc am PC.

export default function installFotoansicht(app) {
  const { S, ui, esc, icon, fmtDay, fmtTime, TYPES } = app;

  // Reihenfolge der Fotos: im Tagebuch alle Fotos der Reise so, wie sie gerade angezeigt werden
  function sequence(img) {
    const scope = img.closest('#view .timeline, .entry-view, .book-page, .gallery, .album, #view') || document;
    const imgs = [...scope.querySelectorAll('img[data-photo]')].filter(i => !i.closest('.no-viewer'));
    const seen = new Set();
    const list = imgs.filter(i => !seen.has(i.dataset.photo) && seen.add(i.dataset.photo)).map(i => {
      const stop = i.closest('.stop');
      const entryId = (stop && stop.querySelector('[data-action=open-entry]')?.dataset.id) || i.closest('[data-entry]')?.dataset.entry
        || (i.closest('.entry-view') && view.entryOf(i.dataset.photo));
      return { id: i.dataset.photo, thumb: i.currentSrc || i.src, entryId };
    });
    // Im Tagebuch: auch die weiteren Fotos eines Eintrags, die nur als „+3“ angedeutet sind
    if (scope.matches && scope.matches('.timeline')) {
      const full = [];
      const ids = [...new Set(list.map(x => x.entryId))];
      ids.forEach(eid => {
        const e = S.entries.find(x => x.id === eid);
        (e ? e.photos || [] : list.filter(x => x.entryId === eid)).forEach(p => full.push({ id: p.id, thumb: p.thumb, entryId: eid }));
      });
      return { list: full, index: Math.max(0, full.findIndex(x => x.id === img.dataset.photo)) };
    }
    return { list, index: Math.max(0, list.findIndex(x => x.id === img.dataset.photo)) };
  }

  const view = {
    entryOf: pid => (S.entries.find(e => (e.photos || []).some(p => p.id === pid)) || {}).id,
  };
  let st = null;          // { list, index, scale, x, y }
  let box = null;

  function open(list, index) {
    st = { list, index, scale: 1, x: 0, y: 0 };
    // Eigenes modales Fenster: liegt so auch über einem geöffneten Eintrag
    box = document.createElement('dialog');
    box.className = 'photo-viewer';
    box.innerHTML = `<div class="pv-stage"><img class="pv-img" alt=""></div>
      <button class="pv-btn pv-close" data-pv="close" aria-label="Schließen">${icon('close')}</button>
      <button class="pv-btn pv-prev" data-pv="prev" aria-label="Voriges Foto">‹</button>
      <button class="pv-btn pv-next" data-pv="next" aria-label="Nächstes Foto">›</button>
      <div class="pv-cap"></div>`;
    document.body.appendChild(box);
    box.showModal();
    box.addEventListener('cancel', ev => { ev.preventDefault(); close(); });
    document.body.classList.add('pv-open');
    bind();
    show();
    if (app.pushBack) app.pushBack(() => close(true));
  }
  function close(fromBack) {
    if (!box) return;
    box.close(); box.remove(); box = null; st = null;
    document.body.classList.remove('pv-open');
    if (!fromBack && app.popBack) app.popBack();
  }
  app.openPhotos = open;

  function show() {
    const p = st.list[st.index];
    const img = box.querySelector('.pv-img');
    st.scale = 1; st.x = 0; st.y = 0; apply();
    img.src = p.thumb;
    app.store().get('photos', p.id).then(d => { if (d && d.data && st && st.list[st.index].id === p.id) img.src = d.data; }).catch(() => {});
    // Nachbarn vorladen
    [st.index - 1, st.index + 1].forEach(i => { const q = st.list[i]; if (q) app.store().get('photos', q.id).then(d => { if (d && d.data) new Image().src = d.data; }).catch(() => {}); });
    const e = p.entryId && S.entries.find(x => x.id === p.entryId);
    box.querySelector('.pv-cap').innerHTML = `${e ? `<b>${esc(e.title || TYPES[e.type].label)}</b><small>${fmtDay(e.date.slice(0, 10))}, ${fmtTime(e.date)}${e.place ? ` · ${esc(e.place)}` : ''}</small>` : ''}
      <span class="pv-n">${st.index + 1} / ${st.list.length}</span>${e && ui.route !== 'buch' ? `<button class="link" data-pv="entry">Zum Eintrag</button>` : ''}
      ${app.coloring ? `<button class="link" data-action="col-from-viewer" data-id="${p.id}">🖍️ Ausmalbild</button>` : ''}`;
    box.querySelector('.pv-prev').hidden = st.index === 0;
    box.querySelector('.pv-next').hidden = st.index === st.list.length - 1;
  }
  function apply(anim) {
    const img = box.querySelector('.pv-img');
    img.style.transition = anim ? 'transform .2s ease-out' : 'none';
    img.style.transform = `translate(${st.x}px, ${st.y}px) scale(${st.scale})`;
  }
  function step(d) {
    const i = st.index + d;
    if (i < 0 || i >= st.list.length) { st.x = 0; apply(true); return; }
    st.index = i; show();
  }
  const clamp = () => {
    const img = box.querySelector('.pv-img');
    const mx = Math.max(0, (img.clientWidth * st.scale - innerWidth) / 2), my = Math.max(0, (img.clientHeight * st.scale - innerHeight) / 2);
    st.x = Math.max(-mx, Math.min(mx, st.x)); st.y = Math.max(-my, Math.min(my, st.y));
  };

  function bind() {
    const stage = box.querySelector('.pv-stage');
    const pts = new Map();
    let start = null, pinch = null, lastTap = 0, moved = false;
    stage.addEventListener('pointerdown', ev => {
      stage.setPointerCapture(ev.pointerId);
      pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      moved = false;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), scale: st.scale };
      } else start = { x: ev.clientX, y: ev.clientY, sx: st.x, sy: st.y, t: Date.now() };
    });
    stage.addEventListener('pointermove', ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        st.scale = Math.max(1, Math.min(5, pinch.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
        clamp(); apply(); moved = true;
        return;
      }
      if (!start) return;
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (st.scale > 1) { st.x = start.sx + dx; st.y = start.sy + dy; clamp(); apply(); } else { st.x = dx; apply(); }
    });
    const end = ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.delete(ev.pointerId);
      if (pinch) { if (pts.size < 2) { pinch = null; start = null; if (st.scale < 1.05) { st.scale = 1; st.x = 0; st.y = 0; apply(true); } } return; }
      if (!start) return;
      const dx = ev.clientX - start.x, fast = Date.now() - start.t < 300;
      if (st.scale === 1 && moved) {
        if (dx < -innerWidth * 0.18 || (fast && dx < -40)) step(1);
        else if (dx > innerWidth * 0.18 || (fast && dx > 40)) step(-1);
        else { st.x = 0; apply(true); }
      } else if (!moved) {
        // Doppeltipp: zoomen bzw. zurück
        if (Date.now() - lastTap < 300) { st.scale = st.scale > 1 ? 1 : 2.5; st.x = 0; st.y = 0; apply(true); lastTap = 0; } else lastTap = Date.now();
      }
      start = null;
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', ev => { ev.preventDefault(); st.scale = Math.max(1, Math.min(5, st.scale * (ev.deltaY < 0 ? 1.15 : 0.87))); if (st.scale === 1) { st.x = 0; st.y = 0; } clamp(); apply(); }, { passive: false });
    box.addEventListener('click', ev => {
      const b = ev.target.closest('[data-pv]');
      if (!b) return;
      ev.stopPropagation();
      const k = b.dataset.pv;
      if (k === 'close') close();
      if (k === 'prev') step(-1);
      if (k === 'next') step(1);
      if (k === 'entry') { const id = st.list[st.index].entryId; close(); setTimeout(() => app.openEntry(id), 50); }
    });
  }
  document.addEventListener('keydown', ev => {
    if (!box) return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    if (ev.key === 'ArrowRight') step(1);
    if (ev.key === 'ArrowLeft') step(-1);
  });

  // Tipp auf ein Foto (statt den Eintrag zu öffnen)
  document.addEventListener('click', ev => {
    const img = ev.target.closest && ev.target.closest('img[data-photo]');
    if (!img || box || img.closest('.photo-grid, .no-viewer, form, #selBar') || document.body.classList.contains('selecting')) return;
    ev.preventDefault();
    ev.stopPropagation();
    const { list, index } = sequence(img);
    if (list.length) open(list, index);
  }, true);
}
