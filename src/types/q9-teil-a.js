// Quali-Training Klasse 9, Teil A (ohne Taschenrechner): Größen realistisch einschätzen,
// Zahlenrätsel (Symbole, magisches Quadrat), Klammern setzen.
(function (AG) {
  const { Frac, num, rich, MINUS, plain } = AG;

  const LET = ["a", "b", "c"];
  // a · 10^E als Bruch (E darf negativ sein)
  const pw = (a, E) => (E >= 0 ? new Frac(a * 10 ** E) : new Frac(a, 10 ** -E));

  // ---------- 1. Größen realistisch schätzen ----------

  // Einheiten je Größenart. p = Zehnerpotenz zur Grundeinheit (g, mm, cm², ml)
  const UNITS = {
    Masse: [{ sym: "mg", p: -3 }, { sym: "g", p: 0 }, { sym: "kg", p: 3 }, { sym: "t", p: 6 }],
    Länge: [{ sym: "mm", p: 0 }, { sym: "cm", p: 1 }, { sym: "m", p: 3 }, { sym: "km", p: 6 }],
    Flächeninhalt: [{ sym: "cm", sup: "2", p: 0 }, { sym: "m", sup: "2", p: 4 }, { sym: "ha", p: 8 }, { sym: "km", sup: "2", p: 10 }],
    Rauminhalt: [{ sym: "ml", p: 0 }, { sym: "l", p: 3 }, { sym: "m", sup: "3", p: 6 }],
  };

  // Gegenstände mit realistischem Bereich [lo, hi] als [Zahl, Zehnerpotenz] in der Grundeinheit
  const OBJ = [
    { name: "Elefant", frage: "Wie schwer ist ein ausgewachsener Elefant?", art: "Masse", lo: [3, 6], hi: [6, 6] },
    { name: "Meerschweinchen", frage: "Wie schwer ist ein Meerschweinchen?", art: "Masse", lo: [5, 2], hi: [15, 2] },
    { name: "Apfel", frage: "Wie schwer ist ein Apfel?", art: "Masse", lo: [12, 2], hi: [25, 2] },
    { name: "Ameise", frage: "Wie schwer ist eine Ameise?", art: "Masse", lo: [2, -3], hi: [5, -3] },
    { name: "Smartphone", frage: "Wie schwer ist ein Smartphone?", art: "Masse", lo: [15, 1], hi: [25, 1] },
    { name: "Schulbus", frage: "Wie schwer ist ein leerer Schulbus?", art: "Masse", lo: [8, 6], hi: [12, 6] },
    { name: "Schultasche (gefüllt)", frage: "Wie schwer ist eine gefüllte Schultasche?", art: "Masse", lo: [3, 3], hi: [6, 3] },
    { name: "Elefant (Schulterhöhe)", frage: "Wie hoch ist ein ausgewachsener Elefant an der Schulter?", art: "Länge", lo: [25, 2], hi: [4, 3] },
    { name: "Meerschweinchen (Körperlänge)", frage: "Wie lang ist ein Meerschweinchen?", art: "Länge", lo: [20, 1], hi: [35, 1] },
    { name: "Schuh (Länge)", frage: "Wie lang ist ein Schuh in Größe 40?", art: "Länge", lo: [24, 1], hi: [30, 1] },
    { name: "Smartphone-Display (Diagonale)", frage: "Wie lang ist die Diagonale eines Smartphone-Displays?", art: "Länge", lo: [13, 1], hi: [17, 1] },
    { name: "Ameise (Körperlänge)", frage: "Wie lang ist eine Ameise?", art: "Länge", lo: [3, 0], hi: [10, 0] },
    { name: "Schulbus (Länge)", frage: "Wie lang ist ein Schulbus?", art: "Länge", lo: [10, 3], hi: [12, 3] },
    { name: "Klassenzimmer (Länge)", frage: "Wie lang ist ein Klassenzimmer?", art: "Länge", lo: [8, 3], hi: [10, 3] },
    { name: "Fußballfeld (Länge)", frage: "Wie lang ist ein Fußballfeld?", art: "Länge", lo: [100, 3], hi: [110, 3] },
    { name: "Tischplatte (Länge)", frage: "Wie lang ist ein Esstisch?", art: "Länge", lo: [10, 2], hi: [16, 2] },
    { name: "Tischplatte (Fläche)", frage: "Wie groß ist die Fläche einer Esstisch-Platte?", art: "Flächeninhalt", lo: [6, 3], hi: [15, 3] },
    { name: "DIN-A4-Blatt", frage: "Wie groß ist die Fläche eines DIN-A4-Blatts?", art: "Flächeninhalt", lo: [6, 2], hi: [65, 1] },
    { name: "Smartphone-Display (Fläche)", frage: "Wie groß ist die Fläche eines Smartphone-Displays?", art: "Flächeninhalt", lo: [8, 1], hi: [12, 1] },
    { name: "Klassenzimmer (Grundfläche)", frage: "Wie groß ist die Grundfläche eines Klassenzimmers?", art: "Flächeninhalt", lo: [4, 5], hi: [7, 5] },
    { name: "Fußballfeld (Fläche)", frage: "Wie groß ist die Fläche eines Fußballfelds?", art: "Flächeninhalt", lo: [6, 7], hi: [8, 7] },
    { name: "Trinkflasche", frage: "Wie viel passt in eine Trinkflasche?", art: "Rauminhalt", lo: [4, 2], hi: [10, 2] },
    { name: "Kaffeetasse", frage: "Wie viel passt in eine Kaffeetasse?", art: "Rauminhalt", lo: [15, 1], hi: [25, 1] },
    { name: "Eimer", frage: "Wie viel Wasser passt in einen Eimer?", art: "Rauminhalt", lo: [8, 3], hi: [12, 3] },
    { name: "Badewanne (Füllmenge)", frage: "Wie viel Wasser passt in eine volle Badewanne?", art: "Rauminhalt", lo: [15, 4], hi: [30, 4] },
    { name: "Klassenzimmer (Rauminhalt)", frage: "Wie groß ist der Rauminhalt eines Klassenzimmers?", art: "Rauminhalt", lo: [15, 7], hi: [25, 7] },
  ].map(o => Object.assign(o, { lo: pw(o.lo[0], o.lo[1]), hi: pw(o.hi[0], o.hi[1]) }));

  const unitRich = u => (u.sup ? rich(u.sym, { sup: u.sup }) : rich(u.sym));

  // "in": im realistischen Bereich; "far": mindestens Faktor 10 außerhalb; sonst "near" (ungültig)
  function cls(v, o) {
    if (v.cmp(o.lo) >= 0 && v.cmp(o.hi) <= 0) return "in";
    if (v.cmp(o.hi.mul(10)) >= 0 || v.cmp(o.lo.div(10)) <= 0) return "far";
    return "near";
  }

  // Niveau 1: gleiche Zahl, verschiedene Einheiten ohne Zehnerpotenz (3 t / 3 kg / 3 g)
  function optsN1(rng, o) {
    const a = rng.int(2, 9);
    return rng.shuffle(UNITS[o.art]).slice(0, 3).map(u => ({
      v: pw(a, u.p), u, text: rich(String(a), " ", unitRich(u)),
    }));
  }

  // Niveau 2: Dezimalzahlen in verschiedenen Einheiten, Umrechnung nötig (0,9 kg / 90 kg / 9000 g)
  function optsN2(rng, o) {
    const U = UNITS[o.art];
    const uT = rng.pick(U);
    let trueD = null;
    for (let i = 0; i < 200 && !trueD; i++) {
      const d = new Frac(rng.int(1, 999), 10 ** rng.pick([0, 1, 1, 2]));
      if (cls(d.mul(pw(1, uT.p)), o) === "in") trueD = d;
    }
    if (!trueD) return null;
    const list = [{ d: trueD, u: uT }];
    for (let t = 0; t < 2; t++) {
      let found = null;
      for (let i = 0; i < 200 && !found; i++) {
        const u = rng.pick(U);
        const d = new Frac(rng.int(1, 999), 10 ** rng.pick([0, 0, 1]));
        const v = d.mul(pw(1, u.p));
        if (cls(v, o) === "far" && !list.some(x => x.d.mul(pw(1, x.u.p)).eq(v))) found = { d, u };
      }
      if (!found) return null;
      list.push(found);
    }
    return list.map(x => ({ v: x.d.mul(pw(1, x.u.p)), u: x.u, text: rich(num(x.d, { as: "dec" }), " ", unitRich(x.u)) }));
  }

  // Niveau 3: gleiche Ziffer a, Zehnerpotenz-Schreibweise (3 · 10⁶ g / 3 · 10⁻² t / 3 · 10⁵ kg)
  function optsN3(rng, o) {
    const a = rng.int(1, 9);
    const units = rng.shuffle(UNITS[o.art]).slice(0, 3);
    const info = units.map(u => {
      const ins = [], far = [];
      for (let e = -9; e <= 9; e++) {
        if (e === 0) continue;
        const E = e + u.p;
        if (E < -12 || E > 12) continue;
        const c = cls(pw(a, E), o);
        if (c === "in") ins.push(e); else if (c === "far") far.push(e);
      }
      return { u, ins, far };
    });
    const cands = [0, 1, 2].filter(i => info[i].ins.length && info.every((x, k) => k === i || x.far.length));
    if (!cands.length) return null;
    const ci = rng.pick(cands);
    return info.map((x, i) => {
      const e = rng.pick(i === ci ? x.ins : x.far);
      const expo = e < 0 ? MINUS + String(-e) : String(e);
      return { v: pw(a, e + x.u.p), u: x.u, text: rich(String(a), " · 10", { sup: expo }, " ", unitRich(x.u)) };
    });
  }

  function genSize(rng, level) {
    for (let att = 0; att < 400; att++) {
      const o = rng.pick(OBJ);
      const opts0 = level === 1 ? optsN1(rng, o) : level === 2 ? optsN2(rng, o) : optsN3(rng, o);
      if (!opts0) continue;
      const opts = rng.shuffle(opts0);
      const cl = opts.map(x => cls(x.v, o));
      if (cl.filter(c => c === "in").length !== 1 || cl.filter(c => c === "far").length !== 2) continue;
      if (new Set(opts.map(x => x.u.sym + (x.u.sup || ""))).size < 2) continue;

      const ci = cl.indexOf("in");
      const uT = opts[ci].u;
      const inT = v => v.div(pw(1, uT.p));
      const head = [[], ...LET.map(l => [{ b: l + ")" }])];
      const markRow = mark => [[], ...opts.map((x, i) => rich(mark(i), " ", x.text))];
      const table = { rows: [head, markRow(() => "☐")] };
      const aTable = { rows: [head, markRow(i => (i === ci ? "☒" : "☐"))] };

      const steps = [rich("Alle Angaben in ", unitRich(uT), " umrechnen:")];
      opts.forEach((x, i) => steps.push(x.u === uT
        ? rich(LET[i], ") ", x.text, " (schon in ", unitRich(uT), ")")
        : rich(LET[i], ") ", x.text, " = ", num(inT(x.v), { as: "dec" }), " ", unitRich(uT))));
      steps.push(rich("Üblich sind etwa ", num(inT(o.lo), { as: "dec" }), " bis ", num(inT(o.hi), { as: "dec" }), " ", unitRich(uT), " (", o.name, ")."));
      steps.push(rich(LET[ci], ") ", opts[ci].text, " ist realistisch. Die beiden anderen sind mindestens zehnmal zu groß oder zu klein."));

      return {
        q: rich(o.frage),
        a: rich(LET[ci], ") ", opts[ci].text),
        steps,
        table,
        aTable,
        inline: false,
      };
    }
    throw new Error("q9-groessen-schaetzen: keine Aufgabe gefunden (Niveau " + level + ")");
  }

  // ---------- 2. Zahlenrätsel ----------

  const SYMBOLS = [["★", "●", "■"], ["♣", "♦", "♠"]];
  const nd = v => num(v, { as: "dec" });

  // Kette: X·k bzw. X+X = s1 (X), Y+X = s2 (Y), Y·Z = p (Z). Niveau 2: Dezimalzahlen (halbe Einheiten)
  function riddleChain(rng, dec) {
    const [X, Y, Z] = rng.shuffle(rng.pick(SYMBOLS));
    const val = () => (dec ? new Frac(rng.int(1, 12), 2) : new Frac(rng.int(2, 12)));
    let x, y, z;
    do { x = val(); y = val(); z = val(); } while (x.eq(y) || y.eq(z) || x.eq(z));
    const sumForm = rng.chance(0.5);
    const k = sumForm ? 2 : rng.pick([3, 4]);
    const s1 = x.mul(k), s2 = x.add(y), p = y.mul(z);
    const q = rich(
      sumForm ? rich(X, " + ", X) : rich(String(k), " · ", X), " = ", nd(s1), { br: true },
      Y, " + ", X, " = ", nd(s2), { br: true },
      Y, " · ", Z, " = ", nd(p),
    );
    const steps = [
      rich(String(k), " · ", X, " = ", nd(s1)),
      rich(X, " = ", nd(s1), " : ", String(k), " = ", nd(x)),
      rich(Y, " = ", nd(s2), " " + MINUS + " ", nd(x), " = ", nd(y)),
      rich(Z, " = ", nd(p), " : ", nd(y), " = ", nd(z)),
    ];
    return {
      q, steps, inline: false,
      a: rich(X, " = ", nd(x), ";  ", Y, " = ", nd(y), ";  ", Z, " = ", nd(z)),
    };
  }

  // Zwei Gleichungen mit zwei Symbolen gleichzeitig: A + B = s1, A − B = d1, B · C = p
  function riddleSystem(rng) {
    const [A, B, C] = rng.shuffle(rng.pick(SYMBOLS));
    const vb = rng.int(2, 11);
    const va = rng.int(vb + 1, 12);
    let vc;
    do { vc = rng.int(2, 12); } while (vc === va || vc === vb);
    const s1 = va + vb, d1 = va - vb, p = vb * vc;
    const q = rich(
      A, " + ", B, " = ", String(s1), { br: true },
      A, " " + MINUS + " ", B, " = ", String(d1), { br: true },
      B, " · ", C, " = ", String(p),
    );
    const steps = [
      rich("Beide Gleichungen addieren: 2 · ", A, " = ", String(s1), " + ", String(d1), " = ", String(s1 + d1)),
      rich(A, " = ", String(s1 + d1), " : 2 = ", String(va)),
      rich(B, " = ", String(s1), " " + MINUS + " ", String(va), " = ", String(vb)),
      rich(C, " = ", String(p), " : ", String(vb), " = ", String(vc)),
    ];
    return {
      q, steps, inline: false,
      a: rich(A, " = ", String(va), ";  ", B, " = ", String(vb), ";  ", C, " = ", String(vc)),
    };
  }

  // Magisches Quadrat: Lo-Shu-Quadrat, zentriert (−5), mit Schrittweite s und Mitte c skaliert
  const LO_SHU = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
  const rotate = M => [0, 1, 2].map(i => [0, 1, 2].map(j => M[2 - j][i]));
  const reflect = M => M.map(r => r.slice().reverse());
  function magicGrid(rng) {
    let M = LO_SHU.map(r => r.map(v => v - 5));
    const c = rng.int(21, 45), s = rng.int(1, 5);
    for (let r = rng.int(0, 3); r > 0; r--) M = rotate(M);
    if (rng.chance(0.5)) M = reflect(M);
    return M.map(row => row.map(v => c + s * v));
  }

  const LINES = [
    [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]],
  ];
  const lineName = i => (i < 3 ? "Zeile " + (i + 1) : i < 6 ? "Spalte " + (i - 2) : i === 6 ? "Diagonale von links oben" : "Diagonale von rechts oben");

  // Lückenfüllung durch Zeilen-/Spalten-/Diagonalsumme mit einer Lücke. S: Summe oder null (dann aus einer vollen Linie).
  function solveMagic(g, S0) {
    const h = g.map(r => r.slice());
    const steps = [];
    let S = S0;
    if (S === null) {
      const full = LINES.findIndex(L => L.every(([r, c]) => h[r][c] !== null));
      if (full < 0) return null;
      S = LINES[full].reduce((s, [r, c]) => s + h[r][c], 0);
      steps.push(rich(lineName(full), ": ", LINES[full].map(([r, c]) => String(h[r][c])).join(" + "), " = ", String(S), ". Die Summe ist also ", String(S), "."));
    }
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < LINES.length; i++) {
        const L = LINES[i];
        const blanks = L.filter(([r, c]) => h[r][c] === null);
        if (blanks.length !== 1) continue;
        const known = L.filter(([r, c]) => h[r][c] !== null).map(([r, c]) => h[r][c]);
        const sumKnown = known.reduce((s, v) => s + v, 0);
        const v = S - sumKnown;
        if (v <= 0) return null;
        const cells = L.map(([r, c]) => (h[r][c] === null ? "?" : String(h[r][c]))).join(" + ");
        steps.push(rich(lineName(i), ": ", cells, " = ", String(S), ";  ? = ", String(S), " " + MINUS + " ", String(sumKnown), " = ", String(v)));
        h[blanks[0][0]][blanks[0][1]] = v;
        progress = true;
      }
    }
    if (h.some(row => row.some(x => x === null))) return null;
    if (!LINES.every(L => L.reduce((s, [r, c]) => s + h[r][c], 0) === S)) return null;
    return { h, S, steps };
  }

  function riddleMagic(rng) {
    for (let att = 0; att < 300; att++) {
      const M = magicGrid(rng);
      const S0 = M[0][0] + M[0][1] + M[0][2];
      const idx = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, rng.int(4, 6));
      const g = M.map(r => r.slice());
      for (const k of idx) g[Math.floor(k / 3)][k % 3] = null;
      const sumGiven = rng.chance(0.5);
      const res = solveMagic(g, sumGiven ? S0 : null);
      if (!res || res.S !== S0) continue;
      const rowLabel = r => [{ b: "Zeile " + (r + 1) }];
      const table = { rows: [0, 1, 2].map(r => [rowLabel(r), ...[0, 1, 2].map(c => (g[r][c] === null ? [{ blank: 3 }] : [String(g[r][c])]))]) };
      const aTable = { rows: [0, 1, 2].map(r => [rowLabel(r), ...[0, 1, 2].map(c => [String(M[r][c])])]) };
      return {
        q: sumGiven
          ? rich("Jede Zeile, jede Spalte und jede Diagonale hat die Summe ", String(S0), ". Ergänze die fehlenden Zahlen.")
          : rich("Alle Zeilen, Spalten und Diagonalen haben dieselbe Summe. Ergänze die fehlenden Zahlen und bestimme diese Summe."),
        a: rich("Summe = ", String(S0)),
        steps: res.steps,
        table,
        aTable,
        inline: false,
      };
    }
    throw new Error("q9-raetsel: kein magisches Quadrat gefunden");
  }

  // ---------- 3. Klammern setzen ----------

  const OP_ADD = "+", OP_SUB = MINUS, OP_MUL = "·";
  const OPS = [OP_ADD, OP_SUB, OP_MUL];
  const PREC = { [OP_ADD]: 1, [OP_SUB]: 1, [OP_MUL]: 2 };
  const leaf = v => ({ leaf: true, v });
  const node = (op, l, r) => ({ op, l, r });

  // alle vollständig geklammerten Binärbäume über xs[i..j] (Operator ops[k] zwischen xs[k] und xs[k+1])
  function trees(xs, ops, i, j) {
    if (i === j) return [leaf(xs[i])];
    const out = [];
    for (let k = i; k < j; k++) {
      for (const L of trees(xs, ops, i, k)) for (const R of trees(xs, ops, k + 1, j)) out.push(node(ops[k], L, R));
    }
    return out;
  }
  function evalT(t) {
    if (t.leaf) return t.v;
    const a = evalT(t.l), b = evalT(t.r);
    return t.op === OP_ADD ? a.add(b) : t.op === OP_SUB ? a.sub(b) : a.mul(b);
  }
  // Klammer nur, wo sie die Rechnung ändert (Punkt vor Strich, Minus vor einer Summe/Differenz)
  function needParen(t, parent, side) {
    if (!parent) return false;
    const pc = PREC[t.op], pp = PREC[parent.op];
    return pc < pp || (pc === pp && side === "r" && parent.op === OP_SUB);
  }
  function pr(t, parent, side) {
    if (t.leaf) return t.v.sign() < 0 && parent ? rich("(", nd(t.v), ")") : nd(t.v);
    const inner = rich(pr(t.l, t, "l"), " ", t.op, " ", pr(t.r, t, "r"));
    return needParen(t, parent, side) ? rich("(", inner, ")") : inner;
  }
  // einen Schritt: die linkeste innerste Verknüpfung ausrechnen
  function red(t) {
    if (t.leaf) return t;
    if (!t.l.leaf) return node(t.op, red(t.l), t.r);
    if (!t.r.leaf) return node(t.op, t.l, red(t.r));
    return leaf(evalT(t));
  }

  // Alle verschiedenen Klammerfassungen (gleiche Schreibweise = gleicher Baum) mit ihrem Wert
  function analyse(xs, ops) {
    const map = new Map();
    for (const t of trees(xs, ops, 0, xs.length - 1)) {
      const key = plain(pr(t, null, null));
      if (!map.has(key)) map.set(key, { key, t, v: evalT(t), pairs: (key.match(/\(/g) || []).length });
    }
    return [...map.values()];
  }

  function genBrackets(rng, level) {
    for (let att = 0; att < 400; att++) {
      const n = level === 2 ? 4 : level === 1 ? 3 : rng.pick([3, 4]);
      const xs = Array.from({ length: n }, () => (level === 3 ? new Frac(rng.int(11, 95), 10) : new Frac(rng.int(2, level === 1 ? 9 : 12))));
      const ops = Array.from({ length: n - 1 }, () => rng.pick(OPS));
      const all = analyse(xs, ops);
      const def = all.find(e => e.pairs === 0);
      const cands = all.filter(e => e.pairs > 0);
      if (!def || !cands.length) continue;
      const ans = rng.pick(cands);
      const R = ans.v;
      if (R.eq(def.v)) continue;                                   // ohne Klammern darf das Ergebnis nicht stimmen
      if (cands.filter(e => e.v.eq(R)).length !== 1) continue;     // genau eine Klammersetzung
      if (level === 1 && ans.pairs !== 1) continue;
      if (level === 2 && ans.pairs > 2) continue;
      if (R.decimals() > 2 || Math.abs(R.valueOf()) > 500) continue;

      const steps = [pr(ans.t, null, null)];
      let t = ans.t;
      while (!t.leaf) { t = red(t); steps.push(rich("= ", pr(t, null, null))); }
      return {
        q: rich(pr(def.t, null, null), " = ", nd(R)),
        a: rich(pr(ans.t, null, null), " = ", nd(R)),
        steps,
        inline: false,
      };
    }
    throw new Error("q9-klammern-setzen: keine Aufgabe gefunden (Niveau " + level + ")");
  }

  // ---------- Typen ----------

  AG.registerType({
    id: "q9-groessen-schaetzen",
    klasse: "9",
    zug: "RM",
    lb: "Q",
    lbTitle: "Quali-Training",
    topic: "groessen",
    title: "Realistische Größenangaben",
    instruction: "Welche Angabe ist realistisch? Kreuze an.",
    merke: [{ b: "Merke:" }, " Erst alle Angaben in dieselbe Einheit umrechnen, dann vergleichen. Beispiel: 3 t = 3000 kg = 3 · 10",
      { sup: "3" }, " kg."],
    cols: 2,
    generate(rng, level) { return genSize(rng, level); },
  });

  AG.registerType({
    id: "q9-raetsel",
    klasse: "9",
    zug: "RM",
    lb: "Q",
    lbTitle: "Quali-Training",
    topic: "zahlen",
    title: "Zahlenrätsel und magisches Quadrat",
    instruction: {
      1: "Bestimme den Wert jedes Symbols.",
      2: "Bestimme den Wert jedes Symbols.",
      3: "Ergänze das magische Quadrat.",
    },
    merke: [{ b: "Merke:" }, " Gleichungen mit nur einem Symbol zuerst lösen, dann die übrigen Werte einsetzen. "
      + "Beim magischen Quadrat hilft eine Zeile, Spalte oder Diagonale mit nur einer Lücke."],
    cols: 2,
    generate(rng, level) {
      if (level === 3) return riddleMagic(rng);
      if (level === 2 && rng.chance(0.5)) return riddleSystem(rng);
      return riddleChain(rng, level === 2);
    },
  });

  AG.registerType({
    id: "q9-klammern-setzen",
    klasse: "9",
    zug: "RM",
    lb: "Q",
    lbTitle: "Quali-Training",
    topic: "zahlen",
    title: "Klammern setzen",
    instruction: "Setze Klammern, damit die Rechnung stimmt.",
    merke: [{ b: "Merke:" }, " Was in einer Klammer steht, wird zuerst berechnet. Punktrechnung geht vor Strichrechnung, "
      + "außer eine Klammer steht davor."],
    cols: 2,
    generate(rng, level) { return genBrackets(rng, level); },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
