const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const JPG = require('fs').readFileSync(__dirname + '/gps-foto.jpg');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  // OpenStreetMap-Antwort wie für einen Campingplatz am Gardasee
  await ctx.route(/nominatim\.openstreetmap\.org\/reverse/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({
    category: 'tourism', type: 'camp_site', name: 'Camping La Rocca',
    address: { tourism: 'Camping La Rocca', town: 'Bardolino', county: 'Verona', country_code: 'it' } }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(900); };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  // Neue Reise, Start bleibt auf heute
  await go('#/reisen'); await p.click('[data-action=trip-form]'); await p.waitForTimeout(400);
  await p.fill('form[data-form=trip] [name=name]', 'Ostern Gardasee (Test 56)'); await p.click('form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(1500);
  if (await p.$('#sheet[open]')) { await p.evaluate(() => document.querySelector('#sheet').close()); }
  await go('#/tagebuch');
  // Foto hineinziehen
  const dt = await p.evaluateHandle(b64 => { const d = new DataTransfer(); const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    d.items.add(new File([bin], 'IMG_0401.jpg', { type: 'image/jpeg' })); return d; }, JPG.toString('base64'));
  await p.dispatchEvent('main', 'dragover', { dataTransfer: dt }); await p.dispatchEvent('main', 'drop', { dataTransfer: dt }); await p.waitForTimeout(2500);
  const f = await p.evaluate(() => { const f = document.querySelector('#sheet form[data-form=entry]'); return f && { title: f.title.value, date: f.date.value, place: f.place.value, lat: f.lat.value,
    hints: [...f.querySelectorAll('.title-hints .chip')].map(x => x.textContent) }; });
  log('Formular:', JSON.stringify(f));
  await p.screenshot({ path: __dirname + '/shots55/titel-vorschlag.png' });
  await p.click('.title-hints .chip >> nth=2'); log('Nach Tipp auf Vorschlag 3:', await p.$eval('#sheet [name=title]', x => x.value));
  await p.click('.title-hints .chip >> nth=0');
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(1500);
  log('Reisezeitraum-Frage:', await p.$eval('#sheet[open]', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'keine'));
  await p.screenshot({ path: __dirname + '/shots55/zeitraum.png' });
  await p.click('#sheet [data-action=trip-range-set]'); await p.waitForTimeout(600);
  log('Reise jetzt:', JSON.stringify(await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lp.trip') || 'null'); return s; })));
  await go('#/kalender'); await p.waitForTimeout(500);
  await p.click('[data-action=cal-year][data-y="2026"]').catch(() => {});
  log('Kalendertage der Reise:', await p.$$eval('.cal-day.trip', l => l.filter(x => /Test 56/.test(x.title)).map(x => x.dataset.day)));
  await p.screenshot({ path: __dirname + '/shots55/kalender.png', fullPage: true });
  // aufräumen
  await go('#/reisen'); const ed = await p.$('text=Ostern Gardasee (Test 56)');
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
