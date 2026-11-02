// Fotos im Eintrag nachträglich zuschneiden und drehen: Tipp auf ein Foto im Bearbeiten-Fenster.
// Der Ausschnitt wird in der Auflösung des gespeicherten Fotos übernommen (nicht noch einmal verkleinert)
// und mit hoher Qualität gespeichert; das Foto bekommt dabei eine neue Kennung.

export default function installZuschnitt(app) {
  const { esc, newId, toast, shrink } = app;
  const RATIOS = [['frei', 'Frei', 0], ['1:1', '1:1', 1], ['4:3', '4:3', 4 / 3], ['3:4', '3:4', 3 / 4], ['16:9', '16:9', 16 / 9]];
  let st = null;   // { id, item, img, rot, ratio, box: {x,y,w,h} in Bildschirm-Pixeln, view: {x,y,w,h,scale} }

  // Tipp auf ein Foto im Eintragsformular (nicht auf das Kreuz, nicht nach dem Ziehen)
  document.addEventListener('click', ev => {
    const fig = ev.target.closest && ev.target.closest('#photoGrid figure[data-pid]');
    if (!fig || ev.target.closest('button')) return;
    open(fig.dataset.pid);
  });

  async function source(item) {
    if (item.data) return item.data;
    const p = await app.store().get('photos', item.id).catch(() => null);
    return (p && p.data) || item.thumb;
  }
  const load = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

  async function open(id) {
    const fp = app.formPhotos();
    const item = [...fp.keep, ...fp.add].find(p => p.id === id);
    if (!item) return;
    let img;
    try { img = await load(await source(item)); } catch { return toast('Das Foto ließ sich nicht laden (offline?).'); }
    if (img.naturalWidth < 400 && item.thumb && img.src === item.thumb) toast('Nur die Vorschau ist verfügbar, das Ergebnis wird klein.');
    st = { id, item, orig: img, img: toCanvas(img, 0), rot: 0, ratio: 0 };
    build();
  }
  // Bild (gedreht) als Leinwand: Grundlage für Anzeige und Ausschnitt
  function toCanvas(img, rot) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const c = document.createElement('canvas');
    c.width = rot % 180 ? h : w; c.height = rot % 180 ? w : h;
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.rotate(rot * Math.PI / 180); g.drawImage(img, -w / 2, -h / 2);
    return c;
  }

  let ov = null;
  function build() {
    ov && ov.remove();
    ov = document.createElement('div');
    ov.className = 'crop-ov';
    ov.innerHTML = `<div class="crop-top"><b>Zuschneiden</b><div class="chips">${RATIOS.map(([k, l]) => `<button type="button" class="chip${k === 'frei' ? ' on' : ''}" data-r="${k}">${esc(l)}</button>`).join('')}
        <button type="button" class="chip" data-rot="1" aria-label="Um 90 Grad drehen">↻ Drehen</button></div></div>
      <div class="crop-stage"><div class="crop-view"></div><div class="crop-box"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div>
      <div class="crop-foot"><button type="button" class="ghost" data-c="cancel">Abbrechen</button><button type="button" class="ghost" data-c="reset">Zurücksetzen</button>
        <button type="button" class="primary" data-c="ok">Übernehmen</button></div>`;
    // Im offenen Fenster einhängen (der Dialog liegt über allem anderen)
    (document.querySelector('#sheet[open]') || document.body).appendChild(ov);
    ov.querySelector('.crop-view').appendChild(st.img);
    layout(true);
    ov.addEventListener('click', onClick);
    ov.querySelector('.crop-stage').addEventListener('pointerdown', down);
    window.addEventListener('resize', relayout);
  }
  const relayout = () => { if (st && ov) layout(false); };
  function close() { window.removeEventListener('resize', relayout); ov && ov.remove(); ov = null; st = null; }

  // Bild in die Fläche einpassen; Rahmen anfangs über das ganze Bild (bzw. größtmöglich im gewählten Format)
  function layout(resetBox) {
    const stage = ov.querySelector('.crop-stage').getBoundingClientRect();
    const c = st.img, scale = Math.min((stage.width - 24) / c.width, (stage.height - 24) / c.height, 1);
    const old = st.view;
    st.view = { w: c.width * scale, h: c.height * scale, scale };
    st.view.x = (stage.width - st.view.w) / 2; st.view.y = (stage.height - st.view.h) / 2;
    Object.assign(c.style, { left: `${st.view.x}px`, top: `${st.view.y}px`, width: `${st.view.w}px`, height: `${st.view.h}px` });
    if (resetBox || !st.box) fullBox();
    else if (old) { const f = st.view.scale / old.scale; st.box = { x: st.view.x + (st.box.x - old.x) * f, y: st.view.y + (st.box.y - old.y) * f, w: st.box.w * f, h: st.box.h * f }; }
    drawBox();
  }
  function fullBox() {
    const v = st.view, r = st.ratio;
    let w = v.w, h = v.h;
    if (r) { if (w / h > r) w = h * r; else h = w / r; }
    st.box = { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
  }
  function drawBox() {
    const b = st.box, el = ov.querySelector('.crop-box');
    Object.assign(el.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
  }

  function onClick(ev) {
    const r = ev.target.closest('[data-r]'), rot = ev.target.closest('[data-rot]'), c = ev.target.closest('[data-c]');
    if (r) {
      ov.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === r));
      st.ratio = RATIOS.find(x => x[0] === r.dataset.r)[2];
      fullBox(); drawBox();
    } else if (rot) {
      // Immer vom ungedrehten Original aus drehen (kein Qualitätsverlust durch mehrfaches Drehen)
      st.rot = (st.rot + 90) % 360;
      const v = ov.querySelector('.crop-view'); v.innerHTML = '';
      st.img = toCanvas(st.orig, st.rot);
      v.appendChild(st.img);
      layout(true);
    } else if (c && c.dataset.c === 'cancel') close();
    else if (c && c.dataset.c === 'reset') {
      st.ratio = 0; ov.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x.dataset.r === 'frei'));
      if (st.rot) { st.rot = 0; const v = ov.querySelector('.crop-view'); v.innerHTML = ''; st.img = toCanvas(st.orig, 0); v.appendChild(st.img); }
      layout(true);
    }
    else if (c && c.dataset.c === 'ok') apply();
  }
  // Rahmen verschieben (innen) oder an den Ecken größer/kleiner ziehen
  function down(ev) {
    const h = ev.target.dataset && ev.target.dataset.h, inBox = ev.target.closest('.crop-box');
    if (!h && !inBox) return;
    ev.preventDefault();
    const start = { x: ev.clientX, y: ev.clientY, b: { ...st.box } };
    const move = e => {
      const dx = e.clientX - start.x, dy = e.clientY - start.y, v = st.view, b0 = start.b;
      let b = { ...b0 };
      if (!h) { b.x = clamp(b0.x + dx, v.x, v.x + v.w - b0.w); b.y = clamp(b0.y + dy, v.y, v.y + v.h - b0.h); }
      else {
        const left = h.includes('w'), top = h.includes('n');
        let x1 = left ? b0.x + dx : b0.x, x2 = left ? b0.x + b0.w : b0.x + b0.w + dx;
        let y1 = top ? b0.y + dy : b0.y, y2 = top ? b0.y + b0.h : b0.y + b0.h + dy;
        x1 = clamp(x1, v.x, x2 - 30); x2 = clamp(x2, x1 + 30, v.x + v.w);
        y1 = clamp(y1, v.y, y2 - 30); y2 = clamp(y2, y1 + 30, v.y + v.h);
        b = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
        if (st.ratio) {
          // Format halten: Höhe folgt der Breite, notfalls umgekehrt, damit es im Bild bleibt
          let w = b.w, hh = w / st.ratio;
          const maxH = top ? b0.y + b0.h - v.y : v.y + v.h - b0.y;
          if (hh > maxH) { hh = maxH; w = hh * st.ratio; }
          b = { x: left ? b0.x + b0.w - w : b0.x, y: top ? b0.y + b0.h - hh : b0.y, w, h: hh };
        }
      }
      st.box = b; drawBox();
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  async function apply() {
    const { box: b, view: v, img } = st;
    const f = 1 / v.scale;
    const sx = Math.round((b.x - v.x) * f), sy = Math.round((b.y - v.y) * f);
    const sw = Math.min(img.width - sx, Math.round(b.w * f)), sh = Math.min(img.height - sy, Math.round(b.h * f));
    if (!st.rot && sx <= 1 && sy <= 1 && sw >= img.width - 2 && sh >= img.height - 2) { close(); return; }   // nichts geändert
    // Ausschnitt in Originalgröße: keine weitere Verkleinerung, hohe JPEG-Qualität
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const data = c.toDataURL('image/jpeg', 0.92);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.9));
    const thumb = await shrink(blob, 360, 0.75);
    const { lat, lng, at } = st.item;
    app.replaceFormPhoto(st.id, { id: newId(), thumb, data, ...(lat != null ? { lat, lng } : {}), ...(at ? { at } : {}) });
    close();
    toast(`Zugeschnitten (${sw} × ${sh} Pixel). Wird mit dem Eintrag gespeichert.`);
  }

}
