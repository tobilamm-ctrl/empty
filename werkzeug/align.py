# Satz-Zeitmarken für fertige MP3s (z. B. von ElevenLabs) über Sprechpausen bestimmen.
# Aufruf: python3 align.py jobs/<beruf>.json <audio-ordner> <timing.json>
import sys,json,re,subprocess,os
jobf,adir,out=sys.argv[1:4]
job=json.load(open(jobf,encoding="utf-8"));data={}
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
for i,x in enumerate(job["texts"],1):
    f=f"{adir}/Text_{i}.mp3"
    if not os.path.exists(f): print(f"Text {i}: Datei fehlt"); continue
    sents=[]
    for pi,p in enumerate([f"Text {i}."]+x["t"]):
        for s in re.split(r'(?<=[.!?])\s+(?=[A-ZÄÖÜ])',p): sents.append((pi,s))
    D=dur(f)
    log=subprocess.run(["ffmpeg","-i",f,"-af","silencedetect=n=-35dB:d=0.2","-f","null","-"],capture_output=True,text=True).stderr
    st=[float(v) for v in re.findall(r"silence_start: ([\d.]+)",log)]; en=[float(v) for v in re.findall(r"silence_end: ([\d.]+)",log)]
    gaps=[(a,b) for a,b in zip(st,en) if a>0.05 and b<D-0.05]
    # erwartete Satzgrenzen nach Zeichenanteil
    L=[len(s)+8 for _,s in sents]; tot=sum(L); exp=[]; c=0
    for l in L[:-1]: c+=l; exp.append(c/tot*D)
    n=len(exp); m=len(gaps)
    if m<n: raise SystemExit(f"Text {i}: nur {m} Pausen für {n} Satzgrenzen")
    INF=1e9; cost=lambda k,g:abs((gaps[g][0]+gaps[g][1])/2-exp[k])-4*(gaps[g][1]-gaps[g][0])
    dp=[[INF]*m for _ in range(n)]; bk=[[-1]*m for _ in range(n)]
    for g in range(m): dp[0][g]=cost(0,g)
    for k in range(1,n):
        best=INF;bi=-1
        for g in range(m):
            if g>0 and dp[k-1][g-1]<best: best=dp[k-1][g-1];bi=g-1
            if bi>=0: dp[k][g]=best+cost(k,g);bk[k][g]=bi
    g=min(range(m),key=lambda g:dp[n-1][g]);ch=[]
    for k in range(n-1,-1,-1): ch.append(g); g=bk[k][g]
    ch=ch[::-1]
    starts=[0.0]+[gaps[g][1]-0.05 for g in ch]; ends=[gaps[g][0] for g in ch]+[D]
    data[i]=[{"p":pi,"s":s,"start":round(a,2),"end":round(b,2)} for (pi,s),a,b in zip(sents,starts,ends)]
    print(i,[ (d["start"],d["s"][:25]) for d in data[i]])
json.dump(data,open(out,"w",encoding="utf-8"),ensure_ascii=False,separators=(",",":"))
