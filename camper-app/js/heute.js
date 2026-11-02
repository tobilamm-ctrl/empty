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
}
