import {describe, expect, it} from 'vitest';
import {
  getDocumentChecks,
  hasBlockingChecklist,
  summarizeChecks,
} from '../../sanity/editorial/checks';
import {PUBLIC_SITE_DOCUMENT_TYPES} from '../../sanity/editorial/workflowLogic';

const localized = {fr: 'Texte', en: 'Text'};
const rights = {
  credit: 'Romane Lepont',
  copyrightNotice: '© Romane Lepont',
  usage: 'allRightsReserved',
};
const completeImage = {
  asset: {_ref: 'image-asset'},
  alt: {fr: 'Photo', en: 'Photograph'},
  rights,
};

describe('Sanity editorial checklist', () => {
  it('has an explicit blocking checklist for every public document type', () => {
    expect(PUBLIC_SITE_DOCUMENT_TYPES).toEqual([
      'siteSettings',
      'homePage',
      'editionsPage',
      'aboutPage',
      'contactPage',
      'gallery',
      'edition',
    ]);
    expect(PUBLIC_SITE_DOCUMENT_TYPES.every(hasBlockingChecklist)).toBe(true);
    expect(hasBlockingChecklist('exhibition')).toBe(true);
    expect(hasBlockingChecklist('unknown')).toBe(false);
  });

  it('fails closed when no checklist exists', () => {
    expect(summarizeChecks([]).requiredComplete).toBe(false);
  });

  it('requires bilingual copy, accessibility text, and image rights for a collection', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [completeImage],
    });

    const summary = summarizeChecks(checks);
    expect(summary.requiredComplete).toBe(true);
    expect(summary.recommendedComplete).toBe(false);
  });

  it('marks a collection incomplete when one image has no rights information', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [{asset: {_ref: 'image-asset'}, alt: {fr: 'Photo', en: 'Photograph'}}],
    });

    expect(summarizeChecks(checks).requiredComplete).toBe(false);
  });

  it('marks a collection incomplete when an image has no Sanity asset reference', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: localized,
      images: [{alt: localized, rights}],
    });

    expect(summarizeChecks(checks).requiredComplete).toBe(false);
    expect(checks).toContainEqual(
      expect.objectContaining({label: expect.stringContaining('photo 1'), complete: false}),
    );
  });

  it('names the exact photos and languages with missing accessibility text', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [
        {
          asset: {_ref: 'image-asset'},
          alt: {fr: 'Photo'},
          rights,
        },
      ],
    });

    expect(checks).toContainEqual(
      expect.objectContaining({label: expect.stringContaining('photo 1 (EN)'), complete: false}),
    );
  });

  it('checks the editable Contact page essentials', () => {
    const checks = getDocumentChecks('contactPage', {
      intro: {fr: 'Écrivez-moi', en: 'Get in touch'},
      publicEmail: 'contact@example.com',
    });

    expect(summarizeChecks(checks).requiredComplete).toBe(true);
  });

  it('requires the Éditions navigation label and the bilingual Éditions introduction', () => {
    const settingsWithoutEditions = getDocumentChecks('siteSettings', {
      siteTitle: localized,
      navLabels: {about: localized, contact: localized},
      footerText: localized,
    });
    expect(summarizeChecks(settingsWithoutEditions).requiredComplete).toBe(false);
    expect(
      summarizeChecks(
        getDocumentChecks('editionsPage', {intro: {fr: 'Les éditions', en: 'Editions'}}),
      ).requiredComplete,
    ).toBe(true);
    expect(
      summarizeChecks(getDocumentChecks('editionsPage', {intro: {fr: 'Les éditions'}}))
        .requiredComplete,
    ).toBe(false);
  });

  it('lists the SEO checklist items for editionsPage now that the schema exposes an seo field', () => {
    // quick-260801-id4: editionsPage.ts now exposes the shared `seo`
    // group/field (mirroring homePage.ts), so these items are reachable
    // and satisfiable in the Studio's SEO tab. This supersedes the prior
    // "never lists SEO checklist items" regression test that the
    // `editionspage-no-title-seo` debug session added when the field did
    // not yet exist.
    const introOnly = getDocumentChecks('editionsPage', {
      intro: {fr: 'Les éditions', en: 'Editions'},
    });

    expect(introOnly).toHaveLength(4);
    expect(introOnly.filter((item) => item.recommended)).toHaveLength(3);
    expect(summarizeChecks(introOnly).requiredComplete).toBe(true);
    expect(summarizeChecks(introOnly).recommendedComplete).toBe(false);

    const withCompleteSeo = getDocumentChecks('editionsPage', {
      intro: {fr: 'Les éditions', en: 'Editions'},
      seo: {
        title: localized,
        description: localized,
        image: {asset: {_ref: 'image-asset'}},
      },
    });

    expect(summarizeChecks(withCompleteSeo).recommendedComplete).toBe(true);
  });

  it('requires a complete edition including assets, rights, and positive format details', () => {
    const completeEdition = {
      publicationStatus: 'published',
      title: 'Rebut',
      slug: {current: 'rebut'},
      statement: localized,
      images: [completeImage],
      pageCount: 96,
      printRun: 250,
      dimensions: {width: 21, height: 29.7, unit: 'cm'},
    };
    expect(
      summarizeChecks(getDocumentChecks('edition', completeEdition)).requiredComplete,
    ).toBe(true);

    for (const invalid of [
      {...completeEdition, images: [{...completeImage, asset: undefined}]},
      {...completeEdition, images: [{...completeImage, rights: undefined}]},
      {...completeEdition, pageCount: 2.5},
      {...completeEdition, printRun: 0},
      {...completeEdition, dimensions: {width: 21, height: -1, unit: 'mm'}},
    ]) {
      expect(summarizeChecks(getDocumentChecks('edition', invalid)).requiredComplete).toBe(false);
    }
  });

  // quick-260801-kgh: regression guard proving the dedicated-cover-photo
  // checklist item was removed along with the schema field — a missing/
  // incomplete cover is now covered entirely by the existing `images`
  // checklist items (there is no longer a separate "cover" concept).
  it('no longer lists a dedicated cover-photo checklist item for edition', () => {
    const completeEdition = {
      publicationStatus: 'published',
      title: 'Rebut',
      slug: {current: 'rebut'},
      statement: localized,
      images: [completeImage],
      pageCount: 96,
      printRun: 250,
      dimensions: {width: 21, height: 29.7, unit: 'cm'},
    };
    expect(
      getDocumentChecks('edition', completeEdition).some((item) =>
        item.label.startsWith('Photo principale'),
      ),
    ).toBe(false);
  });

  it('covers singleton, settings, exhibition, and unknown document types', () => {
    expect(getDocumentChecks('homePage', {intro: localized})).toHaveLength(4);
    expect(
      getDocumentChecks('aboutPage', {
        biography: localized,
        practice: localized,
        medium: localized,
      })
        .filter((item) => !item.recommended)
        .every((item) => item.complete),
    ).toBe(true);
    expect(
      getDocumentChecks('siteSettings', {
        siteTitle: localized,
        navLabels: {about: localized, editions: localized, contact: localized},
        footerText: localized,
      })
        .filter((item) => !item.recommended)
        .every((item) => item.complete),
    ).toBe(true);
    expect(
      getDocumentChecks('exhibition', {
        title: 'Expo',
        startDate: '2026-08-01',
        city: 'Paris',
        description: localized,
        image: {asset: {_ref: 'image'}},
      }).every((item) => item.complete),
    ).toBe(true);
    expect(getDocumentChecks('unknown', {})).toEqual([]);
  });
});
