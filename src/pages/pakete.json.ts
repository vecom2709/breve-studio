// Öffentlicher Katalog als JSON (nur Angaben, die ohnehin auf der Website stehen) – die Verwaltung liest daraus ihre Produkt-Übersicht.
import type { APIRoute } from 'astro';
import { packagesSorted, categories } from '../content/packages';

export const prerender = true;

const kategorie = Object.fromEntries(categories.map((c) => [c.id, c.label.de]));

export const GET: APIRoute = () => {
  const pakete = packagesSorted().map((p) => {
    const roh = p as unknown as { erstellt?: string; fertigAm?: string };
    const hinweis = p.notes?.de ?? '';
    const setup = /Setup-Datei|Windows-Setup|Setup\.exe/.test(hinweis) ? 'Windows-Setup' : /Keine Installation|persönlichen Link|Web-App/.test(hinweis) ? 'Web-App (Einladungslink)' : '';
    return {
      nr: p.number,
      slug: p.slug,
      name: p.brand,
      kategorie: kategorie[p.category] ?? p.category,
      art: p.kind === 'service' ? 'Dienstleistung' : 'Produkt',
      status: p.status,
      preise: p.prices.map((x) => ({ betrag: x.amount, intervall: x.interval, mwst: x.vat, einheit: x.unit?.de ?? '', bezeichnung: x.label?.de ?? '' })),
      kurz: p.tagline.de,
      lieferung: hinweis,
      setup,
      erstellt: roh.erstellt ?? null,
      fertigAm: roh.fertigAm ?? null,
      seite: `/de/pakete/${p.slug}/`,
    };
  });
  return new Response(JSON.stringify({ stand: new Date().toISOString(), anzahl: pakete.length, pakete }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
