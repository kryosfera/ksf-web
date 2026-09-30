import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SERVICIOS: Array<[string, 'oscuro' | 'claro', string]> = [
  ['formacion', 'claro', 'Formación'], ['produccion-audiovisual', 'oscuro', 'Producción audiovisual'],
  ['streaming-y-webinars', 'oscuro', 'Streaming y webinars'], ['eventos', 'oscuro', 'Eventos'],
  ['congresos', 'oscuro', 'Congresos'], ['interactivos', 'oscuro', 'Interactivos'],
  ['diseno-grafico', 'claro', 'Diseño gráfico de materiales'], ['packaging', 'claro', 'Packaging'],
  ['piezas-de-anatomia', 'claro', 'Piezas de anatomía'],
];

for (const [slug, modo, titulo] of SERVICIOS) {
  test(`/servicios/${slug} en modo ${modo}`, async ({ page }) => {
    const res = await page.goto(`/servicios/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('data-mode', modo);
    await expect(page.locator('h1')).toContainText(titulo);
    await expect(page.locator('.sub-item').first()).toBeVisible();
    await expect(page.locator(`a[href="/contacto?servicio=${slug}"]`).first()).toBeAttached();
  });
}

test('el índice enlaza las 9 líneas', async ({ page }) => {
  await page.goto('/servicios');
  await expect(page.locator('a.svc-card')).toHaveCount(9);
});

test('Formación enlaza a Inginium', async ({ page }) => {
  await page.goto('/servicios/formacion');
  await expect(page.locator('a[href="https://www.inginium-ksf.com"]')).toBeAttached();
});

for (const slug of ['formacion', 'streaming-y-webinars']) {
  test(`/servicios/${slug}: contraste de color (axe)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/servicios/${slug}`);
    await page.waitForTimeout(500);
    const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(r.violations.map((v) => v.nodes.map((n) => n.html + ' ' + n.any.map((a) => a.message).join('|')))).toEqual([]);
  });
}
