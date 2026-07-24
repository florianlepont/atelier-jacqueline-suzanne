import { describe, expect, it } from 'vitest';
import { getRelatedGalleryLink } from '../../src/lib/related-gallery';

// EDN-08: fixture-based proof of the populated cross-link state — no live
// Sanity dataset write occurs anywhere in this plan; this is the mandated
// mock-populated passthrough test for the pure link helper.

describe('getRelatedGalleryLink', () => {
  it('returns an fr href + text for a populated relatedGallery', () => {
    const link = getRelatedGalleryLink({ title: 'Rebut', slug: 'rebut' }, 'fr');
    expect(link).not.toBeNull();
    expect(link!.href).toMatch(/\/galleries\/rebut\/?$/);
    expect(link!.text).toContain('Rebut');
    expect(link!.text).toContain('collection');
  });

  it('returns an en href + text for a populated relatedGallery', () => {
    const link = getRelatedGalleryLink({ title: 'Rebut', slug: 'rebut' }, 'en');
    expect(link).not.toBeNull();
    expect(link!.href).toMatch(/\/en\/galleries\/rebut\/?$/);
    expect(link!.text).toContain('Rebut');
  });

  it('returns null for a null relatedGallery', () => {
    expect(getRelatedGalleryLink(null, 'fr')).toBeNull();
  });

  it('returns null for an undefined relatedGallery', () => {
    expect(getRelatedGalleryLink(undefined, 'fr')).toBeNull();
  });

  it('returns null when slug is missing (malformed dereference)', () => {
    expect(getRelatedGalleryLink({ title: 'Rebut', slug: '' }, 'fr')).toBeNull();
  });

  it('returns null when title is empty (malformed dereference)', () => {
    expect(getRelatedGalleryLink({ title: '', slug: 'rebut' }, 'fr')).toBeNull();
  });
});
