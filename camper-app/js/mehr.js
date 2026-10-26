// Stufe 2: Mehr-Menü, Reiseplanung, Orte, Tankbuch, Checklisten, Fahrzeug, Statistik, GPX-Strecken.
// app.js reicht seine Hilfsfunktionen herein; hier werden nur Ansichten, Aktionen und Formulare ergänzt.

export default function installMore(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, CHANGES, mapHooks,
    esc, money, num, icon, art, pageHead, newId, save, remove, toast, render, go, openSheet, closeSheet,
    today, fmtDay, fmtShort, km, fmtKm, hasPos, navUrl, byDate, sortTrips,
    getPos, locateInto, openPicker, setFormPos, posLabel,
    currentTrip, tripColor, tripStats, tripEntries, me, personName, canCash, defaultSplit,
    openEntryForm, itemListId, extrasOf, isPacked, FEATURES, TYPES,
  } = app;

  const sheetHead = app.sheetHead;
  const daysUntil = d => Math.round((new Date(d + 'T12:00') - new Date(today() + 'T12:00')) / 864e5);
  const dec = (v, n = 1) => (v == null || !isFinite(v) ? '–' : v.toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n }));
  const inputNum = v => (v || v === 0 ? String(v).replace('.', ',') : '');
  const regionName = cc => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } };
  const stars = n => (n ? '★'.repeat(n) : '');

  /* ---------- Mehr ---------- */

  const TILES = [
    { route: 'kasse', art: 'kasse', title: 'Kasse', text: 'Ausgaben und Abrechnung', cash: true },
    { route: 'tank', art: 'tank', title: 'Tankbuch', text: 'Tanken und Verbrauch', cash: true },
    { route: 'orte', art: 'orte', title: 'Orte', text: 'Lieblingsplätze und Wunschliste' },
    { route: 'checklisten', art: 'check', title: 'Checklisten', text: 'Abfahrt und Ankunft' },
    { route: 'fahrzeug', art: 'fahrzeug', title: 'Fahrzeug', text: 'Steckbrief und Fristen' },
    { route: 'zuladung', art: 'zuladung', title: 'Zuladung', text: 'Wie viel darf noch rein?' },
    { route: 'wasserwaage', art: 'wasserwaage', title: 'Wasserwaage', text: 'Camper gerade stellen' },
    { route: 'abstimmung', art: 'abstimmung', title: 'Abstimmung', text: 'Die Familie entscheidet' },
    { route: 'urlaubsgeld', art: 'urlaubsgeld', title: 'Urlaubsgeld', text: 'Taschengeld der Kinder' },
    { route: 'statistik', art: 'statistik', title: 'Statistik', text: 'Eure Reisen in Zahlen' },
    { route: 'wetter', art: 'wetter', title: 'Wetter', text: 'Vorhersage für Standort und Ziele' },
    { route: 'rubbelkarte', art: 'rubbelkarte', title: 'Rubbelkarte', text: 'Wo wart ihr schon überall?' },
    { route: 'laender', art: 'laender', title: 'Länderinfos', text: 'Maut, Tempo, Pflichtausstattung' },
    { route: 'dokumente', art: 'dokumente', title: 'Dokumente & Notfall', text: 'Ausweise, Kontakte, Notruf', alt: 'Notfall' },
    { route: 'album', art: 'album', title: 'Fotoalbum', text: 'Galerie und Jahresrückblick' },
    { route: 'kochen', art: 'kochen', title: 'Kochen', text: 'Rezepte und Einkaufsliste' },
    { route: 'autarkie', art: 'autarkie', title: 'Autarkie', text: 'Wasser, Gas und Strom' },
    { route: 'dienste', art: 'dienste', title: 'Camper-Dienste', text: 'Wer ist heute dran?' },
    { route: 'spiele', art: 'spiele', title: 'Spiele & Co', text: 'Kennzeichen, Bingo, Quiz' },
    { route: 'ideen', art: 'ideen', title: 'Reiseideen', text: 'Wohin als Nächstes?' },
    { route: 'reiseblog', art: 'reiseblog', title: 'Reiseblog', text: 'Zum Mitlesen für Oma und Opa', admin: true },
    { route: 'reisen', art: 'reisen', title: 'Reisen', text: 'Alle Reisen und Archiv' },
    { route: 'einstellungen', art: 'einstellungen', title: 'Einstellungen', text: 'Crew, Abgleich, Darstellung' },
  ];

  app.TILES = TILES;
  const available = () => TILES.filter(t => (!t.cash || canCash()) && (!t.admin || app.session().user.isAdmin) && (!app.allowed || app.allowed(t.route)));
  const label = t => (t.alt && !(app.session().user.isAdmin) ? t.alt : t.title);

  // Kacheln über die gemeinsame Tafel (kacheln.js): Reihenfolge, Trennlinien, Ausblenden, Größe
  VIEWS.mehr = () => {
    const due = dueCount();
    const badge = t => (t.route === 'fahrzeug' && due.n ? `<span class="badge${due.over ? '' : ' soon'}" title="Fristen fällig">${due.n}</span>`
      : t.route === 'ideen' && app.ideaCount && app.ideaCount() ? `<span class="badge info" title="Offene Ideen">${app.ideaCount()}</span>`
        : t.route === 'dokumente' && app.docsDue() ? `<span class="badge soon" title="Dokumente laufen ab">${app.docsDue()}</span>` : '');
    const items = available().map(t => ({ id: t.route, art: t.art, title: label(t), text: t.text, href: `#/${t.route}`, badge: badge(t), fixed: t.route === 'einstellungen' }));
    const editing = ui.boardEdit === 'mehr';
    return `${pageHead('mehr', 'Mehr', editing ? 'Reihenfolge und Auswahl festlegen' : '')}${app.board.view({ key: 'mehr', items })}`;
  };

  /* ---------- Orte: Wunschliste, Lieblingsplätze, für Reisen vorgemerkt ---------- */

  const PLACE_KINDS = { stellplatz: 'Stellplatz', poi: 'Sehenswert' };
  const kindIcon = k => icon(k === 'stellplatz' ? 'stellplatz' : 'sight');
  const tripPlaces = t => S.places.filter(p => p.tripId === t.id)
    .sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9') || (a.createdAt || 0) - (b.createdAt || 0));
  const tripOf = p => p.tripId && S.trips.find(t => t.id === p.tripId);

  function placeRow(p) {
    const trip = tripOf(p);
    const meta = [PLACE_KINDS[p.kind], p.place, stars(p.rating), p.again, trip ? `für ${trip.name}` : '', p.done ? 'besucht' : ''].filter(Boolean);
    return `<li class="place-row">
      <span class="node-mini" style="--c:${trip ? tripColor(trip) : 'var(--wood)'}">${kindIcon(p.kind)}</span>
      <button class="as-text body" data-action="place-form" data-id="${p.id}">
        <strong>${esc(p.name)}</strong><small>${esc(meta.join(', '))}</small>
      </button>
      ${hasPos(p) ? `<button class="icon-btn small" data-action="place-on-map" data-id="${p.id}" aria-label="Auf der Karte">${icon('pin')}</button>` : ''}
    </li>`;
  }

  VIEWS.orte = () => {
    const tab = ui.placesTab || (ui.placesTab = LS.get('placesTab', 'wunsch'));
    const groups = {
      wunsch: S.places.filter(p => !p.tripId && !p.fav),
      favorit: S.places.filter(p => p.fav),
      reisen: S.places.filter(p => p.tripId && !p.fav),
    };
    const sorted = groups[tab].slice().sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));
    let body;
    if (tab === 'reisen') {
      const byTrip = sortTrips(S.trips).map(t => ({ t, ps: tripPlaces(t).filter(p => !p.fav) })).filter(x => x.ps.length);
      body = byTrip.map(({ t, ps }) => `<h3 class="date-head"><i class="trip-dot" style="--c:${tripColor(t)}"></i>${esc(t.name)}</h3>
        <ul class="places">${ps.map(placeRow).join('')}</ul>`).join('');
    } else {
      body = sorted.length ? `<ul class="places">${sorted.map(placeRow).join('')}</ul>` : '';
    }
    const empty = {
      wunsch: 'Hier sammelt ihr Stellplätze und Ziele, die ihr irgendwann besuchen wollt. Für eine Reise vormerken könnt ihr sie später in der Planung.',
      favorit: 'Plätze, an die ihr gern zurückkehrt. Aus jedem Tagebuch-Eintrag lässt sich mit „Als Lieblingsplatz merken“ einer machen.',
      reisen: 'Noch nichts für eine Reise vorgemerkt. Das geht in der Planung im Tagebuch.',
    }[tab];
    return `${pageHead('orte', 'Orte', 'Lieblingsplätze, Wunschliste und Geplantes')}
      <div class="seg tabs">
        ${[['wunsch', 'Wunschliste'], ['favorit', 'Lieblingsplätze'], ['reisen', 'Geplant']].map(([k, l]) =>
          `<button class="${tab === k ? 'on' : ''}" data-action="places-tab" data-tab="${k}">${l} <small>${groups[k].length}</small></button>`).join('')}
      </div>
      ${body || `<p class="hint">${empty}</p>`}
      <div class="toolbar end">
        ${tab !== 'reisen' ? `<button class="primary" data-action="place-form" ${tab === 'favorit' ? 'data-fav="1"' : ''}>${icon('plus')}Ort</button>` : ''}
      </div>`;
  };

  function placeForm(id, preset = {}) {
    const p = S.places.find(x => x.id === id) || { kind: 'stellplatz', ...preset };
    const trips = sortTrips(S.trips.filter(t => !t.archived || t.id === p.tripId));
    const kinds = Object.entries(PLACE_KINDS).map(([k, l]) =>
      `<label><input type="radio" name="kind" value="${k}" data-action="place-kind"${p.kind === k ? ' checked' : ''}><span>${kindIcon(k)}${l}</span></label>`).join('');
    const feats = FEATURES.map(f =>
      `<label class="chip"><input type="checkbox" name="feat" value="${f}"${(p.features || []).includes(f) ? ' checked' : ''}><span>${f}</span></label>`).join('');
    const starBtns = [1, 2, 3, 4, 5].map(n =>
      `<button type="button" class="star${(p.rating || 0) >= n ? ' on' : ''}" data-action="rate" data-v="${n}" aria-label="${n} von 5">★</button>`).join('');
    openSheet(`<form data-form="place" data-id="${p.id || ''}" data-type="${p.kind}">
      ${sheetHead(p.id ? 'Ort' : 'Neuer Ort')}
      <div class="seg types">${kinds}</div>
      <label class="field"><span>Name</span><input name="name" value="${esc(p.name)}" required placeholder="z. B. Agricamping am See"></label>
      <div class="field">
        <span>Position</span>
        <div class="adder"><input name="q" placeholder="Ort oder Adresse suchen" autocomplete="off" enterkeyhint="search">
          <button type="button" class="ghost" data-action="place-search" aria-label="Suchen">${icon('search')}</button></div>
        <ul class="search-results" id="searchResults"></ul>
        <input type="hidden" name="lat" value="${p.lat ?? ''}"><input type="hidden" name="lng" value="${p.lng ?? ''}">
        <input type="hidden" name="acc" value=""><input type="hidden" name="country" value="${esc(p.country)}">
        <p class="pos" id="posText">${hasPos(p) ? posLabel(p) : 'Noch keine Position'}</p>
        <div class="btnrow">
          <button type="button" class="ghost" data-action="pos-here">${icon('pin')}Aktuelle Position</button>
          <button type="button" class="ghost" data-action="pos-pick">Auf Karte wählen</button>
        </div>
        <div id="pickMap" class="pick-map" hidden></div>
      </div>
      <label class="field"><span>Ort</span><input name="place" value="${esc(p.place)}" placeholder="Ortsname"></label>
      <div class="row2">
        <label class="field"><span>Für Reise vormerken</span><select name="tripId"><option value="">Keine (Wunschliste)</option>
          ${trips.map(t => `<option value="${t.id}"${t.id === p.tripId ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Geplant am</span><input type="date" name="planDate" value="${p.planDate || ''}"></label>
      </div>
      <label class="field"><span>Notiz</span><textarea name="note" rows="3" placeholder="Preis, Öffnungszeiten, Tipps …">${esc(p.note)}</textarea></label>
      <label class="field"><span>Link</span><input name="url" type="url" value="${esc(p.url)}" placeholder="z. B. Seite des Stellplatzes"></label>
      <div class="field"><span>Bewertung</span><input type="hidden" name="rating" value="${p.rating || 0}"><div class="stars">${starBtns}</div></div>
      <div class="field only-stellplatz"><span>Ausstattung</span><div class="chips wrap">${feats}</div></div>
      <label class="check"><input type="checkbox" name="fav"${p.fav ? ' checked' : ''}><span>Lieblingsplatz</span></label>
      ${p.tripId ? `<label class="check"><input type="checkbox" name="done"${p.done ? ' checked' : ''}><span>Schon besucht</span></label>` : ''}
      <div class="sheet-foot">
        ${p.id ? `<button type="button" class="ghost danger" data-action="del-place" data-id="${p.id}">Löschen</button>` : ''}
        ${hasPos(p) ? `<a class="ghost btn" href="${navUrl(p)}" target="_blank" rel="noopener">Hinfahren</a>` : ''}
        ${p.url ? `<a class="ghost btn" href="${esc(p.url)}" target="_blank" rel="noopener">Link öffnen</a>` : ''}
        <button class="primary">Speichern</button>
      </div>
    </form>`);
  }

  async function placeSearch(form) {
    const q = form.q.value.trim();
    const box = document.getElementById('searchResults');
    if (!q) return;
    box.innerHTML = '<li class="sub">Wird gesucht …</li>';
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=de&q=${encodeURIComponent(q)}`);
      const res = await r.json();
      box.innerHTML = res.length ? res.map(x => `<li><button type="button" class="as-text" data-action="place-result"
          data-lat="${x.lat}" data-lng="${x.lon}" data-name="${esc(x.name || x.display_name.split(',')[0])}"
          data-place="${esc((x.address && (x.address.village || x.address.town || x.address.city || x.address.municipality)) || '')}"
          data-cc="${esc(((x.address && x.address.country_code) || '').toUpperCase())}">${esc(x.display_name)}</button></li>`).join('')
        : '<li class="sub">Nichts gefunden. Anders schreiben oder auf der Karte wählen.</li>';
    } catch {
      box.innerHTML = '<li class="sub">Suche geht nur mit Internet. Ohne Netz: auf der Karte wählen.</li>';
    }
  }

  ACTIONS['places-tab'] = el => { ui.placesTab = el.dataset.tab; LS.set('placesTab', ui.placesTab); render(); };
  ACTIONS['place-form'] = el => placeForm(el.dataset.id, {
    tripId: el.dataset.trip || null, kind: el.dataset.kind || 'stellplatz', fav: !!el.dataset.fav,
  });
  ACTIONS['place-search'] = el => placeSearch(el.form);
  ACTIONS['place-result'] = el => {
    const form = el.closest('form');
    const { lat, lng, name, place, cc } = el.dataset;
    setFormPos(form, { lat: +lat, lng: +lng }, false);
    if (!form.name.value) form.name.value = name;
    if (!form.place.value) form.place.value = place;
    form.country.value = cc;
    document.getElementById('searchResults').innerHTML = '';
  };
  CHANGES['place-kind'] = el => { el.form.dataset.type = el.value; };
  ACTIONS['place-on-map'] = el => {
    const p = S.places.find(x => x.id === el.dataset.id);
    ui.showPlaces = true;
    app.setPendingFocus({ lat: p.lat, lng: p.lng });
    go('karte');
  };
  ACTIONS['del-place'] = el => {
    if (!confirm('Diesen Ort löschen?')) return;
    remove('places', el.dataset.id);
    closeSheet();
  };
  // Suchfeld: Enter sucht, statt das Formular abzuschicken
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target.name === 'q' && ev.target.form && ev.target.form.dataset.form === 'place') {
      ev.preventDefault();
      placeSearch(ev.target.form);
    }
  });

  FORMS.place = form => {
    const fd = new FormData(form);
    const old = S.places.find(p => p.id === form.dataset.id);
    const lat = parseFloat(fd.get('lat')), lng = parseFloat(fd.get('lng'));
    const kind = fd.get('kind');
    save('places', {
      ...(old || { id: newId(), createdAt: Date.now(), by: me() }),
      kind, name: fd.get('name').trim(), place: fd.get('place').trim(), note: fd.get('note').trim(), url: fd.get('url').trim(),
      lat: isFinite(lat) ? lat : null, lng: isFinite(lng) ? lng : null, country: fd.get('country') || '',
      tripId: fd.get('tripId') || null, planDate: fd.get('planDate') || '',
      rating: +fd.get('rating') || 0, features: kind === 'stellplatz' ? fd.getAll('feat') : [],
      fav: !!fd.get('fav'), done: !!fd.get('done'),
    });
    closeSheet();
    toast(old ? 'Gespeichert' : 'Ort gemerkt');
  };

  ACTIONS['entry-to-place'] = el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (S.places.some(p => p.entryId === e.id)) return toast('Ist schon als Lieblingsplatz gemerkt.');
    save('places', {
      id: newId(), createdAt: Date.now(), by: me(), entryId: e.id, fav: true,
      kind: e.type === 'stellplatz' ? 'stellplatz' : 'poi', name: e.title || e.place || TYPES[e.type].label,
      place: e.place || '', lat: e.lat, lng: e.lng, country: e.country || '', rating: e.rating || 0,
      features: e.features || [], note: (e.text || '').slice(0, 300), tripId: null, planDate: '',
      again: (e.extra || {}).again || '', extra: e.extra || {},
    });
    toast('Als Lieblingsplatz gemerkt');
  };

  /* ---------- Reiseplanung (im Tagebuch) ---------- */

  VIEWS.planung = t => {
    const stops = tripPlaces(t);
    const lists = S.lists.filter(l => l.tripId === t.id);
    const stock = S.items.filter(i => !i.tripId);
    const extras = extrasOf(t);
    const all = [...stock, ...extras];
    const packed = all.filter(i => isPacked(t, i)).length;
    // Zwischen zwei geplanten Orten: Kilometer und Fahrzeit (unterwegs.js)
    const leg = i => (i > 0 && app.legHtml ? app.legHtml(stops[i - 1], stops[i]) : '');
    const rows = stops.map((p, i) => `${leg(i)}<li class="plan-stop${p.done ? ' done' : ''}">
        <span class="node${p.kind === 'stellplatz' ? ' filled' : ''}">${kindIcon(p.kind)}</span>
        <button class="body as-text" data-action="place-form" data-id="${p.id}">
          <span class="time">${p.planDate ? fmtDay(p.planDate) : 'Noch ohne Datum'}, ${PLACE_KINDS[p.kind]}</span>
          <strong>${esc(p.name)}</strong>
          ${p.place || p.note ? `<span class="meta">${esc([p.place, p.note].filter(Boolean).join(', '))}</span>` : ''}
        </button>
        ${p.done ? '<span class="done-tag">besucht</span>' : `<button class="ghost small-btn" data-action="place-arrive" data-id="${p.id}">Hier sind wir</button>`}
      </li>`).join('');
    const openOf = l => S.listItems.filter(i => itemListId(i) === l.id && !i.done).length;
    return `
      <section class="plan-block">
        <h2>Stellplätze und Sehenswertes</h2>
        ${rows ? `<ol class="plan-list">${rows}</ol>` : '<p class="hint">Noch nichts vorgemerkt. Was ihr hier eintragt, erscheint auch auf der Karte als geplante Route.</p>'}
        <div class="btnrow">
          <button class="primary" data-action="place-form" data-trip="${t.id}" data-kind="stellplatz">${icon('plus')}Stellplatz</button>
          <button class="ghost" data-action="place-form" data-trip="${t.id}" data-kind="poi">${icon('plus')}Sehenswertes</button>
          ${S.places.some(p => !p.tripId) ? `<button class="ghost" data-action="plan-from-wish" data-trip="${t.id}">Aus Wunschliste</button>` : ''}
        </div>
      </section>
      <section class="plan-block">
        <h2>Listen für diese Reise</h2>
        ${lists.length ? `<ul class="plan-links">${lists.map(l => `<li><button class="as-text" data-action="open-list" data-id="${l.id}" data-kind="${l.kind}">
            <b>${esc(l.name)}</b><small>${l.kind === 'einkauf' ? 'Einkaufsliste' : 'Merkliste'}, ${openOf(l) ? openOf(l) + ' offen' : 'alles erledigt'}</small></button></li>`).join('')}</ul>`
          : '<p class="hint">Zum Beispiel „Vorbereitung“ für Buchungen und Erledigungen oder eine Einkaufsliste für vor der Abfahrt.</p>'}
        <div class="btnrow">
          <button class="ghost" data-action="list-form" data-kind="merken" data-trip="${t.id}">${icon('plus')}Merkliste</button>
          <button class="ghost" data-action="list-form" data-kind="einkauf" data-trip="${t.id}">${icon('plus')}Einkaufsliste</button>
        </div>
      </section>
      <section class="plan-block">
        <h2>Packen</h2>
        ${all.length ? `<p>${packed} von ${all.length} eingepackt</p><div class="progress" style="--p:${packed / all.length}"><span></span></div>` : ''}
        <p class="sub">Extra für diese Reise: ${extras.length ? extras.map(i => esc(i.name)).join(', ') : 'noch nichts'}</p>
        <div class="btnrow">
          <button class="ghost" data-action="item-form" data-trip="${t.id}">${icon('plus')}Extra für diese Reise</button>
          <a class="ghost btn" href="#/packen">Zur Packliste</a>
        </div>
      </section>`;
  };

  ACTIONS['open-list'] = el => {
    ui.listTab = el.dataset.kind;
    LS.set('listTab', ui.listTab);
    LS.set('list.' + el.dataset.kind, el.dataset.id);
    go('listen');
  };

  ACTIONS['plan-from-wish'] = el => {
    const t = S.trips.find(x => x.id === el.dataset.trip);
    const pool = S.places.filter(p => !p.tripId).sort((a, b) => a.name.localeCompare(b.name));
    openSheet(`<div>${sheetHead(`Für „${esc(t.name)}“ vormerken`)}
      <p class="sub">Lieblingsplätze bleiben in der Liste und werden für die Reise kopiert, Einträge der Wunschliste wandern in die Planung.</p>
      <ul class="places">${pool.map(p => `<li class="place-row">
        <span class="node-mini" style="--c:var(--wood)">${kindIcon(p.kind)}</span>
        <span class="body"><strong>${esc(p.name)}</strong><small>${esc([p.fav ? 'Lieblingsplatz' : 'Wunschliste', p.place].filter(Boolean).join(', '))}</small></span>
        <button class="ghost small-btn" data-action="plan-take" data-id="${p.id}" data-trip="${t.id}">Vormerken</button>
      </li>`).join('')}</ul></div>`);
  };
  ACTIONS['plan-take'] = el => {
    const p = S.places.find(x => x.id === el.dataset.id);
    if (p.fav) save('places', { ...p, id: newId(), fav: false, tripId: el.dataset.trip, fromId: p.id, done: false, createdAt: Date.now() });
    else save('places', { ...p, tripId: el.dataset.trip });
    el.closest('li').remove();
    toast(`„${p.name}“ vorgemerkt`);
  };

  // Geplanter Ort erreicht: daraus wird ein Tagebuch-Eintrag, der Ort gilt als besucht
  ACTIONS['place-arrive'] = el => {
    const p = S.places.find(x => x.id === el.dataset.id);
    openEntryForm({
      type: p.kind === 'stellplatz' ? 'stellplatz' : 'sight', title: p.name, place: p.place,
      lat: p.lat, lng: p.lng, country: p.country, rating: p.rating, features: p.features, text: p.note,
    });
    const form = document.querySelector('form[data-form=entry]');
    if (form) form.dataset.arrive = p.id;
  };
  const saveEntry = FORMS.entry;
  FORMS.entry = form => {
    const arrive = form.dataset.arrive;
    const fuel = readFuel(form);
    const hike = pendingHike && pendingHike.form === form && form.dataset.type === 'wanderung' ? pendingHike : null;
    pendingHike = null;
    const e = saveEntry(form);
    const p = arrive && S.places.find(x => x.id === arrive);
    if (p) save('places', { ...p, done: true, doneAt: Date.now() });
    if (e && fuel) saveFuelFromEntry(e, fuel);
    // GPX einer Wanderung/Radtour: eigene Strecke, zählt nicht als gefahrene Kilometer
    if (e && hike) {
      S.tracks.filter(t => t.entryId === e.id).forEach(t => remove('tracks', t.id));
      save('tracks', { id: newId(), kind: 'hike', entryId: e.id, tripId: e.tripId, name: e.title || hike.name, km: hike.km, pts: encodePts(hike.pts), createdAt: Date.now(), ...(hike.profile || {}) });
    }
    return e;
  };

  let pendingHike = null;
  CHANGES['hike-gpx'] = async el => {
    const f = el.files[0];
    el.value = '';
    if (!f) return;
    try {
      const g = parseGpx(await f.text());
      const form = el.closest('form');
      pendingHike = { form, ...g };
      document.getElementById('hikeInfo').textContent = `Strecke „${g.name || f.name}“ übernommen: ${fmtKm(g.km)}${g.profile ? `, ↑ ${g.profile.up} m, höchster Punkt ${g.profile.maxEle} m` : ''}`;
      const kmField = form.querySelector('[name=x_wanderung_km]');
      if (kmField && !kmField.value) kmField.value = String(g.km).replace('.', ',');
      const upField = form.querySelector('[name=x_wanderung_up]');
      if (upField && !upField.value && g.profile) upField.value = String(g.profile.up);
    } catch (err) { toast(err.message); }
  };

  // Tankstelle im Tagebuch: Liter und Betrag landen im Tankbuch (und in der Kasse der Reise)
  function readFuel(form) {
    if (!form.fuelLiters || form.dataset.type !== 'tank') return null;
    const liters = num(form.fuelLiters.value), amount = num(form.fuelAmount.value);
    if (liters <= 0 || amount <= 0) return null;
    return { liters, amount, odo: parseInt(form.fuelOdo.value.replace(/\D/g, '')) || 0, full: form.fuelFull.checked };
  }
  function saveFuelFromEntry(e, f) {
    const old = S.fuel.find(x => x.entryId === e.id);
    const doc = save('fuel', {
      ...(old || { id: newId(), by: me(), tripId: e.tripId, entryId: e.id }),
      ...f, date: e.date.slice(0, 10), place: e.place || e.title || '', lat: e.lat, lng: e.lng,
    });
    const linked = S.expenses.find(x => x.fuelId === doc.id);
    save('expenses', {
      ...(linked || { id: newId(), tripId: e.tripId, paidBy: me(), split: defaultSplit(), fuelId: doc.id }),
      amount: f.amount, date: doc.date, cat: 'Sprit', note: 'Tanken' + (doc.place ? ' ' + doc.place : ''),
    });
  }

  // Karte: gemerkte und geplante Orte
  const placeIcon = (p, color) => window.L.divIcon({
    className: '',
    html: `<div class="pin pin-place${p.tripId ? ' planned' : ''}${p.fav ? ' fav' : ''}${p.done ? ' done' : ''}" style="--c:${color}">${p.fav ? '♥' : kindIcon(p.kind)}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
  });
  mapHooks.push((layer, scope, t) => {
    if (!ui.showPlaces || ui.mapPins === 'keine') return [];
    const L = window.L;
    const planned = t && scope === 'trip' ? tripPlaces(t).filter(hasPos) : [];
    if (planned.length > 1) {
      L.polyline(planned.map(p => [p.lat, p.lng]), { color: tripColor(t), weight: 3, opacity: 0.8, dashArray: '1 10', lineCap: 'round' }).addTo(layer);
    }
    const shown = scope === 'all' ? S.places : S.places.filter(p => !p.tripId || (t && p.tripId === t.id));
    shown.filter(hasPos).forEach(p => {
      const trip = tripOf(p);
      L.marker([p.lat, p.lng], { icon: placeIcon(p, trip ? tripColor(trip) : '#6B4226'), zIndexOffset: -100 })
        .bindPopup(`<div class="popup"><strong>${esc(p.name)}</strong>
          <span>${esc([p.fav ? 'Lieblingsplatz' : trip ? 'Geplant für ' + trip.name : 'Wunschliste', p.planDate ? fmtDay(p.planDate) : ''].filter(Boolean).join(', '))}</span>
          <button class="link" data-action="place-form" data-id="${p.id}">Ort öffnen</button></div>`)
        .addTo(layer);
    });
    return planned.map(p => [p.lat, p.lng]);
  });

  /* ---------- GPX-Strecken ---------- */

  const encodePts = pts => pts.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join(';');
  const decodePts = s => (s ? s.split(';').map(p => p.split(',').map(Number)) : []);
  app.encodePts = encodePts;
  app.decodePts = decodePts;

  // Douglas-Peucker in Metern (lokal flach gerechnet)
  function simplify(pts, tol) {
    if (pts.length < 3) return pts;
    const lat0 = pts[0][0] * Math.PI / 180;
    const xy = pts.map(([la, lo]) => [lo * 111320 * Math.cos(lat0), la * 110540]);
    const keep = new Uint8Array(pts.length);
    keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      let max = 0, idx = -1;
      const [x1, y1] = xy[a], [x2, y2] = xy[b];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs(dy * xy[i][0] - dx * xy[i][1] + x2 * y1 - y2 * x1) / len;
        if (d > max) { max = d; idx = i; }
      }
      if (max > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  // Auf höchstens max Punkte vereinfachen (zum Bearbeiten importierter Strecken)
  app.simplifyTo = (pts, max) => {
    let tol = 10, out = simplify(pts, tol);
    while (out.length > max) out = simplify(pts, tol *= 1.6);
    return out;
  };

  function parseGpx(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Die Datei ist keine gültige GPX-Datei.');
    let nodes = [...doc.getElementsByTagName('trkpt')];
    if (!nodes.length) nodes = [...doc.getElementsByTagName('rtept')];
    const all = nodes.map(n => { const e = n.getElementsByTagName('ele')[0]; return [parseFloat(n.getAttribute('lat')), parseFloat(n.getAttribute('lon')), e ? parseFloat(e.textContent) : NaN]; })
      .filter(p => isFinite(p[0]) && isFinite(p[1]));
    const pts = all.map(p => [p[0], p[1]]);
    // Höhen aus der GPX-Datei (für das Höhenprofil), nur wenn die meisten Punkte eine haben
    const ele = all.filter(p => isFinite(p[2])).length > all.length / 2 ? all.map(p => p[2]) : null;
    if (pts.length < 2) throw new Error('In der Datei ist keine Strecke enthalten.');
    const nameEl = doc.querySelector('trk > name') || doc.querySelector('rte > name') || doc.querySelector('metadata > name');
    let dist = 0;
    for (let i = 1; i < pts.length; i++) dist += km({ lat: pts[i - 1][0], lng: pts[i - 1][1] }, { lat: pts[i][0], lng: pts[i][1] });
    let tol = 8, small = simplify(pts, tol);
    while (small.length > 2500) small = simplify(pts, tol *= 2);
    return { name: nameEl ? nameEl.textContent.trim() : '', pts: small, km: Math.round(dist * 10) / 10, profile: ele && app.makeProfile ? app.makeProfile(pts, ele) : null };
  }

  VIEWS.trackList = t => {
    const tracks = S.tracks.filter(x => x.tripId === t.id);
    return `${tracks.length
      ? `<ul class="track-list">${tracks.map(x => `<li><span>${esc(x.name)}, ${fmtKm(x.km)}</span>
          <button type="button" class="icon-btn small" data-action="del-track" data-id="${x.id}" aria-label="Strecke löschen">${icon('close')}</button></li>`).join('')}</ul>`
      : '<p class="sub">Noch keine Strecke. Aufzeichnen z. B. mit OsmAnd, Komoot oder Wikiloc und als GPX-Datei exportieren.</p>'}
      <label class="ghost file">GPX-Datei importieren<input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" multiple data-action="gpx-import" data-trip="${t.id}"></label>`;
  };

  CHANGES['gpx-import'] = async el => {
    const tripId = el.dataset.trip;
    const files = [...el.files];
    el.value = '';
    for (const f of files) {
      try {
        const g = parseGpx(await f.text());
        save('tracks', { id: newId(), tripId, name: g.name || f.name.replace(/\.gpx$/i, ''), km: g.km, pts: encodePts(g.pts), createdAt: Date.now() });
        toast(`Strecke „${g.name || f.name}“ importiert: ${fmtKm(g.km)}`);
      } catch (e) {
        toast(e.message);
      }
    }
    closeSheet();
  };
  ACTIONS['del-track'] = el => {
    if (!confirm('Diese Strecke löschen?')) return;
    remove('tracks', el.dataset.id);
    el.closest('li').remove();
  };

  mapHooks.push((layer, scope, t) => {
    const L = window.L;
    const list = scope === 'all' ? S.tracks : S.tracks.filter(x => t && x.tripId === t.id);
    const ends = [];
    list.forEach(x => {
      if (x.id === app.editingTrackId) return;   // wird gerade im Editor gezeichnet
      const pts = decodePts(x.pts);
      if (pts.length < 2) return;
      const color = tripColor(S.trips.find(y => y.id === x.tripId));
      if (x.kind === 'hike') {
        // Wanderungen und Radtouren: grün gestrichelt
        L.polyline(pts, { color: '#3E7B32', weight: 3, dashArray: '6 6' }).bindPopup(`<div class="popup"><strong>${esc(x.name)}</strong><span>Tour, ${fmtKm(x.km)}</span></div>`).addTo(layer);
        return;
      }
      L.polyline(pts, { color: '#fff', weight: 7, opacity: 0.85 }).addTo(layer);
      L.polyline(pts, { color, weight: 4 }).bindPopup(`<div class="popup"><strong>${esc(x.name)}</strong><span>${fmtKm(x.km)}</span></div>`).addTo(layer);
      ends.push(pts[0], pts[pts.length - 1], pts[Math.floor(pts.length / 2)]);
    });
    return ends;
  });

  /* ---------- Tankbuch ---------- */

  // Verbrauch von Vollbetankung zu Vollbetankung
  function consumption() {
    const asc = S.fuel.filter(f => f.odo > 0).sort((a, b) => a.odo - b.odo);
    const per = {};
    let last = null, liters = 0, totL = 0, totKm = 0;
    for (const f of asc) {
      if (last) liters += f.liters || 0;
      if (f.full) {
        if (last && f.odo > last.odo) {
          per[f.id] = liters / (f.odo - last.odo) * 100;
          totL += liters;
          totKm += f.odo - last.odo;
        }
        last = f;
        liters = 0;
      }
    }
    return { per, avg: totKm ? totL / totKm * 100 : null };
  }
  app.fuelAverage = () => consumption().avg;

  VIEWS.tank = () => {
    const list = S.fuel.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.odo || 0) - (a.odo || 0));
    const { per, avg } = consumption();
    const liters = S.fuel.reduce((s, f) => s + (f.liters || 0), 0);
    const amount = S.fuel.reduce((s, f) => s + (f.amount || 0), 0);
    const perLiter = liters ? amount / liters : null;
    const odos = S.fuel.map(f => f.odo).filter(Boolean);
    const driven = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0;
    return `${pageHead('tank', 'Tankbuch')}
      ${list.length ? `<section class="ledger-sum">
        <p class="total">${avg ? dec(avg) + ' l' : '–'}<span class="unit"> pro 100 km</span></p>
        <p class="sub">${avg ? 'Durchschnitt von Vollbetankung zu Vollbetankung' : 'Der Verbrauch erscheint ab der zweiten Vollbetankung mit Kilometerstand.'}</p>
        <dl class="facts-list">
          <div><dt>Getankt</dt><dd>${dec(liters)} l für ${money(amount)}</dd></div>
          ${perLiter ? `<div><dt>Preis im Schnitt</dt><dd>${dec(perLiter, 3)} € pro Liter</dd></div>` : ''}
          ${avg && perLiter ? `<div><dt>Spritkosten</dt><dd>${money(avg * perLiter)} pro 100 km</dd></div>` : ''}
          ${driven ? `<div><dt>Gefahren laut Tacho</dt><dd>${driven.toLocaleString('de-DE')} km</dd></div>` : ''}
        </dl>
      </section>` : ''}
      <div class="toolbar"><h2>Tankstopps</h2><button class="primary" data-action="fuel-form">${icon('plus')}Tanken</button></div>
      ${list.length ? `<ul class="ledger">${list.map(f => `<li><button data-action="fuel-form" data-id="${f.id}">
          <span class="txt"><b>${fmtDay(f.date)}${f.place ? ', ' + esc(f.place) : ''}</b>
            <small>${dec(f.liters, 2)} l${f.liters && f.amount ? `, ${dec(f.amount / f.liters, 3)} €/l` : ''}${f.odo ? `, ${f.odo.toLocaleString('de-DE')} km` : ''}${f.full ? '' : ', nicht voll'}${per[f.id] ? `, ${dec(per[f.id])} l/100 km` : ''}</small></span>
          <span class="amt">${money(f.amount)}</span>
        </button></li>`).join('')}</ul>`
        : '<p class="hint">Tragt bei jedem Tanken Liter, Betrag und Kilometerstand ein. Daraus rechnet das Tankbuch euren Verbrauch aus, auf Wunsch landet der Betrag auch in der Kasse.</p>'}`;
  };

  function fuelForm(id) {
    const f = S.fuel.find(x => x.id === id) || { date: today(), full: true };
    const t = currentTrip();
    const linked = f.id && S.expenses.find(x => x.fuelId === f.id);
    const lastOdo = Math.max(0, ...S.fuel.map(x => x.odo || 0));
    openSheet(`<form data-form="fuel" data-id="${f.id || ''}">
      ${sheetHead(f.id ? 'Tankstopp' : 'Tanken')}
      <div class="row2">
        <label class="field"><span>Datum</span><input type="date" name="date" value="${f.date}" required></label>
        <label class="field"><span>Kilometerstand</span><input name="odo" inputmode="numeric" value="${f.odo || ''}" placeholder="${lastOdo ? 'zuletzt ' + lastOdo : 'z. B. 84250'}"></label>
      </div>
      <div class="row2">
        <label class="field"><span>Liter</span><input name="liters" inputmode="decimal" required value="${inputNum(f.liters)}" placeholder="0,00"></label>
        <label class="field"><span>Betrag in €</span><input name="amount" inputmode="decimal" required value="${inputNum(f.amount)}" placeholder="0,00"></label>
      </div>
      <label class="field"><span>Wo?</span><input name="place" value="${esc(f.place)}" placeholder="z. B. Albertville"></label>
      <label class="check"><input type="checkbox" name="full"${f.full ? ' checked' : ''}><span>Vollgetankt</span></label>
      ${t || linked ? `<label class="check"><input type="checkbox" name="toKasse"${!f.id || linked ? ' checked' : ''}><span>In die Kasse${t ? ` von „${esc(t.name)}“` : ''}</span></label>` : ''}
      <label class="field"><span>Notiz</span><input name="note" value="${esc(f.note)}"></label>
      <div class="sheet-foot">
        ${f.id ? `<button type="button" class="ghost danger" data-action="del-fuel" data-id="${f.id}">Löschen</button>` : ''}
        <button class="primary">Speichern</button>
      </div>
    </form>`);
  }

  ACTIONS['fuel-form'] = el => fuelForm(el.dataset.id);
  ACTIONS['del-fuel'] = el => {
    if (!confirm('Diesen Tankstopp löschen? Die Buchung in der Kasse wird mitgelöscht.')) return;
    S.expenses.filter(x => x.fuelId === el.dataset.id).forEach(x => remove('expenses', x.id));
    remove('fuel', el.dataset.id);
    closeSheet();
  };
  FORMS.fuel = form => {
    const old = S.fuel.find(f => f.id === form.dataset.id);
    const liters = num(form.liters.value), amount = num(form.amount.value);
    if (liters <= 0 || amount <= 0) return toast('Bitte Liter und Betrag eintragen.');
    const t = currentTrip();
    const f = save('fuel', {
      ...(old || { id: newId(), by: me(), tripId: t ? t.id : null }),
      date: form.date.value, odo: parseInt(form.odo.value.replace(/\D/g, '')) || 0, liters, amount,
      place: form.place.value.trim(), note: form.note.value.trim(), full: form.full.checked,
    });
    const linked = S.expenses.find(x => x.fuelId === f.id);
    if (form.toKasse && form.toKasse.checked && (linked || t)) {
      save('expenses', {
        ...(linked || { id: newId(), tripId: t.id, paidBy: me(), split: defaultSplit(), fuelId: f.id }),
        amount, date: f.date, cat: 'Sprit', note: 'Tanken' + (f.place ? ' ' + f.place : ''),
      });
    } else if (linked) {
      remove('expenses', linked.id);
    }
    closeSheet();
  };

  /* ---------- Checklisten ---------- */

  const DEFAULT_CHECKS = {
    Abfahrt: ['Fenster und Türen zu', 'Gaskocher aus, Kartusche raus', 'Boxen und Fächer gesichert', 'Kühlbox zu und festgezurrt',
      'Wasserkanister zu', 'Landstromkabel abgesteckt und verstaut', 'Auffahrkeile eingepackt', 'Stühle und Tisch verstaut',
      'Müll mitgenommen', 'Einmal ums Auto gehen'],
    Ankunft: ['Möglichst eben hinstellen, sonst Keile', 'Handbremse und Gang rein', 'Stellplatz im Tagebuch eintragen',
      'Strom anschließen', 'Lüften: Fenster einen Spalt auf', 'Kühlbox prüfen', 'Wasser und Entsorgung herausfinden'],
  };
  const checkLists = () => S.checklists.slice().sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  const checkDone = (cl, it) => S.checkstate.some(c => c.id === `${cl.id}_${it.id}` && c.done);

  VIEWS.checklisten = () => {
    const lists = checkLists();
    if (!lists.length) {
      return `${pageHead('check', 'Checklisten', 'Damit nichts liegen bleibt')}
        <p class="hint">Zwei Vorlagen für euren Minicamper: was vor der Abfahrt und was bei der Ankunft zu tun ist. Ihr könnt sie danach frei anpassen.</p>
        <div class="btnrow"><button class="primary" data-action="check-seed">Vorlagen anlegen</button>
        <button class="ghost" data-action="check-form">Eigene Checkliste</button></div>`;
    }
    const cur = lists.find(l => l.id === LS.get('check', null)) || lists[0];
    const items = cur.items || [];
    const done = items.filter(it => checkDone(cur, it)).length;
    return `${pageHead('check', 'Checklisten', 'Damit nichts liegen bleibt')}
      <div class="chips list-chips">${lists.map(l => `<button class="chip${l.id === cur.id ? ' on' : ''}" data-action="check-pick" data-id="${l.id}">${esc(l.name)}</button>`).join('')}
        <button class="chip add" data-action="check-form">${icon('plus')}Neue Checkliste</button></div>
      <div class="list-head"><h2>${esc(cur.name)}</h2><span class="sub">${done} von ${items.length}</span>
        <button class="icon-btn small" data-action="check-form" data-id="${cur.id}" aria-label="Checkliste bearbeiten">${icon('edit')}</button></div>
      <div class="progress" style="--p:${items.length ? done / items.length : 0}"><span></span></div>
      <ul class="checklist">${items.map(it => `<li class="${checkDone(cur, it) ? 'done' : ''}">
        <button class="tick" data-action="check-toggle" data-list="${cur.id}" data-id="${it.id}" aria-pressed="${checkDone(cur, it)}" aria-label="Erledigt"></button>
        <span class="txt">${esc(it.text)}</span></li>`).join('')}</ul>
      ${done === items.length && items.length ? '<p class="all-done">Alles erledigt. Gute Fahrt!</p>' : ''}
      <div class="toolbar end"><button class="ghost" data-action="check-reset" data-id="${cur.id}">Alle Haken entfernen</button></div>`;
  };

  function checkForm(id) {
    const cl = S.checklists.find(x => x.id === id) || { items: [] };
    openSheet(`<form data-form="check" data-id="${cl.id || ''}">
      ${sheetHead(cl.id ? 'Checkliste bearbeiten' : 'Neue Checkliste')}
      <label class="field"><span>Name</span><input name="name" value="${esc(cl.name)}" required placeholder="z. B. Winterbetrieb"></label>
      <label class="field"><span>Punkte, einer pro Zeile</span><textarea name="items" rows="10">${esc((cl.items || []).map(i => i.text).join('\n'))}</textarea></label>
      <div class="sheet-foot">
        ${cl.id ? `<button type="button" class="ghost danger" data-action="del-check" data-id="${cl.id}">Löschen</button>` : ''}
        <button class="primary">Speichern</button>
      </div>
    </form>`);
  }

  ACTIONS['check-seed'] = () => {
    Object.entries(DEFAULT_CHECKS).forEach(([name, texts], n) =>
      save('checklists', { id: newId(), name, order: n, items: texts.map(text => ({ id: newId(), text })) }));
  };
  ACTIONS['check-pick'] = el => { LS.set('check', el.dataset.id); render(); };
  ACTIONS['check-form'] = el => checkForm(el.dataset.id);
  ACTIONS['check-toggle'] = el => {
    const id = `${el.dataset.list}_${el.dataset.id}`;
    const cur = S.checkstate.find(c => c.id === id);
    if (cur && cur.done) remove('checkstate', id);
    else save('checkstate', { id, listId: el.dataset.list, done: true, by: me() });
  };
  ACTIONS['check-reset'] = el => S.checkstate.filter(c => c.listId === el.dataset.id).forEach(c => remove('checkstate', c.id));
  ACTIONS['del-check'] = el => {
    if (!confirm('Diese Checkliste löschen?')) return;
    S.checkstate.filter(c => c.listId === el.dataset.id).forEach(c => remove('checkstate', c.id));
    remove('checklists', el.dataset.id);
    closeSheet();
  };
  FORMS.check = form => {
    const old = S.checklists.find(c => c.id === form.dataset.id);
    // Gleiche Texte behalten ihre Kennung, damit gesetzte Haken erhalten bleiben
    const pool = [...((old && old.items) || [])];
    const items = form.items.value.split('\n').map(x => x.trim()).filter(Boolean).map(text => {
      const i = pool.findIndex(p => p.text === text);
      return i >= 0 ? pool.splice(i, 1)[0] : { id: newId(), text };
    });
    const cl = save('checklists', { ...(old || { id: newId(), order: S.checklists.length }), name: form.name.value.trim(), items });
    LS.set('check', cl.id);
    closeSheet();
  };

  /* ---------- Fahrzeug: Steckbrief und Fristen ---------- */

  const VEHICLE = [
    ['name', 'Name', 'z. B. Schäfchen'], ['model', 'Modell', 'z. B. VW Caddy Maxi'], ['plate', 'Kennzeichen', ''],
    ['height', 'Höhe in m', 'z. B. 1,95'], ['width', 'Breite in m', ''], ['length', 'Länge in m', ''],
    ['weight', 'Zulässiges Gesamtgewicht in kg', ''], ['empty', 'Leergewicht fahrbereit in kg', ''],
    ['tireFront', 'Reifendruck vorn in bar', ''], ['tireRear', 'Reifendruck hinten in bar', ''],
    ['fuelType', 'Kraftstoff', 'z. B. Diesel'], ['tank', 'Tankinhalt in l', ''],
    ['insurer', 'Versicherung', ''], ['policy', 'Versicherungsnummer', ''], ['breakdown', 'Pannenhilfe (Telefon)', ''],
    ['notes', 'Notizen', 'z. B. Maße mit Dachbox, Ersatzschlüssel bei …'],
  ];
  const vehicle = () => S.meta.find(m => m.id === 'vehicle') || { id: 'vehicle' };
  const REPEATS = [[0, 'einmalig'], [1, 'monatlich'], [3, 'alle 3 Monate'], [6, 'halbjährlich'], [12, 'jährlich'], [24, 'alle 2 Jahre'], [36, 'alle 3 Jahre'], [60, 'alle 5 Jahre']];
  const PRESETS = [['Hauptuntersuchung (TÜV)', 24], ['Ölwechsel', 12], ['Gasprüfung', 24], ['Verbandskasten', 60], ['Vignette', 12], ['Versicherung', 12]];

  function addMonths(d, m) {
    const [y, mo, day] = d.split('-').map(Number);
    const x = new Date(y, mo - 1 + m, day, 12);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }
  const openDeadlines = () => S.deadlines.filter(d => !d.done).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  function dueCount() {
    const soon = openDeadlines().filter(d => d.due && daysUntil(d.due) <= 30);
    return { n: soon.length, over: soon.some(d => daysUntil(d.due) < 0) };
  }
  function dueText(d) {
    const n = daysUntil(d.due);
    if (n < 0) return { text: `seit ${-n} ${n === -1 ? 'Tag' : 'Tagen'} fällig`, cls: 'over' };
    if (n === 0) return { text: 'heute fällig', cls: 'over' };
    if (n <= 30) return { text: `in ${n} ${n === 1 ? 'Tag' : 'Tagen'}`, cls: 'soon' };
    return { text: fmtShort(d.due), cls: '' };
  }

  VIEWS.fahrzeug = () => {
    const v = vehicle();
    const filled = VEHICLE.filter(([k]) => v[k]);
    const payload = num(v.weight) && num(v.empty) ? num(v.weight) - num(v.empty) : 0;
    const open = openDeadlines();
    const done = S.deadlines.filter(d => d.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 5);
    return `${pageHead('fahrzeug', 'Fahrzeug', v.name ? esc(v.name) + (v.plate ? ', ' + esc(v.plate) : '') : 'Steckbrief und Fristen')}
      <section class="panel">
        <div class="toolbar"><h2>Steckbrief</h2><button class="ghost" data-action="vehicle-form">${filled.length ? 'Bearbeiten' : 'Ausfüllen'}</button></div>
        ${filled.length ? `<dl class="facts-list">${filled.map(([k, l]) => `<div><dt>${l}</dt><dd>${k === 'breakdown'
          ? `<a href="tel:${esc(v[k].replace(/[^\d+]/g, ''))}">${esc(v[k])}</a>` : esc(v[k])}</dd></div>`).join('')}
          ${payload > 0 ? `<div><dt>Zuladung</dt><dd>${payload.toLocaleString('de-DE')} kg</dd></div>` : ''}</dl>`
          : '<p class="hint">Höhe, Gewicht, Reifendruck, Versicherung und Pannenhilfe: alles, was man unterwegs plötzlich braucht.</p>'}
      </section>
      <section class="panel">
        <div class="toolbar"><h2>Fristen</h2><button class="primary" data-action="deadline-form">${icon('plus')}Frist</button></div>
        ${open.length ? `<ul class="ledger">${open.map(d => { const due = dueText(d); return `<li><button data-action="deadline-form" data-id="${d.id}">
            <span class="txt"><b>${esc(d.title)}</b><small>${d.repeat ? REPEATS.find(r => r[0] === d.repeat)[1] : 'einmalig'}${d.note ? ', ' + esc(d.note) : ''}</small></span>
            <span class="due ${due.cls}">${due.text}</span></button></li>`; }).join('')}</ul>`
          : '<p class="hint">TÜV, Ölwechsel, Gasprüfung, Vignetten: tragt Fristen ein. 30 Tage vorher erscheint im Mehr-Menü ein Hinweis.</p>'}
        ${done.length ? `<h3 class="date-head">Zuletzt erledigt</h3><ul class="ledger">${done.map(d => `<li><button data-action="deadline-form" data-id="${d.id}">
            <span class="txt"><b>${esc(d.title)}</b><small>erledigt am ${fmtShort(new Date(d.doneAt).toISOString().slice(0, 10))}</small></span></button></li>`).join('')}</ul>` : ''}
      </section>`;
  };

  function vehicleForm() {
    const v = vehicle();
    openSheet(`<form data-form="vehicle">${sheetHead('Steckbrief')}
      ${VEHICLE.map(([k, l, ph]) => k === 'notes'
        ? `<label class="field"><span>${l}</span><textarea name="${k}" rows="3" placeholder="${ph}">${esc(v[k])}</textarea></label>`
        : `<label class="field"><span>${l}</span><input name="${k}" value="${esc(v[k])}" placeholder="${ph}"${k === 'breakdown' ? ' type="tel"' : ''}></label>`).join('')}
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  }

  function deadlineForm(id) {
    const d = S.deadlines.find(x => x.id === id) || { due: '', repeat: 12 };
    openSheet(`<form data-form="deadline" data-id="${d.id || ''}">${sheetHead(d.id ? 'Frist' : 'Neue Frist')}
      ${d.id ? '' : `<div class="chips wrap presets">${PRESETS.map(([t, m]) => `<button type="button" class="chip" data-action="deadline-preset" data-title="${t}" data-repeat="${m}">${t}</button>`).join('')}</div>`}
      <label class="field"><span>Was?</span><input name="title" value="${esc(d.title)}" required></label>
      <div class="row2">
        <label class="field"><span>Fällig am</span><input type="date" name="due" value="${d.due}" required></label>
        <label class="field"><span>Wiederholung</span><select name="repeat">${REPEATS.map(([m, l]) => `<option value="${m}"${m === (d.repeat || 0) ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Notiz</span><input name="note" value="${esc(d.note)}" placeholder="z. B. Werkstatt, Kosten, Land"></label>
      <div class="sheet-foot">
        ${d.id ? `<button type="button" class="ghost danger" data-action="del-deadline" data-id="${d.id}">Löschen</button>` : ''}
        ${d.id && !d.done ? `<button type="button" class="ghost" data-action="deadline-done" data-id="${d.id}">Erledigt</button>` : ''}
        <button class="primary">Speichern</button>
      </div></form>`);
  }

  ACTIONS['vehicle-form'] = vehicleForm;
  ACTIONS['deadline-form'] = el => deadlineForm(el.dataset.id);
  ACTIONS['deadline-preset'] = el => {
    const f = el.form;
    f.title.value = el.dataset.title;
    f.repeat.value = el.dataset.repeat;
    f.due.focus();
  };
  ACTIONS['deadline-done'] = el => {
    const d = S.deadlines.find(x => x.id === el.dataset.id);
    // Wiederkehrende Fristen rücken weiter, einmalige wandern zu „erledigt“
    if (d.repeat) save('deadlines', { ...d, due: addMonths(d.due || today(), d.repeat), lastDone: today() });
    else save('deadlines', { ...d, done: true, doneAt: Date.now() });
    closeSheet();
    toast(d.repeat ? 'Erledigt, nächste Frist eingetragen' : 'Erledigt');
  };
  ACTIONS['del-deadline'] = el => { if (confirm('Diese Frist löschen?')) { remove('deadlines', el.dataset.id); closeSheet(); } };
  FORMS.vehicle = form => {
    const v = { ...vehicle() };
    VEHICLE.forEach(([k]) => { v[k] = form[k].value.trim(); });
    save('meta', v);
    closeSheet();
  };
  FORMS.deadline = form => {
    const old = S.deadlines.find(x => x.id === form.dataset.id);
    save('deadlines', { ...(old || { id: newId(), done: false }), title: form.title.value.trim(), due: form.due.value, repeat: +form.repeat.value, note: form.note.value.trim() });
    closeSheet();
  };

  /* ---------- Statistik ---------- */

  function bars(rows, fmt) {
    const max = Math.max(1, ...rows.map(r => r[1]));
    return `<section class="cats">${rows.map(([label, v]) => `<div class="cat" title="${esc(label)}: ${fmt(v)}">
      <span>${esc(label)}</span><span class="bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></span><b>${fmt(v)}</b></div>`).join('')}</section>`;
  }

  VIEWS.statistik = () => {
    const trips = sortTrips(S.trips);
    if (!trips.length) return `${pageHead('statistik', 'Statistik')}<p class="hint">Sobald ihr unterwegs wart, stehen hier eure Reisen in Zahlen.</p>`;
    const rows = trips.map(t => ({ t, st: tripStats(t) }));
    const nights = rows.reduce((s, r) => s + r.st.nights, 0);
    const dist = rows.reduce((s, r) => s + r.st.dist, 0);
    const sights = rows.reduce((s, r) => s + r.st.sights, 0);
    const photos = S.entries.reduce((s, e) => s + (e.photos || []).length, 0);
    const hikeKm = S.entries.filter(e => e.type === 'wanderung').reduce((s, e) => s + (num((e.extra || {}).km) || 0), 0);
    const countries = [...new Set([...S.entries, ...S.places.filter(p => p.done)].map(x => x.country).filter(Boolean))];
    const years = {};
    rows.forEach(({ t, st }) => {
      const y = (t.start || st.firstDay || '').slice(0, 4) || 'ohne Datum';
      years[y] ||= { nights: 0, km: 0 };
      years[y].nights += st.nights;
      years[y].km += st.dist;
    });
    const ys = Object.entries(years).sort((a, b) => b[0].localeCompare(a[0]));
    const best = S.entries.filter(e => e.type === 'stellplatz' && e.rating >= 4)
      .sort((a, b) => b.rating - a.rating || (b.date || '').localeCompare(a.date || '')).slice(0, 6);
    const avg = canCash() ? app.fuelAverage() : null;
    return `${pageHead('statistik', 'Statistik', 'Eure Reisen in Zahlen')}
      <div class="facts stat-facts">
        <div><b>${trips.length}</b><span>${trips.length === 1 ? 'Reise' : 'Reisen'}</span></div>
        <div><b>${nights}</b><span>${nights === 1 ? 'Nacht' : 'Nächte'}</span></div>
        <div><b>${fmtKm(dist)}</b><span>unterwegs</span></div>
        <div><b>${sights}</b><span>Sehenswertes</span></div>
        <div><b>${countries.length}</b><span>${countries.length === 1 ? 'Land' : 'Länder'}</span></div>
        <div><b>${photos}</b><span>Fotos</span></div>
        ${hikeKm ? `<div><b>${fmtKm(hikeKm)}</b><span>gewandert und geradelt</span></div>` : ''}
        ${avg ? `<div><b>${dec(avg)} l</b><span>pro 100 km</span></div>` : ''}
      </div>
      ${countries.length ? `<p class="sub">${countries.map(regionName).sort().join(', ')}</p>` : ''}
      ${ys.length ? `<h2 class="stat-h">Nächte pro Jahr</h2>${bars(ys.map(([y, v]) => [y, v.nights]), v => String(v))}
        <h2 class="stat-h">Kilometer pro Jahr</h2>${bars(ys.map(([y, v]) => [y, Math.round(v.km)]), v => v.toLocaleString('de-DE') + ' km')}` : ''}
      <h2 class="stat-h">Alle Reisen</h2>
      <ul class="ledger">${rows.map(({ t, st }) => `<li><button data-action="pick-trip" data-id="${t.id}">
        <span class="txt"><b><i class="trip-dot" style="--c:${tripColor(t)}"></i>${esc(t.name)}</b>
          <small>${st.nights} ${st.nights === 1 ? 'Nacht' : 'Nächte'}, ${fmtKm(st.dist)}${canCash() && st.cost ? `, ${money(st.cost)}${st.nights ? `, ${money(st.cost / st.nights)} pro Nacht` : ''}` : ''}</small></span>
      </button></li>`).join('')}</ul>
      ${best.length ? `<h2 class="stat-h">Die schönsten Stellplätze</h2>
        <ul class="ledger">${best.map(e => `<li><button data-action="open-entry" data-id="${e.id}">
          <span class="txt"><b>${esc(e.title || e.place || 'Stellplatz')}</b><small>${esc([e.place, fmtDay(e.date.slice(0, 10)), (S.trips.find(t => t.id === e.tripId) || {}).name].filter(Boolean).join(', '))}</small></span>
          <span class="amt rating">${stars(e.rating)}</span></button></li>`).join('')}</ul>` : ''}`;
  };
}
