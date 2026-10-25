// Familienrat: Abstimmung (jeder am eigenen Handy), Urlaubsgeld der Kinder, Vorfreude-Countdown vor der Reise
// und die Frage des Tages am Abend. Alles liegt in der Sammlung „games“ und ist für die ganze Familie sichtbar.

export default function installFamilienrat(app) {
  const {
    S, ui, VIEWS, ACTIONS, FORMS, esc, icon, num, money, pageHead, newId, save, remove, toast, render, openSheet, closeSheet,
    currentTrip, members, me, personName, today, fmtShort, sortTrips,
  } = app;
  const sheetHead = app.sheetHead;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const running = t => t && !t.ended && t.start && t.start <= today() && (!t.end || t.end >= today());
  const crew = t => members().filter(m => !t || !t.members || t.members.includes(m.id));
  const dayNo = d => Math.round(Date.parse(d + 'T12:00Z') / 864e5);

  /* ====================================================================== */
  /* Abstimmung                                                              */
  /* ====================================================================== */

  const polls = () => S.games.filter(g => g.kind === 'poll').sort((a, b) => (b.at || 0) - (a.at || 0));
  const openPolls = () => polls().filter(p => !p.closed);
  const voter = () => (members().some(m => m.id === ui.pollAs) ? ui.pollAs : me());
  const TEMPLATES = [
    ['Wohin fahren wir morgen?', () => {
      const t = currentTrip();
      return S.places.filter(p => (t && p.tripId === t.id && !p.done) || (!p.tripId && !p.fav)).slice(0, 6).map(p => p.name);
    }],
    ['Was machen wir heute?', () => ['Baden', 'Wandern', 'Radtour', 'Stadt anschauen', 'Spielplatz', 'Faulenzen']],
    ['Was gibt es zum Abendessen?', () => (S.recipes.length ? S.recipes.slice(0, 5).map(r => r.name || r.title).filter(Boolean) : ['Nudeln', 'Grillen', 'Pfannkuchen', 'Essen gehen'])],
    ['Welches Spiel spielen wir?', () => ['Kennzeichen sammeln', 'Reise-Bingo', 'Stadt, Land, Fluss', 'Wer bin ich?', 'Tabu']],
  ];

  function pollCard(p, compact) {
    const who = crew(S.trips.find(t => t.id === p.tripId));
    const votes = p.votes || {};
    const n = Object.keys(votes).length;
    const counts = p.options.map((_, i) => Object.values(votes).filter(v => v === i).length);
    const max = Math.max(...counts);
    const mine = votes[voter()];
    const done = p.closed || n >= who.length;
    return `<section class="panel poll${done ? ' done' : ''}">
      <div class="toolbar"><h2>${esc(p.q)}</h2>${isAdmin() || p.by === me() ? `<button class="icon-btn small" data-action="poll-menu" data-id="${p.id}" aria-label="Abstimmung bearbeiten">${icon('edit')}</button>` : ''}</div>
      <p class="sub">${n} von ${who.length} haben abgestimmt${p.closed ? ' · beendet' : ''}${who.length - n > 0 && !p.closed ? ` · es fehlen: ${esc(who.filter(m => votes[m.id] == null).map(m => m.name).join(', '))}` : ''}</p>
      <ul class="poll-opts">${p.options.map((o, i) => `<li><button class="poll-opt${mine === i ? ' mine' : ''}${done && counts[i] === max && max > 0 ? ' win' : ''}" data-action="poll-vote" data-id="${p.id}" data-i="${i}"${p.closed ? ' disabled' : ''}>
        <span class="po-bar" style="width:${n ? (counts[i] / n) * 100 : 0}%"></span><span class="po-txt">${esc(o)}</span>
        <b>${done || mine != null ? counts[i] : ''}</b></button></li>`).join('')}</ul>
      ${done && max > 0 && !compact ? `<p class="poll-win">🏆 ${esc(p.options.filter((_, i) => counts[i] === max).join(' oder '))}</p>` : ''}
    </section>`;
  }

  VIEWS.abstimmung = () => {
    const list = polls();
    return `${pageHead('ideen', 'Abstimmung', 'Die Familie entscheidet gemeinsam')}
      ${members().length > 1 ? `<div class="chips list-chips player-bar"><span class="sub">Ich stimme ab als:</span>${members().map(m =>
        `<button class="chip${m.id === voter() ? ' on' : ''}" data-action="poll-as" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <button class="primary" data-action="poll-form">${icon('plus')}Neue Abstimmung</button>
      ${list.length ? list.slice(0, 12).map(p => pollCard(p)).join('') : '<p class="hint">Wohin morgen? Was essen wir? Stellt eine Frage, alle stimmen auf ihrem Handy ab.</p>'}`;
  };
  ACTIONS['poll-as'] = el => { ui.pollAs = el.dataset.id; render(); };
  ACTIONS['poll-vote'] = el => {
    const p = S.games.find(g => g.id === el.dataset.id);
    if (!p || p.closed) return;
    const i = +el.dataset.i;
    const votes = { ...(p.votes || {}) };
    if (votes[voter()] === i) delete votes[voter()]; else votes[voter()] = i;
    save('games', { ...p, votes });
  };
  ACTIONS['poll-form'] = el => {
    const tpl = el.dataset.tpl != null ? TEMPLATES[+el.dataset.tpl] : null;
    const opts = tpl ? tpl[1]() : [];
    openSheet(`<form data-form="poll">${sheetHead('Neue Abstimmung')}
      <div class="chips wrap">${TEMPLATES.map(([q], i) => `<button type="button" class="chip" data-action="poll-form" data-tpl="${i}">${esc(q)}</button>`).join('')}</div>
      <label class="field"><span>Frage</span><input name="q" required maxlength="80" value="${esc(tpl ? tpl[0] : '')}" placeholder="z. B. Wohin fahren wir morgen?"></label>
      <label class="field"><span>Antworten (eine pro Zeile)</span><textarea name="opts" rows="5" required placeholder="Gardasee&#10;Dolomiten&#10;Venedig">${esc(opts.join('\n'))}</textarea></label>
      <div class="sheet-foot"><button class="primary">Abstimmen lassen</button></div></form>`);
  };
  FORMS.poll = form => {
    const options = [...new Set(form.opts.value.split('\n').map(s => s.trim()).filter(Boolean))].slice(0, 8);
    if (options.length < 2) return toast('Bitte mindestens zwei Antworten.');
    const t = currentTrip();
    save('games', { id: newId(), kind: 'poll', q: form.q.value.trim(), options, votes: {}, by: me(), at: Date.now(), tripId: t ? t.id : null });
    closeSheet();
    toast('Abstimmung gestartet');
  };
  ACTIONS['poll-menu'] = el => {
    const p = S.games.find(g => g.id === el.dataset.id);
    if (!p) return;
    openSheet(`<div>${sheetHead(esc(p.q))}
      <div class="sheet-foot"><button class="ghost danger" data-action="poll-del" data-id="${p.id}">Löschen</button>
        <button class="primary" data-action="poll-close" data-id="${p.id}">${p.closed ? 'Wieder öffnen' : 'Beenden'}</button></div></div>`);
  };
  ACTIONS['poll-close'] = el => { const p = S.games.find(g => g.id === el.dataset.id); if (p) save('games', { ...p, closed: !p.closed }); closeSheet(); };
  ACTIONS['poll-del'] = el => { if (confirm('Abstimmung löschen?')) { remove('games', el.dataset.id); closeSheet(); } };

  /* ====================================================================== */
  /* Urlaubsgeld der Kinder                                                  */
  /* ====================================================================== */

  const walletId = (t, pid) => `wallet_${t.id}_${pid}`;
  const wallet = (t, pid) => S.games.find(g => g.id === walletId(t, pid)) || { id: walletId(t, pid), kind: 'wallet', tripId: t.id, by: pid, tx: [] };
  const balance = w => (w.tx || []).reduce((s, x) => s + x.amt, 0);
  // Landeswährung der Reise (Schweiz, Tschechien …), falls es eine gibt
  function localCur(t) {
    if (!app.CUR || !app.tripCountries) return null;
    const ccs = app.tripCountries(t);
    const code = Object.keys(app.CUR).find(k => ccs.includes(app.CUR[k][1]));
    if (code && app.loadFx) app.loadFx();
    return code ? { code, rate: app.fxRate(code) } : null;
  }
  const inCur = (eur, c) => `${(eur * c.rate).toLocaleString('de-DE', { maximumFractionDigits: c.code === 'HUF' || c.code === 'CZK' ? 0 : 2 })} ${c.code}`;

  VIEWS.urlaubsgeld = () => {
    const t = currentTrip();
    if (!t) return `${pageHead('kasse', 'Urlaubsgeld')}<p class="hint">Legt zuerst eine Reise an.</p>`;
    const lc = localCur(t);
    const kids = crew(t);
    const pid = kids.some(m => m.id === ui.walletFor) ? ui.walletFor : (kids.find(m => m.id === me()) || kids[0] || {}).id;
    const w = wallet(t, pid);
    const bal = balance(w);
    const tx = (w.tx || []).slice().sort((a, b) => b.at - a.at);
    return `${pageHead('kasse', 'Urlaubsgeld', `Taschengeld für „${esc(t.name)}“`)}
      <div class="chips list-chips">${kids.map(m => { const b = balance(wallet(t, m.id)); return `<button class="chip${m.id === pid ? ' on' : ''}" data-action="wallet-for" data-id="${m.id}">${esc(m.name)} <small>${money(b)}</small></button>`; }).join('')}</div>
      <section class="panel wallet">
        <p class="wl-k">${esc(personName(pid))} hat noch</p>
        <p class="wl-big${bal < 0 ? ' neg' : ''}">${money(bal)}</p>
        ${lc ? `<p class="sub">Das sind etwa ${inCur(bal, lc)}</p>` : ''}
        <div class="btnrow">
          <button class="primary" data-action="wallet-tx" data-id="${pid}" data-dir="-1">${icon('coin')}Ausgabe</button>
          ${isAdmin() ? `<button class="ghost" data-action="wallet-tx" data-id="${pid}" data-dir="1">${icon('plus')}Geld geben</button>` : ''}
        </div>
      </section>
      ${tx.length ? `<ul class="ledger wallet-tx">${tx.map(x => `<li><button data-action="wallet-del" data-pid="${pid}" data-tx="${x.id}">
        <span class="txt"><b>${esc(x.text || (x.amt > 0 ? 'Urlaubsgeld' : 'Ausgabe'))}</b><small>${fmtShort(new Date(x.at).toISOString().slice(0, 10))}${x.cur && x.cur !== 'EUR' ? ` · ${x.orig.toLocaleString('de-DE')} ${x.cur}` : ''}</small></span>
        <span class="amt ${x.amt > 0 ? 'plus' : ''}">${x.amt > 0 ? '+' : ''}${money(x.amt)}</span></button></li>`).join('')}</ul>`
        : `<p class="hint">${isAdmin() ? 'Mit „Geld geben“ bekommt jedes Kind sein Urlaubsgeld. Dann tragen die Kinder selbst ein, was sie ausgeben.' : 'Noch nichts eingetragen.'}</p>`}`;
  };
  ACTIONS['wallet-for'] = el => { ui.walletFor = el.dataset.id; render(); };
  ACTIONS['wallet-tx'] = el => {
    const t = currentTrip();
    const lc = localCur(t);
    const dir = +el.dataset.dir;
    openSheet(`<form data-form="wallet" data-id="${el.dataset.id}" data-dir="${dir}">${sheetHead(dir > 0 ? `Geld für ${esc(personName(el.dataset.id))}` : 'Was hast du gekauft?')}
      <label class="field"><span>${dir > 0 ? 'Wofür?' : 'Was?'}</span><input name="text" maxlength="40" placeholder="${dir > 0 ? 'z. B. Urlaubsgeld' : 'z. B. Eis'}" value="${dir > 0 ? 'Urlaubsgeld' : ''}"></label>
      <div class="row2"><label class="field"><span>Betrag</span><input name="amt" inputmode="decimal" required placeholder="0,00"></label>
        ${lc ? `<label class="field"><span>Währung</span><select name="cur"><option value="EUR">Euro</option><option value="${lc.code}"${dir < 0 ? ' selected' : ''}>${lc.code}</option></select></label>` : ''}</div>
      <div class="sheet-foot"><button class="primary">Eintragen</button></div></form>`);
  };
  FORMS.wallet = form => {
    const t = currentTrip();
    const v = num(form.amt.value);
    if (!(v > 0)) return toast('Bitte einen Betrag eingeben.');
    const cur = form.cur ? form.cur.value : 'EUR';
    const eur = cur === 'EUR' ? v : v / app.fxRate(cur);
    const w = wallet(t, form.dataset.id);
    save('games', { ...w, tx: [...(w.tx || []), { id: newId(), at: Date.now(), amt: Math.round(eur * 100) / 100 * +form.dataset.dir, text: form.text.value.trim(), cur, orig: v, by: me() }] });
    closeSheet();
  };
  ACTIONS['wallet-del'] = el => {
    const t = currentTrip();
    const w = wallet(t, el.dataset.pid);
    if (!confirm('Diesen Eintrag löschen?')) return;
    save('games', { ...w, tx: w.tx.filter(x => x.id !== el.dataset.tx) });
  };

  /* ====================================================================== */
  /* Vorfreude-Countdown                                                     */
  /* ====================================================================== */

  const TASKS = [
    'Such dir ein Kuscheltier für die Reise aus', 'Finde unser Ziel auf der Landkarte', 'Lerne „Hallo“ und „Danke“ in der Landessprache',
    'Mal ein Bild, wie du dir den Stellplatz vorstellst', 'Pack dein Lieblingsbuch ein', 'Überlege dir ein Spiel für die Fahrt',
    'Such im Internet ein Foto vom Ziel', 'Schreib auf, was du im Urlaub unbedingt machen willst', 'Probier deine Badesachen an',
    'Such dir drei Lieder für die Fahrt aus', 'Rate, wie viele Stunden wir fahren', 'Pack deinen Rucksack für die Rückbank',
    'Überleg dir einen Namen für unseren Camper', 'Finde heraus, welches Tier es am Ziel gibt', 'Lerne von eins bis fünf zählen in der Landessprache',
    'Mach eine Liste: Was darf nicht fehlen?', 'Schau nach, wie das Wetter dort gerade ist', 'Zeichne eine Flagge des Reiselands',
    'Such eine Taschenlampe für abends', 'Überlege, welches Eis du als Erstes isst', 'Erzähl jemandem von unserer Reise',
  ];
  const vfId = t => `vorfreude_${t.id}`;
  function nextTrip() {
    const d = today();
    return sortTrips(S.trips).filter(t => !t.ended && t.start && t.start > d).sort((a, b) => a.start.localeCompare(b.start))[0];
  }
  function countdown(t, kids) {
    const d = today();
    const n = dayNo(t.start) - dayNo(d);
    if (n < 1 || n > 100) return '';
    const doc = S.games.find(g => g.id === vfId(t)) || { done: {} };
    const done = (doc.done || {})[d] || [];
    const task = TASKS[dayNo(d) % TASKS.length];
    const who = crew(t);
    return `<section class="countdown${kids ? ' kids' : ''}" style="--c:${app.tripColor(t)}">
      <p class="cd-k">Noch</p><p class="cd-n">${n}</p><p class="cd-k">Mal schlafen bis <b>${esc(t.name)}</b>!</p>
      <div class="cd-task"><span>Aufgabe für heute:</span><b>${esc(task)}</b>
        <div class="chips wrap">${who.map(m => `<button class="chip${done.includes(m.id) ? ' on' : ''}" data-action="vf-done" data-trip="${t.id}" data-pid="${m.id}">${done.includes(m.id) ? '✓ ' : ''}${esc(m.name)}</button>`).join('')}</div></div>
    </section>`;
  }
  ACTIONS['vf-done'] = el => {
    const t = S.trips.find(x => x.id === el.dataset.trip);
    const doc = S.games.find(g => g.id === vfId(t)) || { id: vfId(t), kind: 'vorfreude', tripId: t.id, done: {} };
    const d = today();
    const list = (doc.done || {})[d] || [];
    const next = list.includes(el.dataset.pid) ? list.filter(x => x !== el.dataset.pid) : [...list, el.dataset.pid];
    save('games', { ...doc, done: { ...(doc.done || {}), [d]: next } });
    if (!list.includes(el.dataset.pid)) toast('Super, erledigt! ⭐');
  };

  /* ====================================================================== */
  /* Frage des Tages                                                         */
  /* ====================================================================== */

  const QUESTIONS = [
    'Was war heute das Lustigste?', 'Welches Tier hättest du heute gern gesehen?', 'Was hast du heute zum ersten Mal gemacht?', 'Was hat heute am besten geschmeckt?',
    'Wenn du heute einen Superkraft hättest: welche?', 'Was hat dich heute überrascht?', 'Wem möchtest du von heute erzählen?', 'Was war heute ein bisschen doof?',
    'Welches Geräusch hast du heute gehört, das es zu Hause nicht gibt?', 'Was möchtest du morgen unbedingt machen?', 'Welche Farbe hatte der heutige Tag?',
    'Was hast du heute gelernt?', 'Wer war heute besonders nett?', 'Wie würdest du den Stellplatz in drei Wörtern beschreiben?', 'Welches Wort aus dem Reiseland kennst du jetzt?',
    'Was würdest du heute noch einmal machen?', 'Was riecht hier anders als zu Hause?', 'Wenn heute ein Film wäre: wie hieße er?', 'Was hast du heute vermisst?',
    'Welche Note gibst du dem Tag – und warum?', 'Was war heute das Schönste, das du gesehen hast?', 'Worüber hast du heute gestaunt?', 'Was hat heute jemand Lustiges gesagt?',
    'Wo würdest du hier gern wohnen?', 'Welches Souvenir hättest du gern von heute?', 'Was war heute anstrengend?', 'Welches Spiel hat heute am meisten Spaß gemacht?',
  ];
  const qId = (t, d) => `qotd_${t.id}_${d}`;
  const question = d => QUESTIONS[dayNo(d) % QUESTIONS.length];
  const qDoc = (t, d) => S.games.find(g => g.id === qId(t, d));
  ACTIONS['q-form'] = el => {
    const t = currentTrip();
    if (!t) return;
    const d = (el.dataset && el.dataset.day) || today();
    const doc = qDoc(t, d) || {};
    const pid = members().some(m => m.id === el.dataset.pid) ? el.dataset.pid : me();
    openSheet(`<form data-form="qotd" data-day="${d}" data-pid="${pid}">${sheetHead('Frage des Tages')}
      <p class="q-big">${esc(doc.q || question(d))}</p>
      ${isAdmin() && crew(t).length > 1 ? `<div class="chips list-chips">${crew(t).map(m => `<button type="button" class="chip${m.id === pid ? ' on' : ''}" data-action="q-form" data-day="${d}" data-pid="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <label class="field voice-field"><span>Antwort von ${esc(personName(pid))}</span>${app.voiceBtn ? app.voiceBtn('text') : ''}
        <textarea name="text" rows="3" maxlength="200">${esc(((doc.answers || {})[pid]) || '')}</textarea></label>
      ${Object.entries(doc.answers || {}).filter(([k, v]) => k !== pid && v).map(([k, v]) => `<p class="q-other"><b>${esc(personName(k))}:</b> ${esc(v)}</p>`).join('')}
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.qotd = form => {
    const t = currentTrip();
    const d = form.dataset.day;
    const doc = qDoc(t, d) || { id: qId(t, d), kind: 'qotd', tripId: t.id, day: d, q: question(d), answers: {} };
    save('games', { ...doc, answers: { ...(doc.answers || {}), [form.dataset.pid]: form.text.value.trim() } });
    closeSheet();
  };
  // Im Tagebuch und im Reiseheft unter den Highlights des Tages
  const dayHighlights = app.dayHighlights;
  app.dayHighlights = (t, d, print) => {
    const html = dayHighlights ? dayHighlights(t, d, print) : '';
    const doc = qDoc(t, d);
    const ans = doc ? Object.entries(doc.answers || {}).filter(([, v]) => v) : [];
    if (!ans.length) return html;
    const items = ans.map(([k, v]) => `<span><b>${esc(personName(k))}:</b> ${esc(v)}</span>`).join('');
    return `${html}${print ? `<p class="pd-hl">${esc(doc.q)} ${items}</p>`
      : `<button class="day-q" data-action="q-form" data-day="${d}">❓ <span><i>${esc(doc.q)}</i>${items}</span></button>`}`;
  };

  /* ---------- Heute-Karte und Kinder-Start ---------- */

  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard ? todayCard(t, st) : '';
    if (!html) return t && t.start > today() ? countdown(t) : html;
    const d = today();
    const open = openPolls().filter(p => (!p.tripId || p.tripId === t.id) && (p.votes || {})[me()] == null);
    const evening = new Date().getHours() >= 16;
    const answered = ((qDoc(t, d) || {}).answers || {})[me()];
    const row = [
      open.length ? `<a class="today-poll" href="#/abstimmung">🗳️ ${open.length === 1 ? `Abstimmung: ${esc(open[0].q)}` : `${open.length} offene Abstimmungen`}</a>` : '',
      evening && !answered ? `<button class="link today-q" data-action="q-form">❓ Frage des Tages: ${esc(question(d))}</button>` : '',
    ].filter(Boolean).join('');
    return row ? html.replace('<div class="today-links">', `<div class="today-fam">${row}</div><div class="today-links">`) : html;
  };
  // Planung einer Reise, die noch kommt: Countdown ganz oben
  const planung = VIEWS.planung;
  VIEWS.planung = t => `${t && t.start > today() ? countdown(t) : ''}${planung(t)}`;
  const kids = VIEWS.kinder;
  if (kids) VIEWS.kinder = () => {
    const html = kids();
    const t = currentTrip();
    const nt = nextTrip();
    const parts = [];
    if (nt && !running(t)) parts.push(countdown(nt, true));
    if (running(t) && new Date().getHours() >= 16) parts.push(`<button class="kids-tile wide" data-action="q-form">❓<b>${esc(question(today()))}</b></button>`);
    const open = openPolls().filter(p => (p.votes || {})[me()] == null);
    if (open.length && (!app.allowed || app.allowed('abstimmung'))) parts.push(`<a class="kids-tile wide" href="#/abstimmung">🗳️<b>Abstimmen: ${esc(open[0].q)}</b></a>`);
    return parts.length ? html.replace('</section>', `</section><section class="kids-today">${parts.join('')}</section>`) : html;
  };
}
