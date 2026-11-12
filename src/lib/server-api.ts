/**
 * Wo laufen Anfrageformular, Besuchszähler und Verwaltung?
 * - Node-Betrieb (npm run preview/dev): auf demselben Server, Pfade /api/…
 * - Statischer Pages-Build (PUBLIC_STATISCH=1): auf der Verwaltung bei All-Inkl, Adresse in PUBLIC_API_BASIS
 *   (z. B. https://verwaltung.studio-breve.it). Ohne PUBLIC_API_BASIS bleibt das Formular abgeschaltet.
 */
export const statisch = import.meta.env.PUBLIC_STATISCH === '1';
export const apiBasis: string = String(import.meta.env.PUBLIC_API_BASIS ?? '').replace(/\/+$/, '');
export const mitApi = !statisch || apiBasis !== '';
export const api = (pfad: string) => apiBasis + pfad;
