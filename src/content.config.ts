import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { servicioSchema, plataformaSchema, entidadSchema } from './lib/schemas';

export const collections = {
  servicios: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/servicios' }), schema: servicioSchema }),
  plataformas: defineCollection({ loader: file('src/data/plataformas.json'), schema: plataformaSchema }),
  clientes: defineCollection({ loader: file('src/data/clientes.json'), schema: entidadSchema }),
  organizaciones: defineCollection({ loader: file('src/data/organizaciones.json'), schema: entidadSchema }),
};
