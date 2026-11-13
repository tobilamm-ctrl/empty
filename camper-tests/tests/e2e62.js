const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(700); };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await go('#/mehr');
  log('Themen:', await p.$$eval('main h2.tile-sep', l => l.map(x => x.textContent)));
  log('Zeile oben vorher:', await p.$$eval('.recent-tile', l => l.length));
  for (const r of ['wetter', 'kasse', 'tickets', 'wetter', 'statistik', 'wetter']) { await go('#/' + r); }
  await go('#/mehr');
  log('Zuletzt benutzt:', await p.$$eval('.recent-tile', l => l.map(x => x.textContent.trim())));
  await p.screenshot({ path: __dirname + '/shots55/mehr-oben.png' });
  await p.click('[data-action=board-edit][data-k=mehr]'); await p.waitForTimeout(500);
  await p.click('[data-action=tiles-themes]'); await p.waitForTimeout(600);
  await p.click('[data-action=tiles-mode][data-m=haeufig]'); await p.waitForTimeout(500);
  await p.screenshot({ path: __dirname + '/shots55/mehr-bearbeiten.png' });
  await p.click('[data-action=board-edit][data-k=""] >> nth=0'); await p.waitForTimeout(500);
  log('Themen danach:', await p.$$eval('main h2.tile-sep', l => l.map(x => x.textContent)));
  log('Am häufigsten:', await p.$eval('.tile-sep', x => x.textContent), await p.$$eval('.recent-tile', l => l.map(x => x.textContent.trim())));
  await p.screenshot({ path: __dirname + '/shots55/mehr-themen.png', fullPage: true });
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
