// Referencias cruzadas sobre el build (dist/ lo genera el webServer de Playwright antes de los tests).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { REDIRECTS, toRedirectsFile } from '../../src/lib/redirects';

const DIST = 'dist';

/** ¿La ruta /x del sitio se sirve desde dist/? (build.format 'file': /x → x.html; / → index.html) */
function existe(ruta: string): boolean {
  const p = decodeURI(ruta.split(/[?#]/)[0]).replace(/\/+$/, '');
  if (p === '') return existsSync(join(DIST, 'index.html'));
  const f = join(DIST, p);
  return (existsSync(f) && statSync(f).isFile()) || existsSync(`${f}.html`) || existsSync(join(f, 'index.html'));
}

function paginas(dir = DIST): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? (e === '_astro' ? [] : paginas(p)) : e.endsWith('.html') ? [p] : [];
  });
}

const soloUnaVez = () => test.skip(test.info().project.name !== 'desktop', 'no depende del dispositivo: solo una vez');

test('cada destino de REDIRECTS existe en dist/ y _redirects está al día', () => {
  soloUnaVez();
  for (const [from, to] of REDIRECTS) expect(existe(to), `${from} → ${to}`).toBe(true);
  expect(readFileSync(join(DIST, '_redirects'), 'utf8')).toContain(toRedirectsFile(REDIRECTS).trim());
});

test('todos los href internos de todas las páginas resuelven', () => {
  soloUnaVez();
  const html = paginas();
  expect(html.length).toBeGreaterThan(10);
  const rotos: string[] = [];
  let revisados = 0;
  for (const f of html) {
    const src = readFileSync(f, 'utf8');
    for (const [, href] of src.matchAll(/\shref="([^"]*)"/g)) {
      let ruta: string | null = null;
      if (href.startsWith('/') && !href.startsWith('//')) ruta = href;
      else if (/^https:\/\/(www\.)?ksf\.es(\/|$)/.test(href)) ruta = new URL(href).pathname;
      if (ruta === null) continue;
      revisados++;
      if (!existe(ruta)) rotos.push(`${f}: ${href}`);
    }
  }
  expect(revisados).toBeGreaterThan(100);
  expect(rotos).toEqual([]);
});
