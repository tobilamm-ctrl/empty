// Lieblingsplätze weitergeben: für befreundete Camper-Familien als GPX-Datei oder als geheimer Link
// (fester Schnappschuss, ohne Anmeldung lesbar). Die Postkarte aus einem Foto steckt in teilen.js.

export default function installWeitergeben(app) {
  const { S, ui, VIEWS, ACTIONS, FORMS, esc, icon, toast, openSheet, api, hasPos, fmtShort } = app;
  const sheetHead = app.sheetHead;
  const isAdmin = () => !!(app.session() && app.session().user.isAdmin);
  const flag = cc => (app.flag ? app.flag(cc) : '');

  /* ====================================================================== */
  /* Lieblingsplätze weitergeben                                             */
  /* ====================================================================== */

  // Kandidaten: gemerkte Lieblingsplätze und gut bewertete Stellplätze aus dem Tagebuch
  function candidates() {
    const favs = S.places.filter(p => p.fav && hasPos(p)).map(p => ({
      key: 'p:' + p.id, name: p.name, place: p.place || '', lat: p.lat, lng: p.lng, rating: p.rating || 0, kind: p.kind === 'stellplatz' ? 'Stellplatz' : 'Sehenswert',
      country: p.country || '', note: p.note || '', features: p.features || [], date: '', entryId: p.entryId, pre: true,
    }));
    const linked = new Set(favs.map(f => f.entryId).filter(Boolean));
    const stays = S.entries.filter(e => e.type === 'stellplatz' && hasPos(e) && (e.rating || 0) >= 3 && !linked.has(e.id)).map(e => ({
      key: 'e:' + e.id, name: e.title || e.place || 'Stellplatz', place: e.place || '', lat: e.lat, lng: e.lng, rating: e.rating || 0,
      kind: (e.extra || {}).stay || 'Stellplatz', country: e.country || '', note: e.text || '', features: e.features || [], date: (e.date || '').slice(0, 10), pre: (e.rating || 0) >= 4,
    }));
    return [...favs, ...stays].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  }

  let shareState = null;
  async function loadShare() {
    try { shareState = await api('placeshare', undefined, `&crew=${app.crewId()}`); } catch { shareState = { token: null, offline: true }; }
    if (document.querySelector('.places-share')) ACTIONS['places-share']();
  }
  const link = token => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}blog.html#p${token}`;

  ACTIONS['places-share'] = () => {
    const list = candidates();
    if (!shareState) loadShare();
    const st = shareState || {};
    openSheet(`<form data-form="places-share" class="places-share">${sheetHead('Lieblingsplätze weitergeben')}
      <p class="sub">Für befreundete Camper: Wählt aus, welche Plätze mitgehen. Kosten und Namen der Familie bleiben privat.</p>
      ${list.length ? `<ul class="share-pick">${list.map(p => `<li><label class="check"><input type="checkbox" name="pick" value="${esc(p.key)}"${p.pre ? ' checked' : ''}>
        <span><b>${esc(p.name)}</b> ${p.rating ? `<span class="stars-txt">${'★'.repeat(p.rating)}</span>` : ''}<small>${flag(p.country)} ${esc([p.kind, p.place.split(',')[0], p.date ? fmtShort(p.date) : ''].filter(Boolean).join(' · '))}</small></span></label></li>`).join('')}</ul>`
        : '<p class="hint">Noch keine Lieblingsplätze. Merkt euch Plätze im Tagebuch mit „Als Lieblingsplatz merken“ oder bewertet Stellplätze mit vier oder fünf Sternen.</p>'}
      <label class="check"><input type="checkbox" name="notes" checked><span>Notizen mitgeben (Tipps zum Platz)</span></label>
      <label class="field"><span>Überschrift</span><input name="title" maxlength="80" value="${esc(`Lieblingsplätze von ${app.crewName ? app.crewName() : 'uns'}`)}"></label>
      <label class="field"><span>Ein paar Worte dazu</span><textarea name="note" rows="2" maxlength="400" placeholder="z. B. Unsere Tipps für Norditalien mit Kindern"></textarea></label>
      ${st.token ? `<div class="share-link"><p>Link ist aktiv${st.created ? ` (Stand ${fmtShort(new Date(st.created).toISOString().slice(0, 10))})` : ''}:</p>
        <input readonly value="${esc(link(st.token))}" onclick="this.select()">
        <div class="btnrow"><button type="button" class="ghost small-btn" data-action="places-link-send">${icon('share')}Link teilen</button>
        ${isAdmin() ? '<button type="button" class="ghost small-btn danger" data-action="places-link-off">Link abschalten</button>' : ''}</div></div>` : ''}
      <div class="sheet-foot"><button type="button" class="ghost" data-action="places-gpx">${icon('download')}GPX-Datei</button>
        ${isAdmin() ? `<button class="primary">${st.token ? 'Link aktualisieren' : 'Link erstellen'}</button>` : ''}</div>
      ${!isAdmin() ? '<p class="sub">Einen Link können Verwalter erstellen. Die GPX-Datei geht immer.</p>' : ''}</form>`);
  };
  function picked(form) {
    const keys = new Set([...form.querySelectorAll('[name=pick]:checked')].map(c => c.value));
    const notes = form.notes.checked;
    return candidates().filter(p => keys.has(p.key)).map(({ key, pre, entryId, ...p }) => ({ ...p, note: notes ? p.note : '' }));
  }
  FORMS['places-share'] = async form => {
    const places = picked(form);
    if (!places.length) return toast('Bitte mindestens einen Platz auswählen.');
    try {
      const r = await api('placeshare', { crew: app.crewId(), on: true, title: form.title.value.trim(), note: form.note.value.trim(), places });
      shareState = { token: r.token, created: Date.now() };
      toast(`${r.count} ${r.count === 1 ? 'Platz' : 'Plätze'} im Link`);
      ACTIONS['places-share']();
    } catch (err) { toast(err.message || 'Das braucht Internet.'); }
  };
  ACTIONS['places-link-send'] = async () => {
    const url = link(shareState.token);
    if (navigator.share) { try { await navigator.share({ title: 'Unsere Lieblingsplätze', url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); toast('Link kopiert'); } catch { toast(url); }
  };
  ACTIONS['places-link-off'] = async () => {
    if (!confirm('Link abschalten? Wer ihn hat, sieht die Plätze dann nicht mehr.')) return;
    try { await api('placeshare', { crew: app.crewId(), on: false }); shareState = { token: null }; ACTIONS['places-share'](); } catch (err) { toast(err.message || 'Das braucht Internet.'); }
  };
  const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  ACTIONS['places-gpx'] = async el => {
    const form = el.closest('form');
    const places = picked(form);
    if (!places.length) return toast('Bitte mindestens einen Platz auswählen.');
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LAMMping" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${x(form.title.value.trim())}</name>${form.note.value.trim() ? `<desc>${x(form.note.value.trim())}</desc>` : ''}</metadata>
${places.map(p => `<wpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}"><name>${x(p.name)}</name><desc>${x([p.rating ? '★'.repeat(p.rating) : '', p.kind, p.place, p.features.join(', '), p.note].filter(Boolean).join('\n'))}</desc><type>${x(p.kind)}</type></wpt>`).join('\n')}
</gpx>`;
    const file = new File([gpx], 'Lieblingsplaetze.gpx', { type: 'application/gpx+xml' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Knopf auf der Seite „Orte“ beim Reiter Lieblingsplätze
  const orte = VIEWS.orte;
  VIEWS.orte = () => `${orte()}${ui.placesTab === 'favorit' ? `<div class="btnrow"><button class="ghost" data-action="places-share">${icon('share')}Lieblingsplätze weitergeben</button></div>` : ''}`;
}
