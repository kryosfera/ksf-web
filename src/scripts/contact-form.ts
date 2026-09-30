import { onPage } from './lifecycle';
import { SERVICIO_SLUGS } from '../lib/servicios';

interface TurnstileApi { render: (el: HTMLElement, o: { sitekey: string; language?: string }) => string; remove: (id: string) => void; reset: (id?: string) => void }
const w = window as unknown as { turnstile?: TurnstileApi };
let loading: Promise<TurnstileApi | undefined> | undefined;
/** Carga api.js una sola vez (render explícito: el ClientRouter no vuelve a ejecutar scripts). */
function loadTurnstile(): Promise<TurnstileApi | undefined> {
  if (w.turnstile) return Promise.resolve(w.turnstile);
  loading ??= new Promise((resolve) => {
    const el = document.createElement('script');
    el.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    el.async = true;
    el.onload = () => resolve(w.turnstile);
    el.onerror = () => { loading = undefined; resolve(undefined); };
    document.head.appendChild(el);
  });
  return loading;
}

onPage(() => {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const sel = form.querySelector<HTMLSelectElement>('#servicio')!;
  const pre = new URLSearchParams(location.search).get('servicio');
  if (pre && ((SERVICIO_SLUGS as readonly string[]).includes(pre) || pre === 'otra')) sel.value = pre;

  let widgetId: string | undefined;
  let gone = false;
  const holder = form.querySelector<HTMLElement>('[data-turnstile]');
  if (holder) void loadTurnstile().then((t) => {
    if (t && !gone) widgetId = t.render(holder, { sitekey: holder.dataset.sitekey ?? '', language: 'es' });
  });

  let sending = false;
  const clear = () => form.querySelectorAll<HTMLElement>('.err').forEach((e) => { e.textContent = ''; });
  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (sending) return;
    sending = true; btn.disabled = true; btn.textContent = 'Enviando…'; status.textContent = ''; status.setAttribute('role', 'status'); clear();
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        form.reset(); status.textContent = 'Hemos recibido tu solicitud. Te responderemos en breve.';
      } else if (res.status === 400 && body.errors) {
        for (const [k, msg] of Object.entries(body.errors as Record<string, string>)) {
          const el = form.querySelector<HTMLElement>(`#${k}-error`); if (el) el.textContent = msg;
          form.querySelector(`#${k}`)?.setAttribute('aria-invalid', 'true');
        }
        status.setAttribute('role', 'alert');
        // errors.form: el servidor no pudo leer el envío; no hay ningún campo que marcar.
        const formMsg = (body.errors as Record<string, string>).form;
        status.textContent = formMsg ? `${formMsg} Inténtalo de nuevo o escríbenos a info@ksf.es.` : 'Revisa los campos marcados.';
        const first = [...form.querySelectorAll<HTMLElement>('[aria-invalid="true"]')][0];
        first?.focus();
      } else {
        status.setAttribute('role', 'alert');
        status.textContent = 'No hemos podido enviar tu solicitud. Inténtalo de nuevo o escríbenos a info@ksf.es.';
      }
    } catch {
      status.setAttribute('role', 'alert');
      status.textContent = 'No hemos podido enviar tu solicitud. Inténtalo de nuevo o escríbenos a info@ksf.es.';
    } finally {
      sending = false; btn.disabled = false; btn.textContent = 'Enviar solicitud';
      if (widgetId) w.turnstile?.reset(widgetId);
    }
  };
  form.addEventListener('submit', onSubmit);
  return () => {
    form.removeEventListener('submit', onSubmit);
    gone = true;
    if (widgetId) w.turnstile?.remove(widgetId);
  };
});
