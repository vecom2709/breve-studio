#!/bin/sh
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 start-preview.py
elif command -v python >/dev/null 2>&1; then
  exec python start-preview.py
else
  echo "Python 3 wurde nicht gefunden. Bitte Python 3 installieren und dieses Skript erneut starten."
  read -r _
  exit 1
fi
