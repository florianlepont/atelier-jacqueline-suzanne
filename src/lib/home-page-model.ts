import type {Gallery, HomePage, SiteSettings} from './sanity'
import {
  blurPlaceholderUrl,
  fullSizeUrl,
  responsiveImageSrcSet,
  responsiveThumbnailSrcSet,
  thumbnailUrl,
} from './image'
import type {Locale} from './site-config'
import {getHeroTextColor, normalizeHeroColor, resolveHomepageIntro, resolveSiteCopy} from './site-config'
import {pickHeroIndex} from './image-orientation'

const JOB_TITLE: Record<Locale, string> = {
  fr: 'Photographe',
  en: 'Photographer',
}

const DEFAULT_SITE_TITLE = 'Atelier Jacqueline Suzanne'

// 260825-hl7 (bug 2): extracted so both buildHomePageModel (below) and
// getHomeGalleryIndex share the exact same predicate — previously this
// filter existed only inline inside buildHomePageModel's own .filter() call,
// with no way for a caller outside this module to ask "would this gallery
// even appear on the homepage?" without duplicating the condition.
export function isHomeVisibleGallery(gallery: Gallery): boolean {
  return gallery.showOnHomePage !== false && gallery.images.length > 0
}

/**
 * The 0-based position `slug` would render at among homepage-visible
 * galleries, in the same order buildHomePageModel produces — the index
 * basis src/lib/page-models.ts's buildGalleryDetailModel needs so a gallery
 * left on "Palette automatique" resolves the SAME automatic accent on its
 * own detail page as it shows on the homepage carousel (260825-hl7 bug 2).
 * Returns -1 when the gallery is absent from the homepage-visible list
 * (showOnHomePage: false, no images, or the slug isn't found at all) —
 * callers must not treat -1 as a valid array index.
 */
export function getHomeGalleryIndex(galleries: Gallery[], slug: string): number {
  const visible = galleries.filter(isHomeVisibleGallery)
  return visible.findIndex((gallery) => gallery.slug === slug)
}

export interface HomePageGalleryModel {
  slug: string
  title: string
  heroSrc: string
  heroSrcSet: string
  gridSrc: string
  gridSrcSet: string
  blurSrc: string
  alt: string
  statement: string
  heroColor?: string
  heroTextColor?: '#1A1A1A' | '#FFFFFF'
}

export interface HomePageStructuredData {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description: string | undefined
  url: string
  inLanguage: Locale
  about: {'@type': 'Person'; name: string; jobTitle: string}
}

export interface HomePageModel {
  siteCopy: ReturnType<typeof resolveSiteCopy> & {homepageIntro: string}
  siteTitle: string
  seoTitle: string
  seoDescription: string | undefined
  seoImage: string | undefined
  noIndex: boolean | undefined
  structuredData: HomePageStructuredData
  galleries: HomePageGalleryModel[]
}

/**
 * Pure fr/en → render-model transform for the homepage. No fetch, no
 * browser import: `pageUrl` (Astro.url.toString(), request-derived) is
 * passed in rather than computed here, so this stays testable with plain
 * fixtures. Every fallback mirrors what src/pages/index.astro and
 * src/pages/en/index.astro computed inline before being unified into
 * src/components/HomePage.astro.
 */
export function buildHomePageModel({
  locale,
  homePage,
  siteSettings,
  galleries,
  pageUrl,
}: {
  locale: Locale
  homePage: HomePage | null
  siteSettings: SiteSettings | null
  galleries: Gallery[]
  pageUrl: string
}): HomePageModel {
  const siteCopy = {
    ...resolveSiteCopy(siteSettings, locale),
    homepageIntro: resolveHomepageIntro(homePage, locale),
  }

  const seoTitle =
    homePage?.seo?.title?.[locale] ?? siteSettings?.defaultSeo?.title?.[locale] ?? DEFAULT_SITE_TITLE
  const seoDescription = homePage?.seo?.description?.[locale] ?? siteSettings?.defaultSeo?.description?.[locale]
  const seoImage = homePage?.seo?.image ? fullSizeUrl(homePage.seo.image, 1200) : undefined

  const structuredData: HomePageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seoTitle,
    description: seoDescription,
    url: pageUrl,
    inLanguage: locale,
    about: {'@type': 'Person', name: 'Romane Lepont', jobTitle: JOB_TITLE[locale]},
  }

  const galleryModels: HomePageGalleryModel[] = galleries
    .filter(isHomeVisibleGallery)
    .map((gallery) => {
      const cover = gallery.images[pickHeroIndex(gallery.images)]
      const heroColor = normalizeHeroColor(gallery.heroColor)
      return {
        slug: gallery.slug,
        title: gallery.title,
        heroSrc: fullSizeUrl(cover),
        heroSrcSet: responsiveImageSrcSet(cover),
        gridSrc: thumbnailUrl(cover, 600),
        gridSrcSet: responsiveThumbnailSrcSet(cover),
        blurSrc: blurPlaceholderUrl(cover),
        // WR-03: alt text is Studio-required (D-02), but a document written
        // outside the Studio's publish-time validation could still be
        // partially populated.
        alt: cover.alt?.[locale] ?? '',
        statement: gallery.statement?.[locale] ?? '',
        heroColor,
        heroTextColor: heroColor ? getHeroTextColor(heroColor) : undefined,
      }
    })

  return {
    siteCopy,
    siteTitle: siteSettings?.siteTitle?.[locale] ?? DEFAULT_SITE_TITLE,
    seoTitle,
    seoDescription,
    seoImage,
    noIndex: homePage?.seo?.noIndex,
    structuredData,
    galleries: galleryModels,
  }
}
