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

const {buildGalleryDetailModel, buildEditionDetailModel} = await import('../../src/lib/page-models');
import type {Edition, Gallery} from '../../src/lib/sanity';

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
