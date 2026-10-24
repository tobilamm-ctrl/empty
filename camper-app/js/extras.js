// Weitere Bereiche im Mehr-Menü: Wetter, Länderinfos, Dokumente & Notfall, Fotoalbum, Kochen, Autarkie.

export default function installExtras(app) {
  const {
    S, ui, LS, VIEWS, ACTIONS, FORMS, CHANGES, esc, num, icon, pageHead, newId, save, remove, toast, render, go,
    openSheet, closeSheet, today, fmtDay, fmtShort, ago, hasPos, getPos, currentTrip, tripColor, tripEntries, tripStats,
    sortTrips, byDate, members, personName, me, TYPES, listsOf,
  } = app;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const sheetHead = t => `<div class="sheet-head"><h2>${t}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">${icon('close')}</button></div>`;
  const daysUntil = d => Math.round((new Date(d + 'T12:00') - new Date(today() + 'T12:00')) / 864e5);
  const dec = (v, n = 1) => (v == null || !isFinite(v) ? '–' : Number(v).toLocaleString('de-DE', { maximumFractionDigits: n }));
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);

  /* ====================================================================== */
  /* Wetter (Open-Meteo, ohne Anmeldung)                                     */
  /* ====================================================================== */

  const WX = [
    [[0], 'Klar', 'sun'], [[1], 'Überwiegend klar', 'sun'], [[2], 'Teilweise bewölkt', 'partly'], [[3], 'Bedeckt', 'cloud'],
    [[45, 48], 'Nebel', 'fog'], [[51, 53, 55, 56, 57], 'Nieselregen', 'rain'], [[61, 63, 65], 'Regen', 'rain'], [[66, 67], 'Gefrierender Regen', 'rain'],
    [[71, 73, 75, 77], 'Schnee', 'snow'], [[80, 81, 82], 'Regenschauer', 'rain'], [[85, 86], 'Schneeschauer', 'snow'], [[95], 'Gewitter', 'storm'], [[96, 99], 'Gewitter mit Hagel', 'storm'],
  ];
  const WX_ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    partly: '<circle cx="9" cy="8" r="3"/><path d="M9 2v1.5M3 8h1.5M4.8 3.8l1 1M13.2 3.8l-1 1"/><path d="M7 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A2.8 2.8 0 0 0 7 19z"/>',
    cloud: '<path d="M6 19h11a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3 3 0 0 0 6 19z"/>',
    fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
    rain: '<path d="M6 15h11a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3 3 0 0 0 6 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    snow: '<path d="M6 14h11a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3 3 0 0 0 6 14z"/><path d="M8 18h.01M12 20h.01M16 18h.01M10 22h.01M14 22h.01"/>',
    storm: '<path d="M6 14h11a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3 3 0 0 0 6 14z"/><path d="M12 15l-2 4h3l-2 4"/>',
  };
  const wx = code => WX.find(([codes]) => codes.includes(code)) || [[], 'Unbekannt', 'cloud'];
  const wxIcon = code => `<svg class="ic wx" viewBox="0 0 24 24" aria-hidden="true">${WX_ICON[wx(code)[2]]}</svg>`;

  const wxKey = p => `wx.${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
  const wxLoading = new Set();
  async function loadWeather(p) {
    const key = wxKey(p);
    const cached = LS.get(key, null);
    if (cached && Date.now() - cached.at < 30 * 60000) return;
    if (wxLoading.has(key)) return;
    wxLoading.add(key);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(4)}&longitude=${p.lng.toFixed(4)}`
        + '&current=temperature_2m,weather_code,wind_speed_10m'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max'
        + '&timezone=auto&forecast_days=5');
      if (!r.ok) throw new Error();
      LS.set(key, { at: Date.now(), data: await r.json() });
    } catch {
      if (!cached) LS.set(key + '.err', Date.now());
    } finally {
      wxLoading.delete(key);
      if (ui.route === 'wetter') render();
    }
  }

  function wxCard(title, sub, p) {
    const c = LS.get(wxKey(p), null);
    loadWeather(p);
    if (!c) {
      const err = LS.get(wxKey(p) + '.err', 0);
      return `<section class="wx-card"><h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p>
        <p class="hint">${err ? 'Wetter gerade nicht abrufbar. Das braucht Internet.' : 'Wird geladen …'}</p></section>`;
    }
    const d = c.data, cur = d.current || {}, day = d.daily || {};
    return `<section class="wx-card">
      <div class="wx-head"><div><h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p></div>
        <div class="wx-now">${wxIcon(cur.weather_code)}<b>${dec(cur.temperature_2m, 0)}°</b></div></div>
      <p class="sub">${wx(cur.weather_code)[1]}, Wind ${dec(cur.wind_speed_10m, 0)} km/h, Stand ${ago(c.at)}</p>
      <ul class="wx-days">${(day.time || []).map((t, i) => `<li>
        <span class="wx-day">${i === 0 ? 'Heute' : fmtDay(t).split(',')[0]}</span>${wxIcon(day.weather_code[i])}
        <span class="wx-temp"><b>${dec(day.temperature_2m_max[i], 0)}°</b> / ${dec(day.temperature_2m_min[i], 0)}°</span>
        <span class="wx-rain">${dec(day.precipitation_sum[i])} mm${day.precipitation_probability_max ? `, ${day.precipitation_probability_max[i] ?? 0} %` : ''}</span>
        <span class="wx-wind">${dec(day.wind_speed_10m_max[i], 0)} km/h</span>
      </li>`).join('')}</ul>
    </section>`;
  }

  VIEWS.wetter = () => {
    const t = currentTrip();
    const here = LS.get('wx.here', null);
    const cards = [];
    if (here) cards.push(wxCard('Hier', `Standort ${ago(here.at)}`, here));
    if (t) {
      const last = tripEntries(t).filter(e => hasPos(e) && e.type === 'stellplatz').sort(byDate).pop();
      if (last) cards.push(wxCard(last.title || last.place || 'Letzter Stellplatz', `Letzter Stellplatz, ${fmtDay(last.date.slice(0, 10))}`, last));
      S.places.filter(p => p.tripId === t.id && !p.done && hasPos(p))
        .sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9')).slice(0, 3)
        .forEach(p => cards.push(wxCard(p.name, `Geplant${p.planDate ? ' für ' + fmtDay(p.planDate) : ''}`, p)));
    }
    return `${pageHead('wetter', 'Wetter', 'Fünf Tage für euren Standort und die nächsten Ziele')}
      <div class="btnrow"><button class="ghost" data-action="wx-here">${icon('pin')}Wetter hier</button></div>
      ${cards.join('') || '<p class="hint">Tippt auf „Wetter hier“ oder plant Stellplätze für eine Reise, dann seht ihr hier die Vorhersage.</p>'}
      <p class="sub source">Wetterdaten: Open-Meteo.com (CC BY 4.0)</p>`;
  };
  ACTIONS['wx-here'] = async el => {
    el.disabled = true;
    try {
      const p = await getPos();
      LS.set('wx.here', { lat: p.lat, lng: p.lng, at: Date.now() });
      render();
    } catch (e) { toast(e.message); } finally { el.disabled = false; }
  };

  /* ====================================================================== */
  /* Länderinfos                                                             */
  /* ====================================================================== */

  // Für Pkw bis 3,5 t. Tempo: innerorts / außerorts / Autobahn in km/h.
  const COUNTRIES = {
    DE: { name: 'Deutschland', speed: '50 / 100 / keine allgemeine Grenze (130 empfohlen)', alc: '0,5 ‰ (Fahranfänger 0,0)', toll: 'Keine Pkw-Maut. In Umweltzonen grüne Plakette.', must: 'Warndreieck, Verbandkasten, Warnweste', sos: '112, Polizei 110', tip: 'Bei Stau Rettungsgasse bilden.' },
    AT: { name: 'Österreich', speed: '50 / 100 / 130', alc: '0,5 ‰ (Probeführerschein 0,1)', toll: 'Vignette für Autobahnen und Schnellstraßen (digital oder zum Kleben). Sondermaut z. B. Brenner, Tauern, Felbertauern.', must: 'Warnweste, Warndreieck, Verbandkasten', sos: '112, Polizei 133', tip: 'Rettungsgasse. Winterausrüstung bei winterlichen Verhältnissen vom 1. November bis 15. April.' },
    CH: { name: 'Schweiz', speed: '50 / 80 / 120', alc: '0,5 ‰ (Neulenker 0,1)', toll: 'Autobahnvignette für das Kalenderjahr, auch als E-Vignette.', must: 'Warndreieck', sos: '112, Polizei 117', tip: 'Abblendlicht auch tagsüber. Radarwarner verboten.' },
    IT: { name: 'Italien', speed: '50 / 90 / 130 (bei Nässe 110)', alc: '0,5 ‰ (Fahranfänger 0,0)', toll: 'Autobahnmaut nach Strecke an Mautstellen.', must: 'Warndreieck, Warnweste', sos: '112', tip: 'Außerorts Abblendlicht auch tagsüber. Fahrradträger mit überstehender Ladung brauchen die rot-weiße Warntafel. Verkehrsbeschränkte Zonen (ZTL) in Altstädten meiden.' },
    FR: { name: 'Frankreich', speed: '50 / 80 (teils 90) / 130 (bei Nässe 110)', alc: '0,5 ‰ (Fahranfänger 0,2)', toll: 'Autobahnmaut (Péage). In Umweltzonen Crit\'Air-Plakette nötig.', must: 'Warndreieck, Warnweste', sos: '112', tip: 'Radarwarner verboten.' },
    NL: { name: 'Niederlande', speed: '50 / 80 / tagsüber 100, abends teils bis 130', alc: '0,5 ‰', toll: 'Keine Autobahnmaut, einzelne Tunnel kosten Gebühr (z. B. Westerscheldetunnel).', must: 'Warndreieck empfohlen', sos: '112', tip: '' },
    BE: { name: 'Belgien', speed: '50 / 70 in Flandern, 90 in Wallonien / 120', alc: '0,5 ‰', toll: 'Keine Autobahnmaut. Umweltzonen in Antwerpen, Gent und Brüssel (vorher registrieren).', must: 'Warndreieck, Warnweste', sos: '112', tip: '' },
    LU: { name: 'Luxemburg', speed: '50 / 90 / 130', alc: '0,5 ‰', toll: 'Keine Maut.', must: 'Warnweste', sos: '112', tip: 'Günstig tanken.' },
    DK: { name: 'Dänemark', speed: '50 / 80 / 130', alc: '0,5 ‰', toll: 'Brückenmaut am Storebælt und an der Øresundbrücke.', must: 'Warndreieck', sos: '112', tip: 'Abblendlicht auch tagsüber.' },
    SE: { name: 'Schweden', speed: '50 / 70 bis 90 / 110 bis 120', alc: '0,2 ‰', toll: 'Øresundbrücke kostenpflichtig, Staugebühr in Stockholm und Göteborg.', must: 'Warndreieck', sos: '112', tip: 'Abblendlicht auch tagsüber.' },
    NO: { name: 'Norwegen', speed: '50 / 80 / 90 bis 110', alc: '0,2 ‰', toll: 'Elektronische Maut (AutoPASS) auf vielen Straßen, die Rechnung kommt per Post. Fähren kostenpflichtig.', must: 'Warndreieck, Warnweste', sos: '112 Polizei, 113 Rettung', tip: 'Abblendlicht auch tagsüber.' },
    ES: { name: 'Spanien', speed: '50 / 90 / 120', alc: '0,5 ‰ (Fahranfänger 0,3)', toll: 'Teilweise Autobahnmaut (Autopistas).', must: 'Warnweste, Warndreieck', sos: '112', tip: 'Fahrradträger mit überstehender Ladung brauchen eine Warntafel.' },
    PT: { name: 'Portugal', speed: '50 / 90 / 120', alc: '0,5 ‰', toll: 'Autobahnmaut, teils nur elektronisch (vorher Kennzeichen registrieren).', must: 'Warndreieck, Warnweste', sos: '112', tip: '' },
    HR: { name: 'Kroatien', speed: '50 / 90 / 130', alc: '0,5 ‰ (unter 25 Jahren 0,0)', toll: 'Autobahnmaut nach Strecke.', must: 'Warndreieck, Warnweste, Verbandkasten, Ersatzlampen', sos: '112', tip: 'Im Winter Abblendlicht auch tagsüber.' },
    SI: { name: 'Slowenien', speed: '50 / 90 / 130', alc: '0,5 ‰', toll: 'E-Vignette für Autobahnen und Schnellstraßen.', must: 'Warndreieck, Warnweste', sos: '112, Polizei 113', tip: 'Abblendlicht auch tagsüber.' },
    CZ: { name: 'Tschechien', speed: '50 / 90 / 130', alc: '0,0 ‰', toll: 'E-Vignette für Autobahnen.', must: 'Warndreieck, Warnweste, Verbandkasten, Ersatzlampen', sos: '112', tip: 'Abblendlicht auch tagsüber.' },
    SK: { name: 'Slowakei', speed: '50 / 90 / 130', alc: '0,0 ‰', toll: 'E-Vignette für Autobahnen.', must: 'Warndreieck, Warnweste, Verbandkasten', sos: '112', tip: 'Abblendlicht auch tagsüber.' },
    PL: { name: 'Polen', speed: '50 (nachts 60) / 90 / 140', alc: '0,2 ‰', toll: 'Teilweise Autobahnmaut (Mautstellen oder e-TOLL).', must: 'Warndreieck, Feuerlöscher', sos: '112', tip: 'Abblendlicht auch tagsüber.' },
    HU: { name: 'Ungarn', speed: '50 / 90 / 130', alc: '0,0 ‰', toll: 'E-Vignette für Autobahnen.', must: 'Warndreieck, Warnweste, Verbandkasten', sos: '112', tip: 'Außerorts Abblendlicht auch tagsüber.' },
  };
  app.COUNTRIES = COUNTRIES;
  const flag = cc => (cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '');
  app.flag = flag;
  // Länder einer Reise: aus Einträgen und geplanten Orten
  const tripCountries = t => [...new Set([...tripEntries(t), ...S.places.filter(p => p.tripId === t.id)].map(x => x.country).filter(Boolean))];
  app.tripCountries = tripCountries;

  const countryBlock = (cc, open) => {
    const c = COUNTRIES[cc];
    if (!c) return '';
    return `<details class="country"${open ? ' open' : ''}><summary><span class="flag">${flag(cc)}</span>${esc(c.name)}</summary>
      <dl class="facts-list">
        <div><dt>Tempo</dt><dd>${c.speed}</dd></div>
        <div><dt>Promille</dt><dd>${c.alc}</dd></div>
        <div><dt>Maut</dt><dd>${c.toll}</dd></div>
        <div><dt>Pflicht im Auto</dt><dd>${c.must}</dd></div>
        <div><dt>Notruf</dt><dd>${c.sos}</dd></div>
        ${c.tip ? `<div><dt>Gut zu wissen</dt><dd>${c.tip}</dd></div>` : ''}
      </dl></details>`;
  };

  VIEWS.laender = () => {
    const t = currentTrip();
    const mine = t ? tripCountries(t).filter(cc => COUNTRIES[cc]) : [];
    const rest = Object.keys(COUNTRIES).filter(cc => !mine.includes(cc)).sort((a, b) => COUNTRIES[a].name.localeCompare(COUNTRIES[b].name));
    return `${pageHead('laender', 'Länderinfos', 'Maut, Tempo, Pflichtausstattung, Notruf')}
      ${mine.length ? `<h2 class="stat-h">Auf „${esc(t.name)}“</h2>${mine.map(cc => countryBlock(cc, true)).join('')}` : ''}
      <h2 class="stat-h">${mine.length ? 'Weitere Länder' : 'Länder'}</h2>${rest.map(cc => countryBlock(cc, false)).join('')}
      <p class="sub source">Angaben für Pkw bis 3,5 t, ohne Gewähr, Stand 2025. Regeln ändern sich: vor der Reise beim
        <a href="https://www.adac.de/reise-freizeit/" target="_blank" rel="noopener">ADAC</a> oder beim
        <a href="https://www.auswaertiges-amt.de/de/ReiseUndSicherheit" target="_blank" rel="noopener">Auswärtigen Amt</a> nachsehen.</p>`;
  };

  /* ====================================================================== */
  /* Dokumente & Notfall                                                     */
  /* ====================================================================== */

  const DOC_KINDS = ['Personalausweis', 'Reisepass', 'Führerschein', 'Fahrzeugschein', 'Versicherungskarte', 'Krankenversicherungskarte', 'Impfausweis', 'Sonstiges'];
  const emergency = () => S.meta.find(m => m.id === 'emergency') || { id: 'emergency', contacts: [], medical: '' };
  const expiringDocs = () => S.documents.filter(d => d.expires && daysUntil(d.expires) <= 60);
  app.docsDue = () => (isAdmin() ? expiringDocs().length : 0);

  VIEWS.dokumente = () => {
    const em = emergency();
    const t = currentTrip();
    const ccs = t ? tripCountries(t) : [];
    const sosHere = ccs.map(cc => COUNTRIES[cc] && `${flag(cc)} ${COUNTRIES[cc].name}: ${COUNTRIES[cc].sos}`).filter(Boolean);
    const docs = S.documents.slice().sort((a, b) => (a.person || '').localeCompare(b.person || '') || a.title.localeCompare(b.title));
    return `${pageHead('dokumente', isAdmin() ? 'Dokumente & Notfall' : 'Notfall', 'Alles Wichtige griffbereit, auch offline')}
      <section class="panel sos">
        <a class="primary btn sos-call" href="tel:112">Notruf 112</a>
        ${sosHere.length ? `<p class="sub">${sosHere.map(esc).join('<br>')}</p>` : '<p class="sub">112 gilt in ganz Europa.</p>'}
      </section>
      <section class="panel">
        <div class="toolbar"><h2>Notfallkontakte</h2><button class="ghost" data-action="emergency-form">Bearbeiten</button></div>
        ${em.contacts.length ? `<ul class="ledger">${em.contacts.map(c => `<li><a class="contact" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">
          <span class="txt"><b>${esc(c.name)}</b><small>${esc(c.relation || '')}</small></span><span class="amt">${esc(c.phone)}</span></a></li>`).join('')}</ul>`
          : '<p class="hint">Wen sollen Helfer anrufen? Großeltern, Nachbarn, Hausarzt.</p>'}
        ${em.medical ? `<h3 class="date-head">Gesundheit</h3><p class="prose">${esc(em.medical).replace(/\n/g, '<br>')}</p>` : ''}
      </section>
      ${isAdmin() ? `<section class="panel">
        <div class="toolbar"><h2>Dokumente</h2><button class="primary" data-action="doc-form">${icon('plus')}Dokument</button></div>
        <p class="sub">Nur Verwalter sehen diesen Abschnitt.</p>
        ${docs.length ? `<ul class="ledger">${docs.map(d => {
          const n = d.expires ? daysUntil(d.expires) : null;
          return `<li><button data-action="doc-view" data-id="${d.id}">
            <span class="txt"><b>${esc(d.title)}</b><small>${esc([d.kind, d.person ? personName(d.person) : ''].filter(Boolean).join(', '))}</small></span>
            ${d.expires ? `<span class="due ${n < 0 ? 'over' : n <= 60 ? 'soon' : ''}">${n < 0 ? 'abgelaufen' : 'bis ' + fmtShort(d.expires)}</span>` : ''}
          </button></li>`; }).join('')}</ul>
          <button class="link" data-action="doc-offline">Alle Bilder für offline speichern</button>`
          : '<p class="hint">Fotografiert Ausweise, Fahrzeugschein und Versicherungskarte. Ablaufdaten erinnern euch 60 Tage vorher.</p>'}
      </section>` : ''}`;
  };

  function docForm(id) {
    const d = S.documents.find(x => x.id === id) || { kind: 'Personalausweis', images: [] };
    app.docImages = { keep: (d.images || []).slice(), add: [] };
    openSheet(`<form data-form="doc" data-id="${d.id || ''}">${sheetHead(d.id ? 'Dokument' : 'Neues Dokument')}
      <label class="field"><span>Bezeichnung</span><input name="title" value="${esc(d.title)}" required placeholder="z. B. Reisepass Lena"></label>
      <div class="row2">
        <label class="field"><span>Art</span><select name="kind">${DOC_KINDS.map(k => `<option${k === d.kind ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="field"><span>Gehört</span><select name="person"><option value="">Allen / dem Auto</option>${members().map(m => `<option value="${m.id}"${m.id === d.person ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
      </div>
      <div class="row2">
        <label class="field"><span>Nummer</span><input name="number" value="${esc(d.number)}" autocomplete="off"></label>
        <label class="field"><span>Gültig bis</span><input type="date" name="expires" value="${d.expires || ''}"></label>
      </div>
      <label class="field"><span>Notiz</span><input name="note" value="${esc(d.note)}"></label>
      <div class="field"><span>Bilder (Vorder- und Rückseite)</span><div class="photo-grid" id="docGrid">${docGrid()}</div>
        <label class="ghost file">${icon('plus')}Foto hinzufügen<input type="file" accept="image/*" multiple data-action="doc-photos"></label></div>
      <div class="sheet-foot">
        ${d.id ? `<button type="button" class="ghost danger" data-action="del-doc" data-id="${d.id}">Löschen</button>` : ''}
        <button class="primary">Speichern</button>
      </div></form>`);
  }
  const docGrid = () => [...app.docImages.keep, ...app.docImages.add].map(p =>
    `<figure><img src="${p.thumb}" alt=""><button type="button" data-action="drop-doc-photo" data-id="${p.id}" aria-label="Bild entfernen">${icon('close')}</button></figure>`).join('');

  CHANGES['doc-photos'] = async el => {
    for (const f of [...el.files]) {
      try { app.docImages.add.push({ id: 'doc-' + newId(), thumb: await app.shrink(f, 360, 0.7), data: await app.shrink(f, 2000, 0.85) }); }
      catch { toast('Ein Bild ließ sich nicht lesen.'); }
    }
    el.value = '';
    document.getElementById('docGrid').innerHTML = docGrid();
  };
  ACTIONS['drop-doc-photo'] = el => {
    app.docImages.keep = app.docImages.keep.filter(p => p.id !== el.dataset.id);
    app.docImages.add = app.docImages.add.filter(p => p.id !== el.dataset.id);
    document.getElementById('docGrid').innerHTML = docGrid();
  };
  ACTIONS['doc-form'] = el => docForm(el.dataset.id);
  ACTIONS['doc-view'] = el => {
    const d = S.documents.find(x => x.id === el.dataset.id);
    openSheet(`<article>${sheetHead(esc(d.title))}
      <dl class="facts-list">
        <div><dt>Art</dt><dd>${esc(d.kind)}</dd></div>
        ${d.person ? `<div><dt>Gehört</dt><dd>${esc(personName(d.person))}</dd></div>` : ''}
        ${d.number ? `<div><dt>Nummer</dt><dd>${esc(d.number)}</dd></div>` : ''}
        ${d.expires ? `<div><dt>Gültig bis</dt><dd>${fmtShort(d.expires)}</dd></div>` : ''}
        ${d.note ? `<div><dt>Notiz</dt><dd>${esc(d.note)}</dd></div>` : ''}
      </dl>
      <div class="doc-images">${(d.images || []).map(p => `<img data-photo="${p.id}" src="${p.thumb}" alt="">`).join('')}</div>
      <div class="sheet-foot"><button class="primary" data-action="doc-form" data-id="${d.id}">Bearbeiten</button></div></article>`, root => {
      root.querySelectorAll('[data-photo]').forEach(img => app.store().get('photos', img.dataset.photo).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {}));
    });
  };
  ACTIONS['del-doc'] = el => {
    if (!confirm('Dieses Dokument mit seinen Bildern löschen?')) return;
    const d = S.documents.find(x => x.id === el.dataset.id);
    (d.images || []).forEach(p => remove('photos', p.id));
    remove('documents', d.id);
    closeSheet();
  };
  ACTIONS['doc-offline'] = async () => {
    let n = 0;
    for (const d of S.documents) for (const p of d.images || []) {
      try { const { data } = await app.store().get('photos', p.id); if (!data.startsWith('data:')) await fetch(data, { credentials: 'same-origin' }); n++; } catch { /* offline */ }
    }
    toast(`${n} Bilder sind jetzt auch offline da.`);
  };
  FORMS.doc = form => {
    const old = S.documents.find(x => x.id === form.dataset.id);
    const keepIds = new Set(app.docImages.keep.map(p => p.id));
    (old && old.images || []).filter(p => !keepIds.has(p.id)).forEach(p => remove('photos', p.id));
    app.docImages.add.forEach(p => save('photos', { id: p.id, data: p.data }));
    save('documents', {
      ...(old || { id: newId(), createdAt: Date.now() }),
      title: form.title.value.trim(), kind: form.kind.value, person: form.person.value, number: form.number.value.trim(),
      expires: form.expires.value, note: form.note.value.trim(),
      images: [...app.docImages.keep, ...app.docImages.add].map(({ id, thumb }) => ({ id, thumb })),
    });
    closeSheet();
  };

  ACTIONS['emergency-form'] = () => {
    const em = emergency();
    openSheet(`<form data-form="emergency">${sheetHead('Notfall')}
      <label class="field"><span>Kontakte, einer pro Zeile: Name; Telefon; Beziehung</span>
        <textarea name="contacts" rows="5" placeholder="Oma Helga; +49 170 1234567; Großmutter">${esc(em.contacts.map(c => [c.name, c.phone, c.relation].filter(Boolean).join('; ')).join('\n'))}</textarea></label>
      <label class="field"><span>Gesundheit: Blutgruppen, Allergien, Medikamente</span>
        <textarea name="medical" rows="4">${esc(em.medical)}</textarea></label>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.emergency = form => {
    const contacts = lines(form.contacts.value).map(l => { const [name, phone = '', relation = ''] = l.split(';').map(x => x.trim()); return { name, phone, relation }; });
    save('meta', { ...emergency(), contacts, medical: form.medical.value.trim() });
    closeSheet();
  };

  /* ====================================================================== */
  /* Fotoalbum & Jahresrückblick                                             */
  /* ====================================================================== */

  const allPhotos = trips => {
    const ids = new Set(trips.map(t => t.id));
    return S.entries.filter(e => ids.has(e.tripId) && (e.photos || []).length).sort(byDate)
      .flatMap(e => e.photos.map(p => ({ ...p, entry: e })));
  };

  VIEWS.album = () => {
    const mode = ui.albumMode || 'reisen';
    const trips = sortTrips(S.trips).filter(t => allPhotos([t]).length);
    let body;
    if (mode === 'jahr') {
      const years = [...new Set(S.trips.map(t => (t.start || '').slice(0, 4)).filter(Boolean))].sort().reverse();
      const y = ui.albumYear && years.includes(ui.albumYear) ? ui.albumYear : years[0];
      const ts = S.trips.filter(t => (t.start || '').startsWith(y));
      const stats = ts.map(t => tripStats(t));
      const ccs = [...new Set(ts.flatMap(t => tripCountries(t)))];
      const best = allPhotos(ts).filter(p => p.entry.rating >= 4);
      const photos = best.length >= 6 ? best : allPhotos(ts);
      body = years.length ? `<div class="chips list-chips">${years.map(x => `<button class="chip${x === y ? ' on' : ''}" data-action="album-year" data-y="${x}">${x}</button>`).join('')}</div>
        <div class="facts stat-facts">
          <div><b>${ts.length}</b><span>${ts.length === 1 ? 'Reise' : 'Reisen'}</span></div>
          <div><b>${stats.reduce((s, x) => s + x.nights, 0)}</b><span>Nächte</span></div>
          <div><b>${Math.round(stats.reduce((s, x) => s + x.dist, 0)).toLocaleString('de-DE')} km</b><span>unterwegs</span></div>
          <div><b>${ccs.length}</b><span>${ccs.length === 1 ? 'Land' : 'Länder'}</span></div>
        </div>
        ${ccs.length ? `<p class="flags">${ccs.map(flag).join(' ')}</p>` : ''}
        <h2 class="stat-h">${best.length >= 6 ? 'Die schönsten Momente' : 'Fotos'} ${y}</h2>${grid(photos)}`
        : '<p class="hint">Noch keine Reisen mit Datum.</p>';
    } else {
      const sel = trips.find(t => t.id === ui.albumTrip) || trips[0];
      body = trips.length ? `<div class="chips list-chips">${trips.map(t => `<button class="chip${sel && t.id === sel.id ? ' on' : ''}" data-action="album-trip" data-id="${t.id}"><i class="trip-dot" style="--c:${tripColor(t)}"></i>${esc(t.name)}</button>`).join('')}</div>
        ${groupByDay(allPhotos([sel]))}` : '<p class="hint">Noch keine Fotos. Fotos hängt ihr an Tagebuch-Einträge an.</p>';
    }
    return `${pageHead('album', 'Fotoalbum', 'Alle Fotos eurer Reisen')}
      <div class="seg tabs">
        <button class="${mode === 'reisen' ? 'on' : ''}" data-action="album-mode" data-mode="reisen">Nach Reise</button>
        <button class="${mode === 'jahr' ? 'on' : ''}" data-action="album-mode" data-mode="jahr">Jahresrückblick</button>
      </div>${body}`;
  };
  let viewerList = [];
  function grid(list) {
    viewerList = list;
    return `<div class="album-grid">${list.map((p, i) => `<button data-action="album-open" data-i="${i}"><img src="${p.thumb}" alt="${esc(p.entry.title || '')}" loading="lazy"></button>`).join('')}</div>`;
  }
  function groupByDay(list) {
    viewerList = list;
    const days = {};
    list.forEach((p, i) => (days[p.entry.date.slice(0, 10)] ||= []).push([p, i]));
    return Object.entries(days).map(([d, ps]) => `<h3 class="date-head">${fmtDay(d)}</h3>
      <div class="album-grid">${ps.map(([p, i]) => `<button data-action="album-open" data-i="${i}"><img src="${p.thumb}" alt="${esc(p.entry.title || '')}" loading="lazy"></button>`).join('')}</div>`).join('');
  }
  function openViewer(i) {
    const p = viewerList[i];
    if (!p) return;
    openSheet(`<article class="viewer">${sheetHead(esc(p.entry.title || TYPES[p.entry.type].label))}
      <img id="viewerImg" src="${p.thumb}" alt="">
      <p class="sub">${fmtDay(p.entry.date.slice(0, 10))}${p.entry.place ? ', ' + esc(p.entry.place) : ''}, Bild ${i + 1} von ${viewerList.length}</p>
      <div class="sheet-foot">
        <button class="ghost" data-action="album-open" data-i="${i - 1}"${i ? '' : ' disabled'}>Zurück</button>
        <button class="ghost" data-action="open-entry" data-id="${p.entry.id}">Zum Eintrag</button>
        <button class="primary" data-action="album-open" data-i="${i + 1}"${i < viewerList.length - 1 ? '' : ' disabled'}>Weiter</button>
      </div></article>`, () => {
      app.store().get('photos', p.id).then(x => { const img = document.getElementById('viewerImg'); if (x && x.data && img) img.src = x.data; }).catch(() => {});
    });
  }
  ACTIONS['album-mode'] = el => { ui.albumMode = el.dataset.mode; render(); };
  ACTIONS['album-trip'] = el => { ui.albumTrip = el.dataset.id; render(); };
  ACTIONS['album-year'] = el => { ui.albumYear = el.dataset.y; render(); };
  ACTIONS['album-open'] = el => openViewer(+el.dataset.i);

  /* ====================================================================== */
  /* Kochen                                                                  */
  /* ====================================================================== */

  const TAGS = ['Einflammkocher', 'Schnell', 'Vegetarisch', 'Frühstück', 'Kinder', 'Ohne Kochen'];
  const EXAMPLES = [
    { title: 'One-Pot-Pasta mit Tomaten', servings: 4, minutes: 20, tags: ['Einflammkocher', 'Schnell', 'Vegetarisch'],
      ingredients: '400 g Spaghetti\n1 Dose stückige Tomaten\n250 g Kirschtomaten\n1 Zwiebel\n2 Knoblauchzehen\n900 ml Wasser\n1 TL Gemüsebrühe\n2 EL Olivenöl\nBasilikum\nParmesan\nSalz und Pfeffer',
      steps: 'Zwiebel und Knoblauch fein schneiden, Kirschtomaten halbieren.\nAlles außer Basilikum und Parmesan in einen großen Topf geben und aufkochen.\nOhne Deckel 10 bis 12 Minuten köcheln und oft umrühren, bis die Nudeln gar sind und fast keine Flüssigkeit mehr da ist.\nAbschmecken, Basilikum und Parmesan darüber.' },
    { title: 'Shakshuka', servings: 2, minutes: 25, tags: ['Einflammkocher', 'Vegetarisch', 'Frühstück'],
      ingredients: '1 Zwiebel\n1 Paprika\n2 Knoblauchzehen\n1 Dose gehackte Tomaten\n4 Eier\n1 TL Kreuzkümmel\n1 TL Paprikapulver\nÖl\nSalz und Pfeffer\nPetersilie\nBrot',
      steps: 'Zwiebel, Paprika und Knoblauch klein schneiden und in Öl in der Pfanne anbraten.\nGewürze kurz mitrösten, Tomaten dazu und 10 Minuten köcheln.\nVier Mulden drücken, die Eier hineinschlagen, Deckel drauf und 6 bis 8 Minuten stocken lassen.\nMit Petersilie bestreuen, mit Brot essen.' },
    { title: 'Chili sin Carne', servings: 4, minutes: 35, tags: ['Einflammkocher', 'Vegetarisch'],
      ingredients: '1 Zwiebel\n2 Knoblauchzehen\n1 Paprika\n1 Dose Kidneybohnen\n1 Dose Mais\n1 Dose stückige Tomaten\n2 EL Tomatenmark\n1 TL Kreuzkümmel\n1 TL Paprikapulver\nChili nach Geschmack\nÖl\nSalz\nReis oder Brot',
      steps: 'Zwiebel, Knoblauch und Paprika in Öl anbraten.\nTomatenmark und Gewürze kurz mitrösten.\nTomaten, abgespülte Bohnen und Mais dazu, 20 Minuten köcheln.\nAbschmecken, mit Reis oder Brot servieren.' },
    { title: 'Pfannkuchen', servings: 4, minutes: 20, tags: ['Frühstück', 'Kinder'],
      ingredients: '250 g Mehl\n500 ml Milch\n3 Eier\n1 EL Zucker\n1 Prise Salz\nButter zum Braten\nApfelmus oder Marmelade',
      steps: 'Mehl, Milch, Eier, Zucker und Salz glatt rühren und 10 Minuten stehen lassen.\nButter in der Pfanne erhitzen, eine Kelle Teig dünn verteilen.\nVon beiden Seiten goldbraun backen, mit Apfelmus oder Marmelade essen.' },
    { title: 'Couscous-Salat', servings: 4, minutes: 15, tags: ['Schnell', 'Vegetarisch', 'Ohne Kochen'],
      ingredients: '250 g Couscous\n250 ml kochendes Wasser\n1 Gurke\n250 g Tomaten\n1 Paprika\n1 Bund Petersilie\n1 Zitrone\n4 EL Olivenöl\n100 g Feta\nSalz und Pfeffer',
      steps: 'Couscous mit dem kochenden Wasser übergießen, 5 Minuten quellen lassen und mit einer Gabel auflockern.\nGemüse würfeln, Petersilie hacken.\nAlles mischen, mit Zitronensaft, Öl, Salz und Pfeffer abschmecken, Feta darüberbröseln.' },
    { title: 'Kaiserschmarrn aus der Pfanne', servings: 4, minutes: 25, tags: ['Kinder', 'Einflammkocher'],
      ingredients: '200 g Mehl\n300 ml Milch\n4 Eier\n2 EL Zucker\n1 Prise Salz\nButter\nPuderzucker\nApfelmus',
      steps: 'Eier trennen. Mehl, Milch, Eigelb und Salz verrühren, Eiweiß mit dem Zucker steif schlagen und unterheben.\nButter in der Pfanne schmelzen, Teig hineingeben und bei mittlerer Hitze mit Deckel stocken lassen.\nWenden, mit zwei Gabeln in Stücke reißen und fertig braten.\nMit Puderzucker und Apfelmus servieren.' },
  ];

  VIEWS.kochen = () => {
    const q = (ui.recipeQuery || '').toLowerCase();
    const tag = ui.recipeTag || '';
    const list = S.recipes.filter(r => (!tag || (r.tags || []).includes(tag))
      && (!q || r.title.toLowerCase().includes(q) || (r.ingredients || '').toLowerCase().includes(q)))
      .sort((a, b) => a.title.localeCompare(b.title));
    return `${pageHead('kochen', 'Kochen', 'Rezepte für die Campingküche')}
      ${S.recipes.length ? `<label class="search">${icon('search')}<input type="search" data-keep="recipeQuery" data-action-input="recipe-search" value="${esc(ui.recipeQuery || '')}" placeholder="Rezept oder Zutat"></label>
      <div class="chips list-chips"><button class="chip${tag ? '' : ' on'}" data-action="recipe-tag" data-t="">Alle</button>${TAGS.map(t => `<button class="chip${tag === t ? ' on' : ''}" data-action="recipe-tag" data-t="${t}">${t}</button>`).join('')}</div>
      <ul class="ledger">${list.map(r => `<li><button data-action="recipe-view" data-id="${r.id}">
        <span class="txt"><b>${esc(r.title)}</b><small>${[r.minutes ? r.minutes + ' Min.' : '', r.servings ? r.servings + ' Portionen' : '', (r.tags || []).join(', ')].filter(Boolean).join(', ')}</small></span>
      </button></li>`).join('') || '<li class="none">Kein Rezept passt.</li>'}</ul>`
      : '<p class="hint">Sammelt eure Lieblingsrezepte für unterwegs. Aus jedem Rezept wird mit einem Tipp eine Einkaufsliste.</p>'}
      <div class="toolbar end">
        ${S.recipes.length ? '' : '<button class="ghost" data-action="recipe-examples">Beispielrezepte anlegen</button>'}
        <button class="primary" data-action="recipe-form">${icon('plus')}Rezept</button>
      </div>`;
  };
  document.addEventListener('input', ev => {
    if (ev.target.dataset.actionInput === 'recipe-search') { ui.recipeQuery = ev.target.value; render(); }
  });
  ACTIONS['recipe-tag'] = el => { ui.recipeTag = el.dataset.t; render(); };
  ACTIONS['recipe-examples'] = () => {
    EXAMPLES.forEach(r => save('recipes', { ...r, id: newId(), by: me(), createdAt: Date.now() }));
    toast('Sechs Beispielrezepte angelegt');
  };
  ACTIONS['recipe-view'] = el => {
    const r = S.recipes.find(x => x.id === el.dataset.id);
    const shopLists = listsOf('einkauf');
    openSheet(`<article class="recipe">${sheetHead(esc(r.title))}
      <p class="sub">${[r.minutes ? r.minutes + ' Minuten' : '', r.servings ? r.servings + ' Portionen' : '', (r.tags || []).join(', ')].filter(Boolean).join(', ')}</p>
      <h3 class="date-head">Zutaten</h3>
      <ul class="checklist recipe-ing">${lines(r.ingredients).map(l => `<li><span class="txt">${esc(l)}</span></li>`).join('')}</ul>
      <h3 class="date-head">So geht's</h3>
      <ol class="recipe-steps">${lines(r.steps).map(l => `<li>${esc(l)}</li>`).join('')}</ol>
      <div class="field"><span>Zutaten auf die Einkaufsliste</span>
        <div class="adder"><select id="recipeList">${shopLists.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}<option value="">Neue Liste „${esc(r.title)}“</option></select>
        <button class="primary" data-action="recipe-shop" data-id="${r.id}">${icon('plus')}</button></div></div>
      <div class="sheet-foot">
        <button class="ghost danger" data-action="del-recipe" data-id="${r.id}">Löschen</button>
        <button class="ghost" data-action="recipe-form" data-id="${r.id}">Bearbeiten</button>
      </div></article>`);
  };
  ACTIONS['recipe-shop'] = el => {
    const r = S.recipes.find(x => x.id === el.dataset.id);
    const sel = document.getElementById('recipeList').value;
    const l = S.lists.find(x => x.id === sel) || save('lists', { id: newId(), kind: 'einkauf', name: r.title, tripId: null, createdAt: Date.now(), order: listsOf('einkauf').length });
    const items = lines(r.ingredients);
    items.forEach((text, i) => save('listItems', { id: newId(), listId: l.id, list: 'einkauf', text, done: false, by: me(), createdAt: Date.now() - i }));
    toast(`${items.length} Zutaten auf „${l.name}“`);
    closeSheet();
  };
  ACTIONS['recipe-form'] = el => {
    const r = S.recipes.find(x => x.id === el.dataset.id) || { tags: [] };
    openSheet(`<form data-form="recipe" data-id="${r.id || ''}">${sheetHead(r.id ? 'Rezept bearbeiten' : 'Neues Rezept')}
      <label class="field"><span>Name</span><input name="title" value="${esc(r.title)}" required></label>
      <div class="row2">
        <label class="field"><span>Portionen</span><input name="servings" inputmode="numeric" value="${r.servings || ''}"></label>
        <label class="field"><span>Minuten</span><input name="minutes" inputmode="numeric" value="${r.minutes || ''}"></label>
      </div>
      <div class="field"><span>Passt zu</span><div class="chips wrap">${TAGS.map(t => `<label class="chip"><input type="checkbox" name="tags" value="${t}"${(r.tags || []).includes(t) ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
      <label class="field"><span>Zutaten, eine pro Zeile</span><textarea name="ingredients" rows="8">${esc(r.ingredients)}</textarea></label>
      <label class="field"><span>Zubereitung, ein Schritt pro Zeile</span><textarea name="steps" rows="6">${esc(r.steps)}</textarea></label>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  ACTIONS['del-recipe'] = el => { if (confirm('Rezept löschen?')) { remove('recipes', el.dataset.id); closeSheet(); } };
  FORMS.recipe = form => {
    const old = S.recipes.find(x => x.id === form.dataset.id);
    save('recipes', {
      ...(old || { id: newId(), by: me(), createdAt: Date.now() }), title: form.title.value.trim(),
      servings: parseInt(form.servings.value) || 0, minutes: parseInt(form.minutes.value) || 0,
      tags: [...form.querySelectorAll('[name=tags]:checked')].map(i => i.value),
      ingredients: form.ingredients.value.trim(), steps: form.steps.value.trim(),
    });
    closeSheet();
  };

  /* ====================================================================== */
  /* Autarkie: Wasser, Gas, Strom                                            */
  /* ====================================================================== */

  const RES = {
    water: { label: 'Frischwasser', unit: 'l', cap: 20, perDay: 7, step: 1, hint: 'Kanister oder Tank' },
    gas: { label: 'Gas', unit: 'Kartuschen', cap: 4, perDay: 0.5, step: 1, hint: 'Kartuschen oder Flasche' },
    power: { label: 'Strom', unit: '%', cap: 100, perDay: 25, step: 10, hint: 'Powerstation oder Bordbatterie' },
  };
  const autarky = () => S.meta.find(m => m.id === 'autarky') || { id: 'autarky' };
  const resState = k => ({ ...RES[k], level: RES[k].cap, at: Date.now(), ...(autarky()[k] || {}) });
  // Heutiger Stand: gespeicherter Wert minus Verbrauch seit der letzten Änderung
  const estimate = r => Math.max(0, r.level - r.perDay * ((Date.now() - r.at) / 864e5));

  VIEWS.autarkie = () => `${pageHead('autarkie', 'Autarkie', 'Wie lange reichen Wasser, Gas und Strom?')}
    ${Object.keys(RES).map(k => {
      const r = resState(k);
      const now = estimate(r);
      const days = r.perDay ? now / r.perDay : null;
      const pct = r.cap ? Math.min(1, now / r.cap) : 0;
      return `<section class="panel res">
        <div class="toolbar"><h2>${r.label}</h2><button class="icon-btn small" data-action="res-form" data-k="${k}" aria-label="${r.label} einstellen">${icon('edit')}</button></div>
        <div class="res-bar ${pct < 0.2 ? 'low' : ''}"><span style="width:${(pct * 100).toFixed(0)}%"></span></div>
        <p><b>${dec(now)} ${r.unit}</b> von ${dec(r.cap)} ${r.unit}${days != null ? `, reicht noch etwa <b>${dec(days)} ${days >= 0.95 && days < 1.05 ? 'Tag' : 'Tage'}</b>` : ''}</p>
        <p class="sub">${r.hint}, Verbrauch ${dec(r.perDay)} ${r.unit} pro Tag, zuletzt geändert ${ago(r.at)}</p>
        <div class="btnrow">
          <button class="ghost" data-action="res-step" data-k="${k}" data-d="-1">− ${dec(r.step)}</button>
          <button class="ghost" data-action="res-step" data-k="${k}" data-d="1">+ ${dec(r.step)}</button>
          <button class="primary" data-action="res-full" data-k="${k}">Voll</button>
        </div>
      </section>`;
    }).join('')}
    <p class="sub">Tipp: Beim Tagebuch-Eintrag „Ver- &amp; Entsorgung“ setzt „Frischwasser aufgefüllt“ den Wasserstand automatisch auf voll.</p>`;

  const setRes = (k, patch) => {
    const r = resState(k);
    const cur = { cap: r.cap, perDay: r.perDay, step: r.step, unit: r.unit, level: estimate(r), at: Date.now(), ...patch };
    cur.level = Math.max(0, Math.min(cur.cap, cur.level));
    save('meta', { ...autarky(), [k]: cur });
  };
  app.fillWater = () => setRes('water', { level: resState('water').cap });
  ACTIONS['res-full'] = el => setRes(el.dataset.k, { level: resState(el.dataset.k).cap });
  ACTIONS['res-step'] = el => { const r = resState(el.dataset.k); setRes(el.dataset.k, { level: estimate(r) + r.step * +el.dataset.d }); };
  ACTIONS['res-form'] = el => {
    const k = el.dataset.k, r = resState(k);
    openSheet(`<form data-form="res" data-k="${k}">${sheetHead(r.label)}
      <div class="row2">
        <label class="field"><span>Fassungsvermögen in ${r.unit}</span><input name="cap" inputmode="decimal" value="${String(r.cap).replace('.', ',')}"></label>
        <label class="field"><span>Verbrauch pro Tag</span><input name="perDay" inputmode="decimal" value="${String(r.perDay).replace('.', ',')}"></label>
      </div>
      <label class="field"><span>Aktueller Stand in ${r.unit}</span><input name="level" inputmode="decimal" value="${String(Math.round(estimate(r) * 10) / 10).replace('.', ',')}"></label>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.res = form => {
    setRes(form.dataset.k, { cap: num(form.cap.value) || 1, perDay: num(form.perDay.value), level: num(form.level.value) });
    closeSheet();
  };
  // Ver- & Entsorgung mit „Frischwasser aufgefüllt“: Wasserstand auf voll
  const saveEntry = FORMS.entry;
  FORMS.entry = form => {
    const filled = form.dataset.type === 'service' && form.querySelector('[name=x_service_water]:checked');
    saveEntry(form);
    if (filled) app.fillWater();
  };
}
