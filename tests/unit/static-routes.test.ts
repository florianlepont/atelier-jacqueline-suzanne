import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {
  AI_CRAWLER_USER_AGENTS,
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

interface RobotsGroup {
  agents: string[]
  rules: string[]
}

// Splits robots.txt into blank-line separated groups; the Sitemap line is not
// part of any group (it is a standalone directive).
function parseRobotsGroups(text: string): {groups: RobotsGroup[]; sitemaps: string[]} {
  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []
  for (const block of text.split(/\n\s*\n/)) {
    const group: RobotsGroup = {agents: [], rules: []}
    for (const line of block.split('\n').map((value) => value.trim()).filter(Boolean)) {
      if (line.toLowerCase().startsWith('sitemap:')) sitemaps.push(line)
      else if (line.toLowerCase().startsWith('user-agent:')) group.agents.push(line.slice('user-agent:'.length).trim())
      else group.rules.push(line)
    }
    if (group.agents.length > 0) groups.push(group)
  }
  return {groups, sitemaps}
}

describe('robots.txt AI crawler opt-out', () => {
  const origin = new URL('https://example.com')
  const expectedAgents = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'CCBot',
    'Google-Extended',
    'anthropic-ai',
    'ClaudeBot',
    'Claude-Web',
    'Bytespider',
    'PerplexityBot',
    'Applebot-Extended',
  ]

  it('exports exactly the 11 crawler names, without duplicates', () => {
    expect([...AI_CRAWLER_USER_AGENTS].sort()).toEqual([...expectedAgents].sort())
    expect(new Set(AI_CRAWLER_USER_AGENTS).size).toBe(AI_CRAWLER_USER_AGENTS.length)
  })

  it('keeps the generic group first and allow-only, so search engines stay welcome', () => {
    const text = buildRobotsText(origin, '/')
    expect(text.startsWith('User-agent: *\nAllow: /\n')).toBe(true)
    const {groups} = parseRobotsGroups(text)
    expect(groups[0]).toEqual({agents: ['*'], rules: ['Allow: /']})
    expect(groups[0].rules.some((rule) => rule.startsWith('Disallow'))).toBe(false)
  })

  it('gives every AI crawler its own group with exactly Disallow: /', () => {
    const {groups} = parseRobotsGroups(buildRobotsText(origin, '/'))
    const aiGroups = groups.slice(1)
    expect(aiGroups).toHaveLength(expectedAgents.length)
    for (const name of expectedAgents) {
      const group = groups.find((candidate) => candidate.agents.includes(name))
      expect(group, name).toEqual({agents: [name], rules: ['Disallow: /']})
    }
    // One agent per group: some simple parsers only honour the last agent line of a shared group.
    expect(aiGroups.every((group) => group.agents.length === 1)).toBe(true)
  })

  it('emits a single Sitemap line, last, ending with one trailing newline', () => {
    const text = buildRobotsText(origin, '/')
    const {sitemaps} = parseRobotsGroups(text)
    expect(sitemaps).toEqual(['Sitemap: https://example.com/sitemap.xml'])
    const lines = text.split('\n').filter((line) => line.trim() !== '')
    expect(lines[lines.length - 1]).toBe(sitemaps[0])
    expect(text.endsWith('\n')).toBe(true)
    expect(text.endsWith('\n\n')).toBe(false)
  })

  it('keeps the Sitemap URL base-aware for the project-page base and the root base', () => {
    expect(parseRobotsGroups(buildRobotsText(new URL('https://florianlepont.github.io'), '/atelier-jacqueline-suzanne')).sitemaps).toEqual([
      'Sitemap: https://florianlepont.github.io/atelier-jacqueline-suzanne/sitemap.xml',
    ])
    expect(parseRobotsGroups(buildRobotsText(new URL('https://atelierjacquelinesuzanne.fr'), '/')).sitemaps).toEqual([
      'Sitemap: https://atelierjacquelinesuzanne.fr/sitemap.xml',
    ])
  })

  it('keeps src/pages/robots.txt.ts delegating to buildRobotsText', () => {
    const source = readFileSync('src/pages/robots.txt.ts', 'utf8')
    expect(source).toContain("from '../lib/static-routes'")
    expect(source).toMatch(/buildRobotsText\(/)
  })
})
