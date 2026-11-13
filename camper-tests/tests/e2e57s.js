const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: '{"address":{"town":"Skare","country_code":"no"}}' }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(800);
  const dt = await p.evaluateHandle(b64 => { const d = new DataTransfer(); d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'x.jpg', { type: 'image/jpeg' })); return d; },
    fs.readFileSync(__dirname + '/a1050.jpg').toString('base64'));
  await p.dispatchEvent('main', 'dragover', { dataTransfer: dt }); await p.dispatchEvent('main', 'drop', { dataTransfer: dt }); await p.waitForTimeout(2500);
  await p.fill('#sheet [name=title]', 'Sortiertest 57');
  await p.setInputFiles('#sheet [data-action=add-photos]:not([capture])', ['a1057', 'b1000'].map(n => __dirname + `/${n}.jpg`)); await p.waitForTimeout(2500);
  const order = () => p.$$eval('#photoGrid figure', l => l.map(f => getComputedStyle(f.querySelector('img')).width && f.querySelector('img').src.slice(-12)));
  const ids = () => p.$$eval('#photoGrid figure', l => l.map(f => f.dataset.pid));
  const before = await ids(); log('Vorher:', before.length, 'Fotos');
  // Drittes Foto mit der Maus nach vorne ziehen
  const r3 = await (await p.$('#photoGrid figure:nth-child(3)')).boundingBox(), r1 = await (await p.$('#photoGrid figure:nth-child(1)')).boundingBox();
  await p.mouse.move(r3.x + 30, r3.y + 60); await p.mouse.down();
  for (let i = 1; i <= 12; i++) await p.mouse.move(r3.x + 30 + (r1.x - r3.x) * i / 12, r3.y + 60);
  await p.screenshot({ path: __dirname + '/shots55/sortieren-ziehen.png' });
  await p.mouse.up(); await p.waitForTimeout(500);
  const after = await ids();
  log('Nachher richtig:', after[0] === before[2] && after[1] === before[0] && after[2] === before[1], 'Anzahl:', after.length);
  await p.screenshot({ path: __dirname + '/shots55/sortieren-nachher.png' });
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(1500);
  if (await p.$('#sheet[open]')) await p.evaluate(() => document.querySelector('#sheet').close());
  const saved = await p.evaluate(async () => { const r = await fetch('api/?a=sync&crew=' + JSON.parse(localStorage.getItem('lp.crew')) + '&since=0', { headers: { 'X-Lammping': '1' } });
    const j = await r.json(); const e = j.docs.filter(d => d.coll === 'entries' && d.data && d.data.title === 'Sortiertest 57').pop(); return e && e.data.photos.map(x => x.id); });
  log('Gespeichert in neuer Reihenfolge:', JSON.stringify(saved) === JSON.stringify(after));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
