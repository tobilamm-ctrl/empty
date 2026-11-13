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
  const tok = await t.evaluate(async c => (await (await fetch('api/?a=share', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew: c, trip: 'go79', on: true, opts: {} }) })).json()).token, crew);
  // 1. Oma im Reiseblog
  const r = await (await b.newContext({ viewport: { width: 600, height: 900 } })).newPage(); r.on('pageerror', e => errs.push('blog ' + e.message));
  const alerts = []; r.on('dialog', d => { alerts.push(d.message()); d.accept(); });
  await r.route(/tile\.openstreetmap/, rt => rt.fulfill({ status: 404, body: '' }));
  await r.goto(`${BASE}blog.html#${tok}`); await r.waitForTimeout(1500);
  const box = '.blog-cmts[data-cmt="n1"]';
  await r.click(`${box} .blog-cmt-open`); await r.fill(`${box} textarea`, 'Ohne Namen'); await r.click(`${box} .cmt-form button`); await r.waitForTimeout(600);
  log('1 ohne Namen:', alerts.join(' / ') || 'kein Hinweis', '| Pflichtfeld:', await r.$eval(`${box} [name=name]`, x => x.required));
  await r.fill(`${box} [name=name]`, 'Oma Gerda'); await r.fill(`${box} textarea`, 'Wie schön, passt auf euch auf!'); await r.click(`${box} .cmt-form button`); await r.waitForTimeout(1000);
  log('1 Blog-Kommentare:', await r.$$eval(`${box} .cmt`, xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')));
  // 2. Franz in der App
  await f.reload(); await f.waitForTimeout(6000); await go(f, '#/tagebuch');
  await f.click('.crew-tab[data-id]:not([data-id=""])'); await f.waitForTimeout(2500);
  log('2 Franz sieht:', await f.$$eval('#crewBlog .blog-cmts[data-cmt="n1"] .cmt', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await f.click('#crewBlog .blog-cmts[data-cmt="n1"] .blog-cmt-open'); await f.fill('#crewBlog .blog-cmts[data-cmt="n1"] textarea', 'Toller Ausblick!'); await f.click('#crewBlog .blog-cmts[data-cmt="n1"] .cmt-form button'); await f.waitForTimeout(1200);
  log('2 nach Kommentar:', await f.$$eval('#crewBlog .blog-cmts[data-cmt="n1"] .cmt', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await (await f.$('#crewBlog [data-entry="n1"]')).screenshot({ path: __dirname + '/shots84/franz.png' });
  // 3. Tobi im Tagebuch
  await t.reload(); await t.waitForTimeout(6500); while (await t.$('.stamp-pop')) { await t.click('.stamp-pop [data-sp]'); await t.waitForTimeout(150); }
  await go(t, '#/reisen'); await t.click('.trips >> text="Norwegen"'); await t.waitForTimeout(800); await t.evaluate(() => { const d = document.querySelector('#sheet'); if (d.open) d.close(); });
  await go(t, '#/tagebuch'); await t.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await t.waitForTimeout(800);
  const c3 = await t.$eval('.react-btn.ext[data-action=comments-open]', x => x.innerText.trim()).catch(() => '');
  log(/2/.test(c3) ? '✔' : '✘', '3 Kommentar-Zahl am Eintrag (öffentliche zählen mit):', c3 || 'fehlt');
  await t.click('.react-btn.ext[data-action=comments-open]'); await t.waitForTimeout(1200);
  log('3 Eintragsansicht:', await t.$eval('.pub-comments', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'fehlt'));
  await t.fill('.pub-comments textarea', 'Danke euch!'); await t.click('.pub-comments .cmt-form button'); await t.waitForTimeout(1500);
  log('3 nach Antwort:', await t.$$eval('.pub-comments .cmt', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ').slice(0, 60)).join(' | ')));
  await (await t.$('.pub-comments')).screenshot({ path: __dirname + '/shots84/tobi.png' });
  await t.click('.pub-comments .cmt:first-child [data-action=pub-cmt-del]'); await t.waitForTimeout(1500);
  log('3 nach Löschen:', await t.$$eval('.pub-comments .cmt b', xs => xs.map(x => x.innerText.trim()).join(' | ')));
  await r.reload(); await r.waitForTimeout(1500);
  log('4 Blog jetzt:', await r.$$eval(`${box} .cmt b`, xs => xs.map(x => x.innerText.trim()).join(' | ')));
  await (await r.$('[data-entry="n1"]')).screenshot({ path: __dirname + '/shots84/blog.png' });
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
