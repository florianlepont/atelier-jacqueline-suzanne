import {describe, expect, it} from 'vitest';
import {getDocumentChecks, summarizeChecks} from '../../sanity/editorial/checks';

describe('Sanity editorial checklist', () => {
  it('requires bilingual copy, accessibility text, and image rights for a collection', () => {
    const checks = getDocumentChecks('gallery', {
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
      title: 'Test',
      slug: {current: 'test'},
      statement: {fr: 'FR', en: 'EN'},
      images: [{alt: {fr: 'Photo', en: 'Photograph'}}],
    });

    expect(summarizeChecks(checks).requiredComplete).toBe(false);
  });
});
