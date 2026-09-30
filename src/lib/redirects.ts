// Orígenes: backups/webflow-2026/ksf-web/pages/_pages.json (ksf-workspace). Exactas antes que comodines.
// /clientes/* y /organizaciones/* apuntan a /nosotros sin ancla: el formato `_redirects`
// de Cloudflare Pages no garantiza conservar el fragmento (#clientes).
export const REDIRECTS = [
  ['/soluciones', '/servicios'],
  ['/contact', '/contacto'],
  ['/aviso-legal', '/legal/aviso-legal'],
  ['/politica-de-privacidad', '/legal/privacidad'],
  ['/politica-de-cookies', '/legal/cookies'],
  ['/proyectos/formularios-interactivos', '/servicios/interactivos'],
  ['/palex', '/servicios/congresos'],
  ['/videocatalogo', '/servicios/produccion-audiovisual'],
  ['/kyowa/streaming', '/servicios/streaming-y-webinars'],
  ['/sign-in', '/'],
  ['/sign-up', '/'],
  ['/blog', '/'],
  ['/home-1', '/'],
  ['/home-2', '/'],
  ['/home-4', '/'],
  ['/home-5', '/'],
  ['/401', '/'],
  ['/clientes/*', '/nosotros'],
  ['/organizaciones/*', '/nosotros'],
  ['/webinars/*', '/servicios/streaming-y-webinars'],
  ['/kyowa/*', '/'],
  ['/provincia/*', '/'],
  ['/informes/*', '/'],
  ['/post/*', '/'],
  ['/template-info/*', '/'],
] as const satisfies ReadonlyArray<readonly [string, string]>;

/** Reglas en el formato `_redirects` de Cloudflare Pages (una por línea). */
export function toRedirectsFile(rules: ReadonlyArray<readonly [string, string]>): string {
  const out: string[] = [];
  for (const [from, to] of rules) {
    out.push(`${from} ${to} 301`);
    if (!from.includes('*') && from !== '/') out.push(`${from}/ ${to} 301`);
  }
  return out.join('\n') + '\n';
}
