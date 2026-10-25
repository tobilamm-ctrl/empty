// Familie: Freigaben je Konto (was Kinder sehen), einfache Kinder-Startseite, wählbare Startseite,
// Einführung beim ersten Start und die automatischen Sicherungen des Servers (nur Verwalter).

export default function installFamilie(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, esc, icon, art, toast, render, go, openSheet, closeSheet,
    settingsPanels, chromeHooks, api,
  } = app;
  const sheetHead = app.sheetHead;
  const user = () => (app.session() && app.session().user) || {};

  /* ====================================================================== */
  /* Bereiche, die sich je Konto freigeben lassen                            */
  /* ====================================================================== */

  const TABS = [['karte', 'Karte'], ['tagebuch', 'Tagebuch'], ['planung', 'Reiseplanung'], ['listen', 'Listen'], ['packen', 'Boxen & Fächer']];
  const tiles = () => (app.TILES || []).filter(t => !t.cash && !t.admin && !['einstellungen', 'spiele'].includes(t.route)).map(t => [t.route, t.title]);
  const games = () => [['spiel:nochweit', 'Wie lange noch?'], ['spiel:reisepass', 'Reisepass'], ...(app.GAMES || []).map(([k, t]) => ['spiel:' + k, t])];
  const allKeys = () => [...TABS, ...tiles(), ...games()].map(([k]) => k);
  // Vorschlag für Kinder: alles zum Mitmachen und Anschauen, ohne Verwaltung und Organisation
  const KIDS = ['karte', 'tagebuch', 'album', 'wetter', 'laender', 'statistik', 'kochen', 'ideen', 'spiel:nochweit', 'spiel:reisepass',
    'spiel:kennzeichen', 'spiel:laenderkz', 'spiel:bingo', 'spiel:slf', 'spiel:quiz', 'spiel:sticker', 'spiel:brettspiele', 'spiel:tiere', 'spiel:rallye',
    'spiel:farben', 'spiel:abc', 'spiel:werbinich', 'spiel:tabu', 'spiel:flaggen', 'spiel:memory', 'spiel:sudoku', 'abstimmung', 'urlaubsgeld'];

  app.allowed = key => {
    const a = user().areas;
    if (!a) return true;
    if (key === 'spiele') return a.some(k => k.startsWith('spiel:'));
    if (key === 'nochweit' || key === 'reisepass') return a.includes('spiel:' + key);
    return a.includes(key);
  };
  const simple = () => !!user().simple;
  const ALWAYS = ['einstellungen', 'verwaltung', 'kinder', 'loading', 'login', 'setup', 'reset', 'nocrew', 'offline'];

  // Erste Seite des Kontos: eigene Wahl, sonst Kinder-Start, sonst Karte (oder das erste Erlaubte)
  function startRoute() {
    const s = user().start;
    if (s && (ALWAYS.includes(s) || app.allowed(s))) return s;
    if (simple()) return 'kinder';
    return ['karte', 'tagebuch', 'listen', 'packen'].find(r => app.allowed(r)) || 'mehr';
  }
  let started = false;
  app.routeGuard = r => {
    if (!started) {
      started = true;
      // Beim Öffnen (auch über das App-Symbol, das mit #/karte startet) gilt die gewählte Startseite
      if (['', '#', '#/', '#/karte'].includes(location.hash)) return startRoute();
    }
    if (r === 'mehr') return simple() ? 'kinder' : r;
    if (ALWAYS.includes(r)) return r;
    if (r === 'rueckblick') return app.allowed('tagebuch') ? r : startRoute();
    return app.allowed(r) ? r : startRoute();
  };

  // Reiterleiste: nur freigegebene Reiter; Kinder-Ansicht mit „Start“ statt „Mehr“
  chromeHooks.push(tab => {
    document.querySelectorAll('.tabbar a').forEach(a => {
      const t = a.dataset.tab;
      a.hidden = t === 'kinder' ? !simple() : t === 'mehr' ? simple() : !app.allowed(t);
      if (simple() && t === 'kinder') a.classList.toggle('on', tab === 'mehr' || ui.route === 'kinder');
    });
    // Ohne Freigabe für „Reisen“: Reise über eine kleine Auswahl wechseln
    const chip = document.getElementById('tripChip');
    if (chip) chip.dataset.action = app.allowed('reisen') ? '' : 'trip-pick';
    maybeIntro();
  });
  ACTIONS['trip-pick'] = () => {
    const list = S.trips.filter(t => !t.archived);
    openSheet(`<div>${sheetHead('Welche Reise?')}<ul class="ledger">${list.map(t => `<li><button data-action="trip-pick-set" data-id="${t.id}">
      <span class="txt"><b>${esc(t.name)}</b><small>${esc(app.fmtRange(t))}</small></span></button></li>`).join('')}</ul></div>`);
  };
  ACTIONS['trip-pick-set'] = el => { app.setTrip(el.dataset.id); closeSheet(); render(); };

  /* ---------- Formular in der Verwaltung ---------- */

  app.areaFields = u => {
    const a = u.areas || null;
    const box = ([k, l]) => `<label class="chip"><input type="checkbox" name="area" value="${k}"${!a || a.includes(k) ? ' checked' : ''}><span>${esc(l)}</span></label>`;
    return `<details class="areas"${a || u.simple ? ' open' : ''}>
      <summary>Was sieht ${esc(u.name || 'diese Person')}?</summary>
      <p class="sub">Für Kinderkonten. Verwalter sehen immer alles. Kasse und Tankbuch steuert „Darf die Kasse sehen“, Dokumente sehen nur Verwalter.</p>
      <div class="btnrow"><button type="button" class="ghost small-btn" data-action="areas-preset" data-p="all">Alles</button>
        <button type="button" class="ghost small-btn" data-action="areas-preset" data-p="kids">Kinder-Vorschlag</button>
        <button type="button" class="ghost small-btn" data-action="areas-preset" data-p="none">Nichts</button></div>
      <div class="field"><span>Reiter</span><div class="chips wrap">${TABS.map(box).join('')}</div></div>
      <div class="field"><span>Bereiche unter „Mehr“</span><div class="chips wrap">${tiles().map(box).join('')}</div></div>
      <div class="field"><span>Spiele</span><div class="chips wrap">${games().map(box).join('')}</div></div>
      <label class="check"><input type="checkbox" name="simple"${u.simple ? ' checked' : ''}><span>Einfache Ansicht: große Kacheln statt „Mehr“</span></label>
      <label class="field"><span>Startseite</span><select name="start">${startOptions(u.start || '', true)}</select></label>
    </details>`;
  };
  ACTIONS['areas-preset'] = el => {
    const form = el.closest('form');
    form.querySelectorAll('[name=area]').forEach(c => { c.checked = el.dataset.p === 'all' || (el.dataset.p === 'kids' && KIDS.includes(c.value)); });
    if (el.dataset.p === 'kids') { form.simple.checked = true; form.start.value = 'kinder'; }
    if (el.dataset.p === 'all') form.simple.checked = false;
  };
  app.readAreas = form => {
    if (!form.querySelector('[name=area]')) return {};
    const on = [...form.querySelectorAll('[name=area]:checked')].map(c => c.value);
    const all = [...form.querySelectorAll('[name=area]')].length;
    return { areas: on.length === all ? null : on, simple: form.simple.checked, start: form.start.value };
  };

  /* ---------- Startseite wählbar ---------- */

  const START_LABELS = { '': 'Wie gewohnt', karte: 'Karte', tagebuch: 'Tagebuch', listen: 'Listen', packen: 'Boxen & Fächer', mehr: 'Mehr', kinder: 'Kinder-Start (große Kacheln)', spiele: 'Spiele & Co', wetter: 'Wetter', album: 'Fotoalbum' };
  function startOptions(cur, forAdminForm) {
    return Object.entries(START_LABELS)
      .filter(([k]) => forAdminForm || !k || ALWAYS.includes(k) || k === 'mehr' || app.allowed(k))
      .map(([k, l]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${l}</option>`).join('');
  }
  settingsPanels.push(() => `<section class="panel">
      <h2>Startseite</h2>
      <p class="sub">Womit LAMMping auf deinen Geräten öffnet.</p>
      <label class="field"><select data-action-input="start-page">${startOptions(user().start || '', false)}</select></label>
      <button class="ghost" data-action="intro-show">Einführung noch einmal ansehen</button>
    </section>`);
  document.addEventListener('change', async ev => {
    if (ev.target.dataset.actionInput !== 'start-page') return;
    try {
      await api('prefs', { start: ev.target.value });
      user().start = ev.target.value;
      toast('Startseite gespeichert');
    } catch (e) { toast(e.message); }
  });

  /* ====================================================================== */
  /* Kinder-Start: große Kacheln                                             */
  /* ====================================================================== */

  const TILE_ART = { karte: 'karte', tagebuch: 'tagebuch', listen: 'listen', packen: 'boxen' };
  VIEWS.kinder = () => {
    const u = user();
    const gs = games().filter(([k]) => app.allowed(k));
    const areas = [...TABS.filter(([k]) => k !== 'planung'), ...tiles()].filter(([k]) => app.allowed(k));
    const tileArt = k => (app.TILES || []).find(t => t.route === k)?.art || TILE_ART[k] || 'mehr';
    return `<section class="kids-hello">
        <svg class="kids-sheep" aria-hidden="true"><use href="#schaf"/></svg>
        <div><h1>Hallo ${esc(u.name || '')}!</h1><p class="sub">Was möchtest du machen?</p></div>
      </section>
      ${gs.length ? `<h2 class="date-head">Spielen</h2><nav class="kids-tiles">${gs.map(([k, l]) => {
        const g = k.slice(6);
        const href = g === 'nochweit' || g === 'reisepass' ? `href="#/${g}"` : '';
        return `<a class="kids-tile" ${href || `data-action="kid-game" data-g="${g}" href="#/spiele"`}>${app.gameArt ? app.gameArt(g) : ''}<b>${esc(l)}</b></a>`;
      }).join('')}</nav>` : ''}
      ${areas.length ? `<h2 class="date-head">Anschauen</h2><nav class="kids-tiles">${areas.map(([k, l]) =>
        `<a class="kids-tile" href="#/${k}">${art(tileArt(k))}<b>${esc(l)}</b></a>`).join('')}</nav>` : ''}
      <p class="sub kids-foot"><a href="#/einstellungen">Einstellungen und Abmelden</a></p>`;
  };
  ACTIONS['kid-game'] = el => { ui.game = el.dataset.g; go('spiele'); };

  /* ====================================================================== */
  /* Einführung beim ersten Start                                            */
  /* ====================================================================== */

  const SLIDES = [
    [null, 'Willkommen bei LAMMping!', 'Euer gemeinsames Reisetagebuch für den Minicamper. Alles, was einer einträgt, sehen die anderen auf ihren Handys. Auch ohne Netz könnt ihr weiterschreiben.', 'mehr'],
    ['karte', 'Karte', 'Hier seht ihr eure Route. Mit „Ich bin hier …“ tragt ihr ein, wo ihr gerade seid: Stellplatz, Sehenswertes, Tankstelle und vieles mehr. Die Lupe zeigt Wasser, Supermarkt oder Spielplatz in der Nähe.', 'karte'],
    ['tagebuch', 'Tagebuch', 'Jeder Tag der Reise mit allen Einträgen und Fotos. Über „+ Eintrag“ schreibt ihr dazu. Oben steht, was heute wichtig ist: Wetter, Sonne und das nächste Ziel.', 'tagebuch'],
    ['planung', 'Planung', 'Im Tagebuch unter „Planung“ merkt ihr Stellplätze und Ausflüge vor, mit Fahrzeit zwischen den Orten. Reiseideen für später sammelt ihr unter „Mehr“.', 'planung'],
    ['listen', 'Listen', 'Einkaufslisten und Merklisten für alle. Abgehakt ist abgehakt, auch auf den anderen Handys.', 'listen'],
    ['packen', 'Boxen & Fächer', 'Was liegt wo im Auto? Mit der Suche findet ihr alles, beim Packen hakt ihr ab.', 'boxen'],
    ['spiele', 'Spiele & Co', 'Kennzeichen sammeln, Reise-Bingo, Stadt-Land-Fluss, der Reisepass mit Stempeln und „Wie lange noch?“ für die Rückbank.', 'spiele'],
    [null, 'Los geht’s!', 'Die Einführung findet ihr jederzeit wieder in den Einstellungen. Gute Fahrt!', 'reisen'],
  ];
  const introKey = () => 'intro.' + (user().id || '');
  function maybeIntro() {
    // nointro: für automatische Tests, die die Einführung nicht durchklicken sollen
    if (!user().id || LS.get(introKey(), false) || LS.get('nointro', false) || document.querySelector('.intro')) return;
    LS.set(introKey(), true);
    showIntro();
  }
  function showIntro() {
    const slides = SLIDES.filter(([k]) => !k || app.allowed(k)).map(s => (s[0] === 'spiele' && simple() ? [...s.slice(0, 2), 'Auf deiner Startseite findest du alle Spiele und was du dir anschauen kannst.', s[3]] : s));
    let i = 0;
    const el = document.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    const draw = () => {
      const [, title, text, a] = slides[i];
      el.innerHTML = `<div class="intro-card">
        <div class="intro-art">${art(a)}</div>
        <h2>${title}</h2><p>${text}</p>
        <div class="intro-dots">${slides.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div>
        <div class="intro-foot">
          ${i < slides.length - 1 ? '<button class="link" data-intro="skip">Überspringen</button>' : '<span></span>'}
          <button class="primary" data-intro="next">${i < slides.length - 1 ? 'Weiter' : 'Los geht’s'}</button>
        </div></div>`;
    };
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-intro]');
      if (!b) return;
      if (b.dataset.intro === 'next' && i < slides.length - 1) { i++; draw(); } else el.remove();
    });
    draw();
    document.body.appendChild(el);
    el.querySelector('[data-intro=next]').focus();
  }
  ACTIONS['intro-show'] = () => showIntro();

  /* ====================================================================== */
  /* Automatische Sicherungen (Server, nur Verwalter)                        */
  /* ====================================================================== */

  settingsPanels.push(() => (user().isAdmin ? `<section class="panel">
      <h2>Automatische Sicherung</h2>
      <p class="sub">Der Server sichert einmal pro Woche die komplette Datenbank und hebt die letzten vier Sicherungen auf. Gelöschte Fotos bleiben 30 Tage im Papierkorb.</p>
      <button class="ghost" data-action="backups">Sicherungen anzeigen</button>
    </section>` : ''));
  const size = b => (b > 1048576 ? `${(b / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
  async function backups(make) {
    openSheet(`<div>${sheetHead('Sicherungen')}<p class="sub">${make ? 'Wird gesichert …' : 'Wird geladen …'}</p></div>`);
    try {
      const { backups: list } = await api('backups', make ? {} : undefined);
      openSheet(`<div>${sheetHead('Sicherungen')}
        ${list.length ? `<ul class="backup-list">${list.map(b => `<li><span><b>${new Date(b.time).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</b><small>${size(b.size)}</small></span>
          <a class="ghost small-btn btn" href="api/?a=backup-get&name=${encodeURIComponent(b.name)}" download>${icon('download')}Laden</a></li>`).join('')}</ul>`
          : '<p class="hint">Noch keine Sicherung. Die erste entsteht beim nächsten Abgleich oder jetzt mit dem Knopf.</p>'}
        <p class="sub">Wiederherstellen: Die Datei per SFTP als <code>api/data/lammping.sqlite</code> einsetzen (vorher die alte umbenennen). Fotos liegen unverändert in <code>api/data/photos</code>.</p>
        <div class="sheet-foot"><button class="primary" data-action="backup-now">Jetzt sichern</button></div></div>`);
      if (make) toast('Sicherung angelegt');
    } catch (e) {
      openSheet(`<div>${sheetHead('Sicherungen')}<p class="hint">${esc(e.message)}</p></div>`);
    }
  }
  ACTIONS.backups = () => backups(false);
  ACTIONS['backup-now'] = () => backups(true);
}
