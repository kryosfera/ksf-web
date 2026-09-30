import { test, expect } from '@playwright/test';

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
