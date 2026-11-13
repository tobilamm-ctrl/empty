const { chromium, devices } = require('playwright');
const BASE = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const run = async (name, opts, standalone, fn) => {
    const ctx = await b.newContext({ viewport: { width: 420, height: 860 }, locale: 'de-DE', ...opts });
    await ctx.addInitScript(sa => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.autoPing', 'false');
      if (sa && !localStorage.getItem('realPerm')) { window.__perm = 'default'; Object.defineProperty(Notification, 'permission', { get: () => window.__perm });
        Notification.requestPermission = async () => { window.__perm = 'granted'; return 'granted'; }; }
      if (sa) { const mm = window.matchMedia.bind(window); window.matchMedia = q => (q.includes('standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); } }, standalone);
    await ctx.route(/tile\.openstreetmap|overpass|open-meteo|osrm|nominatim/, r => r.fulfill({ status: 404, body: '' }));
    const p = await ctx.newPage(); p.on('dialog', x => x.accept());
    p.on('pageerror', e => errs.push(name + ' pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|push service|Registration failed/i.test(m.text())) errs.push(name + ' ' + m.text()); });
    await p.goto(BASE); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500);
    while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }
    await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(1200);
    await fn(p, ctx);
    await ctx.close();
  };
  const txt = p => p.$eval('.start-help', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'kein Hinweis');
  await run('Browser', {}, false, async p => {
    log('A Browser:', await txt(p));
    await (await p.$('.start-help')).screenshot({ path: __dirname + '/shots77/browser.png' });
    await p.click('.start-help [data-action=help-later]'); await p.waitForTimeout(500);
    log('A nach Später:', await txt(p));
    await p.reload(); await p.waitForTimeout(2500); log('A nach Neustart:', await txt(p));
  });
  await run('iPhone', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }, false, async p => {
    log('B iPhone:', await txt(p));
    await (await p.$('.start-help')).screenshot({ path: __dirname + '/shots77/iphone.png' });
  });
  await run('App', {}, true, async p => {
    log('C App ohne Erlaubnis:', await txt(p), '| Permission:', await p.evaluate(() => Notification.permission));
    await (await p.$('.start-help')).screenshot({ path: __dirname + '/shots77/app-push.png' });
    await p.click('.start-help [data-action=help-push-never]'); await p.waitForTimeout(500);
    log('C nach Nein danke:', await txt(p));
    await p.reload(); await p.waitForTimeout(2500); log('C nach Neustart:', await txt(p));
  });
  await run('App-erlaubt', {}, true, async p => {
    await p.evaluate(() => { window.__perm = 'granted'; }); await p.evaluate(() => { location.hash = '#/karte'; }); await p.waitForTimeout(500); await p.evaluate(() => { location.hash = '#/tagebuch'; }); await p.waitForTimeout(800);
    log('D App mit Erlaubnis:', await txt(p), '| Permission:', await p.evaluate(() => Notification.permission));
  });
  await run('App-Einschalten', {}, true, async (p, ctx) => {
    // Erlaubnis jetzt erteilt, aber die Seite kennt noch 'default' erst nach Neuladen: vorher Knopf drücken
    log('E vorher:', await txt(p));
    await p.click('.start-help [data-action=help-push]').catch(() => {}); await p.waitForTimeout(2500);
    log('E nach Einschalten:', await txt(p), '| Toast:', await p.$eval('.toast', x => x.innerText).catch(() => '-'));
  });
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
