import { describe, expect, it } from 'vitest';
import { getRelatedEditionLink } from '../../src/lib/related-edition';

// EDN-12: fixture-based proof of the populated cross-link state — no live
// Sanity dataset write occurs anywhere in this plan; this is the mandated
// mock-populated passthrough test for the pure link helper.

describe('getRelatedEditionLink', () => {
  it('returns an fr href and compact CTA text for a populated relatedEdition', () => {
    const link = getRelatedEditionLink({ title: 'Rebut', slug: 'rebut' }, 'fr');
    expect(link).not.toBeNull();
    expect(link!.href).toMatch(/\/editions\/rebut\/?$/);
    expect(link!.text).toBe("Voir l'édition « Rebut »");
  });

  it('returns an en href + text for a populated relatedEdition', () => {
    const link = getRelatedEditionLink({ title: 'Rebut', slug: 'rebut' }, 'en');
    expect(link).not.toBeNull();
    expect(link!.href).toMatch(/\/en\/editions\/rebut\/?$/);
    expect(link!.text).toBe('View the “Rebut” edition');
  });

  it('returns null for a null relatedEdition', () => {
    expect(getRelatedEditionLink(null, 'fr')).toBeNull();
  });

  it('returns null for an undefined relatedEdition', () => {
    expect(getRelatedEditionLink(undefined, 'fr')).toBeNull();
  });

  it('returns null when slug is missing (malformed dereference)', () => {
    expect(getRelatedEditionLink({ title: 'Rebut', slug: '' }, 'fr')).toBeNull();
  });

  it('returns null when title is empty (malformed dereference)', () => {
    expect(getRelatedEditionLink({ title: '', slug: 'rebut' }, 'fr')).toBeNull();
  });
});
