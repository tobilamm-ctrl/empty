#!/bin/sh
# Erzeugt alle Dateien neu: Bilder, Druckbögen (HTML/PDF), Word-Vorlagen und das digitale Tool.
set -e
cd "$(dirname "$0")"
python3 werkzeuge/bilder.py
node werkzeuge/rendern.mjs png
python3 werkzeuge/bogen_erzeugen.py
python3 werkzeuge/karten_erzeugen.py
node werkzeuge/rendern.mjs pdf
node werkzeuge/app_icon.mjs
python3 werkzeuge/tool_erzeugen.py
