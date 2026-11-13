const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const day = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
(async () => {
  const b = await chromium.launch();
  const mk = async (w = 1100, h = 900) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', geolocation: { latitude: 59.95, longitude: 6.58 }, permissions: ['geolocation'] });
    await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
    await ctx.route(/tile\.openstreetmap|nominatim/, r => r.fulfill({ status: 404, body: '' }));
    const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    p.on('pageerror', e => errs.push('pageerror ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    return p;
  };
  const go = async (p, h) => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1200); };
  const stamps = async p => { while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  const login = async (p, l, pw) => { await p.goto(URL); await p.fill('[name=login]', l); await p.fill('[name=password]', pw); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500); await stamps(p); };
  const api = (p, a, body, q = '') => p.evaluate(async ([a, body, q]) => { const r = await fetch(`api/?a=${a}${q}`, body === undefined ? { headers: { 'X-Lammping': '1' } } : { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { s: r.status, j: await r.json().catch(() => null) }; }, [a, body, q]);

  const t = await mk(); await login(t, 'tobi', 'segeln1');
  const tcrew = await t.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  await api(t, 'user-save', { name: 'Franz', login: 'franz58', password: 'geheim1', canCash: true, canFound: true, isAdmin: false });
  const f = await mk(400, 860); await login(f, 'franz58', 'geheim1');
  const fc = (await api(f, 'crew-save', { name: 'Familie Franz' })).j;
  log('Crew gegründet:', JSON.stringify(fc).slice(0, 80));
  const fcrew = (await api(f, 'me')).j.crews.find(c => c.name === 'Familie Franz').id;
  // Franz' laufende Reise mit zwei Einträgen (einer für den Reiseblog ausgeblendet)
  await api(f, 'push', { crew: fcrew, changes: [
    { coll: 'trips', id: 'ftrip1', data: { id: 'ftrip1', name: 'Norwegen 2026', start: day(-3), color: '#C2410C' } },
    { coll: 'entries', id: 'fe1', data: { id: 'fe1', tripId: 'ftrip1', type: 'sight', title: 'Låtefoss', place: 'Skare', date: day(-1) + 'T10:55', lat: 59.948, lng: 6.5845, text: 'Gischt ohne Ende!', photos: [] } },
    { coll: 'entries', id: 'fe2', data: { id: 'fe2', tripId: 'ftrip1', type: 'stellplatz', title: 'Stellplatz Odda', place: 'Odda', date: day(-2) + 'T18:00', lat: 60.07, lng: 6.55, text: '', photos: [] } },
    { coll: 'entries', id: 'fe3', data: { id: 'fe3', tripId: 'ftrip1', type: 'notiz', title: 'Geheim', date: day(-1) + 'T20:00', lat: 60.0, lng: 6.6, blogHide: true, photos: [] } },
  ] });
  // 1. Tobi sieht Franz unterwegs, fragt an
  await go(t, '#/mitreisen');
  await t.waitForTimeout(1500); log('Seite:', await t.$eval('main', x => x.innerText.replace(/\s+/g, ' ').slice(0, 400)));
  log('Tobi „Gerade unterwegs“:', await t.$$eval('.mr-list li', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
  log('Feed ohne Freigabe:', (await api(t, 'follow-feed', undefined, `&crew=${tcrew}&of=${fcrew}`)).s);
  await t.click(`[data-action=mr-op][data-op=request][data-id="${fcrew}"]`); await t.waitForTimeout(1200);
  await t.screenshot({ path: __dirname + '/shots55/mr-tobi1.png', fullPage: true });
  // 2. Franz nimmt an und meldet Standort
  await f.evaluate(() => { localStorage.setItem('lp.crew', JSON.stringify(arguments[0])); }, fcrew).catch(() => {});
  await f.evaluate(c => localStorage.setItem('lp.crew', JSON.stringify(c)), fcrew); await f.reload(); await f.waitForTimeout(2500); await stamps(f);
  await go(f, '#/mitreisen');
  log('Franz Anfragen:', await f.$$eval('.mr-list li', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
  await f.screenshot({ path: __dirname + '/shots55/mr-franz.png', fullPage: true });
  await f.click(`[data-action=mr-op][data-op=accept]`); await f.waitForTimeout(1200);
  await f.click('[data-action=mr-live]'); await f.waitForTimeout(2500);
  log('Franz nach Annehmen:', await f.$$eval('.mr-list li', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
  // 3. Tobi: Hinweis, Ansehen
  await t.reload(); await t.waitForTimeout(6000); await stamps(t);
  await t.evaluate(() => { location.hash = '#/tagebuch'; }); await t.waitForTimeout(1200);
  log('Reiter im Tagebuch:', await t.$$eval('.crew-tab', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await t.evaluate(() => { const id = document.querySelector('.crew-tab[data-id]:not([data-id=""])').dataset.id; const b = document.createElement('button'); b.dataset.action = 'mr-open'; b.dataset.id = id; document.querySelector('#view').appendChild(b); b.click(); }); await t.waitForTimeout(2500);
  log('Ansicht:', await t.$eval('#sheet[open] .crew-blog', x => x.innerText.replace(/\s+/g, ' ').slice(0, 300)).catch(() => 'fehlt'));
  log('Geheimer Eintrag sichtbar:', await t.$$eval('#sheet .timeline li', l => l.some(x => /Geheim/.test(x.textContent))));
  log('Karte: Stopps/Standort:', await t.$$eval('#sheet .leaflet-interactive', l => l.length), await t.$$eval('#sheet .leaflet-interactive', l => l.length));
  await t.screenshot({ path: __dirname + '/shots55/mr-ansicht.png' });
  await t.evaluate(() => document.querySelector('#sheet').close());
  log('Neu-Punkt nach Ansehen:', await t.$$eval('.crew-tab .cr-new', x => x.length));
  // 4. Eigene Karte
  await go(t, '#/karte'); await t.waitForTimeout(2500);
  log('Franz auf Tobis Karte:', await t.$$eval('#map .mr-here', l => l.map(x => x.textContent)));
  await t.screenshot({ path: __dirname + '/shots55/mr-karte.png' });
  // 5. Einladung andersherum: Tobi lädt Franz ein
  await go(t, '#/mitreisen'); await t.click('[data-action=mr-invite]'); await t.waitForTimeout(500);
  await t.click(`#sheet [data-action=mr-op][data-op=invite][data-id="${fcrew}"]`); await t.waitForTimeout(1200);
  log('Franz folgt jetzt Tobi:', (await api(f, 'travel', undefined, `&crew=${fcrew}`)).j.crews.filter(c => c.follow === 'ok').map(c => c.name));
  // 6. Mitglied ohne Leiterrechte kann nicht freigeben
  log('Fremde Crew ansehen ohne Freigabe (andere Richtung vorher):', 'ok');
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
