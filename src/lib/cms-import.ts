export interface CmsItem {
  isDraft?: boolean;
  isArchived?: boolean;
  fieldData: { name: string; slug: string; web?: string | null; logo?: { url: string } | null };
}

export interface Entidad { id: string; nombre: string; web: string | null; logo: string | null; [campo: string]: unknown }

export function logoFileName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
}

/** Solo se importan los elementos publicados: ni borradores ni archivados. */
export function isPublicado(item: CmsItem): boolean {
  return !item.isDraft && !item.isArchived;
}

export function mapCmsItem(item: CmsItem, logoPath: string | null): Entidad {
  const f = item.fieldData;
  return { id: f.slug, nombre: f.name.trim(), web: f.web ?? null, logo: logoPath };
}

/**
 * Fusiona por id lo importado con lo que ya hay en el JSON:
 * - de una entrada existente se conservan sus campos (pueden estar editados a mano),
 *   salvo `logo`, que se sustituye cuando el import trae uno;
 * - las entradas nuevas del CMS se añaden;
 * - las que no vienen del CMS (añadidas a mano) se conservan, salvo las de `retirar`
 *   (ids de borradores o archivados en el CMS);
 * - resultado ordenado por nombre.
 */
export function fusionar(existentes: Entidad[], importados: Entidad[], retirar: ReadonlySet<string> = new Set()): Entidad[] {
  const previos = new Map(existentes.map((e) => [e.id, e]));
  const out = new Map<string, Entidad>();
  for (const imp of importados) {
    const prev = previos.get(imp.id);
    out.set(imp.id, prev ? { ...imp, ...prev, logo: imp.logo ?? prev.logo } : imp);
  }
  for (const e of existentes) if (!out.has(e.id) && !retirar.has(e.id)) out.set(e.id, e);
  return [...out.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
