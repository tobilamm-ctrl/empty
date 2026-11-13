// Server-Test Paket D: Herzen im Blog, Sprachnotizen im Blog, Größen, Tracker
const B = 'http://localhost:8766/api/';
const sess = () => { let cookie = ''; return async (a, body, q = '', hdr = { 'X-Lammping': '1' }) => {
  const r = await fetch(`${B}?a=${a}${q}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...hdr, 'Content-Type': 'application/json', cookie }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch { j = txt.slice(0, 40); }
  return { s: r.status, j, type: r.headers.get('content-type') }; }; };
const ok = (c, m) => console.log(c ? '✔' : '✘', m);
(async () => {
  const t = sess(); await t('login', { login: 'tobi', password: 'segeln1' });
  const me = (await t('me')).j; const crew = me.crews[0].id;
  const d = new Date().toISOString().slice(0, 10);
  // Laufende Reise, Eintrag mit Foto und Sprachnotiz, ein ausgeblendeter Eintrag
  const jpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(500).fill(1)]).toString('base64');
  const webm = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, ...Array(3000).fill(2)]).toString('base64');
  await t('photo', { crew, id: 'ph74', data: 'data:image/jpeg;base64,' + jpg });
  await t('photo', { crew, id: 'sn74', data: 'data:audio/webm;base64,' + webm });
  await t('push', { crew, changes: [
    { coll: 'trips', id: 'tr74', data: { id: 'tr74', name: 'Test 74', start: d, end: '', color: '#0F6670' } },
    { coll: 'entries', id: 'en74', data: { id: 'en74', tripId: 'tr74', type: 'sight', title: 'Burg', date: d + 'T10:00', photos: [{ id: 'ph74', thumb: 'x' }], sounds: [{ id: 'sn74', sec: 7 }] } },
    { coll: 'entries', id: 'en74h', data: { id: 'en74h', tripId: 'tr74', type: 'notiz', title: 'Geheim', date: d + 'T11:00', blogHide: true, sounds: [{ id: 'sn74h', sec: 3 }] } },
    { coll: 'meta', id: 'follow', data: { id: 'follow', live: true } },
  ] });
  const sh = await t('share', { crew, trip: 'tr74', on: true, opts: { photos: true, texts: true, sounds: true, likes: true } });
  const tok = sh.j.token; ok(!!tok, 'Reiseblog-Link');
  const pub = sess();
  let b = await pub('blog', undefined, `&t=${tok}`, {});
  const e = b.j.entries.find(x => x.id === 'en74');
  ok(e && e.sounds.length === 1 && e.sounds[0].sec === 7, 'Blog liefert Sprachnotiz');
  ok(!b.j.entries.find(x => x.id === 'en74h'), 'Ausgeblendeter Eintrag fehlt');
  ok(b.j.likesOn === true, 'likesOn');
  const au = await pub('blogaudio', undefined, `&t=${tok}&id=sn74`, {});
  ok(au.s === 200 && au.type === 'audio/webm', `blogaudio ${au.s} ${au.type}`);
  ok((await pub('blogaudio', undefined, `&t=${tok}&id=ph74`, {})).s === 404, 'Foto nicht als Ton');
  ok((await pub('blogaudio', undefined, `&t=${tok}&id=sn74h`, {})).s === 404, 'Ton aus ausgeblendetem Eintrag nicht');
  // Herzen
  const dev1 = 'a'.repeat(32), dev2 = 'b'.repeat(32);
  let r = await pub('blog-like', { t: tok, id: 'en74', d: dev1, name: 'Oma <b>Gerda</b>' });
  ok(r.j.n === 1, 'Herz 1 ' + JSON.stringify(r.j));
  r = await pub('blog-like', { t: tok, id: 'en74', d: dev1, name: 'Oma' }); ok(r.j.n === 1, 'gleiches Gerät zählt einmal');
  r = await pub('blog-like', { t: tok, id: 'en74', d: dev2 }); ok(r.j.n === 2, 'zweites Gerät');
  ok((await pub('blog-like', { t: tok, id: 'en74h', d: dev2 })).s === 400, 'ausgeblendeter Eintrag nicht likebar');
  ok((await pub('blog-like', { t: tok, id: 'en74', d: dev2 }, '', {})).s === 403, 'ohne Header abgelehnt');
  b = await pub('blog', undefined, `&t=${tok}`, {}); ok(b.j.likes.en74 === 2, 'Blog zeigt 2 Herzen');
  const bl = await t('blog-likes', undefined, `&crew=${crew}`);
  ok(bl.j.likes.en74 && bl.j.likes.en74.n === 2, 'Tagebuch: ' + JSON.stringify(bl.j.likes.en74));
  r = await pub('blog-like', { t: tok, id: 'en74', d: dev2, off: true }); ok(r.j.n === 1, 'Herz zurücknehmen');
  // Herzen ausgeschaltet
  await t('share', { crew, trip: 'tr74', on: true, opts: { photos: true, likes: false } });
  ok((await pub('blog-like', { t: tok, id: 'en74', d: dev2 })).s === 403, 'Herzen aus → 403');
  b = await pub('blog', undefined, `&t=${tok}`, {}); ok(b.j.likesOn === false && b.j.entries[0].sounds.length === 1, 'likes aus, sounds Standard an');
  // Größen
  const sz = await t('sizes', undefined, `&crew=${crew}`);
  const tr = sz.j.trips.find(x => x.id === 'tr74');
  ok(tr && tr.photo > 500 && tr.sound > 3000, 'Größe je Reise ' + JSON.stringify(tr));
  ok(sz.j.server && sz.j.server.db > 0 && sz.j.server.crews.length, 'Webspace für Super-Admin ' + JSON.stringify({ ...sz.j.server, crews: sz.j.server.crews.length }));
  // Tracker
  ok((await t('gps-key', undefined, `&crew=${crew}`)).j.key === null, 'noch kein Schlüssel');
  const k = (await t('gps-key', { crew })).j; ok(/a=gps&k=[a-f0-9]{32}$/.test(k.url), 'Adresse ' + k.url);
  const g = (q, body, hdr = {}) => fetch(`${k.url}${q}`, { method: body ? 'POST' : 'GET', headers: hdr, body }).then(async x => ({ s: x.status, j: await x.text() }));
  const t0 = Math.floor(Date.now() / 1000) - 3600;
  console.log(' GPSLogger:', JSON.stringify(await g(`&lat=48.7150&lon=11.4900&time=${new Date(t0 * 1000).toISOString()}&acc=8`)));
  await g(`&lat=48.7151&lon=11.4901&time=${new Date((t0 + 60) * 1000).toISOString()}&acc=8`);   // steht
  await g(`&lat=48.8000&lon=11.5000&time=${new Date((t0 + 600) * 1000).toISOString()}&acc=500`);  // ungenau
  console.log(' OwnTracks:', JSON.stringify(await g('', JSON.stringify({ _type: 'location', lat: 48.75, lon: 11.45, tst: t0 + 900, acc: 10 }), { 'Content-Type': 'application/json' })));
  console.log(' Overland:', JSON.stringify(await g('', JSON.stringify({ locations: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [11.40, 48.80] }, properties: { timestamp: new Date((t0 + 1800) * 1000).toISOString(), horizontal_accuracy: 5 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [11.40, 48.80] }, properties: { timestamp: new Date((t0 + 1700) * 1000).toISOString(), horizontal_accuracy: 5 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [13.40, 52.50] }, properties: { timestamp: new Date((t0 + 1860) * 1000).toISOString(), horizontal_accuracy: 5 } },
  ] }), { 'Content-Type': 'application/json' })));
  console.log(' Formular-POST:', JSON.stringify(await g('', `lat=48.70&lon=11.38&time=${t0 + 3000}&acc=12`, { 'Content-Type': 'application/x-www-form-urlencoded' })));
  ok((await fetch(`${B}?a=gps&k=${'0'.repeat(32)}&lat=1&lon=1`)).status === 403, 'falscher Schlüssel 403');
  const sync = (await t('sync', undefined, `&crew=${crew}&since=0`)).j.docs.filter(x => x.coll === 'tracks' && x.data && x.data.auto === 'tracker');
  ok(sync.length === 1, 'eine Tracker-Strecke');
  const td = sync[0].data; console.log(' Strecke:', td.name, td.pts.split(';').length, 'Punkte', td.km, 'km', td.pts);
  ok(td.pts.split(';').length === 4, '4 Punkte (Stillstand, ungenau, älter, Ausreißer weg)');
  const kk = (await t('gps-key', undefined, `&crew=${crew}`)).j; ok(kk.last > 0, 'zuletzt gemeldet');
  // Livepos über die Folgen-Ansicht prüfen wir direkt in der Tabelle nicht; neuer Schlüssel macht den alten ungültig
  await t('gps-key', { crew }); ok((await g('&lat=1&lon=1')).s === 403, 'alter Schlüssel nach Erneuern ungültig');
  await t('gps-key', { crew, off: true }); ok((await t('gps-key', undefined, `&crew=${crew}`)).j.key === null, 'ausgeschaltet');
})();
