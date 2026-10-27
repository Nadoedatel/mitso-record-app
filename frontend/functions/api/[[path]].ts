/**
 * Cloudflare Pages Function: forwards /api/* to the NestJS backend on Render.
 *
 * Why a proxy and not a direct call: the refresh token is an httpOnly cookie with SameSite=Strict and path /api/auth.
 * pages.dev and onrender.com are different sites, so the browser would never send it back. Through this proxy the
 * browser sees one origin, the cookie is first-party and no CORS is involved.
 *
 * BACKEND_ORIGIN (Pages env variable) is the Render service origin without /api, e.g. https://mitso-backend.onrender.com
 */
interface Env {
  BACKEND_ORIGIN?: string
}

interface PagesContext {
  request: Request
  env: Env
}

const HOP_BY_HOP = ['host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade']

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  const origin = env.BACKEND_ORIGIN?.replace(/\/+$/, '')
  if (!origin) {
    // Same shape as the backend's global exception filter, so the frontend shows it like any API error
    return Response.json(
      { statusCode: 502, timestamp: new Date().toISOString(), message: 'BACKEND_ORIGIN не задан в настройках Pages' },
      { status: 502 },
    )
  }

  const url = new URL(request.url)
  const target = `${origin}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  for (const name of HOP_BY_HOP) headers.delete(name)
  // Overwrite, not append: the client cannot spoof its IP for the login rate limit. Render adds one more hop
  // (Cloudflare egress), hence TRUST_PROXY=2 on the backend
  const clientIp = request.headers.get('cf-connecting-ip')
  if (clientIp) headers.set('x-forwarded-for', clientIp)
  headers.set('x-forwarded-proto', 'https')
  headers.set('x-forwarded-host', url.host)

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // Redirects go back to the browser as they are, with Set-Cookie intact
    redirect: 'manual',
  })

  // Set-Cookie passes through unchanged: host-only cookies land on the pages.dev origin
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
