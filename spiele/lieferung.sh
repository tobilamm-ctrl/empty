#!/bin/sh
# Lieferung bauen: sh spiele/lieferung.sh NR VORIGER_COMMIT ZIELORDNER
# Legt spieleabend-NN-komplett.zip und spieleabend-NN-update.zip (geändert seit VORIGER_COMMIT) im Zielordner ab.
set -e
NR=$(printf "%02d" "$1"); BASE="$2"; OUT="$3"
cd "$(dirname "$0")/plattform"
rm -f "$OUT/spieleabend-$NR-komplett.zip" "$OUT/spieleabend-$NR-update.zip"
zip -qr "$OUT/spieleabend-$NR-komplett.zip" . -x 'data/rooms/*' 'data/users.json' 'data/login_attempts.json' 'data/*.json'
CHANGED=$(git diff --name-only --diff-filter=ACMR "$BASE" -- . ':!data' | sed 's|^spiele/plattform/||')
DELETED=$(git diff --name-only --diff-filter=D "$BASE" -- . ':!data' | sed 's|^spiele/plattform/||')
TMP=$(mktemp -d)
for f in $CHANGED; do mkdir -p "$TMP/$(dirname "$f")"; cp "$f" "$TMP/$f"; done
[ -n "$DELETED" ] && printf "Diese Dateien auf dem Server löschen:\n%s\n" "$DELETED" > "$TMP/GELOESCHT.txt"
(cd "$TMP" && zip -qr "$OUT/spieleabend-$NR-update.zip" .)
rm -rf "$TMP"
echo "Komplett: $OUT/spieleabend-$NR-komplett.zip"; echo "Update ($(echo "$CHANGED" | wc -w) Dateien):"; echo "$CHANGED"
