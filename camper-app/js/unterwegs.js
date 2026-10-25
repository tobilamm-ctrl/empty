// Unterwegs: „Was ist in der Nähe?“ (OpenStreetMap), Währungsrechner, Sonnenauf- und -untergang,
// „Wie lange noch?“ für die Kinder, die Heute-Karte im Tagebuch und Wetter, Kilometer und Länder im Tageskopf.

export default function installUnterwegs(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, esc, icon, pageHead, newId, save, toast, render, go, openSheet, closeSheet,
    today, fmtDay, fmtShort, ago, km, fmtKm, hasPos, navUrl, byDate, getPos, currentTrip, tripColor, me,
  } = app;
  const sheetHead = app.sheetHead;
  const hhmm = d => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const dur = min => {
    min = Math.max(1, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} Std.${m ? ` ${m} Min.` : ''}` : `${m} Min.`;
  };

  /* ====================================================================== */
  /* Sonnenauf- und -untergang (Rechnung nach SunCalc, ohne Internet)       */
  /* ====================================================================== */

  function sunTimes(day, lat, lng) {
    const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, e = rad * 23.4397;
    const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
    const d = new Date(day + 'T12:00:00Z') / dayMs - 0.5 + J1970 - J2000;
    const lw = rad * -lng, phi = rad * lat;
    const n = Math.round(d - J0 - lw / (2 * Math.PI));
    const ds = J0 + lw / (2 * Math.PI) + n;
    const M = rad * (357.5291 + 0.98560028 * ds);
    const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    const dec = Math.asin(Math.sin(L) * Math.sin(e));
    const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const cosw = (Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (cosw < -1) return { polar: 'day' };
    if (cosw > 1) return { polar: 'night' };
    const set = J2000 + J0 + (Math.acos(cosw) + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJulian(noon - (set - noon)), set: fromJulian(set) };
  }
  const sunLine = (day, p) => {
    const s = sunTimes(day, p.lat, p.lng);
    if (s.polar) return s.polar === 'day' ? 'Mitternachtssonne' : 'Polarnacht';
    return `${icon('sun')}${hhmm(s.rise)} ${icon('sunset')}${hhmm(s.set)}`;
  };
  app.sunTimes = sunTimes;

  /* ====================================================================== */
  /* Was ist in der Nähe? (Overpass-Abfrage auf OpenStreetMap-Daten)        */
  /* ====================================================================== */

  const NEAR = {
    wasser: { label: 'Trinkwasser', q: ['nwr[amenity=drinking_water]', 'nwr[amenity=water_point]'], icon: 'service', kind: 'poi' },
    entsorgung: { label: 'Entsorgung', q: ['nwr[amenity=sanitary_dump_station]'], icon: 'service', kind: 'poi' },
    wc: { label: 'WC & Dusche', q: ['nwr[amenity=toilets][access!=private][access!=customers]', 'nwr[amenity=shower]'], icon: 'pause', kind: 'poi' },
    einkauf: { label: 'Supermarkt', q: ['nwr[shop=supermarket]'], icon: 'einkauf', kind: 'poi' },
    tanken: { label: 'Tankstelle', q: ['nwr[amenity=fuel]'], icon: 'tank', kind: 'poi' },
    spielplatz: { label: 'Spielplatz', q: ['nwr[leisure=playground]'], icon: 'kinder', kind: 'poi' },
    baden: { label: 'Baden', q: ['nwr[leisure=bathing_place]', 'nwr[natural=beach]', 'nwr[leisure=swimming_area]'], icon: 'baden', kind: 'poi' },
    stellplatz: { label: 'Stellplatz', q: ['nwr[tourism=caravan_site]'], icon: 'stellplatz', kind: 'stellplatz' },
    camping: { label: 'Campingplatz', q: ['nwr[tourism=camp_site]'], icon: 'stellplatz', kind: 'stellplatz' },
    baecker: { label: 'Bäcker', q: ['nwr[shop=bakery]'], icon: 'einkauf', kind: 'poi' },
    waschsalon: { label: 'Waschsalon', q: ['nwr[shop=laundry]', 'nwr[amenity=washing_machine]'], icon: 'waesche', kind: 'poi' },
    werkstatt: { label: 'Werkstatt', q: ['nwr[shop=car_repair]', 'nwr[shop=tyres]'], icon: 'werkstatt', kind: 'poi' },
    apotheke: { label: 'Apotheke', q: ['nwr[amenity=pharmacy]'], icon: 'cross', kind: 'poi', sos: true },
    arzt: { label: 'Arzt', q: ['nwr[amenity=doctors]', 'nwr[amenity=clinic]'], icon: 'cross', kind: 'poi', sos: true },
    krankenhaus: { label: 'Krankenhaus', q: ['nwr[amenity=hospital][emergency!=no]'], icon: 'cross', kind: 'poi', sos: true },
  };
  let nearLayer = null;
  let nearResults = [];

  ACTIONS.near = () => {
    const cat = LS.get('near.cat', 'wasser'), r = LS.get('near.r', 5);
    openSheet(`<form data-form="near">${sheetHead('Was ist in der Nähe?')}
      <div class="field"><span>Was sucht ihr?</span><div class="chips wrap">${Object.entries(NEAR).filter(([, c]) => !c.sos).map(([k, c]) =>
        `<label class="chip"><input type="radio" name="cat" value="${k}"${k === cat ? ' checked' : ''} hidden>${icon(c.icon)}${c.label}</label>`).join('')}</div></div>
      <div class="field"><span>Gesundheit</span><div class="chips wrap">${Object.entries(NEAR).filter(([, c]) => c.sos).map(([k, c]) =>
        `<label class="chip sos-chip"><input type="radio" name="cat" value="${k}"${k === cat ? ' checked' : ''} hidden>${icon(c.icon)}${c.label}</label>`).join('')}</div>
        <p class="sub">Im Notfall immer zuerst 112 anrufen.</p></div>
      <div class="field"><span>Umkreis</span><div class="seg">${[2, 5, 15].map(v =>
        `<label><input type="radio" name="r" value="${v}"${v === r ? ' checked' : ''}><span>${v} km</span></label>`).join('')}</div></div>
      <div class="field"><span>Ausgehend von</span><div class="seg">
        <label><input type="radio" name="from" value="gps" checked><span>Meinem Standort</span></label>
        <label><input type="radio" name="from" value="map"><span>Kartenmitte</span></label></div></div>
      ${nearResults.length ? '<button type="button" class="link" data-action="near-clear">Treffer von der Karte nehmen</button>' : ''}
      <p class="sub">Daten von OpenStreetMap, gepflegt von Freiwilligen. Nicht alles ist eingetragen, Öffnungszeiten können fehlen.</p>
      <div class="sheet-foot"><button class="primary">${icon('search')}Suchen</button></div></form>`);
  };
  ACTIONS['near-clear'] = () => { nearResults = []; if (nearLayer) nearLayer.clearLayers(); closeSheet(); };

  FORMS.near = async form => {
    const cat = form.cat.value, r = +form.r.value;
    LS.set('near.cat', cat); LS.set('near.r', r);
    const btn = form.querySelector('button.primary');
    btn.disabled = true; btn.textContent = 'Sucht …';
    try {
      let c;
      if (form.from.value === 'map' && app.map) { const m = app.map.getCenter(); c = { lat: m.lat, lng: m.lng }; } else c = await getPos();
      const around = `(around:${r * 1000},${c.lat.toFixed(5)},${c.lng.toFixed(5)})`;
      const query = `[out:json][timeout:25];(${NEAR[cat].q.map(x => x + around + ';').join('')});out center 80;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!res.ok) throw new Error('Der Kartendienst ist gerade überlastet. Bitte gleich noch einmal versuchen.');
      const data = await res.json();
      nearResults = (data.elements || []).map(el => {
        const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon, tg = el.tags || {};
        if (lat == null) return null;
        return {
          cat, lat, lng, d: km(c, { lat, lng }),
          name: tg.name || tg.brand || tg.operator || NEAR[cat].label,
          info: [tg.opening_hours ? `Geöffnet: ${tg.opening_hours}` : '', tg.fee === 'yes' ? 'kostenpflichtig' : tg.fee === 'no' ? 'kostenlos' : '',
            tg.amenity === 'shower' ? 'Dusche' : '', tg.website || tg['contact:website'] || ''].filter(Boolean),
        };
      }).filter(Boolean).sort((a, b) => a.d - b.d);
      showNear(c);
      if (!nearResults.length) toast(`Keine Treffer für „${NEAR[cat].label}“ im Umkreis von ${r} km.`);
    } catch (e) {
      toast(e instanceof TypeError ? 'Die Suche hat nicht geklappt. Das braucht Internet.' : e.message);
      btn.disabled = false; btn.innerHTML = `${icon('search')}Suchen`;
    }
  };

  function showNear(c) {
    if (ui.route !== 'karte') go('karte');
    setTimeout(() => {
      const map = app.map;
      if (!map) return;
      nearLayer ||= L.layerGroup().addTo(map);
      nearLayer.clearLayers();
      nearResults.forEach((n, i) => {
        L.marker([n.lat, n.lng], { icon: app.pinIcon(NEAR[n.cat].icon, '#B3261E'), zIndexOffset: 800 })
          .bindPopup(nearPopup(n, i)).addTo(nearLayer);
      });
      if (nearResults.length) map.fitBounds([[c.lat, c.lng], ...nearResults.slice(0, 15).map(n => [n.lat, n.lng])], { padding: [40, 40], maxZoom: 15 });
      openSheet(`<div>${sheetHead(`${NEAR[nearResults[0]?.cat || LS.get('near.cat', 'wasser')].label} in der Nähe`)}
        ${nearResults.length ? `<ul class="near-list">${nearResults.slice(0, 40).map((n, i) => `<li>
          <button class="as-text body" data-action="near-show" data-i="${i}"><strong>${esc(n.name)}</strong><small>${fmtKm(n.d)} Luftlinie${n.info.length ? ', ' + esc(n.info[0]) : ''}</small></button>
          <a class="ghost small-btn btn" href="${navUrl(n)}" target="_blank" rel="noopener">Hin</a></li>`).join('')}</ul>` : '<p class="hint">Nichts gefunden. Vielleicht mit größerem Umkreis?</p>'}
        <div class="sheet-foot"><button class="ghost" data-action="near">Neue Suche</button><button class="primary" data-action="close">Auf der Karte ansehen</button></div></div>`);
    }, 60);
  }
  function nearPopup(n, i) {
    return `<div class="near-pop"><b>${esc(n.name)}</b><br><small>${NEAR[n.cat].label}, ${fmtKm(n.d)} Luftlinie</small>
      ${n.info.map(x => `<br><small>${/^https?:/.test(x) ? `<a href="${esc(x)}" target="_blank" rel="noopener">Webseite</a>` : esc(x)}</small>`).join('')}
      <div class="btnrow"><a class="ghost small-btn btn" href="${navUrl(n)}" target="_blank" rel="noopener">Hinfahren</a>
      <button class="ghost small-btn" data-action="near-keep" data-i="${i}">Merken</button></div></div>`;
  }
  ACTIONS['near-show'] = el => {
    const n = nearResults[+el.dataset.i];
    closeSheet();
    if (app.map && n) { app.map.setView([n.lat, n.lng], 16); L.popup().setLatLng([n.lat, n.lng]).setContent(nearPopup(n, +el.dataset.i)).openOn(app.map); }
  };
  ACTIONS['near-keep'] = el => {
    const n = nearResults[+el.dataset.i];
    if (!n) return;
    save('places', { id: newId(), createdAt: Date.now(), by: me(), kind: NEAR[n.cat].kind, name: n.name, place: '', lat: n.lat, lng: n.lng,
      country: '', tripId: null, fav: false, rating: 0, note: n.info.join(', ') });
    toast(`„${n.name}“ in die Wunschliste übernommen`);
  };

  /* ====================================================================== */
  /* Währungsrechner (Kurse der EZB über frankfurter.app)                   */
  /* ====================================================================== */

  const CUR = {
    CHF: ['Schweizer Franken', 'CH', 0.94], CZK: ['Tschechische Kronen', 'CZ', 25], PLN: ['Polnische Złoty', 'PL', 4.3],
    HUF: ['Ungarische Forint', 'HU', 400], DKK: ['Dänische Kronen', 'DK', 7.46], SEK: ['Schwedische Kronen', 'SE', 11.3],
    NOK: ['Norwegische Kronen', 'NO', 11.7], GBP: ['Britische Pfund', 'GB', 0.85],
  };
  const fx = () => LS.get('fx', null);
  let fxLoading = false;
  async function loadFx() {
    const c = fx();
    if (fxLoading || (c && Date.now() - c.at < 12 * 36e5)) return;
    fxLoading = true;
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${Object.keys(CUR).join(',')}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      LS.set('fx', { at: Date.now(), date: d.date, rates: d.rates });
      if (document.querySelector('[data-form=fx]')) fxSheet();
    } catch { /* ohne Netz gelten die gespeicherten oder die Richtwerte */ } finally { fxLoading = false; }
  }
  const rate = code => (fx() && fx().rates[code]) || CUR[code][2];
  // Für das Urlaubsgeld der Kinder (familienrat.js)
  app.CUR = CUR; app.fxRate = rate; app.loadFx = loadFx;

  function fxSheet(pre) {
    const t = currentTrip();
    const here = t ? (app.tripCountries ? app.tripCountries(t) : []) : [];
    const guess = Object.keys(CUR).find(k => here.includes(CUR[k][1]));
    const code = pre || LS.get('fx.cur', guess || 'CHF');
    const c = fx();
    openSheet(`<form data-form="fx">${sheetHead('Währung umrechnen')}
      <label class="field"><span>Währung</span><select name="cur" data-action-input="fx">${Object.entries(CUR).map(([k, v]) =>
        `<option value="${k}"${k === code ? ' selected' : ''}>${app.flagText ? app.flagText(v[1]) : ''} ${v[0]} (${k})</option>`).join('')}</select></label>
      <div class="row2">
        <label class="field"><span>Betrag in ${code}</span><input name="amt" inputmode="decimal" data-action-input="fx" placeholder="0" value="${esc(LS.get('fx.amt', ''))}"></label>
        <label class="field"><span>Das sind in €</span><output name="eur" class="fx-out">–</output></label>
      </div>
      <p class="sub">1 € = ${rate(code).toLocaleString('de-DE', { maximumFractionDigits: 4 })} ${code}. ${c ? `Kurs der EZB vom ${fmtShort(c.date)}.` : 'Grober Richtwert, ohne Internet kein aktueller Kurs.'}</p>
      <ul class="fx-table">${[5, 10, 20, 50, 100].map(eur => `<li><span>${eur} €</span><b>${(eur * rate(code)).toLocaleString('de-DE', { maximumFractionDigits: code === 'HUF' || code === 'CZK' ? 0 : 2 })} ${code}</b></li>`).join('')}</ul>
      <p class="sub">Kroatien, Slowenien, Slowakei und die Euroländer zahlen in Euro.</p></form>`, root => calcFx(root));
    loadFx();
  }
  function calcFx(form) {
    if (!form || !form.amt) return;
    const v = parseFloat(String(form.amt.value).replace(/\./g, '').replace(',', '.'));
    form.eur.value = isFinite(v) ? (v / rate(form.cur.value)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–';
  }
  document.addEventListener('input', ev => {
    if (ev.target.dataset.actionInput !== 'fx') return;
    const form = ev.target.form;
    if (ev.target.name === 'cur') { LS.set('fx.cur', form.cur.value); return fxSheet(form.cur.value); }
    LS.set('fx.amt', form.amt.value);
    calcFx(form);
  });
  FORMS.fx = () => {};
  ACTIONS.fx = () => fxSheet();

  // Knopf in Länderinfos und Kasse
  const withFx = base => () => base().replace('</header>', `</header><div class="btnrow fx-row"><button class="ghost small-btn" data-action="fx">${icon('coin')}Währung umrechnen</button></div>`);
  if (VIEWS.laender) VIEWS.laender = withFx(VIEWS.laender);
  if (VIEWS.kasse) VIEWS.kasse = withFx(VIEWS.kasse);

  /* ====================================================================== */
  /* Wie lange noch? Große Anzeige für die Rückbank                          */
  /* ====================================================================== */

  const eta = () => LS.get('eta', null);
  let etaTimer = null;
  const etaTargets = () => {
    const t = currentTrip();
    return t ? S.places.filter(p => p.tripId === t.id && !p.done && hasPos(p))
      .sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9')) : [];
  };

  async function updateEta() {
    const e = eta();
    if (!e || !e.target) return;
    try {
      const p = await getPos();
      let dist, min;
      try {
        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${e.target.lng},${e.target.lat}?overview=false`);
        const d = await r.json();
        if (!d.routes || !d.routes[0]) throw new Error();
        dist = d.routes[0].distance / 1000;
        min = d.routes[0].duration / 60 * 1.12;    // mit dem Camper etwas gemütlicher als ein Pkw
      } catch {
        dist = km(p, e.target) * 1.3;               // ohne Netz: Luftlinie mit Umwegzuschlag
        min = dist / 70 * 60;
        e.rough = true;
      }
      LS.set('eta', { ...e, dist, min, at: Date.now(), start: e.start || dist, rough: !!e.rough });
    } catch (err) {
      LS.set('eta', { ...e, err: err.message });
    }
    if (ui.route === 'nochweit') render();
  }

  VIEWS.nochweit = () => {
    const e = eta();
    clearInterval(etaTimer);
    etaTimer = setInterval(() => { if (ui.route === 'nochweit') updateEta(); else clearInterval(etaTimer); }, 120000);
    if (!e || !e.target) return `${pageHead('spiele', 'Wie lange noch?', 'Für alle auf der Rückbank')}${etaPicker()}`;
    if (!e.at) updateEta();
    const p = e.start && e.dist != null ? Math.min(1, Math.max(0, 1 - e.dist / e.start)) : 0;
    const van = (document.querySelector('.vklasse') || {}).outerHTML || '';
    const arrive = e.min != null ? new Date(Date.now() + e.min * 60000 - (Date.now() - e.at)) : null;
    const episodes = e.min != null ? Math.max(0, Math.round(e.min / 25)) : 0;
    return `${pageHead('spiele', 'Wie lange noch?', `Bis ${esc(e.target.name)}`)}
      <section class="eta" style="--p:${p}">
        ${e.min == null ? `<p class="eta-big">${e.err ? esc(e.err) : 'Wird berechnet …'}</p>` : `
          ${e.dist < 0.5 ? '<p class="eta-big">Gleich da!</p>' : `<p class="eta-pre">Noch</p><p class="eta-big">${dur(e.min)}</p>`}
          <p class="eta-sub">${e.rough ? 'ungefähr ' : ''}${fmtKm(e.dist)}${arrive ? `, Ankunft gegen ${hhmm(arrive)} Uhr` : ''}</p>`}
        <div class="eta-road"><div class="eta-van">${van}</div><span class="eta-flag">${icon('flag')}</span></div>
        ${episodes > 1 ? `<p class="eta-fun">Das sind ungefähr ${episodes} Folgen Kinderserie oder ${Math.round(e.min / 3)} Lieder.</p>` : ''}
        <p class="sub">${e.at ? `Stand ${ago(e.at)}. ` : ''}Aktualisiert sich alle 2 Minuten.</p>
      </section>
      <div class="btnrow"><button class="primary" data-action="eta-refresh">Jetzt aktualisieren</button>
        <button class="ghost" data-action="eta-change">Anderes Ziel</button></div>`;
  };
  function etaPicker() {
    const list = etaTargets();
    return `<p>Wohin fahrt ihr gerade?</p>
      ${list.length ? `<ul class="ledger">${list.map(p => `<li><button data-action="eta-set" data-id="${p.id}"><span class="txt"><b>${esc(p.name)}</b>
        <small>${p.planDate ? fmtDay(p.planDate) : 'Geplant'}${p.place ? `, ${esc(p.place)}` : ''}</small></span></button></li>`).join('')}</ul>` : ''}
      <form data-form="eta-search" class="eta-search"><label class="field"><span>Oder Ort suchen</span><input name="q" placeholder="z. B. Lindau, Campingplatz Seeblick" required></label>
        <button class="primary">Suchen</button></form>`;
  }
  ACTIONS['eta-set'] = el => {
    const p = S.places.find(x => x.id === el.dataset.id);
    if (!p) return;
    LS.set('eta', { target: { name: p.name, lat: p.lat, lng: p.lng } });
    render(); updateEta();
  };
  ACTIONS['eta-change'] = () => { LS.set('eta', null); render(); };
  ACTIONS['eta-refresh'] = () => updateEta();
  FORMS['eta-search'] = async form => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=de&q=${encodeURIComponent(form.q.value)}`);
      const [hit] = await r.json();
      if (!hit) return toast('Diesen Ort haben wir nicht gefunden.');
      LS.set('eta', { target: { name: hit.name || form.q.value, lat: +hit.lat, lng: +hit.lon } });
      render(); updateEta();
    } catch { toast('Die Suche braucht Internet.'); }
  };

  /* ====================================================================== */
  /* Heute-Karte oben im Tagebuch                                            */
  /* ====================================================================== */

  app.todayCard = (t, st) => {
    const d = today();
    if (t.ended || !t.start || t.start > d || (t.end && t.end < d)) return '';
    const day = Math.round((new Date(d + 'T12:00') - new Date(t.start + 'T12:00')) / 864e5) + 1;
    const lastPos = st.stops.slice().pop();
    const here = LS.get('wx.here', null);
    const p = lastPos || here;
    let wxHtml = '';
    if (p && app.wx) {
      const c = LS.get(app.wx.wxKey(p), null);
      app.wx.loadWeather(p);
      if (c && c.data.current) wxHtml = `<a class="today-wx" href="#/wetter">${app.wx.wxIcon(c.data.current.weather_code)}<b>${Math.round(c.data.current.temperature_2m)}°</b><small>${app.wx.wx(c.data.current.weather_code)[1]}</small></a>`;
    }
    const car = S.meta.find(m => m.id === 'car');
    const next = etaTargets()[0];
    return `<section class="today" style="--c:${tripColor(t)}">
      <header><span class="today-k">Heute · Tag ${day}</span><span>${fmtDay(d)}</span></header>
      <div class="today-grid">
        ${wxHtml}
        ${p ? `<div class="today-sun">${sunLine(d, p)}</div>` : ''}
        ${hasPos(car) ? `<button class="as-text today-car" data-action="car-sheet">${icon('car')}<span>Auto geparkt ${ago(car.time)}</span></button>` : ''}
      </div>
      ${next ? `<div class="today-next"><span>Nächstes Ziel: <b>${esc(next.name)}</b>${next.planDate ? `, ${fmtDay(next.planDate)}` : ''}</span>
        <button class="ghost small-btn" data-action="eta-go" data-id="${next.id}">${icon('clock')}Wie lange noch?</button></div>` : ''}
      <div class="today-links"><button class="link" data-action="near-go">${icon('near')}Was ist in der Nähe?</button></div>
    </section>`;
  };
  ACTIONS['eta-go'] = el => { const p = S.places.find(x => x.id === el.dataset.id); if (p) LS.set('eta', { target: { name: p.name, lat: p.lat, lng: p.lng } }); go('nochweit'); };
  ACTIONS['near-go'] = () => { go('karte'); setTimeout(() => ACTIONS.near(), 120); };

  /* ====================================================================== */
  /* Tageskopf: Wetter des Tages, gefahrene Kilometer (Luftlinie), Länder    */
  /* ====================================================================== */

  const dwKey = (p, day) => `wxd.${p.lat.toFixed(1)},${p.lng.toFixed(1)}.${day}`;
  const dwQueue = [];
  let dwBusy = false;
  async function dwRun() {
    if (dwBusy) return;
    dwBusy = true;
    let changed = false;
    while (dwQueue.length) {
      const { p, day, key } = dwQueue.shift();
      if (LS.get(key, null)) continue;
      const old = (new Date(today() + 'T12:00') - new Date(day + 'T12:00')) / 864e5 > 80;
      const base = old ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
      try {
        const r = await fetch(`${base}?latitude=${p.lat.toFixed(2)}&longitude=${p.lng.toFixed(2)}&daily=weather_code,temperature_2m_max&timezone=auto&start_date=${day}&end_date=${day}`);
        if (!r.ok) throw new Error();
        const d = (await r.json()).daily || {};
        if (d.weather_code && d.weather_code[0] != null) {
          // Vergangene Tage ändern sich nicht mehr, heute gilt nur kurz
          LS.set(key, { code: d.weather_code[0], max: d.temperature_2m_max[0], at: Date.now(), final: day < today() });
          changed = true;
        }
      } catch { LS.set(key + '.err', Date.now()); break; }
    }
    dwBusy = false;
    if (changed && ui.route === 'tagebuch') render();
  }

  app.dayExtras = (day, t) => {
    const st = app.tripStats(t);
    const es = st.stops.filter(e => e.date.slice(0, 10) === day);
    const bits = [];
    const p = es[es.length - 1];
    if (p && app.wx && day <= today()) {
      const key = dwKey(p, day);
      const w = LS.get(key, null);
      if (w && (w.final || Date.now() - w.at < 3 * 36e5)) bits.push(`<span class="dx-wx" title="${app.wx.wx(w.code)[1]}">${app.wx.wxIcon(w.code)}${Math.round(w.max)}°</span>`);
      else if (Date.now() - LS.get(key + '.err', 0) > 30 * 60000 && !dwQueue.some(q => q.key === key)) { dwQueue.push({ p, day, key }); setTimeout(dwRun, 50); }
    }
    // Strecke: vom letzten Ort des Vortags über alle Orte dieses Tages
    const i0 = st.stops.findIndex(e => e.date.slice(0, 10) === day);
    if (i0 >= 0) {
      let d = 0;
      for (let i = Math.max(1, i0); i < st.stops.length && st.stops[i].date.slice(0, 10) === day; i++) d += km(st.stops[i - 1], st.stops[i]);
      if (d >= 1) bits.push(`<span class="dx-km">${fmtKm(d)}</span>`);
    }
    const cc = [...new Set(S.entries.filter(e => e.tripId === t.id && e.date.slice(0, 10) === day && e.country).map(e => e.country))];
    if (cc.length && app.flag) bits.push(`<span class="dx-cc">${cc.map(app.flag).join(' ')}</span>`);
    return bits.length ? `<span class="day-extra">${bits.join('')}</span>` : '';
  };

  /* ====================================================================== */
  /* Planung: Kilometer und Fahrzeit zwischen den geplanten Orten            */
  /* ====================================================================== */

  const LONG_LEG = 4 * 60;                // ab 4 Stunden Fahrt gibt es einen Hinweis
  const legKey = (a, b) => `leg.${a.lat.toFixed(3)},${a.lng.toFixed(3)}>${b.lat.toFixed(3)},${b.lng.toFixed(3)}`;
  const legQueue = [];
  let legBusy = false;
  async function legRun() {
    if (legBusy) return;
    legBusy = true;
    let changed = false;
    while (legQueue.length) {
      const { a, b, key } = legQueue.shift();
      try {
        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`);
        const d = await r.json();
        if (!d.routes || !d.routes[0]) throw new Error();
        LS.set(key, { km: d.routes[0].distance / 1000, min: d.routes[0].duration / 60 * 1.12 });
        changed = true;
      } catch { LS.set(key + '.err', Date.now()); }
    }
    legBusy = false;
    if (changed && ui.route === 'tagebuch') render();
  }
  app.legHtml = (a, b) => {
    if (!hasPos(a) || !hasPos(b)) return '';
    const key = legKey(a, b);
    const c = LS.get(key, null);
    if (!c && Date.now() - LS.get(key + '.err', 0) > 10 * 60000 && !legQueue.some(q => q.key === key)) { legQueue.push({ a, b, key }); setTimeout(legRun, 50); }
    const k = c ? c.km : km(a, b) * 1.3, m = c ? c.min : k / 70 * 60;
    const long = m > LONG_LEG;
    return `<li class="plan-leg${long ? ' long' : ''}"><span>${icon('car')}${c ? '' : 'ca. '}${fmtKm(k)} · ${c ? '' : 'ca. '}${dur(m)}</span>
      ${long ? `<small>Lange Etappe. Pausen einplanen oder einen Zwischenstopp suchen.</small>` : ''}</li>`;
  };

  /* ====================================================================== */
  /* Spracheingabe für Texte (Spracherkennung des Handys)                    */
  /* ====================================================================== */

  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  app.voiceBtn = name => Speech ? `<button type="button" class="icon-btn small mic" data-action="voice" data-name="${name}" aria-label="Diktieren">${icon('mic')}</button>` : '';
  ACTIONS.voice = el => {
    if (rec) { rec.stop(); return; }
    const field = el.closest('form')?.querySelector(`[name="${el.dataset.name}"]`);
    if (!field) return;
    rec = new Speech();
    rec.lang = 'de-DE';
    rec.interimResults = true;
    rec.continuous = true;
    const before = field.value ? field.value.replace(/\s*$/, ' ') : '';
    let done = '';
    el.classList.add('on');
    rec.onresult = ev => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) done += t; else interim += t;
      }
      const text = (done + interim).trim();
      field.value = before + (text ? text[0].toUpperCase() + text.slice(1) : '');
    };
    rec.onerror = ev => { if (ev.error === 'not-allowed') toast('Das Mikrofon ist für LAMMping nicht freigegeben.'); };
    rec.onend = () => { el.classList.remove('on'); rec = null; };
    rec.start();
    toast('Sprich jetzt. Zum Beenden noch einmal auf das Mikrofon tippen.');
  };

  /* ====================================================================== */
  /* Neues Land: beim ersten Eintrag dort die wichtigsten Länderinfos zeigen */
  /* ====================================================================== */

  const saveEntry = FORMS.entry;
  FORMS.entry = form => {
    const e = saveEntry(form);
    if (e && e.country) setTimeout(() => welcome(e), 400);
    return e;
  };
  ACTIONS['welcome-more'] = () => { closeSheet(); go('laender'); };
  function welcome(e) {
    const t = S.trips.find(x => x.id === e.tripId);
    const info = app.COUNTRIES && app.COUNTRIES[e.country];
    if (!t || !info) return;
    const seenKey = `cc.seen.${t.id}`;
    const seen = LS.get(seenKey, null);
    // Beim ersten Land einer Reise (meist zu Hause) still merken, erst ab dem Grenzübertritt melden
    if (!seen) return LS.set(seenKey, [e.country]);
    if (seen.includes(e.country)) return;
    LS.set(seenKey, [...seen, e.country]);
    if (document.querySelector('#sheet[open]')) return;
    openSheet(`<div class="welcome">${sheetHead(`${app.flag(e.country)} Willkommen in ${esc(info.name)}!`)}
      <dl class="facts-list">
        <div><dt>Tempo</dt><dd>${esc(info.speed)}</dd></div>
        <div><dt>Promille</dt><dd>${esc(info.alc)}</dd></div>
        <div><dt>Maut</dt><dd>${esc(info.toll)}</dd></div>
        <div><dt>Pflicht im Auto</dt><dd>${esc(info.must)}</dd></div>
        <div><dt>Notruf</dt><dd><a href="tel:112">${esc(info.sos)}</a></dd></div>
      </dl>
      ${info.tip ? `<p class="sub">${esc(info.tip)}</p>` : ''}
      <p class="sub">Ohne Gewähr, Regeln ändern sich.</p>
      <div class="sheet-foot"><button class="ghost" data-action="welcome-more">Alle Länderinfos</button><button class="primary" data-action="close">Gute Fahrt!</button></div></div>`);
  }
}
