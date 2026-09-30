import { SERVICIO_SLUGS } from './servicios';

export interface ContactData { nombre: string; empresa: string; email: string; telefono: string; servicio: string; mensaje: string; token: string }
export interface ContactEnv { RESEND_API_KEY: string; TURNSTILE_SECRET: string; CONTACT_TO: string; CONTACT_FROM: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL = /^[0-9 +()\-.]{0,30}$/;
const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validateContact(input: Record<string, unknown>):
  { ok: true; value: ContactData } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const v: ContactData = { nombre: s(input.nombre), empresa: s(input.empresa), email: s(input.email), telefono: s(input.telefono),
    servicio: s(input.servicio), mensaje: s(input.mensaje), token: s(input['cf-turnstile-response']) };
  if (s(input.web)) errors.web = 'Envío no válido.';
  if (v.nombre.length < 2 || v.nombre.length > 100) errors.nombre = 'Escribe tu nombre.';
  if (v.empresa.length < 2 || v.empresa.length > 120) errors.empresa = 'Escribe el nombre de tu empresa.';
  if (!EMAIL.test(v.email) || v.email.length > 200) errors.email = 'Revisa el email: no parece válido.';
  if (!TEL.test(v.telefono)) errors.telefono = 'El teléfono solo puede llevar números, espacios y + ( ) -.';
  if (v.servicio && v.servicio !== 'otra' && !(SERVICIO_SLUGS as readonly string[]).includes(v.servicio)) errors.servicio = 'Elige una línea de servicio de la lista.';
  if (v.mensaje.length < 10 || v.mensaje.length > 5000) errors.mensaje = 'Cuéntanos tu proyecto en al menos 10 caracteres.';
  const priv = input.privacidad;
  if (!(priv === 'on' || priv === true || priv === 'true')) errors.privacidad = 'Tienes que aceptar la política de privacidad.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: v };
}

export function escapeHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function handleContact(request: Request, env: ContactEnv, fetchFn: typeof fetch = fetch): Promise<Response> {
  let raw: Record<string, unknown>;
  try {
    const ct = request.headers.get('content-type') ?? '';
    raw = ct.includes('application/json') ? await request.json() : Object.fromEntries((await request.formData()).entries());
  } catch { return json({ ok: false, errors: { form: 'No se ha podido leer el formulario.' } }, 400); }

  const r = validateContact(raw);
  if (!r.ok) return json({ ok: false, errors: r.errors }, 400);
  const d = r.value;

  const ts = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: d.token, remoteip: request.headers.get('CF-Connecting-IP') ?? undefined }),
  }).then((x) => x.json() as Promise<{ success: boolean }>).catch(() => ({ success: false }));
  if (!ts.success) return json({ ok: false, errors: { token: 'No hemos podido verificar que no eres un robot. Vuelve a intentarlo.' } }, 400);

  const rows = [['Nombre', d.nombre], ['Empresa', d.empresa], ['Email', d.email], ['Teléfono', d.telefono || '—'], ['Servicio', d.servicio || '—']]
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`).join('');
  const send = (payload: object) => fetchFn('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });

  const aviso = await send({ from: `Web KSF <${env.CONTACT_FROM}>`, to: [env.CONTACT_TO], reply_to: d.email,
    subject: `Nueva propuesta: ${d.empresa}${d.servicio ? ` · ${d.servicio}` : ''}`,
    html: `<table>${rows}</table><p>${escapeHtml(d.mensaje).replace(/\n/g, '<br>')}</p>` }).catch(() => null);
  if (!aviso || !aviso.ok) return json({ ok: false, error: 'envio' }, 502);

  await send({ from: `KSF Digital Healthcare <${env.CONTACT_FROM}>`, to: [d.email], reply_to: env.CONTACT_TO,
    subject: 'Hemos recibido tu solicitud · KSF Digital Healthcare',
    html: `<p>Hola, ${escapeHtml(d.nombre)}:</p><p>Hemos recibido tu solicitud y te responderemos en breve.</p><p>KSF Digital Healthcare · info@ksf.es</p>` }).catch(() => null);

  return json({ ok: true });
}
