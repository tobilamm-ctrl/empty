// Karte: Kartenart (Normal, Wanderkarte, Luftbild), nahe Pins bündeln, Fotos auf der Karte und eine
// hochziehbare Liste mit den Stopps eines Tages unter der Karte.

export default function installKartenebenen(app) {
  const { S, LS, ui, ACTIONS, CHANGES, esc, icon, render, currentTrip, tripEntries, tripColor, byDate, fmtDay, fmtTime, TYPES, today } = app;

  /* ====================================================================== */
  /* Kartenart                                                               */
  /* ====================================================================== */

  const BASES = {
    normal: { label: 'Normal', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
    wandern: { label: 'Wanderkarte', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', maxZoom: 17,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' },
    luftbild: { label: 'Luftbild', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics' },
  };
  const baseKey = () => (BASES[LS.get('mapBase', 'normal')] ? LS.get('mapBase', 'normal') : 'normal');
  function applyBase() {
    const map = app.map;
    if (!map) return;
    let cur = null;
    map.eachLayer(l => { if (l.options && l.options.lpBase) cur = l; });
    const want = baseKey();
    if (cur && cur.options.lpBase === want) return;
    const b = BASES[want];
    const layer = L.tileLayer(b.url, { maxZoom: b.maxZoom, maxNativeZoom: b.maxZoom, subdomains: b.subdomains || 'abc', attribution: b.attribution, lpBase: want });
    layer.addTo(map).bringToBack();
    if (cur) map.removeLayer(cur);
    document.getElementById('mapview').dataset.base = want;
  }

  /* ====================================================================== */
  /* Fotos auf der Karte                                                     */
  /* ====================================================================== */

  const photosOn = () => LS.get('mapPhotos', false) === true;
  const withPos = e => e && typeof e.lat === 'number' && typeof e.lng === 'number';
  function photoMarkers(layer, scope, t) {
    if (!photosOn() || scope !== 'trip' || !t || ui.mapEdit) return;
    const es = tripEntries(t).filter(e => withPos(e) && (e.photos || []).length).sort(byDate);
    const all = es.flatMap(e => e.photos.map(p => ({ id: p.id, thumb: p.thumb, entryId: e.id })));
    es.forEach(e => {
      const n = e.photos.length;
      const m = L.marker([e.lat, e.lng], {
        zIndexOffset: 400, photoThumb: e.photos[0].thumb,
        icon: L.divIcon({ className: '', html: `<div class="photo-pin"><img src="${e.photos[0].thumb}" alt="">${n > 1 ? `<b>${n}</b>` : ''}</div>`, iconSize: [48, 48], iconAnchor: [24, 24] }),
      }).on('click', () => app.openPhotos && app.openPhotos(all, all.findIndex(x => x.entryId === e.id)));
      m.photoEntry = e.id;
      m.addTo(layer);
    });
  }

  /* ====================================================================== */
  /* Pins bündeln                                                            */
  /* ====================================================================== */

  const clusterOn = () => LS.get('mapCluster', true) !== false;
  let hidden = [], clusterLayer = null;
  const RADIUS = 38;
  function recluster() {
    const map = app.map, rl = app.routeLayer;
    if (!map || !rl) return;
    if (!clusterLayer) clusterLayer = L.layerGroup().addTo(map);
    clusterLayer.clearLayers();
    hidden.forEach(m => { if (!rl.hasLayer(m)) rl.addLayer(m); });
    hidden = [];
    if (!clusterOn() || ui.mapEdit || map.getZoom() >= 16) return;
    const markers = [];
    rl.eachLayer(l => { if (l instanceof L.Marker && !(l.options && l.options.draggable)) markers.push(l); });
    const pts = markers.map(m => map.latLngToLayerPoint(m.getLatLng()));
    const used = new Set();
    // Fotos zuerst, damit ein Bündel möglichst ein Vorschaubild bekommt
    const order = markers.map((m, i) => i).sort((a, b) => (markers[b].options.photoThumb ? 1 : 0) - (markers[a].options.photoThumb ? 1 : 0));
    for (const i of order) {
      if (used.has(i)) continue;
      const group = order.filter(j => !used.has(j) && pts[i].distanceTo(pts[j]) < RADIUS);
      if (group.length < 2) continue;
      group.forEach(j => used.add(j));
      const ms = group.map(j => markers[j]);
      ms.forEach(m => rl.removeLayer(m));
      hidden.push(...ms);
      const ll = L.latLngBounds(ms.map(m => m.getLatLng()));
      const n = ms.filter(m => !m.photoEntry || !ms.some(x => x.entryId === m.photoEntry)).length;
      const thumb = (ms.find(m => m.options.photoThumb) || {}).options;
      const t = currentTrip();
      L.marker(ll.getCenter(), {
        zIndexOffset: 600,
        icon: L.divIcon({ className: '', iconSize: [40, 40], iconAnchor: [20, 20],
          html: `<div class="cluster${thumb ? ' ph' : ''}" style="--c:${tripColor(t)}${thumb ? `;background-image:url('${thumb.photoThumb}')` : ''}"><b>${n}</b></div>` }),
      }).on('click', () => openCluster(ms, ll)).addTo(clusterLayer);
    }
  }
  function openCluster(ms, ll) {
    const map = app.map;
    const ne = map.latLngToLayerPoint(ll.getNorthEast()), sw = map.latLngToLayerPoint(ll.getSouthWest());
    // Liegen die Pins (fast) übereinander: Liste statt weiter hineinzoomen
    if (ne.distanceTo(sw) < 6 || map.getZoom() >= 15) {
      const rows = ms.map(m => {
        const e = m.entryId && S.entries.find(x => x.id === m.entryId);
        if (e) return `<li><button class="link" data-action="open-entry" data-id="${e.id}">${esc(e.title || TYPES[e.type].label)}</button> <small>${fmtDay(e.date.slice(0, 10))}</small></li>`;
        if (m.photoEntry) return '';
        const c = m.getPopup && m.getPopup() && m.getPopup().getContent();
        return typeof c === 'string' ? `<li>${c.replace(/<[^>]+>/g, ' ').trim().slice(0, 60)}</li>` : '';
      }).filter(Boolean);
      L.popup().setLatLng(ll.getCenter()).setContent(`<ul class="cluster-list">${rows.join('')}</ul>`).openOn(map);
      return;
    }
    map.fitBounds(ll, { padding: [70, 70], maxZoom: Math.min(16, map.getZoom() + 4) });
  }

  /* ====================================================================== */
  /* Liste unter der Karte                                                   */
  /* ====================================================================== */

  let listDay = null, listOpen = false;
  const box = document.createElement('div');
  box.className = 'map-list';
  box.id = 'mapList';
  box.hidden = true;
  document.getElementById('mapview').appendChild(box);
  const days = t => [...new Set(tripEntries(t).map(e => e.date.slice(0, 10)))].sort();
  function drawList() {
    const t = currentTrip();
    const mv = document.getElementById('mapview');
    const show = t && ui.route === 'karte' && ui.mapScope === 'trip' && !ui.mapEdit && !document.body.classList.contains('split') && days(t).length;
    box.hidden = !show;
    mv.classList.toggle('has-list', !!show);
    mv.classList.toggle('list-open', !!show && listOpen);
    if (!show) return;
    const ds = days(t);
    if (!listDay || !ds.includes(listDay)) listDay = ds.includes(today()) ? today() : ds[ds.length - 1];
    const i = ds.indexOf(listDay);
    const st = app.tripStats(t);
    const n = st.firstDay ? Math.round((new Date(listDay + 'T12:00') - new Date(st.firstDay + 'T12:00')) / 864e5) + 1 : 0;
    const es = tripEntries(t).filter(e => e.date.slice(0, 10) === listDay).sort(byDate);
    box.innerHTML = `<button class="ml-handle" data-action="map-list-toggle" aria-expanded="${listOpen}">
        <i></i><span><b>${n > 0 ? `Tag ${n}` : fmtDay(listDay)}</b> · ${es.length} ${es.length === 1 ? 'Stopp' : 'Stopps'}</span><span class="ml-chev">${listOpen ? '▾' : '▴'}</span></button>
      ${listOpen ? `<div class="ml-body">
        <div class="ml-days"><button class="icon-btn" data-action="map-list-day" data-d="${i - 1}"${i ? '' : ' disabled'} aria-label="Voriger Tag">‹</button>
          <span>${fmtDay(listDay)}</span>
          <button class="icon-btn" data-action="map-list-day" data-d="${i + 1}"${i < ds.length - 1 ? '' : ' disabled'} aria-label="Nächster Tag">›</button></div>
        <ul>${es.map(e => `<li><button data-action="map-list-go" data-id="${e.id}"${withPos(e) ? '' : ' class="nopos"'}>
          <span class="node-mini" style="--c:${tripColor(t)}">${icon(e.type)}</span>
          <span class="txt"><b>${esc(e.title || TYPES[e.type].label)}</b><small>${fmtTime(e.date)}${e.place ? ` · ${esc(e.place)}` : ''}${withPos(e) ? '' : ' · ohne Position'}</small></span></button></li>`).join('')}</ul>
      </div>` : ''}`;
    mv.style.setProperty('--list-h', `${box.offsetHeight}px`);
  }
  ACTIONS['map-list-toggle'] = () => { listOpen = !listOpen; drawList(); if (listOpen) fitDay(); };
  ACTIONS['map-list-day'] = el => { const ds = days(currentTrip()); listDay = ds[+el.dataset.d] || listDay; drawList(); fitDay(); };
  function fitDay() {
    const t = currentTrip(), map = app.map;
    const pts = tripEntries(t).filter(e => withPos(e) && e.date.slice(0, 10) === listDay).map(e => [e.lat, e.lng]);
    if (!map || !pts.length) return;
    const pad = { paddingTopLeft: [40, 80], paddingBottomRight: [40, box.offsetHeight + 40], maxZoom: 15 };
    if (pts.length === 1) map.setView(pts[0], 14); else map.fitBounds(pts, pad);
  }
  ACTIONS['map-list-go'] = el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e) return;
    if (!withPos(e)) { app.openEntry(e.id); return; }
    const map = app.map;
    map.setView([e.lat, e.lng], Math.max(map.getZoom(), 16));
    setTimeout(() => app.routeLayer.eachLayer(l => { if (l.entryId === e.id && l.openPopup) l.openPopup(); }), 400);
  };
  // Leiste nach oben ziehen öffnet, nach unten schließt
  let dragY = null;
  box.addEventListener('touchstart', ev => { if (ev.target.closest('.ml-handle')) dragY = ev.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', ev => {
    if (dragY == null) return;
    const dy = ev.changedTouches[0].clientY - dragY;
    dragY = null;
    if (Math.abs(dy) > 30) { listOpen = dy < 0; drawList(); if (listOpen) fitDay(); }
  });

  /* ---------- Einbindung: nach jedem Zeichnen der Karte ---------- */

  app.mapHooks.push((layer, scope, t) => {
    applyBase();
    photoMarkers(layer, scope, t);
    setTimeout(() => { recluster(); drawList(); }, 0);
    if (!app.map._lpZoom) { app.map._lpZoom = true; app.map.on('zoomend', recluster); }
    return [];
  });
  // Liste auch ohne neues Zeichnen der Karte aktuell halten (Reiterwechsel, Zwei-Spalten)
  app.chromeHooks.push(() => setTimeout(drawList, 0));

  /* ---------- Ebenen-Fenster ergänzen ---------- */

  const layers = ACTIONS['map-layers'];
  ACTIONS['map-layers'] = el => {
    layers(el);
    const root = document.querySelector('#sheetBody .map-layers');
    if (!root) return;
    root.querySelector('.sheet-head').insertAdjacentHTML('afterend', `<div class="field"><span>Kartenart</span><div class="seg">${Object.entries(BASES).map(([k, b]) =>
      `<label><input type="radio" name="base" value="${k}" data-action="map-base"${baseKey() === k ? ' checked' : ''}><span>${b.label}</span></label>`).join('')}</div></div>`);
    root.insertAdjacentHTML('beforeend', `<label class="check"><input type="checkbox" data-action="map-photos"${photosOn() ? ' checked' : ''}><span>Fotos auf der Karte zeigen</span></label>
      <label class="check"><input type="checkbox" data-action="map-cluster"${clusterOn() ? ' checked' : ''}><span>Nahe Pins beim Herauszoomen bündeln</span></label>
      <p class="sub">Wanderkarte mit Höhenlinien (OpenTopoMap) und Luftbild (Esri) brauchen Internet; angesehene Ausschnitte bleiben für unterwegs gespeichert.</p>`);
  };
  CHANGES['map-base'] = el => { LS.set('mapBase', el.value); applyBase(); };
  CHANGES['map-photos'] = el => { LS.set('mapPhotos', el.checked); render(); };
  CHANGES['map-cluster'] = el => { LS.set('mapCluster', el.checked); recluster(); };
}
