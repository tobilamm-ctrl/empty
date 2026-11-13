const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL); await p.waitForSelector('form[data-form=login]');
  await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/verwaltung'; }); await p.waitForTimeout(1200);
  const login = 'karte' + Date.now().toString().slice(-5);
  await p.click('[data-action=user-form]:not([data-id])'); await p.waitForTimeout(400);
  await p.fill('form[data-form=user] [name=name]', 'Karla'); await p.fill('form[data-form=user] [name=login]', login); await p.fill('form[data-form=user] [name=newPw]', 'Sonne123');
  await p.click('form[data-form=user] .sheet-foot .primary'); await p.waitForTimeout(1200);
  log('Fenster:', await p.$eval('#sheet[open] h2', x => x.textContent).catch(() => 'keins'));
  await p.screenshot({ path: __dirname + '/shots53/angelegt.png' });
  await p.click('#sheet [data-action=access-card]'); await p.waitForTimeout(800);
  log('gedruckt:', await p.evaluate(() => window.__printed), 'Karte:', await p.$eval('#printDoc .ac-card', x => x.innerText.replace(/\s+/g, ' ').slice(0, 200)).catch(() => 'fehlt'));
  await p.emulateMedia({ media: 'print' }); await p.setViewportSize({ width: 794, height: 1123 }); await p.waitForTimeout(400);
  await p.screenshot({ path: __dirname + '/shots53/karte-druck.png', fullPage: true });
  await p.emulateMedia({ media: 'screen' }); await p.setViewportSize({ width: 400, height: 860 });
  await p.evaluate(() => document.body.classList.remove('printing'));
  // Bearbeiten: Karte ohne Passwort
  await p.click('#sheet [data-action=close]').catch(() => {}); await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = '#/verwaltung'; }); await p.waitForTimeout(800);
  const uid = await p.$$eval('.people [data-action=user-form]', (l, n) => (l.find(x => x.textContent.includes(n)) || {}).dataset?.id, 'Karla');
  await p.click(`.people [data-action=user-form][data-id="${uid}"]`); await p.waitForTimeout(400);
  await p.click('#sheet [data-action=access-card]'); await p.waitForTimeout(500);
  log('Bearbeiten-Karte, Passwortlinie:', !!(await p.$('#printDoc .ac-line')), 'gedruckt:', await p.evaluate(() => window.__printed));
  await p.evaluate(() => document.body.classList.remove('printing'));
  await p.click('#sheet [data-action=del-user]'); await p.waitForTimeout(800); log('Testperson gelöscht');
  // QR-Link füllt den Anmeldenamen aus
  const ctx2 = await b.newContext({ viewport: { width: 400, height: 860 } }); const p2 = await ctx2.newPage();
  await p2.goto(URL + '?login=' + login); await p2.waitForSelector('form[data-form=login]');
  log('vorausgefüllt:', await p2.$eval('[name=login]', x => x.value));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
