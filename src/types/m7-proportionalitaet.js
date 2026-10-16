// M7 LB 8: Proportionalität – Dreisatz, Wertetabellen ergänzen, proportional oder nicht?
(function (AG) {
  const { Frac, num, rich, plain, fmtDec, gcd } = AG;

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  // {platzhalter} im Text ersetzen
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  // Größe mit Einheit als Rich: Euro mit zwei Stellen, sonst so viele Stellen wie nötig
  const amt = (x, c) => rich(num(x, c.u === "€" ? { as: "dec", digits: 2 } : { as: "dec" }), " ", c.u);
  const amtS = (x, c) => plain(amt(x, c));
  // Zahl als Rich ohne Einheit (Euro mit zwei Stellen)
  const numE = (x, money) => num(x, money ? { as: "dec", digits: 2 } : { as: "dec" });

  // ---------- 1. Dreisatz ----------
  // uLo/uHi: realistischer Bereich des Einheitswerts (Cent bei Geld, sonst ganze Zahl)
  // measure: messbare Größe (Zeit, Liter, kg) -> in Niveau 2/3 auch halbe Einheiten
  // maxQ: größte realistische Menge (Stunden, Liter, Stück)
  const CTX_DREISATZ = [
    { money: true, u: "€", uLo: 60, uHi: 120, maxQ: 20, one: "1 Breze", many: "Brezen", pre: "{n} Brezen kosten {t}.", ask: "Wie viel kosten {m} Brezen?", rev: "Wie viele Brezen bekommt man für {b}?" },
    { money: true, u: "€", uLo: 120, uHi: 200, maxQ: 10, one: "1 Kugel Eis", many: "Kugeln Eis", pre: "{n} Kugeln Eis kosten {t}.", ask: "Wie viel kosten {m} Kugeln Eis?", rev: "Wie viele Kugeln Eis bekommt man für {b}?" },
    { money: true, u: "€", uLo: 30, uHi: 90, maxQ: 20, one: "1 Heft", many: "Hefte", pre: "{n} Hefte kosten {t}.", ask: "Wie viel kosten {m} Hefte?", rev: "Wie viele Hefte bekommt man für {b}?" },
    { money: true, u: "€", uLo: 250, uHi: 600, maxQ: 12, one: "1 Eintrittskarte", many: "Eintrittskarten", pre: "{n} Eintrittskarten fürs Schwimmbad kosten {t}.", ask: "Wie viel kosten {m} Eintrittskarten?", rev: "Wie viele Eintrittskarten bekommt man für {b}?" },
    { money: true, u: "€", uLo: 165, uHi: 205, measure: true, maxQ: 20, one: "1 Liter Benzin", many: "Liter Benzin", pre: "{n} Liter Benzin kosten {t}.", ask: "Wie viel kosten {m} Liter Benzin?", rev: "Wie viele Liter Benzin bekommt man für {b}?" },
    { money: true, u: "€", uLo: 180, uHi: 320, measure: true, maxQ: 10, one: "1 kg Äpfel", many: "kg Äpfel", pre: "{n} kg Äpfel kosten {t}.", ask: "Wie viel kosten {m} kg Äpfel?", rev: "Wie viele kg Äpfel bekommt man für {b}?" },
    { money: true, u: "€", uLo: 1000, uHi: 2000, measure: true, maxQ: 8, one: "1 Stunde", many: "Stunden", pre: "Max gibt Nachhilfe. Für {n} Stunden bekommt er {t}.", ask: "Wie viel bekommt er für {m} Stunden?", rev: "Wie viele Stunden muss er arbeiten, um {b} zu verdienen?" },
    { money: true, u: "€", uLo: 1200, uHi: 1500, measure: true, maxQ: 8, one: "1 Stunde", many: "Stunden", pre: "Lena jobbt in den Ferien im Café. In {n} Stunden verdient sie {t}.", ask: "Wie viel verdient sie in {m} Stunden?", rev: "Wie viele Stunden muss sie arbeiten, um {b} zu verdienen?" },
    { money: false, u: "km", uLo: 3, uHi: 5, measure: true, maxQ: 8, one: "1 Stunde", many: "Stunden", pre: "Ein Wanderer geht in {n} Stunden {t} weit.", ask: "Wie weit geht er in {m} Stunden?", rev: "Wie lange braucht er für {b}?" },
    { money: false, u: "km", uLo: 12, uHi: 25, measure: true, maxQ: 8, one: "1 Stunde", many: "Stunden", pre: "Ein Radfahrer fährt in {n} Stunden {t}.", ask: "Wie weit fährt er in {m} Stunden?", rev: "Wie lange braucht er für {b}?" },
    { money: false, u: "km", uLo: 60, uHi: 160, measure: true, maxQ: 5, one: "1 Stunde", many: "Stunden", pre: "Ein Zug legt in {n} Stunden {t} zurück.", ask: "Welche Strecke legt er in {m} Stunden zurück?", rev: "Wie lange braucht er für {b}?" },
    { money: false, u: "km", uLo: 12, uHi: 20, measure: true, maxQ: 20, one: "1 Liter", many: "Liter", pre: "Mit {n} Litern Benzin fährt ein Auto {t} weit.", ask: "Wie weit kommt es mit {m} Litern Benzin?", rev: "Wie viele Liter Benzin braucht es für {b}?" },
  ];

  // Einheitswert ziehen. Niveau 1: glatte Cent-Beträge, nicht genau 1 € (also kein 3,00 € für 3 Stück).
  function drawU(rng, c, level) {
    if (!c.money) return new Frac(rng.int(c.uLo, c.uHi));
    for (;;) {
      let cents = rng.int(c.uLo, c.uHi);
      if (level === 1) {
        cents = 5 * Math.round(cents / 5);
        if (cents % 100 === 0) continue;
      }
      return new Frac(cents, 100);
    }
  }

  AG.registerType({
    id: "m7-dreisatz",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Dreisatz",
    instruction: {
      1: "Löse die Sachaufgaben mit dem Dreisatz. Schließe zuerst auf die Einheit.",
      2: "Löse die Sachaufgaben mit dem Dreisatz. Das Ergebnis kann ein Komma haben.",
      3: "Löse die Sachaufgaben mit dem Dreisatz. Suche zuerst einen gemeinsamen Teiler und beantworte beide Fragen (a und b).",
    },
    merke: [
      "Bei proportionalen Größen gilt: Je mehr, desto mehr. Mit dem ", { b: "Dreisatz" }, " schließt man zuerst auf ", { b: "1" }, ": ",
      "5 Hefte → 4,50 €, 1 Heft → 0,90 €, 8 Hefte → 7,20 €.",
    ],
    cols: 1,
    generate(rng, level) {
      const c = rng.pick(CTX_DREISATZ);
      const u = drawU(rng, c, level);
      // Zählbare Dinge bleiben ganz; messbare Größen gibt es in Niveau 2/3 auch in halben Einheiten
      const st = new Frac(1, c.measure && level >= 2 ? 2 : 1);
      const kMax = st.d === 2 ? c.maxQ * 2 : c.maxQ; // größte Anzahl Schritte
      const Q = k => new Frac(k).mul(st);
      const S = x => fmtDec(x); // Menge als Text (Komma bei halben Einheiten)

      if (level < 3) {
        let n, m;
        if (level === 1) {
          const nn = rng.pick([2, 3, 4, 5, 6, 8, 10].filter(x => x <= c.maxQ));
          const mm = rng.intExcept(2, Math.min(12, c.maxQ), [nn]);
          n = new Frac(nn); m = new Frac(mm);
        } else {
          const nk = rng.int(3, Math.min(kMax, 15));
          const mk = rng.intExcept(2, Math.min(kMax, 20), [nk]);
          n = Q(nk); m = Q(mk);
        }
        const total = u.mul(n);
        const res = u.mul(m);
        return {
          q: rich(fill(c.pre, { n: S(n), t: amtS(total, c) }), " ", fill(c.ask, { m: S(m) })),
          a: amt(res, c),
          steps: [
            rich(`${S(n)} ${c.many} → `, amt(total, c)),
            rich(`${c.one} → `, amt(u, c)),
            rich(`${S(m)} ${c.many} → `, amt(res, c)),
          ],
          check: { c, n, m, total },
        };
      }

      // Niveau 3: Schluss über einen gemeinsamen Teiler g, zwei Fragen (a, b)
      let g, m1, m2, k1, k2;
      for (;;) {
        g = rng.pick([2, 3, 4]);
        m1 = rng.int(2, 6);
        m2 = rng.int(2, 6);
        if (m1 === m2 || gcd(m1, m2) !== 1) continue;
        k1 = g * m1; k2 = g * m2;
        if (k1 <= kMax && k2 <= kMax) break;
      }
      const gst = Q(g);             // Menge für den gemeinsamen Teiler
      const P = u.mul(gst);         // Preis für gst
      const j = rng.int(2, 6);
      const B = P.mul(j);           // Budget
      const cnt = gst.mul(j);       // dafür bekommt man cnt
      const q1 = Q(k1), q2 = Q(k2);
      const tot1 = u.mul(q1);
      const res2 = u.mul(q2);
      return {
        q: rich(fill(c.pre, { n: S(q1), t: amtS(tot1, c) }), " a) ", fill(c.ask, { m: S(q2) }), " b) ", fill(c.rev, { b: amtS(B, c) })),
        a: rich("a) ", amt(res2, c), `; b) ${S(cnt)} ${c.many}`),
        steps: [
          rich(`${S(q1)} ${c.many} → `, amt(tot1, c)),
          rich(`${S(gst)} ${c.many} → `, amt(P, c), `   (÷ ${m1})`),
          rich(`${S(q2)} ${c.many} → `, amt(res2, c), `   (· ${m2})`),
          rich(amt(B, c), " : ", amt(P, c), ` = ${j}`),
          rich(`${j} · ${S(gst)} = ${S(cnt)} ${c.many}`),
        ],
        check: { c, P, gst, q2, B },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (level === 3) {
        // Preis für q2 über P/gst (anderer Rechenweg als im Generator), Anzahl für das Budget
        const r = k.P.mul(k.q2).div(k.gst);
        const cnt = k.B.div(k.P).mul(k.gst);
        const exp = `a) ${amtS(r, k.c)}; b) ${fmtDec(cnt)} ${k.c.many}`;
        return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
      }
      const r = k.total.div(k.n).mul(k.m); // über die Einheit: Gesamtbetrag : n · m
      const exp = amtS(r, k.c);
      return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ---------- 2. Wertetabellen ergänzen ----------
  // fLo/fHi: realistischer Bereich des Faktors (Cent bzw. ganze Einheit)
  // xMax: größter x-Wert in Niveau 1, xMax2 in Niveau 2/3
  const CTX_TAB = [
    { xl: "Anzahl Brezen", yl: "Preis in €", u: "€", money: true, cnt: true, fLo: 60, fHi: 120, xMax: 10, xMax2: 15, intro: "In der Bäckerei kostet jede Breze gleich viel.", fac: "Faktor: 1 Breze kostet {f}" },
    { xl: "Menge in kg", yl: "Preis in €", u: "€", money: true, measure: true, fLo: 180, fHi: 320, xMax: 8, xMax2: 10, intro: "Äpfel werden auf dem Markt nach Gewicht verkauft.", fac: "Faktor: 1 kg kostet {f}" },
    { xl: "Menge in l", yl: "Preis in €", u: "€", money: true, measure: true, fLo: 110, fHi: 160, xMax: 6, xMax2: 8, intro: "Milch wird im Hofladen nach Liter verkauft.", fac: "Faktor: 1 l kostet {f}" },
    { xl: "Zeit in h", yl: "Strecke in km", u: "km", money: false, measure: true, fLo: 40, fHi: 60, xMax: 6, xMax2: 6, intro: "Ein Reisebus fährt mit gleichbleibender Geschwindigkeit.", fac: "Faktor: In 1 h fährt der Bus {f}" },
    { xl: "Zeit in min", yl: "Wasser in l", u: "l", money: false, fLo: 5, fHi: 12, xMax: 10, xMax2: 10, intro: "Aus einem Wasserhahn fließt gleichmäßig Wasser.", fac: "Faktor: In 1 min fließen {f}" },
  ];

  // Faktor ziehen (Geld: Cent; Niveau 1 glatte 10-Cent-Schritte, Niveau 3 gerade Cent-Beträge für halbe Einheiten)
  function drawF(rng, c, level) {
    if (!c.money) return new Frac(rng.int(c.fLo, c.fHi));
    if (level === 1) return new Frac(10 * rng.int(Math.ceil(c.fLo / 10), Math.floor(c.fHi / 10)), 100);
    if (level === 3) return new Frac(2 * rng.int(Math.ceil(c.fLo / 2), Math.floor(c.fHi / 2)), 100);
    return new Frac(rng.int(c.fLo, c.fHi), 100);
  }

  // mögliche x-Werte: Zählbares immer ganz, messbare Größen in Niveau 3 auch halb
  function xPool(c, level) {
    if (level === 1) return range(1, c.xMax).map(v => new Frac(v));
    if (level === 2) return range(2, c.xMax2).map(v => new Frac(v));
    return c.measure ? range(2, 2 * c.xMax2).map(j => new Frac(j, 2)) : range(2, c.xMax2).map(v => new Frac(v));
  }

  AG.registerType({
    id: "m7-wertetabelle",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Wertetabellen ergänzen",
    instruction: {
      1: "Ergänze die fehlenden Werte der proportionalen Zuordnung.",
      2: "Ergänze die Wertetabelle. Bestimme zuerst den Faktor.",
      3: "Ergänze die Wertetabelle und gib den Proportionalitätsfaktor an.",
    },
    merke: [
      "Bei einer proportionalen Zuordnung ist der Quotient ", { b: "y : x" }, " immer gleich. Dieser Wert heißt ",
      { b: "Proportionalitätsfaktor" }, ": 8 kg kosten 19,20 €, also 1 kg kostet 2,40 €.",
    ],
    cols: 1,
    generate(rng, level) {
      const c = rng.pick(CTX_TAB);
      const money = c.money;
      const k = rng.pick([4, 5]); // Wertepaare -> Spalten = k + 1 (5 oder 6)
      const f = drawF(rng, c, level);
      const pool = xPool(c, level);
      const xs = rng.shuffle(pool).slice(0, k).sort((a, b) => a.cmp(b));
      const ys = xs.map(x => f.mul(x));

      // 2 oder 3 Lücken, zufällig über die Wertezellen verteilt
      const cells = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < k; i++) cells.push([r, i]);
      const blanks = rng.shuffle(cells).slice(0, rng.pick([2, 3]));
      const isBlank = (r, i) => blanks.some(([br, bi]) => br === r && bi === i);

      const numX = x => num(x, { as: "dec" });
      const numY = y => numE(y, money);
      const table = {
        rows: [
          [[{ b: c.xl }], ...xs.map((x, i) => (isBlank(0, i) ? [{ blank: 3 }] : numX(x)))],
          [[{ b: c.yl }], ...ys.map((y, i) => (isBlank(1, i) ? [{ blank: 3 }] : numY(y)))],
        ],
      };
      const aTable = {
        rows: [
          [[{ b: c.xl }], ...xs.map(numX)],
          [[{ b: c.yl }], ...ys.map(numY)],
        ],
      };

      const [fPre, fPost] = c.fac.split("{f}");
      const i0 = range(0, k - 1).find(i => !isBlank(0, i) && !isBlank(1, i));
      const steps = [rich(amt(ys[i0], c), " : ", numX(xs[i0]), " = ", amt(f, c))];
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < k; i++) {
          if (!isBlank(r, i)) continue;
          if (r === 1) steps.push(rich(numX(xs[i]), " · ", numE(f, money), " = ", numY(ys[i])));
          else steps.push(rich(numY(ys[i]), " : ", numE(f, money), " = ", numX(xs[i])));
        }
      }

      return {
        q: rich(c.intro, " Ergänze die fehlenden Werte in der Tabelle und gib den Proportionalitätsfaktor an."),
        a: rich(fPre, amt(f, c), fPost),
        table,
        aTable,
        steps,
        check: { c, f, xs, ys, blanks: blanks.length },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
      if (blanks < 2 || blanks > 3) return `${blanks} Lücken statt 2–3`;
      if (k.c.cnt && k.xs.some(x => !x.isInt())) return "Zählbare Größe mit Komma";
      for (let i = 0; i < k.xs.length; i++) {
        if (!k.ys[i].div(k.xs[i]).eq(k.f)) return "Quotient y : x ≠ Faktor in Spalte " + i;
        if (plain(t.aTable.rows[0][i + 1]) !== plain(num(k.xs[i], { as: "dec" }))) return "aTable: x falsch";
        if (plain(t.aTable.rows[1][i + 1]) !== plain(numE(k.ys[i], k.c.money))) return "aTable: y falsch";
      }
      const exp = k.c.fac.replace("{f}", amtS(k.f, k.c));
      return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ---------- 3. Proportional oder nicht? ----------
  // np: nicht proportional (Modell mit Grundgebühr, Rabatt, Grundpreis, erste Stunde teurer)
  // f(x): Modell als Funktion der Zahl x; pool: mögliche x-Werte; lv: Niveaus
  const CTX_PR = [
    // nicht proportional
    { np: true, lv: [1, 2, 3], xl: "Gesprächsminuten", yl: "Kosten in €", money: true, pool: [10, 20, 25, 40, 50, 100], f: x => new Frac(5).add(new Frac(x, 10)), intro: "Die Tabelle gehört zu einem Handytarif." },
    { np: true, lv: [2, 3], xl: "Anzahl Stück", yl: "Preis in €", money: true, pool: [2, 4, 5, 8, 10, 12, 15, 20], f: x => (x < 10 ? new Frac(5 * x, 2) : new Frac(9 * x, 4)), intro: "Die Tabelle gehört zu einem Einkauf im Fanshop." },
    { np: true, lv: [1, 2, 3], xl: "Strecke in km", yl: "Fahrpreis in €", money: true, pool: [2, 4, 5, 8, 10, 20, 25], f: x => new Frac(4).add(new Frac(2 * x)), intro: "Die Tabelle gehört zu einer Taxifahrt." },
    { np: true, lv: [1, 2, 3], xl: "Parkdauer in h", yl: "Gebühr in €", money: true, pool: [1, 2, 4, 5, 8, 10, 20], f: x => new Frac(2 + 2 * x), intro: "Die Tabelle gehört zu einem Parkhaus." },
    // proportional
    { np: false, lv: [2, 3], xl: "Menge in l", yl: "Preis in €", money: true, qu: "€ pro Liter", pool: [2, 4, 5, 8, 10, 15, 20], f: x => new Frac(9 * x, 5), intro: "An der Tankstelle kostet Benzin überall gleich viel." },
    { np: false, lv: [1, 2, 3], xl: "Anzahl Brezen", yl: "Preis in €", money: true, qu: "€ pro Breze", pool: [2, 3, 4, 5, 6, 8, 10, 12], f: x => new Frac(9 * x, 10), intro: "In der Bäckerei kostet jede Breze gleich viel." },
    { np: false, lv: [2, 3], xl: "Anzahl Karten", yl: "Preis in €", money: true, qu: "€ pro Karte", pool: [2, 3, 4, 5, 6, 8], f: x => new Frac(15 * x, 2), intro: "Eine Kinokarte kostet an der Kasse immer gleich viel." },
    { np: false, lv: [1, 2, 3], xl: "Zeit in h", yl: "Strecke in km", money: false, qu: "km pro h", pool: [1, 2, 3, 4, 5, 6], f: x => new Frac(50 * x), intro: "Ein Reisebus fährt mit gleichbleibender Geschwindigkeit." },
  ];

  AG.registerType({
    id: "m7-proportional-pruefen",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Proportional oder nicht?",
    instruction: {
      1: "Prüfe, ob die Zuordnung proportional ist. Bilde dazu die Quotienten y : x.",
      2: "Prüfe, ob die Zuordnung proportional ist. Bilde die Quotienten und begründe deine Antwort.",
      3: "Prüfe, ob die Zuordnung proportional ist. Bilde die Quotienten aller Wertepaare und begründe genau.",
    },
    merke: [
      "Eine Zuordnung ist ", { b: "proportional" }, ", wenn alle Quotienten ", { b: "y : x" },
      " gleich sind. Beispiel: 2 : 1 = 6 : 3 = 10 : 5 = 2 → proportional. Gilt das nicht, ist sie nicht proportional.",
    ],
    cols: 1,
    generate(rng, level) {
      const wantNP = rng.chance(0.5);
      const c = rng.pick(CTX_PR.filter(x => x.lv.includes(level) && x.np === wantNP));
      const money = c.money;
      const fdig = money ? { as: "dec", digits: 2 } : { as: "dec" };
      const kk = rng.pick([4, 5]);

      let vs, xs, ys, qs;
      for (let tries = 0; tries < 300; tries++) {
        vs = rng.shuffle(c.pool).slice(0, kk).sort((a, b) => a - b);
        xs = vs.map(v => new Frac(v));
        ys = vs.map(v => c.f(v));
        qs = xs.map((x, i) => ys[i].div(x));
        // Quotienten endlich und mit höchstens drei Nachkommastellen
        if (qs.some(q => !q.isTerminating() || q.decimals() > 3)) continue;
        // das Modell entscheidet: nicht-proportionale Modelle müssen auch so aussehen
        if (qs.every(q => q.eq(qs[0])) === c.np) continue;
        break;
      }

      const prop = qs.every(q => q.eq(qs[0]));
      const numX = x => num(x, { as: "dec" });
      const numY = y => numE(y, money);
      // Quotienten: bei Geld mindestens zwei Stellen
      const qN = q => num(q, money ? { as: "dec", digits: Math.max(2, q.decimals()) } : { as: "dec" });
      const row = (label, vals, fmt) => [[{ b: label }], ...vals.map(v => fmt(v))];

      let a;
      if (prop) {
        a = rich("proportional, Quotient immer ", qN(qs[0]), " ", c.qu);
      } else {
        // zwei Quotienten, die verschieden sind
        let pi = 0, pj = 1;
        outer: for (let i = 0; i < kk; i++) for (let j = i + 1; j < kk; j++) {
          if (!qs[i].eq(qs[j])) { pi = i; pj = j; break outer; }
        }
        a = rich(
          "nicht proportional, denn die Quotienten sind verschieden: ",
          numY(ys[pi]), " : ", numX(xs[pi]), " = ", qN(qs[pi]),
          " und ",
          numY(ys[pj]), " : ", numX(xs[pj]), " = ", qN(qs[pj]),
        );
      }

      return {
        q: rich(c.intro, " Ist die Zuordnung proportional? Begründe mit den Quotienten."),
        a,
        table: { rows: [row(c.xl, xs, numX), row(c.yl, ys, numY)] },
        steps: qs.map((q, i) => rich(numY(ys[i]), " : ", numX(xs[i]), " = ", qN(q))),
        check: { c, xs, ys, prop },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const cols = t.table.rows[0].length - 1;
      if (cols < 4 || cols > 5) return `${cols} Wertepaare statt 4–5`;
      const qs = k.xs.map((x, i) => k.ys[i].div(x));
      const prop = qs.every(q => q.eq(qs[0]));
      if (prop === k.c.np) return "Modell und Entscheidung passen nicht zusammen";
      if (prop !== k.prop) return "Entscheidung proportional/nicht stimmt nicht";
      const s = plain(t.a);
      if (prop) return s.startsWith("proportional, Quotient immer ") || `Antwort falsch: „${s}“`;
      return s.startsWith("nicht proportional, denn") || `Antwort falsch: „${s}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
