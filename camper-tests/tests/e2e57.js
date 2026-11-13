const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const img = n => fs.readFileSync(__dirname + `/${n}.jpg`).toString('base64');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/nominatim\.openstreetmap\.org\/reverse/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({
    category: 'tourism', type: 'camp_site', name: 'Camping La Rocca', address: { town: 'Bardolino', country_code: 'it' } }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(900); };
  const drop = async names => {
    const dt = await p.evaluateHandle(list => { const d = new DataTransfer(); list.forEach(([n, b64]) => d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], n + '.jpg', { type: 'image/jpeg' }))); return d; },
      names.map(n => [n, img(n)]));
    await p.dispatchEvent('main', 'dragover', { dataTransfer: dt }); await p.dispatchEvent('main', 'drop', { dataTransfer: dt }); await p.waitForTimeout(2500);
  };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await go('#/reisen'); await p.click('[data-action=trip-form]'); await p.waitForTimeout(400);
  await p.fill('form[data-form=trip] [name=name]', 'Fototest 57'); await p.fill('form[data-form=trip] [name=start]', '2026-04-01');
  await p.fill('form[data-form=trip] [name=end]', '2026-04-05'); await p.click('form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(1500);
  if (await p.$('#sheet[open]')) await p.evaluate(() => document.querySelector('#sheet').close());
  await go('#/tagebuch');
  // 1. Einzelnes Foto 10:50 -> neuer Eintrag
  await drop(['a1050']); await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(1500);
  if (await p.$('#sheet[open]')) await p.evaluate(() => document.querySelector('#sheet').close());
  // 2. Foto 10:57 -> soll Dazulegen anbieten
  await drop(['a1057']);
  log('Frage:', await p.$eval('#sheet[open]', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'keine'));
  await p.screenshot({ path: __dirname + '/shots55/dazulegen.png' });
  await p.click('#sheet .where-list .hit'); await p.waitForTimeout(2000);
  const es = await p.evaluate(() => 0);
  // 3. Mehrere Fotos
  await drop(['b1000', 'b1030', 'b1300', 'b1500']);
  log('Einsortieren:', JSON.stringify(await p.$$eval('.import-list li', l => l.map(li => [li.querySelector('small').textContent, li.querySelector('select').selectedOptions[0].textContent]))));
  await p.screenshot({ path: __dirname + '/shots55/einsortieren.png' });
  await p.click('form[data-form=photo-import] .sheet-foot .primary'); await p.waitForTimeout(2500);
  await p.screenshot({ path: __dirname + '/shots55/nach-import.png' });
  log('Toast/Einträge der Reise:', await p.evaluate(async () => {
    const r = await fetch('api/?a=sync&crew=' + JSON.parse(localStorage.getItem('lp.crew')) + '&since=0', { headers: { 'X-Lammping': '1' } }); const j = await r.json();
    const trip = j.docs.find(d => d.coll === 'trips' && d.data && d.data.name === 'Fototest 57');
    return j.docs.filter(d => d.coll === 'entries' && d.data && d.data.tripId === trip.data.id).map(d => `${d.data.date} ${d.data.title} (${d.data.photos.length} Fotos)`);
  }));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
