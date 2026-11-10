/**
 * Echte Kundenstimmen mit Einwilligung. Keine erfundenen Namen,
 * keine Sterne, keine erfundenen Bewertungszahlen.
 * Ein optionales Foto kann später ergänzt werden, sobald es vorliegt.
 */
import type { Locale, L10n } from './packages';

export interface Testimonial {
  id: string;
  name: string;
  /** Initialen für den Avatar, solange kein Foto vorliegt */
  initials: string;
  /** optionales echtes Foto unter /public, wenn die Person eines liefert */
  photo?: string;
  quote: L10n;
  /** Sprache des Originals, falls die andere Fassung eine Übersetzung ist */
  originalLocale: Locale;
  verified: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 'nadia-bosco',
    name: 'Nadia Bosco',
    initials: 'NB',
    quote: {
      de: 'Die Vorlagen sind professionell, leicht anzupassen und haben mir sehr viel Zeit gespart. Klare Empfehlung!',
      it: 'I modelli sono professionali, facili da personalizzare e mi hanno fatto risparmiare moltissimo tempo. Consigliatissimo!',
    },
    originalLocale: 'de',
    verified: true,
  },
];
