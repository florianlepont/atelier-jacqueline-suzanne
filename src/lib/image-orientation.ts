import type { GalleryImage } from './sanity';

/**
 * quick-260724-oep: pure landscape-hero-selection helper. The gallery hero
 * (DetailHero.astro) renders `object-fit: contain`, never cropping — a
 * portrait first photo looks small/heavily letterboxed in the wide hero
 * box, so this prefers the first LANDSCAPE image in the gallery's real
 * array order over the hardcoded `images[0]` cover.
 *
 * Mirrors src/lib/related-gallery.ts's style: pure, defensive, never
 * throws on partially-populated Sanity documents (WR-03 null-safety
 * posture).
 *
 * Contract:
 * - Empty/undefined `images` -> 0.
 * - Returns the index of the FIRST image whose `dimensions.width` is
 *   strictly greater than its `dimensions.height` (landscape).
 * - A square image (width === height) is NOT landscape.
 * - An image missing `dimensions` (or a partially-populated dimensions
 *   object missing `width`/`height`) is treated as not-landscape and
 *   skipped — never throws.
 * - When no image is landscape (including when every image is missing
 *   dimensions), falls back to 0 — the historical `images[0]` cover.
 */
export function pickHeroIndex(images: GalleryImage[]): number {
  if (!images || images.length === 0) return 0;

  const landscapeIndex = images.findIndex((image) => {
    const dimensions = image?.dimensions;
    if (!dimensions) return false;
    const { width, height } = dimensions;
    if (typeof width !== 'number' || typeof height !== 'number') return false;
    return width > height;
  });

  return landscapeIndex === -1 ? 0 : landscapeIndex;
}
