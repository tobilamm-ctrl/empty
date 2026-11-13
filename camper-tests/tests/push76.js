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
  // Erst merken (alte Reise), dann losfahren
  await t('push', { crew, changes: [{ coll: 'trips', id: 'alt76', data: { id: 'alt76', name: 'Alt', start: '2020-01-01', end: '2020-01-05' } }] });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go76', data: { id: 'go76', name: 'Geheimziel Norwegen', start: d } }] });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go76', data: { id: 'go76', name: 'Geheimziel Norwegen', start: d, color: '#123456' } }] });   // nochmal: keine 2. Mitteilung
  console.log('Franz folgt an:', (await f('follow', { crew: fcrew, target: crew, op: 'request' })).s);
  await f('follow', { crew: fcrew, target: crew, op: 'request' });   // doppelt: keine 2. Mitteilung
  const all = (await got()).slice(base);
  all.forEach(x => console.log(' ', x.path, 'VAPID', x.vapidOk, '→', JSON.stringify(x.payload && { title: x.payload.title, body: x.payload.body })));
  const ok = all.length === 2 && all.some(x => x.path === '/franz76' && /losgefahren/.test(x.payload.title) && !/Norwegen/.test(x.payload.body)) && all.some(x => x.path === '/tobi76' && /möchte euch folgen/.test(x.payload.title));
  console.log(ok ? '✔ losgefahren an Franz (ohne Reisename), Anfrage an Tobi' : '✘ unerwartet');
  // Nach dem Annehmen: Reisename kommt mit
  await t('follow', { crew, target: fcrew, op: 'accept' });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go76', data: { id: 'go76', name: 'Geheimziel Norwegen', start: d, ended: true } }] });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go77', data: { id: 'go77', name: 'Schweden', start: d } }] });
  const more = (await got()).slice(base + all.length);
  more.forEach(x => console.log(' ', x.path, '→', JSON.stringify(x.payload && { title: x.payload.title, body: x.payload.body })));
  // Ausgeschaltet
  await f('push-sub', { endpoint: 'http://localhost:9911/franz76', ...sub, tz: 'Europe/Berlin', pins: false, tickets: false, friends: false });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go77', data: { id: 'go77', name: 'Schweden', start: d, ended: true } }] });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'go78', data: { id: 'go78', name: 'Dänemark', start: d } }] });
  console.log((await got()).length === base + all.length + more.length ? '✔ ausgeschaltet: nichts mehr' : '✘ trotzdem Mitteilung');
})();
