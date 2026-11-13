const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); localStorage.removeItem('lp.kniffel'); });
  await ctx.route(/open-meteo|overpass|nominatim|frankfurter|tile\./, r => r.fulfill({ contentType: 'application/json', body: '{}' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console ' + m.text()); });
  p.on('dialog', d => d.accept());
  const shot = async (n, full = false) => { await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/shots47/' + n + '.png', fullPage: full }); };
  const game = async g => { await p.evaluate(() => { location.hash = '#/spiele'; }); await p.waitForTimeout(600); const back = await p.$('[data-action=game-open][data-g=""]'); if (back) { await back.click(); await p.waitForTimeout(400); } await p.click(`[data-action=game-open][data-g=${g}]`); await p.waitForTimeout(600); };
  const txt = async sel => (await p.innerText(sel)).replace(/\s+/g, ' ');
  await p.goto(URL); await p.waitForSelector('form[data-form=login]');
  await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1000); };
  await go('#/einstellungen'); await p.click('[data-action=demo-open]'); await p.waitForTimeout(1200);
  await go('#/tagebuch'); const seg = await p.$('[data-action=diary-mode][data-mode=tagebuch]'); if (seg) { await seg.click(); await p.waitForTimeout(700); }
  log('Leiste:', await p.$$eval('.trip-tools .tool small', l => l.map(x => x.textContent)));
  log('Zeile:', await p.$$eval('.diary-btns .chip', l => l.map(x => x.textContent.trim())));
  const row = await p.locator('.diary-btns').boundingBox(); log('Zeilenhöhe:', Math.round(row.height));
  log('Jetzt da:', !!(await p.$('.day-jump .jetzt')), 'alte Filterreihe:', !!(await p.$('.diary-chips:not(.filter-pop)')));
  await p.locator('.trip-tools').scrollIntoViewIfNeeded(); await shot('kopf');
  await p.click('[data-action=diary-filter-open]'); await p.waitForTimeout(400);
  log('Filter offen:', await p.$$eval('.filter-pop .chip', l => l.map(x => x.textContent.trim())));
  await shot('filter');
  await p.click('.filter-pop [data-f=stellplatz]'); await p.waitForTimeout(500);
  log('Gefiltert:', await p.$eval('[data-action=diary-filter-open]', x => x.textContent.trim()), 'Pop zu:', !(await p.$('.filter-pop')), 'Einträge:', await p.$$eval('.timeline .stop, .timeline li:not(.day)', l => l.length));
  await p.click('[data-action=diary-filter-open]'); await p.waitForTimeout(300); await p.click('.filter-pop [data-f=alle]'); await p.waitForTimeout(500);
  // Scrollen und Jetzt
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(800);
  const jb = await p.locator('.day-jump .jetzt').boundingBox(); log('Jetzt sichtbar unten:', jb && jb.y > 0 && jb.y < 300);
  await shot('scroll');
  await p.click('.day-jump .jetzt'); await p.waitForTimeout(1500); log('Nach Jetzt scrollY:', await p.evaluate(() => scrollY));
  // Nach der Reise
  await p.click('[data-action=trip-later]'); await p.waitForTimeout(500);
  log('Nach der Reise:', await p.$$eval('.later-rows b', l => l.map(x => x.textContent)));
  await shot('nachreise');
  await p.click('.later-rows [data-a=open-buch]'); await p.waitForTimeout(1000); log('Buch:', await p.evaluate(() => location.hash));
  // Packliste
  await go('#/tagebuch'); await p.click('[data-action=pack-next]'); await p.waitForTimeout(1000);
  log('Packliste:', await p.evaluate(() => location.hash), await p.$eval('.list-head h2', x => x.textContent), await p.$eval('[data-list=packnext] input', x => x.placeholder));
  await p.fill('[data-list=packnext] input', 'Wäscheklammern'); await p.press('[data-list=packnext] input', 'Enter'); await p.waitForTimeout(600);
  log('Eintrag:', await p.$$eval('.checklist li .txt', l => l.map(x => x.textContent)).catch(() => []));
  await p.click('[data-action=list-form][data-id=packnext]'); await p.waitForTimeout(400); log('Löschen-Knopf:', !!(await p.$('#sheet [data-action=del-list]'))); await p.click('#sheet [data-action=close]');
  await shot('packliste');
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
