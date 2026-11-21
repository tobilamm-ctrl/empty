// Rendert Wolken-Überschriften und das runde Mittelbild für den Hefteintrag.
// Aufruf: node render.js jobs/<beruf>.json <ausgabeordner>
const {chromium}=require('playwright');const fs=require('fs');
const job=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const OUT=process.argv[3];const P=job.colors.primary,FILL=job.colors.cloudFill;
const drawing=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${job.drawing}</svg>`;
const font='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap"><style>body{margin:0;background:transparent}</style>';
function cloud(text,tail){
  const W=760,H=290;
  const circ=[[150,120,70],[240,80,72],[350,68,78],[460,74,74],[560,92,68],[630,135,60],[540,170,62],[420,175,64],[300,172,64],[190,165,58],[120,140,50]];
  let tl='';
  if(tail==='R') tl='<circle cx="700" cy="215" r="16"/><circle cx="738" cy="242" r="9"/>';
  if(tail==='L') tl='<circle cx="62" cy="215" r="16"/><circle cx="24" cy="242" r="9"/>';
  const cs=circ.map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`).join('')+'<ellipse cx="385" cy="125" rx="250" ry="75"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g transform="translate(0,22)">
  <g fill="${P}" stroke="${P}" stroke-width="12">${cs}${tl}</g>
  <g fill="${FILL}">${cs}</g><g fill="${FILL}" stroke="${P}" stroke-width="5">${tl}</g>
  <text x="380" y="${text.length>1?112:135}" text-anchor="middle" font-family="Comic Neue" font-weight="700" font-size="50" fill="${P}">${
    text.map((t,i)=>`<tspan x="380" dy="${i?54:0}">${t}</tspan>`).join('')}</text></g></svg>`;
}
const label=job.hubShort||job.beruf;
const hub=`<div style="width:560px;height:620px;position:relative">
 <div style="position:absolute;left:20px;top:10px;width:520px;height:520px;border-radius:50%;overflow:hidden;border:14px solid #fff;box-shadow:0 0 0 10px ${P};box-sizing:border-box">${drawing.replace('<svg ','<svg style="width:100%;height:100%;display:block" ')}</div>
 <div style="position:absolute;left:50%;top:500px;transform:translateX(-50%);background:${P};color:#fff;font:700 ${label.length>18?34:44}px 'Comic Neue';padding:8px 30px;border-radius:40px;max-width:520px;text-align:center;line-height:1.1">${label}</div></div>`;
const items={tat:[["Tätigkeiten am","Arbeitsplatz"],'R'],ort:[["Arbeitsort"],'L'],mit:[["Arbeitsmittel /","Arbeitsmaterial"],'R'],bed:[["Arbeits-","bedingungen"],'L'],anf:[["Anforderungen /","Fähigkeiten"],'R'],gru:[["Gründe für die","Berufswahl"],'L']};
(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2});
 for(const [k,[t,tail]] of Object.entries(items)){await p.setContent(font+cloud(t,tail));await p.waitForTimeout(400);
   await p.locator('svg').screenshot({path:`${OUT}/c_${k}.png`,omitBackground:true});}
 await p.setContent(font+hub);await p.waitForTimeout(400);await p.locator('body>div').screenshot({path:`${OUT}/hub.png`,omitBackground:true});
 await b.close()})();
