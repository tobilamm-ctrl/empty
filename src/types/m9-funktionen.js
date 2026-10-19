// M9 LB 8: Funktionale Zusammenhänge (Klasse 9, Quali-Niveau): Art der Zuordnung (proportional,
// umgekehrt proportional, linear), Graphen ablesen, y = mx + t und y = k : x, Schnittpunkt zweier Geraden.
// Typen: m9-zuordnung-art (RM), m9-graph-ablesen (RM), m9-funktionsgleichung (M), m9-schnittpunkt (M).
// Vorbild: m8-funktionen.js (Koordinatensystem, Wertetabellen, Steigungsdreieck); Hilfsfunktionen kopiert.
(function (AG) {
  const { Frac, num, rich, plain, fmtInt, MINUS, SKETCH_COLORS } = AG;
  const { INK, GREY } = SKETCH_COLORS;

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const sInt = n => fmtInt(n);                                   // ganze Zahl mit Minuszeichen „−“
  const uT = u => (u ? " " + u : "");                            // Einheit mit Leerzeichen davor
  const uX = (x, u) => uT(Number(x) === 1 && u === "Personen" ? "Person" : u);   // x-Einheit, Einzahl bei 1
  const sp = n => (n < 0 ? "(" + sInt(n) + ")" : sInt(n));       // ganze Zahl, negative in Klammern
  const plusT = t => (t === 0 ? "" : t < 0 ? " " + MINUS + " " + sInt(-t) : " + " + sInt(t));
  const mxT = m => (m === 1 ? "x" : m === -1 ? MINUS + "x" : sp(m) + " · x");
  // Zahlen in Tabellen und Rechnungen: Geld mit zwei Stellen, sonst so viele wie nötig
  const numE = (x, money) => num(x, money ? { as: "dec", digits: 2 } : { as: "dec" });
  const numX = x => num(x, { as: "dec" });
  // Quotient: bei Geld mindestens zwei Stellen
  const qN = (q, money) => num(q, money ? { as: "dec", digits: Math.max(2, q.decimals()) } : { as: "dec" });
  // Glied „ + t“ bzw. „ − t“ für y = mx + t (leer bei t = 0), Brüche als Bruch-Segment
  const tTerm = t => (t.sign() === 0 ? "" : t.sign() > 0 ? [" + ", num(t)] : [" " + MINUS + " ", num(t.abs())]);
  // Funktionsgleichung y = mx + t als Rich (m = ±1 ohne Ziffer)
  function eqRich(m, t, lhs = "y") {
    const out = [lhs + " = "];
    if (m.isInt() && Math.abs(m.n) === 1) out.push(m.n < 0 ? MINUS : "", "x");
    else out.push(num(m), "x");
    out.push(tTerm(t));
    return rich(out);
  }
  // Umgekehrte Proportionalität y = k : x
  const eqInv = k => rich("y = ", sInt(k), " : x");

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
    if (y0 < 0) s.label([ax[0] + 1, ax[1] - 2.6], cfg.xName, { anchor: "end" });
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

  // Markierungen: Punkt mit gestrichelten Hilfslinien zu den Achsen
  function drawMarks(cs, marks) {
    for (const [x, y] of marks) {
      cs.s.line(cs.P(x, y), cs.P(x, 0), { dash: true });
      cs.s.line(cs.P(x, y), cs.P(0, y), { dash: true });
      cs.s.circle(cs.P(x, y), 0.9, { fill: INK });
    }
  }

  // Koordinatensystem mit Geraden lines [{t, m, dash, label}], Markierungen marks [[x, y]], extra(cs)
  function graphFig(cfg, lines, marks = [], extra = null) {
    const cs = coords(cfg);
    for (const L of lines) {
      const seg = clipLine(L.t, L.m, cfg.xr, cfg.yr);
      if (!seg) continue;
      const [a, b] = seg;
      cs.s.line(cs.P(a[0], a[1]), cs.P(b[0], b[1]), { width: 0.5, dash: !!L.dash });
      if (L.label) { const e = cs.P(b[0], b[1]); cs.s.label([e[0] + 2.2, e[1]], L.label, { anchor: "start", bold: true }); }
    }
    drawMarks(cs, marks);
    if (extra) extra(cs);
    return cs.s.done();
  }

  // Hyperbel y = k : x im Ausschnitt als Polylinie (geometrisch verteilte Stützstellen, Kurve bleibt glatt)
  function curveFig(cfg, k, marks = []) {
    const cs = coords(cfg);
    const x0 = k / cfg.yr[1], x1 = cfg.xr[1], n = 160;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 * Math.pow(x1 / x0, i / n);
      const p = cs.P(x, k / x);
      pts.push(p[0].toFixed(2) + "," + p[1].toFixed(2));
    }
    cs.s.path("M" + pts.join(" L"), { width: 0.5 });
    drawMarks(cs, marks);
    return cs.s.done();
  }

  // ================= 1. Art der Zuordnung: proportional, umgekehrt proportional, linear oder nicht linear? =================
  // lin: y = t + m·x; prop: y = q·x; inv: x · y = pr (Auswahl aus Teilern); nonlin: nl = sq (x²)
  const ART_PRE = { prop: "proportional, denn", inv: "umgekehrt proportional, denn", lin: "linear, aber nicht proportional", nonlin: "nicht linear, denn" };
  const ART_WORD = { prop: "proportional", inv: "umgekehrt proportional", lin: "linear" };
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
    { kind: "inv", xl: "Anzahl Arbeiter", yl: "Arbeitstage", yu: "Tage", money: false, pr: [24, 36, 48, 60], lo: 1, hi: 12,
      intro: "Ein Auftrag braucht immer gleich viel Arbeit." },
    { kind: "inv", xl: "Geschwindigkeit in km/h", yl: "Fahrzeit in h", yu: "h", money: false, pr: [120, 240], lo: 20, hi: 120,
      intro: "Eine Strecke wird mit verschiedenen Geschwindigkeiten gefahren." },
    { kind: "inv", xl: "Anzahl Flaschen", yl: "Inhalt je Flasche in l", yu: "l", money: false, pr: [12, 24], lo: 1, hi: 12,
      intro: "Eine feste Menge Saft wird gleichmäßig in Flaschen abgefüllt." },
    { kind: "inv", xl: "Anzahl Personen", yl: "Anteil in €", yu: "€", money: true, pr: [240, 360], lo: 2, hi: 12,
      intro: "Ein Geldbetrag wird gleichmäßig auf mehrere Personen verteilt." },
    { kind: "nonlin", nl: "sq", xl: "Seitenlänge in cm", yl: "Flächeninhalt in cm²", yu: "cm²", money: false, x0: [1], s: [1],
      intro: "Von quadratischen Figuren wird der Flächeninhalt bestimmt." },
  ];

  // Niveau 2: Art ist gegeben (keine nichtlineare Zuordnung)
  function pickKind(rng, level) {
    return level === 2 ? rng.pick(["prop", "lin", "inv"]) : rng.pick(["prop", "lin", "inv", "nonlin"]);
  }

  // Wertepaare mit gleichen x-Schritten (bzw. Teiler für umgekehrt proportional); alle y ≥ 0, höchstens zwei Dezimalstellen
  function makeSeries(rng, c, n) {
    for (let tries = 0; tries < 300; tries++) {
      if (c.kind === "inv") {
        const pr = rng.pick(c.pr);
        const div = range(c.lo, c.hi).filter(v => pr % v === 0);
        if (div.length < n) continue;
        const a = rng.int(0, div.length - n);
        const xs = div.slice(a, a + n).map(v => new Frac(v));
        return { xs, ys: xs.map(x => new Frac(pr).div(x)) };
      }
      const x0 = rng.pick(c.x0), s = rng.pick(c.s);
      const xs = range(0, n - 1).map(i => new Frac(x0 + i * s));
      let ys;
      if (c.kind === "lin") {
        const t = Frac.of(rng.pick(c.t)), m = Frac.of(rng.pick(c.m));
        ys = xs.map(x => t.add(m.mul(x)));
      } else if (c.kind === "prop") {
        const q = Frac.of(rng.pick(c.q));
        ys = xs.map(x => q.mul(x));
      } else {
        ys = xs.map(x => x.mul(x));
      }
      if (ys.every(y => y.sign() >= 0 && y.decimals() <= 2)) return { xs, ys };
    }
    throw new Error("Wertetabelle: keine passenden Zahlen gefunden");
  }

  // Art der Zuordnung: prop (Quotienten gleich), inv (Produkte gleich), lin (Differenzen gleich), sonst nonlin
  function classify(xs, ys) {
    const nz = range(0, xs.length - 1).filter(i => xs[i].sign() !== 0);
    const zeroOk = xs.every((x, i) => x.sign() !== 0 || ys[i].sign() === 0);
    if (zeroOk && nz.length && nz.every(i => ys[i].div(xs[i]).eq(ys[nz[0]].div(xs[nz[0]])))) return "prop";
    if (xs.every(x => x.sign() !== 0) && ys.every(y => y.sign() !== 0)) {
      const p0 = xs[0].mul(ys[0]);
      if (xs.every((x, i) => x.mul(ys[i]).eq(p0))) return "inv";
    }
    const ds = range(1, xs.length - 1).map(i => ys[i].sub(ys[i - 1]));
    return ds.every(d => d.eq(ds[0])) ? "lin" : "nonlin";
  }

  // Ergebnissatz zur Art der Zuordnung (mit Begründung)
  function artAnswer({ kind, c, money, qv, pv, d }) {
    if (kind === "prop") return rich("proportional, denn der Quotient y : x ist immer ", qN(qv, money), uT(c.qu), ".");
    if (kind === "inv") return rich("umgekehrt proportional, denn das Produkt x · y ist immer ", numE(pv, money), ".");
    if (kind === "lin") return rich("linear, aber nicht proportional: Die Werte nehmen bei gleicher Schrittweite immer um ", numE(d.abs(), money), uT(c.yu), d.sign() > 0 ? " zu." : " ab.");
    return rich("nicht linear, denn die Differenzen sind nicht gleich.");
  }

  // Begründung in Rechenzeilen (vollständige Tabelle)
  function classSteps(info) {
    const { kind, xs, ys, money, qv, pv } = info;
    const out = [];
    if (kind === "prop") {
      if (xs.some(x => x.sign() === 0)) out.push(rich("Bei x = 0 ist y = 0."));
      xs.forEach((x, i) => { if (x.sign() !== 0) out.push(rich(numE(ys[i], money), " : ", numX(x), " = ", qN(qv, money))); });
      out.push(rich("Alle Quotienten y : x sind gleich → proportional."));
    } else if (kind === "inv") {
      xs.forEach((x, i) => out.push(rich(numX(x), " · ", numE(ys[i], money), " = ", numE(x.mul(ys[i]), money))));
      out.push(rich("Alle Produkte x · y sind gleich → umgekehrt proportional."));
    } else {
      for (let i = 1; i < xs.length; i++) out.push(rich(numE(ys[i], money), " − ", numE(ys[i - 1], money), " = ", numE(ys[i].sub(ys[i - 1]), money)));
      out.push(rich(kind === "lin"
        ? "Die Differenzen sind immer gleich → linear. Die Quotienten y : x sind verschieden → nicht proportional."
        : "Die Differenzen sind nicht gleich → nicht linear."));
    }
    out.push(rich("Also: ", artAnswer(info)));
    return out;
  }

  // Ergänzen in Rechenzeilen (Lücken in der y-Zeile); die Lücken liegen nie bei x-Index 0 oder 1
  function fillSteps({ kind, xs, ys, money, blanks, d, qv, pv, nl, yu }) {
    const k = xs.length, out = [];
    const numY = y => numE(y, money);
    const known = range(0, k - 1).filter(i => !blanks.includes(i));
    if (kind === "lin") {
      out.push(rich("Änderung je Schritt: ", numY(d), uT(yu)));
      for (const j of blanks) {
        const ref = known.reduce((best, i) => (Math.abs(i - j) < Math.abs(best - j) ? i : best), known[0]);
        const st = Math.abs(j - ref);
        const eff = j > ref ? d : d.neg();
        out.push(rich("x = ", numX(xs[j]), ": ", numY(ys[ref]), eff.sign() < 0 ? " − " : " + ", st === 1 ? "" : st + " · ", numE(eff.abs(), money), " = ", numY(ys[j])));
      }
    } else if (kind === "prop") {
      const i0 = known.find(i => xs[i].sign() !== 0);
      out.push(rich(numY(ys[i0]), " : ", numX(xs[i0]), " = ", qN(qv, money)));
      for (const j of blanks) out.push(rich("x = ", numX(xs[j]), ": ", numX(xs[j]), " · ", qN(qv, money), " = ", numY(ys[j])));
    } else if (kind === "inv") {
      const i0 = known[0];
      out.push(rich(numX(xs[i0]), " · ", numY(ys[i0]), " = ", numE(pv, money)));
      for (const j of blanks) out.push(rich("x = ", numX(xs[j]), ": ", numE(pv, money), " : ", numX(xs[j]), " = ", numY(ys[j])));
    } else {
      for (const j of blanks) out.push(rich("x = ", numX(xs[j]), ": ", numX(xs[j]), " · ", numX(xs[j]), " = ", numY(ys[j])));
    }
    return out;
  }

  AG.registerType({
    id: "m9-zuordnung-art",
    klasse: "9",
    zug: "RM",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Zuordnung: proportional, umgekehrt proportional, linear?",
    topic: "zuordnung",
    instruction: {
      1: "Entscheide, ob die Zuordnung proportional, umgekehrt proportional, linear oder nicht linear ist. Begründe mit Quotienten, Produkten oder Differenzen.",
      2: "Die Art der Zuordnung ist gegeben. Ergänze die fehlenden Werte in der Wertetabelle.",
      3: "Ergänze die fehlenden Werte und bestimme die Art der Zuordnung. Begründe.",
    },
    merke: [
      "Proportional: ", { b: "y : x" }, " ist immer gleich (2 kg kosten 5 €, 3 kg kosten 7,50 €: 5 : 2 = 2,50 und 7,50 : 3 = 2,50). ",
      "Umgekehrt proportional: ", { b: "x · y" }, " ist immer gleich (4 Arbeiter brauchen 6 Tage, 6 Arbeiter brauchen 4 Tage: 4 · 6 = 24 und 6 · 4 = 24). ",
      "Linear, nicht proportional: Bei gleicher Schrittweite ist die ", { b: "Differenz" }, " gleich (4 € Grundgebühr + 2 € je km: 0 km → 4 €, 1 km → 6 €, 2 km → 8 €). ",
      "Nicht linear: Die Differenzen sind nicht gleich.",
    ],
    cols: 1,
    generate(rng, level) {
      const kind = pickKind(rng, level);
      const c = rng.pick(CTX_ART.filter(x => x.kind === kind));
      const money = !!c.money;
      const n = rng.pick([4, 5]);
      const { xs, ys } = makeSeries(rng, c, n);
      if (classify(xs, ys) !== kind) throw new Error("Generator: Art stimmt nicht (" + kind + ")");
      // Lücken nur ab Index 2: die ersten zwei Werte bleiben stehen (Änderung und Produkt daraus ablesbar)
      const blanks = level === 1 ? [] : rng.shuffle(range(2, n - 1)).slice(0, Math.min(rng.pick([2, 3]), n - 2)).sort((a, b) => a - b);
      const d = ys[1].sub(ys[0]);
      const i0 = xs.findIndex(x => x.sign() !== 0);
      const qv = kind === "prop" ? ys[i0].div(xs[i0]) : null;
      const pv = kind === "inv" ? xs[0].mul(ys[0]) : null;
      const info = { kind, c, xs, ys, money, blanks, d, qv, pv, nl: c.nl, yu: c.yu };

      const row0 = [[{ b: c.xl }], ...xs.map(x => numX(x))];
      const table = {
        rows: [row0, [[{ b: c.yl }], ...ys.map((y, i) => (blanks.includes(i) ? [{ blank: 3 }] : numE(y, money)))]],
      };
      const aTable = {
        rows: [row0, [[{ b: c.yl }], ...ys.map(y => numE(y, money))]],
      };
      const q = level === 1
        ? rich(c.intro, " Welche Art von Zuordnung liegt vor? Begründe mit Quotienten, Produkten oder Differenzen.")
        : level === 2
          ? rich(c.intro, ` Die Zuordnung ist ${ART_WORD[kind]}. Ergänze die fehlenden Werte in der Tabelle.`)
          : rich(c.intro, " Ergänze die fehlenden Werte in der Tabelle. Welche Art von Zuordnung liegt vor? Begründe.");
      const listText = blanks.map(j => `x = ${plain(numX(xs[j]))}: y = ${plain(numE(ys[j], money))}`).join("; ");
      const a = level === 2
        ? rich("Fehlende Werte: " + listText)
        : level === 1
          ? rich("Die Zuordnung ist ", artAnswer(info))
          : rich("Fehlende Werte: " + listText + ". Die Zuordnung ist ", artAnswer(info));
      const steps = level === 1 ? classSteps(info)
        : level === 2 ? fillSteps(info)
          : [...fillSteps(info), ...classSteps(info)];
      return { q, a, table, aTable, steps, check: { kind, xs, ys, money, blanks: blanks.slice() } };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
      if (level === 1 && blanks) return "Niveau 1 ohne Lücken erwartet";
      if (level > 1 && (blanks < 2 || blanks > 3)) return `${blanks} Lücken statt 2–3`;
      if (level === 2 && k.kind === "nonlin") return "Niveau 2 ohne nichtlineare Zuordnung";
      if (classify(k.xs, k.ys) !== k.kind) return "Art stimmt nicht";
      for (let i = 0; i < k.xs.length; i++) {
        if (plain(t.aTable.rows[0][i + 1]) !== plain(numX(k.xs[i]))) return "aTable: x falsch";
        if (plain(t.aTable.rows[1][i + 1]) !== plain(numE(k.ys[i], k.money))) return "aTable: y falsch in Spalte " + i;
      }
      const s = plain(t.a);
      if (level === 2) return k.blanks.every(j => s.includes(plain(numE(k.ys[j], k.money)))) || `Lösung „${s}“ unvollständig`;
      if (!s.includes("Die Zuordnung ist " + ART_PRE[k.kind])) return `Art falsch: „${s}“`;
      return true;
    },
  });

  // ================= 2. Graph ablesen: linear oder umgekehrt proportional =================
  const CTX_GRAPH = [
    { kind: "lin", xName: "x in km", yName: "y in €", xu: "km", yu: "€", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Ein Taxi verlangt eine Grundgebühr und einen Preis je km." },
    { kind: "lin", xName: "x in h", yName: "y in €", xu: "h", yu: "€", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Ein Fahrrad kann mit einer Grundgebühr und einem Preis je Stunde gemietet werden." },
    { kind: "lin", xName: "x in min", yName: "y in l", xu: "min", yu: "l", xMax: [4, 5], t: [2, 4, 6], m: [2, 4],
      intro: "Eine Regentonne ist schon teilweise gefüllt und wird mit dem Gartenschlauch gleichmäßig weiter gefüllt." },
    { kind: "inv", xName: "x in km/h", yName: "y in h", xu: "km/h", yu: "h", pr: [24, 36],
      intro: "Eine Strecke wird mit verschiedenen Geschwindigkeiten gefahren." },
    { kind: "inv", xName: "x in Kanister", yName: "y in l", xu: "Kanister", yu: "l", pr: [12, 24],
      intro: "Eine feste Menge Wasser wird gleichmäßig auf mehrere Kanister verteilt." },
    { kind: "inv", xName: "x in Personen", yName: "y in €", xu: "Personen", yu: "€", pr: [24, 36],
      intro: "Ein Geldbetrag wird gleichmäßig auf mehrere Personen verteilt." },
  ];
  const GRAPH_W = 130, GRAPH_H = 58;

  // Gerade mit ganzzahligen Gitterpunkten für x = 0 … xMax
  function genLinear(rng, c) {
    for (let tries = 0; tries < 500; tries++) {
      const xMax = rng.pick(c.xMax), t = rng.pick(c.t), m = rng.pick(c.m);
      const ys = range(0, xMax).map(x => t + m * x);
      if (ys.some(y => y < 0)) continue;
      const yMax = 2 * Math.ceil(Math.max(...ys) / 2);
      if (yMax > 20) continue;
      return { xMax, t, m, ys, yMax };
    }
    throw new Error("Graph: keine passende Gerade gefunden");
  }

  function graphTask(rng, level) {
    const c = rng.pick(CTX_GRAPH);
    const lin = c.kind === "lin";
    let cfg, g;
    if (lin) {
      g = genLinear(rng, c);
      cfg = { W: GRAPH_W, H: GRAPH_H, xr: [0, g.xMax], yr: [0, g.yMax], gx: 1, gy: 2, lx: 1, ly: 2, xName: c.xName, yName: c.yName };
    } else {
      g = { k: rng.pick(c.pr) };
      cfg = { W: GRAPH_W, H: GRAPH_H, xr: [0, 12], yr: [0, 12], gx: 1, gy: 1, lx: 1, ly: 2, xName: c.xName, yName: c.yName };
    }
    const yAt = x => (lin ? g.t + g.m * x : g.k / x);
    // lesbare Stellen: ganzzahlige x mit ganzzahligem y
    const xsRead = lin ? range(1, g.xMax) : range(1, 12).filter(x => g.k % x === 0 && g.k / x <= 12);
    const figOf = (marks = [], extra = null) => (lin ? graphFig(cfg, [{ t: g.t, m: g.m }], marks, extra) : curveFig(cfg, g.k, marks));

    if (level === 1) {
      const x1 = rng.pick(xsRead), x2 = rng.pick(xsRead.filter(x => x !== x1));
      const y1 = yAt(x1), y2 = yAt(x2);
      return {
        q: rich(c.intro, ` Lies am Graphen ab: a) Welcher y-Wert gehört zu x = ${x1}? b) Welcher x-Wert gehört zu y = ${y2}?`),
        a: rich(`a) y = ${y1}${uT(c.yu)}; b) x = ${x2}${uX(x2, c.xu)}`),
        steps: [
          rich(`Bei x = ${x1}: senkrecht zur x-Achse bis zum Graphen, dann waagerecht zur y-Achse. Ablesen: y = ${y1}.`),
          rich(`Bei y = ${y2}: waagerecht bis zum Graphen, dann senkrecht zur x-Achse. Ablesen: x = ${x2}.`),
        ],
        fig: figOf(), aFig: figOf([[x1, y1], [x2, y2]]), inline: false,
        check: { lvl: 1, lin, t: g.t, m: g.m, k: g.k, x1, x2, y1, y2 },
      };
    }

    if (level === 2 && lin) {
      const xq = rng.int(2, g.xMax), xd = rng.int(1, g.xMax);
      const yq = yAt(xq), Yd = yAt(xd);
      return {
        q: rich(c.intro, ` Lies am Graphen ab: a) den Startwert, b) die Änderung von y je ${c.xu} (von x = 0 zu x = 1), c) den y-Wert bei x = ${xq}, d) den x-Wert bei y = ${Yd}.`),
        a: rich(`a) Startwert ${sInt(g.t)}${uT(c.yu)}; b) Änderung je ${c.xu}: ${sInt(g.m)}${uT(c.yu)}; c) y = ${yq}${uT(c.yu)}; d) x = ${xd}${uX(xd, c.xu)}`),
        steps: [
          rich(`Startwert: Der Graph schneidet die y-Achse bei ${sInt(g.t)}.`),
          rich(`Änderung: Bei x = 1 ist y = ${sInt(yAt(1))}. Also ${sInt(yAt(1))} − ${sInt(g.t)} = ${sInt(g.m)}.`),
          rich(`Bei x = ${xq} ist y = ${sInt(g.t)} + ${xq} · ${sInt(g.m)} = ${yq}.`),
          rich(`Bei y = ${Yd}: waagerecht zur Geraden, dann senkrecht zur x-Achse. Ablesen: x = ${xd}.`),
        ],
        fig: figOf(),
        aFig: figOf([[xq, yq]], cs => {
          const p0 = cs.P(0, g.t), p1 = cs.P(1, g.t), p2 = cs.P(1, g.t + g.m);
          cs.s.line(p0, p1, { dash: true });
          cs.s.line(p1, p2, { dash: true });
          cs.s.circle(p0, 0.9, { fill: INK });
          const h = cs.P(0.5, g.t), v = cs.P(1, g.t + g.m / 2);
          cs.s.label([h[0], h[1] + 3.6], "Δx = 1", { size: 3 });
          cs.s.label([v[0] + 2, v[1]], "Δy = " + sInt(g.m), { anchor: "start", size: 3 });
        }),
        inline: false,
        check: { lvl: 2, lin: true, t: g.t, m: g.m, xq, yq, xd, yd: Yd },
      };
    }

    if (level === 2) {
      // umgekehrt proportional: Produkt aus einem abgelesenen Punkt, dann Werte berechnen
      const x1 = rng.pick(xsRead), xq = rng.pick(xsRead), xd = rng.pick(xsRead);
      const y1 = yAt(x1), yq = yAt(xq), Yd = yAt(xd);
      return {
        q: rich(c.intro, ` Lies am Graphen einen Punkt ab und berechne damit: a) das Produkt x · y, b) den y-Wert bei x = ${xq}, c) den x-Wert bei y = ${Yd}.`),
        a: rich(`a) x · y = ${g.k}; b) y = ${yq}${uT(c.yu)}; c) x = ${xd}${uX(xd, c.xu)}`),
        steps: [
          rich(`Punkt am Graphen: x = ${x1}, y = ${y1}. Produkt: ${x1} · ${y1} = ${g.k}.`),
          rich(`b) y = ${g.k} : ${xq} = ${yq}.`),
          rich(`c) x = ${g.k} : ${Yd} = ${xd}.`),
        ],
        fig: figOf(), aFig: figOf([[x1, y1], [xq, yq]]), inline: false,
        check: { lvl: 2, lin: false, k: g.k, xq, yq, xd, yd: Yd },
      };
    }

    // Niveau 3: zwei Werte ablesen und ihren Unterschied berechnen (Sachkontext)
    const x1 = rng.pick(xsRead), x2 = rng.pick(xsRead.filter(x => x !== x1));
    const y1 = yAt(x1), y2 = yAt(x2), diff = Math.abs(y1 - y2);
    return {
      q: rich(c.intro, ` Lies am Graphen ab: a) den y-Wert bei x = ${x1}, b) den y-Wert bei x = ${x2}. c) Um wie viel unterscheiden sich diese beiden y-Werte?`),
      a: rich(`a) y = ${y1}${uT(c.yu)}; b) y = ${y2}${uT(c.yu)}; c) ${diff}${uT(c.yu)}`),
      steps: [
        rich(`Bei x = ${x1} ist y = ${y1}.`),
        rich(`Bei x = ${x2} ist y = ${y2}.`),
        rich(`Unterschied: ${Math.max(y1, y2)} − ${Math.min(y1, y2)} = ${diff}.`),
      ],
      fig: figOf(), aFig: figOf([[x1, y1], [x2, y2]]), inline: false,
      check: { lvl: 3, lin, t: g.t, m: g.m, k: g.k, x1, x2, y1, y2, diff },
    };
  }

  AG.registerType({
    id: "m9-graph-ablesen",
    klasse: "9",
    zug: "RM",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Graph ablesen: linear oder umgekehrt proportional",
    topic: "zuordnung",
    instruction: {
      1: "Lies die Werte am Graphen ab.",
      2: "Lies am Graphen ab und berechne mit dem Startwert bzw. mit dem Produkt x · y.",
      3: "Lies am Graphen zwei Werte ab und berechne den Unterschied.",
    },
    merke: [
      "Der ", { b: "Startwert" }, " ist der y-Wert bei x = 0. Die ", { b: "Zunahme" },
      " je Einheit ist der Unterschied der y-Werte bei x = 0 und x = 1. Beispiel: Startwert 4 €, Zunahme 2 € je km → bei 3 km kostet es 4 € + 3 · 2 € = 10 €. ",
      "Bei einer umgekehrt proportionalen Zuordnung ist ", { b: "x · y" }, " an jedem Punkt des Graphen gleich.",
    ],
    cols: 1,
    generate(rng, level) {
      return graphTask(rng, level);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(t.a);
      const yAt = x => (k.lin ? k.t + k.m * x : k.k / x);
      if (k.lvl === 1) {
        if (yAt(k.x1) !== k.y1 || yAt(k.x2) !== k.y2) return "Punkte falsch";
        return (s.includes(`a) y = ${k.y1}`) && s.includes(`b) x = ${k.x2}`)) || `Antwort falsch: „${s}“`;
      }
      if (k.lvl === 2 && k.lin) {
        return (s.includes(`a) Startwert ${k.t}`) && s.includes(`b) Änderung`) && s.includes(`c) y = ${k.yq}`) && s.includes(`d) x = ${k.xd}`)) || `Antwort falsch: „${s}“`;
      }
      if (k.lvl === 2) {
        const ok = k.k % k.xq === 0 && k.k / k.xq === k.yq && k.k / k.yd === k.xd;
        return (ok && s.includes(`a) x · y = ${k.k}`) && s.includes(`b) y = ${k.yq}`) && s.includes(`c) x = ${k.xd}`)) || `Antwort falsch: „${s}“`;
      }
      return (s.includes(`a) y = ${k.y1}`) && s.includes(`b) y = ${k.y2}`) && s.includes(`c) ${k.diff}`)) || `Antwort falsch: „${s}“`;
    },
  });

  // ================= 3. Funktionsgleichung: y = mx + t und y = k : x =================
  const M_POOL = [1, -1, 2, -2, 3, -3, 0.5, -0.5];
  const INV_PR = [12, 24, 60];          // Produkt k für y = k : x
  const INV_X = [1, 2, 3, 4, 6];        // x-Werte der Wertetabelle (alle Teiler von k)

  // Niveau 1 (linear): Wertetabelle zu y = mx + t, x = −2 … 3
  function genTableLin(rng) {
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
      check: { lvl: 1, kind: "lin", m, t, xs, ys, blanks: blanks.length },
    };
  }

  // Niveau 1 (umgekehrt proportional): Wertetabelle zu y = k : x
  function genTableInv(rng) {
    const pr = rng.pick(INV_PR);
    const xs = INV_X.map(v => new Frac(v));
    const ys = xs.map(x => new Frac(pr).div(x));
    const nb = rng.pick([2, 3]);
    const blanks = rng.shuffle(range(0, 4)).slice(0, nb).sort((a, b) => a - b);
    const row0 = [[{ b: "x" }], ...xs.map(x => numX(x))];
    const table = { rows: [row0, [[{ b: "y" }], ...ys.map((y, i) => (blanks.includes(i) ? [{ blank: 3 }] : num(y)))]] };
    const aTable = { rows: [row0, [[{ b: "y" }], ...ys.map(y => num(y))]] };
    const steps = blanks.map(j => rich("y = ", sInt(pr), " : ", num(xs[j]), " = ", num(ys[j])));
    return {
      q: rich("Gegeben ist die Funktion ", eqInv(pr), ". Ergänze die fehlenden y-Werte in der Wertetabelle."),
      a: rich("Fehlende Werte: ", blanks.map(j => `y(${sInt(xs[j].n)}) = ${plain(num(ys[j]))}`).join("; ")),
      table, aTable, steps,
      check: { lvl: 1, kind: "inv", pr, xs, ys, blanks: blanks.length },
    };
  }

  // Niveau 2 (linear): m und t aus dem Graphen, Steigungsdreieck in der Lösung
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

  function readLineTask(rng) {
    const { m, t, run, rise, x1 } = genReadLine(rng);
    const cfg = { W: 72, H: 46, xr: [-5, 5], yr: [-5, 5], gx: 1, gy: 1, lx: 2, ly: 2, xName: "x", yName: "y" };
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
      }),
      inline: false,
      check: { lvl: 2, kind: "lin", m, t, yk: ykTxt, x2 },
    };
  }

  // Niveau 2 (umgekehrt proportional): Tabelle mit drei Paaren, k = x · y, dann y bei neuem x
  function invReadTask(rng) {
    const pr = rng.pick([12, 24, 36, 60]);
    const div = range(1, 12).filter(v => pr % v === 0);
    const known = rng.shuffle(div).slice(0, 3).sort((a, b) => a - b);
    const xq = rng.pick(div.filter(v => !known.includes(v)));
    const yq = pr / xq;
    const row0 = [[{ b: "x" }], ...known.map(x => numX(x))];
    const table = { rows: [row0, [[{ b: "y" }], ...known.map(x => numX(pr / x))]] };
    return {
      q: rich("In der Tabelle steht eine umgekehrt proportionale Zuordnung y = k : x. a) Bestimme k und gib die Gleichung an. "
        + `b) Berechne damit den y-Wert bei x = ${xq}.`),
      a: rich(eqInv(pr), `; b) y = ${yq}`),
      table,
      aTable: table,
      steps: [
        ...known.map(x => rich(sInt(x), " · ", sInt(pr / x), " = ", sInt(pr))),
        rich("Gleichung: ", eqInv(pr)),
        rich("y = ", sInt(pr), " : ", sInt(xq), " = ", sInt(yq)),
      ],
      check: { lvl: 2, kind: "inv", pr, xq, yq },
    };
  }

  // Niveau 3 (linear): a) Gleichung aus zwei Punkten, b) Punktprobe
  function linCheck(rng, variant) {
    const m = Frac.of(rng.pick(M_POOL)), t = new Frac(rng.int(-4, 4));
    const half = m.d === 2;
    const xPool = half ? [-4, -2, 0, 2, 4] : range(-4, 4);
    if (variant === "a") {
      const [x1, x2] = rng.shuffle(xPool).slice(0, 2);
      const y1 = m.mul(x1).add(t), y2 = m.mul(x2).add(t);
      const dy = y2.sub(y1).valueOf(), dx = x2 - x1;
      return {
        q: rich(`Die Gerade mit der Gleichung y = mx + t verläuft durch die Punkte P(${sInt(x1)} | ${sInt(y1.n)}) und Q(${sInt(x2)} | ${sInt(y2.n)}). Bestimme m und t und gib die Gleichung an.`),
        a: eqRich(m, t),
        steps: [
          rich("m = (", sInt(y2.n), " − ", num(y1, { paren: true }), ") : (", sInt(x2), " − ", num(new Frac(x1), { paren: true }), ") = ",
            sInt(y2.n - y1.n), " : ", num(new Frac(dx), { paren: true }), " = ", num(m)),
          rich("t = ", sInt(y1.n), " − ", num(m, { paren: true }), " · ", num(new Frac(x1), { paren: true }), " = ", num(t)),
          eqRich(m, t),
        ],
        check: { lvl: 3, variant: "a", m, t, dy, dx },
      };
    }
    const p = rng.pick(half ? xPool : range(-3, 3));
    const val = m.mul(p).add(t);
    const on = rng.chance(0.5);
    const qv = on ? val : val.add(rng.pick([-2, -1, 1, 2]));
    return {
      q: rich("Gegeben ist die Gerade ", eqRich(m, t), `. Liegt der Punkt P(${sInt(p)} | ${sInt(qv.n)}) auf der Geraden? Begründe durch Einsetzen.`),
      a: rich(on ? "ja, P liegt auf der Geraden." : "nein, P liegt nicht auf der Geraden."),
      steps: [
        rich("Einsetzen von x = ", sInt(p), ": y = ", num(m, { paren: true }), " · ", num(new Frac(p), { paren: true }), tTerm(t), " = ", num(val)),
        rich(on
          ? `${sInt(val.n)} = ${sInt(qv.n)}: Der Punkt liegt auf der Geraden.`
          : `${sInt(val.n)} ≠ ${sInt(qv.n)}: Der Punkt liegt nicht auf der Geraden.`),
      ],
      check: { lvl: 3, variant: "b", m, t, on },
    };
  }

  // Niveau 3 (umgekehrt proportional): c) Gleichung aus einem Punkt, d) Punktprobe
  function invCheck(rng, variant) {
    const pr = rng.pick([12, 24, 36, 60]);
    const div = range(2, 12).filter(v => pr % v === 0 && pr / v !== v && pr / v <= 30);
    const p = rng.pick(div);
    if (variant === "c") {
      const q = pr / p;
      return {
        q: rich(`Der Punkt P(${sInt(p)} | ${sInt(q)}) liegt auf dem Graphen der Funktion y = k : x. Bestimme k und gib die Gleichung an.`),
        a: eqInv(pr),
        steps: [rich("k = x · y = ", sInt(p), " · ", sInt(q), " = ", sInt(pr)), rich("Gleichung: ", eqInv(pr))],
        check: { lvl: 3, variant: "c", pr, p, q },
      };
    }
    const val = pr / p;
    const on = rng.chance(0.5);
    const qv = on ? val : val + rng.pick([1, 2, 3]);
    return {
      q: rich(`Liegt der Punkt P(${sInt(p)} | ${sInt(qv)}) auf dem Graphen von ${plain(eqInv(pr))}? Begründe durch Einsetzen.`),
      a: rich(on ? "ja, P liegt auf dem Graphen." : "nein, P liegt nicht auf dem Graphen."),
      steps: [
        rich("Einsetzen von x = ", sInt(p), ": y = ", sInt(pr), " : ", sInt(p), " = ", sInt(val)),
        rich(on
          ? `${sInt(val)} = ${sInt(qv)}: Der Punkt liegt auf dem Graphen.`
          : `${sInt(val)} ≠ ${sInt(qv)}: Der Punkt liegt nicht auf dem Graphen.`),
      ],
      check: { lvl: 3, variant: "d", pr, p, qv, on, val },
    };
  }

  AG.registerType({
    id: "m9-funktionsgleichung",
    klasse: "9",
    zug: "M",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Funktionsgleichung: y = mx + t und y = k : x",
    topic: "zuordnung",
    instruction: {
      1: "Fülle die Wertetabelle zur Funktionsgleichung aus.",
      2: "Bestimme die Gleichung aus dem Graphen bzw. aus der Wertetabelle und berechne damit einen Wert.",
      3: "Bestimme die Gleichung aus einem bzw. zwei Punkten oder prüfe durch Einsetzen, ob ein Punkt auf dem Graphen liegt.",
    },
    merke: [
      "Die Funktion ", { b: "y = mx + t" }, ": m ist die Steigung, t der Startwert (y-Wert bei x = 0). "
      + "Beispiel: y = 2x − 3 hat m = 2 und t = −3. Der Punkt P(2 | 1) liegt auf der Geraden, weil 2 · 2 − 3 = 1 ist. ",
      "Die Funktion ", { b: "y = k : x" }, " (umgekehrt proportional): k = x · y. Beispiel: y = 12 : x, der Punkt P(4 | 3) liegt auf dem Graphen, weil 4 · 3 = 12 ist.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return rng.chance(0.5) ? genTableLin(rng) : genTableInv(rng);
      if (level === 2) return rng.chance(0.5) ? readLineTask(rng) : invReadTask(rng);
      const variant = rng.pick(["a", "b", "c", "d"]);
      return variant === "a" || variant === "b" ? linCheck(rng, variant) : invCheck(rng, variant);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(t.a);
      if (k.lvl === 1) {
        const blanks = t.table.rows.flat().flat().filter(sg => sg && typeof sg === "object" && "blank" in sg).length;
        if (blanks < 2 || blanks > 3) return `${blanks} Lücken statt 2–3`;
        for (let i = 0; i < k.xs.length; i++) {
          const y = k.kind === "lin" ? k.m.mul(k.xs[i]).add(k.t) : new Frac(k.pr).div(k.xs[i]);
          if (plain(t.aTable.rows[1][i + 1]) !== plain(num(y))) return "aTable: y falsch in Spalte " + i;
        }
        return true;
      }
      if (k.lvl === 2) {
        if (k.kind === "lin") {
          const exp = plain(eqRich(k.m, k.t)) + `; a) y = ${k.yk}; b) x = ${sInt(k.x2)}`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        const ok = k.pr % k.xq === 0 && k.pr / k.xq === k.yq;
        return (ok && s.includes(`y = ${k.pr} : x`) && s.includes(`b) y = ${k.yq}`)) || `Antwort falsch: „${s}“`;
      }
      if (k.variant === "a") {
        if (k.dx === 0) return "Δx = 0";
        if (!k.m.mul(k.dx).eq(k.dy)) return "Steigung passt nicht zu den Punkten";
        return s === plain(eqRich(k.m, k.t)) || `Gleichung falsch: „${s}“`;
      }
      if (k.variant === "b") return s.startsWith(k.on ? "ja" : "nein") || `Antwort falsch: „${s}“`;
      if (k.variant === "c") {
        if (k.p * k.q !== k.pr) return "Punkt liegt nicht auf dem Graphen";
        return s === plain(eqInv(k.pr)) || `Gleichung falsch: „${s}“`;
      }
      if (k.pr / k.p !== k.val) return "Wert falsch";
      return s.startsWith(k.on ? "ja" : "nein") || `Antwort falsch: „${s}“`;
    },
  });

  // ================= 4. Schnittpunkt zweier Geraden =================
  const M_INT = [-3, -2, -1, 1, 2, 3];

  // Geraden g, h mit ganzzahligem Schnittpunkt S(X | Y), X ≠ 0
  function genSolve(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const X = rng.int(1, 5), Y = rng.int(1, 10);
      const m1 = rng.pick(M_INT), m2 = rng.pick(M_INT.filter(m => m !== m1));
      const t1 = Y - m1 * X, t2 = Y - m2 * X;
      if (Math.abs(t1) > 9 || Math.abs(t2) > 9) continue;
      return { X, Y, m1, m2, t1, t2 };
    }
    throw new Error("Schnittpunkt: keine Geraden gefunden");
  }

  // Niveau 1: rechnerisch durch Gleichsetzen
  function solveTask(rng) {
    const { X, Y, m1, m2, t1, t2 } = genSolve(rng);
    return {
      q: rich("Die Geraden g mit ", eqRich(new Frac(m1), new Frac(t1)), " und h mit ", eqRich(new Frac(m2), new Frac(t2)),
        " schneiden sich. Berechne den Schnittpunkt S rechnerisch durch Gleichsetzen. Gib S als Punkt S(x | y) an."),
      a: rich(`S(${sInt(X)} | ${sInt(Y)})`),
      steps: [
        rich(mxT(m1), plusT(t1), " = ", mxT(m2), plusT(t2), "   (Gleichsetzen)"),
        rich("(", sInt(m1), " − ", sp(m2), ") · x = ", sp(t2), " − ", sp(t1)),
        rich(sInt(m1 - m2), " · x = ", sInt(t2 - t1)),
        rich("x = ", sInt(t2 - t1), " : ", sp(m1 - m2), " = ", sInt(X)),
        rich("y = ", sp(m1), " · ", sInt(X), plusT(t1), " = ", sInt(Y)),
        rich("Probe mit h: ", sp(m2), " · ", sInt(X), plusT(t2), " = ", sInt(Y), "."),
      ],
      check: { lvl: 1, X, Y, m1, m2, t1, t2 },
    };
  }

  // Niveau 2: zeichnerisch aus der Skizze, dann rechnerische Probe
  function drawTask(rng) {
    const { X, Y, m1, m2, t1, t2 } = genSolve(rng);
    const cfg = { W: 72, H: 46, xr: [0, 8], yr: [0, 12], gx: 1, gy: 1, lx: 1, ly: 2, xName: "x", yName: "y" };
    const lines = [{ t: t1, m: m1, label: "g" }, { t: t2, m: m2, dash: true, label: "h" }];
    return {
      q: rich("Die Geraden g mit ", eqRich(new Frac(m1), new Frac(t1)), " und h mit ", eqRich(new Frac(m2), new Frac(t2)),
        " sind in der Skizze dargestellt. a) Lies den Schnittpunkt S aus der Skizze ab. b) Prüfe rechnerisch durch Einsetzen, dass S auf beiden Geraden liegt."),
      a: rich(`a) S(${sInt(X)} | ${sInt(Y)}); b) Die Probe bestätigt S.`),
      steps: [
        rich("Schnittpunkt in der Skizze: vom Kreuzungspunkt senkrecht zur x-Achse und waagerecht zur y-Achse ablesen. Ablesen: x = ", sInt(X), ", y = ", sInt(Y), "."),
        rich("Probe mit g: ", sp(m1), " · ", sInt(X), plusT(t1), " = ", sInt(Y), "."),
        rich("Probe mit h: ", sp(m2), " · ", sInt(X), plusT(t2), " = ", sInt(Y), ". Also S(", sInt(X), " | ", sInt(Y), ")."),
      ],
      fig: graphFig(cfg, lines),
      aFig: graphFig(cfg, lines, [[X, Y]]),
      inline: false,
      check: { lvl: 2, X, Y, m1, m2, t1, t2 },
    };
  }

  // Niveau 3: Sachaufgabe mit zwei Tarifen (Gleichsetzen, Vergleich bei einer anderen Stundenzahl)
  function tariffTask(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const name = rng.pick(["Eine Kletterhalle", "Ein Schwimmbad", "Ein Trampolinpark", "Ein Bowlingcenter", "Ein Minigolfplatz"]);
      const xStar = rng.pick([2, 3, 4, 5]);
      const dm = rng.pick([1, 2]);                 // Unterschied der Stundenpreise
      const mB = rng.int(2, 6), mA = mB + dm;
      const tA = rng.pick([2, 4, 6, 8, 10]);
      const tB = tA + xStar * dm;                  // Gleichsetzen: tA + mA·x = tB + mB·x bei x = xStar
      const yStar = tA + mA * xStar;
      const k = rng.pick(range(1, 6).filter(v => v !== xStar));
      const hStd = v => (v === 1 ? "1 Stunde" : `${v} Stunden`);
      const costA = tA + mA * k, costB = tB + mB * k;
      const cheaper = costA < costB ? "A" : "B";
      return {
        q: rich(`${name} kann mit zwei Tarifen genutzt werden. Tarif A: ${sInt(tA)} € Grundgebühr und ${sInt(mA)} € je Stunde. `
          + `Tarif B: ${sInt(tB)} € Grundgebühr und ${sInt(mB)} € je Stunde. `
          + `a) Bei wie vielen Stunden kosten beide Tarife gleich viel? b) Welcher Tarif ist bei ${hStd(k)} günstiger?`),
        a: rich(`a) Bei ${sInt(xStar)} Stunden kosten beide Tarife ${sInt(yStar)} €. b) Bei ${hStd(k)} ist Tarif ${cheaper} günstiger.`),
        steps: [
          rich("Gleichsetzen: ", sInt(tA), " + ", sInt(mA), " · x = ", sInt(tB), " + ", sInt(mB), " · x"),
          rich("(", sInt(mA), " − ", sInt(mB), ") · x = ", sInt(tB), " − ", sInt(tA)),
          rich(sInt(dm), " · x = ", sInt(tB - tA)),
          rich("x = ", sInt(tB - tA), " : ", sInt(dm), " = ", sInt(xStar)),
          rich("Kosten bei ", sInt(xStar), " Stunden: ", sInt(tA), " + ", sInt(mA), " · ", sInt(xStar), " = ", sInt(yStar), " €"),
          rich("Bei ", hStd(k), ": Tarif A kostet ", sInt(costA), " €, Tarif B kostet ", sInt(costB), " €. Tarif ", cheaper, " ist günstiger."),
        ],
        check: { lvl: 3, xStar, yStar, k, cheaper, tA, mA, tB, mB, dm },
      };
    }
    throw new Error("Schnittpunkt Tarife: keine Werte gefunden");
  }

  AG.registerType({
    id: "m9-schnittpunkt",
    klasse: "9",
    zug: "M",
    lb: "8",
    lbTitle: "Funktionale Zusammenhänge",
    title: "Schnittpunkt zweier Geraden",
    topic: "zuordnung",
    instruction: {
      1: "Berechne den Schnittpunkt rechnerisch durch Gleichsetzen.",
      2: "Lies den Schnittpunkt aus der Skizze ab und prüfe ihn rechnerisch.",
      3: "Berechne, bei welcher Stundenzahl beide Tarife gleich viel kosten, und beantworte die Frage b).",
    },
    merke: [
      "Der ", { b: "Schnittpunkt" }, " zweier Geraden hat für beide Geraden dieselben x- und y-Werte. Durch ", { b: "Gleichsetzen" },
      " der y-Terme erhält man x, dann x in eine Gleichung einsetzen. Beispiel: y = 2x + 1 und y = −x + 4: 2x + 1 = −x + 4, also 3x = 3, x = 1 und y = 3. S(1 | 3).",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return solveTask(rng);
      if (level === 2) return drawTask(rng);
      return tariffTask(rng);
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(t.a);
      if (k.lvl === 3) {
        if (k.xStar * k.dm !== k.tB - k.tA) return "Gleichsetzen falsch";
        if (k.tA + k.mA * k.xStar !== k.yStar) return "Schnittkosten falsch";
        const cheaper = k.k < k.xStar ? "A" : "B";
        return (s.includes(`Bei ${k.xStar} Stunden kosten beide Tarife ${k.yStar} €`) && s.includes(`ist Tarif ${cheaper} günstiger`))
          || `Antwort falsch: „${s}“`;
      }
      const { X, Y, m1, m2, t1, t2 } = k;
      if (m1 * X + t1 !== Y || m2 * X + t2 !== Y) return "Schnittpunkt falsch";
      if (k.lvl === 1) return s === `S(${X} | ${Y})` || `Antwort falsch: „${s}“`;
      return s.includes(`S(${X} | ${Y})`) || `Antwort falsch: „${s}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
