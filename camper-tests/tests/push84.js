const fs = require('fs'); const B = 'http://localhost:8766/api/';
const sub = JSON.parse(fs.readFileSync(__dirname + '/fakepush-sub.json'));
const sess = () => { let cookie = ''; return async (a, body, q = '', hdr = { 'X-Lammping': '1' }) => {
  const r = await fetch(`${B}?a=${a}${q}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...hdr, 'Content-Type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; return { s: r.status, j: await r.json().catch(() => null) }; }; };
const got = async () => (await (await fetch('http://localhost:9911/')).json());
(async () => {
  const t = sess(); await t('login', { login: 'tobi', password: 'segeln1' }); const crew = (await t('me')).j.crews[0].id;
  await t('push-sub', { endpoint: 'http://localhost:9911/tobi84', ...sub, tz: 'Europe/Berlin', pins: false, tickets: false, friends: true });
  await t('push', { crew, changes: [{ coll: 'trips', id: 'c84', data: { id: 'c84', name: 'Test 84', start: '2026-11-01' } }, { coll: 'entries', id: 'ce84', data: { id: 'ce84', tripId: 'c84', type: 'sight', title: 'Wasserfall', date: '2026-11-02T10:00' } }] });
  const tok = (await t('share', { crew, trip: 'c84', on: true, opts: {} })).j.token;
  const base = (await got()).length; const pub = sess();
  const d = 'e'.repeat(32);
  console.log('Ohne Namen:', (await pub('blog-comment', { t: tok, id: 'ce84', d, text: 'Hallo' })).j.error);
  console.log('Mit Namen:', (await pub('blog-comment', { t: tok, id: 'ce84', d, name: 'Opa', text: 'Super!' })).s);
  for (let i = 0; i < 6; i++) await pub('blog-comment', { t: tok, id: 'ce84', d, name: 'Opa', text: 'Nr ' + i });
  console.log('Grenze je Stunde:', (await pub('blog-comment', { t: tok, id: 'ce84', d, name: 'Opa', text: 'zu viel' })).j.error);
  await t('comment', { crew, id: 'ce84', text: 'Danke!' });
  const all = (await got()).slice(base);
  console.log('Mitteilungen an Tobi:', all.filter(x => x.path === '/tobi84').length, '→', JSON.stringify(all[0] && { title: all[0].payload.title, body: all[0].payload.body }));
  await t('share', { crew, trip: 'c84', on: true, opts: { comments: false } });
  console.log('Kommentare aus:', (await pub('blog-comment', { t: tok, id: 'ce84', d: 'f'.repeat(32), name: 'X', text: 'y' })).s);
})();
