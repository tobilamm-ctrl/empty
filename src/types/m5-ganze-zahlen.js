// M5 LB 2: Ganze Zahlen. Vier Aufgabentypen: Vergleichen und Ordnen, Zustandsänderungen,
// Thermometer und Zahlengerade (mit Skizze), Sachaufgaben (Höhen, Temperaturen, Stockwerke).
(function (AG) {
  const { num, rich, MINUS } = AG;

  const LB = { klasse: "5", zug: "RM", lb: "2", lbTitle: "Ganze Zahlen", topic: "zahlen" };
  const OP = { "+": " + ", "-": " " + MINUS + " " };
  const N = x => num(x);                 // ganze Zahl als Rich; negativ mit Minuszeichen, ohne Klammer am Anfang
  const S = x => AG.plain(num(x));       // dasselbe als Text für Sätze
  const UN = u => (u ? " " + u : "");
  const ab = Math.abs;

  // ---------- Hilfen ----------
  const gen = cand => (rng, level) => {
    for (let i = 0; i < 500; i++) {
      const t = cand(rng, level);
      if (t) return t;
    }
    throw new Error("Keine passende Aufgabe gefunden (Niveau " + level + ")");
  };
  const distinct = (rng, n, lo, hi) => {
    const set = new Set();
    while (set.size < n) set.add(rng.int(lo, hi));
    return [...set];
  };
  const list = vals => rich(vals.map((v, i) => (i ? [", ", N(v)] : [N(v)])));
  const chain = (vals, sym) => rich(vals.map((v, i) => (i ? [" " + sym + " ", N(v)] : [N(v)])));

  // Rechnung a ± b mit natürlichem b in Schritten. Geht sie über 0, wird am Nullpunkt zerlegt:
  // −4 + 9 = −4 + 4 + 5 = 0 + 5 = 5   bzw.   7 − 10 = 7 − 7 − 3 = 0 − 3 = −3
  function calcLines(a, op, b, unit = "") {
    const res = op === "+" ? a + b : a - b;
    if (op === "+" && a < 0 && b > -a) {
      return [
        rich(N(a), OP["+"], N(b), " = ", N(a), " + ", N(-a), " + ", N(b + a)),
        rich("= 0 + ", N(b + a)),
        rich("= ", N(res), UN(unit)),
      ];
    }
    if (op === "-" && a > 0 && b > a) {
      return [
        rich(N(a), OP["-"], N(b), " = ", N(a), OP["-"], N(a), OP["-"], N(b - a)),
        rich("= 0", OP["-"], N(b - a)),
        rich("= ", N(res), UN(unit)),
      ];
    }
    return [rich(N(a), OP[op], N(b), " = ", N(res), UN(unit))];
  }

  // Abstand zwischen lo < hi ohne Rechnen mit zwei negativen Zahlen: über 0 zusammenzählen, sonst subtrahieren
  function distSteps(lo, hi, unit) {
    const d = hi - lo;
    if (lo >= 0) return [rich(N(hi), " − ", N(lo), " = ", S(d), UN(unit))];
    if (hi > 0) {
      return [
        rich("Von ", N(lo), " bis 0: ", S(-lo)),
        rich("Von 0 bis ", N(hi), ": ", S(hi)),
        rich(S(-lo), " + ", S(hi), " = ", S(d), UN(unit)),
      ];
    }
    return [
      rich("Von ", N(lo), " bis 0: ", S(-lo)),
      rich("Von ", N(hi), " bis 0: ", S(-hi)),
      rich(S(-lo), " − ", S(-hi), " = ", S(d), UN(unit)),
    ];
  }

  // ---------- Typ 1: Vergleichen und Ordnen ----------
  function vergleich(rng) {
    const a = rng.int(-25, 25), b = rng.int(-25, 25);
    if (a === b) return null;
    const sym = a < b ? "<" : ">";
    const first = a < 0 && b < 0
      ? rich("Beträge: ", S(-a), " und ", S(-b), ". Je größer der Betrag einer negativen Zahl, desto kleiner ist sie.")
      : rich("Auf dem Zahlenstrahl liegt die kleinere Zahl weiter links.");
    return {
      q: rich(N(a), " ", { blank: 3 }, " ", N(b)),
      a: rich(N(a), " ", sym, " ", N(b)),
      steps: [first, rich(N(a), " ", sym, " ", N(b))],
    };
  }

  function ordnen(rng, n, lo, hi) {
    const vals = distinct(rng, n, lo, hi);
    const asc = rng.chance(0.7);
    const sorted = vals.slice().sort((x, y) => x - y);
    const ordered = asc ? sorted : sorted.slice().reverse();
    const sym = asc ? "<" : ">";
    const negs = sorted.filter(v => v < 0);
    const steps = [rich("Negative Zahlen liegen links von 0, positive Zahlen rechts von 0.")];
    if (negs.length >= 2) {
      steps.push(rich("Beträge der negativen Zahlen: ", negs.map(v => S(-v)).join(" > "),
        ". Je größer der Betrag, desto kleiner die Zahl."));
    }
    steps.push(rich("= ", chain(ordered, sym)));
    return {
      q: rich(asc ? "Ordne von klein nach groß: " : "Ordne von groß nach klein: ", list(vals)),
      a: chain(ordered, sym),
      steps,
    };
  }

  function mitte(rng) {
    const a = -rng.int(1, 12), b = rng.int(1, 12), d = b - a;
    if (d % 2) return null;
    const h = d / 2, m = a + h;
    return {
      q: rich("Welche Zahl liegt genau in der Mitte zwischen ", N(a), " und ", N(b), "?"),
      a: N(m),
      steps: [
        rich("Abstand von ", N(a), " bis ", N(b), ": ", S(-a), " + ", S(b), " = ", S(d)),
        rich("Halber Abstand: ", S(d), " : 2 = ", S(h)),
        rich(N(a), " + ", S(h), " = ", N(m)),
      ],
    };
  }

  function zaehlen(rng) {
    const a = -rng.int(1, 9), b = rng.int(1, 9), D = b - a, cnt = D - 1;
    return {
      q: rich("Wie viele ganze Zahlen liegen echt zwischen ", N(a), " und ", N(b), "?"),
      a: rich(S(cnt), cnt === 1 ? " Zahl" : " Zahlen"),
      steps: [
        rich("Von ", N(a), " bis ", N(b), " sind es ", S(D), " Schritte."),
        rich("Die Endzahlen ", N(a), " und ", N(b), " zählen nicht mit: ", S(D), " − 1 = ", S(cnt)),
      ],
    };
  }

  function gegen(rng) {
    const a = rng.signedInt(1, 20);
    return {
      q: rich("Wie lautet die Gegenzahl von ", N(a), "?"),
      a: N(-a),
      steps: [rich("Gegenzahl: Das Vorzeichen wechselt. ", N(a), " → ", N(-a))],
    };
  }

  function betrag(rng) {
    const k = rng.int(1, 20);
    if (rng.chance(0.5)) {
      return {
        q: rich("Wie groß ist der Betrag von ", N(-k), "?"),
        a: N(k),
        steps: [rich("Abstand von 0 auf dem Zahlenstrahl: ", S(k), " Schritte."), rich("|", N(-k), "| = ", S(k))],
      };
    }
    return {
      q: rich("Welche negative Zahl hat den Betrag ", S(k), "?"),
      a: N(-k),
      steps: [rich("Auf dem Zahlenstrahl ", S(k), " Schritte links von 0."), rich("Die Zahl ist ", N(-k), ".")],
    };
  }

  const ORD3 = [mitte, zaehlen, gegen, betrag, rng => ordnen(rng, 5, -15, 15)];
  const cand1 = (rng, level) => (level === 1 ? vergleich(rng)
    : level === 2 ? ordnen(rng, 4, -20, 20)
      : rng.pick(ORD3)(rng));

  // ---------- Typ 2: Zustandsänderungen ----------
  function zustand(rng, level) {
    if (level === 1) {
      const a = rng.signedInt(1, 12), b = rng.int(1, 12), op = rng.pick(["+", "-"]);
      const res = op === "+" ? a + b : a - b;
      if (res === 0) return null;
      return { q: rich("Berechne: ", N(a), OP[op], N(b)), a: N(res), steps: calcLines(a, op, b) };
    }
    if (level === 2) {
      const up = rng.chance(0.5), op = up ? "+" : "-", kind = rng.int(0, 2);
      if (kind === 0) {
        const a = rng.int(-15, 5), b = rng.int(1, 15);
        if (a === 0) return null;
        const res = op === "+" ? a + b : a - b;
        if (ab(res) > 25) return null;
        return {
          q: rich("Es ist ", N(a), " °C. Die Temperatur ", up ? "steigt" : "fällt", " um ", N(b), " °C. Wie warm ist es danach?"),
          a: rich(N(res), " °C"),
          steps: calcLines(a, op, b, "°C"),
        };
      }
      if (kind === 1) {
        const a = 5 * rng.int(-8, 6), b = 5 * rng.int(1, 8);
        if (a === 0) return null;
        const res = op === "+" ? a + b : a - b;
        return {
          q: rich("Lenas Kontostand ist ", N(a), " €. Lena ", up ? "zahlt " : "hebt ", N(b), " € ", up ? "ein" : "ab",
            ". Wie hoch ist der Kontostand danach?"),
          a: rich(N(res), " €"),
          steps: calcLines(a, op, b, "€"),
        };
      }
      const a = rng.pick([-3, -2, -1, 1, 2, 3, 4, 5]), b = rng.int(2, 6);
      const res = op === "+" ? a + b : a - b;
      if (res === 0 || ab(res) > 8) return null;
      return {
        q: rich("Der Aufzug steht im Stockwerk ", N(a), ". Er fährt ", N(b), " Stockwerke ", up ? "nach oben" : "nach unten",
          ". In welchem Stockwerk hält er danach?"),
        a: rich("Stockwerk ", N(res)),
        steps: calcLines(a, op, b),
      };
    }
    if (rng.chance(0.5)) {
      // zwei Änderungen nacheinander
      const a = rng.int(-12, -1), b1 = rng.int(3, 10), b2 = rng.int(2, 9);
      const mid = a + b1, res = mid - b2;
      if (ab(res) > 15) return null;
      return {
        q: rich("Morgens sind es ", N(a), " °C. Am Vormittag steigt die Temperatur um ", N(b1),
          " °C. Am Nachmittag fällt sie um ", N(b2), " °C. Wie warm ist es am Nachmittag?"),
        a: rich(N(res), " °C"),
        steps: [...calcLines(a, "+", b1), ...calcLines(mid, "-", b2, "°C")],
      };
    }
    // Änderung gesucht
    const a = rng.int(-9, 6), c = rng.int(-9, 6);
    const lo = Math.min(a, c), hi = Math.max(a, c), d = hi - lo;
    if (d < 3 || a === 0 || c === 0) return null;
    return {
      q: rich("Um 6 Uhr sind es ", N(a), " °C. Um 12 Uhr sind es ", N(c), " °C. Um wie viel Grad ist es ",
        c > a ? "wärmer" : "kälter", " geworden?"),
      a: rich(S(d), " °C"),
      steps: distSteps(lo, hi, "°C"),
    };
  }

  // ---------- Typ 3: Thermometer und Zahlengerade (Skizzen) ----------
  // Senkrechtes Thermometer, Skala −20 … 30 °C. liquid: Füllhöhe (oder null), marks: [{ v, t }] Markierungen
  function thermoSketch(liquid, marks, minor) {
    const INK = AG.SKETCH_COLORS.INK;
    const W = 36, H = 44, tx = 16, top = 6, sh = 30;      // 50 Grad auf 30 mm
    const Y = t => top + (30 - t) * sh / 50;
    const yB = Y(-20) + 3.4;                               // Mitte der Kugel
    const s = AG.sketch(W, H);
    s.rect(tx - 1.6, top, 3.2, yB - top, { fill: "none" });
    s.circle([tx, yB], 3.4, { fill: "none" });
    if (liquid !== null) {
      s.rect(tx - 1.0, Y(liquid), 2.0, yB - Y(liquid), { fill: INK });
      s.circle([tx, yB], 2.4, { fill: INK });
    }
    for (let t = -20; t <= 30; t += minor) {
      const major = t % 10 === 0;
      s.line([tx + 2, Y(t)], [tx + 2 + (major ? 2.6 : 1.4), Y(t)], { width: 0.35 });
      if (major) s.label([tx + 6.2, Y(t)], AG.plain(num(t)), { anchor: "start", bold: t === 0 });
    }
    s.line([tx - 2, Y(0)], [tx + 4.8, Y(0)], { width: 0.6 });   // Nulllinie
    s.label([tx + 6.2, top - 3.4], "°C", { anchor: "start" });
    marks.forEach(m => {
      s.line([tx - 3.6, Y(m.v)], [tx - 1.6, Y(m.v)], { width: 0.6 });
      s.label([tx - 4.4, Y(m.v)], m.t, { anchor: "end", bold: true });
    });
    return s.done();
  }

  // Zahlengerade von lo bis hi; Start mit Punkt, Pfeile (a → b) übereinander; endMark: „?“ am letzten Pfeilende
  function lineSketch(lo, hi, start, arrows, endMark) {
    const INK = AG.SKETCH_COLORS.INK;
    const W = 74, H = 28, yA = 21;
    const X = v => 4 + (v - lo) * (W - 8) / (hi - lo);
    const s = AG.sketch(W, H);
    s.line([X(lo) - 1.5, yA], [X(hi) + 1.5, yA], { width: 0.4 });
    for (let v = lo; v <= hi; v++) {
      const z = v === 0;
      s.line([X(v), yA - (z ? 2 : 1.2)], [X(v), yA + (z ? 2 : 1.2)], { width: z ? 0.6 : 0.35 });
      if (v % 2 === 0) s.label([X(v), yA + 4.8], AG.plain(num(v)), { bold: z });
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

  function thermoTask(rng) {
    const v = rng.pick([-20, -15, -10, -5, 5, 10, 15, 20, 25]);
    const k = ab(v) / 5;
    const h = rng.int(6, 22);
    const q = rng.pick([
      `Welche Temperatur zeigt das Thermometer um ${S(h)} Uhr?`,
      `Wie warm ist es um ${S(h)} Uhr laut Thermometer?`,
      `Lies die Temperatur um ${S(h)} Uhr am Thermometer ab.`,
    ]);
    return {
      q: rich(q),
      a: rich(N(v), " °C"),
      steps: [
        rich("Ein Strich entspricht 5 °C. Vom Nullstrich ", k === 1 ? "ist es " : "sind es ", S(k),
          k === 1 ? " Strich" : " Striche", v > 0 ? " nach oben." : " nach unten."),
        rich(S(k), " · 5 °C = ", S(ab(v)), " °C"),
        rich("Temperatur: ", N(v), " °C"),
      ],
      fig: thermoSketch(v, [], 5),
      inline: false,
    };
  }

  function thermoAB(rng) {
    const A = 2 * rng.int(-9, 4), B = A + 2 * rng.int(3, 10);
    if (B > 26 || B === 0) return null;
    const h1 = rng.int(6, 18), h2 = h1 + rng.int(2, 6);
    return {
      q: rich(`Die Temperatur wird um ${S(h1)} Uhr (A) und um ${S(h2)} Uhr (B) gemessen. `,
        `Wie groß ist der Temperaturunterschied zwischen ${S(h1)} Uhr und ${S(h2)} Uhr?`),
      a: rich(S(B - A), " °C"),
      steps: [rich("A = ", N(A), " °C, B = ", N(B), " °C"), ...distSteps(A, B, "°C")],
      fig: thermoSketch(null, [{ v: A, t: "A" }, { v: B, t: "B" }], 2),
      inline: false,
    };
  }

  function pfeil(rng) {
    const s0 = rng.int(-6, 6), d = rng.int(1, 6), op = rng.pick(["+", "-"]);
    const e = op === "+" ? s0 + d : s0 - d;
    if (ab(e) > 10) return null;
    const wo = rng.chance(0.5);
    const fig = lineSketch(-10, 10, s0, [{ a: s0, b: e }], wo);
    const dir = op === "+" ? "rechts" : "links";
    if (wo) {
      return {
        q: rich("Der Pfeil startet bei ", N(s0), ". Er ist ", S(d), " Einheiten lang und zeigt nach ", dir, ". Wo endet er?"),
        a: N(e),
        steps: calcLines(s0, op, d),
        fig,
        inline: false,
      };
    }
    return {
      q: rich("Der Pfeil startet bei ", N(s0), " und zeigt nach ", dir, ". Welche Rechnung zeigt er? Schreibe sie mit Zahlen auf."),
      a: rich(N(s0), OP[op], N(d), " = ", N(e)),
      steps: calcLines(s0, op, d),
      fig,
      inline: false,
    };
  }

  function pfeilKette(rng) {
    const s0 = rng.int(-6, 6), d1 = rng.int(1, 6), d2 = rng.int(1, 6);
    const op1 = rng.pick(["+", "-"]), op2 = rng.pick(["+", "-"]);
    const e1 = op1 === "+" ? s0 + d1 : s0 - d1;
    const e2 = op2 === "+" ? e1 + d2 : e1 - d2;
    if (ab(e1) > 10 || ab(e2) > 10) return null;
    return {
      q: rich("Man startet bei ", N(s0), ". Der erste Pfeil zeigt nach ", op1 === "+" ? "rechts" : "links",
        ", der zweite nach ", op2 === "+" ? "rechts" : "links", ". Welche Rechnung zeigen die Pfeile? Wo landet man?"),
      a: rich(N(s0), OP[op1], N(d1), OP[op2], N(d2), " = ", N(e2)),
      steps: [...calcLines(s0, op1, d1), ...calcLines(e1, op2, d2)],
      fig: lineSketch(-10, 10, s0, [{ a: s0, b: e1 }, { a: e1, b: e2 }], true),
      inline: false,
    };
  }

  const cand3 = (rng, level) => (level === 1 ? thermoTask(rng)
    : level === 2 ? pfeil(rng)
      : rng.chance(0.5) ? thermoAB(rng) : pfeilKette(rng));

  // ---------- Typ 4: Sachaufgaben ----------
  const done = (q, a, steps, antwort) => ({ q: rich(q), a: rich(a), steps: [...steps, rich(antwort)] });

  function sach1(rng) {
    const k = rng.int(0, 3);
    if (k === 0) {
      const b = rng.int(2, 15), a = -(b + rng.int(1, 25)), res = a + b;
      return done(`Ein Taucher ist ${S(-a)} m unter dem Meeresspiegel. Er taucht ${S(b)} m nach oben. Wie tief ist er jetzt?`,
        rich(N(res), " m"), calcLines(a, "+", b, "m"), `Der Taucher ist jetzt ${S(-res)} m unter dem Meeresspiegel.`);
    }
    if (k === 1) {
      const D = rng.int(2, 20), b = rng.int(2, 12), res = -D - b;
      return done(`Ein Taucher ist ${S(D)} m unter dem Meeresspiegel. Er taucht ${S(b)} m tiefer. Wie tief ist er jetzt?`,
        rich(N(res), " m"), calcLines(-D, "-", b, "m"), `Der Taucher ist jetzt ${S(-res)} m unter dem Meeresspiegel.`);
    }
    if (k === 2) {
      const a = rng.pick([-3, -2, -1]), b = rng.int(2, 4), res = a + b;
      if (res === 0) return null;
      return done(`Der Aufzug steht im Stockwerk ${S(a)} in der Tiefgarage. Er fährt ${S(b)} Stockwerke nach oben. In welchem Stockwerk hält er jetzt?`,
        rich("Stockwerk ", N(res)), calcLines(a, "+", b), `Der Aufzug hält im Stockwerk ${S(res)}.`);
    }
    const a = rng.int(-9, -1), b = rng.int(3, 12), res = a + b;
    if (res === 0) return null;
    return done(`Morgens um 6 Uhr sind es ${S(a)} °C. Bis Mittag steigt die Temperatur um ${S(b)} °C. Wie warm ist es mittags?`,
      rich(N(res), " °C"), calcLines(a, "+", b, "°C"), `Mittags sind es ${S(res)} °C.`);
  }

  function sach2(rng) {
    const k = rng.int(0, 2);
    if (k === 0) {
      const D = rng.int(5, 30), H = rng.int(10, 60);
      return done(`Ein Taucher ist ${S(D)} m unter dem Meeresspiegel. Eine Möwe fliegt ${S(H)} m über dem Meeresspiegel. Wie groß ist der Höhenunterschied zwischen Möwe und Taucher?`,
        rich(N(H + D), " m"), distSteps(-D, H, "m"), `Der Höhenunterschied beträgt ${S(H + D)} m.`);
    }
    if (k === 1) {
      const t = rng.int(-12, -1), h = rng.int(2, 12);
      return done(`Am Tag wird es höchstens ${S(h)} °C warm. In der Nacht sinkt die Temperatur auf ${S(t)} °C. Wie groß ist der Unterschied zwischen Tageshöchst- und Tiefsttemperatur?`,
        rich(S(h - t), " °C"), distSteps(t, h, "°C"), `Der Temperaturunterschied beträgt ${S(h - t)} °C.`);
    }
    const d1 = rng.int(5, 20), d2 = d1 + rng.int(3, 15);
    return done(`Ein Taucher ist ${S(d1)} m unter dem Meeresspiegel. Ein Fisch schwimmt ${S(d2)} m unter dem Meeresspiegel. Wie groß ist der Höhenunterschied zwischen Taucher und Fisch?`,
      rich(S(d2 - d1), " m"), distSteps(-d2, -d1, "m"), `Der Höhenunterschied beträgt ${S(d2 - d1)} m.`);
  }

  const BERGE = [["Die Zugspitze", 2962], ["Der Watzmann", 2713], ["Der Wendelstein", 1838]];
  function sach3(rng) {
    const k = rng.int(0, 2);
    if (k === 0) {
      const a = rng.pick([-3, -2, -1]), b1 = rng.int(2, 6), b2 = rng.int(1, 4);
      const mid = a + b1, res = mid - b2;
      if (res === 0) return null;
      return done(`Der Aufzug steht im Stockwerk ${S(a)}. Er fährt ${S(b1)} Stockwerke nach oben und danach ${S(b2)} Stockwerke nach unten. In welchem Stockwerk hält er jetzt?`,
        rich("Stockwerk ", N(res)), [...calcLines(a, "+", b1), ...calcLines(mid, "-", b2)], `Der Aufzug hält im Stockwerk ${S(res)}.`);
    }
    if (k === 1) {
      const [name, H] = rng.pick(BERGE), D = rng.int(5, 40);
      return done(`${name} ist ${S(H)} m hoch. Ein Taucher ist ${S(D)} m unter dem Meeresspiegel. Wie groß ist der Höhenunterschied zwischen dem Gipfel und dem Taucher?`,
        rich(N(H + D), " m"), distSteps(-D, H, "m"), `Der Höhenunterschied beträgt ${S(H + D)} m.`);
    }
    const a = rng.int(-9, -1), b1 = rng.int(4, 10), b2 = rng.int(3, 9);
    const mid = a + b1, res = mid - b2;
    return done(`Um 6 Uhr sind es ${S(a)} °C. Bis 12 Uhr steigt die Temperatur um ${S(b1)} °C. Bis 18 Uhr fällt sie um ${S(b2)} °C. Wie warm ist es um 18 Uhr?`,
      rich(N(res), " °C"), [...calcLines(a, "+", b1), ...calcLines(mid, "-", b2, "°C")], `Um 18 Uhr sind es ${S(res)} °C.`);
  }

  const cand4 = (rng, level) => (level === 1 ? sach1(rng) : level === 2 ? sach2(rng) : sach3(rng));

  // ---------- Registrierung ----------
  AG.registerType({
    id: "m5-ganze-ordnen",
    ...LB,
    title: "Ganze Zahlen ordnen",
    instruction: {
      1: "Setze das Zeichen < oder > ein.",
      2: "Ordne die Zahlen der Größe nach.",
      3: "Beantworte die Fragen zu den ganzen Zahlen.",
    },
    merke: [
      { b: "Zahlenstrahl: " },
      "Die größere Zahl liegt weiter rechts. Negative Zahlen sind kleiner als 0. Je größer der Betrag einer negativen Zahl, desto kleiner ist sie. Beispiel: −20 < −12 < −3 < 0 < 5.",
    ],
    cols: 2,
    generate: gen(cand1),
  });

  AG.registerType({
    id: "m5-zustandsaenderung",
    ...LB,
    title: "Zustandsänderungen",
    instruction: {
      1: "Berechne. Achte auf das Vorzeichen.",
      2: "Schreibe die Rechnung auf und berechne das Ergebnis.",
      3: "Berechne. Schreibe die Rechnung in Schritten auf.",
    },
    merke: [
      { b: "Zustandsänderung: " },
      "Steigt die Temperatur um b, rechnet man a + b. Fällt sie um b, rechnet man a − b. Beispiel: −4 °C steigt um 9 °C: −4 + 9 = 5 °C.",
    ],
    cols: 2,
    generate: gen(zustand),
  });

  AG.registerType({
    id: "m5-thermometer",
    ...LB,
    title: "Thermometer und Zahlengerade",
    instruction: {
      1: "Lies die Temperatur am Thermometer ab.",
      2: "Welche Rechnung zeigt der Pfeil?",
      3: "Lies ab bzw. rechne mit dem Zahlenstrahl. Die Nulllinie hilft dir.",
    },
    merke: [
      { b: "Zahlenstrahl: " },
      "Nach rechts wird die Zahl größer, nach links kleiner. Pfeil nach rechts bedeutet +, Pfeil nach links bedeutet −. Beispiel: Start bei −4, 6 Schritte nach rechts: −4 + 6 = 2.",
    ],
    cols: 2,
    generate: gen(cand3),
  });

  AG.registerType({
    id: "m5-ganze-sachaufgaben",
    ...LB,
    title: "Sachaufgaben mit ganzen Zahlen",
    instruction: {
      1: "Rechne und schreibe einen Antwortsatz.",
      2: "Berechne den Unterschied und schreibe einen Antwortsatz.",
      3: "Rechne in Schritten und schreibe einen Antwortsatz.",
    },
    merke: [
      { b: "Höhen und Temperaturen: " },
      "Unter dem Meeresspiegel und unter 0 °C stehen die Zahlen mit Minuszeichen. Für einen Unterschied zählt man von der kleineren bis zur größeren Zahl. Beispiel: Taucher −15 m, Möwe 40 m: 15 m + 40 m = 55 m Unterschied.",
    ],
    cols: 1,
    generate: gen(cand4),
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
