import createImageUrlBuilder from '@sanity/image-url'
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
 * Tiny, heavily-blurred CDN preview URL for the blur-up placeholder
 * (D-01: 24px wide, blur radius 50 — a real low-res rendition of the photo,
 * not a solid color). Used for both the hero photo and grid tiles.
 */
export function blurPlaceholderUrl(img: SanityImage, width = 24): string {
  return builder.image(img).width(width).blur(50).auto('format').url()
}
