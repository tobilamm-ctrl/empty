// M7/R7 LB 4 und LB 5: Oberfläche und Volumen gerader Prismen – mit Schrägbild (Skizze).
// Typen: m7-prisma-oberflaeche (LB 4), m7-prisma-volumen (LB 5). Vorbild: m7-flaechen.js
(function (AG) {
  const { Frac, rich, fmtDec, fmtInt } = AG;
  const SQ = Math.SQRT1_2; // Tiefe der Skizze: 45°

  const N = x => Number(x);
  const ci = x => new Frac(x);
  const tn = (rng, lo, hi) => new Frac(rng.int(lo, hi), 10); // Zehntel: lo/10 … hi/10
  const iv = (rng, lo, hi) => new Frac(rng.int(lo, hi));
  const nf = x => { const f = Frac.of(x); return f.isInt() ? fmtInt(f.n) : fmtDec(f); };
  const okDec = (f, n = 2) => f.decimals() <= n;
  const F = (x, U) => nf(x) + " " + U;

  // Zulässige Dreiecke: [h, p, q, sL, sR] (p, q Abstände des Fußpunkts zu den Ecken, sL/sR Seiten; alles ganzzahlig)
  const TRI_TRIPLES = [[4, 3, 3, 5, 5], [8, 6, 6, 10, 10], [12, 5, 5, 13, 13], [12, 5, 9, 13, 15]];
  // Parallelogramme: [h, p, s] mit s² = p² + h²
  const PARA_TRIPLES = [{ h: 4, p: 3, s: 5 }, { h: 8, p: 6, s: 10 }, { h: 12, p: 5, s: 13 }, { h: 12, p: 9, s: 15 }];
  // Trapeze (gleichschenklig): [x0, h, s] mit s² = x0² + h², Parallelseiten unterscheiden sich um 2·x0
  const TRAP_TRIPLES = [{ x0: 3, h: 4, s: 5 }, { x0: 6, h: 8, s: 10 }, { x0: 5, h: 12, s: 13 }];

  // ---------- Grundflächen ----------
  // d: Maße als Frac. Punkte in cm (x nach rechts, z nach oben), gegen den Uhrzeigersinn.
  // U: Einheit für die Beschriftung ("cm", "dm", "m")
  function base(kind, d, U) {
    const Fu = x => F(x, U);
    switch (kind) {
      case "rect": {
        const { a, c } = d;
        return {
          kind, name: "Quader", G: a.mul(c), u: a.add(c).mul(2),
          pts: [[0, 0], [N(a), 0], [N(a), N(c)], [0, N(c)]],
          sides: [{ i: 0, t: "a = " + Fu(a) }, { i: 3, t: "c = " + Fu(c) }],
          dashed: [], inner: [], rights: [],
          parts: ["Länge a = " + Fu(a), "Höhe c = " + Fu(c)],
        };
      }
      case "para": {
        const { g, h, p, s } = d;
        const sides = [{ i: 0, t: "g = " + Fu(g) }];
        if (s) sides.push({ i: 1, t: "s = " + Fu(s) });
        return {
          kind, name: "Parallelogrammprisma", G: g.mul(h), u: s ? g.add(s).mul(2) : null,
          pts: [[0, 0], [N(g), 0], [N(g) + N(p), N(h)], [N(p), N(h)]],
          sides,
          dashed: [[[N(p), N(h)], [N(p), 0]]],
          inner: [{ line: [[N(p), N(h)], [N(p), 0]], t: "h = " + Fu(h) }],
          rights: [],
          parts: ["Grundseite g = " + Fu(g), "Höhe des Parallelogramms h = " + Fu(h)].concat(s ? ["Seite s = " + Fu(s)] : []),
        };
      }
      case "tri": {
        const { g, h, p, sL, sR } = d;
        const q = g.sub(p);
        const right = N(q) >= N(p);
        const sides = [{ i: 0, t: "g = " + Fu(g) }];
        if (sL) sides.push({ i: 2, t: "a = " + Fu(sL) }, { i: 1, t: "b = " + Fu(sR) });
        return {
          kind, name: "Dreiecksprisma", G: g.mul(h).div(2), u: sL ? g.add(sL).add(sR) : null,
          pts: [[0, 0], [N(g), 0], [N(p), N(h)]],
          sides,
          dashed: [[[N(p), N(h)], [N(p), 0]]],
          inner: [{ line: [[N(p), N(h)], [N(p), 0]], t: "h = " + Fu(h) }],
          rights: [],
          parts: ["Grundseite g = " + Fu(g), "Höhe des Dreiecks h = " + Fu(h)].concat(sL ? ["Seite a = " + Fu(sL), "Seite b = " + Fu(sR)] : []),
        };
      }
      case "trap": {
        // a: untere Parallelseite, c: obere Parallelseite, h: Höhe, s: Schenkel (gleich lang)
        const { a, c, h, s } = d;
        const M = Math.max(N(a), N(c));
        const xb0 = (M - N(a)) / 2, xt0 = (M - N(c)) / 2, xs = (M - Math.min(N(a), N(c))) / 2;
        const sides = [{ i: 0, t: "a = " + Fu(a) }, { i: 2, t: "c = " + Fu(c) }];
        if (s) sides.push({ i: 1, t: "s = " + Fu(s) });
        return {
          kind, name: "Trapezprisma", G: a.add(c).mul(h).div(2), u: s ? a.add(c).add(s.mul(2)) : null,
          pts: [[xb0, 0], [xb0 + N(a), 0], [xt0 + N(c), N(h)], [xt0, N(h)]],
          sides,
          dashed: [[[xs, 0], [xs, N(h)]]],
          inner: [{ line: [[xs, N(h)], [xs, 0]], t: "h = " + Fu(h) }],
          rights: [],
          parts: ["parallele Seiten a = " + Fu(a) + " und c = " + Fu(c), "Höhe des Trapezes h = " + Fu(h)].concat(s ? ["Schenkel s = " + Fu(s)] : []),
        };
      }
      case "kite": {
        // Drachen: Diagonale e (waagerecht), Diagonale f = f1 + f2 (senkrecht), Schnittpunkt bei u
        const { e, f1, f2, u, f } = d;
        return {
          kind, name: "Drachenprisma", G: e.mul(f).div(2), u: null,
          pts: [[0, N(f2)], [N(u), 0], [N(e), N(f2)], [N(u), N(f)]],
          sides: [],
          dashed: [[[0, N(f2)], [N(e), N(f2)]], [[N(u), 0], [N(u), N(f)]]],
          inner: [
            { line: [[0, N(f2)], [N(e), N(f2)]], t: "e = " + Fu(e) },
            { line: [[N(u), 0], [N(u), N(f)]], t: "f = " + Fu(f) },
          ],
          rights: [[[N(u), N(f2)], [0, N(f2)], [N(u), N(f)]]],
          parts: ["Diagonale e = " + Fu(e), "Diagonale f = " + Fu(f)],
        };
      }
    }
    throw new Error("unbekannte Grundfläche " + kind);
  }

  // Flächen unabhängig nachrechnen (für verify)
  function areaOf(kind, d) {
    switch (kind) {
      case "rect": return d.a.mul(d.c);
      case "para": return d.g.mul(d.h);
      case "tri": return d.g.mul(d.h).div(2);
      case "trap": return d.a.add(d.c).mul(d.h).div(2);
      case "kite": return d.e.mul(d.f).div(2);
    }
    throw new Error("kind " + kind);
  }
  function perimOf(kind, d) {
    switch (kind) {
      case "rect": return d.a.add(d.c).mul(2);
      case "para": return d.g.add(d.s).mul(2);
      case "tri": return d.g.add(d.sL).add(d.sR);
      case "trap": return d.a.add(d.c).add(d.s.mul(2));
    }
    throw new Error("kein Umfang für " + kind);
  }
  function perimTxt(kind, d, U) {
    const x = v => nf(v) + " " + U;
    switch (kind) {
      case "rect": return `2 · (${x(d.a)} + ${x(d.c)})`;
      case "para": return `2 · (${x(d.g)} + ${x(d.s)})`;
      case "tri": return `${x(d.g)} + ${x(d.sL)} + ${x(d.sR)}`;
      case "trap": return `${x(d.a)} + ${x(d.c)} + 2 · ${x(d.s)}`;
    }
    return "";
  }
  // Rechenzeile zur Grundfläche (Einheit im Quadrat)
  function gStep(b, d, U) {
    const sq = U + "²", G = nf(b.G);
    switch (b.kind) {
      case "rect": return `G = ${nf(d.a)} ${U} · ${nf(d.c)} ${U} = ${G} ${sq}`;
      case "para": return `G = ${nf(d.g)} ${U} · ${nf(d.h)} ${U} = ${G} ${sq}`;
      case "tri": return `G = ${nf(d.g)} ${U} · ${nf(d.h)} ${U} : 2 = ${G} ${sq}`;
      case "trap": return `G = (${nf(d.a)} ${U} + ${nf(d.c)} ${U}) · ${nf(d.h)} ${U} : 2 = ${G} ${sq}`;
      case "kite": return `G = ${nf(d.e)} ${U} · ${nf(d.f)} ${U} : 2 = ${G} ${sq}`;
    }
    return "";
  }

  // ---------- Skizze: gerades Prisma als Schrägbild ----------
  // Anzahl der Treffer eines Textfelds (Mitte cx, cy) mit Linien, Rändern und bereits gesetzten Maßen
  function clashScore(cx, cy, w, h, segs, boxes, W, H) {
    const x0 = cx - w / 2 - 0.6, x1 = cx + w / 2 + 0.6, y0 = cy - h / 2 - 0.6, y1 = cy + h / 2 + 0.6;
    let hits = 0;
    if (Number.isFinite(W) && (x0 < 0.5 || x1 > W - 0.5 || y0 < 0.5 || y1 > H - 0.5)) hits += 50;
    for (const [bx0, by0, bx1, by1] of boxes) if (x0 < bx1 && x1 > bx0 && y0 < by1 && y1 > by0) hits += 50;
    for (const [p, q] of segs) {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.ceil(L / 0.3));
      for (let k = 0; k <= n; k++) {
        const x = p[0] + (q[0] - p[0]) * k / n, y = p[1] + (q[1] - p[1]) * k / n;
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { hits++; break; }
      }
    }
    return hits;
  }

  // Freie Stelle für eine Innenbeschriftung neben ihrer Linie (cm-Koordinaten) suchen
  function freeSpot(text, line, f, segs, boxes, W, H) {
    const size = 3.4, w = text.length * size * 0.56, h = size;
    const A = f(line[0]), B = f(line[1]);
    const score = (cx, cy) => clashScore(cx, cy, w, h, segs, boxes, W, H);
    let best = null;
    for (const t of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) {
      const mx = A[0] + (B[0] - A[0]) * t, my = A[1] + (B[1] - A[1]) * t;
      const cand = [
        [mx + w / 2 + 1.4, my], [mx - w / 2 - 1.4, my],
        [mx, my + h / 2 + 1.6], [mx, my - h / 2 - 1.6],
        [mx + w / 2 + 1, my + h / 2 + 1], [mx - w / 2 - 1, my - h / 2 - 1],
      ];
      for (const [cx, cy] of cand) {
        const sc = score(cx, cy);
        if (sc === 0) return [cx, cy];
        if (!best || sc < best.sc) best = { sc, p: [cx, cy] };
      }
    }
    if (best.sc === 0) return best.p;
    // Kein freier Platz direkt an der Linie: Raster in der Nähe absuchen, möglichst nah an der Linie
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const grid = [];
    for (let dx = -30; dx <= 30; dx += 1.5) for (let dy = -14; dy <= 14; dy += 1.5) {
      const d = Math.hypot(dx, dy);
      if (d <= 26) grid.push([d, [mid[0] + dx, mid[1] + dy]]);
    }
    grid.sort((u, v) => u[0] - v[0]);
    for (const [, c] of grid) if (score(c[0], c[1]) === 0) return c;
    return best.p;
  }

  // Seitenmaß an der Strecke a→c: zuerst außen, dann innen (nach Kollisionsprüfung)
  function sideSpot(a, c, text, C, segs, boxes, W, H) {
    const size = 3.4, w = text.length * size * 0.56, h = size;
    const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2;
    let nx = -(c[1] - a[1]), ny = c[0] - a[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    if ((C[0] - mx) * nx + (C[1] - my) * ny > 0) { nx = -nx; ny = -ny; }   // nx, ny zeigt nach außen
    const reach = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2;
    const tryDirs = [[nx, ny], [-nx, -ny]];
    for (const dd of [size * 0.95, size * 1.5, size * 2.2]) for (const [ux, uy] of tryDirs) {
      const cx = mx + ux * (dd + reach), cy = my + uy * (dd + reach);
      if (clashScore(cx, cy, w, h, segs, boxes, W, H) === 0) return [cx, cy];
    }
    // Kein freier Platz an der Strecke: Raster in der Nähe absuchen
    const grid = [];
    for (let dx = -26; dx <= 26; dx += 1.5) for (let dy = -16; dy <= 16; dy += 1.5) {
      const d = Math.hypot(dx, dy);
      if (d <= 24) grid.push([d, [mx + dx, my + dy]]);
    }
    grid.sort((u, v) => u[0] - v[0]);
    for (const [, c] of grid) if (clashScore(c[0], c[1], w, h, segs, boxes, W, H) === 0) return c;
    return [mx + nx * (size * 0.95 + reach), my + ny * (size * 0.95 + reach)];
  }

  // Skizze eines geraden Prismas als Schrägbild (nicht maßstabsgetreu):
  // Höhe der vorderen Grundfläche mindestens 45 % ihrer Breite, schräge Tiefe mindestens 35 % der Breite.
  // Verdeckte Kanten sind immer gestrichelt. Die Zeichenfläche wird eng um die Figur gelegt (max. 75 × 50 mm).
  function prismSketch(b, len, lenText) {
    const M = 2, MAXW = 75, MAXH = 50;
    const minZ = Math.min(...b.pts.map(p => p[1])), maxZ = Math.max(...b.pts.map(p => p[1]));
    const wF = Math.max(...b.pts.map(p => p[0])) - Math.min(...b.pts.map(p => p[0])), hF = maxZ - minZ;
    const sy = hF < 0.45 * wF ? 0.45 * wF / hF : 1;
    const T = p => [p[0], minZ + (p[1] - minZ) * sy];
    const pts = b.pts.map(T), n = pts.length;
    const Ld = Math.max(len, 0.7 * wF);             // gezeichnete Tiefe = Ld/2 ≥ 35 % der Breite
    const k = 0.5 * SQ * Ld;
    const back = pts.map(p => [p[0] + k, p[1] + k]);
    // Seitenfläche i (Kante i→i+1) ist sichtbar, wenn ihre Normale nach oben oder rechts zeigt
    const vis = pts.map((p, i) => { const q = pts[(i + 1) % n]; return (q[1] - p[1]) - (q[0] - p[0]) > -1e-9; });
    const all = pts.concat(back);
    const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
    const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
    const C0 = [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
    const dashed = b.dashed.map(([a, c]) => [T(a), T(c)]);
    const rights = b.rights.map(r => r.map(T));
    const inner = b.inner.map(o => ({ t: o.t, line: o.line.map(T) }));

    // Zeichnen mit Maßstab sc und Verschiebung (ox, oy); W, H = Infinity: ohne Randprüfung
    function build(sc, ox, oy, W, H) {
      const f = p => [ox + (p[0] - minX) * sc, oy + (maxY - p[1]) * sc];
      const P = pts.map(f), B = back.map(f), S = AG.sketch(W, H);
      const segs = [], boxes = [];
      const line = (a, c, o) => { S.line(a, c, o); segs.push([a, c]); };
      const C = f(C0);
      S.poly(P);                                     // vordere Fläche hellblau
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        line(B[i], B[j], vis[i] ? undefined : { dash: true });
      }
      for (let j = 0; j < n; j++) {
        line(P[j], B[j], (vis[j] || vis[(j - 1 + n) % n]) ? undefined : { dash: true });
      }
      for (let i = 0; i < n; i++) segs.push([P[i], P[(i + 1) % n]]);
      dashed.forEach(([a, c]) => line(f(a), f(c), { dash: true }));
      rights.forEach(([v, p, q]) => S.right(f(v), f(p), f(q)));
      // Seitenmaße: waagrechte obere Kante über die hintere Kante bemaßen (liegt sonst auf der Fläche)
      b.sides.forEach(({ i, t }) => {
        const j = (i + 1) % n;
        const top = vis[i] && Math.abs(pts[j][1] - pts[i][1]) < 1e-9;
        const ea = top ? B[i] : P[i], eb = top ? B[j] : P[j];
        const [cx, cy] = sideSpot(ea, eb, t, C, segs, boxes, W, H);
        S.label([cx, cy], t, { anchor: "middle" });
        const w = t.length * 3.4 * 0.56;
        boxes.push([cx - w / 2 - 0.5, cy - 2.2, cx + w / 2 + 0.5, cy + 2.2]);
      });
      inner.forEach(o => {
        const q = freeSpot(o.t, o.line, f, segs, boxes, W, H);
        S.label(q, o.t, { anchor: "middle" });
        const w = o.t.length * 3.4 * 0.56;
        boxes.push([q[0] - w / 2 - 0.5, q[1] - 2.2, q[0] + w / 2 + 0.5, q[1] + 2.2]);
      });
      // Körperhöhe (bzw. Breite b): rechts neben der Figur, auf Höhe der Kantenmitte der äußersten rechten Ecke
      let j = 0;
      pts.forEach((p, i) => { if (p[0] > pts[j][0] + 1e-9 || (Math.abs(p[0] - pts[j][0]) < 1e-9 && p[1] > pts[j][1])) j = i; });
      const m = [(P[j][0] + B[j][0]) / 2, (P[j][1] + B[j][1]) / 2];
      const rightX = Math.max(...B.map(p => p[0]), ...P.map(p => p[0]));
      const lx = rightX + 1.8, ly = m[1] + 1.2, lw = lenText.length * 3.4 * 0.56;
      S.label([lx, ly], lenText, { anchor: "start" });
      boxes.push([lx - 0.5, ly - 2.2, lx + lw + 0.5, ly + 2.2]);
      return { S, segs, boxes };
    }
    const bounds = r => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
      r.segs.forEach(([p, q]) => { add(p[0], p[1]); add(q[0], q[1]); });
      r.boxes.forEach(([a, c, d2, e]) => { add(a, c); add(d2, e); });
      return { x0, y0, x1, y1 };
    };
    // Maßstab so wählen, dass Figur mit Maßen die Zeichenfläche ausfüllt
    let sc = Math.min(60 / ((maxX - minX) || 1), 36 / ((maxY - minY) || 1));
    for (let it = 0; it < 8; it++) {
      const bb = bounds(build(sc, 0, 0, Infinity, Infinity));
      const fit = Math.min((MAXW - 2 * M) / (bb.x1 - bb.x0), (MAXH - 2 * M) / (bb.y1 - bb.y0));
      sc *= fit;
      if (Math.abs(fit - 1) < 0.005) break;
    }
    for (let g = 0; g < 40; g++) {
      const bb = bounds(build(sc, 0, 0, Infinity, Infinity));
      if (bb.x1 - bb.x0 <= MAXW - 2 * M && bb.y1 - bb.y0 <= MAXH - 2 * M) break;
      sc *= 0.98;
    }
    const bb = bounds(build(sc, 0, 0, Infinity, Infinity));
    const W = bb.x1 - bb.x0 + 2 * M, H = bb.y1 - bb.y0 + 2 * M;
    return build(sc, M - bb.x0, M - bb.y0, W, H).S.done();
  }

  // Körperhöhe bzw. beim Quader die Breite b (schräg nach hinten)
  const lenSym = kind => (kind === "rect" ? "b" : "hk");
  const lenWord = kind => (kind === "rect" ? "Breite b" : "Körperhöhe hk");

  // ---------- Volumen ----------
  function volDims(rng, kind, dec) {
    const v = (lo, hi) => dec ? tn(rng, lo * 10, hi * 10) : iv(rng, lo, hi);
    switch (kind) {
      case "rect": return { a: v(3, 12), c: v(2, 9) };
      case "para": { const g = v(3, 12); return { g, h: v(2, 9), p: g.mul(ci(rng.int(2, 7))).div(10) }; }
      case "tri": { const g = v(4, 12); return { g, h: v(2, 9), p: g.mul(ci(rng.int(2, 8))).div(10) }; }
      case "trap": return { a: v(3, 12), c: v(2, 10), h: v(2, 9) };
      case "kite": {
        const e = v(4, 12), f1 = v(1, 6), f2 = v(1, 6);
        return { e, f1, f2, f: f1.add(f2), u: e.mul(ci(rng.int(3, 7))).div(10) };
      }
    }
    throw new Error("kind " + kind);
  }

  // Aufgabe mit Grundfläche, Körperhöhe bzw. Länge und Volumen (Klassenstufe 7, Regelklasse und M-Zug)
  function volTask(rng, level, M) {
    const mode = level === 1 ? "cm" : level === 2 ? (rng.chance(0.5) ? "dm" : "ml") : "umk";
    const U = mode === "dm" ? "dm" : "cm", cu = U + "³";
    const dec = level === 2;
    const kind = rng.pick(M ? ["rect", "para", "tri", "trap", "kite"] : ["rect", "para", "tri"]);
    const d = volDims(rng, kind, dec);
    if (kind === "trap" && d.a.cmp(d.c) === 0) return null;
    const b = base(kind, d, U);
    const len = dec ? tn(rng, 20, 120) : iv(rng, 3, 12);   // Körperhöhe hk, beim Quader die Breite b
    const V = b.G.mul(len);
    if (dec ? !okDec(V) : !V.isInt()) return null;
    const head = `${b.name}: ${b.parts.join(", ")}`;
    const sym = lenSym(kind), word = lenWord(kind);
    const steps = [gStep(b, d, U)];
    const vStep = kind === "rect"
      ? `V = a · b · c = ${nf(d.a)} ${U} · ${nf(len)} ${U} · ${nf(d.c)} ${U} = ${nf(V)} ${cu}`
      : `V = G · hk = ${nf(b.G)} ${U}² · ${nf(len)} ${U} = ${nf(V)} ${cu}`;
    let q, a, ans, lenText;
    if (mode === "umk") {
      q = `${head}. Das Prisma hat das Volumen V = ${nf(V)} ${cu}. Berechne die ${word}.`;
      steps.push(`${sym} = V : G = ${nf(V)} ${cu} : ${nf(b.G)} ${U}² = ${nf(len)} ${U}`);
      a = `${sym} = ${nf(len)} ${U}`;
      lenText = `${sym} = ?`;
    } else {
      q = `${head}, ${word} = ${F(len, U)}. `;
      steps.push(vStep);
      if (mode === "dm") {
        q += "Berechne das Volumen in Litern (1 dm³ = 1 l).";
        ans = "l";
        steps.push(`${nf(V)} dm³ = ${nf(V)} l`);
      } else if (mode === "ml") {
        q += "Berechne das Volumen in Millilitern (1 cm³ = 1 ml).";
        ans = "ml";
        steps.push(`${nf(V)} cm³ = ${nf(V)} ml`);
      } else {
        q += "Berechne das Volumen.";
        ans = "cm³";
      }
      a = `${nf(V)} ${ans}`;
      lenText = `${sym} = ` + F(len, U);
    }
    return {
      q: rich(q), a: rich(a), steps: steps.map(s => rich(s)),
      fig: prismSketch(b, N(len), lenText), inline: false,
      check: { type: "vol", kind, d, len, mode, unit: U, ans: mode === "umk" ? null : ans, scale: 1, V },
    };
  }

  // Sachaufgaben: Zelt, Dachboden, Schwimmbecken (Trapez), Futtertrog (Umrechnung in Liter)
  function sachVol(rng) {
    const pick = rng.pick(["zelt", "dach", "pool", "trog"]);
    let kind, d, U, len, ans, scale = 1, ctx, sumDec = 2;
    if (pick === "zelt") {
      kind = "tri"; U = "m";
      const g = tn(rng, 12, 30), h = tn(rng, 10, 25);
      d = { g, h, p: g.mul(ci(rng.int(4, 6))).div(10) };
      len = iv(rng, 2, 6); ans = "m³";
      ctx = `Ein Zelt hat die Form eines Dreiecksprismas. Der Querschnitt ist ein Dreieck mit Grundseite g = ${F(g, U)} und Höhe h = ${F(h, U)}. Das Zelt ist ${F(len, U)} lang. Wie viel Luft (Rauminhalt) hat das Zelt?`;
    } else if (pick === "dach") {
      kind = "tri"; U = "m";
      const g = iv(rng, 4, 9), h = tn(rng, 15, 35);
      d = { g, h, p: iv(rng, 1, N(g) - 1) };
      len = iv(rng, 6, 12); ans = "m³";
      ctx = `Der Dachboden eines Hauses hat die Form eines Dreiecksprismas (Giebeldach). Der Querschnitt ist ein Dreieck mit Grundseite g = ${F(g, U)} und Höhe h = ${F(h, U)}. Der Dachboden ist ${F(len, U)} lang. Wie viele Kubikmeter Luft hat der Dachboden?`;
    } else if (pick === "pool") {
      kind = "trap"; U = "m"; sumDec = 3;
      const a = tn(rng, 15, 25), c = a.add(tn(rng, 5, 15)), h = tn(rng, 10, 20);
      d = { a, c, h };
      len = iv(rng, 5, 20); ans = "l"; scale = 1000;
      ctx = `Ein Schwimmbecken hat einen trapezförmigen Querschnitt. Am Boden ist es a = ${F(a, U)} breit, oben c = ${F(c, U)}. Die Tiefe (Höhe des Trapezes) beträgt h = ${F(h, U)}. Das Becken ist ${F(len, U)} lang. Wie viele Liter Wasser passen höchstens hinein? (1 m³ = 1000 l)`;
    } else {
      kind = "tri"; U = "dm";
      const g = iv(rng, 6, 12), h = iv(rng, 4, 10);
      if ((N(g) * N(h)) % 2) return null;
      d = { g, h, p: iv(rng, 1, N(g) - 1) };
      len = iv(rng, 8, 20); ans = "l";
      ctx = `Ein Futtertrog hat die Form eines Dreiecksprismas. Der Querschnitt ist ein Dreieck mit Grundseite g = ${F(g, U)} und Höhe h = ${F(h, U)}. Der Trog ist ${F(len, U)} lang. Wie viele Liter Wasser passen höchstens hinein? (1 dm³ = 1 l)`;
    }
    const b = base(kind, d, U);
    const V = b.G.mul(len), Vs = V.mul(scale);
    if (!okDec(V, sumDec) || !Vs.isInt()) return null;
    const steps = [gStep(b, d, U), `V = G · L = ${nf(b.G)} ${U}² · ${nf(len)} ${U} = ${nf(V)} ${U}³`];
    if (pick === "pool") steps.push(`${nf(V)} m³ = ${nf(V)} · 1000 l = ${nf(Vs)} l`);
    if (pick === "trog") steps.push(`${nf(V)} dm³ = ${nf(V)} l`);
    return {
      q: rich(ctx), a: rich(`${nf(Vs)} ${ans}`), steps: steps.map(s => rich(s)),
      fig: prismSketch(b, N(len), "L = " + F(len, U)), inline: false,
      check: { type: "vol", kind, d, len, mode: "sach", unit: U, ans, scale, V },
    };
  }

  AG.registerType({
    id: "m7-prisma-volumen",
    klasse: "7",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – gerade Prismen",
    title: "Volumen von Prismen",
    instruction: {
      1: "Berechne das Volumen des Prismas.",
      2: "Berechne das Volumen. Gib das Ergebnis in der angegebenen Einheit an.",
      3: "Berechne die gesuchte Größe bzw. löse die Sachaufgabe.",
    },
    merke: [
      "Gerades Prisma: ", { b: "V = G · hk" }, " (G Grundfläche, hk Körperhöhe). Beispiel: Dreieck mit g = 6 cm, h = 4 cm, hk = 9 cm → G = 6 cm · 4 cm : 2 = 12 cm², V = 12 cm² · 9 cm = 108 cm³.",
    ],
    cols: 2,
    generate(rng, level, ctx) {
      const M = ctx.zug === "M";
      for (let i = 0; i < 500; i++) {
        const t = level === 3 && rng.chance(0.4) ? sachVol(rng) : volTask(rng, level, M);
        if (t) return t;
      }
      throw new Error("m7-prisma-volumen: keine Aufgabe erzeugt");
    },
    verify(t) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      const G = areaOf(c.kind, c.d);
      const s = AG.plain(t.a);
      if (c.mode === "umk") {
        if (!G.mul(c.len).eq(c.V)) return "G · hk ≠ V";
        const exp = lenSym(c.kind) + " = " + nf(c.len) + " " + c.unit;
        return s === exp || `erwartet „${exp}“, steht „${s}“`;
      }
      const exp = nf(G.mul(c.len).mul(c.scale)) + " " + c.ans;
      return s === exp || `erwartet „${exp}“, steht „${s}“`;
    },
  });

  // ---------- Oberfläche ----------
  function oberDims(rng, kind) {
    switch (kind) {
      case "rect": return { a: iv(rng, 3, 12), c: iv(rng, 2, 9) };
      case "tri": {
        const [h, p0, q0, sL0, sR0] = rng.pick(TRI_TRIPLES);
        const sw = rng.chance(0.5);
        const [p, q, sL, sR] = sw ? [q0, p0, sR0, sL0] : [p0, q0, sL0, sR0];
        return { g: ci(p + q), h: ci(h), p: ci(p), sL: ci(sL), sR: ci(sR) };
      }
      case "para": {
        const t = rng.pick(PARA_TRIPLES);
        return { g: ci(rng.int(t.p + 2, 12)), h: ci(t.h), p: ci(t.p), s: ci(t.s) };
      }
      case "trap": {
        const t = rng.pick(TRAP_TRIPLES);
        const c = rng.int(2, 7), a = c + 2 * t.x0;
        const sw = rng.chance(0.5);
        return sw ? { a: ci(c), c: ci(a), h: ci(t.h), s: ci(t.s) } : { a: ci(a), c: ci(c), h: ci(t.h), s: ci(t.s) };
      }
    }
    throw new Error("kind " + kind);
  }

  function oberTask(rng, level, M) {
    const umk = level === 3 && rng.chance(0.5);
    const kind = rng.pick(M ? ["rect", "tri", "para", "trap"] : ["rect", "tri"]);
    const d = oberDims(rng, kind);
    const b = base(kind, d, "cm");
    const hk = level === 2 ? tn(rng, 20, 120) : iv(rng, 3, 12);   // beim Quader: Breite b
    const G = b.G, u = perimOf(kind, d), Mant = u.mul(hk), O = G.mul(2).add(Mant);
    if (level === 2 && !okDec(O)) return null;
    const head = `${b.name}: ${b.parts.join(", ")}`;
    const sym = lenSym(kind), word = lenWord(kind);
    const steps = [gStep(b, d, "cm"), `u = ${perimTxt(kind, d, "cm")} = ${nf(u)} cm`];
    let q, a, lenText;
    if (umk) {
      q = `${head}. Die Oberfläche beträgt O = ${nf(O)} cm². Berechne die ${word}.`;
      steps.push(`M = O − 2 · G = ${nf(O)} cm² − 2 · ${nf(G)} cm² = ${nf(Mant)} cm²`);
      steps.push(`${sym} = M : u = ${nf(Mant)} cm² : ${nf(u)} cm = ${nf(hk)} cm`);
      a = `${sym} = ${nf(hk)} cm`;
      lenText = `${sym} = ?`;
    } else {
      const sach = level === 3;
      q = sach
        ? `Eine Schachtel hat die Form eines Prismas (${b.name}: ${b.parts.join(", ")}, ${word} = ${F(hk, "cm")}). Wie viel Karton braucht man mindestens für die gesamte Oberfläche?`
        : `${head}, ${word} = ${F(hk, "cm")}. Berechne den Oberflächeninhalt.`;
      steps.push(`M = u · ${sym} = ${nf(u)} cm · ${nf(hk)} cm = ${nf(Mant)} cm²`);
      steps.push(`O = 2 · G + M = 2 · ${nf(G)} cm² + ${nf(Mant)} cm² = ${nf(O)} cm²`);
      a = `${nf(O)} cm²`;
      lenText = `${sym} = ` + F(hk, "cm");
    }
    return {
      q: rich(q), a: rich(a), steps: steps.map(s => rich(s)),
      fig: prismSketch(b, N(hk), lenText), inline: false,
      check: { type: "ober", kind, d, hk, mode: umk ? "umk" : "ober", O },
    };
  }

  AG.registerType({
    id: "m7-prisma-oberflaeche",
    klasse: "7",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt",
    title: "Oberfläche von Prismen",
    instruction: {
      1: "Berechne den Oberflächeninhalt des Prismas.",
      2: "Berechne den Oberflächeninhalt des Prismas.",
      3: "Berechne die gesuchte Größe bzw. löse die Sachaufgabe.",
    },
    merke: [
      "Gerades Prisma: ", { b: "O = 2 · G + M" }, ", M = u · hk (u Umfang der Grundfläche). Beispiel: Dreieck mit g = 6 cm, h = 4 cm, Seiten 5 cm und 5 cm, hk = 9 cm → G = 12 cm², u = 16 cm, M = 16 cm · 9 cm = 144 cm², O = 2 · 12 cm² + 144 cm² = 168 cm².",
    ],
    cols: 2,
    generate(rng, level, ctx) {
      const M = ctx.zug === "M";
      for (let i = 0; i < 500; i++) {
        const t = oberTask(rng, level, M);
        if (t) return t;
      }
      throw new Error("m7-prisma-oberflaeche: keine Aufgabe erzeugt");
    },
    verify(t) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      const G = areaOf(c.kind, c.d), u = perimOf(c.kind, c.d);
      const s = AG.plain(t.a);
      if (c.mode === "umk") {
        if (!G.mul(2).add(u.mul(c.hk)).eq(c.O)) return "2G + u·hk ≠ O";
        const exp = lenSym(c.kind) + " = " + nf(c.hk) + " cm";
        return s === exp || `erwartet „${exp}“, steht „${s}“`;
      }
      const exp = nf(G.mul(2).add(u.mul(c.hk))) + " cm²";
      return s === exp || `erwartet „${exp}“, steht „${s}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
