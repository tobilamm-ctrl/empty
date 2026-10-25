// Auswertung: Höhenprofil für Wanderungen und Radtouren (aus der GPX-Datei oder über Open-Meteo nachgeladen)
// und Jahresvergleich in der Statistik.

export default function installAuswertung(app) {
  const { S, ui, VIEWS, ACTIONS, esc, save, render, km, money, canCash, tripStats } = app;
  const fmt = n => Math.round(n).toLocaleString('de-DE');

  /* ====================================================================== */
  /* Höhenprofil                                                             */
  /* ====================================================================== */

  // Aus Punkten und Höhen: Anstieg, Abstieg, höchster und tiefster Punkt und eine verkleinerte Kurve (Entfernung, Höhe)
  app.makeProfile = (pts, ele) => {
    const d = [0];
    for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + km({ lat: pts[i - 1][0], lng: pts[i - 1][1] }, { lat: pts[i][0], lng: pts[i][1] }));
    const h = ele.map((v, i) => (isFinite(v) ? v : ele.slice(0, i).reverse().find(isFinite) ?? ele.find(isFinite) ?? 0));
    // Kleine Schwankungen (GPS-Rauschen) unter 4 m nicht als Anstieg zählen
    let up = 0, down = 0, ref = h[0];
    for (const v of h) { if (v - ref >= 4) { up += v - ref; ref = v; } else if (ref - v >= 4) { down += ref - v; ref = v; } }
    const n = Math.min(160, h.length);
    const prof = Array.from({ length: n }, (_, k) => { const i = Math.round(k * (h.length - 1) / Math.max(1, n - 1)); return `${d[i].toFixed(2)},${Math.round(h[i])}`; }).join(';');
    return { prof, up: Math.round(up), down: Math.round(down), maxEle: Math.round(Math.max(...h)), minEle: Math.round(Math.min(...h)) };
  };

  const hikeTrack = e => S.tracks.find(t => t.entryId === e.id && t.kind === 'hike');
  const loading = new Set();

  // Fehlen Höhen (z. B. GPX ohne <ele>), aus dem Höhenmodell von Open-Meteo nachladen: 100 Punkte, eine Anfrage
  async function fetchProfile(t) {
    if (loading.has(t.id)) return;
    loading.add(t.id);
    try {
      const pts = app.decodePts(t.pts);
      const n = Math.min(100, pts.length);
      const sample = Array.from({ length: n }, (_, k) => pts[Math.round(k * (pts.length - 1) / Math.max(1, n - 1))]);
      const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${sample.map(p => p[0].toFixed(5)).join(',')}&longitude=${sample.map(p => p[1].toFixed(5)).join(',')}`);
      const j = await r.json();
      if (!j.elevation || j.elevation.length !== sample.length) throw new Error();
      save('tracks', { ...t, ...app.makeProfile(sample, j.elevation), eleSource: 'dem' });
    } catch { /* ohne Netz: später erneut */ }
    loading.delete(t.id);
    const box = document.getElementById('prof-' + t.entryId);
    const e = S.entries.find(x => x.id === t.entryId);
    if (box && e) setTimeout(() => { box.outerHTML = profileHtml(e); }, 200);
  }

  function chart(t) {
    const pts = t.prof.split(';').map(s => s.split(',').map(Number));
    const dMax = pts[pts.length - 1][0] || 1, lo = t.minEle, hi = Math.max(t.maxEle, lo + 20);
    const W = 300, H = 90;
    const x = d => (d / dMax) * W, y = h => H - 6 - ((h - lo) / (hi - lo)) * (H - 16);
    const line = pts.map(([d, h], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)} ${y(h).toFixed(1)}`).join('');
    const top = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
    return `<svg class="prof-chart" viewBox="0 0 ${W} ${H + 14}" preserveAspectRatio="none" role="img" aria-label="Höhenprofil">
      <path d="${line}L${W} ${H}L0 ${H}Z" class="pa"/><path d="${line}" class="pl"/>
      <circle cx="${x(top[0]).toFixed(1)}" cy="${y(top[1]).toFixed(1)}" r="3.5" class="pt"/>
      <text x="2" y="${H + 12}">0 km</text><text x="${W - 2}" y="${H + 12}" text-anchor="end">${dMax.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km</text>
    </svg>`;
  }
  function profileHtml(e) {
    const t = hikeTrack(e);
    if (!t) return '';
    if (!t.prof) {
      fetchProfile(t);
      return `<div class="profile" id="prof-${e.id}"><p class="sub">Höhenprofil wird geladen …</p></div>`;
    }
    return `<div class="profile" id="prof-${e.id}">
      <p class="prof-facts"><span>↑ <b>${fmt(t.up)} m</b></span><span>↓ <b>${fmt(t.down)} m</b></span><span>höchster Punkt <b>${fmt(t.maxEle)} m</b></span></p>
      ${chart(t)}
      ${t.eleSource === 'dem' ? '<p class="sub source">Höhen aus dem Höhenmodell von Open-Meteo</p>' : ''}</div>`;
  }
  const extra = app.entryExtra;
  app.entryExtra = e => `${extra ? extra(e) : ''}${e.type === 'wanderung' ? profileHtml(e) : ''}`;
  // Für den Reisepass: höchster Punkt und Höhenmeter aller Touren einer Person
  app.hikeHeights = es => es.map(e => ({ e, t: hikeTrack(e) })).filter(x => x.t && x.t.prof);

  /* ====================================================================== */
  /* Jahresvergleich                                                         */
  /* ====================================================================== */

  function years() {
    const out = {};
    for (const t of S.trips) {
      const st = tripStats(t);
      const y = (t.start || st.firstDay || '').slice(0, 4);
      if (!y || !st.es.length) continue;
      const o = (out[y] ||= { y, trips: 0, days: 0, nights: 0, km: 0, cc: new Set(), cost: 0 });
      o.trips++; o.days += st.days; o.nights += st.nights; o.km += st.dist; o.cost += st.cost;
      st.es.forEach(e => e.country && o.cc.add(e.country));
    }
    return Object.values(out).sort((a, b) => b.y.localeCompare(a.y));
  }
  const METRICS = [['km', 'Kilometer', v => fmt(v)], ['nights', 'Nächte', v => v], ['days', 'Tage', v => v], ['cc', 'Länder', v => v], ['trips', 'Reisen', v => v], ['cost', 'Kosten', v => money(v)]];
  const val = (o, k) => (k === 'cc' ? o.cc.size : o[k]);

  const stat = VIEWS.statistik;
  VIEWS.statistik = () => {
    const ys = years();
    if (ys.length < 1) return stat();
    const ms = METRICS.filter(([k]) => k !== 'cost' || canCash());
    const m = ms.find(([k]) => k === ui.yearMetric) || ms[0];
    const max = Math.max(1, ...ys.map(o => val(o, m[0])));
    return `${stat()}
      <section class="years">
        <h2 class="date-head">Jahresvergleich</h2>
        <div class="chips list-chips">${ms.map(([k, l]) => `<button class="chip${k === m[0] ? ' on' : ''}" data-action="year-metric" data-k="${k}">${l}</button>`).join('')}</div>
        <ul class="year-bars">${ys.map(o => `<li><span class="yb-y">${o.y}</span><span class="yb-bar"><i style="width:${(val(o, m[0]) / max) * 100}%"></i></span><b>${m[2](val(o, m[0]))}</b></li>`).join('')}</ul>
        <div class="year-table"><table><thead><tr><th>Jahr</th>${ms.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead>
          <tbody>${ys.map(o => `<tr><td>${o.y}</td>${ms.map(([k, , f]) => `<td>${f(val(o, k))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      </section>`;
  };
  ACTIONS['year-metric'] = el => { ui.yearMetric = el.dataset.k; render(); };
}
