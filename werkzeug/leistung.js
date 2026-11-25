// 99_Leistungserhebungen: Kurzprobe 1, Kurzprobe 2, Probe – je Schülerblatt und Erwartungshorizont
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;const GR='1F6E43';
const DIR=ROOT+'/99_Leistungserhebungen';require('fs').mkdirSync(DIR,{recursive:true});
// Aufgabe: {nr, text, p, body:[...] (Schüler), loes:[...] (Erwartung)}
function test(titel,dauer,aufg,schluessel,file){
  const tot=aufg.reduce((s,a)=>s+a.p,0);
  const kopf=table([7466,3000],[[cell([P(`**${titel}**`,{size:30,color:GR,after:20}),P(`WiB 7 · Lernbereich 2: Arbeit · ${dauer}`,{size:19,color:'7A8A80',after:0})],7466,{borders:NOB}),
    cell([P('Name: ______________________',{size:19,after:60}),P('Datum: ____________',{size:19,after:60}),P(`Punkte: ____ / ${tot}   Note: ____`,{size:19,after:0})],3000,{borders:NOB})]]);
  const blk=(a,l)=>[table([9266,1200],[[cell(P(`**${a.nr}.** ${a.text}`,{size:22,after:0}),9266,{fill:'F2F8F4',bc:'C9D6CE'}),cell(P(`/ ${a.p} P.`,{size:20,align:AlignmentType.CENTER,after:0}),1200,{fill:'F2F8F4',bc:'C9D6CE',valign:VerticalAlign.CENTER})]]),
    ...(l?a.loes.map(x=>typeof x==='string'?P(x,{size:21,color:'1F4E9E',after:40}):x):a.body),P('',{after:120})];
  const nk=table(Array(schluessel.length).fill(Math.floor(10466/schluessel.length)),[schluessel.map((s,i)=>cell(P(`**${i+1}**`,{size:20,align:AlignmentType.CENTER,after:0}),Math.floor(10466/schluessel.length),{fill:'DCEFE3'})),schluessel.map(s=>cell(P(s,{size:19,align:AlignmentType.CENTER,after:0}),Math.floor(10466/schluessel.length)))]);
  save(doc([kopf,P('',{after:120}),...aufg.flatMap(a=>blk(a,false))],{margin:650}),`${DIR}/${file}.docx`);
  save(doc([P(`**Erwartungshorizont: ${titel}**`,{size:30,color:GR,after:40}),P(`Gesamtpunktzahl: ${tot} · ${dauer}`,{size:20,after:160}),...aufg.flatMap(a=>blk(a,true)),
    P('**Notenschlüssel**',{size:24,color:GR,before:120,after:60}),nk],{margin:650}),`${DIR}/${file}_Erwartungshorizont.docx`);
}
const L=(n=1)=>Array(n).fill(0).map(()=>line(10400));
const ck=(items,cols)=>{const w=[4466,...cols.map(()=>Math.floor(6000/cols.length))];
  return table(w,[[cell(P('',{after:0}),w[0],{fill:'F2F5F3'}),...cols.map((c,i)=>cell(P(`**${c}**`,{size:19,align:AlignmentType.CENTER,after:0}),w[i+1],{fill:'F2F5F3'}))],
   ...items.map(t=>[cell(P(t,{size:21,after:0}),w[0]),...cols.map((c,i)=>cell(P('☐',{size:24,align:AlignmentType.CENTER,after:0}),w[i+1]))])],{height:ri=>ri?520:0});};

// ---------- Kurzprobe 1 ----------
test('Kurzprobe 1: Formen der Arbeit und Berufe ordnen','Bearbeitungszeit 15 Minuten',[
 {nr:1,p:4,text:'Kreuze an: Ist die Tätigkeit überwiegend körperlich oder überwiegend geistig?',
  body:[ck(['Reifen wechseln','Kunden beraten','schwere Kartons tragen','eine Rechnung am Computer schreiben'],['körperlich','geistig'])],
  loes:['Reifen wechseln: körperlich · Kunden beraten: geistig · Kartons tragen: körperlich · Rechnung: geistig (je 1 P.)']},
 {nr:2,p:2,text:'Erkläre, warum fast jeder Beruf eine Mischform ist. Nenne ein Beispiel.',body:L(3),
  loes:['In fast jedem Beruf braucht man Körper und Kopf; nur der Anteil ist unterschiedlich (1 P.).','Beispiel, z. B. Köchin: schneidet und trägt Töpfe (körperlich), plant Rezepte (geistig) (1 P.).']},
 {nr:3,p:3,text:'Vergleiche gelernte und angelernte Arbeit. Ergänze die Tabelle.',
  body:[table([3000,3733,3733],[['','**gelernte Arbeit**','**angelernte Arbeit**'].map((t,i)=>cell(P(t,{size:20,after:0}),[3000,3733,3733][i],{fill:'F2F5F3'})),...['Wie lange gelernt?','Lohn','Aufstiegschancen'].map(t=>[cell(P(`**${t}**`,{size:20,after:0}),3000),cell(P('',{after:0}),3733),cell(P('',{after:0}),3733)])],{height:ri=>ri?650:0})],
  loes:['Dauer: Ausbildung 2–3 ½ Jahre – kurze Einarbeitung (Tage/Wochen) · Lohn: höher – niedrig/Mindestlohn · Aufstieg: gut (Meister, Techniker) – kaum (je Zeile 1 P., beide Seiten richtig)']},
 {nr:4,p:2,text:'Welcher Beruf passt nicht? Streiche ihn durch und nenne das gemeinsame Merkmal der anderen.',
  body:[P('a) Gärtnerin – Dachdecker – Bankkauffrau – Landwirt',{size:22,after:0}),P('Merkmal: ______________________________',{size:21,before:80,after:120}),P('b) Pflegefachmann – Kinderpflegerin – Fachinformatiker – Friseurin',{size:22,after:0}),P('Merkmal: ______________________________',{size:21,before:80,after:0})],
  loes:['a) Bankkauffrau, Merkmal: Arbeit im Freien (1 P.)','b) Fachinformatiker, Merkmal: Arbeit mit Menschen (1 P.)']},
 {nr:5,p:1,text:'Nenne ein weiteres Merkmal, nach dem man Berufe ordnen kann, und zwei passende Berufe.',body:L(2),
  loes:['z. B. viel Maschinenarbeit: Maschinen- und Anlagenführer, Industriemechaniker; auch: Arbeit mit Daten, Berufsfeld … (1 P. nur mit zwei passenden Berufen)']}],
 ['12–11','10–9','8–7','6–5','4–2','1–0'],'Kurzprobe_1');

// ---------- Kurzprobe 2 ----------
test('Kurzprobe 2: Warum arbeiten Menschen? Angestellt oder selbstständig?','Bearbeitungszeit 15 Minuten',[
 {nr:1,p:4,text:'Nenne vier Gründe, warum Menschen arbeiten. Die Gründe sollen aus mindestens zwei verschiedenen Bereichen stammen.',body:L(4),
  loes:['Geld und Sicherheit: Geld verdienen, Miete/Essen bezahlen, sich etwas leisten, Rente · Gemeinschaft: Kollegen, Anerkennung, gebraucht werden · persönlich: Spaß, Sinn/anderen helfen, Tagesablauf (je 1 P.; höchstens 2 P., wenn alle aus einem Bereich)']},
 {nr:2,p:1,text:'Nenne einen Unterschied zwischen den Gründen von Jugendlichen und Erwachsenen.',body:L(2),
  loes:['z. B. Jugendliche: sich etwas leisten, unabhängig sein, Beruf ausprobieren – Erwachsene: Familie versorgen, Sicherheit/Rente (1 P.)']},
 {nr:3,p:4,text:'Kreuze an: angestellt oder selbstständig?',
  body:[ck(['Frau Yilmaz hat einen eigenen Friseursalon.','Herr Maier ist Busfahrer bei den Stadtwerken.','Frau Dr. Wagner führt eine eigene Arztpraxis.','Jonas verkauft Schuhe in einer Filiale.'],['angestellt','selbstständig'])],
  loes:['Yilmaz: selbstständig · Maier: angestellt · Dr. Wagner: selbstständig · Jonas: angestellt (je 1 P.)']},
 {nr:4,p:2,text:'Nenne einen Vorteil und einen Nachteil der Selbstständigkeit.',body:[P('Vorteil:',{size:21,after:0}),line(10400),P('Nachteil:',{size:21,before:80,after:0}),line(10400)],
  loes:['Vorteil: selbst entscheiden, eigene Ideen verwirklichen, evtl. mehr verdienen (1 P.)','Nachteil: hohes Risiko/Geld verlieren, schwankendes Einkommen, lange Arbeitszeiten, Vorsorge bei Krankheit selbst (1 P.)']},
 {nr:5,p:1,text:'Ergänze: Angestellte bekommen einen festen __________, Selbstständige verdienen ihr Geld durch den __________.',body:[P('',{after:0})],
  loes:['Lohn (Gehalt) · Gewinn (1 P., beide richtig)']}],
 ['12–11','10–9','8–7','6–5','4–2','1–0'],'Kurzprobe_2');

// ---------- Probe ----------
const EMRE='**Emre (20) – Fachkraft für Lagerlogistik**\nEmre arbeitet in einem großen Lager bei Nürnberg. Er nimmt Lieferungen an, kontrolliert die Ware und lagert sie mit dem Gabelstapler ein. Jedes Paket erfasst er mit dem Handscanner. Im Winter ist es im Lager kalt. Emre arbeitet im Schichtdienst und muss Sicherheitsschuhe tragen. Wichtig sind Zuverlässigkeit, Sorgfalt und der Gabelstaplerschein. Emre mag seinen Beruf, weil er gern Maschinen fährt und im Team arbeitet. Seine Ausbildung hat drei Jahre gedauert. Er ist bei der Firma „LogiTrans“ angestellt.';
test('Probe: Arbeit und Arbeitsplätze','Bearbeitungszeit 35 Minuten',[
 {nr:1,p:6,text:'Lies den Text. Ordne jedem Arbeitsplatzmerkmal eine passende Information aus dem Text zu.',
  body:[table([10466],[[cell(EMRE.split('\n').map(t=>P(t,{size:22,after:60,line:320})),10466,{bc:GR,bs:8,m:180})]]),P('',{after:80}),
   table([3400,7066],['Tätigkeiten','Arbeitsort','Arbeitsmittel','Arbeitsbedingungen','Anforderungen','Gründe für die Berufswahl'].map(t=>[cell(P(`**${t}**`,{size:21,after:0}),3400,{fill:'F2F5F3'}),cell(P('',{after:0}),7066)]),{height:()=>560})],
  loes:['Tätigkeiten: Lieferungen annehmen, Ware kontrollieren, einlagern · Arbeitsort: großes Lager · Arbeitsmittel: Gabelstapler, Handscanner · Arbeitsbedingungen: kalt im Winter, Schichtdienst, Sicherheitsschuhe · Anforderungen: Zuverlässigkeit, Sorgfalt, Gabelstaplerschein · Gründe: fährt gern Maschinen, Arbeit im Team (je 1 P.)']},
 {nr:2,p:3,text:'Ist Emres Arbeit überwiegend körperlich, gemischt oder überwiegend geistig? Entscheide dich und begründe mit zwei Tätigkeiten.',body:L(3),
  loes:['Einordnung, z. B. gemischt oder überwiegend körperlich (1 P.)','zwei passende Tätigkeiten als Begründung, z. B. Ware einlagern (körperlich), Ware kontrollieren/erfassen (geistig) (2 P.)']},
 {nr:3,p:3,text:'a) Ist Emre eine gelernte oder eine angelernte Arbeitskraft? Begründe. b) Nenne zwei Vorteile einer Berufsausbildung.',body:[P('a)',{size:21,after:0}),line(10400),P('b)',{size:21,before:80,after:0}),line(10400),line(10400)],
  loes:['a) gelernt, weil er eine dreijährige Ausbildung gemacht hat (1 P.)','b) z. B. höherer Lohn, bessere Aufstiegschancen, sichererer Arbeitsplatz, anspruchsvollere Tätigkeiten (je 1 P.)']},
 {nr:4,p:5,text:'a) Ordne die Berufe nach dem Merkmal „Arbeit im Freien“ oder „Arbeit in Räumen“. b) Nenne zwei weitere Merkmale, nach denen man Berufe ordnen kann.',
  body:[P('Straßenbauerin · Bankkaufmann · Gärtner · Fachinformatikerin · Dachdecker · Friseurin',{size:22,after:100}),
   table([5233,5233],[[cell(P('**im Freien**',{size:21,after:0}),5233,{fill:'F2F5F3'}),cell(P('**in Räumen**',{size:21,after:0}),5233,{fill:'F2F5F3'})],[cell(P('',{after:0}),5233),cell(P('',{after:0}),5233)]],{height:ri=>ri?1100:0}),
   P('b)',{size:21,before:100,after:0}),line(10400)],
  loes:['a) im Freien: Straßenbauerin, Gärtner, Dachdecker · in Räumen: Bankkaufmann, Fachinformatikerin, Friseurin (je 0,5 P. = 3 P.)','b) z. B. viel Maschinenarbeit, Arbeit mit Menschen/Sachen/Daten, körperlich/geistig, gelernt/angelernt, Berufsfeld (je 1 P.)']},
 {nr:5,p:3,text:'Menschen arbeiten aus verschiedenen Gründen. Nenne zu jedem Bereich einen Grund.',
  body:[table([3400,7066],['Geld und Sicherheit','Gemeinschaft','persönliche Gründe'].map(t=>[cell(P(`**${t}**`,{size:21,after:0}),3400,{fill:'F2F5F3'}),cell(P('',{after:0}),7066)]),{height:()=>560})],
  loes:['Geld und Sicherheit: Geld verdienen, Rente … · Gemeinschaft: Kollegen, Anerkennung … · persönlich: Spaß, Sinn, Tagesablauf … (je 1 P.)']},
 {nr:6,p:4,text:'a) Ist Emre abhängig beschäftigt oder selbstständig? Begründe. b) Vergleiche in der Tabelle.',
  body:[line(10400),P('',{after:60}),table([3000,3733,3733],[['','**angestellt**','**selbstständig**'].map((t,i)=>cell(P(t,{size:20,after:0}),[3000,3733,3733][i],{fill:'F2F5F3'})),...['Einkommen','Risiko','Wer entscheidet?'].map(t=>[cell(P(`**${t}**`,{size:20,after:0}),3000),cell(P('',{after:0}),3733),cell(P('',{after:0}),3733)])],{height:ri=>ri?600:0})],
  loes:['a) abhängig beschäftigt (angestellt), weil er bei der Firma LogiTrans angestellt ist / einen Chef hat (1 P.)','b) Einkommen: fester Lohn – Gewinn, schwankt · Risiko: gering – hoch · Entscheidungen: Arbeitgeber – selbst (je Feld 0,5 P. = 3 P.)']},
 {nr:7,p:4,text:'Zugangserkundung: a) Nenne zwei Dinge, die man vor einer Betriebserkundung vorbereitet. b) Formuliere eine offene Frage zur Ausbildung im Betrieb. c) Nenne eine Verhaltensregel.',
  body:[P('a)',{size:21,after:0}),line(10400),line(10400),P('b)',{size:21,before:80,after:0}),line(10400),P('c)',{size:21,before:80,after:0}),line(10400)],
  loes:['a) z. B. Erkundungsbogen/Fragen erstellen, Rollen verteilen, Regeln besprechen, Elternbrief (je 1 P.)','b) offene W-Frage, z. B. „Welche Berufe kann man bei Ihnen lernen?“ (1 P.; Ja-Nein-Frage 0 P.)','c) z. B. pünktlich sein, Handy lautlos, nur mit Erlaubnis fotografieren (1 P.)']},
 {nr:8,p:2,text:'Wäre Emres Arbeitsplatz etwas für dich? Beurteile ihn mit zwei Arbeitsplatzmerkmalen.',body:L(3),
  loes:['eigene Entscheidung mit zwei begründenden Merkmalen, z. B. „Mir gefällt, dass er mit Maschinen arbeitet (Arbeitsmittel), aber Schichtdienst wäre nichts für mich (Arbeitsbedingungen).“ (je Merkmal 1 P.)']}],
 ['30–27','26,5–22,5','22–17,5','17–12,5','12–6','5,5–0'],'Probe_Arbeit');
