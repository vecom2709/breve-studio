import type { APIRoute } from 'astro';
import { appendInquiry } from '../../lib/inquiries';
import { getPackage, bundles } from '../../content/packages';
import { ui, path } from '../../lib/i18n';

export const prerender = false;

const CONSENT_VERSION = 'consent-2026-11-09';

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const s = (k: string, max = 4000) => String(form.get(k) ?? '').trim().slice(0, max);
  const lang = s('lang') === 'it' ? 'it' : 'de';
  const t = ui[lang].form.errors;

  // Honeypot-Feld ausgefüllt: vermutlich automatisiert, nicht speichern
  if (s('website')) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const name = s('name', 120);
  const email = s('email', 200);
  const message = s('message', 4000);
  const consent = s('consent') === 'yes';
  const marketing = s('marketing') === 'yes';
  const prefRaw = s('language');
  const preferredLanguage = prefRaw === 'it' || prefRaw === 'en' ? prefRaw : 'de';
  const pkgRaw = s('package', 80);
  const validPkg =
    !pkgRaw ? null :
    pkgRaw.startsWith('bundle:') ? (bundles.some((b) => `bundle:${b.slug}` === pkgRaw) ? pkgRaw : null) :
    getPackage(pkgRaw) ? pkgRaw : null;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = t.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = t.email;
  if (message.length < 10) errors.message = t.message;
  if (!consent) errors.consent = t.consent;

  const back = s('source', 200).startsWith('/') ? s('source', 200) : path('contact', lang);

  if (Object.keys(errors).length) {
    if (wantsJson) return new Response(JSON.stringify({ ok: false, errors }), { status: 422, headers: { 'content-type': 'application/json' } });
    return new Response(null, { status: 303, headers: { location: `${back}?fehler=1#formular` } });
  }

  try {
    const saved = await appendInquiry({
      siteLang: lang,
      preferredLanguage,
      name,
      email,
      package: validPkg,
      intent: s('intent', 20) || 'general',
      message,
      consent: { processing: true, marketing, textVersion: CONSENT_VERSION },
      source: back,
    });
    const redirect = `${path('thanks', lang)}?ref=${encodeURIComponent(saved.id)}`;
    if (wantsJson) return new Response(JSON.stringify({ ok: true, id: saved.id, redirect }), { status: 201, headers: { 'content-type': 'application/json' } });
    return new Response(null, { status: 303, headers: { location: redirect } });
  } catch (err) {
    console.error('[inquiry] Speichern fehlgeschlagen', err);
    if (wantsJson) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'content-type': 'application/json' } });
    return new Response(null, { status: 303, headers: { location: `${back}?fehler=1#formular` } });
  }
};

export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
