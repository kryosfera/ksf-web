// Uso: npm run import:cms -- <ruta a backups/webflow-2026/ksf-web>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { mapCmsItem, logoFileName, isPublicado, fusionar, type CmsItem, type Entidad } from '../src/lib/cms-import';

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
  const todos: CmsItem[] = JSON.parse(readFileSync(join(backup, 'cms', `${coleccion}.items.json`), 'utf8'));
  // Borradores y archivados no se publican (y se retiran del JSON si ya estaban).
  const items = todos.filter(isPublicado);
  const retirar = new Set(todos.filter((it) => !isPublicado(it)).map((it) => it.fieldData.slug));
  let conLogo = 0;
  const importados = items.map((it) => {
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
  });
  // Fusión por id: no se pierden las ediciones a mano del JSON (solo se actualiza el logo si llega uno).
  const ruta = `src/data/${destino}.json`;
  const existentes: Entidad[] = existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : [];
  const out = fusionar(existentes, importados, retirar);
  writeFileSync(ruta, JSON.stringify(out, null, 2) + '\n');
  console.log(`${destino}: ${out.length} (con logo nuevo: ${conLogo}; fuera por borrador o archivado: ${retirar.size})`);
}
