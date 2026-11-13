// Server-Test Mitteilungen gegen den Ersatz-Push-Dienst (fakepush.js)
const fs = require('fs'); const B = 'http://localhost:8766/api/';
const sub = JSON.parse(fs.readFileSync(__dirname + '/fakepush-sub.json'));
const sess = () => { let cookie = ''; return async (a, body, q = '') => {
  const r = await fetch(`${B}?a=${a}${q}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return { s: r.status, j: await r.json().catch(() => null) }; }; };
const got = async () => (await (await fetch('http://localhost:9911/')).json());
const pad = n => String(n).padStart(2, '0');
(async () => {
  const t = sess(); await t('login', { login: 'tobi', password: 'segeln1' });
  const me = (await t('me')).j; const crew = me.crews[0].id;
  const key = (await t('push-key')).j;
  console.log('Öffentlicher Schlüssel:', key.key && key.key.length, 'Cron-Adresse:', !!key.cron);
  console.log('Anmelden:', (await t('push-sub', { endpoint: 'http://localhost:9911/tobi', ...sub, tz: 'Europe/Berlin', pins: true, tickets: true })).s);
  console.log('Test:', JSON.stringify((await t('push-test', { endpoint: 'http://localhost:9911/tobi' })).j));
  // Zweites Mitglied hängt einen Zettel an
  const nu = await t('user-save', { name: 'Gast70', login: 'gast70', password: 'geheim1', canCash: false, joinCrew: crew, shares: false });
  const g = sess(); await g('login', { login: 'gast70', password: 'geheim1' });
  await g('push-sub', { endpoint: 'http://localhost:9911/gast', ...sub, tz: 'Europe/Berlin', pins: true, tickets: false });
  await g('push', { crew, changes: [{ coll: 'games', id: 'pin70', data: { id: 'pin70', kind: 'pin', by: 'x', text: 'Essen ist fertig!', at: Date.now() } }] });
  await g('push', { crew, changes: [{ coll: 'games', id: 'pin70', data: { id: 'pin70', kind: 'pin', by: 'x', text: 'Essen ist fertig! (geändert)', at: Date.now() } }] });
  // Ticket in 2 Stunden (Ortszeit Berlin)
  const d = new Date(Date.now() + 2 * 3600e3), loc = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const date = `${loc.getFullYear()}-${pad(loc.getMonth() + 1)}-${pad(loc.getDate())}`, time = `${pad(loc.getHours())}:${pad(loc.getMinutes())}`;
  await t('push', { crew, changes: [{ coll: 'games', id: 'tk70', data: { id: 'tk70', kind: 'ticket', title: 'Fähre Kiel–Oslo', date, time, place: 'Norwegenkai', number: 'AB123' } }] });
  const ck = new URL(key.cron).searchParams.get('k');
  console.log('Cron 1:', JSON.stringify((await t('cron', undefined, `&k=${ck}`)).j), 'Cron 2:', JSON.stringify((await t('cron', undefined, `&k=${ck}`)).j));
  console.log('Cron falscher Schlüssel:', (await t('cron', undefined, '&k=falsch')).s);
  // Abgemeldetes Gerät
  await t('push-sub', { endpoint: 'http://localhost:9911/gone', ...sub, tz: 'Europe/Berlin', pins: false, tickets: true });
  await t('push', { crew, changes: [{ coll: 'games', id: 'tk71', data: { id: 'tk71', kind: 'ticket', title: 'Seilbahn', date, time } }] });
  await t('cron', undefined, `&k=${ck}`);
  console.log('Geräte von Tobi danach:', (await t('push-key')).j.subs.length);
  const all = await got();
  all.forEach(x => console.log(x.path, x.status || '', 'VAPID', x.vapidOk, x.enc, '→', x.error || JSON.stringify(x.payload)));
})();
