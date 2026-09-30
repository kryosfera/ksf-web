function wrap(t: number, total: number): number {
  return ((t % total) + total) % total;
}

/** Índice del plano activo en el instante t (s) de un reel en bucle de duración total. */
export function shotIndexAt(starts: number[], t: number, total: number): number {
  if (starts.length === 0) return -1;
  const tt = wrap(t, total);
  let idx = 0;
  for (let i = 0; i < starts.length; i++) if (starts[i] <= tt) idx = i;
  return idx;
}

/** Progreso (0..1) dentro del plano activo. */
export function progressInShot(starts: number[], t: number, total: number): number {
  const i = shotIndexAt(starts, t, total);
  if (i < 0) return 0;
  const tt = wrap(t, total);
  const end = i + 1 < starts.length ? starts[i + 1] : total;
  const len = end - starts[i];
  return len > 0 ? Math.min(1, Math.max(0, (tt - starts[i]) / len)) : 0;
}
