const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const pad = n => String(n).padStart(2, '0');
const loc = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE', geolocation: { latitude: 48.95, longitude: 11.2, accuracy: 8 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); localStorage.setItem('lp.galleryCopy', 'false'); });
  await ctx.route(/tile\.openstreetmap|overpass|open-meteo|osrm/, r => r.fulfill({ status: 404, body: '' }));
  await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ address: { town: 'Manching', country_code: 'de' } }) }));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept('Opa Heinz'));
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1200); };
  const close = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  const stamps = async () => { while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  await p.goto(URL); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500); await stamps();
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  const now = new Date(), d1 = loc(new Date(now - 60 * 60000)), d1b = loc(new Date(now - 50 * 60000)), d2 = loc(new Date(now - 20 * 60000));
  const tok = await p.evaluate(async ([crew, d1, d1b, d2, today]) => {
    const post = (a, body) => fetch('api/?a=' + a, { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
    const bytes = n => btoa(String.fromCharCode(0x1A, 0x45, 0xDF, 0xA3, ...Array(n).fill(7)));
    await post('photo', { crew, id: 'snd74', data: 'data:audio/webm;base64,' + bytes(2000) });
    await post('push', { crew, changes: [
      { coll: 'trips', id: 't74', data: { id: 't74', name: 'Test 74', start: today, color: '#2E7FB8' } },
      { coll: 'entries', id: 'e1', data: { id: 'e1', tripId: 't74', type: 'sight', title: 'Burg Manching', date: d1, lat: 48.7211, lng: 11.4858, place: 'Manching',
        photos: [{ id: 'pa', thumb: '', lat: 48.80, lng: 11.40, at: d1b }], sounds: [{ id: 'snd74', sec: 12 }], text: 'Schön' } },
      { coll: 'entries', id: 'e2', data: { id: 'e2', tripId: 't74', type: 'notiz', title: 'Geheim', date: d2, lat: 48.9, lng: 11.3, blogHide: true, photos: [] } },
    ] });
    const sh = await post('share', { crew, trip: 't74', on: true, opts: { photos: true, texts: true, sounds: true, likes: true } });
    await fetch('api/?a=blog-like', { method: 'POST', credentials: 'omit', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ t: sh.token, id: 'e1', d: 'c'.repeat(32), name: 'Oma Gerda' }) });
    await fetch('api/?a=blog-like', { method: 'POST', credentials: 'omit', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ t: sh.token, id: 'e1', d: 'd'.repeat(32) }) });
    return sh.token;
  }, [crew, d1, d1b, d2, d1.slice(0, 10)]);
  await p.reload(); await p.waitForTimeout(2500); await stamps();
  await go('#/reisen'); await p.click('.trips >> text=Test 74'); await p.waitForTimeout(800); await close();
  await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {});
  await p.waitForTimeout(7000);   // Herzen (nach 5 s) und stiller Standort (nach 6 s)
  await go('#/tagebuch');
  log('1 Badges e1:', await p.$$eval('.stop-badge', xs => xs.map(x => x.innerText.trim()).join(' | ')));
  await p.waitForTimeout(1500);
  const cnt = await p.$eval('.react-count', x => x.innerText.trim()).catch(() => '');
  log(cnt === '2' ? '✔' : '✘', '1 Herz-Zahl am Eintrag (Blog zählt mit):', cnt || 'fehlt');
  await p.click('.react-count'); await p.waitForTimeout(500);
  const who = await p.$eval('#sheet .who-list', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '');
  log(/Reiseblog.*Oma Gerda/.test(who) ? '✔' : '✘', '1 Von wem:', who);
  await close();
  await p.screenshot({ path: __dirname + '/shots74/tagebuch.png' });
  const sync = await p.evaluate(async crew => (await (await fetch(`api/?a=sync&crew=${crew}&since=0`)).json()).docs, crew);
  const pd = sync.filter(x => x.coll === 'meta' && x.id === 'pings_t74').pop();
  log('2 Stiller Punkt:', pd ? JSON.stringify(pd.data.pts) : 'keiner');
  // Karte: Linie durch Einträge, Foto-Standort und gemerkten Punkt
  await go('#/karte'); await p.waitForTimeout(1500);
  log('3 Linien auf der Karte:', await p.$$eval('path.leaflet-interactive', xs => xs.map(x => (x.getAttribute('d').match(/L/g) || []).length + 1).join(',')));
  // Einstellungen: Tracker
  await go('#/einstellungen'); await p.waitForTimeout(1500);
  log('4 Panel:', await p.$eval('#trackPanel', x => x.innerText.replace(/\s+/g, ' ').slice(0, 160)).catch(() => 'fehlt'));
  await p.click('[data-action=trk-on]'); await p.waitForTimeout(1200);
  log('4 Adresse:', await p.$eval('#trackBody .cron-url', x => x.innerText).catch(() => 'fehlt'));
  await p.$eval('#trackPanel', x => x.querySelectorAll('details').forEach(d => { d.open = true; }));
  await (await p.$('#trackPanel')).screenshot({ path: __dirname + '/shots74/tracker.png' });
  // Speicherplatz
  await p.click('[data-action=storage-check]'); await p.waitForTimeout(2500);
  log('5 Speicher:', await p.$eval('#sheet .storage', x => x.innerText.replace(/\s+/g, ' ').slice(0, 600)));
  await (await p.$('#sheet')).screenshot({ path: __dirname + '/shots74/speicher.png' });
  await close();
  // Reiseblog als Leser
  const r = await ctx.newPage(); r.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Opa Heinz' : undefined)); r.on('pageerror', e => errs.push('blog ' + e.message));
  const audio = []; r.on('response', x => { if (/blogaudio/.test(x.url())) audio.push(x.status() + ' ' + x.headers()['content-type']); });
  await r.goto(`${URL}blog.html#${tok}`); await r.waitForTimeout(1500);
  log('6 Blog Herz vorher:', await r.$eval('.blog-like', x => x.innerText.trim()), ' Ton:', await r.$eval('.blog-snd', x => x.innerText.trim()), ' Geheim sichtbar:', !!(await r.$('text=Geheim')));
  await r.click('.blog-like'); await r.waitForTimeout(800);
  log('6 Blog Herz nachher:', await r.$eval('.blog-like', x => x.innerText.trim() + (x.classList.contains('on') ? ' (an)' : '')));
  await r.click('.blog-snd'); await r.waitForTimeout(1000);
  log('6 Ton geladen:', audio.join(', '));
  await (await r.$('.timeline')).screenshot({ path: __dirname + '/shots74/blog.png' });
  await r.reload(); await r.waitForTimeout(1200);
  log('6 nach Neuladen:', await r.$eval('.blog-like', x => x.innerText.trim() + (x.classList.contains('on') ? ' (an)' : '')));
  const bl = await p.evaluate(async crew => (await (await fetch(`api/?a=blog-likes&crew=${crew}`)).json()).likes.e1, crew);
  log('7 Tagebuch-Daten:', JSON.stringify(bl));
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
