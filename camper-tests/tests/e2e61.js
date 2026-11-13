const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 880 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(900); };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await go('#/heute'); log('Heute: Dienst-Zeile vorher:', !!(await p.$('.today-duty')));
  await go('#/dienste'); log('Dienste vorher:', await p.$$eval('.duties li', l => l.length));
  await p.click('[data-action=duty-toggle]'); await p.waitForTimeout(700);
  log('Dienste-Seite:', await p.$eval('main', x => x.innerText.replace(/\s+/g, ' ').slice(0, 140)));
  await p.screenshot({ path: __dirname + '/shots55/dienste-aus.png' });
  await go('#/heute'); log('Heute: Dienst-Zeile nachher:', !!(await p.$('.today-duty')));
  // Reise-Formular: Schalter steht auf aus, wieder einschalten
  await go('#/reisen'); await p.click('.trip-row.current [data-action=trip-form]');
  await p.waitForTimeout(500);
  await p.$eval('#sheet .swatches', x => x.scrollIntoView()); await p.screenshot({ path: __dirname + '/shots55/farben.png' });
  log('Farben:', await p.$$eval('#sheet .swatch', l => l.length));
  const box = await p.$('#sheet [name=duties]');
  log('Schalter im Reise-Formular:', box ? await box.isChecked() : 'fehlt');
  if (box) { await box.check(); await p.click('#sheet form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(800); }
  await go('#/dienste'); log('Dienste nach Einschalten im Formular:', await p.$$eval('.duties li', l => l.length));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
