import type { APIRoute } from 'astro';
import {
  checkLoginAllowed,
  clearLoginFailures,
  mintSession,
  needsSetup,
  recordLoginFailure,
  sessionCookie,
  verifyPassword,
} from '../../../lib/admin-auth';
import { truncateIp } from '../../../lib/analytics';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (needsSetup()) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/' } });
  }
  const ip = truncateIp(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1') || '0';
  const gate = checkLoginAllowed(ip);
  if (!gate.ok) {
    return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/?sperre=1' } });
  }
  const form = await request.formData().catch(() => null);
  const pw = String(form?.get('password') || '');
  if (!verifyPassword(pw)) {
    const after = recordLoginFailure(ip);
    if (after.locked) {
      return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/?sperre=1' } });
    }
    return new Response(null, {
      status: 303,
      headers: { location: `/verwaltung/anmelden/?fehler=1&rest=${after.remaining}` },
    });
  }
  clearLoginFailures(ip);
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
