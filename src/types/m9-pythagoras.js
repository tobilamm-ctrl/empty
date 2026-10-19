// M9 LB 3: Satz des Pythagoras und regelmäßige Vielecke – mit Skizzen (rechter Winkel, gesuchte Größe „?“).
// Typen: m9-pythagoras-seite, m9-rechtwinklig-pruefen, m9-pythagoras-anwendung, m9-vielecke (alle RM).
(function (AG) {
  const { Frac, num, rich, fmtDec, plain, MINUS: MI } = AG;
  const LB3 = "Geometrische Figuren, Körper und Lagebeziehungen";
  const TOPIC = "flaechen";
  const RAD = Math.PI / 180;
  const SUP2 = { sup: "2" };
  const INK = AG.SKETCH_COLORS.INK;
  const W1 = 75, H1 = 45;   // Skizzenfeld bei cols 2 (mm)
  const W3 = 100, H3 = 55;  // Skizzenfeld bei cols 1 (mm)
  const PAD = 8;

  // ---------- Hilfsfunktionen ----------
  const F = x => new Frac(x);
  const D = x => fmtDec(x);                          // Zahl mit Dezimalkomma (Frac oder ganze Zahl)
  const cm = x => D(x) + " cm";
  const met = x => D(x) + " m";
  const dn = x => num(x, { as: "dec" });             // Zahl als Rich mit Dezimalkomma
  const deg = x => D(x) + "°";
  const c2 = c => fmtDec(new Frac(c, 100), 2);       // ganze Hundertstel -> „12,21“
  const approx6 = v => (Math.floor(v * 1e5) / 1e5).toFixed(5).replace(".", ",") + "…"; // Taschenrechneranzeige
  const isSq = n => Number.isInteger(Math.sqrt(n));
  const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const clampR = (r, lo, hi) => Math.min(Math.max(r, lo), hi);

  // Quadratwurzel eines positiven Bruchs, falls rational (Zähler und Nenner Quadratzahlen), sonst null
  function fracSqrt(f) {
    const n = Math.round(Math.sqrt(f.n)), d = Math.round(Math.sqrt(f.d));
    return n * n === f.n && d * d === f.d ? new Frac(n, d) : null;
  }

  // Wurzelschritt: exakt (Ergebnis ohne ≈) oder gerundet auf zwei Nachkommastellen (mit ≈)
  function rootRes(tgt, M, unitTxt) {
    const r = fracSqrt(M), v = Math.sqrt(M.valueOf()), cents = Math.round(v * 100);
    if (r) {
      const val = D(r) + " " + unitTxt;
      return { exact: true, val, num: v, want: D(r), step: rich(tgt, " = √", dn(M), " = ", val), ans: rich(tgt, " = ", val) };
    }
    const val = c2(cents) + " " + unitTxt;
    return {
      exact: false, val, num: v, want: c2(cents),
      step: rich(tgt, " = √", dn(M), " = ", approx6(v), " ≈ ", val),
      ans: rich(tgt, " ≈ ", val),
    };
  }

  // Skizzenhilfen
  function sketchOf(pts, W, H, build, pad = PAD) {
    const f = AG.fitPoints(pts, W, H, pad);
    const P = pts.map(p => f(p));
    const s = AG.sketch(W, H);
    build(s, P);
    return s.done();
  }

  // Eckenbezeichnungen außen
  function names(s, P, letters) {
    const c = [P.reduce((t, p) => t + p[0], 0) / P.length, P.reduce((t, p) => t + p[1], 0) / P.length];
    P.forEach((V, i) => {
      const u = unit([V[0] - c[0], V[1] - c[1]]);
      const anchor = u[0] > 0.35 ? "start" : u[0] < -0.35 ? "end" : "middle";
      s.label([V[0] + u[0] * 4.6, V[1] + u[1] * 4.6], letters[i], { anchor });
    });
  }

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
    for (let i = 0; i < 200; i++) {
      const t = make();
      if ([t.fig, t.aFig].every(f => !f || labelsClean(f))) return t;
    }
    throw new Error("Skizze: keine saubere Beschriftung gefunden");
  }

  // Prüfung des Ergebnisses einer Wurzel (M = Quadrat der gesuchten Größe)
  function verifyRoot(t, M, want) {
    if (!(M > 0)) return "Quadrat nicht positiv";
    const w = parseFloat(want.replace(",", "."));
    if (Math.abs(Math.sqrt(M) - w) > 0.005 + 1e-9) return `Wert ${want} falsch (√M = ${Math.sqrt(M)})`;
    const s = plain(t.a);
    if (!s.includes(want)) return `Ergebnis „${want}“ fehlt in „${s}“`;
    return true;
  }

  // ---------- Typ 1: Fehlende Seite im rechtwinkligen Dreieck ----------
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

  // Quadrat der gesuchten Seite (exakt): c² = a² + b²  bzw.  b² = c² − a²
  function squareOf(vals, unk) {
    if (unk === "c") return vals.a.mul(vals.a).add(vals.b.mul(vals.b));
    const o = unk === "a" ? "b" : "a";
    return vals.c.mul(vals.c).sub(vals[o].mul(vals[o]));
  }

  // Dreieck mit rechtem Winkel bei C: a = CB (waagerecht), b = CA (senkrecht), c = AB (Hypotenuse)
  // ratio = b/a, begrenzt: nicht maßstabsgetreu, aber nicht zu flach oder spitz
  function triFig(ratio, lab) {
    const r = clampR(ratio, 0.6, 1.2);
    return sketchOf([[0, 0], [1, 0], [0, r]], W1, H1, (s, P) => {
      s.poly(P);
      s.right(P[0], P[1], P[2]);
      s.side(P[0], P[1], lab.a, { inside: P[2] });
      s.side(P[0], P[2], lab.b, { inside: P[1] });
      s.side(P[1], P[2], lab.c, { inside: P[0] });
      names(s, P, ["C", "B", "A"]);
    });
  }

  function pythTask(vals, unk) {
    const M = squareOf(vals, unk);
    const res = rootRes(unk, M, "cm");
    const o = unk === "a" ? "b" : "a";            // andere Kathete (bei unk = a oder b)
    const sumC = unk === "c";
    const [u1, u2] = sumC ? [vals.a, vals.b] : [vals.c, vals[o]];
    const op = sumC ? " + " : " " + MI + " ";
    const known = ["a", "b", "c"].filter(k => k !== unk);
    const numOf = k => (k === unk ? res.num : Number(vals[k]));
    const qlab = k => (k === unk ? k + " = ?" : k + " = " + cm(vals[k]));
    const alab = k => (k === unk ? k + (res.exact ? " = " : " ≈ ") + res.val : k + " = " + cm(vals[k]));
    return {
      q: rich("Im rechtwinkligen Dreieck ABC liegt der rechte Winkel bei C; c ist die Hypotenuse. Gegeben sind ",
        known.map(k => k + " = " + cm(vals[k])).join(" und "), ". Berechne die Seite ", unk, "."),
      a: res.ans,
      steps: [
        sumC ? rich("c", SUP2, " = a", SUP2, " + b", SUP2) : rich(unk, SUP2, " = c", SUP2, " ", MI, " ", o, SUP2),
        rich(unk, SUP2, " = ", dn(u1), SUP2, op, dn(u2), SUP2, " = ", dn(u1.mul(u1)), op, dn(u2.mul(u2)), " = ", dn(M)),
        res.step,
      ],
      fig: triFig(sumC ? numOf("b") / numOf("a") : 0.85, { a: qlab("a"), b: qlab("b"), c: qlab("c") }),
      aFig: triFig(numOf("b") / numOf("a"), { a: alab("a"), b: alab("b"), c: alab("c") }),
      inline: false,
      check: { a: numOf("a"), b: numOf("b"), c: numOf("c"), unk, want: res.want },
    };
  }

  function gen1(rng, level) {
    let vals, unk;
    if (level === 1) {
      // pythagoreische Tripel, ganzzahlig
      const [x, y, z] = rng.pick(TRIPLES);
      const k = rng.int(1, Math.floor(40 / z));
      const [p, q] = rng.shuffle([x * k, y * k]);
      vals = { a: F(p), b: F(q), c: F(z * k) };
      unk = rng.pick(["a", "b", "c"]);
    } else if (level === 2) {
      // keine Tripel: Ergebnis mit dem Taschenrechner, ≈ auf zwei Stellen
      for (let i = 0; ; i++) {
        if (i > 300) throw new Error("m9-pythagoras-seite: keine Zahlen gefunden");
        unk = rng.pick(["a", "b", "c"]);
        const p = rng.int(3, 20), q = rng.int(3, 20);
        if (unk === "c") {
          if (isSq(p * p + q * q)) continue;
          vals = { a: F(p), b: F(q) };
          break;
        }
        const c = rng.int(p + 1, 30), o = unk === "a" ? "b" : "a";
        if (isSq(c * c - p * p)) continue;
        vals = { c: F(c), [o]: F(p) };
        break;
      }
    } else {
      // Kathete gesucht, Dezimalzahlen mit einer Nachkommastelle
      for (let i = 0; ; i++) {
        if (i > 300) throw new Error("m9-pythagoras-seite: keine Zahlen gefunden");
        unk = rng.pick(["a", "b"]);
        const y = rng.int(60, 250), x = rng.int(11, y - 1);
        if (isSq(y * y - x * x)) continue;
        vals = { c: new Frac(y, 10), [unk === "a" ? "b" : "a"]: new Frac(x, 10) };
        break;
      }
    }
    return pythTask(vals, unk);
  }

  function verifyPy(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const M = k.unk === "c" ? k.a * k.a + k.b * k.b : k.c * k.c - (k.unk === "a" ? k.b : k.a) ** 2;
    return verifyRoot(t, M, k.want);
  }

  AG.registerType({
    id: "m9-pythagoras-seite",
    klasse: "9",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    topic: TOPIC,
    title: "Fehlende Seite im rechtwinkligen Dreieck",
    instruction: {
      1: "Berechne die gesuchte Seite.",
      2: "Berechne die gesuchte Seite mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
      3: "Berechne die gesuchte Kathete mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Im rechtwinkligen Dreieck gilt ", { b: "a² + b² = c²" },
      ". Die Hypotenuse c liegt dem rechten Winkel gegenüber. Eine Kathete berechnet man mit b² = c² − a². ",
      "Beispiel: a = 3 cm, b = 4 cm → c² = 9 + 16 = 25, also c = 5 cm.",
    ],
    cols: 2,
    generate: (rng, level) => retry(() => gen1(rng, level)),
    verify: verifyPy,
  });

  // ---------- Typ 2: Umkehrung des Satzes des Pythagoras ----------
  const TRIPLES2 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
  const PERT = { 1: [F(1), F(2)], 2: [new Frac(1, 10), new Frac(1, 2), F(1)], 3: [new Frac(1, 10), new Frac(2, 10), new Frac(1, 2)] };

  // drei Seiten (exakte Brüche), rechtwinklig oder knapp daneben
  function sides2(rng, level, right) {
    for (let i = 0; i < 400; i++) {
      const [x, y, z] = rng.pick(TRIPLES2);
      let s;
      if (level === 1) {
        const top = Math.floor(40 / z);
        if (top < 1) continue;
        s = F(rng.int(1, top));
      } else if (level === 2) s = new Frac(rng.int(5, Math.floor(400 / z)), 10);
      else s = new Frac(rng.int(10, Math.floor(600 / z)), 10);
      let v = [x, y, z].map(t => s.mul(t));
      if (!right) {
        const j = rng.int(0, 2), d = rng.pick(PERT[level]);
        const nv = rng.chance(0.5) ? v[j].add(d) : v[j].sub(d);
        if (nv.sign() <= 0) continue;
        v = v.map((t, idx) => (idx === j ? nv : t));
      }
      const srt = [...v].sort((p, q) => p.cmp(q));
      const isR = srt[0].mul(srt[0]).add(srt[1].mul(srt[1])).eq(srt[2].mul(srt[2]));
      if (isR !== right) continue;
      if (srt[2].cmp(srt[0].add(srt[1])) >= 0) continue; // Dreiecksungleichung
      return rng.shuffle(v);
    }
    throw new Error("m9-rechtwinklig-pruefen: keine Seiten gefunden");
  }

  function gen2(rng, level) {
    const right = rng.chance(0.5);
    const v = sides2(rng, level, right);
    const nm = ["a", "b", "c"];
    const L = [0, 1, 2].reduce((m, i) => (v[i].cmp(v[m]) > 0 ? i : m), 0);
    const [o1, o2] = [0, 1, 2].filter(i => i !== L);
    const sqL = v[L].mul(v[L]), s1 = v[o1].mul(v[o1]), s2 = v[o2].mul(v[o2]), sum = s1.add(s2);
    return {
      q: rich("Ist das Dreieck mit a = ", cm(v[0]), ", b = ", cm(v[1]), " und c = ", cm(v[2]), " rechtwinklig? Begründe mit einer Rechnung."),
      a: right
        ? rich("ja, das Dreieck ist rechtwinklig (rechter Winkel gegenüber von ", nm[L], ")")
        : rich("nein, das Dreieck ist nicht rechtwinklig"),
      steps: [
        rich("Die längste Seite ist ", nm[L], " = ", cm(v[L]), "."),
        rich(nm[o1], SUP2, " + ", nm[o2], SUP2, " = ", dn(v[o1]), SUP2, " + ", dn(v[o2]), SUP2, " = ", dn(s1), " + ", dn(s2), " = ", dn(sum)),
        rich(nm[L], SUP2, " = ", dn(v[L]), SUP2, " = ", dn(sqL)),
        right
          ? rich(dn(sum), " = ", dn(sqL), ", also gilt ", nm[o1], SUP2, " + ", nm[o2], SUP2, " = ", nm[L], SUP2, ". Das Dreieck ist rechtwinklig.")
          : rich(dn(sum), " ≠ ", dn(sqL), ", also gilt ", nm[o1], SUP2, " + ", nm[o2], SUP2, " ≠ ", nm[L], SUP2, ". Das Dreieck ist nicht rechtwinklig."),
      ],
      inline: false,
      check: { sides: v.map(Number), right },
    };
  }

  function verifyPruef(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const srt = [...k.sides].sort((p, q) => p - q);
    const right = Math.abs(srt[0] * srt[0] + srt[1] * srt[1] - srt[2] * srt[2]) < 1e-9;
    if (right !== k.right) return "Lösung falsch";
    const s = plain(t.a);
    if (right !== s.startsWith("ja")) return `Antwort „${s}“ passt nicht`;
    const st = (t.steps || []).map(x => plain(x)).join(" ");
    if (!right && !st.includes("≠")) return "Begründung ohne ≠";
    if (right && st.includes("≠")) return "Begründung widersprüchlich";
    return true;
  }

  AG.registerType({
    id: "m9-rechtwinklig-pruefen",
    klasse: "9",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    topic: TOPIC,
    title: "Rechtwinkligkeit prüfen",
    instruction: {
      1: "Prüfe mit dem Satz des Pythagoras, ob das Dreieck rechtwinklig ist.",
      2: "Prüfe, ob das Dreieck rechtwinklig ist. Achte auf die Dezimalkommas.",
      3: "Prüfe, ob das Dreieck rechtwinklig ist. Begründe mit einer vollständigen Rechnung.",
    },
    merke: [
      "Umkehrung des Satzes des Pythagoras: Gilt für die längste Seite c die Gleichung ", { b: "a² + b² = c²" },
      ", ist das Dreieck rechtwinklig. Sonst ist es nicht rechtwinklig. ",
      "Beispiel: 6 cm, 8 cm, 10 cm → 36 + 64 = 100 = 10², also rechtwinklig.",
    ],
    cols: 2,
    generate: (rng, level) => retry(() => gen2(rng, level)),
    verify: verifyPruef,
  });

  // ---------- Typ 3: Pythagoras in Figuren und Körpern ----------
  const RECT_CTX = ["Ein rechteckiges Spielfeld", "Ein rechteckiger Schulhof", "Eine rechteckige Wiese", "Ein rechteckiges Beet"];
  const SQ_CTX = ["Eine quadratische Terrasse", "Ein quadratisches Sandfeld", "Eine quadratische Tischplatte"];
  const BOX_CTX = ["Ein Aquarium", "Eine Versandkiste", "Ein Karton", "Eine Holzkiste"];

  // Rechteck mit Diagonale d: P0 unten links, P1 unten rechts, P2 oben rechts, P3 oben links
  function rectFig(w, h, lw, lh, ld) {
    return sketchOf([[0, 0], [w, 0], [w, h], [0, h]], W3, H3, (s, P) => {
      s.poly(P);
      P.forEach((v, i) => s.right(v, P[(i + 1) % 4], P[(i + 3) % 4]));
      s.line(P[0], P[2]);
      s.side(P[0], P[1], lw, { inside: P[2] });
      s.side(P[1], P[2], lh, { inside: P[0] });
      s.side(P[0], P[2], ld, { inside: P[1] });
    });
  }

  // Leiter an der Wand: P0 Wandfuß, P1 Leiterfuß, P2 Leiterende an der Wand (Länge L = Hypotenuse)
  function ladderFig(fN, hN, lf, lh, lL) {
    return sketchOf([[0, 0], [fN, 0], [0, hN]], W3, H3, (s, P) => {
      s.poly(P);
      s.right(P[0], P[1], P[2]);
      s.side(P[0], P[1], lf, { inside: P[2] });
      s.side(P[0], P[2], lh, { inside: P[1] });
      s.side(P[1], P[2], lL, { inside: P[0] });
    });
  }

  // Gleichschenkliges Dreieck (Giebel) mit Höhe h auf der Mitte der Grundseite g
  function giebelFig(gN, hN, lg, ls, lh) {
    return sketchOf([[-gN / 2, 0], [gN / 2, 0], [0, hN]], W3, H3, (s, P) => {
      s.poly(P);
      const M = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2];
      s.line(P[2], M, { dash: true });
      s.right(M, P[0], P[2]);
      s.side(P[0], P[1], lg, { inside: P[2] });
      s.side(P[0], P[2], ls, { inside: P[1] });
      s.side(P[1], P[2], ls, { inside: P[0] });
      s.label([M[0] - 1.2, (M[1] + P[2][1]) / 2], lh, { anchor: "end" });
    });
  }

  // Quader als Schrägbild: vorne a (lang) × c (hoch), Tiefe b; e = Grundflächendiagonale, D = Raumdiagonale
  function boxFig(a, b, c, labs) {
    const kd = clampR(b / a, 0.3, 0.6) * a * 0.6;    // Tiefe der Schrägansicht (nicht maßstabsgetreu, nicht zu breit)
    const dv = [kd * Math.SQRT1_2, kd * Math.SQRT1_2];
    const pts = [[0, 0], [a, 0], [a, c], [0, c]];
    const back = pts.map(p => [p[0] + dv[0], p[1] + dv[1]]);
    return sketchOf(pts.concat(back), W3, H3, (s, P) => {
      const [F0, F1, F2, F3, , B1, B2, B3] = P;
      const B0 = P[4];
      s.poly([F0, F1, F2, F3]);
      s.line(F0, B0, { dash: true });
      s.line(B0, B1, { dash: true });
      s.line(B0, B3, { dash: true });
      s.line(F1, B1);
      s.line(F2, B2);
      s.line(B1, B2);
      s.line(F3, B3);
      s.line(B2, B3);
      s.line(F0, B1, { dash: true });              // Grundflächendiagonale e
      s.line(F0, B2, { width: 0.6 });              // Raumdiagonale D
      s.right(F1, F0, F2);
      s.right(F2, F1, F3);
      s.right(F3, F2, F0);
      s.right(F0, F1, F3);
      s.side(F0, F1, labs.a, { inside: F3 });
      s.side(F1, B1, labs.b, { inside: F0 });
      s.side(F1, F2, labs.c, { inside: F0 });
      s.side(F0, B2, labs.D, { inside: F1 });
    });
  }

  // Stufe 1: Rechteck mit Diagonale (ganzzahlig)
  function l1Rect(rng) {
    const [x, y, z] = rng.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [20, 21, 29]]);
    const k = rng.int(Math.ceil(9 / x), Math.floor(40 / z));   // Seiten mindestens 9 m, Diagonale höchstens 40 m
    const l = F(y * k), b = F(x * k), M = l.mul(l).add(b.mul(b));
    const res = rootRes("d", M, "m");
    return {
      q: rich(rng.pick(RECT_CTX), " ist ", D(l), " m lang und ", D(b), " m breit. ",
        rng.pick(["Wie lang ist die Diagonale d vom einen zum gegenüberliegenden Eck?", "Berechne die Länge der Diagonale d von einer Ecke zur gegenüberliegenden Ecke."])),
      a: res.ans,
      steps: [
        rich("d", SUP2, " = l", SUP2, " + b", SUP2),
        rich("d", SUP2, " = ", D(l), SUP2, " + ", D(b), SUP2, " = ", D(l.mul(l)), " + ", D(b.mul(b)), " = ", D(M)),
        res.step,
      ],
      fig: rectFig(Number(l), Number(b), "l = " + met(l), "b = " + met(b), "d = ?"),
      aFig: rectFig(Number(l), Number(b), "l = " + met(l), "b = " + met(b), "d = " + res.val),
      inline: false,
      check: { M: M.valueOf(), want: res.want },
    };
  }

  // Leiter an der Wand: Stufe 1 ganzzahlig, Stufe 2 mit halben Metern (≈)
  function leiter(rng, level) {
    let L, f;
    if (level === 1) {
      // Tripel 7-24-25 und 5-12-13 in Dezimetern: Fuß etwa ein Viertel bis ein Drittel der Leiterlänge
      const [x, z, k] = rng.pick([[7, 25, 1], [7, 25, 2], [7, 25, 3], [5, 13, 3], [5, 13, 4], [5, 13, 5], [5, 13, 6]]);
      f = new Frac(x * k, 10);
      L = new Frac(z * k, 10);
    } else {
      const l2 = rng.int(7, 19);                        // 3,5 m bis 9,5 m
      L = new Frac(l2, 2);
      f = new Frac(rng.int(Math.max(2, Math.ceil(0.2 * l2)), Math.floor(0.38 * l2)), 2);   // sicherer Anstellwinkel
    }
    const M = L.mul(L).sub(f.mul(f));
    const res = rootRes("h", M, "m");
    return {
      q: rich(rng.pick(["Eine Leiter ist", "Eine Anlegeleiter ist"]), " L = ", met(L), " lang. Sie lehnt an einer senkrechten Hauswand, ihr unteres Ende steht f = ", met(f),
        " von der Wand entfernt. Wie hoch reicht die Leiter an der Wand (Höhe h)?"),
      a: res.ans,
      steps: [
        rich("h", SUP2, " = L", SUP2, " ", MI, " f", SUP2),
        rich("h", SUP2, " = ", D(L), SUP2, " ", MI, " ", D(f), SUP2, " = ", D(L.mul(L)), " ", MI, " ", D(f.mul(f)), " = ", D(M)),
        res.step,
      ],
      fig: ladderFig(Number(f), Number(f), "f = " + met(f), "h = ?", "L = " + met(L)),
      aFig: ladderFig(Number(f), clampR(res.num / Number(f), 0.6, 1.2) * Number(f), "f = " + met(f), "h " + (res.exact ? "= " : "≈ ") + res.val, "L = " + met(L)),
      inline: false,
      check: { M: M.valueOf(), want: res.want },
    };
  }

  // Giebel: gleichschenkliges Dreieck, Höhe h gesucht
  function giebel(rng) {
    const g = F(rng.pick([6, 8, 10, 12, 14])), half = g.div(2);
    const s = half.add(new Frac(rng.int(2, 6), 2));    // Dachschräge: 1 m bis 3 m länger als die halbe Breite
    const M = s.mul(s).sub(half.mul(half));
    const res = rootRes("h", M, "m");
    return {
      q: rich("Das Dach eines Gartenhauses hat die Form eines gleichschenkligen Dreiecks (Giebel). Die Grundseite g ist ",
        met(g), " lang, jede Dachschräge s ist ", met(s), " lang. Wie hoch ist der Giebel (Höhe h)?"),
      a: res.ans,
      steps: [
        rich("Die Höhe h halbiert die Grundseite: g : 2 = ", met(g), " : 2 = ", met(half), "."),
        rich("h", SUP2, " = s", SUP2, " ", MI, " (g : 2)", SUP2),
        rich("h", SUP2, " = ", D(s), SUP2, " ", MI, " ", D(half), SUP2, " = ", D(s.mul(s)), " ", MI, " ", D(half.mul(half)), " = ", D(M)),
        res.step,
      ],
      fig: giebelFig(Number(g), Number(half), "g = " + met(g), "s = " + met(s), "h = ?"),
      aFig: giebelFig(Number(g), clampR(res.num / Number(half), 0.5, 1.5) * Number(half), "g = " + met(g), "s = " + met(s), "h " + (res.exact ? "= " : "≈ ") + res.val),
      inline: false,
      check: { M: M.valueOf(), want: res.want },
    };
  }

  // Quadrat: Diagonale d = a√2 über d² = a² + a²
  function quadrat(rng) {
    const a = new Frac(rng.int(6, 30), 2);             // 3 m bis 15 m, in halben Metern
    const M = a.mul(a).mul(2);
    const res = rootRes("d", M, "m");
    return {
      q: rich(rng.pick(SQ_CTX), " hat die Seitenlänge a = ", met(a), ". Wie lang ist ihre Diagonale d?"),
      a: res.ans,
      steps: [
        rich("d", SUP2, " = a", SUP2, " + a", SUP2),
        rich("d", SUP2, " = ", D(a), SUP2, " + ", D(a), SUP2, " = ", D(a.mul(a)), " + ", D(a.mul(a)), " = ", D(M)),
        res.step,
      ],
      fig: rectFig(Number(a), Number(a), "a = " + met(a), "a = " + met(a), "d = ?"),
      aFig: rectFig(Number(a), Number(a), "a = " + met(a), "a = " + met(a), "d " + (res.exact ? "= " : "≈ ") + res.val),
      inline: false,
      check: { M: M.valueOf(), want: res.want },
    };
  }

  // Bildschirm: Diagonale in cm (Seitenverhältnis 16 : 9)
  function bildschirm(rng) {
    const k = rng.int(2, 5), w = F(16 * k), h = F(9 * k);
    const M = w.mul(w).add(h.mul(h));
    const res = rootRes("d", M, "cm");
    return {
      q: rich("Ein Fernseher ist ", D(w), " cm breit und ", D(h), " cm hoch. Wie lang ist die Diagonale d des Bildschirms?"),
      a: res.ans,
      steps: [
        rich("d", SUP2, " = b", SUP2, " + h", SUP2),
        rich("d", SUP2, " = ", D(w), SUP2, " + ", D(h), SUP2, " = ", D(w.mul(w)), " + ", D(h.mul(h)), " = ", D(M)),
        res.step,
      ],
      fig: rectFig(Number(w), Number(h), "b = " + cm(w), "h = " + cm(h), "d = ?"),
      aFig: rectFig(Number(w), Number(h), "b = " + cm(w), "h = " + cm(h), "d " + (res.exact ? "= " : "≈ ") + res.val),
      inline: false,
      check: { M: M.valueOf(), want: res.want },
    };
  }

  // Stufe 3: Raumdiagonale im Quader, zweimal Pythagoras
  function quader(rng) {
    const A = F(5 * rng.int(2, 16)), B = F(5 * rng.int(2, 16)), C = F(5 * rng.int(2, 8));
    const Me = A.mul(A).add(B.mul(B));                // e² (Grundfläche)
    const MD = Me.add(C.mul(C));                      // D² = e² + c²
    const res = rootRes("D", MD, "cm");
    return {
      q: rich(rng.pick(BOX_CTX), " ist a = ", cm(A), " lang, b = ", cm(B), " breit und c = ", cm(C),
        " hoch. Wie lang ist die Raumdiagonale D? Sie verbindet eine untere Ecke mit der gegenüberliegenden oberen Ecke."),
      a: res.ans,
      steps: [
        rich("Grundfläche mit der Diagonale e: e", SUP2, " = a", SUP2, " + b", SUP2),
        rich("e", SUP2, " = ", D(A), SUP2, " + ", D(B), SUP2, " = ", D(A.mul(A)), " + ", D(B.mul(B)), " = ", D(Me)),
        rich("Raumdiagonale: D", SUP2, " = e", SUP2, " + c", SUP2),
        rich("D", SUP2, " = ", D(Me), " + ", D(C), SUP2, " = ", D(Me), " + ", D(C.mul(C)), " = ", D(MD)),
        res.step,
      ],
      fig: boxFig(Number(A), Number(B), Number(C), { a: "a = " + cm(A), b: "b = " + cm(B), c: "c = " + cm(C), D: "D = ?" }),
      aFig: boxFig(Number(A), Number(B), Number(C), { a: "a = " + cm(A), b: "b = " + cm(B), c: "c = " + cm(C), D: "D " + (res.exact ? "= " : "≈ ") + res.val }),
      inline: false,
      check: { M: MD.valueOf(), want: res.want },
    };
  }

  function gen3(rng, level) {
    if (level === 1) return rng.chance(0.5) ? l1Rect(rng) : leiter(rng, 1);
    if (level === 2) {
      const r = rng.int(0, 3);
      return r === 0 ? quadrat(rng) : r === 1 ? giebel(rng) : r === 2 ? bildschirm(rng) : leiter(rng, 2);
    }
    return quader(rng);
  }

  function verifyAn(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    return verifyRoot(t, k.M, k.want);
  }

  AG.registerType({
    id: "m9-pythagoras-anwendung",
    klasse: "9",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    topic: TOPIC,
    title: "Pythagoras in Figuren und Körpern",
    instruction: {
      1: "Berechne die gesuchte Länge mit dem Satz des Pythagoras. Nutze die Skizze.",
      2: "Berechne die gesuchte Länge mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
      3: "Berechne die Raumdiagonale. Verwende den Satz des Pythagoras zweimal und runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Auch in Figuren und Körpern steckt ein rechtwinkliges Dreieck. Man sucht es in der Skizze und wendet den Satz des Pythagoras an. Im Quader braucht man ihn zweimal. ",
      "Beispiel: Quader mit a = 3 cm, b = 4 cm, c = 12 cm → e² = 9 + 16 = 25, also e = 5 cm; D² = 25 + 144 = 169, also D = 13 cm.",
    ],
    cols: 1,
    generate: (rng, level) => retry(() => gen3(rng, level)),
    verify: verifyAn,
  });

  // ---------- Typ 4: Regelmäßige Vielecke ----------
  const NS = [5, 6, 8, 10, 12];
  const NAME = { 5: "Fünfeck", 6: "Sechseck", 8: "Achteck", 10: "Zehneck", 12: "Zwölfeck" };
  // Sachkontext mit passender Längeneinheit
  const VCTX = [
    ["Ein Pavillon ist ein regelmäßiges", "m"], ["Ein Brunnenbecken ist ein regelmäßiges", "m"],
    ["Ein Blumenbeet ist ein regelmäßiges", "m"], ["Ein Windlicht ist ein regelmäßiges", "cm"],
    ["Eine Bodenfliese ist ein regelmäßiges", "cm"],
  ];
  const BEST = "Der Mittelpunkt M ist mit zwei benachbarten Ecken verbunden (Bestimmungsdreieck). ";

  // Ecken eines regelmäßigen Vielecks um den Ursprung (erste Ecke oben)
  function verts(n) {
    return Array.from({ length: n }, (_, k) => {
      const th = (90 + 360 * k / n) * RAD;
      return [Math.cos(th), Math.sin(th)];
    });
  }

  // Vieleck mit Mittelpunkt M und Bestimmungsdreieck (M, A, B); o: mu, base, side (Texte oder null)
  function polyFig(n, o) {
    return sketchOf([[0, 0], ...verts(n)], W1, H1, (s, P) => {
      const C = P[0], A = P[1], B = P[2];
      s.poly(P.slice(1));
      s.poly([C, A, B], { fill: false });
      s.circle(C, 0.5, { fill: INK });
      const muD = 360 / n;
      if (o.mu) s.angle(C, A, B, o.mu, { r: 4, textOffset: muD < 60 ? 4.2 + (60 - muD) * 0.1 : 3.4 });
      if (o.base) {
        s.angle(A, C, B, o.base, { r: 3.5 });
        s.angle(B, A, C, o.base, { r: 3.5 });
      }
      if (o.side) s.side(A, B, o.side, { inside: C });
      const m = unit([(A[0] + B[0]) / 2 - C[0], (A[1] + B[1]) / 2 - C[1]]);
      s.label([C[0] - m[0] * 4.2, C[1] - m[1] * 4.2], "M", { anchor: "middle" });
    }, 5);
  }

  // Vieleck mit Innenwinkel an einer Ecke (ohne Mittelpunkt)
  function interiorFig(n, label) {
    return sketchOf(verts(n), W1, H1, (s, P) => {
      s.poly(P);
      s.angle(P[0], P[n - 1], P[1], label, { r: 5 });
    });
  }

  // Nur ein Winkel am Mittelpunkt (ohne das ganze Vieleck, damit die Eckenzahl nicht verrät)
  // chord: Dreieck mit Sehne; sonst nur die beiden Schenkel
  function wedgeFig(angD, label, chord) {
    const a = angD * RAD;
    return sketchOf([[0, 0], [1, 0], [Math.cos(a), Math.sin(a)]], W1, H1, (s, P) => {
      if (chord) s.poly(P);
      else { s.line(P[0], P[1]); s.line(P[0], P[2]); }
      s.angle(P[0], P[1], P[2], label, { r: 6, textOffset: 6 });
    });
  }

  function gen4(rng, level) {
    const n = rng.pick(NS), NM = NAME[n], [ctx, unit] = rng.pick(VCTX);
    const cm = x => D(x) + " " + unit;
    const mu = F(360 / n), inner = F(180).sub(mu), base = F(180).sub(mu).div(2);
    const intro = s => ctx + " " + NM + " mit der Seitenlänge s = " + cm(s) + ". ";
    if (level === 1) {
      const s = unit === "m" ? new Frac(rng.int(2, 12), 2) : F(rng.int(2, 12));   // 1 m bis 6 m bzw. 2 cm bis 12 cm
      if (rng.chance(0.5)) return {
        q: rich(intro(s), BEST, "Berechne den Mittelpunktswinkel μ."),
        a: rich("μ = ", deg(mu)),
        steps: [rich("μ = 360° : n = 360° : ", D(n)), rich("μ = ", deg(mu))],
        fig: polyFig(n, { mu: "μ = ?", side: "s = " + cm(s) }),
        aFig: polyFig(n, { mu: "μ = " + deg(mu), side: "s = " + cm(s) }),
        inline: false,
        check: { n, kind: "mu", exp: 360 / n, want: D(mu) },
      };
      return {
        q: rich(intro(s), "Berechne den Umfang u."),
        a: rich("u = ", cm(s.mul(n))),
        steps: [rich("u = n · s = ", D(n), " · ", cm(s)), rich("u = ", cm(s.mul(n)))],
        fig: polyFig(n, { side: "s = " + cm(s) }),
        aFig: polyFig(n, { side: "s = " + cm(s) }),
        inline: false,
        check: { n, kind: "u", s: Number(s), exp: n * Number(s), want: D(s.mul(n)) },
      };
    }
    if (level === 2) {
      if (rng.chance(0.5)) {
        const s = unit === "m" ? new Frac(rng.int(2, 12), 2) : F(rng.int(2, 12));   // 1 m bis 6 m bzw. 2 cm bis 12 cm
        return {
          q: rich(intro(s), BEST, "Berechne einen Basiswinkel des Bestimmungsdreiecks."),
          a: rich("Basiswinkel = ", deg(base)),
          steps: [
            rich("μ = 360° : n = 360° : ", D(n), " = ", deg(mu)),
            rich("Basiswinkel = (180° ", MI, " μ) : 2 = (180° ", MI, " ", deg(mu), ") : 2 = ", deg(base)),
          ],
          fig: polyFig(n, { base: "?", side: "s = " + cm(s) }),
          aFig: polyFig(n, { base: deg(base), side: "s = " + cm(s) }),
          inline: false,
          check: { n, kind: "base", exp: (180 - 360 / n) / 2, want: D(base) },
        };
      }
      const s2 = new Frac(unit === "m" ? rng.int(2, 12) : rng.int(4, 40), 2);   // 1 m bis 6 m bzw. 2 cm bis 20 cm
      const u = s2.mul(n);
      return {
        q: rich(ctx, " ", NM, " mit dem Umfang u = ", cm(u), ". Berechne die Seitenlänge s."),
        a: rich("s = ", cm(s2)),
        steps: [rich("s = u : n = ", cm(u), " : ", D(n), " = ", cm(s2))],
        fig: polyFig(n, { side: "s = ?" }),
        aFig: polyFig(n, { side: "s = " + cm(s2) }),
        inline: false,
        check: { n, kind: "s", u: Number(u), exp: Number(s2), want: D(s2) },
      };
    }
    const r = rng.int(0, 2);
    if (r === 0) return {
      q: rich(ctx, " ", NM, rng.chance(0.5) ? ". Berechne einen Innenwinkel des Vielecks." : ". Wie groß ist ein Innenwinkel?"),
      a: rich("Innenwinkel = ", deg(inner)),
      steps: [
        rich("μ = 360° : n = 360° : ", D(n), " = ", deg(mu)),
        rich("Innenwinkel = 180° ", MI, " μ = 180° ", MI, " ", deg(mu), " = ", deg(inner)),
      ],
      fig: interiorFig(n, "?"),
      aFig: interiorFig(n, deg(inner)),
      inline: false,
      check: { n, kind: "inner", exp: 180 - 360 / n, want: D(inner) },
    };
    if (r === 1) return {
      q: rich(rng.pick([
        "Bei einem regelmäßigen Vieleck beträgt der Mittelpunktswinkel μ = " + deg(mu) + ". Der Mittelpunkt M ist mit zwei benachbarten Ecken verbunden. Wie viele Ecken hat das Vieleck?",
        "Ein regelmäßiges Vieleck hat den Mittelpunktswinkel μ = " + deg(mu) + " (Bestimmungsdreieck mit M). Wie viele Ecken hat es?",
        "Das Bestimmungsdreieck eines regelmäßigen Vielecks hat an der Spitze M den Winkel μ = " + deg(mu) + ". Wie viele Ecken hat das Vieleck?",
      ])),
      a: rich(D(n), " Ecken (", NM, ")"),
      steps: [
        rich("n = 360° : μ = 360° : ", deg(mu), " = ", D(n)),
        rich("Das Vieleck hat ", D(n), " Ecken, es ist ein ", NM, "."),
      ],
      fig: wedgeFig(Number(mu), "μ = " + deg(mu), true),
      inline: false,
      check: { n, kind: "n", exp: n, want: D(n) },
    };
    return {
      q: rich(rng.pick([
        "Ein regelmäßiges Vieleck hat Innenwinkel von " + deg(inner) + ". Wie viele Ecken hat es?",
        "Jeder Innenwinkel eines regelmäßigen Vielecks ist " + deg(inner) + " groß. Wie viele Ecken hat es?",
        "Die Innenwinkel eines regelmäßigen Vielecks betragen je " + deg(inner) + ". Aus wie vielen Ecken besteht es?",
      ])),
      a: rich(D(n), " Ecken (", NM, ")"),
      steps: [
        rich("μ = 180° ", MI, " ", deg(inner), " = ", deg(mu)),
        rich("n = 360° : μ = 360° : ", deg(mu), " = ", D(n)),
        rich("Das Vieleck hat ", D(n), " Ecken, es ist ein ", NM, "."),
      ],
      fig: wedgeFig(Number(inner), deg(inner), false),
      inline: false,
      check: { n, kind: "n", exp: n, want: D(n) },
    };
  }

  function verifyVi(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const mu = 360 / k.n;
    const exp = { mu, base: (180 - mu) / 2, u: k.n * k.s, s: k.u / k.n, inner: 180 - mu, n: k.n }[k.kind];
    if (exp === undefined || Math.abs(exp - k.exp) > 1e-9) return "Rechnung falsch";
    const s = plain(t.a);
    if (!s.includes(k.want)) return `Ergebnis „${k.want}“ fehlt in „${s}“`;
    return true;
  }

  AG.registerType({
    id: "m9-vielecke",
    klasse: "9",
    zug: "RM",
    lb: "3",
    lbTitle: LB3,
    topic: TOPIC,
    title: "Regelmäßige Vielecke",
    instruction: {
      1: "Berechne die gesuchte Größe. Nutze die Skizze.",
      2: "Berechne die gesuchte Größe. Achte auf die Einheiten.",
      3: "Berechne die gesuchte Größe. Begründe jeden Schritt mit den Eigenschaften des regelmäßigen Vielecks.",
    },
    merke: [
      "Ein regelmäßiges Vieleck hat gleich lange Seiten und gleich große Winkel. Mittelpunktswinkel ", { b: "μ = 360° : n" },
      ", Basiswinkel im Bestimmungsdreieck ", { b: "(180° − μ) : 2" }, ", Umfang ", { b: "u = n · s" },
      ", Innenwinkel ", { b: "180° − μ" }, ". Beispiel: Sechseck mit s = 4 cm → μ = 60°, u = 6 · 4 cm = 24 cm.",
    ],
    cols: 2,
    generate: (rng, level) => retry(() => gen4(rng, level)),
    verify: verifyVi,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
