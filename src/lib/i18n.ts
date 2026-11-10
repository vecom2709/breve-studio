import type { Locale, Price, PackageStatus, CtaType, L10n } from '../content/packages';

/**
 * Sprachen der Website. Eine weitere Sprache (z. B. Englisch) später so ergänzen:
 * 1. `Locale` in `src/content/packages.ts` erweitern,
 * 2. hier einen Eintrag in `locales`, `localeConfig` und `ui` anlegen,
 * 3. alle `L10n`-Felder in `packages.ts` und `site.ts` ergänzen,
 * 4. Seitenordner unter `src/pages/<code>/` mit lokalisierten Slugs anlegen.
 * Keine Sprache hier erfinden, die noch keine Übersetzung hat.
 */
export const locales = ['de', 'it'] as const satisfies readonly Locale[];
export const defaultLocale: Locale = 'de';

export const langStorageKey = 'studio-breve-lang';
export const chooserPath = '/';
export const chooserQuery = 'wahl=1';
export const chooserHref = `${chooserPath}?${chooserQuery}`;

export const localeConfig: Record<Locale, {
  /** URL-Präfix mit führendem Slash, ohne trailing Slash am Ende des Codes selbst – Home ist prefix + '/' */
  prefix: string;
  htmlLang: string;
  ogLocale: string;
  regions: string;
}> = {
  de: { prefix: '/de', htmlLang: 'de', ogLocale: 'de_DE', regions: 'Deutschland · Österreich · Schweiz' },
  it: { prefix: '/it', htmlLang: 'it', ogLocale: 'it_IT', regions: 'Italia' },
};

export type RouteKey =
  | 'home' | 'packages' | 'package' | 'about' | 'contact' | 'thanks'
  | 'imprint' | 'privacy' | 'terms';

/** Pfade relativ zum Sprachpräfix, jeweils mit führendem und abschließendem Slash. */
const routeStems: Record<RouteKey, L10n> = {
  home: { de: '/', it: '/' },
  packages: { de: '/pakete/', it: '/pacchetti/' },
  package: { de: '/pakete/:slug/', it: '/pacchetti/:slug/' },
  about: { de: '/ueber-uns/', it: '/chi-siamo/' },
  contact: { de: '/kontakt/', it: '/contatti/' },
  thanks: { de: '/kontakt/danke/', it: '/contatti/grazie/' },
  imprint: { de: '/impressum/', it: '/note-legali/' },
  privacy: { de: '/datenschutz/', it: '/privacy/' },
  terms: { de: '/agb/', it: '/condizioni/' },
};

export const path = (key: RouteKey, lang: Locale, slug?: string) =>
  localeConfig[lang].prefix + routeStems[key][lang].replace(':slug', slug ?? '');

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const otherLocales = (lang: Locale): Locale[] =>
  locales.filter((item): item is Locale => item !== lang);

export const other = (lang: Locale): Locale => otherLocales(lang)[0] ?? lang;

/** Texte der zweisprachigen Sprachwahl auf `/`. */
export const chooserCopy = {
  title: 'Sprache wählen / Scegli la lingua',
  description: 'Studio Breve – klare digitale Pakete für Betriebe. Bitte Sprache wählen. / Pacchetti digitali chiari per la tua attività. Scegli la lingua.',
  leadDe: 'Bitte wählen Sie die Fassung für Ihre Region.',
  leadIt: 'Scegli la versione per il tuo Paese.',
  draftDe: 'Entwurf, nicht veröffentlicht. Diese Seite setzt keine Cookies und keine Tracker.',
  draftIt: 'Bozza, non pubblicata. Questo sito non usa cookie né strumenti di tracciamento.',
} as const;

export const ui = {
  de: {
    langName: 'Deutsch',
    langShort: 'DE',
    switchTo: { it: 'Diese Seite auf Italienisch' } as Partial<Record<Locale, string>>,
    chooseLanguage: 'Sprache oder Land wählen',
    skip: 'Zum Inhalt springen',
    nav: { home: 'Start', packages: 'Pakete', about: 'Über uns', contact: 'Kontakt' },
    menu: 'Menü',
    close: 'Schließen',
    legal: { imprint: 'Impressum', privacy: 'Datenschutz', terms: 'AGB' },
    draft: 'Entwurf',
    allPackages: 'Alle Pakete ansehen',
    details: 'Details',
    all: 'Alle',
    filterLabel: 'Nach Kategorie filtern',
    resultCount: (n: number) => `${n} ${n === 1 ? 'Paket' : 'Pakete'}`,
    listPrice: 'Listenpreis',
    priceOnRequest: 'Bündelpreis wird vor dem Start festgelegt',
    free: 'kostenlos',
    perMonth: '/ Monat',
    once: 'einmalig',
    vatExcl: 'zzgl. MwSt.',
    vatIncl: 'Endpreis',
    vatTbd: 'Steuerausweis vor Start zu klären',
    status: {
      waitlist: 'In Entwicklung · Warteliste',
      inquiry: 'Anfrage möglich',
      soon: 'Demnächst',
      available: 'Verfügbar',
    } satisfies Record<PackageStatus, string>,
    statusExplain: {
      waitlist: 'Dieses Produkt wird gerade entwickelt und ist noch nicht nutzbar. Sie können Ihr Interesse unverbindlich vormerken; wir melden uns zum Start.',
      inquiry: 'Diese Leistung erbringen wir persönlich. Sie können schon jetzt unverbindlich anfragen; Verträge werden erst nach dem offiziellen Start geschlossen.',
      soon: 'Dieses Paket ist geplant, aber noch nicht erhältlich. Auf Wunsch benachrichtigen wir Sie einmalig zum Start.',
      available: 'Dieses Paket ist verfügbar.',
    } satisfies Record<PackageStatus, string>,
    cta: {
      interest: 'Interesse merken',
      inquiry: 'Unverbindlich anfragen',
      notify: 'Zum Start benachrichtigen',
      checkout: 'Jetzt buchen',
    } satisfies Record<CtaType, string>,
    package: 'Paket',
    bundle: 'Bündel',
    bundles: 'Bündel',
    bundlesIntro: 'Manche Pakete ergänzen sich. Diese Kombinationen sind vorgeschlagen; Preise nennen wir, sobald sie feststehen.',
    includes: 'Enthält',
    forWhom: 'Für wen',
    task: 'Aufgabe',
    whyUs: 'Was anders ist',
    whatYouGet: 'Was enthalten ist',
    faq: 'Häufige Fragen',
    notes: 'Hinweise',
    market: 'Markt und Sprache',
    category: 'Kategorie',
    planned: 'Geplantes Startangebot',
    conceptImage: 'Entwurfsansicht, kein fertiges Produkt',
    related: 'Weitere Pakete in dieser Kategorie',
    backToCatalog: 'Zurück zu allen Paketen',
    number: 'Nr.',
    form: {
      title: 'Schreiben Sie uns',
      name: 'Name',
      email: 'E-Mail',
      language: 'Bevorzugte Sprache',
      package: 'Paket (optional)',
      packageNone: 'Allgemeine Anfrage',
      message: 'Nachricht',
      messageHint: 'Ein paar Sätze zu Ihrem Betrieb genügen.',
      consent: 'Ich bin einverstanden, dass Studio Breve meine Angaben speichert, um meine Anfrage zu beantworten bzw. mich zum Start des gewählten Pakets zu informieren. Hinweise in der Datenschutzerklärung.',
      marketing: 'Optional: Ich möchte gelegentlich per E-Mail über neue Pakete informiert werden. Jederzeit widerrufbar.',
      required: 'Pflichtfeld',
      submit: 'Absenden',
      submitting: 'Wird gesendet …',
      localNote: 'Vorschau-Modus: Ihre Angaben werden nur lokal auf diesem Rechner gespeichert. Es wird keine E-Mail versendet.',
      errors: {
        name: 'Bitte geben Sie Ihren Namen an.',
        email: 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
        message: 'Bitte schreiben Sie eine kurze Nachricht (mindestens 10 Zeichen).',
        consent: 'Bitte bestätigen Sie die Einwilligung zur Verarbeitung Ihrer Anfrage.',
        generic: 'Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
        summary: 'Bitte prüfen Sie die markierten Felder.',
      },
    },
    thanks: {
      title: 'Danke, Ihre Anfrage ist gespeichert.',
      body: 'Wir haben Ihre Angaben erhalten. Da Studio Breve noch nicht gestartet ist, melden wir uns persönlich, sobald das gewählte Paket bereitsteht oder wir Ihre Frage beantworten können.',
      ref: 'Vorgangsnummer',
      saved: 'Gespeichert am',
      notFound: 'Zu dieser Vorgangsnummer wurde keine Anfrage gefunden.',
      back: 'Zur Startseite',
    },
  },
  it: {
    langName: 'Italiano',
    langShort: 'IT',
    switchTo: { de: 'Questa pagina in tedesco' } as Partial<Record<Locale, string>>,
    chooseLanguage: 'Scegli lingua o Paese',
    skip: 'Vai al contenuto',
    nav: { home: 'Home', packages: 'Pacchetti', about: 'Chi siamo', contact: 'Contatti' },
    menu: 'Menu',
    close: 'Chiudi',
    legal: { imprint: 'Note legali', privacy: 'Privacy', terms: 'Condizioni' },
    draft: 'Bozza',
    allPackages: 'Vedi tutti i pacchetti',
    details: 'Dettagli',
    all: 'Tutti',
    filterLabel: 'Filtra per categoria',
    resultCount: (n: number) => `${n} ${n === 1 ? 'pacchetto' : 'pacchetti'}`,
    listPrice: 'Prezzo di listino',
    priceOnRequest: 'Il prezzo del pacchetto sarà definito prima del lancio',
    free: 'gratuito',
    perMonth: '/ mese',
    once: 'una tantum',
    vatExcl: '+ IVA',
    vatIncl: 'prezzo finale',
    vatTbd: 'trattamento IVA da definire prima del lancio',
    status: {
      waitlist: 'In sviluppo · lista d’attesa',
      inquiry: 'Su richiesta',
      soon: 'Prossimamente',
      available: 'Disponibile',
    } satisfies Record<PackageStatus, string>,
    statusExplain: {
      waitlist: 'Questo prodotto è in fase di sviluppo e non è ancora utilizzabile. Puoi segnalare il tuo interesse senza impegno; ti scriveremo al lancio.',
      inquiry: 'Questo servizio lo seguiamo di persona. Puoi già chiedere informazioni senza impegno; i contratti saranno conclusi solo dopo l’avvio ufficiale.',
      soon: 'Questo pacchetto è previsto ma non ancora disponibile. Se vuoi, ti avvisiamo una sola volta al lancio.',
      available: 'Questo pacchetto è disponibile.',
    } satisfies Record<PackageStatus, string>,
    cta: {
      interest: 'Segnala interesse',
      inquiry: 'Richiedi informazioni',
      notify: 'Avvisami al lancio',
      checkout: 'Acquista ora',
    } satisfies Record<CtaType, string>,
    package: 'Pacchetto',
    bundle: 'Combinazione',
    bundles: 'Combinazioni',
    bundlesIntro: 'Alcuni pacchetti si completano a vicenda. Queste combinazioni sono proposte; i prezzi saranno indicati appena definiti.',
    includes: 'Comprende',
    forWhom: 'Per chi',
    task: 'Obiettivo',
    whyUs: 'Cosa cambia',
    whatYouGet: 'Cosa è incluso',
    faq: 'Domande frequenti',
    notes: 'Note',
    market: 'Mercato e lingua',
    category: 'Categoria',
    planned: 'Offerta prevista al lancio',
    conceptImage: 'Bozza grafica, non un prodotto finito',
    related: 'Altri pacchetti di questa categoria',
    backToCatalog: 'Torna a tutti i pacchetti',
    number: 'N.',
    form: {
      title: 'Scrivici',
      name: 'Nome',
      email: 'Email',
      language: 'Lingua preferita',
      package: 'Pacchetto (facoltativo)',
      packageNone: 'Richiesta generale',
      message: 'Messaggio',
      messageHint: 'Bastano poche righe sulla tua attività.',
      consent: 'Acconsento che Studio Breve conservi i miei dati per rispondere alla mia richiesta o per informarmi al lancio del pacchetto scelto. Dettagli nell’informativa privacy.',
      marketing: 'Facoltativo: desidero ricevere occasionalmente via email notizie su nuovi pacchetti. Revocabile in qualsiasi momento.',
      required: 'Campo obbligatorio',
      submit: 'Invia',
      submitting: 'Invio in corso …',
      localNote: 'Modalità anteprima: i dati vengono salvati solo localmente su questo computer. Non viene inviata alcuna email.',
      errors: {
        name: 'Indica il tuo nome.',
        email: 'Indica un indirizzo email valido.',
        message: 'Scrivi un breve messaggio (almeno 10 caratteri).',
        consent: 'Conferma il consenso al trattamento della richiesta.',
        generic: 'Non è stato possibile salvare la richiesta. Riprova.',
        summary: 'Controlla i campi evidenziati.',
      },
    },
    thanks: {
      title: 'Grazie, la tua richiesta è stata salvata.',
      body: 'Abbiamo ricevuto i tuoi dati. Studio Breve non è ancora operativo: ti contatteremo di persona quando il pacchetto scelto sarà pronto o quando potremo rispondere alla tua domanda.',
      ref: 'Numero di riferimento',
      saved: 'Salvata il',
      notFound: 'Nessuna richiesta trovata con questo numero di riferimento.',
      back: 'Torna alla home',
    },
  },
} as const;

export type UI = (typeof ui)['de'];

export const switchToLabel = (from: Locale, to: Locale): string =>
  ui[from].switchTo[to] ?? ui[to].langName;

/* ---------- Preise formatieren ---------- */

const eur = (n: number, lang: Locale) =>
  new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'it-IT', { maximumFractionDigits: 0 }).format(n) + ' €';

export function formatPrice(p: Price, lang: Locale) {
  const t = ui[lang];
  const main = p.amount === 0 ? t.free : eur(p.amount, lang);
  const parts: string[] = [];
  if (p.amount > 0) {
    if (p.interval === 'month') parts.push(t.perMonth);
    else parts.push(t.once);
  }
  const unit = p.unit?.[lang];
  const vat = p.amount === 0 ? '' : p.vat === 'excl' ? t.vatExcl : p.vat === 'incl' ? t.vatIncl : t.vatTbd;
  return { main, period: parts.join(' '), unit, vat, label: p.label?.[lang] };
}
