import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SERVICIOS = ['congresos', 'diseno-grafico', 'eventos', 'formacion', 'interactivos', 'packaging', 'piezas-de-anatomia', 'produccion-audiovisual', 'streaming-y-webinars'];
const PAGINAS = [
  '/', '/servicios', ...SERVICIOS.map((s) => `/servicios/${s}`), '/plataformas', '/nosotros', '/contacto',
  '/legal/aviso-legal', '/legal/privacidad', '/legal/cookies',
];

// Turnstile (challenges.cloudflare.com) no es accesible desde el contenedor de pruebas:
// se bloquea la petición para que no genere errores de consola ajenos a la web.
test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
});

async function cargar(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('load');
}

for (const path of PAGINAS) {
  test(`${path}: sin desbordamiento horizontal`, async ({ page }) => {
    await cargar(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
  test(`${path}: sin fallos de accesibilidad graves`, async ({ page }) => {
    // Sin movimiento: axe no debe medir contraste a mitad de un fundido de entrada.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await cargar(page, path);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const graves = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(graves, graves.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([]);
  });
  test(`${path}: título, descripción y og:image`, async ({ page }) => {
    await cargar(page, path);
    expect((await page.title()).length).toBeGreaterThan(10);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
}

test('/404: noindex, sin desbordamiento y sin fallos graves de accesibilidad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await cargar(page, '/404');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id)).toEqual([]);
});

test('canonical y og:url: sin .html ni barra final y presentes en el sitemap', async ({ page, request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const path of PAGINAS) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(canonical, path).not.toContain('.html');
    if (canonical !== 'https://ksf.es/') expect(canonical, path).not.toMatch(/\/$/);
    expect(ogUrl, path).toBe(canonical);
    expect(urls, path).toContain(canonical);
  }
});

test('sin errores de consola en la home ni en /contacto', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  for (const p of ['/', '/contacto']) await cargar(page, p);
  // La petición bloqueada de Turnstile deja un "Failed to load resource" que no es de la web.
  expect(errores.filter((e) => !/Failed to load resource|challenges\.cloudflare\.com|ERR_FAILED/.test(e))).toEqual([]);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('la home muestra claim, servicios y cifras', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Convertimos la ciencia');
    await expect(page.locator('[data-svc]')).toHaveCount(9);
    await expect(page.getByText('2.266').first()).toBeVisible();
  });
  test('/contacto muestra el formulario y /servicios/formacion su contenido', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('form')).toBeVisible();
    await page.goto('/servicios/formacion');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('menú móvil sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('el <details> se abre y los enlaces son visibles', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'solo móvil');
    await page.goto('/');
    await page.getByText('Menú').click();
    const nav = page.getByRole('navigation', { name: 'Principal móvil' });
    await expect(nav.getByRole('link', { name: 'Nosotros' })).toBeVisible();
    await nav.getByRole('link', { name: 'Nosotros' }).click();
    await expect(page).toHaveURL(/\/nosotros$/);
  });
});

test('el menú móvil abre y navega', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'solo móvil');
  await page.goto('/');
  await page.getByText('Menú').click();
  await page.getByRole('navigation', { name: 'Principal móvil' }).getByRole('link', { name: 'Nosotros' }).click();
  await expect(page).toHaveURL(/\/nosotros$/);
});

test('sitemap y robots', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://ksf.es/sitemap-index.xml');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});
