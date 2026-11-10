import type { APIRoute } from 'astro';
import { isAuthed } from '../../../lib/admin-auth';
import { writeSettings } from '../../../lib/analytics';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) return new Response(null, { status: 303, headers: { location: '/verwaltung/anmelden/' } });
  const form = await request.formData();
  await writeSettings({ excludeAdmin: form.get('excludeAdmin') === 'yes' });
  return new Response(null, { status: 303, headers: { location: '/verwaltung/?ok=1' } });
};
