/** Pakete, für die es eine klickbare Vorschau gibt (src/components/vorschau/Vorschau.astro). */
export const vorschauSlugs = new Set([
  'gareinbreve', 'immotesto', 'replicapro', 'betriebsautopilot', 'vermieterkiste', 'sitotranquillo', 'sitocura', 'bandiinbreve', 'ospiteinregola', 'ospiteguida',
  'menuvivo', 'mappaviva', 'agendabreve', 'socialsettimana', 'eventolampo',
]);

/** Kartenbild in der passenden Sprache (die Vorschau-Bilder gibt es auf Deutsch und Italienisch). */
export const bildFuer = (p: { slug: string; image?: string }, lang: 'de' | 'it') =>
  p.image && vorschauSlugs.has(p.slug) ? p.image.replace(/-hero(-it)?\.jpg$/, lang === 'it' ? '-vorschau-it.jpg' : '-vorschau.jpg') : p.image;
