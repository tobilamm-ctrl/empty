// Testmodus: Beispieldaten anlegen und wieder entfernen, Standort simulieren.
// Alle Beispieldaten tragen demo: true und eine Kennung mit „demo-“, damit sie sauber entfernt werden können.

export default function installTestdaten(app) {
  const {
    S, LS, ACTIONS, mapHooks, settingsPanels, save, remove, toast, render, go,
    members, payers, me, canCash, defaultSplit, today, km, fmtKm, showMe,
  } = app;

  const isDemo = d => d && (d.demo === true || String(d.id).startsWith('demo-'));
  const hasDemo = () => S.trips.some(isDemo);

  /* ---------- Standort simulieren ---------- */

  const simOn = () => LS.get('simOn', false);
  const simPos = () => LS.get('simPos', null);
  app.setSimulator(() => (simOn() && simPos() ? { ...simPos(), acc: 5, simulated: true } : null));

  ACTIONS['sim-toggle'] = () => {
    const on = !simOn();
    LS.set('simOn', on);
    if (on && !simPos()) {
      const c = app.map ? app.map.getCenter() : { lat: 45.7642, lng: 10.809 };
      LS.set('simPos', { lat: c.lat, lng: c.lng });
    }
    toast(on ? 'Standort wird simuliert. Auf der Karte den orangen Punkt ziehen.' : 'Wieder echtes GPS');
    render();
  };

  mapHooks.push(layer => {
    const L = window.L;
    const chip = document.getElementById('simChip');
    if (chip) chip.hidden = !simOn();
    if (!simOn() || !simPos()) return [];
    const p = simPos();
    const m = L.marker([p.lat, p.lng], {
      draggable: true, zIndexOffset: 2000,
      icon: L.divIcon({ className: '', html: '<div class="sim-pos"></div>', iconSize: [26, 26], iconAnchor: [13, 13] }),
    }).bindTooltip('Simulierter Standort: ziehen', { direction: 'top', offset: [0, -12] }).addTo(layer);
    m.on('dragend', () => {
      const ll = m.getLatLng();
      LS.set('simPos', { lat: ll.lat, lng: ll.lng });
      toast('Simulierter Standort gesetzt');
    });
    return [];
  });

  /* ---------- Einstellungen ---------- */

  settingsPanels.push(() => `<section class="panel">
    <h2>Testen</h2>
    <p>Zum Ausprobieren ohne loszufahren: eine Beispielreise an den Gardasee mit Route, Stopps, Tankstellen, Fotos${canCash() ? ', Kasse' : ''},
      Listen, Boxen, Strecke und einer geplanten Ostsee-Reise. Alle Beispieldaten sind mit „Test“ gekennzeichnet und lassen sich mit einem Tipp wieder entfernen.
      Achtung: Die Crew sieht sie auch, solange sie da sind.</p>
    <div class="btnrow">
      ${hasDemo()
        ? '<button class="ghost danger" data-action="demo-remove">Testdaten entfernen</button><button class="ghost" data-action="demo-open">Testreise öffnen</button>'
        : '<button class="primary" data-action="demo-create">Testdaten anlegen</button>'}
    </div>
    <label class="check"><input type="checkbox" data-action="sim-toggle"${simOn() ? ' checked' : ''}><span>Standort simulieren statt GPS</span></label>
    <p class="sub">Ist das an, nehmen „Ich bin hier …“, „Auto geparkt“ und die Entfernung zum Auto den orangen Punkt auf der Karte als euren Standort.</p>
  </section>`);
  // Checkbox: Klick-Aktionen ignorieren Eingabefelder, daher über change
  document.addEventListener('change', ev => {
    if (ev.target.dataset && ev.target.dataset.action === 'sim-toggle') ACTIONS['sim-toggle']();
  });

  /* ---------- Beispieldaten ---------- */

  const pad = n => String(n).padStart(2, '0');
  const dayOffset = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  // Testfoto: gezeichnete Berglandschaft mit Beschriftung
  function photo(label, hue) {
    const c = document.createElement('canvas');
    c.width = 960; c.height = 640;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 640);
    sky.addColorStop(0, `hsl(${hue} 70% 78%)`); sky.addColorStop(1, `hsl(${hue + 30} 60% 92%)`);
    g.fillStyle = sky; g.fillRect(0, 0, 960, 640);
    g.fillStyle = `hsl(${hue + 160} 25% 45%)`;
    g.beginPath(); g.moveTo(0, 520); g.lineTo(220, 260); g.lineTo(380, 420); g.lineTo(600, 180); g.lineTo(960, 500); g.lineTo(960, 640); g.lineTo(0, 640); g.fill();
    g.fillStyle = `hsl(${hue + 200} 45% 45%)`; g.fillRect(0, 540, 960, 100);
    g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.fillText('Testfoto', 40, 80);
    g.font = '32px sans-serif'; g.fillText(label, 40, 130);
    const small = document.createElement('canvas');
    small.width = 360; small.height = 240;
    small.getContext('2d').drawImage(c, 0, 0, 360, 240);
    return { data: c.toDataURL('image/jpeg', 0.8), thumb: small.toDataURL('image/jpeg', 0.7) };
  }

  ACTIONS['demo-create'] = () => {
    if (hasDemo()) return toast('Testdaten sind schon da.');
    const trip = 'demo-trip', plan = 'demo-plan';
    const start = -16;                     // Reise begann vor 16 Tagen, dauerte 6 Tage
    const day = n => dayOffset(start + n);
    const who = payers().length ? payers() : members();
    const payer = n => (who[n % who.length] || { id: me() }).id;
    const D = { demo: true, by: me(), createdAt: Date.now() };

    save('trips', { ...D, id: trip, name: 'Test: Gardasee', start: day(0), end: day(5), color: '#2E7FB8', archived: false });
    save('trips', { ...D, id: plan, name: 'Test: Ostsee planen', start: dayOffset(60), end: dayOffset(68), color: '#4F8A3C', archived: false });

    const E = [
      [0, '10:30', 'pause', 'Rast am Brennerpass', 'Brenner', 47.0024, 11.5058, 'IT', { cost: 7.8, rating: 3, text: 'Espresso und Strudel mit Blick auf die Berge.' }],
      [0, '11:15', 'tank', 'Tanken bei Sterzing', 'Sterzing', 46.8967, 11.4300, 'IT', { fuel: { liters: 48.2, amount: 86.4, odo: 84120, full: true } }],
      [0, '14:00', 'sight', 'Altstadt Bozen', 'Bozen', 46.4983, 11.3548, 'IT', { rating: 4, text: 'Lauben, Obstmarkt und Ötzi im Museum.' }],
      [0, '18:30', 'stellplatz', 'Camping am Kalterer See', 'Kaltern', 46.3870, 11.2610, 'IT', { cost: 32, rating: 4, features: ['Strom', 'Dusche', 'WC'], text: 'Direkt am See, abends sehr ruhig.' }],
      [1, '09:30', 'einkauf', 'Wochenmarkt Kaltern', 'Kaltern', 46.4150, 11.2430, 'IT', { cost: 23.8 }],
      [1, '14:30', 'service', 'Ver- und Entsorgung Arco', 'Arco', 45.9180, 10.8870, 'IT', { cost: 2, rating: 4 }],
      [1, '17:45', 'stellplatz', 'Stellplatz Riva del Garda', 'Riva del Garda', 45.8858, 10.8410, 'IT', { cost: 25, rating: 3, features: ['Strom', 'Entsorgung'], text: 'Laut, aber nah an der Altstadt.' }],
      [1, '11:30', 'museum', 'MAG Museum Riva', 'Riva del Garda', 45.8860, 10.8440, 'IT', { cost: 6, rating: 3, text: 'Kleines Museum in der Wasserburg.' }],
      [1, '20:00', 'restaurant', 'Pizzeria am Hafen', 'Riva del Garda', 45.8850, 10.8425, 'IT', { cost: 46.5, rating: 4 }],
      [2, '08:30', 'faehre', 'Fähre Malcesine nach Limone', 'Malcesine', 45.7650, 10.8070, 'IT', { cost: 21.6, extra: { kind: 'Fähre' } }],
      [2, '10:00', 'sight', 'Seilbahn Monte Baldo', 'Malcesine', 45.7600, 10.8130, 'IT', { cost: 50, rating: 5, photo: ['Monte Baldo', 200], text: 'Drehende Gondel, oben klare Sicht über den ganzen See.' }],
      [2, '19:00', 'stellplatz', 'Agricamping bei Malcesine', 'Malcesine', 45.7700, 10.8200, 'IT', { cost: 28, rating: 5, features: ['Ruhig', 'Aussicht', 'Strom'], photo: ['Agricamping', 30], text: 'Olivenhain, eigene Eier zum Frühstück.' }],
      [3, '10:00', 'notiz', 'Regentag', 'Malcesine', 45.7660, 10.8100, 'IT', { text: 'Den ganzen Vormittag Regen. Karten gespielt, Fotos sortiert.' }],
      [3, '13:00', 'wanderung', 'Ponale-Weg', 'Riva del Garda', 45.8700, 10.8300, 'IT', { rating: 5, extra: { mode: 'zu Fuß', km: 7.5, up: 380, hours: 3 }, text: 'Alte Straße hoch über dem See, toller Blick.' }],
      [3, '17:30', 'waesche', 'Waschsalon Malcesine', 'Malcesine', 45.7630, 10.8100, 'IT', { cost: 9 }],
      [3, '15:00', 'pause', 'Café am Hafen', 'Malcesine', 45.7642, 10.8090, 'IT', { cost: 12.5, rating: 4 }],
      [4, '09:40', 'tank', 'Tanken Peschiera', 'Peschiera del Garda', 45.4390, 10.6920, 'IT', { fuel: { liters: 41.7, amount: 74.1, odo: 84560, full: true } }],
      [4, '11:00', 'sight', 'Scaligerburg Sirmione', 'Sirmione', 45.4920, 10.6080, 'IT', { cost: 12, rating: 4 }],
      [4, '14:30', 'baden', 'Lido delle Bionde', 'Sirmione', 45.4960, 10.6110, 'IT', { rating: 4, extra: { where: 'See', water: 22 } }],
      [5, '09:30', 'kinder', 'Gardaland', 'Castelnuovo del Garda', 45.4550, 10.7136, 'IT', { cost: 120, rating: 5, text: 'Den ganzen Vormittag Achterbahn.' }],
      [4, '18:00', 'stellplatz', 'Camping Sirmione', 'Sirmione', 45.4850, 10.6050, 'IT', { cost: 38, rating: 3, features: ['Strom', 'WC', 'Dusche'] }],
      [5, '11:00', 'sight', 'Arena von Verona', 'Verona', 45.4390, 10.9940, 'IT', { cost: 20, rating: 5 }],
      [5, '16:00', 'notiz', 'Heimweg', 'Verona', 45.4384, 10.9916, 'IT', { text: 'Schön war es. Nächstes Mal mit Fähre über den See.' }],
    ];

    E.forEach(([d, time, type, title, place, lat, lng, country, x], n) => {
      const id = `demo-e${n}`;
      let photos = [];
      if (x.photo) {
        const ph = photo(x.photo[0], x.photo[1]);
        save('photos', { id: `demo-ph${n}`, entryId: id, tripId: trip, data: ph.data, demo: true });
        photos = [{ id: `demo-ph${n}`, thumb: ph.thumb }];
      }
      save('entries', {
        ...D, id, tripId: trip, type, title, place, lat, lng, country, date: `${day(d)}T${time}`,
        text: x.text || '', rating: x.rating || 0, features: x.features || [], cost: x.cost || 0, photos, extra: x.extra || {},
      });
      if (x.cost && canCash()) {
        save('expenses', { ...D, id: `demo-x${n}`, tripId: trip, entryId: id, amount: x.cost, date: day(d), cat: app.costCat(type, x.extra), note: title, paidBy: payer(n), split: defaultSplit() });
      }
      if (x.fuel && canCash()) {
        save('fuel', { ...D, id: `demo-f${n}`, tripId: trip, entryId: id, date: day(d), place, lat, lng, ...x.fuel });
        save('expenses', { ...D, id: `demo-fx${n}`, tripId: trip, fuelId: `demo-f${n}`, amount: x.fuel.amount, date: day(d), cat: 'Sprit', note: 'Tanken ' + place, paidBy: payer(n + 1), split: defaultSplit() });
      }
    });
    if (canCash()) {
      save('expenses', { ...D, id: 'demo-x-maut', tripId: trip, amount: 11.5, date: day(0), cat: 'Maut & Vignette', note: 'Brennermaut', paidBy: payer(1), split: defaultSplit() });
      save('expenses', { ...D, id: 'demo-x-vig', tripId: trip, amount: 11.5, date: day(0), cat: 'Maut & Vignette', note: 'Vignette Österreich', paidBy: payer(0), split: defaultSplit() });
      save('expenses', { ...D, id: 'demo-x-lm', tripId: trip, amount: 64.3, date: day(3), cat: 'Lebensmittel', note: 'Supermarkt Malcesine', paidBy: payer(1), split: defaultSplit() });
    }

    // Gefahrene Strecke wie aus einer GPX-Datei
    const route = [[47.2692, 11.4041], [47.13, 11.45], [47.0024, 11.5058], [46.8967, 11.43], [46.72, 11.65], [46.4983, 11.3548],
      [46.415, 11.243], [46.387, 11.261], [46.2, 11.1], [46.07, 11.12], [45.918, 10.887], [45.8858, 10.841], [45.82, 10.83],
      [45.7642, 10.809], [45.65, 10.73], [45.55, 10.72], [45.439, 10.692], [45.492, 10.608], [45.46, 10.75], [45.4384, 10.9916]];
    let dist = 0;
    for (let i = 1; i < route.length; i++) dist += km({ lat: route[i - 1][0], lng: route[i - 1][1] }, { lat: route[i][0], lng: route[i][1] });
    save('tracks', { ...D, id: 'demo-track', tripId: trip, name: 'Test: Innsbruck bis Verona', km: Math.round(dist * 10) / 10, pts: app.encodePts(route) });

    // Boxen, Fach und Packliste
    save('boxes', { ...D, id: 'demo-box1', kind: 'box', name: 'Test: Küchenbox', where: 'hinten links', order: 90 });
    save('boxes', { ...D, id: 'demo-box2', kind: 'fach', name: 'Test: Türfach links', where: 'Fahrertür', order: 91 });
    [['Kocher', 'demo-box1'], ['Topf mit Deckel', 'demo-box1'], ['Gaskartusche', 'demo-box1'], ['Taschenlampe', 'demo-box2'], ['Warnweste', 'demo-box2']]
      .forEach(([name, boxId], n) => save('items', { ...D, id: `demo-i${n}`, name, boxId, note: '' }));
    save('items', { ...D, id: 'demo-i-extra', name: 'Badesachen', boxId: '', tripId: trip, note: 'nur für den See' });
    ['demo-i0', 'demo-i1', 'demo-i3', 'demo-i-extra'].forEach(i => save('packstate', { ...D, id: `${trip}_${i}`, tripId: trip, itemId: i, packed: true }));

    // Listen
    save('lists', { ...D, id: 'demo-l1', kind: 'einkauf', name: 'Test: Einkauf Gardasee', tripId: trip, order: 90 });
    save('lists', { ...D, id: 'demo-l2', kind: 'merken', name: 'Test: Ideen fürs nächste Mal', tripId: null, order: 90 });
    save('lists', { ...D, id: 'demo-l3', kind: 'merken', name: 'Test: Vorbereitung Ostsee', tripId: plan, order: 91 });
    [['demo-l1', 'einkauf', 'Olivenöl', false], ['demo-l1', 'einkauf', 'Pfirsiche', false], ['demo-l1', 'einkauf', 'Grappa', true],
      ['demo-l2', 'merken', 'Mit der Fähre nach Limone', false], ['demo-l2', 'merken', 'Stellplatz früher reservieren', false],
      ['demo-l3', 'merken', 'Fehmarn-Stellplatz anfragen', false], ['demo-l3', 'merken', 'Fahrradträger prüfen', false]]
      .forEach(([listId, list, text, done], n) => save('listItems', { ...D, id: `demo-li${n}`, listId, list, text, done, doneAt: done ? Date.now() : 0, createdAt: Date.now() - n * 1000 }));

    // Orte: Wunschliste, Lieblingsplatz, Planung der Ostsee-Reise
    save('places', { ...D, id: 'demo-p1', kind: 'stellplatz', name: 'Test: Seiser Alm', place: 'Kastelruth', lat: 46.54, lng: 11.62, country: 'IT', tripId: null, fav: false, rating: 0, note: 'Wanderungen, im Sommer Stellplatz am Lift' });
    save('places', { ...D, id: 'demo-p2', kind: 'stellplatz', name: 'Test: Agricamping bei Malcesine', place: 'Malcesine', lat: 45.77, lng: 10.82, country: 'IT', tripId: null, fav: true, rating: 5, entryId: 'demo-e8' });
    [['stellplatz', 'Test: Stellplatz Fehmarn', 'Fehmarn', 54.44, 11.19, 60], ['poi', 'Test: Lübecker Altstadt', 'Lübeck', 53.8655, 10.6866, 61], ['stellplatz', 'Test: Stellplatz Warnemünde', 'Rostock', 54.178, 12.083, 62]]
      .forEach(([kind, name, place, lat, lng, d], n) => save('places', { ...D, id: `demo-pp${n}`, kind, name, place, lat, lng, country: 'DE', tripId: plan, planDate: dayOffset(d), fav: false, done: false, rating: 0 }));

    // Ein paar gesammelte Kennzeichen je Person
    members().forEach((m, k) => ['M', 'RO', 'TÖL', 'A', 'HH', 'S', 'B', 'GAP'].slice(0, 3 + k * 2).forEach(code =>
      save('plates', { ...D, id: `demo-pl-${m.id}-${code}`, by: m.id, set: 'de', code, at: Date.now() - k * 60000, tripId: trip })));
    ['I', 'NL', 'CH'].forEach(code => save('plates', { ...D, id: `demo-pl-${me()}-int-${code}`, by: me(), set: 'int', code, at: Date.now(), tripId: trip }));

    // Frist mit Erinnerung
    save('deadlines', { ...D, id: 'demo-d1', title: 'Test: Gasprüfung', due: dayOffset(20), repeat: 24, note: 'Beispiel für die Erinnerung', done: false });

    LS.set('trip.' + app.crewId(), trip);
    if (!LS.get('simPos', null)) LS.set('simPos', { lat: 45.7642, lng: 10.809 });
    toast('Testdaten angelegt: Reise „Test: Gardasee“');
    go('karte');
  };

  ACTIONS['demo-open'] = () => {
    LS.set('trip.' + app.crewId(), 'demo-trip');
    go('tagebuch');
  };

  ACTIONS['demo-remove'] = () => {
    if (!confirm('Alle Testdaten entfernen? Eure eigenen Einträge bleiben unberührt.')) return;
    let n = 0;
    Object.keys(S).forEach(coll => S[coll].filter(isDemo).forEach(d => { remove(coll, d.id); n++; }));
    S.entries.filter(isDemo).forEach(e => (e.photos || []).forEach(p => remove('photos', p.id)));
    toast(`${n} Testeinträge entfernt`);
    render();
  };
}
