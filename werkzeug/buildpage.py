# Baut die Hör-Mindmap-Seite aus page.tpl.html.
# Aufruf: python3 buildpage.py jobs/<beruf>.json <timing.json> <artifact-ordner> <github-ordner>
import sys,json,os
here=os.path.dirname(os.path.abspath(__file__))
jobf,timf,artdir,ghdir=sys.argv[1:5]
job=json.load(open(jobf,encoding="utf-8"));w=job["web"]
p=open(os.path.join(here,"page.tpl.html"),encoding="utf-8").read()
vars_=lambda d:" ".join(f"--{k}:{v};" for k,v in d.items())
pos=[(50,13),(84,38),(72,83),(28,83),(16,38)]
topics=[{"t":job["topics"][i],"tasks":job["texts"][i]["a"],"x":pos[i][0],"y":pos[i][1]} for i in range(5)]
rep={"__TITLE__":w["title"],"__LAYOUT__":w["layoutComment"],"__ROOTVARS__":"  "+vars_(w["light"]),"__DARKVARS__":vars_(w["dark"]),
 "__H1__":w["h1"],"__NAME__":job["name"],"__POSS__":job.get("poss","seiner"),"__PHOTO__":job["photo"],"__ALT__":w["alt"],"__SVGLABEL__":w["svgLabel"],"__DRAWING__":job["drawing"],
 "__HUBLABEL__":w["hubLabel"],"__TOPICS__":json.dumps(topics,ensure_ascii=False),"__TIMING__":open(timf,encoding="utf-8").read().strip()}
for k,v in rep.items():
    assert k in p,k; p=p.replace(k,v)
os.makedirs(artdir,exist_ok=True);open(artdir+"/index.html","w",encoding="utf-8").write(p)
gh='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
i=p.index("</style>")+8
os.makedirs(ghdir,exist_ok=True)
open(ghdir+"/index.html","w",encoding="utf-8").write(gh+p[:i]+"\n</head>\n<body>\n"+p[i:]+"\n</body>\n</html>\n")
