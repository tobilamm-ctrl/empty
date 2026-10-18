// Klasse 5, LB 1.2: Grundrechenarten mit natürlichen Zahlen – Kopfrechnen, Überschlag,
// schriftliches Addieren und Subtrahieren, schriftliches Multiplizieren und Dividieren.
(function (AG) {
  const { rich, fmtInt, MINUS } = AG;
  const I = n => fmtInt(n);
  const PLUS = " + ";
  const MIN = " " + MINUS + " ";
  const TIMES = " · ";
  const DIV = " : ";
  const POS = ["E", "Z", "H", "T", "ZT", "HT", "M", "ZM", "HM"];
  const LB = { klasse: "5", zug: "RM", lb: "1.2", lbTitle: "Grundrechenarten mit natürlichen Zahlen", topic: "zahlen" };

  // ---------- Hilfen ----------
  // Zufallszahl mit genau k Ziffern (erste Ziffer ≠ 0); endNZ: letzte Ziffer ≠ 0
  function kDigit(rng, k, endNZ) {
    for (let g = 0; ; g++) {
      if (g > 10000) throw new Error("kDigit: keine Zahl gefunden");
      let s = String(rng.int(1, 9));
      for (let i = 1; i < k; i++) s += rng.int(0, 9);
      if (!endNZ || !s.endsWith("0")) return Number(s);
    }
  }
  // Rundung auf die Stelle u (Rundung auf halbe Stelle ist ausgeschlossen, damit nichts mehrdeutig ist)
  const round = (x, u) => Math.round(x / u) * u;
  const okNum = (x, u) => x % u !== 0 && x % u !== u / 2;
  const unitFor = k => (k <= 5 ? 1000 : k === 6 ? 10000 : 100000);
  const join = (xs, sep) => xs.map(I).join(sep);
  const digitsRev = n => String(n).split("").reverse().map(Number);

  // Schriftliche Addition, stellenweise von rechts. Liefert Zeilen und ob ein Übertrag vorkommt.
  function addCols(nums) {
    const cols = nums.map(digitsRev);
    const maxLen = Math.max(...cols.map(c => c.length));
    const lines = [];
    let carry = 0, carried = false;
    for (let i = 0; i < maxLen || carry > 0; i++) {
      const present = cols.filter(c => i < c.length).map(c => c[i]);
      const sum = present.reduce((s, d) => s + d, 0) + carry;
      const base = (present.length ? present.join(" + ") : "0") + (carry ? " + " + carry + " (Übertrag)" : "");
      const digit = sum % 10, next = Math.floor(sum / 10);
      if (next) carried = true;
      lines.push(rich(POS[i], ": ", base, " = ", I(sum), ", schreibe ", String(digit), next ? ", Übertrag " + next : ""));
      carry = next;
    }
    return { lines, carried };
  }

  // Schriftliche Subtraktion a − s, stellenweise von rechts. Liefert Zeilen und ob geborgt wird.
  function subCols(a, s) {
    const A = digitsRev(a), B = digitsRev(s);
    const lines = [];
    let borrow = 0, borrowed = false;
    for (let i = 0; i < A.length; i++) {
      const bi = i < B.length ? B[i] : 0;
      const out = A[i] - borrow < bi ? 1 : 0;
      const M = A[i] + 10 * out;
      const diff = M - borrow - bi;
      if (out) borrowed = true;
      lines.push(rich(POS[i], ": ", String(M), borrow ? " " + MINUS + " 1 (geliehen)" : "", " " + MINUS + " ", String(bi),
        " = ", I(diff), ", schreibe ", String(diff), out ? ", 1 geliehen" : ""));
      borrow = out;
    }
    return { lines, borrowed };
  }

  // Division Schritt für Schritt: Teildivisionen „61 : 12 = 5 Rest 1“, Quotient, Rest
  function divSteps(D, d) {
    const s = String(D);
    let i = 0, cur = 0;
    while (cur < d) { cur = cur * 10 + Number(s[i]); i++; }
    let q = Math.floor(cur / d), r = cur % d;
    const lines = [rich(I(cur), DIV, I(d), " = ", I(q), " Rest ", I(r))];
    let qs = String(q);
    while (i < s.length) {
      cur = r * 10 + Number(s[i]); i++;
      q = Math.floor(cur / d); r = cur % d;
      lines.push(rich(I(cur), DIV, I(d), " = ", I(q), " Rest ", I(r)));
      qs += String(q);
    }
    return { lines, q: Number(qs), r };
  }

  // Überschlag Plus oder Minus mit k-stelligen Zahlen, gerundet auf u
  function pm(rng, k, u) {
    for (let g = 0; ; g++) {
      if (g > 10000) throw new Error("pm: keine Aufgabe gefunden");
      const add = rng.chance(0.5);
      let x = kDigit(rng, k, false), y = kDigit(rng, k, false);
      if (!add) { if (x < y) [x, y] = [y, x]; if (x === y) continue; }
      if (!okNum(x, u) || !okNum(y, u)) continue;
      const rx = round(x, u), ry = round(y, u);
      const E = add ? rx + ry : rx - ry;
      if (E <= 0) continue;
      return { add, x, y, rx, ry, E, res: add ? x + y : x - y, op: add ? PLUS : MIN };
    }
  }

  // ==========================================================
  // 1. Kopfrechnen
  // ==========================================================
  function kopfL1(rng) {
    const f = rng.int(0, 3);
    if (f === 0) { // Plus mit vollen Zehnern: 340 + 260
      let x, y;
      do { x = rng.int(11, 89); y = rng.int(11, 89); } while (x + y > 99);
      return {
        q: rich(I(10 * x), PLUS, I(10 * y)), res: 10 * (x + y),
        steps: [rich(I(x), PLUS, I(y), " = ", I(x + y)), rich(I(10 * x), PLUS, I(10 * y), " = ", I(10 * (x + y)))],
      };
    }
    if (f === 1) { // Minus mit vollen Zehnern: 800 − 350
      const x = rng.int(13, 99);
      const y = rng.int(11, x - 2);
      return {
        q: rich(I(10 * x), MIN, I(10 * y)), res: 10 * (x - y),
        steps: [rich(I(x), MIN, I(y), " = ", I(x - y)), rich(I(10 * x), MIN, I(10 * y), " = ", I(10 * (x - y)))],
      };
    }
    if (f === 2) { // Mal mit Zehnern: 7 · 80
      const n = rng.int(3, 9), m = rng.int(2, 9);
      return {
        q: rich(I(n), TIMES, I(10 * m)), res: n * m * 10,
        steps: [rich(I(n), TIMES, I(m), " = ", I(n * m)), rich(I(n), TIMES, I(10 * m), " = ", I(n * m), TIMES, "10 = ", I(10 * n * m))],
      };
    }
    // Geteilt mit Zehnern: 480 : 60
    const m = rng.int(2, 9), q = rng.int(3, 9);
    return {
      q: rich(I(10 * m * q), DIV, I(10 * m)), res: q,
      steps: [rich(I(m * q), DIV, I(m), " = ", I(q)), rich(I(10 * m * q), DIV, I(10 * m), " = ", I(q))],
    };
  }

  function kopfL2(rng) {
    const f = rng.int(0, 2);
    if (f === 0) { // Minus über den Tausender: 4 500 − 1 750
      const a = 100 * rng.int(21, 99);
      let b;
      do { b = 50 * rng.int(21, Math.floor((a - 50) / 50)); } while (b % 1000 === 0 || b < 1000);
      const bt = Math.floor(b / 1000) * 1000, br = b - bt;
      return {
        q: rich(I(a), MIN, I(b)), res: a - b,
        steps: [rich(I(a), MIN, I(bt), " = ", I(a - bt)), rich(I(a - bt), MIN, I(br), " = ", I(a - b))],
      };
    }
    if (f === 1) { // Mal mit 5, 25 oder 50 über Hundert: 36 · 25
      let a;
      do a = rng.int(12, 99); while (a % 10 === 0);
      const m = rng.pick([5, 25, 50]);
      const steps = m === 25
        ? [rich(I(a), TIMES, "25 = ", I(a), TIMES, "100 : 4"), rich(I(100 * a), " : 4 = ", I(25 * a))]
        : m === 50
          ? [rich(I(a), TIMES, "50 = ", I(a), TIMES, "100 : 2"), rich(I(100 * a), " : 2 = ", I(50 * a))]
          : [rich(I(a), TIMES, "5 = ", I(a), TIMES, "10 : 2"), rich(I(10 * a), " : 2 = ", I(5 * a))];
      return { q: rich(I(a), TIMES, I(m)), res: a * m, steps };
    }
    // Geteilt durch Vielfache von 10: 4 200 : 70
    const d = 10 * rng.int(2, 9);
    let q, D;
    do { q = rng.int(12, 99); D = d * q; } while (D < 1000);
    return {
      q: rich(I(D), DIV, I(d)), res: q,
      steps: [rich(I(D), DIV, I(d), " = ", I(D / 10), DIV, I(d / 10)), rich(I(D / 10), DIV, I(d / 10), " = ", I(q))],
    };
  }

  function kopfL3(rng) {
    const f = rng.int(0, 3);
    const c = () => { let x; do x = rng.int(11, 199); while (x % 10 === 0); return x; };
    if (f === 0) { // Mal und Plus: 8 · 25 + 170
      const a = rng.int(3, 9), b = rng.pick([15, 25, 35, 50, 125]), cc = c(), P = a * b;
      return {
        q: rich(I(a), TIMES, I(b), PLUS, I(cc)), res: P + cc,
        steps: [rich(I(a), TIMES, I(b), " = ", I(P)), rich(I(P), PLUS, I(cc), " = ", I(P + cc))],
      };
    }
    if (f === 1) { // Geteilt und Plus: 600 : 30 + 45
      const d = rng.pick([4, 5, 6, 8, 9, 12, 15, 25]);
      let qq;
      do qq = rng.int(11, 99); while (qq % 10 === 0);
      const cc = c(), a = d * qq;
      return {
        q: rich(I(a), DIV, I(d), PLUS, I(cc)), res: qq + cc,
        steps: [rich(I(a), DIV, I(d), " = ", I(qq)), rich(I(qq), PLUS, I(cc), " = ", I(qq + cc))],
      };
    }
    if (f === 2) { // Minus und Mal: a − b · c, z. B. 1 000 − 4 · 125
      const b = rng.int(3, 9);
      let c2;
      do c2 = rng.int(11, 49); while (c2 % 10 === 0);
      const P = b * c2;
      let x;
      do x = rng.int(11, 399); while (x % 10 === 0);
      const a = P + x;
      return {
        q: rich(I(a), MIN, I(b), TIMES, I(c2)), res: x,
        steps: [rich(I(b), TIMES, I(c2), " = ", I(P)), rich(I(a), MIN, I(P), " = ", I(x))],
      };
    }
    // Klammer, Plus und Geteilt: (480 + 320) : 8
    const cc = rng.pick([4, 5, 6, 8, 9, 12]);
    let qq;
    do qq = rng.int(11, 99); while (qq % 10 === 0);
    const S = cc * qq;
    let a, b;
    do { a = rng.int(11, S - 11); b = S - a; } while (a % 10 === 0 || b % 10 === 0 || b < 11);
    return {
      q: rich("(", I(a), PLUS, I(b), ")", DIV, I(cc)), res: qq,
      steps: [rich("(", I(a), PLUS, I(b), ") = ", I(S)), rich(I(S), DIV, I(cc), " = ", I(qq))],
    };
  }

  AG.registerType({
    ...LB,
    id: "m5-kopfrechnen",
    title: "Kopfrechnen",
    instruction: {
      1: "Rechne im Kopf.",
      2: "Rechne im Kopf. Zerlege die Zahlen geschickt.",
      3: "Rechne im Kopf. Rechne zuerst Klammern, dann Mal und Geteilt, dann Plus und Minus.",
    },
    merke: [
      "Mit vollen Zehnern rechnen: 34 + 26 = 60, also ", { b: I(340) + " + " + I(260) + " = " + I(600) },
      ". Mal und Geteilt kommen vor Plus und Minus. Beispiel: ", { b: I(36) + " · 25 = " + I(36) + " · 100 : 4 = " + I(900) }, ".",
    ],
    cols: 3,
    generate(rng, level) {
      const t = level === 1 ? kopfL1(rng) : level === 2 ? kopfL2(rng) : kopfL3(rng);
      return { q: t.q, a: rich(I(t.res)), steps: t.steps };
    },
  });

  // ==========================================================
  // 2. Überschlag
  // ==========================================================
  function uebL1(rng) { // dreistellig, auf Hunderter runden
    const t = pm(rng, 3, 100);
    return {
      q: rich(I(t.x), t.op, I(t.y)), a: rich("≈ ", I(t.E)),
      steps: [rich(I(t.x), t.op, I(t.y), " ≈ ", I(t.rx), t.op, I(t.ry), " = ", I(t.E))],
    };
  }

  function uebL2(rng) {
    if (rng.chance(0.5)) { // vierstellig, auf Tausender runden: 4873 + 2145
      const t = pm(rng, 4, 1000);
      return {
        q: rich(I(t.x), t.op, I(t.y)), a: rich("≈ ", I(t.E)),
        steps: [rich(I(t.x), t.op, I(t.y), " ≈ ", I(t.rx), t.op, I(t.ry), " = ", I(t.E))],
      };
    }
    // zweistellig · dreistellig, auf Zehner bzw. Hunderter runden: 38 · 412
    let a, b;
    do { a = rng.int(21, 98); } while (a % 5 === 0);
    do { b = rng.int(112, 899); } while (b % 50 === 0);
    const ra = round(a, 10), rb = round(b, 100), E = ra * rb;
    return {
      q: rich(I(a), TIMES, I(b)), a: rich("≈ ", I(E)),
      steps: [rich(I(a), TIMES, I(b), " ≈ ", I(ra), TIMES, I(rb), " = ", I(E))],
    };
  }

  function uebL3(rng) { // vierstellig, auf Hunderter runden; drei Ergebnisse, nur eines passt
    for (let g = 0; ; g++) {
      if (g > 10000) throw new Error("uebL3: keine Aufgabe gefunden");
      const t = pm(rng, 4, 100);
      const { res, E } = t;
      const d1 = res * 10;                       // Stellenfehler: zehnmal zu groß
      const off = rng.pick([300, 400, 500, 600]);
      let d2 = rng.chance(0.5) ? res + off : res - off;
      if (d2 <= 0) d2 = res + off;               // Rechenfehler, weit vom Überschlag entfernt
      // Der Überschlag ist auf 100 genau: nur das richtige Ergebnis liegt in E ± 100.
      if (Math.abs(res - E) >= 100 || Math.abs(d1 - E) <= 100 || Math.abs(d2 - E) <= 100) continue;
      const opts = rng.shuffle([
        { v: res, good: true },
        { v: d1, why: "zehnmal zu groß" },
        { v: d2, why: (d2 > E ? "zu groß" : "zu klein") + ", weicht zu stark ab" },
      ]);
      const L = ["A", "B", "C"];
      const letter = L[opts.findIndex(o => o.good)];
      const q = [rich(I(t.x), t.op, I(t.y), " = ?"), { br: true }, "Welches Ergebnis kann stimmen?"];
      opts.forEach((o, i) => q.push({ br: true }, L[i] + ") " + I(o.v)));
      const steps = [rich(I(t.x), t.op, I(t.y), " ≈ ", I(t.rx), t.op, I(t.ry), " = ", I(E))];
      opts.forEach((o, i) => steps.push(rich(L[i], ") ", I(o.v), ": ", o.good ? "passt, liegt nahe bei " + I(E) : o.why)));
      steps.push(rich("Ergebnis: ", letter, ") ", I(res)));
      return { q: rich(q), a: rich(letter, ") ", I(res)), steps };
    }
  }

  AG.registerType({
    ...LB,
    id: "m5-ueberschlag",
    title: "Überschlag",
    instruction: {
      1: "Überschlage. Runde zuerst, dann rechne.",
      2: "Überschlage. Runde zuerst, dann rechne.",
      3: "Entscheide per Überschlag, welches Ergebnis stimmen kann. Nur eines passt.",
    },
    merke: [
      "Erst runden, dann rechnen. Beispiel: ", { b: I(4873) + " + " + I(2145) + " ≈ " + I(5000) + " + " + I(2000) + " = " + I(7000) },
      ". Der Überschlag zeigt, in welcher Größenordnung das Ergebnis liegt.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return uebL1(rng);
      if (level === 2) return uebL2(rng);
      return uebL3(rng);
    },
  });

  // ==========================================================
  // 3. Schriftlich addieren und subtrahieren
  // ==========================================================
  function genAddSub(rng, level) {
    for (let tries = 0; tries < 5000; tries++) {
      const k = level === 1 ? rng.pick([4, 5]) : level === 2 ? rng.pick([5, 6]) : rng.pick([6, 7]);
      const add = rng.chance(0.5);
      const n = add ? (level === 1 ? 2 : 3) : (level === 3 ? 3 : 2); // Anzahl der Zahlen (bei Minus: 1 Minuend + Subtrahenden)
      const nums = Array.from({ length: n }, () => kDigit(rng, k, level > 1));
      const u = unitFor(k);
      if (nums.some(x => x % u === u / 2)) continue; // Rundung ohne Mehrdeutigkeit
      const r = nums.map(x => round(x, u));
      if (add) {
        const res = nums.reduce((s, x) => s + x, 0);
        const E = r.reduce((s, x) => s + x, 0);
        const cols = addCols(nums);
        if (level > 1 && !cols.carried) continue;
        const steps = [rich("Überschlag: ", join(nums, PLUS), " ≈ ", join(r, PLUS), " = ", I(E)), ...cols.lines,
          rich(join(nums, PLUS), " = ", I(res))];
        return { q: rich(join(nums, PLUS)), a: rich(I(res)), steps };
      }
      const [a, ...subs] = nums;
      const sSum = subs.reduce((s, x) => s + x, 0);
      const res = a - sSum;
      if (res <= 0) continue;
      const E = r[0] - r.slice(1).reduce((s, x) => s + x, 0);
      if (E <= 0) continue;
      const cols = subCols(a, sSum);
      if (level > 1 && !cols.borrowed) continue;
      const steps = [rich("Überschlag: ", join(nums, MIN), " ≈ ", join(r, MIN), " = ", I(E))];
      if (subs.length > 1) steps.push(rich("Subtrahenden zusammen: ", join(subs, PLUS), " = ", I(sSum)));
      steps.push(...cols.lines, rich(join(nums, MIN), " = ", I(res)));
      return { q: rich(join(nums, MIN)), a: rich(I(res)), steps };
    }
    throw new Error("m5-schriftlich-addsub: keine passende Aufgabe gefunden");
  }

  AG.registerType({
    ...LB,
    id: "m5-schriftlich-addsub",
    title: "Schriftlich addieren und subtrahieren",
    instruction: {
      1: "Rechne schriftlich.",
      2: "Rechne schriftlich. Überschlage vorher.",
      3: "Rechne schriftlich. Überschlage vorher und prüfe dein Ergebnis.",
    },
    merke: [
      "Schriftlich rechnen: Stelle für Stelle von rechts nach links. Ist eine Summe zehn oder mehr, schreibe die Einer und merke dir die Zehner als Übertrag. Beispiel: ",
      { b: I(4873) + " + " + I(2145) + " = " + I(7018) }, ".",
    ],
    cols: 3,
    generate(rng, level) { return genAddSub(rng, level); },
  });

  // ==========================================================
  // 4. Schriftlich multiplizieren
  // ==========================================================
  function genMul(rng, level) {
    if (level === 1) { // ein Faktor einstellig
      const a = kDigit(rng, rng.pick([3, 4]), true), b = rng.int(2, 9), P = a * b;
      return { q: rich(I(a), TIMES, I(b)), a: rich(I(P)), steps: [rich(I(a), TIMES, I(b), " = ", I(P))] };
    }
    // ein Faktor zweistellig (Ziffern 2 bis 9), große erste Faktoren; Teilprodukte a · (Zehner) und a · (Einer)
    for (let g = 0; ; g++) {
      if (g > 10000) throw new Error("genMul: keine Aufgabe gefunden");
      const a = kDigit(rng, level === 2 ? rng.pick([3, 4]) : rng.pick([4, 5]), true);
      const t = rng.int(2, 9), u = rng.int(2, 9), b = 10 * t + u;
      if (a * b > 999999) continue;
      const P1 = a * 10 * t, P2 = a * u, res = a * b;
      return {
        q: rich(I(a), TIMES, I(b)), a: rich(I(res)),
        steps: [
          rich(I(a), TIMES, I(10 * t), " = ", I(P1)),
          rich(I(a), TIMES, I(u), " = ", I(P2)),
          rich("Summe: ", I(P1), PLUS, I(P2), " = ", I(res)),
        ],
      };
    }
  }

  AG.registerType({
    ...LB,
    id: "m5-schriftlich-mul",
    title: "Schriftlich multiplizieren",
    instruction: {
      1: "Multipliziere schriftlich.",
      2: "Multipliziere schriftlich. Rechne mit Teilprodukten.",
      3: "Multipliziere schriftlich. Rechne mit Teilprodukten und addiere sie.",
    },
    merke: [
      "Den zweiten Faktor in Zehner und Einer zerlegen, zwei Teilprodukte rechnen und addieren. Beispiel: ",
      { b: I(2345) + " · " + I(37) + " = " + I(2345) + " · " + I(30) + " + " + I(2345) + " · 7 = " + I(70350) + " + " + I(16415) + " = " + I(86765) },
      ".",
    ],
    cols: 3,
    generate(rng, level) { return genMul(rng, level); },
  });

  // ==========================================================
  // 5. Schriftlich dividieren
  // ==========================================================
  function genDiv(rng, level) {
    let d, qv;
    if (level === 1) { // Divisor einstellig
      d = rng.int(3, 9);
      do qv = rng.int(101, 999); while (qv % 10 === 0);
    } else if (level === 2) { // Divisor zweistellig
      do d = rng.int(11, 99); while (d % 10 === 0);
      do qv = rng.int(12, 499); while (qv % 10 === 0);
    } else { // Nullen im Ergebnis: 61 236 : 12 = 5 103
      do d = rng.int(11, 99); while (d % 10 === 0);
      do qv = rng.int(1001, 9999); while (!/0/.test(String(qv).slice(1, -1)) || qv % 10 === 0);
    }
    const D = d * qv;
    const { lines, q, r } = divSteps(D, d);
    if (q !== qv || r !== 0) throw new Error("m5-schriftlich-div: Division geht nicht auf");
    return {
      q: rich(I(D), DIV, I(d)), a: rich(I(qv)),
      steps: [...lines, rich("Probe: ", I(qv), TIMES, I(d), " = ", I(D)), rich("Ergebnis: ", I(D), DIV, I(d), " = ", I(qv))],
    };
  }

  AG.registerType({
    ...LB,
    id: "m5-schriftlich-div",
    title: "Schriftlich dividieren",
    instruction: {
      1: "Dividiere schriftlich. Mache die Probe.",
      2: "Dividiere schriftlich. Mache die Probe.",
      3: "Dividiere schriftlich. Achte auf Nullen im Ergebnis. Mache die Probe.",
    },
    merke: [
      "Stelle für Stelle teilen und die nächste Ziffer herunterholen. Passt die Zahl nicht, steht eine 0 im Ergebnis. Probe: Ergebnis · Teiler = Ausgangszahl. Beispiel: ",
      { b: I(61236) + " : " + I(12) + " = " + I(5103) }, ".",
    ],
    cols: 3,
    generate(rng, level) { return genDiv(rng, level); },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
