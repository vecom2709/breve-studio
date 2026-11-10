/**
 * Marken- und Betreiberangaben für Studio Breve.
 * Alles hier ist ENTWURF: Die Seite ist nicht veröffentlicht, die Domain ist nicht registriert.
 */
import type { L10n } from './packages';

export const site = {
  name: 'Studio Breve',
  /** Platzhalter-Host. Kein Nachweis, dass die Domain frei ist; nicht registriert. */
  host: 'studiobreve.it',
  url: 'https://studiobreve.it',
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
    /** Platzhalter, Postfach existiert noch nicht. */
    email: 'info@studiobreve.it',
    vatId: { de: '[wird ergänzt]', it: '[da inserire]' } satisfies L10n,
  },
  draftNote: {
    de: 'Entwurf, nicht veröffentlicht. Die Domain studiobreve.it ist noch nicht registriert; die E-Mail-Adresse ist ein Platzhalter. Über diese Seite wird derzeit nichts verkauft.',
    it: 'Bozza, non pubblicata. Il dominio studiobreve.it non è ancora registrato; l’indirizzo email è provvisorio. Al momento tramite questo sito non si vende nulla.',
  } satisfies L10n,
  /** Stand der Rechtstexte */
  legalUpdated: '9.11.2026',
} as const;
