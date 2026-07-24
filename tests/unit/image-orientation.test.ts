import { describe, expect, it } from 'vitest';
import { pickHeroIndex } from '../../src/lib/image-orientation';
import type { GalleryImage } from '../../src/lib/sanity';

// quick-260724-oep: fixture-based proof of pickHeroIndex's landscape-hero
// selection contract — no live Sanity dataset involved, mirrors
// tests/unit/related-gallery.test.ts's fixture approach.

function img(width?: number, height?: number): GalleryImage {
  return {
    asset: { _ref: 'image-fake' },
    alt: { fr: 'a', en: 'a' },
    ...(width !== undefined && height !== undefined ? { dimensions: { width, height } } : {}),
  } as GalleryImage;
}

describe('pickHeroIndex', () => {
  it('returns 0 for an empty array', () => {
    expect(pickHeroIndex([])).toBe(0);
  });

  it('returns 0 for an undefined array', () => {
    expect(pickHeroIndex(undefined as unknown as GalleryImage[])).toBe(0);
  });

  it('returns 0 when the first element is landscape', () => {
    const images = [img(1600, 1000), img(800, 1200)];
    expect(pickHeroIndex(images)).toBe(0);
  });

  it('returns the index of the first landscape element when the first is portrait', () => {
    const images = [img(800, 1200), img(900, 1300), img(1600, 1000)];
    expect(pickHeroIndex(images)).toBe(2);
  });

  it('returns the FIRST (lowest) landscape index when multiple are landscape', () => {
    const images = [img(800, 1200), img(1600, 1000), img(1700, 1100)];
    expect(pickHeroIndex(images)).toBe(1);
  });

  it('returns 0 (fallback) when all images are portrait', () => {
    const images = [img(800, 1200), img(900, 1300)];
    expect(pickHeroIndex(images)).toBe(0);
  });

  it('does not treat a square image (width === height) as landscape', () => {
    const images = [img(1000, 1000), img(800, 1200)];
    expect(pickHeroIndex(images)).toBe(0);
  });

  it('skips images missing dimensions entirely without throwing', () => {
    const images = [img(), img(1600, 1000)];
    expect(() => pickHeroIndex(images)).not.toThrow();
    expect(pickHeroIndex(images)).toBe(1);
  });

  it('skips images with a partially-missing dimensions object without throwing', () => {
    const images = [
      { ...img(), dimensions: { width: 1000 } } as unknown as GalleryImage,
      img(1600, 1000),
    ];
    expect(() => pickHeroIndex(images)).not.toThrow();
    expect(pickHeroIndex(images)).toBe(1);
  });

  it('returns 0 when every image is missing dimensions', () => {
    const images = [img(), img()];
    expect(pickHeroIndex(images)).toBe(0);
  });
});
