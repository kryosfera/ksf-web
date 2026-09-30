import { test, expect } from '@playwright/test';

async function rellenar(page: import('@playwright/test').Page) {
  await page.fill('#nombre', 'Ana López'); await page.fill('#empresa', 'Lab SA');
  await page.fill('#email', 'ana@lab.es'); await page.fill('#mensaje', 'Queremos un stand para ERS 2027.');
  await page.check('#privacidad');
}

test('preselecciona el servicio que viene en la URL', async ({ page }) => {
  await page.goto('/contacto?servicio=congresos');
  await expect(page.locator('#servicio')).toHaveValue('congresos');
});

test('ignora un servicio desconocido en la URL', async ({ page }) => {
  await page.goto('/contacto?servicio=jardineria');
  await expect(page.locator('#servicio')).toHaveValue('');
});

test('envío correcto muestra confirmación', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Hemos recibido tu solicitud');
});

test('error de envío muestra el email alternativo', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"error":"envio"}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('info@ksf.es');
});

test('errores de validación del servidor aparecen junto a su campo', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: '{"ok":false,"errors":{"email":"Revisa el email: no parece válido."}}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('#email-error')).toHaveText('Revisa el email: no parece válido.');
});

test('doble clic envía una sola vez', async ({ page }) => {
  let n = 0;
  await page.route('**/api/contacto', async (r) => { n++; await new Promise((res) => setTimeout(res, 800)); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.goto('/contacto'); await rellenar(page);
  await page.dblclick('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Hemos recibido');
  expect(n).toBe(1);
});

test('fallo de red muestra el email alternativo y reactiva el botón', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.abort('failed'));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('info@ksf.es');
  await expect(page.locator('button[type=submit]')).toBeEnabled();
});

test('con errores del servidor el foco va al primer campo inválido y se asocia con aria-describedby', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: '{"ok":false,"errors":{"email":"Revisa el email.","mensaje":"Muy corto."}}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('#email')).toBeFocused();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email-error');
  await expect(page.locator('#mensaje-error')).toHaveText('Muy corto.');
});
