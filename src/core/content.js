// Zahlen, Brüche und das Inhaltsmodell ("Rich") für Aufgaben und Lösungen.
//
// Rich = Array von Segmenten. Ein Segment ist
//   "Text"                          normaler Text
//   { f: [z, n], w: g, s: -1 }      Bruch z/n, optional ganze Zahl g davor (gemischte Zahl), s = -1 für Minus
//   { b: "Text" }                   fett
//   { sup: "2" }                    hochgestellt
//   { blank: 4 }                    Lücke zum Ausfüllen (Breite in Zeichen, ungefähr)
//   { br: true }                    Zeilenumbruch
(function (AG) {
  const MINUS = "−";

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

  // Exakte Bruchrechnung. Nenner immer positiv, immer gekürzt.
  class Frac {
    constructor(n, d = 1) {
      if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error("Frac: nur ganze Zahlen " + n + "/" + d);
      if (d === 0) throw new Error("Frac: Nenner 0");
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g; this.d = d / g;
      if (Object.is(this.n, -0)) this.n = 0;
    }
    static of(x) {
      if (x instanceof Frac) return x;
      if (Number.isInteger(x)) return new Frac(x, 1);
      // Dezimalzahl -> Bruch (bis 6 Nachkommastellen)
      const s = x.toFixed(6).replace(/0+$/, "");
      const digits = (s.split(".")[1] || "").length;
      const p = 10 ** digits;
      return new Frac(Math.round(x * p), p);
    }
    add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { o = Frac.of(o); if (o.n === 0) throw new Error("Division durch 0"); return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    abs() { return new Frac(Math.abs(this.n), this.d); }
    inv() { return new Frac(this.d, this.n); }
    cmp(o) { o = Frac.of(o); return Math.sign(this.n * o.d - o.n * this.d); }
    eq(o) { return this.cmp(o) === 0; }
    isInt() { return this.d === 1; }
    sign() { return Math.sign(this.n); }
    valueOf() { return this.n / this.d; }
    // endet die Dezimaldarstellung? (Nenner nur 2er und 5er)
    isTerminating() { let d = this.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
    decimals() { // Anzahl Nachkommastellen bei endlicher Darstellung
      if (!this.isTerminating()) return Infinity;
      let k = 0; let d = this.d;
      while (d !== 1) { if (d % 10 === 0) d /= 10; else if (d % 2 === 0) d /= 2; else d /= 5; k++; }
      // k ist obere Schranke; genaue Stellen bestimmen
      for (let i = 0; i <= k; i++) if ((this.n * 10 ** i) % this.d === 0) return i;
      return k;
    }
    toString() { return this.d === 1 ? String(this.n) : this.n + "/" + this.d; }
  }

  // ---------- Formatierung ----------

  // ganze Zahl mit Tausenderpunkt ab 5 Stellen (1 000 -> "1000", 12 345 -> "12 345")
  function fmtInt(n) {
    const s = String(Math.abs(n));
    const body = s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s;
    return (n < 0 ? MINUS : "") + body;
  }

  // Zahl/Frac als Dezimalzahl mit Komma. digits = feste Stellen, sonst so viele wie nötig.
  function fmtDec(x, digits) {
    const f = Frac.of(x);
    let k = digits;
    if (k === undefined) {
      k = f.decimals();
      if (k === Infinity) throw new Error("fmtDec: keine endliche Dezimalzahl: " + f);
    }
    const neg = f.n < 0;
    const scaled = Math.round(Math.abs(f.n) * 10 ** k / f.d);
    let s = String(scaled).padStart(k + 1, "0");
    const intPart = s.slice(0, s.length - k) || "0";
    const decPart = k > 0 ? s.slice(s.length - k) : "";
    let out = fmtInt(Number(intPart)) + (k > 0 ? "," + decPart : "");
    if (neg && scaled !== 0) out = MINUS + out;
    return out;
  }

  // Bruch als Segment. mixed: unechte Brüche als gemischte Zahl (Standard).
  function fracSeg(x, opts = {}) {
    const f = Frac.of(x);
    const mixed = opts.mixed !== false;
    if (f.isInt()) return fmtInt(f.n);
    const s = f.n < 0 ? -1 : 1;
    const an = Math.abs(f.n);
    if (mixed && an > f.d) {
      const w = Math.floor(an / f.d);
      return { f: [an % f.d, f.d], w, s };
    }
    return s < 0 ? { f: [an, f.d], s } : { f: [an, f.d] };
  }

  // Zahl als Rich (Array). as: "int" | "dec" | "frac" | "mixed" (Standard: frac, wenn kein Dezimalbruch passt)
  // paren: negative Zahlen in Klammern
  function num(x, opts = {}) {
    const f = Frac.of(x);
    let seg;
    const as = opts.as || (f.isInt() ? "int" : "frac");
    if (as === "dec" || (as === "int" && !f.isInt())) seg = fmtDec(f, opts.digits);
    else if (as === "int") seg = fmtInt(f.n);
    else seg = fracSeg(f, { mixed: as !== "improper" && opts.mixed !== false });
    const out = [seg];
    if (opts.paren && f.n < 0) return ["(", ...out, ")"];
    return out;
  }

  // Rich -> reiner Text (für Duplikat-Erkennung und Tests)
  function plain(rich) {
    if (typeof rich === "string") return rich;
    if (!Array.isArray(rich)) rich = [rich];
    return rich.map(seg => {
      if (typeof seg === "string") return seg;
      if (Array.isArray(seg)) return plain(seg);
      if (seg.f) return (seg.s < 0 ? MINUS : "") + (seg.w ? seg.w + " " : "") + seg.f[0] + "/" + seg.f[1];
      if (seg.b !== undefined) return seg.b;
      if (seg.sup !== undefined) return "^" + seg.sup;
      if (seg.blank !== undefined) return "___";
      if (seg.br) return "\n";
      return "";
    }).join("");
  }

  // flach machen: verschachtelte Arrays auflösen
  function rich(...parts) {
    const out = [];
    for (const p of parts) {
      if (Array.isArray(p)) out.push(...rich(...p));
      else if (p !== null && p !== undefined && p !== "") out.push(p);
    }
    return out;
  }

  // Kann die Lösung direkt mit „= …“ hinter die Aufgabe? Nur bei reinen Rechenausdrücken.
  function isExpression(task) {
    if (task.table || task.inline === false) return false;
    if (task.inline === true) return true;
    const t = plain(task.q).trim();
    return t.length <= 48 && !/[?.!:]$/.test(t) && !/\n/.test(t) && !/[a-zäöüß]{4,}/i.test(t.replace(/\b(von|und)\b/g, ""));
  }

  AG.MINUS = MINUS;
  AG.isExpression = isExpression;
  AG.gcd = gcd;
  AG.lcm = lcm;
  AG.Frac = Frac;
  AG.fmtInt = fmtInt;
  AG.fmtDec = fmtDec;
  AG.fracSeg = fracSeg;
  AG.num = num;
  AG.plain = plain;
  AG.rich = rich;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
