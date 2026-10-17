// M8 LB 8: Funktionale Zusammenhänge – Zuordnungen untersuchen, Graphen ablesen, lineare Funktionen y = mx + t.
// Typen: m8-zuordnung-art (RM), m8-graph-ablesen (RM), m8-lineare-funktion (M).
// Vorbild: m7-proportionalitaet.js (Wertetabellen mit table/aTable), m7-flaechen.js (Skizzen).
(function (AG) {
  const { Frac, num, rich, plain, fmtInt, MINUS, SKETCH_COLORS } = AG;
  const { INK, GREY } = SKETCH_COLORS;

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const sInt = n => fmtInt(n);                 // ganze Zahl mit Minuszeichen „−“
  const uT = u => (u ? " " + u : "");          // Einheit mit Leerzeichen davor
  // Zahlen in Tabellen und Rechnungen: Geld mit zwei Stellen, sonst so viele wie nötig
  const numE = (x, money) => num(x, money ? { as: "dec", digits: 2 } : { as: "dec" });
  const numX = x => num(x, { as: "dec" });
  // Quotient: bei Geld mindestens zwei Stellen
  const qN = (q, money) => num(q, money ? { as: "dec", digits: Math.max(2, q.decimals()) } : { as: "dec" });
  // Glied „ + t“ bzw. „ − t“ für y = mx + t (leer bei t = 0)
  const tTerm = t => (t.sign() === 0 ? "" : t.sign() > 0 ? [" + ", num(t)] : [" " + MINUS + " ", num(t.abs())]);
  // Funktionsgleichung y = mx + t als Rich (m = ±1 ohne Ziffer, m als Bruch mit Bruch-Segment)
  function eqRich(m, t, lhs = "y") {
    const out = [lhs + " = "];
    if (m.isInt() && Math.abs(m.n) === 1) out.push(m.n < 0 ? MINUS : "", "x");
    else out.push(num(m), "x");
    out.push(tTerm(t));
    return rich(out);
  }

  // ---------- Koordinatensystem ----------
  // cfg: W, H (mm), xr/yr [min, max] in Einheiten, gx/gy Gitterabstand, lx/ly Zahl an jedem lx-ten Strich
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
    // Achsenbeschriftung mit Einheit
    if (y0 < 0) s.label([ax[0] + 1, ax[1] - 2.6], cfg.xName, { anchor: "end" });   // x-Achse in der Mitte: Name an den Pfeil
    else s.label([W - 1.5, H - 1.5], cfg.xName, { anchor: "end" });
    s.label([ay[0] + 2, 2.5], cfg.yName, { anchor: "start" });
    return { s, P, xr: cfg.xr, yr: cfg.yr };
  }

  // Gerade y = t + m·x im Ausschnitt: Endpunkte an den Rand des Ausschnitts gekürzt (null, wenn außerhalb)
  function clipLine(t, m, xr, yr) {
    const a = (yr[0] - t) / m, b = (yr[1] - t) / m;
    const xa = Math.max(xr[0], Math.min(a, b)), xb = Math.min(xr[1], Math.max(a, b));
    if (xa > xb) return null;
    return [[xa, t + m * xa], [xb, t + m * xb]];
  }

  // Koordinatensystem mit Geraden lines [{t, m, dash, label}], Markierungen marks [[x, y]] (Punkt mit Hilfslinien), extra(cs)
  function graphFig(cfg, lines, marks = [], extra = null) {
    const cs = coords(cfg);
    for (const L of lines) {
      const seg = clipLine(L.t, L.m, cfg.xr, cfg.yr);
      if (!seg) continue;
      const [a, b] = seg;
      cs.s.line(cs.P(a[0], a[1]), cs.P(b[0], b[1]), { width: 0.5, dash: !!L.dash });
      if (L.label) { const e = cs.P(b[0], b[1]); cs.s.label([e[0] + 2.2, e[1]], L.label, { anchor: "start", bold: true }); }
    }
    for (const [x, y] of marks) {
      cs.s.line(cs.P(x, y), cs.P(x, 0), { dash: true });
      cs.s.line(cs.P(x, y), cs.P(0, y), { dash: true });
      cs.s.circle(cs.P(x, y), 0.9, { fill: INK });
    }
    if (extra) extra(cs);
    return cs.s.done();
  }

  // ================= 1. Art der Zuordnung: proportional, linear oder nicht linear? =================
  // lin: y = t + m·x; prop: y = q·x; nonlin: nl = sq (x²), double (Verdoppelung), half (Halbierung)
  const CTX_ART = [
    { kind: "lin", xl: "Fahrstrecke in km", yl: "Fahrpreis in €", yu: "€", money: true, t: [4, 3, 5], m: [2.2, 1.8, 2.5], x0: [0], s: [1],
      intro: "Ein Taxi verlangt eine Grundgebühr und einen Preis je km." },
    { kind: "lin", xl: "Gesprächsminuten", yl: "Kosten in €", yu: "€", money: true, t: [10, 15, 8], m: [0.2, 0.25, 0.1], x0: [0], s: [5, 10],
      intro: "Ein Handytarif hat eine Grundgebühr und einen Preis je Minute." },
    { kind: "lin", xl: "Brenndauer in h", yl: "Länge in cm", yu: "cm", money: false, t: [30, 24, 20], m: [-2, -3], x0: [0], s: [1],
      intro: "Eine Kerze brennt gleichmäßig ab." },
    { kind: "lin", xl: "Zeit in min", yl: "Wasser in l", yu: "l", money: false, t: [200, 150], m: [-12, -15], x0: [0], s: [1, 2],
      intro: "Aus einem Wassertank wird gleichmäßig Wasser abgelassen." },
    { kind: "prop", xl: "Menge in kg", yl: "Preis in €", yu: "€", money: true, q: [2.4, 3.2, 1.8], qu: "€ pro kg", x0: [0, 1], s: [1, 2],
      intro: "Äpfel werden auf dem Markt nach Gewicht verkauft." },
    { kind: "prop", xl: "Anzahl Brezen", yl: "Preis in €", yu: "€", money: true, q: [0.9, 1.1, 0.8], qu: "€ pro Breze", x0: [0, 1], s: [1],
      intro: "In der Bäckerei kostet jede Breze gleich viel." },
    { kind: "prop", xl: "Zeit in h", yl: "Strecke in km", yu: "km", money: false, q: [50, 60, 45], qu: "km pro h", x0: [0, 1], s: [1],
      intro: "Ein Reisebus fährt mit gleichbleibender Geschwindigkeit." },
    { kind: "prop", xl: "Menge in l", yl: "Preis in €", yu: "€", money: true, q: [1.8, 1.75], qu: "€ pro l", x0: [0], s: [5],
      intro: "An der Tankstelle kostet Benzin überall gleich viel." },
    { kind: "nonlin", nl: "sq", xl: "Seitenlänge in cm", yl: "Flächeninhalt in cm²", yu: "cm²", money: false, x0: [1], s: [1],
      intro: "Von quadratischen Figuren wird der Flächeninhalt bestimmt." },
    { kind: "nonlin", nl: "double", xl: "Zeit in h", yl: "Anzahl in Tausend", yu: "", money: false, x0: [0], s: [1], y0: [2, 3],
      intro: "Eine Bakterienkultur verdoppelt sich jede Stunde." },
    { kind: "nonlin", nl: "half", xl: "Zeit in min", yl: "Wasser in l", yu: "l", money: false, x0: [0], s: [1], y0: [64, 80, 96],
      intro: "Aus einem Behälter läuft jede Minute die Hälfte des restlichen Wassers aus." },
  ];

  function pickKind(rng, level) {
    return level === 2 ? "lin" : rng.pick(["prop", "lin", "nonlin"]);
  }

  // Wertepaare mit gleichen x-Schritten; alle y ≥ 0 und höchstens zwei Dezimalstellen
  function makeSeries(rng, c, k) {
    for (let tries = 0; tries < 300; tries++) {
      const x0 = rng.pick(c.x0), s = rng.pick(c.s);
      const xs = range(0, k - 1).map(i => new Frac(x0 + i * s));
      let ys;
      if (c.kind === "lin") {
        const t = Frac.of(rng.pick(c.t)), m = Frac.of(rng.pick(c.m));
        ys = xs.map(x => t.add(m.mul(x)));
      } else if (c.kind === "prop") {
        const q = Frac.of(rng.pick(c.q));
        ys = xs.map(x => q.mul(x));
      } else if (c.nl === "sq") {
        ys = xs.map(x => x.mul(x));
      } else {
        const y0 = new Frac(rng.pick(c.y0));
        ys = xs.map((x, i) => (c.nl === "double" ? y0.mul(2 ** i) : y0.div(2 ** i)));
      }
      if (ys.every(y => y.sign() >= 0 && y.decimals() <= 2)) return { xs, ys };
    }
    throw new Error("Wertetabelle: keine passenden Zahlen gefunden");
  }

  // Art der Zuordnung aus den Wertepaaren: prop (Quotienten gleich, durch 0), lin (Differenzen gleich), sonst nonlin
  function classify(xs, ys) {
    const nz = range(0, xs.length - 1).filter(i => xs[i].sign() !== 0);
    const zeroOk = xs.every((x, i) => x.sign() !== 0 || ys[i].sign() === 0);
    if (zeroOk && nz.length && nz.every(i => ys[i].div(xs[i]).eq(ys[nz[0]].div(xs[nz[0]])))) return "prop";
    const ds = range(1, xs.length - 1).map(i => ys[i].sub(ys[i - 1]));
    return ds.every(d => d.eq(ds[0])) ? "lin" : "nonlin";
  }

  // Begründung in Rechenzeilen (vollständige Tabelle)
  function classSteps(kind, xs, ys, money, qv) {
    const out = [];
    if (kind === "prop") {
      if (xs.some(x => x.sign() === 0)) out.push(rich("Bei x = 0 ist y = 0."));
      xs.forEach((x, i) => { if (x.sign() !== 0) out.push(rich(numE(ys[i], money), " : ", numX(x), " = ", qN(qv, money))); });
      out.push(rich("Alle Quotienten y : x sind gleich → proportional."));
      return out;
    }
    for (let i = 1; i < xs.length; i++) out.push(rich(numE(ys[i], money), " − ", numE(ys[i - 1], money), " = ", numE(ys[i].sub(ys[i - 1]), money)));
    out.push(rich(kind === "lin"
      ? "Die Differenzen sind immer gleich → linear. Die Quotienten y : x sind verschieden → nicht proportional."
      : "Die Differenzen sind nicht gleich → nicht linear."));
    return out;
  }

  // Ergänzen in Rechenzeilen (Lücken in der y-Zeile)
  function fillSteps({ kind, xs, ys, money, blanks, d, qv, nl, yu }) {
    const k = xs.length, out = [];
    const numY = y => numE(y, money);
    if (kind === "lin") {
      out.push(rich("Änderung je Schritt: ", numE(d, money), uT(yu)));
      for (const j of blanks) {
        // nächster bekannter Wert als Ausgangspunkt
        const ref = range(0, k - 1).filter(i => !blanks.includes(i))
          .reduce((best, i) => (best === null || Math.abs(i - j) < Math.abs(best - j) ? i : best), null);
        const st = Math.abs(j - ref);
        const eff = j > ref ? d : d.neg();
        out.push(rich(numY(ys[ref]), eff.sign() < 0 ? " − " : " + ", st === 1 ? "" : st + " · ", numE(eff.abs(), money), " = ", numY(ys[j])));
      }
    } else if (kind === "prop") {
      const i0 = range(0, k - 1).find(i => !blanks.includes(i) && xs[i].sign() !== 0);
      out.push(rich(numY(ys[i0]), " : ", numX(xs[i0]), " = ", qN(qv, money)));
      for (const j of blanks) out.push(rich(numX(xs[j]), " · ", qN(qv, money), " = ", numY(ys[j])));
    } else {
      // Lücken mit Index ≥ 1: der Vorgänger ist immer bekannt
      for (const j of blanks) {
        if (nl === "sq") out.push(rich(numX(xs[j]), " · ", numX(xs[j]), " = ", numY(ys[j])));
        else if (nl === "double") out.push(rich(numY(ys[j - 1]), " · 2 = ", numY(ys[j])));
        else out.push(rich(numY(ys[j - 1]), " : 2 = ", numY(ys[j])));
      }
    }
    return out;
  }

  // Ergebnissatz zur Art der Zuordnung
  function answerText(kind, c, d, qv, money) {
    if (kind === "prop") return rich("proportional, denn der Quotient y : x ist immer ", qN(qv, money), uT(c.qu));
    if (kind === "lin") return rich("linear, aber nicht proportional: Die Werte nehmen bei gleicher Schrittweite immer um ", numE(d.abs(), money), uT(c.yu), d.sign() > 0 ? " zu." : " ab.");
    return rich("nicht linear, denn die Differenzen sind nicht gleich.");
  }

  AG.registerType({
    id: "m8-zuordnung-art",
    klasse: "8",
    zug: "RM",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Zuordnung: proportional, linear oder nicht linear?",
    topic: "zuordnung",
    instruction: {
      1: "Entscheide, ob die Zuordnung proportional, linear oder nicht linear ist. Begründe mit Quotienten oder Differenzen.",
      2: "Ergänze die fehlenden Werte der linearen Zuordnung.",
      3: "Ergänze die fehlenden Werte und bestimme die Art der Zuordnung. Begründe.",
    },
    merke: [
      "Proportional: ", { b: "y : x" }, " ist immer gleich, der Graph geht durch 0 (2 kg kosten 5 €, 3 kg kosten 7,50 €: 5 : 2 = 2,50 und 7,50 : 3 = 2,50). ",
      "Linear, nicht proportional: Bei gleicher Schrittweite ist die ", { b: "Differenz" }, " gleich, z. B. Grundgebühr 4 € + 2 € je km: 0 km → 4 €, 1 km → 6 €, 2 km → 8 €. ",
      "Nicht linear: Die Differenzen sind nicht gleich.",
    ],
    cols: 1,
    generate(rng, level) {
      const kind = pickKind(rng, level);
      const c = rng.pick(CTX_ART.filter(x => x.kind === kind));
      const money = c.money;
      const k = rng.pick([4, 5]);
      const { xs, ys } = makeSeries(rng, c, k);
      const nb = Math.min(rng.pick([2, 3]), k - 2); // mindestens ein bekannter Wert ≠ 0 bleibt stehen
      const blanks = level === 1 ? [] : rng.shuffle(range(1, k - 1)).slice(0, nb).sort((a, b) => a - b);
      const real = classify(xs, ys);
      if (real !== kind) throw new Error("Generator: Art stimmt nicht (" + kind + " / " + real + ")");
      const d = ys[1].sub(ys[0]);
      const i0 = xs.findIndex(x => x.sign() !== 0);
      const qv = kind === "prop" ? ys[i0].div(xs[i0]) : null;

      const row0 = [[{ b: c.xl }], ...xs.map(x => numX(x))];
      const table = {
        rows: [row0, [[{ b: c.yl }], ...ys.map((y, i) => (blanks.includes(i) ? [{ blank: 3 }] : numE(y, money)))]],
      };
      const aTable = {
        rows: [row0, [[{ b: c.yl }], ...ys.map(y => numE(y, money))]],
      };

      const q = level === 1
        ? rich(c.intro, " Welche Art von Zuordnung liegt vor? Begründe mit Quotienten oder Differenzen.")
        : level === 2
          ? rich(c.intro, " Die Zuordnung ist linear. Ergänze die fehlenden Werte.")
          : rich(c.intro, " Ergänze die fehlenden Werte. Ist die Zuordnung proportional, linear oder nicht linear? Begründe.");
      const a = level === 2
        ? rich("Fehlende Werte: ", blanks.map(j => plain(numE(ys[j], money))).join(" ; "))
        : answerText(kind, c, d, qv, money);
      const fill = () => fillSteps({ kind, xs, ys, money, blanks, d, qv, nl: c.nl, yu: c.yu });
      const steps = level === 1 ? classSteps(kind, xs, ys, money, qv)
        : level === 2 ? fill()
          : [...fill(), ...classSteps(kind, xs, ys, money, qv)];

      return { q, a, table, aTable, steps, check: { kind, xs, ys, money, blanks: blanks.slice() } };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
      if (level === 1 && blanks) return "Niveau 1 ohne Lücken erwartet";
      if (level > 1 && (blanks < 2 || blanks > 3)) return `${blanks} Lücken statt 2–3`;
      if (level === 2 && k.kind !== "lin") return "Niveau 2 nur linear";
      if (classify(k.xs, k.ys) !== k.kind) return "Art stimmt nicht";
      for (let i = 0; i < k.xs.length; i++) {
        if (plain(t.aTable.rows[0][i + 1]) !== plain(numX(k.xs[i]))) return "aTable: x falsch";
        if (plain(t.aTable.rows[1][i + 1]) !== plain(numE(k.ys[i], k.money))) return "aTable: y falsch in Spalte " + i;
      }
      const s = plain(t.a);
      if (level === 2) return k.blanks.every(j => s.includes(plain(numE(k.ys[j], k.money)))) || `Lösung „${s}“ unvollständig`;
      const pre = { prop: "proportional, denn der Quotient", lin: "linear, aber nicht proportional", nonlin: "nicht linear, denn" }[k.kind];
      return s.startsWith(pre) || `Antwort falsch: „${s}“`;
    },
  });

  // ================= 2. Graph einer linearen Zuordnung ablesen =================
  // Gitter: ganze Einheiten in x, 2 Einheiten in y, Startwert t und Zunahme m sind gerade (Gitterpunkte)
  const CTX_GRAPH = [
    { xName: "x in km", yName: "y in €", xu: "km", yu: "€", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Ein Taxi verlangt eine Grundgebühr und einen Preis je km." },
    { xName: "x in h", yName: "y in €", xu: "h", yu: "€", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Ein Fahrrad kann mit einer Grundgebühr und einem Preis je Stunde gemietet werden." },
    { xName: "x in h", yName: "y in cm", xu: "h", yu: "cm", xMax: [5, 6], t: [12, 16, 20], m: [-2, -4],
      intro: "Eine Kerze brennt gleichmäßig ab." },
    { xName: "x in min", yName: "y in l", xu: "min", yu: "l", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Ein Becken ist schon teilweise gefüllt und wird gleichmäßig weiter gefüllt." },
  ];
  const GRAPH_W = 130, GRAPH_H = 58;

  function genLine(rng) {
    const c = rng.pick(CTX_GRAPH);
    for (let tries = 0; tries < 500; tries++) {
      const xMax = rng.pick(c.xMax), t = rng.pick(c.t), m = rng.pick(c.m);
      const ys = range(0, xMax).map(x => t + m * x);
      if (ys.some(y => y < 0)) continue;
      const yMax = 2 * Math.ceil(Math.max(...ys) / 2);
      if (yMax > 20) continue;
      return { c, xMax, t, m, ys, yMax };
    }
    throw new Error("Graph: keine passende Gerade gefunden");
  }

  // Zwei Tarife: A durchgezogen, B gestrichelt; Schnittpunkt auf einem Gitterpunkt (y-Gitter 4)
  function genTwo(rng) {
    let p = null;
    for (let tries = 0; tries < 2000 && !p; tries++) {
      const xStar = rng.pick([2, 3, 4]), dm = rng.pick([1, 2]);
      const mA = rng.pick([2, 3, 4, 5]), mB = mA - dm;
      const tA = rng.pick([0, 4, 8]), tB = tA + xStar * dm;
      const yStar = tA + mA * xStar;
      if (mB < 1 || yStar % 4 !== 0) continue;
      const yMax = 4 * Math.ceil(Math.max(tA + mA * 7, tB + mB * 7) / 4);
      if (yMax > 32) continue;
      p = { xStar, dm, mA, mB, tA, tB, yStar, yMax };
    }
    if (!p) throw new Error("Graph Tarife: keine Werte gefunden");
    // Teilfrage b): welcher Tarif ist bei k Stunden günstiger? (k ≠ Schnittpunkt)
    p.k = rng.pick(range(1, 7).filter(v => v !== p.xStar));
    p.name = rng.pick(["Ein Leihfahrrad", "Ein Mietroller", "Ein Tretboot", "Ein Carsharing-Auto", "Ein E-Scooter", "Ein Lastenrad", "Ein Kanu"]);
    return p;
  }

  AG.registerType({
    id: "m8-graph-ablesen",
    klasse: "8",
    zug: "RM",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Graph einer linearen Zuordnung ablesen",
    topic: "zuordnung",
    instruction: {
      1: "Lies die Werte am Graphen ab.",
      2: "Lies Startwert und Zunahme am Graphen ab und berechne den y-Wert.",
      3: "Lies den Schnittpunkt der beiden Geraden ab und beantworte die Frage.",
    },
    merke: [
      "Der ", { b: "Startwert" }, " ist der y-Wert bei x = 0 (Schnittpunkt mit der y-Achse). Die ", { b: "Zunahme" },
      " je Einheit ist der Unterschied der y-Werte bei x = 0 und x = 1. Beispiel: Startwert 4 €, Zunahme 2 € je km → bei 3 km kostet es 4 € + 3 · 2 € = 10 €.",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 3) {
        const p = genTwo(rng);
        const cfg = { W: GRAPH_W, H: GRAPH_H, xr: [0, 7], yr: [0, p.yMax], gx: 1, gy: 4, lx: 1, ly: 4, xName: "x in h", yName: "y in €" };
        const lines = [
          { t: p.tA, m: p.mA, label: "A" },
          { t: p.tB, m: p.mB, dash: true, label: "B" },
        ];
        const hStd = k => (k === 1 ? "1 Stunde" : `${k} Stunden`);
        const q = rich(`${p.name} kann bei zwei Anbietern gemietet werden. Die durchgezogene Linie gehört zu Tarif A, die gestrichelte zu Tarif B. `
          + `a) Ab wie vielen Stunden ist Tarif B günstiger als Tarif A? Lies den Schnittpunkt am Graphen ab. b) Welcher Tarif ist bei ${hStd(p.k)} günstiger?`);
        return {
          q,
          a: rich(`a) Bei ${p.xStar} Stunden kosten beide ${p.yStar} €. Für mehr als ${p.xStar} Stunden ist Tarif B günstiger. `
            + `b) Bei ${hStd(p.k)} ist Tarif ${p.k < p.xStar ? "A" : "B"} günstiger.`),
          steps: [
            rich(`Schnittpunkt der beiden Geraden: x = ${p.xStar}, y = ${p.yStar}.`),
            rich(`Tarif A startet bei ${p.tA} € und kostet ${p.mA} € je Stunde. Tarif B startet bei ${p.tB} € und kostet ${p.mB} € je Stunde.`),
            rich(`Für x > ${p.xStar} liegt die gestrichelte Gerade B unter der Geraden A. Tarif B ist also günstiger.`),
            rich(`Bei ${p.k} Stunden liegt ${p.k < p.xStar ? "die durchgezogene Gerade A" : "die gestrichelte Gerade B"} tiefer: Dieser Tarif ist günstiger.`),
          ],
          fig: graphFig(cfg, lines),
          aFig: graphFig(cfg, lines, [[p.xStar, p.yStar]]),
          inline: false,
          check: { lvl: 3, ...p },
        };
      }
      const g = genLine(rng);
      const { c, xMax, t, m, ys, yMax } = g;
      const cfg = { W: GRAPH_W, H: GRAPH_H, xr: [0, xMax], yr: [0, yMax], gx: 1, gy: 2, lx: 1, ly: 2, xName: c.xName, yName: c.yName };
      const lines = [{ t, m }];
      if (level === 1) {
        const x1 = rng.int(1, xMax), x2 = rng.intExcept(1, xMax, [x1]);
        const y1 = ys[x1], y2 = ys[x2];
        return {
          q: rich(c.intro, ` Lies am Graphen ab: a) Welcher y-Wert gehört zu x = ${x1}? b) Welcher x-Wert gehört zu y = ${y2}?`),
          a: rich(`a) y = ${y1}${uT(c.yu)}; b) x = ${x2}${uT(c.xu)}`),
          steps: [
            rich(`Bei x = ${x1}: senkrecht zur Geraden, dann waagerecht zur y-Achse. Ablesen: y = ${y1}.`),
            rich(`Bei y = ${y2}: waagerecht zur Geraden, dann senkrecht zur x-Achse. Ablesen: x = ${x2}.`),
          ],
          fig: graphFig(cfg, lines),
          aFig: graphFig(cfg, lines, [[x1, y1], [x2, y2]]),
          inline: false,
          check: { lvl: 1, t, m, x1, x2 },
        };
      }
      // Niveau 2: Startwert, Zunahme und ein y-Wert
      const xq = rng.int(2, xMax), xd = rng.int(1, xMax);
      const Yd = ys[xd];
      return {
        q: rich(c.intro, ` Lies am Graphen ab: a) den Startwert, b) die Änderung von y je ${c.xu} (von x = 0 zu x = 1), c) den y-Wert bei x = ${xq}, d) den x-Wert bei y = ${Yd}.`),
        a: rich(`a) Startwert ${sInt(t)}${uT(c.yu)}; b) Änderung je ${c.xu}: ${sInt(m)}${uT(c.yu)}; c) y = ${ys[xq]}${uT(c.yu)}; d) x = ${xd}${uT(c.xu)}`),
        steps: [
          rich(`Startwert: Der Graph schneidet die y-Achse bei ${sInt(t)}.`),
          rich(`Änderung: Bei x = 1 ist y = ${sInt(ys[1])}. Also ${sInt(ys[1])} − ${sInt(t)} = ${sInt(m)}.`),
          rich(`Bei x = ${xq} ist y = ${sInt(t)} ${m < 0 ? MINUS : "+"} ${xq} · ${Math.abs(m)} = ${ys[xq]}.`),
          rich(`Bei y = ${Yd}: waagerecht zur Geraden, dann senkrecht zur x-Achse. Ablesen: x = ${xd}.`),
        ],
        fig: graphFig(cfg, lines),
        aFig: graphFig(cfg, lines, [[xq, ys[xq]]], cs => {
          // Änderungsdreieck von x = 0 nach x = 1
          const p0 = cs.P(0, t), p1 = cs.P(1, t), p2 = cs.P(1, t + m);
          cs.s.line(p0, p1, { dash: true });
          cs.s.line(p1, p2, { dash: true });
          cs.s.circle(p0, 0.9, { fill: INK });
          const h = cs.P(0.5, t), v = cs.P(1, t + m / 2);
          cs.s.label([h[0], h[1] + (m < 0 ? -3.6 : 3.6)], "Δx = 1", { size: 3 });
          cs.s.label([v[0] + 2, v[1]], "Δy = " + sInt(m), { anchor: "start", size: 3 });
        }),
        inline: false,
        check: { lvl: 2, t, m, xq, yq: ys[xq] },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.lvl === 1) {
        const exp = `a) y = ${k.t + k.m * k.x1}`;
        return plain(t.a).startsWith(exp) || `erwartet „${exp}…“, steht „${plain(t.a)}“`;
      }
      if (k.lvl === 2) {
        const exp = `a) Startwert ${k.t}`;
        return plain(t.a).startsWith(exp) || `erwartet „${exp}…“, steht „${plain(t.a)}“`;
      }
      // Niveau 3: Schnittpunkt prüfen
      if (k.tA + k.mA * k.xStar !== k.yStar || k.tB + k.mB * k.xStar !== k.yStar) return "Schnittpunkt falsch";
      if (k.yStar % 4 !== 0) return "Schnittpunkt liegt nicht auf dem Gitter";
      return plain(t.a).includes(`Bei ${k.xStar} Stunden`) || `Antwort falsch: „${plain(t.a)}“`;
    },
  });

  // ================= 3. Lineare Funktion y = mx + t =================
  const M_POOL = [1, -1, 2, -2, 3, -3, 0.5, -0.5];
  const numT = t => num(t);

  // Niveau 1: Wertetabelle zu y = mx + t, x = −2 … 3
  function genTable(rng) {
    const m = Frac.of(rng.pick(M_POOL)), t = new Frac(rng.int(-4, 4));
    const xs = range(-2, 3).map(v => new Frac(v));
    const ys = xs.map(x => m.mul(x).add(t));
    const nb = rng.pick([2, 3]);
    const blanks = rng.shuffle(range(0, 5)).slice(0, nb).sort((a, b) => a - b);
    const row0 = [[{ b: "x" }], ...xs.map(x => numX(x))];
    const table = { rows: [row0, [[{ b: "y" }], ...ys.map((y, i) => (blanks.includes(i) ? [{ blank: 3 }] : num(y)))]] };
    const aTable = { rows: [row0, [[{ b: "y" }], ...ys.map(y => num(y))]] };
    const steps = blanks.map(j => rich("y = ", num(m, { paren: true }), " · ", num(xs[j], { paren: true }), tTerm(t), " = ", num(ys[j])));
    return {
      q: rich("Gegeben ist die Funktion ", eqRich(m, t), ". Ergänze die fehlenden y-Werte in der Wertetabelle."),
      a: rich("Fehlende Werte: ", blanks.map(j => `y(${sInt(xs[j].n)}) = ${plain(num(ys[j]))}`).join("; ")),
      table, aTable, steps,
      check: { lvl: 1, m, t, xs, ys, blanks: blanks.length },
    };
  }

  // Niveau 2: m und t aus dem Graphen, Steigungsdreieck in der Lösung
  function genReadLine(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const m = Frac.of(rng.pick(M_POOL));
      const t = Frac.of(rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]));
      const run = Math.abs(m.valueOf()) < 1 ? 2 : 1;
      const rise = m.mul(run);
      if (!rise.isInt()) continue;
      const cands = range(-4, 4 - run).filter(x1 => {
        const y1 = m.mul(x1).add(t);
        return y1.isInt() && Math.abs(y1.valueOf()) <= 5 && Math.abs(y1.add(rise).valueOf()) <= 5;
      });
      if (!cands.length) continue;
      return { m, t, run, rise: rise.n, x1: rng.pick(cands) };
    }
    throw new Error("lineare Funktion: keine Gerade gefunden");
  }

  // Niveau 3: a) Gleichung aus zwei Punkten, b) liegt P auf der Geraden?
  function genCheck(rng) {
    const m = Frac.of(rng.pick(M_POOL)), t = new Frac(rng.int(-4, 4));
    const half = m.d === 2;
    const xPool = half ? [-4, -2, 0, 2, 4] : range(-4, 4);
    if (rng.chance(0.5)) {
      const [x1, x2] = rng.shuffle(xPool).slice(0, 2);
      const y1 = m.mul(x1).add(t), y2 = m.mul(x2).add(t);
      return { variant: "a", m, t, x1, x2, y1, y2 };
    }
    const p = rng.pick(half ? xPool : range(-3, 3));
    const val = m.mul(p).add(t);
    const on = rng.chance(0.5);
    const qv = on ? val : val.add(rng.pick([-2, -1, 1, 2]));
    return { variant: "b", m, t, p, val, qv, on };
  }

  AG.registerType({
    id: "m8-lineare-funktion",
    klasse: "8",
    zug: "M",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Lineare Funktion y = mx + t",
    topic: "zuordnung",
    instruction: {
      1: "Fülle die Wertetabelle zur Funktion aus.",
      2: "Lies m und t am Graphen ab und gib die Funktionsgleichung an.",
      3: "Bestimme die Gleichung der Geraden bzw. prüfe durch Einsetzen, ob der Punkt auf der Geraden liegt.",
    },
    merke: [
      "Die Funktion ", { b: "y = mx + t" }, ": m ist die Steigung (Zunahme je Schritt nach rechts), t der Startwert (y-Wert bei x = 0). "
      + "Beispiel: y = 2x − 3 hat m = 2 und t = −3. Einsetzen: Der Punkt P(2|1) liegt auf der Geraden, weil 2 · 2 − 3 = 1 ist.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return genTable(rng);
      if (level === 2) {
        const { m, t, run, rise, x1 } = genReadLine(rng);
        const cfg = { W: 70, H: 58, xr: [-5, 5], yr: [-5, 5], gx: 1, gy: 1, lx: 2, ly: 2, xName: "x", yName: "y" };
        const lines = [{ t: t.valueOf(), m: m.valueOf() }];
        const y1 = m.mul(x1).add(t).valueOf(), y2 = y1 + rise;
        // Teilfragen a), b): y-Wert bei x = kx und x-Wert bei y = Y (x2 ganzzahlig, Y ganzzahlig)
        const kx = rng.int(-4, 4), yk = m.mul(kx).add(t);
        const x2 = rng.pick(range(-4, 4).filter(x => m.mul(x).add(t).isInt()));
        const Y = m.mul(x2).add(t).n;
        const ykTxt = plain(num(yk));
        return {
          q: rich(`Lies aus dem Graphen den y-Achsenabschnitt t und die Steigung m ab und gib die Funktionsgleichung y = mx + t an. `
            + `Berechne damit a) den y-Wert bei x = ${sInt(kx)}, b) den x-Wert bei y = ${sInt(Y)}.`),
          a: rich(eqRich(m, t), `; a) y = ${ykTxt}; b) x = ${sInt(x2)}`),
          steps: [
            rich(`Startwert: Die Gerade schneidet die y-Achse bei t = ${sInt(t.n)}.`),
            rich(`Steigungsdreieck: Δx = ${run}, Δy = ${sInt(rise)}.`),
            rich("m = Δy : Δx = ", sInt(rise), " : ", String(run), " = ", num(m)),
            eqRich(m, t),
            rich("a) y = ", num(m, { paren: true }), " · ", num(new Frac(kx), { paren: true }), tTerm(t), " = ", num(yk)),
            ...(() => {
              const divOp = m.isInt() && m.n === 1 ? [] : ["   | : ", num(m, { paren: true })];
              if (t.sign() === 0) return [rich(eqRich(m, t, "b) " + sInt(Y)), divOp)];
              return [rich(eqRich(m, t, "b) " + sInt(Y)), "   | ", t.sign() > 0 ? MINUS + " " : "+ ", num(t.abs())),
                rich(eqRich(m, new Frac(0), sInt(Y - t.n)), divOp)];
            })(),
            rich("x = ", sInt(x2)),
          ],
          fig: graphFig(cfg, lines),
          aFig: graphFig(cfg, lines, [], cs => {
            const P1 = cs.P(x1, y1), P2 = cs.P(x1 + run, y1), P3 = cs.P(x1 + run, y2);
            cs.s.line(P1, P2, { width: 0.45 });
            cs.s.line(P2, P3, { width: 0.45 });
            cs.s.circle(P1, 0.9, { fill: INK });
            cs.s.circle(P3, 0.9, { fill: INK });
            // ohne Beschriftung im Bild: Δx und Δy stehen in den Lösungsschritten (in kleiner Skizze sonst Überlappung)
          }),
          inline: false,
          check: { lvl: 2, m, t, yk: ykTxt, x2 },
        };
      }
      const c = genCheck(rng);
      if (c.variant === "a") {
        const dy = c.y2.sub(c.y1).valueOf(), dx = c.x2 - c.x1;
        return {
          q: rich(`Die Gerade mit der Gleichung y = mx + t verläuft durch die Punkte P(${sInt(c.x1)} | ${sInt(c.y1.n)}) und Q(${sInt(c.x2)} | ${sInt(c.y2.n)}). Bestimme m und t und gib die Gleichung an.`),
          a: eqRich(c.m, c.t),
          steps: [
            rich("m = (", sInt(c.y2.n), " − ", num(c.y1, { paren: true }), ") : (", sInt(c.x2), " − ", num(new Frac(c.x1), { paren: true }), ") = ",
              sInt(c.y2.n - c.y1.n), " : ", num(new Frac(dx), { paren: true }), " = ", num(c.m)),
            rich("t = ", sInt(c.y1.n), " − ", num(c.m, { paren: true }), " · ", num(new Frac(c.x1), { paren: true }), " = ", num(c.t)),
            eqRich(c.m, c.t),
          ],
          check: { lvl: 3, variant: "a", m: c.m, t: c.t, dy, dx },
        };
      }
      const on = c.on;
      return {
        q: rich("Gegeben ist die Gerade ", eqRich(c.m, c.t), `. Liegt der Punkt P(${sInt(c.p)} | ${sInt(c.qv.n)}) auf der Geraden? Begründe durch Einsetzen.`),
        a: rich(on ? "ja, P liegt auf der Geraden." : "nein, P liegt nicht auf der Geraden."),
        steps: [
          rich("Einsetzen von x = ", num(new Frac(c.p)), ": y = ", num(c.m, { paren: true }), " · ", num(new Frac(c.p), { paren: true }), tTerm(c.t), " = ", num(c.val)),
          rich(on
            ? `${sInt(c.val.n)} = ${sInt(c.qv.n)}: Der Punkt liegt auf der Geraden.`
            : `${sInt(c.val.n)} ≠ ${sInt(c.qv.n)}: Der Punkt liegt nicht auf der Geraden.`),
        ],
        check: { lvl: 3, variant: "b", m: c.m, t: c.t, on },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.lvl === 1) {
        const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
        if (blanks < 2 || blanks > 3) return `${blanks} Lücken statt 2–3`;
        for (let i = 0; i < k.xs.length; i++) {
          const y = k.m.mul(k.xs[i]).add(k.t);
          if (plain(t.aTable.rows[1][i + 1]) !== plain(num(y))) return "aTable: y falsch in Spalte " + i;
        }
        return true;
      }
      if (k.lvl === 2) {
        const exp = plain(eqRich(k.m, k.t)) + `; a) y = ${k.yk}; b) x = ${sInt(k.x2)}`;
        return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
      }
      if (k.variant === "a") {
        if (k.dx === 0) return "Δx = 0";
        if (!k.m.mul(k.dx).eq(k.dy)) return "Steigung passt nicht zu den Punkten";
        return plain(t.a) === plain(eqRich(k.m, k.t)) || `Gleichung falsch: „${plain(t.a)}“`;
      }
      return plain(t.a).startsWith(k.on ? "ja" : "nein") || `Antwort falsch: „${plain(t.a)}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
