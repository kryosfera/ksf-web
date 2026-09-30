# ksf.es · Web corporativa de KSF Digital Healthcare

Astro 5 + Tailwind 4 + GSAP, desplegada en Cloudflare Pages. Contenido en el repo (`src/content`, `src/data`).

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # tests unitarios
npm run test:e2e     # tests de navegador
npm run build        # comprueba tipos y genera dist/
```

- Especificación: `docs/superpowers/specs/2026-09-30-ksf-web-design.md`
- Plan: `docs/superpowers/plans/2026-09-30-ksf-web.md`

## Variables de entorno

| Variable | Tipo | Dónde |
|---|---|---|
| `PUBLIC_TURNSTILE_SITEKEY` | **build** (Astro la incrusta en el HTML) | `.env` en local; variables de Cloudflare Pages (Production y Preview). **No** va en `.dev.vars`. Sin ella el build usa el sitekey de prueba y el formulario falla en producción. |
| `TURNSTILE_SECRET` | runtime (Function) | `.dev.vars` en local; secreto en Cloudflare Pages |
| `RESEND_API_KEY` | runtime (Function) | `.dev.vars` en local; secreto en Cloudflare Pages |
| `CONTACT_TO` | runtime (Function) | `info@ksf.es` |
| `CONTACT_FROM` | runtime (Function) | `web@ksf.es` (dominio verificado en Resend) |

Plantilla de las de runtime: `.dev.vars.example`. Si falta alguna, `/api/contacto` responde 500 y lo registra con `console.error`.
