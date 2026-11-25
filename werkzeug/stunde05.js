// WiB 7, LB 2 – Stunde 5: Warum arbeiten Menschen?
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;
const DIR=ROOT+'/05_Stunde_Warum_arbeiten_Menschen';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 5';

// M1 Rollenspielkarten
const SZ=[['Szene 1: Ferienjob','Leon (15) jobbt in den Sommerferien im Supermarkt. Sein Freund Can versteht das nicht.',
  [['Can','Du arbeitest in den Ferien? Freiwillig? Wir wollten doch ins Freibad!'],['Leon','Ich spare auf ein Mofa. Meine Eltern zahlen das nicht.'],['Can','Und das macht dir Spaß?'],['Leon','Teilweise. Die Kollegen sind nett, und mein Chef hat mich gestern gelobt.'],['Can','Hm. Und sonst?'],['Leon','Ich will mal schauen, ob Verkäufer was für mich ist. Und ehrlich: Mit eigenem Geld muss ich nicht immer meine Eltern fragen.']]],
 ['Szene 2: Am Küchentisch','Frau Berger (48) ist Pflegefachfrau im Krankenhaus. Ihre Enkelin Mia (12) fragt sie aus.',
  [['Mia','Oma, warum gehst du eigentlich noch arbeiten? Du bist doch immer so müde.'],['Frau Berger','Na ja, von irgendwas müssen wir die Miete und das Essen bezahlen.'],['Mia','Aber du könntest doch auch zu Hause bleiben.'],['Frau Berger','Dann würden mir meine Patienten fehlen. Wenn es jemandem wieder besser geht, weiß ich, wofür ich das mache.'],['Mia','Und deine Kolleginnen?'],['Frau Berger','Die sind wie eine zweite Familie. Und ich will später eine gute Rente haben.']]]];
{const ch=[P('**M1 Rollenspiel: Warum arbeitest du?**',{size:32,color:'1F6E43',after:60}),
  P('**Zuschauer-Auftrag:** Notiert jeden Grund, warum Leon bzw. Frau Berger arbeiten.',{size:20,after:160})];
 SZ.forEach(([t,s,d],i)=>{ch.push(table([10466],[[cell([P(`**${t}**`,{size:26,color:'FFFFFF',after:20}),P(s,{size:20,color:'FFFFFF',after:0})],10466,{fill:i?'7A5BA8':'C75B12',bc:i?'7A5BA8':'C75B12'})],
   ...d.map(([w,x])=>[cell(P(`**${w}:** ${x}`,{size:22,after:0}),10466,{bc:'C9D6CE'})])]));ch.push(P('',{after:200}));});
 ch.push(P('**Notizen der Zuschauer:**',{size:20,after:0}),line(10400),line(10400),line(10400));
 save(doc(ch,{margin:650}),`${DIR}/M1_Rollenspielkarten.docx`);}

// M2 Diamant-Ranking: 9 Kärtchen + Vorlage
const GR=['Geld verdienen','mir etwas leisten können (Handy, Urlaub, Mofa)','unabhängig von den Eltern sein','Spaß an der Arbeit haben','Anerkennung und Lob bekommen','Kolleginnen und Kollegen, Freunde finden','etwas Sinnvolles tun, anderen helfen','Sicherheit für später (Familie, Rente)','einen geregelten Tagesablauf haben'];
{const cw=3488,rows=[];
 for(let i=0;i<9;i+=3) rows.push([0,1,2].map(j=>cell(P(`**${GR[i+j]}**`,{size:24,align:AlignmentType.CENTER,after:0}),cw,{bc:'7A5BA8',bs:8,fill:'F3EFF9',valign:VerticalAlign.CENTER})));
 // Diamant 1-2-3-2-1 als Tabelle mit 5 Spalten
 const dc=2093,emp=()=>cell(P('',{after:0}),dc,{borders:NOB}),slot=n=>cell(P(n,{size:18,color:'9AA4AE',align:AlignmentType.CENTER,after:0}),dc,{bc:'7A5BA8',bs:8,valign:VerticalAlign.CENTER});
 const dia=table([dc,dc,dc,dc,dc],[[emp(),emp(),slot('1  am wichtigsten'),emp(),emp()],[emp(),slot('2'),emp(),slot('2'),emp()],[slot('3'),emp(),slot('3'),emp(),slot('3')],[emp(),slot('4'),emp(),slot('4'),emp()],[emp(),emp(),slot('5  am unwichtigsten'),emp(),emp()]],{height:()=>1150});
 save(doc([P('**M2 Diamant-Ranking: Warum will ich später arbeiten?**',{size:30,color:'1F6E43',after:60}),
  P('**1.** Schneidet die neun Kärtchen aus. **2.** Legt sie zu zweit in die Diamant-Form: oben der wichtigste Grund, unten der unwichtigste. **3.** Begründet eure Spitze! **4.** Markiert mit einem Stern ★, was wohl **Erwachsene** ganz oben legen würden.',{size:20,after:140}),
  table([cw,cw,cw],rows,{height:()=>1250}),P('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',{size:18,color:'9AA4AE',align:AlignmentType.CENTER,before:120,after:120}),
  dia,P('**Unsere Spitze ist „___________________“, weil** ______________________________________',{size:20,before:200})],{kopf:KOPF+' · M2',margin:650}),`${DIR}/M2_Diamant-Ranking.docx`);}

// Tafelbild / Hefteintrag
U.eintraege(DIR,KOPF,'Warum arbeiten Menschen?',mode=>{
  const cs=[3488,3488,3490];
  const box=(t,inh,c,f)=>cell([P(`**${t}**`,{size:22,color:c,align:AlignmentType.CENTER,after:60}),...inh.map(x=>P(x,{size:20,after:30,bullet:true}))],3488,{fill:f,bc:c,bs:8});
  return [P('Menschen arbeiten nicht nur wegen des Geldes. Man unterscheidet drei Arten von Gründen:',{after:120}),
   table(cs,[[box('Geld und Sicherheit',['[[Geld verdienen]], Lebensunterhalt','sich etwas leisten','[[Sicherheit]] für später (Rente)'],'B26A00','FBF0DE'),
     box('Gemeinschaft',['Kontakte zu [[Kollegen]]','[[Anerkennung]] und Lob','gebraucht werden'],'0F6E6E','E5F3F1'),
     box('Persönliche Gründe',['[[Spaß]] an der Arbeit','etwas [[Sinnvolles]] tun','geregelter Tagesablauf'],'7A5BA8','F0EBF7')]]),
   P('',{after:60}),
   P('**Jugendliche** arbeiten (z. B. im Ferienjob) oft, um sich etwas zu leisten, [[unabhängig]] zu sein und Berufe auszuprobieren.',{after:100,line:340}),
   P('**Erwachsene** müssen mit ihrem Lohn oft eine [[Familie]] versorgen. Für sie zählen auch Sicherheit, Sinn und Anerkennung.',{after:100,line:340}),
   P('**Mein wichtigster Grund:** ______________________________________________',{before:120})];
},'Anerkennung · Familie · Geld verdienen · Kollegen · Sicherheit · Sinnvolles · Spaß · unabhängig');

save(U.entwurf({nr:5,titel:'Warum arbeiten Menschen?',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Kurzprobe 1 zu Beginn (Stunden 2–4) · Bezug: Bedeutung von Erwerbsarbeit, Gründe für die Berufswahl',
 leitfrage:'Warum arbeiten Menschen – nur wegen des Geldes?',
 grob:'Die Schülerinnen und Schüler erkennen materielle, soziale und persönliche Gründe für Erwerbsarbeit und vergleichen die Sicht von Jugendlichen und Erwachsenen.',
 fein:['entnehmen zwei Rollenspielszenen Gründe für Arbeit.','gewichten Gründe in einem Diamant-Ranking und begründen ihre Wahl.','ordnen Gründe den Bereichen Geld/Sicherheit, Gemeinschaft und persönliche Gründe zu.','vergleichen die Gründe von Jugendlichen und Erwachsenen.'],
 verlauf:[
  ['15′','Kurzprobe 1',['Kurzprobe 1 (Formen der Arbeit, gelernte/angelernte Arbeit, Ordnung von Berufen).'],'EA','99_Leistungserhebungen: Kurzprobe 1'],
  ['6′','Einstieg',['**Rollenspiel**: Je zwei S lesen/spielen Szene 1 (Ferienjob) und Szene 2 (Pflegefachfrau). Die Zuschauer notieren Gründe.','Kurzes Sammeln an der Tafel (ungeordnet). Leitfrage.'],'Plenum','M1 Rollenspielkarten'],
  ['12′','Erarbeitung',['**Diamant-Ranking** in PA: neun Gründe ausschneiden und für sich selbst gewichten.','Danach: Mit Stern markieren, was Erwachsene oben legen würden.','Zwei Paare stellen ihre Spitze vor und begründen.'],'PA','M2, Scheren'],
  ['9′','Sicherung',['L ordnet die gesammelten Gründe drei Bereichen zu (Geld und Sicherheit – Gemeinschaft – persönliche Gründe).','Vergleich Jugendliche – Erwachsene. Lückentext.'],'Plenum / EA','Tafel, 03 Hefteintrag'],
  ['3′','Abschluss',['**Daumenprobe**: „Ich würde auch arbeiten gehen, wenn ich im Lotto gewinne.“ Daumen hoch/runter, zwei Begründungen.','Ausblick: „Lena möchte ein eigenes Restaurant. Was ändert sich, wenn man sein eigener Chef ist?“'],'Plenum','–']],
 hinweise:['Wegen der Kurzprobe ist die Stunde dicht. Die Rollenspiele sind deshalb als kurze Lese-Szenen angelegt (je ca. 1 Minute).',
  'Das Diamant-Ranking hat kein richtiges Ergebnis. Entscheidend ist die Begründung; unterschiedliche Spitzen zeigen, dass Menschen aus verschiedenen Gründen arbeiten.',
  'Bezug zu den Steckbriefen: Die „Gründe für die Berufswahl“ von Tim, Selin, Jonas und Lena lassen sich ebenfalls den drei Bereichen zuordnen (z. B. Lena: Kreativität = persönlicher Grund).',
  'Sensibel bleiben: In manchen Familien sind Eltern arbeitslos oder arbeiten unter schwierigen Bedingungen.'],
 loesungen:['M1 Szene 1 (Leon): Geld/Mofa, nette Kollegen, Lob, Beruf ausprobieren, Unabhängigkeit · Szene 2 (Frau Berger): Miete und Essen bezahlen, Patienten helfen (Sinn), Kolleginnen, Rente/Sicherheit',
  'Hefteintrag: Geld verdienen · Sicherheit · Kollegen · Anerkennung · Spaß · Sinnvolles · unabhängig · Familie'],
 material:['Kurzprobe 1 pro S','M1: zweimal pro Szene für die Spieler, sonst Folie','M2 pro Paar, Scheren']}),`${DIR}/01_Entwurf_Stunde_05.docx`);
