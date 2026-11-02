// Fotos nachträglich einsortieren: Aufnahmezeit und Ort aus den Fotos lesen (EXIF), zum passenden
// Eintrag der Reise vorschlagen oder neue Einträge anlegen. Alles läuft auf dem Handy.

export default function installFotos(app) {
  const {
    S, ACTIONS, FORMS, esc, icon, newId, save, toast, openSheet, closeSheet,
    fmtDay, km, hasPos, me, TYPES, shrink, placeInfo,
  } = app;
  const sheetHead = app.sheetHead;
  const tripById = id => S.trips.find(t => t.id === id);

  // Knopf in der Leiste über dem Tagebuch
  app.tripTools.push(() => ({ order: 3, action: 'photo-import', icon: 'camera', label: 'Fotos', title: 'Fotos aus der Galerie einsortieren' }));

  /* ---------- EXIF lesen (nur JPEG; Aufnahmezeit und GPS) ---------- */

  app.readExif = file => readExif(file);
  async function readExif(file) {
    try {
      const v = new DataView(await file.slice(0, 1024 * 1024).arrayBuffer());
      if (v.getUint16(0) !== 0xFFD8) return {};
      let o = 2;
      while (o + 10 < v.byteLength) {
        const marker = v.getUint16(o), len = v.getUint16(o + 2);
        if (marker === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) return parseTiff(v, o + 10);
        if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        o += 2 + len;
      }
    } catch { /* kaputte oder fremde Daten: ohne EXIF weiter */ }
    return {};
  }
  function parseTiff(v, t) {
    const le = v.getUint16(t) === 0x4949;
    const u16 = p => v.getUint16(p, le), u32 = p => v.getUint32(p, le);
    const ifd = off => {
      const out = {}, n = u16(t + off);
      for (let i = 0; i < n; i++) { const e = t + off + 2 + i * 12; out[u16(e)] = { count: u32(e + 4), at: e + 8 }; }
      return out;
    };
    const ascii = en => { const p = en.count > 4 ? t + u32(en.at) : en.at; let s = ''; for (let i = 0; i < en.count - 1; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
    const rat = (en, i) => { const p = t + u32(en.at) + i * 8; return u32(p) / u32(p + 4); };
    const res = {};
    const i0 = ifd(u32(t + 4));
    let dt = '';
    if (i0[0x8769]) { const ex = ifd(u32(i0[0x8769].at)); if (ex[0x9003]) dt = ascii(ex[0x9003]); }
    if (!dt && i0[0x0132]) dt = ascii(i0[0x0132]);
    if (/^\d{4}:\d\d:\d\d \d\d:\d\d/.test(dt)) res.date = dt.slice(0, 10).replace(/:/g, '-') + 'T' + dt.slice(11, 16);
    if (i0[0x8825]) {
      const g = ifd(u32(i0[0x8825].at));
      if (g[2] && g[4]) {
        const dms = en => rat(en, 0) + rat(en, 1) / 60 + rat(en, 2) / 3600;
        let lat = dms(g[2]), lng = dms(g[4]);
        if (g[1] && String.fromCharCode(v.getUint8(g[1].at)) === 'S') lat = -lat;
        if (g[3] && String.fromCharCode(v.getUint8(g[3].at)) === 'W') lng = -lng;
        if (isFinite(lat) && isFinite(lng) && (lat || lng)) { res.lat = lat; res.lng = lng; }
      }
    }
    return res;
  }
  const localStamp = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const minutes = (a, b) => Math.abs(new Date(a) - new Date(b)) / 60000;

  /* ---------- Vorschlag: passender Eintrag oder neu ---------- */

  // Passender Eintrag: mit Ort in der Nähe (1,5 km) innerhalb von 36 Stunden, sonst ein Eintrag ohne Ort vom selben
  // Tag innerhalb von 3 Stunden; jeweils der zeitlich nächste
  function suggest(ph, entries) {
    const dated = entries.filter(e => e.date);
    if (hasPos(ph)) {
      const near = dated.filter(e => (hasPos(e) ? km(ph, e) <= 1.5 && minutes(ph.date, e.date) <= 36 * 60
        : e.date.slice(0, 10) === ph.date.slice(0, 10) && minutes(ph.date, e.date) <= 180))
        .sort((a, b) => minutes(ph.date, a.date) - minutes(ph.date, b.date));
      return near[0] ? near[0].id : 'new';
    }
    const same = dated.filter(e => e.date.slice(0, 10) === ph.date.slice(0, 10) && minutes(ph.date, e.date) <= 180)
      .sort((a, b) => minutes(ph.date, a.date) - minutes(ph.date, b.date));
    return same[0] ? same[0].id : 'new';
  }

  let batch = null;
  ACTIONS['photo-import'] = el => {
    const t = tripById(el.dataset.id);
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = () => importFiles(t, [...input.files]);
    input.click();
  };
  // Auch für Fotos, die am PC auf das Tagebuch gezogen werden (eintragen.js)
  app.importPhotos = files => { const t = app.currentTrip(); if (t) importFiles(t, files); };
  async function importFiles(t, all) {
    const files = all.slice(0, 60);
    if (!files.length) return;
    openSheet(`<div>${sheetHead('Fotos einsortieren')}<p class="sub">${files.length} Fotos werden gelesen …</p></div>`);
    const entries = S.entries.filter(e => e.tripId === t.id);
    const photos = [];
    for (const file of files) {
      const ex = await readExif(file);
      let thumb = '';
      try { thumb = await shrink(file, 360, 0.7); } catch { continue; }   // Format, das der Browser nicht lesen kann
      const ph = { file, thumb, date: ex.date || localStamp(file.lastModified), exactTime: !!ex.date, lat: ex.lat, lng: ex.lng };
      ph.target = suggest(ph, entries);
      photos.push(ph);
    }
    photos.sort((a, b) => a.date.localeCompare(b.date));
    // Fotos ohne passenden Eintrag gleich zu neuen Einträgen zusammenfassen (in der Liste änderbar)
    const groups = [];
    photos.filter(ph => ph.target === 'new').forEach(ph => {
      const g = groups[groups.length - 1];
      if (g && fits(g, ph)) g.push(ph); else groups.push([ph]);
      ph.target = 'n' + groups.length;
    });
    batch = { t, photos, groups: groups.length };
    showBatch();
  }

  // Gehört ein Foto noch zur Gruppe davor? Bis 2 Stunden nach dem letzten Foto und höchstens 3 km entfernt,
  // oder am selben Tag fast an derselben Stelle (300 m), z. B. den ganzen Nachmittag am Strand
  function fits(g, ph) {
    const last = g[g.length - 1], gap = minutes(last.date, ph.date);
    const at = [...g].reverse().find(hasPos);
    if (!hasPos(ph) || !at) return gap <= 120;
    const d = km(at, ph);
    return (gap <= 120 && d <= 3) || (last.date.slice(0, 10) === ph.date.slice(0, 10) && d <= 0.3);
  }
  app.suggestEntry = ph => suggest(ph, S.entries.filter(e => e.tripId === (app.currentTrip() || {}).id));

  function showBatch() {
    const { t, photos } = batch;
    const entries = S.entries.filter(e => e.tripId === t.id && e.date).sort((a, b) => a.date.localeCompare(b.date));
    // Neue Einträge mit Uhrzeit des ersten Fotos benennen; einer mehr zur Auswahl, um Fotos abzutrennen
    const firstOf = n => photos.find(ph => ph.target === 'n' + n);
    const news = Array.from({ length: batch.groups + 1 }, (_, i) => i + 1);
    const newLabel = n => { const f = firstOf(n); return `Neuer Eintrag ${n}${f ? ` (${f.date.slice(11, 16)} Uhr)` : ''}`; };
    const label = e => `${fmtDay(e.date.slice(0, 10))}, ${e.date.slice(11, 16)}: ${e.title || TYPES[e.type].label}`;
    const withGps = photos.filter(hasPos).length;
    openSheet(`<form data-form="photo-import" class="photo-import">${sheetHead('Fotos einsortieren')}
      <p class="sub">${photos.length} Fotos, ${withGps ? `${withGps} mit Ort` : 'keins mit Ort'}. LAMMping schlägt anhand von Aufnahmezeit${withGps ? ' und Ort' : ''} den passenden Eintrag vor. Fotos ohne passenden Eintrag werden zu neuen Einträgen zusammengefasst.</p>
      ${withGps < photos.length ? '<p class="sub">Manche Handys entfernen den Ort beim Auswählen der Fotos. Dann zählt nur die Aufnahmezeit.</p>' : ''}
      ${photos.length > 1 ? '<button type="button" class="ghost small-btn" data-action="photo-import-one">Alle in einen neuen Eintrag</button>' : ''}
      <ul class="import-list">${photos.map((ph, i) => `<li>
        <img src="${ph.thumb}" alt="">
        <div><small>${fmtDay(ph.date.slice(0, 10))}, ${ph.date.slice(11, 16)}${ph.exactTime ? '' : ' (Dateidatum)'}${hasPos(ph) ? ' · mit Ort' : ''}</small>
          <select name="to${i}">
            ${news.map(n => `<option value="n${n}"${ph.target === 'n' + n ? ' selected' : ''}>${newLabel(n)}</option>`).join('')}
            ${entries.map(e => `<option value="${e.id}"${ph.target === e.id ? ' selected' : ''}>${esc(label(e))}</option>`).join('')}
            <option value="skip">Nicht übernehmen</option>
          </select></div></li>`).join('')}</ul>
      <div class="sheet-foot"><button class="primary">Übernehmen</button></div></form>`);
  }

  ACTIONS['photo-import-one'] = el => {
    el.closest('form').querySelectorAll('.import-list select').forEach(s => { if (s.value !== 'skip') s.value = 'n1'; });
    toast('Alle Fotos kommen in einen neuen Eintrag');
  };
  FORMS['photo-import'] = async form => {
    const { t, photos } = batch;
    const btn = form.querySelector('button.primary');
    btn.disabled = true; btn.textContent = 'Wird gespeichert …';
    photos.forEach((ph, i) => { ph.to = form[`to${i}`].value; });
    // Neue Einträge: so, wie es in der Liste gewählt ist (Neuer Eintrag 1, 2, …)
    const byNew = {};
    photos.filter(ph => /^n\d+$/.test(ph.to)).forEach(ph => { (byNew[ph.to] ||= []).push(ph); });
    const groups = Object.values(byNew);
    const add = {};          // Eintrag → neue Fotos
    const stored = async ph => {
      const id = newId();
      save('photos', { id, entryId: ph.entry, tripId: t.id, data: await shrink(ph.file, 1920, 0.78) });
      return { id, thumb: ph.thumb, ...app.photoGeo({ lat: ph.lat, lng: ph.lng, date: ph.exactTime ? ph.date : '' }) };
    };
    let created = 0, assigned = 0;
    for (const g of groups) {
      const at = g.find(hasPos);
      const info = at ? await placeInfo(at) : { name: '', cc: '', poi: '' };
      const e = {
        id: newId(), tripId: t.id, by: me(), createdAt: Date.now(), type: 'sight',
        title: info.poi || (info.name ? `Fotos aus ${info.name}` : 'Fotos'), date: g[0].date, place: info.name || '', text: '',
        lat: at ? at.lat : null, lng: at ? at.lng : null, acc: null, country: info.cc || '', rating: 0, features: [], cost: 0, extra: {}, photos: [],
      };
      g.forEach(ph => { ph.entry = e.id; });
      e.photos = await Promise.all(g.map(stored));
      save('entries', e);
      created++;
    }
    for (const ph of photos.filter(p => !/^n\d+$/.test(p.to) && p.to !== 'skip')) {
      ph.entry = ph.to;
      (add[ph.to] ||= []).push(await stored(ph));
      assigned++;
    }
    Object.entries(add).forEach(([id, list]) => {
      const e = S.entries.find(x => x.id === id);
      if (e) save('entries', { ...e, photos: [...(e.photos || []), ...list] });
    });
    batch = null;
    closeSheet();
    app.checkTripRange(t.id, photos.filter(p => p.to !== 'skip').map(p => p.date));
    toast([assigned ? `${assigned} Fotos zugeordnet` : '', created ? (created === 1 ? '1 neuer Eintrag' : `${created} neue Einträge`) : ''].filter(Boolean).join(', ') || 'Nichts übernommen');
  };
}
