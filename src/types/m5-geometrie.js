// M5 LB 3: Geometrische Figuren und Lagebeziehungen – Koordinaten im 1. Quadranten, Winkelarten,
// Umfang und Längeneinheiten. Typen: m5-koordinaten, m5-winkelart, m5-umfang, m5-laengen.
// Koordinatensystem aus m8-funktionen.js übernommen, Skizzen wie in m7-flaechen.js.
(function (AG) {
  const { Frac, num, rich, plain, fmtInt, MINUS, SKETCH_COLORS } = AG;
  const { INK, GREY } = SKETCH_COLORS;

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const sInt = n => fmtInt(n);
  const dec = f => num(f, { as: "dec" });                  // Zahl oder Bruch als Dezimalzahl mit Komma
  const E = n => (n === 1 ? "Einheit" : "Einheiten");
  const listDe = a => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " und " + a[a.length - 1]);
  const opT = (v, d) => (d >= 0 ? `${sInt(v)} + ${sInt(d)}` : `${sInt(v)} ${MINUS} ${sInt(-d)}`);

  // ---------- Koordinatensystem (aus m8-funktionen.js) ----------
  // cfg: W, H (mm), xr/yr [min, max], gx/gy Gitterabstand, lx/ly Zahl an jedem lx-ten Strich, xName/yName
  function coords(cfg) {
    const W = cfg.W, H = cfg.H, ml = 12, mr = 7, mt = 5, mb = 10;
    const [x0, x1] = cfg.xr, [y0, y1] = cfg.yr;
    const sx = (W - ml - mr) / (x1 - x0), sy = (H - mt - mb) / (y1 - y0);
    const P = (x, y) => [ml + (x - x0) * sx, H - mb - (y - y0) * sy];
    const s = AG.sketch(W, H);
    // Gitter (hell), dann Achsen darüber
    for (let x = x0; x <= x1; x += cfg.gx) if (x !== 0) s.line(P(x, y0), P(x, y1), { stroke: GREY, width: 0.12 });
    for (let y = y0; y <= y1; y += cfg.gy) if (y !== 0) s.line(P(x0, y), P(x1, y), { stroke: GREY, width: 0.12 });
    s.line(P(x0, 0), P(x1, 0), { width: 0.4 });
    s.line(P(0, y0), P(0, y1), { width: 0.4 });
    // Pfeile an den Achsenenden
    const ax = P(x1, 0), ay = P(0, y1);
    s.poly([[ax[0] + 2, ax[1]], [ax[0] - 0.4, ax[1] - 1], [ax[0] - 0.4, ax[1] + 1]], { fill: INK, stroke: INK, width: 0.1 });
    s.poly([[ay[0], ay[1] - 2], [ay[0] - 1, ay[1] + 0.4], [ay[0] + 1, ay[1] + 0.4]], { fill: INK, stroke: INK, width: 0.1 });
    // Zahlen an den Achsen (Null einmal am Ursprung)
    for (let x = Math.ceil(x0 / cfg.lx) * cfg.lx; x <= x1; x += cfg.lx) if (x !== 0) { const p = P(x, 0); s.label([p[0], p[1] + 4], sInt(x)); }
    for (let y = Math.ceil(y0 / cfg.ly) * cfg.ly; y <= y1; y += cfg.ly) if (y !== 0) { const p = P(0, y); s.label([p[0] - 1.6, p[1]], sInt(y), { anchor: "end" }); }
    const o = P(0, 0);
    s.label([o[0] + 1.6, o[1] + 4], "0", { anchor: "start" });
    s.label([W - 1.5, H - 1.5], cfg.xName, { anchor: "end" });
    s.label([ay[0] + 2, 2.5], cfg.yName, { anchor: "start" });
    return { s, P };
  }

  const KO_CFG = { W: 74, H: 50, xr: [0, 10], yr: [0, 10], gx: 1, gy: 1, lx: 1, ly: 1, xName: "x", yName: "y" };

  // Punkte mit Buchstaben. o.edges: durchgezogene Strecken [i, j], o.dashEdges: gestrichelte,
  // o.guides: Hilfslinien zu den Achsen (nur im Lösungsbild)
  function pointFig(pts, o = {}) {
    const cs = coords(KO_CFG), P = cs.P;
    for (const [i, j] of o.dashEdges || []) cs.s.line(P(pts[i].x, pts[i].y), P(pts[j].x, pts[j].y), { dash: true });
    for (const [i, j] of o.edges || []) cs.s.line(P(pts[i].x, pts[i].y), P(pts[j].x, pts[j].y), { width: 0.5 });
    for (const p of pts) {
      const q = P(p.x, p.y);
      if (o.guides) { cs.s.line(q, P(p.x, 0), { dash: true }); cs.s.line(q, P(0, p.y), { dash: true }); }
      cs.s.circle(q, 0.9, { fill: INK });
      cs.s.label([q[0] + 2.6, q[1] - 2.6], p.name, { anchor: "start", bold: true });
    }
    return cs.s.done();
  }

  // ================= 1. Koordinaten im 1. Quadranten =================
  function koLevel1(rng) {
    const n = rng.pick([2, 3]);
    const xs = rng.shuffle(range(1, 9)).slice(0, n);
    const ys = rng.shuffle(range(1, 9)).slice(0, n);
    // zufällige Buchstaben, damit jede Aufgabe anders aussieht (die Punkte stehen nur in der Skizze)
    const letters = rng.shuffle("ABCDEFGHIJKLMNOPRSTUVWXYZ".split("")).slice(0, n);
    const pts = letters.map((name, i) => ({ name, x: xs[i], y: ys[i] }));
    const exp = pts.map(p => `${p.name}(${p.x} | ${p.y})`).join("; ");
    return {
      q: rich(`Lies die Koordinaten der Punkte ${listDe(letters)} ab. Schreibe sie so: ${letters[0]}(x | y).`),
      a: rich(exp),
      steps: pts.map(p => rich(`${p.name}: von ${p.name} nach unten bis zur x-Achse: x = ${sInt(p.x)}; `
        + `von ${p.name} nach links bis zur y-Achse: y = ${sInt(p.y)}. Also ${p.name}(${p.x} | ${p.y}).`)),
      fig: pointFig(pts),
      aFig: pointFig(pts, { guides: true }),
      inline: false,
      check: { lvl: 1, exp },
    };
  }

  // Rechteck oder Quadrat ABCD: A, B, C gegeben (AB waagerecht, BC senkrecht), D gesucht
  function koLevel2(rng) {
    const square = rng.chance(0.4);
    const s = rng.int(2, 6), t = square ? s : rng.intExcept(2, 6, [s]);
    const x0 = rng.int(1, 9 - s), y0 = rng.int(1, 9 - t);
    const A = { name: "A", x: x0, y: y0 }, B = { name: "B", x: x0 + s, y: y0 };
    const C = { name: "C", x: x0 + s, y: y0 + t }, D = { name: "D", x: x0, y: y0 + t };
    const exp = `D(${D.x} | ${D.y})`;
    const steps = [
      rich(`AB ist waagerecht: ${sInt(B.x)} ${MINUS} ${sInt(A.x)} = ${sInt(s)} Einheiten.`),
      rich(`BC ist senkrecht: ${sInt(C.y)} ${MINUS} ${sInt(B.y)} = ${sInt(t)} Einheiten.`),
    ];
    if (square) steps.push(rich(`Im Quadrat sind alle Seiten gleich lang: AB und BC sind beide ${sInt(s)} Einheiten lang.`));
    steps.push(rich(`D liegt senkrecht über A, hat also die x-Koordinate ${sInt(A.x)}.`));
    steps.push(rich(`D liegt waagerecht in der Höhe von C, hat also die y-Koordinate ${sInt(C.y)}.`));
    steps.push(rich(`Also ${exp}.`));
    return {
      q: rich(`Die Punkte A(${A.x} | ${A.y}), B(${B.x} | ${B.y}) und C(${C.x} | ${C.y}) sind Eckpunkte eines `
        + `${square ? "Quadrats" : "Rechtecks"} ABCD. Gib die Koordinaten des Punktes D an.`),
      a: rich(exp),
      steps,
      fig: pointFig([A, B, C], { edges: [[0, 1], [1, 2]] }),
      aFig: pointFig([A, B, C, D], { edges: [[0, 1], [1, 2], [2, 3], [3, 0]], guides: true }),
      inline: false,
      check: { lvl: 2, exp },
    };
  }

  // Dreieck oder Rechteck verschieben: neue Punkte A′, B′, … mit Koordinaten
  function koLevel3(rng) {
    const quad = rng.chance(0.5);
    for (let tries = 0; tries < 500; tries++) {
      const dx = rng.pick([-3, -2, -1, 1, 2, 3]), dy = rng.pick([-2, -1, 1, 2, 3]);
      let raw;
      if (quad) {
        const s = rng.int(2, 5), t = rng.int(2, 5), x0 = rng.int(1, 9 - s), y0 = rng.int(1, 9 - t);
        raw = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + t], [x0, y0 + t]];
      } else {
        const s = rng.int(2, 6), u = rng.int(0, s), t = rng.int(2, 5), x0 = rng.int(1, 9 - s), y0 = rng.int(1, 9 - t);
        raw = [[x0, y0], [x0 + s, y0], [x0 + u, y0 + t]];
      }
      const names = quad ? ["A", "B", "C", "D"] : ["A", "B", "C"];
      const pts = raw.map((p, i) => ({ name: names[i], x: p[0], y: p[1] }));
      const moved = pts.map(p => ({ name: p.name + "′", x: p.x + dx, y: p.y + dy }));
      if (moved.some(p => p.x < 1 || p.x > 9 || p.y < 1 || p.y > 9)) continue;
      const n = pts.length;
      const edges = range(0, n - 1).map(i => [i, (i + 1) % n]);
      const edgesNew = edges.map(([i, j]) => [i + n, j + n]);
      const dxTxt = `${Math.abs(dx)} ${E(Math.abs(dx))} nach ${dx > 0 ? "rechts" : "links"}`;
      const dyTxt = `${Math.abs(dy)} ${E(Math.abs(dy))} nach ${dy > 0 ? "oben" : "unten"}`;
      const exp = moved.map(p => `${p.name}(${p.x} | ${p.y})`).join("; ");
      const steps = pts.map((p, i) => {
        const q = moved[i];
        return rich(`${p.name}(${p.x} | ${p.y}): x: ${opT(p.x, dx)} = ${sInt(q.x)}; y: ${opT(p.y, dy)} = ${sInt(q.y)}. `
          + `Also ${q.name}(${q.x} | ${q.y}).`);
      });
      return {
        q: rich(`${quad ? "Das Rechteck ABCD hat" : "Das Dreieck ABC hat"} die Punkte ${listDe(pts.map(p => `${p.name}(${p.x} | ${p.y})`))}. `
          + `Die Figur wird ${dxTxt} und ${dyTxt} verschoben. `
          + `Gib die Koordinaten der neuen Punkte ${listDe(moved.map(p => p.name))} an.`),
        a: rich(exp),
        steps,
        fig: pointFig(pts, { edges }),
        aFig: pointFig([...pts, ...moved], { dashEdges: edges, edges: edgesNew }),
        inline: false,
        check: { lvl: 3, exp, pts, dx, dy },
      };
    }
    throw new Error("Koordinaten: keine passende Figur gefunden");
  }

  AG.registerType({
    id: "m5-koordinaten",
    klasse: "5",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren und Lagebeziehungen",
    title: "Koordinaten im 1. Quadranten",
    topic: "winkel",
    instruction: {
      1: "Lies die Koordinaten der Punkte ab. Schreibe zuerst den x-Wert, dann den y-Wert.",
      2: "Ergänze den vierten Eckpunkt des Rechtecks bzw. Quadrats.",
      3: "Verschiebe die Figur und gib die Koordinaten der neuen Punkte an.",
    },
    merke: [
      "Der erste Wert ist der ", { b: "x-Wert" }, " (waagerecht, von links), der zweite der ", { b: "y-Wert" },
      " (senkrecht, von unten). Beispiel: A(3 | 5) heißt: 3 nach rechts und 5 nach oben. Zuerst x, dann y.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return koLevel1(rng);
      if (level === 2) return koLevel2(rng);
      return koLevel3(rng);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.lvl === 3) {
        const exp = k.pts.map(p => `${p.name}′(${p.x + k.dx} | ${p.y + k.dy})`).join("; ");
        if (k.exp !== exp) return "Verschiebung falsch";
      }
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 2. Winkelart =================
  const WKEY = g => (g < 90 ? "spitz" : g === 90 ? "recht" : g < 180 ? "stumpf" : "gestreckt");
  const WNAME = { spitz: "spitzer", recht: "rechter", stumpf: "stumpfer", gestreckt: "gestreckter" };
  const WREL = g => (g < 90 ? `${g}° < 90°` : g === 90 ? "90° = 90°" : g < 180 ? `90° < ${g}° < 180°` : "180° = 180°");

  // Skizze des Winkels mit der angegebenen Größe (maßstabsgetreu, Scheitel v, Strahl nach rechts als Ausgang)
  function angleFig(g) {
    const W = 46, H = 40, L = 17, v = [W / 2, H / 2 + 2];
    const th = g * Math.PI / 180;
    const p = [v[0] + L, v[1]];
    const q = [v[0] + L * Math.cos(th), v[1] - L * Math.sin(th)];
    const s = AG.sketch(W, H);
    s.line(v, p, { width: 0.45 });
    s.line(v, q, { width: 0.45 });
    s.circle(v, 0.7, { fill: INK });
    if (g === 90) {
      s.right(v, p, q);
      s.label([v[0] + 6.5, v[1] - 6.5], "90°");
    } else {
      s.angle(v, p, q, `${g}°`);
    }
    return s.done();
  }

  function winkelLevel1(rng) {
    const cat = rng.pick(["spitz", "recht", "stumpf", "gestreckt"]);
    const g = cat === "spitz" ? rng.int(10, 85)
      : cat === "recht" ? 90
        : cat === "stumpf" ? rng.int(95, 175) : 180;
    const art = WKEY(g);
    return {
      q: rich(`Der Winkel ist ${g}° groß. Welche Winkelart ist das? (spitz, recht, stumpf oder gestreckt)`),
      a: rich(art),
      steps: [
        rich(`Vergleich: ${WREL(g)}.`),
        rich(`Also ein ${WNAME[art]} Winkel: ${art}.`),
      ],
      fig: angleFig(g),
      inline: false,
      check: { lvl: 1, art },
    };
  }

  function winkelLevel2(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const vals = rng.shuffle([rng.pick(range(85, 95)), rng.pick([rng.int(10, 80), rng.int(100, 175)]), rng.int(10, 179)]);
      if (new Set(vals).size !== 3) continue;
      const items = ["α", "β", "γ"].map((name, i) => ({ name, g: vals[i], art: WKEY(vals[i]) }));
      const exp = items.map(it => `${it.name} = ${it.g}°: ${it.art}`).join("; ");
      return {
        q: rich(`Gib für jeden Winkel die Winkelart an: ${items.map(it => `${it.name} = ${it.g}°`).join(", ")}.`),
        a: rich(exp),
        steps: items.map(it => rich(`${it.name} = ${it.g}°: ${WREL(it.g)}, also ${it.art}.`)),
        inline: false,
        check: { lvl: 2, exp, items },
      };
    }
    throw new Error("Winkelart: keine Winkel gefunden");
  }

  function winkelLevel3(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const vals = [rng.int(10, 89), rng.pick([90, rng.int(91, 120)]), rng.int(121, 179), rng.pick([180, rng.int(100, 175)])];
      if (new Set(vals).size !== 4) continue;
      const vs = rng.shuffle(vals);
      const items = ["α", "β", "γ", "δ"].map((name, i) => ({ name, g: vs[i], art: WKEY(vs[i]) }));
      const order = items.slice().sort((x, y) => x.g - y.g);
      const exp = order.map(it => `${it.name} (${it.g}°, ${it.art})`).join(" < ");
      return {
        q: rich(`Ordne die Winkel der Größe nach, mit dem kleinsten beginnend, und gib jeweils die Art an: `
          + `${items.map(it => `${it.name} = ${it.g}°`).join(", ")}.`),
        a: rich(exp),
        steps: [
          ...items.map(it => rich(`${it.name} = ${it.g}°: ${WREL(it.g)}, also ${it.art}.`)),
          rich("Größe nach: ", order.map(it => `${it.name} = ${it.g}°`).join(" < ")),
        ],
        inline: false,
        check: { lvl: 3, exp, items },
      };
    }
    throw new Error("Winkelart: keine Winkel gefunden");
  }

  AG.registerType({
    id: "m5-winkelart",
    klasse: "5",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren und Lagebeziehungen",
    title: "Winkelart bestimmen",
    topic: "winkel",
    instruction: {
      1: "Bestimme die Winkelart aus der Gradzahl. Antworte mit einem Wort.",
      2: "Bestimme die Winkelart jedes Winkels. Achte auf Winkel nahe bei 90°.",
      3: "Ordne die Winkel der Größe nach und gib jeweils die Art an.",
    },
    merke: [
      { b: "Spitzer Winkel" }, ": kleiner als 90°. ", { b: "Rechter Winkel" }, ": genau 90° (eine Ecke wie beim Quadrat). ",
      { b: "Stumpfer Winkel" }, ": größer als 90° und kleiner als 180°. ", { b: "Gestreckter Winkel" },
      ": genau 180° (eine gerade Linie). Beispiel: 125° ist stumpf, weil 90° < 125° < 180° gilt.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return winkelLevel1(rng);
      if (level === 2) return winkelLevel2(rng);
      return winkelLevel3(rng);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.lvl === 1) return plain(t.a) === k.art || `Art falsch: „${plain(t.a)}“`;
      const expOk = k.items.every(it => it.art === WKEY(it.g));
      if (!expOk) return "Art falsch";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 3. Umfang =================
  // Dreieck mit AB = c, BC = a, CA = b (cm): Eckpunkte in cm (y nach oben), null wenn es nicht passt oder zu flach ist
  function triPts(a, b, c) {
    const x = (b * b + c * c - a * a) / (2 * c), y2 = b * b - x * x;
    if (!(y2 > 0)) return null;
    const y = Math.sqrt(y2);
    if (y < 0.4 * c) return null;
    return [[0, 0], [c, 0], [x, y]];
  }

  // Skizze einer Figur: pts in beliebigen Einheiten (y nach oben), labels je Seite pts[i] → pts[i+1]
  // flip: Seiten, deren Beschriftung auf die Innenseite gesetzt wird (sonst außen, weg vom Schwerpunkt)
  function polyFig(pts, labels, W, H, pad = 8, flip = []) {
    const f = AG.fitPoints(pts, W, H, pad);
    const P = pts.map(f);
    const s = AG.sketch(W, H);
    s.poly(P);
    const n = P.length;
    const cx = P.reduce((acc, p) => acc + p[0], 0) / n, cy = P.reduce((acc, p) => acc + p[1], 0) / n;
    for (let i = 0; i < n; i++) {
      if (!labels[i]) continue;
      const A = P[i], B = P[(i + 1) % n];
      // Innenseite: Punkt weit über der Seite (y nach unten gezählt), dann liegt die Beschriftung darunter
      const inside = flip.includes(i) ? [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 1000] : [cx, cy];
      s.side(A, B, labels[i], { inside });
    }
    return s.done();
  }

  function umfangLevel1(rng) {
    const kind = rng.pick(["dreieck", "rechteck", "quadrat"]);
    const lab = v => `${v} cm`;
    if (kind === "dreieck") {
      for (let tries = 0; tries < 500; tries++) {
        const c = rng.int(3, 9), a = rng.int(3, 9), b = rng.int(3, 9);
        const pts = triPts(a, b, c);
        if (!pts || a + b <= c || a + c <= b || b + c <= a) continue;
        const sum = a + b + c;
        return {
          q: rich(`Berechne den Umfang des Dreiecks. Die Seiten sind ${listDe([lab(c), lab(a), lab(b)])} lang.`),
          a: rich(lab(sum)),
          steps: [rich(`u = ${lab(c)} + ${lab(a)} + ${lab(b)} = ${sum} cm`)],
          fig: polyFig(pts, [lab(c), lab(a), lab(b)], 62, 40),
          inline: false,
          check: { lvl: 1, exp: lab(sum) },
        };
      }
      throw new Error("Umfang: kein Dreieck gefunden");
    }
    if (kind === "rechteck") {
      const a = rng.int(2, 12), b = rng.intExcept(2, 12, [a]);
      const sum = 2 * (a + b);
      return {
        q: rich(`Berechne den Umfang des Rechtecks. Es ist ${lab(a)} lang und ${lab(b)} breit.`),
        a: rich(lab(sum)),
        steps: [rich("Gegenseiten sind gleich lang: ", `u = ${lab(a)} + ${lab(b)} + ${lab(a)} + ${lab(b)} = ${sum} cm`)],
        fig: polyFig([[0, 0], [a, 0], [a, b], [0, b]], [lab(a), lab(b), lab(a), lab(b)], 62, 42),
        inline: false,
        check: { lvl: 1, exp: lab(sum) },
      };
    }
    const a = rng.int(2, 12);
    return {
      q: rich(`Berechne den Umfang des Quadrats. Eine Seite ist ${lab(a)} lang.`),
      a: rich(lab(4 * a)),
      steps: [rich(`u = ${lab(a)} + ${lab(a)} + ${lab(a)} + ${lab(a)} = ${4 * a} cm`)],
      fig: polyFig([[0, 0], [a, 0], [a, a], [0, a]], [lab(a), lab(a), lab(a), lab(a)], 56, 42),
      inline: false,
      check: { lvl: 1, exp: lab(4 * a) },
    };
  }

  // Längen als ganze mm (Vielfache von 5 mm); cm-Schreibweise nur bei vollen Zehnern
  function umfangLevel2(rng) {
    const L = () => {
      const mm = rng.pick(range(3, 19).map(v => v * 5));
      return { mm, cm: mm % 10 === 0 && rng.chance(0.5) };
    };
    const val = l => new Frac(l.mm, 10);                                  // Länge in cm als Bruch
    const txt = l => (l.cm ? `${dec(val(l))} cm` : `${l.mm} mm`);         // Schreibweise in der Aufgabe
    const disp = l => `${dec(val(l))} cm`;                                // Schreibweise in der Rechnung
    const conv = ls => ls.filter(l => !l.cm).map(l => rich(`${l.mm} mm = ${dec(val(l))} cm`));
    const sumOf = ls => ls.reduce((acc, l) => acc.add(val(l)), new Frac(0));
    const kind = rng.pick(["Dreieck", "Viereck", "Rechteck"]);

    if (kind === "Dreieck") {
      for (let tries = 0; tries < 500; tries++) {
        const X = L(), Y = L(), Z = L();                                  // AB, BC, CA
        const pts = triPts(Number(val(Y)), Number(val(Z)), Number(val(X)));
        if (!pts) continue;
        const ls = [X, Y, Z];
        return {
          q: rich(`Berechne den Umfang des Dreiecks. Die Seiten sind ${listDe(ls.map(txt))} lang.`),
          a: rich(dec(sumOf(ls)), " cm"),
          steps: [...conv(ls), rich(`u = ${ls.map(disp).join(" + ")} = ${dec(sumOf(ls))} cm`)],
          fig: polyFig(pts.map(p => [p[0], p[1]]), ls.map(txt), 62, 40),
          inline: false,
          check: { lvl: 2, exp: `${dec(sumOf(ls))} cm` },
        };
      }
      throw new Error("Umfang: kein Dreieck gefunden");
    }
    if (kind === "Viereck") {
      const shapes = [[[0, 0], [7, 0], [6, 4], [1, 3]], [[0, 0], [6, 0], [8, 3], [2, 4]], [[0, 0], [8, 0], [5, 3], [0, 3]]];
      const ls = [L(), L(), L(), L()];
      return {
        q: rich(`Berechne den Umfang des Vierecks ABCD. Die Seiten sind ${listDe(ls.map(txt))} lang.`),
        a: rich(dec(sumOf(ls)), " cm"),
        steps: [...conv(ls), rich(`u = ${ls.map(disp).join(" + ")} = ${dec(sumOf(ls))} cm`)],
        fig: polyFig(rng.pick(shapes), ls.map(txt), 62, 42),
        inline: false,
        check: { lvl: 2, exp: `${dec(sumOf(ls))} cm` },
      };
    }
    for (let tries = 0; tries < 500; tries++) {
      const A = L(), B = L();
      if (A.mm === B.mm) continue;
      const ls = [A, B, A, B];
      return {
        q: rich(`Berechne den Umfang des Rechtecks. Es ist ${txt(A)} lang und ${txt(B)} breit.`),
        a: rich(dec(sumOf(ls)), " cm"),
        steps: [...conv([A, B]), rich(`u = ${ls.map(disp).join(" + ")} = ${dec(sumOf(ls))} cm`)],
        fig: polyFig([[0, 0], [Number(val(A)), 0], [Number(val(A)), Number(val(B))], [0, Number(val(B))]], ls.map(txt), 62, 42),
        inline: false,
        check: { lvl: 2, exp: `${dec(sumOf(ls))} cm` },
      };
    }
    throw new Error("Umfang: kein Rechteck gefunden");
  }

  // Zusammengesetzte rechtwinklige Figur: L-Form (1 Stufe) oder Treppe (2 Stufen).
  // Gegeben: untere Seite a, linke Seite h und die Stufenmaße; gesucht: rechte Seite und obere Seite.
  function umfangLevel3(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const k = rng.pick([1, 2]);
      const a = rng.int(7, 12), h = rng.int(6, 10);
      const s = [], v = [];
      for (let i = 0; i < k; i++) { s.push(rng.int(3, 4)); v.push(rng.int(3, 4)); }
      const sumS = s.reduce((x, y) => x + y, 0), sumV = v.reduce((x, y) => x + y, 0);
      if (sumS > a - 2 || sumV > h - 2) continue;
      const y1 = h - sumV, p = a - sumS;
      // Eckpunkte gegen den Uhrzeigersinn ab (0,0); Seiten: pts[i] → pts[i+1]
      const pts = [[0, 0], [a, 0], [a, y1]];
      const labels = [`${a} cm`, "?"];
      let x = a, y = y1;
      for (let i = 0; i < k; i++) {
        x -= s[i]; pts.push([x, y]); labels.push(`${s[i]} cm`);
        y += v[i]; pts.push([x, y]); labels.push(`${v[i]} cm`);
      }
      pts.push([0, h]); labels.push("?");
      labels.push(`${h} cm`);
      const sides = [a, y1];
      for (let i = 0; i < k; i++) sides.push(s[i], v[i]);
      sides.push(p, h);
      const u = sides.reduce((acc, n) => acc + n, 0);
      const lineMinus = (first, rest) => [`${first} cm`, ...rest.map(n => `${n} cm`)].join(` ${MINUS} `);
      const given = [`unten ${a} cm`, `links ${h} cm`, ...s.map(n => `waagerechte Stufe ${n} cm`), ...v.map(n => `senkrechte Stufe ${n} cm`)];
      return {
        q: rich(`Die Figur hat ${k === 1 ? "die Form eines L" : "zwei Stufen"}. Alle Ecken sind rechte Winkel. `
          + `Gegeben sind ${listDe(given)}. Berechne den Umfang. Die Seiten mit ? musst du zuerst berechnen.`),
        a: rich(`${u} cm`),
        steps: [
          rich(`Rechte Seite: ${lineMinus(h, v)} = ${y1} cm`),
          rich(`Obere Seite: ${lineMinus(a, s)} = ${p} cm`),
          rich(`u = ${sides.map(n => `${n} cm`).join(" + ")} = ${u} cm`),
          rich(`Kontrolle: 2 · (${a} cm + ${h} cm) = ${u} cm`),
        ],
        fig: polyFig(pts, labels, 72, 46, 8, range(0, 2 * k + 3).filter(i => i % 2 === 0 && i >= 2 && i < 2 * k + 2)),
        inline: false,
        check: { lvl: 3, exp: `${u} cm`, a, h },
      };
    }
    throw new Error("Umfang: keine Figur gefunden");
  }

  AG.registerType({
    id: "m5-umfang",
    klasse: "5",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren und Lagebeziehungen",
    title: "Umfang von Figuren",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Umfang. Addiere alle Seiten.",
      2: "Rechne zuerst alle Längen in dieselbe Einheit um, dann addiere.",
      3: "Berechne zuerst die fehlenden Seiten, dann den Umfang.",
    },
    merke: [
      "Der ", { b: "Umfang" }, " ist die Länge des ganzen Randes: alle Seiten addieren. Gleiche Einheiten zuerst: 1 cm = 10 mm. "
      + "Beispiel: Rechteck 5 cm lang und 3 cm breit: u = 5 cm + 3 cm + 5 cm + 3 cm = 16 cm.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return umfangLevel1(rng);
      if (level === 2) return umfangLevel2(rng);
      return umfangLevel3(rng);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.lvl === 3) {
        const u = 2 * (k.a + k.h);
        if (plain(t.a) !== `${u} cm`) return `Umfang falsch: „${plain(t.a)}“`;
        return true;
      }
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 4. Längeneinheiten =================
  const UNITS = { m: 1000, dm: 100, cm: 10, mm: 1 };   // Umrechnung in mm

  // Zahl mit genau d Nachkommastellen (letzte Stelle ≠ 0) als Ganzzahl n; Wert = n / 10^d
  function decNum(rng, d) {
    const p = 10 ** d;
    for (;;) {
      const n = rng.int(10, 9 * p - 1);
      if (n % 10 !== 0) return n;
    }
  }

  function laengenLevel1(rng) {
    const [big, small] = rng.pick([["m", "dm"], ["m", "cm"], ["m", "mm"], ["dm", "cm"], ["dm", "mm"], ["cm", "mm"]]);
    const f = UNITS[big] / UNITS[small];
    if (rng.chance(0.6)) {
      // groß → klein: mit der Umrechnungszahl multiplizieren
      const v = rng.int(2, 9), res = v * f;
      return {
        q: rich(`Wandle um: ${v} ${big} = ? ${small}`),
        a: rich(`${res} ${small}`),
        steps: [rich(`1 ${big} = ${f} ${small}`), rich(`${v} ${big} = ${v} · ${f} ${small} = ${res} ${small}`)],
        inline: true,
        check: { lvl: 1, exp: `${res} ${small}` },
      };
    }
    // klein → groß: durch die Umrechnungszahl teilen (ohne Rest)
    const k = rng.int(2, 9), v = k * f;
    return {
      q: rich(`Wandle um: ${v} ${small} = ? ${big}`),
      a: rich(`${k} ${big}`),
      steps: [rich(`1 ${big} = ${f} ${small}`), rich(`${v} ${small} = ${v} : ${f} ${big} = ${k} ${big}`)],
      inline: true,
      check: { lvl: 1, exp: `${k} ${big}` },
    };
  }

  function laengenLevel2(rng) {
    const [big, small] = rng.pick([["m", "dm"], ["m", "cm"], ["dm", "cm"], ["cm", "mm"]]);
    const f = UNITS[big] / UNITS[small];
    const b = rng.int(1, 9), s = rng.int(1, f - 1), total = b * f + s;
    if (rng.chance(0.5)) {
      // gemischte Einheiten → eine Einheit
      return {
        q: rich(`Wandle um: ${b} ${big} ${s} ${small} = ? ${small}`),
        a: rich(`${total} ${small}`),
        steps: [
          rich(`${b} ${big} = ${b} · ${f} ${small} = ${b * f} ${small}`),
          rich(`${b * f} ${small} + ${s} ${small} = ${total} ${small}`),
        ],
        inline: true,
        check: { lvl: 2, exp: `${total} ${small}` },
      };
    }
    // eine Einheit → gemischte Einheiten
    return {
      q: rich(`Schreibe in ${big} und ${small}: ${total} ${small} = ?`),
      a: rich(`${b} ${big} ${s} ${small}`),
      steps: [
        rich(`1 ${big} = ${f} ${small}`),
        rich(`${total} ${small} : ${f} = ${b} Rest ${s}`),
        rich(`${total} ${small} = ${b} ${big} ${s} ${small}`),
      ],
      inline: true,
      check: { lvl: 2, exp: `${b} ${big} ${s} ${small}` },
    };
  }

  function laengenLevel3(rng) {
    const [big, small, d] = rng.pick([["m", "dm", 1], ["m", "cm", 2], ["dm", "cm", 1], ["cm", "mm", 1]]);
    const f = UNITS[big] / UNITS[small];                            // f = 10^d, daher ist n die Zahl in „small“
    const n = decNum(rng, d), xs = dec(new Frac(n, 10 ** d));      // Wert = n · 10^(−d) in „big“
    if (rng.chance(0.6)) {
      // Komma-Umrechnung in beide Richtungen
      if (rng.chance(0.5)) {
        return {
          q: rich(`Wandle um: ${xs} ${big} = ? ${small}`),
          a: rich(`${n} ${small}`),
          steps: [rich(`1 ${big} = ${f} ${small}`), rich(`${xs} ${big} = ${xs} · ${f} ${small} = ${n} ${small}`)],
          inline: true,
          check: { lvl: 3, exp: `${n} ${small}` },
        };
      }
      return {
        q: rich(`Wandle um: ${n} ${small} = ? ${big}`),
        a: rich(`${xs} ${big}`),
        steps: [rich(`1 ${big} = ${f} ${small}`), rich(`${n} ${small} : ${f} = ${xs} ${big}`)],
        inline: true,
        check: { lvl: 3, exp: `${xs} ${big}` },
      };
    }
    // Vergleich: linke Länge in „big“, rechte in „small“; gleich oder knapp daneben
    const eq = rng.chance(0.3);
    let second = n;
    if (!eq) {
      do { second = n + rng.pick([-1, 1]) * rng.int(1, 25); } while (second < 1);
    }
    const sym = n === second ? "=" : n < second ? "<" : ">";
    return {
      q: rich(`Setze <, = oder > ein: ${xs} ${big} ___ ${second} ${small}`),
      a: rich(sym),
      steps: [
        rich(`${xs} ${big} = ${xs} · ${f} ${small} = ${n} ${small}`),
        rich(`${n} ${small} ${sym} ${second} ${small}`),
      ],
      inline: true,
      check: { lvl: 3, exp: sym },
    };
  }

  AG.registerType({
    id: "m5-laengen",
    klasse: "5",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren und Lagebeziehungen",
    title: "Längeneinheiten umrechnen",
    topic: "groessen",
    instruction: {
      1: "Wandle die Länge in die angegebene Einheit um.",
      2: "Wandle um. Achte auf die gemischten Einheiten.",
      3: "Wandle um oder vergleiche. Schreibe die Zahlen mit Komma.",
    },
    merke: [
      "1 m = 10 dm = 100 cm = 1000 mm. ", "Beim Umrechnen in eine kleinere Einheit wird mit der Umrechnungszahl ",
      { b: "multipliziert" }, ", in eine größere ", { b: "geteilt" }, ". Beispiele: 2 m 5 cm = 205 cm; 2,35 m = 235 cm.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return laengenLevel1(rng);
      if (level === 2) return laengenLevel2(rng);
      return laengenLevel3(rng);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
