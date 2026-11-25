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
