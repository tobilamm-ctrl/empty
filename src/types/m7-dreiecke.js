// M7 LB 3: Fehlende Winkel in Figuren (Dreieck, Nebenwinkel, Viereck, gleichschenklig) und Dreiecksarten.
// Skizzen werden aus den echten Winkeln konstruiert (nicht maßstabsgetreu, aber Winkel ungefähr richtig).
(function (AG) {
  const { rich } = AG;
  const LB3 = "Geometrische Figuren, Körper und Lagebeziehungen";
  const GR = ["α", "β", "γ"];
  const VN = ["A", "B", "C"];
  const W = 70, H = 45, PAD = 8; // Skizzenfeld in mm (ca. 70 × 45)
  const RAD = Math.PI / 180;
  const sinD = d => Math.sin(d * RAD), cosD = d => Math.cos(d * RAD);
  const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const along = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const vsub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const centroid = P => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

  // Dreieck ABC aus den Winkeln α (bei A) und β (bei B), Seite AB = 1 (Einheiten, y nach oben)
  function triUnits(al, be) {
    const b = sinD(be) / sinD(180 - al - be); // Seite AC
    return [[0, 0], [1, 0], [b * cosD(al), b * sinD(al)]];
  }

  // Zeichnung: Punkte in Einheiten in das Feld einpassen, build(s, P) zeichnet mit mm-Punkten P
  function sketchOf(pts, build) {
    const f = AG.fitPoints(pts, W, H, PAD);
    const P = pts.map(p => f(p));
    const s = AG.sketch(W, H);
    build(s, P);
    return s.done();
  }

  // Winkelbogen mit Beschriftung; bei kleinen Winkeln weiter außen beschriften
  function arc(s, v, p, q, text, g) { s.angle(v, p, q, text, { r: 4, textOffset: g < 60 ? 5.8 + (60 - g) * 0.12 : 4.2 }); }

  // Eckenbezeichnungen außen
  function names(s, P, letters) {
    const c = centroid(P);
    P.forEach((V, i) => {
      const u = unit(vsub(V, c));
      const anchor = u[0] > 0.35 ? "start" : u[0] < -0.35 ? "end" : "middle";
      s.label(along(V, u, 4.6), letters[i], { anchor });
    });
  }

  // Winkelbögen an den Ecken A, B, C eines Dreiecks; txt = Beschriftungen je Ecke
  function triArcs(s, P, ang, txt) {
    const V = [[P[0], P[1], P[2]], [P[1], P[2], P[0]], [P[2], P[0], P[1]]];
    for (let i = 0; i < 3; i++) arc(s, V[i][0], V[i][1], V[i][2], txt[i], ang[i]);
  }

  // Beschriftung je Ecke: gesuchter Winkel "?" (in der Lösung mit Wert), sonst Wert
  const txtFor = (ang, u, sol) => [0, 1, 2].map(i => GR[i] + " = " + (i === u && !sol ? "?" : ang[i] + "°"));

  // Beschriftungen einer Skizze: keine Überlappung, nichts ragt aus dem Feld (Textbreite geschätzt)
  function labelsClean(fig) {
    const boxes = [];
    const re = /<text x="([-\d.]+)" y="([-\d.]+)" font-family="[^"]*" font-size="([\d.]+)" text-anchor="(\w+)"[^>]*>([^<]*)<\/text>/g;
    let m;
    while ((m = re.exec(fig.svg))) {
      const x = +m[1], y = +m[2], fs = +m[3], an = m[4];
      const w = m[5].length * fs * 0.55;
      const x0 = an === "start" ? x : an === "end" ? x - w : x - w / 2;
      const b = [x0, y - fs * 0.8, x0 + w, y + fs * 0.25];
      if (b[0] < 0 || b[2] > fig.w || b[1] < 0 || b[3] > fig.h) return false;
      boxes.push(b);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i], q = boxes[j];
      if (p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3]) return false;
    }
    return true;
  }
  // Aufgabe neu würfeln, bis die Skizzen sauber beschriftet sind (rng bleibt deterministisch)
  function retry(make) {
    let t;
    for (let i = 0; i < 200; i++) {
      t = make();
      if ([t.fig, t.aFig].every(f => !f || labelsClean(f))) return t;
    }
    return t;
  }

  // Gleiche Seiten markieren: kleiner Strich quer über die Seite
  function ticks(s, p, q, f = 0.5) {
    const m = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    const d = unit(vsub(q, p)), n = [-d[1], d[0]];
    s.line(along(m, n, -1.3), along(m, n, 1.3), { width: 0.5 });
  }

  // Dreieck aus zwei Winkeln, dritter Winkel ggf. gesucht
  function angleSketch(ang, u, sol) {
    return sketchOf(triUnits(ang[0], ang[1]), (s, P) => {
      s.poly(P);
      triArcs(s, P, ang, txtFor(ang, u, sol));
      names(s, P, VN);
    });
  }

  // ---------- Typ 1: Fehlende Winkel in Figuren ----------

  // Niveau 1: beliebiges Dreieck, zwei Winkel gegeben, dritter gesucht
  function niveau1(rng) {
    let ang;
    for (;;) {
      const al = rng.int(30, 110), be = rng.int(30, 110), ga = 180 - al - be;
      if (ga >= 30 && ga <= 110) { ang = [al, be, ga]; break; }
    }
    const u = rng.int(0, 2);
    const others = [0, 1, 2].filter(i => i !== u);
    const given = others.map(i => GR[i] + " = " + ang[i] + "°");
    return {
      q: rich(`Im Dreieck ABC sind ${given[0]} und ${given[1]} gegeben. Berechne ${GR[u]}.`),
      a: rich(`${GR[u]} = ${ang[u]}°`),
      steps: [rich(`${GR[u]} = 180° − ${others.map(i => ang[i] + "°").join(" − ")} = ${ang[u]}°`)],
      fig: angleSketch(ang, u, false),
      aFig: angleSketch(ang, u, true),
      inline: false,
      check: { kind: "tri", ang, u, exp: ang[u] },
    };
  }

  // Niveau 2: rechtwinkliges Dreieck, gleichschenklig mit Spitzenwinkel, gleichschenklig mit Basiswinkel
  function niveau2(rng) {
    const v = rng.int(0, 2);
    if (v === 0) {
      const al = rng.int(20, 70), be = 90 - al;
      const ang = [al, be, 90];
      const build = sol => sketchOf(triUnits(al, be), (s, P) => {
        s.poly(P);
        arc(s, P[0], P[1], P[2], GR[0] + " = " + al + "°", al);
        arc(s, P[1], P[2], P[0], sol ? GR[1] + " = " + be + "°" : "β = ?", be);
        s.right(P[2], P[0], P[1]);
        names(s, P, VN);
      });
      return {
        q: rich(`Im rechtwinkligen Dreieck ABC ist γ = 90° und α = ${al}°. Berechne β.`),
        a: rich(`β = ${be}°`),
        steps: [rich(`α + β = 180° − 90° = 90°`), rich(`β = 90° − ${al}° = ${be}°`)],
        fig: build(false), aFig: build(true), inline: false,
        check: { kind: "tri", ang, u: 1, exp: be },
      };
    }
    if (v === 1) {
      // Spitzenwinkel gegeben, Basiswinkel gesucht
      const g = 2 * rng.int(10, 65); // gerade Gradzahl, damit der Basiswinkel ganz ist
      const base = (180 - g) / 2;
      const ang = [base, base, g];
      const build = sol => sketchOf(triUnits(base, base), (s, P) => {
        s.poly(P);
        ticks(s, P[0], P[2], 0.6); ticks(s, P[1], P[2], 0.6);
        triArcs(s, P, ang, [0, 1, 2].map(i => GR[i] + " = " + (i < 2 && !sol ? "?" : ang[i] + "°")));
        names(s, P, VN);
      });
      return {
        q: rich(`Das Dreieck ABC ist gleichschenklig mit CA = CB (die gleich langen Seiten sind markiert). Der Winkel γ misst ${g}°. Berechne die Basiswinkel α und β.`),
        a: rich(`α = β = ${base}°`),
        steps: [rich(`α + β = 180° − ${g}° = ${180 - g}°`), rich(`α = β = ${180 - g}° : 2 = ${base}°`)],
        fig: build(false), aFig: build(true), inline: false,
        check: { kind: "tri", iso: true, ang, u: 0, exp: base },
      };
    }
    // Basiswinkel gegeben, Spitzenwinkel gesucht
    const base = rng.int(20, 80);
    const g = 180 - 2 * base;
    const ang = [base, base, g];
    const build = sol => sketchOf(triUnits(base, base), (s, P) => {
      s.poly(P);
      ticks(s, P[0], P[2], 0.6); ticks(s, P[1], P[2], 0.6);
      triArcs(s, P, ang, [GR[0] + " = " + base + "°", GR[1] + " = " + base + "°", GR[2] + " = " + (sol ? g + "°" : "?")]);
      names(s, P, VN);
    });
    return {
      q: rich(`Das Dreieck ABC ist gleichschenklig mit CA = CB (die gleich langen Seiten sind markiert). Die Basiswinkel α und β sind je ${base}° groß. Berechne γ.`),
      a: rich(`γ = ${g}°`),
      steps: [rich(`α + β = 2 · ${base}° = ${2 * base}°`), rich(`γ = 180° − ${2 * base}° = ${g}°`)],
      fig: build(false), aFig: build(true), inline: false,
      check: { kind: "tri", iso: true, ang, u: 2, exp: g },
    };
  }

  // Niveau 3: zusammengesetzte Figuren
  // (a) Dreieck mit Nebenwinkel an einer verlängerten Seite
  function niveau3Ext(rng) {
    let al, be;
    for (;;) {
      al = rng.int(25, 90); be = rng.int(25, 90);
      if (al + be <= 150) break;
    }
    const ga = 180 - al - be, X = al + be;
    const [A, B, C] = triUnits(al, be);
    const D = [C[0] + (C[0] - B[0]) * 0.6, C[1] + (C[1] - B[1]) * 0.6];
    const build = sol => sketchOf([A, B, C, D], (s, P) => {
      s.poly([P[0], P[1], P[2]]);
      s.line(P[2], P[3]);
      arc(s, P[0], P[1], P[2], GR[0] + " = " + al + "°", al);
      arc(s, P[1], P[2], P[0], GR[1] + " = " + be + "°", be);
      arc(s, P[2], P[3], P[0], sol ? X + "°" : "?", X);
      names(s, P, ["A", "B", "C", "D"]);
    });
    return {
      q: rich(`Im Dreieck ABC sind α = ${al}° und β = ${be}° gegeben. Die Seite BC ist über C hinaus bis D verlängert. Berechne den mit „?“ markierten Winkel DCA.`),
      a: rich(`∠DCA = ${X}°`),
      steps: [rich(`γ = 180° − ${al}° − ${be}° = ${ga}°`), rich(`∠DCA = 180° − ${ga}° = ${X}°`)],
      fig: build(false), aFig: build(true), inline: false,
      check: { kind: "ext", ang: [al, be, ga], exp: X },
    };
  }

  // (b) Zwei Dreiecke an einer gemeinsamen Seite (Diagonale BD im Viereck ABCD)
  function niveau3Quad(rng) {
    let a, b, c, d, d1, d2, A, C;
    for (;;) {
      a = rng.int(30, 100); b = rng.int(20, 80); c = rng.int(30, 100); d = rng.int(20, 80);
      d1 = 180 - a - b; d2 = 180 - c - d;
      if (d1 >= 25 && d2 >= 25 && d1 + d2 <= 160 && b + d <= 150) {
        // B = (0,0), D = (1,0); A oberhalb, C unterhalb der Diagonale
        const BA = sinD(d1) / sinD(a), BC = sinD(d2) / sinD(c);
        A = [BA * cosD(b), BA * sinD(b)];
        C = [BC * cosD(d), -BC * sinD(d)];
        // Seitenverhältnis: Figur soll weder zu hoch noch zu flach werden
        const xs = [A[0], 0, C[0], 1], ys = [A[1], 0, C[1], 0];
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        if (h / w >= 0.35 && h / w <= 0.8) break;
      }
    }
    const X = d1 + d2;
    const build = sol => sketchOf([A, [0, 0], C, [1, 0]], (s, P) => {
      s.poly(P);
      s.line(P[1], P[3]);
      arc(s, P[0], P[1], P[3], a + "°", a);     // ∠BAD
      arc(s, P[1], P[0], P[3], b + "°", b);     // ∠ABD
      arc(s, P[1], P[3], P[2], d + "°", d);     // ∠CBD
      arc(s, P[2], P[1], P[3], c + "°", c);     // ∠BCD
      arc(s, P[3], P[0], P[2], sol ? X + "°" : "?", X); // ∠ADC
      names(s, P, ["A", "B", "C", "D"]);
    });
    return {
      q: rich(`Im Viereck ABCD ist die Diagonale BD eingezeichnet. Es gilt: ∠BAD = ${a}°, ∠ABD = ${b}°, ∠CBD = ${d}°, ∠BCD = ${c}°. Berechne den mit „?“ markierten Winkel ADC.`),
      a: rich(`∠ADC = ${X}°`),
      steps: [
        rich(`∠ADB = 180° − ${a}° − ${b}° = ${d1}°`),
        rich(`∠BDC = 180° − ${c}° − ${d}° = ${d2}°`),
        rich(`∠ADC = ∠ADB + ∠BDC = ${d1}° + ${d2}° = ${X}°`),
      ],
      fig: build(false), aFig: build(true), inline: false,
      check: { kind: "quad", ang: [a, b, c, d], exp: X },
    };
  }

  // (c) Gleichschenkliges Dreieck mit Nebenwinkel an der Basis
  function niveau3Iso(rng) {
    const be = rng.int(20, 80), e = 180 - be, g = 180 - 2 * be;
    const [A, B, C] = triUnits(be, be);
    const D = [B[0] + (B[0] - A[0]) * 0.6, B[1]];
    const build = sol => sketchOf([A, B, C, D], (s, P) => {
      s.poly([P[0], P[1], P[2]]);
      s.line(P[1], P[3]);
      // Sehr spitzer Scheitel (< 45°): Striche in Seitenmitte, Beschriftung außerhalb über der Spitze
      const sharp = g < 45, f = sharp ? 0.5 : 0.6;
      ticks(s, P[0], P[2], f); ticks(s, P[1], P[2], f);
      arc(s, P[1], P[3], P[2], e + "°", e);
      const txt = sol ? GR[2] + " = " + g + "°" : GR[2] + " = ?";
      if (sharp) {
        arc(s, P[2], P[0], P[1], "", g);
        s.label([P[2][0], P[2][1] - 6], txt, { anchor: "middle" });
      } else {
        arc(s, P[2], P[0], P[1], txt, g);
      }
      names(s, P, ["A", "B", "C", "D"]);
    });
    return {
      q: rich(`Im Dreieck ABC gilt CA = CB (die gleich langen Seiten sind markiert). Die Seite AB ist über B hinaus bis D verlängert. Der Winkel CBD misst ${e}°. Berechne γ.`),
      a: rich(`γ = ${g}°`),
      steps: [
        rich(`β = 180° − ${e}° = ${be}°`),
        rich(`Der Basiswinkel bei A ist ebenso ${be}° (CA = CB).`),
        rich(`γ = 180° − 2 · ${be}° = ${g}°`),
      ],
      fig: build(false), aFig: build(true), inline: false,
      check: { kind: "iso", iso: true, ang: [be, be, g], ext: e, exp: g },
    };
  }

  function niveau3(rng) {
    const v = rng.int(0, 2);
    if (v === 0) return niveau3Ext(rng);
    if (v === 1) return niveau3Quad(rng);
    return niveau3Iso(rng);
  }

  function verifyWinkel(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const s = AG.plain(t.a);
    if (k.ang.some(x => !(x > 0))) return "Winkel nicht positiv";
    if (k.kind !== "quad" && k.ang.reduce((x, y) => x + y, 0) !== 180) return "Winkelsumme ≠ 180°";
    if (k.iso && k.ang[0] !== k.ang[1]) return "Basiswinkel nicht gleich";
    if (k.kind === "tri" && k.exp !== k.ang[k.u]) return "Ergebnis falsch";
    if (k.kind === "ext" && k.exp !== 180 - k.ang[2]) return "Nebenwinkel falsch";
    if (k.kind === "quad") {
      const d1 = 180 - k.ang[0] - k.ang[1], d2 = 180 - k.ang[2] - k.ang[3];
      if (d1 <= 0 || d2 <= 0 || k.exp !== d1 + d2 || k.exp >= 180) return "Viereck: Winkel falsch";
    }
    if (k.ext !== undefined && k.ext !== 180 - k.ang[0]) return "Außenwinkel falsch";
    if ((k.kind === "iso" || (k.iso && k.u === 2)) && k.exp !== 180 - 2 * k.ang[0]) return "Spitzenwinkel falsch";
    if (!new RegExp("(^|[^\\d])" + k.exp + "°").test(s)) return `Ergebnis ${k.exp}° fehlt in „${s}“`;
    return true;
  }

  AG.registerType({
    id: "m7-winkel-skizze",
    klasse: "7",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    title: "Fehlende Winkel in Figuren",
    instruction: {
      1: "Berechne den mit „?“ markierten Winkel in der Figur.",
      2: "Berechne den gesuchten Winkel. Nutze die Eigenschaften der Figur.",
      3: "Berechne den gesuchten Winkel. Begründe jeden Schritt.",
    },
    merke: [
      "Im Dreieck beträgt die Winkelsumme 180°. Nebenwinkel ergänzen sich zu 180°. Im gleichschenkligen Dreieck sind die Basiswinkel gleich groß. Beispiel: α = 50°, β = 60° → γ = 180° − 50° − 60° = 70°, der Nebenwinkel von γ ist 110°.",
    ],
    cols: 2,
    generate(rng, level) {
      return retry(() => level === 1 ? niveau1(rng) : level === 2 ? niveau2(rng) : niveau3(rng));
    },
    verify: verifyWinkel,
  });

  // ---------- Typ 2: Dreiecksarten bestimmen ----------

  const KINDS = ["sa", "sg", "sgs", "ra", "rg", "sta", "stg"];

  // Drei ganzzahlige Winkel passend zur Art (sa spitz allgemein, sg spitz gleichschenklig, sgs gleichseitig,
  // ra recht allgemein, rg recht gleichschenklig, sta stumpf allgemein, stg stumpf gleichschenklig)
  function angleSet(rng, kind) {
    for (;;) {
      if (kind === "sa") {
        const a = rng.int(25, 85), b = rng.int(25, 85), c = 180 - a - b;
        if (c >= 25 && c <= 85 && a !== b && a !== c && b !== c) return [a, b, c];
      } else if (kind === "sg") {
        const e = rng.int(46, 79);
        if (e !== 60) return [e, e, 180 - 2 * e];
      } else if (kind === "sgs") {
        return [60, 60, 60];
      } else if (kind === "ra") {
        const x = rng.int(20, 70);
        if (x !== 45) return [90, x, 90 - x];
      } else if (kind === "rg") {
        return [90, 45, 45];
      } else if (kind === "sta") {
        const s = rng.int(95, 135), r = 180 - s, x = rng.int(20, r - 20), y = r - x;
        if (y >= 20 && x !== y) return [s, x, y];
      } else {
        const e = rng.int(25, 40);
        return [180 - 2 * e, e, e];
      }
    }
  }

  // Art nach Winkeln aus bekannten Winkeln (null = unbekannt)
  function angWordFrom(ang) {
    const known = ang.filter(x => x !== null);
    const mx = Math.max(...known);
    if (known.length < 3 && mx < 90) return null;
    return mx > 90 ? "stumpfwinklig" : mx === 90 ? "rechtwinklig" : "spitzwinklig";
  }

  // Art nach Seiten aus Seitenlängen (null = unbekannt); bei Winkeln: gleiche Winkel <=> gleiche Seiten
  function sideWordFrom(sides) {
    const pair = [[0, 1], [1, 2], [0, 2]].some(([i, j]) => sides[i] !== null && sides[i] === sides[j]);
    if (sides.every(x => x !== null)) {
      if (sides[0] === sides[1] && sides[1] === sides[2]) return "gleichseitig";
      return pair ? "gleichschenklig" : "allgemein";
    }
    return pair ? "gleichschenklig" : null;
  }

  // Begründung der Winkelart aus allen drei Winkeln: spitzwinklig nur, wenn ALLE Winkel unter 90° sind
  const angWordText = ang => {
    const mx = Math.max(...ang);
    if (mx < 90) {
      const txt = ang[0] === ang[1] ? `α = β = ${ang[0]}°, γ = ${ang[2]}°` : ang.map((v, i) => GR[i] + " = " + v + "°").join(", ");
      return `spitzwinklig, weil alle Winkel kleiner als 90° sind (${txt})`;
    }
    const i = ang.indexOf(mx);
    return mx === 90 ? `rechtwinklig, weil ${GR[i]} = 90°` : `stumpfwinklig, weil ${GR[i]} = ${mx}° > 90°`;
  };

  // Lösungsschritt zur Winkelart in Niveau 1–2
  const angExpl = (aw, mx) => aw === "spitzwinklig" ? `alle Winkel kleiner als 90° (größter Winkel ${mx}°) → spitzwinklig`
    : aw === "rechtwinklig" ? "ein Winkel ist 90° → rechtwinklig"
    : `ein Winkel ist größer als 90° (${mx}°) → stumpfwinklig`;

  // Niveau 1: alle drei Winkel gegeben
  // Niveau 2: zwei Winkel gegeben, dritter berechnen
  function artLevel12(rng, level) {
    const kind = rng.pick(KINDS);
    const ang = rng.shuffle(angleSet(rng, kind));
    const aw = angWordFrom(ang), sw = sideWordFrom(ang);
    const sketch = rng.chance(0.5);
    const sideExpl = sw === "allgemein" ? "keine zwei Winkel gleich groß"
      : sw === "gleichseitig" ? "alle Winkel 60°" : "zwei Winkel gleich groß";
    const mx = Math.max(...ang);
    if (level === 1) {
      return {
        q: rich(`Im Dreieck ABC sind α = ${ang[0]}°, β = ${ang[1]}° und γ = ${ang[2]}° gegeben. Bestimme die Art des Dreiecks: spitzwinklig, rechtwinklig oder stumpfwinklig? Und gleichseitig, gleichschenklig oder allgemein?`),
        a: rich(`${aw}, ${sw}`),
        steps: [rich(angExpl(aw, mx)), rich(`${sideExpl} → ${sw}`)],
        fig: sketch ? angleSketch(ang, -1, false) : undefined,
        inline: false,
        check: { ang, sides: null, hidden: null },
      };
    }
    const h = rng.int(0, 2);
    const others = [0, 1, 2].filter(i => i !== h);
    const hidden = GR[h] + " = " + ang[h] + "°";
    return {
      q: rich(`Im Dreieck ABC sind ${others.map(i => GR[i] + " = " + ang[i] + "°").join(" und ")} gegeben. Berechne ${GR[h]} und bestimme die Art des Dreiecks (nach Winkeln und nach Seiten).`),
      a: rich(`${hidden}; ${aw}, ${sw}`),
      steps: [
        rich(`${GR[h]} = 180° − ${others.map(i => ang[i] + "°").join(" − ")} = ${ang[h]}°`),
        rich(angExpl(aw, mx)),
        rich(`${sideExpl} → ${sw}`),
      ],
      fig: sketch ? angleSketch(ang, h, false) : undefined,
      aFig: sketch ? angleSketch(ang, h, true) : undefined,
      inline: false,
      check: { ang, sides: null, hidden },
    };
  }

  // Niveau 3: Seitenlängen und ein Winkel, Begründung verlangt
  function art3(rng) {
    const v = rng.pick(["apex", "base", "right"]);
    if (v === "apex") {
      // a = b, Winkel γ zwischen den gleich langen Seiten gegeben
      const L = rng.int(4, 9);
      let g;
      do { g = 2 * rng.int(15, 70); } while (g === 60);
      const base = (180 - g) / 2;
      const pts = [[1, 0], [cosD(g), sinD(g)], [0, 0]]; // A, B, C; CA = CB = 1
      const fig = sketchOf(pts, (s, P) => {
        s.poly(P);
        arc(s, P[2], P[0], P[1], GR[2] + " = " + g + "°", g);
        s.side(P[2], P[1], "a = " + L + " cm", { inside: centroid(P) });
        s.side(P[2], P[0], "b = " + L + " cm", { inside: centroid(P) });
        names(s, P, VN);
      });
      return {
        q: rich(`Im Dreieck ABC sind a = b = ${L} cm lang. Der Winkel γ misst ${g}°. Bestimme die Art des Dreiecks nach Winkeln und nach Seiten und begründe.`),
        a: rich(`gleichschenklig, weil a = b; ${angWordText([base, base, g])}`),
        steps: [rich(`a = b, also α = β (Basiswinkel)`), rich(`α = β = (180° − ${g}°) : 2 = ${base}°`)],
        fig, inline: false,
        check: { ang: [base, base, g], sides: [L, L, null] },
      };
    }
    if (v === "base") {
      // a = b, Basiswinkel α gegeben, γ berechnen
      const L = rng.int(4, 9);
      let al;
      do { al = rng.int(20, 80); } while (al === 60);
      const g = 180 - 2 * al;
      const pts = [[1, 0], [cosD(g), sinD(g)], [0, 0]];
      const fig = sketchOf(pts, (s, P) => {
        s.poly(P);
        arc(s, P[0], P[1], P[2], GR[0] + " = " + al + "°", al);
        s.side(P[2], P[1], "a = " + L + " cm", { inside: centroid(P) });
        s.side(P[2], P[0], "b = " + L + " cm", { inside: centroid(P) });
        names(s, P, VN);
      });
      return {
        q: rich(`Im Dreieck ABC sind a = b = ${L} cm lang. Der Winkel α misst ${al}°. Bestimme die Art des Dreiecks nach Winkeln und nach Seiten und begründe.`),
        a: rich(`gleichschenklig, weil a = b; ${angWordText([al, al, g])}`),
        steps: [rich(`a = b, also β = α = ${al}°`), rich(`γ = 180° − ${al}° − ${al}° = ${g}°`)],
        fig, inline: false,
        check: { ang: [al, al, g], sides: [L, L, null] },
      };
    }
    // Rechtwinkliges Dreieck mit Seiten 3 : 4 : 5 (·k), alle Seiten verschieden lang
    const k = rng.pick([1, 2, 3]);
    const pts = [[4, 0], [0, 3], [0, 0]]; // C = rechter Winkel, CA = 4, CB = 3
    const fig = sketchOf(pts, (s, P) => {
      s.poly(P);
      s.right(P[2], P[0], P[1]);
      s.side(P[2], P[1], `a = ${3 * k} cm`, { inside: centroid(P) });
      s.side(P[2], P[0], `b = ${4 * k} cm`, { inside: centroid(P) });
      s.side(P[0], P[1], `c = ${5 * k} cm`, { inside: centroid(P) });
      names(s, P, VN);
    });
    return {
      q: rich(`Im Dreieck ABC sind a = ${3 * k} cm, b = ${4 * k} cm und c = ${5 * k} cm lang. Der Winkel γ ist ein rechter Winkel. Bestimme die Art des Dreiecks nach Winkeln und nach Seiten und begründe.`),
      a: rich("rechtwinklig, weil γ = 90°; allgemein, weil alle Seiten verschieden lang sind"),
      steps: [rich("γ = 90° (rechter Winkel)"), rich(`a, b und c sind verschieden lang → allgemein`)],
      fig, inline: false,
      check: { ang: [null, null, 90], sides: [3 * k, 4 * k, 5 * k] },
    };
  }

  function verifyArt(t, level) {
    const st = (t.steps || []).map(x => AG.plain(x)).join(" ");
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const s = AG.plain(t.a);
    if (k.ang.every(x => x !== null)) {
      if (k.ang.reduce((x, y) => x + y, 0) !== 180) return "Winkelsumme ≠ 180°";
      if (k.ang.some(x => !(x > 0))) return "Winkel nicht positiv";
    }
    const aw = angWordFrom(k.ang), sw = sideWordFrom(k.sides || k.ang);
    if (!aw || !sw) return "Art nicht bestimmbar";
    const ANG = ["spitzwinklig", "rechtwinklig", "stumpfwinklig"], SIDE = ["gleichseitig", "gleichschenklig", "allgemein"];
    const has = w => new RegExp("(^|[^a-zäöüß])" + w + "([^a-zäöüß]|$)").test(s);
    for (const w of ANG) if (has(w) !== (w === aw)) return `Winkelart: erwartet „${aw}“, steht „${s}“`;
    for (const w of SIDE) if (has(w) !== (w === sw)) return `Seitenart: erwartet „${sw}“, steht „${s}“`;
    if (k.hidden && !s.includes(k.hidden)) return `Lösung „${k.hidden}“ fehlt in „${s}“`;
    if (level === 3 && !s.includes("weil")) return "Begründung fehlt";
    if (aw === "spitzwinklig" && level === 3 && !s.includes("alle Winkel kleiner als 90°")) return "Spitzwinkel nicht über alle Winkel begründet";
    if (aw === "spitzwinklig" && level < 3 && !st.includes("alle Winkel kleiner als 90°")) return "Lösungsschritt zur Spitzwinkligkeit fehlt";
    return true;
  }

  AG.registerType({
    id: "m7-dreiecksarten",
    klasse: "7",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    title: "Dreiecksarten bestimmen",
    instruction: {
      1: "Bestimme die Art des Dreiecks nach Winkeln und nach Seiten.",
      2: "Berechne zuerst den fehlenden Winkel. Bestimme dann die Art des Dreiecks.",
      3: "Bestimme die Art des Dreiecks und begründe deine Antwort.",
    },
    merke: [
      "Nach Winkeln: spitzwinklig (alle Winkel unter 90°), rechtwinklig (ein Winkel 90°), stumpfwinklig (ein Winkel über 90°). Nach Seiten: gleichseitig (alle Seiten gleich lang), gleichschenklig (zwei Seiten gleich lang), allgemein (keine zwei gleich lang). Beispiel: α = 50°, β = 60°, γ = 70° → spitzwinklig, allgemein.",
    ],
    cols: 2,
    generate(rng, level) {
      return retry(() => level === 3 ? art3(rng) : artLevel12(rng, level));
    },
    verify: verifyArt,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
