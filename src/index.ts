import { onRequestPost } from "./functions/api/audit";

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/audit to your audit handler
    if (url.pathname === "/api/audit") {
      return onRequestPost({
        request,
        env,
        params: {},
        data: {},
        next: () => Promise.resolve(new Response("Not found", { status: 404 })),
        waitUntil: (promise) => ctx.waitUntil(promise),
      });
    }

    // Fall back to static assets (frontend)
    return env.ASSETS.fetch(request);
  },
};
