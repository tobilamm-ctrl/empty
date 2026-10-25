// Rubbelkarte: Weltkarte mit allen bereisten Ländern, auf Wunsch auch Regionen (z. B. Schottland, Bayern).
// Die Grenzen (Natural Earth, gemeinfrei) liegen in vendor/welt und werden erst beim Öffnen geladen.

export default function installWelt(app) {
  const { S, ui, VIEWS, ACTIONS, esc, pageHead, members, me, personName, fmtShort, render } = app;

  const CONT = { Europe: 'Europa', Asia: 'Asien', Africa: 'Afrika', 'North America': 'Nordamerika', 'South America': 'Südamerika', Oceania: 'Ozeanien' };
  const GOLD = '#E0A21B';
  let world = null, regions = null, loading = false, failed = false;

  async function load() {
    if (loading || world) return;
    loading = true;
    try {
      const [a, b] = await Promise.all([fetch('vendor/welt/laender.json').then(r => r.json()), fetch('vendor/welt/regionen.json').then(r => r.json())]);
      const ok = f => f.geometry && /Polygon/.test(f.geometry.type);
      regions = b.features.filter(ok).map(prep);
      world = a.features.filter(ok).map(prep);
    } catch { failed = true; }
    loading = false;
    if (ui.route === 'rubbelkarte' || ui.route === 'reisepass') render();
  }
  // Umrandung (bbox) vorab berechnen, damit der Punkt-in-Fläche-Test schnell bleibt
  function prep(f) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let w = 180, s = 90, e = -180, n = -90;
    polys.forEach(p => p[0].forEach(([x, y]) => { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }));
    return { ...f.properties, polys, box: [w, s, e, n], feature: f };
  }
  function inRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const hit = (f, lat, lng) => lng >= f.box[0] && lng <= f.box[2] && lat >= f.box[1] && lat <= f.box[3]
    && f.polys.some(p => inRing(lng, lat, p[0]) && !p.slice(1).some(h => inRing(lng, lat, h)));

  /* ---------- Wer war wo? (Reisen, bei denen die Person dabei war) ---------- */

  function visited(pid) {
    const trips = S.trips.filter(t => !t.members || t.members.includes(pid));
    const ids = new Set(trips.map(t => t.id));
    const es = S.entries.filter(e => ids.has(e.tripId) && e.date && typeof e.lat === 'number').sort((a, b) => a.date.localeCompare(b.date));
    const countries = new Map(), regs = new Map(), pts = es.map(e => [e.lat, e.lng]);
    const seen = new Set();
    for (const e of es) {
      // Nahe beieinanderliegende Einträge nur einmal prüfen
      const key = `${e.lat.toFixed(2)},${e.lng.toFixed(2)}`;
      let cc = e.country;
      if (!seen.has(key)) {
        seen.add(key);
        const c = world.find(f => hit(f, e.lat, e.lng));
        if (c) cc = c.cc;
        const r = regions.find(f => hit(f, e.lat, e.lng));
        if (r && !regs.has(r.key || r.cc + r.nm)) regs.set(r.key || r.cc + r.nm, { ...r, date: e.date.slice(0, 10), trip: e.tripId });
      }
      if (cc && !countries.has(cc)) countries.set(cc, { cc, date: e.date.slice(0, 10), trip: e.tripId, place: e.place || '' });
    }
    return { countries, regs, pts };
  }

  /* ---------- Ansicht ---------- */

  let map = null;
  VIEWS.rubbelkarte = () => {
    if (!world) {
      load();
      return `${pageHead('rubbelkarte', 'Rubbelkarte')}<p class="${failed ? 'hint' : 'sub'}">${failed ? 'Die Karte ließ sich nicht laden.' : 'Karte wird geladen …'}</p>`;
    }
    const pid = members().some(m => m.id === ui.rubbelFor) ? ui.rubbelFor : me();
    const mode = ui.rubbelMode || 'laender';
    const v = visited(pid);
    const byCode = cc => world.find(f => f.cc === cc);
    const list = [...v.countries.values()].map(c => ({ ...c, f: byCode(c.cc) })).filter(c => c.f);
    const conts = [...new Set(list.map(c => c.f.ct))].filter(c => CONT[c]);
    const total = new Set(world.filter(f => CONT[f.ct]).map(f => f.cc)).size;
    setTimeout(() => drawMap(pid, mode, v), 0);
    const flag = app.flag || (() => '');
    return `${pageHead('rubbelkarte', 'Rubbelkarte', `${personName(pid)}: ${list.length} ${list.length === 1 ? 'Land' : 'Länder'} auf ${conts.length} ${conts.length === 1 ? 'Kontinent' : 'Kontinenten'}${v.regs.size ? `, ${v.regs.size} Regionen` : ''}`)}
      ${members().length > 1 ? `<div class="chips list-chips">${members().map(m => `<button class="chip${m.id === pid ? ' on' : ''}" data-action="rubbel-for" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
      <div class="seg tabs rubbel-mode">
        <button class="${mode === 'laender' ? 'on' : ''}" data-action="rubbel-mode" data-m="laender">Länder</button>
        <button class="${mode === 'regionen' ? 'on' : ''}" data-action="rubbel-mode" data-m="regionen">Regionen</button>
      </div>
      <div id="rubbelMap" class="rubbel-map"></div>
      <div class="rubbel-stat"><div class="progress"><span style="--p:${list.length / total}"></span></div>
        <p class="sub">${(Math.round(list.length / total * 1000) / 10).toLocaleString('de-DE')} % aller Länder der Welt</p></div>
      ${mode === 'laender'
        ? Object.entries(CONT).map(([k, name]) => {
            const cs = list.filter(c => c.f.ct === k).sort((a, b) => a.date.localeCompare(b.date));
            return cs.length ? `<h2 class="date-head">${name} <small>${cs.length}</small></h2><ul class="rubbel-list">${cs.map(c =>
              `<li><span class="rf">${flag(c.cc)}</span><b>${esc(c.f.nm)}</b><small>seit ${fmtShort(c.date)}</small></li>`).join('')}</ul>` : '';
          }).join('') || '<p class="hint">Noch keine Länder. Sobald ihr Einträge mit Position habt, färbt sich die Karte.</p>'
        : (() => {
            const byCc = {};
            [...v.regs.values()].forEach(r => (byCc[r.cc] ||= []).push(r));
            const cs = Object.keys(byCc).sort((a, b) => (byCode(a) || {}).nm?.localeCompare((byCode(b) || {}).nm || '') || 0);
            return cs.map(cc => {
              const all = regions.filter(r => r.cc === cc).length;
              return `<h2 class="date-head">${flag(cc)} ${esc((byCode(cc) || {}).nm || cc)} <small>${byCc[cc].length} von ${all}</small></h2>
                <p class="rubbel-regs">${byCc[cc].sort((a, b) => a.nm.localeCompare(b.nm)).map(r => esc(r.nm)).join(' · ')}</p>`;
            }).join('') || '<p class="hint">Regionen gibt es für Europa, die USA, Kanada, Australien und Neuseeland.</p>';
          })()}
      <p class="sub source">Grenzen: Natural Earth (gemeinfrei)</p>`;
  };
  ACTIONS['rubbel-for'] = el => { ui.rubbelFor = el.dataset.id; render(); };
  ACTIONS['rubbel-mode'] = el => { ui.rubbelMode = el.dataset.m; render(); };

  function drawMap(pid, mode, v) {
    const el = document.getElementById('rubbelMap');
    if (!el) return;
    if (map) { map.remove(); map = null; }
    map = L.map(el, { zoomControl: true, attributionControl: false, worldCopyJump: false, minZoom: 1, maxZoom: 7, zoomSnap: 0.25 });
    const on = new Set(v.countries.keys());
    const style = f => ({ weight: 0.6, color: '#C9B394', fillOpacity: 1, fillColor: on.has(f.properties.cc) ? (mode === 'regionen' ? '#F3D98F' : GOLD) : '#F2E9D8' });
    L.geoJSON({ type: 'FeatureCollection', features: world.map(f => f.feature) }, { style })
      .bindTooltip(l => `${esc(l.feature.properties.nm)}${on.has(l.feature.properties.cc) ? ` · seit ${fmtShort(v.countries.get(l.feature.properties.cc).date)}` : ''}`, { sticky: true })
      .addTo(map);
    if (mode === 'regionen') {
      const ccs = new Set([...v.regs.values()].map(r => r.cc));
      const regOn = new Set([...v.regs.keys()]);
      const shown = regions.filter(r => ccs.has(r.cc));
      if (shown.length) {
        L.geoJSON({ type: 'FeatureCollection', features: shown.map(r => r.feature) }, {
          style: f => ({ weight: 0.7, color: '#B89A6A', fillOpacity: 1, fillColor: regOn.has(f.properties.key || f.properties.cc + f.properties.nm) ? GOLD : '#F7EEDC' }),
        }).bindTooltip(l => esc(l.feature.properties.nm), { sticky: true }).addTo(map);
      }
    }
    // Ausschnitt nach den eigenen Einträgen (nicht nach ganzen Ländern, sonst zieht z. B. Französisch-Guayana die Karte nach Südamerika)
    const bounds = v.pts.length ? L.latLngBounds(v.pts).pad(0.5) : L.latLngBounds([[35, -12], [62, 30]]);
    map.fitBounds(bounds, { padding: [12, 12], maxZoom: 6 });
  }

  // Für den Reisepass: Kontinente einer Person in der Reihenfolge des ersten Besuchs (null, solange die Karte fehlt)
  app.loadWorld = load;
  app.continentsOf = pid => {
    if (!world) return null;
    const out = [];
    for (const c of visited(pid).countries.values()) {
      const ct = (world.find(f => f.cc === c.cc) || {}).ct;
      if (CONT[ct] && !out.some(o => o.ct === ct)) out.push({ ct, date: c.date, place: CONT[ct] });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  };
}
