// Am Stellplatz: Wasserwaage zum Ausrichten des Campers (Lagesensor des Handys) und Feiertage im Reiseland
// (Hinweis in der Heute-Karte, Übersicht in den Länderinfos). Feiertage werden ohne Internet berechnet.

export default function installStellplatz(app) {
  const { S, LS, VIEWS, ACTIONS, FORMS, esc, num, pageHead, save, openSheet, closeSheet, currentTrip, tripEntries, byDate, today, fmtDay, go } = app;
  const sheetHead = app.sheetHead;
  const dec = (v, n = 1) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n });

  /* ====================================================================== */
  /* Wasserwaage                                                             */
  /* ====================================================================== */

  const levelCfg = () => ({ wb: 3, track: 1.6, wedges: '4, 7, 10', ...(S.meta.find(m => m.id === 'level') || {}) });
  const off = () => LS.get('level.off', { b: 0, g: 0 });
  let cur = null, listening = false, seen = false, smooth = null;

  VIEWS.wasserwaage = () => {
    const c = levelCfg();
    setTimeout(update, 0);
    return `${pageHead('fahrzeug', 'Wasserwaage', 'Camper gerade stellen')}
      <p class="sub">Handy flach auf den Boden in die Mitte des Campers legen, die <b>Oberkante zeigt nach vorn</b> (in Fahrtrichtung).</p>
      <section class="panel level">
        <div class="lv-wrap">
          <svg class="lv-car" viewBox="0 0 200 300" aria-hidden="true">
            <rect x="40" y="20" width="120" height="260" rx="26" class="lv-body"/>
            <path d="M58 52q42-26 84 0v34H58z" class="lv-glass"/>
            <text x="100" y="14" text-anchor="middle" class="lv-front">vorn</text>
            ${[['fl', 22, 60], ['fr', 158, 60], ['rl', 22, 220], ['rr', 158, 220]].map(([k, x, y]) => `<rect x="${x}" y="${y}" width="20" height="44" rx="6" class="lv-wheel" id="lvw-${k}"/>
              <text x="${k.endsWith('l') ? x - 6 : x + 26}" y="${y + 27}" text-anchor="${k.endsWith('l') ? 'end' : 'start'}" class="lv-cm" id="lvt-${k}"></text>`).join('')}
            <circle cx="100" cy="150" r="44" class="lv-ring"/><circle cx="100" cy="150" r="8" class="lv-mid"/>
            <circle cx="100" cy="150" r="13" class="lv-bubble" id="lvBubble"/>
          </svg>
        </div>
        <p class="lv-state" id="lvState">${listening ? 'Messe …' : 'Tippt auf „Messen“, dann zeigt die App, welches Rad auf den Keil muss.'}</p>
        <p class="lv-deg" id="lvDeg"></p>
        <div class="btnrow">
          <button class="primary" data-action="level-start">${listening ? 'Läuft' : 'Messen'}</button>
          <button class="ghost" data-action="level-zero">Nullpunkt setzen</button>
          <button class="ghost" data-action="level-form">Maße</button>
        </div>
      </section>
      <p class="sub">Radstand ${dec(c.wb, 2)} m, Spurweite ${dec(c.track, 2)} m, Keilstufen ${esc(c.wedges)} cm.
        „Nullpunkt setzen“: Handy auf eine sicher gerade Fläche legen und tippen, wenn eure Handyhülle etwas schief liegt.</p>`;
  };

  function onTilt(ev) {
    if (ev.beta == null || ev.gamma == null) return;
    seen = true;
    const raw = { b: ev.beta, g: ev.gamma };
    smooth = smooth ? { b: smooth.b * 0.8 + raw.b * 0.2, g: smooth.g * 0.8 + raw.g * 0.2 } : raw;
    const o = off();
    cur = { b: smooth.b - o.b, g: smooth.g - o.g, raw: smooth };
    update();
  }
  app.levelTilt = onTilt;   // für Tests
  ACTIONS['level-start'] = async () => {
    if (listening) return;
    let denied = false;
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        denied = (await DeviceOrientationEvent.requestPermission()) !== 'granted';
      }
    } catch { /* ältere Geräte fragen nicht */ }
    window.addEventListener('deviceorientation', onTilt);
    listening = true;
    setState('Messe …');
    const btn = document.querySelector('[data-action=level-start]');
    if (btn) btn.textContent = 'Läuft';
    setTimeout(() => {
      if (!seen) setState(denied ? 'Ohne Zugriff auf den Lagesensor geht es nicht. Bitte in den Einstellungen erlauben.' : 'Kein Lagesensor gefunden. Die Wasserwaage geht nur auf Handy oder Tablet.');
    }, 2000);
  };
  ACTIONS['level-zero'] = () => {
    if (!cur) return setState('Erst „Messen“ antippen, dann den Nullpunkt setzen.');
    LS.set('level.off', { b: cur.raw.b, g: cur.raw.g });
    app.toast('Nullpunkt gesetzt');
  };
  const setState = t => { const el = document.getElementById('lvState'); if (el) el.textContent = t; };

  // Höhe jeder Ecke: x nach vorn, y nach rechts; Beta > 0 = vorn höher, Gamma > 0 = rechts tiefer
  function lifts(b, g) {
    const c = levelCfg(), rad = Math.PI / 180;
    const h = (x, y) => x * Math.tan(b * rad) - y * Math.tan(g * rad);
    const L = c.wb / 2, W = c.track / 2;
    const raw = { fl: h(L, -W), fr: h(L, W), rl: h(-L, -W), rr: h(-L, W) };
    const top = Math.max(...Object.values(raw));
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, (top - v) * 100]));
  }
  const wedge = cm => {
    const st = String(levelCfg().wedges).split(/[,; ]+/).map(Number).filter(n => n > 0).sort((a, b) => a - b);
    const i = st.findIndex(s => s >= cm - 1);
    return i < 0 ? `mehr als ${st[st.length - 1] || '?'} cm` : `Stufe ${i + 1}`;
  };
  let buzzed = false;
  function update() {
    if (!cur || !document.getElementById('lvBubble')) return;
    const { b, g } = cur;
    const bub = document.getElementById('lvBubble');
    const clamp = v => Math.max(-36, Math.min(36, v));
    // Die Blase wandert zur höheren Seite
    bub.setAttribute('cx', 100 + clamp(-g * 6));
    bub.setAttribute('cy', 150 + clamp(-b * 6));
    const flat = Math.abs(b) < 0.4 && Math.abs(g) < 0.4;
    bub.classList.toggle('ok', flat);
    const l = lifts(b, g);
    for (const k of ['fl', 'fr', 'rl', 'rr']) {
      const need = l[k] >= 1 && !flat;
      document.getElementById('lvw-' + k).classList.toggle('need', need);
      document.getElementById('lvt-' + k).textContent = need ? `+${Math.round(l[k])} cm` : '';
    }
    document.getElementById('lvDeg').textContent = `Längs ${dec(Math.abs(b))}° ${b > 0.05 ? '(vorn höher)' : b < -0.05 ? '(hinten höher)' : ''} · Quer ${dec(Math.abs(g))}° ${g > 0.05 ? '(links höher)' : g < -0.05 ? '(rechts höher)' : ''}`;
    const names = { fl: 'vorn links', fr: 'vorn rechts', rl: 'hinten links', rr: 'hinten rechts' };
    const todo = Object.entries(l).filter(([, v]) => v >= 1).sort((a, b2) => b2[1] - a[1]);
    setState(flat ? 'Waagerecht! Gute Nacht 😴' : todo.length ? `Keil unter ${todo.map(([k, v]) => `${names[k]} (${Math.round(v)} cm, ${wedge(v)})`).join(' und ')}` : 'Fast gerade.');
    if (flat && !buzzed && navigator.vibrate) { navigator.vibrate(80); buzzed = true; }
    if (!flat) buzzed = false;
  }
  ACTIONS['level-form'] = () => {
    const c = levelCfg();
    openSheet(`<form data-form="level">${sheetHead('Maße für die Wasserwaage')}
      <div class="row2">
        <label class="field"><span>Radstand in m</span><input name="wb" inputmode="decimal" value="${dec(c.wb, 2)}"></label>
        <label class="field"><span>Spurweite in m</span><input name="track" inputmode="decimal" value="${dec(c.track, 2)}"></label>
      </div>
      <label class="field"><span>Höhe der Keilstufen in cm</span><input name="wedges" value="${esc(c.wedges)}" placeholder="z. B. 4, 7, 10"></label>
      <p class="sub">Radstand: Abstand Vorder- zu Hinterachse (Fahrzeugschein oder Datenblatt). Spurweite: Abstand der Räder links zu rechts.</p>
      <div class="sheet-foot"><button class="primary">Speichern</button></div></form>`);
  };
  FORMS.level = form => {
    save('meta', { ...levelCfg(), id: 'level', wb: num(form.wb.value) || 3, track: num(form.track.value) || 1.6, wedges: form.wedges.value.trim() || '4, 7, 10' });
    closeSheet();
  };
  // Im Fahrzeug-Steckbrief: Knopf zur Wasserwaage
  const fahrzeug = VIEWS.fahrzeug;
  VIEWS.fahrzeug = () => fahrzeug().replace('<div class="btnrow"><button class="ghost" data-action="zl-open">',
    '<div class="btnrow"><button class="ghost" data-action="level-open">Wasserwaage</button><button class="ghost" data-action="zl-open">');
  ACTIONS['level-open'] = () => go('wasserwaage');

  /* ====================================================================== */
  /* Feiertage                                                               */
  /* ====================================================================== */

  // Regeln: „MM-TT“ fest, „E±n“ Tage nach Ostersonntag, „N:MM:W:n“ n-ter Wochentag W im Monat (n = -1: letzter),
  // „B:MM-TT:W“ erster Wochentag W ab diesem Datum. Dritte Angabe: nur in diesen Regionen.
  const HOL = {
    DE: [['01-01', 'Neujahr'], ['01-06', 'Heilige Drei Könige', 'Bayern, Baden-Württemberg, Sachsen-Anhalt'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'],
      ['05-01', 'Tag der Arbeit'], ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'], ['E+60', 'Fronleichnam', 'Bayern, Baden-Württemberg, Hessen, NRW, Rheinland-Pfalz, Saarland'],
      ['08-15', 'Mariä Himmelfahrt', 'Saarland, katholische Orte in Bayern'], ['10-03', 'Tag der Deutschen Einheit'], ['10-31', 'Reformationstag', 'Norden und Osten'],
      ['11-01', 'Allerheiligen', 'Bayern, Baden-Württemberg, NRW, Rheinland-Pfalz, Saarland'], ['12-25', '1. Weihnachtstag'], ['12-26', '2. Weihnachtstag']],
    AT: [['01-01', 'Neujahr'], ['01-06', 'Heilige Drei Könige'], ['E+1', 'Ostermontag'], ['05-01', 'Staatsfeiertag'], ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'],
      ['E+60', 'Fronleichnam'], ['08-15', 'Mariä Himmelfahrt'], ['10-26', 'Nationalfeiertag'], ['11-01', 'Allerheiligen'], ['12-08', 'Mariä Empfängnis'], ['12-25', 'Christtag'], ['12-26', 'Stefanitag']],
    CH: [['01-01', 'Neujahr'], ['E-2', 'Karfreitag', 'fast alle Kantone'], ['E+1', 'Ostermontag', 'fast alle Kantone'], ['E+39', 'Auffahrt'], ['E+50', 'Pfingstmontag', 'fast alle Kantone'],
      ['08-01', 'Bundesfeier'], ['12-25', 'Weihnachten'], ['12-26', 'Stephanstag', 'die meisten Kantone']],
    IT: [['01-01', 'Capodanno'], ['01-06', 'Epifania'], ['E+1', 'Pasquetta (Ostermontag)'], ['04-25', 'Tag der Befreiung'], ['05-01', 'Tag der Arbeit'], ['06-02', 'Tag der Republik'],
      ['08-15', 'Ferragosto'], ['11-01', 'Allerheiligen'], ['12-08', 'Mariä Empfängnis'], ['12-25', 'Natale'], ['12-26', 'Santo Stefano']],
    FR: [['01-01', 'Jour de l’an'], ['E+1', 'Ostermontag'], ['05-01', 'Fête du Travail'], ['05-08', 'Kriegsende 1945'], ['E+39', 'Ascension'], ['E+50', 'Pfingstmontag (viele Geschäfte offen)'],
      ['07-14', 'Nationalfeiertag'], ['08-15', 'Assomption'], ['11-01', 'Toussaint'], ['11-11', 'Waffenstillstand 1918'], ['12-25', 'Noël']],
    NL: [['01-01', 'Neujahr'], ['E+1', 'Ostermontag'], ['04-27', 'Koningsdag'], ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'], ['12-25', '1. Weihnachtstag'], ['12-26', '2. Weihnachtstag']],
    BE: [['01-01', 'Neujahr'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'], ['07-21', 'Nationalfeiertag'],
      ['08-15', 'Mariä Himmelfahrt'], ['11-01', 'Allerheiligen'], ['11-11', 'Waffenstillstand'], ['12-25', 'Weihnachten']],
    LU: [['01-01', 'Neujahr'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['05-09', 'Europatag'], ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'],
      ['06-23', 'Nationalfeiertag'], ['08-15', 'Mariä Himmelfahrt'], ['11-01', 'Allerheiligen'], ['12-25', 'Weihnachten'], ['12-26', 'Stephanstag']],
    DK: [['01-01', 'Neujahr'], ['E-3', 'Gründonnerstag'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'], ['E+39', 'Christi Himmelfahrt'], ['06-05', 'Verfassungstag (viele Geschäfte zu)'],
      ['E+50', 'Pfingstmontag'], ['12-24', 'Heiligabend (ab mittags zu)'], ['12-25', 'Weihnachten'], ['12-26', '2. Weihnachtstag']],
    SE: [['01-01', 'Neujahr'], ['01-06', 'Trettondedag jul'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['E+39', 'Christi Himmelfahrt'],
      ['06-06', 'Nationalfeiertag'], ['B:06-19:5', 'Midsommarafton'], ['B:06-20:6', 'Midsommardagen'], ['B:10-31:6', 'Allerheiligen'], ['12-24', 'Julafton'], ['12-25', 'Weihnachten'], ['12-26', '2. Weihnachtstag'], ['12-31', 'Silvester']],
    NO: [['01-01', 'Neujahr'], ['E-3', 'Gründonnerstag'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['05-17', 'Nationalfeiertag'],
      ['E+39', 'Christi Himmelfahrt'], ['E+50', 'Pfingstmontag'], ['12-25', 'Weihnachten'], ['12-26', '2. Weihnachtstag']],
    ES: [['01-01', 'Año Nuevo'], ['01-06', 'Reyes'], ['E-3', 'Gründonnerstag', 'die meisten Regionen'], ['E-2', 'Viernes Santo'], ['05-01', 'Tag der Arbeit'], ['08-15', 'Mariä Himmelfahrt'],
      ['10-12', 'Nationalfeiertag'], ['11-01', 'Allerheiligen'], ['12-06', 'Verfassungstag'], ['12-08', 'Mariä Empfängnis'], ['12-25', 'Navidad']],
    PT: [['01-01', 'Neujahr'], ['E-2', 'Karfreitag'], ['04-25', 'Tag der Freiheit'], ['05-01', 'Tag der Arbeit'], ['E+60', 'Fronleichnam'], ['06-10', 'Nationalfeiertag'],
      ['08-15', 'Mariä Himmelfahrt'], ['10-05', 'Tag der Republik'], ['11-01', 'Allerheiligen'], ['12-01', 'Unabhängigkeit'], ['12-08', 'Mariä Empfängnis'], ['12-25', 'Weihnachten']],
    HR: [['01-01', 'Neujahr'], ['01-06', 'Heilige Drei Könige'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['05-30', 'Staatsfeiertag'], ['E+60', 'Fronleichnam'],
      ['06-22', 'Tag des Antifaschismus'], ['08-05', 'Tag des Sieges'], ['08-15', 'Mariä Himmelfahrt'], ['11-01', 'Allerheiligen'], ['11-18', 'Gedenktag Vukovar'], ['12-25', 'Weihnachten'], ['12-26', 'Stephanstag']],
    SI: [['01-01', 'Neujahr'], ['01-02', 'Neujahr'], ['02-08', 'Prešeren-Tag'], ['E+1', 'Ostermontag'], ['04-27', 'Tag des Widerstands'], ['05-01', 'Tag der Arbeit'], ['05-02', 'Tag der Arbeit'],
      ['06-25', 'Staatsfeiertag'], ['08-15', 'Mariä Himmelfahrt'], ['10-31', 'Reformationstag'], ['11-01', 'Allerheiligen'], ['12-25', 'Weihnachten'], ['12-26', 'Unabhängigkeitstag']],
    CZ: [['01-01', 'Neujahr'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['05-08', 'Tag der Befreiung'], ['07-05', 'Kyrill und Method'],
      ['07-06', 'Jan Hus'], ['09-28', 'Wenzelstag'], ['10-28', 'Staatsgründung'], ['11-17', 'Tag des Kampfes für Freiheit'], ['12-24', 'Heiligabend'], ['12-25', 'Weihnachten'], ['12-26', 'Stephanstag']],
    PL: [['01-01', 'Neujahr'], ['01-06', 'Heilige Drei Könige'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['05-03', 'Verfassungstag'], ['E+60', 'Fronleichnam'],
      ['08-15', 'Mariä Himmelfahrt'], ['11-01', 'Allerheiligen'], ['11-11', 'Unabhängigkeitstag'], ['12-24', 'Heiligabend'], ['12-25', 'Weihnachten'], ['12-26', '2. Weihnachtstag']],
    HU: [['01-01', 'Neujahr'], ['03-15', 'Nationalfeiertag'], ['E-2', 'Karfreitag'], ['E+1', 'Ostermontag'], ['05-01', 'Tag der Arbeit'], ['E+50', 'Pfingstmontag'],
      ['08-20', 'Staatsgründung'], ['10-23', 'Nationalfeiertag'], ['11-01', 'Allerheiligen'], ['12-25', 'Weihnachten'], ['12-26', '2. Weihnachtstag']],
    GB: [['01-01', 'New Year’s Day'], ['01-02', 'New Year (2. Tag)', 'Schottland'], ['E-2', 'Good Friday'], ['E+1', 'Easter Monday', 'England, Wales, Nordirland'],
      ['N:05:1:1', 'Early May Bank Holiday'], ['N:05:1:-1', 'Spring Bank Holiday'], ['N:08:1:1', 'Summer Bank Holiday', 'Schottland'],
      ['N:08:1:-1', 'Summer Bank Holiday', 'England, Wales, Nordirland'], ['11-30', 'St Andrew’s Day', 'Schottland'], ['12-25', 'Christmas Day'], ['12-26', 'Boxing Day']],
    IE: [['01-01', 'New Year’s Day'], ['N:02:1:1', 'St Brigid’s Day'], ['03-17', 'St Patrick’s Day'], ['E+1', 'Easter Monday'], ['N:05:1:1', 'May Bank Holiday'],
      ['N:06:1:1', 'June Bank Holiday'], ['N:08:1:1', 'August Bank Holiday'], ['N:10:1:-1', 'October Bank Holiday'], ['12-25', 'Christmas Day'], ['12-26', 'St Stephen’s Day']],
  };
  const SUNDAY_CLOSED = ['DE', 'AT', 'CH', 'NO', 'HU', 'PL'];
  const iso = d => d.toISOString().slice(0, 10);
  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return utc(y, month, day);
  }
  function ruleDate(rule, y) {
    if (/^\d\d-\d\d$/.test(rule)) return iso(utc(y, +rule.slice(0, 2), +rule.slice(3)));
    if (rule[0] === 'E') return iso(new Date(easter(y).getTime() + +rule.slice(1) * 864e5));
    if (rule[0] === 'N') {
      const [, m, wd, n] = rule.split(':').map(Number);
      if (n > 0) { const first = utc(y, m, 1); return iso(utc(y, m, 1 + ((wd - first.getUTCDay() + 7) % 7) + (n - 1) * 7)); }
      const last = utc(y, m + 1, 0); return iso(utc(y, m, last.getUTCDate() - ((last.getUTCDay() - wd + 7) % 7)));
    }
    if (rule[0] === 'B') { const [, md, wd] = rule.split(':'); const s = utc(y, +md.slice(0, 2), +md.slice(3)); return iso(utc(y, +md.slice(0, 2), +md.slice(3) + ((+wd - s.getUTCDay() + 7) % 7))); }
    return '';
  }
  // Feiertage eines Landes an einem Tag
  const holidays = (cc, day) => (HOL[cc] || []).filter(([r]) => ruleDate(r, +day.slice(0, 4)) === day).map(([, name, region]) => ({ name, region }));
  app.holidays = holidays;
  const countryName = cc => (app.COUNTRIES && app.COUNTRIES[cc] ? app.COUNTRIES[cc].name : (() => { try { return new Intl.DisplayNames(['de'], { type: 'region' }).of(cc); } catch { return cc; } })());
  const addDays = (d, n) => iso(new Date(Date.parse(d + 'T12:00Z') + n * 864e5));
  const IN = { DE: 'in Deutschland', AT: 'in Österreich', CH: 'in der Schweiz', NL: 'in den Niederlanden', CZ: 'in Tschechien', SK: 'in der Slowakei', GB: 'in Großbritannien' };
  const inLand = cc => IN[cc] || `in ${countryName(cc)}`;

  // Länder, die gerade zählen: wo ihr seid und wohin ihr als Nächstes wollt
  function nowCountries(t) {
    const last = tripEntries(t).filter(e => e.country).sort(byDate).pop();
    const next = S.places.filter(p => p.tripId === t.id && !p.done && p.country).sort((a, b) => (a.planDate || '9').localeCompare(b.planDate || '9'))[0];
    return [...new Set([last && last.country, next && next.country].filter(Boolean))];
  }
  const todayCard = app.todayCard;
  app.todayCard = (t, st) => {
    const html = todayCard ? todayCard(t, st) : '';
    if (!html || !t) return html;
    const d = today();
    const lines = [];
    for (const cc of nowCountries(t)) {
      for (let i = 0; i < 3; i++) {
        const day = addDays(d, i);
        holidays(cc, day).forEach(h => lines.push(`🎉 ${i === 0 ? 'Heute' : i === 1 ? 'Morgen' : `Am ${fmtDay(day).split(',')[0]}`} ${inLand(cc)}: <b>${esc(h.name)}</b>${h.region ? ` (${esc(h.region)})` : ' – viele Geschäfte zu'}`));
      }
      const tomorrow = addDays(d, 1);
      if (SUNDAY_CLOSED.includes(cc) && new Date(tomorrow + 'T12:00Z').getUTCDay() === 0 && !holidays(cc, d).length) lines.push(`🛒 Morgen ist Sonntag: Supermärkte ${inLand(cc)} meist zu – heute einkaufen.`);
    }
    if (!lines.length) return html;
    return html.replace(/<\/section>\s*$/, `<div class="today-hol">${lines.slice(0, 3).map(l => `<p>${l}</p>`).join('')}</div></section>`);
  };
  // Länderinfos: Feiertage der nächsten 60 Tage für die Länder der Reise
  const laender = VIEWS.laender;
  VIEWS.laender = () => {
    const html = laender();
    const t = currentTrip();
    const ccs = t && app.tripCountries ? app.tripCountries(t).filter(cc => HOL[cc]) : [];
    if (!ccs.length) return html;
    const d = today();
    const list = ccs.map(cc => {
      const hs = [];
      for (let i = 0; i < 60; i++) { const day = addDays(d, i); holidays(cc, day).forEach(h => hs.push({ day, ...h })); }
      return `<li><b>${app.flag ? app.flag(cc) : ''} ${esc(countryName(cc))}</b>${hs.length ? `<ul>${hs.map(h => `<li><span>${fmtDay(h.day)}</span> ${esc(h.name)}${h.region ? ` <small>(${esc(h.region)})</small>` : ''}</li>`).join('')}</ul>` : '<p class="sub">Keine Feiertage in den nächsten 60 Tagen.</p>'}</li>`;
    }).join('');
    return `${html}<section class="panel holidays"><h2>Feiertage in den nächsten 60 Tagen</h2><ul class="hol-list">${list}</ul>
      <p class="sub">Landesweite Feiertage, ohne Gewähr. Dazu kommen örtliche Feste und Brückentage. An Feiertagen und in vielen Ländern sonntags sind Supermärkte zu.</p></section>`;
  };
}
