// M10 LB 7: Funktionen und Gleichungen (Klasse 10, M-Zug, Mittlerer Schulabschluss): Geradengleichung aus zwei Punkten,
// aus Punkt und Steigung (parallel, senkrecht), Parabeln in Scheitelform und Normalform (quadratische Ergänzung),
// Schnittpunkte Parabel–Gerade und Nullstellen (Lösungsformel). Taschenrechner erlaubt: Ergebnisse werden auf
// 2 Nachkommastellen gerundet und mit „≈“ gekennzeichnet.
// Typen: m10-gerade-zwei-punkte, m10-gerade-punkt-steigung, m10-parabel-scheitel, m10-parabel-schnittpunkte.
// Vorbild: m9-funktionen.js (Koordinatensystem, Geraden, Hilfsfunktionen kopiert).
(function (AG) {
  const { Frac, num, rich, plain, fmtInt, fmtDec, MINUS, SKETCH_COLORS } = AG;
  const { INK, GREY } = SKETCH_COLORS;

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const F = v => Frac.of(v);
  const sInt = n => fmtInt(n);                                                     // ganze Zahl mit „−“
  const sp = n => (n < 0 ? "(" + sInt(n) + ")" : sInt(n));                         // ganze Zahl, negativ in Klammern
  const sF = v => num(F(v));                                                       // ganze Zahl, Bruch oder gemischte Zahl (Standard von num())
  const fp = v => (F(v).isInt() && F(v).sign() >= 0 ? sInt(F(v).n) : ["(", sF(v), ")"]);   // Faktor: Brüche und negative Zahlen in Klammern
  const sgnT = v => (F(v).sign() < 0 ? [" " + MINUS + " ", sF(F(v).abs())] : [" + ", sF(v)]);   // „ + 3/2“ bzw. „ − 3/2“
  const tS = v => (F(v).sign() === 0 ? "" : sgnT(v));
  // Scheitelform mit Dezimalzahlen: (x + 2,5)² − 12,25
  const sD = v => (F(v).isInt() ? sInt(F(v).n) : fmtDec(F(v)));
  const tD = v => (F(v).sign() === 0 ? "" : F(v).sign() < 0 ? [" " + MINUS + " ", sD(F(v).abs())] : [" + ", sD(v)]);
  const xTerm = p => (p === 0 ? "" : Math.abs(p) === 1 ? (p > 0 ? " + x" : " " + MINUS + " x") : [sgnT(p), "x"]);
  const isSq = n => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
  const sqrtExact = f => (isSq(f.n) && isSq(f.d) ? new Frac(Math.round(Math.sqrt(f.n)), Math.round(Math.sqrt(f.d))) : null);
  const dec2 = v => fmtDec(F(Math.round(v * 100) / 100), 2);                       // Näherung, Dezimalkomma
  const NZ = range(-6, 6).filter(v => v !== 0);

  // Steigung m als Text (m = 1 und −1 ohne Ziffer), Rechte Seite mx + t
  // Steigung als unechter Bruch (4/3 x statt 1 1/3 x)
  const mTerm = m => { const mm = F(m); return mm.eq(1) ? "" : mm.eq(-1) ? MINUS : num(mm, { as: "improper" }); };
  const lineRhs = (m, t) => rich(mTerm(m), "x", tS(t));
  const eqLine = (m, t) => rich("y = ", lineRhs(m, t));
  // Scheitelform y = (x − d)² + e für den Scheitel S(d | e)
  function eqVertex(d, e) {
    const dd = F(d);
    const dPart = dd.sign() === 0 ? "" : dd.sign() < 0 ? [" + ", sF(dd.abs())] : [" " + MINUS + " ", sF(dd)];
    return rich("y = (x", dPart, ")²", tS(e));
  }
  // Normalform y = x² + px + q (ganze Zahlen)
  const polyRich = (p, q) => rich("y = x²", xTerm(p), tS(q));

  // ---------- Koordinatensystem (wie m9-funktionen.js) ----------
  function coords(cfg) {
    const W = cfg.W, H = cfg.H, ml = 12, mr = 7, mt = 5, mb = 10;
    const [x0, x1] = cfg.xr, [y0, y1] = cfg.yr;
    const sx = (W - ml - mr) / (x1 - x0), sy = (H - mt - mb) / (y1 - y0);
    const P = (x, y) => [ml + (x - x0) * sx, H - mb - (y - y0) * sy];
    const s = AG.sketch(W, H);
    // Gitter (hell), dann Achsen darüber
    for (let x = x0; x <= x1; x += cfg.gx) if (x !== 0) s.line(P(x, y0), P(x, y1), { stroke: GREY, width: 0.12 });
    for (let y = y0; y <= y1; y += cfg.gy) if (y !== 0) s.line(P(x0, y), P(x1, y), { stroke: GREY, width: 0.12 });
    s.line(P(x0, 0), P(x1, 0), { width: 0.4 });
    s.line(P(0, y0), P(0, y1), { width: 0.4 });
    // Pfeile an den Achsenenden
    const ax = P(x1, 0), ay = P(0, y1);
    s.poly([[ax[0] + 2, ax[1]], [ax[0] - 0.4, ax[1] - 1], [ax[0] - 0.4, ax[1] + 1]], { fill: INK, stroke: INK, width: 0.1 });
    s.poly([[ay[0], ay[1] - 2], [ay[0] - 1, ay[1] + 0.4], [ay[0] + 1, ay[1] + 0.4]], { fill: INK, stroke: INK, width: 0.1 });
    // Zahlen an den Achsen (Null einmal am Ursprung)
    for (let x = Math.ceil(x0 / cfg.lx) * cfg.lx; x <= x1; x += cfg.lx) if (x !== 0) { const p = P(x, 0); s.label([p[0], p[1] + 4], sInt(x)); }
    for (let y = Math.ceil(y0 / cfg.ly) * cfg.ly; y <= y1; y += cfg.ly) if (y !== 0) { const p = P(0, y); s.label([p[0] - 1.6, p[1]], sInt(y), { anchor: "end" }); }
    const o = P(0, 0);
    s.label([o[0] + 1.6, o[1] + 4], "0", { anchor: "start" });
    if (y0 < 0) s.label([ax[0] + 1, ax[1] - 2.6], cfg.xName, { anchor: "end" });
    else s.label([W - 1.5, H - 1.5], cfg.xName, { anchor: "end" });
    s.label([ay[0] + 2, 2.5], cfg.yName, { anchor: "start" });
    return { s, P };
  }

  // Gerade y = t + m·x im Ausschnitt: Endpunkte an den Rand gekürzt (null, wenn außerhalb)
  function clipLine(t, m, xr, yr) {
    const a = (yr[0] - t) / m, b = (yr[1] - t) / m;
    const xa = Math.max(xr[0], Math.min(a, b)), xb = Math.min(xr[1], Math.max(a, b));
    if (xa > xb) return null;
    return [[xa, t + m * xa], [xb, t + m * xb]];
  }

  // Kurve f(x) im Ausschnitt als Teilstücke (am Rand genau abgeschnitten, Lücken nur außerhalb)
  function clipCurve(f, xr, yr, n = 480) {
    const runs = [];
    let run = null, px = null, py = null;
    const edge = (x, y, xa, ya, ey) => { const u = (ey - ya) / (y - ya); return [xa + u * (x - xa), ey]; };
    for (let i = 0; i <= n; i++) {
      const x = xr[0] + ((xr[1] - xr[0]) * i) / n, y = f(x);
      const inside = y >= yr[0] && y <= yr[1];
      if (inside) {
        if (!run) {
          run = [];
          if (px !== null) run.push(edge(x, y, px, py, py > yr[1] ? yr[1] : yr[0]));
        }
        run.push([x, y]);
      } else if (run) {
        run.push(edge(x, y, px, py, y > yr[1] ? yr[1] : yr[0]));
        runs.push(run);
        run = null;
      }
      px = x; py = y;
    }
    if (run) runs.push(run);
    return runs;
  }

  // Markierungen: Punkt mit gestrichelten Hilfslinien zu den Achsen
  function drawMarks(cs, marks) {
    for (const [x, y] of marks) {
      cs.s.line(cs.P(x, y), cs.P(x, 0), { dash: true });
      cs.s.line(cs.P(x, y), cs.P(0, y), { dash: true });
      cs.s.circle(cs.P(x, y), 0.9, { fill: INK });
    }
  }

  // Skizze: Kurve f(x), optional Gerade (gestrichelt) und Markierungen
  function figure(cfg, f, { line = null, marks = [] } = {}) {
    const cs = coords(cfg);
    for (const run of clipCurve(f, cfg.xr, cfg.yr)) {
      const d = run.map(p => cs.P(p[0], p[1])).map(q => q[0].toFixed(2) + "," + q[1].toFixed(2));
      cs.s.path("M" + d.join(" L"), { width: 0.5 });
    }
    if (line) {
      const seg = clipLine(line.t, line.m, cfg.xr, cfg.yr);
      if (seg) cs.s.line(cs.P(seg[0][0], seg[0][1]), cs.P(seg[1][0], seg[1][1]), { width: 0.5, dash: true });
    }
    drawMarks(cs, marks);
    return cs.s.done();
  }

  // ================= 1. Gerade durch zwei Punkte =================
  // Niveau 1: positive x-Werte, ganzzahlige Steigung · Niveau 2: negative Werte, Punktprobe · Niveau 3: Steigung als Bruch
  function genTwoPoints(rng, level) {
    for (let tries = 0; tries < 500; tries++) {
      let m, mNum, x1, x2, y1, y2;
      if (level === 3) {
        const p = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), q = rng.pick([2, 3, 4, 5]);
        m = new Frac(p, q);
        if (m.d !== q) continue;                                     // Bruch ist gekürzt, keine ganze Zahl
        const s = rng.pick([1, 2, 3]);
        x1 = rng.pick(range(-5, 5));
        x2 = x1 + q * s;                                             // Δx = q · s
        y1 = rng.pick(range(-5, 5));
        y2 = y1 + p * s;                                             // Δy = p · s, also m = p/q
        if (Math.abs(x2) > 7 || Math.abs(y2) > 8) continue;
      } else {
        const xPool = level === 1 ? range(1, 6) : NZ.filter(v => Math.abs(v) <= 5);
        mNum = rng.pick(level === 1 ? [-3, -2, -1, 1, 2, 3] : [-4, -3, -2, -1, 1, 2, 3, 4]);
        m = F(mNum);
        x1 = rng.pick(xPool);
        x2 = rng.pick(xPool.filter(v => v !== x1));
        y1 = rng.pick(level === 1 ? range(-4, 8) : range(-6, 6));
        y2 = y1 + mNum * (x2 - x1);
        if (Math.abs(y2) > 9) continue;
      }
      const t = F(y1).sub(m.mul(x1));
      if (t.sign() === 0) continue;                                  // t = 0 wäre zu einfach
      return { m, t, x1, y1, x2, y2 };
    }
    throw new Error("Gerade durch zwei Punkte: keine Werte gefunden");
  }

  AG.registerType({
    id: "m10-gerade-zwei-punkte",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    title: "Gerade durch zwei Punkte",
    topic: "zuordnung",
    instruction: {
      1: "Bestimme die Steigung m = Δy : Δx und den y-Achsenabschnitt t. Gib die Gleichung y = mx + t an.",
      2: "Bestimme die Gleichung der Geraden. Prüfe durch Einsetzen, ob der Punkt R auf der Geraden liegt.",
      3: "Bestimme die Steigung m als Bruch und den y-Achsenabschnitt t. Gib die Gleichung y = mx + t an. Brüche nicht runden.",
    },
    merke: [
      "Die Steigung ", { b: "m = Δy : Δx" }, " ist der Quotient aus der Änderung der y-Werte und der Änderung der x-Werte. "
      + "Mit dem Punkt P(x₁ | y₁) folgt ", { b: "t = y₁ − m · x₁" }, ". Beispiel: P(1 | 5) und Q(3 | 9): m = (9 − 5) : (3 − 1) = 2 und t = 5 − 2 · 1 = 3, also y = 2x + 3.",
    ],
    cols: 2,
    generate(rng, level) {
      const { m, t, x1, y1, x2, y2 } = genTwoPoints(rng, level);
      const dy = y2 - y1, dx = x2 - x1;
      const given = `P(${sInt(x1)} | ${sInt(y1)}) und Q(${sInt(x2)} | ${sInt(y2)})`;
      const steps = [
        rich("m = (", sInt(y2), " − ", sp(y1), ") : (", sInt(x2), " − ", sp(x1), ") = ", sInt(dy), " : ", sp(dx), " = ", sF(m)),
        rich("t = y₁ − m · x₁ = ", sInt(y1), " − ", fp(m), " · ", sp(x1), " = ", sInt(y1), " − ", fp(m.mul(x1)), " = ", sF(t)),
        eqLine(m, t),
      ];
      const check = { m, t, x1, y1, x2, y2 };
      if (level === 2) {
        const xR = rng.pick(range(-5, 5).filter(v => v !== 0 && v !== x1 && v !== x2));
        const yCalc = m.mul(xR).add(t).n;                            // Niveau 2: ganzzahlig
        const on = rng.chance(0.5);
        const yR = on ? yCalc : yCalc + rng.pick([-2, -1, 1, 2]);
        steps.push(rich("b) Einsetzen von x = ", sp(xR), ": y = ", fp(m), " · ", sp(xR), tS(t), " = ", sInt(yCalc),
          on ? `. Der Wert stimmt mit ${sInt(yR)} überein: R liegt auf g.` : `. Der Wert ${sInt(yR)} stimmt nicht: R liegt nicht auf g.`));
        check.xR = xR; check.yR = yR; check.on = on;
        return {
          q: rich(`Die Gerade g verläuft durch ${given}. a) Bestimme die Gleichung von g. b) Liegt der Punkt R(${sInt(xR)} | ${sInt(yR)}) auf g? Begründe durch Einsetzen.`),
          a: rich(eqLine(m, t), "; b) ", on ? "ja, R liegt auf g." : "nein, R liegt nicht auf g."),
          steps,
          check,
        };
      }
      return {
        q: rich(`Die Gerade g verläuft durch ${given}. Bestimme die Steigung m und den y-Achsenabschnitt t und gib die Gleichung y = mx + t an.`),
        a: eqLine(m, t),
        steps,
        check,
      };
    },
    verify(task, level) {
      const k = task.check;
      if (!k) return "kein Prüfdatensatz";
      if (!new Frac(k.y2 - k.y1, k.x2 - k.x1).eq(k.m)) return "Steigung falsch";
      if (!F(k.y1).sub(k.m.mul(k.x1)).eq(k.t)) return "t falsch";
      if (k.m.mul(k.x2).add(k.t).cmp(k.y2) !== 0) return "Punkt Q liegt nicht auf g";
      const s = plain(task.a);
      if (level === 2) {
        const on = k.m.mul(k.xR).add(k.t).cmp(k.yR) === 0;
        if (on !== k.on) return "Punktprobe falsch";
        const exp = plain(eqLine(k.m, k.t)) + (k.on ? "; b) ja, R liegt auf g." : "; b) nein, R liegt nicht auf g.");
        return s === exp || `Antwort falsch: „${s}“`;
      }
      return s === plain(eqLine(k.m, k.t)) || `Gleichung falsch: „${s}“`;
    },
  });

  // ================= 2. Gerade aus Punkt und Steigung (parallel, senkrecht) =================
  function genPointSlope(rng, level) {
    for (let tries = 0; tries < 500; tries++) {
      const xP = rng.pick(range(-5, 5).filter(v => v !== 0));
      const yP = rng.pick(range(-6, 6));
      if (level === 3) {
        const p = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), q = rng.pick([2, 3, 4, 5]);
        const m1 = new Frac(p, q);
        if (m1.d !== q) continue;                                    // Bruch gekürzt
        const m2 = F(-1).div(m1);                                    // senkrecht: m₂ = −1 : m₁
        const t0 = rng.pick(range(-4, 4).filter(v => v !== 0));
        const t = F(yP).sub(m2.mul(xP));
        if (t.sign() === 0) continue;
        return { m1, m2, t0, xP, yP, t };
      }
      const m = F(rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]));
      const t0 = rng.pick(range(-5, 5).filter(v => v !== 0));
      const t = F(yP).sub(m.mul(xP));
      if (t.sign() === 0 || (level === 2 && t.eq(t0))) continue;     // h darf nicht mit g zusammenfallen
      return { m, t0, xP, yP, t };
    }
    throw new Error("Gerade aus Punkt und Steigung: keine Werte gefunden");
  }

  AG.registerType({
    id: "m10-gerade-punkt-steigung",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    title: "Gerade aus Punkt und Steigung (parallel, senkrecht)",
    topic: "zuordnung",
    instruction: {
      1: "Berechne den y-Achsenabschnitt t mit t = y − m · x und gib die Gleichung y = mx + t an.",
      2: "Parallele Geraden haben die gleiche Steigung. Bestimme die Gleichung der Parallelen und berechne damit einen y-Wert.",
      3: "Senkrechte Geraden erfüllen m₁ · m₂ = −1. Bestimme die Steigung m₂ und die Gleichung der Senkrechten durch P.",
    },
    merke: [
      "Gerade mit Steigung m durch P(x | y): ", { b: "t = y − m · x" }, ". Beispiel: m = 2, P(3 | 4): t = 4 − 2 · 3 = −2, also y = 2x − 2. ",
      "Parallele Geraden haben die gleiche Steigung m. Senkrechte Geraden erfüllen ", { b: "m₁ · m₂ = −1" },
      ", also m₂ = −1 : m₁. Beispiel: m₁ = 2/3, dann m₂ = −1 1/2.",
    ],
    cols: 2,
    generate(rng, level) {
      const g = genPointSlope(rng, level);
      const { xP, yP } = g;
      const P = `P(${sInt(xP)} | ${sInt(yP)})`;
      if (level === 3) {
        const { m1, m2, t0, t } = g;
        return {
          q: rich("Die Gerade g hat die Gleichung ", eqLine(m1, t0), ". Die Gerade h steht senkrecht auf g und verläuft durch ", P, ". Bestimme die Gleichung von h."),
          a: eqLine(m2, t),
          steps: [
            rich("Senkrecht: m₁ · m₂ = −1, also m₂ = −1 : m₁ = −1 : ", fp(m1), " = ", sF(m2)),
            rich("t = y₁ − m₂ · x₁ = ", sInt(yP), " − ", fp(m2), " · ", sp(xP), " = ", sInt(yP), " − ", fp(m2.mul(xP)), " = ", sF(t)),
            eqLine(m2, t),
          ],
          check: { lvl: 3, m1, m2, t0, t, xP, yP },
        };
      }
      const { m, t0, t } = g;
      const tStep = rich("t = y₁ − m · x₁ = ", sInt(yP), " − ", fp(m), " · ", sp(xP), " = ", sInt(yP), " − ", fp(m.mul(xP)), " = ", sF(t));
      if (level === 2) {
        const kk = rng.pick(range(-3, 3).filter(v => v !== 0 && v !== xP));
        const yk = m.mul(kk).add(t).n;                               // ganzzahlig
        return {
          q: rich("Die Gerade g hat die Gleichung ", eqLine(m, t0), ". Die Gerade h ist parallel zu g und verläuft durch ", P,
            ". a) Bestimme die Gleichung von h. b) Welchen y-Wert hat h bei x = ", sInt(kk), "?"),
          a: rich(eqLine(m, t), "; b) y = ", sInt(yk)),
          steps: [
            rich("Parallele Geraden haben die gleiche Steigung: m = ", sF(m)),
            tStep,
            eqLine(m, t),
            rich("b) Einsetzen von x = ", sp(kk), ": y = ", fp(m), " · ", sp(kk), tS(t), " = ", sInt(yk)),
          ],
          check: { lvl: 2, m, t, t0, xP, yP, kk, yk },
        };
      }
      return {
        q: rich("Bestimme die Gleichung der Geraden mit der Steigung m = ", sF(m), " durch den Punkt ", P, ". Gib die Gleichung y = mx + t an."),
        a: eqLine(m, t),
        steps: [tStep, eqLine(m, t)],
        check: { lvl: 1, m, t, xP, yP },
      };
    },
    verify(task, level) {
      const k = task.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(task.a);
      if (level === 3) {
        if (!k.m1.mul(k.m2).eq(-1)) return "m₁ · m₂ ≠ −1";
        if (!F(k.yP).sub(k.m2.mul(k.xP)).eq(k.t)) return "t falsch";
        return s === plain(eqLine(k.m2, k.t)) || `Gleichung falsch: „${s}“`;
      }
      if (!F(k.yP).sub(k.m.mul(k.xP)).eq(k.t)) return "t falsch";
      if (level === 2) {
        if (k.t.eq(k.t0)) return "h fällt mit g zusammen";
        if (!k.m.mul(k.kk).add(k.t).eq(k.yk)) return "y-Wert falsch";
        return s === plain(eqLine(k.m, k.t)) + `; b) y = ${sInt(k.yk)}` || `Antwort falsch: „${s}“`;
      }
      return s === plain(eqLine(k.m, k.t)) || `Gleichung falsch: „${s}“`;
    },
  });

  // ================= 3. Parabel: Scheitelform und Normalform =================
  // Niveau 1: Scheitelform → Scheitel und Normalform · Niveau 2: Skizze, Scheitel ablesen · Niveau 3: Normalform → Scheitelform
  function genVertex(rng) {
    for (let tries = 0; tries < 300; tries++) {
      const d = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]), e = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const p = -2 * d, q = d * d + e;                              // (x − d)² + e = x² − 2dx + d² + e
      if (q === 0) continue;
      return { d, e, p, q };
    }
    throw new Error("Parabel: keine Werte gefunden");
  }
  function genComplete(rng) {
    for (let tries = 0; tries < 300; tries++) {
      const p = rng.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), q = rng.pick(NZ);
      const h = F(p).div(2), c = h.mul(h), e = F(q).sub(c);          // x² + px + q = (x + h)² + (q − h²)
      if (e.sign() === 0) continue;
      return { p, q, h, c, e, d: h.neg() };                          // Scheitel S(d | e) mit d = −h
    }
    throw new Error("Parabel Normalform: keine Werte gefunden");
  }
  function genVertexFig(rng) {
    const d = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]), e = rng.pick([-3, -2, -1, 1, 2, 3, 4, 5]);
    return { d, e };
  }

  AG.registerType({
    id: "m10-parabel-scheitel",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    title: "Parabel: Scheitelform und Normalform",
    topic: "zuordnung",
    instruction: {
      1: "Lies den Scheitel aus der Scheitelform ab und multipliziere die Klammer aus.",
      2: "Lies den Scheitel S aus der Skizze ab und gib die Gleichung der Parabel in Scheitelform an.",
      3: "Forme die Normalform mit quadratischer Ergänzung in die Scheitelform um und gib den Scheitel an.",
    },
    merke: [
      "Scheitelform ", { b: "y = (x − d)² + e" }, " mit dem Scheitel ", { b: "S(d | e)" },
      ". Achtung beim Vorzeichen: (x + 2)² bedeutet d = −2. Normalform in Scheitelform mit quadratischer Ergänzung: x² + 6x = (x + 3)² − 9. ",
      "Beispiel: y = x² + 6x + 4 = (x + 3)² − 5, also S(−3 | −5).",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) {
        const { d, e, p, q } = genVertex(rng);
        const dTxt = d < 0 ? "+ " + sInt(-d) : MINUS + " " + sInt(d);
        return {
          q: rich("Gegeben ist die Parabel ", eqVertex(d, e), ". a) Gib den Scheitel S an. b) Multipliziere die Klammer aus und gib die Form y = x² + px + q an."),
          a: rich("a) S(", sInt(d), " | ", sInt(e), "); b) ", polyRich(p, q)),
          steps: [
            rich("Die Klammer (x ", dTxt, ")² hat d = ", sInt(d), ". Scheitel: S(", sInt(d), " | ", sInt(e), ")."),
            rich("y = x² − 2 · ", sp(d), " · x + ", sp(d), "²", tS(e)),
            rich("y = x²", xTerm(p), tS(d * d), tS(e)),
            polyRich(p, q),
          ],
          check: { lvl: 1, d, e, p, q },
        };
      }
      if (level === 2) {
        const { d, e } = genVertexFig(rng);
        const cfg = { W: 130, H: 60, xr: [-6, 6], yr: [-4, 12], gx: 1, gy: 1, lx: 1, ly: 2, xName: "x", yName: "y" };
        const f = x => (x - d) ** 2 + e;
        const intro = rng.pick([
          "Die Skizze zeigt den Bogen eines Sprungs.",
          "Die Skizze zeigt die Flugbahn eines Balls.",
          "Die Skizze zeigt den Verlauf eines Wasserstrahls.",
          "Die Skizze zeigt den Querschnitt einer Schüssel.",
          "Die Skizze zeigt den Bogen einer kleinen Brücke.",
        ]);
        // c) y-Wert bei einem gewählten x (macht die Aufgabe abwechslungsreich, Lösung aus der Gleichung)
        const k = rng.pick(range(-4, 4).filter(v => v !== d));
        const yk = (k - d) ** 2 + e;
        return {
          q: rich(intro, " Es ist eine verschobene Normalparabel (ein Kästchen entspricht einer Einheit). a) Lies den Scheitel S ab. "
            + `b) Gib die Gleichung der Parabel in Scheitelform an. c) Berechne den y-Wert der Parabel bei x = ${sInt(k)}.`),
          a: rich("a) S(", sInt(d), " | ", sInt(e), "); b) ", eqVertex(d, e), `; c) y = ${sInt(yk)}`),
          steps: [
            rich("Der Scheitel ist der tiefste Punkt der Parabel. Ablesen: x = ", sInt(d), ", y = ", sInt(e), ". Also S(", sInt(d), " | ", sInt(e), ")."),
            rich("Normalparabel, also a = 1. Scheitelform y = (x − d)² + e mit d = ", sInt(d), " und e = ", sInt(e), ":"),
            eqVertex(d, e),
            rich("c) Einsetzen von x = ", sp(k), ": y = (", sInt(k), " − ", sp(d), ")²", tS(e), " = ", sInt(yk)),
          ],
          fig: figure(cfg, f),
          aFig: figure(cfg, f, { marks: [[d, e]] }),
          inline: false,
          check: { lvl: 2, d, e, k, yk },
        };
      }
      const { p, q, h, c, e, d } = genComplete(rng);
      const ans = () => rich("y = (x", tD(h), ")²", tD(e), "; S(", sD(d), " | ", sD(e), ")");
      return {
        q: rich("Gegeben ist die Parabel y = x²", xTerm(p), tD(q), ". Forme in die Scheitelform y = (x − d)² + e um (quadratische Ergänzung) und gib den Scheitel S an."),
        a: ans(),
        steps: [
          rich("Halbe Zahl von p: ", sInt(p), " : 2 = ", sD(h)),
          rich("Quadratische Ergänzung: (", sD(h), ")² = ", sD(c)),
          rich("y = (x²", xTerm(p), tD(c), ")", tD(c.neg()), tD(q)),
          rich("y = (x", tD(h), ")²", tD(e)),
          rich("Scheitel: S(", sD(d), " | ", sD(e), ")"),
        ],
        check: { lvl: 3, p, q, h, c, e, d },
      };
    },
    verify(task, level) {
      const k = task.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(task.a);
      if (k.lvl === 1) {
        if (k.p !== -2 * k.d || k.q !== k.d * k.d + k.e) return "Ausmultiplizieren falsch";
        return s === plain(rich("a) S(", sInt(k.d), " | ", sInt(k.e), "); b) ", polyRich(k.p, k.q))) || `Antwort falsch: „${s}“`;
      }
      if (k.lvl === 2) {
        if ((k.k - k.d) ** 2 + k.e !== k.yk) return "y-Wert falsch";
        return s === plain(rich("a) S(", sInt(k.d), " | ", sInt(k.e), "); b) ", eqVertex(k.d, k.e), `; c) y = ${sInt(k.yk)}`)) || `Antwort falsch: „${s}“`;
      }
      if (!k.h.mul(2).eq(k.p)) return "h falsch";
      if (!k.h.mul(k.h).eq(k.c)) return "c falsch";
      if (!k.c.add(k.e).eq(k.q)) return "e falsch";
      if (!k.d.eq(k.h.neg())) return "Scheitel falsch";
      return s === plain(rich("y = (x", tD(k.h), ")²", tD(k.e), "; S(", sD(k.d), " | ", sD(k.e), ")")) || `Antwort falsch: „${s}“`;
    },
  });

  // ================= 4. Schnittpunkte Parabel–Gerade und Nullstellen =================
  // Niveau 1: Nullstellen (ganzzahlig) · Niveau 2: Schnittpunkte mit Skizze (ganzzahlig) · Niveau 3: ≈ oder keine Schnittpunkte
  function genRootsPair(rng) {
    for (let tries = 0; tries < 300; tries++) {
      const r1 = rng.pick(NZ), r2 = rng.pick(NZ);
      if (r1 === r2 || r1 + r2 === 0) continue;                      // p = 0 vermeiden
      return { p: -(r1 + r2), q: r1 * r2, r1: Math.min(r1, r2), r2: Math.max(r1, r2) };
    }
    throw new Error("Nullstellen: keine Werte gefunden");
  }
  function genIntersect(rng) {
    const small = NZ.filter(v => Math.abs(v) <= 4);
    for (let tries = 0; tries < 500; tries++) {
      const a = rng.pick(small), b = rng.pick(small.filter(v => v !== a));
      if (a + b === 0) continue;                                     // B ≠ 0
      const s1 = Math.min(a, b), s2 = Math.max(a, b);
      const m = rng.pick([-2, -1, 1, 2, 3]), q = rng.pick(range(-4, 4));
      // x² + px + q = mx + t  ⇔  x² + (p − m)x + (q − t) = 0 mit den Lösungen s1, s2
      const p = m - (s1 + s2), t = q - s1 * s2;
      const y1 = m * s1 + t, y2 = m * s2 + t;
      if (Math.abs(y1) > 5 || Math.abs(y2) > 5) continue;
      return { s1, s2, m, q, p, t, y1, y2 };
    }
    throw new Error("Schnittpunkte: keine Werte gefunden");
  }
  function genIrr(rng, want) {
    for (let tries = 0; tries < 3000; tries++) {
      const p = rng.pick(NZ), q = rng.pick(NZ), m = rng.pick([-3, -2, -1, 1, 2, 3]), t = rng.pick(NZ);
      const B = p - m, C = q - t;
      if (B === 0 || C === 0) continue;
      const hB = F(B).div(2), D = hB.mul(hB).sub(C);                 // D = (B/2)² − C
      if (want === "keine") {
        if (D.sign() < 0) return { p, q, m, t, B, C, hB, D, want };
        continue;
      }
      if (D.sign() <= 0 || sqrtExact(D)) continue;                   // zwei irrationale Lösungen
      const sD = Math.sqrt(D.valueOf());
      const x1 = -hB.valueOf() - sD, x2 = -hB.valueOf() + sD;
      const y1 = m * x1 + t, y2 = m * x2 + t;
      if ([x1, x2].some(v => Math.abs(v) > 8) || [y1, y2].some(v => Math.abs(v) > 10)) continue;
      return { p, q, m, t, B, C, hB, D, want, sD, x1, x2, y1, y2 };
    }
    throw new Error("Schnittpunkte mit Näherung: keine Werte gefunden");
  }

  function rootsTask(rng) {
    const { p, q, r1, r2 } = genRootsPair(rng);
    const hp = F(p).div(2), Dd = hp.mul(hp).sub(q), sq = sqrtExact(Dd);
    const xa = hp.neg().sub(sq), xb = hp.neg().add(sq);              // sq > 0, also xa < xb
    return {
      q: rich("Die Parabel ", polyRich(p, q), " schneidet die x-Achse. Berechne die Nullstellen mit der Lösungsformel x = −p/2 ± √((p/2)² − q)."),
      a: rich("x₁ = ", sF(xa), "; x₂ = ", sF(xb)),
      steps: [
        rich("Koeffizienten: p = ", sInt(p), ", q = ", sInt(q)),
        rich("p : 2 = ", sF(hp), ";  (p : 2)² = (", sF(hp), ")² = ", sF(hp.mul(hp))),
        rich("D = (p : 2)² − q = ", sF(hp.mul(hp)), " − ", sp(q), " = ", sF(Dd)),
        rich("√D = √(", sF(Dd), ") = ", sF(sq)),
        rich("x₁ = −(", sF(hp), ") − ", sF(sq), " = ", sF(xa)),
        rich("x₂ = −(", sF(hp), ") + ", sF(sq), " = ", sF(xb)),
      ],
      check: { lvl: 1, p, q, r1, r2, xa, xb },
    };
  }

  function intersectTask(rng) {
    const { s1, s2, m, q, p, t, y1, y2 } = genIntersect(rng);
    const B = p - m, C = q - t, hB = F(B).div(2), Dd = hB.mul(hB).sub(C), sq = sqrtExact(Dd);
    const cfg = { W: 130, H: 60, xr: [-6, 6], yr: [-6, 10], gx: 1, gy: 1, lx: 1, ly: 2, xName: "x", yName: "y" };
    const f = x => x * x + p * x + q;
    return {
      q: rich("Gegeben sind die Parabel ", polyRich(p, q), " und die Gerade g: ", eqLine(m, t),
        ". Berechne die Schnittpunkte rechnerisch (Gleichsetzen, dann Lösungsformel). Die Skizze zeigt die Lage: Parabel durchgezogen, Gerade gestrichelt."),
      a: rich("S₁(", sInt(s1), " | ", sInt(y1), "); S₂(", sInt(s2), " | ", sInt(y2), ")"),
      steps: [
        rich("x²", xTerm(p), tS(q), " = ", lineRhs(m, t)),
        rich("x² + (", sInt(p), " − ", sp(m), ")x + (", sInt(q), " − ", sp(t), ") = 0"),
        rich("B = ", sInt(p), " − ", sp(m), " = ", sInt(B), ";  C = ", sInt(q), " − ", sp(t), " = ", sInt(C)),
        rich("D = (B : 2)² − C = (", sF(hB), ")² − ", sp(C), " = ", sF(Dd)),
        rich("√D = √(", sF(Dd), ") = ", sF(sq)),
        rich("x₁ = −(", sF(hB), ") − ", sF(sq), " = ", sInt(s1), ";  x₂ = −(", sF(hB), ") + ", sF(sq), " = ", sInt(s2)),
        rich("y₁ = ", sp(m), " · ", sp(s1), tS(t), " = ", sInt(y1)),
        rich("y₂ = ", sp(m), " · ", sp(s2), tS(t), " = ", sInt(y2)),
      ],
      fig: figure(cfg, f, { line: { t, m } }),
      aFig: figure(cfg, f, { line: { t, m }, marks: [[s1, y1], [s2, y2]] }),
      inline: false,
      check: { lvl: 2, s1, s2, m, q, p, t, y1, y2 },
    };
  }

  function irrTask(rng) {
    const want = rng.chance(0.5) ? "zwei" : "keine";
    const k = genIrr(rng, want);
    const { p, q, m, t, B, C, hB, D } = k;
    const head = [
      rich("x²", xTerm(p), tS(q), " = ", lineRhs(m, t)),
      rich("x² + (", sInt(p), " − ", sp(m), ")x + (", sInt(q), " − ", sp(t), ") = 0"),
      rich("B = ", sInt(p), " − ", sp(m), " = ", sInt(B), ";  C = ", sInt(q), " − ", sp(t), " = ", sInt(C)),
      rich("D = (B : 2)² − C = (", sF(hB), ")² − ", sp(C), " = ", sF(D)),
    ];
    const q_ = rich("Gegeben sind die Parabel ", polyRich(p, q), " und die Gerade g: ", eqLine(m, t),
      ". Berechne die Schnittpunkte mit der Lösungsformel. Rechne ohne Zwischenrundung mit dem Taschenrechner und runde die Ergebnisse auf 2 Nachkommastellen (≈). Gibt es keine Schnittpunkte, schreibe das.");
    if (want === "keine") {
      return {
        q: q_,
        a: rich("Keine Schnittpunkte, denn D < 0."),
        steps: [...head, rich("D < 0: Die Gleichung hat keine reelle Lösung, also gibt es keine Schnittpunkte.")],
        check: { lvl: 3, want, p, q, m, t, B, C, D },
      };
    }
    const { sD, x1, x2, y1, y2 } = k;
    return {
      q: q_,
      a: rich("Schnittpunkte (gerundet): S₁(", dec2(x1), " | ", dec2(y1), "); S₂(", dec2(x2), " | ", dec2(y2), ")"),
      steps: [
        ...head,
        rich("√D ≈ ", dec2(sD)),
        rich("x₁ = −(", sF(hB), ") − √D ≈ ", dec2(x1)),
        rich("x₂ = −(", sF(hB), ") + √D ≈ ", dec2(x2)),
        rich("y₁ = ", sp(m), " · x₁", tS(t), " ≈ ", dec2(y1)),
        rich("y₂ = ", sp(m), " · x₂", tS(t), " ≈ ", dec2(y2)),
      ],
      check: { lvl: 3, want, p, q, m, t, B, C, D, x1, x2, y1, y2 },
    };
  }

  AG.registerType({
    id: "m10-parabel-schnittpunkte",
    klasse: "10",
    zug: "M",
    lb: "7",
    lbTitle: "Funktionen und Gleichungen",
    title: "Parabel: Nullstellen und Schnittpunkte mit Gerade",
    topic: "zuordnung",
    instruction: {
      1: "Berechne die Nullstellen mit der Lösungsformel x = −p/2 ± √((p/2)² − q).",
      2: "Berechne die Schnittpunkte von Parabel und Gerade: zuerst gleichsetzen, dann die Lösungsformel anwenden. Die Skizze dient zur Kontrolle.",
      3: "Berechne die Schnittpunkte mit dem Taschenrechner. Ergebnisse auf 2 Nachkommastellen gerundet (≈). Gibt es keine Schnittpunkte, schreibe das.",
    },
    merke: [
      "Schnittpunkte: gleichsetzen und ", { b: "x² + Bx + C = 0" }, " mit B = p − m und C = q − t lösen. Lösungsformel: ",
      { b: "x = −B/2 ± √D" }, " mit ", { b: "D = (B/2)² − C" }, ". Ist D > 0, gibt es zwei Schnittpunkte; ist D < 0, gibt es keine. ",
      "Beispiel: x² − 2x − 3 = 0 hat B = −2, C = −3, D = 1 + 3 = 4, also x = 1 ± 2, x₁ = −1 und x₂ = 3.",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return rootsTask(rng);
      if (level === 2) return intersectTask(rng);
      return irrTask(rng);
    },
    verify(task, level) {
      const k = task.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(task.a);
      if (k.lvl === 1) {
        if (k.p !== -(k.r1 + k.r2) || k.q !== k.r1 * k.r2) return "Koeffizienten falsch";
        const xa = F(k.xa), xb = F(k.xb);
        const at = x => x.mul(x).add(F(k.p).mul(x)).add(k.q);
        if (at(xa).sign() !== 0 || at(xb).sign() !== 0) return "Nullstelle falsch";
        return s === `x₁ = ${sInt(k.r1)}; x₂ = ${sInt(k.r2)}` || `Antwort falsch: „${s}“`;
      }
      if (k.lvl === 2) {
        if (k.s1 + k.s2 !== -(k.p - k.m) || k.s1 * k.s2 !== k.q - k.t) return "Gleichsetzen falsch";
        if (k.m * k.s1 + k.t !== k.y1 || k.m * k.s2 + k.t !== k.y2) return "y-Werte falsch";
        return s === `S₁(${sInt(k.s1)} | ${sInt(k.y1)}); S₂(${sInt(k.s2)} | ${sInt(k.y2)})` || `Antwort falsch: „${s}“`;
      }
      const hB = F(k.B).div(2), D = hB.mul(hB).sub(k.C);
      if (!D.eq(k.D)) return "Diskriminante falsch";
      if (k.want === "keine") {
        if (D.sign() >= 0) return "D ist nicht negativ";
        return s === "Keine Schnittpunkte, denn D < 0." || `Antwort falsch: „${s}“`;
      }
      if (D.sign() <= 0 || sqrtExact(D)) return "keine zwei irrationalen Lösungen";
      const sD = Math.sqrt(D.valueOf());
      const x1 = -hB.valueOf() - sD, x2 = -hB.valueOf() + sD;
      if (Math.abs(x1 - k.x1) > 1e-9 || Math.abs(x2 - k.x2) > 1e-9) return "x-Werte falsch";
      const exp = `Schnittpunkte (gerundet): S₁(${dec2(k.x1)} | ${dec2(k.y1)}); S₂(${dec2(k.x2)} | ${dec2(k.y2)})`;
      return s === exp || `Antwort falsch: „${s}“ (erwartet „${exp}“)`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
