// Spiele & Co: Kennzeichen sammeln, Länderkennzeichen, Reise-Bingo, Stadt-Land-Fluss, Kennzeichen-Quiz,
// Länder-Sticker und das eigene Spieleportal (Spieleabend) eingebettet. Gespielt wird gegeneinander: jede Person sammelt für sich.

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
    ['brettspiele', 'Brettspiele', 'Spieleabend: online gegeneinander'],
  ];
  const game = () => ui.game || null;

  VIEWS.spiele = () => {
    const g = game();
    if (g && GAME_VIEWS[g]) {
      const [, title] = GAMES.find(x => x[0] === g);
      return `${pageHead('spiele', title)}
        <button class="link back" data-action="game-open" data-g="">Zurück zu allen Spielen</button>
        ${g === 'sticker' || g === 'brettspiele' ? '' : playerBar()}${GAME_VIEWS[g]()}`;
    }
    return `${pageHead('spiele', 'Spiele & Co', 'Für unterwegs, gegeneinander')}
      <ul class="ledger">${GAMES.map(([k, t, s]) => `<li><button data-action="game-open" data-g="${k}">
        <span class="txt"><b>${t}</b><small>${s}</small></span>${scoreHint(k)}</button></li>`).join('')}${portalGames().map(g => `<li><button data-action="game-open" data-g="brettspiele" data-pg="${esc(g.id)}">
        <span class="txt"><b>${esc(g.title || g.id)}</b><small>Bei ${esc(portal().name)} spielen</small></span></button></li>`).join('')}</ul>`;
  };
  ACTIONS['game-open'] = el => { ui.game = el.dataset.g || null; if (ui.game === 'brettspiele') ui.portalGame = el.dataset.pg || null; render(); window.scrollTo(0, 0); };

  function scoreHint(k) {
    if (k === 'kennzeichen') return `<span class="amt">${platesOf(player(), 'de').length}</span>`;
    if (k === 'laenderkz') return `<span class="amt">${platesOf(player(), 'int').length}</span>`;
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
      <ul class="plate-list">${recent.slice(0, 40).map(p => `<li><span class="plate ${set}">${esc(p.code)}</span><span class="txt">${esc(data[p.code] || '')}</span>
        <button class="icon-btn small" data-action="plate-del" data-id="${p.id}" aria-label="Entfernen">${icon('close')}</button></li>`).join('') || '<li class="none">Noch nichts gesammelt.</li>'}</ul>
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
  ACTIONS['plate-del'] = el => remove('plates', el.dataset.id);

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

  /* ---------- Brettspiele: euer Portal (Spieleabend), eingebettet ---------- */

  // Vorbelegt mit Spieleabend; Adresse und Spiele lassen sich in der App ändern.
  const PORTAL_DEFAULT = { id: 'portal', kind: 'portal', name: 'Spieleabend', url: 'https://spieleabend.lamm7.de/', list: [{ id: 'farbkreuz', title: 'Farbkreuz' }] };
  const portal = () => ({ ...PORTAL_DEFAULT, ...(S.games.find(g => g.id === 'portal') || {}) });
  const portalBase = p => p.url.replace(/(index\.php)?([?#].*)?$/, '').replace(/\/?$/, '/');
  const portalUrl = (p, gid) => gid ? `${portalBase(p)}play.php?spiel=${encodeURIComponent(gid)}` : portalBase(p);
  const portalGames = () => (portal().list || []).filter(g => g.id);

  function portalView() {
    const p = portal();
    if (!p.url) return `<p class="hint">Tragt die Adresse eures Spieleportals ein. Dann startet ihr es von hier aus.</p>
        <button class="primary" data-action="portal-form">Portal verknüpfen</button>`;
    const gid = ui.portalGame || '';
    const url = portalUrl(p, gid);
    return `<div class="chips list-chips"><button class="chip${gid ? '' : ' on'}" data-action="portal-game" data-id="">Übersicht</button>${portalGames().map(g =>
      `<button class="chip${g.id === gid ? ' on' : ''}" data-action="portal-game" data-id="${esc(g.id)}">${esc(g.title || g.id)}</button>`).join('')}</div>
      <iframe class="portal-frame" src="${esc(url)}" title="${esc(p.name)}" allow="fullscreen; clipboard-write" referrerpolicy="same-origin"></iframe>
      <p class="sub">Beim ersten Mal meldet ihr euch einmal bei ${esc(p.name)} an. Bleibt der Rahmen leer, lässt ${esc(p.name)} das Einbetten noch nicht zu – dann im eigenen Fenster öffnen.</p>
      <div class="btnrow"><a class="ghost btn" href="${esc(url)}" target="_blank" rel="noopener">Im eigenen Fenster öffnen</a>
        <button class="ghost" data-action="portal-form">Einstellungen</button></div>`;
  }
  ACTIONS['portal-game'] = el => { ui.portalGame = el.dataset.id || null; render(); };
  ACTIONS['portal-form'] = () => {
    const p = portal();
    openSheet(`<form data-form="portal">${sheetHead('Spieleportal')}
      <label class="field"><span>Name</span><input name="name" value="${esc(p.name)}"></label>
      <label class="field"><span>Adresse</span><input name="url" type="url" value="${esc(p.url)}" placeholder="https://…" required></label>
      <label class="field"><span>Spiele mit eigener Kachel (je Zeile: Kennung = Name)</span>
        <textarea name="list" rows="3" placeholder="farbkreuz = Farbkreuz">${esc(portalGames().map(g => `${g.id} = ${g.title || g.id}`).join('\n'))}</textarea></label>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.portal = form => {
    const list = form.list.value.split('\n').map(l => l.split('=')).map(([id, title]) => ({ id: (id || '').trim().toLowerCase(), title: (title || id || '').trim() }))
      .filter(g => /^[a-z0-9-]+$/.test(g.id));
    save('games', { ...portal(), name: form.name.value.trim() || 'Spieleportal', url: form.url.value.trim(), list });
    closeSheet();
  };

  const GAME_VIEWS = {
    kennzeichen: () => plateView('de'), laenderkz: () => plateView('int'),
    bingo: bingoView, slf: slfView, quiz: quizView, sticker: stickerView, brettspiele: portalView,
  };
}
