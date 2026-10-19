// M10 LB 5: Kugel – Volumen (m10-kugel-volumen) und Oberfläche (m10-kugel-oberflaeche), mit Skizzen.
// Rechnung mit π ≈ 3,14 (wie in den anderen Klassen). Vorbild für Skizzen: m9-pythagoras.js.
(function (AG) {
  const { rich } = AG;
  const KL = "10", ZUG = "M", LB = "5", LBT = "Kugel", TOPIC = "koerper";
  const PI = 3.14;
  const PIT = "Rechne mit π ≈ 3,14.";
  const RAD = Math.PI / 180;
  const W = 75, H = 45;   // Skizzenfeld bei cols 2 (mm)
  const F43 = { f: [4, 3] };   // Bruch 4/3 mit waagerechtem Bruchstrich

  // ---------- Zahlen und Rundung ----------
  const fx = (x, n) => (Math.round(x * 10 ** n) / 10 ** n).toFixed(n).replace(".", ",");
  const safe = (x, n) => { const s = x * 10 ** n; return Math.abs(s - Math.floor(s) - 0.5) > 1e-6; };
  const thou = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");   // 1500 → „1 500“
  const dn = (x, n) => fx(x, n).replace(/^(\d+)/, m => thou(Number(m)));    // 11488,2 → „11 488,2“
  const num = s => parseFloat(s.replace(/\s/g, "").replace(",", "."));
  const vol = r => (4 / 3) * PI * r ** 3;   // cm³
  const area = r => 4 * PI * r * r;         // cm²

  // Prüfung gegen den gespeicherten Sollwert (check)
  function verifyValue(t) {
    const k = t.check;
    if (!k) return "kein Prüfdatensatz";
    const s = AG.plain(t.a);
    if (!s.includes(k.want)) return `Ergebnis „${k.want}“ fehlt in „${s}“`;
    if (Math.abs(num(k.want) - k.value) > 0.5 * 10 ** -k.dec + 1e-9) return `Wert ${k.want} weicht von ${k.value} ab`;
    return true;
  }

  // Beschriftungen: keine Überlappung, nichts ragt aus dem Feld (Textbreite geschätzt)
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
  function retry(make) {
    for (let i = 0; i < 200; i++) {
      const t = make();
      if (t && [t.fig, t.aFig].every(f => !f || labelsClean(f))) return t;
    }
    throw new Error("Skizze: keine saubere Beschriftung gefunden");
  }

  // ---------- Skizzen ----------
  // Halbellipse eines Kreises in der Waagerechten: vorne (unten) bzw. hinten (oben)
  const ell = (cx, cy, R, ry, front) => `M${cx - R},${cy} A${R},${ry} 0 0 ${front ? 0 : 1} ${cx + R},${cy}`;

  // Kugel: Umriss, Äquator (Vorderseite durchgezogen, Rückseite gestrichelt), Radius oder Durchmesser
  function sphere(lab, mode) {
    const s = AG.sketch(W, H);
    const R = 16, ry = 5, cx = 26, cy = 22.5;
    s.circle([cx, cy], R);
    s.path(ell(cx, cy, R, ry, true));
    s.path(ell(cx, cy, R, ry, false), { dash: true });
    const c = Math.cos(35 * RAD), sn = Math.sin(35 * RAD);
    if (mode === "d") s.line([cx - R * c, cy + R * sn], [cx + R * c, cy - R * sn]);
    else s.line([cx, cy], [cx + R * c, cy - R * sn]);
    s.label([cx + R + 3, cy - R * 0.55], lab, { anchor: "start" });
    return s.done();
  }

  // Halbkugel (Kuppel ohne Grundfläche): Oberseite, Grundkreis, Radius auf der Grundfläche
  function dome(lab) {
    const s = AG.sketch(W, H);
    const R = 16, ry = 5, cx = 30, cy = 30;
    s.path(`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`);
    s.path(ell(cx, cy, R, ry, true));
    s.path(ell(cx, cy, R, ry, false), { dash: true });
    s.line([cx, cy], [cx + R, cy]);
    s.label([cx + R / 2, cy + ry + 3.5], lab, { anchor: "middle" });
    return s.done();
  }

  // Zylinder ohne Boden mit aufgesetzter Halbkugel (Silo): Radius unten, Höhe des Zylinders rechts
  function silo(labR, labH, ratio) {
    const s = AG.sketch(W, H);
    const R = 10, ry = 3, cx = 28, yb = 36;
    const hd = R * Math.min(Math.max(ratio, 0.9), 2.2);
    const yt = yb - hd;
    s.line([cx - R, yb], [cx - R, yt]);
    s.line([cx + R, yb], [cx + R, yt]);
    s.path(ell(cx, yb, R, ry, true));                                  // Unterkante vorne
    s.path(`M${cx - R},${yt} A${R},${R} 0 0 1 ${cx + R},${yt}`);        // Halbkugel oben
    s.path(ell(cx, yt, R, ry, true));                                  // Übergang vorne
    s.line([cx, yb], [cx + R, yb]);
    s.label([cx + R / 2, yb + ry + 3.5], labR, { anchor: "middle" });
    s.label([cx + R + 3, (yt + yb) / 2], labH, { anchor: "start" });
    return s.done();
  }

  // ---------- Typ 4: Volumen ----------
  // L1: Volumen aus Radius oder Durchmesser
  function volL1(rng) {
    for (let i = 0; i < 300; i++) {
      const r = rng.int(1, 20), useD = rng.chance(0.5);
      const V = vol(r);
      if (!safe(V, 1)) continue;
      const Vs = dn(V, 1);
      const steps = [];
      if (useD) steps.push(rich(`r = d : 2 = ${2 * r} cm : 2 = ${r} cm`));
      steps.push(rich("V = ", F43, ` · 3,14 · ${r}³ cm³`));
      steps.push(rich("V = ", F43, ` · 3,14 · ${r ** 3} cm³ ≈ ${Vs} cm³`));
      const lab = useD ? `d = ${2 * r} cm` : `r = ${r} cm`;
      return {
        q: rich(useD ? `Eine Kugel hat den Durchmesser d = ${2 * r} cm.` : `Eine Kugel hat den Radius r = ${r} cm.`, ` Berechne ihr Volumen. ${PIT}`),
        a: rich(`V ≈ ${Vs} cm³`),
        steps, fig: sphere(lab, useD ? "d" : "r"), inline: false,
        check: { want: Vs, value: V, dec: 1 },
      };
    }
    throw new Error("m10-kugel-volumen: keine Zahlen gefunden");
  }

  // L2a: Ball mit Durchmesser – Luftvolumen in Litern
  function ballL(rng) {
    const d = 2 * rng.int(5, 20), r = d / 2, V = vol(r), dm = V / 1000;
    const Vs = dn(V, 1);
    if (!safe(V, 1) || !safe(dm, 2) || fx(dm, 2) !== fx(num(Vs) / 1000, 2)) return null;
    return {
      q: rich(`Ein Ball hat einen Durchmesser von ${d} cm. Wie viel Liter Luft passen hinein? (1 ℓ = 1 dm³) ${PIT}`),
      a: rich(`V ≈ ${fx(dm, 2)} ℓ`),
      steps: [
        rich(`r = d : 2 = ${d} cm : 2 = ${r} cm`),
        rich("V = ", F43, ` · 3,14 · ${r}³ cm³ ≈ ${Vs} cm³`),
        rich(`V ≈ ${Vs} cm³ = ${fx(dm, 2)} dm³ = ${fx(dm, 2)} ℓ`),
      ],
      fig: sphere(`d = ${d} cm`, "d"), inline: false,
      check: { want: fx(dm, 2), value: dm, dec: 2 },
    };
  }

  // L2b: Stahlkugel mit Radius oder Durchmesser – Masse mit Dichte 7,8 g/cm³
  function stahlL(rng) {
    const r = rng.int(1, 15), useD = rng.chance(0.5), V = vol(r);
    if (!safe(V, 1)) return null;
    const V1 = dn(V, 1), m = num(V1) * 7.8, mEx = V * 7.8;
    if (!safe(mEx / 1000, 2) || fx(m / 1000, 2) !== fx(mEx / 1000, 2)) return null;
    const gegeben = useD ? `einen Durchmesser d = ${2 * r} cm` : `einen Radius r = ${r} cm`;
    return {
      q: rich(`Eine Kugel aus Stahl hat ${gegeben}. Die Dichte von Stahl beträgt 7,8 g/cm³. Berechne die Masse der Kugel in kg. ${PIT}`),
      a: rich(`m ≈ ${fx(mEx / 1000, 2)} kg`),
      steps: [
        ...(useD ? [rich(`r = d : 2 = ${2 * r} cm : 2 = ${r} cm`)] : []),
        rich("V = ", F43, ` · 3,14 · ${r}³ cm³ ≈ ${V1} cm³`),
        rich(`m = V · ρ ≈ ${V1} cm³ · 7,8 g/cm³ ≈ ${dn(m, 1)} g`),
        rich(`m ≈ ${fx(m / 1000, 2)} kg`),
      ],
      fig: sphere(useD ? `d = ${2 * r} cm` : `r = ${r} cm`, useD ? "d" : "r"), inline: false,
      check: { want: fx(mEx / 1000, 2), value: mEx / 1000, dec: 2 },
    };
  }

  function volL2(rng) {
    for (let i = 0; i < 300; i++) {
      const t = rng.chance(0.5) ? ballL(rng) : stahlL(rng);
      if (t) return t;
    }
    throw new Error("m10-kugel-volumen: keine Zahlen gefunden");
  }

  // L3: Radius aus dem Volumen (dritte Wurzel) – Stahlkugel über die Masse oder Ball über das Volumen
  function stahlUmkehr(rng) {
    const m = 100 + 50 * rng.int(0, 28);
    const V = m / 7.8;
    const V1 = fx(V, 1), R3n = 3 * num(V1) / (4 * PI), R3 = fx(R3n, 2);
    const rEx = Math.cbrt(3 * V / (4 * PI));
    if (!safe(V, 1) || !safe(R3n, 2) || !safe(rEx, 2) || fx(Math.cbrt(num(R3)), 2) !== fx(rEx, 2)) return null;
    return {
      q: rich(`Eine Stahlkugel (Dichte 7,8 g/cm³) hat die Masse ${m} g. Berechne ihren Radius. ${PIT}`),
      a: rich(`r ≈ ${fx(rEx, 2)} cm`),
      steps: [
        rich(`V = m : ρ = ${m} g : 7,8 g/cm³ ≈ ${V1} cm³`),
        rich(`r³ = 3 · V : (4 · 3,14) ≈ 3 · ${V1} cm³ : 12,56 ≈ ${R3} cm³`),
        rich(`r = ∛${R3} ≈ ${fx(rEx, 2)} cm`),
      ],
      fig: sphere("r = ?", "r"), aFig: sphere(`r = ${fx(rEx, 2)} cm`, "r"), inline: false,
      check: { want: fx(rEx, 2), value: rEx, dec: 2 },
    };
  }
  function ballUmkehr(rng) {
    const Vl = rng.int(4, 16) / 2;
    const V = Vl * 1000;
    const R3n = 3 * V / (4 * PI), R3 = fx(R3n, 2);
    const rEx = Math.cbrt(R3n);
    if (!safe(R3n, 2) || fx(Math.cbrt(num(R3)), 2) !== fx(rEx, 2)) return null;
    const vtxt = Vl === Math.floor(Vl) ? String(Vl) : fx(Vl, 1);
    return {
      q: rich(`Ein kugelförmiger Ball fasst ${vtxt} ℓ Luft. Berechne den Radius des Balls. ${PIT}`),
      a: rich(`r ≈ ${fx(rEx, 2)} cm`),
      steps: [
        rich(`V = ${vtxt} ℓ = ${vtxt} dm³ = ${V} cm³`),
        rich(`r³ = 3 · ${V} cm³ : (4 · 3,14) ≈ ${R3} cm³`),
        rich(`r = ∛${R3} ≈ ${fx(rEx, 2)} cm`),
      ],
      fig: sphere("r = ?", "r"), aFig: sphere(`r = ${fx(rEx, 2)} cm`, "r"), inline: false,
      check: { want: fx(rEx, 2), value: rEx, dec: 2 },
    };
  }
  function volL3(rng) {
    for (let i = 0; i < 300; i++) {
      const t = rng.chance(0.5) ? stahlUmkehr(rng) : ballUmkehr(rng);
      if (t) return t;
    }
    throw new Error("m10-kugel-volumen: keine Zahlen gefunden");
  }

  AG.registerType({
    id: "m10-kugel-volumen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Volumen der Kugel",
    instruction: {
      1: "Berechne das Volumen der Kugel. Runde auf eine Nachkommastelle.",
      2: "Berechne. Achte auf die Einheiten. Runde auf zwei Nachkommastellen.",
      3: "Berechne den fehlenden Radius. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Kugelvolumen: ", { b: "V = 4/3 · π · r³" }, ". Beispiel: r = 3 cm → V = 4/3 · 3,14 · 3³ cm³ ≈ 113,0 cm³. ",
      "Umgekehrt berechnet man den Radius mit der dritten Wurzel: r = ∛(3V : (4 · π)).",
    ],
    cols: 2,
    levels: [1, 2, 3],
    generate: (rng, level) => retry(() => (level === 1 ? volL1(rng) : level === 2 ? volL2(rng) : volL3(rng))),
    verify: verifyValue,
  });

  // ---------- Typ 5: Oberfläche ----------
  // L1: Oberfläche aus Radius oder Durchmesser
  function oberL1(rng) {
    for (let i = 0; i < 300; i++) {
      const r = rng.int(1, 20), useD = rng.chance(0.5);
      const O = area(r);
      if (!safe(O, 1)) continue;
      const Os = dn(O, 1);
      const steps = [];
      if (useD) steps.push(rich(`r = d : 2 = ${2 * r} cm : 2 = ${r} cm`));
      steps.push(rich(`O = 4 · 3,14 · ${r}² cm²`));
      steps.push(rich(`O = 4 · 3,14 · ${r * r} cm² ≈ ${Os} cm²`));
      const lab = useD ? `d = ${2 * r} cm` : `r = ${r} cm`;
      return {
        q: rich(useD ? `Eine Kugel hat den Durchmesser d = ${2 * r} cm.` : `Eine Kugel hat den Radius r = ${r} cm.`, ` Berechne ihre Oberfläche. ${PIT}`),
        a: rich(`O ≈ ${Os} cm²`),
        steps, fig: sphere(lab, useD ? "d" : "r"), inline: false,
        check: { want: Os, value: O, dec: 1 },
      };
    }
    throw new Error("m10-kugel-oberflaeche: keine Zahlen gefunden");
  }

  // L2: Radius aus der Oberfläche (Quadratwurzel)
  function oberL2(rng) {
    const O = rng.int(200, 2000);
    const R2n = O / (4 * PI), R2 = fx(R2n, 2);
    const rEx = Math.sqrt(O / (4 * PI));
    if (!safe(R2n, 2) || !safe(rEx, 2) || fx(Math.sqrt(num(R2)), 2) !== fx(rEx, 2)) return null;
    return {
      q: rich(`Eine Metallkugel hat eine Oberfläche von ${thou(O)} cm². Berechne den Radius der Kugel. ${PIT}`),
      a: rich(`r ≈ ${fx(rEx, 2)} cm`),
      steps: [
        rich(`r² = O : (4 · 3,14) = ${thou(O)} cm² : 12,56 ≈ ${R2} cm²`),
        rich(`r = √${R2} ≈ ${fx(rEx, 2)} cm`),
      ],
      fig: sphere("r = ?", "r"), aFig: sphere(`r = ${fx(rEx, 2)} cm`, "r"), inline: false,
      check: { want: fx(rEx, 2), value: rEx, dec: 2 },
    };
  }

  // L3a: Halbkugel (Kuppel ohne Grundfläche): O = 2 · π · r²
  function kuppel(rng) {
    const r = rng.int(2, 8), O = 2 * PI * r * r, Os = fx(O, 2);
    return {
      q: rich(`Eine halbkugelförmige Kuppel hat den Radius r = ${r} m. Die Grundfläche ist offen. Berechne die Oberfläche der Kuppel. ${PIT}`),
      a: rich(`O ≈ ${Os} m²`),
      steps: [
        rich(`O = 2 · 3,14 · ${r}² m²`),
        rich(`O = 2 · 3,14 · ${r * r} m² ≈ ${Os} m²`),
      ],
      fig: dome(`r = ${r} m`), inline: false,
      check: { want: Os, value: O, dec: 2 },
    };
  }

  // L3b: Zylinder mit aufgesetzter Halbkugel (Silo), Oberfläche ohne Boden: O = 2πrh + 2πr²
  function silo3(rng) {
    const r = rng.int(2, 6), h = rng.int(3, 10);
    const M = 2 * PI * r * h, Hk = 2 * PI * r * r, O = M + Hk;
    const Ms = fx(M, 2), Hs = fx(Hk, 2), Os = fx(O, 2);
    return {
      q: rich(`Ein Silo besteht aus einem Zylinder mit Radius r = ${r} m und Höhe h = ${h} m. Oben ist er durch eine Halbkugel abgeschlossen. Berechne die Oberfläche des Silos ohne den Boden. ${PIT}`),
      a: rich(`O ≈ ${Os} m²`),
      steps: [
        rich(`Mantel: M = 2 · 3,14 · r · h = 2 · 3,14 · ${r} m · ${h} m ≈ ${Ms} m²`),
        rich(`Halbkugel: H = 2 · 3,14 · r² = 2 · 3,14 · ${r * r} m² ≈ ${Hs} m²`),
        rich(`O = M + H ≈ ${Ms} m² + ${Hs} m² ≈ ${Os} m²`),
      ],
      fig: silo(`r = ${r} m`, `h = ${h} m`, h / r), inline: false,
      check: { want: Os, value: O, dec: 2 },
    };
  }

  function oberL3(rng) {
    for (let i = 0; i < 300; i++) {
      const t = rng.chance(0.5) ? kuppel(rng) : silo3(rng);
      if (t) return t;
    }
    throw new Error("m10-kugel-oberflaeche: keine Zahlen gefunden");
  }

  AG.registerType({
    id: "m10-kugel-oberflaeche",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Oberfläche der Kugel",
    instruction: {
      1: "Berechne die Oberfläche der Kugel. Runde auf eine Nachkommastelle.",
      2: "Berechne den Radius. Runde auf zwei Nachkommastellen.",
      3: "Berechne die Oberfläche. Die Skizze zeigt die Form. Runde auf zwei Nachkommastellen.",
    },
    merke: [
      "Kugeloberfläche: ", { b: "O = 4 · π · r²" }, ". Halbkugel ohne Grundfläche: ", { b: "O = 2 · π · r²" },
      ". Beispiel: r = 2 cm → O = 4 · 3,14 · 2² cm² = 50,24 cm².",
    ],
    cols: 2,
    levels: [1, 2, 3],
    generate: (rng, level) => retry(() => (level === 1 ? oberL1(rng) : level === 2 ? oberL2(rng) : oberL3(rng))),
    verify: verifyValue,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
