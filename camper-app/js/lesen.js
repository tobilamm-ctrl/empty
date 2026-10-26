// Tagebuch ansehen: Reihenfolge umschalten, Sprungleiste „Tag 1 · Tag 2 …“, kleine Tageskarte unter jedem Tag,
// Kalender mit allen Reisetagen und das Tagebuch als Buch zum Blättern.

export default function installLesen(app) {
  const { S, LS, ui, VIEWS, ACTIONS, esc, icon, pageHead, render, go, currentTrip, tripStats, tripColor, tripEntries, byDate,
    fmtDay, fmtTime, fmtRange, today, TYPES, money, fmtKm, sortTrips } = app;

  const dayNo = (st, d) => (st.firstDay ? Math.round((new Date(d + 'T12:00') - new Date(st.firstDay + 'T12:00')) / 864e5) + 1 : 0);
  const withPos = e => e && typeof e.lat === 'number' && typeof e.lng === 'number';
  const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const topOffset = () => ((document.querySelector('.topbar') || {}).offsetHeight || 0) + 54;

  /* ====================================================================== */
  /* Werkzeugleiste im Tagebuch: Sprungleiste, Reihenfolge, Kalender, Buch    */
  /* ====================================================================== */

  app.diaryTools = (t, st, days) => {
    const newest = LS.get('diaryOrder', 'neu') !== 'alt';
    const maps = LS.get('dayMaps', true) !== false;
    // Sprungleiste nicht einpacken, sonst bleibt sie beim Scrollen nicht oben stehen
    return `<div class="diary-btns">
        <button class="chip" data-action="diary-order" title="Reihenfolge umschalten">${newest ? '↓ Neueste oben' : '↑ Ab Tag 1'}</button>
        <button class="chip${maps ? ' on' : ''}" data-action="day-maps" aria-pressed="${maps}">🗺️ Tageskarten</button>
        <a class="chip" href="#/kalender">📅 Kalender</a>
        <a class="chip" href="#/buch">📖 Als Buch</a>
      </div>
      ${days.length > 1 ? `<nav class="day-jump" data-noswipe aria-label="Zu einem Tag springen">${days.map(d => {
        const n = dayNo(st, d);
        return `<button data-action="day-jump" data-day="${d}" title="${esc(fmtDay(d))}">${n > 0 ? `Tag ${n}` : fmtDay(d).split(',')[1] || d}</button>`;
      }).join('')}</nav>` : ''}`;
  };
  ACTIONS['diary-order'] = () => { LS.set('diaryOrder', LS.get('diaryOrder', 'neu') === 'alt' ? 'neu' : 'alt'); render(); window.scrollTo(0, 0); };
  ACTIONS['day-maps'] = () => { LS.set('dayMaps', LS.get('dayMaps', true) === false); render(); };
  function jumpTo(d) {
    const el = document.getElementById('day-' + d);
    if (!el) return false;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - topOffset(), behavior: 'smooth' });
    return true;
  }
  ACTIONS['day-jump'] = el => jumpTo(el.dataset.day);
  // Beim Scrollen den sichtbaren Tag in der Sprungleiste markieren
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking || ui.route !== 'tagebuch') return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const bar = document.querySelector('.day-jump');
      if (!bar) return;
      const y = topOffset() + 40;
      const days = [...document.querySelectorAll('.timeline > li.day')];
      const cur = days.filter(li => li.getBoundingClientRect().top <= y).pop() || days[0];
      if (!cur) return;
      bar.querySelectorAll('button').forEach(b => {
        const on = b.dataset.day === cur.dataset.day;
        // Nur die Leiste waagerecht verschieben (scrollIntoView würde das Scrollen der Seite abbrechen)
        if (on && !b.classList.contains('on')) bar.scrollTo({ left: b.offsetLeft - bar.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
        b.classList.toggle('on', on);
      });
    });
  }, { passive: true });
  // Sprung aus dem Kalender oder dem Buch, sobald das Tagebuch gezeichnet ist
  let pendingDay = null;
  app.afterDraw.push(() => {
    if (pendingDay && ui.route === 'tagebuch') { const d = pendingDay; pendingDay = null; setTimeout(() => jumpTo(d), 60); }
  });

  /* ====================================================================== */
  /* Kleine Tageskarte (OpenStreetMap-Kacheln als Bild, ohne Kartenprogramm)  */
  /* ====================================================================== */

  const W = 600, H = 170;
  const proj = (p, z) => {
    const n = 256 * 2 ** z, s = Math.sin(p.lat * Math.PI / 180);
    return { x: (p.lng + 180) / 360 * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
  };
  function staticMap(pts, color, from) {
    const all = from ? [from, ...pts] : pts;
    let z = 15;
    for (; z > 3; z--) {
      const xy = all.map(p => proj(p, z));
      const w = Math.max(...xy.map(q => q.x)) - Math.min(...xy.map(q => q.x)), h = Math.max(...xy.map(q => q.y)) - Math.min(...xy.map(q => q.y));
      if (w <= W - 70 && h <= H - 50) break;
    }
    if (all.length === 1) z = 13;
    const xy = all.map(p => proj(p, z));
    const cx = (Math.max(...xy.map(q => q.x)) + Math.min(...xy.map(q => q.x))) / 2, cy = (Math.max(...xy.map(q => q.y)) + Math.min(...xy.map(q => q.y))) / 2;
    const ox = cx - W / 2, oy = cy - H / 2, n = 2 ** z;
    const tiles = [];
    for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + W) / 256); tx++) {
      for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + H) / 256); ty++) {
        if (ty < 0 || ty >= n) continue;
        tiles.push(`<image data-href="https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png" x="${(tx * 256 - ox).toFixed(1)}" y="${(ty * 256 - oy).toFixed(1)}" width="256" height="256"/>`);
      }
    }
    const P = xy.map(q => [(q.x - ox).toFixed(1), (q.y - oy).toFixed(1)]);
    const day = from ? P.slice(1) : P;
    const line = day.length > 1 ? `<polyline points="${day.map(q => q.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${day.map(q => q.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` : '';
    const lead = from ? `<line x1="${P[0][0]}" y1="${P[0][1]}" x2="${P[1][0]}" y2="${P[1][1]}" stroke="${color}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
      <circle cx="${P[0][0]}" cy="${P[0][1]}" r="6" fill="#fff" stroke="${color}" stroke-width="3"/>` : '';
    const dots = day.map((q, i) => `<circle cx="${q[0]}" cy="${q[1]}" r="${i === day.length - 1 ? 8 : 6}" fill="${i === day.length - 1 ? color : '#fff'}" stroke="${i === day.length - 1 ? '#fff' : color}" stroke-width="3"/>`).join('');
    return `<svg class="day-map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="${W}" height="${H}" fill="#EDE6D6"/>${tiles.join('')}${lead}${line}${dots}
      <text x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="11" fill="#555" paint-order="stroke" stroke="#fff" stroke-width="3">© OpenStreetMap</text></svg>`;
  }
  function dayPoints(t, d) {
    const es = tripEntries(t).filter(withPos).sort(byDate);
    const pts = es.filter(e => e.date.slice(0, 10) === d);
    const from = es.filter(e => e.date.slice(0, 10) < d).pop() || null;
    return { pts, from };
  }
  app.dayMap = (t, d, force) => {
    if (!force && LS.get('dayMaps', true) === false) return '';
    const { pts, from } = dayPoints(t, d);
    if (!pts.length) return '';
    return `<button class="day-map" data-action="day-map-open" data-day="${d}" aria-label="Strecke des Tages auf der großen Karte">${staticMap(pts, tripColor(t), from)}</button>`;
  };
  // Kacheln erst laden, wenn die Karte ins Bild kommt
  const tileObs = 'IntersectionObserver' in window ? new IntersectionObserver(list => list.forEach(en => {
    if (!en.isIntersecting) return;
    tileObs.unobserve(en.target);
    en.target.querySelectorAll('image[data-href]').forEach(im => { im.setAttribute('href', im.dataset.href); im.removeAttribute('data-href'); });
  }), { rootMargin: '300px' }) : null;
  app.afterDraw.push(view => view.querySelectorAll('.day-map-svg').forEach(svg => {
    if (tileObs) tileObs.observe(svg); else svg.querySelectorAll('image[data-href]').forEach(im => im.setAttribute('href', im.dataset.href));
  }));
  ACTIONS['day-map-open'] = el => {
    const t = currentTrip();
    const { pts, from } = dayPoints(t, el.dataset.day);
    const all = (from ? [from, ...pts] : pts).map(e => [e.lat, e.lng]);
    go('karte');
    setTimeout(() => {
      if (!app.map || !all.length) return;
      if (all.length === 1) app.map.setView(all[0], 14); else app.map.fitBounds(all, { padding: [50, 50], maxZoom: 15 });
    }, 500);
  };

  /* ====================================================================== */
  /* Kalender: alle Reisetage mit Farbe der Reise und kleinem Foto            */
  /* ====================================================================== */

  function range(t) {
    const st = tripStats(t);
    const a = t.start || st.firstDay;
    if (!a) return null;
    const lastEntry = (tripEntries(t).slice().sort(byDate).pop() || {}).date;
    let b = t.end || (lastEntry ? lastEntry.slice(0, 10) : a);
    // Laufende Reise ohne Enddatum: bis heute (nur, wenn sie nicht schon ewig zurückliegt)
    if (!t.end && !t.ended && !t.archived && a <= today() && addDays(a, 60) >= today()) b = today();
    return b < a ? [a, a] : [a, b];
  }
  function calendarData() {
    const byDay = {};
    sortTrips(S.trips).forEach(t => {
      const r = range(t);
      if (!r) return;
      for (let d = r[0]; d <= r[1]; d = addDays(d, 1)) if (!byDay[d]) byDay[d] = { t };
    });
    S.entries.forEach(e => {
      const d = e.date && e.date.slice(0, 10), x = byDay[d];
      if (x && x.t.id === e.tripId && !x.photo && (e.photos || []).length) x.photo = e.photos[0].thumb;
      if (x && x.t.id === e.tripId) x.n = (x.n || 0) + 1;
    });
    return byDay;
  }
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  VIEWS.kalender = () => {
    const data = calendarData();
    const years = [...new Set(Object.keys(data).map(d => +d.slice(0, 4)))].sort();
    const thisYear = +today().slice(0, 4);
    const y = ui.calYear || (years.includes(thisYear) ? thisYear : years[years.length - 1] || thisYear);
    const months = [...new Set(Object.keys(data).filter(d => +d.slice(0, 4) === y).map(d => +d.slice(5, 7) - 1))];
    if (y === thisYear && !months.includes(+today().slice(5, 7) - 1)) months.push(+today().slice(5, 7) - 1);
    months.sort((a, b) => a - b);
    const trips = [...new Map(Object.entries(data).filter(([d]) => +d.slice(0, 4) === y).map(([, x]) => [x.t.id, x.t])).values()];
    const month = m => {
      const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, len = new Date(y, m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push('<span></span>');
      for (let day = 1; day <= len; day++) {
        const d = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, x = data[d];
        cells.push(x ? `<button class="cal-day trip${x.photo ? ' ph' : ''}${d === today() ? ' today' : ''}" style="--c:${tripColor(x.t)}${x.photo ? `;background-image:url('${x.photo}')` : ''}"
            data-action="cal-day" data-trip="${x.t.id}" data-day="${d}" title="${esc(x.t.name)}${x.n ? `, ${x.n} Einträge` : ''}"><b>${day}</b></button>`
          : `<span class="cal-day${d === today() ? ' today' : ''}"><b>${day}</b></span>`);
      }
      return `<section class="cal-month"><h3>${MONTHS[m]}</h3><div class="cal-grid"><i>Mo</i><i>Di</i><i>Mi</i><i>Do</i><i>Fr</i><i>Sa</i><i>So</i>${cells.join('')}</div></section>`;
    };
    return `${pageHead('kalender', 'Kalender', 'Alle Reisetage auf einen Blick')}
      <div class="cal-year"><button class="icon-btn" data-action="cal-year" data-y="${y - 1}" aria-label="Voriges Jahr">‹</button><b>${y}</b>
        <button class="icon-btn" data-action="cal-year" data-y="${y + 1}" aria-label="Nächstes Jahr">›</button></div>
      ${trips.length ? `<div class="cal-legend">${trips.map(t => `<span><i style="--c:${tripColor(t)}"></i>${esc(t.name)}</span>`).join('')}</div>` : `<p class="hint">In ${y} gibt es keine Reisen.</p>`}
      <div class="cal-months">${months.map(month).join('')}</div>
      <p class="sub">Tipp auf einen Reisetag öffnet ihn im Tagebuch.</p>`;
  };
  ACTIONS['cal-year'] = el => { ui.calYear = +el.dataset.y; render(); };
  ACTIONS['cal-day'] = el => {
    const t = S.trips.find(x => x.id === el.dataset.trip);
    if (!t) return;
    app.setTrip(t.id);
    ui.diaryMode[t.id] = 'tagebuch';
    pendingDay = el.dataset.day;
    // Tag ohne Einträge: zum nächstgelegenen Tag mit Einträgen
    const days = [...new Set(tripEntries(t).map(e => e.date.slice(0, 10)))].sort();
    if (!days.includes(pendingDay)) pendingDay = days.find(d => d >= pendingDay) || days[days.length - 1] || null;
    go('tagebuch');
  };

  /* ====================================================================== */
  /* Tagebuch als Buch: Titelseite, ein Tag pro Seite, Schlussseite          */
  /* ====================================================================== */

  function pages(t) {
    const days = [...new Set(tripEntries(t).map(e => e.date.slice(0, 10)))].sort();
    return ['cover', ...days, 'end'];
  }
  const pageKey = t => 'buch.' + t.id;
  const photoTag = (p, cls = '') => `<img class="${cls}" data-photo="${p.id}" src="${p.thumb}" alt="" loading="lazy">`;
  function cover(t, st) {
    const rf = S.games.find(g => g.id === `reisefoto_${t.id}`);
    const first = tripEntries(t).slice().sort(byDate).find(e => (e.photos || []).length);
    const ph = rf ? { id: rf.photoId, thumb: rf.thumb } : first ? first.photos[0] : null;
    const countries = [...new Set(tripEntries(t).map(e => e.country).filter(Boolean))];
    return `<div class="book-cover" style="--c:${tripColor(t)}">
      <p class="book-kicker">Unser Reisetagebuch</p>
      <h1>${esc(t.name)}</h1>
      <p class="book-dates">${fmtRange(t)}</p>
      ${ph ? photoTag(ph, 'book-cover-photo') : ''}
      <p class="book-facts">${[st.days ? `${st.days} Tage` : '', st.dist ? fmtKm(st.dist) : '', countries.length ? `${countries.length} ${countries.length === 1 ? 'Land' : 'Länder'}` : '', `${tripEntries(t).length} Einträge`].filter(Boolean).join(' · ')}</p>
      <p class="book-crew">${esc(app.crewName ? app.crewName() : '')}</p>
    </div>`;
  }
  function dayPage(t, st, d) {
    const es = tripEntries(t).filter(e => e.date.slice(0, 10) === d).sort(byDate);
    const n = dayNo(st, d);
    return `<header class="book-day"><p>${n > 0 ? `Tag ${n}` : ''}</p><h2>${fmtDay(d)}</h2></header>
      ${app.dayMap(t, d, true)}
      ${app.dayHighlights ? app.dayHighlights(t, d, true) : ''}
      ${es.map(e => {
        const [first, ...rest] = e.photos || [];
        return `<article class="book-entry" data-entry="${e.id}">
          <p class="book-meta">${icon(e.type)}${fmtTime(e.date)} · ${TYPES[e.type].label}${e.place ? ` · ${esc(e.place)}` : ''}</p>
          ${e.title ? `<h3>${esc(e.title)}</h3>` : ''}
          ${e.rating ? `<p class="book-stars">${'★'.repeat(e.rating)}</p>` : ''}
          ${e.text ? e.text.split(/\n+/).map(par => `<p class="book-text">${esc(par)}</p>`).join('') : ''}
          ${first ? photoTag(first, 'book-photo') : ''}
          ${rest.length ? `<div class="book-photos">${rest.map(p => photoTag(p)).join('')}</div>` : ''}
          ${e.cost ? `<p class="book-small">${money(e.cost)}</p>` : ''}
        </article>`;
      }).join('')}`;
  }
  function endPage(t, st) {
    const es = tripEntries(t);
    const photos = es.reduce((s, e) => s + (e.photos || []).length, 0);
    const hearts = S.games.filter(g => g.kind === 'heart' && es.some(e => e.id === g.entryId)).length;
    return `<div class="book-end"><p class="book-kicker">Ende</p><h2>Schön war’s!</h2>
      <p>${[st.days ? `${st.days} Tage` : '', st.dist ? `${fmtKm(st.dist)} unterwegs` : '', `${es.length} Einträge`, photos ? `${photos} Fotos` : '', hearts ? `${hearts} Herzen` : ''].filter(Boolean).join('<br>')}</p>
      <p class="sub">${esc(t.name)}</p></div>`;
  }
  VIEWS.buch = () => {
    const t = currentTrip();
    if (!t) return `${pageHead('tagebuch', 'Als Buch lesen')}<p class="hint">Noch keine Reise.</p>`;
    const st = tripStats(t), ps = pages(t);
    let i = Math.min(ps.length - 1, Math.max(0, +LS.get(pageKey(t), 0) || 0));
    if (ps.length === 2) i = 0;
    const p = ps[i];
    const label = q => (q === 'cover' ? 'Titelseite' : q === 'end' ? 'Ende' : `${dayNo(st, q) > 0 ? `Tag ${dayNo(st, q)}: ` : ''}${fmtDay(q)}`);
    return `<div class="book" data-noswipe>
      <article class="book-page${turn ? ` turn-${turn}` : ''}">${p === 'cover' ? cover(t, st) : p === 'end' ? endPage(t, st) : dayPage(t, st, p)}</article>
      <nav class="book-nav">
        <button class="book-arrow" data-action="book-go" data-i="${i - 1}"${i === 0 ? ' disabled' : ''} aria-label="Vorige Seite">‹</button>
        <select data-action="book-pick" aria-label="Seite wählen">${ps.map((q, k) => `<option value="${k}"${k === i ? ' selected' : ''}>${esc(label(q))}</option>`).join('')}</select>
        <button class="book-arrow" data-action="book-go" data-i="${i + 1}"${i === ps.length - 1 ? ' disabled' : ''} aria-label="Nächste Seite">›</button>
        <a class="book-close" href="#/tagebuch" aria-label="Buch schließen">${icon('close')}</a>
      </nav>
    </div>`;
  };
  let turn = '';
  function goPage(i) {
    const t = currentTrip(), ps = pages(t);
    if (i < 0 || i >= ps.length) return;
    turn = i > (+LS.get(pageKey(t), 0) || 0) ? 'next' : 'prev';
    LS.set(pageKey(t), i);
    render();
    turn = '';
    window.scrollTo(0, 0);
  }
  ACTIONS['book-go'] = el => goPage(+el.dataset.i);
  app.CHANGES['book-pick'] = el => goPage(+el.value);
  // Aus dem Tagebuch: Buch beim gerade sichtbaren Tag öffnen
  const toBook = () => {
    const t = currentTrip(), cur = document.querySelector('.day-jump button.on');
    if (t && cur) { const k = pages(t).indexOf(cur.dataset.day); if (k > 0) LS.set(pageKey(t), k); }
  };
  document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('a[href="#/buch"]')) toBook(); }, true);
  // Blättern: wischen, Pfeiltasten
  let sx = null;
  document.addEventListener('touchstart', ev => { sx = ui.route === 'buch' && ev.touches.length === 1 && !ev.target.closest('.day-map, select') ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY } : null; }, { passive: true });
  document.addEventListener('touchend', ev => {
    if (!sx || ui.route !== 'buch' || document.querySelector('.photo-viewer')) return;
    const dx = ev.changedTouches[0].clientX - sx.x, dy = ev.changedTouches[0].clientY - sx.y;
    sx = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goPage((+LS.get(pageKey(currentTrip()), 0) || 0) + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', ev => {
    if (ui.route !== 'buch' || document.querySelector('.photo-viewer') || /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    const i = +LS.get(pageKey(currentTrip()), 0) || 0;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') goPage(i + 1);
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') goPage(i - 1);
  });
  // Große Fotos im Buch nachladen
  app.afterDraw.push(view => {
    if (ui.route !== 'buch') return;
    view.querySelectorAll('img.book-photo[data-photo], img.book-cover-photo[data-photo]').forEach(img => app.store().get('photos', img.dataset.photo).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {}));
  });
}
