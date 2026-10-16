// M7 LB 6: Diagramme und statistische Kennwerte – Mittelwert, Spannweite, Zentralwert.
(function (AG) {
  const { Frac, num, rich, plain, fmtDec, MINUS } = AG;

  // Datenkontexte. Werte sind ganze Zahlen in Einheiten von 1/den; mean in Zehnteln.
  // pool: gewichtete Auswahl (Noten 5 und 6 sind selten).
  const NOTEN_POOL = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6];
  const CTX = [
    {
      intro: n => `Die Noten von ${n} Schülerinnen und Schülern im letzten Mathetest:`,
      unit: "", den: { 1: 1, 2: 1 }, dig: { 1: 0, 2: 0 },
      range: { 1: [1, 6], 2: [1, 6] }, mean: { 1: [20, 50], 2: [20, 50] },
      pool: NOTEN_POOL,
    },
    {
      intro: n => `Die erreichten Punkte von ${n} Schülerinnen und Schülern bei einem Quiz:`,
      unit: " Punkte", den: { 1: 1, 2: 1 }, dig: { 1: 0, 2: 0 },
      range: { 1: [6, 30], 2: [6, 30] }, mean: { 1: [120, 240], 2: [120, 240] },
    },
    {
      // Winter: −10 bis 8 °C, Ausreißer höchstens ca. 10 Grad daneben
      intro: n => `Die Tageshöchsttemperaturen im Januar an ${n} Tagen in °C:`,
      unit: " °C", den: { 1: 1, 2: 1, 3: 10 }, dig: { 1: 0, 2: 0, 3: 1 },
      range: { 1: [-10, 8], 2: [-10, 8], 3: [-100, 80] },
      mean: { 1: [-40, 40], 2: [-40, 40], 3: [-30, 30] },
      out: { 3: [[-200, -180], [120, 150]] },
    },
    {
      // Sommer: 18 bis 35 °C, Ausreißer höchstens ca. 10 Grad daneben
      intro: n => `Die Tageshöchsttemperaturen im Juli an ${n} Tagen in °C:`,
      unit: " °C", den: { 1: 1, 2: 1, 3: 10 }, dig: { 1: 0, 2: 0, 3: 1 },
      range: { 1: [18, 35], 2: [18, 35], 3: [180, 350] },
      mean: { 1: [200, 300], 2: [200, 300], 3: [220, 300] },
      out: { 3: [[90, 110]] },
    },
    {
      // Weitsprung Klasse 7: 2,80 bis 5,20 m; Ausreißer 1,90 m oder 5,90 m
      intro: n => `Die Weiten von ${n} Schülerinnen und Schülern im Weitsprung in m:`,
      unit: " m", den: { 1: 100, 2: 100, 3: 100 }, dig: { 1: 2, 2: 2, 3: 2 },
      range: { 1: [280, 520], 2: [280, 520], 3: [280, 520] },
      mean: { 1: [30, 45], 2: [30, 45], 3: [35, 45] },
      out: { 3: [[190, 190], [590, 590]] },
    },
  ];

  const ASK = {
    1: "Bestimme Mittelwert und Spannweite.",
    2: "Bestimme Mittelwert, Spannweite und Zentralwert.",
    3: "Bestimme Mittelwert, Spannweite und Zentralwert. Welcher Kennwert beschreibt die Daten hier besser? Begründe.",
  };

  // Datenreihe erzeugen. Der letzte Wert wird so gewählt, dass der Mittelwert genau M ist
  // (Niveau 1: ganzzahlig, Niveau 2/3: eine Nachkommastelle).
  function makeData(rng, c, n, level) {
    const den = c.den[level];
    const [lo, hi] = c.range[level];
    const [mlo, mhi] = c.mean[level];
    const low = new Frac(lo, den), high = new Frac(hi, den);
    const draw = () => (c.pool ? new Frac(rng.pick(c.pool), den) : new Frac(rng.int(lo, hi), den));
    for (let tries = 0; tries < 500; tries++) {
      let outlier = null;
      if (c.out && c.out[level]) {
        const [a, b] = rng.pick(c.out[level]);
        outlier = new Frac(rng.int(a, b), den);
      }
      const vals = [];
      const normal = n - 1 - (outlier ? 1 : 0);
      for (let i = 0; i < normal; i++) vals.push(draw());
      if (outlier) vals.push(outlier);
      const sum = vals.reduce((s, v) => s.add(v), new Frac(0));
      const cands = [];
      for (let t10 = mlo; t10 <= mhi; t10++) {
        if (level === 1 && t10 % 10 !== 0) continue;
        const last = new Frac(t10, 10).mul(n).sub(sum);
        if (last.cmp(low) < 0 || last.cmp(high) > 0) continue;
        if (!last.mul(den).isInt()) continue;
        cands.push(last);
      }
      if (!cands.length) continue;
      const data = [...vals, rng.pick(cands)];
      const mn = data.reduce((a, b) => (a.cmp(b) <= 0 ? a : b));
      const mx = data.reduce((a, b) => (a.cmp(b) >= 0 ? a : b));
      if (mx.sub(mn).sign() === 0) continue; // keine konstante Reihe
      return { data, outlier };
    }
    throw new Error("makeData: keine Datenreihe für Niveau " + level);
  }

  AG.registerType({
    id: "m7-kennwerte",
    klasse: "7",
    zug: "M",
    lb: "6",
    lbTitle: "Diagramme und statistische Kennwerte",
    title: "Mittelwert, Spannweite, Zentralwert",
    instruction: {
      1: "Berechne Mittelwert und Spannweite der Datenreihe.",
      2: "Berechne die Kennwerte der Datenreihe. Ordne die Werte zuerst der Größe nach.",
      3: "Berechne die Kennwerte und beurteile, welcher Kennwert hier aussagekräftiger ist.",
    },
    merke: [
      "Mittelwert = Summe : Anzahl. Spannweite = größter Wert ", MINUS, " kleinster Wert. ",
      { b: "Zentralwert" }, " = mittlerer Wert der geordneten Reihe; bei gerader Anzahl das Mittel der beiden mittleren Werte. ",
      "Beispiel: 2; 3; 3; 7 → Zentralwert (3 + 3) : 2 = 3.",
    ],
    cols: 1,
    generate(rng, level) {
      const pool = CTX.filter(x => x.range[level]);
      const c = rng.pick(pool);
      const n = level === 1 ? 5 : level === 2 ? rng.int(6, 8) : rng.int(8, 10);
      const { data, outlier } = makeData(rng, c, n, level);
      const dig = c.dig[level];
      const fx = x => fmtDec(x, dig);
      const px = x => (x.sign() < 0 ? "(" + fx(x) + ")" : fx(x)); // negative Werte in Klammern im Rechenschritt

      const sorted = [...data].sort((a, b) => a.cmp(b));
      const sum = data.reduce((s, v) => s.add(v), new Frac(0));
      const mean = sum.div(n);
      const range = sorted[n - 1].sub(sorted[0]);
      const med = n % 2 ? sorted[(n - 1) / 2] : sorted[n / 2 - 1].add(sorted[n / 2]).div(2);

      const list = rng.shuffle(data).map(fx).join("; ");
      const q = rich(c.intro(n), " ", list, ". ", ASK[level]);

      const steps = [rich("geordnet: ", sorted.map(fx).join("; "))];
      steps.push(rich("Summe: ", num(sum, { as: "dec" }), " : ", String(n), " = ", num(mean, { as: "dec" })));
      steps.push(rich("Spannweite: größter − kleinster Wert = ", px(sorted[n - 1]), " ", MINUS, " ", px(sorted[0]), " = ", num(range, { as: "dec" })));
      if (level >= 2) {
        if (n % 2) steps.push(rich("Zentralwert: der mittlere Wert ist ", fx(med)));
        else steps.push(rich("Zentralwert: (", px(sorted[n / 2 - 1]), " + ", px(sorted[n / 2]), ") : 2 = ", num(med, { as: "dec" })));
      }

      const U = c.unit;
      let a = rich(
        "Mittelwert ", num(mean, { as: "dec" }), U,
        "; Spannweite ", num(range, { as: "dec" }), U,
      );
      if (level >= 2) a = rich(a, "; Zentralwert ", num(med, { as: "dec" }), U);
      if (level === 3) {
        const up = outlier.cmp(mean) > 0;
        a = rich(
          a,
          `. Der Zentralwert ist aussagekräftiger, denn der Ausreißer ${fx(outlier)}${U} zieht den Mittelwert ${up ? "nach oben" : "nach unten"}.`,
        );
      }

      return { q, a, steps, check: { c, data, level, n, outlier } };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      // alles noch einmal aus den Rohdaten berechnen
      const d = [...k.data].sort((x, y) => x.cmp(y));
      const n = d.length;
      const mean = d.reduce((s, v) => s.add(v), new Frac(0)).div(n);
      const range = d[n - 1].sub(d[0]);
      const med = n % 2 ? d[(n - 1) / 2] : d[n / 2 - 1].add(d[n / 2]).div(2);
      const U = k.c.unit;
      const f = x => plain(num(x, { as: "dec" }));
      let base = `Mittelwert ${f(mean)}${U}; Spannweite ${f(range)}${U}`;
      if (level >= 2) base += `; Zentralwert ${f(med)}${U}`;
      const s = plain(t.a);
      if (!s.startsWith(base)) return `erwartet „${base}…“, steht „${s}“`;
      if (level === 1 && !mean.isInt()) return "Mittelwert nicht ganzzahlig";
      if (level === 2 && !mean.mul(10).isInt()) return "Mittelwert mit mehr als einer Nachkommastelle";
      if (level === 3) {
        if (!s.includes("Zentralwert ist aussagekräftiger")) return "Antwort zur Aussagekraft fehlt";
        if (!s.includes(`Ausreißer ${plain(fmtDec(k.outlier, k.c.dig[3]))}${U}`)) return "Ausreißer wird nicht konkret genannt";
      }
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
