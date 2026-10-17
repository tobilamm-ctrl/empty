// M8 LB 3 und LB 4 (Kreis, Flächeninhalt – Kreise): Kreisumfang, Kreisfläche, Kreisbogen,
// Kreisring und Kreissektor, zusammengesetzte Figuren. Rechnung mit π ≈ 3,14 (Frac 314/100).
// Ergebnisse höchstens 2 Nachkommastellen; bei mehr Stellen gerundet und mit „≈“ gekennzeichnet.
(function (AG) {
  const { Frac, num, rich, fmtDec, fmtInt } = AG;
  const { INK, FILL } = AG.SKETCH_COLORS;
  const PI = new Frac(314, 100);   // π ≈ 3,14
  const P2 = new Frac(628, 100);   // 2 · π ≈ 6,28
  const SUP2 = { sup: "2" };
  const WINKEL = [30, 45, 60, 72, 90, 120, 135, 150, 180, 210, 240, 270, 300];
  const F = x => Frac.of(x);
  const D = x => num(x, { as: "dec" });  // endliche Dezimalzahl mit Komma (Rich)
  const S = x => fmtDec(F(x));           // Zahl als Text für Skizzenbeschriftungen

  // ---------- Rundung und Ausgabe ----------
  // kaufmännisch auf 2 Nachkommastellen runden; approx = true, wenn gerundet werden musste
  function round2(x) {
    const f = F(x);
    if (f.decimals() <= 2) return { v: f, approx: false };
    const k = Math.floor((200 * Math.abs(f.n) + f.d) / (2 * f.d));
    return { v: new Frac(f.n < 0 ? -k : k, 100), approx: true };
  }
  // Rechenschritt, der mit dem Ergebnis endet: „A = 39,25 cm²“, bei Rundung „A = 22,078125 cm² ≈ 22,08 cm²“
  function eqx(sym, x, unit) {
    const f = F(x), r = round2(f);
    if (!r.approx) return rich(sym, " = ", fmtDec(f), " " + unit);
    if (f.decimals() === Infinity) return rich(sym, " ≈ ", fmtDec(r.v), " " + unit);
    return rich(sym, " = ", fmtDec(f), " " + unit, " ≈ ", fmtDec(r.v), " " + unit);
  }
  // Ergebnis der Aufgabe: „A = 39,25 cm²“ bzw. „A ≈ 22,08 cm²“
  function ans(sym, x, unit) {
    const r = round2(x);
    return rich(sym, r.approx ? " ≈ " : " = ", fmtDec(r.v), " " + unit);
  }
  // wiederholt würfeln, bis make ein Ergebnis liefert
  function tryPick(n, make) {
    for (let i = 0; i < n; i++) { const v = make(); if (v) return v; }
    throw new Error("keine passende Aufgabe gefunden");
  }

  // ---------- Skizzen (nicht maßstäblich) ----------
  // Kreis; mode "r": Radius nach rechts, mode "d": Durchmesser waagerecht.
  // letter: kurze Beschriftung an der Linie, caption: Text unter der Skizze (gegebene Werte)
  function kreisFig(mode, letter, caption) {
    const W = 50, H = 46, cx = 25, cy = 21, R = 15;
    const s = AG.sketch(W, H);
    s.circle([cx, cy], R);
    if (mode === "r") s.line([cx, cy], [cx + R, cy]);
    else s.line([cx - R, cy], [cx + R, cy]);
    s.label([cx + R / 2, cy - 3.6], letter, { size: 3.0 });
    s.circle([cx, cy], 0.6, { fill: INK });
    if (caption) s.label([cx, H - 3], caption);
    return s.done();
  }

  // Kreisring: äußerer Kreis gefüllt, innerer weiß. mode "r": Radien R und r, mode "d": Durchmesser D und d
  function ringFig(R, r, letA, letI, mode, caption) {
    const W = 50, H = 46, cx = 25, cy = 21, Ro = 16;
    const Ri = Ro * Math.min(0.75, Math.max(0.5, r / R));
    const s = AG.sketch(W, H);
    s.circle([cx, cy], Ro, { fill: FILL });
    s.circle([cx, cy], Ri, { fill: "#fff" });
    if (mode === "r") {
      s.line([cx, cy], [cx + Ro, cy]); s.label([cx + (Ri + Ro) / 2, cy - 1.6], letA, { size: 3.0 });
      s.line([cx, cy], [cx - Ri, cy]); s.label([cx - Ri / 2, cy + 3.6], letI, { size: 3.0 });
    } else {
      s.line([cx - Ro, cy], [cx + Ro, cy]); s.label([cx + (Ri + Ro) / 2, cy - 1.6], letA, { size: 3.0 });
      s.line([cx, cy - Ri], [cx, cy + Ri], { dash: true }); s.label([cx + 3.6, cy + Ri / 2], letI, { size: 3.0 });
    }
    s.circle([cx, cy], 0.6, { fill: INK });
    if (caption) s.label([cx, H - 3], caption);
    return s.done();
  }

  // Kreissektor von 0° bis α (gegen den Uhrzeigersinn), Bogen hervorgehoben.
  // aText: Text am Winkel („90°“ oder „α“), bLab: Beschriftung des Bogens (oder null), caption: Text unten
  function sektorFig(alpha, r, caption, aText, bLab) {
    const W = 76, H = 46, cx = 36, cy = 22, R = 13, ra = 4;
    const s = AG.sketch(W, H);
    const th = -alpha * Math.PI / 180;   // y zeigt nach unten: gegen den Uhrzeigersinn = negativer Winkel
    const big = alpha > 180 ? 1 : 0;
    const pt = (rad, t) => [cx + rad * Math.cos(t), cy + rad * Math.sin(t)];
    const P0 = pt(R, 0), P1 = pt(R, th), Q0 = pt(ra, 0), Q1 = pt(ra, th);
    s.path(`M${cx} ${cy} L${P0[0]} ${P0[1]} A${R} ${R} 0 ${big} 0 ${P1[0]} ${P1[1]} Z`, { fill: FILL });
    s.path(`M${P0[0]} ${P0[1]} A${R} ${R} 0 ${big} 0 ${P1[0]} ${P1[1]}`, { width: 0.9 });
    s.line([cx, cy], P0);
    s.line([cx, cy], P1);
    s.path(`M${Q0[0]} ${Q0[1]} A${ra} ${ra} 0 ${big} 0 ${Q1[0]} ${Q1[1]}`, { width: 0.3 });
    const tm = th / 2;
    s.label(pt(ra + 4, tm), aText, { size: 3.0 });
    if (bLab) {
      const c = Math.cos(tm);
      s.label(pt(R + 3.5, tm), bLab, { anchor: c > 0.35 ? "start" : c < -0.35 ? "end" : "middle" });
    }
    s.label([cx + R / 2 + 2, cy + 3.6], "r", { size: 3.0 });
    if (caption) s.label([W / 2, H - 2], caption);
    return s.done();
  }

  // Rechteck mit aufgesetztem Halbkreis (Durchmesser w)
  function figHalb(w, h, labW, labH, labR) {
    const W = 70, H = 44, wc = Number(w), hc = Number(h), rc = wc / 2;
    const f = AG.fitPoints([[0, 0], [wc, 0], [wc, hc + rc], [0, hc + rc]], W, H, 7);
    const rm = f([rc, 0])[0] - f([0, 0])[0];
    const bl = f([0, 0]), br = f([wc, 0]), tr = f([wc, hc]), tl = f([0, hc]), M = f([rc, hc]);
    const s = AG.sketch(W, H);
    s.path(`M${bl[0]} ${bl[1]} L${br[0]} ${br[1]} L${tr[0]} ${tr[1]} A${rm} ${rm} 0 0 0 ${tl[0]} ${tl[1]} Z`, { fill: FILL });
    s.side(bl, br, labW, { inside: M });
    s.side(tl, bl, labH, { inside: M });
    s.label([M[0], M[1] - rm * 0.45], labR, { size: 3.0 });
    return s.done();
  }

  // Quadrat mit ausgeschnittenem Viertelkreis (Mittelpunkt in der linken unteren Ecke)
  function figViertel(a, labA, labR) {
    const W = 70, H = 44, ac = Number(a);
    const f = AG.fitPoints([[0, 0], [ac, 0], [ac, ac], [0, ac]], W, H, 7);
    const a0 = f([0, 0]), b0 = f([ac, 0]), c0 = f([ac, ac]), d0 = f([0, ac]);
    const rm = b0[0] - a0[0];
    const s = AG.sketch(W, H);
    s.path(`M${b0[0]} ${b0[1]} L${c0[0]} ${c0[1]} L${d0[0]} ${d0[1]} A${rm} ${rm} 0 0 1 ${b0[0]} ${b0[1]} Z`, { fill: FILL });
    // ausgeschnittener Viertelkreis: nur Umriss gestrichelt, Radius eingezeichnet
    s.line(d0, a0, { dash: true }); s.line(a0, b0, { dash: true });
    const m = [a0[0] + rm * 0.7071, a0[1] - rm * 0.7071];
    s.line(a0, m, { dash: true });
    s.side(d0, c0, labA, { inside: a0 });
    s.label([a0[0] + rm * 0.42 * 0.7071 + 2, a0[1] - rm * 0.42 * 0.7071 + 3], labR, { anchor: "start" });
    return s.done();
  }

  // Rechteck (Länge l, Breite w) mit zwei Halbkreisen an den schmalen Seiten
  function figBahn(l, w, labL, labW) {
    const W = 70, H = 44, lc = Number(l), wc = Number(w), rc = wc / 2;
    const f = AG.fitPoints([[-rc, 0], [lc + rc, 0], [lc + rc, wc], [-rc, wc]], W, H, 7);
    const rm = f([rc, 0])[0] - f([0, 0])[0];
    const bl = f([0, 0]), br = f([lc, 0]), tr = f([lc, wc]), tl = f([0, wc]);
    const s = AG.sketch(W, H);
    s.path(`M${tl[0]} ${tl[1]} L${tr[0]} ${tr[1]} A${rm} ${rm} 0 0 1 ${br[0]} ${br[1]} L${bl[0]} ${bl[1]} A${rm} ${rm} 0 0 1 ${tl[0]} ${tl[1]} Z`, { fill: FILL });
    s.line(tr, br, { dash: true });
    s.line(bl, tl, { dash: true });
    s.side(bl, br, labL, { inside: tl });
    s.label([tr[0] - 1.8, (tr[1] + br[1]) / 2], labW, { anchor: "end" });
    return s.done();
  }

  // ---------- 1. Kreisumfang (LB 3) ----------
  function umfangAufgabe(rng, level) {
    if (level < 3) {
      const viaR = rng.chance(0.5);
      const x = viaR
        ? (level === 1 ? new Frac(rng.int(2, 20)) : new Frac(rng.int(15, 120), 10))
        : (level === 1 ? new Frac(rng.int(2, 30)) : new Frac(rng.int(30, 240), 10));
      const nm = viaR ? "r" : "d";
      const u = (viaR ? P2 : PI).mul(x);
      const steps = viaR
        ? [rich("u = 2 · π · r"), rich("u = 2 · 3,14 · ", D(x), " cm"), rich("u = ", D(P2), " · ", D(x), " cm"), eqx("u", u, "cm")]
        : [rich("u = π · d"), rich("u = 3,14 · ", D(x), " cm"), eqx("u", u, "cm")];
      return {
        q: rich("Berechne den Umfang u des Kreises. ", nm, " = ", D(x), " cm."),
        a: ans("u", u, "cm"),
        steps,
        fig: kreisFig(nm, nm, nm + " = " + S(x) + " cm"),
        inline: false,
      };
    }
    // Niveau 3: Umkehraufgabe oder Sachaufgabe (Rad)
    const art = rng.pick(["kreis", "kreis", "rad", "radvor"]);
    if (art === "kreis") {
      if (rng.chance(0.5)) {
        const r = new Frac(rng.int(2, 15)), u = P2.mul(r);
        return {
          q: rich("Der Umfang eines Kreises beträgt u = ", D(u), " cm. Berechne den Radius r."),
          a: ans("r", r, "cm"),
          steps: [
            rich("u = 2 · π · r"),
            rich(D(u), " cm = 2 · 3,14 · r"),
            rich("r = ", D(u), " cm : ", D(P2)),
            eqx("r", r, "cm"),
          ],
          fig: kreisFig("r", "r = ?", "u = " + S(u) + " cm"),
          inline: false,
        };
      }
      const d = new Frac(rng.int(2, 25)), u = PI.mul(d);
      return {
        q: rich("Der Umfang eines Kreises beträgt u = ", D(u), " cm. Berechne den Durchmesser d."),
        a: ans("d", d, "cm"),
        steps: [
          rich("u = π · d"),
          rich(D(u), " cm = 3,14 · d"),
          rich("d = ", D(u), " cm : 3,14"),
          eqx("d", d, "cm"),
        ],
        fig: kreisFig("d", "d = ?", "u = " + S(u) + " cm"),
        inline: false,
      };
    }
    if (art === "rad") {
      // Rad dreht sich n-mal und legt die Strecke s zurück: gesucht ist der Durchmesser
      const n = rng.pick([100, 150, 200, 250, 300, 400, 500, 1000]);
      const d = rng.int(40, 120);
      const sCm = PI.mul(d).mul(n);          // ganzzahlig, da n Vielfaches von 50
      const sM = sCm.div(100);
      return {
        q: rich("Ein Fahrrad-Vorderrad rollt bei ", fmtInt(n), " Umdrehungen genau ", S(sM), " m weit. Wie groß ist der Durchmesser d des Rades in cm?"),
        a: ans("d", F(d), "cm"),
        steps: [
          rich("Strecke s = n · u = n · π · d"),
          rich(INT(sCm), " cm = ", fmtInt(n), " · 3,14 · d"),
          rich("d = ", INT(sCm), " cm : (", fmtInt(n), " · 3,14)"),
          eqx("d", F(d), "cm"),
        ],
        fig: kreisFig("d", "d = ?", "s = " + S(sM) + " m"),
        inline: false,
      };
    }
    // Rad vorwärts: Strecke aus Durchmesser und Anzahl der Umdrehungen
    const d = rng.int(30, 120), n = rng.int(20, 100) * 5;
    const uCm = PI.mul(d), sCm = uCm.mul(n), sM = sCm.div(100);
    return {
      q: rich("Ein Rad hat den Durchmesser d = ", fmtInt(d), " cm. Wie weit rollt es bei ", fmtInt(n), " Umdrehungen? Gib das Ergebnis in m an."),
      a: ans("s", sM, "m"),
      steps: [
        rich("u = π · d"),
        rich("u = 3,14 · ", fmtInt(d), " cm"),
        eqx("u", uCm, "cm"),
        rich("s = ", fmtInt(n), " · ", D(uCm), " cm"),
        eqx("s", sCm, "cm"),
        eqx("s", sM, "m"),
      ],
      fig: kreisFig("d", "d", "d = " + fmtInt(d) + " cm"),
      inline: false,
    };
  }
  function INT(x) { return fmtDec(F(x)); }

  // ---------- 2. Kreisfläche (LB 4) ----------
  function flaecheAufgabe(rng, level) {
    if (level === 1) {
      const r = new Frac(rng.int(2, 25)), r2 = r.mul(r), A = PI.mul(r2);
      const q = rng.chance(0.5)
        ? rich("Berechne den Flächeninhalt A des Kreises mit r = ", D(r), " cm.")
        : rich("Ein Kreis hat den Radius r = ", D(r), " cm. Wie groß ist seine Fläche A?");
      return {
        q,
        a: ans("A", A, "cm²"),
        steps: [
          rich("A = π · r", SUP2),
          rich("A = 3,14 · ", D(r), " cm · ", D(r), " cm"),
          rich("A = 3,14 · ", D(r2), " cm²"),
          eqx("A", A, "cm²"),
        ],
        fig: kreisFig("r", "r", "r = " + S(r) + " cm"),
        inline: false,
      };
    }
    if (level === 2) {
      const d = new Frac(rng.int(30, 240), 10), r = d.div(2), r2 = r.mul(r), A = PI.mul(r2);
      return {
        q: rich("Berechne den Flächeninhalt A des Kreises mit d = ", D(d), " cm."),
        a: ans("A", A, "cm²"),
        steps: [
          rich("r = d : 2 = ", D(d), " cm : 2 = ", D(r), " cm"),
          rich("A = π · r", SUP2),
          rich("A = 3,14 · ", D(r), " cm · ", D(r), " cm"),
          rich("A = 3,14 · ", D(r2), " cm²"),
          eqx("A", A, "cm²"),
        ],
        fig: kreisFig("d", "d", "d = " + S(d) + " cm"),
        inline: false,
      };
    }
    // Niveau 3: Umkehraufgabe, r (oder d) aus A
    const r = new Frac(rng.int(2, 25)), r2 = r.mul(r), A = PI.mul(r2);
    const askD = rng.chance(0.3);
    const steps = [
      rich("A = π · r", SUP2),
      rich(D(A), " cm² = 3,14 · r", SUP2),
      rich("r", SUP2, " = ", D(A), " cm² : 3,14"),
      rich("r", SUP2, " = ", D(r2), " cm²"),
      rich("r = √", D(r2), " cm = ", D(r), " cm"),
    ];
    let a;
    if (askD) {
      const d = r.mul(2);
      steps.push(rich("d = 2 · ", D(r), " cm"), eqx("d", d, "cm"));
      a = ans("d", d, "cm");
    } else {
      steps.push(eqx("r", r, "cm"));
      a = ans("r", r, "cm");
    }
    return {
      q: rich("Ein Kreis hat den Flächeninhalt A = ", D(A), " cm². Berechne ", askD ? "den Durchmesser d." : "den Radius r."),
      a,
      steps,
      fig: kreisFig(askD ? "d" : "r", askD ? "d = ?" : "r = ?", "A = " + S(A) + " cm²"),
      inline: false,
    };
  }

  // ---------- 3. Kreisbogen (LB 3) ----------
  function bogenAufgabe(rng, level) {
    if (level === 1) {
      const c = tryPick(500, () => {
        const r = new Frac(rng.int(2, 20)), a = rng.pick([45, 60, 90, 120, 180]);
        const b = P2.mul(r).mul(new Frac(a, 360));
        return b.decimals() <= 2 ? { r, a, b } : null;
      });
      return bogenAnzeige(c, false);
    }
    if (level === 2) {
      const r = new Frac(rng.int(15, 95), 10), a = rng.pick(WINKEL);
      const b = P2.mul(r).mul(new Frac(a, 360));
      return bogenAnzeige({ r, a, b }, false);
    }
    const c = tryPick(500, () => {
      const r = new Frac(rng.int(2, 12)), a = rng.pick(WINKEL);
      const b = P2.mul(r).mul(new Frac(a, 360));
      return b.decimals() <= 2 ? { r, a, b } : null;
    });
    return bogenAnzeige(c, true);
  }
  function bogenAnzeige({ r, a, b }, askAlpha) {
    const u = P2.mul(r);
    if (!askAlpha) {
      return {
        q: rich("Ein Kreis hat den Radius r = ", D(r), " cm. Berechne die Länge b des Kreisbogens zum Mittelpunktswinkel α = ", fmtInt(a), "°."),
        a: ans("b", b, "cm"),
        steps: [
          rich("b = 2 · π · r · α : 360°"),
          rich("b = 2 · 3,14 · ", D(r), " cm · ", fmtInt(a), "° : 360°"),
          rich("b = ", D(u), " cm · ", fmtInt(a), "° : 360°"),
          eqx("b", b, "cm"),
        ],
        fig: sektorFig(a, r, "r = " + S(r) + " cm", a + "°", "b = ?"),
        inline: false,
      };
    }
    return {
      q: rich("Ein Kreisbogen hat die Länge b = ", D(b), " cm. Der Radius ist r = ", D(r), " cm. Berechne den Mittelpunktswinkel α."),
      a: rich("α = ", fmtInt(a), "°"),
      steps: [
        rich("b = 2 · π · r · α : 360°"),
        rich(D(b), " cm = 2 · 3,14 · ", D(r), " cm · α : 360°"),
        rich(D(b), " cm = ", D(u), " cm · α : 360°"),
        rich("α = ", D(b), " cm · 360° : ", D(u), " cm"),
        rich("α = ", fmtInt(a), "°"),
      ],
      fig: sektorFig(a, r, "r = " + S(r) + " cm", "α", "b = " + S(b) + " cm"),
      inline: false,
    };
  }

  // ---------- 4. Kreisring und Kreissektor (LB 4) ----------
  function ringSektorAufgabe(rng, level) {
    const ring = rng.chance(0.5);
    if (level === 1) {
      if (ring) {
        const R = rng.int(4, 12), r = rng.int(1, R - 2);
        const R2 = new Frac(R * R), r2 = new Frac(r * r), A = PI.mul(R2.sub(r2));
        return {
          q: rich("Ein Kreisring hat den äußeren Radius R = ", D(R), " cm und den inneren Radius r = ", D(r), " cm. Berechne seinen Flächeninhalt A."),
          a: ans("A", A, "cm²"),
          steps: [
            rich("A = π · (R", SUP2, " − r", SUP2, ")"),
            rich("A = 3,14 · (", D(R2), " cm² − ", D(r2), " cm²)"),
            rich("A = 3,14 · ", D(R2.sub(r2)), " cm²"),
            eqx("A", A, "cm²"),
          ],
          fig: ringFig(R, r, "R", "r", "r", "R = " + R + " cm, r = " + r + " cm"),
          inline: false,
        };
      }
      const r = new Frac(2 * rng.int(1, 6)), a = rng.pick([90, 180]);
      return sektorAnzeige(r, a);
    }
    if (level === 2) {
      if (ring) {
        const dA = rng.int(6, 24), dI = rng.int(2, dA - 2);
        const R = new Frac(dA, 2), r = new Frac(dI, 2), R2 = R.mul(R), r2 = r.mul(r), A = PI.mul(R2.sub(r2));
        return {
          q: rich("Ein Kreisring hat den äußeren Durchmesser D = ", D(dA), " cm und den inneren Durchmesser d = ", D(dI), " cm. Berechne seinen Flächeninhalt A."),
          a: ans("A", A, "cm²"),
          steps: [
            rich("R = ", D(dA), " cm : 2 = ", D(R), " cm"),
            rich("r = ", D(dI), " cm : 2 = ", D(r), " cm"),
            rich("A = π · (R", SUP2, " − r", SUP2, ")"),
            rich("A = 3,14 · (", D(R2), " cm² − ", D(r2), " cm²)"),
            rich("A = 3,14 · ", D(R2.sub(r2)), " cm²"),
            eqx("A", A, "cm²"),
          ],
          fig: ringFig(dA / 2, dI / 2, "D", "d", "d", "D = " + dA + " cm, d = " + dI + " cm"),
          inline: false,
        };
      }
      const r = new Frac(rng.int(3, 12)), a = rng.pick(WINKEL);
      return sektorAnzeige(r, a);
    }
    // Niveau 3: Umkehraufgabe
    if (ring) {
      const R = rng.int(3, 12), r = rng.int(1, R - 1);
      const R2 = new Frac(R * R), r2 = new Frac(r * r), A = PI.mul(R2.sub(r2)), dd = new Frac(2 * r);
      const diffRing = A.div(PI);   // R² − r²
      return {
        q: rich("Ein Kreisring hat den äußeren Durchmesser D = ", D(2 * R), " cm und die Fläche A = ", D(A), " cm². Berechne den inneren Durchmesser d."),
        a: ans("d", dd, "cm"),
        steps: [
          rich("R = ", D(2 * R), " cm : 2 = ", D(R), " cm"),
          rich("A = π · (R", SUP2, " − r", SUP2, ")"),
          rich(D(A), " cm² = 3,14 · (", D(R2), " cm² − r", SUP2, ")"),
          rich(D(A), " cm² : 3,14 = ", D(diffRing), " cm² = ", D(R2), " cm² − r", SUP2),
          rich("r", SUP2, " = ", D(R2), " cm² − ", D(diffRing), " cm² = ", D(r2), " cm²"),
          rich("r = √", D(r2), " cm = ", D(r), " cm"),
          rich("d = 2 · r = 2 · ", D(r), " cm = ", D(dd), " cm"),
        ],
        fig: ringFig(R, r, "D", "d", "d", "D = " + (2 * R) + " cm, d = ?"),
        inline: false,
      };
    }
    const c = tryPick(500, () => {
      const r = new Frac(rng.int(2, 12)), a = rng.pick(WINKEL);
      const A = PI.mul(r.mul(r)).mul(new Frac(a, 360));
      return A.decimals() <= 2 ? { r, a, A } : null;
    });
    const r2 = c.r.mul(c.r), kreisFl = PI.mul(r2);
    return {
      q: rich("Ein Kreissektor hat den Radius r = ", D(c.r), " cm und die Fläche A = ", D(c.A), " cm². Berechne den Mittelpunktswinkel α."),
      a: rich("α = ", fmtInt(c.a), "°"),
      steps: [
        rich("A = π · r", SUP2, " · α : 360°"),
        rich(D(c.A), " cm² = 3,14 · ", D(r2), " cm² · α : 360°"),
        rich(D(c.A), " cm² = ", D(kreisFl), " cm² · α : 360°"),
        rich("α = ", D(c.A), " cm² · 360° : ", D(kreisFl), " cm²"),
        rich("α = ", fmtInt(c.a), "°"),
      ],
      fig: sektorFig(c.a, c.r, "r = " + S(c.r) + " cm, A = " + S(c.A) + " cm²", "α", null),
      inline: false,
    };
  }
  // Sektor mit gegebenem r und α, gesucht: A
  function sektorAnzeige(r, a) {
    const r2 = r.mul(r), A = PI.mul(r2).mul(new Frac(a, 360));
    return {
      q: rich("Ein Kreissektor hat den Radius r = ", D(r), " cm und den Mittelpunktswinkel α = ", fmtInt(a), "°. Berechne seinen Flächeninhalt A."),
      a: ans("A", A, "cm²"),
      steps: [
        rich("A = π · r", SUP2, " · α : 360°"),
        rich("A = 3,14 · ", D(r2), " cm² · ", fmtInt(a), "° : 360°"),
        rich("A = ", D(PI.mul(r2)), " cm² · ", fmtInt(a), "° : 360°"),
        eqx("A", A, "cm²"),
      ],
      fig: sektorFig(a, r, "r = " + S(r) + " cm", a + "°", null),
      inline: false,
    };
  }

  // ---------- 5. Zusammengesetzte Figuren (LB 4) ----------
  function zusammengesetzt(rng, level) {
    const shape = rng.pick(["halb", "viertel", "bahn"]);
    const frage = level === 3 ? "beides" : rng.pick(["A", "U"]);
    const evenDim = (lo, hi) => new Frac(2 * rng.int(lo / 2, hi / 2));          // ganzzahlige Werte mit geradem Wert
    const anyDim = (lo, hi) => (level === 1 ? new Frac(rng.int(lo, hi)) : new Frac(rng.int(2 * lo, 2 * hi), 2));
    const ask = frage === "beides" ? "Flächeninhalt und den Umfang" : frage === "A" ? "Flächeninhalt" : "Umfang";
    let q, fig, stepsA = [], stepsU = [], ansA, ansU;

    if (shape === "halb") {
      const w = level === 1 ? evenDim(4, 14) : anyDim(4, 14);
      const h = level === 1 ? new Frac(rng.int(2, 12)) : anyDim(2, 12);
      const r = w.div(2), area = w.mul(h), ahEx = PI.mul(r.mul(r)).div(2), ah = round2(ahEx).v;
      const ubEx = PI.mul(w).div(2), ub = round2(ubEx).v, uGes = w.add(h.mul(2)).add(ub);
      q = rich("Die Figur besteht aus einem Rechteck (Breite w = ", D(w), " cm, Höhe h = ", D(h), " cm) und einem Halbkreis mit dem Durchmesser w darauf. Berechne den ", ask, " der Figur.");
      fig = figHalb(w, h, "w = " + S(w) + " cm", "h = " + S(h) + " cm", "r = " + S(r) + " cm");
      stepsA = [
        rich("A Rechteck = ", D(w), " cm · ", D(h), " cm"),
        eqx("A Rechteck", area, "cm²"),
        rich("A Halbkreis = 3,14 · ", D(r), " cm · ", D(r), " cm : 2"),
        rich("A Halbkreis = 3,14 · ", D(r.mul(r)), " cm² : 2"),
        eqx("A Halbkreis", ahEx, "cm²"),
        rich("A gesamt = ", D(area), " cm² + ", D(ah), " cm²"),
        eqx("A gesamt", area.add(ah), "cm²"),
      ];
      stepsU = [
        rich("U Halbkreisbogen = 3,14 · ", D(w), " cm : 2"),
        eqx("U Halbkreisbogen", ubEx, "cm"),
        rich("U gesamt = ", D(w), " cm + 2 · ", D(h), " cm + ", D(ub), " cm"),
        eqx("U gesamt", uGes, "cm"),
      ];
      ansA = ans("A", area.add(ah), "cm²");
      ansU = ans("U", uGes, "cm");
    } else if (shape === "viertel") {
      const a = level === 1 ? evenDim(4, 12) : anyDim(4, 12);
      const a2 = a.mul(a), vkEx = PI.mul(a2).div(4), vk = round2(vkEx).v, cut = a2.sub(vk);
      const bogEx = PI.mul(a).div(2), bog = round2(bogEx).v, uGes = a.mul(2).add(bog);
      q = rich("Aus einem Quadrat mit der Seite a = ", D(a), " cm wird ein Viertelkreis mit dem Radius a ausgeschnitten. Berechne den ", ask, " der verbleibenden Figur.");
      fig = figViertel(a, "a = " + S(a) + " cm", "r = " + S(a) + " cm");
      stepsA = [
        rich("A Quadrat = ", D(a), " cm · ", D(a), " cm"),
        eqx("A Quadrat", a2, "cm²"),
        rich("A Viertelkreis = 3,14 · ", D(a2), " cm² : 4"),
        eqx("A Viertelkreis", vkEx, "cm²"),
        rich("A Restfigur = ", D(a2), " cm² − ", D(vk), " cm²"),
        eqx("A Restfigur", cut, "cm²"),
      ];
      stepsU = [
        rich("U Viertelbogen = 2 · 3,14 · ", D(a), " cm : 4"),
        eqx("U Viertelbogen", bogEx, "cm"),
        rich("U gesamt = 2 · ", D(a), " cm + ", D(bog), " cm"),
        eqx("U gesamt", uGes, "cm"),
      ];
      ansA = ans("A", cut, "cm²");
      ansU = ans("U", uGes, "cm");
    } else {
      const w = level === 1 ? evenDim(4, 12) : anyDim(4, 12);
      const lMin = Math.max(2 * Number(w), 10);
      const l = level === 1 ? new Frac(rng.int(lMin, 40)) : new Frac(rng.int(2 * lMin, 80), 2);
      const r = w.div(2), rect = l.mul(w), kr = PI.mul(r.mul(r)), kr2 = round2(kr).v, halbU = PI.mul(w);
      const uGes = l.mul(2).add(halbU);
      q = rich("Eine Laufbahn besteht aus einem Rechteck (Länge l = ", D(l), " cm, Breite w = ", D(w), " cm) und zwei Halbkreisen an den schmalen Seiten. Berechne den ", ask, " der Laufbahn.");
      fig = figBahn(l, w, "l = " + S(l) + " cm", "w = " + S(w) + " cm");
      stepsA = [
        rich("A Rechteck = ", D(l), " cm · ", D(w), " cm"),
        eqx("A Rechteck", rect, "cm²"),
        rich("r = w : 2 = ", D(w), " cm : 2 = ", D(r), " cm"),
        rich("A zwei Halbkreise = 3,14 · r", SUP2, " = 3,14 · ", D(r.mul(r)), " cm²"),
        eqx("A zwei Halbkreise", kr, "cm²"),
        rich("A gesamt = ", D(rect), " cm² + ", D(kr2), " cm²"),
        eqx("A gesamt", rect.add(kr2), "cm²"),
      ];
      stepsU = [
        rich("U zwei Halbkreise = 3,14 · w = 3,14 · ", D(w), " cm"),
        eqx("U zwei Halbkreise", halbU, "cm"),
        rich("U gesamt = 2 · ", D(l), " cm + ", D(halbU), " cm"),
        eqx("U gesamt", uGes, "cm"),
      ];
      ansA = ans("A", rect.add(kr2), "cm²");
      ansU = ans("U", uGes, "cm");
    }
    const steps = frage === "A" ? stepsA : frage === "U" ? stepsU : [...stepsA, ...stepsU];
    const a = frage === "A" ? ansA : frage === "U" ? ansU : rich(ansA, "; ", ansU);
    return { q, a, steps, fig, inline: false };
  }

  AG.registerType({
    id: "m8-kreisumfang",
    klasse: "8",
    zug: "RM",
    lb: "3",
    lbTitle: "Kreis",
    title: "Kreisumfang berechnen",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Umfang u. Rechne mit π ≈ 3,14.",
      2: "Berechne den Umfang u. Rechne mit π ≈ 3,14. Runde auf zwei Nachkommastellen.",
      3: "Berechne die gesuchte Größe. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Kreisumfang: ", { b: "u = 2 · π · r" }, " oder ", { b: "u = π · d" },
      ". Mit π ≈ 3,14 gilt zum Beispiel für r = 5 cm: u = 2 · 3,14 · 5 cm = 31,4 cm.",
    ],
    cols: 2,
    generate: umfangAufgabe,
  });

  AG.registerType({
    id: "m8-kreisflaeche",
    klasse: "8",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Kreise",
    title: "Kreisfläche berechnen",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt A. Rechne mit π ≈ 3,14.",
      2: "Berechne den Flächeninhalt A. Rechne mit π ≈ 3,14. Runde auf zwei Nachkommastellen.",
      3: "Berechne die gesuchte Größe. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Kreisfläche: ", { b: "A = π · r²" },
      ". Der Radius r ist die Hälfte des Durchmessers d: r = d : 2. Beispiel: r = 4 cm, also A = 3,14 · 4 cm · 4 cm = 50,24 cm².",
    ],
    cols: 2,
    generate: flaecheAufgabe,
  });

  AG.registerType({
    id: "m8-kreisbogen",
    klasse: "8",
    zug: "M",
    lb: "3",
    lbTitle: "Kreis",
    title: "Kreisbogen berechnen",
    topic: "flaechen",
    instruction: {
      1: "Berechne die Länge b des Kreisbogens. Rechne mit π ≈ 3,14.",
      2: "Berechne die Länge b des Kreisbogens. Rechne mit π ≈ 3,14. Runde auf zwei Nachkommastellen.",
      3: "Berechne den Mittelpunktswinkel α. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Kreisbogen: ", { b: "b = 2 · π · r · α : 360°" },
      ". Der Bogen ist der Anteil α : 360° des Kreisumfangs. Beispiel: r = 5 cm, α = 72°: b = 2 · 3,14 · 5 cm · 72° : 360° = 6,28 cm.",
    ],
    cols: 2,
    generate: bogenAufgabe,
  });

  AG.registerType({
    id: "m8-kreisring-sektor",
    klasse: "8",
    zug: "M",
    lb: "4",
    lbTitle: "Flächeninhalt – Kreise",
    title: "Kreisring und Kreissektor",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt A. Rechne mit π ≈ 3,14.",
      2: "Berechne den Flächeninhalt A. Rechne mit π ≈ 3,14. Runde auf zwei Nachkommastellen.",
      3: "Berechne die gesuchte Größe. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Kreisring: ", { b: "A = π · (R² − r²)" }, ". Kreissektor: ", { b: "A = π · r² · α : 360°" },
      ". Beispiel: Sektor mit r = 2 cm und α = 90°: A = 3,14 · 4 cm² · 90° : 360° = 3,14 cm².",
    ],
    cols: 2,
    generate: ringSektorAufgabe,
  });

  AG.registerType({
    id: "m8-kreis-zusammengesetzt",
    klasse: "8",
    zug: "RM",
    lb: "4",
    lbTitle: "Flächeninhalt – Kreise",
    title: "Zusammengesetzte Figuren mit Kreisen",
    topic: "flaechen",
    instruction: {
      1: "Berechne den Flächeninhalt A bzw. den Umfang U der Figur. Rechne mit π ≈ 3,14.",
      2: "Berechne den Flächeninhalt A bzw. den Umfang U der Figur. Rechne mit π ≈ 3,14. Runde auf zwei Nachkommastellen.",
      3: "Berechne den Flächeninhalt und den Umfang der Figur. Rechne mit π ≈ 3,14.",
    },
    merke: [
      "Zusammengesetzte Figuren: Teilflächen einzeln berechnen, dann addieren oder subtrahieren. Halbkreis: ",
      { b: "A = π · r² : 2" }, ", Halbkreisbogen: ", { b: "U = π · d : 2" },
      ". Beispiel: Halbkreis mit d = 4 cm: A = 3,14 · 2 cm · 2 cm : 2 = 6,28 cm².",
    ],
    cols: 2,
    generate: zusammengesetzt,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
