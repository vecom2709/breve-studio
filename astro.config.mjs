// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Domain studio-breve.it registriert (12.11.2026), Auslieferung über GitHub Pages.
export default defineConfig({
  site: 'https://www.studio-breve.it',
  trailingSlash: 'always',
  output: 'static', // statisch zuerst; nur /api/* und Danke-Seiten laufen serverseitig
  adapter: node({ mode: 'standalone' }),
  build: { format: 'directory' },
  server: { host: '127.0.0.1', port: 4173 },
  devToolbar: { enabled: false },
  // Nur lokale Vorschau: Host-Header von localhost/127.0.0.1 vertrauen,
  // damit die Same-Origin-Prüfung für das Formular korrekt greift.
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: '127.0.0.1', protocol: 'http' },
      { hostname: 'localhost', protocol: 'http' },
    ],
  },
  // Alte deutsche URLs (ohne /de/-Präfix) auf die neue Struktur umleiten.
  redirects: {
    '/pakete': '/de/pakete',
    '/pakete/[slug]': '/de/pakete/[slug]',
    '/kontakt': '/de/kontakt',
    '/kontakt/danke': '/de/kontakt/danke',
    '/ueber-uns': '/de/ueber-uns',
    '/impressum': '/de/impressum',
    '/datenschutz': '/de/datenschutz',
    '/agb': '/de/agb',
  },
});
