// M6 LB 1.1 und 1.2 (Dezimalbrüche): Bruch – Dezimalbruch – Prozent, Vergleichen und Ordnen,
// Addition und Subtraktion, Multiplikation und Division, Runden.
(function (AG) {
  const { Frac, num, rich, fmtDec, fmtInt, MINUS } = AG;
  const TOPIC = "brueche";

  // ---------- Hilfen ----------
  const dz = x => num(x, { as: "dec" });                       // Zahl als Dezimalzahl mit Komma („0,5“, „12“)
  const pc = p => rich(dz(p), " %");                           // Prozentsatz („37,5 %“)
  const scaled = (x, k) => String(Frac.of(x).mul(10 ** k).n);  // Komma um k Stellen nach rechts: 2,46 → 246 (k = 2)
  const stellen = k => (k === 1 ? "Stelle" : "Stellen");
  const mk = val => ({ val, dig: val.decimals() });            // Zahl mit so vielen Stellen, wie sie hat
  // Begrenzte Wiederholung: nach 300 Versuchen ein Fehler (keine Endlosschleife)
  function tryGen(fn, ok) {
    for (let i = 0; i < 300; i++) {
      const r = fn();
      if (ok(r)) return r;
    }
    throw new Error("m6: keine passende Aufgabe gefunden");
  }
  // Dezimalzahl mit genau k Nachkommastellen, 0 < x < max (letzte Stelle ungleich 0)
  function dv(rng, k, max) {
    for (let i = 0; i < 500; i++) {
      const n = rng.int(1, max * 10 ** k - 1);
      if (n % 10 !== 0) return new Frac(n, 10 ** k);
    }
    throw new Error("m6: keine Dezimalzahl mit " + k + " Stellen");
  }

  // ---------- 1. Bruch, Dezimalbruch, Prozentsatz ----------
  const PAIRS = dens => {
    const out = [];
    for (const d of dens) for (let n = 1; n < d; n++) if (AG.gcd(n, d) === 1) out.push([n, d]);
    return out;
  };
  const PAIRS12 = PAIRS([2, 4, 5, 10, 20, 25, 50, 100]);
  const PAIRS3 = PAIRS([2, 4, 5, 8, 10, 20, 25, 50, 100, 1000]);
  const ORDER = ["bruch", "dez", "pct"];
  const LABEL = { bruch: "gekürzten Bruch", dez: "Dezimalzahl", pct: "Prozentsatz" };
  const dedupe = list => list.filter((x, i) => i === 0 || AG.plain(x) !== AG.plain(list[i - 1]));
  const eqs = list => list.flatMap((x, i) => (i ? [" = ", x] : [x]));

  AG.registerType({
    id: "m6-bruch-dezimal-prozent",
    klasse: "6",
    zug: "RM",
    lb: "1.1",
    lbTitle: "Erweiterung auf Bruchzahlen",
    title: "Bruch, Dezimalzahl, Prozent",
    topic: TOPIC,
    instruction: {
      1: "Schreibe in der angegebenen Form.",
      2: "Schreibe in der angegebenen Form. Kürze den Bruch vollständig.",
      3: "Schreibe in den angegebenen Formen. Erweitere den Bruch auf 10, 100 oder 1000.",
    },
    merke: [
      "Ein Bruch wird zur Dezimalzahl, wenn man auf den Nenner 10, 100 oder 1000 erweitert. Prozent heißt „von Hundert“: 1 % = 1/100 = 0,01.   Beispiel: ",
      { f: [3, 8] }, " = ", { f: [375, 1000] }, " = 0,375 = 37,5 %",
    ],
    cols: 3,
    generate(rng, level) {
      const [n, d] = rng.pick(level === 3 ? PAIRS3 : PAIRS12);
      const val = new Frac(n, d);
      const pct = val.mul(100);
      const rep = { bruch: num(val), dez: dz(val), pct: pc(pct) };
      const src = rng.pick(ORDER);
      const others = ORDER.filter(x => x !== src);
      const targets = level === 1 ? [rng.pick(others)] : others;
      const want = t => targets.includes(t);
      // Kette gleicher Werte, z. B. 3/8 = 375/1000 = 0,375 = 37,5 %
      const K = val.decimals(), J = pct.decimals();
      const big = { f: [val.n * 10 ** K / val.d, 10 ** K] };           // auf 10, 100 oder 1000 erweitert
      const pctRaw = { f: [pct.n * 10 ** J / pct.d, 100 * 10 ** J] };  // Prozent als Bruch mit Nenner 100
      const chain = src === "bruch"
        ? [num(val), big, dz(val), want("pct") ? pc(pct) : null]
        : src === "dez"
          ? [dz(val), big, want("bruch") ? num(val) : null, want("pct") ? pc(pct) : null]
          : [pc(pct), pctRaw, want("bruch") ? num(val) : null, want("dez") ? dz(val) : null];
      const steps = [rich(eqs(dedupe(chain.filter(Boolean))))];
      const tg = ORDER.filter(want);
      const q = rich("Schreibe ", tg.map(t => "als " + LABEL[t]).join(" und "), ": ", rep[src]);
      const a = rich(tg.flatMap((t, i) => (i ? [" und ", rep[t]] : [rep[t]])));
      return { q, a, steps, _val: val, _pct: pct };
    },
    verify(t) {
      return t._val.mul(100).eq(t._pct) ? true : "Prozentsatz ist nicht Bruch · 100";
    },
  });

  // ---------- 2. Dezimalbrüche vergleichen und ordnen ----------
  const naive = x => Number(fmtDec(x.val, x.dig).replace(",", ""));  // Fehlerquelle: Stellen ohne Komma vergleichen
  const numeric = list => [...list].sort((x, y) => x.val.cmp(y.val));
  // Gleiche Zahlen sind verboten, mindestens zwei Stellenzahlen, und die falsche Reihenfolge („0,405 > 0,45“) muss möglich sein
  const okOrder = list => {
    if (new Set(list.map(x => x.val.toString())).size !== list.length) return false;
    if (new Set(list.map(x => x.dig)).size < 2) return false;
    const byNaive = [...list].sort((x, y) => naive(x) - naive(y)).map(x => x.val.toString()).join();
    return byNaive !== numeric(list).map(x => x.val.toString()).join();
  };
  const CTX_GR = [
    { unit: "m", t: "Diese Weitsprünge wurden gemessen: ", max: 3 },
    { unit: "kg", t: "Diese Mengen Kartoffeln wurden gewogen: ", max: 3 },
    { unit: "l", t: "Diese Mengen Saft wurden abgefüllt: ", max: 2 },
  ];

  AG.registerType({
    id: "m6-dezimal-ordnen",
    klasse: "6",
    zug: "RM",
    lb: "1.1",
    lbTitle: "Erweiterung auf Bruchzahlen",
    title: "Dezimalzahlen vergleichen und ordnen",
    topic: TOPIC,
    instruction: {
      1: "Setze das richtige Zeichen ein: <, > oder =.",
      2: "Ordne die Zahlen vom kleinsten zum größten.",
      3: "Ordne die Größen vom kleinsten zum größten.",
    },
    merke: [
      "Zuerst gleich viele Stellen schreiben (hinten Nullen anhängen), dann die Zahlen ohne Komma vergleichen. ",
      "Beispiel: 0,5 > 0,45, denn 50 > 45 (Hundertstel). Also 0,405 < 0,45 < 0,5.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const k1 = rng.int(1, 2);
        const A = mk(dv(rng, k1, 10));
        const B = rng.chance(0.25)
          ? { val: A.val, dig: A.dig + rng.int(1, 2) }                       // gleicher Wert: 0,3 = 0,30
          : mk(tryGen(() => dv(rng, rng.int(1, 3), 10), x => !x.eq(A.val)));
        const c = A.val.cmp(B.val);
        const sign = c < 0 ? "<" : c > 0 ? ">" : "=";
        const K = Math.max(A.dig, B.dig);
        return {
          q: rich("Setze <, > oder = richtig ein: ", fmtDec(A.val, A.dig), " ", { blank: 2 }, " ", fmtDec(B.val, B.dig)),
          a: rich(fmtDec(A.val, A.dig), " ", sign, " ", fmtDec(B.val, B.dig)),
          steps: [
            rich("Gleiche Stellenzahl: ", fmtDec(A.val, K), " und ", fmtDec(B.val, K)),
            rich(scaled(A.val, K), " ", sign, " ", scaled(B.val, K), ", also ", fmtDec(A.val, A.dig), " ", sign, " ", fmtDec(B.val, B.dig)),
          ],
        };
      }
      if (level === 2) {
        const items = tryGen(
          () => Array.from({ length: rng.int(3, 4) }, () => mk(dv(rng, rng.int(1, 3), 2))),
          okOrder,
        );
        const sorted = numeric(items);
        const K = Math.max(...items.map(x => x.dig));
        const a = rich(sorted.map(x => fmtDec(x.val, x.dig)).join(" < "));
        return {
          q: rich("Ordne die Zahlen vom kleinsten zum größten: ", items.map(x => fmtDec(x.val, x.dig)).join("; ")),
          a,
          steps: [
            rich("Gleiche Stellenzahl: ", items.map(x => fmtDec(x.val, K)).join("; ")),
            rich("Ohne Komma vergleichen: ", sorted.map(x => scaled(x.val, K)).join(" < ")),
            rich("Ergebnis: ", a),
          ],
        };
      }
      // Niveau 3: Größen mit Einheit
      const ctx = rng.pick(CTX_GR);
      const items = tryGen(
        () => Array.from({ length: rng.int(3, 4) }, () => mk(dv(rng, rng.int(1, 3), ctx.max))),
        okOrder,
      );
      const sorted = numeric(items);
      const K = Math.max(...items.map(x => x.dig));
      const a = rich(sorted.map(x => fmtDec(x.val, x.dig) + " " + ctx.unit).join(" < "));
      return {
        q: rich(ctx.t, items.map(x => fmtDec(x.val, x.dig) + " " + ctx.unit).join("; "), ". Ordne vom kleinsten zum größten."),
        a,
        steps: [
          rich("Gleiche Stellenzahl: ", items.map(x => fmtDec(x.val, K) + " " + ctx.unit).join("; ")),
          rich("Ohne Komma vergleichen: ", sorted.map(x => scaled(x.val, K)).join(" < ")),
          rich("Ergebnis: ", a),
        ],
      };
    },
  });

  // ---------- 3. Dezimalbrüche addieren und subtrahieren ----------
  const term = (rng, k, max) => ({ val: dv(rng, k, max), dig: k });
  const disp = t => fmtDec(t.val, t.dig);

  AG.registerType({
    id: "m6-dezimal-addsub",
    klasse: "6",
    zug: "RM",
    lb: "1.2",
    lbTitle: "Rechnen mit Bruchzahlen",
    title: "Dezimalzahlen addieren und subtrahieren",
    topic: TOPIC,
    instruction: {
      1: "Rechne. Schreibe das Komma unter das Komma.",
      2: "Rechne. Die Zahlen haben verschieden viele Stellen nach dem Komma.",
      3: "Rechne. Achte auf die Reihenfolge und auf die Kommas.",
    },
    merke: [
      "Komma unter Komma schreiben, fehlende Stellen mit Nullen auffüllen, dann wie natürliche Zahlen rechnen. ",
      "Beispiel: 3,4 + 1,25 = 3,40 + 1,25 = 4,65",
    ],
    cols: 3,
    generate(rng, level) {
      if (level < 3) {
        const { A, B, op } = tryGen(() => {
          const ka = rng.int(1, 2);
          const kb = level === 1 ? ka : ka === 1 ? rng.int(2, 3) : rng.pick([1, 3]);
          const op = rng.pick(["+", MINUS]);
          let A = term(rng, ka, 20), B = term(rng, kb, 20);
          if (op === MINUS && A.val.cmp(B.val) < 0) [A, B] = [B, A];
          return { A, B, op };
        }, r => r.op === "+" || !r.A.val.eq(r.B.val));
        const res = op === "+" ? A.val.add(B.val) : A.val.sub(B.val);
        const K = Math.max(A.dig, B.dig);
        return {
          q: rich(disp(A), " ", op, " ", disp(B)),
          a: dz(res),
          steps: [
            rich("Gleiche Stellenzahl: ", fmtDec(A.val, K), " ", op, " ", fmtDec(B.val, K)),
            rich(scaled(A.val, K), " ", op, " ", scaled(B.val, K), " = ", scaled(res, K)),
            rich("= ", dz(res)),
          ],
        };
      }
      // Niveau 3: drei Zahlen mit unterschiedlich vielen Stellen
      const r3 = tryGen(() => {
        const [t1, t2, t3] = [rng.int(1, 2), rng.int(1, 2), rng.int(1, 2)].map(k => term(rng, k, 10));
        const op1 = rng.pick(["+", MINUS]), op2 = rng.pick(["+", MINUS]);
        let a = t1, b = t2;
        if (op1 === MINUS && a.val.cmp(b.val) < 0) [a, b] = [b, a];
        const r1 = op1 === "+" ? a.val.add(b.val) : a.val.sub(b.val);
        if (op2 === MINUS && r1.cmp(t3.val) < 0) return null;
        const res = op2 === "+" ? r1.add(t3.val) : r1.sub(t3.val);
        return { t1: a, t2: b, t3, op1, op2, r1, res };
      }, r => r && new Set([r.t1.dig, r.t2.dig, r.t3.dig]).size >= 2 && r.res.n > 0);
      const K = Math.max(r3.t1.dig, r3.t2.dig, r3.t3.dig);
      return {
        q: rich(disp(r3.t1), " ", r3.op1, " ", disp(r3.t2), " ", r3.op2, " ", disp(r3.t3)),
        a: dz(r3.res),
        steps: [
          rich("Gleiche Stellenzahl: ", fmtDec(r3.t1.val, K), " ", r3.op1, " ", fmtDec(r3.t2.val, K), " ", r3.op2, " ", fmtDec(r3.t3.val, K)),
          rich(scaled(r3.t1.val, K), " ", r3.op1, " ", scaled(r3.t2.val, K), " = ", scaled(r3.r1, K)),
          rich(scaled(r3.r1, K), " ", r3.op2, " ", scaled(r3.t3.val, K), " = ", scaled(r3.res, K)),
          rich("= ", dz(r3.res)),
        ],
      };
    },
  });

  // ---------- 4. Dezimalbrüche multiplizieren und dividieren ----------
  AG.registerType({
    id: "m6-dezimal-muldiv",
    klasse: "6",
    zug: "RM",
    lb: "1.2",
    lbTitle: "Rechnen mit Bruchzahlen",
    title: "Dezimalzahlen multiplizieren und dividieren",
    topic: TOPIC,
    instruction: {
      1: "Multipliziere. Achte auf das Komma.",
      2: "Rechne. Zähle die Kommastellen.",
      3: "Dividiere. Mache den Teiler zu einer ganzen Zahl.",
    },
    merke: [
      "Multiplizieren: Kommas weglassen und rechnen, dann so viele Stellen vom Komma abzählen, wie beide Faktoren zusammen haben. ",
      "Beispiel: 0,4 · 0,3 = 0,12 (1 + 1 = 2 Stellen).   Dividieren durch eine Dezimalzahl: beide Zahlen so malnehmen, dass der Teiler ganz wird. Beispiel: 4,8 : 0,6 = 48 : 6 = 8",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) {
        const k = rng.int(1, 2);
        const a = dv(rng, k, k === 1 ? 100 : 10);
        if (rng.chance(0.5)) {
          const b = rng.pick([10, 100, 1000]);
          const z = Math.log10(b);
          return {
            q: rich(dz(a), " · ", fmtInt(b)),
            a: dz(a.mul(b)),
            steps: [
              rich("Das Komma rückt um ", String(z), " ", stellen(z), " nach rechts."),
              rich(dz(a), " · ", fmtInt(b), " = ", dz(a.mul(b))),
            ],
          };
        }
        const b = rng.int(2, 9);
        return {
          q: rich(dz(a), " · ", String(b)),
          a: dz(a.mul(b)),
          steps: [
            rich(scaled(a, k), " · ", String(b), " = ", scaled(a.mul(b), k)),
            rich("Das Komma rückt um ", String(k), " ", stellen(k), " nach links: ", dz(a.mul(b))),
          ],
        };
      }
      if (level === 2 && rng.chance(0.5)) {
        // Dezimalzahl · Dezimalzahl
        const k1 = rng.int(1, 2), k2 = k1 === 1 ? rng.int(1, 2) : 1;
        const a = dv(rng, k1, 10), b = dv(rng, k2, 10);
        const A = scaled(a, k1), B = scaled(b, k2);
        return {
          q: rich(dz(a), " · ", dz(b)),
          a: dz(a.mul(b)),
          steps: [
            rich("Ohne Komma: ", A, " · ", B, " = ", String(Number(A) * Number(B))),
            rich("Kommastellen: ", String(k1), " + ", String(k2), " = ", String(k1 + k2), ", also ", dz(a.mul(b))),
          ],
        };
      }
      if (level === 2) {
        // Dezimalzahl : natürliche Zahl, Ergebnis geht auf
        const n = rng.int(2, 9);
        const r = dv(rng, rng.int(1, 2), 10);
        const a = r.mul(n);
        const K = Math.max(a.decimals(), r.decimals());
        return {
          q: rich(dz(a), " : ", String(n)),
          a: dz(r),
          steps: [
            rich(scaled(a, K), " : ", String(n), " = ", scaled(r, K)),
            rich("Das Komma rückt um ", String(K), " ", stellen(K), " nach links: ", dz(r)),
          ],
        };
      }
      // Niveau 3: Division durch eine Dezimalzahl
      const kb = rng.int(1, 2);
      const b = dv(rng, kb, 10);
      const qv = rng.chance(0.7) ? new Frac(rng.int(2, 25), 1) : new Frac(rng.int(11, 99), 10);
      const a = b.mul(qv);
      const e = Math.max(a.decimals(), kb);
      return {
        q: rich(dz(a), " : ", dz(b)),
        a: dz(qv),
        steps: [
          rich("Beide Zahlen mit ", fmtInt(10 ** e), " malnehmen, also das Komma um ", String(e), " ", stellen(e), " nach rechts: ", scaled(a, e), " : ", scaled(b, e)),
          rich(scaled(a, e), " : ", scaled(b, e), " = ", dz(qv)),
        ],
      };
    },
  });

  // ---------- 5. Dezimalbrüche runden ----------
  const PLACE = { 0: "ganze Zahlen", 1: "Zehntel", 2: "Hundertstel", 3: "Tausendstel" };
  const RCTX = [
    { unit: "km", t: "Lea läuft jeden Morgen einen Schulweg von " },
    { unit: "kg", t: "Ein Sack Kartoffeln wiegt " },
    { unit: "l", t: "In einer Flasche sind " },
    { unit: "s", t: "Max braucht für den Sprint " },
  ];
  // Zahl mit d Nachkommastellen, auf p Stellen zu runden. Keine genaue Hälfte (sonst ist die Rundung nicht eindeutig).
  // over: die gerundeten Stellen sind alle 9, es gibt einen Übertrag (2,996 auf Hundertstel = 3,00)
  function roundCase(rng, p, d, over) {
    const dd = d - p, unit = 10 ** dd;
    const X = tryGen(() => {
      if (over) {
        const kept = p === 0 ? rng.pick([9, 19, 29, 39, 49, 59, 69, 79, 89, 99]) : rng.int(0, 9) * 10 ** p + 10 ** p - 1;
        return kept * unit + rng.int(5 * 10 ** (dd - 1) + 1, unit - 1);
      }
      return rng.int(10 ** d, 20 * 10 ** d);
    }, X => X % 10 !== 0 && X % unit !== 0 && (X % unit) * 2 !== unit);
    const q = Math.floor(X / unit), r = X % unit;
    const up = r * 2 > unit;
    return {
      x: new Frac(X, 10 ** d),
      up,
      digit: Math.floor((r * 10) / unit),
      trunc: new Frac(q, 10 ** p),
      res: new Frac(q + (up ? 1 : 0), 10 ** p),
    };
  }

  AG.registerType({
    id: "m6-dezimal-runden",
    klasse: "6",
    zug: "RM",
    lb: "1.2",
    lbTitle: "Rechnen mit Bruchzahlen",
    title: "Dezimalzahlen runden",
    topic: TOPIC,
    instruction: {
      1: "Runde auf die angegebene Stelle.",
      2: "Runde auf die angegebene Stelle. Achte auf die Ziffer dahinter.",
      3: "Runde auf die angegebene Stelle. Achte auf den Übertrag, wenn eine 9 aufgerundet wird.",
    },
    merke: [
      "Ist die erste weggelassene Ziffer 0 bis 4, wird abgerundet, bei 5 bis 9 aufgerundet. ",
      "Beispiel: 3,46 auf Zehntel = 3,5.   2,996 auf Hundertstel = 3,00 (Übertrag: 2,99 + 0,01)",
    ],
    cols: 3,
    generate(rng, level) {
      const pairs = level === 1
        ? [[0, 1], [0, 2], [1, 2]]
        : level === 2
          ? [[0, 2], [1, 2], [1, 3], [2, 3]]
          : [[0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [0, 3], [0, 4]];
      const [p, d] = rng.pick(pairs);
      const over = level === 3 ? rng.chance(0.5) : level === 2 ? rng.chance(0.2) : false;
      const c = roundCase(rng, p, d, over);
      const ctx = level >= 2 && rng.chance(0.4) ? rng.pick(RCTX) : null;
      const q = ctx
        ? rich(ctx.t, dz(c.x), " " + ctx.unit + ". Runde auf ", PLACE[p], ".")
        : rich("Runde ", dz(c.x), " auf ", PLACE[p], ".");
      const a = rich(fmtDec(c.res, p), ctx ? " " + ctx.unit : "");
      const steps = [
        rich("Die erste weggelassene Ziffer ist ", String(c.digit), c.up ? ", also aufrunden." : ", also abrunden."),
        c.up
          ? rich(fmtDec(c.trunc, p), " + ", fmtDec(new Frac(1, 10 ** p), p), " = ", fmtDec(c.res, p))
          : rich("= ", fmtDec(c.res, p)),
      ];
      return { q, a, steps, _x: c.x, _p: p, _res: c.res };
    },
    verify(t) {
      // Gegenrechnung: x · 10^p, abschneiden, Rest ab 1/2 aufrunden
      const y = t._x.mul(10 ** t._p);
      const fl = Math.floor(y.n / y.d);
      const e = y.sub(fl).cmp(new Frac(1, 2)) >= 0 ? fl + 1 : fl;
      return t._res.eq(new Frac(e, 10 ** t._p)) ? true : "Rundung falsch";
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
