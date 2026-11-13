const { chromium } = require('playwright');
const URL = 'http://localhost:8766/'; const errs = []; const log = (...a) => console.log(...a);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const rnd = Math.random().toString(36).slice(2, 6);
(async () => {
  const b = await chromium.launch();
  const mk = async () => {
    const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE' });
    await ctx.addInitScript(() => { localStorage.setItem('lp.nointro', 'true'); localStorage.setItem('lp.setOpenAll', 'true'); });
    const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    return p;
  };
  const go = async (p, h) => { await p.evaluate(h => { location.hash = h; window.scrollTo(0, 0); }, h); await p.waitForTimeout(900); };
  const stamps = async p => { while (await p.$('.stamp-pop')) { await p.click('.stamp-pop [data-sp]'); await p.waitForTimeout(150); } };
  const login = async (p, l, pw) => { await p.goto(URL); await p.waitForSelector('form[data-form=login]'); await p.fill('[name=login]', l); await p.fill('[name=password]', pw);
    await p.click('form[data-form=login] button'); await p.waitForTimeout(2500); await stamps(p); };
  const api = (p, a, body, q = '') => p.evaluate(async ([a, body, q]) => { const r = await fetch(`api/?a=${a}${q}`, body === undefined ? { headers: { 'X-Lammping': '1' } } : { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { s: r.status, j: await r.json().catch(() => null) }; }, [a, body, q]);

  // 1. Tobi: Verwaltung als Super-Admin
  const t = await mk(); await login(t, 'tobi', 'segeln1');
  log('tobi superAdmin/isAdmin:', await t.evaluate(() => 0) , (await api(t, 'me')).j.user && JSON.stringify((({ superAdmin, isAdmin, canFound, canCash }) => ({ superAdmin, isAdmin, canFound, canCash }))((await api(t, 'me')).j.user)));
  await go(t, '#/verwaltung'); await t.waitForTimeout(800);
  log('Verwaltung Kopf:', await t.$eval('.page-head, h1', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '?'));
  await t.screenshot({ path: __dirname + '/shots55/verwaltung-tobi.png', fullPage: true });
  // Einladung
  await t.click('[data-action=invite-new] >> nth=0'); await t.waitForTimeout(900);
  const html = await t.$eval('#sheet', x => x.innerHTML);
  const token = (html.match(/invite=([0-9a-f]{32})/) || [])[1];
  log('Einladung Token:', !!token, 'QR:', /<svg/.test(html));
  await t.screenshot({ path: __dirname + '/shots55/einladung.png' });
  await t.click('#sheet [data-action=close]').catch(() => {}); await t.waitForTimeout(300);

  // 2. Neuer Gast über den Link
  const g = await mk(); await g.goto(URL + '?invite=' + token); await g.waitForTimeout(1500);
  log('Einladungsseite:', await g.$eval('.login h2', x => x.textContent).catch(() => 'fehlt'));
  await g.screenshot({ path: __dirname + '/shots55/einladung-gast.png' });
  await g.fill('form[data-form=invite-join] [name=name]', 'Gast ' + rnd); await g.fill('form[data-form=invite-join] [name=login]', 'gast' + rnd);
  await g.fill('form[data-form=invite-join] [name=password]', 'geheim1'); await g.click('form[data-form=invite-join] button'); await g.waitForTimeout(3000); await stamps(g);
  log('Gast nach Beitritt:', await g.evaluate(() => location.href.replace(location.origin, '')), 'Crew-Titel:', await g.$eval('.crew-name, header', x => x.innerText.slice(0, 60).replace(/\s+/g, ' ')).catch(() => '?'));
  const gm = (await api(g, 'me')).j;
  log('Gast Rolle:', JSON.stringify({ isAdmin: gm.user.isAdmin, superAdmin: gm.user.superAdmin, canFound: gm.user.canFound, crews: gm.crews.map(c => [c.name, c.leader]) }));
  await go(g, '#/einstellungen'); log('Gast sieht Verwaltung-Knopf:', await g.$$eval('[href="#/verwaltung"], [data-route=verwaltung]', l => l.length));
  log('Gast admin-API:', (await api(g, 'admin')).s);
  await go(g, '#/dokumente'); log('Gast Dokumente-Abschnitt:', await g.$$eval('[data-action=doc-form]', l => l.length));

  // 3. Franz mit „darf Crews gründen“ anlegen (Tobi), Franz gründet eigene Crew
  const crewId = await t.evaluate(() => localStorage.getItem('lp.crew')).catch(() => null);
  const fr = await api(t, 'user-save', { name: 'Franz ' + rnd, login: 'franz' + rnd, password: 'geheim1', canCash: true, canFound: true, isAdmin: false, joinCrew: JSON.parse(crewId || 'null'), shares: false });
  log('Franz angelegt:', fr.s, fr.j && fr.j.error);
  const f = await mk(); await login(f, 'franz' + rnd, 'geheim1');
  await go(f, '#/verwaltung'); await f.waitForTimeout(800);
  await f.screenshot({ path: __dirname + '/shots55/verwaltung-franz.png', fullPage: true });
  log('Franz Verwaltung Untertitel:', await f.$eval('.page-head', x => x.innerText.replace(/\s+/g, ' ')).catch(() => '?'));
  await f.click('[data-action=crew-form]:not([data-id])'); await f.waitForTimeout(400);
  await f.fill('form[data-form=crew] [name=name]', 'Familie Franz ' + rnd); await f.click('form[data-form=crew] .primary'); await f.waitForTimeout(1200);
  const fa = (await api(f, 'admin')).j;
  log('Franz Crews:', JSON.stringify(fa.crews.map(c => [c.name, c.leader ? 'Leiter' : c.foreign ? 'fremd' : '-'])));
  // Tobi sieht fremde Crew nur mit Name/Zahl
  const ta = (await api(t, 'admin')).j;
  const foreign = ta.crews.filter(c => c.foreign);
  log('Tobi fremde Crews:', JSON.stringify(foreign));
  await go(t, '#/einstellungen'); await go(t, '#/verwaltung'); await t.evaluate(() => 0);
  await t.click('[data-action=admin-reload]').catch(() => {});
  await t.screenshot({ path: __dirname + '/shots55/verwaltung-tobi2.png', fullPage: true });
  // Tobi kommt nicht in Franz' Crew
  const fc = fa.crews.find(c => c.leader);
  log('Tobi sync fremde Crew:', (await api(t, 'sync', undefined, `&crew=${fc.id}&since=0`)).s);
  // Franz (Leiter) legt ein Kind in seiner Crew an
  const kid = await api(f, 'user-save', { name: 'Kind ' + rnd, login: 'kind' + rnd, password: 'geheim1', canCash: false, joinCrew: fc.id, shares: false });
  log('Leiter legt Konto an:', kid.s, kid.j && kid.j.error);
  const kid2 = await api(f, 'user-save', { name: 'X', login: 'x' + rnd, password: 'geheim1', canCash: false, joinCrew: JSON.parse(crewId), shares: false });
  log('Leiter in fremder Crew anlegen (soll 403):', kid2.s, kid2.j && kid2.j.error);
  const sa = await api(f, 'user-save', { name: 'Y', login: 'y' + rnd, password: 'geheim1', isAdmin: true, joinCrew: fc.id });
  log('Leiter macht Super-Admin:', sa.s, (await api(t, 'admin')).j.users.find(u => u.login === 'y' + rnd)?.isAdmin);

  // 4. Login-und-beitreten: Franz per Einladung in Tobis zweite Crew? -> neue Einladung in Franz' Crew für Gast
  const inv2 = (await api(f, 'invite-create', { crew: fc.id })).j;
  const g2 = await mk(); await g2.goto(URL + '?invite=' + inv2.token); await g2.waitForTimeout(1500);
  await g2.click('[data-action=invite-mode][data-have="1"]'); await g2.waitForTimeout(300);
  await g2.fill('form[data-form=invite-login] [name=login]', 'gast' + rnd); await g2.fill('form[data-form=invite-login] [name=password]', 'geheim1');
  await g2.click('form[data-form=invite-login] button'); await g2.waitForTimeout(3000); await stamps(g2);
  log('Gast Crews nach Login+Beitritt:', JSON.stringify((await api(g2, 'me')).j.crews.map(c => c.name)));

  // 5. PDFs (Tobi)
  await go(t, '#/ideen'); const ib = await t.$('[data-action=idea-open]');
  if (ib) {
    await ib.click(); await t.waitForTimeout(500);
    await t.setInputFiles('#sheet [data-action=idea-pdf]', { name: 'Prospekt Schottland.pdf', mimeType: 'application/pdf', buffer: PDF }); await t.waitForTimeout(2000);
    log('Idee PDF-Chip:', await t.$$eval('#sheet .pdf-chip', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
    await t.screenshot({ path: __dirname + '/shots55/idee-pdf.png' });
    const href = await t.$eval('#sheet .pdf-chip a', a => a.href);
    const r = await t.evaluate(async h => { const r = await fetch(h); return [r.status, r.headers.get('content-type'), (await r.text()).slice(0, 5)]; }, href);
    log('PDF abrufen:', JSON.stringify(r));
    // Gast in Tobis Crew darf es auch sehen
    const rg = await g.evaluate(async h => (await fetch(h)).status, href);
    log('Gast liest Ideen-PDF:', rg);
    await t.click('#sheet [data-action=close]').catch(() => {});
  } else log('keine Idee vorhanden');
  // Ticket
  await t.screenshot({ path: __dirname + '/shots55/vor-tickets.png' });
  await stamps(t); await t.evaluate(() => { const d = document.querySelector('#sheet'); if (d && d.open) d.close(); });
  await go(t, '#/tickets'); await t.click('[data-action=ticket-form]'); await t.waitForTimeout(400);
  await t.fill('form[data-form=ticket] [name=title]', 'Fähre Test ' + rnd);
  await t.setInputFiles('#sheet [data-action=ticket-pdf]', { name: 'Buchung.pdf', mimeType: 'application/pdf', buffer: PDF }); await t.waitForTimeout(2000);
  log('Ticket-Form PDF:', await t.$$eval('#tkPdfs .pdf-chip', l => l.length));
  await t.screenshot({ path: __dirname + '/shots55/ticket-form.png' });
  await t.click('form[data-form=ticket] .sheet-foot .primary'); await t.waitForTimeout(800);
  await t.click(`[data-action=ticket-view] >> text=Fähre Test ${rnd}`); await t.waitForTimeout(500);
  log('Ticket-Ansicht PDF:', await t.$$eval('#sheet .pdf-chip', l => l.map(x => x.innerText.replace(/\s+/g, ' '))));
  await t.screenshot({ path: __dirname + '/shots55/ticket-view.png' });
  await t.click('#sheet [data-action=ticket-del]'); await t.waitForTimeout(600);
  // Dokument
  await go(t, '#/dokumente'); await t.click('[data-action=doc-form]'); await t.waitForTimeout(400);
  await t.fill('form[data-form=doc] [name=title]', 'Versicherung ' + rnd);
  await t.setInputFiles('#sheet [data-action=doc-pdfs]', { name: 'Police.pdf', mimeType: 'application/pdf', buffer: PDF }); await t.waitForTimeout(2000);
  const dhref = await t.$eval('#docPdfs .pdf-chip a', a => a.href).catch(() => null);
  log('Dokument-PDF id doc-:', /id=doc-/.test(dhref || ''));
  await t.click('form[data-form=doc] .sheet-foot .primary'); await t.waitForTimeout(800);
  log('Gast liest Dokument-PDF (soll 403):', await g.evaluate(async h => (await fetch(h)).status, dhref));
  await t.waitForTimeout(1500);
  log('Gast sieht doc-Datei im Abgleich:', await g.evaluate(async () => { const c = JSON.parse(localStorage.getItem('lp.crew')); const r = await fetch(`api/?a=sync&crew=${c}&since=0`, { headers: { 'X-Lammping': '1' } }); const j = await r.json(); return j.docs.filter(d => d.coll === 'files' && d.id.startsWith('doc-')).length; }));
  // Kein PDF
  const bad = await t.evaluate(async () => { const c = JSON.parse(localStorage.getItem('lp.crew')); const r = await fetch(`api/?a=file&crew=${c}&id=abc123`, { method: 'POST', headers: { 'X-Lammping': '1', 'Content-Type': 'application/pdf' }, body: 'hallo' }); return [r.status, (await r.json()).error]; });
  log('Kein PDF:', JSON.stringify(bad));
  // aufräumen: Dokument löschen
  await t.click(`[data-action=doc-view] >> text=Versicherung ${rnd}`); await t.waitForTimeout(400);
  await t.click('#sheet [data-action=doc-form]'); await t.waitForTimeout(400); await t.click('#sheet [data-action=del-doc]'); await t.waitForTimeout(600);
  log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
