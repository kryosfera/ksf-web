// Uso: npm run import:cms -- <ruta a backups/webflow-2026/ksf-web>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { mapCmsItem, logoFileName, type CmsItem } from '../src/lib/cms-import';

const backup = process.argv[2];
if (!backup) { console.error('Falta la ruta del backup de ksf-web'); process.exit(1); }

function findFile(dir: string, name: string): string | null {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return null; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (e === name) return p;
  }
  return null;
}

mkdirSync('public/clientes', { recursive: true });
for (const [coleccion, destino] of [['clientes', 'clientes'], ['organizaciones', 'organizaciones']] as const) {
  const items: CmsItem[] = JSON.parse(readFileSync(join(backup, 'cms', `${coleccion}.items.json`), 'utf8'));
  let conLogo = 0;
  const out = items.map((it) => {
    const url = it.fieldData.logo?.url;
    let logo: string | null = null;
    if (url) {
      const src = findFile(join(backup, 'assets', 'files'), logoFileName(url));
      if (src) {
        logo = `/clientes/${it.fieldData.slug}${extname(src).toLowerCase()}`;
        copyFileSync(src, join('public', logo));
        conLogo++;
      }
    }
    return mapCmsItem(it, logo);
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  writeFileSync(`src/data/${destino}.json`, JSON.stringify(out, null, 2) + '\n');
  console.log(`${destino}: ${out.length} (con logo: ${conLogo})`);
}
