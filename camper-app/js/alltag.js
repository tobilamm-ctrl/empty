// Alltag unterwegs: Reisebudget, Highlight des Tages, Camper-Dienste (reihum) und Feedback zu LAMMping.
// Highlights und erledigte Dienste liegen bei den Spielständen (games), damit auch Kinder sie eintragen können.

export default function installAlltag(app) {
  const {
    S, ui, VIEWS, ACTIONS, FORMS, esc, icon, pageHead, newId, save, toast, render, go, openSheet, closeSheet,
    today, fmtDay, money, num, currentTrip, members, me, personName, canCash, ROUTE_ARGS,
  } = app;
  const sheetHead = app.sheetHead;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const days = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
  const shift = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const crew = t => (t && t.members ? members().filter(m => t.members.includes(m.id)) : members());
  const running = t => t && !t.ended && t.start && t.start <= today() && (!t.end || t.end >= today());

  /* ====================================================================== */
  /* Reisebudget                                                             */
  /* ====================================================================== */

  function budget(t) {
    if (!t || !t.budget) return null;
    const spent = S.expenses.filter(x => x.tripId === t.id && x.cat !== app.SETTLE).reduce((s, x) => s + (x.amount || 0), 0);
    const left = t.budget - spent;
    // verbleibende Tage einschließlich heute (vor der Reise: die ganze Reise)
    const from = t.start && t.start > today() ? t.start : today();
    const daysLeft = t.end && t.end >= from ? days(from, t.end) + 1 : null;
    return { spent, left, share: spent / t.budget, daysLeft, perDay: daysLeft ? left / daysLeft : null };
  }
  const base = VIEWS.kasse;
  VIEWS.kasse = () => {
    const html = base();
    const t = currentTrip();
    if (!t || !canCash()) return html;
    const b = budget(t);
    const card = b ? `<section class="budget${b.left < 0 ? ' over' : ''}">
        <div class="budget-row"><span>Budget ${money(t.budget)}</span><b>${b.left >= 0 ? `noch ${money(b.left)}` : `${money(-b.left)} drüber`}</b></div>
        <div class="progress"><span style="--p:${Math.min(1, b.share)}"></span></div>
        <p class="sub">${money(b.spent)} ausgegeben (${Math.round(b.share * 100)} %)${b.perDay != null && b.left > 0 ? `. Für die restlichen ${b.daysLeft} ${b.daysLeft === 1 ? 'Tag' : 'Tage'}: ${money(b.perDay)} pro Tag.` : '.'}
          <button class="link" data-action="trip-form" data-id="${t.id}">ändern</button></p>
      </section>`
      : `<p class="sub budget-hint"><button class="link" data-action="trip-form" data-id="${t.id}">Reisebudget festlegen</button></p>`;
    return html.replace('</header>', `</header>${card}`);
  };

  /* ====================================================================== */
  /* Highlight des Tages                                                     */
  /* ====================================================================== */

  const EMOJI = ['⭐', '🏖️', '⛰️', '🍦', '🐑', '🚐', '🐟', '🌅', '🎢', '❤️', '😂', '🌧️'];
  const hlId = (t, d, pid) => `hl_${t.id}_${d}_${pid}`;
  const highlights = (t, d) => S.games.filter(g => g.kind === 'highlight' && g.tripId === t.id && g.day === d);

  app.dayHighlights = (t, d, print) => {
    const list = highlights(t, d).filter(h => h.text || h.emoji);
    if (!list.length) return print ? '' : (d === today() && running(t) ? `<button class="link day-hl-add" data-action="hl-form" data-day="${d}">${icon('star')}Highlight des Tages eintragen</button>` : '');
    const items = list.map(h => `<span><b>${esc(personName(h.by))}:</b> ${h.emoji ? `${h.emoji} ` : ''}${esc(h.text)}</span>`).join('');
    return print ? `<p class="pd-hl">Highlights: ${items}</p>`
      : `<button class="day-hl" data-action="hl-form" data-day="${d}">${icon('star')}<span class="hl-items">${items}</span></button>`;
  };

  ACTIONS['hl-form'] = el => {
    const t = currentTrip();
    if (!t) return toast('Legt zuerst eine Reise an.');
    hlSheet(t, (el && el.dataset && el.dataset.day) || today(), (el && el.dataset && el.dataset.pid) || me());
  };
  function hlSheet(t, d, pid) {
    const mine = S.games.find(g => g.id === hlId(t, d, pid)) || {};
    const others = highlights(t, d).filter(h => h.by !== pid && (h.text || h.emoji));
    const canOthers = isAdmin() && crew(t).length > 1;
    openSheet(`<form data-form="hl" data-day="${d}" data-pid="${pid}">${sheetHead('Highlight des Tages')}
      <p class="sub">${fmtDay(d)}: Was war heute am schönsten?</p>
      ${canOthers ? `<div class="chips list-chips">${crew(t).map(m => `<button type="button" class="chip${m.id === pid ? ' on' : ''}" data-action="hl-who" data-pid="${m.id}" data-day="${d}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <div class="emoji-pick">${EMOJI.map(e => `<label><input type="radio" name="emoji" value="${e}"${mine.emoji === e ? ' checked' : ''}><span>${e}</span></label>`).join('')}</div>
      <label class="field voice-field"><span>${pid === me() ? 'Mein Highlight' : `Highlight von ${esc(personName(pid))}`}</span>${app.voiceBtn ? app.voiceBtn('text') : ''}
        <textarea name="text" rows="2" maxlength="160" placeholder="z. B. Die Gondelfahrt mit Blick auf den See">${esc(mine.text)}</textarea></label>
      ${others.length ? `<ul class="hl-others">${others.map(h => `<li><b>${esc(personName(h.by))}:</b> ${h.emoji || ''} ${esc(h.text)}</li>`).join('')}</ul>` : ''}
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  }
  ACTIONS['hl-who'] = el => hlSheet(currentTrip(), el.dataset.day, el.dataset.pid);
  FORMS.hl = form => {
    const t = currentTrip();
    const { day: d, pid } = form.dataset;
    const emoji = (form.querySelector('[name=emoji]:checked') || {}).value || '';
    const text = form.text.value.trim();
    if (!text && !emoji) return toast('Schreib kurz, was am schönsten war.');
    save('games', { id: hlId(t, d, pid), kind: 'highlight', tripId: t.id, day: d, by: pid, text, emoji });
    closeSheet();
    toast('Highlight gespeichert');
  };
  ROUTE_ARGS['tagebuch/highlight'] = () => ACTIONS['hl-form']();

  /* ====================================================================== */
  /* Camper-Dienste: reihum, jeden Tag neu verteilt                          */
  /* ====================================================================== */

  const DEFAULT_DUTIES = ['Abwasch', 'Wasser holen', 'Müll wegbringen', 'Tisch decken', 'Aufräumen'];
  const duties = () => ((S.meta.find(m => m.id === 'duties') || {}).list || DEFAULT_DUTIES);
  const dutyDoc = (t, d) => S.games.find(g => g.id === `duty_${t.id}_${d}`) || { id: `duty_${t.id}_${d}`, kind: 'duty', tripId: t.id, day: d, done: {}, swap: {} };
  // Wer ist dran? Reihum nach Tag, Tausch überschreibt
  function plan(t, d) {
    const who = crew(t);
    if (!who.length) return [];
    const n = Math.max(0, days(t.start || d, d));
    const doc = dutyDoc(t, d);
    return duties().map((label, i) => {
      const pid = (doc.swap || {})[label] || who[(i + n) % who.length].id;
      return { label, pid, done: (doc.done || {})[label] || null };
    });
  }
  const points = t => {
    const p = {};
    S.games.filter(g => g.kind === 'duty' && g.tripId === t.id).forEach(g => Object.values(g.done || {}).forEach(pid => { p[pid] = (p[pid] || 0) + 1; }));
    return p;
  };
  app.dutyCount = pid => S.games.filter(g => g.kind === 'duty').reduce((s, g) => s + Object.values(g.done || {}).filter(x => x === pid).length, 0);

  VIEWS.dienste = () => {
    const t = currentTrip();
    if (!t) return `${pageHead('check', 'Camper-Dienste')}<p class="hint">Legt zuerst eine Reise an.</p>`;
    const d = ui.dutyDay || today();
    const list = plan(t, d);
    const pts = points(t);
    const board = crew(t).map(m => ({ m, n: pts[m.id] || 0 })).sort((a, b) => b.n - a.n);
    return `${pageHead('check', 'Camper-Dienste', 'Jeden Tag reihum, wer hilft, sammelt Punkte')}
      <div class="chips list-chips">${[-1, 0, 1].map(k => { const x = shift(today(), k); return `<button class="chip${x === d ? ' on' : ''}" data-action="duty-day" data-day="${x}">${k === 0 ? 'Heute' : k < 0 ? 'Gestern' : 'Morgen'}</button>`; }).join('')}</div>
      <ul class="duties">${list.map(x => `<li class="${x.done ? 'done' : ''}">
        <button class="tick" data-action="duty-done" data-l="${esc(x.label)}" data-day="${d}" aria-pressed="${!!x.done}" aria-label="Erledigt"></button>
        <span class="txt"><b>${esc(x.label)}</b><small>${x.done ? `erledigt von ${esc(personName(x.done))}` : esc(personName(x.pid))}</small></span>
        <button class="ghost small-btn" data-action="duty-swap" data-l="${esc(x.label)}" data-day="${d}">Tauschen</button></li>`).join('')}</ul>
      <h2 class="date-head">Punkte auf „${esc(t.name)}“</h2>
      <ol class="leader-list">${board.map(({ m, n }) => `<li><span>${esc(m.name)}</span><b>${n}</b></li>`).join('')}</ol>
      ${isAdmin() ? '<button class="link" data-action="duty-edit">Dienste bearbeiten</button>' : ''}`;
  };
  ACTIONS['duty-day'] = el => { ui.dutyDay = el.dataset.day; render(); };
  ACTIONS['duty-done'] = el => {
    const t = currentTrip(), d = el.dataset.day, l = el.dataset.l;
    const doc = dutyDoc(t, d);
    const x = plan(t, d).find(p => p.label === l);
    const done = { ...(doc.done || {}) };
    if (done[l]) delete done[l]; else done[l] = x.pid === me() || !isAdmin() ? me() : x.pid;
    save('games', { ...doc, done });
    if (!doc.done || !doc.done[l]) toast('Danke! Ein Punkt mehr.');
  };
  ACTIONS['duty-swap'] = el => {
    const t = currentTrip(), d = el.dataset.day, l = el.dataset.l;
    openSheet(`<div>${sheetHead(`${esc(l)}: Wer übernimmt?`)}
      <div class="chips wrap">${crew(t).map(m => `<button class="chip" data-action="duty-swap-to" data-pid="${m.id}" data-l="${esc(l)}" data-day="${d}">${esc(m.name)}</button>`).join('')}</div></div>`);
  };
  ACTIONS['duty-swap-to'] = el => {
    const t = currentTrip(), doc = dutyDoc(t, el.dataset.day);
    save('games', { ...doc, swap: { ...(doc.swap || {}), [el.dataset.l]: el.dataset.pid } });
    closeSheet();
  };
  ACTIONS['duty-edit'] = () => openSheet(`<form data-form="duties">${sheetHead('Dienste bearbeiten')}
      <label class="field"><span>Ein Dienst pro Zeile</span><textarea name="list" rows="7">${esc(duties().join('\n'))}</textarea></label>
      <p class="sub">Verteilt wird reihum auf alle, die bei der Reise dabei sind.</p>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  FORMS.duties = form => {
    const list = form.list.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
    save('meta', { id: 'duties', list: list.length ? list : DEFAULT_DUTIES });
    closeSheet();
  };

  /* ---------- In der Heute-Karte: Budget, Highlight, Dienste ---------- */

  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard(t, st);
    if (!html) return html;
    const b = canCash() ? budget(t) : null;
    const mine = plan(t, today()).filter(x => !x.done);
    const meDuty = mine.filter(x => x.pid === me()).map(x => x.label);
    const hl = S.games.some(g => g.id === hlId(t, today(), me()));
    const extra = `<div class="today-more">
      ${b ? `<a class="today-budget" href="#/kasse">${icon('coin')}${b.left >= 0 ? `Budget: noch ${money(b.left)}${b.perDay != null ? `, ${money(b.perDay)} pro Tag` : ''}` : `Budget um ${money(-b.left)} überschritten`}</a>` : ''}
      ${(!app.allowed || app.allowed('dienste')) && duties().length ? `<a class="today-duty" href="#/dienste">${icon('check')}${meDuty.length ? `Dein Dienst: ${esc(meDuty.join(', '))}` : mine.length ? `Noch offen: ${mine.length} ${mine.length === 1 ? 'Dienst' : 'Dienste'}` : 'Alle Dienste erledigt'}</a>` : ''}
      <button class="link" data-action="hl-form">${icon('star')}${hl ? 'Highlight des Tages ändern' : 'Highlight des Tages'}</button>
    </div>`;
    return html.replace('<div class="today-links">', `${extra}<div class="today-links">`);
  };

  // Kinder-Start: Highlight und Dienste ganz oben
  const kids = VIEWS.kinder;
  if (kids) VIEWS.kinder = () => {
    const html = kids();
    const t = currentTrip();
    if (!running(t)) return html;
    const meDuty = plan(t, today()).filter(x => !x.done && x.pid === me()).map(x => x.label);
    const box = `<section class="kids-today">
      <button class="kids-tile wide" data-action="hl-form">${icon('star')}<b>Was war heute dein Highlight?</b></button>
      ${(!app.allowed || app.allowed('dienste')) && meDuty.length ? `<a class="kids-tile wide duty" href="#/dienste">${icon('check')}<b>Dein Dienst heute: ${esc(meDuty.join(', '))}</b></a>` : ''}
    </section>`;
    return html.replace('</section>', `</section>${box}`);
  };

  /* ====================================================================== */
  /* Feedback zu LAMMping                                                    */
  /* ====================================================================== */

  const FB_LIST = 'feedback';
  const FB_KINDS = ['Stört', 'Fehlt', 'Fehler', 'Idee'];
  ACTIONS.feedback = () => openSheet(`<form data-form="feedback">${sheetHead('Feedback zu LAMMping')}
      <p class="sub">Was stört, fehlt oder funktioniert nicht? Alles landet in der Merkliste „LAMMping-Feedback“.</p>
      <div class="chips wrap">${FB_KINDS.map((k, i) => `<label class="chip"><input type="radio" name="kind" value="${k}"${i === 0 ? ' checked' : ''} hidden><span>${k}</span></label>`).join('')}</div>
      <label class="field voice-field"><span>Was genau?</span>${app.voiceBtn ? app.voiceBtn('text') : ''}<textarea name="text" rows="3" required placeholder="z. B. Der Knopf zum Speichern ist beim Fahren schwer zu treffen"></textarea></label>
      <div class="sheet-foot"><button class="primary">Abschicken</button></div></form>`);
  FORMS.feedback = form => {
    const text = form.text.value.trim();
    if (!text) return;
    if (!S.lists.some(l => l.id === FB_LIST)) save('lists', { id: FB_LIST, kind: 'merken', name: 'LAMMping-Feedback', tripId: null, createdAt: Date.now(), order: 99 });
    save('listItems', { id: newId(), listId: FB_LIST, list: 'merken', text: `[${form.kind.value}] ${text} (${personName(me())}, Bereich: ${ui.route})`, done: false, by: me(), createdAt: Date.now() });
    closeSheet();
    toast('Danke! Gemerkt in „LAMMping-Feedback“.');
  };
  ACTIONS['feedback-copy'] = async () => {
    const items = S.listItems.filter(i => i.listId === FB_LIST).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const text = items.map(i => `- ${i.done ? '(erledigt) ' : ''}${i.text}`).join('\n') || 'Noch kein Feedback.';
    try { await navigator.clipboard.writeText(text); toast(`${items.length} Rückmeldungen kopiert`); } catch { toast('Kopieren nicht möglich. Die Liste steht unter Listen → LAMMping-Feedback.'); }
  };
  app.settingsPanels.push(() => `<section class="panel">
      <h2>Feedback</h2>
      <p class="sub">Notiert unterwegs, was euch stört oder fehlt. Nach der Reise könnt ihr alles auf einmal kopieren und weitergeben.</p>
      <div class="btnrow"><button class="primary" data-action="feedback">Feedback geben</button>
        ${isAdmin() ? '<button class="ghost" data-action="feedback-copy">Alles kopieren</button>' : ''}</div>
    </section>`);
  // Kleiner Knopf unten auf „Mehr“ und auf dem Kinder-Start
  const mehr = VIEWS.mehr;
  VIEWS.mehr = () => `${mehr()}<p class="sub fb-link"><button class="link" data-action="feedback">Feedback zu LAMMping geben</button></p>`;
  const kids2 = VIEWS.kinder;
  if (kids2) VIEWS.kinder = () => kids2().replace('<p class="sub kids-foot">', '<p class="sub kids-foot"><button class="link" data-action="feedback">Feedback geben</button> · ');
}
