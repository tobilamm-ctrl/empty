// Packliste fürs nächste Mal: eine feste Liste unter Listen › Merken („Packliste: nächstes Mal“). Unterwegs gleich
// eintragen, was gefehlt hat; nach der Reise zusätzlich festhalten, was nie gebraucht wurde. Beim Packen der
// nächsten Reise erscheinen diese Hinweise über der Packliste.

export default function installPackhilfe(app) {
  const { S, LS, ui, VIEWS, ACTIONS, FORMS, esc, icon, newId, save, remove, toast, openSheet, closeSheet, go, me, currentTrip, isPacked, extrasOf } = app;
  const sheetHead = app.sheetHead;
  const LIST = 'packnext';
  const notes = () => S.meta.find(m => m.id === 'packnotes') || { id: 'packnotes', missing: [], unused: {} };
  const tripById = id => S.trips.find(t => t.id === id);
  const missingItems = () => S.listItems.filter(i => i.listId === LIST);

  // Feste Liste anlegen; frühere Einträge aus „Packliste auswerten“ wandern einmalig hinein
  function ensureList() {
    if (!S.lists.some(l => l.id === LIST)) {
      save('lists', { id: LIST, kind: 'merken', name: 'Packliste: nächstes Mal', pinned: true, fixed: true, tripId: null, createdAt: Date.now(), order: -1 });
    }
    const n = notes();
    const old = (n.missing || []).filter(m => !m.done && !m.moved);
    if (old.length) {
      old.forEach(m => save('listItems', { id: newId(), listId: LIST, list: 'merken', text: m.text, tripId: m.tripId || null, done: false, by: me(), createdAt: m.at || Date.now() }));
      save('meta', { ...n, missing: n.missing.map(m => (old.includes(m) ? { ...m, moved: true } : m)) });
    }
  }

  // Knöpfe in der Leiste über dem Tagebuch
  app.tripTools.push(t => (t.ended ? { order: 6, action: 'pack-review', icon: 'check', label: 'Auswerten', title: 'Packliste auswerten', desc: 'Was hat gefehlt, was wurde nie gebraucht?', later: true } : null));
  app.tripTools.push(() => ({ order: 3.5, action: 'pack-next', icon: 'check', label: 'Packliste', title: 'Packliste fürs nächste Mal' }));
  ACTIONS['pack-next'] = () => {
    ensureList();
    ui.listTab = 'merken';
    LS.set('listTab', 'merken');
    LS.set('list.merken', LIST);
    go('listen');
  };

  // Listen › Merken: Erklärung, passender Platzhalter und „Nie gebraucht“ unter der festen Liste
  const lists = VIEWS.listen;
  VIEWS.listen = (...a) => {
    if (ui.listTab === 'merken' && S.lists.length && !S.lists.some(l => l.id === LIST)) ensureList();
    let html = lists(...a);
    const form = `<form class="adder" data-form="list-add" data-list="${LIST}"`;
    const at = html.indexOf(form);
    if (at < 0) return html;
    const end = html.indexOf('</form>', at);
    const adder = html.slice(at, end).replace(/placeholder="[^"]*"/, 'placeholder="Was hat gefehlt? z. B. Wäscheklammern"');
    html = `${html.slice(0, at)}<p class="sub pack-next-intro">Feste Liste. Tragt unterwegs gleich ein, was fehlt. Beim nächsten Packen erinnert LAMMping daran.</p>${adder}${html.slice(end)}`;
    const unused = unusedNow();
    if (unused.length) {
      html += `<section class="pack-unused"><h3>Nie gebraucht – zu Hause lassen?</h3>
        <p class="sub">${unused.map(u => `${esc(u.item.name)}${u.trip ? ` <small>(${esc(u.trip.name)})</small>` : ''}`).join(', ')}</p>
        <button class="link" data-action="pack-hint-clear">Hinweis ausblenden</button></section>`;
    }
    return html;
  };
  const unusedNow = (skipTrip = null) => Object.entries(notes().unused || {}).filter(([id, tid]) => tid !== skipTrip && S.items.some(i => i.id === id))
    .map(([id, tid]) => ({ item: S.items.find(i => i.id === id), trip: tripById(tid) }));

  // Nach der Reise auswerten
  ACTIONS['pack-review'] = el => {
    const t = tripById(el.dataset.id);
    if (!t) return;
    ensureList();
    const n = notes();
    const packed = [...S.items.filter(i => !i.tripId), ...extrasOf(t)].filter(i => isPacked(t, i)).sort((a, b) => a.name.localeCompare(b.name));
    const missing = missingItems().filter(i => i.tripId === t.id && !i.done);
    openSheet(`<form data-form="pack-review" data-id="${t.id}">${sheetHead('Packliste auswerten')}
      <p class="sub">Was ihr jetzt festhaltet, steht unter Listen › Merken in „Packliste: nächstes Mal“ und erscheint beim Packen der nächsten Reise als Hinweis.</p>
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
    const lines = form.missing.value.split('\n').map(x => x.trim()).filter(Boolean);
    const mine = missingItems().filter(i => i.tripId === t.id && !i.done);
    mine.filter(i => !lines.includes(i.text)).forEach(i => remove('listItems', i.id));
    lines.filter(text => !mine.some(i => i.text === text))
      .forEach(text => save('listItems', { id: newId(), listId: LIST, list: 'merken', text, tripId: t.id, done: false, by: me(), createdAt: Date.now() }));
    const unused = Object.fromEntries(Object.entries(n.unused).filter(([, tid]) => tid !== t.id));
    [...form.querySelectorAll('[name=unused]:checked')].forEach(c => { unused[c.value] = t.id; });
    save('meta', { ...n, unused });
    closeSheet();
    toast('Gemerkt. Beim nächsten Packen erinnert LAMMping daran.');
  };

  // Hinweise über der Packliste der aktuellen Reise
  const base = VIEWS.packen;
  VIEWS.packen = () => {
    const html = base();
    const t = currentTrip();
    if (!t || t.ended) return html;
    const open = missingItems().filter(i => !i.done && i.tripId !== t.id);
    const unused = unusedNow(t.id);
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
  const tick = id => { const m = S.listItems.find(x => x.id === id); if (m) save('listItems', { ...m, done: true, doneAt: Date.now() }); return m; };
  ACTIONS['pack-hint-add'] = el => {
    const t = currentTrip();
    const m = S.listItems.find(x => x.id === el.dataset.id);
    if (!t || !m) return;
    save('items', { id: newId(), name: m.text, boxId: '', tripId: t.id, note: 'hat letztes Mal gefehlt' });
    tick(m.id);
    toast(`„${m.text}“ steht jetzt als Extra auf der Packliste`);
  };
  ACTIONS['pack-hint-done'] = el => { tick(el.dataset.id); };
  ACTIONS['pack-hint-clear'] = () => {
    const n = notes();
    save('meta', { ...n, unused: {} });
  };
}
