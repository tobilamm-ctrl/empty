const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const PNG = require('fs').readFileSync(__dirname + '/t.png');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE', permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; window.scrollTo(0, 0); }, h); await p.waitForTimeout(900); };
  await p.goto(URL); await p.waitForSelector('form[data-form=login]');
  await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button');
  await p.waitForTimeout(2500); while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
  // 1. Pinnwand-Zettel
  await go('#/pinnwand'); await p.click('.chips [data-action=pin-quick] >> nth=3'); await p.waitForTimeout(600);
  const n = await p.$eval('.pin-note', x => x.hidden ? 'versteckt' : x.innerText.replace(/\s+/g, ' ')).catch(() => 'fehlt');
  log('Zettel:', n);
  await go('#/listen'); await p.screenshot({ path: __dirname + '/shots54/kopf.png', clip: { x: 0, y: 0, width: 400, height: 130 } });
  await p.click('.pin-note'); await p.waitForTimeout(500);
  log('Überlagert:', await p.$$eval('#sheet[open] .pins li', l => l.length), 'Route bleibt:', await p.evaluate(() => location.hash));
  await p.screenshot({ path: __dirname + '/shots54/zettel-fenster.png' });
  await p.click('#sheet [data-action=close]'); await p.waitForTimeout(300);
  // 2. Reisefoto
  await go('#/reisefoto');
  for (const y of ['2023', '2024', '2025']) {
    await p.setInputFiles('[data-action=rf-old]', { name: 'a.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(500);
    await p.fill('form[data-form=rf-old] [name=year]', y); await p.click('form[data-form=rf-old] .primary'); await p.waitForTimeout(700);
  }
  log('Jahresreihe:', await p.$$eval('.rf-strip figcaption', l => l.map(x => x.textContent)));
  await p.screenshot({ path: __dirname + '/shots54/reisefoto.png' });
  await p.click('[data-action=rf-play]'); await p.waitForTimeout(1900);
  log('Zeitraffer:', await p.$eval('.rf-play b', x => x.textContent));
  await p.click('.rf-play'); await p.waitForTimeout(300); log('Zeitraffer zu:', !(await p.$('.rf-play')));
  for (let i = 0; i < 3; i++) { const d = await p.$('.rf-grid [data-action=rf-del]'); if (!d) break; await d.click(); await p.waitForTimeout(500); }
  // 3. Reiseidee: Zwischenablage und Foto
  await go('#/ideen'); const ib = await p.$('[data-action=idea-open]');
  if (ib) {
    await ib.click(); await p.waitForTimeout(500);
    await p.evaluate(() => navigator.clipboard.writeText('https://example.org/stellplatz-am-see'));
    await p.click('#sheet [data-action=idea-paste]'); await p.waitForTimeout(600);
    await p.setInputFiles('#sheet [data-action=idea-photo]', { name: 'b.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(900);
    log('Idee: Link', await p.$$eval('#sheet .idea-notes a', l => l.map(x => x.textContent).slice(-1)), 'Fotos', await p.$$eval('#sheet .idea-photos img', l => l.length));
    await p.screenshot({ path: __dirname + '/shots54/idee.png' });
    await p.click('#sheet [data-action=close]'); await p.waitForTimeout(300);
  } else log('keine Idee vorhanden');
  // 4. Teilen mit Bild in eine Idee
  await p.evaluate(async png => {
    const c = await caches.open('lammping-share');
    await c.put('f0', new Response(Uint8Array.from(atob(png), ch => ch.charCodeAt(0)), { headers: { 'Content-Type': 'image/png' } }));
    await c.put('meta', new Response(JSON.stringify({ title: 'Toller Stellplatz', text: '', url: 'https://example.org/platz', count: 1 }), { headers: { 'Content-Type': 'application/json' } }));
  }, PNG.toString('base64'));
  await go('#/teilen'); await p.waitForTimeout(800);
  log('Ideen zur Auswahl:', await p.$$eval('.idea-pick li', l => l.length), 'Suche:', !!(await p.$('.idea-search')));
  if (await p.$('.idea-search')) { await p.fill('.idea-search', 'zzzz'); await p.waitForTimeout(200); log('Suche filtert:', await p.$$eval('.idea-pick li:not([hidden])', l => l.length)); await p.fill('.idea-search', ''); }
  await p.click('.idea-pick [data-action=shared-idea] >> nth=0'); await p.waitForTimeout(1200);
  log('Nach Teilen:', await p.evaluate(() => location.hash));
  // 5. Startseite schlägt „dort weitermachen“
  await go('#/einstellungen'); await p.selectOption('[data-action-input=start-page]', 'listen'); await p.waitForTimeout(800);
  await go('#/kasse'); await p.waitForTimeout(1200);
  await p.goto(URL); await p.waitForTimeout(2500);
  log('Nach Neustart:', await p.evaluate(() => location.hash));
  await go('#/einstellungen'); await p.selectOption('[data-action-input=start-page]', ''); await p.waitForTimeout(800);
  // 6. Neue Reise: Erinnerung an die Packliste
  await go('#/listen'); await p.click('[data-action=list-tab][data-tab=merken]'); await p.waitForTimeout(500);
  const chip = await p.$('[data-action=list-pick][data-id=packnext]'); if (chip) { await chip.click(); await p.waitForTimeout(400); }
  await p.fill('[data-list=packnext] input', 'Grillzange'); await p.press('[data-list=packnext] input', 'Enter'); await p.waitForTimeout(500);
  await go('#/reisen'); await p.click('[data-action=trip-form]:not([data-id])').catch(async () => { await p.click('[data-action=trip-form]'); }); await p.waitForTimeout(500);
  await p.fill('form[data-form=trip] [name=name]', 'Packtest 54'); await p.click('form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(1500);
  log('Erinnerung:', await p.$eval('#sheet[open] h2', x => x.textContent).catch(() => 'keine'), await p.$$eval('#sheet .pack-remind li', l => l.map(x => x.textContent)).catch(() => []));
  await p.screenshot({ path: __dirname + '/shots54/erinnerung.png' });
  if (await p.$('#sheet [data-action=pack-remind-add]')) { await p.click('#sheet [data-action=pack-remind-add]'); await p.waitForTimeout(600); log('Toast:', await p.$eval('#toast', x => x.textContent)); }
  log('Fehler:', errs.length ? [...new Set(errs)] : 'keine');
  await b.close();
})();
