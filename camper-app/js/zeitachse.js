// Google-Maps-Zeitachse importieren: Aus dem Export der Zeitachse (Android „Timeline.json“, iPhone-Export
// oder ältere Takeout-Monatsdateien) wird eine Reise mit Strecke, Stellplätzen und Orten.
// Die Datei bleibt auf dem Handy; nur die ausgewählten Orte und die Strecke werden gespeichert.

export default function installZeitachse(app) {
  const {
    S, ui, VIEWS, ACTIONS, CHANGES, FORMS, esc, icon, newId, save, toast, render, go, openSheet, closeSheet,
    fmtDay, fmtKm, km, me, nextColor, setTrip, TYPES,
  } = app;
  const sheetHead = app.sheetHead;

  /* ---------- Einlesen: alle bekannten Formate auf eine Form bringen ---------- */

  // Lokale Zeit „JJJJ-MM-TTTHH:MM“ aus einem ISO-Zeitpunkt mit Offset (die Zeit vor Ort bleibt erhalten)
  const local = iso => String(iso || '').slice(0, 16);
  const ms = iso => new Date(iso).getTime();
  const parseLL = s => {
    if (!s) return null;
    const m = String(s).replace(/^geo:/, '').match(/(-?\d+(?:\.\d+)?)°?\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m ? { lat: +m[1], lng: +m[2] } : null;
  };
  const e7 = o => (o && o.latitudeE7 != null ? { lat: o.latitudeE7 / 1e7, lng: o.longitudeE7 / 1e7 } : null);

  function normalize(data) {
    const visits = [], acts = [], path = [], ends = [], memories = [];
    const point = (arr, p, t) => { if (p && t) arr.push({ t: ms(t), d: local(t).slice(0, 10), lat: p.lat, lng: p.lng }); };
    const addPath = (p, t) => point(path, p, t);
    // Anfang und Ende der Fahrten: nur als Ersatz, falls die Datei keine Streckenpunkte hat
    const addEnd = (p, t) => point(ends, p, t);
    // Android (neu, auf dem Gerät): { semanticSegments: [...] }
    const segs = Array.isArray(data) ? data : data.semanticSegments;
    if (Array.isArray(segs)) {
      for (const s of segs) {
        if (s.visit) {
          const c = s.visit.topCandidate || {};
          const p = parseLL(c.placeLocation && (c.placeLocation.latLng || c.placeLocation));
          if (p) visits.push({ start: s.startTime, end: s.endTime, ...p, level: +(s.visit.hierarchyLevel || 0), kind: c.semanticType || '', placeId: c.placeId || c.placeID || '' });
        } else if (s.activity) {
          const a = s.activity, c = a.topCandidate || {};
          const from = parseLL(a.start && (a.start.latLng || a.start)), to = parseLL(a.end && (a.end.latLng || a.end));
          acts.push({ start: s.startTime, end: s.endTime, type: c.type || '', meters: +(a.distanceMeters || 0), from, to });
          addEnd(from, s.startTime); addEnd(to, s.endTime);
        } else if (s.timelinePath) {
          for (const p of s.timelinePath) {
            // iPhone: Minuten seit Segmentbeginn statt Zeitstempel
            const t = p.time || (p.durationMinutesOffsetFromStartTime != null ? new Date(ms(s.startTime) + p.durationMinutesOffsetFromStartTime * 60000).toISOString() : s.startTime);
            addPath(parseLL(p.point), t);
          }
        } else if (s.timelineMemory && s.timelineMemory.trip) {
          memories.push({ start: s.startTime, end: s.endTime, km: s.timelineMemory.trip.distanceFromOriginKms || 0 });
        }
      }
    }
    // Takeout (alt): { timelineObjects: [{ placeVisit }, { activitySegment }] }
    if (Array.isArray(data.timelineObjects)) {
      for (const o of data.timelineObjects) {
        if (o.placeVisit) {
          const v = o.placeVisit, p = e7(v.location);
          if (p) visits.push({ start: v.duration.startTimestamp, end: v.duration.endTimestamp, ...p, level: 0, kind: v.location.semanticType || '', name: v.location.name || '', address: v.location.address || '' });
        } else if (o.activitySegment) {
          const a = o.activitySegment;
          const from = e7(a.startLocation), to = e7(a.endLocation);
          acts.push({ start: a.duration.startTimestamp, end: a.duration.endTimestamp, type: a.activityType || '', meters: +(a.distance || 0), from, to });
          addEnd(from, a.duration.startTimestamp);
          ((a.waypointPath && a.waypointPath.waypoints) || []).forEach(w => addPath(e7(w), a.duration.startTimestamp));
          ((a.simplifiedRawPath && a.simplifiedRawPath.points) || []).forEach(w => addPath(e7(w), w.timestamp));
          addEnd(to, a.duration.endTimestamp);
        }
      }
    }
    if (!visits.length && !path.length && !ends.length) throw new Error('In dieser Datei wurden keine Zeitachsen-Daten gefunden.');
    const line = (path.length ? path : ends).sort((a, b) => a.t - b.t);
    visits.sort((a, b) => ms(a.start) - ms(b.start));
    return { visits, acts, path: line, memories };
  }

  /* ---------- Auswerten: Übernachtungen, Orte, Strecke ---------- */

  const hours = v => (ms(v.end) - ms(v.start)) / 36e5;
  const ACT_TYPE = { IN_FERRY: 'faehre', CYCLING: 'wanderung', WALKING: 'wanderung', HIKING: 'wanderung', RUNNING: 'wanderung' };

  function analyse(tl, from, to) {
    const inRange = iso => { const d = local(iso).slice(0, 10); return d >= from && d <= to; };
    // Nur oberste Ebene, keine „Zuhause“-Orte, keine Kurzstopps unter 25 Minuten (außer über Nacht)
    let vs = tl.visits.filter(v => inRange(v.start) && v.level === 0 && !/HOME|WORK/.test(v.kind));
    const night = v => local(v.start).slice(0, 10) !== local(v.end).slice(0, 10) && hours(v) >= 5;
    vs = vs.filter(v => night(v) || hours(v) >= 25 / 60);
    // Nahe beieinander und direkt nacheinander: zusammenfassen
    const merged = [];
    for (const v of vs) {
      const last = merged[merged.length - 1];
      if (last && km(last, v) < 0.3 && ms(v.start) - ms(last.end) < 30 * 60000) { last.end = v.end > last.end ? v.end : last.end; continue; }
      merged.push({ ...v });
    }
    const items = merged.map(v => ({
      id: newId(), lat: v.lat, lng: v.lng, date: local(v.start), end: local(v.end), hours: hours(v),
      type: night(v) ? 'stellplatz' : 'sight', title: v.name || '', place: '', address: v.address || '', on: true,
    }));
    // Fähren und längere Rad- oder Fußtouren als eigene Einträge
    for (const a of tl.acts.filter(a => inRange(a.start) && a.from)) {
      const type = ACT_TYPE[a.type];
      // Spaziergänge in der Stadt nicht als Tour: erst ab 5 km
      if (!type || (type === 'wanderung' && a.meters < 5000)) continue;
      items.push({
        id: newId(), lat: a.from.lat, lng: a.from.lng, date: local(a.start), end: local(a.end), hours: (ms(a.end) - ms(a.start)) / 36e5,
        type, title: type === 'faehre' ? 'Fähre' : a.type === 'CYCLING' ? 'Radtour' : 'Wanderung', place: '', on: true,
        extra: type === 'faehre' ? { kind: 'Fähre' } : { mode: a.type === 'CYCLING' ? 'mit dem Rad' : 'zu Fuß', km: Math.round(a.meters / 100) / 10, hours: Math.round((ms(a.end) - ms(a.start)) / 36e4) / 10 },
      });
    }
    items.sort((a, b) => a.date.localeCompare(b.date));
    // Strecke im Zeitraum, vereinfacht auf höchstens 2000 Punkte
    const pts = tl.path.filter(p => p.d >= from && p.d <= to).map(p => [p.lat, p.lng]);
    // Gefahrene Kilometer wie Google sie zählt (Summe der Autofahrten); die Rohpunkte „zittern“ und ergäben zu viel
    const drive = tl.acts.filter(a => inRange(a.start) && /VEHICLE|DRIVING|CAR|MOTORCYCL/.test(a.type));
    let dist = drive.reduce((s, a) => s + a.meters / 1000, 0);
    if (!drive.length) for (let i = 1; i < pts.length; i++) dist += km({ lat: pts[i - 1][0], lng: pts[i - 1][1] }, { lat: pts[i][0], lng: pts[i][1] });
    const track = pts.length > 1 ? (app.simplifyTo ? app.simplifyTo(pts, 2000) : pts) : [];
    return { items, track, dist };
  }

  /* ---------- Ablauf: Datei → Zeitraum → Namen → Prüfen → Übernehmen ---------- */

  let tl = null, plan = null;

  // Knopf auf der Seite „Reisen“
  const reisen = VIEWS.reisen;
  VIEWS.reisen = () => reisen().replace('</header>', `</header><div class="btnrow import-row">
      <label class="ghost small-btn file">${icon('download')}Aus Google Maps importieren<input type="file" accept=".json,application/json" data-action="tl-file" hidden></label>
      <button class="link small" data-action="tl-help">Wie geht das?</button></div>`);

  ACTIONS['tl-help'] = () => openSheet(`<div>${sheetHead('Google-Maps-Zeitachse')}
      <p>So holt ihr eure Reise aus Google Maps:</p>
      <ol class="help-list">
        <li><b>Android:</b> Einstellungen → Standort → Standortdienste → Zeitachse → „Zeitachsendaten exportieren“.</li>
        <li><b>iPhone:</b> Google Maps → Profilbild → Einstellungen → Persönliche Inhalte → „Zeitachsendaten exportieren“.</li>
        <li>Die Datei (z. B. <code>Zeitachse.json</code>) hier mit „Aus Google Maps importieren“ auswählen.</li>
      </ol>
      <p class="sub">Die Datei wird nur auf diesem Gerät gelesen. Gespeichert werden nur die Orte und die Strecke, die ihr übernehmt. Ältere Exporte aus Google Takeout (Monatsdateien) funktionieren auch.</p></div>`);

  CHANGES['tl-file'] = async el => {
    const f = el.files[0];
    el.value = '';
    if (!f) return;
    openSheet(`<div>${sheetHead('Zeitachse wird gelesen …')}<p class="sub">${esc(f.name)}, ${Math.round(f.size / 1048576)} MB</p></div>`);
    try {
      tl = normalize(JSON.parse(await f.text()));
      rangeSheet();
    } catch (e) {
      openSheet(`<div>${sheetHead('Import nicht möglich')}<p class="hint">${esc(e instanceof SyntaxError ? 'Die Datei ist keine gültige JSON-Datei.' : e.message)}</p></div>`);
    }
  };

  function rangeSheet() {
    const days = [...new Set(tl.visits.map(v => local(v.start).slice(0, 10)))].sort();
    const first = days[0], last = days[days.length - 1];
    const sug = tl.memories.map(m => ({ from: local(m.start).slice(0, 10), to: local(m.end).slice(0, 10), km: m.km })).filter(m => m.to > m.from);
    const trips = S.trips.slice().sort((a, b) => (b.start || '').localeCompare(a.start || ''));
    openSheet(`<form data-form="tl-range" class="tl-form">${sheetHead('Reise aus der Zeitachse')}
      <p class="sub">Die Datei enthält Daten vom ${fmtDay(first)} bis ${fmtDay(last)}.</p>
      ${sug.length ? `<div class="field"><span>Von Google erkannte Reisen</span><div class="chips wrap">${sug.map(m =>
        `<button type="button" class="chip" data-action="tl-pick" data-from="${m.from}" data-to="${m.to}">${fmtDay(m.from)} – ${fmtDay(m.to)}${m.km ? ` · ${m.km} km weit weg` : ''}</button>`).join('')}</div></div>` : ''}
      <div class="row2">
        <label class="field"><span>Von</span><input type="date" name="from" min="${first}" max="${last}" value="${sug[0] ? sug[0].from : first}" required></label>
        <label class="field"><span>Bis</span><input type="date" name="to" min="${first}" max="${last}" value="${sug[0] ? sug[0].to : last}" required></label>
      </div>
      <label class="field"><span>Übernehmen in</span><select name="trip"><option value="">Neue Reise</option>${trips.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Name der neuen Reise</span><input name="name" placeholder="z. B. Schottland 2026"></label>
      <label class="check"><input type="checkbox" name="names" checked><span>Ortsnamen über OpenStreetMap suchen<small class="sub"> dauert etwa eine Sekunde pro Ort</small></span></label>
      <div class="sheet-foot"><button class="primary">Weiter</button></div></form>`);
  }
  ACTIONS['tl-pick'] = el => {
    const f = el.closest('form');
    f.from.value = el.dataset.from; f.to.value = el.dataset.to;
    f.querySelectorAll('[data-action=tl-pick]').forEach(b => b.classList.toggle('on', b === el));
  };

  FORMS['tl-range'] = async form => {
    const from = form.from.value, to = form.to.value;
    if (to < from) return toast('„Bis“ liegt vor „Von“.');
    const res = analyse(tl, from, to);
    if (!res.items.length && !res.track.length) return toast('In diesem Zeitraum gibt es keine Daten.');
    plan = { ...res, from, to, tripId: form.trip.value, name: form.name.value.trim() };
    if (form.names.checked) await lookupNames();
    reviewSheet();
  };

  // Ortsnamen nacheinander abfragen (Nominatim erlaubt eine Anfrage pro Sekunde)
  let stopNames = false;
  async function lookupNames() {
    stopNames = false;
    const todo = plan.items.filter(i => !i.title || !i.place);
    for (let n = 0; n < todo.length && !stopNames; n++) {
      const it = todo[n];
      openSheet(`<div>${sheetHead('Ortsnamen werden gesucht …')}<p>${n + 1} von ${todo.length}</p>
        <div class="progress"><span style="--p:${(n + 1) / todo.length}"></span></div>
        <div class="sheet-foot"><button class="ghost" data-action="tl-skip">Überspringen</button></div></div>`);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=de&lat=${it.lat}&lon=${it.lng}`);
        const j = await r.json(), a = j.address || {};
        const town = a.village || a.town || a.city || a.municipality || a.hamlet || a.county || '';
        // Stellplätze nach dem Platz benennen, wenn er einen Namen hat (z. B. „… Caravan Park“), sonst nach dem Ort
        const poi = j.name && j.name !== town && !/^\d/.test(j.name) ? j.name : '';
        it.place = town;
        it.title = it.title || poi || town;
        it.cc = (a.country_code || '').toUpperCase();
        if (/camp|caravan|holiday park|motorhome/i.test(poi)) it.type = 'stellplatz';
        else if (it.type === 'sight') it.type = guessType(j, it);
      } catch { /* ohne Netz: Name bleibt leer */ }
      if (n < todo.length - 1) await new Promise(r => setTimeout(r, 1100));
    }
  }
  ACTIONS['tl-skip'] = () => { stopNames = true; };

  // Art aus der OpenStreetMap-Kategorie ableiten
  function guessType(j, it) {
    const c = `${j.category || ''}:${j.type || ''}`;
    if (/museum|gallery/.test(c)) return 'museum';
    if (/restaurant|cafe|pub|bar|fast_food|ice_cream/.test(c)) return it.hours < 3 ? 'restaurant' : 'sight';
    if (/fuel/.test(c)) return 'tank';
    if (/supermarket|convenience|mall|shop/.test(c)) return 'einkauf';
    if (/beach|swimming|bathing/.test(c)) return 'baden';
    if (/playground|theme_park|zoo|water_park/.test(c)) return 'kinder';
    if (/camp_site|caravan_site/.test(c)) return 'stellplatz';
    return it.hours < 0.75 ? 'pause' : 'sight';
  }

  const TYPE_CHOICE = ['stellplatz', 'sight', 'museum', 'wanderung', 'baden', 'restaurant', 'kinder', 'pause', 'einkauf', 'tank', 'faehre', 'notiz'];
  function reviewSheet() {
    const byDay = {};
    plan.items.forEach(i => (byDay[i.date.slice(0, 10)] ||= []).push(i));
    const nights = plan.items.filter(i => i.type === 'stellplatz').length;
    openSheet(`<form data-form="tl-save" class="tl-form">${sheetHead('Prüfen und übernehmen')}
      <p class="sub">${plan.items.length} Orte, davon ${nights} Übernachtungen${plan.track.length ? `, Strecke ${fmtKm(plan.dist)}` : ''}. Abwählen, was nicht übernommen werden soll; Art und Name könnt ihr hier ändern.</p>
      ${Object.entries(byDay).map(([d, list]) => `<h3 class="date-head">${fmtDay(d)}</h3><ul class="tl-list">${list.map(i => `<li>
        <input type="checkbox" name="on" value="${i.id}"${i.on ? ' checked' : ''} aria-label="Übernehmen">
        <div><small>${i.date.slice(11, 16)} · ${i.hours >= 1 ? `${Math.round(i.hours * 10) / 10} Std.` : `${Math.round(i.hours * 60)} Min.`}${i.place && i.place !== i.title ? ` · ${esc(i.place)}` : ''}</small>
          <input name="title_${i.id}" value="${esc(i.title)}" placeholder="Name">
          <select name="type_${i.id}">${TYPE_CHOICE.map(k => `<option value="${k}"${k === i.type ? ' selected' : ''}>${TYPES[k].label}</option>`).join('')}</select></div>
      </li>`).join('')}</ul>`).join('')}
      ${plan.track.length ? `<label class="check"><input type="checkbox" name="track" checked><span>Strecke übernehmen (${fmtKm(plan.dist)})</span></label>` : ''}
      <div class="sheet-foot"><button class="primary">Übernehmen</button></div></form>`);
  }

  FORMS['tl-save'] = form => {
    const on = new Set([...form.querySelectorAll('[name=on]:checked')].map(c => c.value));
    let t = S.trips.find(x => x.id === plan.tripId);
    if (!t) {
      t = save('trips', { id: newId(), createdAt: Date.now(), archived: false, name: plan.name || `Reise ${fmtDay(plan.from)}`, start: plan.from, end: plan.to, color: nextColor(), ended: plan.to < app.today(), members: null, budget: 0 });
    }
    let n = 0;
    for (const i of plan.items) {
      if (!on.has(i.id)) continue;
      const type = form[`type_${i.id}`].value;
      save('entries', {
        id: newId(), tripId: t.id, by: me(), createdAt: Date.now(), type, title: form[`title_${i.id}`].value.trim(),
        date: i.date, place: i.place || '', text: '', lat: i.lat, lng: i.lng, acc: null, country: i.cc || '', rating: 0, features: [],
        cost: 0, extra: type === i.type ? i.extra || {} : {}, photos: [], source: 'google',
      });
      n++;
    }
    if (form.track && form.track.checked && plan.track.length) {
      save('tracks', { id: newId(), tripId: t.id, name: 'Google-Zeitachse', km: plan.dist, pts: app.encodePts(plan.track), createdAt: Date.now() });
    }
    setTrip(t.id);
    ui.diaryMode[t.id] = 'tagebuch';
    tl = null; plan = null;
    closeSheet();
    toast(`${n} Orte übernommen${form.track && form.track.checked ? ' und die Strecke' : ''}. Tipp: Jetzt „Fotos einsortieren“.`);
    go('tagebuch');
  };
}
