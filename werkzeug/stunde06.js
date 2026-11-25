// WiB 7, LB 2 – Stunde 6: Angestellt oder selbstständig?
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;
const DIR=ROOT+'/06_Stunde_Angestellt_oder_selbststaendig';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 6';
const AC='1F4E9E',SC='B26A00';

// M1 Einstiegsfolie
save(doc([P('**Lenas Traum**',{size:48,color:'1F6E43',align:AlignmentType.CENTER,after:100}),
  table([5000,10300],[[cell([img(`${B}/Figur_lena.png`,230,230)],5000,{borders:NOB,valign:VerticalAlign.CENTER}),
   cell([table([10000],[[cell([P('„Heute koche ich im Landgasthof Huber. Aber in fünf Jahren habe ich mein **eigenes Restaurant**. Dann bin ich meine **eigene Chefin**!“',{size:36,after:0})],10000,{bc:'3D6B21',bs:12,fill:'F2F8EE',m:240})]]),
    P('',{after:200}),
    table([4900,200,4900],[[cell(P('**Lena heute:** angestellte Köchin',{size:28,color:'FFFFFF',align:AlignmentType.CENTER,after:0}),4900,{fill:AC,bc:AC,m:160}),cell(P('',{after:0}),200,{borders:NOB}),
     cell(P('**Lena in 5 Jahren:** Restaurantbesitzerin',{size:28,color:'FFFFFF',align:AlignmentType.CENTER,after:0}),4900,{fill:SC,bc:SC,m:160})]])],10300,{borders:NOB,valign:VerticalAlign.CENTER})]]),
  P('**Was ändert sich für Lena, wenn sie ihre eigene Chefin ist?**',{size:34,align:AlignmentType.CENTER,before:240})],{landscape:true,margin:600}),`${DIR}/M1_Folie_Lenas_Traum.docx`);

// M2 Partnerpuzzle-Texte
const TA=['**Lena heute: angestellte Köchin im Landgasthof Huber**',
 'Lena hat einen **Arbeitsvertrag** mit dem Landgasthof Huber. Darin steht: 40 Stunden pro Woche und 30 Tage Urlaub im Jahr.',
 'Jeden Monat bekommt Lena ihren **Lohn**, ungefähr 2.400 Euro brutto. Das Geld kommt immer, egal ob viele oder wenige Gäste da waren.',
 'Was gekocht wird und wann Lena arbeitet, bestimmen der Küchenchef und ihr Chef, Herr Huber. Lena muss sich an ihre **Anweisungen** halten.',
 'Wenn Lena krank ist, bekommt sie ihren Lohn trotzdem weiter. Um Miete, Steuern, Einkauf und Personal muss sie sich nicht kümmern.',
 'Nach ihrer Schicht hat Lena Feierabend. Sie sagt: „Manchmal würde ich gern mehr mitbestimmen. Aber ich kann gut schlafen.“'];
const TB=['**Lena in fünf Jahren: Chefin von „Lenas Landküche“**',
 'Lena ist jetzt **selbstständig**. Für Küche und Einrichtung hat sie bei der Bank einen **Kredit** über 80.000 Euro aufgenommen.',
 'Lena **bestimmt selbst**: die Speisekarte, die Öffnungszeiten und wen sie einstellt. Drei Mitarbeiter arbeiten für sie.',
 'Ihr Einkommen ist der **Gewinn**: das Geld, das übrig bleibt, wenn Miete, Lebensmittel, Löhne und Kredit bezahlt sind. Im Sommer verdient sie gut, im Januar fast nichts.',
 'Oft arbeitet sie 60 Stunden pro Woche. Abends macht sie Buchhaltung und Bestellungen. Urlaub gibt es nur, wenn das Restaurant geschlossen ist. Für Krankheit muss sie selbst vorsorgen.',
 'Läuft das Restaurant schlecht, kann sie ihr Geld verlieren. Trotzdem sagt sie stolz: „Das ist **mein** Restaurant. Meine Ideen, mein Erfolg.“'];
function textKarte(t,c,lab){return table([10466],[[cell([P(`**${lab}**`,{size:20,color:'FFFFFF',after:0})],10466,{fill:c,bc:c})],[cell(t.map((x,i)=>P(x,{size:i?23:26,after:120,line:330})),10466,{bc:c,bs:10,m:200})]]);}
save(doc([P('**M2 Partnerpuzzle: Zwei Wege für Lena**',{size:30,color:'1F6E43',after:60}),
  P('**1.** Partner A liest Text A, Partner B liest Text B. **2.** Füllt in der Tabelle (M3) **eure** Spalte aus. **3.** Erklärt euch gegenseitig euren Text und ergänzt die andere Spalte.',{size:20,after:160}),
  textKarte(TA,AC,'Text A – für Partner A'),P('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',{size:18,color:'9AA4AE',align:AlignmentType.CENTER,before:120,after:120}),
  textKarte(TB,SC,'Text B – für Partner B')],{kopf:KOPF+' · M2',margin:650}),`${DIR}/M2_Partnerpuzzle_Texte.docx`);

// M3 Vergleichstabelle + Lösung
const VG=[['Einkommen','fester Lohn jeden Monat (ca. 2.400 €)','Gewinn, schwankt (Sommer gut, Januar fast nichts)'],
 ['Wer bestimmt?','Chef und Küchenchef geben Anweisungen','Lena bestimmt selbst (Speisekarte, Zeiten, Personal)'],
 ['Arbeitszeit und Urlaub','40 Stunden, 30 Tage Urlaub, Feierabend','oft 60 Stunden, Urlaub nur bei Schließung'],
 ['Risiko','gering, Lohn kommt sicher','hoch: Kredit, kann Geld verlieren'],
 ['Bei Krankheit','Lohn wird weitergezahlt','muss selbst vorsorgen'],
 ['Verantwortung','für die eigene Arbeit','für den ganzen Betrieb und drei Mitarbeiter']];
function m3(l){const cs=[2400,4033,4033];
 return doc([P(`**M3 Angestellt oder selbstständig?**${l?' – Lösung':''}`,{size:30,color:'1F6E43',after:120}),
  table(cs,[[cell(P('',{after:0}),cs[0],{fill:'F2F5F3'}),cell(P('**A: Lena als angestellte Köchin**',{size:21,color:AC,after:0}),cs[1],{fill:'E4ECF8'}),cell(P('**B: Lena als Restaurantbesitzerin**',{size:21,color:SC,after:0}),cs[2],{fill:'FBF0DE'})],
   ...VG.map(v=>[cell(P(`**${v[0]}**`,{size:21,after:0}),cs[0],{fill:'F2F5F3',valign:VerticalAlign.CENTER}),cell(P(l?v[1]:'',{size:20,after:0}),cs[1]),cell(P(l?v[2]:'',{size:20,after:0}),cs[2])])],{height:ri=>ri?1250:0}),
  P('**Was würdest du an Lenas Stelle tun? Begründe.**',{size:21,before:220,after:0}),...(l?[P('individuelle Antwort mit Begründung (Vor- und Nachteile abwägen)',{size:20})]:[line(10400),line(10400),line(10400)])],{kopf:KOPF+' · M3',margin:650});}
save(m3(false),`${DIR}/M3_Vergleichstabelle.docx`);save(m3(true),`${DIR}/M3_Loesung_Vergleichstabelle.docx`);

// M4 Folie „Wer ist selbstständig?“ (Raumseiten-Spiel)
const PERS=[['Frau Yilmaz hat einen eigenen Friseursalon mit zwei Angestellten.','s'],['Herr Maier ist Busfahrer bei den Stadtwerken.','a'],['Tim repariert Autos in der Werkstatt von Herrn Schulz.','a'],
 ['Frau Dr. Wagner führt eine eigene Hausarztpraxis.','s'],['Selin arbeitet als Medizinische Fachangestellte bei Frau Dr. Wagner.','a'],['Herr Brandl ist Malermeister mit eigener Firma.','s'],
 ['Jonas verkauft Sportschuhe in einer großen Filiale.','a'],['Frau Huber bietet als Fotografin ihre Dienste auf eigene Rechnung an.','s']];
function m4(l){const W=15300;
 return doc([P(`**Wer ist selbstständig?**${l?' – Lösung':''}`,{size:42,color:'1F6E43',align:AlignmentType.CENTER,after:40}),
  P('Fensterseite = **angestellt**  ·  Türseite = **selbstständig**',{size:28,align:AlignmentType.CENTER,after:140}),
  table(l?[700,11300,3300]:[700,14600],PERS.map(([t,r],i)=>[cell(P(`**${i+1}.**`,{size:28,after:0}),700,{valign:VerticalAlign.CENTER}),cell(P(t,{size:28,after:0}),l?11300:14600,{valign:VerticalAlign.CENTER}),
   ...(l?[cell(P(r==='s'?'**selbstständig**':'**angestellt**',{size:24,color:r==='s'?SC:AC,after:0}),3300,{fill:r==='s'?'FBF0DE':'E4ECF8',valign:VerticalAlign.CENTER})]:[])]),{height:()=>800})],{landscape:true,margin:600});}
save(m4(false),`${DIR}/M4_Folie_Wer_ist_selbststaendig.docx`);save(m4(true),`${DIR}/M4_Loesung_Wer_ist_selbststaendig.docx`);

// Tafelbild / Hefteintrag
U.eintraege(DIR,KOPF,'Angestellt oder selbstständig?',mode=>{
  const cs=[2400,4033,4033];
  const r=(k,a,s)=>[cell(P(`**${k}**`,{size:20,after:0}),cs[0],{fill:'F2F5F3'}),cell(P(a,{size:20,after:0}),cs[1]),cell(P(s,{size:20,after:0}),cs[2])];
  return [table(cs,[[cell(P('',{after:0}),cs[0],{fill:'F2F5F3'}),cell(P('**abhängig beschäftigt** (Arbeitnehmer/-in)',{size:21,color:AC,after:0}),cs[1],{fill:'E4ECF8'}),cell(P('**selbstständig** (Unternehmer/-in)',{size:21,color:SC,after:0}),cs[2],{fill:'FBF0DE'})],
    r('Einkommen','fester [[Lohn]] bzw. Gehalt','[[Gewinn]], schwankt'),
    r('Entscheidungen','Arbeitgeber gibt [[Anweisungen]]','entscheidet [[selbst]]'),
    r('Arbeitszeit','geregelt (Arbeitsvertrag), bezahlter Urlaub','oft sehr lang, Urlaub selbst einplanen'),
    r('Risiko','gering','hoch: kann Geld [[verlieren]]'),
    r('Krankheit','Lohn wird weitergezahlt','muss selbst [[vorsorgen]]'),
    r('Verantwortung','für die eigene Arbeit','für Betrieb und [[Mitarbeiter]]'),
    r('Beispiele','Lena heute, Tim, Selin, Jonas','Lena in 5 Jahren, Ärztin mit Praxis')],{height:()=>520}),
   P('',{after:60}),
   P('**Merke:** Die meisten Menschen in Deutschland sind [[Arbeitnehmer]]. Selbstständige tragen mehr Risiko, dafür können sie ihre Ideen verwirklichen.',{after:100,line:340})];
},'Anweisungen · Arbeitnehmer · Gewinn · Lohn · Mitarbeiter · selbst · verlieren · vorsorgen');

save(U.entwurf({nr:6,titel:'Angestellt oder selbstständig?',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Inhalt laut LehrplanPLUS: abhängige Beschäftigung und unternehmerische Selbstständigkeit',
 leitfrage:'Was ändert sich, wenn ich mein eigener Chef bin?',
 grob:'Die Schülerinnen und Schüler unterscheiden abhängige Beschäftigung und unternehmerische Selbstständigkeit und wägen Vor- und Nachteile ab.',
 fein:['entnehmen zwei Texten Merkmale abhängiger Beschäftigung und der Selbstständigkeit.','vergleichen beide Formen in sechs Kriterien.','ordnen Personen begründet zu.','nehmen begründet Stellung, ob sie selbst selbstständig sein möchten.'],
 verlauf:[
  ['5′','Einstieg',['**Folie „Lenas Traum“**: Lena möchte in fünf Jahren ihr eigenes Restaurant. Impuls: „Was ändert sich für Lena?“','S äußern Vermutungen (mehr Geld, mehr Arbeit, Chefin sein). Leitfrage.'],'Plenum','M1 Folie'],
  ['15′','Erarbeitung',['**Partnerpuzzle**: Partner A liest „Lena heute“, Partner B „Lena als Chefin“. Jeder füllt seine Spalte der Vergleichstabelle aus.','Danach erklären sich die Partner ihre Texte und ergänzen die andere Spalte.','Zusatz: Was würdest du an Lenas Stelle tun?'],'EA → PA','M2 Texte, M3 Tabelle'],
  ['10′','Sicherung',['Vergleich im Plenum, Fachbegriffe einführen: abhängig beschäftigt (Arbeitnehmer/-in) – selbstständig (Unternehmer/-in).','Lückentext.'],'Plenum / EA','Tafel, 03 Hefteintrag'],
  ['8′','Übung',['**„Wer ist selbstständig?“** L liest acht Personen vor. S gehen zur Fensterseite (angestellt) oder zur Türseite (selbstständig). Bei Uneinigkeit begründen.'],'Plenum (Bewegung)','M4 Folie'],
  ['7′','Abschluss',['**Positionslinie** quer durch den Raum: „Ich möchte später selbstständig sein.“ (stimmt genau – stimmt gar nicht)','Drei bis vier S begründen ihre Position mit einem Merkmal aus der Tabelle.'],'Plenum','–']],
 hinweise:['Lena aus den Steckbriefen trägt die ganze Stunde. Ihr Wunsch nach einem eigenen Restaurant steht bereits im Steckbrief (Text 4).',
  'Das Partnerpuzzle sorgt dafür, dass jedes Paar beide Seiten kennenlernt und erklären muss.',
  'Die Stunde enthält zwei Bewegungsphasen (Raumseiten, Positionslinie). Das ist bewusst so, weil die Erarbeitung textlastig ist.',
  'Zahlen (Lohn, Kredit) sind Beispielwerte zur Veranschaulichung.'],
 loesungen:['M3: siehe M3_Loesung','M4: selbstständig: 1, 4, 6, 8 · angestellt: 2, 3, 5, 7',
  'Hefteintrag: Lohn · Gewinn · Anweisungen · selbst · verlieren · vorsorgen · Mitarbeiter · Arbeitnehmer'],
 material:['M1, M4 als Folie','M2: Texte A und B auseinanderschneiden, pro Paar je einen Text','M3 pro S','Raumseiten beschriften: „angestellt“ (Fenster), „selbstständig“ (Tür)']}),`${DIR}/01_Entwurf_Stunde_06.docx`);
