// Herzen und Kommentare bei Tagebuch-Einträgen. Jedes Herz und jeder Kommentar ist ein eigenes Dokument,
// damit sich gleichzeitige Reaktionen beim Abgleich nicht gegenseitig überschreiben.

export default function installHerzen(app) {
  const { S, ACTIONS, FORMS, esc, newId, save, remove, me, personName, ago } = app;

  const hearts = id => S.games.filter(g => g.kind === 'heart' && g.entryId === id);
  const comments = id => S.games.filter(g => g.kind === 'comment' && g.entryId === id).sort((a, b) => a.at - b.at);
  const mine = id => S.games.find(g => g.id === `heart_${id}_${me()}`);

  // Unter jedem Eintrag im Tagebuch
  app.stopExtra = e => {
    const h = hearts(e.id), c = comments(e.id), on = !!mine(e.id);
    return `<div class="react-row">
      <button class="react-btn${on ? ' on' : ''}" data-action="heart" data-id="${e.id}" aria-pressed="${on}" aria-label="Herz" title="${esc(h.map(x => personName(x.by)).join(', '))}">${on ? '❤️' : '🤍'}${h.length ? ` <span>${h.length}</span>` : ''}</button>
      <button class="react-btn" data-action="comments-open" data-id="${e.id}" aria-label="Kommentare">💬${c.length ? ` <span>${c.length}</span>` : ''}</button>
      ${c.length ? `<span class="react-last"><b>${esc(personName(c[c.length - 1].by))}:</b> ${esc(c[c.length - 1].text)}</span>` : ''}
    </div>`;
  };

  ACTIONS.heart = el => {
    const id = el.dataset.id, d = mine(id);
    if (d) remove('games', d.id);
    else { save('games', { id: `heart_${id}_${me()}`, kind: 'heart', entryId: id, by: me(), at: Date.now() }); if (navigator.vibrate) navigator.vibrate(10); }
    // Im offenen Eintrag gleich neu zeichnen
    if (el.closest('.entry-view')) setTimeout(() => app.openEntry(id), 120);
  };
  ACTIONS['comments-open'] = el => {
    app.openEntry(el.dataset.id);
    setTimeout(() => { const f = document.querySelector('.comments input'); if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); } }, 150);
  };

  // In der Eintragsansicht: wer ein Herz gegeben hat, alle Kommentare, neuer Kommentar
  const extra = app.entryExtra;
  app.entryExtra = e => {
    const h = hearts(e.id), c = comments(e.id), on = !!mine(e.id);
    return `${extra ? extra(e) : ''}
      <section class="comments">
        <div class="react-row big"><button class="react-btn${on ? ' on' : ''}" data-action="heart" data-id="${e.id}" aria-pressed="${on}">${on ? '❤️' : '🤍'} ${on ? 'Gefällt dir' : 'Herz geben'}</button>
          ${h.length ? `<span class="sub">${esc(h.map(x => personName(x.by)).join(', '))}</span>` : ''}</div>
        ${c.length ? `<ul>${c.map(x => `<li><b>${esc(personName(x.by))}</b> <small>${ago(x.at)}</small>
          ${x.by === me() ? `<button class="link small" data-action="comment-del" data-id="${x.id}" data-entry="${e.id}">löschen</button>` : ''}<p>${esc(x.text)}</p></li>`).join('')}</ul>` : ''}
        <form data-form="comment" data-id="${e.id}" class="comment-form"><input name="text" maxlength="300" placeholder="Kommentar schreiben …" autocomplete="off" required>
          <button class="primary" aria-label="Senden">➤</button></form>
      </section>`;
  };
  FORMS.comment = form => {
    const text = form.text.value.trim();
    if (!text) return;
    save('games', { id: newId(), kind: 'comment', entryId: form.dataset.id, by: me(), at: Date.now(), text });
    form.reset();
    // Kurz warten, bis der neue Kommentar im lokalen Speicher steht
    setTimeout(() => { app.openEntry(form.dataset.id); setTimeout(() => { const c = document.querySelector('.comments'); if (c) c.scrollIntoView({ block: 'end' }); }, 30); }, 120);
  };
  ACTIONS['comment-del'] = el => { remove('games', el.dataset.id); setTimeout(() => app.openEntry(el.dataset.entry), 120); };
}
