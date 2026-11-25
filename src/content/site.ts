/**
 * Marken- und Betreiberangaben für Studio Breve.
 * Studio Breve ist ein Angebot von Vecom Design (Einzelunternehmen von Uwe Vetter);
 * Steuer- und Kontaktdaten wie in den Rechtsangaben von vecom-design.it.
 */
import type { L10n } from './packages';

export const site = {
  name: 'Studio Breve',
  /** Adresse laut Uwe Vetter (11.11.2026). */
  host: 'www.studio-breve.it',
  url: 'https://www.studio-breve.it',
  tagline: {
    de: 'Klare digitale Pakete für Betriebe – ohne Ballast.',
    it: 'Pacchetti digitali chiari per la tua attività.',
  } satisfies L10n,
  description: {
    de: 'Studio Breve ist ein kleines Digitalstudio in Aragona (Sizilien). Wir entwickeln klar umrissene digitale Pakete für Betriebe in Italien und im deutschsprachigen Raum.',
    it: 'Studio Breve è un piccolo studio digitale ad Aragona (Sicilia). Sviluppiamo pacchetti digitali chiari e ben definiti per attività in Italia e nei Paesi di lingua tedesca.',
  } satisfies L10n,
  operator: {
    name: 'Uwe Vetter',
    street: "Via D'Ascoli 25",
    postalCode: '92021',
    city: 'Aragona',
    province: 'AG',
    country: { de: 'Italien', it: 'Italia' } satisfies L10n,
    phone: '+39 380 190 7017',
    phoneHref: 'tel:+393801907017',
    email: 'info@studio-breve.it',
    /** Unternehmen, über das Studio Breve läuft */
    business: 'Vecom Design',
    legalForm: { de: 'Einzelunternehmen (ditta individuale)', it: 'Ditta individuale' } satisfies L10n,
    vatId: '03187630847',
    pec: 'vecom-design@pec.it',
  },
  draftNote: {
    de: 'Über diese Seite wird derzeit nichts verkauft.',
    it: 'Al momento tramite questo sito non si vende nulla.',
  } satisfies L10n,
  /** Stand der Rechtstexte */
  legalUpdated: '25.11.2026',
} as const;
