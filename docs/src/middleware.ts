import { defineMiddleware } from 'astro:middleware';

/**
 * Inject COOP/COEP headers on the /playground route (and locale-prefixed
 * variants) so WebContainer.boot() can succeed — crossOriginIsolated only
 * becomes true when the document is served with both headers. Only this route
 * is cross-origin isolated, keeping the rest of the docs site unrestricted
 * (third-party scripts, fonts, etc.).
 *
 * This runs in `astro dev` / any SSR adapter. For static hosts (Netlify,
 * Cloudflare Pages) the equivalent headers are declared in `public/_headers`.
 */
const PLAYGROUND_PATHS = ['/playground', '/zh/playground', '/en/playground', '/coep-test'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isPlayground = PLAYGROUND_PATHS.some(
    (p) => pathname === p || pathname === `${p}/` || pathname.startsWith(`${p}/`)
  );
  console.log('[mw] path=' + pathname + ' isPlayground=' + isPlayground);

  if (!isPlayground) return next();

  context.locals.isPlaygroundRoute = true;
  const response = await next();
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return response;
});
