import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [path, h1] of [
  ['/plataformas', /Plataformas/], ['/nosotros', /agencia especializada/i],
  ['/legal/aviso-legal', /Aviso legal/], ['/legal/privacidad', /privacidad/i], ['/legal/cookies', /cookies/i],
] as const) {
  test(`${path} responde y está en modo claro`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'claro');
    await expect(page.locator('h1')).toContainText(h1);
  });
}

test('las plataformas sin URL piden demo en contacto', async ({ page }) => {
  await page.goto('/plataformas');
  await expect(page.locator('a[href^="/contacto?servicio="]').first()).toBeAttached();
});

test('la política de cookies dice que no se usan cookies de analítica', async ({ page }) => {
  await page.goto('/legal/cookies');
  await expect(page.getByText('no utiliza cookies de analítica')).toBeVisible();
});

test('el aviso legal no afirma que se usen cookies ni Google y remite a la política de cookies', async ({ page }) => {
  await page.goto('/legal/aviso-legal');
  const main = page.locator('main');
  await expect(main).not.toContainText('Google');
  await expect(main).not.toContainText('tecnología “cookie”');
  await expect(main).toContainText('no utiliza cookies propias ni de terceros con fines analíticos o publicitarios');
  await expect(main).toContainText('Cloudflare Web Analytics');
  await expect(main.locator('a[href="/legal/cookies"]').first()).toBeAttached();
});

test('una ruta inexistente da 404 con enlace a inicio', async ({ page }) => {
  const res = await page.goto('/no-existe');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
});

for (const path of ['/nosotros', '/plataformas', '/legal/privacidad']) {
  test(`${path} no tiene violaciones axe serias o críticas`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
