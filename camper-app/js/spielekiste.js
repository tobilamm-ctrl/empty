// Spielekiste: Hauptstädte-Quiz, Umriss-Quiz, Wo liegt das?, Punkteblock, Kniffel, Farben-Merkspiel (wie Senso),
// Wer ist schneller?, Würdest du lieber …? und Tick-Tack-Bumm. Alles geht ohne Internet.

import { flagImg } from './flaggen.js';

export default function installSpielekiste(app) {
  const { S, LS, ui, ACTIONS, FORMS, esc, icon, newId, save, remove, toast, render, members, me, personName, km, openSheet, closeSheet, currentTrip } = app;
  const sheetHead = app.sheetHead;
  const player = () => (app.player ? app.player() : me());
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const best = (k, v, lower) => { const key = `best.${k}.${player()}`, old = LS.get(key, null); if (old == null || (lower ? v < old : v > old)) { LS.set(key, v); return true; } return false; };
  const bestOf = k => LS.get(`best.${k}.${player()}`, null);

  // Töne (Senso, Tick-Tack-Bumm)
  let actx = null;
  function tone(f, ms = 180, type = 'sine', vol = 0.18) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = vol;
      o.connect(g); g.connect(actx.destination);
      g.gain.setTargetAtTime(0, actx.currentTime + ms / 1000 * 0.7, 0.03);
      o.start(); o.stop(actx.currentTime + ms / 1000 + 0.1);
    } catch { /* ohne Ton */ }
  }

  const NEW = [
    ['hauptstadt', 'Hauptstädte-Quiz', 'Land und Hauptstadt zuordnen'],
    ['umriss', 'Umriss-Quiz', 'Welches Land hat diese Form?'],
    ['woliegt', 'Wo liegt das?', 'Auf der Karte tippen, je näher, desto besser'],
    ['kniffel', 'Kniffel', 'Fünf Würfel, dreimal würfeln'],
    ['block', 'Punkteblock', 'Uno, Rommé, Mölkky, Boule …'],
    ['senso', 'Farben-Merkspiel', 'Folge nachtippen, wird immer länger'],
    ['schneller', 'Wer ist schneller?', 'Zwei Spieler, ein Handy'],
    ['lieber', 'Würdest du lieber …?', 'Zwei Möglichkeiten, alle entscheiden'],
    ['bumm', 'Tick-Tack-Bumm', 'Begriffe nennen, bevor die Bombe platzt'],
  ];
  const at = app.GAMES.findIndex(g => g[0] === 'brettspiele');
  app.GAMES.splice(at < 0 ? app.GAMES.length : at, 0, ...NEW);
  app.noPlayerBar = [...(app.noPlayerBar || []), 'kniffel', 'block', 'schneller', 'lieber', 'bumm'];
  Object.assign(app.GAME_ART, {
    hauptstadt: '<path d="M10 40h44"/><path d="M16 40V24h32v16M14 24l18-12 18 12" fill="var(--paper)"/><path d="M22 40V30h6v10M36 40V30h6v10"/><path d="M32 12V4l8 3-8 3" fill="#B3261E" stroke="#B3261E"/>',
    umriss: '<path d="M14 10l10 4 8-6 10 6 8 2-2 10 6 8-8 10-12-2-6 8-10-6-4-10-6-6 4-8z" fill="var(--paper)" stroke-dasharray="3 3"/><text x="32" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">?</text>',
    woliegt: '<rect x="6" y="6" width="52" height="36" rx="4" fill="#CFE3EE"/><path d="M14 30q6-14 16-10t14-6q6 2 6 10t-12 10-24-4z" fill="var(--paper)"/><path d="M38 22q0-8 7-8t7 8q0 5-7 12-7-7-7-12z" fill="#B3261E" stroke="none"/><circle cx="45" cy="21" r="2.5" fill="#fff" stroke="none"/>',
    kniffel: '<rect x="8" y="12" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(-8 19 23)"/><rect x="34" y="14" width="22" height="22" rx="4" fill="var(--paper)" transform="rotate(10 45 25)"/><g fill="currentColor" stroke="none"><circle cx="14" cy="18" r="2"/><circle cx="24" cy="28" r="2"/><circle cx="19" cy="23" r="2"/><circle cx="40" cy="20" r="2"/><circle cx="50" cy="20" r="2"/><circle cx="40" cy="30" r="2"/><circle cx="50" cy="30" r="2"/><circle cx="45" cy="25" r="2"/></g>',
    block: '<rect x="14" y="6" width="36" height="38" rx="3" fill="var(--paper)"/><path d="M14 14h36M30 6v38M20 21h4M36 21h6M20 28h4M36 28h4M20 35h4M36 35h6"/>',
    senso: '<path d="M32 6a18 18 0 0 1 18 18H32z" fill="#4F8A3C"/><path d="M50 26a18 18 0 0 1-18 18V26z" fill="#2E7FB8"/><path d="M30 44a18 18 0 0 1-18-18h18z" fill="#F2C94C"/><path d="M12 24A18 18 0 0 1 30 6v18z" fill="#E4572E"/>',
    schneller: '<path d="M10 24h44" stroke-dasharray="4 4"/><circle cx="32" cy="24" r="10" fill="#4F8A3C"/><path d="M20 10l-6-4M44 10l6-4M20 38l-6 4M44 38l6 4"/>',
    lieber: '<rect x="6" y="10" width="22" height="28" rx="4" fill="#FBE0D5"/><rect x="36" y="10" width="22" height="28" rx="4" fill="#DFF1D8"/><text x="17" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">A</text><text x="47" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">B</text>',
    bumm: '<circle cx="28" cy="30" r="14" fill="#3A2617"/><path d="M36 18l6-6M42 12q4-2 6 2M46 8l4-2M50 12l4 1M48 16l3 3" stroke="#E4572E"/><circle cx="23" cy="25" r="3" fill="#fff" stroke="none" opacity=".5"/>',
  });

  /* ====================================================================== */
  /* Hauptstädte-Quiz                                                        */
  /* ====================================================================== */

  const CAP = {
    DE: 'Berlin', AT: 'Wien', CH: 'Bern', FR: 'Paris', IT: 'Rom', ES: 'Madrid', PT: 'Lissabon', NL: 'Amsterdam', BE: 'Brüssel', LU: 'Luxemburg',
    DK: 'Kopenhagen', SE: 'Stockholm', NO: 'Oslo', FI: 'Helsinki', IS: 'Reykjavík', IE: 'Dublin', GB: 'London', PL: 'Warschau', CZ: 'Prag', SK: 'Bratislava',
    HU: 'Budapest', SI: 'Ljubljana', HR: 'Zagreb', BA: 'Sarajevo', RS: 'Belgrad', ME: 'Podgorica', AL: 'Tirana', MK: 'Skopje', GR: 'Athen', BG: 'Sofia',
    RO: 'Bukarest', MD: 'Chișinău', UA: 'Kiew', BY: 'Minsk', LT: 'Vilnius', LV: 'Riga', EE: 'Tallinn', MT: 'Valletta', CY: 'Nikosia', TR: 'Ankara',
    MC: 'Monaco', SM: 'San Marino', LI: 'Vaduz', AD: 'Andorra la Vella', VA: 'Vatikanstadt', XK: 'Pristina', RU: 'Moskau',
    US: 'Washington', CA: 'Ottawa', MX: 'Mexiko-Stadt', BR: 'Brasília', AR: 'Buenos Aires', CL: 'Santiago de Chile', PE: 'Lima', CO: 'Bogotá',
    CN: 'Peking', JP: 'Tokio', KR: 'Seoul', IN: 'Neu-Delhi', TH: 'Bangkok', VN: 'Hanoi', ID: 'Jakarta', AU: 'Canberra', NZ: 'Wellington',
    EG: 'Kairo', MA: 'Rabat', TN: 'Tunis', ZA: 'Pretoria', KE: 'Nairobi', NG: 'Abuja', IL: 'Jerusalem', SA: 'Riad', IR: 'Teheran',
  };
  const EU = 'DE AT CH FR IT ES PT NL BE LU DK SE NO FI IS IE GB PL CZ SK HU SI HR BA RS ME AL MK GR BG RO MD UA BY LT LV EE MT CY TR MC SM LI AD VA XK RU'.split(' ');
  const cname = cc => (app.COUNTRIES && app.COUNTRIES[cc] && app.COUNTRIES[cc].name) || (() => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } })();
  let hq = null;   // { mode, area, list, i, ok, answered }
  function hqNew() {
    const o = LS.get('hq.opt', { mode: 'land', area: 'eu' });
    const pool = Object.keys(CAP).filter(cc => o.area === 'welt' || EU.includes(cc));
    hq = { ...o, list: shuffle(pool).slice(0, 10), i: 0, ok: 0, answered: null };
  }
  function hqView() {
    const o = LS.get('hq.opt', { mode: 'land', area: 'eu' });
    if (!hq) return `<p>Kennst du die Hauptstädte? Zehn Fragen pro Runde.</p>
      <div class="seg"><button class="${o.mode === 'land' ? 'on' : ''}" data-action="hq-opt" data-k="mode" data-v="land">Land → Hauptstadt</button><button class="${o.mode === 'stadt' ? 'on' : ''}" data-action="hq-opt" data-k="mode" data-v="stadt">Hauptstadt → Land</button></div>
      <div class="seg"><button class="${o.area === 'eu' ? 'on' : ''}" data-action="hq-opt" data-k="area" data-v="eu">Europa</button><button class="${o.area === 'welt' ? 'on' : ''}" data-action="hq-opt" data-k="area" data-v="welt">Welt</button></div>
      <button class="primary" data-action="hq-start">Los geht’s</button>${bestOf('hauptstadt') != null ? `<p class="sub">Rekord: ${bestOf('hauptstadt')} von 10</p>` : ''}`;
    if (hq.i >= hq.list.length) {
      const rec = best('hauptstadt', hq.ok);
      return `<div class="quiz-end"><p class="win">${hq.ok} von ${hq.list.length} richtig!${rec ? ' Neuer Rekord 🎉' : ''}</p><button class="primary" data-action="hq-start">Nochmal</button></div>`;
    }
    const cc = hq.list[hq.i];
    const same = Object.keys(CAP).filter(x => x !== cc && (hq.area === 'welt' || EU.includes(x)));
    hq.opts = hq.opts && hq.opts.cc === cc ? hq.opts : { cc, list: shuffle([cc, ...shuffle(same).slice(0, 3)]) };
    const label = x => (hq.mode === 'land' ? CAP[x] : cname(x));
    return `<p class="plate-progress">Frage ${hq.i + 1} von ${hq.list.length} · ${hq.ok} richtig</p>
      <div class="quiz-q">${hq.mode === 'land' ? `${flagImg(cc, 'fl big')}<b>${esc(cname(cc))}</b><span>Wie heißt die Hauptstadt?</span>` : `<b>${esc(CAP[cc])}</b><span>Hauptstadt von welchem Land?</span>`}</div>
      <div class="quiz-opts">${hq.opts.list.map(x => `<button class="${hq.answered ? (x === cc ? 'right' : x === hq.answered ? 'wrong' : '') : ''}" data-action="hq-answer" data-cc="${x}"${hq.answered ? ' disabled' : ''}>
        ${hq.mode === 'stadt' ? flagImg(x) : ''}${esc(label(x))}</button>`).join('')}</div>
      ${hq.answered ? `<button class="primary" data-action="hq-next">Weiter</button>` : ''}`;
  }
  ACTIONS['hq-opt'] = el => { LS.set('hq.opt', { ...LS.get('hq.opt', { mode: 'land', area: 'eu' }), [el.dataset.k]: el.dataset.v }); render(); };
  ACTIONS['hq-start'] = () => { hqNew(); render(); };
  ACTIONS['hq-answer'] = el => { if (hq.answered) return; hq.answered = el.dataset.cc; if (hq.answered === hq.list[hq.i]) { hq.ok++; tone(880, 120); } else { tone(200, 250, 'square', 0.08); if (navigator.vibrate) navigator.vibrate(80); } render(); };
  ACTIONS['hq-next'] = () => { hq.i++; hq.answered = null; hq.opts = null; render(); };

  /* ====================================================================== */
  /* Umriss-Quiz und Wo liegt das? (Grenzen der Rubbelkarte)                 */
  /* ====================================================================== */

  let world = null, worldLoading = null;
  const loadWorld = () => worldLoading || (worldLoading = fetch('vendor/welt/laender.json').then(r => r.json()).then(d => { world = d.features; render(); }).catch(() => { worldLoading = null; }));
  const rings = f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
  const ringArea = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  // Umriss: nur das Hauptgebiet (größte Fläche) und Teile in dessen Nähe, damit Überseegebiete nicht stören
  function outline(f, W = 300, H = 220) {
    const polys = rings(f).map(p => p[0]);
    const main = polys.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a));
    const cx = main.reduce((s, p) => s + p[0], 0) / main.length, cy = main.reduce((s, p) => s + p[1], 0) / main.length;
    const keep = polys.filter(p => ringArea(p) > ringArea(main) * 0.01 && Math.abs(p[0][0] - cx) < 25 && Math.abs(p[0][1] - cy) < 15);
    const pts = keep.flat();
    const xs = pts.map(p => p[0]), ys = pts.map(p => -mercY(p[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W - 20) / (x1 - x0 || 1), (H - 20) / (y1 - y0 || 1));
    const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
    const d = keep.map(r => 'M' + r.map(p => `${((p[0] - x0) * s + ox).toFixed(1)},${((-mercY(p[1]) - y0) * s + oy).toFixed(1)}`).join('L') + 'Z').join('');
    return `<svg class="outline-svg" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="var(--trip, #0F6670)" fill-opacity=".85" stroke="#fff" stroke-width="1.5"/></svg>`;
  }
  let uq = null;
  function uqView() {
    if (!world) { loadWorld(); return '<p class="sub">Die Länderkarte wird geladen …</p>'; }
    const o = LS.get('uq.opt', { area: 'eu' });
    const pool = world.filter(f => f.properties.cc && f.properties.ct !== 'Seven seas (open ocean)' && (o.area === 'welt' || f.properties.ct === 'Europe') && ringArea(rings(f).map(p => p[0]).reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a))) > (o.area === 'welt' ? 2 : 0.05));
    if (!uq) return `<p>Welches Land hat diesen Umriss? Zehn Länder pro Runde.</p>
      <div class="seg"><button class="${o.area === 'eu' ? 'on' : ''}" data-action="uq-opt" data-v="eu">Europa</button><button class="${o.area === 'welt' ? 'on' : ''}" data-action="uq-opt" data-v="welt">Welt</button></div>
      <button class="primary" data-action="uq-start">Los geht’s</button>${bestOf('umriss') != null ? `<p class="sub">Rekord: ${bestOf('umriss')} von 10</p>` : ''}`;
    if (!uq.list) uq.list = shuffle(pool).slice(0, 10).map(f => f.properties.cc);
    if (uq.i >= uq.list.length) {
      const rec = best('umriss', uq.ok);
      return `<div class="quiz-end"><p class="win">${uq.ok} von ${uq.list.length} erkannt!${rec ? ' Neuer Rekord 🎉' : ''}</p><button class="primary" data-action="uq-start">Nochmal</button></div>`;
    }
    const cc = uq.list[uq.i], f = world.find(x => x.properties.cc === cc);
    if (!uq.opts || uq.opts.cc !== cc) {
      const near = pool.filter(x => x.properties.cc !== cc && x.properties.ct === f.properties.ct);
      uq.opts = { cc, list: shuffle([f, ...shuffle(near).slice(0, 3)]).map(x => x.properties) };
    }
    return `<p class="plate-progress">Land ${uq.i + 1} von ${uq.list.length} · ${uq.ok} richtig</p>
      <div class="quiz-shape">${outline(f)}</div>
      <div class="quiz-opts">${uq.opts.list.map(p => `<button class="${uq.answered ? (p.cc === cc ? 'right' : p.cc === uq.answered ? 'wrong' : '') : ''}" data-action="uq-answer" data-cc="${p.cc}"${uq.answered ? ' disabled' : ''}>${uq.answered ? flagImg(p.cc) : ''}${esc(p.nm)}</button>`).join('')}</div>
      ${uq.answered ? `<button class="primary" data-action="uq-next">Weiter</button>` : `<button class="link" data-action="uq-hint">Tipp: Flagge zeigen</button>${uq.hint ? `<p class="quiz-hint">${flagImg(cc, 'fl big')}</p>` : ''}`}`;
  }
  ACTIONS['uq-opt'] = el => { LS.set('uq.opt', { area: el.dataset.v }); render(); };
  ACTIONS['uq-start'] = () => { uq = { i: 0, ok: 0 }; render(); };
  ACTIONS['uq-hint'] = () => { uq.hint = true; render(); };
  ACTIONS['uq-answer'] = el => { if (uq.answered) return; uq.answered = el.dataset.cc; if (uq.answered === uq.list[uq.i]) { uq.ok += uq.hint ? 0.5 : 1; tone(880, 120); } else tone(200, 250, 'square', 0.08); render(); };
  ACTIONS['uq-next'] = () => { uq.i++; uq.answered = null; uq.opts = null; uq.hint = false; render(); };

  // Wo liegt das? Karte von Europa ohne Namen; tippen, dann zeigt die App den richtigen Ort
  const PLACES = [['Berlin', 52.52, 13.40], ['Paris', 48.86, 2.35], ['Rom', 41.90, 12.50], ['Madrid', 40.42, -3.70], ['Lissabon', 38.72, -9.14], ['Wien', 48.21, 16.37],
    ['Zürich', 47.37, 8.54], ['Amsterdam', 52.37, 4.90], ['Kopenhagen', 55.68, 12.57], ['Stockholm', 59.33, 18.07], ['Oslo', 59.91, 10.75], ['Helsinki', 60.17, 24.94],
    ['London', 51.51, -0.13], ['Dublin', 53.35, -6.26], ['Edinburgh', 55.95, -3.19], ['Warschau', 52.23, 21.01], ['Prag', 50.08, 14.44], ['Budapest', 47.50, 19.04],
    ['Athen', 37.98, 23.73], ['Istanbul', 41.01, 28.98], ['Dubrovnik', 42.65, 18.09], ['Split', 43.51, 16.44], ['Venedig', 45.44, 12.33], ['Florenz', 43.77, 11.26],
    ['Neapel', 40.85, 14.27], ['Barcelona', 41.39, 2.17], ['Sevilla', 37.39, -5.98], ['Marseille', 43.30, 5.37], ['Nizza', 43.70, 7.27], ['Bordeaux', 44.84, -0.58],
    ['Gardasee', 45.65, 10.65], ['Bodensee', 47.60, 9.40], ['Sylt', 54.90, 8.31], ['Rügen', 54.43, 13.43], ['Mont-Saint-Michel', 48.64, -1.51], ['Nordkap', 71.17, 25.78],
    ['Lofoten', 68.23, 14.56], ['Toskana (Siena)', 43.32, 11.33], ['Korsika (Ajaccio)', 41.92, 8.74], ['Sardinien (Cagliari)', 39.22, 9.12], ['Sizilien (Palermo)', 38.12, 13.36],
    ['Zugspitze', 47.42, 10.98], ['Matterhorn', 45.98, 7.66], ['Mont Blanc', 45.83, 6.86], ['Plitvicer Seen', 44.88, 15.62], ['Algarve (Lagos)', 37.10, -8.67],
    ['Brügge', 51.21, 3.22], ['Salzburg', 47.80, 13.04], ['München', 48.14, 11.58], ['Hamburg', 53.55, 9.99], ['Köln', 50.94, 6.96], ['Dresden', 51.05, 13.74],
    ['Krakau', 50.06, 19.94], ['Ljubljana', 46.06, 14.51], ['Bled', 46.37, 14.11], ['Reykjavík', 64.15, -21.94], ['Bretagne (Brest)', 48.39, -4.49], ['Elba', 42.78, 10.28]];
  const MAP = { W: 600, H: 560, lng0: -25, lng1: 45, lat0: 34, lat1: 72 };
  const px = (lat, lng) => { const y0 = mercY(MAP.lat1), y1 = mercY(MAP.lat0); return [(lng - MAP.lng0) / (MAP.lng1 - MAP.lng0) * MAP.W, (y0 - mercY(lat)) / (y0 - y1) * MAP.H]; };
  const unpx = (x, y) => { const y0 = mercY(MAP.lat1), y1 = mercY(MAP.lat0); const my = y0 - y / MAP.H * (y0 - y1); return { lat: Math.atan(Math.sinh(my * Math.PI / 180)) * 180 / Math.PI, lng: MAP.lng0 + x / MAP.W * (MAP.lng1 - MAP.lng0) }; };
  let euroPath = null;
  function euroMap() {
    if (euroPath) return euroPath;
    euroPath = world.filter(f => f.properties.ct !== 'Seven seas (open ocean)').map(f => rings(f).map(poly => {
      const r = poly[0];
      if (!r.some(p => p[0] > MAP.lng0 - 5 && p[0] < MAP.lng1 + 5 && p[1] > MAP.lat0 - 5 && p[1] < MAP.lat1 + 5)) return '';
      return 'M' + r.map(p => px(Math.max(-85, Math.min(85, p[1])), p[0]).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
    }).join('')).join('');
    return euroPath;
  }
  let wl = null;   // { list, i, score, guess, dist }
  function wlView() {
    if (!world) { loadWorld(); return '<p class="sub">Die Karte wird geladen …</p>'; }
    if (!wl) return `<p>Wo liegt der Ort? Tippe auf die Karte. Je näher, desto mehr Punkte (höchstens 1000 pro Ort).</p>
      <button class="primary" data-action="wl-start">Fünf Orte</button>${bestOf('woliegt') != null ? `<p class="sub">Rekord: ${bestOf('woliegt')} Punkte</p>` : ''}`;
    if (wl.i >= wl.list.length) {
      const rec = best('woliegt', wl.score);
      return `<div class="quiz-end"><p class="win">${wl.score} Punkte!${rec ? ' Neuer Rekord 🎉' : ''}</p><button class="primary" data-action="wl-start">Nochmal</button></div>`;
    }
    const [name, lat, lng] = wl.list[wl.i];
    const t = px(lat, lng), g = wl.guess ? px(wl.guess.lat, wl.guess.lng) : null;
    return `<p class="plate-progress">Ort ${wl.i + 1} von ${wl.list.length} · ${wl.score} Punkte</p>
      <p class="wl-q">Wo liegt <b>${esc(name)}</b>?</p>
      <svg class="wl-map" id="wlMap" viewBox="0 0 ${MAP.W} ${MAP.H}" data-noswipe><rect width="${MAP.W}" height="${MAP.H}" fill="#CFE3EE"/><path d="${euroMap()}" fill="#F3EBDA" stroke="#B9A88C" stroke-width=".7"/>
        ${g ? `<line x1="${g[0]}" y1="${g[1]}" x2="${t[0]}" y2="${t[1]}" stroke="#3A2617" stroke-width="2" stroke-dasharray="5 5"/>
          <circle cx="${g[0]}" cy="${g[1]}" r="7" fill="#E4572E" stroke="#fff" stroke-width="2"/><circle cx="${t[0]}" cy="${t[1]}" r="8" fill="#4F8A3C" stroke="#fff" stroke-width="2"/>` : ''}</svg>
      ${wl.guess ? `<p class="wl-res">${Math.round(wl.dist).toLocaleString('de-DE')} km daneben · <b>+${wl.pts}</b></p><button class="primary" data-action="wl-next">Weiter</button>` : ''}`;
  }
  ACTIONS['wl-start'] = () => { wl = { list: shuffle(PLACES).slice(0, 5), i: 0, score: 0 }; render(); };
  ACTIONS['wl-next'] = () => { wl.i++; wl.guess = null; render(); };
  document.addEventListener('click', ev => {
    const svg = ev.target.closest && ev.target.closest('#wlMap');
    if (!svg || !wl || wl.guess) return;
    const r = svg.getBoundingClientRect();
    const g = unpx((ev.clientX - r.left) / r.width * MAP.W, (ev.clientY - r.top) / r.height * MAP.H);
    const [, lat, lng] = wl.list[wl.i];
    wl.guess = g;
    wl.dist = km(g, { lat, lng });
    wl.pts = Math.round(1000 * Math.exp(-wl.dist / 350));
    wl.score += wl.pts;
    tone(wl.pts > 700 ? 880 : wl.pts > 300 ? 660 : 330, 160);
    render();
  });

  /* ====================================================================== */
  /* Punkteblock                                                             */
  /* ====================================================================== */

  const blocks = () => S.games.filter(g => g.kind === 'block').sort((a, b) => (b.at || 0) - (a.at || 0));
  const totals = b => b.players.map((_, i) => b.rounds.reduce((s, r) => s + (+r[i] || 0), 0));
  const leader = b => { const t = totals(b); const v = b.low ? Math.min(...t) : Math.max(...t); return t.map((x, i) => (x === v && b.rounds.length ? i : -1)).filter(i => i >= 0); };
  const PRESETS_B = [['Uno', true], ['Rommé', true], ['Mölkky', false], ['Boule', false], ['Wizard', false], ['Skat', false], ['Phase 10', true], ['Eigenes Spiel', false]];
  // Zu welcher Reise gehört ein Block? Neue Blöcke merken sich die Reise, ältere werden über das Datum zugeordnet
  const dayOf = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function tripOfBlock(b) {
    if (b.tripId) return b.tripId;
    const d = dayOf(b.at || 0);
    const t = S.trips.find(x => x.start && x.start <= d && (x.end || app.today()) >= d);
    return t ? t.id : null;
  }
  const scopeBlocks = tripId => blocks().filter(b => !tripId || tripOfBlock(b) === tripId);

  // Gesamtwertung: beendete Spiele, Siege je Person (bei Gleichstand zählt der Sieg für alle Führenden)
  function standings(list) {
    const ppl = {}, games = {};
    list.filter(b => b.done && b.rounds.length).forEach(b => {
      const l = leader(b), t = totals(b);
      const g = games[b.name] = games[b.name] || { n: 0, wins: {}, top: null };
      g.n++;
      b.players.forEach((p, i) => {
        const r = ppl[p] = ppl[p] || { name: p, played: 0, wins: 0 };
        r.played++;
        if (l.includes(i)) { r.wins++; g.wins[p] = (g.wins[p] || 0) + 1; }
        // Höchstwert je Spiel (bei „wenigste Punkte gewinnen“ ohne Sinn)
        if (!b.low && (!g.top || t[i] > g.top.v)) g.top = { v: t[i], name: p };
      });
    });
    const rows = Object.values(ppl).sort((a, b) => b.wins - a.wins || b.wins / b.played - a.wins / a.played || a.name.localeCompare(b.name));
    return { rows, games: Object.entries(games).sort((a, b) => b[1].n - a[1].n) };
  }
  function standingsView() {
    const t = currentTrip();
    const scope = t && ui.blockScope !== 'all' ? t.id : null;
    const { rows, games } = standings(scopeBlocks(scope));
    const meName = personName(player());
    return `<section class="leader block-stats"><h3 class="date-head">Wertung ${scope ? `für „${esc(t.name)}“` : 'aller Reisen'}</h3>
      ${t ? `<div class="chips"><button class="chip${scope ? ' on' : ''}" data-action="block-scope" data-s="trip">Diese Reise</button><button class="chip${scope ? '' : ' on'}" data-action="block-scope" data-s="all">Alle Reisen</button></div>` : ''}
      ${rows.length ? `<ol>${rows.map((r, i) => `<li class="${r.name === meName ? 'me' : ''}"><span>${esc(r.name)}${r.wins && r.wins === rows[0].wins ? ' 👑' : ''}</span><b>${r.wins}</b><small>${r.wins === 1 ? 'Sieg' : 'Siege'} · ${r.played} ${r.played === 1 ? 'Spiel' : 'Spiele'}</small></li>`).join('')}</ol>
        <p class="block-games-h">Je Spiel</p><ul class="block-games">${games.map(([name, g]) => { const w = Object.entries(g.wins).sort((a, b) => b[1] - a[1]);
          return `<li><b>${esc(name)}</b> <small>${g.n}×</small><span>${w.map(([p, n]) => `${esc(p)} ${n}`).join(' · ')}${g.top ? `<small> · Höchstwert ${g.top.v} (${esc(g.top.name)})</small>` : ''}</span></li>`; }).join('')}</ul>`
        : `<p class="sub">Noch keine beendeten Spiele${scope ? ' auf dieser Reise' : ''}. Beendete Punkteblöcke und Kniffel-Partien zählen hier mit.</p>`}</section>`;
  }
  ACTIONS['block-scope'] = el => { ui.blockScope = el.dataset.s; render(); };
  app.gameStandings = tripId => standings(scopeBlocks(tripId));

  function blockView() {
    const open = ui.block && S.games.find(g => g.id === ui.block);
    if (!open) {
      const t = currentTrip();
      const list = scopeBlocks(t && ui.blockScope !== 'all' ? t.id : null);
      return `<p>Für Kartenspiele, Mölkky oder Boule: Runden eintragen, LAMMping rechnet und zeigt, wer vorne liegt.</p>
        <button class="primary" data-action="block-new">${icon('plus')}Neuer Punkteblock</button>
        ${standingsView()}
        ${list.length ? `<ul class="ledger">${list.slice(0, 20).map(b => { const t = totals(b), l = leader(b); return `<li><button data-action="block-open" data-id="${b.id}">
          <span class="txt"><b>${esc(b.name)}</b><small>${new Date(b.at).toLocaleDateString('de-DE')} · ${b.rounds.length} ${b.rounds.length === 1 ? 'Runde' : 'Runden'}${b.done && l.length ? ` · gewonnen: ${l.map(i => esc(b.players[i])).join(', ')}` : ''}</small></span>
          <span class="amt">${t.join(' : ')}</span></button></li>`; }).join('')}</ul>` : ''}`;
    }
    const b = open, t = totals(b), l = leader(b);
    return `<p class="plate-progress"><b>${esc(b.name)}</b> · ${b.low ? 'wenigste Punkte gewinnen' : 'meiste Punkte gewinnen'}${b.goal ? ` · Ziel ${b.goal}` : ''}</p>
      <div class="block-table" data-noswipe><table><thead><tr><th>#</th>${b.players.map((p, i) => `<th class="${l.includes(i) ? 'lead' : ''}">${esc(p)}</th>`).join('')}</tr></thead>
        <tbody>${b.rounds.map((r, k) => `<tr><td>${k + 1}</td>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
        <tfoot><tr><td>Σ</td>${t.map((v, i) => `<td class="${l.includes(i) ? 'lead' : ''}">${v}${l.includes(i) && b.rounds.length ? ' 👑' : ''}</td>`).join('')}</tr></tfoot></table></div>
      ${b.done ? `<p class="win">Gewonnen: ${l.map(i => esc(b.players[i])).join(', ')} 🎉</p>` : `<form data-form="block-round" data-id="${b.id}" class="block-round">${b.players.map((p, i) => `<label class="field"><span>${esc(p)}</span><input name="p${i}" inputmode="numeric" pattern="-?[0-9]*" placeholder="0"></label>`).join('')}
        <button class="primary">Runde eintragen</button></form>`}
      <div class="btnrow">${b.rounds.length && !b.done ? `<button class="ghost" data-action="block-undo" data-id="${b.id}">Letzte Runde löschen</button><button class="ghost" data-action="block-end" data-id="${b.id}">Spiel beenden</button>` : ''}
        <button class="ghost" data-action="block-close">Alle Blöcke</button>${b.done ? `<button class="ghost danger" data-action="block-del" data-id="${b.id}">Löschen</button>` : ''}</div>`;
  }
  ACTIONS['block-new'] = () => openSheet(`<form data-form="block-new">${sheetHead('Neuer Punkteblock')}
    <div class="chips wrap">${PRESETS_B.map(([n, low]) => `<button type="button" class="chip" data-action="block-preset" data-n="${n}" data-low="${low ? 1 : ''}">${n}</button>`).join('')}</div>
    <label class="field"><span>Spiel</span><input name="name" required value="Uno"></label>
    <label class="check"><input type="checkbox" name="low" checked><span>Wer die wenigsten Punkte hat, gewinnt</span></label>
    <label class="field"><span>Punkteziel (optional, beendet das Spiel)</span><input name="goal" inputmode="numeric" placeholder="z. B. 500"></label>
    <div class="field"><span>Wer spielt mit?</span><div class="chips wrap">${members().map(m => `<label class="chip"><input type="checkbox" name="who" value="${esc(m.name)}" checked><span>${esc(m.name)}</span></label>`).join('')}</div></div>
    <label class="field"><span>Weitere Mitspieler (mit Komma)</span><input name="more" placeholder="z. B. Oma, Familie Berger"></label>
    <div class="sheet-foot"><button class="primary">Loslegen</button></div></form>`);
  ACTIONS['block-preset'] = el => { const f = el.form; f.name.value = el.dataset.n === 'Eigenes Spiel' ? '' : el.dataset.n; f.low.checked = !!el.dataset.low; f.name.focus(); };
  FORMS['block-new'] = form => {
    const players = [...[...form.querySelectorAll('[name=who]:checked')].map(c => c.value), ...form.more.value.split(',').map(x => x.trim()).filter(Boolean)];
    if (players.length < 1) return toast('Bitte Mitspieler auswählen.');
    const b = save('games', { id: newId(), kind: 'block', by: me(), at: Date.now(), tripId: (currentTrip() || {}).id || null, name: form.name.value.trim() || 'Spiel', low: form.low.checked, goal: +form.goal.value || 0, players, rounds: [], done: false });
    ui.block = b.id;
    closeSheet();
    render();
  };
  ACTIONS['block-open'] = el => { ui.block = el.dataset.id; render(); };
  ACTIONS['block-close'] = () => { ui.block = null; render(); };
  FORMS['block-round'] = form => {
    const b = S.games.find(g => g.id === form.dataset.id);
    const r = b.players.map((_, i) => parseInt(form[`p${i}`].value, 10) || 0);
    const nb = { ...b, rounds: [...b.rounds, r] };
    if (b.goal && totals(nb).some(v => v >= b.goal)) nb.done = true;
    save('games', nb);
    if (nb.done) tone(880, 300);
  };
  ACTIONS['block-undo'] = el => { const b = S.games.find(g => g.id === el.dataset.id); save('games', { ...b, rounds: b.rounds.slice(0, -1) }); };
  ACTIONS['block-end'] = el => { const b = S.games.find(g => g.id === el.dataset.id); save('games', { ...b, done: true }); tone(880, 300); };
  ACTIONS['block-del'] = el => { if (confirm('Diesen Punkteblock löschen?')) { remove('games', el.dataset.id); ui.block = null; } };
  app.gameScores.block = () => { const n = blocks().filter(b => !b.done).length; return n ? `${n} offen` : ''; };

  /* ====================================================================== */
  /* Kniffel                                                                 */
  /* ====================================================================== */

  const CATS = [['1', 'Einer'], ['2', 'Zweier'], ['3', 'Dreier'], ['4', 'Vierer'], ['5', 'Fünfer'], ['6', 'Sechser'],
    ['3k', 'Dreierpasch'], ['4k', 'Viererpasch'], ['fh', 'Full House'], ['ks', 'Kleine Straße'], ['gs', 'Große Straße'], ['kn', 'Kniffel'], ['ch', 'Chance']];
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]] };
  const die = v => `<svg viewBox="0 0 30 30"><rect x="1" y="1" width="28" height="28" rx="6" fill="#fff" stroke="currentColor" stroke-width="2"/>${(PIPS[v] || []).map(([x, y]) => `<circle cx="${8 + x * 7}" cy="${8 + y * 7}" r="2.7" fill="currentColor"/>`).join('')}</svg>`;
  function score(cat, d) {
    const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach(v => c[v]++);
    const sum = d.reduce((a, b) => a + b, 0), has = n => c.some(x => x >= n), u = [...new Set(d)].sort().join('');
    if (/^[1-6]$/.test(cat)) return c[+cat] * +cat;
    if (cat === '3k') return has(3) ? sum : 0;
    if (cat === '4k') return has(4) ? sum : 0;
    if (cat === 'fh') return c.includes(3) && c.includes(2) ? 25 : 0;
    if (cat === 'ks') return /1234|2345|3456/.test(u) ? 30 : 0;
    if (cat === 'gs') return /12345|23456/.test(u) ? 40 : 0;
    if (cat === 'kn') return has(5) ? 50 : 0;
    return sum;
  }
  const upper = card => ['1', '2', '3', '4', '5', '6'].reduce((s, k) => s + (card[k] || 0), 0);
  const total = card => { const up = upper(card); return Object.values(card).reduce((a, b) => a + b, 0) + (up >= 63 ? 35 : 0); };
  const kn = () => LS.get('kniffel', null);
  const setKn = v => { LS.set('kniffel', v); render(); };
  function kniffelView() {
    const g = kn();
    if (!g) return `<p>Fünf Würfel, bis zu dreimal würfeln, Würfel antippen zum Festhalten. Wer spielt mit?</p>
      <form data-form="kn-start"><div class="chips wrap">${members().map(m => `<label class="chip"><input type="checkbox" name="who" value="${esc(m.name)}" checked><span>${esc(m.name)}</span></label>`).join('')}</div>
      <label class="field"><span>Weitere (mit Komma)</span><input name="more" placeholder="z. B. Oma"></label><button class="primary">Spiel starten</button></form>`;
    const p = g.players[g.turn];
    const done = g.players.every(x => Object.keys(x.card).length === CATS.length);
    if (done) {
      const res = g.players.map(x => [x.name, total(x.card)]).sort((a, b) => b[1] - a[1]);
      return `<div class="quiz-end"><p class="win">${esc(res[0][0])} gewinnt mit ${res[0][1]} Punkten! 🎲</p>
        <ol class="kn-res">${res.map(([n, v]) => `<li>${esc(n)}: <b>${v}</b></li>`).join('')}</ol>
        <button class="primary" data-action="kn-reset">Neues Spiel</button>
        <button class="link" data-action="game-open" data-g="block">Urlaubswertung ansehen</button></div>`;
    }
    return `<p class="plate-progress"><b>${esc(p.name)}</b> ist dran · noch ${3 - g.rolls} ${3 - g.rolls === 1 ? 'Wurf' : 'Würfe'}</p>
      <div class="kn-dice">${g.dice.map((v, i) => `<button class="kn-die${g.held[i] ? ' held' : ''}" data-action="kn-hold" data-i="${i}"${g.rolls === 0 ? ' disabled' : ''} aria-label="Würfel ${v}${g.held[i] ? ', festgehalten' : ''}">${g.rolls ? die(v) : die(0)}</button>`).join('')}</div>
      <button class="primary kn-roll" data-action="kn-roll"${g.rolls >= 3 ? ' disabled' : ''}>🎲 Würfeln</button>
      <div class="kn-card" data-noswipe><table><thead><tr><th></th>${g.players.map((x, i) => `<th class="${i === g.turn ? 'lead' : ''}">${esc(x.name)}</th>`).join('')}</tr></thead><tbody>
        ${CATS.map(([k, l], n) => `${n === 6 ? `<tr class="sum"><td>Bonus (ab 63)</td>${g.players.map(x => `<td>${upper(x.card) >= 63 ? 35 : `${upper(x.card)}/63`}</td>`).join('')}</tr>` : ''}
          <tr><td>${l}</td>${g.players.map((x, i) => { const v = x.card[k]; if (v != null) return `<td>${v}</td>`;
            return i === g.turn && g.rolls ? `<td><button class="kn-pick" data-action="kn-score" data-k="${k}">${score(k, g.dice)}</button></td>` : '<td></td>'; }).join('')}</tr>`).join('')}
        <tr class="sum"><td>Gesamt</td>${g.players.map(x => `<td><b>${total(x.card)}</b></td>`).join('')}</tr></tbody></table></div>
      <button class="link" data-action="kn-reset">Spiel abbrechen</button>`;
  }
  FORMS['kn-start'] = form => {
    const names = [...[...form.querySelectorAll('[name=who]:checked')].map(c => c.value), ...form.more.value.split(',').map(x => x.trim()).filter(Boolean)];
    if (!names.length) return toast('Bitte Mitspieler auswählen.');
    setKn({ players: names.map(name => ({ name, card: {} })), turn: 0, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], rolls: 0 });
  };
  ACTIONS['kn-roll'] = () => {
    const g = kn();
    if (g.rolls >= 3) return;
    g.dice = g.dice.map((v, i) => (g.held[i] ? v : 1 + Math.floor(Math.random() * 6)));
    g.rolls++;
    tone(300 + Math.random() * 200, 60, 'triangle', 0.1);
    if (navigator.vibrate) navigator.vibrate(20);
    setKn(g);
  };
  ACTIONS['kn-hold'] = el => { const g = kn(); g.held[+el.dataset.i] = !g.held[+el.dataset.i]; setKn(g); };
  ACTIONS['kn-score'] = el => {
    const g = kn();
    g.players[g.turn].card[el.dataset.k] = score(el.dataset.k, g.dice);
    g.turn = (g.turn + 1) % g.players.length;
    g.rolls = 0; g.held = [false, false, false, false, false];
    const done = g.players.every(x => Object.keys(x.card).length === CATS.length);
    if (done) save('games', { id: newId(), kind: 'block', by: me(), at: Date.now(), tripId: (currentTrip() || {}).id || null, name: 'Kniffel', low: false, players: g.players.map(x => x.name), rounds: [g.players.map(x => total(x.card))], done: true });
    setKn(g);
  };
  ACTIONS['kn-reset'] = () => { if (!kn() || kn().players.every(x => Object.keys(x.card).length === CATS.length) || confirm('Spiel abbrechen?')) setKn(null); };

  /* ====================================================================== */
  /* Farben-Merkspiel (wie Senso)                                            */
  /* ====================================================================== */

  const PADS = [['#4F8A3C', 392], ['#E4572E', 330], ['#F2C94C', 262], ['#2E7FB8', 196]];
  let ss = null;   // { seq, pos, busy, over }
  function sensoView() {
    const b = bestOf('senso');
    return `<p class="plate-progress">${ss ? `Runde ${ss.seq.length}` : 'Merk dir die Reihenfolge und tippe sie nach.'}${b != null ? ` · Rekord ${b}` : ''}</p>
      <div class="senso" data-noswipe>${PADS.map(([c], i) => `<button class="pad" style="--c:${c}" data-action="ss-pad" data-i="${i}" aria-label="Farbe ${i + 1}"></button>`).join('')}
        <button class="ss-mid" data-action="ss-start">${ss && !ss.over ? (ss.busy ? '👀' : '👆') : 'Start'}</button></div>
      ${ss && ss.over ? (ss.seq.length > 1 ? `<p class="win">Geschafft: ${ss.seq.length - 1} ${ss.seq.length - 1 === 1 ? 'Farbe' : 'Farben'}${ss.rec ? ' – neuer Rekord! 🎉' : ''}</p>` : '<p class="sub">Daneben – gleich nochmal!</p>') : ''}`;
  }
  const flash = (i, ms) => new Promise(res => {
    const el = document.querySelector(`.senso .pad[data-i="${i}"]`);
    if (el) el.classList.add('lit');
    tone(PADS[i][1], ms);
    setTimeout(() => { if (el) el.classList.remove('lit'); setTimeout(res, 90); }, ms);
  });
  async function play() {
    ss.busy = true; render();
    await new Promise(r => setTimeout(r, 500));
    const ms = Math.max(220, 520 - ss.seq.length * 22);
    for (const i of ss.seq) { if (!ss || ui.game !== 'senso') return; await flash(i, ms); }
    if (ss) { ss.busy = false; ss.pos = 0; render(); }
  }
  ACTIONS['ss-start'] = () => { if (ss && !ss.over && (ss.busy || ss.seq.length)) return; ss = { seq: [Math.floor(Math.random() * 4)], pos: 0 }; play(); };
  ACTIONS['ss-pad'] = el => {
    if (!ss || ss.busy || ss.over) return;
    const i = +el.dataset.i;
    flash(i, 200);
    if (ss.seq[ss.pos] !== i) {
      ss.over = true; ss.rec = ss.seq.length > 1 && best('senso', ss.seq.length - 1);
      tone(110, 600, 'sawtooth', 0.12); if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(render, 250);
      return;
    }
    ss.pos++;
    if (ss.pos === ss.seq.length) { ss.seq.push(Math.floor(Math.random() * 4)); setTimeout(play, 350); }
  };
  app.gameScores.senso = () => (bestOf('senso') != null ? `🏆 ${bestOf('senso')}` : '');

  /* ====================================================================== */
  /* Wer ist schneller?                                                      */
  /* ====================================================================== */

  let rx = null;   // { a, b, sa, sb, state: 'wait'|'go'|'done', t0, msg }
  const RX_TO = 5;
  function rxView() {
    if (!rx) {
      const ms = members();
      return `<p>Zwei Spieler, ein Handy dazwischen. Wenn das Feld grün wird: schnell auf die eigene Hälfte tippen! Wer zu früh tippt, verliert den Punkt.</p>
        <form data-form="rx-start" class="row2"><label class="field"><span>Oben</span><select name="a">${ms.map((m, i) => `<option${i === 1 ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}<option>Gast</option></select></label>
          <label class="field"><span>Unten</span><select name="b">${ms.map((m, i) => `<option${i === 0 ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}<option>Gast</option></select></label>
          <button class="primary">Los</button></form>`;
    }
    const half = (who, s, top) => `<button class="rx-half ${top ? 'top' : ''} ${rx.state}" data-action="rx-tap" data-p="${top ? 'a' : 'b'}"><span>${esc(who)}</span><b>${s}</b>
      <i>${rx.state === 'go' ? 'JETZT!' : rx.state === 'wait' ? 'Warten …' : rx.msg && rx.msg[top ? 'a' : 'b'] || ''}</i></button>`;
    return `<div class="rx" data-noswipe>${half(rx.a, rx.sa, true)}${half(rx.b, rx.sb, false)}</div>
      <div class="btnrow">${rx.state === 'done' && Math.max(rx.sa, rx.sb) < RX_TO ? '<button class="primary" data-action="rx-next">Nächste Runde</button>' : ''}
        ${Math.max(rx.sa, rx.sb) >= RX_TO ? `<p class="win">${esc(rx.sa > rx.sb ? rx.a : rx.b)} gewinnt ${Math.max(rx.sa, rx.sb)}:${Math.min(rx.sa, rx.sb)}!</p>` : ''}
        <button class="ghost" data-action="rx-quit">Beenden</button></div>`;
  }
  let rxTimer = 0;
  function rxRound() {
    rx.state = 'wait'; rx.msg = null; render();
    clearTimeout(rxTimer);
    rxTimer = setTimeout(() => { if (!rx || rx.state !== 'wait') return; rx.state = 'go'; rx.t0 = performance.now(); tone(990, 120); render(); }, 1500 + Math.random() * 3500);
  }
  FORMS['rx-start'] = form => { rx = { a: form.a.value, b: form.b.value, sa: 0, sb: 0 }; rxRound(); };
  ACTIONS['rx-tap'] = el => {
    if (!rx || rx.state === 'done') return;
    const p = el.dataset.p, o = p === 'a' ? 'b' : 'a';
    if (rx.state === 'wait') { clearTimeout(rxTimer); rx['s' + o]++; rx.msg = { [p]: 'Zu früh! 😬', [o]: 'Punkt geschenkt' }; tone(150, 300, 'square', 0.1); }
    else { const ms = Math.round(performance.now() - rx.t0); rx['s' + p]++; rx.msg = { [p]: `${ms} ms ⚡`, [o]: 'Knapp daneben' }; best('schneller', ms, true); }
    rx.state = 'done';
    if (navigator.vibrate) navigator.vibrate(60);
    render();
  };
  ACTIONS['rx-next'] = () => rxRound();
  ACTIONS['rx-quit'] = () => { clearTimeout(rxTimer); rx = null; render(); };
  app.gameScores.schneller = () => (bestOf('schneller') != null ? `⚡ ${bestOf('schneller')} ms` : '');

  /* ====================================================================== */
  /* Würdest du lieber …?                                                    */
  /* ====================================================================== */

  const WYR = [
    ['fliegen können', 'unsichtbar sein können'], ['immer Sommer haben', 'immer Schnee haben'], ['im Zelt schlafen', 'im Baumhaus schlafen'],
    ['mit Delfinen schwimmen', 'auf einem Elefanten reiten'], ['nur noch Pizza essen', 'nur noch Pommes essen'], ['ein Jahr am Meer wohnen', 'ein Jahr in den Bergen wohnen'],
    ['mit Tieren sprechen können', 'jede Sprache der Welt sprechen können'], ['einen Drachen als Haustier haben', 'ein Einhorn als Haustier haben'],
    ['nie mehr Zähne putzen müssen', 'nie mehr Haare waschen müssen'], ['im Camper um die Welt fahren', 'mit dem Segelboot um die Welt fahren'],
    ['jeden Tag Eis essen', 'jeden Tag in den Freizeitpark gehen'], ['Riese sein', 'Zwerg sein'], ['in einer Höhle schlafen', 'auf einem Leuchtturm schlafen'],
    ['ein Superheld sein', 'ein Zauberer sein'], ['in die Vergangenheit reisen', 'in die Zukunft reisen'], ['nur noch rückwärts laufen', 'nur noch hüpfen'],
    ['einen Tag Erwachsener sein', 'einen Tag Baby sein'], ['im Regen tanzen', 'im Schnee rodeln'], ['ein Pinguin sein', 'ein Papagei sein'],
    ['auf dem Mond campen', 'unter Wasser campen'], ['immer singen statt sprechen', 'immer flüstern'], ['einen Roboter haben, der aufräumt', 'einen Roboter, der Hausaufgaben macht'],
    ['zehn Geschwister haben', 'gar keine Geschwister haben'], ['Schokolade-Regen', 'Gummibärchen-Schnee'], ['so schnell rennen wie ein Gepard', 'so hoch springen wie ein Känguru'],
    ['nur Kakao trinken', 'nur Limo trinken'], ['einen Tag lang unsichtbar sein', 'einen Tag lang fliegen'], ['im Wohnmobil wohnen', 'im Schloss wohnen'],
    ['mit einem Hai tauchen', 'mit einem Bären wandern'], ['Lehrerin oder Lehrer sein', 'Schulkind bleiben'], ['nie wieder Fernsehen', 'nie wieder Süßigkeiten'],
    ['eine Woche ohne Handy', 'eine Woche ohne Nachtisch'], ['Kapitän auf einem Piratenschiff sein', 'Pilot in einer Rakete sein'], ['Haare aus Spaghetti haben', 'Finger aus Fischstäbchen haben'],
    ['jeden Tag Pfannkuchen frühstücken', 'jeden Tag Müsli mit Erdbeeren'], ['einen Wal sehen', 'einen Elch sehen'], ['im Wald verlaufen', 'in der Stadt verlaufen'],
    ['eine Woche Regen im Urlaub', 'eine Woche Hitze ohne Schatten'], ['Lagerfeuer jeden Abend', 'Sternschnuppen jede Nacht'], ['Tiere verstehen, aber sie dich nicht', 'Tiere verstehen dich, du sie nicht'],
    ['in einem Iglu übernachten', 'in einer Hängematte übernachten'], ['der beste Fußballer der Welt sein', 'der beste Koch der Welt sein'], ['nur noch lila tragen', 'nur noch gestreift tragen'],
    ['eine Stunde früher aufstehen', 'eine Stunde später ins Bett'], ['Muscheln sammeln', 'Steine sammeln'], ['ein Dino-Skelett finden', 'einen Schatz finden'],
  ];
  let wy = null;   // { order, i, votes: {a, b} }
  function lieberView() {
    if (!wy) wy = { order: shuffle(WYR.map((_, i) => i)), i: 0, votes: null };
    const [a, b] = WYR[wy.order[wy.i % wy.order.length]];
    const v = wy.votes;
    const n = v ? v.a.length + v.b.length : 0;
    const bar = side => (n ? Math.round(v[side].length / n * 100) : 0);
    return `<p class="wyr-q">Würdest du lieber …</p>
      <div class="wyr" data-noswipe>
        <button class="wyr-a" data-action="wy-vote" data-s="a"><b>${esc(a)}</b>${v ? `<span>${v.a.length} · ${bar('a')} %</span><small>${v.a.map(esc).join(', ')}</small>` : ''}</button>
        <span class="wyr-or">oder</span>
        <button class="wyr-b" data-action="wy-vote" data-s="b"><b>${esc(b)}</b>${v ? `<span>${v.b.length} · ${bar('b')} %</span><small>${v.b.map(esc).join(', ')}</small>` : ''}</button>
      </div>
      ${members().length > 1 ? `<p class="sub">Wer stimmt ab? ${members().map(m => `<button class="chip${(wy.who || player()) === m.id ? ' on' : ''}" data-action="wy-who" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</p>` : ''}
      <p class="sub">Und warum? Erzählt es euch!</p>
      <div class="btnrow"><button class="primary" data-action="wy-next">Nächste Frage</button></div>`;
  }
  ACTIONS['wy-who'] = el => { wy.who = el.dataset.id; render(); };
  ACTIONS['wy-vote'] = el => {
    const name = personName(wy.who || player());
    wy.votes = wy.votes || { a: [], b: [] };
    wy.votes.a = wy.votes.a.filter(x => x !== name); wy.votes.b = wy.votes.b.filter(x => x !== name);
    wy.votes[el.dataset.s].push(name);
    // nächste Person automatisch wählen
    const ms = members(), i = ms.findIndex(m => m.id === (wy.who || player()));
    if (ms.length > 1) wy.who = ms[(i + 1) % ms.length].id;
    tone(el.dataset.s === 'a' ? 523 : 659, 90);
    render();
  };
  ACTIONS['wy-next'] = () => { wy.i++; wy.votes = null; render(); };

  /* ====================================================================== */
  /* Tick-Tack-Bumm                                                          */
  /* ====================================================================== */

  const TOPICS = ['Tiere mit vier Beinen', 'Dinge im Camper', 'Obstsorten', 'Gemüse', 'Länder in Europa', 'Städte in Deutschland', 'Automarken', 'Farben', 'Berufe',
    'Sportarten', 'Dinge am Strand', 'Was man zum Zelten braucht', 'Süßigkeiten', 'Vögel', 'Fische und Meerestiere', 'Musikinstrumente', 'Spielzeug', 'Kleidungsstücke',
    'Körperteile', 'Dinge in der Küche', 'Märchenfiguren', 'Superhelden', 'Eissorten', 'Getränke', 'Werkzeuge', 'Blumen', 'Bäume', 'Dinge, die fliegen',
    'Dinge, die rund sind', 'Dinge, die man im Supermarkt kauft', 'Namen mit A', 'Wörter mit „Wasser“', 'Wörter mit „Schiff“', 'Verkehrsmittel', 'Insekten',
    'Brettspiele und Kartenspiele', 'Was man im Badezimmer findet', 'Dinge, die nass werden', 'Pizzabeläge', 'Dinge im Wald', 'Wetterwörter', 'Tiere im Zoo',
    'Dinge, die man in den Urlaub mitnimmt', 'Wörter, die mit „Sch“ anfangen', 'Lieder, die alle kennen', 'Filme oder Serien', 'Berge und Gebirge', 'Flüsse und Seen'];
  let bm = null;   // { topic, end, start, boom }
  let bmTick = 0;
  function bummView() {
    const losers = LS.get('bumm.lost', {});
    if (!bm || (!bm.end && !bm.boom)) {
      const topic = (bm && bm.topic) || pick(TOPICS);
      bm = { topic };
      return `<p>Das Handy geht reihum. Wer es hat, nennt einen Begriff zum Thema und gibt es weiter. Bei wem die Bombe platzt, der verliert die Runde.</p>
        <div class="bm-topic"><small>Thema</small><b>${esc(topic)}</b><button class="link" data-action="bm-topic">Anderes Thema</button></div>
        <button class="primary bm-go" data-action="bm-start">💣 Bombe scharf machen</button>
        ${Object.keys(losers).length ? `<p class="sub">Bisher geplatzt bei: ${Object.entries(losers).map(([n, c]) => `${esc(n)} ${c}×`).join(', ')} <button class="link" data-action="bm-clear">zurücksetzen</button></p>` : ''}`;
    }
    if (bm.boom) return `<div class="bm-boom">💥<b>BUMM!</b></div><p>Bei wem ist sie geplatzt?</p>
      <div class="chips wrap">${members().map(m => `<button class="chip" data-action="bm-lost" data-n="${esc(m.name)}">${esc(m.name)}</button>`).join('')}<button class="chip" data-action="bm-lost" data-n="">Egal</button></div>`;
    return `<div class="bm-topic"><small>Thema</small><b>${esc(bm.topic)}</b></div><div class="bm-bomb" id="bmBomb">💣</div><p class="sub">Weitergeben! Die Zeit ist geheim.</p>`;
  }
  ACTIONS['bm-topic'] = () => { bm = { topic: pick(TOPICS.filter(t => t !== (bm && bm.topic))) }; render(); };
  ACTIONS['bm-start'] = () => {
    bm.start = Date.now(); bm.end = bm.start + (15 + Math.random() * 35) * 1000;
    render();
    clearTimeout(bmTick);
    const tick = () => {
      if (!bm || !bm.end || ui.game !== 'bumm') return;
      const left = bm.end - Date.now();
      if (left <= 0) {
        bm.boom = true; bm.end = 0;
        tone(80, 900, 'sawtooth', 0.25); tone(60, 1200, 'square', 0.15);
        if (navigator.vibrate) navigator.vibrate([400, 100, 400]);
        render();
        return;
      }
      tone(left < 5000 ? 1200 : 900, 40, 'square', 0.06);
      const b = document.getElementById('bmBomb'); if (b) { b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); }
      // Je näher die Explosion, desto schneller tickt es
      bmTick = setTimeout(tick, Math.max(140, Math.min(900, left / 12)));
    };
    tick();
  };
  ACTIONS['bm-lost'] = el => { if (el.dataset.n) { const l = LS.get('bumm.lost', {}); l[el.dataset.n] = (l[el.dataset.n] || 0) + 1; LS.set('bumm.lost', l); } bm = null; render(); };
  ACTIONS['bm-clear'] = () => { LS.set('bumm.lost', {}); render(); };

  /* ---------- Spiel verlassen: Uhren anhalten ---------- */

  const gameOpen = ACTIONS['game-open'];
  ACTIONS['game-open'] = (el, ev) => { clearTimeout(bmTick); clearTimeout(rxTimer); if (bm && bm.end) bm = null; ss = null; return gameOpen(el, ev); };

  Object.assign(app.GAME_VIEWS, { hauptstadt: hqView, umriss: uqView, woliegt: wlView, block: blockView, kniffel: kniffelView, senso: sensoView, schneller: rxView, lieber: lieberView, bumm: bummView });
}
