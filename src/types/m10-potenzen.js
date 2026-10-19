// M10 LB 1 (Potenzen): Potenzgesetze, negative Hochzahlen, Wurzeln als Potenzen mit Bruch-Hochzahl, Logarithmus.
// Vorbilder: m7-bruchdivision.js (Rechenschritte), m9-potenzen.js (Hochzahlen als { sup }).
(function (AG) {
  const { Frac, num, rich, MINUS, fmtDec, fmtInt } = AG;

  // ---------- Hilfen ----------
  const sup = t => ({ sup: t });
  // Hochzahl als Text, z. B. −3
  const ex = n => (n < 0 ? MINUS : "") + String(Math.abs(n));
  // Potenz base^e (e: Zahl oder fertiger Text)
  const P = (base, e) => rich(String(base), sup(typeof e === "string" ? e : ex(e)));
  // Hochzahlen als Text: a + b bzw. a − b
  const sumE = (a, b) => ex(a) + (b < 0 ? " " + MINUS + " " + Math.abs(b) : " + " + b);
  const diffE = (a, b) => ex(a) + (b < 0 ? " + " + Math.abs(b) : " " + MINUS + " " + b);
  // Produkt von Hochzahlen als Text: a · b
  const mulE = (a, b) => (a < 0 ? "(" + ex(a) + ")" : ex(a)) + " · " + (b < 0 ? "(" + ex(b) + ")" : String(b));
  const SUBS = "₀₁₂₃₄₅₆₇₈₉";
  const logOf = b => rich("log" + String(b).split("").map(c => SUBS[Number(c)]).join(""));
  const powF = (f, n) => { let v = new Frac(1); for (let i = 0; i < n; i++) v = v.mul(f); return v; };
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));

  // ======================================================================
  // 1. Potenzgesetze
  // ======================================================================
  const BASES = [2, 3, 4, 5, 6, 7, 10];
  const VARS = ["x", "a", "y", "z", "b", "t"];
  const randE = (rng, level) => (level === 3 ? rng.intExcept(-5, 6, [0, 1]) : rng.int(2, 6));
  const okE = s => s !== 0 && s !== 1;

  function tryGesetz(rng, level) {
    const useVar = level === 2 || (level === 3 && rng.chance(0.5));
    const b = useVar ? rng.pick(VARS) : rng.pick(BASES);
    const kind = rng.pick(["mul", "div", "pow", "combo", "same", "samediv"]);

    if (kind === "mul") {
      const m = randE(rng, level), n = randE(rng, level), s = m + n;
      if (!okE(s) || Math.abs(s) > 12) return null;
      return {
        q: rich(P(b, m), " · ", P(b, n)),
        a: P(b, s),
        steps: [rich(P(b, m), " · ", P(b, n), " = ", P(b, sumE(m, n))), rich("= ", P(b, s))],
      };
    }

    if (kind === "div") {
      let m = randE(rng, level), n = randE(rng, level);
      if (level < 3) { m = rng.int(4, 9); n = rng.int(2, m - 2); }
      const d = m - n;
      if (m === n || !okE(d) || Math.abs(d) > 12) return null;
      return {
        q: rich(P(b, m), " : ", P(b, n)),
        a: P(b, d),
        steps: [rich(P(b, m), " : ", P(b, n), " = ", P(b, diffE(m, n))), rich("= ", P(b, d))],
      };
    }

    if (kind === "pow") {
      let m = randE(rng, level), n = randE(rng, level);
      if (level < 3) { m = rng.int(2, 4); n = rng.int(2, 3); }
      const p = m * n;
      if (!okE(p) || Math.abs(p) > 12) return null;
      return {
        q: rich("(", P(b, m), ")", sup(ex(n))),
        a: P(b, p),
        steps: [rich("(", P(b, m), ")", sup(ex(n)), " = ", P(b, mulE(m, n))), rich("= ", P(b, p))],
      };
    }

    if (kind === "combo") {
      let m = randE(rng, level), n = randE(rng, level), c = randE(rng, level);
      if (level < 3) { m = rng.int(2, 6); n = rng.int(2, 6); c = rng.int(2, m + n - 2); }
      const sum = m + n, s = sum - c;
      if (c === 0 || !okE(s) || Math.abs(s) > 12) return null;
      return {
        q: rich(P(b, m), " · ", P(b, n), " : ", P(b, c)),
        a: P(b, s),
        steps: [
          rich(P(b, m), " · ", P(b, n), " = ", P(b, sum)),
          rich(P(b, sum), " : ", P(b, c), " = ", P(b, diffE(sum, c))),
          rich("= ", P(b, s)),
        ],
      };
    }

    if (kind === "same") {
      const n = level === 3 ? rng.intExcept(-3, 4, [0, 1]) : rng.int(2, 4);
      if (useVar) {
        const y = rng.pick(VARS.filter(v => v !== b));
        return {
          q: rich(P(b, n), " · ", P(y, n)),
          a: rich("(", b, " · ", y, ")", sup(ex(n))),
          steps: [rich(P(b, n), " · ", P(y, n), " = (", b, " · ", y, ")", sup(ex(n)))],
        };
      }
      const p1 = rng.pick([2, 3, 4, 5]);
      const p2 = rng.pick([2, 3, 4, 5, 6].filter(v => v !== p1 && p1 * v <= 30));
      const prod = p1 * p2;
      return {
        q: rich(P(p1, n), " · ", P(p2, n)),
        a: P(prod, n),
        steps: [
          rich(P(p1, n), " · ", P(p2, n), " = (", String(p1), " · ", String(p2), ")", sup(ex(n))),
          rich("= ", P(prod, n)),
        ],
      };
    }

    // samediv: gleiche Hochzahl beim Dividieren
    const n = level === 3 ? rng.intExcept(-3, 4, [0, 1]) : rng.int(2, 4);
    if (useVar) {
      const y = rng.pick(VARS.filter(v => v !== b));
      return {
        q: rich("(", b, " · ", y, ")", sup(ex(n)), " : ", P(b, n)),
        a: P(y, n),
        steps: [
          rich("(", b, " · ", y, ")", sup(ex(n)), " = ", P(b, n), " · ", P(y, n)),
          rich(P(b, n), " · ", P(y, n), " : ", P(b, n), " = ", P(y, n)),
        ],
      };
    }
    const k = rng.pick([2, 3, 4, 5]);
    const d = rng.pick([2, 3, 4, 5].filter(v => v !== k));
    const prod = k * d;
    return {
      q: rich(P(prod, n), " : ", P(d, n)),
      a: P(k, n),
      steps: [
        rich(P(prod, n), " : ", P(d, n), " = (", String(prod), " : ", String(d), ")", sup(ex(n))),
        rich("= ", P(k, n)),
      ],
    };
  }

  function genGesetz(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryGesetz(rng, level);
      if (t) return t;
    }
    throw new Error("potenzgesetze: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-potenzgesetze",
    klasse: "10",
    zug: "M",
    lb: "1",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Potenzgesetze anwenden",
    instruction: {
      1: "Schreibe als eine Potenz.",
      2: "Schreibe als eine Potenz. Die Variablen stehen für positive Zahlen.",
      3: "Schreibe als eine Potenz. Achte auf die negativen Hochzahlen.",
    },
    merke: [
      "Gleiche Basis: Beim Multiplizieren werden die Hochzahlen ", { b: "addiert" }, ", beim Dividieren ", { b: "subtrahiert" },
      ": a", sup("m"), " · a", sup("n"), " = a", sup("m + n"), ";   a", sup("m"), " : a", sup("n"), " = a", sup("m − n"), ". ",
      "Potenz von einer Potenz: Hochzahlen ", { b: "multiplizieren" }, ": (a", sup("m"), ")", sup("n"), " = a", sup("m · n"),
      ". Gleiche Hochzahl: a", sup("n"), " · b", sup("n"), " = (a · b)", sup("n"), ". ",
      "Beispiel: 2", sup("3"), " · 2", sup("4"), " = 2", sup("7"), ";   (3", sup("2"), ")", sup("4"), " = 3", sup("8"),
      ";   2", sup("3"), " · 5", sup("3"), " = 10", sup("3"), ".",
    ],
    cols: 3,
    generate: genGesetz,
  });

  // ======================================================================
  // 2. Negative Exponenten
  // ======================================================================
  const BASE_ND = [2, 3, 4, 5, 6, 7, 8, 9];

  function tryNeg(rng, level) {
    if (level === 1) {
      const kind = rng.pick(["bruch", "potenz", "dezimal"]);
      if (kind === "dezimal") {
        const n = rng.int(1, 4);
        const v = new Frac(1, 10 ** n);
        return {
          q: rich("Schreibe als Dezimalzahl: ", P(10, -n)),
          a: num(v, { as: "dec" }),
          steps: [
            rich(P(10, -n), " = 1 : ", P(10, n)),
            rich("= ", { f: [1, 10 ** n] }),
            rich("= ", num(v, { as: "dec" })),
          ],
        };
      }
      const a = rng.pick(BASE_ND);
      const n = a <= 5 ? rng.int(2, 4) : rng.int(2, 3);
      const v = new Frac(1, a ** n);
      if (kind === "bruch") {
        return {
          q: rich("Schreibe als Bruch: ", P(a, -n)),
          a: num(v),
          steps: [rich(P(a, -n), " = 1 : ", P(a, n)), rich("= ", num(v))],
        };
      }
      return {
        q: rich("Schreibe als Potenz mit negativer Hochzahl: ", num(v)),
        a: P(a, -n),
        steps: [rich(num(v), " = 1 : ", P(a, n)), rich("= ", P(a, -n))],
      };
    }

    if (level === 2) {
      const kind = rng.pick(["wert", "wert", "zaehler"]);
      if (kind === "zaehler") {
        // z · a⁻ⁿ mit z nicht durch a teilbar: dann ist die Darstellung eindeutig
        const a = rng.pick([2, 3, 5]);
        const n = rng.int(2, 3);
        const cand = [];
        for (let z = 2; z < a ** n; z++) if (z % a !== 0) cand.push(z);
        const z = rng.pick(cand);
        return {
          q: rich("Schreibe in der Form z · ", String(a), sup(MINUS + "n"), ", wobei z nicht durch ", String(a),
            " teilbar ist: ", { f: [z, a ** n] }),
          a: rich(String(z), " · ", P(a, -n)),
          steps: [
            rich({ f: [z, a ** n] }, " = ", String(z), " · ", { f: [1, a ** n] }),
            rich("= ", String(z), " · ", P(a, -n)),
          ],
        };
      }
      if (rng.chance(0.5)) {
        const a = rng.pick([2, 3, 4, 5, 10]);
        const n = a === 10 ? rng.int(2, 3) : rng.int(2, 4);
        const v = new Frac(1, a ** n);
        const steps = [rich(P(a, -n), " = 1 : ", P(a, n)), rich("= ", { f: [1, a ** n] })];
        if (a === 10) steps.push(rich("= ", num(v, { as: "dec" })));
        return {
          q: rich("Berechne: ", P(a, -n)),
          a: num(v, { as: a === 10 ? "dec" : "frac" }),
          steps,
        };
      }
      // Bruch als Basis: (p/q)⁻ⁿ = (q/p)ⁿ
      const [p, q] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]);
      const n = rng.int(2, 3);
      const v = powF(new Frac(q, p), n);
      const invPart = p === 1 ? String(q) : rich("(", { f: [q, p] }, ")");
      return {
        q: rich("Berechne: (", { f: [p, q] }, ")", sup(ex(-n))),
        a: num(v),
        steps: [
          rich("(", { f: [p, q] }, ")", sup(ex(-n)), " = ", invPart, sup(ex(n))),
          rich("= ", num(v)),
        ],
      };
    }

    // Niveau 3: Summe oder Produkt zweier Potenzen mit negativer Hochzahl
    const a = rng.pick([2, 3, 4, 5, 6]);
    const b = rng.pick([2, 3, 4, 5, 6].filter(v => v !== a));
    const m = rng.int(1, 3), n = rng.int(1, 3);
    const isSum = rng.chance(0.5);
    const da = a ** m, db = b ** n;
    const A = new Frac(1, da), B = new Frac(1, db);
    const res = isSum ? A.add(B) : A.mul(B);
    if (res.isInt()) return null;
    const head = rich(P(a, -m), isSum ? " + " : " · ", P(b, -n));
    const steps = [rich(P(a, -m), " = ", { f: [1, da] }, "     ", P(b, -n), " = ", { f: [1, db] })];
    if (isSum) {
      const D = (da * db) / gcd(da, db);
      steps.push(rich({ f: [1, da] }, " + ", { f: [1, db] }, " = ", { f: [D / da, D] }, " + ", { f: [D / db, D] }));
      steps.push(rich("= ", num(res)));
    } else {
      steps.push(rich({ f: [1, da] }, " · ", { f: [1, db] }, " = ", { f: [1, da * db] }));
    }
    return { q: head, a: num(res), steps };
  }

  function genNeg(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryNeg(rng, level);
      if (t) return t;
    }
    throw new Error("negative-exponenten: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-negative-exponenten",
    klasse: "10",
    zug: "M",
    lb: "1",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Negative Hochzahlen",
    instruction: {
      1: "Schreibe als Bruch, als Dezimalzahl bzw. als Potenz mit negativer Hochzahl.",
      2: "Berechne bzw. schreibe in der angegebenen Form.",
      3: "Berechne. Gib das Ergebnis als gekürzten Bruch an (gemischte Zahl, wenn nötig).",
    },
    merke: [
      "Eine negative Hochzahl bedeutet den ", { b: "Kehrwert" }, " der Potenz mit positiver Hochzahl: a", sup(MINUS + "n"),
      " = 1 : a", sup("n"), " = 1/a", sup("n"), ". ",
      "Beispiel: 2", sup(MINUS + "3"), " = 1/2", sup("3"), " = 1/8;   10", sup(MINUS + "3"), " = 0,001;   ",
      "(2/3)", sup(MINUS + "2"), " = (3/2)", sup("2"), " = 9/4 = 2 1/4.",
    ],
    cols: 3,
    generate: genNeg,
  });

  // ======================================================================
  // 3. Wurzeln als Potenzen mit Bruch-Hochzahl
  // ======================================================================
  const ROOT = { 2: "√", 3: "³√", 4: "⁴√", 5: "⁵√" };
  const rt = (n, r) => rich(ROOT[n], String(r));
  const potBr = (a, m, n) => rich(String(a), { sup: m + "/" + n });   // Bruch-Hochzahl hochgestellt, z. B. 8 hoch 1/3
  // Hochzahl m, aber bei m = 1 weglassen
  const hoch = m => (m === 1 ? [] : [sup(String(m))]);

  function tryWurzel(rng, level) {
    const kind = level === 1 ? rng.pick(["wurzel", "zu-wurzel"])
      : level === 2 ? rng.pick(["wurzel", "zu-potenz", "zu-wurzel"])
        : rng.pick(["wert-bruch", "potenz-zu-wurzel"]);

    if (kind === "wurzel") {
      const n = level === 1 ? rng.pick([2, 3]) : rng.pick([2, 3, 4, 5]);
      const k = n === 2 ? rng.int(2, 15) : n === 3 ? rng.int(2, 10) : n === 4 ? rng.int(2, 5) : rng.int(2, 3);
      const r = k ** n;
      return {
        q: rich("Berechne: ", rt(n, r)),
        a: rich(String(k)),
        steps: [
          rich("x", sup(String(n)), " = ", String(r)),
          rich(String(k), sup(String(n)), " = ", String(r)),
          rich(rt(n, r), " = ", String(k)),
        ],
      };
    }

    if (kind === "zu-wurzel") {
      if (level === 1) {
        const n = rng.pick([2, 3]);
        const k = rng.int(2, n === 2 ? 12 : 10);
        const r = k ** n;
        return {
          q: rich("Schreibe als Wurzel und berechne: ", potBr(r, 1, n)),
          a: rich(rt(n, r), " = ", String(k)),
          steps: [rich(potBr(r, 1, n), " = ", rt(n, r)), rich(rt(n, r), " = ", String(k))],
        };
      }
      const n = rng.pick([2, 3, 4]);
      const r = rng.int(2, 30);
      return {
        q: rich("Schreibe als Wurzel: ", potBr(r, 1, n)),
        a: rt(n, r),
        steps: [rich(potBr(r, 1, n), " = ", rt(n, r))],
      };
    }

    if (kind === "zu-potenz") {
      const n = rng.pick([2, 3, 4]);
      const r = rng.int(2, 30);
      return {
        q: rich("Schreibe als Potenz mit Bruch-Hochzahl: ", rt(n, r)),
        a: potBr(r, 1, n),
        steps: [rich(rt(n, r), " = ", potBr(r, 1, n))],
      };
    }

    if (kind === "wert-bruch") {
      const n = rng.pick([2, 3, 4]);
      const k = n === 2 ? rng.int(2, 9) : n === 3 ? rng.int(2, 5) : rng.int(2, 3);
      const m = rng.intExcept(1, 5, [n]);
      if (k ** m > 1000) return null;
      const r = k ** n, res = k ** m;
      return {
        q: rich("Berechne: ", potBr(r, m, n)),
        a: rich(String(res)),
        steps: [
          rich(potBr(r, m, n), " = (", rt(n, r), ")", hoch(m)),
          m === 1
            ? rich("= ", String(res))
            : rich("= ", String(k), sup(String(m)), " = ", String(res)),
        ],
      };
    }

    // potenz-zu-wurzel: r^(m/n) = ⁿ√(r^m) mit m < n
    const n = rng.pick([3, 4, 5]);
    const m = rng.int(1, n - 1);
    const r = rng.int(2, 6);
    const rad = r ** m;
    return {
      q: rich("Schreibe als Wurzel: ", potBr(r, m, n)),
      a: rt(n, rad),
      steps: [
        rich(potBr(r, m, n), " = ", ROOT[n], "(", String(r), hoch(m), ")"),
        rich("= ", rt(n, rad)),
      ],
    };
  }

  function genWurzel(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryWurzel(rng, level);
      if (t) return t;
    }
    throw new Error("wurzel-potenz: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-wurzel-potenz",
    klasse: "10",
    zug: "M",
    lb: "1",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Wurzeln und Potenzen mit Bruch-Hochzahl",
    instruction: {
      1: "Berechne die Wurzel bzw. schreibe als Wurzel und berechne den Wert.",
      2: "Schreibe die Wurzel als Potenz mit Bruch-Hochzahl bzw. umgekehrt. Berechne die Wurzel.",
      3: "Berechne den Wert bzw. schreibe als Wurzel. Achte auf die Hochzahl m/n.",
    },
    merke: [
      "Die n-te Wurzel ist eine Potenz mit dem Kehrwert der Hochzahl: ³√a = a", sup("1/3"), ", √a = a", sup("1/2"), ", ⁴√a = a", sup("1/4"), ". ",
      "Allgemein gilt a", sup("m/n"), " = (ⁿ√a)", sup("m"), ".   Beispiel: 8", sup("2/3"), " = (³√8)", sup("2"), " = 2", sup("2"), " = 4;   ",
      "³√125 = 125", sup("1/3"), " = 5.",
    ],
    cols: 3,
    generate: genWurzel,
  });

  // ======================================================================
  // 4. Logarithmus
  // ======================================================================
  const BASE_L = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const XRANGE = { 2: [2, 9], 3: [2, 6], 4: [2, 4], 5: [2, 4], 6: [2, 3], 7: [2, 3], 8: [2, 3], 9: [2, 3], 10: [2, 4] };

  // Gleichung b^x = c bzw. Logarithmus log_b(c) mit exakt bekanntem x (c = b^x)
  function caseOf(b, x, kind) {
    const c = x >= 0 ? new Frac(b ** x) : new Frac(1, b ** -x);
    const cs = (b === 10 && x < 0) ? num(c, { as: "dec" }) : num(c);
    const xs = ex(x);
    if (kind === "exp") {
      return {
        q: rich("Bestimme x: ", P(b, "x"), " = ", cs),
        a: rich("x = ", xs),
        steps: [rich(cs, " = ", P(b, xs)), rich("x = ", xs)],
      };
    }
    const wrap = (c.isInt() || (b === 10 && x < 0)) ? cs : rich("(", cs, ")");
    return {
      q: rich("Berechne: ", logOf(b), " ", wrap),
      a: rich(xs),
      steps: [rich(cs, " = ", P(b, xs)), rich(logOf(b), " ", wrap, " = ", xs)],
    };
  }

  function tryLog(rng, level) {
    if (level === 1) {
      const b = rng.pick(BASE_L);
      const [lo, hi] = XRANGE[b];
      return caseOf(b, rng.int(lo, hi), rng.pick(["exp", "log"]));
    }
    if (level === 2) {
      const b = rng.pick([2, 3, 5, 10]);
      const x = b === 10 ? rng.intExcept(-3, 4, [0, 1]) : rng.intExcept(-3, 6, [0, 1]);
      return caseOf(b, x, rng.pick(["exp", "log"]));
    }
    // Niveau 3: b^x = c mit x = log c : log b, Ergebnis ≈ 2 Nachkommastellen
    const b = rng.pick([2, 3, 5, 10]);
    const c = rng.int(3, 300);
    let isPow = false;
    for (let k = 0; b ** k <= c; k++) if (b ** k === c) isPow = true;
    if (isPow) return null;
    const exact = Math.log10(c) / Math.log10(b);
    if (Math.abs((exact * 100) % 1 - 0.5) < 0.25) return null;   // Rundung eindeutig halten
    const xr = Math.round(exact * 100) / 100;
    const lc = Math.round(Math.log10(c) * 10000) / 10000;
    const lb = Math.round(Math.log10(b) * 10000) / 10000;
    return {
      q: rich("Bestimme x. Runde auf zwei Nachkommastellen: ", P(b, "x"), " = ", String(c)),
      a: rich("x ≈ ", fmtDec(Frac.of(xr), 2)),
      steps: [
        rich(P(b, "x"), " = ", String(c)),
        rich("x = log ", String(c), " : log ", String(b)),
        rich("x = ", fmtDec(Frac.of(lc)), " : ", fmtDec(Frac.of(lb)), " ≈ ", fmtDec(Frac.of(xr), 2)),
      ],
    };
  }

  function genLog(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryLog(rng, level);
      if (t) return t;
    }
    throw new Error("logarithmus: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-logarithmus",
    klasse: "10",
    zug: "M",
    lb: "1",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Logarithmus",
    instruction: {
      1: "Bestimme die Hochzahl x bzw. den Logarithmus.",
      2: "Bestimme x bzw. den Logarithmus. Achte auf negative Ergebnisse.",
      3: "Bestimme x mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Der Logarithmus ist die Umkehrung des Potenzierens. Allgemein: log_b c = x bedeutet b", sup("x"), " = c. ",
      "Beispiel: log₂ 32 = 5, weil 2", sup("5"), " = 32;   log₁₀ 1000 = 3, weil 10", sup("3"), " = 1000.   ",
      "Mit dem Taschenrechner: 2", sup("x"), " = 10 ⇒ x = log 10 : log 2 ≈ 3,32.",
    ],
    cols: 3,
    generate: genLog,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
