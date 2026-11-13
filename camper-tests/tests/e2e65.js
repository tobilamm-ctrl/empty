const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(1200);
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await p.waitForTimeout(800);
  const card = await p.$('section.today');
  log('Heute-Karte:', card ? await card.evaluate(x => x.innerText.replace(/\s+/g, ' ')) : 'fehlt');
  log('Symbole:', await p.$$eval('.today-icons .today-ic', l => l.map(x => x.getAttribute('aria-label'))));
  if (card) await card.screenshot({ path: __dirname + '/shots55/heute-kompakt.png' });
  for (const a of ['hl-form', 'q-form', 'pin-new', 'day-share']) {
    await p.click(`.today-icons [data-action=${a}]`); await p.waitForTimeout(600);
    log(a, '→', await p.$eval('#sheet[open] h2', x => x.textContent).catch(() => 'kein Fenster'));
    await p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); }); await p.waitForTimeout(300);
  }
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
