#!/bin/bash
# Baut alle Stunden neu, packt das ZIP und committet
cd /home/user/empty/werkzeug || exit 1
export NODE_PATH=$(npm root -g)
for s in stunde01.js stunde02.js stunde03.js stunde04.js stunde05.js stunde06.js stunde07.js stunde08_09.js stunde10_13.js leistung.js uebersicht.js; do node $s >/dev/null || echo "FEHLER $s"; done
cd /home/user/empty && rm -f WiB7_LB2_Arbeit.zip && zip -qr WiB7_LB2_Arbeit.zip WiB7_LB2_Arbeit -x '*.platzhalter'
git add -A && git commit -qm "${1:-Material neu gebaut}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FTW1Jxo9dMCKUL1bcqqfs9" && git push -u origin claude/determined-knuth-tjajtt 2>&1 | tail -1
ls /home/user/empty/WiB7_LB2_Arbeit/bilder/*.platzhalter 2>/dev/null | wc -l
