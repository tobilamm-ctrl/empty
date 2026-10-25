// Reisepass: Stempel für erreichte Camper-Erlebnisse. Alles wird aus den vorhandenen Daten berechnet,
// die ganze Familie sammelt gemeinsam. Jeder Stempel zeigt, wann und wo er verdient wurde.

export default function installReisepass(app) {
  const { S, VIEWS, ACTIONS, esc, icon, pageHead, openSheet, fmtShort, tripStats, sortTrips } = app;
  const sheetHead = t => `<div class="sheet-head"><h2>${t}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>`;

  const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
  const es = () => S.entries.filter(e => e.date).slice().sort(byDate);
  // n-tes passendes Ereignis: wann und wo
  const nth = (list, n) => (list.length >= n ? { date: list[n - 1].date.slice(0, 10), place: list[n - 1].place || list[n - 1].title || '', cur: list.length } : { cur: list.length });
  const count = (pred, n) => nth(es().filter(pred), n);
  const x = e => e.extra || {};

  function kmTotal(goal) {
    let sum = 0;
    for (const t of sortTrips(S.trips).reverse()) {
      sum += tripStats(t).dist;
      if (sum >= goal) return { date: t.end || t.start, place: t.name, cur: Math.round(sum) };
    }
    return { cur: Math.round(sum) };
  }
  function countries(goal) {
    const seen = [];
    for (const e of es()) if (e.country && !seen.includes(e.country)) { seen.push(e.country); if (seen.length === goal) return { date: e.date.slice(0, 10), place: e.place, cur: goal }; }
    return { cur: seen.length };
  }
  function plates(goal) {
    const seen = [];
    for (const p of S.plates.filter(p => p.set === 'de').slice().sort((a, b) => (a.at || 0) - (b.at || 0))) {
      if (!seen.includes(p.code)) { seen.push(p.code); if (seen.length === goal) return { date: new Date(p.at).toISOString().slice(0, 10), place: p.code, cur: goal }; }
    }
    return { cur: seen.length };
  }
  function longTrip(days) {
    const t = sortTrips(S.trips).reverse().find(t => tripStats(t).days >= days && (t.ended || (t.end && t.end < new Date().toISOString().slice(0, 10))));
    return t ? { date: t.end, place: t.name, cur: days } : { cur: Math.max(0, ...S.trips.map(t => tripStats(t).days)) };
  }

  // Stempel: Kennung, Titel, Beschreibung, Symbol, Ziel, Prüfung
  const STAMPS = [
    ['erste-nacht', 'Erste Nacht', 'Die erste Übernachtung im Camper', 'stellplatz', 1, n => count(e => e.type === 'stellplatz', n)],
    ['zehn-naechte', '10 Nächte', 'Zehn Nächte im Camper geschlafen', 'stellplatz', 10, n => count(e => e.type === 'stellplatz', n)],
    ['fuenfzig-naechte', '50 Nächte', 'Fünfzig Nächte unterwegs', 'stellplatz', 50, n => count(e => e.type === 'stellplatz', n)],
    ['wild', 'Frei gestanden', 'Eine Nacht frei in der Natur', 'sight', 1, n => count(e => e.type === 'stellplatz' && x(e).stay === 'Frei stehen', n)],
    ['km1000', '1000 km', 'Tausend Kilometer gefahren', 'car', 1000, kmTotal],
    ['km5000', '5000 km', 'Fünftausend Kilometer gefahren', 'car', 5000, kmTotal],
    ['km10000', '10 000 km', 'Zehntausend Kilometer – einmal halb um Europa', 'car', 10000, kmTotal],
    ['ausland', 'Ausland', 'Zum ersten Mal über eine Grenze', 'flag', 1, n => count(e => e.country && e.country !== 'DE', n)],
    ['drei-laender', '3 Länder', 'In drei Ländern unterwegs gewesen', 'flag', 3, countries],
    ['fuenf-laender', '5 Länder', 'Fünf Länder entdeckt', 'flag', 5, countries],
    ['zehn-laender', '10 Länder', 'Zehn Länder – echte Weltenbummler', 'flag', 10, countries],
    ['faehre', 'Fährmann', 'Mit der Fähre übers Wasser', 'faehre', 1, n => count(e => e.type === 'faehre' && (x(e).kind === 'Fähre' || (!x(e).kind && /fähre/i.test(e.title || ''))), n)],
    ['meer', 'Meer gesehen', 'Im Meer gebadet', 'baden', 1, n => count(e => e.type === 'baden' && x(e).where === 'Meer', n)],
    ['wasserratte', 'Wasserratte', 'Fünfmal baden gewesen', 'baden', 5, n => count(e => e.type === 'baden', n)],
    ['eisbaden', 'Eisbader', 'In Wasser unter 16 °C gebadet', 'baden', 1, n => count(e => e.type === 'baden' && x(e).water !== '' && x(e).water != null && +x(e).water < 16, n)],
    ['gipfel', 'Gipfelstürmer', 'Eine Tour mit mindestens 500 Höhenmetern', 'wanderung', 1, n => count(e => e.type === 'wanderung' && +x(e).up >= 500, n)],
    ['radler', 'Radprofi', 'Eine Radtour über 30 km', 'wanderung', 1, n => count(e => e.type === 'wanderung' && x(e).mode === 'mit dem Rad' && +x(e).km >= 30, n)],
    ['museum', 'Museumsfuchs', 'Fünf Museen besucht', 'museum', 5, n => count(e => e.type === 'museum', n)],
    ['kinder', 'Spielplatz-Profi', 'Fünf Kinder-Highlights erlebt', 'kinder', 5, n => count(e => e.type === 'kinder', n)],
    ['fuenf-sterne', 'Traumort', 'Ein Ort mit fünf Sternen', 'sight', 1, n => count(e => e.rating === 5, n)],
    ['frueh', 'Frühaufsteher', 'Ein Eintrag vor 6:30 Uhr', 'sun', 1, n => count(e => e.date.slice(11, 16) < '06:30' && e.date.slice(11, 16) >= '03:00', n)],
    ['lange-reise', 'Langstrecke', 'Eine Reise von mindestens 14 Tagen', 'clock', 14, longTrip],
    ['kennzeichen25', 'Kennzeichen-Jäger', '25 Städte-Kennzeichen gesammelt', 'car', 25, plates],
    ['kennzeichen100', 'Kennzeichen-König', '100 Städte-Kennzeichen gesammelt', 'car', 100, plates],
    ['traum', 'Traum wird wahr', 'Aus einer Reiseidee wurde eine Reise', 'badge', 1, () => {
      const i = S.ideas.find(i => i.tripId && S.trips.some(t => t.id === i.tripId));
      const t = i && S.trips.find(t => t.id === i.tripId);
      return t ? { date: t.start || new Date(t.createdAt).toISOString().slice(0, 10), place: t.name, cur: 1 } : { cur: 0 };
    }],
  ];
  const INK = ['#2E5FA8', '#B3261E', '#2F7A4A', '#7B4B94', '#A4462B', '#0F6670'];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

  const stamps = () => STAMPS.map(([id, title, text, ic, goal, fn]) => ({ id, title, text, ic, goal, ...fn(goal) }));

  VIEWS.reisepass = () => {
    const all = stamps();
    const got = all.filter(s => s.date).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const open = all.filter(s => !s.date);
    const crew = app.crewName ? app.crewName() : '';
    return `${pageHead('spiele', 'Reisepass', `${got.length} von ${all.length} Stempeln`)}
      <section class="passport">
        <header><svg class="pp-sheep" aria-hidden="true"><use href="#schaf"/></svg>
          <div><b>Reisepass</b><span>${esc(crew)}</span></div></header>
        <div class="pp-progress"><span style="width:${(got.length / all.length) * 100}%"></span></div>
        ${got.length ? `<div class="stamps">${got.map(stamp).join('')}</div>` : '<p class="hint">Noch keine Stempel. Die erste Nacht im Camper bringt den ersten!</p>'}
      </section>
      ${open.length ? `<h2 class="date-head">Noch zu holen</h2><div class="stamps open">${open.map(stamp).join('')}</div>` : '<p class="hint">Alle Stempel gesammelt. Wahnsinn!</p>'}`;
  };
  function stamp(s) {
    const h = hash(s.id);
    const style = s.date ? `--ink:${INK[Math.abs(h) % INK.length]};--rot:${(h % 9) - 4}deg` : '';
    return `<button class="stamp${s.date ? '' : ' locked'}" style="${style}" data-action="stamp-info" data-id="${s.id}">
      <span class="st-ring">${icon(s.ic)}<b>${esc(s.title)}</b>${s.date ? `<small>${fmtShort(s.date)}</small>` : `<small>${Math.min(s.cur, s.goal).toLocaleString('de-DE')} / ${s.goal.toLocaleString('de-DE')}</small>`}</span>
    </button>`;
  }
  ACTIONS['stamp-info'] = el => {
    const s = stamps().find(x => x.id === el.dataset.id);
    if (!s) return;
    openSheet(`<div class="stamp-sheet">${sheetHead(esc(s.title))}
      <div class="stamps single">${stamp(s)}</div>
      <p>${esc(s.text)}.</p>
      ${s.date ? `<p class="sub">Verdient am ${fmtShort(s.date)}${s.place ? ` – ${esc(s.place)}` : ''}.</p>`
        : `<p class="sub">Stand: ${Math.min(s.cur, s.goal).toLocaleString('de-DE')} von ${s.goal.toLocaleString('de-DE')}.</p>`}</div>`);
  };
  app.stampCount = () => stamps().filter(s => s.date).length;
}
