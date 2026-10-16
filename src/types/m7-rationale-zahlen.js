// M7 LB 2: Rationale Zahlen – Rechenregeln. Vier Aufgabentypen:
// Addieren/Subtrahieren, Multiplizieren/Dividieren, Punkt vor Strich und Klammern, Vorteilhaft rechnen.
(function (AG) {
  const { Frac, num, rich, MINUS } = AG;

  const LB = { klasse: "7", zug: "M", lb: "2", lbTitle: "Rationale Zahlen – Rechenregeln" };
  const OPTXT = { "+": " + ", "-": " " + MINUS + " ", "*": " · ", "/": " : " };
  const PREC = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const APPLY = {
    "+": (a, b) => a.add(b),
    "-": (a, b) => a.sub(b),
    "*": (a, b) => a.mul(b),
    "/": (a, b) => a.div(b),
  };
  const DENS = [2, 3, 4, 5, 6, 8, 10, 12];
  const DENS6 = [2, 3, 4, 5, 6];
  const PAIRS_INT = [[4, 25], [5, 2], [2, 50], [20, 5], [8, 125], [25, 40], [50, 4]];
  const PAIRS_DEC = [
    [new Frac(5, 10), 2], [new Frac(2, 10), 5], [new Frac(25, 100), 4], [new Frac(25, 10), 4],
    [new Frac(125, 100), 8], [new Frac(4, 10), 25], [new Frac(5, 10), 20],
  ];

  // ---------- Zufallswerte ----------
  const sgn = rng => (rng.chance(0.5) ? -1 : 1);

  // Dezimalzahl mit k Nachkommastellen, nie ganzzahlig
  function decVal(rng, maxInt, k) {
    const ip = rng.int(0, maxInt);
    const fp = rng.int(1, 10 ** k - 1);
    const v = new Frac(ip * 10 ** k + fp, 10 ** k);
    return rng.chance(0.5) ? v.neg() : v;
  }

  // echter Bruch bzw. gemischte Zahl mit Vorzeichen; Nenner aus dens
  function mixedVal(rng, dens, whole) {
    const d = rng.pick(dens);
    const n = rng.int(1, d - 1);
    const v = new Frac(rng.int(0, whole) * d + n, d);
    return rng.chance(0.5) ? v.neg() : v;
  }

  // ---------- Ausdrucksbaum ----------
  // Blatt: { v: Frac }
  // Knoten: { op, l, r, br } – br: Klammer um den ganzen Knoten
  const leaf = v => ({ v: Frac.of(v) });
  const bin = (op, l, r, br = false) => ({ op, l, r, br });
  const evalTree = n => (n.v ? n.v : APPLY[n.op](evalTree(n.l), evalTree(n.r)));
  const leaves = (n, out = []) => {
    if (n.v) out.push(n.v);
    else { leaves(n.l, out); leaves(n.r, out); }
    return out;
  };
  const ser = n => (n.v ? { v: [n.v.n, n.v.d] } : { o: n.op, l: ser(n.l), r: ser(n.r) });

  // Kette von links: ((t0 op t1) op t2) ...
  function chainTree(terms) {
    let node = leaf(terms[0].v);
    for (let i = 1; i < terms.length; i++) node = bin(terms[i].op, node, leaf(terms[i].v));
    return node;
  }

  // ---------- Darstellung ----------
  // mode: "int" | "frac" (gemischt) | "dec" (Dezimalzahl) | "imp" (unechter Bruch)
  function valRich(v, mode, paren) {
    const as = mode === "dec" ? "dec" : mode === "imp" ? "improper" : undefined;
    return num(v, { paren: !!paren, as });
  }
  // Zahl am Anfang eines Ausdrucks bzw. direkt nach einer öffnenden Klammer: ohne Klammer
  const nb = (v, mode) => valRich(v, mode, false);
  // Zahl nach einem Rechenzeichen: negative Zahl in Klammern
  const nv = (v, mode) => valRich(v, mode, Frac.of(v).sign() < 0);

  function needsParens(c, p, right) {
    if (c.v || c.br) return false;
    if (PREC[c.op] < PREC[p.op]) return true;
    return PREC[c.op] === PREC[p.op] && right && (p.op === "-" || p.op === "/");
  }

  // lead: die Zahl steht am Anfang des Ausdrucks oder direkt nach "(" – dann ohne Klammer
  function rend(n, mode, lead = true) {
    if (n.v) return valRich(n.v, mode, !lead && n.v.sign() < 0);
    const part = (c, right) => {
      if (!c.v && !c.br && needsParens(c, n, right)) return rich("(", rend(c, mode, true), ")");
      return rend(c, mode, right ? false : lead || n.br);
    };
    const body = rich(part(n.l, false), OPTXT[n.op], part(n.r, true));
    return n.br ? rich("(", body, ")") : body;
  }

  // Ready-Knoten (beide Operanden Blätter): zuerst in Klammern, dann Punkt, dann Strich, sonst von links
  function pickNext(root) {
    const cand = [];
    (function walk(n, inBr) {
      if (n.v) return;
      const flag = inBr || n.br;
      walk(n.l, flag);
      walk(n.r, flag);
      if (n.l.v && n.r.v) cand.push({ n, flag });
    })(root, false);
    cand.sort((x, y) => Number(y.flag) - Number(x.flag) || PREC[y.n.op] - PREC[x.n.op]);
    return cand[0].n;
  }

  function replaceNode(n, target, repl) {
    if (n === target) return repl;
    if (n.v) return n;
    return { op: n.op, l: replaceNode(n.l, target, repl), r: replaceNode(n.r, target, repl), br: n.br };
  }

  // Schritt für Schritt: jede Zeile zeigt den ganzen Ausdruck nach einem Rechenschritt
  function reductionSteps(tree, mode) {
    const steps = [];
    let cur = tree;
    while (!cur.v) {
      const t = pickNext(cur);
      cur = replaceNode(cur, t, { v: APPLY[t.op](t.l.v, t.r.v) });
      steps.push(rich("= ", cur.v ? nb(cur.v, mode) : rend(cur, mode, true)));
    }
    return steps;
  }

  // ---------- Prüfungen ----------
  // Keine Trivialaufgaben, Zwischenwerte im passenden Zahlbereich, ganzzahlig bzw. endlich (höchstens 2 Nachkommastellen).
  function sane(tree, c) {
    const inMode = v =>
      v.n !== 0 && Math.abs(v.valueOf()) <= c.bound && v.d <= c.maxDen &&
      (c.mode !== "int" || v.isInt()) &&
      (c.mode !== "dec" || (v.isTerminating() && v.decimals() <= 2));
    const lv = leaves(tree);
    if (!lv.every(inMode)) return false;
    if (c.distinct) {
      const keys = lv.map(v => v.abs().toString());
      if (new Set(keys).size !== keys.length) return false;
    }
    let ok = true;
    (function walk(n) {
      if (!ok || n.v) return;
      walk(n.l);
      walk(n.r);
      if (!ok) return;
      const a = evalTree(n.l), b = evalTree(n.r);
      if (n.op === "/" && b.n === 0) { ok = false; return; } // Division durch 0
      const r = APPLY[n.op](a, b);
      if (a.abs().eq(b.abs())) ok = false; // identische Zahlen (auch a − a, a + (−a))
      if ((n.op === "*" || n.op === "/") && (a.abs().eq(1) || b.abs().eq(1))) ok = false; // ·1, :1, ·(−1)
      if (!inMode(r)) ok = false;
    })(tree);
    return ok;
  }

  // Verifikation: Ausdruck unabhängig in Gleitkommazahlen nachrechnen, Lösungsschritte prüfen
  function evalFloat(s) {
    if (s.v) return s.v[0] / s.v[1];
    const a = evalFloat(s.l), b = evalFloat(s.r);
    return s.o === "+" ? a + b : s.o === "-" ? a - b : s.o === "*" ? a * b : a / b;
  }
  function verify(task) {
    const [n, d] = task._res;
    const want = n / d;
    if (Math.abs(evalFloat(task._ops) - want) > 1e-9 * Math.max(1, Math.abs(want))) return "Rechnung weicht ab";
    if (AG.plain(task.a) !== AG.plain(valRich(new Frac(n, d), task._mode, false))) return "Ergebnis falsch dargestellt";
    const last = AG.plain(task.steps[task.steps.length - 1]);
    if (last !== "= " + AG.plain(task.a)) return "Lösungsschritte enden nicht beim Ergebnis";
    return true;
  }

  // Wrapper: Kandidat erzeugen, bis er die Prüfungen besteht
  function makeGenerate(cand) {
    return function generate(rng, level) {
      for (let i = 0; i < 500; i++) {
        const c = cand(rng, level);
        if (!c || !sane(c.tree, c)) continue;
        if (c.needNeg && !leaves(c.tree).some(v => v.sign() < 0)) continue; // mindestens eine negative Zahl
        const res = evalTree(c.tree);
        if (c.nice && !c.nice(res)) continue;
        return {
          q: rend(c.tree, c.mode, true),
          a: valRich(res, c.mode, false),
          steps: c.steps(),
          _ops: ser(c.tree),
          _res: [res.n, res.d],
          _mode: c.mode,
        };
      }
      throw new Error("Keine passende Aufgabe gefunden (Niveau " + level + ")");
    };
  }

  // ---------- Typ 1: Addieren und Subtrahieren ----------
  // Jede Zeile zeigt den ganzen restlichen Ausdruck; zwei benachbarte Glieder werden zusammengefasst.
  function addsubSteps(terms, mode) {
    const eff = terms.map((t, i) => (i === 0 ? t.v : t.op === "-" ? t.v.neg() : t.v));
    const line = list => rich("= ", list.map((v, i) =>
      (i === 0 ? nb(v, mode) : [v.sign() < 0 ? " " + MINUS + " " : " + ", nb(v.abs(), mode)])));
    const steps = [];
    // Vorzeichenregel: Klammern auflösen
    if (terms.some((t, i) => i > 0 && t.v.sign() < 0)) steps.push(line(eff));
    // Brüche: zuerst gleichnamig machen (Nenner des Hauptnenners, nicht gekürzt)
    if (mode === "frac") {
      const D = eff.reduce((acc, v) => AG.lcm(acc, v.d), 1);
      steps.push(rich("= ", eff.map((v, i) => {
        const k = v.n * (D / v.d);
        const mag = { f: [Math.abs(k), D] };
        if (i === 0) return k < 0 ? { f: [-k, D], s: -1 } : mag;
        return [k < 0 ? " " + MINUS + " " : " + ", mag];
      })));
    }
    let cur = eff.slice();
    while (cur.length > 1) {
      cur = [cur[0].add(cur[1]), ...cur.slice(2)];
      steps.push(line(cur));
    }
    return steps;
  }

  function addsubCand(rng, level) {
    const mode = level === 1 ? "int" : level === 2 ? "dec" : rng.pick(["frac", "frac", "int"]);
    let n;
    if (level === 1) n = 2;
    else if (level === 2) n = rng.pick([2, 3]);
    else n = mode === "int" ? 4 : rng.pick([2, 3]); // lange Kette mit 4 Zahlen oder Brüche
    const terms = [];
    for (let i = 0; i < n; i++) {
      const v = mode === "int" ? new Frac(rng.signedInt(1, level === 1 ? 50 : 40))
        : mode === "dec" ? decVal(rng, 19, rng.pick([1, 2]))
          : mixedVal(rng, DENS, 3);
      terms.push({ op: i === 0 ? null : rng.pick(["+", "-"]), v });
    }
    if ((level === 1 || level === 3) && !terms.some(t => t.v.sign() < 0)) return null; // mindestens eine negative Zahl
    if (mode === "frac" && new Set(terms.map(t => t.v.d)).size < 2) return null; // ungleichnamig
    return {
      tree: chainTree(terms), mode, bound: 200, maxDen: 400, distinct: true,
      steps: () => addsubSteps(terms, mode),
    };
  }

  // ---------- Typ 2: Multiplizieren und Dividieren ----------
  function muldivSteps(terms, mode) {
    const m2 = mode === "frac" ? "imp" : mode;
    let r = terms[0].v;
    const abs = [nb(terms[0].v.abs(), m2)];
    for (let i = 1; i < terms.length; i++) {
      r = APPLY[terms[i].op](r, terms[i].v);
      abs.push(OPTXT[terms[i].op], nb(terms[i].v.abs(), m2));
    }
    const negs = terms.filter(t => t.v.sign() < 0).length;
    const word = negs === 0 ? "kein negativer Faktor" : negs === 1 ? "1 negativer Faktor" : negs + " negative Faktoren";
    return [
      rich(`Vorzeichen: ${word} → ${r.sign() < 0 ? "negativ" : "positiv"}`),
      rich(abs, " = ", nb(r.abs(), mode)),
      rich("= ", nb(r, mode)),
    ];
  }

  function muldivCand(rng, level) {
    const mode = level === 1 ? "int" : level === 2 ? "dec" : "frac";
    let terms;
    if (level === 1) {
      // Einmaleins; Division geht auf
      const x = rng.signedInt(2, 10), y = rng.signedInt(2, 12);
      terms = rng.chance(0.5)
        ? [{ op: null, v: new Frac(x) }, { op: "*", v: new Frac(y) }]
        : [{ op: null, v: new Frac(x * y) }, { op: "/", v: new Frac(x) }];
    } else if (level === 2) {
      // ein Faktor mit einer Nachkommastelle, der andere einstellig oder mit einer Nachkommastelle
      terms = [
        { op: null, v: decVal(rng, 9, 1) },
        { op: rng.pick(["*", "/"]), v: rng.chance(0.5) ? new Frac(rng.signedInt(2, 9)) : decVal(rng, 9, 1) },
      ];
    } else {
      const n = rng.pick([2, 3]);
      terms = [];
      for (let i = 0; i < n; i++) {
        const v = mixedVal(rng, DENS, 2);
        terms.push({ op: i === 0 ? null : rng.pick(["*", "/"]), v });
      }
    }
    return {
      tree: chainTree(terms), mode, bound: 200, maxDen: 400, distinct: true,
      steps: () => muldivSteps(terms, mode),
    };
  }

  // ---------- Typ 3: Punkt vor Strich und Klammern ----------
  function verbCand(rng, level) {
    let tree, mode, maxDen = 400, nice = null;
    if (level === 1) {
      // 3 ganze Zahlen: ein Punkt- und ein Strichrechenzeichen
      mode = "int";
      const opP = rng.pick(["*", "/"]);
      let P;
      if (opP === "*") {
        P = bin("*", leaf(rng.signedInt(2, 12)), leaf(rng.signedInt(2, 12)));
      } else {
        const x = rng.signedInt(2, 12), y = rng.signedInt(2, 12);
        P = bin("/", leaf(x * y), leaf(x));
      }
      const S = leaf(rng.signedInt(2, 50));
      const opS = rng.pick(["+", "-"]);
      tree = rng.chance(0.5) ? bin(opS, P, S) : bin(opS, S, P);
    } else if (level === 2) {
      // 4 ganze Zahlen mit einer Klammer: x · (y − z) + w
      mode = "int";
      const B = bin(rng.pick(["+", "-"]), leaf(rng.signedInt(2, 12)), leaf(rng.signedInt(2, 12)), true);
      const x = leaf(rng.signedInt(2, 12));
      const M = bin(rng.pick(["*", "/"]), x, B);
      const Mn = rng.chance(0.5) ? M : bin(M.op, B, x);
      const w = leaf(rng.signedInt(2, 20));
      tree = rng.chance(0.5) ? bin(rng.pick(["+", "-"]), Mn, w) : bin(rng.pick(["+", "-"]), w, Mn);
    } else {
      // höchstens 5 Zahlen, eine Klammer in einer Klammer; Dezimalzahlen mit einer Stelle oder Brüche (Nenner bis 6)
      mode = rng.chance(0.5) ? "dec" : "frac";
      const val = () => (mode === "dec" ? decVal(rng, 9, 1) : mixedVal(rng, DENS6, 1));
      const B2 = bin(rng.pick(["+", "-", "*", "/"]), leaf(val()), leaf(val()), true);
      const B1 = bin(rng.pick(["+", "-", "*", "/"]), leaf(val()), B2, true);
      const opM = rng.pick(["*", "/"]);
      const Mn = rng.chance(0.5) ? bin(opM, leaf(val()), B1) : bin(opM, B1, leaf(val()));
      const opT = rng.pick(["+", "-"]);
      tree = rng.chance(0.5) ? bin(opT, Mn, leaf(val())) : bin(opT, leaf(val()), Mn);
      // schönes Ergebnis: ganzzahlig, eine Nachkommastelle oder einfacher Bruch
      nice = res => res.isInt() || (mode === "dec" && res.decimals() <= 1) || (mode === "frac" && res.d <= 6);
    }
    return {
      tree, mode, bound: 300, maxDen, distinct: true, nice,
      steps: () => reductionSteps(tree, mode),
    };
  }

  // ---------- Typ 4: Vorteilhaft rechnen ----------
  // (p op q) op c mit p und q zusammen als runde Zahl; Zeilen zeigen das Rechengesetz.
  function regroup3(rng, p, q, c, op, mode) {
    const order = rng.pick([[p, c, q], [c, p, q], [p, q, c]]);
    const tree = bin(op, bin(op, leaf(order[0]), leaf(order[1])), leaf(order[2]));
    const steps = [];
    if (order[0] !== p || order[1] !== q) {
      steps.push(rich("= ", nb(p, mode), OPTXT[op], nv(q, mode), OPTXT[op], nv(c, mode)));
    }
    steps.push(rich("= (", nb(p, mode), OPTXT[op], nv(q, mode), ")", OPTXT[op], nv(c, mode)));
    const mid = APPLY[op](p, q);
    steps.push(rich("= ", nb(mid, mode), OPTXT[op], nv(c, mode)));
    steps.push(rich("= ", nb(APPLY[op](mid, c), mode)));
    return { tree, mode, steps };
  }

  function vorKind(rng, level) {
    const kind = rng.pick(level === 1 ? ["mul3", "dist"] : level === 2 ? ["add3d", "mul3d"] : ["add3f", "mul3f", "decomp"]);
    if (kind === "mul3") {
      const [a, b] = rng.pick(PAIRS_INT);
      const p = new Frac(a * sgn(rng)), q = new Frac(b * sgn(rng));
      return regroup3(rng, p, q, new Frac(rng.signedInt(2, 15)), "*", "int");
    }
    if (kind === "mul3d") {
      const [a, b] = rng.pick(PAIRS_DEC);
      const p = rng.chance(0.5) ? a.neg() : a;
      return regroup3(rng, p, new Frac(b * sgn(rng)), decVal(rng, 9, 1), "*", "dec");
    }
    if (kind === "mul3f") {
      const d = rng.pick(DENS);
      const p = new Frac(rng.int(1, d - 1) * sgn(rng), d);
      return regroup3(rng, p, new Frac(d * sgn(rng)), mixedVal(rng, [2, 3, 4, 5, 6, 8], 2), "*", "frac");
    }
    if (kind === "add3d") {
      const N = rng.pick([1, 2, 5, 10]);
      const p = decVal(rng, 9, 1);
      return regroup3(rng, p, Frac.of(N).sub(p), decVal(rng, 9, rng.pick([1, 2])), "+", "dec");
    }
    if (kind === "add3f") {
      const N = rng.pick([1, 2]);
      const d = rng.pick(DENS);
      const p = mixedVal(rng, [d], 1);
      return regroup3(rng, p, Frac.of(N).sub(p), mixedVal(rng, DENS.filter(x => x !== d), 2), "+", "frac");
    }
    if (kind === "dist") {
      // a · b + a · c mit b + c = N  ->  a · (b + c) = a · N
      const av = new Frac(rng.signedInt(2, 19)), bv = new Frac(rng.signedInt(2, 30));
      const N = rng.pick([10, 20, 50, 100]);
      const cv = Frac.of(N).sub(bv);
      const tree = bin("+", bin("*", leaf(av), leaf(bv)), bin("*", leaf(av), leaf(cv)));
      const steps = [
        rich("= ", nb(av, "int"), OPTXT["*"], "(", nb(bv, "int"), OPTXT["+"], nv(cv, "int"), ")"),
        rich("= ", nb(av, "int"), OPTXT["*"], nb(N, "int")),
        rich("= ", nb(av.mul(N), "int")),
      ];
      return { tree, mode: "int", steps };
    }
    // decomp: a · y mit y = sy · (N ± dd) nahe an einem Zehner/Hunderter (19, 21, 49, 51, 98, 101, 199 …)
    // -> a · (sy·N ± dd) = a · sy·N ± a · dd. Mindestens eine Zahl ist negativ.
    const av = new Frac(rng.signedInt(11, 36));
    const N = rng.pick([20, 50, 100, 200]);
    const dd = rng.pick([1, 2]);
    const s = rng.pick([-1, 1]);
    const sy = av.sign() > 0 ? -1 : rng.pick([-1, 1]);
    const yv = new Frac(sy * (N + s * dd));
    const xN = new Frac(sy * N);
    const sg = sy * s;                       // Vorzeichen des Summanden dd
    const opk = sg > 0 ? "+" : "-";
    const tree = bin("*", leaf(av), leaf(yv));
    const top = av.mul(sg * dd);             // Vorzeichen des zweiten Teilprodukts
    // bei dd = 1 steht kein „· 1“ in den Schritten
    const tail = dd === 1 ? [nv(av, "int")] : [nv(av, "int"), OPTXT["*"], nb(dd, "int")];
    const steps = [
      rich("= ", nb(av, "int"), OPTXT["*"], "(", nb(xN, "int"), OPTXT[opk], nb(dd, "int"), ")"),
      rich("= ", nb(av, "int"), OPTXT["*"], nv(xN, "int"), OPTXT[opk], tail),
      rich("= ", nb(av.mul(xN), "int"), OPTXT[top.sign() < 0 ? "-" : "+"], nb(top.abs(), "int")),
      rich("= ", nb(av.mul(yv), "int")),
    ];
    return { tree, mode: "int", steps, needNeg: true };
  }

  function vorCand(rng, level) {
    const c = vorKind(rng, level);
    return {
      tree: c.tree, mode: c.mode, bound: 20000, maxDen: 1000,
      needNeg: level === 3 || c.needNeg, steps: () => c.steps,
    };
  }

  // ---------- Registrierung ----------
  AG.registerType({
    id: "m7-q-addsub",
    ...LB,
    title: "Addieren und Subtrahieren",
    instruction: {
      1: "Berechne. Achte auf die Vorzeichen.",
      2: "Berechne. Achte auf das Dezimalkomma.",
      3: "Berechne. Kürze Brüche vollständig.",
    },
    merke: [
      { b: "Vorzeichenregel: " },
      `Steht vor einer Klammer ein Minus, wird das Vorzeichen in der Klammer umgekehrt: 8 ${MINUS} (${MINUS}15) = 8 + 15. Beispiel: (${MINUS}12) + 7 = ${MINUS}5.`,
    ],
    cols: 3,
    generate: makeGenerate(addsubCand),
    verify,
  });

  AG.registerType({
    id: "m7-q-muldiv",
    ...LB,
    title: "Multiplizieren und Dividieren",
    instruction: {
      1: "Berechne. Achte auf die Vorzeichen.",
      2: "Berechne. Achte auf das Dezimalkomma.",
      3: "Berechne. Kürze Brüche vollständig.",
    },
    merke: [
      { b: "Vorzeichen zuerst: " },
      `Das Ergebnis ist positiv bei einer geraden, negativ bei einer ungeraden Anzahl negativer Zahlen. Danach die Beträge rechnen. Beispiel: (${MINUS}6) · (${MINUS}8) = 48, (${MINUS}63) : 7 = ${MINUS}9.`,
    ],
    cols: 3,
    generate: makeGenerate(muldivCand),
    verify,
  });

  AG.registerType({
    id: "m7-q-verbindung",
    ...LB,
    title: "Punkt vor Strich und Klammern",
    instruction: {
      1: "Berechne. Beachte Punkt vor Strich.",
      2: "Berechne. Rechne zuerst in der Klammer.",
      3: "Berechne Schritt für Schritt nach den Rechenregeln.",
    },
    merke: [
      { b: "Reihenfolge: " },
      `Zuerst Klammern, dann Punktrechnung (· und :), zuletzt Strichrechnung (+ und ${MINUS}). Beispiel: 2 + 3 · (${MINUS}4) = 2 + (${MINUS}12) = ${MINUS}10.`,
    ],
    cols: 2,
    generate: makeGenerate(verbCand),
    verify,
  });

  AG.registerType({
    id: "m7-q-vorteilhaft",
    ...LB,
    title: "Vorteilhaft rechnen",
    instruction: {
      1: "Berechne vorteilhaft. Nutze die Rechengesetze.",
      2: "Berechne vorteilhaft. Fasse passende Zahlen zusammen.",
      3: "Berechne vorteilhaft. Achte auf die Vorzeichen.",
    },
    merke: [
      { b: "Rechengesetze: " },
      "Kommutativgesetz: Zahlen dürfen umsortiert werden. Assoziativgesetz: Klammern dürfen anders gesetzt werden. Distributivgesetz: a · b + a · c = a · (b + c). Beispiel: 25 · 17 · 4 = 25 · 4 · 17 = 100 · 17 = 1700.",
    ],
    cols: 2,
    generate: makeGenerate(vorCand),
    verify,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
