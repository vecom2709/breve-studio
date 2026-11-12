/**
 * Texte der Startseite (Hero, Stand-Panel, Vorteilsleiste, Lösungs-Karten, App-Hinweis).
 * Zahlen im Stand-Panel kommen NICHT von hier, sondern live aus `catalogStats()` in packages.ts.
 */
import type { Locale } from './packages';
import type { IconName } from '../components/Icon.astro';

type L<T> = Record<Locale, T>;

export const homeHero: L<{ eyebrow: string; h1a: string[]; h1b: string; ctaPrimary: string; ctaSecondary: string }> = {
  de: {
    eyebrow: 'Digitalstudio · Aragona, Sizilien',
    h1a: ['Klare digitale', 'Pakete für Betriebe\u00A0–'],
    h1b: 'ohne Ballast.',
    ctaPrimary: 'Pakete ansehen',
    ctaSecondary: 'Kontakt aufnehmen',
  },
  it: {
    eyebrow: 'Studio digitale · Aragona, Sicilia',
    h1a: ['Pacchetti digitali chiari', 'per la tua attività\u00A0–'],
    h1b: 'senza zavorra.',
    ctaPrimary: 'Vedi i pacchetti',
    ctaSecondary: 'Contattaci',
  },
};

export const statusPanel: L<{ title: string; total: string; available: string; services: string; products: string; planned: string; note: string }> = {
  de: {
    title: 'Stand heute',
    total: 'Pakete im Katalog',
    available: 'fertig entwickelt, Verkauf ab Start',
    services: 'Dienstleistungen auf Anfrage',
    products: 'Produkte mit Warteliste',
    planned: 'Pakete in Planung',
    note: 'Studio Breve befindet sich im Aufbau. Verkauft wird ab dem offiziellen Start; bis dahin können Sie sich unverbindlich vormerken oder anfragen – auch für Pakete, die schon fertig entwickelt sind.',
  },
  it: {
    title: 'Stato attuale',
    total: 'Pacchetti in catalogo',
    available: 'pronti, in vendita dall’avvio',
    services: 'Servizi su richiesta',
    products: 'Prodotti con lista d’attesa',
    planned: 'Pacchetti in programma',
    note: 'Studio Breve è in fase di avvio. La vendita parte con l’avvio ufficiale; fino ad allora puoi prenotarti o chiedere informazioni senza impegno – anche per i pacchetti già pronti.',
  },
};

export const trustBar: L<{ icon: IconName; title: string; text: string }[]> = {
  de: [
    { icon: 'shield', title: 'Klar & transparent', text: 'Feste Preise, ehrlicher Stand' },
    { icon: 'zap', title: 'Kleine, wirksame Pakete', text: 'Schnell einsetzbar' },
    { icon: 'award', title: 'Für Betriebe in Italien & DE', text: 'Praxisnah und zuverlässig' },
    { icon: 'refresh', title: 'Im kontinuierlichen Ausbau', text: 'Neue Produkte, kurze Wege' },
  ],
  it: [
    { icon: 'shield', title: 'Chiaro e trasparente', text: 'Prezzi fissi, stato onesto' },
    { icon: 'zap', title: 'Pacchetti piccoli ed efficaci', text: 'Subito operativi' },
    { icon: 'award', title: 'Per attività in Italia e DE', text: 'Pratici e affidabili' },
    { icon: 'refresh', title: 'In continua crescita', text: 'Nuovi prodotti, percorsi brevi' },
  ],
};

export const solutionsHead: L<{ eyebrow: string; title: string; lead: string }> = {
  de: {
    eyebrow: 'Unsere Pakete & Produkte',
    title: 'Digitale Lösungen für dein Business',
    lead: 'Kompakte, praxisnahe Pakete und digitale Produkte – klar, verständlich und auf den Punkt.',
  },
  it: {
    eyebrow: 'I nostri pacchetti e prodotti',
    title: 'Soluzioni digitali per la tua attività',
    lead: 'Pacchetti compatti e prodotti digitali pratici – chiari, comprensibili e al punto.',
  },
};

/** Ziel je Karte: `route` + optional `slug` (Paketseite). */
export const solutionCards: {
  id: string;
  icon: IconName;
  image: string;
  route: 'package' | 'services' | 'products';
  slug?: string;
  text: L<{ title: string; body: string; cta: string; alt: string }>;
}[] = [
  {
    id: 'website',
    icon: 'globe',
    image: '/images/home/karte-website',
    route: 'package',
    slug: 'sitotranquillo',
    text: {
      de: { title: 'Website-Paket', body: 'Deine professionelle Website – modern, übersichtlich und auf dein Geschäft abgestimmt.', cta: 'Zum Paket', alt: 'Laptop mit einer hellen Website auf einem Holztisch zwischen Pflanzen' },
      it: { title: 'Pacchetto sito web', body: 'Il tuo sito professionale – moderno, ordinato e su misura per la tua attività.', cta: 'Vai al pacchetto', alt: 'Portatile con un sito luminoso su un tavolo di legno tra le piante' },
    },
  },
  {
    id: 'dienst',
    icon: 'cog',
    image: '/images/home/karte-dienst',
    route: 'services',
    text: {
      de: { title: 'Dienstleistung', body: 'Individuelle digitale Leistungen auf Anfrage – flexibel, zielgerichtet und effizient.', cta: 'Details anfragen', alt: 'Ineinandergreifende Zahnräder in Petrol und Türkis' },
      it: { title: 'Servizio', body: 'Servizi digitali su misura, su richiesta – flessibili, mirati ed efficienti.', cta: 'Chiedi dettagli', alt: 'Ingranaggi intrecciati in toni petrolio e turchese' },
    },
  },
  {
    id: 'produkt',
    icon: 'package',
    image: '/images/home/karte-produkt',
    route: 'products',
    text: {
      de: { title: 'Digitales Produkt', body: 'Nützliche digitale Produkte für deinen Betrieb – sofort einsetzbar und mit Mehrwert.', cta: 'Produkte entdecken', alt: 'Leuchtende Produktschachtel über einer Platine' },
      it: { title: 'Prodotto digitale', body: 'Prodotti digitali utili per la tua attività – pronti all’uso e con valore aggiunto.', cta: 'Scopri i prodotti', alt: 'Scatola luminosa sopra un circuito' },
    },
  },
  {
    id: 'alarm',
    icon: 'bell',
    image: '/images/home/karte-alarm',
    route: 'package',
    slug: 'gareinbreve',
    text: {
      de: { title: 'Ausschreibungs-Alarm', body: 'Relevante Ausschreibungen automatisch finden und keine Chance mehr verpassen.', cta: 'Mehr erfahren', alt: 'Laptop mit leuchtender Glocke auf dem Bildschirm' },
      it: { title: 'Avviso gare', body: 'Trova in automatico le gare rilevanti e non perdere più nessuna occasione.', cta: 'Scopri di più', alt: 'Portatile con una campanella luminosa sullo schermo' },
    },
  },
];

export const appTeaser: L<{ eyebrow: string; title: string; body: string; points: string[]; cta: string; alt: string }> = {
  de: {
    eyebrow: 'App-Version',
    title: 'Studio Breve als App auf dem Handy',
    body: 'Die Website lässt sich wie eine App auf den Startbildschirm legen – direkt aus dem Browser, ohne App-Store und ohne Tracking-Cookies.',
    points: ['Eigenes Symbol auf dem Startbildschirm', 'Startet im Vollbild wie eine App', 'Deutsch und Italienisch'],
    cta: 'App-Version installieren',
    alt: 'Smartphone mit der Startseite von Studio Breve',
  },
  it: {
    eyebrow: 'Versione app',
    title: 'Studio Breve come app sul telefono',
    body: 'Puoi aggiungere il sito alla schermata Home come un’app – direttamente dal browser, senza app store e senza cookie di tracciamento.',
    points: ['Icona propria nella schermata Home', 'Si apre a schermo intero come un’app', 'In italiano e tedesco'],
    cta: 'Installa la versione app',
    alt: 'Smartphone con la pagina iniziale di Studio Breve',
  },
};
