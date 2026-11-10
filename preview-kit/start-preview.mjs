#!/usr/bin/env node
// Lokale Vorschau von Studio Breve. Bindet nur 127.0.0.1, nichts wird veröffentlicht.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { exec } from "node:child_process";
import net from "node:net";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(ROOT, "site");
const DATA = path.join(ROOT, "inquiries.json");
const ANALYTICS_DIR = path.join(ROOT, "data", "analytics");
const VISITS_FILE = path.join(ANALYTICS_DIR, "visits.jsonl");
const DAILY_FILE = path.join(ANALYTICS_DIR, "daily.json");
const SETTINGS_FILE = path.join(ANALYTICS_DIR, "settings.json");
const HOST = "127.0.0.1";
const PREFERRED_PORT = 4173;
const ADMIN_FILE = path.join(ROOT, "data", "admin.json");
const ADMIN_COOKIE = "sb_admin";
const ADMIN_MAX_AGE = 60 * 60 * 12;
const ADMIN_MIN_LEN = 10;
const ADMIN_MAX_ATTEMPTS = 10;
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
const ENV_SALT = "studio-breve-admin-env";
const ANALYTICS_TZ = "Europe/Rome";
const loginAttempts = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".xml": "application/xml",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeJoin(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const full = path.normalize(path.join(SITE, rel));
  const root = path.resolve(SITE);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "");
  res.writeHead(status, { "Content-Length": buf.length, ...headers });
  res.end(buf);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" });
}

function sendRedirect(res, location, status = 303) {
  send(res, status, "", { Location: location });
}

/** Alte deutsche URLs ohne /de/-Präfix dauerhaft auf die neue Struktur umleiten. */
function legacyRedirect(pathname, search) {
  const raw = pathname || "/";
  const withSlash = raw.endsWith("/") ? raw : raw + "/";
  const exact = {
    "/pakete/": "/de/pakete/",
    "/kontakt/": "/de/kontakt/",
    "/kontakt/danke/": "/de/kontakt/danke/",
    "/ueber-uns/": "/de/ueber-uns/",
    "/impressum/": "/de/impressum/",
    "/datenschutz/": "/de/datenschutz/",
    "/agb/": "/de/agb/",
  };
  let dest = exact[withSlash];
  if (!dest && withSlash.startsWith("/pakete/") && withSlash !== "/pakete/") {
    dest = "/de" + withSlash;
  }
  if (!dest) return null;
  return dest + (search || "");
}

function parseUrlEncoded(raw) {
  const out = {};
  for (const [k, v] of new URLSearchParams(raw.toString("utf8"))) out[k] = v;
  return out;
}

function parseMultipart(raw, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return {};
  const boundary = Buffer.from("--" + (m[1] || m[2]));
  const out = {};
  const parts = [];
  let start = 0;
  while (start <= raw.length) {
    const idx = raw.indexOf(boundary, start);
    if (idx === -1) break;
    if (start > 0) parts.push(raw.subarray(start, idx));
    start = idx + boundary.length;
    if (raw[start] === 13 && raw[start + 1] === 10) start += 2;
  }
  for (const part of parts) {
    if (!part.length || part.subarray(0, 2).toString() === "--") continue;
    const split = part.indexOf(Buffer.from("\r\n\r\n"));
    if (split === -1) continue;
    const header = part.subarray(0, split).toString("utf8");
    let body = part.subarray(split + 4);
    if (body.subarray(-2).toString() === "\r\n") body = body.subarray(0, -2);
    const name = /name="([^"]+)"/.exec(header);
    if (name) out[name[1]] = body.toString("utf8");
  }
  return out;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}


function readAdmin() {
  try {
    const data = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    if (
      data?.algo === "scrypt" &&
      typeof data.salt === "string" &&
      typeof data.hash === "string" &&
      typeof data.sessionKey === "string" &&
      data.salt.length >= 16 &&
      data.hash.length >= 16 &&
      data.sessionKey.length >= 16
    ) {
      return data;
    }
  } catch {}
  return null;
}

function writeAdmin(data) {
  const dir = path.dirname(ADMIN_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${ADMIN_FILE}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tmp, ADMIN_FILE);
  try { fs.chmodSync(ADMIN_FILE, 0o600); } catch {}
}

function needsSetup() {
  return !readAdmin() && !process.env.ADMIN_PASSWORD;
}

function verifyPassword(input) {
  let ok = false;
  const rec = readAdmin();
  if (rec) {
    try {
      const got = scryptSync(String(input), Buffer.from(rec.salt, "hex"), 32);
      const expect = Buffer.from(rec.hash, "hex");
      if (got.length === expect.length && timingSafeEqual(got, expect)) ok = true;
    } catch {}
  }
  const env = process.env.ADMIN_PASSWORD;
  if (env) {
    const a = scryptSync(String(input), ENV_SALT, 32);
    const b = scryptSync(env, ENV_SALT, 32);
    if (a.length === b.length && timingSafeEqual(a, b)) ok = true;
  }
  return ok;
}

function validateNewPassword(password, repeat) {
  if (String(password).length < ADMIN_MIN_LEN) {
    return `Das Passwort muss mindestens ${ADMIN_MIN_LEN} Zeichen haben.`;
  }
  if (password !== repeat) return "Die Passwörter stimmen nicht überein.";
  return null;
}

function setPassword(password) {
  const err = validateNewPassword(password, password);
  if (err) throw new Error(err);
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  const sessionKey = randomBytes(32);
  writeAdmin({
    algo: "scrypt",
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
    sessionKey: sessionKey.toString("hex"),
    updatedAt: new Date().toISOString(),
  });
}

function checkLoginAllowed(ipKey) {
  const now = Date.now();
  const row = loginAttempts.get(ipKey);
  if (!row || now > row.reset) return { ok: true, remaining: ADMIN_MAX_ATTEMPTS, locked: false };
  if (row.n >= ADMIN_MAX_ATTEMPTS) return { ok: false, remaining: 0, locked: true };
  return { ok: true, remaining: ADMIN_MAX_ATTEMPTS - row.n, locked: false };
}

function recordLoginFailure(ipKey) {
  const now = Date.now();
  const row = loginAttempts.get(ipKey);
  if (!row || now > row.reset) {
    loginAttempts.set(ipKey, { n: 1, reset: now + ADMIN_WINDOW_MS });
    return { ok: true, remaining: ADMIN_MAX_ATTEMPTS - 1, locked: false };
  }
  row.n += 1;
  if (row.n >= ADMIN_MAX_ATTEMPTS) return { ok: false, remaining: 0, locked: true };
  return { ok: true, remaining: ADMIN_MAX_ATTEMPTS - row.n, locked: false };
}

function clearLoginFailures(ipKey) {
  loginAttempts.delete(ipKey);
}

function adminSecret() {
  const rec = readAdmin();
  if (rec?.sessionKey) return Buffer.from(rec.sessionKey, "hex");
  if (process.env.ADMIN_PASSWORD) {
    return createHash("sha256").update("studio-breve-admin:" + process.env.ADMIN_PASSWORD).digest();
  }
  return createHash("sha256").update("studio-breve-admin:unset").digest();
}

function mintSession() {
  const id = randomBytes(16).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE;
  const sig = createHmac("sha256", adminSecret()).update(`${id}.${exp}`).digest("hex");
  return `${id}.${exp}.${sig}`;
}

function readSession(token) {
  if (!token) return false;
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expect = createHmac("sha256", adminSecret()).update(`${id}.${exp}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expect, "hex"));
  } catch {
    return false;
  }
}

function cookieHeader(value, maxAge, secure) {
  const parts = [`${ADMIN_COOKIE}=${value}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function cookieFromHeader(header) {
  if (!header) return;
  const m = String(header).split(";").map((x) => x.trim()).find((x) => x.startsWith(ADMIN_COOKIE + "="));
  return m ? m.slice(ADMIN_COOKIE.length + 1) : undefined;
}

function isAuthed(req) {
  return readSession(cookieFromHeader(req.headers.cookie));
}

function todayStamp(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function ensureAnalytics() {
  fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
}

function readDaily() {
  try {
    const raw = JSON.parse(fs.readFileSync(DAILY_FILE, "utf8"));
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function uniqueVisitTotal() {
  return Object.values(readDaily()).reduce((a, b) => a + (Number(b) || 0), 0);
}

function readSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    return { excludeAdmin: !!raw.excludeAdmin };
  } catch {
    return { excludeAdmin: true };
  }
}

function writeSettings(next) {
  ensureAnalytics();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2) + "\n");
}

function loadVisits() {
  try {
    return fs.readFileSync(VISITS_FILE, "utf8").split(/\n/).filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function saveVisits(rows) {
  ensureAnalytics();
  fs.writeFileSync(VISITS_FILE, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
}

function purgeOld(rows, now = new Date()) {
  const cut = todayStamp(new Date(now.getTime() - 365 * 86400000));
  return rows.filter((r) => r.date >= cut);
}

function parseUA(ua) {
  const u = ua || "";
  let browser = "Unbekannt";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u) && !/Chromium/i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari/i.test(u) && !/Chrome/i.test(u)) browser = "Safari";
  let os = "Unbekannt";
  if (/Windows NT/i.test(u)) os = "Windows";
  else if (/Mac OS X/i.test(u)) os = "macOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Linux/i.test(u)) os = "Linux";
  let device = "desktop";
  if (/iPad|Tablet|PlayBook/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) device = "tablet";
  else if (/Mobi|iPhone|Android/i.test(u)) device = "mobile";
  return { browser, os, device };
}

function countryFromAcceptLanguage(header) {
  if (!header) return null;
  const m = /^[a-z]{2,3}[-_]([A-Z]{2})/i.exec(String(header).split(",")[0].trim());
  return m ? m[1].toUpperCase() : null;
}

function classifySource(referrer, utm) {
  if (utm && (utm.source || utm.medium || utm.campaign)) return utm.source || utm.medium || "utm";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === "127.0.0.1" || host === "localhost" || host.endsWith("studiobreve.it")) return "direct";
    return host;
  } catch {
    return "direct";
  }
}

function recordView(input) {
  if (String(input.path || "").startsWith("/verwaltung") || String(input.path || "").startsWith("/api/verwaltung")) {
    return { unique: false, total: uniqueVisitTotal() };
  }
  ensureAnalytics();
  const date = todayStamp();
  const rows = purgeOld(loadVisits());
  const existing = rows.find((r) => r.id === input.id && r.date === date);
  if (existing) {
    if (!existing.pages.some((p) => p.path === input.path && p.ms == null)) {
      existing.pages.push({ path: input.path, enteredAt: new Date().toISOString() });
    }
    saveVisits(rows);
    return { unique: false, total: uniqueVisitTotal() };
  }
  rows.push({
    id: input.id,
    date,
    startedAt: new Date().toISOString(),
    pages: [{ path: input.path, enteredAt: new Date().toISOString() }],
    referrer: String(input.referrer || "").slice(0, 500),
    source: classifySource(input.referrer, input.utm),
    utm: input.utm,
    lang: String(input.lang || "").slice(0, 8),
    country: input.country,
    region: null,
    city: null,
    device: input.device,
    os: input.os,
    browser: input.browser,
    screen: String(input.screen || "").slice(0, 20),
  });
  saveVisits(rows);
  const daily = readDaily();
  daily[date] = (daily[date] || 0) + 1;
  fs.writeFileSync(DAILY_FILE, JSON.stringify(daily) + "\n");
  return { unique: true, total: Object.values(daily).reduce((a, b) => a + (Number(b) || 0), 0) };
}

function recordTiming(id, pagePath, ms) {
  if (!Number.isFinite(ms) || ms < 0) return;
  const date = todayStamp();
  const rows = loadVisits();
  const visit = rows.find((r) => r.id === id && r.date === date);
  if (!visit) return;
  const hit = [...visit.pages].reverse().find((p) => p.path === pagePath);
  if (hit) hit.ms = Math.min(Math.round(ms), 1000 * 60 * 60 * 6);
  saveVisits(rows);
}

async function handleTrack(req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    return sendJson(res, 200, { n: uniqueVisitTotal() });
  }
  if (req.method !== "POST") {
    return send(res, 405, "Method Not Allowed", { Allow: "GET, POST" });
  }
  const dnt = req.headers.dnt === "1" || req.headers["sec-gpc"] === "1";
  if (dnt) return sendJson(res, 200, { ok: true, ignored: "dnt", n: uniqueVisitTotal() });
  if (readSettings().excludeAdmin && isAuthed(req)) {
    return sendJson(res, 200, { ok: true, ignored: "admin", n: uniqueVisitTotal() });
  }
  let body = {};
  try {
    body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
  } catch {
    return sendJson(res, 400, { ok: false });
  }
  const sid = String(body.sid || "");
  const pathName = String(body.path || "/");
  if (!/^[A-Za-z0-9._:-]{8,80}$/.test(sid) || !pathName.startsWith("/") || pathName.length > 300) {
    return sendJson(res, 400, { ok: false });
  }
  if (body.t === "timing") {
    recordTiming(sid, pathName, Number(body.ms));
    return sendJson(res, 200, { ok: true });
  }
  const ua = parseUA(req.headers["user-agent"] || "");
  const result = recordView({
    id: sid,
    path: pathName,
    referrer: String(body.referrer || ""),
    utm: body.utm && typeof body.utm === "object" ? body.utm : null,
    lang: String(body.lang || ""),
    country: countryFromAcceptLanguage(req.headers["accept-language"]),
    device: ua.device,
    os: ua.os,
    browser: ua.browser,
    screen: String(body.screen || ""),
  });
  return sendJson(res, 200, { ok: true, unique: result.unique, n: result.total });
}

function sendHtml(res, status, html, headers = {}) {
  send(res, status, html, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers });
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function authShell(title, body) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title} — Verwaltung</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F8F6;font-family:system-ui,sans-serif;color:#14221f;padding:1.5rem}.card{width:min(26rem,100%);background:#fff;border:1px solid #d7ddd9;border-radius:18px;padding:2rem 1.8rem 1.6rem;display:grid;gap:1rem}.brand{display:flex;align-items:center;gap:.75rem;text-decoration:none;color:inherit}.brand img{width:44px;height:44px}.brand strong{display:block;font-weight:700}.brand small{color:#4a5b56}h1{font-size:1.45rem;margin:.2rem 0 0}p{margin:0;color:#4a5b56}form{display:grid;gap:.85rem}label{font-weight:600}.pw-wrap{position:relative;display:grid}.pw-wrap input{font:inherit;padding:.75rem 2.7rem .75rem .85rem;border:1px solid #c5cdc8;border-radius:10px;width:100%;box-sizing:border-box}.pw-toggle{position:absolute;right:.25rem;top:50%;transform:translateY(-50%);width:2.2rem;height:2.2rem;border:0;background:transparent;color:#4a5b56;cursor:pointer;display:grid;place-items:center;border-radius:8px}button[type=submit]{font:650 1rem/1 system-ui;background:#0f3b33;color:#fff;border:0;border-radius:999px;padding:.9rem 1.2rem;cursor:pointer}.err{color:#7a1515;background:#fdecec;border:1px solid #f0c4c4;border-radius:10px;padding:.8rem .9rem}.ok{color:#14532d;background:#e7f6ea;border-radius:10px;padding:.8rem .9rem}.back{color:#0f3b33;font-weight:600;text-decoration:none}.tools{display:flex;flex-wrap:wrap;gap:.8rem;align-items:center}</style></head>
  <body><div class="card">${body}</div>
  <script>(function(){document.addEventListener("click",function(ev){var btn=ev.target.closest&&ev.target.closest(".pw-toggle");if(!btn)return;var input=document.getElementById(btn.getAttribute("data-for"));if(!input)return;var show=input.type==="password";input.type=show?"text":"password";btn.setAttribute("aria-pressed",show?"true":"false");btn.setAttribute("aria-label",show?"Passwort verbergen":"Passwort anzeigen");});})();</script>
  </body></html>`;
}

function pwField(id, name, label, autocomplete, extra) {
  return `<label for="${id}">${label}</label><div class="pw-wrap"><input id="${id}" name="${name}" type="password" autocomplete="${autocomplete}" required ${extra || ""}><button type="button" class="pw-toggle" data-for="${id}" aria-label="Passwort anzeigen" aria-pressed="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg></button></div>`;
}

function brandBlock() {
  return `<a class="brand" href="/de/"><img src="/logo-studio-breve.svg" width="44" height="44" alt=""><span><strong>Studio Breve</strong><small>Digitalstudio · Aragona, Sizilien</small></span></a>`;
}

function loginPage(search) {
  const q = new URLSearchParams((search || "").replace(/^\?/, ""));
  const locked = q.get("sperre") === "1";
  const err = q.get("fehler") === "1";
  const rest = q.has("rest") && /^\d+$/.test(q.get("rest") || "") ? Number(q.get("rest")) : null;
  let alert = "";
  if (locked) {
    alert = `<p class="err" role="alert"><strong>Zu viele Versuche.</strong> Bitte in 15 Minuten erneut versuchen.</p>`;
  } else if (err) {
    const more = rest == null ? "Bitte prüfen Sie die Eingabe und versuchen Sie es erneut."
      : rest > 0 ? `Noch ${rest} ${rest === 1 ? "Versuch" : "Versuche"}.`
      : "Keine Versuche mehr. Bitte in 15 Minuten erneut versuchen.";
    alert = `<p class="err" role="alert"><strong>Passwort falsch</strong> ${more}</p>`;
  }
  return authShell("Anmeldung", `${brandBlock()}
  <h1>Anmeldung zur Verwaltung</h1>
  <p>Geschützter Bereich für den Betreiber. Der Link steht dezent im Fußbereich der Website.</p>
  ${alert}
  <form method="post" action="/api/verwaltung/login/">${pwField("password", "password", "Passwort", "current-password", "autofocus")}
  <button type="submit">Anmelden</button></form>
  <a class="back" href="/de/">← Zurück zur Website</a>`);
}

function setupPage(search) {
  const q = new URLSearchParams((search || "").replace(/^\?/, ""));
  const fehler = q.get("fehler");
  const msg = fehler === "kurz" ? `Das Passwort muss mindestens ${ADMIN_MIN_LEN} Zeichen haben.`
    : fehler === "wiederholung" ? "Die Passwörter stimmen nicht überein."
    : fehler ? "Das Passwort konnte nicht gespeichert werden. Bitte erneut versuchen."
    : "";
  const alert = msg ? `<p class="err" role="alert">${msg}</p>` : "";
  return authShell("Passwort festlegen", `${brandBlock()}
  <h1>Passwort festlegen</h1>
  <p>Beim ersten Aufruf legen Sie ein eigenes Passwort für die Verwaltung fest. Mindestens ${ADMIN_MIN_LEN} Zeichen, bitte wiederholen.</p>
  ${alert}
  <form method="post" action="/api/verwaltung/setup/">${pwField("password", "password", "Neues Passwort", "new-password", `autofocus minlength="${ADMIN_MIN_LEN}"`)}
  ${pwField("password2", "password2", "Passwort wiederholen", "new-password", `minlength="${ADMIN_MIN_LEN}"`)}
  <button type="submit">Passwort speichern und anmelden</button></form>
  <a class="back" href="/de/">← Zurück zur Website</a>`);
}

function passwordPage(search) {
  const q = new URLSearchParams((search || "").replace(/^\?/, ""));
  const fehler = q.get("fehler");
  const ok = q.get("ok") === "1";
  const msg = fehler === "aktuell" ? "Aktuelles Passwort falsch."
    : fehler === "kurz" ? `Das neue Passwort muss mindestens ${ADMIN_MIN_LEN} Zeichen haben.`
    : fehler === "wiederholung" ? "Die neuen Passwörter stimmen nicht überein."
    : fehler ? "Das Passwort konnte nicht geändert werden."
    : "";
  const alert = (ok ? `<p class="ok" role="status">Passwort geändert.</p>` : "") + (msg ? `<p class="err" role="alert">${msg}</p>` : "");
  return authShell("Passwort ändern", `<h1>Passwort ändern</h1>
  <p>Geben Sie das aktuelle Passwort und zweimal das neue Passwort ein (mindestens ${ADMIN_MIN_LEN} Zeichen).</p>
  ${alert}
  <form method="post" action="/api/verwaltung/passwort/">${pwField("current", "current", "Aktuelles Passwort", "current-password", "autofocus")}
  ${pwField("password", "password", "Neues Passwort", "new-password", `minlength="${ADMIN_MIN_LEN}"`)}
  ${pwField("password2", "password2", "Neues Passwort wiederholen", "new-password", `minlength="${ADMIN_MIN_LEN}"`)}
  <button type="submit">Passwort speichern</button></form>
  <div class="tools"><a class="back" href="/verwaltung/">← Zurück zur Verwaltung</a>
  <form method="post" action="/api/verwaltung/logout/" style="margin:0"><button type="submit" style="position:static;transform:none;width:auto;height:auto;padding:.45rem .85rem;border:1px solid #d7ddd9;color:#0f3b33;background:transparent;border-radius:999px">Abmelden</button></form></div>`);
}


function dashboardPage(reqUrl) {
  const url = new URL(reqUrl, `http://${HOST}`);
  const von = url.searchParams.get("von") || "";
  const bis = url.searchParams.get("bis") || "";
  const okParam = url.searchParams.get("ok");
  const ok = okParam === "1";
  const pwOk = okParam === "pw";
  const settings = readSettings();
  const dailyAll = readDaily();
  const totalAll = uniqueVisitTotal();
  const today = todayStamp();
  const daysAgo = (n) => todayStamp(new Date(Date.now() - n * 86400000));
  const sumRange = (from) => Object.entries(dailyAll).filter(([d]) => d >= from).reduce((a, [, n]) => a + Number(n || 0), 0);
  let visits = purgeOld(loadVisits());
  if (von) visits = visits.filter((v) => v.date >= von);
  if (bis) visits = visits.filter((v) => v.date <= bis);
  const countBy = (fn) => {
    const m = new Map();
    for (const v of visits) {
      const k = fn(v) || "—";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const pages = new Map();
  for (const v of visits) for (const p of v.pages) pages.set(p.path, (pages.get(p.path) || 0) + 1);
  const topPages = [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const sources = countBy((v) => v.source).slice(0, 12);
  const countries = countBy((v) => [v.country, v.region, v.city].filter(Boolean).join(" · ") || "unbekannt").slice(0, 12);
  const devices = countBy((v) => v.device);
  const browsers = countBy((v) => v.browser);
  const recent = [...visits].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 40);
  const qs = new URLSearchParams();
  if (von) qs.set("von", von);
  if (bis) qs.set("bis", bis);
  const exportHref = "/api/verwaltung/export/" + (qs.toString() ? "?" + qs.toString() : "");
  const row = (cells) => "<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>";
  const table = (head, rows) => !rows.length ? '<p class="muted">Keine Daten.</p>' : `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Besuche — Verwaltung</title>
  <style>body{margin:0;background:#F7F8F6;color:#14221f;font-family:system-ui,sans-serif}header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;padding:1rem 1.5rem;background:#fff;border-bottom:1px solid #d7ddd9}.admin-tools{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem}main{max-width:72rem;margin:0 auto;padding:1.25rem 1.5rem 3rem;display:grid;gap:1.25rem}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.8rem}.kpi,.card{background:#fff;border:1px solid #d7ddd9;border-radius:12px;padding:1rem}.kpi b{display:block;font-size:1.6rem}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.4rem .3rem;border-bottom:1px solid #d7ddd9;vertical-align:top}button,.btn{font:600 .95rem/1 system-ui;background:#0f3b33;color:#fff;border:0;border-radius:999px;padding:.55rem .95rem;text-decoration:none;display:inline-block}.ghost{background:transparent;color:#0f3b33;border:1px solid #d7ddd9}.row{display:flex;flex-wrap:wrap;gap:.6rem;align-items:end}.muted{color:#4a5b56}.grid2{display:grid;gap:1.25rem}@media(min-width:56rem){.grid2{grid-template-columns:1fr 1fr}}</style></head>
  <body><header><h1>Besuche — Studio Breve</h1><div class="admin-tools"><a class="btn ghost" href="/verwaltung/passwort/">Passwort ändern</a><form method="post" action="/api/verwaltung/logout/"><button class="ghost" type="submit">Abmelden</button></form></div></header>
  <main>
    ${ok ? '<p>Einstellung gespeichert.</p>' : ""}${pwOk ? '<p>Passwort geändert.</p>' : ""}
    <section class="kpis"><div class="kpi"><b>${dailyAll[today] || 0}</b><span>Heute</span></div><div class="kpi"><b>${sumRange(daysAgo(6))}</b><span>7 Tage</span></div><div class="kpi"><b>${sumRange(daysAgo(29))}</b><span>30 Tage</span></div><div class="kpi"><b>${totalAll}</b><span>Seit Start</span></div></section>
    <form class="row card" method="get" action="/verwaltung/"><label>Von <input type="date" name="von" value="${escapeHtml(von)}"></label><label>Bis <input type="date" name="bis" value="${escapeHtml(bis)}"></label><button type="submit">Filtern</button><a class="btn ghost" href="/verwaltung/">Zurücksetzen</a><a class="btn ghost" href="${exportHref}">CSV exportieren</a></form>
    <div class="grid2">
      <section class="card"><h2>Häufigste Seiten</h2>${table(["Pfad","Aufrufe"], topPages.map(([p,n]) => row([escapeHtml(p), n])))}</section>
      <section class="card"><h2>Quellen</h2>${table(["Quelle","Besuche"], sources.map(([p,n]) => row([escapeHtml(p), n])))}</section>
      <section class="card"><h2>Länder und Orte</h2><p class="muted">Ohne Speicherung der vollen IP.</p>${table(["Ort","Besuche"], countries.map(([p,n]) => row([escapeHtml(p), n])))}</section>
      <section class="card"><h2>Geräte und Browser</h2>${table(["Merkmal","Anzahl"], [...devices.map(([p,n]) => row(["Gerät: " + escapeHtml(p), n])), ...browsers.map(([p,n]) => row(["Browser: " + escapeHtml(p), n]))])}</section>
    </div>
    <section class="card"><h2>Letzte Besuche</h2>${table(["Zeit","Sprache","Gerät","Quelle","Seiten"], recent.map((v) => row([
      escapeHtml(v.startedAt.replace("T"," ").slice(0,19)), escapeHtml(v.lang),
      escapeHtml(`${v.device} · ${v.os} · ${v.browser}`), escapeHtml(v.source),
      escapeHtml(v.pages.map((p) => p.path + (p.ms != null ? ` (${Math.round(p.ms/1000)}s)` : "")).join(" → "))
    ])))}</section>
    <section class="card"><h2>Einstellungen</h2>
      <form method="post" action="/api/verwaltung/settings/">
        <label><input type="checkbox" name="excludeAdmin" value="yes" ${settings.excludeAdmin ? "checked" : ""}> Eigene Besuche aus der Verwaltung nicht mitzählen</label>
        <p><button type="submit">Speichern</button></p>
      </form>
    </section>
  </main></body></html>`;
}

async function handleAdminApi(req, res, pathname) {
  const secure = false;
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1").toString().replace(/\d+$/, "0");
  const readForm = async () => {
    const raw = await readBody(req);
    const ctype = req.headers["content-type"] || "";
    return ctype.includes("multipart/form-data") ? parseMultipart(raw, ctype) : parseUrlEncoded(raw);
  };
  if (pathname === "/api/verwaltung/setup") {
    if (req.method !== "POST") return send(res, 405, "Method Not Allowed", { Allow: "POST" });
    if (!needsSetup()) return sendRedirect(res, "/verwaltung/anmelden/");
    const form = await readForm();
    const err = validateNewPassword(form.password || "", form.password2 || form.repeat || "");
    if (err) {
      const code = String(form.password || "").length < ADMIN_MIN_LEN ? "kurz" : "wiederholung";
      return sendRedirect(res, "/verwaltung/?fehler=" + code);
    }
    setPassword(form.password);
    res.writeHead(303, { Location: "/verwaltung/", "Set-Cookie": cookieHeader(mintSession(), ADMIN_MAX_AGE, secure) });
    return res.end();
  }
  if (pathname === "/api/verwaltung/login") {
    if (req.method !== "POST") return send(res, 405, "Method Not Allowed", { Allow: "POST" });
    if (needsSetup()) return sendRedirect(res, "/verwaltung/");
    if (!checkLoginAllowed(ip).ok) return sendRedirect(res, "/verwaltung/anmelden/?sperre=1");
    const form = await readForm();
    if (!verifyPassword(form.password || "")) {
      const after = recordLoginFailure(ip);
      if (after.locked) return sendRedirect(res, "/verwaltung/anmelden/?sperre=1");
      return sendRedirect(res, "/verwaltung/anmelden/?fehler=1&rest=" + after.remaining);
    }
    clearLoginFailures(ip);
    res.writeHead(303, { Location: "/verwaltung/", "Set-Cookie": cookieHeader(mintSession(), ADMIN_MAX_AGE, secure) });
    return res.end();
  }
  if (pathname === "/api/verwaltung/logout") {
    res.writeHead(303, { Location: "/verwaltung/anmelden/", "Set-Cookie": cookieHeader("", 0, secure) });
    return res.end();
  }
  if (!isAuthed(req)) return sendRedirect(res, "/verwaltung/anmelden/");
  if (pathname === "/api/verwaltung/passwort") {
    if (req.method !== "POST") return send(res, 405, "Method Not Allowed", { Allow: "POST" });
    const form = await readForm();
    if (!verifyPassword(form.current || "")) return sendRedirect(res, "/verwaltung/passwort/?fehler=aktuell");
    const err = validateNewPassword(form.password || "", form.password2 || form.repeat || "");
    if (err) {
      const code = String(form.password || "").length < ADMIN_MIN_LEN ? "kurz" : "wiederholung";
      return sendRedirect(res, "/verwaltung/passwort/?fehler=" + code);
    }
    setPassword(form.password);
    res.writeHead(303, { Location: "/verwaltung/passwort/?ok=1", "Set-Cookie": cookieHeader(mintSession(), ADMIN_MAX_AGE, secure) });
    return res.end();
  }
  if (pathname === "/api/verwaltung/settings") {
    if (req.method !== "POST") return send(res, 405, "Method Not Allowed", { Allow: "POST" });
    const raw = await readBody(req);
    const ctype = req.headers["content-type"] || "";
    const form = ctype.includes("multipart/form-data") ? parseMultipart(raw, ctype) : parseUrlEncoded(raw);
    writeSettings({ excludeAdmin: form.excludeAdmin === "yes" });
    return sendRedirect(res, "/verwaltung/?ok=1");
  }
  if (pathname === "/api/verwaltung/export") {
    const url = new URL(req.url || "/", `http://${HOST}`);
    const von = url.searchParams.get("von") || "";
    const bis = url.searchParams.get("bis") || "";
    let rows = purgeOld(loadVisits());
    if (von) rows = rows.filter((r) => r.date >= von);
    if (bis) rows = rows.filter((r) => r.date <= bis);
    const header = ["id","date","startedAt","lang","country","device","os","browser","screen","source","referrer","pages"];
    const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const lines = [header.join(",")];
    for (const r of rows) {
      const pages = r.pages.map((p) => `${p.path}${p.ms != null ? "(" + p.ms + "ms)" : ""}`).join(" > ");
      lines.push([r.id, r.date, r.startedAt, r.lang, r.country || "", r.device, r.os, r.browser, r.screen, r.source, r.referrer, pages].map(q).join(","));
    }
    const body = "\uFEFF" + lines.join("\n") + "\n";
    return send(res, 200, body, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="studio-breve-besuche.csv"', "Cache-Control": "no-store" });
  }
  return send(res, 404, "Nicht gefunden");
}

function handleAdminPage(req, res, pathname, search) {
  if (pathname === "/verwaltung/anmelden") {
    if (needsSetup()) return sendRedirect(res, "/verwaltung/");
    if (isAuthed(req)) return sendRedirect(res, "/verwaltung/");
    return sendHtml(res, 200, loginPage(search));
  }
  if (pathname === "/verwaltung/passwort") {
    if (needsSetup()) return sendRedirect(res, "/verwaltung/");
    if (!isAuthed(req)) return sendRedirect(res, "/verwaltung/anmelden/");
    return sendHtml(res, 200, passwordPage(search));
  }
  if (pathname === "/verwaltung") {
    if (needsSetup()) return sendHtml(res, 200, setupPage(search));
    if (!isAuthed(req)) return sendRedirect(res, "/verwaltung/anmelden/");
    return sendHtml(res, 200, dashboardPage(req.url || "/verwaltung/"));
  }
  return false;
}

async function handleInquiry(req, res) {
  const raw = await readBody(req);
  const ctype = req.headers["content-type"] || "";
  const form = ctype.includes("multipart/form-data")
    ? parseMultipart(raw, ctype)
    : parseUrlEncoded(raw);
  const s = (k, max = 4000) => String(form[k] ?? "").trim().slice(0, max);
  const wantsJson = (req.headers.accept || "").includes("application/json");
  const lang = s("lang") === "it" ? "it" : "de";
  const back = s("source", 200).startsWith("/")
    ? s("source", 200)
    : lang === "it"
      ? "/it/contatti/"
      : "/de/kontakt/";

  if (s("website")) {
    return wantsJson ? sendJson(res, 400, { ok: false }) : sendRedirect(res, `${back}?fehler=1#formular`);
  }

  const name = s("name", 120);
  const email = s("email", 200);
  const message = s("message", 4000);
  const consent = s("consent") === "yes";
  const errors = {};
  if (name.length < 2) errors.name = true;
  if (!EMAIL_RE.test(email)) errors.email = true;
  if (message.length < 10) errors.message = true;
  if (!consent) errors.consent = true;
  if (Object.keys(errors).length) {
    return wantsJson
      ? sendJson(res, 422, { ok: false, errors })
      : sendRedirect(res, `${back}?fehler=1#formular`);
  }

  const pref = s("language");
  const recId = "prev-" + randomUUID().replace(/-/g, "").slice(0, 12);
  const record = {
    id: recId,
    createdAt: new Date().toISOString(),
    siteLang: lang,
    preferredLanguage: pref === "it" || pref === "en" ? pref : "de",
    name,
    email,
    package: s("package", 80) || null,
    intent: s("intent", 20) || "general",
    message,
    consent: {
      processing: true,
      marketing: s("marketing") === "yes",
      textVersion: "consent-2026-11-09",
    },
    source: back,
  };
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(DATA, "utf8"));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }
  existing.push(record);
  fs.writeFileSync(DATA, JSON.stringify(existing, null, 2) + "\n", "utf8");
  const thanks = lang === "it" ? "/it/contatti/grazie/" : "/de/kontakt/danke/";
  const redirect = `${thanks}?ref=${encodeURIComponent(recId)}`;
  return wantsJson
    ? sendJson(res, 201, { ok: true, id: recId, redirect })
    : sendRedirect(res, redirect);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  send(res, 200, data, { "Content-Type": type, "Cache-Control": "no-store" });
}

function handler(req, res) {
  const url = new URL(req.url || "/", `http://${HOST}`);
  const clean = url.pathname.replace(/\/+$/, "") || "/";
  if (clean === "/api/track") {
    handleTrack(req, res).catch(() => sendJson(res, 500, { ok: false }));
    return;
  }
  if (clean.startsWith("/api/verwaltung")) {
    handleAdminApi(req, res, clean).catch(() => send(res, 500, "Fehler"));
    return;
  }
  if (clean === "/verwaltung" || clean === "/verwaltung/anmelden" || clean === "/verwaltung/passwort") {
    handleAdminPage(req, res, clean, url.search);
    return;
  }
  if (req.method === "POST" && url.pathname.replace(/\/$/, "") === "/api/inquiry") {
    handleInquiry(req, res).catch(() => sendJson(res, 500, { ok: false }));
    return;
  }
  if (url.pathname.replace(/\/$/, "") === "/api/inquiry") {
    send(res, 405, "Method Not Allowed", { Allow: "POST" });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }
  const legacy = legacyRedirect(url.pathname, url.search);
  if (legacy) {
    sendRedirect(res, legacy, 301);
    return;
  }
  const full = safeJoin(url.pathname);
  if (!full) {
    send(res, 400, "Bad Request");
    return;
  }
  const asIndex = path.join(full, "index.html");
  if (!url.pathname.endsWith("/") && fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) {
    sendRedirect(res, url.pathname + "/" + url.search, 308);
    return;
  }
  let file = full;
  if (url.pathname.endsWith("/") || (fs.existsSync(full) && fs.statSync(full).isDirectory())) {
    file = path.join(full, "index.html");
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    try {
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
          "Content-Length": fs.statSync(file).size,
        });
        res.end();
        return;
      }
      serveFile(res, file);
    } catch {
      send(res, 500, "Fehler beim Lesen der Datei");
    }
    return;
  }
  const notFound = path.join(SITE, "404.html");
  if (fs.existsSync(notFound)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(notFound));
    return;
  }
  send(res, 404, "Seite nicht gefunden");
}

function portFree(port) {
  return new Promise((resolve) => {
    const sock = net.createServer();
    sock.once("error", () => resolve(false));
    sock.once("listening", () => sock.close(() => resolve(true)));
    sock.listen(port, HOST);
  });
}

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `cmd /c start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

async function main() {
  if (!fs.existsSync(path.join(SITE, "index.html"))) {
    console.error("Die Ordnerdateien fehlen: 'site/index.html' wurde nicht gefunden.");
    process.exit(1);
  }
  let port = PREFERRED_PORT;
  if (!(await portFree(port))) {
    let found = 0;
    for (let cand = 4174; cand <= 4189; cand++) {
      if (await portFree(cand)) {
        found = cand;
        break;
      }
    }
    if (!found) {
      console.error("Kein freier Port zwischen 4173 und 4189. Bitte einen belegten Vorschau-Prozess beenden.");
      process.exit(1);
    }
    port = found;
  }
  const server = http.createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });
  const url = `http://${HOST}:${port}/`;
  console.log("");
  console.log("Studio Breve – lokale Vorschau (nicht veröffentlicht)");
  console.log("Sprachwahl:  " + url);
  console.log("Deutsch:     " + `http://${HOST}:${port}/de/`);
  console.log("Italienisch: " + `http://${HOST}:${port}/it/`);
  console.log("Verwaltung:  " + `http://${HOST}:${port}/verwaltung/`);
  if (needsSetup()) {
    console.log("Verwaltung: beim ersten Aufruf Passwort festlegen");
  } else if (process.env.ADMIN_PASSWORD && !readAdmin()) {
    console.log("Verwaltung: Kennwort aus ADMIN_PASSWORD");
  }
  console.log("Zum Beenden: Strg+C");
  console.log("");
  setTimeout(() => openBrowser(url), 400);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
