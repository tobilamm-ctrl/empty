// M7/R7 Sachaufgaben: Graphen proportionaler Zuordnungen (LB 8), Terme und Gleichungen aufstellen (LB 7),
// Sachaufgaben mit negativen Zahlen (LB 2), Überschlagen (LB 2). Vier Aufgabentypen in einer Datei.
(function (AG) {
  const { Frac, num, rich, plain, MINUS, fmtDec, fmtInt } = AG;
  const INK = "#1b2130", GRID = "#d0d6e2", BLUE = "#1f3f9e";
  const sign = rng => (rng.chance(0.5) ? -1 : 1);

  // ---------- 1. Graphen proportionaler Zuordnungen ----------
  const X0 = 16, Y0 = 50, PW = 78, PH = 40; // Ursprung und Länge der Achsen in mm (Feld 100 × 60)

  // o: { xMax, yMax, yStep, xl, yl, lines: [{ g, r, color }], legend, marks: [[x, y, color]], guides }
  // Geraden y = g + r·x; Gitterpunkte bei ganzen x und y-Vielfachen von yStep.
  function graphFig(o) {
    const s = AG.sketch(100, 60);
    const sx = PW / o.xMax, sy = PH / o.yMax;
    const X = x => X0 + x * sx, Y = y => Y0 - y * sy;
    for (let x = 0; x <= o.xMax; x++) s.line([X(x), Y(0)], [X(x), Y(o.yMax)], { stroke: GRID, width: 0.2 });
    for (let y = 0; y <= o.yMax; y += o.yStep) s.line([X(0), Y(y)], [X(o.xMax), Y(y)], { stroke: GRID, width: 0.2 });
    // Achsen mit Pfeilspitzen
    s.line([X0 - 2, Y0], [X0 + PW + 3, Y0], { stroke: INK, width: 0.35 });
    s.line([X0, Y0 + 2], [X0, Y0 - PH - 2], { stroke: INK, width: 0.35 });
    s.poly([[X0 + PW + 4, Y0], [X0 + PW + 1.5, Y0 - 1.1], [X0 + PW + 1.5, Y0 + 1.1]], { fill: INK, width: 0.2 });
    s.poly([[X0, Y0 - PH - 3], [X0 - 1.1, Y0 - PH - 0.5], [X0 + 1.1, Y0 - PH - 0.5]], { fill: INK, width: 0.2 });
    // Skalen und Achsenbeschriftung mit Größe und Einheit
    for (let x = 1; x <= o.xMax; x++) s.label([X(x), Y0 + 3.6], String(x), { size: 3, anchor: "middle" });
    for (let y = o.yStep; y <= o.yMax; y += o.yStep) s.label([X0 - 2.2, Y(y)], String(y), { size: 3, anchor: "end" });
    s.label([X0 + PW + 4, Y0 + 7], o.xl, { size: 3, anchor: "end" });
    s.label([X0 + 2.5, Y0 - PH - 5], o.yl, { size: 3, anchor: "start" });
    // Geraden
    for (const L of o.lines) s.line([X(0), Y(L.g)], [X(o.xMax), Y(L.g + L.r * o.xMax)], { stroke: L.color || INK, width: 0.5 });
    (o.legend || []).forEach((L, i) => s.label([X0 + 3, 12 + i * 3.5], L.t, { size: 3, anchor: "start", color: L.color }));
    // Ablesehilfen (nur Lösungsblatt) und markierte Punkte
    for (const [x, y, c] of o.marks || []) {
      if (o.guides) {
        s.line([X(x), Y(y)], [X(x), Y0], { dash: true });
        s.line([X0, Y(y)], [X(x), Y(y)], { dash: true });
      }
      s.circle([X(x), Y(y)], 0.9, { fill: c || INK });
    }
    return s.done();
  }
  // Aufgabenskizze und Lösungsskizze mit denselben Achsen
  function figs(base, marks) {
    return { fig: graphFig(base), aFig: graphFig({ ...base, guides: true, marks }) };
  }

  const CTX_G = [
    { xl: "Menge in kg", yl: "Preis in €", xu: "kg", rates: [2, 3, 4], intro: "Am Obststand kosten Äpfel je kg überall gleich viel. Der Graph zeigt den Preis." },
    { xl: "Menge in kg", yl: "Preis in €", xu: "kg", rates: [4, 5, 6, 7], intro: "Am Erdbeerstand kostet ein kg Erdbeeren immer gleich viel. Der Graph zeigt den Preis." },
    { xl: "Menge in kg", yl: "Preis in €", xu: "kg", rates: [4, 5, 6], intro: "Auf dem Wochenmarkt kosten Kirschen je kg gleich viel. Der Graph zeigt den Preis." },
    { xl: "Länge in m", yl: "Preis in €", xu: "m", rates: [1, 2, 3], intro: "Im Bastelladen kostet das Band pro Meter immer gleich viel. Der Graph zeigt den Preis." },
  ];

  // Niveau 3, Variante Grundgebühr: Grundgebühr g und Preis pro Einheit r, verschiedene Kontexte
  const CTX_FEE = [
    { xl: "Zeit in h", xu: "h", intro: (g, r) => `Ein Fahrradverleih verlangt eine Grundgebühr von ${g} € und danach ${r} € pro Stunde.` },
    { xl: "Strecke in km", xu: "km", intro: (g, r) => `Ein Taxi verlangt einen Grundpreis von ${g} € und danach ${r} € pro Kilometer.` },
    { xl: "Datenvolumen in GB", xu: "GB", intro: (g, r) => `Ein Handytarif kostet im Monat eine Grundgebühr von ${g} € und danach ${r} € pro GB.` },
    { xl: "Zeit in h", xu: "h", intro: (g, r) => `Eine Kletterhalle verlangt eine Leihgebühr von ${g} € für das Kletterzeug und danach ${r} € Eintritt pro Stunde.` },
    { xl: "Parkdauer in h", xu: "h", intro: (g, r) => `Ein Parkhaus verlangt eine Einfahrtgebühr von ${g} € und danach ${r} € pro Stunde.` },
  ];

  function genGraph(rng, level) {
    const c = rng.pick(CTX_G);
    if (level < 3) {
      const r = rng.pick(c.rates);
      const base = { xMax: 8, yMax: 8 * r, yStep: r, xl: c.xl, yl: c.yl, lines: [{ g: 0, r }] };
      if (level === 1) {
        const [x1, x2] = rng.shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 2);
        const k = rng.pick([2, 3, 4, 5, 6, 7, 8].filter(v => v !== x1 && v !== x2));
        const marks = [[x1, r * x1], [x2, r * x2], [k, r * k]];
        return {
          q: rich(c.intro, ` Lies am Graphen ab: a) Was kosten ${x1} ${c.xu}? b) Was kosten ${x2} ${c.xu}? c) Welche Menge (in ${c.xu}) bekommt man für ${r * k} €?`),
          a: rich(`a) ${r * x1} €; b) ${r * x2} €; c) ${k} ${c.xu}`),
          steps: [
            rich(`${x1} ${c.xu} → ${r * x1} €`),
            rich(`${x2} ${c.xu} → ${r * x2} €`),
            rich(`${r * k} € → ${k} ${c.xu}`),
          ],
          ...figs(base, marks), inline: false,
          check: { expect: [String(r * x1), String(r * x2), String(k)] },
        };
      }
      // Niveau 2: ablesen und mit dem Dreisatz prüfen
      const x1 = rng.pick([2, 3, 4, 5, 6, 7, 8]);
      const x2 = rng.pick([2, 3, 4, 5, 6, 7, 8].filter(v => v !== x1));
      const p1 = r * x1, p2 = r * x2;
      return {
        q: rich(c.intro, ` a) Lies den Preis für ${x1} ${c.xu} am Graphen ab. b) Berechne mit dem Dreisatz den Preis für ${x2} ${c.xu}. Stimmt er mit dem Graphen überein?`),
        a: rich(`a) ${p1} €; b) ${p2} € – der Graph stimmt überein.`),
        steps: [
          rich(`${x1} ${c.xu} → ${p1} €`),
          rich(`1 ${c.xu} → ${r} €`),
          rich(`${x2} ${c.xu} → ${p2} €`),
        ],
        ...figs(base, [[x1, p1], [x2, p2]]), inline: false,
        check: { expect: [String(p1), String(p2)] },
      };
    }
    // Niveau 3: zwei Angebote oder Graph mit Grundgebühr (nicht proportional), jeweils die Hälfte
    const ax = { xMax: 10, yMax: 50, yStep: 4, xl: "Menge in kg", yl: "Preis in €" };
    const who = rng.pick(["Lena", "Max", "Aylin", "Jonas", "Mia", "Elias"]);
    if (rng.chance(0.5)) {
      const prod = rng.pick([
        { n: "Äpfel", rates: [2, 3, 4] },
        { n: "Erdbeeren", rates: [4, 5] },
        { n: "Kartoffeln", rates: [1, 2, 3] },
      ]);
      let r1, r2;
      do { r1 = rng.pick(prod.rates); r2 = rng.pick(prod.rates); } while (r1 === r2);
      const pA = 8 * r1, pB = 8 * r2, diff = Math.abs(pA - pB);
      const [nA, nB] = rng.pick([["Laden A", "Laden B"], ["Markt Nord", "Markt Süd"], ["Bioladen", "Supermarkt"]]);
      const base = { ...ax, lines: [{ g: 0, r: r1, color: INK }, { g: 0, r: r2, color: BLUE }],
        legend: [{ t: nA, color: INK }, { t: nB, color: BLUE }] };
      const winner = r1 < r2 ? nA : nB;
      return {
        q: rich(`${who} möchte ${prod.n} kaufen. Der Graph zeigt die Preise in zwei Läden (${nA} und ${nB}). a) Was kosten 8 kg in ${nA} und in ${nB}? b) Wie viel spart ${who} bei 8 kg im günstigeren Laden?`),
        a: rich(`a) ${nA}: ${pA} €; ${nB}: ${pB} €. b) ${winner} ist günstiger, man spart ${diff} €.`),
        steps: [
          rich(`${nA}: 8 · ${r1} € = ${pA} €`),
          rich(`${nB}: 8 · ${r2} € = ${pB} €`),
          rich(`${Math.max(pA, pB)} € − ${Math.min(pA, pB)} € = ${diff} €`),
        ],
        ...figs(base, [[8, pA, INK], [8, pB, BLUE]]), inline: false,
        check: { expect: [String(pA), String(pB), String(diff)] },
      };
    }
    const K = rng.pick(CTX_FEE);
    const g = rng.pick([4, 8]), r = rng.pick([1, 2, 3]);
    const P4 = g + 4 * r, P8 = g + 8 * r;
    const q4 = plain(num(new Frac(P4, 4), { as: "dec" })), q8 = plain(num(new Frac(P8, 8), { as: "dec" }));
    const base = { ...ax, xl: K.xl, yl: "Kosten in €", lines: [{ g, r }] };
    return {
      q: rich(`${who} informiert sich. ${K.intro(g, r)} Der Graph zeigt die Kosten. a) Lies die Kosten für 4 ${K.xu} und 8 ${K.xu} ab. b) Ist die Zuordnung proportional? Begründe mit den Quotienten y : x.`),
      a: rich(`a) 4 ${K.xu}: ${P4} €; 8 ${K.xu}: ${P8} €. b) Nicht proportional, denn ${P4} : 4 = ${q4} und ${P8} : 8 = ${q8} sind verschieden.`),
      steps: [
        rich(`4 ${K.xu}: ${g} € + 4 · ${r} € = ${P4} €`),
        rich(`8 ${K.xu}: ${g} € + 8 · ${r} € = ${P8} €`),
        rich(`Quotienten: ${P4} : 4 = ${q4}; ${P8} : 8 = ${q8}`),
      ],
      ...figs(base, [[4, P4, INK], [8, P8, INK]]), inline: false,
      check: { expect: [String(P4), String(P8), "Nicht proportional"] },
    };
  }

  AG.registerType({
    id: "m7-graph-proportional",
    klasse: "7",
    zug: "RM",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Graphen proportionaler Zuordnungen",
    instruction: {
      1: "Lies die Werte am Graphen ab.",
      2: "Lies die Werte am Graphen ab und prüfe die Werte mit dem Dreisatz.",
      3: "Vergleiche die Graphen und begründe deine Antwort.",
    },
    merke: [
      "Der Graph einer proportionalen Zuordnung ist eine Gerade durch den Ursprung. Ablesen: von einem Punkt senkrecht zu den Achsen. Beispiel: 3 kg kosten 12 €, also kostet 1 kg 4 €.",
    ],
    cols: 1,
    levels: [1, 2, 3],
    generate: genGraph,
    verify(t) {
      if (!t.fig || !t.aFig) return "Skizze fehlt";
      const e = t.check && t.check.expect;
      if (!e) return "kein Prüfdatensatz";
      const a = plain(t.a);
      return e.every(s => a.includes(s)) || "Antwort unvollständig: " + a;
    },
  });

  // ---------- 2. Terme und Gleichungen aufstellen ----------
  const TERM_CTX = [
    { s: "Ein Kinoeintritt kostet x €, Popcorn kostet {p} €.", A: "Eintritte", B: "Popcorn" },
    { s: "Ein Heft kostet x €, ein Stift kostet {p} €.", A: "Hefte", B: "Stifte" },
    { s: "Ein Eis kostet x €, eine Waffel kostet {p} €.", A: "Eis", B: "Waffeln" },
  ];

  function genTerm(rng) {
    const ctx = rng.pick(TERM_CTX);
    const n = rng.int(2, 5), m = rng.int(1, 3), p = rng.int(2, 6);
    const term = `${n}x + ${m * p}`;
    return {
      q: rich(`${ctx.s.replace("{p}", String(p))} Gib einen Term für ${n} ${ctx.A} und ${m} ${ctx.B} an.`),
      a: rich("Term: ", term),
      steps: [rich(`${n} · x + ${m} · ${p} (${ctx.B})`), rich("Term: ", term)],
      inline: false,
      check: { term },
    };
  }

  // Eine Gleichungsaufgabe; null, wenn die Zahlen nicht passen (dann neu würfeln)
  function tryEq(rng, level) {
    const kind = level === 2 ? rng.pick(["zahl", "alter"]) : rng.pick(["umfang", "einkauf"]);
    if (kind === "zahl") {
      const a = rng.int(2, 6), x = rng.int(2, 12), b = rng.int(2, 15) * sign(rng);
      const c = a * x + b;
      if (c <= 0) return null;
      const eq = `${a} x ${b > 0 ? "+" : MINUS} ${Math.abs(b)} = ${c}`;
      return {
        q: rich(`Denkt man sich eine Zahl x, multipliziert sie mit ${a} und ${b > 0 ? "addiert" : "subtrahiert"} ${Math.abs(b)}, erhält man ${c}. Stelle eine Gleichung auf und löse sie. Wie heißt die Zahl?`),
        a: rich(`Gleichung: ${eq} ; x = ${x}`),
        steps: [
          rich(eq),
          rich(`| ${b > 0 ? MINUS + " " + b : "+ " + (-b)}`),
          rich(`${a} x = ${c - b}`),
          rich(`| : ${a}`),
          rich(`x = ${x}. Die gesuchte Zahl ist ${x}.`),
        ],
        inline: false,
        check: { lhs: v => a * v + b, rhs: c, sol: x },
      };
    }
    if (kind === "alter") {
      const x = rng.int(8, 14), d = rng.int(18, 30), S = 2 * x + d;
      const eq = `x + (x + ${d}) = ${S}`;
      return {
        q: rich(`Mia ist x Jahre alt. Ihr Vater ist ${d} Jahre älter als sie. Zusammen sind die beiden ${S} Jahre alt. Stelle eine Gleichung auf und löse sie. Wie alt ist Mia?`),
        a: rich(`Gleichung: ${eq} ; x = ${x}`),
        steps: [
          rich(eq),
          rich(`2x + ${d} = ${S}`),
          rich(`| ${MINUS} ${d}`),
          rich(`2x = ${S - d}`),
          rich("| : 2"),
          rich(`x = ${x}. Mia ist ${x} Jahre alt.`),
        ],
        inline: false,
        check: { lhs: v => 2 * v + d, rhs: S, sol: x },
      };
    }
    if (kind === "umfang") {
      const x = rng.int(4, 15), d = rng.int(2, 9), U = 4 * x + 2 * d;
      const eq = `2x + 2 (x + ${d}) = ${U}`;
      return {
        q: rich(`Ein Rechteck ist ${d} cm länger als breit. Sein Umfang beträgt ${U} cm. Die Breite heißt x. Stelle eine Gleichung auf und löse sie. Wie breit ist das Rechteck?`),
        a: rich(`Gleichung: ${eq} ; x = ${x} cm`),
        steps: [
          rich(eq),
          rich(`4x + ${2 * d} = ${U}`),
          rich(`| ${MINUS} ${2 * d}`),
          rich(`4x = ${U - 2 * d}`),
          rich("| : 4"),
          rich(`x = ${x} cm. Das Rechteck ist ${x} cm breit.`),
        ],
        inline: false,
        check: { lhs: v => 2 * v + 2 * (v + d), rhs: U, sol: x },
      };
    }
    // einkauf: Klammer in der Gleichung
    const s = rng.int(2, 4), h = rng.int(1, 3), x = rng.int(2, 9), d = rng.int(1, 3);
    const T = s * x + h * (x + d);
    const eq = `${s} x + ${h} (x + ${d}) = ${T}`;
    return {
      q: rich(`Ein Stift kostet x €. Ein Heft kostet ${d} € mehr. Max kauft ${s} Stifte und ${h} Hefte und zahlt insgesamt ${T} €. Stelle eine Gleichung auf und löse sie. Wie teuer ist ein Stift?`),
      a: rich(`Gleichung: ${eq} ; x = ${x} €`),
      steps: [
        rich(eq),
        rich(`${s + h} x + ${h * d} = ${T}`),
        rich(`| ${MINUS} ${h * d}`),
        rich(`${s + h} x = ${T - h * d}`),
        rich(`| : ${s + h}`),
        rich(`x = ${x}. Ein Stift kostet ${x} €.`),
      ],
      inline: false,
      check: { lhs: v => s * v + h * (v + d), rhs: T, sol: x },
    };
  }

  function genTermOrEq(rng, level) {
    if (level === 1) return genTerm(rng);
    for (let i = 0; i < 500; i++) {
      const t = tryEq(rng, level);
      if (t) return t;
    }
    throw new Error("m7-term-aufstellen: keine Gleichung gefunden");
  }

  AG.registerType({
    id: "m7-term-aufstellen",
    klasse: "7",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    title: "Terme und Gleichungen aufstellen",
    instruction: {
      1: "Stelle für die Sachsituation einen Term mit der Variablen x auf.",
      2: "Stelle eine Gleichung auf und löse sie. Schreibe die Umformungen auf und gib einen Antwortsatz an.",
      3: "Stelle eine Gleichung auf, löse sie und mache einen Antwortsatz. Achte auf die Klammern.",
    },
    merke: [
      "Gleichung aufstellen, dann mit Umformungen lösen: auf beiden Seiten dieselbe Zahl addieren, subtrahieren, mit ihr multiplizieren oder durch sie teilen. Beispiel: 3x + 4 = 19 | − 4 → 3x = 15 | : 3 → x = 5.",
    ],
    cols: 1,
    generate: genTermOrEq,
    verify(t) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      if (c.term) return plain(t.a) === "Term: " + c.term || "Term falsch: " + plain(t.a);
      if (c.lhs(c.sol) !== c.rhs) return "Lösung falsch";
      return plain(t.a).includes("x = " + c.sol) || "Antwort falsch: " + plain(t.a);
    },
  });

  // ---------- 3. Sachaufgaben mit negativen Zahlen ----------
  const CTX_NEG = [
    {
      lo: -500, hi: 2000, sLo: -200, sHi: 1500, step: 300, money: true, unit: " €",
      n: v => fmtDec(v, v.isInt() ? 0 : 2),
      start: s => `Lenas Konto steht auf ${s}.`,
      at: s => `Heute steht Lenas Konto auf ${s}.`,
      act: (sg, a, dat) => (sg > 0 ? (dat ? "einer Einzahlung von " : "eine Einzahlung von ") : (dat ? "einer Abhebung von " : "eine Abhebung von ")) + a,
      endS: s => `beträgt der Kontostand ${s}`,
      before: "Wie hoch war der Kontostand vorher?", ask: "Wie hoch ist der Kontostand jetzt?",
      ansBefore: "Vorher war der Kontostand", ans: "Der Kontostand beträgt ",
      rates: [5, 10, 15, 20, 25].map(v => new Frac(v)),
      rateTxt: (sg, r) => (sg > 0 ? `Lena zahlt jede Woche ${r} auf ihr Konto ein.` : `Lena hebt jede Woche ${r} vom Konto ab.`),
      askK: k => `Wie hoch ist der Kontostand nach ${k} Wochen?`,
    },
    {
      lo: -20, hi: 30, sLo: -8, sHi: 12, step: 6, money: false, unit: " °C",
      n: v => fmtDec(v, v.isInt() ? 0 : 1),
      start: s => `Das Thermometer zeigt am Morgen ${s}.`,
      at: s => `Um 14 Uhr zeigt das Thermometer ${s}.`,
      act: (sg, a, dat) => (sg > 0 ? (dat ? "einem Anstieg um " : "ein Anstieg um ") : (dat ? "einem Rückgang um " : "ein Rückgang um ")) + a,
      endS: s => `zeigt das Thermometer ${s}`,
      before: "Wie warm war es vorher?", ask: "Wie warm ist es jetzt?",
      ansBefore: "Vorher war es", ans: "Es ist jetzt ",
      rates: [new Frac(1, 2), new Frac(1), new Frac(3, 2), new Frac(2)],
      rateTxt: (sg, r) => (sg > 0 ? `Die Temperatur steigt jede Stunde um ${r}.` : `Die Temperatur sinkt jede Stunde um ${r}.`),
      askK: k => `Wie warm ist es ${k} Stunden später?`,
    },
    {
      lo: -40, hi: 0, sLo: -30, sHi: 0, step: 6, money: false, unit: " m",
      n: v => fmtDec(v, 0),
      start: s => `Ein Taucher befindet sich auf ${s} (Meeresspiegel: 0 m).`,
      act: (sg, a, dat) => (sg > 0 ? (dat ? "einem Aufstieg um " : "ein Aufstieg um ") : (dat ? "einem Abstieg um " : "ein Abstieg um ")) + a,
      endS: s => `ist der Taucher auf ${s}`,
      before: "Auf welcher Tiefe war der Taucher vorher?", ask: "Auf welcher Tiefe ist der Taucher jetzt?",
      ansBefore: "Vorher war der Taucher auf", ans: "Der Taucher ist jetzt auf ",
    },
    {
      lo: -2, hi: 10, sLo: -2, sHi: 8, step: 4, money: false, unit: "",
      n: v => fmtInt(v),
      start: s => `Der Aufzug steht auf Ebene ${s}.`,
      act: (sg, a, dat) => `${dat ? "einer" : "eine"} Fahrt um ${a} ${a === "1" ? "Stockwerk" : "Stockwerke"} ${sg > 0 ? "nach oben" : "nach unten"}`,
      endS: s => `hält der Aufzug auf Ebene ${s}`,
      before: "Auf welcher Ebene stand der Aufzug vorher?", ask: "Auf welcher Ebene hält der Aufzug jetzt?",
      ansBefore: "Vorher stand der Aufzug auf Ebene", ans: "Der Aufzug hält jetzt auf Ebene ",
    },
  ];

  const inRange = (f, ctx) => { const v = f.n / f.d; return v >= ctx.lo && v <= ctx.hi; };
  const sgnOf = f => (f.n > 0 ? 1 : -1);

  // Start, n Änderungen (vorzeichenbehaftet) und Endstand; alle Zwischenstände im Bereich
  function chain(rng, ctx, n, dec) {
    for (let t = 0; t < 300; t++) {
      const start = dec ? new Frac(5 * rng.int(ctx.sLo * 20, ctx.sHi * 20), 100) : new Frac(rng.int(ctx.sLo, ctx.sHi));
      let cur = start, ok = true;
      const ch = [], vals = [];
      for (let i = 0; i < n && ok; i++) {
        const mag = dec ? new Frac(5 * rng.int(2, 60), 100) : new Frac(rng.int(1, ctx.step));
        const x = sign(rng) > 0 ? mag : mag.neg();
        cur = cur.add(x);
        if (!inRange(cur, ctx)) ok = false;
        ch.push(x); vals.push(cur);
      }
      if (ok) return { start, ch, vals, final: cur };
    }
    throw new Error("m7-sach-rationale-zahlen: keine Aufgabe gefunden");
  }

  // Multiplikation: Rate pro Stunde bzw. Woche mal Anzahl, dann Startwert ± Ergebnis
  function multi(rng, ctx, full) {
    for (let t = 0; t < 300; t++) {
      const r = rng.pick(ctx.rates), k = rng.int(2, 6), sg = sign(rng);
      const start = ctx.money ? new Frac(rng.int(-100, 1500)) : new Frac(rng.int(-8, 12));
      const kr = r.mul(k);
      const fin = sg > 0 ? start.add(kr) : start.sub(kr);
      if (!inRange(fin, ctx)) continue;
      return {
        q: rich(ctx.at(full(start)), " ", ctx.rateTxt(sg, full(r)), " ", ctx.askK(k)),
        a: rich(ctx.ans, full(fin), "."),
        steps: [
          rich(`${k} · ${full(r)} = ${full(kr)}`),
          rich(`${full(start)} ${sg > 0 ? "+" : MINUS} ${full(kr)} = ${full(fin)}`),
        ],
        inline: false,
        check: { s: full(fin) },
      };
    }
    throw new Error("m7-sach-rationale-zahlen: keine Multiplikationsaufgabe gefunden");
  }

  function genNeg(rng, level) {
    const ctx = rng.pick(CTX_NEG);
    const full = v => ctx.n(v) + ctx.unit;
    if (level === 3 && ctx.rates && rng.chance(0.5)) return multi(rng, ctx, full);
    const dec = level > 1 && ctx.money;
    if (level === 3) {
      // Rückwärtsrechnen: Endstand und Änderung gegeben, Anfangswert gesucht
      const c = chain(rng, ctx, 1, dec), x = c.ch[0];
      return {
        q: rich(`Nach ${ctx.act(sgnOf(x), full(x.abs()), true)} ${ctx.endS(full(c.final))}. ${ctx.before}`),
        a: rich(`${ctx.ansBefore} ${full(c.start)}.`),
        steps: [rich(`${full(c.final)} ${x.n > 0 ? MINUS : "+"} ${full(x.abs())} = ${full(c.start)}`)],
        inline: false,
        check: { s: full(c.start) },
      };
    }
    const c = chain(rng, ctx, level === 1 ? 1 : rng.int(2, 3), dec);
    let prev = c.start;
    const steps = c.ch.map((x, i) => {
      const r = rich(`${full(prev)} ${x.n > 0 ? "+" : MINUS} ${full(x.abs())} = ${full(c.vals[i])}`);
      prev = c.vals[i];
      return r;
    });
    return {
      q: rich([ctx.start(full(c.start)), ...c.ch.map(x => ` Dann folgt ${ctx.act(sgnOf(x), full(x.abs()), false)}.`), ` ${ctx.ask}`]),
      a: rich(ctx.ans, full(c.final), "."),
      steps,
      inline: false,
      check: { s: full(c.final) },
    };
  }

  AG.registerType({
    id: "m7-sach-rationale-zahlen",
    klasse: "7",
    zug: "RM",
    lb: "2",
    lbTitle: "Rationale Zahlen – Rechenregeln",
    title: "Sachaufgaben mit negativen Zahlen",
    instruction: {
      1: "Rechne mit den Vorzeichen. Schreibe am Ende einen Antwortsatz.",
      2: "Rechne Schritt für Schritt mit den Vorzeichen. Schreibe am Ende einen Antwortsatz.",
      3: "Rechne mit den Vorzeichen. Achte auf die Reihenfolge der Rechnungen und schreibe einen Antwortsatz.",
    },
    merke: [
      "Guthaben und Höhen über null sind positiv, Schulden und Tiefen sind negativ. Eine Zunahme wird addiert, eine Abnahme ist Addition einer negativen Zahl. Beispiel: −500 € + 250 € = −250 €.",
    ],
    cols: 1,
    generate: genNeg,
    verify(t) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      return plain(t.a).includes(c.s) || "Antwort ohne " + c.s;
    },
  });

  // ---------- 4. Überschlagen ----------
  const OPS = { "+": (a, b) => a.add(b), "-": (a, b) => a.sub(b), "*": (a, b) => a.mul(b), "/": (a, b) => a.div(b) };
  const OPSYM = { "+": " + ", "-": " " + MINUS + " ", "*": " · ", "/": " : " };

  // Auf eine geltende Ziffer runden (48,7 → 50; 396 → 400; 7,9 → 8; 0,34 → 0,3)
  function estimate(f) {
    if (f.n === 0) return f;
    const a = Math.abs(f.n / f.d);
    const mag = 10 ** Math.floor(Math.log10(a));
    const k = Math.round(a / mag);
    const r = mag >= 1 ? new Frac(k * mag) : new Frac(k, Math.round(1 / mag));
    return f.n < 0 ? r.neg() : r;
  }

  // Zahl im Ausdruck; ab dem zweiten Glied negative Zahlen in Klammern
  const opnd = (f, first) => num(f, { as: "dec", paren: !first });
  // Ausdruck links nach rechts (Rangfolge wird vorher geprüft)
  function exprRich(vals, ops) {
    const parts = [opnd(vals[0], true)];
    ops.forEach((o, i) => parts.push(OPSYM[o], opnd(vals[i + 1], false)));
    return rich(parts);
  }
  function evalLeft(vals, ops) {
    let r = vals[0];
    ops.forEach((o, i) => { r = OPS[o](r, vals[i + 1]); });
    return r;
  }

  // krumme Zahl: ganz (11–499) oder mit einer Nachkommastelle, nie schon rund (Rundung ändert sie)
  function krumm(rng) {
    for (;;) {
      const v = rng.chance(0.5) ? new Frac(rng.int(11, 499)) : new Frac(rng.int(11, 499), 10);
      if (!estimate(v).eq(v)) return rng.chance(0.5) ? v.neg() : v;
    }
  }

  function genCalc(rng, level) {
    const n = level === 1 ? 2 : 3;
    for (let i = 0; i < 3000; i++) {
      const vals = [];
      for (let j = 0; j < n; j++) vals.push(krumm(rng));
      const ops = [];
      for (let j = 1; j < n; j++) ops.push(level === 1 ? rng.pick(["*", "/"]) : rng.pick(["+", "-", "*"]));
      if (level > 1 && ops[0] !== "*" && ops[1] === "*") continue; // sonst nicht links nach rechts
      const E = evalLeft(vals.map(estimate), ops);
      if (!E.isTerminating()) continue;
      const X = evalLeft(vals, ops);
      const xv = X.valueOf(), ev = E.valueOf();
      if (!(Math.abs(xv) >= 1)) continue; // Ergebnisse nahe 0 sind für den Überschlag ungeeignet
      if (!(Math.abs(ev - xv) / Math.abs(xv) <= 0.25)) continue; // Überschlag höchstens ca. 25 % daneben
      const estRich = exprRich(vals.map(estimate), ops);
      const Es = plain(num(E, { as: "dec" })), Xs = X.isTerminating() ? plain(num(X, { as: "dec" })) : null;
      if (level === 1) {
        return {
          q: rich("Überschlage: ", exprRich(vals, ops)),
          a: rich("≈ ", num(E, { as: "dec" })),
          steps: [rich("≈ ", estRich, " = ", num(E, { as: "dec" }))],
          check: { E: Es, Ef: ev, X: Xs, Xf: xv },
        };
      }
      if (level === 2) {
        return {
          q: rich("Überschlage: ", exprRich(vals, ops)),
          a: rich("≈ ", num(E, { as: "dec" })),
          steps: [rich("≈ ", estRich, " = ", num(E, { as: "dec" }))],
          check: { E: Es, Ef: ev, X: Xs, Xf: xv },
        };
      }
      if (!X.isTerminating() || X.decimals() > 2) continue;
      return {
        q: rich("Überschlage zuerst und rechne dann genau: ", exprRich(vals, ops)),
        a: rich("≈ ", num(E, { as: "dec" }), "; genau: ", num(X, { as: "dec" })),
        steps: [
          rich("≈ ", estRich, " = ", num(E, { as: "dec" })),
          rich("genau: ", exprRich(vals, ops), " = ", num(X, { as: "dec" })),
        ],
        check: { E: Es, Ef: ev, X: Xs, Xf: xv },
      };
    }
    throw new Error("m7-ueberschlag: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m7-ueberschlag",
    klasse: "7",
    zug: "RM",
    lb: "2",
    lbTitle: "Rationale Zahlen – Rechenregeln",
    title: "Überschlagen",
    instruction: {
      1: "Überschlage das Ergebnis. Runde jede Zahl auf eine geltende Ziffer.",
      2: "Überschlage das Ergebnis. Runde jede Zahl auf eine geltende Ziffer.",
      3: "Überschlage zuerst, rechne dann genau und vergleiche.",
    },
    merke: [
      "Beim Überschlagen rundet man jede Zahl auf eine geltende Ziffer und rechnet mit den gerundeten Zahlen. Beispiel: −48,7 · 3,1 ≈ −50 · 3 = −150.",
    ],
    cols: 2,
    generate: genCalc,
    verify(t, level) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      const a = plain(t.a);
      if (!a.startsWith("≈ " + c.E)) return "Überschlag falsch: " + a;
      if (!(Math.abs(c.Ef - c.Xf) / Math.abs(c.Xf) <= 0.25)) return "Überschlag weicht mehr als 25 % ab";
      if (level === 3 && !a.includes("; genau: " + c.X)) return "genaues Ergebnis falsch: " + a;
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
