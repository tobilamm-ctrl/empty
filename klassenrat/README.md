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
| `druck/moderationskarten-*.pdf` | allgemeine Moderationskarten zum Ausdrucken (A5, 2 pro Seite, 13 Karten inkl. Zeit- und Regelwächter) |

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
- **Beschlussübersicht** über das ganze Schuljahr, mit Hinweis auf überfällige Beschlüsse und
  einem **Aushang „Unsere Beschlüsse“** zum Ausdrucken fürs Klassenzimmer
- **Redeliste:** Wortmeldungen antippen, „▶ … ist dran“ legt gleich die Aussage-Zeile mit dem Namen an.
- **Satzanfänge** zum Antippen („Mich stört, wenn …“), **schnelle Abstimmung** („alle dafür“, „übrige dagegen“)
  und **Vorschläge aus früheren Beschlüssen** beim Tippen
- **Moderationskarten**: Sätze zum Vorlesen für die Leitung, passend zu Rollen, Beschlüssen und Anliegen. Wählbar:
  auf dem Gerät im Vollbild, **auf der Tafel** als zweites Fenster (erweiterter Bildschirm, live verbunden, mit Fernbedienung),
  **direkt mit der Tafel verbunden** (Tafel zeigt einen 4-stelligen Code, das Protokollgerät gibt ihn ein; WebRTC,
  ohne Verzögerung), **über OneDrive an einen Tafel-Rechner** oder **als Datei** für ein anderes Gerät.
  Die Direktverbindung nutzt zum Finden der Geräte den öffentlichen PeerJS-Vermittlungsdienst (sieht nur Netzwerkadressen
  und Code, keine Inhalte) und braucht Internet; manche Schulnetze blockieren direkte Verbindungen zwischen Geräten.
  Auf der Tafel **folgen die Karten automatisch dem Protokoll** (neuer Schritt, neues Anliegen). Auf der Blitzlicht-Karte
  startet „Blitzlicht hier starten“ die Abstimmung direkt an der Tafel; die Stimmen landen im Protokoll.
- **Eigene Satzanfänge** für Positivrunde und Aussagen (unter Klasse oder während der Sitzung über „＋ eigener“)
- **Briefkasten:** Die Kinder werfen Anliegen vor der Sitzung selbst ein (Vollbild auf dem Klassen-Tablet: Name antippen,
  Art wählen, einen Satz schreiben). Sie sehen keine fremden Einträge, beenden geht nur mit dem Passwort der Lehrkraft,
  nach einem Neuladen bleibt der Briefkasten offen. In der Sitzung werden die Anliegen per Antippen übernommen.
  Einstellbar: Anliegen ohne Namen erlauben, Höchstzahl pro Kind und Tag. Für ein wirklich abgeschlossenes Gerät zusätzlich
  „Geführter Zugriff“ (iPad), „Zugewiesener Zugriff“ (Windows) oder „App-Fixierung“ (Android) nutzen.
- **Online-Briefkasten (QR-Code):** Die Lehrkraft öffnet ihn im Tool (Briefkasten → „Online-Briefkasten öffnen“). Die Kinder
  scannen den QR-Code mit dem eigenen iPad, tragen Namen und Anliegen ein, und es landet direkt im Briefkasten des Tools.
  Der QR-Code bleibt standardmäßig gültig und kann dauerhaft aushängen (optional: neuer Zufallscode bei jedem Öffnen).
  Ist das Tool der Lehrkraft nicht geöffnet, sehen die Kinder „Briefkasten geschlossen“; beim nächsten Start öffnet es sich
  automatisch wieder. Begrenzung pro Gerät und Tag einstellbar; die Klassenliste wird nie an die Geräte der Kinder geschickt.
  Läuft über dieselbe Direktverbindung (WebRTC/PeerJS) wie die Tafel; das Tool muss dafür über seine Web-Adresse geöffnet sein.
- **Fristen:** Die Startseite zeigt, welche Beschlüsse in den nächsten 7 Tagen fällig sind oder schon überfällig sind.
- **Auswertung** (mit Passwort): Rollen-Übersicht pro Kind und Jahresüberblick (Sitzungen, Arten der Anliegen,
  Stand der Beschlüsse, Blitzlicht je Sitzung)
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
Auf einem neuen Gerät auf der Startseite „☁ Aus OneDrive-Ordner laden …“ wählen.

Das Tool **merkt sich die zuletzt geladene Datei** und öffnet sie beim Start sofort, wenn sie neuer ist als die Daten im
Browser (z. B. weil ein anderes Gerät inzwischen weitergearbeitet hat). Verlangt der Browser nach einem Neustart eine
Erlaubnis, genügt ein Klick auf „☁ Jetzt laden“. Liegen in OneDrive neuere Daten als die eigenen, hält die automatische
Sicherung an und fragt nach, statt etwas zu überschreiben.

### Offene Beschlüsse
Ein Beschluss erscheint so lange im Rückblick jeder folgenden Sitzung, bis er dort als **„umgesetzt“** oder
**„nicht umsetzbar“** markiert wird (Grundschule: „geklappt“ / „geht nicht“). „teilweise“, „nicht umgesetzt“ oder gar keine
Auswahl lassen ihn offen. Bei „nicht umsetzbar“ fragt das Bemerkungsfeld nach dem Grund.

### Datenschutz
Alle Daten werden **nur im Browser des jeweiligen Geräts** gespeichert (localStorage). Nichts wird ins Internet übertragen.
Unter **Daten → Sicherung herunterladen** lässt sich alles als Datei sichern oder auf ein anderes Gerät übertragen.
Nach dem Löschen der Browserdaten sind die Protokolle sonst weg. Bitte beachtet die Vorgaben der Schule zum Umgang mit Schülerdaten.

## Schullogo
Das Schullogo ist **nicht** Teil des Repositorys und des Tools, damit es nicht öffentlich auf GitHub liegt.
- **Im Tool:** unter Daten → „Logo-Datei wählen …“ hochladen; es bleibt nur auf dem Gerät (und in dessen Sicherungen)
  und lässt sich dort mit „Logo entfernen“ wieder löschen.
- **Druckbögen/Karten mit Logo:** das Logo lokal als `bilder/logo.png` ablegen und `./bauen.sh` ausführen.
  Die Datei ist per `.gitignore` von Commits ausgeschlossen – die so erzeugten Dateien mit Logo bitte nicht hochladen.

## App-Symbol und Installation
Für GitHub Pages **alle Dateien aus `digital/`** in denselben Ordner hochladen: `index.html` (= `klassenrat-tool.html`),
`manifest.webmanifest`, `sw.js`, `apple-touch-icon.png`, `app-icon-192.png`, `app-icon-512.png`, `favicon.png`.
- **iPad/iPhone:** in Safari Teilen → „Zum Home-Bildschirm“.
- **Chrome/Edge am PC:** Installations-Symbol rechts in der Adressleiste (oder Menü ⋮ → „Streamen, speichern und teilen“ →
  „Seite als App installieren“). Voraussetzung: Manifest und `sw.js` liegen neben `index.html`, Aufruf über https.
  Die installierte App lädt immer die neueste Fassung und startet ohne Internet aus dem Zwischenspeicher.

## Neu erzeugen
Alle Dateien entstehen aus `werkzeuge/` (Python 3 mit `python-docx`, Node mit Playwright/Chromium):

```sh
./bauen.sh
```

- `werkzeuge/bilder.py`: Cliparts, Symbole und App-Symbol in den Schulfarben
- `werkzeuge/bogen_erzeugen.py`: Inhalt der Bögen. HTML/PDF und Word entstehen aus derselben Beschreibung.
- `werkzeuge/tool_vorlage.html`: Quelltext des digitalen Tools
