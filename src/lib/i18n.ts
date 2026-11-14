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
  | 'home' | 'packages' | 'package' | 'products' | 'services' | 'about'
  | 'contact' | 'thanks' | 'cart' | 'app' | 'imprint' | 'privacy' | 'terms';

/** Pfade relativ zum Sprachpräfix, jeweils mit führendem und abschließendem Slash. */
const routeStems: Record<RouteKey, L10n> = {
  home: { de: '/', it: '/' },
  packages: { de: '/pakete/', it: '/pacchetti/' },
  package: { de: '/pakete/:slug/', it: '/pacchetti/:slug/' },
  products: { de: '/produkte/', it: '/prodotti/' },
  services: { de: '/dienstleistungen/', it: '/servizi/' },
  about: { de: '/ueber-uns/', it: '/chi-siamo/' },
  contact: { de: '/kontakt/', it: '/contatti/' },
  thanks: { de: '/kontakt/danke/', it: '/contatti/grazie/' },
  cart: { de: '/warenkorb/', it: '/carrello/' },
  app: { de: '/app/', it: '/app/' },
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
  draftDe: 'Diese Seite setzt keine Tracking-Cookies und keine Tracker von Dritten.',
  draftIt: 'Questo sito non usa cookie di tracciamento né tracker di terzi.',
} as const;

export const ui = {
  de: {
    langName: 'Deutsch',
    langShort: 'DE',
    switchTo: { it: 'Diese Seite auf Italienisch' } as Partial<Record<Locale, string>>,
    chooseLanguage: 'Sprache oder Land wählen',
    skip: 'Zum Inhalt springen',
    taglineSmall: 'Digitalstudio · Aragona, Sizilien',
    cart: 'Warenkorb',
    cartEmptyBadge: 'Warenkorb, leer',
    visitsSince: 'Besuche seit Start',
    visitPhraseOne: '1 Besuch seit Start',
    visitPhraseMany: '{n} Besuche seit Start',
    adminArea: 'Verwaltung',
    installApp: 'Als App aufs Handy',
    appPage: {
      title: 'Studio Breve als App',
      description: 'So legen Sie Studio Breve auf den Home-Bildschirm Ihres Telefons.',
      lead: 'Sie können diese Website wie eine kleine App auf dem Handy nutzen – ohne Shop und ohne Tracking-Cookies. Die Installation läuft über den Browser, nicht über einen App-Store.',
      androidTitle: 'Android',
      androidBody: 'Wenn Ihr Browser die Installation anbietet, erscheint unten die Schaltfläche. Sonst öffnen Sie das Menü des Browsers und wählen „App installieren“ oder „Zum Startbildschirm hinzufügen“.',
      iosTitle: 'iPhone und iPad',
      iosBody: 'Öffnen Sie diese Seite in Safari, tippen Sie auf die Teilen-Taste und wählen Sie „Zum Home-Bildschirm“. Danach erscheint Studio Breve wie eine App auf dem Bildschirm.',
      installButton: 'App jetzt installieren',
      installUnavailable: 'Ihr Browser bietet die automatische Installation gerade nicht an. Bitte nutzen Sie die Schritte oben.',
      installed: 'Studio Breve ist auf diesem Gerät bereits als App verfügbar.',
      qrTitle: 'QR-Code zur Website',
      qrCaption: 'Mit der Kamera zur Startseite scannen.',
      qrNote: 'Der Code führt zur veröffentlichten Adresse (www.studio-breve.it). Solange die Seite dort noch nicht online ist, öffnet er sie nicht. In der lokalen Vorschau nutzen Sie bitte die Adresse in der Adresszeile.',
      back: 'Zur Startseite',
    },
    search: 'Pakete durchsuchen',
    searchPlaceholder: 'Paket oder Stichwort suchen …',
    searchEmpty: 'Kein Paket passt zu dieser Suche.',
    searchClose: 'Suche schließen',
    verifiedCustomer: 'Verifizierte Kundin',
    translatedFromDe: 'Tradotto dal tedesco',
    plannedPrice: 'Geplanter Preis',
    badge: { waitlist: 'Warteliste', inquiry: 'Auf Anfrage', soon: 'Bald', new: 'Neu' },
    reserve: 'Vormerken',
    inquire: 'Anfragen',
    discoverProducts: 'Produkte entdecken',
    seeShowcase: 'Showcase ansehen',
    productsHeading: 'Unsere digitalen Produkte',
    productsLead: 'Klar umrissene Pakete mit Listenpreis und ehrlichem Stand. Verkauft wird ab dem offiziellen Start; bis dahin können Sie sich vormerken oder anfragen.',
    filterAll: 'Alle',
    shopEmpty: 'In dieser Kategorie ist derzeit kein Paket eingetragen.',
    testimonialHeading: 'Kundenstimme',
    ctaBandTitle: 'Unverbindlich vormerken',
    ctaBandBody: 'Studio Breve startet gerade. Schreiben Sie uns, wenn ein Paket Sie interessiert – ohne Verpflichtung.',
    statsCatalog: 'Pakete im Katalog',
    statsLanguages: 'Sprachen',
    statsVisits: 'Besuche seit Start',
    statsSince: 'Online seit',
    statsSinceValue: '2026',
    trustHome: [
      { title: 'DSGVO-konform', text: 'Ohne Tracking-Cookies' },
      { title: 'Klare Festpreise', text: 'Listenpreis, offen ausgewiesen' },
      { title: 'Deutsch & Italienisch', text: 'Zwei Sprachen, ein Studio' },
      { title: 'Persönlicher Kontakt', text: 'Anfrage statt anonymer Checkout' },
    ],
    nav: { home: 'Start', packages: 'Pakete', products: 'Produkte', services: 'Dienstleistungen', about: 'Über uns', contact: 'Kontakt' },
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
      waitlist: 'Warteliste',
      inquiry: 'Anfrage möglich',
      soon: 'Demnächst',
      available: 'Fertig entwickelt',
    } satisfies Record<PackageStatus, string>,
    statusExplain: {
      waitlist: 'Dieses Produkt wird gerade entwickelt und ist noch nicht nutzbar. Sie können Ihr Interesse unverbindlich vormerken; wir melden uns zum Start.',
      inquiry: 'Diese Leistung erbringen wir persönlich. Sie können schon jetzt unverbindlich anfragen; Verträge werden erst nach dem offiziellen Start geschlossen.',
      soon: 'Dieses Paket ist geplant, aber noch nicht erhältlich. Auf Wunsch benachrichtigen wir Sie einmalig zum Start.',
      available: 'Dieses Paket ist fertig entwickelt. Verkauft wird ab dem offiziellen Start von Studio Breve; Sie können schon jetzt unverbindlich anfragen.',
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
    included: 'Im Paket enthalten',
    conceptImage: 'Entwurfsansicht, kein fertiges Produkt',
    related: 'Weitere Pakete in dieser Kategorie',
    backToCatalog: 'Zurück zu allen Paketen',
    number: 'Nr.',
    home: {
      eyebrow: 'Digitalstudio · Aragona, Sizilien',
      lead: 'Studio Breve entwickelt kleine, klar umrissene digitale Pakete für Betriebe in Italien und im deutschsprachigen Raum: von der gepflegten Website bis zum Ausschreibungs-Alarm. Jedes mit festem Preis und ehrlichem Stand.',
      ctaPackages: 'Pakete ansehen',
      ctaContact: 'Kontakt aufnehmen',
      standToday: 'Stand heute',
      statCatalog: 'Pakete im Katalog',
      statServices: 'Dienstleistungen auf Anfrage',
      statWaitlist: 'Produkte mit Warteliste',
      statPlanned: 'Pakete in Planung',
      standNote: '',
      trust: [
        { title: 'Klar & transparent', text: 'Feste Preise, ehrlicher Stand' },
        { title: 'Kleine, wirksame Pakete', text: 'Schnell einsetzbar' },
        { title: 'Für Betriebe in Italien & DE', text: 'Praxisnah und zuverlässig' },
        { title: 'Im kontinuierlichen Ausbau', text: 'Neue Produkte, kurze Wege' },
      ],
      sectionEyebrow: 'Unsere Pakete & Produkte',
      sectionTitle: 'Digitale Lösungen für dein Business',
      sectionLead: 'Kompakte, praxisnahe Pakete und digitale Produkte – klar, verständlich und auf den Punkt.',
    },
    offerCards: {
      website: {
        title: 'Website-Paket',
        text: 'Ihre professionelle Website – modern, übersichtlich und auf den Betrieb abgestimmt. Bei uns: SitoTranquillo und die Betreuung mit SitoCura.',
        cta: 'Zum Paket',
      },
      service: {
        title: 'Dienstleistung',
        text: 'Individuelle digitale Leistungen auf Anfrage – flexibel, zielgerichtet und effizient.',
        cta: 'Details anfragen',
      },
      product: {
        title: 'Digitales Produkt',
        text: 'Nützliche digitale Produkte für Ihren Betrieb – so klar umrissen, dass Sie wissen, was Sie vormerken.',
        cta: 'Produkte entdecken',
      },
      alert: {
        title: 'Ausschreibungs-Alarm',
        text: 'Relevante Ausschreibungen automatisch finden und keine Chance mehr verpassen. Das sind GareInBreve und BandiInBreve.',
        cta: 'Mehr erfahren',
      },
    },
    cartPage: {
      title: 'Warenkorb',
      empty: 'Ihr Warenkorb ist leer.',
      body: 'Über diese Seite kann noch nichts gekauft werden. Pakete lassen sich unverbindlich vormerken oder anfragen, sobald Sie soweit sind.',
      toPackages: 'Zu den Paketen',
      toContact: 'Unverbindlich anfragen',
    },
    catalogKind: {
      productsTitle: 'Produkte',
      productsLead: 'Digitale Produkte von Studio Breve: Werkzeuge und Vorlagen, die Sie später selbst nutzen. Der Stand jedes Eintrags ist ehrlich gekennzeichnet; verkauft wird ab dem offiziellen Start.',
      servicesTitle: 'Dienstleistungen',
      servicesLead: 'Persönliche Leistungen, die wir mit Ihnen abstimmen. Sie können schon jetzt unverbindlich anfragen; Verträge werden erst nach dem offiziellen Start geschlossen.',
    },
    form: {
      title: 'Schreiben Sie uns',
      name: 'Name',
      email: 'E-Mail',
      phone: 'Telefon (optional, für einen Rückruf)',
      city: 'Ort (optional)',
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
      serverNote: 'Ihre Angaben werden auf dem Server von Studio Breve in Deutschland (All-Inkl) gespeichert und nur zur Beantwortung Ihrer Anfrage verwendet. Wir erhalten lediglich einen Hinweis per E-Mail, ohne Ihre Angaben.',
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
    taglineSmall: 'Studio digitale · Aragona, Sicilia',
    cart: 'Carrello',
    cartEmptyBadge: 'Carrello, vuoto',
    visitsSince: 'Visite dall’avvio',
    visitPhraseOne: '1 visita dall’avvio',
    visitPhraseMany: '{n} visite dall’avvio',
    adminArea: 'Area riservata',
    installApp: 'Installa come app',
    appPage: {
      title: 'Studio Breve come app',
      description: 'Come aggiungere Studio Breve alla schermata Home del telefono.',
      lead: 'Puoi usare questo sito come una piccola app sul telefono – senza negozio e senza cookie di tracciamento. L’installazione avviene dal browser, non da un app store.',
      androidTitle: 'Android',
      androidBody: 'Se il browser propone l’installazione, compare il pulsante qui sotto. Altrimenti apri il menu del browser e scegli «Installa app» o «Aggiungi a schermata Home».',
      iosTitle: 'iPhone e iPad',
      iosBody: 'Apri questa pagina in Safari, tocca il pulsante Condividi e scegli «Aggiungi alla schermata Home». Studio Breve comparirà come un’app.',
      installButton: 'Installa l’app ora',
      installUnavailable: 'In questo momento il browser non propone l’installazione automatica. Segui i passaggi indicati sopra.',
      installed: 'Studio Breve è già disponibile come app su questo dispositivo.',
      qrTitle: 'Codice QR del sito',
      qrCaption: 'Inquadra il codice per aprire la pagina iniziale.',
      qrNote: 'Il codice porta all’indirizzo pubblico (www.studio-breve.it). Finché il sito non è online lì, non si aprirà. Nell’anteprima locale usa l’indirizzo nella barra del browser.',
      back: 'Torna alla pagina iniziale',
    },
    search: 'Cerca pacchetti',
    searchPlaceholder: 'Cerca un pacchetto o una parola chiave …',
    searchEmpty: 'Nessun pacchetto corrisponde a questa ricerca.',
    searchClose: 'Chiudi la ricerca',
    verifiedCustomer: 'Cliente verificata',
    translatedFromDe: 'Tradotto dal tedesco',
    plannedPrice: 'Prezzo previsto',
    badge: { waitlist: 'Lista d’attesa', inquiry: 'Su richiesta', soon: 'Prossimamente', new: 'Nuovo' },
    reserve: 'Segnala interesse',
    inquire: 'Richiedi informazioni',
    discoverProducts: 'Scopri i prodotti',
    seeShowcase: 'Vedi la panoramica',
    productsHeading: 'I nostri prodotti digitali',
    productsLead: 'Pacchetti con un perimetro chiaro, prezzo di listino e stato dichiarato con onestà. La vendita parte con l’avvio ufficiale; fino ad allora puoi segnalare interesse o chiedere informazioni.',
    filterAll: 'Tutti',
    shopEmpty: 'In questa categoria al momento non c’è alcun pacchetto.',
    testimonialHeading: 'Testimonianza',
    ctaBandTitle: 'Segnala il tuo interesse',
    ctaBandBody: 'Studio Breve sta partendo ora. Scrivici se un pacchetto ti interessa – senza impegno.',
    statsCatalog: 'Pacchetti in catalogo',
    statsLanguages: 'Lingue',
    statsVisits: 'Visite dall’avvio',
    statsSince: 'Online dal',
    statsSinceValue: '2026',
    trustHome: [
      { title: 'Conforme al GDPR', text: 'Senza cookie di tracciamento' },
      { title: 'Prezzi fissi e chiari', text: 'Prezzo di listino, indicato apertamente' },
      { title: 'Italiano e tedesco', text: 'Due lingue, uno studio' },
      { title: 'Contatto personale', text: 'Richiesta, non un checkout anonimo' },
    ],
    nav: { home: 'Home', packages: 'Pacchetti', products: 'Prodotti', services: 'Servizi', about: 'Chi siamo', contact: 'Contatti' },
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
      waitlist: 'Lista d’attesa',
      inquiry: 'Su richiesta',
      soon: 'Prossimamente',
      available: 'Pronto',
    } satisfies Record<PackageStatus, string>,
    statusExplain: {
      waitlist: 'Questo prodotto è in fase di sviluppo e non è ancora utilizzabile. Puoi segnalare il tuo interesse senza impegno; ti scriveremo al lancio.',
      inquiry: 'Questo servizio lo seguiamo di persona. Puoi già chiedere informazioni senza impegno; i contratti saranno conclusi solo dopo l’avvio ufficiale.',
      soon: 'Questo pacchetto è previsto ma non ancora disponibile. Se vuoi, ti avvisiamo una sola volta al lancio.',
      available: 'Questo pacchetto è pronto. La vendita parte con l’avvio ufficiale di Studio Breve; puoi già chiedere informazioni senza impegno.',
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
    included: 'Cosa contiene il pacchetto',
    conceptImage: 'Bozza grafica, non un prodotto finito',
    related: 'Altri pacchetti di questa categoria',
    backToCatalog: 'Torna a tutti i pacchetti',
    number: 'N.',
    home: {
      eyebrow: 'Studio digitale · Aragona, Sicilia',
      lead: 'Studio Breve sviluppa pacchetti digitali piccoli e ben definiti per attività in Italia e nei Paesi di lingua tedesca: dal sito curato all’avviso quotidiano sulle gare. Ognuno con un prezzo chiaro e uno stato dichiarato con onestà.',
      ctaPackages: 'Vedi i pacchetti',
      ctaContact: 'Contattaci',
      standToday: 'Stato attuale',
      statCatalog: 'Pacchetti in catalogo',
      statServices: 'Servizi su richiesta',
      statWaitlist: 'Prodotti con lista d’attesa',
      statPlanned: 'Pacchetti in preparazione',
      standNote: '',
      trust: [
        { title: 'Chiaro e trasparente', text: 'Prezzi fissi, stato dichiarato con onestà' },
        { title: 'Pacchetti piccoli e utili', text: 'Subito utilizzabili' },
        { title: 'Per attività in Italia e in area germanofona', text: 'Pratici e affidabili' },
        { title: 'In crescita continua', text: 'Prodotti nuovi, vie brevi' },
      ],
      sectionEyebrow: 'I nostri pacchetti e prodotti',
      sectionTitle: 'Soluzioni digitali per la tua attività',
      sectionLead: 'Pacchetti e prodotti digitali compatti e pratici – chiari, comprensibili e essenziali.',
    },
    offerCards: {
      website: {
        title: 'Pacchetto sito web',
        text: 'Il tuo sito professionale: moderno, chiaro e adattato all’attività. Da noi: SitoTranquillo e la manutenzione con SitoCura.',
        cta: 'Al pacchetto',
      },
      service: {
        title: 'Servizio',
        text: 'Prestazioni digitali su misura, su richiesta: flessibili, mirate ed efficienti.',
        cta: 'Chiedi dettagli',
      },
      product: {
        title: 'Prodotto digitale',
        text: 'Prodotti digitali utili per la tua attività, con un perimetro chiaro. Puoi già segnalare il tuo interesse; al momento non sono in vendita.',
        cta: 'Scopri i prodotti',
      },
      alert: {
        title: 'Avviso gare',
        text: 'Trovare automaticamente le gare pertinenti e non lasciarsi sfuggire le occasioni. Sono GareInBreve e BandiInBreve.',
        cta: 'Per saperne di più',
      },
    },
    cartPage: {
      title: 'Carrello',
      empty: 'Il carrello è vuoto.',
      body: 'Tramite questo sito non si può ancora acquistare nulla. I pacchetti si possono segnalare senza impegno o richiedere informazioni, quando vuoi.',
      toPackages: 'Ai pacchetti',
      toContact: 'Richiedi informazioni',
    },
    catalogKind: {
      productsTitle: 'Prodotti',
      productsLead: 'Prodotti digitali di Studio Breve: strumenti e modelli che userai in autonomia. Lo stato di ogni voce è indicato con onestà; la vendita parte con l’avvio ufficiale.',
      servicesTitle: 'Servizi',
      servicesLead: 'Prestazioni personali che prepariamo insieme a te. Puoi già chiedere informazioni senza impegno; i contratti saranno conclusi solo dopo l’avvio ufficiale.',
    },
    form: {
      title: 'Scrivici',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefono (facoltativo, per essere richiamato)',
      city: 'Località (facoltativo)',
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
      serverNote: 'I tuoi dati vengono salvati sul server di Studio Breve in Germania (All-Inkl) e usati solo per rispondere alla tua richiesta. Riceviamo solo un avviso via email, senza i tuoi dati.',
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
