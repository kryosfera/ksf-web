import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { onPage } from './lifecycle';
import { countUp } from './counters';

gsap.registerPlugin(ScrollTrigger, SplitText);

onPage(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Titulares desde máscara
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } }) });
    });
    // Bloques que suben al entrar
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true,
      onEnter: (els) => gsap.from(els, { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }) });
    // Cifras fuera del hero
    document.querySelectorAll<HTMLElement>('[data-counters]:not([data-in-hero])').forEach((box) => {
      ScrollTrigger.create({ trigger: box, start: 'top 85%', once: true,
        onEnter: () => countUp([...box.querySelectorAll<HTMLElement>('.num')]) });
    });
    // Botón magnético (solo con puntero fino)
    const offs: Array<() => void> = [];
    if (matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
        const move = (e: PointerEvent) => { const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); };
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.4)' });
        el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
        offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
      });
    }
    return () => offs.forEach((f) => f());
  });
  return () => mm.revert();
});
