// Arbeitsblatt als PNG-Bild (zum Kopieren in die Zwischenablage, z. B. für OneNote) – ohne externe Bibliothek.
(function (AG) {
  const PAGE_W = 794;   // 210 mm in CSS-Pixeln (96 dpi)
  const GAP = 24;       // Abstand zwischen mehreren Seiten
  const BG = "#d9dee8"; // Hintergrund zwischen mehreren Seiten
  // Custom Properties, die nur auf :root definiert sind. In der SVG-Grafik ist :root nicht das HTML-Root,
  // deshalb werden ihre berechneten Werte in eine eigene Regel kopiert.
  const ROOT_VARS = ["--sheet-font", "--ui", "--ink", "--red", "--grey", "--part-0", "--part-1", "--part-2", "--part-3"];

  const escXml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function allPageCss() {
    return [...document.querySelectorAll("style")].map(s => s.textContent).join("\n");
  }

  function rootVarsCss() {
    const cs = getComputedStyle(document.documentElement);
    const decls = ROOT_VARS
      .map(name => [name, cs.getPropertyValue(name).trim()])
      .filter(([, value]) => value)
      .map(([name, value]) => `${name}: ${value};`);
    return `.ag-page { ${decls.join(" ")} }`;
  }

  // html: ein oder mehrere <article class="sheet ...">-Elemente (Ausgabe von AG.sheetHtml).
  // options.scale: Auflösungsfaktor des PNG (Standard 2).
  // Rückgabe: Promise<Blob> (image/png). Wirft eine Exception mit deutscher Meldung bei Fehlern.
  async function sheetsToPng(html, options) {
    const scale = (options && options.scale) || 2;

    // 1. Seiten unsichtbar einhängen, Höhe messen und als XHTML serialisieren.
    const host = document.createElement("div");
    host.style.cssText = `position:absolute; left:-10000px; top:0; width:${PAGE_W}px;`;
    host.innerHTML = html;
    host.querySelectorAll(".reroll").forEach(el => el.remove());
    document.body.appendChild(host);
    let pages;
    try {
      pages = [...host.querySelectorAll("article")].map(el => ({
        h: Math.ceil(el.getBoundingClientRect().height),
        xml: new XMLSerializer().serializeToString(el),
      }));
    } finally {
      host.remove();
    }
    if (!pages.length) throw new Error("Kein Arbeitsblatt zum Kopieren gefunden.");

    // 2. SVG mit foreignObject; die Seiten untereinander, mit Abstand zwischen mehreren Seiten.
    const totalH = pages.reduce((sum, p) => sum + p.h, 0) + GAP * (pages.length - 1);
    const css = (allPageCss() + "\n" + rootVarsCss()).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    let y = 0;
    const objects = pages.map((p, i) => {
      if (i) y += GAP;
      // Das CSS nur einmal einbetten: Stile gelten für das ganze SVG-Dokument.
      const styleEl = i === 0 ? `<style>${css}</style>` : "";
      const obj = `<foreignObject x="0" y="${y}" width="${PAGE_W}" height="${p.h}">` +
        `<div xmlns="http://www.w3.org/1999/xhtml">${styleEl}<div class="ag-page">${p.xml}</div></div></foreignObject>`;
      y += p.h;
      return obj;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W * scale}" height="${totalH * scale}" viewBox="0 0 ${PAGE_W} ${totalH}">${objects}</svg>`;

    // 3. SVG als Bild laden und auf ein Canvas zeichnen.
    const img = new Image();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Das Blatt konnte nicht als Bild gerendert werden."));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(PAGE_W * scale);
    canvas.height = Math.round(totalH * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = pages.length > 1 ? BG : "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 4. Als PNG exportieren. Ein "tainted" Canvas wirft hier einen SecurityError.
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Das PNG konnte nicht erzeugt werden."));
        }, "image/png");
      } catch (e) {
        const gesperrt = e && e.name === "SecurityError";
        reject(new Error(gesperrt
          ? "Das Blatt konnte nicht als PNG erzeugt werden, weil der Browser das Bild als unsicher einstuft."
          : "Das PNG konnte nicht erzeugt werden."));
      }
    });
  }

  // Kopiert das PNG in die Zwischenablage. Liefert true bei Erfolg, sonst false (wirft nicht).
  async function copyPng(blob) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Rückfall, falls Kopieren nicht klappt: PNG als Datei herunterladen.
  function downloadPng(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "arbeitsblatt.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  AG.sheetsToPng = sheetsToPng;
  AG.copyPng = copyPng;
  AG.downloadPng = downloadPng;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
