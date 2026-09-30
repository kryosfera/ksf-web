// Genera public/og.png (1200x630) con las fuentes de marca embebidas (Fontsource, base64),
// renderizando con Chromium para no depender de las fuentes instaladas en la máquina.
import { existsSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const fuente = (paquete: string, fichero: string) =>
  readFileSync(new URL(`../node_modules/${paquete}/files/${fichero}`, import.meta.url)).toString('base64');
const redHat = fuente('@fontsource-variable/red-hat-display', 'red-hat-display-latin-wght-normal.woff2');
const manrope = fuente('@fontsource-variable/manrope', 'manrope-latin-wght-normal.woff2');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Red Hat Display';font-weight:300 900;src:url(data:font/woff2;base64,${redHat}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:200 800;src:url(data:font/woff2;base64,${manrope}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#05090E;position:relative;overflow:hidden;color:#EEF5F6}
.t{position:absolute;left:80px;top:150px;width:700px}
h1{font:900 64px/1.15 'Red Hat Display';letter-spacing:-.01em}
h1 span{color:#7BD9EF}
p.s{margin-top:40px;font:500 26px/1.4 'Manrope';color:#A3B5BD;width:740px}
p.f{position:absolute;left:80px;top:500px;font:700 26px/1 'Red Hat Display'}
svg{position:absolute;left:860px;top:150px}
</style></head><body>
<div class="t"><h1>Convertimos la ciencia<br><span>en experiencias</span></h1><p class="s">Formación, eventos y tecnología para el sector salud.</p></div>
<p class="f">KSF Digital Healthcare · ksf.es</p>
<svg width="290" height="275" viewBox="0 0 290 275"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="290" y2="275"><stop offset="0" stop-color="#89F4B4"/><stop offset="1" stop-color="#7BD9EF"/></linearGradient></defs><g fill="url(#g)"><polygon points="0,140 122,0 165,0 0,189"/><polygon points="0,204 178,0 222,0 0,255"/><polygon points="240,0 288,0 50,273 2,273"/><polygon points="140,190 163,162 260,273 210,273"/><polygon points="110,225 133,197 200,273 152,273"/><polygon points="80,258 102,230 140,273 93,273"/></g></svg>
</body></html>`;

const ejecutable = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const navegador = await chromium.launch({ executablePath: ejecutable });
const page = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
// Margen mínimo de 48 px entre el texto del titular y la K.
const derecha = await page.evaluate(() => {
  const r = document.createRange(); r.selectNodeContents(document.querySelector('h1')!);
  return Math.max(...[...r.getClientRects()].map((c) => c.right));
});
if (860 - derecha < 48) throw new Error(`El titular queda a ${Math.round(860 - derecha)} px de la K (mínimo 48)`);
await page.screenshot({ path: 'public/og.png' });
await navegador.close();
console.log(`public/og.png generado (margen titular-K: ${Math.round(860 - derecha)} px)`);
