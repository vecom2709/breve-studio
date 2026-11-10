import type { APIRoute } from 'astro';
import {
  isAuthed,
  mintSession,
  sessionCookie,
  setPassword,
  validateNewPassword,
  verifyPassword,
} from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/' } });
  }
  const form = await request.formData().catch(() => null);
  const current = String(form?.get('current') || '');
  const pw = String(form?.get('password') || '');
  const repeat = String(form?.get('password2') || form?.get('repeat') || '');
  if (!verifyPassword(current)) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/passwort/?fehler=aktuell' } });
  }
  const err = validateNewPassword(pw, repeat);
  if (err) {
    const code = pw.length < 10 ? 'kurz' : 'wiederholung';
    return new Response(null, { status: 303, headers: { location: `/verwaltung/passwort/?fehler=${code}` } });
  }
  setPassword(pw);
  const secure = new URL(request.url).protocol === 'https:';
  return new Response(null, {
    status: 303,
    headers: {
      location: '/verwaltung/passwort/?ok=1',
      'set-cookie': sessionCookie(mintSession(), secure),
    },
  });
};

export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
