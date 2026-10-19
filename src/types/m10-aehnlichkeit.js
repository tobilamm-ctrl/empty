// M10 LB 3: Ähnlichkeit und Satzgruppe des Pythagoras – mit Skizzen (Zentrum Z, Strahlen, Höhe; gesuchte Größe „?“).
// Typen: m10-zentrische-streckung, m10-strahlensatz, m10-kathetensatz-hoehensatz (alle Klasse 10, nur M-Zug).
(function (AG) {
  const { Frac, num, rich, fmtDec, plain } = AG;
  const LB3 = "Ähnlichkeit und Satzgruppe des Pythagoras";
  const SUP2 = { sup: "2" };
  const PAD = 9;
  const W1 = 100, H1 = 55;  // Skizzenfeld (mm); alle drei Typen haben cols 1

  // ---------- Hilfsfunktionen ----------
  const F = x => new Frac(x);
  const D = x => fmtDec(x);                  // Zahl mit Dezimalkomma (endlich)
  const D2 = x => fmtDec(x, 2);              // zwei feste Nachkommastellen
  const dn = x => num(x, { as: "dec" });     // Zahl als Rich mit Dezimalkomma
  const cm = x => D(x) + " cm";
  const cm2 = x => D(x) + " cm²";
  const mD2 = x => D2(x) + " m";
  const approx6 = v => (Math.floor(v * 1e5) / 1e5).toFixed(5).replace(".", ",") + "…"; // Taschenrechneranzeige
  const round2 = v => new Frac(Math.round(v * 100), 100);
  const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const centroid = V => [V.reduce((t, p) => t + p[0], 0) / V.length, V.reduce((t, p) => t + p[1], 0) / V.length];
  const KF = [new Frac(1, 2), new Frac(3, 2), F(2), new Frac(5, 2), F(3)];   // Streckfaktoren k
  const FS = [new Frac(3, 2), F(2), new Frac(5, 2), F(3)];                   // Faktoren für Strahlen (vergrößert)
  const XF = [new Frac(1, 2), new Frac(3, 2), F(2), new Frac(5, 2), F(3)];   // Faktoren für die X-Figur
  const GAMS = [Math.PI / 3, (5 * Math.PI) / 12, Math.PI / 2];               // Winkel zwischen zwei Strahlen
  const PHIS = [Math.PI / 4, Math.PI / 3, (5 * Math.PI) / 12, Math.PI / 2];   // Winkel von h (spitz, B oben rechts)

  // Quadratwurzel eines Bruchs, falls rational
  function fracSqrt(f) {
    const n = Math.round(Math.sqrt(f.n)), d = Math.round(Math.sqrt(f.d));
    return n * n === f.n && d * d === f.d ? new Frac(n, d) : null;
  }

  // Schritt „tgt = √M“: exakt, sonst auf zwei Stellen gerundet (≈)
  function rootStep(tgt, M, mRich, unitTxt) {
    const r = fracSqrt(M), tv = Math.sqrt(M.valueOf());
    const exact = !!r, rr = exact ? r : round2(tv);
    const u = unitTxt ? " " + unitTxt : "";
    const shown = exact ? D(rr) : D2(rr);
    const step = exact
      ? rich(tgt, " = √", mRich, " = ", shown, u)
      : rich(tgt, " = √", mRich, " = ", approx6(tv), " ≈ ", shown, u);
    return { exact, tv, want: shown, step, ans: rich(tgt, exact ? " = " : " ≈ ", shown, u) };
  }

  // Beschriftung der Eckpunkte außen (vom Zentrum c weg)
  function vertexNames(s, V, c, letters) {
    V.forEach((v, i) => {
      const u = nrm([v[0] - c[0], v[1] - c[1]]);
      const anchor = u[0] > 0.35 ? "start" : u[0] < -0.35 ? "end" : "middle";
      s.label([v[0] + u[0] * 4.6, v[1] + u[1] * 4.6], letters[i], { anchor });
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
      if ([t.fig, t.aFig].every(f => !f || (labelsClean(f) && !f.cross))) return t;
    }
    throw new Error("Skizze: keine saubere Beschriftung gefunden");
  }

  // Prüfung: Ergebnis enthält den erwarteten Wert, und der Wert stimmt mit der Rechnung überein
  function verifyWant(t) {
    const cs = t.check;
    if (!cs || !cs.length) return "kein Prüfdatensatz";
    const s = plain(t.a);
    for (const k of cs) {
      if (!s.includes(k.want)) return `Ergebnis „${k.want}“ fehlt in „${s}“`;
      const w = parseFloat(k.want.replace(",", "."));
      if (!(Math.abs(k.v - w) <= k.tol)) return `Wert ${k.want} weicht von ${k.v} ab`;
    }
    return true;
  }

  // Längenlabel in der Skizze: nur der Wert („3 cm“), gesucht „?“; die Strecke ist über ihre Punktnamen benannt
  const short = t => (t === undefined ? t : /\?$/.test(t) ? "?" : t.replace(/^[^=]*= /, ""));

  // Textbox einer Beschriftung (Schätzung wie in labelsClean)
  function boxOf(p, t, anchor) {
    const fs = 3.4, w = t.length * fs * 0.55, by = p[1] + fs * 0.35;
    const x0 = anchor === "start" ? p[0] : anchor === "end" ? p[0] - w : p[0] - w / 2;
    return [x0 - 0.4, by - fs * 0.8 - 0.4, x0 + w + 0.4, by + fs * 0.25 + 0.4];
  }
  const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  // Punktname am Punkt V: bevorzugt vom Schwerpunkt center weg, sonst eine Richtung ohne Kontakt zu Linien und Texten
  function placeName(c, V, center, text) {
    const base = Math.atan2(V[1] - center[1], V[0] - center[0]);
    for (const o of [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1, Math.PI]) {
      const a = base + o, u = [Math.cos(a), Math.sin(a)];
      const anchor = u[0] > 0.35 ? "start" : u[0] < -0.35 ? "end" : "middle";
      const p = [V[0] + u[0] * 4.6, V[1] + u[1] * 4.6];
      if (c.free(boxOf(p, text, anchor))) { c.text(p, text, { anchor }); return; }
    }
    c.text([V[0] + Math.cos(base) * 4.6, V[1] + Math.sin(base) * 4.6], text, { anchor: "middle" });
  }

  // Flächenlabel: Schwerpunkt bzw. freier Punkt im Dreieck, sonst außen an einer Kante
  function areaLabel(c, T, text) {
    const G = centroid(T), cands = [];
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) {
      if (i + j >= 7) continue;
      const u = i / 7, v = j / 7, w = 1 - u - v;
      cands.push([u * T[0][0] + v * T[1][0] + w * T[2][0], u * T[0][1] + v * T[1][1] + w * T[2][1]]);
    }
    cands.sort((p1, p2) => Math.hypot(p1[0] - G[0], p1[1] - G[1]) - Math.hypot(p2[0] - G[0], p2[1] - G[1]));
    for (const p of cands) {
      const bx = boxOf(p, text, "middle");
      const corners = [[bx[0], bx[1]], [bx[2], bx[1]], [bx[2], bx[3]], [bx[0], bx[3]]];
      if (corners.every(q => inTri(q, T)) && c.free(bx)) { c.text(p, text, { anchor: "middle" }); return; }
    }
    for (let e = 0; e < 3; e++) {
      const A = T[e], B = T[(e + 1) % 3], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], C = T[(e + 2) % 3];
      const n0 = nrm([-(B[1] - A[1]), B[0] - A[0]]);
      const n = (n0[0] * (C[0] - M[0]) + n0[1] * (C[1] - M[1])) > 0 ? [-n0[0], -n0[1]] : n0;
      for (const d of [5, 8, 11]) {
        const p = [M[0] + n[0] * d, M[1] + n[1] * d];
        if (c.free(boxOf(p, text, "middle"))) { c.text(p, text, { anchor: "middle" }); return; }
      }
    }
    c.text(G, text, { anchor: "middle" });
  }
  function inTri(p, T) {
    const sg = (a, b, q) => (a[0] - q[0]) * (b[1] - q[1]) - (b[0] - q[0]) * (a[1] - q[1]);
    const d1 = sg(T[0], T[1], p), d2 = sg(T[1], T[2], p), d3 = sg(T[2], T[0], p);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  // Längenlabel an einer Strecke P–Q: Mitte oder leicht verschoben, Seite bevorzugt weg von pref; nie auf einer Linie
  function segLabel(c, P, Q, text, pref) {
    const d = [Q[0] - P[0], Q[1] - P[1]], L = Math.hypot(d[0], d[1]) || 1;
    const n = [-d[1] / L, d[0] / L];
    const away = (n[0] * (pref[0] - P[0]) + n[1] * (pref[1] - P[1])) > 0 ? -1 : 1;
    for (const t of [0.5, 0.4, 0.6]) for (const sg of [away, -away]) for (const dist of [4.4, 5.6]) {
      const p = [P[0] + d[0] * t + n[0] * sg * dist, P[1] + d[1] * t + n[1] * sg * dist];
      if (c.free(boxOf(p, text, "middle"))) { c.text(p, text, { anchor: "middle" }); return; }
    }
    c.text([P[0] + d[0] / 2 + n[0] * away * 4.4, P[1] + d[1] / 2 + n[1] * away * 4.4], text, { anchor: "middle" });
  }

  // Zeichenfläche: merkt Linien und Beschriftungen; fig.cross ist true, wenn eine Beschriftung eine Linie schneidet
  function segCross(p, q, r, t) {
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    return cr(r, t, p) * cr(r, t, q) < 0 && cr(p, q, r) * cr(p, q, t) < 0;
  }
  function segHitsBox(a, b, bx) {
    const inB = p => p[0] >= bx[0] && p[0] <= bx[2] && p[1] >= bx[1] && p[1] <= bx[3];
    if (inB(a) || inB(b)) return true;
    const c = [[bx[0], bx[1]], [bx[2], bx[1]], [bx[2], bx[3]], [bx[0], bx[3]]];
    for (let i = 0; i < 4; i++) if (segCross(a, b, c[i], c[(i + 1) % 4])) return true;
    return false;
  }
  function crosses(fig, segs) {
    const re = /<text x="([-\d.]+)" y="([-\d.]+)" font-family="[^"]*" font-size="([\d.]+)" text-anchor="(\w+)"[^>]*>([^<]*)<\/text>/g;
    let m;
    while ((m = re.exec(fig.svg))) {
      const x = +m[1], y = +m[2], fs = +m[3], an = m[4];
      const w = m[5].length * fs * 0.55;
      const x0 = an === "start" ? x : an === "end" ? x - w : x - w / 2;
      const bx = [x0 - 0.4, y - fs * 0.8 - 0.4, x0 + w + 0.4, y + fs * 0.25 + 0.4];
      if (segs.some(([a, b]) => segHitsBox(a, b, bx))) return true;
    }
    return false;
  }
  function canvas(W, H) {
    const s = AG.sketch(W, H), segs = [], boxes = [];
    return {
      s, segs,
      line(a, b, o) { if (!(o && o.dash)) segs.push([a, b]); s.line(a, b, o); },   // gestrichelte Hilfslinien zählen nicht
      poly(P, o) { P.forEach((p, i) => segs.push([p, P[(i + 1) % P.length]])); s.poly(P, o); },
      free(bx) { return !segs.some(([q1, q2]) => segHitsBox(q1, q2, bx)) && !boxes.some(q => overlap(q, bx)); },
      text(p, t, o) { const anchor = (o && o.anchor) || "middle"; boxes.push(boxOf(p, t, anchor)); s.label(p, t, { ...o, anchor }); },
      done() { const fig = s.done(); fig.cross = crosses(fig, segs); return fig; },
    };
  }

  // ---------- Typ 1: Zentrische Streckung ----------
  // Originaldreieck ABC (AB waagerecht, C darüber), Zentrum Z im Ursprung, Bilddreieck A′B′C′ = k · (Originalpunkte)
  function triGeo(rng, s, ch) {
    const ax = rng.int(2, 3), ay = rng.int(2, 3), cx = rng.int(0, s);
    return { A: [ax, ay], B: [ax + s, ay], C: [ax + cx, ay + ch] };
  }

  const PAIRS = [[0, 1, 2], [1, 2, 0], [0, 2, 1]];   // gegebene Seite (Ecken i, j), gegenüberliegende Ecke l
  const NAMES_O = ["AB", "BC", "AC"], NAMES_I = ["A′B′", "B′C′", "A′C′"];

  function streckFig(geo, k, lo, li, zl, j) {
    const kk = Number(k);
    const O = [geo.A, geo.B, geo.C], I = O.map(p => [p[0] * kk, p[1] * kk]);
    const f = AG.fitPoints([[0, 0], ...O, ...I], W1, H1, PAD);
    const P = O.map(p => f(p)), Q = I.map(p => f(p)), z = f([0, 0]);
    const c = canvas(W1, H1), s = c.s;
    c.poly(P);                                  // Originaldreieck, leicht gefüllt
    c.poly(Q, { fill: false });                 // Bilddreieck nur Umriss
    Q.forEach(q => c.line(z, q, { dash: true })); // Strahlen von Z durch die Ecken
    P.forEach((v, i) => placeName(c, v, centroid(P), ["A", "B", "C"][i]));
    Q.forEach((v, i) => placeName(c, v, centroid(Q), ["A′", "B′", "C′"][i]));
    c.text([z[0] - 3, z[1]], "Z", { anchor: "end" });
    const [i1, i2, i3] = PAIRS[j];
    if (lo.seg) segLabel(c, P[i1], P[i2], short(lo.seg), P[i3]);
    if (li.seg) segLabel(c, Q[i1], Q[i2], short(li.seg), Q[i3]);
    if (lo.A) areaLabel(c, P, lo.A);
    if (li.A) areaLabel(c, Q, li.A);
    if (zl) c.text([z[0] + 4, z[1] + 7], zl, { anchor: "start" });
    return c.done();
  }

  // Stufe 1: Bildstrecke bei gegebenem k; Stufe 2: Streckfaktor aus Original- und Bildstrecke
  function gen1Strecke(rng, level) {
    const s = rng.int(2, 9), ch = rng.int(2, 5);
    const geo = triGeo(rng, s, ch);
    const k = rng.pick(KF), j = rng.int(0, 2);
    const res = k.mul(F(s)), on = NAMES_O[j], inn = NAMES_I[j];
    if (level === 1) {
      return {
        q: rich("Das Dreieck A′B′C′ ist das Bild des Dreiecks ABC bei einer zentrischen Streckung mit dem Zentrum Z und dem Streckfaktor k = ", dn(k), ". Die Strecke ", on, " ist ", cm(s), " lang. Berechne die Bildstrecke ", inn, "."),
        a: rich(inn, " = ", cm(res)),
        steps: [rich(inn, " = k · ", on), rich(inn, " = ", dn(k), " · ", cm(s), " = ", cm(res))],
        fig: streckFig(geo, k, { seg: on + " = " + cm(s) }, { seg: inn + " = ?" }, null, j),
        aFig: streckFig(geo, k, { seg: on + " = " + cm(s) }, { seg: inn + " = " + cm(res) }, null, j),
        inline: false,
        check: [{ want: D(res), v: res.valueOf(), tol: 1e-9 }],
      };
    }
    const big = k.cmp(F(1)) > 0 ? "Vergrößerung" : "Verkleinerung";
    return {
      q: rich("Die Strecke ", on, " = ", cm(s), " wird bei einer zentrischen Streckung mit dem Zentrum Z auf ", inn, " = ", cm(res), " abgebildet. Berechne den Streckfaktor k. Ist es eine Vergrößerung oder eine Verkleinerung?"),
      a: rich("k = ", dn(k), " (", big, ")"),
      steps: [rich("k = ", inn, " : ", on), rich("k = ", cm(res), " : ", cm(s), " = ", dn(k))],
      fig: streckFig(geo, k, { seg: on + " = " + cm(s) }, { seg: inn + " = " + cm(res) }, "k = ?", j),
      aFig: streckFig(geo, k, { seg: on + " = " + cm(s) }, { seg: inn + " = " + cm(res) }, null, j),
      inline: false,
      check: [{ want: D(k), v: k.valueOf(), tol: 1e-9 }],
    };
  }

  // Stufe 3: Flächeninhalt wächst mit k² (Fläche gegeben, k gegeben oder k gesucht)
  function gen1Flaeche(rng) {
    let s, ch;
    for (let i = 0; ; i++) {
      if (i > 200) throw new Error("m10-zentrische-streckung: keine Maße gefunden");
      s = rng.int(2, 8); ch = rng.int(2, 8);
      if ((s * ch) % 2 === 0) break;                 // Fläche s · ch : 2 ganzzahlig
    }
    const geo = triGeo(rng, s, ch), A = F(s * ch / 2);
    const k = rng.pick(KF), k2 = k.mul(k), A2 = k2.mul(A);
    if (rng.chance(0.5)) {
      return {
        q: rich("Das Dreieck ABC hat den Flächeninhalt A = ", cm2(A), ". Es wird mit dem Zentrum Z und dem Streckfaktor k = ", dn(k), " zentrisch gestreckt. Berechne den Flächeninhalt des Bilddreiecks A′B′C′."),
        a: rich("A′ = ", cm2(A2)),
        steps: [rich("A′ = k² · A"), rich("k² = ", dn(k), " · ", dn(k), " = ", dn(k2)), rich("A′ = ", dn(k2), " · ", cm2(A), " = ", cm2(A2))],
        fig: streckFig(geo, k, { A: cm2(A) }, { A: "? cm²" }, null, 0),
        aFig: streckFig(geo, k, { A: cm2(A) }, { A: cm2(A2) }, null, 0),
        inline: false,
        check: [{ want: D(A2), v: A2.valueOf(), tol: 1e-9 }],
      };
    }
    const rs = rootStep("k", k2, rich(dn(k2)), "");
    return {
      q: rich("Das Dreieck ABC hat den Flächeninhalt ", cm2(A), ". Das Bilddreieck A′B′C′ hat den Flächeninhalt ", cm2(A2), ". Berechne den Streckfaktor k."),
      a: rs.ans,
      steps: [rich("A′ = k² · A, also k² = A′ : A"), rich("k² = ", cm2(A2), " : ", cm2(A), " = ", dn(k2)), rs.step],
      fig: streckFig(geo, k, { A: cm2(A) }, { A: cm2(A2) }, "k = ?", 0),
      aFig: streckFig(geo, k, { A: cm2(A) }, { A: cm2(A2) }, null, 0),
      inline: false,
      check: [{ want: rs.want, v: rs.tv, tol: 1e-9 }],
    };
  }

  function gen1(rng, level) {
    return level === 3 ? gen1Flaeche(rng) : gen1Strecke(rng, level);
  }

  AG.registerType({
    id: "m10-zentrische-streckung",
    klasse: "10",
    zug: "M",
    lb: "3",
    lbTitle: LB3,
    topic: "winkel",
    title: "Zentrische Streckung",
    instruction: {
      1: "Berechne die Bildstrecke. Der Streckfaktor k ist gegeben.",
      2: "Berechne den Streckfaktor k. Gib an, ob vergrößert oder verkleinert wird.",
      3: "Berechne den Flächeninhalt des Bilddreiecks bzw. den Streckfaktor k.",
    },
    merke: [
      "Zentrische Streckung mit dem Streckfaktor k: Bildstrecke = k · Originalstrecke, also ", { b: "k = A′B′ : AB" },
      ". Flächen wachsen mit k²: ", { b: "A′ = k² · A" },
      ". Beispiel: AB = 4 cm, A′B′ = 10 cm → k = 2,5; A = 12 cm² → A′ = 6,25 · 12 cm² = 75 cm².",
    ],
    cols: 1,
    generate: (rng, level) => retry(() => gen1(rng, level)),
    verify: verifyWant,
  });

  // ---------- Typ 2: Strahlensätze ----------
  // Strahl 1 längs der x-Achse (A, A′), Strahl 2 unter dem Winkel gam (B, B′); AB ∥ A′B′
  function vGeo(a1, a2, b1, gam) {
    const r = a2 / a1, c = Math.cos(gam), s = Math.sin(gam);
    return { S: [0, 0], A: [a1, 0], A2: [a2, 0], B: [b1 * c, b1 * s], B2: [b1 * r * c, b1 * r * s] };
  }

  // V-Figur: Scheitel S, unterer Strahl (A, A′), oberer Strahl (B, B′); Parallelen AB und A′B′ durchgezogen
  function vFig(g, ls) {
    const P = [g.S, g.A, g.A2, g.B, g.B2];
    const f = AG.fitPoints(P, W1, H1 - 12, PAD);   // unten 12 mm frei für Maßlinie und Beschriftung
    const [S, A, A2, B, B2] = P.map(p => f(p));
    const c = canvas(W1, H1), s = c.s;
    c.poly([A, B, B2, A2]);                     // Trapez mit den Parallelen AB und A′B′
    c.line(S, A2); c.line(S, B2);               // Strahlen
    const y = S[1] + 9;                         // Maßlinie für SA′ unter dem unteren Strahl
    c.line([S[0], y], [A2[0], y]);
    c.line([S[0], y - 2], [S[0], y + 2]);
    c.line([A2[0], y - 2], [A2[0], y + 2]);
    if (ls.SA) c.text([(S[0] + A[0]) / 2, S[1] + 4.5], short(ls.SA), { anchor: "middle" });
    if (ls.SA2) c.text([(S[0] + A2[0]) / 2, y + 5.5], short(ls.SA2), { anchor: "middle" });
    c.text([S[0] - 3, S[1] + 5], "S", { anchor: "end" });
    c.text([A[0] + 2, S[1] + 5], "A", { anchor: "start" });
    c.text([A2[0] + 2, S[1] + 5], "A′", { anchor: "start" });
    placeName(c, B, centroid([A, B, B2, A2]), "B");
    placeName(c, B2, centroid([A, B, B2, A2]), "B′");
    if (ls.SB) segLabel(c, S, B, short(ls.SB), A);
    if (ls.SB2) segLabel(c, S, B2, short(ls.SB2), A);
    if (ls.AB) segLabel(c, A, B, short(ls.AB), S);
    if (ls.A2B2) segLabel(c, A2, B2, short(ls.A2B2), S);
    return c.done();
  }

  // X-Figur: Geraden g und h schneiden sich in S; A und A′ auf g, B und B′ auf h, AB ∥ A′B′ durchgezogen
  function xFig(g, ls) {
    const P = [g.S, g.A, g.A2, g.B, g.B2];
    const f = AG.fitPoints(P, W1, H1, PAD);
    const [S, A, A2, B, B2] = P.map(p => f(p));
    const c = canvas(W1, H1), s = c.s;
    c.line(A2, A); c.line(B2, B);               // Geraden g und h durch S
    c.line(A, B); c.line(A2, B2);               // parallele Strecken
    if (ls.SA) segLabel(c, S, A, short(ls.SA), B);
    if (ls.SA2) segLabel(c, S, A2, short(ls.SA2), [A2[0], A2[1] + 12]);
    if (ls.SB) segLabel(c, S, B, short(ls.SB), A);
    if (ls.SB2) segLabel(c, S, B2, short(ls.SB2), A);
    if (ls.AB) segLabel(c, A, B, short(ls.AB), S);
    if (ls.A2B2) segLabel(c, A2, B2, short(ls.A2B2), S);
    placeName(c, B, S, "B");
    placeName(c, B2, S, "B′");
    placeName(c, A, S, "A");
    placeName(c, A2, S, "A′");
    c.text([S[0] - 3, S[1] + 5], "S", { anchor: "end" });
    return c.done();
  }

  // Peilstab: Auge S (Augenhöhe 1,60 m), Peilstab 2,00 m hoch im Abstand a, Baum im Abstand T; Visierlinie über die Stabspitze
  function peilFig(a, T, Hn, tLab) {
    const eye = 1.6, top = 2.0;
    const P = [[0, 0], [T + 1, 0], [0, eye], [a, top], [T, Hn]];
    const f = AG.fitPoints(P, W1, H1, PAD);
    const s = AG.sketch(W1, H1);
    const G0 = f([0, 0]), G1 = f([T + 1, 0]), E = f([0, eye]), F1 = f([a, 0]), T1 = f([a, top]);
    const P1 = f([a, eye]), P2 = f([T, eye]), F2 = f([T, 0]), T2 = f([T, Hn]);
    s.line(G0, G1, { width: 0.5 });          // Boden
    s.line(F1, T1, { width: 0.7 });          // Peilstab
    s.line(F2, T2, { width: 0.7 });          // Baum
    s.line(E, P2, { dash: true });           // Augenhöhe
    s.line(E, T2, { dash: true });           // Visierlinie
    s.label([E[0] - 3, E[1] - 3], "S", { anchor: "end" });
    s.label([T1[0] - 2, T1[1] - 3], "2,00 m", { anchor: "end" });
    s.label([E[0] + 2, E[1] - 5], "1,60 m", { anchor: "start" });   // Augenhöhe
    s.label([T2[0] - 3, T2[1] - 2], tLab, { anchor: "end" });
    s.label([(E[0] + P1[0]) / 2, (E[1] + P1[1]) / 2 + 4], D(a) + " m", { anchor: "middle" });
    s.label([(E[0] + P2[0]) / 2, (E[1] + P2[1]) / 2 + 4], D(T) + " m", { anchor: "middle" });
    return s.done();
  }

  // 1. Strahlensatz: SB′ gesucht
  function s1Task(rng) {
    const a1 = rng.int(2, 5), f = rng.pick(FS), a2 = f.mul(F(a1)), b1 = rng.int(2, 6), b2 = f.mul(F(b1));
    const g = vGeo(a1, Number(a2), b1, rng.pick(GAMS));
    return {
      q: rich("Zwei Strahlen mit dem Scheitel S werden von zwei parallelen Geraden geschnitten. Gegeben sind SA = ", cm(a1), ", SA′ = ", cm(a2), " und SB = ", cm(b1), ". Berechne SB′."),
      a: rich("SB′ = ", cm(b2)),
      steps: [rich("1. Strahlensatz: SA : SA′ = SB : SB′"), rich("SB′ = SB · SA′ : SA"), rich("SB′ = ", cm(b1), " · ", cm(a2), " : ", cm(a1), " = ", cm(b2))],
      fig: vFig(g, { SA: "SA = " + cm(a1), SA2: "SA′ = " + cm(a2), SB: "SB = " + cm(b1), SB2: "SB′ = ?" }),
      aFig: vFig(g, { SA: "SA = " + cm(a1), SA2: "SA′ = " + cm(a2), SB: "SB = " + cm(b1), SB2: "SB′ = " + cm(b2) }),
      inline: false,
      check: [{ want: D(b2), v: b2.valueOf(), tol: 1e-9 }],
    };
  }

  // 2. Strahlensatz: A′B′ gesucht (Strecke AB gegeben)
  function s2Task(rng) {
    let a1, f, w, gam, b1;
    for (let i = 0; ; i++) {
      if (i > 300) throw new Error("m10-strahlensatz: keine Maße gefunden");
      a1 = rng.int(2, 6); f = rng.pick(FS); w = rng.int(2, 8); gam = rng.pick(GAMS);
      const disc = w * w - a1 * a1 * Math.sin(gam) ** 2;
      if (disc <= 0) continue;
      b1 = a1 * Math.cos(gam) + Math.sqrt(disc);   // so liegt B so, dass AB genau w lang ist
      if (b1 > 1) break;
    }
    const a2 = f.mul(F(a1)), res = f.mul(F(w));
    const g = vGeo(a1, Number(a2), b1, gam);
    return {
      q: rich("Zwei Strahlen mit dem Scheitel S werden von zwei parallelen Geraden geschnitten. Gegeben sind SA = ", cm(a1), ", SA′ = ", cm(a2), " und AB = ", cm(w), ". Berechne A′B′."),
      a: rich("A′B′ = ", cm(res)),
      steps: [rich("2. Strahlensatz: SA : SA′ = AB : A′B′"), rich("A′B′ = AB · SA′ : SA"), rich("A′B′ = ", cm(w), " · ", cm(a2), " : ", cm(a1), " = ", cm(res))],
      fig: vFig(g, { SA: "SA = " + cm(a1), SA2: "SA′ = " + cm(a2), AB: "AB = " + cm(w), A2B2: "A′B′ = ?" }),
      aFig: vFig(g, { SA: "SA = " + cm(a1), SA2: "SA′ = " + cm(a2), AB: "AB = " + cm(w), A2B2: "A′B′ = " + cm(res) }),
      inline: false,
      check: [{ want: D(res), v: res.valueOf(), tol: 1e-9 }],
    };
  }

  // Stufe 3, X-Figur: Scheitel S zwischen A und A′ bzw. B und B′; gesucht SB′ oder SA′ (Strahlensatz)
  function s3X(rng) {
    const a = rng.int(2, 5), f = rng.pick(XF), b = rng.int(2, 6), phi = rng.pick(PHIS);
    const a2 = f.mul(F(a)), b2 = f.mul(F(b)), c = Math.cos(phi), s = Math.sin(phi);
    const g = { S: [0, 0], A: [a, 0], A2: [-Number(a2), 0], B: [b * c, b * s], B2: [-Number(b2) * c, -Number(b2) * s] };
    const sa = { SA: "SA = " + cm(a), SB: "SB = " + cm(b) };
    if (rng.chance(0.5)) {
      // gesucht SB′
      return {
        q: rich("Die Geraden g und h schneiden sich in S. Die Punkte A und A′ liegen auf g, B und B′ auf h, jeweils auf verschiedenen Seiten von S. Es gilt AB ∥ A′B′. Gegeben sind SA = ", cm(a), ", SA′ = ", cm(a2), " und SB = ", cm(b), ". Berechne SB′."),
        a: rich("SB′ = ", cm(b2)),
        steps: [rich("1. Strahlensatz: SA : SA′ = SB : SB′"), rich("SB′ = SB · SA′ : SA"), rich("SB′ = ", cm(b), " · ", cm(a2), " : ", cm(a), " = ", cm(b2))],
        fig: xFig(g, { ...sa, SA2: "SA′ = " + cm(a2), SB2: "SB′ = ?" }),
        aFig: xFig(g, { ...sa, SA2: "SA′ = " + cm(a2), SB2: "SB′ = " + cm(b2) }),
        inline: false,
        check: [{ want: D(b2), v: b2.valueOf(), tol: 1e-9 }],
      };
    }
    // gesucht SA′
    return {
      q: rich("Die Geraden g und h schneiden sich in S. Die Punkte A und A′ liegen auf g, B und B′ auf h, jeweils auf verschiedenen Seiten von S. Es gilt AB ∥ A′B′. Gegeben sind SA = ", cm(a), ", SB = ", cm(b), " und SB′ = ", cm(b2), ". Berechne SA′."),
      a: rich("SA′ = ", cm(a2)),
      steps: [rich("1. Strahlensatz: SA : SA′ = SB : SB′, also SA′ = SA · SB′ : SB"), rich("SA′ = ", cm(a), " · ", cm(b2), " : ", cm(b), " = ", cm(a2))],
      fig: xFig(g, { ...sa, SA2: "SA′ = ?", SB2: "SB′ = " + cm(b2) }),
      aFig: xFig(g, { ...sa, SA2: "SA′ = " + cm(a2), SB2: "SB′ = " + cm(b2) }),
      inline: false,
      check: [{ want: D(a2), v: a2.valueOf(), tol: 1e-9 }],
    };
  }

  // Stufe 3, Sachaufgabe: Höhe eines Baums mit Peilstab (Augenhöhe 1,60 m, Peilstab 2,00 m)
  function s3Peil(rng) {
    const a = rng.pick([2, 4]);
    const T = rng.pick(a === 2 ? [10, 12, 14, 16, 18] : [12, 16, 20, 24]);
    const x = new Frac(2, 5).mul(F(T)).div(F(a));     // Teil des Baums über Augenhöhe: 0,40 m · T : a
    const H = new Frac(8, 5).add(x);                  // Baumhöhe: 1,60 m + x
    const fig = peilFig(a, T, H.valueOf(), "H = ?");
    const aFig = peilFig(a, T, H.valueOf(), "H = " + mD2(H));
    return {
      q: rich("Ein Schüler hat die Augenhöhe 1,60 m und steht ", D(a), " m vor einem 2,00 m hohen Peilstab. Der Baum steht ", D(T), " m vom Schüler entfernt. Der Schüler visiert über die Spitze des Peilstabs hinweg genau die Baumspitze an. Berechne die Höhe H des Baums."),
      a: rich("Der Baum ist ", mD2(H), " hoch."),
      steps: [
        rich("Über die Augenhöhe ragt der Peilstab 2,00 m − 1,60 m = 0,40 m hinaus."),
        rich("Strahlensatz: ", D(a), " m : ", D(T), " m = 0,40 m : x"),
        rich("x = 0,40 m · ", D(T), " m : ", D(a), " m = ", mD2(x)),
        rich("H = 1,60 m + ", mD2(x), " = ", mD2(H)),
      ],
      fig, aFig, inline: false,
      check: [{ want: D2(H), v: H.valueOf(), tol: 1e-9 }],
    };
  }

  function gen2(rng, level) {
    if (level === 1) return s1Task(rng);
    if (level === 2) return s2Task(rng);
    return rng.chance(0.5) ? s3X(rng) : s3Peil(rng);
  }

  AG.registerType({
    id: "m10-strahlensatz",
    klasse: "10",
    zug: "M",
    lb: "3",
    lbTitle: LB3,
    topic: "winkel",
    title: "Strahlensätze",
    instruction: {
      1: "Berechne die gesuchte Strecke mit dem 1. Strahlensatz.",
      2: "Berechne die gesuchte Strecke mit dem 2. Strahlensatz. Verwende die Strecken vom Scheitel S.",
      3: "Berechne die gesuchte Größe mit dem Strahlensatz.",
    },
    merke: [
      "1. Strahlensatz: ", { b: "SA : SA′ = SB : SB′" }, " (Abschnitte auf den Strahlen vom Scheitel S). ",
      "2. Strahlensatz: ", { b: "SA : SA′ = AB : A′B′" }, " (Scheitelabschnitt zu Parallelenabschnitt). ",
      "Achtung: Immer die Strecken vom Scheitel S verwenden, nicht A A′. Beispiel: SA = 2 cm, SA′ = 6 cm, AB = 3 cm → A′B′ = 9 cm.",
    ],
    cols: 1,
    generate: (rng, level) => retry(() => gen2(rng, level)),
    verify: verifyWant,
  });

  // ---------- Typ 3: Kathetensatz und Höhensatz ----------
  // Rechtwinkliges Dreieck ABC (rechter Winkel bei C), Hypotenuse c = AB. Die Höhe CH teilt c in q = AH (bei A) und p = HB (bei B).
  // Kathetensatz: a² = c · p, b² = c · q. Höhensatz: h² = p · q.
  function kFig(p, q, lab) {
    const c = Number(p.add(q)), qn = Number(q), hn = Math.sqrt(p.mul(q).valueOf());
    const pts = [[0, 0], [c, 0], [qn, hn]], Hp = [qn, 0];
    const f = AG.fitPoints([...pts, Hp], W1, H1, PAD);
    const [A, B, C] = pts.map(x => f(x)), Hf = f(Hp);
    const s = AG.sketch(W1, H1);
    s.poly([A, B, C]);
    s.line(C, Hf, { dash: true });           // Höhe h
    s.right(C, A, B);
    s.right(Hf, C, B);
    vertexNames(s, [A, B, C], centroid([A, B, C]), ["A", "B", "C"]);
    if (lab.c) s.side(A, B, lab.c, { inside: C });
    if (lab.b) s.side(A, C, lab.b, { inside: B });
    if (lab.a) s.side(B, C, lab.a, { inside: A });
    if (lab.q) s.label([(A[0] + Hf[0]) / 2, A[1] - 4], lab.q, { anchor: "middle" });
    if (lab.p) s.label([(Hf[0] + B[0]) / 2, B[1] - 4], lab.p, { anchor: "middle" });
    if (lab.h) s.label([Hf[0] + 2.5, (Hf[1] + C[1]) / 2], lab.h, { anchor: "start" });
    if (lab.A) s.label(centroid([A, B, C]), lab.A, { anchor: "middle" });
    return s.done();
  }

  // Ein Pythagoreisches Tripel (k, l, m): p = u·k², q = u·l², c = u·m², a = u·k·m, b = u·l·m, h = u·k·l
  const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];

  // Gegeben p und q (oder c und ein Abschnitt): gesucht h, a oder b; bzw. p oder q aus h (Höhensatz umgekehrt)
  function kTaskFor(p, q, v) {
    const c = p.add(q), hN = Math.sqrt(p.mul(q).valueOf());
    if (v === "p" || v === "q") {
      const other = v === "p" ? "q" : "p";
      const at = { p: "bei B", q: "bei A" };
      const oF = v === "p" ? q : p, res = v === "p" ? p : q, M = p.mul(q);
      return {
        q: rich("Die Höhe h auf der Hypotenuse c ist ", cm(hN), " lang. Der Abschnitt ", other, " (", at[other], ") ist ", cm(oF), " lang. Berechne den Abschnitt ", v, " (", at[v], ")."),
        a: rich(v, " = ", cm(res)),
        steps: [
          rich("Höhensatz: h", SUP2, " = p · q, also ", v, " = h", SUP2, " : ", other),
          rich("h", SUP2, " = ", cm(hN), " · ", cm(hN), " = ", cm2(M)),
          rich(v, " = ", cm2(M), " : ", cm(oF), " = ", cm(res)),
        ],
        fig: kFig(p, q, { h: "h = " + cm(hN), [other]: other + " = " + cm(oF), [v]: v + " = ?" }),
        aFig: kFig(p, q, { h: "h = " + cm(hN), [other]: other + " = " + cm(oF), [v]: v + " = " + cm(res) }),
        inline: false,
        check: [{ want: D(res), v: res.valueOf(), tol: 1e-9 }],
      };
    }
    const M = v === "h" ? p.mul(q) : v === "a" ? c.mul(p) : c.mul(q);
    const rs = rootStep(v, M, rich(dn(M), " cm²"), "cm");
    const note = rs.exact ? "" : " Runde auf zwei Nachkommastellen.";
    const giv = { c: "c = " + cm(c), p: "p = " + cm(p), q: "q = " + cm(q) };
    const given = v === "h" ? { p: giv.p, q: giv.q } : v === "a" ? { c: giv.c, p: giv.p } : { c: giv.c, q: giv.q };
    const txt = {
      h: ["Die Höhe h auf der Hypotenuse c teilt sie in die Abschnitte p = ", cm(p), " (bei B) und q = ", cm(q), " (bei A). Berechne die Höhe h."],
      a: ["Im rechtwinkligen Dreieck ABC (rechter Winkel bei C) ist die Hypotenuse c = ", cm(c), " lang. Die Höhe teilt c in den Abschnitt p = ", cm(p), " bei B. Berechne die Kathete a = BC."],
      b: ["Im rechtwinkligen Dreieck ABC (rechter Winkel bei C) ist die Hypotenuse c = ", cm(c), " lang. Die Höhe teilt c in den Abschnitt q = ", cm(q), " bei A. Berechne die Kathete b = AC."],
    };
    const stepsOf = {
      h: [rich("Höhensatz: h", SUP2, " = p · q"), rich("h", SUP2, " = ", cm(p), " · ", cm(q), " = ", cm2(M))],
      a: [rich("Kathetensatz: a", SUP2, " = c · p"), rich("a", SUP2, " = ", cm(c), " · ", cm(p), " = ", cm2(M))],
      b: [rich("Kathetensatz: b", SUP2, " = c · q"), rich("b", SUP2, " = ", cm(c), " · ", cm(q), " = ", cm2(M))],
    };
    const mk = extra => ({ ...given, [v]: extra });
    return {
      q: rich(...txt[v], note),
      a: rs.ans,
      steps: [...stepsOf[v], rs.step],
      fig: kFig(p, q, mk(v + " = ?")),
      aFig: kFig(p, q, mk(plain(rs.ans))),
      inline: false,
      check: [{ want: rs.want, v: rs.tv, tol: rs.exact ? 1e-9 : 0.0051 }],
    };
  }

  // Ein Pythagoreisches Tripel (k, l, m) mit p = u·k², q = u·l², c = u·m², h = u·k·l (exakt)
  function kLevel1(rng) {
    let [k, l, m] = rng.pick(TRI);
    if (rng.chance(0.5)) [k, l] = [l, k];
    const u = m === 5 ? rng.int(1, 4) : 1;
    const p = F(u * k * k), q = F(u * l * l);
    return kTaskFor(p, q, rng.pick(["h", "a", "b", "p", "q"]));
  }

  // Stufe 2: Wurzeln nicht exakt, Taschenrechner (≈)
  function kLevel2(rng) {
    const v = rng.pick(["h", "a", "b"]);
    let p, q;
    for (let i = 0; ; i++) {
      if (i > 300) throw new Error("m10-kathetensatz-hoehensatz: keine Zahlen gefunden");
      p = F(rng.int(2, 30)); q = F(rng.int(2, 30));
      if (p.eq(q) || Math.max(p.valueOf(), q.valueOf()) > 3 * Math.min(p.valueOf(), q.valueOf())) continue;
      const c = p.add(q);
      const M = v === "h" ? p.mul(q) : v === "a" ? c.mul(p) : c.mul(q);
      if (fracSqrt(M)) continue;                    // Ergebnis nicht exakt: Taschenrechner
      break;
    }
    return kTaskFor(p, q, v);
  }

  // Umkehrung: a und c gegeben, Abschnitte p und q gesucht (p = a² : c)
  function kUmkehr(rng) {
    const c = rng.pick([10, 20, 25, 50]);
    const a = rng.int(Math.ceil(c / 2), Math.floor(0.85 * c));
    const p = new Frac(a * a, c), q = F(c).sub(p);
    return {
      q: rich("Im rechtwinkligen Dreieck ABC (rechter Winkel bei C) sind die Hypotenuse c = ", cm(c), " und die Kathete a = BC = ", cm(a), " bekannt. Die Höhe teilt c in die Abschnitte p (bei B) und q (bei A). Berechne p und q."),
      a: rich("p = ", cm(p), " und q = ", cm(q)),
      steps: [
        rich("Kathetensatz: a", SUP2, " = c · p, also p = a", SUP2, " : c"),
        rich("p = ", dn(F(a * a)), " cm² : ", cm(c), " = ", cm(p)),
        rich("q = c − p = ", cm(c), " − ", cm(p), " = ", cm(q)),
      ],
      fig: kFig(p, q, { a: "a = " + cm(a), c: "c = " + cm(c), p: "p = ?", q: "q = ?" }),
      aFig: kFig(p, q, { a: "a = " + cm(a), c: "c = " + cm(c), p: "p = " + cm(p), q: "q = " + cm(q) }),
      inline: false,
      check: [{ want: D(p), v: p.valueOf(), tol: 1e-9 }, { want: D(q), v: q.valueOf(), tol: 1e-9 }],
    };
  }

  // Flächeninhalt aus p und q: c = p + q, h = √(p · q) (≈), A = c · h : 2 (≈)
  function kFlaeche(rng) {
    let p, q, M;
    for (let i = 0; ; i++) {
      if (i > 300) throw new Error("m10-kathetensatz-hoehensatz: keine Zahlen gefunden");
      p = F(rng.int(2, 30)); q = F(rng.int(2, 30));
      if (p.eq(q) || Math.max(p.valueOf(), q.valueOf()) > 3 * Math.min(p.valueOf(), q.valueOf())) continue;
      M = p.mul(q);
      if (!fracSqrt(M)) break;
    }
    const c = p.add(q), cN = c.valueOf();
    const hs = rootStep("h", M, rich(dn(M), " cm²"), "cm");
    const hv = Math.sqrt(M.valueOf());                          // genaues h (Taschenrechner)
    const hc = Math.round(hv * 100);                             // h auf Hundertstel gerundet (nur Anzeige)
    const Ar = new Frac(Math.round(cN * hv / 2 * 100), 100);    // A = c · h : 2, auf Hundertstel gerundet
    return {
      q: rich("Die Höhe h teilt die Hypotenuse c in die Abschnitte p = ", cm(p), " (bei B) und q = ", cm(q), " (bei A). Berechne den Flächeninhalt A des Dreiecks ABC. Runde das Ergebnis auf zwei Nachkommastellen."),
      a: rich("A ≈ ", D2(Ar), " cm²"),
      steps: [
        rich("c = p + q = ", cm(p), " + ", cm(q), " = ", cm(c)),
        rich("h", SUP2, " = ", dn(p), " cm · ", dn(q), " cm = ", cm2(M)),
        hs.step,
        rich("A = c · h : 2 = ", cm(c), " · ", approx6(hv), " cm : 2 ≈ ", D2(Ar), " cm²"),
      ],
      fig: kFig(p, q, { p: "p = " + cm(p), q: "q = " + cm(q), h: "h = ?", A: "A = ?" }),
      aFig: kFig(p, q, { p: "p = " + cm(p), q: "q = " + cm(q), h: "h ≈ " + D2(new Frac(hc, 100)) + " cm", A: "A ≈ " + D2(Ar) + " cm²" }),
      inline: false,
      check: [{ want: D2(Ar), v: Ar.valueOf(), tol: 1e-6 }],
    };
  }

  function gen3(rng, level) {
    if (level === 1) return kLevel1(rng);
    if (level === 2) return kLevel2(rng);
    return rng.chance(0.5) ? kUmkehr(rng) : kFlaeche(rng);
  }

  AG.registerType({
    id: "m10-kathetensatz-hoehensatz",
    klasse: "10",
    zug: "M",
    lb: "3",
    lbTitle: LB3,
    topic: "flaechen",
    title: "Kathetensatz und Höhensatz",
    instruction: {
      1: "Berechne die gesuchte Größe mit dem Kathetensatz bzw. Höhensatz.",
      2: "Berechne mit dem Kathetensatz bzw. Höhensatz. Runde auf zwei Nachkommastellen, wenn nötig.",
      3: "Berechne die Abschnitte bzw. den Flächeninhalt. Runde auf zwei Nachkommastellen, wenn nötig.",
    },
    merke: [
      "Die Höhe h auf der Hypotenuse c teilt c in p (bei B, zur Kathete a gehörig) und q (bei A, zur Kathete b gehörig). ",
      { b: "Kathetensatz: a² = c · p, b² = c · q" }, ". ", { b: "Höhensatz: h² = p · q" }, ". ",
      "Beispiel: p = 9 cm, q = 16 cm → c = 25 cm, a² = 25 · 9 = 225, also a = 15 cm; h² = 9 · 16 = 144, also h = 12 cm.",
    ],
    cols: 1,
    generate: (rng, level) => retry(() => gen3(rng, level)),
    verify: verifyWant,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
