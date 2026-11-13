const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap/, r => r.fulfill({ status: 404, body: '' }));
  await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ category: 'place', type: 'house', name: '',
    address: { house_number: '1', road: 'Edvard Munchs plass', suburb: 'Bjørvika', city: 'Oslo', country_code: 'no' } }) }));
  await ctx.route(/overpass-api/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ elements: [
    { type: 'node', id: 1, lat: 59.9061, lon: 10.7556, tags: { name: 'Bjørvika', railway: 'tram_stop' } },
    { type: 'node', id: 2, lat: 59.9066, lon: 10.7549, tags: { name: 'Kafé Bjørvika', amenity: 'cafe' } },
    { type: 'way', id: 3, center: { lat: 59.9064, lon: 10.7553 }, tags: { name: 'MUNCH', tourism: 'museum', building: 'yes' } },
    { type: 'node', id: 4, lat: 59.9063, lon: 10.7552, tags: { name: 'Benk', amenity: 'bench' } },
  ] }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(800);
  const dt = await p.evaluateHandle(b64 => { const d = new DataTransfer(); d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'm.jpg', { type: 'image/jpeg' })); return d; }, fs.readFileSync(__dirname + '/munch.jpg').toString('base64'));
  await p.dispatchEvent('main', 'dragover', { dataTransfer: dt }); await p.dispatchEvent('main', 'drop', { dataTransfer: dt }); await p.waitForTimeout(3500);
  if (await p.$('#sheet [data-action=where-new]')) { await p.click('#sheet [data-action=where-new]'); await p.waitForTimeout(3000); }
  log('Titel:', await p.$eval('#sheet [name=title]', x => x.value), 'Vorschläge:', await p.$$eval('#sheet .title-hints .chip', l => l.map(x => x.textContent)), 'Ort:', await p.$eval('#sheet [name=place]', x => x.value));
  // Zuschneiden
  await p.click('#photoGrid figure img'); await p.waitForTimeout(800);
  log('Zuschnitt offen:', !!(await p.$('#sheet .crop-ov')));
  await p.click('.crop-ov [data-r="1:1"]'); await p.waitForTimeout(200);
  // Rahmen an der rechten unteren Ecke verkleinern
  const h = await (await p.$('.crop-box i[data-h=se]')).boundingBox();
  await p.mouse.move(h.x + 10, h.y + 10); await p.mouse.down(); await p.mouse.move(h.x - 60, h.y - 60, { steps: 6 }); await p.mouse.up();
  await p.screenshot({ path: __dirname + '/shots55/zuschnitt.png' });
  await p.click('.crop-ov [data-rot]'); await p.waitForTimeout(300); await p.click('.crop-ov [data-r="4:3"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/shots55/zuschnitt-gedreht.png' });
  await p.click('.crop-ov [data-c=ok]'); await p.waitForTimeout(1200);
  log('Toast:', await p.$eval('#toast, .toast', x => x.textContent).catch(() => '?'));
  log('Vorschau nachher:', await p.$eval('#photoGrid figure img', i => [i.naturalWidth, i.naturalHeight]));
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(3000);
  const ph = await p.evaluate(async () => {
    const crew = JSON.parse(localStorage.getItem('lp.crew'));
    const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json();
    const e = j.docs.filter(d => d.coll === 'entries' && d.data && d.data.title === 'MUNCH').pop();
    if (!e) return 'kein Eintrag';
    const id = e.data.photos[0].id;
    const img = new Image(); img.src = `api/?a=photo&crew=${crew}&id=${id}`;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    return { photo: e.data.photos[0].lat, size: [img.naturalWidth, img.naturalHeight] };
  });
  log('Gespeichertes Foto:', JSON.stringify(ph));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
