/**
 * ZENTRALE PAKETDATEN von Studio Breve.
 *
 * Ein neues Paket = ein neues Objekt im Array `packages` (unten).
 * Katalog, Startseite, Detailseiten (DE + IT), Formular-Auswahl und Bündel
 * werden automatisch daraus erzeugt. Siehe README.md.
 *
 * Wichtig: Alle Preise sind Listenpreise (Entwurf). Kein Paket ist derzeit
 * kaufbar. Der Status muss ehrlich bleiben.
 */

import { neuePakete } from './packages-neu';
import autoPakete from './pakete-auto.json';

export type Locale = 'de' | 'it';
export type L10n<T = string> = Record<Locale, T>;

/* ---------- Kategorien ---------- */

export const categories = [
  {
    id: 'ausschreibungen-foerderung',
    label: { de: 'Ausschreibungen & Förderung', it: 'Gare e incentivi' },
    text: {
      de: 'Öffentliche Aufträge und Förderprogramme finden, ohne täglich Portale zu durchsuchen.',
      it: 'Trovare appalti pubblici e incentivi senza cercare ogni giorno sui portali.',
    },
  },
  {
    id: 'immobilien-gastgewerbe',
    label: { de: 'Immobilien & Gastgewerbe', it: 'Immobiliare e ospitalità' },
    text: {
      de: 'Werkzeuge für Immobilienbüros, Ferienvermieter, B&B und ihre Gäste.',
      it: 'Strumenti per agenzie immobiliari, affitti brevi, B&B e i loro ospiti.',
    },
  },
  {
    id: 'website-sichtbarkeit',
    label: { de: 'Website & Sichtbarkeit', it: 'Sito web e visibilità' },
    text: {
      de: 'Eine gepflegte Website und ein gepflegter Ruf – betreut statt selbst gebastelt.',
      it: 'Un sito curato e una buona reputazione online – seguiti da noi, non fai da te.',
    },
  },
  {
    id: 'wissen-vorlagen',
    label: { de: 'Wissen & Vorlagen', it: 'Formazione e modelli' },
    text: {
      de: 'Einmal kaufen, dauerhaft nutzen: Kurse und Vorlagen für den Büroalltag.',
      it: 'Si acquista una volta, si usa sempre: corsi e modelli per il lavoro d’ufficio.',
    },
  },
] as const satisfies ReadonlyArray<{ id: string; label: L10n; text: L10n }>;

export type CategoryId = (typeof categories)[number]['id'];

/** product = digitales Produkt (Software, Vorlage, Abo-Werkzeug); service = persönlich erbrachte Dienstleistung */
export type OfferKind = 'product' | 'service';

/** Filterchips auf der Startseite – ehrlich den Paketen zugeordnet, keine erfundenen Warengruppen. */
export const shopCategories = [
  { id: 'web-business', label: { de: 'Web & Business', it: 'Web e business' } },
  { id: 'design-media', label: { de: 'Design & Medien', it: 'Design e media' } },
  { id: 'marketing', label: { de: 'Marketing', it: 'Marketing' } },
  { id: 'ki-tools', label: { de: 'KI & Tools', it: 'AI e strumenti' } },
] as const satisfies ReadonlyArray<{ id: string; label: L10n }>;

export type ShopCategoryId = (typeof shopCategories)[number]['id'];

/* ---------- Status & Handlungsaufforderung ---------- */

/**
 * waitlist  = Produkt in Entwicklung, Interessenten können sich vormerken
 * inquiry   = Dienstleistung, unverbindliche Anfrage möglich
 * soon      = geplant, Benachrichtigung zum Start
 * available = kaufbar (erst setzen, wenn Produkt, Rechtliches und Zahlung fertig sind)
 */
export type PackageStatus = 'waitlist' | 'inquiry' | 'soon' | 'available';

/** Welche Handlung der Hauptbutton auslöst. */
export type CtaType = 'interest' | 'inquiry' | 'notify' | 'checkout';

/* ---------- Preise ---------- */

export interface Price {
  /** Betrag in Euro. 0 = kostenlos. */
  amount: number;
  interval: 'month' | 'once';
  /** excl = zzgl. MwSt./+ IVA, incl = Endpreis, tbd = Steuerausweis vor Start zu klären */
  vat: 'excl' | 'incl' | 'tbd';
  /** z. B. „je Unterkunft“ */
  unit?: L10n;
  /** Bezeichnung bei mehreren Preisen, z. B. „Pro“ */
  label?: L10n;
}

/* ---------- Zahlungs-Erweiterungspunkt ---------- */

/**
 * Platzhalter für einen späteren Zahlungsanbieter. Derzeit ist KEIN Anbieter
 * angebunden. Erst wenn `status: 'available'` UND `cta: 'checkout'` UND
 * `checkout.provider !== 'none'` mit `url` gesetzt sind, zeigt die Seite einen
 * Kauf-Link. Sonst fällt sie automatisch auf das Anfrageformular zurück.
 */
export interface CheckoutHook {
  provider: 'none' | 'stripe' | 'paypal' | 'lemonsqueezy' | 'gumroad' | 'invoice';
  /** externe Checkout-URL (Payment Link o. Ä.) */
  url?: string;
  /** frei für Preis-/Produkt-IDs des Anbieters */
  reference?: string;
}

export interface VorschauZeile { text: L10n; neben?: L10n; chip?: L10n; ton?: 'gruen' | 'gold' | 'grau' | 'rot' }
export interface VorschauDaten {
  art: 'fenster' | 'handy';
  adresse?: string;
  titel: L10n;
  zeilen: VorschauZeile[];
  seite?: { titel: L10n; punkte: L10n[] };
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Package {
  /** stabile Nummer aus Phase A */
  number: number;
  /** URL-Teil, gleich in DE und IT: /pakete/<slug>/ und /it/pacchetti/<slug>/ */
  slug: string;
  brand: string;
  category: CategoryId;
  /** ehrliche Einordnung: Produkt oder Dienstleistung */
  kind: OfferKind;
  /** Zuordnung zu den Filterchips auf der Startseite */
  shopCategory: ShopCategoryId;
  status: PackageStatus;
  cta: CtaType;
  prices: Price[];
  /** Bild unter /public, optional */
  image?: string;
  imageAlt?: L10n;
  /** Kurzer Markenslogan */
  tagline: L10n;
  /** Ein Satz Nutzen für die Karte */
  benefit: L10n;
  headline: L10n;
  intro: L10n;
  audience: L10n;
  job: L10n;
  why: L10n;
  features: L10n<string[]>;
  /** geplantes Startangebot, ehrlich als Plan formuliert */
  plannedOffer: L10n;
  faq: L10n<FaqItem[]>;
  /** Hinweise (Datenquellen, KI, keine Beratung …) */
  notes: L10n;
  /** Zielmarkt / Sprache des Produkts */
  market: L10n;
  checkout?: CheckoutHook;
  /** „So läuft es ab“ – drei Schritte (sonst aus ablauf.ts) */
  ablauf?: L10n<string[]>;
  /** Datengetriebene Vorschau (Vorlage „fenster“ oder „handy“) für automatisch ergänzte Pakete */
  vorschau?: VorschauDaten;
  /** Zeitpunkt der Aufnahme in den Katalog (ISO), nur bei automatisch ergänzten Paketen */
  erstellt?: string;
}

/* ---------- Pakete ---------- */

export const packages: Package[] = [
  {
    number: 1,
    slug: 'gareinbreve',
    brand: 'GareInBreve',
    category: 'ausschreibungen-foerderung',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 29, interval: 'month', vat: 'excl' }],
    image: '/images/packages/01-gareinbreve-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht der GareInBreve-Startseite in einem Browserfenster',
      it: 'Bozza della pagina iniziale di GareInBreve in una finestra del browser',
    },
    tagline: { de: 'Die passenden Ausschreibungen, jeden Morgen.', it: 'Le gare giuste, ogni mattina.' },
    benefit: {
      de: 'Öffentliche Ausschreibungen aus ANAC und TED, gefiltert und kurz zusammengefasst per E-Mail.',
      it: 'Gare pubbliche da ANAC e TED, filtrate e riassunte in breve via email.',
    },
    headline: {
      de: 'Die passenden öffentlichen Ausschreibungen für Ihren Betrieb – jeden Morgen per E-Mail.',
      it: 'Le gare d’appalto giuste per la tua impresa, ogni mattina nella tua email.',
    },
    intro: {
      de: 'Wir filtern die bei ANAC und TED veröffentlichten Ausschreibungen nach Branche, Provinz und Auftragswert und fassen sie in wenigen Zeilen zusammen. Sie entscheiden, ob Sie teilnehmen.',
      it: 'Filtriamo gli avvisi pubblicati su ANAC e TED per settore, provincia e importo e li riassumiamo in poche righe. Tu decidi se partecipare.',
    },
    audience: {
      de: 'Kleine Bau-, Installations-, Reinigungs-, IT- und Lieferbetriebe, die an öffentlichen Ausschreibungen teilnehmen, aber kein eigenes Vergabebüro haben.',
      it: 'Piccole imprese edili, di impianti, pulizie, informatica e forniture che partecipano a gare pubbliche ma non hanno un ufficio gare interno.',
    },
    job: {
      de: 'Keine passende Ausschreibung verpassen, ohne täglich ANAC-, TED- und Regionalportale zu durchsuchen.',
      it: 'Non perdere le gare adatte senza dover consultare ogni giorno i portali ANAC, TED e regionali.',
    },
    why: {
      de: 'Monatlich kündbar statt Jahresabo, klar lesbare Kurzfassung und Filter nach CPV-Code, Provinz und Auftragswert.',
      it: 'Abbonamento mensile invece che annuale, riassunto chiaro e filtri per codice CPV, provincia e importo.',
    },
    features: {
      de: [
        'Filter nach Maß: CPV-Codes, Provinzen und Wertgrenzen.',
        'Klare Kurzfassung: Gegenstand, Wert, Frist, Hauptanforderungen und Link zur offiziellen Bekanntmachung.',
        'Monatsabo, jederzeit kündbar. Keine Jahresbindung.',
      ],
      it: [
        'Filtri su misura: codici CPV, province e soglie di importo.',
        'Riassunto chiaro: oggetto, importo, scadenza, requisiti principali e link all’avviso ufficiale.',
        'Abbonamento mensile, disdici quando vuoi. Nessun vincolo annuale.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: 14 Tage kostenlos testen, ohne Kreditkarte.',
      it: 'Previsto al lancio: 14 giorni di prova gratuita, senza carta di credito.',
    },
    faq: {
      de: [
        { q: 'Die Ausschreibungen sind doch öffentlich?', a: 'Ja, und das sagen wir offen. Bezahlt wird der tägliche Filter und die Kurzfassung, die Ihnen die Suche auf den Portalen erspart.' },
        { q: 'Ist die Zusammenfassung verlässlich?', a: 'Sie ist eine als KI gekennzeichnete Lesehilfe. Maßgeblich ist immer die verlinkte Originalbekanntmachung.' },
        { q: 'Ist das Rechtsberatung?', a: 'Nein. Wir prüfen nicht die Eignung Ihres Betriebs und erstellen keine Angebote.' },
      ],
      it: [
        { q: 'Gli avvisi sono già pubblici, perché pagare?', a: 'I dati sono pubblici e lo diciamo. Il servizio è il filtro quotidiano e il riassunto: ti risparmia la ricerca sui portali.' },
        { q: 'Il riassunto è affidabile?', a: 'È un aiuto alla lettura generato con intelligenza artificiale e indicato come tale. Fa sempre fede l’avviso ufficiale, linkato in ogni email.' },
        { q: 'È una consulenza legale?', a: 'No. Non valutiamo l’idoneità della tua impresa e non prepariamo offerte.' },
      ],
    },
    notes: {
      de: 'Daten von ANAC und TED gemäß den jeweiligen Open-Data-Lizenzen. KI-generierte Zusammenfassungen. Keine Rechtsberatung.',
      it: 'Dati da ANAC e TED, riutilizzati secondo le rispettive licenze open data. Riassunti generati con AI. Nessuna consulenza legale.',
    },
    market: { de: 'Italien · Produkt auf Italienisch', it: 'Italia · servizio in italiano' },
    checkout: { provider: 'none' },
  },
  {
    number: 2,
    slug: 'immotesto',
    brand: 'ImmoTesto',
    category: 'immobilien-gastgewerbe',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 29, interval: 'month', vat: 'excl', unit: { de: 'je Büro', it: 'per agenzia' } }],
    image: '/images/packages/02-immotesto-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von ImmoTesto mit einem Inserat in drei Sprachen',
      it: 'Bozza di ImmoTesto con un annuncio in tre lingue',
    },
    tagline: { de: 'Exposés in drei Sprachen.', it: 'Annunci pronti in tre lingue.' },
    benefit: {
      de: 'Inseratstexte auf Deutsch, Italienisch und Englisch aus Ihren Objektdaten – Sie geben frei.',
      it: 'Testi per annunci in italiano, tedesco e inglese dai dati dell’immobile – approvi tu.',
    },
    headline: {
      de: 'Immobilien-Exposés auf Deutsch, Italienisch und Englisch – in wenigen Minuten.',
      it: 'Annunci immobiliari in italiano, tedesco e inglese, pronti in pochi minuti.',
    },
    intro: {
      de: 'Objektdaten eingeben: ImmoTesto schreibt Titel, Beschreibung und Portaltext. Sie lesen, korrigieren und veröffentlichen.',
      it: 'Inserisci i dati dell’immobile: ImmoTesto scrive titolo, descrizione e testo per i portali. Tu rileggi, correggi e pubblichi.',
    },
    audience: {
      de: 'Immobilienagenturen in Italien, besonders in Regionen mit deutsch- und englischsprachigen Käufern, sowie Makler im deutschsprachigen Raum mit Objekten in Italien.',
      it: 'Agenzie immobiliari in Italia, soprattutto nelle zone con acquirenti di lingua tedesca e inglese, e agenti nei Paesi di lingua tedesca con immobili in Italia.',
    },
    job: {
      de: 'Aus Objektdaten in Minuten saubere Inseratstexte in drei Sprachen erstellen.',
      it: 'Creare in pochi minuti testi d’annuncio curati in tre lingue partendo dalla scheda dell’immobile.',
    },
    why: {
      de: 'Kein Formulieren von Anweisungen: ImmoTesto kennt Portalformate und Pflichtangaben wie die Energieklasse, markiert fehlende Daten und erfindet nichts dazu.',
      it: 'Nessuna istruzione da riscrivere: ImmoTesto conosce i formati dei portali e i campi obbligatori come la classe energetica, segnala i dati mancanti e non inventa nulla.',
    },
    features: {
      de: [
        'Drei Sprachen für internationale Käufer, ideal für Objekte in Italien.',
        'Ihr Ton: Stil und Länge wählbar, der Text gehört Ihnen.',
        'Keine erfundenen Angaben: nur Ihre Daten, fehlende Pflichtangaben werden markiert.',
      ],
      it: [
        'Tre lingue per acquirenti dall’estero: italiano, tedesco, inglese.',
        'Il tono della tua agenzia: scegli stile e lunghezza, il testo resta tuo.',
        'Niente dati inventati: usa solo ciò che inserisci e ti segnala le informazioni mancanti.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: Die ersten 10 Exposés kostenlos.',
      it: 'Previsto al lancio: i primi 10 annunci gratuiti.',
    },
    faq: {
      de: [
        { q: 'Das kann ein allgemeiner KI-Chat doch auch.', a: 'Grundsätzlich ja. ImmoTesto spart die Anweisungen, kennt Portalformate und Pflichtangaben wie den Energieausweis und prüft alle drei Sprachfassungen.' },
        { q: 'Was, wenn der Text Fehler hat?', a: 'Nichts wird automatisch veröffentlicht. Sie lesen und geben jeden Text selbst frei.' },
        { q: 'Muss ich die KI-Nutzung offenlegen?', a: 'Wir liefern einen anpassbaren Hinweistext. Welche Pflichten für Sie gelten, prüfen Sie für Ihr Land.' },
      ],
      it: [
        { q: 'Posso già usare un chatbot generico.', a: 'Sì. ImmoTesto ti evita di riscrivere istruzioni ogni volta: modelli per i portali, campi obbligatori come la classe energetica, controllo delle tre lingue.' },
        { q: 'E se il testo contiene errori?', a: 'Nessun testo viene pubblicato in automatico. Lo rileggi e lo approvi sempre tu.' },
        { q: 'Devo informare i clienti dell’uso dell’AI?', a: 'La legge 132/2025 prevede un’informativa per i professionisti: ti forniremo una frase pronta da adattare.' },
      ],
    },
    notes: {
      de: 'KI-generierte Texte, vor Veröffentlichung zu prüfen. Unabhängiger Dienst ohne Verbindung zu Immobilienportalen.',
      it: 'Testi generati con intelligenza artificiale, da verificare prima della pubblicazione. Servizio indipendente, non collegato ai portali immobiliari.',
    },
    market: { de: 'Italien und deutschsprachiger Raum · IT/DE', it: 'Italia e Paesi di lingua tedesca · IT/DE' },
    checkout: { provider: 'none' },
  },
  {
    number: 3,
    slug: 'replicapro',
    brand: 'ReplicaPro',
    category: 'website-sichtbarkeit',
    kind: 'product',
    shopCategory: 'marketing',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 24, interval: 'month', vat: 'excl', unit: { de: 'je Standort', it: 'per sede' } }],
    image: '/images/packages/03-replicapro-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von ReplicaPro mit einem Antwortvorschlag auf eine Bewertung',
      it: 'Bozza di ReplicaPro con una proposta di risposta a una recensione',
    },
    tagline: { de: 'Jede Bewertung, eine Antwort.', it: 'Ogni recensione, una risposta.' },
    benefit: {
      de: 'Antwortentwürfe für jede neue Google-Bewertung – veröffentlicht wird erst nach Ihrer Freigabe.',
      it: 'Una bozza di risposta per ogni nuova recensione Google – si pubblica solo dopo la tua approvazione.',
    },
    headline: {
      de: 'Jede Google-Bewertung beantworten – ohne dafür den Feierabend zu opfern.',
      it: 'Rispondi a ogni recensione Google, senza perderci la serata.',
    },
    intro: {
      de: 'ReplicaPro schreibt zu jeder neuen Bewertung einen höflichen, persönlichen Antwortvorschlag. Sie geben ihn mit einem Klick frei, erst dann wird er veröffentlicht.',
      it: 'ReplicaPro prepara una risposta cortese e personalizzata per ogni nuova recensione. Tu la approvi con un clic e solo allora viene pubblicata.',
    },
    audience: {
      de: 'Restaurants, B&B, Hotels und Läden, die viele Bewertungen erhalten, aber abends keine Zeit für Antworten haben.',
      it: 'Ristoranti, B&B, hotel e negozi che ricevono molte recensioni ma la sera non hanno tempo per rispondere.',
    },
    job: {
      de: 'Jede Bewertung zeitnah, freundlich und passend beantworten, ohne selbst zu formulieren.',
      it: 'Rispondere a ogni recensione in tempi brevi, con cortesia e pertinenza, senza doverla scrivere da zero.',
    },
    why: {
      de: 'Italienische und deutsche Tonalität, Freigabe vor jeder Veröffentlichung und ein persönlicher Ansprechpartner vor Ort.',
      it: 'Tono curato in italiano e in tedesco, approvazione prima di ogni pubblicazione e una persona di riferimento sul territorio.',
    },
    features: {
      de: [
        'Entwürfe in Ihrem Ton, auf Deutsch, Italienisch oder Englisch – in der Sprache des Gastes.',
        'Keine automatische Veröffentlichung: Sie entscheiden immer.',
        'Sofortiger Hinweis bei negativen Bewertungen, mit ruhigem, sachlichem Entwurf.',
      ],
      it: [
        'Bozze nel tuo tono, in italiano, inglese o tedesco, nella lingua del cliente.',
        'Nessuna pubblicazione automatica: decidi sempre tu.',
        'Avviso immediato per le recensioni negative, con una bozza calma e professionale.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: 14 Tage kostenlos testen.',
      it: 'Previsto al lancio: 14 giorni di prova gratuita.',
    },
    faq: {
      de: [
        { q: 'Klingt das nicht nach Automat?', a: 'Die Entwürfe greifen Namen und Details der Bewertung auf. Sie können vor der Freigabe alles ändern.' },
        { q: 'Wie greifen Sie auf mein Profil zu?', a: 'Über den offiziellen Zugang, den Sie selbst erteilen und jederzeit widerrufen können.' },
        { q: 'Schreiben Sie auch Bewertungen?', a: 'Nein. Wir schreiben, kaufen oder filtern keine Bewertungen.' },
      ],
      it: [
        { q: 'Le risposte sembreranno automatiche?', a: 'Le bozze riprendono il nome e i dettagli citati nella recensione; puoi modificarle prima di approvarle.' },
        { q: 'Come accedete al mio profilo?', a: 'Tramite l’accesso ufficiale che ci autorizzi tu e che puoi revocare in ogni momento.' },
        { q: 'Scrivete anche recensioni?', a: 'No. Non scriviamo, non compriamo e non filtriamo recensioni.' },
      ],
    },
    notes: {
      de: 'KI-generierte Entwürfe, vom Inhaber freigegeben. Unabhängiger Dienst, nicht mit Google verbunden.',
      it: 'Bozze generate con AI e approvate dal titolare dell’attività. Servizio indipendente, non affiliato a Google.',
    },
    market: { de: 'Italien zuerst · IT/DE/EN', it: 'Prima l’Italia · IT/DE/EN' },
    checkout: { provider: 'none' },
  },
  {
    number: 4,
    slug: 'betriebsautopilot',
    brand: 'Betriebsautopilot',
    category: 'wissen-vorlagen',
    kind: 'product',
    shopCategory: 'ki-tools',
    status: 'soon',
    cta: 'notify',
    prices: [{ amount: 199, interval: 'once', vat: 'tbd' }],
    image: '/images/packages/04-betriebsautopilot-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht der Kursseite Betriebsautopilot',
      it: 'Bozza della pagina del corso Betriebsautopilot',
    },
    tagline: { de: 'Weniger Büro. Mehr Baustelle.', it: 'Meno ufficio. Più cantiere.' },
    benefit: {
      de: 'Online-Kurs: KI im Handwerksbetrieb sinnvoll und datenschutzbewusst einsetzen.',
      it: 'Corso online: usare l’AI nell’impresa artigiana con criterio e nel rispetto della privacy.',
    },
    headline: {
      de: 'Weniger Büro, mehr Baustelle: KI im Handwerksbetrieb sinnvoll einsetzen.',
      it: 'Meno ufficio, più cantiere: l’intelligenza artificiale nell’impresa artigiana, usata con criterio.',
    },
    intro: {
      de: 'Ein praxisnaher Online-Kurs in sechs Modulen: Angebote schneller schreiben, Anfragen sortieren, Termine und Rechnungen vorbereiten – mit Werkzeugen, die wenig oder nichts kosten.',
      it: 'Un corso online pratico in sei moduli: preventivi più rapidi, richieste ordinate, appuntamenti e fatture preparati – con strumenti gratuiti o quasi. Il corso è in lingua tedesca.',
    },
    audience: {
      de: 'Inhaber kleiner Handwerksbetriebe mit 1 bis 10 Beschäftigten, die abends Angebote, Rechnungen und Anfragen bearbeiten.',
      it: 'Titolari di piccole imprese artigiane (da 1 a 10 addetti) nei Paesi di lingua tedesca che la sera si occupano di preventivi, fatture e richieste.',
    },
    job: {
      de: 'Büroarbeit mit einfachen KI-Werkzeugen verkürzen, ohne neue teure Software und ohne Programmierkenntnisse.',
      it: 'Ridurre il lavoro d’ufficio con semplici strumenti di AI, senza nuovo software costoso e senza saper programmare.',
    },
    why: {
      de: 'Einmalzahlung statt Abo, ergänzt Ihre vorhandene Software und erklärt die Datenschutzgrenzen – praxisnah statt allgemein.',
      it: 'Pagamento unico invece di un abbonamento, si affianca al software che usi già e spiega i limiti della privacy – concreto, non generico.',
    },
    features: {
      de: [
        'Schritt für Schritt an realistischen Abläufen eines Beispielbetriebs.',
        'Vorlagen und Arbeitsanweisungen zum Mitnehmen, direkt einsetzbar.',
        'Datenschutz von Anfang an: was in KI-Werkzeuge darf und was nicht.',
      ],
      it: [
        'Passo dopo passo, sui processi realistici di un’impresa di esempio.',
        'Modelli e istruzioni da portare via, utilizzabili subito.',
        'Privacy fin dall’inizio: cosa si può inserire negli strumenti di AI e cosa no.',
      ],
    },
    plannedOffer: {
      de: 'Geplant: Zugang zur Kursversion inklusive Aktualisierungen im Erscheinungsjahr. Die erste Lektion soll kostenlos sein.',
      it: 'Previsto: accesso alla versione del corso con aggiornamenti per l’anno di uscita. La prima lezione sarà gratuita.',
    },
    faq: {
      de: [
        { q: 'Ich habe keine Zeit für einen Kurs.', a: 'Jede Lektion soll unter 15 Minuten dauern und auch auf dem Handy laufen.' },
        { q: 'Ich bin kein Technikmensch.', a: 'Sie brauchen keine Programmierkenntnisse. Alles wird am Bildschirm gezeigt.' },
        { q: 'Ersetzt das meine Handwerkersoftware?', a: 'Nein. Der Kurs zeigt, wie KI Ihre vorhandenen Werkzeuge ergänzt.' },
      ],
      it: [
        { q: 'Non ho tempo per un corso.', a: 'Ogni lezione durerà meno di 15 minuti e si potrà seguire anche dal telefono.' },
        { q: 'Non sono pratico di tecnologia.', a: 'Non serve saper programmare. Tutto viene mostrato sullo schermo.' },
        { q: 'Sostituisce il mio gestionale?', a: 'No. Il corso mostra come l’AI può affiancare gli strumenti che usi già.' },
      ],
    },
    notes: {
      de: 'Kein Erfolgsversprechen; Ergebnisse hängen vom Betrieb ab. Der Steuerausweis des Preises wird vor dem Start geklärt.',
      it: 'Nessuna promessa di risultato; gli effetti dipendono dalla singola impresa. Il trattamento fiscale del prezzo sarà definito prima del lancio.',
    },
    market: { de: 'Deutschsprachiger Raum · Kurs auf Deutsch', it: 'Paesi di lingua tedesca · corso in tedesco' },
    checkout: { provider: 'none' },
  },
  {
    number: 5,
    slug: 'vermieterkiste',
    brand: 'VermieterKiste',
    category: 'wissen-vorlagen',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'soon',
    cta: 'notify',
    prices: [
      { amount: 19, interval: 'once', vat: 'tbd', unit: { de: 'je Paket', it: 'per pacchetto' } },
      { amount: 39, interval: 'once', vat: 'tbd', label: { de: 'Alle drei Pakete', it: 'Tutti e tre i pacchetti' } },
    ],
    image: '/images/packages/05-vermieterkiste-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht der VermieterKiste mit Vorlagen für Belegung und Rechnungen',
      it: 'Bozza di VermieterKiste con modelli per prenotazioni e fatture',
    },
    tagline: { de: 'Fertige Vorlagen statt leerer Tabellen.', it: 'Modelli pronti invece di tabelle vuote.' },
    benefit: {
      de: 'Belegungsplan, Kurtaxe-Rechner, Angebots- und Rechnungsvorlagen für Google Sheets und Notion.',
      it: 'Planning delle prenotazioni, calcolo dell’imposta di soggiorno, modelli di preventivo e fattura per Google Sheets e Notion.',
    },
    headline: {
      de: 'Fertige Vorlagen statt leerer Tabellen.',
      it: 'Modelli pronti invece di tabelle vuote.',
    },
    intro: {
      de: 'Belegungsplan, Kurtaxe-Rechner, Angebots- und Rechnungsvorlagen für Google Sheets und Notion – sofort nutzbar und einfach anpassbar.',
      it: 'Planning delle prenotazioni, calcolo dell’imposta di soggiorno, modelli di preventivo e di fattura per Google Sheets e Notion – pronti all’uso e facili da adattare. Prima versione in tedesco.',
    },
    audience: {
      de: 'Ferienvermieter mit 1 bis 5 Einheiten und kleine Handwerksbetriebe, die mit Zettel oder leerer Tabelle arbeiten.',
      it: 'Proprietari con 1–5 alloggi per affitti brevi e piccole imprese artigiane che oggi lavorano con fogli di carta o tabelle vuote.',
    },
    job: {
      de: 'Belegung, Kurtaxe, Angebote und Rechnungen ordentlich führen, ohne Software-Abo.',
      it: 'Gestire in ordine prenotazioni, imposta di soggiorno, preventivi e fatture, senza abbonamenti software.',
    },
    why: {
      de: 'Getestete Formeln, Beispieldaten und eine kurze Videoanleitung je Vorlage – statt unvollständiger Gratisvorlagen.',
      it: 'Formule verificate, dati di esempio e un breve video per ogni modello – invece di modelli gratuiti incompleti.',
    },
    features: {
      de: [
        'Funktioniert mit kostenlosen Google- und Notion-Konten.',
        'Geprüfte Formeln, Beispieldaten und eine kurze Videoanleitung.',
        'Einmal bezahlen, kein Abo.',
      ],
      it: [
        'Funziona con account Google e Notion gratuiti.',
        'Formule verificate, dati di esempio e una breve video-guida.',
        'Paghi una volta, nessun abbonamento.',
      ],
    },
    plannedOffer: {
      de: 'Geplant: 19 € je Paket, alle drei Pakete zusammen 39 €. Der Steuerausweis wird vor dem Start geklärt.',
      it: 'Previsto: 19 € per pacchetto, tutti e tre insieme 39 €. Il trattamento fiscale sarà definito prima del lancio.',
    },
    faq: {
      de: [
        { q: 'Sind die Vorlagen rechtssicher?', a: 'Sie sind Arbeitshilfen. Kurtaxe-Sätze stellen Sie für Ihre Gemeinde selbst ein. Die Rechnungsvorlage ist keine E-Rechnung im Format XRechnung oder ZUGFeRD.' },
        { q: 'Geht das auch mit Excel?', a: 'Die Sheets-Versionen lassen sich als Excel-Datei exportieren; die Notion-Vorlagen nicht.' },
        { q: 'Was, wenn ich nicht klarkomme?', a: 'Jede Vorlage bekommt ein Kurzvideo; Fragen beantworten wir per E-Mail.' },
      ],
      it: [
        { q: 'I modelli sono validi ai fini di legge?', a: 'Sono strumenti di lavoro. Le tariffe dell’imposta di soggiorno le imposti tu secondo il tuo comune. Il modello di fattura non è una fattura elettronica da inviare allo SdI.' },
        { q: 'Funziona anche con Excel?', a: 'Le versioni per Google Sheets si possono esportare in Excel; i modelli Notion no.' },
        { q: 'E se non riesco a usarli?', a: 'Ogni modello avrà un breve video; alle domande rispondiamo via email.' },
      ],
    },
    notes: {
      de: 'Digitale Inhalte: Beim Start wird über das Widerrufsrecht gesondert informiert. Vorlagen sind keine Steuer- oder Rechtsberatung.',
      it: 'Contenuti digitali: al lancio saranno fornite informazioni specifiche sul diritto di recesso. I modelli non costituiscono consulenza fiscale o legale.',
    },
    market: { de: 'Deutschsprachiger Raum · Vorlagen auf Deutsch', it: 'Paesi di lingua tedesca · modelli in tedesco' },
    checkout: { provider: 'none' },
  },
  {
    number: 6,
    slug: 'sitotranquillo',
    brand: 'SitoTranquillo',
    category: 'website-sichtbarkeit',
    kind: 'service',
    shopCategory: 'web-business',
    status: 'inquiry',
    cta: 'inquiry',
    prices: [{ amount: 69, interval: 'month', vat: 'excl' }],
    image: '/images/packages/06-sitotranquillo-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von SitoTranquillo auf Handy und Tablet',
      it: 'Bozza di SitoTranquillo su smartphone e tablet',
    },
    tagline: { de: 'Ihre Website, ohne Sorgen.', it: 'Il tuo sito, senza pensieri.' },
    benefit: {
      de: 'Website im Monatsabo: gebaut, veröffentlicht und gepflegt – ohne Startkosten.',
      it: 'Sito in abbonamento mensile: progettato, pubblicato e aggiornato – senza costi iniziali.',
    },
    headline: {
      de: 'Die Website Ihres Betriebs, gebaut und gepflegt von uns. 69 € im Monat, alles inklusive.',
      it: 'Il sito della tua attività, fatto e curato da noi. 69 € al mese, tutto incluso.',
    },
    intro: {
      de: 'Wir planen, veröffentlichen und pflegen Ihre Website: Domain, Hosting, Texte und monatliche Änderungen. Keine Startkosten. Wir sitzen in Aragona und treffen Sie persönlich.',
      it: 'Progettiamo, pubblichiamo e aggiorniamo il tuo sito: dominio, hosting, testi e modifiche mensili. Nessun costo iniziale. Siamo ad Aragona e ci incontriamo di persona.',
    },
    audience: {
      de: 'Bars, Restaurants, Handwerker, Läden und Praxen in der Provinz Agrigento ohne eigene oder mit veralteter Website.',
      it: 'Bar, ristoranti, artigiani, negozi e studi professionali in provincia di Agrigento senza sito o con un sito datato.',
    },
    job: {
      de: 'Eine gepflegte Website haben, ohne sich um Technik, Hosting oder Updates zu kümmern.',
      it: 'Avere un sito curato senza occuparsi di tecnica, hosting o aggiornamenti.',
    },
    why: {
      de: 'Persönlich vor Ort in Aragona, Monatsrate statt Anzahlung, Änderungen inklusive.',
      it: 'Presenza di persona ad Aragona, canone mensile invece di un anticipo, modifiche incluse.',
    },
    features: {
      de: [
        'Monatliche Änderungen inklusive: Öffnungszeiten, Speisekarte, Preise, Fotos.',
        'Sichtbar in Google Maps und auf jedem Handy, Datenschutz und Cookies korrekt.',
        'Die Domain läuft auf Ihren Namen und bleibt Ihre.',
      ],
      it: [
        'Modifiche incluse ogni mese: orari, menu, prezzi, foto.',
        'Visibile su Google Maps e su ogni telefono, con privacy e cookie in regola.',
        'Il dominio è intestato a te e resta tuo.',
      ],
    },
    plannedOffer: {
      de: 'Geplante Konditionen: keine Einrichtungsgebühr, Mindestlaufzeit 12 Monate.',
      it: 'Condizioni previste: nessun costo di avvio, durata minima 12 mesi.',
    },
    faq: {
      de: [
        { q: 'Ich habe schon eine Facebook-Seite.', a: 'Die Website gehört Ihnen, erscheint bei Google und hängt von keinem Algorithmus eines sozialen Netzwerks ab.' },
        { q: 'Was, wenn ich kündige?', a: 'Die Domain bleibt Ihre, und Sie können den Export Ihrer Inhalte verlangen.' },
        { q: 'Das ist teurer als ein Baukasten.', a: 'Ja, weil die Arbeit inklusive ist: Texte, Pflege, Unterstützung und ein Ansprechpartner, den Sie anrufen können.' },
      ],
      it: [
        { q: 'Ho già una pagina Facebook.', a: 'Il sito è tuo, compare su Google e non dipende dall’algoritmo di un social network.' },
        { q: 'E se smetto di pagare?', a: 'Il dominio resta tuo e puoi richiedere l’esportazione dei contenuti.' },
        { q: 'Costa più di un sito fai da te.', a: 'Sì, perché include il lavoro: testi, aggiornamenti, assistenza e una persona da chiamare.' },
      ],
    },
    notes: {
      de: 'Preise zzgl. MwSt. Die Leistung beginnt erst nach dem offiziellen Start von Studio Breve; Anfragen sind unverbindlich.',
      it: 'Prezzi IVA esclusa. Il servizio inizierà solo dopo l’avvio ufficiale di Studio Breve; le richieste non sono vincolanti.',
    },
    market: { de: 'Provinz Agrigento, dann Sizilien · IT/DE', it: 'Provincia di Agrigento, poi Sicilia · IT/DE' },
    checkout: { provider: 'none' },
  },
  {
    number: 7,
    slug: 'sitocura',
    brand: 'SitoCura',
    category: 'website-sichtbarkeit',
    kind: 'service',
    shopCategory: 'web-business',
    status: 'inquiry',
    cta: 'inquiry',
    prices: [{ amount: 39, interval: 'month', vat: 'excl', unit: { de: 'je Website', it: 'per sito' } }],
    image: '/images/packages/07-sitocura-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von SitoCura mit einem Wartungsbericht',
      it: 'Bozza di SitoCura con un report di manutenzione',
    },
    tagline: { de: 'Aktualisiert. Gesichert. Überwacht.', it: 'Aggiornato. Salvato. Controllato.' },
    benefit: {
      de: 'WordPress-Wartung mit Backups, Updates, Überwachung und verständlichem Monatsbericht.',
      it: 'Manutenzione WordPress con backup, aggiornamenti, monitoraggio e un report mensile chiaro.',
    },
    headline: {
      de: 'Ihre WordPress-Website – jeden Monat aktualisiert, gesichert und überwacht.',
      it: 'Il tuo sito WordPress aggiornato, salvato e controllato ogni mese.',
    },
    intro: {
      de: 'Updates mit vorheriger Sicherung, tägliche Backups an einem getrennten Ort, laufende Überwachung und ein klarer Monatsbericht. Wenn etwas kaputtgeht, stellen wir es wieder her.',
      it: 'Aggiornamenti con backup preventivo, copie giornaliere in un luogo separato, monitoraggio continuo e un report mensile chiaro. Se qualcosa si rompe, lo ripristiniamo.',
    },
    audience: {
      de: 'Kleine Betriebe und Freiberufler mit einer bestehenden WordPress-Website, die seit Monaten niemand aktualisiert hat.',
      it: 'Piccole attività e professionisti con un sito WordPress esistente che nessuno aggiorna da mesi.',
    },
    job: {
      de: 'Die Website sicher und funktionsfähig halten, ohne sich um Updates und Backups zu kümmern.',
      it: 'Mantenere il sito sicuro e funzionante senza pensare ad aggiornamenti e backup.',
    },
    why: {
      de: 'Verständlicher Monatsbericht auf Italienisch oder Deutsch, Auftragsverarbeitungsvertrag nach Art. 28 DSGVO und ein Ansprechpartner vor Ort.',
      it: 'Report mensile comprensibile in italiano o in tedesco, accordo per il trattamento dei dati ai sensi dell’art. 28 GDPR e una persona di riferimento sul territorio.',
    },
    features: {
      de: [
        'Backup vor jedem Update, 30 Tage aufbewahrt.',
        'Überwachung: Sie erfahren es, wenn die Seite nicht erreichbar ist.',
        'Monatsbericht in verständlicher Sprache: was gemacht wurde und was zu prüfen ist.',
      ],
      it: [
        'Backup prima di ogni aggiornamento, conservati per 30 giorni.',
        'Monitoraggio: ti avvisiamo se il sito non risponde.',
        'Report mensile in italiano semplice: cosa è stato fatto e cosa controllare.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: kostenloser Erstcheck Ihrer Website.',
      it: 'Previsto al lancio: controllo iniziale gratuito del tuo sito.',
    },
    faq: {
      de: [
        { q: 'Meine Seite läuft doch.', a: 'Veraltete Plugins sind eine häufige Ursache für Sicherheitsprobleme. Der Erstcheck zeigt den aktuellen Stand.' },
        { q: 'Haben Sie Zugriff auf meine Daten?', a: 'Nur zur Wartung, mit Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.' },
        { q: 'Und wenn die Seite gehackt wird?', a: 'Die Wiederherstellung aus dem letzten Backup ist inklusive; eine Tiefenreinigung wird gesondert angeboten.' },
      ],
      it: [
        { q: 'Il mio sito funziona già.', a: 'Plugin non aggiornati sono una causa frequente di problemi di sicurezza. Il controllo iniziale ti dice com’è la situazione.' },
        { q: 'Avrete accesso ai miei dati?', a: 'Sì, solo per la manutenzione. Firmiamo un accordo per il trattamento dei dati (art. 28 GDPR).' },
        { q: 'E se il sito viene attaccato?', a: 'Il ripristino dall’ultimo backup è incluso; una pulizia approfondita viene preventivata a parte.' },
      ],
    },
    notes: {
      de: 'WordPress ist eine Marke der WordPress Foundation; SitoCura ist ein unabhängiger Dienst. Leistung beginnt erst nach dem offiziellen Start.',
      it: 'WordPress è un marchio della WordPress Foundation; SitoCura è un servizio indipendente. Il servizio inizierà solo dopo l’avvio ufficiale.',
    },
    market: { de: 'Italien, ergänzend deutschsprachiger Raum', it: 'Italia, in aggiunta Paesi di lingua tedesca' },
    checkout: { provider: 'none' },
  },
  {
    number: 8,
    slug: 'bandiinbreve',
    brand: 'BandiInBreve',
    category: 'ausschreibungen-foerderung',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [
      { amount: 0, interval: 'month', vat: 'incl', label: { de: 'Wochen-Newsletter', it: 'Newsletter settimanale' } },
      { amount: 19, interval: 'month', vat: 'excl', label: { de: 'Pro', it: 'Pro' } },
    ],
    image: '/images/packages/08-bandiinbreve-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von BandiInBreve mit gefilterten Förderprogrammen',
      it: 'Bozza di BandiInBreve con bandi filtrati',
    },
    tagline: { de: 'Förderprogramme für Sizilien, gefiltert.', it: 'I bandi per la Sicilia, filtrati.' },
    benefit: {
      de: 'Neue Förderprogramme für Sizilien jede Woche, mit Fristen und Link zur offiziellen Quelle.',
      it: 'Ogni settimana i nuovi bandi per la Sicilia, con scadenze e link alla fonte ufficiale.',
    },
    headline: {
      de: 'Förderprogramme für Betriebe in Sizilien – gefiltert für Sie.',
      it: 'I bandi e gli incentivi per le imprese in Sicilia, filtrati per te.',
    },
    intro: {
      de: 'Jede Woche neue regionale, nationale und europäische Programme, die zu Ihrem Betrieb passen, mit Fristen, Kurzfassung und Link zur offiziellen Quelle.',
      it: 'Ogni settimana i nuovi bandi regionali, nazionali ed europei rilevanti per la tua attività, con scadenze e requisiti in breve e il link alla fonte ufficiale.',
    },
    audience: {
      de: 'Kleinbetriebe, Gründer, Agriturismi und Handwerker in Sizilien sowie Steuerberater, die ihre Mandanten informieren wollen.',
      it: 'Piccole imprese, startup, agriturismi e artigiani in Sicilia, e commercialisti che vogliono informare i propri clienti.',
    },
    job: {
      de: 'Passende Förderprogramme rechtzeitig finden und Fristen nicht verpassen.',
      it: 'Trovare in tempo i bandi adatti e non perdere le scadenze.',
    },
    why: {
      de: 'Das offizielle Portal incentivi.gov.it ist kostenlos, und wir nennen es. Unser Wert: Filter nach Branche und Gemeinde, Fristerinnerungen und eine verständliche Kurzfassung, auch auf Deutsch.',
      it: 'Il portale ufficiale incentivi.gov.it è gratuito e lo citiamo. Il nostro valore: filtri per settore e comune, promemoria delle scadenze e un riassunto comprensibile, anche in tedesco.',
    },
    features: {
      de: [
        'Filter nach Branche, Betriebsgröße und Gemeinde.',
        'Erinnerung vor Fristende (Pro-Tarif).',
        'Kurzfassungen auf Italienisch, auf Wunsch auf Deutsch und Englisch.',
      ],
      it: [
        'Filtri per settore, dimensione dell’impresa e comune.',
        'Promemoria prima delle scadenze (piano Pro).',
        'Riassunti in italiano semplice, su richiesta anche in tedesco e inglese.',
      ],
    },
    plannedOffer: {
      de: 'Geplant: Der Wochen-Newsletter bleibt kostenlos. Pro mit Filtern und Erinnerungen kostet 19 € zzgl. MwSt. im Monat.',
      it: 'Previsto: la newsletter settimanale resta gratuita. Il piano Pro con filtri e promemoria costa 19 € + IVA al mese.',
    },
    faq: {
      de: [
        { q: 'Das offizielle Portal ist gratis.', a: 'Stimmt, und wir nennen es. Wir filtern für Sie und erinnern an Fristen.' },
        { q: 'Garantieren Sie die Förderung?', a: 'Nein. Das kann niemand. Wir stellen auch keine Anträge für Sie.' },
        { q: 'Sind Sie eine Behörde?', a: 'Nein, ein unabhängiger privater Dienst.' },
      ],
      it: [
        { q: 'Il portale ufficiale è gratuito.', a: 'È vero e lo citiamo. Noi filtriamo per te e ti ricordiamo le scadenze.' },
        { q: 'Mi garantite il contributo?', a: 'No. Nessuno può garantirlo. Non presentiamo domande per conto tuo.' },
        { q: 'Siete un ente pubblico?', a: 'No, siamo un servizio privato indipendente.' },
      ],
    },
    notes: {
      de: 'Wird Daten von incentivi.gov.it unter Lizenz IODL 2.0 enthalten. Privater Dienst ohne Behördenverbindung. KI-Kurzfassungen; maßgeblich ist die offizielle Ausschreibung.',
      it: 'Conterrà dati da incentivi.gov.it rilasciati con licenza IODL 2.0. Servizio privato, non affiliato a enti pubblici. Riassunti generati con AI; fa fede il bando ufficiale.',
    },
    market: { de: 'Sizilien · IT mit DE/EN-Kurzfassung', it: 'Sicilia · IT con riassunto DE/EN' },
    checkout: { provider: 'none' },
  },
  {
    number: 9,
    slug: 'ospiteinregola',
    brand: 'OspiteInRegola',
    category: 'immobilien-gastgewerbe',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 19, interval: 'month', vat: 'excl', unit: { de: 'je Unterkunft', it: 'per alloggio' } }],
    image: '/images/packages/09-ospiteinregola-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von OspiteInRegola mit Fristenkalender',
      it: 'Bozza di OspiteInRegola con scadenziario',
    },
    tagline: { de: 'Ferienvermietung, ordnungsgemäß.', it: 'Affitti brevi, in regola.' },
    benefit: {
      de: 'CIN, Gästemeldung und Kurtaxe im Griff: Erinnerung und Checkliste für jede Buchung.',
      it: 'CIN, schedine alloggiati e tassa di soggiorno sotto controllo: promemoria e checklist per ogni prenotazione.',
    },
    headline: {
      de: 'Ferienvermietung in Italien – CIN, Gästemeldung und Kurtaxe im Griff.',
      it: 'Affitti brevi in regola: CIN, schedine alloggiati e tassa di soggiorno sotto controllo.',
    },
    intro: {
      de: 'Eine Erinnerung und Checkliste für jede Buchung: was zu melden ist, bis wann und was aufzubewahren ist. Für Eigentümer mit 1 bis 10 Unterkünften – auf Deutsch erklärt.',
      it: 'Un promemoria e una checklist per ogni prenotazione: cosa inviare, entro quando e cosa conservare. Pensato per chi gestisce da 1 a 10 alloggi.',
    },
    audience: {
      de: 'Privatvermieter und kleine Verwalter mit 1 bis 10 Einheiten, die ohne Channel-Manager arbeiten – auch deutschsprachige Eigentümer von Ferienwohnungen in Italien.',
      it: 'Proprietari privati e piccoli gestori con 1–10 unità che lavorano senza channel manager – anche proprietari di lingua tedesca con case vacanza in Italia.',
    },
    job: {
      de: 'Pflichten bei jeder Buchung zuverlässig erledigen: Gästemeldung, Kurtaxe, CIN-Angaben.',
      it: 'Adempiere con regolarità agli obblighi di ogni prenotazione: schedine, tassa di soggiorno, CIN.',
    },
    why: {
      de: 'Schlank statt umfangreicher Channel-Manager, erklärt die Pflichten und spricht auch Deutsch.',
      it: 'Snello rispetto a un channel manager completo, spiega gli obblighi e parla anche tedesco.',
    },
    features: {
      de: [
        'Fristenkalender: Gästemeldung binnen 24 Stunden nach Ankunft, Kurtaxe-Fristen je Gemeinde.',
        'Kurtaxe pro Buchung berechnet, Datei für den Upload in Alloggiati Web vorbereitet.',
        'Gästedaten geschützt: Speicherung in der EU, fristgerechte Löschung.',
      ],
      it: [
        'Scadenziario: schedine entro 24 ore dall’arrivo e scadenze della tassa di soggiorno secondo il tuo comune.',
        'Calcolo della tassa di soggiorno per prenotazione, con le esenzioni che imposti tu, e file pronto da caricare su Alloggiati Web.',
        'Dati degli ospiti protetti: conservati nell’UE e cancellati secondo le regole.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: 30 Tage kostenlos testen.',
      it: 'Previsto al lancio: 30 giorni di prova gratuita.',
    },
    faq: {
      de: [
        { q: 'Mein Channel-Manager kann das.', a: 'Manche ja. OspiteInRegola ist für alle ohne Channel-Manager oder mit Wunsch nach einfacher Kontrolle.' },
        { q: 'Ersetzt das meinen Steuerberater?', a: 'Nein. Es erinnert an Fristen; steuerliche Fragen bleiben bei Ihrem Berater.' },
        { q: 'Was ist mit Ausweisdaten?', a: 'Das sind personenbezogene Daten. Sie werden DSGVO-konform verarbeitet und nicht für andere Zwecke genutzt.' },
      ],
      it: [
        { q: 'Lo fa già il mio channel manager.', a: 'Alcuni lo fanno. OspiteInRegola è pensato per chi non ne ha uno o vuole un controllo semplice.' },
        { q: 'Sostituisce il commercialista?', a: 'No. Ti aiuta a non dimenticare le scadenze; le scelte fiscali restano al tuo consulente.' },
        { q: 'E i documenti degli ospiti?', a: 'Sono dati personali: li trattiamo con misure conformi al GDPR e non li usiamo per altri scopi.' },
      ],
    },
    notes: {
      de: 'Unabhängiger privater Dienst, ohne Verbindung zum italienischen Tourismusministerium oder zur Polizei. Keine Steuer- oder Rechtsberatung.',
      it: 'Servizio privato indipendente, non affiliato al Ministero del Turismo né alla Polizia di Stato. Non è consulenza fiscale o legale.',
    },
    market: { de: 'Italien · IT/DE', it: 'Italia · IT/DE' },
    checkout: { provider: 'none' },
  },
  {
    number: 10,
    slug: 'ospiteguida',
    brand: 'OspiteGuida',
    category: 'immobilien-gastgewerbe',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 39, interval: 'month', vat: 'excl', unit: { de: 'je Unterkunft', it: 'per alloggio' } }],
    image: '/images/packages/10-ospiteguida-hero.jpg',
    imageAlt: {
      de: 'Entwurfsansicht von OspiteGuida mit einem mehrsprachigen Gästechat',
      it: 'Bozza di OspiteGuida con una chat multilingue per gli ospiti',
    },
    tagline: { de: 'Antworten für Ihre Gäste, in jeder Sprache.', it: 'Risposte ai tuoi ospiti, in ogni lingua.' },
    benefit: {
      de: 'KI-Gästeassistent, der Ihre Unterkunft kennt, sich als KI zu erkennen gibt und an Sie übergibt.',
      it: 'Assistente AI per gli ospiti che conosce il tuo alloggio, si dichiara come AI e ti passa la conversazione.',
    },
    headline: {
      de: 'Die Fragen Ihrer Gäste – beantwortet in jeder Sprache. Auch nachts.',
      it: 'Le domande dei tuoi ospiti, risposte in ogni lingua. Anche di notte.',
    },
    intro: {
      de: 'Ein KI-Assistent, der Ihre Unterkunft kennt: Check-in, WLAN, Parken, Tipps in der Umgebung. Wenn ein Mensch gebraucht wird, übergibt er an Sie.',
      it: 'Un assistente AI che conosce il tuo alloggio: check-in, Wi-Fi, parcheggio, consigli in zona. Quando serve una persona, passa la conversazione a te.',
    },
    audience: {
      de: 'B&B und Ferienwohnungen mit internationalen Gästen, deren Gastgeber nicht rund um die Uhr erreichbar sind.',
      it: 'B&B e case vacanza con ospiti internazionali, i cui host non sono raggiungibili a ogni ora.',
    },
    job: {
      de: 'Wiederkehrende Gästefragen sofort in der Sprache des Gastes beantworten.',
      it: 'Rispondere subito, nella lingua dell’ospite, alle domande che si ripetono.',
    },
    why: {
      de: 'Plattformübergreifend über einen Web-Link und optional WhatsApp Business, mit Übergabe an den Gastgeber und klarer KI-Kennzeichnung.',
      it: 'Funziona con qualsiasi piattaforma tramite link web e, se configurato, WhatsApp Business, con passaggio all’host e chiara indicazione dell’uso di AI.',
    },
    features: {
      de: [
        'Antwortet auf Deutsch, Italienisch, Englisch, Französisch und in weiteren Sprachen.',
        'Gibt sich immer als KI-Assistent zu erkennen, wie es das EU-Recht verlangt.',
        'Benachrichtigt Sie bei dringenden oder unbekannten Anliegen und übergibt das Gespräch.',
      ],
      it: [
        'Risponde in italiano, inglese, tedesco, francese e altre lingue.',
        'Si presenta sempre come assistente AI, come richiede la normativa europea.',
        'Ti avvisa per richieste urgenti o non previste e ti lascia la conversazione.',
      ],
    },
    plannedOffer: {
      de: 'Geplant zum Start: 14 Tage kostenlos testen. Zusammen mit OspiteInRegola 49 € zzgl. MwSt.',
      it: 'Previsto al lancio: 14 giorni di prova gratuita. Insieme a OspiteInRegola: 49 € + IVA.',
    },
    faq: {
      de: [
        { q: 'Gäste wollen mit Menschen sprechen.', a: 'Das ist jederzeit möglich: Der Gast fragt danach, und Sie werden sofort benachrichtigt.' },
        { q: 'Erfindet die KI Antworten?', a: 'Sie antwortet nur mit Ihren Angaben. Weiß sie etwas nicht, sagt sie es und benachrichtigt Sie.' },
        { q: 'Läuft das über WhatsApp?', a: 'Immer per Web-Link, über WhatsApp Business dort, wo es eingerichtet ist.' },
      ],
      it: [
        { q: 'Gli ospiti vogliono parlare con una persona.', a: 'Possono farlo sempre: basta chiederlo, e tu ricevi subito un avviso.' },
        { q: 'E se inventa una risposta?', a: 'Risponde solo con le informazioni che inserisci. Se non sa, lo dice e ti avvisa.' },
        { q: 'Funziona su WhatsApp?', a: 'Sempre tramite link web; tramite WhatsApp Business dove configurato.' },
      ],
    },
    notes: {
      de: 'Gäste werden informiert, dass sie mit einem KI-System sprechen (Verordnung (EU) 2024/1689, Art. 50).',
      it: 'Gli ospiti vengono informati che stanno parlando con un sistema di intelligenza artificiale (Regolamento UE 2024/1689, art. 50).',
    },
    market: { de: 'Italien · für Gäste mehrsprachig', it: 'Italia · multilingue per gli ospiti' },
    checkout: { provider: 'none' },
  },
  ...neuePakete,
  ...(autoPakete as unknown as Package[]).map((p) => ({ ...p, image: `/images/packages/${String(p.number).padStart(2, '0')}-${p.slug}-vorschau.jpg`, checkout: { provider: 'none' as const } })),
];

/* ---------- Bündel ---------- */

export interface Bundle {
  slug: string;
  /** Slugs der enthaltenen Pakete */
  includes: string[];
  title: L10n;
  text: L10n;
  /** fehlt = Preis wird vor Start festgelegt */
  price?: Price;
  status: PackageStatus;
  /** auf der Startseite zeigen */
  featured?: boolean;
}

export const bundles: Bundle[] = [
  {
    slug: 'gastgeber-komplett',
    includes: ['ospiteinregola', 'ospiteguida'],
    title: { de: 'Gastgeber komplett', it: 'Ospitalità completa' },
    text: {
      de: 'Pflichten im Griff und Gästefragen beantwortet: OspiteInRegola und OspiteGuida für eine Unterkunft.',
      it: 'Obblighi sotto controllo e domande degli ospiti con risposta: OspiteInRegola e OspiteGuida per un alloggio.',
    },
    price: { amount: 49, interval: 'month', vat: 'excl', unit: { de: 'je Unterkunft', it: 'per alloggio' } },
    status: 'waitlist',
    featured: true,
  },
  {
    slug: 'website-und-wartung',
    includes: ['sitotranquillo', 'sitocura'],
    title: { de: 'Website und Wartung', it: 'Sito e manutenzione' },
    text: {
      de: 'Für Betriebe mit mehreren Auftritten: neue Hauptseite im Abo und Wartung einer bestehenden WordPress-Seite.',
      it: 'Per attività con più siti: nuovo sito principale in abbonamento e manutenzione di un sito WordPress esistente.',
    },
    status: 'inquiry',
    featured: true,
  },
  {
    slug: 'auftraege-und-foerderung',
    includes: ['gareinbreve', 'bandiinbreve'],
    title: { de: 'Aufträge und Förderung', it: 'Appalti e incentivi' },
    text: {
      de: 'Öffentliche Ausschreibungen und Förderprogramme in einem Überblick, mit gemeinsamen Filtern.',
      it: 'Gare pubbliche e bandi in un’unica panoramica, con filtri comuni.',
    },
    status: 'waitlist',
    featured: true,
  },
  {
    slug: 'sichtbar-vor-ort',
    includes: ['replicapro', 'sitotranquillo'],
    title: { de: 'Sichtbar vor Ort', it: 'Visibili sul territorio' },
    text: {
      de: 'Gepflegte Website und beantwortete Bewertungen für Gastronomie, Läden und Unterkünfte.',
      it: 'Sito curato e recensioni con risposta per ristorazione, negozi e strutture ricettive.',
    },
    status: 'inquiry',
  },
  {
    slug: 'buero-starter',
    includes: ['betriebsautopilot', 'vermieterkiste'],
    title: { de: 'Büro-Starter', it: 'Ufficio in ordine' },
    text: {
      de: 'Kurs und Vorlagen zusammen: KI sinnvoll nutzen und Angebote, Rechnungen und Belegung ordentlich führen.',
      it: 'Corso e modelli insieme: usare l’AI con criterio e tenere in ordine preventivi, fatture e prenotazioni.',
    },
    status: 'soon',
  },
];

/* ---------- Hilfsfunktionen ---------- */

export const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
export const packagesSorted = () => [...packages].sort((a, b) => a.number - b.number);
const statusRang: Record<PackageStatus, number> = { available: 0, inquiry: 1, waitlist: 2, soon: 3 };
/** Geordnete Liste für Übersichten: Kategorie in Katalogreihenfolge, darin Status, dann Nummer. */
export const packagesGeordnet = () => [...packages].sort((a, b) =>
  categories.findIndex((c) => c.id === a.category) - categories.findIndex((c) => c.id === b.category)
  || statusRang[a.status] - statusRang[b.status] || a.number - b.number);
export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;
export const packagesOfKind = (kind: OfferKind) => packagesSorted().filter((p) => p.kind === kind);

/** Zählwerte für die Startseite – immer aus den echten Paketdaten, nie fest eingetragen. */
export function catalogStats() {
  const all = packages;
  return {
    total: all.length,
    servicesInquiry: all.filter((p) => p.kind === 'service' && p.status === 'inquiry').length,
    productsWaitlist: all.filter((p) => p.kind === 'product' && p.status === 'waitlist').length,
    planned: all.filter((p) => p.status === 'soon').length,
  };
}

/** true nur, wenn wirklich ein Kauf-Link existiert */
export const isPurchasable = (p: Package) =>
  p.status === 'available' && p.cta === 'checkout' && !!p.checkout && p.checkout.provider !== 'none' && !!p.checkout.url;
