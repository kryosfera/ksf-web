export interface CmsItem {
  fieldData: { name: string; slug: string; web?: string | null; logo?: { url: string } | null };
}

export function logoFileName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
}

export function mapCmsItem(item: CmsItem, logoPath: string | null) {
  const f = item.fieldData;
  return { id: f.slug, nombre: f.name.trim(), web: f.web ?? null, logo: logoPath };
}
