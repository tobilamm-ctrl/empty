"""Erzeugt allgemeine Moderationskarten zum Ausdrucken (DIN A5 quer, zwei Karten pro A4-Seite).

Die Karten passen zu jeder Sitzung; Lücken (____) füllt die Leitung mündlich.
Aufruf:  python3 klassenrat/werkzeuge/karten_erzeugen.py   (danach rendern.mjs pdf)
"""

import base64
import sys
from html import escape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bilder  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "bilder" / "logo.png"

# (Schritt, Symbol, Titel, Sätze zum Vorlesen, Hinweis)
MITTELSCHULE = [
    (1, "glocke", "Eröffnung", ["Ich eröffne den Klassenrat.", "Heute führt ____ das Protokoll.",
                                "Auf die Zeit achtet ____, auf die Regeln achtet ____."], ""),
    (1, "regel", "Unsere Regeln", ["Wir lassen einander ausreden.", "Wir sprechen respektvoll miteinander.",
                                   "Wir bleiben beim Thema."], "Wer reden möchte, meldet sich."),
    (2, "stern", "Positivrunde", ["Wir beginnen mit der Positivrunde.",
                                  "Wer möchte etwas Positives sagen oder sich bei jemandem bedanken?"], ""),
    (3, "zurueck", "Rückblick", ["Beim letzten Klassenrat haben wir beschlossen: ____.", "Zuständig war ____.",
                                 "Wurde der Beschluss umgesetzt?"], "Für jeden offenen Beschluss wiederholen."),
    (4, "wandzeitung", "Anliegen vorstellen", ["Wir kommen zum nächsten Anliegen von der Wandzeitung.",
                                               "____, bitte erkläre dein Anliegen."], ""),
    (4, "sprechen", "Aussprache", ["Wer möchte etwas dazu sagen?", "Zuerst sprechen die Betroffenen.",
                                   "Bitte meldet euch."], "Die Redeliste beachten."),
    (4, "idee", "Lösungen sammeln", ["Welche Lösungsvorschläge gibt es?", "Was können wir konkret tun?"], ""),
    (4, "hand", "Abstimmung", ["Wir stimmen ab über den Vorschlag: ____.", "Wer ist dafür?", "Wer ist dagegen?",
                               "Wer enthält sich?"], "Danach: Wer übernimmt das, und bis wann?"),
    (5, "froh", "Blitzlicht", ["Zum Schluss das Blitzlicht.", "Wie fandet ihr die heutige Sitzung?"], ""),
    (5, "kalender", "Nächste Sitzung", ["In der nächsten Sitzung übernehmen:",
                                        "Präsident/in ____, Protokoll ____, Zeit ____, Regeln ____."], ""),
    (5, "haken", "Ende", ["Ich beende den Klassenrat.", "Vielen Dank an alle!"], ""),
    (0, "uhr", "Für die Zeitwächter/in", ["Noch zwei Minuten!", "Die Zeit für dieses Anliegen ist um."],
     "Hochhalten, wenn die Zeit knapp wird."),
    (0, "regel", "Für die Regelwächter/in", ["Stopp – bitte lasst einander ausreden.", "Bitte bleibt beim Thema."],
     "Hochhalten, wenn eine Regel verletzt wird."),
]

GRUNDSCHULE = [
    (1, "glocke", "Begrüßung", ["Ich begrüße euch zu unserem Klassenrat!",
                                "Heute schreibt ____ mit.", "____ passt auf die Zeit auf, ____ auf die Regeln."], ""),
    (1, "regel", "Unsere Regeln", ["Wir hören einander zu.", "Wir lassen andere ausreden.",
                                   "Wir sind freundlich zueinander."], "Wer reden möchte, meldet sich."),
    (2, "stern", "Das war schön", ["Wer möchte etwas Schönes erzählen?", "Wem möchtest du danken?"], ""),
    (3, "zurueck", "Hat es geklappt?", ["Letztes Mal haben wir abgemacht: ____.", "Darum kümmert sich ____.",
                                        "Hat das geklappt?"], ""),
    (4, "wandzeitung", "Unser Thema", ["Jetzt kommt das nächste Thema von der Wandzeitung.",
                                       "____, erzähl uns bitte davon."], ""),
    (4, "sprechen", "Was sagt ihr?", ["Wer möchte etwas dazu sagen?", "Zuerst sind die Kinder dran, die es betrifft."], ""),
    (4, "idee", "Unsere Ideen", ["Wer hat eine Idee, was wir machen können?"], ""),
    (4, "hand", "Abstimmen", ["Wir stimmen ab: ____.", "Wer ist dafür?", "Wer ist dagegen?"],
     "Danach: Wer kümmert sich darum, und bis wann?"),
    (5, "froh", "Wie war's?", ["Wie fandet ihr unseren Klassenrat heute?"], ""),
    (5, "kalender", "Nächstes Mal", ["Beim nächsten Klassenrat helfen:", "Leitung ____, Schreiben ____,",
                                     "Zeit ____, Regeln ____."], ""),
    (5, "haken", "Ende", ["Der Klassenrat ist zu Ende.", "Danke an alle!"], ""),
    (0, "uhr", "Für die Zeitwächter/in", ["Noch zwei Minuten!", "Die Zeit ist um."], "Hochhalten, wenn die Zeit knapp wird."),
    (0, "regel", "Für die Regelwächter/in", ["Stopp – bitte ausreden lassen!", "Bitte leise sein."],
     "Hochhalten, wenn eine Regel verletzt wird."),
]

STUFEN = {
    "grundschule": ("Unser Klassenrat", "Grundschule · Klassen 1–4", "#A64A50", "#F8E9EA", GRUNDSCHULE),
    "mittelschule": ("Klassenrat", "Mittelschule · Klassen 5–9", "#4E927C", "#E6F2EE", MITTELSCHULE),
}

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #d9dde2; font-family: Arial, "Liberation Sans", Helvetica, sans-serif; color: #222; }
.seite { width: 210mm; height: 297mm; margin: 8mm auto; background: #fff; position: relative; overflow: hidden; }
@media print { html, body { background: #fff; } .seite { margin: 0; break-after: page; } .seite:last-child { break-after: auto; } }
.schnitt { position: absolute; left: 0; right: 0; top: 148.5mm; border-top: .3mm dashed #aaa; }
.schnitt span { position: absolute; left: 6mm; top: -2.4mm; background: #fff; font-size: 7pt; color: #999; padding: 0 2mm; }
.karte { position: absolute; left: 8mm; right: 8mm; height: 132.5mm; border: .5mm solid var(--a); border-radius: 5mm; overflow: hidden; display: flex; flex-direction: column; }
.karte.oben { top: 8mm; } .karte.unten { top: 156.5mm; }
.kopf { background: var(--a); color: #fff; display: flex; align-items: center; gap: 4mm; padding: 4mm 6mm; }
.kopf .nr { width: 11mm; height: 11mm; border-radius: 50%; background: #fff; color: var(--a); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15pt; flex: none; }
.kopf .ic { width: 13mm; height: 13mm; background: #fff; border-radius: 50%; padding: 1.6mm; flex: none; }
.kopf .ic svg { width: 100%; height: 100%; display: block; }
.kopf h2 { margin: 0; font-size: 21pt; }
.kopf .rolle { margin-left: auto; font-size: 9pt; opacity: .9; }
.inhalt { flex: 1; padding: 6mm 9mm 3mm; display: flex; flex-direction: column; justify-content: center; gap: 2.4mm; }
.satz { font-size: 21pt; font-weight: bold; line-height: 1.28; margin: 0; }
.satz .luecke { display: inline-block; min-width: 34mm; border-bottom: .5mm solid #888; transform: translateY(-1mm); }
.hinweis { margin: 3mm 0 0; font-size: 12.5pt; color: #555; background: var(--h); border-radius: 3mm; padding: 2.5mm 4mm; align-self: flex-start; }
.fuss { display: flex; align-items: center; justify-content: space-between; padding: 2mm 6mm 3mm; font-size: 8pt; color: #888; border-top: .3mm solid #eee; }
.fuss img, .fuss svg { height: 9mm; width: auto; }
"""


def satz_html(text):
    return escape(text).replace("____", '<span class="luecke"></span>')


def karte_html(nr, karte, gesamt, titel_stufe, logo):
    schritt, icon, titel, saetze, hinweis = karte
    links = f'<span class="nr">{schritt}</span>' if schritt else ""
    rolle = "" if schritt else '<span class="rolle">Rollenkarte</span>'
    return f"""<div class="karte {'oben' if nr % 2 else 'unten'}">
  <div class="kopf">{links}<span class="ic">{bilder.ALLE[icon]}</span><h2>{escape(titel)}</h2>{rolle}</div>
  <div class="inhalt">{''.join(f'<p class="satz">{satz_html(x)}</p>' for x in saetze)}
    {f'<p class="hinweis">{escape(hinweis)}</p>' if hinweis else ''}</div>
  <div class="fuss">{logo}<span>{escape(titel_stufe)} · Moderationskarte {nr} von {gesamt}</span></div>
</div>"""


def main():
    logo = (f'<img src="data:image/png;base64,{base64.b64encode(LOGO.read_bytes()).decode()}" alt="Schullogo">'
            if LOGO.exists() else bilder.LOGO)
    for name, (titel, untertitel, akzent, hell, karten) in STUFEN.items():
        seiten = []
        for i in range(0, len(karten), 2):
            paar = "".join(karte_html(i + j + 1, k, len(karten), f"{titel} – {untertitel}", logo)
                           for j, k in enumerate(karten[i:i + 2]))
            seiten.append(f'<div class="seite">{paar}<div class="schnitt"><span>✂ hier schneiden</span></div></div>')
        html = (f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Moderationskarten – {escape(untertitel)}</title>'
                f'<style>{CSS}</style></head><body style="--a:{akzent};--h:{hell}">{"".join(seiten)}</body></html>')
        ziel = ROOT / "druck" / f"moderationskarten-{name}.html"
        ziel.write_text(html, encoding="utf-8")
        print("geschrieben:", ziel.relative_to(ROOT.parent))


if __name__ == "__main__":
    main()
