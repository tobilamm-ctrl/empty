// Schneller eintragen: Schnellauswahl am „+ Eintrag“-Knopf, Foto-Schnellknopf, Google-Maps-Links einfügen,
// Fotos am PC hineinziehen, Entwürfe, mehrere Punkte auf einmal bearbeiten und Anheften.

export default function installEintragen(app) {
  const { S, LS, VIEWS, ACTIONS, FORMS, CHANGES, esc, icon, newId, save, remove, toast, render, openSheet, closeSheet,
    currentTrip, nowLocal, fmtDay, fmtTime, TYPES, shrink, api } = app;
  const sheetHead = app.sheetHead;

  /* ====================================================================== */
  /* Schnellauswahl: „+ Eintrag“ gedrückt halten                             */
  /* ====================================================================== */

  const QUICK = [['stellplatz', 'Stellplatz'], ['tank', 'Tanken'], ['pause', 'Pause'], ['sight', 'Sehenswert'], ['einkauf', 'Einkauf'], ['notiz', 'Notiz']];
  let fanTimer = 0, fanOpened = false;
  const closeFan = () => { const f = document.getElementById('fabFan'); if (f) f.remove(); };
  function openFan() {
    closeFan();
    const fab = document.querySelector('.fab[data-action=entry-form]');
    if (!fab) return;
    const r = fab.getBoundingClientRect();
    const fan = document.createElement('div');
    fan.id = 'fabFan';
    fan.className = 'fab-fan';
    fan.style.right = `${innerWidth - r.right}px`;
    fan.style.bottom = `${innerHeight - r.top + 10}px`;
    fan.innerHTML = `${QUICK.map(([k, l]) => `<button data-action="quick-entry" data-type="${k}">${icon(k)}<span>${l}</span></button>`).join('')}
      <label class="fan-photo">${icon('camera')}<span>Foto</span><input type="file" accept="image/*" capture="environment" data-action="photo-entry" hidden></label>`;
    document.body.appendChild(fan);
    if (navigator.vibrate) navigator.vibrate(15);
  }
  document.addEventListener('pointerdown', ev => {
    closeFanIfOutside(ev);
    const fab = ev.target.closest && ev.target.closest('.fab[data-action=entry-form]');
    if (!fab) return;
    fanOpened = false;
    clearTimeout(fanTimer);
    fanTimer = setTimeout(() => { fanOpened = true; openFan(); }, 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => document.addEventListener(t, () => clearTimeout(fanTimer)));
  function closeFanIfOutside(ev) { if (!ev.target.closest || !ev.target.closest('#fabFan, .fab[data-action=entry-form]')) closeFan(); }
  // Nach dem langen Drücken nicht zusätzlich das normale Formular öffnen; Rechtsklick am PC öffnet die Auswahl auch
  document.addEventListener('click', ev => {
    if (fanOpened && ev.target.closest && ev.target.closest('.fab[data-action=entry-form]')) { ev.stopImmediatePropagation(); ev.preventDefault(); fanOpened = false; }
  }, true);
  document.addEventListener('contextmenu', ev => {
    if (ev.target.closest && ev.target.closest('.fab[data-action=entry-form]')) { ev.preventDefault(); openFan(); }
  });
  ACTIONS['quick-entry'] = el => { closeFan(); withDraft('new', () => app.openEntryForm({ type: el.dataset.type }, { locate: true })); };

  /* ====================================================================== */
  /* Foto-Schnellknopf: Foto machen, Eintrag entsteht sofort                 */
  /* ====================================================================== */

  CHANGES['photo-entry'] = async el => {
    const f = el.files[0];
    el.value = '';
    closeFan();
    const t = currentTrip();
    if (!f) return;
    if (!t) { toast('Legt zuerst eine Reise an.'); return; }
    toast('Foto wird gespeichert …');
    let thumb, data;
    try { thumb = await shrink(f, 360, 0.7); data = await shrink(f, 1920, 0.78); } catch { toast('Das Foto ließ sich nicht lesen.'); return; }
    // Aus der Galerie gewählt: Aufnahmezeit und Ort aus dem Foto, sonst jetzt und hier
    const ex = app.readExif ? await app.readExif(f) : {};
    const fresh = !ex.date || Math.abs(new Date(ex.date) - Date.now()) < 15 * 60000;
    const id = newId(), pid = newId();
    save('photos', { id: pid, entryId: id, tripId: t.id, data });
    const e = save('entries', {
      id, tripId: t.id, by: app.me(), createdAt: Date.now(), type: 'notiz', title: '', text: '', place: '',
      date: ex.date || nowLocal(), lat: ex.lat ?? null, lng: ex.lng ?? null, acc: null, country: '', rating: 0, features: [],
      blogHide: false, cost: 0, extra: {}, photos: [{ id: pid, thumb }],
    }) || S.entries.find(x => x.id === id);
    toast('Foto-Eintrag angelegt. Antippen zum Ergänzen.');
    const fill = p => {
      const cur = S.entries.find(x => x.id === id);
      if (!cur) return;
      save('entries', { ...cur, lat: p.lat, lng: p.lng, acc: p.acc || null });
      app.placeInfo(p).then(({ name, cc }) => {
        const c2 = S.entries.find(x => x.id === id);
        if (c2 && name) save('entries', { ...c2, place: name, country: cc || c2.country });
      });
    };
    if (typeof ex.lat === 'number') fill(ex);
    else if (fresh) app.getPos().then(fill).catch(() => {});
    return e;
  };

  /* ====================================================================== */
  /* Google-Maps-Link einfügen (Ort, Name, Suche oder Link-Feld)             */
  /* ====================================================================== */

  const SHORT = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co)\//i;
  function parseMapUrl(u) {
    let s = u;
    try { s = decodeURIComponent(u.replace(/\+/g, ' ')); } catch { /* so lassen */ }
    const m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
      || s.match(/[?&](?:q|ll|query|daddr|destination|center|sll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/)
      || s.match(/geo:(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/);
    const n = s.match(/\/place\/([^/@?]+)/) || s.match(/[?&](?:q|query)=([^&]*[a-zA-ZäöüÄÖÜß][^&]*)/);
    return { lat: m ? +m[1] : null, lng: m ? +m[2] : null, name: n ? n[1].split(',')[0].trim() : '' };
  }
  async function readLink(text) {
    const url = (text.match(/(https?:\/\/\S+|geo:\S+)/) || [])[1];
    if (!url) return null;
    // Text vor dem Link (z. B. beim Teilen aus Google Maps) ist meistens der Name
    const before = text.slice(0, text.indexOf(url)).trim().split('\n')[0].trim();
    let r = parseMapUrl(url);
    if (r.lat == null && SHORT.test(url)) {
      try { const res = await api('maplink', undefined, `&u=${encodeURIComponent(url)}`); r = parseMapUrl(res.url || ''); } catch (e) {
        toast(/Unbekannte Aktion/.test(e.message) ? 'Kurzlinks brauchen die neue api/index.php auf dem Server.' : 'Der Kurzlink ließ sich nicht auflösen.');
      }
    }
    return { url, ...r, name: before || r.name };
  }
  app.readMapLink = readLink;
  document.addEventListener('paste', async ev => {
    const el = ev.target;
    const form = el.closest && el.closest('form');
    if (!form || !form.lat || !['place', 'q', 'name', 'title', 'url'].includes(el.name)) return;
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    if (!/https?:\/\/|geo:/.test(text)) return;
    ev.preventDefault();
    if (el.name === 'url') el.value = (text.match(/https?:\/\/\S+/) || [text])[0];
    toast('Link wird gelesen …');
    const r = await readLink(text);
    if (!r) return;
    const nameField = form.title || form.name;
    if (r.name && nameField && !nameField.value.trim()) nameField.value = r.name;
    if (el.name !== 'url' && el.value.includes('http')) el.value = '';
    if (r.lat != null) {
      if (form.place && el.name === 'place') form.place.value = '';
      app.setFormPos(form, { lat: r.lat, lng: r.lng }, true);
      toast(r.name ? `„${r.name}“ mit Position übernommen` : 'Position übernommen');
    } else {
      toast('In diesem Link steht keine Position. Bitte auf der Karte wählen.');
    }
    if (form.url && !form.url.value && el.name !== 'url') form.url.value = r.url;
  });

  /* ====================================================================== */
  /* Fotos am PC hineinziehen                                                */
  /* ====================================================================== */

  const hasFiles = ev => [...(ev.dataTransfer && ev.dataTransfer.types || [])].includes('Files');
  let dragLeaveTimer = 0;
  document.addEventListener('dragover', ev => {
    if (!hasFiles(ev) || !app.session()) return;
    ev.preventDefault();
    clearTimeout(dragLeaveTimer);
    document.body.classList.add('dropping');
  });
  document.addEventListener('dragleave', () => { dragLeaveTimer = setTimeout(() => document.body.classList.remove('dropping'), 80); });
  document.addEventListener('drop', async ev => {
    if (!hasFiles(ev) || !app.session()) return;
    ev.preventDefault();
    document.body.classList.remove('dropping');
    const files = [...ev.dataTransfer.files].filter(f => /^image\//.test(f.type));
    if (!files.length) { toast('Hier lassen sich nur Fotos hineinziehen.'); return; }
    const entryForm = document.querySelector('#sheet[open] form[data-form=entry]');
    if (entryForm) { app.addPhotoFiles(files); return; }
    if (document.getElementById('sheet').open) { toast('Fotos bitte auf ein offenes Eintragsfenster ziehen.'); return; }
    if (!currentTrip()) { toast('Legt zuerst eine Reise an.'); return; }
    if (files.length > 1 && app.importPhotos) { app.importPhotos(files); return; }   // mehrere: nach Zeit und Ort einsortieren
    const ex = app.readExif ? await app.readExif(files[0]) : {};
    app.openEntryForm({ type: 'notiz', date: ex.date || nowLocal(), lat: ex.lat ?? null, lng: ex.lng ?? null });
    if (typeof ex.lat === 'number') app.setFormPos(document.querySelector('#sheetBody form'), ex, true);
    app.addPhotoFiles(files);
  });

  /* ====================================================================== */
  /* Entwürfe: angefangene Einträge werden gemerkt                           */
  /* ====================================================================== */

  const stamp = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const drafts = () => LS.get('entryDrafts', {});
  const setDrafts = d => LS.set('entryDrafts', d);
  const keyOf = form => form.dataset.id || 'new';
  let saveTimer = 0, submitting = false, lastKey = null;
  async function photoCache() { try { return await caches.open('lammping-draft'); } catch { return null; } }
  async function storeDraft(form) {
    if (!form.isConnected) return;
    const fp = app.formPhotos();
    const fields = [...form.elements].filter(el => el.name && el.type !== 'file' && el.type !== 'submit' && el.type !== 'button')
      .map(el => (el.type === 'radio' || el.type === 'checkbox' ? { n: el.name, v: el.value, c: el.checked } : { n: el.name, v: el.value }));
    const title = form.title.value.trim(), text = form.text.value.trim();
    const d = drafts();
    const key = keyOf(form);
    const has = title || text || fp.add.length || form.dataset.id;
    if (!has) { delete d[key]; setDrafts(d); return; }
    d[key] = { at: Date.now(), type: (form.querySelector('[name=type]:checked') || {}).value, title, text: text.slice(0, 80), fields,
      add: fp.add.map(p => p.id), drop: fp.drop.slice() };
    setDrafts(d);
    lastKey = key;
    const c = await photoCache();
    if (c) for (const p of fp.add) if (!(await c.match(p.id))) await c.put(p.id, new Response(JSON.stringify(p)));
  }
  async function dropDraft(key) {
    const d = drafts(), x = d[key];
    if (!x) return;
    delete d[key];
    setDrafts(d);
    const c = await photoCache();
    if (c) for (const id of x.add || []) await c.delete(id);
  }
  const queue = form => { clearTimeout(saveTimer); saveTimer = setTimeout(() => storeDraft(form), 400); };
  ['input', 'change'].forEach(t => document.addEventListener(t, ev => {
    const form = ev.target.closest && ev.target.closest('form[data-form=entry]');
    if (form && !submitting) queue(form);
  }));
  // Fotos, Sterne und Position ändern sich ohne Eingabe-Ereignis: beim Schließen noch einmal sichern
  const sheetClose = app.onSheetClose;
  app.onSheetClose = () => {
    const form = document.querySelector('#sheetBody form[data-form=entry]');
    if (form && !submitting) {
      clearTimeout(saveTimer);
      storeDraft(form).then(() => { if (drafts()[keyOf(form)] && (form.title.value.trim() || form.text.value.trim() || app.formPhotos().add.length)) toast('Entwurf gespeichert'); });
    }
    if (sheetClose) sheetClose();
  };
  const submit = FORMS.entry;
  FORMS.entry = form => {
    submitting = true;
    const key = keyOf(form);
    clearTimeout(saveTimer);
    try { return submit(form); } finally { dropDraft(key); setTimeout(() => { submitting = false; }, 0); }
  };
  const delEntry = ACTIONS['del-entry'];
  ACTIONS['del-entry'] = el => { delEntry(el); if (!S.entries.some(e => e.id === el.dataset.id)) dropDraft(el.dataset.id); };

  async function restore(key) {
    const x = drafts()[key];
    const form = document.querySelector('#sheetBody form[data-form=entry]');
    if (!x || !form) return;
    const type = x.fields.find(f => f.n === 'type' && f.c);
    if (type) { const r = form.querySelector(`[name=type][value="${type.v}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }
    for (const f of x.fields) {
      if (f.n === 'type') continue;
      const els = [...form.querySelectorAll(`[name="${CSS.escape(f.n)}"]`)];
      if ('c' in f) { const el = els.find(e => e.value === f.v); if (el) el.checked = f.c; } else if (els[0]) els[0].value = f.v;
    }
    const rating = +(form.rating && form.rating.value) || 0;
    form.querySelectorAll('.stars .star').forEach((b, i) => b.classList.toggle('on', i < rating));
    if (form.lat.value && form.lng.value) { const p = document.getElementById('posText'); if (p) p.textContent = `${(+form.lat.value).toFixed(5)}, ${(+form.lng.value).toFixed(5)}`; }
    if (form.querySelector('.more-fields') && x.fields.some(f => (/^x_|^feat$|^cost$|^blogHide$/.test(f.n)) && (f.c || (!('c' in f) && f.v)))) form.querySelector('.more-fields').open = true;
    (x.drop || []).forEach(id => ACTIONS['drop-photo']({ dataset: { id } }));
    const c = await photoCache();
    if (c) for (const id of x.add || []) { const r = await c.match(id); if (r) app.addFormPhoto(await r.json()); }
    toast('Entwurf wiederhergestellt');
  }
  // Vor dem Öffnen fragen, ob es mit dem Entwurf weitergehen soll
  function withDraft(key, open) {
    const x = drafts()[key];
    if (!x || Date.now() - x.at > 14 * 864e5) { if (x) dropDraft(key); return open(); }
    openSheet(`<div class="draft-ask">${sheetHead(key === 'new' ? 'Angefangener Eintrag' : 'Ungespeicherte Änderungen')}
      <p>${icon(x.type || 'notiz')} <b>${esc(x.title || (TYPES[x.type] || {}).label || 'Eintrag')}</b>${x.text ? `<br><span class="sub">${esc(x.text)}…</span>` : ''}</p>
      <p class="sub">Gemerkt ${fmtDay(stamp(x.at).slice(0, 10))}, ${fmtTime(stamp(x.at))} Uhr${(x.add || []).length ? `, mit ${x.add.length} Foto${x.add.length > 1 ? 's' : ''}` : ''}.</p>
      <div class="sheet-foot"><button class="ghost danger" data-action="draft-drop" data-key="${key}">Verwerfen</button>
        <button class="primary" data-action="draft-go" data-key="${key}">Weiterschreiben</button></div></div>`);
    pending = open;
  }
  let pending = null;
  ACTIONS['draft-go'] = async el => { const key = el.dataset.key; pending = null; openDraftForm(key); await restore(key); };
  ACTIONS['draft-drop'] = el => { const open = pending; pending = null; dropDraft(el.dataset.key); toast('Entwurf verworfen'); if (open) open(); else closeSheet(); render(); };
  const openDraftForm = key => (key === 'new' ? app.openEntryForm({ type: 'notiz' }) : app.openEntryForm(S.entries.find(e => e.id === key)));
  const newForm = ACTIONS['entry-form'];
  ACTIONS['entry-form'] = el => withDraft('new', () => newForm(el));
  const editForm = ACTIONS['edit-entry'];
  ACTIONS['edit-entry'] = el => withDraft(el.dataset.id, () => editForm(el));
  ACTIONS['draft-resume'] = el => { pending = null; ACTIONS['draft-go'](el); };

  /* ====================================================================== */
  /* Anheften: Einträge (Listenpunkte, Listen und Orte in ihren Formularen)  */
  /* ====================================================================== */

  ACTIONS['entry-pin'] = el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e) return;
    save('entries', { ...e, pinned: !e.pinned });
    toast(e.pinned ? 'Nicht mehr angeheftet' : 'Angeheftet: steht jetzt oben im Tagebuch');
    closeSheet();
  };
  const entryButtons = app.entryButtons;
  app.entryButtons = e => `${entryButtons ? entryButtons(e) : ''}<button class="ghost" data-action="entry-pin" data-id="${e.id}">📌 ${e.pinned ? 'Lösen' : 'Anheften'}</button>`;

  // Tagebuch: Angeheftetes und angefangener Eintrag stehen oben
  const diary = VIEWS.tagebuch;
  VIEWS.tagebuch = (...a) => {
    let html = diary(...a);
    const t = currentTrip();
    if (!t || !html.includes('<div class="chips diary-chips">')) return html;
    const pinned = S.entries.filter(e => e.tripId === t.id && e.pinned).sort((x, y) => x.date.localeCompare(y.date));
    const d = drafts().new;
    const top = `${d ? `<button class="draft-banner" data-action="draft-resume" data-key="new">✏️ <span><b>Angefangener Eintrag</b>
        <small>${esc(d.title || d.text || (TYPES[d.type] || {}).label || '')}</small></span><span class="link">Weiterschreiben</span></button>` : ''}
      ${pinned.length ? `<section class="pinned-entries"><h3>📌 Angeheftet</h3><ul>${pinned.map(e => `<li><button data-action="open-entry" data-id="${e.id}">
        ${icon(e.type)}<span><b>${esc(e.title || TYPES[e.type].label)}</b><small>${fmtDay(e.date.slice(0, 10))}${e.place ? ` · ${esc(e.place)}` : ''}</small></span></button></li>`).join('')}</ul></section>` : ''}`;
    html = html.replace('<div class="chips diary-chips">', `${top}<div class="chips diary-chips">`);
    // Foto-Schnellknopf über dem Mikrofon bzw. über „+ Eintrag“
    if (html.includes('class="fab"')) {
      const pos = html.includes('fab-voice') ? ' above-voice' : '';
      html = html.replace(/(<button class="fab"[^>]*>[\s\S]*?<\/button>)/, `$1<label class="fab fab-photo${pos}" aria-label="Foto-Eintrag" title="Foto aufnehmen: wird sofort ein Eintrag">${icon('camera')}<input type="file" accept="image/*" capture="environment" data-action="photo-entry" hidden></label>`);
      html = html.replace('<button class="fab" data-action="entry-form"', '<button class="fab" data-action="entry-form" title="Gedrückt halten (oder Rechtsklick): Schnellauswahl"');
    }
    return html;
  };

  /* ====================================================================== */
  /* Mehrere auf einmal: gedrückt halten, weitere antippen                   */
  /* ====================================================================== */

  const CTX = {
    items: { sel: '.checklist > li:not(.none)', id: li => li.querySelector('[data-action=toggle-item]')?.dataset.id, coll: 'listItems', one: 'Punkt', many: 'Punkte' },
    entries: { sel: '.timeline .stop', id: li => li.querySelector('[data-action=open-entry]')?.dataset.id, coll: 'entries', one: 'Eintrag', many: 'Einträge' },
    places: { sel: '.places .place-row', id: li => li.querySelector('[data-action=place-form]')?.dataset.id, coll: 'places', one: 'Ort', many: 'Orte' },
  };
  let mode = null;                         // { ctx, ids: Set }
  const ctxOf = el => { for (const [k, c] of Object.entries(CTX)) { const li = el.closest && el.closest(c.sel); if (li && c.id(li)) return { k, li }; } return null; };
  const docs = () => [...mode.ids].map(id => S[CTX[mode.ctx].coll].find(x => x.id === id)).filter(Boolean);

  function enter(k, id) {
    mode = { ctx: k, ids: new Set([id]) };
    if (app.pushBack) app.pushBack(() => { mode = null; paint(); });
    if (navigator.vibrate) navigator.vibrate(15);
    paint();
  }
  function exit() { if (!mode) return; mode = null; paint(); }
  function toggle(id) {
    if (mode.ids.has(id)) mode.ids.delete(id); else mode.ids.add(id);
    if (!mode.ids.size) mode = null;
    paint();
  }
  function paint() {
    document.body.classList.toggle('selecting', !!mode);
    document.querySelectorAll('.sel-on').forEach(li => li.classList.remove('sel-on'));
    let bar = document.getElementById('selBar');
    if (!mode) { if (bar) bar.remove(); return; }
    const c = CTX[mode.ctx];
    const lis = [...document.querySelectorAll(c.sel)];
    if (!lis.length) { mode = null; if (bar) bar.remove(); document.body.classList.remove('selecting'); return; }
    lis.forEach(li => li.classList.toggle('sel-on', mode.ids.has(c.id(li))));
    if (!bar) { bar = document.createElement('div'); bar.id = 'selBar'; bar.className = 'sel-bar'; document.body.appendChild(bar); }
    const n = mode.ids.size, list = docs();
    const allPinned = list.length && list.every(d => d.pinned);
    const btn = (a, l, cls = '') => `<button class="${cls}" data-action="sel-${a}">${l}</button>`;
    const acts = {
      items: [list.every(i => i.done) ? btn('undone', '↺ Wieder offen') : btn('done', '✓ Abhaken'), btn('move', '➜ In Liste …'), btn('pin', allPinned ? '📌 Lösen' : '📌 Anheften'), btn('del', 'Löschen', 'danger')],
      entries: [btn('pin', allPinned ? '📌 Lösen' : '📌 Anheften'), btn('trip', '➜ In Reise …'), btn('del', 'Löschen', 'danger')],
      places: [btn('pin', allPinned ? '📌 Lösen' : '📌 Anheften'), btn('trip', '➜ Für Reise …'), btn('visited', '✓ Besucht'), btn('del', 'Löschen', 'danger')],
    }[mode.ctx];
    bar.innerHTML = `<b>${n} ${n === 1 ? c.one : c.many}</b><div class="sel-acts">${acts.join('')}</div>
      <button class="sel-all" data-action="sel-all">Alle</button><button class="primary" data-action="sel-exit">Fertig</button>`;
  }
  app.afterDraw.push(() => { if (mode) paint(); });
  app.chromeHooks.push(() => { if (mode && !document.querySelector(CTX[mode.ctx].sel)) exit(); });

  let pressTimer = 0, pressStart = null, pressed = false;
  document.addEventListener('pointerdown', ev => {
    pressed = false;
    if (ev.button > 0 || !ev.target.closest || ev.target.closest('#selBar, .tick, input, textarea')) return;
    const hit = ctxOf(ev.target);
    if (!hit) return;
    pressStart = { x: ev.clientX, y: ev.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressed = true;
      const id = CTX[hit.k].id(hit.li);
      if (!mode) enter(hit.k, id); else if (mode.ctx === hit.k) toggle(id);
    }, 500);
  });
  document.addEventListener('pointermove', ev => { if (pressStart && Math.hypot(ev.clientX - pressStart.x, ev.clientY - pressStart.y) > 8) clearTimeout(pressTimer); });
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { clearTimeout(pressTimer); pressStart = null; }));
  document.addEventListener('contextmenu', ev => { if (ctxOf(ev.target) && (pressed || mode)) ev.preventDefault(); });
  // Im Auswahlmodus wählt ein Tipp aus, statt zu öffnen; am PC geht Strg-/Cmd-Klick auch ohne Gedrückthalten
  document.addEventListener('click', ev => {
    if (ev.target.closest && ev.target.closest('#selBar')) return;
    const hit = ctxOf(ev.target);
    if (pressed) { pressed = false; if (hit) { ev.preventDefault(); ev.stopImmediatePropagation(); } return; }
    if (!hit) return;
    const id = CTX[hit.k].id(hit.li);
    if (mode && mode.ctx === hit.k) { ev.preventDefault(); ev.stopImmediatePropagation(); toggle(id); return; }
    if (!mode && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); ev.stopImmediatePropagation(); enter(hit.k, id); }
  }, true);

  const done = msg => { toast(msg); exit(); if (app.popBack) app.popBack(); };
  ACTIONS['sel-exit'] = () => { exit(); if (app.popBack) app.popBack(); };
  ACTIONS['sel-all'] = () => { const c = CTX[mode.ctx]; document.querySelectorAll(c.sel).forEach(li => mode.ids.add(c.id(li))); paint(); };
  ACTIONS['sel-pin'] = () => {
    const list = docs(), on = !list.every(d => d.pinned);
    list.forEach(d => save(CTX[mode.ctx].coll, { ...d, pinned: on }));
    done(on ? 'Angeheftet' : 'Nicht mehr angeheftet');
  };
  ACTIONS['sel-done'] = () => { docs().forEach(i => save('listItems', { ...i, done: true, doneAt: Date.now() })); done('Abgehakt'); };
  ACTIONS['sel-undone'] = () => { docs().forEach(i => save('listItems', { ...i, done: false })); done('Wieder offen'); };
  ACTIONS['sel-visited'] = () => { docs().forEach(p => save('places', { ...p, done: true })); done('Als besucht markiert'); };
  ACTIONS['sel-del'] = () => {
    const list = docs(), c = CTX[mode.ctx];
    if (!confirm(`${list.length} ${list.length === 1 ? c.one : c.many} löschen?`)) return;
    list.forEach(d => {
      if (mode.ctx === 'entries') {
        [...(d.photos || []), ...(d.sounds || [])].forEach(p => remove('photos', p.id));
        S.expenses.filter(x => x.entryId === d.id).forEach(x => remove('expenses', x.id));
        S.fuel.filter(f => f.entryId === d.id).forEach(f => { S.expenses.filter(x => x.fuelId === f.id).forEach(x => remove('expenses', x.id)); remove('fuel', f.id); });
      }
      remove(c.coll, d.id);
    });
    done('Gelöscht');
  };
  ACTIONS['sel-move'] = () => {
    const opts = k => app.listsOf(k).map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    openSheet(`<form data-form="sel-move">${sheetHead(`${mode.ids.size} in andere Liste`)}
      <label class="field"><span>Liste</span><select name="listId"><optgroup label="Einkaufen">${opts('einkauf')}</optgroup><optgroup label="Merken">${opts('merken')}</optgroup></select></label>
      <div class="sheet-foot"><button class="primary">Verschieben</button></div></form>`);
  };
  FORMS['sel-move'] = form => {
    const l = S.lists.find(x => x.id === form.listId.value);
    if (!l || !mode) return;
    docs().forEach(i => save('listItems', { ...i, listId: l.id, list: l.kind }));
    closeSheet();
    done(`Nach „${l.name}“ verschoben`);
  };
  ACTIONS['sel-trip'] = () => {
    const trips = app.sortTrips(S.trips.filter(t => !t.archived));
    const places = mode.ctx === 'places';
    openSheet(`<form data-form="sel-trip">${sheetHead(places ? 'Für welche Reise vormerken?' : 'In welche Reise verschieben?')}
      <label class="field"><span>Reise</span><select name="tripId">${places ? '<option value="">Keine (Wunschliste)</option>' : ''}
        ${trips.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      ${places ? '' : '<p class="sub">Kosten und Tankstopps dieser Einträge wandern mit.</p>'}
      <div class="sheet-foot"><button class="primary">Übernehmen</button></div></form>`);
  };
  FORMS['sel-trip'] = form => {
    if (!mode) return;
    const tripId = form.tripId.value || null;
    const t = S.trips.find(x => x.id === tripId);
    if (mode.ctx === 'places') docs().forEach(p => save('places', { ...p, tripId }));
    else docs().forEach(e => {
      save('entries', { ...e, tripId });
      S.expenses.filter(x => x.entryId === e.id).forEach(x => save('expenses', { ...x, tripId }));
      S.fuel.filter(f => f.entryId === e.id).forEach(f => {
        save('fuel', { ...f, tripId });
        S.expenses.filter(x => x.fuelId === f.id).forEach(x => save('expenses', { ...x, tripId }));
      });
    });
    closeSheet();
    done(t ? `Zu „${t.name}“ verschoben` : 'Auf die Wunschliste gelegt');
  };
}
