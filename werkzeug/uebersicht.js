// Materialübersicht aus der Ordnerstruktur erzeugen
const U=require('./ub.js');const fs=require('fs');const {P,cell,table,doc,save,ROOT}=U;
const dirs=fs.readdirSync(ROOT).filter(d=>/^\d\d_/.test(d)&&d!=='00_Uebersicht').sort();
const nice=f=>f.replace(/\.docx$/,'').replace(/_/g,' ').replace(/Loesung/g,'Lösung').replace(/ue/g,'ü').replace(/Koerper/g,'Körper').replace(/oe/g,'ö').replace(/ae/g,'ä').replace(/Gemüse/g,'Gemüse');
const ch=[P('**Materialübersicht WiB 7 – Lernbereich 2: Arbeit**',{font:'Calibri',size:30,color:'1F6E43',after:120})];
for(const d of dirs){
  const files=fs.readdirSync(`${ROOT}/${d}`).filter(f=>f.endsWith('.docx')).sort();
  ch.push(P(`**${d.replace(/_/g,' ').replace(/ue/g,'ü').replace(/ae/g,'ä').replace(/oe/g,'ö')}**`,{font:'Calibri',size:23,color:'1F6E43',before:140,after:40,keepNext:true}));
  ch.push(table([4200,6266],files.map(f=>[cell(P(f,{font:'Calibri',size:17,after:0}),4200),cell(P(nice(f).replace(/^\d\d /,''),{font:'Calibri',size:19,after:0}),6266)])));
}
ch.push(P('**Bilder** (Ordner „bilder“): Figuren Tim, Selin, Jonas, Lena aus den Berufssteckbriefen; Bildkarten aus Canva (Liste mit Links: canva_links.tsv). Platzhalter „Bild folgt“ werden ersetzt, sobald die Canva-Bilder vorliegen.',{font:'Calibri',size:20,before:200}));
save(doc(ch,{font:'Calibri',margin:720}),`${ROOT}/00_Uebersicht/Materialuebersicht.docx`);
