/** Ejecuta setup en cada carga de página (compatible con View Transitions) y limpia antes del cambio. */
export function onPage(setup: () => (() => void) | void): void {
  let cleanup: (() => void) | void;
  document.addEventListener('astro:page-load', () => { cleanup = setup(); });
  document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = undefined; });
}
