const fs = require('fs'); const B = 'http://localhost:8766/api/';
const sub = JSON.parse(fs.readFileSync(__dirname + '/fakepush-sub.json'));
const sess = () => { let cookie = ''; return async (a, body, q = '') => {
  const r = await fetch(`${B}?a=${a}${q}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return { s: r.status, j: await r.json().catch(() => null) }; }; };
const got = async () => (await (await fetch('http://localhost:9911/')).json());
const d = new Date().toISOString().slice(0, 10);
(async () => {
  const base = (await got()).length;
  const t = sess(); await t('login', { login: 'tobi', password: 'segeln1' });
  const crew = (await t('me')).j.crews[0].id;
  console.log('Franz anlegen:', (await t('user-save', { name: 'Franz', login: 'franz76', password: 'geheim1', canCash: true, isAdmin: false, canFound: true })).s);
  const f = sess(); await f('login', { login: 'franz76', password: 'geheim1' });
  const fc = (await f('crew-save', { name: 'Familie Franz' })).j; const fcrew = fc.id || fc.crew || (await f('me')).j.crews[0].id;
  await t('push-sub', { endpoint: 'http://localhost:9911/tobi76', ...sub, tz: 'Europe/Berlin', pins: false, tickets: false, friends: true });
  await f('push-sub', { endpoint: 'http://localhost:9911/franz76', ...sub, tz: 'Europe/Berlin', pins: false, tickets: false, friends: true });
  console.log('Einstellung zurück:', JSON.stringify((await f('push-key')).j.subs));
  await f('follow', { crew: fcrew, target: crew, op: 'request' }); await t('follow', { crew, target: fcrew, op: 'accept' });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go80', data: { id: 'go80', name: 'Norwegen', start: d } }] });
  const base2 = (await got()).length;
  await t('push', { crew, changes: [{ coll: 'entries', id: 'p1', data: { id: 'p1', tripId: 'go80', type: 'sight', title: 'Preikestolen', place: 'Stavanger', date: d + 'T10:00' } }] });
  await t('push', { crew, changes: [{ coll: 'entries', id: 'p1', data: { id: 'p1', tripId: 'go80', type: 'sight', title: 'Preikestolen (geändert)', date: d + 'T10:00' } }] });
  await t('push', { crew, changes: [{ coll: 'entries', id: 'p2', data: { id: 'p2', tripId: 'go80', type: 'notiz', title: 'Gleich danach', date: d + 'T10:05' } }] });
  await t('push', { crew, changes: [{ coll: 'entries', id: 'p3', data: { id: 'p3', tripId: 'go80', type: 'notiz', title: 'Geheim', blogHide: true, date: d + 'T10:06' } }] });
  const all = (await got()).slice(base2);
  all.forEach(x => console.log(' ', x.path, '→', JSON.stringify(x.payload && { title: x.payload.title, body: x.payload.body })));
  console.log(all.length === 1 && all[0].path === '/franz76' && /neuer Eintrag/.test(all[0].payload.title) ? '✔ genau eine Mitteilung an Franz (Änderung, schneller zweiter und versteckter Eintrag ohne)' : '✘ unerwartet');
})();
