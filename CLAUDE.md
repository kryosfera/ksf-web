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

## Cómo editar el contenido
Tras cualquier cambio: `npm test && npm run build && npm run test:e2e` (los tests comprueban que ids, imágenes, enlaces y redirecciones cuadran).
- **Servicios:** un `.md` por línea en `src/content/servicios/` (el nombre del archivo es el slug y no se cambia). Frontmatter: `titulo`, `entradilla`, `imagen` (archivo de `src/assets/reel/`), `plataformas` (ids de `plataformas.json`), `subservicios`, `seo`.
- **Plataformas:** `src/data/plataformas.json`. `id` único y en minúsculas, `url` (o `null` si no es pública) y `servicio` (slug). Para que salga en la ficha de un servicio, añade su `id` a `plataformas:` de ese `.md`.
- **Cifras:** `src/data/cifras.json` (`periodo` y los 4 `items`; `valor` sin puntos, el formato lo pone la web).
- **Congresos:** `src/data/congresos.json` (`realizados` y `proximos`).
- **Reel del hero:** `src/data/reel.json`. Cada plano lleva `start` (segundos, creciente), `imagen` (en `src/assets/reel/`), rótulo y `servicio` (número 1–9). Cuando llegue el vídeo, súbelo a `public/reel/` y pon su ruta en `video.mp4` (y `video.webm` si lo hay); ajusta `total` y los `start` al montaje. Las fotos quedan como respaldo.
- **Equipo:** `src/data/equipo.json`. La `foto` es un archivo de `src/assets/equipo/` (o `null`).
- **Logos de clientes y organizaciones:** tras bajar los binarios con `descargar.sh`, ejecuta `npm run import:cms -- ../ksf-workspace/backups/webflow-2026/ksf-web`. Copia los logos a `public/clientes/` y fusiona con `src/data/clientes.json` y `organizaciones.json`: se conservan las ediciones a mano, solo se sustituye `logo` cuando llega uno, y se descartan los borradores y archivados del CMS. Un logo a mano: archivo en `public/clientes/<id>.<ext>` y `"logo": "/clientes/<id>.<ext>"`.
- **Redirecciones:** `src/lib/redirects.ts` (rutas exactas antes que los comodines). `_redirects` se genera en el build.

## Estado y siguientes pasos
- 30/09/2026: repo creado a partir de la spec y el plan de `docs/superpowers/`.
- **30/09/2026 · Web terminada a falta de publicar.** Hechas las tareas 1–10 del plan y la ola de correcciones de la revisión final:
  - Reel con carga diferida (solo la primera foto al cargar) en AVIF y WebP.
  - Aviso legal §9 reescrito: remite a la política de cookies.
  - Las líneas de servicio del hero son siempre enlaces. En escritorio con el hero fijado, el primer clic salta el reel y el segundo abre la página.
  - `/api/contacto`: 32 KB contados en la lectura, 500 si falta una variable y hostnames de Turnstile restringidos. El formulario tiene `<noscript>` y el mensaje de éxito ya no promete el acuse.
  - Marquesina y reel con botón de pausa.
  - `import:cms` con fusión y sin borradores (B Braun ya no sale).
  - 301 de las rutas base de colección.
  - `public/_headers` con cabeceras de seguridad.
  - Tests de referencias cruzadas.
- **Sin remoto:** el repo solo existe en local. Falta crear `kryosfera/ksf-web` en GitHub, hacer push de `main`, añadirlo a la tabla de ksf-workspace y conectarlo a Cloudflare Pages (tarea 11).
- **Variables de entorno de Cloudflare Pages** (Production y Preview):
  - `PUBLIC_TURNSTILE_SITEKEY` es de **build**. Sin ella el formulario falla en producción.
  - `TURNSTILE_SECRET` y `RESEND_API_KEY` van como secretos.
  - `CONTACT_TO=info@ksf.es` y `CONTACT_FROM=web@ksf.es` (dominio verificado en Resend).
  - Detalle en `README.md` y `.dev.vars.example`.
- **Recomendado al publicar:**
  - Regla de rate limiting de Cloudflare en `/api/contacto`: 5 peticiones por minuto e IP.
  - CSP pendiente. No se ha puesto porque habría que permitir Turnstile, Web Analytics y los scripts y estilos en línea de Astro.
- **Pendiente de Joaquín:**
  - Vídeo del reel. Cuando llegue, cambiar el botón secundario del hero de «Ver servicios» a «Ver el reel completo» (spec §3.1).
  - Logos: bajar los binarios con `descargar.sh` desde un Mac y reimportar (`npm run import:cms`). Ahora la marquesina muestra los nombres.
  - Confirmar el Recetario digital como plataforma y la lista y URLs de las plataformas.
  - Fotos del equipo que faltan: Vanesa, Angela, Guillermo y Laura.
  - Revisar el §9 reescrito del aviso legal.
  - Revisar las fechas de los legales: aviso legal y privacidad siguen con «18/12/2020».
  - Revisar los correos de los legales: aparecen gdpr@kryosfera.com e info@kryosfera.com.
