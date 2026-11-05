// Reiseweg in Abschnitten: Aus den Punkten einer Reise (Einträge, Foto-Standorte, gemerkte Punkte) werden Abschnitte
// je Verkehrsmittel. Ein Eintrag „Flug“, „Bahnfahrt“, „Fähre“ oder „Hafen / Landgang“ ist selbst der Abschnitt
// (Variante A): von seinem Startort („Von“) oder sonst vom vorigen Punkt bis zu seinem Ort. Dazwischen gilt die
// Reiseart (Camper/Auto: Straße, Kreuzfahrt/Segeln: Schiff, Rad, Wandern). Ohne Abhängigkeiten, damit auch der
// Reiseblog (blog.js) es nutzen kann.

// Reisearten: Kennung, Name, Zeichen, Verkehrsmittel zwischen den Abschnitten
export const TRIP_KINDS = [
  ['camping', 'Camping', '🚐', 'road'], ['zelten', 'Zelten', '⛺', 'road'], ['motorrad', 'Motorrad', '🏍️', 'road'],
  ['auto', 'Auto + Unterkunft', '🚗', 'road'], ['flug', 'Flugreise', '✈️', 'road'], ['kreuzfahrt', 'Kreuzfahrt', '🚢', 'ship'],
  ['bahn', 'Bahnreise', '🚆', 'rail'], ['rad', 'Radtour', '🚲', 'bike'], ['wandern', 'Wandertour', '🥾', 'walk'],
  ['segeln', 'Segeln / Boot', '⛵', 'ship'], ['gemischt', 'Gemischt', '🔀', 'road'],
];
export const tripKind = t => (t && TRIP_KINDS.some(k => k[0] === t.kind) ? t.kind : 'camping');
export const kindInfo = k => TRIP_KINDS.find(x => x[0] === k) || TRIP_KINDS[0];

// Übernachtungen (zählen als Nacht)
export const NIGHT_TYPES = ['stellplatz', 'unterkunft', 'huette'];
export const isNight = type => NIGHT_TYPES.includes(type);

// Verkehrsmittel des Wegs, der bei Eintrag e ankommt; null = Reiseart gilt
export function legOf(e) {
  if (!e) return null;
  const x = e.extra || {};
  if (e.type === 'flug') return 'air';
  if (e.type === 'bahnfahrt') return 'rail';
  if (e.type === 'hafen') return 'ship';
  if (e.type === 'faehre' && (!x.kind || x.kind === 'Fähre')) return 'ship';
  if (e.type === 'mietwagen') return 'road';
  return null;
}
const fromOf = e => {
  const x = (e && e.extra) || {};
  return typeof x.fromLat === 'number' && typeof x.fromLng === 'number' ? [x.fromLat, x.fromLng] : null;
};

// pts: [{ lat, lng, e? }] nach Zeit sortiert → [{ mode, pts: [[lat,lng], …], e? }]
// Nach einem Mietwagen-Eintrag gilt bis zum nächsten Abschnitt „Straße“, auch bei Kreuzfahrt o. Ä.
export function splitLegs(points, kind = 'camping') {
  const base = kindInfo(kind)[3];
  const legs = [];
  let cur = null, mode = base;
  const push = (m, a, b, e) => {
    if (m === 'air' || m === 'rail' || m === 'ship') { legs.push({ mode: m, pts: [a, b], e }); cur = null; return; }
    if (cur && cur.mode === m) cur.pts.push(b);
    else { cur = { mode: m, pts: [a, b] }; legs.push(cur); }
  };
  for (let i = 1; i < points.length; i++) {
    const a = [points[i - 1].lat, points[i - 1].lng], b = [points[i].lat, points[i].lng], e = points[i].e;
    const leg = legOf(e);
    if (e && e.type === 'mietwagen') mode = 'road';
    if (leg && leg !== 'road') {
      const from = fromOf(e);
      // Mit eigenem Startort: bis dorthin gilt das bisherige Verkehrsmittel (z. B. Anfahrt zum Flughafen)
      if (from) { if (Math.abs(from[0] - a[0]) + Math.abs(from[1] - a[1]) > 0.002) push(mode, a, from); push(leg, from, b, e); }
      else push(leg, a, b, e);
    } else push(mode, a, b, e);
  }
  // Erster Eintrag ist ein Flug o. Ä. mit Startort: auch ohne Punkt davor zeigen
  const e0 = points[0] && points[0].e;
  if (e0 && legOf(e0) && legOf(e0) !== 'road' && fromOf(e0)) legs.unshift({ mode: legOf(e0), pts: [fromOf(e0), [points[0].lat, points[0].lng]], e: e0 });
  return legs.filter(l => l.pts.length > 1);
}

// Luftlinie in km
export function kmBetween(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
export const legKm = l => { let d = 0; for (let i = 1; i < l.pts.length; i++) d += kmBetween(l.pts[i - 1], l.pts[i]); return d; };

// Bogen für einen Flug: leicht gekrümmt (wie auf Flugkarten), n Punkte
export function arcPts(a, b, n = 40) {
  const [x1, y1] = [a[1], a[0]], [x2, y2] = [b[1], b[0]];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1, bend = Math.min(0.2 * len, 12);
  // Nach Norden ausbeulen (wie die Großkreise auf der Nordhalbkugel)
  const sx = -dy / len, sy = dx / len, sgn = sy >= 0 ? 1 : -1;
  const cx = mx + sx * bend * sgn, cy = my + sy * bend * sgn;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * y1 + 2 * u * t * cy + t * t * y2, u * u * x1 + 2 * u * t * cx + t * t * x2]);
  }
  return out;
}

// Linienstil je Verkehrsmittel (Leaflet)
export const LEG_STYLE = {
  road: null,                                                     // wie bisher in der Farbe der Reise
  air: { color: '#5B6B7A', weight: 2.5, dashArray: '6 7', opacity: 0.9 },
  ship: { color: '#2E7FB8', weight: 3, dashArray: '8 8', opacity: 0.9 },
  rail: { color: '#7A4E9C', weight: 3, dashArray: '1 7', lineCap: 'round', opacity: 0.95 },
  bike: { color: '#3E7B32', weight: 3.5, opacity: 0.9 },
  walk: { color: '#3E7B32', weight: 3, dashArray: '2 6', lineCap: 'round', opacity: 0.9 },
};
export const LEG_NAME = { road: 'Straße', air: 'Flug', ship: 'Schiff / Fähre', rail: 'Bahn', bike: 'Rad', walk: 'zu Fuß' };
export const LEG_EMOJI = { road: '🚐', air: '✈️', ship: '⛴️', rail: '🚆', bike: '🚲', walk: '🥾' };

// Sonderabschnitte (Flug, Schiff, Bahn) auf eine Leaflet-Ebene zeichnen; Straßenabschnitte übernimmt der Aufrufer
export function drawSpecialLegs(L, layer, legs, { plane = true } = {}) {
  const out = [];
  legs.forEach(l => {
    const st = LEG_STYLE[l.mode];
    if (!st || l.mode === 'bike' || l.mode === 'walk') return;
    const line = l.mode === 'air' ? arcPts(l.pts[0], l.pts[l.pts.length - 1]) : l.pts;
    L.polyline(line, st).addTo(layer);
    out.push(...line);
    if (l.mode === 'air' && plane) {
      const m = line[Math.floor(line.length / 2)], m2 = line[Math.floor(line.length / 2) + 1] || m;
      const deg = Math.atan2(m2[1] - m[1], m2[0] - m[0]) * 180 / Math.PI;
      // ✈️ zeigt nach rechts oben (45°); so drehen, dass es in Flugrichtung zeigt
      L.marker(m, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'leg-plane', html: `<span style="transform:rotate(${(deg - 45).toFixed(0)}deg)">✈️</span>`, iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(layer);
    }
  });
  return out;
}
