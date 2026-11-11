/** Pakete mit eigener, handgebauter Vorschau (src/components/vorschau/Vorschau.astro). */
export const vorschauSlugs = new Set([
  'gareinbreve', 'immotesto', 'replicapro', 'betriebsautopilot', 'vermieterkiste', 'sitotranquillo', 'sitocura', 'bandiinbreve', 'ospiteinregola', 'ospiteguida',
  'menuvivo', 'mappaviva', 'agendabreve', 'socialsettimana', 'eventolampo',
]);

/** true, wenn das Paket eine Vorschau hat – handgebaut oder aus Daten (automatisch ergänzte Pakete). */
export const hatVorschau = (p: { slug: string; vorschau?: unknown }) => vorschauSlugs.has(p.slug) || !!p.vorschau;

/** Kartenbild in der passenden Sprache: Aufnahme der Vorschau (DE/IT), sonst das hinterlegte Bild. */
export const bildFuer = (p: { slug: string; image?: string; vorschau?: unknown }, lang: 'de' | 'it') => {
  if (!p.image || !hatVorschau(p)) return p.image;
  const basis = p.image.replace(/-(hero|vorschau)(-it)?\.jpg$/, '');
  return `${basis}-vorschau${lang === 'it' ? '-it' : ''}.jpg`;
};
