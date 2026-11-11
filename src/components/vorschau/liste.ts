/** Pakete, für die es eine klickbare Vorschau gibt (src/components/vorschau/Vorschau.astro). */
export const vorschauSlugs = new Set(['menuvivo', 'mappaviva', 'agendabreve', 'socialsettimana', 'eventolampo']);

/** Kartenbild in der passenden Sprache (die Vorschau-Bilder gibt es auf Deutsch und Italienisch). */
export const bildFuer = (p: { slug: string; image?: string }, lang: 'de' | 'it') =>
  p.image && lang === 'it' && vorschauSlugs.has(p.slug) ? p.image.replace('-hero.jpg', '-hero-it.jpg') : p.image;
