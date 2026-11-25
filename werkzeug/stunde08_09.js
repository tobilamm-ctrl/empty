// WiB 7, LB 2 – Stunde 8: Interview üben · Stunde 9: Erkundung
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;const GR='1F6E43';
// ================= Stunde 8 =================
{const DIR=ROOT+'/08_Stunde_Interview_ueben';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 8';
// M1 Skript „Das schlechteste Interview der Welt“
save(doc([P('**M1 Das schlechteste Interview der Welt** (Skript für Lehrkraft und eine/n S)',{size:28,color:GR,after:120}),
  P('~Spielt das Interview möglichst übertrieben vor. Die Klasse notiert alles, was schiefläuft.~',{size:20,after:160}),
  ...[['Interviewer/-in (kaut, schaut aufs Handy)','Äh, hallo. Ist die Arbeit hier schön?'],['Bäckermeisterin','Ja.'],['Interviewer/-in','Okay. Muss man früh aufstehen?'],['Bäckermeisterin','Ja.'],['Interviewer/-in','Ist das anstrengend?'],['Bäckermeisterin','Manchmal ja, man …'],['Interviewer/-in (unterbricht)','Okay, und verdient man viel?'],['Bäckermeisterin','Na ja, das kommt dar…'],['Interviewer/-in (dreht sich weg)','Cool. Das war’s. Tschüss!']]
   .map(([w,t])=>P(`**${w}:** ${t}`,{size:24,after:80})),
  P('',{after:120}),P('**Was ist schiefgelaufen?**',{size:22,after:0}),line(10400),line(10400),line(10400)],{margin:700}),`${DIR}/M1_Skript_Schlechtes_Interview.docx`);
// M2 Fragen umbauen
const FR=[['Ist die Arbeit schön?','Was gefällt Ihnen an Ihrer Arbeit am besten?'],['Muss man früh aufstehen?','Wann beginnt Ihr Arbeitstag?'],['Ist das anstrengend?','Was ist an Ihrer Arbeit besonders anstrengend?'],['Verdient man viel?','Wie viel verdient man in der Ausbildung?'],['Braucht man Werkzeug?','Mit welchen Werkzeugen und Maschinen arbeiten Sie?'],['Gibt es hier Azubis?','Welche Berufe kann man bei Ihnen lernen?']];
function m2(l){const cs=[4900,5566];
 return doc([P(`**M2 Aus „Ja-Nein-Fragen“ werden offene Fragen**${l?' – Lösungsvorschlag':''}`,{size:28,color:GR,after:60}),
  table([10466],[[cell([P('**Geschlossene Fragen** kann man mit „Ja“ oder „Nein“ beantworten. Man erfährt wenig.',{size:21,after:40}),P('**Offene Fragen** beginnen mit einem **W-Wort**: Was? Wie? Wann? Wo? Warum? Welche? Womit? Man erfährt viel mehr.',{size:21,after:0})],10466,{fill:'F2F8F4',bc:GR})]]),
  P('',{after:100}),
  table(cs,[[cell(P('**geschlossene Frage**',{size:21,color:'C62828',after:0}),cs[0],{fill:'FBE3E3'}),cell(P('**offene Frage**',{size:21,color:'2E7D32',after:0}),cs[1],{fill:'E3F2E5'})],
   ...FR.map(f=>[cell(P(f[0],{size:22,after:0}),cs[0],{valign:VerticalAlign.CENTER}),cell(P(l?f[1]:'',{size:22,after:0}),cs[1],{valign:VerticalAlign.CENTER})])],{height:ri=>ri?900:0}),
  P('**Unsere Interview-Tipps:**',{size:22,before:200,after:0}),...(l?['W-Fragen stellen','zuhören und nachfragen („Können Sie das genauer erklären?“)','Blickkontakt, ausreden lassen','mitschreiben','begrüßen und bedanken'].map(t=>P(t,{bullet:true,size:21,after:20})):[line(10400),line(10400),line(10400)])],{kopf:KOPF+' · M2',margin:650});}
save(m2(false),`${DIR}/M2_Fragen_umbauen.docx`);save(m2(true),`${DIR}/M2_Loesung_Fragen_umbauen.docx`);
// M3 Rollenkarten Interview-Training (Betriebsvertreter)
const BV=[['Herr Özdemir, Ausbilder im Autohaus','Wir bilden Kfz-Mechatroniker aus, 3 ½ Jahre. Berufsschule ist zweimal pro Woche. Im 1. Jahr verdient man ca. 1.000 € im Monat. Arbeitszeit 7:30 bis 16:30 Uhr. Wichtig: Interesse an Technik, Mathe, Zuverlässigkeit. Praktikum in den Ferien möglich.'],
 ['Frau Lang, Bäckermeisterin','Wir bilden Bäcker und Fachverkäufer aus, je 3 Jahre. Der Tag beginnt um 3 Uhr nachts, dafür ist um 11 Uhr Feierabend. Anstrengend: Hitze am Ofen, schwere Mehlsäcke. Wichtig: Sauberkeit, Geschick, Freude an Lebensmitteln. Im 1. Jahr ca. 900 €.'],
 ['Frau Dr. Krüger, Hausärztin mit eigener Praxis','Bei mir lernt man Medizinische/-r Fachangestellte/-r, 3 Jahre. Wichtig: Freundlichkeit, Ordnung, Schweigepflicht, kein Ekel vor Blut. Arbeitszeit bis 18 Uhr, mittwochnachmittags frei. Ich bin selbstständig und habe vier Angestellte.']];
{const ch=[P('**M3 Interview-Training** – Rollenkarten für die Betriebsvertreter/-innen',{size:24,color:GR,after:60}),
  P('In 3er-Gruppen: **Interviewer/-in** (fragt mit dem Erkundungsbogen), **Betriebsvertreter/-in** (antwortet mit der Karte, darf erfinden, was nicht draufsteht), **Beobachter/-in** (füllt M4 aus). Nach 5 Minuten wechseln.',{size:20,after:160})];
 BV.forEach(([n,t])=>{ch.push(table([10466],[[cell([P(`**${n}**`,{size:26,color:'FFFFFF',after:0})],10466,{fill:GR,bc:GR})],[cell(P(t,{size:22,after:0,line:330}),10466,{bc:GR,bs:8,m:180})]]));ch.push(P('✂',{size:18,color:'9AA4AE',align:AlignmentType.CENTER,after:100}));});
 save(doc(ch,{margin:650}),`${DIR}/M3_Rollenkarten_Interview.docx`);}
// M4 Beobachtungsbogen
{const K=['stellt offene W-Fragen','hört zu und fragt nach','lässt ausreden','hält Blickkontakt','schreibt mit','begrüßt und bedankt sich'];
 const bog=()=>table([5233],[[cell([P('**M4 Beobachtungsbogen**',{size:24,color:GR,after:40}),P('Interviewer/-in: ________________',{size:19,after:80}),
   table([3133,700,700,700],[[cell(P('',{after:0}),3133,{fill:'F2F5F3'}),...['😊','😐','☹'].map(x=>cell(P(x,{size:22,align:AlignmentType.CENTER,after:0}),700,{fill:'F2F5F3'}))],...K.map(k=>[cell(P(k,{size:18,after:0}),3133),...[0,1,2].map(()=>cell(P('',{after:0}),700))])]),
   P('**Tipp für das nächste Mal:**',{size:19,before:80,after:0}),line(4900),line(4900)],5233,{bc:'9DB8A8',m:140})]]);
 save(doc([table([5233,5233],[[cell([bog()],5233,{borders:NOB,m:40}),cell([bog()],5233,{borders:NOB,m:40})],[cell([bog()],5233,{borders:NOB,m:40}),cell([bog()],5233,{borders:NOB,m:40})]])],{margin:500}),`${DIR}/M4_Beobachtungsbogen.docx`);}
U.eintraege(DIR,KOPF,'So gelingt ein Interview',mode=>[
  P('**Geschlossene Fragen** kann man mit [[Ja]] oder Nein beantworten. Man erfährt wenig.',{after:100,line:340}),
  P('**Offene Fragen** beginnen mit einem [[W-Wort]] (Was? Wie? Warum? Welche?). Man erfährt viel mehr.',{after:100,line:340}),
  P('Beispiel: ~Ist die Arbeit anstrengend?~ → [[Was]] ist an Ihrer Arbeit besonders anstrengend?',{after:160,line:340}),
  P('**Interview-Tipps:**',{after:40}),
  ...['höflich [[begrüßen]] und sich vorstellen','gut [[zuhören]] und nachfragen','ausreden lassen und Blickkontakt halten','Antworten in Stichpunkten [[mitschreiben]]','am Ende [[bedanken]]'].map(t=>P(t,{bullet:true,after:40,line:320}))],
 'bedanken · begrüßen · Ja · mitschreiben · W-Wort · Was · zuhören');
save(U.entwurf({nr:8,titel:'Wir erkunden einen Betrieb – Vorbereitung II: Interview üben',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Kurzprobe 2 zu Beginn (Stunden 5–6) · Zugangserkundung',
 leitfrage:'Wie stelle ich gute Fragen?',
 grob:'Die Schülerinnen und Schüler unterscheiden offene und geschlossene Fragen und üben ein Interview für die Betriebserkundung.',
 fein:['erkennen Fehler in einem misslungenen Interview.','formulieren geschlossene Fragen in offene W-Fragen um.','führen ein Interview mit dem Erkundungsbogen durch und geben sich kriteriengeleitet Rückmeldung.'],
 verlauf:[
  ['15′','Kurzprobe 2',['Kurzprobe 2 (Warum arbeiten Menschen? Angestellt oder selbstständig?).'],'EA','99_Leistungserhebungen: Kurzprobe 2'],
  ['5′','Einstieg',['**„Das schlechteste Interview der Welt“**: L spielt mit einem/r S (Bäckermeisterin) ein übertrieben schlechtes Interview vor. Die Klasse sammelt Fehler.'],'Plenum','M1 Skript'],
  ['7′','Erarbeitung',['Offene und geschlossene Fragen unterscheiden; PA: sechs Ja-Nein-Fragen in offene Fragen umbauen.','Interview-Tipps sammeln.'],'PA / Plenum','M2'],
  ['15′','Übung',['**Interview-Training** in 3er-Gruppen mit Rollenkarten (Autohaus, Bäckerei, Arztpraxis): Interviewer/-in fragt mit dem Erkundungsbogen, Betriebsvertreter/-in antwortet, Beobachter/-in füllt den Beobachtungsbogen aus. Zwei Wechsel.','Kurze Rückmeldung in der Gruppe.'],'GA','M3, M4, M3 aus Stunde 7 (Erkundungsbogen)'],
  ['3′','Abschluss',['Hefteintrag (Lückentext) und letzte organisatorische Hinweise für den Erkundungstag (Treffpunkt, Elternbriefe einsammeln).'],'EA / Plenum','03 Hefteintrag']],
 hinweise:['Das übertriebene Negativbeispiel ist meist sehr lustig und prägt sich gut ein. Die S formulieren die Interview-Tipps selbst.',
  'Die Rollenkarten enthalten auch Informationen zur Ausbildung, zur Selbstständigkeit (Ärztin) und zu Arbeitsbedingungen. So wiederholt das Training nebenbei bisherige Inhalte.',
  'Wenn die Zeit knapp ist, entfällt der zweite Rollenwechsel.'],
 loesungen:['M1 Fehler: kaut, schaut aufs Handy, keine Begrüßung, nur Ja-Nein-Fragen, unterbricht, fragt nicht nach, schreibt nicht mit, bedankt sich nicht','M2: siehe M2_Loesung','Hefteintrag: Ja · W-Wort · Was · begrüßen · zuhören · mitschreiben · bedanken'],
 material:['Kurzprobe 2 pro S','M1 zweimal (L und S)','M2 pro S','M3 pro Gruppe (Karten zerschneiden), M4 pro Gruppe','Erkundungsbogen aus Stunde 7']}),`${DIR}/01_Entwurf_Stunde_08.docx`);}

// ================= Stunde 9 =================
{const DIR=ROOT+'/09_Stunde_Betriebserkundung';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 9';
// M1 Checkliste Lehrkraft
save(doc([P('**M1 Checkliste Betriebserkundung (Lehrkraft)**',{size:28,color:GR,after:120}),
  ...[['3–4 Wochen vorher',['Betrieb anfragen: Termin, Dauer, Ansprechpartner/-in, Gruppengröße','Arbeitsplätze für die Gruppen klären (z. B. Werkstatt, Verkauf, Büro, Azubi)','Fotoerlaubnis und Sicherheitsvorgaben (Schutzkleidung) erfragen','Schulleitung informieren, ggf. Begleitperson organisieren, Stunde tauschen']],
    ['2 Wochen vorher',['Elternbrief austeilen (Stunde 7), Rücklauf kontrollieren','Weg und Zeitplan festlegen, ggf. Busfahrkarten']],
    ['Am Vortag',['Erkundungsbögen und Klemmbretter bereitlegen','Gruppenliste mit Rollen, Notfallnummern, Klassenliste','Betrieb kurz erinnern']],
    ['Am Erkundungstag',['Treffpunkt, Anwesenheit prüfen, Regeln wiederholen','Begrüßung durch den Betrieb, Gruppen zu den Arbeitsplätzen','Zum Schluss: gemeinsame Fragerunde zur Ausbildung, Dank durch die Dankeschön-Sprecher/-innen']],
    ['Danach',['Dankesbrief der Klasse (M3) schicken','Erkundungsbögen für Stunde 10 einsammeln oder mitnehmen lassen']]]
   .flatMap(([t,l])=>[P(`**${t}**`,{size:22,color:GR,before:100,after:40}),...l.map(x=>P(`☐ ${x}`,{size:21,after:30}))])],{font:'Calibri',margin:800}),`${DIR}/M1_Checkliste_Lehrkraft.docx`);
// M2 Gruppen-Laufzettel am Erkundungstag
save(doc([P('**M2 Unser Erkundungstag – Gruppenkarte**',{size:28,color:GR,after:80}),
  table([3000,7466],[['Gruppe / Arbeitsplatz',''],['Gesprächspartner/-in',''],['Interviewer/-in',''],['Protokollant/-in',''],['Fotograf/-in',''],['Beobachter/-in',''],['Zeitwächter/-in',''],['Dankeschön-Sprecher/-in','']].map(([a])=>[cell(P(`**${a}**`,{size:21,after:0}),3000,{fill:'F2F5F3'}),cell(P('',{after:0}),7466)]),{height:()=>620}),
  P('**Checkliste vor dem Gespräch:** ☐ Erkundungsbogen  ☐ Stift  ☐ Handy lautlos  ☐ Begrüßung überlegt',{size:21,before:200}),
  P('**Unsere Zeitplanung:** Begrüßung ___ min · Fragen ___ min · Rundgang/Beobachten ___ min · Dank ___ min',{size:21,before:120})],{kopf:KOPF+' · M2',margin:700}),`${DIR}/M2_Gruppenkarte.docx`);
// M3 Dankesbrief Vorlage
save(doc([P('Klasse 7[ ] · [Schule] · [Ort, Datum]',{size:22,color:'7A8A80',after:300}),P('Liebe/r [Name],',{size:26,after:200}),
  P('vielen Dank, dass wir Ihren Betrieb erkunden durften!',{size:26,after:160}),
  P('Besonders interessant fanden wir: ____________________________________________________',{size:24,after:120}),line(10000),
  P('Überrascht hat uns: __________________________________________________________________',{size:24,before:160,after:120}),line(10000),
  P('Wir haben gelernt, dass man bei Ihnen ________________________________ lernen kann.',{size:24,before:160,after:300}),
  P('Viele Grüße',{size:26,after:120}),P('Ihre Klasse 7[ ]',{size:26,after:200}),P('(Platz für Unterschriften)',{size:20,color:'9AA4AE'})],{margin:900}),`${DIR}/M3_Dankesbrief_Vorlage.docx`);
U.eintraege(DIR,KOPF,'Steckbrief unseres Betriebs',mode=>{
  const lk=mode==='luecke';const rows=[['Name des Betriebs','[Betrieb]'],['Branche','z. B. Handwerk, Handel, Gesundheit'],['Anzahl Mitarbeiter',''],['Inhaber/-in (selbstständig)',''],['Ausbildungsberufe',''],['Dauer der Ausbildung',''],['Erwarteter Schulabschluss',''],['Praktikum möglich?','☐ ja  ☐ nein'],['Unser erkundeter Arbeitsplatz','']];
  return [P(lk?'Fülle den Steckbrief nach der Erkundung aus.':'Tafelbild: Steckbrief gemeinsam nach der Erkundung ausfüllen',{size:19,color:'7A8A80',after:100}),
   table([3600,6866],rows.map(([a,b])=>[cell(P(`**${a}**`,{size:21,after:0}),3600,{fill:'F2F5F3',valign:VerticalAlign.CENTER}),cell(P(lk?(b.startsWith('☐')?b:''):b,{size:20,after:0,color:'7A8A80'}),6866,{valign:VerticalAlign.CENTER})]),{height:()=>700}),
   P('**Mein Eindruck in einem Satz:**',{before:200,after:0}),line(10400)];
},null);
save(U.entwurf({nr:9,titel:'Zugangserkundung im Betrieb',
 info:'Lernbereich 2: Arbeit · Unterrichtsgang (Dauer je nach Betrieb, mind. 45 Minuten; bei einer Wochenstunde mit Kollegin/Kollegen tauschen oder Projekttag nutzen)',
 leitfrage:'Wie sieht ein Arbeitsplatz in einem echten Betrieb aus – und wie kann man dort eine Ausbildung machen?',
 grob:'Die Schülerinnen und Schüler erkunden zunehmend selbstständig einen betrieblichen Arbeitsplatz mithilfe der Arbeitsplatzmerkmale und informieren sich über die Ausbildung im Betrieb.',
 fein:['führen ein Interview mit dem Erkundungsbogen.','beobachten Arbeitsmittel und Arbeitsbedingungen.','erfragen Informationen zur Ausbildung im Betrieb.','verhalten sich im Betrieb angemessen und übernehmen ihre Rolle.'],
 verlauf:[
  ['5′','Ankunft',['Treffpunkt, Anwesenheit, Regeln und Rollen kurz wiederholen.'],'Plenum','M2 Gruppenkarte'],
  ['10′','Begrüßung',['Begrüßung durch den Betrieb, kurze Vorstellung des Betriebs (Branche, Mitarbeiter, Ausbildung).','S notieren Daten für den Steckbrief.'],'Plenum','03 Steckbrief'],
  ['20–40′','Erkundung',['Gruppen erkunden ihre Arbeitsplätze: Interview mit dem Erkundungsbogen, Beobachten, ggf. Fotos (mit Erlaubnis).','L geht von Gruppe zu Gruppe.'],'GA','Erkundungsbogen (Stunde 7), Klemmbretter'],
  ['10′','Abschlussrunde',['Gemeinsame Fragerunde zur Ausbildung (Azubi oder Ausbilder/-in), Dank durch die Dankeschön-Sprecher/-innen.'],'Plenum','–'],
  ['danach','Nachbereitung',['Steckbrief ausfüllen (Hausaufgabe), Dankesbrief in der nächsten Stunde unterschreiben lassen.'],'EA','03 Hefteintrag, M3 Dankesbrief']],
 hinweise:['Wenn möglich, sollte jede Gruppe mit einem Azubi sprechen. Das senkt die Hemmschwelle und gibt einen ehrlichen Einblick in die Ausbildung.',
  'Alternative ohne Unterrichtsgang: Expertenbefragung in der Klasse (Ausbilder/-in, Azubi, Eltern mit passenden Berufen). Ablauf und Material bleiben gleich.'],
 material:['M1 Checkliste für die Lehrkraft','M2 pro Gruppe','Erkundungsbögen (Stunde 7), Klemmbretter, Stifte','M3 Dankesbrief nach der Erkundung']}),`${DIR}/01_Entwurf_Stunde_09.docx`);}
