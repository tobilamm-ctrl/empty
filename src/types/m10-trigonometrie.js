// M10 LB 4: Trigonometrie im rechtwinkligen Dreieck – mit Skizzen (rechter Winkel, gesuchte Größe „?“).
// Typen: m10-sin-cos-tan-seite, m10-winkel-berechnen, m10-trigo-sachaufgabe (Klasse 10, M-Zug, Thema „winkel“).
(function (AG) {
  const { rich } = AG;
  const KL = "10", ZUG = "M", LB = "4", LBT = "Trigonometrie", TOPIC = "winkel";
  const RAD = Math.PI / 180;
  const TRIG = { sin: d => Math.sin(d * RAD), cos: d => Math.cos(d * RAD), tan: d => Math.tan(d * RAD) };
  const INV = { sin: x => Math.asin(x) / RAD, cos: x => Math.acos(x) / RAD, tan: x => Math.atan(x) / RAD }; // Grad
  const GREEK = { A: "α", B: "β" };
  const WORDS = { sin: ["Gegenkathete", "Hypotenuse"], cos: ["Ankathete", "Hypotenuse"], tan: ["Gegenkathete", "Ankathete"] };
  const W1 = 75, H1 = 45, PAD1 = 12;  // Skizzenfeld bei cols 2 (mm), Rand mit Platz für Beschriftungen
  const W3 = 100, H3 = 55, PAD3 = 9;  // Skizzenfeld bei cols 1 (mm)

  // ---------- Zahlen und Rundung ----------
  const fx = (x, n) => (Math.round(x * 10 ** n) / 10 ** n).toFixed(n).replace(".", ",");  // Dezimalkomma, gerundet
  const r4 = x => Math.round(x * 1e4) / 1e4;                                                 // Taschenrechnerwert (4 Stellen)
  const short4 = x => String(r4(x)).replace(".", ",");
  const inp = x => (Number.isInteger(x) ? String(x) : fx(x, 1));                              // gegebene Länge
  const num = s => parseFloat(s.replace(",", "."));
  const safe = (x, n) => { const s = x * 10 ** n; return Math.abs(s - Math.floor(s) - 0.5) > 1e-6; }; // keine Rundungsgrenze
  const agree = (ex, ch, n) => safe(ex, n) && fx(ex, n) === fx(ch, n);                       // exakt = Rechnung mit gerundeten Werten

  // ---------- Dreiecksbezeichnungen ----------
  // Dreieck ABC, rechter Winkel bei C: a = BC, b = CA, c = AB (Hypotenuse).
  // Gegenkathete und Ankathete beziehen sich auf den Winkel am Eckpunkt V.
  const LEG = V => (V === "A" ? { opp: "a", adj: "b" } : { opp: "b", adj: "a" });
  function ratioSides(fn, V) {
    const { opp, adj } = LEG(V);
    return fn === "sin" ? [opp, "c"] : fn === "cos" ? [adj, "c"] : [opp, adj];
  }
  const relation = (fn, V) => {
    const [n, d] = ratioSides(fn, V);
    return `${fn} ${GREEK[V]} = ${WORDS[fn][0]} : ${WORDS[fn][1]} = ${n} : ${d}`;
  };

  // ---------- Skizzen ----------
  // Beschriftungen: keine Überlappung, nichts ragt aus dem Feld (Textbreite geschätzt)
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
  // Aufgabe neu würfeln, bis die Skizzen sauber beschriftet sind
  function retry(make) {
    for (let i = 0; i < 200; i++) {
      const t = make();
      if (t && [t.fig, t.aFig].every(f => !f || labelsClean(f))) return t;
    }
    throw new Error("Skizze: keine saubere Beschriftung gefunden");
  }
  function vertexNames(s, P, L) {
    const cx = P.reduce((t, p) => t + p[0], 0) / P.length, cy = P.reduce((t, p) => t + p[1], 0) / P.length;
    P.forEach((V, i) => {
      let dx = V[0] - cx, dy = V[1] - cy;
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const anchor = dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle";
      s.label([V[0] + dx * 4.6, V[1] + dy * 4.6], L[i], { anchor });
    });
  }

  // Dreieck C (rechter Winkel), A (waagerecht), B (senkrecht über C); Winkel am Eckpunkt V
  // lens: Längen a, b, c (cm); labs: Beschriftung je Seite (oder null); angTxt: Text am Winkelbogen
  function triFig(V, lens, labs, angTxt) {
    const pts = [[0, 0], [lens.b, 0], [0, lens.a]];   // C, A, B (y nach oben)
    const f = AG.fitPoints(pts, W1, H1, PAD1);
    const [C, A, B] = pts.map(f);
    const s = AG.sketch(W1, H1);
    s.poly([C, A, B]);
    s.right(C, A, B);
    if (labs.a) s.side(B, C, labs.a, { inside: A });
    if (labs.b) s.side(C, A, labs.b, { inside: B });
    if (labs.c) s.side(A, B, labs.c, { inside: C });
    const P = { C, A, B };
    const [p, q] = V === "A" ? [C, B] : [C, A];
    angleMark(s, P[V], p, q, angTxt, true);
    vertexNames(s, [C, A, B], ["C", "A", "B"]);
    return s.done();
  }

  // Winkelbogen mit Beschriftung. Kleiner Winkel: Text unter der Grundlinie; mittlerer: innen am Bogen;
  // großer Winkel: Text links außerhalb neben der Hypotenuse.
  // out: Text außerhalb des Dreiecks (gegenüber der Winkelmitte), sonst innen am Bogen
  function angleMark(s, V, p, q, txt, out = false) {
    const u1 = [p[0] - V[0], p[1] - V[1]], u2 = [q[0] - V[0], q[1] - V[1]];
    const l1 = Math.hypot(...u1), l2 = Math.hypot(...u2);
    const th = Math.acos(Math.max(-1, Math.min(1, (u1[0] * u2[0] + u1[1] * u2[1]) / (l1 * l2)))) / RAD;
    s.angle(V, p, q, null);
    const bx = u1[0] / l1 + u2[0] / l2, by = u1[1] / l1 + u2[1] / l2, bl = Math.hypot(bx, by) || 1;
    if (out) s.label([V[0] - (bx / bl) * 11, V[1] - (by / bl) * 11], txt, { anchor: "middle" });
    else if (th <= 20) s.label([V[0] + 12, V[1] + 4.5], txt, { anchor: "middle" });
    else if (th <= 50) s.label([V[0] + (bx / bl) * 10, V[1] + (by / bl) * 10], txt, { anchor: "middle" });
    else s.label([V[0] - 2, V[1] - 10], txt, { anchor: "end" });
  }

  // Rechtwinkliges Dreieck für Sachaufgaben: H = Winkelscheitel (links unten), G = rechter Winkel (rechts unten),
  // K = oben rechts. ratio = Höhe : waagerechte Strecke; zur Zeichnung begrenzt (nicht maßstabsgetreu).
  // Platz rechts für die Maßbeschriftung der senkrechten Seite, unten für die Grundseite.
  function rtFig(ratio, lab) {
    const rr = Math.min(Math.max(ratio, 0.25), 2.2);
    const sc = Math.min(70, 40 / rr);                  // Grundseite in mm
    const x0 = 8 + (70 - sc) / 2, yb = H3 - 9;
    const Ph = [x0, yb], G = [x0 + sc, yb], K = [x0 + sc, yb - sc * rr];
    const s = AG.sketch(W3, H3);
    s.poly([Ph, G, K]);
    s.right(G, Ph, K);
    if (lab.bottom) s.side(Ph, G, lab.bottom, { inside: K });
    if (lab.side) s.side(G, K, lab.side, { inside: [G[0] - 100, G[1]] });   // außen rechts
    if (lab.hyp) s.side(Ph, K, lab.hyp, { inside: G });
    if (lab.ang) angleMark(s, Ph, G, K, lab.ang);
    return s.done();
  }

  // Prüfung gegen den gespeicherten Sollwert (check): Text und exakter Wert müssen zusammenpassen
  function verifyValue(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const s = AG.plain(t.a);
    if (!s.includes(k.want)) return `Ergebnis „${k.want}“ fehlt in „${s}“`;
    if (Math.abs(num(k.want) - k.value) > 0.5 * 10 ** -k.dec + 1e-9) return `Wert ${k.want} weicht von ${k.value} ab`;
    return true;
  }

  // ---------- Typ 1: Seite berechnen (Sinus, Kosinus, Tangens) ----------
  function gen1(rng, level) {
    for (let i = 0; i < 400; i++) {
      const V = rng.pick(["A", "B"]), g = GREEK[V], phi = rng.int(30, 60);
      const { opp, adj } = LEG(V);
      const [kn, un, fn] = level === 1 ? rng.pick([["c", opp, "sin"], ["c", adj, "cos"]])
        : level === 2 ? rng.pick([[opp, adj, "tan"], [adj, opp, "tan"]])
          : rng.pick([[opp, "c", "sin"], [adj, "c", "cos"]]);
      const vKn = level === 1 ? rng.int(5, 20) : level === 2 ? rng.int(3, 15) : rng.int(20, 150) / 10;
      const tr = TRIG[fn](phi), tr4 = r4(tr);
      const mul = fn === "tan" ? un === opp : un !== "c";   // gesuchte Seite = bekannte Seite · Funktion (sonst geteilt)
      const uEx = mul ? vKn * tr : vKn / tr;
      const uCh = mul ? vKn * tr4 : vKn / tr4;
      if (uEx < 1 || !agree(uEx, uCh, 2)) continue;

      // Geometrie für die Skizze (exakt)
      const L = {};
      if (fn === "tan") {
        L[opp] = kn === opp ? vKn : uEx;
        L[adj] = kn === adj ? vKn : uEx;
        L.c = Math.hypot(L[opp], L[adj]);
      } else {
        L.c = kn === "c" ? vKn : uEx;
        L[opp] = L.c * TRIG.sin(phi);
        L[adj] = L.c * TRIG.cos(phi);
      }

      const vs = `${inp(vKn)} cm`;
      const labs = { a: null, b: null, c: null };
      labs[kn] = `${kn} = ${vs}`;
      labs[un] = `${un} = ?`;
      const aLabs = { ...labs, [un]: `${un} = ${fx(uEx, 2)} cm` };
      const fig = triFig(V, L, labs, `${g} = ${phi}°`);
      const aFig = triFig(V, L, aLabs, `${g} = ${phi}°`);
      const steps = [
        rich(relation(fn, V)),
        rich(`${un} = ${mul ? `${kn} · ${fn} ${g} = ${vs} · ${fn} ${phi}°` : `${kn} : ${fn} ${g} = ${vs} : ${fn} ${phi}°`}`),
        rich(`${un} ≈ ${vs} ${mul ? "·" : ":"} ${short4(tr4)} ≈ ${fx(uEx, 2)} cm`),
      ];
      return {
        q: rich(`Im rechtwinkligen Dreieck ABC ist C der rechte Winkel. Gegeben sind ${g} = ${phi}° und ${kn} = ${vs}. Berechne die Seite ${un}.`),
        a: rich(`${un} ≈ ${fx(uEx, 2)} cm`),
        steps, fig, aFig, inline: false,
        check: { want: fx(uEx, 2), value: uEx, dec: 2 },
      };
    }
    throw new Error("m10-sin-cos-tan-seite: keine Zahlen gefunden");
  }

  AG.registerType({
    id: "m10-sin-cos-tan-seite",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Seite mit Sinus, Kosinus und Tangens",
    instruction: {
      1: "Berechne die gesuchte Seite. Runde auf zwei Nachkommastellen.",
      2: "Berechne die gesuchte Seite mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
      3: "Berechne die gesuchte Seite mit dem Taschenrechner. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Im rechtwinkligen Dreieck gilt für den Winkel α: ", { b: "sin α = Gegenkathete : Hypotenuse" },
      ", ", { b: "cos α = Ankathete : Hypotenuse" }, ", ", { b: "tan α = Gegenkathete : Ankathete" },
      ". Beispiel: α = 30°, Hypotenuse c = 10 cm → Gegenkathete a = c · sin 30° = 10 cm · 0,5 = 5 cm.",
    ],
    cols: 2,
    levels: [1, 2, 3],
    generate: (rng, level) => retry(() => gen1(rng, level)),
    verify: verifyValue,
  });

  // ---------- Typ 2: Winkel berechnen (Umkehrfunktionen) ----------
  function gen2(rng, level) {
    for (let i = 0; i < 400; i++) {
      const V = rng.pick(["A", "B"]), g = GREEK[V];
      const { opp, adj } = LEG(V);
      let fn;
      const val = {};   // gegebene Seiten: Buchstabe → Länge
      if (level === 1) {
        fn = "tan";
        val[opp] = rng.int(3, 15); val[adj] = rng.int(3, 15);
      } else if (level === 2) {
        fn = rng.pick(["sin", "cos"]);
        const c = rng.int(5, 20), leg = rng.int(2, c - 1);
        val.c = c; val[fn === "sin" ? opp : adj] = leg;
      } else {
        fn = rng.pick(["tan", "sin", "cos"]);
        if (fn === "tan") { val[opp] = rng.int(10, 150) / 10; val[adj] = rng.int(10, 150) / 10; }
        else {
          const c = rng.int(50, 250) / 10;
          val.c = c; val[fn === "sin" ? opp : adj] = rng.int(10, Math.round(c * 10) - 1) / 10;
        }
      }
      const [n, d] = ratioSides(fn, V);
      const vn = val[n], vd = val[d];
      const ratio = vn / vd, rr = r4(ratio);
      const ex = INV[fn](ratio), ch = INV[fn](rr);
      if (ex < 25 || ex > 65 || !agree(ex, ch, 1)) continue;

      // Geometrie (exakt): fehlende Seite über den Satz des Pythagoras bzw. aus dem Winkel
      const L = {};
      if (fn === "tan") {
        L[opp] = val[opp]; L[adj] = val[adj]; L.c = Math.hypot(L[opp], L[adj]);
      } else {
        L.c = val.c;
        const given = fn === "sin" ? opp : adj, other = fn === "sin" ? adj : opp;
        L[given] = val[given];
        L[other] = Math.sqrt(L.c * L.c - L[given] * L[given]);
      }
      const labs = { a: null, b: null, c: null };
      for (const x of ["a", "b", "c"]) if (val[x] !== undefined) labs[x] = `${x} = ${inp(val[x])} cm`;
      const givenSides = ["a", "b", "c"].filter(x => val[x] !== undefined);
      const fig = triFig(V, L, labs, `${g} = ?`);
      const aFig = triFig(V, L, labs, `${g} = ${fx(ex, 1)}°`);
      const eq = Math.abs(ratio - rr) < 1e-9 ? "=" : "≈";
      const steps = [
        rich(relation(fn, V)),
        rich(`${fn} ${g} = ${inp(vn)} cm : ${inp(vd)} cm ${eq} ${short4(rr)}`),
        rich(`${g} = ${fn}⁻¹(${short4(rr)}) ≈ ${fx(ex, 1)}°`),
      ];
      return {
        q: rich(`Im rechtwinkligen Dreieck ABC ist C der rechte Winkel. Gegeben sind ${givenSides.map(x => `${x} = ${inp(val[x])} cm`).join(" und ")}. Berechne ${g}.`),
        a: rich(`${g} ≈ ${fx(ex, 1)}°`),
        steps, fig, aFig, inline: false,
        check: { want: fx(ex, 1), value: ex, dec: 1 },
      };
    }
    throw new Error("m10-winkel-berechnen: keine Zahlen gefunden");
  }

  AG.registerType({
    id: "m10-winkel-berechnen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Winkel mit Sinus, Kosinus und Tangens berechnen",
    instruction: {
      1: "Berechne den markierten Winkel. Runde auf eine Nachkommastelle.",
      2: "Berechne den markierten Winkel mit dem Taschenrechner. Runde auf eine Nachkommastelle.",
      3: "Berechne den markierten Winkel mit dem Taschenrechner. Runde auf eine Nachkommastelle.",
    },
    merke: [
      "Den Winkel findet man mit der Umkehrfunktion: Ist tan α = 0,75, so ist ", { b: "α = tan⁻¹(0,75) ≈ 36,9°" },
      ". Beispiel: Gegenkathete 3 cm, Ankathete 4 cm → tan α = 3 : 4 = 0,75 → α ≈ 36,9°.",
    ],
    cols: 2,
    levels: [1, 2, 3],
    generate: (rng, level) => retry(() => gen2(rng, level)),
    verify: verifyValue,
  });

  // ---------- Typ 3: Sachaufgaben ----------
  // Leiter: sin/cos mit Winkel 65°–75°
  function leiter(rng) {
    const l = rng.int(4, 9), phi = rng.int(65, 75), askH = rng.chance(0.5);
    const fn = askH ? "sin" : "cos";
    const ex = l * TRIG[fn](phi), tr4 = r4(TRIG[fn](phi));
    if (!agree(ex, l * tr4, 2)) return null;
    const u = askH ? "h" : "d";
    const lab = { ang: `φ = ${phi}°`, hyp: `l = ${l} m`, side: askH ? "h = ?" : null, bottom: askH ? null : "d = ?" };
    const aLab = { ...lab, [askH ? "side" : "bottom"]: `${u} = ${fx(ex, 2)} m` };
    return {
      q: rich(`Eine ${l} m lange Leiter lehnt an einer senkrechten Hauswand. Sie bildet mit dem Boden den Winkel φ = ${phi}°. ${askH ? "Wie hoch reicht die Leiter an der Wand?" : "Wie weit steht der Fuß der Leiter von der Wand entfernt?"}`),
      a: rich(`${u} ≈ ${fx(ex, 2)} m`),
      steps: [
        rich(`${fn} φ = ${askH ? "Gegenkathete" : "Ankathete"} : Hypotenuse = ${u} : l`),
        rich(`${u} = l · ${fn} φ = ${l} m · ${fn} ${phi}°`),
        rich(`${u} ≈ ${l} m · ${short4(tr4)} ≈ ${fx(ex, 2)} m`),
      ],
      fig: rtFig(TRIG.tan(phi), lab), aFig: rtFig(TRIG.tan(phi), aLab), inline: false,
      check: { want: fx(ex, 2), value: ex, dec: 2 },
    };
  }

  // Drachen: Höhe aus Schnurlänge und Winkel zum Boden
  function drachen(rng) {
    const l = 10 * rng.int(4, 12), be = rng.int(30, 60);
    const ex = l * TRIG.sin(be), tr4 = r4(TRIG.sin(be));
    if (!agree(ex, l * tr4, 2)) return null;
    const lab = { ang: `β = ${be}°`, hyp: `l = ${l} m`, side: "h = ?" };
    return {
      q: rich(`Eine Drachenschnur ist ${l} m lang und gerade gespannt. Sie wird am Boden gehalten und bildet mit dem waagerechten Boden den Winkel β = ${be}°. Wie hoch fliegt der Drachen über dem Boden?`),
      a: rich(`h ≈ ${fx(ex, 2)} m`),
      steps: [
        rich("sin β = Gegenkathete : Hypotenuse = h : l"),
        rich(`h = l · sin β = ${l} m · sin ${be}°`),
        rich(`h ≈ ${l} m · ${short4(tr4)} ≈ ${fx(ex, 2)} m`),
      ],
      fig: rtFig(TRIG.tan(be), lab), aFig: rtFig(TRIG.tan(be), { ...lab, side: `h = ${fx(ex, 2)} m` }), inline: false,
      check: { want: fx(ex, 2), value: ex, dec: 2 },
    };
  }

  // Turm: Höhe aus Entfernung und Höhenwinkel (vom Boden aus gemessen)
  function turm(rng) {
    const e = 5 * rng.int(4, 18), be = rng.int(25, 60);
    const ex = e * TRIG.tan(be), tr4 = r4(TRIG.tan(be));
    if (!agree(ex, e * tr4, 2)) return null;
    const lab = { ang: `β = ${be}°`, bottom: `e = ${e} m`, side: "h = ?" };
    return {
      q: rich(`Ein Beobachter steht ${e} m vom Fuß eines Turms entfernt auf dem Boden. Er sieht die Turmspitze unter dem Höhenwinkel β = ${be}°. Der Höhenwinkel wird vom Boden aus gemessen. Wie hoch ist der Turm?`),
      a: rich(`h ≈ ${fx(ex, 2)} m`),
      steps: [
        rich("tan β = Gegenkathete : Ankathete = h : e"),
        rich(`h = e · tan β = ${e} m · tan ${be}°`),
        rich(`h ≈ ${e} m · ${short4(tr4)} ≈ ${fx(ex, 2)} m`),
      ],
      fig: rtFig(TRIG.tan(be), lab), aFig: rtFig(TRIG.tan(be), { ...lab, side: `h = ${fx(ex, 2)} m` }), inline: false,
      check: { want: fx(ex, 2), value: ex, dec: 2 },
    };
  }

  // Straße: Steigungswinkel aus der Steigung in Prozent
  function steigung(rng) {
    const p = rng.int(4, 15), ratio = p / 100;
    const ex = INV.tan(ratio), ch = INV.tan(r4(ratio));
    if (!agree(ex, ch, 1)) return null;
    const lab = { bottom: "100 m", side: `${p} m`, ang: "α = ?" };
    return {
      q: rich(`Eine Straße hat eine Steigung von ${p} %. Das bedeutet: Auf 100 m waagerechter Strecke steigt die Straße um ${p} m. Berechne den Steigungswinkel α der Straße.`),
      a: rich(`α ≈ ${fx(ex, 1)}°`),
      steps: [
        rich(`tan α = Höhenunterschied : waagerechte Strecke = ${p} m : 100 m`),
        rich(`tan α = ${p} : 100 = ${short4(ratio)}`),
        rich(`α = tan⁻¹(${short4(ratio)}) ≈ ${fx(ex, 1)}°`),
      ],
      fig: rtFig(ratio, lab), aFig: rtFig(ratio, { ...lab, ang: `α = ${fx(ex, 1)}°` }), inline: false,
      check: { want: fx(ex, 1), value: ex, dec: 1 },
    };
  }

  // Rampe: Höhe aus Länge und kleinem Steigungswinkel; Rollstuhlrampe höchstens 6 %
  function rampe(rng) {
    const l = rng.int(8, 15), al = rng.pick([2, 3, 4, 5]);   // 4° und 5° sind zu steil (über 6 %)
    const ex = l * TRIG.sin(al), tr4 = r4(TRIG.sin(al));
    if (!agree(ex, l * tr4, 2)) return null;
    const tp = TRIG.tan(al);
    const lab = { ang: `α = ${al}°`, hyp: `l = ${l} m`, side: "h = ?" };
    return {
      q: rich(`Eine Rampe ist ${l} m lang und liegt im Winkel α = ${al}° zum Boden. Wie hoch führt die Rampe? Prüfe außerdem, ob sie für Rollstühle zulässig ist. Die Steigung darf dort höchstens 6 % betragen.`),
      a: rich(`h ≈ ${fx(ex, 2)} m; die Rampe ist ${tp <= 0.06 ? "" : "nicht "}zulässig.`),
      steps: [
        rich("sin α = Gegenkathete : Hypotenuse = h : l"),
        rich(`h = l · sin α = ${l} m · sin ${al}°`),
        rich(`h ≈ ${l} m · ${short4(tr4)} ≈ ${fx(ex, 2)} m`),
        rich(`Steigung: tan α ≈ ${short4(tp)} ≈ ${fx(tp * 100, 1)} %. ${tp <= 0.06 ? "Das ist höchstens 6 %, die Rampe ist zulässig." : "Das ist mehr als 6 %, die Rampe ist nicht zulässig."}`),
      ],
      fig: rtFig(tp, lab), aFig: rtFig(tp, { ...lab, side: `h = ${fx(ex, 2)} m` }), inline: false,
      check: { want: fx(ex, 2), value: ex, dec: 2 },
    };
  }

  // Drachen: Winkel aus Höhe und Schnurlänge
  function drachenWinkel(rng) {
    const l = 10 * rng.int(5, 12), h = rng.int(Math.round(l * 0.3), Math.round(l * 0.9));
    const ratio = h / l, rr = r4(ratio);
    const ex = INV.sin(ratio), ch = INV.sin(rr);
    if (ex < 25 || ex > 65 || !agree(ex, ch, 1)) return null;
    const eq = Math.abs(ratio - rr) < 1e-9 ? "=" : "≈";
    const lab = { ang: "β = ?", hyp: `l = ${l} m`, side: `h = ${h} m` };
    return {
      q: rich(`Ein Drachen fliegt ${h} m über dem Boden. Die ${l} m lange Schnur ist gerade gespannt und wird am Boden gehalten. Unter welchem Winkel β zum Boden ist die Schnur gespannt?`),
      a: rich(`β ≈ ${fx(ex, 1)}°`),
      steps: [
        rich("sin β = Gegenkathete : Hypotenuse = h : l"),
        rich(`sin β = ${h} m : ${l} m ${eq} ${short4(rr)}`),
        rich(`β = sin⁻¹(${short4(rr)}) ≈ ${fx(ex, 1)}°`),
      ],
      fig: rtFig(TRIG.tan(ex), lab), aFig: rtFig(TRIG.tan(ex), { ...lab, ang: `β = ${fx(ex, 1)}°` }), inline: false,
      check: { want: fx(ex, 1), value: ex, dec: 1 },
    };
  }

  const CONTEXTS = { 1: [leiter, drachen], 2: [turm, steigung], 3: [rampe, drachenWinkel] };
  function gen3(rng, level) {
    for (let i = 0; i < 300; i++) {
      const t = rng.pick(CONTEXTS[level])(rng);
      if (t) return t;
    }
    throw new Error("m10-trigo-sachaufgabe: keine Zahlen gefunden");
  }

  AG.registerType({
    id: "m10-trigo-sachaufgabe",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Trigonometrie in Sachaufgaben",
    instruction: {
      1: "Berechne die gesuchte Größe mit dem Taschenrechner. Runde Längen auf zwei Nachkommastellen.",
      2: "Berechne mit dem Taschenrechner. Runde Längen auf zwei, Winkel auf eine Nachkommastelle.",
      3: "Berechne. Die Skizze ist nicht maßstabsgetreu. Runde Längen auf zwei, Winkel auf eine Nachkommastelle.",
    },
    merke: [
      "Eine Steigung von 10 % bedeutet: Auf 100 m waagerecht steigt die Straße um 10 m, also ",
      { b: "tan α = 10 : 100 = 0,1" }, " und α = tan⁻¹(0,1) ≈ 5,7°. Bei Leiter und Drachen ist die Länge die Hypotenuse, z. B. h = l · sin φ.",
    ],
    cols: 1,
    levels: [1, 2, 3],
    generate: (rng, level) => retry(() => gen3(rng, level)),
    verify: verifyValue,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
