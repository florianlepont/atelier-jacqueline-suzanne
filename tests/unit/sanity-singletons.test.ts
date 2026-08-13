import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  resetBuildCacheForTests,
  setBuildCacheEnabledForTests,
} from '../../src/lib/build-cache'

process.env.SANITY_PROJECT_ID ??= 'test-project'
process.env.SANITY_DATASET ??= 'test-dataset'

const fetchMock = vi.fn()

vi.mock('@sanity/client', () => ({
  createClient: () => ({fetch: fetchMock}),
}))

type SingletonGetter =
  | 'getSiteSettings'
  | 'getAboutPage'
  | 'getHomePage'
  | 'getEditionsPage'
  | 'getContactPage'

interface SingletonContract {
  getter: SingletonGetter
  minimal: unknown
  partial: unknown
  expectedPartial: unknown
  queryMarker: string
}

const contracts: SingletonContract[] = [
  {
    getter: 'getSiteSettings',
    minimal: {
      siteTitle: {fr: 'Atelier', en: 'Studio'},
      navLabels: {},
      footerText: {fr: 'Pied de page', en: 'Footer'},
    },
    partial: {
      siteTitle: {fr: 'Atelier', en: 'Studio'},
      navLabels: {about: {fr: 'À propos'}, contact: 12},
      footerText: {fr: 'Pied de page', en: 'Footer'},
      defaultSeo: {title: false},
    },
    expectedPartial: {
      siteTitle: {fr: 'Atelier', en: 'Studio'},
      navLabels: {about: {fr: 'À propos'}},
      footerText: {fr: 'Pied de page', en: 'Footer'},
    },
    queryMarker: '_type == "siteSettings"',
  },
  {
    getter: 'getAboutPage',
    minimal: {},
    partial: {
      biography: {fr: 'Biographie', en: 2},
      image: {asset: {}},
      exhibitionImage: {asset: {_ref: 'image-exhibition'}, alt: {en: 'Exhibition'}},
      seo: 'invalid',
    },
    expectedPartial: {
      biography: {fr: 'Biographie'},
      exhibitionImage: {asset: {_ref: 'image-exhibition'}, alt: {en: 'Exhibition'}},
    },
    queryMarker: '_id == "aboutPage"',
  },
  {
    getter: 'getHomePage',
    minimal: {},
    partial: {intro: {fr: 'Bienvenue', en: false}, seo: {noIndex: true, title: 7}},
    expectedPartial: {intro: {fr: 'Bienvenue'}, seo: {noIndex: true}},
    queryMarker: '_id == "homePage"',
  },
  {
    getter: 'getEditionsPage',
    minimal: {},
    partial: {intro: {en: 'Printed objects', fr: []}},
    expectedPartial: {intro: {en: 'Printed objects'}},
    queryMarker: '_id == "editionsPage"',
  },
  {
    getter: 'getContactPage',
    minimal: {},
    partial: {
      intro: {fr: 'Contactez-moi', en: 4},
      publicEmail: 'invalid',
      location: {en: 'Paris'},
      professionalLinks: [
        {label: {fr: 'Instagram'}, url: 'https://instagram.com/ajs'},
        {label: {fr: 'Danger'}, url: 'javascript:alert(1)'},
      ],
      seo: [],
    },
    expectedPartial: {
      intro: {fr: 'Contactez-moi'},
      location: {en: 'Paris'},
      professionalLinks: [{label: {fr: 'Instagram'}, url: 'https://instagram.com/ajs'}],
    },
    queryMarker: '_id == "contactPage"',
  },
]

describe('Sanity singleton getter contracts', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    resetBuildCacheForTests()
    vi.restoreAllMocks()
  })

  for (const contract of contracts) {
    describe(contract.getter, () => {
      it('accepts its published minimal shape', async () => {
        fetchMock.mockResolvedValueOnce(contract.minimal)
        const sanity = await import('../../src/lib/sanity')

        await expect(sanity[contract.getter]()).resolves.toEqual(contract.minimal)
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(contract.queryMarker))
      })

      it('keeps valid partial fields and removes malformed nested fields', async () => {
        fetchMock.mockResolvedValueOnce(contract.partial)
        const sanity = await import('../../src/lib/sanity')

        await expect(sanity[contract.getter]()).resolves.toEqual(contract.expectedPartial)
      })

      it('returns null for an absent or malformed root', async () => {
        fetchMock.mockResolvedValueOnce([])
        const sanity = await import('../../src/lib/sanity')

        await expect(sanity[contract.getter]()).resolves.toBeNull()
      })
    })
  }

  it('routes all five singleton getters through distinct production-build cache keys', async () => {
    setBuildCacheEnabledForTests(true)
    fetchMock
      .mockResolvedValueOnce(contracts[0].minimal)
      .mockResolvedValueOnce(contracts[1].minimal)
      .mockResolvedValueOnce(contracts[2].minimal)
      .mockResolvedValueOnce(contracts[3].minimal)
      .mockResolvedValueOnce(contracts[4].minimal)
    const sanity = await import('../../src/lib/sanity')

    for (const contract of contracts) {
      await sanity[contract.getter]()
      await sanity[contract.getter]()
    }

    expect(fetchMock).toHaveBeenCalledTimes(5)
  })
})
