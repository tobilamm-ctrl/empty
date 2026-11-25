// WiB 7, LB 2 – Stunde 4: Berufe ordnen
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D,B,ROOT}=U;
const {AlignmentType,VerticalAlign}=D;
const DIR=ROOT+'/04_Stunde_Berufe_ordnen';require('fs').mkdirSync(DIR,{recursive:true});
const KOPF='WiB 7 · Lernbereich 2: Arbeit · Stunde 4';
const BER=[['Gärtner/-in','pflanzt und pflegt Pflanzen in Parks und Gärten'],['Dachdecker/-in','deckt Dächer und arbeitet in großer Höhe'],['Landwirt/-in','bestellt Felder, versorgt Tiere, fährt Traktor'],
 ['Straßenbauer/-in','baut Straßen mit Walze und Bagger'],['Maurer/-in','mauert Wände auf der Baustelle'],['Berufskraftfahrer/-in','fährt Lkw und liefert Waren aus'],
 ['Industriemechaniker/-in','baut und wartet Maschinen in der Fabrik'],['Maschinen- und Anlagenführer/-in','bedient große Produktionsmaschinen'],['Tischler/-in (Schreiner/-in)','baut Möbel mit Kreissäge und Fräse'],
 ['Elektroniker/-in','verlegt Leitungen und schließt Geräte an'],['Kfz-Mechatroniker/-in','repariert Autos in der Werkstatt (wie Tim)'],['Bäcker/-in','backt Brot und Brezen, beginnt nachts'],
 ['Koch/Köchin','kocht in der Restaurantküche (wie Lena)'],['Friseur/-in','schneidet und färbt Haare, berät Kunden'],['Kaufmann/-frau im Einzelhandel','berät und verkauft (wie Jonas)'],
 ['Medizinische/-r Fachangestellte/-r','arbeitet in der Arztpraxis (wie Selin)'],['Pflegefachmann/-frau','pflegt kranke und alte Menschen'],['Kinderpfleger/-in','betreut Kinder im Kindergarten'],
 ['Kaufmann/-frau für Büromanagement','schreibt E-Mails und plant Termine am Computer'],['Fachinformatiker/-in','richtet Computer und Netzwerke ein'],['Bankkaufmann/-frau','berät Kunden zu Konten und Geld'],
 ['Tierpfleger/-in','füttert und pflegt Tiere im Zoo oder Tierheim'],['Fachkraft für Lagerlogistik','nimmt Waren an und fährt Gabelstapler'],['Hotelfachmann/-frau','empfängt Gäste und richtet Zimmer her']];

// M1 Berufekarten (24 Stück, 3 x 8)
{const cw=3488,rows=[];
 for(let i=0;i<24;i+=3) rows.push([0,1,2].map(j=>cell([P(`**${BER[i+j][0]}**`,{size:22,align:AlignmentType.CENTER,after:40}),P(BER[i+j][1],{size:17,align:AlignmentType.CENTER,color:'4A5A50',after:0})],cw,{bc:'9DB8A8',bs:6,valign:VerticalAlign.CENTER})));
 save(doc([P('**M1 Berufekarten** – pro Gruppe ein Satz, ausschneiden und in einen Umschlag stecken',{size:18,color:'7A8A80',after:100}),table([cw,cw,cw],rows,{height:()=>1680})],{margin:600}),`${DIR}/M1_Berufekarten.docx`);}

// M2 Gruppenauftrag + Kriterienkarten
{const cw=5233;
 const kk=()=>cell([P('Gruppe:',{size:20,color:'7A8A80',after:0}),line(4900),P('',{after:120})],cw,{bc:'1F6E43',bs:10,fill:'F2F8F4'});
 save(doc([
  table([10466],[[cell([P('**M2 Bringt Ordnung ins Berufe-Chaos!**',{size:32,color:'1F6E43',after:80}),
   ...['Legt alle 24 Berufekarten auf den Tisch.','Überlegt: **Nach welchem Merkmal** könnt ihr die Berufe sortieren? Bildet **mindestens drei Gruppen**.','Schreibt für jede Gruppe eine **Überschrift** auf eine Kriterienkarte (unten), aber dreht sie zunächst um!','Ihr habt noch Zeit? Findet ein **zweites** Merkmal und sortiert neu.','**Kriterium-Raten:** Andere Gruppen kommen zu euch und raten, nach welchem Merkmal ihr sortiert habt.']
    .map((t,i)=>P(`**${i+1}.** ${t}`,{size:22,after:80}))],10466,{bc:'1F6E43',bs:12,m:200})]]),
  P('**Unser Merkmal (Kriterium):** ___________________________________________',{size:24,before:240,after:200}),
  P('**Kriterienkarten** – ausschneiden und über eure Berufe-Gruppen legen',{size:18,color:'7A8A80',after:80}),
  table([cw,cw],[[kk(),kk()],[kk(),kk()]])],{margin:650}),`${DIR}/M2_Gruppenauftrag.docx`);}

// M3 Wer passt nicht? + Lösung
const ODD=[['Gärtner/-in','Dachdecker/-in','Landwirt/-in','Bankkaufmann/-frau',3,'Arbeit im Freien'],
 ['Maschinen- und Anlagenführer/-in','Tischler/-in','Industriemechaniker/-in','Friseur/-in',3,'viel Maschinenarbeit'],
 ['Pflegefachfrau','Kinderpfleger/-in','Fachinformatiker/-in','Medizinische Fachangestellte',2,'Arbeit mit Menschen'],
 ['Kauffrau für Büromanagement','Maurer/-in','Fachinformatiker/-in','Bankkaufmann/-frau',1,'Arbeit am Computer, in Räumen'],
 ['Bäcker/-in','Koch/Köchin','Elektroniker/-in','Hotelfachfrau',2,'Gastronomie, Lebensmittel'],
 ['Tierpfleger/-in','Berufskraftfahrer/-in','Landwirt/-in','Gärtner/-in',1,'Arbeit mit Tieren und Pflanzen']];
function m3(l){
  const cs=[600,2050,2050,2050,2050,1666];
  const rows=[[cell(P('',{after:0}),cs[0],{fill:'DCEFE3'}),cell(P('**Welcher Beruf passt nicht? Streiche ihn durch!**',{size:20,after:0}),cs[1]*4,{span:4,fill:'DCEFE3'}),cell(P('**Gemeinsames Merkmal der anderen**',{size:18,after:0}),cs[5],{fill:'DCEFE3'})],
   ...ODD.map((o,i)=>[cell(P(`**${i+1}**`,{size:24,align:AlignmentType.CENTER,after:0}),cs[0],{valign:VerticalAlign.CENTER}),
     ...[0,1,2,3].map(j=>cell(P(o[j],{size:19,align:AlignmentType.CENTER,after:0,color:l&&j===o[4]?'C62828':undefined,bold:l&&j===o[4]}),cs[j+1],{valign:VerticalAlign.CENTER,fill:l&&j===o[4]?'FBE3E3':undefined})),
     cell(P(l?o[5]:'',{size:18,after:0}),cs[5],{valign:VerticalAlign.CENTER})])];
  return doc([P(`**M3 Wer passt nicht?**${l?' – Lösung':''}`,{size:32,color:'1F6E43',after:60}),
   P('In jeder Reihe passen drei Berufe zusammen. Ein Beruf passt nicht dazu. Finde ihn und schreibe das gemeinsame Merkmal der anderen drei in die letzte Spalte.',{size:20,after:120}),
   table(cs,rows,{height:ri=>ri?1000:0}),
   P('**Knobelaufgabe:** Denke dir selbst eine Reihe aus und lass sie deinen Nachbarn lösen.',{size:20,before:200,after:0}),...(l?[]:[line(10400),line(10400)])],{kopf:KOPF+' · M3',margin:650});
}
save(m3(false),`${DIR}/M3_Wer_passt_nicht.docx`);save(m3(true),`${DIR}/M3_Loesung_Wer_passt_nicht.docx`);

// Tafelbild / Hefteintrag
U.eintraege(DIR,KOPF,'Berufe ordnen',mode=>{
  const cs=[3488,3488,3490];
  const box=(t,inh,c,f)=>cell([P(`**${t}**`,{size:21,color:c,after:40}),...inh.map(x=>P(x,{size:20,after:20}))],3488,{fill:f,bc:c,bs:8});
  return [P('Berufe kann man nach verschiedenen **Merkmalen (Kriterien)** in Gruppen einteilen. So entsteht eine [[Ordnungssystematik]].',{after:120,line:340}),
   table(cs,[[box('Arbeitsort',['[[im Freien]] (Gärtner, Dachdecker)','in [[geschlossenen Räumen]] (Bankkauffrau)','beides (Kfz-Mechatroniker)'],'1F4E9E','EAF0FA'),
     box('Arbeitsmittel',['[[viel Maschinenarbeit]] (Anlagenführer)','wenig Maschinen (Friseurin)'],'B26A00','FBF0DE'),
     box('Arbeit mit …',['[[Menschen]] (Pflegefachfrau)','Sachen (Tischler)','Daten / Computer (Fachinformatiker)','Tieren und Pflanzen (Gärtnerin)'],'0F6E6E','E5F3F1')],
    [box('Art der Arbeit',['überwiegend [[körperlich]]','überwiegend geistig','(Stunde 2)'],'C75B12','FBE7DA'),
     box('Ausbildung',['gelernt','angelernt','(Stunde 3)'],'2E7D32','E6F3E7'),
     box('Berufsfeld',['Bau, Handwerk, Gesundheit, Handel, Gastronomie, Büro …'],'7A5BA8','F0EBF7')]]),
   P('',{after:60}),
   P('**Merke:** Derselbe Beruf kann je nach Merkmal in [[verschiedene]] Gruppen gehören. Die Köchin arbeitet z. B. in Räumen, körperlich und mit Lebensmitteln.',{after:100,line:340}),
   P('**Unsere eigene Ordnung (Gruppe):** Merkmal: ______________________ Gruppen: _______________________________________',{size:20,before:120})];
},'geschlossenen Räumen · im Freien · körperlich · Menschen · Ordnungssystematik · verschiedene · viel Maschinenarbeit');

save(U.entwurf({nr:4,titel:'Berufe ordnen',
 info:'Lernbereich 2: Arbeit · Dauer: 45 Minuten · Inhalt laut LehrplanPLUS: Ordnungssystematiken für Berufe (z. B. im Freien oder in geschlossenen Räumen, viel Maschinenarbeit)',
 leitfrage:'Nach welchen Merkmalen kann man Berufe sortieren?',
 grob:'Die Schülerinnen und Schüler ordnen Berufe in einfache Ordnungssystematiken ein, die sie weitgehend selbstständig formulieren.',
 fein:['entwickeln in der Gruppe ein eigenes Ordnungskriterium und bilden passende Gruppen.','erkennen das Ordnungskriterium anderer Gruppen.','nennen verschiedene Kriterien (Arbeitsort, Maschinenarbeit, Arbeitsgegenstand, Art der Arbeit, Ausbildung).','wenden Kriterien an, indem sie unpassende Berufe in einer Reihe erkennen.'],
 verlauf:[
  ['5′','Einstieg',['**Berufe-Chaos**: An der Tafel hängen ungeordnet 12 der Berufekarten. L: „Hier herrscht Chaos. Wie könnten wir aufräumen?“','S nennen erste Ideen (z. B. „alle mit Autos“). Leitfrage an die Tafel.'],'Plenum','Berufekarten (vergrößert) an der Tafel'],
  ['15′','Erarbeitung',['**Lege-Methode** in 4er-Gruppen: Jede Gruppe erhält 24 Berufekarten und findet ein eigenes Merkmal, nach dem sie mindestens drei Gruppen bildet.','Die Überschriften werden auf Kriterienkarten geschrieben und **verdeckt** gelegt.','Schnelle Gruppen sortieren nach einem zweiten Merkmal.'],'GA','M1 Berufekarten (Umschlag), M2 Gruppenauftrag mit Kriterienkarten'],
  ['10′','Präsentation',['**Kriterium-Raten**: Die Gruppen wandern im Uhrzeigersinn zum nächsten Tisch und raten, nach welchem Merkmal dort sortiert wurde. Danach werden die Kriterienkarten umgedreht.','Plenum: L sammelt die gefundenen Merkmale an der Tafel.'],'GA / Plenum','Gruppentische, Tafel'],
  ['8′','Sicherung',['L ordnet die Merkmale der S den Oberbegriffen zu: Arbeitsort, Arbeitsmittel, Arbeit mit …, Art der Arbeit, Ausbildung, Berufsfeld.','Erkenntnis: Ein Beruf kann je nach Merkmal in verschiedene Gruppen gehören.','S füllen den Lückentext aus und notieren die eigene Gruppenordnung.'],'Plenum / EA','03 Hefteintrag'],
  ['7′','Übung / Abschluss',['**Wer passt nicht?** S finden in jeder Reihe den unpassenden Beruf und benennen das gemeinsame Merkmal der anderen. Zwei Reihen gemeinsam, Rest als Hausaufgabe.','Optional: Haftnotiz-Skala aus Stunde 2 nach dem Merkmal „im Freien / in Räumen“ umsortieren.'],'EA / Plenum','M3'] ],
 hinweise:['Die S sollen ihre Ordnungssystematik **weitgehend selbstständig formulieren** (Kompetenzerwartung). Deshalb gibt L in der Erarbeitung keine Kriterien vor.',
  'Das Kriterium-Raten zwingt die Gruppen, eindeutig zu sortieren, und macht die Präsentation spielerisch.',
  'Zu erwartende Kriterien: drinnen/draußen, mit Menschen/Sachen, Maschinen, Fahrzeuge, Essen, Computer, schmutzig/sauber, viel/wenig Lohn. Unscharfe Kriterien (z. B. „cool/langweilig“) im Gespräch hinterfragen: Kann man das an einem Merkmal festmachen?',
  'Hinweis auf das Berufsinformationsportal planet-beruf.de: Dort sind Berufe ebenfalls nach Berufsfeldern geordnet.'],
 loesungen:['M3: 1 Bankkaufmann (Arbeit im Freien) · 2 Friseur (viel Maschinenarbeit) · 3 Fachinformatiker (Arbeit mit Menschen) · 4 Maurer (Arbeit am Computer, in Räumen) · 5 Elektroniker (Gastronomie, Lebensmittel) · 6 Berufskraftfahrer (Arbeit mit Tieren und Pflanzen)',
  'Hefteintrag: Ordnungssystematik · im Freien · geschlossenen Räumen · viel Maschinenarbeit · Menschen · körperlich · verschiedene'],
 material:['M1 pro Gruppe ein Satz im Umschlag; einen Satz vergrößert für die Tafel','M2 pro Gruppe','M3 pro S']}),`${DIR}/01_Entwurf_Stunde_04.docx`);
