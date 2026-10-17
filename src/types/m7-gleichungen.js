// M7 LB 7: Gleichungen – Terme vereinfachen, Termwerte, Gleichungen lösen, Fehler finden.
(function (AG) {
  const { Frac, num, rich, MINUS, fmtInt, plain } = AG;

  const sum = arr => arr.reduce((s, v) => s + v, 0);

  // Variable mit positivem Koeffizienten m: 1 -> „x“, 3 -> „3x“
  function xBody(m, vr = "x") {
    const f = Frac.of(m);
    return f.eq(1) ? rich(vr) : rich(num(f), vr);
  }

  // Summanden mit Vorzeichen zu einer Summe verbinden. items: [{sg, body}]
  function joinItems(items) {
    return rich(items.map((it, i) => [
      i === 0 ? (it.sg < 0 ? MINUS : "") : (it.sg < 0 ? " " + MINUS + " " : " + "),
      it.body,
    ]));
  }

  // Teile einer linearen Seite: {t:"ax", a} | {t:"c", c} | {t:"br", k, m, dot}  bedeutet k·(x + m)
  function partDisplay(p, vr = "x") {
    if (p.t === "ax") return { sg: Math.sign(p.a), body: xBody(Math.abs(p.a), vr) };
    if (p.t === "c") return { sg: Math.sign(p.c), body: [String(Math.abs(p.c))] };
    const op = p.m < 0 ? " " + MINUS + " " : " + ";
    return { sg: 1, body: rich(String(p.k), p.dot ? " · (" : "(", vr, op, String(Math.abs(p.m)), ")") };
  }
  function partSubst(p, x) {
    const px = x < 0 ? rich("(", fmtInt(x), ")") : fmtInt(x);
    if (p.t === "ax") {
      const m = Math.abs(p.a);
      return { sg: Math.sign(p.a), body: m === 1 ? px : rich(String(m), " · ", px) };
    }
    if (p.t === "c") return { sg: Math.sign(p.c), body: [String(Math.abs(p.c))] };
    const op = p.m < 0 ? " " + MINUS + " " : " + ";
    return { sg: 1, body: rich(String(p.k), " · (", fmtInt(x), op, String(Math.abs(p.m)), ")") };
  }
  function partVal(p, x) {
    if (p.t === "ax") return p.a * x;
    if (p.t === "c") return p.c;
    return p.k * (x + p.m);
  }
  const sideDisplay = (parts, vr = "x") => joinItems(parts.map(p => partDisplay(p, vr)));
  const sideSubst = (parts, x) => joinItems(parts.map(p => partSubst(p, x)));
  const sideVal = (parts, x) => sum(parts.map(p => partVal(p, x)));

  // Seite ausmultiplizieren: {a, c} als Brüche, a·x + c
  function lin(parts) {
    let a = new Frac(0), c = new Frac(0);
    for (const p of parts) {
      if (p.t === "ax") a = a.add(p.a);
      else if (p.t === "c") c = c.add(p.c);
      else { a = a.add(p.k); c = c.add(p.k * p.m); }
    }
    return { a, c };
  }

  // Seite im Lösungsweg: {a: Bruch, c: Bruch}
  function sideAC(s, vr = "x") {
    const items = [];
    if (s.a.sign() !== 0) items.push({ sg: s.a.sign(), body: xBody(s.a.abs(), vr) });
    if (s.c.sign() !== 0) items.push({ sg: s.c.sign(), body: num(s.c.abs()) });
    return items.length ? joinItems(items) : "0";
  }
  const eqAC = st => rich(sideAC(st.L), " = ", sideAC(st.R));

  // Lösungsweg mit Äquivalenzumformungen. L, R: {a, c} als Brüche.
  // err: null oder {kind: "var" | "move" | "div"} – baut genau einen typischen Fehler ein.
  // Jede Zeile zeigt den Zustand vor der Umformung und die Umformung (op).
  function buildChain(L, R, err) {
    const st = { L: { a: L.a, c: L.c }, R: { a: R.a, c: R.c } };
    const snap = () => ({ L: { a: st.L.a, c: st.L.c }, R: { a: st.R.a, c: st.R.c } });
    const lines = [];
    if (st.R.a.sign() !== 0) {
      const B = st.R.a;
      lines.push({ st: snap(), op: rich(B.sign() > 0 ? MINUS : "+", xBody(B.abs())), kind: "var" });
      st.L.a = err && err.kind === "var" ? st.L.a.add(B) : st.L.a.sub(B);
      st.R.a = new Frac(0);
    }
    if (st.L.c.sign() !== 0) {
      const C = st.L.c;
      lines.push({ st: snap(), op: rich(C.sign() > 0 ? MINUS : "+", num(C.abs())), kind: "const" });
      st.L.c = new Frac(0);
      st.R.c = err && err.kind === "move" ? st.R.c.add(C) : st.R.c.sub(C);
    }
    if (!st.L.a.eq(1)) {
      const A = st.L.a;
      lines.push({ st: snap(), op: rich(":", A.sign() < 0 ? rich("(", num(A), ")") : num(A)), kind: "div" });
      const v = st.R.c;
      const r = err && err.kind === "div"
        ? (A.sign() < 0 ? v.div(A.abs()) : v.mul(A))
        : v.div(A);
      st.L.a = new Frac(1);
      st.R.c = r;
    }
    return { lines, final: st.R.c };
  }

  // Gleichung erzeugen. Lösung x immer ganze Zahl ungleich 0.
  // Niveau 1: x + b = c | ax = c;  Niveau 2: ax + b = c;
  // Niveau 3: ax + b = Bx + d | k(x + m) = Bx + d
  function genEq(rng, level) {
    const s = () => (rng.chance(0.5) ? -1 : 1);
    const nz = (lo, hi) => s() * rng.int(lo, hi);
    for (let i = 0; i < 1000; i++) {
      if (level === 1) {
        if (rng.chance(0.5)) {
          const x = nz(1, 12), b = nz(1, 12), c = x + b;
          if (c === 0) continue;
          return { L: [{ t: "ax", a: 1 }, { t: "c", c: b }], R: [{ t: "c", c }], x, bracket: false };
        }
        const a = nz(2, 9), x = nz(1, 12);
        return { L: [{ t: "ax", a }], R: [{ t: "c", c: a * x }], x, bracket: false };
      }
      if (level === 2) {
        const a = nz(2, 9), x = nz(1, 12), b = nz(1, 15), c = a * x + b;
        if (c === 0) continue;
        return { L: [{ t: "ax", a }, { t: "c", c: b }], R: [{ t: "c", c }], x, bracket: false };
      }
      if (rng.chance(0.6)) {
        const A = nz(2, 9), B = nz(2, 9);
        if (Math.abs(A - B) < 2) continue;
        const x = nz(1, 9), bL = nz(1, 12), bR = bL + (A - B) * x;
        if (bR === 0) continue;
        return { L: [{ t: "ax", a: A }, { t: "c", c: bL }], R: [{ t: "ax", a: B }, { t: "c", c: bR }], x, bracket: false };
      }
      const k = rng.int(2, 5), m = nz(1, 6), B = nz(2, 6), x = nz(1, 9);
      if (Math.abs(k - B) < 2) continue;
      const bR = k * m + (k - B) * x;
      if (bR === 0) continue;
      return { L: [{ t: "br", k, m }], R: [{ t: "ax", a: B }, { t: "c", c: bR }], x, bracket: true };
    }
    throw new Error("genEq: keine Gleichung gefunden");
  }

  function probeRich(L, R, x) {
    if (R.length === 1 && R[0].t === "c") {
      return rich("Probe: ", sideSubst(L, x), " = ", num(sideVal(R, x)), " ✓");
    }
    return rich("Probe: ", sideSubst(L, x), " = ", num(sideVal(L, x)), " = ", sideSubst(R, x), " ✓");
  }

  // ---------- 1. Terme vereinfachen ----------

  function gen1(rng, level) {
    const vr = rng.chance(0.15) ? rng.pick(["a", "y"]) : "x";
    const s = () => (rng.chance(0.5) ? -1 : 1);
    const pX = () => {
      const m = rng.int(1, 9), g = s();
      return { sg: g, body: xBody(m, vr), terms: [{ v: g * m, k: "x" }], ev: x => g * m * x };
    };
    // Produkt mit Variable: „4 · 3x“, „3x · 4“, „−2x · 5“ (Vorzeichen außen) oder „3 · (−2x)“
    const pXP = () => {
      const k = rng.int(2, 6), m = s() * rng.int(2, 9), g = s();
      let body;
      if (m < 0) body = rich(String(k), " · (", MINUS, xBody(-m, vr), ")");
      else body = rng.chance(0.5) ? rich(String(k), " · ", xBody(m, vr)) : rich(xBody(m, vr), " · ", String(k));
      return { sg: g, body, terms: [{ v: g * k * m, k: "x" }], ev: x => g * k * m * x };
    };
    const pC = () => {
      const m = rng.int(1, 12), g = s();
      return { sg: g, body: [String(m)], terms: [{ v: g * m, k: "c" }], ev: () => g * m };
    };
    // Klammer mit Distributivgesetz: „3(2x − 5)“, „−2(x − 4)“
    const pParen = () => {
      const k = rng.int(2, 5);
      const p = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      const q = rng.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const g = s();
      const inner = joinItems([
        { sg: Math.sign(p), body: xBody(Math.abs(p), vr) },
        { sg: Math.sign(q), body: [String(Math.abs(q))] },
      ]);
      return {
        sg: g,
        body: rich(String(k), "(", inner, ")"),
        terms: [{ v: g * k * p, k: "x" }, { v: g * k * q, k: "c" }],
        ev: x => g * k * (p * x + q),
      };
    };
    const build = () => {
      if (level === 1) {
        // 3 oder 4 Glieder, davon mindestens zwei mit x
        const total = rng.int(3, 4), nC = rng.int(1, total - 2), nX = total - nC;
        const out = [];
        for (let i = 0; i < nX; i++) out.push(pX());
        for (let i = 0; i < nC; i++) out.push(pC());
        return out;
      }
      if (level === 2) {
        // 3 oder 4 Glieder, ein bis zwei Produkte mit Variable
        let nP, nC, nX;
        do {
          nP = rng.int(1, 2); nC = rng.int(1, 2); nX = rng.int(0, 1);
        } while (nP + nC + nX < 3 || nP + nC + nX > 4);
        const out = [];
        for (let i = 0; i < nP; i++) out.push(pXP());
        for (let i = 0; i < nX; i++) out.push(pX());
        for (let i = 0; i < nC; i++) out.push(pC());
        return out;
      }
      // eine oder zwei Klammern, nach dem Ausmultiplizieren höchstens 5 Glieder
      const nPar = rng.int(1, 2);
      const out = [];
      for (let i = 0; i < nPar; i++) out.push(pParen());
      const nOth = rng.int(1, Math.min(2, 5 - 2 * nPar));
      for (let i = 0; i < nOth; i++) out.push(i === 0 && rng.chance(0.5) ? pC() : (rng.chance(0.5) ? pX() : pC()));
      return out;
    };

    let pieces = null, A = 0, B = 0, ok = false;
    for (let i = 0; i < 500 && !ok; i++) {
      pieces = rng.shuffle(build());
      const terms = pieces.flatMap(p => p.terms);
      A = sum(terms.filter(t => t.k === "x").map(t => t.v));
      B = sum(terms.filter(t => t.k === "c").map(t => t.v));
      if (A === 0 || B === 0) continue;
      if (Math.abs(A) === 1 && rng.chance(0.7)) continue; // ±1x nicht zu oft
      const maxTerms = level === 3 ? 5 : 4;
      if (terms.length < 3 || terms.length > maxTerms) continue;
      ok = true;
    }
    if (!ok) throw new Error("m7-terme-vereinfachen: keine Aufgabe gefunden");

    const terms = pieces.flatMap(p => p.terms);
    const ti = ts => ts.map(t => ({
      sg: Math.sign(t.v),
      body: t.k === "x" ? xBody(Math.abs(t.v), vr) : [String(Math.abs(t.v))],
    }));
    const xsT = terms.filter(t => t.k === "x"), csT = terms.filter(t => t.k === "c");
    const q = joinItems(pieces.map(p => ({ sg: p.sg, body: p.body })));
    const qPlain = plain(q);

    const raw = [];
    const addStep = r => {
      const t = plain(r);
      if (t !== qPlain && (!raw.length || plain(raw[raw.length - 1]) !== t)) raw.push(r);
    };
    if (level === 1) {
      addStep(joinItems(ti([...xsT, ...csT]))); // Kommutativgesetz: gleiche Glieder nebeneinander
    } else {
      addStep(joinItems(ti(terms)));            // Produkte ausrechnen, Klammern auflösen
      addStep(joinItems(ti([...xsT, ...csT])));
    }

    const a = joinItems([
      { sg: Math.sign(A), body: xBody(Math.abs(A), vr) },
      { sg: Math.sign(B), body: [String(Math.abs(B))] },
    ]);

    return {
      q,
      a,
      // Schritte immer mit dem Ergebnis als letzter Zeile
      steps: raw.map(r => rich("= ", r)).concat(AG.plain(rich(raw.length ? raw[raw.length - 1] : [])) === AG.plain(a) ? [] : [rich("= ", a)]),
      _A: A, _B: B, _vr: vr,
      _eval: x => sum(pieces.map(p => p.ev(x))),
    };
  }

  // ---------- 2. Termwerte berechnen ----------

  function genTermwert(rng, level) {
    const s = () => (rng.chance(0.5) ? -1 : 1);
    let parts, range;
    if (level === 1) {
      parts = [{ t: "ax", a: s() * rng.int(2, 9) }, { t: "c", c: s() * rng.int(1, 9) }];
      range = [-4, 6];
    } else if (level === 2) {
      parts = [{ t: "ax", a: s() * rng.int(2, 12) }, { t: "c", c: s() * rng.int(1, 20) }];
      range = [-6, 8];
    } else {
      let ax, br;
      do { // x-Glieder heben sich nicht auf (sonst ist der Termwert immer gleich)
        ax = { t: "ax", a: s() * rng.int(1, 5) };
        br = { t: "br", k: rng.int(2, 5), m: s() * rng.int(1, 5), dot: true };
      } while (Math.abs(ax.a + br.k) < 2);
      parts = rng.chance(0.5) ? [ax, br] : [br, ax];
      range = [-3, 5];
    }
    const pool = [];
    for (let v = range[0]; v <= range[1]; v++) pool.push(v);
    const n = rng.int(4, 5);
    const xs = rng.shuffle(pool).slice(0, n).sort((p, q) => p - q);
    const vals = xs.map(x => sideVal(parts, x));
    const termRich = sideDisplay(parts);

    const head = [rich("x"), ...xs.map(x => num(x))];
    const rowT = [termRich, ...xs.map(() => [{ blank: 3 }])];
    const rowA = [termRich, ...vals.map(v => num(v))];
    const steps = xs.map((x, i) => rich("x = ", num(x), ": ", sideSubst(parts, x), " = ", num(vals[i])));
    const aParts = [];
    vals.forEach((v, i) => { if (i) aParts.push("; "); aParts.push(num(v)); });

    return {
      q: rich("Berechne die Termwerte von ", termRich, "."),
      table: { rows: [head, rowT] },
      aTable: { rows: [head, rowA] },
      a: rich("Werte: ", aParts),
      steps,
      _parts: parts, _xs: xs, _vals: vals,
    };
  }

  // ---------- 3. Gleichungen lösen ----------

  function genGleichung(rng, level) {
    const eq = genEq(rng, level);
    const ch = buildChain(lin(eq.L), lin(eq.R), null);
    if (!ch.final.eq(eq.x)) throw new Error("m7-gleichung: Lösungsweg stimmt nicht");
    const steps = ch.lines.map(l => rich(eqAC(l.st), "   | ", l.op));
    steps.push(rich("x = ", num(eq.x)));
    steps.push(probeRich(eq.L, eq.R, eq.x));
    return {
      q: rich(sideDisplay(eq.L), " = ", sideDisplay(eq.R)),
      a: rich("x = ", num(eq.x)),
      steps,
      _x: eq.x, _L: eq.L, _R: eq.R,
    };
  }

  // ---------- 4. Fehler finden ----------

  const NAMES = ["Lena", "Tim", "Aylin", "Jonas", "Mia", "Elias"];

  function genFehler(rng, level) {
    for (let tries = 0; tries < 300; tries++) {
      const eq = genEq(rng, level);
      const Lx = lin(eq.L), Rx = lin(eq.R);
      const clean = buildChain(Lx, Rx, null);
      const kinds = clean.lines.map(l => l.kind);
      // Fehlerart wird zufällig gewählt, so liegt der Fehler mal beim ersten, mal beim späteren Schritt
      const app = [];
      if (kinds.includes("var") && !Lx.a.add(Rx.a).eq(0)) app.push("var");
      if (kinds.includes("const")) app.push("move");
      if (kinds.includes("div")) app.push("div");
      if (eq.bracket) app.push("bracket");
      const kind = rng.pick(app);

      let wrong;
      if (kind === "bracket") {
        const br = eq.L.find(p => p.t === "br");
        wrong = buildChain({ a: Lx.a, c: new Frac(br.m) }, Rx, null); // Klammer: nur die Zahl m statt k·m
      } else {
        wrong = buildChain(Lx, Rx, { kind });
      }
      if (wrong.final.eq(eq.x)) continue;

      let msg;
      if (kind === "var") {
        msg = "Beim Übertragen des x-Glieds auf die andere Seite wurde das Vorzeichen nicht gewechselt.";
      } else if (kind === "move") {
        msg = "Beim Übertragen einer Zahl auf die andere Seite wurde das Vorzeichen nicht gewechselt.";
      } else if (kind === "bracket") {
        msg = "Beim Auflösen der Klammer wurde nur das x mit dem Faktor multipliziert, die Zahl in der Klammer nicht.";
      } else {
        const divA = clean.lines.find(l => l.kind === "div").st.L.a;
        msg = divA.sign() < 0
          ? "Bei der Division durch eine negative Zahl wurde das Minuszeichen vergessen."
          : "Statt durch die Zahl zu teilen, wurde mit ihr multipliziert.";
      }

      const name = rng.pick(NAMES);
      const intro = eq.bracket
        ? rich(name, " löst die Gleichung ", sideDisplay(eq.L), " = ", sideDisplay(eq.R), " so:")
        : rich(name, " löst die Gleichung so:");
      const qParts = [intro];
      wrong.lines.forEach(l => qParts.push({ br: true }, eqAC(l.st), "   | ", l.op));
      qParts.push({ br: true }, "x = ", num(wrong.final));
      qParts.push({ br: true }, "Finde den Fehler und rechne richtig.");

      const steps = clean.lines.map(l => rich(eqAC(l.st), "   | ", l.op));
      steps.push(rich("x = ", num(eq.x)));

      return {
        q: rich(qParts),
        a: rich(msg, " Richtig gelöst: x = ", num(eq.x)),
        steps,
        _L: eq.L, _R: eq.R, _x: eq.x, _wrong: wrong.final,
      };
    }
    throw new Error("m7-fehler-finden: keine Aufgabe gefunden");
  }

  // ---------- Registrierung ----------

  AG.registerType({
    id: "m7-terme-vereinfachen",
    klasse: "7",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    title: "Terme vereinfachen",
    instruction: {
      1: "Fasse so weit wie möglich zusammen. Gib das Ergebnis in der Form ax + b bzw. ax − b an.",
      2: "Vereinfache den Term. Achte auf die Vorzeichen.",
      3: "Löse zuerst die Klammern auf, dann fasse zusammen. Gib das Ergebnis in der Form ax + b bzw. ax − b an.",
    },
    merke: rich(
      "Gleiche Glieder werden zusammengefasst: ", { b: "5x − 2x = 3x" },
      ". Eine Klammer wird mit dem Distributivgesetz aufgelöst: ", { b: "3(2x − 5) = 6x − 15" }, "."
    ),
    cols: 2,
    generate: (rng, level) => gen1(rng, level),
    verify(t) {
      for (const x of [-7, -3, -1, 0, 2, 5, 9]) {
        if (t._eval(x) !== t._A * x + t._B) return "Termwert bei x = " + x + " stimmt nicht";
      }
      const want = (t._A === 1 ? t._vr : t._A === -1 ? MINUS + t._vr : fmtInt(t._A) + t._vr)
        + (t._B < 0 ? " " + MINUS + " " + Math.abs(t._B) : " + " + t._B);
      if (plain(t.a) !== want) return "Ergebnis falsch: " + plain(t.a) + " statt " + want;
      if (t._A === 0 || t._B === 0) return "Ergebnis hat die Form 0x oder nur eine Zahl";
      return true;
    },
  });

  AG.registerType({
    id: "m7-termwert",
    klasse: "7",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    title: "Termwerte berechnen",
    instruction: {
      1: "Setze für x die angegebenen Zahlen in den Term ein und berechne. Ergänze die Tabelle.",
      2: "Setze die Zahlen in den Term ein. Achte auf die Vorzeichen. Ergänze die Tabelle.",
      3: "Setze die Zahlen ein. Achte auf die Klammern und die Vorzeichen. Ergänze die Tabelle.",
    },
    merke: rich(
      "Beim Einsetzen die Zahl in Klammern schreiben: ",
      { b: "3 · (" + MINUS + "2) − 5 = " + MINUS + "6 − 5 = " + MINUS + "11" },
      "."
    ),
    cols: 1,
    generate: (rng, level) => genTermwert(rng, level),
    verify(t) {
      for (let i = 0; i < t._xs.length; i++) {
        const v = sideVal(t._parts, t._xs[i]);
        if (v !== t._vals[i]) return "Termwert für x = " + t._xs[i] + " falsch";
        if (plain(t.aTable.rows[1][i + 1]) !== plain(num(v))) return "Tabelle falsch bei x = " + t._xs[i];
      }
      return true;
    },
  });

  AG.registerType({
    id: "m7-gleichung",
    klasse: "7",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    title: "Gleichungen lösen",
    instruction: {
      1: "Löse die Gleichung durch Umformen. Schreibe die Umformungen auf und mache die Probe.",
      2: "Löse die Gleichung durch Umformen. Schreibe die Umformungen auf und mache die Probe.",
      3: "Löse die Klammern auf und bringe die x-Glieder auf eine Seite. Schreibe die Umformungen auf und mache die Probe.",
    },
    merke: rich(
      "Auf beiden Seiten darf man dieselbe Zahl addieren, subtrahieren, mit ihr multiplizieren oder durch sie (≠ 0) teilen. Beispiel: ",
      { b: "3x − 7 = 8   | +7" }, " ergibt 3x = 15."
    ),
    cols: 2,
    generate: (rng, level) => genGleichung(rng, level),
    verify(t) {
      const L = lin(t._L), R = lin(t._R);
      const coef = L.a.sub(R.a);
      if (coef.sign() === 0) return "keine eindeutige Lösung";
      const sol = R.c.sub(L.c).div(coef);
      if (!sol.eq(t._x)) return "Lösung falsch: " + sol + " statt " + t._x;
      if (!sol.isInt() || sol.eq(0)) return "Lösung ist keine ganze Zahl ungleich 0";
      if (plain(t.a) !== "x = " + plain(num(t._x))) return "Antwortzeile falsch";
      return true;
    },
  });

  AG.registerType({
    id: "m7-fehler-finden",
    klasse: "7",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    title: "Fehler finden",
    instruction: "Finde den Fehler in der Rechnung. Berichtige ihn und gib die richtige Lösung an.",
    merke: rich(
      "Typische Fehler: Beim Übertragen das Vorzeichen wechseln; bei der Division durch eine negative Zahl das Vorzeichen beachten; in einer Klammer jeden Summanden multiplizieren: ",
      { b: "3(x − 2) = 3x − 6" }, "."
    ),
    cols: 1,
    levels: [2, 3],
    generate: (rng, level) => genFehler(rng, level),
    verify(t) {
      const L = lin(t._L), R = lin(t._R);
      const sol = R.c.sub(L.c).div(L.a.sub(R.a));
      if (!sol.eq(t._x)) return "Richtige Lösung falsch";
      if (t._wrong.eq(t._x)) return "Der eingebaute Fehler wirkt sich nicht aus";
      if (t.q.filter(seg => seg && seg.br).length < 3) return "Rechnung nicht zeilenweise";
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
