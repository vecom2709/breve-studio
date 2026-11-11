# Studio Breve – Website (Entwurf)

Zweisprachige Marketing-Website (Deutsch / Italienisch) für **Studio Breve**, ein kleines Digitalstudio in Aragona (AG), Sizilien.

> **Status: Entwurf, nicht veröffentlicht.** Die Seite läuft nur lokal. Nichts ist deployt, keine Domain ist registriert, es wird nichts verkauft und keine E-Mail versendet. Alle Seiten tragen `noindex, nofollow`, `robots.txt` sperrt alles.

## Starten

Voraussetzung: Node.js 22 oder neuer (getestet mit Node 24).

```bash
cd /workspace/studio-breve
npm install          # nur beim ersten Mal
npm run build        # Typprüfung (astro check) + Build nach dist/
npm run preview      # Vorschau auf http://127.0.0.1:4173 (nur localhost)
npm run dev          # Entwicklungsmodus auf http://127.0.0.1:4321
```

Die laufende Vorschau (URL und Prozess-ID) steht in `PREVIEW.txt`. Beenden: `kill <PID>` oder `pkill -f "astro preview"`.

## Technik

- [Astro](https://astro.build) 7 + TypeScript, statisch vorgerendert. Nur der Formular-Endpunkt `/api/inquiry/` und die Danke-Seiten laufen serverseitig (Adapter `@astrojs/node`, standalone).
- Schriften lokal eingebunden über `@fontsource-variable`: **Outfit** (Überschriften), **Fraunces** (Wortmarke) und **Source Sans 3** (Text), alle SIL Open Font License 1.1. Keine Google Fonts, keine CDN.
- Keine Tracking- oder Werbe-Cookies, keine Analyse- oder Werbedienste Dritter, keine externen Skripte, keine bezahlten APIs.
- Installierbare Web-App (PWA): Manifest je Sprache, eigenes SB-Symbol, minimales Service Worker nur für die Seitenhülle (kein Tracking). Anleitung unter `/de/app/` und `/it/app/`. Eine eigene Reichweitenmessung (ohne volle IP, ohne Tracking-Cookies) zählt einmalige Besuche; siehe Datenschutz und Abschnitt „Verwaltung“ unten.

## Sprachen und Seiten

Die Website hat zwei länderbezogene Fassungen, jeweils mit eigenem Präfix und lokalisierten Pfaden:

- `/de/…` – Deutsch (Deutschland, Österreich, Schweiz)
- `/it/…` – Italiano (Italia)

Die Wurzel `/` ist eine kleine Sprachwahl. Ein kurzes Skript darf nur dann automatisch weiterleiten (navigator.language), wenn noch keine Wahl in `localStorage` gespeichert ist. Es setzt keine Cookies und keine Tracker. Die Links bleiben ohne JavaScript sichtbar. Alte deutsche URLs ohne `/de/`-Präfix (z. B. `/pakete/`) leiten auf die neuen Pfade um.

| Deutsch | Italienisch |
|---|---|
| `/` (Sprachwahl) | `/` (scelta della lingua) |
| `/de/` | `/it/` |
| `/de/pakete/` (Katalog mit Kategorie-Filter, `?k=<kategorie>`) | `/it/pacchetti/` |
| `/de/pakete/<slug>/` | `/it/pacchetti/<slug>/` |
| `/de/ueber-uns/` | `/it/chi-siamo/` |
| `/de/kontakt/` (Formular, `?paket=<slug>` wählt ein Paket vor) | `/it/contatti/` |
| `/de/kontakt/danke/?ref=…` (serverseitig) | `/it/contatti/grazie/?ref=…` |
| `/de/impressum/` | `/it/note-legali/` |
| `/de/datenschutz/` | `/it/privacy/` |
| `/de/produkte/` | `/it/prodotti/` |
| `/de/dienstleistungen/` | `/it/servizi/` |
| `/de/warenkorb/` (noch ohne Kauf, nur Erklärung) | `/it/carrello/` |
| `/de/app/` (Installation auf dem Handy) | `/it/app/` |
| `/de/agb/` | `/it/condizioni/` |
| `404` (zweisprachig) | |

## Ein neues Paket hinzufügen

Alle Paketinhalte stehen in **einer Datei**: `src/content/packages.ts`. Katalog, Startseite, Detailseiten in beiden Sprachen, Formularauswahl und Statistik im Kopfbereich werden daraus erzeugt.

1. Optional ein Bild (16:9, z. B. 1024×576) nach `public/images/packages/` legen.
2. Im Array `packages` ein Objekt ergänzen. Pflichtfelder prüft TypeScript beim `npm run build`.
3. `npm run build` – fertig. Die Seiten `/de/pakete/<slug>/` und `/it/pacchetti/<slug>/` entstehen automatisch.

Minimalbeispiel:

```ts
{
  number: 11,
  slug: 'menuchiaro',
  brand: 'MenuChiaro',
  category: 'website-sichtbarkeit',           // oder eine neue Kategorie in `categories`
  status: 'waitlist',                         // waitlist | inquiry | soon | available
  cta: 'interest',                            // interest | inquiry | notify | checkout
  prices: [{ amount: 15, interval: 'month', vat: 'excl' }],
  image: '/images/packages/11-menuchiaro.jpg', // optional
  imageAlt: { de: 'Entwurfsansicht von MenuChiaro', it: 'Bozza di MenuChiaro' },
  tagline: { de: 'Die Speisekarte, immer aktuell.', it: 'Il menu, sempre aggiornato.' },
  benefit: { de: 'Digitale Speisekarte per QR-Code, zweisprachig.', it: 'Menu digitale con QR code, in due lingue.' },
  headline: { de: '…', it: '…' },
  intro: { de: '…', it: '…' },
  audience: { de: '…', it: '…' },
  job: { de: '…', it: '…' },
  why: { de: '…', it: '…' },
  features: { de: ['…', '…'], it: ['…', '…'] },
  plannedOffer: { de: 'Geplant zum Start: …', it: 'Previsto al lancio: …' },
  faq: { de: [{ q: '…', a: '…' }], it: [{ q: '…', a: '…' }] },
  notes: { de: '…', it: '…' },
  market: { de: 'Italien · IT/DE', it: 'Italia · IT/DE' },
  checkout: { provider: 'none' },
},
```

**Status ehrlich halten:** `waitlist` = in Entwicklung (Button „Interesse merken“), `inquiry` = persönliche Leistung (Button „Unverbindlich anfragen“), `soon` = geplant (Button „Zum Start benachrichtigen“), `available` = kaufbar.

**Bündel** stehen im Array `bundles` in derselben Datei (`includes` = Liste von Paket-Slugs, `price` optional, `featured: true` = auf der Startseite).

**Kategorien** stehen im Array `categories`. Eine neue Kategorie erscheint automatisch als Filter, sobald ihr ein Paket zugeordnet ist.

Marken- und Betreiberangaben (Name, Adresse, Telefon, Platzhalter-E-Mail, P.IVA, Entwurfshinweis) stehen in `src/content/site.ts`. Oberflächentexte (Buttons, Statusnamen, Formular) in `src/lib/i18n.ts`.

### Späterer Zahlungsanbieter

Es ist **kein** Zahlungsanbieter angebunden. Das Feld `checkout` im Pakettyp ist der Erweiterungspunkt (`provider: 'stripe' | 'paypal' | 'lemonsqueezy' | 'gumroad' | 'invoice'`, `url`, `reference`). Ein Kauf-Button erscheint nur, wenn `status: 'available'`, `cta: 'checkout'` **und** `checkout.provider` ≠ `'none'` mit `url` gesetzt sind (Funktion `isPurchasable`). Sonst wird automatisch das Anfrageformular gezeigt. Vor dem Umschalten: Produkt fertig, P.IVA, AGB/Widerruf, Datenschutz und Steuerausweis klären.

## Anfragen (Formular)

- Formular auf `/de/kontakt/`, `/it/contatti/` und auf jeder Paketseite. Felder: Name, E-Mail, bevorzugte Sprache, Paket (optional), Nachricht, Pflicht-Einwilligung, optionale Werbe-Einwilligung.
- Absenden schreibt **nur lokal** in `data/inquiries.json` (JSON-Array, atomar geschrieben). Pfad änderbar über die Umgebungsvariable `INQUIRIES_FILE`.
- Es wird **keine E-Mail** versendet und nichts an Dritte übertragen. IP-Adressen werden nicht gespeichert.
- Funktioniert mit und ohne JavaScript. Die Danke-Seite liest den gespeicherten Eintrag über die Vorgangsnummer (`SB-JJJJMMTT-XXXXXX`) aus der Datei – sie zeigt nur Erfolg, wenn wirklich gespeichert wurde.
- Schutz: Same-Origin-Prüfung von Astro, Honeypot-Feld, Längenbegrenzungen, serverseitige Validierung.
- `data/inquiries.json`, `data/admin.json` und `data/analytics/` sind in `.gitignore`.


## Reichweitenmessung und Verwaltung

- Ein kleines Erste-Partei-Skript (`src/components/Tracker.astro`) sendet Seitenaufrufe an `POST /api/track/`. Der öffentliche Zähler (`GET /api/track/`) zeigt die Summe einmaliger Besuche seit Start und beginnt bei 0.
- Einmalig heißt: derselbe Sitzungskennzeichner in `sessionStorage` zählt pro Kalendertag (Europe/Rome) höchstens einmal. Do Not Track und Global Privacy Control werden beachtet; dann wird nichts gespeichert.
- Die volle IP-Adresse wird nie gespeichert. Aufzeichnungen liegen als JSONL unter `data/analytics/` (gitignored). Einzelbesuche werden nach 12 Monaten gelöscht; die Tagessummen für den öffentlichen Zähler bleiben.
- Der Verwaltungsbereich liegt unter **`/verwaltung/`** (nur Deutsch, `noindex, nofollow`, nicht in Navigation, Sprachwahl oder hreflang).
- **Erstes Passwort:** Solange `data/admin.json` fehlt und `ADMIN_PASSWORD` nicht gesetzt ist, zeigt `/verwaltung/` das Formular „Passwort festlegen“ (Passwort und Wiederholung, mindestens 10 Zeichen). Beim Speichern wird ein scrypt-Hash mit Salt in `data/admin.json` geschrieben (nur lokal, gitignored) und Sie sind angemeldet.
- **Anmeldung:** `POST /api/verwaltung/login/`. Vergleich gegen den gespeicherten Hash (und zusätzlich gegen **`ADMIN_PASSWORD`**, falls gesetzt — als Übersteuerung oder Anfangskennwort). Die Sitzung ist ein HttpOnly-Cookie mit SameSite=Strict (ohne `Secure` auf reinem HTTP, z. B. localhost). Anmeldeversuche sind je gekürzter Adresse auf 10 in 15 Minuten begrenzt. Falsche Eingaben zeigen „Passwort falsch“ und die restlichen Versuche.
- Im Dashboard: **Passwort ändern** (`/verwaltung/passwort/`, aktuell + neu + Wiederholung) und **Abmelden**.
- **Zurücksetzen:** `data/admin.json` löschen und beim nächsten Aufruf ein neues Passwort festlegen. Die Besuchszahlen in `data/analytics/` bleiben erhalten.
- Der Betreiber kann im Dashboard eigene Aufrufe von der Zählung ausnehmen, nach Datum filtern und eine CSV-Datei exportieren.

## Logo und Bilder

Das Zeichen ist ein eigenes SB-Monogramm (Goldverlauf, typografisches Breve über S und B), Dateien `public/mark-studio-breve.svg`, `public/logo-studio-breve.svg`, Favicons. Es gehört nicht zu einer anderen Marke und verwendet kein fremdes Firmenzeichen.

Das helle Hero-Foto liegt unter `public/images/home/hero-light.webp` (und `.jpg`). Die Paketbilder unter `public/images/packages/` sind Entwurfsvisualisierungen.

Kundenstimmen stehen in `src/content/testimonials.ts` und werden nur mit Einwilligung der genannten Person veröffentlicht. Solange kein Foto vorliegt, erscheint ein Avatar mit Initialen.

## Startseite (Stand 11.11.2026)

- Kopfzeile dunkel (Petrol) mit dem Logo `public/logo-studio-breve-gold*.{webp,png}` (freigestellt aus der Vorlage), Navigation mit Symbolen, DE/IT-Umschalter, Warenkorb.
- Hero: Szene `public/images/home/hero-<sprache>-<breite>.{avif,webp,jpg}` mit dem Original-Vecom-V auf der Tasse und der echten Startseite auf dem Laptop. Zahlen im Panel „Stand heute“ kommen live aus `catalogStats()`.
- Texte der Startseite: `src/content/home.ts`. Symbole: `src/components/Icon.astro` (Pfade nach Lucide, ISC-Lizenz).
- Bildstrecke neu erzeugen: `python3 tools/bilder/aufnahme.py http://127.0.0.1:4173 <ordner>` (Seitenaufnahmen) und danach `python3 tools/bilder/startseite_bilder.py <quellen> public/images/home <ordner>/screen-de.png <ordner>/screen-it.png`. Quellen: KI-Szene (Kie.ai, nano-banana-pro), `v-emblem.png` von vecom-design.it, Kartenbilder.
- Das 3D-Handy im Abschnitt „App-Version“ wird in Blender (Cycles) auf dem eigenen Rechner gerendert: `tools/bilder/handy.py`.

## Neue Pakete 11–15 (Stand 11.11.2026)

- Daten: `src/content/packages-neu.ts` (MenuVivo, MappaViva, AgendaBreve, SocialSettimana, EventoLampo), eingehängt in `packages.ts`.
- Klickbare Vorschau je Paket mit erfundenen Beispieldaten: `src/components/vorschau/Vorschau.astro` (Liste in `liste.ts`), erscheint auf der Paketseite unter „So sieht es aus“.
- Kartenbilder sind Aufnahmen dieser Vorschauen (DE und IT): `python3 tools/bilder/vorschau_bilder.py http://127.0.0.1:4173`.

## Automatisch ergänzte Pakete (ab Nr. 16)

- Ein geplanter Lauf ergänzt stündlich 10 neue Pakete. Anleitung und Regeln: `tools/pakete-auto/ANLEITUNG.md`.
- Daten: `src/content/pakete-auto.json` (wird in `packages.ts` eingelesen). Neue Pakete starten mit Status „Demnächst“ und Benachrichtigung zum Start.
- Aufnehmen: `node tools/pakete-auto/hinzufuegen.mjs <neue.json>` prüft Pflichtfelder, Längen, Werbeversprechen und Doppelungen; bei einem Fehler wird nichts geschrieben.
- Vorschau: Pakete mit `vorschau`-Daten nutzen die allgemeine Vorlage in `Vorschau.astro` (Browserfenster oder Handy).
- Veröffentlichen: `bash tools/pakete-auto/veroeffentlichen.sh "<Commit-Text>"` (Build, fehlende Vorschaubilder, Push, Online-Vorschau).
- Katalog: nach Kategorie, Status und Nummer sortiert; pro Kategorie sind die ersten 6 sichtbar, der Rest aufklappbar. Die Startseite zeigt „Neu im Katalog“ (die 12 neuesten).
- Ein Paket entfernen: Eintrag aus `pakete-auto.json` löschen und die beiden Bilder `NN-slug-vorschau(-it).jpg` entfernen.

## Online-Vorschau (GitHub Pages)

- Adresse: https://vecom2709.github.io/breve-studio/ (Zweig `gh-pages`, nur die fertigen Seiten; `noindex` bleibt).
- Bauen: `PUBLIC_STATISCH=1 npm run build:fast && node tools/pages-bauen.mjs` → `dist-pages/`. Im statischen Modus sind Besuchszähler und Formularversand abgeschaltet (kein Server); das Formular zeigt dann einen Hinweis.
- `tools/pages-bauen.mjs` schreibt die Wurzelpfade auf `/breve-studio/` um und legt `.nojekyll` an.

## Domain

Platzhalter im Text: **studiobreve.it** (nicht registriert). Laut DNS-Abfrage über Google Public DNS am 9.11.2026 hatten folgende Namen keinen Eintrag – das ist **nur ein Hinweis**, kein Nachweis, dass sie frei sind: studiobreve.it, studiobreve.de, studiobreve.eu, studio-breve.it, inbreve.de, in-breve.it. Vergeben (DNS vorhanden): inbreve.it, inbreve.com, inbreve.eu, breve.it, breve.de, studiobreve.com. Eine Markenrecherche (UIBM, DPMA, EUIPO) steht aus.

## Vor dem Start (nicht erledigt)

- Domain registrieren, Hosting wählen, Postfach `info@…` einrichten.
- P.IVA, Codice fiscale, Rechtsform, PEC eintragen (`src/content/site.ts`, Impressum).
- Rechtstexte (Impressum, Datenschutz, AGB) vervollständigen und prüfen lassen; Hosting-Logs in der Datenschutzerklärung ergänzen.
- Vor Veröffentlichung `noindex` entfernen (`src/layouts/Base.astro`) und `public/robots.txt` anpassen.
- Formular-Speicherung für den Betrieb ersetzen (z. B. selbst gehostete Datenbank oder Mailversand mit Auftragsverarbeitung), Double-Opt-in für Werbe-Einwilligungen einführen.

## Bilder

`public/images/packages/*.jpg` sind Entwurfsvisualisierungen aus der Planungsphase (keine fertigen Produkte, keine Kundenprojekte) und werden auf der Seite so gekennzeichnet. `public/og-studio-breve.jpg` ist das Vorschaubild für Link-Vorschauen (erzeugt aus `tools/og.html`).
