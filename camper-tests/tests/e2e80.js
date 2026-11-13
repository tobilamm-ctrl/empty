const { chromium } = require('playwright'); const JPG = require('fs').readFileSync(__dirname + '/jetzt.jpg').toString('base64');
const BASE = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const pad = n => String(n).padStart(2, '0');
const day = n => { const d = new Date(Date.now() + n * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
(async () => {
  const b = await chromium.launch();
  const mk = async () => {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 860 }, locale: 'de-DE' });
    await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.autoPing', 'false'); localStorage.setItem('lp.helpInstallUntil', String(Date.now() + 9e9)); });
    await ctx.route(/tile\.openstreetmap|overpass|open-meteo|osrm|nominatim/, r => r.fulfill({ status: 404, body: '' }));
    const p = await ctx.newPage(); p.on('dialog', x => x.accept());
    p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    return p;
  };
  const login = async (p, l, pw) => { await p.goto(BASE); await p.fill('[name=login]', l); await p.fill('[name=password]', pw); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500);
    while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  const post = (p, a, body) => p.evaluate(([a, body]) => fetch('api/?a=' + a, { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()), [a, body]);
  const go = async (p, h) => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1200); };
  const t = await mk(); await login(t, 'tobi', 'segeln1');
  const crew = await t.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  await post(t, 'user-save', { name: 'Franz', login: 'franz79', password: 'geheim1', canCash: true, isAdmin: false, canFound: true });
  await t.evaluate(j => { window.__jpg = j; }, JPG);
  await t.evaluate(async crew => { const b = btoa(String.fromCharCode(0x1A, 0x45, 0xDF, 0xA3, ...Array(800).fill(5)));
    await fetch('api/?a=photo', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, id: 'ph80', data: 'data:image/jpeg;base64,' + window.__jpg }) });
    await fetch('api/?a=photo', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, id: 'snd79', data: 'data:audio/webm;base64,' + b }) }); }, crew);
  await post(t, 'push', { crew, changes: [
    { coll: 'trips', id: 'alt79', data: { id: 'alt79', name: 'Ostsee 2025', start: '2025-07-01', end: '2025-07-10', color: '#2E7FB8' } },
    { coll: 'trips', id: 'geheim79', data: { id: 'geheim79', name: 'Geheimtrip', start: '2025-09-01', end: '2025-09-03', friendsHide: true } },
    { coll: 'trips', id: 'go79', data: { id: 'go79', name: 'Norwegen', start: day(0), color: '#C2410C' } },
    { coll: 'entries', id: 'n1', data: { id: 'n1', tripId: 'go79', type: 'sight', title: 'Preikestolen', date: day(0) + 'T10:00', lat: 58.98, lng: 6.19, sounds: [{ id: 'snd79', sec: 9 }], photos: [{ id: 'ph80', thumb: 'data:image/jpeg;base64,' + JPG }], text: 'Wow' } },
    { coll: 'entries', id: 'n2', data: { id: 'n2', tripId: 'go79', type: 'stellplatz', title: 'Fjordblick', date: day(0) + 'T18:00', lat: 59.3, lng: 6.6, photos: [] } },
    { coll: 'games', id: 'hl79', data: { id: 'hl79', kind: 'highlight', tripId: 'go79', day: day(0), text: 'Wanderung', emoji: '🥾' } },
  ] });
  const f = await mk(); await f.goto(BASE); await f.fill('[name=login]', 'franz79'); await f.fill('[name=password]', 'geheim1'); await f.click('form[data-form=login] button'); await f.waitForTimeout(2000);
  const fc = (await post(f, 'crew-save', { name: 'Familie Franz' })); await f.reload(); await f.waitForTimeout(2000);
  const fcrew = await f.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  await post(f, 'push', { crew: fcrew, changes: [{ coll: 'trips', id: 'fz79', data: { id: 'fz79', name: 'Zuhause', start: day(-1) } }] });
  await post(f, 'follow', { crew: fcrew, target: crew, op: 'request' });
  await post(t, 'follow', { crew, target: fcrew, op: 'accept' });
  await f.reload(); await f.waitForTimeout(6500);
  await go(f, '#/tagebuch');
  log('1 Reiter:', await f.$$eval('.crew-tab', xs => xs.map(x => x.innerText.trim() + (x.querySelector('.cr-new') ? ' •' : '') + (x.classList.contains('on') ? ' [an]' : '')).join(' | ')));
  log('1 alte Zeilen:', await f.$$eval('.crew-row', xs => xs.length));
  await f.screenshot({ path: __dirname + '/shots80/reiter.png', clip: { x: 0, y: 0, width: 1000, height: 300 } });
  await f.click('.crew-tab[data-id]:not([data-id=""])'); await f.waitForTimeout(2500);
  log('2 Ansicht:', await f.$eval('#crewBlog', x => x.innerText.replace(/\s+/g, ' ').slice(0, 260)).catch(() => 'fehlt'));
  log('2 Karte, Fotos, Herz, Ton:', await f.$$eval('#crewBlog .leaflet-container', x => x.length), await f.$$eval('#crewBlog .blog-like', x => x.length), await f.$$eval('#crewBlog .blog-snd', x => x.length));
  log('2 Punkt nach Öffnen:', await f.$$eval('.crew-tab .cr-new', x => x.length));
  await f.screenshot({ path: __dirname + '/shots80/crew-blog.png', fullPage: true });
  await f.click('#crewBlog .blog-photos img'); await f.waitForTimeout(1500);
  log('2b Vollbild:', await f.evaluate(() => { const d = document.querySelector('dialog.photo-viewer'); if (!d) return 'keins'; const i = d.querySelector('.pv-img'); return `offen, ${i.naturalWidth}x${i.naturalHeight}, ${i.src.includes('follow-photo') ? 'volle Auflösung vom Server' : 'nur Vorschau'}, Text: ${d.querySelector('.pv-cap').innerText.replace(/\s+/g, ' ')}`; }));
  await f.screenshot({ path: __dirname + '/shots80/vollbild.png' });
  await f.keyboard.press('Escape'); await f.waitForTimeout(500);
  await f.click('#crewBlog .blog-like'); await f.waitForTimeout(1000);
  log('3 Herz:', await f.$eval('#crewBlog .blog-like', x => x.innerText.trim() + (x.classList.contains('on') ? ' an' : '')));
  // Neuzeichnen (z. B. Abgleich) behält die Ansicht
  await f.evaluate(() => { location.hash = '#/karte'; }); await f.waitForTimeout(800); await f.evaluate(() => { location.hash = '#/tagebuch'; }); await f.waitForTimeout(1500);
  log('4 nach Seitenwechsel noch Crew-Reiter:', await f.$eval('.crew-tab.on', x => x.innerText.trim()), '| Herz bleibt:', await f.$eval('#crewBlog .blog-like', x => x.classList.contains('on')).catch(() => '-'));
  await f.click('.crew-tab[data-id=""]'); await f.waitForTimeout(1200);
  log('5 Eigene Reise:', await f.$eval('#view', x => x.innerText.replace(/\s+/g, ' ').slice(0, 120)));
  // Sheet über Crews on the Road ebenfalls im Blog-Stil
  await go(f, '#/mitreisen'); await f.waitForTimeout(1500);
  await f.click('[data-action=mr-open][data-trip=alt79]').catch(async () => { await f.evaluate(() => document.querySelectorAll('details.mr-more').forEach(d => { d.open = true; })); await f.click('[data-action=mr-open][data-trip=alt79]'); });
  await f.waitForTimeout(2000);
  log('6 Sheet:', await f.$eval('#sheet .crew-blog', x => x.innerText.replace(/\s+/g, ' ').slice(0, 120)).catch(() => 'fehlt'));
  await f.evaluate(() => document.querySelector('#sheet').close());
  // Reiseblog-Seite selbst
  const tok = await t.evaluate(async c => (await (await fetch('api/?a=share', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew: c, trip: 'go79', on: true, opts: {} }) })).json()).token, crew);
  const r = await (await f.context().browser().newContext()).newPage(); r.on('pageerror', e => errs.push('blog ' + e.message));
  const refs = []; await r.route(/tile\.openstreetmap/, (rt, req) => { refs.push(req.headers()['referer'] || 'KEIN'); rt.fulfill({ status: 404, body: '' }); });
  await r.goto(`${BASE}blog.html#${tok}`); await r.waitForTimeout(2000);
  log('7 Blogseite:', await r.$eval('#blog', x => x.innerText.replace(/\s+/g, ' ').slice(0, 160)), '| Herzen:', await r.$$eval('.blog-like', x => x.length));
  log('7 Referer an OSM:', [...new Set(refs)].join(', '));
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
