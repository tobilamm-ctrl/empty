const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
  let lastWps = 0;
  await ctx.route(/router\.project-osrm\.org/, r => {
    const c = r.request().url().split('/driving/')[1].split('?')[0].split(';').map(x => x.split(',').map(Number));
    lastWps = c.length; let d = 0;
    for (let i = 1; i < c.length; i++) d += Math.hypot((c[i][0] - c[i - 1][0]) * 55, (c[i][1] - c[i - 1][1]) * 111) * 1000 * 1.25;
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: d, geometry: { coordinates: c } }] }) });
  });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1000); };
  const close = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  // Reise mit Übernachtungen und Ausflügen (Sehenswertes, Baden) sowie Notizen am Startpunkt mit Fotoort
  const E = [['2026-06-07T10:00', 'notiz', 49.45, 11.08], ['2026-06-07T18:00', 'stellplatz', 50.1, 8.7], ['2026-06-08T11:00', 'sight', 50.3, 8.2], ['2026-06-08T15:00', 'baden', 49.9, 8.9],
    ['2026-06-08T19:00', 'stellplatz', 51.4, 6.8], ['2026-06-09T12:00', 'tank', 51.9, 5.9], ['2026-06-09T18:00', 'stellplatz', 52.3, 4.9]];
  await p.evaluate(async ([crew, E]) => {
    const ch = [{ coll: 'trips', id: 'nl26', data: { id: 'nl26', name: 'Holland 2026', start: '2026-06-07', end: '2026-06-09', color: '#3E7B32', ended: true } },
      ...E.map(([d, type, lat, lng], i) => ({ coll: 'entries', id: 'h' + i, data: { id: 'h' + i, tripId: 'nl26', type, title: type === 'notiz' ? '' : type + i, date: d, lat, lng, photos: [] } })),
      ...[0, 1, 2].map(i => ({ coll: 'entries', id: 'hn' + i, data: { id: 'hn' + i, tripId: 'nl26', type: 'notiz', title: '', date: '2026-06-08T2' + i + ':00', lat: 49.45, lng: 11.08, photos: i ? [] : [{ id: 'ph1', thumb: '', lat: 51.5, lng: 6.9 }] } }))];
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: ch }) });
  }, [crew, E]);
  await p.reload(); await p.waitForTimeout(3000); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await go('#/reisen'); await p.click('.trips >> text=Holland 2026'); await p.waitForTimeout(800); await close();
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await p.waitForTimeout(400);
  // Mehrfachauswahl: drei Notizen am Startpunkt
  const notes = await p.$$('li:has([data-action=open-entry]), .entry-list li, [data-entry]');
  log('Einträge im Tagebuch:', notes.length);
  // Straße folgen
  await p.click('[data-action=trip-later]'); await p.waitForTimeout(400); await p.click('#sheet [data-a=route-roads]'); await p.waitForTimeout(500);
  log('Fenster:', await p.$$eval('#sheet [name=mode] + span', l => l.map(x => x.textContent.replace(/\s+/g, ' ').slice(0, 40) + ' … ' + x.textContent.match(/\(\d+ Punkte[^)]*\)/)[0])));
  await p.screenshot({ path: __dirname + '/shots55/strasse2.png' });
  await p.fill('#sheet [name=odo]', '850');
  await p.click('#sheet form[data-form=route-roads] .sheet-foot .primary'); await p.waitForTimeout(2000);
  log('Wegpunkte an OSRM (ausgewogen):', lastWps, 'Toast:', await p.$eval('#toast, .toast', x => x.textContent).catch(() => '?'));
  log('Kopf:', await p.$eval('.facts', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '?'));
  // alle Punkte
  await p.click('[data-action=trip-later]'); await p.waitForTimeout(400); await p.click('#sheet [data-a=route-roads]'); await p.waitForTimeout(500);
  await p.click('#sheet [name=mode][value=alle]'); await p.waitForTimeout(400);
  log('Tacho bleibt nach Umschalten:', await p.$eval('#sheet [name=odo]', x => x.value));
  await p.click('#sheet form[data-form=route-roads] .sheet-foot .primary'); await p.waitForTimeout(2000);
  log('Wegpunkte an OSRM (alle):', lastWps);
  // Rückgängig
  await p.click('[data-action=trip-later]'); await p.waitForTimeout(400); await p.click('#sheet [data-a=route-roads]'); await p.waitForTimeout(500);
  log('Hinweis:', await p.$eval('#sheet .hint', x => x.innerText.replace(/\s+/g, ' ')));
  await p.click('#sheet [data-action=route-roads-undo]'); await p.waitForTimeout(800);
  log('Strecken danach:', await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json(); await new Promise(r => setTimeout(r, 1)); return j.docs.filter(d => d.coll === 'tracks' && d.data && d.data.tripId === 'nl26').length; }, crew));
  // Karte: mehrfach wechseln, dann zählen (nur Holland 2026: 10 Einträge, davon 4 am Startpunkt)
  await go('#/karte'); await p.waitForTimeout(1200);
  const count = () => p.evaluate(() => { let n = 0; document.querySelectorAll('#map .cluster b').forEach(b => { n += +b.textContent; });
    return { pins: document.querySelectorAll('#map .leaflet-marker-icon .pin').length, inClusters: n }; });
  log('Vorher:', JSON.stringify(await count()));
  for (let i = 0; i < 4; i++) {
    await p.click('.map-toggle [data-scope=all]'); await p.waitForTimeout(700);
    await p.click('.map-toggle [data-scope=trip]'); await p.waitForTimeout(700);
  }
  await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(600); await p.evaluate(() => { location.hash = '#/karte'; }); await p.waitForTimeout(1200);
  log('Nach 4× Wechseln:', JSON.stringify(await count()));
  await p.screenshot({ path: __dirname + '/shots55/karte-wechsel.png' });
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
