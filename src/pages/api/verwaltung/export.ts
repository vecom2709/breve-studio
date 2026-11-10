import type { APIRoute } from 'astro';
import { isAuthed } from '../../../lib/admin-auth';
import { listVisits } from '../../../lib/analytics';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) return new Response('Nicht angemeldet', { status: 401 });
  const url = new URL(request.url);
  const von = url.searchParams.get('von') || '';
  const bis = url.searchParams.get('bis') || '';
  let rows = await listVisits();
  if (von) rows = rows.filter((r) => r.date >= von);
  if (bis) rows = rows.filter((r) => r.date <= bis);
  const header = ['id','date','startedAt','lang','country','region','city','device','os','browser','screen','source','referrer','pages'];
  const lines = [header.join(',')];
  const q = (s: string) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  for (const r of rows) {
    const pages = r.pages.map((p) => `${p.path}${p.ms != null ? '(' + p.ms + 'ms)' : ''}`).join(' > ');
    lines.push([r.id, r.date, r.startedAt, r.lang, r.country || '', r.region || '', r.city || '', r.device, r.os, r.browser, r.screen, r.source, r.referrer, pages].map(q).join(','));
  }
  const body = '\uFEFF' + lines.join('\n') + '\n';
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="studio-breve-besuche.csv"',
      'cache-control': 'no-store',
    },
  });
};
