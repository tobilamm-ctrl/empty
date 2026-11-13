const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE', geolocation: { latitude: 60.4, longitude: 7.1, accuracy: 5 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim/, r => r.fulfill({ status: 404, body: '' }));
  let osrmCalls = 0;
  // Nachgebildete Straßenführung: Umweg über einen Zwischenpunkt je Abschnitt
  await ctx.route(/router\.project-osrm\.org/, r => {
    osrmCalls++;
    const c = r.request().url().split('/driving/')[1].split('?')[0].split(';').map(x => x.split(',').map(Number));
    const coords = []; let d = 0;
    for (let i = 0; i < c.length; i++) { coords.push(c[i]); if (i < c.length - 1) { coords.push([(c[i][0] + c[i + 1][0]) / 2 + 0.05, (c[i][1] + c[i + 1][1]) / 2 - 0.03]); d += 25000; } }
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: d, geometry: { coordinates: coords } }] }) });
  });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1000); };
  const close = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  // Vergangene Reise: 10.–30. August 2025, nur ein Stellplatz-Eintrag, archiviert, ohne Enddatum
  const entries = [['2025-08-10T15:00', 'stellplatz', 60.39, 5.32, 'Bergen'], ['2025-08-14T11:00', 'sight', 60.47, 7.07, 'Eidfjord'], ['2025-08-20T12:00', 'sight', 60.43, 7.32, 'Vøringsfossen'], ['2025-08-30T10:00', 'notiz', 59.91, 10.75, 'Oslo']];
  await p.evaluate(async ([crew, entries]) => {
    const changes = [{ coll: 'trips', id: 'nor25', data: { id: 'nor25', name: 'Norwegen 2025', start: '2025-08-10', color: '#7B4F96', archived: true, ended: true } },
      ...entries.map(([d, type, lat, lng, title], i) => ({ coll: 'entries', id: 'n' + i, data: { id: 'n' + i, tripId: 'nor25', type, title, date: d, lat, lng, photos: [] } }))];
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes }) });
  }, [crew, entries]);
  await p.reload(); await p.waitForTimeout(3000); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  // 1. Nächte
  await go('#/statistik');
  log('Nächte pro Jahr:', await p.$$eval('.stat-h + .bars .bar-row, .bars > *', l => l.slice(0, 4).map(x => x.innerText.replace(/\s+/g, ' '))).catch(() => '?'));
  log('Norwegen 2025:', await p.$$eval('.ledger li', l => l.map(x => x.innerText.replace(/\s+/g, ' ')).filter(t => /Norwegen 2025/.test(t))));
  // 2. Der Straße folgen
  await p.evaluate(() => { localStorage.setItem('lp.trip', JSON.stringify('nor25')); });
  await go('#/reisen'); await p.click('text=Norwegen 2025').catch(() => {}); await p.waitForTimeout(800);
  await go('#/tagebuch'); await close();
  await p.click('[data-action=trip-later]'); await p.waitForTimeout(400);
  await p.click('#sheet [data-a=route-roads]'); await p.waitForTimeout(500);
  log('Straße folgen Fenster:', await p.$eval('#sheet[open]', x => x.innerText.replace(/\s+/g, ' ').slice(0, 160)));
  await p.click('#sheet form[data-form=route-roads] .sheet-foot .primary'); await p.waitForTimeout(2500);
  log('OSRM-Anfragen:', osrmCalls, 'Strecke:', await p.$eval('.facts', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '?'));
  await go('#/karte'); await p.waitForTimeout(1500);
  await p.screenshot({ path: __dirname + '/shots55/strasse.png' });
  log('Linien auf der Karte:', await p.$$eval('#map path.leaflet-interactive', l => l.length));
  // 3. Wanderung mit Fotos (Standorte)
  await go('#/tagebuch'); await close();
  await p.evaluate(() => { const d = new DataTransfer(); }); 
  const dt = await p.evaluateHandle(b64 => { const d = new DataTransfer(); d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'h.jpg', { type: 'image/jpeg' })); return d; }, fs.readFileSync(__dirname + '/b1000.jpg').toString('base64'));
  await p.dispatchEvent('main', 'dragover', { dataTransfer: dt }); await p.dispatchEvent('main', 'drop', { dataTransfer: dt }); await p.waitForTimeout(2500);
  if (await p.$('#sheet [data-action=where-new]')) { await p.click('#sheet [data-action=where-new]'); await p.waitForTimeout(1200); }
  await p.click('#sheet input[name=type][value=wanderung] + span').catch(() => {}); await p.waitForTimeout(300);
  log('Knopf „Weg aus Fotos“ sichtbar:', await p.$eval('#sheet .hike-path', x => !x.hidden));
  await p.setInputFiles('#sheet [data-action=add-photos]:not([capture])', ['b1030', 'b1300'].map(n => __dirname + `/${n}.jpg`)); await p.waitForTimeout(2500);
  await p.setInputFiles('#sheet [data-action=hike-path]', [__dirname + '/b1500.jpg']); await p.waitForTimeout(800);
  await p.fill('#sheet [name=title]', 'Tour zum Wasserfall');
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(1500); await close();
  const e = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json();
    const x = j.docs.filter(d => d.coll === 'entries' && d.data && d.data.title === 'Tour zum Wasserfall').pop(); return x && { photos: x.data.photos.map(p => [p.lat, p.lng, p.at]), path: x.data.path }; }, crew);
  log('Wanderung gespeichert:', JSON.stringify(e));
  await go('#/karte'); await p.waitForTimeout(1500);
  log('Wanderpunkte auf der Karte:', await p.$$eval('#map path.leaflet-interactive[fill="#3E7B32"]', l => l.length));
  // 4. Aufzeichnen (Wanderung)
  await go('#/reisen'); await p.click('.trips >> text=Packtest 54'); await p.waitForTimeout(800); await close();
  await go('#/tagebuch'); await close();
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await p.waitForTimeout(500);
  log('Werkzeuge:', await p.$$eval('.trip-tools .tool small', l => l.map(x => x.textContent)), await p.$eval('.trip-head h1, h1', x => x.textContent).catch(() => '?'));
  await go('#/karte'); await p.click('[data-action=here-menu] >> visible=true'); await p.waitForTimeout(500);
  await p.click('#sheet [data-action=rec-start][data-kind=hike]'); await p.waitForTimeout(800);
  for (let i = 1; i <= 8; i++) { await ctx.setGeolocation({ latitude: 60.4 + i * 0.0003, longitude: 7.1 + i * 0.0002, accuracy: 5 }); await p.waitForTimeout(400); }
  log('Leiste:', await p.$eval('.rec-bar', x => x.innerText));
  await p.screenshot({ path: __dirname + '/shots55/aufnahme.png' });
  await p.click('.rec-bar'); await p.waitForTimeout(400);
  await p.click('#sheet [data-action=rec-stop]'); await p.waitForTimeout(1500);
  log('Danach Eintragsformular:', await p.$eval('#sheet form[data-form=entry]', f => [f.querySelector('[name=type]:checked').value, f.querySelector('[name="x_wanderung_km"]')?.value]).catch(() => 'kein Formular'));
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary').catch(() => {}); await p.waitForTimeout(1500);
  const tr = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json();
    return j.docs.filter(d => d.coll === 'tracks' && d.data && d.data.rec).map(d => ({ kind: d.data.kind, km: d.data.km, n: d.data.pts.split(';').length, entry: !!d.data.entryId, recording: d.data.recording })); }, crew);
  log('Aufgezeichnete Strecke:', JSON.stringify(tr));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
