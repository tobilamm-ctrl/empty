// WiB 7, LB 2 – Stunde 7: Zugangserkundung vorbereiten I
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;
const DIR=ROOT+'/07_Stunde_Erkundung_vorbereiten';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 7';
const GR='1F6E43';

// M1 Einladung (Folie, vom Betrieb – Platzhalter ausfüllen)
save(doc([table([15300],[[cell([P('**[Name des Betriebs]**',{size:40,color:GR,after:0}),P('[Straße, Ort] · [Ansprechpartner/-in]',{size:22,color:'7A8A80',after:200}),
  P('Liebe Klasse 7[ ],',{size:30,after:160}),
  P('wir freuen uns, dass ihr uns am **[Datum]** besuchen wollt! Ihr dürft als **Betriebsdetektive** einen Blick hinter die Kulissen werfen.',{size:30,after:160}),
  P('Schaut euch genau an, **was** bei uns gearbeitet wird, **womit**, **unter welchen Bedingungen** und was man **können** muss. Und fragt uns gern, **wie man bei uns eine Ausbildung machen kann**.',{size:30,after:160}),
  P('Wir sind gespannt auf eure Fragen!',{size:30,after:120}),P('Viele Grüße',{size:30,after:0}),P('[Name], [Funktion, z. B. Ausbilder/-in]',{size:30,after:0})],15300,{bc:GR,bs:16,m:360})]])],{landscape:true,margin:600}),`${DIR}/M1_Folie_Einladung_Betrieb.docx`);

// M2 Fragekarten (Fragen-Werkstatt)
const TH=[['Tätigkeiten','Was wird an diesem Arbeitsplatz gemacht?','1F4E9E'],['Arbeitsort und Arbeitsmittel','Wo und womit wird gearbeitet?','0F6E6E'],['Arbeitsbedingungen','Arbeitszeiten, Belastungen, Schutzkleidung …','C75B12'],
 ['Anforderungen','Was muss man können? Welcher Schulabschluss?','7A5BA8'],['Ausbildung im Betrieb','Welche Berufe? Wie lange? Berufsschule? Vergütung? Praktikum?','A4243B']];
{const ch=[P('**M2 Fragen-Werkstatt** – jede Gruppe bekommt ein Thema und schreibt drei offene Fragen auf.',{size:20,after:120})];
 TH.forEach((t,i)=>{ch.push(table([10466],[[cell([P(`**Gruppe ${i+1}: ${t[0]}**`,{size:26,color:'FFFFFF',after:0}),P(t[1],{size:20,color:'FFFFFF',after:0})],10466,{fill:t[2],bc:t[2]})],
   [cell([1,2,3].map(n=>P(`**Frage ${n}:** ______________________________________________________________`,{size:20,after:60})),10466,{bc:t[2],bs:8})]]));ch.push(P('',{after:120}));});
 save(doc(ch,{margin:650}),`${DIR}/M2_Fragekarten.docx`);}

// M3 Erkundungsbogen (fertig, mit Fragevorschlägen)
{const sec=(t,c,qs)=>[table([10466],[[cell(P(`**${t}**`,{size:24,color:'FFFFFF',after:0}),10466,{fill:c,bc:c})]]),
   ...qs.flatMap(q=>[P(q,{size:20,before:80,after:0}),line(10400)]),P('',{after:120})];
 save(doc([P('**M3 Erkundungsbogen: Wir erkunden einen Betrieb**',{size:30,color:GR,after:40}),
  P('Betrieb: ______________________________   Datum: ____________   Gruppe: ____________________',{size:20,after:60}),
  P('Erkundeter Arbeitsplatz / Beruf: _____________________________________________',{size:20,after:160}),
  ...sec('1  Tätigkeiten','1F4E9E',['Was sind Ihre wichtigsten Aufgaben an einem normalen Arbeitstag?','Welche Tätigkeit machen Sie am liebsten, welche nicht so gern?']),
  ...sec('2  Arbeitsort und Arbeitsmittel','0F6E6E',['Wo arbeiten Sie hauptsächlich (Raum, draußen, unterwegs)?','Mit welchen Werkzeugen, Maschinen oder Geräten arbeiten Sie?']),
  ...sec('3  Arbeitsbedingungen','C75B12',['Wie sind Ihre Arbeitszeiten (Schicht, Wochenende)?','Was ist an Ihrer Arbeit anstrengend? Müssen Sie Schutzkleidung tragen?']),
  ...sec('4  Anforderungen','7A5BA8',['Welche Fähigkeiten braucht man für diesen Beruf?','Welcher Schulabschluss wird erwartet?']),
  ...sec('5  Ausbildung im Betrieb','A4243B',['Welche Berufe kann man bei Ihnen lernen? Wie lange dauert die Ausbildung?','Wie oft sind Azubis in der Berufsschule? Wie viel verdient man in der Ausbildung?','Kann man bei Ihnen ein Praktikum machen? Wie bewirbt man sich?']),
  ...sec('6  Unsere eigenen Fragen','1F6E43',['','']),
  P('**Beobachtung:** Das ist mir besonders aufgefallen:',{size:20,before:60,after:0}),line(10400),line(10400)],{kopf:KOPF+' · M3 Erkundungsbogen',margin:650}),`${DIR}/M3_Erkundungsbogen.docx`);}

// M4 Rollenkarten
const RO=[['Interviewer/-in','stellt die Fragen vom Erkundungsbogen, fragt nach, wenn etwas unklar ist.'],['Protokollant/-in','schreibt die Antworten in Stichpunkten mit.'],['Fotograf/-in','macht Fotos – **nur mit Erlaubnis** und ohne Gesichter, wenn das nicht erlaubt ist.'],
 ['Beobachter/-in','achtet auf Arbeitsmittel, Geräusche, Gerüche, Schutzkleidung und notiert sie.'],['Zeitwächter/-in','achtet darauf, dass alle Fragen gestellt werden und die Zeit reicht.'],['Dankeschön-Sprecher/-in','begrüßt die Gesprächspartner und bedankt sich am Ende für die Gruppe.']];
{const cw=5233,rows=[];for(let i=0;i<6;i+=2) rows.push([0,1].map(j=>cell([P(`**${RO[i+j][0]}**`,{size:30,color:GR,align:AlignmentType.CENTER,after:80}),P(RO[i+j][1],{size:22,align:AlignmentType.CENTER,after:0})],cw,{bc:GR,bs:8,valign:VerticalAlign.CENTER})));
 save(doc([P('**M4 Rollenkarten** – ausschneiden, jede Gruppe verteilt die Rollen',{size:18,color:'7A8A80',after:100}),table([cw,cw],rows,{height:()=>3000})],{margin:600}),`${DIR}/M4_Rollenkarten.docx`);}

// M5 Benimm-Ampel (Sortierkarten) + Lösung
const BE=[['pünktlich am Treffpunkt sein','g'],['das Handy auf lautlos stellen und wegstecken','g'],['Fragen höflich stellen und zuhören','g'],['Maschinen nur anfassen, wenn es erlaubt ist','g'],['Schutzkleidung tragen, wenn man sie bekommt','g'],['sich am Ende bedanken','g'],
 ['Kaugummi kauen','r'],['Mitarbeitern ins Wort fallen','r'],['allein durch den Betrieb laufen','r'],['ohne zu fragen Fotos machen','r'],['über Mitarbeiter lachen','r'],['laut mit Freunden quatschen','r']];
function m5(l){const cw=3488,rows=[];for(let i=0;i<12;i+=3) rows.push([0,1,2].map(j=>{const b=BE[i+j];return cell(P(b[0],{size:22,align:AlignmentType.CENTER,after:0,bold:true,color:l?(b[1]==='g'?'2E7D32':'C62828'):undefined}),cw,{bc:'9DB8A8',bs:6,fill:l?(b[1]==='g'?'E3F2E5':'FBE3E3'):undefined,valign:VerticalAlign.CENTER});}));
 return doc([P(`**M5 Benimm-Ampel: So verhalten wir uns im Betrieb**${l?' – Lösung':''}`,{size:28,color:GR,after:60}),
  P(l?'grün = so machen wir es · rot = das geht gar nicht':'Schneidet die Karten aus und sortiert sie zu zweit: **grün** = so machen wir es · **rot** = das geht gar nicht. Formuliert danach aus jeder roten Karte eine Regel.',{size:20,after:140}),
  table([cw,cw,cw],rows,{height:()=>1500})],{margin:650});}
save(m5(false),`${DIR}/M5_Benimm-Ampel.docx`);save(m5(true),`${DIR}/M5_Loesung_Benimm-Ampel.docx`);

// M6 Elternbrief (Vorlage für die Lehrkraft)
save(doc([P('[Schule] · [Adresse]',{size:20,color:'7A8A80',after:200}),P('**Elterninformation: Betriebserkundung der Klasse 7[ ]**',{size:26,after:200}),
  P('Liebe Eltern und Erziehungsberechtigte,',{size:22}),
  P('im Fach Wirtschaft und Beruf beschäftigen wir uns mit dem Thema „Arbeit“. Als Höhepunkt erkunden wir einen Betrieb in der Nähe. Ihr Kind lernt dabei einen Arbeitsplatz und die Ausbildungsmöglichkeiten im Betrieb kennen.',{size:22}),
  table([2800,7666],[['Betrieb','[Name, Adresse]'],['Datum','[Wochentag, Datum]'],['Treffpunkt / Zeit','[z. B. 8:00 Uhr am Schultor]'],['Rückkehr','[z. B. 9:30 Uhr, danach regulärer Unterricht]'],['Weg','[zu Fuß / Bus]'],['Bitte mitbringen','festes Schuhwerk, Schreibzeug, ggf. Busfahrkarte']].map(([a,b])=>[cell(P(`**${a}**`,{size:21,after:0}),2800,{fill:'F2F5F3'}),cell(P(b,{size:21,after:0}),7666)])),
  P('',{after:120}),P('Bei der Erkundung werden ggf. Fotos für die Auswertung im Unterricht gemacht. Fotos, auf denen Ihr Kind erkennbar ist, verwenden wir nur mit Ihrer Einwilligung.',{size:22}),
  P('Mit freundlichen Grüßen',{size:22,before:120}),P('[Name der Lehrkraft]',{size:22,after:300}),
  P('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',{size:18,color:'9AA4AE',align:AlignmentType.CENTER,after:200}),
  P('Ich habe die Information zur Betriebserkundung am [Datum] erhalten.   Name des Kindes: ______________________',{size:21,after:120}),
  P('☐ Mein Kind darf auf Fotos zu sehen sein (nur für den Unterricht).     ☐ Mein Kind darf nicht fotografiert werden.',{size:21,after:240}),
  P('Ort, Datum, Unterschrift: _________________________________________',{size:21})],{font:'Calibri',margin:900}),`${DIR}/M6_Elternbrief_Vorlage.docx`);

// Tafelbild / Hefteintrag
U.eintraege(DIR,KOPF,'Wir erkunden einen Betrieb',mode=>{
  const cs=[3488,3488,3490];
  const box=(t,inh,c,f)=>cell([P(`**${t}**`,{size:22,color:c,align:AlignmentType.CENTER,after:60}),...inh.map(x=>P(x,{size:20,after:30,bullet:true}))],3488,{fill:f,bc:c,bs:8});
  return [P('**Ziel:** Wir lernen einen [[Arbeitsplatz]] und die [[Ausbildung]] in einem Betrieb kennen. Das nennt man **Zugangserkundung**.',{after:120,line:340}),
   table(cs,[[box('vorher',['Erkundungsbogen mit [[offenen]] Fragen erstellen','[[Rollen]] verteilen','Regeln besprechen'],'1F4E9E','EAF0FA'),
     box('während',['beobachten und fragen','[[mitschreiben]]','Fotos nur mit [[Erlaubnis]]'],'C75B12','FBE7DA'),
     box('nachher',['Ergebnisse auswerten','Plakat oder Präsentation','[[bedanken]] (Dankesbrief)'],'2E7D32','E6F3E7')]]),
   P('',{after:60}),P('**Unsere Regeln:**',{after:40}),
   ...(mode==='luecke'?[line(10400),line(10400),line(10400)]:['pünktlich sein, Handy lautlos','höflich fragen und zuhören','Maschinen nur mit Erlaubnis anfassen, in der Gruppe bleiben'].map(t=>P(t,{bullet:true,after:40}))),
   P('**Meine Rolle:** ______________________   **Betrieb:** ______________________________',{before:160})];
},'Arbeitsplatz · Ausbildung · bedanken · Erlaubnis · mitschreiben · offenen · Rollen');

save(U.entwurf({nr:7,titel:'Wir erkunden einen Betrieb – Vorbereitung I',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Inhalt laut LehrplanPLUS: Zugangserkundung; Schwerpunkt Ausbildung im erkundeten Betrieb',
 leitfrage:'Wie bereiten wir eine Betriebserkundung vor?',
 grob:'Die Schülerinnen und Schüler bereiten eine Zugangserkundung zunehmend selbstständig vor, indem sie Fragen zu den Arbeitsplatzmerkmalen und zur Ausbildung entwickeln und Rollen und Regeln festlegen.',
 fein:['formulieren offene Fragen zu einem Arbeitsplatzmerkmal bzw. zur Ausbildung.','erstellen gemeinsam einen Erkundungsbogen.','übernehmen eine Rolle für die Erkundung.','begründen Verhaltensregeln für den Betriebsbesuch.'],
 verlauf:[
  ['5′','Einstieg',['**Einladung des Betriebs** (Folie, von L vorher mit echten Daten ausgefüllt): „Ihr seid Betriebsdetektive!“','Klärung: Was ist eine Zugangserkundung? Ziel: Arbeitsplatz und Ausbildung kennenlernen.'],'Plenum','M1 Folie'],
  ['15′','Erarbeitung',['**Fragen-Werkstatt**: Fünf Gruppen erhalten je ein Thema (Tätigkeiten, Arbeitsort/Arbeitsmittel, Arbeitsbedingungen, Anforderungen, Ausbildung im Betrieb) und formulieren je drei offene Fragen.','Die Gruppen lesen ihre besten Fragen vor; L ergänzt den vorbereiteten Erkundungsbogen (M3) um gute Schülerfragen (Feld 6).'],'GA / Plenum','M2 Fragekarten, M3 Erkundungsbogen'],
  ['8′','Erarbeitung II',['**Benimm-Ampel**: Paare sortieren 12 Verhaltenskarten in grün und rot und formulieren aus roten Karten Regeln.'],'PA','M5'],
  ['12′','Organisation und Sicherung',['Regeln an der Tafel festhalten.','Erkundungsgruppen bilden (4–6 S, je ein Arbeitsplatz) und **Rollen** verteilen.','Hefteintrag ausfüllen; Elternbrief austeilen.'],'Plenum / GA','M4 Rollenkarten, 03 Hefteintrag, M6 Elternbrief'],
  ['5′','Abschluss',['**Vorfreude-Barometer**: Daumen-Abfrage: Wie gespannt bist du? Was willst du unbedingt herausfinden? (2–3 S)'],'Plenum','–']],
 hinweise:['Der Erkundungsbogen ist nach den bekannten **Arbeitsplatzmerkmalen** gegliedert und um den im Lehrplan geforderten Schwerpunkt **Ausbildung im Betrieb** ergänzt.',
  'M3 enthält bereits Fragevorschläge, damit die Erkundung auch gelingt, wenn die Fragen-Werkstatt dünn ausfällt. Gute Schülerfragen in Feld 6 aufnehmen oder Vorschläge ersetzen.',
  'Organisatorisches (vorab): Betrieb 3–4 Wochen vorher anfragen (Ansprechpartner, Dauer, Gruppengröße, Fotoerlaubnis, Sicherheitsvorgaben), Schulleitung informieren, Elternbrief zwei Wochen vorher.',
  'Falls kein Betrieb möglich ist: Ausbilder/-in oder Azubi in die Klasse einladen. Erkundungsbogen und Rollen bleiben gleich.'],
 loesungen:['M5: grün: pünktlich, Handy lautlos, höflich fragen, Maschinen nur mit Erlaubnis, Schutzkleidung tragen, bedanken · rot: Kaugummi, ins Wort fallen, allein herumlaufen, ungefragt fotografieren, über Mitarbeiter lachen, laut quatschen',
  'Hefteintrag: Arbeitsplatz · Ausbildung · offenen · Rollen · mitschreiben · Erlaubnis · bedanken'],
 material:['M1 vorher mit den Daten des Betriebs ausfüllen','M2 pro Gruppe die passende Karte','M3 pro S (am Erkundungstag auf Klemmbrett)','M4 pro Gruppe, M5 pro Paar','M6 Elternbrief pro S']}),`${DIR}/01_Entwurf_Stunde_07.docx`);
