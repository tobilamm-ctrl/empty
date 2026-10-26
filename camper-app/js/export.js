// Reise beenden und exportieren: GPX-Datei (Strecke, Stopps, geplante Route) und ein druckfertiges
// Reiseheft mit Streckenkarte, Etappen und Notizen, das der Browser als PDF speichert.

export default function installExport(app) {
  const {
    S, ACTIONS, FORMS, esc, icon, save, toast, openSheet, closeSheet,
    today, fmtDay, fmtShort, fmtTime, fmtRange, km, fmtKm, hasPos, byDate, money,
    currentTrip, tripColor, tripStats, canCash, TYPES, extraText,
  } = app;
  const sheetHead = app.sheetHead;
  const tripById = id => S.trips.find(t => t.id === id);
  const started = (t, st) => st.es.length > 0 || (t.start && t.start <= today());

  /* ---------- Leiste im Tagebuch: beenden und exportieren ---------- */

  // Werkzeugleiste über dem Tagebuch: Module melden ihre Knöpfe an (Reihenfolge über „order“).
  // Nur Symbole mit kurzem Wort darunter, die Knöpfe teilen sich die Breite.
  app.tripTools = [];
  app.tripBar = (t, st) => {
    const tools = app.tripTools.map(f => f(t, st)).filter(Boolean).sort((a, b) => a.order - b.order);
    return `${t.ended ? `<p class="trip-ended">${icon('flag')}Reise beendet${t.end ? ` am ${fmtShort(t.end)}` : ''}${t.archived ? ', im Archiv' : ''}.</p>` : ''}
      <div class="trip-tools">${tools.map(x => `<button class="tool${x.main ? ' main' : ''}" data-action="${x.action}" data-id="${t.id}" title="${x.title || x.label}" aria-label="${x.title || x.label}">
        ${icon(x.icon)}<small>${x.label}</small></button>`).join('')}</div>`;
  };
  app.tripTools.push(
    (t, st) => (!t.ended && !started(t, st) ? { order: 1, action: 'trip-start', icon: 'play', label: 'Starten', title: 'Reise starten', main: true } : null),
    (t, st) => (!t.ended && started(t, st) ? { order: 1, action: 'trip-end', icon: 'flag', label: 'Beenden', title: 'Reise beenden' } : null),
    t => (t.ended ? { order: 1, action: 'trip-resume', icon: 'undo', label: 'Weiter', title: 'Reise fortsetzen (wieder aufnehmen)' } : null),
    () => ({ order: 5, action: 'export-form', icon: 'download', label: 'Export', title: 'Als GPX oder Reiseheft (PDF) exportieren' }),
    t => (t.ended && !t.archived ? { order: 7, action: 'trip-archive', icon: 'archive', label: 'Archiv', title: 'Ins Archiv legen' } : null),
  );

  ACTIONS['trip-start'] = el => {
    const t = tripById(el.dataset.id);
    if (!t) return;
    const start = !t.start || t.start > today() ? today() : t.start;
    save('trips', { ...t, start, end: t.end && t.end < start ? '' : t.end, ended: false });
    app.setTrip(t.id);
    app.ui.diaryMode[t.id] = 'tagebuch';
    toast(`Gute Fahrt! „${t.name}“ läuft ab heute.`);
  };

  ACTIONS['trip-end'] = el => {
    const t = tripById(el.dataset.id);
    if (!t || !confirm(`„${t.name}“ beenden? Das Ende wird auf heute gesetzt, falls kein früheres eingetragen ist. Ins Archiv kommt die Reise erst, wenn ihr das extra wählt.`)) return;
    save('trips', { ...t, ended: true, end: t.end && t.end <= today() ? t.end : today() });
    toast('Reise beendet. Willkommen zu Hause!');
  };
  ACTIONS['trip-resume'] = el => {
    const t = tripById(el.dataset.id);
    if (t) save('trips', { ...t, ended: false, end: t.end === today() ? '' : t.end });
  };
  ACTIONS['trip-archive'] = el => {
    const t = tripById(el.dataset.id);
    if (t && confirm(`„${t.name}“ ins Archiv legen? Ihr findet sie unter Mehr → Reisen.`)) save('trips', { ...t, archived: true });
  };

  ACTIONS['export-form'] = el => {
    const t = tripById(el.dataset.id) || currentTrip();
    const hasPhotos = S.entries.some(e => e.tripId === t.id && (e.photos || []).length);
    openSheet(`<form data-form="export-pdf" data-id="${t.id}">${sheetHead('Reise exportieren')}
      <h3 class="date-head">GPX-Datei</h3>
      <p class="sub">Für Navi, OsmAnd, Komoot oder Google Earth: gefahrene Strecke, alle Stopps als Wegpunkte und die geplante Route.</p>
      <button type="button" class="ghost" data-action="export-gpx" data-id="${t.id}">${icon('download')}GPX herunterladen</button>
      <h3 class="date-head">Reiseheft als PDF</h3>
      <p class="sub">Streckenplan, Etappen Tag für Tag und eure Notizen. Im Druckfenster „Als PDF speichern“ wählen.</p>
      ${hasPhotos ? '<label class="check"><input type="checkbox" name="photos" checked><span>Fotos (klein) mit aufnehmen</span></label>' : ''}
      ${canCash() ? '<label class="check"><input type="checkbox" name="cost"><span>Kosten mit aufnehmen</span></label>' : ''}
      <div class="sheet-foot"><button class="primary">${icon('print')}PDF erstellen</button></div></form>`);
  };

  /* ---------- GPX ---------- */

  const x = s => String(s ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
  const iso = d => { const v = new Date(d); return isNaN(v) ? '' : v.toISOString(); };
  const slug = s => (s || 'reise').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
    .replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'reise';
  const tracksOf = t => S.tracks.filter(k => k.tripId === t.id).map(k => ({ ...k, line: app.decodePts(k.pts) }));
  const plannedOf = t => S.places.filter(p => p.tripId === t.id && !p.done && hasPos(p))
    .sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9') || (a.createdAt || 0) - (b.createdAt || 0));

  function gpx(t) {
    const st = tripStats(t);
    const tracks = tracksOf(t);
    const pt = (tag, p, inner = '') => `<${tag} lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">${inner}</${tag}>`;
    const wpts = st.stops.map(e => pt('wpt', e, [
      e.date ? `<time>${iso(e.date)}</time>` : '',
      `<name>${x(e.title || e.place || TYPES[e.type].label)}</name>`,
      `<desc>${x([e.place, extraText(e), e.text].filter(Boolean).join(' – '))}</desc>`,
      `<type>${x(TYPES[e.type].label)}</type>`,
    ].join(''))).join('\n');
    const drive = tracks.filter(k => k.kind !== 'hike');
    const trk = (name, line, type) => `<trk><name>${x(name)}</name>${type ? `<type>${type}</type>` : ''}<trkseg>${line.map(([la, ln]) => `<trkpt lat="${la}" lon="${ln}"/>`).join('')}</trkseg></trk>`;
    const trks = [
      ...(drive.length ? drive.map(k => trk(k.name || t.name, k.line, 'Fahrt'))
        : st.stops.length > 1 ? [trk(`${t.name} (Stopps verbunden)`, st.stops.map(e => [e.lat.toFixed(6), e.lng.toFixed(6)]), 'Fahrt')] : []),
      ...tracks.filter(k => k.kind === 'hike').map(k => trk(k.name || 'Wanderung', k.line, 'Wanderung')),
    ].join('\n');
    const plan = plannedOf(t);
    const rte = plan.length ? `<rte><name>${x(t.name)}: geplant</name>${plan.map(p => pt('rtept', p, `<name>${x(p.name)}</name>${p.note ? `<desc>${x(p.note)}</desc>` : ''}`)).join('')}</rte>` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LAMMping" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${x(t.name)}</name><desc>${x(fmtRange(t))}</desc><time>${new Date().toISOString()}</time></metadata>
${wpts}
${rte}
${trks}
</gpx>
`;
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  ACTIONS['export-gpx'] = el => {
    const t = tripById(el.dataset.id);
    const st = tripStats(t);
    if (!st.stops.length && !S.tracks.some(k => k.tripId === t.id) && !plannedOf(t).length) return toast('Diese Reise hat noch keine Orte mit Position.');
    download(`${slug(t.name)}.gpx`, gpx(t), 'application/gpx+xml');
    toast('GPX-Datei wird heruntergeladen');
  };

  /* ---------- Reiseheft (Drucken → PDF) ---------- */

  // Streckenkarte: OpenStreetMap-Kacheln werden vorab zu einem Bild zusammengesetzt (doppelte Auflösung für den Druck),
  // darüber liegt die Strecke als SVG. So ist die Karte sicher geladen, bevor das Druckfenster aufgeht.
  const proj = (la, ln, z) => {
    const s = 256 * 2 ** z, r = Math.max(-85, Math.min(85, la)) * Math.PI / 180;
    return [(ln + 180) / 360 * s, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * s];
  };
  // Zoomstufe und Ausschnitt so wählen, dass alle Punkte mit etwas Rand hineinpassen
  function fit(all, W, H) {
    const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
    const n = Math.max(...lats), s = Math.min(...lats), e = Math.max(...lngs), w = Math.min(...lngs);
    let z = 15;
    while (z > 2) {
      const [x1, y1] = proj(n, w, z), [x2, y2] = proj(s, e, z);
      if (x2 - x1 <= W - 60 && y2 - y1 <= H - 60) break;
      z--;
    }
    if (all.length === 1) z = 11;
    const [cx1, cy1] = proj(n, w, z), [cx2, cy2] = proj(s, e, z);
    return { z, left: (cx1 + cx2) / 2 - W / 2, top: (cy1 + cy2) / 2 - H / 2 };
  }

  async function staticMap(lines, marks, color, W = 680, H = 400) {
    const all = [...lines.flatMap(l => l.pts), ...marks.map(m => [m.lat, m.lng])];
    if (!all.length) return '';
    const { z, left, top } = fit(all, W, H);
    const base = await baseMap(z, left, top, W, H);
    const xy = (la, ln) => { const [px, py] = proj(la, ln, z); return [(px - left).toFixed(1), (py - top).toFixed(1)]; };
    const poly = (line, style) => `<polyline points="${line.map(p => xy(p[0], p[1]).join(',')).join(' ')}" ${style}/>`;
    const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${lines.map(l => poly(l.pts, l.hike ? `fill="none" stroke="#2F8F4E" stroke-width="3" stroke-dasharray="6 5"` : l.plan ? `fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"` : `fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><polyline points="${l.pts.map(p => xy(p[0], p[1]).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`)).join('')}
      ${marks.map(m => { const [mx, my] = xy(m.lat, m.lng); return m.label
        ? `<circle cx="${mx}" cy="${my}" r="10" fill="${m.plan ? '#fff' : color}" stroke="${m.plan ? color : '#fff'}" stroke-width="2.5"/><text x="${mx}" y="${(+my + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${m.plan ? color : '#fff'}">${m.label}</text>`
        : `<circle cx="${mx}" cy="${my}" r="4" fill="#fff" stroke="${color}" stroke-width="2"/>`; }).join('')}
    </svg>`;
    return `<div class="pd-map" style="width:${W}px;height:${H}px">${base ? `<img class="pd-base" src="${base}" alt="">` : '<p class="pd-nomap">Kartenhintergrund nicht verfügbar (kein Internet?)</p>'}${svg}<small>Karte © OpenStreetMap-Mitwirkende</small></div>`;
  }

  async function baseMap(z, left, top, W, H) {
    const { cv, ok } = await tileCanvas(z, left, top, W, H);
    if (!ok) return '';
    try { return cv.toDataURL('image/jpeg', 0.86); } catch { return ''; }
  }

  async function tileCanvas(z, left, top, W, H) {
    const k = z < 18 ? 2 : 1;                // eine Zoomstufe feiner = doppelte Auflösung
    const zz = z + (k === 2 ? 1 : 0), L = left * k, T = top * k, max = 2 ** zz;
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = H * k;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, cv.width, cv.height);
    const jobs = [];
    for (let tx = Math.floor(L / 256); tx <= Math.floor((L + W * k) / 256); tx++) {
      for (let ty = Math.floor(T / 256); ty <= Math.floor((T + H * k) / 256); ty++) {
        if (ty < 0 || ty >= max) continue;
        const url = `https://tile.openstreetmap.org/${zz}/${((tx % max) + max) % max}/${ty}.png`;
        jobs.push(fetch(url, { mode: 'cors' }).then(r => r.ok ? r.blob() : Promise.reject())
          .then(b => createImageBitmap(b)).then(img => { ctx.drawImage(img, Math.round(tx * 256 - L), Math.round(ty * 256 - T)); return 1; })
          .catch(() => 0));
      }
    }
    const ok = (await Promise.all(jobs)).reduce((a, b) => a + b, 0);
    return { cv, ok, k };
  }

  // Karte mit Strecke als Bild (für die Postkarte)
  app.routeCanvas = async (t, W, H) => {
    const { lines, marks, color } = mapData(t);
    const all = [...lines.filter(l => !l.plan).flatMap(l => l.pts), ...marks.filter(m => !m.plan).map(m => [m.lat, m.lng])];
    if (!all.length) return null;
    const { z, left, top } = fit(all, W, H);
    const { cv, k } = await tileCanvas(z, left, top, W, H);
    const ctx = cv.getContext('2d');
    const xy = (la, ln) => { const [px, py] = proj(la, ln, z); return [(px - left) * k, (py - top) * k]; };
    ctx.lineJoin = ctx.lineCap = 'round';
    lines.filter(l => !l.plan).forEach(l => {
      [['#fff', 9], [l.hike ? '#2F8F4E' : color, 5]].forEach(([c, w]) => {
        ctx.beginPath(); ctx.strokeStyle = c; ctx.lineWidth = w * k;
        l.pts.forEach((p, i) => { const [x, y] = xy(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      });
    });
    marks.filter(m => m.label && !m.plan).forEach(m => {
      const [x, y] = xy(m.lat, m.lng);
      ctx.beginPath(); ctx.arc(x, y, 7 * k, 0, 7); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 2.5 * k; ctx.strokeStyle = '#fff'; ctx.stroke();
    });
    return cv;
  };

  // Etappen: je Tag die Einträge, Start- und Zielort und die Luftlinie seit dem letzten Ort des Vortags
  function stages(t, st) {
    const days = {};
    st.es.slice().sort(byDate).forEach(e => (days[e.date.slice(0, 10)] ||= []).push(e));
    let last = null;
    const no = new Map();                  // Nummer je Stellplatz, gleich wie auf der Karte
    st.es.filter(e => e.type === 'stellplatz').sort(byDate).forEach((e, i) => no.set(e.id, i + 1));
    const list = Object.entries(days).map(([day, es]) => {
      const from = last;
      let dist = 0, prev = last;
      es.filter(hasPos).forEach(e => { if (prev) dist += km(prev, e); prev = e; });
      const nights = es.filter(e => e.type === 'stellplatz');
      const to = nights[nights.length - 1] || null;
      if (prev) last = prev;
      const n = st.firstDay ? Math.round((new Date(day + 'T12:00') - new Date(st.firstDay + 'T12:00')) / 864e5) + 1 : 0;
      return { day, n, es, from, to, dist };
    });
    return { list, no };
  }
  const placeName = e => e && (e.place || e.title) || '';

  function mapData(t) {
    const st = tripStats(t);
    const color = tripColor(t);
    const { no } = stages(t, st);
    const tracks = tracksOf(t);
    const drive = tracks.filter(k => k.kind !== 'hike');
    const plan = plannedOf(t);
    const lines = [
      ...(drive.length ? drive.map(k => ({ pts: k.line })) : st.stops.length > 1 ? [{ pts: st.stops.map(e => [e.lat, e.lng]) }] : []),
      ...tracks.filter(k => k.kind === 'hike').map(k => ({ pts: k.line, hike: true })),
      ...(plan.length ? [{ pts: [...(st.stops.length ? [st.stops[st.stops.length - 1]] : []), ...plan].map(p => [p.lat, p.lng]), plan: true }] : []),
    ];
    const marks = [
      ...st.stops.filter(e => e.type !== 'stellplatz').map(e => ({ lat: e.lat, lng: e.lng })),
      ...st.stops.filter(e => e.type === 'stellplatz').map(e => ({ lat: e.lat, lng: e.lng, label: no.get(e.id) })),
      ...plan.map((p, i) => ({ lat: p.lat, lng: p.lng, label: String.fromCharCode(65 + (i % 26)), plan: true })),
    ];
    return { lines, marks, color, plan };
  }

  async function bookHtml(t, opt) {
    const st = tripStats(t);
    const { list: sts, no } = stages(t, st);
    const { lines, marks, color, plan } = mapData(t);
    const countries = (app.tripCountries ? app.tripCountries(t) : []).map(cc => `${app.flag(cc)} ${esc((app.COUNTRIES[cc] || {}).name || cc)}`).join(', ');
    const cost = opt.cost ? S.expenses.filter(x => x.tripId === t.id && x.cat !== app.SETTLE) : [];
    const byCat = {};
    cost.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + (x.amount || 0); });

    const facts = [
      ['Zeitraum', fmtRange(t)], st.days ? ['Tage', st.days] : null, ['Stellplätze', st.nights],
      st.dist ? [st.driven ? 'Gefahren' : 'Strecke (Luftlinie)', fmtKm(st.dist)] : null,
      countries ? ['Länder', countries] : null, opt.cost && cost.length ? ['Kosten', money(st.cost)] : null,
    ].filter(Boolean);

    const entry = e => `<div class="pd-entry pd-${e.type}">
      <span class="pd-time">${fmtTime(e.date)}</span>
      <div><b>${no.has(e.id) ? `<span class="pd-no" style="--c:${color}">${no.get(e.id)}</span>` : ''}${esc(e.title || (e.type === 'notiz' ? 'Notiz' : TYPES[e.type].label))}</b>
        <span class="pd-type">${esc(TYPES[e.type].label)}${e.place && e.place !== e.title ? `, ${esc(e.place)}` : ''}${e.rating ? ` ${'★'.repeat(e.rating)}` : ''}${extraText(e) ? `, ${esc(extraText(e))}` : ''}${opt.cost && e.cost ? `, ${money(e.cost)}` : ''}</span>
        ${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}
        ${opt.photos && (e.photos || []).length ? `<div class="pd-photos">${e.photos.slice(0, 4).map(p => `<img src="${p.thumb}" alt="">`).join('')}</div>` : ''}
      </div></div>`;

    return `<article class="pd">
      <header class="pd-head" style="--c:${color}">
        <svg class="pd-sheep" aria-hidden="true"><use href="#schaf"/></svg>
        <div><h1>${esc(t.name)}</h1><p>${esc(fmtRange(t))}</p></div>
      </header>
      <dl class="pd-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${typeof v === 'string' && v.includes('<') ? v : esc(v)}</dd></div>`).join('')}</dl>
      ${await staticMap(lines, marks, color)}
      ${sts.length ? `<h2>Etappen</h2>
      <table class="pd-stages"><thead><tr><th>Tag</th><th>Datum</th><th>Von</th><th>Nach</th><th>Luftlinie</th></tr></thead><tbody>
        ${sts.map(s => `<tr><td>${s.n > 0 ? s.n : ''}</td><td>${fmtDay(s.day)}</td><td>${esc(placeName(s.from)) || '–'}</td>
          <td>${s.to ? `<span class="pd-no" style="--c:${color}">${no.get(s.to.id)}</span>${esc(placeName(s.to))}` : '–'}</td><td>${s.dist >= 1 ? fmtKm(s.dist) : '–'}</td></tr>`).join('')}
      </tbody></table>` : ''}
      ${sts.length ? `<h2>Tag für Tag</h2>${sts.map(s => `<section class="pd-day"><h3>${s.n > 0 ? `Tag ${s.n} · ` : ''}${fmtDay(s.day)}</h3>${app.dayHighlights ? app.dayHighlights(t, s.day, true) : ''}${s.es.map(entry).join('')}</section>`).join('')}` : ''}
      ${plan.length || S.places.some(p => p.tripId === t.id && !p.done && !hasPos(p)) ? `<h2>Geplant</h2><ol class="pd-plan" type="A">${S.places.filter(p => p.tripId === t.id && !p.done)
        .sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9')).map(p => `<li><b>${esc(p.name)}</b>${p.planDate ? `, ${fmtDay(p.planDate)}` : ''}${p.place ? `, ${esc(p.place)}` : ''}${p.note ? `<br><span>${esc(p.note)}</span>` : ''}</li>`).join('')}</ol>` : ''}
      ${opt.cost && cost.length ? `<h2>Kosten</h2><table class="pd-cost">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td>${money(v)}</td></tr>`).join('')}
        <tr class="sum"><td>Gesamt</td><td>${money(st.cost)}</td></tr></table>` : ''}
      <footer>Erstellt mit LAMMping am ${fmtShort(today())}</footer>
    </article>`;
  }

  FORMS['export-pdf'] = async form => {
    const t = tripById(form.dataset.id);
    const opt = { photos: !!(form.photos && form.photos.checked), cost: !!(form.cost && form.cost.checked) };
    closeSheet();
    toast('Reiseheft wird vorbereitet …');
    printHtml(await bookHtml(t, opt), t.name);
  };

  // Druckt fertiges HTML über #printDoc; der Titel wird zum Dateinamen des PDFs
  async function printHtml(html, title) {
    let doc = document.getElementById('printDoc');
    if (!doc) { doc = document.createElement('div'); doc.id = 'printDoc'; document.body.appendChild(doc); }
    doc.innerHTML = html;
    document.body.classList.add('printing');
    // Bilder sofort laden (nicht erst, wenn sie ins Bild kommen) und höchstens 8 Sekunden warten
    doc.querySelectorAll('img[loading=lazy]').forEach(img => { img.loading = 'eager'; });
    await Promise.race([Promise.all([...doc.querySelectorAll('img')].map(img => img.decode().catch(() => {}))), new Promise(r => setTimeout(r, 8000))]);
    const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    const old = document.title;
    document.title = title;
    window.print();
    setTimeout(() => { document.title = old; }, 1000);
  }
  app.printHtml = printHtml;

  app.exportGpx = gpx;
}
