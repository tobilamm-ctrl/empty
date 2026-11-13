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
  await f.reload(); await f.waitForTimeout(6500); await go(f, '#/tagebuch');
  await f.click('.crew-tab[data-id]:not([data-id=""])'); await f.waitForTimeout(2500);
  log('1 Merken-Knopf:', await f.$eval('#crewBlog .mr-pin', x => x.innerText).catch(() => 'fehlt'));
  await f.click('#crewBlog .mr-pin'); await f.waitForTimeout(800);
  log('1 nach Tipp:', await f.$eval('#crewBlog .mr-pin', x => x.innerText), '|', await f.$eval('.toast', x => x.innerText).catch(() => '-'));
  await go(f, '#/reisen');
  log('2 Reisen:', await f.$$eval('.pinned-trips li', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')).catch(() => 'fehlt'));
  await f.click('.pinned-trips [data-action=mr-open]'); await f.waitForTimeout(2000);
  log('2 geöffnet:', await f.$eval('#sheet .crew-blog .blog-head h1', x => x.innerText).catch(() => 'fehlt'));
  await f.evaluate(() => document.querySelector('#sheet').close());
  await go(f, '#/karte'); await f.evaluate(() => document.querySelector('.map-toggle [data-scope=all]')?.click()); await f.waitForTimeout(2500);
  log('3 Karte Alle Reisen, Linie der Crew:', await f.$$eval('#mapview path.leaflet-interactive', xs => xs.filter(x => x.getAttribute('stroke') === '#C2410C').length));
  await f.evaluate(() => document.querySelector('.map-toggle [data-scope=trip]')?.click());
  // Tobi beendet die Reise
  await t.evaluate(async ([crew, old]) => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`)).json();
    const trips = {}; j.docs.filter(x => x.coll === 'trips').forEach(x => { trips[x.id] = x.data; });
    const ch = Object.values(trips).filter(x => x && x.id !== 'go79' && !x.ended).map(x => ({ coll: 'trips', id: x.id, data: { ...x, ended: true, end: old, start: x.start && x.start < old ? x.start : old } }));
    await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: ch }) }); }, [crew, day(-30)]);
  const d0 = day(0);
  await post(t, 'push', { crew, changes: [{ coll: 'trips', id: 'go79', data: { id: 'go79', name: 'Norwegen', start: d0, end: d0, ended: true, color: '#C2410C' } }] });
  await f.reload(); await f.waitForTimeout(6500); await go(f, '#/tagebuch');
  log('4 Reiter nach Ende:', await f.$$eval('.crew-tab', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ').trim()).join(' | ')));
  await f.click('.crew-tab[data-id]:not([data-id=""])'); await f.waitForTimeout(2500);
  log('4 Ansicht:', await f.$eval('#crewBlog .blog-head h1', x => x.innerText).catch(() => 'fehlt'));
  // Ende vor 8 Tagen: kein Reiter mehr
  await post(t, 'push', { crew, changes: [{ coll: 'trips', id: 'go79', data: { id: 'go79', name: 'Norwegen', start: day(-12), end: day(-8), ended: true, color: '#C2410C' } }] });
  await f.reload(); await f.waitForTimeout(6500); await go(f, '#/tagebuch');
  log('5 Reiter nach 8 Tagen:', await f.$$eval('.crew-tab', xs => xs.length), '| gemerkt noch unter Reisen:', await (async () => { await go(f, '#/reisen'); return f.$$eval('.pinned-trips li', x => x.length); })());
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
