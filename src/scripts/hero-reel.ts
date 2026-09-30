import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { shotIndexAt, progressInShot } from '../lib/reel';
import { countUp, killCounters } from './counters';
import { onPage } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

interface Shot { start: number; kicker: string; titulo: string; texto: string; servicio: number }

export function initHeroReel(root: HTMLElement): () => void {
  const data = JSON.parse(root.querySelector('script[data-reel]')!.textContent!) as { total: number; shots: Shot[] };
  const starts = data.shots.map((s) => s.start);
  const layers = [...root.querySelectorAll<HTMLElement>('[data-shot]')];
  const segs = [...root.querySelectorAll<HTMLButtonElement>('[data-seg]')];
  const fills = segs.map((s) => s.querySelector('i') as HTMLElement);
  const k = root.querySelector<HTMLElement>('[data-l3-k]')!;
  const t = root.querySelector<HTMLElement>('[data-l3-t]')!;
  const d = root.querySelector<HTMLElement>('[data-l3-d]')!;
  const bar = root.querySelector<HTMLElement>('[data-l3-bar]')!;
  const tc = root.querySelector<HTMLElement>('[data-tc]')!;
  const l3 = root.querySelector<HTMLElement>('.l3')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-pause]')!;
  const svc = [...root.querySelectorAll<HTMLElement>('[data-svc]')];
  const nums = [...root.querySelectorAll<HTMLElement>('.num')];
  let video = root.querySelector<HTMLVideoElement>('video[data-reel-video]');

  let clock = 0, current = -1, playing = true, motion = false;
  const offs: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(ev, fn as EventListener); offs.push(() => el.removeEventListener(ev, fn as EventListener));
  };

  const dropVideo = () => { video?.remove(); video = null; };
  if (video) {
    on(video, 'error', dropVideo);
    video.querySelectorAll('source').forEach((s) => on(s as unknown as HTMLElement, 'error', dropVideo));
    // Si el fallo ocurrió antes de enganchar los listeners, no habrá evento: se comprueba el estado.
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) dropVideo();
  }
  // Anuncio a lectores de pantalla solo cuando el cambio lo provoca la persona.
  const live = (v: 'off' | 'polite') => l3.setAttribute('aria-live', v);
  const videoReady = () => !!video && !video.error && video.readyState >= 2;
  const now = () => (videoReady() ? video!.currentTime : clock);

  function show(i: number) {
    const prev = current; current = i;
    const s = data.shots[i];
    segs.forEach((sg, j) => sg.classList.toggle('done', j < i));
    fills.forEach((f, j) => { if (j !== i) gsap.set(f, { scaleX: j < i ? 1 : 0 }); });
    tc.textContent = `${String(i + 1).padStart(2, '0')} / ${String(data.shots.length).padStart(2, '0')}`;
    svc.forEach((el) => el.classList.toggle('is-on', Number(el.dataset.svc) === s.servicio));
    layers.forEach((l, j) => l.classList.toggle('is-on', j === i));

    if (!motion || prev === -1) { k.textContent = s.kicker; t.textContent = s.titulo; d.textContent = s.texto; return; }

    if (prev >= 0 && !videoReady()) {
      gsap.fromTo(layers[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, ease: 'power2.inOut', overwrite: true });
      gsap.to(layers[prev], { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut', overwrite: true });
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(layers[i].querySelector('img'), { scale: 1.16, xPercent: -2.5 * dir }, { scale: 1.02, xPercent: 2.5 * dir, duration: 6.6, ease: 'none', overwrite: true });
    }
    const txt = [k, t, d];
    gsap.timeline()
      .to(txt, { yPercent: -110, duration: 0.35, ease: 'power2.in', stagger: 0.04 })
      .to(bar, { scaleX: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .add(() => { k.textContent = s.kicker; t.textContent = s.titulo; d.textContent = s.texto; })
      .fromTo(txt, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 })
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '<');
  }

  const tick = (_time: number, deltaMs: number) => {
    if (playing && !videoReady()) clock = (clock + deltaMs / 1000) % data.total;
    const tt = now();
    const i = shotIndexAt(starts, tt, data.total);
    if (i !== current) show(i);
    gsap.set(fills[i], { scaleX: progressInShot(starts, tt, data.total) });
  };

  function jump(i: number) {
    live('polite');
    clock = starts[i];
    if (videoReady()) video!.currentTime = starts[i];
    show(i);
  }
  segs.forEach((sg, i) => on(sg, 'click', () => jump(i)));
  svc.forEach((el) => {
    const b = el.querySelector('button'); if (!b) return;
    on(b, 'click', () => {
      const n = Number(el.dataset.svc);
      for (let step = 1; step <= data.shots.length; step++) {
        const j = (current + step) % data.shots.length;
        if (data.shots[j].servicio === n) { jump(j); break; }
      }
    });
  });
  on(pause, 'click', () => {
    playing = !playing;
    pause.textContent = playing ? '❚❚ Pausa' : '▶ Reproducir';
    pause.setAttribute('aria-pressed', String(!playing));
    live(playing ? 'off' : 'polite');
    if (videoReady()) (playing ? video!.play() : video!.pause());
  });

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    motion = true; playing = true; live('off');
    gsap.from(root.querySelectorAll('.claim .line > span'), { yPercent: 115, duration: 1.1, stagger: 0.1, ease: 'expo.out', delay: 0.2 });
    gsap.from(root.querySelectorAll('.sub, .cta > *, .l3, .prog'), { y: 14, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.7 });
    return () => { motion = false; };
  });
  mm.add('(prefers-reduced-motion: reduce)', () => {
    playing = false; live('polite'); pause.hidden = true; video?.pause();
  });
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('is-pinned');
    const reel = root.querySelector('.reel')!, shade = root.querySelector('.shade')!;
    const panel = root.querySelector('.panel')!, figs = root.querySelector('.figs')!;
    gsap.set([panel, figs], { autoAlpha: 0 });
    gsap.timeline({ defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: { trigger: root, start: 'top top', end: '+=170%', scrub: 1, pin: true, anticipatePin: 1 } })
      .fromTo(root.querySelector('.intro'), { y: 0, autoAlpha: 1 }, { y: -90, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, 0)
      .fromTo(root.querySelector('.prog'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 }, 0)
      .fromTo(reel, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(13% 4.5% 22% 46% round 22px)', duration: 0.5, ease: 'power2.inOut' }, 0.06)
      .fromTo(shade, { opacity: 1 }, { opacity: 0.35, duration: 0.5 }, 0.06)
      .fromTo(root.querySelector('.l3'), { y: 0, scale: 1 }, { y: () => -root.clientHeight * 0.115, scale: 0.9, transformOrigin: '100% 100%', duration: 0.5, ease: 'power2.inOut' }, 0.06)
      .fromTo(panel, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power2.out' }, 0.36)
      .fromTo(panel.querySelectorAll('li'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.025, ease: 'power2.out' }, 0.42)
      .fromTo(figs, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.62)
      .add(() => countUp(nums), 0.64)
      .to({}, { duration: 0.3 });
    return () => { root.classList.remove('is-pinned'); gsap.set([panel, figs], { clearProps: 'all' }); };
  });
  mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
    ScrollTrigger.create({ trigger: root.querySelector('.figs')!, start: 'top 85%', once: true, onEnter: () => countUp(nums) });
  });

  show(0);
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); killCounters(nums); mm.revert(); offs.forEach((f) => f()); };
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-hero-reel]');
  return root ? initHeroReel(root) : undefined;
});
