// Reisepass: ein eigener Pass für jede Person. Stempel gibt es automatisch für Camper-Erlebnisse
// (aus den Reisen, bei denen die Person dabei war), für jedes neue Land und jeden Traumort,
// und als eigene Stempel, die die Eltern vergeben. Neue Stempel „knallen“ beim nächsten Öffnen aufs Papier.

export default function installReisepass(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, esc, icon, pageHead, newId, save, remove, toast, openSheet, closeSheet,
    fmtShort, today, tripStats, sortTrips, members, me, personName, chromeHooks,
  } = app;
  const sheetHead = app.sheetHead;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
  const day = d => (d || '').slice(0, 10);
  const x = e => e.extra || {};
  const num = v => (v === '' || v == null ? 0 : +v || 0);

  /* ---------- Daten einer Person: nur Reisen, bei denen sie dabei war ---------- */

  function ctxOf(pid) {
    const trips = S.trips.filter(t => !t.members || t.members.includes(pid));
    const ids = new Set(trips.map(t => t.id));
    const es = S.entries.filter(e => e.date && ids.has(e.tripId)).slice().sort(byDate);
    return { pid, trips, es };
  }
  // n-tes passende Ereignis: wann und wo; sonst nur der Zwischenstand
  const nth = (list, n) => (list.length >= n ? { date: day(list[n - 1].date), place: list[n - 1].place || list[n - 1].title || '', cur: list.length } : { cur: list.length });
  const count = pred => (n, c) => nth(c.es.filter(pred), n);
  // Summe eines Werts bis zum Ziel (z. B. gewanderte Kilometer)
  const sum = (pred, val) => (goal, c) => {
    let s = 0;
    for (const e of c.es.filter(pred)) { s += val(e); if (s >= goal) return { date: day(e.date), place: e.place || e.title || '', cur: Math.round(s) }; }
    return { cur: Math.round(s) };
  };
  function kmTotal(goal, c) {
    let s = 0;
    for (const t of sortTrips(c.trips).reverse()) {
      s += tripStats(t).dist;
      if (s >= goal) return { date: t.end || t.start, place: t.name, cur: Math.round(s) };
    }
    return { cur: Math.round(s) };
  }
  function countries(goal, c) {
    const seen = [];
    for (const e of c.es) if (e.country && !seen.includes(e.country)) { seen.push(e.country); if (seen.length === goal) return { date: day(e.date), place: e.place, cur: goal }; }
    return { cur: seen.length };
  }
  const plates = set => (goal, c) => {
    const seen = [];
    for (const p of S.plates.filter(p => p.set === set && p.by === c.pid).slice().sort((a, b) => (a.at || 0) - (b.at || 0))) {
      if (!seen.includes(p.code)) { seen.push(p.code); if (seen.length === goal) return { date: new Date(p.at).toISOString().slice(0, 10), place: p.code, cur: goal }; }
    }
    return { cur: seen.length };
  };
  const ended = t => t.ended || (t.end && t.end < today());
  const tripDays = (pred, label) => (goal, c) => {
    const t = sortTrips(c.trips).reverse().find(t => ended(t) && pred(tripStats(t).days, goal));
    return t ? { date: t.end || t.start, place: t.name, cur: goal } : { cur: label ? 0 : Math.max(0, ...c.trips.map(t => tripStats(t).days)) };
  };
  // Zwei Länder an einem Tag
  function border(goal, c) {
    const byDay = {};
    for (const e of c.es) if (e.country) {
      const d = day(e.date);
      (byDay[d] ||= new Set()).add(e.country);
      if (byDay[d].size >= 2) return { date: d, place: [...byDay[d]].join(' → '), cur: 1 };
    }
    return { cur: 0 };
  }
  // Bingo: eine volle Reihe, Spalte oder Diagonale auf einer Karte dieser Person
  const LINES = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12]];
  function bingo(goal, c) {
    const won = S.games.filter(g => g.kind === 'bingo' && g.by === c.pid && LINES.some(l => l.every(i => (g.marked || []).includes(i))));
    if (!won.length) return { cur: 0 };
    const g = won.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))[0];
    return { date: new Date(g.updatedAt || Date.now()).toISOString().slice(0, 10), place: 'Reise-Bingo', cur: 1 };
  }
  function quiz(goal, c) {
    const q = S.games.find(g => g.id === `quiz_${c.pid}`);
    return q && q.best >= goal ? { date: new Date(q.updatedAt || Date.now()).toISOString().slice(0, 10), place: `${q.best} richtig in Folge`, cur: goal } : { cur: q ? q.best : 0 };
  }
  function dream(goal, c) {
    const i = S.ideas.find(i => i.tripId && c.trips.some(t => t.id === i.tripId));
    const t = i && S.trips.find(t => t.id === i.tripId);
    return t ? { date: t.start || new Date(t.createdAt).toISOString().slice(0, 10), place: t.name, cur: 1 } : { cur: 0 };
  }
  const photos = (goal, c) => {
    let s = 0;
    for (const e of c.es) { s += (e.photos || []).length; if (s >= goal) return { date: day(e.date), place: e.place || e.title || '', cur: s }; }
    return { cur: s };
  };
  const time = (from, to) => e => e.date.slice(11, 16) >= from && e.date.slice(11, 16) < to;

  // Vorgegebene Stempel: Kennung, Titel, Beschreibung, Symbol, Ziel, Prüfung
  const STAMPS = [
    // Übernachten
    ['erste-nacht', 'Erste Nacht', 'Die erste Übernachtung im Camper', 'stellplatz', 1, count(e => e.type === 'stellplatz')],
    ['naechte10', '10 Nächte', 'Zehn Nächte im Camper geschlafen', 'stellplatz', 10, count(e => e.type === 'stellplatz')],
    ['naechte25', '25 Nächte', 'Fünfundzwanzig Nächte im Camper', 'stellplatz', 25, count(e => e.type === 'stellplatz')],
    ['naechte50', '50 Nächte', 'Fünfzig Nächte unterwegs', 'stellplatz', 50, count(e => e.type === 'stellplatz')],
    ['naechte100', '100 Nächte', 'Hundert Nächte – echte Camper-Profis', 'stellplatz', 100, count(e => e.type === 'stellplatz')],
    ['wild', 'Frei gestanden', 'Eine Nacht frei in der Natur', 'mountain', 1, count(e => e.type === 'stellplatz' && x(e).stay === 'Frei stehen')],
    ['wild5', 'Wildnis-Profi', 'Fünf Nächte frei gestanden', 'mountain', 5, count(e => e.type === 'stellplatz' && x(e).stay === 'Frei stehen')],
    ['ruhig', 'Stille genießen', 'Ein sehr ruhiger Stellplatz', 'sunset', 1, count(e => e.type === 'stellplatz' && x(e).noise === 'sehr ruhig')],
    // Fahren
    ['km500', '500 km', 'Die ersten fünfhundert Kilometer', 'car', 500, kmTotal],
    ['km1000', '1000 km', 'Tausend Kilometer gefahren', 'car', 1000, kmTotal],
    ['km2500', '2500 km', 'Zweieinhalbtausend Kilometer', 'car', 2500, kmTotal],
    ['km5000', '5000 km', 'Fünftausend Kilometer gefahren', 'car', 5000, kmTotal],
    ['km10000', '10 000 km', 'Zehntausend Kilometer – einmal quer durch Europa und zurück', 'car', 10000, kmTotal],
    ['km40000', 'Einmal um die Erde', '40 000 Kilometer, so weit wie einmal um die Welt', 'car', 40000, kmTotal],
    ['tank10', 'Tankwart', 'Zehnmal getankt', 'tank', 10, count(e => e.type === 'tank')],
    ['service5', 'Wasserträger', 'Fünfmal Wasser getankt oder entsorgt', 'service', 5, count(e => e.type === 'service')],
    // Länder
    ['ausland', 'Ausland', 'Zum ersten Mal über eine Grenze', 'flag', 1, count(e => e.country && e.country !== 'DE')],
    ['grenze', 'Grenzgänger', 'Zwei Länder an einem Tag', 'flag', 1, border],
    ['laender3', '3 Länder', 'In drei Ländern unterwegs gewesen', 'flag', 3, countries],
    ['laender5', '5 Länder', 'Fünf Länder entdeckt', 'flag', 5, countries],
    ['laender10', '10 Länder', 'Zehn Länder – echte Weltenbummler', 'flag', 10, countries],
    ['laender15', '15 Länder', 'Fünfzehn Länder – halb Europa gesehen', 'flag', 15, countries],
    // Wasser
    ['faehre', 'Fährmann', 'Mit der Fähre übers Wasser', 'faehre', 1, count(e => e.type === 'faehre' && (x(e).kind === 'Fähre' || (!x(e).kind && /fähre/i.test(e.title || ''))))],
    ['faehre5', 'Kapitän', 'Fünfmal mit der Fähre gefahren', 'faehre', 5, count(e => e.type === 'faehre' && (x(e).kind === 'Fähre' || !x(e).kind))],
    ['meer', 'Meer gesehen', 'Im Meer gebadet', 'baden', 1, count(e => e.type === 'baden' && x(e).where === 'Meer')],
    ['see', 'Seepferdchen', 'In einem See gebadet', 'baden', 1, count(e => e.type === 'baden' && x(e).where === 'See')],
    ['baden5', 'Wasserratte', 'Fünfmal baden gewesen', 'baden', 5, count(e => e.type === 'baden')],
    ['baden20', 'Fisch', 'Zwanzigmal baden gewesen', 'baden', 20, count(e => e.type === 'baden')],
    ['eisbaden', 'Eisbader', 'In Wasser unter 16 °C gebadet', 'baden', 1, count(e => e.type === 'baden' && x(e).water !== '' && x(e).water != null && +x(e).water < 16)],
    // Draußen
    ['gipfel', 'Gipfelstürmer', 'Eine Tour mit mindestens 500 Höhenmetern', 'mountain', 1, count(e => e.type === 'wanderung' && num(x(e).up) >= 500)],
    ['bergziege', 'Bergziege', 'Eine Tour mit 1000 Höhenmetern', 'mountain', 1, count(e => e.type === 'wanderung' && num(x(e).up) >= 1000)],
    ['wandern50', 'Wanderkönig', 'Insgesamt 50 km gewandert', 'wanderung', 50, sum(e => e.type === 'wanderung' && x(e).mode !== 'mit dem Rad', e => num(x(e).km))],
    ['rad30', 'Radprofi', 'Eine Radtour über 30 km', 'wanderung', 1, count(e => e.type === 'wanderung' && x(e).mode === 'mit dem Rad' && num(x(e).km) >= 30)],
    ['rad200', 'Radmarathon', 'Insgesamt 200 km Rad gefahren', 'wanderung', 200, sum(e => e.type === 'wanderung' && x(e).mode === 'mit dem Rad', e => num(x(e).km))],
    // Entdecken
    ['museum5', 'Museumsfuchs', 'Fünf Museen besucht', 'museum', 5, count(e => e.type === 'museum')],
    ['kultur20', 'Entdecker', 'Zwanzig Sehenswürdigkeiten und Museen', 'sight', 20, count(e => e.type === 'sight' || e.type === 'museum')],
    ['kinder5', 'Spielplatz-Profi', 'Fünf Kinder-Highlights erlebt', 'kinder', 5, count(e => e.type === 'kinder')],
    ['eis', 'Schleckermaul', 'Fünfmal im Café oder Restaurant', 'restaurant', 5, count(e => e.type === 'restaurant')],
    ['traumort', 'Traumort', 'Ein Ort mit fünf Sternen', 'star', 1, count(e => e.rating === 5)],
    ['frueh', 'Frühaufsteher', 'Ein Eintrag vor 6:30 Uhr', 'sun', 1, count(time('03:00', '06:30'))],
    ['eule', 'Nachteule', 'Ein Eintrag nach 22:30 Uhr', 'sunset', 1, count(time('22:30', '24:00'))],
    // Reisen
    ['wochenende', 'Kurztrip', 'Eine Reise von höchstens drei Tagen', 'clock', 3, tripDays((d, g) => d >= 1 && d <= g, true)],
    ['lange-reise', 'Langstrecke', 'Eine Reise von mindestens 14 Tagen', 'clock', 14, tripDays((d, g) => d >= g)],
    ['reisen5', 'Weltenbummler', 'Fünf Reisen gemacht', 'badge', 5, (g, c) => { const l = sortTrips(c.trips.filter(ended)).reverse(); return l.length >= g ? { date: l[g - 1].end || l[g - 1].start, place: l[g - 1].name, cur: g } : { cur: l.length }; }],
    ['traum', 'Traum wird wahr', 'Aus einer Reiseidee wurde eine Reise', 'heart', 1, dream],
    ['fotos100', 'Fotograf', 'Hundert Fotos auf euren Reisen', 'camera', 100, photos],
    ['schreiber', 'Tagebuchschreiber', 'Zwanzig eigene Einträge geschrieben', 'notiz', 20, (g, c) => nth(c.es.filter(e => e.by === c.pid), g)],
    // Spiele
    ['kz25', 'Kennzeichen-Jäger', '25 Städte-Kennzeichen gesammelt', 'car', 25, plates('de')],
    ['kz100', 'Kennzeichen-König', '100 Städte-Kennzeichen gesammelt', 'car', 100, plates('de')],
    ['kz250', 'Kennzeichen-Kaiser', '250 Städte-Kennzeichen gesammelt', 'car', 250, plates('de')],
    ['kzint10', 'Europa-Spotter', '10 Länderkennzeichen gesehen', 'flag', 10, plates('int')],
    // Mithelfen und Erinnern
    ['helfer10', 'Helferlein', 'Zehn Camper-Dienste erledigt', 'check', 10, (g, c) => nth(S.games.filter(x => x.kind === 'duty' && c.trips.some(t => t.id === x.tripId))
      .flatMap(x => Object.values(x.done || {}).filter(p => p === c.pid).map(() => ({ date: x.day }))).sort(byDate), g)],
    ['helfer50', 'Superhelfer', 'Fünfzig Camper-Dienste erledigt', 'check', 50, (g, c) => nth(S.games.filter(x => x.kind === 'duty' && c.trips.some(t => t.id === x.tripId))
      .flatMap(x => Object.values(x.done || {}).filter(p => p === c.pid).map(() => ({ date: x.day }))).sort(byDate), g)],
    ['highlight10', 'Glückspilz', 'Zehn Highlights des Tages eingetragen', 'star', 10, (g, c) => nth(S.games.filter(x => x.kind === 'highlight' && x.by === c.pid)
      .map(x => ({ date: x.day, place: x.text })).sort(byDate), g)],
    ['bingo', 'Bingo!', 'Eine volle Reihe beim Reise-Bingo', 'star', 1, bingo],
    ['quiz10', 'Quiz-Ass', 'Zehn Kennzeichen in Folge richtig', 'badge', 10, quiz],
  ];
  const INK = ['#2E5FA8', '#B3261E', '#2F7A4A', '#7B4B94', '#A4462B', '#0F6670', '#C77700'];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  const ink = id => INK[Math.abs(hash(id)) % INK.length];
  const rot = id => (hash(id) % 9) - 4;
  const countryName = cc => (app.COUNTRIES && app.COUNTRIES[cc] && app.COUNTRIES[cc].name) || (() => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } })();

  /* ---------- Alle Stempel einer Person ---------- */

  // Je Zeichnen nur einmal rechnen (Ansicht, Stempel-Moment und Zähler fragen alle)
  const memo = new Map();
  chromeHooks.push(() => memo.clear());
  function passport(pid) {
    if (!memo.has(pid)) memo.set(pid, passportNow(pid));
    return memo.get(pid);
  }
  function passportNow(pid) {
    const c = ctxOf(pid);
    const auto = STAMPS.map(([id, title, text, ic, goal, fn]) => ({ id, kind: 'auto', title, text, ic, goal, ...fn(goal, c) }));
    // Länder: erster Eintrag im Land
    const lands = [];
    for (const e of c.es) if (e.country && !lands.some(l => l.cc === e.country)) {
      lands.push({ id: 'land:' + e.country, kind: 'land', cc: e.country, title: countryName(e.country), date: day(e.date), place: e.place || '' });
    }
    // Traumorte: fünf Sterne
    const places = c.es.filter(e => e.rating === 5 && e.type !== 'notiz')
      .map(e => ({ id: 'ort:' + e.id, kind: 'ort', title: e.title || e.place || '', ic: e.type, date: day(e.date), place: e.place || '' }));
    const own = S.stamps.filter(s => (s.to || []).includes(pid))
      .map(s => ({ id: 'eigen:' + s.id, kind: 'eigen', doc: s, title: s.title, text: s.note || '', ic: s.icon || 'star', color: s.color, date: s.date, place: s.place || '', from: s.by }));
    const got = [...auto.filter(s => s.date), ...own].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { got, open: auto.filter(s => !s.date), lands, places, all: [...got, ...lands, ...places] };
  }
  app.stampCount = pid => passport(pid || me()).got.length;

  /* ---------- Darstellung ---------- */

  function stampHtml(s, big) {
    if (s.kind === 'land') {
      return `<button class="visa${big ? ' big' : ''}" style="--ink:${ink(s.id)};--rot:${rot(s.id)}deg" data-action="stamp-info" data-id="${esc(s.id)}">
        <span class="v-flag">${app.flag ? app.flag(s.cc) : ''}</span><b>${esc(s.title)}</b><small>Einreise ${fmtShort(s.date)}</small></button>`;
    }
    if (s.kind === 'ort') {
      return `<button class="oval${big ? ' big' : ''}" style="--ink:${ink(s.id)};--rot:${rot(s.id)}deg" data-action="stamp-info" data-id="${esc(s.id)}">
        <span>${icon(s.ic)}<b>${esc(s.title)}</b><small>★★★★★ ${fmtShort(s.date)}</small></span></button>`;
    }
    const style = s.date ? `--ink:${s.color || ink(s.id)};--rot:${rot(s.id)}deg` : '';
    return `<button class="stamp${s.date ? '' : ' locked'}${s.kind === 'eigen' ? ' own' : ''}${big ? ' big' : ''}" style="${style}" data-action="stamp-info" data-id="${esc(s.id)}">
      <span class="st-ring">${icon(s.ic)}<b>${esc(s.title)}</b>${s.date ? `<small>${fmtShort(s.date)}</small>` : `<small>${Math.min(s.cur, s.goal).toLocaleString('de-DE')} / ${s.goal.toLocaleString('de-DE')}</small>`}</span>
    </button>`;
  }

  const who = () => (members().some(m => m.id === ui.passFor) ? ui.passFor : me());
  VIEWS.reisepass = () => {
    const pid = who();
    const p = passport(pid);
    setTimeout(() => celebrate(pid), 300);
    return `${pageHead('spiele', 'Reisepass', `${personName(pid)}: ${p.got.length} Stempel, ${p.lands.length} ${p.lands.length === 1 ? 'Land' : 'Länder'}`)}
      ${members().length > 1 ? `<div class="chips list-chips">${members().map(m =>
        `<button class="chip${m.id === pid ? ' on' : ''}" data-action="pass-for" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <section class="passport">
        <header><svg class="pp-sheep" aria-hidden="true"><use href="#schaf"/></svg>
          <div><b>Reisepass</b><span>${esc(personName(pid))}${app.crewName ? ` · ${esc(app.crewName())}` : ''}</span></div></header>
        <div class="pp-progress"><span style="width:${(p.got.filter(s => s.kind === 'auto').length / STAMPS.length) * 100}%"></span></div>
        ${p.got.length ? `<div class="stamps">${p.got.map(s => stampHtml(s)).join('')}</div>` : '<p class="hint">Noch keine Stempel. Die erste Nacht im Camper bringt den ersten!</p>'}
        ${isAdmin() ? `<div class="btnrow"><button class="ghost small-btn" data-action="stamp-form" data-to="${pid}">${icon('plus')}Eigenen Stempel vergeben</button></div>` : ''}
      </section>
      ${p.lands.length ? `<section class="passport visa-page"><h2 class="date-head">Länder</h2><div class="visas">${p.lands.map(s => stampHtml(s)).join('')}</div></section>` : ''}
      ${p.places.length ? `<section class="passport visa-page"><h2 class="date-head">Traumorte</h2><div class="stamps">${p.places.map(s => stampHtml(s)).join('')}</div></section>` : ''}
      ${p.open.length ? `<details class="open-stamps"><summary>Noch zu holen (${p.open.length})</summary><div class="stamps open">${p.open.map(s => stampHtml(s)).join('')}</div></details>` : '<p class="hint">Alle vorgegebenen Stempel gesammelt. Wahnsinn!</p>'}`;
  };
  ACTIONS['pass-for'] = el => { ui.passFor = el.dataset.id; app.render(); };

  ACTIONS['stamp-info'] = el => {
    const s = passport(who()).all.concat(passport(who()).open).find(x => x.id === el.dataset.id);
    if (!s) return;
    const text = s.kind === 'land' ? `Zum ersten Mal in ${s.title}${s.place ? `, in ${s.place}` : ''}.`
      : s.kind === 'ort' ? `Fünf Sterne für diesen Ort${s.place ? ` in ${s.place}` : ''}.` : `${s.text || ''}${s.text && !/[.!?]$/.test(s.text) ? '.' : ''}`;
    openSheet(`<div class="stamp-sheet">${sheetHead(esc(s.title))}
      <div class="stamps single">${stampHtml(s, true)}</div>
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${s.date ? `<p class="sub">${s.kind === 'eigen' ? `Vergeben von ${esc(personName(s.from))} am` : 'Verdient am'} ${fmtShort(s.date)}${s.place && s.kind !== 'land' && s.kind !== 'ort' ? ` – ${esc(s.place)}` : ''}.</p>`
        : `<p class="sub">Stand: ${Math.min(s.cur, s.goal).toLocaleString('de-DE')} von ${s.goal.toLocaleString('de-DE')}.</p>`}
      ${s.kind === 'eigen' && isAdmin() ? `<div class="sheet-foot"><button class="ghost danger" data-action="stamp-del" data-id="${s.doc.id}">Löschen</button>
        <button class="primary" data-action="stamp-form" data-id="${s.doc.id}">Bearbeiten</button></div>` : ''}</div>`);
  };

  /* ---------- Eigene Stempel (nur Eltern / Verwalter) ---------- */

  const ICONS = ['star', 'heart', 'badge', 'sun', 'sunset', 'mountain', 'baden', 'wanderung', 'kinder', 'faehre', 'museum', 'stellplatz', 'car', 'flag', 'camera', 'restaurant', 'notiz'];
  ACTIONS['stamp-form'] = el => {
    const s = S.stamps.find(x => x.id === el.dataset.id) || { to: [el.dataset.to || who()], date: today(), icon: 'star', color: INK[0] };
    openSheet(`<form data-form="stamp" data-id="${s.id || ''}" class="stamp-form">${sheetHead(s.id ? 'Stempel bearbeiten' : 'Eigenen Stempel vergeben')}
      <label class="field"><span>Name des Stempels</span><input name="title" value="${esc(s.title)}" maxlength="28" required placeholder="z. B. Mutprobe Klettersteig"></label>
      <label class="field"><span>Wofür?</span><input name="note" value="${esc(s.note)}" maxlength="120" placeholder="z. B. Ganz allein bis zum Gipfelkreuz"></label>
      <div class="field"><span>Symbol</span><div class="icon-pick">${ICONS.map(k => `<label><input type="radio" name="icon" value="${k}"${k === s.icon ? ' checked' : ''}><span>${icon(k)}</span></label>`).join('')}</div></div>
      <div class="field"><span>Farbe</span><div class="swatches">${INK.map(c => `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}"${c === s.color ? ' checked' : ''}><span></span></label>`).join('')}</div></div>
      <div class="row2">
        <label class="field"><span>Datum</span><input type="date" name="date" value="${s.date || today()}" required></label>
        <label class="field"><span>Ort</span><input name="place" value="${esc(s.place)}" placeholder="optional"></label>
      </div>
      <div class="field"><span>Für wen?</span><div class="chips wrap">${members().map(m =>
        `<label class="chip"><input type="checkbox" name="to" value="${m.id}"${(s.to || []).includes(m.id) ? ' checked' : ''}><span>${esc(m.name)}</span></label>`).join('')}</div></div>
      <div class="sheet-foot"><button class="primary">${s.id ? 'Speichern' : 'Stempeln!'}</button></div></form>`);
  };
  FORMS.stamp = form => {
    const to = [...form.querySelectorAll('[name=to]:checked')].map(c => c.value);
    if (!to.length) return toast('Bitte mindestens eine Person auswählen.');
    const old = S.stamps.find(x => x.id === form.dataset.id);
    save('stamps', {
      ...(old || { id: newId(), by: me(), createdAt: Date.now() }),
      title: form.title.value.trim(), note: form.note.value.trim(), icon: form.icon.value, color: form.color.value,
      date: form.date.value, place: form.place.value.trim(), to,
    });
    closeSheet();
    toast(old ? 'Stempel gespeichert' : `Gestempelt für ${to.map(personName).join(', ')}!`);
  };
  ACTIONS['stamp-del'] = el => {
    if (!confirm('Diesen Stempel aus allen Pässen entfernen?')) return;
    remove('stamps', el.dataset.id);
    closeSheet();
  };

  /* ---------- Stempel-Moment: neue Stempel knallen aufs Papier ---------- */

  const seenKey = pid => 'stamps.seen.' + pid;
  let showing = false;
  function celebrate(pid) {
    if (showing || pid !== me() || document.querySelector('.intro')) return;
    const ids = passport(pid).all.map(s => s.id);
    const seen = LS.get(seenKey(pid), null);
    // Beim allerersten Mal still merken, sonst knallen alle alten Stempel auf einmal
    if (!seen) return LS.set(seenKey(pid), ids);
    const fresh = passport(pid).all.filter(s => !seen.includes(s.id));
    if (!fresh.length) return;
    LS.set(seenKey(pid), ids);
    showing = true;
    const el = document.createElement('div');
    el.className = 'stamp-pop';
    let i = 0;
    const show = () => {
      const s = fresh[i];
      el.innerHTML = `<div class="sp-card"><p class="sp-k">Neuer Stempel${fresh.length > 1 ? ` (${i + 1} von ${fresh.length})` : ''}!</p>
        <div class="sp-stamp">${stampHtml(s, true)}</div>
        <p class="sp-t">${esc(s.kind === 'land' ? `Willkommen in ${s.title}!` : s.text || s.title)}</p>
        <button class="primary" data-sp="next">${i < fresh.length - 1 ? 'Nächster' : 'Super!'}</button></div>`;
      el.querySelector('[data-sp]').focus();
    };
    el.addEventListener('click', ev => {
      if (ev.target.closest('[data-sp]') || ev.target === el) {
        if (++i < fresh.length) show(); else { el.remove(); showing = false; }
      }
    });
    document.body.appendChild(el);
    show();
  }
  // Beim Öffnen der App einmal nachsehen (nach dem ersten Abgleich)
  let checked = false;
  chromeHooks.push(() => {
    if (checked || !(app.session() && app.session().user)) return;
    checked = true;
    setTimeout(() => { if (!app.allowed || app.allowed('spiel:reisepass')) celebrate(me()); }, 4000);
  });
}
