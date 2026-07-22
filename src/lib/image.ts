import {createImageUrlBuilder} from '@sanity/image-url'
import {sanityClient} from './sanity'
import type {GalleryImage, SanityImage} from './sanity'

/**
 * Build-time only Sanity CDN image URL builder.
 *
 * IMPORTANT: like ./sanity.ts, this module must only be imported from Astro
 * frontmatter (build-time code), never from a client-side `<script>` — it
 * imports the same build-time `sanityClient` singleton.
 */
const builder = createImageUrlBuilder(sanityClient)

/**
 * 1:1 square-crop thumbnail URL, for gallery listing/detail grid cards
 * (UI-SPEC: grid alignment across mixed portrait/landscape source photos).
 */
export function thumbnailUrl(img: GalleryImage, size = 600): string {
  return builder.image(img).width(size).height(size).fit('crop').auto('format').url()
}

/**
 * Full-size, uncropped URL, for the lightbox (UI-SPEC: `object-fit: contain`,
 * never cropped).
 */
export function fullSizeUrl(img: SanityImage, maxWidth = 2000): string {
  return builder.image(img).width(maxWidth).fit('max').auto('format').url()
}

/**
 * Width-descriptor candidates for uncropped responsive images. Sanity
 * generates each rendition on demand, so the browser can choose the smallest
 * useful asset for its viewport and pixel density.
 */
export function responsiveImageSrcSet(
  img: SanityImage,
  widths: number[] = [480, 768, 1200, 1600, 2000],
): string {
  return [...new Set(widths)]
    .filter((width) => width > 0)
    .sort((a, b) => a - b)
    .map((width) => `${fullSizeUrl(img, width)} ${width}w`)
    .join(', ')
}

/** Width-descriptor candidates for the square-cropped grid treatment. */
export function responsiveThumbnailSrcSet(
  img: GalleryImage,
  widths: number[] = [320, 480, 600, 900],
): string {
  return [...new Set(widths)]
    .filter((width) => width > 0)
    .sort((a, b) => a - b)
    .map((width) => `${thumbnailUrl(img, width)} ${width}w`)
    .join(', ')
}

/**
 * Tiny, heavily-blurred CDN preview URL for the blur-up placeholder
 * (D-01: 24px wide, blur radius 50 — a real low-res rendition of the photo,
 * not a solid color). Used for both the hero photo and grid tiles.
 */
export function blurPlaceholderUrl(img: SanityImage, width = 24): string {
  return builder.image(img).width(width).blur(50).auto('format').url()
}
