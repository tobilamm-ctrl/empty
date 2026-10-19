// M9 LB 4 und LB 5: Fläche regelmäßiger Vielecke, zusammengesetzte Flächen, Oberfläche und Volumen von
// Pyramide und Kegel, Prisma mit regelmäßiger Grundfläche. Mit Skizzen (Schrägbild, verdeckte Kanten gestrichelt).
// Rechnung mit π ≈ 3,14 (exakt als Bruch 314/100). Ergebnisse auf 2 Nachkommastellen, sonst gerundet mit „≈“.
(function (AG) {
  const { Frac, rich, fmtDec, fmtInt } = AG;
  const { INK, FILL } = AG.SKETCH_COLORS;

  const F = x => Frac.of(x);
  const PI = new Frac(314, 100), PIS = "3,14", SUP2 = { sup: "2" }, THIRD = { f: [1, 3] };
  // rechtwinklige Dreiecke mit ganzzahligen Seiten (Kathete, Kathete, Hypotenuse)
  const TRI = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [9, 12, 15], [12, 9, 15]];

  // ---------- Zahlen und Rechenzeilen ----------
  const tx = (x, U) => { const g = F(x); return (g.isInt() ? fmtInt(g.n) : fmtDec(g)) + (U ? " " + U : ""); };
  const ex2 = x => { const g = F(x); return g.isTerminating() && g.decimals() <= 2; };
  const rd2 = x => { const g = F(x); return new Frac(Math.round((g.n * 100) / g.d), 100); };
  const rnd = (x, U) => fmtDec(rd2(x), 2) + (U ? " " + U : "");
  const res = (x, U) => (ex2(x) ? tx(x, U) : "≈ " + rnd(x, U));
  // Rechenzeile(n) als Text: exakt in einer Zeile, sonst zusätzlich gerundet mit ≈
  function calc(expr, x, U, lhs) {
    const g = F(x);
    if (!g.isTerminating()) return [`${expr} ≈ ${rnd(g, U)}`];
    if (ex2(g)) return [`${expr} = ${tx(g, U)}`];
    return [`${expr} = ${tx(g, U)}`, `${lhs} ≈ ${rnd(g, U)}`];
  }
  // dasselbe als Rich-Zeile (für Brüche wie ⅓)
  function calcR(pre, x, U, lhs) {
    const g = F(x);
    if (!g.isTerminating()) return [rich(pre, " ≈ ", rnd(g, U))];
    if (ex2(g)) return [rich(pre, " = ", tx(g, U))];
    return [rich(pre, " = ", tx(g, U)), rich(lhs, " ≈ ", rnd(g, U))];
  }
  const rules = steps => steps.map(s => rich(s));
  // Ergebnisszeile: „A = 42 cm²“ bzw. „V ≈ 33,33 cm³“
  const ansR = (sym, x, U) => rich(sym, ex2(x) ? " = " : " ≈ ", ex2(x) ? tx(x, U) : rnd(x, U));
  // Quadratwurzel aus einer ganzen Zahl, auf 2 Stellen gerundet (Ergebnis als Dezimalbruch)
  const sqrt2 = x => Frac.of(Math.round(Math.sqrt(F(x).valueOf()) * 100) / 100);

  // ---------- Skizzen (Schrägbild, nicht maßstäblich) ----------
  const pathD = (pts, closed) => "M" + pts.map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" L") + (closed ? " Z" : "");
  function ell(cx, cy, rx, ry, t0, t1, n = 40) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
    return out;
  }

  // Pyramide mit quadratischer (oder rechteckiger) Grundfläche a × dep, Höhe h (gestrichelt), Seitenhöhe hs (gestrichelt)
  // o: { labA, labDep, labH, labS }: Beschriftung oder null (nicht gezeigt)
  function pyrFig(a, dep, h, o) {
    const W = 72, H = 46, sh = 0.45 * dep;
    const hh = Math.min(Math.max(h, 0.6 * a), 1.6 * a);
    const cb = [(a + sh) / 2, sh / 2], S0 = [cb[0], cb[1] + hh];
    const pts = [[0, 0], [a, 0], [a + sh, sh], [sh, sh], S0];
    const f = AG.fitPoints(pts, W, H, 9);
    const [FL, FR, BR, BL, S] = pts.map(f), C = f(cb);
    const mF = [(FL[0] + FR[0]) / 2, (FL[1] + FR[1]) / 2];
    const s = AG.sketch(W, H);
    s.poly([S, FL, FR], { fill: FILL });                 // vordere Seitenfläche
    s.poly([S, FR, BR], { fill: FILL, width: 0.25 });    // rechte Seitenfläche
    s.line(FL, FR); s.line(FR, BR);                      // vordere und rechte Grundkante
    s.line(FL, BL, { dash: true }); s.line(BL, BR, { dash: true });
    s.line(S, FL); s.line(S, FR); s.line(S, BR);
    s.line(S, BL, { dash: true });
    if (o.labH) {
      s.line(S, C, { dash: true });
      s.label([(S[0] + C[0]) / 2 + 3.4, (S[1] + C[1]) / 2], o.labH, { anchor: "start" });
    }
    if (o.labS) {
      s.line(S, mF, { dash: true });
      // Beschriftung im unteren Teil der vorderen Fläche, rechts neben der gestrichelten Seitenhöhe
      s.label([S[0] + 0.72 * (mF[0] - S[0]) + 1.6, S[1] + 0.72 * (mF[1] - S[1])], o.labS, { anchor: "start" });
    }
    if (o.labA) s.side(FL, FR, o.labA);
    if (o.labDep) s.side(FR, BR, o.labDep);
    return s.done();
  }

  // Kegel: Grundkreis als Ellipse (Radius r), Spitze darüber. o: { labR, labH, labS }
  function konusFig(r, h, o) {
    const W = 62, H = 46, R = 1, ry = 0.3 * R;
    const hh = Math.min(Math.max(h / r, 0.7), 2.2) * R;
    const pts = [[-R, -ry], [R, -ry], [-R, ry], [R, ry], [0, hh]];
    const f = AG.fitPoints(pts, W, H, 9);
    const S = f([0, hh]), C = f([0, 0]), L = f([-R, 0]), Rr = f([R, 0]);
    const body = [[0, hh], ...ell(0, 0, R, ry, Math.PI, 2 * Math.PI, 30)];
    const s = AG.sketch(W, H);
    s.path(pathD(body.map(f), true), { fill: FILL, stroke: "none" });
    s.path(pathD(ell(0, 0, R, ry, 0, 2 * Math.PI, 60).map(f), true), { fill: FILL });
    s.path(pathD(ell(0, 0, R, ry, 0, Math.PI, 30).map(f)), { dash: true });       // hintere Hälfte des Grundkreises
    s.path(pathD(ell(0, 0, R, ry, Math.PI, 2 * Math.PI, 30).map(f)));            // vordere Hälfte
    s.line(S, L); s.line(S, Rr);
    if (o.labH) {
      s.line(S, C, { dash: true });
      s.label([C[0] - 2.6, (S[1] + C[1]) / 2], o.labH, { anchor: "end" });
    }
    s.line(C, Rr, { width: 0.3 }); s.circle(C, 0.5, { fill: INK });
    if (o.labR) s.label([(C[0] + Rr[0]) / 2, C[1] - 3.2], o.labR);
    if (o.labS) s.label([(S[0] + Rr[0]) / 2 + 2.6, (S[1] + Rr[1]) / 2], o.labS, { anchor: "start" });
    return s.done();
  }

  // Sechseckprisma: regelmäßiges Sechseck (Seite s) vorn, Körper nach hinten rechts, Höhe h
  function hexFig(s0, o) {
    const W = 66, H = 46, sh = 0.5 * s0;
    const front = [0, 1, 2, 3, 4, 5].map(k => { const t = (-120 + 60 * k) * Math.PI / 180; return [s0 * Math.cos(t), s0 * Math.sin(t)]; });
    const back = front.map(p => [p[0] + sh, p[1] + sh]);
    const f = AG.fitPoints(front.concat(back), W, H, 9);
    const P = front.map(f), B = back.map(f);
    const s = AG.sketch(W, H);
    s.poly(P);
    s.poly(B, { dash: true, fill: "none" });
    for (let k = 0; k < 6; k++) s.line(P[k], B[k]);
    if (o.labS) s.side(P[0], P[1], o.labS);                  // untere Vorderkante (Index 0 → 1)
    if (o.labH) s.label([(P[1][0] + B[1][0]) / 2 + 2.6, (P[1][1] + B[1][1]) / 2], o.labH, { anchor: "start" });
    return s.done();
  }

  // Dach: Rechteck w × h mit aufgesetztem Dreieck (Grundseite w, Höhe t)
  function dachFig(w, h, t, o) {
    const W = 84, H = 46;
    const P = [[0, 0], [w, 0], [w, h], [w / 2, h + t], [0, h]];
    const f = AG.fitPoints(P, W, H, 14);
    const Q = P.map(f), top = f([w / 2, h]);
    const s = AG.sketch(W, H);
    s.poly(Q);
    s.line(Q[3], top, { dash: true });
    if (o.labT) s.label([top[0] + 2.4, (Q[3][1] + top[1]) / 2], o.labT, { anchor: "start" });
    if (o.labW) s.side(Q[0], Q[1], o.labW);
    if (o.labH) s.side(Q[4], Q[0], o.labH);
    return s.done();
  }

  // Rechteck mit Halbkreisausschnitt am unteren Rand (Durchmesser 2r) und Dreieck oben
  function fensterFig(w, h, t, r, o) {
    const W = 84, H = 46;
    const P = [[0, 0], [w, 0], [w, h], [w / 2, h + t], [0, h]];
    const f = AG.fitPoints(P, W, H, 14);
    const Q = P.map(f), L = f([w / 2 - r, 0]), Rr = f([w / 2 + r, 0]);
    const rm = f([r, 0])[0] - f([0, 0])[0];
    const s = AG.sketch(W, H);
    s.poly(Q);
    s.path(`M${L[0]} ${L[1]} A${rm} ${rm} 0 0 1 ${Rr[0]} ${Rr[1]} Z`, { fill: "#fff", width: 0.3 });
    const top = f([w / 2, h]);
    s.line(Q[3], top, { dash: true });
    if (o.labT) s.label([top[0] + 2.4, (Q[3][1] + top[1]) / 2], o.labT, { anchor: "start" });
    if (o.labW) s.side(Q[0], Q[1], o.labW);
    if (o.labH) s.side(Q[4], Q[0], o.labH);
    return s.done();
  }

  // Rechtwinkliges Trapez (a unten, c oben, Höhe h, schräge Seite L) mit Viertelkreis (Radius r) an der unteren linken Ecke
  function trapFig(a, c, h, r, o) {
    const W = 84, H = 46;
    const P = [[0, 0], [a, 0], [c, h], [0, h]];
    const f = AG.fitPoints(P.concat([[-0.3 * a, 0]]), W, H, 12);
    const Q = P.map(f), A0 = f([r, 0]), B0 = f([0, r]);
    const rm = f([r, 0])[0] - f([0, 0])[0];
    const s = AG.sketch(W, H);
    s.path(`M${A0[0]} ${A0[1]} L${Q[1][0]} ${Q[1][1]} L${Q[2][0]} ${Q[2][1]} L${Q[3][0]} ${Q[3][1]} L${B0[0]} ${B0[1]} A${rm} ${rm} 0 0 0 ${A0[0]} ${A0[1]} Z`, { fill: FILL });
    if (o.labA) s.side(Q[0], Q[1], o.labA, { inside: Q[3] });
    if (o.labC) s.side(Q[2], Q[3], o.labC, { inside: Q[0] });
    if (o.labH) s.label([Q[3][0] - 1.6, (Q[3][1] + Q[0][1]) / 2], o.labH, { anchor: "end" });   // linke Seite außen
    if (o.labL) s.side(Q[1], Q[2], o.labL, { inside: Q[0] });
    s.label(f([r * 0.42, r * 0.42]), o.labR, { anchor: "middle" });
    return s.done();
  }

  // ---------- Typ 1: Fläche regelmäßiger Vielecke ----------
  const VIELECK = { 5: "Fünfeck", 6: "Sechseck", 8: "Achteck" };
  AG.registerType({
    id: "m9-vieleck-flaeche",
    klasse: "9",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Vielecke",
    title: "Fläche regelmäßiger Vielecke",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt A des regelmäßigen Vielecks.",
      2: "Berechne den Flächeninhalt A des regelmäßigen Vielecks.",
      3: "Berechne den Flächeninhalt A des regelmäßigen Sechsecks. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Regelmäßiges Vieleck mit n Seiten: ", { b: "A = n · s · h_s : 2" },
      " (s Seitenlänge, h_s Höhe des Bestimmungsdreiecks vom Mittelpunkt zur Seitenmitte). ",
      "Beispiel: Sechseck mit s = 4 cm und h_s = 3,5 cm → A = 6 · 4 cm · 3,5 cm : 2 = 42 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const n = rng.pick([5, 6, 8]), s = new Frac(rng.int(3, 24)), h = hsOf(n, s);
        const P = new Frac(n).mul(s).mul(h), A = P.div(2);
        return {
          q: rich(`Ein regelmäßiges ${VIELECK[n]} hat die Seitenlänge s = ${tx(s, "cm")} und die Höhe des Bestimmungsdreiecks h_s = ${tx(h, "cm")}. Berechne den Flächeninhalt A.`),
          a: rich("A = ", tx(A, "cm²")),
          steps: rules([
            "A = n · s · h_s : 2",
            `A = ${n} · ${tx(s, "cm")} · ${tx(h, "cm")} : 2`,
            ...calc(`A = ${tx(P, "cm²")} : 2`, A, "cm²", "A"),
          ]),
          fig: vieleckFig(n, Number(s), `s = ${tx(s, "cm")}`, `h_s = ${tx(h, "cm")}`),
          inline: false,
        };
      }
      if (level === 2) {
        const n = rng.pick([5, 6, 8]), s = new Frac(rng.int(25, 120), 10), h = hsOf(n, s);
        const P = new Frac(n).mul(s).mul(h), A = P.div(2);
        return {
          q: rich(`Ein regelmäßiges ${VIELECK[n]} hat die Seitenlänge s = ${tx(s, "cm")}. Der Abstand von der Mitte zu einer Seite (Höhe h_s des Bestimmungsdreiecks) beträgt ${tx(h, "cm")}. Berechne den Flächeninhalt A.`),
          a: ansR("A", A, "cm²"),
          steps: rules([
            "A = n · s · h_s : 2",
            `A = ${n} · ${tx(s, "cm")} · ${tx(h, "cm")} : 2`,
            ...calc(`A = ${tx(P, "cm²")} : 2`, A, "cm²", "A"),
          ]),
          fig: vieleckFig(n, Number(s), `s = ${tx(s, "cm")}`, `h_s = ${tx(h, "cm")}`),
          inline: false,
        };
      }
      // Niveau 3: Sechseck, h_s über den Satz des Pythagoras aus s berechnen (Bestimmungsdreieck: Hypotenuse s, Kathete s/2)
      const s = new Frac(rng.int(4, 30)), half = s.div(2);
      const D2 = s.mul(s).sub(half.mul(half));
      const h = sqrt2(D2), P = new Frac(6).mul(s).mul(h), A = P.div(2);
      const lead = rng.pick(["Berechne den Flächeninhalt A.", "Wie groß ist die Fläche A?"]);
      return {
        q: rich(`Ein regelmäßiges Sechseck hat die Seitenlänge s = ${tx(s, "cm")}. ${lead} Runde auf 2 Nachkommastellen.`),
        a: rich("A ≈ ", tx(A, "cm²")),
        steps: rules([
          "Bestimmungsdreieck: h_s² = s² − (s : 2)²",
          `h_s² = ${tx(s)}² cm² − ${tx(half)}² cm² = ${tx(D2, "cm²")}`,
          `h_s = √${tx(D2, "cm²")} ≈ ${tx(h, "cm")}`,
          "A = 6 · s · h_s : 2",
          ...calc(`A = 6 · ${tx(s, "cm")} · ${tx(h, "cm")} : 2`, A, "cm²", "A"),
        ]),
        fig: vieleckFig(6, Number(s), `s = ${tx(s, "cm")}`, "h_s = ?"),
        inline: false,
      };
    },
  });

  // Höhe h_s des Bestimmungsdreiecks passend zur Seitenlänge s, auf mm gerundet
  function hsOf(n, s) {
    return new Frac(Math.round(Number(s) * 10 / (2 * Math.tan(Math.PI / n))), 10);
  }

  // Regelmäßiges Vieleck: Seite unten waagerecht, Mitte bis Seitenmitte (unten) gestrichelt mit Höhe h_s
  function vieleckFig(n, s, labS, labH) {
    const W = 66, H = 46;
    const R = s / (2 * Math.sin(Math.PI / n));
    const pts = [];
    for (let k = 0; k < n; k++) { const t = -Math.PI / 2 - Math.PI / n + 2 * Math.PI * k / n; pts.push([R * Math.cos(t), R * Math.sin(t)]); }
    const f = AG.fitPoints(pts.concat([[0, 0]]), W, H, 9);
    const P = pts.map(f), C = f([0, 0]), M = f([0, -R * Math.cos(Math.PI / n)]);
    const s2 = AG.sketch(W, H);
    s2.poly(P);
    s2.line(C, M, { dash: true });
    s2.circle(C, 0.5, { fill: INK });
    s2.side(P[0], P[1], labS, { inside: C });
    s2.label([(C[0] + M[0]) / 2 + 2.6, (C[1] + M[1]) / 2], labH, { anchor: "start" });
    return s2.done();
  }

  // ---------- Typ 2: Zusammengesetzte Flächen (Rechteck + Dreieck, Trapez mit Viertelkreis, Rechteck mit Halbkreisausschnitt) ----------
  function dachAufgabe(rng) {
    const w = 2 * rng.int(3, 8), h = rng.int(3, 9), t = rng.int(2, 6);
    const R = new Frac(w * h), T = new Frac(w * t, 2), A = R.add(T);
    return {
      q: rich(`Die Figur besteht aus einem Rechteck (Breite w = ${tx(w, "cm")}, Höhe h = ${tx(h, "cm")}) und einem aufgesetzten Dreieck (Grundseite w, Höhe t = ${tx(t, "cm")}). Berechne den Flächeninhalt A der Figur.`),
      a: rich("A = ", tx(A, "cm²")),
      steps: rules([
        "A = A_Rechteck + A_Dreieck",
        `A_Rechteck = w · h = ${tx(w, "cm")} · ${tx(h, "cm")} = ${tx(R, "cm²")}`,
        `A_Dreieck = w · t : 2 = ${tx(w, "cm")} · ${tx(t, "cm")} : 2 = ${tx(T, "cm²")}`,
        `A = ${tx(R, "cm²")} + ${tx(T, "cm²")} = ${tx(A, "cm²")}`,
      ]),
      fig: dachFig(w, h, t, { labW: `w = ${tx(w, "cm")}`, labH: `h = ${tx(h, "cm")}`, labT: `t = ${tx(t, "cm")}` }),
      inline: false,
    };
  }

  function trapAufgabe(rng) {
    const [dx, h, L] = rng.pick(TRI);            // dx = a − c, h Höhe, L schräge Seite
    const a = rng.int(dx + 4, dx + 10), c = a - dx;
    const r = 2 * rng.int(1, Math.floor(Math.min(h, c) / 2));   // r gerade, damit alle Werte genau sind
    const At = new Frac((a + c) * h, 2), Vk = PI.mul(r * r).div(4), A = At.sub(Vk);
    const bog = PI.mul(r).div(2), U = new Frac(a - r + c + (h - r) + L).add(bog);
    const askU = rng.chance(0.5);
    const steps = [
      "A = A_Trapez − A_Viertelkreis",
      `A_Trapez = (a + c) · h : 2 = (${tx(a, "cm")} + ${tx(c, "cm")}) · ${tx(h, "cm")} : 2 = ${tx(At, "cm²")}`,
      `A_Viertelkreis = π · r² : 4 = ${PIS} · (${tx(r, "cm")})² : 4 = ${tx(Vk, "cm²")}`,
      `A = ${tx(At, "cm²")} − ${tx(Vk, "cm²")} = ${tx(A, "cm²")}`,
    ];
    let a2 = rich("A = ", tx(A, "cm²"));
    if (askU) {
      steps.push(
        "U = (a − r) + L + c + (h − r) + Viertelkreisbogen",
        `Viertelkreisbogen = π · r : 2 = ${PIS} · ${tx(r, "cm")} : 2 = ${tx(bog, "cm")}`,
        `U = ${tx(a - r, "cm")} + ${tx(L, "cm")} + ${tx(c, "cm")} + ${tx(h - r, "cm")} + ${tx(bog, "cm")} = ${tx(U, "cm")}`,
      );
      a2 = rich("A = ", tx(A, "cm²"), "; U = ", tx(U, "cm"));
    }
    return {
      q: rich(`Ein rechtwinkliges Trapez hat die parallelen Seiten a = ${tx(a, "cm")} und c = ${tx(c, "cm")}, die Höhe h = ${tx(h, "cm")} und die schräge Seite L = ${tx(L, "cm")}. An der unteren linken Ecke wird ein Viertelkreis mit dem Radius r = ${tx(r, "cm")} ausgeschnitten. Berechne den Flächeninhalt A${askU ? " und den Umfang U" : ""} der verbleibenden Figur.`),
      a: a2,
      steps: rules(steps),
      fig: trapFig(a, c, h, r, { labA: `a = ${tx(a, "cm")}`, labC: `c = ${tx(c, "cm")}`, labH: `h = ${tx(h, "cm")}`, labL: `L = ${tx(L, "cm")}`, labR: `r = ${tx(r, "cm")}` }),
      inline: false,
    };
  }

  function fensterAufgabe(rng) {
    const k = rng.int(2, 5), w = 4 * k, r = k, d = 2 * k;   // Halbkreisausschnitt mit Durchmesser d = w : 2
    const h = rng.int(k + 2, 10), t = rng.int(2, 6);
    const R = new Frac(w * h), T = new Frac(w * t, 2), Hk = PI.mul(r * r).div(2), A = R.add(T).sub(Hk);
    return {
      q: rich(`Ein Rechteck mit der Breite w = ${tx(w, "cm")} und der Höhe h = ${tx(h, "cm")} trägt ein Dreieck mit der Grundseite w und der Höhe t = ${tx(t, "cm")}. Unten ist ein Halbkreisausschnitt mit dem Durchmesser d = ${tx(d, "cm")} herausgeschnitten. Berechne den Flächeninhalt A der Figur.`),
      a: rich("A = ", tx(A, "cm²")),
      steps: rules([
        "A = A_Rechteck + A_Dreieck − A_Halbkreis",
        `A_Rechteck = w · h = ${tx(w, "cm")} · ${tx(h, "cm")} = ${tx(R, "cm²")}`,
        `A_Dreieck = w · t : 2 = ${tx(w, "cm")} · ${tx(t, "cm")} : 2 = ${tx(T, "cm²")}`,
        `r = d : 2 = ${tx(d, "cm")} : 2 = ${tx(r, "cm")}`,
        `A_Halbkreis = π · r² : 2 = ${PIS} · (${tx(r, "cm")})² : 2 = ${tx(Hk, "cm²")}`,
        `A = ${tx(R, "cm²")} + ${tx(T, "cm²")} − ${tx(Hk, "cm²")} = ${tx(A, "cm²")}`,
      ]),
      fig: fensterFig(w, h, t, r, { labW: `w = ${tx(w, "cm")}`, labH: `h = ${tx(h, "cm")}`, labT: `t = ${tx(t, "cm")}` }),
      inline: false,
    };
  }

  AG.registerType({
    id: "m9-flaeche-zusammengesetzt",
    klasse: "9",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – zusammengesetzte Figuren",
    title: "Zusammengesetzte Flächen",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt A der Figur. Zerlege die Figur in Teilflächen.",
      2: "Berechne den Flächeninhalt A bzw. den Umfang U der Figur. Rechne mit π ≈ 3,14.",
      3: "Berechne den Flächeninhalt A der Figur. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Zusammengesetzte Figur: in Teilflächen zerlegen, dann addieren oder subtrahieren. Ausschnitte werden abgezogen. ",
      "Beispiel: Rechteck 6 cm × 4 cm mit Dreieck (Grundseite 6 cm, Höhe 2 cm) → A = 24 cm² + 6 cm² = 30 cm².",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return dachAufgabe(rng);
      if (level === 2) return trapAufgabe(rng);
      return rng.chance(0.5) ? fensterAufgabe(rng) : trapAufgabe(rng);
    },
  });

  // ---------- Typ 3: Oberfläche von Pyramide und Kegel ----------
  AG.registerType({
    id: "m9-pyramide-kegel-oberflaeche",
    klasse: "9",
    zug: "M",
    lb: "4",
    lbTitle: "Flächeninhalt – Körper",
    title: "Oberfläche von Pyramide und Kegel",
    topic: "koerper",
    instruction: {
      1: "Berechne die Oberfläche O des Körpers. Rechne mit π ≈ 3,14.",
      2: "Berechne die Oberfläche O bzw. die Mantelfläche M. Rechne mit π ≈ 3,14.",
      3: "Berechne die fehlende Seitenhöhe und die Oberfläche O. Rechne mit π ≈ 3,14. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Quadratische Pyramide: ", { b: "O = G + 4 · a · h_s : 2" }, " mit G = a². Kegel: ", { b: "O = π · r² + π · r · s" },
      " (s Mantellinie). Im Bestimmungsdreieck gilt der Satz des Pythagoras: s² = r² + h². ",
      "Beispiel: Pyramide a = 6 cm, h_s = 5 cm → O = 36 cm² + 4 · 6 cm · 5 cm : 2 = 96 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      const [t0, t1, t2] = rng.pick(TRI), k = rng.int(1, 4);
      if (rng.chance(0.5)) return pyramide(rng, level, t0 * k, t1 * k, t2 * k);
      if (level === 2) {
        // Mantel und Oberfläche brauchen nur r und s: schlanker Kegel, Mantellinie höchstens 25 cm (h nur für die Skizze)
        const r = rng.int(3, 8), sl = rng.int(2 * r, 25);
        return kegel(rng, level, r, Math.round(Math.sqrt(sl * sl - r * r)), sl);
      }
      return kegel(rng, level, t0 * k, t1 * k, t2 * k);
    },
  });

  function pyramide(rng, level, half, h, hs) {
    const a = new Frac(2 * half), H = new Frac(h), HS = new Frac(hs);
    const G = a.mul(a), M = new Frac(4).mul(a).mul(HS).div(2), O = G.add(M);
    const restSteps = [
      "G = a · a",
      `G = ${tx(a, "cm")} · ${tx(a, "cm")} = ${tx(G, "cm²")}`,
      "M = 4 · a · h_s : 2",
      `M = 4 · ${tx(a, "cm")} · ${tx(HS, "cm")} : 2 = ${tx(M, "cm²")}`,
      "O = G + M",
      `O = ${tx(G, "cm²")} + ${tx(M, "cm²")} = ${tx(O, "cm²")}`,
    ];
    if (level < 3) {
      return {
        q: rich(`Eine quadratische Pyramide hat die Grundkante a = ${tx(a, "cm")} und die Seitenhöhe h_s = ${tx(HS, "cm")}. Berechne die Oberfläche O.`),
        a: rich("O = ", tx(O, "cm²")),
        steps: rules(restSteps),
        fig: pyrFig(Number(a), Number(a), Number(H), { labA: `a = ${tx(a, "cm")}`, labS: `h_s = ${tx(HS, "cm")}` }),
        inline: false,
      };
    }
    return {
      q: rich(`Ein Pyramidendach hat die quadratische Grundfläche mit der Kante a = ${tx(a, "cm")} und die Höhe h = ${tx(H, "cm")}. Das Dach besteht nur aus den vier Seitenflächen (ohne Boden). Berechne die Seitenhöhe h_s und die Fläche O der vier Seitenflächen.`),
      a: rich("O = ", tx(M, "cm²")),
      steps: rules([
        "Bestimmungsdreieck: h_s² = h² + (a : 2)²",
        `h_s² = ${tx(H, "cm")}² + ${tx(half, "cm")}² = ${tx(H.mul(H).add(new Frac(half * half)), "cm²")}`,
        `h_s = √${tx(HS.mul(HS), "cm²")} = ${tx(HS, "cm")}`,
        "O = 4 · a · h_s : 2 (nur Seitenflächen)",
        `O = 4 · ${tx(a, "cm")} · ${tx(HS, "cm")} : 2 = ${tx(M, "cm²")}`,
      ]),
      fig: pyrFig(Number(a), Number(a), Number(H), { labA: `a = ${tx(a, "cm")}`, labH: `h = ${tx(H, "cm")}`, labS: "h_s = ?" }),
      inline: false,
    };
  }

  function kegel(rng, level, r, h, s) {
    const R = new Frac(r), H = new Frac(h), S = new Frac(s);
    const G = PI.mul(R).mul(R), M = PI.mul(R).mul(S), O = G.add(M);
    if (level === 3) {
      return {
        q: rich(`Ein Kegel hat den Grundkreisradius r = ${tx(R, "cm")} und die Höhe h = ${tx(H, "cm")}. Berechne die Mantellinie s und die Oberfläche O.`),
        a: rich("O = ", tx(O, "cm²")),
        steps: rules([
          "Bestimmungsdreieck: s² = r² + h²",
          `s² = ${tx(R, "cm")}² + ${tx(H, "cm")}² = ${tx(S.mul(S), "cm²")}`,
          `s = √${tx(S.mul(S), "cm²")} = ${tx(S, "cm")}`,
          "G = π · r²",
          `G = ${PIS} · (${tx(R, "cm")})² = ${tx(G, "cm²")}`,
          "M = π · r · s",
          `M = ${PIS} · ${tx(R, "cm")} · ${tx(S, "cm")} = ${tx(M, "cm²")}`,
          "O = G + M",
          `O = ${tx(G, "cm²")} + ${tx(M, "cm²")} = ${tx(O, "cm²")}`,
        ]),
        fig: konusFig(r, h, { labR: `r = ${tx(R, "cm")}`, labH: `h = ${tx(H, "cm")}`, labS: "s = ?" }),
        inline: false,
      };
    }
    if (level === 2) {
      // Spitztüte ohne Boden: nur die Mantelfläche
      return {
        q: rich(`Eine Spitztüte hat die Form eines Kegelmantels mit dem Radius r = ${tx(R, "cm")} und der Mantellinie s = ${tx(S, "cm")}. Wie viel Papier braucht man für die Tüte? (Die Tüte hat keinen Boden.)`),
        a: rich("M = ", tx(M, "cm²")),
        steps: rules([
          "M = π · r · s",
          `M = ${PIS} · ${tx(R, "cm")} · ${tx(S, "cm")} = ${tx(M, "cm²")}`,
        ]),
        fig: konusFig(r, h, { labR: `r = ${tx(R, "cm")}`, labS: `s = ${tx(S, "cm")}` }),
        inline: false,
      };
    }
    return {
      q: rich(`Ein Kegel hat den Radius r = ${tx(R, "cm")} und die Mantellinie s = ${tx(S, "cm")}. Berechne seine Oberfläche O.`),
      a: rich("O = ", tx(O, "cm²")),
      steps: rules([
        "G = π · r²",
        `G = ${PIS} · (${tx(R, "cm")})² = ${tx(G, "cm²")}`,
        "M = π · r · s",
        `M = ${PIS} · ${tx(R, "cm")} · ${tx(S, "cm")} = ${tx(M, "cm²")}`,
        "O = G + M",
        `O = ${tx(G, "cm²")} + ${tx(M, "cm²")} = ${tx(O, "cm²")}`,
      ]),
      fig: konusFig(r, h, { labR: `r = ${tx(R, "cm")}`, labS: `s = ${tx(S, "cm")}` }),
      inline: false,
    };
  }

  // ---------- Typ 4: Prisma mit regelmäßiger sechseckiger Grundfläche ----------
  AG.registerType({
    id: "m9-prisma-vieleck-volumen",
    klasse: "9",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Prismen, Pyramiden, Kegel",
    title: "Prisma mit Sechseck als Grundfläche",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen V des Prismas.",
      2: "Berechne das Volumen V des Prismas. Die Grundfläche ist ein regelmäßiges Sechseck.",
      3: "Berechne das Volumen V des Prismas. Runde auf 2 Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Prisma: ", { b: "V = G · h" }, " (G Grundfläche, h Höhe des Prismas). Regelmäßiges Sechseck mit Seite s: G = 6 · s · h_s : 2. ",
      "Beispiel: s = 4 cm, h_s = 3,5 cm, Prismenhöhe 10 cm → G = 42 cm², V = 42 cm² · 10 cm = 420 cm³.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const G = rng.int(20, 120), h = rng.int(5, 20);
        const V = new Frac(G * h);
        return {
          q: rich(`Ein Prisma hat als Grundfläche ein regelmäßiges Sechseck mit dem Flächeninhalt G = ${tx(G, "cm²")}. Die Höhe des Prismas beträgt h = ${tx(h, "cm")}. Berechne das Volumen V.`),
          a: rich("V = ", tx(V, "cm³")),
          steps: rules(["V = G · h", `V = ${tx(G, "cm²")} · ${tx(h, "cm")} = ${tx(V, "cm³")}`]),
          fig: hexFig(3, { labH: `h = ${tx(h, "cm")}` }),
          inline: false,
        };
      }
      if (level === 2) {
        const s = rng.int(3, 10), hs = hsOf(6, new Frac(s)), h = rng.int(5, 15);
        const G = new Frac(6 * s).mul(hs).div(2), V = G.mul(h);
        return {
          q: rich(`Ein Prisma hat als Grundfläche ein regelmäßiges Sechseck mit der Seitenlänge s = ${tx(s, "cm")} und der Höhe des Bestimmungsdreiecks h_s = ${tx(hs, "cm")}. Das Prisma ist h = ${tx(h, "cm")} hoch. Berechne das Volumen V.`),
          a: ansR("V", V, "cm³"),
          steps: rules([
            "G = 6 · s · h_s : 2",
            `G = 6 · ${tx(s, "cm")} · ${tx(hs, "cm")} : 2 = ${tx(G, "cm²")}`,
            "V = G · h",
            ...calc(`V = ${tx(G, "cm²")} · ${tx(h, "cm")}`, V, "cm³", "V"),
          ]),
          fig: hexFig(s, { labS: `s = ${tx(s, "cm")}`, labH: `h = ${tx(h, "cm")}` }),
          inline: false,
        };
      }
      // Niveau 3: h_s über den Satz des Pythagoras (Seitenlänge s gerade), Volumen mit gerundeter Grundfläche
      const s = new Frac(2 * rng.int(3, 8)), half = s.div(2);
      const hs = sqrt2(s.mul(s).sub(half.mul(half))), G = new Frac(6).mul(s).mul(hs).div(2), h = rng.int(6, 20);
      const V = G.mul(h);
      return {
        q: rich(`Eine Geschenkschachtel hat die Form eines Prismas mit einem regelmäßigen Sechseck als Grundfläche (Seitenlänge s = ${tx(s, "cm")}). Es ist h = ${tx(h, "cm")} hoch. Berechne das Volumen V. Runde auf 2 Nachkommastellen.`),
        a: rich("V ≈ ", tx(V, "cm³")),
        steps: rules([
          "Bestimmungsdreieck: h_s² = s² − (s : 2)²",
          `h_s² = ${tx(s)}² cm² − ${tx(half)}² cm² = ${tx(s.mul(s).sub(half.mul(half)), "cm²")}`,
          `h_s = √${tx(s.mul(s).sub(half.mul(half)), "cm²")} ≈ ${tx(hs, "cm")}`,
          "G = 6 · s · h_s : 2",
          ...calc(`G = 6 · ${tx(s, "cm")} · ${tx(hs, "cm")} : 2`, G, "cm²", "G"),
          "V = G · h",
          ...calc(`V = ${tx(G, "cm²")} · ${tx(h, "cm")}`, V, "cm³", "V"),
        ]),
        fig: hexFig(Number(s), { labS: `s = ${tx(s, "cm")}`, labH: `h = ${tx(h, "cm")}` }),
        inline: false,
      };
    },
  });

  // ---------- Typ 5: Volumen von Pyramide und Kegel ----------
  AG.registerType({
    id: "m9-pyramide-kegel-volumen",
    klasse: "9",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Prismen, Pyramiden, Kegel",
    title: "Volumen von Pyramide und Kegel",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen V. Rechne mit π ≈ 3,14.",
      2: "Berechne das Volumen V des zusammengesetzten Körpers. Rechne mit π ≈ 3,14.",
      3: "Berechne die gesuchte Höhe h. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Pyramide und Kegel haben bei gleicher Grundfläche und Höhe nur ein Drittel des Volumens eines Prismas: ",
      { b: "V = ⅓ · G · h" }, " (G Grundfläche, h Höhe). Kegel: G = π · r². ",
      "Beispiel: quadratische Pyramide a = 3 cm, h = 4 cm → V = ⅓ · 9 cm² · 4 cm = 12 cm³.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const v = rng.int(0, 2);
        if (v === 2) {
          const r = rng.int(2, 9), h = rng.int(3, 15), R = new Frac(r), H = new Frac(h);
          const G = PI.mul(R).mul(R), V = G.mul(H).div(3);
          return {
            q: rich(`Ein Kegel hat den Radius r = ${tx(R, "cm")} und die Höhe h = ${tx(H, "cm")}. Berechne das Volumen V.`),
            a: ansR("V", V, "cm³"),
            steps: rules([
              "V = ⅓ · G · h mit G = π · r²",
              `G = ${PIS} · (${tx(R, "cm")})² = ${tx(G, "cm²")}`,
              ...calcR(rich("V = ", THIRD, " · ", tx(G, "cm²"), " · ", tx(H, "cm")), V, "cm³", "V"),
            ]),
            fig: konusFig(r, h, { labR: `r = ${tx(R, "cm")}`, labH: `h = ${tx(H, "cm")}` }),
            inline: false,
          };
        }
        const a = rng.int(3, 12), b = v === 0 ? a : rng.int(3, 10), h = rng.int(3, 15);
        const G = new Frac(a * b), H = new Frac(h), V = G.mul(H).div(3);
        const quad = v === 0;
        return {
          q: rich(quad
            ? `Eine quadratische Pyramide hat die Grundkante a = ${tx(a, "cm")} und die Höhe h = ${tx(H, "cm")}. Berechne das Volumen V.`
            : `Eine Pyramide hat als Grundfläche ein Rechteck mit a = ${tx(a, "cm")} und b = ${tx(b, "cm")}. Die Höhe beträgt h = ${tx(H, "cm")}. Berechne das Volumen V.`),
          a: ansR("V", V, "cm³"),
          steps: rules([
            "V = ⅓ · G · h",
            quad ? `G = ${tx(a, "cm")} · ${tx(a, "cm")} = ${tx(G, "cm²")}` : `G = a · b = ${tx(a, "cm")} · ${tx(b, "cm")} = ${tx(G, "cm²")}`,
            ...calcR(rich("V = ", THIRD, " · ", tx(G, "cm²"), " · ", tx(H, "cm")), V, "cm³", "V"),
          ]),
          fig: pyrFig(a, b, h, { labA: `a = ${tx(a, "cm")}`, labDep: quad ? null : `b = ${tx(b, "cm")}`, labH: `h = ${tx(H, "cm")}` }),
          inline: false,
        };
      }
      if (level === 2) {
        // zusammengesetzt: Zylinder mit Kegeldach (gleicher Radius) oder Quader mit Pyramidendach
        if (rng.chance(0.5)) {
          const r = rng.int(2, 8), h1 = rng.int(4, 12), j = rng.int(1, 4), h2 = 3 * j;
          const Zv = PI.mul(r * r).mul(h1), Kv = PI.mul(r * r).mul(h2).div(3), V = Zv.add(Kv);
          return {
            q: rich(`Ein Vorratsbehälter besteht aus einem Zylinder mit dem Radius r = ${tx(r, "cm")} und der Höhe h₁ = ${tx(h1, "cm")} sowie einem aufgesetzten Kegel mit derselben Grundfläche und der Höhe h₂ = ${tx(h2, "cm")}. Berechne das Gesamtvolumen V.`),
            a: ansR("V", V, "cm³"),
            steps: rules([
              "V = V_Zylinder + V_Kegel",
              ...calc(`V_Zylinder = ${PIS} · (${tx(r, "cm")})² · ${tx(h1, "cm")}`, Zv, "cm³", "V_Zylinder"),
              ...calcR(rich("V_Kegel = ", THIRD, " · ", PIS, " · (", tx(r, "cm"), ")² · ", tx(h2, "cm")), Kv, "cm³", "V_Kegel"),
              ...calc(`V = ${tx(Zv, "cm³")} + ${tx(Kv, "cm³")}`, V, "cm³", "V"),
            ]),
            fig: null,
            inline: false,
          };
        }
        const a = rng.int(3, 8), b = rng.int(3, 8), h1 = rng.int(3, 8);
        const h2 = 3 * rng.int(1, Math.max(1, Math.floor(Math.min(a, b, h1) / 3)));   // Dach nicht höher als Wand und Grundkante
        const Qv = new Frac(a * b * h1), Pv = new Frac(a * b * h2).div(3), V = Qv.add(Pv);
        return {
          q: rich(`Ein Gebäude besteht aus einem Quader mit der Grundfläche a = ${tx(a, "m")} × b = ${tx(b, "m")} und der Höhe h₁ = ${tx(h1, "m")} sowie einem aufgesetzten Pyramidendach mit derselben Grundfläche und der Höhe h₂ = ${tx(h2, "m")}. Berechne das Gesamtvolumen V.`),
          a: ansR("V", V, "m³"),
          steps: rules([
            "V = V_Quader + V_Pyramide",
            `V_Quader = a · b · h₁ = ${tx(a, "m")} · ${tx(b, "m")} · ${tx(h1, "m")} = ${tx(Qv, "m³")}`,
            ...calcR(rich("V_Pyramide = ", THIRD, " · ", tx(a, "m"), " · ", tx(b, "m"), " · ", tx(h2, "m")), Pv, "m³", "V_Pyramide"),
            ...calc(`V = ${tx(Qv, "m³")} + ${tx(Pv, "m³")}`, V, "m³", "V"),
          ]),
          fig: null,
          inline: false,
        };
      }
      // Niveau 3: Umkehraufgabe – Höhe aus dem Volumen (h durch 3 teilbar, damit V genau ist)
      if (rng.chance(0.5)) {
        const a = rng.int(3, 10), h = 3 * rng.int(1, 5), G = new Frac(a * a), V = G.mul(h).div(3);
        return {
          q: rich(`Eine quadratische Pyramide hat die Grundkante a = ${tx(a, "cm")} und das Volumen V = ${tx(V, "cm³")}. Berechne die Höhe h.`),
          a: rich("h = ", tx(h, "cm")),
          steps: rules([
            "V = ⅓ · G · h, also h = 3 · V : G",
            `G = ${tx(a, "cm")} · ${tx(a, "cm")} = ${tx(G, "cm²")}`,
            `h = 3 · ${tx(V, "cm³")} : ${tx(G, "cm²")} = ${tx(h, "cm")}`,
          ]),
          fig: pyrFig(a, a, h, { labA: `a = ${tx(a, "cm")}`, labH: "h = ?" }),
          inline: false,
        };
      }
      const r = rng.int(2, 8), h = 3 * rng.int(1, 5), R = new Frac(r), G = PI.mul(R).mul(R), V = G.mul(h).div(3);
      return {
        q: rich(`Ein Kegel hat den Radius r = ${tx(R, "cm")} und das Volumen V = ${tx(V, "cm³")}. Berechne die Höhe h. Rechne mit π ≈ 3,14.`),
        a: rich("h = ", tx(h, "cm")),
        steps: rules([
          "V = ⅓ · G · h, also h = 3 · V : G",
          `G = ${PIS} · (${tx(R, "cm")})² = ${tx(G, "cm²")}`,
          `h = 3 · ${tx(V, "cm³")} : ${tx(G, "cm²")} = ${tx(h, "cm")}`,
        ]),
        fig: konusFig(r, h, { labR: `r = ${tx(R, "cm")}`, labH: "h = ?" }),
        inline: false,
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
