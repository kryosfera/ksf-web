import { describe, it, expect } from 'vitest';
import { REDIRECTS, toRedirectsFile } from '../../src/lib/redirects';

const file = toRedirectsFile(REDIRECTS);
const lines = file.trim().split('\n');

describe('redirecciones', () => {
  it('cubre las páginas principales antiguas', () => {
    expect(lines).toContain('/soluciones /servicios 301');
    expect(lines).toContain('/contact /contacto 301');
    expect(lines).toContain('/aviso-legal /legal/aviso-legal 301');
    expect(lines).toContain('/politica-de-privacidad /legal/privacidad 301');
    expect(lines).toContain('/politica-de-cookies /legal/cookies 301');
    expect(lines).toContain('/webinars/* /servicios/streaming-y-webinars 301');
  });
  it('añade la variante con barra final de las rutas exactas', () => {
    expect(lines).toContain('/soluciones/ /servicios 301');
    expect(lines).not.toContain('/webinars/*/ /servicios/streaming-y-webinars 301');
  });
  it('pone las rutas exactas antes que los comodines (gana la primera coincidencia)', () => {
    const iExact = lines.indexOf('/kyowa/streaming /servicios/streaming-y-webinars 301');
    const iSplat = lines.indexOf('/kyowa/* / 301');
    expect(iExact).toBeGreaterThanOrEqual(0);
    expect(iExact).toBeLessThan(iSplat);
  });
  it.each(['/clientes', '/organizaciones', '/provincia', '/informes', '/post'])('redirige la ruta base %s (con y sin barra) a /nosotros antes que su comodín', (base) => {
    const i = lines.indexOf(`${base} /nosotros 301`);
    const iBarra = lines.indexOf(`${base}/ /nosotros 301`);
    const iSplat = lines.findIndex((l) => l.startsWith(`${base}/* `));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(iBarra).toBeGreaterThanOrEqual(0);
    expect(iSplat).toBeGreaterThan(Math.max(i, iBarra));
  });
  it('no redirige ninguna ruta a sí misma', () => {
    for (const [from, to] of REDIRECTS) expect(from).not.toBe(to);
  });
  it('no tiene orígenes duplicados', () => {
    const froms = REDIRECTS.map(([f]) => f);
    expect(new Set(froms).size).toBe(froms.length);
  });
});
