import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COOKIE = 'sb_admin';
const MAX_AGE = 60 * 60 * 12; // 12 Stunden
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 10;
const ENV_SALT = 'studio-breve-admin-env';

export const adminCookieName = COOKIE;
export const minPasswordLength = MIN_PASSWORD_LENGTH;
export const loginAttemptLimit = MAX_ATTEMPTS;
export const loginAttemptWindowMinutes = 15;

type AdminRecord = {
  algo: 'scrypt';
  salt: string;
  hash: string;
  sessionKey: string;
  updatedAt: string;
};

const attempts = new Map<string, { n: number; reset: number }>();

let cached: { file: string; mtime: number; data: AdminRecord } | null = null;

export function adminFile(): string {
  return process.env.ADMIN_FILE ?? path.resolve(process.cwd(), 'data', 'admin.json');
}

function parseRecord(raw: string): AdminRecord | null {
  try {
    const data = JSON.parse(raw) as Partial<AdminRecord>;
    if (
      data?.algo === 'scrypt' &&
      typeof data.salt === 'string' &&
      typeof data.hash === 'string' &&
      typeof data.sessionKey === 'string' &&
      data.salt.length >= 16 &&
      data.hash.length >= 16 &&
      data.sessionKey.length >= 16
    ) {
      return {
        algo: 'scrypt',
        salt: data.salt,
        hash: data.hash,
        sessionKey: data.sessionKey,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
      };
    }
  } catch {
    /* Datei fehlt oder ist unlesbar */
  }
  return null;
}

export function readAdmin(): AdminRecord | null {
  const file = adminFile();
  try {
    const st = fs.statSync(file);
    if (cached && cached.file === file && cached.mtime === st.mtimeMs) return cached.data;
    const data = parseRecord(fs.readFileSync(file, 'utf8'));
    if (!data) {
      cached = null;
      return null;
    }
    cached = { file, mtime: st.mtimeMs, data };
    return data;
  } catch {
    cached = null;
    return null;
  }
}

function writeAdmin(data: AdminRecord) {
  const file = adminFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, file);
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    /* z. B. unter Windows */
  }
  try {
    cached = { file, mtime: fs.statSync(file).mtimeMs, data };
  } catch {
    cached = { file, mtime: Date.now(), data };
  }
}

export function hasStoredPassword(): boolean {
  return !!readAdmin();
}

/** Kein gespeichertes Kennwort und kein ADMIN_PASSWORD: Ersteinrichtung. */
export function needsSetup(): boolean {
  return !readAdmin() && !process.env.ADMIN_PASSWORD;
}

export function hasEnvPassword(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

function scrypt(password: string, salt: string | Buffer): Buffer {
  return scryptSync(password, salt, 32);
}

export function verifyPassword(input: string): boolean {
  let ok = false;
  const rec = readAdmin();
  if (rec) {
    try {
      const got = scrypt(input, Buffer.from(rec.salt, 'hex'));
      const expect = Buffer.from(rec.hash, 'hex');
      if (got.length === expect.length && timingSafeEqual(got, expect)) ok = true;
    } catch {
      /* ungültige Datei */
    }
  }
  const env = process.env.ADMIN_PASSWORD;
  if (env) {
    const a = scrypt(input, ENV_SALT);
    const b = scrypt(env, ENV_SALT);
    if (a.length === b.length && timingSafeEqual(a, b)) ok = true;
  }
  return ok;
}

export function validateNewPassword(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`;
  }
  if (password !== repeat) {
    return 'Die Passwörter stimmen nicht überein.';
  }
  return null;
}

/** Speichert Hash + Salt (und einen neuen Sitzungsschlüssel) in data/admin.json. */
export function setPassword(password: string): void {
  const err = validateNewPassword(password, password);
  if (err) throw new Error(err);
  const salt = randomBytes(16);
  const hash = scrypt(password, salt);
  const sessionKey = randomBytes(32);
  writeAdmin({
    algo: 'scrypt',
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    sessionKey: sessionKey.toString('hex'),
    updatedAt: new Date().toISOString(),
  });
}

export type AttemptState = { ok: boolean; remaining: number; locked: boolean };

function stateFrom(row: { n: number; reset: number } | undefined, now: number): AttemptState {
  if (!row || now > row.reset) return { ok: true, remaining: MAX_ATTEMPTS, locked: false };
  if (row.n >= MAX_ATTEMPTS) return { ok: false, remaining: 0, locked: true };
  return { ok: true, remaining: MAX_ATTEMPTS - row.n, locked: false };
}

export function checkLoginAllowed(ipKey: string): AttemptState {
  return stateFrom(attempts.get(ipKey), Date.now());
}

export function recordLoginFailure(ipKey: string): AttemptState {
  const now = Date.now();
  const row = attempts.get(ipKey);
  if (!row || now > row.reset) {
    const next = { n: 1, reset: now + WINDOW_MS };
    attempts.set(ipKey, next);
    return { ok: true, remaining: MAX_ATTEMPTS - 1, locked: false };
  }
  row.n += 1;
  return stateFrom(row, now);
}

export function clearLoginFailures(ipKey: string) {
  attempts.delete(ipKey);
}

function sessionSecret(): Buffer {
  const rec = readAdmin();
  if (rec?.sessionKey) return Buffer.from(rec.sessionKey, 'hex');
  if (process.env.ADMIN_PASSWORD) {
    return createHash('sha256').update('studio-breve-admin:' + process.env.ADMIN_PASSWORD).digest();
  }
  return createHash('sha256').update('studio-breve-admin:unset').digest();
}

export function mintSession(): string {
  const id = randomBytes(16).toString('hex');
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = createHmac('sha256', sessionSecret()).update(`${id}.${exp}`).digest('hex');
  return `${id}.${exp}.${sig}`;
}

export function readSession(token: string | undefined): boolean {
  if (!token) return false;
  const [id, exp, sig] = token.split('.');
  if (!id || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expect = createHmac('sha256', sessionSecret()).update(`${id}.${exp}`).digest('hex');
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
