// Sprach-Schnelleintrag für den Beifahrer: Mikrofon antippen, z. B. „Tankstopp, 45 Liter, 78 Euro 50“ oder
// „Stellplatz Seeblick, 25 Euro, vier Sterne“ sagen – LAMMping erkennt Art, Titel, Liter, Betrag und Sterne
// und öffnet den ausgefüllten Eintrag zum Nachsehen und Speichern.

export default function installSprache(app) {
  const { VIEWS, ACTIONS, icon, toast, openSheet, closeSheet, nowLocal, TYPES } = app;
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Schlüsselwörter je Eintragsart (erste passende gewinnt)
  const KEYS = [
    ['tank', /\b(tank\w*|getankt|diesel|benzin|adblue)\b/],
    ['service', /\b(entsorg\w*|ver- und entsorgung|grauwasser|frischwasser|toilette geleert|kassette)\b/],
    ['stellplatz', /\b(stellplatz|campingplatz|camping|übernacht\w*|schlafplatz|frei stehen)\b/],
    ['faehre', /\b(fähre|maut\w*|vignette|grenze|überfahrt)\b/],
    ['einkauf', /\b(einkauf\w*|eingekauft|supermarkt|bäcker\w*|markt|lidl|aldi|rewe|edeka|spar|carrefour|coop)\b/],
    ['restaurant', /\b(restaurant|café|cafe|kaffee|eis|essen|pizzeria|imbiss|mittagessen|abendessen)\b/],
    ['baden', /\b(baden|gebadet|strand|freibad|badesee|schwimmen)\b/],
    ['museum', /\b(museum|schloss|burg|kirche|dom|ausstellung)\b/],
    ['wanderung', /\b(wander\w*|radtour|fahrradtour|tour|gipfel)\b/],
    ['kinder', /\b(spielplatz|tierpark|zoo|freizeitpark)\b/],
    ['pause', /\b(pause|rast|rastplatz|picknick)\b/],
    ['sight', /\b(sehenswürdigkeit|aussicht|altstadt|besichtig\w*|ausflug)\b/],
  ];
  const WORDS = { ein: 1, eins: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, hundert: 100 };
  const n = s => parseFloat(String(s).replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  const NUM = '(\\d+(?:[.,]\\d+)?)';

  function parse(raw) {
    const said = raw.trim();
    const s = said.toLowerCase().replace(/€/g, ' euro ').replace(/\s+/g, ' ');
    const r = { type: 'notiz', title: '', text: said ? said[0].toUpperCase() + said.slice(1) : '' };
    const hit = KEYS.find(([, re]) => re.test(s));
    if (hit) r.type = hit[0];
    let m;
    if ((m = s.match(new RegExp(`${NUM}\\s*(?:liter|l\\b)`)))) r.liters = n(m[1]);
    // „78 Euro 50“, „78,50 Euro“, „78 Euro und 50 Cent“
    if ((m = s.match(new RegExp(`${NUM}\\s*euro(?:\\s*(?:und\\s*)?(\\d{1,2})(?:\\s*cent)?\\b)?`)))) r.amount = n(m[1]) + (m[2] ? +m[2] / 100 : 0);
    else if ((m = s.match(/(?:kostet|kosten|für|bezahlt)\s*(\d+(?:[.,]\d+)?)/))) r.amount = n(m[1]);
    if ((m = s.match(/kilometerstand\s*(\d[\d. ]*\d)/))) r.odo = Math.round(n(m[1].replace(/ /g, '')));
    if ((m = s.match(/\b(\d|ein|eins|zwei|drei|vier|fünf)\s*sterne?n?\b/))) r.rating = Math.min(5, /\d/.test(m[1]) ? +m[1] : WORDS[m[1]]);
    // Titel: erster Satzteil ohne Schlüsselwort, Beträge und Füllwörter; ganze Sätze bleiben, wie sie sind
    const first = said.split(/[,.;]| für | mit /i)[0].trim();
    const words = first.replace(/\s*\d.*$/, '');
    let title = words.split(/\s+/).length > 5 ? words : first
      .replace(hit ? new RegExp(hit[1].source, 'gi') : /^$/, w => (/^(lidl|aldi|rewe|edeka|spar|carrefour|coop)$/i.test(w) ? w : ''))
      .replace(/\d+(?:[.,]\d+)?\s*(?:euro|€)(?:\s*(?:und\s*)?\d{1,2}(?:\s*cent)?)?/gi, '')
      .replace(/\d+(?:[.,]\d+)?\s*(?:liter|sterne?)?/gi, '').replace(/\b(ein|zwei|drei|vier|fünf)\s*sterne?\b/gi, '')
      .replace(/^\s*((in|im|am|an der|an|bei|beim|auf dem|auf|nach|zum|zur|zu|der|die|das|den)\s+)+/i, '').replace(/\s+/g, ' ').trim();
    if (title.length < 2) title = '';
    r.title = title ? title[0].toUpperCase() + title.slice(1) : (hit ? '' : said.slice(0, 60));
    return r;
  }
  app.voiceParse = parse;

  function openPrefilled(said) {
    const p = parse(said);
    const T = TYPES[p.type] || {};
    const e = { type: p.type, title: p.title, text: p.text, date: nowLocal() };
    if (p.rating && T.rating) e.rating = p.rating;
    if (p.amount && T.cost && !T.fuel) e.cost = p.amount;
    app.openEntryForm(e, { locate: true });
    const form = document.querySelector('#sheetBody form');
    if (!form) return;
    const set = (name, v) => { const f = form.querySelector(`[name="${name}"]`); if (f && v != null) f.value = String(v).replace('.', ','); };
    if (T.fuel) { set('fuelLiters', p.liters); set('fuelAmount', p.amount != null ? p.amount.toFixed(2) : null); set('fuelOdo', p.odo); }
    if (p.rating && T.rating) {
      set('rating', p.rating);
      form.querySelectorAll('.stars button').forEach((b, i) => b.classList.toggle('on', i < p.rating));
    }
    toast('Bitte kurz prüfen und speichern.');
  }
  app.voiceEntry = openPrefilled;

  let rec = null;
  ACTIONS['voice-entry'] = () => {
    if (!Speech) { toast('Dieses Handy bietet keine Spracheingabe an.'); return; }
    if (rec) { rec.stop(); return; }
    openSheet(`<div class="voice-sheet">${app.sheetHead('Sprich einfach los')}
      <button type="button" class="voice-orb on" data-action="voice-entry-stop" aria-label="Fertig">${icon('mic')}</button>
      <p class="voice-live" id="voiceLive">Ich höre zu …</p>
      <p class="sub">Zum Beispiel: „Tankstopp, 45 Liter, 78 Euro 50“ · „Stellplatz Seeblick, 25 Euro, vier Sterne“ · „Pause am Rastplatz Brenner“</p>
      <div class="sheet-foot"><button type="button" class="primary" data-action="voice-entry-stop">Fertig</button></div></div>`);
    let said = '', cancelled = false;
    rec = new Speech();
    rec.lang = 'de-DE'; rec.interimResults = true; rec.continuous = false;
    rec.onresult = ev => {
      let done = '', interim = '';
      for (let i = 0; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) done += t; else interim += t; }
      said = (done + interim).trim();
      const live = document.getElementById('voiceLive');
      if (live) live.textContent = said || 'Ich höre zu …';
    };
    rec.onerror = ev => {
      cancelled = true;
      toast(ev.error === 'not-allowed' ? 'Das Mikrofon ist für LAMMping nicht freigegeben.' : ev.error === 'no-speech' ? 'Ich habe nichts gehört.' : 'Die Spracheingabe hat nicht geklappt.');
    };
    rec.onend = () => {
      rec = null;
      if (cancelled || !said) { closeSheet(); return; }
      openPrefilled(said);
    };
    rec.start();
  };
  ACTIONS['voice-entry-stop'] = () => { if (rec) rec.stop(); else closeSheet(); };

  // Mikrofon-Knopf über dem „+ Eintrag“-Knopf im Tagebuch
  const diary = VIEWS.tagebuch;
  VIEWS.tagebuch = (...a) => {
    const html = diary(...a);
    if (!Speech || !html.includes('class="fab"')) return html;
    return html.replace(/(<button class="fab"[^>]*>[\s\S]*?<\/button>)/, `$1<button class="fab fab-voice" data-action="voice-entry" aria-label="Eintrag sprechen" title="Eintrag sprechen">${icon('mic')}</button>`);
  };
}
