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

## Kinderkonten

In der Verwaltung bei einer Person unter **„Was sieht …?“** festlegen, welche Reiter, Bereiche und Spiele
sie sieht. „Kinder-Vorschlag“ setzt eine sinnvolle Auswahl. Mit **„Einfache Ansicht“** startet das Konto auf
einer eigenen Seite mit großen Kacheln statt „Mehr“. Auch die Startseite lässt sich hier vorgeben. Jede
Person kann ihre Startseite selbst unter Einstellungen → Startseite ändern.

Die Freigaben sorgen für Übersicht, sie sind keine Sperre: Kasse, Tankbuch und Dokumente schützt zusätzlich
der Server, alles andere liegt als Kopie der Crew-Daten auf dem Handy.

Beim ersten Start zeigt LAMMping jeder Person eine kurze Einführung (wieder abrufbar in den Einstellungen).

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

Jede Lieferung heißt `lammping-komplett-NN.zip` mit fortlaufender Nummer. Dieselbe Nummer steht unten in den
Einstellungen („Version NN“) – so seht ihr, ob das Handy schon die neueste Version hat.

**Wichtig:** Immer auch `api/index.php` mit hochladen. Ist sie veraltet, meldet die App Verwaltern
„Der Server-Teil ist veraltet“, und neue Funktionen wie Reiseblog, Sicherungen oder Kinder-Freigaben
antworten mit „Unbekannte Aktion“.

Neue Dateien hochladen, dabei **`api/config.php` und den Ordner `api/data` nicht
überschreiben**. In `sw.js` die Zeile `const VERSION = 'lammping-24'` hochzählen (z. B. auf `lammping-25`), damit die
Handys die neue Version laden.

## Sicherung

- **Automatisch:** Der Server legt einmal pro Woche selbst eine Sicherung der Datenbank in
  `api/data/sicherungen` an und hebt die letzten vier auf (Einstellungen → Automatische Sicherung, dort auch
  zum Herunterladen und „Jetzt sichern“). Gelöschte Fotos bleiben 30 Tage in `api/data/papierkorb`.
  Wiederherstellen: die Sicherungsdatei als `api/data/lammping.sqlite` einsetzen.

- **In der App:** Einstellungen → „Sicherung herunterladen“ speichert die Daten der
  geöffneten Crew samt Fotos in einer Datei.
- **Auf dem Server:** Den Ordner `api/data` per SFTP herunterladen. Darin steckt alles.

## MySQL statt SQLite (optional)

In der konsoleH eine Datenbank anlegen und in `api/config.php` die MySQL-Zeilen eintragen
(die SQLite-Zeilen dafür auskommentieren). Die Tabellen legt die App selbst an.

## Gut zu wissen

- **Impressum und Datenschutz:** Für eine rein private, passwortgeschützte Seite für die Familie ist kein
  Impressum nötig, und die DSGVO greift bei rein familiärer Nutzung nicht. Suchmaschinen sind über
  `robots.txt` und `noindex` ausgesperrt.
- **Route:** Die Linie auf der Karte verbindet eure Einträge mit Position in zeitlicher
  Reihenfolge. Eine lückenlose Aufzeichnung während der Fahrt kann eine Web-App nicht leisten.
  Geplant für Stufe 2: GPX-Import aus einer Tracking-App wie OsmAnd oder Komoot.
- **Ortsnamen** werden über OpenStreetMap (Nominatim) ermittelt, wenn ihr die aktuelle
  Position übernehmt. Die Karte selbst kommt ebenfalls von OpenStreetMap.
- **Anmeldung** bleibt auf jedem Handy gut ein Jahr bestehen. Nach 10 falschen Passwörtern
  ist die Anmeldung 15 Minuten gesperrt.

## Bereiche im Überblick

- **Karte:** Route der Reise, gemerkte und geplante Orte (Herz-Knopf blendet sie ein und aus),
  importierte GPX-Strecken, Auto-Standort.
- **Tagebuch:** je Reise **Planung** (Stellplätze und Sehenswertes vormerken, Listen und Extras
  zum Packen für diese Reise) und **Tagebuch** (Einträge unterwegs). „Hier sind wir“ macht aus
  einem geplanten Ort einen Tagebuch-Eintrag.
- **Tagebuch unterwegs:** Während einer laufenden Reise zeigt die **Heute-Karte** Reisetag, Wetter,
  Sonnenauf- und -untergang, das geparkte Auto und das nächste Ziel. Der Tageskopf zeigt Wetter, Kilometer
  (Luftlinie) und Länder des Tages. Das erste Foto eines Eintrags erscheint groß. Neue Einträge über den
  runden Knopf „+ Eintrag“ unten rechts.
- **Was ist in der Nähe?** (Lupe auf der Karte oder in der Heute-Karte): Trinkwasser, Entsorgung, WC und
  Dusche, Supermarkt, Bäcker, Tankstelle, Waschsalon, Werkstatt, Spielplatz, Baden, Stell- und Campingplätze
  sowie Apotheke, Arzt und Krankenhaus aus OpenStreetMap im Umkreis
  von 2, 5 oder 15 km. Treffer lassen sich ansteuern oder in die Wunschliste übernehmen.
- **Reiseblog** (Kachel unter „Mehr“, nur Verwalter): je Reise ein geheimer Link zum Lesen, z. B. für die
  Großeltern. Einstellbar: Begrüßungstext, Fotos, Texte, Highlights, Karte und „erst am nächsten Tag zeigen“
  (damit niemand sieht, wo ihr gerade seid). Nie zu sehen sind Kosten, Listen, Dokumente oder Namen. Einzelne
  Einträge blendet „Nicht im Reiseblog zeigen“ aus. „Aus“ oder „Neuen Link erzeugen“ machen den alten Link ungültig.
- **Leiste über dem Tagebuch:** Starten bzw. Beenden, Fotos einsortieren, Rückblick, Export und nach der
  Reise Packliste und Archiv – als Symbole, die sich die Breite teilen. „Starten“ setzt den Reisebeginn auf heute.
- **Postkarte** (in einem Eintrag mit Foto): Foto, Gruß, Text und Mini-Karte der Strecke als Bild zum
  Teilen, z. B. per WhatsApp.
- **Planung:** Zwischen den geplanten Orten stehen Kilometer und Fahrzeit (über den freien Routendienst
  von OpenStreetMap, ohne Netz grob geschätzt). Etappen über 4 Stunden werden markiert.
- **Fotos einsortieren** (Knopf über dem Tagebuch): Fotos aus der Galerie auswählen. LAMMping liest
  Aufnahmezeit und, falls vorhanden, den Ort aus den Fotos und schlägt den passenden Eintrag vor. Fotos ohne
  passenden Eintrag werden zu neuen Einträgen zusammengefasst. Manche Handys entfernen den Ort beim
  Auswählen, dann zählt nur die Zeit.
- **Diktieren:** Das Mikrofon im Textfeld eines Eintrags schreibt Gesprochenes mit (Spracherkennung des
  Handys; nicht jeder Browser kann das).
- **Neues Land:** Beim ersten Eintrag in einem neuen Land einer Reise erscheinen Tempo, Promille, Maut,
  Pflichtausstattung und Notruf.
- **Stellplatz-Steckbrief:** Untergrund, Sonne, Lärm, Abreise bis, Hunde erlaubt und „Wiederkommen?“.
  Bei Lieblingsplätzen steht „Gern wieder“ mit in der Liste.
- **Packliste auswerten** (nach „Reise beenden“): festhalten, was gefehlt hat und was nie gebraucht wurde.
  Beim Packen der nächsten Reise erscheinen die Hinweise; „Einpacken“ setzt Fehlendes direkt als Extra auf
  die Packliste.
- **Rückblick** (Knopf über dem Tagebuch): Die Strecke zeichnet sich Tag für Tag auf der Karte nach, an den
  Orten erscheinen Titel und Fotos. Pause und Tempo 1×, 2×, 4× unten.
- **Reisebudget** (in der Reise einstellen): Die Kasse zeigt, wie viel noch übrig ist und wie viel pro
  restlichem Tag bleibt; die Heute-Karte auch.
- **Highlight des Tages:** Jeder schreibt, was am schönsten war (mit Symbol). Steht im Tagebuch unter dem
  Tag, im Reiseheft und im Reiseblog. Verwalter können es auch für die Kinder eintragen.
- **Camper-Dienste** (unter Mehr): Abwasch, Wasser holen, Müll usw. werden jeden Tag reihum unter allen
  Mitreisenden verteilt. Abhaken bringt Punkte (und Reisepass-Stempel), „Tauschen“ gibt einen Dienst ab.
  Die Liste der Dienste ändern Verwalter.
- **Feedback** (unten auf „Mehr“ und in den Einstellungen): Was stört oder fehlt, landet in der Merkliste
  „LAMMping-Feedback“. „Alles kopieren“ in den Einstellungen gibt die Sammlung als Text weiter.
- **Schnellstart (Android):** Lange auf das LAMMping-Symbol drücken: „Ich bin hier“, „Auto geparkt“,
  „Einkaufsliste“ und „Highlight des Tages“. Die Einträge lassen sich auch einzeln auf den Startbildschirm
  ziehen. Auf dem iPhone geht das nicht; dort hilft die App „Kurzbefehle“ mit „URL öffnen“, z. B.
  `https://lammping.lamm7.de/lammping/#/karte/hier`.
- **Aus Google Maps importieren** (Seite „Reisen“): Zeitachse in Google Maps exportieren (Android:
  Einstellungen → Standort → Standortdienste → Zeitachse → „Zeitachsendaten exportieren“; iPhone: Google Maps →
  Einstellungen → Persönliche Inhalte), Datei auswählen, Zeitraum wählen (von Google erkannte Reisen werden
  vorgeschlagen). LAMMping macht daraus Strecke, Stellplätze (Übernachtungen) und Orte ab 25 Minuten Aufenthalt,
  dazu Fähren, Rad- und Fußtouren. Namen kommen von OpenStreetMap (etwa eine Sekunde pro Ort). Vor dem Übernehmen
  lässt sich alles abwählen, umbenennen und die Art ändern. Danach am besten „Fotos einsortieren“.
- **Reise beenden und exportieren** (im Tagebuch): „Reise beenden“ setzt das Ende auf heute, ins Archiv
  kommt die Reise erst mit „Ins Archiv“. „Exportieren“ erzeugt eine GPX-Datei (Strecke, Stopps, geplante
  Route) oder ein Reiseheft mit Streckenkarte, Etappen und Notizen: im Druckfenster „Als PDF speichern“.
- **Listen:** beliebig viele Einkaufs- und Merklisten, auf Wunsch einer Reise zugeordnet.
  Einträge antippen, um sie zu bearbeiten oder in eine andere Liste zu verschieben.
- **Boxen & Fächer:** Inventar mit Suche „Wo ist …?“, Packliste pro Reise mit Extras.
- **Eintragsarten im Tagebuch:** Stellplatz (Campingplatz, Stellplatz, frei stehen), Sehenswertes,
  Museum, Wanderung (Strecke, Höhenmeter, Dauer, GPX-Datei), Baden (See, Meer, Freibad …),
  Café / Restaurant, Spielplatz & Kinder, Tankstelle, Ver- und Entsorgung, Einkauf, Pause,
  Fähre & Maut, Werkstatt, Wäsche, Notiz. Bei Stellplatz, Baden, Café / Restaurant, Museum,
  Fähre, Werkstatt und Wäsche landen eingetragene Kosten automatisch in der Kasse (mit
  passender Kategorie). Die Filter im Tagebuch: Stellplätze, Erleben, Unterwegs, Notizen.
- **Mehr:** Unten auf der Seite „Kacheln anordnen“: Reihenfolge mit Pfeilen festlegen und Kacheln ausblenden, für jede Person einzeln. Kasse, Tankbuch (Verbrauch von Vollbetankung zu Vollbetankung), Orte
  (Wunschliste, Lieblingsplätze, Geplantes), Checklisten (Abfahrt, Ankunft), Fahrzeug
  (Steckbrief und Fristen mit Erinnerung), Statistik, Reisen und Archiv, Einstellungen, außerdem:
  - *Wetter* am aktuellen Standort bzw. letzten Stellplatz (Open-Meteo, braucht Internet).
  - *Länderinfos:* Tempolimits, Promillegrenze, Maut, Pflichtausstattung, Notruf und Tipps für die
    Länder der Reise. Ohne Gewähr – vor der Fahrt beim ADAC bzw. Auswärtigen Amt prüfen (Links in der App).
  - *Dokumente & Notfall:* Ausweise, Versicherung usw. mit Foto und Ablaufdatum (nur Verwalter
    sehen die Dokumente). Notfallkontakte und medizinische Infos sehen alle.
  - *Fotoalbum* je Reise oder als Jahresrückblick.
  - *Kochen:* Rezepte für die Campingküche, Zutaten mit einem Tipp auf die Einkaufsliste.
  - *Autarkie:* Füllstand Wasser, Gas und Strom mit Schätzung der Resttage. Ein Eintrag
    „Ver- und Entsorgung“ mit Häkchen „Wasser getankt“ füllt den Wassertank wieder auf.
  - *Reiseideen:* Vorschläge für künftige Ziele mit Ort, Reisezeit und Dauer. Alle können Notizen und
    Links dazuschreiben und mit dem Herz zeigen, wem die Idee gefällt. „Reise planen“ macht daraus eine
    neue Reise; die Notizen landen auf Wunsch als Merkliste in deren Planung.
  - *Währung umrechnen* (in Länderinfos und Kasse): Franken, Kronen, Złoty, Forint und Pfund mit dem
    Tageskurs der EZB, ohne Internet mit dem zuletzt geladenen Kurs.
  - *Reisepass* (in Spiele & Co): ein eigener Pass für jede Person. Über 50 vorgegebene Stempel (Nächte,
    Kilometer, Länder, Fähre, Meer, Gipfel, Rad, Museen, Kennzeichen, Bingo, Quiz …) kommen automatisch, und
    zwar aus den Reisen, bei denen die Person dabei war (in der Reise unter „Wer ist dabei?“). Dazu ein
    Visum-Stempel für jedes neue Land und ein Stempel für jeden Ort mit fünf Sternen. Verwalter vergeben
    außerdem eigene Stempel mit Name, Symbol, Farbe und Datum. Neue Stempel erscheinen beim nächsten Öffnen
    mit einer kleinen Stempel-Animation.
  - *Spiele & Co:* neu „Wie lange noch?“ mit Restzeit und Ankunft bis zum nächsten geplanten Ziel oder
    einem gesuchten Ort, groß für die Rückbank. Kennzeichen sammeln (deutsche Kennzeichen mit Stadt/Kreis und internationale,
    mit Rangliste je Reise), Reise-Bingo, Stadt-Land-Fluss mit Zeitlimit, Kennzeichen-Quiz,
    Länder-Sticker und euer Spieleportal Spieleabend (`https://spieleabend.lamm7.de/`), das sich mit einem Tipp direkt öffnet;
    die Adresse lässt sich unter „Spieleportal einstellen“ ändern. Kennzeichen-Daten: Senatsverwaltung
    Berlin, CC BY 3.0.
- **Karte bearbeiten** (Stift-Knopf auf der Karte):
  - *Orte:* auf die Karte tippen fügt nachträglich einen Stellplatz, Sehenswertes, eine Tankstelle,
    Ver- und Entsorgung, einen Einkauf, eine Pause oder eine Notiz ein. Datum und Uhrzeit werden so
    vorgeschlagen, dass der Ort zwischen den nächstgelegenen Stopps landet. Stopps lassen sich ziehen.
  - *Strecke:* Punkte antippen zeichnet die gefahrene Strecke, Punkte ziehen, antippen löscht,
    ○ fügt einen Zwischenpunkt ein. „Straßen folgen“ legt die Linie automatisch auf die Straßen
    (über den freien Routendienst von OpenStreetMap, braucht Internet). Auch importierte
    GPX-Strecken lassen sich so korrigieren.
  - Lange auf die Karte drücken öffnet das Einfügen auch ohne Bearbeiten-Modus.
- **Darstellung:** hell, dunkel oder wie das Handy (Einstellungen → Darstellung).

Tankbuch und Kasse sehen nur Personen mit Kassen-Freigabe.

## Ausprobieren ohne loszufahren

Einstellungen → **Testen**:

- **Testdaten anlegen** erzeugt die Beispielreise „Test: Gardasee“ (Route von Innsbruck bis
  Verona mit Stellplätzen, Sehenswertem, Tankstopps, Fotos, Kasse, Strecke), Beispiel-Listen,
  -Boxen, -Orte, eine Frist und die geplante Reise „Test: Ostsee planen“. Alles ist mit „Test“
  gekennzeichnet und für die ganze Crew sichtbar. **Testdaten entfernen** löscht genau diese
  Einträge wieder, eure eigenen bleiben unberührt.
- **Standort simulieren**: Statt GPS gilt der orange Punkt auf der Karte als euer Standort.
  Punkt dorthin ziehen, dann „Ich bin hier …“, „Auto geparkt“ oder die Entfernung zum Auto
  ausprobieren. Häkchen wieder entfernen, um das echte GPS zu nutzen.
