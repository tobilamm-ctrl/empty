// Teilen: Reiseblog-Link zum Lesen (z. B. für die Großeltern) und Postkarten aus Fotos.

import { api } from './store.js';

export default function installTeilen(app) {
  const { S, ACTIONS, FORMS, esc, icon, toast, openSheet, closeSheet, fmtShort, tripColor, currentTrip } = app;
  const sheetHead = app.sheetHead;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const tripById = id => S.trips.find(t => t.id === id);

  /* ====================================================================== */
  /* Reiseblog                                                               */
  /* ====================================================================== */


  const blogUrl = token => new URL(`blog.html#${token}`, location.href).href;
  const DEFAULTS = { photos: true, texts: true, highlights: true, map: true, delay: false, greeting: '' };
  const optsOf = sh => ({ ...DEFAULTS, ...((sh && sh.opts) || {}) });
  // Serverfehler verständlich machen: „Unbekannte Aktion“ heißt, die api/index.php auf dem Webspace ist alt
  const why = e => (e.message === 'Keine Verbindung zum Server.' ? 'Keine Verbindung. Der Reiseblog braucht Internet.'
    : /Unbekannte Aktion/.test(e.message) ? 'Der Server-Teil ist veraltet: Bitte die neue Datei api/index.php auf den Webspace hochladen.' : e.message);

  let shares = null, loading = false, failed = '';
  async function load() {
    if (loading) return;
    loading = true;
    try { shares = (await api('share', undefined, `&crew=${app.crewId()}`)).shares || []; failed = ''; } catch (e) { failed = why(e); }
    loading = false;
    if (app.ui.route === 'reiseblog') app.render();
  }

  // Eigene Seite unter „Mehr“ (nur Verwalter)
  app.VIEWS.reiseblog = () => {
    if (!isAdmin()) return '<p class="hint">Den Reiseblog verwalten nur Verwalter.</p>';
    if (!shares && !failed) load();
    // Eingeschaltete Blogs zuerst, dann alle Reisen wie gewohnt
    const isOn = t => (shares || []).some(x => x.trip === t.id);
    const trips = app.sortTrips(S.trips).sort((a, b) => isOn(b) - isOn(a));
    const row = t => {
      const sh = (shares || []).find(x => x.trip === t.id);
      const o = optsOf(sh);
      const on = [o.photos ? 'Fotos' : '', o.texts ? 'Texte' : '', o.highlights ? 'Highlights' : '', o.map ? 'Karte' : '', o.delay ? 'einen Tag verzögert' : 'sofort'].filter(Boolean).join(', ');
      return `<li class="blog-row${sh ? ' on' : ''}" style="--c:${tripColor(t)}">
        <div class="blog-row-head"><span class="dot"></span><span class="txt"><b>${esc(t.name)}</b><small>${esc(app.fmtRange(t))}</small></span>
          <span class="tag">${sh ? 'öffentlich mit Link' : 'aus'}</span></div>
        ${sh ? `<input readonly class="blog-link" value="${esc(blogUrl(sh.token))}">
          <p class="sub">Zeigt: ${on}.</p>
          <div class="btnrow">
            <button class="primary small-btn" data-action="blog-share" data-token="${sh.token}" data-name="${esc(t.name)}">${icon('share')}Teilen</button>
            <button class="ghost small-btn" data-action="blog-copy" data-token="${sh.token}">Kopieren</button>
            <a class="ghost small-btn btn" href="${esc(blogUrl(sh.token))}" target="_blank" rel="noopener">Ansehen</a>
            <button class="ghost small-btn" data-action="blog-opts" data-id="${t.id}">Einstellungen</button>
            <button class="ghost small-btn danger" data-action="blog-toggle" data-id="${t.id}" data-on="">Aus</button>
          </div>`
        : `<div class="btnrow"><button class="ghost small-btn" data-action="blog-opts" data-id="${t.id}" data-new="1">Einschalten …</button></div>`}
      </li>`;
    };
    return `${app.pageHead('reiseblog', 'Reiseblog', 'Eure Reise zum Mitlesen für Oma, Opa und Freunde')}
      <p class="sub">Wer den geheimen Link hat, sieht die Reise ohne Konto und nur zum Lesen. Nie zu sehen sind Kosten, Kasse, Dokumente, Listen und wer etwas eingetragen hat. Einzelne Einträge blendet „Nicht im Reiseblog zeigen“ aus.</p>
      ${failed ? `<p class="hint">${esc(failed)}</p><button class="ghost" data-action="blog-reload">Nochmal versuchen</button>`
        : !shares ? '<p class="sub">Wird geladen …</p>'
        : `<ul class="blog-list">${trips.map(row).join('')}</ul>`}`;
  };
  ACTIONS['blog-reload'] = () => { shares = null; failed = ''; app.render(); };

  ACTIONS['blog-opts'] = el => {
    const t = tripById(el.dataset.id);
    const sh = (shares || []).find(x => x.trip === t.id);
    const o = optsOf(sh);
    const chk = (k, label, hint) => `<label class="check"><input type="checkbox" name="${k}"${o[k] ? ' checked' : ''}><span>${label}${hint ? `<small class="sub"> ${hint}</small>` : ''}</span></label>`;
    openSheet(`<form data-form="blog-opts" data-id="${t.id}">${sheetHead(`Reiseblog: ${esc(t.name)}`)}
      <label class="field"><span>Begrüßung oben im Blog (optional)</span><textarea name="greeting" rows="2" maxlength="300" placeholder="z. B. Hallo Oma und Opa, hier seht ihr, wo wir gerade sind!">${esc(o.greeting)}</textarea></label>
      ${chk('photos', 'Fotos zeigen', 'Fotos der Kinder sind dann für alle mit dem Link sichtbar.')}
      ${chk('texts', 'Texte der Einträge zeigen')}
      ${chk('highlights', 'Highlights des Tages zeigen')}
      ${chk('map', 'Karte mit der Strecke zeigen')}
      ${chk('delay', 'Erst am nächsten Tag zeigen', 'So sieht niemand, wo ihr gerade seid.')}
      <div class="sheet-foot">${sh ? '<button type="button" class="ghost" data-action="blog-renew" data-id="' + t.id + '">Neuen Link erzeugen</button>' : ''}
        <button class="primary">${sh ? 'Speichern' : 'Reiseblog einschalten'}</button></div></form>`);
  };
  const send = async (t, body) => {
    try {
      const res = await api('share', { crew: app.crewId(), trip: t.id, ...body });
      shares = (shares || []).filter(x => x.trip !== t.id);
      if (res.token) shares.push({ trip: t.id, token: res.token, opts: res.opts || {} });
      closeSheet();
      app.render();
      return res;
    } catch (e) { toast(why(e)); }
  };
  FORMS['blog-opts'] = form => {
    const t = tripById(form.dataset.id);
    const opts = { greeting: form.greeting.value.trim() };
    ['photos', 'texts', 'highlights', 'map', 'delay'].forEach(k => { opts[k] = form[k].checked; });
    send(t, { on: true, opts }).then(r => r && toast('Reiseblog gespeichert'));
  };
  ACTIONS['blog-renew'] = el => {
    if (!confirm('Neuen Link erzeugen? Der bisherige Link funktioniert dann nicht mehr.')) return;
    send(tripById(el.dataset.id), { on: true, renew: true }).then(r => r && toast('Neuer Link erzeugt'));
  };
  ACTIONS['blog-toggle'] = el => {
    if (!confirm('Reiseblog ausschalten? Der Link funktioniert dann nicht mehr.')) return;
    send(tripById(el.dataset.id), { on: false });
  };
  ACTIONS['blog-copy'] = async el => {
    try { await navigator.clipboard.writeText(blogUrl(el.dataset.token)); toast('Link kopiert'); } catch { toast('Bitte den Link markieren und kopieren.'); }
  };
  ACTIONS['blog-share'] = async el => {
    const url = blogUrl(el.dataset.token);
    if (navigator.share) {
      try { await navigator.share({ title: el.dataset.name, text: `Unsere Reise „${el.dataset.name}“ zum Mitlesen:`, url }); } catch { /* abgebrochen */ }
    } else ACTIONS['blog-copy'](el);
  };

  // Server-Teil prüfen: Verwalter bekommen einen Hinweis, wenn api/index.php nicht zur App passt
  const NEED = 22;
  let checked = false;
  app.chromeHooks.push(() => {
    if (checked || !isAdmin()) return;
    checked = true;
    api('version').then(r => { if ((r.version || 0) < NEED) throw new Error('alt'); })
      .catch(e => { if (e.message !== 'Keine Verbindung zum Server.') toast('Hinweis: Der Server-Teil ist veraltet. Bitte die neue api/index.php hochladen.'); });
  });

  /* ====================================================================== */
  /* Postkarte                                                               */
  /* ====================================================================== */

  const entryButtons = app.entryButtons;
  app.entryButtons = e => `${entryButtons ? entryButtons(e) : ''}${(e.photos || []).length ? `<button class="ghost" data-action="card-form" data-id="${e.id}">${icon('card')}Postkarte</button>` : ''}`;

  let cardState = null;
  ACTIONS['card-form'] = el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e) return;
    const t = tripById(e.tripId) || currentTrip();
    cardState = { e, t, photo: e.photos[0].id, blob: null };
    const where = e.place || e.title || t.name;
    openSheet(`<form data-form="card" class="card-form">${sheetHead('Postkarte')}
      ${e.photos.length > 1 ? `<div class="field"><span>Foto</span><div class="card-photos">${e.photos.map((p, i) =>
        `<label><input type="radio" name="photo" value="${p.id}"${i === 0 ? ' checked' : ''}><img src="${p.thumb}" alt=""></label>`).join('')}</div></div>` : ''}
      <label class="field"><span>Gruß</span><input name="head" value="Liebe Grüße aus ${esc(where)}!" maxlength="60"></label>
      <label class="field"><span>Text</span><textarea name="text" rows="3" maxlength="240">${esc((e.text || '').slice(0, 200))}</textarea></label>
      <label class="check small"><input type="checkbox" name="map" checked><span>Karte mit der Strecke</span></label>
      <div class="card-preview"><p class="sub">Vorschau erscheint nach „Erstellen“.</p></div>
      <div class="sheet-foot"><button type="button" class="ghost" data-action="card-share" disabled>${icon('share')}Teilen</button><button class="primary">Erstellen</button></div>
    </form>`);
  };

  FORMS.card = async form => {
    const { e, t } = cardState;
    const btn = form.querySelector('button.primary');
    btn.disabled = true; btn.textContent = 'Wird gestaltet …';
    try {
      const photoId = form.photo ? form.photo.value : e.photos[0].id;
      const cv = await drawCard({ e, t, photoId, head: form.head.value.trim(), text: form.text.value.trim(), withMap: form.map.checked });
      cardState.blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
      const url = URL.createObjectURL(cardState.blob);
      form.querySelector('.card-preview').innerHTML = `<img src="${url}" alt="Postkarte">`;
      form.querySelector('[data-action=card-share]').disabled = false;
    } catch (err) {
      toast('Die Postkarte ließ sich nicht erstellen: ' + err.message);
    } finally { btn.disabled = false; btn.textContent = 'Neu erstellen'; }
  };

  ACTIONS['card-share'] = async () => {
    if (!cardState || !cardState.blob) return;
    const name = `postkarte-${(cardState.e.place || cardState.e.title || 'lammping').toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-')}.jpg`;
    const file = new File([cardState.blob], name, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Postkarte' }); return; } catch (err) { if (err.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(cardState.blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    toast('Postkarte gespeichert');
  };

  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Foto nicht ladbar')); i.src = src; });

  // Zeilenumbruch für Canvas-Text
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    const words = text.split(/\s+/);
    let line = '', n = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        if (++n === maxLines) { ctx.fillText(line + ' …', x, y); return y + lh; }
        ctx.fillText(line, x, y); y += lh; line = words[i];
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  async function drawCard({ e, t, photoId, head, text, withMap }) {
    const W = 1500, H = 1000, color = tripColor(t);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    await document.fonts.ready;
    // Karton
    ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color; ctx.fillRect(0, H - 14, W, 14);

    // Foto links, weiß gerahmt und leicht gedreht
    const full = await app.store().get('photos', photoId).catch(() => null);
    const thumb = (e.photos.find(p => p.id === photoId) || {}).thumb;
    const img = await loadImg((full && full.data) || thumb);
    const pw = 860, ph = 760;
    ctx.save();
    ctx.translate(60 + pw / 2, 110 + ph / 2);
    ctx.rotate(-0.025);
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fff'; ctx.fillRect(-pw / 2 - 18, -ph / 2 - 18, pw + 36, ph + 36);
    ctx.shadowColor = 'transparent';
    const s = Math.max(pw / img.width, ph / img.height);
    const sw = pw / s, sh = ph / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, -pw / 2, -ph / 2, pw, ph);
    ctx.restore();

    // Trennlinie wie auf einer echten Postkarte
    const rx = 1000;
    ctx.strokeStyle = '#D9C9AE'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rx - 30, 120); ctx.lineTo(rx - 30, H - 90); ctx.stroke();

    // Briefmarke mit dem Schaf
    const sx = W - 230, sy = 60, sW = 170, sH = 200;
    ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, sW, sH);
    ctx.fillStyle = '#FBF6EC';
    for (let i = 0; i <= sW; i += 17) { ctx.beginPath(); ctx.arc(sx + i, sy, 6, 0, 7); ctx.arc(sx + i, sy + sH, 6, 0, 7); ctx.fill(); }
    for (let i = 0; i <= sH; i += 17) { ctx.beginPath(); ctx.arc(sx, sy + i, 6, 0, 7); ctx.arc(sx + sW, sy + i, 6, 0, 7); ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.strokeRect(sx + 14, sy + 14, sW - 28, sH - 28);
    const sheep = document.querySelector('#schaf path');
    if (sheep) {
      ctx.save(); ctx.translate(sx + 26, sy + 46); ctx.scale(0.235, 0.235);
      ctx.fillStyle = '#6B4226'; ctx.fill(new Path2D(sheep.getAttribute('d')), 'evenodd');
      ctx.restore();
    }
    ctx.fillStyle = '#6B4226'; ctx.font = '600 22px Fredoka, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('LAMMping', sx + sW / 2, sy + sH - 30);
    ctx.textAlign = 'left';

    // Gruß und Text
    let y = 330;
    ctx.fillStyle = '#6B4226'; ctx.font = '600 50px Fredoka, sans-serif';
    y = wrap(ctx, head || '', rx, y, W - rx - 60, 58, 3);
    ctx.fillStyle = '#3A2617'; ctx.font = '30px "Atkinson Hyperlegible", sans-serif';
    y = wrap(ctx, text || '', rx, y + 16, W - rx - 60, 40, withMap ? 4 : 9);

    // Kleine Karte mit der Strecke
    if (withMap && app.routeCanvas) {
      const map = await app.routeCanvas(t, 220, 140).catch(() => null);
      if (map) {
        const mw = 440, mh = 280, mx = rx, my = H - 90 - mh;
        ctx.save(); ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 16); ctx.clip();
        ctx.drawImage(map, mx, my, mw, mh); ctx.restore();
        ctx.strokeStyle = '#D9C9AE'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 16); ctx.stroke();
        ctx.fillStyle = '#7B6650'; ctx.font = '16px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('© OpenStreetMap-Mitwirkende', mx + mw - 10, my + mh - 10); ctx.textAlign = 'left';
      }
    }
    ctx.fillStyle = '#7B6650'; ctx.font = '24px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText(`${t.name} · ${fmtShort(e.date.slice(0, 10))}`, 60, H - 40);
    return cv;
  }
}
