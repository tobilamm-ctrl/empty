// WiB 7, LB 2 – Stunden 10–13
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;const GR='1F6E43';
const mk=d=>{require('fs').mkdirSync(d,{recursive:true});return d;};
const EINORD=[['Art der Arbeit','überwiegend körperlich','gemischt','überwiegend geistig'],['Ausbildung','gelernt','angelernt',''],['Arbeitsort','im Freien','in Räumen','beides'],
 ['Maschinen','viel Maschinenarbeit','wenig Maschinenarbeit',''],['Arbeit mit …','Menschen','Sachen','Daten / Computer'],['Beschäftigung','angestellt','selbstständig (Inhaber/-in)','']];
function einordnung(w){const c=[2400,(w-2400)/3,(w-2400)/3,(w-2400)/3];
 return table(c,EINORD.map(r=>[cell(P(`**${r[0]}**`,{size:19,after:0}),c[0],{fill:'F2F5F3'}),...[1,2,3].map(i=>cell(P(r[i]?`☐ ${r[i]}`:'',{size:19,after:0}),c[i]))]));}

// ================= Stunde 10 =================
{const DIR=mk(ROOT+'/10_Stunde_Auswertung_der_Erkundung');const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 10';
 // M1 Plakatgerüst (A4 quer, auf A3 vergrößern)
 const box=(t,h,c)=>cell([P(`**${t}**`,{size:24,color:'FFFFFF',after:0})],0,{fill:c,bc:c});
 const feld=(t,c,w,hgt)=>table([w],[[cell(P(`**${t}**`,{size:22,color:'FFFFFF',after:0}),w,{fill:c,bc:c})],[cell(P('',{after:0}),w,{bc:c,bs:10})]],{height:ri=>ri?hgt:0});
 save(doc([P('**Unser Arbeitsplatz: ____________________  im Betrieb ____________________**',{size:32,color:GR,align:AlignmentType.CENTER,after:120}),
  table([5100,5100,5100],[[cell([feld('1  Tätigkeiten','1F4E9E',4900,1700),P('',{after:60}),feld('2  Arbeitsort & Arbeitsmittel','0F6E6E',4900,1700)],5100,{borders:NOB}),
   cell([feld('3  Arbeitsbedingungen','C75B12',4900,1700),P('',{after:60}),feld('4  Anforderungen','7A5BA8',4900,1700)],5100,{borders:NOB}),
   cell([feld('5  Ausbildung im Betrieb','A4243B',4900,1700),P('',{after:60}),feld('6  Fotos / Zeichnung','6A7A70',4900,1700)],5100,{borders:NOB})]]),
  P('',{after:60}),
  table([7650,7650],[[cell([P('**7  So ordnen wir den Arbeitsplatz ein** (ankreuzen)',{size:22,color:GR,after:60}),einordnung(7400)],7650,{bc:GR,bs:10}),
   cell([P('**8  Unsere Meinung:** Was spricht für, was gegen diesen Arbeitsplatz?',{size:22,color:GR,after:40}),P('👍',{size:24,after:0}),line(7300),line(7300),P('👎',{size:24,before:80,after:0}),line(7300),line(7300)],7650,{bc:GR,bs:10})]])],{landscape:true,margin:500}),`${DIR}/M1_Plakatgeruest.docx`);
 // M2 Arbeitsplan
 save(doc([P('**M2 Arbeitsplan für unser Plakat**',{size:28,color:GR,after:100}),
  table([4000,3466,3000],[['Aufgabe','Wer?','erledigt'].map(h=>cell(P(`**${h}**`,{size:21,after:0}),h==='Aufgabe'?4000:h==='Wer?'?3466:3000,{fill:'DCEFE3'})),
   ...['Felder 1–2 schreiben (Tätigkeiten, Arbeitsort/-mittel)','Felder 3–4 schreiben (Bedingungen, Anforderungen)','Feld 5 Ausbildung im Betrieb','Fotos auswählen / Zeichnung','Feld 7 Einordnung gemeinsam ankreuzen','Feld 8 Meinung gemeinsam formulieren','Präsentation vorbereiten: Wer sagt was?'].map(t=>[cell(P(t,{size:20,after:0}),4000),cell(P('',{after:0}),3466),cell(P('☐',{size:24,align:AlignmentType.CENTER,after:0}),3000)])],{height:ri=>ri?650:0}),
  P('**Tipps für ein gutes Plakat:** große, gut lesbare Schrift · Stichpunkte statt ganzer Sätze · Überschriften farbig · Bilder beschriften',{size:20,before:200})],{kopf:KOPF+' · M2',margin:700}),`${DIR}/M2_Arbeitsplan.docx`);
 // M3 Bewertungsbogen Präsentation
 const KR=[['Inhalt: alle Arbeitsplatzmerkmale dargestellt',4],['Inhalt: Ausbildung im Betrieb erklärt',3],['Einordnung (Feld 7) begründet',2],['Plakat: übersichtlich, gut lesbar',3],['Vortrag: frei, laut und deutlich',3],['Alle Gruppenmitglieder beteiligt',2],['Eigene Meinung begründet',3]];
 save(doc([P('**M3 Bewertungsbogen Präsentation**',{size:28,color:GR,after:60}),P('Gruppe: ___________________________   Arbeitsplatz: ___________________________',{size:20,after:140}),
  table([6466,2000,2000],[['Kriterium','Punkte möglich','Punkte erreicht'].map((h,i)=>cell(P(`**${h}**`,{size:21,after:0}),[6466,2000,2000][i],{fill:'DCEFE3'})),
   ...KR.map(([k,p])=>[cell(P(k,{size:21,after:0}),6466),cell(P(String(p),{size:22,align:AlignmentType.CENTER,after:0}),2000),cell(P('',{after:0}),2000)]),
   [cell(P('**Gesamt**',{size:22,after:0}),6466,{fill:'F2F5F3'}),cell(P('**20**',{size:22,align:AlignmentType.CENTER,after:0}),2000,{fill:'F2F5F3'}),cell(P('',{after:0}),2000,{fill:'F2F5F3'})]],{height:ri=>ri?620:0}),
  P('**Notenschlüssel:** 20–18 P. = 1 · 17–15 P. = 2 · 14–12 P. = 3 · 11–9 P. = 4 · 8–5 P. = 5 · 4–0 P. = 6',{size:20,before:200}),
  P('**Bemerkung:**',{size:20,before:120,after:0}),line(10400),line(10400)],{kopf:KOPF+' · M3',margin:700}),`${DIR}/M3_Bewertungsbogen_Praesentation.docx`);
 U.eintraege(DIR,KOPF,'Unseren Arbeitsplatz einordnen',mode=>[
  P('Mit allem, was wir gelernt haben, können wir einen Arbeitsplatz genau beschreiben und [[einordnen]]:',{after:120}),
  einordnung(10466),P('',{after:80}),
  P('**Merke:** Für eine gute Beschreibung nutzen wir die [[Arbeitsplatzmerkmale]]. Für die Einordnung nutzen wir die Kategorien von Arbeit: körperlich/[[geistig]], gelernt/[[angelernt]], angestellt/[[selbstständig]].',{after:100,line:340})],
  'angelernt · Arbeitsplatzmerkmale · einordnen · geistig · selbstständig');
 save(U.entwurf({nr:10,titel:'Auswertung der Erkundung',
  info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Auswertung der Zugangserkundung',
  leitfrage:'Wie stellen wir unseren erkundeten Arbeitsplatz anschaulich dar?',
  grob:'Die Schülerinnen und Schüler beschreiben den erkundeten Arbeitsplatz mithilfe der Arbeitsplatzmerkmale, ordnen ihn in die erarbeiteten Kategorien ein und bereiten eine Präsentation vor.',
  fein:['werten ihre Erkundungsbögen aus und wählen wichtige Informationen aus.','gestalten ein Plakat nach vorgegebenem Gerüst.','ordnen den Arbeitsplatz begründet in die Kategorien von Arbeit ein.','planen die Präsentation arbeitsteilig.'],
  verlauf:[
   ['5′','Einstieg',['**Stimmungsbarometer**: Jede/r klebt einen Punkt auf die Skala „Die Erkundung war …“ (langweilig – super spannend).','Blitzlicht: „Was hat dich am meisten überrascht?“'],'Plenum','Skala an der Tafel, Klebepunkte'],
   ['5′','Arbeitsauftrag',['L stellt Plakatgerüst, Arbeitsplan und Bewertungskriterien vor. Hefteintrag: Einordnung mit Kategorien.'],'Plenum','M1, M2, M3, 03 Hefteintrag'],
   ['30′','Erarbeitung',['Gruppen erstellen ihr Plakat (Erkundungsbögen, Fotos, Steckbrief). Arbeitsplan mit Zuständigkeiten.','L berät; Hinweis auf Feld 5 (Ausbildung) und Feld 7 (Einordnung).'],'GA','M1 (A3), M2, Erkundungsbögen, Fotos, Stifte, Kleber'],
   ['5′','Abschluss',['Gruppen legen fest, wer was präsentiert. Stand der Arbeit: Daumenprobe.','Unfertige Plakate werden bis zur nächsten Stunde fertiggestellt.'],'GA','M2']],
  hinweise:['Das Plakatgerüst sichert, dass alle Arbeitsplatzmerkmale und der Schwerpunkt Ausbildung vorkommen. Feld 7 verknüpft die Erkundung mit den Stunden 2–6.',
   'Alternative: digitale Präsentation (z. B. mit Tablets) mit denselben acht Feldern als Folien.',
   'Die Präsentation kann mit M3 als mündliche Note bewertet werden; Kriterien vorher transparent machen.'],
  loesungen:['Hefteintrag: einordnen · Arbeitsplatzmerkmale · geistig · angelernt · selbstständig (Einordnung je nach Betrieb)'],
  material:['M1 pro Gruppe auf A3','M2 pro Gruppe','M3 für die Lehrkraft (bzw. transparent für die S)','Fotos der Erkundung ausdrucken']}),`${DIR}/01_Entwurf_Stunde_10.docx`);}

// ================= Stunde 11 =================
{const DIR=mk(ROOT+'/11_Stunde_Praesentation_und_Beurteilung');const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 11';
 const fk=()=>cell([P('**Feedback für Gruppe:** ____________',{size:20,color:GR,after:60}),P('⭐ Das war richtig gut:',{size:20,after:0}),line(4900),P('⭐ Das habe ich gelernt:',{size:20,before:60,after:0}),line(4900),P('💡 Mein Tipp:',{size:20,before:60,after:0}),line(4900)],5233,{bc:'9DB8A8',m:140});
 save(doc([P('**M1 Feedbackkarten „Zwei Sterne und ein Tipp“** – je Plakat eine Karte',{size:18,color:'7A8A80',after:100}),table([5233,5233],[[fk(),fk()],[fk(),fk()],[fk(),fk()]])],{margin:500}),`${DIR}/M1_Feedbackkarten.docx`);
 save(doc([P('**M2 Wäre das ein Arbeitsplatz für mich?**',{size:30,color:GR,after:60}),P('Wähle einen Arbeitsplatz aus dem Galeriegang, der dich interessiert: ___________________________',{size:21,after:140}),
  table([5233,5233],[[cell([P('**👍 Das spricht dafür**',{size:22,color:'2E7D32',after:40}),line(4900),line(4900),line(4900)],5233,{bc:'2E7D32',bs:8}),cell([P('**👎 Das spricht dagegen**',{size:22,color:'C62828',after:40}),line(4900),line(4900),line(4900)],5233,{bc:'C62828',bs:8})]]),
  P('**Passt der Arbeitsplatz zu meinen Interessen und Fähigkeiten?**',{size:21,before:200,after:80}),
  table(Array(5).fill(2093),[['gar nicht','eher nicht','teils, teils','eher ja','total'].map(t=>cell(P(`☐ ${t}`,{size:20,align:AlignmentType.CENTER,after:0}),2093))]),
  P('**Meine Beurteilung in zwei Sätzen** (nutze ein Arbeitsplatzmerkmal!):',{size:21,before:200,after:0}),line(10400),line(10400),line(10400),
  P('**Was möchte ich noch herausfinden?** (z. B. im Praktikum)',{size:21,before:160,after:0}),line(10400)],{kopf:KOPF+' · M2',margin:700}),`${DIR}/M2_Beurteilungsbogen.docx`);
 U.eintraege(DIR,KOPF,'Einen Arbeitsplatz beurteilen',mode=>[
  P('**Beurteilen** heißt: [[Vorteile]] und [[Nachteile]] abwägen und eine eigene, [[begründete]] Meinung bilden.',{after:120,line:340}),
  P('**So gehe ich vor:**',{after:40}),
  ...['den Arbeitsplatz mit den [[Arbeitsplatzmerkmalen]] beschreiben','Vorteile und Nachteile sammeln','mit meinen [[Interessen]] und Fähigkeiten vergleichen','eine Entscheidung treffen und begründen: „Für mich passt …, weil …“'].map((t,i)=>P(`**${i+1}.** ${t}`,{after:60,line:330})),
  P('**Merke:** Ob ein Arbeitsplatz gut ist, hängt von der [[Person]] ab. Ein [[Praktikum]] hilft, es selbst auszuprobieren.',{before:120,line:340})],
  'Arbeitsplatzmerkmalen · begründete · Interessen · Nachteile · Person · Praktikum · Vorteile');
 save(U.entwurf({nr:11,titel:'Präsentation und Beurteilung',
  info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Präsentation der Erkundungsergebnisse',
  leitfrage:'Wäre dieser Arbeitsplatz etwas für mich?',
  grob:'Die Schülerinnen und Schüler präsentieren den erkundeten Arbeitsplatz und beurteilen einen Arbeitsplatz begründet für sich selbst.',
  fein:['präsentieren ihr Plakat mithilfe der Arbeitsplatzmerkmale.','geben kriteriengeleitet Rückmeldung.','wägen Vor- und Nachteile eines Arbeitsplatzes ab und begründen ihre Beurteilung.'],
  verlauf:[
   ['3′','Einstieg',['Ablauf des Galeriegangs und Feedbackregeln (wertschätzend, konkret).'],'Plenum','–'],
   ['25′','Präsentation',['**Galeriegang**: Plakate hängen im Raum. Je ein Gruppenmitglied bleibt als „Experte“ beim Plakat und präsentiert in 3 Minuten; die anderen wandern im Uhrzeigersinn. Wechsel der Experten nach der Hälfte.','An jedem Plakat schreiben die Besucher eine Feedbackkarte.','L bewertet mit dem Bewertungsbogen (Stunde 10, M3).'],'GA','Plakate, M1 Feedbackkarten'],
   ['10′','Beurteilung',['S wählen einen Arbeitsplatz aus dem Galeriegang und beurteilen ihn mit dem Beurteilungsbogen.','Zwei bis drei S stellen ihre Beurteilung vor.'],'EA / Plenum','M2'],
   ['7′','Sicherung',['Wie beurteilt man einen Arbeitsplatz? Vorgehen festhalten, Lückentext.','Ausblick: Praktikum in Klasse 8; Wiederholung und Probe.'],'Plenum / EA','03 Hefteintrag']],
  hinweise:['Der Galeriegang (Expertenmethode) sorgt dafür, dass alle S präsentieren und alle Plakate gesehen werden, ohne dass zehn Vorträge nacheinander stattfinden.',
   'Die Beurteilung schließt den Kreis zu Stunde 1 („Welcher Arbeitsplatz passt zu mir?“). Gute Beurteilungen enthalten ein konkretes Merkmal.'],
  loesungen:['Hefteintrag: Vorteile · Nachteile · begründete · Arbeitsplatzmerkmalen · Interessen · Person · Praktikum'],
  material:['Plakate aus Stunde 10, Klebeband','M1 Feedbackkarten (pro Plakat mehrere)','M2 pro S','Bewertungsbogen aus Stunde 10 für die Lehrkraft']}),`${DIR}/01_Entwurf_Stunde_11.docx`);}

// ================= Stunde 12 =================
{const DIR=mk(ROOT+'/12_Stunde_Wiederholung');const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 12';
 const stat=(nr,t,c,inhalt)=>[table([10466],[[cell([P(`**Station ${nr}**`,{size:22,color:'FFFFFF',after:0}),P(`**${t}**`,{size:34,color:'FFFFFF',after:0})],10466,{fill:c,bc:c,m:160})]]),P('',{after:100}),...inhalt];
 const ch=[];
 ch.push(...stat(1,'Arbeitsplatzmerkmale','1F4E9E',[P('Ordne die Beispiele aus Lenas Arbeitsplatz dem richtigen Merkmal zu. Schreibe die Buchstaben in die Tabelle.',{size:22,after:100}),
  ...['A  Messer, Kombidämpfer, Thermometer','B  Gemüse schneiden, Gerichte anrichten','C  heiß, laut, Arbeit am Wochenende','D  belastbar, Teamgeist, Hygiene','E  Restaurantküche im Landgasthof','F  kreativ sein, Lob der Gäste'].map(t=>P(t,{size:22,after:40})),
  table([3488,3488,3490],[['Tätigkeiten','Arbeitsort','Arbeitsmittel'].map(t=>cell(P(`**${t}**`,{size:20,after:0}),3488,{fill:'EAF0FA'})),[0,1,2].map(()=>cell(P('',{after:0}),3488)),['Arbeitsbedingungen','Anforderungen','Gründe für die Berufswahl'].map(t=>cell(P(`**${t}**`,{size:20,after:0}),3488,{fill:'EAF0FA'})),[0,1,2].map(()=>cell(P('',{after:0}),3488))],{height:ri=>ri%2?700:0})]));
 ch.push(br(),...stat(2,'Formen der Arbeit','C75B12',[P('Kreuze an. Achtung: Manche Tätigkeiten sind gemischt!',{size:22,after:100}),
  table([4466,2000,2000,2000],[['Tätigkeit','körperlich','gemischt','geistig'].map((t,i)=>cell(P(`**${t}**`,{size:20,after:0}),i?2000:4466,{fill:'FBE7DA'})),
   ...['Pakete sortieren und tragen','Kunden am Telefon beraten','Haare schneiden','eine Rechnung am Computer schreiben','einen Dachstuhl bauen'].map(t=>[cell(P(t,{size:21,after:0}),4466),...[0,1,2].map(()=>cell(P('☐',{size:24,align:AlignmentType.CENTER,after:0}),2000))])],{height:ri=>ri?600:0}),
  P('Gelernt oder angelernt? Schreibe **G** oder **A**:',{size:22,before:200,after:60}),
  ...['___ Max wurde zwei Wochen in der Küche eingearbeitet.','___ Selin hat drei Jahre gelernt und eine Prüfung bestanden.','___ Ali sortiert nach drei Tagen Einarbeitung Pakete.'].map(t=>P(t,{size:22,after:60}))]));
 ch.push(br(),...stat(3,'Berufe ordnen','0F6E6E',[P('Finde den Beruf, der nicht passt, und nenne das gemeinsame Merkmal der anderen.',{size:22,after:100}),
  ...['Landwirtin – Straßenbauer – Bankkauffrau – Dachdecker','Pflegefachfrau – Friseurin – Kinderpfleger – Tischler','Maschinen- und Anlagenführerin – Industriemechaniker – Kinderpflegerin – Tischler'].flatMap((t,i)=>[P(`**${i+1}.** ${t}`,{size:22,after:0}),P('passt nicht: ______________   Merkmal: ____________________________',{size:21,before:60,after:160})])]));
 ch.push(br(),...stat(4,'Warum arbeiten Menschen?','7A5BA8',[P('Ordne die Gründe den drei Bereichen zu: **G** = Geld und Sicherheit · **M** = Gemeinschaft · **P** = persönliche Gründe',{size:22,after:100}),
  ...['___ Rente für später','___ Lob vom Chef','___ Spaß an der Arbeit','___ Miete bezahlen','___ nette Kollegen','___ anderen Menschen helfen'].map(t=>P(t,{size:22,after:60}))]));
 ch.push(br(),...stat(5,'Angestellt oder selbstständig?','B26A00',[P('Ergänze die Sätze.',{size:22,after:100}),
  ...['Ein Angestellter bekommt jeden Monat einen festen __________________.','Eine Selbstständige verdient ihr Geld durch den __________________.','Das Risiko ist bei Selbstständigen __________________, denn sie können ihr Geld verlieren.','Angestellte bekommen bei Krankheit ihren Lohn __________________.','Ein Vorteil der Selbstständigkeit: Man kann __________________ entscheiden.'].map(t=>P(t,{size:22,after:120}))]));
 save(doc(ch,{kopf:KOPF+' · Lernzirkel',margin:700}),`${DIR}/M1_Lernzirkel_Stationen.docx`);
 // Lösungen
 save(doc([P('**Lösungen Lernzirkel** (zur Selbstkontrolle auslegen)',{size:28,color:GR,after:120}),
  ...['**Station 1:** Tätigkeiten B · Arbeitsort E · Arbeitsmittel A · Arbeitsbedingungen C · Anforderungen D · Gründe F',
   '**Station 2:** Pakete: körperlich · Telefonberatung: geistig · Haare schneiden: gemischt · Rechnung: geistig · Dachstuhl: körperlich · Max A · Selin G · Ali A',
   '**Station 3:** 1 Bankkauffrau (im Freien) · 2 Tischler (Arbeit mit Menschen) · 3 Kinderpflegerin (viel Maschinenarbeit)',
   '**Station 4:** Rente G · Lob M · Spaß P · Miete G · Kollegen M · helfen P',
   '**Station 5:** Lohn · Gewinn · höher · weiter(gezahlt) · selbst'].map(t=>P(t,{size:22,after:120}))],{margin:800}),`${DIR}/M1_Loesung_Lernzirkel.docx`);
 // M2 Laufzettel + Selbsteinschätzung
 const KANN=['Ich kann einen Arbeitsplatz mit den Arbeitsplatzmerkmalen beschreiben.','Ich kann körperliche und geistige Arbeit unterscheiden.','Ich kann gelernte und angelernte Arbeit unterscheiden.','Ich kann Berufe nach selbst gewählten Merkmalen ordnen.','Ich kann Gründe nennen, warum Menschen arbeiten.','Ich kann abhängige Beschäftigung und Selbstständigkeit vergleichen.','Ich kann einen Arbeitsplatz begründet beurteilen.'];
 save(doc([P('**M2 Laufzettel und Selbsteinschätzung**',{size:28,color:GR,after:100}),
  table([5466,1666,1666,1668],[['Station','erledigt','kontrolliert',''].map((h,i)=>cell(P(`**${h}**`,{size:20,after:0}),[5466,1666,1666,1668][i],{fill:'DCEFE3'})),
   ...['1 Arbeitsplatzmerkmale','2 Formen der Arbeit','3 Berufe ordnen','4 Warum arbeiten Menschen?','5 Angestellt oder selbstständig?'].map(t=>[cell(P(t,{size:21,after:0}),5466),cell(P('☐',{size:24,align:AlignmentType.CENTER,after:0}),1666),cell(P('☐',{size:24,align:AlignmentType.CENTER,after:0}),1666),cell(P('',{after:0}),1668)])],{height:ri=>ri?560:0}),
  P('',{after:120}),
  table([7066,1133,1133,1134],[['Das kann ich …','😊','😐','☹'].map((h,i)=>cell(P(`**${h}**`,{size:i?24:20,align:i?AlignmentType.CENTER:undefined,after:0}),[7066,1133,1133,1134][i],{fill:'DCEFE3'})),
   ...KANN.map(k=>[cell(P(k,{size:20,after:0}),7066),...[0,1,2].map(i=>cell(P('',{after:0}),[1133,1133,1134][i]))])],{height:ri=>ri?600:0}),
  P('**Das muss ich bis zur Probe noch üben:**',{size:21,before:160,after:0}),line(10400),line(10400)],{kopf:KOPF+' · M2',margin:700}),`${DIR}/M2_Laufzettel_Selbsteinschaetzung.docx`);
 // M3 Quiz-Folie (Ampelkarten)
 const Q=[['Die Arbeitsmittel eines Kochs sind z. B. Messer, Herd und Kombidämpfer.','r'],['Eine Küchenhilfe ist ein Beispiel für gelernte Arbeit.','f: angelernte Arbeit'],['Fast jeder Beruf ist eine Mischform aus körperlicher und geistiger Arbeit.','r'],
  ['Selbstständige bekommen jeden Monat einen festen Lohn.','f: Gewinn, schwankt'],['Berufe kann man z. B. nach „im Freien“ oder „in Räumen“ ordnen.','r'],['Menschen arbeiten nur, um Geld zu verdienen.','f: auch Gemeinschaft, Sinn, Spaß'],
  ['Bei einer Zugangserkundung lernt man einen Arbeitsplatz und die Ausbildung im Betrieb kennen.','r'],['Angestellte tragen das größte Risiko für den Betrieb.','f: Selbstständige']];
 save(U.ampelFolie('Abschluss-Quiz',Q,false),`${DIR}/M3_Folie_Abschluss-Quiz.docx`);save(U.ampelFolie('Abschluss-Quiz',Q,true),`${DIR}/M3_Loesung_Abschluss-Quiz.docx`);
 U.eintraege(DIR,KOPF,'Lernbereich Arbeit – das Wichtigste',mode=>{const cs=[5233,5233];
  const b=(t,x,c,f)=>cell([P(`**${t}**`,{size:21,color:c,after:40}),...x.map(s=>P(s,{size:19,after:20,bullet:true}))],5233,{fill:f,bc:c,bs:8});
  return [table(cs,[[b('Arbeitsplatzmerkmale',['Tätigkeiten, Arbeitsort, [[Arbeitsmittel]]','Arbeitsbedingungen, Anforderungen'],'1F4E9E','EAF0FA'),b('Formen der Arbeit',['körperlich – geistig (meist [[Mischform]])','gelernt – [[angelernt]]'],'C75B12','FBE7DA')],
   [b('Berufe ordnen',['nach Merkmalen, z. B. im Freien / in Räumen','viel [[Maschinenarbeit]], Arbeit mit Menschen'],'0F6E6E','E5F3F1'),b('Warum arbeiten?',['Geld und [[Sicherheit]]','Gemeinschaft, persönliche Gründe'],'7A5BA8','F0EBF7')],
   [b('Beschäftigung',['angestellt: fester [[Lohn]], wenig Risiko','selbstständig: [[Gewinn]], hohes Risiko'],'B26A00','FBF0DE'),b('Erkundung',['Arbeitsplatz und [[Ausbildung]] im Betrieb','vorbereiten – durchführen – auswerten'],'2E7D32','E6F3E7')]])];},
  'angelernt · Arbeitsmittel · Ausbildung · Gewinn · Lohn · Maschinenarbeit · Mischform · Sicherheit');
 save(U.entwurf({nr:12,titel:'Wiederholung',
  info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Vorbereitung auf die Probe',
  leitfrage:'Was weiß ich schon über Arbeit und Arbeitsplätze?',
  grob:'Die Schülerinnen und Schüler wiederholen die Inhalte des Lernbereichs selbstständig und schätzen ihren Lernstand ein.',
  fein:['bearbeiten Stationen zu allen Inhalten und kontrollieren selbst.','schätzen ihren Lernstand mit Kann-Sätzen ein.','benennen, was sie bis zur Probe noch üben müssen.'],
  verlauf:[
   ['3′','Einstieg',['Überblick: Lernlandkarte (Tafelbild) mit allen Themen der Sequenz.'],'Plenum','02 Tafelbild'],
   ['27′','Lernzirkel',['Fünf Stationen in beliebiger Reihenfolge, allein oder zu zweit. Selbstkontrolle mit ausgelegten Lösungen; Laufzettel abhaken.'],'EA / PA','M1 Stationen, M1 Lösung, M2 Laufzettel'],
   ['8′','Abschluss-Quiz',['Acht Aussagen mit Ampelkarten; falsche Aussagen werden verbessert.'],'Plenum','M3 Folie, Ampelkarten (Stunde 3)'],
   ['7′','Selbsteinschätzung',['Kann-Sätze ausfüllen; Übersicht „Das Wichtigste“ als Hefteintrag.','Hinweise zur Probe (Termin, Umfang).'],'EA','M2, 03 Hefteintrag']],
  hinweise:['Der Lernzirkel deckt alle Inhalte der Probe ab. Stationen mehrfach kopieren, damit keine Wartezeiten entstehen.','Die Selbsteinschätzung zeigt der Lehrkraft, wo vor der Probe noch Erklärungsbedarf besteht.'],
  loesungen:['M1: siehe M1_Loesung_Lernzirkel','M3: richtig: 1, 3, 5, 7 · falsch: 2, 4, 6, 8 (siehe Lösung)','Hefteintrag: Arbeitsmittel · Mischform · angelernt · Maschinenarbeit · Sicherheit · Lohn · Gewinn · Ausbildung'],
  material:['M1 Stationen je 3–4-mal, Lösungen auslegen','M2 pro S','M3 Folie, Ampelkarten']}),`${DIR}/01_Entwurf_Stunde_12.docx`);}

// ================= Stunde 13 =================
{const DIR=mk(ROOT+'/13_Stunde_Probe');
 save(U.entwurf({nr:13,titel:'Probe',
  info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Probe zu allen Inhalten des Lernbereichs (Material: 99_Leistungserhebungen)',
  leitfrage:'–',
  grob:'Die Schülerinnen und Schüler zeigen, dass sie Arbeitsplätze beschreiben, Formen der Arbeit unterscheiden, Berufe ordnen und abhängige Beschäftigung und Selbstständigkeit vergleichen können.',
  fein:['bearbeiten die Probe selbstständig (ca. 35 Minuten).'],
  verlauf:[['5′','Organisation',['Tische auseinander, Material wegräumen, Probe austeilen.'],'Plenum','Probe (99_Leistungserhebungen)'],
   ['35′','Probe',['Selbstständige Bearbeitung.'],'EA','Probe'],
   ['5′','Abschluss',['Einsammeln. Wer früher fertig ist: Kreuzworträtsel aus dem alten Material oder Beurteilungsbogen zu einem Wunschberuf.'],'EA','–']],
  hinweise:['Die Probe fragt nur Inhalte ab, die tatsächlich behandelt wurden. Die Erkundungsfrage (Aufgabe 7) ist allgemein formuliert, damit sie unabhängig vom besuchten Betrieb lösbar ist.','Rückgabe und Besprechung in der folgenden Stunde.']}),`${DIR}/01_Entwurf_Stunde_13.docx`);}
