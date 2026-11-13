# LAMMping – Camper-App der Familie (PWA)

Bedienung und alle Lieferungen: `ANLEITUNG.md`. Ideen, Entscheidungen und offene Punkte: `IDEEN.md`.
Immer auf Deutsch antworten. Nutzer ist Tobi (Super-Admin der Familie).

## Aufbau

- **App:** reine ES-Module ohne Build-Schritt. `js/app.js` hält Zustand, Ansichten (`VIEWS`), Aktionen (`ACTIONS`),
  Formulare (`FORMS`), Änderungen (`CHANGES`) und reicht Hilfen über `APP` an die Module weiter.
  Jedes Modul ist `export default function installX(app)` und wird unten in `app.js` der Reihe nach eingehängt.
  Module erweitern sich über Einhängestellen, die sie verketten (z. B. `app.todayCard`, `app.stopExtra`,
  `app.entryExtra`, `app.tripFormExtra`, `app.tripSaved`, `app.entrySave`, `mapHooks`, `afterDraw`, `settingsPanels`):
  immer die vorige Funktion merken und aufrufen.
- **Reiseblog-Ansicht:** `js/blogansicht.js` zeichnet eine Reise für die öffentliche Seite (`blog.html`, `js/blog.js`)
  und für Reisen anderer Crews in der App (`js/mitreisen.js`).
- **Server:** `api/index.php` (Einstieg und alle Aktionen `?a=…`) mit den Teilen in `api/teile/`. PHP ohne Abhängigkeiten,
  SQLite oder MySQL. Neue Tabellen und Spalten legt `db()` beim ersten Aufruf selbst an.
- **Service Worker:** `sw.js` mit der Liste aller Dateien, die offline liegen sollen. Neue Dateien dort eintragen.

## Regeln für jede Lieferung

- Versionsnummer gemeinsam erhöhen: `APP_VERSION` in `js/app.js` und `VERSION 'lammping-NN'` in `sw.js`.
- Braucht die App neue Server-Aktionen: `API_VERSION` in `api/index.php` erhöhen und dem Nutzer sagen, dass der
  Ordner `api` (ohne `config.php` und `data`) neu hochgeladen werden muss; vorher eine Sicherung empfehlen.
- `ANLEITUNG.md`: neuer Abschnitt „## Neu in Version NN“ über dem vorigen. Erledigtes in `IDEEN.md` abhaken.
- **Nie** `api/config.php` oder `api/data` ausliefern oder überschreiben.
- Standort, Mitteilungen, Kamera: nie von selbst nach einer Erlaubnis fragen, nur nach einem Tipp des Nutzers.

## Prüfen vor jedem Commit

```
node camper-tests/run.js            # alle Browser- und Server-Tests (ca. 40 Minuten)
node camper-tests/run.js e2e80 …    # einzelne Tests
```
Zusätzlich die vier Prüfungen aus der `CLAUDE.md` im Hauptordner (Aufgaben-Generator), sie gelten für das ganze Repository.
Neue Funktionen bekommen einen eigenen Test in `camper-tests/tests/`. Die Tests melden am Ende „Fehler: keine“.
Was im Testbrowser nicht geht (echte Push-Anmeldung, Kamera, GPS-Genauigkeit), dem Nutzer als „am Handy prüfen“ nennen.

## ZIPs für den Nutzer (aus `camper-app/`)

```
rm -f ../lammping-*-NN.zip
zip -qr ../lammping-komplett-NN.zip . -x ".gitignore" "CLAUDE.md" "api/config.php" "api/data/*" "api/data/"
git diff --name-only --diff-filter=d <letzte-gelieferte-Version> HEAD -- . | sed 's#^camper-app/##' | grep -v '^CLAUDE.md$' | xargs zip -q ../lammping-update-NN.zip
```
Beide Dateien dem Nutzer schicken. Erst ausliefern, wenn die Tests durch sind; sonst klar sagen, was nicht gelaufen ist.
