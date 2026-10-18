// M5 (Klasse 5 Mittelschule): Flächeninhalt von Rechteck und Quadrat (mit Skizze), Umkehraufgaben zu
// Fläche und Umfang, Flächeneinheiten umrechnen, Platzhalteraufgaben und Umkehraufgaben mit Formeln.
// Typen: m5-rechteck-flaeche (LB 4), m5-rechteck-umkehr (LB 4), m5-flaecheneinheiten (LB 4),
//        m5-platzhalter (LB 7), m5-formel-umkehr (LB 7). Vorbild für Skizzen: m7-flaechen.js
(function (AG) {
  const { rich, fmtInt, fitPoints, sketch } = AG;

  // ---------- Hilfen ----------
  const I = n => fmtInt(n);                      // ganze Zahl („1400“, „10 000“ ab 5 Stellen)
  const cm = n => I(n) + " cm";
  const cm2 = n => I(n) + " cm²";
  const m = n => I(n) + " m";
  const m2 = n => I(n) + " m²";
  const dm = n => I(n) + " dm";
  const dm2 = n => I(n) + " dm²";
  const MINUS = AG.MINUS;

  // Figur (Punkte in beliebigen Einheiten, y nach oben) in ein Feld W × H mm einpassen,
  // mit Rändern [links, rechts, oben, unten], damit die Beschriftungen Platz haben.
  function place(pts, W, H, [ml, mr, mt, mb]) {
    const g = fitPoints(pts, W - ml - mr, H - mt - mb, 0);
    return p => { const q = g(p); return [q[0] + ml, q[1] + mt]; };
  }
  const centroid = P => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

  const FW = 74, FH = 44; // Feldgröße der Skizzen (cols: 2)
  const MARG = [18, 18, 8, 9]; // Randabstand links, rechts, oben, unten (Platz für Seitenbeschriftungen)

  // Rechteck mit Länge a (unten) und Breite b (rechts). Nicht maßstabsgetreu: Breite höchstens 1,2-fach der Länge.
  function rectFig(a, b, labA, labB) {
    const bd = Math.min(Math.max(b, 0.5 * a), 1.2 * a);
    const pts = [[0, 0], [a, 0], [a, bd], [0, bd]];
    const f = place(pts, FW, FH, MARG);
    const P = pts.map(f), C = centroid(P);
    const s = sketch(FW, FH);
    s.poly(P);
    s.side(P[0], P[1], labA, { inside: C });
    s.side(P[1], P[2], labB, { inside: C });
    return s.done();
  }

  // L-Form: a unten (Breite), b links (Höhe), c oben links (Teilstrecke), d rechts unten (Teilstrecke)
  function lFig(a, b, c, d) {
    const pts = [[0, 0], [a, 0], [a, d], [c, d], [c, b], [0, b]];
    const f = place(pts, FW, FH, MARG);
    const P = pts.map(f), C = centroid(P);
    const s = sketch(FW, FH);
    s.poly(P);
    s.side(P[0], P[1], "a = " + m(a), { inside: C });
    s.side(P[5], P[0], "b = " + m(b), { inside: C });
    s.side(P[4], P[5], "c = " + m(c), { inside: C });
    s.side(P[1], P[2], "d = " + m(d), { inside: C });
    return s.done();
  }

  // U-Form: a unten (Breite), b links (Höhe), c Innenbreite oben (Grund des Ausschnitts), d Tiefe des Ausschnitts
  function uFig(a, b, c, d) {
    const arm = (a - c) / 2;
    const pts = [[0, 0], [a, 0], [a, b], [a - arm, b], [a - arm, b - d], [arm, b - d], [arm, b], [0, b]];
    const f = place(pts, FW, FH, MARG);
    const P = pts.map(f), C = centroid(P);
    const s = sketch(FW, FH);
    s.poly(P);
    s.side(P[0], P[1], "a = " + m(a), { inside: C });
    s.side(P[7], P[0], "b = " + m(b), { inside: C });
    // c: unter dem Grund des Ausschnitts (im Steg), d: rechts neben der linken Kante des Ausschnitts (im Ausschnitt)
    const midC = [(P[4][0] + P[5][0]) / 2, P[4][1]];
    s.label([midC[0], midC[1] + 4], "c = " + m(c));
    const midD = [P[5][0], (P[5][1] + P[6][1]) / 2];
    s.label([midD[0] + 1.6, midD[1]], "d = " + m(d), { anchor: "start" });
    return s.done();
  }

  // ---------- 1. Flächeninhalt Rechteck und Quadrat ----------
  function lTask(rng) {
    let a, b, c, d;
    for (let i = 0; i < 500; i++) {
      a = rng.int(6, 12); b = rng.int(6, 11); c = rng.int(2, a - 2); d = rng.int(2, b - 2);
      if (a / b >= 0.8 && a / b <= 1.6) break;
    }
    const A = a * d + c * (b - d);
    const zerlegen = rng.chance(0.5);
    const steps = zerlegen
      ? [
        rich("Höhe oben links: b − d = ", m(b), " − ", m(d), " = ", m(b - d)),
        rich("Teilfläche unten: a · d = ", m(a), " · ", m(d), " = ", m2(a * d)),
        rich("Teilfläche oben: c · (b − d) = ", m(c), " · ", m(b - d), " = ", m2(c * (b - d))),
        rich("A = ", m2(a * d), " + ", m2(c * (b - d)), " = ", m2(A)),
      ]
      : [
        rich("Rechteck: a · b = ", m(a), " · ", m(b), " = ", m2(a * b)),
        rich("Fehlendes Rechteck: (a − c) · (b − d) = ", m(a - c), " · ", m(b - d), " = ", m2((a - c) * (b - d))),
        rich("A = ", m2(a * b), " − ", m2((a - c) * (b - d)), " = ", m2(A)),
      ];
    return {
      q: rich("Ein Pausenhof hat die Form eines L. Gegeben: a = ", m(a), ", b = ", m(b), ", c = ", m(c), ", d = ", m(d),
        " (siehe Skizze). Berechne den Flächeninhalt."),
      a: rich(m2(A)),
      steps,
      fig: lFig(a, b, c, d),
      inline: false,
    };
  }

  function uTask(rng) {
    let a, b, c, d, arm;
    for (let i = 0; i < 500; i++) {
      arm = rng.int(2, 3); c = rng.int(6, 9); a = c + 2 * arm;
      b = rng.int(7, 11); d = rng.int(3, b - 3);
      if (a <= 14 && a / b >= 0.9 && a / b <= 1.7) break;
    }
    const A = a * b - c * d;
    const zerlegen = rng.chance(0.5);
    const steps = zerlegen
      ? [
        rich("Breite eines Arms: (a − c) : 2 = (", m(a), " − ", m(c), ") : 2 = ", m(arm)),
        rich("Unten: a · (b − d) = ", m(a), " · ", m(b - d), " = ", m2(a * (b - d))),
        rich("Zwei Arme: 2 · ", m(arm), " · ", m(d), " = ", m2(2 * arm * d)),
        rich("A = ", m2(a * (b - d)), " + ", m2(2 * arm * d), " = ", m2(A)),
      ]
      : [
        rich("Rechteck: a · b = ", m(a), " · ", m(b), " = ", m2(a * b)),
        rich("Ausschnitt: c · d = ", m(c), " · ", m(d), " = ", m2(c * d)),
        rich("A = ", m2(a * b), " − ", m2(c * d), " = ", m2(A)),
      ];
    return {
      q: rich("Ein Beet hat die Form eines U. Gegeben: a = ", m(a), ", b = ", m(b), ", c = ", m(c), ", d = ", m(d),
        " (siehe Skizze). Berechne den Flächeninhalt."),
      a: rich(m2(A)),
      steps,
      fig: uFig(a, b, c, d),
      inline: false,
    };
  }

  AG.registerType({
    id: "m5-rechteck-flaeche",
    klasse: "5",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Rechtecke",
    title: "Flächeninhalt von Rechteck und Quadrat",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt. Schreibe die Rechnung auf.",
      2: "Rechne zuerst alle Längen in die gleiche Einheit um. Gib das Ergebnis in der angegebenen Einheit an.",
      3: "Berechne den Flächeninhalt der Figur. Zerlege sie in Rechtecke oder ergänze sie zu einem Rechteck.",
    },
    merke: [
      "Rechteck: ", { b: "A = a · b" }, ". Quadrat: ", { b: "A = a · a" },
      ". Beispiel: a = 6 cm, b = 4 cm → A = 6 cm · 4 cm = 24 cm². Zusammengesetzte Figuren zerlegt man in Rechtecke "
      + "oder ergänzt sie zu einem Rechteck und zieht die fehlende Fläche ab.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        if (rng.chance(0.3)) {
          const s = rng.int(3, 12);
          return {
            q: rich("Das Quadrat hat die Seite a = ", cm(s), ". Berechne den Flächeninhalt."),
            a: rich(cm2(s * s)),
            steps: [rich("A = a · a"), rich("A = ", cm(s), " · ", cm(s), " = ", cm2(s * s))],
            fig: rectFig(s, s, "a = " + cm(s), "a"),
            inline: false,
          };
        }
        const a = rng.int(3, 12);
        let b = rng.int(2, 9);
        if (b === a) b = b + 1;
        return {
          q: rich("Das Rechteck hat die Seiten a = ", cm(a), " und b = ", cm(b), ". Berechne den Flächeninhalt."),
          a: rich(cm2(a * b)),
          steps: [rich("A = a · b"), rich("A = ", cm(a), " · ", cm(b), " = ", cm2(a * b))],
          fig: rectFig(a, b, "a = " + cm(a), "b = " + cm(b)),
          inline: false,
        };
      }
      if (level === 2) {
        const a = rng.int(2, 9); // Länge in m
        if (rng.chance(0.5)) {
          // Breite in dm (ganze Meter), Ergebnis in m²
          const r = rng.int(2, 9);
          return {
            q: rich("Das Rechteck ist ", m(a), " lang und ", dm(10 * r), " breit. Berechne den Flächeninhalt in m²."),
            a: rich(m2(a * r)),
            steps: [rich("Breite: ", dm(10 * r), " = ", m(r)), rich("A = ", m(a), " · ", m(r), " = ", m2(a * r))],
            fig: rectFig(a, r, "a = " + m(a), "b = " + dm(10 * r)),
            inline: false,
          };
        }
        // Breite in dm (Vielfache von 5), Ergebnis in dm²
        const b = 5 * rng.int(3, 19);
        return {
          q: rich("Das Rechteck ist ", m(a), " lang und ", dm(b), " breit. Berechne den Flächeninhalt in dm²."),
          a: rich(dm2(10 * a * b)),
          steps: [rich("Länge: ", m(a), " = ", dm(10 * a)), rich("A = ", dm(10 * a), " · ", dm(b), " = ", dm2(10 * a * b))],
          fig: rectFig(a, b / 10, "a = " + m(a), "b = " + dm(b)),
          inline: false,
        };
      }
      return rng.chance(0.5) ? lTask(rng) : uTask(rng);
    },
  });

  // ---------- 2. Umkehraufgaben Rechteck und Quadrat ----------
  AG.registerType({
    id: "m5-rechteck-umkehr",
    klasse: "5",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Rechtecke",
    title: "Seite aus Fläche oder Umfang berechnen",
    topic: "flaechen",
    instruction: {
      1: "Berechne die fehlende Seite.",
      2: "Berechne die fehlende Seite. Denke rückwärts.",
      3: "Löse die Sachaufgabe. Rechne rückwärts.",
    },
    merke: [
      "Ist die Fläche gegeben, teilt man sie durch die bekannte Seite: ", { b: "andere Seite = Fläche : Seite" },
      ". Beispiel: A = 48 cm², a = 6 cm → b = 48 cm² : 6 cm = 8 cm. Ist der Umfang gegeben, zieht man zuerst die "
      + "bekannten Seiten ab und halbiert den Rest.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        if (rng.chance(0.35)) {
          const s = rng.int(2, 12);
          return {
            q: rich("Ein Quadrat hat den Flächeninhalt ", cm2(s * s), ". Wie lang ist eine Seite?"),
            a: rich(cm(s)),
            steps: [rich("a · a = ", cm2(s * s)), rich(cm(s), " · ", cm(s), " = ", cm2(s * s)), rich("Eine Seite ist ", cm(s), " lang.")],
            inline: false,
          };
        }
        const a = rng.int(2, 12);
        let b = rng.int(2, 12);
        if (b === a) b = b < 12 ? b + 1 : b - 1;
        const A = a * b;
        return {
          q: rich("Ein Rechteck hat den Flächeninhalt ", cm2(A), ". Eine Seite ist ", cm(a), " lang. Wie lang ist die andere Seite?"),
          a: rich(cm(b)),
          steps: [rich("Andere Seite: ", cm2(A), " : ", cm(a), " = ", cm(b)), rich("Probe: ", cm(a), " · ", cm(b), " = ", cm2(A))],
          inline: false,
        };
      }
      if (level === 2) {
        if (rng.chance(0.35)) {
          const s = rng.int(3, 12);
          return {
            q: rich("Ein Quadrat hat den Umfang ", cm(4 * s), ". Wie lang ist eine Seite?"),
            a: rich(cm(s)),
            steps: [rich("Alle 4 Seiten sind gleich lang."), rich(cm(4 * s), " : 4 = ", cm(s))],
            inline: false,
          };
        }
        const a = rng.int(2, 12);
        let b = rng.int(2, 12);
        if (b === a) b = b < 12 ? b + 1 : b - 1;
        const u = 2 * (a + b);
        return {
          q: rich("Ein Rechteck hat den Umfang ", cm(u), ". Eine Seite ist ", cm(a), " lang. Wie lang ist die andere Seite?"),
          a: rich(cm(b)),
          steps: [
            rich("Zwei Seiten zusammen: 2 · ", cm(a), " = ", cm(2 * a)),
            rich("Die anderen zwei Seiten zusammen: ", cm(u), " − ", cm(2 * a), " = ", cm(u - 2 * a)),
            rich("Eine Seite: ", cm(u - 2 * a), " : 2 = ", cm(b)),
          ],
          inline: false,
        };
      }
      // Sachaufgaben
      const kind = rng.int(0, 3);
      if (kind === 0) {
        const a = rng.int(2, 12), b = rng.int(2, 10), A = a * b;
        return {
          q: rich("Ein rechteckiges Blumenbeet hat eine Fläche von ", m2(A), ". Es ist ", m(a), " lang. Wie breit ist das Beet?"),
          a: rich(m(b)),
          steps: [rich("Breite = Fläche : Länge"), rich(m2(A), " : ", m(a), " = ", m(b))],
          inline: false,
        };
      }
      if (kind === 1) {
        const a = rng.int(6, 10), b = rng.int(4, 8), A = a * b;
        return {
          q: rich("Der Fußboden eines Klassenzimmers ist ", m(a), " lang und hat eine Fläche von ", m2(A), ". Wie breit ist das Zimmer?"),
          a: rich(m(b)),
          steps: [rich("Breite = Fläche : Länge"), rich(m2(A), " : ", m(a), " = ", m(b))],
          inline: false,
        };
      }
      if (kind === 2) {
        const a = rng.int(4, 12);
        let b = rng.int(3, 10);
        if (b === a) b = b < 10 ? b + 1 : b - 1;
        const u = 2 * (a + b);
        return {
          q: rich("Ein rechteckiger Hühnerhof wird mit einem Zaun umgeben. Der Zaun ist ", m(u), " lang. Der Hof ist ", m(a), " lang. Wie breit ist der Hof?"),
          a: rich(m(b)),
          steps: [
            rich("Zwei Längsseiten: 2 · ", m(a), " = ", m(2 * a)),
            rich("Zwei Breiten zusammen: ", m(u), " − ", m(2 * a), " = ", m(u - 2 * a)),
            rich("Eine Breite: ", m(u - 2 * a), " : 2 = ", m(b)),
          ],
          inline: false,
        };
      }
      const s = rng.int(2, 6);
      return {
        q: rich("Ein quadratischer Sandkasten hat einen Umfang von ", m(4 * s), ". Wie lang ist eine Seite?"),
        a: rich(m(s)),
        steps: [rich("Alle 4 Seiten sind gleich lang."), rich(m(4 * s), " : 4 = ", m(s))],
        inline: false,
      };
    },
  });

  // ---------- 3. Flächeneinheiten ----------
  // Jede Stufe ist 100-mal so groß wie die nächstkleinere Einheit (m² → dm² → cm² → mm²)
  const STUFEN = [["m²", "dm²"], ["dm²", "cm²"], ["cm²", "mm²"]];
  // Kommaschreibweise: k/100 (k von 10 bis 999) als Dezimalzahl mit Komma
  const dec = k => AG.fmtDec(new AG.Frac(k, 100));

  AG.registerType({
    id: "m5-flaecheneinheiten",
    klasse: "5",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Rechtecke",
    title: "Flächeneinheiten umrechnen",
    topic: "groessen",
    instruction: {
      1: "Rechne in die angegebene Einheit um.",
      2: "Rechne um. Bei gemischten Einheiten rechnest du zuerst jede Einheit um, dann addierst du.",
      3: "Rechne um. Bei den Vergleichen setze <, > oder = ein.",
    },
    merke: [
      "Von einer Einheit zur nächsten kleineren Einheit mal 100, zur nächsten größeren geteilt durch 100: ",
      { b: "1 m² = 100 dm²" }, ", ", { b: "1 dm² = 100 cm²" }, ", ", { b: "1 cm² = 100 mm²" },
      ". Beispiel: 3 m² = 300 dm², 5 m² 12 dm² = 500 dm² + 12 dm² = 512 dm², 3,5 m² = 350 dm².",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) {
        const [big, small] = rng.pick(STUFEN);
        const n = rng.int(2, 12);
        if (rng.chance(0.6)) {
          return {
            q: rich(I(n), " ", big, " = ", { blank: 4 }, " ", small),
            a: rich(I(n * 100), " ", small),
            steps: [rich("1 ", big, " = 100 ", small), rich(I(n), " · 100 ", small, " = ", I(n * 100), " ", small)],
            inline: false,
          };
        }
        return {
          q: rich(I(n * 100), " ", small, " = ", { blank: 4 }, " ", big),
          a: rich(I(n), " ", big),
          steps: [rich("1 ", big, " = 100 ", small), rich(I(n * 100), " ", small, " : 100 = ", I(n), " ", big)],
          inline: false,
        };
      }
      if (level === 2) {
        if (rng.chance(0.5)) {
          // zwei Stufen: m² → cm² bzw. dm² → mm²
          const [big, mid, small] = rng.chance(0.5) ? ["m²", "dm²", "cm²"] : ["dm²", "cm²", "mm²"];
          const n = rng.int(2, 12);
          return {
            q: rich(I(n), " ", big, " = ", { blank: 4 }, " ", small),
            a: rich(I(n * 10000), " ", small),
            steps: [rich("1 ", big, " = 100 ", mid, " = 10 000 ", small), rich(I(n), " · 10 000 ", small, " = ", I(n * 10000), " ", small)],
            inline: false,
          };
        }
        // gemischte Einheiten: 5 m² 12 dm² = 512 dm²
        const [big, small] = rng.pick([["m²", "dm²"], ["dm²", "cm²"]]);
        const x = rng.int(2, 9), y = rng.int(5, 95);
        return {
          q: rich(I(x), " ", big, " ", I(y), " ", small, " = ", { blank: 4 }, " ", small),
          a: rich(I(x * 100 + y), " ", small),
          steps: [rich(I(x), " ", big, " = ", I(x * 100), " ", small), rich(I(x * 100), " ", small, " + ", I(y), " ", small, " = ", I(x * 100 + y), " ", small)],
          inline: false,
        };
      }
      // Kommaschreibweise und Vergleiche
      const kind = rng.int(0, 2);
      const k = rng.int(10, 999);
      if (kind === 0) {
        return {
          q: rich(dec(k), " m² = ", { blank: 4 }, " dm²"),
          a: rich(I(k), " dm²"),
          steps: [rich("1 m² = 100 dm²"), rich(dec(k), " m² = ", dec(k), " · 100 dm² = ", I(k), " dm²")],
          inline: false,
        };
      }
      if (kind === 1) {
        return {
          q: rich(dec(k), " dm² = ", { blank: 4 }, " cm²"),
          a: rich(I(k), " cm²"),
          steps: [rich("1 dm² = 100 cm²"), rich(dec(k), " dm² = ", dec(k), " · 100 cm² = ", I(k), " cm²")],
          inline: false,
        };
      }
      // Vergleich: m² (Kommazahl) mit dm² (ganze Zahl)
      let y = k + rng.int(-60, 60);
      if (y < 1) y = k + 60;
      const sign = k > y ? ">" : k < y ? "<" : "=";
      return {
        q: rich(dec(k), " m² ", { blank: 3 }, " ", I(y), " dm²"),
        a: rich(dec(k), " m² ", sign, " ", I(y), " dm²"),
        steps: [rich(dec(k), " m² = ", I(k), " dm²"), rich(I(k), " dm² ", sign, " ", I(y), " dm²")],
        inline: false,
      };
    },
  });

  // ---------- 4. Platzhalteraufgaben ----------
  AG.registerType({
    id: "m5-platzhalter",
    klasse: "5",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen und Formeln",
    title: "Zahlen mit □ finden",
    topic: "terme",
    instruction: {
      1: "Finde die Zahl für das □. Rechne die Umkehraufgabe.",
      2: "Finde die Zahl für das □. Die Zahlen sind größer.",
      3: "Finde die gesuchte Zahl. Achte auf die Reihenfolge der Rechenschritte.",
    },
    merke: [
      "Das □ steht für eine gesuchte Zahl. Mit der Umkehraufgabe findet man sie: ", { b: "□ + 17 = 42" },
      ", also □ = 42 − 17 = 25. Probe: 25 + 17 = 42.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level < 3) {
        const big = level === 2;
        const op = rng.pick(["+", "−", "·", ":"]);
        if (op === "+") {
          const x = big ? rng.int(120, 900) : rng.int(3, 60);
          const a = big ? rng.int(100, 600) : rng.int(3, 40);
          const c = x + a;
          return {
            q: rich("□ + ", I(a), " = ", I(c)),
            a: rich(I(x)),
            steps: [rich("□ = ", I(c), " ", MINUS, " ", I(a)), rich("□ = ", I(x))],
            inline: false,
          };
        }
        if (op === "−") {
          const x = big ? rng.int(100, 900) : rng.int(3, 60);
          const r = big ? rng.int(100, 900) : rng.int(3, 60);
          const c = x + r;
          return {
            q: rich(I(c), " ", MINUS, " □ = ", I(r)),
            a: rich(I(x)),
            steps: [rich("□ = ", I(c), " ", MINUS, " ", I(r)), rich("□ = ", I(x))],
            inline: false,
          };
        }
        if (op === "·") {
          const x = big ? rng.int(12, 99) : rng.int(2, 12);
          const a = big ? rng.int(11, 49) : rng.int(2, 9);
          const c = x * a;
          return {
            q: rich("□ · ", I(a), " = ", I(c)),
            a: rich(I(x)),
            steps: [rich("□ = ", I(c), " : ", I(a)), rich("□ = ", I(x))],
            inline: false,
          };
        }
        const c = big ? rng.int(12, 99) : rng.int(2, 12);
        const a = big ? rng.int(11, 49) : rng.int(2, 9);
        const x = c * a;
        return {
          q: rich("□ : ", I(a), " = ", I(c)),
          a: rich(I(x)),
          steps: [rich("□ = ", I(c), " · ", I(a)), rich("□ = ", I(x))],
          inline: false,
        };
      }
      // Stufe 3: zweischrittig oder Zahlenrätsel in Worten
      const x = rng.int(2, 30), a = rng.int(2, 9);
      const minus = rng.chance(0.4);
      const b = minus ? rng.int(1, Math.min(20, a * x - 1)) : rng.int(1, 20);
      const c = minus ? a * x - b : a * x + b;
      const sgn = minus ? MINUS : "+";
      const rev = minus ? [rich(I(a), " · □ = ", I(c), " + ", I(b), " = ", I(c + b)), rich("□ = ", I(c + b), " : ", I(a), " = ", I(x))]
        : [rich(I(a), " · □ = ", I(c), " − ", I(b), " = ", I(c - b)), rich("□ = ", I(c - b), " : ", I(a), " = ", I(x))];
      if (rng.chance(0.5)) {
        return {
          q: rich(I(a), " · □ ", sgn, " ", I(b), " = ", I(c)),
          a: rich(I(x)),
          steps: [rich(I(a), " · □ ", sgn, " ", I(b), " = ", I(c)), ...rev],
          inline: false,
        };
      }
      const verb = minus ? "subtrahiere" : "addiere";
      return {
        q: rich("Ich denke mir eine Zahl. Ich multipliziere sie mit ", I(a), " und ", verb, " ", I(b), ". Ich erhalte ", I(c),
          ". Welche Zahl habe ich mir gedacht?"),
        a: rich(I(x)),
        steps: [rich(I(a), " · □ ", sgn, " ", I(b), " = ", I(c)), ...rev],
        inline: false,
      };
    },
  });

  // ---------- 5. Umkehraufgaben mit Formeln ----------
  AG.registerType({
    id: "m5-formel-umkehr",
    klasse: "5",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen und Formeln",
    title: "Seite mit der Formel berechnen",
    topic: "terme",
    instruction: {
      1: "Berechne die gesuchte Seite mit der Formel.",
      2: "Stelle die Formel nach der gesuchten Größe um. Rechne Schritt für Schritt.",
      3: "Löse die Sachaufgabe mit der Formel. Schreibe die Formel zuerst auf.",
    },
    merke: [
      "Formeln für das Rechteck: ", { b: "u = 2 · a + 2 · b" }, " und ", { b: "A = a · b" },
      ". Die gesuchte Seite setzt man ein und löst die Gleichung. Beispiel: u = 26 cm, a = 8 cm → "
      + "26 cm = 2 · 8 cm + 2 · b → 10 cm = 2 · b → b = 5 cm.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) {
        const a = rng.int(2, 12);
        let b = rng.int(2, 12);
        if (b === a) b = b < 12 ? b + 1 : b - 1;
        const u = 2 * (a + b);
        const g = rng.pick(["a", "b"]);
        const known = g === "a" ? "b" : "a";
        const gv = g === "a" ? a : b, kv = g === "a" ? b : a;
        const sub = letter => (letter === known ? cm(kv) : letter);
        return {
          q: rich("Formel: u = 2 · a + 2 · b. Berechne ", g, " für u = ", cm(u), ", ", known, " = ", cm(kv), "."),
          a: rich(g, " = ", cm(gv)),
          steps: [
            rich("u = 2 · a + 2 · b"),
            rich(cm(u), " = 2 · ", sub("a"), " + 2 · ", sub("b")),
            g === "b"
              ? rich(cm(u), " = ", cm(2 * kv), " + 2 · b")
              : rich(cm(u), " = 2 · a + ", cm(2 * kv)),
            rich(cm(u - 2 * kv), " = 2 · ", g),
            rich(g, " = ", cm(u - 2 * kv), " : 2 = ", cm(gv)),
          ],
          inline: false,
        };
      }
      if (level === 2) {
        if (rng.chance(0.3)) {
          const s = rng.int(5, 15);
          return {
            q: rich("Formel für das Quadrat: u = 4 · a. Berechne a für u = ", cm(4 * s), "."),
            a: rich("a = ", cm(s)),
            steps: [rich("u = 4 · a"), rich(cm(4 * s), " = 4 · a"), rich("a = ", cm(4 * s), " : 4 = ", cm(s))],
            inline: false,
          };
        }
        const a = rng.int(2, 12);
        let b = rng.int(2, 12);
        if (b === a) b = b < 12 ? b + 1 : b - 1;
        const A = a * b;
        const g = rng.pick(["a", "b"]);
        const known = g === "a" ? "b" : "a";
        const gv = g === "a" ? a : b, kv = g === "a" ? b : a;
        return {
          q: rich("Formel: A = a · b. Berechne ", g, " für A = ", cm2(A), ", ", known, " = ", cm(kv), "."),
          a: rich(g, " = ", cm(gv)),
          steps: [
            rich("A = a · b"),
            rich(cm2(A), " = ", g === "a" ? "a" : cm(kv), " · ", g === "a" ? cm(kv) : "b"),
            rich(g, " = ", cm2(A), " : ", cm(kv), " = ", cm(gv)),
          ],
          inline: false,
        };
      }
      // Sachaufgaben mit Formel
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const a = rng.int(4, 12);
        let b = rng.int(3, 10);
        if (b === a) b = b < 10 ? b + 1 : b - 1;
        const u = 2 * (a + b);
        return {
          q: rich("Ein rechteckiger Garten hat einen Zaun mit dem Umfang u = ", m(u), ". Er ist a = ", m(a), " lang. "
            + "Berechne die Breite b mit der Formel u = 2 · a + 2 · b."),
          a: rich("b = ", m(b)),
          steps: [
            rich("u = 2 · a + 2 · b"),
            rich(m(u), " = 2 · ", m(a), " + 2 · b"),
            rich(m(u), " = ", m(2 * a), " + 2 · b"),
            rich(m(u - 2 * a), " = 2 · b"),
            rich("b = ", m(u - 2 * a), " : 2 = ", m(b)),
          ],
          inline: false,
        };
      }
      if (kind === 1) {
        const a = rng.int(4, 10), b = rng.int(3, 9), A = a * b;
        return {
          q: rich("Ein Zimmer hat die Fläche A = ", m2(A), ". Es ist a = ", m(a), " lang. Berechne die Breite b mit der Formel A = a · b."),
          a: rich("b = ", m(b)),
          steps: [rich("A = a · b"), rich(m2(A), " = ", m(a), " · b"), rich("b = ", m2(A), " : ", m(a), " = ", m(b))],
          inline: false,
        };
      }
      const s = rng.int(2, 6);
      return {
        q: rich("Ein quadratischer Sandkasten hat den Umfang u = ", m(4 * s), ". Berechne die Seite a mit der Formel u = 4 · a."),
        a: rich("a = ", m(s)),
        steps: [rich("u = 4 · a"), rich(m(4 * s), " = 4 · a"), rich("a = ", m(4 * s), " : 4 = ", m(s))],
        inline: false,
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
