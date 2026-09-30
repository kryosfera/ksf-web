import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';
import { REDIRECTS, toRedirectsFile } from './src/lib/redirects.ts';

const ksfRedirects = {
  name: 'ksf-redirects',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('_redirects', dir), toRedirectsFile(REDIRECTS));
    },
  },
};

export default defineConfig({
  site: 'https://ksf.es',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap(), ksfRedirects],
  vite: { plugins: [tailwindcss()] },
});
