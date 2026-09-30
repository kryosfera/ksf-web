import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const reel = JSON.parse(readFileSync('src/data/reel.json', 'utf8')) as { shots: Array<{ imagen: string }> };
const NOMBRES = reel.shots.map((s) => s.imagen.replace(/\.[^.]+$/, ''));
/** Registra las imágenes del reel (/_astro/<nombre>.*) que pide la página. */
function contarReel(page: Page): string[] {
  const pedidas: string[] = [];
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith('/_astro/') && NOMBRES.some((n) => p.startsWith(`/_astro/${n}.`))) pedidas.push(p);
  });
  return pedidas;
}

const L3 = '[data-hero-reel] [data-l3-t]';

test('muestra el claim y el primer rótulo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Convertimos la ciencia');
  await expect(page.locator(L3)).toHaveText('Desde plató');
});

test('el reel avanza solo y se puede pausar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(L3)).not.toHaveText('Desde plató', { timeout: 9000 });
  await page.locator('[data-pause]').click();
  const t = await page.locator(L3).textContent();
  await page.waitForTimeout(6000);
  await expect(page.locator(L3)).toHaveText(t ?? '');
});

test('un segmento salta a su plano', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-seg]').nth(4).click();
  await expect(page.locator(L3)).toHaveText('Stands y montajes');
});

test('reel con vídeo roto cae a fotos', async ({ page }) => {
  await page.route('/', async (route) => {
    const res = await route.fetch();
    const html = await res.text();
    // Astro añade data-astro-cid-* al marcador, así que se busca por patrón.
    const slot = /<div data-video-slot[^>]*><\/div>/;
    expect(html).toMatch(slot);
    const body = html.replace(slot,
      '<video data-reel-video src="/no-existe.mp4" muted playsinline autoplay loop></video>');
    await route.fulfill({ response: res, body });
  });
  await page.goto('/');
  await expect(page.locator('video[data-reel-video]')).toHaveCount(0);
  await expect(page.locator('[data-shot].is-on img')).toBeVisible();
  await expect(page.locator(L3)).not.toHaveText('Desde plató', { timeout: 9000 });
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no avanza solo, no se fija y se puede navegar a mano', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(6000);
    await expect(page.locator(L3)).toHaveText('Desde plató');
    await expect(page.locator('[data-hero-reel]')).not.toHaveClass(/is-pinned/);
    await expect(page.locator('[data-svc]').first()).toBeVisible();
    await page.locator('[data-seg]').nth(1).click();
    await expect(page.locator(L3)).toHaveText('Rodaje en localización');
  });
});

test('en escritorio el scroll recoge el reel y aparecen las cifras', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'solo escritorio');
  await page.goto('/');
  await expect(page.locator('[data-hero-reel]')).toHaveClass(/is-pinned/);
  await page.mouse.wheel(0, 1400);
  await expect(page.locator('[data-hero-reel] .figs')).toBeVisible();
  await expect(page.locator('[data-hero-reel] .num').nth(2)).toHaveText('2.266', { timeout: 5000 });
});

test('en móvil no se fija', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'solo móvil');
  await page.goto('/');
  await expect(page.locator('[data-hero-reel]')).not.toHaveClass(/is-pinned/);
});

test('el enlace «Saltar al contenido» se ve al enfocarlo', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('a[href="#contenido"]');
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box!.width).toBeGreaterThan(1);
  expect(box!.height).toBeGreaterThan(1);
});

test('en la carga inicial solo se pide la primera foto del reel', async ({ page }) => {
  const pedidas = contarReel(page);
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('[data-shot]').first().locator('img')).toHaveJSProperty('complete', true);
  expect(pedidas.length).toBe(1);
  expect(pedidas[0]).toMatch(/^\/_astro\/plato\./);
});

test('cada plano tiene su foto cargada al mostrarse', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-seg]').nth(6).click();
  await expect(page.locator(L3)).toHaveText('Reuniones científicas');
  const img = page.locator('[data-shot]').nth(6).locator('img');
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  // Y el plano siguiente al que está en pantalla también se precarga mientras avanza el reel.
  await page.goto('/');
  await expect(page.locator(L3)).not.toHaveText('Desde plató', { timeout: 9000 });
  const segunda = page.locator('[data-shot]').nth(1).locator('img');
  await expect.poll(() => segunda.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test('las fotos del reel ofrecen AVIF y WebP, con respaldo de 960 px', async ({ page }) => {
  await page.goto('/');
  const fig = page.locator('[data-shot]').first();
  await expect(fig.locator('source[type="image/avif"]')).toHaveCount(1);
  await expect(fig.locator('source[type="image/webp"]')).toHaveCount(1);
  expect(await fig.locator('img').getAttribute('src')).toMatch(/\.webp$/);
  const w = await page.request.get((await fig.locator('img').getAttribute('src'))!);
  expect((await w.body()).length).toBeLessThan(200_000);
  await page.goto('/servicios/formacion');
  await expect(page.locator('.shero source[type="image/avif"]')).toHaveCount(1);
  await expect(page.locator('.shero source[type="image/webp"]')).toHaveCount(1);
});

test('en móvil, tocar «01 Formación» lleva a su página', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'solo móvil');
  await page.goto('/');
  await expect(page.locator('[data-svc="1"] a')).not.toHaveAttribute('aria-describedby', /./);
  await page.locator('[data-svc="1"] a').tap();
  await expect(page).toHaveURL(/\/servicios\/formacion$/);
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('las líneas del panel son enlaces que navegan', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-svc] a[href^="/servicios/"]')).toHaveCount(9);
    await page.locator('[data-svc="2"] a').click();
    await expect(page).toHaveURL(/\/servicios\/produccion-audiovisual$/);
  });
});

test('en escritorio fijado, el primer clic salta el reel y el segundo abre el servicio', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'solo escritorio');
  await page.goto('/');
  await expect(page.locator('[data-hero-reel]')).toHaveClass(/is-pinned/);
  await page.mouse.wheel(0, 1400);
  const link = page.locator('[data-svc="1"] a');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/servicios/formacion');
  await expect(link).toHaveAttribute('aria-describedby', 'svc-hint');
  await link.click();
  await expect(page.locator(L3)).toHaveText('Formación mixta');
  await expect(page).toHaveURL(/\/$/);
  await link.click();
  await expect(page).toHaveURL(/\/servicios\/formacion$/);
});
