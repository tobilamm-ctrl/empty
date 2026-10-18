// Klasse 6 LB 1.2: Rechnen mit Bruchzahlen. Fünf Aufgabentypen:
// Addieren und Subtrahieren, Multiplizieren, Bruch durch natürliche Zahl, Rechengesetze, Sachaufgaben.
(function (AG) {
  const { Frac, num, rich, MINUS } = AG;

  const LB = { klasse: "6", zug: "RM", lb: "1.2", lbTitle: "Rechnen mit Bruchzahlen", topic: "brueche" };
  const OPTXT = { "+": " + ", "-": " " + MINUS + " ", "*": " · ", "/": " : " };

  // ---------- Hilfen ----------
  // echter Bruch p/d mit d aus dens (1 <= p < d)
  function properFrac(rng, dens) {
    const d = rng.pick(dens);
    return new Frac(rng.int(1, d - 1), d);
  }
  // gemischte Zahl w p/d mit w aus 1..wMax und d aus dens
  function mixedFrac(rng, dens, wMax) {
    const d = rng.pick(dens);
    return new Frac(rng.int(1, wMax) * d + rng.int(1, d - 1), d);
  }
  // unechter Bruch, der als gemischte Zahl geschrieben wird
  const isMixed = v => !v.isInt() && v.n > v.d;
  // doppelte aufeinanderfolgende Zeilen entfernen
  const uniq = steps => steps.filter((s, i) => i === 0 || AG.plain(s) !== AG.plain(steps[i - 1]));
  // Dezimalzahl, wenn endlich mit höchstens 2 Stellen, sonst Bruch
  const decOrFrac = v => (v.isTerminating() && v.decimals() <= 2 ? num(v, { as: "dec" }) : num(v));
  // Geldbetrag bzw. Dezimalzahl mit genau 2 Stellen
  const dec2 = v => num(v, { as: "dec", digits: 2 });
  // bis zu 300 Versuche, dann Fehler (keine Endlosschleife)
  function gen(cand, rng, level) {
    for (let i = 0; i < 300; i++) {
      const c = cand(rng, level);
      if (c) return c;
    }
    throw new Error("Keine passende Aufgabe gefunden (Niveau " + level + ")");
  }

  // ---------- Typ 1: Addieren und Subtrahieren ----------
  function addsubSteps(terms, res, D) {
    const steps = [];
    const signed = (j, t) => (j === 0 || t.op === "+" ? 1 : -1);
    if (terms.some(t => isMixed(t.v))) {
      steps.push(rich("= ", terms.map((t, j) => [j ? OPTXT[t.op] : "", num(t.v, { as: "improper" })])));
    }
    if (terms.some(t => t.v.d !== D)) {
      steps.push(rich("= ", terms.map((t, j) => [j ? OPTXT[t.op] : "", { f: [t.v.n * (D / t.v.d), D] }])));
    }
    const sum = terms.reduce((acc, t, j) => acc + signed(j, t) * t.v.n * (D / t.v.d), 0);
    steps.push(rich("= ", { f: [sum, D] }));
    if (res.d !== D) steps.push(rich("= ", num(res, { as: "improper" })));
    if (isMixed(res)) steps.push(rich("= ", num(res)));
    return uniq(steps);
  }

  function addsubCand(rng, level) {
    const DENS = [2, 3, 4, 5, 6, 8, 10, 12];
    let terms;
    if (level === 1) {
      // gleichnamig, zwei oder drei Brüche
      const d = rng.pick([2, 3, 4, 5, 6, 8, 10]);
      terms = [{ op: null, v: new Frac(rng.int(1, d - 1), d) }];
      const k = rng.chance(0.3) ? 3 : 2;
      for (let j = 1; j < k; j++) terms.push({ op: rng.pick(["+", "-"]), v: new Frac(rng.int(1, d - 1), d) });
    } else if (level === 2) {
      // ungleichnamig, zwei Brüche; der Hauptnenner ist größer als beide Nenner
      const d1 = rng.pick(DENS), d2 = rng.pick(DENS);
      if (d1 === d2 || AG.lcm(d1, d2) <= Math.max(d1, d2) || AG.lcm(d1, d2) > 60) return null;
      terms = [
        { op: null, v: new Frac(rng.int(1, d1 - 1), d1) },
        { op: rng.pick(["+", "-"]), v: new Frac(rng.int(1, d2 - 1), d2) },
      ];
    } else {
      // gemischte Zahlen und Brüche, zwei oder drei Glieder
      const dens = [2, 3, 4, 5, 6, 8, 12];
      const k = rng.chance(0.5) ? 3 : 2;
      terms = [];
      for (let j = 0; j < k; j++) {
        const v = rng.chance(0.5) ? mixedFrac(rng, dens, 3) : properFrac(rng, dens);
        terms.push({ op: j === 0 ? null : rng.pick(["+", "-"]), v });
      }
      if (!terms.some(t => isMixed(t.v))) return null;
    }
    // Ergebnis darf nie negativ werden, auch nicht zwischendurch
    let cur = terms[0].v;
    for (let j = 1; j < terms.length; j++) {
      cur = terms[j].op === "+" ? cur.add(terms[j].v) : cur.sub(terms[j].v);
      if (cur.sign() <= 0) return null;
    }
    const denoms = terms.map(t => t.v.d);
    const D = denoms.reduce((acc, d) => AG.lcm(acc, d), 1);
    if (D > 60) return null;
    if (level > 1 && new Set(denoms).size < 2) return null; // ungleichnamig
    if (new Set(terms.map(t => t.v.toString())).size < terms.length) return null; // keine gleichen Zahlen
    const res = cur;
    return {
      q: rich(terms.map((t, j) => [j ? OPTXT[t.op] : "", num(t.v)])),
      a: num(res),
      steps: addsubSteps(terms, res, D),
    };
  }

  // ---------- Typ 2: Multiplizieren ----------
  function mulSteps(x, y) {
    const steps = [];
    const P = x.mul(y);
    if (isMixed(x) || isMixed(y)) steps.push(rich("= ", num(x, { as: "improper" }), " · ", num(y, { as: "improper" })));
    // Kürzen über Kreuz: Zähler von x mit Nenner von y und Zähler von y mit Nenner von x
    const g1 = AG.gcd(x.n, y.d), g2 = AG.gcd(y.n, x.d);
    if (g1 > 1 || g2 > 1) {
      const X = new Frac(x.n / g1, x.d / g2), Y = new Frac(y.n / g2, y.d / g1);
      const fs = [X, Y].filter(f => !(f.n === 1 && f.d === 1));
      steps.push(rich("= ", fs.map((f, j) => [j ? " · " : "", num(f, { as: "improper" })])));
    }
    if (isMixed(P)) steps.push(rich("= ", num(P, { as: "improper" })));
    steps.push(rich("= ", num(P)));
    return uniq(steps);
  }

  function mulCand(rng, level) {
    const D1 = [2, 3, 4, 5, 6, 8, 10];
    const D2 = [2, 3, 4, 5, 6, 8, 10, 12];
    const kind = rng.pick(["ff", "nf"]); // ff: Bruch · Bruch, nf: natürliche Zahl · Bruch
    let x, y;
    if (level === 1) {
      if (kind === "ff") {
        x = properFrac(rng, D1);
        y = properFrac(rng, D1);
      } else {
        const f = properFrac(rng, D1), n = Frac.of(rng.int(2, 12));
        [x, y] = rng.chance(0.5) ? [n, f] : [f, n];
      }
    } else if (level === 2) {
      if (kind === "ff") {
        x = properFrac(rng, D2);
        y = properFrac(rng, D2);
        if (!(AG.gcd(x.n, y.d) > 1 || AG.gcd(y.n, x.d) > 1)) return null; // es muss gekürzt werden
      } else {
        const f = properFrac(rng, D2), n = Frac.of(rng.int(2, 12));
        if (AG.gcd(n.n, f.d) <= 1) return null; // die Zahl und der Nenner haben einen gemeinsamen Teiler
        [x, y] = rng.chance(0.5) ? [n, f] : [f, n];
      }
    } else {
      // gemischte Zahlen werden zuerst umgewandelt
      const dens = [2, 3, 4, 5, 6, 8];
      if (kind === "ff") {
        x = mixedFrac(rng, dens, 3);
        y = rng.chance(0.5) ? mixedFrac(rng, dens, 3) : properFrac(rng, [2, 3, 4, 5, 6, 8, 10]);
      } else {
        const f = mixedFrac(rng, dens, 3), n = Frac.of(rng.int(2, 9));
        [x, y] = rng.chance(0.5) ? [n, f] : [f, n];
      }
    }
    const P = x.mul(y);
    if (P.isInt() || x.eq(y) || P.valueOf() > 40) return null;
    return { q: rich(num(x), " · ", num(y)), a: num(P), steps: mulSteps(x, y) };
  }

  // ---------- Typ 3: Bruch durch natürliche Zahl ----------
  function divSteps(x, n, prefix) {
    const steps = [];
    if (prefix) steps.push(rich("= ", num(x, { as: "improper" }), " : ", num(n)));
    const res = x.div(n);
    // Zähler teilbar: Zähler teilen; sonst Nenner mal Zahl
    steps.push(rich("= ", x.n % n === 0 ? { f: [x.n / n, x.d] } : { f: [x.n, x.d * n] }));
    steps.push(rich("= ", num(res, { as: "improper" })));
    if (isMixed(res)) steps.push(rich("= ", num(res)));
    return uniq(steps);
  }

  function divCand(rng, level) {
    let x, n;
    if (level === 1) {
      const b = rng.int(2, 10);
      x = new Frac(rng.int(1, b - 1), b);
      n = rng.int(2, 6);
    } else if (level === 2) {
      // unechter Bruch als Eingabe
      const b = rng.int(2, 8);
      x = new Frac(rng.int(b + 1, 3 * b - 1), b);
      n = rng.int(2, 6);
      if (x.isInt()) return null;
    } else {
      x = mixedFrac(rng, [2, 3, 4, 5, 6, 8], 4);
      n = rng.int(2, 9);
    }
    const res = x.div(n);
    if (res.isInt()) return null;
    return {
      q: rich(level === 3 ? num(x) : num(x, { as: "improper" }), " : ", num(n)),
      a: num(res),
      steps: divSteps(x, n, level === 3),
    };
  }

  // ---------- Typ 4: Rechengesetze und Punkt vor Strich ----------
  // Dezimalzahl mit natürlicher Zahl, deren Produkt ganzzahlig ist (höchstens 2 Nachkommastellen)
  const DEC_PAIRS = [
    [new Frac(25, 100), 4], [new Frac(5, 10), 2], [new Frac(2, 10), 5], [new Frac(25, 100), 8],
    [new Frac(5, 10), 6], [new Frac(5, 10), 10], [new Frac(2, 10), 10], [new Frac(75, 100), 4],
    [new Frac(25, 100), 12], [new Frac(5, 10), 14], [new Frac(25, 100), 20], [new Frac(15, 10), 2],
  ];

  // a · m · c mit a · c ganzzahlig: zuerst die passenden Zahlen
  function kDec(rng, level) {
    const [a, c] = rng.pick(DEC_PAIRS);
    const N = a.mul(c);
    let m;
    if (level === 3) {
      if (N.n === 1) return null;
      const dens = [3, 4, 5, 6, 8].filter(q => N.n % q !== 0);
      if (!dens.length) return null;
      m = properFrac(rng, dens);
    } else {
      m = Frac.of(rng.int(2, 9));
    }
    const res = N.mul(m);
    return {
      q: rich(num(a, { as: "dec" }), " · ", num(m), " · ", num(c)),
      a: num(res),
      steps: uniq([
        rich("= (", num(a, { as: "dec" }), " · ", num(c), ") · ", num(m)),
        rich("= ", num(N), " · ", num(m)),
        rich("= ", num(res)),
      ]),
    };
  }

  // x · m · (1/x) mit Kehrwerten: (x · Kehrwert) zuerst
  function kRecip(rng) {
    const q = rng.int(3, 9), p = rng.int(1, q - 1);
    if (AG.gcd(p, q) !== 1) return null;
    const x = new Frac(p, q), y = new Frac(q, p);
    const m = rng.int(2, 25);
    const res = Frac.of(m);
    return {
      q: rich(num(x), " · ", num(m), " · ", num(y, { as: "improper" })),
      a: num(res),
      steps: uniq([
        rich("= (", num(x), " · ", num(y, { as: "improper" }), ") · ", num(m)),
        rich("= 1 · ", num(m)),
        rich("= ", num(res)),
      ]),
    };
  }

  // x + y + z mit x und z gleichnamig: (x + z) + y
  function kSum(rng, level) {
    const D = rng.pick([4, 5, 6, 8, 10, 12]);
    const E = rng.pick([2, 3, 4, 5, 6, 8, 10].filter(e => e !== D));
    const x = level === 3 ? new Frac(rng.int(1, 3) * D + rng.int(1, D - 1), D) : new Frac(rng.int(1, D - 1), D);
    const z = level === 3 ? new Frac(rng.int(1, 3) * D + rng.int(1, D - 1), D) : new Frac(rng.int(1, D - 1), D);
    const y = level === 3 ? mixedFrac(rng, [E], 2) : properFrac(rng, [E]);
    if (x.eq(z)) return null;
    const s = x.add(z), res = s.add(y);
    return {
      q: rich(num(x), " + ", num(y), " + ", num(z)),
      a: num(res),
      steps: uniq([
        rich("= (", num(x), " + ", num(z), ") + ", num(y)),
        rich("= ", num(s), " + ", num(y)),
        rich("= ", num(res)),
      ]),
    };
  }

  // n · (x ± y) = n · x ± n · y, n ist Vielfaches beider Nenner
  function kDist(rng, level) {
    const dens = level === 1 ? [2, 3, 4, 6] : [2, 3, 4, 5, 6, 8, 10, 12];
    const d1 = rng.pick(dens), d2 = rng.pick(dens);
    const x = level === 3 ? mixedFrac(rng, [d1], 3) : properFrac(rng, [d1]);
    const y = properFrac(rng, [d2]);
    const op = level === 3 && rng.chance(0.5) ? "-" : "+";
    if (x.eq(y)) return null;
    const diff = op === "+" ? x.add(y) : x.sub(y);
    if (diff.sign() <= 0) return null;
    const L = AG.lcm(d1, d2);
    const nMax = { 1: 24, 2: 36, 3: 60 }[level];
    if (Math.floor(nMax / L) < 1) return null;
    const n = L * rng.int(1, Math.floor(nMax / L));
    if (n < 2) return null;
    const t1 = x.mul(n), t2 = y.mul(n);
    const res = op === "+" ? t1.add(t2) : t1.sub(t2);
    return {
      q: rich(num(n), " · (", num(x), OPTXT[op], num(y), ")"),
      a: num(res),
      steps: uniq([
        rich("= ", num(n), " · ", num(x), OPTXT[op], num(n), " · ", num(y)),
        rich("= ", num(t1), OPTXT[op], num(t2)),
        rich("= ", num(res)),
      ]),
    };
  }

  // a ± y · n (Punkt vor Strich), y · n ist ganzzahlig
  function kPvs(rng, level) {
    const d = rng.pick([2, 3, 4, 5, 6, 8, 10]);
    const y = properFrac(rng, [d]);
    const n = d * rng.int(1, Math.floor(30 / d));
    const t = y.mul(n);
    const dA = rng.pick([2, 3, 4, 5, 6, 8]);
    const a = level === 3 ? mixedFrac(rng, [dA], 3) : properFrac(rng, [dA]);
    const op = level === 3 && rng.chance(0.5) ? "-" : "+";
    if (op === "-" && a.sub(t).sign() <= 0) return null;
    const res = op === "+" ? a.add(t) : a.sub(t);
    return {
      q: rich(num(a), OPTXT[op], num(y), " · ", num(n)),
      a: num(res),
      steps: uniq([
        rich("= ", num(a), OPTXT[op], num(t)),
        rich("= ", num(res)),
      ]),
    };
  }

  function rechCand(rng, level) {
    const kinds = {
      1: ["dec", "dist"],
      2: ["sum", "recip", "dec", "dist", "pvs"],
      3: ["sum", "dist", "pvs", "dec"],
    };
    switch (rng.pick(kinds[level])) {
      case "dec": return kDec(rng, level);
      case "recip": return kRecip(rng);
      case "sum": return kSum(rng, level);
      case "dist": return kDist(rng, level);
      default: return kPvs(rng, level);
    }
  }

  // ---------- Typ 5: Sachaufgaben ----------
  const NAMES = ["Lena", "Tim", "Mia", "Ben", "Anna", "Lukas", "Sophie", "Jonas", "Lea", "Paul"];
  function twoNames(rng) {
    const a = rng.pick(NAMES);
    let b = rng.pick(NAMES);
    if (b === a) b = NAMES[(NAMES.indexOf(a) + 1) % NAMES.length];
    return [a, b];
  }

  // Rezept: Milch für n Personen, gesucht für m Personen
  function rezept(rng, level) {
    const a = level === 1 ? properFrac(rng, [2, 3, 4, 5]) : mixedFrac(rng, [2, 3, 4], 2);
    const n = rng.pick([2, 3, 4, 5]);
    const m = rng.pick([2, 3, 4, 5, 6, 8].filter(v => v !== n));
    const per = a.div(n), res = per.mul(m);
    if (res.isInt() || per.cmp(new Frac(1, 2)) > 0 || per.cmp(new Frac(1, 10)) < 0) return null;   // 1/10 bis 1/2 l pro Person
    return {
      q: rich("Für ", String(n), " Personen braucht man ", num(a), " l Milch. Wie viel Milch braucht man für ", String(m), " Personen?"),
      a: rich(num(res), " l"),
      steps: uniq([
        rich("Für 1 Person: ", num(a), " l : ", String(n), " = ", num(per), " l"),
        rich("Für ", String(m), " Personen: ", num(per), " l · ", String(m), " = ", num(res), " l"),
        rich("Antwort: Man braucht ", num(res), " l Milch."),
      ]),
    };
  }

  // Pizza: zwei Personen essen Anteile, gesucht ist der Rest
  function pizza(rng, level) {
    let a, b;
    if (level === 1) {
      const D = rng.pick([4, 5, 6, 8, 10, 12]);
      a = new Frac(rng.int(1, D - 2), D);
      b = new Frac(rng.int(1, D - 1 - a.n), D);
    } else {
      a = properFrac(rng, [3, 4, 5, 6, 8]);
      b = properFrac(rng, [2, 4, 5, 8, 10]);
      if (a.d === b.d) return null;
    }
    const s = a.add(b);
    if (s.sign() <= 0 || s.cmp(1) >= 0) return null;
    const res = Frac.of(1).sub(s);
    const D = AG.lcm(a.d, b.d);
    const ex = v => (v.d === D ? num(v) : { f: [v.n * (D / v.d), D] });
    const [n1, n2] = twoNames(rng);
    return {
      q: rich("Eine Pizza ist in gleich große Stücke geteilt. ", n1, " isst ", num(a), " der Pizza, ", n2, " isst ", num(b), " der Pizza. Wie viel der Pizza bleibt übrig?"),
      a: rich(num(res), " der Pizza"),
      steps: uniq([
        rich("Gegessen: ", ex(a), " + ", ex(b), " = ", num(s)),
        rich("Übrig: 1 − ", num(s), " = ", num(res)),
        rich("Antwort: ", num(res), " der Pizza bleibt übrig."),
      ]),
    };
  }

  // Einkauf: m kg Äpfel zum Kilopreis, dazu ein Artikel mit Dezimalpreis (Stufe 3: Brötchen und Rückgeld)
  function einkauf(rng, level) {
    const q = rng.pick([2, 4, 5]);
    const p = rng.int(1, 3 * q);
    if (p % q === 0) return null;
    const m = new Frac(p, q);                                   // kg
    const c0 = q * rng.int(Math.ceil(160 / q), Math.floor(490 / q)); // Kilopreis in Cent, durch q teilbar
    const price = new Frac(c0, 100);
    const cost = price.mul(m);
    const [n1] = [rng.pick(NAMES)];
    const lines = [
      rich("1 kg kostet ", dec2(price), " €, ", num(new Frac(1, m.d)), " kg kostet ", dec2(price), " € : ", String(m.d), " = ", dec2(price.div(m.d)), " €"),
      rich("Äpfel: ", num(m), " kg kosten ", String(m.n), " · ", dec2(price.div(m.d)), " € = ", dec2(cost), " €"),
    ];
    if (level === 2) {
      const other = new Frac(rng.int(99, 499), 100);
      const total = cost.add(other);
      return {
        q: rich("Im Laden kostet 1 kg Äpfel ", dec2(price), " €. ", n1, " kauft ", num(m), " kg Äpfel und eine Packung Müsli für ", dec2(other), " €. Wie viel bezahlt ", n1, " insgesamt?"),
        a: rich(dec2(total), " €"),
        steps: uniq([
          ...lines,
          rich("Insgesamt: ", dec2(cost), " € + ", dec2(other), " € = ", dec2(total), " €"),
          rich("Antwort: ", n1, " bezahlt insgesamt ", dec2(total), " €."),
        ]),
      };
    }
    // Stufe 3: Brötchen und Rückgeld
    const k = rng.int(2, 4), bc = rng.int(20, 60);
    const bp = new Frac(bc, 100);
    const brot = bp.mul(k);
    const total = cost.add(brot);
    if (total.cmp(20) >= 0) return null;
    const change = Frac.of(20).sub(total);
    return {
      q: rich("Im Laden kostet 1 kg Äpfel ", dec2(price), " €. ", n1, " kauft ", num(m), " kg Äpfel und ", String(k), " Brötchen zu je ", dec2(bp), " €. ", n1, " bezahlt mit einem Schein von 20 €. Wie viel Geld bekommt ", n1, " zurück?"),
      a: rich(dec2(change), " €"),
      steps: uniq([
        ...lines,
        rich("Brötchen: ", String(k), " · ", dec2(bp), " € = ", dec2(brot), " €"),
        rich("Insgesamt: ", dec2(cost), " € + ", dec2(brot), " € = ", dec2(total), " €"),
        rich("Rückgeld: 20 € − ", dec2(total), " € = ", dec2(change), " €"),
        rich("Antwort: ", n1, " bekommt ", dec2(change), " € zurück."),
      ]),
    };
  }

  // Schulweg: hin und zurück, an k Tagen; Stufe 3 mit zusätzlichem Ausflug
  function schulweg(rng, level) {
    const n1 = rng.pick(NAMES);
    if (level === 1) {
      const s = properFrac(rng, [2, 3, 4, 5, 8]);
      const s2 = s.mul(2), k = rng.int(2, 5);
      const total = s2.mul(k);
      return {
        q: rich(n1, " geht jeden Tag den Schulweg von ", num(s), " km zur Schule und wieder zurück. Wie viele km sind es an ", String(k), " Schultagen insgesamt?"),
        a: rich(num(total), " km"),
        steps: uniq([
          rich("Hin und zurück: 2 · ", num(s), " km = ", num(s2), " km"),
          rich("An ", String(k), " Schultagen: ", num(s2), " km · ", String(k), " = ", num(total), " km"),
          rich("Antwort: ", n1, " läuft insgesamt ", num(total), " km."),
        ]),
      };
    }
    const s = rng.pick([new Frac(1, 2), new Frac(3, 4), new Frac(2, 5), new Frac(3, 8), new Frac(5, 8), new Frac(1, 4), new Frac(3, 5)]);
    const s2 = s.mul(2), k = rng.int(2, 5);
    const sk = s2.mul(k);
    const e = new Frac(rng.int(5, 40), 10);
    if (!sk.isTerminating() || sk.decimals() > 2) return null;
    const total = sk.add(e);
    return {
      q: rich(n1, " geht an ", String(k), " Schultagen jeden Tag den Schulweg von ", num(s), " km zur Schule und wieder zurück. Am Wochenende macht ", n1, " einen Ausflug von ", decOrFrac(e), " km. Wie viele km legt ", n1, " insgesamt zurück?"),
      a: rich(decOrFrac(total), " km"),
      steps: uniq([
        rich("Hin und zurück: 2 · ", num(s), " km = ", decOrFrac(s2), " km"),
        rich("An ", String(k), " Schultagen: ", decOrFrac(s2), " km · ", String(k), " = ", decOrFrac(sk), " km"),
        rich("Insgesamt: ", decOrFrac(sk), " km + ", decOrFrac(e), " km = ", decOrFrac(total), " km"),
        rich("Antwort: ", n1, " legt insgesamt ", decOrFrac(total), " km zurück."),
      ]),
    };
  }

  function sachCand(rng, level) {
    const kinds = {
      1: ["rezept", "pizza", "schulweg"],
      2: ["rezept", "pizza", "einkauf"],
      3: ["einkauf", "schulweg"],
    };
    switch (rng.pick(kinds[level])) {
      case "rezept": return rezept(rng, level);
      case "pizza": return pizza(rng, level);
      case "einkauf": return einkauf(rng, level);
      default: return schulweg(rng, level);
    }
  }

  // ---------- Registrierung ----------
  AG.registerType({
    id: "m6-brueche-addsub",
    ...LB,
    title: "Brüche addieren und subtrahieren",
    instruction: {
      1: "Berechne. Kürze das Ergebnis vollständig.",
      2: "Berechne. Achte auf den Hauptnenner.",
      3: "Berechne. Gib das Ergebnis als gemischte Zahl an.",
    },
    merke: [
      { b: "Gleichnamig: " },
      "Die Zähler addieren oder subtrahieren, der Nenner bleibt. Ungleichnamig: zuerst auf den Hauptnenner erweitern. Beispiel: 3/4 + 1/6 = 9/12 + 2/12 = 11/12.",
    ],
    cols: 3,
    generate: (rng, level) => gen(addsubCand, rng, level),
  });

  AG.registerType({
    id: "m6-brueche-mul",
    ...LB,
    title: "Brüche multiplizieren",
    instruction: {
      1: "Berechne. Kürze das Ergebnis vollständig.",
      2: "Berechne. Kürze vorher, wenn möglich.",
      3: "Berechne. Wandle gemischte Zahlen zuerst in unechte Brüche um.",
    },
    merke: [
      { b: "Multiplizieren: " },
      "Zähler mal Zähler, Nenner mal Nenner. Gemeinsame Teiler kann man vorher kürzen. Beispiel: 2/3 · 3/4 = 1/2 (die 3 wird gekürzt).",
    ],
    cols: 3,
    generate: (rng, level) => gen(mulCand, rng, level),
  });

  AG.registerType({
    id: "m6-bruch-durch-zahl",
    ...LB,
    title: "Bruch durch natürliche Zahl teilen",
    instruction: {
      1: "Berechne. Kürze das Ergebnis vollständig.",
      2: "Berechne. Kürze das Ergebnis vollständig.",
      3: "Berechne. Gib das Ergebnis als gemischte Zahl an.",
    },
    merke: [
      { b: "Bruch durch Zahl: " },
      "Ist der Zähler durch die Zahl teilbar, teilt man den Zähler. Sonst multipliziert man den Nenner mit der Zahl. Beispiel: 3/4 : 3 = 1/4 und 2/5 : 4 = 2/20 = 1/10.",
    ],
    cols: 3,
    generate: (rng, level) => gen(divCand, rng, level),
  });

  AG.registerType({
    id: "m6-rechengesetze-brueche",
    ...LB,
    title: "Rechengesetze mit Brüchen und Dezimalzahlen",
    instruction: {
      1: "Berechne vorteilhaft. Nutze die Rechengesetze.",
      2: "Berechne vorteilhaft. Fasse passende Zahlen zusammen.",
      3: "Berechne. Achte auf die Reihenfolge der Rechenarten.",
    },
    merke: [
      { b: "Vorteilhaft rechnen: " },
      "Passende Zahlen zuerst zusammenfassen. Beispiel: 0,25 · 7 · 4 = (0,25 · 4) · 7 = 1 · 7 = 7. Mit Klammer: 4 · (1/2 + 1/4) = 2 + 1 = 3. Punkt vor Strich: 1/2 + 3/4 · 4 = 1/2 + 3 = 3 1/2.",
    ],
    cols: 2,
    generate: (rng, level) => gen(rechCand, rng, level),
  });

  AG.registerType({
    id: "m6-brueche-sachaufgaben",
    ...LB,
    title: "Sachaufgaben mit Brüchen und Dezimalzahlen",
    instruction: {
      1: "Rechne. Schreibe am Ende einen Antwortsatz.",
      2: "Rechne Schritt für Schritt. Schreibe am Ende einen Antwortsatz.",
      3: "Rechne Schritt für Schritt. Schreibe am Ende einen Antwortsatz mit Einheit.",
    },
    merke: [
      { b: "Sachaufgaben: " },
      "Erst klären, was gefragt ist, dann Schritt für Schritt rechnen und mit einem Antwortsatz mit Einheit schließen. Beispiel: 3/4 l Milch für 4 Personen, für 1 Person: 3/4 : 4 = 3/16 l.",
    ],
    cols: 1,
    generate: (rng, level) => gen(sachCand, rng, level),
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
