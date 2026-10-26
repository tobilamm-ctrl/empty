// Fahrzeug und Reise-Aufbau: Mängelliste je Fahrzeug, Fahrzeug je Reise, Stellplätze nach mehreren Punkten
// bewerten (mit Vergleich in der Statistik) und eine neue Reise aus einer alten als Vorlage.

export default function installFahrzeuge(app) {
  const { S, VIEWS, ACTIONS, FORMS, CHANGES, esc, icon, newId, save, remove, toast, openSheet, closeSheet, sortTrips, me, shrink, fmtShort } = app;
  const sheetHead = app.sheetHead;

  /* ====================================================================== */
  /* Mängelliste                                                             */
  /* ====================================================================== */

  const defects = vid => S.games.filter(g => g.kind === 'defect' && (g.vehicleId || 'vehicle') === vid);
  const fahrzeug = VIEWS.fahrzeug;
  VIEWS.fahrzeug = () => {
    const vid = app.vehicleId();
    const all = defects(vid);
    const open = all.filter(d => !d.done).sort((a, b) => (b.shop ? 1 : 0) - (a.shop ? 1 : 0) || b.at - a.at);
    const done = all.filter(d => d.done).sort((a, b) => b.doneAt - a.doneAt).slice(0, 5);
    const row = d => `<li><button data-action="defect-form" data-id="${d.id}">
      ${d.photos && d.photos[0] ? `<img class="defect-thumb" src="${d.photos[0].thumb}" alt="">` : '<span class="defect-ic">🔧</span>'}
      <span class="txt"><b>${esc(d.title)}</b><small>${fmtShort(new Date(d.at).toISOString().slice(0, 10))}${d.place ? `, ${esc(d.place)}` : ''}${d.note ? ` · ${esc(d.note)}` : ''}</small></span>
      ${d.shop ? '<span class="due soon">Werkstatt</span>' : ''}</button></li>`;
    return `${fahrzeug()}
      <section class="panel defects">
        <div class="toolbar"><h2>Mängelliste</h2><button class="primary" data-action="defect-form">${icon('plus')}Mangel</button></div>
        ${open.length ? `<ul class="ledger">${open.map(row).join('')}</ul>` : '<p class="hint">Unterwegs geht etwas kaputt? Mit Foto notieren und zu Hause oder in der Werkstatt abarbeiten.</p>'}
        ${done.length ? `<h3 class="date-head">Erledigt</h3><ul class="ledger done-list">${done.map(row).join('')}</ul>` : ''}
      </section>`;
  };
  // Hinweis auf offene Mängel im Mehr-Menü (an der Fahrzeug-Kachel)
  app.defectCount = () => S.games.filter(g => g.kind === 'defect' && !g.done).length;

  let draft = null;
  ACTIONS['defect-form'] = el => {
    const d = S.games.find(g => g.id === (el && el.dataset.id)) || { photos: [] };
    draft = { keep: (d.photos || []).slice(), add: [], drop: [] };
    openSheet(`<form data-form="defect" data-id="${d.id || ''}">${sheetHead(d.id ? 'Mangel' : 'Neuer Mangel')}
      <label class="field"><span>Was ist kaputt?</span><input name="title" required maxlength="80" value="${esc(d.title)}" placeholder="z. B. Schiebetür klemmt"></label>
      <label class="field"><span>Notiz</span><textarea name="note" rows="2" placeholder="Seit wann, was hilft vorerst, Teilenummer …">${esc(d.note)}</textarea></label>
      <label class="field"><span>Wo bemerkt?</span><input name="place" value="${esc(d.place)}" placeholder="z. B. Stellplatz am See"></label>
      <label class="check"><input type="checkbox" name="shop"${d.shop ? ' checked' : ''}><span>Muss in die Werkstatt</span></label>
      <div class="field"><span>Fotos</span><div class="photo-grid" id="dfPhotos">${grid()}</div>
        <label class="ghost file">${icon('camera')}Foto<input type="file" accept="image/*" multiple data-action="defect-img"></label></div>
      <div class="sheet-foot">${d.id ? `<button type="button" class="ghost danger" data-action="defect-del" data-id="${d.id}">Löschen</button>` : ''}
        ${d.id && !d.done ? `<button type="button" class="ghost" data-action="defect-done" data-id="${d.id}">Erledigt</button>` : ''}
        <button class="primary">Speichern</button></div></form>`);
  };
  const grid = () => [...draft.keep, ...draft.add].map(p => `<figure><img src="${p.thumb}" alt=""><button type="button" data-action="defect-img-drop" data-id="${p.id}" aria-label="Foto entfernen">${icon('close')}</button></figure>`).join('');
  CHANGES['defect-img'] = async el => {
    for (const f of el.files) { try { draft.add.push({ id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1920, 0.8) }); } catch { toast('Ein Foto ließ sich nicht lesen.'); } }
    el.value = '';
    document.getElementById('dfPhotos').innerHTML = grid();
  };
  ACTIONS['defect-img-drop'] = el => {
    const id = el.dataset.id;
    if (draft.keep.some(p => p.id === id)) draft.drop.push(id);
    draft.keep = draft.keep.filter(p => p.id !== id); draft.add = draft.add.filter(p => p.id !== id);
    document.getElementById('dfPhotos').innerHTML = grid();
  };
  FORMS.defect = form => {
    const old = S.games.find(g => g.id === form.dataset.id);
    draft.drop.forEach(id => remove('photos', id));
    draft.add.forEach(p => save('photos', { id: p.id, data: p.data }));
    save('games', {
      ...(old || { id: newId(), kind: 'defect', by: me(), at: Date.now(), vehicleId: app.vehicleId(), done: false }),
      title: form.title.value.trim(), note: form.note.value.trim(), place: form.place.value.trim(), shop: form.shop.checked,
      photos: [...draft.keep, ...draft.add].map(({ id, thumb }) => ({ id, thumb })),
    });
    closeSheet();
    toast('Mangel notiert');
  };
  ACTIONS['defect-done'] = el => { const d = S.games.find(g => g.id === el.dataset.id); if (d) save('games', { ...d, done: true, doneAt: Date.now(), doneBy: me() }); closeSheet(); toast('Erledigt'); };
  ACTIONS['defect-del'] = el => {
    const d = S.games.find(g => g.id === el.dataset.id);
    if (!d || !confirm('Diesen Mangel löschen?')) return;
    (d.photos || []).forEach(p => remove('photos', p.id));
    remove('games', d.id);
    closeSheet();
  };


  /* ====================================================================== */
  /* Fahrzeug je Reise und Reise als Vorlage (im Reise-Formular)             */
  /* ====================================================================== */

  app.tripFormExtra = t => {
    const vs = app.vehicles();
    const others = sortTrips(S.trips).filter(x => x.id !== t.id);
    return `${vs.length > 1 ? `<label class="field"><span>Fahrzeug</span><select name="vehicleId">${vs.map(v =>
        `<option value="${v.id}"${(t.vehicleId || 'vehicle') === v.id ? ' selected' : ''}>${esc(app.vName(v))}${v.kind ? ` (${esc(v.kind)})` : ''}</option>`).join('')}</select></label>` : ''}
      ${!t.id && others.length ? `<details class="tpl"><summary>Aus einer früheren Reise übernehmen</summary>
        <label class="field"><span>Vorlage</span><select name="tplTrip"><option value="">Keine</option>${others.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" name="tplLists" checked><span>Merk- und Einkaufslisten (offene Punkte)</span></label>
        <label class="check"><input type="checkbox" name="tplPack" checked><span>Zusätzlich eingepackte Sachen (Packliste dieser Reise)</span></label>
        <label class="check"><input type="checkbox" name="tplPlaces"><span>Geplante Orte (noch nicht besuchte)</span></label>
        <label class="check"><input type="checkbox" name="tplMeta" checked><span>Fahrzeug und Mitreisende</span></label>
        <p class="sub">Checklisten (Abfahrt, Ankunft) gelten ohnehin für alle Reisen; ihre Haken starten neu.</p>
      </details>` : ''}`;
  };
  const tripSaved = app.tripSaved;
  app.tripSaved = (t, old, form) => {
    if (tripSaved) tripSaved(t, old, form);
    const patch = {};
    if (form.vehicleId) patch.vehicleId = form.vehicleId.value === 'vehicle' ? null : form.vehicleId.value;
    const src = !old && form.tplTrip && S.trips.find(x => x.id === form.tplTrip.value);
    if (src) {
      let n = 0;
      if (form.tplMeta.checked) { if (!form.vehicleId) patch.vehicleId = src.vehicleId || null; if (src.members) patch.members = t.members || src.members; }
      if (form.tplLists.checked) S.lists.filter(l => l.tripId === src.id).forEach(l => {
        const nl = save('lists', { ...l, id: newId(), tripId: t.id, createdAt: Date.now() });
        S.listItems.filter(i => i.listId === l.id && !i.done).forEach(i => { save('listItems', { ...i, id: newId(), listId: nl.id, createdAt: Date.now(), by: me(), done: false, doneAt: 0, movedFrom: '' }); n++; });
      });
      if (form.tplPack.checked) S.items.filter(i => i.tripId === src.id).forEach(i => { save('items', { ...i, id: newId(), tripId: t.id }); n++; });
      if (form.tplPlaces.checked) S.places.filter(p => p.tripId === src.id && !p.done).forEach(p => { save('places', { ...p, id: newId(), tripId: t.id, planDate: '', done: false, createdAt: Date.now() }); n++; });
      setTimeout(() => toast(`Aus „${src.name}“ übernommen: ${n} ${n === 1 ? 'Punkt' : 'Punkte'}`), 300);
    }
    if (Object.keys(patch).length) save('trips', { ...t, ...patch });
  };

  /* ====================================================================== */
  /* Stellplatz nach mehreren Punkten bewerten                               */
  /* ====================================================================== */

  const CRIT = [['lage', 'Lage'], ['sauber', 'Sauberkeit'], ['ruhe', 'Ruhe'], ['kinder', 'Kinderfreundlich'], ['preis', 'Preis-Leistung']];
  const stars = n => '★'.repeat(n) + '<span class="off">' + '★'.repeat(5 - n) + '</span>';
  app.entryMoreFields = e => `<div class="extras crit" data-show="features"><div class="field"><span>Genauer bewertet</span>
    ${CRIT.map(([k, l]) => { const v = (e.ratings || {})[k] || 0; return `<div class="crit-row"><span>${l}</span><input type="hidden" name="r_${k}" value="${v}">
      <span class="crit-stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="cstar${v >= i ? ' on' : ''}" data-action="crit-rate" data-k="${k}" data-v="${i}" aria-label="${l}: ${i} von 5">★</button>`).join('')}</span></div>`; }).join('')}
    </div></div>`;
  ACTIONS['crit-rate'] = el => {
    const form = el.form, f = form[`r_${el.dataset.k}`];
    const v = +f.value === +el.dataset.v ? 0 : +el.dataset.v;
    f.value = v;
    el.parentElement.querySelectorAll('.cstar').forEach(b => b.classList.toggle('on', +b.dataset.v <= v));
    // Gesamtwertung vorschlagen, solange keine gesetzt ist
    if (form.rating && !+form.rating.value) {
      const vals = CRIT.map(([k]) => +form[`r_${k}`].value).filter(Boolean);
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      if (avg) { form.rating.value = avg; form.querySelectorAll('.stars .star').forEach(s => s.classList.toggle('on', +s.dataset.v <= avg)); form.dataset.autoRating = '1'; }
    } else if (form.dataset.autoRating && form.rating) {
      const vals = CRIT.map(([k]) => +form[`r_${k}`].value).filter(Boolean);
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      form.rating.value = avg; form.querySelectorAll('.stars .star').forEach(s => s.classList.toggle('on', +s.dataset.v <= avg));
    }
  };
  const entrySave = app.entrySave;
  app.entrySave = (e, form) => {
    if (entrySave) entrySave(e, form);
    if (e.type !== 'stellplatz' || !form.r_lage) { delete e.ratings; return; }
    const r = {};
    CRIT.forEach(([k]) => { const v = +form[`r_${k}`].value; if (v) r[k] = v; });
    if (Object.keys(r).length) e.ratings = r; else delete e.ratings;
  };
  const entryExtra = app.entryExtra;
  app.entryExtra = e => `${entryExtra ? entryExtra(e) : ''}${e.ratings && Object.keys(e.ratings).length ? `<dl class="crit-view">${CRIT.filter(([k]) => e.ratings[k]).map(([k, l]) =>
    `<div><dt>${l}</dt><dd>${stars(e.ratings[k])}</dd></div>`).join('')}</dl>` : ''}`;

  // Statistik: Stellplätze im Vergleich
  const statistik = VIEWS.statistik;
  VIEWS.statistik = () => {
    const html = statistik();
    const rated = S.entries.filter(e => e.type === 'stellplatz' && e.ratings && Object.keys(e.ratings).length);
    if (!rated.length) return html;
    const avg = k => { const v = rated.map(e => e.ratings[k]).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
    const score = e => { const v = Object.values(e.ratings); return v.reduce((a, b) => a + b, 0) / v.length; };
    const best = rated.slice().sort((a, b) => score(b) - score(a)).slice(0, 5);
    return `${html}<section class="panel crit-stats"><h2>Stellplätze im Vergleich</h2>
      <p class="sub">${rated.length} genauer bewertete Stellplätze</p>
      <dl class="crit-view">${CRIT.map(([k, l]) => `<div><dt>${l}</dt><dd>${avg(k) ? `${stars(Math.round(avg(k)))} <small>${avg(k).toFixed(1).replace('.', ',')}</small>` : '–'}</dd></div>`).join('')}</dl>
      <h3 class="date-head">Die besten</h3>
      <ol class="crit-best">${best.map(e => `<li><button class="as-text" data-action="open-entry" data-id="${e.id}"><b>${esc(e.title || e.place || 'Stellplatz')}</b></button>
        <small>${score(e).toFixed(1).replace('.', ',')} ★${e.place ? ` · ${esc(e.place)}` : ''}</small></li>`).join('')}</ol></section>`;
  };

}
