import type {APIRoute} from 'astro'

export const GET: APIRoute = ({site}) => {
  const origin = site ?? new URL('https://florianlepont.github.io')
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const sitemap = new URL(`${base}sitemap.xml`.replace(/\/+/g, '/'), origin).toString()
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  })
}
