# Neue Pakete automatisch ergänzen (stündlicher Lauf)

Ziel: Bei jedem Lauf **genau 10 neue, sinnvolle Pakete** für Studio Breve entwerfen, prüfen, mit Vorschau einbinden und veröffentlichen.

## Ablauf
1. Bestand lesen: `src/content/packages.ts`, `src/content/packages-neu.ts`, `src/content/pakete-auto.json` (Namen, Slugs, Kategorien). Keine Doppelungen, auch keine fast gleichen Ideen.
2. 10 Pakete als JSON-Liste in eine Datei schreiben (z. B. `/tmp/neu.json`) – Aufbau wie unten.
3. `node tools/pakete-auto/hinzufuegen.mjs /tmp/neu.json` – prüft streng (Pflichtfelder DE/IT, Längen, keine Werbeversprechen, eindeutige Namen). Bei „ABGELEHNT“ korrigieren und erneut aufrufen.
4. `bash tools/pakete-auto/veroeffentlichen.sh "Neue Pakete Nr. X–Y: Name1, Name2, …"` – baut, erzeugt fehlende Vorschaubilder, sichert den Quelltext und veröffentlicht online.
5. Ergebnis melden: die 10 Pakete mit Nummer, Name, Kategorie, Preis und Link `https://vecom2709.github.io/breve-studio/de/pakete/<slug>/`.

## Inhaltliche Regeln
- Kleine, klar umrissene digitale Pakete (Produkt oder Dienstleistung) für kleine Betriebe in **Italien (v. a. Sizilien) und im deutschsprachigen Raum**: Handel, Handwerk, Gastronomie, Gastgewerbe, Immobilien, Praxen, Vereine, Freiberufler.
- Ausgewogen über die vier Kategorien verteilen: `ausschreibungen-foerderung`, `immobilien-gastgewerbe`, `website-sichtbarkeit`, `wissen-vorlagen`. Shop-Kategorie passend: `web-business`, `design-media`, `marketing`, `ki-tools`.
- Markennamen im Stil des Katalogs: italienisch, kurz, zusammengeschrieben (z. B. „PreventivoLampo“), nur Buchstaben; slug = Name in Kleinbuchstaben.
- Deutsch in der Sie-Form, Italienisch natürlich (du-Form wie im Bestand). Ehrlich und konkret: keine Ergebnisversprechen, keine Superlative, keine erfundenen Kundenstimmen oder Zahlen.
- Keine Rechts-, Steuer-, Medizin- oder Anlageberatung – höchstens organisatorische Werkzeuge mit dem Hinweis, dass keine Beratung ersetzt wird.
- Fremde Marken nur, wenn nötig, und neutral. Datenschutz mitdenken (DSGVO, Daten in der EU, Löschfristen).
- Realistische Preise (Monatsabo meist 9–149 €, einmalig 19–299 €).
- Status setzt das Skript automatisch auf „in Planung“ mit Benachrichtigung zum Start.

## Aufbau je Paket (alle Texte als { "de": "…", "it": "…" })
```json
{
  "slug": "preventivolampo", "brand": "PreventivoLampo",
  "category": "website-sichtbarkeit", "kind": "product", "shopCategory": "web-business",
  "prices": [{ "amount": 19, "interval": "month", "unit": { "de": "je Betrieb", "it": "per attività" } }],
  "imageAlt": {}, "tagline": {}, "benefit": {}, "headline": {}, "intro": {}, "audience": {}, "job": {}, "why": {},
  "features": { "de": ["…", "…", "…"], "it": ["…", "…", "…"] },
  "plannedOffer": {}, "faq": { "de": [{ "q": "…", "a": "…" }, { "q": "…", "a": "…" }], "it": [ … ] },
  "market": {},
  "ablauf": { "de": ["Schritt 1", "Schritt 2", "Schritt 3"], "it": [ … ] },
  "vorschau": {
    "art": "fenster",                       // oder "handy"
    "adresse": "esempio.it/preventivo",      // erfundene Beispieladresse
    "titel": {},
    "zeilen": [ { "text": {}, "neben": {}, "chip": {}, "ton": "gruen" } ],   // 3–5 Zeilen, ton: gruen|gold|grau|rot
    "seite": { "titel": {}, "punkte": [ {}, {} ] }                         // 1–4 Punkte
  }
}
```
Die Vorschau zeigt erfundene Beispieldaten („Esempio“-Namen), damit Kunden sofort sehen, worum es geht.
