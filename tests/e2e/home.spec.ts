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
  // Aún no hay otra página interna (un 404 en preview provoca carga completa, no transición).
  // Se navega a «/?otra», que sirve la home con otra URL y obliga a ClientRouter a cambiar de página y reinicializar.
  await page.evaluate(() => {
    (window as any).__spa = 1;
    const a = document.createElement('a'); a.href = '/?otra'; a.id = 'go'; a.textContent = 'ir';
    a.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;padding:20px;background:#fff;color:#000';
    document.body.append(a);
  });
  await page.locator('#go').click();
  await expect(page).toHaveURL(/\?otra$/);
  await expect(page.locator('[data-hero-reel]')).toHaveCount(1);
  await page.locator('[data-seg]').nth(4).click();
  await expect(page.locator(L3)).toHaveText('Stands y montajes');
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
