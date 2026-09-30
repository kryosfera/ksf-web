import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { load } from 'js-yaml';
import { cifrasSchema, congresosSchema, reelSchema, equipoSchema, plataformaSchema, SERVICIO_SLUGS } from '../../src/lib/schemas';

const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('datos', () => {
  it('cifras, congresos, equipo y plataformas cumplen su esquema', () => {
    expect(() => cifrasSchema.parse(json('src/data/cifras.json'))).not.toThrow();
    expect(() => congresosSchema.parse(json('src/data/congresos.json'))).not.toThrow();
    expect(() => equipoSchema.parse(json('src/data/equipo.json'))).not.toThrow();
    for (const p of json('src/data/plataformas.json')) expect(() => plataformaSchema.parse(p)).not.toThrow();
  });
  it('el reel es coherente: tiempos crecientes, dentro del total y con imágenes existentes', () => {
    const reel = reelSchema.parse(json('src/data/reel.json'));
    reel.shots.forEach((s, i) => {
      if (i > 0) expect(s.start).toBeGreaterThan(reel.shots[i - 1].start);
      expect(s.start).toBeLessThan(reel.total);
      expect(existsSync(`src/assets/reel/${s.imagen}`)).toBe(true);
    });
  });
  it('hay una ficha por cada uno de los 9 servicios', () => {
    const files = readdirSync('src/content/servicios').map((f) => f.replace(/\.md$/, '')).sort();
    expect(files).toEqual([...SERVICIO_SLUGS].sort());
  });
  it('los plataformas: e imagen: de cada servicio existen', () => {
    const ids = new Set((json('src/data/plataformas.json') as Array<{ id: string }>).map((p) => p.id));
    for (const f of readdirSync('src/content/servicios')) {
      const fm = load(readFileSync(`src/content/servicios/${f}`, 'utf8').split(/^---$/m)[1]) as { plataformas?: string[]; imagen?: string };
      for (const id of fm.plataformas ?? []) expect(ids.has(id), `${f}: plataforma «${id}» no está en plataformas.json`).toBe(true);
      if (fm.imagen) expect(existsSync(`src/assets/reel/${fm.imagen}`), `${f}: no existe src/assets/reel/${fm.imagen}`).toBe(true);
    }
  });
});
