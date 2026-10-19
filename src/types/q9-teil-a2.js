// Quali-Training Teil A (Klasse 9, ohne Taschenrechner), zwei Typen:
// q9-graph-zuordnen (topic "zuordnung"): Sachverhalte den passenden Graphen zuordnen, alle Graphen in einer Skizze.
// q9-umformung-ergaenzen (topic "terme"): Lücken in einer Gleichungsumformung ergänzen oder die fehlerhafte Zeile finden.
(function (AG) {
  const { rich, MINUS, SKETCH_COLORS } = AG;
  const INK = SKETCH_COLORS.INK;
  const abs = Math.abs;
  const LETTERS = ["A", "B", "C", "D"];
  const META = { klasse: "9", zug: "RM", lb: "Q", lbTitle: "Quali-Training" };

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const sg = rng => (rng.chance(0.5) ? -1 : 1);

  // ======================================================================
  // 1. Sachverhalte und Graphen zuordnen
  // ======================================================================
  // pts: Verlauf im Einheitsquadrat (u = x, v = y, jeweils 0 … 1); direct / indirect: Sachverhalt mit Achsenbeschriftung
  const SHAPES = [
    {
      pts: () => [[0, 0], [1, 0.8]],
      erk: "Der Graph ist eine Gerade durch den Ursprung: Er beginnt bei 0 und steigt gleichmäßig.",
      direct: { xl: "Menge", yl: "Preis", t: "Äpfel kosten auf dem Markt pro Kilogramm immer gleich viel." },
      indirect: { xl: "Anzahl", yl: "Preis", t: "Ein Heft kostet 0,80 €." },
    },
    {
      pts: () => [[0, 0.3], [1, 0.85]],
      erk: "Der Graph ist eine steigende Gerade, die nicht im Ursprung beginnt: Am Anfang steht schon ein fester Betrag (Grundgebühr).",
      direct: { xl: "Zeit", yl: "Kosten", t: "Ein Handytarif hat eine monatliche Grundgebühr und zusätzlich einen festen Preis pro Minute." },
      indirect: { xl: "Strecke", yl: "Preis", t: "Ein Taxi verlangt 3 € Grundpreis und 2 € für jeden Kilometer." },
    },
    {
      pts: () => [[0, 0.5], [1, 0.5]],
      erk: "Der Graph verläuft waagerecht: Der Wert bleibt immer gleich.",
      direct: { xl: "Besuche", yl: "Kosten", t: "Eine Jahreskarte fürs Freibad kostet immer gleich viel, egal wie oft man hingeht." },
      indirect: { xl: "Zeit", yl: "Höhe", t: "Ein Ballon schwebt eine Stunde lang auf gleicher Höhe." },
    },
    {
      pts: () => [[0, 0.9], [1, 0.15]],
      erk: "Der Graph ist eine fallende Gerade: Der Wert nimmt gleichmäßig ab.",
      direct: { xl: "Zeit", yl: "Länge", t: "Eine Kerze brennt gleichmäßig ab und wird dabei immer kürzer." },
      indirect: { xl: "Zeit", yl: "Menge", t: "Aus einem vollen Tank fließt gleichmäßig Benzin ab." },
    },
    {
      pts: () => [[0, 0.25], [0.34, 0.25], [0.34, 0.5], [0.67, 0.5], [0.67, 0.75], [1, 0.75]],
      erk: "Der Graph besteht aus Stufen: Der Wert springt jedes Mal, wenn eine neue Stunde beginnt.",
      direct: { xl: "Zeit", yl: "Preis", t: "Ein Parkhaus verlangt 2 € für jede angefangene Stunde." },
      indirect: { xl: "Zeit", yl: "Gebühr", t: "Ein Schließfach am Bahnhof kostet 1 € für jede angefangene Stunde." },
    },
    {
      pts: () => [[0, 0], [0.25, 0.7], [0.75, 0.7], [1, 0]],
      erk: "Der Graph steigt zuerst, verläuft dann eine Zeit lang waagerecht und fällt am Ende wieder bis zur Achse.",
      direct: { xl: "Zeit", yl: "Tempo", t: "Ein Laufband-Programm: Zuerst wird langsam angewärmt, dann gleichmäßig gelaufen, zum Schluss ausgelaufen." },
      indirect: { xl: "Zeit", yl: "Tempo", t: "Beim Joggen steigert man am Anfang das Tempo, läuft eine Zeit lang gleich schnell und wird am Ende langsamer." },
    },
    {
      pts: () => range(0, 40).map(i => { const u = 0.2 + (0.8 * i) / 40; return [u, 0.2 / u]; }),
      erk: "Der Graph ist eine fallende Kurve, die sich den Achsen nähert: Je größer x, desto kleiner y.",
      direct: { xl: "Arbeiter", yl: "Tage", t: "Ein Auftrag braucht immer gleich viel Arbeit. Je mehr Arbeiter ihn erledigen, desto weniger Tage dauert er." },
      indirect: { xl: "Tempo", yl: "Fahrzeit", t: "Eine Strecke von 120 km wird mit unterschiedlichem Tempo zurückgelegt." },
    },
    {
      pts: () => range(0, 40).map(i => { const u = i / 40; return [u, (0.9 * (1 - Math.exp(-3 * u))) / (1 - Math.exp(-3))]; }),
      erk: "Der Graph ist eine steigende Kurve, die immer flacher wird: Der Zuwachs wird mit der Zeit kleiner.",
      direct: { xl: "Alter", yl: "Größe", t: "Die Körpergröße eines Kindes nimmt mit dem Alter zu, in den späteren Jahren aber immer langsamer." },
      indirect: { xl: "Alter", yl: "Größe", t: "Ein Baby wächst im ersten Jahr stark, danach nimmt das Wachstum immer weiter ab." },
    },
  ];

  // Ein Feld im Bild (Breite cellW, Buchstabe links oben), Achsen ohne Zahlen, nur Beschriftung
  function drawSlot(s, x0, cellW, shape, letter, ctx) {
    const ox = x0 + 9, oy = 44, axW = cellW - 14, axH = 28;
    const P = (u, v) => [ox + u * axW, oy - v * axH];
    s.line([ox, oy], [ox + axW + 1, oy], { width: 0.35 });
    s.poly([[ox + axW + 3, oy], [ox + axW, oy - 0.9], [ox + axW, oy + 0.9]], { fill: INK, stroke: INK, width: 0.1 });
    s.line([ox, oy], [ox, oy - axH - 1], { width: 0.35 });
    s.poly([[ox, oy - axH - 3], [ox - 0.9, oy - axH], [ox + 0.9, oy - axH]], { fill: INK, stroke: INK, width: 0.1 });
    const pts = shape.pts().map(([u, v]) => P(u, v));
    s.path("M" + pts.map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" L"), { width: 0.5 });
    s.label([ox + axW + 2, oy + 4.5], ctx.xl, { anchor: "end", size: 3 });
    s.label([ox + 1.5, oy - axH - 4], ctx.yl, { anchor: "start", size: 3 });
    s.label([x0 + 2, 6], letter, { anchor: "start", bold: true, size: 4.2 });
  }

  AG.registerType({
    id: "q9-graph-zuordnen",
    ...META,
    topic: "zuordnung",
    title: "Sachverhalten Graphen zuordnen",
    cols: 1,
    instruction: "Ordne jedem Sachverhalt den passenden Graphen zu. Jeder Graph gehört zu genau einem Sachverhalt.",
    merke: [
      "Ursprungsgerade = proportional. Gerade oberhalb des Ursprungs = Grundgebühr. Waagerecht = konstant. Stufen = angefangene Einheiten. ",
      "Fallende Kurve, die sich den Achsen nähert = umgekehrt proportional. Steigende Kurve, die immer flacher wird = Wachstum, das langsamer wird.",
    ],
    generate(rng, level) {
      const N = level === 1 ? 3 : 4;
      const which = level === 3 ? "indirect" : "direct";
      const shapes = rng.shuffle(SHAPES).slice(0, N);      // Reihenfolge der Sachverhalte (zufällig)
      const slots = rng.shuffle(shapes);                    // Lage der Graphen im Bild (zufällig)
      const letters = LETTERS.slice(0, N);
      const letterOf = S => letters[slots.indexOf(S)];
      const cellW = 150 / N;
      const s = AG.sketch(150, 56);
      slots.forEach((S, i) => drawSlot(s, i * cellW, cellW, S, letters[i], S[which]));
      const fig = s.done();
      const q = rich(
        `Ordne jedem Sachverhalt den passenden Graphen zu (Graphen ${letters.join(", ")}). Schreibe z. B. „1 – C“.`,
        shapes.flatMap((S, j) => [{ br: true }, `${j + 1}) `, S[which].t])
      );
      const answers = shapes.map((S, j) => `${j + 1} – ${letterOf(S)}`);
      const steps = shapes.map((S, j) => rich(`${j + 1} – ${letterOf(S)}: `, S.erk));
      return { q, a: rich(answers.join(", ")), steps, fig, inline: false, check: { answers } };
    },
    verify(t) {
      const exp = t.check && t.check.answers;
      if (!exp) return "kein Prüfdatensatz";
      return AG.plain(t.a) === exp.join(", ") ? true : "Lösung falsch: " + AG.plain(t.a);
    },
  });

  // ======================================================================
  // 2. Gleichungsumformung ergänzen
  // ======================================================================
  // Zustand: L = [a, b] (a·x + b), R = [c, d] (c·x + d), alle ganzzahlig.
  // Befehle: {k:"br"} Klammer auflösen (ohne Änderung der Werte), {k:"x", d} | + d·x, {k:"c", d} | + d,
  //          {k:"div", d} | : d, {k:"mul", d} | · d (nur für die Rückwärtsrechnung)

  // Seite als Rich: a·x + b
  function side(v) {
    const [a, b] = v;
    const out = [];
    if (a !== 0) out.push(a < 0 ? MINUS : "", abs(a) === 1 ? "" : String(abs(a)), "x");
    if (b !== 0) {
      if (a !== 0) out.push(b > 0 ? " + " + b : " " + MINUS + " " + abs(b));
      else out.push(b < 0 ? MINUS + abs(b) : String(b));
    }
    if (!out.length) out.push("0");
    return out;
  }
  // Klammerform p · (x + m) + t
  function bracketSide(p, m, t) {
    const out = [p < 0 ? MINUS : "", abs(p) === 1 ? "" : abs(p) + " · ", "(x", m > 0 ? " + " + m : " " + MINUS + " " + abs(m), ")"];
    if (t > 0) out.push(" + " + t);
    else if (t < 0) out.push(" " + MINUS + " " + abs(t));
    return out;
  }
  const eqCells = st => [...side(st.L), " = ", ...side(st.R)];

  function opText(op) {
    if (op.k === "br") return "Klammer auflösen";
    if (op.k === "x") return (op.d < 0 ? MINUS : "+") + " " + (abs(op.d) === 1 ? "" : abs(op.d)) + "x";
    if (op.k === "c") return (op.d < 0 ? MINUS : "+") + " " + abs(op.d);
    const f = op.k === "mul" ? "· " : ": ";
    return f + (op.d < 0 ? "(" + MINUS + abs(op.d) + ")" : String(op.d));
  }
  const inv = op => (op.k === "x" ? { k: "x", d: -op.d } : op.k === "c" ? { k: "c", d: -op.d } : { k: "mul", d: op.d });

  // Befehl auf beide Seiten anwenden; null, wenn nicht ganzzahlig teilbar
  function apply(op, st) {
    if (op.k === "br") return st;
    const L = st.L.slice(), R = st.R.slice();
    if (op.k === "x") { L[0] += op.d; R[0] += op.d; }
    else if (op.k === "c") { L[1] += op.d; R[1] += op.d; }
    else {
      if ([...L, ...R].some(v => v % op.d !== 0)) return null;
      for (const arr of [L, R]) for (let i = 0; i < arr.length; i++) arr[i] /= op.d;
    }
    return { L, R };
  }
  const same = (a, b) => a.L.every((v, i) => v === b.L[i]) && a.R.every((v, i) => v === b.R[i]);

  // Gleichung mit Lösung x0 (ganzzahlig, ≠ 0); Start p·x + q = r·x + s, Schritte: x-Glieder, Konstante, Teilen
  function genChain(rng, withBr) {
    for (let tries = 0; tries < 500; tries++) {
      const x0 = sg(rng) * rng.int(1, 9);
      const p = sg(rng) * rng.int(1, 6), r = sg(rng) * rng.int(1, 6);
      if (p === r || abs(p - r) < 2) continue;
      const q = sg(rng) * rng.int(1, 12);
      const s = (p - r) * x0 + q;
      if (s === 0 || abs(s) > 40) continue;
      const m = sg(rng) * rng.int(1, 5);
      const ops = [...(withBr ? [{ k: "br" }] : []), { k: "x", d: -r }, { k: "c", d: -q }, { k: "div", d: p - r }];
      const states = [{ L: [p, q], R: [r, s] }];
      let ok = true;
      for (const op of ops) {
        const nx = apply(op, states[states.length - 1]);
        if (!nx) { ok = false; break; }
        states.push(nx);
      }
      if (!ok) continue;
      const fin = states[states.length - 1];
      if (fin.L[0] !== 1 || fin.L[1] !== 0 || fin.R[0] !== 0 || fin.R[1] !== x0) continue;
      return { ops, states, bracket: withBr ? { p, m, t: q - p * m } : null };
    }
    throw new Error("Umformung: keine Gleichung gefunden");
  }

  // Zeile i als Rich (Zeile 0 in Klammerform, wenn die Gleichung eine Klammer hat)
  function rowCells(ch, states, i) {
    if (i === 0 && ch.bracket) return [...bracketSide(ch.bracket.p, ch.bracket.m, ch.bracket.t), " = ", ...side(states[0].R)];
    return eqCells(states[i]);
  }

  // Gesamte Umformung: Zeilen (rowFn) mit Befehlen (opFn) rechts daneben
  function chainCells(n, rowFn, opFn) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      out.push({ br: true }, ...rowFn(i));
      if (i < n) out.push("   | ", opFn(i));
    }
    return out;
  }

  // Lösung: je Übergang ein Satz mit dem Befehl
  function transitionSteps(ch, states) {
    return ch.ops.map((op, i) => rich(`Zeile ${i + 1} mit „${opText(op)}“ ergibt: `, ...eqCells(states[i + 1])));
  }

  // Rechenfehler: eine Zeile k (Index ≥ 1) falsch; ab da wird mit der falschen Zeile weitergerechnet
  function corrupt(rng, ch) {
    const n = ch.ops.length;
    for (let tries = 0; tries < 300; tries++) {
      const k = rng.int(1, n);
      const op = ch.ops[k - 1];
      const prev = ch.states[k - 1], good = ch.states[k];
      let bad;
      if (op.k === "br" || rng.chance(0.5)) {
        // Vorzeichenfehler bei einer Konstanten
        const L = good.L.slice(), R = good.R.slice();
        const cands = [L, R].filter(v => v[1] !== 0);
        if (!cands.length) continue;
        rng.pick(cands)[1] *= -1;
        bad = { L, R };
      } else {
        // nur eine Seite umgeformt
        const ap = apply(op, prev);
        if (!ap) continue;
        bad = rng.chance(0.5) ? { L: ap.L, R: prev.R.slice() } : { L: prev.L.slice(), R: ap.R };
      }
      if (same(bad, good)) continue;
      const disp = ch.states.slice(0, k).concat([bad]);
      let ok = true;
      for (let i = k; i < n; i++) {
        const nx = apply(ch.ops[i], disp[i]);
        if (!nx) { ok = false; break; }
        disp.push(nx);
      }
      if (ok) return { k, disp };
    }
    throw new Error("Umformung: kein Fehler erzeugt");
  }

  // Niveau 1: Rechenbefehle fehlen
  function task1(rng) {
    const ch = genChain(rng, rng.chance(0.5));
    const n = ch.ops.length;
    const blanks = rng.shuffle(range(0, n - 1)).slice(0, rng.pick([1, 2]));
    const q = rich(
      "Die Gleichung wird Schritt für Schritt umgeformt. Ergänze die fehlenden Rechenbefehle (Lücken „___“).",
      chainCells(n, i => rowCells(ch, ch.states, i), i => (blanks.includes(i) ? { blank: 8 } : opText(ch.ops[i])))
    );
    // Antwort: nur die Lücken, in der Reihenfolge von oben; die Schritte enden mit derselben Zeile
    const a = rich("Fehlende Rechenbefehle: ", ...blanks.slice().sort((x, y) => x - y).flatMap((i, j) => (j ? ["; ", opText(ch.ops[i])] : [opText(ch.ops[i])])));
    return { q, a,
      steps: [...transitionSteps(ch, ch.states), a], check: { ch, disp: ch.states, errRow: null } };
  }

  // Niveau 2: Zeilen fehlen
  function task2(rng) {
    const ch = genChain(rng, rng.chance(0.5));
    const n = ch.ops.length;
    const blankRows = rng.shuffle(range(1, n - 1)).slice(0, rng.pick([1, 2]));
    const q = rich(
      "Die Gleichung wird Schritt für Schritt umgeformt. Ergänze die fehlenden Gleichungen (Lücken „___“). Die Rechenbefehle rechts stehen fest.",
      chainCells(n, i => (blankRows.includes(i) ? [{ blank: 16 }] : rowCells(ch, ch.states, i)), i => opText(ch.ops[i]))
    );
    const a = rich("Fehlende Gleichungen: ", ...blankRows.slice().sort((x, y) => x - y).flatMap((i, j) => (j ? ["; ", ...rowCells(ch, ch.states, i)] : rowCells(ch, ch.states, i))));
    return { q, a, steps: [...transitionSteps(ch, ch.states), a], check: { ch, disp: ch.states, errRow: null } };
  }

  // Niveau 3a: rückwärts – Ergebnis und Befehle stehen, die Ausgangsgleichung fehlt (ohne Klammer)
  function task3a(rng) {
    const ch = genChain(rng, false);
    const n = ch.ops.length;
    const q = rich(
      "Eine Gleichung wird Schritt für Schritt umgeformt. Das Ergebnis und die Rechenbefehle stehen fest; die Ausgangsgleichung fehlt. Bestimme sie.",
      { br: true }, "Ausgangsgleichung: ", { blank: 16 },
      ...ch.ops.flatMap(op => [{ br: true }, "   | ", opText(op)]),
      { br: true }, "Ergebnis: ", ...eqCells(ch.states[n])
    );
    const steps = range(0, n - 1).map(j => {
      const i = n - 1 - j;   // rückwärts: letzter Befehl zuerst
      return rich("Rückwärts: ", ...eqCells(ch.states[i + 1]), ` mit „${opText(inv(ch.ops[i]))}“ ergibt: `, ...eqCells(ch.states[i]));
    });
    return {
      q,
      a: rich("Ausgangsgleichung: ", ...eqCells(ch.states[0])),
      steps,
      check: { ch, disp: ch.states, errRow: null },
    };
  }

  // Niveau 3b: Fehler finden und berichtigen
  function task3b(rng) {
    const ch = genChain(rng, rng.chance(0.5));
    const n = ch.ops.length;
    const { k, disp } = corrupt(rng, ch);
    const q = rich(
      "Bei dieser Umformung ist eine Zeile falsch. Finde die falsche Zeile und schreibe sie richtig auf.",
      chainCells(n, i => [`Zeile ${i + 1}: `, ...rowCells(ch, disp, i)], i => opText(ch.ops[i]))
    );
    return {
      q,
      a: rich(`Zeile ${k + 1} ist falsch. Richtig: `, ...eqCells(ch.states[k])),
      steps: [
        rich(`Zeile ${k} mit „${opText(ch.ops[k - 1])}“ ergibt: `, ...eqCells(ch.states[k])),
        rich(`In Zeile ${k + 1} steht aber: `, ...eqCells(disp[k]), ". Diese Zeile ist falsch."),
      ],
      check: { ch, disp, errRow: k },
    };
  }

  AG.registerType({
    id: "q9-umformung-ergaenzen",
    ...META,
    topic: "terme",
    title: "Gleichungsumformung ergänzen",
    cols: 2,
    instruction: {
      1: "Ergänze die fehlenden Rechenbefehle.",
      2: "Ergänze die fehlenden Gleichungen.",
      3: "Bestimme die Ausgangsgleichung oder finde die falsche Zeile.",
    },
    merke: [
      "Eine Umformung gilt für beide Seiten: ", { b: "| − 5" }, " heißt, auf beiden Seiten 5 subtrahieren. ",
      "Rückwärts werden die Befehle umgekehrt: Plus und Minus, Mal und Geteilt tauschen.",
    ],
    generate(rng, level) {
      if (level === 1) return task1(rng);
      if (level === 2) return task2(rng);
      return rng.chance(0.5) ? task3a(rng) : task3b(rng);
    },
    verify(t) {
      const c = t.check;
      if (!c) return "kein Prüfdatensatz";
      const { ch, disp, errRow } = c;
      const n = ch.ops.length;
      for (let i = 0; i < n; i++) {
        const nx = apply(ch.ops[i], disp[i]);
        const ok = !!nx && same(nx, disp[i + 1]);
        if (errRow === null && !ok) return "Umformung stimmt nicht in Zeile " + (i + 2);
        if (errRow !== null && i === errRow - 1 && ok) return "Fehler liegt nicht im Übergang";
        if (errRow !== null && i !== errRow - 1 && !ok) return "weiterer Fehler in Zeile " + (i + 2);
      }
      if (errRow !== null && !AG.plain(t.a).includes(AG.plain(eqCells(ch.states[errRow])))) return "Lösung nennt nicht die richtige Zeile";
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
