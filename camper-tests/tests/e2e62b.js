const { chromium } = require('playwright');
const fs = require('fs'); const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  await ctx.route(/tile\.openstreetmap|overpass/, r => r.fulfill({ status: 404, body: '' }));
  await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ address: { town: 'Malcesine', country_code: 'it' } }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(900); };
  const drop = async (n, sel = 'main') => {
    const dt = await p.evaluateHandle(([b64, n]) => { const d = new DataTransfer(); d.items.add(new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], n + '.jpg', { type: 'image/jpeg' })); return d; }, [fs.readFileSync(__dirname + `/${n}.jpg`).toString('base64'), n]);
    await p.dispatchEvent(sel, 'dragover', { dataTransfer: dt }); await p.dispatchEvent(sel, 'drop', { dataTransfer: dt }); await p.waitForTimeout(2500);
  };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  await p.evaluate(async crew => {
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: [
      { coll: 'trips', id: 'nor25', data: { id: 'nor25', name: 'Norwegen 2025', start: '2025-08-13', end: '2025-09-02', color: '#7B4F96', ended: true } }] }) });
  }, crew);
  await p.reload(); await p.waitForTimeout(3000); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  log('Gewählte Reise vorher:', await p.$eval('.trip-switch, .tripbar, header', x => x.innerText.split('\n').find(l => /Packtest|Norwegen/.test(l)) || '?').catch(() => '?'));
  // 1. Foto vom 30.8.2025 auf den Kalender
  await go('#/kalender'); await drop('munch');
  const f = await p.$eval('#sheet form[data-form=entry]', f => ({ date: f.date.value, tag: f.closest('#sheet').querySelector('.trip-tag')?.textContent })).catch(() => null);
  log('Eintragsformular:', JSON.stringify(f));
  await p.screenshot({ path: __dirname + '/shots55/kopf-reise.png', clip: { x: 230, y: 30, width: 640, height: 120 } });
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(1500);
  log('Frage danach:', await p.$eval('#sheet[open]', x => x.innerText.replace(/\s+/g, ' ').slice(0, 80)).catch(() => 'keine'));
  await p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  const saved = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } })).json();
    const e = j.docs.filter(d => d.coll === 'entries' && d.data && (d.data.date || '').startsWith('2025-08-30')).pop(); return e && e.data.tripId; }, crew);
  log('Eintrag gehört zu:', saved);
  // 2. Foto vom 2.4.2026 auf die Reisen-Übersicht: keine Reise
  await go('#/reisen'); await drop('a1050');
  log('Frage:', await p.$eval('#sheet[open]', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'keine'));
  await p.screenshot({ path: __dirname + '/shots55/neue-reise-frage.png' });
  await p.click('#sheet [data-action=drop-new-trip]'); await p.waitForTimeout(1500);
  log('Reise-Formular:', await p.$eval('#sheet form[data-form=trip]', f => [f.name.value, f.start.value, f.end.value]).catch(() => 'fehlt'));
  await p.click('#sheet form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(3500);
  log('Danach Eintragsformular:', await p.$eval('#sheet form[data-form=entry]', f => [f.date.value, f.closest('#sheet').querySelector('.trip-tag')?.textContent]).catch(() => 'fehlt'));
  // Eintragsansicht mit Reise-Name
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary').catch(() => {}); await p.waitForTimeout(1500);
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
