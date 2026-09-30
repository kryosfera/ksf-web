# ksf.es · Nueva web corporativa — Especificación de diseño

- **Fecha:** 30/09/2026
- **Estado:** pendiente de revisión por Joaquín
- **Repo de destino:** `kryosfera/ksf-web` (nuevo). Esta especificación vive en `ksf-workspace` hasta que se cree el repo; allí se copiará a `docs/`.
- **Contexto:** salida de Webflow ([plan](../../../planes/migracion-webflow-2026.md)). El plan del sitio KSF-WEB vence el **23/10/2026**; la web nueva tiene que estar en producción antes.
- **Fuentes:** catálogo corporativo `2026 KSF_corporativo_v9` (Drive) y copia de la web actual en [`backups/webflow-2026/ksf-web/`](../../../backups/webflow-2026/ksf-web/).

## 1. Objetivo

ksf.es es la web corporativa de KSF Digital Healthcare, la agencia de formación, eventos y tecnología para el sector salud. Cumple tres funciones, por orden de prioridad:

1. **Credibilidad.** Es el escaparate que respalda el catálogo después de una reunión: cifras, clientes, material audiovisual real y casos.
2. **Petición de propuesta.** Siempre a mano, en todas las páginas.
3. **Punto central de las plataformas digitales de KSF.** Da acceso a cada producto digital propio.

**Éxito:** en producción antes del 23/10; un laboratorio entiende en segundos qué hace KSF y puede pedir propuesta; el sistema visual queda listo para reutilizarlo en Inginium.

**Fuera de alcance:**
- **icover-cases** se mantiene al 100 % como está: es un entorno de producción de un cliente. Solo se migra su alojamiento, en su propio proyecto.
- El **rediseño de Inginium**, que tendrá su propia especificación.
- Blog y noticias.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Stack | Astro 5 + Tailwind 4 + GSAP 3.13 + Cloudflare Pages (patrón de `kryosfera-web`) |
| Hero de la home | Reel de fondo a sangre con rótulos de emisión sincronizados con el v9; al hacer scroll el reel se recoge en un monitor y entran las 9 líneas de servicio y las cifras. Prototipo aprobado: [`assets/2026-09-30-hero-reel-prototipo.html`](assets/2026-09-30-hero-reel-prototipo.html) (sin imágenes: los `{{IMG0}}`…`{{IMG8}}` corresponden, en orden, a `IMG_9903.jpeg`, `foto-portadaweb.webp`, `59df71b8-….jpeg`, `IMG_4528.jpeg`, `Foto-12.jpeg`, `vision-proheart.webp`, `Foto-1-opt.webp`, `IMG_5083.jpeg` y `Foto-2-opt.webp` de `backups/webflow-2026/ksf-web/code-export/images/`) |
| Identidad | Modo **oscuro de emisión** en las páginas escénicas y modo **claro** en las de lectura; degradado del logo solo como acento |
| Edición de contenido | Contenido en el repo (colecciones de contenido de Astro). Lo actualiza Joaquín desde Claude. Sin CMS; estructurado para poder añadir Keystatic más adelante |
| Analítica | Solo Cloudflare Web Analytics, sin cookies y **sin banner de cookies**. Se retiran Google Analytics, Inspectlet y Nocodelytics |
| Formulario | Resend a `info@ksf.es` con acuse de recibo y Cloudflare Turnstile; sin base de datos |
| Idioma | Solo español |

## 3. Estructura de páginas

```
/                               Home
/servicios                      Índice de las 9 líneas
/servicios/formacion
/servicios/produccion-audiovisual
/servicios/streaming-y-webinars
/servicios/eventos
/servicios/congresos
/servicios/interactivos
/servicios/diseno-grafico
/servicios/packaging
/servicios/piezas-de-anatomia
/plataformas                    Productos digitales de KSF (una ficha por producto)
/nosotros                       Quiénes somos, equipo, clientes, ecosistema
/contacto                       Formulario de propuesta y datos
/legal/aviso-legal · /legal/privacidad · /legal/cookies
/404
```

**Segunda fase (después del 23/10):** `/casos` y `/casos/<caso>`. Necesita material de cada proyecto. Mientras tanto, los casos aparecen como bloques dentro de las páginas de servicio.

### 3.1 Home, de arriba abajo

1. **Hero reel**, como el prototipo:
   - Claim «Convertimos la ciencia en experiencias», con el subtítulo «Formación, eventos y tecnología para el sector salud.» y los botones «Pide una propuesta» y «Ver el reel completo».
   - Rótulo de emisión por plano, barra de 9 segmentos y botón de pausa.
   - En escritorio, al hacer scroll, la sección queda fijada, el reel pasa a monitor y entran los 9 servicios (sincronizados con el plano) y las cifras 183 · +25 · 2.266 · 104.
2. **Clientes:** marquesina de logos. Hay 45 logos en el CMS de la copia y 5 organizaciones y sociedades científicas.
3. **Plataformas destacadas:** 3 o 4 fichas con enlace a `/plataformas`.
4. **Por Europa:** congresos 2024–2026 con clientes y próximos de 2027, del v9.
5. **Cómo trabajamos:** «Cuatro pasos. Un solo interlocutor.» Escuchamos, proponemos, producimos, medimos.
6. **Llamada final:** «¿Construimos juntos vuestra próxima idea?» y formulario corto o enlace a `/contacto`.

### 3.2 Página de servicio (plantilla común)

- **Hero de sección:** plano o foto del servicio, número y nombre de la línea, y la entradilla del capítulo del v9.
- **Subservicios del v9:** por ejemplo, en Formación, «Formación online», «Online gamificada», «Presencial», «Mixta» y «Habilidades profesionales», cada uno con su lista de prestaciones.
- **Bloques de caso o ejemplo del v9:** por ejemplo XII Curso GETECCU-SEGHNP, stand de CAIRE, recetario de Lacer o infografías de Sanofi.
- **Plataformas relacionadas y llamada a propuesta,** con el servicio ya elegido en el formulario (`/contacto?servicio=formacion`).

| Línea | Modo | Subservicios (v9) |
|---|---|---|
| 01 Formación | claro | Online · Online gamificada · Presencial · Mixta · Habilidades profesionales |
| 02 Producción audiovisual | oscuro | 9 formatos (caso clínico animado, podcast, vídeo-entrevista…) · Casos grabados en quirófano y laboratorio |
| 03 Streaming y webinars | oscuro | Desde plató · Desde sedes nacionales o internacionales · Webinars «desde casa» |
| 04 Eventos | oscuro | Advisory boards · Reuniones científicas · Eventos corporativos temáticos · Gestión de sedes y catering |
| 05 Congresos | oscuro | Nacionales · Internacionales · Escenografía de simposio · Stands y montajes · Realidad virtual · Por Europa |
| 06 Interactivos (nuevo 2026) | oscuro | Asistente de IA en evento · Juegos de gamificación · Recetario digital |
| 07 Diseño gráfico | claro | Infografías · Materiales para eventos y branding de espacios · Libros, brochures y material para pacientes |
| 08 Packaging | claro | Cajas y coberturas de dispositivos · Welcome pack |
| 09 Piezas de anatomía | claro | Modelos de anatomía desmontables |

### 3.3 Plataformas

Una ficha por producto: captura, qué es, para quién y botón «Ir a la plataforma».

**Candidatos:**
- **Inginium:** `inginium-ksf.com`.
- **Casos clínicos virtuales:** `ksf-casos-virtuales.netlify.app`.
- **Cepas y Letras** y **¿Quién quiere ser microbiólogo?**
- **Asistente de IA para eventos.**
- **Recetario digital.**

**Pendiente de confirmar:** qué productos tienen URL pública, y si los que pertenecen a un cliente (el Recetario de Lacer) aparecen como plataforma o como caso.

### 3.4 Nosotros

- Quiénes somos (v9).
- Equipo, con las fotos de la web actual.
- Clientes y organizaciones.
- Ecosistema: ESADE Business School, sociedades científicas (SEGHNP, SENEFRO, GETECCU, SEOR), Zoom Events, plataformas LMS y red de partners internacionales.
- Dirección: Nicaragua 106, 08029 Barcelona.

## 4. Sistema visual

- **Modo oscuro de emisión:**
  - Colores: fondo `#05090E` y texto `#EEF5F6`.
  - Se usa en la home, las líneas 02–06 y el pie de todas las páginas.
- **Modo claro:**
  - Colores: fondo `#F3F6F8` y tinta `#12162E`.
  - Se usa en las líneas 01 y 07–09, Plataformas, Nosotros, Contacto y legales.
- **Acento:** el degradado del logo, de `#89F4B4` a `#7BD9EF`, en una palabra del titular, el botón principal y las barras de progreso. Sobre fondo claro, el texto de acento es un verde azulado oscuro con contraste AA.
- **Tipografías:** Red Hat Display para titulares y cifras, Manrope para texto e IBM Plex Mono para etiquetas y rótulos. Se autoalojan con Fontsource y no se cargan desde Google. Myriad Pro no se usa porque requiere licencia web.
- **Logo:** la K de 6 franjas en SVG inline, reconstruida desde el PNG. Hay que confirmarla con el archivo vectorial original, si existe.
- **Componentes:**
  - `Header`, `HeroReel`, `SectionHero` y `LowerThird` (rótulo).
  - `ServiceList`, `StatCounter` y `ClientMarquee`.
  - `PlatformCard`, `CaseBlock`, `HowWeWork` y `ContactCTA`.
  - `ContactForm` y `Footer`.
- **Movimiento, siempre con GSAP y ScrollTrigger:**
  - Titulares desde máscara, cifras que cuentan y rótulos sincronizados con el reel.
  - Botón principal magnético y transiciones entre páginas (View Transitions de Astro).
  - Solo se animan transformaciones y opacidad.
  - Con «reducir movimiento» no hay fijado ni reel automático.
  - En móvil no hay fijado.
- **Reutilización:** los tokens (colores, tipos, espaciados) y los componentes genéricos se escriben pensando en llevarlos a Inginium. De momento no hay paquete compartido: se extrae cuando Inginium lo necesite.

## 5. Contenido y datos

- **Colecciones de Astro** (`src/content/`), con esquema validado con Zod:
  - `servicios`: una ficha por línea con número, slug, modo, entradilla, subservicios, casos y plano del reel.
  - `plataformas`: nombre, URL, descripción, público y captura.
  - `clientes`: nombre, logo y web, importado del CMS de la copia.
  - `organizaciones` y `congresos`.
  - `cifras`: valor, etiqueta y periodo, en un solo archivo para actualizarlas una vez al año.
- **Reel:** vídeo MP4 (H.264) y WebM de 1080p y 25–30 s, sin sonido y de unos 6–8 MB, con imagen de portada. Los rótulos se definen en `reel.json` como lista de planos con inicio, kicker, título, texto y servicio, y se sincronizan con el `currentTime` del vídeo. **Mientras no esté el vídeo**, el hero usa las 9 fotos del prototipo con movimiento de cámara.
- **Imágenes:** optimizadas con `astro:assets` (AVIF y WebP, tamaños responsive).

## 6. Formulario de propuesta

- **Campos:** nombre\*, empresa\*, email\*, teléfono, línea de servicio (las 9 más «Otra»), mensaje\* y aceptación de privacidad\*.
- **Envío:** Cloudflare Pages Function `functions/api/contacto.ts`, que valida con Turnstile y envía con Resend un email a `info@ksf.es` y un acuse al usuario. No se guarda nada.
- **Errores:** mensaje claro en la página si falla la validación o el envío, y un email alternativo visible.

## 7. SEO y migración de URLs

- Por página: `<title>`, descripción, Open Graph y URL canónica.
- `sitemap.xml`, `robots.txt` y JSON-LD `Organization` y `Service`.
- **Redirecciones 301** en `public/_redirects`, a partir de `backups/webflow-2026/ksf-web/pages/_pages.json`:

| URL antigua | Destino |
|---|---|
| `/soluciones` | `/servicios` |
| `/contact` | `/contacto` |
| `/nosotros` | `/nosotros` (se mantiene) |
| `/aviso-legal` · `/politica-de-privacidad` · `/politica-de-cookies` | `/legal/aviso-legal` · `/legal/privacidad` · `/legal/cookies` |
| `/clientes/*` · `/organizaciones/*` | `/nosotros#clientes` |
| `/proyectos/formularios-interactivos` | `/servicios/interactivos` |
| `/palex` | `/servicios/congresos` |
| `/videocatalogo` | `/servicios/produccion-audiovisual` |
| `/webinars/*` · `/kyowa/streaming` | `/servicios/streaming-y-webinars` |
| `/kyowa/*` · `/provincia/*` · `/informes/*` · `/sign-in` · `/sign-up` · `/blog` · `/post/*` · `/home-1` · `/home-2` · `/home-4` · `/home-5` · `/template-info/*` · `/401` | `/` |

## 8. Publicación

1. Crear el repo `kryosfera/ksf-web` con README, CLAUDE.md y `.claude/settings.json`, y darlo de alta en la tabla de `ksf-workspace`.
2. Crear el proyecto en Cloudflare Pages conectado a GitHub: `main` publica en producción y cada rama tiene su URL de vista previa.
3. Revisar en `nueva.ksf.es`.
4. Con el visto bueno, cambiar el DNS de `ksf.es` y `www`, **conservando MX, SPF y DKIM del correo**. Dar de alta el sitemap en Search Console y quitar el dominio del sitio de Webflow.

## 9. Pruebas antes de publicar

- `astro check` y compilación sin errores.
- Enlaces internos sin roturas, y cada URL antigua de la tabla 7 devuelve 301 al destino correcto.
- Lighthouse en rendimiento, accesibilidad, buenas prácticas y SEO igual o superior a 90, en móvil y escritorio.
- Formulario probado de principio a fin: llega el email y llega el acuse.
- Revisión visual en móvil (390 px) y escritorio (1440 px), en los modos claro y oscuro de página y con «reducir movimiento».
- El reel se puede pausar y los rótulos se leen con lector de pantalla.

## 10. Lo que hace falta de Joaquín

| Qué | Para qué | Cuándo |
|---|---|---|
| Acceso a Cloudflare, y saber dónde está el DNS de `ksf.es` | Publicar y hacer el cambio de dominio | Antes de la vista previa |
| Cuenta de Resend y dominio `ksf.es` verificado | Formulario | Antes de la vista previa |
| Planos del reel (25–30 s) de la videoteca de Vimeo, o permiso para proponer una selección | Hero | Antes del 20/10; mientras tanto, fotos |
| Confirmar la lista de plataformas y sus URLs | Página `/plataformas` | Durante la construcción |
| Logo vectorial original, si existe | Nitidez del logo | Durante la construcción |
| Material de casos | Fase 2 (`/casos`) | Después del 23/10 |
