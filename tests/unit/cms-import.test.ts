import { describe, it, expect } from 'vitest';
import { mapCmsItem, logoFileName } from '../../src/lib/cms-import';

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
