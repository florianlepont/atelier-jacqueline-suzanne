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

export interface SanityImage {
  asset: {_ref: string}
  hotspot?: {x: number; y: number; height: number; width: number}
}

export interface SeoSettings {
  title?: Partial<LocaleString>
  description?: Partial<LocaleString>
  image?: SanityImage
  noIndex?: boolean
}

/** The published `siteSettings` singleton, typed for both locales. */
export interface SiteSettings {
  siteTitle: LocaleString
  navLabels: {
    about?: Partial<LocaleString>
    contact?: Partial<LocaleString>
    editions?: Partial<LocaleString>
  }
  footerText: LocaleString
  defaultSeo?: SeoSettings
}

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  siteTitle,
  navLabels,
  footerText,
  defaultSeo
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
export interface GalleryImage extends SanityImage {
  alt: LocaleString
  rights?: {
    credit?: string
    copyrightNotice?: string
    year?: number
    usage?: 'allRightsReserved' | 'editorialOnly' | 'licensed' | 'publicDomain'
    licenseDetails?: string
    displayCredit?: boolean
  }
}

/** A `gallery` document, typed for both locales. */
export interface Gallery {
  title: string // D-04: not locale-aware — shared proper noun across fr/en
  slug: string
  statement: LocaleString
  heroColor?: string
  isVisible?: boolean
  publicationStatus?: 'preparation' | 'published' | 'archived'
  showOnHomePage?: boolean
  seo?: SeoSettings
  images: GalleryImage[] // D-09: images[0] is always the cover
}

const PUBLISHED_GALLERY_FILTER = /* groq */ `coalesce(publicationStatus, select(isVisible == false => "preparation", "published")) == "published"`

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery" && ${PUBLISHED_GALLERY_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, heroColor, publicationStatus, "showOnHomePage": coalesce(showOnHomePage, true), "isVisible": coalesce(isVisible, true), seo, images
}`

const GALLERY_BY_SLUG_QUERY = /* groq */ `*[_type == "gallery" && slug.current == $slug && ${PUBLISHED_GALLERY_FILTER}][0]{
  title, "slug": slug.current, statement, heroColor, publicationStatus, "showOnHomePage": coalesce(showOnHomePage, true), "isVisible": coalesce(isVisible, true), seo, images
}`

/**
 * A single édition photo (`leadPhoto` or an `images[]` member). Structurally
 * identical to `GalleryImage` — `sanity/schemas/edition.ts`'s `leadPhoto`
 * and `images[]` array members declare the exact same `alt`/`rights`
 * sub-fields as `gallery.ts` does, so a type alias is sufficient.
 */
export type EditionImage = GalleryImage

/** An `edition` document, typed for both locales. */
export interface Edition {
  title: string // shared proper noun across fr/en, mirrors Gallery['title']
  slug: string
  statement: LocaleString
  leadPhoto: EditionImage // D-04: dedicated cover photo, not images[0]
  images: EditionImage[] // photo shoot of the printed object itself
  pageCount: number
  printRun: number
  dimensions: {width: number; height: number; unit: 'cm' | 'in'}
  publicationStatus?: 'preparation' | 'published' | 'archived'
  // EDN-08: optional, unidirectional cross-link target — dereferenced from
  // the `relatedGallery` reference field (sanity/schemas/edition.ts). Null
  // or absent for editions with no related gallery set (the common case
  // today: every currently-published édition).
  relatedGallery?: { title: string; slug: string } | null
  // NOTE: edition has NO `seo` field/group (confirmed absent from Phase 11's
  // sanity/schemas/edition.ts) — do not add a `seo` field here. Any code
  // reading page metadata for an edition must construct it from
  // `title`/`statement`/`leadPhoto` directly instead.
}

// edition has no `isVisible` field, so the gallery filter's
// coalesce/select(isVisible…) fallback logic does not apply here — the
// simpler, correct filter is just the publicationStatus check.
const PUBLISHED_EDITION_FILTER = /* groq */ `publicationStatus == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
}`

const EDITION_BY_SLUG_QUERY = /* groq */ `*[_type == "edition" && slug.current == $slug && ${PUBLISHED_EDITION_FILTER}][0]{
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
}`

export interface AboutPage {
  biography?: Partial<LocaleString>
  practice?: Partial<LocaleString>
  medium?: Partial<LocaleString>
  image?: SanityImage & {alt?: Partial<LocaleString>}
  exhibitionImage?: SanityImage & {alt?: Partial<LocaleString>}
  seo?: SeoSettings
}

export interface HomePage {
  intro?: Partial<LocaleString>
  seo?: SeoSettings
}

export interface ContactPage {
  intro?: Partial<LocaleString>
  publicEmail?: string
  location?: Partial<LocaleString>
  availability?: Partial<LocaleString>
  professionalLinks?: Array<{
    _key?: string
    label?: Partial<LocaleString>
    url?: string
  }>
  seo?: SeoSettings
}

const HOME_PAGE_QUERY = /* groq */ `*[_id == "homePage"][0]{
  intro,
  seo
}`

const ABOUT_PAGE_QUERY = /* groq */ `*[_id == "aboutPage"][0]{
  biography,
  practice,
  medium,
  image,
  exhibitionImage,
  seo
}`

const CONTACT_PAGE_QUERY = /* groq */ `*[_id == "contactPage"][0]{
  intro,
  publicEmail,
  location,
  availability,
  professionalLinks,
  seo
}`

/**
 * Fetches all published `gallery` documents at build time, in Romane's
 * manually-set drag-reorder order (D-10, via the `orderRank` fractional index
 * maintained by `@sanity/orderable-document-list`).
 */
export async function getGalleries(): Promise<Gallery[]> {
  return (await sanityClient.fetch<Gallery[] | null>(GALLERIES_QUERY)) ?? []
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

/**
 * Fetches all published `edition` documents at build time, in Romane's
 * manually-set drag-reorder order (`orderRank`, mirrors `getGalleries`).
 */
export async function getEditions(): Promise<Edition[]> {
  return (await sanityClient.fetch<Edition[] | null>(EDITIONS_QUERY)) ?? []
}

/**
 * Fetches a single published `edition` document by its slug at build time.
 * Returns `null` if no edition with that slug has been published yet.
 * `slug` is always bound as a GROQ parameter, never string-interpolated
 * (ASVS V5 — mirrors `getGallery`).
 */
export async function getEdition(slug: string): Promise<Edition | null> {
  const result = await sanityClient.fetch<Edition | null>(EDITION_BY_SLUG_QUERY, {slug})
  return result ?? null
}

export async function getAboutPage(): Promise<AboutPage | null> {
  const result = await sanityClient.fetch<AboutPage | null>(ABOUT_PAGE_QUERY)
  return result ?? null
}

export async function getHomePage(): Promise<HomePage | null> {
  const result = await sanityClient.fetch<HomePage | null>(HOME_PAGE_QUERY)
  return result ?? null
}

export async function getContactPage(): Promise<ContactPage | null> {
  const result = await sanityClient.fetch<ContactPage | null>(CONTACT_PAGE_QUERY)
  return result ?? null
}
