# Erzeugt Platzhalterbilder für noch fehlende Canva-Bilder
import sys,os
from PIL import Image,ImageDraw,ImageFont
B=sys.argv[1]
items=[l.split('|') for l in sys.argv[2:]]
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',34)
except: F=ImageFont.load_default()
for name,cap in items:
    f=f'{B}/{name}.png'
    if os.path.exists(f) and not os.path.exists(f+'.platzhalter'): continue
    im=Image.new('RGB',(400,400),'#F3F6F4');d=ImageDraw.Draw(im)
    d.rounded_rectangle((12,12,388,388),radius=30,outline='#9DB8A8',width=6)
    d.text((200,150),'Bild folgt',font=F,fill='#9DB8A8',anchor='mm')
    words=cap.split();lines=[];cur=''
    for w in words:
        if len(cur+' '+w)>16: lines.append(cur);cur=w
        else: cur=(cur+' '+w).strip()
    lines.append(cur)
    for i,l in enumerate(lines): d.text((200,220+i*42),l,font=F,fill='#4A5A50',anchor='mm')
    im.save(f);open(f+'.platzhalter','w').write('1')
