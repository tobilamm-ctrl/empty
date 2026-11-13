const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE', geolocation: { latitude: 49.3, longitude: 10.1 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); localStorage.setItem('lp.showPlaces', 'false'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass|osrm/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  const P = [['Parkplatz', 'stellplatz', 50.02, 10.33], ['Schloss Weikersheim', 'poi', 49.48, 9.9], ['Nördlingen', 'poi', 48.85, 10.49], ['Karlsfelder See', 'poi', 48.22, 11.47], ['Dinkelsbühl', 'poi', 49.07, 10.32]];
  await p.evaluate(async ([crew, P]) => {
    const ch = [{ coll: 'trips', id: 'by67', data: { id: 'by67', name: 'Bayern 67', start: '2026-11-02', color: '#2E5E3A' } },
      ...P.map(([name, kind, lat, lng], i) => ({ coll: 'places', id: 'pl' + i, data: { id: 'pl' + i, name, kind, lat, lng, tripId: 'by67', createdAt: i, planDate: '', place: name, done: false, fav: false, features: [] } })),
      { coll: 'places', id: 'wish1', data: { id: 'wish1', name: 'Wunsch Ostsee', kind: 'poi', lat: 54.1, lng: 11.9, tripId: null, createdAt: 9 } }];
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: ch }) });
  }, [crew, P]);
  await p.reload(); await p.waitForTimeout(3000); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/reisen'; }); await p.waitForTimeout(800); await p.click('.trips >> text=Bayern 67'); await p.waitForTimeout(800);
  await p.evaluate(() => { location.hash = '#/karte'; }); await p.waitForTimeout(2500);
  log('Geplante Stopps auf der Karte:', await p.$$eval('#map .plan-pin', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
  log('Wunschliste (Schalter aus):', await p.$$eval('#map .pin-place', l => l.length));
  await p.screenshot({ path: __dirname + '/shots55/geplant.png' });
  // Reihenfolge: automatisch und von Hand
  await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(800);
  await p.click('[data-action=diary-mode][data-mode=planung]').catch(() => {}); await p.waitForTimeout(600);
  const names = () => p.$$eval('.plan-stop strong', l => l.map(x => x.textContent));
  log('Vorher:', (await names()).join(' → '));
  await p.click('[data-action=plan-sort]'); await p.waitForTimeout(500);
  await p.click('[data-action=plan-auto]'); await p.waitForTimeout(6500);
  log('Automatisch (Standort bei Dinkelsbühl/Feuchtwangen):', (await names()).join(' → '), '|', await p.$eval('#toast, .toast', x => x.textContent).catch(() => ''));
  // Ersten Stopp am Griff hinter den dritten ziehen
  const g = await (await p.$('.plan-stop >> nth=0')).$('.plan-grip'), gb = await g.boundingBox();
  const t3 = await (await p.$('.plan-stop >> nth=2')).boundingBox();
  await p.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2); await p.mouse.down();
  for (let i = 1; i <= 10; i++) await p.mouse.move(gb.x + gb.width / 2, gb.y + (t3.y + t3.height * 0.7 - gb.y) * i / 10);
  await p.screenshot({ path: __dirname + '/shots55/planung-ziehen.png' });
  await p.mouse.up(); await p.waitForTimeout(800);
  log('Ersten hinter den dritten gezogen:', (await names()).join(' → '));
  await p.screenshot({ path: __dirname + '/shots55/planung-sortieren.png', fullPage: true });
  await p.click('[data-action=plan-sort]'); await p.waitForTimeout(500);
  await p.evaluate(() => { location.hash = '#/karte'; }); await p.waitForTimeout(1500);
  log('Karte jetzt:', await p.$$eval('#map .plan-pin', l => l.map(x => x.innerText.replace(/\s+/g, ' ')).join(', ')));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
