@echo off
cd /d "%~dp0"
where node >nul 2>&1 && (
  node start-preview.mjs
  goto :eof
)
where py >nul 2>&1 && (
  py -3 start-preview.py
  goto :eof
)
where python >nul 2>&1 && (
  python start-preview.py
  goto :eof
)
where python3 >nul 2>&1 && (
  python3 start-preview.py
  goto :eof
)
echo Weder Node.js noch Python 3 wurde gefunden.
echo Bitte Node.js oder Python 3 installieren und dieses Skript erneut starten.
pause
