import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {
  buildRobotsText,
  buildSitemapXml,
  escapeXml,
  localizedSitemapPaths,
  normalizeBase,
  siteUrl,
} from '../../src/lib/static-routes'

describe('static route helpers', () => {
  it('normalizes root and project-page bases', () => {
    expect(normalizeBase('/')).toBe('/')
    expect(normalizeBase('atelier-jacqueline-suzanne')).toBe('/atelier-jacqueline-suzanne/')
    expect(normalizeBase('/atelier-jacqueline-suzanne/')).toBe('/atelier-jacqueline-suzanne/')
  })

  it('builds absolute URLs without duplicate slashes', () => {
    expect(siteUrl(new URL('https://example.com'), '/atelier-jacqueline-suzanne/', 'en/about/')).toBe(
      'https://example.com/atelier-jacqueline-suzanne/en/about/',
    )
  })

  it('escapes all XML-sensitive characters', () => {
    expect(escapeXml(`<>&'"`)).toBe('&lt;&gt;&amp;&apos;&quot;')
  })

  it('omits noIndex entries and emits both locales for every public path', () => {
    expect(
      localizedSitemapPaths([
        {path: ''},
        {path: 'about/', noIndex: true},
        {path: 'galleries/a&b/'},
      ]),
    ).toEqual(['', 'en/', 'galleries/a&b/', 'en/galleries/a&b/'])
  })

  it('expands édition paths (overview + detail) into both locales, mirroring galleries', () => {
    expect(
      localizedSitemapPaths([{path: 'editions/'}, {path: 'editions/rebut/'}]),
    ).toEqual(['editions/', 'en/editions/', 'editions/rebut/', 'en/editions/rebut/'])
  })

  it('builds a base-aware robots file', () => {
    expect(buildRobotsText(new URL('https://example.com'), '/atelier-jacqueline-suzanne')).toContain(
      'Sitemap: https://example.com/atelier-jacqueline-suzanne/sitemap.xml',
    )
  })

  it('builds escaped sitemap XML', () => {
    const xml = buildSitemapXml(new URL('https://example.com'), '/', ['galleries/a&b/'])
    expect(xml).toContain('<urlset')
    expect(xml).toContain('https://example.com/galleries/a&amp;b/')
  })
})

// quick-260811-kog-04: the four bilingual detail-page route files
// (galleries fr/en, éditions fr/en) used to each duplicate an entire
// fetch+model+render implementation. Now they must stay thin
// getStaticPaths-plus-delegation adapters, with all model-building and
// rendering living in the shared *DetailPage.astro components. A physical
// route silently regressing back to duplicating logic, or losing its
// getStaticPaths export, would break static generation without a runtime
// error until build time — this is a static, source-text guard against
// exactly that regression, deliberately independent of any live build.
describe('bilingual detail-page adapters stay thin and physically present (quick-260811-kog-04)', () => {
  const adapters = [
    {
      path: 'src/pages/galleries/[slug].astro',
      component: 'GalleryDetailPage',
      locale: 'fr',
    },
    {
      path: 'src/pages/en/galleries/[slug].astro',
      component: 'GalleryDetailPage',
      locale: 'en',
    },
    {
      path: 'src/pages/editions/[slug].astro',
      component: 'EditionDetailPage',
      locale: 'fr',
    },
    {
      path: 'src/pages/en/editions/[slug].astro',
      component: 'EditionDetailPage',
      locale: 'en',
    },
  ]

  it.each(adapters)('$path exists, exports getStaticPaths, and delegates to $component with locale="$locale"', ({
    path,
    component,
    locale,
  }) => {
    const source = readFileSync(path, 'utf8')
    expect(source).toContain('export const getStaticPaths')
    expect(source).toContain(`import ${component} from`)
    expect(source).toContain(`<${component}`)
    expect(source).toContain(`locale="${locale}"`)
  })

  it('none of the four adapters re-derive SEO, JSON-LD, or hero/grid image URLs themselves', () => {
    for (const {path} of adapters) {
      const source = readFileSync(path, 'utf8')
      expect(source).not.toContain('fullSizeUrl')
      expect(source).not.toContain('structuredData')
      expect(source).not.toContain('pickHeroIndex')
    }
  })
})
