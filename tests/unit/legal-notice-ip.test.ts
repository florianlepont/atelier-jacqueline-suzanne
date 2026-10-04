import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

// Source-level contract for the legal notice: both languages carry an
// intellectual-property section (author's rights, no AI training, text and
// data mining opt-out) and the shared footer always has a rights line.

const pages = {
  fr: readFileSync('src/pages/mentions-legales.astro', 'utf8'),
  en: readFileSync('src/pages/en/mentions-legales.astro', 'utf8'),
}
const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8')

describe('legal notice: intellectual property', () => {
  it.each([
    ['fr', 'Propriété intellectuelle', "d'intelligence artificielle", 'L. 122-5-3'],
    ['en', 'Intellectual property', 'artificial intelligence', 'L. 122-5-3'],
  ] as const)('%s page has the section, the AI clause and the TDM opt-out', (lang, heading, ai, article) => {
    const html = pages[lang].replace(/\s+/g, ' ')
    expect(html).toContain(`<h2>${heading}</h2>`)
    expect(html).toContain(ai)
    expect(html).toContain(article)
    expect(html).toContain('contact@atelierjacquelinesuzanne.fr')
  })
})

describe('shared footer', () => {
  it('falls back to a rights line when the footerText field is empty', () => {
    expect(layout).toContain('© Romane Lepont — Tous droits réservés')
    expect(layout).toContain('© Romane Lepont — All rights reserved')
    expect(layout).toMatch(/footerText = siteSettings\?\.footerText\?\.\[locale\]\?\.trim\(\) \|\| defaultFooterText/)
  })
})
