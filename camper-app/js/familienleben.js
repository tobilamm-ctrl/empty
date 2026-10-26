// Familie und Kinder: Ansage bei „Wie lange noch?“, Wunschzettel der Kinder, Camping-Freundebuch,
// Reise-Urkunde zum Ausdrucken und Ausmalbild aus einem Foto.

export default function installFamilienleben(app) {
  const { S, LS, ui, VIEWS, ACTIONS, FORMS, CHANGES, esc, icon, pageHead, newId, save, remove, toast, render, openSheet, closeSheet,
    currentTrip, tripEntries, tripStats, members, me, personName, today, fmtDay, fmtShort, fmtRange, fmtKm, byDate, shrink } = app;
  const sheetHead = app.sheetHead;
  const player = () => (app.player ? app.player() : me());

  /* ====================================================================== */
  /* Ansage bei „Wie lange noch?“                                            */
  /* ====================================================================== */

  const canSpeak = 'speechSynthesis' in window;
  function sayEta() {
    const sec = document.querySelector('.eta');
    if (!sec || !canSpeak) return false;
    const txt = [...sec.querySelectorAll('.eta-pre, .eta-big, .eta-sub')].map(x => x.textContent.trim()).join(' ')
      .replace(/(\d+) Std\./g, (m, n) => `${n} ${n === '1' ? 'Stunde' : 'Stunden'}`).replace(/(\d+) Min\./g, (m, n) => `${n} ${n === '1' ? 'Minute' : 'Minuten'}`).replace(/(\d+(?:,\d+)?) km/g, '$1 Kilometer')
      .replace(/gegen (\d+):(\d\d) Uhr/, (m, h, mm) => `gegen ${+h} Uhr ${+mm || ''}`).replace(/\bca\.\s*/g, 'ungefähr ');
    if (!txt || /berechnet/.test(txt)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'de-DE'; u.rate = 0.95;
    speechSynthesis.speak(u);
    LS.set('etaSaid', Date.now());
    return true;
  }
  const noch = VIEWS.nochweit;
  VIEWS.nochweit = () => {
    const html = noch();
    if (!canSpeak || !html.includes('class="eta"')) return html;
    const on = LS.get('etaSpeak', false) === true;
    return html.replace('<div class="btnrow"><button class="primary" data-action="eta-refresh">', `<div class="eta-speak">
        <button class="ghost" data-action="eta-say">🔊 Ansagen</button>
        <label class="check"><input type="checkbox" data-action="eta-auto"${on ? ' checked' : ''}><span>Alle 15 Minuten ansagen</span></label></div>
      <div class="btnrow"><button class="primary" data-action="eta-refresh">`);
  };
  ACTIONS['eta-say'] = () => { if (!sayEta()) toast('Die Restzeit wird noch berechnet.'); };
  CHANGES['eta-auto'] = el => { LS.set('etaSpeak', el.checked); if (el.checked) sayEta(); };
  setInterval(() => {
    if (ui.route === 'nochweit' && LS.get('etaSpeak', false) === true && Date.now() - LS.get('etaSaid', 0) >= 15 * 60000) sayEta();
  }, 30000);

  /* ====================================================================== */
  /* Wunschzettel der Kinder                                                 */
  /* ====================================================================== */

  const wishTrip = () => {
    const t = currentTrip();
    if (t && !t.archived) return t;
    return app.sortTrips(S.trips).find(x => x.start && x.start >= today() && !x.archived) || t;
  };
  const wishDoc = (t, mid) => S.games.find(g => g.id === `wish_${t.id}_${mid}`) || { id: `wish_${t.id}_${mid}`, kind: 'wish', tripId: t.id, by: mid, wishes: [] };
  VIEWS.wunschzettel = () => {
    const t = wishTrip();
    if (!t) return `${pageHead('wunschzettel', 'Wunschzettel')}<p class="hint">Legt zuerst eine Reise an.</p>`;
    const people = members();
    const cur = people.some(m => m.id === ui.wishFor) ? ui.wishFor : player();
    const doc = wishDoc(t, cur);
    const all = people.map(m => ({ m, d: wishDoc(t, m.id) })).filter(x => x.d.wishes.length);
    const wish = w => `<li class="${w.done ? 'done' : ''}">
        ${w.done ? `<span class="wish-ok">✓</span>` : `<button class="wish-tick" data-action="wish-done" data-id="${w.id}" aria-label="Erfüllt">☆</button>`}
        <span class="txt"><b>${esc(w.text)}</b>${w.done ? `<small>Erfüllt am ${fmtDay(w.doneAt)}</small>` : ''}</span>
        ${w.photo ? `<img data-photo="${w.photo.id}" src="${w.photo.thumb}" alt="">` : ''}
        ${!w.done ? `<button class="icon-btn small" data-action="wish-del" data-id="${w.id}" aria-label="Wunsch löschen">${icon('close')}</button>` : ''}
      </li>`;
    return `${pageHead('wunschzettel', 'Wunschzettel', `Drei Wünsche für „${esc(t.name)}“`)}
      ${people.length > 1 ? `<div class="chips list-chips">${people.map(m => `<button class="chip${m.id === cur ? ' on' : ''}" data-action="wish-for" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <section class="panel wish-card">
        <h2>${esc(personName(cur))} wünscht sich …</h2>
        <ul class="wish-list">${doc.wishes.map(wish).join('') || '<li class="none">Noch keine Wünsche.</li>'}</ul>
        ${doc.wishes.length < 3 ? `<form data-form="wish" data-mid="${cur}" class="pin-form"><input name="text" maxlength="80" required placeholder="z. B. Delfine sehen, Pommes am Strand"><button class="primary">${icon('plus')}</button></form>`
          : '<p class="sub">Drei Wünsche sind eingetragen.</p>'}
      </section>
      ${all.filter(x => x.m.id !== cur).length ? `<h2 class="date-head">Die anderen</h2>${all.filter(x => x.m.id !== cur).map(x => `<section class="panel wish-card small">
        <h3>${esc(x.m.name)}</h3><ul class="wish-list">${x.d.wishes.map(w => `<li class="${w.done ? 'done' : ''}"><span>${w.done ? '✓' : '☆'}</span><span class="txt">${esc(w.text)}</span></li>`).join('')}</ul></section>`).join('')}` : ''}
      <div class="btnrow"><button class="ghost" data-action="certificate">🏅 Reise-Urkunde</button></div>`;
  };
  ACTIONS['wish-for'] = el => { ui.wishFor = el.dataset.id; render(); };
  FORMS.wish = form => {
    const t = wishTrip(), d = wishDoc(t, form.dataset.mid), text = form.text.value.trim();
    if (!text || d.wishes.length >= 3) return;
    save('games', { ...d, wishes: [...d.wishes, { id: newId(), text, done: false }] });
    form.reset();
  };
  const findWish = id => { const t = wishTrip(); for (const m of members()) { const d = wishDoc(t, m.id); const w = d.wishes.find(x => x.id === id); if (w) return { d, w }; } return {}; };
  ACTIONS['wish-del'] = el => { const { d } = findWish(el.dataset.id); if (d) save('games', { ...d, wishes: d.wishes.filter(w => w.id !== el.dataset.id) }); };
  let wishPhoto = null;
  ACTIONS['wish-done'] = el => {
    const { w } = findWish(el.dataset.id);
    if (!w) return;
    wishPhoto = null;
    openSheet(`<form data-form="wish-done" data-id="${w.id}">${sheetHead('Wunsch erfüllt! 🎉')}
      <p class="wish-big">„${esc(w.text)}“</p>
      <label class="field"><span>Wann?</span><input type="date" name="date" value="${today()}"></label>
      <div class="field"><span>Ein Foto dazu?</span><div class="photo-grid" id="wishPh"></div>
        <label class="ghost file">${icon('camera')}Foto<input type="file" accept="image/*" data-action="wish-photo"></label></div>
      <div class="sheet-foot"><button class="primary">Erfüllt</button></div></form>`);
  };
  CHANGES['wish-photo'] = async el => {
    const f = el.files[0]; el.value = '';
    if (!f) return;
    try { wishPhoto = { id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1920, 0.8) }; document.getElementById('wishPh').innerHTML = `<figure><img src="${wishPhoto.thumb}" alt=""></figure>`; } catch { toast('Das Foto ließ sich nicht lesen.'); }
  };
  FORMS['wish-done'] = form => {
    const { d } = findWish(form.dataset.id);
    if (!d) return;
    if (wishPhoto) save('photos', { id: wishPhoto.id, tripId: d.tripId, data: wishPhoto.data });
    save('games', { ...d, wishes: d.wishes.map(w => (w.id === form.dataset.id ? { ...w, done: true, doneAt: form.date.value || today(), photo: wishPhoto ? { id: wishPhoto.id, thumb: wishPhoto.thumb } : null } : w)) });
    closeSheet();
    toast('Hurra, ein Wunsch ist in Erfüllung gegangen!');
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
  };

  /* ====================================================================== */
  /* Camping-Freundebuch                                                     */
  /* ====================================================================== */

  const friends = () => S.games.filter(g => g.kind === 'friend').sort((a, b) => (b.met || '').localeCompare(a.met || ''));
  VIEWS.freunde = () => {
    const list = friends();
    return `${pageHead('freunde', 'Freundebuch', 'Familien, die ihr unterwegs kennengelernt habt')}
      <div class="btnrow"><button class="primary" data-action="friend-form">${icon('plus')}Neue Freunde</button></div>
      ${list.length ? `<div class="friend-grid">${list.map(f => `<button class="friend-card" data-action="friend-view" data-id="${f.id}">
          ${f.photo ? `<img src="${f.photo.thumb}" alt="">` : '<span class="friend-ph">👋</span>'}
          <b>${esc(f.name)}</b><small>${esc([f.where, f.met ? fmtShort(f.met) : ''].filter(Boolean).join(' · '))}</small></button>`).join('')}</div>`
        : '<p class="hint">Nette Familie am Nachbarplatz? Tragt sie hier ein, mit Kindern, Wohnort, Kontakt und Foto. So findet ihr euch nach der Reise wieder.</p>'}`;
  };
  const FIELDS = [['name', 'Familie / Name', 'z. B. Familie Berger'], ['who', 'Wer gehört dazu?', 'z. B. Anna, Tom, Mia (7), Paul (4)'], ['home', 'Woher?', 'z. B. Linz'],
    ['where', 'Wo kennengelernt?', ''], ['phone', 'Telefon', ''], ['mail', 'E-Mail', ''], ['social', 'Instagram oder Sonstiges', ''],
    ['fav', 'Steckbrief: Das mögen die Kinder', 'z. B. Fußball, Pferde, Lego'], ['note', 'Das war toll zusammen', 'z. B. Lagerfeuer, Muschelsuche']];
  let friendPhoto = null;
  ACTIONS['friend-form'] = el => {
    const f = S.games.find(g => g.id === (el && el.dataset.id)) || {};
    const t = currentTrip();
    const stay = t && tripEntries(t).filter(e => e.type === 'stellplatz').sort(byDate).pop();
    friendPhoto = f.photo ? { ...f.photo, keep: true } : null;
    openSheet(`<form data-form="friend" data-id="${f.id || ''}">${sheetHead(f.id ? 'Freunde bearbeiten' : 'Neue Freunde')}
      ${FIELDS.map(([k, l, ph]) => `<label class="field"><span>${l}</span>${k === 'note' || k === 'fav' ? `<textarea name="${k}" rows="2" placeholder="${ph}">${esc(f[k])}</textarea>`
        : `<input name="${k}" value="${esc(f[k] ?? (k === 'where' && stay ? stay.title || stay.place || '' : ''))}" placeholder="${ph}"${k === 'name' ? ' required' : ''}${k === 'phone' ? ' type="tel"' : k === 'mail' ? ' type="email"' : ''}></label>`}`).join('')}
      <label class="field"><span>Wann?</span><input type="date" name="met" value="${f.met || today()}"></label>
      <div class="field"><span>Foto</span><div class="photo-grid" id="frPh">${friendPhoto ? `<figure><img src="${friendPhoto.thumb}" alt=""></figure>` : ''}</div>
        <label class="ghost file">${icon('camera')}Foto<input type="file" accept="image/*" data-action="friend-photo"></label></div>
      <div class="sheet-foot">${f.id ? `<button type="button" class="ghost danger" data-action="friend-del" data-id="${f.id}">Löschen</button>` : ''}<button class="primary">Speichern</button></div></form>`);
  };
  CHANGES['friend-photo'] = async el => {
    const file = el.files[0]; el.value = '';
    if (!file) return;
    try { friendPhoto = { id: newId(), thumb: await shrink(file, 360, 0.7), data: await shrink(file, 1600, 0.8) }; document.getElementById('frPh').innerHTML = `<figure><img src="${friendPhoto.thumb}" alt=""></figure>`; } catch { toast('Das Foto ließ sich nicht lesen.'); }
  };
  FORMS.friend = form => {
    const old = S.games.find(g => g.id === form.dataset.id);
    const t = currentTrip();
    if (friendPhoto && !friendPhoto.keep) { save('photos', { id: friendPhoto.id, data: friendPhoto.data }); if (old && old.photo) remove('photos', old.photo.id); }
    const doc = { ...(old || { id: newId(), kind: 'friend', by: me(), at: Date.now(), tripId: t ? t.id : null }), met: form.met.value };
    FIELDS.forEach(([k]) => { doc[k] = form[k].value.trim(); });
    if (friendPhoto) doc.photo = { id: friendPhoto.id, thumb: friendPhoto.thumb };
    save('games', doc);
    closeSheet();
    toast('Ins Freundebuch eingetragen');
  };
  ACTIONS['friend-del'] = el => { const f = S.games.find(g => g.id === el.dataset.id); if (!f || !confirm(`„${f.name}“ aus dem Freundebuch löschen?`)) return; if (f.photo) remove('photos', f.photo.id); remove('games', f.id); closeSheet(); };
  ACTIONS['friend-view'] = el => {
    const f = S.games.find(g => g.id === el.dataset.id);
    if (!f) return;
    const tel = (f.phone || '').replace(/[^\d+]/g, '');
    openSheet(`<div class="friend-view">${sheetHead(esc(f.name))}
      ${f.photo ? `<img class="friend-photo" data-photo="${f.photo.id}" src="${f.photo.thumb}" alt="">` : ''}
      <dl class="facts-list">${FIELDS.filter(([k]) => k !== 'name' && f[k]).map(([k, l]) => `<div><dt>${l.replace('Steckbrief: ', '')}</dt><dd>${k === 'phone' ? `<a href="tel:${esc(tel)}">${esc(f.phone)}</a>`
        : k === 'mail' ? `<a href="mailto:${esc(f.mail)}">${esc(f.mail)}</a>` : esc(f[k])}</dd></div>`).join('')}
        ${f.met ? `<div><dt>Kennengelernt</dt><dd>${fmtDay(f.met)}</dd></div>` : ''}</dl>
      <div class="sheet-foot">${f.phone || f.mail ? `<button class="ghost" data-action="friend-vcf" data-id="${f.id}">Ins Adressbuch</button>` : ''}
        <button class="primary" data-action="friend-form" data-id="${f.id}">Bearbeiten</button></div></div>`, root => {
      root.querySelectorAll('[data-photo]').forEach(img => app.store().get('photos', img.dataset.photo).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {}));
    });
  };
  ACTIONS['friend-vcf'] = el => {
    const f = S.games.find(g => g.id === el.dataset.id);
    const v = s => String(s || '').replace(/[,;\\]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const card = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${v(f.name)}`, `N:${v(f.name)};;;;`, f.phone ? `TEL;TYPE=CELL:${v(f.phone)}` : '', f.mail ? `EMAIL:${v(f.mail)}` : '',
      f.home ? `ADR;TYPE=HOME:;;;${v(f.home)};;;` : '', `NOTE:${v([f.who, f.where ? 'Kennengelernt: ' + f.where : '', f.met ? fmtDay(f.met) : '', f.note].filter(Boolean).join(' – '))}`, 'END:VCARD'].filter(Boolean).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([card], { type: 'text/vcard' }));
    a.download = `${f.name.replace(/[^\wäöüÄÖÜß -]/g, '') || 'Kontakt'}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  /* ====================================================================== */
  /* Reise-Urkunde für Kinder                                                */
  /* ====================================================================== */

  ACTIONS.certificate = () => {
    const t = wishTrip() || currentTrip();
    if (!t) return toast('Legt zuerst eine Reise an.');
    const trips = app.sortTrips(S.trips).filter(x => tripEntries(x).length);
    openSheet(`<form data-form="certificate">${sheetHead('Reise-Urkunde')}
      <label class="field"><span>Für wen?</span><select name="who">${members().map(m => `<option value="${m.id}"${m.id === player() ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Reise</span><select name="trip">${trips.map(x => `<option value="${x.id}"${x.id === t.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Ein Satz dazu (optional)</span><input name="line" maxlength="100" placeholder="z. B. für den mutigsten Sprung ins Meer"></label>
      <p class="sub">Im Druckfenster „Als PDF speichern“ oder direkt drucken. Querformat passt am besten.</p>
      <div class="sheet-foot"><button class="primary">${icon('print')}Urkunde erstellen</button></div></form>`);
  };
  FORMS.certificate = async form => {
    const t = S.trips.find(x => x.id === form.trip.value), pid = form.who.value, name = personName(pid);
    const st = tripStats(t);
    const ccs = app.tripCountries ? app.tripCountries(t) : [];
    const end = t.end || (tripEntries(t).slice().sort(byDate).pop() || {}).date?.slice(0, 10) || today();
    const animals = S.games.filter(g => g.kind === 'animal' && g.by === pid && g.tripId === t.id).length;
    const stamps = (S.stamps || []).filter(s => (s.to || []).includes(pid) && s.date >= (t.start || st.firstDay || '') && s.date <= end).length;
    const wishes = (wishDoc(t, pid).wishes || []).filter(w => w.done).length;
    // Spielesiege aus Punkteblock und Kniffel (spielekiste.js)
    const gw = app.gameStandings ? (app.gameStandings(t.id).rows.find(r => r.name === name) || {}).wins || 0 : 0;
    const rf = S.games.find(g => g.id === `reisefoto_${t.id}`);
    const firstPh = tripEntries(t).slice().sort(byDate).find(e => (e.photos || []).length);
    const ph = rf ? rf.photoId : firstPh ? firstPh.photos[0].id : null;
    let src = rf ? rf.thumb : firstPh ? firstPh.photos[0].thumb : '';
    try { if (ph) { const p = await app.store().get('photos', ph); if (p && p.data) src = p.data; } } catch { /* Vorschaubild reicht */ }
    const facts = [st.dist ? [fmtKm(st.dist), 'unterwegs'] : null, st.days ? [st.days, st.days === 1 ? 'Tag' : 'Tage'] : null, st.nights ? [st.nights, st.nights === 1 ? 'Stellplatz' : 'Stellplätze'] : null,
      ccs.length ? [ccs.length, ccs.length === 1 ? 'Land' : 'Länder'] : null, animals ? [animals, animals === 1 ? 'Tier entdeckt' : 'Tiere entdeckt'] : null,
      stamps ? [stamps, stamps === 1 ? 'Stempel' : 'Stempel'] : null, wishes ? [wishes, wishes === 1 ? 'Wunsch erfüllt' : 'Wünsche erfüllt'] : null,
      gw ? [gw, gw === 1 ? 'Spiel gewonnen' : 'Spiele gewonnen'] : null].filter(Boolean);
    const html = `<article class="cert">
      <div class="cert-frame">
        <svg class="cert-sheep" aria-hidden="true"><use href="#schaf"/></svg>
        <p class="cert-kicker">LAMMping</p>
        <h1>Reise-Urkunde</h1>
        <p class="cert-for">für</p>
        <p class="cert-name">${esc(name)}</p>
        <p class="cert-text">hat die Reise <b>„${esc(t.name)}“</b> ${esc(fmtRange(t))} mitgemacht${form.line.value.trim() ? ` – ${esc(form.line.value.trim())}` : ''}.</p>
        <div class="cert-body">${src ? `<img src="${src}" alt="">` : ''}
          <ul class="cert-facts">${facts.map(([n, l]) => `<li><b>${esc(String(n))}</b> ${esc(l)}</li>`).join('')}</ul></div>
        ${ccs.length ? `<p class="cert-flags">${ccs.map(cc => `${app.flag ? app.flag(cc) : ''} ${esc((app.COUNTRIES[cc] || {}).name || cc)}`).join(' · ')}</p>` : ''}
        <div class="cert-sign"><div><span></span>Ort, Datum</div><div><span></span>Unterschrift der Eltern</div></div>
      </div></article>`;
    closeSheet();
    if (app.printHtml) app.printHtml(html, `Reise-Urkunde ${name} ${t.name}`);
  };
  // Auch im Export-Fenster der Reise
  const exportForm = ACTIONS['export-form'];
  ACTIONS['export-form'] = el => {
    exportForm(el);
    const foot = document.querySelector('#sheetBody form[data-form=export-pdf] .sheet-foot');
    if (foot) foot.insertAdjacentHTML('beforebegin', `<h3 class="date-head">Für die Kinder</h3><button type="button" class="ghost" data-action="certificate">🏅 Reise-Urkunde</button>`);
  };

  /* ====================================================================== */
  /* Ausmalbild aus einem Foto                                               */
  /* ====================================================================== */

  let paint = null;   // { img, detail, thick }
  app.coloring = async id => {
    let src = null;
    try { const p = await app.store().get('photos', id); src = p && p.data; } catch { /* unten */ }
    if (!src) return toast('Das Foto ist gerade nicht verfügbar.');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { paint = { img, detail: 12, thick: 2 }; openSheet(`<div class="coloring">${sheetHead('Ausmalbild')}
      <canvas id="colorCv"></canvas>
      <label class="field"><span>Wie viele Linien?</span><input type="range" min="5" max="22" value="12" data-action="col-detail"></label>
      <label class="field"><span>Linienstärke</span><input type="range" min="1" max="4" value="2" data-action="col-thick"></label>
      <div class="sheet-foot"><button class="ghost" data-action="col-save">Als Bild speichern</button><button class="primary" data-action="col-print">${icon('print')}Drucken</button></div></div>`);
      setTimeout(drawColoring, 30); };
    img.onerror = () => toast('Das Foto ließ sich nicht laden.');
    img.src = src;
  };
  function drawColoring() {
    const cv = document.getElementById('colorCv');
    if (!cv || !paint) return;
    const { img, detail, thick } = paint;
    const sc = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * sc), H = Math.round(img.naturalHeight * sc);
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    let d;
    try { d = ctx.getImageData(0, 0, W, H); } catch { toast('Dieses Foto lässt sich nicht umwandeln.'); return; }
    const px = d.data, g = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) g[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
    // Weichzeichnen (zweimal Kasten 3×3), damit nur deutliche Kanten bleiben
    const blur = a => { const o = new Float32Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += a[(y + dy) * W + x + dx]; o[y * W + x] = s / 9; } return o; };
    const b = blur(blur(blur(g)));
    const mag = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = -b[i - W - 1] - 2 * b[i - 1] - b[i + W - 1] + b[i - W + 1] + 2 * b[i + 1] + b[i + W + 1];
      const gy = -b[i - W - 1] - 2 * b[i - W] - b[i - W + 1] + b[i + W - 1] + 2 * b[i + W] + b[i + W + 1];
      mag[i] = Math.hypot(gx, gy);
    }
    // Schwelle: die stärksten detail % der Kanten werden Linien
    const sorted = Array.from(mag).filter((v, i) => i % 7 === 0).sort((a, c) => c - a);
    const thr = sorted[Math.floor(sorted.length * detail / 100)] || 1;
    const line = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (mag[i] >= thr) line[i] = 1;
    const r = thick - 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let on = line[y * W + x];
      for (let dy = -r; dy <= r && !on; dy++) for (let dx = -r; dx <= r && !on; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W && line[yy * W + xx]) on = 1; }
      const v = on ? 25 : 255, i = (y * W + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
    ctx.putImageData(d, 0, 0);
  }
  CHANGES['col-detail'] = el => { paint.detail = +el.value; drawColoring(); };
  CHANGES['col-thick'] = el => { paint.thick = +el.value; drawColoring(); };
  ACTIONS['col-save'] = () => {
    const cv = document.getElementById('colorCv');
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = 'Ausmalbild.png'; a.click();
  };
  ACTIONS['col-print'] = () => {
    const cv = document.getElementById('colorCv');
    if (app.printHtml) app.printHtml(`<article class="coloring-print"><img src="${cv.toDataURL('image/png')}" alt=""><p>Ausmalbild · LAMMping</p></article>`, 'Ausmalbild');
  };
  ACTIONS['col-from-viewer'] = el => {
    const dlg = document.querySelector('dialog.photo-viewer');
    if (dlg) dlg.dispatchEvent(new Event('cancel'));
    setTimeout(() => app.coloring(el.dataset.id), 100);
  };

  /* ---------- Kinder-Startseite ---------- */

  const kids = VIEWS.kinder;
  if (kids) VIEWS.kinder = () => kids().replace('</section>', `</section><section class="kids-today">
    <a class="kids-tile wide" href="#/wunschzettel">🌠<b>Mein Wunschzettel</b></a><a class="kids-tile wide" href="#/freunde">👋<b>Freundebuch</b></a></section>`);

}
