import { test, expect } from '@playwright/test';

test('la home tiene todas sus secciones', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Confían en nosotros' })).toBeAttached();
  await expect(page.getByRole('heading', { name: /Plataformas/ })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Por Europa' })).toBeAttached();
  await expect(page.getByRole('heading', { name: /Cuatro pasos/ })).toBeAttached();
  await expect(page.getByRole('heading', { name: /próxima idea/ })).toBeAttached();
  await expect(page.locator('.marquee li')).not.toHaveCount(0);
  await expect(page.getByText('ERS 2026 · CAIRE').first()).toBeAttached();
});

test('las cifras llevan su valor en el HTML (sin depender de JS)', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  for (const v of ['183', '+25', '2.266', '104']) expect(html).toContain(`>${v}<`);
});

test('sin logos, el marquee muestra el nombre en texto y no desborda', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.marquee li span').first();
  await expect(first).toBeAttached();
  expect((await first.textContent())!.trim().length).toBeGreaterThan(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('ida y vuelta con ClientRouter: el hero sigue vivo y sin errores de consola', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  const L3 = '[data-hero-reel] [data-l3-t]';
  await page.goto('/');
  await expect(page.locator(L3)).toHaveText('Desde plató');
  // Navegación real por un enlace interno: ClientRouter cambia de página sin recarga completa.
  await page.evaluate(() => { (window as any).__spa = 1; });
  await page.locator('a[href="/servicios"]').first().evaluate((a: HTMLElement) => a.click());
  await expect(page).toHaveURL(/\/servicios$/);
  await expect(page.locator('h1')).toContainText('Un solo equipo');
  await expect(page.locator('[data-hero-reel]')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as any).__spa)).toBe(1); // sin recarga completa: fue ClientRouter
  await page.locator('[data-seg]').nth(1).click();
  await expect(page.locator(L3)).toHaveText('Rodaje en localización');
  await page.locator('[data-pause]').click();
  expect(errores).toEqual([]);
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('el marquee está quieto y no duplica logos visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.marquee .track')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.marquee li[aria-hidden="true"]').first()).toBeHidden();
  });
});

test('la marquesina se pausa con su botón y al enfocarlo', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.marquee .track').first();
  const btn = page.locator('[data-marquee-pause]').first();
  await expect(btn).toHaveAccessibleName('Pausar logos');
  await expect(track).toHaveCSS('animation-play-state', 'running');
  await btn.focus();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.blur();
  await page.mouse.move(0, 0);
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await btn.blur();
  await expect(track).toHaveCSS('animation-play-state', 'running');
});
