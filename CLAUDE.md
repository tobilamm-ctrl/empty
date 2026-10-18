# Aufgaben-Generator Mathematik Mittelschule Bayern

Bedienung und Aufbau: `README.md`. Aufgabentypen schreiben: `tools/AUFGABENTYPEN.md`. Lehrplan-Checkliste: `konzept/lehrplan-abgleich.md`.

## Vorgaben der Lehrkraft (verbindlich)

- **Reihenfolge der Jahrgangsstufen:** Eine Klasse wird vollständig fertiggestellt (alle Punkte der Checkliste,
  M-Zug und Regelklasse), bevor die nächste begonnen wird.
- **Klasse 10 (M-Zug) kommt zuletzt** – erst, wenn die Klassen 5 bis 9 vollständig fertig sind.
- Arbeiten an Aufgabentypen auf Haiku-Agenten auslagern; Ergebnisse immer selbst fachlich prüfen
  (Mathematik, realistische Sachkontexte, vollständige Lösungsschritte, Skizzen ansehen).
- Option „Seiten ganz ausfüllen“: jede Seite des Arbeitsblatts wird voll genutzt, egal wie viele Seiten es sind.
  Die Vorbelegung wird auf höchstens 2 Seiten gekürzt (bei 5–6 Teilen 3 Seiten). Brüche mit waagerechtem Bruchstrich; Brüche im Ergebnis als gemischte Zahl.

## Prüfen vor jedem Commit

```
node tools/test-types.js --samples 0
node tools/test-check.js
node tools/audit-steps.js
python3 tools/build.py
```
