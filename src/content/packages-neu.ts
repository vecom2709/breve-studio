/**
 * Neue Pakete (Stand 11.11.2026) – ergänzen den Katalog um Gastronomie, lokale Sichtbarkeit,
 * Terminbuchung, Social Media und Event-Seiten. Jede Vorschau zeigt Beispieldaten
 * (src/components/vorschau/), die Kartenbilder sind Aufnahmen dieser Vorschauen.
 */
import type { Package } from './packages';

export const neuePakete: Package[] = [
  {
    number: 11,
    slug: 'menuvivo',
    brand: 'MenuVivo',
    category: 'immobilien-gastgewerbe',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 15, interval: 'month', vat: 'excl', unit: { de: 'je Lokal', it: 'per locale' } }],
    image: '/images/packages/11-menuvivo-hero.jpg',
    imageAlt: { de: 'Vorschau von MenuVivo: digitale Speisekarte mit Sprachwahl und Allergenen', it: 'Anteprima di MenuVivo: menù digitale con scelta della lingua e allergeni' },
    tagline: { de: 'Die Speisekarte, die mitdenkt.', it: 'Il menù che si aggiorna da solo.' },
    benefit: {
      de: 'Digitale Speisekarte per QR-Code in Deutsch, Italienisch und Englisch – mit gekennzeichneten Allergenen und Preisen, die Sie selbst ändern.',
      it: 'Menù digitale con QR code in italiano, tedesco e inglese – con allergeni indicati e prezzi che modifichi tu.',
    },
    headline: {
      de: 'Ihre Speisekarte auf jedem Handy – dreisprachig, aktuell, ohne Nachdruck.',
      it: 'Il tuo menù su ogni telefono – in tre lingue, sempre aggiornato, senza ristampe.',
    },
    intro: {
      de: 'Gäste scannen den QR-Code am Tisch und sehen die Karte in ihrer Sprache. Tagesgerichte, Preise und ausverkaufte Speisen ändern Sie in einer Minute selbst – ohne App und ohne Druckerei.',
      it: 'Gli ospiti inquadrano il QR code al tavolo e leggono il menù nella loro lingua. Piatti del giorno, prezzi e piatti esauriti li cambi tu in un minuto – senza app e senza tipografia.',
    },
    audience: {
      de: 'Restaurants, Bars, Pizzerien und Agriturismi mit Gästen aus dem In- und Ausland.',
      it: 'Ristoranti, bar, pizzerie e agriturismi con clienti italiani e stranieri.',
    },
    job: {
      de: 'Eine immer aktuelle, mehrsprachige Karte anbieten und die 14 Hauptallergene korrekt ausweisen.',
      it: 'Offrire un menù sempre aggiornato e multilingue e indicare correttamente i 14 allergeni principali.',
    },
    why: {
      de: 'Allergene nach Verordnung (EU) Nr. 1169/2011 als Symbole und Text, Übersetzungen von Menschen geprüft, keine Werbung und kein Tracking auf der Karte.',
      it: 'Allergeni secondo il Regolamento (UE) n. 1169/2011 con simboli e testo, traduzioni controllate da persone, nessuna pubblicità e nessun tracciamento sul menù.',
    },
    features: {
      de: [
        'Karte in Deutsch, Italienisch und Englisch, Sprache wählt der Gast.',
        'Die 14 Hauptallergene je Gericht als Symbol mit Erklärung.',
        'Tagesgerichte und „ausverkauft“ in Sekunden selbst setzen.',
        'QR-Code-Aufsteller für die Tische als Druckvorlage.',
      ],
      it: [
        'Menù in italiano, tedesco e inglese, la lingua la sceglie l’ospite.',
        'I 14 allergeni principali per ogni piatto, con simbolo e spiegazione.',
        'Piatti del giorno ed “esaurito” impostati da te in pochi secondi.',
        'Segnatavolo con QR code pronto da stampare.',
      ],
    },
    plannedOffer: { de: 'Geplant zum Start: Übernahme Ihrer bestehenden Karte inklusive.', it: 'Previsto al lancio: inseriamo noi il tuo menù attuale, incluso nel prezzo.' },
    faq: {
      de: [
        { q: 'Brauchen meine Gäste eine App?', a: 'Nein. Die Karte öffnet sich direkt im Browser des Handys.' },
        { q: 'Ersetzt das die gedruckte Allergenliste?', a: 'Sie hilft, die Angaben vollständig bereitzustellen. Die Verantwortung für richtige Angaben bleibt beim Betrieb; eine gedruckte Fassung auf Nachfrage empfehlen wir weiterhin.' },
        { q: 'Kann ich Fotos zeigen?', a: 'Ja, pro Gericht ein Foto ist vorgesehen.' },
      ],
      it: [
        { q: 'I miei clienti devono scaricare un’app?', a: 'No. Il menù si apre direttamente nel browser del telefono.' },
        { q: 'Sostituisce l’elenco cartaceo degli allergeni?', a: 'Aiuta a fornire le informazioni in modo completo. La responsabilità della correttezza resta del locale; consigliamo comunque una copia cartacea su richiesta.' },
        { q: 'Posso mostrare le foto dei piatti?', a: 'Sì, è prevista una foto per ogni piatto.' },
      ],
    },
    notes: { de: 'In Entwicklung. Vormerken ist unverbindlich und kostenlos.', it: 'In sviluppo. La prenotazione è gratuita e senza impegno.' },
    market: { de: 'Italien · Gäste mehrsprachig', it: 'Italia · ospiti multilingue' },
    checkout: { provider: 'none' },
  },
  {
    number: 12,
    slug: 'mappaviva',
    brand: 'MappaViva',
    category: 'website-sichtbarkeit',
    kind: 'service',
    shopCategory: 'marketing',
    status: 'inquiry',
    cta: 'inquiry',
    prices: [{ amount: 29, interval: 'month', vat: 'excl', unit: { de: 'je Standort', it: 'per sede' } }],
    image: '/images/packages/12-mappaviva-hero.jpg',
    imageAlt: { de: 'Vorschau von MappaViva: gepflegtes Unternehmensprofil mit Öffnungszeiten und Beiträgen', it: 'Anteprima di MappaViva: profilo dell’attività curato con orari e post' },
    tagline: { de: 'Gefunden werden, wo gesucht wird.', it: 'Farsi trovare dove si cerca.' },
    benefit: {
      de: 'Wir pflegen Ihr Unternehmensprofil auf Google Maps: Öffnungszeiten, Feiertage, Fotos, Beiträge und Antworten auf Fragen.',
      it: 'Curiamo il tuo profilo dell’attività su Google Maps: orari, festivi, foto, post e risposte alle domande.',
    },
    headline: {
      de: 'Ihr Eintrag auf der Karte – richtig, aktuell und gepflegt.',
      it: 'La tua scheda sulla mappa – corretta, aggiornata e curata.',
    },
    intro: {
      de: 'Viele Kunden sehen zuerst Ihren Karteneintrag, nicht Ihre Website. Falsche Öffnungszeiten oder alte Fotos kosten Besuche. Wir halten das Profil jeden Monat aktuell und berichten verständlich, was sich getan hat.',
      it: 'Molti clienti vedono prima la tua scheda sulla mappa, non il tuo sito. Orari sbagliati o foto vecchie fanno perdere visite. Teniamo il profilo aggiornato ogni mese e ti diciamo in modo chiaro cosa è cambiato.',
    },
    audience: { de: 'Läden, Gastronomie, Handwerk und Praxen mit festem Standort.', it: 'Negozi, ristoranti, artigiani e studi con una sede fissa.' },
    job: { de: 'Auf der Karte richtig dargestellt werden, ohne sich selbst darum kümmern zu müssen.', it: 'Essere presentati bene sulla mappa senza doversene occupare.' },
    why: {
      de: 'Feste Monatsleistung, Feiertage in Italien und Deutschland im Blick, keine Bewertungs-Tricks: Wir fragen keine Bewertungen gezielt ab und kaufen keine.',
      it: 'Prestazione mensile fissa, festività italiane e tedesche sotto controllo, nessun trucco sulle recensioni: non le selezioniamo e non le compriamo.',
    },
    features: {
      de: ['Öffnungs- und Feiertagszeiten immer aktuell.', 'Zwei Beiträge und neue Fotos pro Monat.', 'Antworten auf Fragen von Kunden im Profil.', 'Monatsbericht: Aufrufe, Anrufe, Routenanfragen.'],
      it: ['Orari e festività sempre aggiornati.', 'Due post e nuove foto al mese.', 'Risposte alle domande dei clienti nella scheda.', 'Report mensile: visualizzazioni, chiamate, indicazioni stradali.'],
    },
    plannedOffer: { de: 'Zum Start: kostenloser Profil-Check mit Liste der wichtigsten Lücken.', it: 'Al lancio: controllo gratuito del profilo con l’elenco delle lacune principali.' },
    faq: {
      de: [
        { q: 'Brauchen Sie mein Passwort?', a: 'Nein. Sie geben uns im Profil eine Verwalter-Rolle, die Sie jederzeit entziehen können.' },
        { q: 'Antworten Sie auch auf Bewertungen?', a: 'Dafür gibt es ReplicaPro. Beide lassen sich kombinieren.' },
      ],
      it: [
        { q: 'Vi serve la mia password?', a: 'No. Ci assegni un ruolo di gestore nel profilo, che puoi revocare in qualsiasi momento.' },
        { q: 'Rispondete anche alle recensioni?', a: 'Per quello c’è ReplicaPro. I due servizi si possono combinare.' },
      ],
    },
    notes: { de: 'Google und Google Maps sind Marken der Google LLC; MappaViva ist ein unabhängiger Dienst.', it: 'Google e Google Maps sono marchi di Google LLC; MappaViva è un servizio indipendente.' },
    market: { de: 'Italien und deutschsprachiger Raum', it: 'Italia e Paesi di lingua tedesca' },
    checkout: { provider: 'none' },
  },
  {
    number: 13,
    slug: 'agendabreve',
    brand: 'AgendaBreve',
    category: 'website-sichtbarkeit',
    kind: 'product',
    shopCategory: 'web-business',
    status: 'waitlist',
    cta: 'interest',
    prices: [{ amount: 19, interval: 'month', vat: 'excl', unit: { de: 'je Betrieb', it: 'per attività' } }],
    image: '/images/packages/13-agendabreve-hero.jpg',
    imageAlt: { de: 'Vorschau von AgendaBreve: Terminbuchung mit freien Zeiten', it: 'Anteprima di AgendaBreve: prenotazione con orari liberi' },
    tagline: { de: 'Termine buchen, während Sie arbeiten.', it: 'Prenotazioni anche mentre lavori.' },
    benefit: {
      de: 'Online-Terminbuchung für Salon, Praxis oder Werkstatt – mit Bestätigung, Erinnerung und ohne Provision pro Buchung.',
      it: 'Prenotazione online per salone, studio o officina – con conferma, promemoria e senza commissioni per prenotazione.',
    },
    headline: {
      de: 'Kunden buchen freie Zeiten selbst – rund um die Uhr, ohne Anruf.',
      it: 'I clienti prenotano da soli gli orari liberi – a qualsiasi ora, senza telefonare.',
    },
    intro: {
      de: 'Sie legen Leistungen, Dauer und Öffnungszeiten fest. Kunden wählen auf Ihrer Website oder per Link eine freie Zeit, bekommen eine Bestätigung und am Vortag eine Erinnerung. Weniger Telefon, weniger vergessene Termine.',
      it: 'Imposti servizi, durata e orari. I clienti scelgono un orario libero sul tuo sito o tramite link, ricevono una conferma e un promemoria il giorno prima. Meno telefonate, meno appuntamenti dimenticati.',
    },
    audience: { de: 'Friseure, Kosmetik, Physiotherapie, Werkstätten und Beratung.', it: 'Parrucchieri, estetica, fisioterapia, officine e consulenza.' },
    job: { de: 'Termine annehmen, ohne ständig ans Telefon zu müssen.', it: 'Ricevere appuntamenti senza dover rispondere sempre al telefono.' },
    why: {
      de: 'Feste Monatsgebühr statt Provision, Daten auf Servern in der EU, Buchungsseite in Deutsch und Italienisch, Kalender-Abgleich mit Google, Apple und Outlook.',
      it: 'Canone fisso invece di commissioni, dati su server nell’UE, pagina di prenotazione in italiano e tedesco, sincronizzazione con Google, Apple e Outlook.',
    },
    features: {
      de: ['Freie Zeiten nach Leistung und Dauer.', 'Bestätigung und Erinnerung per E-Mail.', 'Absagen und Verschieben per Link durch den Kunden.', 'Einbindung als Knopf auf Ihrer Website.'],
      it: ['Orari liberi in base a servizio e durata.', 'Conferma e promemoria via e-mail.', 'Disdetta e spostamento tramite link da parte del cliente.', 'Integrazione come pulsante sul tuo sito.'],
    },
    plannedOffer: { de: 'Geplant zum Start: Einrichtung Ihrer Leistungen durch uns.', it: 'Previsto al lancio: configuriamo noi i tuoi servizi.' },
    faq: {
      de: [
        { q: 'Kostet jede Buchung extra?', a: 'Nein. Es gibt nur die feste Monatsgebühr.' },
        { q: 'Gehen auch Erinnerungen per WhatsApp?', a: 'Geplant als Erweiterung; zum Start erinnern wir per E-Mail.' },
      ],
      it: [
        { q: 'Ogni prenotazione costa di più?', a: 'No. C’è solo il canone mensile fisso.' },
        { q: 'I promemoria arrivano anche su WhatsApp?', a: 'È prevista come estensione; al lancio i promemoria arrivano via e-mail.' },
      ],
    },
    notes: { de: 'In Entwicklung. Vormerken ist unverbindlich und kostenlos.', it: 'In sviluppo. La prenotazione è gratuita e senza impegno.' },
    market: { de: 'Italien und deutschsprachiger Raum', it: 'Italia e Paesi di lingua tedesca' },
    checkout: { provider: 'none' },
  },
  {
    number: 14,
    slug: 'socialsettimana',
    brand: 'SocialSettimana',
    category: 'website-sichtbarkeit',
    kind: 'service',
    shopCategory: 'marketing',
    status: 'inquiry',
    cta: 'inquiry',
    prices: [{ amount: 149, interval: 'month', vat: 'excl' }],
    image: '/images/packages/14-socialsettimana-hero.jpg',
    imageAlt: { de: 'Vorschau von SocialSettimana: Wochenplan mit drei Beiträgen zur Freigabe', it: 'Anteprima di SocialSettimana: piano settimanale con tre post da approvare' },
    tagline: { de: 'Jede Woche präsent. Ohne Stress.', it: 'Presenti ogni settimana. Senza stress.' },
    benefit: {
      de: 'Drei Beiträge pro Woche für Instagram und Facebook aus Ihren Fotos – zweisprachig, mit Redaktionsplan zur Freigabe.',
      it: 'Tre post a settimana per Instagram e Facebook dalle tue foto – in due lingue, con un piano editoriale da approvare.',
    },
    headline: {
      de: 'Ihre Social-Media-Woche – geplant, geschrieben und zur Freigabe bereit.',
      it: 'La tua settimana sui social – pianificata, scritta e pronta da approvare.',
    },
    intro: {
      de: 'Sie schicken uns Fotos per WhatsApp oder E-Mail. Wir schreiben daraus drei Beiträge pro Woche auf Deutsch und Italienisch, legen sie in einen Wochenplan und veröffentlichen erst nach Ihrem Okay.',
      it: 'Ci mandi le foto via WhatsApp o e-mail. Noi scriviamo tre post a settimana in italiano e tedesco, li mettiamo in un piano settimanale e pubblichiamo solo dopo il tuo ok.',
    },
    audience: { de: 'Betriebe, die sichtbar sein wollen, aber keine Zeit für tägliches Posten haben.', it: 'Attività che vogliono essere visibili ma non hanno tempo per pubblicare ogni giorno.' },
    job: { de: 'Regelmäßig und passend posten, ohne selbst Texte zu schreiben.', it: 'Pubblicare con regolarità e in modo adatto, senza scrivere i testi.' },
    why: {
      de: 'Echte Texte statt Floskeln, Ihre eigenen Fotos statt Stockbilder, keine gekauften Follower und keine Automatik ohne Ihre Freigabe.',
      it: 'Testi veri invece di frasi fatte, le tue foto invece di immagini di repertorio, nessun follower comprato e nessuna pubblicazione senza il tuo ok.',
    },
    features: {
      de: ['3 Beiträge pro Woche (Mo · Mi · Fr).', 'Texte auf Deutsch und Italienisch mit passenden Hashtags.', 'Wochenplan zur Freigabe per Link.', 'Monatsrückblick: Reichweite und beliebteste Beiträge.'],
      it: ['3 post a settimana (lun · mer · ven).', 'Testi in italiano e tedesco con hashtag adatti.', 'Piano settimanale da approvare tramite link.', 'Resoconto mensile: copertura e post più apprezzati.'],
    },
    plannedOffer: { de: 'Erster Monat mit kostenlosem Profil-Feinschliff (Bio, Highlights, Link).', it: 'Primo mese con ritocco gratuito del profilo (bio, highlight, link).' },
    faq: {
      de: [
        { q: 'Muss ich selbst Fotos machen?', a: 'Ja, echte Bilder aus Ihrem Betrieb wirken am besten. Wir sagen Ihnen, welche Motive gut funktionieren.' },
        { q: 'Antworten Sie auch auf Kommentare?', a: 'Auf Wunsch gegen Aufpreis; im Grundpaket sind Beiträge und Planung enthalten.' },
      ],
      it: [
        { q: 'Devo fare io le foto?', a: 'Sì, le immagini vere della tua attività funzionano meglio. Ti diciamo quali soggetti rendono di più.' },
        { q: 'Rispondete anche ai commenti?', a: 'Su richiesta, con un supplemento; il pacchetto base comprende post e pianificazione.' },
      ],
    },
    notes: { de: 'Instagram und Facebook sind Marken der Meta Platforms, Inc.; SocialSettimana ist ein unabhängiger Dienst.', it: 'Instagram e Facebook sono marchi di Meta Platforms, Inc.; SocialSettimana è un servizio indipendente.' },
    market: { de: 'Italien und deutschsprachiger Raum', it: 'Italia e Paesi di lingua tedesca' },
    checkout: { provider: 'none' },
  },
  {
    number: 15,
    slug: 'eventolampo',
    brand: 'EventoLampo',
    category: 'website-sichtbarkeit',
    kind: 'service',
    shopCategory: 'design-media',
    status: 'inquiry',
    cta: 'inquiry',
    prices: [{ amount: 249, interval: 'once', vat: 'excl', unit: { de: 'je Event', it: 'per evento' } }],
    image: '/images/packages/15-eventolampo-hero.jpg',
    imageAlt: { de: 'Vorschau von EventoLampo: Event-Seite mit Countdown und Anmeldung', it: 'Anteprima di EventoLampo: pagina evento con conto alla rovescia e iscrizione' },
    tagline: { de: 'Ihr Event online – in 48 Stunden.', it: 'Il tuo evento online – in 48 ore.' },
    benefit: {
      de: 'Eigene Event-Seite für Eröffnung, Fest, Hochzeit oder Sagra – mit Programm, Anfahrt, Countdown und Anmeldung, fertig in 48 Stunden.',
      it: 'Una pagina dedicata per inaugurazione, festa, matrimonio o sagra – con programma, indicazioni, conto alla rovescia e iscrizione, pronta in 48 ore.',
    },
    headline: {
      de: 'Eine Seite, ein Link, alle Infos – für Ihr nächstes Event.',
      it: 'Una pagina, un link, tutte le informazioni – per il tuo prossimo evento.',
    },
    intro: {
      de: 'Statt verstreuter Nachrichten teilen Sie einen einzigen Link: Datum, Programm, Ort mit Anfahrt, Fotos und ein Anmeldeformular. Zweisprachig, für jedes Handy gemacht und bis drei Monate nach dem Event online.',
      it: 'Invece di tanti messaggi sparsi condividi un solo link: data, programma, luogo con indicazioni, foto e modulo di iscrizione. In due lingue, pensata per ogni telefono e online fino a tre mesi dopo l’evento.',
    },
    audience: { de: 'Gastronomie, Vereine, Gemeinden, Brautpaare und Betriebe mit Eröffnungen oder Aktionen.', it: 'Locali, associazioni, comuni, sposi e attività con inaugurazioni o promozioni.' },
    job: { de: 'Gäste informieren und Anmeldungen sammeln, ohne eine ganze Website zu bauen.', it: 'Informare gli ospiti e raccogliere iscrizioni senza costruire un intero sito.' },
    why: {
      de: 'Festpreis, fertig in 48 Stunden nach Erhalt der Inhalte, Anmeldungen datensparsam und nach dem Event gelöscht, Teilen-Bild für WhatsApp inklusive.',
      it: 'Prezzo fisso, pronta in 48 ore dal ricevimento dei contenuti, iscrizioni raccolte con pochi dati e cancellate dopo l’evento, immagine per WhatsApp inclusa.',
    },
    features: {
      de: ['Programm, Ort mit Karte und Anfahrt.', 'Countdown bis zum Beginn.', 'Anmeldung mit Personenzahl, Liste als Tabelle.', 'Vorschaubild zum Teilen in WhatsApp und Social Media.'],
      it: ['Programma, luogo con mappa e indicazioni.', 'Conto alla rovescia fino all’inizio.', 'Iscrizione con numero di persone, elenco in tabella.', 'Immagine di anteprima per WhatsApp e social.'],
    },
    plannedOffer: { de: 'Eigene Adresse (z. B. sommerfest-ihrname.it) auf Wunsch zum Selbstkostenpreis.', it: 'Indirizzo dedicato (es. festa-tuonome.it) su richiesta al costo.' },
    faq: {
      de: [
        { q: 'Was brauchen Sie von mir?', a: 'Datum, Ort, Programm, ein paar Fotos und Ihr Logo – per Formular oder WhatsApp.' },
        { q: 'Was passiert nach dem Event?', a: 'Die Seite bleibt drei Monate online, zum Beispiel für Fotos. Anmeldedaten löschen wir nach dem Event.' },
      ],
      it: [
        { q: 'Cosa vi serve da me?', a: 'Data, luogo, programma, qualche foto e il tuo logo – tramite modulo o WhatsApp.' },
        { q: 'Cosa succede dopo l’evento?', a: 'La pagina resta online tre mesi, ad esempio per le foto. I dati delle iscrizioni li cancelliamo dopo l’evento.' },
      ],
    },
    notes: { de: 'Leistung beginnt erst nach dem offiziellen Start.', it: 'Il servizio inizierà solo dopo l’avvio ufficiale.' },
    market: { de: 'Italien und deutschsprachiger Raum', it: 'Italia e Paesi di lingua tedesca' },
    checkout: { provider: 'none' },
  },
];
