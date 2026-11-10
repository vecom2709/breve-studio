/**
 * Erste-Partei-Reichweitenmessung, nur lokal, ohne Cookies und ohne volle IP.
 * Unique visits: eine Session zählt pro Kalendertag höchstens einmal.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export const ANALYTICS_TZ = 'Europe/Rome';
const RETENTION_DAYS = 365;

export interface PageHit { path: string; enteredAt: string; ms?: number }
export interface Visit {
  id: string;
  date: string;
  startedAt: string;
  pages: PageHit[];
  referrer: string;
  source: string;
  utm: Record<string, string> | null;
  lang: string;
  country: string | null;
  region: string | null;
  city: string | null;
  device: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screen: string;
}

export interface AnalyticsSettings { excludeAdmin: boolean }

const root = () => process.env.ANALYTICS_DIR ?? path.resolve(process.cwd(), 'data', 'analytics');
const visitsFile = () => path.join(root(), 'visits.jsonl');
const dailyFile = () => path.join(root(), 'daily.json');
const settingsFile = () => path.join(root(), 'settings.json');

export function todayStamp(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ANALYTICS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

async function ensureDir() {
  await fs.mkdir(root(), { recursive: true });
}

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

export async function readDaily(): Promise<Record<string, number>> {
  try {
    const raw = JSON.parse(await fs.readFile(dailyFile(), 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e: any) {
    if (e?.code === 'ENOENT') return {};
    throw e;
  }
}

export async function uniqueVisitTotal(): Promise<number> {
  const daily = await readDaily();
  return Object.values(daily).reduce((a, b) => a + (Number(b) || 0), 0);
}

export async function readSettings(): Promise<AnalyticsSettings> {
  try {
    const raw = JSON.parse(await fs.readFile(settingsFile(), 'utf8'));
    return { excludeAdmin: !!raw.excludeAdmin };
  } catch {
    return { excludeAdmin: true };
  }
}

export async function writeSettings(next: AnalyticsSettings) {
  await ensureDir();
  const tmp = settingsFile() + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, settingsFile());
}

export function parseUA(ua: string) {
  const u = ua || '';
  let browser = 'Unbekannt';
  if (/Edg\//i.test(u)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(u)) browser = 'Opera';
  else if (/Chrome\//i.test(u) && !/Chromium/i.test(u)) browser = 'Chrome';
  else if (/Firefox\//i.test(u)) browser = 'Firefox';
  else if (/Safari/i.test(u) && !/Chrome/i.test(u)) browser = 'Safari';
  let os = 'Unbekannt';
  if (/Windows NT/i.test(u)) os = 'Windows';
  else if (/Mac OS X/i.test(u)) os = 'macOS';
  else if (/Android/i.test(u)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(u)) os = 'iOS';
  else if (/Linux/i.test(u)) os = 'Linux';
  let device: Visit['device'] = 'desktop';
  if (/iPad|Tablet|PlayBook/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) device = 'tablet';
  else if (/Mobi|iPhone|Android/i.test(u)) device = 'mobile';
  return { browser, os, device };
}

export function countryFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  const m = /^[a-z]{2,3}[-_]([A-Z]{2})/i.exec(header.split(',')[0]?.trim() ?? '');
  return m ? m[1].toUpperCase() : null;
}

export function truncateIp(ip: string | null): string | null {
  if (!ip) return null;
  const v = ip.replace(/^::ffff:/, '').split(',')[0].trim();
  if (!v || v === '127.0.0.1' || v === '::1') return v;
  if (v.includes('.')) {
    const p = v.split('.');
    if (p.length === 4) return `${p[0]}.${p[1]}.${p[2]}.0`;
  }
  if (v.includes(':')) {
    const parts = v.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  return null;
}

export function classifySource(referrer: string, utm: Record<string, string> | null): string {
  if (utm && (utm.source || utm.medium || utm.campaign)) return utm.source || utm.medium || 'utm';
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (!host || host === '127.0.0.1' || host === 'localhost' || host.endsWith('studiobreve.it')) return 'direct';
    return host;
  } catch {
    return 'direct';
  }
}

export function isAdminPath(p: string) {
  return p.startsWith('/verwaltung') || p.startsWith('/api/verwaltung');
}

async function loadVisits(): Promise<Visit[]> {
  const file = visitsFile();
  try {
    await fs.access(file);
  } catch {
    return [];
  }
  const out: Visit[] = [];
  const rl = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* skip bad line */ }
  }
  return out;
}

async function rewriteVisits(rows: Visit[]) {
  await ensureDir();
  const tmp = visitsFile() + '.tmp';
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');
  await fs.writeFile(tmp, body, 'utf8');
  await fs.rename(tmp, visitsFile());
}

async function purgeOldVisitsUnlocked(now = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86400000);
  const cut = todayStamp(cutoff);
  const rows = await loadVisits();
  const kept = rows.filter((r) => r.date >= cut);
  if (kept.length !== rows.length) await rewriteVisits(kept);
  return rows.length - kept.length;
}

export async function purgeOldVisits(now = new Date()) {
  return serial(() => purgeOldVisitsUnlocked(now));
}

export async function recordView(input: {
  id: string;
  path: string;
  referrer: string;
  utm: Record<string, string> | null;
  lang: string;
  country: string | null;
  region: string | null;
  city: string | null;
  device: Visit['device'];
  os: string;
  browser: string;
  screen: string;
}): Promise<{ unique: boolean; total: number }> {
  if (isAdminPath(input.path)) return { unique: false, total: await uniqueVisitTotal() };
  return serial(async () => {
    await ensureDir();
    await purgeOldVisitsUnlocked();
    const date = todayStamp();
    const rows = await loadVisits();
    const existing = rows.find((r) => r.id === input.id && r.date === date);
    if (existing) {
      if (!existing.pages.some((p) => p.path === input.path && !p.ms)) {
        existing.pages.push({ path: input.path, enteredAt: new Date().toISOString() });
      }
      await rewriteVisits(rows);
      return { unique: false, total: await uniqueVisitTotal() };
    }
    const visit: Visit = {
      id: input.id,
      date,
      startedAt: new Date().toISOString(),
      pages: [{ path: input.path, enteredAt: new Date().toISOString() }],
      referrer: input.referrer.slice(0, 500),
      source: classifySource(input.referrer, input.utm),
      utm: input.utm,
      lang: input.lang.slice(0, 8),
      country: input.country,
      region: input.region,
      city: input.city,
      device: input.device,
      os: input.os,
      browser: input.browser,
      screen: input.screen.slice(0, 20),
    };
    await fs.appendFile(visitsFile(), JSON.stringify(visit) + '\n', 'utf8');
    const daily = await readDaily();
    daily[date] = (daily[date] || 0) + 1;
    const tmp = dailyFile() + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(daily) + '\n', 'utf8');
    await fs.rename(tmp, dailyFile());
    const total = Object.values(daily).reduce((a, b) => a + (Number(b) || 0), 0);
    return { unique: true, total };
  });
}

export async function recordTiming(id: string, pagePath: string, ms: number) {
  if (isAdminPath(pagePath) || !Number.isFinite(ms) || ms < 0) return;
  return serial(async () => {
    const date = todayStamp();
    const rows = await loadVisits();
    const visit = rows.find((r) => r.id === id && r.date === date);
    if (!visit) return;
    const hit = [...visit.pages].reverse().find((p) => p.path === pagePath);
    if (hit) hit.ms = Math.min(Math.round(ms), 1000 * 60 * 60 * 6);
    await rewriteVisits(rows);
  });
}

export async function listVisits(): Promise<Visit[]> {
  await purgeOldVisits();
  return loadVisits();
}
