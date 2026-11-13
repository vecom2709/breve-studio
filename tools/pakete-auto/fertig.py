# Markiert ein automatisch ergänztes Paket als „Fertig entwickelt“ und passt die Texte an das an, was wirklich geliefert wird.
# Aufruf: python3 tools/pakete-auto/fertig.py <änderung.json>
# änderung.json: {"slug": "...", "lieferung": {"de": "...", "it": "..."},
#                  "features": {"de": [...], "it": [...]}   (optional, ersetzt die Liste),
#                  "faq": {"de": [{"q": "...", "a": "..."}], "it": [...]}   (optional, wird vorne eingefügt),
#                  "hinweis": {"de": "...", "it": "..."}   (optional, Zusatz zur Statuszeile)}
import json
import sys
from pathlib import Path

DATEI = Path(__file__).resolve().parents[2] / 'src/content/pakete-auto.json'


def main(pfad):
    a = json.loads(Path(pfad).read_text(encoding='utf-8'))
    pakete = json.loads(DATEI.read_text(encoding='utf-8'))
    p = next((x for x in pakete if x['slug'] == a['slug']), None)
    if p is None:
        sys.exit(f'ABGELEHNT: Paket {a["slug"]} nicht gefunden')
    for l in ('de', 'it'):
        if not a.get('lieferung', {}).get(l):
            sys.exit(f'ABGELEHNT: lieferung.{l} fehlt')
    p['status'] = 'available'
    p['cta'] = 'inquiry'
    hinweis = a.get('hinweis', {})
    p['notes'] = {
        'de': ('Fertig entwickelt; gebucht wird ab dem offiziellen Start. ' + a['lieferung']['de'] + (' ' + hinweis['de'] if hinweis.get('de') else '')).strip(),
        'it': ('Pronto; si prenota dall’avvio ufficiale. ' + a['lieferung']['it'] + (' ' + hinweis['it'] if hinweis.get('it') else '')).strip(),
    }
    if a.get('features'):
        for l in ('de', 'it'):
            if not (3 <= len(a['features'][l]) <= 6):
                sys.exit(f'ABGELEHNT: features.{l} braucht 3–6 Punkte')
        p['features'] = a['features']
    if a.get('faq'):
        for l in ('de', 'it'):
            neu = a['faq'][l]
            fragen = {f['q'] for f in neu}
            p['faq'][l] = neu + [f for f in p['faq'][l] if f['q'] not in fragen]
            p['faq'][l] = p['faq'][l][:5]
    DATEI.write_text(json.dumps(pakete, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'FERTIG: {p["brand"]} → Fertig entwickelt')


if __name__ == '__main__':
    main(sys.argv[1])
