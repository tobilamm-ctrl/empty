// Infos aus dem Internet: Spritkosten der geplanten Strecke, Reise-Check (Vignetten, Pflichtausstattung),
// Kontakt und Öffnungszeiten aus OpenStreetMap („Heute geöffnet?“), Wassertemperatur am Meer,
// Kurzinfo aus Wikipedia und ein Regentag-Plan. Alles Geladene bleibt für unterwegs ohne Netz gespeichert.

export default function installInfos(app) {
  const { S, LS, ui, VIEWS, ACTIONS, CHANGES, esc, icon, pageHead, save, newId, toast, render, currentTrip, tripEntries, byDate,
    km, fmtKm, money, hasPos, navUrl, today, fmtDay, me, num } = app;
  const dec = (v, n = 1) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n });
  const DAY = 864e5;

  /* ====================================================================== */
  /* Öffnungszeiten (OpenStreetMap-Schreibweise, die üblichen Fälle)          */
  /* ====================================================================== */

  const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const WD_DE = { Mo: 'Mo', Tu: 'Di', We: 'Mi', Th: 'Do', Fr: 'Fr', Sa: 'Sa', Su: 'So' };
  // Ergebnis für einen Tag: { open: true, times: '09:00–18:00' } | { open: false } | null (zu kompliziert)
  function hoursOn(oh, date) {
    if (!oh) return null;
    const s = oh.trim();
    if (s === '24/7') return { open: true, times: 'rund um die Uhr' };
    const wd = WD[(new Date(date + 'T12:00').getDay() + 6) % 7];
    let res = null, matched = false, seasonal = false;
    for (const rule of s.split(';').map(x => x.trim()).filter(Boolean)) {
      // Monate, Feiertage, Wochen-Nummern usw. überspringen (nicht sicher auszuwerten)
      if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|week|easter)\b/.test(rule)) { seasonal = true; continue; }
      if (/^PH\b/.test(rule)) continue;
      const m = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))*)(?:\s*,\s*PH)?\s*(.*)$/);
      let days = WD, rest = rule;
      if (m) {
        days = [];
        m[1].split(',').map(x => x.trim()).forEach(part => {
          const [a, b] = part.split('-').map(x => x.trim());
          if (!b) days.push(a); else { let i = WD.indexOf(a); const j = WD.indexOf(b); for (let k = 0; k < 7; k++) { days.push(WD[i]); if (i === j) break; i = (i + 1) % 7; } }
        });
        rest = m[2].trim();
      } else if (!/^\d/.test(rule) && !/^(off|closed)$/.test(rule)) return null;
      if (!days.includes(wd)) continue;
      matched = true;
      if (/^(off|closed)$/i.test(rest)) { res = { open: false }; continue; }
      const times = rest.match(/\d{1,2}:\d\d\s*-\s*\d{1,2}:\d\d\+?/g);
      if (!times) return null;
      res = { open: true, times: times.map(t => t.replace(/\s*-\s*/, '–').replace(/^0/, '').replace('+', ' Uhr open end')).join(', ') };
    }
    if (seasonal) return null;   // Saisonzeiten: lieber nichts behaupten
    return matched ? res : (res === null && /\d{1,2}:\d\d/.test(s) && /\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/.test(s) ? { open: false, guess: true } : null);
  }
  app.hoursOn = hoursOn;
  const ohDe = oh => oh.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, d => WD_DE[d]).replace(/\boff\b/g, 'geschlossen').replace(/\bPH\b/g, 'Feiertag');

  /* ====================================================================== */
  /* OpenStreetMap: Kontakt, Website, Öffnungszeiten, Wikipedia-Verweis      */
  /* ====================================================================== */

  const osmKey = p => `osm.${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
  const osmCached = p => { const c = LS.get(osmKey(p), null); return c && Date.now() - c.at < 30 * DAY ? c : null; };
  const loading = new Map();
  function osmNear(p, camp, name) {
    const key = osmKey(p);
    const c = osmCached(p);
    if (c) return Promise.resolve(c);
    if (loading.has(key)) return loading.get(key);
    const filt = camp ? 'nwr(around:250,LAT,LNG)[tourism~"^(camp_site|caravan_site)$"];'
      : 'nwr(around:150,LAT,LNG)[name][~"^(tourism|amenity|leisure|historic|shop)$"~"."];';
    const q = `[out:json][timeout:15];(${filt.replace(/LAT/g, p.lat).replace(/LNG/g, p.lng)});out tags center 25;`;
    const job = fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q)).then(r => (r.ok ? r.json() : Promise.reject(new Error()))).then(d => {
      const els = (d.elements || []).map(e => ({ tags: e.tags || {}, lat: e.lat ?? (e.center || {}).lat, lng: e.lon ?? (e.center || {}).lon })).filter(e => e.lat != null);
      const lower = String(name || '').toLowerCase();
      const scored = els.map(e => ({ e, d: km(p, e) * 1000 - (lower && e.tags.name && (lower.includes(e.tags.name.toLowerCase()) || e.tags.name.toLowerCase().includes(lower)) ? 500 : 0)
        - (e.tags.opening_hours || e.tags.phone || e.tags['contact:phone'] || e.tags.website || e.tags.wikipedia ? 30 : 0) })).sort((a, b) => a.d - b.d);
      const best = scored[0] ? scored[0].e.tags : {};
      const out = { at: Date.now(), name: best.name || '', phone: best.phone || best['contact:phone'] || '', website: best.website || best['contact:website'] || best.url || '',
        email: best.email || best['contact:email'] || '', hours: best.opening_hours || '', reception: best['reception'] || best['opening_hours:reception'] || best['opening_hours:office'] || '',
        wikipedia: best.wikipedia || '', wikidata: best.wikidata || '' };
      LS.set(key, out);
      return out;
    }).finally(() => loading.delete(key));
    loading.set(key, job);
    return job;
  }

  /* ---------- Wikipedia ---------- */

  const wikiKey = p => `wiki.${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
  async function wikiFor(p, title, osm) {
    const c = LS.get(wikiKey(p), null);
    if (c && Date.now() - c.at < 60 * DAY) return c;
    let page = null;
    if (osm && /^de:/.test(osm.wikipedia)) page = osm.wikipedia.slice(3);
    if (!page) {
      // Artikel in der Nähe suchen, am besten mit passendem Namen
      const r = await fetch(`https://de.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${p.lat}|${p.lng}&gsradius=1000&gslimit=8&format=json&origin=*`);
      const list = ((await r.json()).query || {}).geosearch || [];
      const lower = String(title || (osm && osm.name) || '').toLowerCase();
      const words = lower.split(/[\s,.-]+/).filter(w => w.length > 3);
      const hit = list.find(x => words.some(w => x.title.toLowerCase().includes(w))) || (list[0] && list[0].dist < 150 ? list[0] : null);
      page = hit && hit.title;
    }
    if (!page) { const out = { at: Date.now(), none: true }; LS.set(wikiKey(p), out); return out; }
    const s = await (await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.replace(/ /g, '_'))}`)).json();
    const out = { at: Date.now(), title: s.title, text: s.extract || '', img: (s.thumbnail || {}).source || '', url: ((s.content_urls || {}).desktop || {}).page || '' };
    LS.set(wikiKey(p), out);
    return out;
  }

  /* ---------- Anzeige im Eintrag und im Orts-Fenster ---------- */

  const INFO_TYPES = ['stellplatz', 'sight', 'museum', 'baden', 'kinder', 'restaurant', 'service', 'einkauf'];
  const WIKI_TYPES = ['sight', 'museum', 'poi'];
  function hoursHtml(o, date) {
    if (!o.hours) return '';
    const h = hoursOn(o.hours, date || today());
    const when = !date || date === today() ? 'Heute' : fmtDay(date).split(',')[0];
    return `<p class="oh">${h ? (h.open ? `🟢 <b>${when} geöffnet</b> ${esc(h.times)}` : `🔴 <b>${when} geschlossen${h.guess ? '?' : ''}</b>`) : '🕘'}
      <small>${esc(ohDe(o.hours))}</small></p>`;
  }
  function infoHtml(o, date, isCamp) {
    if (!o) return '';
    const rows = [
      hoursHtml(o, date),
      o.reception ? `<p>🛎️ Rezeption: ${esc(ohDe(o.reception))}</p>` : '',
      o.phone ? `<p>📞 <a href="tel:${esc(o.phone.split(';')[0].replace(/[^\d+]/g, ''))}">${esc(o.phone.split(';')[0])}</a> <a class="ghost small-btn btn" href="tel:${esc(o.phone.split(';')[0].replace(/[^\d+]/g, ''))}">Anrufen</a></p>` : '',
      o.website ? `<p>🌐 <a href="${esc(/^https?:/.test(o.website) ? o.website : 'https://' + o.website)}" target="_blank" rel="noopener">${esc(o.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 40))}</a></p>` : '',
      o.email ? `<p>✉️ <a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>` : '',
    ].filter(Boolean);
    if (!rows.length) return `<p class="sub">${isCamp ? 'OpenStreetMap kennt hier keinen Campingplatz mit Kontaktdaten.' : 'In OpenStreetMap stehen hier keine Öffnungszeiten oder Kontaktdaten.'}</p>`;
    return `${o.name ? `<p class="sub">${esc(o.name)} laut OpenStreetMap</p>` : ''}${rows.join('')}`;
  }
  function wikiHtml(w) {
    if (!w || w.none || !w.text) return '';
    return `<div class="wiki">${w.img ? `<img src="${esc(w.img)}" alt="" class="no-viewer">` : ''}<p><b>${esc(w.title)}</b> ${esc(w.text.split(/(?<=\.)\s/).slice(0, 3).join(' '))}</p>
      ${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">Weiter bei Wikipedia</a>` : ''} <small class="sub">Text: Wikipedia, CC BY-SA</small></div>`;
  }
  // Platzhalter, der nach dem Öffnen des Fensters gefüllt wird
  const box = (kind, x) => `<section class="net-info" data-net="${kind}" data-id="${x.id}"><p class="sub">Infos werden geladen …</p></section>`;
  const entryExtra = app.entryExtra;
  app.entryExtra = e => `${entryExtra ? entryExtra(e) : ''}${hasPos(e) && (INFO_TYPES.includes(e.type) || WIKI_TYPES.includes(e.type)) ? box('entry', e) : ''}`;
  async function fill(sec) {
    const kind = sec.dataset.net, id = sec.dataset.id;
    const x = kind === 'entry' ? S.entries.find(e => e.id === id) : S.places.find(p => p.id === id);
    if (!x || !hasPos(x)) { sec.remove(); return; }
    const type = kind === 'entry' ? x.type : x.kind === 'stellplatz' ? 'stellplatz' : 'poi';
    const camp = type === 'stellplatz';
    const date = kind === 'place' ? x.planDate : x.date.slice(0, 10) >= today() ? x.date.slice(0, 10) : today();
    let o = osmCached(x), w = LS.get(wikiKey(x), null);
    const show = () => { if (sec.isConnected) sec.innerHTML = `<h3>${camp ? 'Kontakt zum Platz' : 'Infos'}</h3>${infoHtml(o, date, camp)}${wikiHtml(w)}`; };
    if (o) show();
    if (!navigator.onLine) { if (!o) sec.innerHTML = '<p class="sub">Kontakt und Öffnungszeiten brauchen Internet.</p>'; return; }
    try { o = await osmNear(x, camp, x.title || x.name); show(); } catch { if (!o) sec.innerHTML = '<p class="sub">OpenStreetMap gerade nicht erreichbar.</p>'; }
    if (WIKI_TYPES.includes(type)) { try { w = await wikiFor(x, x.title || x.name, o); show(); } catch { /* ohne Wikipedia */ } }
  }
  new MutationObserver(() => {
    const body = document.getElementById('sheetBody');
    body.querySelectorAll('.net-info:not([data-done])').forEach(sec => { sec.dataset.done = '1'; fill(sec); });
    // Orts-Fenster: Kontakt und Öffnungszeiten vor den Knöpfen
    const f = body.querySelector('form[data-form=place][data-id]:not([data-id=""])');
    if (f && !f.querySelector('.net-info')) {
      const p = S.places.find(x => x.id === f.dataset.id);
      if (p && hasPos(p)) f.querySelector('.sheet-foot').insertAdjacentHTML('beforebegin', box('place', p));
      f.querySelectorAll('.net-info:not([data-done])').forEach(sec => { sec.dataset.done = '1'; fill(sec); });
    }
  }).observe(document.getElementById('sheetBody'), { childList: true, subtree: true });

  /* ---------- „Heute geöffnet?“ in Planung und Wunschliste ---------- */

  const queue = [];
  let busy = false;
  function pump() {
    if (busy || !queue.length || !navigator.onLine) return;
    busy = true;
    const p = queue.shift();
    osmNear(p, p.kind === 'stellplatz', p.name).catch(() => {}).finally(() => {
      busy = false;
      document.querySelectorAll(`[data-action=place-form][data-id="${p.id}"]`).forEach(b => badge(b, p));
      setTimeout(pump, 1200);
    });
  }
  function badge(btn, p) {
    const o = osmCached(p);
    btn.querySelectorAll('.oh-badge').forEach(x => x.remove());
    if (!o || !o.hours) return;
    const date = p.planDate && p.planDate >= today() ? p.planDate : today();
    const h = hoursOn(o.hours, date);
    if (!h) return;
    const when = date === today() ? 'heute' : fmtDay(date).split(',')[0];
    const el = document.createElement('span');
    el.className = `oh-badge ${h.open ? 'open' : 'closed'}`;
    el.textContent = h.open ? `${when} geöffnet ${h.times}` : `⚠ ${when} ${h.guess ? 'vermutlich ' : ''}geschlossen`;
    (btn.querySelector('strong') || btn).insertAdjacentElement('afterend', el);
  }
  app.afterDraw.push(view => {
    view.querySelectorAll('.plan-stop [data-action=place-form][data-id], .place-row [data-action=place-form][data-id]').forEach(b => {
      const p = S.places.find(x => x.id === b.dataset.id);
      if (!p || !hasPos(p) || p.done) return;
      if (osmCached(p)) badge(b, p);
      else if (!queue.some(q => q.id === p.id) && LS.get(osmKey(p) + '.err', 0) < Date.now() - DAY) queue.push(p);
    });
    pump();
  });

  /* ====================================================================== */
  /* Spritkosten der geplanten Strecke und Reise-Check (in der Planung)      */
  /* ====================================================================== */

  const legKm = (a, b) => { const c = LS.get(`leg.${a.lat.toFixed(3)},${a.lng.toFixed(3)}>${b.lat.toFixed(3)},${b.lng.toFixed(3)}`, null); return c ? c.km : km(a, b) * 1.3; };
  function routeKm(t) {
    const plan = S.places.filter(p => p.tripId === t.id && !p.done && hasPos(p)).sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9') || (a.createdAt || 0) - (b.createdAt || 0));
    const last = tripEntries(t).filter(hasPos).sort(byDate).pop();
    const pts = [...(last ? [last] : []), ...plan];
    let sum = 0;
    for (let i = 1; i < pts.length; i++) sum += legKm(pts[i - 1], pts[i]);
    return { km: sum, n: plan.length, from: last };
  }
  function fuelBox(t) {
    const r = routeKm(t);
    if (r.km < 1) return '';
    const vid = t.vehicleId || 'vehicle';
    const v = (app.vehicles ? app.vehicles().find(x => x.id === vid) : null) || {};
    const avg = (app.fuelAverage && app.fuelAverage(vid)) || num(v.consumption) || LS.get('fuelCons', 0) || 0;
    const price = (app.fuelPrice && app.fuelPrice(vid)) || LS.get('fuelPriceGuess', 1.8);
    const liters = avg ? r.km * avg / 100 : 0;
    const cost = liters * price;
    const spent = S.expenses.filter(x => x.tripId === t.id && x.cat !== app.SETTLE).reduce((s, x) => s + (x.amount || 0), 0);
    return `<section class="plan-block fuel-plan"><h2>⛽ Spritkosten der geplanten Strecke</h2>
      <p class="sub">${r.from ? 'Vom letzten Stopp' : 'Vom ersten geplanten Ort'} über ${r.n} geplante ${r.n === 1 ? 'Ort' : 'Orte'}: ca. <b>${fmtKm(r.km)}</b> (Straße, soweit schon berechnet)</p>
      ${avg ? `<p class="fuel-big">ca. ${dec(liters, 0)} l · <b>${money(cost)}</b></p>
        <p class="sub">${dec(avg)} l/100 km${app.fuelAverage && app.fuelAverage(vid) ? ' laut Tankbuch' : ''} · ${dec(price, 2)} €/l${app.fuelPrice && app.fuelPrice(vid) ? ' (letzte Tankstopps)' : ' (geschätzt)'}</p>
        ${t.budget ? `<p class="sub">Budget ${money(t.budget)}: bisher ausgegeben ${money(spent)}, mit Sprit ca. ${money(spent + cost)} (${Math.round((spent + cost) / t.budget * 100)} %)</p>` : ''}`
        : `<p class="hint">Für die Kosten fehlt der Verbrauch. Tragt im Fahrzeug-Steckbrief den Verbrauch ein oder tankt zweimal voll mit Kilometerstand.</p>`}
      <details class="fuel-adjust"><summary>Werte anpassen</summary><div class="row2">
        <label class="field"><span>Verbrauch l/100 km</span><input inputmode="decimal" data-action="fuel-cons" value="${avg ? dec(avg) : ''}" placeholder="z. B. 9,5"></label>
        <label class="field"><span>Preis €/l</span><input inputmode="decimal" data-action="fuel-price" value="${dec(price, 2)}"></label></div></details>
    </section>`;
  }
  CHANGES['fuel-cons'] = el => { LS.set('fuelCons', num(el.value)); render(); };
  CHANGES['fuel-price'] = el => { LS.set('fuelPriceGuess', num(el.value)); render(); };

  // Reise-Check: aus den Ländern der Reise eine Liste mit Vignetten, Plaketten und Pflichtausstattung
  function checkItems(cc) {
    const c = (app.COUNTRIES || {})[cc];
    if (!c) return [];
    const n = c.name, out = [];
    if (/vignette/i.test(c.toll)) out.push([`vign-${cc}`, `Vignette ${n}${/E-Vignette|digital/i.test(c.toll) ? ' (online als E-Vignette)' : ''}`]);
    if (/Crit'Air/i.test(c.toll)) out.push(['critair', 'Crit\'Air-Plakette (Frankreich) bestellen']);
    if (/grüne Plakette/i.test(c.toll)) out.push(['plakette-de', 'Grüne Umweltplakette']);
    if (/registrier/i.test(c.toll)) out.push([`reg-${cc}`, `${n}: Kennzeichen für Maut oder Umweltzone vorher registrieren`]);
    if (/AutoPASS/i.test(c.toll)) out.push(['autopass', 'Norwegen: Maut (AutoPASS) – Rechnung kommt per Post, ggf. vorher anmelden']);
    if (/Fähre|Fähren/i.test(c.toll)) out.push([`ferry-${cc}`, `${n}: Fähren einplanen`]);
    (c.must || '').split(/,\s*/).map(x => x.replace(/ empfohlen$/, '').trim()).filter(Boolean).forEach(m => out.push([`must-${m.toLowerCase()}`, m === 'Warnweste' ? 'Warnwesten (für alle Mitfahrenden)' : m]));
    if (/Fahrradträger|Warntafel/i.test(c.tip)) out.push([`tafel-${cc}`, `${n}: Warntafel für den Fahrradträger`]);
    return out;
  }
  const checkDoc = t => S.games.find(g => g.id === `rcheck_${t.id}`) || { id: `rcheck_${t.id}`, kind: 'rcheck', tripId: t.id, done: {}, extra: [] };
  function tripCheck(t) {
    const doc = checkDoc(t);
    const auto = app.tripCountries ? app.tripCountries(t) : [];
    const ccs = [...new Set([...auto, ...(doc.extra || [])])].filter(cc => (app.COUNTRIES || {})[cc]);
    const items = new Map();
    ccs.forEach(cc => checkItems(cc).forEach(([k, l]) => { if (!items.has(k)) items.set(k, { label: l, from: [] }); items.get(k).from.push(cc); }));
    const left = Object.keys(app.COUNTRIES || {}).filter(cc => !ccs.includes(cc));
    const n = [...items.keys()].filter(k => doc.done[k]).length;
    return `<section class="plan-block trip-check"><h2>✅ Reise-Check</h2>
      <p class="sub">Aus den Ländern der Reise: ${ccs.length ? ccs.map(cc => `${app.flag ? app.flag(cc) : ''} ${esc(app.COUNTRIES[cc].name)}${(doc.extra || []).includes(cc) ? ` <button class="link small" data-action="rc-del" data-cc="${cc}" aria-label="entfernen">×</button>` : ''}`).join(', ') : 'noch keine (Orte mit Position planen oder Land hinzufügen)'}</p>
      ${items.size ? `<ul class="rc-list">${[...items].map(([k, x]) => `<li><label class="check"><input type="checkbox" data-action="rc-tick" data-k="${esc(k)}"${doc.done[k] ? ' checked' : ''}><span>${esc(x.label)}</span></label></li>`).join('')}</ul>
        <p class="sub">${n} von ${items.size} erledigt. Angaben ohne Gewähr, vor der Reise bitte prüfen (Länderinfos).</p>` : ''}
      <div class="btnrow"><select data-action="rc-add" aria-label="Land hinzufügen"><option value="">Land hinzufügen …</option>${left.map(cc => `<option value="${cc}">${esc(app.COUNTRIES[cc].name)}</option>`).join('')}</select>
        <a class="ghost btn" href="#/laender">Länderinfos</a></div>
    </section>`;
  }
  CHANGES['rc-tick'] = el => { const t = currentTrip(), d = checkDoc(t); save('games', { ...d, done: { ...d.done, [el.dataset.k]: el.checked } }); };
  CHANGES['rc-add'] = el => { if (!el.value) return; const t = currentTrip(), d = checkDoc(t); save('games', { ...d, extra: [...new Set([...(d.extra || []), el.value])] }); setTimeout(render, 50); };
  ACTIONS['rc-del'] = el => { const t = currentTrip(), d = checkDoc(t); save('games', { ...d, extra: (d.extra || []).filter(c => c !== el.dataset.cc) }); setTimeout(render, 50); };
  app.tripCheckOpen = t => { const d = checkDoc(t); const all = new Set(); [...new Set([...(app.tripCountries ? app.tripCountries(t) : []), ...(d.extra || [])])].forEach(cc => checkItems(cc).forEach(([k]) => all.add(k))); return [...all].filter(k => !d.done[k]).length; };

  const planung = VIEWS.planung;
  VIEWS.planung = t => `${planung(t)}${t ? fuelBox(t) + tripCheck(t) : ''}`;

  /* ====================================================================== */
  /* Wassertemperatur am Meer (auf der Wetterseite)                          */
  /* ====================================================================== */

  const seaKey = p => `sea.${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
  const seaLoading = new Set();
  async function loadSea(p) {
    const key = seaKey(p), c = LS.get(key, null);
    if ((c && Date.now() - c.at < 3 * 36e5) || seaLoading.has(key) || !navigator.onLine) return;
    seaLoading.add(key);
    try {
      const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat.toFixed(3)}&longitude=${p.lng.toFixed(3)}&hourly=sea_surface_temperature&forecast_days=5&timezone=auto`);
      const d = r.ok ? await r.json() : {};
      const h = d.hourly || {};
      const days = {};
      (h.time || []).forEach((tm, i) => { const v = (h.sea_surface_temperature || [])[i]; if (v != null) { const k = tm.slice(0, 10); days[k] = Math.max(days[k] ?? -99, v); } });
      LS.set(key, { at: Date.now(), days });
    } catch { LS.set(key, { at: Date.now(), days: {} }); } finally {
      seaLoading.delete(key);
      if (ui.route === 'wetter') render();
    }
  }
  function points() {
    const t = currentTrip(), pts = [];
    const here = LS.get('wx.here', null);
    if (here) pts.push(['Hier', here]);
    if (t) {
      const last = tripEntries(t).filter(e => hasPos(e) && e.type === 'stellplatz').sort(byDate).pop();
      if (last) pts.push([last.title || last.place || 'Letzter Stellplatz', last]);
      S.places.filter(p => p.tripId === t.id && !p.done && hasPos(p)).sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9')).slice(0, 3).forEach(p => pts.push([p.name, p]));
    }
    return pts;
  }
  const wetter = VIEWS.wetter;
  VIEWS.wetter = () => {
    let html = wetter();
    const rows = points().map(([name, p]) => {
      loadSea(p);
      const c = LS.get(seaKey(p), null);
      const days = c ? Object.entries(c.days) : [];
      return days.length ? `<li><b>${esc(name)}</b><span class="sea-days">${days.map(([d, v], i) => `<span><small>${i === 0 ? 'Heute' : fmtDay(d).split(',')[0]}</small>${dec(v, 0)}°</span>`).join('')}</span></li>` : '';
    }).filter(Boolean);
    const extra = `${rows.length ? `<section class="wx-card sea"><h2>🌊 Wassertemperatur am Meer</h2><ul class="sea-list">${rows.join('')}</ul>
      <p class="sub source">Meeresdaten: Open-Meteo.com (CC BY 4.0). An Seen und Flüssen gibt es keine Werte.</p></section>` : ''}
      <div class="btnrow"><a class="ghost btn" href="#/regentag">☔ Regentag-Plan / ☀️ Sonnen-Plan</a></div>`;
    return html.replace('<p class="sub source">Wetterdaten', `${extra}<p class="sub source">Wetterdaten`);
  };

  /* ====================================================================== */
  /* Regentag-Plan                                                           */
  /* ====================================================================== */

  const RAIN_Q = ['tourism=museum', 'tourism=aquarium', 'leisure=water_park', 'amenity=cinema', 'leisure=sports_centre][sport=swimming', 'leisure=indoor_play',
    'leisure=playground][indoor=yes', 'amenity=planetarium', 'tourism=gallery', 'leisure=amusement_arcade', 'leisure=bowling_alley', 'amenity=public_bath'];
  const SUN_Q = ['natural=beach', 'leisure=bathing_place', 'leisure=swimming_area', 'tourism=viewpoint', 'tourism=zoo', 'tourism=theme_park', 'leisure=nature_reserve', 'leisure=water_park'];
  const LABEL = { museum: 'Museum', aquarium: 'Aquarium', water_park: 'Erlebnisbad', cinema: 'Kino', sports_centre: 'Hallenbad', indoor_play: 'Indoorspielplatz',
    playground: 'Indoorspielplatz', planetarium: 'Planetarium', gallery: 'Galerie', amusement_arcade: 'Spielhalle', bowling_alley: 'Bowling', public_bath: 'Bad', beach: 'Strand',
    bathing_place: 'Badestelle', swimming_area: 'Badestelle', viewpoint: 'Aussichtspunkt', zoo: 'Zoo', theme_park: 'Freizeitpark', nature_reserve: 'Naturschutzgebiet' };
  const RAIN_WORDS = /museum|schloss|burg|therme|hallenbad|aquarium|indoor|kino|ausstellung|kirche|dom|höhle|grotte|galerie|bowling/i;
  const SUN_WORDS = /strand|baden|badestelle|see|wander|aussicht|gipfel|zoo|tierpark|freizeitpark|park|klettern|bucht/i;
  function where() {
    const t = currentTrip();
    const last = t && tripEntries(t).filter(hasPos).sort(byDate).pop();
    const here = LS.get('wx.here', null);
    if (here && (!last || here.at > new Date(last.date).getTime())) return { p: here, name: 'euren Standort' };
    if (last) return { p: last, name: last.place || last.title || 'den letzten Stopp' };
    return null;
  }
  function rainy(p) {
    const c = app.wx && LS.get(app.wx.wxKey(p), null);
    const d = c && c.data && c.data.daily;
    if (!d) return null;
    const i = new Date().getHours() >= 17 ? 1 : 0;
    const code = d.weather_code[i], mm = d.precipitation_sum[i], prob = (d.precipitation_probability_max || [])[i] || 0;
    return { rain: mm >= 2 || prob >= 60 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code), day: i ? 'Morgen' : 'Heute', text: `${app.wx.wx(code)[1]}, ${dec(mm)} mm` };
  }
  async function loadNearby(p, mode) {
    const key = `rp.${mode}.${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
    const c = LS.get(key, null);
    if (c && Date.now() - c.at < 3 * DAY) return c.list;
    const qs = (mode === 'rain' ? RAIN_Q : SUN_Q).map(f => `nwr(around:25000,${p.lat},${p.lng})[${f}][name];`).join('');
    const r = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(`[out:json][timeout:25];(${qs});out tags center 80;`));
    if (!r.ok) throw new Error();
    const d = await r.json();
    const list = (d.elements || []).map(e => {
      const t = e.tags || {}, lat = e.lat ?? (e.center || {}).lat, lng = e.lon ?? (e.center || {}).lon;
      const cat = t.tourism || t.leisure || t.amenity || t.natural;
      return lat == null ? null : { name: t.name, cat: LABEL[cat] || cat, lat, lng, hours: t.opening_hours || '', web: t.website || '', d: km(p, { lat, lng }) };
    }).filter(Boolean).sort((a, b) => a.d - b.d).slice(0, 30);
    LS.set(key, { at: Date.now(), list });
    return list;
  }
  let nearby = null;
  VIEWS.regentag = () => {
    const w = where();
    if (!w) return `${pageHead('wetter', 'Regentag-Plan')}<p class="hint">Dafür braucht es einen Standort: „Wetter hier“ auf der Wetterseite tippen oder einen Eintrag mit Position machen.</p>`;
    if (app.wx) app.wx.loadWeather(w.p);
    const r = rainy(w.p);
    const mode = ui.rpMode || (r && !r.rain ? 'sun' : 'rain');
    const words = mode === 'rain' ? RAIN_WORDS : SUN_WORDS;
    const own = S.places.filter(p => hasPos(p) && !p.done && km(w.p, p) <= 40 && words.test(`${p.name} ${p.note || ''}`)).sort((a, b) => km(w.p, a) - km(w.p, b));
    const key = `${mode}.${w.p.lat.toFixed(2)},${w.p.lng.toFixed(2)}`;
    if (!nearby || nearby.key !== key) {
      nearby = { key, list: null, err: '' };
      if (navigator.onLine) loadNearby(w.p, mode).then(l => { nearby.list = l; if (ui.route === 'regentag') render(); }).catch(() => { nearby.err = 'OpenStreetMap gerade nicht erreichbar.'; if (ui.route === 'regentag') render(); });
      else nearby.err = 'Vorschläge aus der Umgebung brauchen Internet.';
      const c = LS.get(`rp.${key}`, null);
      if (c) nearby.list = c.list;
    }
    const oh = x => { const h = x.hours ? hoursOn(x.hours, today()) : null; return h ? (h.open ? ` · <span class="ok">heute ${esc(h.times)}</span>` : ' · <span class="warn">heute geschlossen</span>') : ''; };
    return `${pageHead('wetter', mode === 'rain' ? 'Regentag-Plan' : 'Sonnen-Plan', `Rund um ${esc(w.name)}`)}
      ${r ? `<p class="rp-wx">${r.rain ? '☔' : '☀️'} ${r.day}: ${esc(r.text)}</p>` : ''}
      <div class="seg"><button class="${mode === 'rain' ? 'on' : ''}" data-action="rp-mode" data-m="rain">☔ Bei Regen</button><button class="${mode === 'sun' ? 'on' : ''}" data-action="rp-mode" data-m="sun">☀️ Bei Sonne</button></div>
      ${own.length ? `<h2 class="date-head">Von eurer Wunschliste</h2><ul class="ledger">${own.map(p => `<li><button data-action="place-form" data-id="${p.id}"><span class="txt"><b>${esc(p.name)}</b><small>${fmtKm(km(w.p, p))}${p.tripId ? ' · geplant' : ''}</small></span></button></li>`).join('')}</ul>` : ''}
      <h2 class="date-head">In der Umgebung (25 km)</h2>
      ${nearby.list ? (nearby.list.length ? `<ul class="ledger rp-list">${nearby.list.map((x, i) => `<li><span class="txt"><b>${esc(x.name)}</b><small>${esc(x.cat || '')} · ${fmtKm(x.d)}${oh(x)}</small></span>
          <a class="icon-btn small" href="${navUrl(x)}" target="_blank" rel="noopener" aria-label="Hinfahren">${icon('route')}</a>
          <button class="ghost small-btn" data-action="rp-keep" data-i="${i}">Merken</button></li>`).join('')}</ul>` : '<p class="hint">Nichts Passendes gefunden.</p>')
        : `<p class="sub">${nearby.err || 'Wird gesucht …'}</p>`}
      <p class="sub source">Orte: © OpenStreetMap-Mitwirkende</p>`;
  };
  ACTIONS['rp-mode'] = el => { ui.rpMode = el.dataset.m; render(); };
  ACTIONS['rp-keep'] = el => {
    const x = nearby && nearby.list && nearby.list[+el.dataset.i];
    if (!x) return;
    const t = currentTrip();
    if (S.places.some(p => p.name === x.name && hasPos(p) && km(p, x) < 0.3)) { toast(`„${x.name}“ ist schon gemerkt`); return; }
    save('places', { id: newId(), createdAt: Date.now(), by: me(), kind: 'poi', name: x.name, place: '', note: [x.cat, x.hours ? 'Öffnungszeiten: ' + ohDe(x.hours) : ''].filter(Boolean).join(' · '),
      url: x.web || '', lat: x.lat, lng: x.lng, country: '', tripId: t ? t.id : null, planDate: '', rating: 0, features: [], fav: false, done: false });
    toast(t ? `„${x.name}“ für „${t.name}“ vorgemerkt` : `„${x.name}“ auf der Wunschliste`);
  };

}
