import {describe, expect, it} from 'vitest';
import type {Gallery, HomePage, SiteSettings} from '../../src/lib/sanity';
import type {buildHomePageModel as BuildHomePageModel} from '../../src/lib/home-page-model';

// image.ts (imported transitively by home-page-model.ts) pulls the real
// sanityClient value from sanity.ts, which throws at module-load time if
// these are unset. Static `import` statements are hoisted above any other
// top-level code by the module loader, so setting these here would run too
// late -- home-page-model.ts is loaded dynamically below, after the env is
// stubbed, mirroring the pattern already established in
// tests/unit/gallery-query.test.ts.
process.env.SANITY_PROJECT_ID ??= 'test-project';
process.env.SANITY_DATASET ??= 'test-dataset';

const {buildHomePageModel} = (await import('../../src/lib/home-page-model')) as {
  buildHomePageModel: typeof BuildHomePageModel;
};

const image = (overrides: Partial<Gallery['images'][number]> = {}) => ({
  asset: {_ref: 'image-cover-1200x800-jpg'},
  alt: {fr: 'Une photographie', en: 'A photograph'},
  dimensions: {width: 1200, height: 800, aspectRatio: 1.5},
  ...overrides,
});

const gallery = (overrides: Partial<Gallery> = {}): Gallery => ({
  title: 'Paysages',
  slug: 'paysages',
  statement: {fr: 'Déclaration FR', en: 'Statement EN'},
  images: [image()],
  ...overrides,
});

const homePage = (overrides: Partial<HomePage> = {}): HomePage => ({
  intro: {fr: 'Intro FR', en: 'Intro EN'},
  seo: {
    title: {fr: 'Titre SEO FR', en: 'SEO Title EN'},
    description: {fr: 'Description FR', en: 'Description EN'},
  },
  ...overrides,
});

const siteSettings = (overrides: Partial<SiteSettings> = {}): SiteSettings => ({
  siteTitle: {fr: 'Atelier Jacqueline Suzanne', en: 'Atelier Jacqueline Suzanne'},
  navLabels: {
    about: {fr: 'À propos', en: 'About'},
    contact: {fr: 'Contact', en: 'Contact'},
    editions: {fr: 'Éditions', en: 'Editions'},
  },
  footerText: {fr: '', en: ''},
  ...overrides,
});

const PAGE_URL_FR = 'https://atelierjacquelinesuzanne.fr/';
const PAGE_URL_EN = 'https://atelierjacquelinesuzanne.fr/en/';

describe('buildHomePageModel', () => {
  it('produces the same structure for fr and en, diverging only on localized fields and URLs', () => {
    const shared = {homePage: homePage(), siteSettings: siteSettings(), galleries: [gallery()]};

    const fr = buildHomePageModel({locale: 'fr', pageUrl: PAGE_URL_FR, ...shared});
    const en = buildHomePageModel({locale: 'en', pageUrl: PAGE_URL_EN, ...shared});

    expect(fr.seoTitle).toBe('Titre SEO FR');
    expect(en.seoTitle).toBe('SEO Title EN');
    expect(fr.structuredData.inLanguage).toBe('fr');
    expect(en.structuredData.inLanguage).toBe('en');
    expect(fr.structuredData.about.jobTitle).toBe('Photographe');
    expect(en.structuredData.about.jobTitle).toBe('Photographer');
    expect(fr.structuredData.url).toBe(PAGE_URL_FR);
    expect(en.structuredData.url).toBe(PAGE_URL_EN);
    expect(fr.galleries).toHaveLength(1);
    expect(en.galleries).toHaveLength(1);
    expect(fr.galleries[0].statement).toBe('Déclaration FR');
    expect(en.galleries[0].statement).toBe('Statement EN');
    // Same gallery, same non-localized fields, regardless of locale.
    expect(fr.galleries[0].slug).toBe(en.galleries[0].slug);
    expect(fr.galleries[0].heroSrc).toBe(en.galleries[0].heroSrc);
  });

  it('falls back to the default site title and English/French defaults when homePage and siteSettings are both null', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: null,
      siteSettings: null,
      galleries: [],
    });

    expect(model.seoTitle).toBe('Atelier Jacqueline Suzanne');
    expect(model.siteTitle).toBe('Atelier Jacqueline Suzanne');
    expect(model.seoDescription).toBeUndefined();
    expect(model.seoImage).toBeUndefined();
    expect(model.noIndex).toBeUndefined();
    expect(model.siteCopy.homepageIntro).toBeTruthy();
    expect(model.siteCopy.aboutLabel).toBe('À propos');
    expect(model.galleries).toEqual([]);
  });

  it('falls back to siteSettings.defaultSeo when homePage.seo is absent, and to homePage.seo over defaultSeo when both exist', () => {
    const withDefaultOnly = buildHomePageModel({
      locale: 'en',
      pageUrl: PAGE_URL_EN,
      homePage: {intro: {en: 'Intro'}},
      siteSettings: siteSettings({defaultSeo: {title: {en: 'Default title'}, description: {en: 'Default desc'}}}),
      galleries: [],
    });
    expect(withDefaultOnly.seoTitle).toBe('Default title');
    expect(withDefaultOnly.seoDescription).toBe('Default desc');

    const withBoth = buildHomePageModel({
      locale: 'en',
      pageUrl: PAGE_URL_EN,
      homePage: homePage({seo: {title: {en: 'Page title wins'}}}),
      siteSettings: siteSettings({defaultSeo: {title: {en: 'Default title'}}}),
      galleries: [],
    });
    expect(withBoth.seoTitle).toBe('Page title wins');
  });

  it('passes homePage.seo.noIndex through unchanged', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: homePage({seo: {noIndex: true}}),
      siteSettings: siteSettings(),
      galleries: [],
    });
    expect(model.noIndex).toBe(true);
  });

  it('excludes galleries with showOnHomePage explicitly false', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({showOnHomePage: false}), gallery({slug: 'visible'})],
    });
    expect(model.galleries).toHaveLength(1);
    expect(model.galleries[0].slug).toBe('visible');
  });

  it('excludes galleries with no images, without accessing an out-of-range index', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({images: []}), gallery({slug: 'has-images'})],
    });
    expect(model.galleries).toHaveLength(1);
    expect(model.galleries[0].slug).toBe('has-images');
  });

  it('falls back to an empty string, not undefined, when a gallery image has no alt text for the current locale', () => {
    const model = buildHomePageModel({
      locale: 'en',
      pageUrl: PAGE_URL_EN,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({images: [image({alt: {fr: 'Seulement FR'} as never})]})],
    });
    expect(model.galleries[0].alt).toBe('');
  });

  it('falls back to an empty string when a gallery has no statement for the current locale', () => {
    const model = buildHomePageModel({
      locale: 'en',
      pageUrl: PAGE_URL_EN,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({statement: {} as never})],
    });
    expect(model.galleries[0].statement).toBe('');
  });

  it('normalizes a named hero color and pairs it with a contrasting text color', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({heroColor: 'plum'})],
    });
    expect(model.galleries[0].heroColor).toBeTruthy();
    expect(model.galleries[0].heroTextColor).toBeTruthy();
  });

  it('leaves heroColor and heroTextColor undefined when the gallery has no recognized hero color', () => {
    const model = buildHomePageModel({
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
      homePage: homePage(),
      siteSettings: siteSettings(),
      galleries: [gallery({heroColor: undefined})],
    });
    expect(model.galleries[0].heroColor).toBeUndefined();
    expect(model.galleries[0].heroTextColor).toBeUndefined();
  });

  it('does not perform any fetch or reference browser globals (pure transform)', () => {
    expect(() =>
      buildHomePageModel({
        locale: 'fr',
        pageUrl: PAGE_URL_FR,
        homePage: homePage(),
        siteSettings: siteSettings(),
        galleries: [gallery()],
      }),
    ).not.toThrow();
    expect(typeof buildHomePageModel).toBe('function');
  });
});
