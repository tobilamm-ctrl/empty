#!/bin/bash
# canva_bild.sh <Dateiname ohne .png> <Vorschau-PNG> <Canva-Link>
B=/home/user/empty/WiB7_LB2_Arbeit/bilder
cp "$2" "$B/$1.png" && rm -f "$B/$1.png.platzhalter" && printf '%s.png\t%s\n' "$1" "$3" >> "$B/canva_links.tsv" && echo "gespeichert: $1"
