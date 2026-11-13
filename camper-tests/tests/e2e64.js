const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  // Reise mit 10 Tagen, je zwei weit auseinanderliegende Stopps
  await p.evaluate(async crew => {
    const ch = [{ coll: 'trips', id: 'tst64', data: { id: 'tst64', name: 'Sachsen 64', start: '2026-07-01', end: '2026-07-10', color: '#A4462B', ended: true } }];
    for (let d = 1; d <= 10; d++) for (let k = 0; k < 2; k++) {
      const id = `s${d}_${k}`;
      ch.push({ coll: 'entries', id, data: { id, tripId: 'tst64', type: k ? 'stellplatz' : 'sight', title: `Tag ${d} ${k ? 'Platz' : 'Ziel'}`, text: 'Lorem ipsum dolor sit amet. '.repeat(8),
        date: `2026-07-${String(d).padStart(2, '0')}T${k ? '18' : '11'}:00`, lat: 50 + d * 0.3 + k * 0.1, lng: 10 + d * 0.5, photos: [] } });
    }
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: ch }) });
  }, crew);
  await p.reload(); await p.waitForTimeout(3000); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/reisen'; }); await p.waitForTimeout(800);
  await p.click('.trips >> text=Sachsen 64'); await p.waitForTimeout(1500);
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await p.waitForTimeout(1000);
  log('Zwei Spalten:', await p.evaluate(() => document.body.classList.contains('split')));
  // Pin von Tag 7 (Ziel) auf der Karte anklicken
  const target = await p.evaluate(() => {
    const els = [...document.querySelectorAll('#map .leaflet-marker-icon')];
    return els.length;
  });
  log('Pins auf der Karte:', target);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  // Marker finden, der zu „Tag 7 Platz“ gehört: über die Leaflet-Instanz ist das nicht direkt möglich, darum alle Pins durchprobieren
  const n = await p.$$eval('#map .leaflet-marker-icon', l => l.length);
  let hit = null;
  for (let i = 0; i < n && !hit; i++) {
    const before = await p.evaluate(() => scrollY);
    await p.click(`#map .leaflet-marker-icon >> nth=${i}`, { force: true }).catch(() => {}); await p.waitForTimeout(900);
    const flash = await p.$eval('.stop.flash, .day.flash', x => x.innerText.split('\n').find(l => /Tag \d+/.test(l))).catch(() => null);
    if (flash && await p.evaluate(() => scrollY) !== before) hit = flash;
    await p.keyboard.press('Escape');
  }
  log('Nach Klick auf einen Pin, hervorgehoben im Tagebuch:', hit);
  const inView = await p.$eval('.stop.flash, .day.flash', x => { const r = x.getBoundingClientRect(); return r.top > 0 && r.top < innerHeight; }).catch(() => false);
  log('Im Bild:', inView);
  await p.screenshot({ path: __dirname + '/shots55/karte-tagebuch.png' });
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
