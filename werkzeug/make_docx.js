// Erzeugt das Word-Arbeitsblatt (Hefteintrag, Texte 1-5, Lösung).
// Aufruf: node make_docx.js jobs/<beruf>.json <bildordner> <ausgabe.docx>
const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,AlignmentType,PageBreak,HeightRule,LevelFormat,TabStopType,ImageRun,VerticalAlign}=require('docx');
const job=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const E=process.argv[3];const OUTF=process.argv[4];
const F="Comic Sans MS", GREEN="00A651";
const r=(t,o={})=>new TextRun({text:t,font:F,size:24,...o});
const P=(c,o={})=>new Paragraph({children:Array.isArray(c)?c:[r(c)],spacing:{after:120,line:360},...o});
const line=w=>new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:w,leader:"underscore"}],spacing:{before:300},children:[new TextRun({text:"\t",font:F,size:24,color:"808080"})]});
const title=t=>new Paragraph({children:[r(t,{bold:true,color:GREEN,underline:{},size:28})],spacing:{after:200}});
const IMG=k=>fs.readFileSync(`${E}/${k}.png`);
const W=10632, SIDE=3900, MID=W-2*SIDE;
const none={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const nob={top:none,bottom:none,left:none,right:none};
const cloudW=250, cloudH=Math.round(250*290/760);
function box(k,filled){
  const kids=[new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},children:[new ImageRun({type:"png",data:IMG("c_"+k),transformation:{width:cloudW,height:cloudH}})]})];
  if(filled) job.sol[k].forEach(t=>kids.push(new Paragraph({numbering:{reference:"b",level:0},spacing:{after:30},children:[r(t,{size:21})]})));
  else for(let i=0;i<6;i++) kids.push(new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:SIDE-260,leader:"underscore"}],spacing:{before:240},children:[new TextRun({text:"\t",font:F,size:24,color:"9FB0C6"})]}));
  return new TableCell({width:{size:SIDE,type:WidthType.DXA},borders:nob,margins:{left:80,right:80,top:40},children:kids});
}
function eintrag(filled){
  const L=["tat","mit","anf"],R=["ort","bed","gru"];
  const hub=new TableCell({width:{size:MID,type:WidthType.DXA},borders:nob,rowSpan:3,verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({type:"png",data:IMG("hub"),transformation:{width:180,height:199}})]})]});
  return new Table({width:{size:W,type:WidthType.DXA},columnWidths:[SIDE,MID,SIDE],borders:{top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none},
    rows:[0,1,2].map(i=>new TableRow({height:{value:filled?4300:4600,rule:HeightRule.ATLEAST},cantSplit:true,
      children:i===0?[box(L[i],filled),hub,box(R[i],filled)]:[box(L[i],filled),box(R[i],filled)]}))});
}
const body=[title(`Wir beschreiben den Arbeitsplatz ${job.berufGen}`),
 P([r("Lies die Texte 1–5 (oder hör sie dir an) und notiere Stichpunkte unter der passenden Überschrift.",{italics:true,size:21})]),eintrag(false)];
job.texts.forEach((x,i)=>{
  body.push(new Paragraph({children:[new PageBreak()]}),P([r(`Text ${i+1}`,{underline:{},bold:true})]));
  x.t.forEach(t=>body.push(P(t)));
  x.a.forEach((q,j)=>{
    if(j===0) body.push(P([r("✎ Arbeitsauftrag:",{bold:true})],{spacing:{before:240,after:60}}));
    body.push(P(q,{spacing:{before:j?240:0,after:0}}));
    for(let k=0;k<(x.a.length>1?4:6);k++) body.push(line(10500));
  });
});
body.push(new Paragraph({children:[new PageBreak()]}),title(`Lösung: Hefteintrag ${job.beruf}`),eintrag(true));
const doc=new Document({numbering:{config:[{reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:300,hanging:220}}}}]}]},
 styles:{default:{document:{run:{font:F,size:24}}}},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:567,right:707,bottom:567,left:567}}},children:body}]});
Packer.toBuffer(doc).then(b=>fs.writeFileSync(OUTF,b));
