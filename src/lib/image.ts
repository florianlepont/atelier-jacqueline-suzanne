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
