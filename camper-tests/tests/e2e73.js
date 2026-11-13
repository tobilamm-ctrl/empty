const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const pad = n => String(n).padStart(2, '0');
const loc = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE', geolocation: { latitude: 48.721, longitude: 11.4857, accuracy: 8 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); localStorage.setItem('lp.galleryCopy', 'false'); });
  await ctx.route(/tile\.openstreetmap|overpass/, r => r.fulfill({ status: 404, body: '' }));
  await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ address: { municipality: 'Manching', village: 'Pichl', country_code: 'de' } }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(900); };
  const close = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  const stamps = async () => { while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500); await stamps();
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  const now = new Date(), d1 = loc(new Date(now - 20 * 60000)), d2 = loc(new Date(now - 10 * 60000)), d0 = loc(new Date(now - 5 * 3600e3));
  await p.evaluate(async ([crew, d0, d1, d2, today]) => fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: [
    { coll: 'trips', id: 't73', data: { id: 't73', name: 'Test 73', start: today, color: '#2E7FB8' } },
    { coll: 'entries', id: 'e0', data: { id: 'e0', tripId: 't73', type: 'stellplatz', title: 'Platz früh', date: d0, lat: 48.6, lng: 11.3, photos: [] } },
    { coll: 'entries', id: 'e1', data: { id: 'e1', tripId: 't73', type: 'sight', title: 'Rathaus Manching', date: d1, lat: 48.7211, lng: 11.4858, photos: [], text: 'Schöner Platz' } },
    { coll: 'entries', id: 'e2', data: { id: 'e2', tripId: 't73', type: 'notiz', title: '', date: d2, lat: 48.7213, lng: 11.4859, photos: [{ id: 'px', thumb: '' }], text: 'Eis gegessen' } },
  ] }) }), [crew, d0, d1, d2, d1.slice(0, 10)]);
  await p.reload(); await p.waitForTimeout(2500); await stamps();
  await go('#/reisen'); await p.click('.trips >> text=Test 73'); await p.waitForTimeout(800); await close();
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await p.waitForTimeout(600);
  const drop = async (n, sel = 'main') => {
    const dt = await p.evaluateHandle(([b64, n]) => { const d = new DataTransfer(); d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], n, { type: 'image/jpeg' })); return d; }, [fs.readFileSync(__dirname + '/jetzt.jpg').toString('base64'), 'jetzt.jpg']);
    await p.dispatchEvent(sel, 'dragover', { dataTransfer: dt }); await p.dispatchEvent(sel, 'drop', { dataTransfer: dt }); await p.waitForTimeout(2000);
  };
  const entry = id => p.evaluate(async ([crew, id]) => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json();
    const e = j.docs.filter(d => d.coll === 'entries' && d.id === id).pop(); return e && (e.data ? { photos: (e.data.photos || []).length, text: e.data.text, title: e.data.title } : 'gelöscht'); }, [crew, id]);
  // 1. Hineinziehen: Frage mit passendem Eintrag
  await drop();
  log('1 Frage:', await p.$eval('#sheet[open] .where-to', x => x.innerText.replace(/\s+/g, ' ').slice(0, 220)).catch(() => 'keine'));
  log('1 passt:', await p.$eval('#sheet .where-list .hit', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '-'));
  await p.screenshot({ path: __dirname + '/shots55/p73-wohin.png' });
  await p.click('#sheet .where-list .hit'); await p.waitForTimeout(2500);
  log('1 Fotos an e2 jetzt:', JSON.stringify(await entry('e2')));
  // 2. Foto-Knopf (lange drücken auf + Eintrag)
  const fab = await p.$('.fab[data-action=entry-form]');
  if (fab) {
    const bb = await fab.boundingBox(); await p.mouse.move(bb.x + 20, bb.y + 20); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(300);
    const inp = await p.$('#fabFan input[data-action=photo-entry]');
    log('2 Fächer mit Foto/Tour:', await p.$$eval('#fabFan button span, #fabFan label span', l => l.map(x => x.textContent)));
    if (inp) { await inp.setInputFiles(__dirname + '/jetzt.jpg'); await p.waitForTimeout(2000);
      log('2 Frage beim Foto-Knopf:', await p.$eval('#sheet[open] .where-to h2', x => x.textContent).catch(() => 'keine'));
      await p.click('#sheet [data-action=where-new]'); await p.waitForTimeout(3000);
      const n = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json(); return j.docs.filter(d => d.coll === 'entries' && d.data && d.data.tripId === 't73').length; }, crew);
      log('2 Einträge nach „Neuer Eintrag“:', n);
    }
  } else log('2 kein + Eintrag-Knopf');
  await close();
  // 3. Teilen › LAMMping (nur Foto)
  await p.evaluate(async b64 => {
    const c = await caches.open('lammping-share'); const bin = Uint8Array.from(atob(b64), x => x.charCodeAt(0));
    await c.put('f0', new Response(new Blob([bin], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg' } }));
    await c.put('meta', new Response(JSON.stringify({ title: '', text: '', url: '', count: 1, names: ['geteilt.jpg'] }), { headers: { 'Content-Type': 'application/json' } }));
  }, fs.readFileSync(__dirname + '/jetzt.jpg').toString('base64'));
  await go('#/teilen'); await p.waitForTimeout(800);
  await p.click('[data-action=shared-entry]'); await p.waitForTimeout(2500);
  log('3 Teilen › Auswahl:', await p.$$eval('#sheet .where-list li', l => l.map(x => x.innerText.replace(/\s+/g, ' ').slice(0, 40))).catch(() => 'keine'));
  await p.click('#sheet .where-list button >> nth=1'); await p.waitForTimeout(2500);
  // 4. 📷+ am Eintrag
  await close(); await go('#/tagebuch'); await p.waitForTimeout(500);
  const before = (await entry('e1')).photos;
  await p.setInputFiles('input[data-action=stop-photo][data-id=e1]', __dirname + '/jetzt.jpg'); await p.waitForTimeout(2500);
  log('4 Fotos an e1 vorher/nachher:', before, (await entry('e1')).photos);
  // 5. Zusammenführen (Strg-Klick)
  await p.click('.timeline .stop:has([data-id=e1]) [data-action=open-entry]', { modifiers: ['Control'] }); await p.waitForTimeout(300);
  await p.click('.timeline .stop:has([data-id=e2]) [data-action=open-entry]', { modifiers: ['Control'] }); await p.waitForTimeout(300);
  log('5 Leiste:', await p.$eval('#selBar', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'keine'));
  await p.click('#selBar [data-action=sel-merge]'); await p.waitForTimeout(1500);
  log('5 e1:', JSON.stringify(await entry('e1')), 'e2:', JSON.stringify(await entry('e2')));
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
