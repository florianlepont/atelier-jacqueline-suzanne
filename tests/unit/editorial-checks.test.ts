import {describe, expect, it} from 'vitest';
import {getDocumentChecks, summarizeChecks} from '../../sanity/editorial/checks';

describe('Sanity editorial checklist', () => {
  it('requires bilingual copy, accessibility text, and image rights for a collection', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [
        {
          alt: {fr: 'Photo', en: 'Photograph'},
          rights: {
            credit: 'Romane Lepont',
            copyrightNotice: '© Romane Lepont',
            usage: 'allRightsReserved',
          },
        },
      ],
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
      images: [{alt: {fr: 'Photo', en: 'Photograph'}}],
    });

    expect(summarizeChecks(checks).requiredComplete).toBe(false);
  });

  it('names the exact photos and languages with missing accessibility text', () => {
    const checks = getDocumentChecks('gallery', {
      publicationStatus: 'published',
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [
        {
          alt: {fr: 'Photo'},
          rights: {
            credit: 'Romane Lepont',
            copyrightNotice: '© Romane Lepont',
            usage: 'allRightsReserved',
          },
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

  it('covers singleton, settings, exhibition, and unknown document types', () => {
    const localized = {fr: 'Texte', en: 'Text'};
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
        navLabels: {about: localized, contact: localized},
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
