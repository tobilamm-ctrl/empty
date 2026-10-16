// Zufallszahlen mit Startwert: gleicher Startwert -> gleiche Aufgaben.
(function (AG) {
  // Zeichenkette -> 32-Bit-Zahl (FNV-1a)
  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  // mulberry32
  function makeRng(seed) {
    let a = (typeof seed === "string" ? hash(seed) : seed) >>> 0;
    function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const rng = {
      next,
      // ganze Zahl in [min, max]
      int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
      // ganze Zahl in [min, max] ohne die Werte in exclude
      intExcept(min, max, exclude) {
        for (let i = 0; i < 1000; i++) {
          const v = rng.int(min, max);
          if (!exclude.includes(v)) return v;
        }
        throw new Error("intExcept: kein Wert gefunden");
      },
      // ganze Zahl ungleich 0 in [-max, -min] ∪ [min, max]
      signedInt(min, max) { return rng.int(min, max) * (next() < 0.5 ? -1 : 1); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      chance(p) { return next() < p; },
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    return rng;
  }

  AG.hash = hash;
  AG.makeRng = makeRng;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
