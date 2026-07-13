import {createClient} from '@sanity/client'

/**
 * Build-time only Sanity client.
 *
 * IMPORTANT: This module must only be imported from Astro frontmatter
 * (build/server-time code), never from client-side scripts or hydrated
 * islands. `SANITY_API_READ_TOKEN` must never reach the browser — there is
 * no runtime compute on OVH's static hosting, so nothing here should ever
 * be bundled into shipped JS.
 */

const projectId = import.meta.env.SANITY_PROJECT_ID
const dataset = import.meta.env.SANITY_DATASET
const token = import.meta.env.SANITY_API_READ_TOKEN

if (!projectId || !dataset) {
  throw new Error(
    'Missing SANITY_PROJECT_ID or SANITY_DATASET env vars. Copy .env.example to .env and fill in real values.',
  )
}

export const sanityClient = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: !token, // authenticated reads bypass the CDN cache per @sanity/client guidance
  // Without this, an authenticated token also returns unpublished drafts —
  // an editor's in-progress, incomplete document (e.g. a gallery with no
  // images yet) would otherwise reach build-time queries and crash the
  // static build. 'published' is CDN-compatible too, so it's safe to keep
  // regardless of the useCdn value above.
  perspective: 'published',
})

/** A string with both French and English values (D-09 locale-object shape). */
export interface LocaleString {
  fr: string
  en: string
}

/** The published `siteSettings` singleton, typed for both locales. */
export interface SiteSettings {
  siteTitle: LocaleString
  navLabels: {
    about?: Partial<LocaleString>
    contact?: Partial<LocaleString>
  }
  footerText: LocaleString
  homepageIntro?: Partial<LocaleString>
  socialLinks?: {
    instagramUrl?: string
    instagramLabel?: string
  }
}

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  siteTitle,
  navLabels,
  footerText,
  homepageIntro,
  socialLinks
}`

/**
 * Fetches the published `siteSettings` singleton at build time.
 * Returns `null` if the document has not been published yet.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const result = await sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
  return result ?? null
}

/**
 * A single gallery image: the Sanity image asset ref + bilingual alt text
 * (D-01/D-02). `asset`/`hotspot` sit at the top level (not nested under an
 * `image` key) because the Studio schema attaches `alt` directly onto an
 * `image`-type array member — see sanity/schemas/gallery.ts — which is what
 * preserves Studio's native multi-file drag-and-drop upload.
 */
export interface GalleryImage {
  asset: {_ref: string}
  hotspot?: {x: number; y: number; height: number; width: number}
  alt: LocaleString
}

/** A `gallery` document, typed for both locales. */
export interface Gallery {
  title: string // D-04: not locale-aware — shared proper noun across fr/en
  slug: string
  statement: LocaleString
  heroColor?: string
  images: GalleryImage[] // D-09: images[0] is always the cover
}

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery"] | order(orderRank) {
  title, "slug": slug.current, statement, "heroColor": heroColor.hex, images
}`

const GALLERY_BY_SLUG_QUERY = /* groq */ `*[_type == "gallery" && slug.current == $slug][0]{
  title, "slug": slug.current, statement, "heroColor": heroColor.hex, images
}`

/**
 * Fetches all published `gallery` documents at build time, in Romane's
 * manually-set drag-reorder order (D-10, via the `orderRank` fractional index
 * maintained by `@sanity/orderable-document-list`).
 */
export async function getGalleries(): Promise<Gallery[]> {
  return sanityClient.fetch<Gallery[]>(GALLERIES_QUERY)
}

/**
 * Fetches a single published `gallery` document by its slug at build time.
 * Returns `null` if no gallery with that slug has been published yet
 * (WR-03 null-safety).
 */
export async function getGallery(slug: string): Promise<Gallery | null> {
  const result = await sanityClient.fetch<Gallery | null>(GALLERY_BY_SLUG_QUERY, {slug})
  return result ?? null
}
