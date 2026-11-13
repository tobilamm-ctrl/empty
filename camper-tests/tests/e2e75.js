const { chromium } = require('playwright');
const BASE = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const pad = n => String(n).padStart(2, '0');
const day = n => { const d = new Date(Date.now() + n * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'de-DE' });
  await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); localStorage.setItem('lp.galleryCopy', 'false'); localStorage.setItem('lp.autoPing', 'false'); });
  await ctx.route(/tile\.openstreetmap|overpass|open-meteo|osrm|routing\.openstreetmap/, r => r.fulfill({ status: 404, body: '' }));
  const geo = { münchen: [48.3538, 11.7861], palma: [39.5517, 2.7388], hamburg: [53.63, 9.99] };
  await ctx.route(/nominatim/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.includes('search')) { const q = (u.searchParams.get('q') || '').toLowerCase(); const k = Object.keys(geo).find(x => q.includes(x));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(k ? [{ lat: String(geo[k][0]), lon: String(geo[k][1]), address: { country_code: 'de' } }] : []) }); }
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ address: { town: 'Palma', country_code: 'es' } }) });
  });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1200); };
  const close = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  const stamps = async () => { while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  await p.goto(BASE); await p.fill('[name=login]', 'tobi'); await p.fill('[name=password]', 'segeln1'); await p.click('form[data-form=login] button'); await p.waitForTimeout(2500); await stamps();
  const crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
  await p.evaluate(async ([crew, d]) => fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes: [
    { coll: 'trips', id: 't75', data: { id: 't75', name: 'Mallorca 75', start: d[0], end: d[2], color: '#C2410C', kind: 'flug' } },
    { coll: 'entries', id: 'f1', data: { id: 'f1', tripId: 't75', type: 'flug', title: 'Hinflug', date: d[0] + 'T09:00', lat: 39.5517, lng: 2.7388, place: 'Palma', extra: { from: 'München Flughafen', fromLat: 48.3538, fromLng: 11.7861 }, photos: [] } },
    { coll: 'entries', id: 'm1', data: { id: 'm1', tripId: 't75', type: 'mietwagen', title: 'Mietwagen', date: d[0] + 'T12:00', lat: 39.55, lng: 2.73, extra: { what: 'Übernahme' }, photos: [] } },
    { coll: 'entries', id: 'u1', data: { id: 'u1', tripId: 't75', type: 'unterkunft', title: 'Hotel Alcúdia', date: d[0] + 'T16:00', lat: 39.85, lng: 3.12, photos: [] } },
    { coll: 'entries', id: 's1', data: { id: 's1', tripId: 't75', type: 'freizeitpark', title: 'Wasserpark', date: d[1] + 'T11:00', lat: 39.70, lng: 2.95, photos: [] } },
    { coll: 'entries', id: 'h1', data: { id: 'h1', tripId: 't75', type: 'huette', title: 'Refugi', date: d[1] + 'T18:00', lat: 39.80, lng: 2.80, photos: [] } },
    { coll: 'entries', id: 'x1', data: { id: 'x1', tripId: 't75', type: 'faehre', title: 'Fähre Menorca', date: d[1] + 'T20:00', lat: 40.00, lng: 3.84, extra: { kind: 'Fähre' }, photos: [] } },
  ] }) }), [crew, [day(-1), day(0), day(5)]]);
  await p.reload(); await p.waitForTimeout(2500); await stamps();
  await go('#/reisen'); await p.click('.trips >> text=Mallorca 75'); await p.waitForTimeout(800); await close();
  await go('#/karte'); await p.waitForTimeout(1500);
  log('1 Linien:', await p.$$eval('path.leaflet-interactive', xs => xs.map(x => `${x.getAttribute('stroke')}${x.getAttribute('stroke-dasharray') ? '/' + x.getAttribute('stroke-dasharray') : ''}`).join(' ')));
  log('1 Flugzeug:', await p.$$eval('.leg-plane', xs => xs.length));
  await p.screenshot({ path: __dirname + '/shots75/karte.png' });
  // Statistik
  await go('#/statistik');
  log('2 Statistik:', await p.$eval('.kind-panel', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'fehlt'));
  const st = await p.evaluate(() => document.querySelector('.kind-panel') && 1);
  // Eintragsarten oben für die Flugreise
  await go('#/tagebuch');
  await p.click('.fab[data-action=entry-form]').catch(() => {}); await p.waitForTimeout(800);
  if (await p.$('[data-action=draft-drop]')) { await p.click('[data-action=draft-drop]'); await p.waitForTimeout(500); }
  log('3 Arten oben:', await p.$$eval('#sheet .type-grid label:not([hidden]) span', xs => xs.map(x => x.innerText.trim()).join(', ')));
  log('3 vorgewählt:', await p.$eval('#sheet [name=type]:checked', x => x.value));
  await close();
  // Reiseart ändern → Vorschlag
  await go('#/reisen');
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.action = 'trip-form'; b.dataset.id = 't75'; document.querySelector('#view').appendChild(b); b.click(); });
  await p.waitForTimeout(800);
  log('4 Formular Art:', await p.$eval('#sheet form[data-form=trip] .trip-kinds', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'kein Formular'));
  await p.screenshot({ path: __dirname + '/shots75/reiseform.png' });
  log('4 gewählt:', await p.$eval('#sheet [name=kind]:checked', x => x.value).catch(() => '-'));
  await p.click('#sheet [name=kind][value=kreuzfahrt] + span').catch(e => log('kein Klick', e.message));
  await p.click('#sheet form[data-form=trip] .sheet-foot .primary'); await p.waitForTimeout(1200);
  log('4 Vorschlag:', await p.$eval('#sheet form[data-form=trip-hide]', x => x.innerText.replace(/\s+/g, ' ')).catch(() => 'keiner'));
  await p.screenshot({ path: __dirname + '/shots75/vorschlag.png' });
  await p.click('#sheet form[data-form=trip-hide] .primary').catch(() => {}); await p.waitForTimeout(800);
  await go('#/mehr');
  log('5 Mehr enthält Tankbuch/Zuladung/Wasserwaage/Fahrzeug:', await p.$$eval('a', xs => ['Tankbuch', 'Zuladung', 'Wasserwaage', 'Fahrzeug', 'Autarkie', 'Kasse'].filter(t => xs.some(a => a.innerText.trim().split('\n')[0] === t)).join(',')));
  // Ticket → Eintrag
  await go('#/tickets'); await p.click('[data-action=ticket-form]'); await p.waitForTimeout(600);
  await p.click('#sheet [name=kindKey][value=flug] + span');
  log('6 Flug-Felder sichtbar:', await p.$eval('#sheet [data-for=flug]', x => !x.hidden), await p.$eval('#sheet [data-for=kabine]', x => x.hidden));
  await p.fill('#sheet [name=title]', 'Rückflug'); await p.fill('#sheet [name=date]', day(5)); await p.fill('#sheet [name=time]', '18:30');
  await p.fill('#sheet [name=place]', 'Palma – Hamburg'); await p.fill('#sheet [name=f_flug_flight]', 'EW 7583'); await p.fill('#sheet [name=f_flug_seat]', '12A, 12B');
  await p.click('#sheet form[data-form=ticket] .primary'); await p.waitForTimeout(1200);
  log('6 Fehler bisher:', errs.join(' / ')); log('6 sheet offen:', await p.evaluate(() => document.querySelector('#sheet').open), await p.$eval('.toast', x => x.innerText).catch(() => '-')); log('6 Frage:', await p.$eval('#sheet', x => x.innerText.replace(/\s+/g, ' ').slice(0, 140)).catch(() => '-'));
  await p.click('#sheet [data-action=ticket-entry]'); await p.waitForTimeout(1200);
  if (await p.$('[data-action=draft-drop]')) { await p.click('[data-action=draft-drop]'); await p.waitForTimeout(500); }
  log('6 Eintrag:', await p.evaluate(() => { const f = document.querySelector('#sheet form[data-form=entry]'); if (!f) return 'kein Formular';
    return [f.querySelector('[name=type]:checked').value, f.title.value, f.date.value, f.place.value, (f.querySelector('[name=x_flug_from]') || {}).value, (f.querySelector('[name=x_flug_no]') || {}).value].join(' | '); }));
  await p.click('#sheet form[data-form=entry] .sheet-foot .primary'); await p.waitForTimeout(2500);
  const e = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`)).json(); const d = j.docs.filter(x => x.coll === 'entries' && x.data && x.data.title === 'Rückflug').pop(); return d && d.data; }, crew);
  log('6 gespeichert:', e ? JSON.stringify({ type: e.type, lat: e.lat, lng: e.lng, extra: e.extra }) : 'nichts');
  const tk = await p.evaluate(async crew => { const j = await (await fetch(`api/?a=sync&crew=${crew}&since=0`)).json(); const d = j.docs.filter(x => x.coll === 'games' && x.data && x.data.title === 'Rückflug').pop(); return d && d.data; }, crew);
  log('6 Ticket:', tk ? JSON.stringify({ k: tk.kindKey, flight: tk.flight, seat: tk.seat, gate: tk.gate }) : '-');
  await go('#/tickets'); log('6 Ticketzeile:', await p.$eval('.tickets li', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '-'));
  // Blog
  const tok = await p.evaluate(async crew => (await (await fetch('api/?a=share', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, trip: 't75', on: true, opts: {} }) })).json()).token, crew);
  const r = await ctx.newPage(); r.on('pageerror', e => errs.push('blog ' + e.message));
  await r.goto(`${BASE}blog.html#${tok}`); await r.waitForTimeout(1800);
  log('7 Blog:', await r.$eval('.blog-head', x => x.innerText.replace(/\s+/g, ' ')), '| Flugzeuge:', await r.$$eval('.leg-plane', xs => xs.length));
  await (await r.$('.blog-map')).screenshot({ path: __dirname + '/shots75/blogkarte.png' });
  log('Fehler:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
