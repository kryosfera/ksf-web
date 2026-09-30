const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

/** Número en español con punto de miles siempre («2.266»), sin decimales. */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n));
}
