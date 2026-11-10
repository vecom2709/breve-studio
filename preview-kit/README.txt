Studio Breve – lokale Vorschau
==============================

Das ist eine lokale Kopie der Website zum Durchklicken im Browser.
Sie ist nicht veröffentlicht, und es wird nichts verkauft.

Start
-----
1. Diesen Ordner entpacken, falls er noch in einer ZIP-Datei liegt.
2. Node.js oder Python 3 muss installiert sein.
3. Windows: start-preview.bat doppelklicken.
   macOS: start-preview.command doppelklicken (beim ersten Mal evtl. Rechtsklick → Öffnen).
   Linux/macOS/Windows im Terminal: „node start-preview.mjs“
   oder „python3 start-preview.py“ im entpackten Ordner ausführen.
4. Der Browser öffnet automatisch http://127.0.0.1:4173/
   Das ist die Sprachwahl.
   Deutsch:     http://127.0.0.1:4173/de/
   Italienisch: http://127.0.0.1:4173/it/

   Verwaltung:  http://127.0.0.1:4173/verwaltung/
   Beim ersten Aufruf legen Sie dort ein eigenes Passwort fest.


Beenden: im Terminalfenster Strg+C, danach das Fenster schließen.

Hinweise
--------
- Die Seite läuft nur auf diesem Rechner (127.0.0.1), nicht im Internet.
- Das Kontaktformular speichert Anfragen nur lokal in inquiries.json.
  Es geht keine E-Mail raus.
- Einmalige Besuche werden lokal in data/analytics/ gezählt (ohne volle IP,
  ohne Tracking-Cookies). Der Zähler im Fußbereich beginnt bei 0.
- Der Verwaltungsbereich /verwaltung/ ist passwortgeschützt und nicht
  in der Navigation. Beim ersten Aufruf legen Sie ein Passwort fest
  (mindestens 10 Zeichen). Es wird lokal als Hash in data/admin.json
  gespeichert. Zum Zurücksetzen diese Datei löschen; die Besuchszahlen
  in data/analytics/ bleiben. Optional: Umgebungsvariable ADMIN_PASSWORD
  als Übersteuerung oder Anfangskennwort.
- Die rechtlichen Seiten sind Entwürfe mit Platzhaltern.
- Alte deutsche Adressen ohne /de/ (zum Beispiel /pakete/) werden
  automatisch auf die neuen Pfade umgeleitet.
