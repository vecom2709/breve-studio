#!/usr/bin/env bash
# Baut die Seite, erzeugt fehlende Vorschaubilder, prüft und veröffentlicht auf GitHub Pages (Zweig gh-pages).
# Aufruf im Repository-Wurzelordner: bash tools/pakete-auto/veroeffentlichen.sh "<Commit-Text>"
set -euo pipefail
NACHRICHT="${1:-Neue Pakete}"
ATTR=$'\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
if [ -n "${CLAUDE_SESSION_URL:-}" ]; then ATTR+=$'\n'"Claude-Session: ${CLAUDE_SESSION_URL}"; fi

npm run build >/tmp/sb-build.log 2>&1 || { tail -40 /tmp/sb-build.log; exit 1; }
grep -q "0 errors" /tmp/sb-build.log || { grep -E "error" /tmp/sb-build.log | head -20; exit 1; }

# Vorschaubilder nur für Pakete ohne Bild (inkrementell)
(npx astro preview --host 127.0.0.1 --port 4173 >/tmp/sb-preview.log 2>&1 &) ; sleep 5
python3 tools/bilder/vorschau_bilder.py http://127.0.0.1:4173 --nur-fehlende
pkill -f "astro preview" || true

# Quelltext sichern
git add -A
git -c user.name="vecom2709" -c user.email="noreply@vecom-design.it" commit -q -m "${NACHRICHT}${ATTR}" || true
git push -q origin HEAD:redesign/startseite-foto

# Statische Online-Fassung
PUBLIC_STATISCH=1 npm run build:fast >/tmp/sb-pages.log 2>&1
node tools/pages-bauen.mjs
rm -rf /tmp/sb-gh && git clone -q --depth 1 -b gh-pages "$(git remote get-url origin)" /tmp/sb-gh
find /tmp/sb-gh -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r dist-pages/. /tmp/sb-gh/
cd /tmp/sb-gh && git add -A && git -c user.name="vecom2709" -c user.email="noreply@vecom-design.it" commit -q -m "Online-Vorschau: ${NACHRICHT}${ATTR}" && git push -q origin gh-pages
echo "VEROEFFENTLICHT"
