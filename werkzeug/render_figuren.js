// Rendert die vier Steckbrief-Figuren als runde PNGs (aus den Webseiten)
const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.argv[2];
const src={tim:'webseite',selin:'webseite-mfa',jonas:'webseite-einzelhandel',lena:'webseite-koch'};
const col={tim:'#1F4E9E',selin:'#0F6E6E',jonas:'#A4243B',lena:'#3D6B21'};
(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2});
for(const [k,d] of Object.entries(src)){
  const h=fs.readFileSync(`/home/user/empty/${d}/index.html`,'utf8');
  const m=h.match(/<svg id="drawing"[^>]*>([\s\S]*?)<\/svg>/);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="width:100%;height:100%;display:block">${m[1]}</svg>`;
  await p.setContent(`<style>body{margin:0;background:transparent}</style><div id="c" style="width:300px;height:300px;border-radius:50%;overflow:hidden;border:12px solid ${col[k]};box-sizing:border-box">${svg}</div>`);
  await p.locator('#c').screenshot({path:`${OUT}/Figur_${k}.png`,omitBackground:true});
}
await b.close()})();
