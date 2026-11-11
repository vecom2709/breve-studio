// Nimmt neue Pakete aus einer JSON-Datei auf, prüft sie streng und hängt sie an src/content/pakete-auto.json an.
// Aufruf: node tools/pakete-auto/hinzufuegen.mjs <neue.json>
// Bricht mit Fehlermeldung ab, wenn auch nur ein Paket die Regeln verletzt – dann wird nichts geschrieben.
import { readFileSync, writeFileSync } from 'node:fs';

const ZIEL = 'src/content/pakete-auto.json';
const neu = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const bestand = JSON.parse(readFileSync(ZIEL, 'utf8'));
const quelle = readFileSync('src/content/packages.ts', 'utf8') + readFileSync('src/content/packages-neu.ts', 'utf8');

const vorhandeneSlugs = new Set([...quelle.matchAll(/slug: '([a-z]+)'/g)].map((m) => m[1]).concat(bestand.map((p) => p.slug)));
const vorhandeneMarken = new Set([...quelle.matchAll(/brand: '([^']+)'/g)].map((m) => m[1].toLowerCase()).concat(bestand.map((p) => p.brand.toLowerCase())));
let nummer = Math.max(...[...quelle.matchAll(/number: (\d+),/g)].map((m) => +m[1]), ...bestand.map((p) => p.number), 0);

const KATEGORIEN = ['ausschreibungen-foerderung', 'immobilien-gastgewerbe', 'website-sichtbarkeit', 'wissen-vorlagen'];
const SHOP = ['web-business', 'design-media', 'marketing', 'ki-tools'];
const VERBOTEN = /garantiert|garantito|100\s?%|nr\.\s?1|numero uno|der beste|die beste|das beste|il migliore|la migliore|sofort mehr|più clienti garantiti|kostenlos für immer/i;
const fehler = [];
const l10n = (o, feld, p, max) => {
  for (const s of ['de', 'it']) {
    const v = o?.[s];
    if (typeof v !== 'string' || v.trim().length < 3) fehler.push(`${p}: ${feld}.${s} fehlt`);
    else {
      if (max && v.length > max) fehler.push(`${p}: ${feld}.${s} zu lang (${v.length} > ${max})`);
      if (VERBOTEN.test(v)) fehler.push(`${p}: ${feld}.${s} enthält ein unzulässiges Werbeversprechen`);
    }
  }
};
const liste = (o, feld, p, min, max) => {
  for (const s of ['de', 'it']) {
    const v = o?.[s];
    if (!Array.isArray(v) || v.length < min || v.length > max) fehler.push(`${p}: ${feld}.${s} braucht ${min}–${max} Einträge`);
    else v.forEach((x, i) => (typeof x === 'string' ? VERBOTEN.test(x) && fehler.push(`${p}: ${feld}.${s}[${i}] Werbeversprechen`) : null));
  }
};

const geprueft = [];
for (const p of neu) {
  const n = p.brand ?? '(ohne Namen)';
  if (!/^[a-z]{4,24}$/.test(p.slug ?? '')) fehler.push(`${n}: slug nur Kleinbuchstaben a–z, 4–24 Zeichen`);
  if (vorhandeneSlugs.has(p.slug)) fehler.push(`${n}: slug „${p.slug}“ gibt es schon`);
  if (vorhandeneMarken.has(String(p.brand).toLowerCase())) fehler.push(`${n}: Name gibt es schon`);
  if (!KATEGORIEN.includes(p.category)) fehler.push(`${n}: category ungültig`);
  if (!SHOP.includes(p.shopCategory)) fehler.push(`${n}: shopCategory ungültig`);
  if (!['product', 'service'].includes(p.kind)) fehler.push(`${n}: kind ungültig`);
  if (!Array.isArray(p.prices) || !p.prices.length || p.prices.some((x) => !(x.amount >= 0) || !['month', 'once'].includes(x.interval))) fehler.push(`${n}: prices ungültig`);
  l10n(p.produktart, 'produktart', n, 40); l10n(p.tagline, 'tagline', n, 60); l10n(p.benefit, 'benefit', n, 220); l10n(p.headline, 'headline', n, 110);
  for (const f of ['intro', 'audience', 'job', 'why', 'plannedOffer', 'market']) l10n(p[f], f, n, 420);
  liste(p.features, 'features', n, 3, 5); liste(p.ablauf, 'ablauf', n, 3, 3);
  for (const s of ['de', 'it']) if (!Array.isArray(p.faq?.[s]) || p.faq[s].length < 2 || p.faq[s].some((x) => !x.q || !x.a)) fehler.push(`${n}: faq.${s} braucht ≥ 2 Fragen mit Antwort`);
  const v = p.vorschau;
  if (!v || !['fenster', 'handy'].includes(v.art)) fehler.push(`${n}: vorschau.art fenster|handy fehlt`);
  else {
    l10n(v.titel, 'vorschau.titel', n, 70);
    if (!Array.isArray(v.zeilen) || v.zeilen.length < 3 || v.zeilen.length > 5) fehler.push(`${n}: vorschau.zeilen braucht 3–5 Zeilen`);
    else v.zeilen.forEach((z, i) => { l10n(z.text, `vorschau.zeilen[${i}].text`, n, 60); if (z.ton && !['gruen', 'gold', 'grau', 'rot'].includes(z.ton)) fehler.push(`${n}: ton ungültig`); });
    if (v.seite) { l10n(v.seite.titel, 'vorschau.seite.titel', n, 40); if (!Array.isArray(v.seite.punkte) || v.seite.punkte.length > 4) fehler.push(`${n}: vorschau.seite.punkte 1–4`); }
  }
  vorhandeneSlugs.add(p.slug); vorhandeneMarken.add(String(p.brand).toLowerCase());
  geprueft.push({
    ...p,
    number: ++nummer,
    status: 'soon',          // ehrlich: Paketidee in Planung, Benachrichtigung zum Start
    cta: 'notify',
    prices: p.prices.map((x) => ({ ...x, vat: 'tbd' })),
    notes: { de: 'Paket in Planung. Umfang und Preis können sich bis zum Start noch ändern.', it: 'Pacchetto in fase di progettazione. Contenuti e prezzo possono ancora cambiare prima del lancio.' },
    erstellt: new Date().toISOString(),
  });
}
if (fehler.length) {
  console.error('ABGELEHNT – nichts geschrieben:\n- ' + fehler.join('\n- '));
  process.exit(1);
}
writeFileSync(ZIEL, JSON.stringify([...bestand, ...geprueft], null, 1) + '\n');
console.log(`Aufgenommen: ${geprueft.length} Pakete (Nr. ${geprueft[0]?.number}–${nummer})`);
for (const p of geprueft) console.log(`- ${p.number} ${p.brand} (${p.category}) – ${p.tagline.de}`);
