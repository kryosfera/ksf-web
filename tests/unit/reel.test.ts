import { describe, it, expect } from 'vitest';
import { shotIndexAt, progressInShot } from '../../src/lib/reel';

const starts = [0, 5, 10];
const total = 15;

describe('shotIndexAt', () => {
  it('devuelve el plano que contiene el instante', () => {
    expect(shotIndexAt(starts, 0, total)).toBe(0);
    expect(shotIndexAt(starts, 4.99, total)).toBe(0);
    expect(shotIndexAt(starts, 5, total)).toBe(1);
    expect(shotIndexAt(starts, 14.9, total)).toBe(2);
  });
  it('da la vuelta al llegar al final (bucle)', () => { expect(shotIndexAt(starts, 16, total)).toBe(0); });
  it('acepta tiempos negativos sin romperse', () => { expect(shotIndexAt(starts, -1, total)).toBe(2); });
  it('devuelve -1 sin planos', () => { expect(shotIndexAt([], 3, total)).toBe(-1); });
});

describe('progressInShot', () => {
  it('va de 0 a 1 dentro del plano', () => {
    expect(progressInShot(starts, 5, total)).toBeCloseTo(0);
    expect(progressInShot(starts, 7.5, total)).toBeCloseTo(0.5);
  });
  it('el último plano termina en el total', () => { expect(progressInShot(starts, 12.5, total)).toBeCloseTo(0.5); });
});
