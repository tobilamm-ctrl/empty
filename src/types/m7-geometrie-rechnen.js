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
        if (rng.chance(0.5)) {
          // gleichschenklig: zwei Basiswinkel gleich groß
          const b = rng.int(20, 80);
          al = b; be = b; ga = 180 - 2 * b;
          q = rich(`Ein gleichschenkliges Dreieck hat an der Basis zwei gleich große Winkel mit je ${b}°. Berechne den Winkel an der Spitze.`);
          steps = [rich(`2 · ${b}° = ${2 * b}°`), rich(`180° − ${2 * b}° = ${ga}°`)];
          a = rich(`Winkel an der Spitze = ${ga}°`);
          exp = [ga];
        } else {
          // rechtwinklig: γ = 90°, α gegeben
          al = rng.int(15, 80); ga = 90; be = 90 - al;
          q = rich(`Ein rechtwinkliges Dreieck hat einen rechten Winkel γ = 90°. Der Winkel α misst ${al}°. Berechne β.`);
          steps = [rich("α + β = 180° − 90° = 90°"), rich(`β = 90° − ${al}° = ${be}°`)];
          a = rich(`β = ${be}°`);
          exp = [be];
        }
      } else {
        // Winkel als Term; γ oder ein Winkel ist gegeben
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
  const PLACE = ["Auf einer Wanderkarte", "Auf einer Landkarte", "Auf einem Stadtplan"];

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
      const place = rng.pick(PLACE);
      let q, a, steps, check;

      if (level === 1) {
        const N = rng.pick([100, 1000, 10000]);
        const c = rng.int(2, 12);
        const Rm = (c * N) / 100; // Wirklichkeit in m, immer ganzzahlig
        if (rng.chance(0.5)) {
          q = rich(`${place} ist eine Strecke ${c} cm lang. Der Maßstab ist 1 : ${fmtInt(N)}. Wie lang ist die Strecke in Wirklichkeit (in m)?`);
          steps = [rich(`${c} cm · ${fmtInt(N)} = ${fmtInt(c * N)} cm`), rich(`${fmtInt(c * N)} cm : 100 = ${fmtInt(Rm)} m`)];
          a = rich(`${fmtInt(Rm)} m`);
          check = { kind: "karte", c, N, div: 100, unit: "m" };
        } else {
          q = rich(`Eine Strecke ist in Wirklichkeit ${fmtInt(Rm)} m lang. Wie lang ist sie auf der Karte mit dem Maßstab 1 : ${fmtInt(N)} (in cm)?`);
          steps = [rich(`${fmtInt(Rm)} m = ${fmtInt(Rm * 100)} cm`), rich(`${fmtInt(Rm * 100)} cm : ${fmtInt(N)} = ${c} cm`)];
          a = rich(`${c} cm`);
          check = { kind: "wirk", c, N, real: new Frac(Rm), div: 100, unit: "m" };
        }
      } else if (level === 2) {
        const N = rng.pick([25000, 50000]);
        const c = N === 25000 ? rng.pick([2, 4, 6, 8, 10, 12]) : rng.int(1, 10);
        const R = new Frac(c * N, 100000); // Wirklichkeit in km
        if (rng.chance(0.5)) {
          q = rich(`${place} ist eine Strecke ${c} cm lang. Der Maßstab ist 1 : ${fmtInt(N)}. Wie lang ist die Strecke in Wirklichkeit (in km)?`);
          steps = [rich(`${c} cm · ${fmtInt(N)} = ${fmtInt(c * N)} cm`), rich(`${fmtInt(c * N)} cm : 100 000 = ${fmtDec(R)} km`)];
          a = rich(`${fmtDec(R)} km`);
          check = { kind: "karte", c, N, div: 100000, unit: "km" };
        } else {
          q = rich(`Eine Strecke ist in Wirklichkeit ${fmtDec(R)} km lang. Wie lang ist sie auf der Karte mit dem Maßstab 1 : ${fmtInt(N)} (in cm)?`);
          steps = [rich(`${fmtDec(R)} km = ${fmtInt(c * N)} cm`), rich(`${fmtInt(c * N)} cm : ${fmtInt(N)} = ${c} cm`)];
          a = rich(`${c} cm`);
          check = { kind: "wirk", c, N, real: R, div: 100000, unit: "km" };
        }
      } else {
        if (rng.chance(0.5)) {
          // Maßstab aus Karten- und Naturlänge
          const N = rng.pick([5000, 10000, 20000, 25000, 40000, 50000, 75000, 100000]);
          const c = rng.pick([2, 3, 4, 5, 6, 8, 10]);
          const Rm = (c * N) / 100;
          q = rich(`${place} misst die Strecke ${c} cm. In Wirklichkeit ist sie ${fmtInt(Rm)} m lang. Bestimme den Maßstab.`);
          steps = [rich(`${fmtInt(Rm)} m = ${fmtInt(Rm * 100)} cm`), rich(`${fmtInt(Rm * 100)} cm : ${c} cm = ${fmtInt(N)}`)];
          a = rich(`Maßstab 1 : ${fmtInt(N)}`);
          check = { kind: "best", c, N, Rm };
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
          // Wirklichkeit = Karte · N, umgerechnet in km (bzw. m)
          const real = new Frac(k.c).mul(k.N).div(k.div);
          const exp = `${fmtDec(real)} ${k.unit}`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        case "wirk": {
          // Karte = Wirklichkeit · 100 cm / N
          const cm = k.real.mul(k.div).div(k.N);
          if (!cm.eq(k.c)) return "Kartenlänge stimmt nicht";
          const exp = `${k.c} cm`;
          return s === exp || `erwartet „${exp}“, steht „${s}“`;
        }
        case "best": {
          const N = new Frac(k.Rm).mul(100).div(k.c);
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
