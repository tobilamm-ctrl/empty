// Mitfahrer in der Kopfzeile: Wer oben durch die Landschaft fährt, fliegt oder läuft. Jede Person sucht sich
// eine oder mehrere Figuren aus (Kinder auf ihrer Startseite, alle in den Einstellungen). Die Auswahl wird
// wie ein Spielstand gespeichert und gilt so auf allen Geräten der Person.

import { ART } from './mitfahrer-bilder.js';

// [id, Name, Gruppe, viewBox-Breite, viewBox-Höhe, Tempo (1 = wie die V-Klasse), Luft?]
export const RIDERS = [
  ['vklasse', 'Unsere V-Klasse', 'fahr', 190, 78, 1, false],
  ['bobbycar', 'Bobbycar', 'fahr', 190, 78, 0.8, false],
  ['fahrrad', 'Fahrrad', 'fahr', 140, 78, 0.7, false],
  ['traktor', 'Traktor', 'fahr', 142, 78, 0.5, false],
  ['feuerwehr', 'Feuerwehr', 'fahr', 182, 78, 1.3, false],
  ['dampflok', 'Dampflok', 'fahr', 196, 78, 0.8, false],
  ['boot', 'Segelboot', 'fahr', 130, 78, 0.5, false],
  ['ballon', 'Heißluftballon', 'luft', 64, 84, 0.3, true],
  ['ufo', 'Ufo', 'luft', 96, 60, 1.6, true],
  ['flieger', 'Papierflieger', 'luft', 80, 44, 1.1, true],
  ['vogel', 'Vogel', 'luft', 60, 44, 1.2, true],
  ['falter', 'Schmetterling', 'luft', 56, 44, 0.5, true],
  ['schaf', 'LAMMping-Schaf', 'tier', 112, 78, 0.6, false],
  ['hund', 'Hund', 'tier', 136, 78, 1.1, false],
  ['hase', 'Hase', 'tier', 118, 78, 0.9, false],
  ['schnecke', 'Schnecke', 'tier', 116, 78, 0.15, false],
  ['dino', 'Dino', 'tier', 130, 78, 0.6, false],
  ['igel', 'Igel', 'tier', 104, 78, 0.4, false],
].map(([id, name, group, w, h, spd, air]) => ({ id, name, group, w, h, spd, air, art: ART[id] || null }));

const GROUPS = [['fahr', 'Fahrzeuge'], ['luft', 'In der Luft'], ['tier', 'Tiere']];
const MAX = 6;

export default function installMitfahrer(app) {
  const { S, ACTIONS, esc, me, save, toast, openSheet, chromeHooks, settingsPanels, VIEWS } = app;
  const sheetHead = app.sheetHead;
  const scenery = document.querySelector('.scenery');
  if (!scenery) return;
  // Die beiden bisherigen Fahrzeuge stehen schon in der Seite und werden übernommen
  const domArt = sel => { const el = scenery.querySelector(sel); return el ? el.innerHTML : ''; };
  const byId = id => RIDERS.find(r => r.id === id);
  byId('vklasse').art = domArt('.vklasse:not(.bobbycar)');

  const kid = () => document.body.classList.contains('kid-mode');
  const doc = () => S.games.find(g => g.id === `riders_${me()}`);
  const chosen = () => { const d = doc(); return (d ? d.list : [kid() ? 'bobbycar' : 'vklasse']).filter(byId); };

  // Höhe in der Kopfzeile: Fahrzeuge und Tiere 23 px wie die V-Klasse, Fliegendes etwas kleiner, der Ballon größer
  const rh = r => (r.id === 'ballon' ? 32 : r.id === 'ufo' ? 20 : r.air ? 20 : 23);
  const svg = (r, cls = '', style = '') => `<svg class="rider${r.air ? ' air' : ''} r-${r.id}${cls}" viewBox="0 0 ${r.w} ${r.h}"
    style="--rh: ${rh(r)}px; --rw: ${Math.round(r.w * rh(r) / r.h)}px; --spd: ${r.spd};${style}" aria-hidden="true">${r.art}</svg>`;
  app.riderSvg = () => { const r = byId(chosen()[0] || 'vklasse'); return svg(r, ' still'); };

  // Kopfzeile: nur neu aufbauen, wenn sich die Auswahl geändert hat (sonst springen die Figuren zurück an den Start)
  let key = null;
  let box = null;
  function paint() {
    const list = chosen();
    const k = list.join(',');
    if (k === key) return;
    key = k;
    if (!box) { box = document.createElement('div'); box.className = 'riders'; scenery.appendChild(box); scenery.classList.add('riders-on'); }
    // Gleichmäßig verteilt starten: jede Figur hat ihren eigenen Versatz im Umlauf
    box.innerHTML = list.map((id, i) => svg(byId(id), '', ` --off: ${(i / Math.max(1, list.length)).toFixed(2)};`)).join('');
  }
  chromeHooks.push(paint);

  // Kinder dürfen ihre Mitfahrer antippen: dann hüpfen sie
  scenery.addEventListener('click', ev => {
    const r = ev.target.closest('.rider');
    if (!r || !kid()) return;
    r.classList.remove('jump'); void r.getBoundingClientRect(); r.classList.add('jump');
    if (navigator.vibrate) navigator.vibrate(15);
  });

  // Auswahl
  const pickView = () => {
    const list = chosen();
    return `<div class="riders-pick">${sheetHead('Wer fährt oben mit?')}
      <p class="sub">Tippe an, wer oben durch die Landschaft fahren, fliegen oder laufen soll. Bis zu ${MAX} gleichzeitig.</p>
      ${GROUPS.map(([g, label]) => `<h3 class="date-head">${label}</h3><div class="rider-grid">${RIDERS.filter(r => r.group === g).map(r =>
        `<button type="button" class="rider-opt${list.includes(r.id) ? ' on' : ''}" data-action="rider-toggle" data-id="${r.id}" aria-pressed="${list.includes(r.id)}">
          ${svg(r, ' still')}<span>${esc(r.name)}</span></button>`).join('')}</div>`).join('')}
      <div class="sheet-foot"><button class="primary" data-action="close">Fertig</button></div></div>`;
  };
  ACTIONS['riders-pick'] = () => openSheet(pickView());
  ACTIONS['rider-toggle'] = el => {
    const id = el.dataset.id;
    let list = chosen();
    if (list.includes(id)) list = list.filter(x => x !== id);
    else if (list.length >= MAX) return toast(`Höchstens ${MAX} gleichzeitig – tippe erst einen anderen ab.`);
    else list = [...list, id];
    save('games', { ...(doc() || { id: `riders_${me()}`, kind: 'riders', by: me() }), at: Date.now(), list });
    el.classList.toggle('on', list.includes(id));
    el.setAttribute('aria-pressed', list.includes(id));
    paint();
  };

  const preview = () => { const list = chosen(); return list.length ? list.map(id => svg(byId(id), ' still')).join('') : '<span class="sub">Niemand – die Landschaft ist leer.</span>'; };
  settingsPanels.push(() => `<section class="panel">
      <h2>Kopfzeile</h2>
      <p class="sub">Wer oben durch die Landschaft fährt. Du kannst mehrere aussuchen.</p>
      <button class="rider-now" data-action="riders-pick">${preview()}<b>Aussuchen</b></button>
    </section>`);

  // Kinder-Startseite: eigene Kachel zum Aussuchen
  const kids = VIEWS.kinder;
  if (kids) VIEWS.kinder = () => kids().replace('<p class="sub kids-foot">', `<h2 class="date-head">Oben in der Leiste</h2>
    <button class="rider-now kids" data-action="riders-pick">${preview()}<b>Wer fährt mit? Hier aussuchen</b></button>
    <p class="sub kids-foot">`);
}
