// Lieferung 90: Bereichsbilder zeigen nur noch das Symbol (ohne Schaf), für alle 36 Bereiche ein eigenes Bild
const { chromium } = require('playwright');
const BASE = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const SHOTS = process.env.SHOTS || '';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.autoPing', 'false'); localStorage.setItem('lp.helpInstallUntil', String(Date.now() + 9e9)); });
  await ctx.route(/tile\.openstreetmap|overpass|open-meteo|osrm|nominatim/, r => r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('dialog', x => x.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const ok = (c, m) => log(c ? '✔' : '✘', m);
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1200); };
  await p.goto(BASE); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500);
  while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); }

  // Jedes Symbol hat genau ein eigenes Bild, das sich laden lässt; das alte Schaf-Grundbild ist weg
  const syms = await p.evaluate(async () => {
    const out = [];
    for (const s of document.querySelectorAll('symbol[id^="b-"]')) {
      const im = s.querySelectorAll('image'); const href = im[0] && im[0].getAttribute('href');
      const vb = s.getAttribute('viewBox').split(' ').map(Number);
      const img = new Image(); img.src = href;
      const loaded = await new Promise(r => { img.onload = () => r(true); img.onerror = () => r(false); });
      out.push({ id: s.id.slice(2), n: im.length, extra: s.children.length - im.length, href, loaded, fit: loaded && img.naturalWidth === vb[2] && img.naturalHeight === vb[3] });
    }
    return out;
  });
  ok(syms.length === 36, `36 Bereichsbilder (${syms.length})`);
  ok(syms.every(s => s.n === 1 && s.extra === 0), 'jedes Symbol besteht nur aus einem Bild');
  ok(syms.every(s => s.href === `icons/bereiche/${s.id}.webp`), 'jeder Bereich hat sein eigenes Bild');
  const bad = syms.filter(s => !s.loaded || !s.fit).map(s => s.id);
  ok(!bad.length, 'alle Bilder laden und passen zur Größe im Symbol' + (bad.length ? ': ' + bad.join(', ') : ''));
  ok(!syms.some(s => /basis/.test(s.href)), 'kein Schaf-Grundbild mehr');
  // Offline: alle Bilder stehen in der Liste des Service Workers
  const sw = await p.evaluate(() => fetch('sw.js').then(r => r.text()));
  ok(syms.every(s => sw.includes(`'${s.href}'`)) && !/basis\.webp/.test(sw), 'Service Worker kennt alle Bilder, das alte nicht mehr');

  // Seitenkopf: Bild neben der Überschrift, gleiche Höhe, ragt nicht über den Rand, Überschrift bleibt lesbar
  for (const h of ['#/listen', '#/mehr', '#/wasserwaage', '#/kochen', '#/urlaubsgeld']) {
    await go(h);
    const r = await p.evaluate(() => {
      const a = document.querySelector('.page-head .art'); if (!a) return null;
      const x = a.getBoundingClientRect(); const h1 = document.querySelector('.page-head h1'); const t = { width: h1.scrollWidth <= h1.clientWidth + 1 ? h1.clientWidth : 0 };
      return { h: Math.round(x.height), right: x.right, w: innerWidth, tw: t.width, use: a.querySelector('use').getAttribute('href') };
    });
    ok(r && r.h === 65 && r.right <= r.w && r.tw > 0 && r.use === '#b-' + h.slice(2), `${h}: Bild 65 px hoch, im Bild, Überschrift hat Platz (${r ? r.use + ', Titel ' + Math.round(r.tw) + ' px' : 'kein Bild'})`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/kopf-${h.replace(/\W+/g, '_')}.png`, clip: { x: 0, y: 0, width: 412, height: 420 } });
  }
  await go('#/mehr');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/mehr.png`, fullPage: true });

  log('Fehler:', errs.length ? errs.join(' | ') : 'keine');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
