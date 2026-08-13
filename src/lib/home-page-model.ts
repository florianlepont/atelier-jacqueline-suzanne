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
    .filter((gallery) => gallery.showOnHomePage !== false && gallery.images.length > 0)
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
