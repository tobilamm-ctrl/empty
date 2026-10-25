// Spiele für die Fahrt: Autofarben-Wette, Schilder-Alphabet, Wer bin ich?, Tabu (mit Bildern), Flaggen-Quiz,
// Reise-Memory (mit euren Fotos) und Sudoku (4×4 oder 9×9, mit Zahlen oder Tieren). Alles geht ohne Internet.

export default function installFahrspiele(app) {
  const { S, LS, ACTIONS, CHANGES, esc, save, toast, render, currentTrip, tripEntries, members, me, personName } = app;
  const player = () => (app.player ? app.player() : me());
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  // Laufende Uhren: nur die Anzeige aktualisieren, nicht die ganze Seite
  const tick = () => {
    document.querySelectorAll('[data-until]').forEach(el => {
      const left = Math.max(0, (+el.dataset.until - Date.now()) / 1000);
      el.textContent = mmss(left);
      if (left <= 0 && !el.dataset.fired) { el.dataset.fired = '1'; const f = el.dataset.onend; if (f && ACTIONS[f]) ACTIONS[f](el); }
    });
    document.querySelectorAll('[data-since]').forEach(el => { el.textContent = mmss((Date.now() - +el.dataset.since) / 1000); });
  };
  setInterval(tick, 500);

  const NEW = [
    ['farben', 'Autofarben-Wette', 'Wer sieht die meisten Autos seiner Farbe?'],
    ['abc', 'Schilder-Alphabet', 'Von A bis Z auf Schildern finden'],
    ['werbinich', 'Wer bin ich?', 'Handy an die Stirn und raten'],
    ['tabu', 'Tabu', 'Erklären, ohne das Wort zu sagen'],
    ['flaggen', 'Flaggen-Quiz', 'Welches Land gehört dazu?'],
    ['memory', 'Reise-Memory', 'Mit euren eigenen Fotos'],
    ['sudoku', 'Sudoku', '4×4 oder 9×9, mit Zahlen oder Tieren'],
    ['maler', 'Montagsmaler', 'Einer malt, alle raten'],
    ['ttt', 'Tic-Tac-Toe', 'Zu zweit oder gegen das Handy'],
    ['story', 'Geschichten-Würfel', 'Bilder würfeln, Geschichte erfinden'],
  ];
  const at = app.GAMES.findIndex(g => g[0] === 'brettspiele');
  app.GAMES.splice(at < 0 ? app.GAMES.length : at, 0, ...NEW);
  app.noPlayerBar = [...(app.noPlayerBar || []), 'farben', 'abc', 'werbinich', 'tabu', 'memory', 'maler', 'ttt', 'story'];
  Object.assign(app.GAME_ART, {
    farben: '<path d="M8 32v-8q0-4 4-5l6-7h22l8 7q6 1 6 5v8z" fill="#E4572E" stroke="currentColor"/><circle cx="18" cy="33" r="5" fill="var(--paper)"/><circle cx="46" cy="33" r="5" fill="var(--paper)"/><circle cx="56" cy="10" r="4" fill="#2E7FB8" stroke="none"/><circle cx="46" cy="8" r="4" fill="#E0A21B" stroke="none"/>',
    abc: '<rect x="8" y="8" width="48" height="30" rx="4" fill="#F2C94C"/><text x="32" y="30" font-size="18" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">A B C</text><path d="M32 38v8"/>',
    werbinich: '<circle cx="32" cy="28" r="14" fill="var(--paper)"/><rect x="20" y="4" width="24" height="14" rx="3" fill="#fff"/><text x="32" y="15" font-size="10" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">?</text><circle cx="27" cy="28" r="1.5" fill="currentColor"/><circle cx="37" cy="28" r="1.5" fill="currentColor"/><path d="M27 35q5 3 10 0"/>',
    tabu: '<rect x="12" y="6" width="40" height="36" rx="4" fill="var(--paper)"/><circle cx="32" cy="20" r="7"/><path d="M20 32h24M24 37h16" stroke="#B3261E"/>',
    flaggen: '<path d="M12 44V6"/><path d="M12 8h14v26H12z" fill="#2E5FA8" stroke="none"/><path d="M26 8h14v26H26z" fill="#fff" stroke="none"/><path d="M40 8h14v26H40z" fill="#B3261E" stroke="none"/><path d="M12 8h42v26H12z"/>',
    memory: '<rect x="6" y="10" width="16" height="22" rx="3" fill="#2E7FB8"/><rect x="24" y="10" width="16" height="22" rx="3" fill="var(--paper)"/><rect x="42" y="10" width="16" height="22" rx="3" fill="var(--paper)"/><circle cx="32" cy="21" r="4"/><circle cx="50" cy="21" r="4"/>',
    maler: '<rect x="8" y="6" width="38" height="32" rx="3" fill="#fff"/><path d="M14 30q6-14 12-4t12-10" stroke="#2E7FB8"/><path d="M44 42l12-22 4 2-12 22-5 2z" fill="#E0A21B"/>',
    ttt: '<path d="M26 6v36M40 6v36M12 20h42M12 32h42"/><path d="M15 9l7 7M22 9l-7 7" stroke="#B3261E"/><circle cx="33" cy="26" r="4" stroke="#2E5FA8"/><path d="M43 35l7 7M50 35l-7 7" stroke="#B3261E"/>',
    story: '<rect x="6" y="14" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(-8 17 25)"/><rect x="34" y="10" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(8 45 21)"/><text x="17" y="30" font-size="12" text-anchor="middle" stroke="none">🏰</text><text x="45" y="26" font-size="12" text-anchor="middle" stroke="none">🐉</text>',
    sudoku: '<rect x="12" y="6" width="36" height="36" rx="2" fill="var(--paper)"/><path d="M24 6v36M36 6v36M12 18h36M12 30h36"/><g fill="currentColor" stroke="none" font-size="9" font-weight="700" font-family="Arial" text-anchor="middle"><text x="18" y="15">1</text><text x="42" y="27">3</text><text x="30" y="39">2</text></g>',
  });

  /* ====================================================================== */
  /* Autofarben-Wette                                                        */
  /* ====================================================================== */

  const COLORS = [['rot', '#D0342C'], ['blau', '#2E5FA8'], ['schwarz', '#222'], ['weiß', '#F4F4F4'], ['silber', '#A9AEB3'], ['grün', '#2F7A4A'], ['gelb', '#F2C94C'], ['orange', '#E8782A']];
  const fb = () => LS.get('farben', { pick: {}, counts: {}, until: 0, dur: 10 });
  const setFb = v => { LS.set('farben', v); render(); };
  function farbenView() {
    const g = fb();
    const who = members().filter(m => g.pick[m.id]);
    const live = g.until > Date.now();
    if (!live && !g.until) {
      return `<p>Jeder sucht sich eine Autofarbe aus. Wer in der Zeit die meisten Autos seiner Farbe entdeckt, gewinnt.</p>
        ${members().map(m => `<div class="fb-pick"><b>${esc(m.name)}</b><div class="fb-colors">${COLORS.map(([n, c]) => {
          const taken = Object.entries(g.pick).find(([k, v]) => v === n && k !== m.id);
          return `<button class="fb-dot${g.pick[m.id] === n ? ' on' : ''}" style="--c:${c}" data-action="fb-pick" data-pid="${m.id}" data-c="${n}"${taken ? ' disabled' : ''} aria-label="${n}"></button>`;
        }).join('')}</div></div>`).join('')}
        <div class="chips wrap">${[5, 10, 15, 30].map(n => `<button class="chip${g.dur === n ? ' on' : ''}" data-action="fb-dur" data-n="${n}">${n} Min.</button>`).join('')}</div>
        <button class="primary" data-action="fb-start"${who.length ? '' : ' disabled'}>Los geht’s!</button>`;
    }
    const color = n => (COLORS.find(c => c[0] === n) || [])[1];
    const ranking = who.slice().sort((a, b) => (g.counts[b.id] || 0) - (g.counts[a.id] || 0));
    return `${live ? `<p class="fb-clock">Noch <b data-until="${g.until}" data-onend="fb-end">${mmss((g.until - Date.now()) / 1000)}</b></p>` : `<p class="win">🏆 ${esc(ranking[0].name)} gewinnt mit ${g.counts[ranking[0].id] || 0} Autos!</p>`}
      <div class="fb-board">${who.map(m => `<div class="fb-player" style="--c:${color(g.pick[m.id])}">
        <button class="fb-plus" data-action="fb-count" data-pid="${m.id}" data-d="1"${live ? '' : ' disabled'}><span>${esc(m.name)}</span><b>${g.counts[m.id] || 0}</b><small>${g.pick[m.id]}</small></button>
        ${live ? `<button class="link" data-action="fb-count" data-pid="${m.id}" data-d="-1">−1</button>` : ''}</div>`).join('')}</div>
      <div class="btnrow"><button class="ghost" data-action="fb-reset">${live ? 'Abbrechen' : 'Neue Runde'}</button></div>`;
  }
  ACTIONS['fb-pick'] = el => { const g = fb(); g.pick[el.dataset.pid] = g.pick[el.dataset.pid] === el.dataset.c ? undefined : el.dataset.c; setFb(g); };
  ACTIONS['fb-dur'] = el => setFb({ ...fb(), dur: +el.dataset.n });
  ACTIONS['fb-start'] = () => setFb({ ...fb(), counts: {}, until: Date.now() + fb().dur * 60000 });
  ACTIONS['fb-count'] = el => { const g = fb(); g.counts[el.dataset.pid] = Math.max(0, (g.counts[el.dataset.pid] || 0) + +el.dataset.d); setFb(g); };
  ACTIONS['fb-end'] = () => { if (navigator.vibrate) navigator.vibrate([100, 60, 100]); render(); };
  ACTIONS['fb-reset'] = () => setFb({ ...fb(), counts: {}, until: 0 });

  /* ====================================================================== */
  /* Schilder-Alphabet                                                       */
  /* ====================================================================== */

  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const HARD = ['Q', 'X', 'Y', 'C', 'J'];
  const abc = () => LS.get('abc', { i: -1, start: 0, easy: true, skipped: [] });
  function abcView() {
    const g = abc();
    const letters = g.easy ? ABC.filter(l => !['Q', 'X', 'Y'].includes(l)) : ABC;
    const best = LS.get('abc.best' + (g.easy ? '' : '.all'), 0);
    if (g.i < 0) {
      return `<p>Sucht die Buchstaben von A bis Z der Reihe nach auf Schildern, Lastwagen oder Plakaten. Wer einen sieht, ruft ihn laut – dann geht es weiter.</p>
        <label class="check"><input type="checkbox" data-action="abc-easy"${g.easy ? ' checked' : ''}><span>Ohne Q, X und Y (für Kleine)</span></label>
        ${best ? `<p class="sub">Rekord: ${mmss(best / 1000)}</p>` : ''}
        <button class="primary" data-action="abc-go">Start bei A</button>`;
    }
    if (g.i >= letters.length) {
      const time = g.end - g.start;
      return `<p class="win">Geschafft! Alle ${letters.length} Buchstaben in ${mmss(time / 1000)}.</p>${best === time ? '<p class="win">Neuer Rekord! 🏆</p>' : ''}
        <button class="primary" data-action="abc-reset">Noch einmal</button>`;
    }
    const l = letters[g.i];
    return `<div class="abc-big">${l}</div>
      <p class="abc-next">${letters.slice(g.i + 1, g.i + 6).join(' ')} …</p>
      <div class="plate-progress"><b>${g.i}</b> von ${letters.length} · Zeit <b data-since="${g.start}">${mmss((Date.now() - g.start) / 1000)}</b><div class="progress" style="--p:${g.i / letters.length}"><span></span></div></div>
      <div class="btnrow"><button class="primary big-btn" data-action="abc-found">Gefunden!</button>
        ${HARD.includes(l) ? '<button class="ghost" data-action="abc-skip">Überspringen</button>' : ''}<button class="link" data-action="abc-reset">Neu</button></div>`;
  }
  CHANGES['abc-easy'] = el => LS.set('abc', { ...abc(), easy: el.checked });
  ACTIONS['abc-go'] = () => { LS.set('abc', { ...abc(), i: 0, start: Date.now(), skipped: [] }); render(); };
  ACTIONS['abc-reset'] = () => { LS.set('abc', { ...abc(), i: -1 }); render(); };
  const abcStep = skip => {
    const g = abc();
    const letters = g.easy ? ABC.filter(l => !['Q', 'X', 'Y'].includes(l)) : ABC;
    const n = { ...g, i: g.i + 1, skipped: skip ? [...g.skipped, letters[g.i]] : g.skipped };
    if (n.i >= letters.length) {
      n.end = Date.now();
      const key = 'abc.best' + (g.easy ? '' : '.all'), best = LS.get(key, 0);
      if (!best || n.end - n.start < best) LS.set(key, n.end - n.start);
    }
    LS.set('abc', n); render();
  };
  ACTIONS['abc-found'] = () => abcStep(false);
  ACTIONS['abc-skip'] = () => abcStep(true);

  /* ====================================================================== */
  /* Wer bin ich?                                                            */
  /* ====================================================================== */

  const WHO = {
    Tiere: [['Elefant', '🐘'], ['Giraffe', '🦒'], ['Pinguin', '🐧'], ['Krokodil', '🐊'], ['Eichhörnchen', '🐿️'], ['Schnecke', '🐌'], ['Känguru', '🦘'], ['Eule', '🦉'],
      ['Hai', '🦈'], ['Schmetterling', '🦋'], ['Schaf', '🐑'], ['Löwe', '🦁'], ['Igel', '🦔'], ['Papagei', '🦜'], ['Biene', '🐝'], ['Delfin', '🐬'], ['Zebra', '🦓'], ['Frosch', '🐸']],
    Berufe: [['Feuerwehrfrau', '🧑‍🚒'], ['Polizist', '👮'], ['Ärztin', '🧑‍⚕️'], ['Koch', '🧑‍🍳'], ['Bäuerin', '🧑‍🌾'], ['Pilot', '🧑‍✈️'], ['Astronautin', '🧑‍🚀'], ['Lehrer', '🧑‍🏫'],
      ['Maler', '🧑‍🎨'], ['Tierärztin', '🐾'], ['Busfahrer', '🚌'], ['Bauarbeiterin', '👷']],
    Figuren: [['Rotkäppchen', '👧'], ['Pippi Langstrumpf', '🧒'], ['Der Weihnachtsmann', '🎅'], ['Eine Hexe', '🧙'], ['Ein Pirat', '🏴‍☠️'], ['Ein Ritter', '🛡️'],
      ['Eine Meerjungfrau', '🧜'], ['Ein Zauberer', '🪄'], ['Ein Drache', '🐉'], ['Ein Roboter', '🤖'], ['Der Osterhase', '🐰'], ['Ein Gespenst', '👻'], ['Eine Prinzessin', '👸'], ['Ein Dinosaurier', '🦖']],
    Dinge: [['Fahrrad', '🚲'], ['Regenschirm', '☂️'], ['Zahnbürste', '🪥'], ['Kühlschrank', '🧊'], ['Wohnmobil', '🚐'], ['Leuchtturm', '🗼'], ['Eis', '🍦'], ['Pizza', '🍕'],
      ['Ball', '⚽'], ['Taschenlampe', '🔦'], ['Zelt', '⛺'], ['Banane', '🍌'], ['Gitarre', '🎸'], ['Rakete', '🚀'], ['Brille', '👓'], ['Schneemann', '⛄']],
  };
  const wb = () => LS.get('wb', { cat: 'Alle', card: null, ok: 0, pass: 0, until: 0, seen: [] });
  function werbinichView() {
    const g = wb();
    const live = g.until > Date.now();
    const cats = ['Alle', ...Object.keys(WHO)];
    if (!live) {
      return `<p>Eine Person hält das Handy an die Stirn, ohne draufzuschauen. Sie stellt Ja-Nein-Fragen („Bin ich ein Tier?“), die anderen antworten. Erraten? Die anderen tippen auf „Erraten“.</p>
        <div class="chips wrap">${cats.map(c => `<button class="chip${g.cat === c ? ' on' : ''}" data-action="wb-cat" data-c="${c}">${c}</button>`).join('')}</div>
        ${g.until ? `<p class="win">Letzte Runde: ${g.ok} erraten${g.pass ? `, ${g.pass} gepasst` : ''}</p>` : ''}
        <button class="primary" data-action="wb-start">Runde starten (2 Minuten)</button>`;
    }
    return `<p class="fb-clock">Noch <b data-until="${g.until}" data-onend="wb-end">${mmss((g.until - Date.now()) / 1000)}</b> · ${g.ok} erraten</p>
      <div class="big-card"><span class="bc-pic">${g.card[1]}</span><b>${esc(g.card[0])}</b></div>
      <div class="btnrow big-row"><button class="ghost big-btn" data-action="wb-next" data-r="pass">Passen</button><button class="primary big-btn" data-action="wb-next" data-r="ok">Erraten!</button></div>`;
  }
  const wbDraw = g => {
    const pool = (g.cat === 'Alle' ? Object.values(WHO).flat() : WHO[g.cat]).filter(c => !g.seen.includes(c[0]));
    const card = pick(pool.length ? pool : Object.values(WHO).flat());
    return { ...g, card, seen: pool.length ? [...g.seen, card[0]] : [card[0]] };
  };
  ACTIONS['wb-cat'] = el => { LS.set('wb', { ...wb(), cat: el.dataset.c }); render(); };
  ACTIONS['wb-start'] = () => { LS.set('wb', wbDraw({ ...wb(), ok: 0, pass: 0, until: Date.now() + 120000, seen: [] })); render(); };
  ACTIONS['wb-next'] = el => { const g = wb(); g[el.dataset.r]++; if (el.dataset.r === 'ok' && navigator.vibrate) navigator.vibrate(60); LS.set('wb', wbDraw(g)); render(); };
  ACTIONS['wb-end'] = () => render();

  /* ====================================================================== */
  /* Tabu (mit Bildern)                                                      */
  /* ====================================================================== */

  const TABU = [
    ['Sonne', '☀️', ['gelb', 'warm', 'Himmel']], ['Regenbogen', '🌈', ['Farben', 'Regen', 'bunt']], ['Pizza', '🍕', ['Italien', 'Käse', 'rund']], ['Eis', '🍦', ['kalt', 'Waffel', 'lecken']],
    ['Zahnbürste', '🪥', ['Zähne', 'putzen', 'Zahnpasta']], ['Fahrrad', '🚲', ['Pedale', 'fahren', 'Räder']], ['Hund', '🐕', ['bellen', 'Gassi', 'Haustier']], ['Katze', '🐈', ['miau', 'Maus', 'Haustier']],
    ['Elefant', '🐘', ['Rüssel', 'groß', 'grau']], ['Schaf', '🐑', ['Wolle', 'mäh', 'weiß']], ['Kuh', '🐄', ['Milch', 'muh', 'Weide']], ['Fisch', '🐟', ['Wasser', 'schwimmen', 'Flossen']],
    ['Schmetterling', '🦋', ['Flügel', 'Raupe', 'bunt']], ['Biene', '🐝', ['Honig', 'summen', 'stechen']], ['Zelt', '⛺', ['Camping', 'schlafen', 'Stangen']], ['Wohnmobil', '🚐', ['Camper', 'fahren', 'schlafen']],
    ['Strand', '🏖️', ['Sand', 'Meer', 'Handtuch']], ['Berg', '⛰️', ['hoch', 'Gipfel', 'wandern']], ['Schneemann', '⛄', ['Winter', 'Karotte', 'Schnee']], ['Burg', '🏰', ['Ritter', 'Turm', 'alt']],
    ['Rakete', '🚀', ['Weltall', 'fliegen', 'Mond']], ['Mond', '🌙', ['Nacht', 'Sterne', 'Himmel']], ['Geburtstag', '🎂', ['Kuchen', 'Kerzen', 'Geschenke']], ['Banane', '🍌', ['gelb', 'Affe', 'Obst']],
    ['Apfel', '🍎', ['Obst', 'rot', 'Baum']], ['Erdbeere', '🍓', ['rot', 'Sommer', 'Obst']], ['Pommes', '🍟', ['Ketchup', 'Kartoffel', 'frittiert']], ['Brille', '👓', ['Augen', 'sehen', 'Gläser']],
    ['Regenschirm', '☂️', ['Regen', 'nass', 'aufspannen']], ['Ball', '⚽', ['Fußball', 'rund', 'kicken']], ['Schaukel', '🛝', ['Spielplatz', 'hin', 'her']], ['Zug', '🚆', ['Gleise', 'Bahnhof', 'Lokomotive']],
    ['Flugzeug', '✈️', ['fliegen', 'Pilot', 'Flughafen']], ['Schiff', '🚢', ['Meer', 'Kapitän', 'Hafen']], ['Feuerwehr', '🚒', ['Feuer', 'löschen', 'Sirene']], ['Polizei', '🚓', ['Blaulicht', 'Verbrecher', 'Auto']],
    ['Dinosaurier', '🦖', ['groß', 'ausgestorben', 'Urzeit']], ['Pirat', '🏴‍☠️', ['Schatz', 'Schiff', 'Augenklappe']], ['Hexe', '🧙', ['Besen', 'zaubern', 'Hut']], ['Gespenst', '👻', ['Buh', 'weiß', 'Nacht']],
    ['Kuchen', '🍰', ['backen', 'süß', 'Geburtstag']], ['Bett', '🛏️', ['schlafen', 'Kissen', 'Decke']], ['Uhr', '⏰', ['Zeit', 'Zeiger', 'tick']], ['Telefon', '📱', ['anrufen', 'Handy', 'sprechen']],
    ['Gitarre', '🎸', ['Musik', 'Saiten', 'spielen']], ['Trommel', '🥁', ['laut', 'schlagen', 'Musik']], ['Krone', '👑', ['König', 'gold', 'Kopf']], ['Blume', '🌻', ['Garten', 'riechen', 'Blüte']],
    ['Baum', '🌳', ['Blätter', 'Wald', 'Ast']], ['Kaktus', '🌵', ['Stacheln', 'Wüste', 'grün']], ['Vulkan', '🌋', ['Lava', 'Berg', 'heiß']], ['Leuchtturm', '🗼', ['Licht', 'Meer', 'Turm']],
    ['Brücke', '🌉', ['Fluss', 'drüber', 'Ufer']], ['Tunnel', '🚇', ['dunkel', 'Berg', 'durch']], ['Zahnarzt', '🦷', ['Zähne', 'Bohrer', 'Praxis']], ['Seife', '🧼', ['waschen', 'Hände', 'Schaum']],
    ['Kissen', '🛌', ['Kopf', 'weich', 'Bett']], ['Socke', '🧦', ['Fuß', 'Wäsche', 'Paar']], ['Hut', '🎩', ['Kopf', 'tragen', 'Sonne']], ['Schatz', '💎', ['Gold', 'Truhe', 'suchen']],
  ];
  const tb = () => LS.get('tabu', { mode: 'bild', card: null, ok: 0, bad: 0, skip: 0, until: 0, seen: [] });
  function tabuView() {
    const g = tb();
    const live = g.until > Date.now();
    if (!live) {
      return `<p>Eine Person erklärt das Wort, ohne es zu sagen – die anderen raten. Mit Bild ist es leichter für Kleine, mit verbotenen Wörtern wird es knifflig.</p>
        <div class="seg"><button class="${g.mode === 'bild' ? 'on' : ''}" data-action="tb-mode" data-m="bild">Mit Bild</button><button class="${g.mode === 'profi' ? 'on' : ''}" data-action="tb-mode" data-m="profi">Mit verbotenen Wörtern</button></div>
        ${g.until ? `<p class="win">Letzte Runde: ${g.ok - g.bad} Punkte (${g.ok} richtig${g.bad ? `, ${g.bad} Tabu` : ''})</p>` : ''}
        <button class="primary" data-action="tb-start">Runde starten (1 Minute)</button>`;
    }
    const [word, pic, banned] = g.card;
    return `<p class="fb-clock">Noch <b data-until="${g.until}" data-onend="tb-end">${mmss((g.until - Date.now()) / 1000)}</b> · ${g.ok - g.bad} Punkte</p>
      <div class="big-card"><span class="bc-pic">${pic}</span><b>${esc(word)}</b>
        ${g.mode === 'profi' ? `<ul class="tb-banned">${banned.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>
      <div class="btnrow big-row">${g.mode === 'profi' ? '<button class="ghost big-btn danger" data-action="tb-next" data-r="bad">Tabu!</button>' : ''}
        <button class="ghost big-btn" data-action="tb-next" data-r="skip">Weiter</button><button class="primary big-btn" data-action="tb-next" data-r="ok">Richtig!</button></div>`;
  }
  const tbDraw = g => { const pool = TABU.filter(c => !g.seen.includes(c[0])); const card = pick(pool.length ? pool : TABU); return { ...g, card, seen: pool.length ? [...g.seen, card[0]] : [card[0]] }; };
  ACTIONS['tb-mode'] = el => { LS.set('tabu', { ...tb(), mode: el.dataset.m }); render(); };
  ACTIONS['tb-start'] = () => { LS.set('tabu', tbDraw({ ...tb(), ok: 0, bad: 0, skip: 0, until: Date.now() + 60000, seen: tb().seen.length > 50 ? [] : tb().seen })); render(); };
  ACTIONS['tb-next'] = el => { const g = tb(); g[el.dataset.r]++; LS.set('tabu', tbDraw(g)); render(); };
  ACTIONS['tb-end'] = () => { if (navigator.vibrate) navigator.vibrate([150, 80, 150]); render(); };

  /* ====================================================================== */
  /* Flaggen-Quiz                                                            */
  /* ====================================================================== */

  const EUROPE = 'DE AT CH IT FR ES PT NL BE LU DK SE NO FI IS IE GB PL CZ SK HU SI HR BA RS ME AL MK GR BG RO MD UA BY LT LV EE TR CY MT LI MC SM AD VA XK'.split(' ');
  const WORLD = 'US CA MX BR AR CL PE CO VE CU JM CN JP KR IN PK TH VN ID PH MY SG AU NZ ZA EG MA TN KE NG GH ET TZ SA AE IL IR IQ NP LK MN KZ RU'.split(' ');
  const flag = cc => String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  const cname = cc => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } };
  const flagDoc = () => S.games.find(g => g.id === `flaggen_${player()}`) || { id: `flaggen_${player()}`, kind: 'flaggen', by: player(), best: {} };
  let fq = null;
  function newFlag(level) {
    const pool = level === 'welt' ? [...EUROPE, ...WORLD] : EUROPE;
    // Länder der aktuellen Reise kommen öfter dran
    const t = currentTrip();
    const trip = t && app.tripCountries ? app.tripCountries(t).filter(c => pool.includes(c)) : [];
    const cc = trip.length && Math.random() < 0.3 ? pick(trip) : pick(pool.filter(c => !fq || c !== fq.cc));
    const wrong = shuffle(pool.filter(c => c !== cc)).slice(0, 3);
    return { level, cc, opts: shuffle([cc, ...wrong]), streak: fq ? fq.streak : 0, answer: null };
  }
  app.gameScores.flaggen = () => { const b = flagDoc().best || {}; return Math.max(b.europa || 0, b.welt || 0); };
  function flaggenView() {
    const level = LS.get('flaggen.level', 'europa');
    if (!fq || fq.level !== level || fq.by !== player()) fq = { ...newFlag(level), by: player(), streak: 0 };
    const best = (flagDoc().best || {})[level] || 0;
    return `<div class="seg"><button class="${level === 'europa' ? 'on' : ''}" data-action="fq-level" data-l="europa">Europa</button><button class="${level === 'welt' ? 'on' : ''}" data-action="fq-level" data-l="welt">Welt</button></div>
      <p class="plate-progress">In Folge richtig: <b>${fq.streak}</b> · Rekord ${esc(personName(player()))}: <b>${best}</b></p>
      <div class="fq-flag">${flag(fq.cc)}</div>
      <div class="fq-opts">${fq.opts.map(c => `<button class="fq-opt${fq.answer ? (c === fq.cc ? ' right' : c === fq.answer ? ' wrong' : '') : ''}" data-action="fq-answer" data-c="${c}"${fq.answer ? ' disabled' : ''}>${esc(cname(c))}</button>`).join('')}</div>
      ${fq.answer ? `<p class="${fq.answer === fq.cc ? 'win' : 'sub'}">${fq.answer === fq.cc ? 'Richtig!' : `Das ist ${esc(cname(fq.cc))}.`}</p><button class="primary" data-action="fq-next">Nächste Flagge</button>` : ''}`;
  }
  ACTIONS['fq-level'] = el => { LS.set('flaggen.level', el.dataset.l); fq = null; render(); };
  ACTIONS['fq-answer'] = el => {
    if (!fq || fq.answer) return;
    fq.answer = el.dataset.c;
    if (fq.answer === fq.cc) {
      fq.streak++;
      const d = flagDoc();
      if (fq.streak > ((d.best || {})[fq.level] || 0)) { save('games', { ...d, best: { ...(d.best || {}), [fq.level]: fq.streak }, updatedAt: Date.now() }); return; }
    } else fq.streak = 0;
    render();
  };
  ACTIONS['fq-next'] = () => { fq = { ...newFlag(fq.level), by: player(), streak: fq.streak }; render(); };

  /* ====================================================================== */
  /* Reise-Memory                                                            */
  /* ====================================================================== */

  const FALLBACK = ['🐑', '🚐', '⛺', '🏖️', '⛰️', '🍦', '🐟', '🌻', '🚲', '🦋', '🌈', '🏰'];
  let mem = null;
  function newMemory(pairs) {
    const t = currentTrip();
    const photos = t ? tripEntries(t).flatMap(e => (e.photos || []).map(p => ({ k: p.id, img: p.thumb }))) : [];
    const own = shuffle(photos).slice(0, pairs);
    const faces = [...own, ...FALLBACK.slice(0, pairs - own.length).map(e => ({ k: e, emo: e }))];
    const cards = shuffle([...faces, ...faces].map((f, i) => ({ ...f, i })));
    const who = LS.get('memory.together', false) ? members().map(m => m.id) : [player()];
    return { pairs, cards, open: [], found: {}, moves: 0, turn: 0, who, score: {}, photos: own.length };
  }
  function memoryView() {
    const pairs = LS.get('memory.pairs', 6);
    if (!mem || mem.pairs !== pairs) mem = newMemory(pairs);
    const done = Object.keys(mem.found).length === mem.pairs;
    const together = mem.who.length > 1;
    const cur = mem.who[mem.turn % mem.who.length];
    const best = together ? null : LS.get(`memory.best.${pairs}`, 0);
    return `<div class="chips wrap">${[[6, '12 Karten'], [8, '16 Karten'], [10, '20 Karten']].map(([n, l]) => `<button class="chip${pairs === n ? ' on' : ''}" data-action="mem-size" data-n="${n}">${l}</button>`).join('')}
        <button class="chip${together ? ' on' : ''}" data-action="mem-together">Zusammen spielen</button></div>
      <p class="plate-progress">${together ? mem.who.map(id => `<span class="${id === cur && !done ? 'mem-turn' : ''}">${esc(personName(id))} ${mem.score[id] || 0}</span>`).join(' · ') : `Züge: <b>${mem.moves}</b>${best ? ` · Rekord ${best}` : ''}`}</p>
      ${mem.photos < mem.pairs ? `<p class="sub">${mem.photos ? `${mem.photos} Fotos von dieser Reise, der Rest sind Bilder.` : 'Mit Fotos im Tagebuch spielt ihr mit euren eigenen Bildern.'}</p>` : ''}
      <div class="mem-grid n${mem.pairs * 2}">${mem.cards.map((c, i) => {
        const up = mem.open.includes(i) || mem.found[c.k];
        return `<button class="mem-card${up ? ' up' : ''}${mem.found[c.k] ? ' found' : ''}" data-action="mem-flip" data-i="${i}" aria-label="Karte ${i + 1}">
          ${up ? (c.img ? `<img src="${c.img}" alt="">` : `<span>${c.emo}</span>`) : '<span class="mem-back">🐑</span>'}</button>`;
      }).join('')}</div>
      ${done ? `<p class="win">${together ? `🏆 ${esc(personName(Object.entries(mem.score).sort((a, b) => b[1] - a[1])[0][0]))} gewinnt!` : `Geschafft in ${mem.moves} Zügen!`}</p>` : ''}
      <button class="ghost" data-action="mem-new">Neu mischen</button>`;
  }
  let memLock = false;
  ACTIONS['mem-flip'] = el => {
    const i = +el.dataset.i;
    if (memLock || mem.open.includes(i) || mem.found[mem.cards[i].k]) return;
    mem.open.push(i);
    if (mem.open.length === 2) {
      mem.moves++;
      const [a, b] = mem.open.map(x => mem.cards[x]);
      const cur = mem.who[mem.turn % mem.who.length];
      if (a.k === b.k) {
        mem.found[a.k] = true; mem.open = []; mem.score[cur] = (mem.score[cur] || 0) + 1;
        if (Object.keys(mem.found).length === mem.pairs && mem.who.length === 1) {
          const key = `memory.best.${mem.pairs}`, best = LS.get(key, 0);
          if (!best || mem.moves < best) LS.set(key, mem.moves);
        }
      } else {
        memLock = true;
        setTimeout(() => { mem.open = []; mem.turn++; memLock = false; render(); }, 1100);
      }
    }
    render();
  };
  ACTIONS['mem-size'] = el => { LS.set('memory.pairs', +el.dataset.n); mem = null; render(); };
  ACTIONS['mem-together'] = () => { LS.set('memory.together', !LS.get('memory.together', false)); mem = null; render(); };
  ACTIONS['mem-new'] = () => { mem = null; render(); };

  /* ====================================================================== */
  /* Sudoku                                                                  */
  /* ====================================================================== */

  const SYM = { 4: ['🐑', '🐄', '🐐', '🐎'], 9: ['🐑', '🐄', '🐐', '🐎', '🐖', '🐔', '🦆', '🐟', '🐸'] };
  const LEVELS = { 4: { leicht: 8, mittel: 6, schwer: 4 }, 9: { leicht: 40, mittel: 32, schwer: 26 } };
  const box = n => (n === 4 ? [2, 2] : [3, 3]);
  // Lösen mit Rücksetzen; zählt Lösungen bis „limit“ (für die Eindeutigkeit)
  function solve(g, n, limit, rand) {
    const [bh, bw] = box(n);
    let count = 0, sol = null;
    const ok = (i, v) => {
      const r = Math.floor(i / n), c = i % n, br = r - (r % bh), bc = c - (c % bw);
      for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (g[(br + y) * n + bc + x] === v) return false;
      return true;
    };
    const go = () => {
      let best = -1, bestOpts = null;
      for (let i = 0; i < n * n; i++) if (!g[i]) {
        const opts = []; for (let v = 1; v <= n; v++) if (ok(i, v)) opts.push(v);
        if (!opts.length) return false;
        if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
      }
      if (best < 0) { count++; sol = sol || g.slice(); return count >= limit; }
      for (const v of rand ? shuffle(bestOpts) : bestOpts) { g[best] = v; if (go()) { g[best] = 0; return true; } g[best] = 0; }
      return false;
    };
    go();
    return { count, sol };
  }
  function makeSudoku(n, level) {
    const full = solve(Array(n * n).fill(0), n, 1, true).sol;
    const g = full.slice();
    const target = LEVELS[n][level];
    for (const i of shuffle([...Array(n * n).keys()])) {
      if (g.filter(Boolean).length <= target) break;
      const v = g[i]; g[i] = 0;
      if (solve(g.slice(), n, 2, false).count !== 1) g[i] = v;
    }
    return { n, level, givens: g.slice(), cells: g.slice(), sol: full, start: Date.now(), sel: -1 };
  }
  const sdState = () => LS.get('sudoku', null);
  const sdSet = v => { LS.set('sudoku', v); render(); };
  function sudokuView() {
    const opt = LS.get('sudoku.opt', { n: 4, level: 'leicht', sym: true, check: true });
    let g = sdState();
    if (!g) {
      return `<p>Jede Zeile, jede Spalte und jedes dicke Kästchen bekommt jedes Zeichen genau einmal.</p>
        <div class="seg"><button class="${opt.n === 4 ? 'on' : ''}" data-action="sd-opt" data-k="n" data-v="4">4 × 4</button><button class="${opt.n === 9 ? 'on' : ''}" data-action="sd-opt" data-k="n" data-v="9">9 × 9</button></div>
        <div class="seg"><button class="${opt.sym ? 'on' : ''}" data-action="sd-opt" data-k="sym" data-v="1">Tiere ${SYM[opt.n].slice(0, 3).join('')}</button><button class="${!opt.sym ? 'on' : ''}" data-action="sd-opt" data-k="sym" data-v="0">Zahlen 1 2 3</button></div>
        <div class="seg">${Object.keys(LEVELS[opt.n]).map(l => `<button class="${opt.level === l ? 'on' : ''}" data-action="sd-opt" data-k="level" data-v="${l}">${l}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" data-action="sd-check"${opt.check ? ' checked' : ''}><span>Fehler sofort zeigen</span></label>
        <button class="primary" data-action="sd-new">Neues Sudoku</button>`;
    }
    const n = g.n, [bh, bw] = box(n);
    const show = v => (v ? (opt.sym ? SYM[n][v - 1] : String(v)) : '');
    const done = g.cells.every((v, i) => v === g.sol[i]);
    const sel = g.sel;
    const sr = Math.floor(sel / n), sc = sel % n;
    const wrong = i => opt.check && g.cells[i] && !g.givens[i] && g.cells[i] !== g.sol[i];
    const best = LS.get(`sudoku.best.${n}.${g.level}`, 0);
    return `<p class="plate-progress">${n} × ${n}, ${g.level} · ${done ? `geschafft in ${mmss((g.end - g.start) / 1000)}` : `Zeit <b data-since="${g.start}">${mmss((Date.now() - g.start) / 1000)}</b>`}${best ? ` · Rekord ${mmss(best / 1000)}` : ''}</p>
      <div class="sd-grid n${n}${opt.sym ? ' sym' : ''}" style="--n:${n}">${g.cells.map((v, i) => {
        const r = Math.floor(i / n), c = i % n;
        const cls = [g.givens[i] ? 'given' : '', i === sel ? 'sel' : '', sel >= 0 && (r === sr || c === sc || (Math.floor(r / bh) === Math.floor(sr / bh) && Math.floor(c / bw) === Math.floor(sc / bw))) ? 'zone' : '',
          sel >= 0 && v && v === g.cells[sel] ? 'same' : '', wrong(i) ? 'wrong' : '', c % bw === bw - 1 && c < n - 1 ? 'br' : '', r % bh === bh - 1 && r < n - 1 ? 'bb' : ''].filter(Boolean).join(' ');
        return `<button class="sd-cell ${cls}" data-action="sd-sel" data-i="${i}">${show(v)}</button>`;
      }).join('')}</div>
      ${done ? '<p class="win">Super, gelöst! 🎉</p>' : `<div class="sd-pad n${n}">${[...Array(n).keys()].map(k => `<button data-action="sd-put" data-v="${k + 1}"${sel < 0 || g.givens[sel] ? ' disabled' : ''}>${show(k + 1)}</button>`).join('')}
        <button data-action="sd-put" data-v="0"${sel < 0 || g.givens[sel] ? ' disabled' : ''}>⌫</button></div>`}
      <div class="btnrow">${done ? '' : '<button class="ghost" data-action="sd-hint">Tipp</button>'}<button class="ghost" data-action="sd-quit">${done ? 'Neues Sudoku' : 'Aufgeben'}</button></div>`;
  }
  ACTIONS['sd-opt'] = el => {
    const o = LS.get('sudoku.opt', { n: 4, level: 'leicht', sym: true, check: true });
    const v = el.dataset.k === 'n' ? +el.dataset.v : el.dataset.k === 'sym' ? el.dataset.v === '1' : el.dataset.v;
    LS.set('sudoku.opt', { ...o, [el.dataset.k]: v }); render();
  };
  CHANGES['sd-check'] = el => LS.set('sudoku.opt', { ...LS.get('sudoku.opt', { n: 4, level: 'leicht', sym: true }), check: el.checked });
  ACTIONS['sd-new'] = () => { const o = LS.get('sudoku.opt', { n: 4, level: 'leicht', sym: true, check: true }); sdSet(makeSudoku(o.n, o.level)); };
  ACTIONS['sd-sel'] = el => { const g = sdState(); sdSet({ ...g, sel: +el.dataset.i }); };
  ACTIONS['sd-put'] = el => {
    const g = sdState();
    if (g.sel < 0 || g.givens[g.sel]) return;
    const cells = g.cells.slice(); cells[g.sel] = +el.dataset.v;
    const n = { ...g, cells };
    if (cells.every((v, i) => v === g.sol[i])) {
      n.end = Date.now();
      const key = `sudoku.best.${g.n}.${g.level}`, best = LS.get(key, 0);
      if (!best || n.end - n.start < best) LS.set(key, n.end - n.start);
      if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    }
    sdSet(n);
  };
  ACTIONS['sd-hint'] = () => {
    const g = sdState();
    const free = g.cells.map((v, i) => (v !== g.sol[i] ? i : -1)).filter(i => i >= 0);
    if (!free.length) return;
    const i = g.sel >= 0 && free.includes(g.sel) ? g.sel : pick(free);
    const cells = g.cells.slice(); cells[i] = g.sol[i];
    sdSet({ ...g, cells, sel: i });
    toast('Ein Feld verraten');
  };
  ACTIONS['sd-quit'] = () => { const g = sdState(); if (g && !g.end && g.cells.some((v, i) => v && !g.givens[i]) && !confirm('Dieses Sudoku aufgeben?')) return; LS.set('sudoku', null); render(); };

  /* ====================================================================== */
  /* Montagsmaler                                                            */
  /* ====================================================================== */

  const PAINT = {
    leicht: ['Sonne', 'Haus', 'Baum', 'Katze', 'Fisch', 'Auto', 'Ball', 'Blume', 'Mond', 'Eis', 'Apfel', 'Schneemann', 'Herz', 'Stern', 'Regenschirm', 'Brille',
      'Schaf', 'Boot', 'Banane', 'Schnecke', 'Kuchen', 'Wolke', 'Pilz', 'Zelt', 'Ente', 'Maus', 'Hund', 'Vogel', 'Uhr', 'Tasse'],
    mittel: ['Wohnmobil', 'Leuchtturm', 'Burg', 'Zahnbürste', 'Fahrrad', 'Giraffe', 'Rakete', 'Regenbogen', 'Kaktus', 'Krone', 'Pirat', 'Drache', 'Gitarre', 'Brücke',
      'Hubschrauber', 'Spinne', 'Dinosaurier', 'Zug', 'Lagerfeuer', 'Schatzkiste', 'Elefant', 'Igel', 'Tannenzapfen', 'Muschel', 'Sandburg', 'Hängematte', 'Taschenlampe', 'Kompass'],
    schwer: ['Sonnenbrand', 'Stau', 'Ebbe', 'Gewitter', 'Picknick', 'Wasserfall', 'Seilbahn', 'Wäscheleine', 'Grillwürstchen', 'Tankstelle', 'Mückenstich', 'Sternschnuppe',
      'Gipfelkreuz', 'Fähre', 'Klettersteig', 'Luftmatratze', 'Wegweiser', 'Ritterrüstung', 'Fußspuren', 'Heißluftballon'],
  };
  const ml = () => LS.get('maler', { level: 'leicht', phase: 'start', word: '', until: 0, score: {}, seen: [] });
  const setMl = v => { LS.set('maler', v); render(); };
  function malerView() {
    const g = ml();
    const board = `<p class="sub">Punkte: ${members().map(m => `${esc(m.name)} ${g.score[m.id] || 0}`).join(' · ')}</p>`;
    if (g.phase === 'start' || g.phase === 'done') {
      return `<p>Einer zieht ein Wort und malt es, ohne zu sprechen oder Buchstaben zu schreiben. Wer es errät, bekommt einen Punkt, der Maler auch.</p>
        <div class="seg">${Object.keys(PAINT).map(l => `<button class="${g.level === l ? 'on' : ''}" data-action="ml-level" data-l="${l}">${l}</button>`).join('')}</div>
        ${g.phase === 'done' ? `<p class="win">Das Wort war: ${esc(g.word)}</p>` : ''}${board}
        <div class="field"><span>Wer malt?</span><div class="chips wrap">${members().map(m => `<button class="chip${g.painter === m.id ? ' on' : ''}" data-action="ml-painter" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div></div>
        <button class="primary" data-action="ml-word"${g.painter ? '' : ' disabled'}>Wort ziehen (nur ${g.painter ? esc(personName(g.painter)) : 'der Maler'} schaut!)</button>`;
    }
    if (g.phase === 'peek') {
      return `<div class="big-card"><span class="sub">Dein Wort:</span><b>${esc(g.word)}</b></div>
        <div class="btnrow big-row"><button class="ghost big-btn" data-action="ml-word">Anderes Wort</button><button class="primary big-btn" data-action="ml-go">Gemerkt – malen!</button></div>`;
    }
    setTimeout(() => paintPad(document.getElementById('mlPad')), 0);
    return `<p class="fb-clock">${esc(personName(g.painter))} malt · noch <b data-until="${g.until}" data-onend="ml-timeout">${mmss((g.until - Date.now()) / 1000)}</b></p>
      <canvas id="mlPad" class="ml-pad" width="900" height="700"></canvas>
      <div class="ml-tools">${['#222222', '#B3261E', '#2E7FB8', '#2F7A4A', '#E0A21B', '#6B4226', '#FFFFFF'].map((c, i) => `<button class="fb-dot${i ? '' : ' on'}" style="--c:${c}" data-ml-c="${c}" aria-label="Farbe"></button>`).join('')}
        <button class="ghost small-btn" data-ml-undo="1">Zurück</button></div>
      <div class="field"><span>Wer hat es erraten?</span><div class="chips wrap">${members().filter(m => m.id !== g.painter).map(m => `<button class="chip" data-action="ml-guess" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div></div>
      <div class="btnrow"><button class="ghost" data-action="ml-giveup">Auflösen</button></div>`;
  }
  // Malfläche: die Striche liegen außerhalb der Seite, damit Neuzeichnen (z. B. nach dem Abgleich) nichts löscht
  let strokes = [];
  function paintPad(cv) {
    if (!cv || cv.dataset.ready) return;
    cv.dataset.ready = '1';
    const ctx = cv.getContext('2d');
    let color = '#222222', cur = null;
    const paint = () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const s of strokes) { ctx.strokeStyle = s.c; ctx.lineWidth = s.c === '#FFFFFF' ? 40 : 10; ctx.beginPath(); s.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), ctx.lineTo(x + 0.1, y)))); ctx.stroke(); }
    };
    paint();
    const pos = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); cur = { c: color, p: [pos(ev)] }; strokes.push(cur); paint(); });
    cv.addEventListener('pointermove', ev => { if (cur) { cur.p.push(pos(ev)); paint(); } });
    cv.addEventListener('pointerup', () => { cur = null; });
    const tools = cv.nextElementSibling;
    tools.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.mlC) { color = b.dataset.mlC; tools.querySelectorAll('[data-ml-c]').forEach(x => x.classList.toggle('on', x === b)); }
      if (b.dataset.mlUndo) { strokes.pop(); paint(); }
    });
  }
  ACTIONS['ml-level'] = el => setMl({ ...ml(), level: el.dataset.l });
  ACTIONS['ml-painter'] = el => setMl({ ...ml(), painter: el.dataset.id });
  ACTIONS['ml-word'] = () => {
    const g = ml();
    const pool = PAINT[g.level].filter(w => !g.seen.includes(w));
    const word = pick(pool.length ? pool : PAINT[g.level]);
    setMl({ ...g, phase: 'peek', word, seen: pool.length ? [...g.seen, word] : [word] });
  };
  ACTIONS['ml-go'] = () => { strokes = []; setMl({ ...ml(), phase: 'paint', until: Date.now() + 90000 }); };
  ACTIONS['ml-guess'] = el => {
    const g = ml();
    const score = { ...g.score, [el.dataset.id]: (g.score[el.dataset.id] || 0) + 1, [g.painter]: (g.score[g.painter] || 0) + 1 };
    toast(`${personName(el.dataset.id)} hat „${g.word}“ erraten!`);
    // Wer errät, malt als Nächstes
    setMl({ ...g, score, phase: 'done', painter: el.dataset.id });
  };
  ACTIONS['ml-giveup'] = () => setMl({ ...ml(), phase: 'done' });
  ACTIONS['ml-timeout'] = () => { if (navigator.vibrate) navigator.vibrate([150, 80, 150]); setMl({ ...ml(), phase: 'done' }); };

  /* ====================================================================== */
  /* Tic-Tac-Toe                                                             */
  /* ====================================================================== */

  const PAIRS = [['❌', '⭕'], ['🐑', '🐺'], ['🍦', '🍕'], ['☀️', '🌙']];
  const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const ttt = () => LS.get('ttt', { b: Array(9).fill(0), turn: 1, pair: 0, vs: 'zwei', level: 'leicht', score: [0, 0, 0], starter: 1 });
  const winner = b => { for (const l of LINES3) if (b[l[0]] && l.every(i => b[i] === b[l[0]])) return { p: b[l[0]], line: l }; return b.every(Boolean) ? { p: 0 } : null; };
  // Handy als Gegner: „leicht“ macht Fehler, „schwer“ verliert nie (Minimax)
  function best(b, me) {
    const mm = (bb, turn) => {
      const w = winner(bb);
      if (w) return w.p === me ? 1 : w.p === 0 ? 0 : -1;
      const scores = bb.map((v, i) => (v ? null : (() => { bb[i] = turn; const s = mm(bb, 3 - turn); bb[i] = 0; return s; })())).filter(v => v !== null);
      return turn === me ? Math.max(...scores) : Math.min(...scores);
    };
    const free = b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
    let top = -2, moves = [];
    for (const i of free) { b[i] = me; const s = mm(b, 3 - me); b[i] = 0; if (s > top) { top = s; moves = [i]; } else if (s === top) moves.push(i); }
    return pick(moves);
  }
  function tttView() {
    const g = ttt();
    const [a, o] = PAIRS[g.pair];
    const w = winner(g.b);
    const name = p => (g.vs === 'handy' ? (p === 1 ? 'Du' : 'Handy') : p === 1 ? `Spieler ${a}` : `Spieler ${o}`);
    return `<div class="seg"><button class="${g.vs === 'zwei' ? 'on' : ''}" data-action="ttt-opt" data-k="vs" data-v="zwei">Zu zweit</button><button class="${g.vs === 'handy' ? 'on' : ''}" data-action="ttt-opt" data-k="vs" data-v="handy">Gegen das Handy</button></div>
      ${g.vs === 'handy' ? `<div class="seg"><button class="${g.level === 'leicht' ? 'on' : ''}" data-action="ttt-opt" data-k="level" data-v="leicht">leicht</button><button class="${g.level === 'schwer' ? 'on' : ''}" data-action="ttt-opt" data-k="level" data-v="schwer">unschlagbar</button></div>` : ''}
      <div class="chips wrap">${PAIRS.map((pp, i) => `<button class="chip${g.pair === i ? ' on' : ''}" data-action="ttt-opt" data-k="pair" data-v="${i}">${pp.join(' ')}</button>`).join('')}</div>
      <p class="plate-progress">${a} ${esc(name(1))}: <b>${g.score[1]}</b> · ${o} ${esc(name(2))}: <b>${g.score[2]}</b> · Unentschieden: <b>${g.score[0]}</b></p>
      <div class="ttt">${g.b.map((v, i) => `<button class="ttt-cell${w && w.line && w.line.includes(i) ? ' win' : ''}" data-action="ttt-put" data-i="${i}"${v || w ? ' disabled' : ''}>${v ? (v === 1 ? a : o) : ''}</button>`).join('')}</div>
      <p class="win">${w ? (w.p ? `${w.p === 1 ? a : o} ${esc(name(w.p))} ${g.vs === 'handy' && w.p === 1 ? 'gewinnst' : 'gewinnt'}!` : 'Unentschieden!') : `${g.turn === 1 ? a : o} ist dran`}</p>
      ${w ? '<button class="primary" data-action="ttt-new">Nochmal</button>' : ''}`;
  }
  const tttSet = g => { LS.set('ttt', g); render(); };
  function tttMove(g, i) {
    g.b[i] = g.turn;
    const w = winner(g.b);
    if (w) { g.score[w.p]++; return g; }
    g.turn = 3 - g.turn;
    if (g.vs === 'handy' && g.turn === 2) {
      const free = g.b.map((v, k) => (v ? -1 : k)).filter(k => k >= 0);
      const k = g.level === 'schwer' || Math.random() < 0.45 ? best(g.b.slice(), 2) : pick(free);
      return tttMove(g, k);
    }
    return g;
  }
  ACTIONS['ttt-put'] = el => { const g = ttt(); if (g.b[+el.dataset.i] || winner(g.b)) return; tttSet(tttMove(g, +el.dataset.i)); };
  ACTIONS['ttt-new'] = () => {
    const g = ttt();
    // Abwechselnd anfangen
    const starter = 3 - (g.starter || 1);
    let n = { ...g, b: Array(9).fill(0), turn: starter, starter };
    if (n.vs === 'handy' && starter === 2) { n.turn = 2; n = tttMove(n, n.level === 'schwer' ? best(n.b.slice(), 2) : pick([0, 2, 4, 6, 8])); }
    tttSet(n);
  };
  ACTIONS['ttt-opt'] = el => {
    const v = el.dataset.k === 'pair' ? +el.dataset.v : el.dataset.v;
    tttSet({ ...ttt(), [el.dataset.k]: v, ...(el.dataset.k === 'pair' ? {} : { b: Array(9).fill(0), turn: 1, starter: 1, score: [0, 0, 0] }) });
  };

  /* ====================================================================== */
  /* Geschichten-Würfel                                                      */
  /* ====================================================================== */

  const STORY = {
    Figuren: ['👸', '🤴', '🧙', '🧚', '🧜', '🦸', '🧛', '👻', '🤖', '👽', '🧑‍🚀', '🧑‍🚒', '🕵️', '🏴‍☠️', '🧝', '🧞', '🤡', '👵', '🧒', '🎅'],
    Tiere: ['🐉', '🦄', '🐻', '🦊', '🐑', '🦁', '🐸', '🦉', '🐙', '🦖', '🐢', '🐝', '🦜', '🐴', '🐧', '🦈', '🐌', '🦔', '🐭', '🐬'],
    Orte: ['🏰', '🏝️', '🌋', '🏔️', '🌲', '🏜️', '🏕️', '🚀', '🏚️', '🎡', '⛪', '🏟️', '🗼', '🌊', '🛸', '🚂', '🏫', '🏥', '🌌', '🕳️'],
    Dinge: ['🗝️', '🗺️', '💎', '🎁', '📦', '🔦', '🧭', '🎈', '🪄', '📯', '🎻', '🍩', '🧸', '🪁', '🔮', '⏰', '📜', '🍄', '🥚', '👑'],
    Ereignisse: ['⛈️', '🌈', '🎂', '🔥', '❄️', '🌪️', '💤', '🎉', '💥', '🌙', '☀️', '🌧️', '🏆', '🚨', '💌', '🎭', '😱', '🤝', '🍀', '⭐'],
  };
  const st = () => LS.get('story', { n: 3, dice: [], turn: 0 });
  // Ein neues Bild, das noch nicht auf dem Tisch liegt
  const roll = (have = []) => { const cats = Object.keys(STORY); let e; do e = pick(STORY[pick(cats)]); while (have.includes(e)); return e; };
  const rollMany = n => { const out = []; while (out.length < n) out.push(roll(out)); return out; };
  function storyView() {
    const g = st();
    return `<p>Würfelt Bilder und erfindet eine Geschichte dazu. Reihum erzählt jeder einen Satz – mit „Noch ein Bild“ kommt eine neue Wendung dazu.</p>
      <div class="chips wrap">${[3, 5, 9].map(n => `<button class="chip${g.n === n ? ' on' : ''}" data-action="story-n" data-n="${n}">${n} Bilder</button>`).join('')}</div>
      ${g.dice.length ? `<div class="story-dice">${g.dice.map((e, i) => `<button class="story-die" data-action="story-one" data-i="${i}" style="--d:${i * 70}ms" aria-label="Neu würfeln">${e}</button>`).join('')}</div>
        <p class="sub">Tippt auf ein Bild, um nur dieses neu zu würfeln.</p>` : ''}
      <div class="btnrow"><button class="primary big-btn" data-action="story-roll">🎲 ${g.dice.length ? 'Neu würfeln' : 'Würfeln'}</button>
        ${g.dice.length ? '<button class="ghost" data-action="story-more">Noch ein Bild</button><button class="ghost" data-action="story-save">Ins Tagebuch</button>' : ''}</div>
      ${g.dice.length ? `<p class="sub">Erzählt: ${members().map((m, i) => `<span class="${i === g.turn % members().length ? 'mem-turn' : ''}">${esc(m.name)}</span>`).join(' → ')}</p>
        <button class="link" data-action="story-next">Nächste Person erzählt</button>` : ''}`;
  }
  ACTIONS['story-n'] = el => { LS.set('story', { ...st(), n: +el.dataset.n }); render(); };
  ACTIONS['story-roll'] = () => { const g = st(); LS.set('story', { ...g, dice: rollMany(g.n), turn: 0 }); if (navigator.vibrate) navigator.vibrate(40); render(); };
  ACTIONS['story-one'] = el => { const g = st(); const dice = g.dice.slice(); dice[+el.dataset.i] = roll(g.dice); LS.set('story', { ...g, dice }); render(); };
  ACTIONS['story-more'] = () => { const g = st(); LS.set('story', { ...g, dice: [...g.dice, roll(g.dice)].slice(-12) }); render(); };
  ACTIONS['story-next'] = () => { const g = st(); LS.set('story', { ...g, turn: g.turn + 1 }); render(); };
  ACTIONS['story-save'] = () => {
    const t = currentTrip();
    if (!t) return toast('Legt zuerst eine Reise an.');
    app.openSheet(`<form data-form="story">${app.sheetHead('Geschichte aufschreiben')}
      <p class="story-mini">${st().dice.join(' ')}</p>
      <label class="field voice-field"><span>Eure Geschichte</span>${app.voiceBtn ? app.voiceBtn('text') : ''}<textarea name="text" rows="6" placeholder="Es war einmal …"></textarea></label>
      <div class="sheet-foot"><button class="primary">Als Notiz speichern</button></div></form>`);
  };
  app.FORMS.story = form => {
    const t = currentTrip();
    const text = `${st().dice.join(' ')}\n\n${form.text.value.trim()}`.trim();
    save('entries', { id: app.newId(), tripId: t.id, by: me(), createdAt: Date.now(), type: 'notiz', title: 'Unsere Geschichte', date: app.nowLocal(), place: '', text, photos: [] });
    app.closeSheet();
    toast('Geschichte im Tagebuch gespeichert');
  };

  Object.assign(app.GAME_VIEWS, { maler: malerView, ttt: tttView, story: storyView });
  Object.assign(app.GAME_VIEWS, { farben: farbenView, abc: abcView, werbinich: werbinichView, tabu: tabuView, flaggen: flaggenView, memory: memoryView, sudoku: sudokuView });
}
