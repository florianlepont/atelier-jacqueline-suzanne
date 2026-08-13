import {describe, expect, it, vi} from 'vitest'
import {
  sanitizeAboutPage,
  sanitizeContactPage,
  sanitizeEdition,
  sanitizeEditions,
  sanitizeEditionsPage,
  sanitizeGalleries,
  sanitizeGallery,
  sanitizeHomePage,
  sanitizeSiteSettings,
  warnForSanityIssues,
} from '../../src/lib/sanity-validation'

const renderableImage = {
  asset: {_ref: 'image-asset-1200x800-jpg'},
  alt: {fr: 'Une photographie', en: 'A photograph'},
}

describe('singleton sanitizers', () => {
  it('requires complete site title/footer locales and a navLabels object', () => {
    const valid = sanitizeSiteSettings({
      siteTitle: {fr: 'Atelier', en: 'Studio'},
      navLabels: {about: {fr: 'À propos'}, contact: 42},
      footerText: {fr: 'Tous droits réservés', en: 'All rights reserved'},
      defaultSeo: {title: 42},
    })
    expect(valid.value).toEqual({
      siteTitle: {fr: 'Atelier', en: 'Studio'},
      navLabels: {about: {fr: 'À propos'}},
      footerText: {fr: 'Tous droits réservés', en: 'All rights reserved'},
    })
    expect(valid.issues.map(({code}) => code)).toEqual(
      expect.arrayContaining(['navLabels.invalid_removed', 'defaultSeo.cleaned']),
    )
    expect(sanitizeSiteSettings({siteTitle: {fr: 'Atelier'}}).value).toBeNull()
  })

  it('keeps valid partial about fields and removes malformed nested fields', () => {
    const result = sanitizeAboutPage({
      biography: {fr: 'Biographie', en: 2},
      practice: {en: 'Practice'},
      medium: 'photography',
      image: {asset: {}, alt: {fr: 'Portrait'}},
      exhibitionImage: {asset: {_ref: 'image-exhibition'}, alt: {en: 'Exhibition'}},
      seo: {description: {fr: 'Artiste photographe'}},
    })
    expect(result.value).toEqual({
      biography: {fr: 'Biographie'},
      practice: {en: 'Practice'},
      exhibitionImage: {asset: {_ref: 'image-exhibition'}, alt: {en: 'Exhibition'}},
      seo: {description: {fr: 'Artiste photographe'}},
    })
    expect(result.issues.map(({code}) => code)).toEqual(
      expect.arrayContaining(['biography.cleaned', 'medium.cleaned', 'image.cleaned']),
    )
    expect(sanitizeAboutPage({}).value).toEqual({})
  })

  it('keeps partial home/editions intros and drops malformed intro or SEO', () => {
    expect(sanitizeHomePage({intro: {fr: 'Bonjour'}, seo: {noIndex: true}}).value).toEqual({
      intro: {fr: 'Bonjour'},
      seo: {noIndex: true},
    })
    expect(sanitizeHomePage({intro: [], seo: 'bad'}).value).toEqual({})
    expect(sanitizeEditionsPage({intro: {en: 'Printed objects'}}).value).toEqual({
      intro: {en: 'Printed objects'},
    })
    expect(sanitizeEditionsPage({intro: 12}).value).toEqual({})
  })

  it('filters malformed contact fields, emails and professional links', () => {
    const result = sanitizeContactPage({
      intro: {fr: 'Parlons de votre projet', en: false},
      publicEmail: 'not-an-email',
      location: {en: 'Paris'},
      availability: [],
      professionalLinks: [
        {_key: 'instagram', label: {fr: 'Instagram'}, url: 'https://instagram.com/ajs'},
        {label: {fr: 'Danger'}, url: 'javascript:alert(1)'},
        {label: {}, url: 'https://example.com'},
      ],
      seo: {image: {asset: {}}},
    })
    expect(result.value).toEqual({
      intro: {fr: 'Parlons de votre projet'},
      location: {en: 'Paris'},
      professionalLinks: [
        {_key: 'instagram', label: {fr: 'Instagram'}, url: 'https://instagram.com/ajs'},
      ],
    })
    expect(result.issues.map(({code}) => code)).toEqual(
      expect.arrayContaining([
        'publicEmail.removed',
        'intro.cleaned',
        'availability.cleaned',
        'professionalLinks.invalid_removed',
        'seo.cleaned',
      ]),
    )
    expect(sanitizeContactPage({}).value).toEqual({})
  })

  it.each([null, [], 'invalid', 7])('rejects a non-object singleton root: %j', (root) => {
    expect(sanitizeAboutPage(root).value).toBeNull()
    expect(sanitizeHomePage(root).value).toBeNull()
    expect(sanitizeEditionsPage(root).value).toBeNull()
    expect(sanitizeContactPage(root).value).toBeNull()
  })
})

describe('gallery and edition sanitizers', () => {
  it('filters invalid images and keeps a document with one renderable image', () => {
    const result = sanitizeGallery({
      _id: 'gallery-rebut',
      title: 'Rebut',
      slug: 'rebut',
      statement: {fr: 'Texte', en: 'Statement'},
      images: [{asset: {}}, renderableImage],
    })
    expect(result.value?.images).toEqual([renderableImage])
    expect(result.issues).toContainEqual({
      code: 'images.invalid_removed',
      id: 'gallery-rebut',
      slug: 'rebut',
    })
  })

  it('preserves valid Sanity crop/hotspot data and partial alt fallbacks', () => {
    const result = sanitizeGallery({
      title: 'Rebut',
      slug: 'rebut',
      images: [
        {
          asset: {_ref: 'image-cropped'},
          crop: {top: 0.1, bottom: 0.2, left: 0, right: 0},
          hotspot: {x: 0.5, y: 0.4, width: 0.3, height: 0.2},
          alt: {fr: 'Description française'},
        },
      ],
    })
    expect(result.value?.images[0]).toEqual({
      asset: {_ref: 'image-cropped'},
      crop: {top: 0.1, bottom: 0.2, left: 0, right: 0},
      hotspot: {x: 0.5, y: 0.4, width: 0.3, height: 0.2},
      alt: {fr: 'Description française', en: ''},
    })
  })

  it.each([
    {title: '', slug: 'rebut', images: [renderableImage]},
    {title: 'Rebut', slug: '', images: [renderableImage]},
    {title: 'Rebut', slug: 'rebut', images: []},
    {title: 'Rebut', slug: 'rebut', images: [{asset: {}}]},
  ])('rejects a gallery missing a renderability requirement', (document) => {
    expect(sanitizeGallery(document).value).toBeNull()
  })

  it('filters invalid collection members and returns [] for a bad root', () => {
    const valid = {title: 'Rebut', slug: 'rebut', images: [renderableImage]}
    expect(sanitizeGalleries([valid, null, {title: 'Broken'}]).value).toHaveLength(1)
    expect(sanitizeGalleries(null).value).toEqual([])
  })

  it('applies the same renderability contract to edition detail and collection data', () => {
    const valid = {
      title: 'Silos',
      slug: 'silos',
      statement: {fr: 'Texte', en: 'Statement'},
      images: [renderableImage],
      pageCount: 48,
      printRun: 100,
      dimensions: {width: 21, height: 29.7, unit: 'cm'},
      relatedGallery: {title: 'Silos', slug: 'silos-gallery'},
    }
    expect(sanitizeEdition(valid).value).toMatchObject(valid)
    expect(sanitizeEdition({...valid, images: []}).value).toBeNull()
    expect(sanitizeEditions([valid, {...valid, slug: ''}]).value).toHaveLength(1)
  })
})

describe('safe diagnostics', () => {
  it('logs only type, identity and reason codes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    warnForSanityIssues('gallery', [
      {code: 'images.none_renderable', id: 'gallery-secret', slug: 'rebut'},
    ])

    expect(warn).toHaveBeenCalledWith('[sanity-validation]', {
      documentType: 'gallery',
      id: 'gallery-secret',
      slug: 'rebut',
      reasons: ['images.none_renderable'],
    })
    expect(JSON.stringify(warn.mock.calls)).not.toContain('token')
    warn.mockRestore()
  })
})
