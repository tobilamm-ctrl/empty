// Bausteine für Unterrichtsdokumente (docx). Formatierung im Text:
// **fett**, ~kursiv~, [[Wort]] = fett (Tafelbild) bzw. Lücke (Hefteintrag, mode "luecke")
const fs=require('fs');
const D=require('docx');
const {Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,AlignmentType,ShadingType,ImageRun,VerticalAlign,LevelFormat,PageOrientation,HeightRule,PageBreak}=D;
const ctx={font:"Comic Sans MS",size:22,mode:"tafel"};
function runs(s,o={}){
  const font=o.font||ctx.font,size=o.size||ctx.size,color=o.color;
  const out=[];
  for(const part of String(s).split(/(\*\*[^*]+\*\*|~[^~]+~|\[\[[^\]]+\]\])/).filter(x=>x!=="")){
    if(part.startsWith("**")) out.push(new TextRun({text:part.slice(2,-2),bold:true,font,size,color}));
    else if(part.startsWith("~")) out.push(new TextRun({text:part.slice(1,-1),italics:true,font,size,color}));
    else if(part.startsWith("[[")){
      const w=part.slice(2,-2);
      if((o.mode||ctx.mode)==="luecke") out.push(new TextRun({text:"_".repeat(Math.max(8,Math.round(w.length*1.6))),font,size,color:"808080"}));
      else out.push(new TextRun({text:w,bold:true,font,size,color:o.keyColor||color}));
    } else out.push(new TextRun({text:part,font,size,color,bold:o.bold,italics:o.italics}));
  }
  return out;
}
const P=(s,o={})=>new Paragraph({children:runs(s,o),alignment:o.align,spacing:{before:o.before??0,after:o.after??100,line:o.line},
  ...(o.bullet?{numbering:{reference:"b",level:0}}:{}),...(o.num?{numbering:{reference:o.num,level:0}}:{}),keepNext:o.keepNext});
const H=(s,o={})=>new Paragraph({children:runs(s,{bold:true,size:o.size||28,color:o.color||"1F6E43",font:o.font}),spacing:{before:o.before??160,after:o.after??100},keepNext:true});
const img=(file,w,h,o={})=>new Paragraph({alignment:o.align||AlignmentType.CENTER,spacing:{after:o.after??60,before:o.before??0},
  children:[new ImageRun({type:"png",data:fs.readFileSync(file),transformation:{width:w,height:h}})]});
const bd=(c="9DB8A8",s=4)=>({style:BorderStyle.SINGLE,size:s,color:c});
const none={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const BORD=(c,s)=>({top:bd(c,s),bottom:bd(c,s),left:bd(c,s),right:bd(c,s)});
const NOB={top:none,bottom:none,left:none,right:none};
function cell(children,w,o={}){
  if(!Array.isArray(children)) children=[children];
  children=children.map(c=>typeof c==="string"?P(c,o.p||{}):c);
  return new TableCell({width:{size:w,type:WidthType.DXA},children,columnSpan:o.span,rowSpan:o.rowSpan,
    borders:o.borders||BORD(o.bc,o.bs),verticalAlign:o.valign||VerticalAlign.TOP,
    margins:{top:o.m??80,bottom:o.m??80,left:o.mx??110,right:o.mx??110},
    shading:o.fill?{type:ShadingType.CLEAR,fill:o.fill,color:"auto"}:undefined});
}
function table(widths,rows,o={}){
  return new Table({width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},columnWidths:widths,
    rows:rows.map((r,ri)=>new TableRow({cantSplit:o.cantSplit!==false,tableHeader:o.header&&ri===0,height:o.height?{value:o.height(ri),rule:HeightRule.ATLEAST}:undefined,
      children:r}))});
}
const line=(w)=>new Paragraph({tabStops:[{type:D.TabStopType.RIGHT,position:w,leader:"underscore"}],spacing:{before:260,after:0},children:[new TextRun({text:"\t",font:ctx.font,size:22,color:"9AA4AE"})]});
const br=()=>new Paragraph({children:[new PageBreak()]});
function doc(children,o={}){
  const land=o.landscape;
  return new D.Document({numbering:{config:[
      {reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:340,hanging:240}}}}]},
      {reference:"n",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:380,hanging:280}}}}]}]},
    styles:{default:{document:{run:{font:o.font||ctx.font,size:o.size||ctx.size}}}},
    sections:[{properties:{page:{size:land?{width:11906,height:16838,orientation:PageOrientation.LANDSCAPE}:{width:11906,height:16838},
      margin:{top:o.margin??720,right:o.margin??720,bottom:o.margin??720,left:o.margin??720}}},
      headers:o.kopf?{default:new D.Header({children:[new Paragraph({children:[new TextRun({text:o.kopf,font:"Calibri",size:16,color:"7A8A80"}),
        new TextRun({children:["\tName: ______________________   Datum: ____________"],font:"Calibri",size:16,color:"7A8A80"})],tabStops:[{type:D.TabStopType.RIGHT,position:land?15300:10400}]})]})}:undefined,
      children}]});
}
const save=(d,f)=>D.Packer.toBuffer(d).then(b=>{fs.writeFileSync(f,b);console.log("ok",f.split("/").slice(-2).join("/"))});
module.exports={ctx,runs,P,H,img,cell,table,line,br,doc,save,BORD,NOB,D};

// ---------- gemeinsame Bausteine für Entwürfe ----------
const U2=module.exports;
U2.entwurf=function(o){
  const {AlignmentType}=D;const C={font:'Calibri'};
  const E=(s,x={})=>U2.P(s,{...C,size:20,...x});
  const sec=t=>U2.P(`**${t}**`,{...C,size:24,color:'1F6E43',before:160,after:60,keepNext:true});
  const cs=[800,1500,5000,1300,1866];
  const vt=U2.table(cs,[["Zeit","Phase","Unterrichtsgeschehen","Sozialform","Medien"].map((h,i)=>U2.cell(E(`**${h}**`,{after:0}),cs[i],{fill:'DCEFE3'})),
    ...o.verlauf.map(r=>r.map((v,i)=>U2.cell((Array.isArray(v)?v:[v]).map(x=>E(x,{after:40})),cs[i])))],{header:true});
  const ch=[U2.P(`**Stundenentwurf WiB 7 – Stunde ${o.nr}: ${o.titel}**`,{...C,size:30,color:'1F6E43'}),E(o.info),
    U2.P(`**Leitfrage:** ${o.leitfrage}`,{...C,size:22,before:80}),sec('Lernziele'),E(`Grobziel: ${o.grob}`),E('Die Schülerinnen und Schüler …',{after:40}),
    ...o.fein.map(t=>E(t,{bullet:true,after:20})),sec('Verlaufsplan'),vt];
  if(o.hinweise){ch.push(sec('Didaktische Hinweise'));o.hinweise.forEach(t=>ch.push(E(t,{bullet:true,after:40})));}
  if(o.loesungen){ch.push(sec('Lösungen'));o.loesungen.forEach(t=>ch.push(E(t,{after:60})));}
  if(o.material){ch.push(sec('Material und Vorbereitung'));o.material.forEach(t=>ch.push(E(t,{bullet:true,after:20})));}
  if(o.extra) ch.push(...o.extra(E,sec));
  return U2.doc(ch,{font:'Calibri',size:20,margin:720});
};
// Eintrag: blocks(mode) liefert die Absätze; erzeugt Tafelbild und Lückentext
U2.eintraege=function(dir,kopf,titel,blocks,wortspeicher){
  for(const mode of ['tafel','luecke']){
    U2.ctx.mode=mode;const lk=mode==='luecke';
    const ch=[U2.H(titel,{size:32}),...blocks(mode)];
    if(lk&&wortspeicher) ch.push(U2.P(`**Wortspeicher:** ${wortspeicher}`,{size:19,before:140,color:'4A5A50'}));
    U2.ctx.mode='tafel';
    U2.save(U2.doc(ch,{kopf:kopf+(lk?' · Hefteintrag':' · Tafelbild')}),`${dir}/${lk?'03_Hefteintrag_Lueckentext':'02_Tafelbild'}.docx`);
  }
};
U2.FIG=[
 {k:'tim',name:'Tim',beruf:'Kfz-Mechatroniker',col:'1F4E9E',soft:'DCE6F5'},
 {k:'selin',name:'Selin',beruf:'Medizinische Fachangestellte',col:'0F6E6E',soft:'D6EDEA'},
 {k:'jonas',name:'Jonas',beruf:'Kaufmann im Einzelhandel',col:'A4243B',soft:'F6DDE1'},
 {k:'lena',name:'Lena',beruf:'Köchin',col:'3D6B21',soft:'E0EBD4'}];
U2.ROOT='/home/user/empty/WiB7_LB2_Arbeit';U2.B=U2.ROOT+'/bilder';
// Ampelkarten-Folie: Aussagen mit Lösung
U2.ampelFolie=function(titel,aussagen,loesung){
  const {AlignmentType}=D;const W=15300;
  const rows=aussagen.map(([t,r],i)=>[U2.cell(U2.P(`**${i+1}.**`,{size:28,after:0}),700,{valign:D.VerticalAlign.CENTER}),
    U2.cell(U2.P(t,{size:28,after:0}),loesung?11600:14600,{valign:D.VerticalAlign.CENTER}),
    ...(loesung?[U2.cell(U2.P(r[0]==='r'?'**richtig**':'**falsch**'+(r.length>1?` – ${r.slice(2)}`:''),{size:20,color:r[0]==='r'?'2E7D32':'C62828',after:0}),3000,{fill:r[0]==='r'?'E3F2E5':'FBE3E3',valign:D.VerticalAlign.CENTER})]:[])]);
  return U2.doc([U2.P(`**${titel}**${loesung?' – Lösung':''}`,{size:40,color:'1F6E43',align:AlignmentType.CENTER,after:40}),
    U2.P('Grüne Karte = richtig · Rote Karte = falsch',{size:24,align:AlignmentType.CENTER,after:120}),
    U2.table(loesung?[700,11600,3000]:[700,14600],rows,{height:()=>700})],{landscape:true,margin:600});
};
U2.ampelKarten=function(){
  const {AlignmentType}=D;
  const k=(c,t)=>U2.cell([U2.P(`**${t}**`,{size:72,color:'FFFFFF',align:AlignmentType.CENTER,after:0})],5233,{fill:c,bc:c,valign:D.VerticalAlign.CENTER});
  return U2.doc([U2.P('**Ampelkarten** – auf festes Papier drucken, ausschneiden, Rückseite an Rückseite kleben (wiederverwendbar)',{size:18,color:'7A8A80',after:100}),
    U2.table([5233,5233],[[k('2E9E4F','richtig'),k('D64541','falsch')],[k('2E9E4F','richtig'),k('D64541','falsch')],[k('2E9E4F','richtig'),k('D64541','falsch')]],{height:()=>4300})],{margin:600});
};
