// Heute-Karte im Tagebuch kompakt: Die Wetterzeile oben bleibt, alles zum Antippen (Highlight, Frage des Tages,
// Pinnwand, Tag teilen, Was ist in der Nähe?) steht als Symbole in einer Zeile. Die Sternen-Chance und die
// Reisefoto-Erinnerung entfallen hier. Läuft als letzter Schritt, nachdem alle Module ihren Teil beigetragen haben.

export default function installHeute(app) {
  const { icon } = app;
  const base = app.todayCard;
  if (!base) return;
  app.todayCard = (t, st) => {
    const html = base(t, st);
    if (!html || html.indexOf('class="today"') < 0) return html;
    const box = document.createElement('template');
    box.innerHTML = html;
    const card = box.content.querySelector('section.today');
    if (!card) return html;
    const drop = sel => card.querySelectorAll(sel).forEach(el => el.remove());
    // Frage offen (abends, noch nicht beantwortet)? Dann bekommt das Fragezeichen einen Punkt
    const qOpen = !!card.querySelector('.today-q');
    const hlDone = /ändern/.test((card.querySelector('.today-more [data-action=hl-form]') || {}).textContent || '');
    drop('.today-stars, .today-q, .today-more [data-action=hl-form], .today-mit, .today-links [data-action=near-go]');
    // Leer gewordene Zeilen entfernen
    card.querySelectorAll('.today-sky, .today-fam, .today-more, .today-links').forEach(el => { if (!el.children.length && !el.textContent.trim()) el.remove(); });
    const btn = (action, label, ic, extra = '') => `<button type="button" class="today-ic${extra}" data-action="${action}" title="${label}" aria-label="${label}">${ic}</button>`;
    const row = `<div class="today-icons">
      ${btn('hl-form', hlDone ? 'Highlight des Tages ändern' : 'Highlight des Tages', icon('star'), hlDone ? ' done' : '')}
      ${btn('q-form', 'Frage des Tages', '<span aria-hidden="true">?</span>', qOpen ? ' dot' : '')}
      ${btn('pin-new', 'Pinnwand: neuer Zettel', '<span aria-hidden="true">📌</span>')}
      ${btn('day-share', 'Tag teilen', icon('share'))}
      ${btn('near-go', 'Was ist in der Nähe?', icon('pin'))}
    </div>`;
    // Gleich unter die obere Leiste (Wetter, Sonne)
    const grid = card.querySelector('.today-grid');
    const holder = document.createElement('div');
    holder.innerHTML = row;
    if (grid) grid.after(holder.firstElementChild); else card.appendChild(holder.firstElementChild);
    return box.innerHTML;
  };

  /* ---------- Am Eintrag im Tagebuch: „nicht im Blog“ und Sprachnotizen ---------- */

  const { S, ACTIONS, esc, save, toast } = app;
  const secs = n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
  const extra = app.stopExtra;
  app.stopExtra = e => {
    const html = extra ? extra(e) : '<div class="react-row"></div>';
    const badges = [];
    // Nur sinnvoll, wenn es für die Reise einen Reiseblog gibt
    if (e.blogHide && app.blogOn && app.blogOn(e.tripId)) {
      badges.push(`<button class="stop-badge blog-off" data-action="blog-unhide" data-id="${e.id}" title="Im Reiseblog ausgeblendet – antippen zum Einblenden">🙈 nicht im Blog</button>`);
    }
    // Herzen von Lesern des Reiseblogs (ohne Konto) – anders als eure eigenen Herzen links
    const bl = blogLikes()[e.id];
    if (bl && bl.n) {
      const who = bl.names.length ? `${bl.names.join(', ')}${bl.n > bl.names.length ? ` und ${bl.n - bl.names.length} ${bl.n - bl.names.length === 1 ? 'weitere Person' : 'weitere'}` : ''}` : `${bl.n} ${bl.n === 1 ? 'Person' : 'Personen'} ohne Namen`;
      badges.push(`<button class="stop-badge blog-likes" data-action="blog-likes-who" data-who="${esc(who)}" title="${esc(who)}">❤️ ${bl.n} im Reiseblog</button>`);
    }
    // Herzen anderer Crews (Crews on the Road)
    const cl = crewLikes()[e.id];
    if (cl && cl.n) {
      const who = cl.names.join(', ');
      badges.push(`<button class="stop-badge crew-likes" data-action="blog-likes-who" data-who="${esc(who)}" data-from="von anderen Crews" title="${esc(who)}">❤️ ${cl.names.length === 1 ? esc(cl.names[0]) : `${cl.n} von Crews`}</button>`);
    }
    const snd = e.sounds || [];
    if (snd.length) {
      const total = snd.reduce((t, x) => t + (x.sec || 0), 0);
      badges.push(`<button class="stop-badge snd" data-action="snd-play" data-id="${e.id}" aria-label="Sprachnotiz abspielen">🎙️ ${snd.length > 1 ? `${snd.length} · ` : ''}${secs(total)}</button>`);
    }
    // Foto direkt in diesen Eintrag: Kamera (landet auch in der Galerie des Handys) oder aus der Galerie
    badges.push(`<label class="stop-badge add-photo" title="Foto aufnehmen" aria-label="Foto für diesen Eintrag aufnehmen">📷+<input type="file" accept="image/*" capture="environment" hidden data-action="stop-photo" data-camera="1" data-id="${e.id}"></label>`);
    badges.push(`<label class="stop-badge add-photo" title="Fotos aus der Galerie" aria-label="Fotos aus der Galerie zu diesem Eintrag">🖼️+<input type="file" accept="image/*" multiple hidden data-action="stop-photo" data-id="${e.id}"></label>`);
    const i = html.lastIndexOf('</div>');
    return i < 0 ? html + badges.join('') : `${html.slice(0, i)}${badges.join('')}${html.slice(i)}`;
  };
  // Herzen aus dem Reiseblog: beim Start und alle 10 Minuten vom Server holen (nur wenn es einen Reiseblog gibt)
  const blogLikes = () => app.LS.get('blogLikes', {}) || {};
  const crewLikes = () => app.LS.get('crewLikes', {}) || {};
  let likesAt = 0;
  async function loadLikes() {
    if (!app.session || !app.session() || !navigator.onLine || document.hidden || Date.now() - likesAt < 10 * 60000) return;
    likesAt = Date.now();
    try {
      const r = await app.api('blog-likes', undefined, `&crew=${encodeURIComponent(app.crewId())}`);
      const now = JSON.stringify([r.likes || {}, r.crews || {}]);
      if (now !== JSON.stringify([blogLikes(), crewLikes()])) { app.LS.set('blogLikes', r.likes || {}); app.LS.set('crewLikes', r.crews || {}); if (app.ui.route === 'tagebuch') app.render(); }
    } catch { /* alter Server oder offline */ }
  }
  setTimeout(loadLikes, 5000);
  setInterval(loadLikes, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadLikes(); });
  ACTIONS['blog-likes-who'] = el => toast(`❤️ ${el.dataset.from || 'im Reiseblog'}: ${el.dataset.who}`);
  app.CHANGES['stop-photo'] = el => {
    const files = [...el.files]; el.value = '';
    // Mit der Kamera aufgenommen: wie beim Foto-Knopf auch in der Galerie ablegen (Einstellung „galleryCopy“)
    if (el.dataset.camera && files[0] && app.saveToGallery) app.saveToGallery(files[0]);
    if (files.length && app.attachTo) app.attachTo(el.dataset.id, files);
  };
  ACTIONS['blog-unhide'] = el => {
    const e = S.entries.find(x => x.id === el.dataset.id);
    if (!e || !confirm(`„${e.title || 'Eintrag'}“ im Reiseblog wieder zeigen?`)) return;
    save('entries', { ...e, blogHide: false });
    toast('Steht wieder im Reiseblog');
  };
  // Sprachnotizen direkt abspielen (mehrere nacheinander); zweiter Tipp hält an
  let player = null, playing = null;
  const stop = () => {
    if (player) { player.pause(); player = null; }
    if (playing) { const b = document.querySelector(`[data-action=snd-play][data-id="${playing}"]`); if (b) b.classList.remove('on'); playing = null; }
  };
  ACTIONS['snd-play'] = async el => {
    const id = el.dataset.id;
    if (playing === id) return stop();
    stop();
    const e = S.entries.find(x => x.id === id);
    if (!e) return;
    playing = id;
    el.classList.add('on');
    for (const s of e.sounds || []) {
      if (playing !== id) return;
      let src = '';
      try { const d = await app.store().get('photos', s.id); src = d && d.data; } catch { /* offline */ }
      if (!src) { toast('Die Sprachnotiz ist gerade nicht erreichbar (offline?).'); break; }
      await new Promise(res => {
        player = new Audio(src);
        player.onended = res; player.onerror = res;
        player.play().catch(res);
      });
    }
    if (playing === id) stop();
  };
}
