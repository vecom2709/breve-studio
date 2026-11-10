import type { APIRoute } from 'astro';
import {
  mintSession,
  needsSetup,
  sessionCookie,
  setPassword,
  validateNewPassword,
} from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!needsSetup()) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/' } });
  }
  const form = await request.formData().catch(() => null);
  const pw = String(form?.get('password') || '');
  const repeat = String(form?.get('password2') || form?.get('repeat') || '');
  const err = validateNewPassword(pw, repeat);
  if (err) {
    const code = pw.length < 10 ? 'kurz' : 'wiederholung';
    return new Response(null, { status: 303, headers: { location: `/verwaltung/?fehler=${code}` } });
  }
  setPassword(pw);
  const secure = new URL(request.url).protocol === 'https:';
  return new Response(null, {
    status: 303,
    headers: {
      location: '/verwaltung/',
      'set-cookie': sessionCookie(mintSession(), secure),
    },
  });
};

export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
