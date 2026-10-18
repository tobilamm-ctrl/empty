// M5 LB 1.2: Grundrechenarten mit natürlichen Zahlen – Rechenregeln. Vier Aufgabentypen:
// Punkt vor Strich und Klammern, vorteilhaft rechnen, Fachbegriffe, Sachaufgaben.
// Nur natürliche Zahlen; alle Zwischenergebnisse ganzzahlig und ≥ 0; Divisionen gehen auf.
(function (AG) {
  const { rich, num, MINUS } = AG;

  const LB = { klasse: "5", zug: "RM", lb: "1.2", lbTitle: "Grundrechenarten mit natürlichen Zahlen", topic: "zahlen" };
  const OPTXT = { "+": " + ", "-": " " + MINUS + " ", "*": " · ", "/": " : " };
  const PREC = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const APPLY = { "+": (a, b) => a + b, "-": (a, b) => a - b, "*": (a, b) => a * b, "/": (a, b) => a / b };

  // ---------- Ausdrucksbaum (nur ganze Zahlen) ----------
  // Blatt: { v: Zahl }; Knoten: { op, l, r, br } – br: Klammer um den ganzen Knoten
  const isLeaf = n => n.v !== undefined;
  const leaf = v => ({ v });
  const bin = (op, l, r, br = false) => ({ op, l, r, br });
  const ev = n => (isLeaf(n) ? n.v : APPLY[n.op](ev(n.l), ev(n.r)));
  const leaves = (n, out = []) => {
    if (isLeaf(n)) out.push(n.v);
    else { leaves(n.l, out); leaves(n.r, out); }
    return out;
  };
  const ser = n => (isLeaf(n) ? { v: n.v } : { o: n.op, l: ser(n.l), r: ser(n.r) });
  const evalOps = s => (s.v !== undefined ? s.v : APPLY[s.o](evalOps(s.l), evalOps(s.r)));
  const nr = v => num(v, { as: "int" }); // ganze Zahl (Tausenderpunkt erst ab 5 Stellen, wie in der ganzen App)

  // Klammern nur dort, wo sie nötig sind; rechts von gleichrangigem Zeichen immer (a − (b + c), a · (b : c))
  function needsParens(c, p, right) {
    if (isLeaf(c) || c.br) return false;
    if (PREC[c.op] < PREC[p.op]) return true;
    return PREC[c.op] === PREC[p.op] && right;
  }
  function rend(n) {
    if (isLeaf(n)) return nr(n.v);
    const part = (c, right) => (needsParens(c, n, right) ? rich("(", rend(c), ")") : rend(c));
    const body = rich(part(n.l, false), OPTXT[n.op], part(n.r, true));
    return n.br ? rich("(", body, ")") : body;
  }

  // Nächster Rechenschritt: zuerst Klammern, dann Punkt, dann Strich, sonst von links
  function pickNext(root) {
    const cand = [];
    (function walk(n, inBr) {
      if (isLeaf(n)) return;
      const flag = inBr || n.br;
      walk(n.l, flag);
      walk(n.r, flag);
      if (isLeaf(n.l) && isLeaf(n.r)) cand.push({ n, flag });
    })(root, false);
    cand.sort((x, y) => Number(y.flag) - Number(x.flag) || PREC[y.n.op] - PREC[x.n.op]);
    return cand[0].n;
  }
  function replaceNode(n, target, repl) {
    if (n === target) return repl;
    if (isLeaf(n)) return n;
    return { op: n.op, l: replaceNode(n.l, target, repl), r: replaceNode(n.r, target, repl), br: n.br };
  }
  // Jede Zeile zeigt den ganzen restlichen Ausdruck nach einem Rechenschritt
  function reductionSteps(tree) {
    const steps = [];
    let cur = tree;
    while (!isLeaf(cur)) {
      const t = pickNext(cur);
      cur = replaceNode(cur, t, leaf(APPLY[t.op](t.l.v, t.r.v)));
      steps.push(rich("= ", isLeaf(cur) ? nr(cur.v) : rend(cur)));
    }
    return steps;
  }
  // Term zuerst, dann rechnen
  const termFirst = tree => [rich("= ", rend(tree)), ...reductionSteps(tree)];

  // Prüfung: alle Zahlen ≥ 2, jedes Zwischenergebnis ganz und ≥ 0, Divisionen gehen auf, keine Trivialaufgaben
  function sane(tree, bound) {
    if (!leaves(tree).every(v => Number.isInteger(v) && v >= 2 && v <= 999)) return false;
    let ok = true;
    (function walk(n) {
      if (!ok || isLeaf(n)) return;
      walk(n.l);
      walk(n.r);
      if (!ok) return;
      const a = ev(n.l), b = ev(n.r);
      if (n.op === "-" && a < b) ok = false;
      if (n.op === "/" && (b === 0 || a % b !== 0)) ok = false;
      if (a === b) ok = false;                                            // a − a, a : a, a + a
      if ((n.op === "*" || n.op === "/") && (a === 1 || b === 1)) ok = false; // · 1, : 1
      const r = APPLY[n.op](a, b);
      if (!Number.isInteger(r) || r < 0 || r > bound) ok = false;
    })(tree);
    return ok;
  }

  // Wrapper: Kandidat erzeugen, bis er die Prüfungen besteht.
  // cand liefert { tree, q?, steps? }; ohne q/steps: Ausdruck und Schritt für Schritt.
  function makeGenerate(cand, bound) {
    return function generate(rng, level) {
      for (let i = 0; i < 500; i++) {
        const c = cand(rng, level);
        if (!c || !sane(c.tree, bound)) continue;
        const res = ev(c.tree);
        return {
          q: c.q || rend(c.tree),
          a: nr(res),
          steps: c.steps || reductionSteps(c.tree),
          _ops: ser(c.tree),
          _res: res,
        };
      }
      throw new Error("Keine passende Aufgabe gefunden (Niveau " + level + ")");
    };
  }

  // Rechnung unabhängig nachrechnen; letzte Zeile der Lösung muss beim Ergebnis stehen
  function verify(task) {
    if (task._res === undefined) return "kein Ergebnis";
    if (evalOps(task._ops) !== task._res) return "Rechnung weicht ab";
    const last = AG.plain(task.steps[task.steps.length - 1]);
    if (last !== "= " + AG.plain(task.a)) return "Lösungsschritte enden nicht beim Ergebnis";
    return true;
  }

  // ---------- Typ 1: Punkt vor Strich und Klammern ----------
  function pvsCand(rng, level) {
    if (level === 1) {
      // drei Zahlen, ein Punkt- und ein Strichrechenzeichen: 48 − 6 · 5, 12 + 3 · 4, 60 : 5 + 7
      const opP = rng.pick(["*", "*", "/"]);
      let P;
      if (opP === "*") P = bin("*", leaf(rng.int(2, 12)), leaf(rng.int(2, 12)));
      else { const x = rng.int(2, 12), y = rng.int(2, 12); P = bin("/", leaf(x * y), leaf(x)); }
      const S = leaf(rng.int(2, 99));
      const opS = rng.pick(["+", "-"]);
      return { tree: rng.chance(0.5) ? bin(opS, P, S) : bin(opS, S, P) };
    }
    if (level === 2) {
      // eine Klammer, vier Zahlen: (a ± b) · x ± c oder (a ± b) : d ± c
      const bop = rng.pick(["+", "-"]);
      const B = bin(bop, leaf(rng.int(5, 60)), leaf(rng.int(2, 30)), true);
      const vB = ev(B);
      let M;
      if (rng.chance(0.5)) {
        const x = leaf(rng.int(2, 12));
        M = rng.chance(0.5) ? bin("*", B, x) : bin("*", x, B);
      } else {
        const divs = [];
        for (let d = 2; d < vB; d++) if (vB % d === 0) divs.push(d);
        if (!divs.length) return null;
        M = bin("/", B, leaf(rng.pick(divs)));
      }
      const opT = rng.pick(["+", "-"]);
      const w = leaf(rng.int(2, 60));
      return { tree: rng.chance(0.5) ? bin(opT, M, w) : bin(opT, w, M) };
    }
    // Niveau 3: zwei Klammern, fünf Zahlen: (a ± b) · x ± (c ± d) bzw. (a ± b) : x ± (c ± d)
    const B1 = bin(rng.pick(["+", "-"]), leaf(rng.int(5, 60)), leaf(rng.int(2, 30)), true);
    const B2 = bin(rng.pick(["+", "-"]), leaf(rng.int(5, 60)), leaf(rng.int(2, 30)), true);
    const v1 = ev(B1);
    let M;
    if (rng.chance(0.5)) {
      const x = leaf(rng.int(2, 9));
      M = rng.chance(0.5) ? bin("*", B1, x) : bin("*", x, B1);
    } else {
      const divs = [];
      for (let d = 2; d < v1; d++) if (v1 % d === 0) divs.push(d);
      if (!divs.length) return null;
      M = bin("/", B1, leaf(rng.pick(divs)));
    }
    const opT = rng.pick(["+", "-"]);
    return { tree: rng.chance(0.5) ? bin(opT, M, B2) : bin(opT, B2, M) };
  }

  // ---------- Typ 2: Vorteilhaft rechnen ----------
  const PAIRS = [[4, 25], [5, 2], [2, 50], [20, 5], [25, 4], [50, 2], [5, 20]]; // Produkt rund
  const ROUND = [10, 20, 50, 100];                                              // Summe rund

  // (p op q) op c mit p, q zusammen rund. order: Reihenfolge der Zahlen in der Aufgabe.
  function regroup3(order, p, q, c, op) {
    const tree = bin(op, bin(op, leaf(order[0]), leaf(order[1])), leaf(order[2]));
    const steps = [];
    if (order[0] !== p || order[1] !== q) steps.push(rich("= ", nr(p), OPTXT[op], nr(q), OPTXT[op], nr(c)));
    steps.push(rich("= (", nr(p), OPTXT[op], nr(q), ")", OPTXT[op], nr(c)));
    const mid = APPLY[op](p, q);
    steps.push(rich("= ", nr(mid), OPTXT[op], nr(c)));
    steps.push(rich("= ", nr(APPLY[op](mid, c))));
    return { tree, steps };
  }
  // Kommutativ- und Assoziativgesetz: 25 · 17 · 4 = 25 · 4 · 17 = (25 · 4) · 17 = 100 · 17 = 1700
  function mul3(rng) {
    const [a, b] = rng.pick(PAIRS);
    let c = rng.int(11, 49);
    if (c % 10 === 0) c++;
    const order = rng.pick([[a, c, b], [c, a, b], [a, b, c]]);
    return regroup3(order, a, b, c, "*");
  }
  // 37 + 48 + 63 = 37 + 63 + 48 = (37 + 63) + 48 = 100 + 48 = 148
  function add3(rng) {
    const N = rng.pick(ROUND);
    const p = rng.int(N >= 40 ? 11 : 3, N - (N >= 40 ? 11 : 3)), q = N - p;
    if (p === q) return null;
    const c = rng.int(11, 99);
    const order = rng.pick([[p, c, q], [c, p, q], [p, q, c]]);
    return regroup3(order, p, q, c, "+");
  }
  // a · N ± d = a · (N ± d) → a · N ± a · d: 12 · 99 = 12 · (100 − 1) = 12 · 100 − 12 = 1200 − 12 = 1188
  function dist(rng, aMin, aMax, Ns, dMax) {
    const a = rng.int(aMin, aMax), N = rng.pick(Ns), d = rng.int(1, dMax);
    const plus = rng.chance(0.5);
    const sop = plus ? "+" : "-";
    const inner = plus ? N + d : N - d;
    const tree = bin("*", leaf(a), leaf(inner));
    const steps = [
      rich("= ", nr(a), OPTXT["*"], "(", nr(N), OPTXT[sop], nr(d), ")"),
      rich("= ", nr(a), OPTXT["*"], nr(N), OPTXT[sop], nr(a), d === 1 ? "" : rich(OPTXT["*"], nr(d))),
      rich("= ", nr(a * N), OPTXT[sop], nr(a * d)),
      rich("= ", nr(a * inner)),
    ];
    return { tree, steps };
  }
  // a · b + a · c = a · (b + c) = a · N: 7 · 13 + 7 · 7 = 7 · (13 + 7) = 7 · 20 = 140
  function distRev(rng, aMin, aMax, Ns) {
    const a = rng.int(aMin, aMax), N = rng.pick(Ns);
    const b = rng.int(2, N - 2), c = N - b;
    if (b === c) return null;
    const tree = bin("+", bin("*", leaf(a), leaf(b)), bin("*", leaf(a), leaf(c)));
    const steps = [
      rich("= ", nr(a), OPTXT["*"], "(", nr(b), OPTXT["+"], nr(c), ")"),
      rich("= ", nr(a), OPTXT["*"], nr(N)),
      rich("= ", nr(a * N)),
    ];
    return { tree, steps };
  }
  // 37 + 48 + 63 + 52 = (37 + 63) + (48 + 52) = 100 + 100 = 200
  function add4(rng) {
    const N1 = rng.pick([50, 100]), N2 = rng.pick([50, 100]);
    const p = rng.int(2, N1 - 2), q = N1 - p;
    const r = rng.int(2, N2 - 2), s = N2 - r;
    const order = rng.pick([[p, r, q, s], [r, p, s, q], [p, s, r, q]]);
    const tree = bin("+", bin("+", bin("+", leaf(order[0]), leaf(order[1])), leaf(order[2])), leaf(order[3]));
    const steps = [];
    if (order.some((v, i) => v !== [p, q, r, s][i])) steps.push(rich("= ", nr(p), OPTXT["+"], nr(q), OPTXT["+"], nr(r), OPTXT["+"], nr(s)));
    steps.push(rich("= (", nr(p), OPTXT["+"], nr(q), ")", OPTXT["+"], "(", nr(r), OPTXT["+"], nr(s), ")"));
    steps.push(rich("= ", nr(N1), OPTXT["+"], nr(N2)));
    steps.push(rich("= ", nr(N1 + N2)));
    return { tree, steps };
  }

  function vorCand(rng, level) {
    if (level === 1) return rng.pick([() => mul3(rng), () => dist(rng, 3, 12, [100], 2)])();
    if (level === 2) return rng.pick([() => add3(rng), () => mul3(rng), () => distRev(rng, 2, 12, ROUND)])();
    return rng.pick([() => add4(rng), () => dist(rng, 11, 35, [50, 100], 3), () => distRev(rng, 11, 35, [50, 100])])();
  }

  // ---------- Typ 3: Fachbegriffe Summe, Differenz, Produkt, Quotient ----------
  // Zusammengesetzte Terme mit Wortlaut: ph = Bezeichnung als Text, tree = Term
  const COMP = [
    rng => { // das Produkt aus der Summe von a und b und der Zahl c
      const a = rng.int(3, 50), b = rng.int(3, 50), c = rng.int(2, 12);
      return { tree: bin("*", bin("+", leaf(a), leaf(b), true), leaf(c)),
        ph: rich("das Produkt aus der Summe von ", nr(a), " und ", nr(b), " und der Zahl ", nr(c)) };
    },
    rng => { // der Quotient aus der Differenz von a und b und der Zahl c
      const c = rng.int(2, 9), k = rng.int(2, 12), b = rng.int(5, 60), a = b + c * k;
      return { tree: bin("/", bin("-", leaf(a), leaf(b), true), leaf(c)),
        ph: rich("der Quotient aus der Differenz von ", nr(a), " und ", nr(b), " und der Zahl ", nr(c)) };
    },
    rng => { // die Differenz aus a und dem Produkt von b und c
      const b = rng.int(2, 12), c = rng.int(2, 12), a = rng.int(b * c + 10, 300);
      return { tree: bin("-", leaf(a), bin("*", leaf(b), leaf(c))),
        ph: rich("die Differenz aus ", nr(a), " und dem Produkt von ", nr(b), " und ", nr(c)) };
    },
    rng => { // die Summe aus dem Produkt von a und b und der Zahl c
      const a = rng.int(2, 12), b = rng.int(2, 12), c = rng.int(10, 200);
      return { tree: bin("+", bin("*", leaf(a), leaf(b)), leaf(c)),
        ph: rich("die Summe aus dem Produkt von ", nr(a), " und ", nr(b), " und der Zahl ", nr(c)) };
    },
    rng => { // die Summe aus dem Quotienten von a und b und der Zahl c
      const b = rng.int(2, 9), k = rng.int(2, 12), a = b * k, c = rng.int(10, 100);
      return { tree: bin("+", bin("/", leaf(a), leaf(b)), leaf(c)),
        ph: rich("die Summe aus dem Quotienten von ", nr(a), " und ", nr(b), " und der Zahl ", nr(c)) };
    },
    rng => { // das Produkt aus der Differenz von a und b und der Zahl c
      const a = rng.int(20, 80), b = rng.int(2, a - 10), c = rng.int(2, 9);
      return { tree: bin("*", bin("-", leaf(a), leaf(b), true), leaf(c)),
        ph: rich("das Produkt aus der Differenz von ", nr(a), " und ", nr(b), " und der Zahl ", nr(c)) };
    },
  ];
  const COMP_L2 = [0, 2, 3, 4, 5];   // Niveau 2: Summe, Differenz, Produkt, Quotient zusammen
  const COMP_L3 = [1, 4, 5, 0, 2];   // Niveau 3: mit Quotient bzw. Differenz in Klammern

  function fbCand(rng, level) {
    const c = fbRaw(rng, level);
    return c && !c.steps ? { ...c, steps: termFirst(c.tree) } : c;
  }
  function fbRaw(rng, level) {
    if (level === 1) {
      const k = rng.pick(["sum", "diff", "prod", "quot"]);
      if (k === "sum") {
        const a = rng.int(100, 999), b = rng.int(20, 899);
        return { tree: bin("+", leaf(a), leaf(b)), q: rich("Berechne die Summe aus ", nr(a), " und ", nr(b), ".") };
      }
      if (k === "diff") {
        const a = rng.int(200, 999), b = rng.int(20, a - 20);
        return { tree: bin("-", leaf(a), leaf(b)), q: rich("Berechne die Differenz aus ", nr(a), " und ", nr(b), ".") };
      }
      if (k === "prod") {
        const a = rng.int(11, 25), b = rng.int(3, 12);
        return { tree: bin("*", leaf(a), leaf(b)), q: rich("Berechne das Produkt aus ", nr(a), " und ", nr(b), ".") };
      }
      const b = rng.int(3, 12), q2 = rng.int(3, 25);
      return { tree: bin("/", leaf(b * q2), leaf(b)), q: rich("Berechne den Quotienten aus ", nr(b * q2), " und ", nr(b), ".") };
    }
    if (level === 2) {
      const { tree, ph } = rng.pick(COMP_L2.map(i => COMP[i]))(rng);
      return { tree, q: rich("Berechne: ", ph, "."), steps: termFirst(tree) };
    }
    // Niveau 3: Text zu Term und berechnen, oder Term mit Worten beschreiben und berechnen
    const { tree, ph } = rng.pick(COMP_L3.map(i => COMP[i]))(rng);
    if (rng.chance(0.5)) return { tree, q: rich("Stelle einen Term auf und berechne ihn: ", ph, "."), steps: termFirst(tree) };
    return { tree, q: rich("Schreibe den Term mit Worten und berechne ihn: ", rend(tree), "."),
      steps: [rich("Mit Worten: ", ph), ...reductionSteps(tree)] };
  }

  // ---------- Typ 4: Sachaufgaben ----------
  const ANT = (...t) => rich("Antwort: ", ...t);
  const S1 = [
    rng => { // Busse
      const n = rng.int(2, 6), k = rng.int(20, 30), r = n * k;
      return {
        q: rich("Die Klasse 5b fährt mit ", nr(n), " Bussen zum Sportfest. In jedem Bus sitzen ", nr(k), " Kinder. Wie viele Kinder fahren insgesamt mit?"),
        a: rich(nr(r), " Kinder"),
        steps: [rich(nr(n), " · ", nr(k), " = ", nr(r)), ANT("Insgesamt fahren ", nr(r), " Kinder mit.")],
      };
    },
    rng => { // Einkauf
      const n = rng.int(3, 8), p = rng.int(2, 6), r = n * p;
      return {
        q: rich("Für das Sportfest kauft die Klasse ", nr(n), " Packungen Wasser. Eine Packung kostet ", nr(p), " €. Wie viel € kosten alle Packungen zusammen?"),
        a: rich(nr(r), " €"),
        steps: [rich(nr(n), " · ", nr(p), " € = ", nr(r), " €"), ANT("Alle Packungen kosten zusammen ", nr(r), " €.")],
      };
    },
    rng => { // Teilen
      const n = rng.pick([4, 5, 6, 8, 10]), x = rng.int(20, 90), t = n * x;
      return {
        q: rich("Für die Klassenfahrt bezahlen ", nr(n), " Kinder zusammen ", nr(t), " €. Alle zahlen gleich viel. Wie viel € zahlt ein Kind?"),
        a: rich(nr(x), " €"),
        steps: [rich(nr(t), " € : ", nr(n), " = ", nr(x), " €"), ANT("Ein Kind zahlt ", nr(x), " €.")],
      };
    },
    rng => { // Addition
      const a = rng.int(12, 45), b = rng.int(15, 60), r = a + b;
      return {
        q: rich("Am Montag sammeln die Kinder ", nr(a), " € für den Ausflug. Am Dienstag kommen ", nr(b), " € dazu. Wie viel € sind es insgesamt?"),
        a: rich(nr(r), " €"),
        steps: [rich(nr(a), " € + ", nr(b), " € = ", nr(r), " €"), ANT("Insgesamt sind es ", nr(r), " €.")],
      };
    },
    rng => { // Subtraktion
      const a = rng.int(100, 300), b = rng.int(20, a - 20), r = a - b;
      return {
        q: rich("Die Klasse hat ", nr(a), " € für den Ausflug. Der Bus kostet ", nr(b), " €. Wie viel € bleiben übrig?"),
        a: rich(nr(r), " €"),
        steps: [rich(nr(a), " € ", MINUS, " ", nr(b), " € = ", nr(r), " €"), ANT("Es bleiben ", nr(r), " € übrig.")],
      };
    },
  ];
  const S2 = [
    rng => { // Klassenfahrt: Kosten auf Kinder aufteilen
      const n = rng.pick([4, 5, 6, 8, 10, 12]), b = n * rng.int(10, 60), u = n * rng.int(10, 60);
      const t = b + u, x = t / n;
      return {
        q: rich("Die Busfahrt kostet ", nr(b), " €, die Unterkunft kostet ", nr(u), " €. Die ", nr(n), " Kinder teilen die Kosten gleich auf. Wie viel € zahlt jedes Kind?"),
        a: rich(nr(x), " €"),
        steps: [rich(nr(b), " € + ", nr(u), " € = ", nr(t), " €"), rich(nr(t), " € : ", nr(n), " = ", nr(x), " €"),
          ANT("Jedes Kind zahlt ", nr(x), " €.")],
      };
    },
    rng => { // Einkauf mit Rückgeld
      const n = rng.int(2, 4), p = rng.int(8, 15), c = n * p;
      const sum = [20, 50, 100].find(v => v > c), r = sum - c;
      return {
        q: rich("Lena kauft ", nr(n), " Bücher. Ein Buch kostet ", nr(p), " €. Sie bezahlt mit einem Schein über ", nr(sum), " €. Wie viel € bekommt sie zurück?"),
        a: rich(nr(r), " €"),
        steps: [rich(nr(n), " · ", nr(p), " € = ", nr(c), " €"), rich(nr(sum), " € ", MINUS, " ", nr(c), " € = ", nr(r), " €"),
          ANT("Lena bekommt ", nr(r), " € zurück.")],
      };
    },
    rng => { // Personen in Bussen
      const b = rng.int(2, 6), k = rng.int(20, 28), l = rng.int(1, 3), s = k + l, t = b * s;
      return {
        q: rich("Die Klasse fährt mit ", nr(b), " Bussen zum Sportfest. In jedem Bus sitzen ", nr(k), " Kinder und ", nr(l), " Begleitpersonen. Wie viele Personen fahren insgesamt mit?"),
        a: rich(nr(t), " Personen"),
        steps: [rich(nr(k), " + ", nr(l), " = ", nr(s), " Personen pro Bus"), rich(nr(b), " · ", nr(s), " = ", nr(t)),
          ANT("Insgesamt fahren ", nr(t), " Personen mit.")],
      };
    },
    rng => { // Busfahrten zum Schwimmbad
      const d = rng.int(3, 5), m = rng.int(2, 4), p = rng.int(2, 9), f = d * m, t = f * p;
      return {
        q: rich("Der Schulbus fährt an ", nr(d), " Tagen jeweils ", nr(m), " Mal zum Schwimmbad. Eine Fahrt kostet ", nr(p), " €. Wie viel € kostet das insgesamt?"),
        a: rich(nr(t), " €"),
        steps: [rich(nr(d), " · ", nr(m), " = ", nr(f), " Fahrten"), rich(nr(f), " · ", nr(p), " € = ", nr(t), " €"),
          ANT("Die Fahrten kosten insgesamt ", nr(t), " €.")],
      };
    },
  ];
  const S3 = [
    rng => { // Einkauf für das Sportfest, Rest der Klassenkasse
      const n = rng.int(2, 5), p = rng.int(3, 6), m = rng.int(2, 4), q = rng.int(2, 5);
      const s = rng.pick([60, 100]), w = n * p, x = m * q, t = w + x, r = s - t; // t ≤ 50 < s: Rest immer > 0
      return {
        q: rich("Für das Sportfest kauft die Klasse ", nr(n), " Packungen Wasser zu je ", nr(p), " € und ", nr(m), " Packungen Saft zu je ", nr(q), " €. Die Klasse hat ", nr(s), " € Geld. Wie viel € bleiben übrig?"),
        a: rich(nr(r), " €"),
        steps: [rich(nr(n), " · ", nr(p), " € + ", nr(m), " · ", nr(q), " € = ", nr(w), " € + ", nr(x), " €"),
          rich(nr(t), " €"), rich(nr(s), " € ", MINUS, " ", nr(t), " € = ", nr(r), " €"),
          ANT("Es bleiben ", nr(r), " € übrig.")],
      };
    },
    rng => { // Ausflug: Eintritt und Busfahrten
      const k = rng.int(20, 28), e = rng.int(3, 6), m = rng.int(2, 4), f = rng.int(10, 20);
      const E = k * e, B = m * f, G = E + B;
      return {
        q: rich("Die Klasse 5a besteht aus ", nr(k), " Kindern. Jedes Kind zahlt ", nr(e), " € Eintritt für das Schwimmbad. Dazu kommen ", nr(m), " Busfahrten zu je ", nr(f), " €. Wie viel € kostet der Ausflug insgesamt?"),
        a: rich(nr(G), " €"),
        steps: [rich("Eintritt: ", nr(k), " · ", nr(e), " € = ", nr(E), " €"), rich("Busfahrten: ", nr(m), " · ", nr(f), " € = ", nr(B), " €"),
          rich("Gesamt: ", nr(E), " € + ", nr(B), " € = ", nr(G), " €"), ANT("Der Ausflug kostet insgesamt ", nr(G), " €.")],
      };
    },
    rng => { // Schulkiosk: Rückgeld
      const n = rng.int(2, 4), p = rng.int(6, 9), m = rng.int(1, 3), q = rng.int(3, 5);
      const A = n * p, B = m * q, s = [20, 50, 100].find(v => v > A + B), r = s - A - B;
      return {
        q: rich("Im Kino kostet eine Karte ", nr(p), " € und eine Tüte Popcorn ", nr(q), " €. Lena kauft ", nr(n), " Karten und ", nr(m), m === 1 ? " Tüte" : " Tüten", " Popcorn und bezahlt mit ", nr(s), " €. Wie viel € bekommt sie zurück?"),
        a: rich(nr(r), " €"),
        steps: [rich("Karten: ", nr(n), " · ", nr(p), " € = ", nr(A), " €"), rich("Popcorn: ", nr(m), " · ", nr(q), " € = ", nr(B), " €"),
          rich("Rückgeld: ", nr(s), " € ", MINUS, " ", nr(A), " € ", MINUS, " ", nr(B), " € = ", nr(r), " €"),
          ANT("Lena bekommt ", nr(r), " € zurück.")],
      };
    },
  ];
  const SACH = { 1: S1, 2: S2, 3: S3 };

  function verifySach(task) {
    const last = AG.plain(task.steps[task.steps.length - 1]);
    if (!last.startsWith("Antwort: ")) return "Antwortsatz fehlt";
    if (!last.includes(AG.plain(task.a).split(" ")[0])) return "Antwortsatz passt nicht zum Ergebnis";
    return true;
  }

  // ---------- Registrierung ----------
  AG.registerType({
    id: "m5-punkt-vor-strich",
    ...LB,
    title: "Punkt vor Strich und Klammern",
    instruction: {
      1: "Berechne. Beachte Punkt vor Strich.",
      2: "Berechne. Rechne zuerst in der Klammer.",
      3: "Berechne Schritt für Schritt. Beachte die Klammern.",
    },
    merke: [
      { b: "Reihenfolge: " },
      "Zuerst Klammern, dann Punktrechnung (· und :), zuletzt Strichrechnung (+ und " + MINUS + "). Beispiel: 48 " + MINUS + " 6 · 5 = 48 " + MINUS + " 30 = 18 und (48 " + MINUS + " 6) · 5 = 42 · 5 = 210.",
    ],
    cols: 3,
    generate: makeGenerate(pvsCand, 1000),
    verify,
  });

  AG.registerType({
    id: "m5-vorteilhaft",
    ...LB,
    title: "Vorteilhaft rechnen",
    instruction: {
      1: "Berechne vorteilhaft. Nutze die Rechengesetze.",
      2: "Berechne vorteilhaft. Fasse passende Zahlen zusammen.",
      3: "Berechne vorteilhaft. Zerlege die Zahlen geschickt.",
    },
    merke: [
      { b: "Rechengesetze: " },
      "Vertauschen und Zusammenfassen dürfen Zahlen umgeordnet werden. Beispiel: 25 · 17 · 4 = 25 · 4 · 17 = 100 · 17 = 1700. Zerlegen mit dem Distributivgesetz: 12 · 99 = 12 · 100 " + MINUS + " 12 = 1188.",
    ],
    cols: 2,
    generate: makeGenerate(vorCand, 2000),
    verify,
  });

  AG.registerType({
    id: "m5-fachbegriffe",
    ...LB,
    title: "Summe, Differenz, Produkt, Quotient",
    instruction: {
      1: "Berechne die Summe, die Differenz, das Produkt oder den Quotienten.",
      2: "Schreibe zuerst den Term auf. Berechne dann.",
      3: "Stelle den Term auf oder schreibe ihn mit Worten. Berechne dann.",
    },
    merke: [
      { b: "Fachbegriffe: " },
      "Summe: a + b. Differenz: a " + MINUS + " b (größere Zahl zuerst). Produkt: a · b. Quotient: a : b. Beispiel: die Summe aus 345 und 78 = 345 + 78 = 423.",
    ],
    cols: 2,
    generate: makeGenerate(fbCand, 1000),
    verify,
  });

  AG.registerType({
    id: "m5-sachaufgaben",
    ...LB,
    title: "Sachaufgaben zu den Grundrechenarten",
    instruction: {
      1: "Löse die Aufgabe. Schreibe die Rechnung und einen Antwortsatz.",
      2: "Löse die Aufgabe in zwei Schritten. Schreibe die Rechnungen und einen Antwortsatz.",
      3: "Löse die Aufgabe in mehreren Schritten. Beachte Punkt vor Strich. Schreibe einen Antwortsatz.",
    },
    merke: [
      { b: "Sachaufgaben: " },
      "Frage lesen, Rechnung aufstellen, rechnen, mit einem Antwortsatz antworten. Beispiel: 4 Busse mit je 28 Kindern: 4 · 28 = 112. Antwort: Es fahren 112 Kinder mit.",
    ],
    cols: 1,
    generate(rng, level) {
      return rng.pick(SACH[level])(rng);
    },
    verify: verifySach,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
