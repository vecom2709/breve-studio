import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE = 'sb_admin';
const MAX_AGE = 60 * 60 * 12; // 12 Stunden
const DEFAULT_PREVIEW = 'vorschau-lokal';

const attempts = new Map<string, { n: number; reset: number }>();

export const adminCookieName = COOKIE;

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PREVIEW;
}

export function isPreviewPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

export function defaultPreviewPassword() {
  return DEFAULT_PREVIEW;
}

function secret() {
  return createHash('sha256').update('studio-breve-admin:' + adminPassword()).digest();
}

export function verifyPassword(input: string): boolean {
  const a = scryptSync(input, 'studio-breve-admin', 32);
  const b = scryptSync(adminPassword(), 'studio-breve-admin', 32);
  return timingSafeEqual(a, b);
}

export function allowLoginAttempt(ipKey: string): boolean {
  const now = Date.now();
  const row = attempts.get(ipKey);
  if (!row || now > row.reset) {
    attempts.set(ipKey, { n: 1, reset: now + 15 * 60 * 1000 });
    return true;
  }
  if (row.n >= 5) return false;
  row.n += 1;
  return true;
}

export function mintSession(): string {
  const id = randomBytes(16).toString('hex');
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = createHmac('sha256', secret()).update(`${id}.${exp}`).digest('hex');
  return `${id}.${exp}.${sig}`;
}

export function readSession(token: string | undefined): boolean {
  if (!token) return false;
  const [id, exp, sig] = token.split('.');
  if (!id || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expect = createHmac('sha256', secret()).update(`${id}.${exp}`).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expect, 'hex'));
  } catch {
    return false;
  }
}

export function sessionCookie(token: string, secure: boolean) {
  const parts = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${MAX_AGE}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(secure: boolean) {
  const parts = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function cookieFromHeader(header: string | null): string | undefined {
  if (!header) return;
  const m = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE + '='));
  return m?.slice(COOKIE.length + 1);
}

export function isAuthed(request: Request): boolean {
  return readSession(cookieFromHeader(request.headers.get('cookie')));
}
