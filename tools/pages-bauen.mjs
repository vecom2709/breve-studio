// Baut die statische Fassung für GitHub Pages.
// Ablauf: PUBLIC_STATISCH=1 npm run build:fast  →  node tools/pages-bauen.mjs
// Standard: eigene Domain www.studio-breve.it – die Seite liegt im Wurzelpfad, eine CNAME-Datei wird angelegt.
// Ohne eigene Domain (PAGES_DOMAIN= leer) liefert Pages das Projekt unter /breve-studio/ aus; dann werden alle
// Wurzelpfade im fertigen Build auf diesen Unterpfad umgeschrieben. Der Quelltext bleibt unverändert.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DOMAIN = process.env.PAGES_DOMAIN ?? 'www.studio-breve.it';
const BASIS = process.env.PAGES_BASIS ?? (DOMAIN ? '' : '/breve-studio');
const QUELLE = 'dist/client';
const ZIEL = 'dist-pages';

await rm(ZIEL, { recursive: true, force: true });
await mkdir(ZIEL, { recursive: true });
await cp(QUELLE, ZIEL, { recursive: true });
await writeFile(path.join(ZIEL, '.nojekyll'), ''); // sonst blendet Pages den Ordner _astro aus
if (DOMAIN) await writeFile(path.join(ZIEL, 'CNAME'), `${DOMAIN}\n`); // eigene Domain für GitHub Pages

const textarten = new Set(['.html', '.css', '.js', '.mjs', '.webmanifest', '.json', '.xml', '.txt', '.svg']);
let dateien = 0;
let stellen = 0;

const umschreiben = (inhalt, art) => {
  let n = 0;
  const ersetze = (re, fn) => { inhalt = inhalt.replace(re, (...a) => { n++; return fn(...a); }); };
  // Zeichenketten und Attribute: "/x…", '/x…', `/x…`
  ersetze(/(["'`])\/(?=[A-Za-z0-9_.~?#-])/g, (_, q) => `${q}${BASIS}/`);
  // Startseiten-Verweise href="/" (nur Attribute, nie CSS-Inhalte wie content: '/')
  if (art === '.html') ersetze(/((?:href|action)=)"\/"/g, (_, a) => `${a}"${BASIS}/"`);
  // weitere Adressen in srcset-Listen
  ersetze(/(srcset="[^"]*)/g, (m) => m.replace(/(,\s*)\/(?!\/)/g, `$1${BASIS}/`));
  // CSS url(/…)
  ersetze(/url\(\s*(["']?)\/(?!\/)/g, (_, q) => `url(${q}${BASIS}/`);
  // Weiterleitungsseiten: content="0;url=/…"
  if (art === '.html') ersetze(/(url=)\/(?!\/)/g, (_, a) => `${a}${BASIS}/`);
  stellen += n;
  return inhalt;
};

async function gehe(ordner) {
  for (const e of await readdir(ordner)) {
    const p = path.join(ordner, e);
    if ((await stat(p)).isDirectory()) { await gehe(p); continue; }
    const art = path.extname(e).toLowerCase();
    if (!textarten.has(art)) continue;
    const alt = await readFile(p, 'utf8');
    const neu = umschreiben(alt, art);
    if (neu !== alt) { await writeFile(p, neu); dateien++; }
  }
}
if (BASIS) await gehe(ZIEL);

// Doppelte Basis vermeiden (falls etwas schon umgeschrieben war)
async function bereinige(ordner) {
  for (const e of await readdir(ordner)) {
    const p = path.join(ordner, e);
    if ((await stat(p)).isDirectory()) { await bereinige(p); continue; }
    if (!textarten.has(path.extname(e).toLowerCase())) continue;
    const t = await readFile(p, 'utf8');
    const k = t.split(`${BASIS}${BASIS}/`).join(`${BASIS}/`);
    if (k !== t) await writeFile(p, k);
  }
}
if (BASIS) await bereinige(ZIEL);
console.log(BASIS
  ? `Pages-Build: ${dateien} Dateien angepasst, ${stellen} Stellen auf ${BASIS}/ umgeschrieben → ${ZIEL}/`
  : `Pages-Build: Wurzelpfad, Domain ${DOMAIN} (CNAME) → ${ZIEL}/`);
