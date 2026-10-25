// Spiele & Co: Kennzeichen sammeln, Länderkennzeichen, Reise-Bingo, Stadt-Land-Fluss, Kennzeichen-Quiz,
// Länder-Sticker und das eigene Spieleportal (Spieleabend), das sich direkt in einem eigenen Fenster öffnet. Gespielt wird gegeneinander: jede Person sammelt für sich.

import { KFZ, KFZ_INT, KFZ_QUELLE } from './kfz.js';

export default function installSpiele(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, esc, icon, pageHead, newId, save, remove, toast, render, openSheet, closeSheet,
    currentTrip, members, me, personName,
  } = app;
  const sheetHead = t => `<div class="sheet-head"><h2>${t}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>`;
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  // Wer spielt gerade? Standard: die angemeldete Person, auf einem geteilten Handy umstellbar
  const player = () => { const p = LS.get('player', null); return members().some(m => m.id === p) ? p : me(); };
  const playerBar = () => `<div class="chips list-chips player-bar"><span class="sub">Es spielt:</span>${members().map(m =>
    `<button class="chip${m.id === player() ? ' on' : ''}" data-action="game-player" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>`;
  ACTIONS['game-player'] = el => { LS.set('player', el.dataset.id); render(); };

  const GAMES = [
    ['kennzeichen', 'Kennzeichen sammeln', 'Welche Städte habt ihr gesehen?'],
    ['laenderkz', 'Länderkennzeichen', 'Autos aus ganz Europa'],
    ['bingo', 'Reise-Bingo', 'Wer hat zuerst eine Reihe?'],
    ['slf', 'Stadt, Land, Fluss', 'Buchstabe, Uhr, Punkte'],
    ['quiz', 'Kennzeichen-Quiz', 'Welche Stadt steckt dahinter?'],
    ['sticker', 'Länder-Sticker', 'Alle Länder, in denen ihr wart'],
    ['brettspiele', 'Brettspiele', 'Euer Spieleportal'],
  ];
  const game = () => ui.game || null;

  // Kleine Bilder für die Spiele-Kacheln (Linien in Holzbraun wie die Bereichsgrafiken)
  const ART = {
    nochweit: '<path d="M4 38h56" stroke-dasharray="5 5"/><path d="M10 33V20q0-4 4-4h20l8 8h8q3 0 4 4v5z" fill="var(--paper)"/><circle cx="18" cy="34" r="4" fill="var(--paper)"/><circle cx="44" cy="34" r="4" fill="var(--paper)"/><path d="M14 22h18v6H14z"/><path d="M54 8v12M54 8l6 3-6 3"/>',
    reisepass: '<rect x="16" y="4" width="32" height="40" rx="4" fill="var(--paper)"/><circle cx="32" cy="20" r="8"/><path d="M24 20h16M32 12q-4 8 0 16q4-8 0-16M23 34h18M26 39h12"/><circle cx="50" cy="36" r="9" fill="var(--paper)" stroke="#B3261E" transform="rotate(-12 50 36)"/><path d="M46 36l3 3 5-6" stroke="#B3261E"/>',
    kennzeichen: '<rect x="6" y="14" width="52" height="20" rx="3" fill="#fff"/><path d="M7 15h8v18H7z" fill="#003399" stroke="none"/><text x="38" y="29" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">M·LP</text>',
    laenderkz: '<ellipse cx="32" cy="24" rx="22" ry="14" fill="#fff"/><text x="32" y="29" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">CH</text>',
    bingo: '<rect x="14" y="6" width="36" height="36" rx="3" fill="var(--paper)"/><path d="M26 6v36M38 6v36M14 18h36M14 30h36"/><path d="M29 9l6 6M35 9l-6 6M17 33l6 6M23 33l-6 6M41 21l6 6M47 21l-6 6" stroke="#B3261E"/>',
    slf: '<rect x="4" y="12" width="16" height="22" rx="3" fill="var(--paper)"/><rect x="24" y="12" width="16" height="22" rx="3" fill="var(--paper)"/><rect x="44" y="12" width="16" height="22" rx="3" fill="var(--paper)"/><g fill="currentColor" stroke="none" font-size="13" font-weight="700" text-anchor="middle" font-family="Fredoka, sans-serif"><text x="12" y="28">S</text><text x="32" y="28">L</text><text x="52" y="28">F</text></g>',
    quiz: '<rect x="4" y="18" width="38" height="16" rx="3" fill="#fff"/><path d="M5 19h6v14H5z" fill="#003399" stroke="none"/><path d="M48 14q0-6 6-6t6 6q0 4-6 6v4M54 30v1"/>',
    sticker: '<path d="M14 42V6"/><path d="M14 8h32l-6 8 6 8H14z" fill="var(--paper)"/><circle cx="44" cy="36" r="8" fill="var(--paper)"/><path d="M40 36l3 3 5-6"/>',
    brettspiele: '<rect x="8" y="14" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(-10 19 25)"/><rect x="34" y="10" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(10 45 21)"/><g fill="currentColor" stroke="none"><circle cx="15" cy="20" r="2"/><circle cx="19" cy="25" r="2"/><circle cx="23" cy="30" r="2"/><circle cx="40" cy="16" r="2"/><circle cx="50" cy="16" r="2"/><circle cx="40" cy="26" r="2"/><circle cx="50" cy="26" r="2"/></g>',
  };
  const gameArt = k => `<svg class="game-art" viewBox="0 0 64 48" aria-hidden="true">${ART[k] || ''}</svg>`;
  // Kinderkonten sehen nur freigegebene Spiele (familie.js)
  const ok = k => !app.allowed || app.allowed('spiel:' + k);
  app.GAMES = GAMES;
  app.gameArt = gameArt;

  VIEWS.spiele = () => {
    const g = game();
    if (g && GAME_VIEWS[g] && ok(g)) {
      const [, title] = GAMES.find(x => x[0] === g);
      return `${pageHead('spiele', title)}
        <button class="link back" data-action="game-open" data-g="">Zurück zu allen Spielen</button>
        ${g === 'sticker' || g === 'brettspiele' ? '' : playerBar()}${GAME_VIEWS[g]()}`;
    }
    // Brettspiele öffnet Spieleabend direkt in einem eigenen Fenster
    const p = portal();
    const tile = (k, t, s, extra = '') => `${gameArt(k)}<b>${t}</b><small>${s}</small>${extra}`;
    return `${pageHead('spiele', 'Spiele & Co', 'Für unterwegs, gegeneinander')}
      <nav class="game-tiles">
        ${ok('nochweit') ? `<a class="game-tile wide" href="#/nochweit">${tile('nochweit', 'Wie lange noch?', 'Restzeit bis zum Ziel, groß für die Rückbank')}</a>` : ''}
        ${ok('reisepass') ? `<a class="game-tile wide pass" href="#/reisepass">${tile('reisepass', 'Reisepass', 'Stempel für eure Camper-Erlebnisse', app.stampCount ? `<span class="score">${app.stampCount()}</span>` : '')}</a>` : ''}
        ${GAMES.filter(([k]) => ok(k)).map(([k, t, s]) => k === 'brettspiele' && p.url
          ? `<a class="game-tile" href="${esc(p.url)}" target="_blank" rel="noopener">${tile(k, t, `${esc(p.name)}, online`, `<span class="open-ic">${icon('open')}</span>`)}</a>`
          : `<button class="game-tile" data-action="game-open" data-g="${k}">${tile(k, t, s, scoreHint(k))}</button>`).join('')}
      </nav>
      ${app.session().user.isAdmin ? '<button class="link" data-action="portal-form">Spieleportal einstellen</button>' : ''}`;
  };
  ACTIONS['game-open'] = el => { ui.game = el.dataset.g || null; render(); window.scrollTo(0, 0); };

  function scoreHint(k) {
    if (k === 'kennzeichen') return `<span class="score">${platesOf(player(), 'de').length}</span>`;
    if (k === 'laenderkz') return `<span class="score">${platesOf(player(), 'int').length}</span>`;
    return '';
  }

  /* ---------- Kennzeichen sammeln (Deutschland und international) ---------- */

  const platesOf = (pid, set, tripId) => S.plates.filter(p => p.by === pid && p.set === set && (!tripId || p.tripId === tripId));
  const norm = s => s.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');

  function leaderboard(set) {
    const t = currentTrip();
    const rows = members().map(m => ({ m, all: platesOf(m.id, set).length, trip: t ? platesOf(m.id, set, t.id).length : 0 }))
      .sort((a, b) => b.trip - a.trip || b.all - a.all);
    return `<section class="leader"><h3 class="date-head">Wertung${t ? ` für „${esc(t.name)}“` : ''}</h3>
      <ol>${rows.map(r => `<li class="${r.m.id === player() ? 'me' : ''}"><span>${esc(r.m.name)}</span><b>${t ? r.trip : r.all}</b><small>${r.all} insgesamt</small></li>`).join('')}</ol></section>`;
  }

  function plateView(set) {
    const data = set === 'de' ? KFZ : KFZ_INT;
    const q = norm(ui.plateQuery || '');
    const mine = platesOf(player(), set);
    const seen = new Set(mine.map(p => p.code));
    const total = Object.keys(data).length;
    const hits = q ? Object.keys(data).filter(c => c.startsWith(q)).sort((a, b) => a.length - b.length || a.localeCompare(b)).slice(0, 8) : [];
    const recent = mine.slice().sort((a, b) => b.at - a.at);
    return `<div class="plate-progress"><b>${mine.length}</b> von ${total} gesammelt<div class="progress" style="--p:${mine.length / total}"><span></span></div></div>
      <label class="search plate-search">${icon('search')}<input data-keep="plateQuery" data-action-input="plate-search" value="${esc(ui.plateQuery || '')}"
        placeholder="${set === 'de' ? 'Kennzeichen eingeben, z. B. RO' : 'Länderkennzeichen, z. B. NL'}" autocapitalize="characters" autocomplete="off" spellcheck="false"></label>
      ${q ? `<ul class="plate-hits">${hits.map(c => `<li>
          <span class="plate ${set}">${esc(c)}</span><span class="txt">${esc(data[c])}</span>
          ${seen.has(c) ? '<span class="done-tag">schon gesehen</span>' : `<button class="primary small-btn" data-action="plate-add" data-set="${set}" data-code="${esc(c)}">Gesehen</button>`}
        </li>`).join('') || '<li class="none">Dieses Kennzeichen gibt es nicht.</li>'}</ul>` : ''}
      ${leaderboard(set)}
      <h3 class="date-head">Zuletzt gesehen</h3>
      ${recent.length ? `<ul class="plate-grid">${recent.slice(0, 60).map(p => `<li><button data-action="plate-del" data-id="${p.id}" aria-label="${esc(p.code)} entfernen">
        <span class="plate ${set}">${esc(p.code)}</span><small>${esc(data[p.code] || '')}</small></button></li>`).join('')}</ul>
        <p class="sub">Zum Entfernen auf ein Kennzeichen tippen.</p>` : '<p class="hint">Noch nichts gesammelt.</p>'}
      ${set === 'de' ? `<p class="sub source">${KFZ_QUELLE}</p>` : ''}`;
  }
  document.addEventListener('input', ev => {
    if (ev.target.dataset.actionInput === 'plate-search') { ui.plateQuery = ev.target.value; render(); }
  });
  ACTIONS['plate-add'] = el => {
    const { set, code } = el.dataset;
    const t = currentTrip();
    save('plates', { id: `${player()}_${set}_${code}`, by: player(), set, code, at: Date.now(), tripId: t ? t.id : null });
    ui.plateQuery = '';
    toast(`${code}: ${(set === 'de' ? KFZ : KFZ_INT)[code]} gesammelt`);
  };
  ACTIONS['plate-del'] = el => {
    const p = S.plates.find(x => x.id === el.dataset.id);
    if (!p) return;
    const name = (p.set === 'de' ? KFZ : KFZ_INT)[p.code];
    if (confirm(`${p.code}${name ? ` (${name})` : ''} aus der Sammlung entfernen?`)) remove('plates', p.id);
  };

  /* ---------- Reise-Bingo ---------- */

  const BINGO = ['Kuh', 'Pferd', 'Schaf', 'Ziege', 'Esel', 'Storch', 'Traktor', 'Windrad', 'Burg', 'Kirchturm', 'Tunnel', 'Brücke', 'Fähre',
    'See', 'Berg mit Schnee', 'Wasserfall', 'Leuchtturm', 'Segelboot', 'Zug', 'Bus', 'Hubschrauber', 'Polizeiauto', 'Feuerwehr', 'Krankenwagen',
    'Oldtimer', 'Wohnwagen', 'Wohnmobil aus NL', 'Auto mit Dachbox', 'Fahrradträger', 'Motorrad', 'Radfahrer', 'Rotes Auto', 'Gelbes Auto',
    'LKW mit Holz', 'Baustelle', 'Kreisverkehr', 'Tankstelle', 'Eiswagen', 'Hund im Auto', 'Blitzer', 'Stau', 'Mautstelle', 'Grenzschild',
    'Kennzeichen aus der Heimat', 'Schloss', 'Regenbogen', 'Picknickplatz', 'Campingplatz-Schild'];
  const bingoId = () => `bingo_${player()}_${(currentTrip() || {}).id || 'ohne'}`;
  const LINES = (() => {
    const l = [];
    for (let i = 0; i < 4; i++) { l.push([0, 1, 2, 3].map(j => i * 4 + j)); l.push([0, 1, 2, 3].map(j => j * 4 + i)); }
    l.push([0, 5, 10, 15], [3, 6, 9, 12]);
    return l;
  })();
  const bingoCount = card => LINES.filter(line => line.every(i => card.marked.includes(i))).length;

  function bingoView() {
    const card = S.games.find(g => g.id === bingoId());
    if (!card) return `<p class="hint">Jede Person bekommt eine eigene Karte mit 16 Dingen, die man unterwegs sehen kann. Wer zuerst eine Reihe, Spalte oder Diagonale voll hat, ruft „Bingo!“.</p>
      <button class="primary" data-action="bingo-new">Karte für ${esc(personName(player()))} ziehen</button>`;
    const others = members().filter(m => m.id !== player()).map(m => {
      const c = S.games.find(g => g.id === `bingo_${m.id}_${(currentTrip() || {}).id || 'ohne'}`);
      return c ? `${esc(m.name)}: ${c.marked.length} von 16${bingoCount(c) ? `, ${bingoCount(c)} × Bingo` : ''}` : '';
    }).filter(Boolean);
    return `<div class="bingo">${card.cells.map((c, i) => `<button class="${card.marked.includes(i) ? 'on' : ''}" data-action="bingo-mark" data-i="${i}">${esc(c)}</button>`).join('')}</div>
      <p class="sub">${card.marked.length} von 16${bingoCount(card) ? `, ${bingoCount(card)} × Bingo!` : ''}</p>
      ${others.length ? `<p class="sub">${others.join('<br>')}</p>` : ''}
      <div class="toolbar end"><button class="ghost" data-action="bingo-new">Neue Karte</button></div>`;
  }
  ACTIONS['bingo-new'] = () => {
    if (S.games.some(g => g.id === bingoId()) && !confirm('Neue Karte ziehen? Die Kreuze der alten Karte gehen verloren.')) return;
    save('games', { id: bingoId(), kind: 'bingo', by: player(), cells: shuffle(BINGO).slice(0, 16), marked: [] });
  };
  ACTIONS['bingo-mark'] = el => {
    const card = S.games.find(g => g.id === bingoId());
    const i = +el.dataset.i;
    const before = bingoCount(card);
    const marked = card.marked.includes(i) ? card.marked.filter(x => x !== i) : [...card.marked, i];
    const next = { ...card, marked };
    save('games', next);
    if (bingoCount(next) > before) toast('Bingo!');
  };

  /* ---------- Stadt, Land, Fluss ---------- */

  const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWZ';
  const SLF_CATS = ['Stadt', 'Land', 'Fluss', 'Tier', 'Name', 'Beruf', 'Etwas im Camper'];
  const slf = () => S.games.find(g => g.id === 'slf') || { id: 'slf', kind: 'slf', letter: '', scores: {} };
  let timer = null;
  function slfView() {
    const s = slf();
    const left = Math.max(0, Math.ceil(((s.endsAt || 0) - Date.now()) / 1000));
    if (left > 0 && !timer) timer = setInterval(() => { if (ui.route === 'spiele' && ui.game === 'slf') render(); else { clearInterval(timer); timer = null; } }, 1000);
    if (left === 0 && timer) { clearInterval(timer); timer = null; }
    const ranking = members().map(m => ({ m, p: (s.scores || {})[m.id] || 0 })).sort((a, b) => b.p - a.p);
    return `<div class="slf">
        <div class="slf-letter">${s.letter || '?'}</div>
        <p class="slf-time">${s.letter ? (left ? `noch ${left} s` : 'Stopp!') : 'Noch kein Buchstabe'}</p>
        <div class="btnrow"><button class="primary" data-action="slf-new">Neuer Buchstabe, 90 Sekunden</button></div>
        <p class="sub">${SLF_CATS.join(', ')}. Schreibt auf Papier oder ins Handy; 10 Punkte pro Antwort, 5 wenn jemand dasselbe hat.</p>
      </div>
      <section class="leader"><h3 class="date-head">Punkte</h3>
        <ol>${ranking.map(r => `<li class="${r.m.id === player() ? 'me' : ''}"><span>${esc(r.m.name)}</span><b>${r.p}</b>
          <span class="slf-add"><button class="ghost small-btn" data-action="slf-points" data-id="${r.m.id}" data-p="5">+5</button><button class="ghost small-btn" data-action="slf-points" data-id="${r.m.id}" data-p="10">+10</button></span></li>`).join('')}</ol>
        <button class="link" data-action="slf-reset">Punkte auf null</button></section>`;
  }
  ACTIONS['slf-new'] = () => save('games', { ...slf(), letter: LETTERS[Math.floor(Math.random() * LETTERS.length)], endsAt: Date.now() + 90000 });
  ACTIONS['slf-points'] = el => { const s = slf(); save('games', { ...s, scores: { ...s.scores, [el.dataset.id]: ((s.scores || {})[el.dataset.id] || 0) + +el.dataset.p } }); };
  ACTIONS['slf-reset'] = () => { if (confirm('Alle Punkte auf null setzen?')) save('games', { ...slf(), scores: {} }); };

  /* ---------- Kennzeichen-Quiz ---------- */

  let quizQ = null;
  const quizStats = pid => S.games.find(g => g.id === `quiz_${pid}`) || { id: `quiz_${pid}`, kind: 'quiz', by: pid, right: 0, total: 0, best: 0, streak: 0 };
  function newQuestion() {
    const codes = Object.keys(KFZ);
    const code = codes[Math.floor(Math.random() * codes.length)];
    const names = new Set([KFZ[code]]);
    while (names.size < 4) names.add(KFZ[codes[Math.floor(Math.random() * codes.length)]]);
    quizQ = { code, options: shuffle([...names]), answered: null };
  }
  function quizView() {
    if (!quizQ) newQuestion();
    const st = quizStats(player());
    const ranking = members().map(m => ({ m, s: quizStats(m.id) })).sort((a, b) => b.s.best - a.s.best || b.s.right - a.s.right);
    return `<div class="quiz">
        <span class="plate de big">${esc(quizQ.code)}</span>
        <div class="quiz-options">${quizQ.options.map(o => {
          const cls = quizQ.answered ? (o === KFZ[quizQ.code] ? 'right' : o === quizQ.answered ? 'wrong' : '') : '';
          return `<button class="${cls}" data-action="quiz-answer" data-o="${esc(o)}"${quizQ.answered ? ' disabled' : ''}>${esc(o)}</button>`;
        }).join('')}</div>
        ${quizQ.answered ? '<button class="primary" data-action="quiz-next">Nächstes Kennzeichen</button>' : ''}
        <p class="sub">Serie ${st.streak}, Rekord ${st.best}, ${st.right} von ${st.total} richtig</p>
      </div>
      <section class="leader"><h3 class="date-head">Rekorde</h3>
        <ol>${ranking.map(r => `<li class="${r.m.id === player() ? 'me' : ''}"><span>${esc(r.m.name)}</span><b>${r.s.best}</b><small>${r.s.right} von ${r.s.total}</small></li>`).join('')}</ol></section>
      <p class="sub source">${KFZ_QUELLE}</p>`;
  }
  ACTIONS['quiz-answer'] = el => {
    if (!quizQ || quizQ.answered) return;
    quizQ.answered = el.dataset.o;
    const right = quizQ.answered === KFZ[quizQ.code];
    const st = quizStats(player());
    const streak = right ? st.streak + 1 : 0;
    save('games', { ...st, right: st.right + (right ? 1 : 0), total: st.total + 1, streak, best: Math.max(st.best, streak) });
  };
  ACTIONS['quiz-next'] = () => { newQuestion(); render(); };

  /* ---------- Länder-Sticker ---------- */

  function stickerView() {
    const all = [...new Set(S.entries.map(e => e.country).filter(Boolean))];
    const t = currentTrip();
    const here = t ? app.tripCountries(t) : [];
    const name = cc => (app.COUNTRIES[cc] && app.COUNTRIES[cc].name) || (() => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } })();
    return all.length ? `<div class="stickers">${all.sort().map(cc => `<div class="sticker${here.includes(cc) ? ' new' : ''}"><span>${app.flag(cc)}</span><b>${esc(name(cc))}</b></div>`).join('')}</div>
      <p class="sub">${all.length} ${all.length === 1 ? 'Land' : 'Länder'}${here.length ? `, umrandet: auf „${esc(t.name)}“` : ''}. Neue Länder kommen automatisch dazu, sobald ihr dort einen Eintrag mit Position macht.</p>`
      : '<p class="hint">Sobald ihr Einträge mit Position habt, sammeln sich hier die Länder als Sticker.</p>';
  }

  /* ---------- Brettspiele: euer Portal (Spieleabend) ---------- */

  // Vorbelegt mit Spieleabend; die Adresse lässt sich in der App ändern.
  const PORTAL_DEFAULT = { id: 'portal', kind: 'portal', name: 'Spieleabend', url: 'https://spieleabend.lamm7.de/' };
  const portal = () => ({ ...PORTAL_DEFAULT, ...(S.games.find(g => g.id === 'portal') || {}) });

  function portalView() {
    return `<p class="hint">Tragt die Adresse eures Spieleportals ein. Dann startet ihr es von hier aus.</p>
      <button class="primary" data-action="portal-form">Portal verknüpfen</button>`;
  }
  ACTIONS['portal-form'] = () => {
    const p = portal();
    openSheet(`<form data-form="portal">${sheetHead('Spieleportal')}
      <label class="field"><span>Name</span><input name="name" value="${esc(p.name)}"></label>
      <label class="field"><span>Adresse</span><input name="url" type="url" value="${esc(p.url)}" placeholder="https://…" required></label>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.portal = form => {
    const old = portal(); delete old.list;
    save('games', { ...old, name: form.name.value.trim() || 'Spieleportal', url: form.url.value.trim() });
    closeSheet();
  };

  const GAME_VIEWS = {
    kennzeichen: () => plateView('de'), laenderkz: () => plateView('int'),
    bingo: bingoView, slf: slfView, quiz: quizView, sticker: stickerView, brettspiele: portalView,
  };
}
