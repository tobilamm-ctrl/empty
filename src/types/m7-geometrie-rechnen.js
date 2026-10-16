// M7 LB 3: Winkelsumme im Dreieck und Maßstab (Karte – Wirklichkeit).
(function (AG) {
  const { Frac, num, rich, plain, fmtDec, fmtInt } = AG;

  const LB3 = "Geometrische Figuren, Körper und Lagebeziehungen";

  // ---------- 4. Winkelsumme im Dreieck ----------
  AG.registerType({
    id: "m7-winkelsumme",
    klasse: "7",
    zug: "M",
    lb: "3",
    lbTitle: LB3,
    title: "Winkelsumme im Dreieck",
    instruction: {
      1: "Berechne den fehlenden Winkel im Dreieck.",
      2: "Berechne den fehlenden Winkel. Achte auf die besondere Form des Dreiecks.",
      3: "Berechne die Winkel. Stelle zuerst eine Gleichung auf.",
    },
    merke: [
      "Im Dreieck beträgt die Winkelsumme 180°: α + β + γ = 180°. Beispiel: α = 52°, β = 67° → γ = 180° − 52° − 67° = 61°.",
    ],
    cols: 2,
    generate(rng, level) {
      let al, be, ga, q, a, steps, exp;

      if (level === 1) {
        for (;;) {
          al = rng.int(15, 120);
          be = rng.int(15, 120);
          if (al + be <= 165) break;
        }
        ga = 180 - al - be;
        q = rich(`Im Dreieck ABC gilt α = ${al}° und β = ${be}°. Berechne γ.`);
        steps = [rich(`γ = 180° − α − β = 180° − ${al}° − ${be}° = ${ga}°`)];
        a = rich(`γ = ${ga}°`);
        exp = [ga];
      } else if (level === 2) {
        const v = rng.int(0, 3);
        if (v === 0) {
          // rechtwinklig: γ = 90°, α gegeben
          al = rng.int(15, 80); ga = 90; be = 90 - al;
          q = rich(`Ein rechtwinkliges Dreieck hat einen rechten Winkel γ = 90°. Der Winkel α misst ${al}°. Berechne β.`);
          steps = [rich("α + β = 180° − 90° = 90°"), rich(`β = 90° − ${al}° = ${be}°`)];
          a = rich(`β = ${be}°`);
          exp = [be];
        } else if (v === 1) {
          // gleichschenklig, Basiswinkel gegeben -> Spitzenwinkel gesucht
          const b = rng.int(20, 80);
          al = b; be = b; ga = 180 - 2 * b;
          q = rich(`Ein gleichschenkliges Dreieck hat an der Basis zwei gleich große Winkel mit je ${b}°. Berechne den Winkel an der Spitze.`);
          steps = [rich(`2 · ${b}° = ${2 * b}°`), rich(`180° − ${2 * b}° = ${ga}°`)];
          a = rich(`Winkel an der Spitze = ${ga}°`);
          exp = [ga];
        } else if (v === 2) {
          // gleichschenklig, Spitzenwinkel gegeben -> Basiswinkel gesucht
          const s = 2 * rng.int(10, 70); // gerade Gradzahl, damit der Basiswinkel ganz ist
          ga = s; al = (180 - s) / 2; be = al;
          q = rich(`Ein gleichschenkliges Dreieck hat an der Spitze einen Winkel von ${s}°. Berechne einen Basiswinkel.`);
          steps = [rich(`180° − ${s}° = ${180 - s}°`), rich(`${180 - s}° : 2 = ${al}°`)];
          a = rich(`Basiswinkel = ${al}°`);
          exp = [al];
        } else {
          // gleichseitig: alle Winkel gleich groß
          al = 60; be = 60; ga = 60;
          q = rich("Ein gleichseitiges Dreieck hat drei gleich große Winkel. Berechne den Winkel α. Hinweis: Im gleichseitigen Dreieck sind alle Winkel gleich groß.");
          steps = [rich("α = β = γ, also 3 · α = 180°"), rich("α = 180° : 3 = 60°")];
          a = rich("α = 60°");
          exp = [60];
        }
      } else {
        // Winkel als Term; ein Winkel ist ein Vielfaches oder Summe eines anderen
        if (rng.chance(0.5)) {
          // α ist k-mal so groß wie β
          const k = rng.pick([2, 3]);
          for (;;) {
            be = rng.int(10, 50); al = k * be; ga = 180 - (k + 1) * be;
            if (ga >= 10) break;
          }
          const word = k === 2 ? "doppelt so groß" : "dreimal so groß";
          q = rich(`Im Dreieck ist α ${word} wie β. Außerdem ist γ = ${ga}°. Berechne α und β.`);
          steps = [
            rich(`α + β = 180° − ${ga}° = ${180 - ga}°`),
            rich(`${k} · β + β = ${k + 1} · β = ${180 - ga}°`),
            rich(`β = ${180 - ga}° : ${k + 1} = ${be}°`),
            rich(`α = ${k} · ${be}° = ${al}°`),
          ];
        } else {
          // α ist um d größer als β
          const d = rng.int(10, 40);
          for (;;) {
            be = rng.int(10, 60); al = be + d; ga = 180 - al - be;
            if (ga >= 10 && ga <= 150) break;
          }
          q = rich(`Im Dreieck ist α um ${d}° größer als β. Außerdem ist γ = ${ga}°. Berechne α und β.`);
          steps = [
            rich(`α + β = 180° − ${ga}° = ${180 - ga}°`),
            rich(`β + ${d}° + β = ${180 - ga}°, also 2 · β = ${180 - ga - d}°`),
            rich(`β = ${180 - ga - d}° : 2 = ${be}°`),
            rich(`α = ${be}° + ${d}° = ${al}°`),
          ];
        }
        a = rich(`α = ${al}°; β = ${be}°`);
        exp = [al, be];
      }

      return { q, a, steps, check: { al, be, ga, exp } };
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (k.al <= 0 || k.be <= 0 || k.ga <= 0) return "Winkel nicht positiv";
      if (k.al + k.be + k.ga !== 180) return "Winkelsumme ≠ 180°";
      const s = plain(t.a);
      for (const v of k.exp) {
        // „5°“ darf nicht in „15°“ gefunden werden
        if (!new RegExp("(^|[^\\d])" + v + "°").test(s)) return `Ergebnis ${v}° fehlt in „${s}“`;
      }
      return true;
    },
  });

  // ---------- 5. Maßstab ----------
  // Niveau 1: Grundriss, Lageplan, Stadtplan (Maßstab 1 : 100 bis 1 : 10 000), Umrechnung in m
  const ORT_L1 = [
    { N: 100, ort: "Auf dem Grundriss" },
    { N: 1000, ort: "Auf dem Lageplan" },
    { N: 10000, ort: "Auf dem Stadtplan" },
  ];
  // Niveau 2: Stadtplan, Wanderkarte, Straßenkarte; Längen mit einer Nachkommastelle (Zehntel-cm)
  const ints = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => (a + i) * 10);
  const halves = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => (a + i) * 10 + 5);
  const ORT_L2 = [
    { N: 20000, ort: "Auf dem Stadtplan", cs: [...ints(1, 15), ...halves(1, 12)] },
    { N: 25000, ort: "Auf der Wanderkarte", cs: ints(1, 15) },
    { N: 50000, ort: "Auf der Wanderkarte", cs: [...ints(1, 15), ...halves(1, 8)] },
    { N: 200000, ort: "Auf der Straßenkarte", cs: [...ints(1, 12), ...halves(1, 6)] },
  ];
  const FRAGE_KM = [
    "Wie lang ist die Strecke in Wirklichkeit (in km)?",
    "Wie lang ist die Strecke in Wirklichkeit? Gib das Ergebnis in km an.",
  ];
  // Niveau 3: Bauplan bis Straßenkarte
  const ORT_L3 = [
    { N: 50, ort: "Auf dem Bauplan" },
    { N: 100, ort: "Auf dem Grundriss" },
    { N: 1000, ort: "Auf dem Lageplan" },
    { N: 10000, ort: "Auf dem Stadtplan" },
    { N: 20000, ort: "Auf dem Stadtplan" },
    { N: 25000, ort: "Auf der Wanderkarte" },
    { N: 50000, ort: "Auf der Wanderkarte" },
    { N: 200000, ort: "Auf der Straßenkarte" },
  ];

  AG.registerType({
    id: "m7-masstab",
    klasse: "7",
    zug: "M",
    lb: "3",
    lbTitle: LB3,
    title: "Maßstab",
    instruction: {
      1: "Rechne zwischen Karte und Wirklichkeit um. Gib das Ergebnis in der angegebenen Einheit an.",
      2: "Rechne zwischen Karte und Wirklichkeit um. Achte auf die Einheiten (cm, m, km).",
      3: "Bestimme den Maßstab. Achte auf die Einheiten und kürze sinnvoll.",
    },
    merke: [
      "Der Maßstab 1 : N bedeutet: 1 cm auf der Karte entspricht N cm in der Wirklichkeit. ",
      "Beispiel: 1 : 25 000 → 4 cm auf der Karte sind 4 · 25 000 cm = 100 000 cm = 1 km.",
    ],
    cols: 2,
    generate(rng, level) {
      let q, a, steps, check;

      if (level === 1) {
        const { N, ort } = rng.pick(ORT_L1);
        const c = new Frac(rng.int(2, 12));
        const Rm = c.mul(N).div(100); // Wirklichkeit in m, ganzzahlig
        if (rng.chance(0.5)) {
          q = rich(`${ort} ist eine Strecke ${fmtDec(c)} cm lang. Der Maßstab ist 1 : ${fmtInt(N)}. Wie lang ist die Strecke in Wirklichkeit (in m)?`);
          steps = [rich(`${fmtDec(c)} cm · ${fmtInt(N)} = ${fmtInt(c.n * N)} cm`), rich(`${fmtInt(c.n * N)} cm : 100 = ${fmtInt(Rm.n)} m`)];
          a = rich(`${fmtInt(Rm.n)} m`);
          check = { kind: "karte", c, N, div: 100, unit: "m" };
        } else {
          q = rich(`Eine Strecke ist in Wirklichkeit ${fmtInt(Rm.n)} m lang. Wie lang ist sie auf der Karte mit dem Maßstab 1 : ${fmtInt(N)} (in cm)?`);
          steps = [rich(`${fmtInt(Rm.n)} m = ${fmtInt(Rm.n * 100)} cm`), rich(`${fmtInt(Rm.n * 100)} cm : ${fmtInt(N)} = ${fmtDec(c)} cm`)];
          a = rich(`${fmtDec(c)} cm`);
          check = { kind: "wirk", c, N, real: Rm, div: 100, unit: "m" };
        }
      } else if (level === 2) {
        const grp = rng.pick(ORT_L2);
        const N = grp.N;
        const c = new Frac(rng.pick(grp.cs), 10); // Karte in cm, eine Nachkommastelle möglich
        const cN = c.mul(N);                        // Wirklichkeit in cm
        const R = cN.div(100000);                   // Wirklichkeit in km
        if (rng.chance(0.5)) {
          q = rich(`${grp.ort} ist eine Strecke ${fmtDec(c)} cm lang. Der Maßstab ist 1 : ${fmtInt(N)}. ${rng.pick(FRAGE_KM)}`);
          steps = [rich(`${fmtDec(c)} cm · ${fmtInt(N)} = ${fmtDec(cN)} cm`), rich(`${fmtDec(cN)} cm : 100 000 = ${fmtDec(R)} km`)];
          a = rich(`${fmtDec(R)} km`);
          check = { kind: "karte", c, N, div: 100000, unit: "km" };
        } else {
          q = rich(`Eine Strecke ist in Wirklichkeit ${fmtDec(R)} km lang. Wie lang ist sie auf der Karte mit dem Maßstab 1 : ${fmtInt(N)} (in cm)?`);
          steps = [rich(`${fmtDec(R)} km = ${fmtDec(cN)} cm`), rich(`${fmtDec(cN)} cm : ${fmtInt(N)} = ${fmtDec(c)} cm`)];
          a = rich(`${fmtDec(c)} cm`);
          check = { kind: "wirk", c, N, real: R, div: 100000, unit: "km" };
        }
      } else {
        if (rng.chance(0.5)) {
          // Maßstab aus Karten- und Naturlänge
          const { N, ort } = rng.pick(ORT_L3);
          const c = new Frac(rng.pick([2, 3, 4, 5, 6, 8, 10]));
          const big = N >= 20000; // große Maßstäbe: Wirklichkeit in km, sonst in m
          const unit = big ? "km" : "m";
          const div = big ? 100000 : 100;
          const R = c.mul(N).div(div);    // Wirklichkeit in der gewählten Einheit
          const Rcm = R.mul(div);         // ... und in cm
          q = rich(`${ort} misst die Strecke ${fmtDec(c)} cm. In Wirklichkeit ist sie ${fmtDec(R)} ${unit} lang. Bestimme den Maßstab.`);
          steps = [rich(`${fmtDec(R)} ${unit} = ${fmtDec(Rcm)} cm`), rich(`${fmtDec(Rcm)} cm : ${fmtDec(c)} cm = ${fmtInt(N)}`)];
          a = rich(`Maßstab 1 : ${fmtInt(N)}`);
          check = { kind: "best", c, Rcm };
        } else {
          // Vergrößerungsmaßstab, z. B. 20 : 1 bei Insekten
          let R, F, I;
          for (;;) {
            R = rng.pick([10, 20, 30, 40]); // mm
            F = rng.pick([2, 5, 10, 20, 25]);
            I = (F * R) / 10; // Bildlänge in cm
            if (I <= 40) break;
          }
          q = rich(`Ein Käfer ist in Wirklichkeit ${R} mm lang. Auf einem Bild ist er ${I} cm lang. Bestimme den Vergrößerungsmaßstab.`);
          steps = [rich(`${I} cm = ${I * 10} mm`), rich(`${I * 10} mm : ${R} mm = ${F}`)];
          a = rich(`Vergrößerungsmaßstab ${F} : 1`);
          check = { kind: "verg", R, F, I };
        }
      }
      return { q, a, steps, check };
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(t.a);
      switch (k.kind) {
        case "karte": {
          // Wirklichkeit = Karte · N, umgerechnet in km bzw. m
          const real = k.c.mul(k.N).div(k.div);
          const exp = `${fmtDec(real)} ${k.unit}`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        case "wirk": {
          // Karte = Wirklichkeit · 100 000 cm / N (bzw. 100 cm / N)
          const cm = k.real.mul(k.div).div(k.N);
          if (!cm.eq(k.c)) return "Kartenlänge stimmt nicht";
          const exp = `${fmtDec(k.c)} cm`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        case "best": {
          const N = k.Rcm.div(k.c);
          const exp = `Maßstab 1 : ${fmtInt(N.n)}`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        case "verg": {
          const F = new Frac(k.I * 10).div(k.R);
          const exp = `Vergrößerungsmaßstab ${F.n} : 1`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        default:
          return "unbekannter Fall";
      }
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
