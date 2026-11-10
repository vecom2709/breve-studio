import type { APIRoute } from 'astro';
import { clearCookie } from '../../../lib/admin-auth';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const secure = new URL(request.url).protocol === 'https:';
  return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/', 'set-cookie': clearCookie(secure) } });
};
export const GET: APIRoute = POST;
