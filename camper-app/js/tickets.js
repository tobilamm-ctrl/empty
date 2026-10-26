// Tickets und Reservierungen: Fähre, Campingplatz, Eintritt, Vignette … mit Datum, Buchungsnummer und Bild
// (z. B. Screenshot vom QR-Code). Die Bilder werden beim Öffnen der Seite für offline geholt; die nächste
// Abfahrt steht mit Countdown in der Heute-Karte.

export default function installTickets(app) {
  const { S, VIEWS, ACTIONS, FORMS, CHANGES, esc, icon, pageHead, newId, save, remove, toast, openSheet, closeSheet, currentTrip, today, fmtDay, shrink } = app;
  const sheetHead = app.sheetHead;
  const KINDS = [['faehre', 'Fähre', '⛴️'], ['camping', 'Campingplatz', '🏕️'], ['eintritt', 'Eintritt', '🎟️'], ['vignette', 'Vignette / Maut', '🛣️'],
    ['bahn', 'Zug, Bus, Seilbahn', '🚆'], ['sonst', 'Sonstiges', '📄']];
  const kind = k => KINDS.find(x => x[0] === k) || KINDS[KINDS.length - 1];
  const tickets = t => S.games.filter(g => g.kind === 'ticket' && (!t || g.tripId === t.id));
  const when = x => `${x.date || '9999-12-31'}T${x.time || '00:00'}`;
  const nowLocal = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const past = x => (x.until || x.date || '9999') < today();
  function countdown(x) {
    if (!x.date) return '';
    const ms = new Date(when(x)) - Date.now();
    if (ms < 0) return x.date === today() ? 'heute' : '';
    const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    if (h >= 48) return `in ${Math.round(h / 24)} Tagen`;
    return h ? `in ${h} Std. ${m} Min.` : `in ${m} Min.`;
  }
  const line = x => `${kind(x.kindKey)[2]} <b>${esc(x.title)}</b>`;

  VIEWS.tickets = () => {
    const t = currentTrip();
    const all = tickets(t).slice().sort((a, b) => when(a).localeCompare(when(b)));
    const next = all.filter(x => !past(x)), old = all.filter(past);
    // Bilder für unterwegs ohne Netz vorab holen
    setTimeout(() => all.forEach(x => (x.images || []).forEach(im => app.store().get('photos', im.id).then(p => { if (p && p.data && !p.data.startsWith('data:')) fetch(p.data).catch(() => {}); }).catch(() => {}))), 300);
    const row = x => `<li><button data-action="ticket-view" data-id="${x.id}">
      <span class="tk-ic">${kind(x.kindKey)[2]}</span>
      <span class="txt"><b>${esc(x.title)}</b><small>${x.date ? fmtDay(x.date) : 'ohne Datum'}${x.time ? `, ${x.time} Uhr` : ''}${x.until && x.until !== x.date ? ` bis ${fmtDay(x.until)}` : ''}${x.number ? ` · ${esc(x.number)}` : ''}</small></span>
      <span class="due ${countdown(x).startsWith('in') && !countdown(x).includes('Tagen') ? 'soon' : ''}">${countdown(x)}</span></button></li>`;
    return `${pageHead('tickets', 'Tickets', t ? `Für „${esc(t.name)}“, auch ohne Netz` : 'Fähre, Campingplatz, Eintritt')}
      <div class="btnrow"><button class="primary" data-action="ticket-form">${icon('plus')}Ticket oder Reservierung</button></div>
      ${next.length ? `<ul class="ledger tickets">${next.map(row).join('')}</ul>` : '<p class="hint">Fährtickets, Campingplatz-Reservierungen, Eintrittskarten oder Vignetten: mit Datum, Buchungsnummer und einem Foto oder Screenshot vom QR-Code. So habt ihr alles griffbereit, auch ohne Netz am Hafen.</p>'}
      ${old.length ? `<details class="old-tickets"><summary>Vorbei (${old.length})</summary><ul class="ledger tickets">${old.map(row).join('')}</ul></details>` : ''}`;
  };

  ACTIONS['ticket-view'] = el => {
    const x = S.games.find(g => g.id === el.dataset.id);
    if (!x) return;
    openSheet(`<div class="ticket-view">${sheetHead(`${kind(x.kindKey)[2]} ${esc(x.title)}`)}
      <p class="tk-when">${x.date ? fmtDay(x.date) : ''}${x.time ? `, ${x.time} Uhr` : ''}${x.until && x.until !== x.date ? ` bis ${fmtDay(x.until)}` : ''} <b>${countdown(x)}</b></p>
      ${x.place ? `<p>${esc(x.place)}</p>` : ''}
      ${x.number ? `<p class="tk-number"><span>Buchungsnummer</span><b>${esc(x.number)}</b><button class="ghost small-btn" data-action="ticket-copy" data-n="${esc(x.number)}">Kopieren</button></p>` : ''}
      ${(x.images || []).map(im => `<img class="tk-img" data-photo="${im.id}" src="${im.thumb}" alt="Ticket">`).join('')}
      ${x.note ? `<p class="prose">${esc(x.note).replace(/\n/g, '<br>')}</p>` : ''}
      ${x.link ? `<p><a href="${esc(x.link)}" target="_blank" rel="noopener">Buchung online öffnen</a></p>` : ''}
      <p class="sub">Tipp: Zum Scannen den Bildschirm ganz hell stellen.</p>
      <div class="sheet-foot"><button class="ghost danger" data-action="ticket-del" data-id="${x.id}">Löschen</button>
        <button class="primary" data-action="ticket-form" data-id="${x.id}">Bearbeiten</button></div></div>`, root => {
      root.querySelectorAll('[data-photo]').forEach(img => app.store().get('photos', img.dataset.photo).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {}));
    });
  };
  ACTIONS['ticket-copy'] = async el => { try { await navigator.clipboard.writeText(el.dataset.n); toast('Kopiert'); } catch { toast(el.dataset.n); } };
  ACTIONS['ticket-del'] = el => {
    const x = S.games.find(g => g.id === el.dataset.id);
    if (!x || !confirm('Dieses Ticket löschen?')) return;
    (x.images || []).forEach(im => remove('photos', im.id));
    remove('games', x.id);
    closeSheet();
  };

  let draft = null;
  ACTIONS['ticket-form'] = el => {
    const x = S.games.find(g => g.id === (el && el.dataset.id)) || { kindKey: 'faehre', date: today(), images: [] };
    draft = { keep: (x.images || []).slice(), add: [], drop: [] };
    openSheet(`<form data-form="ticket" data-id="${x.id || ''}">${sheetHead(x.id ? 'Ticket bearbeiten' : 'Neues Ticket')}
      <div class="chips wrap">${KINDS.map(([k, l, e]) => `<label class="chip"><input type="radio" name="kindKey" value="${k}"${x.kindKey === k ? ' checked' : ''}><span>${e} ${l}</span></label>`).join('')}</div>
      <label class="field"><span>Bezeichnung</span><input name="title" required maxlength="80" value="${esc(x.title)}" placeholder="z. B. Fähre Piombino – Portoferraio"></label>
      <div class="row2"><label class="field"><span>Datum</span><input type="date" name="date" value="${x.date || ''}"></label>
        <label class="field"><span>Uhrzeit</span><input type="time" name="time" value="${x.time || ''}"></label></div>
      <label class="field"><span>Bis (bei mehreren Tagen)</span><input type="date" name="until" value="${x.until || ''}"></label>
      <label class="field"><span>Ort oder Strecke</span><input name="place" maxlength="120" value="${esc(x.place)}" placeholder="z. B. Hafen Piombino, Anleger 3"></label>
      <label class="field"><span>Buchungsnummer</span><input name="number" maxlength="60" value="${esc(x.number)}" autocomplete="off"></label>
      <label class="field"><span>Link zur Buchung</span><input name="link" type="url" value="${esc(x.link)}" placeholder="https://"></label>
      <label class="field"><span>Notiz</span><textarea name="note" rows="2" placeholder="z. B. 30 Minuten vorher am Schalter sein">${esc(x.note)}</textarea></label>
      <div class="field"><span>Bild vom Ticket oder QR-Code</span><div class="photo-grid" id="tkPhotos">${grid()}</div>
        <label class="ghost file">${icon('camera')}Foto oder Screenshot<input type="file" accept="image/*" multiple data-action="ticket-img"></label>
        <p class="sub">PDF? Einfach einen Screenshot vom QR-Code machen und den hier einfügen.</p></div>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  function grid() {
    return [...draft.keep, ...draft.add].map(p => `<figure><img src="${p.thumb}" alt=""><button type="button" data-action="ticket-img-drop" data-id="${p.id}" aria-label="Bild entfernen">${icon('close')}</button></figure>`).join('');
  }
  CHANGES['ticket-img'] = async el => {
    for (const f of el.files) {
      // Tickets etwas schärfer speichern, damit QR-Codes sicher lesbar bleiben
      try { draft.add.push({ id: newId(), thumb: await shrink(f, 360, 0.75), data: await shrink(f, 1920, 0.9) }); } catch { toast('Ein Bild ließ sich nicht lesen.'); }
    }
    el.value = '';
    document.getElementById('tkPhotos').innerHTML = grid();
  };
  ACTIONS['ticket-img-drop'] = el => {
    const id = el.dataset.id;
    if (draft.keep.some(p => p.id === id)) draft.drop.push(id);
    draft.keep = draft.keep.filter(p => p.id !== id); draft.add = draft.add.filter(p => p.id !== id);
    document.getElementById('tkPhotos').innerHTML = grid();
  };
  FORMS.ticket = form => {
    const t = currentTrip();
    const old = S.games.find(g => g.id === form.dataset.id);
    const id = old ? old.id : newId();
    draft.drop.forEach(pid => remove('photos', pid));
    draft.add.forEach(p => save('photos', { id: p.id, tripId: t ? t.id : null, data: p.data }));
    save('games', {
      ...(old || { id, kind: 'ticket', by: app.me(), createdAt: Date.now(), tripId: t ? t.id : null }),
      kindKey: form.kindKey.value, title: form.title.value.trim(), date: form.date.value, time: form.time.value, until: form.until.value,
      place: form.place.value.trim(), number: form.number.value.trim(), link: form.link.value.trim(), note: form.note.value.trim(),
      images: [...draft.keep, ...draft.add].map(({ id: pid, thumb }) => ({ id: pid, thumb })),
    });
    closeSheet();
    toast('Ticket gespeichert');
  };

  // Heute-Karte: was in den nächsten 2 Tagen ansteht
  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard ? todayCard(t, st) : '';
    if (!html) return html;
    const soon = tickets(t).filter(x => x.date && when(x) >= nowLocal().slice(0, 10) && new Date(when(x)) - Date.now() < 48 * 36e5 && !past(x))
      .sort((a, b) => when(a).localeCompare(when(b))).slice(0, 2);
    if (!soon.length) return html;
    return html.replace('<div class="today-links">', `<div class="today-tickets">${soon.map(x => `<button class="as-text" data-action="ticket-view" data-id="${x.id}">${line(x)}
      ${x.time ? `${x.date === today() ? 'heute' : fmtDay(x.date).split(',')[0]} ${x.time} Uhr` : ''} <span class="due soon">${countdown(x)}</span></button>`).join('')}</div><div class="today-links">`);
  };
}
