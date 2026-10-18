// M6 LB 2: Rationale Zahlen. Fünf Aufgabentypen: Ordnen (auch Brüche und Dezimalzahlen),
// a + b und a − b mit b positiv, a · n und a : n mit natürlicher Zahl n, Pfeildarstellung an der
// Zahlengeraden (Skizze), Sachaufgaben (Kontostand, Temperatur, Höhen).
(function (AG) {
  const { Frac, num, rich, MINUS } = AG;

  const LB = { klasse: "6", zug: "RM", lb: "2", lbTitle: "Rationale Zahlen", topic: "zahlen" };
  const OPS = { "+": " + ", "-": " " + MINUS + " ", "*": " · ", "/": " : " };
  const ab = v => v.abs();
  const join = (parts, sep = "; ") => rich(parts.map((p, i) => (i ? [sep, p] : [p])));
  const sf = (n, d) => (n < 0 ? { f: [-n, d], s: -1 } : { f: [n, d] });   // Bruch mit Vorzeichen-Segment

  // ---------- Hilfen ----------
  const gen = cand => (rng, level) => {
    for (let i = 0; i < 500; i++) {
      const t = cand(rng, level);
      if (t) return t;
    }
    throw new Error("Keine passende Aufgabe gefunden (Niveau " + level + ")");
  };

  // Dezimalzahl mit genau k Nachkommastellen, nie ganzzahlig; Vorzeichen zufällig (signed)
  function dec(rng, maxInt, k, signed = true) {
    const ip = rng.int(0, maxInt), fp = rng.int(1, 10 ** k - 1);
    const v = new Frac(ip * 10 ** k + fp, 10 ** k);
    return signed && rng.chance(0.5) ? v.neg() : v;
  }

  // echter Bruch bzw. gemischte Zahl (ganzer Teil 0 bis whole) mit Nenner aus dens; Vorzeichen zufällig
  function frac(rng, dens, whole, signed = true) {
    const d = rng.pick(dens), n = rng.int(1, d - 1);
    const v = new Frac(rng.int(0, whole) * d + n, d);
    return signed && rng.chance(0.5) ? v.neg() : v;
  }

  // Darstellung einer Zahl in der Aufgabe: ganze Zahl, Dezimalzahl (nur wenn endlich) oder Bruch
  function form(rng, v, decOK) {
    if (v.isInt()) return num(v);
    if (decOK && v.isTerminating() && v.decimals() <= 2 && rng.chance(0.5)) return num(v, { as: "dec" });
    return num(v);
  }

  // Dezimalschreibweise: ganze Zahl ohne Komma, sonst mit Komma (nur für endliche Zahlen)
  const dz = v => (v.isInt() ? num(v) : num(v, { as: "dec" }));

  // Rechnung a ± b mit b > 0 in Schritten. Geht sie über 0, wird am Nullpunkt zerlegt:
  // −2,5 + 4 = −2,5 + 2,5 + 1,5 = 0 + 1,5 = 1,5   bzw.   1,2 − 3,5 = 1,2 − 1,2 − 2,3 = 0 − 2,3 = −2,3
  function calcSteps(a, op, b, f) {
    const res = op === "+" ? a.add(b) : a.sub(b);
    const Z = f(new Frac(0));
    if (op === "+" && a.sign() < 0 && b.cmp(ab(a)) > 0) {
      const rest = b.add(a);
      return [
        rich(f(a), OPS["+"], f(b), " = ", f(a), " + ", f(ab(a)), " + ", f(rest)),
        rich("= ", Z, " + ", f(rest)),
        rich("= ", f(res)),
      ];
    }
    if (op === "-" && a.sign() > 0 && b.cmp(a) > 0) {
      const rest = b.sub(a);
      return [
        rich(f(a), OPS["-"], f(b), " = ", f(a), OPS["-"], f(a), OPS["-"], f(rest)),
        rich("= ", Z, OPS["-"], f(rest)),
        rich("= ", f(res)),
      ];
    }
    return [rich(f(a), OPS[op], f(b), " = ", f(res))];
  }

  // ---------- Typ 1: Ordnen ----------
  function vergleich(rng) {
    const a = rng.chance(0.5) ? new Frac(rng.int(-5, 5)) : dec(rng, 4, 1);
    const b = rng.chance(0.5) ? new Frac(rng.int(-5, 5)) : dec(rng, 4, 1);
    if (a.eq(b)) return null;
    const sym = a.cmp(b) < 0 ? "<" : ">";
    let first;
    if (a.sign() < 0 && b.sign() < 0) {
      first = rich("Beträge: ", dz(ab(a)), " und ", dz(ab(b)), ". Je größer der Betrag einer negativen Zahl, desto kleiner ist sie.");
    } else if (a.sign() < 0 || b.sign() < 0) {
      first = rich("Negative Zahlen liegen links von 0, positive Zahlen rechts von 0.");
    } else {
      first = rich("Auf dem Zahlenstrahl liegt die kleinere Zahl weiter links.");
    }
    return {
      q: rich(dz(a), " ", { blank: 3 }, " ", dz(b)),
      a: rich(dz(a), " ", sym, " ", dz(b)),
      steps: [first, rich(dz(a), " ", sym, " ", dz(b))],
    };
  }

  // Ordnen einer Liste; items: [{ v: Frac, r: Rich }] (r = Darstellung in der Aufgabe)
  function ordnenTask(rng, items, level) {
    const asc = rng.chance(0.7);
    const sorted = items.slice().sort((x, y) => x.v.cmp(y.v));
    const ordered = asc ? sorted : sorted.slice().reverse();
    const sym = asc ? "<" : ">";
    const chain = rich(ordered.map((it, i) => (i ? [" " + sym + " ", it.r] : [it.r])));
    const steps = [];
    if (level === 2) steps.push(rich("Als Dezimalzahlen: ", join(items.map(it => dz(it.v)))));
    if (level === 3) {
      const D = items.reduce((acc, it) => AG.lcm(acc, it.v.d), 1);
      steps.push(rich("Gleichnamig mit dem Nenner ", String(D), ": ", join(items.map(it => sf(it.v.n * (D / it.v.d), D)))));
    }
    const negs = sorted.filter(it => it.v.sign() < 0);     // aufsteigend: Beträge absteigend
    if (negs.length >= 2) {
      const abs = it => (level === 3 ? num(ab(it.v)) : dz(ab(it.v)));
      steps.push(rich("Beträge der negativen Zahlen: ", join(negs.map(abs), " > "), ". Je größer der Betrag, desto kleiner die Zahl."));
    }
    steps.push(rich("= ", chain));
    return {
      q: rich(asc ? "Ordne von klein nach groß: " : "Ordne von groß nach klein: ", join(items.map(it => it.r))),
      a: chain,
      steps,
    };
  }

  function ordnenCand(rng, level) {
    const vals = [];
    for (let i = 0; i < 4; i++) {
      if (level === 2) {
        const k = rng.int(0, 2);
        vals.push(k === 0 ? new Frac(rng.signedInt(1, 6)) : k === 1 ? dec(rng, 3, rng.pick([1, 2])) : frac(rng, [2, 4, 5, 10], 1));
      } else {
        vals.push(i === 3 && rng.chance(0.5) ? new Frac(rng.signedInt(1, 4)) : frac(rng, [2, 3, 4, 5, 6, 8], 1));
      }
    }
    if (new Set(vals.map(v => v.toString())).size !== vals.length) return null;
    if (level === 3) {
      if (new Set(vals.filter(v => !v.isInt()).map(v => v.d)).size < 2) return null;   // ungleichnamig
      if (vals.reduce((acc, v) => AG.lcm(acc, v.d), 1) > 120) return null;
    }
    return ordnenTask(rng, vals.map(v => ({ v, r: form(rng, v, level === 2) })), level);
  }

  const ordnen = (rng, level) => {
    if (level === 1) return gen(vergleich)(rng, level);
    return gen(ordnenCand)(rng, level);
  };

  // ---------- Typ 2: Addieren und Subtrahieren ----------
  // Brüche gleichnamig machen; die Zeile mit dem ungekürzten Ergebnis steht vor dem Ergebnis.
  function fracAddSteps(a, op, b) {
    const res = op === "+" ? a.add(b) : a.sub(b);
    const D = AG.lcm(a.d, b.d);
    const an = a.n * (D / a.d), bn = b.n * (D / b.d);
    const rn = op === "+" ? an + bn : an - bn;
    const steps = [];
    if (a.d !== b.d) steps.push(rich("= ", sf(an, D), OPS[op], { f: [bn, D] }));
    if (res.d !== D || Math.abs(res.n) > res.d) steps.push(rich("= ", sf(rn, D)));
    steps.push(rich("= ", num(res)));
    return steps;
  }

  function addsubCand(rng, level) {
    if (level === 3) {
      const a = frac(rng, [2, 3, 4, 5, 6, 8], 2), b = frac(rng, [2, 3, 4, 5, 6, 8], 1, false);
      if (a.d === b.d) return null;
      const op = rng.pick(["+", "-"]);
      const res = op === "+" ? a.add(b) : a.sub(b);
      if (res.sign() === 0 || Math.abs(res.valueOf()) > 10) return null;
      return { q: rich(num(a), OPS[op], num(b)), a: num(res), steps: fracAddSteps(a, op, b) };
    }
    const dig = level === 1 ? 9 : 19;
    const a = rng.chance(0.5) ? new Frac(rng.signedInt(1, dig)) : dec(rng, dig, level === 1 ? 1 : rng.pick([1, 2]));
    const b = rng.chance(0.5) ? new Frac(rng.int(1, dig)) : dec(rng, dig, level === 1 ? 1 : rng.pick([1, 2]), false);
    const op = rng.pick(["+", "-"]);
    const res = op === "+" ? a.add(b) : a.sub(b);
    if (res.sign() === 0) return null;
    return { q: rich(dz(a), OPS[op], dz(b)), a: dz(res), steps: calcSteps(a, op, b, dz) };
  }

  // ---------- Typ 3: Multiplizieren und Dividieren ----------
  function decMulSteps(a, op, n) {
    const res = op === "*" ? a.mul(n) : a.div(n);
    const steps = [];
    if (a.sign() < 0) steps.push(rich("Das Ergebnis ist negativ, weil a negativ ist. Danach nur die Beträge rechnen."));
    steps.push(rich(dz(ab(a)), OPS[op], String(n), " = ", dz(ab(res))));
    if (a.sign() < 0) steps.push(rich("= ", dz(res)));
    return steps;
  }

  // Bruch · n: Zähler mal n; Bruch : n: Nenner mal n. Vorzeichen zuerst, dann Beträge, dann kürzen.
  function fracMulSteps(a, op, n) {
    const res = op === "*" ? a.mul(n) : a.div(n);
    const absA = ab(a);
    const nn = op === "*" ? absA.n * n : absA.n;
    const dd = op === "*" ? absA.d : absA.d * n;
    const steps = [];
    if (a.sign() < 0) steps.push(rich("Das Ergebnis ist negativ, weil a negativ ist. Danach nur die Beträge rechnen."));
    steps.push(rich(num(absA, { as: "improper" }), OPS[op], String(n), " = ", sf(nn, dd)));
    // gekürzte Betragszeile nur, wenn sie nicht schon das Endergebnis ist (sonst doppelt)
    const showRed = AG.gcd(nn, dd) > 1 && (a.sign() < 0 || (!res.isInt() && Math.abs(res.valueOf()) > 1));
    if (showRed) steps.push(rich("= ", num(ab(res), { as: "improper" })));
    steps.push(rich("= ", num(res)));
    return steps;
  }

  function muldivCand(rng, level) {
    const op = rng.pick(["*", "/"]);
    const n = rng.int(2, level === 3 ? 6 : 9);
    if (level === 3) {
      const a = frac(rng, [2, 3, 4, 5, 6, 8, 10], 1);
      const res = op === "*" ? a.mul(n) : a.div(n);
      if (res.d > 12 || Math.abs(res.valueOf()) > 30) return null;
      return { q: rich(num(a), OPS[op], String(n)), a: num(res), steps: fracMulSteps(a, op, n) };
    }
    let a;
    if (level === 1) {
      // Einmaleins und Kopfrechnen; bei der Division ist a = q · n
      a = op === "*" ? new Frac(rng.signedInt(2, 12)) : new Frac(rng.signedInt(2, 12) * n);
    } else {
      const k = rng.pick([1, 2]);
      a = op === "*" ? dec(rng, 9, k) : dec(rng, 9, k).mul(n);
    }
    const res = op === "*" ? a.mul(n) : a.div(n);
    return { q: rich(dz(a), OPS[op], String(n)), a: dz(res), steps: decMulSteps(a, op, n) };
  }

  // ---------- Typ 4: Pfeildarstellung ----------
  // Zahlengerade von lo bis hi, Skala in Schritten step. Start mit Punkt, Pfeile übereinander.
  // endMark: „?“ am Ende des letzten Pfeils (gesuchtes Ziel)
  function lineSketch(lo, hi, step, start, arrows, endMark) {
    const INK = AG.SKETCH_COLORS.INK;
    const W = 74, H = 28, yA = 21;
    const X = v => 4 + (v - lo) * (W - 8) / (hi - lo);
    const s = AG.sketch(W, H);
    s.line([X(lo) - 1.5, yA], [X(hi) + 1.5, yA], { width: 0.4 });
    const cnt = Math.round((hi - lo) / step);
    for (let i = 0; i <= cnt; i++) {
      const v = lo + i * step;
      const whole = Number.isInteger(v), z = Math.abs(v) < 1e-9;
      const len = z ? 2 : whole ? 1.2 : 0.8;
      s.line([X(v), yA - len], [X(v), yA + len], { width: z ? 0.6 : 0.35 });
      if (whole && (step < 1 || v % 2 === 0)) s.label([X(v), yA + 4.8], AG.plain(num(v)), { bold: z });
    }
    s.circle([X(start), yA], 1.1, { fill: INK });
    let yFrom = yA - 1.4, last = [X(start), yA];
    arrows.forEach((ar, i) => {
      const y = yA - 6 - 6 * i, dir = Math.sign(ar.b - ar.a);
      s.line([X(ar.a), yFrom], [X(ar.a), y], { dash: true, width: 0.3 });
      s.line([X(ar.a), y], [X(ar.b) - dir * 1.8, y], { width: 0.5 });
      s.poly([[X(ar.b), y], [X(ar.b) - dir * 2.8, y - 1.2], [X(ar.b) - dir * 2.8, y + 1.2]], { fill: INK, width: 0.2 });
      yFrom = y;
      last = [X(ar.b), y];
    });
    if (endMark) s.label([last[0], last[1] - 3], "?", { bold: true });
    return s.done();
  }

  const EH = d => (d.valueOf() === 1 ? " Einheit" : " Einheiten");

  function pfeil(rng, level) {
    const half = level === 3;
    const u = half ? 2 : 1;                       // Teilstriche je Einheit
    const lo = half ? -6 : -10, hi = -lo;
    const S = k => new Frac(k, u);
    const n = level === 2 ? 2 : level === 3 ? rng.pick([1, 2]) : 1;
    const s0 = S(rng.int(-6 * u, 6 * u));
    const arrows = [];
    let cur = s0;
    for (let i = 0; i < n; i++) {
      const op = rng.pick(["+", "-"]);
      const d = S(rng.int(1, half ? 8 : 6));
      const e = op === "+" ? cur.add(d) : cur.sub(d);
      if (e.valueOf() < lo || e.valueOf() > hi) return null;
      arrows.push({ op, d, from: cur, to: e });
      cur = e;
    }
    const dirOf = op => (op === "+" ? "rechts" : "links");
    const fig = (endMark) => lineSketch(lo, hi, half ? 0.5 : 1, s0.valueOf(),
      arrows.map(ar => ({ a: ar.from.valueOf(), b: ar.to.valueOf() })), endMark);

    if (n === 2) {
      const [A1, A2] = arrows;
      return {
        q: rich("Man startet bei ", dz(s0), ". Der erste Pfeil zeigt nach ", dirOf(A1.op), ", der zweite nach ",
          dirOf(A2.op), ". Welche Rechnung zeigen die Pfeile? Wo landet man?"),
        a: rich(dz(s0), OPS[A1.op], dz(A1.d), OPS[A2.op], dz(A2.d), " = ", dz(A2.to)),
        steps: [...calcSteps(s0, A1.op, A1.d, dz), ...calcSteps(A1.to, A2.op, A2.d, dz)],
        fig: fig(true),
        inline: false,
      };
    }
    const A = arrows[0];
    const calc = rich(dz(s0), OPS[A.op], dz(A.d), " = ", dz(A.to));
    if (rng.chance(0.5)) {
      return {
        q: rich("Der Pfeil startet bei ", dz(s0), " und zeigt nach ", dirOf(A.op), ". Welche Rechnung zeigt er? Schreibe sie mit Zahlen auf."),
        a: calc,
        steps: calcSteps(s0, A.op, A.d, dz),
        fig: fig(false),
        inline: false,
      };
    }
    return {
      q: rich("Der Pfeil startet bei ", dz(s0), ". Er ist ", dz(A.d), EH(A.d), " lang und zeigt nach ", dirOf(A.op), ". Wo endet er?"),
      a: dz(A.to),
      steps: calcSteps(s0, A.op, A.d, dz),
      fig: fig(true),
      inline: false,
    };
  }

  // ---------- Typ 5: Sachaufgaben ----------
  const NAMEN = [["Lena", "Sie"], ["Ben", "Er"], ["Mia", "Sie"], ["Ali", "Er"], ["Sophie", "Sie"]];
  const EUR = v => [num(v, { as: "dec", digits: 2 }), " €"];
  const GRAD = v => [dz(v), " °C"];
  const MTR = v => [dz(v), " m"];
  const done = (q, a, steps, antwort) => ({
    q: rich(q),
    a: rich(a),
    steps: [...steps.map(s => rich(s)), rich(antwort)],
  });

  function sach(rng, level) {
    const mU = level === 1 ? 1 : level === 2 ? 2 : 20;   // Geld in Schritten von 1 €, 0,50 € bzw. 0,05 €
    const tU = level === 1 ? 1 : 2;                      // Temperatur und Höhe in ganzen bzw. halben Einheiten
    const pos = (u, hi) => new Frac(rng.int(1, hi * u), u);   // positiver Betrag bis hi
    const [name, pron] = rng.pick(NAMEN);
    const kind = rng.int(0, 7);

    if (kind === 0) {   // Kontostand, Einzahlung: a + b
      const a = pos(mU, 40).neg(), b = pos(mU, 40);
      const res = a.add(b);
      if (res.sign() === 0) return null;
      return done([name, " hat einen Kontostand von ", EUR(a), ". ", pron, " zahlt ", EUR(b), " ein. Wie hoch ist der Kontostand danach?"],
        EUR(res), calcSteps(a, "+", b, EUR), ["Der Kontostand beträgt danach ", EUR(res), "."]);
    }
    if (kind === 1) {   // Kontostand, Abhebung: a − b
      const a = rng.chance(0.6) ? pos(mU, 40).neg() : pos(mU, 60), b = pos(mU, 40);
      const res = a.sub(b);
      if (res.sign() === 0) return null;
      return done([name, " hat einen Kontostand von ", EUR(a), ". ", pron, " hebt ", EUR(b), " ab. Wie hoch ist der Kontostand danach?"],
        EUR(res), calcSteps(a, "-", b, EUR), ["Der Kontostand beträgt danach ", EUR(res), "."]);
    }
    if (kind === 2) {   // Abbuchung jeden Monat: a · n
      const a = pos(mU, 15).neg(), n = rng.int(2, 6);
      const res = a.mul(n);
      return done(["Am Anfang ist der Kontostand ", EUR(new Frac(0)), ". Jeden Monat werden ", EUR(a.neg()),
        " abgebucht. Wie hoch ist der Kontostand nach ", String(n), " Monaten?"],
        EUR(res), [rich(EUR(a), " · ", String(n), " = ", EUR(res))], ["Nach ", String(n), " Monaten beträgt der Kontostand ", EUR(res), "."]);
    }
    if (kind === 3) {   // Temperatur steigt: a + b
      const a = pos(tU, 12).neg(), b = pos(tU, 12);
      const res = a.add(b);
      if (res.sign() === 0) return null;
      return done(["Um 6 Uhr zeigt das Thermometer ", GRAD(a), ". Bis 12 Uhr steigt die Temperatur um ", GRAD(b), ". Wie warm ist es um 12 Uhr?"],
        GRAD(res), calcSteps(a, "+", b, GRAD), ["Um 12 Uhr sind es ", GRAD(res), "."]);
    }
    if (kind === 4) {   // Temperatur fällt: a − b
      const a = pos(tU, 12), b = pos(tU, 12);
      const res = a.sub(b);
      if (res.sign() === 0) return null;
      return done(["Um 14 Uhr zeigt das Thermometer ", GRAD(a), ". Bis 22 Uhr fällt die Temperatur um ", GRAD(b), ". Wie warm ist es um 22 Uhr?"],
        GRAD(res), calcSteps(a, "-", b, GRAD), ["Um 22 Uhr sind es ", GRAD(res), "."]);
    }
    if (kind === 5) {   // Temperaturänderung in einer Stunde: a : n
      const r = pos(tU, 6), n = rng.int(2, 6);
      const total = r.mul(n).neg();
      const res = total.div(n);
      return done(["Die Temperatur ist in ", String(n), " gleich langen Stunden insgesamt um ", GRAD(r.mul(n)),
        " gesunken. Um wie viel Grad hat sie sich in einer Stunde geändert? Gib die Änderung mit Vorzeichen an."],
        GRAD(res), [rich(GRAD(total), " : ", String(n), " = ", GRAD(res))], ["Die Änderung pro Stunde beträgt ", GRAD(res), "."]);
    }
    if (kind === 6) {   // Taucher taucht auf: a + b, bleibt unter dem Meeresspiegel
      const a = pos(tU, 40).neg(), b = pos(tU, 40);
      const res = a.add(b);
      if (res.sign() >= 0) return null;
      return done(["Ein Taucher ist ", MTR(a.neg()), " unter dem Meeresspiegel. Er taucht ", MTR(b), " nach oben. Wie tief ist er jetzt?"],
        MTR(res), calcSteps(a, "+", b, MTR), ["Der Taucher ist jetzt ", MTR(res.neg()), " unter dem Meeresspiegel."]);
    }
    // Vogel sinkt: a − b, landet unter dem Meeresspiegel
    const a = pos(tU, 20), b = pos(tU, 20);
    const res = a.sub(b);
    if (res.sign() >= 0) return null;
    return done(["Ein Vogel fliegt ", MTR(a), " über dem Meeresspiegel. Er sinkt um ", MTR(b), ". In welcher Höhe ist er jetzt?"],
      MTR(res), calcSteps(a, "-", b, MTR), ["Der Vogel ist jetzt ", MTR(res.neg()), " unter dem Meeresspiegel."]);
  }

  // ---------- Registrierung ----------
  AG.registerType({
    id: "m6-rational-ordnen",
    ...LB,
    title: "Rationale Zahlen ordnen",
    instruction: {
      1: "Setze das Zeichen < oder > ein.",
      2: "Ordne die Zahlen der Größe nach.",
      3: "Ordne die Zahlen. Mache die Brüche zuerst gleichnamig.",
    },
    merke: [
      { b: "Zahlenstrahl: " },
      `Die größere Zahl liegt weiter rechts. Negative Zahlen sind kleiner als 0 und kleiner als alle positiven Zahlen. Je größer der Betrag einer negativen Zahl, desto kleiner ist sie. Beispiel: ${MINUS}1,5 < `,
      { f: [3, 4], s: -1 }, " < 0,2 < 2.",
    ],
    cols: 2,
    generate: ordnen,
  });

  AG.registerType({
    id: "m6-rational-addsub",
    ...LB,
    title: "Addieren und Subtrahieren",
    instruction: {
      1: "Rechne. Achte auf die Vorzeichen.",
      2: "Rechne. Achte auf das Dezimalkomma.",
      3: "Rechne. Mache die Brüche zuerst gleichnamig und kürze das Ergebnis.",
    },
    merke: [
      { b: "Am Zahlenstrahl: " },
      `Bei a + b geht man von a nach rechts, bei a − b nach links. Beispiel: ${MINUS}2,5 + 4 = 1,5. Brüche zuerst gleichnamig machen: `,
      { f: [1, 2], s: -1 }, " − ", { f: [3, 4] }, " = ", { f: [2, 4], s: -1 }, " − ", { f: [3, 4] }, " = ", { f: [5, 4], s: -1 },
      " = ", { f: [1, 4], w: 1, s: -1 },
    ],
    cols: 3,
    generate: gen(addsubCand),
  });

  AG.registerType({
    id: "m6-rational-muldiv",
    ...LB,
    title: "Multiplizieren und Dividieren",
    instruction: {
      1: "Rechne im Kopf. Achte auf das Vorzeichen.",
      2: "Rechne. Achte auf das Dezimalkomma.",
      3: "Rechne. Kürze das Ergebnis vollständig.",
    },
    merke: [
      { b: "Vorzeichen zuerst: " },
      `Ist a negativ, ist das Ergebnis negativ. Dann nur die Beträge rechnen. Beispiel: ${MINUS}2,5 · 4 = ${MINUS}10 und ${MINUS}7,2 : 8 = ${MINUS}0,9. Bei einem Bruch wird durch n geteilt, indem man den Nenner mal n nimmt: `,
      { f: [2, 3], s: -1 }, " : 4 = ", { f: [2, 12], s: -1 }, " = ", { f: [1, 6], s: -1 }, ".",
    ],
    cols: 3,
    generate: gen(muldivCand),
  });

  AG.registerType({
    id: "m6-pfeildarstellung",
    ...LB,
    title: "Pfeile an der Zahlengeraden",
    instruction: {
      1: "Lies die Pfeile an der Zahlengeraden ab.",
      2: "Schreibe die Rechnung zu den Pfeilen auf bzw. bestimme das Ziel.",
      3: "Ein kleiner Strich bedeutet 0,5. Schreibe die Rechnung auf bzw. bestimme das Ziel.",
    },
    merke: [
      { b: "Pfeile: " },
      "Ein Pfeil nach rechts bedeutet plus, ein Pfeil nach links bedeutet minus. Die Länge des Pfeils ist die Zahl hinter dem Rechenzeichen. Beispiel: Start bei −2, Pfeil 5 nach rechts: −2 + 5 = 3.",
    ],
    cols: 2,
    generate: gen(pfeil),
  });

  AG.registerType({
    id: "m6-rational-sachaufgaben",
    ...LB,
    title: "Sachaufgaben mit rationalen Zahlen",
    instruction: {
      1: "Rechne und schreibe einen Antwortsatz.",
      2: "Rechne mit Dezimalzahlen und schreibe einen Antwortsatz.",
      3: "Rechne in Schritten und schreibe einen Antwortsatz.",
    },
    merke: [
      { b: "Geld, Temperatur, Höhe: " },
      `Ein Minus steht für Schulden, Temperaturen unter 0 °C und Orte unter dem Meeresspiegel. Beispiel: Kontostand ${MINUS}35,50 € und Einzahlung 50 €: ${MINUS}35,50 € + 50,00 € = 14,50 €. Ein Monat mit 12,50 € Abbuchung: ${MINUS}12,50 € · 4 = ${MINUS}50,00 €.`,
    ],
    cols: 1,
    generate: gen(sach),
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
