// WiB 7, LB 2 – Stunde 1: Vier Berufe im Vergleich
const U=require('./ub.js');const {P,H,img,cell,table,line,br,doc,save,NOB,BORD,D}=U;
const {AlignmentType,VerticalAlign}=D;
const ROOT='/home/user/empty/WiB7_LB2_Arbeit',B=ROOT+'/bilder',DIR=ROOT+'/01_Stunde_Vier_Berufe_im_Vergleich';
require('fs').mkdirSync(DIR,{recursive:true});
const KOPF="WiB 7 · Lernbereich 2: Arbeit · Stunde 1";
const FIG=[
 {k:'tim',name:'Tim',beruf:'Kfz-Mechatroniker',col:'1F4E9E',soft:'DCE6F5',ort:'Autowerkstatt',ausb:'3 ½ Jahre'},
 {k:'selin',name:'Selin',beruf:'Medizinische Fachangestellte',col:'0F6E6E',soft:'D6EDEA',ort:'Hausarztpraxis',ausb:'3 Jahre'},
 {k:'jonas',name:'Jonas',beruf:'Kaufmann im Einzelhandel',col:'A4243B',soft:'F6DDE1',ort:'Sportgeschäft',ausb:'3 Jahre'},
 {k:'lena',name:'Lena',beruf:'Köchin',col:'3D6B21',soft:'E0EBD4',ort:'Restaurantküche (Landgasthof)',ausb:'3 Jahre'}];
const KRIT=[
 ['Körperliche Anstrengung','💪'],['Kontakt mit Menschen','🗣'],['Arbeit mit Technik und Geräten','⚙'],
 ['Ungünstige Arbeitszeiten (abends, Wochenende)','🕗'],['Gefahren und Belastungen (Lärm, Hitze, Stress …)','⚠'],['Aufstiegschancen','📈']];
// Lösungsvorschlag: Sterne + Begründung je Beruf
const LSG={
 tim:[[4,'stehen, unter dem Auto, schwere Teile'],[2,'erklärt Kunden die Reparatur'],[5,'Hebebühne, Diagnose-Computer'],[1,'feste Zeiten, Wochenende meist frei'],[4,'laut, kalt, Verletzungen, Hochspannung'],[4,'Meister, Werkstattleiter, selbstständig']],
 selin:[[2,'mal sitzen, mal stehen'],[5,'Empfang, Telefon, Patienten'],[3,'Blutdruckgerät, EKG, Computer'],[2,'bis 18 Uhr, Mittwochnachmittag frei'],[3,'Stress, Ansteckung, trockene Haut'],[3,'Weiterbildung zur Praxismanagerin']],
 jonas:[[3,'stehen, laufen, Kartons heben'],[5,'Kunden beraten, Kasse'],[2,'Kasse, Scanner, Hubwagen'],[4,'Schichtdienst bis 20 Uhr, samstags'],[2,'Stress vor Weihnachten, unfreundliche Kunden'],[4,'Abteilungsleiter, Filialleiter']],
 lena:[[5,'heiß, stehen, schwere Töpfe'],[2,'vor allem im Team, Gäste loben'],[3,'Herd, Fritteuse, Kombidämpfer'],[5,'abends, Wochenende, Feiertage'],[4,'Schnitte, Verbrennungen, Hektik'],[5,'Küchenchefin, eigenes Restaurant, Ausland']]};
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const STARFONT={font:'Segoe UI Symbol'};

// ---------- M1 Folie "Wer sagt das?" ----------
const ZIT=[["Mein wichtigstes Werkzeug ist mein eigenes Messer.",4],["Mit dem Diagnose-Computer finde ich heraus, wo ein Fehler steckt.",1],
 ["Alles, was ich über Patienten erfahre, muss ich geheim halten.",2],["Als Mitarbeiter bekomme ich Rabatt auf Sportsachen.",3],
 ["Im Winter zieht es kalt durch das offene Tor.",1],["Das Telefon klingelt ständig und das Wartezimmer ist voll.",2],
 ["Vor Weihnachten ist der Laden voll – dann wird es stressig.",3],["Ich arbeite oft am Abend, am Wochenende und an Feiertagen.",4]];
function figurReihe(w,size=110,showNum=true){
  const cw=Math.floor(w/4);
  return table([cw,cw,cw,cw],[FIG.map((f,i)=>cell([img(`${B}/Figur_${f.k}.png`,size,size),
    P(`${showNum?(i+1)+'  ':''}**${f.name}**`,{align:AlignmentType.CENTER,size:26,color:f.col,after:0}),P(f.beruf,{align:AlignmentType.CENTER,size:18,after:0})],cw,{borders:NOB}))]);
}
function m1(loesung){
  const W=15300,cw=W/2;
  const zc=(z,i)=>cell([P(`**${i+1}.**  „${z[0]}“`,{size:26,after:40}),
    P(loesung?`→ **${z[1]}  ${FIG[z[1]-1].name}** (${FIG[z[1]-1].beruf})`:'Wer sagt das?   1   2   3   4',{size:20,color:loesung?FIG[z[1]-1].col:'7A8A80',after:0})],cw,{bc:'C9D6CE',fill:i%4<2?'FAFCFB':'FFFFFF'});
  const rows=[];for(let i=0;i<ZIT.length;i+=2) rows.push([zc(ZIT[i],i),zc(ZIT[i+1],i+1)]);
  return doc([P(`**Wer sagt das?**${loesung?'  – Lösung':''}`,{size:44,color:'1F6E43',align:AlignmentType.CENTER,after:60}),
    P('Zeige mit deinen Fingern: 1, 2, 3 oder 4!',{size:24,align:AlignmentType.CENTER,after:120}),
    figurReihe(W,105),P('',{after:80}),table([cw,cw],rows)],{landscape:true,margin:600});
}
save(m1(false),`${DIR}/M1_Folie_Wer_sagt_das.docx`);save(m1(true),`${DIR}/M1_Loesung_Wer_sagt_das.docx`);

// ---------- M2 Berufe-Quartett ----------
function karte(f,i,loesung){
  const W=10466,c=[3100,2300,5066];
  const head=[cell([P(`**${'ABCD'[i]}**   Berufe-Quartett`,{size:20,color:'FFFFFF',after:0}),P(`**${f.name} – ${f.beruf}**`,{size:30,color:'FFFFFF',after:0})],W,{span:3,fill:f.col,bc:f.col})];
  const facts=[cell([img(`${B}/Figur_${f.k}.png`,80,80)],c[0],{valign:VerticalAlign.CENTER,bc:f.col}),
    cell([P(`**Arbeitsort:** ${loesung?f.ort:'______________________________'}`,{size:21,after:80}),
      P(`**Ausbildungsdauer:** ${loesung?f.ausb:'__________'}`,{size:21,after:80}),
      P(`**Typische Tätigkeit:** ${loesung?{tim:'Fehler suchen und reparieren',selin:'Blut abnehmen, Termine vergeben',jonas:'Kunden beraten, kassieren',lena:'Gerichte kochen und anrichten'}[f.k]:'_____________________________________'}`,{size:21,after:0})],c[1]+c[2],{span:2,bc:f.col,valign:VerticalAlign.CENTER})];
  const rows=[head,facts,[cell(P('**Merkmal**',{size:19,after:0}),c[0],{fill:f.soft,bc:f.col}),cell(P('**Sterne (1–5)**',{size:19,after:0}),c[1],{fill:f.soft,bc:f.col}),cell(P('**Begründung (Stichpunkt aus dem Text)**',{size:19,after:0}),c[2],{fill:f.soft,bc:f.col})]];
  KRIT.forEach(([k],j)=>{const l=LSG[f.k][j];
    rows.push([cell(P(k,{size:20,after:0}),c[0],{bc:f.col}),
      cell(P(loesung?stars(l[0]):'☆☆☆☆☆',{size:28,color:loesung?'E0A100':'9AA4AE',after:0,...STARFONT}),c[1],{bc:f.col,valign:VerticalAlign.CENTER}),
      cell(P(loesung?l[1]:'',{size:20,after:0,color:'333333'}),c[2],{bc:f.col})]);});
  return table(c,rows,{height:ri=>ri>=3?500:0});
}
function m2(loesung){
  const ch=[];
  FIG.forEach((f,i)=>{
    if(i%2===0){ if(i) ch.push(br());
      ch.push(P(loesung?'**Berufe-Quartett – Lösungsvorschlag** (Sterne sind Einschätzungen; entscheidend ist die Begründung)':'**Arbeitsauftrag:** Lest euren Steckbrief noch einmal (Text oder Hör-Mindmap). Vergebt für jedes Merkmal **1 bis 5 Sterne** (1 = wenig, 5 = sehr viel) und begründet mit einem Stichpunkt aus dem Text.',{size:20,after:120}));}
    ch.push(karte(f,i,loesung)); ch.push(P('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',{size:18,color:'9AA4AE',align:AlignmentType.CENTER,before:100,after:100}));
  });
  return doc(ch,{kopf:KOPF+' · M2 Berufe-Quartett',margin:720});
}
save(m2(false),`${DIR}/M2_Berufe-Quartett.docx`);save(m2(true),`${DIR}/M2_Loesung_Berufe-Quartett.docx`);

// ---------- M3 Exit-Ticket ----------
function ticket(){
  const w=5133;
  const fig=U.table([1283,1283,1283,1284],[FIG.map(f=>cell([img(`${B}/Figur_${f.k}.png`,46,46,{after:0}),P(`☐ ${f.name}`,{size:18,align:AlignmentType.CENTER,after:0})],1283,{borders:NOB,m:20,mx:20}))]);
  return cell([P('**Exit-Ticket**',{size:26,color:'1F6E43',after:40}),P('Am meisten reizt mich der Arbeitsplatz von:',{size:19,after:20}),fig,
    P('…, weil (Merkmal!):',{size:19,before:60,after:0}),line(4900),line(4900),
    P('Weniger gefällt mir der Arbeitsplatz von',{size:19,before:120,after:0}),P('______________, weil',{size:19,after:0}),line(4900)],w,{bc:'9DB8A8',m:140,mx:160});
}
save(doc([P('**M3 Exit-Ticket** – ausschneiden, ausfüllen, beim Rausgehen abgeben',{size:18,color:'7A8A80',after:100}),
  table([5233,5233],[[ticket(),ticket()],[ticket(),ticket()]])],{margin:600}),`${DIR}/M3_Exit-Ticket.docx`);

// ---------- Tafelbild + Hefteintrag ----------
function vergleich(loesung,W){
  const c0=3000,cw=Math.floor((W-c0)/4);const cs=[c0,cw,cw,cw,W-c0-3*cw];
  const head=[cell(P('**Merkmal**',{size:20,after:0}),c0,{fill:'E6F2EA',valign:VerticalAlign.CENTER}),...FIG.map((f,i)=>cell([img(`${B}/Figur_${f.k}.png`,48,48,{after:0}),P(`**${f.name}**`,{size:18,align:AlignmentType.CENTER,color:f.col,after:0})],cs[i+1],{fill:'E6F2EA'}))];
  const rows=[head,...KRIT.map(([k],j)=>[cell(P(k,{size:19,after:0}),c0,{valign:VerticalAlign.CENTER}),...FIG.map((f,i)=>cell(P(loesung?stars(LSG[f.k][j][0]):'',{size:22,align:AlignmentType.CENTER,color:'E0A100',after:0,...STARFONT}),cs[i+1],{valign:VerticalAlign.CENTER}))])];
  return table(cs,rows,{height:ri=>ri?430:0});
}
const MERK=['Arbeitsplätze unterscheiden sich in ihren [[Arbeitsplatzmerkmalen]]: Tätigkeiten, Arbeitsort, [[Arbeitsmittel]], [[Arbeitsbedingungen]] und Anforderungen.',
 'Jeder Arbeitsplatz hat [[Vorteile]] und [[Nachteile]]. Was für den einen ein Nachteil ist (z. B. Arbeit am Wochenende), stört den anderen kaum.',
 'Welcher Arbeitsplatz zu mir passt, hängt von meinen [[Interessen]], meinen [[Fähigkeiten]] und meinen Wünschen (z. B. Arbeitszeiten) ab.'];
function eintrag(mode){
  U.ctx.mode=mode;const luecke=mode==='luecke';
  const ch=[H('Vier Arbeitsplätze im Vergleich',{size:32}),
    P(luecke?'Übertrage die Sterne von der Tafel.':'Sterne = Einschätzung der Klasse (Beispiel)',{size:18,color:'7A8A80',after:80}),vergleich(!luecke,10466),
    P('',{after:60}),H('Das habe ich gelernt',{size:24}),...MERK.map(m=>P(m,{bullet:true,after:100,line:340}))];
  if(luecke) ch.push(P('**Wortspeicher:** Arbeitsbedingungen · Arbeitsmittel · Arbeitsplatzmerkmalen · Fähigkeiten · Interessen · Nachteile · Vorteile',{size:19,before:120,color:'4A5A50'}));
  ch.push(P(luecke?'**Mein Favorit:** _________________________, weil _________________________________________':'**Mein Favorit:** individuelle Antwort mit Begründung über ein Merkmal',{before:160}));
  U.ctx.mode='tafel';return doc(ch,{kopf:KOPF+(luecke?' · Hefteintrag':' · Tafelbild')});
}
save(eintrag('tafel'),`${DIR}/02_Tafelbild.docx`);save(eintrag('luecke'),`${DIR}/03_Hefteintrag_Lueckentext.docx`);

// ---------- Entwurf ----------
const C={font:'Calibri'};
const E=(s,o={})=>P(s,{...C,size:20,...o});
function verlauf(rows){
  const cs=[800,1500,5000,1300,1866];
  return table(cs,[["Zeit","Phase","Unterrichtsgeschehen","Sozialform","Medien"].map((h,i)=>cell(E(`**${h}**`,{after:0}),cs[i],{fill:'DCEFE3'})),
    ...rows.map(r=>r.map((v,i)=>cell((Array.isArray(v)?v:[v]).map(x=>E(x,{after:40})),cs[i])))],{header:true});
}
const entwurf=doc([
 P('**Stundenentwurf WiB 7 – Stunde 1: Vier Berufe im Vergleich**',{...C,size:30,color:'1F6E43'}),
 E('Lernbereich 2: Arbeit · Dauer: 45 Minuten · Voraussetzung: Arbeitsplatzmerkmale und Berufssteckbriefe (Tim, Selin, Jonas, Lena) sind bekannt'),
 P('**Leitfrage:** Welcher Arbeitsplatz passt zu mir?',{...C,size:22,before:80}),
 P('**Lernziele**',{...C,size:24,color:'1F6E43',before:120}),
 E('Grobziel: Die Schülerinnen und Schüler vergleichen vier Arbeitsplätze mithilfe der Arbeitsplatzmerkmale und beurteilen begründet, welcher Arbeitsplatz sie selbst anspricht.'),
 E('Die Schülerinnen und Schüler …',{after:40}),
 ...['ordnen Aussagen den vier Berufen zu (Wiederholung der Steckbriefe).','schätzen einen Arbeitsplatz in sechs Merkmalen mit Sternen ein und begründen mit Textstellen.','vergleichen die vier Arbeitsplätze und benennen Gemeinsamkeiten und Unterschiede.','beurteilen begründet, welcher Arbeitsplatz sie reizt und welcher weniger.'].map(t=>E(t,{bullet:true,after:20})),
 P('**Verlaufsplan**',{...C,size:24,color:'1F6E43',before:160}),
 verlauf([
  ['5′','Einstieg',['**Zitat-Quiz „Wer sagt das?“**: L zeigt die Folie mit den vier Figuren (1–4) und acht Zitaten. S zeigen mit den Fingern, wer es gesagt hat. Schnelle Auflösung.','Überleitung: „Tim, Selin, Jonas und Lena haben ganz unterschiedliche Arbeitsplätze. Welcher passt zu dir?“ → Leitfrage an die Tafel.'],'Plenum','M1 Folie, Beamer'],
  ['15′','Erarbeitung I',['**Expertengruppen „Berufe-Quartett“**: vier Gruppen (je ein Beruf) füllen ihre Quartett-Karte aus: Arbeitsort, Ausbildungsdauer, typische Tätigkeit und **Sterne (1–5)** für sechs Merkmale, jeweils mit Begründung aus dem Text.','Rollen: Vorleser/-in, Schreiber/-in, Sternrichter/-in, Sprecher/-in.','Differenzierung: schnelle Gruppen schauen auf der Steckbrief-Webseite nach (Mitlesen).'],'GA','M2 (je Gruppe eine Karte), Hefteinträge/Texte der Steckbriefe, ggf. Tablets'],
  ['10′','Erarbeitung II',['**Quartett-Duell**: L nennt ein Merkmal („Wer hat die meisten Sterne bei Arbeitszeiten?“). Die Sprecher/-innen nennen ihre Sterne und den Grund. Die höchste Karte „sticht“. L trägt die Sterne in die Vergleichstabelle an der Tafel ein.','Bei Uneinigkeit: andere Gruppen dürfen Einspruch mit Textbeleg erheben.'],'Plenum','Tafel (Vergleichstabelle)'],
  ['8′','Sicherung',['Gemeinsame Formulierung der Merksätze: Arbeitsplätze unterscheiden sich in den Merkmalen; Vor- und Nachteile hängen von der Person ab.','S übertragen die Sterne und füllen den Lückentext aus.'],'EA','03 Hefteintrag (Lückentext)'],
  ['7′','Beurteilung / Abschluss',['**Punktabfrage**: Jede/r klebt einen Punkt unter die Figur des Lieblingsarbeitsplatzes (Plakate an den vier Wänden oder Magnete an der Tafel).','**Exit-Ticket**: Begründung mit einem Merkmal und ein Arbeitsplatz, der weniger gefällt.','Ausblick: „Nächste Stunde schauen wir genauer hin: Strengt diese Arbeit eher den Körper oder den Kopf an?“'],'EA / Plenum','M4 Plakate, Klebepunkte, M3 Exit-Ticket'],
 ]),
 P('**Didaktische Hinweise**',{...C,size:24,color:'1F6E43',before:160}),
 ...['Die Sterne sind **Einschätzungen**. Abweichungen vom Lösungsvorschlag sind erwünscht, solange sie mit dem Text begründet werden. Genau daraus entsteht das Beurteilen.',
  'Das Quartett-Duell macht den Vergleich spielerisch und hält alle Gruppen aktiv. Wichtig ist, dass bei jedem „Stich“ ein Grund genannt wird.',
  'Die Merkmale greifen die Arbeitsplatzmerkmale auf (Tätigkeiten, Arbeitsmittel, Arbeitsbedingungen, Anforderungen, Gründe) und bereiten Stunde 2 (körperliche Anstrengung) und Stunde 6 (Aufstieg, Selbstständigkeit) vor.',
  'Die Exit-Tickets zeigen, ob die S ihre Wahl mit einem Merkmal begründen können. Gute Beispiele zu Beginn von Stunde 2 kurz vorlesen.'].map(t=>E(t,{bullet:true,after:40})),
 P('**Lösungen**',{...C,size:24,color:'1F6E43',before:160}),
 E('M1: 1 Lena · 2 Tim · 3 Selin · 4 Jonas · 5 Tim · 6 Selin · 7 Jonas · 8 Lena'),
 E('M2: siehe M2_Loesung_Berufe-Quartett (Lösungsvorschlag mit Sternen und Begründungen)'),
 E('Hefteintrag: Arbeitsplatzmerkmalen · Arbeitsmittel · Arbeitsbedingungen · Vorteile · Nachteile · Interessen · Fähigkeiten'),
 P('**Material und Vorbereitung**',{...C,size:24,color:'1F6E43',before:160}),
 ...['M1 als Folie bzw. am Beamer','M2: jede Karte einmal pro Gruppe kopieren (ggf. A3 für das Duell)','M3: eine Seite = vier Tickets','M4 Plakate: vier Seiten (je Beruf eine), am besten auf A3 vergrößert, an die vier Wände oder an die Tafel; Klebepunkte (ein Punkt pro S) oder Magnete'].map(t=>E(t,{bullet:true,after:20})),
],{font:'Calibri',size:20,margin:720});
save(entwurf,`${DIR}/01_Entwurf_Stunde_01.docx`);

// ---------- M4 Plakate Punktabfrage (je Beruf eine Seite, A4 hoch, auf A3 vergrößerbar) ----------
{
  const ch=[];
  FIG.forEach((f,i)=>{
    if(i) ch.push(br());
    ch.push(table([10466],[[cell([P(`**${f.name}**`,{size:96,color:'FFFFFF',align:AlignmentType.CENTER,after:0}),
      P(f.beruf,{size:40,color:'FFFFFF',align:AlignmentType.CENTER,after:0})],10466,{fill:f.col,bc:f.col,m:200})]]));
    ch.push(img(`${B}/Figur_${f.k}.png`,330,330,{before:200,after:160}));
    ch.push(P(`${f.ort} · Ausbildung ${f.ausb}`,{size:30,align:AlignmentType.CENTER,color:'4A5A50',after:200}));
    ch.push(table([10466],[[cell([P('Mein Lieblingsarbeitsplatz?  Klebe hier deinen Punkt!',{size:30,bold:true,color:f.col,align:AlignmentType.CENTER,after:0})],10466,{fill:f.soft,bc:f.col,bs:16,m:160})],
      [cell([P('',{after:0})],10466,{bc:f.col,bs:16})]],{height:ri=>ri?6300:0}));
  });
  save(doc(ch,{margin:600}),`${DIR}/M4_Plakate_Punktabfrage.docx`);
}
