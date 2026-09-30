// Worker de ksf.es: sirve dist/ como assets estáticos (con _redirects, _headers y 404.html)
// y atiende el formulario en /api/contacto.
import { handleContact, type ContactEnv } from '../src/lib/contact';

interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contacto') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
