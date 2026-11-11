/**
 * „So läuft es ab“ – drei Schritte je Paket, damit Kunden sofort sehen, was sie tun müssen und was sie bekommen.
 */
import type { L10n } from './packages';

export const ablauf: Record<string, L10n<string[]>> = {
  gareinbreve: {
    de: ['Sie nennen Branchen (CPV), Provinzen und Auftragswerte.', 'Wir prüfen täglich ANAC und TED und filtern nach Ihrem Profil.', 'Jeden Morgen kommt eine E-Mail mit Kurzfassung, Frist und Link zur Bekanntmachung.'],
    it: ['Indichi settori (CPV), province e importi.', 'Controlliamo ogni giorno ANAC e TED e filtriamo per il tuo profilo.', 'Ogni mattina ricevi un’e-mail con sintesi, scadenza e link al bando.'],
  },
  immotesto: {
    de: ['Sie geben die Objektdaten ein oder laden das Datenblatt hoch.', 'Sie erhalten Texte auf Deutsch, Italienisch und Englisch, fehlende Pflichtangaben sind markiert.', 'Sie lesen, ändern bei Bedarf und geben frei – der Text gehört Ihnen.'],
    it: ['Inserisci i dati dell’immobile o carichi la scheda.', 'Ricevi i testi in italiano, tedesco e inglese, con i dati obbligatori mancanti segnalati.', 'Leggi, modifichi se serve e approvi – il testo è tuo.'],
  },
  replicapro: {
    de: ['Sie verbinden Ihr Unternehmensprofil einmalig.', 'Zu jeder neuen Bewertung entsteht ein Entwurf in der Sprache des Gastes.', 'Sie geben frei oder ändern – nichts wird ohne Sie veröffentlicht.'],
    it: ['Colleghi una sola volta il profilo della tua attività.', 'Per ogni nuova recensione prepariamo una bozza nella lingua dell’ospite.', 'Approvi o modifichi – nulla viene pubblicato senza di te.'],
  },
  betriebsautopilot: {
    de: ['Sie schauen kurze Module am Beispiel eines echten Handwerksbetriebs.', 'Sie übernehmen Vorlagen und Arbeitsanweisungen direkt in Ihren Alltag.', 'Mit der Datenschutz-Ampel wissen Sie, was in KI-Werkzeuge darf.'],
    it: ['Guardi brevi moduli sull’esempio di una vera impresa artigiana.', 'Porti modelli e istruzioni direttamente nel tuo lavoro quotidiano.', 'Con il semaforo privacy sai cosa si può dare agli strumenti di IA.'],
  },
  vermieterkiste: {
    de: ['Sie kaufen einmal und kopieren die Vorlagen in Ihr Google- oder Notion-Konto.', 'Sie tragen Buchungen ein – Belegung und Kurtaxe rechnen sich selbst.', 'Angebote und Rechnungen entstehen aus denselben Daten.'],
    it: ['Acquisti una volta e copi i modelli nel tuo account Google o Notion.', 'Inserisci le prenotazioni – occupazione e tassa di soggiorno si calcolano da sole.', 'Preventivi e fatture nascono dagli stessi dati.'],
  },
  sitotranquillo: {
    de: ['Kurzes Gespräch: Was soll Ihre Website können, welche Fotos und Texte gibt es?', 'Wir bauen und veröffentlichen die Seite – ohne Startkosten.', 'Änderungen schicken Sie einfach per Nachricht, wir erledigen sie jeden Monat.'],
    it: ['Breve colloquio: cosa deve fare il sito, quali foto e testi ci sono?', 'Costruiamo e pubblichiamo il sito – senza costi iniziali.', 'Le modifiche ce le mandi con un messaggio, le facciamo ogni mese.'],
  },
  sitocura: {
    de: ['Kostenloser Erstcheck Ihrer WordPress-Website.', 'Wir sichern, aktualisieren und überwachen laufend.', 'Jeden Monat ein verständlicher Bericht – bei Problemen stellen wir wieder her.'],
    it: ['Controllo iniziale gratuito del tuo sito WordPress.', 'Facciamo backup, aggiornamenti e monitoraggio continuo.', 'Ogni mese un report chiaro – se c’è un problema ripristiniamo.'],
  },
  bandiinbreve: {
    de: ['Sie wählen Branche, Betriebsgröße und Gemeinde.', 'Jede Woche kommt die Auswahl neuer Förderprogramme mit Frist und Quelle.', 'Im Pro-Tarif erinnern wir Sie rechtzeitig vor Fristende.'],
    it: ['Scegli settore, dimensione dell’impresa e comune.', 'Ogni settimana ricevi i nuovi bandi con scadenza e fonte.', 'Con il piano Pro ti ricordiamo le scadenze in tempo.'],
  },
  ospiteinregola: {
    de: ['Sie verbinden Ihre Buchungen oder tragen sie ein.', 'Zu jeder Buchung entstehen Checkliste, Fristen und die Kurtaxe-Berechnung.', 'Die Datei für Alloggiati Web liegt bereit; Gästedaten werden fristgerecht gelöscht.'],
    it: ['Colleghi le prenotazioni o le inserisci.', 'Per ogni prenotazione ricevi checklist, scadenze e calcolo della tassa di soggiorno.', 'Il file per Alloggiati Web è pronto; i dati degli ospiti vengono cancellati nei tempi previsti.'],
  },
  ospiteguida: {
    de: ['Sie geben uns die Infos zur Unterkunft: Anreise, WLAN, Regeln, Tipps.', 'Gäste fragen per Link oder QR-Code – der Assistent antwortet in ihrer Sprache.', 'Bei Dringendem oder Unbekanntem werden Sie benachrichtigt und übernehmen.'],
    it: ['Ci dai le informazioni sull’alloggio: arrivo, Wi-Fi, regole, consigli.', 'Gli ospiti chiedono tramite link o QR code – l’assistente risponde nella loro lingua.', 'Per le urgenze o le domande nuove ricevi un avviso e intervieni tu.'],
  },
  menuvivo: {
    de: ['Sie schicken uns Ihre aktuelle Karte – wir übertragen sie.', 'Gäste scannen den QR-Code am Tisch und wählen ihre Sprache.', 'Preise, Tagesgerichte und „ausverkauft“ ändern Sie selbst in Sekunden.'],
    it: ['Ci mandi il menù attuale – lo inseriamo noi.', 'Gli ospiti inquadrano il QR code al tavolo e scelgono la lingua.', 'Prezzi, piatti del giorno ed “esaurito” li cambi tu in pochi secondi.'],
  },
  mappaviva: {
    de: ['Kostenloser Profil-Check mit den wichtigsten Lücken.', 'Sie geben uns eine Verwalter-Rolle – kein Passwort nötig.', 'Wir pflegen Zeiten, Fotos und Beiträge und berichten jeden Monat.'],
    it: ['Controllo gratuito del profilo con le lacune principali.', 'Ci assegni un ruolo di gestore – nessuna password necessaria.', 'Curiamo orari, foto e post e ti mandiamo un report ogni mese.'],
  },
  agendabreve: {
    de: ['Sie legen Leistungen, Dauer und Öffnungszeiten fest.', 'Kunden buchen freie Zeiten auf Ihrer Website oder per Link.', 'Bestätigung und Erinnerung gehen automatisch raus, Ihr Kalender ist abgeglichen.'],
    it: ['Imposti servizi, durata e orari.', 'I clienti prenotano gli orari liberi sul tuo sito o tramite link.', 'Conferma e promemoria partono in automatico, il calendario è sincronizzato.'],
  },
  socialsettimana: {
    de: ['Sie schicken uns Fotos aus Ihrem Betrieb.', 'Wir schreiben drei Beiträge pro Woche auf Deutsch und Italienisch.', 'Sie geben den Wochenplan per Link frei – erst dann wird veröffentlicht.'],
    it: ['Ci mandi foto della tua attività.', 'Scriviamo tre post a settimana in italiano e tedesco.', 'Approvi il piano settimanale tramite link – solo dopo pubblichiamo.'],
  },
  eventolampo: {
    de: ['Sie schicken Datum, Ort, Programm, Fotos und Logo.', 'Nach 48 Stunden ist die Seite online, mit Anmeldung und Teilen-Bild.', 'Sie teilen einen Link und sehen die Anmeldungen als Liste.'],
    it: ['Ci mandi data, luogo, programma, foto e logo.', 'Dopo 48 ore la pagina è online, con iscrizione e immagine di anteprima.', 'Condividi un link e vedi le iscrizioni in un elenco.'],
  },
};
