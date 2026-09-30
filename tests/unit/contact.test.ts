import { describe, it, expect, vi } from 'vitest';
import { validateContact, handleContact, escapeHtml } from '../../src/lib/contact';

const base = { nombre: 'Ana López', empresa: 'Lab SA', email: 'ana@lab.es', telefono: '+34 600 000 000',
  servicio: 'congresos', mensaje: 'Queremos un stand para ERS 2027.', privacidad: 'on', web: '', 'cf-turnstile-response': 'tok' };
const env = { RESEND_API_KEY: 're_x', TURNSTILE_SECRET: 'ts', CONTACT_TO: 'info@ksf.es', CONTACT_FROM: 'web@ksf.es' };

function req(data: Record<string, string>) {
  const fd = new FormData(); Object.entries(data).forEach(([k, v]) => fd.append(k, v));
  return new Request('https://ksf.es/api/contacto', { method: 'POST', body: fd, headers: { 'CF-Connecting-IP': '1.2.3.4' } });
}
function fakeFetch(turnstileOk: boolean, resendOk: boolean) {
  return vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
    const u = String(url);
    if (u.includes('turnstile')) return new Response(JSON.stringify({ success: turnstileOk }));
    return new Response(resendOk ? '{"id":"1"}' : '{"message":"err"}', { status: resendOk ? 200 : 500 });
  });
}

describe('validateContact', () => {
  it('acepta un envío correcto', () => { expect(validateContact(base).ok).toBe(true); });
  it('exige nombre, empresa, email, mensaje y privacidad', () => {
    const r = validateContact({ ...base, nombre: '', empresa: '', email: 'x', mensaje: 'corto', privacidad: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['email', 'empresa', 'mensaje', 'nombre', 'privacidad']);
  });
  it('rechaza un servicio que no existe', () => {
    const r = validateContact({ ...base, servicio: 'jardineria' });
    expect(r.ok).toBe(false);
  });
  it('acepta servicio vacío u "otra"', () => {
    expect(validateContact({ ...base, servicio: '' }).ok).toBe(true);
    expect(validateContact({ ...base, servicio: 'otra' }).ok).toBe(true);
  });
  it('marca como spam si el campo trampa viene relleno', () => {
    const r = validateContact({ ...base, web: 'http://spam' });
    expect(r.ok).toBe(false); if (!r.ok) expect(r.errors.web).toBeDefined();
  });
});

describe('escapeHtml', () => {
  it('escapa etiquetas', () => { expect(escapeHtml('<b>"x"&</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;'); });
});

describe('handleContact', () => {
  it('200 y dos emails (aviso + acuse) cuando todo va bien', async () => {
    const f = fakeFetch(true, true);
    const r = await handleContact(req(base), env, f as unknown as typeof fetch);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const resendCalls = f.mock.calls.filter(([u]) => String(u).includes('resend'));
    expect(resendCalls).toHaveLength(2);
    const aviso = JSON.parse((resendCalls[0][1] as RequestInit).body as string);
    expect(aviso.to).toEqual(['info@ksf.es']);
    expect(aviso.reply_to).toBe('ana@lab.es');
  });
  it('400 si Turnstile rechaza', async () => {
    const r = await handleContact(req(base), env, fakeFetch(false, true) as unknown as typeof fetch);
    expect(r.status).toBe(400);
    expect((await r.json()).errors.token).toBeDefined();
  });
  it('502 si Resend falla', async () => {
    const r = await handleContact(req(base), env, fakeFetch(true, false) as unknown as typeof fetch);
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ok: false, error: 'envio' });
  });
  it('400 con errores de validación sin llamar a nadie', async () => {
    const f = fakeFetch(true, true);
    const r = await handleContact(req({ ...base, email: 'mal' }), env, f as unknown as typeof fetch);
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it('405 si no es POST', async () => {
    const r = await handleContact(new Request('https://ksf.es/api/contacto', { method: 'GET' }), env, fakeFetch(true, true) as unknown as typeof fetch);
    expect(r.status).toBe(405);
  });
  it('413 si Content-Length supera 32 KB', async () => {
    const q = new Request('https://ksf.es/api/contacto', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json', 'content-length': '40000' } });
    expect((await handleContact(q, env, fakeFetch(true, true) as unknown as typeof fetch)).status).toBe(413);
  });
  it('413 sin Content-Length si el cuerpo leído supera 32 KB, sin llamar a nadie', async () => {
    const trozo = new TextEncoder().encode('x'.repeat(8 * 1024));
    let enviados = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(c) { if (enviados++ < 6) c.enqueue(trozo); else c.close(); } });
    const q = new Request('https://ksf.es/api/contacto', { method: 'POST', body: stream, headers: { 'content-type': 'application/x-www-form-urlencoded' }, duplex: 'half' } as RequestInit);
    expect(q.headers.get('content-length')).toBeNull();
    const f = fakeFetch(true, true);
    expect((await handleContact(q, env, f as unknown as typeof fetch)).status).toBe(413);
    expect(f).not.toHaveBeenCalled();
  });
  it('un cuerpo pequeño en stream sin Content-Length se procesa', async () => {
    const body = new TextEncoder().encode(new URLSearchParams(base).toString());
    const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(body); c.close(); } });
    const q = new Request('https://ksf.es/api/contacto', { method: 'POST', body: stream, headers: { 'content-type': 'application/x-www-form-urlencoded' }, duplex: 'half' } as RequestInit);
    expect((await handleContact(q, env, fakeFetch(true, true) as unknown as typeof fetch)).status).toBe(200);
  });
  it.each(['RESEND_API_KEY', 'TURNSTILE_SECRET', 'CONTACT_TO', 'CONTACT_FROM'] as const)('500 y console.error si falta %s', async (k) => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const f = fakeFetch(true, true);
    const r = await handleContact(req(base), { ...env, [k]: '' }, f as unknown as typeof fetch);
    expect(r.status).toBe(500);
    expect(f).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledWith(`contacto: falta ${k}`);
    err.mockRestore();
  });
  it.each(['ksf.es', 'www.ksf.es', 'localhost', 'ksf-web.pages.dev', 'a1b2c3d4.ksf-web.pages.dev', 'main.ksf-web.pages.dev', 'nueva.ksf.es', 'ksf-web.joaquin-05a.workers.dev', '1a2b3c4d-ksf-web.joaquin-05a.workers.dev'])('acepta el hostname %s', async (h) => {
    const f = vi.fn(async (u: string | URL | Request, _i?: RequestInit) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true, hostname: h })) : new Response('{}'));
    expect((await handleContact(req(base), env, f as unknown as typeof fetch)).status).toBe(200);
  });
  it.each(['otro.pages.dev', 'ksf-web.pages.dev.evil.com', 'x.y.ksf-web.pages.dev', 'ksf.es.evil.com', 'otro.joaquin-05a.workers.dev', 'ksf-web.otro.workers.dev'])('rechaza el hostname %s', async (h) => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const f = vi.fn(async (u: string | URL | Request, _i?: RequestInit) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true, hostname: h })) : new Response('{}'));
    expect((await handleContact(req(base), env, f as unknown as typeof fetch)).status).toBe(400);
    err.mockRestore();
  });
  it('415 si el Content-Type no es admitido', async () => {
    const q = new Request('https://ksf.es/api/contacto', { method: 'POST', body: 'x', headers: { 'content-type': 'text/plain' } });
    expect((await handleContact(q, env, fakeFetch(true, true) as unknown as typeof fetch)).status).toBe(415);
  });
  it.each(['null', '[]', '5', '"x"'])('400 si el JSON es %s', async (b) => {
    const q = new Request('https://ksf.es/api/contacto', { method: 'POST', body: b, headers: { 'content-type': 'application/json' } });
    expect((await handleContact(q, env, fakeFetch(true, true) as unknown as typeof fetch)).status).toBe(400);
  });
  it('honeypot relleno: 200 ok sin llamar a nadie', async () => {
    const f = fakeFetch(true, true);
    const r = await handleContact(req({ ...base, web: 'http://spam' }), env, f as unknown as typeof fetch);
    expect(r.status).toBe(200); expect(await r.json()).toEqual({ ok: true }); expect(f).not.toHaveBeenCalled();
  });
  it('el acuse no repite nombre ni texto libre del usuario', async () => {
    const f = fakeFetch(true, true);
    await handleContact(req({ ...base, nombre: 'Gana500 bit.ly/zz', empresa: 'EmpresaXYZ', mensaje: 'Mensaje secreto largo' }), env, f as unknown as typeof fetch);
    const calls = f.mock.calls.filter(([u]) => String(u).includes('resend'));
    const acuse = JSON.parse((calls[1][1] as RequestInit).body as string);
    expect(acuse.to).toEqual(['ana@lab.es']);
    for (const t of ['Gana500', 'bit.ly', 'EmpresaXYZ', 'secreto']) expect(acuse.html + acuse.subject).not.toContain(t);
  });
  it('asunto sin saltos de línea', async () => {
    const f = fakeFetch(true, true);
    await handleContact(req({ ...base, empresa: 'Lab\r\nBcc: x@y.z' }), env, f as unknown as typeof fetch);
    const aviso = JSON.parse((f.mock.calls.find(([u]) => String(u).includes('resend'))![1] as RequestInit).body as string);
    expect(aviso.subject).not.toMatch(/[\r\n]/);
  });
  it('400 si Turnstile devuelve un hostname ajeno', async () => {
    const f = vi.fn(async (u: string | URL | Request, _i?: RequestInit) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true, hostname: 'evil.com' })) : new Response('{}'));
    expect((await handleContact(req(base), env, f as unknown as typeof fetch)).status).toBe(400);
  });
  it('registra con console.error sin datos personales cuando Resend falla, y el acuse fallido no bloquea', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleContact(req(base), env, fakeFetch(true, false) as unknown as typeof fetch);
    expect(err).toHaveBeenCalled();
    const txt = JSON.stringify(err.mock.calls);
    expect(txt).not.toContain('ana@lab.es'); expect(txt).not.toContain('re_x');
    err.mockClear();
    let n = 0;
    const f = vi.fn(async (u: string | URL | Request, _i?: RequestInit) => String(u).includes('turnstile') ? new Response('{"success":true}') : (++n === 1 ? new Response('{}') : new Response('{}', { status: 500 })));
    const r = await handleContact(req(base), env, f as unknown as typeof fetch);
    expect(r.status).toBe(200); expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
