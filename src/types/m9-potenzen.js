// M9 LB 2 (Potenzen): Zehnerpotenzen – wissenschaftliche Schreibweise, Vergleichen und Ordnen,
// Vorsilben (Nano bis Peta). Nur Zehnerpotenzen; Potenzgesetze folgen in Klasse 10.
(function (AG) {
  const { Frac, num, rich, MINUS, fmtDec, fmtInt } = AG;

  // ---------- Hilfen ----------
  const sgn = n => (n < 0 ? MINUS : "");
  const sup = n => ({ sup: sgn(n) + String(Math.abs(n)) });        // Hochzahl, z. B. −4
  const pow10 = n => (n >= 0 ? new Frac(10 ** n, 1) : new Frac(1, 10 ** -n));
  const dec = x => num(x, { as: "dec" });                           // Zahl als Dezimalzahl mit Komma
  const decS = x => fmtDec(x);                                      // dasselbe als Text
  const suffix = unit => (unit ? [" ", unit] : []);
  const wiss = (a, n, unit) => rich(dec(a), " · 10", sup(n), suffix(unit));   // a · 10ⁿ
  const joinRich = (list, sep) => {
    const out = [];
    list.forEach((r, i) => { if (i) out.push(sep); out.push(r); });
    return rich(out);
  };
  // Dezimalzahl als Frac, z. B. „0,5“ → 1/2
  const fromDec = s => {
    const [i, f = ""] = s.split(",");
    return new Frac(Number(i + f), 10 ** f.length);
  };

  // Mantisse a: Zahl mit 0, 1 oder 2 Nachkommastellen; 1 ≤ a < 10, keine Endnull bei Nachkommastellen.
  // lo, hi: Grenzen in Einheiten von 10^-dig (optional).
  const DIGRANGE = [[2, 9], [11, 99], [101, 999]];
  function mant(rng, dig, lo, hi) {
    const L = lo ?? DIGRANGE[dig][0];
    const H = hi ?? DIGRANGE[dig][1];
    let m = rng.int(L, H);
    if (dig > 0 && m % 10 === 0) m = m + 1 <= H ? m + 1 : m - 1;
    return new Frac(m, 10 ** dig);
  }

  // ======================================================================
  // 1. Wissenschaftliche Schreibweise
  // ======================================================================
  // Sachbezüge für Niveau 3: Mantisse dig/lo/hi, Hochzahlbereich n
  const CTX3 = [
    { pre: "Die Entfernung von der Erde zur Sonne beträgt rund ", post: " km.", unit: "km", dig: 1, lo: 14, hi: 16, n: [8, 8] },
    { pre: "Der Mond ist im Mittel rund ", post: " km von der Erde entfernt.", unit: "km", dig: 1, lo: 30, hi: 40, n: [5, 5] },
    { pre: "Der Umfang der Erde beträgt rund ", post: " km.", unit: "km", dig: 1, lo: 39, hi: 41, n: [4, 4] },
    { pre: "In Bayern leben rund ", post: " Einwohner.", unit: "Einwohner", dig: 1, lo: 12, hi: 13, n: [7, 7] },
    { pre: "Das Licht legt in einer Sekunde rund ", post: " km zurück.", unit: "km", dig: 0, lo: 2, hi: 3, n: [5, 5] },
    { pre: "Der Durchmesser eines Haares beträgt ", post: " m.", unit: "m", dig: 0, lo: 2, hi: 9, n: [-5, -4] },
    { pre: "Ein Bakterium ist etwa ", post: " m lang.", unit: "m", dig: 0, lo: 2, hi: 9, n: [-6, -6] },
    { pre: "Ein Blatt Kopierpapier ist etwa ", post: " m dick.", unit: "m", dig: 1, lo: 11, hi: 19, n: [-4, -4] },
  ];

  // Schritte: Komma verschieben (Dezimal → wiss.) bzw. Zehnerpotenz ausrechnen (wiss. → Dezimal)
  function stepsToWiss(a, n, unit) {
    return [
      rich("Komma ", String(Math.abs(n)), " Stellen ", n > 0 ? "nach links" : "nach rechts", " verschieben: ", dec(a)),
      rich("= ", dec(a), " · 10", sup(n), suffix(unit)),
    ];
  }
  function stepsToDec(a, n, x, unit) {
    return [
      rich(dec(a), " · 10", sup(n), " = ", dec(a), " · ", decS(pow10(n))),
      rich("= ", dec(x), suffix(unit)),
    ];
  }

  function gen1(rng, level) {
    let a, n, ctx = null;
    if (level === 3) {
      ctx = rng.pick(CTX3);
      a = mant(rng, ctx.dig, ctx.lo, ctx.hi);
      n = rng.int(ctx.n[0], ctx.n[1]);
    } else if (level === 1) {
      a = mant(rng, rng.int(0, 1));
      n = rng.int(2, 6);
    } else {
      a = mant(rng, rng.int(0, 2));
      n = rng.chance(0.5) ? rng.int(2, 7) : -rng.int(2, 6);
    }
    const x = a.mul(pow10(n));
    const unit = ctx ? ctx.unit : null;
    let q, ans, steps;
    if (rng.chance(0.5)) {
      // Dezimalzahl → wissenschaftliche Schreibweise
      q = ctx
        ? rich(ctx.pre, dec(x), ctx.post, " Schreibe in wissenschaftlicher Schreibweise.")
        : rich("Schreibe in wissenschaftlicher Schreibweise: ", dec(x));
      ans = wiss(a, n, unit);
      steps = stepsToWiss(a, n, unit);
    } else {
      // wissenschaftliche Schreibweise → Dezimalzahl
      q = ctx
        ? rich(ctx.pre, dec(a), " · 10", sup(n), ctx.post, " Gib den Wert als Dezimalzahl an.")
        : rich("Schreibe als Dezimalzahl: ", dec(a), " · 10", sup(n));
      ans = rich(dec(x), suffix(unit));
      steps = stepsToDec(a, n, x, unit);
    }
    return { q, a: ans, steps, _x: x, _a: a, _n: n };
  }

  AG.registerType({
    id: "m9-zehnerpotenz-schreibweise",
    klasse: "9",
    zug: "RM",
    lb: "2",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Wissenschaftliche Schreibweise",
    instruction: {
      1: "Schreibe in wissenschaftlicher Schreibweise a · 10ⁿ (1 ≤ a < 10) bzw. als Dezimalzahl.",
      2: "Schreibe in wissenschaftlicher Schreibweise a · 10ⁿ (1 ≤ a < 10) bzw. als Dezimalzahl. Achte auf negative Hochzahlen.",
      3: "Löse die Sachaufgaben. Schreibe die Werte in wissenschaftlicher Schreibweise bzw. als Dezimalzahl.",
    },
    merke: [
      "Jede Zahl wird als a · 10", { sup: "n" }, " mit 1 ≤ a < 10 geschrieben. Die Hochzahl n gibt an, wie oft das Komma verschoben wird: ",
      "bei großen Zahlen nach links (n positiv), bei Zahlen unter 1 nach rechts (n negativ). ",
      "Beispiel: 150 000 000 = 1,5 · 10", { sup: "8" }, ";   0,00045 = 4,5 · 10", { sup: MINUS + "4" },
    ],
    cols: 2,
    generate: gen1,
    verify(t) {
      const ok = t._a.cmp(1) >= 0 && t._a.cmp(10) < 0 && t._a.mul(pow10(t._n)).eq(t._x);
      return ok || "a · 10ⁿ stimmt nicht oder a liegt nicht in [1; 10)";
    },
  });

  // ======================================================================
  // 2. Zehnerpotenzen vergleichen und ordnen
  // ======================================================================
  function gen2(rng, level) {
    if (level === 1) {
      // zwei Zahlen mit < oder > vergleichen
      for (let i = 0; i < 300; i++) {
        const a1 = mant(rng, rng.int(0, 1)), a2 = mant(rng, rng.int(0, 1));
        const n1 = rng.int(2, 6), n2 = rng.int(2, 6);
        const x1 = a1.mul(pow10(n1)), x2 = a2.mul(pow10(n2));
        if (x1.eq(x2)) continue;
        const w1 = wiss(a1, n1), w2 = wiss(a2, n2);
        const sign = x1.cmp(x2) < 0 ? "<" : ">";
        const steps = n1 !== n2
          ? [rich("Der größere Exponent gehört zur größeren Zahl: ", String(n1), " und ", String(n2), ".")]
          : [rich("Gleicher Exponent ", String(n1), ". Vergleiche die Zahlen vor der Zehnerpotenz: ", dec(a1), " und ", dec(a2), ".")];
        steps.push(rich(w1, " ", sign, " ", w2));
        return { q: rich(w1, " ", { blank: 2 }, " ", w2), a: rich(w1, " ", sign, " ", w2), steps, _x1: x1, _x2: x2 };
      }
      throw new Error("ordnen: keine Aufgabe gefunden");
    }

    // Niveau 2: drei Zahlen in wissenschaftlicher Schreibweise; Niveau 3: vier Zahlen, teils als Dezimalzahl
    const count = level === 2 ? 3 : 4;
    for (let i = 0; i < 300; i++) {
      const items = [];
      for (let k = 0; k < count; k++) {
        const a = mant(rng, rng.int(0, level === 2 ? 2 : 1));
        const n = rng.intExcept(-4, 6, [0]);
        const v = a.mul(pow10(n));
        const asDec = level === 3 && rng.chance(0.5);
        items.push({ a, n, v, asDec, disp: asDec ? rich(dec(v)) : wiss(a, n) });
      }
      if (items.some((p, x) => items.some((r, y) => x < y && p.v.eq(r.v)))) continue;
      const sorted = items.slice().sort((p, r) => p.v.cmp(r.v));
      const a = joinRich(sorted.map(p => p.disp), " < ");
      const steps = items.filter(p => p.asDec).map(p => rich(p.disp, " = ", wiss(p.a, p.n)));
      steps.push(rich("Hochzahlen: ", items.map(p => sgn(p.n) + String(Math.abs(p.n))).join(" ; ")));
      if (new Set(items.map(p => p.n)).size < items.length) {
        steps.push(rich("Bei gleicher Hochzahl entscheidet die Zahl vor der Zehnerpotenz."));
      }
      steps.push(rich(a));
      return {
        q: rich("Ordne die Zahlen vom kleinsten zum größten: ", joinRich(items.map(p => p.disp), " ; ")),
        a,
        steps,
        _vals: sorted.map(p => p.v),
      };
    }
    throw new Error("ordnen: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m9-zehnerpotenz-ordnen",
    klasse: "9",
    zug: "RM",
    lb: "2",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Zehnerpotenzen vergleichen und ordnen",
    instruction: {
      1: "Setze das passende Zeichen < oder > ein.",
      2: "Ordne jeweils die Zahlen der Größe nach.",
      3: "Ordne jeweils die Zahlen der Größe nach. Rechne Dezimalzahlen zuerst in Zehnerpotenzen um.",
    },
    merke: [
      "Zehnerpotenzen vergleicht man zuerst über die Hochzahl: ", { b: "größere Hochzahl → größere Zahl" },
      ". Bei gleicher Hochzahl entscheidet die Zahl vor der Zehnerpotenz.   ",
      "Beispiel: 3 · 10", { sup: "5" }, " > 9 · 10", { sup: "4" }, ";   2 · 10", { sup: MINUS + "3" }, " > 5 · 10", { sup: MINUS + "4" },
    ],
    cols: 2,
    generate: gen2,
    verify(t) {
      if (t._vals) {
        for (let i = 1; i < t._vals.length; i++) {
          if (t._vals[i - 1].cmp(t._vals[i]) >= 0) return "Reihenfolge stimmt nicht";
        }
        return true;
      }
      const sign = AG.plain(t.a).includes("<");
      return (t._x1.cmp(t._x2) < 0) === sign || "Vergleichszeichen stimmt nicht";
    },
  });

  // ======================================================================
  // 3. Vorsilben umrechnen
  // ======================================================================
  // Vorsilbe → Zehnerpotenz (Dezimalvorsilben)
  const PX = { n: -9, "µ": -6, m: -3, "": 0, k: 3, M: 6, G: 9, T: 12, P: 15 };
  // Einheitenfamilien: Grundeinheit und erlaubte Vorsilben
  const FAMILIES = [
    { base: "B", list: ["k", "M", "G", "T", "P"] },    // Byte: kB, MB, GB, TB, PB
    { base: "m", list: ["n", "µ", "m", "", "k"] },          // Länge: nm, µm, mm, m, km
    { base: "W", list: ["", "k", "M", "G"] },          // Leistung: W, kW, MW, GW
  ];
  const symOf = (p, base) => p + base;

  // Umrechnung einer Zahl: 1 u1 = 10^d u2, daher b = a · 10^d
  function convert(rng, level) {
    const fam = rng.pick(FAMILIES);
    const dig = level === 1 ? rng.int(0, 1) : rng.int(0, 2);
    const maxD = level === 1 ? 6 : 9;
    for (let i = 0; i < 300; i++) {
      const p1 = rng.pick(fam.list), p2 = rng.pick(fam.list);
      if (p1 === p2) continue;
      const d = PX[p1] - PX[p2];
      if (Math.abs(d) > maxD || Math.abs(d) > 6) continue;   // nur benachbarte bzw. zwei Stufen auseinander
      const a = mant(rng, dig);
      const b = a.mul(pow10(d));
      if (b.decimals() > 6) continue;
      const u1 = symOf(p1, fam.base), u2 = symOf(p2, fam.base);
      return {
        q: rich("Rechne um: ", dec(a), " ", u1, " = ", { blank: 8 }, " ", u2),
        a: rich(dec(b), " ", u2),
        steps: [
          rich("1 ", u1, " = ", decS(pow10(d)), " ", u2),
          rich(dec(a), " ", u1, " = ", dec(a), " · ", decS(pow10(d)), " ", u2),
          rich("= ", dec(b), " ", u2),
        ],
        _a: a, _b: b, _d: d,
      };
    }
    throw new Error("vorsilben: keine Aufgabe gefunden");
  }

  // Sachkontexte mit Umrechnung (from → to, Zehnerpotenz e1 bzw. e2)
  const CTX_V = [
    { pre: "Eine Festplatte speichert ", post: " TB Daten. Wie viele GB sind das?", from: "TB", to: "GB", e1: 12, e2: 9, vals: ["0,5", "1", "1,5", "2", "4"] },
    { pre: "Ein Staubsauger hat eine Leistung von ", post: " kW. Wie viele W sind das?", from: "kW", to: "W", e1: 3, e2: 0, vals: ["0,8", "1,2", "1,5", "1,8", "2,2"] },
    { pre: "Eine Windkraftanlage liefert im Mittel ", post: " MW. Wie viele kW sind das?", from: "MW", to: "kW", e1: 6, e2: 3, vals: ["1,5", "2,5", "3,2", "4"] },
    { pre: "Ein Virus ist ", post: " nm groß. Wie groß ist er in µm?", from: "nm", to: "µm", e1: -9, e2: -6, vals: ["20", "30", "50", "80", "100", "150", "200", "250", "300"] },
    { pre: "Ein Haar ist ", post: " µm dick. Wie dick ist es in mm?", from: "µm", to: "mm", e1: -6, e2: -3, vals: ["40", "50", "60", "70", "80", "90", "100"] },
  ];

  function contextConvert(rng) {
    const c = rng.pick(CTX_V);
    const v = fromDec(rng.pick(c.vals));
    const d = c.e1 - c.e2;
    const b = v.mul(pow10(d));
    return {
      q: rich(c.pre, dec(v), c.post),
      a: rich(dec(b), " ", c.to),
      steps: [
        rich("1 ", c.from, " = ", decS(pow10(d)), " ", c.to),
        rich(dec(v), " ", c.from, " = ", dec(v), " · ", decS(pow10(d)), " ", c.to),
        rich("= ", dec(b), " ", c.to),
      ],
      _a: v, _b: b, _d: d,
    };
  }

  // Speicher-Sachaufgabe: Fotos auf einer Karte (1 GB = 1000 MB)
  function photo(rng) {
    for (let i = 0; i < 200; i++) {
      const s = fromDec(rng.pick(["2", "2,5", "4", "5", "8"]));
      const C = rng.pick([8, 16, 32, 64, 128]);
      const cnt = new Frac(1000 * C, 1).div(s);
      if (!cnt.isInt()) continue;
      return {
        q: rich("Wie viele Fotos mit je ", dec(s), " MB passen auf eine ", String(C), "-GB-Karte? (1 GB = 1000 MB)"),
        a: rich(fmtInt(cnt.n), " Fotos"),
        steps: [
          rich("1 GB = 1000 MB"),
          rich(String(C), " GB = ", fmtInt(C * 1000), " MB"),
          rich(fmtInt(C * 1000), " MB : ", dec(s), " MB = ", fmtInt(cnt.n), " Fotos"),
        ],
        _s: s, _C: C, _cnt: cnt,
      };
    }
    throw new Error("photo: keine Aufgabe gefunden");
  }

  function gen3(rng, level) {
    if (level !== 3) return convert(rng, level);
    return rng.chance(0.25) ? photo(rng) : contextConvert(rng);
  }

  AG.registerType({
    id: "m9-vorsilben",
    klasse: "9",
    zug: "RM",
    lb: "2",
    lbTitle: "Potenzen",
    topic: "potenzen",
    title: "Vorsilben umrechnen",
    instruction: {
      1: "Rechne in die angegebene Einheit um.",
      2: "Rechne in die angegebene Einheit um. Die Vorsilben geben Zehnerpotenzen an.",
      3: "Löse die Sachaufgaben. Rechne in die verlangte Einheit um.",
    },
    merke: [
      "Vorsilben sind Zehnerpotenzen: k = 10", { sup: "3" }, ", M = 10", { sup: "6" }, ", G = 10", { sup: "9" },
      ", T = 10", { sup: "12" }, ", P = 10", { sup: "15" }, "; m = 10", { sup: MINUS + "3" }, ", µ = 10", { sup: MINUS + "6" },
      ", n = 10", { sup: MINUS + "9" }, ". ",
      "1 GB = 1000 MB.   Beispiel: 3,5 GB = 3,5 · 1000 MB = 3500 MB",
    ],
    cols: 3,
    generate: gen3,
    verify(t) {
      if (t._C) return t._cnt.mul(t._s).eq(new Frac(1000 * t._C, 1)) || "Fotozahl stimmt nicht";
      return t._b.eq(t._a.mul(pow10(t._d))) || "Umrechnung stimmt nicht";
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
