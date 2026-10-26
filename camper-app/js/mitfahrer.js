// Mitfahrer in der Kopfzeile: Wer oben durch die Landschaft fährt, fliegt oder läuft. Jede Person sucht sich
// eine oder mehrere Figuren aus (Kinder auf ihrer Startseite, alle in den Einstellungen). Die Auswahl wird
// wie ein Spielstand gespeichert und gilt so auf allen Geräten der Person.

const O = (w = 3) => `stroke="currentColor" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const wheel = (cx, cy, r, fill = '#3A2617') => `<g class="wheel" style="transform-origin: ${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${O(2.5)}/>`
  + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.5).toFixed(1)}" fill="#E9E4DA"/><path d="M${cx} ${cy - r * 0.5} v${r} M${cx - r * 0.5} ${cy} h${r}" stroke="#9A9184" stroke-width="1.6"/></g>`;
const spoked = (cx, cy, r) => `<g class="wheel" style="transform-origin: ${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${O(3.5)}/>`
  + `<path d="M${cx} ${cy - r} V${cy + r} M${cx - r} ${cy} H${cx + r} M${cx - r * 0.7} ${cy - r * 0.7} L${cx + r * 0.7} ${cy + r * 0.7} M${cx - r * 0.7} ${cy + r * 0.7} L${cx + r * 0.7} ${cy - r * 0.7}" stroke="currentColor" stroke-width="1.2"/></g>`;
const puffs = (x, y) => [0, 0.5, 1].map(d => `<circle class="puff" cx="${x}" cy="${y}" r="5" fill="#FFFFFF" ${O(1.5)} style="animation-delay: ${d}s"/>`).join('');
const leg = (x, y, h, fill, cls, w = 8) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${fill}" ${O(2.5)}/>`;

// [id, Name, Gruppe, viewBox-Breite, viewBox-Höhe, Tempo (1 = wie die V-Klasse), Luft?, Bild]
export const RIDERS = [
  ['vklasse', 'Unsere V-Klasse', 'fahr', 190, 78, 1, false, null],
  ['bobbycar', 'Bobbycar', 'fahr', 190, 78, 0.8, false, null],
  ['fahrrad', 'Fahrrad', 'fahr', 130, 78, 0.7, false, `
    ${spoked(28, 62, 14)}${spoked(102, 62, 14)}
    <path d="M28 62 L52 62 L84 40 L46 40 Z M52 62 L44 34 M84 40 L102 62 M84 40 L82 28 M76 26 h12 M38 34 h14" fill="none" stroke="#2F6FD6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="leg-a" d="M46 34 L54 50 L50 62" fill="none" stroke="#3A2617" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="leg-b" d="M46 34 L58 48 L56 60" fill="none" stroke="#6B4226" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M46 34 L62 14" stroke="#D63A2F" stroke-width="9" stroke-linecap="round"/>
    <path d="M60 18 L80 27" stroke="#D63A2F" stroke-width="5" stroke-linecap="round"/>
    <circle cx="66" cy="9" r="7" fill="#F2D2B0" ${O(2.5)}/><path d="M58 8 Q 60 -1 68 0 Q 76 2 74 9 Z" fill="#F2C94C" ${O(2.5)}/>`],
  ['traktor', 'Traktor', 'fahr', 140, 78, 0.5, false, `
    ${puffs(100, 14)}
    <path d="M100 42 V20" stroke="#3A2617" stroke-width="5" stroke-linecap="round"/>
    <path d="M56 42 H122 Q 128 42 128 48 V62 H56 Z" fill="#4F9A3A" ${O(3)}/>
    <path d="M18 10 H64 V58 H18 Z" fill="#4F9A3A" ${O(3)}/>
    <path d="M24 16 H58 V36 H24 Z" fill="#CFE8F2" ${O(2.5)}/>
    <path d="M12 8 H70" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <path d="M116 46 v10" stroke="#F2C94C" stroke-width="4" stroke-linecap="round"/>
    ${wheel(38, 56, 20)}${wheel(114, 64, 12)}`],
  ['feuerwehr', 'Feuerwehr', 'fahr', 170, 78, 1.3, false, `
    <path d="M8 60 V26 Q 8 22 12 22 H120 V60 Z" fill="#D63A2F" ${O(3)}/>
    <path d="M120 60 V16 Q 120 12 124 12 H144 L164 36 V58 Q 164 60 160 60 Z" fill="#D63A2F" ${O(3)}/>
    <path d="M126 18 H142 L156 34 H126 Z" fill="#CFE8F2" ${O(2.5)}/>
    <path d="M14 18 H112 M14 10 H112 M24 10 V18 M40 10 V18 M56 10 V18 M72 10 V18 M88 10 V18 M104 10 V18" fill="none" stroke="#E9E4DA" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 46 H164" stroke="#FFFFFF" stroke-width="3"/>
    <rect class="blink" x="128" y="4" width="14" height="8" rx="3" fill="#2F6FD6" ${O(2)}/>
    ${wheel(38, 62, 12)}${wheel(140, 62, 12)}`],
  ['dampflok', 'Dampflok', 'fahr', 160, 78, 0.8, false, `
    ${puffs(116, 8)}
    <path d="M110 28 L107 12 H125 L122 28 Z" fill="#3A2617" ${O(2.5)}/>
    <rect x="50" y="26" width="84" height="30" rx="10" fill="#3A2617" ${O(3)}/>
    <path d="M60 32 H124" stroke="#F2C94C" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="14" y="14" width="42" height="44" rx="3" fill="#D63A2F" ${O(3)}/>
    <rect x="22" y="22" width="22" height="16" rx="2" fill="#CFE8F2" ${O(2.5)}/>
    <path d="M8 13 H62" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <path d="M134 50 L150 64 H132 Z" fill="#D63A2F" ${O(2.5)}/>
    ${wheel(34, 64, 10, '#D63A2F')}${wheel(72, 64, 10, '#D63A2F')}${wheel(106, 64, 10, '#D63A2F')}`],
  ['boot', 'Segelboot', 'fahr', 120, 78, 0.5, false, `
    <path class="waves" d="M-30 72 q7.5 -5 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0" fill="none" stroke="#2F6FD6" stroke-width="3" stroke-linecap="round"/>
    <g class="rock">
      <path d="M60 50 V6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M63 8 L63 46 L100 46 Z" fill="#FFFFFF" ${O(3)}/>
      <path d="M57 12 L57 46 L28 46 Z" fill="#F2C94C" ${O(3)}/>
      <path d="M14 50 H110 L96 66 H26 Z" fill="#D63A2F" ${O(3)}/>
      <circle cx="40" cy="57" r="3" fill="#FFFFFF"/><circle cx="54" cy="57" r="3" fill="#FFFFFF"/>
    </g>`],
  ['ballon', 'Heißluftballon', 'luft', 60, 78, 0.3, true, `
    <g class="bob">
      <path d="M30 4 C 6 4 2 30 18 46 L24 54 H36 L42 46 C 58 30 54 4 30 4 Z" fill="#D63A2F" ${O(3)}/>
      <path d="M30 4 C 21 12 21 38 26 54 H34 C 39 38 39 12 30 4 Z" fill="#F2C94C" ${O(2.5)}/>
      <path d="M24 54 L26 64 M36 54 L34 64" stroke="currentColor" stroke-width="2"/>
      <rect x="23" y="63" width="14" height="11" rx="2" fill="#B07A47" ${O(2.5)}/>
    </g>`],
  ['ufo', 'Ufo', 'luft', 90, 50, 1.6, true, `
    <g class="bob">
      <ellipse cx="45" cy="20" rx="17" ry="14" fill="#CFE8F2" ${O(2.5)}/>
      <circle cx="45" cy="20" r="7" fill="#7BC86C" ${O(2)}/><circle cx="42.5" cy="19" r="1.6" fill="#3A2617"/><circle cx="47.5" cy="19" r="1.6" fill="#3A2617"/>
      <ellipse cx="45" cy="30" rx="40" ry="10" fill="#9A9184" ${O(3)}/>
      <circle class="blink" cx="20" cy="31" r="4" fill="#F2C94C"/><circle class="blink" cx="45" cy="34" r="4" fill="#F2C94C" style="animation-delay: .25s"/><circle class="blink" cx="70" cy="31" r="4" fill="#F2C94C" style="animation-delay: .5s"/>
    </g>`],
  ['flieger', 'Papierflieger', 'luft', 70, 40, 1.1, true, `
    <g class="glide">
      <path d="M4 22 L66 8 L28 32 Z" fill="#FFFFFF" ${O(2.5)}/>
      <path d="M66 8 L22 24 L28 32" fill="#E9E4DA" ${O(2.5)}/>
    </g>`],
  ['schaf', 'LAMMping-Schaf', 'tier', 108, 78, 0.6, false, `
    ${leg(26, 50, 22, '#3A2617', 'leg-a', 7)}${leg(36, 50, 22, '#3A2617', 'leg-b', 7)}${leg(62, 50, 22, '#3A2617', 'leg-b', 7)}${leg(72, 50, 22, '#3A2617', 'leg-a', 7)}
    <g class="hop">
      <path d="M88.0 38.0 Q95.9 44.2 84.4 46.2 Q87.2 55.5 74.4 52.9 Q71.5 63.2 60.0 56.5 Q52.0 66.0 44.0 56.5 Q32.5 63.2 29.6 52.9 Q16.8 55.5 19.6 46.2 Q8.1 44.2 16.0 38.0 Q8.1 31.8 19.6 29.8 Q16.8 20.5 29.6 23.1 Q32.5 12.8 44.0 19.5 Q52.0 10.0 60.0 19.5 Q71.5 12.8 74.4 23.1 Q87.2 20.5 84.4 29.8 Q95.9 31.8 88.0 38.0 Z" fill="#FFFFFF" ${O(3)}/>
      <ellipse cx="94" cy="30" rx="11" ry="9" fill="#3A2617" ${O(2.5)}/>
      <path d="M86 24 Q 80 18 84 30" fill="#3A2617" ${O(2.5)}/>
      <circle cx="98" cy="28" r="2" fill="#FFFFFF"/>
    </g>`],
  ['hund', 'Hund', 'tier', 132, 78, 1.1, false, `
    <path class="tail" d="M34 36 Q 18 32 16 16" fill="none" stroke="#B07A47" stroke-width="6" stroke-linecap="round"/>
    ${leg(38, 46, 26, '#B07A47', 'leg-a')}${leg(50, 46, 26, '#B07A47', 'leg-b')}${leg(80, 46, 26, '#B07A47', 'leg-b')}${leg(92, 46, 26, '#B07A47', 'leg-a')}
    <rect x="30" y="30" width="72" height="24" rx="12" fill="#B07A47" ${O(3)}/>
    <circle cx="104" cy="26" r="14" fill="#B07A47" ${O(3)}/>
    <ellipse cx="118" cy="31" rx="10" ry="7" fill="#E8C07A" ${O(2.5)}/>
    <circle cx="126" cy="29" r="3.5" fill="#3A2617"/>
    <path d="M96 14 Q 86 18 90 34 Q 98 32 100 18 Z" fill="#6B4226" ${O(2.5)}/>
    <circle cx="108" cy="22" r="2.2" fill="#3A2617"/>`],
  ['hase', 'Hase', 'tier', 108, 78, 0.9, false, `
    <g class="hop big">
      <ellipse cx="74" cy="14" rx="5" ry="14" fill="#E9E4DA" ${O(2.5)} transform="rotate(-18 74 14)"/>
      <ellipse cx="84" cy="14" rx="5" ry="14" fill="#E9E4DA" ${O(2.5)} transform="rotate(8 84 14)"/>
      <circle cx="24" cy="44" r="7" fill="#FFFFFF" ${O(2.5)}/>
      <ellipse cx="50" cy="50" rx="27" ry="18" fill="#E9E4DA" ${O(3)}/>
      <ellipse cx="40" cy="66" rx="15" ry="6" fill="#E9E4DA" ${O(2.5)}/>
      <ellipse cx="74" cy="66" rx="7" ry="4.5" fill="#E9E4DA" ${O(2.5)}/>
      <circle cx="80" cy="36" r="13" fill="#E9E4DA" ${O(3)}/>
      <circle cx="84" cy="33" r="2.2" fill="#3A2617"/><circle cx="92" cy="38" r="2.4" fill="#E58FA0"/>
    </g>`],
  ['schnecke', 'Schnecke', 'tier', 110, 78, 0.15, false, `
    <g class="creep">
      <path d="M8 70 H92 Q 102 70 102 60 V42 Q 102 34 95 34 Q 88 34 88 42 V56 H22 Q 8 56 8 70 Z" fill="#E8C07A" ${O(3)}/>
      <path d="M93 35 L89 18 M98 35 L104 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="89" cy="17" r="3" fill="#3A2617"/><circle cx="104" cy="19" r="3" fill="#3A2617"/>
      <circle cx="50" cy="40" r="22" fill="#B07A47" ${O(3)}/>
      <path d="M50 40 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 1 1 8 8 a12 12 0 1 1 -12 -12 a16 16 0 0 1 16 -4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </g>`],
  ['dino', 'Dino', 'tier', 130, 78, 0.6, false, `
    ${leg(50, 48, 26, '#6BB04A', 'leg-a', 10)}${leg(68, 48, 26, '#6BB04A', 'leg-b', 10)}
    <g class="hop">
      <path d="M4 36 Q 34 32 54 32 L 76 22 Q 84 8 100 8 H118 Q 126 8 126 18 V26 Q 126 30 120 30 H104 L102 36 Q 98 46 88 50 Q 82 58 70 58 H50 Q 28 56 4 36 Z" fill="#6BB04A" ${O(3)}/>
      <path d="M40 32 l4 -8 l4 8 M54 30 l5 -9 l5 7 M68 24 l5 -9 l4 6" fill="#F2C94C" ${O(2)}/>
      <path d="M90 42 l8 4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="108" cy="16" r="3" fill="#3A2617"/>
      <path d="M108 30 l3 4 l3 -4 l3 4 l3 -4" fill="#FFFFFF" ${O(1.5)}/>
    </g>`],
  ['igel', 'Igel', 'tier', 100, 78, 0.4, false, `
    ${leg(26, 62, 10, '#6B4226', 'leg-a', 7)}${leg(58, 62, 10, '#6B4226', 'leg-b', 7)}
    <g class="hop">
      <path d="M8.0 62.0 L12.0 62.0 L1.2 58.4 L12.7 56.3 L3.1 51.2 L14.8 50.9 L6.8 44.6 L18.1 46.0 L12.0 38.7 L22.6 41.8 L18.7 33.8 L28.0 38.4 L26.5 30.2 L34.1 36.1 L35.1 27.9 L40.7 34.9 L44.0 27.1 L47.3 34.9 L52.9 27.9 L53.9 36.1 L61.5 30.2 L60.0 38.4 L69.3 33.8 L65.4 41.8 L76.0 38.7 L69.9 46.0 L81.2 44.6 L73.2 50.9 L84.9 51.2 L75.3 56.3 L86.8 58.4 L76.0 62.0 Z" fill="#8A5A3B" ${O(2.5)}/>
      <path d="M66 46 Q 84 46 96 62 Q 84 70 64 66 Z" fill="#E8C07A" ${O(2.5)}/>
      <circle cx="96" cy="62" r="3.5" fill="#3A2617"/><circle cx="80" cy="54" r="2.2" fill="#3A2617"/>
    </g>`],
  ['vogel', 'Vogel', 'luft', 60, 40, 1.2, true, `
    <g class="bob">
      <path d="M18 24 L6 18 L8 30 Z" fill="#2F6FD6" ${O(2)}/>
      <ellipse cx="30" cy="25" rx="14" ry="9" fill="#2F6FD6" ${O(2.5)}/>
      <circle cx="42" cy="18" r="7" fill="#2F6FD6" ${O(2.5)}/>
      <path d="M48 17 L56 19 L48 22 Z" fill="#F28C38" ${O(1.5)}/>
      <circle cx="44" cy="16.5" r="1.6" fill="#FFFFFF"/>
      <path class="wing" d="M24 22 Q 20 4 36 8 Q 36 18 32 22 Z" fill="#8DB8F2" ${O(2)}/>
    </g>`],
  ['falter', 'Schmetterling', 'luft', 50, 40, 0.5, true, `
    <g class="flutter">
      <path class="wing-u" d="M22 19 Q 0 -6 30 1 Q 36 10 28 19 Z" fill="#F28C38" ${O(2)}/>
      <circle cx="22" cy="9" r="3" fill="#F2C94C"/>
      <path class="wing-d" d="M22 21 Q 4 44 29 38 Q 35 30 28 21 Z" fill="#F2C94C" ${O(2)}/>
      <ellipse cx="26" cy="20" rx="12" ry="3.5" fill="#3A2617"/>
      <path d="M37 19 Q 43 12 47 13 M37 21 Q 44 18 48 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </g>`],
].map(([id, name, group, w, h, spd, air, art]) => ({ id, name, group, w, h, spd, air, art }));

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
  byId('bobbycar').art = domArt('.vklasse.bobbycar');

  const kid = () => document.body.classList.contains('kid-mode');
  const doc = () => S.games.find(g => g.id === `riders_${me()}`);
  const chosen = () => { const d = doc(); return (d ? d.list : [kid() ? 'bobbycar' : 'vklasse']).filter(byId); };

  // Höhe in der Kopfzeile: Fahrzeuge und Tiere 23 px wie die V-Klasse, Fliegendes etwas kleiner, der Ballon größer
  const rh = r => (r.id === 'ballon' ? 30 : r.id === 'falter' ? 22 : r.air ? 18 : 23);
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
