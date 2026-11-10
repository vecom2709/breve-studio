/**
 * Lokale Ablage von Anfragen. Schreibt ausschließlich in eine JSON-Datei auf
 * diesem Rechner. Es wird KEINE E-Mail versendet und nichts an Dritte übertragen.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export interface Inquiry {
  id: string;
  createdAt: string;
  siteLang: 'de' | 'it';
  preferredLanguage: 'de' | 'it' | 'en';
  name: string;
  email: string;
  package: string | null;
  intent: string;
  message: string;
  consent: { processing: true; marketing: boolean; textVersion: string };
  source: string;
}

export const inquiriesFile = () =>
  process.env.INQUIRIES_FILE ?? path.resolve(process.cwd(), 'data', 'inquiries.json');

async function readAll(): Promise<Inquiry[]> {
  try {
    const raw = await fs.readFile(inquiriesFile(), 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    if (e?.code === 'ENOENT') return [];
    throw e;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Hängt eine Anfrage an (serialisiert, atomar per temporärer Datei + rename). */
export function appendInquiry(entry: Omit<Inquiry, 'id' | 'createdAt'>): Promise<Inquiry> {
  const job = queue.then(async () => {
    const file = inquiriesFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const all = await readAll();
    const now = new Date();
    const id = `SB-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const full: Inquiry = { id, createdAt: now.toISOString(), ...entry };
    all.push(full);
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, file);
    return full;
  });
  queue = job.catch(() => undefined);
  return job;
}

export async function findInquiry(id: string): Promise<Inquiry | undefined> {
  if (!/^SB-\d{8}-[0-9A-F]{6}$/.test(id)) return undefined;
  return (await readAll()).find((i) => i.id === id);
}
