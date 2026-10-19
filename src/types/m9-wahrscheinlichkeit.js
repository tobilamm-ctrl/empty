// M9 LB 6: Wahrscheinlichkeiten – Laplace-Wahrscheinlichkeit, Ereignis und Gegenereignis, zweistufige Experimente.
// Typen: m9-laplace, m9-gegenereignis, m9-zweistufig. Vorbild: m8-zufall.js (Glücksrad-Skizze).
(function (AG) {
  const { Frac, num, rich, plain, fmtDec } = AG;
  const PAL = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];
  const INK = "#1b2130";

  // ---------- Hilfen ----------
  const Q = s => "„" + s + "“";
  const joinList = items => (items.length > 1 ? items.slice(0, -1).join(", ") + " und " + items[items.length - 1] : String(items[0]));
  const isPrime = x => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
  // Prozentwert genau, wenn er höchstens zwei Nachkommastellen hat, sonst ≈ mit einer Nachkommastelle
  const exactPct = f => { const p = new Frac(f.n * 100, f.d); return p.decimals() <= 2 ? fmtDec(p) + " %" : null; };
  const approxPct = f => exactPct(f) || fmtDec(new Frac(Math.round((f.n * 1000) / f.d), 10), 1) + " %";
  // Wahrscheinlichkeit als Bruch mit Prozentwert („3/8 = 37,5 %“, „1/3 ≈ 33,3 %“)
  const chanceRich = f => rich(num(f), " " + (exactPct(f) ? "=" : "≈") + " " + approxPct(f));
  // Summe von Brüchen als Rich („9/64 + 25/64“)
  const plusRich = fs => fs.map((f, i) => (i ? rich(" + ", num(f)) : num(f)));
  const pairTxt = p => "(" + p[0] + "; " + p[1] + ")";
  const ONE_TO_SIX = [1, 2, 3, 4, 5, 6];
  const ONE_TO_TWENTY = Array.from({ length: 20 }, (_, i) => i + 1);

  // ---------- Farben, Felder, Glücksrad ----------
  const COLS = [
    { n: "blau", a: "blaue", c: PAL[0] }, { n: "grün", a: "grüne", c: PAL[1] },
    { n: "orange", a: "orange", c: PAL[2] }, { n: "lila", a: "lila", c: PAL[3] }, { n: "grau", a: "graue", c: PAL[4] },
  ];
  // Farbe col mit c Elementen, die übrigen Farben (1 bis 3) mit je mindestens 1
  function colorSet(rng, total, col, c) {
    const rest = total - c;
    const others = rng.shuffle(COLS.filter(x => x !== col)).slice(0, Math.min(rest, rng.int(1, 3)));
    const cnt = others.map(() => 1);
    for (let r = rest - others.length; r > 0; r--) cnt[rng.int(0, cnt.length - 1)]++;
    return { cols: [col, ...others], cnt: [c, ...cnt] };
  }
  const colsTxt = W => joinList(W.cols.map((x, i) => W.cnt[i] + " " + x.a));
  // Farbindex je Feld in zufälliger Reihenfolge
  function sectorsOf(rng, cnt) {
    const seq = [];
    cnt.forEach((c, i) => { for (let r = 0; r < c; r++) seq.push(i); });
    return rng.shuffle(seq);
  }
  // Felder ab 12 Uhr im Uhrzeigersinn
  function drawWheel(s, cx, cy, r, cols, sectors) {
    const n = sectors.length, step = (2 * Math.PI) / n, a0 = -Math.PI / 2;
    sectors.forEach((ci, i) => {
      const a = a0 + i * step, b = a + step;
      const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const p1 = [cx + r * Math.cos(b), cy + r * Math.sin(b)];
      s.path(`M${cx},${cy} L${p0[0]},${p0[1]} A${r},${r} 0 0,1 ${p1[0]},${p1[1]} Z`, { fill: cols[ci].c });
    });
  }
  function wheelFig(W, sectors) {
    const s = AG.sketch(70, 46);
    drawWheel(s, 35, 23, 15, W.cols, sectors);
    return s.done();
  }

  // ---------- 1. Laplace-Wahrscheinlichkeit ----------
  const DICE_EV = [
    { t: "eine gerade Zahl", ok: x => x % 2 === 0 },
    { t: "eine ungerade Zahl", ok: x => x % 2 === 1 },
    { t: "eine Primzahl", ok: x => isPrime(x) },
    { t: "eine Zahl größer als 4", ok: x => x > 4 },
    { t: "eine Zahl kleiner als 3", ok: x => x < 3 },
    { t: "eine durch 3 teilbare Zahl", ok: x => x % 3 === 0 },
    { t: "eine 6", ok: x => x === 6 },
    { t: "eine Quadratzahl", ok: x => x === 1 || x === 4 },
  ];
  const CARD_EV = [
    { t: "eine gerade Zahl", ok: x => x % 2 === 0 },
    { t: "eine Primzahl", ok: x => isPrime(x) },
    { t: "eine durch 3 teilbare Zahl", ok: x => x % 3 === 0 },
    { t: "eine Zahl größer als 15", ok: x => x > 15 },
    { t: "eine Quadratzahl", ok: x => [1, 4, 9, 16].includes(x) },
    { t: "eine Zahl mit zwei Ziffern", ok: x => x >= 10 },
  ];
  const WORDS = ["MATHEMATIK", "SCHULE", "BAYERN", "MITTELSCHULE", "ZAHLEN", "PROZENT", "WAHRSCHEINLICH", "KREIS", "BRUCH"];
  // Umkehraufgaben mit glattem Prozentsatz: n · p : 100 = k (ganzzahlig, 1 ≤ k ≤ n − 1)
  const UMK = [];
  for (const n of [20, 25, 30, 40, 50, 60]) {
    for (const p of [5, 10, 20, 25, 30, 40, 60, 75, 80]) {
      if ((n * p) % 100 === 0 && n * p / 100 >= 1 && n * p / 100 <= n - 1) UMK.push([n, p, n * p / 100]);
    }
  }

  // Aufgabe mit fav günstigen von tot möglichen Ergebnissen; pre: Schritt mit den günstigen Ergebnissen
  function lapTask(q, fav, tot, pre, fig) {
    const f = new Frac(fav, tot);
    const out = {
      q: rich(q, " Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(f),
      steps: [pre, rich("P(E) = ", num(fav), " : ", num(tot), " = ", chanceRich(f))],
      inline: false, meta: { kind: "lap", fav, tot },
    };
    if (fig) out.fig = fig;
    return out;
  }
  function lapDice(rng, level) {
    const pool = DICE_EV.filter(e => level !== 1 || ONE_TO_SIX.filter(e.ok).length === 3);
    const E = rng.pick(pool);
    const list = ONE_TO_SIX.filter(E.ok);
    return lapTask(rich("Ein Würfel wird einmal geworfen. Ereignis E: Es fällt ", E.t, "."), list.length, 6,
      rich("günstige Ergebnisse: ", list.join(", "), " → ", num(list.length)));
  }
  function lapCards(rng) {
    const E = rng.pick(CARD_EV);
    const list = ONE_TO_TWENTY.filter(E.ok);
    return lapTask(rich("In einem Stapel liegen 20 Karten mit den Zahlen 1 bis 20, jede Zahl auf genau einer Karte. " +
      "Man zieht ohne Hinzuschauen eine Karte. Ereignis E: Auf der Karte steht ", E.t, "."), list.length, 20,
      rich("günstige Karten: ", list.join(", "), " → ", num(list.length)));
  }
  // Jeder Buchstabe des Wortes steht auf einer eigenen Karte
  function lapWord(rng) {
    const w = rng.pick(WORDS), L = [...w];
    const kind = rng.pick(["vokal", "konsonant", "buchstabe"]);
    let E;
    if (kind === "vokal") E = { t: "ein Vokal (A, E, I, O oder U)", ok: ch => "AEIOU".includes(ch) };
    else if (kind === "konsonant") E = { t: "ein Konsonant", ok: ch => !"AEIOU".includes(ch) };
    else { const x = rng.pick(L); E = { t: "der Buchstabe " + Q(x), ok: ch => ch === x }; }
    const list = L.filter(E.ok);
    return lapTask(rich("Aus dem Wort ", Q(w), " wird ein Buchstabe zufällig ausgewählt. Jeder Buchstabe steht auf einer eigenen Karte, " +
      "die Karten sind gut gemischt. Ereignis E: Es wird ", E.t, " gezogen."), list.length, L.length,
      rich("günstige Buchstaben: ", list.join(", "), " → ", num(list.length)));
  }
  function lapUrn(rng, exact) {
    const T = exact ? rng.pick([10, 20, 25, 40, 50]) : rng.pick([6, 8, 12, 15]);
    const col = rng.pick(COLS), c = rng.int(1, T - 1);
    const W = colorSet(rng, T, col, c);
    return lapTask(rich("In einer Urne sind ", num(T), " Kugeln: ", colsTxt(W), ". Man zieht ohne Hinzuschauen eine Kugel. " +
      "Ereignis E: Die Kugel ist ", Q(col.n), "."), c, T,
      rich("günstige Kugeln: ", num(c), c === 1 ? " Kugel " : " Kugeln ", Q(col.n), " → ", num(c)));
  }
  function lapWheel(rng, exact) {
    const n = exact ? rng.pick([4, 5, 8, 10]) : rng.pick([6, 8, 12]);
    const col = rng.pick(COLS), c = rng.int(1, n - 1);
    const W = colorSet(rng, n, col, c);
    const sectors = sectorsOf(rng, W.cnt);
    return lapTask(rich("Ein Glücksrad hat ", num(n), " gleich große Felder: ", colsTxt(W), ". Man dreht das Glücksrad einmal. " +
      "Ereignis E: Der Zeiger bleibt auf ", Q(col.n), " stehen."), c, n,
      rich("günstige Felder: ", num(c), c === 1 ? " Feld " : " Felder ", Q(col.n), " → ", num(c)), wheelFig(W, sectors));
  }
  // Umkehraufgabe: Wahrscheinlichkeit gegeben, Anzahl der günstigen Ergebnisse gesucht
  function lapUmkehr(rng) {
    const [n, p, k] = rng.pick(UMK);
    const wheel = n <= 20 && rng.chance(0.5);   // Glücksräder höchstens 20 Felder
    const pf = new Frac(p, 100);
    const pTxt = fmtDec(p) + " %";
    const noun = wheel ? "grüne Felder" : "rote Kugeln";
    const q = wheel
      ? rich("Ein Glücksrad hat ", num(n), " gleich große Felder. Die Wahrscheinlichkeit, dass der Zeiger auf Grün stehen bleibt, beträgt ",
        pTxt, ". Wie viele grüne Felder hat das Glücksrad?")
      : rich("In einer Urne liegen ", num(n), " Kugeln, rote und weiße. Man zieht ohne Hinzuschauen eine Kugel. Die Wahrscheinlichkeit, " +
        "eine rote Kugel zu ziehen, beträgt ", pTxt, ". Wie viele rote Kugeln liegen in der Urne?");
    return {
      q, a: rich(num(k), " ", noun),
      steps: [rich("k : ", num(n), " = ", num(pf)), rich("k = ", num(pf), " · ", num(n), " = ", num(k))],
      inline: false, meta: { kind: "umk", want: k + " " + noun },
    };
  }

  AG.registerType({
    id: "m9-laplace",
    klasse: "9",
    zug: "RM",
    lb: "6",
    lbTitle: "Wahrscheinlichkeiten",
    title: "Laplace-Wahrscheinlichkeit",
    topic: "daten",
    instruction: {
      1: "Berechne die Wahrscheinlichkeit P(E). Gib sie als gekürzten Bruch und in Prozent an.",
      2: "Berechne die Wahrscheinlichkeit P(E). Gib sie als gekürzten Bruch und in Prozent an. Prozentwerte mit ≈ sind auf eine Nachkommastelle gerundet.",
      3: "Berechne die fehlende Anzahl. Nutze die Wahrscheinlichkeit.",
    },
    merke: [
      "Laplace-Regel (alle Ergebnisse gleich wahrscheinlich): P(E) = günstige Ergebnisse : mögliche Ergebnisse. ",
      "Beispiel: Würfel, Ereignis „gerade Zahl“: 3 : 6 = ", { f: [1, 2] }, " = 50 %.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 3) return lapUmkehr(rng);
      const kind = rng.pick(level === 1 ? ["dice", "cards", "urn", "wheel"] : ["dice", "cards", "word", "urn", "wheel"]);
      if (kind === "dice") return lapDice(rng, level);
      if (kind === "cards") return lapCards(rng);
      if (kind === "word") return lapWord(rng);
      if (kind === "urn") return lapUrn(rng, level === 1);
      return lapWheel(rng, level === 1);
    },
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      if (m.kind === "umk") return plain(t.a) === m.want ? true : "Lösung falsch: " + plain(t.a);
      if (!(m.fav >= 1 && m.fav < m.tot)) return "Anzahl günstiger Ergebnisse unplausibel";
      return plain(t.a) === plain(chanceRich(new Frac(m.fav, m.tot))) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });

  // ---------- 2. Ereignis und Gegenereignis ----------
  // Ereignis E und Gegenereignis (c) in Worten; ok prüft die Zahlen 1 bis 6 bzw. 1 bis 20
  const DICE_G = [
    { t: "eine gerade Zahl", c: "eine ungerade Zahl", ok: x => x % 2 === 0 },
    { t: "eine Primzahl", c: "keine Primzahl", ok: x => isPrime(x) },
    { t: "eine Zahl größer als 4", c: "eine Zahl kleiner oder gleich 4", ok: x => x > 4 },
    { t: "eine durch 3 teilbare Zahl", c: "eine Zahl, die nicht durch 3 teilbar ist", ok: x => x % 3 === 0 },
    { t: "eine 6", c: "keine 6", ok: x => x === 6 },
    { t: "eine Zahl kleiner als 3", c: "eine Zahl größer oder gleich 3", ok: x => x < 3 },
  ];
  const CARD_G = [
    { t: "eine gerade Zahl", c: "eine ungerade Zahl", ok: x => x % 2 === 0 },
    { t: "eine Primzahl", c: "keine Primzahl", ok: x => isPrime(x) },
    { t: "eine durch 4 teilbare Zahl", c: "eine Zahl, die nicht durch 4 teilbar ist", ok: x => x % 4 === 0 },
    { t: "eine Zahl größer als 15", c: "eine Zahl kleiner oder gleich 15", ok: x => x > 15 },
  ];

  // Ereignis E mit Gegenereignis; Schritte und Lösung je nach Niveau
  function gegenBasic(rng, level) {
    const kind = rng.pick(["dice", "cards", "urn"]);
    let setup, pre, e, tot, fav;
    if (kind === "dice") {
      e = rng.pick(DICE_G); setup = "Ein Würfel wird einmal geworfen."; pre = "Es fällt ";
      tot = 6; fav = ONE_TO_SIX.filter(e.ok).length;
    } else if (kind === "cards") {
      e = rng.pick(CARD_G); pre = "Auf der Karte steht "; tot = 20; fav = ONE_TO_TWENTY.filter(e.ok).length;
      setup = "In einem Stapel liegen die Karten 1 bis 20, jede Zahl auf genau einer Karte. Eine Karte wird ohne Hinzuschauen gezogen.";
    } else {
      const T = rng.pick([8, 10, 12, 15, 20]), col = rng.pick(COLS), c = rng.int(1, T - 1);
      const W = colorSet(rng, T, col, c);
      setup = "In einer Urne sind " + T + " Kugeln: " + colsTxt(W) + ". Man zieht ohne Hinzuschauen eine Kugel.";
      pre = "Die Kugel ist "; tot = T; fav = c;
      e = { t: Q(col.n), c: "nicht " + Q(col.n) };
    }
    const PE = new Frac(fav, tot), PG = new Frac(tot - fav, tot);
    const Ev = pre + e.t, Gv = pre + e.c;
    const stepPE = rich("P(E) = ", num(fav), " : ", num(tot), " = ", num(PE));
    const stepPG = rich("P(nicht E) = 1 − ", num(PE), " = ", chanceRich(PG));
    if (level === 1) {
      return {
        q: rich(setup, " Ereignis E: ", Ev, ". Wie groß ist die Wahrscheinlichkeit des Gegenereignisses „nicht E“?"),
        a: chanceRich(PG), steps: [stepPE, stepPG], inline: false, meta: { kind: "gegen", n: PG.n, d: PG.d },
      };
    }
    return {
      q: rich(setup, " Ereignis E: ", Ev, ". Formuliere das Gegenereignis in einem Satz und berechne seine Wahrscheinlichkeit."),
      a: rich(Gv, ": ", chanceRich(PG)),
      steps: [rich("Gegenereignis: ", Gv), stepPE, stepPG], inline: false, meta: { kind: "gegen", n: PG.n, d: PG.d },
    };
  }
  // „mindestens“- und „höchstens“-Fragen bei einem Wurf bzw. einer Karte
  function gegenMind(rng) {
    const cards = rng.chance(0.5), T = cards ? 20 : 6;
    const setup = cards
      ? "In einem Stapel liegen die Karten 1 bis 20, jede Zahl auf genau einer Karte. Eine Karte wird ohne Hinzuschauen gezogen."
      : "Ein Würfel wird einmal geworfen.";
    const obj = cards ? "Die Zahl auf der Karte ist " : "Die Augenzahl ist ";
    const up = rng.chance(0.5);
    const x = up ? rng.int(2, T) : rng.int(1, T - 1);
    const fav = up ? T - x + 1 : x;
    const Ev = obj + (up ? "mindestens " : "höchstens ") + x;
    const Gv = obj + (up ? "höchstens " + (x - 1) : "mindestens " + (x + 1));
    const PE = new Frac(fav, T), PG = new Frac(T - fav, T);
    return {
      q: rich(setup, " Ereignis E: ", Ev, ". Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(PE),
      steps: [
        rich("Gegenereignis: ", Gv),
        rich("P(nicht E) = ", num(T - fav), " : ", num(T), " = ", num(PG)),
        rich("P(E) = 1 − ", num(PG), " = ", chanceRich(PE)),
      ],
      inline: false, meta: { kind: "gegen", n: PE.n, d: PE.d },
    };
  }

  AG.registerType({
    id: "m9-gegenereignis",
    klasse: "9",
    zug: "RM",
    lb: "6",
    lbTitle: "Wahrscheinlichkeiten",
    title: "Ereignis und Gegenereignis",
    topic: "daten",
    instruction: {
      1: "Berechne die Wahrscheinlichkeit des Gegenereignisses „nicht E“. Gib sie als gekürzten Bruch und in Prozent an.",
      2: "Formuliere das Gegenereignis in einem Satz und berechne seine Wahrscheinlichkeit. Gib sie als gekürzten Bruch und in Prozent an.",
      3: "Berechne P(E) über das Gegenereignis. Gib das Ergebnis als gekürzten Bruch und in Prozent an.",
    },
    merke: [
      "P(nicht E) = 1 − P(E). Das Gegenereignis „nicht E“ tritt genau dann ein, wenn E nicht eintritt. ",
      "Beispiel: P(E) = ", { f: [1, 3] }, ", also P(nicht E) = 1 − ", { f: [1, 3] }, " = ", { f: [2, 3] }, " ≈ 66,7 %. ",
      "„Mindestens 4“ ist das Gegenereignis von „höchstens 3“.",
    ],
    cols: 2,
    generate(rng, level) {
      return level === 3 ? gegenMind(rng) : gegenBasic(rng, level);
    },
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      return plain(t.a).includes(plain(chanceRich(new Frac(m.n, m.d)))) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });

  // ---------- 3. Zweistufige Experimente ----------
  // Zwei Würfel: Ergebnisse als Paare (erster Würfel; zweiter Würfel), 6 · 6 = 36
  const PAIRS = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) PAIRS.push([a, b]);
  const SUM_BASIC = [];
  for (let s = 2; s <= 12; s++) SUM_BASIC.push({ t: "Die Augensumme ist " + s, ok: ([a, b]) => a + b === s });
  const PASCH = { t: "Beide Augenzahlen sind gleich (Pasch)", ok: ([a, b]) => a === b };
  const SUM_EXTRA = [
    { t: "Die Augensumme ist mindestens 10", ok: ([a, b]) => a + b >= 10 },
    { t: "Die Augensumme ist höchstens 4", ok: ([a, b]) => a + b <= 4 },
    { t: "Die Augensumme ist höchstens 5", ok: ([a, b]) => a + b <= 5 },
    { t: "Die Augensumme ist mindestens 11", ok: ([a, b]) => a + b >= 11 },
    { t: "Die Augensumme ist 7 oder 11", ok: ([a, b]) => a + b === 7 || a + b === 11 },
    { t: "Die Augensumme ist 2 oder 12", ok: ([a, b]) => a + b === 2 || a + b === 12 },
    PASCH,
  ];
  // Stufe 1: einfachere Ereignisse mit höchstens 10 Paaren (sonst zu lange Lösungsschritte)
  const DICE_L1 = SUM_BASIC.concat([
    PASCH,
    { t: "Die Augensumme ist mindestens 10", ok: ([a, b]) => a + b >= 10 },
    { t: "Die Augensumme ist mindestens 11", ok: ([a, b]) => a + b >= 11 },
    { t: "Die Augensumme ist höchstens 3", ok: ([a, b]) => a + b <= 3 },
    { t: "Die Augensumme ist höchstens 4", ok: ([a, b]) => a + b <= 4 },
    { t: "Die Augensumme ist höchstens 5", ok: ([a, b]) => a + b <= 5 },
    { t: "Die Augensumme ist 2 oder 12", ok: ([a, b]) => a + b === 2 || a + b === 12 },
    { t: "Die Augensumme ist 3 oder 11", ok: ([a, b]) => a + b === 3 || a + b === 11 },
    { t: "Die Augensumme ist 4 oder 10", ok: ([a, b]) => a + b === 4 || a + b === 10 },
    { t: "Die Augensumme ist 5 oder 9", ok: ([a, b]) => a + b === 5 || a + b === 9 },
    { t: "Die Augensumme ist 6 oder 8", ok: ([a, b]) => a + b === 6 || a + b === 8 },
    { t: "Die Augensumme ist 7 oder 11", ok: ([a, b]) => a + b === 7 || a + b === 11 },
    { t: "Die erste Augenzahl ist eine 6", ok: ([a]) => a === 6 },
    { t: "Die zweite Augenzahl ist eine 1", ok: ([, b]) => b === 1 },
    { t: "Mindestens eine Augenzahl ist eine 6", ok: ([a, b]) => a === 6 || b === 6 },
    { t: "Mindestens eine Augenzahl ist eine 1", ok: ([a, b]) => a === 1 || b === 1 },
    { t: "Beide Augenzahlen sind gerade", ok: ([a, b]) => a % 2 === 0 && b % 2 === 0 },
    { t: "Beide Augenzahlen sind ungerade", ok: ([a, b]) => a % 2 === 1 && b % 2 === 1 },
    { t: "Beide Augenzahlen sind größer als 4", ok: ([a, b]) => a > 4 && b > 4 },
    { t: "Beide Augenzahlen sind kleiner als 3", ok: ([a, b]) => a < 3 && b < 3 },
    { t: "Die Augenzahlen unterscheiden sich um 1", ok: ([a, b]) => Math.abs(a - b) === 1 },
  ]);

  // Zwei Würfel (Ergebnistabelle 6 × 6 in den Schritten)
  function diceTask(rng, level) {
    const pool = level === 1 ? DICE_L1 : SUM_EXTRA;
    const E = rng.pick(pool);
    const list = PAIRS.filter(E.ok);
    const f = new Frac(list.length, 36);
    return {
      q: rich("Zwei Würfel werden gleichzeitig geworfen. Ein Ergebnis ist ein Paar (erster Würfel; zweiter Würfel). " +
        "Ereignis E: ", E.t, ". Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(f),
      steps: [
        rich("Ergebnistabelle: 6 · 6 = ", num(36), " mögliche Ergebnisse"),
        rich("günstige Ergebnisse: ", list.map(pairTxt).join(", "), " → ", num(list.length)),
        rich("P(E) = ", num(list.length), " : 36 = ", chanceRich(f)),
      ],
      inline: false, meta: { kind: "dice", n: f.n, d: f.d },
    };
  }

  // Münzen (zwei Münzen bzw. Münze und Würfel) durch Abzählen aller Ergebnisse
  const COIN_OUT = ["WW", "WZ", "ZW", "ZZ"];
  const COIN_EV = [
    { t: "Zweimal Wappen", ok: o => o === "WW" },
    { t: "Zweimal Zahl", ok: o => o === "ZZ" },
    { t: "Genau einmal Wappen", ok: o => o === "WZ" || o === "ZW" },
    { t: "Zweimal dieselbe Seite", ok: o => o[0] === o[1] },
    { t: "Mindestens einmal Wappen", ok: o => o.includes("W") },
    { t: "Verschiedene Seiten", ok: o => o[0] !== o[1] },
    { t: "Mindestens einmal Zahl", ok: o => o.includes("Z") },
  ];
  const COINDIE_OUT = [];
  for (const s of ["W", "Z"]) for (let x = 1; x <= 6; x++) COINDIE_OUT.push(s + x);
  const COINDIE_EV = [
    { t: "Wappen und eine gerade Zahl", ok: o => o[0] === "W" && Number(o[1]) % 2 === 0 },
    { t: "Zahl und eine 6", ok: o => o === "Z6" },
    { t: "Wappen und eine Zahl größer als 4", ok: o => o[0] === "W" && Number(o[1]) > 4 },
    { t: "Zahl und eine ungerade Zahl", ok: o => o[0] === "Z" && Number(o[1]) % 2 === 1 },
    { t: "Wappen und eine Primzahl", ok: o => o[0] === "W" && isPrime(Number(o[1])) },
    { t: "Zahl und eine Zahl kleiner als 3", ok: o => o[0] === "Z" && Number(o[1]) < 3 },
    { t: "Wappen und eine 6", ok: o => o === "W6" },
    { t: "Zahl und eine gerade Zahl", ok: o => o[0] === "Z" && Number(o[1]) % 2 === 0 },
    { t: "Wappen und eine Zahl kleiner als 3", ok: o => o[0] === "W" && Number(o[1]) < 3 },
    { t: "Zahl und eine Primzahl", ok: o => o[0] === "Z" && isPrime(Number(o[1])) },
  ];
  function rTask(rng, level) {
    const dieKind = level === 3 ? true : rng.chance(0.5);
    const coinPool = level === 1 ? COIN_EV.slice(0, 5) : level === 2 ? COIN_EV.slice(4) : COIN_EV;
    const diePool = level === 1 ? COINDIE_EV.slice(0, 4).concat(COINDIE_EV.slice(6, 8))
      : level === 2 ? COINDIE_EV.slice(4, 6).concat(COINDIE_EV.slice(8)) : COINDIE_EV;
    const E = rng.pick(dieKind ? diePool : coinPool);
    const outs = dieKind ? COINDIE_OUT : COIN_OUT;
    const list = outs.filter(E.ok);
    const f = new Frac(list.length, outs.length);
    const setup = dieKind
      ? "Eine Münze wird geworfen und gleichzeitig ein Würfel. (W = Wappen, Z = Zahl)"
      : "Zwei Münzen werden gleichzeitig geworfen. (W = Wappen, Z = Zahl)";
    return {
      q: rich(setup, " Ereignis E: ", E.t, ". Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(f),
      steps: [
        rich("Alle Ergebnisse: ", outs.join(", "), " → ", num(outs.length)),
        rich("günstige Ergebnisse: ", list.join(", "), " → ", num(list.length)),
        rich("P(E) = ", num(list.length), " : ", num(outs.length), " = ", chanceRich(f)),
      ],
      inline: false, meta: { kind: "coin", n: f.n, d: f.d },
    };
  }

  // Baumdiagramm: Äste mit Beschriftung „R: 3/8“, Pfadenden mit den Ergebnissen
  function treeFig(first, second) {
    const W = 118, H = 60;
    const s = AG.sketch(W, H);
    const root = [6, H / 2];
    const mids = [[40, 15], [40, 45]];
    const leaves = [[[102, 7], [102, 23]], [[102, 37], [102, 53]]];
    const branch = (a, b, text, off) => {
      s.line(a, b);
      const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
      s.label([x, y + (b[1] < a[1] ? -off : off)], text);
    };
    s.circle(root, 0.9, { fill: INK });
    first.forEach((br, i) => {
      branch(root, mids[i], br.l + ": " + br.p, 5);
      s.circle(mids[i], 0.9, { fill: INK });
    });
    second.forEach((row, i) => row.forEach((br, j) => {
      branch(mids[i], leaves[i][j], br.l + ": " + br.p, 3.4);
      s.label([leaves[i][j][0] + 3.5, leaves[i][j][1]], first[i].l + br.l, { anchor: "start" });
    }));
    return s.done();
  }
  // Urne mit zwei Zügen: mit Zurücklegen (mit) bzw. ohne Zurücklegen
  function treeTask(rng, mit) {
    const T = rng.pick([6, 8, 10, 12]);
    const r = rng.int(mit ? 1 : 2, T - (mit ? 1 : 2)), b = T - r;
    const L = ["R", "B"];
    const first = [new Frac(r, T), new Frac(b, T)];
    const cond = mit
      ? [[new Frac(r, T), new Frac(b, T)], [new Frac(r, T), new Frac(b, T)]]
      : [[new Frac(r - 1, T - 1), new Frac(b, T - 1)], [new Frac(r, T - 1), new Frac(b - 1, T - 1)]];
    const paths = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      paths.push({ n: L[i] + L[j], p1: first[i], p2: cond[i][j], p: first[i].mul(cond[i][j]) });
    }
    const EV = [
      { t: "Zwei rote Kugeln", names: ["RR"] },
      { t: "Zwei blaue Kugeln", names: ["BB"] },
      { t: "Genau eine rote Kugel", names: ["RB", "BR"] },
      { t: "Zwei Kugeln mit gleicher Farbe", names: ["RR", "BB"] },
      { t: "Mindestens eine rote Kugel", names: ["RR", "RB", "BR"] },
      { t: "Mindestens eine blaue Kugel", names: ["BB", "RB", "BR"] },
    ];
    const E = rng.pick(EV);
    const sel = paths.filter(x => E.names.includes(x.n));
    const f = sel.reduce((acc, x) => acc.add(x.p), new Frac(0));
    const steps = sel.map(x => rich("Pfad ", x.n, ": ", num(x.p1), " · ", num(x.p2), " = ", num(x.p)));
    steps.push(sel.length > 1
      ? rich("P(E) = ", plusRich(sel.map(x => x.p)), " = ", chanceRich(f))
      : rich("P(E) = ", chanceRich(f)));
    const intro = `In einer Urne sind ${T} Kugeln: ${r} rote und ${b} blaue. Ein Kind zieht zweimal nacheinander eine Kugel ` +
      (mit ? "und legt sie nach dem ersten Zug wieder zurück. " : "und legt sie nicht zurück. ");
    const fig = treeFig(
      first.map((p, i) => ({ l: L[i], p: plain(num(p)) })),
      cond.map((row, i) => row.map((p, j) => ({ l: L[j], p: plain(num(p)) }))),
    );
    return {
      q: rich(intro, "(R: rote Kugel, B: blaue Kugel) Das Baumdiagramm zeigt die Wahrscheinlichkeiten. Ereignis E: ", E.t,
        ". Wie groß ist die Wahrscheinlichkeit P(E)?"),
      a: chanceRich(f), steps, fig, inline: false,
      meta: { kind: "tree", n: f.n, d: f.d, sumAll: paths.reduce((acc, x) => acc.add(x.p), new Frac(0)).eq(1) },
    };
  }

  AG.registerType({
    id: "m9-zweistufig",
    klasse: "9",
    zug: "RM",
    lb: "6",
    lbTitle: "Wahrscheinlichkeiten",
    title: "Zweistufige Zufallsexperimente",
    topic: "daten",
    instruction: {
      1: "Berechne die Wahrscheinlichkeit P(E). Zähle alle Ergebnisse ab und gib das Ergebnis als gekürzten Bruch und in Prozent an.",
      2: "Berechne die Wahrscheinlichkeit P(E). Nutze das Baumdiagramm bzw. die Ergebnisse. Gib das Ergebnis als gekürzten Bruch und in Prozent an.",
      3: "Berechne die Wahrscheinlichkeit P(E) mit dem Baumdiagramm. Multipliziere entlang der Pfade und addiere die Pfade des Ereignisses. Gib das Ergebnis als gekürzten Bruch und in Prozent an.",
    },
    merke: [
      "Pfadregeln: Entlang eines Pfades werden die Wahrscheinlichkeiten ", { b: "multipliziert" },
      ", die Pfade eines Ereignisses werden ", { b: "addiert" }, ". Beispiel (zwei Münzen, genau einmal Wappen): ",
      { f: [1, 2] }, " · ", { f: [1, 2] }, " + ", { f: [1, 2] }, " · ", { f: [1, 2] }, " = ", { f: [1, 2] }, ".",
    ],
    cols: 1,
    generate(rng, level, ctx) {
      const zug = ctx && ctx.zug === "R" ? "R" : "M";
      let t;
      if (zug === "R") t = rTask(rng, level);
      else if (level === 1) t = diceTask(rng, 1);
      else if (level === 2) t = rng.chance(0.5) ? diceTask(rng, 2) : treeTask(rng, true);
      else t = treeTask(rng, false);
      t.meta = { ...t.meta, zug };
      return t;
    },
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      if (m.zug === "R" && m.kind === "tree") return "Baumdiagramm im R-Zug";
      if (m.kind === "tree" && !m.sumAll) return "Pfadwahrscheinlichkeiten summieren sich nicht zu 1";
      return plain(t.a) === plain(chanceRich(new Frac(m.n, m.d))) ? true : "Lösung stimmt nicht: " + plain(t.a);
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
