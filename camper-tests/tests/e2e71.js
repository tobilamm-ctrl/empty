const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE' });
    await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); });
    await ctx.route(/tile\.openstreetmap|nominatim|overpass/, r => r.fulfill({ status: 404, body: '' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); return p; };
  const t = await mk();
  await t.goto(URL); await t.fill('[name=login]', 'tobi'); await t.fill('[name=password]', 'segeln1'); await t.click('form[data-form=login] button'); await t.waitForTimeout(2500);
  // Konto ohne Crew, aber „darf Crews gründen“
  const r = await t.evaluate(async () => (await fetch('api/?a=user-save', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Justus', login: 'justus71', password: 'geheim1', canCash: true, canFound: true, isAdmin: false }) })).json());
  log('Konto:', JSON.stringify(r).slice(0, 60));
  const j = await mk();
  await j.goto(URL); await j.fill('[name=login]', 'justus71'); await j.fill('[name=password]', 'geheim1'); await j.click('form[data-form=login] button'); await j.waitForTimeout(2500);
  log('Seite:', await j.$eval('section.login', x => x.innerText.replace(/\s+/g, ' ').slice(0, 200)));
  await j.screenshot({ path: __dirname + '/shots55/nocrew.png' });
  await j.click('form[data-form=nocrew-found] button'); await j.waitForTimeout(4000);
  while (await j.$('.stamp-pop')) { await j.click('.stamp-pop [data-sp]'); await j.waitForTimeout(150); }
  log('Danach in der App:', await j.evaluate(() => location.hash), await j.$eval('.crew-name, .trip-switch, header', x => x.innerText.slice(0, 40).replace(/\s+/g, ' ')).catch(() => '?'));
  const me = await j.evaluate(async () => (await (await fetch('api/?a=me', { headers: { 'X-Lammping': '1' } })).json()).crews);
  log('Crews von Justus:', JSON.stringify(me));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
