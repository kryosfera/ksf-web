import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// En la nube el navegador del paquete no está; se usa el Chromium preinstalado si existe.
const chromium = existsSync('/opt/pw-browsers/chromium')
  ? { launchOptions: { executablePath: '/opt/pw-browsers/chromium' } }
  : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...chromium } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...chromium } },
  ],
});
