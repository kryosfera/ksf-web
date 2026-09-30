import { gsap } from 'gsap';
import { formatNumber } from '../lib/format';

const tweens = new WeakMap<HTMLElement, gsap.core.Tween>();

/** Detiene los contadores en curso (p. ej. al salir de la página). */
export function killCounters(els: HTMLElement[]): void {
  els.forEach((el) => { tweens.get(el)?.kill(); tweens.delete(el); });
}

export function countUp(els: HTMLElement[]): void {
  killCounters(els);
  els.forEach((el, i) => {
    const to = Number(el.dataset.to);
    const pre = el.dataset.pre ?? '';
    const o = { v: 0 };
    tweens.set(el, gsap.to(o, { v: to, duration: 1.6, delay: i * 0.1, ease: 'power2.out', overwrite: true,
      onUpdate: () => { el.textContent = pre + formatNumber(o.v); } }));
  });
}
