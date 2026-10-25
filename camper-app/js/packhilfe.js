// Packliste auswerten: Nach der Reise festhalten, was gefehlt hat und was nie gebraucht wurde.
// Beim Packen der nächsten Reise erscheinen diese Hinweise über der Packliste.

export default function installPackhilfe(app) {
  const { S, VIEWS, ACTIONS, FORMS, esc, icon, newId, save, toast, openSheet, closeSheet, currentTrip, isPacked, extrasOf } = app;
  const sheetHead = app.sheetHead;
  const notes = () => S.meta.find(m => m.id === 'packnotes') || { id: 'packnotes', missing: [], unused: {} };
  const tripById = id => S.trips.find(t => t.id === id);

  // Knopf in der Leiste einer beendeten Reise
  const bar = app.tripBar;
  app.tripBar = (t, st) => {
    const html = bar(t, st);
    return t.ended ? html.replace(/<\/div>\s*$/, `<button class="ghost small-btn" data-action="pack-review" data-id="${t.id}">${icon('check')}Packliste auswerten</button></div>`) : html;
  };

  ACTIONS['pack-review'] = el => {
    const t = tripById(el.dataset.id);
    if (!t) return;
    const n = notes();
    const packed = [...S.items.filter(i => !i.tripId), ...extrasOf(t)].filter(i => isPacked(t, i)).sort((a, b) => a.name.localeCompare(b.name));
    const missing = n.missing.filter(m => m.tripId === t.id);
    openSheet(`<form data-form="pack-review" data-id="${t.id}">${sheetHead('Packliste auswerten')}
      <p class="sub">Was ihr jetzt festhaltet, erscheint beim Packen der nächsten Reise als Hinweis.</p>
      <label class="field"><span>Was hat gefehlt? (eine Sache pro Zeile)</span>
        <textarea name="missing" rows="4" placeholder="z. B. Wäscheklammern&#10;Ersatzsicherung 15 A">${esc(missing.map(m => m.text).join('\n'))}</textarea></label>
      ${packed.length ? `<div class="field"><span>Was habt ihr nie gebraucht?</span>
        <div class="chips wrap">${packed.map(i => `<label class="chip"><input type="checkbox" name="unused" value="${i.id}"${n.unused[i.id] === t.id ? ' checked' : ''}><span>${esc(i.name)}</span></label>`).join('')}</div></div>`
        : '<p class="hint">Für diese Reise wurde nichts in der Packliste abgehakt.</p>'}
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };

  FORMS['pack-review'] = form => {
    const t = tripById(form.dataset.id);
    const n = notes();
    const old = n.missing.filter(m => m.tripId === t.id);
    const lines = form.missing.value.split('\n').map(x => x.trim()).filter(Boolean);
    const missing = [
      ...n.missing.filter(m => m.tripId !== t.id),
      ...lines.map(text => old.find(m => m.text === text) || { id: newId(), text, tripId: t.id, at: Date.now(), done: false }),
    ];
    const unused = Object.fromEntries(Object.entries(n.unused).filter(([, tid]) => tid !== t.id));
    [...form.querySelectorAll('[name=unused]:checked')].forEach(c => { unused[c.value] = t.id; });
    save('meta', { ...n, missing, unused });
    closeSheet();
    toast('Gemerkt. Beim nächsten Packen erinnert LAMMping daran.');
  };

  // Hinweise über der Packliste der aktuellen Reise
  const base = VIEWS.packen;
  VIEWS.packen = () => {
    const html = base();
    const t = currentTrip();
    if (!t || t.ended) return html;
    const n = notes();
    const open = n.missing.filter(m => !m.done && m.tripId !== t.id);
    const unused = Object.entries(n.unused).filter(([id, tid]) => tid !== t.id && S.items.some(i => i.id === id))
      .map(([id, tid]) => ({ item: S.items.find(i => i.id === id), trip: tripById(tid) }));
    if (!open.length && !unused.length) return html;
    const box = `<section class="pack-hints">
      ${open.length ? `<h3>Beim letzten Mal gefehlt</h3><ul>${open.map(m => `<li><span>${esc(m.text)}</span>
        <button class="ghost small-btn" data-action="pack-hint-add" data-id="${m.id}">${icon('plus')}Einpacken</button>
        <button class="icon-btn small" data-action="pack-hint-done" data-id="${m.id}" aria-label="Erledigt">${icon('check')}</button></li>`).join('')}</ul>` : ''}
      ${unused.length ? `<h3>Zuletzt nie gebraucht</h3><p class="sub">${unused.map(u => esc(u.item.name)).join(', ')}. Vielleicht zu Hause lassen?</p>
        <button class="link" data-action="pack-hint-clear">Hinweis ausblenden</button>` : ''}
    </section>`;
    return html.replace(/(<label class="search">)/, `${box}$1`);
  };
  ACTIONS['pack-hint-add'] = el => {
    const t = currentTrip();
    const n = notes();
    const m = n.missing.find(x => x.id === el.dataset.id);
    if (!t || !m) return;
    save('items', { id: newId(), name: m.text, boxId: '', tripId: t.id, note: 'hat letztes Mal gefehlt' });
    save('meta', { ...n, missing: n.missing.map(x => (x.id === m.id ? { ...x, done: true } : x)) });
    toast(`„${m.text}“ steht jetzt als Extra auf der Packliste`);
  };
  ACTIONS['pack-hint-done'] = el => {
    const n = notes();
    save('meta', { ...n, missing: n.missing.map(x => (x.id === el.dataset.id ? { ...x, done: true } : x)) });
  };
  ACTIONS['pack-hint-clear'] = () => {
    const n = notes();
    save('meta', { ...n, unused: {} });
  };
}
