import { describe, it, expect } from 'vitest';
import { formatNumber } from '../../src/lib/format';

describe('formatNumber', () => {
  it('pone punto de miles también con 4 cifras (como el catálogo)', () => { expect(formatNumber(2266)).toBe('2.266'); });
  it('deja igual los números de 3 cifras', () => { expect(formatNumber(183)).toBe('183'); });
  it('agrupa millones', () => { expect(formatNumber(1234567)).toBe('1.234.567'); });
  it('redondea decimales', () => { expect(formatNumber(104.6)).toBe('105'); });
});
