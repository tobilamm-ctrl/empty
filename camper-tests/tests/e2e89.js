const { chromium } = require('playwright'); const JPG = require('fs').readFileSync(__dirname + '/jetzt.jpg').toString('base64');
const BASE = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const pad = n => String(n).padStart(2, '0');
const day = n => { const d = new Date(Date.now() + n * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
(async () => {
  const b = await chromium.launch();
  const mk = async () => {
    const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, locale: 'de-DE' });
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
  const ok = (c, m) => log(c ? '✔' : '✘', m);
  await f.reload(); await f.waitForTimeout(6500);
  // Franz bekommt eigene Einträge, damit sein Tagebuch etwas zeigt
  await post(f, 'push', { crew: fcrew, changes: [{ coll: 'entries', id: 'fe1', data: { id: 'fe1', tripId: 'fz79', type: 'stellplatz', title: 'Daheim', date: day(0) + 'T09:00', photos: [] } }] });
  await f.reload(); await f.waitForTimeout(5000);
  const stamps = async () => { while (await f.$('.stamp-pop')) { await f.click('.stamp-pop [data-sp]'); await f.waitForTimeout(200); } };
  await stamps(); await go(f, '#/tagebuch'); await stamps();
  await f.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {}); await f.waitForTimeout(600);
  // 1. Handy: Reise-Leiste hinter „⋯“
  ok(await f.$eval('.diary-more', x => x.hidden), '1 Reise-Leiste auf dem Handy zugeklappt');
  await f.click('.more-toggle'); await f.waitForTimeout(500);
  ok(await f.$eval('.diary-more', x => !x.hidden) && !!(await f.$('.diary-more .trip-tools')), '1 „⋯“ klappt Reise-Leiste und Ansicht auf');
  ok(!!(await f.$('.day-jump')), '1 Sprungleiste bleibt sichtbar');
  // 2. Ein Foto-Knopf mit Auswahl
  await f.click('.photo-add > summary'); await f.waitForTimeout(300);
  ok((await f.$$eval('.photo-add[open] .photo-add-menu label', x => x.length)) === 2, '2 📷+ bietet Kamera und Galerie');
  // 3. Mehr: Suche
  await go(f, '#/mehr'); await f.waitForTimeout(1500);
  await f.fill('.tile-search', 'tank'); await f.waitForTimeout(300);
  const vis = await f.$$eval('#view a.tile', xs => xs.filter(x => !x.hidden).map(x => x.innerText.trim().split('\n')[0]));
  ok(vis.length >= 1 && vis.length <= 3 && vis.some(v => /Tank/.test(v)), '3 Suche „tank“ → ' + vis.join(', '));
  await f.press('.tile-search', 'Enter'); await f.waitForTimeout(800);
  ok((await f.evaluate(() => location.hash)) === '#/tank', '3 Enter öffnet den Treffer');
  // 4. Einstellungen in Gruppen
  await go(f, '#/einstellungen'); await f.waitForTimeout(1500);
  const groups = await f.$$eval('.set-group', xs => xs.map(x => x.innerText));
  ok(groups.length >= 3 && /MEIN GERÄT/i.test(groups[0]), '4 Gruppen: ' + groups.join(' | '));
  ok((await f.$$eval('.panel.fold', xs => xs[0].dataset.name)) === 'Mitteilungen', '4 Mitteilungen steht oben');
  // 5. Spiele kommen nachgeladen in die Liste
  await go(f, '#/spiele'); await f.waitForTimeout(2500);
  const games = await f.$eval('#view', x => x.innerText);
  ok(/Kniffel/.test(games) && /Labyrinth/.test(games) && /Sudoku/.test(games), '5 Nachgeladene Spiele in der Liste');
  // 6. Reise der anderen Crew ohne Netz
  await go(f, '#/tagebuch'); await f.click('.crew-tab[data-id]:not([data-id=""])'); await f.waitForTimeout(2500);
  ok(!!(await f.$('#crewBlog .timeline')), '6 Crew-Reise mit Netz geladen');
  await f.context().setOffline(true);
  await f.reload().catch(() => {}); await f.waitForTimeout(5000);
  await go(f, '#/tagebuch');
  const tabs = await f.$$eval('.crew-tab', x => x.length);
  ok(tabs === 2, '6 Ohne Netz: Reiter da (' + tabs + ')');
  await f.click('.crew-tab[data-id]:not([data-id=""])').catch(() => {}); await f.waitForTimeout(2500);
  const foot = await f.$eval('#crewBlog .blog-foot', x => x.innerText).catch(() => '');
  ok(/ohne Netz/.test(foot) && !!(await f.$('#crewBlog .timeline')), '6 Ohne Netz: Reise vom Gerät – ' + foot.slice(0, 60));
  await f.context().setOffline(false);
  // 7. Archiv nach Jahren (Tobi hat viele Reisen)
  await post(t, 'push', { crew, changes: [{ coll: 'trips', id: 'ar1', data: { id: 'ar1', name: 'Alt 2023', start: '2023-05-01', end: '2023-05-05', archived: true } }, { coll: 'trips', id: 'ar2', data: { id: 'ar2', name: 'Alt 2024', start: '2024-05-01', end: '2024-05-05', archived: true } }] });
  await t.reload(); await t.waitForTimeout(5000); while (await t.$('.stamp-pop')) { await t.click('.stamp-pop [data-sp]'); await t.waitForTimeout(150); }
  await go(t, '#/reisen');
  const yf = await t.$$eval('.year-fold', xs => xs.map(x => x.querySelector('summary').innerText.replace(/\s+/g, ' ') + (x.open ? ' [offen]' : '')));
  ok(yf.length >= 2 && /offen/.test(yf[0]) && !/offen/.test(yf[yf.length - 1]), '7 Archiv nach Jahren: ' + yf.join(' | '));
  await go(t, '#/statistik');
  ok(!!(await t.$('details.more-rows')) && (await t.$$eval('#view > ul.ledger, #view ul.ledger', xs => xs[0].children.length)) <= 5, '7 Statistik: lange Liste eingeklappt');
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
