import { handleContact, type ContactEnv } from '../../src/lib/contact';

export async function onRequestPost(ctx: { request: Request; env: ContactEnv }): Promise<Response> {
  return handleContact(ctx.request, ctx.env);
}
