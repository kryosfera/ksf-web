import { gsap } from 'gsap';
import { formatNumber } from '../lib/format';

export function countUp(els: HTMLElement[]): void {
  els.forEach((el, i) => {
    const to = Number(el.dataset.to);
    const pre = el.dataset.pre ?? '';
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, delay: i * 0.1, ease: 'power2.out', overwrite: true,
      onUpdate: () => { el.textContent = pre + formatNumber(o.v); } });
  });
}
