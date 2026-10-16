// M7 LB 4: Flächeninhalt von Trapez, Drachen und Raute (M-Zug) sowie zusammengesetzten Figuren – mit Skizzen.
(function (AG) {
  const { Frac, rich, fmtDec, MINUS } = AG;
  const NB = " "; // festes Leerzeichen zwischen Zahl und Einheit
  const F = (n, d = 1) => new Frac(n, d);
  const Z = () => F(0);
  const cm = x => fmtDec(x) + NB + "cm";
  const cm2 = x => fmtDec(x) + NB + "cm²";
  const m = x => fmtDec(x) + NB + "m";
  const m2 = x => fmtDec(x) + NB + "m²";
  const mm = x => fmtDec(x) + NB + "mm";
  const eur = x => fmtDec(x, 2) + NB + "€";
  const UNIT = { cm: { L: cm, A: cm2 }, m: { L: m, A: m2 } };
  const dec2 = f => f.decimals() <= 2;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // =====================================================================
  // Teil 1: Trapez, Drachen, Raute
  // =====================================================================

  // Trapez (symmetrisch), a unten, c oben, h gestrichelt. Nur für die Zeichnung ist h begrenzt.
  function trapezFig(a, c, h, labA, labC, labH) {
    const W = 75, H = 45;
    const av = Number(a), cv = Number(c);
    const hv = clamp(Number(h), 0.45 * av, 0.9 * av);
    const sx = (av - cv) / 2;
    const pts = [[0, 0], [av, 0], [sx + cv, hv], [sx, hv]];
    const f = AG.fitPoints(pts.concat([[0, -0.12 * av]]), W, H, 7);
    const P = pts.map(f), foot = f([sx, 0]);
    const s = AG.sketch(W, H);
    s.poly(P);
    s.line(P[3], foot, { dash: true });
    s.right(foot, P[1], P[3]);
    s.side(P[0], P[1], labA, { inside: f([av / 2, hv / 2]) });
    s.side(P[2], P[3], labC, { inside: f([av / 2, 0]) });
    s.label([foot[0] + 1.4, (P[3][1] + foot[1]) / 2], labH, { anchor: "start" });
    return s.done();
  }

  // Drachen bzw. Raute: Diagonale e waagerecht, f senkrecht, Schnittpunkt S. ratio = Lage von S auf f (von unten).
  // Nur die gestrichelten Diagonalen. e und f stehen rechts neben der Figur, auf Höhe der jeweiligen Diagonale,
  // damit keine Kante die Beschriftung kreuzt.
  function kiteFig(e, f, ratio, labE, labF, raute) {
    const W = 75, H = 45, Lm = 6, Bp = 6, Tp = 6, avail = 45;
    const de = Number(e);
    const df = clamp(Number(f), 0.6 * de, 1.4 * de); // nur für die Zeichnung
    const v = raute ? df / 2 : df * ratio;
    const scx = Math.min(avail / de, 6.5), scy = (H - Bp - Tp) / df; // nicht maßstabsgetreu
    const ox = Lm + (avail - de * scx) / 2;
    const X = p => [ox + p[0] * scx, H - Bp - p[1] * scy];
    const P = X([0, v]), T = X([de / 2, df]), Q = X([de, v]), B = X([de / 2, 0]), S = X([de / 2, v]);
    const s = AG.sketch(W, H);
    s.poly([P, T, Q, B]);
    s.line(P, Q, { dash: true });
    s.line(B, T, { dash: true });
    s.right(S, P, T);
    s.label([Q[0] + 2, S[1] + 3.5], labE, { anchor: "start" });
    s.label([Q[0] + 2, S[1] - (S[1] - T[1]) / 2], labF, { anchor: "start" });
    return s.done();
  }

  // Trapez a, c, h (Zahlen als Frac). hMm: Höhe in ganzen mm (nur Anzeige).
  function genTrapez(rng, level) {
    for (let t = 0; t < 500; t++) {
      let a, c, h, hMm = null;
      if (level === 2) {
        a = F(rng.int(60, 150), 10); c = F(rng.int(20, 100), 10); h = F(rng.int(5, 18) * 5, 10);
        if (rng.chance(0.5)) hMm = h.mul(10);
      } else {
        a = F(rng.int(6, 14)); c = F(rng.int(2, 10)); h = F(rng.int(2, 9));
      }
      if (c.cmp(a) >= 0) continue;
      const A = a.add(c).mul(h).div(2);
      if (!dec2(A) || (level !== 2 && !A.isInt())) continue;

      if (level === 3) {
        return {
          q: rich("Trapez mit den parallelen Seiten a = ", cm(a), " und c = ", cm(c), " hat den Flächeninhalt A = ", cm2(A), ". Berechne die Höhe h."),
          a: rich(cm(h)),
          steps: [
            rich("A = (a + c) · h : 2"),
            rich("h = 2 · A : (a + c)"),
            rich("h = ", cm2(A.mul(2)), " : ", cm(a.add(c))),
            rich("h = ", cm(h)),
          ],
          fig: trapezFig(a, c, h, "a = " + cm(a), "c = " + cm(c), "h = ?"),
          inline: false,
          _kind: "trapez", _a: a, _c: c, _h: h, _A: A, _ask: "h", _ans: h,
        };
      }

      const hTxt = hMm ? mm(hMm) : cm(h);
      const steps = [rich("A = (a + c) · h : 2")];
      if (hMm) steps.push(rich("h = ", mm(hMm), " = ", cm(h)));
      steps.push(
        rich("A = (", cm(a), " + ", cm(c), ") · ", cm(h), " : 2"),
        rich("A = ", cm(a.add(c)), " · ", cm(h), " : 2"),
        rich("A = ", cm2(A)),
      );
      return {
        q: rich("Trapez mit den parallelen Seiten a = ", cm(a), " und c = ", cm(c), " und der Höhe h = ", hTxt, ". Berechne den Flächeninhalt."),
        a: rich(cm2(A)),
        steps,
        fig: trapezFig(a, c, h, "a = " + cm(a), "c = " + cm(c), "h = " + hTxt),
        inline: false,
        _kind: "trapez", _a: a, _c: c, _h: h, _A: A, _ask: null, _ans: A,
      };
    }
    throw new Error("Trapez: keine Aufgabe erzeugt");
  }

  // Drachen (raute = false) oder Raute (raute = true) mit Diagonalen e und f.
  function genKite(rng, level, raute) {
    const name = raute ? "Raute" : "Drachen";
    for (let t = 0; t < 500; t++) {
      let e, f, eMm = null, fMm = null;
      if (level === 2) {
        e = F(rng.int(8, 28) * 5, 10); f = F(rng.int(6, 24) * 5, 10);
        const which = rng.pick(["e", "f", "-"]);
        if (which === "e") eMm = e.mul(10); else if (which === "f") fMm = f.mul(10);
      } else {
        e = F(rng.int(4, 14)); f = F(rng.int(4, 14));
      }
      if (e.eq(f)) continue;
      const A = e.mul(f).div(2);
      if (!dec2(A) || (level !== 2 && !A.isInt())) continue;
      const ratio = raute ? 0.5 : rng.pick([0.35, 0.5, 0.65]);

      if (level === 3) {
        const askF = rng.chance(0.5);
        const known = askF ? "e = " + cm(e) : "f = " + cm(f);
        return {
          q: rich(name, " mit der Fläche A = ", cm2(A), " und der Diagonale ", known, ". Berechne die andere Diagonale ", askF ? "f." : "e."),
          a: rich(askF ? cm(f) : cm(e)),
          steps: [
            rich("A = e · f : 2"),
            askF ? rich(cm2(A), " = ", cm(e), " · f : 2") : rich(cm2(A), " = e · ", cm(f), " : 2"),
            askF ? rich("f = ", cm2(A.mul(2)), " : ", cm(e)) : rich("e = ", cm2(A.mul(2)), " : ", cm(f)),
            askF ? rich("f = ", cm(f)) : rich("e = ", cm(e)),
          ],
          fig: kiteFig(e, f, ratio, askF ? "e = " + cm(e) : "e = ?", askF ? "f = ?" : "f = " + cm(f), raute),
          inline: false,
          _kind: "kite", _e: e, _f: f, _A: A, _ask: askF ? "f" : "e", _ans: askF ? f : e,
        };
      }

      const eTxt = eMm ? mm(eMm) : cm(e), fTxt = fMm ? mm(fMm) : cm(f);
      const steps = [rich("A = e · f : 2")];
      if (eMm) steps.push(rich("e = ", mm(eMm), " = ", cm(e)));
      if (fMm) steps.push(rich("f = ", mm(fMm), " = ", cm(f)));
      steps.push(rich("A = ", cm(e), " · ", cm(f), " : 2"), rich("A = ", cm2(A)));
      return {
        q: rich(name, " mit den Diagonalen e = ", eTxt, " und f = ", fTxt, ". Berechne den Flächeninhalt."),
        a: rich(cm2(A)),
        steps,
        fig: kiteFig(e, f, ratio, "e = " + eTxt, "f = " + fTxt, raute),
        inline: false,
        _kind: "kite", _e: e, _f: f, _A: A, _ask: null, _ans: A,
      };
    }
    throw new Error(name + ": keine Aufgabe erzeugt");
  }

  // Prüfung unabhängig von der Erzeugung: Fläche aus den Maßen, gesuchte Größe zurückrechnen.
  function verifyGeo(t) {
    const A = t._kind === "trapez" ? t._a.add(t._c).mul(t._h).div(2) : t._e.mul(t._f).div(2);
    if (!A.eq(t._A)) return "Fläche stimmt nicht";
    if (!t._ask) return A.eq(t._ans) || "Ergebnis falsch";
    let x;
    if (t._kind === "trapez") x = t._A.mul(2).div(t._a.add(t._c));
    else x = t._ask === "f" ? t._A.mul(2).div(t._e) : t._A.mul(2).div(t._f);
    return x.eq(t._ans) || "Lösung falsch";
  }

  AG.registerType({
    id: "m7-flaeche-trapez-drachen",
    klasse: "7",
    zug: "M",
    lb: "4",
    lbTitle: "Flächeninhalt",
    title: "Trapez, Drachen und Raute",
    instruction: {
      1: "Berechne den Flächeninhalt.",
      2: "Berechne den Flächeninhalt. Achte auf die Einheiten.",
      3: "Berechne die fehlende Größe.",
    },
    merke: [
      "Trapez: ", { b: "A = (a + c) · h : 2" }, ". Drachenviereck und Raute: ", { b: "A = e · f : 2" },
      ". Die Diagonalen e und f stehen senkrecht aufeinander. Beispiel: e = 8 cm, f = 5 cm → A = 8 cm · 5 cm : 2 = 20 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      const kind = rng.pick(["trapez", "drachen", "raute"]);
      return kind === "trapez" ? genTrapez(rng, level) : genKite(rng, level, kind === "raute");
    },
    verify: verifyGeo,
  });

  // =====================================================================
  // Teil 2: Zusammengesetzte Figuren
  // =====================================================================

  const AREA = {
    rect: d => d.a.mul(d.b),
    tri: d => d.g.mul(d.h).div(2),
    par: d => d.g.mul(d.h),
    trap: d => d.a.add(d.c).mul(d.h).div(2),
  };
  const piece = (kind, sign, name, d) => ({ kind, sign, name, d, area: AREA[kind](d) });

  // Eine Teilfläche als Rechnung: "Unteres Rechteck: 9 cm · 5 cm = 45 cm²"
  function pieceRich(p, u) {
    const d = p.d, L = u.L;
    const f = p.kind === "rect" ? [L(d.a), " · ", L(d.b)]
      : p.kind === "tri" ? [L(d.g), " · ", L(d.h), " : 2"]
      : p.kind === "par" ? [L(d.g), " · ", L(d.h)]
      : ["(", L(d.a), " + ", L(d.c), ") · ", L(d.h), " : 2"];
    return rich(p.name, ": ", ...f, " = ", u.A(p.area));
  }

  // Gesamtrechnung: "A = 45 cm² + 12 cm² = 57 cm²" (abgezogene Teile mit Minuszeichen)
  function totalRich(pieces, u, A) {
    const parts = [];
    pieces.forEach((p, i) => {
      if (i === 0) parts.push(p.sign < 0 ? MINUS + " " : "");
      else parts.push(p.sign < 0 ? " " + MINUS + " " : " + ");
      parts.push(u.A(p.area));
    });
    return rich("A = ", ...parts, " = ", u.A(A));
  }

  // Skizze: Umriss (Einheiten y nach oben), Hilfslinien, rechte Winkel, Beschriftungen
  function drawZ(sp) {
    const W = 120, H = 60;
    const f = AG.fitPoints(sp.outline.concat(sp.pad || []), W, H, 7);
    const s = AG.sketch(W, H);
    s.poly(sp.outline.map(f));
    (sp.holes || []).forEach(h => s.poly(h.map(f), { fill: false }));
    (sp.lines || []).forEach(l => s.line(f(l[0]), f(l[1]), { dash: true }));
    (sp.rights || []).forEach(r => s.right(f(r[0]), f(r[1]), f(r[2])));
    (sp.sides || []).forEach(o => s.side(f(o.a), f(o.b), o.text, { inside: f(o.inside) }));
    (sp.labels || []).forEach(o => s.label(f(o.p), o.text, { anchor: o.anchor || "middle" }));
    return s.done();
  }

  // Dreieck-Höhe als gestrichelte Linie vom Fußpunkt zur Spitze, mit rechtem Winkel und Beschriftung rechts davon
  // Höhe: gestrichelte Linie, rechter Winkel am Fußpunkt, Beschriftung rechts neben dem oberen Ende
  // (yFrac undefined) oder innen auf Höhe yFrac zwischen Fuß (0) und Spitze (1)
  function heightMark(foot, pDir, top, text, yFrac) {
    const yTop = Math.max(foot[1], top[1]);
    const p = yFrac === undefined
      ? [foot[0] + 0.5, yTop + 0.9]
      : [foot[0] + 1.0, foot[1] + yFrac * (top[1] - foot[1])];
    return {
      lines: [[foot, top]],
      rights: [[foot, pDir, top]],
      labels: [{ p, text, anchor: "start" }],
      pad: [[foot[0], yTop + 1.3]], // Platz oberhalb für die Beschriftung
    };
  }

  // Rechteck W × H mit Rechteck oben rechts (w2 × h2) als Teil (split) oder als Ausschnitt (cut) oder Garten (m, mit Preis)
  function buildL(u, W, H, w2, h2, mode, price) {
    const Hl = H.sub(h2), Wl = W.sub(w2);
    const split = mode !== "cut";
    const pre = split ? [
      rich("Höhe unten: ", u.L(H), " − ", u.L(h2), " = ", u.L(Hl)),
      rich("Breite oben: ", u.L(W), " − ", u.L(w2), " = ", u.L(Wl)),
    ] : [];
    const pieces = split
      ? [piece("rect", 1, "Unteres Rechteck", { a: W, b: Hl }), piece("rect", 1, "Oberes linkes Rechteck", { a: Wl, b: h2 })]
      : [piece("rect", 1, "Großes Rechteck", { a: W, b: H }), piece("rect", -1, "Ausgeschnittenes Rechteck", { a: w2, b: h2 })];
    const Wn = Number(W), Hn = Number(H), wn = Number(w2), hn = Number(h2), Wln = Wn - wn, Hln = Hn - hn;
    const sp = {
      outline: [[0, 0], [Wn, 0], [Wn, Hln], [Wln, Hln], [Wln, Hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
        { a: [Wln, Hln], b: [Wln, Hn], text: u.L(h2), inside: [Wln - 0.5, (Hln + Hn) / 2] },
        { a: [Wln, Hln], b: [Wn, Hln], text: u.L(w2), inside: [(Wln + Wn) / 2, Hln - 0.5] },
      ],
    };
    let q;
    if (mode === "garten") {
      q = rich("Der Garten hat die Form der Figur (alle Maße in m). Rasen kostet ", eur(price), " pro m². Wie viel kostet der Rasen für die ganze Gartenfläche?");
    } else if (split) {
      q = rich("Die Figur ist ", u.L(W), " breit und ", u.L(H), " hoch. Oben rechts fehlt ein Rechteck, ", u.L(w2), " breit und ", u.L(h2), " hoch. Berechne den Flächeninhalt der Figur.");
    } else {
      q = rich("Ein Rechteck ist ", u.L(W), " breit und ", u.L(H), " hoch. Oben rechts wird ein Rechteck ausgeschnitten, ", u.L(w2), " breit und ", u.L(h2), " hoch. Berechne den Flächeninhalt der Restfigur.");
    }
    return { pieces, pre, unit: u, q, sp, price: price || null };
  }

  // Haus: Rechteck mit Giebeldreieck (Level 1)
  function buildHaus(rng) {
    const u = UNIT.cm;
    const W = F(rng.pick([6, 8, 10, 12])), H = F(rng.int(4, 9)), h = F(rng.int(2, 6));
    const Wn = Number(W), Hn = Number(H), hn = Number(h);
    const pieces = [piece("rect", 1, "Rechteck", { a: W, b: H }), piece("tri", 1, "Dreieck", { g: W, h })];
    const hm = heightMark([Wn / 2, Hn], [0, Hn], [Wn / 2, Hn + hn], "h = " + u.L(h));
    const sp = {
      outline: [[0, 0], [Wn, 0], [Wn, Hn], [Wn / 2, Hn + hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
      ],
      ...hm,
    };
    const q = rich("Die Figur besteht aus einem Rechteck (", u.L(W), " breit, ", u.L(H), " hoch) und einem Giebeldreieck darauf (Grundseite ", u.L(W), ", Höhe ", u.L(h), "). Berechne den Flächeninhalt der Figur.");
    return { pieces, pre: [], unit: u, q, sp };
  }

  // Rechteck mit rechtwinkligem Dreieck rechts angesetzt (Rampe), Katheten b (waagerecht) und H (senkrecht)
  function buildRampe(rng) {
    const u = UNIT.cm;
    const W = F(rng.int(6, 12)), H = F(rng.int(4, 9)), b = F(rng.int(2, 7));
    const Wn = Number(W), Hn = Number(H), bn = Number(b);
    const pieces = [piece("rect", 1, "Rechteck", { a: W, b: H }), piece("tri", 1, "Rampe (Dreieck)", { g: b, h: H })];
    const sp = {
      outline: [[0, 0], [Wn + bn, 0], [Wn, Hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [Wn, 0], b: [Wn + bn, 0], text: u.L(b), inside: [Wn + bn / 3, 0.2 * Hn] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
      ],
      lines: [[[Wn, 0], [Wn, Hn]]],
      rights: [[[Wn, 0], [Wn + bn, 0], [Wn, Hn]]],
    };
    const q = rich("Ein Rechteck (", u.L(W), " breit, ", u.L(H), " hoch) hat rechts eine Rampe. Die Rampe ist ein rechtwinkliges Dreieck mit der waagerechten Seite ", u.L(b), " und der senkrechten Seite ", u.L(H), ". Berechne den Flächeninhalt der Figur.");
    return { pieces, pre: [], unit: u, q, sp };
  }

  // Rechteck mit Trapez als Dach (nur M-Zug)
  function buildDach(rng) {
    const u = UNIT.cm;
    const W = F(rng.int(6, 12)), H = F(rng.int(4, 8)), h = F(rng.int(2, 5));
    const t = rng.int(1, Math.floor((W.n - 2) / 2));
    const c = F(W.n - 2 * t);
    const Wn = Number(W), Hn = Number(H), hn = Number(h), tn = t;
    const pieces = [piece("rect", 1, "Rechteck", { a: W, b: H }), piece("trap", 1, "Trapez (Dach)", { a: W, c, h })];
    const hm = heightMark([tn, Hn], [Wn, Hn], [tn, Hn + hn], "h = " + u.L(h), 0.3);
    const sp = {
      outline: [[0, 0], [Wn, 0], [Wn, Hn], [Wn - tn, Hn + hn], [tn, Hn + hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
        { a: [tn, Hn + hn], b: [Wn - tn, Hn + hn], text: u.L(c), inside: [Wn / 2, Hn + hn - 0.5] },
      ],
      ...hm,
    };
    const q = rich("Ein Haus hat die Form eines Rechtecks (", u.L(W), " breit, ", u.L(H), " hoch) mit einem Trapez als Dach (parallele Seiten ", u.L(W), " und ", u.L(c), ", Höhe ", u.L(h), "). Berechne den Flächeninhalt der Figur.");
    return { pieces, pre: [], unit: u, q, sp };
  }

  // Haus mit Giebel und Anbau rechts: drei Teilflächen (Level 2)
  function buildAnbau(rng) {
    const u = UNIT.cm;
    const W = F(rng.pick([6, 8, 10])), H = F(rng.int(4, 8)), h = F(rng.int(2, 5));
    const W2 = F(rng.int(3, 7)), H2 = F(rng.int(2, H.n - 1));
    const Wn = Number(W), Hn = Number(H), hn = Number(h), w2 = Number(W2), h2 = Number(H2);
    const pieces = [
      piece("rect", 1, "Haus", { a: W, b: H }),
      piece("tri", 1, "Giebel", { g: W, h }),
      piece("rect", 1, "Anbau", { a: W2, b: H2 }),
    ];
    const hm = heightMark([Wn / 2, Hn], [0, Hn], [Wn / 2, Hn + hn], "h = " + u.L(h));
    const sp = {
      outline: [[0, 0], [Wn + w2, 0], [Wn + w2, h2], [Wn, h2], [Wn, Hn], [Wn / 2, Hn + hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [Wn, 0], b: [Wn + w2, 0], text: u.L(W2), inside: [Wn + w2 / 2, h2 / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
        { a: [Wn + w2, 0], b: [Wn + w2, h2], text: u.L(H2), inside: [Wn + w2 - 0.5, h2 / 2] },
      ],
      ...hm,
    };
    const q = rich("Ein Haus besteht aus einem Rechteck (", u.L(W), " breit, ", u.L(H), " hoch) mit Giebeldach (Höhe ", u.L(h), "). Rechts ist ein Anbau, ", u.L(W2), " breit und ", u.L(H2), " hoch. Berechne den Flächeninhalt der Figur.");
    return { pieces, pre: [], unit: u, q, sp };
  }

  // Rechteck mit dreieckiger Kerbe oben in der Mitte: Fläche wird abgezogen (Level 2)
  function buildVnotch(rng) {
    const u = UNIT.cm;
    const W = F(rng.pick([6, 8, 10, 12])), H = F(rng.int(5, 10)), h = F(rng.int(2, H.n - 2));
    const Wn = Number(W), Hn = Number(H), hn = Number(h);
    const pieces = [piece("rect", 1, "Rechteck", { a: W, b: H }), piece("tri", -1, "Kerbe (Dreieck)", { g: W, h })];
    const hm = heightMark([Wn / 2, Hn], [0, Hn], [Wn / 2, Hn - hn], "h = " + u.L(h));
    const sp = {
      outline: [[0, 0], [Wn, 0], [Wn, Hn], [Wn / 2, Hn - hn], [0, Hn]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
      ],
      ...hm,
      lines: hm.lines.concat([[[0, Hn], [Wn, Hn]]]),
    };
    const q = rich("Ein Rechteck (", u.L(W), " breit, ", u.L(H), " hoch) hat oben eine dreieckige Kerbe. Die Kerbe hat die Grundseite ", u.L(W), " und die Höhe ", u.L(h), ". Berechne den Flächeninhalt der Restfigur.");
    return { pieces, pre: [], unit: u, q, sp };
  }

  // Wand eines Hauses mit Giebel, ein Fenster wird abgezogen, Kosten pro m² (Level 3)
  function buildWand(rng) {
    const u = UNIT.m;
    const W = F(rng.int(6, 10)), H = F(rng.int(25, 30), 10), h = F(rng.int(15, 30), 10);
    const w = F(rng.int(8, 15), 10), wh = F(rng.int(10, 15), 10);
    const price = rng.pick([F(850, 100), F(900, 100), F(1150, 100), F(1250, 100), F(1400, 100)]);
    const Wn = Number(W), Hn = Number(H), hn = Number(h), wn = Number(w), whn = Number(wh);
    const pieces = [
      piece("rect", 1, "Rechteck", { a: W, b: H }),
      piece("tri", 1, "Giebel", { g: W, h }),
      piece("rect", -1, "Fenster", { a: w, b: wh }),
    ];
    const wx = (Wn - wn) / 2, y0 = 0.8;
    const hm = heightMark([Wn / 2, Hn], [0, Hn], [Wn / 2, Hn + hn], "h = " + u.L(h));
    const sp = {
      outline: [[0, 0], [Wn, 0], [Wn, Hn], [Wn / 2, Hn + hn], [0, Hn]],
      holes: [[[wx, y0], [wx + wn, y0], [wx + wn, y0 + whn], [wx, y0 + whn]]],
      sides: [
        { a: [0, 0], b: [Wn, 0], text: u.L(W), inside: [Wn / 2, Hn / 2] },
        { a: [0, 0], b: [0, Hn], text: u.L(H), inside: [Wn / 2, Hn / 2] },
        { a: [wx, y0], b: [wx + wn, y0], text: u.L(w), inside: [wx + wn / 2, y0 + whn / 2] },
        { a: [wx + wn, y0], b: [wx + wn, y0 + whn], text: u.L(wh), inside: [wx + wn / 2, y0 + whn / 2] },
      ],
      ...hm,
    };
    const q = rich("Die Vorderseite eines Hauses hat die Form eines Rechtecks (", u.L(W), " breit, ", u.L(H), " hoch) mit einem Giebeldreieck (Höhe ", u.L(h), "). Das Fenster (", u.L(w), " breit, ", u.L(wh), " hoch) wird nicht gestrichen. Malerarbeiten kosten ", eur(price), " pro m². Wie viel kostet das Streichen der Wand ohne Fenster?");
    return { pieces, pre: [], unit: u, q, sp, price };
  }

  // Garten in Form eines L (Level 3, Rasen mit Kosten)
  function buildGarten(rng) {
    const W = F(rng.int(8, 14)), H = F(rng.int(6, 12)), w2 = F(rng.int(3, W.n - 3)), h2 = F(rng.int(2, H.n - 3));
    const price = rng.pick([F(350, 100), F(450, 100), F(650, 100), F(890, 100)]);
    return buildL(UNIT.m, W, H, w2, h2, "garten", price);
  }

  const BUILDERS = {
    L: (rng, level) => {
      const W = F(rng.int(level === 2 ? 8 : 7, level === 2 ? 14 : 12)), H = F(rng.int(level === 2 ? 8 : 7, level === 2 ? 14 : 12));
      const w2 = F(rng.int(3, W.n - 3)), h2 = F(rng.int(3, H.n - 3));
      return buildL(UNIT.cm, W, H, w2, h2, level === 2 ? "cut" : "split", null);
    },
    haus: buildHaus,
    rampe: buildRampe,
    dach: buildDach,
    anbau: buildAnbau,
    vnotch: buildVnotch,
    wand: buildWand,
    garten: buildGarten,
  };

  function verifyZ(t) {
    let A = Z();
    for (const p of t._pieces) {
      const a = AREA[p.kind](p.d);
      A = p.sign < 0 ? A.sub(a) : A.add(a);
    }
    const v = t._price ? A.mul(t._price) : A;
    return v.eq(t._ans) || "Ergebnis stimmt nicht";
  }

  AG.registerType({
    id: "m7-flaeche-zusammengesetzt",
    klasse: "7",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt",
    title: "Zusammengesetzte Figuren",
    instruction: {
      1: "Zerlege die Figur in Teilflächen und berechne den Flächeninhalt.",
      2: "Zerlege die Figur oder ziehe eine Fläche ab. Berechne den Flächeninhalt.",
      3: "Berechne die Fläche und die Kosten.",
    },
    merke: [
      "Zusammengesetzte Figuren: ", { b: "Teilflächen einzeln berechnen" },
      ", dann addieren (Teilflächen) oder subtrahieren (ausgeschnittene Flächen). Beispiel: Rechteck 5 cm · 3 cm = 15 cm² und Dreieck 4 cm · 2 cm : 2 = 4 cm², also A = 15 cm² + 4 cm² = 19 cm².",
    ],
    cols: 1,
    generate(rng, level, ctx) {
      const M = !!ctx && ctx.zug === "M";
      const fams = level === 1
        ? ["L", "haus", "rampe"].concat(M ? ["dach"] : [])
        : level === 2 ? ["anbau", "vnotch", "L"] : ["wand", "garten"];
      for (let t = 0; t < 300; t++) {
        const r = BUILDERS[rng.pick(fams)](rng, level);
        if (!r) continue;
        const u = r.unit;
        const A = r.pieces.reduce((s, p) => (p.sign < 0 ? s.sub(p.area) : s.add(p.area)), Z());
        const steps = [].concat(r.pre, r.pieces.map(p => pieceRich(p, u)), [totalRich(r.pieces, u, A)]);
        let ans = A;
        if (r.price) {
          ans = A.mul(r.price);
          if (!dec2(ans)) continue;
          steps.push(rich("Kosten: ", u.A(A), " · ", eur(r.price), " = ", eur(ans)));
        }
        return {
          q: r.q,
          a: rich(r.price ? eur(ans) : u.A(A)),
          steps,
          fig: drawZ(r.sp),
          inline: false,
          _pieces: r.pieces.map(p => ({ kind: p.kind, sign: p.sign, d: p.d })),
          _price: r.price || null,
          _ans: ans,
        };
      }
      throw new Error("Zusammengesetzte Figur: keine Aufgabe erzeugt");
    },
    verify: verifyZ,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
