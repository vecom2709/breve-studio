import type { APIRoute } from 'astro';
import { allowLoginAttempt, mintSession, sessionCookie, verifyPassword } from '../../../lib/admin-auth';
import { truncateIp } from '../../../lib/analytics';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ip = truncateIp(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1') || '0';
  if (!allowLoginAttempt(ip)) {
    return new Response('Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.', { status: 429, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const form = await request.formData().catch(() => null);
  const pw = String(form?.get('password') || '');
  if (!verifyPassword(pw)) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/?fehler=1' } });
  }
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
