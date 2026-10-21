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
