import type { APIRoute } from 'astro';
import {
  uniqueVisitTotal,
  recordView,
  recordTiming,
  parseUA,
  countryFromAcceptLanguage,
  truncateIp,
  readSettings,
} from '../../lib/analytics';
import { isAuthed } from '../../lib/admin-auth';

export const prerender = false;

const SID = /^[A-Za-z0-9._:-]{8,80}$/;

export const GET: APIRoute = async () => {
  const n = await uniqueVisitTotal();
  return new Response(JSON.stringify({ n }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
};

export const POST: APIRoute = async ({ request }) => {
  const dnt = request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1';
  if (dnt) {
    return new Response(JSON.stringify({ ok: true, ignored: 'dnt', n: await uniqueVisitTotal() }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  const settings = await readSettings();
  if (settings.excludeAdmin && isAuthed(request)) {
    return new Response(JSON.stringify({ ok: true, ignored: 'admin', n: await uniqueVisitTotal() }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  const sid = String(body.sid || '');
  const pathName = String(body.path || '/');
  if (!SID.test(sid) || !pathName.startsWith('/') || pathName.length > 300) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  if (body.t === 'timing') {
    await recordTiming(sid, pathName, Number(body.ms));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  const ua = parseUA(request.headers.get('user-agent') || '');
  const utm = body.utm && typeof body.utm === 'object'
    ? Object.fromEntries(Object.entries(body.utm).filter(([k, v]) => typeof k === 'string' && typeof v === 'string').map(([k, v]) => [k.slice(0, 20), String(v).slice(0, 80)]))
    : null;
  truncateIp(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')); // lookup hook only; never stored
  const country = countryFromAcceptLanguage(request.headers.get('accept-language'));
  const result = await recordView({
    id: sid,
    path: pathName,
    referrer: String(body.referrer || '').slice(0, 500),
    utm,
    lang: String(body.lang || '').slice(0, 8),
    country,
    region: null,
    city: null,
    device: ua.device,
    os: ua.os,
    browser: ua.browser,
    screen: String(body.screen || '').slice(0, 20),
  });
  return new Response(JSON.stringify({ ok: true, unique: result.unique, n: result.total }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
