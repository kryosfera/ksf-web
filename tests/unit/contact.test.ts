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
});
