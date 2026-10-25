// Flaggen als Bilder (vendor/flaggen, flag-icons, MIT): Windows zeigt Flaggen-Emojis nur als zwei Buchstaben.
// Flaggen mit Wappen liegen als kleine WebP-Bilder vor, alle anderen als SVG.

const WEBP = new Set('ad af as bm bn bo bt bz dg dm do ec es fj fk gs gt hr ht io ir je ky me mp mt mx ni om pn py rs sm sv sx tm un va'.split(' '));

export const flagSrc = cc => {
  const c = String(cc || '').toLowerCase();
  return /^[a-z]{2}$/.test(c) ? `vendor/flaggen/${c}.${WEBP.has(c) ? 'webp' : 'svg'}` : '';
};
export const flagImg = (cc, cls = 'fl') => {
  const src = flagSrc(cc);
  return src ? `<img class="${cls}" src="${src}" alt="${String(cc).toUpperCase()}" loading="lazy" decoding="async" onerror="this.style.display='none'">` : '';
};
// Für reinen Text (z. B. Auswahllisten): das Emoji
export const flagText = cc => (cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '');
