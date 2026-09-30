import { onPage } from './lifecycle';
import { SERVICIO_SLUGS } from '../lib/servicios';

onPage(() => {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const sel = form.querySelector<HTMLSelectElement>('#servicio')!;
  const pre = new URLSearchParams(location.search).get('servicio');
  if (pre && ((SERVICIO_SLUGS as readonly string[]).includes(pre) || pre === 'otra')) sel.value = pre;

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
        form.reset(); status.textContent = 'Hemos recibido tu solicitud. Te responderemos en breve; también te hemos enviado un acuse por email.';
      } else if (res.status === 400 && body.errors) {
        for (const [k, msg] of Object.entries(body.errors as Record<string, string>)) {
          const el = form.querySelector<HTMLElement>(`#${k}-error`); if (el) el.textContent = msg;
          form.querySelector(`#${k}`)?.setAttribute('aria-invalid', 'true');
        }
        status.setAttribute('role', 'alert');
        status.textContent = 'Revisa los campos marcados.';
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
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    }
  };
  form.addEventListener('submit', onSubmit);
  return () => form.removeEventListener('submit', onSubmit);
});
