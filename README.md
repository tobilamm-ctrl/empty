# Aufgaben-Generator Mathematik (Mittelschule Bayern)

Erzeugt Arbeitsblätter mit Zufallsaufgaben samt Lösungsblatt als Word-Datei.
Alles steckt in **einer** Datei, die ohne Internet im Browser läuft.

## Benutzen

1. `dist/aufgaben-generator.html` herunterladen und per Doppelklick öffnen (Chrome, Edge oder Firefox).
2. Links Klasse, Thema und Niveau wählen. Die Teile A–D lassen sich einzeln anpassen:
   Aufgabentyp, Sterne (★ bis ★★★) und Anzahl der Aufgaben.
3. In der Vorschau mit der Maus über eine Aufgabe fahren und auf den Würfel klicken,
   um nur diese Aufgabe neu zu würfeln.
4. „Word-Datei herunterladen“ liefert Arbeitsblatt und Lösungsblatt in einer Datei
   (mit Gruppe B auf Wunsch zwei Arbeitsblätter und zwei Lösungsblätter).

**Blatt-Code:** Unten auf jedem Blatt steht ein Code. Wer ihn links unter
„Blatt-Code zum Wiederherstellen“ einfügt und auf „Laden“ klickt, bekommt genau dieses Blatt wieder.

**Speichern:** Die letzte Einstellung merkt sich der Browser automatisch.

## Übungsmodus für Schüler (Entwurf)

`dist/ueben.html` ist eine eigene Datei für Schüler: Themen und Schwierigkeit wählen,
dann eine Aufgabe nach der anderen am Bildschirm lösen – mit Tipp, schrittweiser Lösung
und wahlweise Selbstkontrolle oder Eingabe des Ergebnisses mit automatischer Prüfung.

- **Code für die Klasse:** Unten auf der Startseite „Für Lehrkräfte“ öffnen, Auswahl treffen,
  Code an die Klasse geben. Die Schüler tippen ihn oben ein.
- **Prüfcode:** Am Ende zeigt die Datei einen Prüfcode mit Datum und Ergebnis. Im Lehrkraft-Bereich
  (gleiche Auswahl einstellen) lässt er sich kontrollieren.
- Alles läuft offline, es werden keine Daten übertragen.

## Stand

Ausbauschritt 1: Grundgerüst und Klasse 7 M-Zug (Rechenaufgaben aus Prozentrechnung,
rationalen Zahlen, Gleichungen, Proportionalität, Statistik, Winkelsumme und Maßstab).
Die Themenliste aller Klassen steht in `konzept/lehrplan-abgleich.md`.

## Für die Entwicklung

- `src/core/` Zufall, Bruchrechnung, Blatt-Erzeugung, Word-Ausgabe, Vorschau
- `src/types/` ein Aufgabentyp pro Datei bzw. Themenbereich, Anleitung in `tools/AUFGABENTYPEN.md`
- `src/ui/` Oberfläche
- `python3 tools/build.py` baut `dist/aufgaben-generator.html`
- `node tools/test-types.js [typ]` prüft alle Aufgabentypen
- `node tools/sample-docx.js beispiel.docx typ1,typ2` erzeugt eine Beispiel-Word-Datei

Schrift der Oberfläche: Familjen Grotesk (SIL Open Font License), eingebettet.
