# Klassenrat – Protokoll & digitales Tool

Für die Johann-Peter-Wagner-Grund- und Mittelschule Theres. Es gibt zwei Fassungen:
**Grundschule (Kl. 1–4)** in Rot und Gelb, mit einfacher Sprache und großen Feldern, und
**Mittelschule (Kl. 5–9)** in Grün und Grau.

## Was ist wo?

| Datei | Wofür |
|---|---|
| `druck/protokoll-grundschule.pdf` | Protokollbogen zum Ausdrucken, Kl. 1–4 (3 Seiten) |
| `druck/protokoll-mittelschule.pdf` | Protokollbogen zum Ausdrucken, Kl. 5–9 (3 Seiten) |
| `word/protokoll-*.docx` | dieselben Bögen als Word-Datei zum Anpassen |
| `digital/klassenrat-tool.html` | digitales Tool – Doppelklick öffnet es im Browser |

### Aufbau der Bögen (nach dem üblichen Klassenrat-Ablauf)
1. **Seite 1:** Kopf (Klasse, Datum, Nr.), Rollen, Anwesenheit, Positivrunde, Rückblick auf die
   Beschlüsse der letzten Sitzung, Tagesordnung von der Wandzeitung
2. **Seite 2:** zwei Blöcke für je ein Anliegen. Jeder Block enthält Aussagen mit Namen,
   Lösungsvorschläge mit Abstimmung und den Beschluss mit „Wer? Bis wann?“.
   Diese Seite bei Bedarf mehrfach kopieren.
3. **Seite 3:** ein weiteres Anliegen, Abschluss (Blitzlicht), Rollen für die nächste Sitzung und Unterschriften

## Digitales Tool

Eine einzige HTML-Datei. Sie braucht weder Installation noch Internet und läuft auf Laptop, Tablet oder am Smartboard.

- Pro Klasse wird einmal die Klassenliste angelegt. Danach werden **Namen oben angetippt**:
  Name antippen → neue Zeile → Aussage tippen. Weitere Namen derselben Zeile zuordnen, Enter beendet die Zeile.
  Das funktioniert für Positivrunde, Aussagen, „eingebracht von“, Vorschläge, „Wer?“ und die Rollen.
- Mehrere Anliegen erscheinen als **Reiter** und lassen sich direkt anwählen.
- Die Sitzung läuft Schritt für Schritt nach dem Ablauf: Start & Rollen → Positivrunde → Rückblick → Anliegen → Abschluss → Protokoll.
- **Rollen** werden vorgeschlagen (wer am seltensten dran war). Die Rollen für die nächste Sitzung werden automatisch übernommen.
- **Offene Beschlüsse** erscheinen automatisch im Rückblick der nächsten Sitzung (umgesetzt / teilweise / nicht).
- **Vertagte Anliegen** können in der nächsten Sitzung mit einem Klick übernommen werden.
- Abstimmungszähler (dafür / dagegen / Enthaltung), Blitzlicht-Zähler und ein **Timer** mit Signalton für den Zeitwächter
- **Unterschriften direkt am Gerät** (Finger, Stift oder Maus). Sie werden ins Protokoll übernommen.
- **Protokoll drucken oder als PDF speichern**, im Design der Papierbögen
- **„7 Sitzung beenden“** trägt die Endzeit ein (falls leer) und führt zur Übersicht zurück.
- **Beschlussübersicht** über das ganze Schuljahr, mit Hinweis auf überfällige Beschlüsse
- Mehrere Klassen in einem Tool. Die Schulart steuert Farben und Begriffe.

### Abgeschlossene Sitzungen sperren
„Sitzung beenden“ sperrt die Sitzung, sobald unter **Daten** ein Passwort festgelegt ist. Beim ersten Beenden fragt das Tool danach.
Ansehen und Drucken bleibt möglich, Ändern und Löschen nur nach Eingabe des Passworts. Jede nachträgliche Öffnung
wird im Protokoll vermerkt. Beim Verlassen ist die Sitzung wieder gesperrt. Die Sperre schützt vor Änderungen im Tool.
Sie ist keine Verschlüsselung. Ein vergessenes Passwort lässt sich nicht wiederherstellen.

### Automatische Sicherung in OneDrive
Unter **Daten** einmal einen Ordner im OneDrive-Ordner des PCs wählen. Danach speichert das Tool nach jeder Änderung
`klassenrat-sicherung.json` dorthin und legt unter `Verlauf/` eine Fassung pro Tag ab. Den Upload übernimmt OneDrive.
Das funktioniert in Microsoft Edge und Google Chrome am PC oder Mac. Nach einem Browser-Neustart einmal „Sicherung fortsetzen“ antippen.
Auf einem anderen Gerät denselben Ordner wählen und „Aus diesem Ordner wiederherstellen“ antippen.

### Offene Beschlüsse
Ein Beschluss erscheint so lange im Rückblick jeder folgenden Sitzung, bis er dort als **„umgesetzt“** oder
**„nicht umsetzbar“** markiert wird (Grundschule: „geklappt“ / „geht nicht“). „teilweise“, „nicht umgesetzt“ oder gar keine
Auswahl lassen ihn offen. Bei „nicht umsetzbar“ fragt das Bemerkungsfeld nach dem Grund.

### Datenschutz
Alle Daten werden **nur im Browser des jeweiligen Geräts** gespeichert (localStorage). Nichts wird ins Internet übertragen.
Unter **Daten → Sicherung herunterladen** lässt sich alles als Datei sichern oder auf ein anderes Gerät übertragen.
Nach dem Löschen der Browserdaten sind die Protokolle sonst weg. Bitte beachtet die Vorgaben der Schule zum Umgang mit Schülerdaten.

## Schullogo
Das Originallogo liegt als `bilder/logo.png` vor und wird in Bögen und Tool eingebettet.
Im Tool lässt es sich unter Daten → „Logo-Datei wählen …“ austauschen.

## Neu erzeugen
Alle Dateien entstehen aus `werkzeuge/` (Python 3 mit `python-docx`, Node mit Playwright/Chromium):

```sh
./bauen.sh
```

- `werkzeuge/bilder.py`: Logo, Cliparts und Symbole in den Schulfarben
- `werkzeuge/bogen_erzeugen.py`: Inhalt der Bögen. HTML/PDF und Word entstehen aus derselben Beschreibung.
- `werkzeuge/tool_vorlage.html`: Quelltext des digitalen Tools
