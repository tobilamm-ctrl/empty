// Teilen, Drucken, Sichern: Wetter-Bilanz der Reise, Listen ausdrucken, Reise als eigene Webseiten-Datei
// (ohne LAMMping lesbar) und QR-Codes zum Teilen (Reiseblog, Lieblingsplätze, App).

import qrcode from '../vendor/qrcode/qrcode.js';

export default function installSichern(app) {
  const { S, LS, ui, VIEWS, ACTIONS, esc, icon, toast, render, openSheet, currentTrip, tripEntries, tripStats, byDate, hasPos,
    today, fmtDay, fmtTime, fmtRange, fmtKm, TYPES } = app;
  const sheetHead = app.sheetHead;
  const dec = (v, n = 1) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n });

  /* ====================================================================== */
  /* QR-Codes                                                                */
  /* ====================================================================== */

  function qrSvg(text, size = 260) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount(), m = 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR-Code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  app.qrSvg = qrSvg;
  ACTIONS['qr-show'] = el => {
    const url = el.dataset.url, title = el.dataset.title || 'QR-Code';
    openSheet(`<div class="qr-sheet">${sheetHead(esc(title))}
      <div class="qr-box">${qrSvg(url, 280)}</div>
      <p class="sub qr-url">${esc(url)}</p>
      <p class="sub">Mit der Kamera eines anderen Handys scannen.</p>
      <div class="sheet-foot"><button class="ghost" data-action="qr-copy" data-url="${esc(url)}">Link kopieren</button>
        ${navigator.share ? `<button class="primary" data-action="qr-share" data-url="${esc(url)}" data-title="${esc(title)}">${icon('share')}Teilen</button>` : ''}</div></div>`);
  };
  ACTIONS['qr-copy'] = async el => { try { await navigator.clipboard.writeText(el.dataset.url); toast('Link kopiert'); } catch { toast(el.dataset.url); } };
  ACTIONS['qr-share'] = async el => { try { await navigator.share({ title: el.dataset.title, url: el.dataset.url }); } catch { /* abgebrochen */ } };
  // QR-Knöpfe neben Reiseblog-Links und dem Link für Lieblingsplätze
  const addQr = root => {
    root.querySelectorAll('input.blog-link, .share-link input[readonly]').forEach(inp => {
      const row = inp.parentElement.querySelector('.btnrow');
      if (!row || row.querySelector('[data-action=qr-show]')) return;
      const title = inp.classList.contains('blog-link') ? 'Reiseblog' : 'Unsere Lieblingsplätze';
      row.insertAdjacentHTML('beforeend', `<button type="button" class="ghost small-btn" data-action="qr-show" data-url="${esc(inp.value)}" data-title="${title}">▦ QR-Code</button>`);
    });
  };
  app.afterDraw.push(addQr);
  new MutationObserver(() => addQr(document.getElementById('sheetBody'))).observe(document.getElementById('sheetBody'), { childList: true, subtree: true });
  // „App weitergeben“ steht zusammen mit „App installieren“ in den Einstellungen (app.js)

  /* ====================================================================== */
  /* Listen ausdrucken                                                       */
  /* ====================================================================== */

  const box = (t, done) => `<li class="${done ? 'done' : ''}"><span class="pb"></span>${esc(t)}</li>`;
  const printPage = (title, sub, groups) => `<article class="list-print"><header><svg class="pd-sheep" aria-hidden="true"><use href="#schaf"/></svg>
      <div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div></header>
    ${groups.map(([h, items]) => `<section>${h ? `<h2>${esc(h)}</h2>` : ''}<ul>${items.join('')}</ul></section>`).join('')}
    <footer>LAMMping · gedruckt am ${fmtDay(today())}</footer></article>`;
  function printList() {
    const kind = ui.listTab || 'einkauf';
    const ls = app.listsOf(kind);
    const cur = ls.find(l => l.id === LS.get('list.' + kind, null)) || ls[0];
    if (!cur) return toast('Keine Liste zum Drucken.');
    const items = S.listItems.filter(i => app.itemListId(i) === cur.id);
    const open = items.filter(i => !i.done).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || a.createdAt - b.createdAt).map(i => box(i.text));
    app.printHtml(printPage(cur.name, kind === 'einkauf' ? 'Einkaufsliste' : 'Merkliste', [['', open.length ? open : ['<li class="none">Alles erledigt.</li>']]]), cur.name);
  }
  function printPack() {
    const t = currentTrip();
    const boxes = S.boxes.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const stock = S.items.filter(i => !i.tripId);
    const groups = boxes.map(b => [`${b.name}${b.where ? ` (${b.where})` : ''}`, stock.filter(i => i.boxId === b.id).sort((a, c) => a.name.localeCompare(c.name)).map(i => box(i.name + (i.note ? ` – ${i.note}` : ''), t && app.isPacked(t, i)))]);
    const loose = stock.filter(i => !boxes.some(b => b.id === i.boxId));
    if (loose.length) groups.push(['Lose im Auto', loose.map(i => box(i.name, t && app.isPacked(t, i)))]);
    const extras = t ? app.extrasOf(t) : [];
    if (extras.length) groups.unshift([`Extra für „${t.name}“`, extras.map(i => box(i.name, app.isPacked(t, i)))]);
    app.printHtml(printPage('Packliste', t ? `${t.name}, ${fmtRange(t)}` : '', groups.filter(g => g[1].length)), 'Packliste');
  }
  function printCheck() {
    const cl = S.checklists.find(c => c.id === LS.get('check', null)) || S.checklists[0];
    if (!cl) return toast('Keine Checkliste zum Drucken.');
    app.printHtml(printPage(cl.name, 'Checkliste', [['', (cl.items || []).map(i => box(i.text))]]), cl.name);
  }
  ACTIONS['print-list'] = () => ({ listen: printList, packen: printPack, checklisten: printCheck })[ui.route]?.();
  app.afterDraw.push(view => {
    if (!['listen', 'packen', 'checklisten'].includes(ui.route) || view.querySelector('.print-btn')) return;
    if (ui.route === 'checklisten' && !S.checklists.length) return;
    const head = view.querySelector('.page-head');
    if (head) head.insertAdjacentHTML('afterend', `<button class="ghost small-btn print-btn" data-action="print-list">${icon('print')}Drucken</button>`);
  });

  /* ====================================================================== */
  /* Wetter-Bilanz der Reise (in der Statistik)                              */
  /* ====================================================================== */

  const SUNNY = [0, 1, 2];
  async function loadBalance(t) {
    const key = 'wxb.' + t.id, old = LS.get(key, null);
    const done = t.end && t.end < today();
    if (old && (old.final || Date.now() - old.at < 6 * 36e5)) return old;
    const es = tripEntries(t).filter(hasPos).sort(byDate);
    const days = [...new Set(tripEntries(t).map(e => e.date.slice(0, 10)))].filter(d => d <= today()).sort();
    if (!days.length || !es.length) return null;
    // Ort je Tag: letzter Stopp des Tages (sonst der davor); Tage am selben Ort gemeinsam abfragen
    const groups = [];
    days.forEach(d => {
      const p = es.filter(e => e.date.slice(0, 10) <= d).pop() || es[0];
      const k = `${(Math.round(p.lat * 2) / 2)},${(Math.round(p.lng * 2) / 2)}`;
      const g = groups[groups.length - 1];
      if (g && g.k === k) g.days.push(d); else groups.push({ k, p, days: [d] });
    });
    const out = {};
    for (const g of groups) {
      const a = g.days[0], b = g.days[g.days.length - 1];
      const old80 = (Date.now() - new Date(a + 'T12:00')) / 864e5 > 80;
      const base = old80 ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
      const r = await fetch(`${base}?latitude=${g.p.lat.toFixed(2)}&longitude=${g.p.lng.toFixed(2)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${a}&end_date=${b}`);
      if (!r.ok) throw new Error();
      const d = (await r.json()).daily || {};
      (d.time || []).forEach((day, i) => { if (g.days.includes(day) && d.weather_code[i] != null) out[day] = { code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i] || 0, place: g.p.place || g.p.title || '' }; });
    }
    const res = { at: Date.now(), final: !!done, days: out };
    LS.set(key, res);
    return res;
  }
  let loadingB = null;
  function balanceHtml(t) {
    const c = LS.get('wxb.' + t.id, null);
    if ((!c || (!c.final && Date.now() - c.at > 6 * 36e5)) && loadingB !== t.id && navigator.onLine) {
      loadingB = t.id;
      loadBalance(t).catch(() => {}).finally(() => { loadingB = null; if (ui.route === 'statistik') render(); });
    }
    if (!c || !Object.keys(c.days).length) return `<section class="panel wx-balance"><h2>Wetter-Bilanz: ${esc(t.name)}</h2><p class="sub">${navigator.onLine ? 'Wird berechnet …' : 'Braucht einmal Internet.'}</p></section>`;
    const list = Object.entries(c.days).sort((a, b) => a[0].localeCompare(b[0]));
    const sun = list.filter(([, d]) => SUNNY.includes(d.code) && d.rain < 1).length;
    const rain = list.filter(([, d]) => d.rain >= 1).length;
    const warm = list.reduce((m, x) => (x[1].max > m[1].max ? x : m));
    const cold = list.reduce((m, x) => (x[1].min < m[1].min ? x : m));
    const mm = list.reduce((s, [, d]) => s + d.rain, 0);
    return `<section class="panel wx-balance"><h2>Wetter-Bilanz: ${esc(t.name)}</h2>
      <div class="wxb-big"><div><b>☀️ ${sun}</b><small>Sonnentage</small></div><div><b>🌧️ ${rain}</b><small>Regentage</small></div><div><b>${dec(mm, 0)} mm</b><small>Regen insgesamt</small></div></div>
      <dl class="facts-list"><div><dt>Wärmster Tag</dt><dd>${dec(warm[1].max, 0)} °C am ${fmtDay(warm[0])}${warm[1].place ? `, ${esc(warm[1].place)}` : ''}</dd></div>
        <div><dt>Kälteste Nacht</dt><dd>${dec(cold[1].min, 0)} °C am ${fmtDay(cold[0])}${cold[1].place ? `, ${esc(cold[1].place)}` : ''}</dd></div></dl>
      <div class="wxb-strip">${list.map(([d, x]) => `<span title="${fmtDay(d)}: ${dec(x.max, 0)}° / ${dec(x.min, 0)}°, ${dec(x.rain)} mm">${app.wx ? app.wx.wxIcon(x.code) : ''}<small>${dec(x.max, 0)}°</small></span>`).join('')}</div>
      <p class="sub source">Wetterdaten: Open-Meteo.com (CC BY 4.0)</p></section>`;
  }
  const statistik = VIEWS.statistik;
  VIEWS.statistik = () => { const t = currentTrip(); return `${statistik()}${t && tripEntries(t).some(hasPos) ? balanceHtml(t) : ''}`; };

  /* ====================================================================== */
  /* Reise als eigene Datei (eine HTML-Datei mit allem)                      */
  /* ====================================================================== */

  const toDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  async function photoData(p, max) {
    try {
      const d = await app.store().get('photos', p.id);
      const src = d && d.data;
      if (!src) return p.thumb;
      const blob = src.startsWith('data:') ? await (await fetch(src)).blob() : await (await fetch(src, { credentials: 'same-origin' })).blob();
      // Etwas kleiner rechnen, damit die Datei handlich bleibt
      const shrunk = await app.shrink(new File([blob], 'f.jpg', { type: blob.type || 'image/jpeg' }), max, 0.78);
      return shrunk;
    } catch { return p.thumb; }
  }
  async function tripFile(t, opt, progress) {
    const st = tripStats(t);
    const es = tripEntries(t).slice().sort(byDate);
    const days = [...new Set(es.map(e => e.date.slice(0, 10)))];
    const total = es.reduce((s, e) => s + (e.photos || []).length, 0);
    let n = 0;
    const map = opt.map && app.tripMapHtml ? await app.tripMapHtml(t).catch(() => '') : '';
    const parts = [];
    for (const d of days) {
      const k = st.firstDay ? Math.round((new Date(d + 'T12:00') - new Date(st.firstDay + 'T12:00')) / 864e5) + 1 : 0;
      const rows = [];
      for (const e of es.filter(x => x.date.slice(0, 10) === d)) {
        const imgs = [];
        if (opt.photos) for (const p of e.photos || []) { imgs.push(`<a href="#p${p.id}"><img src="${await photoData(p, opt.big ? 1600 : 1000)}" alt="" loading="lazy" id="p${p.id}"></a>`); progress(++n, total); }
        rows.push(`<article><p class="m">${fmtTime(e.date)} · ${esc(TYPES[e.type].label)}${e.place ? ` · ${esc(e.place)}` : ''}${e.rating ? ` · ${'★'.repeat(e.rating)}` : ''}</p>
          ${e.title ? `<h3>${esc(e.title)}</h3>` : ''}${e.text ? e.text.split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('') : ''}${imgs.length ? `<div class="ph">${imgs.join('')}</div>` : ''}</article>`);
      }
      parts.push(`<section id="d${d}"><h2>${k > 0 ? `Tag ${k} · ` : ''}${fmtDay(d)}</h2>${rows.join('')}</section>`);
    }
    const css = `body{margin:0;font:18px/1.6 Georgia,'Iowan Old Style',serif;color:#2B1B10;background:#FBF6EC}main{max-width:760px;margin:0 auto;padding:24px 18px 60px}
      h1{font:700 36px/1.15 system-ui,sans-serif;margin:10px 0 4px;color:${app.tripColor(t)}}h2{font:700 22px system-ui,sans-serif;margin:40px 0 8px;border-bottom:2px solid #E8DCC7;padding-bottom:6px}
      h3{font:700 20px system-ui,sans-serif;margin:4px 0}.m{font:600 13px system-ui,sans-serif;color:#8A6A4A;text-transform:uppercase;letter-spacing:.04em;margin:0}
      article{margin:20px 0}.ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;margin-top:8px}.ph img{width:100%;border-radius:4px;display:block}
      .facts{font:15px system-ui,sans-serif;color:#6B4226}.map img,.map svg{max-width:100%;height:auto;border-radius:6px}nav{font:14px system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:6px 12px;margin:14px 0}
      nav a{color:#0F6670}footer{font:13px system-ui,sans-serif;color:#8A6A4A;margin-top:40px}a img:target{position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:9;border-radius:0}`;
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.name)}</title><style>${css}</style></head>
      <body><main><p class="facts">Unser Reisetagebuch</p><h1>${esc(t.name)}</h1>
      <p class="facts">${esc(fmtRange(t))} · ${[st.days ? `${st.days} Tage` : '', st.dist ? fmtKm(st.dist) : '', `${es.length} Einträge`].filter(Boolean).join(' · ')}</p>
      ${map ? `<div class="map">${map}</div>` : ''}
      <nav>${days.map((d, i) => `<a href="#d${d}">Tag ${i + 1}</a>`).join('')}</nav>
      ${parts.join('')}
      <footer>Erstellt mit LAMMping am ${fmtDay(today())}. Diese Datei funktioniert ohne Internet in jedem Browser. Tipp auf ein Foto vergrößert es, „Zurück“ verkleinert.</footer></main></body></html>`;
  }
  ACTIONS['trip-file'] = el => {
    const t = S.trips.find(x => x.id === el.dataset.id) || currentTrip();
    const photos = tripEntries(t).reduce((s, e) => s + (e.photos || []).length, 0);
    openSheet(`<form data-form="trip-file" data-id="${t.id}">${sheetHead('Reise als eigene Datei')}
      <p class="sub">Eine einzige Webseiten-Datei mit Tagebuch${photos ? ', Fotos' : ''} und Karte. Sie lässt sich ohne LAMMping und ohne Internet öffnen, z. B. auf dem PC, per USB-Stick oder als Sicherung.</p>
      ${photos ? `<label class="check"><input type="checkbox" name="photos" checked><span>${photos} Fotos mitnehmen</span></label>
        <label class="check"><input type="checkbox" name="big"><span>Fotos in hoher Auflösung (größere Datei)</span></label>` : ''}
      <label class="check"><input type="checkbox" name="map" checked><span>Karte der Reise (braucht beim Erstellen Internet)</span></label>
      <p class="sub" id="tfProg"></p>
      <div class="sheet-foot"><button class="primary">${icon('download')}Datei erstellen</button></div></form>`);
  };
  app.FORMS['trip-file'] = async form => {
    const t = S.trips.find(x => x.id === form.dataset.id);
    const btn = form.querySelector('.primary'); btn.disabled = true;
    const prog = document.getElementById('tfProg');
    try {
      const html = await tripFile(t, { photos: form.photos ? form.photos.checked : false, big: form.big ? form.big.checked : false, map: form.map.checked && navigator.onLine },
        (n, total) => { if (prog) prog.textContent = `Fotos ${n} von ${total} …`; });
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${t.name.replace(/[^\wäöüÄÖÜß -]/g, '').trim() || 'Reise'}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      if (prog) prog.textContent = `Fertig: ${(blob.size / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`;
    } catch { toast('Die Datei ließ sich nicht erstellen.'); } finally { btn.disabled = false; }
  };
  const exportForm = ACTIONS['export-form'];
  ACTIONS['export-form'] = el => {
    exportForm(el);
    const f = document.querySelector('#sheetBody form[data-form=export-pdf]');
    if (f) f.querySelector('.sheet-foot').insertAdjacentHTML('beforebegin', `<h3 class="date-head">Als eigene Datei</h3>
      <p class="sub">Ganze Reise mit Fotos als Webseite, lesbar ohne LAMMping.</p>
      <button type="button" class="ghost" data-action="trip-file" data-id="${f.dataset.id}">${icon('download')}Reise als Datei</button>`);
  };
}
