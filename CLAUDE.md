# ksf-web · ksf.es

Web corporativa de KSF Digital Healthcare. Sustituye a la web de Webflow (se da de baja el 23/10/2026).

## Estructura
- `src/content/servicios/*.md`: las 9 líneas de servicio (textos del catálogo v9).
- `src/data/*.json`: plataformas, clientes, organizaciones, cifras, congresos, reel y equipo.
- `src/lib/`: lógica pura con tests (`tests/unit`).
- `src/scripts/`: animaciones GSAP (reel, revelados, contadores) y formulario.
- `functions/api/contacto.ts`: formulario (Resend + Turnstile).

## Cómo se trabaja
- El contenido se edita en `src/content` y `src/data`; los cambios se publican al hacer merge a `main` (Cloudflare Pages).
- Antes de cada PR: `npm run build && npm test && npm run test:e2e`.
- Modos: `oscuro` para las páginas escénicas y `claro` para las de lectura (ver spec §4).
- Movimiento: solo transform y opacity; respetar `prefers-reduced-motion`.

## Estado y siguientes pasos
- 30/09/2026: repo creado a partir de la spec y el plan de `docs/superpowers/`.
