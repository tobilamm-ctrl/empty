// M8 LB 7: Gleichungen – Terme mit Klammern, Gleichungen mit Klammern, Ausgangsgleichung, Fehler finden, Textgleichungen.
(function (AG) {
  const { Frac, num, rich, MINUS, plain } = AG;

  const S = n => String(n);
  const sum = arr => arr.reduce((s, v) => s + v, 0);
  const zugOf = ctx => (ctx && ctx.zug === "R" ? "R" : "M");

  // ---------- Darstellung von Zahlen, Gliedern und Seiten ----------

  // Koeffizient ohne Vorzeichen: 1 -> „x“, 3 -> „3x“, 1/2 -> Bruch vor x
  function coefRich(f, vr = "x") {
    const a = f.abs();
    if (a.eq(1)) return rich(vr);
    return rich(a.isInt() ? S(a.n) : num(a, { as: "improper" }), vr);
  }

  // Zahl ohne Vorzeichen: ganz, Dezimalzahl mit Komma (höchstens 1 Nachkommastelle) oder Bruch
  function numRich(f) {
    return f.isTerminating() && f.decimals() <= 1 ? num(f, { as: "dec" }) : num(f);
  }

  // Glieder zu einer Summe verbinden. items: [{sg, body}]
  function joinItems(items) {
    return rich(items.map((it, i) => [
      i === 0 ? (it.sg < 0 ? MINUS : "") : (it.sg < 0 ? " " + MINUS + " " : " + "),
      it.body,
    ]));
  }

  // Glied einer Seite: {t:"ax", a: Frac} | {t:"c", c: Frac} | {t:"br", k, ax, c} (= k·(ax·x + c))
  function partItem(p) {
    if (p.t === "ax") return { sg: p.a.sign(), body: coefRich(p.a) };
    if (p.t === "c") return { sg: p.c.sign(), body: numRich(p.c.abs()) };
    const inner = joinItems([
      { sg: Math.sign(p.ax), body: coefRich(new Frac(Math.abs(p.ax))) },
      { sg: Math.sign(p.c), body: numRich(new Frac(Math.abs(p.c))) },
    ]);
    const kAbs = Math.abs(p.k);
    return { sg: Math.sign(p.k), body: rich(kAbs === 1 ? "" : S(kAbs), "(", inner, ")") };
  }
  const sideDisplay = parts => joinItems(parts.map(partItem));

  // Klammern ausmultiplizieren (ohne Zusammenfassen)
  function expandParts(parts) {
    const out = [];
    for (const p of parts) {
      if (p.t === "br") out.push({ t: "ax", a: new Frac(p.k * p.ax) }, { t: "c", c: new Frac(p.k * p.c) });
      else out.push(p);
    }
    return out;
  }

  // Seite zusammenfassen zu {a, c} (a·x + c)
  function lin(parts) {
    let a = new Frac(0), c = new Frac(0);
    for (const p of parts) {
      if (p.t === "ax") a = a.add(p.a);
      else if (p.t === "c") c = c.add(p.c);
      else { a = a.add(p.k * p.ax); c = c.add(p.k * p.c); }
    }
    return { a, c };
  }

  // zusammengefasste Seite {a, c} als Text
  function sideAC(s) {
    const items = [];
    if (s.a.sign() !== 0) items.push({ sg: s.a.sign(), body: coefRich(s.a) });
    if (s.c.sign() !== 0) items.push({ sg: s.c.sign(), body: numRich(s.c.abs()) });
    return items.length ? joinItems(items) : ["0"];
  }
  const eqAC = (L, R) => rich(sideAC(L), " = ", sideAC(R));

  // Division bzw. Multiplikation mit dem Kehrwert, wenn der Koeffizient ein Bruch ist
  function divOp(A) {
    if (A.isInt()) return rich(":", A.sign() < 0 ? rich("(", num(A), ")") : num(A));
    const I = A.inv();
    return rich("· ", I.sign() < 0 ? rich("(", num(I, { as: "improper" }), ")") : num(I, { as: "improper" }));
  }

  // Lösungsweg mit Äquivalenzumformungen aus zwei {a, c}-Seiten.
  // err: null oder {kind: "var" | "move" | "div" | "divsign"} – baut genau einen typischen Fehler ein.
  // Jede Zeile: Zustand vor der Umformung (st), Umformung (op), Art (kind). Ergebnis: {lines, final} oder null.
  function chainLines(L0, R0, err) {
    const st = { L: { a: L0.a, c: L0.c }, R: { a: R0.a, c: R0.c } };
    const snap = () => ({ L: { a: st.L.a, c: st.L.c }, R: { a: st.R.a, c: st.R.c } });
    const lines = [];
    if (st.R.a.sign() !== 0) {
      const B = st.R.a;
      lines.push({ st: snap(), op: rich(B.sign() > 0 ? MINUS : "+", coefRich(B)), kind: "var" });
      const newA = err && err.kind === "var" ? st.L.a.add(B) : st.L.a.sub(B);
      if (newA.sign() === 0) return null;
      st.L.a = newA;
      st.R.a = new Frac(0);
    }
    if (st.L.c.sign() !== 0) {
      const C = st.L.c;
      lines.push({ st: snap(), op: rich(C.sign() > 0 ? MINUS : "+", numRich(C.abs())), kind: "move" });
      st.L.c = new Frac(0);
      st.R.c = err && err.kind === "move" ? st.R.c.add(C) : st.R.c.sub(C);
    }
    if (!st.L.a.eq(1)) {
      const A = st.L.a;
      lines.push({ st: snap(), op: divOp(A), kind: "div", A });
      const v = st.R.c;
      let r;
      if (err && err.kind === "div") r = v;                                  // nur die linke Seite geteilt
      else if (err && err.kind === "divsign" && A.sign() < 0) r = v.div(A.abs()); // Minuszeichen vergessen
      else r = v.div(A);
      st.L.a = new Frac(1);
      st.R.c = r;
    }
    return { lines, final: st.R.c };
  }

  // ---------- 1. Terme mit Klammern vereinfachen ----------

  const PAIRS = [["x", "y"], ["a", "b"], ["u", "v"], ["m", "n"], ["r", "s"]];

  // Glied ohne Vorzeichen: 3x, x, 5
  function termBody(c, v) {
    const a = Math.abs(c);
    if (v === null) return [S(a)];
    return a === 1 ? rich(v) : rich(S(a), v);
  }
  function joinTerms(terms) {
    return joinItems(terms.map(t => ({ sg: Math.sign(t.c), body: termBody(t.c, t.v) })));
  }
  // Ausgangsglied: loses Glied {c, v} oder Klammer {br, sg, k, inner}
  function itemDisplay(it) {
    if (!it.br) return { sg: Math.sign(it.c), body: termBody(it.c, it.v) };
    return { sg: it.sg, body: rich(it.k === 1 ? "" : S(it.k), "(", joinTerms(it.inner), ")") };
  }
  function expandItem(it) {
    return it.br ? it.inner.map(t => ({ c: it.sg * it.k * t.c, v: t.v })) : [{ c: it.c, v: it.v }];
  }
  function collect(terms, vars) {
    const r = {};
    for (const v of vars) r[v] = sum(terms.filter(t => t.v === v).map(t => t.c));
    r.c = sum(terms.filter(t => t.v === null).map(t => t.c));
    return r;
  }

  function genTerms(rng, level) {
    const vars = rng.pick(PAIRS);
    const [v1, v2] = vars;
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const term = (hi, v) => ({ c: sg() * rng.int(1, hi), v });
    const loose = () => {
      const r = rng.int(1, 3);
      if (r === 1) return term(9, v1);
      if (r === 2) return term(9, v2);
      return { c: sg() * rng.int(1, 12), v: null };
    };
    const inner = hi => [term(hi, v1), rng.chance(0.6) ? term(hi, v2) : { c: sg() * rng.int(1, 12), v: null }];
    const plusBr = () => ({ br: true, sg: sg(), k: 1, inner: inner(9) });     // Plus- oder Minusklammer
    const mulBr = () => ({ br: true, sg: sg(), k: rng.int(2, 5), inner: inner(6) }); // Ausmultiplizieren

    const build = () => {
      if (level === 1) return [plusBr(), ...Array.from({ length: rng.int(1, 2) }, loose)];
      if (level === 2) return [mulBr(), ...Array.from({ length: rng.int(1, 2) }, loose)];
      const out = [mulBr(), mulBr()];
      if (rng.chance(0.4)) out.push(loose());
      return out;
    };

    let items = null, res = null;
    for (let i = 0; i < 500 && !items; i++) {
      const cand = rng.shuffle(build());
      const terms = cand.flatMap(expandItem);
      if (terms.length < 3 || terms.length > 5) continue;
      const r = collect(terms, vars);
      if (r[v1] === 0 || r[v2] === 0 || r.c === 0) continue;
      items = cand;
      res = r;
    }
    if (!items) throw new Error("m8-terme-klammern: keine Aufgabe gefunden");

    const out = [{ c: res[v1], v: v1 }, { c: res[v2], v: v2 }, { c: res.c, v: null }];
    const q = joinItems(items.map(itemDisplay));
    const expanded = items.flatMap(expandItem);
    const ordered = [
      ...expanded.filter(t => t.v === v1),
      ...expanded.filter(t => t.v === v2),
      ...expanded.filter(t => t.v === null),
    ];
    const a = joinTerms(out);

    const raw = [];
    const addStep = r => {
      const t = plain(r);
      if (t !== plain(q) && (!raw.length || plain(raw[raw.length - 1]) !== t)) raw.push(r);
    };
    addStep(joinTerms(expanded));  // Klammern auflösen
    addStep(joinTerms(ordered));   // gleiche Glieder nebeneinander
    const steps = raw.map(r => rich("= ", r));
    if (!raw.length || plain(raw[raw.length - 1]) !== plain(a)) steps.push(rich("= ", a));

    return { q, a, steps, _vars: vars, _items: items, _out: out };
  }

  // ---------- 2. Gleichungen mit Klammern ----------

  // Lösung: ganz, Dezimalzahl mit einer Stelle (Regelklasse) oder – im M-Zug – auch Bruch
  function pickX(rng, zug) {
    const s = rng.chance(0.5) ? -1 : 1;
    const roll = rng.int(1, 10);
    if (roll <= 5) return new Frac(s * rng.int(1, 12));
    if (roll <= 8 || zug === "R") {
      let n = s * rng.int(11, 79);
      if (n % 10 === 0) n += s;
      return new Frac(n, 10);
    }
    const q = rng.pick([2, 3, 4, 5]);
    let p = s * rng.int(1, 3 * q);
    if (p % q === 0) p += s;
    return new Frac(p, q);
  }

  function genGleichung(rng, level, zug) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const inner = k => ({ t: "br", k, ax: sg() * rng.int(1, 4), c: sg() * rng.int(1, 9) });
    const loose = () => ({ t: "ax", a: new Frac(sg() * rng.int(1, 9)) });
    const konst = () => ({ t: "c", c: new Frac(sg() * rng.int(1, 9)) });
    const freeC = () => ({ t: "c", c: null }); // Konstante auf der rechten Seite, wird an die Lösung angepasst

    for (let i = 0; i < 2000; i++) {
      const x0 = pickX(rng, zug);
      let L, R;
      if (level === 1) {
        L = [inner(sg() * rng.int(2, 5))];
        if (rng.chance(0.4)) L.push(konst());
        R = [loose(), freeC()];
      } else if (level === 2) {
        L = [inner(sg() * rng.int(2, 5))];
        if (rng.chance(0.5)) L.push(loose());
        R = [inner(sg() * rng.int(2, 4)), freeC()];
      } else {
        L = [{ t: "br", k: -1, ax: sg() * rng.int(1, 4), c: sg() * rng.int(1, 9) }, inner(sg() * rng.int(2, 4))];
        if (rng.chance(0.4)) L.push(konst());
        const bruch = zug === "M" && rng.chance(0.5);
        R = [bruch ? { t: "ax", a: new Frac(sg() * rng.pick([1, 3, 5]), 2) } : loose(), freeC()];
      }
      const lL = lin(L), lR = lin(R.filter(p => p.c !== null));
      const diff = lL.a.sub(lR.a);
      if (diff.sign() === 0) continue;
      // freie Konstante so wählen, dass x0 Lösung ist: aL·x0 + cL = aR·x0 + cR
      const f = diff.mul(x0).add(lL.c).sub(lR.c);
      if (f.sign() === 0 || f.abs().cmp(new Frac(40)) > 0) continue;
      if (R.some(p => p.t === "ax" && !p.a.isInt()) && !f.isInt()) continue; // Bruchkoeffizient: keine Kommazahl dazu
      if (zug === "R" && (!f.isTerminating() || f.decimals() > 1)) continue;
      R.find(p => p.c === null).c = f;
      if (rng.chance(0.3)) [L, R] = [R, L];

      const ch = chainLines(lin(L), lin(R), null);
      if (!ch || !ch.final.eq(x0)) continue;
      const hasBr = [...L, ...R].some(p => p.t === "br");
      const steps = [];
      // Klammern ausmultipliziert nur zeigen, wenn die Zeile nicht schon identisch mit dem ersten Lösungsschritt ist
      const expanded = rich(sideDisplay(expandParts(L)), " = ", sideDisplay(expandParts(R)));
      if (hasBr && (!ch.lines.length || plain(expanded) !== plain(eqAC(ch.lines[0].st.L, ch.lines[0].st.R)))) steps.push(expanded);
      for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
      steps.push(rich("x = ", numRich(x0)));
      return {
        q: rich(sideDisplay(L), " = ", sideDisplay(R)),
        a: rich("x = ", numRich(x0)),
        steps,
        _L: L, _R: R, _x: x0, _zug: zug,
      };
    }
    throw new Error("m8-gleichung-klammern: keine Aufgabe gefunden");
  }

  // ---------- 3. Ausgangsgleichung ----------

  const xp = a => ({ t: "ax", a: new Frac(a) });
  const cp = c => ({ t: "c", c: new Frac(c) });
  const paren = a => (a < 0 ? rich("(", num(a), ")") : num(a));

  // Umformung „| +v“ bzw. „| −v“ (v kann ein x-Glied sein); inv = Rückwärtsschritt
  function addText(v, vr) {
    return rich(v < 0 ? MINUS : "+", vr ? coefRich(new Frac(Math.abs(v)), vr) : [S(Math.abs(v))]);
  }
  const addOp = (v, vr) => ({ f: addText(v, vr), inv: addText(-v, vr) });
  const divOp2 = a => ({ f: rich(":", paren(a)), inv: rich("·", paren(a)) });
  const klammerOp = () => ({ f: rich("Klammer auflösen"), inv: rich("ausklammern") });

  // Zustände: S[i] = {L: Glieder, R: Glieder}; ops[i] führt von S[i] nach S[i+1]
  function aus1(rng) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const x0 = sg() * rng.int(1, 9);
    const a = sg() * rng.int(2, 9);
    const b = sg() * rng.int(1, 12);
    const c = a * x0 + b;
    if (c === 0) return null;
    return {
      states: [
        { L: [xp(a), cp(b)], R: [cp(c)] },
        { L: [xp(a)], R: [cp(c - b)] },
        { L: [xp(1)], R: [cp(x0)] },
      ],
      ops: [addOp(-b), divOp2(a)],
    };
  }

  function aus2(rng) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const x0 = sg() * rng.int(1, 9);
    const a = sg() * rng.int(1, 9);
    const cc = sg() * rng.int(1, 9);
    if (Math.abs(a - cc) < 2) return null;
    const b = sg() * rng.int(1, 12);
    const d = b + (a - cc) * x0;
    if (d === 0) return null;
    return {
      states: [
        { L: [xp(a), cp(b)], R: [xp(cc), cp(d)] },
        { L: [xp(a - cc), cp(b)], R: [cp(d)] },
        { L: [xp(a - cc)], R: [cp(d - b)] },
        { L: [xp(1)], R: [cp(x0)] },
      ],
      ops: [addOp(-cc, "x"), addOp(-b), divOp2(a - cc)],
    };
  }

  function aus3(rng) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const k = rng.int(2, 5);
    const m = sg() * rng.int(1, 6);
    const aa = sg() * rng.int(1, 6);
    if (Math.abs(k - aa) < 2) return null;
    const x0 = sg() * rng.int(1, 9);
    const d = k * m + (k - aa) * x0;
    if (d === 0) return null;
    return {
      states: [
        { L: [{ t: "br", k, ax: 1, c: m }], R: [xp(aa), cp(d)] },
        { L: [xp(k), cp(k * m)], R: [xp(aa), cp(d)] },
        { L: [xp(k - aa), cp(k * m)], R: [cp(d)] },
        { L: [xp(k - aa)], R: [cp(d - k * m)] },
        { L: [xp(1)], R: [cp(x0)] },
      ],
      ops: [klammerOp(), addOp(-aa, "x"), addOp(-(k * m)), divOp2(k - aa)],
    };
  }

  function genAusgang(rng, level) {
    let t = null;
    for (let i = 0; i < 500 && !t; i++) {
      t = level === 1 ? aus1(rng) : level === 2 ? aus2(rng) : aus3(rng);
    }
    if (!t) throw new Error("m8-ausgangsgleichung: keine Aufgabe gefunden");
    const { states, ops } = t;
    const n = ops.length;
    const eqOf = st => rich(sideDisplay(st.L), " = ", sideDisplay(st.R));
    const luecke = rng.chance(0.3);
    const j = luecke ? rng.int(1, n - 1) : 0;   // Index der gesuchten Gleichung

    let q;
    if (!luecke) {
      const opLines = ops.flatMap(o => [{ br: true }, "| ", o.f]);
      q = rich(
        "Eine Gleichung wird Schritt für Schritt umgeformt. Gegeben sind die Umformungsschritte in dieser Reihenfolge:",
        opLines,
        { br: true }, "Am Ende steht: ", eqOf(states[n]),
        { br: true }, "Wie lautet die Ausgangsgleichung?"
      );
    } else {
      const lines = [];
      for (let i = 0; i < n; i++) lines.push({ br: true }, i === j ? { blank: 16 } : eqOf(states[i]), "   | ", ops[i].f);
      q = rich("Ergänze die fehlende Gleichung in der Umformungskette:", lines, { br: true }, eqOf(states[n]));
    }

    // Rückwärts vom Ergebnis zur gesuchten Gleichung
    const steps = [];
    for (let i = n - 1; i >= j; i--) steps.push(rich(eqOf(states[i + 1]), "   | ", ops[i].inv));
    steps.push(eqOf(states[j]));
    const a = eqOf(states[j]);

    return { q, a, steps, _states: states, _x: t.states[n].R[0].c };
  }

  // ---------- 4. Fehler finden ----------

  const NAMES = ["Lena", "Tim", "Aylin", "Jonas", "Mia", "Elias"];
  const FEHLER_MSG = {
    var: "Das x-Glied wurde mit dem falschen Rechenzeichen verrechnet (Vorzeichenfehler). Auf beiden Seiten muss dasselbe gerechnet werden.",
    move: "Die Zahl wurde mit dem falschen Rechenzeichen verrechnet (Vorzeichenfehler). Auf beiden Seiten muss dasselbe gerechnet werden.",
    div: "Nur die linke Seite wurde durch die Zahl geteilt, die rechte Seite nicht.",
    divsign: "Bei der Division durch eine negative Zahl wurde das Minuszeichen vergessen.",
    klammerVz: "Beim Auflösen der Klammer mit Minuszeichen davor wurde das Vorzeichen der Zahl in der Klammer nicht umgekehrt.",
    klammerMult: "Beim Ausmultiplizieren wurde die Zahl in der Klammer nicht mit dem Faktor multipliziert.",
  };

  function genFehler(rng, level) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    for (let tries = 0; tries < 800; tries++) {
      const xi = sg() * rng.int(1, 9);
      let L, R, k = null, m = 0;
      if (level === 1) {
        const a = sg() * rng.int(2, 9), b = sg() * rng.int(1, 12);
        const c = a * xi + b;
        if (c === 0) continue;
        L = [{ t: "ax", a: new Frac(a) }, { t: "c", c: new Frac(b) }];
        R = [{ t: "c", c: new Frac(c) }];
      } else if (level === 2) {
        const aL = sg() * rng.int(1, 9), aR = sg() * rng.int(1, 9);
        if (aL === aR) continue;
        const b = sg() * rng.int(1, 12);
        const d = b + (aL - aR) * xi;
        if (d === 0) continue;
        L = [{ t: "ax", a: new Frac(aL) }, { t: "c", c: new Frac(b) }];
        R = [{ t: "ax", a: new Frac(aR) }, { t: "c", c: new Frac(d) }];
      } else {
        k = rng.chance(0.35) ? -1 : sg() * rng.int(2, 5);
        m = sg() * rng.int(1, 6);
        const aR = sg() * rng.int(1, 6);
        if (aR === k) continue;
        const d = k * m + (k - aR) * xi;
        if (d === 0) continue;
        L = [{ t: "br", k, ax: 1, c: m }];
        R = [{ t: "ax", a: new Frac(aR) }, { t: "c", c: new Frac(d) }];
      }
      const x0 = new Frac(xi);
      const Lx = lin(L), Rx = lin(R);
      const clean = chainLines(Lx, Rx, null);
      if (!clean || !clean.final.eq(x0)) continue;

      const kinds = [];
      if (k !== null) kinds.push("klammer");
      if (clean.lines.some(l => l.kind === "var")) kinds.push("var");
      if (clean.lines.some(l => l.kind === "move")) kinds.push("move");
      const dl = clean.lines.find(l => l.kind === "div");
      if (dl) {
        kinds.push("div");
        if (dl.A.sign() < 0) kinds.push("divsign");
      }
      const kind = rng.pick(kinds);

      // Klammerzeile (nur bei Klammern) steht immer als Zeile 1, auch wenn der Fehler woanders liegt
      const pre = k !== null ? [{ text: rich(sideDisplay(L), " = ", sideDisplay(R)), op: rich("Klammer auflösen") }] : [];
      let lines, errIdx, wrongFinal, msg;
      if (kind === "klammer") {
        // Klammer falsch aufgelöst: die Zahl in der Klammer wird nicht mit k multipliziert bzw. das Vorzeichen nicht umgekehrt
        const wc = chainLines({ a: Lx.a, c: new Frac(m) }, Rx, null);
        if (!wc) continue;
        lines = pre.concat(wc.lines.map(l => ({ text: eqAC(l.st.L, l.st.R), op: l.op })));
        errIdx = 1;
        wrongFinal = wc.final;
        msg = k === -1 ? FEHLER_MSG.klammerVz : FEHLER_MSG.klammerMult;
      } else {
        const wc = chainLines(Lx, Rx, { kind });
        if (!wc) continue;
        const want = kind === "divsign" ? "div" : kind;
        lines = pre.concat(wc.lines.map(l => ({ text: eqAC(l.st.L, l.st.R), op: l.op })));
        errIdx = wc.lines.findIndex(l => l.kind === want) + 1 + pre.length;
        wrongFinal = wc.final;
        msg = FEHLER_MSG[kind];
      }
      if (errIdx < 1 || wrongFinal.eq(x0)) continue;

      const qParts = [rich(rng.pick(NAMES), " löst die Gleichung so:")];
      lines.forEach((l, i) => qParts.push({ br: true }, "Zeile " + S(i + 1) + ":  ", l.text, "   | ", l.op));
      qParts.push({ br: true }, "Zeile " + S(lines.length + 1) + ":  x = ", numRich(wrongFinal));
      qParts.push({ br: true }, "Finde den Fehler und rechne richtig.");

      const steps = pre.map(l => rich(l.text, "   | ", l.op));
      for (const l of clean.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
      steps.push(rich("x = ", numRich(x0)));

      return {
        q: rich(qParts),
        a: rich("Fehler in Zeile " + S(errIdx + 1) + ": ", msg, " Richtig gelöst: x = ", numRich(x0)),
        steps,
        _L: L, _R: R, _x: x0, _wrong: wrongFinal, _err: errIdx,
      };
    }
    throw new Error("m8-fehler-finden: keine Aufgabe gefunden");
  }

  // ---------- 5. Textgleichungen ----------

  const WORD_DAT = { 2: "Doppelten", 3: "Dreifachen", 4: "Vierfachen", 5: "Fünffachen" };
  const WORD_AKK = { 2: "Doppelte", 3: "Dreifache", 4: "Vierfache", 5: "Fünffache" };
  const K_WORT = { 3: "dreimal", 4: "viermal", 5: "fünfmal" };
  const M_WORT = { 2: "doppelt", 3: "dreimal" };

  // Schritte: Variable, Gleichung, Umformungen, Lösung, Antwortsatz (letzte Zeile)
  function textResult(vardef, q, eq, L, R, x0, answer) {
    const ch = chainLines(L, R, null);
    if (!ch || !ch.final.eq(x0)) return null;
    const steps = [rich(vardef), eq];
    for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
    steps.push(rich("x = ", numRich(x0)), answer);
    return { q, a: answer, steps, _L: L, _R: R, _x: x0 };
  }

  function tZahlen(rng) {
    const p = rng.int(2, 5), r = rng.int(2, 4);
    if (p === r) return null;
    const x0 = rng.int(1, 15), s = rng.int(1, 9);
    const c0 = r * (x0 + s) - p * x0;
    if (c0 < 1 || c0 > 30) return null;
    return textResult(
      "x: gesuchte Zahl",
      rich("Addiert man zum ", WORD_DAT[p], " einer Zahl ", S(c0), ", erhält man das ", WORD_AKK[r], " der um ", S(s), " vergrößerten Zahl. Wie heißt die Zahl?"),
      rich(S(p), "x + ", S(c0), " = ", S(r), " · (x + ", S(s), ")"),
      { a: new Frac(p), c: new Frac(c0) },
      { a: new Frac(r), c: new Frac(r * s) },
      new Frac(x0),
      rich("Die gesuchte Zahl ist ", S(x0), "."),
    );
  }

  function tUmfang(rng) {
    const b = rng.int(3, 20), d = rng.int(2, 8);
    const u = 4 * b + 2 * d;
    if (u > 120) return null;
    return textResult(
      "x: Breite in cm",
      rich("Die Länge eines Rechtecks ist ", S(d), " cm länger als seine Breite. Der Umfang beträgt ", S(u), " cm. Wie lang sind Breite und Länge?"),
      rich("2 · (x + x + ", S(d), ") = ", S(u)),
      { a: new Frac(4), c: new Frac(2 * d) },
      { a: new Frac(0), c: new Frac(u) },
      new Frac(b),
      rich("Die Breite beträgt ", S(b), " cm, die Länge ", S(b + d), " cm."),
    );
  }

  function tAlter(rng) {
    const k = rng.pick([3, 4, 5]), m = rng.pick([2, 3]);
    if (m >= k) return null;
    const t = rng.int(2, 20);
    const top = (m - 1) * t;
    if (top % (k - m) !== 0) return null;
    const x0 = top / (k - m);
    if (x0 < 4 || x0 > 16 || k * x0 < 24 || k * x0 > 55) return null;
    const P = rng.pick([
      { E: "Der Vater", e: "der Vater", K: "sein Sohn", k: "der Sohn", gen: "des Sohnes", pl: "Vater und Sohn", Ka: "Der Sohn", Ea: "der Vater" },
      { E: "Die Mutter", e: "die Mutter", K: "ihre Tochter", k: "die Tochter", gen: "der Tochter", pl: "Mutter und Tochter", Ka: "Die Tochter", Ea: "die Mutter" },
      { E: "Der Opa", e: "der Opa", K: "sein Enkel", k: "der Enkel", gen: "des Enkels", pl: "Opa und Enkel", Ka: "Der Enkel", Ea: "der Opa" },
    ]);
    if (P.E === "Der Opa" && k < 4) return null;
    return textResult(
      "x: Alter " + P.gen + " heute in Jahren",
      rich(P.E, " ist ", K_WORT[k], " so alt wie ", P.K, ". In ", S(t), " Jahren ist ", P.e, " nur noch ", M_WORT[m], " so alt wie ", P.k, ". Wie alt sind ", P.pl, " heute?"),
      rich(S(k), "x + ", S(t), " = ", S(m), " · (x + ", S(t), ")"),
      { a: new Frac(k), c: new Frac(t) },
      { a: new Frac(m), c: new Frac(m * t) },
      new Frac(x0),
      rich(P.Ka, " ist ", S(x0), " Jahre alt, ", P.Ea, " ", S(k * x0), " Jahre."),
    );
  }

  function tMischung(rng) {
    const p1 = rng.pick([10, 12, 15, 16, 18, 20]);
    const p2 = rng.pick([4, 5, 6, 8, 9]);
    if (p2 >= p1 - 1) return null;
    const P = rng.int(p2 + 1, p1 - 1);
    const T = rng.pick([10, 20, 25, 30, 40, 50]);
    const top = T * (P - p2);
    if (top % (p1 - p2) !== 0) return null;
    const x0 = top / (p1 - p2);
    if (x0 <= 0 || x0 >= T) return null;
    return textResult(
      "x: Menge der teureren Sorte in kg",
      rich("Aus zwei Nusssorten zu ", S(p1), " €/kg und ", S(p2), " €/kg soll eine Mischung von ", S(T), " kg hergestellt werden, die ", S(P), " €/kg kostet. Wie viel kg der teureren Sorte werden benötigt?"),
      rich(S(p1), "x + ", S(p2), " · (", S(T), " ", MINUS, " x) = ", S(P), " · ", S(T)),
      { a: new Frac(p1 - p2), c: new Frac(p2 * T) },
      { a: new Frac(0), c: new Frac(P * T) },
      new Frac(x0),
      rich("Man braucht ", S(x0), " kg der teureren und ", S(T - x0), " kg der billigeren Sorte."),
    );
  }

  function genText(rng, level) {
    const kinds = level === 1 ? [tZahlen, tUmfang] : level === 2 ? [tAlter, tZahlen] : [tMischung, tAlter];
    for (let i = 0; i < 500; i++) {
      const t = rng.pick(kinds)(rng);
      if (t) return t;
    }
    throw new Error("m8-textgleichungen: keine Aufgabe gefunden");
  }

  // ---------- Registrierung ----------

  AG.registerType({
    id: "m8-terme-klammern",
    klasse: "8",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Terme mit Klammern vereinfachen",
    instruction: {
      1: "Löse die Klammern auf und fasse zusammen. Schreibe das Ergebnis geordnet: zuerst die Variablen, dann die Zahl.",
      2: "Multipliziere die Klammern aus. Achte auf die Vorzeichen. Fasse zusammen und ordne das Ergebnis.",
      3: "Löse beide Klammern auf. Achte auf die Vorzeichen, fasse gleiche Glieder zusammen und ordne das Ergebnis.",
    },
    merke: rich(
      "Vor einer Klammer mit Pluszeichen kann man die Klammer weglassen. Vor einer Klammer mit Minuszeichen ändert sich jedes Vorzeichen in der Klammer: ",
      { b: "x " + MINUS + " (2x " + MINUS + " y) = x " + MINUS + " 2x + y = " + MINUS + "x + y" },
      ". Beim Ausmultiplizieren wird jedes Glied mit dem Faktor multipliziert: ",
      { b: "3(2x " + MINUS + " 4y) = 6x " + MINUS + " 12y" }, "."
    ),
    cols: 2,
    generate: (rng, level) => genTerms(rng, level),
    verify(t) {
      const [v1, v2] = t._vars;
      const terms = t._items.flatMap(expandItem);
      const evalT = (ts, env) => sum(ts.map(tm => (tm.v === null ? tm.c : tm.c * env[tm.v])));
      for (const [x, y] of [[-3, 2], [4, -1], [0, 5], [-2, -4], [7, 3], [1, -6]]) {
        const env = { [v1]: x, [v2]: y };
        if (evalT(terms, env) !== evalT(t._out, env)) return "Termwert bei " + v1 + " = " + x + ", " + v2 + " = " + y + " stimmt nicht";
      }
      if (t._out.some(tm => tm.c === 0)) return "Glied mit Null im Ergebnis";
      if (plain(t.a) !== plain(joinTerms(t._out))) return "Ergebnis nicht geordnet";
      return true;
    },
  });

  AG.registerType({
    id: "m8-gleichung-klammern",
    klasse: "8",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Gleichungen mit Klammern",
    instruction: {
      1: "Löse die Klammer auf, fasse zusammen und bestimme x. Schreibe die Lösung als x = …",
      2: "Löse die Klammern auf beiden Seiten auf. Bringe die x-Glieder auf eine Seite und löse nach x auf.",
      3: "Achte auf die Minusklammer und die Vorzeichen. Löse alle Klammern auf, fasse zusammen und löse nach x auf.",
    },
    merke: rich(
      "Vor einer Klammer mit Minuszeichen ändert sich jedes Vorzeichen in der Klammer. Jedes Glied in der Klammer wird mit dem Faktor multipliziert: ",
      { b: "3(x + 4) = 3x + 12" }, "."
    ),
    cols: 2,
    generate: (rng, level, ctx) => genGleichung(rng, level, zugOf(ctx)),
    verify(t) {
      const L = lin(t._L), R = lin(t._R);
      const coef = L.a.sub(R.a);
      if (coef.sign() === 0) return "keine eindeutige Lösung";
      const sol = R.c.sub(L.c).div(coef);
      if (!sol.eq(t._x)) return "Lösung falsch: " + sol + " statt " + t._x;
      if (!L.a.mul(t._x).add(L.c).eq(R.a.mul(t._x).add(R.c))) return "Probe stimmt nicht";
      if (t._zug === "R") {
        const parts = [...t._L, ...t._R];
        for (const p of parts) {
          if (p.t === "ax" && !p.a.isInt()) return "Bruch als Koeffizient in der Regelklasse";
          if (p.t === "br" && (!Number.isInteger(p.ax) || !Number.isInteger(p.c))) return "Klammerinhalt nicht ganz";
          if (p.t === "c" && (!p.c.isTerminating() || p.c.decimals() > 1)) return "Konstante mit mehr als einer Nachkommastelle";
        }
        if (!t._x.isTerminating() || t._x.decimals() > 1) return "Lösung nicht ganz oder Dezimalzahl mit einer Stelle";
        if (/\//.test(plain(t.q) + plain(t.a) + t.steps.map(plain).join(""))) return "Bruchstrich in der Regelklasse";
      }
      return true;
    },
  });

  AG.registerType({
    id: "m8-ausgangsgleichung",
    klasse: "8",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Ausgangsgleichung finden",
    instruction: {
      1: "Gehe die Umformungsschritte rückwärts und schreibe die Ausgangsgleichung auf.",
      2: "Gehe die drei Umformungsschritte rückwärts und schreibe die Ausgangsgleichung auf.",
      3: "Die Kette enthält einen Klammer-Schritt. Gehe die Schritte rückwärts und schreibe die Ausgangsgleichung auf.",
    },
    merke: rich(
      "Jede Umformung wird auf beiden Seiten ausgeführt. Rückwärts kehrt man sie um: ",
      { b: "| −5" }, " wird zu ", { b: "| +5" }, ", ", { b: "| : 3" }, " wird zu ", { b: "| · 3" }, "."
    ),
    cols: 1,
    generate: (rng, level) => genAusgang(rng, level),
    verify(t) {
      // jede Gleichung der Kette hat dieselbe Lösung x
      const x = t._x;
      for (const st of t._states) {
        const L = lin(st.L), R = lin(st.R);
        if (!L.a.mul(x).add(L.c).eq(R.a.mul(x).add(R.c))) return "Zustand der Kette stimmt nicht";
      }
      return true;
    },
  });

  AG.registerType({
    id: "m8-fehler-finden",
    klasse: "8",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Fehler in Umformungen finden",
    instruction: "Finde in der Rechnung genau einen Fehler. Gib die Zeile an, beschreibe den Fehler und berechne die richtige Lösung.",
    merke: rich(
      "Typische Fehler: Beim Übertragen das Vorzeichen wechseln. Bei einer Klammer mit Minuszeichen davor alle Vorzeichen in der Klammer ändern. Umformungen gelten für beide Seiten: ",
      { b: "3(x " + MINUS + " 2) = 3x " + MINUS + " 6" }, "."
    ),
    cols: 1,
    generate: (rng, level) => genFehler(rng, level),
    verify(t) {
      const L = lin(t._L), R = lin(t._R);
      const sol = R.c.sub(L.c).div(L.a.sub(R.a));
      if (!sol.eq(t._x)) return "Richtige Lösung falsch";
      if (t._wrong.eq(t._x)) return "Der eingebaute Fehler wirkt sich nicht aus";
      if (!(t._err >= 1)) return "Fehlerzeile fehlt";
      if (t.q.filter(seg => seg && seg.br).length < 3) return "Rechnung nicht zeilenweise";
      return true;
    },
  });

  AG.registerType({
    id: "m8-textgleichungen",
    klasse: "8",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Textgleichungen",
    instruction: {
      1: "Lege zuerst die Variable fest, stelle die Gleichung auf und löse sie. Schreibe einen Antwortsatz.",
      2: "Lege die Variable fest, stelle die Gleichung auf und löse sie. Schreibe einen Antwortsatz.",
      3: "Lege die Variable fest, stelle die Gleichung auf und löse sie. Schreibe den Antwortsatz mit Einheit.",
    },
    merke: rich(
      "Zuerst legt man die Variable fest, z. B. ", { b: "x: gesuchte Zahl" },
      ". Dann stellt man die Gleichung auf, löst sie und schreibt einen Antwortsatz: ",
      { b: "3x + 7 = 2 · (x + 4)" }, " ergibt x = 1."
    ),
    cols: 1,
    generate: (rng, level) => genText(rng, level),
    verify(t) {
      const x = t._x;
      if (!x.isInt() || x.sign() <= 0) return "Lösung nicht ganzzahlig und positiv";
      if (!t._L.a.mul(x).add(t._L.c).eq(t._R.a.mul(x).add(t._R.c))) return "Probe stimmt nicht";
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
