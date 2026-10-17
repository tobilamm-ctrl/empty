// M8 LB 4 und LB 5: Zylinder (Mantel, Oberfläche, Volumen), Prismen (Volumen) und Hohlzylinder – mit Skizzen (Schrägbild).
// Typen: m8-zylinder-oberflaeche (LB 4), m8-zylinder-volumen (LB 5), m8-prisma-volumen (LB 5), m8-hohlzylinder (LB 5, nur M-Zug).
// Rechnung mit π ≈ 3,14 (exakt als Bruch 314/100). Ergebnisse auf 2 Nachkommastellen; sonst gerundet mit „≈“.
(function (AG) {
  const { Frac, rich, fmtDec, fmtInt, MINUS, SKETCH_COLORS } = AG;
  const INK = SKETCH_COLORS.INK, FILL = SKETCH_COLORS.FILL;

  const F = x => Frac.of(x);
  const PI = new Frac(314, 100), PIS = "3,14", TWO = new Frac(2);

  // ---------- Zahlen und Rechenzeilen ----------
  const tx = (x, U) => { const g = F(x); return (g.isInt() ? fmtInt(g.n) : fmtDec(g)) + (U ? " " + U : ""); };
  const cm = x => tx(x, "cm");
  const ex2 = x => { const g = F(x); return g.isTerminating() && g.decimals() <= 2; };
  const rd2 = x => { const g = F(x); return new Frac(Math.round((g.n * 100) / g.d), 100); };
  const rnd = (x, U) => fmtDec(rd2(x), 2) + (U ? " " + U : "");       // gerundet, immer 2 Stellen
  // Ergebnis: exakt, sonst gerundet mit ≈
  const res = (x, U) => (ex2(x) ? tx(x, U) : "≈ " + rnd(x, U));
  // Rechenzeile(n): exakt in einer Zeile; sonst zusätzlich eine gerundete Zeile mit ≈
  function calc(expr, x, U, lhs) {
    const g = F(x);
    if (!g.isTerminating()) return [`${expr} ≈ ${rnd(g, U)}`];
    if (ex2(g)) return [`${expr} = ${tx(g, U)}`];
    return [`${expr} = ${tx(g, U)}`, `${lhs} ≈ ${rnd(g, U)}`];
  }
  // Zwischenzeile: nur exakt (Zwischenergebnisse werden nicht gerundet)
  function calcE(expr, x, U) {
    const g = F(x);
    return [g.isTerminating() ? `${expr} = ${tx(g, U)}` : `${expr} ≈ ${rnd(g, U)}`];
  }
  const eqs = (x, U) => (ex2(x) ? "= " + tx(x, U) : "≈ " + rnd(x, U));
  const rules = steps => steps.map(s => rich(s));

  // ---------- Schrägbild Zylinder (Grund- und Deckkreis als Ellipsen) ----------
  const CW = 76, CH = 46, CX = 40, CA = 12.5, CRY = 4.5; // Breite/Höhe mm, Mitte, Radius waagrecht/senkrecht (mm)
  const pathD = (pts, closed) => "M" + pts.map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" L") + (closed ? " Z" : "");
  function ell(cx, cy, rx, ry, t0, t1, n = 48) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
    return out;
  }
  // o: r (Außenradius), h (Höhe, nur für die Proportion), ri (Innenradius, nur Hohlzylinder),
  // rLab, riLab, hLab (Beschriftungen), dLab (Durchmesser unten, optional)
  function cylFig(o) {
    const r = Number(o.r), h = Number(o.h);
    const hollow = o.ri !== undefined;
    const ri = hollow ? Number(o.ri) : 0;
    const hh = Math.min(20, Math.max(12, 4 + 2.5 * h / r));
    const total = 5 + hh + 2 * CRY + (o.dLab ? 9 : 0) + 0.5;
    const yT = (CH - total) / 2 + 5 + CRY, yB = yT + hh;
    const ai = hollow ? CA * ri / r : 0, bi = hollow ? CRY * ri / r : 0;
    const S = AG.sketch(CW, CH);
    const front = ell(CX, yB, CA, CRY, Math.PI, 0);                      // vordere untere Kante, links → rechts
    // Körper (Mantel) füllen
    S.path(pathD([...front, ...ell(CX, yT, CA, CRY, 0, -Math.PI)], true), { fill: FILL, stroke: "none" });
    // Deckfläche
    S.path(pathD(ell(CX, yT, CA, CRY, 0, 2 * Math.PI), true), { fill: FILL });
    if (hollow) S.path(pathD(ell(CX, yT, ai, bi, 0, 2 * Math.PI), true), { fill: "#fff" });
    // Mantellinien und sichtbare vordere Bodenkante
    S.line([CX - CA, yT], [CX - CA, yB]);
    S.line([CX + CA, yT], [CX + CA, yB]);
    S.path(pathD(front), {});
    // verdeckt: hintere Hälfte der unteren Ellipse
    S.path(pathD(ell(CX, yB, CA, CRY, Math.PI, 2 * Math.PI)), { dash: true });
    if (hollow) {
      S.path(pathD(ell(CX, yB, ai, bi, 0, 2 * Math.PI), true), { dash: true });
      S.line([CX - ai, yT], [CX - ai, yB], { dash: true });
      S.line([CX + ai, yT], [CX + ai, yB], { dash: true });
    }
    // Radius (außen rechts, mit Verlängerung zur Beschriftung)
    S.line([CX, yT], [CX + CA, yT]);
    S.circle([CX, yT], 0.5, { fill: INK });
    S.line([CX + CA, yT], [CX + CA + 1.6, yT], { width: 0.25 });
    S.label([CX + CA + 2.2, yT], o.rLab, { anchor: "start" });
    if (hollow) {
      S.line([CX, yT], [CX - ai, yT]);
      S.label([CX - 1, yT - CRY - 2.6], o.riLab, { anchor: "end" });
    }
    // Höhe h (links, Maßlinie mit Pfeilen)
    const dx = CX - CA - 5;
    S.line([dx, yT], [dx, yB], { width: 0.25 });
    S.path(`M${dx - 0.8},${yT + 1.2} L${dx},${yT} L${dx + 0.8},${yT + 1.2}`, { width: 0.25 });
    S.path(`M${dx - 0.8},${yB - 1.2} L${dx},${yB} L${dx + 0.8},${yB - 1.2}`, { width: 0.25 });
    S.line([CX - CA - 0.8, yT], [dx - 1, yT], { width: 0.2 });
    S.line([CX - CA - 0.8, yB], [dx - 1, yB], { width: 0.2 });
    S.label([dx - 1.8, (yT + yB) / 2], o.hLab, { anchor: "end" });
    // Durchmesser unten (optional)
    if (o.dLab) {
      const yd = yB + CRY + 2.5;
      S.line([CX - CA, yd], [CX + CA, yd], { width: 0.25 });
      S.path(`M${CX - CA + 1.2},${yd - 0.8} L${CX - CA},${yd} L${CX - CA + 1.2},${yd + 0.8}`, { width: 0.25 });
      S.path(`M${CX + CA - 1.2},${yd - 0.8} L${CX + CA},${yd} L${CX + CA - 1.2},${yd + 0.8}`, { width: 0.25 });
      S.label([CX, yd + 3.6], o.dLab, { anchor: "middle" });
    }
    return S.done();
  }

  // ---------- Schrägbild Prisma (Querschnitt P in x/z-Ebene, Länge nach hinten) ----------
  // o: P (Querschnitt, gegen den Uhrzeigersinn), len (Länge), smooth (Indizes glatter Punkte, z. B. Kreisbogen),
  //    labels: {edge: i, t} | {depth: j, t} | {along: [a, b], t} (Beschriftung neben einer Hilfslinie),
  //    lines: [{a, b}] (Hilfslinien, gestrichelt)
  function prismFig(o) {
    const W = 72, H = 44;
    const P = o.P, n = P.length;
    const xs = P.map(p => p[0]);
    const wF = Math.max(...xs) - Math.min(...xs);
    const hF = Math.max(...P.map(p => p[1])) - Math.min(...P.map(p => p[1]));
    const md = Math.max(wF, hF);
    const c = Math.max(0.2 * md, Math.min(0.35 * o.len, 0.5 * md));   // Tiefe der Zeichnung (nach oben rechts), nicht maßstäblich
    const B = P.map(p => [p[0] + c, p[1] + c]);
    const f = AG.fitPoints(P.concat(B), W, H, 9);
    const Pm = P.map(f), Bm = B.map(f);
    const cen = [Pm.reduce((s, p) => s + p[0], 0) / n, Pm.reduce((s, p) => s + p[1], 0) / n];
    // Seitenfläche i (Kante i → i+1) ist sichtbar, wenn ihre Normale nach oben oder rechts zeigt
    const vis = P.map((p, i) => { const q = P[(i + 1) % n]; return (q[1] - p[1]) - (q[0] - p[0]) > 1e-9; });
    const S = AG.sketch(W, H);
    for (let i = 0; i < n; i++) {
      if (!vis[i]) continue;
      const j = (i + 1) % n;
      S.poly([Pm[i], Pm[j], Bm[j], Bm[i]], { stroke: FILL, width: 0.15 });  // sichtbare Seiten füllen
    }
    S.poly(Pm);                                                       // vordere Fläche
    // hintere Kanten: sichtbar durchgezogen, verdeckt gestrichelt (zusammenhängende Stücke)
    const runs = [];
    for (let k = 0; k < n; k++) {
      const last = runs[runs.length - 1];
      if (last && last.v === vis[k]) last.pts.push(Bm[(k + 1) % n]);
      else runs.push({ v: vis[k], pts: [Bm[k], Bm[(k + 1) % n]] });
    }
    runs.forEach(r => S.path(pathD(r.pts, false), { dash: !r.v }));
    // Verbindungskanten an den Ecken (an glatten Punkten nur am Umriss)
    const sm = o.smooth || [];
    for (let j = 0; j < n; j++) {
      const vp = vis[(j - 1 + n) % n];
      if (vis[j] !== vp) S.line(Pm[j], Bm[j]);
      else if (!sm.includes(j)) S.line(Pm[j], Bm[j], { dash: !vis[j] });
    }
    const hidden = (o.lines || []).map(l => [f(l.a), f(l.b)]);
    hidden.forEach(([a, b]) => S.line(a, b, { dash: true }));
    // Beschriftungen: freie Stelle suchen (möglichst nicht über Kanten, Maßen oder anderen Texten)
    const segs = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; segs.push([Pm[i], Pm[j]], [Bm[i], Bm[j]], [Pm[i], Bm[i]]); }
    hidden.forEach(h => segs.push(h));
    const boxes = [];
    const bxOf = (t, x, y) => { const w = t.length * 3.4 * 0.56 + 2, h = 4.6; return [x - w / 2, y - h / 2, x + w / 2, y + h / 2]; };
    const hits = bx => {
      let k = 0;
      for (const [p, q] of segs) {
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]), m = Math.max(2, Math.ceil(L / 0.25));
        for (let i = 0; i <= m; i++) {
          const x = p[0] + (q[0] - p[0]) * i / m, y = p[1] + (q[1] - p[1]) * i / m;
          if (x > bx[0] && x < bx[2] && y > bx[1] && y < bx[3]) { k++; break; }
        }
      }
      return k;
    };
    const score = bx => hits(bx) * 10
      + (boxes.some(b => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]) ? 100 : 0)
      + (bx[0] < 0.6 || bx[2] > W - 0.6 || bx[1] < 0.6 || bx[3] > H - 0.6 ? 100 : 0);
    const put = (t, cands) => {
      let best = null;
      for (const [x, y] of cands) {
        const bx = bxOf(t, x, y), sc = score(bx);
        if (!best || sc < best.sc) best = { sc, x, y, bx };
        if (sc === 0) break;
      }
      boxes.push(best.bx);
      S.label([best.x, best.y], t, { anchor: "middle" });
    };
    // Kandidaten neben einer Außenkante (außen zuerst)
    const sideCands = (A, C, t) => {
      const mx = (A[0] + C[0]) / 2, my = (A[1] + C[1]) / 2;
      let nx = -(C[1] - A[1]), ny = C[0] - A[0];
      const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const out = (mx - cen[0]) * nx + (my - cen[1]) * ny > 0 ? 1 : -1;
      const res = [];
      for (const d of [3.2, 4.6, 6.2, 8]) for (const sg of [out, -out]) res.push([mx + sg * nx * d, my + sg * ny * d]);
      return res;
    };
    // Kandidaten neben einer Hilfslinie (Mitte)
    const midCands = (m, t) => {
      const w = t.length * 3.4 * 0.56 + 1, hg = 3.6, res = [];
      for (const d of [1.2, 3.0, 5.0, 7.0]) res.push([m[0] + w / 2 + d, m[1]], [m[0] - w / 2 - d, m[1]]);
      res.push([m[0], m[1] + hg / 2 + 1.5], [m[0], m[1] - hg / 2 - 1.5]);
      return res;
    };
    (o.labels || []).forEach(l => {
      if (l.edge !== undefined) { const j = (l.edge + 1) % n; put(l.t, sideCands(Pm[l.edge], Pm[j], l.t)); }
      else if (l.depth !== undefined) put(l.t, sideCands(Pm[l.depth], Bm[l.depth], l.t));
      else {
        const a = f(l.along[0]), b = f(l.along[1]);
        S.line(a, b, { dash: true });                                 // Höhe gestrichelt
        put(l.t, midCands([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l.t));
      }
    });
    return S.done();
  }

  // Querschnitt Haus: Rechteck a × h mit Halbkreis (Radius a/2) oben
  function housePts(a, h) {
    const r = a / 2, M = 18;
    const P = [[0, 0], [a, 0], [a, h]];
    for (let k = 1; k < M; k++) { const t = k * Math.PI / M; P.push([r + r * Math.cos(t), h + r * Math.sin(t)]); }
    P.push([0, h]);
    const smooth = [];
    for (let k = 3; k <= M + 1; k++) smooth.push(k);
    return { P, smooth };
  }

  // ---------- Typ 1: Zylinder – Mantel und Oberfläche ----------
  AG.registerType({
    id: "m8-zylinder-oberflaeche",
    klasse: "8",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Kreise",
    title: "Zylinder: Mantel und Oberfläche",
    topic: "koerper",
    instruction: {
      1: "Berechne die Mantelfläche M. Rechne mit π ≈ 3,14.",
      2: "Berechne die Oberfläche O. Rechne mit π ≈ 3,14.",
      3: "Löse die Sachaufgabe. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Mantelfläche: ", { b: "M = 2 · π · r · h" }, ". Oberfläche: ", { b: "O = 2 · G + M" }, " mit G = π · r² (Grund- und Deckfläche). ",
      "Beispiel: r = 2 cm, h = 5 cm → M = 2 · 3,14 · 2 cm · 5 cm = 62,8 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const R = new Frac(rng.int(2, 9)), Hh = new Frac(rng.int(3, 15));
        const M = TWO.mul(PI).mul(R).mul(Hh);
        return {
          q: rich(`Ein Zylinder hat den Radius r = ${cm(R)} und die Höhe h = ${cm(Hh)}. Berechne die Mantelfläche M.`),
          a: rich(res(M, "cm²")),
          steps: rules(["M = 2 · π · r · h", ...calc(`M = 2 · ${PIS} · ${cm(R)} · ${cm(Hh)}`, M, "cm²", "M")]),
          fig: cylFig({ r: R, h: Hh, rLab: `r = ${cm(R)}`, hLab: `h = ${cm(Hh)}` }),
          inline: false,
        };
      }
      if (level === 2) {
        const R = new Frac(rng.int(3, 10), 2), Hh = new Frac(rng.int(4, 14));
        const G = PI.mul(R).mul(R);
        const M = TWO.mul(PI).mul(R).mul(Hh);
        const O = TWO.mul(G).add(M);
        return {
          q: rich(`Ein Zylinder hat den Radius r = ${cm(R)} und die Höhe h = ${cm(Hh)}. Berechne die Oberfläche O.`),
          a: rich(res(O, "cm²")),
          steps: rules([
            "G = π · r²",
            `G = ${PIS} · (${cm(R)})² = ${tx(G, "cm²")}`,
            "M = 2 · π · r · h",
            ...calc(`M = 2 · ${PIS} · ${cm(R)} · ${cm(Hh)}`, M, "cm²", "M"),
            "O = 2 · G + M",
            `O = 2 · ${tx(G, "cm²")} + ${tx(M, "cm²")} ${eqs(O, "cm²")}`,
          ]),
          fig: cylFig({ r: R, h: Hh, rLab: `r = ${cm(R)}`, hLab: `h = ${cm(Hh)}` }),
          inline: false,
        };
      }
      // Niveau 3: Sachaufgaben oder Durchmesser gegeben
      const v = rng.int(0, 3);
      if (v <= 1) {
        // Dose (geschlossen) oder Etikett (nur Mantel), Durchmesser gegeben
        const rr = rng.int(3, 8), Hh = new Frac(rng.int(8, 15));
        const R = new Frac(rr), D = new Frac(2 * rr);
        const G = PI.mul(R).mul(R);
        const M = TWO.mul(PI).mul(R).mul(Hh);
        const fig = cylFig({ r: rr, h: Hh, rLab: "r = ?", hLab: `h = ${cm(Hh)}`, dLab: `d = ${cm(D)}` });
        const rLines = [`r = ${cm(D)} : 2 = ${cm(R)}`];
        if (v === 0) {
          const O = TWO.mul(G).add(M);
          return {
            q: rich(`Eine Konservendose hat den Durchmesser d = ${cm(D)} und die Höhe h = ${cm(Hh)}. Wie viel Blech braucht man für eine geschlossene Dose (mit Deckel und Boden)?`),
            a: rich(res(O, "cm²")),
            steps: rules([
              "r = d : 2", rLines[0],
              "G = π · r²",
              `G = ${PIS} · (${cm(R)})² = ${tx(G, "cm²")}`,
              "M = 2 · π · r · h",
              ...calc(`M = 2 · ${PIS} · ${cm(R)} · ${cm(Hh)}`, M, "cm²", "M"),
              "O = 2 · G + M",
              `O = 2 · ${tx(G, "cm²")} + ${tx(M, "cm²")} ${eqs(O, "cm²")}`,
            ]),
            fig,
            inline: false,
          };
        }
        return {
          q: rich(`Ein Etikett bedeckt genau den Mantel einer Dose mit dem Durchmesser d = ${cm(D)} und der Höhe h = ${cm(Hh)}. Wie groß ist das Etikett?`),
          a: rich(res(M, "cm²")),
          steps: rules([
            "r = d : 2", rLines[0],
            "M = 2 · π · r · h",
            ...calc(`M = 2 · ${PIS} · ${cm(R)} · ${cm(Hh)}`, M, "cm²", "M"),
          ]),
          fig,
          inline: false,
        };
      }
      if (v === 2) {
        // Litfaßsäule: nur der Mantel wird beklebt (Maße in m, Ergebnis oft gerundet)
        const R = new Frac(rng.int(4, 12), 10), Hh = new Frac(rng.int(2, 4));
        const M = TWO.mul(PI).mul(R).mul(Hh);
        return {
          q: rich(`Eine runde Litfaßsäule hat den Radius r = ${tx(R, "m")} und die Höhe h = ${tx(Hh, "m")}. Die Säule wird nur am Mantel beklebt. Wie viele Quadratmeter Plakatfläche hat sie?`),
          a: rich(res(M, "m²")),
          steps: rules([
            "M = 2 · π · r · h",
            ...calc(`M = 2 · ${PIS} · ${tx(R, "m")} · ${tx(Hh, "m")}`, M, "m²", "M"),
          ]),
          fig: cylFig({ r: R, h: Hh, rLab: `r = ${tx(R, "m")}`, hLab: `h = ${tx(Hh, "m")}` }),
          inline: false,
        };
      }
      // Topf ohne Deckel: O = G + M
      const R = new Frac(rng.int(5, 15)), Hh = new Frac(rng.int(10, 30));
      const G = PI.mul(R).mul(R);
      const M = TWO.mul(PI).mul(R).mul(Hh);
      const O = G.add(M);
      return {
        q: rich(`Ein Topf hat die Form eines Zylinders mit dem Radius r = ${cm(R)} und der Höhe h = ${cm(Hh)}. Der Topf hat keinen Deckel. Wie viel Blech braucht man für Boden und Mantel?`),
        a: rich(res(O, "cm²")),
        steps: rules([
          "G = π · r²",
          `G = ${PIS} · (${cm(R)})² = ${tx(G, "cm²")}`,
          "M = 2 · π · r · h",
          ...calc(`M = 2 · ${PIS} · ${cm(R)} · ${cm(Hh)}`, M, "cm²", "M"),
          "O = G + M (ohne Deckel)",
          `O = ${tx(G, "cm²")} + ${tx(M, "cm²")} ${eqs(O, "cm²")}`,
        ]),
        fig: cylFig({ r: R, h: Hh, rLab: `r = ${cm(R)}`, hLab: `h = ${cm(Hh)}` }),
        inline: false,
      };
    },
  });

  // ---------- Typ 2: Zylinder – Volumen ----------
  AG.registerType({
    id: "m8-zylinder-volumen",
    klasse: "8",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Zylinder",
    title: "Zylinder: Volumen",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen V. Rechne mit π ≈ 3,14.",
      2: "Berechne das Volumen in Litern. Rechne mit π ≈ 3,14. Es gilt 1 l = 1000 cm³.",
      3: "Löse die Aufgabe. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Zylinder: ", { b: "V = G · h = π · r² · h" }, " (G = Grundfläche). 1 l = 1000 cm³, 1 m³ = 1000 l. ",
      "Beispiel: r = 2 cm, h = 5 cm → V = 3,14 · 4 cm² · 5 cm = 62,8 cm³.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const R = new Frac(rng.int(2, 9)), Hh = new Frac(rng.int(3, 15));
        const V = PI.mul(R).mul(R).mul(Hh);
        return {
          q: rich(`Ein Zylinder hat den Radius r = ${cm(R)} und die Höhe h = ${cm(Hh)}. Berechne das Volumen V.`),
          a: rich(res(V, "cm³")),
          steps: rules(["V = π · r² · h", ...calc(`V = ${PIS} · (${cm(R)})² · ${cm(Hh)}`, V, "cm³", "V")]),
          fig: cylFig({ r: R, h: Hh, rLab: `r = ${cm(R)}`, hLab: `h = ${cm(Hh)}` }),
          inline: false,
        };
      }
      if (level === 2) {
        const rr = rng.int(3, 10), Hh = new Frac(rng.int(8, 40));
        const R = new Frac(rr), D = new Frac(2 * rr);
        const Vc = PI.mul(R).mul(R).mul(Hh);
        const Vl = Vc.div(1000);
        return {
          q: rich(`Ein zylindrischer Behälter hat den Durchmesser d = ${cm(D)} und die Höhe h = ${cm(Hh)}. Wie viel Liter passen höchstens hinein? (1 l = 1000 cm³)`),
          a: rich(res(Vl, "l")),
          steps: rules([
            "r = d : 2",
            `r = ${cm(D)} : 2 = ${cm(R)}`,
            "V = π · r² · h",
            ...calcE(`V = ${PIS} · (${cm(R)})² · ${cm(Hh)}`, Vc, "cm³"),
            ...calc(`V = ${tx(Vc, "cm³")} : 1000`, Vl, "l", "V"),
          ]),
          fig: cylFig({ r: R, h: Hh, rLab: "r = ?", hLab: `h = ${cm(Hh)}`, dLab: `d = ${cm(D)}` }),
          inline: false,
        };
      }
      const v = rng.int(0, 3);
      if (v === 0) {
        // Umkehraufgabe: Höhe aus V und r
        const R = new Frac(rng.int(2, 8)), Hh = new Frac(rng.int(5, 20));
        const G = PI.mul(R).mul(R);
        const V = G.mul(Hh);
        return {
          q: rich(`Ein Zylinder hat den Radius r = ${cm(R)} und das Volumen V = ${tx(V, "cm³")}. Berechne die Höhe h.`),
          a: rich(`h = ${cm(Hh)}`),
          steps: rules([
            "h = V : G",
            `G = ${PIS} · (${cm(R)})² = ${tx(G, "cm²")}`,
            `h = ${tx(V, "cm³")} : ${tx(G, "cm²")} = ${cm(Hh)}`,
          ]),
          fig: cylFig({ r: R, h: Hh, rLab: `r = ${cm(R)}`, hLab: "h = ?" }),
          inline: false,
        };
      }
      if (v === 1) {
        // Glas: Füllhöhe aus Volumen (Ergebnis oft gerundet)
        const R = new Frac(rng.int(3, 6)), k = rng.int(2, 8);
        const Vl = new Frac(k, 10), Vc = new Frac(100 * k);
        const G = PI.mul(R).mul(R);
        const Hh = Vc.div(G);
        return {
          q: rich(`In einem zylindrischen Glas mit dem Radius r = ${cm(R)} stehen ${tx(Vl, "l")} Saft. Wie hoch steht der Saft? (1 l = 1000 cm³)`),
          a: rich(res(Hh, "cm")),
          steps: rules([
            "h = V : G",
            `V = ${tx(Vl, "l")} = ${tx(Vc, "cm³")}`,
            `G = ${PIS} · (${cm(R)})² = ${tx(G, "cm²")}`,
            ...calc(`h = ${tx(Vc, "cm³")} : ${tx(G, "cm²")}`, Hh, "cm", "h"),
          ]),
          fig: cylFig({ r: R, h: 10, rLab: `r = ${cm(R)}`, hLab: "h = ?" }),
          inline: false,
        };
      }
      if (v === 2) {
        // Regentonne: Höhe aus Volumen in m³ und Radius in m
        const R = new Frac([4, 5, 6, 8, 10][rng.int(0, 4)], 10), Vm = new Frac(rng.int(1, 4));
        const G = PI.mul(R).mul(R);
        const Hh = Vm.div(G);
        return {
          q: rich(`Eine zylindrische Regentonne hat den Radius r = ${tx(R, "m")}. Sie fasst ${tx(Vm, "m³")} Wasser (${fmtInt(1000 * Vm.n / Vm.d)} l). Wie hoch ist die Regentonne?`),
          a: rich(res(Hh, "m")),
          steps: rules([
            "h = V : G",
            `G = ${PIS} · (${tx(R, "m")})² = ${tx(G, "m²")}`,
            ...calc(`h = ${tx(Vm, "m³")} : ${tx(G, "m²")}`, Hh, "m", "h"),
          ]),
          fig: cylFig({ r: R, h: 1.5, rLab: `r = ${tx(R, "m")}`, hLab: "h = ?" }),
          inline: false,
        };
      }
      // Schwimmbecken: Durchmesser und Tiefe gegeben, Volumen in m³
      const R = new Frac(rng.int(2, 4)), Hh = new Frac(rng.int(8, 20), 10);
      const D = R.mul(2);
      const V = PI.mul(R).mul(R).mul(Hh);
      return {
        q: rich(`Ein rundes Schwimmbecken hat den Durchmesser d = ${tx(D, "m")} und ist ${tx(Hh, "m")} tief. Wie viel Kubikmeter Wasser passen höchstens hinein?`),
        a: rich(res(V, "m³")),
        steps: rules([
          "r = d : 2",
          `r = ${tx(D, "m")} : 2 = ${tx(R, "m")}`,
          "V = π · r² · h",
          ...calc(`V = ${PIS} · (${tx(R, "m")})² · ${tx(Hh, "m")}`, V, "m³", "V"),
        ]),
        fig: cylFig({ r: R, h: Hh, rLab: "r = ?", hLab: `h = ${tx(Hh, "m")}`, dLab: `d = ${tx(D, "m")}` }),
        inline: false,
      };
    },
  });

  // ---------- Typ 3: Prismen – Volumen (Dreieck, Trapez, Rechteck, zusammengesetzt) ----------
  AG.registerType({
    id: "m8-prisma-volumen",
    klasse: "8",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Körper",
    title: "Prisma: Volumen",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen V des Prismas. Rechne mit π ≈ 3,14.",
      2: "Berechne das Volumen V des Prismas. Rechne mit π ≈ 3,14.",
      3: "Löse die Aufgabe. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Prisma: ", { b: "V = G · L" }, " (G = Fläche des Querschnitts, L = Länge). Dreieck: G = g · h : 2, Trapez: G = (a + c) · h : 2. ",
      "Beispiel: Dreieck g = 6 cm, h = 4 cm, L = 10 cm → G = 12 cm², V = 12 cm² · 10 cm = 120 cm³.",
    ],
    cols: 2,
    generate(rng, level, ctx) {
      const zug = ctx && ctx.zug ? ctx.zug : "M";
      if (level === 1) {
        const g = rng.int(4, 12), hT = rng.int(3, 10), p = rng.int(1, g - 1), L = rng.int(5, 20);
        const G = new Frac(g * hT, 2), V = G.mul(L);
        return {
          q: rich(`Ein Prisma hat als Grundfläche ein Dreieck mit der Grundseite g = ${cm(g)} und der Höhe h = ${cm(hT)}. Die Länge des Prismas beträgt L = ${cm(L)}. Berechne das Volumen V.`),
          a: rich(res(V, "cm³")),
          steps: rules([
            "G = g · h : 2",
            ...calc(`G = ${cm(g)} · ${cm(hT)} : 2`, G, "cm²", "G"),
            "V = G · L",
            ...calc(`V = ${tx(G, "cm²")} · ${cm(L)}`, V, "cm³", "V"),
          ]),
          fig: prismFig({
            P: [[0, 0], [g, 0], [p, hT]], len: L,
            labels: [{ edge: 0, t: `g = ${cm(g)}` }, { depth: 1, t: `L = ${cm(L)}` }, { along: [[p, hT], [p, 0]], t: `h = ${cm(hT)}` }],
            
          }),
          inline: false,
        };
      }
      if (level === 2) {
        // Grundfläche: Trapez nur im M-Zug; Regelklasse nur Dreieck oder Rechteck
        const kind = zug === "M" ? rng.pick(["trap", "tri", "rect"]) : rng.pick(["tri", "rect"]);
        if (kind === "trap") {
          // Trapez nur im M-Zug (gleichschenklig)
          const c = rng.int(2, 8), x0 = rng.int(1, 4), a = c + 2 * x0, hT = rng.int(3, 8), L = rng.int(4, 12);
          const G = new Frac((a + c) * hT, 2), V = G.mul(L);
          return {
            q: rich(`Ein Futtertrog hat als Querschnitt ein gleichschenkliges Trapez mit den parallelen Seiten a = ${cm(a)} und c = ${cm(c)} sowie der Höhe h = ${cm(hT)}. Der Trog ist L = ${cm(L)} lang. Berechne das Volumen V.`),
            a: rich(res(V, "cm³")),
            steps: rules([
              "G = (a + c) · h : 2",
              ...calc(`G = (${cm(a)} + ${cm(c)}) · ${cm(hT)} : 2`, G, "cm²", "G"),
              "V = G · L",
              ...calc(`V = ${tx(G, "cm²")} · ${cm(L)}`, V, "cm³", "V"),
            ]),
            fig: prismFig({
              P: [[0, 0], [a, 0], [a - x0, hT], [x0, hT]], len: L,
              labels: [
                { edge: 0, t: `a = ${cm(a)}` }, { edge: 2, t: `c = ${cm(c)}` }, { depth: 1, t: `L = ${cm(L)}` },
                { along: [[x0, hT], [x0, 0]], t: `h = ${cm(hT)}` },
              ],
              
            }),
            inline: false,
          };
        }
        if (kind === "tri") {
          // Dreieck als Grundfläche
          const g = rng.int(4, 12), hT = rng.int(3, 10), p = rng.int(1, g - 1), L = rng.int(4, 12);
          const G = new Frac(g * hT, 2), V = G.mul(L);
          return {
            q: rich(`Ein Prisma hat als Grundfläche ein Dreieck mit der Grundseite g = ${cm(g)} und der Höhe h = ${cm(hT)}. Die Länge des Prismas beträgt L = ${cm(L)}. Berechne das Volumen V.`),
            a: rich(res(V, "cm³")),
            steps: rules([
              "G = g · h : 2",
              ...calc(`G = ${cm(g)} · ${cm(hT)} : 2`, G, "cm²", "G"),
              "V = G · L",
              ...calc(`V = ${tx(G, "cm²")} · ${cm(L)}`, V, "cm³", "V"),
            ]),
            fig: prismFig({
              P: [[0, 0], [g, 0], [p, hT]], len: L,
              labels: [{ edge: 0, t: `g = ${cm(g)}` }, { depth: 1, t: `L = ${cm(L)}` }, { along: [[p, hT], [p, 0]], t: `h = ${cm(hT)}` }],
              
            }),
            inline: false,
          };
        }
        // Rechteck (Quader)
        const a = rng.int(3, 10), b = rng.int(2, 8), L = rng.int(4, 12);
        const G = new Frac(a * b), V = G.mul(L);
        return {
          q: rich(`Ein Prisma hat als Querschnitt ein Rechteck mit a = ${cm(a)} und b = ${cm(b)}. Das Prisma ist L = ${cm(L)} lang. Berechne das Volumen V.`),
          a: rich(res(V, "cm³")),
          steps: rules([
            "G = a · b",
            ...calc(`G = ${cm(a)} · ${cm(b)}`, G, "cm²", "G"),
            "V = G · L",
            ...calc(`V = ${tx(G, "cm²")} · ${cm(L)}`, V, "cm³", "V"),
          ]),
          fig: prismFig({
            P: [[0, 0], [a, 0], [a, b], [0, b]], len: L,
            labels: [{ edge: 0, t: `a = ${cm(a)}` }, { edge: 1, t: `b = ${cm(b)}` }, { depth: 1, t: `L = ${cm(L)}` }],
          }),
          inline: false,
        };
      }
      // Niveau 3: Umkehraufgabe (Länge aus V und G) oder zusammengesetzter Körper (nur M-Zug)
      const umkehr = zug !== "M" || rng.chance(0.5);
      if (umkehr) {
        const g = rng.int(4, 12), hT = rng.int(3, 10), p = rng.int(1, g - 1), L = rng.int(5, 20);
        const G = new Frac(g * hT, 2), V = G.mul(L);
        return {
          q: rich(`Ein Prisma hat als Grundfläche ein Dreieck mit der Grundseite g = ${cm(g)} und der Höhe h = ${cm(hT)}. Das Volumen des Prismas beträgt V = ${tx(V, "cm³")}. Berechne die Länge L.`),
          a: rich(`L = ${cm(L)}`),
          steps: rules([
            "L = V : G",
            ...calc(`G = ${cm(g)} · ${cm(hT)} : 2`, G, "cm²", "G"),
            `L = ${tx(V, "cm³")} : ${tx(G, "cm²")} = ${cm(L)}`,
          ]),
          fig: prismFig({
            P: [[0, 0], [g, 0], [p, hT]], len: L,
            labels: [{ edge: 0, t: `g = ${cm(g)}` }, { depth: 1, t: "L = ?" }, { along: [[p, hT], [p, 0]], t: `h = ${cm(hT)}` }],
            
          }),
          inline: false,
        };
      }
      // Werkstück: Quader mit aufgesetztem Halbzylinder (Achse entlang der Breite b)
      const R = rng.int(2, 6), A = 2 * R, B = rng.int(3, 8), Hh = rng.int(3, 8);
      const VQ = new Frac(A * B * Hh);
      const VH = PI.mul(R).mul(R).div(2).mul(B);
      const V = VQ.add(VH);
      const { P, smooth } = housePts(A, Hh);
      return {
        q: rich(`Ein Werkstück besteht aus einem Quader mit der Länge a = ${cm(A)}, der Breite b = ${cm(B)} und der Höhe h = ${cm(Hh)}. Darauf liegt ein halber Zylinder mit dem Durchmesser d = ${cm(A)}, dessen Achse entlang der Breite b verläuft. Berechne das Volumen des ganzen Werkstücks.`),
        a: rich(res(V, "cm³")),
        steps: rules([
          "V = V_Quader + V_Halbzylinder",
          `V_Quader = a · b · h = ${cm(A)} · ${cm(B)} · ${cm(Hh)} = ${tx(VQ, "cm³")}`,
          "r = d : 2",
          `r = ${cm(A)} : 2 = ${cm(R)}`,
          ...calcE(`V_Halbzylinder = ½ · ${PIS} · (${cm(R)})² · ${cm(B)}`, VH, "cm³"),
          ...calc(`V = ${tx(VQ, "cm³")} + ${tx(VH, "cm³")}`, V, "cm³", "V"),
        ]),
        fig: prismFig({
          P, smooth, len: B,
          labels: [{ edge: 0, t: `a = ${cm(A)}` }, { edge: P.length - 1, t: `h = ${cm(Hh)}` }, { depth: 1, t: `b = ${cm(B)}` }],
        }),
        inline: false,
      };
    },
  });

  // ---------- Typ 4: Hohlzylinder (Rohr) ----------
  AG.registerType({
    id: "m8-hohlzylinder",
    klasse: "8",
    zug: "M",
    lb: "5",
    lbTitle: "Rauminhalt – Zylinder",
    title: "Hohlzylinder (Rohr)",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen des Rohrmaterials. Rechne mit π ≈ 3,14.",
      2: "Berechne das Volumen des Stahls. Rechne mit π ≈ 3,14.",
      3: "Löse die Aufgabe. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Hohlzylinder (Rohr): ", { b: "V = π · (ra² − ri²) · h" }, " mit äußerem Radius ra und innerem Radius ri. Wandstärke w = ra − ri. ",
      "Beispiel: ra = 2 cm, ri = 1 cm, h = 5 cm → V = 3,14 · 3 cm² · 5 cm = 47,1 cm³.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const RA = new Frac(rng.int(4, 10)), RI = new Frac(rng.int(Math.ceil(RA.n / 2), RA.n - 1)), Hh = new Frac(rng.int(5, 15));
        const Diff = RA.mul(RA).sub(RI.mul(RI));
        const V = PI.mul(Diff).mul(Hh);
        return {
          q: rich(`Ein Rohr hat den äußeren Radius ra = ${cm(RA)}, den inneren Radius ri = ${cm(RI)} und die Länge h = ${cm(Hh)}. Berechne das Volumen des Rohrmaterials.`),
          a: rich(res(V, "cm³")),
          steps: rules([
            "V = π · (ra² − ri²) · h",
            `V = ${PIS} · ((${cm(RA)})² ${MINUS} (${cm(RI)})²) · ${cm(Hh)}`,
            ...calc(`V = ${PIS} · ${tx(Diff, "cm²")} · ${cm(Hh)}`, V, "cm³", "V"),
          ]),
          fig: cylFig({ r: RA, h: Hh, ri: RI, rLab: `ra = ${cm(RA)}`, riLab: `ri = ${cm(RI)}`, hLab: `h = ${cm(Hh)}` }),
          inline: false,
        };
      }
      if (level === 2) {
        const DA = new Frac(2 * rng.int(5, 15)), wd = new Frac(rng.int(1, 4)), Hh = new Frac(rng.int(5, 20));
        const RA = DA.div(2), RI = RA.sub(wd);
        const Diff = RA.mul(RA).sub(RI.mul(RI));
        const V = PI.mul(Diff).mul(Hh);
        return {
          q: rich(`Ein Stahlrohr hat den äußeren Durchmesser d = ${cm(DA)}, die Wandstärke w = ${cm(wd)} und die Länge h = ${cm(Hh)}. Berechne das Volumen des Stahls.`),
          a: rich(res(V, "cm³")),
          steps: rules([
            "ra = d : 2 und ri = ra − w",
            `ra = ${cm(DA)} : 2 = ${cm(RA)}`,
            `ri = ${cm(RA)} ${MINUS} ${cm(wd)} = ${cm(RI)}`,
            "V = π · (ra² − ri²) · h",
            `V = ${PIS} · ((${cm(RA)})² ${MINUS} (${cm(RI)})²) · ${cm(Hh)}`,
            ...calc(`V = ${PIS} · ${tx(Diff, "cm²")} · ${cm(Hh)}`, V, "cm³", "V"),
          ]),
          fig: cylFig({ r: RA, h: Hh, ri: RI, rLab: "ra = ?", riLab: "ri = ?", hLab: `h = ${cm(Hh)}`, dLab: `d = ${cm(DA)}` }),
          inline: false,
        };
      }
      // Niveau 3: Masse (Stahl) oder Oberfläche (außen, innen und zwei Ringe)
      const RA = new Frac(rng.int(4, 10)), RI = new Frac(rng.int(Math.ceil(RA.n / 2), RA.n - 1)), Hh = new Frac(rng.int(5, 20));
      const Diff = RA.mul(RA).sub(RI.mul(RI));
      if (rng.chance(0.5)) {
        const V = PI.mul(Diff).mul(Hh);
        const Mg = V.mul(new Frac(78, 10));           // Dichte Stahl 7,8 g/cm³
        const Mk = Mg.div(1000);
        return {
          q: rich(`Ein Stahlrohr hat den äußeren Radius ra = ${cm(RA)}, den inneren Radius ri = ${cm(RI)} und die Länge h = ${cm(Hh)}. 1 cm³ Stahl wiegt 7,8 g. Wie schwer ist das Rohr?`),
          a: rich(res(Mk, "kg")),
          steps: rules([
            "V = π · (ra² − ri²) · h",
            `V = ${PIS} · ((${cm(RA)})² ${MINUS} (${cm(RI)})²) · ${cm(Hh)}`,
            ...calc(`V = ${PIS} · ${tx(Diff, "cm²")} · ${cm(Hh)}`, V, "cm³", "V"),
            "m = V · 7,8 g (je cm³)",
            ...calcE(`m = ${tx(V, "")} · 7,8 g`, Mg, "g"),
            ...calc(`m = ${tx(Mg, "g")} : 1000`, Mk, "kg", "m"),
          ]),
          fig: cylFig({ r: RA, h: Hh, ri: RI, rLab: `ra = ${cm(RA)}`, riLab: `ri = ${cm(RI)}`, hLab: `h = ${cm(Hh)}` }),
          inline: false,
        };
      }
      const Mout = TWO.mul(PI).mul(RA).mul(Hh);
      const Min = TWO.mul(PI).mul(RI).mul(Hh);
      const Ring = TWO.mul(PI).mul(Diff);
      const O = Mout.add(Min).add(Ring);
      return {
        q: rich(`Ein Rohr hat den äußeren Radius ra = ${cm(RA)}, den inneren Radius ri = ${cm(RI)} und die Länge h = ${cm(Hh)}. Berechne die gesamte Oberfläche (außen, innen und die beiden Ringe an den Enden).`),
        a: rich(res(O, "cm²")),
        steps: rules([
          "O = 2 · π · ra · h + 2 · π · ri · h + 2 · π · (ra² − ri²)",
          ...calc(`Außen: 2 · ${PIS} · ${cm(RA)} · ${cm(Hh)}`, Mout, "cm²", "Außen"),
          ...calc(`Innen: 2 · ${PIS} · ${cm(RI)} · ${cm(Hh)}`, Min, "cm²", "Innen"),
          ...calc(`Ringe: 2 · ${PIS} · ${tx(Diff, "cm²")}`, Ring, "cm²", "Ringe"),
          `O = ${tx(Mout, "cm²")} + ${tx(Min, "cm²")} + ${tx(Ring, "cm²")} ${eqs(O, "cm²")}`,
        ]),
        fig: cylFig({ r: RA, h: Hh, ri: RI, rLab: `ra = ${cm(RA)}`, riLab: `ri = ${cm(RI)}`, hLab: `h = ${cm(Hh)}` }),
        inline: false,
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
