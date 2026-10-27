// Bilder der Mitfahrer in der Kopfzeile (mitfahrer.js). Die Figuren selbst sind in Canva gezeichnete Bilder
// (icons/mitfahrer/*.webp, freigestellt). Was sich bewegen soll, liegt als eigene Zeichnung dahinter oder darüber:
// drehende Räder hinter den Radkästen, Rauch, Blaulicht, Wellen, Lichter. Die Figur als Ganzes hüpft, wippt,
// schaukelt oder flattert über Klassen (siehe css/app.css).

const O = (w = 3) => `stroke="currentColor" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const L = (d, c, w = 2, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2, i)).join('');
const f1 = v => +v.toFixed(1);
const DARK = '#3A2617';

// Autoreifen mit Felge und Radbolzen
function carWheel(cx, cy, r, rim = '#E9E4DA') {
  return `<g class="wheel" style="transform-origin: ${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${DARK}" ${O(2.5)}/>
    <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.6)}" fill="${rim}" stroke="#9A9184" stroke-width="1.2"/>
    ${ring(5, a => `<circle cx="${f1(cx + Math.cos(a) * r * 0.36)}" cy="${f1(cy + Math.sin(a) * r * 0.36)}" r="${f1(r * 0.08)}" fill="#6E665B"/>`)}
    <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.17)}" fill="#6E665B"/>
    ${L(`M${f1(cx - r * 0.75)} ${f1(cy - r * 0.35)} A ${f1(r * 0.82)} ${f1(r * 0.82)} 0 0 1 ${f1(cx - r * 0.2)} ${f1(cy - r * 0.8)}`, '#7A6A5C', 1.4)}</g>`;
}
// Fahrradreifen mit Speichen
function bikeWheel(cx, cy, r) {
  return `<g class="wheel" style="transform-origin: ${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${DARK}" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 2.6}" fill="none" stroke="#9A9184" stroke-width="1.2"/>
    ${ring(12, a => `<path d="M${cx} ${cy} L${f1(cx + Math.cos(a) * (r - 2.6))} ${f1(cy + Math.sin(a) * (r - 2.6))}" stroke="#9A9184" stroke-width=".8"/>`)}
    <circle cx="${cx}" cy="${cy}" r="2.2" fill="#6E665B"/></g>`;
}
// Traktorreifen mit Stollen und gelber Felge
function tractorWheel(cx, cy, r) {
  return `<g class="wheel" style="transform-origin: ${cx}px ${cy}px">
    ${ring(r > 16 ? 16 : 10, a => `<path d="M${f1(cx + Math.cos(a) * (r - 2))} ${f1(cy + Math.sin(a) * (r - 2))} L${f1(cx + Math.cos(a + 0.12) * (r + 1.8))} ${f1(cy + Math.sin(a + 0.12) * (r + 1.8))}" stroke="${DARK}" stroke-width="${r > 16 ? 5 : 4}" stroke-linecap="round"/>`)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${DARK}" ${O(2.5)}/>
    <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.55)}" fill="#F2C94C" ${O(1.8)}/>
    ${ring(6, a => `<circle cx="${f1(cx + Math.cos(a) * r * 0.36)}" cy="${f1(cy + Math.sin(a) * r * 0.36)}" r="${f1(Math.max(1, r * 0.06))}" fill="#9A7A2A"/>`)}
    <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.18)}" fill="#E0A21B" ${O(1.2)}/></g>`;
}
// Lokrad mit Speichen und Gegengewicht
function locoWheel(cx, cy, r) {
  return `<g class="wheel" style="transform-origin: ${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#D63A2F" ${O(2.5)}/>
    <circle cx="${cx}" cy="${cy}" r="${r - 2.4}" fill="none" stroke="#8E2018" stroke-width="1"/>
    ${ring(10, a => `<path d="M${cx} ${cy} L${f1(cx + Math.cos(a) * (r - 2.4))} ${f1(cy + Math.sin(a) * (r - 2.4))}" stroke="#8E2018" stroke-width="1.2"/>`)}
    <path d="M${f1(cx - r * 0.55)} ${f1(cy + r * 0.3)} A ${f1(r * 0.65)} ${f1(r * 0.65)} 0 0 0 ${f1(cx + r * 0.55)} ${f1(cy + r * 0.3)} Q ${cx} ${f1(cy + r * 0.1)} ${f1(cx - r * 0.55)} ${f1(cy + r * 0.3)} Z" fill="${DARK}"/>
    <circle cx="${cx}" cy="${cy}" r="2.4" fill="#E0A21B" ${O(1)}/></g>`;
}
const puffs = (x, y, n = 3) => Array.from({ length: n }, (_, i) => `<circle class="puff" cx="${x}" cy="${y}" r="5" fill="#FFFFFF" ${O(1.5)} style="animation-delay: ${(i * 1.5 / n).toFixed(2)}s"/>`).join('');

const img = (n, w, h, x = 0, y = 0) => `<image href="icons/mitfahrer/${n}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const glow = (x, y, r, d = 0, c = '#BFE0FF') => `<circle class="blink" cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".85" style="animation-delay: ${d}s"/>`;
const waves = (w, y) => `${L(`M-30 ${y} ${'q7.5 -4 15 0 t15 0 '.repeat(Math.ceil((w + 60) / 30))}`, '#8DB8F2', 2.5, ' class="waves slow"')}
  ${L(`M-30 ${y + 5} ${'q7.5 -5 15 0 t15 0 '.repeat(Math.ceil((w + 60) / 30))}`, '#2F6FD6', 3, ' class="waves"')}`;

export const ART = {
  // Räder zuerst: Sie liegen hinter dem Bild und schauen aus den Radkästen heraus
  bobbycar: `${carWheel(27, 68, 12, '#FFFFFF')}${carWheel(115, 68, 12, '#FFFFFF')}${img('bobbycar', 168, 74)}`,
  fahrrad: `${bikeWheel(30, 92, 17)}${bikeWheel(106, 92, 17)}
    <g class="wheel" style="transform-origin: 62px 92px"><circle cx="62" cy="92" r="5" fill="none" stroke="#9A9184" stroke-width="2" stroke-dasharray="1.6 1.2"/></g>
    <g class="bob small">${img('fahrrad', 116, 103)}</g>`,
  traktor: `${tractorWheel(38, 92, 22)}${tractorWheel(126, 96, 18)}${img('traktor', 161, 100)}${puffs(98, 4)}`,
  feuerwehr: `${carWheel(37, 70, 12)}${carWheel(117, 70, 12)}${img('feuerwehr', 180, 76)}${glow(113, 6, 6)}${glow(141, 6, 6, 0.25)}`,
  dampflok: `${locoWheel(26, 72, 10)}${locoWheel(78, 72, 10)}${locoWheel(129, 72, 10)}${img('dampflok', 178, 80)}${puffs(148, 10)}`,
  boot: `<g class="rock">${img('boot', 152, 169)}</g>${waves(152, 168)}`,
  ballon: `<g class="bob">${img('ballon', 115, 175)}</g>`,
  ufo: `<g class="bob">${img('ufo', 155, 81)}${[16, 36, 56, 76, 96, 116, 136].map((x, i) => glow(x, 54, 3.4, (i % 4) * 0.2, '#FFFFFF')).join('')}</g>`,
  flieger: `<g class="glide">${img('flieger', 145, 59)}</g>`,
  // Vogel: zwei Bilder (Flügel oben/unten) im Wechsel ergeben den Flügelschlag
  vogel: `<g class="bob"><g class="frame1">${img('vogel', 137, 125)}</g><g class="frame2">${img('vogel2', 137, 125)}</g></g>`,
  falter: `<g class="flutter"><g class="flapY">${img('falter', 132, 181)}</g></g>`,
  schaf: `<g class="waddle">${img('schaf', 139, 109)}</g>`,
  hund: `<g class="gallop">${img('hund', 146, 94)}</g>`,
  hase: `<g class="hop big">${img('hase', 145, 117)}</g>`,
  schnecke: `<g class="creep">${img('schnecke', 139, 91)}</g>`,
  dino: `<g class="waddle slow">${img('dino', 164, 124)}</g>`,
  igel: `<g class="waddle">${img('igel', 119, 116)}</g>`,
};
