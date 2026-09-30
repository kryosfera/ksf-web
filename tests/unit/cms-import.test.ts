import { describe, it, expect } from 'vitest';
import { mapCmsItem, logoFileName, isPublicado, fusionar } from '../../src/lib/cms-import';

const item = { fieldData: { name: 'SHIONOGI', slug: 'shionogi', web: 'https://www.shionogi.com/eu-es/es/',
  logo: { url: 'https://cdn.prod.website-files.com/5f68/69bb_SHIONOGI_group_Brand_mark_Vtype.png' } } };

describe('mapCmsItem', () => {
  it('convierte un cliente con logo local', () => {
    expect(mapCmsItem(item, '/clientes/shionogi.png'))
      .toEqual({ id: 'shionogi', nombre: 'SHIONOGI', web: 'https://www.shionogi.com/eu-es/es/', logo: '/clientes/shionogi.png' });
  });
  it('deja logo null si no hay fichero', () => { expect(mapCmsItem(item, null).logo).toBeNull(); });
  it('acepta web y logo nulos (organizaciones)', () => {
    const org = { fieldData: { name: 'GLOSAN', slug: 'glosan', web: null, logo: null } };
    expect(mapCmsItem(org, null)).toEqual({ id: 'glosan', nombre: 'GLOSAN', web: null, logo: null });
  });
});

describe('logoFileName', () => {
  it('saca el nombre del fichero de la URL del CDN', () => {
    expect(logoFileName(item.fieldData.logo.url)).toBe('69bb_SHIONOGI_group_Brand_mark_Vtype.png');
  });
  it('decodifica %20', () => { expect(logoFileName('https://x/a/Logo%20Uno.svg')).toBe('Logo Uno.svg'); });
});

describe('isPublicado', () => {
  it('descarta borradores y archivados', () => {
    expect(isPublicado({ ...item, isDraft: false, isArchived: false })).toBe(true);
    expect(isPublicado({ ...item, isDraft: true, isArchived: false })).toBe(false);
    expect(isPublicado({ ...item, isDraft: false, isArchived: true })).toBe(false);
  });
});

describe('fusionar', () => {
  const imp = (id: string, nombre: string, logo: string | null = null, web: string | null = null) => ({ id, nombre, web, logo });
  it('conserva los campos editados a mano y los campos extra', () => {
    const r = fusionar([{ ...imp('glosan', 'Fundación Andaluza de Nefrología'), web: 'https://glosan.es', nota: 'a mano' }], [imp('glosan', 'Fundación Andaluza de Nefrologia')]);
    expect(r).toEqual([{ id: 'glosan', nombre: 'Fundación Andaluza de Nefrología', web: 'https://glosan.es', logo: null, nota: 'a mano' }]);
  });
  it('actualiza el logo solo cuando el import trae uno', () => {
    expect(fusionar([imp('a', 'A', '/clientes/a-viejo.png')], [imp('a', 'A', '/clientes/a.svg')])[0].logo).toBe('/clientes/a.svg');
    expect(fusionar([imp('a', 'A', '/clientes/a-mano.png')], [imp('a', 'A', null)])[0].logo).toBe('/clientes/a-mano.png');
  });
  it('añade los nuevos, conserva los añadidos a mano y retira borradores y archivados', () => {
    const r = fusionar([imp('mano', 'Zeta a mano'), imp('b-braun', 'B Braun')], [imp('abbott', 'Abbott')], new Set(['b-braun']));
    expect(r.map((e) => e.id)).toEqual(['abbott', 'mano']);
  });
  it('ordena por nombre en español', () => {
    expect(fusionar([], [imp('b', 'Ñandú'), imp('a', 'Ángel'), imp('c', 'Zeta')]).map((e) => e.nombre)).toEqual(['Ángel', 'Ñandú', 'Zeta']);
  });
});
