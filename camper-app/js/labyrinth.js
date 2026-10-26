// Murmel-Labyrinth: Handy neigen und die Kugel ins Ziel rollen, ohne in ein Loch zu fallen.
// Vier Schwierigkeitsgrade mit je sechs festen Bahnen (immer gleich, damit Rekorde vergleichbar sind).
// Ohne Neigungssensor (oder am PC) lenkt man mit dem Finger oder den Pfeiltasten.

export default function installLabyrinth(app) {
  const { LS, ACTIONS, render, toast, me } = app;
  const player = () => (app.player ? app.player() : me());
  const mmss = ms => { const s = ms / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`; };

  app.GAMES.push(['labyrinth', 'Murmel-Labyrinth', 'Handy neigen, Kugel ins Ziel']);
  app.GAME_ART.labyrinth = '<rect x="8" y="6" width="48" height="36" rx="3" fill="#E9C98F"/><path d="M8 18h30M26 30h30M20 6v12M44 30v12" /><circle cx="48" cy="14" r="4" fill="#2B1B10" stroke="none"/><circle cx="16" cy="34" r="5" fill="#9AA4AE"/>';

  // Stufen: Größe (Zellen), Anzahl Löcher, Rundwege, Tempo
  const LEVELS = {
    leicht: { c: 4, r: 6, holes: 1, braid: 0, speed: 0.8, label: 'Leicht' },
    mittel: { c: 6, r: 9, holes: 5, braid: 0.15, speed: 1, label: 'Mittel' },
    schwer: { c: 8, r: 12, holes: 12, braid: 0.25, speed: 1.15, label: 'Schwer' },
    profi: { c: 10, r: 15, holes: 24, braid: 0.3, speed: 1.3, label: 'Profi' },
  };
  const TRACKS = 6;
  const T = 0.14;               // Wanddicke (Zellbreite = 1)
  const R = 0.26;               // Kugelradius
  const HOLE = 0.3;

  // Zufall mit festem Startwert: Bahn 3 „Mittel“ ist auf jedem Handy dieselbe
  function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // Irrgarten erzeugen: Wände je Zelle (Ost/Süd), Start oben links, Ziel unten rechts
  function build(levelKey, n) {
    const L = LEVELS[levelKey];
    const rnd = rng(Object.keys(LEVELS).indexOf(levelKey) * 1000 + n * 37 + 11);
    const { c: C, r: Rr } = L;
    const east = Array(C * Rr).fill(true), south = Array(C * Rr).fill(true), seen = Array(C * Rr).fill(false);
    // Jede Bahn hat einen eigenen Charakter: mal lange Gänge quer, mal längs, mal verwinkelt
    const bias = [0, 0.6, -0.6, 0.3, -0.3, 0][n % 6];
    const stack = [0]; seen[0] = true;
    while (stack.length) {
      const i = stack[stack.length - 1], x = i % C, y = Math.floor(i / C);
      const nb = [];
      if (x > 0 && !seen[i - 1]) nb.push([i - 1, 'h']);
      if (x < C - 1 && !seen[i + 1]) nb.push([i + 1, 'h']);
      if (y > 0 && !seen[i - C]) nb.push([i - C, 'v']);
      if (y < Rr - 1 && !seen[i + C]) nb.push([i + C, 'v']);
      if (!nb.length) { stack.pop(); continue; }
      const w = nb.map(([, d]) => Math.max(0.1, 1 + (d === 'h' ? bias : -bias)));
      let p = rnd() * w.reduce((a, b) => a + b), k = 0;
      while (p > w[k]) { p -= w[k]; k++; }
      const j = nb[Math.min(k, nb.length - 1)][0];
      if (j === i + 1) east[i] = false; else if (j === i - 1) east[j] = false; else if (j === i + C) south[i] = false; else south[j] = false;
      seen[j] = true; stack.push(j);
    }
    // Rundwege: einige Wände zusätzlich öffnen
    for (let i = 0; i < C * Rr; i++) {
      if (rnd() < L.braid) { if (i % C < C - 1 && rnd() < 0.5) east[i] = false; else if (Math.floor(i / C) < Rr - 1) south[i] = false; }
    }
    const open = (i, j) => (j === i + 1 ? !east[i] : j === i - 1 ? !east[j] : j === i + C ? !south[i] : j === i - C ? !south[j] : false);
    const nbs = i => [i - 1, i + 1, i - C, i + C].filter(j => j >= 0 && j < C * Rr && (Math.abs(j - i) === C || Math.floor(j / C) === Math.floor(i / C)) && open(i, j));
    // Kürzester Weg vom Start zum Ziel: dort kommen keine Löcher hin, so bleibt jede Bahn lösbar
    const goal = C * Rr - 1, prev = Array(C * Rr).fill(-1), q = [0]; prev[0] = 0;
    while (q.length) { const i = q.shift(); for (const j of nbs(i)) if (prev[j] < 0) { prev[j] = i; q.push(j); } }
    const path = new Set([goal]); for (let i = goal; i !== 0; i = prev[i]) path.add(prev[i]);
    // Löcher bevorzugt direkt neben dem Weg (Fallen), sonst in Sackgassen
    const cand = [...Array(C * Rr).keys()].filter(i => !path.has(i) && i !== 0)
      .map(i => ({ i, s: (nbs(i).some(j => path.has(j)) ? 2 : 0) + (nbs(i).length === 1 ? 1 : 0) + rnd() * 1.5 }))
      .sort((a, b) => b.s - a.s);
    const holes = cand.slice(0, L.holes).map(({ i }) => {
      // Loch leicht aus der Mitte versetzt, damit es nicht wie ein Raster aussieht
      const x = i % C, y = Math.floor(i / C);
      return { x: x + 0.5 + (rnd() - 0.5) * 0.2, y: y + 0.5 + (rnd() - 0.5) * 0.2 };
    });
    // Wände als Rechtecke
    const walls = [[0, 0, C, T / 2], [0, Rr - T / 2, C, T / 2], [0, 0, T / 2, Rr], [C - T / 2, 0, T / 2, Rr]];
    for (let i = 0; i < C * Rr; i++) {
      const x = i % C, y = Math.floor(i / C);
      if (east[i] && x < C - 1) walls.push([x + 1 - T / 2, y - T / 2, T, 1 + T]);
      if (south[i] && y < Rr - 1) walls.push([x - T / 2, y + 1 - T / 2, 1 + T, T]);
    }
    return { C, R: Rr, walls, holes, goal: { x: C - 0.5, y: Rr - 0.5 }, speed: L.speed };
  }

  /* ---------- Zustand ---------- */

  const opt = () => LS.get('lab.opt', { level: 'leicht' });
  const bestKey = (lv, n) => `${player()}.${lv}.${n}`;
  const bests = () => LS.get('lab.best', {});
  let g = null;                  // laufendes Spiel
  const tilt = { x: 0, y: 0, src: '' };
  let zero = null, raf = 0, last = 0;

  function onOrient(e) {
    if (e.beta == null) return;
    const a = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let x = e.gamma, y = e.beta;
    if (a === 90) { x = e.beta; y = -e.gamma; } else if (a === 270 || a === -90) { x = -e.beta; y = e.gamma; } else if (a === 180) { x = -e.gamma; y = -e.beta; }
    if (!zero) zero = { x, y };   // die Haltung beim Start gilt als „gerade“
    tilt.x = Math.max(-1, Math.min(1, (x - zero.x) / 30));
    tilt.y = Math.max(-1, Math.min(1, (y - zero.y) / 30));
    tilt.raw = { x, y };
    tilt.src = 'sensor';
  }
  const keys = {};
  function onKey(e) {
    if (!g || !/^Arrow/.test(e.key)) return;
    keys[e.key] = e.type === 'keydown';
    tilt.x = (keys.ArrowRight ? 0.7 : 0) - (keys.ArrowLeft ? 0.7 : 0);
    tilt.y = (keys.ArrowDown ? 0.7 : 0) - (keys.ArrowUp ? 0.7 : 0);
    tilt.src = 'keys';
    e.preventDefault();
  }
  let drag = null;
  function onPointer(e) {
    if (!e.target.closest || !e.target.closest('#labCanvas')) { if (e.type !== 'pointermove') drag = null; return; }
    if (e.type === 'pointerdown') { drag = { x: e.clientX, y: e.clientY }; e.preventDefault(); return; }
    if (!drag) return;
    if (e.type === 'pointermove') {
      tilt.x = Math.max(-1, Math.min(1, (e.clientX - drag.x) / 70));
      tilt.y = Math.max(-1, Math.min(1, (e.clientY - drag.y) / 70));
      if (tilt.src !== 'sensor') tilt.src = 'finger';
    } else { drag = null; if (tilt.src === 'finger') { tilt.x = 0; tilt.y = 0; } }
  }
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  addEventListener('pointerdown', onPointer, { passive: false }); addEventListener('pointermove', onPointer); addEventListener('pointerup', onPointer); addEventListener('pointercancel', onPointer);

  function start(lv, n) {
    const m = build(lv, n);
    g = { lv, n, m, x: 0.5, y: 0.5, vx: 0, vy: 0, t0: Date.now(), falls: 0, done: 0, fallAt: 0 };
    zero = null; tilt.x = 0; tilt.y = 0;
    removeEventListener('deviceorientation', onOrient);
    addEventListener('deviceorientation', onOrient);
    // iPhone fragt einmal um Erlaubnis (muss direkt nach einem Tipp passieren)
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {});
    // Kommen keine Sensordaten, mit dem Finger lenken
    setTimeout(() => { if (g && !g.done && tilt.src !== 'sensor' && matchMedia('(pointer: coarse)').matches) toast('Kein Neigungssensor: mit dem Finger auf der Bahn ziehen.'); }, 1500);
    render();
    // Bahn ganz ins Bild holen
    setTimeout(() => { const el = document.querySelector('#labTime'); if (el) scrollTo({ top: el.closest('p').getBoundingClientRect().top + scrollY - (document.querySelector('.topbar')?.offsetHeight || 0) - 8, behavior: 'smooth' }); }, 50);
    loop();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; removeEventListener('deviceorientation', onOrient); }

  /* ---------- Physik ---------- */

  function step(dt) {
    const m = g.m;
    const acc = 22 * m.speed;
    g.vx += tilt.x * acc * dt; g.vy += tilt.y * acc * dt;
    const fr = Math.max(0, 1 - 1.4 * dt);
    g.vx *= fr; g.vy *= fr;
    const vmax = 9;
    const sp = Math.hypot(g.vx, g.vy); if (sp > vmax) { g.vx *= vmax / sp; g.vy *= vmax / sp; }
    g.x += g.vx * dt; g.y += g.vy * dt;
    for (const [wx, wy, ww, wh] of m.walls) {
      const cx = Math.max(wx, Math.min(g.x, wx + ww)), cy = Math.max(wy, Math.min(g.y, wy + wh));
      const dx = g.x - cx, dy = g.y - cy, d = Math.hypot(dx, dy);
      if (d >= R) continue;
      let nx, ny;
      if (d > 1e-6) { nx = dx / d; ny = dy / d; } else {
        // Mittelpunkt in der Wand: zur nächsten Kante hinaus
        const opts = [[g.x - wx, -1, 0], [wx + ww - g.x, 1, 0], [g.y - wy, 0, -1], [wy + wh - g.y, 0, 1]].sort((a, b) => a[0] - b[0]);
        [, nx, ny] = opts[0];
      }
      g.x = cx + nx * R; g.y = cy + ny * R;
      const vn = g.vx * nx + g.vy * ny;
      if (vn < 0) { g.vx -= 1.35 * vn * nx; g.vy -= 1.35 * vn * ny; if (vn < -3 && navigator.vibrate) navigator.vibrate(8); }
    }
    for (const h of m.holes) {
      if (Math.hypot(g.x - h.x, g.y - h.y) < HOLE * 0.85) {
        g.falls++; g.fallAt = Date.now(); g.fallHole = h;
        if (navigator.vibrate) navigator.vibrate(120);
        g.x = 0.5; g.y = 0.5; g.vx = 0; g.vy = 0;
        return;
      }
    }
    if (Math.hypot(g.x - m.goal.x, g.y - m.goal.y) < 0.32) win();
  }
  function win() {
    g.done = Date.now() - g.t0;
    stop();
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    const b = bests(), k = bestKey(g.lv, g.n);
    g.record = !b[k] || g.done < b[k];
    if (g.record) { b[k] = g.done; LS.set('lab.best', b); }
    render();
  }

  function loop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    const frame = now => {
      const cv = document.getElementById('labCanvas');
      if (!g || g.done || !cv) { stop(); return; }
      let dt = Math.min(0.05, (now - last) / 1000); last = now;
      // Feine Teilschritte, damit die Kugel auch schnell nicht durch Wände rutscht
      const k = Math.ceil(dt / 0.004); dt /= k;
      for (let i = 0; i < k && !g.done; i++) step(dt);
      if (!g.done) draw(cv);
      const tEl = document.getElementById('labTime');
      if (tEl) tEl.textContent = mmss(Date.now() - g.t0);
      const hint = document.getElementById('labHint');
      if (hint && tilt.src && !hint.dataset.set) { hint.dataset.set = '1'; hint.textContent = tilt.src === 'sensor' ? 'Handy neigen' : tilt.src === 'keys' ? 'Pfeiltasten' : 'Mit dem Finger ziehen'; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Zeichnen ---------- */

  function draw(cv) {
    const m = g.m, dpr = window.devicePixelRatio || 1;
    // Die ganze Bahn soll ohne Scrollen auf den Bildschirm passen
    const bar = document.querySelector('.tabbar'), top = document.querySelector('.topbar');
    const maxH = innerHeight - (bar ? bar.offsetHeight : 64) - (top && getComputedStyle(top).position === 'fixed' ? top.offsetHeight : 0) - 60;
    const fit = Math.max(200, Math.floor(Math.max(maxH, 320) * m.C / m.R));
    if (cv.style.getPropertyValue('--lab-w') !== `${fit}px`) cv.style.setProperty('--lab-w', `${fit}px`);
    const W = cv.clientWidth, H = W * m.R / m.C;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`; }
    const ctx = cv.getContext('2d'), s = (W / m.C) * dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = '#E9C98F'; ctx.fillRect(0, 0, m.C, m.R);
    // Holzmaserung
    ctx.strokeStyle = 'rgba(160,110,50,.18)'; ctx.lineWidth = 0.03;
    for (let y = 0.3; y < m.R; y += 0.45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(m.C * 0.3, y + 0.12, m.C * 0.6, y - 0.12, m.C, y + 0.05); ctx.stroke(); }
    // Start und Ziel
    ctx.fillStyle = 'rgba(79,138,60,.25)'; ctx.beginPath(); ctx.arc(0.5, 0.5, 0.34, 0, 7); ctx.fill();
    ctx.fillStyle = '#4F8A3C'; ctx.beginPath(); ctx.arc(m.goal.x, m.goal.y, 0.34, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 0.36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', m.goal.x, m.goal.y + 0.02);
    // Löcher
    for (const h of m.holes) {
      const gr = ctx.createRadialGradient(h.x - 0.06, h.y - 0.06, 0.02, h.x, h.y, HOLE);
      gr.addColorStop(0, '#000'); gr.addColorStop(0.8, '#2B1B10'); gr.addColorStop(1, '#7a5532');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(h.x, h.y, HOLE, 0, 7); ctx.fill();
    }
    // Wände mit Schatten
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    for (const [x, y, w, h] of m.walls) ctx.fillRect(x + 0.04, y + 0.05, w, h);
    ctx.fillStyle = '#8A5A2B';
    for (const [x, y, w, h] of m.walls) ctx.fillRect(x, y, w, h);
    // Kugel (nach einem Sturz kurz blinkend am Start)
    if (Date.now() - g.fallAt < 600 && Math.floor((Date.now() - g.fallAt) / 100) % 2) return;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(g.x + 0.05, g.y + 0.07, R, 0, 7); ctx.fill();
    const gb = ctx.createRadialGradient(g.x - R * 0.35, g.y - R * 0.4, R * 0.1, g.x, g.y, R);
    gb.addColorStop(0, '#fff'); gb.addColorStop(0.35, '#C9D1D8'); gb.addColorStop(1, '#5E6870');
    ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, 7); ctx.fill();
  }

  /* ---------- Ansicht ---------- */

  app.GAME_VIEWS.labyrinth = () => {
    const o = opt(), b = bests();
    if (g && !g.done) {
      setTimeout(loop, 0);
      return `<p class="plate-progress">${LEVELS[g.lv].label}, Bahn ${g.n + 1} · Zeit <b id="labTime">${mmss(Date.now() - g.t0)}</b>${g.falls ? ` · ${g.falls}× ins Loch` : ''}</p>
        <canvas id="labCanvas" class="lab-canvas" data-noswipe></canvas>
        <p class="sub lab-hint"><span id="labHint">Handy neigen (oder mit dem Finger ziehen)</span></p>
        <div class="btnrow"><button class="ghost" data-action="lab-zero">Gerade halten = neu ausrichten</button><button class="ghost" data-action="lab-quit">Aufhören</button></div>`;
    }
    if (g && g.done) {
      const next = g.n + 1 < TRACKS;
      return `<div class="lab-win"><p class="win">Geschafft! 🎉</p>
        <p>${LEVELS[g.lv].label}, Bahn ${g.n + 1} in <b>${mmss(g.done)}</b>${g.falls ? `, ${g.falls}× ins Loch gefallen` : ', ohne ein einziges Loch'}${g.record ? '<br><b>Neuer Rekord!</b>' : ''}</p>
        <div class="btnrow"><button class="ghost" data-action="lab-start" data-lv="${g.lv}" data-n="${g.n}">Nochmal</button>
        ${next ? `<button class="primary" data-action="lab-start" data-lv="${g.lv}" data-n="${g.n + 1}">Nächste Bahn</button>` : ''}
        <button class="ghost" data-action="lab-quit">Bahnen</button></div></div>`;
    }
    const lv = o.level;
    return `<p>Neige das Handy, damit die Kugel zum Stern rollt. Fällt sie in ein Loch, geht es am Start weiter.</p>
      <div class="seg">${Object.entries(LEVELS).map(([k, l]) => `<button class="${lv === k ? 'on' : ''}" data-action="lab-level" data-lv="${k}">${l.label}</button>`).join('')}</div>
      <div class="lab-tracks">${[...Array(TRACKS).keys()].map(n => {
        const t = b[bestKey(lv, n)];
        return `<button data-action="lab-start" data-lv="${lv}" data-n="${n}" class="${t ? 'done' : ''}"><b>Bahn ${n + 1}</b><small>${t ? `⭐ ${mmss(t)}` : 'noch offen'}</small></button>`;
      }).join('')}</div>
      <p class="sub">${LEVELS[lv].c} × ${LEVELS[lv].r} Felder, ${LEVELS[lv].holes} ${LEVELS[lv].holes === 1 ? 'Loch' : 'Löcher'}. Tipp: Handy beim Start so halten, wie es bequem ist – das gilt dann als „gerade“.</p>`;
  };
  app.gameScores.labyrinth = () => {
    const b = bests(), p = `${player()}.`;
    const n = Object.keys(b).filter(k => k.startsWith(p)).length;
    return n ? `${n}/${TRACKS * Object.keys(LEVELS).length}` : '';
  };

  ACTIONS['lab-level'] = el => { LS.set('lab.opt', { ...opt(), level: el.dataset.lv }); render(); };
  ACTIONS['lab-start'] = el => start(el.dataset.lv, +el.dataset.n);
  ACTIONS['lab-quit'] = () => { stop(); g = null; render(); };
  ACTIONS['lab-zero'] = () => { zero = tilt.raw ? { ...tilt.raw } : null; if (g) { g.vx = 0; g.vy = 0; } toast('Neu ausgerichtet'); };

  // Spiel verlassen: Sensor abmelden
  const gameOpen = ACTIONS['game-open'];
  ACTIONS['game-open'] = el => { if (!(el && el.dataset.g === 'labyrinth')) { stop(); g = null; } return gameOpen(el); };

  app.labyrinth = { build, LEVELS };   // für Tests
}
