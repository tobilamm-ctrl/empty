const { chromium } = require('playwright');
const DIR = __dirname;
const URL = 'http://localhost:8766/';
const errs = [];
const log = (...a) => console.log(...a);
const firstLine = e => String((e && e.message) || e).split('\n')[0].slice(0, 160);
const ymdLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

(async () => {
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({
      viewport: { width: 420, height: 880 },
      locale: 'de-DE',
      geolocation: { latitude: 48.7210, longitude: 11.4857, accuracy: 8 },
      permissions: ['geolocation'],
    });
    await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
    // Nominatim: Ortsname Pichl (Gemeinde Manching)
    await ctx.route(/nominatim/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({
      category: 'place', type: 'village', name: 'Pichl',
      address: { village: 'Pichl', municipality: 'Manching', county: 'Landkreis Pfaffenhofen', country_code: 'de' } }) }));
    await ctx.route(/overpass-api/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ elements: [] }) }));
    await ctx.route(/tile\.openstreetmap/, r => r.fulfill({ status: 404, body: '' }));

    const p = await ctx.newPage();
    p.on('dialog', d => d.accept());
    p.on('pageerror', e => errs.push('pageerror ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });

    let crew = null;
    const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1000); };
    const closeSheet = () => p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); }).catch(() => {});
    const clearStamps = async () => {
      for (let i = 0; i < 10 && (await p.$('.stamp-pop')); i++) { await p.click('.stamp-pop [data-sp]').catch(() => {}); await p.waitForTimeout(150); }
    };
    const firstVisible = async sel => {
      const loc = p.locator(sel); const n = await loc.count();
      for (let i = 0; i < n; i++) if (await loc.nth(i).isVisible().catch(() => false)) return loc.nth(i);
      return null;
    };
    const valOf = sel => p.$eval(sel, el => el.value || '(leer)').catch(() => 'fehlt');
    const textOf = async sel => {
      const loc = await firstVisible(sel);
      if (!loc) return 'fehlt';
      return loc.evaluate(e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => 'fehlt');
    };
    const chipsOf = () => p.$$eval('#sheet .title-hints .chip', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim())).catch(() => []);
    const waitFilled = sel => p.waitForFunction(s => { const i = document.querySelector(s); return !!(i && i.value); }, sel, { timeout: 12000 }).then(() => true).catch(() => false);
    const syncDocs = () => p.evaluate(async crew => {
      const r = await fetch(`api/?a=sync&crew=${crew}&since=0`, { headers: { 'X-Lammping': '1' } });
      return (await r.json()).docs;
    }, crew);
    const push = changes => p.evaluate(async ([crew, changes]) => {
      await fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ crew, changes }) });
    }, [crew, changes]);
    const step = async (name, fn) => { try { await fn(); } catch (e) { log(`${name}: fehlt (${firstLine(e)})`); } };
    const openEntryForm = async () => {
      await closeSheet();
      await go('#/tagebuch');
      const btn = await firstVisible('[data-action=entry-form]');
      const viaEval = () => p.evaluate(() => document.querySelector('[data-action=entry-form]')?.click());
      if (btn) await btn.click().catch(viaEval); else await viaEval();
      // Angefangener Entwurf? Verwerfen, damit ein frisches Formular kommt
      await p.waitForTimeout(500);
      if (await p.$('#sheet[open] [data-action=draft-drop]')) { await p.click('#sheet [data-action=draft-drop]'); await p.waitForTimeout(600); }
      await p.waitForSelector('#sheet[open] form[data-form=entry]', { timeout: 8000 });
    };

    // Login
    await p.goto(URL);
    await p.fill('[name=login]', 'tobi');
    await p.fill('[name=password]', 'segeln1');
    await p.click('form[data-form=login] button');
    await p.waitForTimeout(2500);
    await clearStamps();
    crew = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.crew')));
    // Laufende Reise vorab anlegen und wählen (sonst öffnet „+ Eintrag“ das Reise-Formular)
    const today = new Date().toISOString().slice(0, 10);
    await p.evaluate(async ([crew, today]) => fetch('api/?a=push', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ crew, changes: [{ coll: 'trips', id: 't72', data: { id: 't72', name: 'Test 72', start: today, color: '#2E7FB8' } }] }) }), [crew, today]);
    await p.reload(); await p.waitForTimeout(2500); await clearStamps();
    await p.evaluate(() => { location.hash = '#/reisen'; }); await p.waitForTimeout(800);
    await p.click('.trips >> text=Test 72').catch(() => {}); await p.waitForTimeout(800);
    await p.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
    await p.click('[data-action=diary-mode][data-mode=tagebuch]').catch(() => {});

    // 1. Neuer Eintrag ortet automatisch (P1/P15)
    await step('1 Auto-Ort', async () => {
      await openEntryForm();
      const filled = await waitFilled('#sheet form[data-form=entry] [name=lat]');
      await p.waitForTimeout(1000);
      const lat = await valOf('#sheet form[data-form=entry] [name=lat]');
      const lng = await valOf('#sheet form[data-form=entry] [name=lng]');
      const place = await valOf('#sheet form[data-form=entry] [name=place]');
      const chips = await chipsOf();
      const title = await valOf('#sheet form[data-form=entry] [name=title]');
      log('1 lat:', lat, '| lng:', lng, filled ? '' : '(kein Wert nach 12 s)');
      log('1 place:', place, '(erwartet „Manching“)');
      log('1 Vorschlags-Chips:', chips.length ? chips : 'fehlt', '| enthält „Pichl“:', chips.some(c => /Pichl/.test(c)));
      log('1 title:', title);
      await p.screenshot({ path: DIR + '/shots55/p72-eintrag.png' }).catch(e => log('1 Screenshot fehlgeschlagen:', firstLine(e)));
    });

    // 2. Foto-Ort ersetzt GPS-Ort (P1) – im selben Formular
    await step('2 Foto-Ort', async () => {
      // Hinweise mitschreiben (vor dem Foto beginnen)
      await p.evaluate(() => { window.__toasts = []; const t = document.querySelector('#toast, .toast'); if (t) new MutationObserver(() => window.__toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
      await p.setInputFiles('#sheet input[data-action=add-photos]', DIR + '/munch.jpg');
      await p.waitForTimeout(3000);
      log('2 lat nach Foto:', await valOf('#sheet form[data-form=entry] [name=lat]'), '(erwartet ca. 59.90, Oslo)');
      const toasts = await p.$$eval('#toast, .toast', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => []);
      const seen = await p.evaluate(() => window.__toasts || []); toasts.push(...seen);
      log('2 Hinweis:', toasts.length ? toasts : 'fehlt', '| enthält „Ort aus dem Foto“:', toasts.some(t => t.includes('Ort aus dem Foto')));
      await closeSheet();
    });

    // 3. Kamera-Knopf (P17)
    await step('3 Kamera-Knopf', async () => {
      await openEntryForm();
      const n = await p.locator('#sheet input[capture]').count();
      const cap = n ? await p.$eval('#sheet input[capture]', el => el.getAttribute('capture')) : null;
      log('3 #sheet input[capture] gefunden:', n > 0 ? 'ja' : 'nein', n > 0 ? `| capture="${cap}"` : '');
    });

    // 4. Mehr Arten (P18)
    await step('4 Arten', async () => {
      await openEntryForm();
      const visCount = () => p.$$eval('#sheet .type-grid input[name=type]', els => els.filter(e => {
        const s = getComputedStyle(e); const r = e.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      }).length);
      const total = await p.locator('#sheet .type-grid input[name=type]').count();
      log('4 Arten sichtbar vorher:', await visCount(), '(erwartet 9 bzw. ≤ 10) | im DOM:', total);
      const more = await firstVisible('#sheet [data-action=types-more]');
      if (!more) log('4 Knopf types-more: fehlt');
      else { await more.click(); await p.waitForTimeout(600); }
      log('4 Arten sichtbar nach „mehr“:', await visCount(), '(erwartet 22)');
    });

    // 5. „Ich bin hier …“ › Notiz (P4)
    await step('5 Ich bin hier › Notiz', async () => {
      await closeSheet();
      await go('#/karte');
      const menu = await firstVisible('[data-action=here-menu]');
      if (!menu) throw new Error('[data-action=here-menu] nicht sichtbar');
      await menu.click();
      await p.waitForTimeout(500);
      const item = await firstVisible('[data-action=new-here][data-type=notiz]');
      if (!item) throw new Error('[data-action=new-here][data-type=notiz] nicht sichtbar');
      await item.click();
      const filled = await waitFilled('#sheet form[data-form=entry] [name=lat]');
      await p.waitForTimeout(1000);
      const lat = await valOf('#sheet form[data-form=entry] [name=lat]');
      const lng = await valOf('#sheet form[data-form=entry] [name=lng]');
      const place = await valOf('#sheet form[data-form=entry] [name=place]');
      const title = await valOf('#sheet form[data-form=entry] [name=title]');
      const chips = await chipsOf();
      log('5 lat:', lat, '| lng:', lng, filled ? '' : '(kein Wert nach 12 s)');
      log('5 place:', place);
      log('5 title:', title, '| erster Vorschlag:', chips[0] ?? 'fehlt', '| title = erster Vorschlag:', title === chips[0], '| nicht leer:', !!title && title !== '(leer)');
    });

    // 6. Reise-Leiste (P12)
    await step('6 Reise-Leiste', async () => {
      await closeSheet();
      await go('#/tagebuch');
      const tools = await p.$$eval('.trip-tools .tool small', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim())).catch(() => []);
      log('6 Leiste:', tools.length ? tools : 'fehlt');
      const verboten = tools.filter(t => /Aufzeichnen|Straße folgen/.test(t));
      log('6 unerwünschte Texte (Aufzeichnen / Straße folgen):', verboten.length ? verboten : 'keine');
      await p.screenshot({ path: DIR + '/shots55/p72-leiste.png' }).catch(e => log('6 Screenshot fehlgeschlagen:', firstLine(e)));
    });

    // 7. Wetter mit Ort (P2)
    await step('7 Wetter-Ort', async () => {
      const n = await p.locator('section.today .wx-place').count();
      log('7 section.today .wx-place:', n ? await p.$eval('section.today .wx-place', e => e.textContent.replace(/\s+/g, ' ').trim()) : 'fehlt (kein Wetter)');
    });

    // 8. Kennzeichen „nicht im Blog“ (P7) und Sprachnotiz (P14)
    await step('8 Blog-Kennzeichen/Sprachnotiz', async () => {
      await closeSheet();
      const cur0 = await p.evaluate(() => JSON.parse(localStorage.getItem('lp.trip.' + JSON.parse(localStorage.getItem('lp.crew'))) || 'null'));
      const cur = cur0 && typeof cur0 === 'object' ? cur0.id : cur0;
      const tripId = cur || 't72';
      log('8 aktuelle Reise:', cur ? cur : 'keine → Reise t72 wird angelegt');
      const changes = [];
      if (!cur) changes.push({ coll: 'trips', id: 't72', data: { id: 't72', name: 'Test 72', start: ymdLocal(), color: '#2E7FB8' } });
      changes.push({ coll: 'entries', id: 'e72', data: {
        id: 'e72', tripId, type: 'sight', title: 'Blog-Test', date: ymdLocal() + 'T10:00', lat: 48.72, lng: 11.49,
        blogHide: true, photos: [], sounds: [{ id: 'snd72', sec: 42 }] } });
      await push(changes);
      await p.evaluate(async ([crew, tripId]) => {
        await fetch('api/?a=share', { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' },
          body: JSON.stringify({ crew, trip: tripId, on: true }) });
      }, [crew, tripId]);
      await p.reload(); await p.waitForTimeout(3000); await clearStamps();
      if (!cur) {
        await go('#/reisen');
        await p.locator('.trips >> text=Test 72').first().click({ timeout: 5000 }).catch(() => log('8 Reise „Test 72“ anklicken: fehlt'));
        await p.waitForTimeout(800);
      }
      await go('#/tagebuch'); await closeSheet();
      const dm = await firstVisible('[data-action=diary-mode][data-mode=tagebuch]');
      if (dm) await dm.click().catch(() => {});
      await p.waitForTimeout(800);
      log('8 .blog-off:', await textOf('.blog-off'), '(erwartet „nicht im Blog“)');
      log('8 [data-action=snd-play]:', await textOf('[data-action=snd-play]'), '(erwartet 0:42)');
      const off = await firstVisible('.blog-off');
      if (off) { await off.click().catch(e => log('8 Klick auf .blog-off fehlgeschlagen:', firstLine(e))); await p.waitForTimeout(1500); }
      else log('8 .blog-off zum Anklicken: fehlt');
      const docs = await syncDocs();
      const e72 = docs.filter(d => d.coll === 'entries' && d.data && d.data.id === 'e72').pop();
      log('8 blogHide nach Klick:', e72 ? e72.data.blogHide : 'fehlt (e72 nicht gefunden)', '(erwartet false)');
    });

    log('Fehler:', errs.length ? errs : 'keine');
  } finally {
    await b.close().catch(() => {});
  }
})();
