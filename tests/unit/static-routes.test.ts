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
    expect(normalizeBase('ajs-website')).toBe('/ajs-website/')
    expect(normalizeBase('/ajs-website/')).toBe('/ajs-website/')
  })

  it('builds absolute URLs without duplicate slashes', () => {
    expect(siteUrl(new URL('https://example.com'), '/ajs-website/', 'en/about/')).toBe(
      'https://example.com/ajs-website/en/about/',
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
    expect(buildRobotsText(new URL('https://example.com'), '/ajs-website')).toContain(
      'Sitemap: https://example.com/ajs-website/sitemap.xml',
    )
  })

  it('builds escaped sitemap XML', () => {
    const xml = buildSitemapXml(new URL('https://example.com'), '/', ['galleries/a&b/'])
    expect(xml).toContain('<urlset')
    expect(xml).toContain('https://example.com/galleries/a&amp;b/')
  })
})
