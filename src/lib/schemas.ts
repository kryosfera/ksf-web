import { z } from 'astro/zod';
import { SERVICIO_SLUGS } from './servicios';
export { SERVICIO_SLUGS };

export const servicioSchema = z.object({
  numero: z.number().int().min(1).max(9),
  titulo: z.string().min(2),
  modo: z.enum(['oscuro', 'claro']),
  nuevo: z.boolean().default(false),
  entradilla: z.string().min(10),
  imagen: z.string().optional(),            // nombre de fichero en src/assets/reel
  subservicios: z.array(z.object({
    titulo: z.string(),
    descripcion: z.string(),
    items: z.array(z.string()).min(1),
    ejemplos: z.array(z.string()).optional(),
  })).min(1),
  casos: z.array(z.object({ titulo: z.string(), texto: z.string() })).default([]),
  plataformas: z.array(z.string()).default([]),
  seo: z.object({ titulo: z.string().max(70), descripcion: z.string().max(160) }),
});

export const plataformaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  url: z.string().url().nullable(),
  descripcion: z.string(),
  publico: z.string(),
  servicio: z.enum(SERVICIO_SLUGS),
  nota: z.string().optional(),
});

export const entidadSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  web: z.string().url().nullable(),
  logo: z.string().nullable(),
});

export const cifrasSchema = z.object({
  periodo: z.string(),
  items: z.array(z.object({ valor: z.number(), prefijo: z.string().default(''), etiqueta: z.string() })).length(4),
});

export const congresosSchema = z.object({
  realizados: z.array(z.object({ ciudad: z.string(), evento: z.string() })),
  proximos: z.array(z.object({ congreso: z.string(), ciudad: z.string(), mes: z.string() })),
});

export const reelSchema = z.object({
  total: z.number().positive(),
  video: z.object({ mp4: z.string().nullable(), webm: z.string().nullable() }),
  shots: z.array(z.object({
    start: z.number().min(0),
    imagen: z.string(),
    alt: z.string(),
    kicker: z.string(),
    titulo: z.string(),
    texto: z.string(),
    servicio: z.number().int().min(1).max(9),
  })).min(1),
});

export const equipoSchema = z.array(z.object({ nombre: z.string(), rol: z.string(), foto: z.string().nullable() }));
