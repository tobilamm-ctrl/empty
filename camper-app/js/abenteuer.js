// Für die Kinder: Tier-Sammelbuch und Foto-Rallye (in Spiele & Co), Malen und Sprachnotizen im Tagebuch.
// Gemalte Bilder werden wie Fotos gespeichert, Sprachnotizen liegen ebenfalls in der Foto-Sammlung des Servers.

export default function installAbenteuer(app) {
  const {
    S, ACTIONS, CHANGES, FORMS, esc, icon, newId, save, remove, toast, openSheet, closeSheet,
    currentTrip, members, me, personName, fmtShort, tripEntries, byDate, shrink,
  } = app;
  const sheetHead = app.sheetHead;
  const player = () => (app.player ? app.player() : me());
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const dayOf = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  // Wo sind wir gerade? Ort des letzten Eintrags der laufenden Reise
  const placeNow = () => { const t = currentTrip(); const e = t && tripEntries(t).filter(x => x.place).sort(byDate).pop(); return e ? e.place : ''; };

  // Spiele eintragen (vor „Brettspiele“, das ein externes Portal ist)
  const at = app.GAMES.findIndex(g => g[0] === 'brettspiele');
  app.GAMES.splice(at < 0 ? app.GAMES.length : at, 0,
    ['tiere', 'Tier-Sammelbuch', 'Welche Tiere habt ihr entdeckt?'],
    ['rallye', 'Foto-Rallye', 'Aufgaben mit der Kamera lösen']);
  Object.assign(app.GAME_ART, {
    tiere: '<rect x="10" y="6" width="44" height="36" rx="4" fill="var(--paper)"/><path d="M32 6v36"/><circle cx="21" cy="20" r="3"/><circle cx="17" cy="14" r="2"/><circle cx="25" cy="14" r="2"/><path d="M17 26q4-4 8 0q2 4-4 4t-4-4z"/><path d="M37 16h12M37 22h12M37 28h8"/>',
    rallye: '<rect x="8" y="12" width="40" height="28" rx="4" fill="var(--paper)"/><path d="M20 12l3-5h10l3 5"/><circle cx="28" cy="26" r="8"/><circle cx="28" cy="26" r="3"/><path d="M50 8v14M50 8l8 3-8 3" stroke="#B3261E"/>',
  });

  /* ====================================================================== */
  /* Tier-Sammelbuch                                                         */
  /* ====================================================================== */

  // Kennung, Name, Zeichen, Gruppe, Seltenheit (1 häufig, 2 besonders, 3 selten)
  const ANIMALS = [
    ['kuh', 'Kuh', '🐄', 'hof', 1], ['schaf', 'Schaf', '🐑', 'hof', 1], ['ziege', 'Ziege', '🐐', 'hof', 1], ['pferd', 'Pferd', '🐎', 'hof', 1],
    ['esel', 'Esel', '🐴', 'hof', 2], ['schwein', 'Schwein', '🐖', 'hof', 1], ['huhn', 'Huhn', '🐔', 'hof', 1], ['hahn', 'Hahn', '🐓', 'hof', 1],
    ['alpaka', 'Alpaka oder Lama', '🦙', 'hof', 2], ['hochlandrind', 'Hochlandrind', '🐂', 'hof', 2], ['katze', 'Katze', '🐈', 'hof', 1], ['hund', 'Hund', '🐕', 'hof', 1],
    ['reh', 'Reh', '🦌', 'wald', 2], ['hirsch', 'Hirsch', '🦌', 'wald', 2], ['fuchs', 'Fuchs', '🦊', 'wald', 2], ['hase', 'Hase', '🐇', 'wald', 1],
    ['eichhoernchen', 'Eichhörnchen', '🐿️', 'wald', 1], ['igel', 'Igel', '🦔', 'wald', 2], ['wildschwein', 'Wildschwein', '🐗', 'wald', 3], ['dachs', 'Dachs', '🦡', 'wald', 3],
    ['biber', 'Biber', '🦫', 'wald', 3], ['fledermaus', 'Fledermaus', '🦇', 'wald', 2], ['frosch', 'Frosch', '🐸', 'wald', 1], ['eidechse', 'Eidechse', '🦎', 'wald', 2],
    ['schlange', 'Schlange', '🐍', 'wald', 3], ['schnecke', 'Schnecke', '🐌', 'wald', 1], ['schmetterling', 'Schmetterling', '🦋', 'wald', 1], ['marienkaefer', 'Marienkäfer', '🐞', 'wald', 1],
    ['biene', 'Biene oder Hummel', '🐝', 'wald', 1], ['ameise', 'Ameise', '🐜', 'wald', 1],
    ['murmeltier', 'Murmeltier', '🐹', 'berg', 2], ['steinbock', 'Steinbock', '🐐', 'berg', 3], ['gaemse', 'Gämse', '🐐', 'berg', 3], ['adler', 'Adler', '🦅', 'berg', 3],
    ['geier', 'Geier', '🦅', 'berg', 3],
    ['ente', 'Ente', '🦆', 'wasser', 1], ['schwan', 'Schwan', '🦢', 'wasser', 1], ['gans', 'Gans', '🦆', 'wasser', 1], ['fisch', 'Fisch', '🐟', 'wasser', 1],
    ['krabbe', 'Krabbe', '🦀', 'wasser', 1], ['seestern', 'Seestern', '⭐', 'wasser', 2], ['qualle', 'Qualle', '🌊', 'wasser', 2], ['otter', 'Otter', '🦦', 'wasser', 3],
    ['robbe', 'Robbe oder Seehund', '🦭', 'wasser', 3], ['delfin', 'Delfin', '🐬', 'wasser', 3], ['wal', 'Wal', '🐋', 'wasser', 3], ['papageitaucher', 'Papageitaucher', '🐦', 'wasser', 3],
    ['moewe', 'Möwe', '🐦', 'vogel', 1], ['storch', 'Storch', '🐦', 'vogel', 2], ['reiher', 'Reiher', '🐦', 'vogel', 2], ['eule', 'Eule', '🦉', 'vogel', 3],
    ['specht', 'Specht', '🐦', 'vogel', 2], ['bussard', 'Bussard oder Falke', '🦅', 'vogel', 2], ['papagei', 'Papagei', '🦜', 'vogel', 3], ['flamingo', 'Flamingo', '🦩', 'vogel', 3],
    ['pfau', 'Pfau', '🦚', 'vogel', 2],
  ];
  const GROUPS = { hof: 'Bauernhof und Haus', wald: 'Wald und Wiese', berg: 'Berge', wasser: 'Wasser und Küste', vogel: 'Vögel', eigen: 'Eigene Entdeckungen' };
  const RARE = ['', 'häufig', 'besonders', 'selten'];
  const animal = k => ANIMALS.find(a => a[0] === k);
  const seenOf = pid => S.games.filter(g => g.kind === 'animal' && g.by === pid);
  const points = list => list.reduce((s, g) => s + ((animal(g.key) || [])[4] || g.rare || 2), 0);
  app.animalsOf = pid => seenOf(pid).map(g => ({ ...g, a: animal(g.key) })).sort((a, b) => (a.at || 0) - (b.at || 0));
  app.gameScores.tiere = () => seenOf(player()).length;

  function animalView() {
    const pid = player();
    const mine = seenOf(pid);
    const seen = new Map(mine.map(g => [g.key, g]));
    const t = currentTrip();
    const rows = members().map(m => { const l = seenOf(m.id); return { m, n: l.length, p: points(l), trip: t ? l.filter(g => g.tripId === t.id).length : 0 }; })
      .sort((a, b) => b.p - a.p);
    const own = mine.filter(g => !animal(g.key));
    const tile = (k, name, sym, rare, g) => `<button class="animal${g ? ' seen' : ''} r${rare}" data-action="${g ? 'animal-info' : 'animal-add'}" data-k="${esc(k)}">
      <span class="an-sym">${sym}</span><b>${esc(name)}</b><small>${g ? fmtShort(dayOf(g.at)) : RARE[rare]}</small></button>`;
    return `<div class="plate-progress"><b>${mine.length}</b> von ${ANIMALS.length} Tieren entdeckt, <b>${points(mine)}</b> Punkte
        <div class="progress" style="--p:${Math.min(1, mine.length / ANIMALS.length)}"><span></span></div></div>
      <p class="sub">Häufige Tiere bringen einen Punkt, besondere zwei und seltene drei. Tippt auf ein Tier, sobald ihr es seht.</p>
      <section class="leader"><h3 class="date-head">Wertung</h3>
        <ol>${rows.map(r => `<li class="${r.m.id === pid ? 'me' : ''}"><span>${esc(r.m.name)}</span><b>${r.p}</b><small>${r.n} Tiere${t ? `, ${r.trip} auf dieser Reise` : ''}</small></li>`).join('')}</ol></section>
      ${Object.entries(GROUPS).filter(([g]) => g !== 'eigen').map(([g, title]) => `<h3 class="date-head">${title}</h3>
        <div class="animals">${ANIMALS.filter(a => a[3] === g).map(([k, name, sym, , rare]) => tile(k, name, sym, rare, seen.get(k))).join('')}</div>`).join('')}
      <h3 class="date-head">${GROUPS.eigen}</h3>
      ${own.length ? `<div class="animals">${own.map(g => tile(g.key, g.name, '🐾', g.rare || 2, g)).join('')}</div>` : ''}
      <button class="ghost" data-action="animal-own">${icon('plus')}Anderes Tier eintragen</button>`;
  }
  ACTIONS['animal-add'] = el => {
    const a = animal(el.dataset.k);
    if (!a) return;
    const t = currentTrip();
    save('games', { id: `tier_${player()}_${a[0]}`, kind: 'animal', by: player(), key: a[0], at: Date.now(), tripId: t ? t.id : null, place: placeNow() });
    toast(`${a[2]} ${a[1]} entdeckt! +${a[4]} ${a[4] === 1 ? 'Punkt' : 'Punkte'}`);
  };
  ACTIONS['animal-info'] = el => {
    const g = S.games.find(x => x.id === `tier_${player()}_${el.dataset.k}`);
    if (!g) return;
    const a = animal(g.key) || [g.key, g.name, '🐾', 'eigen', g.rare || 2];
    const trip = S.trips.find(t => t.id === g.tripId);
    openSheet(`<div>${sheetHead(`${a[2]} ${esc(a[1])}`)}
      <p>${esc(personName(g.by))} hat dieses Tier am ${fmtShort(dayOf(g.at))} entdeckt${g.place ? ` (${esc(g.place)})` : ''}${trip ? `, auf der Reise „${esc(trip.name)}“` : ''}.</p>
      <p class="sub">${RARE[a[4]]}: ${a[4]} ${a[4] === 1 ? 'Punkt' : 'Punkte'}</p>
      <div class="sheet-foot"><button class="ghost danger" data-action="animal-del" data-id="${g.id}">Wieder entfernen</button>
        <button class="primary" data-action="close">Schließen</button></div></div>`);
  };
  ACTIONS['animal-del'] = el => { remove('games', el.dataset.id); closeSheet(); };
  ACTIONS['animal-own'] = () => {
    openSheet(`<form data-form="animal-own">${sheetHead('Anderes Tier')}
      <label class="field"><span>Welches Tier?</span><input name="name" required maxlength="40" placeholder="z. B. Feuersalamander"></label>
      <div class="field"><span>Wie selten?</span><div class="chips wrap">${[1, 2, 3].map(r =>
        `<label class="chip"><input type="radio" name="rare" value="${r}"${r === 2 ? ' checked' : ''}><span>${RARE[r]} (${r})</span></label>`).join('')}</div></div>
      <div class="sheet-foot"><button class="primary">Entdeckt!</button></div></form>`);
  };
  FORMS['animal-own'] = form => {
    const name = form.name.value.trim();
    const key = 'x-' + name.toLowerCase().replace(/[^a-zäöüß0-9]+/g, '-').slice(0, 40);
    const t = currentTrip();
    save('games', { id: `tier_${player()}_${key}`, kind: 'animal', by: player(), key, name, rare: +form.rare.value, at: Date.now(), tripId: t ? t.id : null, place: placeNow() });
    closeSheet();
    toast(`${name} eingetragen`);
  };

  /* ====================================================================== */
  /* Foto-Rallye                                                             */
  /* ====================================================================== */

  const TASKS = [
    'Eine rote Tür', 'Ein Schild in einer fremden Sprache', 'Ein Tier mit Hörnern', 'Etwas, das wie ein Gesicht aussieht', 'Die höchste Stelle des Tages',
    'Ein Briefkasten', 'Etwas Rundes und Gelbes', 'Eine Brücke', 'Ein lustiger Ortsname', 'Fünf Steine übereinander', 'Ein Kennzeichen aus einem anderen Land',
    'Eine Blume in deiner Lieblingsfarbe', 'Ein Spiegelbild im Wasser', 'Dein Schatten', 'Eine Wolke, die wie ein Tier aussieht', 'Ein Eis (vor dem Essen!)',
    'Etwas Uraltes', 'Ein Leuchtturm oder Turm', 'Ein Zug, Boot oder Flugzeug', 'Eine Fahne', 'Ein Muster aus lauter gleichen Dingen', 'Ein besonders großer Baum',
    'Etwas, das man hier typisch isst', 'Ein Kunstwerk draußen', 'Fußspuren', 'Eine Zahl größer als 1000', 'Ein Wegweiser mit vielen Pfeilen', 'Ein Herz, das man findet',
    'Ein Spielplatz-Gerät, das es zu Hause nicht gibt', 'Ein Sonnenuntergang', 'Etwas Blaues in der Natur', 'Ein Tier, das schläft', 'Euer Camper von ganz weit weg',
    'Ein Fenster mit Blumen', 'Eine Treppe mit vielen Stufen', 'Ein Regenbogen oder Regentropfen', 'Ein Wasserfall oder Brunnen', 'Etwas Winziges ganz nah',
    'Eine Muschel, Feder oder ein Tannenzapfen', 'Ein Gruppenfoto mit allen', 'Ein Schild mit einem Tier darauf', 'Eine Burg, ein Schloss oder eine Ruine',
  ];
  const ROUND = 8;
  const rallyeId = () => `rallye_${player()}_${(currentTrip() || {}).id || 'ohne'}`;
  const rallye = () => S.games.find(g => g.id === rallyeId());
  const done = r => Object.keys(r.shots || {}).length;
  app.rallyeRounds = pid => S.games.filter(g => g.kind === 'rallye' && g.by === pid)
    .flatMap(g => [...(g.rounds || []), ...(g.tasks && done(g) >= g.tasks.length ? [{ at: g.doneAt || g.updatedAt || Date.now() }] : [])]);
  app.gameScores.rallye = () => { const r = rallye(); return r ? `${done(r)}/${r.tasks.length}` : '0'; };

  function rallyeView() {
    let r = rallye();
    if (!r) {
      return `<p>Acht Aufgaben, eine Kamera: Wer schafft alle Fotos zuerst?</p>
        <button class="primary" data-action="rallye-new">Rallye starten</button>`;
    }
    const n = done(r);
    return `<div class="plate-progress"><b>${n}</b> von ${r.tasks.length} Aufgaben geschafft<div class="progress" style="--p:${n / r.tasks.length}"><span></span></div></div>
      <ul class="rallye">${r.tasks.map((task, i) => { const s = (r.shots || {})[i]; return `<li class="${s ? 'done' : ''}">
        ${s ? `<img src="${s.thumb}" alt="">` : `<span class="rl-no">${i + 1}</span>`}
        <b>${esc(task)}</b>
        <label class="${s ? 'link' : 'primary btn small-btn'} file">${s ? 'Neues Foto' : `${icon('camera')}Foto`}<input type="file" accept="image/*" capture="environment" data-action="rallye-shot" data-i="${i}"></label>
      </li>`; }).join('')}</ul>
      ${n === r.tasks.length ? '<p class="win">Alle Aufgaben geschafft! 🎉</p>' : ''}
      <div class="btnrow">${n ? `<button class="ghost" data-action="rallye-collage">${icon('download')}Collage</button>` : ''}
        <button class="ghost" data-action="rallye-new">Neue Aufgaben</button></div>
      ${(r.rounds || []).length ? `<p class="sub">Schon ${(r.rounds || []).length} ${(r.rounds || []).length === 1 ? 'Runde' : 'Runden'} auf dieser Reise geschafft.</p>` : ''}`;
  }
  ACTIONS['rallye-new'] = () => {
    const r = rallye();
    if (r && done(r) && done(r) < r.tasks.length && !confirm('Neue Aufgaben? Die Fotos dieser Runde bleiben gespeichert, die Runde zählt aber nicht als geschafft.')) return;
    const old = new Set(r ? r.tasks : []);
    const fresh = shuffle(TASKS.filter(x => !old.has(x))).slice(0, ROUND);
    const rounds = [...((r && r.rounds) || []), ...(r && done(r) === r.tasks.length ? [{ at: r.doneAt || Date.now(), shots: r.shots }] : [])];
    const t = currentTrip();
    save('games', { ...(r || {}), id: rallyeId(), kind: 'rallye', by: player(), tripId: t ? t.id : null, tasks: fresh, shots: {}, rounds, doneAt: null, startedAt: Date.now() });
  };
  CHANGES['rallye-shot'] = async el => {
    const f = el.files[0];
    el.value = '';
    const r = rallye();
    if (!f || !r) return;
    try {
      const id = newId();
      const thumb = await shrink(f, 360, 0.7);
      save('photos', { id, tripId: r.tripId, data: await shrink(f, 1920, 0.78) });
      const shots = { ...(r.shots || {}), [el.dataset.i]: { id, thumb, at: Date.now() } };
      const all = Object.keys(shots).length === r.tasks.length;
      save('games', { ...r, shots, doneAt: all ? Date.now() : null });
      toast(all ? 'Alle Aufgaben geschafft! 🎉' : 'Aufgabe geschafft!');
    } catch { toast('Das Foto ließ sich nicht lesen.'); }
  };

  // Collage: alle Fotos der Runde mit den Aufgaben als ein Bild zum Teilen
  const loadImg = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  async function photoSrc(p) {
    try { const d = await app.store().get('photos', p.id); if (d && d.data) return await loadImg(d.data); } catch { /* Vorschaubild nehmen */ }
    return loadImg(p.thumb);
  }
  const cover = (ctx, img, x, y, w, h) => {
    const f = Math.max(w / img.width, h / img.height), sw = w / f, sh = h / f;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  };
  function wrap(ctx, text, maxW) {
    const out = [];
    let line = '';
    for (const w of String(text).split(/\s+/)) {
      const tryLine = line ? line + ' ' + w : w;
      if (ctx.measureText(tryLine).width > maxW && line) { out.push(line); line = w; } else line = tryLine;
    }
    if (line) out.push(line);
    return out;
  }

  async function shareCanvas(c, name) {
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88));
    const file = new File([blob], name, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  ACTIONS['rallye-collage'] = async () => {
    const r = rallye();
    if (!r) return;
    toast('Collage wird gebaut …');
    const list = r.tasks.map((task, i) => ({ task, s: (r.shots || {})[i] })).filter(x => x.s);
    const cols = 2, W = 1080, pad = 28, cell = (W - pad * (cols + 1)) / cols, ph = cell * 0.75, capH = 70;
    const rows = Math.ceil(list.length / cols);
    const c = document.createElement('canvas');
    c.width = W; c.height = 150 + rows * (ph + capH + pad) + 40;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#6B4226'; ctx.font = '600 54px Fredoka, sans-serif'; ctx.fillText('Foto-Rallye', pad, 78);
    const trip = S.trips.find(t => t.id === r.tripId);
    ctx.fillStyle = '#7B6650'; ctx.font = '28px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText(`${personName(r.by)}${trip ? ' · ' + trip.name : ''} · ${list.length} von ${r.tasks.length}`, pad, 122);
    for (let i = 0; i < list.length; i++) {
      const x = pad + (i % cols) * (cell + pad), y = 150 + Math.floor(i / cols) * (ph + capH + pad);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 6, cell + 12, ph + capH + 6);
      try { cover(ctx, await photoSrc(list[i].s), x, y, cell, ph); } catch { /* Foto fehlt */ }
      ctx.fillStyle = '#3A2617'; ctx.font = '600 26px "Atkinson Hyperlegible", sans-serif';
      wrap(ctx, list[i].task, cell - 10).slice(0, 2).forEach((l, k) => ctx.fillText(l, x + 4, y + ph + 30 + k * 30));
    }
    await shareCanvas(c, `Foto-Rallye ${personName(r.by)}.jpg`);
  };

  app.GAME_VIEWS.tiere = animalView;
  app.GAME_VIEWS.rallye = rallyeView;

  /* ====================================================================== */
  /* Malen im Tagebuch                                                       */
  /* ====================================================================== */

  const COLORS = ['#222222', '#B3261E', '#E4572E', '#E0A21B', '#2F7A4A', '#2E7FB8', '#7B4B94', '#6B4226', '#F2A7C3', '#FFFFFF'];
  ACTIONS['draw-open'] = () => {
    const dlg = document.createElement('dialog');
    dlg.className = 'draw';
    dlg.innerHTML = `<div class="draw-top"><button type="button" class="ghost" data-d="cancel">Abbrechen</button><b>Bild malen</b><button type="button" class="primary" data-d="ok">Fertig</button></div>
      <canvas></canvas>
      <div class="draw-tools">
        <div class="draw-colors">${COLORS.map((c, i) => `<button type="button" data-c="${c}" class="${i ? '' : 'on'}" style="--c:${c}" aria-label="Farbe"></button>`).join('')}</div>
        <div class="draw-row">${[4, 10, 22].map((w, i) => `<button type="button" data-w="${w}" class="size${i === 1 ? ' on' : ''}" aria-label="Stiftgröße ${w}"><i style="width:${w}px;height:${w}px"></i></button>`).join('')}
          <button type="button" class="ghost" data-d="undo">Zurück</button><button type="button" class="ghost" data-d="clear">Neu</button></div>
      </div>`;
    document.body.appendChild(dlg);
    dlg.showModal();
    const cv = dlg.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const W = 1200, H = 900;
    cv.width = W; cv.height = H;
    const strokes = [];
    let color = COLORS[0], width = 10, cur = null;
    const paint = () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const s of strokes) {
        ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.beginPath();
        s.p.forEach(([x, y], i) => { if (i) ctx.lineTo(x, y); else { ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); } });
        ctx.stroke();
      }
    };
    paint();
    const pos = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
    cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); cur = { c: color, w: width * W / cv.getBoundingClientRect().width, p: [pos(ev)] }; strokes.push(cur); paint(); });
    cv.addEventListener('pointermove', ev => { if (!cur) return; cur.p.push(pos(ev)); paint(); });
    const end = () => { cur = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.addEventListener('cancel', ev => { ev.preventDefault(); if (!strokes.length || confirm('Bild verwerfen?')) close(); });
    dlg.addEventListener('click', async ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.c) { color = b.dataset.c; dlg.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); }
      if (b.dataset.w) { width = +b.dataset.w; dlg.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); }
      if (b.dataset.d === 'undo') { strokes.pop(); paint(); }
      if (b.dataset.d === 'clear' && strokes.length && confirm('Alles löschen und neu anfangen?')) { strokes.length = 0; paint(); }
      if (b.dataset.d === 'cancel' && (!strokes.length || confirm('Bild verwerfen?'))) close();
      if (b.dataset.d === 'ok') {
        if (!strokes.length) return close();
        app.addFormPhoto({ id: newId(), thumb: await shrink(cv, 360, 0.75), data: cv.toDataURL('image/jpeg', 0.85), drawn: true });
        close();
        toast('Bild eingefügt. Speichern nicht vergessen!');
      }
    });
  };

  /* ====================================================================== */
  /* Sprachnotizen                                                           */
  /* ====================================================================== */

  let formSounds = { keep: [], add: [], drop: [] };
  let rec = null;
  const canRecord = () => !!(navigator.mediaDevices && window.MediaRecorder);
  const secs = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const soundList = () => [...formSounds.keep, ...formSounds.add].map(s => `<li><audio controls preload="none" ${s.data ? `src="${s.data}"` : `data-snd="${s.id}"`}></audio>
    <small>${secs(s.sec || 0)}</small><button type="button" class="icon-btn small" data-action="snd-drop" data-id="${s.id}" aria-label="Sprachnotiz entfernen">${icon('close')}</button></li>`).join('');
  const refresh = () => { const l = document.getElementById('soundList'); if (l) { l.innerHTML = soundList(); resolveSounds(l); } };

  const extra = app.entryFormExtra;
  app.entryFormExtra = e => {
    formSounds = { keep: (e.sounds || []).slice(), add: [], drop: [] };
    if (rec) stopRec(true);
    setTimeout(() => refresh(), 0);
    return `${extra ? extra(e) : ''}<button type="button" class="ghost" data-action="draw-open">${icon('edit')}Bild malen</button>
      ${canRecord() ? `<button type="button" class="ghost rec-btn" data-action="snd-rec">${icon('mic')}<span>Sprachnotiz</span></button>` : ''}
      <ul class="sound-list" id="soundList"></ul>`;
  };
  const saveHook = app.entrySave;
  app.entrySave = (e, form) => {
    if (saveHook) saveHook(e, form);
    if (rec) stopRec(true);
    formSounds.drop.forEach(id => remove('photos', id));
    formSounds.add.forEach(s => save('photos', { id: s.id, entryId: e.id, tripId: e.tripId, data: s.data }));
    e.sounds = [...formSounds.keep, ...formSounds.add].map(({ id, sec }) => ({ id, sec }));
  };
  ACTIONS['snd-drop'] = el => {
    const id = el.dataset.id;
    if (formSounds.keep.some(s => s.id === id)) formSounds.drop.push(id);
    formSounds.keep = formSounds.keep.filter(s => s.id !== id);
    formSounds.add = formSounds.add.filter(s => s.id !== id);
    refresh();
  };
  function stopRec(discard) {
    if (!rec) return;
    rec.discard = discard;
    clearInterval(rec.timer);
    if (rec.mr.state !== 'inactive') rec.mr.stop();
    rec.stream.getTracks().forEach(t => t.stop());
  }
  ACTIONS['snd-rec'] = async el => {
    if (rec) return stopRec(false);
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast('Kein Zugriff aufs Mikrofon. Bitte in den Einstellungen erlauben.'); }
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined);
    const chunks = [];
    const start = Date.now();
    const me = rec = { mr, stream, discard: false };
    mr.ondataavailable = ev => ev.data.size && chunks.push(ev.data);
    mr.onstop = () => {
      rec = null;
      el.classList.remove('on');
      el.querySelector('span').textContent = 'Sprachnotiz';
      if (me.discard || !chunks.length) return;
      const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' });
      const fr = new FileReader();
      fr.onload = () => { formSounds.add.push({ id: newId(), sec: Math.round((Date.now() - start) / 1000), data: fr.result }); refresh(); };
      fr.readAsDataURL(blob);
    };
    mr.start();
    el.classList.add('on');
    // Höchstens zwei Minuten pro Notiz
    me.timer = setInterval(() => {
      const s = (Date.now() - start) / 1000;
      el.querySelector('span').textContent = `Stopp ${secs(s)}`;
      if (s >= 120) stopRec(false);
    }, 250);
  };

  // Gespeicherte Sprachnotizen: Adresse erst beim Zeigen holen (noch nicht hochgeladen = lokal)
  async function resolveSounds(root) {
    for (const a of root.querySelectorAll('audio[data-snd]')) {
      try { const d = await app.store().get('photos', a.dataset.snd); if (d && d.data) a.src = d.data; } catch { /* offline und nicht hier */ }
      a.removeAttribute('data-snd');
    }
  }
  const entryExtra = app.entryExtra;
  app.entryExtra = e => {
    const html = entryExtra ? entryExtra(e) : '';
    if (!(e.sounds || []).length) return html;
    setTimeout(() => { const box = document.getElementById('snd-' + e.id); if (box) resolveSounds(box); }, 0);
    return `${html}<div class="sounds" id="snd-${e.id}"><h3 class="date-head">${icon('mic')}Sprachnotizen</h3>
      <ul class="sound-list">${e.sounds.map(s => `<li><audio controls preload="none" data-snd="${s.id}"></audio><small>${secs(s.sec || 0)}</small></li>`).join('')}</ul></div>`;
  };
}
