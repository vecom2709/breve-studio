// Baut die statische Online-Vorschau für GitHub Pages (https://vecom2709.github.io/breve-studio/).
// Ablauf: PUBLIC_STATISCH=1 npm run build:fast  →  node tools/pages-bauen.mjs
// Die Seite nutzt Wurzelpfade (/de/…, /images/…). GitHub Pages liefert ein Projekt unter /breve-studio/ aus,
// deshalb werden alle Wurzelpfade im fertigen Build auf diesen Unterpfad umgeschrieben. Der Quelltext bleibt unverändert.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASIS = '/breve-studio';
const QUELLE = 'dist/client';
const ZIEL = 'dist-pages';

await rm(ZIEL, { recursive: true, force: true });
await mkdir(ZIEL, { recursive: true });
await cp(QUELLE, ZIEL, { recursive: true });
await writeFile(path.join(ZIEL, '.nojekyll'), ''); // sonst blendet Pages den Ordner _astro aus

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
await gehe(ZIEL);

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
await bereinige(ZIEL);
console.log(`Pages-Build: ${dateien} Dateien angepasst, ${stellen} Stellen auf ${BASIS}/ umgeschrieben → ${ZIEL}/`);
