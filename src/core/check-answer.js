// Prüft die Eingabe eines Schülers gegen die Lösung einer Aufgabe (Übungsmodus).
//
// answerKind(task)      → "number" | "term" | null
//   "number": Lösung ist genau eine Zahl (optional „x = “ davor, optional Einheit/Wort dahinter)
//   "term":   Lösung ist ein linearer Term in einer Variablen, z. B. „−4a + 5“
//   null:     alles andere (mehrere Werte, Sätze, Verhältnisse, Wertelisten …)
// checkAnswer(task, input) → { ok, reason? } oder null, wenn answerKind null ist.
(function (AG) {
  const Frac = AG.Frac;
  const MINUS = AG.MINUS;

  const solutionText = task => AG.plain(task.a).trim();
  const normMinus = s => s.replace(/[−–]/g, "-");

  // „x = “, „y = “, „α = “ … am Anfang (genau ein Buchstabe)
  const PREFIX = /^\s*[A-Za-zÄÖÜäöüßα-ωΑ-Ω]\s*=\s*/;

  // Zahl am Anfang eines Textes → { value: Frac, rest } oder null.
  // Formen: gemischte Zahl „1 3/4“, Bruch „3/4“, Ganzzahl (auch „15 000“), Dezimalzahl „3,25“ bzw. „3.25“.
  function leadingNumber(s) {
    s = s.replace(/^\s+/, "");
    let sign = 1;
    if (s[0] === "-" || s[0] === "+") {
      if (s[0] === "-") sign = -1;
      s = s.slice(1).replace(/^\s+/, "");
    }
    let m = /^(\d+)\s+(\d+)\/(\d+)/.exec(s);
    let value, len;
    if (m) {
      if (+m[3] === 0) return null;
      value = new Frac(+m[1] * +m[3] + +m[2], +m[3]); len = m[0].length;
    } else if ((m = /^(\d+)\/(\d+)/.exec(s))) {
      if (+m[2] === 0) return null;
      value = new Frac(+m[1], +m[2]); len = m[0].length;
    } else if ((m = /^(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[,.](\d+))?/.exec(s))) {
      const dec = m[2] || "";
      value = new Frac(Number(m[1].replace(/[   ]/g, "") + dec), 10 ** dec.length);
      len = m[0].length;
    } else return null;
    return { value: sign < 0 ? value.neg() : value, rest: s.slice(len) };
  }

  // Rest nach der Zahl darf nur eine Einheit oder ein Wort sein – keine weitere Zahl, kein Operator, kein Gleichheitszeichen.
  const unitOk = rest => {
    rest = rest.trim();
    return rest === "" || (/^[^\d\s+\-−*\/:;,=.()·×]/.test(rest) && !/[\d=;:]/.test(rest));
  };

  // Eingabe oder Lösung als eine Zahl lesen (ohne Prefix, Einheit wird ignoriert). null, wenn keine Zahl.
  // strict (Lösungen): die Einheit muss durch Leerzeichen oder ein Symbol getrennt sein, damit „2a“ ein Term bleibt.
  function parseNumber(text, strict = false) {
    try {
      const s = normMinus(text).replace(PREFIX, "");
      const r = leadingNumber(s);
      if (!r || !unitOk(r.rest)) return null;
      if (strict && r.rest !== "" && !/^(\s|[%€°])/.test(r.rest)) return null;
      return r.value;
    } catch (e) {
      return null;
    }
  }

  // ---------- lineare Terme ----------
  // Ein Wert ist als lineare Form c + k·v dargestellt (Frac). Nichtlinear → Fehler.
  const konst = c => ({ c, k: new Frac(0) });
  const ladd = (p, q, sg = 1) => ({ c: p.c.add(q.c.mul(sg)), k: p.k.add(q.k.mul(sg)) });
  const lneg = p => ({ c: p.c.neg(), k: p.k.neg() });
  function lmul(p, q) {
    if (p.k.n !== 0 && q.k.n !== 0) throw new Error("nichtlinear");
    return { c: p.c.mul(q.c), k: p.c.mul(q.k).add(p.k.mul(q.c)) };
  }
  function ldiv(p, q) {
    if (q.k.n !== 0) throw new Error("nichtlinear");
    if (q.c.n === 0) throw new Error("Division durch 0");
    return { c: p.c.div(q.c), k: p.k.div(q.c) };
  }

  // Tokens: Zahl (Frac), Variable (Buchstabe), Operator
  function tokenize(s) {
    const toks = [];
    const re = /\s+|(\d+(?:[.,]\d+)?)|([a-z])|([-+*\/·×()])/gy;
    while (re.lastIndex < s.length) {
      const m = re.exec(s);
      if (!m) throw new Error("Zeichen");
      if (m[1]) {
        const [int, dec = ""] = m[1].split(/[.,]/);
        toks.push({ t: "num", v: new Frac(Number(int + dec), 10 ** dec.length) });
      } else if (m[2]) toks.push({ t: "id", v: m[2] });
      else if (m[3]) toks.push({ t: "op", v: m[3] });
    }
    return toks;
  }

  // Rekursiver Abstieg: expr = term (± term)*; term = factor ((*|/|·|×) factor | factor)*; factor = [±] atom; atom = Zahl | Variable | ( expr )
  function parseLinear(s, v) {
    const toks = tokenize(s);
    let i = 0;
    const peek = () => toks[i];
    const isOp = (tk, ops) => !!tk && tk.t === "op" && ops.includes(tk.v);
    const fail = () => { throw new Error("Syntax"); };

    function expr() {
      let left = term();
      while (isOp(peek(), ["+", "-"])) {
        const op = toks[i++].v;
        const right = term();
        left = ladd(left, right, op === "+" ? 1 : -1);
      }
      return left;
    }
    function term() {
      let left = factor();
      for (;;) {
        const tk = peek();
        if (isOp(tk, ["*", "/", "·", "×"])) {
          i++;
          const right = factor();
          left = tk.v === "/" ? ldiv(left, right) : lmul(left, right);
        } else if (tk && (tk.t === "id" || isOp(tk, ["("]))) {
          left = lmul(left, factor()); // implizite Multiplikation: 4a, 4(a + 1)
        } else break;
      }
      return left;
    }
    function factor() {
      const tk = peek();
      if (isOp(tk, ["-"])) { i++; return lneg(factor()); }
      if (isOp(tk, ["+"])) { i++; return factor(); }
      return atom();
    }
    function atom() {
      const tk = toks[i++];
      if (!tk) fail();
      if (tk.t === "num") return konst(tk.v);
      if (tk.t === "id") {
        if (tk.v !== v) throw new Error("var:" + tk.v);
        return { c: new Frac(0), k: new Frac(1) };
      }
      if (isOp(tk, ["("])) {
        const e = expr();
        if (!isOp(toks[i++], [")"])) fail();
        return e;
      }
      return fail();
    }

    if (!toks.length) fail();
    const r = expr();
    if (i !== toks.length) fail();
    return r;
  }

  // Variable eines Terms: der einzige Kleinbuchstabe. null, wenn keiner oder mehrere.
  function termVariable(s) {
    const letters = [...new Set(s.match(/[a-zA-Z]/g) || [])];
    return letters.length === 1 && /[a-z]/.test(letters[0]) ? letters[0] : null;
  }

  // Zwei lineare Formen sind gleich, wenn sie an drei Stellen den gleichen Wert haben.
  const POINTS = [2, -3, 7].map(x => new Frac(x));
  const sameAt = (p, q) => POINTS.every(x => p.c.add(p.k.mul(x)).eq(q.c.add(q.k.mul(x))));

  // ---------- Art der Lösung ----------
  function answerKind(task) {
    if (!task || !task.a) return null;
    const t = solutionText(task);
    if (!t) return null;
    if (parseNumber(t, true) !== null) return "number";
    if (/[=;:]/.test(t)) return null;
    const s = normMinus(t);
    const v = termVariable(s);
    if (!v) return null;
    try {
      return parseLinear(s, v).k.n !== 0 ? "term" : null;
    } catch (e) {
      return null;
    }
  }

  function checkNumber(task, text) {
    const want = parseNumber(solutionText(task));
    const got = parseNumber(text);
    if (!got) return { ok: false, reason: "Eingabe nicht lesbar" };
    if (got.eq(want)) return { ok: true };
    if (got.eq(want.neg())) return { ok: false, reason: "Vorzeichen prüfen" };
    return { ok: false };
  }

  function checkTerm(task, text) {
    const sol = normMinus(solutionText(task));
    const v = termVariable(sol);
    const want = parseLinear(sol, v);
    let got;
    try {
      got = parseLinear(normMinus(text), v);
    } catch (e) {
      if (e.message.startsWith("var:")) return { ok: false, reason: "Variable „" + v + "“ verwenden" };
      return { ok: false, reason: "Eingabe nicht lesbar" };
    }
    return sameAt(want, got) ? { ok: true } : { ok: false };
  }

  function checkAnswer(task, input) {
    const kind = answerKind(task);
    if (!kind) return null;
    const text = input == null ? "" : String(input);
    if (!text.trim()) return { ok: false, reason: "Eingabe nicht lesbar" };
    return kind === "number" ? checkNumber(task, text) : checkTerm(task, text);
  }

  AG.answerKind = answerKind;
  AG.checkAnswer = checkAnswer;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
