import { SERVICIO_SLUGS } from './servicios';

export interface ContactData { nombre: string; empresa: string; email: string; telefono: string; servicio: string; mensaje: string; token: string }
export interface ContactEnv { RESEND_API_KEY: string; TURNSTILE_SECRET: string; CONTACT_TO: string; CONTACT_FROM: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL = /^[0-9 +()\-.]{0,30}$/;
const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
/** Para valores de una sola línea (asunto, cabeceras): sin saltos ni caracteres de control. */
const line = (v: unknown) => s(v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

export function validateContact(input: Record<string, unknown>):
  { ok: true; value: ContactData } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const v: ContactData = { nombre: line(input.nombre), empresa: line(input.empresa), email: s(input.email), telefono: line(input.telefono),
    servicio: line(input.servicio), mensaje: s(input.mensaje), token: s(input['cf-turnstile-response']) };
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

export const MAX_BODY_BYTES = 32 * 1024;
/** Dominios desde los que se acepta el token de Turnstile: producción, local y el proyecto de Pages con sus vistas previas. */
const HOSTNAME_OK = /^(ksf\.es|www\.ksf\.es|localhost|([a-z0-9-]+\.)?ksf-web\.pages\.dev)$/;
const ENV_KEYS = ['RESEND_API_KEY', 'TURNSTILE_SECRET', 'CONTACT_TO', 'CONTACT_FROM'] as const;

/** Lee el cuerpo contando bytes (haya o no Content-Length); null si pasa de `max`. */
async function readBody(request: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

export async function handleContact(request: Request, env: ContactEnv, fetchFn: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'metodo' }), { status: 405, headers: { 'content-type': 'application/json', Allow: 'POST' } });
  const missing = ENV_KEYS.filter((k) => !env?.[k]);
  if (missing.length) {
    console.error(`contacto: falta ${missing.join(', ')}`);
    return json({ ok: false, error: 'configuracion' }, 500);
  }
  const len = Number(request.headers.get('content-length') ?? 0);
  if (len > MAX_BODY_BYTES) return json({ ok: false, error: 'tamano' }, 413);
  const ct = (request.headers.get('content-type') ?? '').toLowerCase();
  const isJson = ct.includes('application/json');
  if (!isJson && !ct.includes('multipart/form-data') && !ct.includes('application/x-www-form-urlencoded')) return json({ ok: false, error: 'tipo' }, 415);

  let bytes: Uint8Array<ArrayBuffer> | null;
  try { bytes = await readBody(request, MAX_BODY_BYTES); } catch { bytes = new Uint8Array(); }
  if (!bytes) return json({ ok: false, error: 'tamano' }, 413);

  let raw: unknown;
  try {
    raw = isJson ? JSON.parse(new TextDecoder().decode(bytes))
      : Object.fromEntries((await new Response(bytes, { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData()).entries());
  } catch { return json({ ok: false, errors: { form: 'No se ha podido leer el formulario.' } }, 400); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return json({ ok: false, errors: { form: 'No se ha podido leer el formulario.' } }, 400);
  const body = raw as Record<string, unknown>;

  // Campo trampa relleno: se responde como si fuera bien, sin enviar nada ni delatar la trampa.
  if (s(body.web)) return json({ ok: true });

  const r = validateContact(body);
  if (!r.ok) return json({ ok: false, errors: r.errors }, 400);
  const d = r.value;

  const ts = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: d.token, remoteip: request.headers.get('CF-Connecting-IP') ?? undefined }),
  }).then((x) => x.json() as Promise<{ success: boolean; hostname?: string }>).catch(() => { console.error('contacto: turnstile sin respuesta'); return { success: false } as { success: boolean; hostname?: string }; });
  const hostOk = !ts.hostname || HOSTNAME_OK.test(ts.hostname);
  if (!ts.success || !hostOk) {
    if (ts.success) console.error('contacto: turnstile hostname no permitido');
    return json({ ok: false, errors: { token: 'No hemos podido verificar que no eres un robot. Vuelve a intentarlo.' } }, 400);
  }

  const rows = [['Nombre', d.nombre], ['Empresa', d.empresa], ['Email', d.email], ['Teléfono', d.telefono || '—'], ['Servicio', d.servicio || '—']]
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`).join('');
  const send = (payload: object) => fetchFn('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });

  const aviso = await send({ from: `Web KSF <${env.CONTACT_FROM}>`, to: [env.CONTACT_TO], reply_to: d.email,
    subject: `Nueva propuesta: ${d.empresa}${d.servicio ? ` · ${d.servicio}` : ''}`,
    html: `<table>${rows}</table><p>${escapeHtml(d.mensaje).replace(/\n/g, '<br>')}</p>` }).catch(() => null);
  if (!aviso || !aviso.ok) {
    console.error('contacto: fallo resend aviso', aviso ? aviso.status : 'red');
    return json({ ok: false, error: 'envio' }, 502);
  }

  // Acuse con texto fijo: no repite ningún campo libre del usuario.
  const acuse = await send({ from: `KSF Digital Healthcare <${env.CONTACT_FROM}>`, to: [d.email], reply_to: env.CONTACT_TO,
    subject: 'Hemos recibido tu solicitud · KSF Digital Healthcare',
    html: '<p>Hola:</p><p>Hemos recibido tu solicitud y te responderemos en breve.</p><p>KSF Digital Healthcare · info@ksf.es</p>' }).catch(() => null);
  if (!acuse || !acuse.ok) console.error('contacto: fallo resend acuse', acuse ? acuse.status : 'red');

  return json({ ok: true });
}
