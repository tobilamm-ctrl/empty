# Tests für LAMMping

```
node camper-tests/run.js              # alle Tests (etwa 40 Minuten)
node camper-tests/run.js e2e90 push84 # nur einzelne
```

- `tests/` – Browser-Tests (`e2e…`, `karte…`, Playwright) und Server-Tests (`srv…`, `push…`).
- `fixtures/` – Testdatenbank (`testdaten.sqlite`, Anmeldung `tobi` / `segeln1`, nur für Tests) und Testfotos.
- `run.js` baut in `.work/` eine frische Kopie der App auf, startet PHP (Port 8766) und einen Ersatz-Push-Dienst (Port 9911)
  und setzt vor jedem Test die Datenbank zurück. Ausgaben und Bildschirmfotos liegen danach in `.work/`.

Ein Test gilt als bestanden, wenn er ohne Absturz endet, „Fehler: keine“ meldet und kein „✘“ ausgibt.
Viele ältere Tests schreiben nur mit, was sie sehen; neue Tests sollen ihre Erwartungen mit ✔/✘ prüfen (siehe `e2e89.js`).
