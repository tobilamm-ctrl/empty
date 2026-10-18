// M5 LB 1.1 (Der Zahlenraum über eine Milliarde hinaus): Großzahlen lesen und schreiben, Zahlen
// vergleichen und ordnen, Zahlenfolgen fortsetzen, Runden, Zahlenstrahl und Diagramme ablesen.
// Mit Skizzen (AG.sketch) und Stellenwerttafel (table mit Lücken).
(function (AG) {
  const { rich, fmtInt, plain } = AG;
  const MI = AG.MINUS;
  const KL = "5", ZUG = "RM", LB = "1.1", LBT = "Der Zahlenraum über eine Milliarde hinaus", TOPIC = "zahlen";
  const COLORS = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];

  // ---------- Hilfen ----------
  const fmt = n => fmtInt(n);            // Tausenderleerzeichen ab 5 Stellen
  const t = x => String(x);              // Zahl als Text für rich(...)
  // zufällige Zahl mit k Stellen (erste Stelle ≠ 0); zeroP: Anteil der Nullen in den übrigen Stellen
  function randNum(rng, k, zeroP = 0) {
    let s = t(rng.int(1, 9));
    for (let i = 1; i < k; i++) s += rng.chance(zeroP) ? "0" : t(rng.int(0, 9));
    return Number(s);
  }
  const digitAt = (n, p) => Math.floor(n / 10 ** p) % 10;
  // Stellennamen, Index = Zehnerpotenz (E = Einer … Mrd = Milliarden)
  const PL = ["E", "Z", "H", "T", "ZT", "HT", "M", "ZM", "HM", "Mrd"];

  // ---------- Zahlwörter (Duden: Zahlwort klein, „Million“, „Milliarde“, „Billion“ als Nomen groß und getrennt) ----------
  const ONES = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const ONES_C = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]; // in Zusammensetzungen
  const TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  const UNITS = [[1e12, "Billion", "Billionen"], [1e9, "Milliarde", "Milliarden"], [1e6, "Million", "Millionen"]];

  // 0–99
  function w2(x) {
    if (x < 10) return ONES[x];
    if (x < 20) return TEENS[x - 10];
    const o = x % 10, z = Math.floor(x / 10);
    return o === 0 ? TENS[z] : ONES_C[o] + "und" + TENS[z];
  }
  // 0–999. mode: "end" = letzte Gruppe, "comp" = vor „tausend“, "mio" = vor „Million“ o. Ä.
  function w3(x, mode) {
    if (!x) return "";
    const h = Math.floor(x / 100), r = x % 100;
    let s = "";
    if (h === 1) s = mode === "comp" || (mode === "mio" && r === 0) ? "hundert" : "einhundert";
    else if (h > 1) s = ONES[h] + "hundert";
    if (!r) return s;
    return s + (r === 1 && mode === "comp" ? "ein" : w2(r));
  }
  // 0–999 999 als ein Wort (Tausender und Einer zusammen)
  function w6(x) {
    if (!x) return "";
    const th = Math.floor(x / 1000), o = x % 1000;
    const pre = th === 0 ? "" : th === 1 ? "eintausend" : w3(th, "comp") + "tausend";
    return pre + w3(o, "end");
  }
  // Gruppen einer Zahl: { v: Wert der Gruppe, words }
  function parts(n) {
    const out = [];
    for (const u of UNITS) {
      const g = Math.floor(n / u[0]) % 1000;
      if (g) out.push({ v: g * u[0], words: g === 1 ? "eine " + u[1] : w3(g, "mio") + " " + u[2] });
    }
    if (n % 1e6) out.push({ v: n % 1e6, words: w6(n % 1e6) });
    return out;
  }
  const words = n => parts(n).map(p => p.words).join(" ");

  // Zahlwort → Zahl (Gegenprobe für verify)
  const SMALL = { eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
    zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18,
    neunzehn: 19, zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  function p2(w) {
    if (w === "") return 0;
    if (SMALL[w] !== undefined) return SMALL[w];
    const i = w.indexOf("und");
    if (i < 0) throw new Error("Zahlwort unbekannt: " + w);
    return SMALL[w.slice(0, i)] + SMALL[w.slice(i + 3)];
  }
  function p3(w) {
    if (w === "") return 0;
    const i = w.indexOf("hundert");
    if (i < 0) return p2(w);
    const hp = w.slice(0, i);
    return (hp === "" ? 1 : SMALL[hp]) * 100 + p2(w.slice(i + 7));
  }
  function p6(w) {
    if (w === "") return 0;
    const i = w.indexOf("tausend");
    if (i < 0) return p3(w);
    return p3(w.slice(0, i)) * 1000 + p3(w.slice(i + 7));
  }
  function parseWords(s) {
    let total = 0, pend = [];
    for (const tk of s.split(" ")) {
      const u = UNITS.find(x => x[1] === tk || x[2] === tk);
      if (u) { total += p6(pend.join("")) * u[0]; pend = []; }
      else pend.push(tk);
    }
    return total + p6(pend.join(""));
  }

  // ---------- Stellenwerttafel ----------
  const ORDER = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];   // Spalten von links (Mrd) nach rechts (E)

  // ---------- Vergleichen und Ordnen ----------
  // Begründung für lo < hi: an der ersten verschiedenen Stelle von links
  function reasonText(lo, hi) {
    const sl = t(lo), sh = t(hi);
    if (sl.length !== sh.length) return "die kleinere Zahl hat weniger Stellen";
    const i = [...sl].findIndex((c, j) => c !== sh[j]);
    return "an der Stelle " + PL[sl.length - 1 - i] + " ist " + sl[i] + " kleiner als " + sh[i];
  }
  // Zahl mit einer oder zwei geänderten Ziffern (ähnliche Ziffern)
  function variant(base, rng) {
    const s = t(base).split("");
    const c = rng.int(1, 2);
    for (let j = 0; j < c; j++) {
      const i = rng.int(0, s.length - 1);
      s[i] = t(i === 0 ? rng.int(1, 9) : rng.int(0, 9));
    }
    return Number(s.join(""));
  }
  // zwei Ziffern vertauschen (Fallen wie 1 090 000 und 1 009 000)
  function swapDigits(base, rng) {
    const s = t(base).split("");
    for (let k = 0; k < 30; k++) {
      const i = rng.int(0, s.length - 1), j = rng.int(0, s.length - 1);
      if (s[i] === s[j]) continue;
      const u = s.slice();
      [u[i], u[j]] = [u[j], u[i]];
      if (u[0] !== "0") return Number(u.join(""));
    }
    return variant(base, rng);
  }
  function makeSet(rng, level, cnt) {
    for (let tries = 0; tries < 300; tries++) {
      const k = level === 1 ? rng.int(4, 6) : level === 2 ? rng.int(6, 9) : rng.int(7, 10);
      const base = randNum(rng, k, level === 3 ? 0.3 : 0);
      const set = [base];
      let guard = 0;
      while (set.length < cnt && guard++ < 200) {
        const x = level === 1 ? randNum(rng, rng.int(4, 6))
          : level === 3 && rng.chance(0.6) ? swapDigits(base, rng)
          : variant(base, rng);
        if (!set.includes(x)) set.push(x);
      }
      if (set.length === cnt) return rng.shuffle(set);
    }
    throw new Error("m5-zahlen-ordnen: keine Zahlenmenge gefunden");
  }

  // ---------- Zahlenfolgen ----------
  // Schritt j (von Glied j-1 zu Glied j): Rechenzeichen und Zahl
  function stepOp(sq, j) {
    if (sq.kind === "add") return { op: "+", v: sq.d };
    if (sq.kind === "sub") return { op: MI, v: sq.d };
    if (sq.kind === "mul") return { op: "·", v: sq.f };
    return j % 2 ? { op: "+", v: sq.d1 } : { op: MI, v: sq.d2 };
  }
  function applyOp(prev, o) {
    if (o.op === "+") return prev + o.v;
    if (o.op === MI) return prev - o.v;
    return prev * o.v;
  }
  function makeSeq(rng, level) {
    for (let tries = 0; tries < 200; tries++) {
      const sq = makeSeqOnce(rng, level);
      if (sq) return sq;
    }
    throw new Error("m5-zahlenfolgen: keine Folge gefunden");
  }
  function makeSeqOnce(rng, level) {
    const V = level === 3 ? 5 : 4, N = V + 3;
    const kind = rng.pick(level === 1 ? ["add", "add", "sub"] : level === 2 ? ["add", "sub", "mul"] : ["alt", "alt", "add"]);
    const sq = { V, N, kind };
    let a0;
    if (kind === "add" || kind === "sub") {
      sq.d = level === 1 ? rng.pick([100, 200, 500, 1000, 2000, 5000])
        : level === 2 ? rng.pick([1000, 2000, 5000, 20000, 50000])
        : rng.pick([5000, 10000, 20000, 50000, 100000]);
      if (kind === "add") a0 = (sq.d / 10) * rng.int(3, 99);
      else a0 = (sq.d / 10) * rng.int(80, 140);   // Folge bleibt positiv
    } else if (kind === "mul") {
      sq.f = rng.pick([2, 3, 5, 10]);
      const starts = { 2: [1, 3, 5, 10, 25, 100], 3: [1, 2, 4, 10, 100], 5: [1, 2, 4, 10], 10: [1, 2, 5] }[sq.f];
      a0 = rng.pick(starts);
    } else {
      sq.d1 = rng.pick([2000, 3000, 5000, 10000, 20000]);
      sq.d2 = rng.pick([1000, 2000, 5000].filter(x => x < sq.d1));
      a0 = rng.int(2, 90) * 1000;
    }
    sq.full = [a0];
    for (let j = 1; j < N; j++) sq.full.push(applyOp(sq.full[j - 1], stepOp(sq, j)));
    if (sq.full[N - 1] > 9999999 || sq.full.some(x => x <= 0)) return null;
    return sq;
  }
  const ruleText = sq => sq.kind === "add" ? "+ " + fmt(sq.d)
    : sq.kind === "sub" ? MI + " " + fmt(sq.d)
    : sq.kind === "mul" ? "· " + t(sq.f)
    : "abwechselnd + " + fmt(sq.d1) + " und " + MI + " " + fmt(sq.d2);

  // ---------- Runden ----------
  const RPHR = { 1: "auf Zehner", 2: "auf Hunderter", 3: "auf Tausender", 4: "auf Zehntausender", 5: "auf Hunderttausender", 6: "auf Millionen" };
  const RNAME = { 1: "Zehner", 2: "Hunderter", 3: "Tausender", 4: "Zehntausender", 5: "Hunderttausender", 6: "Millionen" };
  function roundTo(n, p) {
    const q = Math.floor(n / 10 ** p);
    return digitAt(n, p - 1) >= 5 ? (q + 1) * 10 ** p : q * 10 ** p;
  }

  // ---------- Zahlenstrahl ----------
  function numberLineFig(S, s, N, labeled, points) {
    const W = 150, H = 36, x0 = 10, x1 = 140, y = 18;
    const X = k => x0 + ((x1 - x0) * k) / N;
    const sk = AG.sketch(W, H);
    sk.line([x0 - 4, y], [x1 + 4, y]);
    for (let k = 0; k <= N; k++) {
      sk.line([X(k), y - 1.8], [X(k), y + 1.8]);
      if (labeled.includes(k)) sk.label([X(k), y + 6.5], fmt(S + k * s));
    }
    for (const pt of points) {
      sk.line([X(pt.k), y - 5.5], [X(pt.k), y - 1.6]);
      sk.circle([X(pt.k), y], 0.9, { fill: AG.SKETCH_COLORS.INK });
      sk.label([X(pt.k), y - 8], pt.letter, { bold: true });
    }
    return sk.done();
  }

  // ---------- Diagramme (Werte in Tausend, Achse mit Skala, Werte nicht aufgedruckt) ----------
  function niceTop(max) { return Math.ceil((max + 5) / 10) * 10; }
  function columnFig(names, vals) {
    const W = 140, H = 60, xA = 18, yB = 50, yT = 8;
    const T = niceTop(Math.max(...vals));
    const sy = v => yB - (v / T) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 2], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    for (let v = 0; v <= T; v += 5) {
      s.line([xA - (v % 10 ? 0.8 : 1.6), sy(v)], [xA, sy(v)]);
      if (v % 10 === 0) s.label([xA - 2.5, sy(v)], t(v), { anchor: "end" });
    }
    s.label([xA + 2, yT - 4], "Tausend", { anchor: "start" });
    const slot = (W - xA - 4) / names.length, bw = slot * 0.6;
    names.forEach((nm, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(vals[i]), bw, yB - sy(vals[i]), { fill: COLORS[i] });
      s.label([x + bw / 2, yB + 4.5], nm);
    });
    return s.done();
  }
  function barFig(names, vals) {
    const W = 140, H = 60, xL = 36, x0 = 38, xw = 92, yT = 6, yB = 45;
    const T = niceTop(Math.max(...vals));
    const sx = v => x0 + (v / T) * xw;
    const slot = (yB - yT) / names.length, bh = slot * 0.6;
    const s = AG.sketch(W, H);
    s.line([x0, yT - 1], [x0, yB + 1]);
    s.line([x0, yB], [x0 + xw, yB]);
    for (let v = 0; v <= T; v += 5) {
      s.line([sx(v), yB], [sx(v), yB + (v % 10 ? 0.8 : 1.6)]);
      if (v % 10 === 0) s.label([sx(v), yB + 5], t(v));
    }
    s.label([x0 + xw, yB + 10], "Tausend", { anchor: "end" });
    names.forEach((nm, i) => {
      const yc = yT + slot * (i + 0.5);
      s.label([xL, yc], nm, { anchor: "end" });
      s.rect(x0, yc - bh / 2, sx(vals[i]) - x0, bh, { fill: COLORS[i] });
    });
    return s.done();
  }

  // ==================== Aufgabentypen ====================

  // ---------- 1. Große Zahlen: Ziffern ↔ Wortform, Stellenwerttafel ----------
  AG.registerType({
    id: "m5-grosse-zahlen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Große Zahlen lesen und schreiben",
    instruction: {
      1: "Schreibe die Zahl mit Worten oder mit Ziffern. Ergänze die Stellenwerttafel.",
      2: "Schreibe die Zahl mit Worten oder mit Ziffern. Achte auf Millionen und Milliarden.",
      3: "Schreibe die Zahl um. Achte auf die vielen Nullen und die Billionen.",
    },
    merke: [
      "Eine Zahl wird in Dreiergruppen gelesen: Einer, Tausender, Millionen, Milliarden, Billionen. Million, Milliarde und Billion sind eigene Wörter und werden großgeschrieben. Beispiel: 3 405 020 = drei Millionen vierhundertfünftausendzwanzig.",
      " Stellenwerttafel: M = Millionen, HT = Hunderttausender, ZT = Zehntausender, T = Tausender, H = Hunderter, Z = Zehner, E = Einer.",
    ],
    cols: 1,
    generate(rng, level) {
      const n = level === 1 ? randNum(rng, rng.int(4, 7))
        : level === 2 ? randNum(rng, rng.int(7, 10), 0.1)
        : randNum(rng, rng.int(9, 13), 0.5);
      let mode = rng.pick(["wort", "ziffer", "tafel"]);
      if (mode === "tafel" && n >= 1e10) mode = rng.pick(["wort", "ziffer"]);   // Tafel reicht bis Milliarden
      const P = parts(n), w = words(n);

      if (mode === "wort") {
        const steps = P.map(p => rich(fmt(p.v), " = ", p.words));
        if (P.length > 1) steps.push(rich(fmt(n), " = ", w));
        return { q: rich("Schreibe die Zahl mit Worten: ", fmt(n)), a: rich(w), steps, inline: false, meta: { mode, n } };
      }
      if (mode === "ziffer") {
        const steps = P.map(p => rich(p.words, " = ", fmt(p.v)));
        if (P.length > 1) steps.push(rich(w, " = ", fmt(n)));
        return { q: rich("Schreibe die Zahl mit Ziffern: „", w, "“"), a: rich(fmt(n)), steps, inline: false, meta: { mode, n, w } };
      }

      // Stellenwerttafel mit Lücken (nur Stellen bis zur höchsten Ziffer)
      const top = t(n).length - 1;
      const k = level === 1 ? 2 : level === 2 ? 3 : 4;
      const blanks = rng.shuffle([...Array(top + 1).keys()]).slice(0, k);
      const head = [[{ b: "Stelle" }], ...ORDER.map(p => [{ b: PL[p] }])];
      const row = bl => [[{ b: "Ziffer" }], ...ORDER.map(p => (p > top ? [] : bl.includes(p) ? [{ blank: 2 }] : [t(digitAt(n, p))]))];
      const table = { rows: [head, row(blanks)] };
      const aTable = { rows: [head, row([])] };
      const steps = [...blanks].sort((x, y) => y - x).map(p =>
        rich(PL[p], ": ", t(digitAt(n, p)), " · ", fmt(10 ** p), " = ", fmt(digitAt(n, p) * 10 ** p)));
      const nonZero = ORDER.filter(p => p <= top && digitAt(n, p) !== 0).map(p => fmt(digitAt(n, p) * 10 ** p));
      steps.push(rich(nonZero.join(" + "), " = ", fmt(n)));
      return {
        q: rich("Ergänze die fehlenden Ziffern in der Stellenwerttafel. Welche Zahl ist das?"),
        a: rich(fmt(n)), table, aTable, steps, inline: false, meta: { mode, n, blanks },
      };
    },
    verify(task, level) {
      const m = task.meta;
      if (!m) return "meta fehlt";
      if (m.mode === "wort") return parseWords(plain(task.a)) === m.n && plain(task.a) === words(m.n) ? true : "Wortform falsch";
      if (m.mode === "ziffer") return parseWords(m.w) === m.n && plain(task.a) === fmt(m.n) ? true : "Ziffern falsch";
      const digits = task.aTable.rows[1].slice(1).map(c => plain(c)).join("");
      if (Number(digits) !== m.n) return "Stellenwerttafel falsch: " + digits;
      const nb = task.table.rows[1].slice(1).filter(c => c.some(x => typeof x === "object" && "blank" in x)).length;
      return nb === m.blanks.length ? true : "Anzahl der Lücken falsch";
    },
  });

  // ---------- 2. Zahlen vergleichen und ordnen ----------
  AG.registerType({
    id: "m5-zahlen-ordnen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Zahlen vergleichen und ordnen",
    instruction: {
      1: "Setze das Zeichen < oder > ein. Ordne die Zahlen der Größe nach.",
      2: "Setze das Zeichen < oder > ein. Ordne die Zahlen der Größe nach.",
      3: "Vergleiche genau. Achte auf die Stellen, die sich unterscheiden.",
    },
    merke: [
      "Zuerst die Anzahl der Stellen vergleichen, dann von links die erste Ziffer, die sich unterscheidet. Beispiel: 1 009 000 < 1 090 000, denn an der Stelle ZT ist 0 kleiner als 9.",
    ],
    cols: 2,
    generate(rng, level) {
      const vergleich = rng.chance(level === 3 ? 0.3 : 0.4);
      const cnt = vergleich ? 2 : level === 1 ? 4 : level === 2 ? 5 : 6;
      const set = makeSet(rng, level, cnt);
      if (vergleich) {
        const x = set[0], y = set[1];
        const lo = Math.min(x, y), hi = Math.max(x, y);
        const sign = x < y ? "<" : ">";
        return {
          q: rich("Setze das Zeichen < oder > ein: ", fmt(x), " ", { blank: 2 }, " ", fmt(y)),
          a: rich(fmt(x), " ", sign, " ", fmt(y)),
          steps: [rich(fmt(lo), " < ", fmt(hi), ", denn ", reasonText(lo, hi)), rich(fmt(x), " ", sign, " ", fmt(y))],
          inline: false, meta: { sub: "vergleich", x, y, sign },
        };
      }
      const asc = rng.chance(0.5);
      const sorted = [...set].sort((a, b) => a - b);
      const ordered = asc ? sorted : sorted.slice().reverse();
      const sign = asc ? " < " : " > ";
      const a = ordered.map(fmt).join(sign);
      const steps = [];
      for (let i = 0; i + 1 < sorted.length; i++) {
        steps.push(rich(fmt(sorted[i]), " < ", fmt(sorted[i + 1]), ", denn ", reasonText(sorted[i], sorted[i + 1])));
      }
      steps.push(rich(a));
      return {
        q: rich("Ordne die Zahlen der Größe nach. Beginne mit der ", asc ? "kleinsten" : "größten", " Zahl: ", set.map(fmt).join(", ")),
        a: rich(a), steps, inline: false, meta: { sub: "ordnen", set, asc, sorted },
      };
    },
    verify(task) {
      const m = task.meta;
      if (!m) return "meta fehlt";
      if (m.sub === "vergleich") return m.x !== m.y && (m.x < m.y ? "<" : ">") === m.sign && plain(task.a).includes(m.sign) ? true : "Zeichen falsch";
      const want = (m.asc ? m.sorted : m.sorted.slice().reverse()).map(fmt).join(m.asc ? " < " : " > ");
      return plain(task.a) === want && new Set(m.set).size === m.set.length ? true : "Reihenfolge falsch";
    },
  });

  // ---------- 3. Zahlenfolgen fortsetzen ----------
  AG.registerType({
    id: "m5-zahlenfolgen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Zahlenfolgen fortsetzen",
    instruction: {
      1: "Setze die Zahlenfolge fort. Die Regel steht in der Lösung.",
      2: "Setze die Zahlenfolge fort. Finde zuerst die Regel.",
      3: "Setze die Zahlenfolge fort. Die Schritte wechseln ab.",
    },
    merke: [
      "Bei einer Zahlenfolge bleibt die Regel gleich: immer + (oder − bzw. ·) dieselbe Zahl. Bei abwechselnden Schritten wechseln die Zeichen. Beispiel: 1 200, 1 400, 1 600 hat die Regel + 200.",
    ],
    cols: 2,
    generate(rng, level) {
      const sq = makeSeq(rng, level);
      const { V, N, full } = sq;
      const steps = [rich("Regel: ", ruleText(sq))];
      for (let j = V; j < N; j++) {
        const o = stepOp(sq, j);
        steps.push(rich(fmt(full[j - 1]), " ", o.op, " ", fmt(o.v), " = ", fmt(full[j])));
      }
      return {
        q: rich("Setze die Zahlenfolge fort: ", full.slice(0, V).map(fmt).join(", "), ", ", { blank: 3 }, ", ", { blank: 3 }, ", ", { blank: 3 }),
        a: rich(full.slice(V).map(fmt).join(", ")),
        steps, inline: false, meta: { sq },
      };
    },
    verify(task) {
      const sq = task.meta && task.meta.sq;
      if (!sq) return "meta fehlt";
      for (let j = 1; j < sq.N; j++) {
        if (applyOp(sq.full[j - 1], stepOp(sq, j)) !== sq.full[j]) return "Regel verletzt bei Glied " + j;
      }
      return plain(task.a) === sq.full.slice(sq.V).map(fmt).join(", ") ? true : "Lösung falsch";
    },
  });

  // ---------- 4. Runden ----------
  AG.registerType({
    id: "m5-runden",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Auf Zehner, Hunderter … runden",
    instruction: {
      1: "Runde die Zahl auf die angegebene Stelle.",
      2: "Runde die Zahl auf die angegebene Stelle. Achte auf die entscheidende Ziffer.",
      3: "Runde die Zahl. Achte auf die Überträge, z. B. bei 1 996.",
    },
    merke: [
      "Die entscheidende Ziffer ist die Ziffer direkt rechts von der Rundungsstelle. Ist sie 5 oder mehr, wird aufgerundet, sonst abgerundet. Beispiel: 1 996 auf Hunderter sind 2 000, denn die 9 wird zu einem Übertrag.",
    ],
    cols: 3,
    generate(rng, level) {
      const P = level === 1 ? [1, 2, 3] : level === 2 ? [2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
      const p = rng.pick(P);
      let n;
      for (let tries = 0; ; tries++) {
        if (tries > 500) throw new Error("m5-runden: keine Zahl gefunden");
        const k = level === 1 ? rng.int(3, 5) : level === 2 ? rng.int(4, 7) : rng.int(6, 9);
        if (level === 3 && rng.chance(0.45)) {
          // Übertrag-Falle: knapp unter einer runden Zahl (1 996 → 2 000)
          const base = randNum(rng, k);
          n = (Math.floor(base / 10 ** p) + 1) * 10 ** p - rng.int(1, 4);
        } else {
          n = randNum(rng, k, 0.1);
        }
        if (n % 10 ** p !== 0 && n >= 10 ** p) break;
      }
      const up = digitAt(n, p - 1) >= 5;
      const r = roundTo(n, p);
      const steps = [
        rich("Entscheidende Ziffer: ", t(digitAt(n, p - 1)), up ? " → aufrunden" : " → abrunden"),
        rich("Die Ziffern rechts von der Stelle „", RNAME[p], "“ werden 0", up ? "; die Zahl links davon wird um 1 größer." : "."),
        rich(fmt(n), " ≈ ", fmt(r)),
      ];
      return {
        q: rich("Runde ", fmt(n), " ", RPHR[p], "."),
        a: rich(fmt(r)), steps, inline: false, meta: { n, p, r },
      };
    },
    verify(task) {
      const m = task.meta;
      if (!m) return "meta fehlt";
      const r = roundTo(m.n, m.p);
      if (r !== m.r || r % 10 ** m.p !== 0 || Math.abs(r - m.n) >= 10 ** m.p) return "Rundung falsch";
      return plain(task.a) === fmt(r) ? true : "Lösung falsch";
    },
  });

  // ---------- 5. Zahlenstrahl ----------
  AG.registerType({
    id: "m5-zahlenstrahl",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Zahlen am Zahlenstrahl ablesen",
    instruction: {
      1: "Lies die Zahlen an den Strichen A, B und C ab.",
      2: "Lies die Zahlen ab. Die Skala ist nur an den Enden beschriftet.",
      3: "Lies die Zahlen ab und berechne die Zahl in der Mitte.",
    },
    merke: [
      "Auf einem Zahlenstrahl hat jeder Schritt denselben Wert. Die Zahl an einem Strich ist: Anfangszahl + Anzahl der Schritte · Schrittwert. Beispiel: Anfang 1 000 000, Schritt 10 000, 3 Schritte: 1 000 000 + 3 · 10 000 = 1 030 000.",
    ],
    cols: 1,
    generate(rng, level) {
      const p = level === 1 ? rng.int(1, 4) : level === 2 ? rng.int(2, 5) : rng.int(1, 5);
      const s = 10 ** p;
      const S = rng.int(0, 99) * s;
      // Niveau 1: jeder zweite Strich beschriftet, gesucht sind die Striche dazwischen
      const N = level === 1 ? 8 : 10;
      const labeled = level === 1 ? [0, 2, 4, 6, 8] : level === 2 ? [0, N] : [0, N / 2, N];
      const cand = [...Array(N + 1).keys()].slice(1, N).filter(k => !labeled.includes(k));
      const ks = rng.shuffle(cand).slice(0, 3).sort((a, b) => a - b);
      const L = ["A", "B", "C"];
      const points = ks.map((k, i) => ({ letter: L[i], k, v: S + k * s }));
      const fig = numberLineFig(S, s, N, labeled, points);
      const scale = "Der Zahlenstrahl beginnt bei " + fmt(S) + ". Die Skala geht in Schritten von " + fmt(s) + ". ";
      const steps = points.map(pt => rich(pt.letter, ": ", fmt(S), " + ", t(pt.k), " · ", fmt(s), " = ", fmt(pt.v)));
      const list = points.map(pt => pt.letter + " = " + fmt(pt.v)).join("; ");
      if (level < 3) {
        return {
          q: rich(scale, "Welche Zahlen gehören zu den Strichen A, B und C?"),
          a: rich(list), steps, fig, inline: false, meta: { S, s, N, points, mid: null },
        };
      }
      const mid = (points[0].v + points[1].v) / 2;
      steps.push(rich("Mitte von A und B: (", fmt(points[0].v), " + ", fmt(points[1].v), ") : 2 = ", fmt(mid)));
      return {
        q: rich(scale, "Welche Zahlen gehören zu den Strichen A, B und C? Welche Zahl liegt genau in der Mitte zwischen A und B?"),
        a: rich(list, "; Mitte von A und B = ", fmt(mid)), steps, fig, inline: false, meta: { S, s, N, points, mid },
      };
    },
    verify(task) {
      const m = task.meta;
      if (!m) return "meta fehlt";
      for (const pt of m.points) {
        if (pt.v !== m.S + pt.k * m.s) return "Wert falsch";
        if (!plain(task.a).includes(fmt(pt.v))) return "Wert fehlt in der Lösung";
      }
      if (m.mid !== null && (!Number.isInteger(m.mid) || m.mid !== (m.points[0].v + m.points[1].v) / 2)) return "Mitte falsch";
      return true;
    },
  });

  // ---------- 6. Diagramm ablesen ----------
  const SCEN = [
    { ctx: "Die Grafik zeigt die Einwohnerzahlen einiger Städte (in Tausend).",
      pool: ["Ahornstadt", "Birkenau", "Eichental", "Fichtenbach", "Lindenfeld", "Rosenau"], unit: "Einwohner" },
    { ctx: "Die Grafik zeigt die Besucherzahlen einiger Freizeitparks im letzten Jahr (in Tausend).",
      pool: ["Wasserwelt", "Tierpark", "Abenteuer", "Waldbad", "Sternwarte", "Bergbahn"], unit: "Besucher" },
  ];
  AG.registerType({
    id: "m5-diagramm-ablesen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Säulen- und Balkendiagramm ablesen",
    instruction: {
      1: "Lies die Werte aus dem Diagramm ab. Die Werte sind in Tausend angegeben.",
      2: "Lies die Werte ab und rechne damit. Die Werte sind in Tausend angegeben.",
      3: "Lies die Werte ab und rechne damit. Gib die Anzahl ganz aus.",
    },
    merke: [
      "Am Diagramm liest man die Werte an den Strichen der Skala ab. Ist die Skala in Tausend, schreibt man die Zahl ohne Tausend: 45 Tausend = 45 · 1 000 = 45 000. Beispiel: 30 Tausend und 15 Tausend ergeben 45 Tausend, also 45 000.",
    ],
    cols: 1,
    generate(rng, level) {
      const sc = rng.pick(SCEN);
      const n = level === 1 ? 4 : 5;
      const names = rng.shuffle(sc.pool).slice(0, n);
      const vals = [];
      while (vals.length < n) {
        const v = 5 * rng.int(2, 18);
        if (!vals.includes(v)) vals.push(v);
      }
      const slot = (140 - 22) / n;
      const kind = names.every(nm => nm.length * 2 <= slot - 1) ? rng.pick(["col", "bar"]) : "bar";
      const fig = kind === "col" ? columnFig(names, vals) : barFig(names, vals);
      const ask = rng.pick(level === 1 ? ["read", "max", "min"] : level === 2 ? ["diff", "sum2"] : ["sum3", "maxmin"]);
      const U = sc.unit;
      const K = v => fmt(v * 1000);
      const ctx = sc.ctx + " Dargestellt sind: " + names.join(", ") + ".";

      if (ask === "read") {
        const i = rng.int(0, n - 1);
        return {
          q: rich(ctx, " Wie viele ", U, " sind es bei „", names[i], "“?"), a: rich(K(vals[i]), " ", U),
          steps: [rich("Am Diagramm ablesen: ", names[i], " = ", t(vals[i]), " Tausend"),
            rich(t(vals[i]), " · 1 000 = ", K(vals[i]))],
          fig, inline: false, meta: { vals, ask, expect: vals[i] * 1000 },
        };
      }
      if (ask === "max" || ask === "min") {
        const best = ask === "max" ? Math.max(...vals) : Math.min(...vals);
        const i = vals.indexOf(best);
        return {
          q: rich(ctx, " Bei welchem Balken ist der Wert ", ask === "max" ? "am größten" : "am kleinsten", "? Gib den Namen und die Anzahl an."),
          a: rich(names[i], ": ", K(best), " ", U),
          steps: [rich(ask === "max" ? "Größter" : "Kleinster", " Balken: ", names[i], " mit ", t(best), " Tausend"),
            rich(t(best), " · 1 000 = ", K(best), " ", U)],
          fig, inline: false, meta: { vals, ask, expect: best * 1000 },
        };
      }
      if (ask === "diff") {
        let i = rng.int(0, n - 1);
        let j = rng.intExcept(0, n - 1, [i]);
        if (vals[i] < vals[j]) { const x = i; i = j; j = x; }
        const d = vals[i] - vals[j];
        return {
          q: rich(ctx, " Wie viele ", U, " mehr hat „", names[i], "“ als „", names[j], "“?"), a: rich(K(d), " ", U),
          steps: [rich("Unterschied: ", t(vals[i]), " ", MI, " ", t(vals[j]), " = ", t(d), " Tausend"),
            rich(t(d), " · 1 000 = ", K(d))],
          fig, inline: false, meta: { vals, ask, expect: d * 1000 },
        };
      }
      if (ask === "sum2") {
        const i = rng.int(0, n - 1), j = rng.intExcept(0, n - 1, [i]);
        const sm = vals[i] + vals[j];
        return {
          q: rich(ctx, " Wie viele ", U, " sind es zusammen bei „", names[i], "“ und „", names[j], "“?"), a: rich(K(sm), " ", U),
          steps: [rich("Zusammen: ", t(vals[i]), " + ", t(vals[j]), " = ", t(sm), " Tausend"),
            rich(t(sm), " · 1 000 = ", K(sm))],
          fig, inline: false, meta: { vals, ask, expect: sm * 1000 },
        };
      }
      if (ask === "sum3") {
        const [i, j, m] = rng.shuffle([...Array(n).keys()]).slice(0, 3);
        const sm = vals[i] + vals[j] + vals[m];
        return {
          q: rich(ctx, " Wie viele ", U, " sind es zusammen bei „", names[i], "“, „", names[j], "“ und „", names[m], "“?"), a: rich(K(sm), " ", U),
          steps: [rich(t(vals[i]), " + ", t(vals[j]), " + ", t(vals[m]), " = ", t(sm), " Tausend"),
            rich(t(sm), " · 1 000 = ", K(sm))],
          fig, inline: false, meta: { vals, ask, expect: sm * 1000 },
        };
      }
      // maxmin: Unterschied zwischen größtem und kleinstem Wert
      const mx = Math.max(...vals), mn = Math.min(...vals), d = mx - mn;
      return {
        q: rich(ctx, " Wie groß ist der Unterschied zwischen dem größten und dem kleinsten Wert? Gib die Anzahl an."),
        a: rich(K(d), " ", U),
        steps: [rich("Größter Wert: ", t(mx), " Tausend, kleinster Wert: ", t(mn), " Tausend"),
          rich("Unterschied: ", t(mx), " ", MI, " ", t(mn), " = ", t(d), " Tausend"),
          rich(t(d), " · 1 000 = ", K(d))],
        fig, inline: false, meta: { vals, ask, expect: d * 1000 },
      };
    },
    verify(task) {
      const m = task.meta;
      if (!m) return "meta fehlt";
      if (m.vals.some(v => v % 5 || v <= 0)) return "Werte nicht in Schritten von 5";
      if (new Set(m.vals).size !== m.vals.length) return "Werte nicht verschieden";
      return plain(task.a).includes(fmt(m.expect)) ? true : "Ergebnis fehlt in der Lösung";
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
