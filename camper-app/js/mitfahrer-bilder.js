// Bilder der Mitfahrer in der Kopfzeile (mitfahrer.js). Umrisse in currentColor wie die V-Klasse, Bewegungen über
// Klassen: wheel (dreht), leg-a/leg-b (Beine), hop, bob, wing, flag, rod, flame, puff, blink … (siehe css/app.css).

const O = (w = 3) => `stroke="currentColor" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const L = (d, c, w = 2, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2, i)).join('');
const f1 = v => +v.toFixed(1);
const SKIN = '#F2D2B0', DARK = '#3A2617', GLASS = '#CFE8F2';

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
const eye = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${DARK}"/><circle cx="${f1(x + r * 0.35)}" cy="${f1(y - r * 0.4)}" r="${f1(r * 0.38)}" fill="#FFFFFF"/>`;
const bigEye = (x, y, r = 3, dx = 0.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" ${O(1.2)}/>${eye(f1(x + dx), y, f1(r * 0.55))}`;

export const ART = {

  bobbycar: `
    <g class="van-body">
      ${L('M132 34 L121 12', 'currentColor', 5)}
      <ellipse cx="120" cy="10" rx="15" ry="5.5" fill="${DARK}" ${O(2.5)} transform="rotate(-12 120 10)"/>
      <ellipse cx="120" cy="10" rx="9" ry="2.5" fill="none" stroke="#6E665B" stroke-width="1.5" transform="rotate(-12 120 10)"/>
      <circle cx="122" cy="15" r="2.5" fill="#F2C94C" ${O(1.2)}/>
      <path d="M12 54 Q 8 40 22 36 L54 34 Q 58 20 76 19 Q 96 18 100 33 L146 34 Q 176 34 182 48 Q 184 58 174 58 L20 58 Q 13 58 12 54 Z" fill="#D63A2F" ${O(3.5)}/>
      <path d="M22 40 Q 60 37 100 38 L146 38 Q 168 38 176 46" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".45"/>
      <path d="M56 34 Q 60 23 76 22 Q 93 22 97 34 Z" fill="#B82E24" ${O(2)}/>
      <path d="M62 31 Q 66 26 76 26" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <path d="M118 42 l3 6 l6 0.8 l-4.5 4 l1.2 6 l-5.7 -3 l-5.7 3 l1.2 -6 l-4.5 -4 l6 -0.8 z" fill="#F2C94C" ${O(1.4)} transform="translate(-10 -4) scale(.9)"/>
      <circle cx="166" cy="42" r="7" fill="#FFFFFF" ${O(2.5)}/>${eye(168, 42, 3)}
      ${L('M158 51 Q 168 57 178 50', 'currentColor', 2.5)}
      <circle cx="176" cy="40" r="1.8" fill="#F28C38" opacity=".7"/>
      <circle cx="30" cy="42" r="4" fill="#F2C94C" ${O(2)}/>
      <rect x="20" y="50" width="150" height="3" rx="1.5" fill="#8E2018" opacity=".5"/>
    </g>
    ${carWheel(44, 62, 12, '#FFFFFF')}${carWheel(150, 62, 12, '#FFFFFF')}`,

  fahrrad: `
    <path class="flag" d="M17 4 L33 8 L17 13 Z" fill="#F28C38" ${O(1.5)}/>
    ${L('M24 50 L17 3', '#9A9184', 1.5)}
    ${L('M13 54 A 19 19 0 0 1 46 50', '#E9E4DA', 3)}${L('M92 50 A 19 19 0 0 1 124 56', '#E9E4DA', 3)}
    ${bikeWheel(30, 60, 15)}${bikeWheel(108, 60, 15)}
    <circle cx="58" cy="60" r="6.5" fill="none" stroke="#9A9184" stroke-width="2.2" stroke-dasharray="1.6 1.2"/>
    ${L('M58 53.5 L30 57.5 M58 66.5 L30 62.5', DARK, 1)}
    ${L('M30 60 L58 60 L50 34 Z M50 34 L90 36 M58 60 L88 46 M90 34 L88 46 L108 60', '#2F6FD6', 4.2)}
    ${L('M52 37 L86 38.5', '#8DB8F2', 1.2)}
    ${L('M50 34 L50 29 M90 34 L88 25 L97 23', DARK, 3)}
    <path d="M42 28 Q 50 25 57 28 Q 51 31 42 28 Z" fill="${DARK}" ${O(1.5)}/>
    <circle cx="99" cy="30" r="3" fill="#F2C94C" ${O(1.4)}/><rect x="20" y="44" width="5" height="3" rx="1" fill="#D63A2F"/>
    <g class="leg-b">${L('M51 29 L62 43', '#1F4FA0', 6)}${L('M62 43 L61 60', SKIN, 4)}<path d="M57 60 h8 l1 3 h-10 z" fill="${DARK}"/></g>
    <g class="wheel" style="transform-origin: 58px 60px">${L('M58 51 L58 69', '#6E665B', 2.2)}<rect x="54" y="49.5" width="8" height="3" rx="1" fill="${DARK}"/><rect x="54" y="67.5" width="8" height="3" rx="1" fill="${DARK}"/></g>
    <g class="leg-a">${L('M51 29 L64 41', '#2F6FD6', 6)}${L('M64 41 L59 57', SKIN, 4)}<path d="M55 57 h8 l1 3 h-10 z" fill="${DARK}"/></g>
    <path d="M45 30 L57 30 L74 15 L66 9 Z" fill="#D63A2F" ${O(2)}/>
    ${L('M51 28 L68 13', '#FFFFFF', 1.6, ' opacity=".7"')}
    ${L('M70 13 L80 20', '#D63A2F', 4.5)}${L('M80 20 L96 23', SKIN, 3.5)}<circle cx="96.5" cy="23" r="2.2" fill="${SKIN}" ${O(1)}/>
    <circle cx="79" cy="10" r="6.5" fill="${SKIN}" ${O(2)}/>
    <path d="M71 9 Q 72 0 80 0.5 Q 88 1.5 87 9 Z" fill="#F2C94C" ${O(1.8)}/>
    ${L('M76 2 L75 7 M80 1.2 L80 6.5 M84 2.4 L85 7', '#E0A21B', 1.2)}${L('M86 8.5 L90 9.5', DARK, 1.6)}
    ${eye(82, 10.5, 1.3)}${L('M81.5 14 Q 83.5 15.5 85 13.5', DARK, 1)}<circle cx="78.5" cy="13" r="1.4" fill="#E58FA0" opacity=".7"/>`,

  traktor: `
    ${puffs(112, 8)}
    <rect x="40" y="0" width="9" height="5" rx="1.5" class="blink" fill="#F28C38" ${O(1.4)}/>
    ${L('M112 36 V14', DARK, 5)}<rect x="108.5" y="10" width="7" height="3" rx="1" fill="#6E665B"/>
    <path d="M62 36 H128 Q 137 36 137 45 V62 H62 Z" fill="#4F9A3A" ${O(3)}/>
    ${L('M66 40 H126', '#8CCB6F', 1.6)}
    ${L('M90 42 V54 M95 42 V54 M100 42 V54 M105 42 V54', '#2F6B24', 1.4)}
    <rect x="128" y="42" width="9" height="15" rx="1.5" fill="#2F6B24" ${O(1.6)}/>${L('M129.5 46 H135.5 M129.5 50 H135.5 M129.5 54 H135.5', '#8CCB6F', 1)}
    <circle cx="133" cy="39" r="2.8" fill="#F2C94C" ${O(1.2)}/>
    <rect x="60" y="59" width="72" height="5" rx="1" fill="#4A4038"/>
    <rect x="16" y="4" width="58" height="7" rx="2" fill="#4F9A3A" ${O(2.4)}/>
    <rect x="27" y="11" width="33" height="29" fill="${GLASS}" ${O(1.6)}/>
    ${L('M31 34 L44 15 M37 36 L50 17', '#FFFFFF', 1.6, ' opacity=".8"')}
    <path d="M38 40 Q 38 31 46 31 Q 54 31 54 40 Z" fill="#2F6FD6" ${O(1.4)}/>
    <circle cx="46" cy="25" r="5.5" fill="${SKIN}" ${O(1.4)}/>${eye(48.5, 24.5, 1.1)}
    <path d="M40.5 23 Q 41 17.5 46.5 17.5 Q 52 17.5 52 22 Z" fill="#D63A2F" ${O(1.2)}/>${L('M51 22 L55.5 22.5', '#D63A2F', 2)}
    ${L('M56 40 L51 32', DARK, 1.8)}<ellipse cx="51" cy="31" rx="4" ry="1.4" fill="${DARK}" transform="rotate(-25 51 31)"/>
    <rect x="21" y="11" width="6" height="45" fill="#4F9A3A" ${O(1.8)}/><rect x="60" y="11" width="5" height="40" fill="#4F9A3A" ${O(1.8)}/>
    <path d="M18 40 H66 V60 H18 Z" fill="#4F9A3A" ${O(2.4)}/>
    ${L('M24 44 H40', '#2F6B24', 1.4)}<rect x="44" y="45" width="6" height="2" rx="1" fill="${DARK}"/>
    ${tractorWheel(40, 54, 21)}${tractorWheel(122, 64, 11)}
    <path d="M108 60 Q 110 50 122 50 Q 134 50 136 60 L131 60 Q 129 55 122 55 Q 115 55 113 60 Z" fill="#4F9A3A" ${O(2)}/>
    <path d="M10 56 Q 12 26 40 26 Q 68 26 70 56 L63 56 Q 61 33 40 33 Q 19 33 17 56 Z" fill="#4F9A3A" ${O(2.2)}/>
    ${L('M14 52 Q 16 30 40 29.5', '#8CCB6F', 1.2)}
    <rect x="4" y="56" width="10" height="4" rx="1" fill="#6E665B"/>
    ${L('M66 56 V66 M71 56 V66 M66 61 H71', '#6E665B', 1.4)}
`,

  feuerwehr: `
    <path d="M6 60 V24 Q 6 20 10 20 H124 V60 Z" fill="#D63A2F" ${O(3)}/>
    ${[12, 50, 88].map(x => `<rect x="${x}" y="26" width="${x === 88 ? 31 : 34}" height="23" rx="1.5" fill="#D9D4CC" ${O(1.6)}/>${L(`M${x + 2} 30 H${x + (x === 88 ? 29 : 32)} M${x + 2} 34 H${x + (x === 88 ? 29 : 32)} M${x + 2} 38 H${x + (x === 88 ? 29 : 32)} M${x + 2} 42 H${x + (x === 88 ? 29 : 32)}`, '#AFA89D', 0.9)}<rect x="${x + 13}" y="45" width="8" height="2.4" rx="1" fill="#6E665B"/>`).join('')}
    <rect x="6" y="52" width="118" height="5" fill="#F2C94C"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${8 + i * 12}" y="52" width="6" height="5" fill="#FFFFFF"/>`).join('')}
    ${L('M10 15 H130 M10 21 H130', '#E9E4DA', 2.2)}${Array.from({ length: 16 }, (_, i) => L(`M${14 + i * 7.5} 15 V21`, '#E9E4DA', 1.4)).join('')}
    <rect x="10" y="17" width="12" height="5" rx="1" fill="#6E665B"/>
    <rect class="blink" x="9" y="13" width="7" height="5" rx="1.5" fill="#2F6FD6" ${O(1.2)} style="animation-delay: .25s"/>
    <path d="M124 60 V14 Q 124 10 128 10 H151 L173 36 V56 Q 173 60 169 60 Z" fill="#D63A2F" ${O(3)}/>
    <path d="M130 16 H149 L165 34 H130 Z" fill="${GLASS}" ${O(2)}/>
    <circle cx="141" cy="27" r="5" fill="${SKIN}" ${O(1.2)}/>${eye(143.5, 27, 1)}
    <path d="M135.5 25.5 Q 136 18.5 141.5 18.5 Q 147 18.5 147 25.5 Z" fill="#F2C94C" ${O(1.2)}/>${L('M134 25.5 H148.5', '#E0A21B', 1.6)}
    ${L('M152 22 L160 31', '#FFFFFF', 1.8, ' opacity=".8"')}
    ${L('M127 38 H168 M150 38 V58', '#8E2018', 1.4)}<rect x="153" y="41" width="7" height="2.2" rx="1" fill="#E9E4DA"/>
    <text x="129" y="47" font-size="8" font-weight="800" font-family="sans-serif" fill="#FFFFFF">112</text>
    ${L('M168 31 L176 27', DARK, 1.6)}<rect x="174" y="22" width="4" height="8" rx="1" fill="${DARK}"/>
    <circle cx="170" cy="45" r="3" fill="#F2C94C" ${O(1.2)}/>
    ${L('M164 50 H172 M164 53 H172', '#8E2018', 1)}
    <rect x="122" y="56" width="56" height="5" rx="2" fill="#9A9184" ${O(1.4)}/>
    <rect class="blink" x="129" y="4" width="8" height="6" rx="2" fill="#2F6FD6" ${O(1.2)}/>
    <rect class="blink" x="141" y="4" width="8" height="6" rx="2" fill="#2F6FD6" ${O(1.2)} style="animation-delay: .25s"/>
    ${[30, 58, 148].map(x => `<path d="M${x - 15} 60 A 15 15 0 0 1 ${x + 15} 60 Z" fill="#7A2018"/>`).join('')}
    ${carWheel(30, 62, 12)}${carWheel(58, 62, 12)}${carWheel(148, 62, 12)}`,

  dampflok: `
    ${puffs(158, 4)}
    <rect x="6" y="30" width="42" height="28" rx="2" fill="${DARK}" ${O(2.5)}/>
    ${[12, 20, 28, 36, 42, 16, 24, 32, 40].map((x, i) => `<circle cx="${x}" cy="${i < 5 ? 28 : 24}" r="${i < 5 ? 4.5 : 4}" fill="#2A1B10" ${O(1.2)}/>`).join('')}
    ${L('M18 22 L20 24 M33 22 L35 23.5', '#8A847A', 1)}
    <rect x="9" y="36" width="36" height="16" rx="1" fill="none" stroke="#E0A21B" stroke-width="1.4"/>
    ${carWheel(17, 63, 7, '#D63A2F')}${carWheel(37, 63, 7, '#D63A2F')}
    ${L('M46 52 H56', '#6E665B', 3)}
    <rect x="54" y="14" width="40" height="44" rx="2" fill="#D63A2F" ${O(3)}/>
    <path d="M50 15 Q 74 5 98 15 V18 H50 Z" fill="${DARK}" ${O(2.2)}/>
    <rect x="62" y="21" width="22" height="16" rx="2" fill="${GLASS}" ${O(2)}/>
    <circle cx="72" cy="31" r="5" fill="${SKIN}" ${O(1.2)}/>${eye(74.5, 30.5, 1)}
    <path d="M66.5 29 Q 67 24 72 24 Q 77 24 77.5 29 Z" fill="#1F4FA0" ${O(1.1)}/>${L('M76 29 L80 29.5', '#1F4FA0', 1.8)}
    <ellipse cx="74" cy="47" rx="8" ry="5" fill="#E0A21B" ${O(1.4)}/><text x="71.3" y="50" font-size="7.5" font-weight="800" font-family="sans-serif" fill="${DARK}">7</text>
    <rect x="94" y="24" width="80" height="30" rx="7" fill="${DARK}" ${O(3)}/>
    ${L('M100 28 H168', '#6E665B', 1.4)}
    ${[106, 128, 150, 168].map(x => `<rect x="${x}" y="24.5" width="3" height="29" fill="#E0A21B"/>`).join('')}
    ${[112, 120, 136, 144, 158].map(x => `<circle cx="${x}" cy="50" r=".9" fill="#8A847A"/>`).join('')}
    <path d="M100 24 Q 100 17 106 17 Q 112 17 112 24 Z" fill="${DARK}" ${O(1.8)}/>
    <path d="M120 24 Q 120 11 129 11 Q 138 11 138 24 Z" fill="#E0A21B" ${O(2)}/>${L('M124 20 Q 125 15 129 14', '#FFF3C4', 1.4)}
    <path d="M152 24 L150 9 H166 L164 24 Z" fill="${DARK}" ${O(2)}/><rect x="147" y="5" width="22" height="5" rx="1.5" fill="#2A1B10" ${O(1.6)}/>
    <rect x="172" y="14" width="10" height="10" rx="2" fill="${DARK}" ${O(1.6)}/><circle cx="179" cy="19" r="3" fill="#F2C94C" class="blink" style="animation-duration: 1.2s"/>
    <rect x="174" y="44" width="10" height="5" rx="2" fill="#9A9184" ${O(1.2)}/>
    <rect x="52" y="54" width="132" height="5" fill="#D63A2F" ${O(2)}/>
    <path d="M174 59 L194 73 H172 Z" fill="#D63A2F" ${O(2.2)}/>${L('M178 61 V72 M183 64 V72 M188 68 V72', '#8E2018', 1.2)}
    ${locoWheel(110, 64, 11)}${locoWheel(136, 64, 11)}${locoWheel(162, 64, 11)}
    <g class="rod"><rect x="106" y="59.5" width="60" height="3.4" rx="1.7" fill="#B8B2A8" ${O(1.2)}/>${[110, 136, 162].map(x => `<circle cx="${x}" cy="61.2" r="2" fill="#6E665B"/>`).join('')}</g>`,

  boot: `
    ${L('M-30 70 q7.5 -4 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0', '#8DB8F2', 2.5, ' class="waves slow"')}
    <g class="rock">
      ${L('M68 4 L16 47 M68 4 L116 47', '#9A9184', 0.9)}
      ${L('M68 48 V3', DARK, 3)}
      <path class="flag" d="M68 2 L82 4.5 L68 8 Z" fill="#D63A2F" ${O(1.2)}/>
      <path d="M70.5 6 Q 93 24 107 42 H70.5 Z" fill="#FFFFFF" ${O(2.5)}/>
      ${L('M70.5 17 L84 17.5 M70.5 27 L93 28 M70.5 36 L101 36.5', '#CFC8BC', 1.1)}
      <text x="77" y="24" font-size="8" font-weight="800" font-family="sans-serif" fill="#2F6FD6">7</text>
      <path d="M65.5 8 L65.5 44 L29 44 Z" fill="#F2C94C" ${O(2.5)}/>
      ${L('M65.5 20 L50 30 M65.5 32 L42 40', '#E0A21B', 1)}
      ${L('M68 44 H110', DARK, 2.4)}
      <rect x="28" y="38" width="30" height="10" rx="2" fill="#FFFFFF" ${O(2)}/>
      <rect x="33" y="41" width="7" height="4" rx="1" fill="${GLASS}" ${O(1)}/><rect x="45" y="41" width="7" height="4" rx="1" fill="${GLASS}" ${O(1)}/>
      ${L('M74 47 V42 M84 47 V42 M94 47 V42 M104 47 V42 M112 47 V42 M72 42 H114', '#9A9184', 1)}
      <path d="M8 47 H120 Q 115 58 102 66 H28 Q 15 59 8 47 Z" fill="#D63A2F" ${O(3)}/>
      ${L('M12 52 H116', '#FFFFFF', 2.2)}
      <path d="M22 61 H107 Q 104 64 102 66 H28 Q 25 64 22 61 Z" fill="#1F4FA0"/>
      ${[38, 54, 70].map(x => `<circle cx="${x}" cy="57" r="2.8" fill="${GLASS}" ${O(1.4)}/>`).join('')}
      <circle cx="96" cy="57" r="4" fill="none" stroke="#FFFFFF" stroke-width="2.4"/><circle cx="96" cy="57" r="4" fill="none" stroke="#D63A2F" stroke-width="2.4" stroke-dasharray="3.1 3.1"/>
    </g>
    ${L('M-30 74 q7.5 -5 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0', '#2F6FD6', 3, ' class="waves"')}
    ${L('M24 69 q4 -3 8 0 M90 69 q4 -3 8 0', '#FFFFFF', 1.6, ' class="waves"')}`,

  ballon: `
    <g class="bob">
      <circle cx="27" cy="68" r="3.6" fill="${SKIN}" ${O(1.2)}/><path d="M23.5 67 Q 24 63 27.5 63.5 Q 31 64 30.5 67 Z" fill="#F2C94C"/>
      <circle cx="37" cy="68" r="3.6" fill="${SKIN}" ${O(1.2)}/><path d="M33.5 67 Q 34 63.5 37 63.5 Q 40.5 64 40.5 67 Z" fill="#6B4226"/>
      <g class="wave-arm" style="transform-origin: 40px 70px">${L('M40 70 L45 63', SKIN, 2)}</g>
      <path d="M32 2 C 6 2 2 30 18 50 L25 60 H39 L46 50 C 62 30 58 2 32 2 Z" fill="#D63A2F" ${O(3)}/>
      <path d="M32 2 C 16 4 11 32 21 51 L26 60 H28.5 C 23 40 23 12 32 2 Z" fill="#FFFFFF"/>
      <path d="M32 2 C 48 4 53 32 43 51 L38 60 H35.5 C 41 40 41 12 32 2 Z" fill="#FFFFFF"/>
      <path d="M32 2 C 24 10 23 40 28.5 60 H35.5 C 41 40 40 10 32 2 Z" fill="#F2C94C" ${O(1.4)}/>
      ${L('M7 24 Q 32 31 57 24', '#2F6FD6', 3.2)}
      ${[12, 20, 28, 36, 44, 52].map(x => `<circle cx="${x}" cy="${x < 32 ? 25.5 + (x - 7) * 0.13 : 25.5 + (57 - x) * 0.13}" r="1" fill="#FFFFFF"/>`).join('')}
      ${L('M14 12 Q 18 6 24 5', '#FFFFFF', 1.8, ' opacity=".7"')}
      <path d="M32 2 C 6 2 2 30 18 50 L25 60 H39 L46 50 C 62 30 58 2 32 2 Z" fill="none" ${O(2.5)}/>
      <rect x="25" y="59" width="14" height="3.5" rx="1" fill="${DARK}"/>
      <path class="flame" d="M32 63 Q 29 60 32 55 Q 35 60 32 63 Z" fill="#F28C38" stroke="#F2C94C" stroke-width="1"/>
      ${L('M26 62 L23.5 71 M38 62 L40.5 71 M30 62 L29 71 M34 62 L35 71', 'currentColor', 1)}
      <rect x="22" y="70" width="20" height="12" rx="1.5" fill="#B07A47" ${O(2)}/>
      ${L('M22 74 H42 M22 78 H42', '#8A5A3B', 1)}${L('M26 70 V82 M30 70 V82 M34 70 V82 M38 70 V82', '#8A5A3B', 0.8, ' stroke-dasharray="2 2"')}
      ${L('M21 70.5 H43', '#6B4226', 2.4)}
      <ellipse cx="20" cy="78" rx="2.4" ry="3" fill="#E8C07A" ${O(1)}/>
    </g>`,

  ufo: `
    <g class="bob">
      <path class="beam" d="M32 42 L64 42 L80 60 L16 60 Z" fill="#F2C94C"/>
      ${L('M48 6 V1.5', '#9A9184', 1.4)}<circle class="blink" cx="48" cy="2.5" r="2.2" fill="#D63A2F"/>
      <path d="M29 30 Q 29 6 48 6 Q 67 6 67 30 Z" fill="${GLASS}" ${O(2.2)}/>
      ${L('M44 17 L40 11 M52 17 L56 11', '#5FA35A', 1.3)}<circle cx="40" cy="10.5" r="1.7" fill="#F2C94C"/><circle cx="56" cy="10.5" r="1.7" fill="#F2C94C"/>
      <g class="wave-arm" style="transform-origin: 55px 27px">${L('M55 27 L62 20', '#7BC86C', 2.4)}<circle cx="62.5" cy="19.5" r="1.7" fill="#7BC86C"/></g>
      <path d="M38 31 Q 38 15 48 15 Q 58 15 58 31 Z" fill="#7BC86C" ${O(1.6)}/>
      <ellipse cx="44.5" cy="22" rx="2.8" ry="3.4" fill="#FFFFFF"/><ellipse cx="51.5" cy="22" rx="2.8" ry="3.4" fill="#FFFFFF"/>
      <circle cx="45.2" cy="22.6" r="1.5" fill="${DARK}"/><circle cx="52.2" cy="22.6" r="1.5" fill="${DARK}"/>
      ${L('M45 27 Q 48 29 51 27', DARK, 1)}
      ${L('M34 18 Q 37 11 44 9', '#FFFFFF', 2, ' opacity=".9"')}
      <ellipse cx="48" cy="34" rx="44" ry="9" fill="#B8B2A8" ${O(2.6)}/>
      <path d="M5 35 Q 48 52 91 35 Q 48 44 5 35 Z" fill="#8A847A" ${O(1.6)}/>
      ${L('M14 31.5 Q 22 28.5 30 27.5', '#FFFFFF', 1.6, ' opacity=".8"')}
      ${[[14, 36, '#F2C94C', 0], [30, 40, '#D63A2F', 0.2], [48, 41.5, '#7BC86C', 0.4], [66, 40, '#F2C94C', 0.6], [82, 36, '#D63A2F', 0.8]].map(([x, y, c, d]) => `<circle class="blink" cx="${x}" cy="${y}" r="2.8" fill="${c}" ${O(1)} style="animation-delay: ${d}s"/>`).join('')}
    </g>`,

  flieger: `
    ${L('M2 30 Q 10 24 18 28', '#9A9184', 1.4, ' class="trail" stroke-dasharray="3 3"')}
    <g class="glide">
      <path d="M78 8 L34 30 L28 38 Z" fill="#D9D4CC" ${O(2)}/>
      <path d="M20 24 L78 8 L40 34 Z" fill="#FFFFFF" ${O(2.2)}/>
      <path d="M78 8 L34 27 L40 34 Z" fill="#EDE8DF" ${O(1.6)}/>
      ${L('M30 24 L72 11', '#CFC8BC', 0.9)}
      <path d="M47 21 l1.6 3.2 l3.5 .4 l-2.6 2.4 l.7 3.5 l-3.2 -1.8 l-3.2 1.8 l.7 -3.5 l-2.6 -2.4 l3.5 -.4 z" fill="#D63A2F" transform="rotate(-15 47 25) scale(.8) translate(12 6)"/>
    </g>`,

  vogel: `
    <g class="bob">
      <path d="M15 24 L2 19 L5 25 L1 31 L17 29 Z" fill="#2F6FD6" ${O(1.6)}/>${L('M5 25 L15 26', '#8DB8F2', 0.9)}
      <ellipse cx="30" cy="27" rx="15" ry="10" fill="#F2C94C" ${O(2)}/>
      <path d="M16 24 Q 26 15 40 18 Q 31 22 18 28 Z" fill="#8DB07A"/>
      ${L('M27 36 L25 40 M32 36 L33 40', '#6E665B', 1.2)}
      <circle cx="44" cy="19" r="8" fill="#FFFFFF" ${O(2)}/>
      <path d="M36.2 18 Q 36 11 44 11 Q 52 11 51.8 18 Q 44 15.5 36.2 18 Z" fill="#2F6FD6" ${O(1.2)}/>
      ${L('M41 20 L51.5 19.4', DARK, 1.1)}${eye(46.5, 19.6, 1.6)}
      ${L('M37 23 Q 41 26.5 46 25.8', '#1E3A66', 1.4)}
      <path d="M51.5 18.5 L57.5 20 L51.5 22 Z" fill="#4A4038" ${O(1)}/>
      <g class="wing"><path d="M22 23 Q 19 5 36 8 Q 38 16 32 23 Z" fill="#2F6FD6" ${O(1.8)}/>${L('M25 20 Q 25 12 32 10 M29 21 Q 30 14 35 12', '#8DB8F2', 1)}${L('M23 16 Q 28 13 35 14', '#FFFFFF', 1.4)}</g>
    </g>`,

  falter: `
    <g class="flutter">
      <g class="wing-u"><path d="M24 20 Q 1 -5 34 1 Q 41 10 30 20 Z" fill="#C0392B" ${O(1.8)}/>
        ${L('M24 20 Q 1 -5 34 1', DARK, 2.6, ' opacity=".8"')}${L('M28 19 L18 7 M29 18 L25 4 M30 18 L33 6', '#8E2018', 0.8)}
        <circle cx="27" cy="8" r="4.6" fill="#F2C94C" ${O(0.8)}/><circle cx="27" cy="8" r="3.1" fill="#2F6FD6"/><circle cx="27" cy="8" r="1.4" fill="${DARK}"/><circle cx="27.6" cy="7.2" r=".6" fill="#FFFFFF"/></g>
      <g class="wing-d"><path d="M24 22 Q 7 46 32 40 Q 39 32 30 22 Z" fill="#8A3B2A" ${O(1.8)}/>
        ${L('M28 23 L20 36 M29 24 L28 38', '#5A2418', 0.8)}<circle cx="25" cy="34" r="2.6" fill="#2F6FD6" ${O(0.8)}/><circle cx="25.5" cy="33.5" r=".8" fill="#FFFFFF"/></g>
      <ellipse cx="29" cy="21" rx="12" ry="3.4" fill="${DARK}"/>
      ${L('M22 19 V23 M26 18.5 V23.5 M30 18.5 V23.5', '#6E665B', 0.8)}
      <circle cx="41.5" cy="20.5" r="3" fill="${DARK}"/><circle cx="42.5" cy="19.6" r=".8" fill="#FFFFFF"/>
      ${L('M43 18.5 Q 48 12 52 11 M43.5 20 Q 49 17 53 17', 'currentColor', 1.1)}<circle cx="52" cy="11" r="1.4" fill="currentColor"/><circle cx="53" cy="17" r="1.4" fill="currentColor"/>
    </g>`,

  schaf: `
    ${[[26, 'leg-a'], [36, 'leg-b'], [62, 'leg-b'], [72, 'leg-a']].map(([x, c]) => `<g class="${c}"><rect x="${x}" y="50" width="7" height="22" rx="3.5" fill="#4A3426" ${O(2.2)}/><rect x="${x}" y="68" width="7" height="5" rx="1.5" fill="#1E140C"/></g>`).join('')}
    <g class="hop">
      <path d="M14 32 q-6 -2 -6 4 q-4 4 2 7 q2 4 6 1 z" fill="#FFFFFF" ${O(2)}/>
      <path d="M88.0 38.0 Q95.9 44.2 84.4 46.2 Q87.2 55.5 74.4 52.9 Q71.5 63.2 60.0 56.5 Q52.0 66.0 44.0 56.5 Q32.5 63.2 29.6 52.9 Q16.8 55.5 19.6 46.2 Q8.1 44.2 16.0 38.0 Q8.1 31.8 19.6 29.8 Q16.8 20.5 29.6 23.1 Q32.5 12.8 44.0 19.5 Q52.0 10.0 60.0 19.5 Q71.5 12.8 74.4 23.1 Q87.2 20.5 84.4 29.8 Q95.9 31.8 88.0 38.0 Z" fill="#FFFFFF" ${O(3)}/>
      ${['M28 32 q3 -4 6 0', 'M40 26 q3 -4 6 0', 'M54 28 q3 -4 6 0', 'M66 33 q3 -4 6 0', 'M33 42 q3 -4 6 0', 'M47 38 q3 -4 6 0', 'M60 44 q3 -4 6 0', 'M24 46 q3 -3 5 0', 'M74 42 q3 -3 5 0', 'M40 50 q3 -3 5 0']
        .map(d => L(d, '#CFC8BC', 1.4)).join('')}
      ${L('M24 30 Q 30 22 40 22', '#FFFFFF', 0)}
      ${L('M84 30 Q 87 40 84 49', '#D63A2F', 4)}<circle cx="84.5" cy="51" r="3.4" fill="#E0A21B" ${O(1.4)}/><circle cx="84.5" cy="52.6" r="1" fill="${DARK}"/>
      <ellipse cx="88" cy="25" rx="7" ry="3.6" fill="#4A3426" ${O(1.8)} transform="rotate(30 88 25)"/><ellipse cx="88" cy="25.5" rx="4" ry="1.6" fill="#E58FA0" transform="rotate(30 88 25)"/>
      <path d="M86 26 Q 88 18 97 18 Q 107 19 106 30 Q 105 39 96 39 Q 88 38 87 32 Z" fill="#4A3426" ${O(2.4)}/>
      <path d="M86 22 q-1 -6 4 -6 q2 -4 6 -1 q4 -2 5 3 q-6 -1 -15 4 z" fill="#FFFFFF" ${O(1.6)}/>
      ${bigEye(98, 26, 2.8, 0.8)}
      <ellipse cx="104" cy="33" rx="2" ry="1.4" fill="#2A1B10"/>${L('M100 36 Q 102.5 37.5 104.5 36', '#E9E4DA', 1)}
      <circle cx="95" cy="32" r="1.8" fill="#E58FA0" opacity=".75"/>
    </g>`,

  hund: `
    <g class="tail"><path d="M36 34 Q 22 30 19 13" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M36 34 Q 22 30 19 13" fill="none" stroke="#C98A4B" stroke-width="5" stroke-linecap="round"/><circle cx="19" cy="13" r="3.4" fill="#FFFFFF" ${O(1.4)}/></g>
    ${[[38, 'leg-a'], [50, 'leg-b'], [82, 'leg-b'], [94, 'leg-a']].map(([x, c]) => `<g class="${c}"><rect x="${x}" y="44" width="9" height="28" rx="4.5" fill="#FFFFFF" ${O(2.4)}/>${L(`M${x + 3} 70 V72.5 M${x + 6} 70 V72.5`, '#9A9184', 0.9)}</g>`).join('')}
    <rect x="30" y="29" width="76" height="26" rx="13" fill="#FFFFFF" ${O(3)}/>
    <ellipse cx="44" cy="44" rx="10" ry="9" fill="#C98A4B"/>
    <path d="M40 29.5 H98 Q 104 30 101 38 Q 72 45 44 41 Q 33 37 40 29.5 Z" fill="${DARK}"/>
    ${L('M48 33 Q 70 36 94 33', '#6E665B', 1, ' opacity=".7"')}
    <rect x="30" y="29" width="76" height="26" rx="13" fill="none" ${O(3)}/>
    <circle cx="109" cy="24" r="14" fill="#C98A4B" ${O(3)}/>
    <path d="M106 10.5 Q 111 17 116 27 L121 25.5 Q 116 14 109 10 Z" fill="#FFFFFF"/>
    <ellipse cx="121" cy="30" rx="10.5" ry="7.5" fill="#FFFFFF" ${O(2.4)}/>
    <path class="pant" d="M121 36 Q 123 45 128 37 Z" fill="#E58FA0" ${O(1.4)}/>
    ${L('M115 35 Q 121 38 127 34', DARK, 1.4)}
    <ellipse cx="130.5" cy="27" rx="3.8" ry="3.2" fill="${DARK}"/><circle cx="129.6" cy="25.8" r="1" fill="#FFFFFF"/>
    ${eye(114, 19.5, 2.6)}${L('M110 15.5 Q 113.5 13.5 117 15', DARK, 1.2)}
    <path d="M101 13 Q 89 17 93 39 Q 103 37 105 19 Z" fill="#8A5A3B" ${O(2.4)}/>
    ${L('M99 31 Q 104 41 97 47', '#D63A2F', 5)}<circle cx="97.5" cy="49" r="3" fill="#E0A21B" ${O(1.2)}/>`,

  hase: `
    <g class="hop big">
      <ellipse cx="74" cy="14" rx="5.5" ry="15" fill="#D9D2C6" ${O(2.4)} transform="rotate(-18 74 14)"/>
      <ellipse cx="74" cy="15" rx="2.6" ry="10.5" fill="#F2B8C4" transform="rotate(-18 74 15)"/>
      <path d="M13 40 q-4 -6 2 -9 q2 -5 7 -2 q5 -1 5 5 q3 5 -3 7 q-4 4 -11 -1 z" fill="#FFFFFF" ${O(2)}/>
      <ellipse cx="50" cy="50" rx="28" ry="18" fill="#D9D2C6" ${O(3)}/>
      <ellipse cx="60" cy="56" rx="14" ry="10" fill="#FFFFFF"/>
      ${L('M30 40 q3 -3 6 0 M40 36 q3 -3 6 0 M28 52 q3 -3 6 0', '#B8B0A2', 1.2)}
      <ellipse cx="38" cy="65" rx="16" ry="6.5" fill="#D9D2C6" ${O(2.4)}/>${L('M26 67 h4 M23 65 h3', '#9A9184', 0.9)}
      <ellipse cx="72" cy="67" rx="7.5" ry="4.5" fill="#FFFFFF" ${O(2.2)}/>
      <ellipse cx="85" cy="14" rx="5.5" ry="15" fill="#D9D2C6" ${O(2.4)} transform="rotate(8 85 14)"/>
      <ellipse cx="85" cy="15" rx="2.6" ry="10.5" fill="#F2B8C4" transform="rotate(8 85 15)"/>
      <circle cx="81" cy="36" r="13.5" fill="#D9D2C6" ${O(3)}/>
      <ellipse cx="89" cy="42" rx="7" ry="5.5" fill="#FFFFFF"/>
      ${eye(85, 32, 2.6)}${L('M81.5 28 Q 84.5 26.5 88 28', DARK, 1)}
      <path d="M93 37 l3 1.4 l-2.4 2 z" fill="#E58FA0" ${O(1)}/>
      <circle cx="80" cy="40" r="2.6" fill="#E58FA0" opacity=".55"/>
      <path d="M92 44 L110 40 L108 46 Z" fill="#F28C38" ${O(1.6)}/>${L('M97 43 l1 2 M102 42 l1 2', '#C0602A', 0.9)}
      ${L('M110 41 l5 -4 M110 42 l6 -1 M109.5 43 l5 2', '#4F9A3A', 1.8)}
      ${L('M95 39 L104 35 M95 40.5 L105 39', '#9A9184', 0.7)}
    </g>`,

  schnecke: `
    ${L('M-4 71 H22', '#CFE8F2', 3, ' opacity=".9"')}${L('M2 70 H10', '#FFFFFF', 1, ' opacity=".9"')}
    <g class="creep">
      <path d="M10 71 H94 Q 106 71 106 59 V42 Q 106 33 98 33 Q 90 33 90 42 V55 H24 Q 10 55 10 71 Z" fill="#E8C07A" ${O(3)}/>
      ${L('M16 67 H92', '#F5DCA6', 2)}${[30, 42, 56, 70, 82].map(x => `<circle cx="${x}" cy="62" r="1" fill="#C99A55"/>`).join('')}
      ${L('M95 34 L90 17 M101 34 L107 19', 'currentColor', 2.4)}${L('M104 47 l5 2', 'currentColor', 2)}
      ${bigEye(90, 15, 3.4, 0.9)}${bigEye(107.5, 17, 3.4, 0.9)}
      ${L('M98 46 Q 101.5 50 105 46', DARK, 1.4)}<circle cx="96" cy="44" r="1.8" fill="#E58FA0" opacity=".7"/>
      <circle cx="52" cy="38" r="23" fill="#B07A47" ${O(3)}/>
      <path d="M52 38 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 1 1 8 8 a12 12 0 1 1 -12 -12 a16 16 0 0 1 16 -4" fill="none" stroke="#8A5A3B" stroke-width="4" stroke-linecap="round"/>
      <path d="M52 38 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 1 1 8 8 a12 12 0 1 1 -12 -12 a16 16 0 0 1 16 -4" fill="none" stroke="#E0A21B" stroke-width="1.2" stroke-linecap="round" transform="translate(1.5 1.5)" opacity=".8"/>
      ${L('M34 26 Q 40 18 50 16', '#FFFFFF', 2.2, ' opacity=".6"')}
      <path d="M31 56 Q 52 64 74 54" fill="none" stroke="#8A5A3B" stroke-width="2"/>
      ${ring(6, a => `<ellipse cx="${f1(52 + Math.cos(a) * 3.4)}" cy="${f1(13 + Math.sin(a) * 3.4)}" rx="2.4" ry="1.4" fill="#FFFFFF" ${O(0.8)} transform="rotate(${f1(a * 57.3)} ${f1(52 + Math.cos(a) * 3.4)} ${f1(13 + Math.sin(a) * 3.4)})"/>`)}
      <circle cx="52" cy="13" r="2" fill="#F2C94C" ${O(0.8)}/>${L('M52 15 V18', '#4F9A3A', 1.4)}
    </g>`,

  dino: `
    ${[[50, 'leg-a'], [68, 'leg-b']].map(([x, c]) => `<g class="${c}"><rect x="${x}" y="48" width="11" height="26" rx="5" fill="#5A9A3C" ${O(2.4)}/>${L(`M${x + 6} 74 l2 -2 M${x + 9} 74 l2 -2`, '#FFFFFF', 1.4)}</g>`).join('')}
    <g class="hop">
      ${[[32, 33], [44, 31], [56, 29], [67, 24], [76, 18], [86, 10]].map(([x, y], i) => `<path d="M${x - 5} ${y + 2} L${x} ${y - 7 - (i % 2)} L${x + 5} ${y + 1} Z" fill="#F28C38" ${O(1.6)}/>`).join('')}
      <path d="M4 36 Q 34 32 54 32 L 76 22 Q 84 8 100 8 H118 Q 127 8 127 18 V26 Q 127 30 121 30 H104 L102 36 Q 98 46 88 50 Q 82 58 70 58 H50 Q 28 56 4 36 Z" fill="#6BB04A" ${O(3)}/>
      <path d="M26 44 Q 50 54 70 55 Q 84 54 92 46 Q 82 49 70 50 Q 48 49 26 44 Z" fill="#B9DD8A"/>
      ${L('M40 48 l1 3 M50 50.5 l.5 3 M60 51.5 v3 M70 51.5 v3 M80 50 l-.5 3', '#8CBF5E', 1)}
      ${[[38, 38, 2.6], [52, 37, 3.2], [64, 34, 2.4], [74, 30, 2.8], [60, 42, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4F8A34"/>`).join('')}
      ${L('M102 11 Q 108 8 114 11', '#4F8A34', 2.2)}${bigEye(108, 15.5, 3.6, 0.9)}
      <circle cx="123" cy="13" r="1.1" fill="${DARK}"/>
      ${L('M104 30 H121', DARK, 1.2)}<path d="M107 30 l2 3.4 l2 -3.4 l2 3.4 l2 -3.4 l2 3.4 l2 -3.4" fill="#FFFFFF" ${O(1.1)}/>
      <circle cx="100" cy="24" r="2.4" fill="#E58FA0" opacity=".5"/>
      ${L('M90 42 l8 4', 'currentColor', 5)}${L('M90 42 l8 4', '#6BB04A', 2.6)}${L('M98 46 l3 0 M98 46 l2 2', '#FFFFFF', 1.1)}
    </g>`,

  igel: `
    ${[[26, 'leg-a'], [62, 'leg-b']].map(([x, c]) => `<g class="${c}"><rect x="${x}" y="61" width="8" height="12" rx="3.5" fill="#6B4226" ${O(2)}/>${L(`M${x + 6} 73 l2.5 -.5`, '#E9E4DA', 1)}</g>`).join('')}
    <g class="hop">
      <path d="M8.0 62.0 L12.0 62.0 L1.2 58.4 L12.7 56.3 L3.1 51.2 L14.8 50.9 L6.8 44.6 L18.1 46.0 L12.0 38.7 L22.6 41.8 L18.7 33.8 L28.0 38.4 L26.5 30.2 L34.1 36.1 L35.1 27.9 L40.7 34.9 L44.0 27.1 L47.3 34.9 L52.9 27.9 L53.9 36.1 L61.5 30.2 L60.0 38.4 L69.3 33.8 L65.4 41.8 L76.0 38.7 L69.9 46.0 L81.2 44.6 L73.2 50.9 L84.9 51.2 L75.3 56.3 L86.8 58.4 L76.0 62.0 Z" fill="#5A3A26" ${O(2.4)}/>
      <path d="M8.0 62.0 L12.0 62.0 L1.2 58.4 L12.7 56.3 L3.1 51.2 L14.8 50.9 L6.8 44.6 L18.1 46.0 L12.0 38.7 L22.6 41.8 L18.7 33.8 L28.0 38.4 L26.5 30.2 L34.1 36.1 L35.1 27.9 L40.7 34.9 L44.0 27.1 L47.3 34.9 L52.9 27.9 L53.9 36.1 L61.5 30.2 L60.0 38.4 L69.3 33.8 L65.4 41.8 L76.0 38.7 L69.9 46.0 L81.2 44.6 L73.2 50.9 L84.9 51.2 L75.3 56.3 L86.8 58.4 L76.0 62.0 Z" fill="#8A5A3B" transform="translate(44 60) scale(.8) translate(-44 -60)"/>
      ${ring(14, a => { const t = Math.PI + (a / 2); const x1 = 44 + Math.cos(t) * 14, y1 = 58 + Math.sin(t) * 12, x2 = 44 + Math.cos(t) * 26, y2 = 58 + Math.sin(t) * 22; return L(`M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`, '#C9A27A', 1); })}
      <path d="M14 62 Q 44 70 76 62" fill="#E8C07A" ${O(1.6)}/>
      <circle cx="40" cy="23" r="8.5" fill="#D63A2F" ${O(2)}/>${L('M35 19 Q 37 16 40 16.5', '#FFFFFF', 1.6, ' opacity=".8"')}
      ${L('M40 15 Q 41 11 43 10', '#6B4226', 1.6)}<path d="M42 12 Q 48 8 50 12 Q 46 15 42 12 Z" fill="#4F9A3A" ${O(1)}/>
      <path d="M64 45 Q 84 45 97 61 Q 85 70 62 66 Z" fill="#E8C07A" ${O(2.4)}/>
      <circle cx="70" cy="47" r="3.6" fill="#C99A55" ${O(1.4)}/>
      <circle cx="97" cy="61" r="3.6" fill="${DARK}"/><circle cx="96" cy="59.8" r="1" fill="#FFFFFF"/>
      ${eye(80, 53, 2.3)}<circle cx="82" cy="59" r="2" fill="#E58FA0" opacity=".65"/>
      ${L('M88 64 Q 91 65.5 93 64', DARK, 1)}
    </g>`,
};
