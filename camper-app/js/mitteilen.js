// Mitteilen: Familien-Pinnwand, Tageszusammenfassung zum Teilen (Punkte auswählen, eigene Sätze),
// „Teilen mit LAMMping“ aus anderen Apps (Tagebuch, Wunschliste oder Reiseideen) und das Reisefoto,
// das bei jeder Fahrt mit demselben Motiv entsteht.

export default function installMitteilen(app) {
  const {
    S, LS, VIEWS, ACTIONS, FORMS, CHANGES, esc, icon, pageHead, newId, save, remove, toast, render, go, openSheet, closeSheet,
    currentTrip, tripEntries, tripStats, byDate, km, fmtKm, fmtDay, fmtShort, today, nowLocal, me, personName, shrink,
  } = app;
  const sheetHead = app.sheetHead;
  const running = t => t && !t.ended && t.start && t.start <= today() && (!t.end || t.end >= today());
  const ago = ms => app.ago(ms);

  /* ====================================================================== */
  /* Familien-Pinnwand                                                       */
  /* ====================================================================== */

  const DAY = 864e5;
  const QUICK = ['Bin duschen, gleich zurück', 'Bin beim Spülen', 'Brötchen sind bestellt', 'Essen ist fertig!', 'Wir gehen zum Strand',
    'Wer hat den Schlüssel?', 'Bin einkaufen', 'Bitte leise, Kleine schlafen'];
  const pins = () => S.games.filter(g => g.kind === 'pin' && Date.now() - g.at < DAY).sort((a, b) => b.at - a.at);
  // Alte Zettel räumt auf, wer sie geschrieben hat
  let cleaned = false;
  app.chromeHooks.push(() => {
    if (cleaned || !app.session || !app.session()) return;
    cleaned = true;
    S.games.filter(g => g.kind === 'pin' && g.by === me() && Date.now() - g.at > 3 * DAY).forEach(g => remove('games', g.id));
  });
  const pinList = (list, small) => list.length ? `<ul class="pins${small ? ' small' : ''}">${list.map(p => `<li>
      <b>${esc(personName(p.by))}</b><span>${esc(p.text)}</span><small>${ago(p.at)}</small>
      ${p.by === me() ? `<button class="icon-btn small" data-action="pin-del" data-id="${p.id}" aria-label="Zettel abnehmen">${icon('close')}</button>` : ''}</li>`).join('')}</ul>` : '';
  VIEWS.pinnwand = () => `${pageHead('pinnwand', 'Pinnwand', 'Kurz Bescheid sagen – für alle sichtbar, einen Tag lang')}
    <form data-form="pin" class="pin-form"><input name="text" maxlength="120" placeholder="Was gibt’s?" autocomplete="off" required>
      <button class="primary">${icon('plus')}Anheften</button></form>
    <div class="chips wrap">${QUICK.map(q => `<button class="chip" data-action="pin-quick" data-t="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    ${pinList(pins()) || '<p class="hint">Gerade hängt nichts an der Pinnwand.</p>'}`;
  const post = text => { save('games', { id: newId(), kind: 'pin', by: me(), text, at: Date.now() }); toast('Angeheftet'); };
  FORMS.pin = form => { const t = form.text.value.trim(); if (t) { post(t); form.reset(); closeSheet(); } };
  ACTIONS['pin-quick'] = el => { post(el.dataset.t); closeSheet(); };
  ACTIONS['pin-del'] = el => remove('games', el.dataset.id);
  ACTIONS['pin-new'] = () => openSheet(`<form data-form="pin">${sheetHead('Pinnwand')}
    <label class="field"><span>Nachricht an alle</span><input name="text" maxlength="120" required autocomplete="off"></label>
    <div class="chips wrap">${QUICK.map(q => `<button type="button" class="chip" data-action="pin-quick" data-t="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="sheet-foot"><button class="primary">Anheften</button></div></form>`);

  /* ====================================================================== */
  /* Tageszusammenfassung zum Teilen                                         */
  /* ====================================================================== */

  function dayData(t, d) {
    const es = tripEntries(t).filter(e => e.date && e.date.slice(0, 10) === d).sort(byDate);
    const st = tripStats(t);
    let dist = 0;
    const i0 = st.stops.findIndex(e => e.date.slice(0, 10) === d);
    if (i0 >= 0) for (let i = Math.max(1, i0); i < st.stops.length && st.stops[i].date.slice(0, 10) === d; i++) dist += km(st.stops[i - 1], st.stops[i]);
    const stay = es.filter(e => e.type === 'stellplatz').pop();
    const stops = es.filter(e => e.type !== 'stellplatz' && e.type !== 'notiz' && !(app.MINOR || []).includes(e.type) && (e.title || e.place));
    const hls = S.games.filter(g => g.kind === 'highlight' && g.tripId === t.id && g.day === d && (g.text || g.emoji));
    const q = S.games.find(g => g.id === `qotd_${t.id}_${d}`);
    const photos = es.flatMap(e => e.photos || []);
    const withPos = e => e && typeof e.lat === 'number' && typeof e.lng === 'number';
    const p = withPos(stay) ? stay : st.stops.filter(e => withPos(e) && e.date.slice(0, 10) <= d).pop();
    const w = p ? LS.get(`wxd.${p.lat.toFixed(1)},${p.lng.toFixed(1)}.${d}`, null) : null;
    const n = st.firstDay ? Math.round((new Date(d + 'T12:00') - new Date(st.firstDay + 'T12:00')) / DAY) + 1 : null;
    return { es, dist, stay, stops, hls, q, photos, w, n };
  }
  // Vorschläge für die Sätze; jede Person schreibt sie um, wie sie mag
  function parts(t, d) {
    const x = dayData(t, d);
    const list = [];
    list.push(['start', 'Überschrift', `${x.n > 0 ? `Tag ${x.n}` : fmtDay(d)} unserer Reise „${t.name}“ 🚐`]);
    if (x.dist >= 1) list.push(['km', 'Strecke', `Heute sind wir ${fmtKm(x.dist)} gefahren.`]);
    if (x.stops.length) list.push(['stops', 'Stopps', `Unterwegs waren wir ${x.stops.slice(0, 4).map(e => e.title || e.place).join(', ')}.`]);
    if (x.stay) list.push(['stay', 'Stellplatz', `Heute Nacht schlafen wir ${x.stay.title ? `auf „${x.stay.title}“` : ''}${x.stay.place ? ` in ${x.stay.place.split(',')[0]}` : ''}.`]);
    if (x.w && app.wx) list.push(['wetter', 'Wetter', `Das Wetter: ${app.wx.wx(x.w.code)[1].toLowerCase()}, bis ${Math.round(x.w.max)} °C.`]);
    if (x.hls.length) list.push(['hl', 'Highlights', `Highlights: ${x.hls.map(h => `${personName(h.by)}: ${h.emoji ? h.emoji + ' ' : ''}${h.text}`).join(' · ')}`]);
    if (x.q && Object.values(x.q.answers || {}).some(Boolean)) list.push(['frage', 'Frage des Tages', `${x.q.q} ${Object.entries(x.q.answers).filter(([, v]) => v).map(([k, v]) => `${personName(k)}: ${v}`).join(' · ')}`]);
    list.push(['gruss', 'Gruß', 'Liebe Grüße an alle zu Hause!']);
    return { list, photos: x.photos };
  }
  let sum = null;
  ACTIONS['day-share'] = el => {
    const t = currentTrip();
    if (!t) return toast('Legt zuerst eine Reise an.');
    const d = (el && el.dataset && el.dataset.day) || today();
    const { list, photos } = parts(t, d);
    sum = { t, d, photos };
    openSheet(`<form data-form="day-share" class="day-share">${sheetHead(`Tag teilen: ${esc(fmtDay(d))}`)}
      <p class="sub">Wähle aus, was hinein soll, und schreib die Sätze so, wie du magst.</p>
      ${list.map(([k, l, txt]) => `<div class="ds-part"><label class="check"><input type="checkbox" name="use" value="${k}"${['start', 'km', 'stay', 'hl', 'gruss'].includes(k) ? ' checked' : ''}><span>${l}</span></label>
        <textarea name="t_${k}" rows="2">${esc(txt)}</textarea></div>`).join('')}
      <div class="ds-part"><label class="check"><input type="checkbox" name="use" value="eigen"><span>Eigener Satz</span></label>
        <textarea name="t_eigen" rows="2" placeholder="z. B. Lena hat zum ersten Mal einen Fisch gefangen!"></textarea></div>
      ${photos.length ? `<div class="field"><span>Foto</span><div class="pc-photos">${['', ...photos.map(p => p.id)].map((id, i) => id
        ? `<label><input type="radio" name="photo" value="${id}"${i === 1 ? ' checked' : ''}><img src="${photos[i - 1].thumb}" alt=""></label>`
        : `<label class="no-photo"><input type="radio" name="photo" value=""><span>ohne</span></label>`).join('')}</div></div>` : ''}
      <div class="sheet-foot"><button type="button" class="ghost" data-action="day-share-copy">Text kopieren</button><button class="primary">${icon('share')}Teilen</button></div></form>`);
    // Häkchen setzen, sobald jemand in einen Satz schreibt
    setTimeout(() => document.querySelectorAll('.day-share textarea').forEach(ta => ta.addEventListener('input', () => {
      const cb = ta.parentElement.querySelector('input[type=checkbox]'); if (cb) cb.checked = !!ta.value.trim();
    })), 0);
  };
  const shareText = form => [...form.querySelectorAll('[name=use]:checked')].map(c => form[`t_${c.value}`].value.trim()).filter(Boolean).join('\n\n');
  ACTIONS['day-share-copy'] = async el => {
    const text = shareText(el.closest('form'));
    try { await navigator.clipboard.writeText(text); toast('Text kopiert'); } catch { toast('Kopieren ging nicht'); }
  };
  FORMS['day-share'] = async form => {
    const text = shareText(form);
    if (!text) return toast('Bitte mindestens einen Punkt auswählen.');
    const pid = form.photo ? form.photo.value : '';
    let file = null;
    if (pid) {
      try {
        const p = await app.store().get('photos', pid);
        const blob = await (await fetch(p && p.data ? p.data : sum.photos.find(x => x.id === pid).thumb)).blob();
        file = new File([blob], 'lammping-tag.jpg', { type: 'image/jpeg' });
      } catch { /* dann ohne Foto */ }
    }
    if (navigator.share) {
      const data = file && navigator.canShare && navigator.canShare({ files: [file] }) ? { text, files: [file] } : { text };
      try { await navigator.share(data); closeSheet(); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  /* ====================================================================== */
  /* „Teilen mit LAMMping“ (aus Google Maps, Galerie, Browser …)             */
  /* ====================================================================== */

  // Der Service Worker legt Geteiltes im Speicher „lammping-share“ ab (sw.js), Links ohne Dateien kommen als ?text=… an
  async function loadShared() {
    const out = { title: '', text: '', url: '', files: [] };
    const q = new URLSearchParams(location.search);
    ['title', 'text', 'url'].forEach(k => { if (q.get(k)) out[k] = q.get(k); });
    try {
      const c = await caches.open('lammping-share');
      const meta = await c.match('meta');
      if (meta) {
        Object.assign(out, await meta.json());
        for (let i = 0; i < (out.count || 0); i++) { const r = await c.match('f' + i); if (r) out.files.push(await r.blob()); }
      }
    } catch { /* kein Speicher */ }
    // Manche Apps packen den Link in den Text
    if (!out.url) { const m = (out.text || '').match(/https?:\/\/\S+/); if (m) { out.url = m[0]; out.text = out.text.replace(m[0], '').trim(); } }
    return out;
  }
  async function clearShared() {
    try { await caches.delete('lammping-share'); } catch { /* egal */ }
    if (location.search) history.replaceState(null, '', location.pathname + location.hash);
  }
  // Koordinaten aus einem Kartenlink (Google Maps, Apple, OSM), wenn sie drinstehen
  const coordsOf = s => {
    const m = String(s || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || String(s || '').match(/[?&](?:q|ll|query|daddr)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || String(s || '').match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
    return m ? { lat: +m[1], lng: +m[2] } : null;
  };
  const nameOf = sh => (sh.title || (sh.text || '').split('\n')[0] || '').slice(0, 80) || 'Geteilter Ort';
  let shared = null;
  VIEWS.teilen = () => {
    if (!shared) { loadShared().then(s => { shared = s; render(); }); return `${pageHead('ideen', 'Geteilt')}<p class="sub">Wird geladen …</p>`; }
    const s = shared;
    const thumbs = s.files.filter(f => /^image\//.test(f.type)).map(f => URL.createObjectURL(f));
    const pos = coordsOf(s.url) || coordsOf(s.text);
    const ideas = S.ideas.filter(i => !i.tripId).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!s.title && !s.text && !s.url && !s.files.length) return `${pageHead('ideen', 'Geteilt')}<p class="hint">Hier ist nichts angekommen. Teile aus einer anderen App (z. B. Google Maps) über „Teilen“ → LAMMping.</p>`;
    return `${pageHead('ideen', 'Mit LAMMping geteilt', 'Wohin damit?')}
      <section class="panel shared">
        ${s.title ? `<b>${esc(s.title)}</b>` : ''}${s.text ? `<p>${esc(s.text)}</p>` : ''}${s.url ? `<p class="sub">${esc(s.url)}</p>` : ''}
        ${pos ? `<p class="sub">📍 Position erkannt</p>` : ''}
        ${thumbs.length ? `<div class="pc-photos">${thumbs.map(u => `<img src="${u}" alt="">`).join('')}</div>` : ''}
      </section>
      <div class="share-dest">
        <button class="primary" data-action="shared-entry">${icon('notiz')}Ins Tagebuch (heute)</button>
        ${!s.files.length || s.url || s.text ? `<button class="ghost" data-action="shared-place">${icon('pin')}Auf die Wunschliste</button>` : ''}
        <h2 class="date-head">Zu den Reiseideen</h2>
        <button class="ghost" data-action="shared-idea" data-id="">${icon('plus')}Neue Reiseidee „${esc(nameOf(s))}“</button>
        ${ideas.length ? `<p class="sub">oder als Notiz zu einer Idee:</p><ul class="ledger">${ideas.slice(0, 12).map(i => `<li><button data-action="shared-idea" data-id="${i.id}">
          <span class="txt"><b>${esc(i.title)}</b><small>${esc(i.where || '')}${(i.notes || []).length ? ` · ${i.notes.length} Notizen` : ''}</small></span></button></li>`).join('')}</ul>` : ''}
      </div>
      <button class="link" data-action="shared-drop">Verwerfen</button>`;
  };
  const sharedNote = s => [s.title, s.text, s.url].filter(Boolean).join('\n');
  const done = async (msg, route) => { await clearShared(); shared = null; toast(msg); go(route); };
  ACTIONS['shared-entry'] = async () => {
    const s = shared;
    const pos = coordsOf(s.url) || coordsOf(s.text);
    await clearShared(); shared = null;
    go('tagebuch');
    setTimeout(async () => {
      app.openEntryForm({ type: pos ? 'sight' : 'notiz', title: s.title || '', text: [s.text, s.url].filter(Boolean).join('\n'), date: nowLocal(), ...(pos || {}) });
      for (const f of s.files.filter(x => /^image\//.test(x.type))) {
        try { app.addFormPhoto({ id: newId(), thumb: await shrink(f, 360, 0.7), data: await shrink(f, 1920, 0.78) }); } catch { /* Format nicht lesbar */ }
      }
    }, 300);
  };
  ACTIONS['shared-place'] = () => {
    const s = shared, pos = coordsOf(s.url) || coordsOf(s.text);
    save('places', { id: newId(), createdAt: Date.now(), by: me(), kind: 'poi', name: nameOf(s), place: '', note: [s.text, s.url].filter(Boolean).join('\n'),
      url: s.url || '', lat: pos ? pos.lat : null, lng: pos ? pos.lng : null, country: '', tripId: null, planDate: '', rating: 0, features: [], fav: false, done: false });
    done(pos ? 'Auf der Wunschliste – mit Position' : 'Auf der Wunschliste. Die Position kannst du dort noch setzen.', 'orte');
  };
  ACTIONS['shared-idea'] = el => {
    const s = shared;
    const note = { id: newId(), by: me(), at: Date.now(), text: sharedNote(s) };
    if (el.dataset.id) {
      const i = S.ideas.find(x => x.id === el.dataset.id);
      save('ideas', { ...i, notes: [...(i.notes || []), note] });
      done(`Bei „${i.title}“ notiert`, 'ideen');
    } else {
      save('ideas', { id: newId(), by: me(), createdAt: Date.now(), likes: { [me()]: true }, title: nameOf(s), where: '', season: '', days: '', text: s.text || '', notes: s.url ? [{ ...note, text: s.url }] : [] });
      done('Neue Reiseidee angelegt', 'ideen');
    }
  };
  ACTIONS['shared-drop'] = () => done('Verworfen', 'tagebuch');

  /* ====================================================================== */
  /* Unser Reisefoto: bei jeder Fahrt dasselbe Motiv                         */
  /* ====================================================================== */

  const tradition = () => S.meta.find(m => m.id === 'reisefoto') || { id: 'reisefoto', motiv: 'Alle zusammen vor dem Camper' };
  const tripPhoto = t => S.games.find(g => g.id === `reisefoto_${t.id}`);
  VIEWS.reisefoto = () => {
    const tr = tradition();
    const list = app.sortTrips(S.trips).slice().reverse().map(t => ({ t, p: tripPhoto(t) })).filter(x => x.p);
    const t = currentTrip();
    return `${pageHead('reisefoto', 'Unser Reisefoto', 'Bei jeder Fahrt dasselbe Motiv')}
      <section class="panel"><p class="rf-motiv">📸 ${esc(tr.motiv)}</p>
        <div class="btnrow">${t ? `<label class="primary btn file">${icon('camera')}${tripPhoto(t) ? 'Foto ersetzen' : 'Foto für diese Reise'}<input type="file" accept="image/*" capture="environment" data-action="rf-shot" data-trip="${t.id}"></label>` : ''}
          <button class="ghost" data-action="rf-motiv">Motiv ändern</button></div></section>
      ${list.length ? `<div class="rf-grid">${list.map(({ t: tt, p }) => `<figure><img src="${p.thumb}" data-rf="${p.photoId}" alt=""><figcaption><b>${esc(tt.name)}</b><small>${fmtShort(tt.start || new Date(p.at).toISOString().slice(0, 10))}</small></figcaption></figure>`).join('')}</div>`
        : '<p class="hint">Noch keine Reisefotos. Macht bei jeder Fahrt ein Foto mit demselben Motiv, so seht ihr, wie die Kinder wachsen.</p>'}`;
  };
  // Große Fassung nachladen
  app.afterDraw.push(view => view.querySelectorAll('img[data-rf]').forEach(img => app.store().get('photos', img.dataset.rf).then(p => { if (p && p.data) img.src = p.data; }).catch(() => {})));
  CHANGES['rf-shot'] = async el => {
    const f = el.files[0]; el.value = '';
    if (!f) return;
    try {
      const id = newId();
      save('photos', { id, tripId: el.dataset.trip, data: await shrink(f, 1920, 0.8) });
      const old = S.games.find(g => g.id === `reisefoto_${el.dataset.trip}`);
      if (old && old.photoId) remove('photos', old.photoId);
      save('games', { id: `reisefoto_${el.dataset.trip}`, kind: 'reisefoto', tripId: el.dataset.trip, photoId: id, thumb: await shrink(f, 480, 0.75), at: Date.now() });
      toast('Reisefoto gespeichert');
    } catch { toast('Das Foto ließ sich nicht lesen.'); }
  };
  ACTIONS['rf-motiv'] = () => openSheet(`<form data-form="rf-motiv">${sheetHead('Motiv für das Reisefoto')}
    <label class="field"><span>Was soll auf jedem Reisefoto zu sehen sein?</span><input name="motiv" maxlength="80" value="${esc(tradition().motiv)}"></label>
    <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  FORMS['rf-motiv'] = form => { save('meta', { ...tradition(), motiv: form.motiv.value.trim() || 'Alle zusammen vor dem Camper' }); closeSheet(); };

  /* ---------- In der Heute-Karte und auf der Kinder-Startseite ---------- */

  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard ? todayCard(t, st) : '';
    if (!html || !running(t)) return html;
    const list = pins().slice(0, 2);
    const rf = !tripPhoto(t);
    const row = `<div class="today-pins">${pinList(list, true)}
      <div class="today-mit"><button class="link" data-action="pin-new">📌 Pinnwand</button>
        <button class="link" data-action="day-share">${icon('share')}Tag teilen</button>
        ${rf ? `<a class="link" href="#/reisefoto">📸 Reisefoto fehlt noch</a>` : ''}</div></div>`;
    return html.replace('<div class="today-links">', `${row}<div class="today-links">`);
  };
  const kids = VIEWS.kinder;
  if (kids) VIEWS.kinder = () => {
    const html = kids();
    const list = pins().slice(0, 3);
    const box = `<section class="kids-pins">${pinList(list, true)}<button class="kids-tile wide" data-action="pin-new">📌<b>Etwas an die Pinnwand</b></button></section>`;
    return html.replace('</section>', `</section>${box}`);
  };
}
