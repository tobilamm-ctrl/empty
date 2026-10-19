// M10 LB 6: Wahrscheinlichkeit und Kombinatorik – Pfadregeln, Baumdiagramme ergänzen,
// Anordnungen und Auswahl mit Reihenfolge, Gegenereignis „mindestens einmal“.
// Typen: m10-pfadregeln, m10-baum-ergaenzen, m10-permutationen, m10-gegenereignis-mindestens (alle M).
(function (AG) {
  const { Frac, num, rich, plain, fmtDec, fmtInt, gcd, lcm } = AG;
  const INK = AG.SKETCH_COLORS.INK;

  // ---------- Hilfen ----------
  const one = x => new Frac(1).sub(x);                                   // 1 − x
  const powF = (f, k) => { let r = new Frac(1); for (let i = 0; i < k; i++) r = r.mul(f); return r; };
  const joinSegs = (items, sep) => { const out = []; items.forEach((x, i) => { if (i) out.push(sep); out.push(x); }); return rich(out); };
  // Prozentwert: genau, wenn höchstens zwei Nachkommastellen, sonst ≈ mit einer Nachkommastelle
  const exactPct = f => { const p = f.mul(100); return p.decimals() <= 2 ? fmtDec(p) + " %" : null; };
  const approxPct = f => exactPct(f) || fmtDec(new Frac(Math.round((f.n * 1000) / f.d), 10), 1) + " %";
  // Bruch mit Prozent („15/64 ≈ 23,4 %“, „3/8 = 37,5 %“)
  const chanceRich = f => rich(num(f), " " + (exactPct(f) ? "=" : "≈") + " " + approxPct(f));
  // Dezimalzahl mit Prozent („0,18 = 18 %“)
  const decChance = f => rich(fmtDec(f), " " + (exactPct(f) ? "=" : "≈") + " " + approxPct(f));
  // Rohbruch (ohne Kürzen), danach gekürzt, falls sich etwas kürzt
  const rawRich = (N, D) => { const f = new Frac(N, D); return gcd(N, D) > 1 ? rich({ f: [N, D] }, " = ", num(f)) : rich({ f: [N, D] }); };

  // Summe mehrerer Pfade: Brüche auf gemeinsamen Nenner bringen, dann kürzen
  function sumSteps(ps, f) {
    const L = ps.reduce((a, p) => lcm(a, p.d), 1);
    const N = ps.reduce((a, p) => a + p.n * (L / p.d), 0);
    const head = rich("P(E) = ", joinSegs(ps.map(p => num(p)), " + "));
    if (gcd(N, L) === 1) return [rich(head, " = ", chanceRich(f))];
    return [rich(head, " = ", { f: [N, L] }), rich("= ", chanceRich(f))];
  }

  // Baumdiagramm mit depth Stufen; Pfadenden in der letzten Spalte.
  // branch(path, j): Beschriftung des Astes vom Knoten path (Indizes) zum Kind j;
  // leafName(path): Name des Pfadendes (path: Indizes von der Wurzel bis zum Ende).
  function treeFig(depth, branch, leafName) {
    const W = 150, H = depth === 3 ? 96 : 60;            // dreistufig höher, damit die Astbeschriftungen Platz haben
    const s = AG.sketch(W, H);
    const xs = i => 9 + (i * (W - 46)) / depth;
    const nL = 2 ** depth;
    const ly = k => 6 + (k * (H - 12)) / (nL - 1);
    const pos = (i, m) => {
      const span = 2 ** (depth - i);
      let sum = 0;
      for (let k = m * span; k < (m + 1) * span; k++) sum += ly(k);
      return [xs(i), sum / span];
    };
    s.circle(pos(0, 0), 0.9, { fill: INK });
    const rec = (i, m, path) => {
      if (i === depth) return;
      const p = pos(i, m);
      for (let j = 0; j < 2; j++) {
        const cm = 2 * m + j, c = pos(i + 1, cm);
        s.line(p, c);
        const up = c[1] <= p[1];
        s.label([(p[0] + c[0]) / 2, (p[1] + c[1]) / 2 + (up ? -3.4 : 3.4)], branch(path, j));
        s.circle(c, 0.9, { fill: INK });
        if (i + 1 === depth) s.label([c[0] + 3, c[1]], leafName(path.concat(j)), { anchor: "start" });
        rec(i + 1, cm, path.concat(j));
      }
    };
    rec(0, 0, []);
    return s.done();
  }

  // ======================================================================
  // 1. Pfadregeln (Urne, mit und ohne Zurücklegen)
  // ======================================================================
  const L2 = ["R", "B"];
  // Urne mit r roten und b blauen Kugeln; Wahrscheinlichkeit einer Ziehung nach einem Präfix
  function urnModel(r, b, mit) {
    const T = r + b;
    const remain = prefix => {
      let R = r, B = b;
      if (!mit) for (const ch of prefix) { if (ch === "R") R--; else B--; }
      return { R, B };
    };
    const stage = (prefix, ch) => {
      const { R, B } = remain(prefix);
      return new Frac(ch === "R" ? R : B, mit ? T : T - prefix.length);
    };
    return { stage };
  }
  // alle Pfade der Länge k: Name, Wahrscheinlichkeiten der Äste, Produkt
  function urnPaths(m, k) {
    const out = [];
    for (let code = 0; code < 2 ** k; code++) {
      let name = "";
      for (let s = 0; s < k; s++) name += (code >> (k - 1 - s)) & 1 ? "B" : "R";
      const stages = [];
      for (let s = 0; s < k; s++) stages.push(m.stage(name.slice(0, s), name[s]));
      const p = stages.reduce((a, f) => a.mul(f), new Frac(1));
      out.push({ name, stages, p });
    }
    return out;
  }
  const PFAD_EV = {
    1: [
      { t: "Zuerst eine rote und danach eine blaue Kugel", names: ["RB"] },
      { t: "Zweimal eine rote Kugel", names: ["RR"] },
      { t: "Zweimal eine blaue Kugel", names: ["BB"] },
      { t: "Zuerst eine blaue und danach eine rote Kugel", names: ["BR"] },
    ],
    2: [
      { t: "Beide Kugeln sind rot", names: ["RR"] },
      { t: "Genau eine Kugel ist rot", names: ["RB", "BR"] },
      { t: "Beide Kugeln haben dieselbe Farbe", names: ["RR", "BB"] },
      { t: "Die zweite Kugel ist blau", names: ["RB", "BB"] },
      { t: "Die erste Kugel ist rot", names: ["RR", "RB"] },
    ],
    3: [
      { t: "Genau zwei Kugeln sind rot", names: ["RRB", "RBR", "BRR"] },
      { t: "Alle drei Kugeln sind rot", names: ["RRR"] },
      { t: "Alle drei Kugeln haben dieselbe Farbe", names: ["RRR", "BBB"] },
      { t: "Die ersten beiden Kugeln sind rot", names: ["RRR", "RRB"] },
    ],
  };

  function pfadTask(rng, level) {
    const k = level === 3 ? 3 : 2, mit = level === 1 || (level === 3 && rng.chance(0.5));
    const T = level === 3 ? rng.pick([4, 5, 6, 8]) : rng.pick([6, 8, 10, 12]);
    const r = rng.int(2, T - 2), b = T - r;
    const m = urnModel(r, b, mit);
    const paths = urnPaths(m, k);
    const pool = PFAD_EV[level].filter(e => e.names.every(nm => paths.some(x => x.name === nm && x.p.n > 0)));
    const E = rng.pick(pool);
    const sel = paths.filter(x => E.names.includes(x.name));
    const f = sel.reduce((a, x) => a.add(x.p), new Frac(0));

    const pathStep = x => {
      const N = x.stages.reduce((a, s) => a * s.n, 1), D = x.stages.reduce((a, s) => a * s.d, 1);
      return rich("Pfad ", x.name, ": ", joinSegs(x.stages.map(s => num(s)), " · "), " = ", rawRich(N, D));
    };
    const steps = sel.map(pathStep);
    if (sel.length === 1) steps.push(rich("P(E) = ", chanceRich(f)));
    else steps.push(...sumSteps(sel.map(x => x.p), f));

    const intro = `In einer Urne liegen ${r} rote und ${b} blaue Kugeln. Ein Kind zieht ${k} Kugeln nacheinander, ohne hinzuschauen. ` +
      (mit ? "Die Kugel wird nach jedem Zug wieder zurückgelegt. " : "Die gezogene Kugel wird nicht zurückgelegt. ");
    const fig = treeFig(k,
      (path, j) => L2[j] + ": " + plain(num(m.stage(path.map(i => L2[i]).join(""), L2[j]))),
      path => path.map(i => L2[i]).join(""));
    return {
      q: rich(intro, "Das Baumdiagramm zeigt die Wahrscheinlichkeiten (R: rote Kugel, B: blaue Kugel). Ereignis E: ",
        E.t, ". Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(f), steps, fig, inline: false,
      meta: { n: f.n, d: f.d, sumAll: paths.reduce((a, x) => a.add(x.p), new Frac(0)).eq(1) },
    };
  }

  AG.registerType({
    id: "m10-pfadregeln",
    klasse: "10",
    zug: "M",
    lb: "6",
    lbTitle: "Wahrscheinlichkeit und Kombinatorik",
    title: "Pfadregeln im Baumdiagramm",
    topic: "daten",
    instruction: {
      1: "Berechne P(E) mit der Pfadregel. Gib das Ergebnis als gekürzten Bruch und in Prozent an.",
      2: "Berechne P(E) mit den Pfadregeln. Gib das Ergebnis als gekürzten Bruch und in Prozent an. Prozentwerte mit ≈ sind auf eine Nachkommastelle gerundet.",
      3: "Berechne P(E): Multipliziere entlang der Pfade und addiere die Pfade des Ereignisses. Gib das Ergebnis als gekürzten Bruch und in Prozent an.",
    },
    merke: [
      "Pfadregeln: Entlang eines Pfades werden die Wahrscheinlichkeiten ", { b: "multipliziert" },
      ", die Pfade eines Ereignisses werden ", { b: "addiert" }, ". ",
      "Beispiel: Urne mit 3 roten und 5 blauen Kugeln, mit Zurücklegen: P(RB) = ", { f: [3, 8] }, " · ", { f: [5, 8] },
      " = ", { f: [15, 64] }, " ≈ 23,4 %.",
    ],
    cols: 1,
    generate: pfadTask,
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      if (!m.sumAll) return "Pfadwahrscheinlichkeiten summieren sich nicht zu 1";
      return plain(t.a) === plain(chanceRich(new Frac(m.n, m.d))) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });

  // ======================================================================
  // 2. Baumdiagramm ergänzen (fehlende Wahrscheinlichkeiten mit „?“)
  // ======================================================================
  // Sachkontexte mit plausiblen Bereichen in Prozent: a = P(A), b = P(B) nach A, c = P(B) nach nicht A
  const CTX_BAUM = [
    { t: "Wetterprognose für das Wochenende. Ereignis A: Am Freitag regnet es. Ereignis B: Am Samstag regnet es.",
      a: [20, 60], b: [50, 80], c: [10, 40] },
    { t: "Lena fährt mit dem Bus zur Schule. Ereignis A: Der Bus kommt pünktlich an. Ereignis B: Lena ist zur ersten Stunde pünktlich.",
      a: [70, 95], b: [90, 95], c: [30, 60] },
    { t: "Beim Elfmeter: Ereignis A: Der Schütze zielt in die linke Ecke. Ereignis B: Der Torwart hält den Ball.",
      a: [30, 60], b: [10, 30], c: [10, 30] },
    { t: "Ein Fahrradladen prüft gebrauchte Räder. Ereignis A: Das Rad ist älter als fünf Jahre. Ereignis B: Die Bremsen müssen erneuert werden.",
      a: [30, 60], b: [50, 80], c: [10, 30] },
  ];
  // Knoten: "" = Start, "0" = nach A, "1" = nach nA; Äste: Name je Kind
  const NAMES = { "": ["A", "nA"], "0": ["B", "nB"], "1": ["B", "nB"] };
  const WHERE = { "": "Am Startknoten", "0": "Am Knoten A", "1": "Am Knoten nA" };
  const PATHN = { "00": "A und B", "01": "A und nicht B", "10": "nicht A und B", "11": "nicht A und nicht B" };
  const LEAF = path => (path[0] ? "nA" : "A") + ", " + (path[1] ? "nB" : "B");

  function baumTask(rng, level) {
    const C = rng.pick(CTX_BAUM), txt = C.t;
    // Niveau 1 in Zehnteln, sonst in Schritten von 5 % innerhalb des Bereichs
    const val = ([lo, hi]) => {
      const st = level === 1 ? 10 : 5, a0 = Math.ceil(lo / st), a1 = Math.max(a0, Math.floor(hi / st));
      return new Frac(rng.int(a0, a1) * st, 100);
    };
    const pA = val(C.a), q1 = val(C.b), q2 = val(C.c);
    const nodes = { "": [pA, one(pA)], "0": [q1, one(q1)], "1": [q2, one(q2)] };
    const keys = ["", "0", "1"];
    const partial = level === 1 ? [rng.pick(keys)] : level === 2 ? rng.shuffle(keys).slice(0, 2).sort() : keys;
    const miss = {};
    partial.forEach(k => { miss[k] = rng.int(0, 1); });

    const EVS = level === 3
      ? [
        { t: "B tritt ein", names: ["00", "10"] },
        { t: "B tritt nicht ein", names: ["01", "11"] },
        { t: "genau eines der beiden Ereignisse A und B tritt ein", names: ["01", "10"] },
      ]
      : ["00", "01", "10", "11"].map(nm => ({ t: PATHN[nm], names: [nm] }));
    const E = rng.pick(EVS);
    const pathP = nm => nodes[""][+nm[0]].mul(nodes[nm[0]][+nm[1]]);
    const ps = E.names.map(pathP);
    const f = ps.reduce((a, p) => a.add(p), new Frac(0));
    // gegebene Größen auch im Aufgabentext (Barrierefreiheit), fehlende mit „?“
    const bed = ["", "0", "1"].flatMap(key => NAMES[key].map((nm, j) =>
      "P(" + nm + (key === "" ? "" : " | " + (key === "0" ? "A" : "nA")) + ") = " + (miss[key] === j ? "?" : fmtDec(nodes[key][j]))));

    const fig = treeFig(2, (path, j) => {
      const key = path.join("");
      return NAMES[key][j] + ": " + (miss[key] === j ? "?" : fmtDec(nodes[key][j]));
    }, LEAF);
    const aFig = treeFig(2, (path, j) => {
      const key = path.join("");
      return NAMES[key][j] + ": " + fmtDec(nodes[key][j]);
    }, LEAF);

    const steps = [];
    partial.forEach(k => {
      const j = miss[k];
      steps.push(rich(WHERE[k], ": ", NAMES[k][j], " = 1 − ", fmtDec(nodes[k][1 - j]), " = ", fmtDec(nodes[k][j])));
    });
    if (E.names.length === 1) {
      const nm = E.names[0];
      steps.push(rich("P(E) = ", fmtDec(nodes[""][+nm[0]]), " · ", fmtDec(nodes[nm[0]][+nm[1]]), " = ", decChance(f)));
    } else {
      E.names.forEach((nm, i) => {
        steps.push(rich("P(", PATHN[nm], ") = ", fmtDec(nodes[""][+nm[0]]), " · ", fmtDec(nodes[nm[0]][+nm[1]]), " = ", fmtDec(ps[i])));
      });
      steps.push(rich("P(E) = ", joinSegs(ps.map(p => fmtDec(p)), " + "), " = ", decChance(f)));
    }

    return {
      q: rich(txt, " nA bedeutet „nicht A“, nB bedeutet „nicht B“. Im Baumdiagramm fehlen Wahrscheinlichkeiten (?). ",
        "Ergänze das Baumdiagramm und berechne P(E). Ereignis E: ", E.t, "."),
      a: decChance(f), steps, fig, aFig, inline: false,
      key: [txt, E.t, ...keys.map(k => fmtDec(nodes[k][0]) + "/" + (k in miss ? miss[k] : "-"))].join("|"),   // Werte stehen nur im Baum
      meta: { n: f.n, d: f.d },
    };
  }

  AG.registerType({
    id: "m10-baum-ergaenzen",
    klasse: "10",
    zug: "M",
    lb: "6",
    lbTitle: "Wahrscheinlichkeit und Kombinatorik",
    title: "Baumdiagramm ergänzen",
    topic: "daten",
    instruction: {
      1: "Ergänze den fehlenden Wert im Baumdiagramm und berechne P(E) als Dezimalzahl und in Prozent.",
      2: "Ergänze die fehlenden Werte im Baumdiagramm und berechne P(E) als Dezimalzahl und in Prozent.",
      3: "Ergänze alle fehlenden Werte. Berechne P(E) über die Pfade des Ereignisses und gib das Ergebnis als Dezimalzahl und in Prozent an.",
    },
    merke: [
      "An jeder Verzweigung ist die Summe der Wahrscheinlichkeiten ", { b: "1" }, ". Entlang eines Pfades werden die Wahrscheinlichkeiten ",
      { b: "multipliziert" }, ", die Pfade eines Ereignisses ", { b: "addiert" }, ". ",
      "Beispiel: 0,6 · 0,5 = 0,3 = 30 %.",
    ],
    cols: 1,
    generate: baumTask,
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      return plain(t.a) === plain(decChance(new Frac(m.n, m.d))) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });

  // ======================================================================
  // 3. Anordnungen (n!), Auswahl mit Reihenfolge, Zahlenschloss / PIN (nᵏ)
  // ======================================================================
  const FACT = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const ORD = ["erste", "zweite", "dritte", "vierte"];
  const down = (n, cnt) => Array.from({ length: cnt }, (_, i) => n - i);

  // Niveau 1: alle Elemente in einer Reihe, n!
  const PERM1 = [
    { q: n => `Auf einer Bank sitzen ${n} Kinder nebeneinander. Auf wie viele verschiedene Arten können sie sich setzen?`, u: "Sitzordnungen" },
    { q: n => `Für ein Gruppenfoto stellen sich ${n} Kinder in einer Reihe auf. Wie viele verschiedene Aufstellungen sind möglich?`, u: "Aufstellungen" },
    { q: n => `Auf einer Playlist stehen ${n} verschiedene Lieder. Wie viele verschiedene Reihenfolgen gibt es, um alle Lieder genau einmal abzuspielen?`, u: "Reihenfolgen" },
    { q: n => `In einem Regal stehen ${n} verschiedene Bücher nebeneinander. Auf wie viele Arten lassen sich die Bücher anordnen?`, u: "Anordnungen" },
    { q: n => `An einer Garderobe hängen ${n} verschiedene Jacken nebeneinander. Wie viele Reihenfolgen sind möglich?`, u: "Reihenfolgen" },
    { q: n => `Eine Staffel besteht aus ${n} Läufern, die alle nacheinander laufen. Wie viele verschiedene Reihenfolgen der Läufer gibt es?`, u: "Reihenfolgen" },
    { q: n => `Ein Trainer hat ${n} Spieler und stellt sie für ein Foto in einer Reihe auf. Wie viele Möglichkeiten gibt es?`, u: "Möglichkeiten" },
    { q: n => `Bei einer Schulaufführung treten ${n} Klassen nacheinander auf. Wie viele verschiedene Reihenfolgen der Auftritte sind möglich?`, u: "Reihenfolgen" },
    { q: n => `Ein Kind legt ${n} verschiedene Bausteine in eine Reihe. Wie viele verschiedene Reihenfolgen gibt es?`, u: "Reihenfolgen" },
    { q: n => `Auf einer Bühne stehen ${n} Sänger in einer Reihe. Auf wie viele Arten können sie sich nebeneinander aufstellen?`, u: "Aufstellungen" },
  ];
  // Niveau 2: k von n Personen bzw. Dingen, Reihenfolge wichtig, ohne Wiederholung
  const SEL2 = [
    { k: 2, nr: [6, 12], q: n => `In einer Klasse mit ${n} Kindern werden ein Klassensprecher und ein Stellvertreter gewählt. Wie viele Möglichkeiten gibt es für diese beiden Ämter?`, u: "Möglichkeiten" },
    { k: 2, nr: [6, 12], q: n => `Bei einer Verlosung mit ${n} verschiedenen Losen gibt es einen ersten und einen zweiten Preis. Wie viele Möglichkeiten gibt es, die Preise zu verteilen?`, u: "Möglichkeiten" },
    { k: 3, nr: [5, 10], q: n => `Bei einem Wettlauf mit ${n} Läufern gibt es Gold, Silber und Bronze. Wie viele verschiedene Verteilungen der drei Medaillen sind möglich?`, u: "Verteilungen" },
    { k: 3, nr: [5, 10], q: n => `Aus ${n} Kindern werden drei Kinder der Reihe nach zum Vorlesen aufgerufen (erstes, zweites und drittes Kind). Wie viele Möglichkeiten gibt es?`, u: "Möglichkeiten" },
    { k: 3, nr: [5, 10], q: n => `Ein Schülerrat mit ${n} Schülern wählt eine Vorsitzende, einen Kassenwart und einen Schriftführer. Wie viele Besetzungen sind möglich?`, u: "Besetzungen" },
    { k: 4, nr: [5, 11], q: n => `Aus ${n} Schülern wird eine Staffel mit vier Läufern gebildet. Die Reihenfolge der Läufer ist wichtig. Wie viele verschiedene Staffeln sind möglich?`, u: "Staffeln" },
    { k: 4, nr: [5, 11], q: n => `Bei einem Wettbewerb mit ${n} Teams werden die ersten vier Plätze vergeben. Wie viele Platzierungen sind möglich?`, u: "Platzierungen" },
  ];

  function permTask(rng, level) {
    if (level === 1) {
      const n = rng.int(3, 7), tpl = rng.pick(PERM1);
      const F = FACT(n);
      return {
        q: rich(tpl.q(n)), a: rich(fmtInt(F), " ", tpl.u),
        steps: [
          rich("Für die erste Stelle gibt es ", String(n), " Möglichkeiten, für die zweite ", String(n - 1), " usw., für die letzte Stelle 1 Möglichkeit."),
          rich("Anzahl = ", String(n), "! = ", joinSegs(down(n, n).map(x => String(x)), " · "), " = ", fmtInt(F)),
        ],
        inline: false, meta: { res: F },
      };
    }
    if (level === 2) {
      const tpl = rng.pick(SEL2);
      const n = rng.int(tpl.nr[0], tpl.nr[1]), k = tpl.k;
      const parts = down(n, k);
      const res = parts.reduce((a, x) => a * x, 1);
      return {
        q: rich(tpl.q(n)), a: rich(fmtInt(res), " ", tpl.u),
        steps: [
          rich(parts.map((x, i) => x + " Möglichkeiten für die " + ORD[i] + " Stelle").join(", "), "."),
          rich(joinSegs(parts.map(x => String(x)), " · "), " = ", fmtInt(res)),
        ],
        inline: false, meta: { res },
      };
    }
    // Niveau 3: Zahlenschloss / PIN mit Wiederholung, nᵏ; optional mit fester erster Ziffer
    const isPin = rng.chance(0.4);
    const m = isPin ? 10 : rng.pick([10, 6, 5, 7, 8, 9]);
    const k = rng.int(2, 5);
    const lo = m === 10 ? 0 : 1, hi = m === 10 ? 9 : m;
    const digitsTxt = m === 10 ? "den Ziffern 0 bis 9" : `den Ziffern 1 bis ${m}`;
    const noun = isPin ? "PINs" : "Codes";
    const res = m ** k;
    const restr = rng.chance(0.35);
    if (!restr) {
      const q = isPin
        ? `Eine PIN hat ${k} Stellen. Jede Stelle ist eine Ziffer von 0 bis 9, Ziffern dürfen sich wiederholen. Wie viele verschiedene PINs sind möglich?`
        : `Ein Zahlenschloss hat ${k} Scheiben mit ${digitsTxt}. Jede Scheibe zeigt eine Ziffer, Ziffern dürfen sich wiederholen. Wie viele verschiedene Codes sind möglich?`;
      return {
        q: rich(q), a: rich(fmtInt(res), " ", noun),
        steps: [
          rich("Jede der ", String(k), " Stellen hat ", String(m), " Möglichkeiten, die Ziffern dürfen sich wiederholen."),
          rich(joinSegs(Array(k).fill(String(m)), " · "), " = ", String(m), { sup: String(k) }, " = ", fmtInt(res)),
        ],
        inline: false, meta: { res },
      };
    }
    const d = rng.int(lo, hi);
    const resR = m ** (k - 1);                 // erste Stelle festgelegt, die übrigen k − 1 Stellen frei
    const q = isPin
      ? `Eine PIN hat ${k} Stellen. Jede Stelle ist eine Ziffer von 0 bis 9, Ziffern dürfen sich wiederholen. Wie viele dieser PINs beginnen mit der Ziffer ${d}?`
      : `Ein Zahlenschloss hat ${k} Scheiben mit ${digitsTxt}. Ziffern dürfen sich wiederholen. Wie viele dieser Codes beginnen mit der Ziffer ${d}?`;
    return {
      q: rich(q), a: rich(fmtInt(resR), " ", noun),
      steps: [
        rich("Die erste Stelle ist mit der Ziffer ", String(d), " festgelegt: 1 Möglichkeit. Jede der übrigen ", String(k - 1), " Stellen hat ", String(m), " Möglichkeiten."),
        rich("1 · ", joinSegs(Array(k - 1).fill(String(m)), " · "), " = ", fmtInt(resR)),
      ],
      inline: false, meta: { res: resR },
    };
  }

  AG.registerType({
    id: "m10-permutationen",
    klasse: "10",
    zug: "M",
    lb: "6",
    lbTitle: "Wahrscheinlichkeit und Kombinatorik",
    title: "Anordnungen und Reihenfolgen",
    topic: "daten",
    instruction: {
      1: "Berechne die Anzahl der Anordnungen. Alle Elemente werden in einer Reihe angeordnet: n! = n · (n − 1) · … · 1.",
      2: "Berechne die Anzahl. Die Reihenfolge ist wichtig, jede Person kommt höchstens einmal vor.",
      3: "Berechne die Anzahl der Codes. Bei jeder Stelle gibt es dieselbe Anzahl Möglichkeiten; die Ziffern dürfen sich wiederholen.",
    },
    merke: [
      "Anordnungen aller n Elemente in einer Reihe: n! = n · (n − 1) · … · 1. ",
      "Auswahl mit Reihenfolge ohne Wiederholung (k aus n): n · (n − 1) · … (k Faktoren). ",
      "Mit Wiederholung bei k Stellen mit je n Möglichkeiten: n", { sup: "k" }, ". Beispiel: 4 Kinder in einer Reihe: 4! = 24.",
    ],
    cols: 1,
    generate: permTask,
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      return plain(t.a).startsWith(fmtInt(m.res) + " ") ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });

  // ======================================================================
  // 4. Gegenereignis „mindestens einmal“ bei mehrstufigen Versuchen
  // ======================================================================
  const fmtP = (f, dec) => (dec ? num(f, { as: "dec" }) : num(f));
  const ansRich = (f, dec) => (dec ? decChance(f) : chanceRich(f));
  // Jeder Kontext liefert Text (abhängig von n), Gegenereignis, Trefferwahrscheinlichkeit p, Dezimalschreibweise
  const CTX_MIN = [
    rng => {
      const e = rng.pick([
        { w: "eine 6", g: "Kein Wurf ergibt eine 6.", p: [1, 6] },
        { w: "eine gerade Zahl", g: "Kein Wurf ergibt eine gerade Zahl.", p: [1, 2] },
        { w: "eine Zahl größer als 4", g: "Kein Wurf ergibt eine Zahl größer als 4.", p: [1, 3] },
        { w: "eine Primzahl", g: "Kein Wurf ergibt eine Primzahl.", p: [1, 2] },
      ]);
      return { p: new Frac(e.p[0], e.p[1]), dec: false, g: e.g, txt: n => `Ein Würfel wird ${n}-mal geworfen. Ereignis E: Mindestens einmal fällt ${e.w}.` };
    },
    rng => {
      const e = rng.pick([{ w: "Wappen", g: "Kein Wurf zeigt Wappen." }, { w: "Zahl", g: "Kein Wurf zeigt Zahl." }]);
      return { p: new Frac(1, 2), dec: false, g: e.g, txt: n => `Eine Münze wird ${n}-mal geworfen. Ereignis E: Mindestens einmal fällt ${e.w}.` };
    },
    rng => {
      const r = rng.int(2, 6);
      return {
        p: new Frac(r, 10), dec: true, g: "Alle gezogenen Kugeln sind blau.",
        txt: n => `In einer Urne liegen ${r} rote und ${10 - r} blaue Kugeln. Man zieht ${n}-mal nacheinander eine Kugel und legt sie jedes Mal zurück. Ereignis E: Mindestens einmal wird eine rote Kugel gezogen.`,
      };
    },
    rng => {
      const q = rng.pick([20, 30, 40, 60, 70]);
      return {
        p: new Frac(q, 100), dec: true, g: "Er trifft kein einziges Mal.",
        txt: n => `Ein Schütze trifft die Zielscheibe mit einer Wahrscheinlichkeit von ${q} %. Er schießt ${n}-mal. Ereignis E: Er trifft mindestens einmal.`,
      };
    },
    rng => {
      const nf = rng.pick([4, 6, 8]), b = rng.int(1, nf - 1);
      return {
        p: new Frac(b, nf), dec: false, g: "Der Zeiger bleibt bei keinem Dreh auf Blau stehen.",
        txt: n => `Ein Glücksrad hat ${nf} gleich große Felder, davon ${b} blaue. Man dreht das Glücksrad ${n}-mal. Ereignis E: Mindestens einmal bleibt der Zeiger auf Blau stehen.`,
      };
    },
    rng => {
      const k = rng.pick([5, 10]);
      return {
        p: new Frac(1, k), dec: true, g: "Alle Lose sind Nieten.",
        txt: n => `Bei einem Losverkauf ist jedes ${k}. Los ein Gewinn. Man kauft ${n} Lose. Ereignis E: Mindestens ein Los ist ein Gewinn.`,
      };
    },
  ];

  function minTask(rng, level) {
    const ctx = rng.pick(CTX_MIN)(rng);
    const ns = level === 1 ? [2, 3] : level === 2 ? [3, 4] : [4, 5];
    let n = rng.pick(ns);
    if (ctx.dec && n > 3) n = 3;        // Dezimalzahlen bleiben übersichtlich
    const p = ctx.p, pm = one(p), pmn = powF(pm, n), pE = one(pmn);
    const steps = [
      rich("Gegenereignis: ", ctx.g),
      rich("Einmal: P(Gegenereignis) = 1 − ", fmtP(p, ctx.dec), " = ", fmtP(pm, ctx.dec)),
      rich("Bei ", String(n), " Versuchen: P(nicht E) = ", rich("(", fmtP(pm, ctx.dec), ")", { sup: String(n) }), " = ", fmtP(pmn, ctx.dec)),
      rich("P(E) = 1 − ", fmtP(pmn, ctx.dec), " = ", ansRich(pE, ctx.dec)),
    ];
    return {
      q: rich(ctx.txt(n), " Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: ansRich(pE, ctx.dec), steps, inline: false,
      meta: { pa: p.n, pb: p.d, n, dec: ctx.dec },
    };
  }

  AG.registerType({
    id: "m10-gegenereignis-mindestens",
    klasse: "10",
    zug: "M",
    lb: "6",
    lbTitle: "Wahrscheinlichkeit und Kombinatorik",
    title: "Mindestens einmal",
    topic: "daten",
    instruction: {
      1: "Berechne P(E) über das Gegenereignis „keinmal“. Gib das Ergebnis als Bruch bzw. Dezimalzahl und in Prozent an.",
      2: "Berechne P(E) über das Gegenereignis. Gib das Ergebnis als Bruch bzw. Dezimalzahl und in Prozent an.",
      3: "Berechne P(E) über das Gegenereignis und die Formel P(E) = 1 − P(nicht E). Gib das Ergebnis als Bruch bzw. Dezimalzahl und in Prozent an.",
    },
    merke: [
      "„Mindestens einmal“ ist das Gegenereignis von „keinmal“: P(E) = 1 − P(nicht E). ",
      "Bei n gleichartigen, voneinander unabhängigen Versuchen gilt P(nicht E) = (P(nicht E bei einem Versuch))", { sup: "n" }, ". ",
      "Beispiel: Ein Würfel wird zweimal geworfen. P(E) = 1 − (", { f: [5, 6] }, ")", { sup: "2" }, " = 1 − ",
      { f: [25, 36] }, " = ", { f: [11, 36] }, " ≈ 30,6 %.",
    ],
    cols: 1,
    generate: minTask,
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const pe = one(powF(one(new Frac(m.pa, m.pb)), m.n));
      return plain(t.a) === plain(ansRich(pe, m.dec)) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
