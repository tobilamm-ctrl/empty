// M7/R7 LB 4: Flächeninhalt von Parallelogramm und Dreieck – mit Skizze. Referenz-Aufgabentyp für Skizzen.
(function (AG) {
  const { Frac, num, rich, fmtDec } = AG;
  const cm = x => fmtDec(x) + " cm";
  const cm2 = x => fmtDec(x) + " cm²";

  // Skizze: Parallelogramm oder Dreieck mit Grundseite g und Höhe h (Beschriftungen frei wählbar)
  function sketchShape(kind, g, h, shift, labG, labH) {
    const W = 62, H = 38;
    h = Math.min(Math.max(h, 0.4 * g), 1.1 * g); // Skizze, nicht maßstabsgetreu: keine zu flachen/spitzen Figuren
    shift = Math.min(shift, 0.8 * g);
    // Punkte in cm (y nach oben)
    const pts = kind === "para"
      ? [[0, 0], [g, 0], [g + shift, h], [shift, h]]
      : [[0, 0], [g, 0], [shift, h]];
    const f = AG.fitPoints(pts.concat([[0, -0.15 * h]]), W, H, 7);
    const P = pts.map(f);
    const s = AG.sketch(W, H);
    s.poly(P);
    const top = kind === "para" ? P[3] : P[2];
    const foot = [top[0], P[0][1]];
    s.line(top, foot, { dash: true });
    if (foot[0] > P[0][0] + 1 && foot[0] < P[1][0] - 1) s.right(foot, P[1], top);
    s.side(P[0], P[1], labG, { inside: top });
    // Höhe innen beschriften, wenn rechts der Höhe genug Platz ist, sonst links außen
    const roomRight = (kind === "para" ? P[2][0] : P[1][0]) - foot[0];
    if (roomRight > 16) s.label([foot[0] + 1.2, (top[1] + foot[1]) / 2], labH, { anchor: "start" });
    else s.label([foot[0] - 1.2, (top[1] + foot[1]) / 2], labH, { anchor: "end" });
    return s.done();
  }

  AG.registerType({
    id: "m7-flaeche-para-dreieck",
    klasse: "7",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt",
    title: "Parallelogramm und Dreieck",
    instruction: {
      1: "Berechne den Flächeninhalt.",
      2: "Berechne den Flächeninhalt. Achte auf die Einheiten.",
      3: "Berechne die fehlende Größe.",
    },
    merke: [
      "Parallelogramm: ", { b: "A = g · h" }, ". Dreieck: ", { b: "A = g · h : 2" },
      ". Die Höhe h steht immer senkrecht auf der Grundseite g. Beispiel: g = 6 cm, h = 4 cm → Dreieck A = 6 cm · 4 cm : 2 = 12 cm².",
    ],
    cols: 2,
    generate(rng, level) {
      const kind = rng.chance(0.5) ? "para" : "tri";
      let g, h;
      if (level === 1) { g = new Frac(rng.int(3, 12)); h = new Frac(rng.int(2, 9)); }
      else { g = new Frac(rng.int(25, 120), 10); h = new Frac(rng.int(15, 80), 10); }
      if (kind === "tri" && level === 1 && g.mul(h).n % 2) h = h.add(1);
      const A = kind === "para" ? g.mul(h) : g.mul(h).div(2);
      const name = kind === "para" ? "Parallelogramm" : "Dreieck";
      const shift = kind === "para" ? Number(g) * rng.pick([0.25, 0.35, 0.45]) : Number(g) * rng.pick([0.2, 0.35, 0.6, 0.75]);
      const formula = kind === "para" ? "A = g · h" : "A = g · h : 2";

      if (level < 3) {
        // Niveau 2: eine Größe in mm angeben
        const gTxt = level === 2 && rng.chance(0.5) ? fmtDec(g.mul(10)) + " mm" : cm(g);
        const fig = sketchShape(kind, Number(g), Number(h), shift, "g = " + gTxt, "h = " + cm(h));
        const steps = [];
        if (gTxt.endsWith("mm")) steps.push(rich("g = ", gTxt, " = ", cm(g)));
        steps.push(rich(formula));
        steps.push(rich("A = ", cm(g), " · ", cm(h), kind === "tri" ? " : 2" : ""));
        steps.push(rich("A = ", cm2(A)));
        return { q: rich(name + ": g = ", gTxt, ", h = ", cm(h)), a: rich(cm2(A)), steps, fig, inline: false };
      }
      // Niveau 3: Umkehraufgabe – A und g gegeben, h gesucht (oder A und h, g gesucht)
      const askH = rng.chance(0.5);
      const fig = sketchShape(kind, Number(g), Number(h), shift, askH ? "g = " + cm(g) : "g = ?", askH ? "h = ?" : "h = " + cm(h));
      const steps = [rich(formula)];
      if (askH) {
        steps.push(rich(cm2(A), " = ", cm(g), " · h", kind === "tri" ? " : 2" : ""));
        steps.push(rich("h = ", cm2(A), kind === "tri" ? " · 2" : "", " : ", cm(g)));
        steps.push(rich("h = ", cm(h)));
      } else {
        steps.push(rich(cm2(A), " = g · ", cm(h), kind === "tri" ? " : 2" : ""));
        steps.push(rich("g = ", cm2(A), kind === "tri" ? " · 2" : "", " : ", cm(h)));
        steps.push(rich("g = ", cm(g)));
      }
      return {
        q: rich(name + ": A = ", cm2(A), askH ? ", g = " + cm(g) + ". Berechne h." : ", h = " + cm(h) + ". Berechne g."),
        a: rich(askH ? "h = " + cm(h) : "g = " + cm(g)),
        steps, fig, inline: false,
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
