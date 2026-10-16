// Skizzen für Aufgaben: kleines Zeichenwerkzeug (SVG in mm) und Umwandlung in PNG für Word/OneNote.
//
// Eine Aufgabe kann task.fig = { svg, w, h } haben (w, h in mm); Lösungen optional task.aFig.
// Zeichnen:
//   const s = AG.sketch(60, 40);              // Zeichenfläche 60 mm × 40 mm, Ursprung oben links, y nach unten
//   s.poly([[5,35],[45,35],[55,8],[15,8]]);   // Vieleck
//   s.line([15,8],[15,35], { dash: true });   // Linie, gestrichelt (Höhe, verdeckte Kante)
//   s.side([5,35],[45,35], "6 cm");           // Seitenbeschriftung außen an der Strecke
//   s.angle([5,35],[45,35],[15,8], "α");      // Winkelbogen am ersten Punkt zwischen zwei Richtungen
//   s.right([15,35],[45,35],[15,8]);          // rechter Winkel (Quadrat mit Punkt)
//   s.label([30,20], "A", { anchor: "middle" });
//   const fig = s.done();                     // { svg, w, h }
(function (AG) {
  const INK = "#1b2130", GREY = "#5a6275", FILL = "#eaf0fc";
  const FONT = "Arial, Helvetica, sans-serif";
  const r1 = v => Math.round(v * 100) / 100;
  const escX = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function sketch(w, h, opts = {}) {
    const parts = [];
    const size = opts.fontSize || 3.4; // mm, ca. 10 pt
    const api = {
      w, h, size,
      poly(pts, o = {}) {
        parts.push(`<polygon points="${pts.map(p => r1(p[0]) + "," + r1(p[1])).join(" ")}" fill="${o.fill === undefined ? FILL : o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.width || 0.35}" stroke-linejoin="round"${o.dash ? ' stroke-dasharray="1.2 0.9"' : ""}/>`);
        return api;
      },
      line(a, b, o = {}) {
        parts.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="${o.stroke || (o.dash ? GREY : INK)}" stroke-width="${o.width || 0.35}"${o.dash ? ' stroke-dasharray="1.2 0.9"' : ""} stroke-linecap="round"/>`);
        return api;
      },
      path(d, o = {}) {
        parts.push(`<path d="${d}" fill="${o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.width || 0.35}"${o.dash ? ' stroke-dasharray="1.2 0.9"' : ""}/>`);
        return api;
      },
      circle(c, r, o = {}) {
        parts.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(r)}" fill="${o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.width || 0.35}"${o.dash ? ' stroke-dasharray="1.2 0.9"' : ""}/>`);
        return api;
      },
      rect(x, y, rw, rh, o = {}) {
        parts.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(rw)}" height="${r1(rh)}" fill="${o.fill === undefined ? FILL : o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.width || 0.35}"/>`);
        return api;
      },
      // Text; anchor: start | middle | end; Grundlinie wird so verschoben, dass p die Textmitte ist
      label(p, text, o = {}) {
        const fs = o.size || size;
        parts.push(`<text x="${r1(p[0])}" y="${r1(p[1] + fs * 0.35)}" font-family="${FONT}" font-size="${fs}" text-anchor="${o.anchor || "middle"}" fill="${o.color || INK}" stroke="#fff" stroke-width="${o.halo === false ? 0 : 0.9}" paint-order="stroke" stroke-linejoin="round"${o.bold ? ' font-weight="bold"' : ""}${o.italic ? ' font-style="italic"' : ""}>${escX(text)}</text>`);
        return api;
      },
      // Seitenbeschriftung: mittig neben der Strecke a→b, auf der Seite, die vom Punkt "inside" weg zeigt
      // (ohne inside: links von a→b in Zeichenrichtung)
      side(a, b, text, o = {}) {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        let nx = -(b[1] - a[1]), ny = b[0] - a[0];
        const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        if (o.inside) { const d = (o.inside[0] - mx) * nx + (o.inside[1] - my) * ny; if (d > 0) { nx = -nx; ny = -ny; } }
        const off = o.offset || size * 0.95;
        const p = [mx + nx * off, my + ny * off];
        const anchor = Math.abs(nx) < 0.35 ? "middle" : nx > 0 ? "start" : "end";
        return api.label([p[0] + (anchor === "start" ? -0.4 : anchor === "end" ? 0.4 : 0), p[1]], text, { ...o, anchor });
      },
      // Winkelbogen am Scheitel v zwischen den Richtungen v→p und v→q (kleinerer Winkel)
      angle(v, p, q, text, o = {}) {
        const rr = o.r || 4.5;
        let a1 = Math.atan2(p[1] - v[1], p[0] - v[0]), a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
        let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const s = [v[0] + rr * Math.cos(a1), v[1] + rr * Math.sin(a1)];
        const e = [v[0] + rr * Math.cos(a1 + d), v[1] + rr * Math.sin(a1 + d)];
        parts.push(`<path d="M${r1(s[0])},${r1(s[1])} A${rr},${rr} 0 0 ${d > 0 ? 1 : 0} ${r1(e[0])},${r1(e[1])}" fill="none" stroke="${o.stroke || INK}" stroke-width="0.3"/>`);
        if (text) {
          const m = a1 + d / 2, tr = rr + (o.textOffset || size * 0.9);
          api.label([v[0] + tr * Math.cos(m), v[1] + tr * Math.sin(m)], text, { size: o.size, color: o.color });
        }
        return api;
      },
      // Zeichen für rechten Winkel am Scheitel v zwischen v→p und v→q
      right(v, p, q, o = {}) {
        const k = o.k || 2.8;
        const u = norm([p[0] - v[0], p[1] - v[1]]), w2 = norm([q[0] - v[0], q[1] - v[1]]);
        const a = [v[0] + u[0] * k, v[1] + u[1] * k], c = [v[0] + w2[0] * k, v[1] + w2[1] * k];
        const b = [a[0] + w2[0] * k, a[1] + w2[1] * k];
        parts.push(`<polyline points="${r1(a[0])},${r1(a[1])} ${r1(b[0])},${r1(b[1])} ${r1(c[0])},${r1(c[1])}" fill="none" stroke="${INK}" stroke-width="0.3"/>`);
        const dot = [v[0] + (u[0] + w2[0]) * k * 0.5, v[1] + (u[1] + w2[1]) * k * 0.5];
        parts.push(`<circle cx="${r1(dot[0])}" cy="${r1(dot[1])}" r="0.35" fill="${INK}"/>`);
        return api;
      },
      raw(svgFragment) { parts.push(svgFragment); return api; },
      done() {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
        return { svg, w, h };
      },
    };
    return api;
  }
  function norm(v) { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  // Punkte einer Figur in ein Feld (Breite × Höhe in mm, mit Rand) einpassen; Seitenverhältnis bleibt.
  // pts in beliebigen Einheiten (y nach oben!), Rückgabe: Funktion f([x,y]) -> mm-Koordinate (y nach unten)
  function fit(pts, w, h, pad = 6) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sc = Math.min((w - 2 * pad) / ((maxX - minX) || 1), (h - 2 * pad) / ((maxY - minY) || 1));
    const ox = (w - (maxX - minX) * sc) / 2, oy = (h - (maxY - minY) * sc) / 2;
    return p => [ox + (p[0] - minX) * sc, h - oy - (p[1] - minY) * sc];
  }

  // ---------- SVG -> PNG (nur im Browser) ----------
  const pngCache = new Map(); // svg -> { dataUrl, bytes, pxW, pxH }
  async function rasterize(fig, scale = 4) {
    if (pngCache.has(fig.svg)) return pngCache.get(fig.svg);
    if (typeof document === "undefined" || typeof Image === "undefined") return null;
    const pxW = Math.round(fig.w / 25.4 * 96 * scale), pxH = Math.round(fig.h / 25.4 * 96 * scale);
    const img = new Image();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fig.svg.replace(/width="[^"]*mm" height="[^"]*mm"/, `width="${pxW}" height="${pxH}"`));
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("Skizze ließ sich nicht umwandeln")); img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = pxW; canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, pxW, pxH);
    ctx.drawImage(img, 0, 0, pxW, pxH);
    const dataUrl = canvas.toDataURL("image/png");
    const bin = atob(dataUrl.split(",")[1]);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const out = { dataUrl, bytes, pxW, pxH };
    pngCache.set(fig.svg, out);
    return out;
  }
  // alle Skizzen eines Blatts vorab umwandeln (für Word und OneNote)
  async function rasterizeSheet(sheet) {
    for (const p of sheet.parts) for (const t of p.tasks) {
      if (t.fig) await rasterize(t.fig);
      if (t.aFig) await rasterize(t.aFig);
    }
  }

  function figHtml(fig, cls = "fig") {
    return fig ? `<div class="${cls}" style="width:${fig.w}mm;max-width:100%">${fig.svg.replace(/ width="[^"]*mm" height="[^"]*mm"/, '')}</div>` : "";
  }

  AG.sketch = sketch;
  AG.fitPoints = fit;
  AG.rasterizeFig = rasterize;
  AG.rasterizeSheet = rasterizeSheet;
  AG.figPng = fig => pngCache.get(fig.svg) || null;
  AG.figHtml = figHtml;
  AG.SKETCH_COLORS = { INK, GREY, FILL };
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
