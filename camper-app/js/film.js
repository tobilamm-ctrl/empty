// Reise-Rückblick als Film: Die Strecke zeichnet sich Tag für Tag auf der Karte nach,
// an jedem Ort erscheinen Titel und Fotos. Schön für einen gemütlichen Abend oder die Großeltern.

export default function installFilm(app) {
  const { S, ACTIONS, esc, icon, fmtDay, fmtKm, km, tripStats, tripColor, TYPES } = app;

  // Knopf in der Leiste über dem Tagebuch, sobald es mindestens zwei Orte gibt
  app.tripTools.push((t, st) => (st.stops.length > 1 ? { order: 4, action: 'film', icon: 'film', label: 'Rückblick', title: 'Reise-Rückblick als Film' } : null));

  let film = null;
  ACTIONS.film = el => {
    const t = S.trips.find(x => x.id === el.dataset.id);
    if (t) start(t);
  };

  function start(t) {
    stop();
    const st = tripStats(t);
    const stops = st.stops;
    const color = tripColor(t);
    // Strecke: gefahrene GPX-Strecke oder Linie zwischen den Orten
    const tracks = S.tracks.filter(k => k.tripId === t.id && k.kind !== 'hike').map(k => app.decodePts(k.pts));
    const path = tracks.length ? tracks.flat() : stops.map(e => [e.lat, e.lng]);
    // Zu jedem Ort die passende Stelle auf der Strecke (vorwärts suchen, damit die Reihenfolge stimmt)
    let from = 0;
    const at = stops.map((e, i) => {
      if (!tracks.length) return i;
      let best = from, bd = Infinity;
      for (let j = from; j < path.length; j++) {
        const d = (path[j][0] - e.lat) ** 2 + (path[j][1] - e.lng) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      from = best;
      return best;
    });

    const el = document.createElement('div');
    el.className = 'film';
    el.innerHTML = `<div class="film-map"></div>
      <div class="film-top"><span class="film-day"></span><button class="icon-btn film-close" aria-label="Schließen">${icon('close')}</button></div>
      <figure class="film-photo" hidden><img alt=""></figure>
      <div class="film-cap" hidden></div>
      <div class="film-ctrl"><button class="primary film-pause">Pause</button><button class="ghost film-speed">1×</button></div>`;
    document.body.appendChild(el);
    const map = L.map(el.querySelector('.film-map'), { zoomControl: false, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    map.fitBounds(path, { padding: [60, 40], maxZoom: 12 });
    const line = L.polyline([], { color, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    const van = L.marker(path[0], { icon: L.divIcon({ className: '', html: `<div class="film-van" style="--c:${color}">${icon('car')}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }), zIndexOffset: 1000 }).addTo(map);

    film = { el, map, alive: true, paused: false, speed: 1 };
    const f = film;
    el.querySelector('.film-close').onclick = stop;
    el.querySelector('.film-pause').onclick = ev => { f.paused = !f.paused; ev.target.textContent = f.paused ? 'Weiter' : 'Pause'; };
    el.querySelector('.film-speed').onclick = ev => { f.speed = f.speed === 1 ? 2 : f.speed === 2 ? 4 : 1; ev.target.textContent = f.speed + '×'; };
    document.addEventListener('keydown', onKey);

    // Warten, das Pause und Tempo beachtet
    const wait = ms => new Promise(res => {
      let left = ms, last = performance.now();
      const tick = now => {
        if (!f.alive) return res(false);
        if (!f.paused) left -= (now - last) * f.speed;
        last = now;
        if (left <= 0) return res(true);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // Linie von Punkt a bis b nachzeichnen
    const draw = async (a, b) => {
      const seg = path.slice(a, b + 1);
      let len = 0;
      for (let i = 1; i < seg.length; i++) len += km({ lat: seg[i - 1][0], lng: seg[i - 1][1] }, { lat: seg[i][0], lng: seg[i][1] });
      const dur = Math.max(700, Math.min(3500, len * 22));
      const steps = Math.max(1, Math.round(dur / 40));
      for (let s = 1; s <= steps && f.alive; s++) {
        const pos = (seg.length - 1) * (s / steps);
        const i = Math.floor(pos), r = pos - i;
        const p = seg[Math.min(i + 1, seg.length - 1)], q = seg[i];
        const cur = [q[0] + (p[0] - q[0]) * r, q[1] + (p[1] - q[1]) * r];
        line.setLatLngs([...path.slice(0, a + i + 1), cur]);
        van.setLatLng(cur);
        if (!(await wait(40))) return;
      }
    };
    const cap = el.querySelector('.film-cap'), fig = el.querySelector('.film-photo'), img = fig.querySelector('img'), day = el.querySelector('.film-day');
    const fullPhoto = id => app.store().get('photos', id).then(p => p && p.data).catch(() => null);

    (async () => {
      await wait(900);
      let prev = 0;
      for (let k = 0; k < stops.length && f.alive; k++) {
        const e = stops[k];
        const d = e.date.slice(0, 10);
        const n = st.firstDay ? Math.round((new Date(d + 'T12:00') - new Date(st.firstDay + 'T12:00')) / 864e5) + 1 : 0;
        day.textContent = `${n > 0 ? `Tag ${n} · ` : ''}${fmtDay(d)}`;
        if (k > 0) await draw(prev, at[k]);
        prev = at[k];
        if (!f.alive) return;
        L.circleMarker([e.lat, e.lng], { radius: e.type === 'stellplatz' ? 8 : 5, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
        // Kleinkram unterwegs nur als Punkt, Erlebnisse und Stellplätze mit Titel und Fotos
        if (TYPES[e.type].minor && !(e.photos || []).length) continue;
        cap.innerHTML = `<small>${esc(TYPES[e.type].label)}${e.place ? ` · ${esc(e.place)}` : ''}</small><b>${esc(e.title || TYPES[e.type].label)}</b>${e.rating ? `<span>${'★'.repeat(e.rating)}</span>` : ''}`;
        cap.hidden = false;
        const photos = (e.photos || []).slice(0, 3);
        if (photos.length) {
          for (const ph of photos) {
            img.src = ph.thumb;
            fig.hidden = false;
            fullPhoto(ph.id).then(src => { if (src && img.src === ph.thumb) img.src = src; });
            if (!(await wait(2200))) return;
          }
          fig.hidden = true;
        } else if (!(await wait(1500))) return;
        cap.hidden = true;
      }
      if (!f.alive) return;
      line.setLatLngs(path);
      map.flyToBounds(path, { padding: [60, 40], duration: 1.2 });
      day.textContent = 'Ende';
      el.querySelector('.film-ctrl').hidden = true;
      cap.innerHTML = `<b>${esc(t.name)}</b><small>${st.days} Tage · ${st.nights} Stellplätze${st.dist ? ` · ${fmtKm(st.dist)}` : ''}</small>
        <div class="btnrow"><button class="primary film-again">Nochmal</button><button class="ghost film-end">Schließen</button></div>`;
      cap.hidden = false;
      cap.querySelector('.film-again').onclick = () => start(t);
      cap.querySelector('.film-end').onclick = stop;
    })();
  }

  function onKey(ev) { if (ev.key === 'Escape') stop(); if (ev.key === ' ' && film) { ev.preventDefault(); film.el.querySelector('.film-pause').click(); } }
  function stop() {
    if (!film) return;
    film.alive = false;
    film.map.remove();
    film.el.remove();
    film = null;
    document.removeEventListener('keydown', onKey);
  }
}
