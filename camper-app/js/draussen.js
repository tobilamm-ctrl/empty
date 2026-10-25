// Draußen am Stellplatz: Gezeiten an der Küste, Sternenhimmel (Mond, Dunkelheit, Sternschnuppen, Wolken),
// Solarstrom-Prognose in der Autarkie und Notfall-Orte (Krankenhaus, Apotheke, Arzt, Tierarzt), die für alle offline bereitliegen.

export default function installDraussen(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, esc, icon, num, save, toast, render, openSheet, closeSheet,
    currentTrip, tripEntries, hasPos, byDate, km, navUrl, ago, fmtDay, today, chromeHooks,
  } = app;
  const sheetHead = app.sheetHead;
  const dec = (v, n = 1) => (v == null || !isFinite(v) ? '–' : Number(v).toLocaleString('de-DE', { maximumFractionDigits: n }));
  const hhmm = d => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const pad = n => String(n).padStart(2, '0');
  // Uhrzeit aus einer Ortszeit (als UTC-Zahl ohne Zeitzone gespeichert)
  const hm = ms => { const d = new Date(ms); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };

  // Wo stehen wir? Letzter Stellplatz der laufenden Reise, sonst „Wetter hier“
  function spot() {
    const t = currentTrip();
    const last = t && tripEntries(t).filter(e => hasPos(e) && e.type === 'stellplatz').sort(byDate).pop();
    if (last) return { lat: last.lat, lng: last.lng, name: last.title || last.place || 'Stellplatz', place: last.place || '' };
    const here = LS.get('wx.here', null);
    return here ? { lat: here.lat, lng: here.lng, name: 'Standort', place: '' } : null;
  }
  // Kleine Abfrage mit Zwischenspeicher im Handy
  const busy = new Set();
  async function cached(key, maxAge, url, pick) {
    const c = LS.get(key, null);
    if ((c && Date.now() - c.at < maxAge) || busy.has(key) || !navigator.onLine) return;
    busy.add(key);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      LS.set(key, { at: Date.now(), ...pick(await r.json()) });
    } catch { if (!c) LS.set(key, { at: Date.now() - maxAge + 10 * 60000, err: true }); }
    busy.delete(key);
    if (['wetter', 'tagebuch', 'autarkie'].includes(ui.route)) render();
  }

  /* ====================================================================== */
  /* Gezeiten (Open-Meteo Marine: Meeresspiegel einschließlich Gezeiten)     */
  /* ====================================================================== */

  const tideKey = p => `tide.${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
  function loadTide(p) {
    cached(tideKey(p), 6 * 3600e3,
      `https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat.toFixed(4)}&longitude=${p.lng.toFixed(4)}&hourly=sea_level_height_msl&timezone=auto&forecast_days=3`,
      d => {
        const h = (d.hourly || {}).sea_level_height_msl || [], ts = (d.hourly || {}).time || [];
        const ok = h.filter(v => v != null);
        if (ok.length < 24) return { none: true };
        const range = Math.max(...ok) - Math.min(...ok);
        const ext = [];
        // Hoch- und Niedrigwasser: Wendepunkte der Stundenwerte, genauer mit einer Parabel durch drei Punkte
        for (let i = 1; i < h.length - 1; i++) {
          const [a, b, c] = [h[i - 1], h[i], h[i + 1]];
          if (a == null || b == null || c == null) continue;
          const hi = b >= a && b > c, lo = b <= a && b < c;
          if (!hi && !lo) continue;
          const k = (a + c - 2 * b) / 2, m = (c - a) / 2;
          const off = k ? Math.max(-0.5, Math.min(0.5, -m / (2 * k))) : 0;
          ext.push({ t: Date.parse(ts[i] + ':00Z') + off * 3600e3, h: b - (k ? m * m / (4 * k) : 0), hi });
        }
        return { ext, range, off: d.utc_offset_seconds || 0 };
      });
  }
  // Nur zeigen, wo es spürbare Gezeiten gibt (mehr als einen halben Meter Unterschied)
  function tideData(p) {
    if (!p) return null;
    const c = LS.get(tideKey(p), null);
    loadTide(p);
    if (!c || c.err || c.none || c.range < 0.5) return null;
    const nowLocal = Date.now() + c.off * 1000;
    return { ...c, next: c.ext.filter(x => x.t > nowLocal - 15 * 60000), nowLocal };
  }
  const tideWord = x => (x.hi ? 'Flut' : 'Ebbe');
  function tideCard(p) {
    const d = tideData(p);
    if (!d) return '';
    const byDay = {};
    d.next.forEach(x => (byDay[new Date(x.t).toISOString().slice(0, 10)] ||= []).push(x));
    return `<section class="wx-card tide"><h2>🌊 Gezeiten</h2><p class="sub">${esc(p.name)}, Unterschied bis ${dec(d.range)} m</p>
      <ul class="tide-days">${Object.entries(byDay).slice(0, 3).map(([day, xs]) => `<li><span class="wx-day">${day === new Date(d.nowLocal).toISOString().slice(0, 10) ? 'Heute' : fmtDay(day).split(',')[0]}</span>
        ${xs.map(x => `<span class="tide-x ${x.hi ? 'hi' : 'lo'}">${x.hi ? '▲' : '▼'} ${tideWord(x)} <b>${hm(x.t)}</b></span>`).join('')}</li>`).join('')}</ul>
      <p class="sub">Vorhersage-Modell, ohne Gewähr – nicht für die Schifffahrt. Vor Wattwanderungen die örtliche Gezeitentafel prüfen.</p></section>`;
  }

  /* ====================================================================== */
  /* Sternenhimmel                                                           */
  /* ====================================================================== */

  // Sonnenstand: Zeiten, zu denen die Sonne eine bestimmte Höhe hat (-18° = astronomische Nacht)
  function sunAt(day, lat, lng, h0) {
    const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, e = rad * 23.4397;
    const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
    const d = new Date(day + 'T12:00:00Z') / dayMs - 0.5 + J1970 - J2000;
    const lw = rad * -lng, phi = rad * lat;
    const n = Math.round(d - J0 - lw / (2 * Math.PI));
    const ds = J0 + lw / (2 * Math.PI) + n;
    const M = rad * (357.5291 + 0.98560028 * ds);
    const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    const dc = Math.asin(Math.sin(L) * Math.sin(e));
    const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const cosw = (Math.sin(rad * h0) - Math.sin(phi) * Math.sin(dc)) / (Math.cos(phi) * Math.cos(dc));
    if (cosw < -1) return { never: true };
    if (cosw > 1) return { always: true };
    const set = J2000 + J0 + (Math.acos(cosw) + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJulian(noon - (set - noon)), set: fromJulian(set) };
  }
  function moon(at = Date.now()) {
    const syn = 29.530588853;
    const age = (((at - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn + syn) % syn;
    const illum = (1 - Math.cos(2 * Math.PI * age / syn)) / 2;
    const P = [[1.85, 'Neumond', '🌑'], [5.54, 'Zunehmende Sichel', '🌒'], [9.23, 'Erstes Viertel', '🌓'], [12.92, 'Zunehmender Mond', '🌔'],
      [16.61, 'Vollmond', '🌕'], [20.3, 'Abnehmender Mond', '🌖'], [23.99, 'Letztes Viertel', '🌗'], [27.68, 'Abnehmende Sichel', '🌘'], [30, 'Neumond', '🌑']];
    const [, name, sym] = P.find(([a]) => age < a);
    return { age, illum, name, sym, full: syn / 2 - age > 0 ? syn / 2 - age : syn * 1.5 - age };
  }
  // Sternschnuppen-Ströme: Name, aktiv von, bis, Höhepunkt (MM-TT), Sternschnuppen pro Stunde im besten Fall
  const SHOWERS = [
    ['Quadrantiden', '12-28', '01-12', '01-03', 80], ['Lyriden', '04-14', '04-30', '04-22', 18], ['Eta-Aquariiden', '04-19', '05-28', '05-06', 40],
    ['Perseiden', '07-17', '08-24', '08-12', 100], ['Orioniden', '10-02', '11-07', '10-21', 20], ['Leoniden', '11-06', '11-30', '11-17', 15],
    ['Geminiden', '12-04', '12-20', '12-14', 150],
  ];
  function shower(day) {
    const md = day.slice(5);
    const inRange = (a, b) => (a <= b ? md >= a && md <= b : md >= a || md <= b);
    const s = SHOWERS.find(([, a, b]) => inRange(a, b));
    if (!s) return null;
    const y = +day.slice(0, 4);
    const nearest = [y - 1, y, y + 1].map(yy => Math.round((new Date(`${yy}-${s[3]}T12:00`) - new Date(day + 'T12:00')) / 864e5)).sort((a, b) => Math.abs(a) - Math.abs(b))[0];
    return { name: s[0], rate: s[4], days: nearest };
  }
  const cloudKey = p => `clouds.${p.lat.toFixed(1)},${p.lng.toFixed(1)}`;
  function clouds(p) {
    cached(cloudKey(p), 2 * 3600e3,
      `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(2)}&longitude=${p.lng.toFixed(2)}&hourly=cloud_cover&timezone=auto&forecast_days=2`,
      d => ({ time: (d.hourly || {}).time || [], cc: (d.hourly || {}).cloud_cover || [] }));
    const c = LS.get(cloudKey(p), null);
    if (!c || c.err || !c.time) return null;
    // Heute Nacht: 22 bis 2 Uhr Ortszeit
    const d = today();
    const tomorrow = new Date(Date.parse(d + 'T12:00Z') + 864e5).toISOString().slice(0, 10);
    const vals = c.time.map((t, i) => [t, c.cc[i]]).filter(([t, v]) => v != null && ((t.slice(0, 10) === d && t.slice(11, 13) >= '22') || (t.slice(0, 10) === tomorrow && t.slice(11, 13) < '03'))).map(([, v]) => v);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  function stars(p) {
    const d = today();
    const m = moon(Date.now() + 6 * 3600e3);            // Mond um Mitternacht
    const dusk = sunAt(d, p.lat, p.lng, -18);
    const next = new Date(Date.parse(d + 'T12:00Z') + 864e5).toISOString().slice(0, 10);
    const dawn = sunAt(next, p.lat, p.lng, -18);
    const cl = clouds(p);
    const sh = shower(d);
    let chance = 'gut', why = '';
    if (dusk.never) { chance = 'mäßig'; why = 'es wird heute nicht ganz dunkel'; }
    if (m.illum > 0.75) { chance = chance === 'gut' ? 'mäßig' : chance; why = why || 'der helle Mond überstrahlt schwache Sterne'; }
    if (m.illum < 0.3 && !dusk.never) { chance = 'sehr gut'; why = 'kaum Mondlicht'; }
    if (cl != null && cl > 70) { chance = 'schlecht'; why = 'viele Wolken'; } else if (cl != null && cl > 40 && chance !== 'schlecht') { chance = 'mäßig'; why = 'teils bewölkt'; }
    return { m, dusk, dawn, cl, sh, chance, why };
  }
  function starCard(p) {
    const s = stars(p);
    return `<section class="wx-card stars-card"><h2>✨ Sternenhimmel heute Nacht</h2><p class="sub">${esc(p.name)}</p>
      <p class="star-chance ${s.chance.replace(' ', '-')}">Sternen-Chance: <b>${s.chance}</b>${s.why ? ` – ${s.why}` : ''}</p>
      <dl class="facts-list">
        <div><dt>Mond</dt><dd>${s.m.sym} ${s.m.name}, ${Math.round(s.m.illum * 100)} % beleuchtet</dd></div>
        <div><dt>Richtig dunkel</dt><dd>${s.dusk.never ? 'heute nicht (helle Sommernacht)' : s.dusk.always ? 'den ganzen Tag (Polarnacht)' : `${hhmm(s.dusk.set)} bis ${s.dawn.rise ? hhmm(s.dawn.rise) : '–'} Uhr`}</dd></div>
        ${s.cl != null ? `<div><dt>Wolken in der Nacht</dt><dd>etwa ${Math.round(s.cl)} %</dd></div>` : ''}
        ${s.sh ? `<div><dt>Sternschnuppen</dt><dd>${s.sh.name}: ${s.sh.days === 0 ? 'heute Höhepunkt' : s.sh.days > 0 ? `Höhepunkt in ${s.sh.days} ${s.sh.days === 1 ? 'Tag' : 'Tagen'}` : `Höhepunkt war vor ${-s.sh.days} ${s.sh.days === -1 ? 'Tag' : 'Tagen'}`}${Math.abs(s.sh.days) <= 2 ? `, bis zu ${s.sh.rate} pro Stunde` : ''}</dd></div>` : ''}
      </dl>
      <p class="sub">Tipp: Augen 20 Minuten an die Dunkelheit gewöhnen lassen, kein Handylicht. ${Math.round(s.m.full) < 1 ? 'Heute ist Vollmond.' : `Nächster Vollmond in ${Math.round(s.m.full)} ${Math.round(s.m.full) === 1 ? 'Tag' : 'Tagen'}.`}</p></section>`;
  }
  app.starsTonight = p => stars(p);

  /* ---------- In Wetter und Heute-Karte ---------- */

  const wetter = VIEWS.wetter;
  VIEWS.wetter = () => {
    const html = wetter();
    const p = spot();
    if (!p) return html;
    const extra = `${tideCard(p)}${starCard(p)}`;
    return html.replace('<p class="sub source">', `${extra}<p class="sub source">`);
  };
  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard ? todayCard(t, st) : '';
    const p = spot();
    if (!html || !p) return html;
    const d = tideData(p);
    const tide = d && d.next.slice(0, 2).map(x => `${x.hi ? '▲' : '▼'} ${tideWord(x)} ${hm(x.t)}`).join(' · ');
    const hour = new Date().getHours();
    const s = hour >= 16 || hour < 3 ? stars(p) : null;
    const row = [tide ? `<a class="today-tide" href="#/wetter">🌊 ${tide}</a>` : '',
      s ? `<a class="today-stars" href="#/wetter">${s.m.sym} Sternen-Chance ${s.chance}${s.sh && Math.abs(s.sh.days) <= 2 ? `, ${s.sh.name}!` : ''}</a>` : ''].filter(Boolean).join('');
    return row ? html.replace(/<\/section>\s*$/, `<div class="today-sky">${row}</div></section>`) : html;
  };

  /* ====================================================================== */
  /* Solarstrom-Prognose (in der Autarkie)                                   */
  /* ====================================================================== */

  const autarky = () => S.meta.find(m => m.id === 'autarky') || { id: 'autarky' };
  const solarKey = p => `solar.${p.lat.toFixed(1)},${p.lng.toFixed(1)}`;
  function solarPanel() {
    const a = autarky(), sol = a.solar || {};
    const p = spot();
    const head = `<div class="toolbar"><h2>☀️ Solarstrom</h2><button class="icon-btn small" data-action="solar-form" aria-label="Solaranlage einstellen">${icon('edit')}</button></div>`;
    if (!sol.wp) return `<section class="panel res">${head}<p class="hint">Tragt die Leistung eurer Solaranlage ein (z. B. 200 Wp), dann schätzt die App aus der Wettervorhersage, wie viel Strom die nächsten Tage hereinkommt.</p></section>`;
    if (!p) return `<section class="panel res">${head}<p class="hint">Für die Prognose braucht die App einen Stellplatz mit Position oder „Wetter hier“.</p></section>`;
    cached(solarKey(p), 3 * 3600e3,
      `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(2)}&longitude=${p.lng.toFixed(2)}&daily=shortwave_radiation_sum,sunshine_duration&timezone=auto&forecast_days=4`,
      d => ({ day: (d.daily || {}).time || [], rad: (d.daily || {}).shortwave_radiation_sum || [], sun: (d.daily || {}).sunshine_duration || [] }));
    const c = LS.get(solarKey(p), null);
    if (!c || c.err || !c.day) return `<section class="panel res">${head}<p class="hint">${c && c.err ? 'Vorhersage gerade nicht abrufbar. Das braucht Internet.' : 'Vorhersage wird geladen …'}</p></section>`;
    // Ertrag: Einstrahlung (kWh/m²) × Leistung × Wirkungsgrad der Anlage (flach liegend, Laderegler, Kabel)
    const eff = (sol.eff || 70) / 100;
    const days = c.day.map((d, i) => ({ d, wh: (c.rad[i] || 0) / 3.6 * sol.wp * eff, sun: (c.sun[i] || 0) / 3600 }));
    const pw = { cap: 100, perDay: 25, level: 100, at: Date.now(), ...(a.power || {}) };
    const now = Math.max(0, pw.level - pw.perDay * ((Date.now() - pw.at) / 864e5));
    let level = now, low = null;
    const rows = days.map(x => {
      const pct = sol.wh ? (x.wh / sol.wh) * 100 : null;
      if (pct != null) { level = Math.min(100, level - pw.perDay + pct); if (level < 20 && !low) low = x.d; }
      return { ...x, pct, level };
    });
    const maxWh = Math.max(1, ...rows.map(r => r.wh));
    return `<section class="panel res solar">${head}
      <ul class="solar-days">${rows.map((r, i) => `<li><span class="wx-day">${i === 0 ? 'Heute' : fmtDay(r.d).split(',')[0]}</span>
        <span class="yb-bar"><i style="width:${(r.wh / maxWh) * 100}%"></i></span>
        <b>${dec(r.wh / 1000, 1)} kWh</b><small>☀ ${dec(r.sun, 0)} Std.${r.pct != null ? `, +${Math.round(r.pct)} %` : ''}</small></li>`).join('')}</ul>
      ${sol.wh ? `<p>${low ? `Bei eurem Verbrauch (${dec(pw.perDay, 0)} % am Tag) wird es <b>am ${fmtDay(low).split(',')[0]} knapp</b> – Landstrom einplanen oder sparsam sein.`
        : `Bei eurem Verbrauch (${dec(pw.perDay, 0)} % am Tag) <b>reicht der Strom</b>, in vier Tagen etwa ${Math.round(Math.max(0, level))} %.`}</p>` : '<p class="sub">Mit der Akku-Größe in Wh rechnet die App auch aus, ob der Strom reicht.</p>'}
      <p class="sub">${dec(sol.wp, 0)} Wp${sol.wh ? `, Akku ${dec(sol.wh, 0)} Wh` : ''}, Schätzung mit ${Math.round(eff * 100)} % Wirkungsgrad. Schatten und Ausrichtung ändern viel. Daten: Open-Meteo.</p></section>`;
  }
  const autarkie = VIEWS.autarkie;
  VIEWS.autarkie = () => autarkie().replace('<p class="sub">Tipp:', `${solarPanel()}<p class="sub">Tipp:`);
  ACTIONS['solar-form'] = () => {
    const sol = autarky().solar || {};
    openSheet(`<form data-form="solar">${sheetHead('Solaranlage')}
      <div class="row2">
        <label class="field"><span>Leistung in Wp</span><input name="wp" inputmode="numeric" value="${sol.wp || ''}" placeholder="z. B. 200"></label>
        <label class="field"><span>Akku in Wh</span><input name="wh" inputmode="numeric" value="${sol.wh || ''}" placeholder="z. B. 1200"></label>
      </div>
      <label class="field"><span>Wirkungsgrad in %</span><input name="eff" inputmode="numeric" value="${sol.eff || 70}"></label>
      <p class="sub">Akku in Wh: bei Powerstations steht er drauf, bei Bordbatterien Ah × 12,8 V (z. B. 100 Ah ≈ 1280 Wh). Den Verbrauch pro Tag stellt ihr beim Strom oben ein.</p>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.solar = form => {
    save('meta', { ...autarky(), solar: { wp: num(form.wp.value), wh: num(form.wh.value), eff: Math.min(100, Math.max(10, num(form.eff.value) || 70)) } });
    closeSheet();
  };

  /* ====================================================================== */
  /* Notfall-Orte in der Nähe (OpenStreetMap über Overpass)                  */
  /* ====================================================================== */

  const sosDoc = () => S.meta.find(m => m.id === 'sosnear');
  const KINDS = [['hospital', 'Krankenhaus', 3], ['doctors', 'Arzt', 2], ['pharmacy', 'Apotheke', 3], ['veterinary', 'Tierarzt', 2]];
  let sosBusy = false, sosTried = '';
  async function loadSos(p, force) {
    if (sosBusy || !navigator.onLine) return;
    const key = `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
    if (!force && sosTried === key) return;
    sosTried = key;
    sosBusy = true;
    const q = `[out:json][timeout:25];(nwr["amenity"="hospital"](around:40000,${p.lat},${p.lng});nwr["amenity"="doctors"](around:10000,${p.lat},${p.lng});`
      + `nwr["amenity"="pharmacy"](around:15000,${p.lat},${p.lng});nwr["amenity"="veterinary"](around:25000,${p.lat},${p.lng}););out center tags;`;
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error();
      const els = (await r.json()).elements || [];
      const items = els.map(e => {
        const t = e.tags || {}, lat = e.lat ?? (e.center || {}).lat, lng = e.lon ?? (e.center || {}).lon;
        return {
          kind: t.amenity, name: t.name || t.operator || '', lat, lng, er: t.emergency === 'yes',
          phone: t.phone || t['contact:phone'] || '', hours: t.opening_hours || '',
          addr: [[t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), t['addr:city']].filter(Boolean).join(', '),
          dist: km(p, { lat, lng }),
        };
      }).filter(x => isFinite(x.lat) && x.name);
      const pick = [];
      for (const [k, , n] of KINDS) {
        const list = items.filter(x => x.kind === k).sort((a, b) => a.dist - b.dist);
        // Krankenhäuser: zuerst die mit Notaufnahme
        pick.push(...(k === 'hospital' ? [...list.filter(x => x.er).slice(0, 2), ...list.filter(x => !x.er).slice(0, 1)] : list.slice(0, n)));
      }
      save('meta', { id: 'sosnear', lat: p.lat, lng: p.lng, name: p.name, place: p.place, at: Date.now(), items: pick.map(x => ({ ...x, dist: Math.round(x.dist * 10) / 10 })) });
      if (force) toast('Notfall-Orte aktualisiert');
    } catch { if (force) toast('Overpass gerade nicht erreichbar. Später noch einmal versuchen.'); }
    sosBusy = false;
  }
  // Neuer Stellplatz (mehr als 5 km weg) oder älter als 30 Tage: im Hintergrund neu holen
  chromeHooks.push(() => {
    const p = spot();
    if (!p || !app.session || !app.session()) return;
    const d = sosDoc();
    if (!d || km(d, p) > 5 || Date.now() - d.at > 30 * 864e5) setTimeout(() => loadSos(p), 1500);
  });
  function sosPanel() {
    const d = sosDoc();
    const p = spot();
    const head = `<div class="toolbar"><h2>Hilfe in der Nähe</h2>${p ? `<button class="ghost small-btn" data-action="sos-refresh">Aktualisieren</button>` : ''}</div>`;
    if (!d) return `<section class="panel sos-near">${head}<p class="hint">${p ? (navigator.onLine ? 'Wird gesucht …' : 'Sobald ihr Internet habt, sucht die App Krankenhaus, Apotheke, Arzt und Tierarzt am Stellplatz und speichert sie für offline.') : 'Mit einem Stellplatz im Tagebuch sucht die App Krankenhaus, Apotheke, Arzt und Tierarzt in der Nähe und speichert sie für offline.'}</p></section>`;
    return `<section class="panel sos-near">${head}
      <p class="sub">Rund um ${esc(d.name || d.place || 'den Stellplatz')}, gespeichert ${ago(d.at)} – auch ohne Internet da.</p>
      ${KINDS.map(([k, label]) => { const list = d.items.filter(x => x.kind === k); return list.length ? `<h3 class="date-head">${label}</h3><ul class="ledger">${list.map(x => `<li><div class="sos-item">
        <span class="txt"><b>${esc(x.name)}</b>${x.er ? '<em class="er">Notaufnahme</em>' : ''}<small>${dec(x.dist)} km${x.addr ? ` · ${esc(x.addr)}` : ''}${x.hours ? ` · ${esc(x.hours)}` : ''}</small></span>
        <span class="sos-acts">${x.phone ? `<a class="ghost btn small-btn" href="tel:${esc(x.phone.split(/[;,]/)[0].replace(/[^\d+]/g, ''))}">Anrufen</a>` : ''}
          <a class="ghost btn small-btn" href="${navUrl(x)}" target="_blank" rel="noopener">Route</a></span></div></li>`).join('')}</ul>` : ''; }).join('')
        || '<p class="hint">Nichts gefunden. Im Notfall immer 112.</p>'}
      <p class="sub source">Daten: OpenStreetMap-Mitwirkende. Öffnungszeiten können abweichen; nachts hilft der ärztliche Notdienst des Landes.</p></section>`;
  }
  const dokumente = VIEWS.dokumente;
  VIEWS.dokumente = () => {
    const html = dokumente();
    const i = html.indexOf('</section>');
    return i < 0 ? html + sosPanel() : html.slice(0, i + 10) + sosPanel() + html.slice(i + 10);
  };
  ACTIONS['sos-refresh'] = () => { const p = spot(); if (p) loadSos(p, true); };
}
