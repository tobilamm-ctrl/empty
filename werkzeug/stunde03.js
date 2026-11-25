// WiB 7, LB 2 – Stunde 3: Gelernte und angelernte Arbeit
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;
const DIR=ROOT+'/03_Stunde_Gelernte_und_angelernte_Arbeit';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 3';
const G='2E7D32',A='B26A00';

// M1 Einstiegsfolie
save(doc([P('**Zwei Menschen – eine Küche**',{size:44,color:'1F6E43',align:AlignmentType.CENTER,after:160}),
  table([7650,7650],[[
    cell([img(`${B}/Figur_lena.png`,190,190),P('**Lena, 22**',{size:30,align:AlignmentType.CENTER,after:40,color:'3D6B21'}),
      P('„Ich habe **drei Jahre** gelernt, im Betrieb und in der Berufsschule. Am Ende habe ich die Prüfung zur Köchin bestanden.“',{size:28,align:AlignmentType.CENTER})],7650,{borders:NOB}),
    cell([img(`${B}/S3_Kuechenhilfe.png`,190,190),P('**Max, 19**',{size:30,align:AlignmentType.CENTER,after:40,color:A}),
      P('„Mir hat man **zwei Wochen** lang gezeigt, was ich tun muss: spülen, Kartoffeln schälen, aufräumen.“',{size:28,align:AlignmentType.CENTER})],7650,{borders:NOB})]]),
  P('Beide arbeiten in derselben Küche. **Was ist der Unterschied?**',{size:34,align:AlignmentType.CENTER,before:200})],{landscape:true,margin:600}),`${DIR}/M1_Folie_Zwei_in_einer_Kueche.docx`);

// M2 Fallkarten (Stationen) – je Karte eine Seite A4 zum Aufhängen
const FALL=[
 ['A','Lena, 22','Köchin','Figur_lena.png','3 Jahre Ausbildung im Landgasthof und in der Berufsschule. Abschlussprüfung vor der Industrie- und Handelskammer.','kocht selbstständig, plant Rezepte, bestellt Lebensmittel','ca. 2.400 € im Monat (brutto)','kann Meisterin oder Küchenchefin werden','g'],
 ['B','Max, 19','Küchenhilfe','S3_Kuechenhilfe.png','2 Wochen eingearbeitet. Keine Berufsausbildung.','spült, schält Kartoffeln, putzt Gemüse, räumt auf','Mindestlohn','kaum Aufstieg; im Winter, wenn wenig Gäste kommen, wird er nicht gebraucht','a'],
 ['C','Tim, 23','Kfz-Mechatroniker','Figur_tim.png','3 ½ Jahre Ausbildung in der Werkstatt und in der Berufsschule. Gesellenprüfung vor der Handwerkskammer.','sucht Fehler mit dem Diagnose-Computer, repariert Autos, berät Kunden','ca. 2.700 € im Monat (brutto)','Meister, Werkstattleiter, eigene Werkstatt','g'],
 ['D','Ali, 35','Lagerhelfer im Paketzentrum','S3_Lagerhelfer.png','3 Tage eingearbeitet. Eine Ausbildung hat er nicht gemacht.','sortiert Pakete nach Postleitzahlen, belädt Rollwagen','Mindestlohn','keiner; er hat Angst, dass bald eine Maschine seine Arbeit übernimmt','a'],
 ['E','Selin, 21','Medizinische Fachangestellte','Figur_selin.png','3 Jahre Ausbildung in der Arztpraxis und in der Berufsschule. Abschlussprüfung vor der Ärztekammer.','nimmt Blut ab, schreibt EKGs, rechnet ab, berät Patienten','ca. 2.300 € im Monat (brutto)','Weiterbildung zur Praxismanagerin','g'],
 ['F','Sandra, 41','Aushilfe an der Supermarktkasse','S3_Aushilfe_Kasse.png','An zwei Tagen wurde ihr gezeigt, wie die Kasse funktioniert.','kassiert, füllt Tüten auf, hilft beim Einräumen','Mindestlohn (Minijob)','kaum; sie wird nur bei viel Betrieb eingesetzt','a']];
{
  const ch=[];
  FALL.forEach((f,i)=>{ if(i) ch.push(br());
    ch.push(table([10466],[[cell([P(`**Station ${f[0]}**`,{size:28,color:'FFFFFF',after:0}),P(`**${f[1]} – ${f[2]}**`,{size:44,color:'FFFFFF',after:0})],10466,{fill:'1F6E43',bc:'1F6E43',m:160})]]));
    ch.push(img(`${B}/${f[3]}`,230,230,{before:200,after:200}));
    const row=(k,v)=>[cell(P(`**${k}**`,{size:28,after:0}),3000,{fill:'E6F2EA',valign:VerticalAlign.CENTER}),cell(P(v,{size:28,after:0}),7466,{valign:VerticalAlign.CENTER})];
    ch.push(table([3000,7466],[row('Wie habe ich meinen Beruf gelernt?',f[4]),row('Was mache ich?',f[5]),row('Was verdiene ich?',f[6]),row('Wie geht es weiter?',f[7])],{height:()=>1100}));
  });
  save(doc(ch,{margin:650}),`${DIR}/M2_Stationen_Fallkarten.docx`);
}
// M3 Laufzettel (Tabelle) + Lösung
function laufzettel(l){
  const cs=[900,2400,3166,2000,2000];
  const rows=[['Station','Name und Tätigkeit','Wie lange gelernt? Abschluss?','Lohn','gelernt oder angelernt?'].map((h,i)=>cell(P(`**${h}**`,{size:19,after:0}),cs[i],{fill:'DCEFE3'})),
    ...FALL.map(f=>[cell(P(`**${f[0]}**`,{size:26,align:AlignmentType.CENTER,after:0}),cs[0],{valign:VerticalAlign.CENTER}),
      cell(P(l?`${f[1]}, ${f[2]}`:'',{size:19,after:0}),cs[1]),cell(P(l?f[4]:'',{size:17,after:0}),cs[2]),cell(P(l?f[6]:'',{size:17,after:0}),cs[3]),
      cell(l?[P(f[8]==='g'?'**gelernt**':'**angelernt**',{size:19,after:0,color:f[8]==='g'?G:A})]:[P('☐ gelernt',{size:19,after:60}),P('☐ angelernt',{size:19,after:0})],cs[4],{valign:VerticalAlign.CENTER})])];
  return doc([P(`**M3 Laufzettel: Gelernt oder angelernt?**${l?' – Lösung':''}`,{size:32,color:'1F6E43',after:60}),
    P(l?'':'**Arbeitsauftrag:** Geht zu zweit von Station zu Station. Lest die Fallkarte und tragt die Informationen ein. Entscheidet: gelernt oder angelernt?',{size:20,after:120}),
    table(cs,rows,{height:ri=>ri?1350:0}),
    P('**Vergleicht:** Was fällt euch beim Lohn und bei der Zukunft („Wie geht es weiter?“) auf?',{size:20,before:200,after:0}),
    ...(l?[P('Gelernte Fachkräfte verdienen mehr und haben Aufstiegschancen. Angelernte bekommen meist den Mindestlohn, haben kaum Aufstieg und sind leichter ersetzbar.',{size:20,color:'333333'})]:[line(10400),line(10400)])],{kopf:KOPF+' · M3',margin:650});
}
save(laufzettel(false),`${DIR}/M3_Laufzettel.docx`);save(laufzettel(true),`${DIR}/M3_Loesung_Laufzettel.docx`);

// M4 Ampel-Quiz + Ampelkarten
const AUS=[['Gelernte Arbeit setzt eine abgeschlossene Berufsausbildung voraus.','r'],
 ['Für angelernte Arbeit braucht man eine dreijährige Ausbildung.','f: nur eine kurze Einarbeitung'],
 ['Fachkräfte verdienen meist mehr als Angelernte.','r'],
 ['Angelernte Arbeitskräfte haben die besten Aufstiegschancen.','f: kaum Aufstieg'],
 ['Die Küchenhilfe Max ist ein Beispiel für angelernte Arbeit.','r'],
 ['Eine Ausbildung findet im Betrieb und in der Berufsschule statt.','r'],
 ['Angelernte Arbeitsplätze sind besonders sicher, weil sie jeder machen kann.','f: leicht ersetzbar'],
 ['Auszubildende bekommen schon während der Ausbildung Geld.','r']];
save(U.ampelFolie('Ampel-Quiz: richtig oder falsch?',AUS,false),`${DIR}/M4_Folie_Ampel-Quiz.docx`);
save(U.ampelFolie('Ampel-Quiz: richtig oder falsch?',AUS,true),`${DIR}/M4_Loesung_Ampel-Quiz.docx`);
save(U.ampelKarten(),`${DIR}/M5_Ampelkarten.docx`);

// Tafelbild / Hefteintrag
U.eintraege(DIR,KOPF,'Gelernte und angelernte Arbeit',mode=>{
  const lk=mode==='luecke';const cs=[2400,4033,4033];
  const r=(k,g,a)=>[cell(P(`**${k}**`,{size:20,after:0}),cs[0],{fill:'F2F5F3'}),cell(P(g,{size:20,after:0}),cs[1]),cell(P(a,{size:20,after:0}),cs[2])];
  return [table(cs,[[cell(P('',{after:0}),cs[0],{fill:'F2F5F3'}),cell(P('**gelernte Arbeit** (Fachkraft)',{size:22,color:G,after:0}),cs[1],{fill:'E3F2E5'}),cell(P('**angelernte Arbeit**',{size:22,color:A,after:0}),cs[2],{fill:'FBEBD5'})],
    r('Wie gelernt?','[[Berufsausbildung]] (2–3 ½ Jahre) im Betrieb und in der [[Berufsschule]]','kurze [[Einarbeitung]] (Tage bis Wochen)'),
    r('Abschluss','[[Prüfung]], z. B. Geselle oder Fachkraft','kein Berufsabschluss'),
    r('Tätigkeiten','vielseitig, anspruchsvoll, selbstständig','einfach, oft [[eintönig]]'),
    r('Lohn','[[höher]]','niedrig, oft [[Mindestlohn]]'),
    r('Zukunft','Aufstieg (Meister, Techniker), sicherer Arbeitsplatz','kaum Aufstieg, leicht [[ersetzbar]]'),
    r('Beispiele','Lena (Köchin), Tim, Selin','Max (Küchenhilfe), Ali, Sandra')],{height:()=>560}),
   P('',{after:60}),
   P('**Ungelernte Arbeit:** einfache Tätigkeiten, für die man fast keine Einarbeitung braucht, z. B. Prospekte austragen.',{after:100,line:340}),
   P('**Merke:** Eine [[Berufsausbildung]] dauert länger, lohnt sich aber: Fachkräfte verdienen mehr, haben bessere [[Aufstiegschancen]] und einen sichereren Arbeitsplatz.',{after:100,line:340})];
},'Aufstiegschancen · Berufsausbildung · Berufsschule · Einarbeitung · eintönig · ersetzbar · höher · Mindestlohn · Prüfung');

// Entwurf
save(U.entwurf({nr:3,titel:'Gelernte und angelernte Arbeit',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Inhalt laut LehrplanPLUS: Kategorien von Arbeit (gelernte und angelernte Arbeit)',
 leitfrage:'Brauche ich für jede Arbeit eine Ausbildung?',
 grob:'Die Schülerinnen und Schüler unterscheiden gelernte und angelernte Arbeit und beurteilen Vor- und Nachteile einer Berufsausbildung.',
 fein:['nennen Merkmale gelernter und angelernter Arbeit (Ausbildung, Abschluss, Tätigkeiten, Lohn, Zukunft).','ordnen Fallbeispiele begründet zu.','begründen, warum sich eine Berufsausbildung lohnt.'],
 verlauf:[
  ['5′','Einstieg',['**Folie „Zwei Menschen – eine Küche“**: Lena (Köchin) und Max (Küchenhilfe) stellen sich vor.','Impuls: „Beide arbeiten in derselben Küche. Was ist der Unterschied?“ S vermuten (Ausbildung, Lohn, Aufgaben).','Leitfrage an die Tafel.'],'Plenum','M1 Folie'],
  ['15′','Erarbeitung',['**Stationen-Rallye**: Sechs Fallkarten (A–F) hängen im Raum. Paare gehen von Station zu Station und füllen den Laufzettel aus: Wie gelernt? Lohn? Gelernt oder angelernt?','Wer fertig ist, beantwortet die Vergleichsfrage unten auf dem Laufzettel.'],'PA','M2 Fallkarten (im Raum aufgehängt), M3 Laufzettel'],
  ['10′','Sicherung',['Auswertung im Plenum: Paare nennen ihre Zuordnung mit Begründung.','L entwickelt mit den S die Vergleichstabelle gelernt – angelernt an der Tafel; kurz: ungelernte Arbeit.','S füllen den Lückentext aus.'],'Plenum / EA','Tafel, 03 Hefteintrag'],
  ['10′','Übung',['**Ampel-Quiz**: L zeigt acht Aussagen. S heben die grüne (richtig) oder rote (falsch) Karte. Bei „falsch“ verbessert ein/e S die Aussage.'],'Plenum','M4 Folie, M5 Ampelkarten'],
  ['5′','Abschluss',['**Blitzlicht**: „Würdest du lieber gleich als Aushilfe Geld verdienen oder erst eine Ausbildung machen? Warum?“ (3–4 Meldungen)','Hausaufgabe (optional): Kreuzworträtsel aus dem alten Material.'],'Plenum','ggf. altes Kreuzworträtsel (01-50 / 01-52)']],
 hinweise:['Die Fallkarten greifen bekannte Figuren (Lena, Tim, Selin) auf und stellen ihnen angelernte Arbeitskräfte gegenüber. So wird der Unterschied am selben Arbeitsplatz sichtbar.',
  'Die Stationen-Rallye bringt Bewegung in die Stunde. Bei engen Räumen können die Fallkarten auch als Kartenstapel pro Tisch ausgelegt werden.',
  'Lohnangaben sind gerundete Beispielwerte und dienen nur dem Vergleich.',
  'Die Ampelkarten werden in Stunde 6 und 12 wieder verwendet.'],
 loesungen:['M3: A gelernt · B angelernt · C gelernt · D angelernt · E gelernt · F angelernt (Details siehe M3_Loesung)',
  'M4: 1 richtig · 2 falsch (kurze Einarbeitung) · 3 richtig · 4 falsch (kaum Aufstieg) · 5 richtig · 6 richtig · 7 falsch (leicht ersetzbar) · 8 richtig',
  'Hefteintrag: Berufsausbildung · Berufsschule · Einarbeitung · Prüfung · eintönig · höher · Mindestlohn · ersetzbar · Berufsausbildung · Aufstiegschancen'],
 material:['M1 als Folie / Beamer','M2: Fallkarten A–F je einmal ausdrucken (gern A3) und im Raum aufhängen','M3 pro S','M4 als Folie; M5 Ampelkarten pro S (einmal herstellen, wiederverwendbar)']}),`${DIR}/01_Entwurf_Stunde_03.docx`);
