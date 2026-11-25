// WiB 7, LB 2 – Stunde 2: Körperliche und geistige Arbeit
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,D}=U;
const {AlignmentType,VerticalAlign}=D;
const fs=require('fs');
const ROOT='/home/user/empty/WiB7_LB2_Arbeit',B=ROOT+'/bilder',DIR=ROOT+'/02_Stunde_Koerperliche_und_geistige_Arbeit';
fs.mkdirSync(DIR,{recursive:true});
const KOPF="WiB 7 · Lernbereich 2: Arbeit · Stunde 2";
const KOERPER='C75B12',GEIST='2E5FA8',MIX='7A5BA8';
// Bildkarten: Datei, Text, Person, Lösung (k = körperlich, m = gemischt, g = geistig)
const KARTEN=[
 ['S2_01_Reifen_wechseln','Reifen wechseln','Tim','k'],
 ['S2_02_Fehlersuche_Diagnose','Fehler mit dem Diagnose-Computer suchen','Tim','g'],
 ['S2_03_Blut_abnehmen','Blut abnehmen','Selin','m'],
 ['S2_04_Termine_planen','Termine planen und Anrufe annehmen','Selin','g'],
 ['S2_05_Kartons_schleppen','schwere Kartons schleppen','Jonas','k'],
 ['S2_06_Kunden_beraten','Kunden beraten','Jonas','g'],
 ['S2_07_Regale_einraeumen','Regale einräumen','Jonas','k'],
 ['S2_08_Kassieren','an der Kasse kassieren','Jonas','m'],
 ['S2_09_Gemuese_schneiden','Gemüse schneiden','Lena','m'],
 ['S2_10_Rezepte_ausdenken','neue Rezepte ausdenken','Lena','g'],
 ['S2_11_Toepfe_tragen','schwere Töpfe am heißen Herd tragen','Lena','k'],
 ['S2_12_Unter_dem_Auto','unter dem Auto arbeiten','Tim','k']];
const ICON={k:`${B}/S2_Icon_Muskel.png`,g:`${B}/S2_Icon_Kopf.png`};
const FIG={Tim:['tim','1F4E9E'],Selin:['selin','0F6E6E'],Jonas:['jonas','A4243B'],Lena:['lena','3D6B21']};

// ---------- M1 Pantomime-Karten ----------
const PANTO=[['Reifen wechseln','Kfz-Werkstatt'],['schwere Kartons ins Lager tragen','Supermarkt'],['Teig kneten','Bäckerei'],['Gemüse schneiden','Restaurantküche'],
 ['einen Kunden beraten, welche Schuhe passen','Sportgeschäft'],['am Computer eine Rechnung ausrechnen','Büro'],['ein neues Rezept ausdenken','Restaurantküche'],['bei einem Patienten Blutdruck messen','Arztpraxis']];
const pc=(t,i)=>cell([P(`Pantomime ${i+1}`,{size:18,color:'7A8A80',align:AlignmentType.CENTER,after:120}),P(`**${t[0]}**`,{size:34,align:AlignmentType.CENTER,after:120}),P(`(${t[1]})`,{size:20,align:AlignmentType.CENTER,color:'7A8A80',after:60}),
  P('Spiele ohne Worte vor! Die Klasse rät.',{size:17,italics:true,align:AlignmentType.CENTER,color:'7A8A80',after:0})],5233,{bc:'9DB8A8',bs:8,valign:VerticalAlign.CENTER});
const prow=[];for(let i=0;i<8;i+=2) prow.push([pc(PANTO[i],i),pc(PANTO[i+1],i+1)]);
save(doc([P('**M1 Pantomime-Karten** – ausschneiden',{size:18,color:'7A8A80',after:100}),table([5233,5233],prow,{height:()=>3300})],{margin:600}),`${DIR}/M1_Pantomime-Karten.docx`);

// ---------- M2 Bildkarten ----------
function bildkarte(k,w,imgSize,loesung){
  const [f,t,p,l]=k;const [fk,fc]=FIG[p];
  return cell([img(`${B}/${f}.png`,imgSize,imgSize,{after:20}),P(`**${t}**`,{size:20,align:AlignmentType.CENTER,after:0}),
    P(loesung?{k:'körperlich',m:'gemischt',g:'geistig'}[l]:p,{size:16,align:AlignmentType.CENTER,color:loesung?{k:KOERPER,m:MIX,g:GEIST}[l]:fc,after:0,bold:loesung})],w,{bc:'9DB8A8',bs:6,m:60,mx:60});
}
function m2(loesung){
  const cw=3488,rows=[];
  for(let i=0;i<12;i+=3) rows.push([0,1,2].map(j=>bildkarte(KARTEN[i+j],cw,loesung?100:118,loesung)));
  return doc([P(loesung?'**M2 Bildkarten – Lösungsvorschlag**':'**M2 Bildkarten** – ausschneiden und auf die Skala (M3) legen',{size:18,color:'7A8A80',after:100}),table([cw,cw,cw],rows)],{margin:600});
}
save(m2(false),`${DIR}/M2_Bildkarten.docx`);save(m2(true),`${DIR}/M2_Loesung_Bildkarten.docx`);

// ---------- M3 Skala (A4 quer, Partnerarbeit) ----------
function skala(loesung){
  const W=15300,c=[5100,5100,5100];
  const head=[
    cell([img(ICON.k,70,70,{after:0}),P('**überwiegend körperlich**',{size:26,color:KOERPER,align:AlignmentType.CENTER,after:0}),P('Muskelkraft, Geschick, Ausdauer',{size:18,align:AlignmentType.CENTER,after:0})],c[0],{fill:'FBE3D2',bc:KOERPER,bs:10}),
    cell([P('',{after:300}),P('**gemischt**',{size:26,color:MIX,align:AlignmentType.CENTER,after:0}),P('Körper und Kopf',{size:18,align:AlignmentType.CENTER,after:0})],c[1],{fill:'ECE4F5',bc:MIX,bs:10}),
    cell([img(ICON.g,70,70,{after:0}),P('**überwiegend geistig**',{size:26,color:GEIST,align:AlignmentType.CENTER,after:0}),P('Denken, Planen, Rechnen, Beraten',{size:18,align:AlignmentType.CENTER,after:0})],c[2],{fill:'DDE7F6',bc:GEIST,bs:10})];
  const body=['k','m','g'].map((z,i)=>cell(loesung?KARTEN.filter(k=>k[3]===z).map(k=>P(`${k[1]} (${k[2]})`,{bullet:true,size:22,after:60})):[P('',{after:0})],c[i],{bc:[KOERPER,MIX,GEIST][i],bs:10}));
  return doc([P(loesung?'**M3 Skala – Lösungsvorschlag**':'**M3 Körper oder Kopf?**',{size:36,color:'1F6E43',after:40}),
    P(loesung?'Abweichungen sind möglich, wenn sie gut begründet werden.':'Legt die Bildkarten dorthin, wo sie eurer Meinung nach hingehören. Wenn ihr euch einig seid: aufkleben!',{size:20,after:100}),
    P('◀ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ▶',{size:22,color:'9AA4AE',align:AlignmentType.CENTER,after:60}),
    table(c,[head,body],{height:ri=>ri?6200:0})],{landscape:true,margin:600});
}
save(skala(false),`${DIR}/M3_Skala_Koerper_oder_Kopf.docx`);save(skala(true),`${DIR}/M3_Loesung_Skala.docx`);

// ---------- M4 Wie viel Kopf, wie viel Muskel? ----------
const ANT={tim:[6,'Reifen wechseln, unter dem Auto arbeiten, schwere Teile heben','Fehler suchen, Diagnose-Computer, Kunden erklären'],
 selin:[3,'Blut abnehmen, Verbände anlegen, viel auf den Beinen','Termine planen, abrechnen, Patienten beraten, Werte prüfen'],
 jonas:[5,'stehen und laufen, Kartons schleppen, Regale einräumen','Kunden beraten, kassieren und rechnen, Ware bestellen'],
 lena:[7,'schneiden, braten, schwere Töpfe tragen, Hitze','Rezepte ausdenken, Lebensmittel bestellen, Mengen umrechnen']};
const PERS=[['tim','Tim','Kfz-Mechatroniker'],['selin','Selin','Medizinische Fachangestellte'],['jonas','Jonas','Kaufmann im Einzelhandel'],['lena','Lena','Köchin']];
function balken(k,loesung,cw){
  const n=loesung?ANT[k][0]:0;
  return table(Array(10).fill(cw),[Array(10).fill(0).map((_,i)=>cell(P('',{after:0}),cw,{fill:loesung?(i<n?'F3B98F':'A9C3EA'):undefined,bc:'7A8A80',bs:6}))],{height:()=>420});
}
function m4(loesung){
  const ch=[P(loesung?'**M4 Wie viel Muskel, wie viel Kopf? – Lösungsvorschlag**':'**M4 Wie viel Muskel, wie viel Kopf?**',{size:34,color:'1F6E43',after:60}),
    P(loesung?'Die Anteile sind Einschätzungen. Wichtig: Fast jeder Beruf ist eine **Mischform**.':'**Arbeitsauftrag:** Bearbeitet den Beruf, den euch eure Lehrkraft zuteilt. Malt die Kästchen aus: **orange = körperlich**, **blau = geistig** (10 Kästchen = ein ganzer Arbeitstag). Begründet mit je zwei Tätigkeiten. Vergleicht danach mit einem Nachbarpaar, das einen anderen Beruf hat.',{size:20,after:140})];
  PERS.forEach(([k,n,b])=>{
    const [fk,fc]=FIG[n];
    ch.push(table([1500,8966],[[cell([img(`${B}/Figur_${k}.png`,70,70,{after:0})],1500,{borders:NOB,valign:VerticalAlign.CENTER}),
      cell([P(`**${n}** – ${b}`,{size:24,color:fc,after:60}),balken(k,loesung,880),
        P(`💪 **körperlich**, z. B.: ${loesung?ANT[k][1]:''}`,{size:20,before:80,after:0,color:loesung?'333333':undefined}),...(loesung?[]:[line(8700)]),
        P(`🧠 **geistig**, z. B.: ${loesung?ANT[k][2]:''}`,{size:20,before:80,after:0}),...(loesung?[]:[line(8700)])],8966,{borders:NOB})]]));
    ch.push(P('',{after:120}));
  });
  return doc(ch,{kopf:KOPF+' · M4',margin:650});
}
save(m4(false),`${DIR}/M4_Wie_viel_Muskel_wie_viel_Kopf.docx`);save(m4(true),`${DIR}/M4_Loesung_Wie_viel_Muskel_wie_viel_Kopf.docx`);

// ---------- Tafelbild + Hefteintrag ----------
function eintrag(mode){
  U.ctx.mode=mode;const lk=mode==='luecke';
  const c=[3488,3488,3490];
  const sk=table(c,[[
    cell([img(ICON.k,52,52,{after:0}),P('**körperliche Arbeit**',{size:22,color:KOERPER,align:AlignmentType.CENTER,after:0})],c[0],{fill:'FBE3D2',bc:KOERPER,bs:8}),
    cell([P('',{after:160}),P('**gemischt**',{size:22,color:MIX,align:AlignmentType.CENTER,after:0})],c[1],{fill:'ECE4F5',bc:MIX,bs:8}),
    cell([img(ICON.g,52,52,{after:0}),P('**geistige Arbeit**',{size:22,color:GEIST,align:AlignmentType.CENTER,after:0})],c[2],{fill:'DDE7F6',bc:GEIST,bs:8})],
   [cell(lk?[line(3200),line(3200)]:[P('Reifen wechseln',{size:20,after:20}),P('Kartons schleppen',{size:20,after:20}),P('Töpfe tragen',{size:20,after:0})],c[0],{bc:KOERPER,bs:8}),
    cell(lk?[line(3200),line(3200)]:[P('Blut abnehmen',{size:20,after:20}),P('kassieren',{size:20,after:20}),P('Gemüse schneiden',{size:20,after:0})],c[1],{bc:MIX,bs:8}),
    cell(lk?[line(3200),line(3200)]:[P('Fehlersuche am Computer',{size:20,after:20}),P('Kunden beraten',{size:20,after:20}),P('Rezepte ausdenken',{size:20,after:0})],c[2],{bc:GEIST,bs:8})]]);
  const ch=[H('Körperliche und geistige Arbeit',{size:32}),P(lk?'Trage je zwei Beispiele aus der Stunde ein.':'Beispiele aus den Steckbriefen',{size:18,color:'7A8A80',after:60}),sk,P('',{after:80}),
   P('**Körperliche Arbeit:** Man braucht vor allem [[Muskelkraft]], Ausdauer und [[Geschick]] der Hände, z. B. heben, tragen, schrauben, lange stehen.',{after:100,line:340}),
   P('**Geistige Arbeit:** Man braucht vor allem den Kopf: [[denken]], planen, rechnen, beraten und [[entscheiden]].',{after:100,line:340}),
   P('**Merke:** Fast jeder Beruf ist eine [[Mischform]]. Unterschiedlich ist nur der [[Anteil]] von körperlicher und geistiger Arbeit.',{after:100,line:340}),
   P('**Belastungen:** Körperliche Arbeit kann zu [[Rückenschmerzen]] und Erschöpfung führen, geistige Arbeit zu [[Stress]] und Konzentrationsproblemen.',{after:100,line:340})];
  if(lk) ch.push(P('**Wortspeicher:** Anteil · denken · entscheiden · Geschick · Mischform · Muskelkraft · Rückenschmerzen · Stress',{size:19,before:120,color:'4A5A50'}));
  U.ctx.mode='tafel';return doc(ch,{kopf:KOPF+(lk?' · Hefteintrag':' · Tafelbild')});
}
save(eintrag('tafel'),`${DIR}/02_Tafelbild.docx`);save(eintrag('luecke'),`${DIR}/03_Hefteintrag_Lueckentext.docx`);

// ---------- Entwurf ----------
const C={font:'Calibri'};const E=(s,o={})=>P(s,{...C,size:20,...o});
function verlauf(rows){const cs=[800,1500,5000,1300,1866];
  return table(cs,[["Zeit","Phase","Unterrichtsgeschehen","Sozialform","Medien"].map((h,i)=>cell(E(`**${h}**`,{after:0}),cs[i],{fill:'DCEFE3'})),
    ...rows.map(r=>r.map((v,i)=>cell((Array.isArray(v)?v:[v]).map(x=>E(x,{after:40})),cs[i])))],{header:true});}
save(doc([
 P('**Stundenentwurf WiB 7 – Stunde 2: Körperliche und geistige Arbeit**',{...C,size:30,color:'1F6E43'}),
 E('Lernbereich 2: Arbeit · Dauer: 45 Minuten · Inhalt laut LehrplanPLUS: unterschiedliche Kategorien von Arbeit (körperliche und geistige Arbeit)'),
 P('**Leitfrage:** Körper oder Kopf – was strengt bei der Arbeit an?',{...C,size:22,before:80}),
 P('**Lernziele**',{...C,size:24,color:'1F6E43',before:120}),
 E('Grobziel: Die Schülerinnen und Schüler unterscheiden körperliche und geistige Arbeit und erkennen, dass die meisten Berufe Mischformen sind.'),
 E('Die Schülerinnen und Schüler …',{after:40}),
 ...['ordnen Tätigkeiten begründet als überwiegend körperlich, gemischt oder überwiegend geistig ein.','definieren körperliche und geistige Arbeit mit eigenen Worten.','schätzen den Anteil von körperlicher und geistiger Arbeit in einem Beruf ein und begründen mit Beispielen.','nennen typische Belastungen beider Arbeitsformen.'].map(t=>E(t,{bullet:true,after:20})),
 P('**Verlaufsplan**',{...C,size:24,color:'1F6E43',before:160}),
 verlauf([
  ['7′','Einstieg',['Rückblick: zwei gute Exit-Tickets aus Stunde 1 vorlesen.','**Pantomime**: Vier S ziehen nacheinander eine Pantomime-Karte und spielen die Tätigkeit vor, die Klasse rät.','Nach jeder Pantomime: „Was hat sie/er vor allem gebraucht?“ S zeigen **Muskel-Geste** (Arm anspannen) oder tippen an die **Stirn**. Bei „Kunden beraten“ und „Blutdruck messen“ zeigen S oft beides → Problemfrage.','Leitfrage an die Tafel.'],'Plenum','M1 Pantomime-Karten'],
  ['12′','Erarbeitung I',['**Bildkarten-Sortieren**: Partner schneiden die 12 Bildkarten aus den vier Steckbriefen aus und legen sie auf die Skala „körperlich – gemischt – geistig“. Erst legen, diskutieren, dann aufkleben.','Differenzierung: Schnelle Paare ergänzen auf der Rückseite eine eigene Tätigkeit pro Spalte.'],'PA','M2 Bildkarten, M3 Skala (A4 quer), Scheren, Kleber'],
  ['8′','Sicherung I',['Je ein Paar bringt eine Karte an die **Tafel-Skala** (Magnete) und begründet. Strittige Karten (Blut abnehmen, Gemüse schneiden, kassieren) werden diskutiert.','Gemeinsam: Definitionen körperliche / geistige Arbeit; Erkenntnis: **Mischform**.'],'Plenum','Tafel-Skala, vergrößerte Bildkarten'],
  ['12′','Vertiefung',['**„Wie viel Muskel, wie viel Kopf?“**: Jedes Paar bekommt einen der vier Berufe. Es malt 10 Kästchen (= ein Arbeitstag) orange/blau aus und begründet mit je zwei Tätigkeiten.','**Murmelrunde**: Paare vergleichen mit einem Nachbarpaar mit anderem Beruf: Wer hat mehr Orange? Warum?','Impuls: „Was passiert, wenn man nur körperlich / nur geistig arbeitet?“ → Belastungen.'],'PA → 4er-Gruppe','M4'],
  ['6′','Sicherung II / Transfer',['Hefteintrag (Lückentext).','**Haftnotiz-Skala**: S schreiben ihren Wunschberuf oder den Beruf eines Elternteils auf eine Haftnotiz und kleben sie auf die Tafel-Skala; zwei bis drei S begründen.','Ausblick: „Nächste Stunde: Braucht man für jede Arbeit eine Ausbildung?“'],'EA / Plenum','03 Hefteintrag, Haftnotizen'],
 ]),
 P('**Didaktische Hinweise**',{...C,size:24,color:'1F6E43',before:160}),
 ...['Die Pantomime aktiviert die Klasse körperlich und erzeugt selbst den kognitiven Konflikt: Viele Tätigkeiten lassen sich nicht eindeutig zuordnen.',
  'Die Bildkarten stammen aus den bekannten Steckbriefen. Die S können ihr Wissen über Tim, Selin, Jonas und Lena nutzen und müssen keine neuen Berufe kennenlernen.',
  'Bewusst strittige Karten (Blut abnehmen, Gemüse schneiden, kassieren) führen zur Einsicht „Mischform“. Es gibt kein eindeutiges Richtig oder Falsch; die Begründung zählt.',
  'M4 bereitet die spätere Ordnung von Berufen (Stunde 4) vor: Berufe lassen sich nach dem Anteil körperlicher Arbeit sortieren.',
  'Die Haftnotiz-Skala bleibt bis Stunde 4 hängen und wird dort wieder aufgegriffen.'].map(t=>E(t,{bullet:true,after:40})),
 P('**Lösungen**',{...C,size:24,color:'1F6E43',before:160}),
 E('M2/M3: überwiegend körperlich: Reifen wechseln, Kartons schleppen, Regale einräumen, Töpfe tragen, unter dem Auto arbeiten · gemischt: Blut abnehmen, kassieren, Gemüse schneiden · überwiegend geistig: Fehlersuche am Computer, Termine planen, Kunden beraten, Rezepte ausdenken (Vorschlag)'),
 E('M4 (Vorschlag, körperlich/geistig): Tim 6/4 · Selin 3/7 · Jonas 5/5 · Lena 7/3; Begründungen siehe M4_Loesung'),
 E('Hefteintrag: Muskelkraft · Geschick · denken · entscheiden · Mischform · Anteil · Rückenschmerzen · Stress'),
 P('**Material und Vorbereitung**',{...C,size:24,color:'1F6E43',before:160}),
 ...['M1 einmal ausdrucken und ausschneiden','M2 und M3 pro Paar (M3 als A4 quer, gern A3)','Bildkarten für die Tafel vergrößert (A5) ausdrucken und mit Magneten versehen','M4 pro Paar; Buntstifte orange und blau','Haftnotizen'].map(t=>E(t,{bullet:true,after:20})),
],{font:'Calibri',size:20,margin:720}),`${DIR}/01_Entwurf_Stunde_02.docx`);
