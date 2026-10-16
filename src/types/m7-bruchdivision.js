// M7 LB 2: Division durch einen Bruch (Bruch : Bruch). Referenz-Aufgabentyp.
(function (AG) {
  const { Frac, num, rich, MINUS } = AG;

  // zufälliger echter Bruch mit Nenner aus dens, nicht ganzzahlig
  function properFrac(rng, dens) {
    const d = rng.pick(dens);
    let n = rng.int(1, d - 1);
    return new Frac(n, d);
  }

  AG.registerType({
    id: "m7-bruchdivision",
    klasse: "7",
    zug: "M",
    lb: "2",
    lbTitle: "Rationale Zahlen – Rechenregeln",
    title: "Durch Brüche dividieren",
    instruction: {
      1: "Berechne. Kürze das Ergebnis vollständig.",
      2: "Berechne. Gib das Ergebnis als gemischte Zahl an.",
      3: "Berechne. Achte auf die Vorzeichen.",
    },
    merke: [
      "Man dividiert durch einen Bruch, indem man mit seinem ", { b: "Kehrwert" }, " multipliziert: ",
      { f: [3, 4] }, " : ", { f: [2, 5] }, " = ", { f: [3, 4] }, " · ", { f: [5, 2] }, " = ", { f: [15, 8] }, " = ", { f: [7, 8], w: 1 },
      ". Gemischte Zahlen vorher in unechte Brüche umwandeln.",
    ],
    cols: 3,
    generate(rng, level) {
      let a, b;
      for (let i = 0; i < 200; i++) {
        if (level === 1) {
          a = properFrac(rng, [2, 3, 4, 5, 6, 8, 9, 10]);
          b = properFrac(rng, [2, 3, 4, 5, 6, 8, 9, 10]);
        } else if (level === 2) {
          a = properFrac(rng, [2, 3, 4, 5, 6, 8]);
          b = properFrac(rng, [2, 3, 4, 5, 6, 8]);
          // eine der Zahlen gemischt oder ganz
          if (rng.chance(0.5)) a = a.add(rng.int(1, 3));
          else b = b.add(rng.int(1, 2));
          if (rng.chance(0.25)) a = new Frac(rng.int(2, 9));
        } else {
          a = properFrac(rng, [2, 3, 4, 5, 6, 8, 12]).add(rng.int(0, 3));
          b = properFrac(rng, [2, 3, 4, 5, 6, 8, 12]).add(rng.int(0, 2));
          if (rng.chance(0.6)) a = a.neg();
          if (rng.chance(0.6)) b = b.neg();
          if (a.sign() > 0 && b.sign() > 0) b = b.neg();
        }
        const res = a.div(b);
        // keine Trivialaufgaben: nicht gleich, Ergebnis nicht 1, Nenner nicht riesig
        if (a.eq(b) || res.abs().eq(1)) continue;
        if (res.d > (level === 1 ? 20 : 30) || Math.abs(res.n) > 120) continue;
        if (level === 1 && a.d === b.d) continue;
        break;
      }
      const res = a.div(b);
      const improper = x => num(x, { as: "improper", paren: true });
      const q = rich(num(a, { paren: false }), " : ", num(b, { paren: true }));
      const steps = [];
      const aImp = !a.isInt() && Math.abs(a.n) > a.d, bImp = !b.isInt() && Math.abs(b.n) > b.d;
      if (aImp || bImp) {
        steps.push(rich("= ", num(a, { as: "improper" }), " : ", improper(b)));
      }
      steps.push(rich("= ", num(a, { as: "improper" }), " · ", improper(b.inv())));
      const raw = new Frac(a.n * b.d, a.d * b.n); // vor dem Kürzen
      const rawN = a.n * b.d, rawD = a.d * b.n;
      if (Math.abs(rawN) !== Math.abs(raw.n) || Math.abs(rawD) !== raw.d) {
        const sign = Math.sign(rawN) * Math.sign(rawD) < 0 ? MINUS : "";
        steps.push(rich("= ", sign, { f: [Math.abs(rawN), Math.abs(rawD)] }));
      }
      steps.push(rich("= ", num(res, { as: "improper" })));
      if (!res.isInt() && Math.abs(res.n) > res.d) steps.push(rich("= ", num(res)));
      return { q, a: num(res), steps };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
