import {describe, expect, it} from 'vitest';

// image.ts (imported transitively by page-models.ts) pulls the real
// sanityClient value from sanity.ts, which throws at module-load time if
// these are unset. Static `import` statements are hoisted above any other
// top-level code, so home-page-model.ts's module under test is loaded
// dynamically below, after the env is stubbed, mirroring the pattern
// already established in tests/unit/gallery-query.test.ts and
// tests/unit/home-page-model.test.ts.
process.env.SANITY_PROJECT_ID ??= 'test-project';
process.env.SANITY_DATASET ??= 'test-dataset';

const {buildAboutPageModel, buildContactPageModel, buildEditionDetailModel, buildEditionsIndexModel, buildGalleryDetailModel} =
  await import('../../src/lib/page-models');
import type {AboutPage, ContactPage, Edition, EditionsPage, Gallery, SiteSettings} from '../../src/lib/sanity';

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
  images: [image(), image({asset: {_ref: 'image-two-1200x800-jpg'}})],
  ...overrides,
});

const edition = (overrides: Partial<Edition> = {}): Edition => ({
  title: 'Rebut',
  slug: 'rebut',
  statement: {fr: 'Déclaration FR', en: 'Statement EN'},
  images: [image(), image({asset: {_ref: 'image-two-1200x800-jpg'}})],
  pageCount: 32,
  printRun: 250,
  dimensions: {width: 15, height: 21, unit: 'cm'},
  ...overrides,
});

const PAGE_URL_FR = 'https://atelierjacquelinesuzanne.fr/galleries/paysages/';
const PAGE_URL_EN = 'https://atelierjacquelinesuzanne.fr/en/galleries/paysages/';

describe('buildGalleryDetailModel', () => {
  it('produces the same non-localized data for fr and en, diverging only on localized text/labels/URLs', () => {
    const shared = {gallery: gallery()};
    const fr = buildGalleryDetailModel({...shared, locale: 'fr', pageUrl: PAGE_URL_FR});
    const en = buildGalleryDetailModel({...shared, locale: 'en', pageUrl: PAGE_URL_EN});

    expect(fr.heroIndex).toBe(en.heroIndex);
    expect(fr.heroSrc).toBe(en.heroSrc);
    expect(fr.total).toBe(en.total);
    expect(fr.accent).toBe(en.accent);
    expect(fr.gridItems.map((item) => item.src)).toEqual(en.gridItems.map((item) => item.src));

    expect(fr.statement).toBe('Déclaration FR');
    expect(en.statement).toBe('Statement EN');
    expect(fr.structuredData.inLanguage).toBe('fr');
    expect(en.structuredData.inLanguage).toBe('en');
    expect(fr.structuredData.url).toBe(PAGE_URL_FR);
    expect(en.structuredData.url).toBe(PAGE_URL_EN);
    expect(fr.heroAriaLabel).toContain('Voir en taille réelle');
    expect(en.heroAriaLabel).toContain('View full size');
    expect(fr.scrollHintLabel).toBe('Faire défiler');
    expect(en.scrollHintLabel).toBe('Scroll');
  });

  it('excludes the hero image from gridItems by its real array index, and reports the correct total', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({images: [image(), image(), image()]}),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.total).toBe(3);
    expect(model.gridItems).toHaveLength(2);
    expect(model.gridItems.some((item) => item.index === model.heroIndex)).toBe(false);
  });

  it('falls back to the gallery slug SEO title/description and heroImage social image when seo is absent', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({seo: undefined}),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.seoTitle).toBe('Paysages — Atelier Jacqueline Suzanne');
    expect(model.seoDescription).toBe('Déclaration FR');
    expect(model.socialImage).toBeTruthy();
    expect(model.noIndex).toBeUndefined();
  });

  it('prefers seo.title/description/image and passes noIndex through when present', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({
        seo: {
          title: {fr: 'Titre SEO'},
          description: {fr: 'Description SEO'},
          image: image({asset: {_ref: 'image-seo-1200x800-jpg'}}),
          noIndex: true,
        },
      }),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.seoTitle).toBe('Titre SEO');
    expect(model.seoDescription).toBe('Description SEO');
    expect(model.noIndex).toBe(true);
  });

  it('falls back to an empty string, not undefined, when a gallery has no statement for the current locale', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({statement: {} as never}),
      locale: 'en',
      pageUrl: PAGE_URL_EN,
    });
    expect(model.statement).toBe('');
  });

  it('falls back to the default lime accent when the gallery has no recognized hero color', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({heroColor: undefined}),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.accent).toBe('#A6FD29');
    expect(model.accentText).toBeTruthy();
  });

  it('carouselReturnHref includes the gallery slug as a ?carousel= query param', () => {
    const model = buildGalleryDetailModel({
      gallery: gallery({slug: 'brume'}),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.carouselReturnHref).toContain('?carousel=brume');
  });
});

describe('buildEditionDetailModel', () => {
  it('produces the same non-localized data for fr and en, diverging only on localized text/labels', () => {
    const shared = {edition: edition()};
    const fr = buildEditionDetailModel({...shared, locale: 'fr'});
    const en = buildEditionDetailModel({...shared, locale: 'en'});

    expect(fr.heroIndex).toBe(en.heroIndex);
    expect(fr.leadPhotoSrc).toBe(en.leadPhotoSrc);
    expect(fr.total).toBe(en.total);
    expect(fr.gridItems.map((item) => item.src)).toEqual(en.gridItems.map((item) => item.src));

    expect(fr.statement).toBe('Déclaration FR');
    expect(en.statement).toBe('Statement EN');
    expect(fr.heroCaption).toBe('Édition imprimée');
    expect(en.heroCaption).toBe('Printed edition');
    expect(fr.scrollHintLabel).toBe('Faire défiler');
    expect(en.scrollHintLabel).toBe('Scroll');
    expect(fr.formatText).toContain('Pages :');
    expect(en.formatText).toContain('Pages:');
  });

  it('builds SEO directly from title/statement/hero image, since édition has no seo field', () => {
    const model = buildEditionDetailModel({edition: edition({title: 'Silos'}), locale: 'fr'});
    expect(model.seoTitle).toBe('Silos — Atelier Jacqueline Suzanne');
    expect(model.seoDescription).toBe('Déclaration FR');
    expect(model.socialImage).toBeTruthy();
  });

  it('does not throw when images is missing (D-02 defensive guard), and reports a zero total', () => {
    const model = buildEditionDetailModel({edition: edition({images: undefined as never}), locale: 'fr'});
    expect(model.total).toBe(0);
    expect(model.gridItems).toEqual([]);
  });

  it('localizes each grid item alt text for éditions (unlike galleries, which stay decorative/empty)', () => {
    const model = buildEditionDetailModel({
      edition: edition({images: [image(), image(), image()]}),
      locale: 'en',
    });
    expect(model.gridItems.every((item) => item.alt === 'A photograph')).toBe(true);
  });

  it('resolves relatedGallery into a link when populated, and null when absent', () => {
    const withRelated = buildEditionDetailModel({
      edition: edition({relatedGallery: {title: 'Rebut', slug: 'rebut'}}),
      locale: 'fr',
    });
    expect(withRelated.relatedLink).not.toBeNull();
    expect(withRelated.relatedLink!.href).toMatch(/\/galleries\/rebut\/?$/);

    const withoutRelated = buildEditionDetailModel({edition: edition({relatedGallery: null}), locale: 'fr'});
    expect(withoutRelated.relatedLink).toBeNull();
  });

  it('renders dimensions/pageCount/printRun defensively when absent (D-02)', () => {
    const model = buildEditionDetailModel({
      edition: edition({
        pageCount: undefined as never,
        printRun: undefined as never,
        dimensions: undefined as never,
      }),
      locale: 'fr',
    });
    expect(model.formatText).not.toContain('undefined');
  });
});

const aboutPage = (overrides: Partial<AboutPage> = {}): AboutPage => ({
  biography: {fr: 'Biographie FR', en: 'Biography EN'},
  practice: {fr: 'Pratique FR', en: 'Practice EN'},
  medium: {fr: 'Médium FR', en: 'Medium EN'},
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

const contactPage = (overrides: Partial<ContactPage> = {}): ContactPage => ({
  intro: {fr: 'Intro FR', en: 'Intro EN'},
  publicEmail: 'contact@atelierjacquelinesuzanne.fr',
  ...overrides,
});

describe('buildAboutPageModel', () => {
  it('produces the same non-localized data for fr and en, diverging only on localized text/labels', () => {
    const shared = {about: aboutPage(), siteSettings: siteSettings()};
    const fr = buildAboutPageModel({...shared, locale: 'fr', pageUrl: PAGE_URL_FR});
    const en = buildAboutPageModel({...shared, locale: 'en', pageUrl: PAGE_URL_EN});

    expect(fr.heading).toBe('À propos');
    expect(en.heading).toBe('About');
    expect(fr.biography).toBe('Biographie FR');
    expect(en.biography).toBe('Biography EN');
    expect(fr.structuredData.jobTitle).toBe('Photographe');
    expect(en.structuredData.jobTitle).toBe('Photographer');
    expect(fr.structuredData.url).toBe(PAGE_URL_FR);
    expect(en.structuredData.url).toBe(PAGE_URL_EN);
    expect(fr.structuredData.sameAs).toEqual(en.structuredData.sameAs);
  });

  it('falls back to locale-specific placeholder copy when about is absent', () => {
    const model = buildAboutPageModel({
      about: null,
      siteSettings: null,
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.biography).toContain('bientôt disponible');
    expect(model.practice).toContain('venir');
    expect(model.medium).toContain('venir');
    expect(model.seoTitle).toBe('À propos — Atelier Jacqueline Suzanne');
    expect(model.seoDescription).toBe(model.biography);
    expect(model.portraitAlt).toBe('');
    expect(model.exhibitionAlt).toBe('');
  });

  it('prefers seo.title/description/image and passes noIndex through when present', () => {
    const model = buildAboutPageModel({
      about: aboutPage({
        seo: {title: {fr: 'Titre SEO'}, description: {fr: 'Description SEO'}, noIndex: true},
      }),
      siteSettings: siteSettings(),
      locale: 'fr',
      pageUrl: PAGE_URL_FR,
    });
    expect(model.seoTitle).toBe('Titre SEO');
    expect(model.seoDescription).toBe('Description SEO');
    expect(model.noIndex).toBe(true);
  });

  it('resolves portrait/exhibition image alt text per locale', () => {
    const model = buildAboutPageModel({
      about: aboutPage({
        image: {asset: {_ref: 'portrait-jpg'}, alt: {fr: 'Portrait FR', en: 'Portrait EN'}},
        exhibitionImage: {asset: {_ref: 'exhibition-jpg'}, alt: {fr: 'Expo FR', en: 'Expo EN'}},
      }),
      siteSettings: null,
      locale: 'en',
      pageUrl: PAGE_URL_EN,
    });
    expect(model.portraitAlt).toBe('Portrait EN');
    expect(model.exhibitionAlt).toBe('Expo EN');
  });
});

describe('buildContactPageModel', () => {
  it('produces the same non-localized data for fr and en, diverging only on localized text/labels', () => {
    const shared = {contact: contactPage()};
    const fr = buildContactPageModel({...shared, locale: 'fr'});
    const en = buildContactPageModel({...shared, locale: 'en'});

    expect(fr.intro).toBe('Intro FR');
    expect(en.intro).toBe('Intro EN');
    expect(fr.publicEmail).toBe(en.publicEmail);
    expect(fr.emailLabel).toBe('E-mail');
    expect(en.emailLabel).toBe('Email');
    expect(fr.formHeading).toBe('Écrivez-moi');
    expect(en.formHeading).toBe('Send a message');
    expect(fr.structuredData.mainEntity.email).toBe(en.structuredData.mainEntity.email);
  });

  it('falls back to a placeholder intro and the default public email when contact is absent', () => {
    const model = buildContactPageModel({contact: null, locale: 'fr'});
    expect(model.intro).toContain('collaboration');
    expect(model.publicEmail).toBe('contact@atelierjacquelinesuzanne.fr');
    expect(model.location).toBeUndefined();
    expect(model.availability).toBeUndefined();
    expect(model.instagramLink).toBeNull();
    expect(model.otherLinks).toEqual([]);
  });

  it('extracts the Instagram link separately from other professional links, dropping links missing a URL or the current locale label', () => {
    const model = buildContactPageModel({
      contact: contactPage({
        professionalLinks: [
          {label: {fr: 'Instagram', en: 'Instagram'}, url: 'https://www.instagram.com/ajs_romanelepont/'},
          {label: {fr: 'Portfolio', en: 'Portfolio'}, url: 'https://example.com/portfolio'},
          {label: {fr: 'Sans URL', en: 'No URL'}, url: undefined},
          {label: {en: 'No FR label'}, url: 'https://example.com/no-fr-label'},
        ],
      }),
      locale: 'fr',
    });
    expect(model.instagramLink).toEqual({url: 'https://www.instagram.com/ajs_romanelepont/', label: 'Instagram'});
    expect(model.otherLinks).toEqual([{url: 'https://example.com/portfolio', label: 'Portfolio'}]);
  });

  it('prefers seo.title/description/image and passes noIndex through when present', () => {
    const model = buildContactPageModel({
      contact: contactPage({
        seo: {title: {fr: 'Titre SEO'}, description: {fr: 'Description SEO'}, noIndex: true},
      }),
      locale: 'fr',
    });
    expect(model.seoTitle).toBe('Titre SEO');
    expect(model.seoDescription).toBe('Description SEO');
    expect(model.noIndex).toBe(true);
  });
});

describe('buildEditionsIndexModel', () => {
  it('produces the same non-localized data for fr and en, diverging only on localized text/labels', () => {
    const shared = {editionsPage: {intro: {fr: 'Intro FR', en: 'Intro EN'}} as EditionsPage, editions: [edition()]};
    const fr = buildEditionsIndexModel({...shared, locale: 'fr'});
    const en = buildEditionsIndexModel({...shared, locale: 'en'});

    expect(fr.heading).toBe('Éditions');
    expect(en.heading).toBe('Editions');
    expect(fr.intro).toBe('Intro FR');
    expect(en.intro).toBe('Intro EN');
    expect(fr.tiles.map((tile) => tile.imgSrc)).toEqual(en.tiles.map((tile) => tile.imgSrc));
    expect(fr.tiles[0].format).toContain('Tirage');
    expect(en.tiles[0].format).toContain('Edition of');
  });

  it('falls back to the shared default intro when editionsPage is absent', () => {
    const model = buildEditionsIndexModel({editionsPage: null, editions: [], locale: 'fr'});
    expect(model.intro).toContain('objets imprimés');
  });

  it('filters out any édition with no photos (D-02/quick-260801-kgh)', () => {
    const model = buildEditionsIndexModel({
      editionsPage: null,
      editions: [edition(), edition({slug: 'sans-photo', images: []})],
      locale: 'fr',
    });
    expect(model.tiles).toHaveLength(1);
    expect(model.tiles[0].href).toMatch(/\/editions\/rebut\/?$/);
  });

  it('derives each tile from its own cover image and locale-specific statement/format text', () => {
    const model = buildEditionsIndexModel({
      editionsPage: null,
      editions: [edition({title: 'Silos', pageCount: 40, printRun: 100})],
      locale: 'en',
    });
    expect(model.tiles).toHaveLength(1);
    expect(model.tiles[0].title).toBe('Silos');
    expect(model.tiles[0].statement).toBe('Statement EN');
    expect(model.tiles[0].format).toBe('Printed edition · 40 pages · Edition of 100');
  });
});
