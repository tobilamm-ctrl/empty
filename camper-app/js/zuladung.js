// Zuladungs-Rechner: Leergewicht, Personen, Wasser, Gas, Boxen und weitere Posten gegen das zulässige Gesamtgewicht.
// Gewichte werden für die ganze Familie gemeinsam gespeichert (meta „payload“), Fahrzeugdaten kommen aus dem Steckbrief.

export default function installZuladung(app) {
  const { S, VIEWS, ACTIONS, CHANGES, esc, icon, num, pageHead, save, members, go } = app;
  const vehicle = () => S.meta.find(m => m.id === 'vehicle') || {};
  const doc = () => S.meta.find(m => m.id === 'payload') || { id: 'payload' };
  const kg = v => `${Math.round(v).toLocaleString('de-DE')} kg`;
  const water = () => { const w = (S.meta.find(m => m.id === 'autarky') || {}).water; return w ? { cap: w.cap || 20, level: w.level } : { cap: 20, level: 20 }; };
  const PRESETS = [['Fahrräder (je 15 kg)', 30], ['Fahrradträger', 15], ['Dachbox', 20], ['Markise', 25], ['Lebensmittel', 15], ['Getränke', 20], ['Campingmöbel', 15], ['Kleidung', 25]];

  function calc() {
    const v = vehicle(), d = doc();
    const people = members().map(m => ({ id: m.id, name: m.name, kg: num((d.people || {})[m.id]) }));
    const w = water();
    const waterKg = d.waterFull === false ? w.level : w.cap;
    const boxes = S.boxes.map(b => ({ id: b.id, name: b.name, kg: num((d.boxes || {})[b.id]) }));
    const extras = d.extras || [];
    const items = [
      ...people.map(p => ({ label: p.name, kg: p.kg })),
      { label: d.waterFull === false ? 'Wasser (aktueller Stand)' : 'Wasser (voll)', kg: waterKg },
      { label: 'Gas', kg: num(d.gas) },
      ...boxes.map(b => ({ label: b.name, kg: b.kg })),
      ...extras.filter(x => x.on !== false).map(x => ({ label: x.name, kg: num(x.kg) })),
    ];
    let load = items.reduce((s, x) => s + x.kg, 0);
    // Im „Leergewicht fahrbereit“ stecken meist schon Fahrer (75 kg) und 90 % Tank
    const driver = d.driverIn !== false ? 75 : 0;
    load = Math.max(0, load - driver);
    const empty = num(v.empty), max = num(v.weight);
    return { v, d, people, boxes, extras, waterKg, w, load, driver, empty, max, total: empty + load, left: max - empty - load };
  }

  VIEWS.zuladung = () => {
    const c = calc();
    if (!c.max || !c.empty) {
      return `${pageHead('fahrzeug', 'Zuladung', 'Wie viel darf noch rein?')}
        <p class="hint">Tragt im Fahrzeug-Steckbrief das zulässige Gesamtgewicht und das Leergewicht fahrbereit ein (steht im Fahrzeugschein unter F.2 und G).</p>
        <button class="primary" data-action="zl-vehicle">Zum Steckbrief</button>`;
    }
    const pct = c.total / c.max;
    const cls = pct > 1 ? 'over' : pct > 0.95 ? 'tight' : 'ok';
    const inp = (action, key, val, ph = '0') => `<input class="kg" inputmode="decimal" data-action="${action}" data-k="${esc(key)}" value="${val ? String(val).replace('.', ',') : ''}" placeholder="${ph}">`;
    return `${pageHead('fahrzeug', 'Zuladung', `${esc(c.v.name || 'Camper')}: ${kg(c.max)} zulässig`)}
      <section class="panel payload ${cls}">
        <div class="pl-bar"><span style="width:${Math.min(100, pct * 100)}%"></span><i style="left:${Math.min(100, c.empty / c.max * 100)}%"></i></div>
        <p class="pl-big">${c.left >= 0 ? `Noch <b>${kg(c.left)}</b> frei` : `<b>${kg(-c.left)} zu schwer!</b>`}</p>
        <p class="sub">Leergewicht ${kg(c.empty)} + Zuladung ${kg(c.load)} = ${kg(c.total)} von ${kg(c.max)} (${Math.round(pct * 100)} %)</p>
        ${cls === 'over' ? '<p class="warn">Überladen kostet Bußgeld, verlängert den Bremsweg und kann die Versicherung kosten. Etwas zu Hause lassen oder Wasser erst am Platz tanken.</p>'
          : cls === 'tight' ? '<p class="warn soft">Knapp! Wiegt euch im Zweifel auf einer Fahrzeugwaage (Wertstoffhof, Landhandel, Prüfstelle).</p>' : ''}
      </section>
      <section class="panel">
        <h2>Personen</h2>
        <ul class="pl-list">${c.people.map(p => `<li><span>${esc(p.name)}</span>${inp('zl-person', p.id, p.kg)}<small>kg</small></li>`).join('')}</ul>
        <label class="check"><input type="checkbox" data-action="zl-driver"${c.driver ? ' checked' : ''}><span>Fahrer (75 kg) steckt schon im Leergewicht fahrbereit</span></label>
      </section>
      <section class="panel">
        <h2>Wasser und Gas</h2>
        <ul class="pl-list">
          <li><span>Frischwasser</span><b>${kg(c.waterKg)}</b><small></small></li>
          <li><span>Gas (Flasche oder Kartuschen)</span>${inp('zl-gas', 'gas', c.d.gas)}<small>kg</small></li>
        </ul>
        <label class="check"><input type="checkbox" data-action="zl-water"${c.d.waterFull === false ? '' : ' checked'}><span>Mit vollem Wassertank rechnen (${c.w.cap} l)</span></label>
      </section>
      ${c.boxes.length ? `<section class="panel"><h2>Boxen und Fächer</h2>
        <ul class="pl-list">${c.boxes.map(b => `<li><span>${esc(b.name)}</span>${inp('zl-box', b.id, b.kg)}<small>kg</small></li>`).join('')}</ul></section>` : ''}
      <section class="panel"><h2>Weitere Posten</h2>
        <ul class="pl-list">${c.extras.map((x, i) => `<li><label class="check"><input type="checkbox" data-action="zl-extra-on" data-i="${i}"${x.on !== false ? ' checked' : ''}><span>${esc(x.name)}</span></label>
          ${inp('zl-extra', String(i), x.kg)}<small>kg</small><button class="icon-btn small" data-action="zl-extra-del" data-i="${i}" aria-label="Entfernen">${icon('close')}</button></li>`).join('')}</ul>
        <div class="chips wrap">${PRESETS.filter(([n]) => !c.extras.some(x => x.name === n)).map(([n, w]) => `<button class="chip" data-action="zl-extra-add" data-n="${esc(n)}" data-w="${w}">${icon('plus')}${esc(n)}</button>`).join('')}</div>
        <div class="adder"><input id="zlName" placeholder="Eigener Posten, z. B. Kajak"><button class="ghost" data-action="zl-extra-add">${icon('plus')}</button></div>
      </section>
      <p class="sub">Schätzwerte. Genau weiß man es nur auf der Waage. Achslasten (Fahrzeugschein 8.1 und 8.2) nicht vergessen, besonders mit Fahrrädern hinten.</p>`;
  };

  // Nach dem Speichern zeichnet die Seite neu: das zuletzt angetippte Feld wieder in den Fokus holen
  let focusKey = null;
  const sel = el => `input[data-action="${el.dataset.action}"]${el.dataset.k != null ? `[data-k="${el.dataset.k}"]` : el.dataset.i != null ? `[data-i="${el.dataset.i}"]` : ''}`;
  document.addEventListener('focusin', ev => { const el = ev.target; if (el.tagName === 'INPUT' && (el.dataset.action || '').startsWith('zl-')) focusKey = sel(el); });
  const refocus = () => setTimeout(() => {
    if (!focusKey || document.activeElement !== document.body) return;
    const el = document.querySelector(focusKey);
    if (el) { el.focus(); if (el.select && el.type !== 'checkbox') el.select(); }
  }, 60);
  const patch = p => { save('meta', { ...doc(), ...p }); refocus(); };
  const mapSet = (k, id, v) => patch({ [k]: { ...(doc()[k] || {}), [id]: num(v) } });
  CHANGES['zl-person'] = el => mapSet('people', el.dataset.k, el.value);
  CHANGES['zl-box'] = el => mapSet('boxes', el.dataset.k, el.value);
  CHANGES['zl-gas'] = el => patch({ gas: num(el.value) });
  CHANGES['zl-driver'] = el => patch({ driverIn: el.checked });
  CHANGES['zl-water'] = el => patch({ waterFull: el.checked });
  CHANGES['zl-extra'] = el => { const ex = (doc().extras || []).slice(); ex[+el.dataset.k] = { ...ex[+el.dataset.k], kg: num(el.value) }; patch({ extras: ex }); };
  CHANGES['zl-extra-on'] = el => { const ex = (doc().extras || []).slice(); ex[+el.dataset.i] = { ...ex[+el.dataset.i], on: el.checked }; patch({ extras: ex }); };
  ACTIONS['zl-extra-del'] = el => patch({ extras: (doc().extras || []).filter((_, i) => i !== +el.dataset.i) });
  ACTIONS['zl-extra-add'] = el => {
    const name = el.dataset.n || (document.getElementById('zlName') || {}).value?.trim();
    if (!name) return;
    patch({ extras: [...(doc().extras || []), { name, kg: num(el.dataset.w || 0), on: true }] });
  };
  ACTIONS['zl-vehicle'] = () => go('fahrzeug');

  // Im Fahrzeug-Steckbrief: Link zum Rechner
  const fahrzeug = VIEWS.fahrzeug;
  VIEWS.fahrzeug = () => fahrzeug().replace('<section class="panel">\n        <div class="toolbar"><h2>Fristen</h2>',
    `<div class="btnrow"><button class="ghost" data-action="zl-open">Zuladung berechnen</button></div><section class="panel">\n        <div class="toolbar"><h2>Fristen</h2>`);
  ACTIONS['zl-open'] = () => go('zuladung');
}
