# Fotobox-Tool für die Hochzeit – Ideensammlung

Stand: 21.10.2026. Gehört zum Sitzplantool (Repository `tobilamm-ctrl/hochzeit-sitzplan`).

## Grundentscheidung

Zwei getrennte Tools, die nur die **Gästeliste teilen**: Das Sitzplantool exportiert Gäste und Tische
als Datei (z. B. JSON), die Fotobox importiert sie. Keine Live-Verbindung zwischen den Tools.

Begründung: Das Sitzplantool nutzt das Brautpaar Wochen vorher am Laptop (viele Funktionen, Komfort).
Die Fotobox nutzen Gäste am Hochzeitstag, oft spät abends, an einem Tablet auf einem Stativ
(muss offline laufen, darf nicht abstürzen, muss einfach zu bedienen sein).

## Varianten der Fotobox (beide offen)

1. **Tablet vor Ort**: Das Tablet fotografiert selbst, mit Countdown, Rahmen und eventuell Ausdruck
   (klassische Fotobox).
2. **Handys der Gäste**: Upload über einen QR-Code, eher eine gemeinsame Hochzeitsgalerie.
   Braucht einen Speicherort im Internet, also mehr Aufwand und Datenschutz der Fotos klären.
3. Beides kombiniert.

## Ideen für die Verbindung über die Gästeliste

Am Hochzeitstag:
- **Tisch-Aufgaben**: Die Fotobox stellt einzelnen Tischen Aufgaben
  (z. B. „Tisch 4: Foto mit allen, die das Brautpaar aus der Schulzeit kennen“).
- **Foto-Bingo pro Tisch**: Jeder Tisch hat eine Motivliste, die Fotobox zeigt den Fortschritt an.
- **QR-Code auf den Tischkarten**: Das Sitzplantool druckt ihn auf die Tischkarte,
  Gäste laden darüber Fotos für ihren Tisch hoch.
- **Gästebuch-Modus**: Nach dem Foto den eigenen Namen antippen statt tippen, dazu ein kurzer Gruß.

Nach der Hochzeit:
- **Galerie nach Tischen oder Personen sortiert** (Fotos sind Gästen zugeordnet).
- **Dankeskarten**: Pro Gast ein Foto auswählen, auf dem er zu sehen ist; Name und Adresse
  kommen aus der Gästeliste.
- **Übersicht „wer fehlt noch“**: Von welchen Gästen gibt es noch kein Foto?
  Daraus spontan eine Aufgabe für den Abend machen.

## Technische Möglichkeiten (Hardware)

A. **Nur Tablet**: Web-App im Browser nutzt die Frontkamera, läuft offline.
   Am günstigsten und am einfachsten; Bildqualität hängt stark vom Licht ab.
B. **Tablet + Kamera mit WLAN-Fernsteuerung**: Manche Canon-Kameras haben eine
   offene WLAN-Schnittstelle (CCAPI), die eine Web-App ansteuern kann. Nur bestimmte Modelle.
C. **Laptop oder Raspberry Pi + Kamera per USB** (Steuerung mit gPhoto2), Tablet oder Bildschirm
   als Anzeige und Auslöser. Beste Bildqualität, am flexibelsten, aber am meisten Aufwand.
D. **Laptop + gute USB-Webcam**: Mittelweg zwischen A und C.

Zubehör: Licht (Ringlicht/Softbox) bringt mehr als eine teure Kamera. Auslöser per
Bluetooth-Buzzer möglich. Drucker z. B. Thermosublimationsdrucker (Canon Selphy) per WLAN.
Günstige Kameras für Variante B (CCAPI, Liste nicht offiziell bestätigt): EOS 250D, EOS M200,
PowerShot SX70 HS. CCAPI muss erst kostenlos bei Canon freigeschaltet werden (Entwicklerprogramm).
Für Variante C (USB, gPhoto2) passen auch billigere Modelle wie EOS 2000D/4000D.
Für einen ganzen Abend Netzteil bzw. Akku-Attrappe einplanen.
Fertige Lösungen gibt es auch (z. B. iPad-Apps, Open-Source-Projekte für Raspberry Pi).

Entscheidung (Stand 03.11.2026): Tendenz zur **Canon EOS 2000D** per USB (Variante C).

## Funktionsideen für die Fotobox

Grundfunktionen (erste Version):
- Startbildschirm mit großer Anleitung, Auslösen per Antippen oder Buzzer
- Livebild und Countdown (3-2-1), danach Vorschau mit „Nochmal“ oder „Behalten“
- Einzelfoto oder Collage (z. B. 4 Fotos als Fotostreifen)
- Rahmen bzw. Overlay mit Namen des Brautpaars, Datum und Motiv
- Automatisch speichern, zusätzlich Sicherung auf USB-Stick
- Diashow der bisherigen Fotos, wenn niemand die Fotobox benutzt
- Admin-Bereich mit PIN (Einstellungen, Fotos ausblenden oder löschen)

Spaß:
- GIF oder Boomerang aus mehreren Bildern
- Posen-Vorschläge per Zufall („Alle machen ein Herz“)
- Filter (Schwarzweiß, Vintage)
- Digitaler Hintergrund (Greenscreen)
- Tisch-Aufgaben und Foto-Bingo (über die Gästeliste)
- Video-Gästebuch (kurze Videobotschaft, über Tablet- oder Webcam-Kamera)

Teilen und Drucken:
- Druck mit Zähler und Warnung, wenn Papier zur Neige geht
- QR-Code zum Herunterladen des Fotos aufs Handy
- Gästebuch: Namen antippen, kurzen Gruß dazuschreiben

Nach der Hochzeit:
- Export aller Fotos als ZIP, sortiert nach Uhrzeit, Tisch oder Person
- Galerie, Dankeskarten, Statistik (meiste Fotos, beliebteste Uhrzeit)

Betrieb: Kiosk-Modus (Gäste können die App nicht verlassen), läuft offline, startet nach einem
Absturz von selbst neu. Datenschutz: Gäste mit einem Schild über die Fotobox informieren.

## Drucken (entschieden: ja)

- Drucker: Canon Selphy (z. B. CP1500), per USB am Laptop/Raspberry Pi (Linux: CUPS + Gutenprint,
  vorher testen). Ca. 40–50 s pro Druck, Papierfach fasst nur wenige Blatt (etwa 18).
- Kosten: Papier und Farbband im Set (108 Blatt), grob 0,30–0,40 € pro Druck.
  Für ca. 100 Gäste etwa 150–200 Drucke einplanen (2 Sets).
- Profi-Alternative (DNP, Mitsubishi): billiger pro Druck, aber teuer in der Anschaffung –
  für eine Hochzeit nicht nötig.
- Formate: 10 × 15 cm Einzelfoto oder Collage; Fotostreifen als zwei Streifen auf 10 × 15, danach schneiden.
- Funktionen: Anzahl Kopien wählen, Drucklimit pro Foto, Warteschlange anzeigen, Papierzähler mit
  Hinweis „Papier nachlegen“, Nachdruck aus dem Admin-Bereich.

Schnellere Drucker (Stand 04.11.2026):
- **DNP DS-RX1HS**: Standard bei Fotobox-Verleihern, ca. 12 s pro 10 × 15, Rolle für ca. 700 Drucke,
  schneidet Fotostreifen selbst, unter Linux gut unterstützt. Gebraucht nur mit Druckzähler und Testdruck kaufen.
- **DNP DS620A**: kleiner und etwas schneller, teurer.
- **Mitsubishi CP-D90DW**: ca. 9 s pro Druck.
- Haken: Verbrauchsmaterial gibt es nur in großen Rollen (Hunderte Drucke) – für eine einzige Hochzeit oft
  teurer als der Selphy. Alternativen: Profidrucker leihen, oder zwei Selphys abwechselnd drucken lassen.

Kosten pro Foto 10 × 15 (Händlerpreise, recherchiert 04.11.2026, können sich ändern):
| Drucker | Set | Preis | pro Foto | Material für 200 Fotos |
|---|---|---|---|---|
| Canon Selphy | KP-108IN, 108 Drucke (2er-Pack 216) | ca. 30–34 € (2er-Pack ca. 50 €) | 0,23–0,31 € | ca. 50 € (2er-Pack) |
| DNP DS-RX1HS | 2 Rollen, 1400 Drucke | ca. 160–185 € | 0,12–0,13 € | ca. 166 € (ganzes Set) |
| DNP DS620A | 2 Rollen, 800 Drucke | ca. 120–130 € | 0,15–0,16 € | ca. 120 € (ganzes Set) |
| Mitsubishi CP-D90DW-P | CK-D746, 800 Drucke | ca. 126 CHF (nur CH-Preis gefunden) | ca. 0,16 € | ca. 130 € (ganzes Set) |
Ab etwa 700 Drucken ist der DNP DS-RX1HS beim Material günstiger als der Selphy (ohne Druckerkauf).
Fotostreifen: DNP druckt zwei Streifen auf ein 10 × 15 und schneidet sie, Kosten pro Streifen also halb.

Entscheidung (Stand 05.11.2026): Tendenz zu **zwei Canon Selphys**, die abwechselnd drucken.

Kamera-Vergleich 200D vs. 2000D:
- 200D: Dual-Pixel-Autofokus (schnell und sicher im Livebild), DIGIC 7, ISO bis 25600, 5 Bilder/s,
  dreh- und schwenkbarer Touchscreen, Bluetooth, Mikrofoneingang, Akku LP-E17.
- 2000D: langsamer Kontrast-Autofokus im Livebild, DIGIC 4+, ISO bis 6400 (12800 erweitert),
  3 Bilder/s, fester Bildschirm ohne Touch, Akku LP-E10.
- Für die Fotobox zählt vor allem der Autofokus im Livebild und das bessere Rauschverhalten bei
  wenig Licht → 200D klar besser. Umgehen lässt sich das bei der 2000D mit manuell fest eingestelltem
  Fokus (Markierung auf dem Boden, Blende f/5.6–8).
