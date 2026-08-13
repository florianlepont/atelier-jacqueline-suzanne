import {createClient} from '@sanity/client'
import {getBuildCached} from './build-cache'
import {
  sanitizeAboutPage,
  sanitizeContactPage,
  sanitizeEdition,
  sanitizeEditions,
  sanitizeEditionsPage,
  sanitizeGalleries,
  sanitizeGallery,
  sanitizeHomePage,
  sanitizeSiteSettings,
  warnForSanityIssues,
  type SanitizationResult,
} from './sanity-validation'

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
  crop?: {top: number; bottom: number; left: number; right: number}
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
  _id,
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
  return fetchSanitized(
    'getSiteSettings',
    null,
    'siteSettings',
    () => sanityClient.fetch<unknown>(SITE_SETTINGS_QUERY),
    sanitizeSiteSettings,
  )
}

/**
 * Real per-image geometry, dereferenced from the Sanity asset's own
 * metadata.dimensions (quick-260724-oep). Used to pick a landscape hero
 * (src/lib/image-orientation.ts) and to size masonry grid tiles
 * (GalleryGrid.astro's aspectRatio item field). Projected by both the
 * gallery AND the edition queries (quick-260801-kgh) — the asset reference
 * shape itself is unchanged, so builder.image(img) in src/lib/image.ts
 * keeps working unmodified.
 */
export interface ImageDimensions {
  width: number
  height: number
  aspectRatio?: number
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
  // Optional because a freshly-uploaded asset can reach the query before
  // Sanity has finished computing its metadata — pickHeroIndex already
  // treats a missing dimensions object as "not landscape" for that case.
  // Both the gallery AND the edition queries project this field now
  // (quick-260801-kgh).
  dimensions?: ImageDimensions
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

// quick-260724-oep, shared with editions since quick-260801-kgh: each image
// is projected as a spread of all its existing fields (asset/hotspot/alt/
// rights preserved exactly, asset reference shape untouched) plus a sibling
// `dimensions` object dereferenced from the asset's own metadata.dimensions
// — real width/height/aspectRatio, used by pickHeroIndex
// (src/lib/image-orientation.ts) and the masonry grid's per-tile
// aspectRatio. Interpolated into all 4 queries below (2 gallery + 2
// edition) — editions need it for the same reason galleries do: pickHeroIndex
// prefers the first landscape photo.
const IMAGES_WITH_DIMENSIONS_PROJECTION = /* groq */ `images[]{
    ...,
    "dimensions": asset->metadata.dimensions
  }`

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery" && ${PUBLISHED_GALLERY_FILTER}] | order(orderRank) {
  _id, title, "slug": slug.current, statement, heroColor, publicationStatus, "showOnHomePage": coalesce(showOnHomePage, true), "isVisible": coalesce(isVisible, true), seo, ${IMAGES_WITH_DIMENSIONS_PROJECTION}
}`

const GALLERY_BY_SLUG_QUERY = /* groq */ `*[_type == "gallery" && slug.current == $slug && ${PUBLISHED_GALLERY_FILTER}][0]{
  _id, title, "slug": slug.current, statement, heroColor, publicationStatus, "showOnHomePage": coalesce(showOnHomePage, true), "isVisible": coalesce(isVisible, true), seo, ${IMAGES_WITH_DIMENSIONS_PROJECTION}
}`

/**
 * A single édition photo (an `images[]` member). A member's shape (`alt`/
 * `rights`) is identical to a `Gallery` image's — `sanity/schemas/edition.ts`
 * declares the exact same sub-fields as `gallery.ts` does — so a type alias
 * is sufficient.
 */
export type EditionImage = GalleryImage

/** An `edition` document, typed for both locales. */
export interface Edition {
  title: string // shared proper noun across fr/en, mirrors Gallery['title']
  slug: string
  statement: LocaleString
  // photo shoot of the printed object itself — images[0] is the cover
  // (quick-260801-kgh, mirrors Gallery['images']); pickHeroIndex
  // (src/lib/image-orientation.ts) prefers the first LANDSCAPE photo when
  // there is one.
  images: EditionImage[]
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
  // `title`/`statement`/the hero photo selected by pickHeroIndex directly
  // instead.
}

// edition has no `isVisible` field, so the gallery filter's
// coalesce/select(isVisible…) fallback logic does not apply here — the
// simpler, correct filter is just the publicationStatus check.
const PUBLISHED_EDITION_FILTER = /* groq */ `publicationStatus == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  _id, title, "slug": slug.current, statement, ${IMAGES_WITH_DIMENSIONS_PROJECTION}, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
}`

const EDITION_BY_SLUG_QUERY = /* groq */ `*[_type == "edition" && slug.current == $slug && ${PUBLISHED_EDITION_FILTER}][0]{
  _id, title, "slug": slug.current, statement, ${IMAGES_WITH_DIMENSIONS_PROJECTION}, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
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

/**
 * The published `editionsPage` singleton, projected intro-only. The Studio
 * schema does expose a `seo` field/group (see sanity/schemas/editionsPage.ts),
 * but the public site doesn't read it yet — the /editions routes still
 * hardcode their own seoTitle/seoDescription — so the projection stays
 * deliberately narrow until that route wiring is a separately-scoped change.
 */
export interface EditionsPage {
  intro?: Partial<LocaleString>
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
  _id,
  intro,
  seo
}`

const EDITIONS_PAGE_QUERY = /* groq */ `*[_id == "editionsPage"][0]{ _id, intro }`

const ABOUT_PAGE_QUERY = /* groq */ `*[_id == "aboutPage"][0]{
  _id,
  biography,
  practice,
  medium,
  image,
  exhibitionImage,
  seo
}`

const CONTACT_PAGE_QUERY = /* groq */ `*[_id == "contactPage"][0]{
  _id,
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
  return fetchSanitized(
    'getGalleries',
    null,
    'gallery',
    () => sanityClient.fetch<unknown>(GALLERIES_QUERY),
    sanitizeGalleries,
  )
}

/**
 * Fetches a single published `gallery` document by its slug at build time.
 * Returns `null` if no gallery with that slug has been published yet
 * (WR-03 null-safety).
 */
export async function getGallery(slug: string): Promise<Gallery | null> {
  return fetchSanitized(
    'getGallery',
    {slug},
    'gallery',
    () => sanityClient.fetch<unknown>(GALLERY_BY_SLUG_QUERY, {slug}),
    sanitizeGallery,
  )
}

/**
 * Fetches all published `edition` documents at build time, in Romane's
 * manually-set drag-reorder order (`orderRank`, mirrors `getGalleries`).
 */
export async function getEditions(): Promise<Edition[]> {
  return fetchSanitized(
    'getEditions',
    null,
    'edition',
    () => sanityClient.fetch<unknown>(EDITIONS_QUERY),
    sanitizeEditions,
  )
}

/**
 * Fetches a single published `edition` document by its slug at build time.
 * Returns `null` if no edition with that slug has been published yet.
 * `slug` is always bound as a GROQ parameter, never string-interpolated
 * (ASVS V5 — mirrors `getGallery`).
 */
export async function getEdition(slug: string): Promise<Edition | null> {
  return fetchSanitized(
    'getEdition',
    {slug},
    'edition',
    () => sanityClient.fetch<unknown>(EDITION_BY_SLUG_QUERY, {slug}),
    sanitizeEdition,
  )
}

export async function getAboutPage(): Promise<AboutPage | null> {
  return fetchSanitized(
    'getAboutPage',
    null,
    'aboutPage',
    () => sanityClient.fetch<unknown>(ABOUT_PAGE_QUERY),
    sanitizeAboutPage,
  )
}

export async function getHomePage(): Promise<HomePage | null> {
  return fetchSanitized(
    'getHomePage',
    null,
    'homePage',
    () => sanityClient.fetch<unknown>(HOME_PAGE_QUERY),
    sanitizeHomePage,
  )
}

export async function getEditionsPage(): Promise<EditionsPage | null> {
  return fetchSanitized(
    'getEditionsPage',
    null,
    'editionsPage',
    () => sanityClient.fetch<unknown>(EDITIONS_PAGE_QUERY),
    sanitizeEditionsPage,
  )
}

export async function getContactPage(): Promise<ContactPage | null> {
  return fetchSanitized(
    'getContactPage',
    null,
    'contactPage',
    () => sanityClient.fetch<unknown>(CONTACT_PAGE_QUERY),
    sanitizeContactPage,
  )
}

function fetchSanitized<T>(
  getterName: string,
  parameters: unknown,
  documentType: string,
  fetchValue: () => Promise<unknown>,
  sanitize: (value: unknown) => SanitizationResult<T>,
): Promise<T> {
  return getBuildCached(getterName, parameters, async () => {
    const result = sanitize(await fetchValue())
    if (result.issues.length > 0) warnForSanityIssues(documentType, result.issues)
    return result.value
  })
}
