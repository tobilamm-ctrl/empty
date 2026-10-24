# LAMMping – Einrichtung

LAMMping ist eine Web-App für euren Minicamper: Karte mit Reiseroute, Tagebuch mit
Stellplätzen und Sehenswertem, Auto-Standort, Einkaufs- und Merkliste, Boxen-Inventar mit
Packliste, Kassenbuch und ein Archiv aller Reisen. Alles läuft auf eurem eigenen Webspace,
eure Daten und Fotos bleiben dort.

## Voraussetzungen

- Webspace mit **PHP 8** und der PHP-Erweiterung **pdo_sqlite** (bei Hetzner-Webhosting
  Standard). Alternativ geht eine MySQL-Datenbank.
- **HTTPS** für die Domain. Ohne HTTPS funktionieren GPS und die Offline-Funktion nicht.
  In der konsoleH: Domain → SSL-Manager → Let's-Encrypt-Zertifikat aktivieren.

## 1. Einrichtungscode festlegen

In `api/config.php` die Zeile

```php
'setup_code' => 'bitte-aendern',
```

auf einen eigenen Code ändern, z. B. `'setup_code' => 'Gardasee-2027',`. Der Code wird nur
einmal bei der Ersteinrichtung gebraucht und verhindert, dass jemand anderes sich vor euch
zum Verwalter macht.

## 2. Hochladen

1. Den **Inhalt** des Ordners per SFTP (z. B. mit FileZilla) in einen Ordner auf dem
   Webspace kopieren, z. B. `public_html/lammping`. Die versteckten Dateien `.htaccess`
   (auch die in `api/data/`) müssen mit (in FileZilla: Server → Versteckte Dateien anzeigen).
2. Der Ordner `api/data` muss für PHP **beschreibbar** sein. Dort landen die Datenbank
   (`lammping.sqlite`) und die Fotos. Bei Hetzner passt das meist von selbst; sonst in
   FileZilla Rechtsklick → Dateiberechtigungen → 755 (oder 775).
3. Prüfen, dass die Daten geschützt sind: `https://eure-domain.de/lammping/api/data/`
   muss „Forbidden“ zeigen.

## 3. Ersteinrichtung

1. `https://eure-domain.de/lammping/` öffnen.
2. Einrichtungscode, Name der Crew (z. B. „Familie“), deinen Namen, Anmeldenamen und
   Passwort eingeben → **Einrichten**. Du bist jetzt Verwalter.
3. Einstellungen (Zahnrad) → **Personen und Crews verwalten** → für jede Person
   **+ Person**. Wer Konten verwalten soll (z. B. der andere Elternteil), bekommt
   „Verwalter“. Neue Personen werden gleich in die geöffnete Crew aufgenommen.
4. In der Crew festlegen, wer **mitzahlt**: Nur diese Personen werden in der Kasse bei
   geteilten Ausgaben berücksichtigt. Kinder stehen standardmäßig auf „zahlt nicht mit“.

## 4. Als App installieren

LAMMping lässt sich wie eine normale App mit dem Schaf als Symbol auf den Startbildschirm legen.
Sie startet dann ohne Browserleiste und funktioniert auch offline.

- **Android (Chrome):** Die App bietet selbst „Installieren“ an (Hinweis im Tagebuch und in
  den Einstellungen unter „App installieren“). Alternativ Menü ⋮ → „App installieren“.
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“. Die App zeigt diesen Hinweis
  einmal im Tagebuch an.

## Crews

Eine Crew ist eine gemeinsame Datensammlung mit eigenen Reisen, Listen, Boxen und eigener
Kasse. Beispiele:

- **Familie:** alle zusammen, die Kinder sehen und schreiben mit.
- **Lenas Touren:** eine eigene Crew für ein Kind, z. B. für Ausflüge mit Freunden.

Wer in mehreren Crews ist, wechselt in den Einstellungen.

## Offline und Abgleich

Jedes Handy hat eine vollständige Kopie der Crew-Daten. Ohne Netz könnt ihr ganz normal
weiterschreiben; die Änderungen werden gesammelt und übertragen, sobald wieder Netz da ist.
Ein gelber Punkt am Zahnrad zeigt wartende Änderungen, ein roter ein Problem (Details in den
Einstellungen unter „Abgleich“). Bei geöffneter App gleicht sie etwa alle 15 Sekunden ab.

Ändern zwei Personen gleichzeitig **denselben** Eintrag, gilt die zuletzt übertragene Fassung.

## Updates einspielen

Neue Dateien hochladen, dabei **`api/config.php` und den Ordner `api/data` nicht
überschreiben**. In `sw.js` die Zeile `const VERSION = 'lammping-4'` hochzählen, damit die
Handys die neue Version laden.

## Sicherung

- **In der App:** Einstellungen → „Sicherung herunterladen“ speichert die Daten der
  geöffneten Crew samt Fotos in einer Datei.
- **Auf dem Server:** Den Ordner `api/data` per SFTP herunterladen. Darin steckt alles.

## MySQL statt SQLite (optional)

In der konsoleH eine Datenbank anlegen und in `api/config.php` die MySQL-Zeilen eintragen
(die SQLite-Zeilen dafür auskommentieren). Die Tabellen legt die App selbst an.

## Gut zu wissen

- **Route:** Die Linie auf der Karte verbindet eure Einträge mit Position in zeitlicher
  Reihenfolge. Eine lückenlose Aufzeichnung während der Fahrt kann eine Web-App nicht leisten.
  Geplant für Stufe 2: GPX-Import aus einer Tracking-App wie OsmAnd oder Komoot.
- **Ortsnamen** werden über OpenStreetMap (Nominatim) ermittelt, wenn ihr die aktuelle
  Position übernehmt. Die Karte selbst kommt ebenfalls von OpenStreetMap.
- **Anmeldung** bleibt auf jedem Handy gut ein Jahr bestehen. Nach 10 falschen Passwörtern
  ist die Anmeldung 15 Minuten gesperrt.
