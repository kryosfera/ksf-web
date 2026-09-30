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

test('Turnstile se vuelve a renderizar al volver a /contacto sin recarga y el envío lleva el token', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __ts: { render: number; remove: number }; turnstile: unknown };
    w.__ts = { render: 0, remove: 0 };
    w.turnstile = {
      render: (el: HTMLElement) => {
        w.__ts.render++;
        const i = document.createElement('input'); i.type = 'hidden'; i.name = 'cf-turnstile-response'; i.value = 'tok-stub'; el.appendChild(i);
        return 'w' + w.__ts.render;
      },
      remove: () => { w.__ts.remove++; }, reset: () => {},
    };
  });
  let cuerpo = '';
  await page.route('**/api/contacto', (r) => { cuerpo = r.request().postData() ?? ''; return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.goto('/contacto');
  await expect.poll(() => page.evaluate(() => (window as any).__ts.render)).toBe(1);
  await page.click('.cform a[href="/legal/privacidad"]');
  await expect(page).toHaveURL(/\/legal\/privacidad/);
  await page.goBack();
  await expect(page).toHaveURL(/\/contacto/);
  await expect.poll(() => page.evaluate(() => (window as any).__ts.render)).toBe(2);
  expect(await page.evaluate(() => (window as any).__ts.remove)).toBeGreaterThanOrEqual(1);
  await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Hemos recibido');
  expect(cuerpo).toContain('tok-stub');
});

test('el éxito no promete el acuse por email', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Hemos recibido tu solicitud');
  await expect(page.locator('[data-form-status]')).not.toContainText('acuse');
});

test('un error general del servidor (errors.form) se muestra en el estado', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: '{"ok":false,"errors":{"form":"No se ha podido leer el formulario."}}' }));
  await page.goto('/contacto'); await rellenar(page);
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('No se ha podido leer el formulario.');
  await expect(page.locator('[data-form-status]')).toContainText('info@ksf.es');
  await expect(page.locator('[data-form-status]')).not.toContainText('Revisa los campos marcados');
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('el formulario remite a info@ksf.es', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('.cform .nojs a[href="mailto:info@ksf.es"]')).toBeVisible();
  });
});
