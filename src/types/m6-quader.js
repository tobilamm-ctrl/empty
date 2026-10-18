// M6 (Klasse 6 Mittelschule): Quader und Würfel – Oberfläche, Rauminhalt, Volumeneinheiten, Würfelbauten,
// Sachaufgaben und Umkehraufgaben. Skizzen als Schrägbild (verdeckte Kanten gestrichelt).
// Typen: m6-quader-oberflaeche (LB 4), m6-volumeneinheiten (LB 5), m6-quader-volumen (LB 5),
//        m6-wuerfelbauten (LB 5), m6-volumen-sachaufgaben (LB 5), m6-quader-umkehr (LB 7).
(function (AG) {
  const { Frac, rich, fmtInt, fmtDec, fitPoints, sketch } = AG;

  // ---------- Hilfen ----------
  const I = n => fmtInt(n);
  const nf = x => { const f = Frac.of(x); return f.isInt() ? fmtInt(f.n) : fmtDec(f); };
  const cm = x => nf(x) + " cm";
  const cm2 = x => nf(x) + " cm²";
  const cm3 = x => nf(x) + " cm³";
  const dec = k => fmtDec(new Frac(k, 100));   // k/100 als Dezimalzahl mit Komma
  const FW = 74, FH = 44;                      // Skizzenfeld (cols: 2)
  const K = 0.5;                               // Tiefenversatz des Schrägbilds (in cm der Zeichnung)
  // Wiederholen, bis eine gültige Aufgabe entsteht (begrenzt)
  function retry(fn) {
    for (let i = 0; i < 300; i++) { const t = fn(); if (t) return t; }
    throw new Error("m6: keine Aufgabe erzeugt");
  }

  // ---------- Schrägbild ----------
  // Abbildung Punkte (x nach rechts, z nach oben) -> mm im Feld, Ränder: links/rechts 18 mm, oben 6 mm, unten 9 mm
  function layout(pts) {
    const f = fitPoints(pts, FW - 46, FH - 15, 0);
    return p => { const q = f(p); return [q[0] + 24, q[1] + 6]; };
  }
  // Ein Quader: vordere Fläche [x0,x1] × [z0,z1], hinten rechts oben um K versetzt.
  // Verdeckte Kanten zuerst zeichnen und dann die Flächen darüber setzen (Flächen verdecken sie).
  function drawBox(S, P, Q, x0, z0, x1, z1) {
    S.line(P(x0, z0), Q(x0, z0), { dash: true });
    S.line(Q(x0, z0), Q(x1, z0), { dash: true });
    S.line(Q(x0, z0), Q(x0, z1), { dash: true });
    S.poly([P(x0, z1), P(x1, z1), Q(x1, z1), Q(x0, z1)]);   // oben
    S.poly([P(x1, z0), P(x1, z1), Q(x1, z1), Q(x1, z0)]);   // rechts
    S.poly([P(x0, z0), P(x1, z0), P(x1, z1), P(x0, z1)]);   // vorne
  }
  // Figur aus einem oder mehreren Quadern (gleiche Tiefe), boxes = [[x0, z0, x1, z1], ...] (Reihenfolge: unten zuerst)
  function scene(boxes, labels) {
    const pts = [];
    boxes.forEach(([x0, z0, x1, z1]) => pts.push([x0, z0], [x1, z0], [x0, z1], [x1, z1],
      [x0 + K, z0 + K], [x1 + K, z0 + K], [x0 + K, z1 + K], [x1 + K, z1 + K]));
    const f = layout(pts);
    const P = (x, z) => f([x, z]), Q = (x, z) => f([x + K, z + K]);
    const mm = pts.map(p => f(p));
    const C = [mm.reduce((s, p) => s + p[0], 0) / mm.length, mm.reduce((s, p) => s + p[1], 0) / mm.length];
    const S = sketch(FW, FH);
    boxes.forEach(([x0, z0, x1, z1]) => drawBox(S, P, Q, x0, z0, x1, z1));
    if (labels) labels(S, P, Q, C);
    return S.done();
  }
  // Beschriftung eines Quaders: la = Länge unten, lc = Höhe links, lb = Breite (Tiefe) rechts unten
  function quaderLabels(a, c, la, lb, lc) {
    return (S, P, Q, C) => {
      S.side(P(0, 0), P(a, 0), la, { inside: C });
      S.side(P(0, 0), P(0, c), lc, { inside: C });
      S.side(P(a, 0), Q(a, 0), lb, { inside: C });
    };
  }
  function quaderFig(a, c, la, lb, lc) {
    return scene([[0, 0, a, c]], quaderLabels(a, c, la, lb, lc));
  }

  // ---------- 1. Oberfläche von Quadern ----------
  AG.registerType({
    id: "m6-quader-oberflaeche",
    klasse: "6",
    zug: "RM",
    lb: "4",
    lbTitle: "Oberflächeninhalt von Quadern",
    title: "Oberfläche von Quadern",
    topic: "koerper",
    instruction: {
      1: "Berechne den Oberflächeninhalt. Schreibe die Rechnung auf.",
      2: "Berechne den Oberflächeninhalt. Achte auf die Einheiten.",
      3: "Löse die Aufgabe. Überlege, welche Flächen zur Oberfläche gehören.",
    },
    merke: [
      "Quader: ", { b: "O = 2 · (a · b + a · c + b · c)" }, ". Würfel: ", { b: "O = 6 · a · a" },
      ". Die Oberfläche besteht aus sechs Rechtecken, je zwei gegenüberliegende sind gleich groß. "
      + "Beispiel: a = 5 cm, b = 3 cm, c = 2 cm → O = 2 · (15 + 10 + 6) cm² = 62 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      return retry(() => {
        if (level === 1) {
          if (rng.chance(0.3)) {
            const s = rng.int(2, 9);
            return {
              q: rich("Ein Würfel hat die Kantenlänge a = ", cm(s), ". Berechne den Oberflächeninhalt."),
              a: rich(cm2(6 * s * s)),
              steps: [rich("Eine Fläche: a · a = ", cm(s), " · ", cm(s), " = ", cm2(s * s)),
                rich("O = 6 · ", cm2(s * s), " = ", cm2(6 * s * s))],
              fig: quaderFig(s, s, "a = " + cm(s), "a = " + cm(s), "a = " + cm(s)),
              inline: false,
            };
          }
          const a = rng.int(2, 9), b = rng.int(2, 9);
          let c = rng.int(2, 9);
          if (a === b && b === c) c = c < 9 ? c + 1 : c - 1;
          const ab = a * b, ac = a * c, bc = b * c, sum = ab + ac + bc, O = 2 * sum;
          return {
            q: rich("Ein Quader ist a = ", cm(a), " lang, b = ", cm(b), " breit und c = ", cm(c), " hoch. "
              + "Berechne den Oberflächeninhalt."),
            a: rich(cm2(O)),
            steps: [
              rich("O = 2 · (a · b + a · c + b · c)"),
              rich("a · b = ", cm(a), " · ", cm(b), " = ", cm2(ab)),
              rich("a · c = ", cm(a), " · ", cm(c), " = ", cm2(ac)),
              rich("b · c = ", cm(b), " · ", cm(c), " = ", cm2(bc)),
              rich("O = 2 · (", cm2(ab), " + ", cm2(ac), " + ", cm2(bc), ") = 2 · ", cm2(sum), " = ", cm2(O)),
            ],
            fig: quaderFig(a, c, "a = " + cm(a), "b = " + cm(b), "c = " + cm(c)),
            inline: false,
          };
        }
        if (level === 2) {
          // Kantenlängen mit einer Nachkommastelle, Ergebnis bleibt mit höchstens zwei Stellen
          const a = new Frac(rng.int(56, 72), 2), b = new Frac(rng.int(32, 44), 2), c = new Frac(rng.int(20, 28), 2);
          const ab = a.mul(b), ac = a.mul(c), bc = b.mul(c), sum = ab.add(ac).add(bc), O = sum.mul(2);
          return {
            q: rich("Ein Schuhkarton ist a = ", cm(a), " lang, b = ", cm(b), " breit und c = ", cm(c), " hoch. "
              + "Wie viel Papier braucht man, um ihn ganz zu bekleben?"),
            a: rich(cm2(O)),
            steps: [
              rich("O = 2 · (a · b + a · c + b · c)"),
              rich("a · b = ", cm(a), " · ", cm(b), " = ", cm2(ab)),
              rich("a · c = ", cm(a), " · ", cm(c), " = ", cm2(ac)),
              rich("b · c = ", cm(b), " · ", cm(c), " = ", cm2(bc)),
              rich("O = 2 · (", cm2(ab), " + ", cm2(ac), " + ", cm2(bc), ") = 2 · ", cm2(sum), " = ", cm2(O)),
            ],
            fig: quaderFig(Number(a), Number(c), "a = " + cm(a), "b = " + cm(b), "c = " + cm(c)),
            inline: false,
          };
        }
        // Niveau 3: Karton ohne Deckel (Sachaufgabe) oder zwei Quader übereinander
        if (rng.chance(0.5)) {
          const a = rng.int(4, 12), b = rng.int(3, 9), c = rng.int(3, 8);
          const ab = a * b, ac = a * c, bc = b * c, O = 2 * (ab + ac + bc), need = O - ab;
          return {
            q: rich("Eine Schachtel hat die Form eines Quaders mit a = ", cm(a), " (Länge), b = ", cm(b),
              " (Breite) und c = ", cm(c), " (Höhe). Sie hat keinen Deckel. Wie viel Karton braucht man mindestens?"),
            a: rich(cm2(need)),
            steps: [
              rich("Boden: a · b = ", cm(a), " · ", cm(b), " = ", cm2(ab)),
              rich("Vorder- und Rückseite: 2 · a · c = 2 · ", cm(a), " · ", cm(c), " = ", cm2(2 * ac)),
              rich("Die beiden Seiten: 2 · b · c = 2 · ", cm(b), " · ", cm(c), " = ", cm2(2 * bc)),
              rich("Karton: ", cm2(ab), " + ", cm2(2 * ac), " + ", cm2(2 * bc), " = ", cm2(need)),
            ],
            inline: false,
          };
        }
        // zwei Quader übereinander: unten a × b × c1, oben a2 × b × c2 (a2 < a), gemeinsame Tiefe b
        const a = rng.int(4, 9), a2 = rng.int(2, a - 1), b = rng.int(2, 6), c1 = rng.int(2, 6), c2 = rng.int(2, 5);
        const off = rng.pick([0, a - a2]);
        const O1 = 2 * (a * b + a * c1 + b * c1), O2 = 2 * (a2 * b + a2 * c2 + b * c2), cover = 2 * a2 * b;
        const O = O1 + O2 - cover;
        const fig = scene(
          [[0, 0, a, c1], [off, c1, off + a2, c1 + c2]],
          (S, P, Q, C) => {
            S.side(P(0, 0), P(a, 0), "a = " + cm(a), { inside: C });
            S.side(P(0, 0), P(0, c1), "c = " + cm(c1), { inside: C });
            S.side(P(a, 0), Q(a, 0), "b = " + cm(b), { inside: C });
            S.side(Q(off, c1 + c2), Q(off + a2, c1 + c2), "a = " + cm(a2), { inside: C });
            S.side(P(off, c1), P(off, c1 + c2), "c = " + cm(c2), { inside: C });
          });
        return {
          q: rich("Zwei Quader stehen übereinander (siehe Skizze). Unten: a = ", cm(a), ", b = ", cm(b), ", c = ", cm(c1),
            ". Oben: a = ", cm(a2), ", b = ", cm(b), ", c = ", cm(c2), ". Berechne die Oberfläche des ganzen Körpers."),
          a: rich(cm2(O)),
          steps: [
            rich("Unterer Quader: O₁ = 2 · (a · b + a · c + b · c) = 2 · (", cm2(a * b), " + ", cm2(a * c1), " + ", cm2(b * c1),
              ") = ", cm2(O1)),
            rich("Oberer Quader: O₂ = 2 · (", cm2(a2 * b), " + ", cm2(a2 * c2), " + ", cm2(b * c2), ") = ", cm2(O2)),
            rich("Die Auflagefläche ", cm2(a2 * b), " fehlt oben und unten: 2 · ", cm2(a2 * b), " = ", cm2(cover)),
            rich("O = ", cm2(O1), " + ", cm2(O2), " − ", cm2(cover), " = ", cm2(O)),
          ],
          fig,
          inline: false,
        };
      });
    },
  });

  // ---------- 2. Volumeneinheiten ----------
  // Rauminhalt-Einheiten: jede Stufe ist 1000-mal so groß wie die nächstkleinere (ml und cm³ gleich, l und dm³ gleich)
  const LADDER = [["m³", "dm³"], ["dm³", "cm³"], ["cm³", "mm³"], ["l", "ml"]];
  const MIXED = [["m³", "dm³"], ["dm³", "cm³"], ["l", "ml"]];

  AG.registerType({
    id: "m6-volumeneinheiten",
    klasse: "6",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Quader",
    title: "Volumeneinheiten umrechnen",
    topic: "groessen",
    instruction: {
      1: "Rechne in die angegebene Einheit um.",
      2: "Rechne um. Bei gemischten Angaben rechnest du zuerst jede Einheit um, dann addierst du.",
      3: "Rechne um. Bei den Vergleichen setze <, > oder = ein.",
    },
    merke: [
      "1 m³ = 1000 dm³, 1 dm³ = 1000 cm³, 1 cm³ = 1000 mm³. Außerdem 1 dm³ = 1 l, 1 l = 1000 ml und 1 cm³ = 1 ml. "
      + "Beispiel: 2,5 dm³ = 2500 cm³, 3 l 250 ml = 3250 ml.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) {
        const [A, B] = rng.pick(LADDER);
        const n = rng.int(2, 12);
        if (rng.chance(0.6)) {
          return {
            q: rich(I(n), " ", A, " = ", { blank: 4 }, " ", B),
            a: rich(I(n * 1000), " ", B),
            steps: [rich("1 ", A, " = 1000 ", B), rich(I(n), " · 1000 ", B, " = ", I(n * 1000), " ", B)],
            inline: false,
          };
        }
        return {
          q: rich(I(n * 1000), " ", B, " = ", { blank: 4 }, " ", A),
          a: rich(I(n), " ", A),
          steps: [rich("1 ", A, " = 1000 ", B), rich(I(n * 1000), " ", B, " : 1000 = ", I(n), " ", A)],
          inline: false,
        };
      }
      if (level === 2) {
        const [A, B] = rng.pick(MIXED);
        const x = rng.int(2, 9), y = rng.int(5, 995);
        return {
          q: rich(I(x), " ", A, " ", I(y), " ", B, " = ", { blank: 4 }, " ", B),
          a: rich(I(x * 1000 + y), " ", B),
          steps: [rich(I(x), " ", A, " = ", I(x * 1000), " ", B),
            rich(I(x * 1000), " ", B, " + ", I(y), " ", B, " = ", I(x * 1000 + y), " ", B)],
          inline: false,
        };
      }
      // Niveau 3: Kommaschreibweise und Vergleiche
      const [A, B] = rng.pick(MIXED);
      const k = rng.int(10, 999);
      if (rng.chance(0.6)) {
        return {
          q: rich(dec(k), " ", A, " = ", { blank: 4 }, " ", B),
          a: rich(I(10 * k), " ", B),
          steps: [rich("1 ", A, " = 1000 ", B), rich(dec(k), " ", A, " = ", dec(k), " · 1000 ", B, " = ", I(10 * k), " ", B)],
          inline: false,
        };
      }
      // Vergleich: Liter (Kommazahl) mit Milliliter (ganze Zahl)
      let y = 10 * k + rng.int(-150, 150);
      if (y < 1 || y === 10 * k) y = 10 * k + 200;
      const sign = 10 * k > y ? ">" : "<";
      return {
        q: rich(dec(k), " l ", { blank: 3 }, " ", I(y), " ml"),
        a: rich(dec(k), " l ", sign, " ", I(y), " ml"),
        steps: [rich(dec(k), " l = ", I(10 * k), " ml"), rich(I(10 * k), " ml ", sign, " ", I(y), " ml")],
        inline: false,
      };
    },
  });

  // ---------- 3. Volumen von Quader und Würfel ----------
  AG.registerType({
    id: "m6-quader-volumen",
    klasse: "6",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Quader",
    title: "Volumen von Quader und Würfel",
    topic: "koerper",
    instruction: {
      1: "Berechne das Volumen. Schreibe die Rechnung auf.",
      2: "Berechne das Volumen und gib es in Litern an.",
      3: "Der Körper besteht aus zwei Quadern. Berechne das Gesamtvolumen.",
    },
    merke: [
      "Quader: ", { b: "V = a · b · c" }, " (Länge · Breite · Höhe). Würfel: ", { b: "V = a · a · a" },
      ". Beispiel: a = 5 cm, b = 4 cm, c = 3 cm → V = 60 cm³. Es gilt 1 l = 1000 cm³.",
    ],
    cols: 2,
    generate(rng, level) {
      return retry(() => {
        if (level === 1) {
          if (rng.chance(0.3)) {
            const s = rng.int(2, 9);
            return {
              q: rich("Ein Würfel hat die Kante a = ", cm(s), ". Berechne das Volumen."),
              a: rich(cm3(s * s * s)),
              steps: [rich("V = a · a · a"), rich("V = ", cm(s), " · ", cm(s), " · ", cm(s), " = ", cm3(s * s * s))],
              fig: quaderFig(s, s, "a = " + cm(s), "a = " + cm(s), "a = " + cm(s)),
              inline: false,
            };
          }
          const a = rng.int(2, 12), b = rng.int(2, 9), c = rng.int(2, 9), V = a * b * c;
          return {
            q: rich("Ein Quader ist a = ", cm(a), " lang, b = ", cm(b), " breit und c = ", cm(c), " hoch. Berechne das Volumen."),
            a: rich(cm3(V)),
            steps: [rich("V = a · b · c"), rich("V = ", cm(a), " · ", cm(b), " · ", cm(c), " = ", cm3(V))],
            fig: quaderFig(a, c, "a = " + cm(a), "b = " + cm(b), "c = " + cm(c)),
            inline: false,
          };
        }
        if (level === 2) {
          // Volumen durch 10 teilbar, damit das Ergebnis in Litern höchstens zwei Nachkommastellen hat
          const a = rng.int(6, 16) * 5, b = rng.int(4, 8) * 5, c = rng.int(5, 9) * 5, V = a * b * c;
          if (V % 10 !== 0 || b >= a) return null;
          const L = new Frac(V, 1000);
          return {
            q: rich("Ein Aquarium ist a = ", cm(a), " lang, b = ", cm(b), " breit und c = ", cm(c), " hoch. "
              + "Wie viel Liter Wasser passen hinein? (1 l = 1000 cm³)"),
            a: rich(nf(L), " l"),
            steps: [rich("V = a · b · c = ", cm(a), " · ", cm(b), " · ", cm(c), " = ", cm3(V)),
              rich("1 l = 1000 cm³"),
              rich("V = ", cm3(V), " : 1000 = ", nf(L), " l")],
            fig: quaderFig(a, c, "a = " + cm(a), "b = " + cm(b), "c = " + cm(c)),
            inline: false,
          };
        }
        // Niveau 3: zwei Quader übereinander, gemeinsame Tiefe b, oben a2 < a
        const a = rng.int(4, 9), a2 = rng.int(2, a - 1), b = rng.int(2, 7), c1 = rng.int(2, 6), c2 = rng.int(2, 6);
        const off = rng.pick([0, a - a2]);
        const V1 = a * b * c1, V2 = a2 * b * c2, V = V1 + V2;
        const fig = scene(
          [[0, 0, a, c1], [off, c1, off + a2, c1 + c2]],
          (S, P, Q, C) => {
            S.side(P(0, 0), P(a, 0), "a = " + cm(a), { inside: C });
            S.side(P(0, 0), P(0, c1), "c = " + cm(c1), { inside: C });
            S.side(P(a, 0), Q(a, 0), "b = " + cm(b), { inside: C });
            S.side(Q(off, c1 + c2), Q(off + a2, c1 + c2), "a = " + cm(a2), { inside: C });
            S.side(P(off, c1), P(off, c1 + c2), "c = " + cm(c2), { inside: C });
          });
        return {
          q: rich("Ein Körper besteht aus zwei Quadern (siehe Skizze). Unten: a = ", cm(a), ", b = ", cm(b), ", c = ", cm(c1),
            ". Oben: a = ", cm(a2), ", b = ", cm(b), ", c = ", cm(c2), ". Berechne das Gesamtvolumen."),
          a: rich(cm3(V)),
          steps: [
            rich("Unten: V₁ = a · b · c = ", cm(a), " · ", cm(b), " · ", cm(c1), " = ", cm3(V1)),
            rich("Oben: V₂ = a · b · c = ", cm(a2), " · ", cm(b), " · ", cm(c2), " = ", cm3(V2)),
            rich("V = ", cm3(V1), " + ", cm3(V2), " = ", cm3(V)),
          ],
          fig,
          inline: false,
        };
      });
    },
  });

  // ---------- 4. Würfelbauten zählen ----------
  // Schrägbild eines Würfels an Stelle (x, y, z); y = Tiefe (größer = weiter hinten). Sichtbar: vorne, oben, rechts.
  const PROJ = (X, Y, Z) => [X + K * Y, Z + K * Y];
  function cubesFig(cells) {
    const pts = [];
    cells.forEach(([x, y, z]) => {
      for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) pts.push(PROJ(x + dx, y + dy, z + dz));
    });
    const f0 = layout(pts);
    const S = sketch(FW, FH);
    // hinten zuerst: größere Tiefe zuerst, dann von unten nach oben
    const order = cells.slice().sort((p, q) => (q[1] - p[1]) || (p[2] - q[2]) || (p[0] - q[0]));
    for (const [x, y, z] of order) {
      const g = (X, Y, Z) => f0(PROJ(X, Y, Z));
      S.poly([g(x, y, z), g(x + 1, y, z), g(x + 1, y, z + 1), g(x, y, z + 1)]);                         // vorne
      S.poly([g(x, y, z + 1), g(x + 1, y, z + 1), g(x + 1, y + 1, z + 1), g(x, y + 1, z + 1)]);         // oben
      S.poly([g(x + 1, y, z), g(x + 1, y, z + 1), g(x + 1, y + 1, z + 1), g(x + 1, y + 1, z)]);         // rechts
    }
    return S.done();
  }
  // Bauten: Treppe (Spalten 1, 2, 3 … Würfel hoch), Mauer (w × h), L-Form, Quader (w × d × h)
  function treppe(w) { const c = []; for (let x = 0; x < w; x++) for (let z = 0; z <= x; z++) c.push([x, 0, z]); return c; }
  function mauer(w, h) { const c = []; for (let x = 0; x < w; x++) for (let z = 0; z < h; z++) c.push([x, 0, z]); return c; }
  function lForm(w, h) { const c = []; for (let x = 0; x < w; x++) c.push([x, 0, 0]); for (let z = 1; z < h; z++) c.push([0, 0, z]); return c; }
  function quaderW(w, d, h) { const c = []; for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) for (let z = 0; z < h; z++) c.push([x, y, z]); return c; }

  AG.registerType({
    id: "m6-wuerfelbauten",
    klasse: "6",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Quader",
    title: "Würfelbauten zählen",
    topic: "koerper",
    instruction: {
      1: "Zähle die Würfel im Bild. Zähle Spalte für Spalte.",
      2: "Zähle die Würfel im Bild. Denke an die Schichten hinter den Würfeln.",
      3: "Wie viele Würfel fehlen noch zu einem vollständigen Quader?",
    },
    merke: [
      "Bei Würfelbauten zählt man Schicht für Schicht. Ein Quader aus w · d · h Würfeln hat ",
      { b: "w · d · h Würfel" }, ". Beispiel: 3 · 2 · 2 = 12 Würfel.",
    ],
    cols: 2,
    generate(rng, level) {
      const name = rng.pick(["Lena", "Ben", "Mia", "Jonas", "Sara", "Tim", "Emma", "Paul"]);
      return retry(() => {
        if (level === 1) {
          const kind = rng.pick(["treppe", "mauer", "l"]);
          if (kind === "treppe") {
            const w = rng.int(3, 4), cells = treppe(w), n = w * (w + 1) / 2;
            const steps = [];
            const parts = [];
            for (let x = 0; x < w; x++) parts.push(String(x + 1));
            steps.push(rich("Spalten von links nach rechts: ", parts.join(", "), " Würfel"));
            steps.push(rich(parts.map(p => p).join(" + "), " = ", I(n)));
            return { q: rich(name, " baut aus Würfeln mit der Kante 1 cm eine Treppe mit ", I(w), " Stufen (siehe Bild). Wie viele Würfel sind es?"),
              a: rich(I(n), " Würfel"), steps, fig: cubesFig(cells), inline: false };
          }
          if (kind === "mauer") {
            const w = rng.int(3, 6), h = rng.int(2, 4), n = w * h;
            return { q: rich(name, " baut aus Würfeln mit der Kante 1 cm eine Mauer, die ", I(w), " Würfel lang ist (siehe Bild). Wie viele Würfel sind es?"),
              a: rich(I(n), " Würfel"),
              steps: [rich("Reihen: ", I(h), " Reihen mit je ", I(w), " Würfeln"), rich(I(h), " · ", I(w), " = ", I(n))],
              fig: cubesFig(mauer(w, h)), inline: false };
          }
          const w = rng.int(3, 5), h = rng.int(2, 4), n = w + h - 1;
          return { q: rich(name, " baut aus Würfeln mit der Kante 1 cm einen L-förmigen Körper, der ", I(w), " Würfel lang ist (siehe Bild). Wie viele Würfel sind es?"),
            a: rich(I(n), " Würfel"),
            steps: [rich("Waagerecht: ", I(w), " Würfel"), rich("Senkrecht ohne den Eckwürfel: ", I(h - 1), " Würfel"),
              rich(I(w), " + ", I(h - 1), " = ", I(n))],
            fig: cubesFig(lForm(w, h)), inline: false };
        }
        if (level === 2) {
          const w = rng.int(2, 5), d = rng.int(2, 3), h = rng.int(2, 3), n = w * d * h;
          return { q: rich(name, " baut einen Quader aus Würfeln mit der Kante 1 cm, der ", I(w), " Würfel lang und ", I(d),
              " Würfel breit ist (siehe Bild). Wie viele Würfel sind es?"),
            a: rich(I(n), " Würfel"),
            steps: [rich("Grundfläche: ", I(w), " · ", I(d), " = ", I(w * d), " Würfel"),
              rich("Übereinander: ", I(w * d), " · ", I(h), " = ", I(n))],
            fig: cubesFig(quaderW(w, d, h)), inline: false };
        }
        // Niveau 3: vollständiger Quader mit fehlenden Würfeln oben
        const w = rng.int(3, 4), d = rng.int(2, 3), h = rng.int(2, 3), T = w * d * h;
        const top = w * d, r = rng.int(1, top - 2);
        const removed = new Set();
        for (let i = 0; removed.size < r && i < 500; i++) removed.add(rng.int(0, top - 1));
        if (removed.size !== r) return null;
        const cells = quaderW(w, d, h).filter(([x, y, z]) => !(z === h - 1 && removed.has(x * d + y)));
        const P = cells.length;
        return { q: rich(name, " hat einen vollständigen Quader aus Würfeln mit der Kante 1 cm gebaut. Er hat die Maße ", I(w), " × ", I(d), " × ", I(h),
          " Würfel. Im Bild fehlen oben einige Würfel. Wie viele Würfel fehlen noch?"),
          a: rich(I(r), " Würfel"),
          steps: [rich("Vollständiger Quader: ", I(w), " · ", I(d), " · ", I(h), " = ", I(T), " Würfel"),
            rich("Im Bild: ", I(P), " Würfel"), rich("Fehlend: ", I(T), " − ", I(P), " = ", I(r), " Würfel")],
          fig: cubesFig(cells), inline: false };
      });
    },
  });

  // ---------- 5. Volumen in Sachaufgaben ----------
  const AW = [20, 25, 30, 40, 50, 60], BH = [20, 30, 40, 50, 60, 80];
  AG.registerType({
    id: "m6-volumen-sachaufgaben",
    klasse: "6",
    zug: "RM",
    lb: "5",
    lbTitle: "Rauminhalt – Quader",
    title: "Volumen in Sachaufgaben",
    topic: "koerper",
    instruction: {
      1: "Berechne den Rauminhalt. Schreibe die Rechnung auf.",
      2: "Rechne das Ergebnis in die verlangte Einheit um. Antworte mit einem Satz.",
      3: "Rechne rückwärts: Aus dem Volumen und der Grundfläche berechnest du die Höhe.",
    },
    merke: [
      "Volumen des Quaders: ", { b: "V = a · b · c" }, ". Liter und Kubikzentimeter: ", { b: "1 l = 1000 cm³" },
      ". Höhe aus Volumen: ", { b: "h = V : (a · b)" }, ". Beispiel: 60 cm · 30 cm · 30 cm = 54 000 cm³ = 54 l.",
    ],
    cols: 1,
    generate(rng, level) {
      return retry(() => {
        if (level === 1) {
          const a = rng.pick(AW), b = rng.pick(AW.slice(0, 4)), h = rng.pick(BH.slice(0, 4)), V = a * b * h;
          const what = rng.chance(0.5)
            ? ["Ein Umzugskarton", "Der Karton", "Er"]
            : ["Eine Kiste", "Die Kiste", "Sie"];
          return {
            q: rich(what[0], " ist a = ", cm(a), " lang, b = ", cm(b), " breit und h = ", cm(h), " hoch. Wie groß ist der Rauminhalt?"),
            a: rich(cm3(V)),
            steps: [rich("V = a · b · h = ", cm(a), " · ", cm(b), " · ", cm(h), " = ", cm3(V))],
            inline: false,
          };
        }
        if (level === 2) {
          if (rng.chance(0.5)) {
            // Aquarium in Litern (ganzzahlig)
            const a = rng.pick(AW), b = rng.pick(AW), h = rng.pick([20, 25, 30, 35, 40]), V = a * b * h;   // Aquarium: Wasser höchstens 40 cm hoch
            if (V % 1000 !== 0) return null;
            const L = V / 1000;
            return {
              q: rich("Ein Aquarium ist a = ", cm(a), " lang, b = ", cm(b), " breit und h = ", cm(h), " hoch. "
                + "Wie viele Liter Wasser passen höchstens hinein? (1 l = 1000 cm³)"),
              a: rich("Es passen höchstens ", I(L), " l Wasser hinein."),
              steps: [rich("V = ", cm(a), " · ", cm(b), " · ", cm(h), " = ", cm3(V)), rich("1 l = 1000 cm³"),
                rich("V = ", cm3(V), " : 1000 = ", I(L), " l")],
              inline: false,
            };
          }
          // Sandkasten in m³ mit Höhe in cm
          const a = rng.int(2, 5), b = rng.int(2, 4), h = rng.pick([20, 30, 40, 50, 60, 80]);
          const hm = new Frac(h, 100), V = hm.mul(a * b);
          return {
            q: rich("Ein Sandkasten ist a = ", I(a), " m lang und b = ", I(b), " m breit. Er soll bis zu einer Höhe von h = ",
              cm(h), " mit Sand gefüllt werden. Wie viel Kubikmeter Sand braucht man?"),
            a: rich("Man braucht ", nf(V), " m³ Sand."),
            steps: [rich("h = ", cm(h), " = ", nf(hm), " m"),
              rich("V = ", I(a), " m · ", I(b), " m · ", nf(hm), " m = ", nf(V), " m³")],
            inline: false,
          };
        }
        // Niveau 3: Höhe aus Volumen und Grundfläche (Aquarium, Angaben in Litern)
        const a = rng.pick(AW), b = rng.pick(AW), h = rng.pick([20, 25, 30, 35, 40]), V = a * b * h;   // Aquarium: Wasser höchstens 40 cm hoch
        if (V % 1000 !== 0) return null;
        const L = V / 1000, G = a * b;
        return {
          q: rich("Ein Aquarium ist a = ", cm(a), " lang und b = ", cm(b), " breit. Es enthält ", I(L),
            " l Wasser. Wie hoch steht das Wasser?"),
          a: rich("Das Wasser steht ", cm(h), " hoch."),
          steps: [rich("V = ", I(L), " l = ", cm3(V)),
            rich("Grundfläche: G = a · b = ", cm(a), " · ", cm(b), " = ", cm2(G)),
            rich("h = V : G = ", cm3(V), " : ", cm2(G), " = ", cm(h))],
          inline: false,
        };
      });
    },
  });

  // ---------- 6. Umkehraufgaben mit der Volumenformel ----------
  AG.registerType({
    id: "m6-quader-umkehr",
    klasse: "6",
    zug: "RM",
    lb: "7",
    lbTitle: "Gleichungen und Formeln",
    title: "Quader-Volumen rückwärts rechnen",
    topic: "terme",
    instruction: {
      1: "Setze die Werte in die Formel V = a · b · c ein. Berechne die gesuchte Länge.",
      2: "Stelle die Formel nach der gesuchten Größe um. Rechne Schritt für Schritt.",
      3: "Finde die gesuchte Zahl. Rechne die Schritte rückwärts.",
    },
    merke: [
      "Volumen: ", { b: "V = a · b · c" }, ". Gesucht c: ", { b: "c = V : (a · b)" },
      ". Beispiel: V = 120 cm³, a = 5 cm, b = 4 cm → c = 120 cm³ : 20 cm² = 6 cm. "
      + "Bei Zahlenrätseln rechnet man die Schritte rückwärts.",
    ],
    cols: 2,
    generate(rng, level) {
      return retry(() => {
        if (level === 1) {
          const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), V = a * b * c;
          return {
            q: rich("Ein Quader hat das Volumen V = ", cm3(V), ". Seine Länge ist a = ", cm(a), " und seine Breite b = ", cm(b),
              ". Berechne die Höhe c."),
            a: rich("c = ", cm(c)),
            steps: [rich("V = a · b · c"), rich(cm3(V), " = ", cm(a), " · ", cm(b), " · c = ", cm2(a * b), " · c"),
              rich("c = ", cm3(V), " : ", cm2(a * b), " = ", cm(c))],
            inline: false,
          };
        }
        if (level === 2) {
          const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), V = a * b * c;
          return {
            q: rich("Ein Quader hat das Volumen V = ", cm3(V), ". Seine Breite ist b = ", cm(b), " und seine Höhe c = ", cm(c),
              ". Berechne die Länge a."),
            a: rich("a = ", cm(a)),
            steps: [rich("V = a · b · c"), rich(cm3(V), " = a · ", cm(b), " · ", cm(c), " = a · ", cm2(b * c)),
              rich("a = ", cm3(V), " : ", cm2(b * c), " = ", cm(a))],
            inline: false,
          };
        }
        const kind = rng.int(0, 2);
        if (kind === 0) {
          // Würfelkante aus dem Volumen: Probieren
          const s = rng.int(2, 9), V = s * s * s;
          const trials = [];
          for (let t = 2; t <= s; t++) trials.push(t + " · " + t + " · " + t + " = " + I(t * t * t));
          return {
            q: rich("Ein Würfel hat das Volumen V = ", cm3(V), ". Wie lang ist eine Kante a?"),
            a: rich("a = ", cm(s)),
            steps: [rich("V = a · a · a"), rich(cm3(V), " = a · a · a"), rich("Probieren: ", trials.join(", ")),
              rich("a = ", cm(s))],
            inline: false,
          };
        }
        // Zahlenrätsel mit Dezimalzahlen oder Brüchen
        if (kind === 1) {
          const x = new Frac(rng.int(1, 99), 10), m = rng.int(2, 9), b = new Frac(rng.int(1, 30), 10);
          const plus = rng.chance(0.5);
          const c = plus ? x.mul(m).add(b) : x.mul(m).sub(b);
          if (!plus && c.sign() <= 0) return null;
          const sgn = plus ? "addiere" : "subtrahiere";
          const rest = plus ? c.sub(b) : c.add(b);
          return {
            q: rich("Ich denke mir eine Zahl. Ich multipliziere sie mit ", I(m), " und ", sgn, " ", nf(b), ". Ich erhalte ",
              nf(c), ". Welche Zahl habe ich mir gedacht?"),
            a: rich(nf(x)),
            steps: [rich(I(m), " · □ ", plus ? "+" : AG.MINUS, " ", nf(b), " = ", nf(c)),
              rich(I(m), " · □ = ", nf(c), plus ? " − " : " + ", nf(b), " = ", nf(rest)),
              rich("□ = ", nf(rest), " : ", I(m), " = ", nf(x))],
            inline: false,
          };
        }
        // Bruch als Faktor: p/d · □ + b = c, Lösung ganzzahlig
        const d = rng.int(2, 5), p = rng.int(1, d - 1);
        if (AG.gcd(p, d) !== 1) return null;
        const t = rng.int(1, 9), x = t * d, b = rng.int(1, 20), c = p * t + b;
        return {
          q: rich("Ich denke mir eine Zahl. Ich multipliziere sie mit ", { f: [p, d] }, " und addiere ", I(b),
            ". Ich erhalte ", I(c), ". Welche Zahl habe ich mir gedacht?"),
          a: rich(I(x)),
          steps: [rich({ f: [p, d] }, " · □ + ", I(b), " = ", I(c)),
            rich({ f: [p, d] }, " · □ = ", I(c), " − ", I(b), " = ", I(p * t)),
            rich("□ = ", I(p * t), " : ", { f: [p, d] }, " = ", I(x))],
          inline: false,
        };
      });
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
