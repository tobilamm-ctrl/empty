// M10 LB 7 (Funktionen und Gleichungen), nur M-Zug: binomische Formeln, quadratische Gleichungen
// (Lösungsformel), Faktorisieren ohne Formel, quadratische Sachaufgaben, Bruchgleichungen.
(function (AG) {
  const { Frac, num, rich, MINUS, plain } = AG;

  // ---------- Hilfen ----------
  const S = n => String(n);
  const sgnTxt = n => (n < 0 ? MINUS + S(-n) : S(n));                  // ganze Zahl mit Minuszeichen
  const par = n => (n < 0 ? "(" + sgnTxt(n) + ")" : S(n));             // negative Zahl in Klammern
  const opTxt = s => (s > 0 ? " + " : " " + MINUS + " ");               // Vorzeichen zwischen Gliedern
  const dec = v => (v < 0 ? MINUS : "") + String(Math.abs(v)).replace(".", ",");   // endliche Dezimalzahl
  const dec2 = v => (v < 0 ? MINUS : "") + Math.abs(v).toFixed(2).replace(".", ","); // gerundet auf 2 Stellen
  const nz = (rng, hi) => (rng.chance(0.5) ? -1 : 1) * rng.int(1, hi);  // ganze Zahl ungleich 0
  const numTxt = r => plain(num(r));
  // Lösungsmenge als Text, aufsteigend sortiert; leer: ∅
  const lset = roots => (roots.length
    ? "L = {" + roots.slice().sort((x, y) => x - y).map(numTxt).join("; ") + "}"
    : "L = ∅");
  const lastIs = t => (plain(t.steps[t.steps.length - 1]) === plain(t.a) || "letzter Schritt ist nicht das Ergebnis");

  // Glied eines Polynoms c·x^p; das erste Glied ohne „+“
  function termTxt(c, v, first) {
    const m = Math.abs(c);
    const body = (m === 1 && v !== "" ? "" : S(m)) + v;
    if (first) return (c < 0 ? MINUS : "") + body;
    return (c < 0 ? " " + MINUS + " " : " + ") + body;
  }
  // Polynom aus [Koeffizient, Potenz]-Paaren, z. B. „4x² + 12x + 9“
  function polyTxt(terms) {
    const used = terms.filter(([c]) => c !== 0);
    if (!used.length) return "0";
    return used.map(([c, p], i) => termTxt(c, p === 2 ? "x²" : p === 1 ? "x" : "", i === 0)).join("");
  }
  const toPoly = co => [[co[0], 2], [co[1], 1], [co[2], 0]];
  // (p1 x + q1)(p2 x + q2) ausmultiplizieren → Koeffizienten [x², x, 1]
  const expand = (f1, f2) => [f1[0] * f2[0], f1[0] * f2[1] + f1[1] * f2[0], f1[1] * f2[1]];
  const ex = fac => expand(fac[0], fac[1]);
  const coefOk = (co, fac) => ex(fac).every((v, i) => v === co[i]);
  // Alle Lösungen r setzen die Gleichung a x² + b x + c = 0 wahr
  const rootsOk = (co, roots) => roots.every(r => Math.abs(co[0] * r * r + co[1] * r + co[2]) < 1e-9);

  // Lösungsformel für a x² + b x + c = 0 mit exakter Quadratwurzel (D ≥ 0 quadratisch) oder D < 0.
  // Gibt {steps, roots, D} zurück; die Lösungszeile („L = …“) setzt der Aufrufer ans Ende.
  // dn: Name der Diskriminante; bei Bruchgleichungen ausgeschrieben, weil D dort die Definitionsmenge ist
  function solveExact(a, b, c, dn = "D") {
    const D = b * b - 4 * a * c;
    const steps = [
      rich("a = " + sgnTxt(a) + ", b = " + sgnTxt(b) + ", c = " + sgnTxt(c)),
      rich(dn + " = b² − 4ac = " + par(b) + "² − 4 · " + par(a) + " · " + par(c)),
      rich(dn + " = " + S(b * b) + " − " + par(4 * a * c) + " = " + sgnTxt(D)),
    ];
    if (D < 0) {
      steps.push(rich(dn + " < 0, also gibt es keine reelle Lösung."));
      return { steps, roots: [], D };
    }
    const r = Math.round(Math.sqrt(D));
    if (r * r !== D) throw new Error("solveExact: D ist keine Quadratzahl");
    const den = 2 * a, denS = den < 0 ? "(" + sgnTxt(den) + ")" : S(den);
    steps.push(rich("x₁,₂ = (" + sgnTxt(-b) + " ± √" + D + ") : " + denS));
    let roots;
    if (D === 0) {
      roots = [new Frac(-b, den)];
      steps.push(rich("x = " + sgnTxt(-b) + " : " + denS + " = ", num(roots[0])));
    } else {
      const r1 = new Frac(-b + r, den), r2 = new Frac(-b - r, den);
      roots = [r1, r2].sort((x, y) => x.cmp(y));
      steps.push(rich("x₁ = (" + sgnTxt(-b) + " + " + r + ") : " + denS + " = ", num(r1)));
      steps.push(rich("x₂ = (" + sgnTxt(-b) + " " + MINUS + " " + r + ") : " + denS + " = ", num(r2)));
    }
    return { steps, roots, D };
  }

  // ======================================================================
  // 1. Binomische Formeln: ausmultiplizieren, Lücken ergänzen, rückwärts faktorisieren
  // ======================================================================
  const aTxt = k => (k === 1 ? "x" : S(k) + "x");
  const aSqTxt = k => (k === 1 ? "x²" : "(" + S(k) + "x)²");

  function genAusmult(rng) {
    const k = rng.pick([1, 2]), b = rng.int(1, 9), form = rng.pick(["+", "-", "*"]);
    const a = aTxt(k);
    if (form === "*") {
      const fac = [[k, b], [k, -b]];
      const co = ex(fac), ans = polyTxt(toPoly(co));
      return {
        q: rich("Multipliziere aus: (" + a + opTxt(1) + b + ")(" + a + opTxt(-1) + b + ")"),
        a: rich(ans),
        steps: [
          rich("(" + a + opTxt(1) + b + ")(" + a + opTxt(-1) + b + ") = " + aSqTxt(k) + opTxt(-1) + b + "²"),
          rich(ans),
        ],
        _coef: co, _fac: fac,
      };
    }
    const s = form === "+" ? 1 : -1, op = opTxt(s);
    const fac = [[k, s * b], [k, s * b]];
    const co = ex(fac), ans = polyTxt(toPoly(co));
    return {
      q: rich("Multipliziere aus: (" + a + op + b + ")²"),
      a: rich(ans),
      steps: [
        rich("(" + a + op + b + ")² = " + aSqTxt(k) + op + "2 · " + a + " · " + b + " + " + b + "²"),
        rich(ans),
      ],
      _coef: co, _fac: fac,
    };
  }

  function genLuecke(rng) {
    const b = rng.int(1, 12), s = rng.chance(0.5) ? 1 : -1, op = opTxt(s);
    const C = b * b, mid = 2 * b;
    const fac = [[1, s * b], [1, s * b]];
    const full = polyTxt(toPoly([1, s * mid, C])) + " = (x" + op + b + ")²";
    const formel = "(x" + op + "b)² = x²" + op + "2 · x · b + b²";
    if (rng.chance(0.5)) {          // Lücke beim mittleren Glied und in der Klammer
      return {
        q: rich("Ergänze die Lücken: x²", op, { blank: 3 }, "x + " + C + " = (x", op, { blank: 2 }, ")²"),
        a: rich(full),
        steps: [
          rich("Binomische Formel: " + formel),
          rich("b² = " + C + ", also b = " + b),
          rich("2 · b = 2 · " + b + " = " + mid),
          rich(full),
        ],
        _coef: [1, s * mid, C], _fac: fac,
      };
    }                                // Lücke beim Quadrat-Glied und in der Klammer
    return {
      q: rich("Ergänze die Lücken: x²", op, S(mid) + "x + ", { blank: 3 }, " = (x", op, { blank: 2 }, ")²"),
      a: rich(full),
      steps: [
        rich("Binomische Formel: " + formel),
        rich("2 · b = " + mid + ", also b = " + b),
        rich("b² = " + b + "² = " + C),
        rich(full),
      ],
      _coef: [1, s * mid, C], _fac: fac,
    };
  }

  // Rückwärts faktorisieren: fac = Linearfaktoren, pre = Hinweise, ans = Faktorisierung
  function faktorTask(fac, pre, ans) {
    const poly = polyTxt(toPoly(ex(fac)));
    return {
      q: rich("Faktorisiere mit einer binomischen Formel: " + poly),
      a: rich(ans),
      steps: [...pre.map(s => rich(s)), rich(poly + " = " + ans), rich(ans)],
      _coef: ex(fac), _fac: fac,
    };
  }

  function genFaktor(rng) {
    const form = rng.pick(["summe", "summe", "diff", "summe2", "diff2"]);
    if (form === "diff") {
      const c = rng.int(2, 12);
      return faktorTask([[1, c], [1, -c]],
        ["a = x, b = " + c + ", denn b² = " + c * c, "a² − b² = (a + b)(a − b)"],
        "(x" + opTxt(1) + c + ")(x" + opTxt(-1) + c + ")");
    }
    if (form === "diff2") {
      const k = rng.pick([2, 3]), b = rng.int(1, 9), a = aTxt(k);
      return faktorTask([[k, b], [k, -b]],
        ["a = " + a + " (denn a² = " + k * k + "x²), b = " + b + " (denn b² = " + b * b + ")", "a² − b² = (a + b)(a − b)"],
        "(" + a + opTxt(1) + b + ")(" + a + opTxt(-1) + b + ")");
    }
    // Quadrat (x ± b)² bzw. (kx ± b)²
    const k = form === "summe" ? 1 : rng.pick([2, 3]);
    const b = form === "summe" ? rng.int(2, 9) : rng.int(1, 6);
    const e = rng.chance(0.5) ? b : -b, a = aTxt(k);
    return faktorTask([[k, e], [k, e]],
      [
        "Vergleiche mit a² + 2ab + b²: a = " + a + " (denn a² = " + (k === 1 ? "x²" : k * k + "x²") + "), b = " + sgnTxt(e) + " (denn b² = " + b * b + ")",
        "Kontrolle: 2ab = 2 · " + a + " · " + par(e) + " = " + termTxt(2 * k * e, "x", true),
      ],
      "(" + a + opTxt(e) + b + ")²");
  }

  function genAll(rng, level) {
    if (level === 1) return genAusmult(rng);
    if (level === 2) return genLuecke(rng);
    return genFaktor(rng);
  }

  AG.registerType({
    id: "m10-binomische-formeln",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    topic: "terme",
    title: "Binomische Formeln",
    instruction: {
      1: "Multipliziere aus. Wende die binomische Formel an und fasse zusammen.",
      2: "Ergänze die Lücken. Vergleiche mit der binomischen Formel (a ± b)² = a² ± 2ab + b².",
      3: "Faktorisiere mit einer binomischen Formel. Erkenne zuerst das Quadrat bzw. die Differenz zweier Quadrate.",
    },
    merke: rich(
      "(a + b)² = a² + 2ab + b²,  (a − b)² = a² − 2ab + b²,  (a + b)(a − b) = a² − b². Beispiel: ",
      { b: "(x + 3)² = x² + 6x + 9" }, ";  ", { b: "x² − 16 = (x + 4)(x − 4)" }, "."
    ),
    cols: 2,
    generate: (rng, level) => genAll(rng, level),
    verify(t) {
      if (!coefOk(t._coef, t._fac)) return "Ausmultiplizieren bzw. Faktorisieren stimmt nicht";
      return lastIs(t);
    },
  });

  // ======================================================================
  // 2. Quadratische Gleichungen mit der Lösungsformel
  // ======================================================================
  const polyEq = (a, b, c) => polyTxt([[a, 2], [b, 1], [c, 0]]) + " = 0";

  function genQ1(rng) {                       // ganzzahlige Lösungen
    for (let i = 0; i < 2000; i++) {
      const a = rng.pick([1, 1, 1, 2]), r1 = nz(rng, 9), r2 = nz(rng, 9);
      if (r1 === r2) continue;
      const b = -a * (r1 + r2), c = a * r1 * r2;
      const sol = solveExact(a, b, c);
      return {
        q: rich("Löse mit der Lösungsformel: " + polyEq(a, b, c) + ". Gib die Lösungsmenge L an."),
        a: rich(lset(sol.roots)),
        steps: [...sol.steps, rich(lset(sol.roots))],
        _a: a, _b: b, _c: c, _roots: sol.roots,
      };
    }
    throw new Error("m10-quadratische-gleichung: keine Aufgabe gefunden (1)");
  }

  function genQ2(rng) {                       // zwei Lösungen, eine doppelte Lösung oder keine Lösung
    for (let i = 0; i < 4000; i++) {
      const v = rng.pick(["zwei", "doppelt", "keine"]), a = rng.pick([1, 2, 3]);
      let b, c;
      if (v === "zwei") {
        const r1 = nz(rng, 9), r2 = nz(rng, 9);
        if (r1 === r2) continue;
        b = -a * (r1 + r2); c = a * r1 * r2;
      } else if (v === "doppelt") {
        const r = nz(rng, 9);
        b = -2 * a * r; c = a * r * r;
      } else {
        b = rng.int(-8, 8); c = rng.int(1, 9);
        if (b * b - 4 * a * c >= 0) continue;
      }
      const sol = solveExact(a, b, c);
      return {
        q: rich("Löse mit der Lösungsformel: " + polyEq(a, b, c) + ". Gib die Lösungsmenge L an."),
        a: rich(lset(sol.roots)),
        steps: [...sol.steps, rich(lset(sol.roots))],
        _a: a, _b: b, _c: c, _roots: sol.roots,
      };
    }
    throw new Error("m10-quadratische-gleichung: keine Aufgabe gefunden (2)");
  }

  function genQ3(rng) {                       // Lösungen gerundet auf zwei Nachkommastellen
    for (let i = 0; i < 4000; i++) {
      const a = rng.pick([1, 2, 3]), b = rng.int(-12, 12), c = rng.int(-12, 12);
      const D = b * b - 4 * a * c;
      if (c === 0 || D < 2) continue;
      const rt = Math.sqrt(D);
      if (Number.isInteger(rt)) continue;
      const r2 = Math.round(rt * 100) / 100;                    // Wurzel mit zwei Nachkommastellen
      const xe = [(-b + rt) / (2 * a), (-b - rt) / (2 * a)];    // genaue Werte
      const xa = [(-b + r2) / (2 * a), (-b - r2) / (2 * a)];    // Werte mit gerundeter Wurzel
      if (xa.some((x, j) => Math.abs(x) < 0.1 || dec2(x) !== dec2(xe[j]))) continue;
      const order = xa[0] < xa[1] ? [0, 1] : [1, 0];
      const vals = order.map(j => dec2(xa[j]));
      const steps = [
        rich("a = " + a + ", b = " + sgnTxt(b) + ", c = " + sgnTxt(c)),
        rich("D = b² − 4ac = " + par(b) + "² − 4 · " + par(a) + " · " + par(c)),
        rich("D = " + S(b * b) + " − " + par(4 * a * c) + " = " + S(D)),
        rich("x₁,₂ = (" + sgnTxt(-b) + " ± √" + D + ") : " + S(2 * a)),
        rich("√" + D + " ≈ " + dec2(r2)),
        rich("x₁ ≈ (" + sgnTxt(-b) + " + " + dec2(r2) + ") : " + S(2 * a) + " ≈ " + dec2(xa[0])),
        rich("x₂ ≈ (" + sgnTxt(-b) + " " + MINUS + " " + dec2(r2) + ") : " + S(2 * a) + " ≈ " + dec2(xa[1])),
        rich("L ≈ {" + vals.join("; ") + "}"),
      ];
      return {
        q: rich("Löse mit der Lösungsformel: " + polyEq(a, b, c) + ". Runde auf zwei Nachkommastellen und gib L an."),
        a: rich("L ≈ {" + vals.join("; ") + "}"),
        steps,
        _a: a, _b: b, _c: c,
        _approx: order.map(j => Number(dec2(xa[j]).replace(MINUS, "-").replace(",", "."))),
        _exact: order.map(j => xe[j]),
      };
    }
    throw new Error("m10-quadratische-gleichung: keine Aufgabe gefunden (3)");
  }

  AG.registerType({
    id: "m10-quadratische-gleichung",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    topic: "terme",
    title: "Quadratische Gleichungen (Lösungsformel)",
    instruction: {
      1: "Berechne zuerst die Diskriminante D = b² − 4ac, dann die Lösungen mit der Lösungsformel. Gib die Lösungsmenge L an.",
      2: "Berechne zuerst D. Ist D < 0, gibt es keine Lösung. Ist D = 0, gibt es genau eine Lösung. Gib L an.",
      3: "Berechne zuerst D, dann die Lösungen mit der Lösungsformel. Runde auf zwei Nachkommastellen und schreibe ≈.",
    },
    merke: rich(
      "Lösungsformel für a x² + b x + c = 0: x₁,₂ = (−b ± √D) : (2a) mit D = b² − 4ac. Ist D < 0, gibt es keine Lösung. Beispiel: ",
      { b: "x² − 5x + 6 = 0" }, " hat D = 1, also ", { b: "x₁ = 3" }, " und ", { b: "x₂ = 2" }, "."
    ),
    cols: 2,
    generate: (rng, level) => (level === 1 ? genQ1(rng) : level === 2 ? genQ2(rng) : genQ3(rng)),
    verify(t) {
      if (t._approx) {
        return t._approx.every((v, i) => Math.abs(v - t._exact[i]) <= 0.01) ? lastIs(t) : "Näherung falsch";
      }
      const D = t._b * t._b - 4 * t._a * t._c;
      if (!t._roots.length) return D < 0 ? lastIs(t) : "keine Lösung, obwohl D ≥ 0";
      if (!rootsOk([t._a, t._b, t._c], t._roots)) return "Probe stimmt nicht";
      return lastIs(t);
    },
  });

  // ======================================================================
  // 3. Quadratische Gleichungen ohne Formel: Ausklammern, Nullprodukt, binomische Formeln
  // ======================================================================
  function genAusklammern(rng) {
    const a = rng.pick([1, 1, 2, 3, 4]), m = a === 1 ? nz(rng, 9) : nz(rng, 6), b = a * m;
    const pre = a === 1 ? "x" : a + "x";
    const L = [0, -m];
    return {
      q: rich("Löse die Gleichung " + polyTxt([[a, 2], [b, 1]]) + " = 0 ohne Formel. Gib L an."),
      a: rich(lset(L)),
      steps: [
        rich(pre + " · (x" + opTxt(m) + Math.abs(m) + ") = 0   (Ausklammern von " + pre + ")"),
        rich("Satz vom Nullprodukt: " + pre + " = 0 oder x" + opTxt(m) + Math.abs(m) + " = 0"),
        rich("x₁ = 0"),
        rich("x" + opTxt(m) + Math.abs(m) + " = 0   | " + (m > 0 ? MINUS + " " + m : "+ " + (-m))),
        rich("x₂ = " + sgnTxt(-m)),
        rich(lset(L)),
      ],
      _coef: [a, b, 0], _roots: L,
    };
  }

  function genProdukt(rng) {
    for (let i = 0; i < 500; i++) {
      const p = nz(rng, 9), q = nz(rng, 9);
      if (p === q) continue;
      const L = [-p, -q];
      const f1 = "x" + opTxt(p) + Math.abs(p), f2 = "x" + opTxt(q) + Math.abs(q);
      return {
        q: rich("Löse die Gleichung ohne Formel: (" + f1 + ")(" + f2 + ") = 0"),
        a: rich(lset(L)),
        steps: [
          rich("Satz vom Nullprodukt: Ein Produkt ist 0, wenn ein Faktor 0 ist."),
          rich(f1 + " = 0   oder   " + f2 + " = 0"),
          rich("x₁ = " + sgnTxt(-p) + ",   x₂ = " + sgnTxt(-q)),
          rich(lset(L)),
        ],
        _coef: expand([1, p], [1, q]), _roots: L,
      };
    }
    throw new Error("m10-quadratisch-faktorisieren: keine Aufgabe gefunden (2)");
  }

  function genBinom(rng) {
    const f = rng.pick(["diff", "diff", "quad", "quad2", "diff2"]);
    if (f === "diff") {                       // x² − c² = 0
      const c = rng.int(1, 12), co = [1, 0, -c * c];
      return {
        q: rich("Löse die Gleichung " + polyTxt(toPoly(co)) + " = 0 ohne Formel."),
        a: rich(lset([-c, c])),
        steps: [
          rich("(x + " + c + ")(x " + MINUS + " " + c + ") = 0   (3. binomische Formel)"),
          rich("x + " + c + " = 0 oder x " + MINUS + " " + c + " = 0"),
          rich("x₁ = " + sgnTxt(-c) + ",   x₂ = " + sgnTxt(c)),
          rich(lset([-c, c])),
        ],
        _coef: co, _roots: [-c, c],
      };
    }
    if (f === "quad") {                       // x² + 2ex + e² = 0
      const e = nz(rng, 9), co = [1, 2 * e, e * e];
      return {
        q: rich("Löse die Gleichung " + polyTxt(toPoly(co)) + " = 0 ohne Formel."),
        a: rich(lset([-e])),
        steps: [
          rich("(x" + opTxt(e) + Math.abs(e) + ")² = 0   (2. binomische Formel)"),
          rich("Ein Quadrat ist nur 0, wenn die Klammer 0 ist: x" + opTxt(e) + Math.abs(e) + " = 0"),
          rich("x = " + sgnTxt(-e)),
          rich(lset([-e])),
        ],
        _coef: co, _roots: [-e],
      };
    }
    if (f === "quad2") {                      // 4x² + 4ex + e² = 0 mit ungeradem e
      const e = rng.pick([1, 3, 5, 7, 9]) * (rng.chance(0.5) ? 1 : -1), co = [4, 4 * e, e * e], h = -e / 2;
      return {
        q: rich("Löse die Gleichung " + polyTxt(toPoly(co)) + " = 0 ohne Formel."),
        a: rich("L = {" + dec(h) + "}"),
        steps: [
          rich("(2x" + opTxt(e) + Math.abs(e) + ")² = 0   (2. binomische Formel)"),
          rich("2x" + opTxt(e) + Math.abs(e) + " = 0"),
          rich("2x = " + sgnTxt(-e)),
          rich("x = " + dec(h)),
          rich("L = {" + dec(h) + "}"),
        ],
        _coef: co, _roots: [h],
      };
    }
    const c = rng.pick([1, 3, 5, 7, 9, 11]), co = [4, 0, -c * c], h = c / 2;   // 4x² − c² = 0, c ungerade
    return {
      q: rich("Löse die Gleichung " + polyTxt(toPoly(co)) + " = 0 ohne Formel."),
      a: rich("L = {" + dec(-h) + "; " + dec(h) + "}"),
      steps: [
        rich("(2x + " + c + ")(2x " + MINUS + " " + c + ") = 0   (3. binomische Formel)"),
        rich("2x + " + c + " = 0 oder 2x " + MINUS + " " + c + " = 0"),
        rich("2x = " + sgnTxt(-c) + " oder 2x = " + c),
        rich("x₁ = " + dec(-h) + ",   x₂ = " + dec(h)),
        rich("L = {" + dec(-h) + "; " + dec(h) + "}"),
      ],
      _coef: co, _roots: [-h, h],
    };
  }

  function genFaktorGl(rng, level) {
    if (level === 1) return genAusklammern(rng);
    if (level === 2) return genProdukt(rng);
    return genBinom(rng);
  }

  AG.registerType({
    id: "m10-quadratisch-faktorisieren",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    topic: "terme",
    title: "Quadratische Gleichungen ohne Formel",
    instruction: {
      1: "Löse die Gleichung ohne Formel. Klammere zuerst x aus und wende den Satz vom Nullprodukt an.",
      2: "Löse die Gleichung ohne Formel. Ein Produkt ist 0, wenn ein Faktor 0 ist. Gib L an.",
      3: "Erkenne die binomische Formel auf der linken Seite. Zerlege die Gleichung in ein Produkt und löse sie ohne Formel.",
    },
    merke: rich(
      "Ein Produkt ist 0, wenn ein Faktor 0 ist (Satz vom Nullprodukt). Beispiel: ",
      { b: "x² − 5x = 0" }, " ergibt ", { b: "x(x − 5) = 0" }, ", also ", { b: "x₁ = 0" }, " und ", { b: "x₂ = 5" }, "."
    ),
    cols: 2,
    generate: (rng, level) => genFaktorGl(rng, level),
    verify(t) {
      if (!rootsOk(t._coef, t._roots)) return "Probe stimmt nicht";
      return lastIs(t);
    },
  });

  // ======================================================================
  // 4. Quadratische Sachaufgaben: Zahlenrätsel und Rechteck
  // ======================================================================
  function genZahl(rng) {                     // x² + kx = c mit Lösungen a > 0 und −b < 0
    for (let i = 0; i < 2000; i++) {
      const a = rng.int(1, 10), b = rng.int(a + 2, 12), k = b - a, c = a * b;   // k ≥ 2: „2-Fachen“ usw.
      const pos = rng.chance(0.5);
      const sol = solveExact(1, k, -c);
      const q = pos
        ? "Die Summe aus dem Quadrat einer positiven Zahl und dem " + k + "-Fachen der Zahl ist " + c + ". Wie heißt die Zahl?"
        : "Die Summe aus dem Quadrat einer Zahl und dem " + k + "-Fachen der Zahl ist " + c + ". Bestimme alle Zahlen.";
      const steps = [
        rich("Variable: x = gesuchte Zahl"),
        rich("x² + " + k + "x = " + c + "   | " + MINUS + " " + c),
        rich("x² + " + k + "x " + MINUS + " " + c + " = 0"),
        ...sol.steps,
      ];
      let ans;
      if (pos) {
        steps.push(rich("x₂ = " + sgnTxt(-b) + " entfällt, denn die Zahl ist positiv."));
        ans = "Die gesuchte Zahl ist " + a + ".";
      } else {
        steps.push(rich("Probe für " + a + ": " + a + "² + " + k + " · " + a + " = " + (a * a + k * a) + " (stimmt)"));
        steps.push(rich("Probe für " + sgnTxt(-b) + ": (" + sgnTxt(-b) + ")² + " + k + " · (" + sgnTxt(-b) + ") = " + (b * b) + " " + MINUS + " " + (k * b) + " = " + c + " (stimmt)"));
        ans = "Die gesuchten Zahlen sind " + a + " und " + sgnTxt(-b) + ".";
      }
      steps.push(rich(ans));
      return {
        q: rich(q),
        a: rich(ans),
        steps,
        _coef: [1, k, -c], _roots: sol.roots, _pos: pos, _a: a,
      };
    }
    throw new Error("m10-quadratisch-sachaufgabe: keine Aufgabe gefunden (1)");
  }

  function genRechteck(rng) {                 // Breite w, Länge w + d, Fläche A = w(w + d), ganzzahlige Lösung
    const w = rng.int(2, 15), d = rng.int(1, 6), A = w * (w + d);
    const sol = solveExact(1, d, -A);
    const ans = "Das Rechteck ist " + w + " m breit und " + (w + d) + " m lang.";
    return {
      q: rich("Ein Rechteck ist " + d + " m länger als breit. Sein Flächeninhalt beträgt " + A + " m². Berechne Breite und Länge."),
      a: rich(ans),
      steps: [
        rich("Breite: x m, Länge: (x + " + d + ") m"),
        rich("x · (x + " + d + ") = " + A),
        rich("x² + " + d + "x " + MINUS + " " + A + " = 0"),
        ...sol.steps,
        rich("x₂ = " + sgnTxt(-(w + d)) + " entfällt, denn eine Seitenlänge ist nicht negativ."),
        rich(ans),
      ],
      _coef: [1, d, -A], _roots: sol.roots, _w: w, _d: d, _A: A,
    };
  }

  function genRechteckNaeherung(rng) {        // wie oben, aber Wurzel nicht ganzzahlig: Ergebnis gerundet
    for (let i = 0; i < 4000; i++) {
      const d = rng.int(1, 6), A = rng.int(20, 150), D = d * d + 4 * A, rt = Math.sqrt(D);
      if (Number.isInteger(rt)) continue;
      const r2 = Math.round(rt * 100) / 100;
      const xe = (-d + rt) / 2, xa = (-d + r2) / 2;
      if (xa < 0.5 || dec2(xa) !== dec2(xe)) continue;
      const xr = Math.round(xa * 100) / 100, lr = Math.round((xa + d) * 100) / 100;
      const prod = xr * lr;
      if (Math.abs(prod - A) > 0.5) continue;
      const xs = dec2(xr), ls = dec2(lr), ans = "Das Rechteck ist etwa " + xs + " m breit und etwa " + ls + " m lang.";
      return {
        q: rich("Ein Rechteck ist " + d + " m länger als breit. Sein Flächeninhalt beträgt " + A + " m². Berechne Breite und Länge. Runde auf zwei Nachkommastellen."),
        a: rich(ans),
        steps: [
          rich("Breite: x m, Länge: (x + " + d + ") m"),
          rich("x · (x + " + d + ") = " + A),
          rich("x² + " + d + "x " + MINUS + " " + A + " = 0"),
          rich("a = 1, b = " + d + ", c = " + sgnTxt(-A)),
          rich("D = b² − 4ac = " + (d * d) + " + 4 · " + A + " = " + D),
          rich("x₁,₂ = (" + sgnTxt(-d) + " ± √" + D + ") : 2"),
          rich("√" + D + " ≈ " + dec2(r2)),
          rich("x₁ ≈ (" + sgnTxt(-d) + " + " + dec2(r2) + ") : 2 ≈ " + xs),
          rich("x₂ ≈ (" + sgnTxt(-d) + " " + MINUS + " " + dec2(r2) + ") : 2 ≈ " + dec2((-d - r2) / 2)),
          rich("x₂ entfällt, denn eine Seitenlänge ist nicht negativ."),
          rich("Probe: " + xs + " · " + ls + " ≈ " + dec2(prod) + " ≈ " + A),
          rich(ans),
        ],
        _approx: Number(xs.replace(",", ".")), _exact: xe, _A: A, _prod: prod,
      };
    }
    throw new Error("m10-quadratisch-sachaufgabe: keine Aufgabe gefunden (3)");
  }

  AG.registerType({
    id: "m10-quadratisch-sachaufgabe",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    topic: "terme",
    title: "Quadratische Sachaufgaben",
    instruction: {
      1: "Stelle die Gleichung auf und löse sie mit der Lösungsformel. Prüfe deine Lösungen.",
      2: "Setze für die Breite x an und stelle die Gleichung auf. Löse sie und verwirf die negative Lösung. Antworte mit einem Satz.",
      3: "Setze für die Breite x an und stelle die Gleichung auf. Löse sie mit der Lösungsformel, runde auf zwei Nachkommastellen und verwirf die negative Lösung. Antworte mit einem Satz.",
    },
    merke: rich(
      "Bei einer Sachaufgabe legt man die Variable fest und stellt die Gleichung auf. Eine Länge ist nie negativ, daher entfällt die negative Lösung. Beispiel: ",
      { b: "x(x + 3) = 40" }, " hat die Lösungen 5 und −8. Die Breite ist 5 m, die Länge 8 m."
    ),
    cols: 1,
    generate: (rng, level) => (level === 1 ? genZahl(rng) : level === 2 ? genRechteck(rng) : genRechteckNaeherung(rng)),
    verify(t) {
      if (t._approx !== undefined) {
        if (Math.abs(t._approx - t._exact) > 0.01) return "Näherung falsch";
        if (Math.abs(t._prod - t._A) > 0.5) return "Probe weicht zu stark ab";
        return lastIs(t);
      }
      if (t._w !== undefined && t._w * (t._w + t._d) !== t._A) return "Fläche stimmt nicht";
      if (!rootsOk(t._coef, t._roots)) return "Probe stimmt nicht";
      return lastIs(t);
    },
  });

  // ======================================================================
  // 5. Bruchgleichungen mit Variable im Nenner
  // ======================================================================
  const denTxt = p => (p > 0 ? "x + " + S(p) : "x " + MINUS + " " + S(-p));   // p ≠ 0
  const fr = (z, n) => ({ f: [z, n] });                                       // Bruch mit Termen
  const dTxt = vals => "D = ℚ \\ {" + vals.slice().sort((x, y) => x - y).map(sgnTxt).join("; ") + "}";
  const linEq = (L, R) => polyTxt([[L.a, 1], [L.c, 0]]) + " = " + polyTxt([[R.a, 1], [R.c, 0]]);

  // a x + c = a' x + c' ganzzahlig Schritt für Schritt; gibt {lines, x} oder null
  function chainInt(L, R) {
    const l = { a: L.a, c: L.c }, r = { a: R.a, c: R.c };
    const lines = [];
    const snap = () => ({ L: { a: l.a, c: l.c }, R: { a: r.a, c: r.c } });
    if (r.a !== 0) {
      lines.push({ st: snap(), op: "| " + (r.a > 0 ? MINUS : "+") + " " + S(Math.abs(r.a)) + "x" });
      l.a -= r.a; r.a = 0;
      if (l.a === 0) return null;
    }
    if (l.c !== 0) {
      lines.push({ st: snap(), op: "| " + (l.c > 0 ? MINUS : "+") + " " + S(Math.abs(l.c)) });
      r.c -= l.c; l.c = 0;
    }
    if (l.a !== 1) {
      if (r.c % l.a !== 0) return null;
      lines.push({ st: snap(), op: "| : " + (l.a < 0 ? "(" + sgnTxt(l.a) + ")" : S(l.a)) });
      r.c /= l.a; l.a = 1;
    }
    return { lines, x: r.c };
  }

  // Gleichung des Typs an der Stelle x prüfen (exakt mit Brüchen)
  function holds(d, x) {
    if (d.kind === "lin") return new Frac(d.al, x + d.p).eq(new Frac(d.be, x + d.q));
    if (d.kind === "sch2") return new Frac(x * x, x + d.p).eq(new Frac(d.b1 * x + d.b0, x + d.p));
    const rhs = new Frac(d.g, x + d.q).add(d.kind === "sch" ? d.k : 0);
    return new Frac(x, x + d.p).eq(rhs);
  }

  function genBrL1(rng) {                     // al/(x + p) = be/(x + q) -> linear
    for (let i = 0; i < 2000; i++) {
      const al = rng.int(1, 12), be = rng.int(1, 12), p = nz(rng, 6), q = nz(rng, 6);
      if (al === be || p === q) continue;
      const num0 = be * p - al * q, den0 = al - be;      // al(x + q) = be(x + p) -> (al − be) x = be p − al q
      if (num0 % den0 !== 0) continue;
      const x0 = num0 / den0;
      if (x0 === -p || x0 === -q) continue;
      const L = { a: al, c: al * q }, R = { a: be, c: be * p };
      const ch = chainInt(L, R);
      if (!ch || ch.x !== x0) continue;
      const excl = [-p, -q];
      const steps = [
        rich(dTxt(excl)),
        rich(fr(S(al), denTxt(p)), " = ", fr(S(be), denTxt(q)), "   | · (" + denTxt(p) + ")(" + denTxt(q) + ")"),
        rich(al + "(" + denTxt(q) + ") = " + be + "(" + denTxt(p) + ")"),
      ];
      for (const l of ch.lines) steps.push(rich(linEq(l.st.L, l.st.R) + "   " + l.op));
      steps.push(rich("x = " + sgnTxt(x0)));
      steps.push(rich("Probe: links ", num(new Frac(al, x0 + p)), ", rechts ", num(new Frac(be, x0 + q)), ". Die Gleichung stimmt, x liegt in D."));
      steps.push(rich(lset([x0])));
      return {
        q: rich("Gegeben ist die Gleichung ", fr(S(al), denTxt(p)), " = ", fr(S(be), denTxt(q)), ". Bestimme D und L."),
        a: rich(lset([x0])),
        steps,
        _eq: { kind: "lin", al, be, p, q }, _excl: excl, _roots: [x0],
      };
    }
    throw new Error("m10-bruchgleichung: keine Aufgabe gefunden (1)");
  }

  function genBrL2(rng) {                     // x/(x + p) = g/(x + q) -> quadratisch, beide Lösungen in D
    for (let i = 0; i < 4000; i++) {
      const g = rng.int(1, 9), p = nz(rng, 6), q = nz(rng, 6);
      if (p === q) continue;
      const B = q - g, C = -g * p;                        // x² + (q − g)x − gp = 0
      const D = B * B - 4 * C, rt = Math.round(Math.sqrt(D));
      if (D <= 0 || rt * rt !== D) continue;
      const r1 = (-B + rt) / 2, r2 = (-B - rt) / 2;
      if (!Number.isInteger(r1) || !Number.isInteger(r2)) continue;
      if ([r1, r2].some(r => r === -p || r === -q)) continue;
      const roots = [r1, r2].sort((x, y) => x - y);
      const excl = [-p, -q];
      const sol = solveExact(1, B, C, "Diskriminante");
      const steps = [
        rich(dTxt(excl)),
        rich(fr("x", denTxt(p)), " = ", fr(S(g), denTxt(q)), "   | · (" + denTxt(p) + ")(" + denTxt(q) + ")"),
        rich("x(" + denTxt(q) + ") = " + g + "(" + denTxt(p) + ")"),
        rich(polyTxt([[1, 2], [q, 1]]) + " = " + polyTxt([[g, 1], [g * p, 0]])),
        rich(polyTxt([[1, 2], [B, 1], [C, 0]]) + " = 0"),
        ...sol.steps,
        rich("Beide Lösungen liegen in D."),
        rich(lset(roots)),
      ];
      return {
        q: rich("Gegeben ist die Gleichung ", fr("x", denTxt(p)), " = ", fr(S(g), denTxt(q)), ". Bestimme D und L."),
        a: rich(lset(roots)),
        steps,
        _eq: { kind: "quad", g, p, q }, _excl: excl, _roots: roots,
      };
    }
    throw new Error("m10-bruchgleichung: keine Aufgabe gefunden (2)");
  }

  // x²/(x + p) = (b1 x + b0)/(x + p): nach dem Erweitern x² = b1 x + b0, also x² − b1 x − b0 = 0 mit den
  // Nullstellen r1 und −p. Die Nullstelle −p liegt nicht in D und ist eine Scheinlösung.
  function genBrL3(rng) {
    for (let i = 0; i < 2000; i++) {
      const p = nz(rng, 6), r1 = nz(rng, 9);
      if (r1 === -p || r1 === 0) continue;
      const b1 = r1 - p, b0 = p * r1;                    // (x + p)(x − r1) = x² − b1 x − b0
      const numR = polyTxt([[b1, 1], [b0, 0]]);
      const sol = solveExact(1, -b1, -b0, "Diskriminante");
      const d = { kind: "sch2", p, b1, b0 };
      if (!holds(d, r1)) continue;
      const steps = [
        rich(dTxt([-p])),
        rich(fr("x²", denTxt(p)), " = ", fr(numR, denTxt(p)), "   | · (" + denTxt(p) + ")"),
        rich("x² = " + numR),
        rich(polyTxt([[1, 2], [-b1, 1], [-b0, 0]]) + " = 0"),
        ...sol.steps,
        rich("x = " + sgnTxt(r1) + " liegt in D."),
        rich("x = " + sgnTxt(-p) + " liegt nicht in D (Scheinlösung), entfällt."),
        rich(lset([r1])),
      ];
      return {
        q: rich("Gegeben ist die Gleichung ", fr("x²", denTxt(p)), " = ", fr(numR, denTxt(p)), ". Bestimme D und L."),
        a: rich(lset([r1])),
        steps,
        _eq: d, _excl: [-p], _roots: [r1],
      };
    }
    throw new Error("m10-bruchgleichung: keine Aufgabe gefunden (3)");
  }

  AG.registerType({
    id: "m10-bruchgleichung",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    topic: "terme",
    title: "Bruchgleichungen mit Variable im Nenner",
    instruction: {
      1: "Bestimme zuerst D. Multipliziere mit dem Hauptnenner, löse die Gleichung und prüfe die Lösung.",
      2: "Bestimme D und L. Multipliziere mit dem Hauptnenner und löse die entstehende quadratische Gleichung.",
      3: "Bestimme D und L. Prüfe, ob jede Lösung in D liegt. Eine Lösung außerhalb von D entfällt.",
    },
    merke: rich(
      "Steht x im Nenner, darf der Nenner nicht 0 werden: D = ℚ \\ {Nullstellen der Nenner}. Beide Seiten werden mit dem Hauptnenner multipliziert. Beispiel: ",
      { b: "3/(x − 1) = 6/(x + 2)" }, " ergibt ", { b: "3(x + 2) = 6(x − 1)" }, ", also ", { b: "x = 4" }, " mit ", { b: "D = ℚ \\ {1; −2}" }, "."
    ),
    cols: 2,
    generate: (rng, level) => (level === 1 ? genBrL1(rng) : level === 2 ? genBrL2(rng) : genBrL3(rng)),
    verify(t) {
      for (const x of t._roots) {
        if (t._excl.includes(x)) return "Lösung liegt nicht in D";
        if (!holds(t._eq, x)) return "Probe stimmt nicht";
      }
      if (!t._roots.length) return "keine Lösung";
      return lastIs(t);
    },
  });

})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
