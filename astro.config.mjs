// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Platzhalter-Host: Die Domain ist NICHT registriert (Stand 9.11.2026).
export default defineConfig({
  site: 'https://studiobreve.it',
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
});
