const fs = require('fs'); const B = 'http://localhost:8766/api/';
const sub = JSON.parse(fs.readFileSync(__dirname + '/fakepush-sub.json'));
const sess = () => { let cookie = ''; return async (a, body, q = '') => {
  const r = await fetch(`${B}?a=${a}${q}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return { s: r.status, j: await r.json().catch(() => null) }; }; };
const pad = n => String(n).padStart(2, '0');
const at = h => { const d = new Date(Date.now() + h * 3600e3), l = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return { date: `${l.getFullYear()}-${pad(l.getMonth() + 1)}-${pad(l.getDate())}`, time: `${pad(l.getHours())}:${pad(l.getMinutes())}` }; };
(async () => {
  const before = (await (await fetch('http://localhost:9911/')).json()).length;
  const t = sess(); await t('login', { login: 'tobi', password: 'segeln1' });
  const crew = (await t('me')).j.crews[0].id;
  await t('push-sub', { endpoint: 'http://localhost:9911/tobi75', ...sub, tz: 'Europe/Berlin', pins: false, tickets: true });
  await t('push', { crew, changes: [
    { coll: 'games', id: 'fl75', data: { id: 'fl75', kind: 'ticket', kindKey: 'flug', title: 'Flug Palma – Hamburg', flight: 'EW 7583', number: 'XY12', ...at(22) } },
    { coll: 'games', id: 'fl76', data: { id: 'fl76', kind: 'ticket', kindKey: 'flug', title: 'Flug zu weit weg', ...at(30) } },
    { coll: 'games', id: 'fe75', data: { id: 'fe75', kind: 'ticket', kindKey: 'faehre', title: 'Fähre morgen', ...at(22) } },
  ] });
  const k = new URL((await t('push-key')).j.cron).searchParams.get('k');
  await t('cron', undefined, `&k=${k}`); await t('cron', undefined, `&k=${k}`);
  const all = (await (await fetch('http://localhost:9911/')).json()).slice(before);
  all.forEach(x => console.log(x.path, 'VAPID', x.vapidOk, '→', JSON.stringify(x.payload && { title: x.payload.title, body: x.payload.body })));
  console.log(all.length === 1 ? '✔ genau eine Check-in-Erinnerung' : `✘ ${all.length} Mitteilungen`);
})();
