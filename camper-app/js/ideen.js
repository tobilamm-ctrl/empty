// Reiseideen: Vorschläge für künftige Urlaubsziele sammeln, gemeinsam Gedanken dazu notieren,
// Gefallen zeigen und eine Idee später in eine Reiseplanung überführen.

export default function installIdeen(app) {
  const {
    S, ui, VIEWS, ACTIONS, FORMS, esc, icon, pageHead, newId, save, remove, toast, render, go, openSheet, closeSheet,
    today, me, personName, nextColor, setTrip,
  } = app;
  const sheetHead = app.sheetHead;
  // Adressen in Notizen anklickbar machen (erst maskieren, dann verlinken)
  const linkify = s => esc(s).replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}${u.length > 48 ? '…' : ''}</a>`);
  const likes = i => Object.keys(i.likes || {}).filter(k => i.likes[k]);
  const tripOf = i => i.tripId && S.trips.find(t => t.id === i.tripId);
  const when = ts => new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });

  VIEWS.ideen = () => {
    const f = ui.ideaFilter || 'offen';
    const list = S.ideas.filter(i => (f === 'offen') === !tripOf(i))
      .sort((a, b) => likes(b).length - likes(a).length || (b.updatedAt || 0) - (a.updatedAt || 0));
    const n = S.ideas.filter(i => tripOf(i)).length;
    return `${pageHead('ideen', 'Reiseideen', 'Wohin geht es als Nächstes?')}
      <div class="toolbar">
        <div class="chips"><button class="chip${f === 'offen' ? ' on' : ''}" data-action="idea-filter" data-f="offen">Ideen</button>
          <button class="chip${f === 'geplant' ? ' on' : ''}" data-action="idea-filter" data-f="geplant">Daraus geplant${n ? ` (${n})` : ''}</button></div>
        <button class="primary" data-action="idea-form">${icon('plus')}Idee</button>
      </div>
      ${list.length ? `<ul class="ideas">${list.map(ideaCard).join('')}</ul>`
        : `<p class="hint">${f === 'offen' ? 'Noch keine Ideen. Legt Ziele an, von denen ihr träumt, und sammelt Gedanken dazu: Stellplätze, Ausflüge, beste Reisezeit, Links.' : 'Noch keine Idee in eine Reise überführt.'}</p>`}`;
  };
  ACTIONS['idea-filter'] = el => { ui.ideaFilter = el.dataset.f; render(); };

  function ideaCard(i) {
    const t = tripOf(i);
    const who = likes(i);
    const meta = [i.where, i.season, i.days].filter(Boolean).map(esc).join(' · ');
    return `<li class="idea">
      <button class="as-text body" data-action="idea-open" data-id="${i.id}">
        <strong>${esc(i.title)}</strong>
        ${meta ? `<small>${meta}</small>` : ''}
        <small class="by">Vorschlag von ${esc(personName(i.by))}${(i.notes || []).length ? `, ${i.notes.length} ${i.notes.length === 1 ? 'Notiz' : 'Notizen'}` : ''}${t ? `, geplant als „${esc(t.name)}“` : ''}</small>
      </button>
      ${likeBtn(i)}
      ${who.length ? `<small class="likers">${who.map(id => esc(personName(id))).join(', ')}</small>` : ''}
    </li>`;
  }
  const likeBtn = i => {
    const on = !!(i.likes || {})[me()];
    return `<button class="like${on ? ' on' : ''}" data-action="idea-like" data-id="${i.id}" aria-pressed="${on}" aria-label="Will ich auch">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg><b>${likes(i).length || ''}</b></button>`;
  };
  ACTIONS['idea-like'] = el => {
    const i = S.ideas.find(x => x.id === el.dataset.id);
    if (!i) return;
    const n = save('ideas', { ...i, likes: { ...(i.likes || {}), [me()]: !(i.likes || {})[me()] } });
    if ($sheetOpen(i.id)) openIdea(n);
  };
  const $sheetOpen = id => document.querySelector(`#sheet[open] [data-idea="${id}"]`);

  /* ---------- Ansehen und Notizen ---------- */

  ACTIONS['idea-open'] = el => openIdea(el.dataset.id);
  // Nach dem Speichern steht die Idee noch nicht in S, darum kann auch das gespeicherte Objekt übergeben werden
  function openIdea(id) {
    const i = typeof id === 'object' ? id : S.ideas.find(x => x.id === id);
    if (!i) return closeSheet();
    const t = tripOf(i);
    const notes = (i.notes || []).slice().sort((a, b) => a.at - b.at);
    openSheet(`<div data-idea="${i.id}">${sheetHead(esc(i.title))}
      ${[i.where, i.season, i.days].some(Boolean) ? `<dl class="idea-facts">
        ${i.where ? `<dt>Wo</dt><dd>${esc(i.where)}</dd>` : ''}${i.season ? `<dt>Wann</dt><dd>${esc(i.season)}</dd>` : ''}${i.days ? `<dt>Dauer</dt><dd>${esc(i.days)}</dd>` : ''}</dl>` : ''}
      ${i.text ? `<p class="idea-text">${linkify(i.text)}</p>` : ''}
      <div class="idea-like-row">${likeBtn(i)}<span class="sub">${likes(i).length ? `Will ich auch: ${likes(i).map(personName).map(esc).join(', ')}` : 'Wem gefällt die Idee?'}</span></div>
      <h3 class="date-head">Ideen und Notizen dazu</h3>
      ${notes.length ? `<ul class="idea-notes">${notes.map(n => `<li><p>${linkify(n.text)}</p>
        <small>${esc(personName(n.by))}, ${when(n.at)}${n.by === me() ? ` · <button class="link" data-action="idea-note-del" data-id="${i.id}" data-note="${n.id}">löschen</button>` : ''}</small></li>`).join('')}</ul>`
        : '<p class="sub">Noch nichts notiert: Stellplätze, Ausflüge, Restaurants, Links …</p>'}
      <form data-form="idea-note" data-id="${i.id}" class="idea-note-form">
        <textarea name="text" rows="2" placeholder="Idee oder Link notieren" required></textarea>
        <button class="primary">Notieren</button>
      </form>
      <div class="sheet-foot">
        <button type="button" class="ghost" data-action="idea-form" data-id="${i.id}">Bearbeiten</button>
        ${t ? `<button type="button" class="primary" data-action="idea-to-trip-open" data-trip="${t.id}">Zur Reise</button>`
          : `<button type="button" class="primary" data-action="idea-plan" data-id="${i.id}">Reise planen</button>`}
      </div></div>`);
  }
  FORMS['idea-note'] = form => {
    const i = S.ideas.find(x => x.id === form.dataset.id);
    const text = form.text.value.trim();
    if (!i || !text) return;
    openIdea(save('ideas', { ...i, notes: [...(i.notes || []), { id: newId(), by: me(), at: Date.now(), text }] }));
  };
  ACTIONS['idea-note-del'] = el => {
    const i = S.ideas.find(x => x.id === el.dataset.id);
    if (!i || !confirm('Diese Notiz löschen?')) return;
    openIdea(save('ideas', { ...i, notes: (i.notes || []).filter(n => n.id !== el.dataset.note) }));
  };

  /* ---------- Anlegen und Bearbeiten ---------- */

  ACTIONS['idea-form'] = el => {
    const i = S.ideas.find(x => x.id === el.dataset.id) || {};
    openSheet(`<form data-form="idea" data-id="${i.id || ''}">${sheetHead(i.id ? 'Idee bearbeiten' : 'Neue Reiseidee')}
      <label class="field"><span>Ziel</span><input name="title" value="${esc(i.title)}" required placeholder="z. B. Mit dem Camper nach Schottland"></label>
      <label class="field"><span>Wo genau? (Land, Region)</span><input name="where" value="${esc(i.where)}" placeholder="z. B. Highlands, Isle of Skye"></label>
      <div class="row2">
        <label class="field"><span>Wann?</span><input name="season" value="${esc(i.season)}" placeholder="z. B. Sommerferien 2027"></label>
        <label class="field"><span>Wie lange?</span><input name="days" value="${esc(i.days)}" placeholder="z. B. 3 Wochen"></label>
      </div>
      <label class="field"><span>Warum dorthin?</span><textarea name="text" rows="3" placeholder="Was reizt euch daran?">${esc(i.text)}</textarea></label>
      <div class="sheet-foot">
        ${i.id && i.by === me() || i.id && app.session().user.isAdmin ? `<button type="button" class="ghost danger" data-action="idea-del" data-id="${i.id}">Löschen</button>` : ''}
        <button class="primary">Speichern</button>
      </div></form>`);
  };
  FORMS.idea = form => {
    const old = S.ideas.find(x => x.id === form.dataset.id);
    const i = save('ideas', {
      ...(old || { id: newId(), by: me(), createdAt: Date.now(), likes: { [me()]: true }, notes: [] }),
      title: form.title.value.trim(), where: form.where.value.trim(), season: form.season.value.trim(),
      days: form.days.value.trim(), text: form.text.value.trim(),
    });
    openIdea(i);
  };
  ACTIONS['idea-del'] = el => {
    if (!confirm('Diese Idee mit allen Notizen löschen?')) return;
    remove('ideas', el.dataset.id);
    closeSheet();
  };

  /* ---------- Idee in eine Reiseplanung überführen ---------- */

  ACTIONS['idea-plan'] = el => {
    const i = S.ideas.find(x => x.id === el.dataset.id);
    const n = (i.notes || []).length;
    openSheet(`<form data-form="idea-plan" data-id="${i.id}">${sheetHead('Reise planen')}
      <p class="sub">Aus der Idee wird eine neue Reise. Sie öffnet sich im Tagebuch unter „Planung“.</p>
      <label class="field"><span>Name der Reise</span><input name="name" value="${esc(i.title)}" required></label>
      <div class="row2">
        <label class="field"><span>Start</span><input type="date" name="start" min="${today()}"></label>
        <label class="field"><span>Ende</span><input type="date" name="end" min="${today()}"></label>
      </div>
      ${n ? `<label class="check"><input type="checkbox" name="notes" checked><span>Die ${n === 1 ? 'Notiz' : `${n} Notizen`} als Merkliste „Ideen“ zur Reise übernehmen</span></label>` : ''}
      <div class="sheet-foot"><button class="primary">Reise anlegen</button></div></form>`);
  };
  FORMS['idea-plan'] = form => {
    const i = S.ideas.find(x => x.id === form.dataset.id);
    if (!i) return;
    const trip = save('trips', {
      id: newId(), createdAt: Date.now(), archived: false, name: form.name.value.trim(),
      start: form.start.value, end: form.end.value, color: nextColor(), ideaId: i.id,
    });
    const items = [i.text, ...(i.notes || []).slice().sort((a, b) => a.at - b.at).map(n => n.text)].filter(Boolean);
    if (form.notes && form.notes.checked && items.length) {
      const l = save('lists', { id: newId(), kind: 'merken', name: `Ideen: ${i.title}`, tripId: trip.id, createdAt: Date.now(), order: S.lists.filter(x => x.kind === 'merken').length });
      items.forEach((text, k) => save('listItems', { id: newId(), listId: l.id, list: 'merken', text, done: false, by: me(), createdAt: Date.now() + k }));
    }
    save('ideas', { ...i, tripId: trip.id });
    setTrip(trip.id);
    ui.diaryMode[trip.id] = 'planung';
    closeSheet();
    toast(`Reise „${trip.name}“ angelegt`);
    go('tagebuch');
  };
  ACTIONS['idea-to-trip-open'] = el => {
    setTrip(el.dataset.trip);
    ui.diaryMode[el.dataset.trip] = 'planung';
    closeSheet();
    go('tagebuch');
  };

  app.ideaCount = () => S.ideas.filter(i => !tripOf(i)).length;
}
