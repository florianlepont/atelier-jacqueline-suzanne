import type {APIRoute} from 'astro'
import {getAboutPage, getContactPage, getEditions, getGalleries, getHomePage} from '../lib/sanity'
import {buildSitemapXml, localizedSitemapPaths} from '../lib/static-routes'

export const GET: APIRoute = async ({site}) => {
  const origin = site ?? new URL('https://florianlepont.github.io')
  const [galleries, editions, homePage, aboutPage, contactPage] = await Promise.all([
    getGalleries(),
    getEditions(),
    getHomePage(),
    getAboutPage(),
    getContactPage(),
  ])
  const localizedPaths = localizedSitemapPaths([
    {path: '', noIndex: homePage?.seo?.noIndex},
    {path: 'about/', noIndex: aboutPage?.seo?.noIndex},
    {path: 'contact/', noIndex: contactPage?.seo?.noIndex},
    {path: 'mentions-legales/'},
    {path: 'confidentialite/'},
    ...galleries.map((gallery) => ({
      path: `galleries/${gallery.slug}/`,
      noIndex: gallery.seo?.noIndex,
    })),
    {path: 'editions/'},
    // No noIndex key here: edition has no `seo` field, so there is no
    // per-édition noindex source — every published édition unconditionally
    // appears in the sitemap (RESEARCH.md Pattern 4).
    ...editions.map((edition) => ({path: `editions/${edition.slug}/`})),
  ])

  const body = buildSitemapXml(origin, import.meta.env.BASE_URL, localizedPaths)

  return new Response(body, {headers: {'Content-Type': 'application/xml; charset=utf-8'}})
}
