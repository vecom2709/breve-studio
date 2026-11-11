/**
 * Kurze Produktbezeichnung in der jeweiligen Sprache, die neben dem (italienischen) Markennamen steht,
 * damit Kunden sofort sehen, was sie bekommen. Automatisch ergänzte Pakete bringen das Feld `produktart` selbst mit.
 */
import type { L10n, Package } from './packages';

export const produktarten: Record<string, L10n> = {
  gareinbreve: { de: 'Ausschreibungs-Alarm per E-Mail', it: 'Avvisi gare d’appalto via e-mail' },
  immotesto: { de: 'Exposé-Texte in drei Sprachen', it: 'Testi per annunci immobiliari' },
  replicapro: { de: 'Antworten auf Google-Bewertungen', it: 'Risposte alle recensioni Google' },
  betriebsautopilot: { de: 'Online-Kurs: KI im Handwerksbetrieb', it: 'Corso online: IA per l’impresa artigiana' },
  vermieterkiste: { de: 'Vorlagen für Ferienvermieter', it: 'Modelli per affitti brevi' },
  sitotranquillo: { de: 'Website im Monatsabo', it: 'Sito web in abbonamento' },
  sitocura: { de: 'WordPress-Wartung', it: 'Manutenzione WordPress' },
  bandiinbreve: { de: 'Förderprogramm-Alarm', it: 'Avvisi bandi e contributi' },
  ospiteinregola: { de: 'Pflichten-Helfer für Ferienvermieter', it: 'Adempimenti per affitti brevi' },
  ospiteguida: { de: 'Digitaler Gäste-Assistent', it: 'Assistente digitale per gli ospiti' },
  menuvivo: { de: 'Digitale Speisekarte mit QR-Code', it: 'Menù digitale con QR code' },
  mappaviva: { de: 'Pflege Ihres Google-Profils', it: 'Gestione del profilo Google' },
  agendabreve: { de: 'Online-Terminbuchung', it: 'Prenotazione appuntamenti online' },
  socialsettimana: { de: 'Social-Media-Betreuung', it: 'Gestione dei social media' },
  eventolampo: { de: 'Eventseite in 48 Stunden', it: 'Pagina evento in 48 ore' },
};

export const produktart = (p: Package): L10n | undefined => p.produktart ?? produktarten[p.slug];
