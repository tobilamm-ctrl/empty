// M9 LB 7: Gleichungen – Gleichungen mit Brüchen und Klammern, Bruchgleichungen, lineare Gleichungssysteme,
// reinquadratische Gleichungen, Formeln umstellen, Textaufgaben zu Mischungen.
(function (AG) {
  const { Frac, num, rich, MINUS, plain } = AG;

  const S = n => String(n);
  const sum = arr => arr.reduce((s, v) => s + v, 0);
  const zugOf = ctx => (ctx && ctx.zug === "R" ? "R" : "M");
  const lcmOf = (a, b) => Math.abs(a * b) / AG.gcd(a, b);

  // ---------- Darstellung (aus m8-gleichungen.js übernommen) ----------

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
  function sideAC(s, vr = "x") {
    const items = [];
    if (s.a.sign() !== 0) items.push({ sg: s.a.sign(), body: coefRich(s.a, vr) });
    if (s.c.sign() !== 0) items.push({ sg: s.c.sign(), body: numRich(s.c.abs()) });
    return items.length ? joinItems(items) : ["0"];
  }
  const eqAC = (L, R, vr = "x") => rich(sideAC(L, vr), " = ", sideAC(R, vr));

  // Division bzw. Multiplikation mit dem Kehrwert, wenn der Koeffizient ein Bruch ist
  function divOp(A) {
    if (A.isInt()) return rich(":", A.sign() < 0 ? rich("(", num(A), ")") : num(A));
    const I = A.inv();
    return rich("· ", I.sign() < 0 ? rich("(", num(I, { as: "improper" }), ")") : num(I, { as: "improper" }));
  }

  // Lösungsweg mit Äquivalenzumformungen aus zwei {a, c}-Seiten (ganzzahlige Koeffizienten bevorzugt).
  // Jede Zeile: Zustand vor der Umformung (st), Umformung (op), Art (kind). Ergebnis: {lines, final} oder null.
  function chainLines(L0, R0, vr = "x") {
    const st = { L: { a: L0.a, c: L0.c }, R: { a: R0.a, c: R0.c } };
    const snap = () => ({ L: { a: st.L.a, c: st.L.c }, R: { a: st.R.a, c: st.R.c } });
    const lines = [];
    if (st.R.a.sign() !== 0) {
      const B = st.R.a;
      lines.push({ st: snap(), op: rich(B.sign() > 0 ? MINUS : "+", coefRich(B, vr)), kind: "var" });
      const newA = st.L.a.sub(B);
      if (newA.sign() === 0) return null;
      st.L.a = newA;
      st.R.a = new Frac(0);
    }
    if (st.L.c.sign() !== 0) {
      const C = st.L.c;
      lines.push({ st: snap(), op: rich(C.sign() > 0 ? MINUS : "+", numRich(C.abs())), kind: "move" });
      st.L.c = new Frac(0);
      st.R.c = st.R.c.sub(C);
    }
    if (!st.L.a.eq(1)) {
      const A = st.L.a;
      lines.push({ st: snap(), op: divOp(A), kind: "div", A });
      st.L.a = new Frac(1);
      st.R.c = st.R.c.div(A);
    }
    return { lines, final: st.R.c };
  }

  // ---------- 1. Gleichungen mit Brüchen und Klammern ----------

  const DENOMS = [2, 3, 4, 5, 6];

  function genBrueche(rng, level, zug) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const numer = () => sg() * rng.int(1, 5);
    for (let i = 0; i < 3000; i++) {
      // Lösung: ganz; im M-Zug auch ein einfacher Bruch
      let x0;
      if (zug === "R" || rng.chance(0.6)) x0 = new Frac(sg() * rng.int(1, 12));
      else x0 = new Frac(sg() * rng.int(1, 5), rng.pick([2, 3, 4]));
      if (x0.sign() === 0) continue;
      const A1 = new Frac(numer(), rng.pick(DENOMS));   // Koeffizient von x links
      const A2 = new Frac(numer(), rng.pick(DENOMS));   // Koeffizient von x rechts
      const b = sg() * rng.int(1, 9);
      const brk = () => ({ t: "br", k: sg() * rng.int(2, 4), ax: 1, c: sg() * rng.int(1, 6) });
      let L, R;
      if (level === 1) {
        L = [{ t: "ax", a: A1 }, { t: "c", c: new Frac(b) }];
        R = [{ t: "ax", a: A2 }, { t: "c", c: null }];
      } else if (level === 2) {
        L = [brk(), { t: "ax", a: A1 }];
        R = [{ t: "ax", a: A2 }, { t: "c", c: null }];
      } else {
        L = [brk(), { t: "ax", a: A1 }];
        R = [{ t: "ax", a: A2 }, { t: "c", c: new Frac(b) }, { t: "c", c: null }];
      }
      const lL = lin(L), lR = lin(R.filter(p => p.c !== null));
      const diff = lL.a.sub(lR.a);
      if (diff.sign() === 0) continue;
      // freie Konstante so wählen, dass x0 Lösung ist
      const f = diff.mul(x0).add(lL.c).sub(lR.c);
      if (!f.isInt() || f.sign() === 0 || f.abs().cmp(new Frac(40)) > 0) continue;
      R.find(p => p.c === null).c = f;
      if (rng.chance(0.3)) [L, R] = [R, L];

      // Hauptnenner: kgV aller Nenner (Brüche sind nur Koeffizienten von x)
      const M = [...L, ...R].reduce((m, p) => (p.t === "ax" ? lcmOf(m, p.a.d) : m), 1);
      if (M === 1) continue;
      const lL2 = lin(L), lR2 = lin(R);
      const L2 = { a: lL2.a.mul(M), c: lL2.c.mul(M) };
      const R2 = { a: lR2.a.mul(M), c: lR2.c.mul(M) };
      const ch = chainLines(L2, R2);
      if (!ch || !ch.final.eq(x0)) continue;

      const hasBr = [...L, ...R].some(p => p.t === "br");
      const steps = [];
      if (hasBr) steps.push(rich(sideDisplay(expandParts(L)), " = ", sideDisplay(expandParts(R))));
      steps.push(rich(eqAC(lL2, lR2), "   | · ", S(M)));
      for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
      steps.push(rich("x = ", numRich(x0)));
      return {
        q: rich(sideDisplay(L), " = ", sideDisplay(R)),
        a: rich("x = ", numRich(x0)),
        steps,
        _L: L, _R: R, _x: x0, _zug: zug, _M: M,
      };
    }
    throw new Error("m9-gleichung-brueche: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m9-gleichung-brueche",
    klasse: "9",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Gleichungen mit Brüchen und Klammern",
    instruction: {
      1: "Multipliziere jede Gleichung mit dem Hauptnenner, damit keine Brüche mehr stehen. Löse dann nach x auf.",
      2: "Löse die Klammer auf, multipliziere mit dem Hauptnenner und löse nach x auf. Schreibe die Lösung als x = …",
      3: "Löse alle Klammern auf, multipliziere mit dem Hauptnenner und fasse zusammen. Löse dann nach x auf.",
    },
    merke: rich(
      "Bei Brüchen mit x multipliziert man beide Seiten mit dem Hauptnenner: ",
      { b: "x/3 + 2 = x/4 + 3  | · 12" }, " ergibt ", { b: "4x + 24 = 3x + 36" }, "."
    ),
    cols: 2,
    generate: (rng, level, ctx) => genBrueche(rng, level, zugOf(ctx)),
    verify(t) {
      const L = lin(t._L), R = lin(t._R);
      const coef = L.a.sub(R.a);
      if (coef.sign() === 0) return "keine eindeutige Lösung";
      const sol = R.c.sub(L.c).div(coef);
      if (!sol.eq(t._x)) return "Lösung falsch: " + sol + " statt " + t._x;
      if (!L.a.mul(t._x).add(L.c).eq(R.a.mul(t._x).add(R.c))) return "Probe stimmt nicht";
      if (t._zug === "R") {
        if (!t._x.isInt()) return "Regelklasse: Lösung nicht ganz";
      }
      if (!t.steps[t.steps.length - 1] || plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

  // ---------- 2. Bruchgleichungen ----------
  // Brüche mit Termen werden als Bruch-Segment mit Text in Zähler und Nenner gesetzt (waagerechter Bruchstrich).

  const sgnTxt = n => (n < 0 ? MINUS + S(-n) : S(n));
  const denTxt = e => (e > 0 ? "(x " + MINUS + " " + S(e) + ")" : "(x + " + S(-e) + ")");
  const nxTxt = b => (b === 0 ? "x" : b > 0 ? "(x + " + S(b) + ")" : "(x " + MINUS + " " + S(-b) + ")");
  const facTxt = (m, t) => (m === 1 ? t : S(m) + " · " + t);
  const noPar = t => t.replace(/^\((.*)\)$/, "$1");
  const fr = (z, n, neg) => (neg ? { f: [z, n], s: -1 } : { f: [z, n] });   // Bruch mit Termen

  function genBruchM(rng, level) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const hi = level === 1 ? 5 : level === 2 ? 8 : 12;
    for (let i = 0; i < 2000; i++) {
      const p = sg() * rng.int(1, hi), q = sg() * rng.int(1, hi), e = sg() * rng.int(1, 8);
      if (p === q) continue;
      // p : x = q : (x − e)  ->  p(x − e) = q·x  ->  x = p·e / (p − q)
      const x0 = new Frac(p * e, p - q);
      if (!x0.isInt() || x0.sign() === 0 || x0.eq(e)) continue;
      const L0 = { a: new Frac(p), c: new Frac(-p * e) }, R0 = { a: new Frac(q), c: new Frac(0) };
      const ch = chainLines(L0, R0);
      if (!ch || !ch.final.eq(x0)) continue;
      const eq0 = rich(fr(S(Math.abs(p)), "x", p < 0), " = ", fr(S(Math.abs(q)), noPar(denTxt(e)), q < 0));
      const px = Frac.of(p).div(x0), rx = Frac.of(q).div(x0.sub(e));
      if (!px.eq(rx)) continue;
      const steps = [
        rich("𝔻 = ℚ \\ {0; ", sgnTxt(e), "}"),
        rich(eq0, "   | · x · ", denTxt(e)),
        rich(sgnTxt(p), " · ", denTxt(e), " = ", sgnTxt(q), " · x"),
      ];
      for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
      steps.push(rich("x = ", sgnTxt(x0.n)));
      steps.push(rich("Probe: links ", num(px), ", rechts ", num(rx), ". Die Gleichung stimmt, x liegt in 𝔻."));
      const ans = rich("𝔻 = ℚ \\ {0; ", sgnTxt(e), "}; L = {", sgnTxt(x0.n), "}");
      steps.push(ans);
      return {
        q: rich("Gegeben ist die Gleichung ", eq0, ". Bestimme 𝔻 und L."),
        a: ans, steps, _p: p, _q: q, _e: e, _x: x0, _zug: "M",
      };
    }
    throw new Error("m9-bruchgleichung: keine Aufgabe gefunden (M)");
  }

  // Variable nur im Zähler (R): (x + b1) : d1 = (x + b2) : d2, mit ganzzahliger Lösung
  function genBruchR(rng, level) {
    const sg = () => (rng.chance(0.5) ? -1 : 1);
    const dens = [2, 3, 4, 5, 6];
    const kHi = level === 1 ? 6 : level === 2 ? 9 : 12;
    for (let i = 0; i < 2000; i++) {
      const d1 = rng.pick(dens), d2 = rng.pick(dens);
      if (d1 === d2) continue;
      const k = sg() * rng.int(1, kHi);
      const x0 = new Frac(sg() * rng.int(1, 12));
      const b1 = d1 * k - x0.n, b2 = d2 * k - x0.n;
      if (Math.abs(b1) > 25 || Math.abs(b2) > 25 || b1 === b2) continue;
      const Lc = lcmOf(d1, d2);
      const m1 = Lc / d1, m2 = Lc / d2;
      const L0 = { a: new Frac(m1), c: new Frac(m1 * b1) }, R0 = { a: new Frac(m2), c: new Frac(m2 * b2) };
      const ch = chainLines(L0, R0);
      if (!ch || !ch.final.eq(x0)) continue;
      const eq0 = rich(fr(noPar(nxTxt(b1)), S(d1)), " = ", fr(noPar(nxTxt(b2)), S(d2)));
      const steps = [
        rich(eq0, "   | · ", S(Lc)),
        rich(facTxt(m1, nxTxt(b1)), " = ", facTxt(m2, nxTxt(b2))),
      ];
      for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R), "   | ", l.op));
      steps.push(rich("x = ", sgnTxt(x0.n)));
      const ans = rich("L = {", sgnTxt(x0.n), "}");
      steps.push(ans);
      return {
        q: rich("Gegeben ist die Gleichung ", eq0, ". Bestimme L."),
        a: ans, steps, _d1: d1, _d2: d2, _b1: b1, _b2: b2, _x: x0, _zug: "R",
      };
    }
    throw new Error("m9-bruchgleichung: keine Aufgabe gefunden (R)");
  }

  AG.registerType({
    id: "m9-bruchgleichung",
    klasse: "9",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Bruchgleichungen",
    instruction: {
      1: "Bestimme die Lösungsmenge L. Steht x im Nenner, gib zuerst 𝔻 an. Prüfe die Lösung durch Einsetzen.",
      2: "Bestimme die Lösungsmenge L. Steht x im Nenner, gib zuerst 𝔻 an, multipliziere mit dem Hauptnenner und prüfe die Lösung.",
      3: "Bestimme 𝔻 und L. Multipliziere mit dem Hauptnenner, löse die Gleichung und prüfe die Lösung.",
    },
    merke: rich(
      "Steht x im Nenner, darf der Nenner nicht 0 werden: ", { b: "𝔻 = ℚ \\ {0}" },
      ". Beide Seiten werden mit dem Hauptnenner multipliziert. Die Lösung muss in 𝔻 liegen."
    ),
    cols: 2,
    generate: (rng, level, ctx) => (zugOf(ctx) === "R" ? genBruchR(rng, level) : genBruchM(rng, level)),
    verify(t) {
      if (t._zug === "M") {
        const x0 = t._x, p = Frac.of(t._p), q = Frac.of(t._q), e = t._e;
        if (x0.sign() === 0 || x0.eq(e)) return "Lösung nicht in D";
        if (!p.mul(x0.sub(e)).eq(q.mul(x0))) return "Probe stimmt nicht";
      } else {
        const x0 = t._x;
        if (!x0.add(t._b1).div(t._d1).eq(x0.add(t._b2).div(t._d2))) return "Probe stimmt nicht";
        if (t._d1 === t._d2) return "keine eindeutige Lösung";
      }
      if (plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

  // ---------- 3. Lineare Gleichungssysteme ----------
  // Form: a·x + b·y = c. Verfahren: „ein“ (Einsetzen, Gleichung nach x), „gleich“ (Gleichsetzen), „add“ (Addition).

  const coefTxt = k => (k === 1 ? "" : S(k));
  const termXY = (k, v) => (k === 1 ? v : k === -1 ? MINUS + v : (k < 0 ? MINUS : "") + S(Math.abs(k)) + v);
  function eqSys(a, b, c) {
    let s = "";
    if (a !== 0) s += termXY(a, "x");
    if (b !== 0) s += (s === "" ? termXY(b, "y") : (b < 0 ? " " + MINUS + " " : " + ") + termXY(Math.abs(b), "y"));
    if (s === "") s = "0";
    return s + " = " + sgnTxt(c);
  }
  // rechte Seite von x = c − b·y als Text
  const rhsTxt = (c, b) => sgnTxt(c) + (b > 0 ? " " + MINUS + " " + coefTxt(b) + "y" : " + " + coefTxt(-b) + "y");
  const nz = (rng, hi) => (rng.chance(0.5) ? -1 : 1) * rng.int(1, hi);

  // a·x + b·y = c mit x = x-Wert eingesetzt: Schritte bis x; Rückgabe {lines, x0} oder null
  function substX(a, b, c, y0) {
    const lines = [];
    const sub = (b < 0 ? S(-b) : S(b)) + " · (" + sgnTxt(y0) + ")";
    lines.push(rich(termXY(a, "x"), b < 0 ? " " + MINUS + " " : " + ", sub, " = ", sgnTxt(c)));
    const ch = chainLines({ a: new Frac(a), c: new Frac(b * y0) }, { a: new Frac(0), c: new Frac(c) }, "x");
    if (!ch) return null;
    for (const l of ch.lines) lines.push(rich(eqAC(l.st.L, l.st.R, "x"), "   | ", l.op));
    return { lines, x0: ch.final };
  }

  // Lösungsweg zu einem Gleichungssystem [[a,b,c],[d,e,f]]. Gibt {q, a, steps} oder null zurück.
  // meta: {eqs, q, intro?, sach?}
  function buildSys(meta, method, x0, y0) {
    const [[a, b, c], [d, e, f]] = meta.eqs;
    const steps = [];
    if (meta.intro) steps.push(meta.intro);
    if (method === "add") {
      const s = d === a ? 1 : -1;
      const k = s === 1 ? b - e : b + e, m = s === 1 ? c - f : c + f;
      steps.push(rich(s === 1 ? "I − II:  " : "I + II:  ", eqSys(0, k, m)));
      steps.push(rich("y = ", sgnTxt(y0)));
    } else {
      let chainL, chainR;
      if (method === "ein") {       // I: x = c − b·y, in II einsetzen
        const rhsI = rhsTxt(c, b);
        steps.push(rich("I nach x:  x = ", rhsI));
        steps.push(rich("in II einsetzen:  ", sgnTxt(d), " · (", rhsI, ")", e < 0 ? " " + MINUS + " " : " + ", coefTxt(Math.abs(e)), "y = ", sgnTxt(f)));
        chainL = { a: new Frac(e - d * b), c: new Frac(d * c) };
        chainR = { a: new Frac(0), c: new Frac(f) };
      } else {                       // „gleich“: beide nach x auflösen, gleichsetzen
        steps.push(rich("I nach x:  x = ", rhsTxt(c, b)));
        steps.push(rich("II nach x:  x = ", rhsTxt(f, e)));
        chainL = { a: new Frac(-b), c: new Frac(c) };
        chainR = { a: new Frac(-e), c: new Frac(f) };
      }
      const ch = chainLines(chainL, chainR, "y");
      if (!ch || !ch.final.eq(y0)) return null;
      for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R, "y"), "   | ", l.op));
      steps.push(rich("y = ", sgnTxt(y0)));
    }
    const sx = substX(a, b, c, y0);
    if (!sx || !sx.x0.eq(x0)) return null;
    steps.push(...sx.lines, rich("x = ", sgnTxt(x0)));
    const ans = meta.sach
      ? rich("Der Eintritt kostet ", S(x0), " € für einen Erwachsenen und ", S(y0), " € für ein Kind.")
      : rich("L = {(", sgnTxt(x0), " | ", sgnTxt(y0), ")}");
    steps.push(ans);
    return { q: meta.q, a: ans, steps };
  }

  function genSystem(rng, level) {
    for (let i = 0; i < 2000; i++) {
      const x0 = nz(rng, 9), y0 = nz(rng, 9);
      const method = level === 1 ? rng.pick(["ein", "add"]) : rng.pick(["gleich", "add"]);
      let eqs;
      if (method === "ein") {
        const B = nz(rng, 6), D = nz(rng, 5), E = nz(rng, 6);
        if (E - D * B === 0) continue;
        eqs = [[1, B, x0 + B * y0], [D, E, D * x0 + E * y0]];
      } else if (method === "gleich") {
        const B = nz(rng, 6), E = nz(rng, 6);
        if (B === E) continue;
        eqs = [[1, B, x0 + B * y0], [1, E, x0 + E * y0]];
      } else {
        const a = nz(rng, 5), s = rng.chance(0.5) ? 1 : -1, b = nz(rng, 6), e = nz(rng, 6);
        if (Math.abs(a) < 2 || (s === 1 ? b === e : b + e === 0)) continue;
        eqs = [[a, b, a * x0 + b * y0], [s * a, e, s * a * x0 + e * y0]];
      }
      if (eqs.flat().some(v => Math.abs(v) > 60)) continue;
      const q = rich("Löse das Gleichungssystem.", { br: true }, "I:  ", eqSys(...eqs[0]), { br: true }, "II:  ", eqSys(...eqs[1]), { br: true }, "Gib die Lösung als (x | y) an.");
      const t = buildSys({ eqs, q }, method, new Frac(x0), new Frac(y0));
      if (!t) continue;
      return { q: t.q, a: t.a, steps: t.steps, _eqs: eqs, _x: x0, _y: y0 };
    }
    throw new Error("m9-gleichungssystem: keine Aufgabe gefunden");
  }

  // Sachaufgabe: Eintrittspreise (gleiche Anzahl Erwachsener in beiden Familien -> Subtraktion)
  function genSystemSach(rng) {
    for (let i = 0; i < 2000; i++) {
      const a = rng.pick([2, 3]), x0 = rng.int(7, 14), y0 = rng.int(3, 8);
      if (y0 + 3 > x0) continue;
      const b = rng.int(2, 5), e = rng.int(1, b - 1);
      const c = a * x0 + b * y0, f = a * x0 + e * y0;
      const eqs = [[a, b, c], [a, e, f]];
      const sysQ = rich(
        "Der Eintritt im Freibad kostet für ", S(a), " Erwachsene und ", S(b), " Kinder insgesamt ", S(c), " €. ",
        "Für ", S(a), " Erwachsene und ", S(e), e === 1 ? " Kind" : " Kinder", " zahlt man ", S(f), " €. ",
        "Wie viel kostet der Eintritt für einen Erwachsenen und für ein Kind?"
      );
      const intro = rich("Variablen: x = Eintritt Erwachsener in €, y = Eintritt Kind in €");
      const t = buildSys({ eqs, sach: true, intro, q: sysQ }, "add", new Frac(x0), new Frac(y0));
      if (!t) continue;
      return { q: t.q, a: t.a, steps: t.steps, _eqs: eqs, _x: x0, _y: y0 };
    }
    throw new Error("m9-gleichungssystem: keine Sachaufgabe gefunden");
  }

  AG.registerType({
    id: "m9-gleichungssystem",
    klasse: "9",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Lineare Gleichungssysteme",
    instruction: {
      1: "Löse das Gleichungssystem mit dem Einsetzungs- oder Additionsverfahren. Gib die Lösung als (x | y) an.",
      2: "Löse das Gleichungssystem mit dem Gleichsetzungs- oder Additionsverfahren. Gib die Lösung als (x | y) an.",
      3: "Lege x und y fest, stelle das Gleichungssystem auf und löse es. Schreibe einen Antwortsatz.",
    },
    merke: rich(
      "Beim Additionsverfahren fällt eine Variable weg, wenn man die Gleichungen mit gleichem x-Koeffizienten subtrahiert: ",
      { b: "3x + 2y = 16 und 3x + y = 10: I − II ergibt y = 6" }, "."
    ),
    cols: 2,
    generate: (rng, level, ctx) => (level === 3 ? genSystemSach(rng) : genSystem(rng, level)),
    verify(t) {
      const [[a, b, c], [d, e, f]] = t._eqs;
      const x = t._x, y = t._y;
      if (a * x + b * y !== c || d * x + e * y !== f) return "Probe stimmt nicht";
      if (plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

  // ---------- 4. Reinquadratische Gleichungen ----------
  // Form: a·x² + d = c. Lösungen ±√q mit q = (c − d)/a. Ist q < 0, gibt es keine Lösung.

  const opD = d => (d > 0 ? MINUS + " " + S(d) : "+ " + S(-d));
  const eqQ = (a, d, c) => rich(
    a === 1 ? "x²" : S(a) + "x²",
    d === 0 ? "" : (d > 0 ? " + " + S(d) : " " + MINUS + " " + S(-d)),
    " = ", sgnTxt(c)
  );

  function genReinquadratisch(rng, level) {
    for (let i = 0; i < 2000; i++) {
      const none = level > 1 && rng.chance(0.2);
      const a = level === 1 ? rng.pick([1, 1, 2, 3, 4, 5]) : rng.int(1, 6);
      const k = level === 1 ? rng.int(1, 12) : level === 2 ? rng.int(2, 10) : rng.int(3, 12);
      const q = none ? -(k < 7 ? k : 6) * (k < 7 ? k : 6) : k * k;
      let d;
      if (level === 1) d = 0;
      else if (level === 2) d = rng.chance(0.5) ? -a * q : 0;   // z. B. 3x² − 12 = 0
      else d = nz(rng, 20);
      const c = a * q + d;
      if (Math.abs(c) > 200 || c === 0 && d === 0 && !none) continue;
      const kk = none ? Math.abs(q) : k;   // Betrag für die Anzeige
      const steps = [];
      if (d !== 0) steps.push(rich(eqQ(a, d, c), "   | ", opD(d)));
      const rhs = c - d;
      if (a !== 1) steps.push(rich(eqQ(a, 0, rhs), "   | : ", S(a)));
      steps.push(rich("x² = ", sgnTxt(q)));
      let ans;
      if (none) {
        steps.push(rich("Ein Quadrat ist nie negativ, daher gibt es keine Lösung."));
        ans = rich("keine Lösung");
      } else {
        steps.push(rich("x₁ = √", S(q), " = ", S(kk)));
        steps.push(rich("x₂ = ", MINUS, "√", S(q), " = ", sgnTxt(-kk)));
        ans = rich("x₁ = ", S(kk), ", x₂ = ", sgnTxt(-kk));
      }
      steps.push(ans);
      return {
        q: rich("Löse die Gleichung ", eqQ(a, d, c), "."),
        a: ans, steps, _a: a, _d: d, _c: c, _q: q, _none: none,
      };
    }
    throw new Error("m9-reinquadratisch: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m9-reinquadratisch",
    klasse: "9",
    zug: "M",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Reinquadratische Gleichungen",
    instruction: {
      1: "Löse die Gleichung nach x. Die Lösungen sind x₁ und x₂. Ist keine Lösung möglich, schreibe „keine Lösung“.",
      2: "Stelle die Gleichung nach x² um und ziehe die Wurzel. Achte auf die beiden Lösungen x₁ und x₂.",
      3: "Forme zuerst nach x² um, dann ziehe die Wurzel. Gib beide Lösungen an oder schreibe „keine Lösung“, wenn es keine gibt.",
    },
    merke: rich(
      "Aus x² = q folgt x = ±√q, also zwei Lösungen. Für q < 0 gibt es keine Lösung: ",
      { b: "x² = 49" }, " ergibt ", { b: "x₁ = 7" }, " und ", { b: "x₂ = −7" }, "."
    ),
    cols: 3,
    generate: (rng, level) => genReinquadratisch(rng, level),
    verify(t) {
      if (t._none) {
        if (t._q >= 0) return "keine Lösung obwohl q ≥ 0";
      } else {
        const k = Math.sqrt(t._q);
        if (!Number.isInteger(k) || t._a * k * k + t._d !== t._c) return "Probe stimmt nicht";
      }
      if (plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

  // ---------- 5. Formeln umstellen und Werte einsetzen ----------
  // fwd: Größe aus den anderen berechnen (Einsetzen). invs: Formel nach t umstellen
  // (chain = Umformungen mit Operation, fin = Ergebnis der Umstellung, expr = Ergebnis mit Zahlen einsetzbar).
  // ctx: Sachkontext-Einleitungen (abwechselnd, damit die Aufgaben nicht gleich klingen).

  const FORMELN = [
    { eq: "A = a · b", units: { A: "cm²", a: "cm", b: "cm" }, range: { A: [6, 150], a: [2, 12], b: [3, 15] },
      ctx: ["Ein Rechteck hat den Flächeninhalt A = a · b.", "Der Flächeninhalt eines Rechtecks mit Länge a und Breite b ist A.", "Für ein Rechteck gilt die Formel A = a · b."],
      fwd: { t: "A", expr: "{a} · {b}", f: v => v.a.mul(v.b) },
      invs: [
        { t: "b", chain: ["A = a · b   | : a"], fin: "b = A : a", expr: "{A} : {a}", f: v => v.A.div(v.a) },
        { t: "a", chain: ["A = a · b   | : b"], fin: "a = A : b", expr: "{A} : {b}", f: v => v.A.div(v.b) },
      ] },
    { eq: "u = 2a + 2b", units: { u: "cm", a: "cm", b: "cm" }, range: { u: [10, 60], a: [2, 15], b: [1, 10] },
      ctx: ["Der Umfang eines Rechtecks ist u = 2a + 2b.", "Für den Umfang u eines Rechtecks mit den Seiten a und b gilt u = 2a + 2b.", "Ein Rechteck hat den Umfang u = 2a + 2b."],
      fwd: { t: "u", expr: "2 · {a} + 2 · {b}", f: v => v.a.mul(2).add(v.b.mul(2)) },
      invs: [
        { t: "a", chain: ["u = 2a + 2b   | " + MINUS + " 2b", "u " + MINUS + " 2b = 2a   | : 2"], fin: "a = u : 2 " + MINUS + " b", expr: "{u} : 2 " + MINUS + " {b}", f: v => v.u.div(2).sub(v.b) },
        { t: "b", chain: ["u = 2a + 2b   | " + MINUS + " 2a", "u " + MINUS + " 2a = 2b   | : 2"], fin: "b = u : 2 " + MINUS + " a", expr: "{u} : 2 " + MINUS + " {a}", f: v => v.u.div(2).sub(v.a) },
      ] },
    { eq: "u = 4a", units: { u: "cm", a: "cm" }, range: { u: [12, 80], a: [3, 20] },
      ctx: ["Der Umfang eines Quadrats mit der Seitenlänge a ist u = 4a.", "Für ein Quadrat gilt u = 4a.", "Ein Quadrat hat den Umfang u = 4a."],
      fwd: { t: "u", expr: "4 · {a}", f: v => v.a.mul(4) },
      invs: [
        { t: "a", chain: ["u = 4a   | : 4"], fin: "a = u : 4", expr: "{u} : 4", f: v => v.u.div(4) },
      ] },
    { eq: "u = a + b + c", units: { u: "cm", a: "cm", b: "cm", c: "cm" }, range: { u: [10, 90], a: [2, 30], b: [2, 30], c: [2, 30] },
      ctx: ["Der Umfang eines Dreiecks mit den Seiten a, b und c ist u = a + b + c.", "Für den Umfang u eines Dreiecks gilt u = a + b + c.", "Ein Dreieck hat die Seiten a, b und c. Sein Umfang ist u = a + b + c."],
      fwd: { t: "u", expr: "{a} + {b} + {c}", f: v => v.a.add(v.b).add(v.c) },
      invs: [
        { t: "c", chain: ["u = a + b + c   | " + MINUS + " a", "u " + MINUS + " a = b + c   | " + MINUS + " b"], fin: "c = u " + MINUS + " a " + MINUS + " b", expr: "{u} " + MINUS + " {a} " + MINUS + " {b}", f: v => v.u.sub(v.a).sub(v.b) },
      ] },
    { eq: "V = a · b · c", units: { V: "cm³", a: "cm", b: "cm", c: "cm" }, range: { V: [24, 600], a: [2, 10], b: [2, 10], c: [2, 10] },
      ctx: ["Das Volumen eines Quaders mit den Kanten a, b und c ist V = a · b · c.", "Für das Volumen V eines Quaders gilt V = a · b · c.", "Ein Quader hat das Volumen V = a · b · c."],
      fwd: { t: "V", expr: "{a} · {b} · {c}", f: v => v.a.mul(v.b).mul(v.c) },
      invs: [
        { t: "c", chain: ["V = a · b · c   | : (a · b)"], fin: "c = V : (a · b)", expr: "{V} : ({a} · {b})", f: v => v.V.div(v.a.mul(v.b)) },
      ] },
    { eq: "A = g · h : 2", units: { A: "cm²", g: "cm", h: "cm" }, range: { A: [6, 120], g: [2, 20], h: [2, 16] },
      ctx: ["Der Flächeninhalt eines Dreiecks mit der Grundseite g und der Höhe h ist A = g · h : 2.", "Für ein Dreieck gilt A = g · h : 2.", "Ein Dreieck hat die Fläche A = g · h : 2."],
      fwd: { t: "A", expr: "{g} · {h} : 2", f: v => v.g.mul(v.h).div(2) },
      invs: [
        { t: "h", chain: ["A = g · h : 2   | · 2", "2 · A = g · h   | : g"], fin: "h = 2 · A : g", expr: "2 · {A} : {g}", f: v => v.A.mul(2).div(v.g) },
      ] },
    { eq: "Z = K · p : 100", units: { Z: "€", K: "€", p: "%" }, range: { Z: [5, 500], K: [100, 2000], p: [1, 8] },
      ctx: ["Die Zinsen Z für ein Kapital K zum Zinssatz p (in %) berechnet man mit Z = K · p : 100.", "Für die Zinsen gilt Z = K · p : 100.", "Bei einem Zinssatz p % bekommt man die Zinsen Z = K · p : 100."],
      fwd: { t: "Z", expr: "{K} · {p} : 100", f: v => v.K.mul(v.p).div(100) },
      invs: [
        { t: "K", chain: ["Z = K · p : 100   | · 100", "100 · Z = K · p   | : p"], fin: "K = 100 · Z : p", expr: "100 · {Z} : {p}", f: v => v.Z.mul(100).div(v.p) },
        { t: "p", chain: ["Z = K · p : 100   | · 100", "100 · Z = K · p   | : K"], fin: "p = 100 · Z : K", expr: "100 · {Z} : {K}", f: v => v.Z.mul(100).div(v.K) },
      ] },
    { eq: "V = G · h", units: { V: "cm³", G: "cm²", h: "cm" }, range: { V: [10, 800], G: [6, 60], h: [2, 20] },
      ctx: ["Das Volumen eines Prismas mit der Grundfläche G und der Höhe h ist V = G · h.", "Für das Volumen V eines Prismas gilt V = G · h.", "Ein Prisma hat das Volumen V = G · h."],
      fwd: { t: "V", expr: "{G} · {h}", f: v => v.G.mul(v.h) },
      invs: [
        { t: "h", chain: ["V = G · h   | : G"], fin: "h = V : G", expr: "{V} : {G}", f: v => v.V.div(v.G) },
        { t: "G", chain: ["V = G · h   | : h"], fin: "G = V : h", expr: "{V} : {h}", f: v => v.V.div(v.h) },
      ] },
    { eq: "s = v · t", units: { s: "km", v: "km/h", t: "h" }, range: { s: [20, 500], v: [20, 90], t: [1, 6] },
      ctx: ["Die Strecke s, die man mit der Geschwindigkeit v in der Zeit t zurücklegt, ist s = v · t.", "Bei gleichförmiger Bewegung gilt s = v · t.", "Für eine Fahrt mit konstanter Geschwindigkeit gilt s = v · t."],
      fwd: { t: "s", expr: "{v} · {t}", f: v => v.v.mul(v.t) },
      invs: [
        { t: "t", chain: ["s = v · t   | : v"], fin: "t = s : v", expr: "{s} : {v}", f: v => v.s.div(v.v) },
        { t: "v", chain: ["s = v · t   | : t"], fin: "v = s : t", expr: "{s} : {t}", f: v => v.s.div(v.t) },
      ] },
    { eq: "P = n · p", units: { P: "€", n: "Stück", p: "€" }, range: { P: [10, 300], n: [2, 12], p: [2, 25] },
      ctx: ["Der Gesamtpreis P beim Kauf von n Stück zum Stückpreis p ist P = n · p.", "Für den Gesamtpreis gilt P = n · p.", "Beim Einkauf kostet die Menge n zum Preis p je Stück insgesamt P = n · p."],
      fwd: { t: "P", expr: "{n} · {p}", f: v => v.n.mul(v.p) },
      invs: [
        { t: "p", chain: ["P = n · p   | : n"], fin: "p = P : n", expr: "{P} : {n}", f: v => v.P.div(v.n) },
        { t: "n", chain: ["P = n · p   | : p"], fin: "n = P : p", expr: "{P} : {p}", f: v => v.P.div(v.p) },
      ] },
  ];

  // Größen mit Einheit als Dezimalzahl (17,25 cm statt 17 1/4 cm), wenn das endlich geht
  const finDec = f => { let d = Frac.of(f).d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
  const numTxt = (f, unit) => plain(unit && finDec(f) ? AG.num(f, { as: "dec" }) : numRich(f)) + (unit ? " " + unit : "");
  const fillTpl = (tpl, m) => tpl.replace(/\{(\w)\}/g, (_, k) => m[k]);
  const givenTxt = (F, v) => Object.keys(v).map(k => k + " = " + numTxt(v[k], F.units[k])).join(" und ");

  function genFormel(rng, level) {
    const sample = (F, skip) => {
      const v = {};
      for (const [k, [lo, hi]] of Object.entries(F.range)) if (k !== skip) v[k] = new Frac(rng.int(lo, hi));
      return v;
    };
    const nice = f => f.sign() > 0 && f.isTerminating() && f.decimals() <= 2 && f.abs().cmp(new Frac(2000)) <= 0;
    for (let i = 0; i < 2000; i++) {
      const F = rng.pick(FORMELN);
      const intro = rng.pick(F.ctx);
      if (level === 1) {                              // einsetzen
        const t = F.fwd.t;
        const v = sample(F, t);
        const res = F.fwd.f(v);
        if (!nice(res)) continue;
        const m = {};
        for (const k of Object.keys(v)) m[k] = numTxt(v[k], F.units[k]);
        const resTxt = t + " = " + numTxt(res, F.units[t]);
        return {
          q: rich(intro, " Berechne ", t, " für ", givenTxt(F, v), "."),
          a: rich(resTxt),
          steps: [rich(t + " = " + fillTpl(F.fwd.expr, m)), rich(resTxt)],
          _F: F, _v: v, _res: res, _mode: "fwd",
        };
      }
      const I = rng.pick(F.invs);
      const t = I.t;
      if (level === 2) {                              // umstellen
        return {
          q: rich(intro, " Stelle die Formel ", F.eq, " nach ", t, " um."),
          a: rich(I.fin),
          steps: [...I.chain, I.fin].map(s => rich(s)),
          _F: F, _I: I, _mode: "sym",
        };
      }
      // Niveau 3: umstellen und einsetzen
      const v = sample(F, t);
      const res = I.f(v);
      if (!nice(res)) continue;
      const m = {};
      for (const k of Object.keys(v)) m[k] = numTxt(v[k], F.units[k]);
      const resTxt = t + " = " + numTxt(res, F.units[t]);
      const lines = [...I.chain, I.fin, t + " = " + fillTpl(I.expr, m), resTxt];
      return {
        q: rich(intro, " Stelle die Formel ", F.eq, " nach ", t, " um und berechne ", t, " für ", givenTxt(F, v), "."),
        a: rich(resTxt),
        steps: lines.map(s => rich(s)),
        _F: F, _I: I, _v: v, _res: res, _mode: "inv",
      };
    }
    throw new Error("m9-formeln-umstellen: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m9-formeln-umstellen",
    klasse: "9",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Formeln umstellen und einsetzen",
    instruction: {
      1: "Setze die gegebenen Werte in die Formel ein und berechne die gesuchte Größe. Schreibe die Einheit dazu.",
      2: "Stelle die Formel nach der gesuchten Größe um. Forme Schritt für Schritt um, bis die gesuchte Größe allein steht.",
      3: "Stelle die Formel zuerst nach der gesuchten Größe um. Setze dann die Werte ein und berechne mit Einheit.",
    },
    merke: rich(
      "Eine Formel stellt man um wie eine Gleichung: Man macht auf beiden Seiten dieselbe Umkehrung. ",
      { b: "A = a · b  | : a" }, " ergibt ", { b: "b = A : a" }, "."
    ),
    cols: 2,
    generate: (rng, level) => genFormel(rng, level),
    verify(t) {
      if (t._mode === "fwd" && !t._F.fwd.f(t._v).eq(t._res)) return "Einsetzen falsch";
      if (t._mode === "inv" && !t._I.f(t._v).eq(t._res)) return "Umstellen falsch";
      if (plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

  // ---------- 6. Textaufgaben: Mischungen und Zahlenrätsel ----------
  // Gemeinsamer Abschluss: Variable, Gleichung, Umformungen, Lösung, Antwortsatz (letzte Zeile)
  function finish(vardef, q, eqText, L, R, x0, answer, vr) {
    const ch = chainLines(L, R, vr);
    if (!ch || !ch.final.eq(x0)) return null;
    const steps = [rich(vardef), rich(eqText)];
    for (const l of ch.lines) steps.push(rich(eqAC(l.st.L, l.st.R, vr), "   | ", l.op));
    steps.push(rich(vr + " = ", numRich(x0)), answer);
    return { q, a: answer, steps, _L: L, _R: R, _x: x0, _vr: vr };
  }

  const dat = w => (/(kerne|nüsse)$/.test(w) ? w + "n" : w);   // Dativ Plural: mit Erdnüssen
  const SORTEN = [
    ["Cashewkerne", "Erdnüsse"], ["Walnusskerne", "Rosinen"], ["Mandeln", "Haselnusskerne"],
    ["Kaffee Arabica", "Kaffee Robusta"], ["Tee Darjeeling", "Schwarztee"],
  ];
  const PREIS_TEUER = [10, 12, 14, 15, 16, 18, 20, 24];
  const PREIS_BILLIG = [3, 4, 5, 6, 8, 9];

  // Zahlenrätsel mit einer Gleichung: m·x + c = R oder m·(x − c) = R
  function raetselAB(rng) {
    const m = rng.int(2, 9), c = rng.int(1, 20);
    if (rng.chance(0.5)) {
      const x0 = rng.int(2, 20), R = m * x0 + c;
      return finish("x: gesuchte Zahl",
        rich("Multipliziert man eine Zahl mit ", S(m), " und addiert ", S(c), ", erhält man ", S(R), ". Wie heißt die Zahl?"),
        S(m) + " · x + " + S(c) + " = " + S(R),
        { a: new Frac(m), c: new Frac(c) }, { a: new Frac(0), c: new Frac(R) }, new Frac(x0),
        rich("Die gesuchte Zahl ist ", S(x0), "."), "x");
    }
    const x0 = rng.int(c + 1, 25), R = m * (x0 - c);
    return finish("x: gesuchte Zahl",
      rich("Vermindert man eine Zahl um ", S(c), " und multipliziert das Ergebnis mit ", S(m), ", erhält man ", S(R), ". Wie heißt die Zahl?"),
      S(m) + " · (x " + MINUS + " " + S(c) + ") = " + S(R),
      { a: new Frac(m), c: new Frac(-m * c) }, { a: new Frac(0), c: new Frac(R) }, new Frac(x0),
      rich("Die gesuchte Zahl ist ", S(x0), "."), "x");
  }

  // Zahlenrätsel mit x auf beiden Seiten: m·x = k·x + c
  function raetselC(rng) {
    const m = rng.int(3, 9), k = rng.int(2, m - 1), x0 = rng.int(2, 20), c = (m - k) * x0;
    return finish("x: gesuchte Zahl",
      rich("Das ", S(m), "-Fache einer Zahl ist um ", S(c), " größer als das ", S(k), "-Fache derselben Zahl. Wie heißt die Zahl?"),
      S(m) + " · x = " + S(k) + " · x + " + S(c),
      { a: new Frac(m), c: new Frac(0) }, { a: new Frac(k), c: new Frac(c) }, new Frac(x0),
      rich("Die gesuchte Zahl ist ", S(x0), "."), "x");
  }

  // Mischung: gesucht ist die Menge der teureren Sorte
  function mischungX(rng) {
    for (let i = 0; i < 2000; i++) {
      const [teuer, billig] = rng.pick(SORTEN);
      const p1 = rng.pick(PREIS_TEUER), p2 = rng.pick(PREIS_BILLIG);
      if (p1 - p2 < 4) continue;
      const P = rng.int(p2 + 1, p1 - 1);
      const T = rng.pick([10, 20, 25, 30, 40, 50, 60, 80, 100]);
      const top = T * (P - p2);
      if (top % (p1 - p2) !== 0) continue;
      const x0 = top / (p1 - p2);
      if (x0 <= 0 || x0 >= T) continue;
      const r = finish("x: Menge von " + teuer + " in kg",
        rich("Man mischt ", teuer, " (", S(p1), " €/kg) mit ", dat(billig), " (", S(p2), " €/kg). Die Mischung soll ", S(T), " kg wiegen und ", S(P), " €/kg kosten. Wie viel kg ", teuer, " werden benötigt?"),
        S(p1) + " · x + " + S(p2) + " · (" + S(T) + " " + MINUS + " x) = " + S(P) + " · " + S(T),
        { a: new Frac(p1 - p2), c: new Frac(p2 * T) }, { a: new Frac(0), c: new Frac(P * T) }, new Frac(x0),
        rich("Man braucht ", S(x0), " kg ", teuer, " und ", S(T - x0), " kg ", billig, "."), "x");
      if (r) return r;
    }
    throw new Error("m9-text-mischung: keine Mischung gefunden");
  }

  // Mischung: gesucht ist der Preis der teureren Sorte
  function mischungP(rng) {
    for (let i = 0; i < 2000; i++) {
      const [teuer, billig] = rng.pick(SORTEN);
      const x = rng.int(2, 12), y = rng.int(2, 15), T = x + y;
      const p1 = rng.pick(PREIS_TEUER), p2 = rng.pick(PREIS_BILLIG);
      if (p1 - p2 < 4) continue;
      const tot = x * p1 + y * p2;
      if (tot % T !== 0) continue;
      const P = tot / T;
      const r = finish("p: Preis von " + teuer + " in €/kg",
        rich("Man mischt ", S(x), " kg ", teuer, " mit ", S(y), " kg ", dat(billig), " zu ", S(p2), " €/kg. Die Mischung kostet ", S(P), " €/kg. Wie viel kostet 1 kg ", teuer, "?"),
        S(x) + " · p + " + S(y) + " · " + S(p2) + " = " + S(T) + " · " + S(P),
        { a: new Frac(x), c: new Frac(y * p2) }, { a: new Frac(0), c: new Frac(T * P) }, new Frac(p1),
        rich("1 kg ", teuer, " kostet ", S(p1), " €."), "p");
      if (r) return r;
    }
    throw new Error("m9-text-mischung: keine Mischung mit ganzem Preis gefunden");
  }

  function genTextMischung(rng, level) {
    if (level === 1) return raetselAB(rng);
    if (level === 2) return rng.chance(0.5) ? raetselC(rng) : mischungX(rng);
    return mischungP(rng);
  }

  AG.registerType({
    id: "m9-text-mischung",
    klasse: "9",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen",
    topic: "terme",
    title: "Textaufgaben: Mischung und Zahlenrätsel",
    instruction: {
      1: "Lege die Variable fest, stelle die Gleichung auf und löse sie. Schreibe einen Antwortsatz.",
      2: "Lege die Variable fest, stelle die Gleichung auf und löse sie. Schreibe einen Antwortsatz mit Einheit.",
      3: "Lege die Variable fest, stelle die Gleichung auf und löse sie. Schreibe einen Antwortsatz mit Einheit.",
    },
    merke: rich(
      "Zuerst legt man die Variable fest, dann stellt man die Gleichung auf. Bei einer Mischung gilt: Preis der Teilmengen zusammen = Preis der Mischung. ",
      { b: "2 · x + 4 · (10 " + MINUS + " x) = 3 · 10" }, " ergibt x = 5."
    ),
    cols: 1,
    generate: (rng, level) => genTextMischung(rng, level),
    verify(t) {
      const lhs = t._L, rhs = t._R;   // bereits {a, c}
      if (!lhs.a.mul(t._x).add(lhs.c).eq(rhs.a.mul(t._x).add(rhs.c))) return "Probe stimmt nicht";
      if (plain(t.steps[t.steps.length - 1]) !== plain(t.a)) return "letzter Schritt ist nicht das Ergebnis";
      return true;
    },
  });

})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
