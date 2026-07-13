import type {APIRoute} from 'astro'
import {getAboutPage, getGalleries, getHomePage} from '../lib/sanity'

function xml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }
    return entities[character]
  })
}

export const GET: APIRoute = async ({site}) => {
  const origin = site ?? new URL('https://florianlepont.github.io')
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const [galleries, homePage, aboutPage] = await Promise.all([
    getGalleries(),
    getHomePage(),
    getAboutPage(),
  ])
  const localizedPaths = [
    ...(homePage?.seo?.noIndex ? [] : ['']),
    ...(aboutPage?.seo?.noIndex ? [] : ['about/']),
    'contact/',
    'mentions-legales/',
    'confidentialite/',
    ...galleries
      .filter((gallery) => !gallery.seo?.noIndex)
      .map((gallery) => `galleries/${gallery.slug}/`),
  ]
  const urls = localizedPaths.flatMap((path) => [
    new URL(`${base}${path}`.replace(/\/+/g, '/'), origin).toString(),
    new URL(`${base}en/${path}`.replace(/\/+/g, '/'), origin).toString(),
  ])

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${xml(url)}</loc></url>`).join('\n')}
</urlset>`

  return new Response(body, {headers: {'Content-Type': 'application/xml; charset=utf-8'}})
}
