// M8 LB 2: Quadratzahlen und Quadratwurzeln – Rechnen ohne Taschenrechner, Näherungen, Überschlag.
// Typen: m8-quadrat-wurzel (RM), m8-wurzel-naeherung (RM), m8-wurzel-ueberschlag (M).
(function (AG) {
  const { Frac, num, rich, MINUS, gcd } = AG;

  const SUP2 = { sup: "2" };
  const dz = (x, digits) => num(x, { as: "dec", digits });          // Dezimalzahl mit Komma
  const fr = (n, d) => ({ f: [n, d] });                              // Bruch-Segment
  const P = a => num(-a, { paren: true });                           // (−a)
  const roundCents = x => Math.round(x * 100 + 1e-9);                // auf Hundertstel gerundet (ganze Zahl)
  const cents = c => num(new Frac(c, 100), { as: "dec", digits: 2 }); // 447 -> „4,47“
  const approx6 = x => (Math.floor(x * 1e5) / 1e5).toFixed(5).replace(".", ",") + "…"; // Anzeige des Taschenrechners (abgeschnitten)

  // ---------- Typ 1: Quadratzahlen und Quadratwurzeln ----------
  function quadN1(rng) {
    const a = rng.int(2, 20), A = a * a;
    const form = rng.int(0, 2);
    if (form === 0) return {
      q: rich(num(a), SUP2, " = ?"),
      a: num(A),
      steps: [rich(num(a), SUP2, " = ", num(a), " · ", num(a), " = ", num(A))],
    };
    if (form === 1) return {
      q: rich(num(a), " · ", num(a), " = ?"),
      a: num(A),
      steps: [rich(num(a), " · ", num(a), " = ", num(A), ", also ", num(a), SUP2, " = ", num(A))],
    };
    return {
      q: rich("√", num(A), " = ?"),
      a: num(a),
      steps: [
        rich("Gesucht ist die Zahl, die mit sich selbst multipliziert ", num(A), " ergibt."),
        rich(num(a), " · ", num(a), " = ", num(A), ", also √", num(A), " = ", num(a)),
      ],
    };
  }

  function quadN2(rng) {
    const k = rng.int(0, 2);
    if (k === 0) {                                                   // Dezimalzahl: 0,7² = 0,49
      let t; do { t = rng.int(2, 29); } while (t % 10 === 0);
      const x = new Frac(t, 10), y = x.mul(x);
      if (rng.chance(0.5)) return {
        q: rich(dz(x), SUP2, " = ?"),
        a: dz(y),
        steps: [rich(dz(x), SUP2, " = ", dz(x), " · ", dz(x), " = ", dz(y))],
      };
      return {
        q: rich("√", dz(y), " = ?"),
        a: dz(x),
        steps: [
          rich("Gesucht ist die Zahl, die mit sich selbst multipliziert ", dz(y), " ergibt."),
          rich(dz(x), " · ", dz(x), " = ", dz(y), ", also √", dz(y), " = ", dz(x)),
        ],
      };
    }
    if (k === 1) {                                                   // Zehnerzahl: 30² = 900, √1600 = 40
      const z = 10 * rng.int(2, 15), Z = z * z;
      if (rng.chance(0.5)) return {
        q: rich(num(z), SUP2, " = ?"),
        a: num(Z),
        steps: [rich(num(z), SUP2, " = ", num(z), " · ", num(z), " = ", num(Z))],
      };
      return {
        q: rich("√", num(Z), " = ?"),
        a: num(z),
        steps: [
          rich("Gesucht ist die Zahl, die mit sich selbst multipliziert ", num(Z), " ergibt."),
          rich(num(z), " · ", num(z), " = ", num(Z), ", also √", num(Z), " = ", num(z)),
        ],
      };
    }
    // Bruch: (3/4)² = 9/16, √(25/36) = 5/6
    const d = rng.int(2, 10);
    let n; do { n = rng.int(1, d - 1); } while (gcd(n, d) !== 1);
    const x = new Frac(n, d), N2 = n * n, D2 = d * d;
    if (rng.chance(0.5)) return {
      q: rich("(", fr(n, d), ")", SUP2, " = ?"),
      a: num(x.mul(x)),
      steps: [rich("(", fr(n, d), ")", SUP2, " = ", fr(n, d), " · ", fr(n, d), " = ", fr(N2, D2))],
    };
    return {
      q: rich("√", fr(N2, D2), " = ?"),
      a: num(x),
      steps: [
        rich("Gesucht ist die Zahl, die mit sich selbst multipliziert ", fr(N2, D2), " ergibt."),
        rich(fr(n, d), " · ", fr(n, d), " = ", fr(N2, D2), ", also √", fr(N2, D2), " = ", fr(n, d)),
      ],
    };
  }

  function quadN3(rng) {
    const k = rng.int(0, 2);
    if (k === 0) {                                                   // √81 + 4² = 9 + 16 = 25
      const r = rng.int(2, 12), s = rng.int(2, 10), R = r * r, S = s * s, res = r + S;
      return {
        q: rich("√", num(R), " + ", num(s), SUP2, " = ?"),
        a: num(res),
        steps: [rich("√", num(R), " + ", num(s), SUP2, " = ", num(r), " + ", num(S), " = ", num(res))],
      };
    }
    if (k === 1) {                                                   // √(9 · 16) = √9 · √16 = 3 · 4 = 12
      const x = rng.int(2, 6); let y; do { y = rng.int(2, 6); } while (y === x);
      const A = x * x, B = y * y, res = x * y;
      return {
        q: rich("√(", num(A), " · ", num(B), ") = ?"),
        a: num(res),
        steps: [rich("√(", num(A), " · ", num(B), ") = √", num(A), " · √", num(B), " = ", num(x), " · ", num(y), " = ", num(res))],
      };
    }
    // 3 · √49 − 2² = 3 · 7 − 4 = 21 − 4 = 17
    let m, s, q2;
    do { m = rng.int(2, 9); s = rng.int(2, 12); q2 = rng.int(2, 6); } while (m * s <= q2 * q2);
    const S = s * s, res = m * s - q2 * q2;
    return {
      q: rich(num(m), " · √", num(S), " ", MINUS, " ", num(q2), SUP2, " = ?"),
      a: num(res),
      steps: [rich(num(m), " · √", num(S), " ", MINUS, " ", num(q2), SUP2, " = ", num(m), " · ", num(s), " ", MINUS, " ", num(q2 * q2), " = ", num(m * s), " ", MINUS, " ", num(q2 * q2), " = ", num(res))],
    };
  }

  AG.registerType({
    id: "m8-quadrat-wurzel",
    klasse: "8",
    zug: "RM",
    lb: "2",
    lbTitle: "Quadratzahlen und Quadratwurzeln",
    topic: "potenzen",
    title: "Quadratzahlen und Wurzeln",
    instruction: {
      1: "Berechne ohne Taschenrechner.",
      2: "Berechne ohne Taschenrechner. Achte auf Kommas und Brüche.",
      3: "Berechne den Term ohne Taschenrechner. Rechne zuerst die Quadrate und Wurzeln aus.",
    },
    merke: [
      "Quadratzahl: ", { b: "a² = a · a" }, ". Quadratwurzel: ", { b: "√a" },
      " ist die Zahl, die mit sich selbst multipliziert a ergibt.   Beispiel: 13² = 169, also √169 = 13.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return quadN1(rng);
      if (level === 2) return quadN2(rng);
      return quadN3(rng);
    },
  });

  // ---------- Typ 2: Wurzeln mit dem Taschenrechner (Näherung) ----------
  function naeN1(rng) {                                              // √20 ≈ 4,47
    let n; do { n = rng.int(2, 199); } while (Number.isInteger(Math.sqrt(n)));
    const v = Math.sqrt(n), c = roundCents(v);
    return {
      q: rich("√", num(n), " = ?"),
      a: rich("√", num(n), " ≈ ", cents(c)),
      steps: [rich("√", num(n), " = ", approx6(v), " ≈ ", cents(c))],
    };
  }

  function naeN2(rng) {                                              // √2,5 ≈ 1,58
    let R; do { R = rng.int(11, 999); } while (Number.isInteger(Math.sqrt(R)));  // Radikand = R/100
    const x = new Frac(R, 100), v = Math.sqrt(R) / 10, c = roundCents(v);
    return {
      q: rich("√", dz(x), " = ?"),
      a: rich("√", dz(x), " ≈ ", cents(c)),
      steps: [rich("√", dz(x), " = ", approx6(v), " ≈ ", cents(c))],
    };
  }

  // Sachaufgaben: Seitenlänge eines Quadrats aus dem Flächeninhalt
  const FLAECHEN = [
    { pre: "Ein quadratisches Beet hat eine Fläche von ", unit: "m", range: [10, 200] },
    { pre: "Eine quadratische Tischplatte hat eine Fläche von ", unit: "dm", range: [40, 300] },
    { pre: "Ein quadratisches Sandfeld hat eine Fläche von ", unit: "m", range: [10, 150] },
  ];
  function naeN3(rng) {
    const ctx = rng.pick(FLAECHEN), U = ctx.unit;
    let A; do { A = rng.int(ctx.range[0], ctx.range[1]); } while (Number.isInteger(Math.sqrt(A)));
    const v = Math.sqrt(A), c = roundCents(v);
    return {
      q: rich(ctx.pre, num(A), " ", U, SUP2, ". Wie lang ist eine Seite?"),
      a: rich("a ≈ ", cents(c), " ", U),
      steps: [
        rich("A = a · a, also a = √A"),
        rich("√", num(A), " = ", approx6(v), " ≈ ", cents(c)),
        rich("a ≈ ", cents(c), " ", U),
      ],
    };
  }

  AG.registerType({
    id: "m8-wurzel-naeherung",
    klasse: "8",
    zug: "RM",
    lb: "2",
    lbTitle: "Quadratzahlen und Quadratwurzeln",
    topic: "potenzen",
    title: "Wurzeln näherungsweise berechnen",
    instruction: {
      1: "Berechne mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
      2: "Berechne mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
      3: "Löse die Sachaufgabe mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Ist der Radikand keine Quadratzahl, ist die Wurzel eine nicht abbrechende Dezimalzahl. Man rundet das Ergebnis des Taschenrechners und schreibt ",
      { b: "≈" }, ".   Beispiel: √20 ≈ 4,47, denn 4,47 · 4,47 ≈ 20.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return naeN1(rng);
      if (level === 2) return naeN2(rng);
      return naeN3(rng);
    },
  });

  // ---------- Typ 3: Quadrate negativer Zahlen und Wurzeln überschlagen ----------
  // (−a)² = a², aber −a² = −(a²)
  function negQuadN1(rng) {
    const a = rng.int(2, 25), A = a * a;
    if (rng.chance(0.5)) return {
      q: rich(P(a), SUP2, " = ?"),
      a: num(A),
      steps: [rich(P(a), SUP2, " = ", P(a), " · ", P(a), " = ", num(A))],
    };
    return {
      q: rich(MINUS, num(a), SUP2, " = ?"),
      a: num(-A),
      steps: [rich(MINUS, num(a), SUP2, " = ", MINUS, "(", num(a), " · ", num(a), ") = ", num(-A))],
    };
  }

  // −a² + (−b)²  oder  (−a)² − b²
  function mixN3(rng) {
    const a = rng.int(2, 12); let b; do { b = rng.int(2, 12); } while (b === a);
    if (rng.chance(0.5)) {                                           // −5² + (−3)² = −25 + 9 = −16
      const res = b * b - a * a;
      return {
        q: rich(MINUS, num(a), SUP2, " + ", P(b), SUP2, " = ?"),
        a: num(res),
        steps: [
          rich(MINUS, num(a), SUP2, " = ", num(-(a * a)), ";   ", P(b), SUP2, " = ", num(b * b)),
          rich(num(-(a * a)), " + ", num(b * b), " = ", num(res)),
        ],
      };
    }
    const res = a * a - b * b;                                       // (−a)² − b²
    return {
      q: rich(P(a), SUP2, " ", MINUS, " ", num(b), SUP2, " = ?"),
      a: num(res),
      steps: [
        rich(P(a), SUP2, " = ", num(a * a), ";   ", num(b), SUP2, " = ", num(b * b)),
        rich(num(a * a), " ", MINUS, " ", num(b * b), " = ", num(res)),
      ],
    };
  }

  // Zwischen n² und (n+1)² liegt x: zwischen welchen ganzen Zahlen liegt √x?
  function ueberschlag(rng) {
    const n = rng.int(2, 11), x = rng.int(n * n + 1, n * n + 2 * n);
    return {
      q: rich("Zwischen welchen ganzen Zahlen liegt √", num(x), "?"),
      a: rich(num(n), " < √", num(x), " < ", num(n + 1)),
      steps: [
        rich(num(n * n), " < ", num(x), " < ", num((n + 1) * (n + 1))),
        rich(num(n), " < √", num(x), " < ", num(n + 1), ", denn √", num(n * n), " = ", num(n), " und √", num((n + 1) * (n + 1)), " = ", num(n + 1)),
      ],
    };
  }

  // Welche ganze Zahl liegt √x näher? Die Mitte (n + 0,5) liegt bei (n + 0,5)² = n² + n + 0,25.
  function nearestN3(rng) {
    const n = rng.int(2, 11), x = rng.int(n * n + 1, n * n + 2 * n);
    const mid = new Frac((2 * n + 1) ** 2, 4);
    const near = mid.cmp(x) > 0 ? n : n + 1;
    return {
      q: rich("Welche ganze Zahl liegt √", num(x), " am nächsten?"),
      a: num(near),
      steps: [
        rich("√", num(x), " liegt zwischen ", num(n), " und ", num(n + 1), ", denn ", num(n * n), " < ", num(x), " < ", num((n + 1) * (n + 1)), "."),
        rich("Die Mitte ist ", dz(new Frac(2 * n + 1, 2)), ". Ihr Quadrat ist ", dz(mid), "."),
        rich(num(x), " ", mid.cmp(x) > 0 ? "<" : ">", " ", dz(mid), ", also liegt √", num(x), " näher an ", num(near), "."),
      ],
    };
  }

  AG.registerType({
    id: "m8-wurzel-ueberschlag",
    klasse: "8",
    zug: "M",
    lb: "2",
    lbTitle: "Quadratzahlen und Quadratwurzeln",
    topic: "potenzen",
    title: "Quadrieren negativer Zahlen und Überschlag",
    instruction: {
      1: "Berechne. Achte auf die Klammern.",
      2: "Gib an, zwischen welchen zwei aufeinanderfolgenden ganzen Zahlen die Wurzel liegt.",
      3: "Berechne bzw. schätze. Achte auf Klammern und Vorzeichen.",
    },
    merke: [
      "Ein Quadrat ist nie negativ: ", { b: "(−a)² = a²" }, ", aber ", { b: "−a² = −(a²)" },
      ".   Beispiel: (−7)² = 49, aber −7² = −49.   Wurzel überschlagen: 49 < 55 < 64, also 7 < √55 < 8.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return negQuadN1(rng);
      if (level === 2) return ueberschlag(rng);
      return rng.chance(0.5) ? mixN3(rng) : nearestN3(rng);
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
