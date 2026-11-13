const { chromium } = require('playwright');
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
  await t.evaluate(async crew => { const b = btoa(String.fromCharCode(0x1A, 0x45, 0xDF, 0xA3, ...Array(800).fill(5)));
    await fetch('api/?a=photo', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, id: 'snd79', data: 'data:audio/webm;base64,' + b }) }); }, crew);
  await post(t, 'push', { crew, changes: [
    { coll: 'trips', id: 'alt79', data: { id: 'alt79', name: 'Ostsee 2025', start: '2025-07-01', end: '2025-07-10', color: '#2E7FB8' } },
    { coll: 'trips', id: 'geheim79', data: { id: 'geheim79', name: 'Geheimtrip', start: '2025-09-01', end: '2025-09-03', friendsHide: true } },
    { coll: 'trips', id: 'go79', data: { id: 'go79', name: 'Norwegen', start: day(0), color: '#C2410C' } },
    { coll: 'entries', id: 'n1', data: { id: 'n1', tripId: 'go79', type: 'sight', title: 'Preikestolen', date: day(0) + 'T10:00', lat: 58.98, lng: 6.19, sounds: [{ id: 'snd79', sec: 9 }], photos: [], text: 'Wow' } },
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
  log('1 Reiter bei Franz:', await f.$$eval('.crew-tab', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')));
  log('1 alter 👋-Hinweis da:', !!(await f.$('.mr-note')));
  await f.screenshot({ path: __dirname + '/shots79/franz-tagebuch.png', clip: { x: 0, y: 0, width: 1000, height: 260 } });
  await f.evaluate(() => { const id = document.querySelector('.crew-tab[data-id]:not([data-id=""])').dataset.id; const b = document.createElement('button'); b.dataset.action = 'mr-open'; b.dataset.id = id; document.querySelector('#view').appendChild(b); b.click(); }); await f.waitForTimeout(2000);
  log('2 Reise:', await f.$eval('#sheet .crew-blog', x => x.innerText.replace(/\s+/g, ' ').slice(0, 400)));
  const audio = []; f.on('response', x => { if (/follow-audio/.test(x.url())) audio.push(x.status() + ' ' + x.headers()['content-type']); });
  await f.click('#sheet .blog-snd'); await f.waitForTimeout(800); log('2 Ton:', audio.join(','));
  await f.click('#sheet .blog-like[data-like=n1]'); await f.waitForTimeout(800);
  log('2 Herz:', await f.$eval('#sheet .blog-like[data-like=n1]', x => x.innerText.trim() + (x.classList.contains('on') ? ' an' : '')));
  await (await f.$('#sheet')).screenshot({ path: __dirname + '/shots79/franz-reise.png' });
  await f.evaluate(() => document.querySelectorAll('#sheet details.mr-more').forEach(d => { d.open = true; })); log('3 Aufklapp-Text:', await f.$eval('#sheet .mr-more summary', x => x.innerText).catch(() => '-'));
  await f.click('#sheet [data-action=mr-open][data-trip=alt79]'); await f.waitForTimeout(1500);
  log('3 Alte Reise:', await f.$eval('#sheet .mr-view .sheet-head', x => x.innerText.trim()).catch(() => '-'));
  await f.evaluate(() => document.querySelector('#sheet').close()); await f.waitForTimeout(300);
  await go(f, '#/mitreisen'); await f.waitForTimeout(1500);
  log('4 Seite:', await f.$eval('.mr-crew', x => x.innerText.replace(/\s+/g, ' ').slice(0, 300)).catch(() => '-'));
  // Karte: Antippen der Linie
  await go(f, '#/karte'); await f.waitForTimeout(2500);
  const hit = await f.evaluate(() => { const ps = [...document.querySelectorAll('path.leaflet-interactive')].filter(p => p.getAttribute('stroke-opacity') === '0'); if (!ps.length) return 0; ps[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); return ps.length; });
  await f.waitForTimeout(2000);
  log('5 Karte, unsichtbare Linien:', hit, '→ geöffnet:', await f.$eval('#sheet[open] .mr-view .sheet-head', x => x.innerText.trim()).catch(() => 'nichts'));
  // Tobi sieht das Herz
  await t.reload(); await t.waitForTimeout(6500);
  while (await t.$('.stamp-pop')) { await t.click('.stamp-pop [data-sp]'); await t.waitForTimeout(150); }
  await go(t, '#/reisen'); await t.click('.trips >> text="Norwegen"'); await t.waitForTimeout(800); await t.evaluate(() => { const d = document.querySelector('#sheet'); if (d.open) d.close(); });
  await go(t, '#/tagebuch');
  await t.click('.react-count.ext'); await t.waitForTimeout(500);
  const who6 = await t.$eval('#sheet .who-list', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '');
  log(/Andere Crews.*Familie Franz/.test(who6) ? '✔' : '✘', '6 Tobi sieht das Herz der Crew:', who6 || 'fehlt');
  await t.evaluate(() => { const d = document.querySelector('#sheet'); if (d.open) d.close(); }); await t.waitForTimeout(400);
  // Reise ausblenden
  await t.evaluate(() => { const b = document.createElement('button'); b.dataset.action = 'trip-form'; b.dataset.id = 'go79'; document.querySelector('#view').appendChild(b); b.click(); }); await t.waitForTimeout(800);
  log('7 Schalter:', await t.$eval('#sheet [name=friendsShow]', x => x.checked).catch(() => 'fehlt'));
  await t.click('#sheet [name=friendsShow]'); await t.click('#sheet form[data-form=trip] .sheet-foot .primary'); await t.waitForTimeout(2500);
  const fd = await f.evaluate(async ([c, of]) => (await (await fetch(`api/?a=follow-feed&crew=${c}&of=${of}`)).json()), [fcrew, crew]);
  log('7 Franz sieht jetzt:', fd.trip ? fd.trip.name : 'keine', '| Liste:', (fd.trips || []).map(x => x.name).join(', '));
  const tr = await f.evaluate(async c => (await (await fetch(`api/?a=travel&crew=${c}`)).json()).crews.map(x => `${x.name}:${x.travelling}`).join(','), fcrew);
  log('7 unterwegs-Liste:', tr);
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
