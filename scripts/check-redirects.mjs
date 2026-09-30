// Uso: node scripts/check-redirects.mjs https://nueva.ksf.es
const base = process.argv[2];
if (!base) { console.error('Falta la URL base'); process.exit(1); }
const casos = [
  ['/soluciones', '/servicios'], ['/soluciones/', '/servicios'], ['/contact', '/contacto'],
  ['/aviso-legal', '/legal/aviso-legal'], ['/politica-de-cookies', '/legal/cookies'],
  ['/webinars/ivascular', '/servicios/streaming-y-webinars'], ['/kyowa/malaga360', '/'],
  ['/clientes/shionogi', '/nosotros'], ['/palex?utm_source=x', '/servicios/congresos'],
];
let fallos = 0;
for (const [from, to] of casos) {
  const r = await fetch(base + from, { redirect: 'manual' });
  const loc = new URL(r.headers.get('location') ?? '', base).pathname;
  const ok = r.status === 301 && loc === to;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'} ${from} → ${r.status} ${loc} (esperado 301 ${to})`);
}
process.exit(fallos ? 1 : 0);
