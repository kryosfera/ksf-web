import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const file = readFileSync('public/_headers', 'utf8');
const lines = file.split('\n').filter((l) => l.trim() && !l.trimStart().startsWith('#'));

describe('public/_headers', () => {
  it('aplica las cabeceras de seguridad a todas las rutas', () => {
    expect(lines[0]).toBe('/*');
    const h = lines.slice(1).map((l) => l.trim());
    expect(h).toContain('X-Content-Type-Options: nosniff');
    expect(h).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(h).toContain('X-Frame-Options: DENY');
    expect(h).toContain('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    for (const l of lines.slice(1)) expect(l).toMatch(/^ {2}\S/);
  });
});
