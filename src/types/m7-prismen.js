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
        const { a, b } = d;
        return {
          kind, name: "Quader", G: a.mul(b), u: a.add(b).mul(2),
          pts: [[0, 0], [N(a), 0], [N(a), N(b)], [0, N(b)]],
          sides: [{ i: 0, t: "a = " + Fu(a) }, { i: 3, t: "b = " + Fu(b) }],
          dashed: [], inner: [], rights: [],
          parts: ["Länge a = " + Fu(a), "Breite b = " + Fu(b)],
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
      case "rect": return d.a.mul(d.b);
      case "para": return d.g.mul(d.h);
      case "tri": return d.g.mul(d.h).div(2);
      case "trap": return d.a.add(d.c).mul(d.h).div(2);
      case "kite": return d.e.mul(d.f).div(2);
    }
    throw new Error("kind " + kind);
  }
  function perimOf(kind, d) {
    switch (kind) {
      case "rect": return d.a.add(d.b).mul(2);
      case "para": return d.g.add(d.s).mul(2);
      case "tri": return d.g.add(d.sL).add(d.sR);
      case "trap": return d.a.add(d.c).add(d.s.mul(2));
    }
    throw new Error("kein Umfang für " + kind);
  }
  function perimTxt(kind, d, U) {
    const x = v => nf(v) + " " + U;
    switch (kind) {
      case "rect": return `2 · (${x(d.a)} + ${x(d.b)})`;
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
      case "rect": return `G = ${nf(d.a)} ${U} · ${nf(d.b)} ${U} = ${G} ${sq}`;
      case "para": return `G = ${nf(d.g)} ${U} · ${nf(d.h)} ${U} = ${G} ${sq}`;
      case "tri": return `G = ${nf(d.g)} ${U} · ${nf(d.h)} ${U} : 2 = ${G} ${sq}`;
      case "trap": return `G = (${nf(d.a)} ${U} + ${nf(d.c)} ${U}) · ${nf(d.h)} ${U} : 2 = ${G} ${sq}`;
      case "kite": return `G = ${nf(d.e)} ${U} · ${nf(d.f)} ${U} : 2 = ${G} ${sq}`;
    }
    return "";
  }

  // ---------- Skizze: gerades Prisma als Schrägbild ----------
  // Grundfläche vorne in echter Form, Körperhöhe nach hinten rechts unter 45° und auf die Hälfte verkürzt.
  // Sichtbar sind die vordere Fläche und Seitenflächen, die nach oben oder rechts zeigen.
  // Verdeckte Kanten werden gestrichelt gezeichnet, aber dort ausgeblendet, wo sie hinter einer sichtbaren Fläche liegen.
  function segParam(a, b, c, d) {
    const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
    const den = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(den) < 1e-12) return null;
    const qp = [c[0] - a[0], c[1] - a[1]];
    const t = (qp[0] * s[1] - qp[1] * s[0]) / den;
    const u = (qp[0] * r[1] - qp[1] * r[0]) / den;
    return u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
  }
  function inPoly(poly, p) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // Teilstrecken von a→b, die nicht innerhalb der Polygone liegen
  function hiddenParts(a, b, polys) {
    const ts = [0, 1];
    for (const poly of polys) for (let i = 0; i < poly.length; i++) {
      const t = segParam(a, b, poly[i], poly[(i + 1) % poly.length]);
      if (t !== null && t > 1e-9 && t < 1 - 1e-9) ts.push(t);
    }
    ts.sort((x, y) => x - y);
    const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const out = [];
    for (let k = 0; k + 1 < ts.length; k++) {
      const t0 = ts[k], t1 = ts[k + 1];
      if (t1 - t0 < 1e-6) continue;
      const pm = at((t0 + t1) / 2);
      if (!polys.some(poly => inPoly(poly, pm))) out.push([at(t0), at(t1)]);
    }
    return out;
  }

  // Freie Stelle für eine Beschriftung suchen: neben der Linie, ohne eine andere Linie zu berühren
  function freeSpot(text, line, f, segs, W, H) {
    const size = 3.4, w = text.length * size * 0.56, h = size;
    const A = f(line[0]), B = f(line[1]);
    const hit = (cx, cy) => {
      const x0 = cx - w / 2 - 0.6, x1 = cx + w / 2 + 0.6, y0 = cy - h / 2 - 0.6, y1 = cy + h / 2 + 0.6;
      if (x0 < 0.5 || x1 > W - 0.5 || y0 < 0.5 || y1 > H - 0.5) return true;
      return segs.some(([p, q]) => {
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.ceil(L / 0.3));
        for (let k = 0; k <= n; k++) {
          const x = p[0] + (q[0] - p[0]) * k / n, y = p[1] + (q[1] - p[1]) * k / n;
          if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return true;
        }
        return false;
      });
    };
    for (const t of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const mx = A[0] + (B[0] - A[0]) * t, my = A[1] + (B[1] - A[1]) * t;
      const cand = [
        [mx + w / 2 + 1.4, my], [mx - w / 2 - 1.4, my],
        [mx, my + h / 2 + 1.6], [mx, my - h / 2 - 1.6],
      ];
      for (const [cx, cy] of cand) if (!hit(cx, cy)) return { p: [cx, cy], anchor: "middle" };
    }
    return { p: [A[0] + 1.4 + w / 2, (A[1] + B[1]) / 2], anchor: "middle" };
  }

  function prismSketch(b, len, lenText) {
    const W = 72, H = 46;
    const pts = b.pts, n = pts.length;
    const k = 0.5 * SQ * len;                       // Tiefenvektor: 45°, Länge halbiert
    const back = pts.map(p => [p[0] + k, p[1] + k]);
    // Seitenfläche i (Kante i→i+1) ist sichtbar, wenn ihre Normale nach oben oder rechts zeigt
    const vis = pts.map((p, i) => { const q = pts[(i + 1) % n]; return (q[1] - p[1]) - (q[0] - p[0]) > -1e-9; });
    // Maßstab mit Platz links (Seitenmaße), rechts (Körperhöhe), oben und unten
    const padL = 13, padR = 24, padT = 9, padB = 9;
    const all = pts.concat(back);
    const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
    const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
    const areaW = W - padL - padR, areaH = H - padT - padB;
    const sc = Math.min(areaW / ((maxX - minX) || 1), areaH / ((maxY - minY) || 1));
    const ox = padL + (areaW - (maxX - minX) * sc) / 2, oy = padB + (areaH - (maxY - minY) * sc) / 2;
    const f = p => [ox + (p[0] - minX) * sc, H - oy - (p[1] - minY) * sc];
    const P = pts.map(f), B = back.map(f), S = AG.sketch(W, H);
    const segs = [];
    const line = (a, c, o) => { S.line(a, c, o); segs.push([a, c]); };
    const occ = [P];
    vis.forEach((v, i) => { if (v) occ.push([P[i], P[(i + 1) % n], B[(i + 1) % n], B[i]]); });
    const hidden = (a, c) => hiddenParts(a, c, occ).forEach(([x, y]) => line(x, y, { dash: true }));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (vis[i]) line(B[i], B[j]); else hidden(B[i], B[j]);
    }
    for (let j = 0; j < n; j++) {
      if (vis[j] || vis[(j - 1 + n) % n]) line(P[j], B[j]); else hidden(P[j], B[j]);
    }
    for (let i = 0; i < n; i++) segs.push([P[i], P[(i + 1) % n]]);
    S.poly(P);
    const C = [P.reduce((s, p) => s + p[0], 0) / n, P.reduce((s, p) => s + p[1], 0) / n];
    b.dashed.forEach(([a, c]) => line(f(a), f(c), { dash: true }));
    b.rights.forEach(([v, p, q]) => S.right(f(v), f(p), f(q)));
    b.sides.forEach(({ i, t }) => S.side(P[i], P[(i + 1) % n], t, { inside: C }));
    b.inner.forEach(o => {
      const spot = freeSpot(o.t, o.line.map(f), f, segs, W, H);
      S.label(spot.p, o.t, { anchor: spot.anchor });
    });
    // Körperhöhe: rechts neben der Mitte der Kante an der äußersten rechten Ecke
    let j = 0;
    pts.forEach((p, i) => { if (p[0] > pts[j][0] + 1e-9 || (Math.abs(p[0] - pts[j][0]) < 1e-9 && p[1] > pts[j][1])) j = i; });
    const m = [(P[j][0] + B[j][0]) / 2, (P[j][1] + B[j][1]) / 2];
    S.label([m[0] + 2.2, m[1] + 1.2], lenText, { anchor: "start" });
    return S.done();
  }

  // ---------- Volumen ----------
  function volDims(rng, kind, dec) {
    const v = (lo, hi) => dec ? tn(rng, lo * 10, hi * 10) : iv(rng, lo, hi);
    switch (kind) {
      case "rect": return { a: v(3, 12), b: v(2, 9) };
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
    const len = dec ? tn(rng, 20, 120) : iv(rng, 3, 12);
    const V = b.G.mul(len);
    if (dec ? !okDec(V) : !V.isInt()) return null;
    const head = `${b.name}: ${b.parts.join(", ")}`;
    const steps = [gStep(b, d, U)];
    let q, a, ans, lenText;
    if (mode === "umk") {
      q = `${head}. Das Prisma hat das Volumen V = ${nf(V)} ${cu}. Berechne die Körperhöhe hk.`;
      steps.push(`hk = V : G = ${nf(V)} ${cu} : ${nf(b.G)} ${U}² = ${nf(len)} ${U}`);
      a = `hk = ${nf(len)} ${U}`;
      lenText = "hk = ?";
    } else {
      q = `${head}, Körperhöhe hk = ${F(len, U)}. `;
      steps.push(`V = G · hk = ${nf(b.G)} ${U}² · ${nf(len)} ${U} = ${nf(V)} ${cu}`);
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
      lenText = "hk = " + F(len, U);
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
        const exp = "hk = " + nf(c.len) + " " + c.unit;
        return s === exp || `erwartet „${exp}“, steht „${s}“`;
      }
      const exp = nf(G.mul(c.len).mul(c.scale)) + " " + c.ans;
      return s === exp || `erwartet „${exp}“, steht „${s}“`;
    },
  });

  // ---------- Oberfläche ----------
  function oberDims(rng, kind) {
    switch (kind) {
      case "rect": return { a: iv(rng, 3, 12), b: iv(rng, 2, 9) };
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
    const hk = level === 2 ? tn(rng, 20, 120) : iv(rng, 3, 12);
    const G = b.G, u = perimOf(kind, d), Mant = u.mul(hk), O = G.mul(2).add(Mant);
    if (level === 2 && !okDec(O)) return null;
    const head = `${b.name}: ${b.parts.join(", ")}`;
    const steps = [gStep(b, d, "cm"), `u = ${perimTxt(kind, d, "cm")} = ${nf(u)} cm`];
    let q, a, lenText;
    if (umk) {
      q = `${head}. Die Oberfläche beträgt O = ${nf(O)} cm². Berechne die Körperhöhe hk.`;
      steps.push(`M = O − 2 · G = ${nf(O)} cm² − 2 · ${nf(G)} cm² = ${nf(Mant)} cm²`);
      steps.push(`hk = M : u = ${nf(Mant)} cm² : ${nf(u)} cm = ${nf(hk)} cm`);
      a = `hk = ${nf(hk)} cm`;
      lenText = "hk = ?";
    } else {
      const sach = level === 3;
      q = sach
        ? `Eine Schachtel hat die Form eines Prismas (${b.name}: ${b.parts.join(", ")}, Körperhöhe hk = ${F(hk, "cm")}). Wie viel Karton braucht man mindestens für die gesamte Oberfläche?`
        : `${head}, Körperhöhe hk = ${F(hk, "cm")}. Berechne den Oberflächeninhalt.`;
      steps.push(`M = u · hk = ${nf(u)} cm · ${nf(hk)} cm = ${nf(Mant)} cm²`);
      steps.push(`O = 2 · G + M = 2 · ${nf(G)} cm² + ${nf(Mant)} cm² = ${nf(O)} cm²`);
      a = `${nf(O)} cm²`;
      lenText = "hk = " + F(hk, "cm");
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
        const exp = "hk = " + nf(c.hk) + " cm";
        return s === exp || `erwartet „${exp}“, steht „${s}“`;
      }
      const exp = nf(G.mul(2).add(u.mul(c.hk))) + " cm²";
      return s === exp || `erwartet „${exp}“, steht „${s}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
